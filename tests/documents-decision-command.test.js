const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const ROOT = path.resolve(__dirname, '..');
const SRC_PATH = path.join(ROOT, 'js', 'documents-decision-command.js');

function createFakeStorage() {
  var store = {};
  return {
    getItem: function (k) { return store.hasOwnProperty(k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); },
    removeItem: function (k) { delete store[k]; },
    _store: store,
  };
}

function createCryptoRandomUUID() {
  var counter = 0;
  return {
    randomUUID: function () {
      counter++;
      var hex = '00000000-0000-4000-8000-00000000' + String(counter).padStart(4, '0');
      return hex.slice(0, 36);
    },
  };
}

function createCryptoGetRandomValues() {
  return {
    getRandomValues: function (arr) {
      for (var i = 0; i < arr.length; i++) {
        arr[i] = (i * 17 + 42) & 0xff;
      }
      return arr;
    },
  };
}

function createCryptoEmpty() {
  return {};
}

function uuidV4Regex() {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
}

var moduleLoaded = false;

before(function () {
  globalThis.window = globalThis.window || {};
  globalThis.window.RAVATEX_DOCUMENTS = globalThis.window.RAVATEX_DOCUMENTS || {};
  if (!moduleLoaded) {
    require(SRC_PATH);
    moduleLoaded = true;
  }
});

function createAPI() {
  return globalThis.window.RAVATEX_DOCUMENTS.documentDecisionCommand;
}

var STORAGE_KEY = 'RAVATEX_DOCUMENT_DECISION_PENDING_V1';

describe('documentDecisionCommand API surface', function () {
  test('exposes documentDecisionCommand on RAVATEX_DOCUMENTS', function () {
    var api = createAPI();
    assert.ok(api);
    assert.equal(typeof api, 'object');
  });

  test('exposes all required methods', function () {
    var api = createAPI();
    var methods = [
      'prepareCommand', 'getPendingCommand', 'markSubmitting',
      'markUncertain', 'markStale', 'resolveCommand',
      'discardBeforeSend', 'clearPendingCommand', 'expirePendingCommand',
      'reconcilePendingCommand',
    ];
    for (var i = 0; i < methods.length; i++) {
      assert.equal(typeof api[methods[i]], 'function', methods[i] + ' deve ser funcao');
    }
  });
});

