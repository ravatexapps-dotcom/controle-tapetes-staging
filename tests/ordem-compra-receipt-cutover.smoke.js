// Smoke test do módulo js/screens/ordem-compra-receipt-cutover.js
// (PHASE-C3C-B, docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md §32).
//
// Uses the shared faithful double (tests/_doubles.js, CODE_HEALTH_RULES.md
// §20): .rpc() is single-level (not double-wrapped), matching the real
// PostgREST/postgrest-js envelope this module's detection logic depends on.
//
// Coverage:
//   1-4.   static: file exists, classic script, node --check, no DOM access.
//   5-9.   attemptCanonicalRead: canonical success (item + OP grain
//          mapping), listar_compat_inativo -> legacy_fallback, bounded
//          42883 -> legacy_fallback, sem_permissao -> hard_failure, every
//          unrecognized error -> hard_failure.
//   10-17. attemptCanonicalReceipt: canonical success never signals
//          fallback, recebimento_compat_inativo -> legacy_fallback, bounded
//          42883 -> legacy_fallback, and each fail-closed code
//          (sem_permissao, estado_invalido, mapeamento_compat_ausente,
//          decremento_exige_admin, reducao_abaixo_saldo_importado,
//          idempotencia_conflitante) -> hard_failure, never legacy_fallback.
//   18-22. idempotency lifecycle: createReceiptAttempt mints a token; the
//          same attempt's token is reused verbatim across two RPC calls
//          (retry of the same attempt); two independent attempts (including
//          same-date submissions) never share a token.
//   23-24. isLegacyReceiptFenced detects exactly the fenced signal and
//          nothing else.

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');
const cp     = require('node:child_process');

const { createDocument, makeFakeSupa } = require('./_doubles.js');

const ROOT = path.resolve(__dirname, '..');
const MOD  = path.join(ROOT, 'js', 'screens', 'ordem-compra-receipt-cutover.js');
const modSrc = fs.readFileSync(MOD, 'utf8');

test('1. js/screens/ordem-compra-receipt-cutover.js exists and is a classic script', () => {
  assert.ok(fs.existsSync(MOD), 'ordem-compra-receipt-cutover.js missing');
  assert.equal(/^\s*export\s+/m.test(modSrc), false, 'must be a classic script, not an ES module');
  assert.equal(/import\s+.*\s+from\s+/.test(modSrc), false, 'must be a classic script, not an ES module');
});

test('2. node --check passes', () => {
  cp.execSync(`node --check "${MOD}"`, { stdio: 'pipe' });
});

