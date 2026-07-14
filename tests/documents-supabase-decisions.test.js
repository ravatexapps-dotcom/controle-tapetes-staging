'use strict';

// =====================================================================
// === tests/documents-supabase-decisions.test.js ======================
// Unit do adapter RAVATEX_DOCUMENTS (js/documents-supabase-decisions.js).
// Legacy decideDocumentInCloud removed in G28-B5-D5-B4.
// Preserved: registerDocumentDecisionInCloud (canonical command adapter)
// and undoDocumentDecisionInCloud (independent undo adapter).
// =====================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const DECISIONS_PATH = path.join(ROOT, 'js', 'documents-supabase-decisions.js');
const DECISIONS = fs.readFileSync(DECISIONS_PATH, 'utf8');

const DOC_ID = '96ed4f0e-26b2-4c2f-9186-65f72bf5fb18';

// Objetos criados dentro do vm.Context tem outro Object.prototype; o
// deepEqual estrito exige prototipo reference-equal. Normaliza via JSON.
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeSandbox(options) {
  options = options || {};
  const calls = [];
  const sandbox = { window: {}, console: {} };
  sandbox.window = sandbox;
  if (options.withSupa !== false) {
    sandbox.supa = {
      rpc: function (fn, params) {
        calls.push({ fn: fn, params: params });
        if (typeof options.rpcImpl === 'function') return options.rpcImpl(fn, params);
        return Promise.resolve(options.rpcResult || { data: { ok: true } });
      },
    };
  }
  vm.createContext(sandbox);
  vm.runInContext(DECISIONS, sandbox, { filename: 'documents-supabase-decisions.js' });
  return { sandbox: sandbox, calls: calls, ns: sandbox.RAVATEX_DOCUMENTS };
}

test('decisions: arquivo existe e sintaxe valida', function () {
  assert.ok(fs.existsSync(DECISIONS_PATH));
  require('node:child_process').execFileSync(process.execPath, ['--check', DECISIONS_PATH], { stdio: 'pipe' });
});

test('decisions: decideDocumentInCloud is absent (undefined)', function () {
  const rt = makeSandbox({ withSupa: false });
  assert.equal(rt.ns.decideDocumentInCloud, undefined);
});

test('decisions: register and undo are the only decision entry points beyond namespace bootstrap', function () {
  const rt = makeSandbox({ withSupa: false });
  const exportedFunctions = Object.keys(rt.ns).filter(function (k) {
    return typeof rt.ns[k] === 'function';
  });
  assert.equal(exportedFunctions.length, 2, 'exactly 2 exported functions');
  assert.ok(exportedFunctions.includes('registerDocumentDecisionInCloud'));
  assert.ok(exportedFunctions.includes('undoDocumentDecisionInCloud'));
  assert.equal(typeof rt.ns.undoDocumentDecisionInCloud, 'function');
});



test('decisions: undo usa rpc desfazer_decisao_documento com motivo trimmed', async function () {
  const rt = makeSandbox({ rpcResult: { data: { ok: true, restored_status: 'assigned' } } });
  const result = await rt.ns.undoDocumentDecisionInCloud(DOC_ID, '  Reabertura conferida  ');
  assert.equal(result.ok, true);
  assert.deepEqual(plain(rt.calls[0]), {
    fn: 'desfazer_decisao_documento',
    params: { p_document_id: DOC_ID, p_motivo: 'Reabertura conferida' },
  });
});

test('decisions: undo sem motivo envia null e id ausente nao chama rpc', async function () {
  const rt = makeSandbox({});
  const missing = await rt.ns.undoDocumentDecisionInCloud(' ', null);
  assert.deepEqual(plain(missing), { ok: false, error: 'document_id_required' });
  assert.equal(rt.calls.length, 0);
  await rt.ns.undoDocumentDecisionInCloud(DOC_ID, '   ');
  assert.deepEqual(plain(rt.calls[0].params), { p_document_id: DOC_ID, p_motivo: null });
});

test('decisions: undo preserva erros retornados pela RPC', async function () {
  const rt = makeSandbox({ rpcResult: { data: { ok: false, error: 'base_status_unavailable' } } });
  const result = await rt.ns.undoDocumentDecisionInCloud(DOC_ID, null);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'base_status_unavailable');
});