describe('prepareCommand', function () {
  test('valid accepted input returns ok with envelope', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: '  DOC-123  ', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return 1000; } }
    );
    assert.equal(r.ok, true);
    assert.equal(typeof r.commandId, 'string');
    assert.equal(typeof r.envelope, 'object');
    assert.equal(r.envelope.version, 1);
    assert.equal(r.envelope.documentId, 'DOC-123');
    assert.equal(r.envelope.decision, 'accepted');
    assert.equal(r.envelope.motivo, null);
    assert.equal(r.envelope.state, 'prepared');
    assert.equal(r.envelope.createdAt, 1000);
    assert.equal(r.envelope.expiresAt, 1000 + 86400000);
  });

  test('valid rejected input with motivo returns ok', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-456', decision: 'rejected', motivo: '  Documento ilegivel  ', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return 2000; } }
    );
    assert.equal(r.ok, true);
    assert.equal(r.envelope.decision, 'rejected');
    assert.equal(r.envelope.motivo, 'Documento ilegivel');
    assert.equal(r.envelope.createdAt, 2000);
  });

  test('accepted normalizes motivo to null even if provided', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', motivo: '  some reason  ' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, true);
    assert.equal(r.envelope.motivo, null);
  });

  test('rejected without motivo returns motivo_required', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'rejected', motivo: '' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'motivo_required');
  });

  test('rejected with whitespace-only motivo returns motivo_required', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'rejected', motivo: '   ' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'motivo_required');
  });

  test('invalid decision returns invalid_decision', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'maybe' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_decision');
  });

  test('empty documentId returns invalid_document_id', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: '', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_document_id');
  });

  test('whitespace-only documentId returns invalid_document_id', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: '   ', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_document_id');
  });

  test('null input returns invalid_input', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(null, { storage: storage, crypto: crypto });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_input');
  });

  test('undefined input returns invalid_input', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(undefined, { storage: storage, crypto: crypto });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_input');
  });

  test('non-object input returns invalid_input', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand('string', { storage: storage, crypto: crypto });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_input');
  });

  describe('expectedActiveDecisionId validation', function () {
    test('null is valid', function () {
      var api = createAPI();
      var storage = createFakeStorage();
      var crypto = createCryptoRandomUUID();
      var r = api.prepareCommand(
        { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
        { storage: storage, crypto: crypto }
      );
      assert.equal(r.ok, true);
      assert.equal(r.envelope.expectedActiveDecisionId, null);
    });

    test('valid UUID is accepted', function () {
      var api = createAPI();
      var storage = createFakeStorage();
      var crypto = createCryptoRandomUUID();
      var r = api.prepareCommand(
        { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: '550e8400-e29b-41d4-a716-446655440000' },
        { storage: storage, crypto: crypto }
      );
      assert.equal(r.ok, true);
      assert.equal(r.envelope.expectedActiveDecisionId, '550e8400-e29b-41d4-a716-446655440000');
    });

    var falsyInvalid = [
      { label: 'undefined', value: undefined },
      { label: 'empty string', value: '' },
      { label: 'whitespace', value: '   ' },
      { label: 'false', value: false },
      { label: 'number', value: 123 },
      { label: 'object', value: {} },
      { label: 'array', value: [] },
      { label: 'malformed UUID', value: 'not-a-uuid' },
    ];

    for (var fi = 0; fi < falsyInvalid.length; fi++) {
      (function (entry) {
        test(entry.label + ' returns invalid_expected_active_decision_id', function () {
          var api = createAPI();
          var storage = createFakeStorage();
          var crypto = createCryptoRandomUUID();
          var r = api.prepareCommand(
            { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: entry.value },
            { storage: storage, crypto: crypto }
          );
          assert.equal(r.ok, false);
          assert.equal(r.error, 'invalid_expected_active_decision_id');
        });
      })(falsyInvalid[fi]);
    }
  });

  test('blocks existing pending nonterminal command', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r1 = api.prepareCommand(
      { documentId: 'DOC-1', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r1.ok, true);
    var r2 = api.prepareCommand(
      { documentId: 'DOC-2', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r2.ok, false);
    assert.equal(r2.error, 'pending_command_exists');
  });

  test('returns defensive copy; caller mutation does not affect stored', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var base = Date.now();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; } }
    );
    assert.equal(r.ok, true);
    r.envelope.documentId = 'MUTATED';
    r.envelope.state = 'mutated';
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, true);
    assert.equal(getR.envelope.documentId, 'DOC-X');
    assert.equal(getR.envelope.state, 'prepared');
  });

  test('does not mutate caller input object', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var input = { documentId: 'DOC-9', decision: 'accepted' };
    var inputKeys = Object.keys(input);
    var r = api.prepareCommand(input, { storage: storage, crypto: crypto });
    assert.equal(r.ok, true);
    var afterKeys = Object.keys(input);
    assert.deepEqual(afterKeys, inputKeys);
    assert.equal(input.expectedActiveDecisionId, undefined);
  });

  test('stale command blocks new prepare with pending_command_exists', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r1 = api.prepareCommand(
      { documentId: 'DOC-1', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r1.ok, true);
    api.markStale(r1.commandId, { storage: storage });
    var r2 = api.prepareCommand(
      { documentId: 'DOC-2', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r2.ok, false);
    assert.equal(r2.error, 'pending_command_exists');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, true);
    assert.equal(getR.envelope.state, 'stale');
  });
});

describe('UUID generation', function () {
  test('prefers crypto.randomUUID when available', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, true);
    assert.equal(r.commandId.indexOf('00000000-0000-4000-8000-000000000001'), 0);
    assert.equal(r.envelope.commandId, r.commandId);
  });

  test('falls back to crypto.getRandomValues producing valid UUID v4', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoGetRandomValues();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, true);
    assert.ok(uuidV4Regex().test(r.commandId), r.commandId + ' deve ser UUID v4 valido');
  });

  test('no crypto available returns crypto_unavailable', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoEmpty();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'crypto_unavailable');
  });
});