test('3. module never references document/window.el/DOM globals (pure adapter, no DOM access)', () => {
  assert.equal(/\bdocument\./.test(modSrc), false, 'adapter must not touch document');
  assert.equal(/window\.el\(/.test(modSrc), false, 'adapter must not render');
});

test('4. module knows only the two db/76 RPC names', () => {
  assert.match(modSrc, /listar_ordens_compra_fio_compat/);
  assert.match(modSrc, /registrar_recebimento_ordem_compra_fio_compat/);
  assert.equal(/listar_recebimentos_ordem_compra_normalizados|registrar_recebimento_ordem_compra\b|estornar_recebimento_ordem_compra/.test(modSrc), false,
    'adapter must not reference the superseded C3C-A application targets (§32.2)');
});

function makeSandbox(rpcImpl) {
  const document = createDocument();
  const supa = makeFakeSupa({ rpcImpl });
  let uuidCounter = 0;
  const sandbox = {
    document, console, setTimeout, clearTimeout, URL, URLSearchParams,
    supa,
    crypto: { randomUUID: () => 'uuid-' + (++uuidCounter) },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(modSrc, sandbox, { filename: 'js/screens/ordem-compra-receipt-cutover.js' });
  return { sandbox, supa };
}

function api(sandbox) {
  return vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover', sandbox);
}

// -----------------------------------------------------------------------------
// attemptCanonicalRead
// -----------------------------------------------------------------------------

test('5. canonical read success maps rows into the legacy shape (item grain)', async () => {
  const { sandbox } = makeSandbox({
    listar_ordens_compra_fio_compat: () => ({
      data: [{
        ordens_compra_fio_id: 42, ordem_compra_id: 9, ordem_compra_item_id: 5,
        pedido_id: 'p-1', op_id: 7, op_ids_multiplos: false, op_numero: 12, op_ano: 2026,
        op_label: 'Nº 12/2026', fornecedor_id: 3, fornecedor_nome: 'Fio SA',
        tipo: 'algodao', material: 'algodao', cor_id: 2, cor_nome: 'Azul', cor_poliester: null,
        kg_pedido: 100, kg_recebido: 40, kg_recebido_atribuido: 40, kg_excesso: 0,
        status: 'recebido_parcial', status_administrativo: 'emitida', status_aceite: 'nao_aplicavel',
        status_recebimento: 'parcial', data_recebimento: '2026-07-20', alocacoes: [],
      }],
      error: null,
    }),
  });
  const result = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalRead({ pedidoId: "p-1" })', sandbox);
  assert.equal(result.outcome, 'canonical_success');
  assert.equal(result.rows.length, 1);
  // JSON round-trip strips the vm.Context's separate Object realm (a
  // structurally-identical plain object from the sandbox is not
  // reference-equal under node:assert/strict's deepEqual prototype check).
  assert.deepEqual(JSON.parse(JSON.stringify(result.rows[0])), {
    id: 42, op_id: 7, ops: { numero: 12, ano: 2026 }, tipo: 'algodao', material: 'algodao',
    cor_id: 2, cor_poliester: null, kg_pedido: 100, kg_recebido: 40, status: 'recebido_parcial',
    status_administrativo: 'emitida', status_aceite: 'nao_aplicavel', status_recebimento: 'parcial',
    data_recebimento: '2026-07-20', fornecedor_id: 3, aceite_exigido_na_emissao: null,
    legado_recebimento_automatico: null, cores: { id: 2, nome: 'Azul' },
  });
});

test('6. reader listar_compat_inativo (55000) permits fallback', async () => {
  const { sandbox } = makeSandbox({
    listar_ordens_compra_fio_compat: () => ({ data: null, error: { code: '55000', message: 'listar_compat_inativo' } }),
  });
  const result = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalRead({ opId: 7 })', sandbox);
  assert.equal(result.outcome, 'legacy_fallback');
});

test('7. reader bounded 42883 (undefined_function) permits fallback', async () => {
  const { sandbox } = makeSandbox({
    listar_ordens_compra_fio_compat: () => ({ data: null, error: { code: '42883', message: 'function public.listar_ordens_compra_fio_compat(uuid, bigint) does not exist' } }),
  });
  const result = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalRead({ opId: 7 })', sandbox);
  assert.equal(result.outcome, 'legacy_fallback');
});

test('8. reader sem_permissao (42501) fails closed, never falls back', async () => {
  const { sandbox } = makeSandbox({
    listar_ordens_compra_fio_compat: () => ({ data: null, error: { code: '42501', message: 'sem_permissao' } }),
  });
  const result = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalRead({ opId: 7 })', sandbox);
  assert.equal(result.outcome, 'hard_failure');
});

test('9. reader unrecognized error fails closed (not classified as inactive)', async () => {
  const { sandbox } = makeSandbox({
    listar_ordens_compra_fio_compat: () => ({ data: null, error: { code: '55000', message: 'estado_cutover_invalido' } }),
  });
  const result = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalRead({ opId: 7 })', sandbox);
  assert.equal(result.outcome, 'hard_failure', 'a different 55000 message must not be classified as listar_compat_inativo');
});

// -----------------------------------------------------------------------------
// attemptCanonicalReceipt
// -----------------------------------------------------------------------------

function receiptParams() {
  return { ordensCompraFioId: 42, kgTotalAbsoluto: 40, dataRecebimento: '2026-07-20' };
}

test('10. canonical receipt success returns canonical_success, never fallback', async () => {
  const { sandbox } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: { ok: true, codigo: 'ok', recebimento_id: 1, ordem_compra_id: 9 }, error: null }),
  });
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__attempt = attempt;
  const result = await vm.runInContext(
    `window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  assert.equal(result.outcome, 'canonical_success');
});

test('11. writer recebimento_compat_inativo permits fallback', async () => {
  const { sandbox } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: { ok: false, codigo: 'recebimento_compat_inativo' }, error: null }),
  });
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__attempt = attempt;
  const result = await vm.runInContext(
    `window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  assert.equal(result.outcome, 'legacy_fallback');
});

