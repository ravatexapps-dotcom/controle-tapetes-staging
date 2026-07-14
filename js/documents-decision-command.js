(function (window) {
  'use strict';

  var ns = window.RAVATEX_DOCUMENTS || {};

  var STORAGE_KEY = 'RAVATEX_DOCUMENT_DECISION_PENDING_V1';
  var DEFAULT_TTL_MS = 86400000;
  var ENVELOPE_VERSION = 1;
  var VALID_DECISIONS = { accepted: true, rejected: true };
  var VALID_STATES = { prepared: true, submitting: true, uncertain: true, stale: true };
  var UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  function isValidExpectedActiveDecisionId(v) {
    if (v === null || v === void 0) return v === null;
    if (typeof v !== 'string') return false;
    return UUID_PATTERN.test(v);
  }

  function generateUUID(crypto) {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    if (typeof crypto.getRandomValues === 'function') {
      var buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      buf[6] = (buf[6] & 0x0f) | 0x40;
      buf[8] = (buf[8] & 0x3f) | 0x80;
      var hex = '';
      for (var i = 0; i < 16; i++) {
        var s = buf[i].toString(16);
        hex += s.length === 1 ? '0' + s : s;
      }
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }
    return null;
  }

  function getStorage(options) {
    if (options && options.storage) return options.storage;
    try {
      return window.sessionStorage;
    } catch (_) {
      return {
        getItem: function () { throw new Error('storage_unavailable'); },
        setItem: function () { throw new Error('storage_unavailable'); },
        removeItem: function () { throw new Error('storage_unavailable'); },
      };
    }
  }

  function getCrypto(options) {
    return (options && options.crypto) || window.crypto;
  }

  function getNow(options) {
    return (options && typeof options.now === 'function') ? options.now() : Date.now();
  }

  function getTTL(options) {
    return (options && typeof options.ttlMs === 'number') ? options.ttlMs : DEFAULT_TTL_MS;
  }

  function defensiveCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function safeGetItem(storage, key) {
    try {
      return storage.getItem(key);
    } catch (_) {
      return { error: true };
    }
  }

  function safeSetItem(storage, key, value) {
    try {
      storage.setItem(key, value);
      return { ok: true };
    } catch (_) {
      return { ok: false, error: 'storage_unavailable' };
    }
  }

  function safeRemoveItem(storage, key) {
    try {
      storage.removeItem(key);
      return { ok: true };
    } catch (_) {
      return { ok: false, error: 'storage_unavailable' };
    }
  }

  function readPending(options) {
    var storage = getStorage(options);

    function clean(error) {
      var rm = safeRemoveItem(storage, STORAGE_KEY);
      if (!rm.ok) return rm;
      return { ok: false, error: error };
    }

    var raw = safeGetItem(storage, STORAGE_KEY);
    if (raw && raw.error) return { ok: false, error: 'storage_unavailable' };
    if (raw === null || raw === undefined) return { ok: false, error: 'no_pending_command' };

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      return clean('invalid_storage_payload');
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return clean('invalid_storage_payload');
    }

    if (parsed.version === undefined || parsed.version !== ENVELOPE_VERSION) {
      return clean('unsupported_version');
    }

    var requiredFields = ['version', 'commandId', 'documentId', 'decision', 'motivo', 'expectedActiveDecisionId', 'state', 'createdAt', 'expiresAt'];
    for (var fi = 0; fi < requiredFields.length; fi++) {
      if (!(requiredFields[fi] in parsed)) {
        return clean('invalid_storage_payload');
      }
    }

    if (typeof parsed.commandId !== 'string' || !UUID_PATTERN.test(parsed.commandId)) {
      return clean('invalid_storage_payload');
    }

    if (typeof parsed.documentId !== 'string' || parsed.documentId.trim().length === 0) {
      return clean('invalid_storage_payload');
    }

    if (parsed.decision !== 'accepted' && parsed.decision !== 'rejected') {
      return clean('invalid_storage_payload');
    }

    if (parsed.decision === 'accepted') {
      if (parsed.motivo !== null) {
        return clean('invalid_storage_payload');
      }
    } else {
      if (typeof parsed.motivo !== 'string' || parsed.motivo.trim().length === 0) {
        return clean('invalid_storage_payload');
      }
    }

    if (parsed.expectedActiveDecisionId !== null && (typeof parsed.expectedActiveDecisionId !== 'string' || !UUID_PATTERN.test(parsed.expectedActiveDecisionId))) {
      return clean('invalid_storage_payload');
    }

    if (!VALID_STATES[parsed.state]) {
      return clean('invalid_storage_payload');
    }

    if (typeof parsed.createdAt !== 'number' || !isFinite(parsed.createdAt) ||
        typeof parsed.expiresAt !== 'number' || !isFinite(parsed.expiresAt)) {
      return clean('invalid_storage_payload');
    }

    if (parsed.expiresAt <= parsed.createdAt) {
      return clean('invalid_storage_payload');
    }

    var now = getNow(options);
    if (now >= parsed.expiresAt) {
      return clean('expired');
    }

    return { ok: true, envelope: defensiveCopy(parsed) };
  }

  function writePending(envelope, options) {
    var storage = getStorage(options);
    var result = safeSetItem(storage, STORAGE_KEY, JSON.stringify(envelope));
    if (!result.ok) return result;
    return { ok: true };
  }

  function removePending(options) {
    var storage = getStorage(options);
    return safeRemoveItem(storage, STORAGE_KEY);
  }

  function validateInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return { ok: false, error: 'invalid_input' };
    }
    var documentId = typeof input.documentId === 'string' ? input.documentId.trim() : '';
    if (!documentId) {
      return { ok: false, error: 'invalid_document_id' };
    }
    if (input.decision !== 'accepted' && input.decision !== 'rejected') {
      return { ok: false, error: 'invalid_decision' };
    }
    var motivo = typeof input.motivo === 'string' ? input.motivo.trim() : '';
    if (input.decision === 'rejected') {
      if (!motivo) return { ok: false, error: 'motivo_required' };
    } else {
      motivo = null;
    }
    var expectedActiveDecisionId = null;
    if ('expectedActiveDecisionId' in input) {
      if (!isValidExpectedActiveDecisionId(input.expectedActiveDecisionId)) {
        return { ok: false, error: 'invalid_expected_active_decision_id' };
      }
      expectedActiveDecisionId = input.expectedActiveDecisionId;
    }
    return {
      ok: true,
      documentId: documentId,
      decision: input.decision,
      motivo: motivo,
      expectedActiveDecisionId: expectedActiveDecisionId,
    };
  }

  function transitionState(commandId, fromStates, toState, options) {
    var readR = readPending(options);
    if (!readR.ok) return { ok: false, error: readR.error };
    var env = readR.envelope;
    if (env.commandId !== commandId) return { ok: false, error: 'command_id_mismatch' };
    if (!fromStates[env.state]) return { ok: false, error: 'invalid_transition' };
    env.state = toState;
    var writeR = writePending(env, options);
    if (!writeR.ok) return writeR;
    return { ok: true, envelope: defensiveCopy(env) };
  }

  ns.documentDecisionCommand = {

    prepareCommand: function prepareCommand(input, options) {
      options = options || {};
      var validation = validateInput(input);
      if (!validation.ok) return validation;

      var pending = readPending(options);
      if (pending.ok) {
        if (VALID_STATES[pending.envelope.state]) {
          return { ok: false, error: 'pending_command_exists' };
        }
      } else if (pending.error !== 'no_pending_command' && pending.error !== 'expired' &&
                 pending.error !== 'invalid_storage_payload' && pending.error !== 'unsupported_version') {
        return pending;
      }

      var crypto = getCrypto(options);
      if (!crypto || (typeof crypto.randomUUID !== 'function' && typeof crypto.getRandomValues !== 'function')) {
        return { ok: false, error: 'crypto_unavailable' };
      }

      var commandId = generateUUID(crypto);
      if (!commandId) return { ok: false, error: 'crypto_unavailable' };

      var now = getNow(options);
      var ttl = getTTL(options);
      var envelope = {
        version: ENVELOPE_VERSION,
        commandId: commandId,
        documentId: validation.documentId,
        decision: validation.decision,
        motivo: validation.motivo,
        expectedActiveDecisionId: validation.expectedActiveDecisionId,
        state: 'prepared',
        createdAt: now,
        expiresAt: now + ttl,
      };

      var writeR = writePending(envelope, options);
      if (!writeR.ok) return writeR;

      return { ok: true, commandId: commandId, envelope: defensiveCopy(envelope) };
    },

    getPendingCommand: function getPendingCommand(options) {
      return readPending(options || {});
    },

    markSubmitting: function markSubmitting(commandId, options) {
      return transitionState(commandId, { prepared: true, uncertain: true }, 'submitting', options || {});
    },

    markUncertain: function markUncertain(commandId, options) {
      return transitionState(commandId, { submitting: true }, 'uncertain', options || {});
    },

    markStale: function markStale(commandId, options) {
      options = options || {};
      var readR = readPending(options);
      if (!readR.ok) return { ok: false, error: readR.error };
      var env = readR.envelope;
      if (env.commandId !== commandId) return { ok: false, error: 'command_id_mismatch' };
      env.state = 'stale';
      var writeR = writePending(env, options);
      if (!writeR.ok) return writeR;
      return { ok: true, envelope: defensiveCopy(env) };
    },

    resolveCommand: function resolveCommand(commandId, options) {
      options = options || {};
      var readR = readPending(options);
      if (!readR.ok) return { ok: false, error: readR.error };
      if (readR.envelope.commandId !== commandId) return { ok: false, error: 'command_id_mismatch' };
      return removePending(options);
    },

    discardBeforeSend: function discardBeforeSend(commandId, options) {
      options = options || {};
      var readR = readPending(options);
      if (!readR.ok) return { ok: false, error: readR.error };
      var env = readR.envelope;
      if (env.commandId !== commandId) return { ok: false, error: 'command_id_mismatch' };
      if (env.state !== 'prepared') return { ok: false, error: 'invalid_transition' };
      return removePending(options);
    },

    clearPendingCommand: function clearPendingCommand(options) {
      return removePending(options || {});
    },

    expirePendingCommand: function expirePendingCommand(now, options) {
      options = options || {};
      if (typeof now !== 'number') now = getNow(options);
      var readOptions = Object.assign({}, options, { now: function () { return now; } });
      var readR = readPending(readOptions);
      if (!readR.ok) {
        if (readR.error === 'no_pending_command' || readR.error === 'invalid_storage_payload' ||
            readR.error === 'unsupported_version') {
          return { ok: true, outcome: 'no_pending' };
        }
        if (readR.error === 'expired') {
          return { ok: true, action: 'expired' };
        }
        return readR;
      }
      return { ok: true, action: 'valid' };
    },

    reconcilePendingCommand: function reconcilePendingCommand(activeDecision, options) {
      options = options || {};
      var readR = readPending(options);
      if (!readR.ok) {
        if (readR.error === 'no_pending_command' || readR.error === 'expired' ||
            readR.error === 'invalid_storage_payload' || readR.error === 'unsupported_version') {
          return { ok: true, outcome: 'no_pending' };
        }
        return readR;
      }

      var pending = readR.envelope;

      if (activeDecision && typeof activeDecision === 'object') {
        if (activeDecision.command_id === pending.commandId) {
          var removeR = removePending(options);
          if (!removeR.ok) return removeR;
          return { ok: true, outcome: 'confirmed' };
        }
        pending.state = 'stale';
        var writeR = writePending(pending, options);
        if (!writeR.ok) return writeR;
        return { ok: true, outcome: 'stale' };
      }

      if (pending.state === 'uncertain' || pending.state === 'submitting') {
        return { ok: true, outcome: 'retry_available' };
      }

      return { ok: true, outcome: pending.state };
    },
  };

  window.RAVATEX_DOCUMENTS = ns;
})(window);