describe('getPendingCommand', function () {
  test('returns no_pending_command when nothing stored', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'no_pending_command');
  });

  test('reads a stored command', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var base = Date.now();
    var prepR = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; } }
    );
    assert.equal(prepR.ok, true);
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, true);
    assert.deepEqual(getR.envelope, prepR.envelope);
  });

  test('corrupted JSON returns invalid_storage_payload and clears storage', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, '{corrupted');
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('invalid schema (non-object) returns invalid_storage_payload', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, '"just a string"');
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
  });

  test('unsupported version returns unsupported_version and clears storage', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 99, commandId: 'x', documentId: 'x', decision: 'accepted',
      motivo: null, expectedActiveDecisionId: null, state: 'prepared',
      createdAt: 100, expiresAt: Date.now() + 999999,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'unsupported_version');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('expired envelope returns expired and clears storage', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 1000; }, ttlMs: 100 }
    );
    assert.equal(prepR.ok, true);
    var now = 2000;
    var r = api.getPendingCommand({ storage: storage, now: function () { return now; } });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'expired');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('returns defensive copy', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    var r = api.getPendingCommand({ storage: storage });
    r.envelope.documentId = 'MUTATED';
    var r2 = api.getPendingCommand({ storage: storage });
    assert.equal(r2.envelope.documentId, 'DOC-X');
  });

  test('storage_unavailable on storage error', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.getItem = function () { throw new Error('storage fail'); };
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'storage_unavailable');
  });
});

describe('state transitions', function () {
  function prep(api, storage, crypto, nowVal) {
    var base = nowVal || Date.now();
    return api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; } }
    );
  }

  test('prepared -> submitting', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    var r = api.markSubmitting(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.envelope.state, 'submitting');
    assert.equal(r.envelope.commandId, prepR.commandId);
    assert.equal(r.envelope.documentId, 'DOC-X');
  });

  test('uncertain -> submitting', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markUncertain(prepR.commandId, { storage: storage });
    var r = api.markSubmitting(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.envelope.state, 'submitting');
  });

  test('submitting -> uncertain', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markSubmitting(prepR.commandId, { storage: storage });
    var r = api.markUncertain(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.envelope.state, 'uncertain');
  });

  test('stale cannot become submitting', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markStale(prepR.commandId, { storage: storage });
    var r = api.markSubmitting(prepR.commandId, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_transition');
  });

  test('mismatched commandId returns command_id_mismatch without altering storage', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    var r = api.markSubmitting('wrong-command-id', { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'command_id_mismatch');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.state, 'prepared');
  });

  test('markStale retains payload and UUID', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    var r = api.markStale(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.envelope.state, 'stale');
    assert.equal(r.envelope.commandId, prepR.commandId);
    assert.equal(r.envelope.documentId, 'DOC-X');
      assert.equal(r.envelope.decision, 'accepted');
    });

    test('markStale with different commandId returns command_id_mismatch and leaves envelope unchanged', function () {
      var api = createAPI();
      var storage = createFakeStorage();
      var crypto = createCryptoRandomUUID();
      var prepR = prep(api, storage, crypto);
      var before = api.getPendingCommand({ storage: storage });
      var r = api.markStale('non-matching-id', { storage: storage });
      assert.equal(r.ok, false);
      assert.equal(r.error, 'command_id_mismatch');
      var after = api.getPendingCommand({ storage: storage });
      assert.deepEqual(after.envelope, before.envelope);
    });

    test('discardBeforeSend succeeds only from prepared', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    var r = api.discardBeforeSend(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, false);
    assert.equal(getR.error, 'no_pending_command');
  });

  test('discardBeforeSend from submitting returns invalid_transition', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markSubmitting(prepR.commandId, { storage: storage });
    var r = api.discardBeforeSend(prepR.commandId, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_transition');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.state, 'submitting');
  });

  test('discardBeforeSend from uncertain returns invalid_transition', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markSubmitting(prepR.commandId, { storage: storage });
    api.markUncertain(prepR.commandId, { storage: storage });
    var r = api.discardBeforeSend(prepR.commandId, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_transition');
  });

  test('discardBeforeSend from stale returns invalid_transition', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    api.markStale(prepR.commandId, { storage: storage });
    var r = api.discardBeforeSend(prepR.commandId, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_transition');
  });

  test('immutable payload: version, commandId, documentId, decision, motivo, expectedActiveDecisionId, createdAt, expiresAt stay identical through transitions', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = prep(api, storage, crypto);
    var immutables = ['version', 'commandId', 'documentId', 'decision', 'motivo', 'expectedActiveDecisionId', 'createdAt', 'expiresAt'];
    var snapshots = [prepR.envelope];
    snapshots.push(api.markSubmitting(prepR.commandId, { storage: storage }).envelope);
    snapshots.push(api.markUncertain(prepR.commandId, { storage: storage }).envelope);
    snapshots.push(api.markStale(prepR.commandId, { storage: storage }).envelope);
    for (var si = 1; si < snapshots.length; si++) {
      for (var ii = 0; ii < immutables.length; ii++) {
        var key = immutables[ii];
        assert.deepEqual(snapshots[si][key], snapshots[0][key], key + ' changed at transition ' + si);
      }
    }
  });
});