test('decisions: nao contem .from(), writes diretos nem service_role', function () {
  assert.equal(/\.from\s*\(/.test(DECISIONS), false, '.from( presente');
  assert.equal(/\.insert\s*\(/.test(DECISIONS), false, '.insert( presente');
  assert.equal(/\.update\s*\(/.test(DECISIONS), false, '.update( presente');
  assert.equal(/\.delete\s*\(/.test(DECISIONS), false, '.delete( presente');
  assert.equal(/\.upsert\s*\(/.test(DECISIONS), false, '.upsert( presente');
  assert.equal(/service_role/.test(DECISIONS), false, 'service_role presente');
  assert.equal(/localStorage/.test(DECISIONS), false, 'localStorage presente');
});

test('decisions: only canonical registration and undo RPCs are present (no legacy RPC)', function () {
  const rpcNames = Array.from(DECISIONS.matchAll(/\.rpc\s*\(\s*['"]([^'"]+)['"]/g)).map((m) => m[1]);
  assert.ok(rpcNames.includes('registrar_decisao_documento'));
  assert.ok(rpcNames.includes('desfazer_decisao_documento'));
  assert.equal(rpcNames.length, 2, 'exactly 2 RPCs with no legacy RPC');
  assert.equal(rpcNames.includes('decidir_documento'), false, 'legacy RPC removed');
});

// =====================================================================
// G28-B5-D1 — Canonical Decision Adapter Tests
// =====================================================================

test('decisions: expoe registerDocumentDecisionInCloud no namespace', function () {
  const rt = makeSandbox({ withSupa: false });
  assert.equal(typeof rt.ns.registerDocumentDecisionInCloud, 'function');
});

test('decisions: register sem supa retorna supabase_unavailable', async function () {
  const rt = makeSandbox({ withSupa: false });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'accepted',
    motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'supabase_unavailable' });
});

test('decisions: register documentId ausente retorna document_id_required', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: '',
    decision: 'accepted',
    motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'document_id_required' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register decision invalido retorna invalid_decision', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'foo',
    motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_decision' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register rejected sem motivo retorna motivo_required', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'rejected',
    motivo: '   ',
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'motivo_required' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register commandId ausente retorna command_id_required', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'accepted',
    motivo: null,
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'command_id_required' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register accepted chama rpc registrar_decisao_documento com args corretos', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({
    rpcResult: { data: { ok: true, outcome: 'created', command_id: cmdId, document_id: DOC_ID, decision_id: 'd1', active_decision_id: 'd1', decision_status: 'accepted', candidate_status: 'accepted', replayed: false } },
  });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'accepted',
    motivo: null,
    commandId: cmdId,
    expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, true);
  assert.equal(rt.calls.length, 1);
  assert.equal(rt.calls[0].fn, 'registrar_decisao_documento');
  assert.deepEqual(plain(rt.calls[0].params), {
    p_document_id: DOC_ID,
    p_decision: 'accepted',
    p_motivo: null,
    p_command_id: cmdId,
    p_expected_active_decision_id: null,
  });
});

