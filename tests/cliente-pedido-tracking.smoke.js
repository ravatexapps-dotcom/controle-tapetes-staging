// =====================================================================
// === tests/cliente-pedido-tracking.smoke.js ===========================
// Smoke estático + dinâmico para o componente
// js/screens/cliente-pedido-tracking.js (`buildClientePedidoTrackingCard`).
//
// Fase: RAVATEX-TAPETES-PEDIDOS-CLIENTE-TRACKING-UI-A
// Escopo: valida que o componente de acompanhamento visual do cliente
// é sanitizado, somente apresentação (sem Supabase, sem writes), e
// que o stepper / banner / exceção de cancelamento renderizam o
// texto esperado. Garante:
//   - arquivo existe e sintaxe JS válida;
//   - expõe window.buildClientePedidoTrackingCard e
//     window.RAVATEX_SCREENS.clientePedidoTracking;
//   - as 6 etapas (Recebido, Confirmado, Em produção, Em acabamento,
//     Pronto para entrega, Entregue) aparecem no DOM renderizado;
//   - NÃO referencia OP, lote, fornecedor, token, custo;
//   - NÃO faz insert/update/delete/rpc/functions.invoke;
//   - NÃO referencia window.supa (componente é puramente apresentação);
//   - status 'cancelado' tem tratamento próprio (substitui o stepper);
//   - index.html carrega o script entre cliente-pedidos-list.js e
//     cliente-pedido-detail.js.
//
// Não executa o app nem acessa Supabase real.
// =====================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SCREEN = path.join(ROOT, 'js', 'screens', 'cliente-pedido-tracking.js');
const INDEX = path.join(ROOT, 'index.html');

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo não encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const screen = readOrFail(SCREEN);
const index = readOrFail(INDEX);

// ---------------------------------------------------------------------
// 1. Existência e sintaxe
// ---------------------------------------------------------------------

test('cliente-pedido-tracking: arquivo existe', () => {
  assert.ok(fs.existsSync(SCREEN), 'js/screens/cliente-pedido-tracking.js ausente');
});

test('cliente-pedido-tracking: sintaxe JS válida (node --check)', () => {
  require('node:child_process').execFileSync(
    process.execPath, ['--check', SCREEN], { stdio: 'pipe' }
  );
});

test('cliente-pedido-tracking: script clássico (não ES module)', () => {
  assert.equal(/^\s*export\s+/m.test(screen), false, 'deve ser script clássico');
  assert.equal(/import\s+.*\s+from\s+/.test(screen), false, 'deve ser script clássico');
});

// ---------------------------------------------------------------------
// 2. Namespace
// ---------------------------------------------------------------------

test('cliente-pedido-tracking: expõe window.buildClientePedidoTrackingCard', () => {
  assert.match(screen, /window\.buildClientePedidoTrackingCard\s*=\s*buildClientePedidoTrackingCard/);
});

test('cliente-pedido-tracking: expõe RAVATEX_SCREENS.clientePedidoTracking', () => {
  assert.match(screen, /RAVATEX_SCREENS\.clientePedidoTracking/);
});

// ---------------------------------------------------------------------
// 3. Sanitização estática — NÃO referencia dados internos
// ---------------------------------------------------------------------

test('cliente-pedido-tracking: NÃO referencia OP', () => {
  assert.equal(/\bop\b/i.test(screen), false, 'não deve referenciar OP');
});

test('cliente-pedido-tracking: NÃO referencia lote', () => {
  assert.equal(/\blote\b/i.test(screen), false, 'não deve referenciar lote');
});

test('cliente-pedido-tracking: NÃO referencia fornecedor', () => {
  assert.equal(/fornecedor/i.test(screen), false, 'não deve referenciar fornecedor');
});

test('cliente-pedido-tracking: NÃO referencia token', () => {
  assert.equal(/\btoken\b/i.test(screen), false, 'não deve referenciar token');
});

test('cliente-pedido-tracking: NÃO referencia custo/margem', () => {
  assert.equal(/\bcusto\b/i.test(screen), false, 'não deve referenciar custo');
  assert.equal(/\bmargem\b/i.test(screen), false, 'não deve referenciar margem');
});

test('cliente-pedido-tracking: NÃO referencia service_role', () => {
  assert.equal(/service_role/.test(screen), false, 'não deve referenciar service_role');
});

// ---------------------------------------------------------------------
// 4. Sem Supabase / sem writes — componente é apresentação pura
// ---------------------------------------------------------------------

test('cliente-pedido-tracking: NÃO referencia window.supa (sem acesso a dados)', () => {
  assert.equal(/window\.supa/.test(screen), false, 'componente não deve consultar Supabase');
});

