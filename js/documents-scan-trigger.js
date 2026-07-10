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

  function finishPoll(entry, result) {
    if (!entry || entry.finished) return;
    entry.finished = true;
    if (entry.timer) window.clearTimeout(entry.timer);
    delete polls[entry.requestId];
    if (typeof entry.onComplete === 'function') entry.onComplete(result);
    entry.resolve(result);
  }

  function pollDocumentScanRequest(requestId, options) {
    options = options || {};
    if (!requestId) return Promise.resolve({ ok: false, error: 'request_not_found' });
    if (polls[requestId]) return polls[requestId].promise;

    var entry = {
      requestId: requestId,
      startedAt: Date.now(),
      timer: null,
      finished: false,
      onUpdate: options.onUpdate,
      onComplete: options.onComplete,
      resolve: null,
      promise: null,
    };
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
        if (typeof entry.onUpdate === 'function') entry.onUpdate(request);
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

  function cancelOnRouteChange() {
    if (window.location && window.location.hash !== '#/documentos/recebidos') cancelDocumentScanPolling();
  }

  if (typeof window.addEventListener === 'function') {
    window.addEventListener('hashchange', cancelOnRouteChange);
  }

  window.RAVATEX_DOCUMENTS = window.RAVATEX_DOCUMENTS || {};
  window.RAVATEX_DOCUMENTS.requestDocumentScan = requestDocumentScan;
  window.RAVATEX_DOCUMENTS.getDocumentScanRequestStatus = getDocumentScanRequestStatus;
  window.RAVATEX_DOCUMENTS.pollDocumentScanRequest = pollDocumentScanRequest;
  window.RAVATEX_DOCUMENTS.cancelDocumentScanPolling = cancelDocumentScanPolling;
})(window);
