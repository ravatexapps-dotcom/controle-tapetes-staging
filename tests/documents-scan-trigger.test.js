'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE_PATH = path.join(ROOT, 'js', 'documents-scan-trigger.js');
const INDEX_PATH = path.join(ROOT, 'index.html');
const source = fs.readFileSync(MODULE_PATH, 'utf8');
const index = fs.readFileSync(INDEX_PATH, 'utf8');

function makeSandbox(options) {
  options = options || {};
  const calls = [];
  const listeners = {};
  const statuses = (options.statuses || []).slice();
  const sandbox = {
    console: {}, Promise, Date,
    CURRENT_USER: options.user === undefined ? { tipo: 'admin' } : options.user,
    location: { hash: '#/documentos/recebidos' },
    setTimeout(fn) { Promise.resolve().then(fn); return 1; },
    clearTimeout() {},
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  sandbox.window = sandbox;
  sandbox.supa = {
    rpc(name, args) {
      calls.push({ kind: 'rpc', name, args });
      return Promise.resolve(options.rpcResult || { data: { ok: true, reused: false, request_id: 'req-1', source: 'gmail', status: 'requested' }, error: null });
    },
    from(table) {
      calls.push({ kind: 'from', table });
      return {
        select(fields) { calls.push({ kind: 'select', fields }); return this; },
        eq(field, value) { calls.push({ kind: 'eq', field, value }); return this; },
        in(field, values) { calls.push({ kind: 'in', field, values }); return this; },
        order(field, opts) { calls.push({ kind: 'order', field, opts }); return this; },
        limit(n) { calls.push({ kind: 'limit', n }); return this; },
        single() {
          const next = statuses.length ? statuses.shift() : { id: 'req-1', source: 'gmail', status: 'completed' };
          return Promise.resolve(next && next.error ? { error: next.error } : { data: next, error: null });
        },
        // Query de lista (hidratacao): a builder do supabase-js e thenable.
        // Somente getActiveDocumentScanRequest a consome desta forma.
        then(resolve, reject) {
          const payload = options.activeResult || { data: (options.activeRows || []), error: null };
          return Promise.resolve(payload).then(resolve, reject);
        },
      };
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: MODULE_PATH });
  return { sandbox, calls, listeners };
}

test('scan trigger: arquivo existe, sintaxe valida e expoe API minima', () => {
  assert.ok(fs.existsSync(MODULE_PATH));
  require('node:child_process').execFileSync(process.execPath, ['--check', MODULE_PATH], { stdio: 'pipe' });
  const rt = makeSandbox();
  for (const name of ['requestDocumentScan', 'getDocumentScanRequestStatus', 'pollDocumentScanRequest', 'cancelDocumentScanPolling', 'getActiveDocumentScanRequest', 'autoStartDocumentScanOnAdminBootstrap']) {
    assert.equal(typeof rt.sandbox.RAVATEX_DOCUMENTS[name], 'function');
  }
});

test('G24-C: bootstrap admin sem request ativa cria uma request automaticamente uma unica vez', async () => {
  const rt = makeSandbox({
    activeRows: [],
    statuses: [{ id: 'req-1', source: 'gmail', status: 'requested' }, { id: 'req-1', source: 'gmail', status: 'completed' }],
  });
  const first = await rt.sandbox.RAVATEX_DOCUMENTS.autoStartDocumentScanOnAdminBootstrap();
  const second = await rt.sandbox.RAVATEX_DOCUMENTS.autoStartDocumentScanOnAdminBootstrap();
  assert.equal(first.status, 'completed');
  assert.equal(second.skipped, 'already_bootstrapped');
  assert.equal(rt.calls.filter((c) => c.kind === 'rpc').length, 1);
});

test('G24-C: bootstrap admin com request ativa apenas hidrata e acompanha', async () => {
  const rt = makeSandbox({
    activeRows: [{ id: 'req-active', source: 'gmail', status: 'claimed', requested_at: '2026-07-10T00:00:00Z' }],
    statuses: [{ id: 'req-active', source: 'gmail', status: 'running' }, { id: 'req-active', source: 'gmail', status: 'completed' }],
  });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.autoStartDocumentScanOnAdminBootstrap();
  assert.equal(result.status, 'completed');
  assert.equal(rt.calls.filter((c) => c.kind === 'rpc').length, 0);
});

test('G24-C: bootstrap nao-admin nao le nem cria request', async () => {
  const rt = makeSandbox({ user: { tipo: 'cliente' } });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.autoStartDocumentScanOnAdminBootstrap();
  assert.equal(result.skipped, 'not_admin');
  assert.equal(rt.calls.length, 0);
});

test('G24-C: segundo assinante de polling recebe conclusao sem criar outro polling', async () => {
  const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status: 'running' }, { id: 'req-1', source: 'gmail', status: 'completed' }] });
  const completed = [];
  const first = rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1');
  const second = rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1', { onComplete(result) { completed.push(result.status); } });
  assert.equal(first, second);
  await first;
  assert.deepEqual(completed, ['completed']);
});