test('12. writer bounded 42883 (transport error) permits fallback', async () => {
  const { sandbox } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: null, error: { code: '42883', message: 'function public.registrar_recebimento_ordem_compra_fio_compat(...) does not exist' } }),
  });
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__attempt = attempt;
  const result = await vm.runInContext(
    `window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  assert.equal(result.outcome, 'legacy_fallback');
});

for (const codigo of [
  'sem_permissao', 'estado_invalido', 'mapeamento_compat_ausente',
  'decremento_exige_admin', 'reducao_abaixo_saldo_importado', 'excede_estornavel',
  'kg_absoluto_invalido', 'idempotencia_conflitante', 'erro_interno',
]) {
  test(`13-21. writer ${codigo} fails closed (never a legacy fallback)`, async () => {
    const { sandbox } = makeSandbox({
      registrar_recebimento_ordem_compra_fio_compat: () => ({ data: { ok: false, codigo }, error: null }),
    });
    const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
    sandbox.__attempt = attempt;
    const result = await vm.runInContext(
      `window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
    assert.equal(result.outcome, 'hard_failure', `codigo ${codigo} must fail closed, not fall back`);
  });
}

test('22. writer transport-level unrecognized error fails closed', async () => {
  const { sandbox } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: null, error: { code: '08006', message: 'connection timeout' } }),
  });
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__attempt = attempt;
  const result = await vm.runInContext(
    `window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  assert.equal(result.outcome, 'hard_failure');
});

// -----------------------------------------------------------------------------
// Idempotency lifecycle
// -----------------------------------------------------------------------------

test('23. createReceiptAttempt mints a non-empty token', async () => {
  const { sandbox } = makeSandbox({});
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  assert.equal(typeof attempt.token, 'string');
  assert.ok(attempt.token.length > 0);
});

test('24. same attempt reused across a retry sends the identical idempotency key twice', async () => {
  const { sandbox, supa } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: { ok: false, codigo: 'erro_interno' }, error: null }),
  });
  const attempt = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__attempt = attempt;
  await vm.runInContext(`window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  await vm.runInContext(`window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __attempt)`, sandbox);
  const rpcCalls = supa._calls.filter((c) => c.op === 'rpc' && c.name === 'registrar_recebimento_ordem_compra_fio_compat');
  assert.equal(rpcCalls.length, 2, 'expected 2 attempts (the original + the retry)');
  assert.equal(rpcCalls[0].params.p_idempotency_key, rpcCalls[1].params.p_idempotency_key,
    'a retry of the same attempt must reuse the token verbatim');
});

test('25. a new user submission (new attempt) receives a different token than a prior attempt', async () => {
  const { sandbox } = makeSandbox({});
  const a = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  const b = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  assert.notEqual(a.token, b.token);
});

test('26. two distinct same-date submissions do not share a token (identity is the attempt, not the date)', async () => {
  const { sandbox, supa } = makeSandbox({
    registrar_recebimento_ordem_compra_fio_compat: () => ({ data: { ok: true, codigo: 'ok', recebimento_id: 1, ordem_compra_id: 9 }, error: null }),
  });
  const a = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__a = a;
  await vm.runInContext(`window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __a)`, sandbox);
  const b = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.createReceiptAttempt()', sandbox);
  sandbox.__b = b;
  await vm.runInContext(`window.RAVATEX_SCREENS.ordemCompraReceiptCutover.attemptCanonicalReceipt(${JSON.stringify(receiptParams())}, __b)`, sandbox);
  const rpcCalls = supa._calls.filter((c) => c.op === 'rpc' && c.name === 'registrar_recebimento_ordem_compra_fio_compat');
  assert.equal(rpcCalls.length, 2);
  assert.notEqual(rpcCalls[0].params.p_idempotency_key, rpcCalls[1].params.p_idempotency_key,
    'two genuinely new submissions on the same date must not share an idempotency key');
});

// -----------------------------------------------------------------------------
// isLegacyReceiptFenced
// -----------------------------------------------------------------------------

test('27. isLegacyReceiptFenced detects exactly the fenced signal', async () => {
  const { sandbox } = makeSandbox({});
  const positive = await vm.runInContext(
    "window.RAVATEX_SCREENS.ordemCompraReceiptCutover.isLegacyReceiptFenced({ code: '55000', message: 'legacy_receipt_fenced' })", sandbox);
  assert.equal(positive, true);
});

test('28. isLegacyReceiptFenced does not match a different 55000 message', async () => {
  const { sandbox } = makeSandbox({});
  const negative = await vm.runInContext(
    "window.RAVATEX_SCREENS.ordemCompraReceiptCutover.isLegacyReceiptFenced({ code: '55000', message: 'estado_cutover_invalido' })", sandbox);
  assert.equal(negative, false);
});

test('29. isLegacyReceiptFenced returns false for a null/undefined error', async () => {
  const { sandbox } = makeSandbox({});
  const negative = await vm.runInContext('window.RAVATEX_SCREENS.ordemCompraReceiptCutover.isLegacyReceiptFenced(null)', sandbox);
  assert.equal(negative, false);
});
