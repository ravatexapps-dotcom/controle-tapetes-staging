// =====================================================================
// === DOCUMENTS: SCAN REQUEST TRIGGER =================================
// Request and polling client for the document scan queue. This module
// uses the authenticated browser client only; execution stays with the
// server-side watcher.
// =====================================================================

(function (window) {
  'use strict';

  var POLL_INTERVAL_MS = 5000;
  var POLL_TIMEOUT_MS = 10 * 60 * 1000;
  var REQUEST_FIELDS = 'id,source,status,scan_run_id,requested_at,claimed_at,started_at,finished_at,error_message';
  var ACTIVE_STATUSES = { requested: true, claimed: true, running: true };
  var TERMINAL_STATUSES = { completed: true, failed: true, cancelled: true };
  var polls = {};
  var requestInFlight = null;
  var bootstrapFallback = {};

  function isAdmin() {
    return !!(window.CURRENT_USER && window.CURRENT_USER.tipo === 'admin');
  }

  function controlledError(error) {
    var raw = String(error && (error.message || error.details || error.code) || error || '').toLowerCase();
    if (!isAdmin() || raw.indexOf('jwt') >= 0 || raw.indexOf('session') >= 0 || raw.indexOf('not authenticated') >= 0) {
      return 'session_expired';
    }
    if (raw.indexOf('admin_required') >= 0 || raw.indexOf('permission denied') >= 0) return 'admin_required';
    if (raw.indexOf('solicitar_document_scan') >= 0 || raw.indexOf('document_scan_requests') >= 0
        || raw.indexOf('does not exist') >= 0 || raw.indexOf('pgrst202') >= 0 || raw.indexOf('42p01') >= 0) {
      return 'migration_unavailable';
    }
    return 'executor_unavailable';
  }

  function normalizeRpcPayload(data) {
    return Array.isArray(data) ? (data[0] || {}) : (data || {});
  }

  function publicRequest(request) {
    return {
      id: request.id,
      source: request.source,
      status: request.status,
      scan_run_id: request.scan_run_id || null,
      requested_at: request.requested_at || null,
      claimed_at: request.claimed_at || null,
      started_at: request.started_at || null,
      finished_at: request.finished_at || null,
    };
  }

  function getDocumentScanRequestStatus(requestId) {
    if (!requestId) return Promise.resolve({ ok: false, error: 'request_not_found' });
    if (!isAdmin() || !window.supa || typeof window.supa.from !== 'function') {
      return Promise.resolve({ ok: false, error: isAdmin() ? 'executor_unavailable' : 'session_expired' });
    }

    try {
      return window.supa.from('document_scan_requests')
        .select(REQUEST_FIELDS)
        .eq('id', requestId)
        .single()
        .then(function (result) {
          if (!result || result.error) return { ok: false, error: controlledError(result && result.error) };
          if (!result.data) return { ok: false, error: 'request_not_found' };
          return { ok: true, request: result.data };
        })
        .catch(function (error) { return { ok: false, error: controlledError(error) }; });
    } catch (error) {
      return Promise.resolve({ ok: false, error: controlledError(error) });
    }
  }

  // Hidratacao (G24-B5): leitura pura da request ativa por source, sem criar
  // nada. NAO chama solicitar_document_scan e NAO cria document_scan_run — a
  // tela usa isso para retomar o acompanhamento apos abrir/recarregar. Devolve
  // { ok:true, request:null } quando nao ha request ativa.
  function getActiveDocumentScanRequest(source) {
    var src = source || 'gmail';
    if (!isAdmin() || !window.supa || typeof window.supa.from !== 'function') {
      return Promise.resolve({ ok: false, error: isAdmin() ? 'executor_unavailable' : 'session_expired' });
    }

    try {
      return window.supa.from('document_scan_requests')
        .select(REQUEST_FIELDS)
        .eq('source', src)
        .in('status', ['requested', 'claimed', 'running'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .then(function (result) {
          if (!result || result.error) return { ok: false, error: controlledError(result && result.error) };
          var rows = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);
          if (!rows.length) return { ok: true, request: null };
          return { ok: true, request: rows[0] };
        })
        .catch(function (error) { return { ok: false, error: controlledError(error) }; });
    } catch (error) {
      return Promise.resolve({ ok: false, error: controlledError(error) });
    }
  }

  function finishPoll(entry, result) {
    if (!entry || entry.finished) return;
    entry.finished = true;
    if (entry.timer) window.clearTimeout(entry.timer);
    delete polls[entry.requestId];
    entry.listeners.forEach(function (listener) {
      if (typeof listener.onComplete === 'function') listener.onComplete(result);
    });
    entry.resolve(result);
  }

  function addPollListener(entry, options) {
    if (!entry || !options) return;
    if (typeof options.onUpdate !== 'function' && typeof options.onComplete !== 'function') return;
    entry.listeners.push({ onUpdate: options.onUpdate, onComplete: options.onComplete });
  }

  function pollDocumentScanRequest(requestId, options) {
    options = options || {};
    if (!requestId) return Promise.resolve({ ok: false, error: 'request_not_found' });
    if (polls[requestId]) {
      addPollListener(polls[requestId], options);
      return polls[requestId].promise;
    }

    var entry = {
      requestId: requestId,
      startedAt: Date.now(),
      timer: null,
      finished: false,
      listeners: [],
      resolve: null,
      promise: null,
    };
    addPollListener(entry, options);
    entry.promise = new Promise(function (resolve) { entry.resolve = resolve; });
    polls[requestId] = entry;

    function tick() {
      if (entry.finished) return;
      if (!isAdmin()) {
        finishPoll(entry, { ok: false, error: 'session_expired', requestId: requestId });
        return;
      }
      if (Date.now() - entry.startedAt >= POLL_TIMEOUT_MS) {
        finishPoll(entry, { ok: false, error: 'timeout', requestId: requestId });
        return;
      }

      getDocumentScanRequestStatus(requestId).then(function (result) {
        if (entry.finished) return;
        if (!result.ok) {
          finishPoll(entry, { ok: false, error: result.error, requestId: requestId });
          return;
        }
        var request = result.request;
        entry.listeners.forEach(function (listener) {
          if (typeof listener.onUpdate === 'function') listener.onUpdate(request);
        });
        if (TERMINAL_STATUSES[request.status]) {
          finishPoll(entry, {
            ok: request.status === 'completed',
            status: request.status,
            request: publicRequest(request),
            requestId: requestId,
            error: request.status === 'failed' ? 'request_failed' : null,
          });
          return;
        }
        if (!ACTIVE_STATUSES[request.status]) {
          finishPoll(entry, { ok: false, error: 'executor_unavailable', requestId: requestId });
          return;
        }
        entry.timer = window.setTimeout(tick, POLL_INTERVAL_MS);
      });
    }

    tick();
    return entry.promise;
  }

  function cancelDocumentScanPolling(requestId) {
    var ids = requestId ? [requestId] : Object.keys(polls);
    ids.forEach(function (id) {
      var entry = polls[id];
      if (entry) finishPoll(entry, { ok: false, error: 'cancelled', requestId: id });
    });
  }

  function requestDocumentScan(options) {
    options = options || {};
    if (requestInFlight) return requestInFlight;
    if (!isAdmin()) return Promise.resolve({ ok: false, error: 'admin_required' });
    if (!window.supa || typeof window.supa.rpc !== 'function') {
      return Promise.resolve({ ok: false, error: 'executor_unavailable' });
    }

    requestInFlight = Promise.resolve().then(function () {
      return window.supa.rpc('solicitar_document_scan', { p_source: 'gmail' });
    }).then(function (result) {
      if (!result || result.error) return { ok: false, error: controlledError(result && result.error) };
      var payload = normalizeRpcPayload(result.data);
      if (!payload.ok) return { ok: false, error: payload.error === 'admin_required' ? 'admin_required' : 'executor_unavailable' };
      if (!payload.request_id) return { ok: false, error: 'executor_unavailable' };
      if (typeof options.onUpdate === 'function') {
        options.onUpdate({ id: payload.request_id, source: payload.source || 'gmail', status: payload.status || 'requested' });
      }
      return pollDocumentScanRequest(payload.request_id, options).then(function (pollResult) {
        pollResult.reused = payload.reused === true;
        return pollResult;
      });
    }).catch(function (error) {
      return { ok: false, error: controlledError(error) };
    }).then(function (result) {
      requestInFlight = null;
      return result;
    });

    return requestInFlight;
  }

  function bootstrapStorageKey() {
    var user = window.CURRENT_USER || {};
    return 'ravatex.documentScan.bootstrap.v1.' + String(user.id || user.email || 'admin');
  }

  function wasBootstrapped(key) {
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(key) === '1') return true;
    } catch (error) {
      // Privacy modes can deny storage; the per-page fallback still prevents
      // route/rerender duplication without blocking the application.
    }
    return bootstrapFallback[key] === true;
  }

  function markBootstrapped(key) {
    bootstrapFallback[key] = true;
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(key, '1');
    } catch (error) {
      // The in-memory fallback above is sufficient for this page lifetime.
    }
  }

  function renderBootstrapFailure(errorCode) {
    if (!window.document || !window.document.createElement || !window.document.body) return;
    var id = 'ravatex-document-scan-bootstrap-status';
    var node = window.document.getElementById ? window.document.getElementById(id) : null;
    if (!node) {
      node = window.document.createElement('div');
      node.id = id;
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      node.style.cssText = 'margin:8px 16px;color:#b42318;font-size:13px;';
      window.document.body.appendChild(node);
    }
    node.textContent = errorCode === 'session_expired'
      ? 'A verificacao automatica de documentos nao foi iniciada: sessao expirada.'
      : 'A verificacao automatica de documentos nao foi iniciada. Use o botao de verificacao como alternativa.';
  }

  // Canonical entry hook: called once after the authenticated admin bootstrap.
  // It is deliberately independent of a screen render and always reads the
  // active request before it can call the creation RPC.
  function autoStartDocumentScanOnAdminBootstrap() {
    if (!isAdmin()) return Promise.resolve({ ok: true, skipped: 'not_admin' });
    var key = bootstrapStorageKey();
    if (wasBootstrapped(key)) return Promise.resolve({ ok: true, skipped: 'already_bootstrapped' });
    markBootstrapped(key);

    return getActiveDocumentScanRequest('gmail').then(function (active) {
      if (!active || !active.ok) {
        var activeError = active && active.error ? active.error : 'executor_unavailable';
        renderBootstrapFailure(activeError);
        return { ok: false, error: activeError };
      }
      if (active.request) {
        return pollDocumentScanRequest(active.request.id).then(function (result) {
          if (!result.ok && result.error) renderBootstrapFailure(result.error);
          return result;
        });
      }
      return requestDocumentScan().then(function (result) {
        if (!result.ok && result.error) renderBootstrapFailure(result.error);
        return result;
      });
    }).catch(function (error) {
      var code = controlledError(error);
      renderBootstrapFailure(code);
      return { ok: false, error: code };
    });
  }

  function cancelOnRouteChange() {
    if (window.location && window.location.hash !== '#/documentos/recebidos') cancelDocumentScanPolling();
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('hashchange', cancelOnRouteChange);
  }

  window.RAVATEX_DOCUMENTS = window.RAVATEX_DOCUMENTS || {};
  window.RAVATEX_DOCUMENTS.requestDocumentScan = requestDocumentScan;
  window.RAVATEX_DOCUMENTS.getDocumentScanRequestStatus = getDocumentScanRequestStatus;
  window.RAVATEX_DOCUMENTS.getActiveDocumentScanRequest = getActiveDocumentScanRequest;
  window.RAVATEX_DOCUMENTS.pollDocumentScanRequest = pollDocumentScanRequest;
  window.RAVATEX_DOCUMENTS.cancelDocumentScanPolling = cancelDocumentScanPolling;
  window.RAVATEX_DOCUMENTS.autoStartDocumentScanOnAdminBootstrap = autoStartDocumentScanOnAdminBootstrap;
})(window);
