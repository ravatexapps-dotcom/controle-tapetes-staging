// =====================================================================
// === tests/manta-product-label.smoke.js ==============================
// PHASE-MANTA-A product-line label contract (js/op-display.js).
//
// Single source of the display contract shared by Pedido and OP surfaces:
//   "Manta · Arabesco · 1,40 m · KRAFT/CRU"
//   "Tapete · Barcelona · 2,10 m · KRAFT/CRU"
// Pure/static: no app, no Supabase. Type is derived from tipo_produto,
// never inferred from the model name.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const HELPER = path.join(ROOT, 'js', 'op-display.js');

function loadApi() {
  const src = fs.readFileSync(HELPER, 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/op-display.js' });
  return sandbox.window.RAVATEX_OP_DISPLAY;
}

test('exposes the product-variation label API', () => {
  const api = loadApi();
  for (const fn of ['productTypeLabel', 'formatProductLabel', 'deriveProductType', 'opProductTypeLabel']) {
    assert.equal(typeof api[fn], 'function', 'funcao ausente: ' + fn);
  }
});

test('productTypeLabel maps only manta to Manta; everything else to Tapete', () => {
  const api = loadApi();
  assert.equal(api.productTypeLabel('manta'), 'Manta');
  assert.equal(api.productTypeLabel('MANTA'), 'Manta');
  assert.equal(api.productTypeLabel('tapete'), 'Tapete');
  assert.equal(api.productTypeLabel(null), 'Tapete');
  assert.equal(api.productTypeLabel(undefined), 'Tapete');
  assert.equal(api.productTypeLabel('qualquer'), 'Tapete');
});

test('formatProductLabel emits the canonical Manta contract', () => {
  const api = loadApi();
  const label = api.formatProductLabel({
    tipo_produto: 'manta',
    nome: 'Arabesco',
    largura: 1.40,
    cor_1: { nome: 'KRAFT' },
    cor_2: { nome: 'CRU' },
  });
  assert.equal(label, 'Manta · Arabesco · 1,40 m · KRAFT/CRU');
});

test('formatProductLabel emits the canonical Tapete contract', () => {
  const api = loadApi();
  const label = api.formatProductLabel({
    tipo_produto: 'tapete',
    nome: 'Barcelona',
    largura: 2.10,
    cor_1: { nome: 'KRAFT' },
    cor_2: { nome: 'CRU' },
  });
  assert.equal(label, 'Tapete · Barcelona · 2,10 m · KRAFT/CRU');
});

test('formatProductLabel accepts colors given as plain strings', () => {
  const api = loadApi();
  const label = api.formatProductLabel({ tipo_produto: 'manta', nome: 'Arabesco', largura: 1.4, cor1: 'KRAFT', cor2: 'CRU' });
  assert.equal(label, 'Manta · Arabesco · 1,40 m · KRAFT/CRU');
});

test('deriveProductType resolves homogeneous items and flags mixed', () => {
  const api = loadApi();
  assert.equal(api.deriveProductType([{ modelo: { tipo_produto: 'manta' } }, { modelo: { tipo_produto: 'manta' } }]), 'manta');
  assert.equal(api.deriveProductType([{ tipo_produto: 'tapete' }, { tipo_produto: 'tapete' }]), 'tapete');
  assert.equal(api.deriveProductType([{ tipo_produto: 'manta' }, { tipo_produto: 'tapete' }]), 'misto');
  assert.equal(api.deriveProductType([]), null);
  assert.equal(api.deriveProductType(null), null);
});

test('opProductTypeLabel returns the human OP-level label', () => {
  const api = loadApi();
  assert.equal(api.opProductTypeLabel([{ tipo_produto: 'manta' }]), 'Manta');
  assert.equal(api.opProductTypeLabel([{ tipo_produto: 'tapete' }]), 'Tapete');
  assert.equal(api.opProductTypeLabel([{ tipo_produto: 'manta' }, { tipo_produto: 'tapete' }]), 'Misto');
  assert.equal(api.opProductTypeLabel([]), null);
});