test('scan trigger: chama somente a RPC esperada com source gmail', async () => {
  const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status: 'completed' }] });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.requestDocumentScan();
  assert.equal(result.status, 'completed');
  assert.deepEqual(JSON.parse(JSON.stringify(rt.calls.find((c) => c.kind === 'rpc'))), { kind: 'rpc', name: 'solicitar_document_scan', args: { p_source: 'gmail' } });
  assert.equal(rt.calls.filter((c) => c.kind === 'rpc').length, 1);
});

test('scan trigger: nova request e reused iniciam polling da mesma forma', async () => {
  for (const reused of [false, true]) {
    const rt = makeSandbox({ rpcResult: { data: { ok: true, reused, request_id: 'req-1', source: 'gmail', status: 'requested' }, error: null }, statuses: [{ id: 'req-1', source: 'gmail', status: 'completed' }] });
    const result = await rt.sandbox.RAVATEX_DOCUMENTS.requestDocumentScan();
    assert.equal(result.status, 'completed');
    assert.equal(result.reused, reused);
    assert.ok(rt.calls.some((c) => c.kind === 'from' && c.table === 'document_scan_requests'));
  }
});

test('scan trigger: atualiza requested, claimed e running antes de concluir', async () => {
  const seen = [];
  const rt = makeSandbox({ statuses: [
    { id: 'req-1', source: 'gmail', status: 'requested' }, { id: 'req-1', source: 'gmail', status: 'claimed' },
    { id: 'req-1', source: 'gmail', status: 'running' }, { id: 'req-1', source: 'gmail', status: 'completed' },
  ] });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1', { onUpdate(request) { seen.push(request.status); } });
  assert.deepEqual(seen, ['requested', 'claimed', 'running', 'completed']);
  assert.equal(result.status, 'completed');
});

test('scan trigger: failed e cancelled encerram polling sem expor detalhe bruto', async () => {
  for (const status of ['failed', 'cancelled']) {
    const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status, error_message: 'infra detail' }] });
    const result = await rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1');
    assert.equal(result.status, status);
    assert.equal(result.error, status === 'failed' ? 'request_failed' : null);
    assert.equal(JSON.stringify(result).includes('infra detail'), false);
  }
});

test('scan trigger: permite apenas um polling ativo por request e cancelamento encerra', async () => {
  const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status: 'running' }] });
  const first = rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1');
  const second = rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1');
  assert.equal(first, second);
  rt.sandbox.RAVATEX_DOCUMENTS.cancelDocumentScanPolling('req-1');
  const result = await first;
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: false, error: 'cancelled', requestId: 'req-1' });
});

test('scan trigger: erro de migration, sessao e nao-admin sao controlados', async () => {
  const migration = makeSandbox({ rpcResult: { error: { message: 'function solicitar_document_scan does not exist' } } });
  assert.equal((await migration.sandbox.RAVATEX_DOCUMENTS.requestDocumentScan()).error, 'migration_unavailable');
  const nonAdmin = makeSandbox({ user: { tipo: 'cliente' } });
  assert.equal((await nonAdmin.sandbox.RAVATEX_DOCUMENTS.requestDocumentScan()).error, 'admin_required');
  nonAdmin.sandbox.CURRENT_USER = null;
  assert.equal((await nonAdmin.sandbox.RAVATEX_DOCUMENTS.getDocumentScanRequestStatus('req-1')).error, 'session_expired');
});

test('scan trigger: rota diferente cancela todos os pollings ativos', async () => {
  const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status: 'running' }] });
  const pending = rt.sandbox.RAVATEX_DOCUMENTS.pollDocumentScanRequest('req-1');
  rt.sandbox.location.hash = '#/painel';
  rt.listeners.hashchange();
  assert.equal((await pending).error, 'cancelled');
});

