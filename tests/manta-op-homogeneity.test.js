// =====================================================================
// === tests/manta-op-homogeneity.test.js ==============================
// PHASE-MANTA-A route-homogeneity guard in the OP persistence seam
// (js/screens/op-persistir.js).
//
// Proves the in-code guard rejects a mixed Tapete+Manta OP BEFORE the
// OP number is reserved (proximo_numero_op), while a homogeneous OP
// passes the guard. The database trigger remains the ultimate authority.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const MODULE = path.join(ROOT, 'js', 'screens', 'op-persistir.js');

function loadModule() {
  const src = fs.readFileSync(MODULE, 'utf8');
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'js/screens/op-persistir.js' });
  return sandbox;
}

const MODELOS = {
  1: { id: 1, tipo_produto: 'tapete' },
  2: { id: 2, tipo_produto: 'manta' },
};

test('opRotaHomogenea: pure route classification', () => {
  const { window } = loadModule();
  const f = window.opRotaHomogenea;
  assert.equal(f([{ modeloId: 1, metros: 10 }, { modeloId: 1, metros: 5 }], MODELOS), true);
  assert.equal(f([{ modeloId: 2, metros: 10 }], MODELOS), true);
  assert.equal(f([{ modeloId: 1, metros: 10 }, { modeloId: 2, metros: 5 }], MODELOS), false);
  assert.equal(f([], MODELOS), true);
  // Missing metadata resolves to tapete (no false block).
  assert.equal(f([{ modeloId: 999, metros: 10 }], MODELOS), true);
});

test('persistirOP rejects a mixed OP before consuming an OP number', async () => {
  const { window } = loadModule();
  let rpcCalled = false;
  window.supa = {
    rpc: async () => { rpcCalled = true; return { data: null, error: { message: 'should-not-be-called' } }; },
    from: () => { throw new Error('no table write must happen for a mixed OP'); },
  };

  const result = await window.persistirOP({
    status: 'simulada',
    op: null,
    numero: 1,
    ano: 2026,
    clienteSel: 5,
    itens: [{ modeloId: 1, metros: 100 }, { modeloId: 2, metros: 50 }],
    fornSel: {},
    modelosById: MODELOS,
    parametrosByLargura: {},
    pedidoId: '11111111-1111-1111-1111-111111111111',
  });

  assert.equal(result.step, 'route_homogeneity');
  assert.equal(result.partial, false);
  assert.equal(rpcCalled, false, 'proximo_numero_op must NOT run for a mixed OP');
});

test('persistirOP lets a homogeneous OP pass the guard (reaches numbering)', async () => {
  const { window } = loadModule();
  let rpcCalled = false;
  window.supa = {
    // Fail at numbering so we can observe the guard was passed without a full write path.
    rpc: async (name) => { rpcCalled = true; return { data: null, error: { message: 'stop after guard: ' + name } }; },
    from: () => { throw new Error('should stop at numbering'); },
  };

  const result = await window.persistirOP({
    status: 'simulada',
    op: null,
    numero: 1,
    ano: 2026,
    clienteSel: 5,
    itens: [{ modeloId: 1, metros: 100 }, { modeloId: 1, metros: 50 }],
    fornSel: {},
    modelosById: MODELOS,
    parametrosByLargura: {},
    pedidoId: '11111111-1111-1111-1111-111111111111',
  });

  assert.notEqual(result.step, 'route_homogeneity', 'a homogeneous OP must pass the route guard');
  assert.equal(result.step, 'op_numero_next');
  assert.equal(rpcCalled, true, 'a homogeneous OP proceeds to reserve a number');
});
