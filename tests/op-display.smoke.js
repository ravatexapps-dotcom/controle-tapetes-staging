// =====================================================================
// === tests/op-display.smoke.js ========================================
// Smoke do helper central de identificacao operacional de OP
// (js/op-display.js -> window.RAVATEX_OP_DISPLAY).
//
// Fase: RAVATEX-TAPETES-OP-OPERATIONAL-CODE-HELPER-B
// Contrato: OP {pedido_numero}/{pedido_ano}-{tipo}{seq}
//   - pedido_ano = year(pedido.criado_em)
//   - T = tecelagem, A = latex/acabamento
//   - seq de 2 digitos por Pedido + Tipo, ordenado por criado_em/id
//   - fallback legado `OP {numero}/{ano}` sem contexto confiavel
//
// Puro/estatico: nao executa o app nem acessa Supabase.
// =====================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const HELPER = path.join(ROOT, 'js', 'op-display.js');
const INDEX = path.join(ROOT, 'index.html');

function loadApi() {
  const src = fs.readFileSync(HELPER, 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/op-display.js' });
  return sandbox.window.RAVATEX_OP_DISPLAY;
}

const pedido = { id: 'p1', numero: 21, criado_em: '2026-03-15T10:00:00Z' };

// ---------------------------------------------------------------------
// 1. Existencia / API
// ---------------------------------------------------------------------

test('op-display: arquivo existe e sintaxe valida', () => {
  assert.ok(fs.existsSync(HELPER), 'js/op-display.js ausente');
  require('node:child_process').execFileSync(process.execPath, ['--check', HELPER], { stdio: 'pipe' });
});

test('op-display: expoe API central em window.RAVATEX_OP_DISPLAY', () => {
  const api = loadApi();
  assert.ok(api, 'window.RAVATEX_OP_DISPLAY ausente');
  for (const fn of ['getOpTypeLetter', 'getPedidoOperationalYear', 'buildOpOperationalSequence', 'formatOpOperationalCode', 'formatOpLegacyCode']) {
    assert.equal(typeof api[fn], 'function', 'funcao ausente: ' + fn);
  }
});

test('index.html: carrega js/op-display.js antes dos consumidores de Pedido', () => {
  const index = fs.readFileSync(INDEX, 'utf8');
  assert.match(index, /<script src="js\/op-display\.js/, 'index.html deve carregar js/op-display.js');
  const posDisplay = index.indexOf('js/op-display.js');
  const posChain = index.indexOf('js/screens/pedido-chain-state.js');
  const posProgress = index.indexOf('js/screens/pedido-detail-progress.js');
  const posPainel = index.indexOf('js/screens/painel.js');
  assert.ok(posDisplay > -1 && posChain > -1 && posProgress > -1, 'scripts esperados ausentes');
  assert.ok(posDisplay < posChain, 'op-display deve carregar antes de pedido-chain-state');
  assert.ok(posDisplay < posProgress, 'op-display deve carregar antes de pedido-detail-progress');
  assert.ok(posDisplay < posPainel, 'op-display deve carregar antes de painel');
});

// ---------------------------------------------------------------------
// 2. Letra do tipo (T/A) e ano
// ---------------------------------------------------------------------

test('op-display: tipo tecelagem -> T, latex/acabamento -> A, desconhecido -> null', () => {
  const api = loadApi();
  assert.equal(api.getOpTypeLetter({ tipo: 'tecelagem' }), 'T');
  assert.equal(api.getOpTypeLetter({ tipo: 'latex' }), 'A');
  assert.equal(api.getOpTypeLetter({ tipo: 'acabamento' }), 'A');
  assert.equal(api.getOpTypeLetter({ tipo: 'LATEX' }), 'A', 'normaliza caixa');
  assert.equal(api.getOpTypeLetter({ tipo: 'outro' }), null);
  assert.equal(api.getOpTypeLetter(null), null);
});

test('op-display: ano operacional vem de year(pedido.criado_em)', () => {
  const api = loadApi();
  assert.equal(api.getPedidoOperationalYear({ criado_em: '2026-03-15T10:00:00Z' }), 2026);
  assert.equal(api.getPedidoOperationalYear({ criado_em: '2025-12-31T23:00:00Z' }), 2025);
  assert.equal(api.getPedidoOperationalYear({}), null, 'sem criado_em => null');
  assert.equal(api.getPedidoOperationalYear(null), null);
});

// ---------------------------------------------------------------------
// 3. Codigo operacional — casos obrigatorios do contrato
// ---------------------------------------------------------------------

test('CASO: uma OP Tecelagem no Pedido => OP 21/2026-T01', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  const code = api.formatOpOperationalCode(op, { pedido, ops: [op] });
  assert.equal(code, 'OP 21/2026-T01');
});

test('CASO: duas OPs Tecelagem no mesmo Pedido => T01, T02 por ordem de criacao', () => {
  const api = loadApi();
  const t1 = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  const t2 = { id: 101, numero: 15, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-16T10:00:00Z' };
  const ops = [t2, t1]; // fora de ordem de proposito
  assert.equal(api.formatOpOperationalCode(t1, { pedido, ops }), 'OP 21/2026-T01');
  assert.equal(api.formatOpOperationalCode(t2, { pedido, ops }), 'OP 21/2026-T02');
});

test('CASO: duas OPs Acabamento/Latex no mesmo Pedido => A01, A02', () => {
  const api = loadApi();
  const a1 = { id: 200, numero: 11, ano: 2026, tipo: 'latex', criado_em: '2026-03-17T10:00:00Z' };
  const a2 = { id: 201, numero: 12, ano: 2026, tipo: 'latex', criado_em: '2026-03-18T10:00:00Z' };
  const ops = [a1, a2];
  assert.equal(api.formatOpOperationalCode(a1, { pedido, ops }), 'OP 21/2026-A01');
  assert.equal(api.formatOpOperationalCode(a2, { pedido, ops }), 'OP 21/2026-A02');
});

test('CASO: Tecelagem e Acabamento com MESMO numero/ano legado => codigos T/A distintos', () => {
  const api = loadApi();
  // op_numeros conta por (tipo, ano): tecelagem e latex podem colidir em 5/2026.
  const tec = { id: 300, numero: 5, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-10T10:00:00Z' };
  const lat = { id: 301, numero: 5, ano: 2026, tipo: 'latex', criado_em: '2026-03-11T10:00:00Z' };
  const ops = [tec, lat];
  const codeTec = api.formatOpOperationalCode(tec, { pedido, ops });
  const codeLat = api.formatOpOperationalCode(lat, { pedido, ops });
  assert.equal(codeTec, 'OP 21/2026-T01');
  assert.equal(codeLat, 'OP 21/2026-A01');
  assert.notEqual(codeTec, codeLat, 'legado ambiguo 5/2026 deve virar codigos distintos');
});

test('CASO: sequencial por Pedido+Tipo e independente da colisao entre tipos', () => {
  const api = loadApi();
  const tec1 = { id: 300, numero: 5, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-10T10:00:00Z' };
  const lat1 = { id: 301, numero: 5, ano: 2026, tipo: 'latex', criado_em: '2026-03-11T10:00:00Z' };
  const lat2 = { id: 302, numero: 6, ano: 2026, tipo: 'latex', criado_em: '2026-03-12T10:00:00Z' };
  const ops = [tec1, lat1, lat2];
  assert.equal(api.formatOpOperationalCode(tec1, { pedido, ops }), 'OP 21/2026-T01');
  assert.equal(api.formatOpOperationalCode(lat1, { pedido, ops }), 'OP 21/2026-A01');
  assert.equal(api.formatOpOperationalCode(lat2, { pedido, ops }), 'OP 21/2026-A02');
});

// ---------------------------------------------------------------------
// 4. Ordenacao criado_em asc, desempate id asc
// ---------------------------------------------------------------------

test('ordenacao: criado_em asc define o sequencial', () => {
  const api = loadApi();
  const later = { id: 10, numero: 30, ano: 2026, tipo: 'tecelagem', criado_em: '2026-05-01T10:00:00Z' };
  const earlier = { id: 20, numero: 31, ano: 2026, tipo: 'tecelagem', criado_em: '2026-04-01T10:00:00Z' };
  const ops = [later, earlier];
  assert.equal(api.buildOpOperationalSequence(earlier, ops), 1, 'mais antigo por criado_em = 01');
  assert.equal(api.buildOpOperationalSequence(later, ops), 2);
});

test('ordenacao: id asc como desempate quando criado_em coincide/ausente', () => {
  const api = loadApi();
  const b = { id: 50, numero: 40, ano: 2026, tipo: 'latex' };
  const a = { id: 40, numero: 41, ano: 2026, tipo: 'latex' };
  const ops = [b, a];
  assert.equal(api.buildOpOperationalSequence(a, ops), 1, 'menor id = 01 quando sem criado_em');
  assert.equal(api.buildOpOperationalSequence(b, ops), 2);
});

// ---------------------------------------------------------------------
// 5. Fallback legado
// ---------------------------------------------------------------------

test('FALLBACK: sem Pedido => OP {numero}/{ano}', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  assert.equal(api.formatOpOperationalCode(op, { pedido: null, ops: [op] }), 'OP 14/2026');
  assert.equal(api.formatOpOperationalCode(op, {}), 'OP 14/2026');
  assert.equal(api.formatOpOperationalCode(op, null), 'OP 14/2026');
});

test('FALLBACK: sem pedido.criado_em => OP {numero}/{ano}', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  const pedidoSemData = { id: 'p1', numero: 21 };
  assert.equal(api.formatOpOperationalCode(op, { pedido: pedidoSemData, ops: [op] }), 'OP 14/2026');
});

test('FALLBACK: sem pedido.numero => OP {numero}/{ano}', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  const pedidoSemNumero = { id: 'p1', criado_em: '2026-03-15T10:00:00Z' };
  assert.equal(api.formatOpOperationalCode(op, { pedido: pedidoSemNumero, ops: [op] }), 'OP 14/2026');
});

test('FALLBACK: OP fora da lista de irmas (sem seq confiavel) => legado', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'tecelagem', criado_em: '2026-03-15T10:00:00Z' };
  assert.equal(api.formatOpOperationalCode(op, { pedido, ops: [] }), 'OP 14/2026');
  assert.equal(api.formatOpOperationalCode(op, { pedido, siblingOps: null }), 'OP 14/2026');
});