test('decisions: register rejected envia motivo trimmed', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({ rpcResult: { data: { ok: true, outcome: 'created' } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'rejected',
    motivo: '  Arquivo ilegivel  ',
    commandId: cmdId,
    expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(plain(rt.calls[0].params), {
    p_document_id: DOC_ID,
    p_decision: 'rejected',
    p_motivo: 'Arquivo ilegivel',
    p_command_id: cmdId,
    p_expected_active_decision_id: null,
  });
});

test('decisions: register accepted normaliza motivo para null', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({ rpcResult: { data: { ok: true, outcome: 'created' } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'accepted',
    motivo: '  Algum motivo  ',
    commandId: cmdId,
    expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, true);
  assert.equal(rt.calls[0].params.p_motivo, null, 'accepted deve enviar null');
});

test('decisions: register preserva expectedActiveDecisionId UUID', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const expectedId = 'ffffffff-aaaa-bbbb-cccc-ddddeeeeffff';
  const rt = makeSandbox({ rpcResult: { data: { ok: true, outcome: 'created' } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID,
    decision: 'accepted',
    motivo: null,
    commandId: cmdId,
    expectedActiveDecisionId: expectedId,
  });
  assert.equal(result.ok, true);
  assert.equal(rt.calls[0].params.p_expected_active_decision_id, expectedId);
});

test('decisions: register preserva r.data criado', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: true, outcome: 'created', command_id: cmdId, document_id: DOC_ID,
    decision_id: 'd1', active_decision_id: 'd1', decision_status: 'accepted',
    candidate_status: 'accepted', replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data replayed', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: true, outcome: 'replayed', command_id: cmdId, document_id: DOC_ID,
    decision_id: 'd1', active_decision_id: 'd1', decision_status: 'accepted',
    candidate_status: 'pending', replayed: true,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data command_conflict', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'command_conflict', command_id: cmdId, document_id: DOC_ID,
    decision_id: null, active_decision_id: null, decision_status: null,
    candidate_status: 'accepted', replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'rejected', motivo: 'outro',
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data active_decision_exists ok true', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: true, outcome: 'active_decision_exists', command_id: cmdId, document_id: DOC_ID,
    decision_id: 'd1', active_decision_id: 'd1', decision_status: 'accepted',
    candidate_status: 'accepted', replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: 'ffffffff-aaaa-bbbb-cccc-ddddeeeeffff',
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data active_decision_exists ok false', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'active_decision_exists', command_id: cmdId, document_id: DOC_ID,
    decision_id: 'd1', active_decision_id: 'd1', decision_status: 'accepted',
    candidate_status: 'accepted', replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data stale_active_decision', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'stale_active_decision', command_id: cmdId, document_id: DOC_ID,
    decision_id: 'd2', active_decision_id: 'd2', decision_status: 'rejected',
    candidate_status: 'rejected', replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: 'ffffffff-aaaa-bbbb-cccc-ddddeeeeffff',
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data candidate_not_found', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'candidate_not_found', command_id: cmdId, document_id: DOC_ID,
    decision_id: null, active_decision_id: null, decision_status: null,
    candidate_status: null, replayed: false,
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data input_error', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'input_error', error: 'document_id_required',
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register preserva r.data auth_error', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rpcData = {
    ok: false, outcome: 'auth_error', error: 'admin_required',
  };
  const rt = makeSandbox({ rpcResult: { data: rpcData } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), rpcData);
});

test('decisions: register r.error PostgREST vira ok:false com message', async function () {
  const rt = makeSandbox({ rpcResult: { error: { message: 'permission denied for function registrar_decisao_documento' } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'permission denied for function registrar_decisao_documento');
});

test('decisions: register r.error sem message cai em supabase_error', async function () {
  const rt = makeSandbox({ rpcResult: { error: {} } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'supabase_error');
});

test('decisions: register promise rejeitada vira network', async function () {
  const rt = makeSandbox({ rpcImpl: function () { return Promise.reject(new Error('boom')); } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'network' });
});

test('decisions: register throw sincrono vira network', async function () {
  const rt = makeSandbox({ rpcImpl: function () { throw new Error('sync boom'); } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'network' });
});

test('decisions: register e legacy nao geram UUID nem usam storage', function () {
  assert.equal(/crypto\.randomUUID/.test(DECISIONS), false, 'crypto.randomUUID presente');
  assert.equal(/localStorage/.test(DECISIONS), false, 'localStorage presente');
  assert.equal(/sessionStorage/.test(DECISIONS), false, 'sessionStorage presente');
});

test('decisions: register sem .from/.insert/.update/.delete/.upsert', function () {
  assert.equal(/\.from\s*\(/.test(DECISIONS), false);
  assert.equal(/\.insert\s*\(/.test(DECISIONS), false);
  assert.equal(/\.update\s*\(/.test(DECISIONS), false);
  assert.equal(/\.delete\s*\(/.test(DECISIONS), false);
  assert.equal(/\.upsert\s*\(/.test(DECISIONS), false);
  assert.equal(/service_role/.test(DECISIONS), false);
});

test('decisions: registro com commandId vazio ou nulo rejeita', async function () {
  const rt = makeSandbox({});
  var ausente = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(ausente), { ok: false, error: 'command_id_required' });
  var nulo = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: null, expectedActiveDecisionId: null,
  });
  assert.deepEqual(plain(nulo), { ok: false, error: 'command_id_required' });
  assert.equal(rt.calls.length, 0);
});

const VALID_UUID = 'ffffffff-aaaa-bbbb-cccc-ddddeeeeffff';

test('decisions: register expectedActiveDecisionId null passa null exatamente', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({ rpcResult: { data: { ok: true } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: null,
  });
  assert.equal(result.ok, true);
  assert.equal(rt.calls[0].params.p_expected_active_decision_id, null);
});

test('decisions: register expectedActiveDecisionId UUID valido passa inalterado', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({ rpcResult: { data: { ok: true } } });
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: VALID_UUID,
  });
  assert.equal(result.ok, true);
  assert.equal(rt.calls[0].params.p_expected_active_decision_id, VALID_UUID);
});

test('decisions: register expectedActiveDecisionId vazio rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: '',
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId whitespace rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: '   ',
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId ausente rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId boolean rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: false,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId numero rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: 42,
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId object rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: { foo: 'bar' },
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register expectedActiveDecisionId malformed UUID rejeita sem rpc', async function () {
  const cmdId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud({
    documentId: DOC_ID, decision: 'accepted', motivo: null,
    commandId: cmdId, expectedActiveDecisionId: 'not-a-uuid',
  });
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_expected_active_decision_id' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register envelope null retorna invalid_envelope sem rpc', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud(null);
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_envelope' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register envelope undefined retorna invalid_envelope sem rpc', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud(undefined);
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_envelope' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register envelope array retorna invalid_envelope sem rpc', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud(['doc']);
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_envelope' });
  assert.equal(rt.calls.length, 0);
});

test('decisions: register envelope string retorna invalid_envelope sem rpc', async function () {
  const rt = makeSandbox({});
  const result = await rt.ns.registerDocumentDecisionInCloud('foo');
  assert.deepEqual(plain(result), { ok: false, error: 'invalid_envelope' });
  assert.equal(rt.calls.length, 0);
});