describe('TTL and expiry', function () {
  test('default TTL is 24 hours', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 0; } }
    );
    assert.equal(r.ok, true);
    assert.equal(r.envelope.expiresAt, 86400000);
  });

  test('custom ttlMs overrides default', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 100; }, ttlMs: 500 }
    );
    assert.equal(r.ok, true);
    assert.equal(r.envelope.expiresAt, 600);
  });

  test('valid command is returned by getPendingCommand', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 100; }, ttlMs: 1000 }
    );
    var r = api.getPendingCommand({ storage: storage, now: function () { return 500; } });
    assert.equal(r.ok, true);
    assert.equal(r.envelope.documentId, 'DOC-X');
  });

  test('expired command is removed', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 100; }, ttlMs: 100 }
    );
    var r = api.getPendingCommand({ storage: storage, now: function () { return 300; } });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'expired');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('expirePendingCommand removes expired commands', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 100; }, ttlMs: 50 }
    );
    var r = api.expirePendingCommand(200, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.action, 'expired');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, false);
  });

  test('expirePendingCommand keeps valid commands', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var base = Date.now();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; }, ttlMs: 10000 }
    );
    var r = api.expirePendingCommand(base + 500, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.action, 'valid');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, true);
  });

  test('expirePendingCommand with no pending returns no_pending', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var r = api.expirePendingCommand(200, { storage: storage });
    assert.equal(r.ok, true);
      assert.equal(r.outcome, 'no_pending');
    });

    test('expirePendingCommand without explicit now uses injected clock without mutating options bag', function () {
      var api = createAPI();
      var storage = createFakeStorage();
      var crypto = createCryptoRandomUUID();
      api.prepareCommand(
        { documentId: 'DOC-X', decision: 'accepted' },
        { storage: storage, crypto: crypto, now: function () { return 1000; }, ttlMs: 10000 }
      );
      var baseNow = function () { return 5000; };
      var options = { storage: storage, now: baseNow };
      var r = api.expirePendingCommand(undefined, options);
      assert.equal(r.ok, true);
      assert.equal(r.action, 'valid');
      assert.equal(options.now, baseNow);
    });

    test('expired at exact expiresAt boundary (now === expiresAt)', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto, now: function () { return 1000; }, ttlMs: 100 }
    );
    var r = api.getPendingCommand({ storage: storage, now: function () { return 1100; } });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'expired');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

describe('storage schema validation', function () {
  test('missing version returns unsupported_version and removes entry', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      commandId: '550e8400-e29b-41d4-a716-446655440000',
      documentId: 'DOC-X',
      decision: 'accepted',
      motivo: null,
      expectedActiveDecisionId: null,
      state: 'prepared',
      createdAt: 1000,
      expiresAt: 9999999999999,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'unsupported_version');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('malformed motivo (accepted with non-null motivo) returns invalid_storage_payload', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, commandId: '550e8400-e29b-41d4-a716-446655440000',
      documentId: 'DOC-X', decision: 'accepted', motivo: 'should be null',
      expectedActiveDecisionId: null, state: 'prepared',
      createdAt: 1000, expiresAt: 9999999999999,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('malformed motivo (rejected with empty motivo) returns invalid_storage_payload', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, commandId: '550e8400-e29b-41d4-a716-446655440000',
      documentId: 'DOC-X', decision: 'rejected', motivo: '',
      expectedActiveDecisionId: null, state: 'prepared',
      createdAt: 1000, expiresAt: 9999999999999,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('malformed commandId (non-UUID) returns invalid_storage_payload', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, commandId: 'not-a-uuid',
      documentId: 'DOC-X', decision: 'accepted', motivo: null,
      expectedActiveDecisionId: null, state: 'prepared',
      createdAt: 1000, expiresAt: 9999999999999,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });

  test('expiresAt not strictly after createdAt returns invalid_storage_payload', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, commandId: '550e8400-e29b-41d4-a716-446655440000',
      documentId: 'DOC-X', decision: 'accepted', motivo: null,
      expectedActiveDecisionId: null, state: 'prepared',
      createdAt: 2000, expiresAt: 1000,
    }));
    var r = api.getPendingCommand({ storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'invalid_storage_payload');
    assert.equal(storage.getItem(STORAGE_KEY), null);
  });
});