test('scan trigger: leitura consulta somente os campos permitidos da fila', async () => {
  const rt = makeSandbox({ statuses: [{ id: 'req-1', source: 'gmail', status: 'completed' }] });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.getDocumentScanRequestStatus('req-1');
  assert.equal(result.ok, true);
  assert.equal(rt.calls.find((c) => c.kind === 'select').fields, 'id,source,status,scan_run_id,requested_at,claimed_at,started_at,finished_at,error_message');
});

test('scan trigger: cadencia e timeout canonicos estao definidos no cliente', () => {
  assert.match(source, /POLL_INTERVAL_MS\s*=\s*5000/);
  assert.match(source, /POLL_TIMEOUT_MS\s*=\s*10\s*\*\s*60\s*\*\s*1000/);
  assert.match(source, /error:\s*'timeout'/);
});

test('tela: botao admin, estados, refresh canonico e cancelamento no logout estao integrados', () => {
  const screen = fs.readFileSync(path.join(ROOT, 'js', 'screens', 'documentos-recebidos.js'), 'utf8');
  assert.match(screen, /isAdminUser\(\)[\s\S]*verificar-novos-documentos/);
  assert.match(screen, /requested:[\s\S]*claimed:[\s\S]*running:[\s\S]*completed:[\s\S]*failed:[\s\S]*cancelled:/);
  assert.match(screen, /result\.status === 'completed'[\s\S]*loadDocumentsPrimaryThenFallback/);
  assert.match(screen, /cancelDocumentScanPolling\(\)/);
});

test('scan trigger: nao contem credenciais, rede auxiliar, OAuth ou writes de decisoes', () => {
  assert.doesNotMatch(source, /service_role|SUPABASE_SERVICE_ROLE_KEY|oauth|googleapis|gmail\.users|fetch\s*\(|XMLHttpRequest/i);
  assert.doesNotMatch(source, /document_decisions|\.insert\s*\(|\.update\s*\(|\.delete\s*\(/i);
  assert.doesNotMatch(source, /document_scan_runs|iniciar_document_scan_run/i);
});

test('index: carrega o trigger antes da tela de documentos', () => {
  const trigger = index.indexOf('js/documents-scan-trigger.js');
  const screen = index.indexOf('js/screens/documentos-recebidos.js');
  assert.ok(trigger > 0 && trigger < screen);
});

test('G24-B5: getActiveDocumentScanRequest le a request ativa sem solicitar novo scan', async () => {
  const rt = makeSandbox({ activeRows: [{ id: 'req-9', source: 'gmail', status: 'claimed', requested_at: '2026-07-10T00:00:00Z' }] });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.getActiveDocumentScanRequest('gmail');
  assert.equal(result.ok, true);
  assert.equal(result.request.id, 'req-9');
  assert.equal(result.request.status, 'claimed');
  // Hidratacao nao pode chamar a RPC de solicitacao.
  assert.equal(rt.calls.filter((c) => c.kind === 'rpc').length, 0);
  // Consulta a fila com os campos permitidos e filtra apenas estados ativos.
  assert.ok(rt.calls.some((c) => c.kind === 'from' && c.table === 'document_scan_requests'));
  assert.equal(rt.calls.find((c) => c.kind === 'select').fields,
    'id,source,status,scan_run_id,requested_at,claimed_at,started_at,finished_at,error_message');
  const inCall = rt.calls.find((c) => c.kind === 'in');
  assert.equal(inCall.field, 'status');
  // inCall.values e criado dentro do contexto vm (realm diferente), entao
  // normaliza via JSON antes de comparar (mesmo padrao do resto do arquivo).
  assert.deepEqual(JSON.parse(JSON.stringify(inCall.values)), ['requested', 'claimed', 'running']);
  assert.deepEqual(JSON.parse(JSON.stringify(rt.calls.find((c) => c.kind === 'eq'))), { kind: 'eq', field: 'source', value: 'gmail' });
});

test('G24-B5: getActiveDocumentScanRequest sem fila ativa devolve request null', async () => {
  const rt = makeSandbox({ activeRows: [] });
  const result = await rt.sandbox.RAVATEX_DOCUMENTS.getActiveDocumentScanRequest('gmail');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { ok: true, request: null });
  assert.equal(rt.calls.filter((c) => c.kind === 'rpc').length, 0);
});

test('G24-B5: getActiveDocumentScanRequest exige sessao admin', async () => {
  const nonAdmin = makeSandbox({ user: { tipo: 'cliente' } });
  assert.equal((await nonAdmin.sandbox.RAVATEX_DOCUMENTS.getActiveDocumentScanRequest('gmail')).error, 'session_expired');
  assert.equal(nonAdmin.calls.filter((c) => c.kind === 'from').length, 0);
});
