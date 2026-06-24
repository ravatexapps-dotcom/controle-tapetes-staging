// =====================================================================
// === tests/cliente-pedido-detail.smoke.js =============================
// Smoke estático para a tela cliente js/screens/cliente-pedido-detail.js
// (`screenClientePedidoDetalhe`).
//
// Fase: RAVATEX-TAPETES-PEDIDOS-CLIENTE-UI-A
// Escopo: valida que o detalhe cliente é sanitizado, read-only, sem
// exposição de dados internos. Garante:
//   - arquivo existe e sintaxe JS válida;
//   - expõe window.screenClientePedidoDetalhe;
//   - usa from('pedidos') e from('pedido_itens');
//   - NÃO mostra cliente_id, token_acesso, pedido_eventos, OP, lote,
//     fornecedor, custos internos;
//   - NÃO tem botão de edição, cancelamento, criar pedido;
//   - trata UUID inválido;
//   - trata pedido não encontrado / sem permissão;
//   - NÃO faz insert/update/delete/rpc;
//   - NÃO chama functions.invoke;
//   - NÃO usa service_role;
//   - usa helpers de preview de cor de pedido-ui.js;
//   - usa clienteShellLayout.
//
// Não executa o app nem acessa Supabase real.
// =====================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCREEN = path.join(ROOT, 'js', 'screens', 'cliente-pedido-detail.js');
const LIST = path.join(ROOT, 'js', 'screens', 'cliente-pedidos-list.js');
const COMMON_CLI = path.join(ROOT, 'js', 'screens', 'cliente-common.js');
const ROUTER = path.join(ROOT, 'js', 'router.js');
const INDEX = path.join(ROOT, 'index.html');

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo não encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const screen = readOrFail(SCREEN);
const router = readOrFail(ROUTER);
const index = readOrFail(INDEX);

// ---------------------------------------------------------------------
// 1. Existência e sintaxe
// ---------------------------------------------------------------------

test('cliente-pedido-detail: arquivo existe', () => {
  assert.ok(fs.existsSync(SCREEN), 'js/screens/cliente-pedido-detail.js ausente');
});

test('cliente-pedido-detail: sintaxe JS válida (node --check)', () => {
  const { execSync } = require('node:child_process');
  execSync(`node --check "${SCREEN}"`, { stdio: 'pipe' });
});

test('cliente-pedido-detail: script clássico (não ES module)', () => {
  assert.equal(/^\s*export\s+/m.test(screen), false, 'deve ser script clássico');
  assert.equal(/import\s+.*\s+from\s+/.test(screen), false, 'deve ser script clássico');
});

// ---------------------------------------------------------------------
// 2. Namespace
// ---------------------------------------------------------------------

test('cliente-pedido-detail: expõe window.screenClientePedidoDetalhe', () => {
  assert.match(screen, /window\.screenClientePedidoDetalhe\s*=\s*screenClientePedidoDetalhe/);
});

test('cliente-pedido-detail: expõe RAVATEX_SCREENS.clientePedidoDetail', () => {
  assert.match(screen, /RAVATEX_SCREENS\.clientePedidoDetail/);
});

// ---------------------------------------------------------------------
// 3. Router — match dinâmico para #/cliente/pedidos/<uuid>
// ---------------------------------------------------------------------