test('FALLBACK: tipo desconhecido => legado', () => {
  const api = loadApi();
  const op = { id: 100, numero: 14, ano: 2026, tipo: 'expedicao', criado_em: '2026-03-15T10:00:00Z' };
  assert.equal(api.formatOpOperationalCode(op, { pedido, ops: [op] }), 'OP 14/2026');
});

test('formatOpLegacyCode: OP {numero}/{ano} e tolerante a campos ausentes', () => {
  const api = loadApi();
  assert.equal(api.formatOpLegacyCode({ numero: 7, ano: 2026 }), 'OP 7/2026');
  assert.equal(api.formatOpLegacyCode({ numero: 7 }), 'OP 7');
  assert.equal(api.formatOpLegacyCode(null), 'OP -');
});

// ---------------------------------------------------------------------
// 6. Nao inventa ID persistido e nao infla para 3 digitos < 100
// ---------------------------------------------------------------------

test('op-display: nao usa formato inventado tipo P18-T16-L5 nem persiste codigo', () => {
  const src = fs.readFileSync(HELPER, 'utf8');
  assert.doesNotMatch(src, /P\d{2}-T\d{2}-L\d{2}/);
  assert.doesNotMatch(src, /codigo_operacional|op_lineage_id|codigo_lineage/);
});

test('op-display: seq com 2 digitos (padStart) e >=100 preserva digitos', () => {
  const api = loadApi();
  const ops = [];
  for (let i = 1; i <= 12; i++) {
    ops.push({ id: i, numero: i, ano: 2026, tipo: 'tecelagem', criado_em: '2026-01-' + String(i).padStart(2, '0') + 'T10:00:00Z' });
  }
  assert.equal(api.formatOpOperationalCode(ops[0], { pedido, ops }), 'OP 21/2026-T01');
  assert.equal(api.formatOpOperationalCode(ops[8], { pedido, ops }), 'OP 21/2026-T09');
  assert.equal(api.formatOpOperationalCode(ops[9], { pedido, ops }), 'OP 21/2026-T10');
  assert.equal(api.formatOpOperationalCode(ops[11], { pedido, ops }), 'OP 21/2026-T12');
});