describe('reconciliation', function () {
  function prep(api, storage, crypto) {
    var base = Date.now();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; } }
    );
    return r.envelope;
  }

  test('no pending returns outcome no_pending', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var r = api.reconcilePendingCommand(null, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'no_pending');
  });

  test('active decision with same command_id returns confirmed and clears pending', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    var active = { id: 'decision-1', command_id: envelope.commandId };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'confirmed');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, false);
  });

  test('no active decision plus uncertain returns retry_available with same UUID', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    api.markSubmitting(envelope.commandId, { storage: storage });
    api.markUncertain(envelope.commandId, { storage: storage });
    var r = api.reconcilePendingCommand(null, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'retry_available');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.commandId, envelope.commandId);
    assert.equal(getR.envelope.state, 'uncertain');
  });

  test('no active decision plus submitting returns retry_available with same UUID', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    api.markSubmitting(envelope.commandId, { storage: storage });
    var r = api.reconcilePendingCommand(null, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'retry_available');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.commandId, envelope.commandId);
    assert.equal(getR.envelope.state, 'submitting');
  });

  test('active decision with different command_id marks stale', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    var active = { id: 'decision-2', command_id: 'different-uuid-0000-0000-0000-000000000000' };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'stale');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.state, 'stale');
  });

  test('active decision with null command_id marks stale', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    var active = { id: 'decision-3', command_id: null };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'stale');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.state, 'stale');
  });

  test('prepared pending with no active decision returns pending outcome', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    prep(api, storage, crypto);
    var r = api.reconcilePendingCommand(null, { storage: storage });
    assert.equal(r.ok, true);
    assert.equal(r.outcome, 'prepared');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.envelope.state, 'prepared');
  });

  test('reconciliation never calls any adapter', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    prep(api, storage, crypto);
    var active = { id: 'x', command_id: 'different' };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, true);
      assert.equal(r.outcome, 'stale');
    });

    test('reconcilePendingCommand(null, options) with persisted stale command returns stale without changing commandId/payload', function () {
      var api = createAPI();
      var storage = createFakeStorage();
      var crypto = createCryptoRandomUUID();
      var envelope = prep(api, storage, crypto);
      api.markStale(envelope.commandId, { storage: storage });
      var before = api.getPendingCommand({ storage: storage });
      var r = api.reconcilePendingCommand(null, { storage: storage });
      assert.equal(r.ok, true);
      assert.equal(r.outcome, 'stale');
      var after = api.getPendingCommand({ storage: storage });
      assert.equal(after.envelope.commandId, envelope.commandId);
      assert.equal(after.envelope.state, 'stale');
      assert.equal(after.envelope.documentId, 'DOC-X');
      assert.equal(after.envelope.decision, 'accepted');
    });
  });

describe('storage failure propagation', function () {
  function prep(api, storage, crypto) {
    var base = Date.now();
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { storage: storage, crypto: crypto, now: function () { return base; } }
    );
    return r.envelope;
  }

  test('confirmed clear failure propagates storage_unavailable', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    storage.removeItem = function () { throw new Error('fail'); };
    var active = { id: 'decision-1', command_id: envelope.commandId };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'storage_unavailable');
  });

  test('stale write failure propagates storage_unavailable', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var envelope = prep(api, storage, crypto);
    storage.setItem = function () { throw new Error('fail'); };
    var active = { id: 'decision-2', command_id: 'different-uuid-0000-0000-0000-000000000000' };
    var r = api.reconcilePendingCommand(active, { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'storage_unavailable');
  });
});