test('router.js: matchRoute reconhece #/cliente/pedidos/<uuid>', () => {
  assert.match(router, /cliente\\\/pedidos\\\//);
});

test('router.js: matchRoute #/cliente/pedidos/<uuid> role é ["cliente"]', () => {
  assert.match(router, /roles:\s*\[['"]cliente['"]\]/);
});

// ---------------------------------------------------------------------
// 4. SELECTs — usa from('pedidos') e from('pedido_itens')
// ---------------------------------------------------------------------

test('cliente-pedido-detail: usa from(\'pedidos\')', () => {
  assert.match(screen, /from\(['"]pedidos['"]\)/);
});

test('cliente-pedido-detail: usa from(\'pedido_itens\')', () => {
  assert.match(screen, /from\(['"]pedido_itens['"]\)/);
});

test('cliente-pedido-detail: usa from(\'modelos\')', () => {
  assert.match(screen, /from\(['"]modelos['"]\)/);
});

test('cliente-pedido-detail: usa from(\'cores\')', () => {
  assert.match(screen, /from\(['"]cores['"]\)/);
});

// ---------------------------------------------------------------------
// 5. Sanitização — NÃO expõe campos internos
// ---------------------------------------------------------------------

test('cliente-pedido-detail: NÃO expõe cliente_id no select de pedidos', () => {
  // O select do pedido no detalhe cliente não deve incluir cliente_id.
  // Verifica o padrão .select(...cliente_id...)
  const selectPedidosMatch = screen.match(/\.select\(['"]/g);
  let foundClienteIdInSelect = false;
  // Pega o primeiro .select (que é o do pedidos) - verifica se contém cliente_id
  const selectRe = /\.select\(['"]([^'"]*)['"]\)/g;
  let m;
  while ((m = selectRe.exec(screen)) !== null) {
    if (m[1].includes('cliente_id')) {
      foundClienteIdInSelect = true;
    }
  }
  assert.equal(foundClienteIdInSelect, false, 'select de pedidos no detalhe cliente não deve expor cliente_id');
});

test('cliente-pedido-detail: NÃO expõe token_acesso', () => {
  assert.equal(/token_acesso/.test(screen), false, 'não deve expor token_acesso');
});

test('cliente-pedido-detail: NÃO expõe pedido_eventos', () => {
  assert.equal(/pedido_eventos/.test(screen), false, 'não deve expor pedido_eventos');
});

test('cliente-pedido-detail: NÃO referencia OP', () => {
  assert.equal(/\bop\b/i.test(screen), false, 'não deve referenciar OP');
});

test('cliente-pedido-detail: NÃO referencia lote', () => {
  assert.equal(/\blote\b/i.test(screen), false, 'não deve referenciar lote');
});

test('cliente-pedido-detail: NÃO referencia fornecedor', () => {
  assert.equal(/fornecedor/i.test(screen), false, 'não deve referenciar fornecedor');
});

test('cliente-pedido-detail: NÃO referencia service_role', () => {
  assert.equal(/service_role/.test(screen), false, 'não deve referenciar service_role');
});

test('cliente-pedido-detail: NÃO referencia functions.invoke', () => {
  assert.equal(/functions\.invoke/.test(screen), false, 'não deve chamar functions.invoke');
});

// ---------------------------------------------------------------------
// 6. Read-only — sem insert/update/delete
// ---------------------------------------------------------------------

test('cliente-pedido-detail: NÃO faz insert', () => {
  assert.equal(/\.insert\s*\(/.test(screen), false, 'não deve fazer insert');
});

test('cliente-pedido-detail: NÃO faz update', () => {
  assert.equal(/\.update\s*\(/.test(screen), false, 'não deve fazer update');
});

test('cliente-pedido-detail: NÃO faz delete', () => {
  assert.equal(/\.delete\s*\(/.test(screen), false, 'não deve fazer delete');
});

test('cliente-pedido-detail: NÃO usa rpc', () => {
  assert.equal(/\.rpc\s*\(/.test(screen), false, 'não deve chamar rpc');
});

// ---------------------------------------------------------------------
// 7. Sem botões de admin (editar, cancelar, criar)
// ---------------------------------------------------------------------

test('cliente-pedido-detail: NÃO tem botão Editar', () => {
  assert.equal(/Editar/i.test(screen), false, 'não deve ter botão Editar');
});

test('cliente-pedido-detail: NÃO tem botão Cancelar', () => {
  assert.equal(/Cancelar pedido/i.test(screen), false, 'não deve ter botão Cancelar pedido');
});

test('cliente-pedido-detail: NÃO tem botão Confirmar', () => {
  assert.equal(/Confirmar pedido/i.test(screen), false, 'não deve ter botão Confirmar pedido');
});

test('cliente-pedido-detail: NÃO tem botão "Editar itens"', () => {
  assert.equal(/Editar itens/i.test(screen), false, 'não deve ter botão Editar itens');
});

// ---------------------------------------------------------------------
// 8. Tratamento de erros
// ---------------------------------------------------------------------

test('cliente-pedido-detail: valida UUID antes de consultar', () => {
  assert.match(screen, /UUID_RE\.test/);
});

test('cliente-pedido-detail: mensagem "não encontrado ou sem permissão" presente', () => {
  assert.match(screen, /não encontrado ou sem permissão/i);
});

// ---------------------------------------------------------------------
// 9. Uso de helpers de pedido-ui.js
// ---------------------------------------------------------------------

test('cliente-pedido-detail: usa window.pedidoStatusBadge', () => {
  assert.match(screen, /window\.pedidoStatusBadge/);
});

test('cliente-pedido-detail: usa window.fmtDataCurta', () => {
  assert.match(screen, /window\.fmtDataCurta/);
});

test('cliente-pedido-detail: usa window.corPreviewElement', () => {
  assert.match(screen, /window\.corPreviewElement/);
});

test('cliente-pedido-detail: usa corPreviewHex', () => {
  assert.match(screen, /window\.corPreviewHex/);
});

// ---------------------------------------------------------------------
// 10. Shell cliente
// ---------------------------------------------------------------------

test('cliente-pedido-detail: usa window.clienteShellLayout', () => {
  assert.match(screen, /window\.clienteShellLayout/);
  assert.equal(/window\.ADMIN_MENU/.test(screen), false, 'não deve usar ADMIN_MENU');
});

// ---------------------------------------------------------------------
// 11. Itens — mostra modelo, metros, largura/cor, observação
// ---------------------------------------------------------------------

test('cliente-pedido-detail: mostra colunas de itens (modelo, cor, largura, preview, metros, observação)', () => {
  assert.match(screen, /label:\s*['"]Modelo['"]/);
  assert.match(screen, /label:\s*['"]Cor 1 \/ Cor 2['"]/);
  assert.match(screen, /label:\s*['"]Largura['"]/);
  assert.match(screen, /label:\s*['"]Preview['"]/);
  assert.match(screen, /label:\s*['"]Metros['"]/);
  assert.match(screen, /label:\s*['"]Observação['"]/);
});

test('cliente-pedido-detail: NÃO tem botões de ação nos itens', () => {
  // actions: [] para a tabela de itens
  assert.match(screen, /actions:\s*\[\]/);
});
