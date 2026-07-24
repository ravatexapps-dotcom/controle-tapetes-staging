// =====================================================================
// === tests/manta-ui-surfaces.smoke.js ================================
// PHASE-MANTA-A UI wiring smoke. Static: reads screen sources and proves
// the Manta product-variation wiring is present and syntactically valid
// on every affected surface, without running the app or Supabase.
//
//   - model maintenance: type selector + Manta width lock + validation;
//   - shared label contract via op-display;
//   - Pedido create/edit + detail: graceful tipo_produto + contract label;
//   - OP creation: explicit product-type choice + in-code homogeneity;
//   - finishing surface: no finishing offered for a Manta OP;
//   - OP list: product-type badge.
//
// All model reads that add tipo_produto degrade gracefully when the
// column is absent (pre-migration), so this phase never breaks the app
// before db/78 is applied.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const FILES = [
  'js/op-display.js',
  'js/screens/cadastros.js',
  'js/screens/op-form-helpers.js',
  'js/screens/op-persistir.js',
  'js/screens/op-nova.js',
  'js/screens/op-tecelagem-producao-admin.js',
  'js/screens/pedido-itens-edit.js',
  'js/screens/pedido-detail-render.js',
  'js/screens/pedido-detail-data.js',
  'js/screens/ops-list.js',
];

test('all touched screens pass node --check', () => {
  for (const rel of FILES) {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  }
});

test('op-display exposes the shared product-line contract helper', () => {
  const src = read('js/op-display.js');
  assert.match(src, /formatProductLabel/);
  assert.match(src, /productTypeLabel/);
  assert.match(src, /deriveProductType/);
});

test('model maintenance: type selector, Manta width lock, validation, graceful column', () => {
  const src = read('js/screens/cadastros.js');
  assert.match(src, /detectOptionalColumns\('modelos',\s*\['observacoes',\s*'tipo_produto'\]\)/);
  assert.match(src, /Tipo de produto/);
  assert.match(src, /value:\s*'manta',\s*label:\s*'Manta'/);
  assert.match(src, /applyMantaWidthLock/);
  assert.match(src, /largSel\.disabled\s*=\s*true/);
  assert.match(src, /Manta exige largura 1,40 m/);
});

test('rotuloModelo uses the product contract when tipo_produto is present', () => {
  const src = read('js/screens/op-form-helpers.js');
  assert.match(src, /modelo\.tipo_produto\s*!=\s*null/);
  assert.match(src, /formatProductLabel/);
});

test('OP persistence guards route homogeneity before numbering', () => {
  const src = read('js/screens/op-persistir.js');
  assert.match(src, /opRotaHomogenea/);
  assert.match(src, /route_homogeneity/);
  // The guard must precede the proximo_numero_op reservation.
  assert.ok(src.indexOf("step: 'route_homogeneity'") < src.indexOf("rpc('proximo_numero_op'"),
    'route homogeneity guard must come before proximo_numero_op');
});

test('OP creation requires an explicit product-type choice for a mixed Pedido', () => {
  const src = read('js/screens/op-nova.js');
  assert.match(src, /escolherTipoProdutoOP/);
  assert.match(src, /tiposPedidoOP/);
  assert.match(src, /select\('id,\s*tipo_produto'\)/); // graceful augmentation
  assert.match(src, /route_homogeneity/);
});

test('finishing surface offers no finishing action for a Manta OP', () => {
  const src = read('js/screens/op-tecelagem-producao-admin.js');
  assert.match(src, /opEhManta/);
  assert.match(src, /buildMantaRotaNote/);
  assert.match(src, /PHASE-MANTA-B/);
  assert.match(src, /if\s*\(ctx\.cimaFornecedorId\s*&&\s*!isManta\)/);
});

test('Pedido surfaces render the product type (graceful) and reorder to the contract', () => {
  const edit = read('js/screens/pedido-itens-edit.js');
  assert.match(edit, /tipo_produto/);
  assert.match(edit, /formatProductLabel/);
  const render = read('js/screens/pedido-detail-render.js');
  assert.match(render, /productTypeLabel/);
  const data = read('js/screens/pedido-detail-data.js');
  assert.match(data, /select\('id,\s*tipo_produto'\)/);
});

test('OP list shows a product-type badge derived from items', () => {
  const src = read('js/screens/ops-list.js');
  assert.match(src, /produtoTipoPorOp/);
  assert.match(src, /deriveProductType/);
});

test('no affected surface infers the product type from the model name', () => {
  for (const rel of FILES) {
    const src = read(rel);
    assert.doesNotMatch(src, /nome[^\n]*\.(includes|indexOf|match)\([^)]*manta/i);
    assert.doesNotMatch(src, /manta[^\n]*\.test\(\s*[a-zA-Z_.]*nome/i);
  }
});