describe('resolveCommand', function () {
  test('clears pending with matching commandId', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    var prepR = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    var r = api.resolveCommand(prepR.commandId, { storage: storage });
    assert.equal(r.ok, true);
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, false);
  });

  test('does not clear with non-matching commandId', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    var r = api.resolveCommand('wrong-id', { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'command_id_mismatch');
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, true);
  });

  test('with no pending returns no_pending_command', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var r = api.resolveCommand('some-id', { storage: storage });
    assert.equal(r.ok, false);
    assert.equal(r.error, 'no_pending_command');
  });
});

describe('clearPendingCommand', function () {
  test('clears stored command', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    var r = api.clearPendingCommand({ storage: storage });
    assert.equal(r.ok, true);
    var getR = api.getPendingCommand({ storage: storage });
    assert.equal(getR.ok, false);
  });

  test('succeeds even when no pending command', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var r = api.clearPendingCommand({ storage: storage });
    assert.equal(r.ok, true);
  });
});

describe('storage key isolation', function () {
  test('uses only the exact key RAVATEX_DOCUMENT_DECISION_PENDING_V1', function () {
    var api = createAPI();
    var storage = createFakeStorage();
    var crypto = createCryptoRandomUUID();
    api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted' },
      { storage: storage, crypto: crypto }
    );
    var keys = Object.keys(storage._store);
    assert.equal(keys.length, 1);
    assert.equal(keys[0], STORAGE_KEY);
  });
});

describe('sessionStorage getter throws (privacy mode)', function () {
  var originalDescriptor;

  before(function () {
    originalDescriptor = Object.getOwnPropertyDescriptor(globalThis.window, 'sessionStorage');
  });

  after(function () {
    if (originalDescriptor) {
      Object.defineProperty(globalThis.window, 'sessionStorage', originalDescriptor);
    } else {
      delete globalThis.window.sessionStorage;
    }
  });

  test('getPendingCommand returns storage_unavailable without throwing when sessionStorage access throws', function () {
    var api = createAPI();
    Object.defineProperty(globalThis.window, 'sessionStorage', {
      get: function () { throw new Error('sessionStorage access denied in privacy mode'); },
      configurable: true,
    });
    var r = api.getPendingCommand();
    assert.equal(r.ok, false);
    assert.equal(r.error, 'storage_unavailable');
  });

  test('prepareCommand after valid input returns storage_unavailable without throwing when sessionStorage access throws', function () {
    var api = createAPI();
    var crypto = createCryptoRandomUUID();
    Object.defineProperty(globalThis.window, 'sessionStorage', {
      get: function () { throw new Error('sessionStorage access denied in privacy mode'); },
      configurable: true,
    });
    var r = api.prepareCommand(
      { documentId: 'DOC-X', decision: 'accepted', expectedActiveDecisionId: null },
      { crypto: crypto }
    );
    assert.equal(r.ok, false);
    assert.equal(r.error, 'storage_unavailable');
  });
});

describe('static source assertions', function () {
  var src;
  before(function () {
    src = fs.readFileSync(SRC_PATH, 'utf8');
  });

  function lacks(pattern, label) {
    test(label || 'nao contem ' + pattern, function () {
      assert.doesNotMatch(src, pattern);
    });
  }

  lacks(/Math\s*\.\s*random/, 'no Math.random');
  lacks(/localStorage/, 'no localStorage');
  lacks(/Supabase/i, 'no Supabase reference');
  lacks(/\.rpc\s*\(/, 'no .rpc() call');
  lacks(/supabaseClient/, 'no supabaseClient');
  lacks(/\bfetch\b/, 'no fetch');
  lacks(/XMLHttpRequest/, 'no XMLHttpRequest');
  lacks(/document\.\s*(querySelector|getElementById|createElement|querySelectorAll)/, 'no DOM access');
  lacks(/addEventListener/, 'no addEventListener');
  lacks(/statusOverrides/i, 'no statusOverrides');
  lacks(/saveDocumentDecision/, 'no saveDocumentDecision');
  lacks(/removeDocumentDecision/, 'no removeDocumentDecision');

  test('module is IIFE attached to RAVATEX_DOCUMENTS.documentDecisionCommand', function () {
    assert.match(src, /documentDecisionCommand\s*=/);
    assert.match(src, /RAVATEX_DOCUMENTS\s*=\s*ns/);
    assert.match(src, /function\s*\(\s*window\s*\)/);
  });
});
