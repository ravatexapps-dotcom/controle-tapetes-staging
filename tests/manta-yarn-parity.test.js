// =====================================================================
// === tests/manta-yarn-parity.test.js =================================
// PHASE-MANTA-A yarn-composition parity.
//
// The yarn calculation is width-keyed and product-type-agnostic
// (js/calculo-op.js reads parametros_largura[larguraKey(modelo.largura)]).
// A Manta model is largura = 1.40, so it MUST consume exactly the same
// canonical parameter row and produce exactly the same yarn need as a
// Tapete of largura 1.40 for the same meters. No Manta-specific numeric
// factor is introduced anywhere.
// =====================================================================

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { calcularFiosOP, larguraKey } = require('../js/calculo-op.js');

// Representative canonical rows (values live in parametros_largura, not here).
const PARAMS = {
  '1.40': { algodao_por_ml: 0.226000, poliester_por_ml: 0.110000, valor_x: 0.5 },
  '2.10': { algodao_por_ml: 0.366000, poliester_por_ml: 0.171000, valor_x: 0.5 },
};

// Same name/colors/width; only the product type differs — and the type is
// NOT even an input to the width-keyed calculation.
const MANTA_140 = { id: 100, nome: 'ARABESCO', largura: 1.40, cor_1: { id: 1, nome: 'KRAFT' }, cor_2: { id: 2, nome: 'CRU' } };
const TAPETE_140 = { id: 200, nome: 'Barcelona', largura: 1.40, cor_1: { id: 1, nome: 'KRAFT' }, cor_2: { id: 2, nome: 'CRU' } };
const TAPETE_210 = { id: 300, nome: 'Barcelona', largura: 2.10, cor_1: { id: 1, nome: 'KRAFT' }, cor_2: { id: 2, nome: 'CRU' } };

const MODELOS = { 100: MANTA_140, 200: TAPETE_140, 300: TAPETE_210 };

test('Manta 1.40 consumes the same canonical row as Tapete 1.40', () => {
  assert.strictEqual(larguraKey(MANTA_140.largura), larguraKey(TAPETE_140.largura));
  assert.strictEqual(larguraKey(MANTA_140.largura), '1.40');
});

test('Manta 1.40 yarn need equals Tapete 1.40 yarn need for the same meters', () => {
  const manta = calcularFiosOP([{ modeloId: 100, metros: 300 }], MODELOS, PARAMS);
  const tapete = calcularFiosOP([{ modeloId: 200, metros: 300 }], MODELOS, PARAMS);

  // Cotton per color and polyester are identical, cor-for-cor.
  assert.strictEqual(manta.algodaoPorCor[1].kg, tapete.algodaoPorCor[1].kg);
  assert.strictEqual(manta.algodaoPorCor[2].kg, tapete.algodaoPorCor[2].kg);
  assert.deepStrictEqual(manta.poliester, tapete.poliester);

  // And the value is exactly algodao_por_ml * valor_x * metros (0.226*0.5*300).
  assert.ok(Math.abs(manta.algodaoPorCor[1].kg - 33.9) < 1e-9);
  assert.ok(Math.abs(manta.poliester.PRETO - 16.5) < 1e-9);
});

test('Manta 1.40 differs from Tapete 2.10 (different canonical row)', () => {
  const manta = calcularFiosOP([{ modeloId: 100, metros: 300 }], MODELOS, PARAMS);
  const tapete210 = calcularFiosOP([{ modeloId: 300, metros: 300 }], MODELOS, PARAMS);
  assert.notStrictEqual(manta.algodaoPorCor[1].kg, tapete210.algodaoPorCor[1].kg);
});

test('Manta yarn depends on the passed parameter row, not on an embedded constant', () => {
  // With no 1.40 row available, the calculation must fail rather than fall
  // back to any hardcoded Manta factor.
  assert.throws(
    () => calcularFiosOP([{ modeloId: 100, metros: 300 }], MODELOS, { '2.10': PARAMS['2.10'] }),
    /largura/,
  );
});

test('js/calculo-op.js introduces no Manta-specific branch or constant', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'calculo-op.js'), 'utf8');
  assert.doesNotMatch(src, /manta/i);
  assert.doesNotMatch(src, /tipo_produto/i);
});