test('cliente-pedido-tracking: NÃO faz insert/update/delete', () => {
  assert.equal(/\.insert\s*\(/.test(screen), false, 'não deve fazer insert');
  assert.equal(/\.update\s*\(/.test(screen), false, 'não deve fazer update');
  assert.equal(/\.delete\s*\(/.test(screen), false, 'não deve fazer delete');
});

test('cliente-pedido-tracking: NÃO usa rpc nem functions.invoke', () => {
  assert.equal(/\.rpc\s*\(/.test(screen), false, 'não deve chamar rpc');
  assert.equal(/functions\.invoke/.test(screen), false, 'não deve chamar functions.invoke');
});

// ---------------------------------------------------------------------
// 5. Renderização dinâmica — stepper + banner + exceção cancelado
// ---------------------------------------------------------------------

function makeElStub() {
  function el(tag, attrs) {
    const node = { tag: tag, attrs: attrs || {}, children: [] };
    const rest = Array.prototype.slice.call(arguments, 2);
    const flat = [];
    rest.forEach((c) => { if (Array.isArray(c)) flat.push(...c); else flat.push(c); });
    flat.forEach((c) => {
      if (c == null || c === false) return;
      node.children.push(typeof c === 'string' ? { tag: '#text', text: c } : c);
    });
    node.appendChild = function (n) { if (n != null) node.children.push(n); return n; };
    return node;
  }
  function collectText(node) {
    if (!node) return '';
    if (node.tag === '#text') return node.text;
    let out = '';
    (node.children || []).forEach((c) => { out += collectText(c) + ' '; });
    return out;
  }
  return { el, collectText };
}

function renderCard(pedido) {
  const stub = makeElStub();
  const sandbox = { window: { el: stub.el }, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(screen, sandbox, { filename: 'js/screens/cliente-pedido-tracking.js' });
  const node = vm.runInContext('window.buildClientePedidoTrackingCard', sandbox)(pedido);
  return stub.collectText(node);
}

const ETAPAS_ESPERADAS = [
  'Recebido', 'Confirmado', 'Em produção', 'Em acabamento', 'Pronto para entrega', 'Entregue',
];

test('cliente-pedido-tracking: renderiza as 6 etapas para status "recebido"', () => {
  const texto = renderCard({ status: 'recebido' });
  for (const etapa of ETAPAS_ESPERADAS) {
    assert.ok(texto.includes(etapa), `etapa "${etapa}" não apareceu no card renderizado`);
  }
});

test('cliente-pedido-tracking: renderiza as 6 etapas para status "confirmado"', () => {
  const texto = renderCard({ status: 'confirmado' });
  for (const etapa of ETAPAS_ESPERADAS) {
    assert.ok(texto.includes(etapa), `etapa "${etapa}" não apareceu no card renderizado`);
  }
});

test('cliente-pedido-tracking: pedido nulo não lança erro e devolve nó vazio', () => {
  const texto = renderCard(null);
  assert.equal(texto.trim(), '');
});

test('cliente-pedido-tracking: status "cancelado" tem tratamento próprio (sem stepper normal)', () => {
  const texto = renderCard({ status: 'cancelado' });
  assert.match(texto, /cancelado/i, 'mensagem de cancelamento não apareceu');
  assert.equal(texto.includes('Em produção'), false,
    'status cancelado não deve renderizar o stepper normal de 6 etapas');
});

test('cliente-pedido-tracking: status sem mapeamento (ex.: "produzindo") fica neutro, sem etapa "atual"', () => {
  const texto = renderCard({ status: 'produzindo' });
  assert.equal(texto.includes('em andamento'), false,
    'status sem mapeamento explícito não deve marcar nenhuma etapa como atual');
  for (const etapa of ETAPAS_ESPERADAS) {
    assert.ok(texto.includes(etapa), `etapa "${etapa}" ainda deve aparecer (neutra) para status sem mapeamento`);
  }
});

// ---------------------------------------------------------------------
// 6. index.html — carregamento do script
// ---------------------------------------------------------------------

test('index.html carrega js/screens/cliente-pedido-tracking.js EXATAMENTE UMA VEZ', () => {
  const matches = index.match(/js\/screens\/cliente-pedido-tracking\.js/g) || [];
  assert.equal(matches.length, 1, 'cliente-pedido-tracking.js deve ser carregado exatamente 1 vez');
});

test('index.html: cliente-pedido-tracking.js vem depois de cliente-pedidos-list.js e antes de cliente-pedido-detail.js', () => {
  const idxList = index.indexOf('js/screens/cliente-pedidos-list.js');
  const idxTracking = index.indexOf('js/screens/cliente-pedido-tracking.js');
  const idxDetail = index.indexOf('js/screens/cliente-pedido-detail.js');
  assert.ok(idxList > 0, 'cliente-pedidos-list.js deve estar no <head>');
  assert.ok(idxTracking > 0, 'cliente-pedido-tracking.js deve estar no <head>');
  assert.ok(idxDetail > 0, 'cliente-pedido-detail.js deve estar no <head>');
  assert.ok(idxList < idxTracking, 'cliente-pedido-tracking.js deve vir depois de cliente-pedidos-list.js');
  assert.ok(idxTracking < idxDetail, 'cliente-pedido-tracking.js deve vir antes de cliente-pedido-detail.js');
});
