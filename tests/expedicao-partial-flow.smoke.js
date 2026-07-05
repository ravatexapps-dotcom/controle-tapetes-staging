// Smoke test for RAVATEX-TAPETES-ACABAMENTO-PARTIAL-EXPEDITION-CONTRACT-B.
// Static/VM contract only: no Supabase connection and no business data writes.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const DB31 = path.join(ROOT, 'db', '31_acabamento_partial_expedition_flow.sql');
const DB23 = path.join(ROOT, 'db', '23_expedicao_entrega_flow.sql');
const DB29 = path.join(ROOT, 'db', '29_op_latex_split_rpc.sql');
const CHAIN_STATE = path.join(ROOT, 'js', 'screens', 'pedido-chain-state.js');
const OLA = path.join(ROOT, 'js', 'screens', 'op-latex-admin.js');
const PEDIDO_EVENTS = path.join(ROOT, 'js', 'screens', 'pedido-detail-events.js');
const PEDIDO_PROGRESS = path.join(ROOT, 'js', 'screens', 'pedido-detail-progress.js');
const EXPEDICAO_ADMIN = path.join(ROOT, 'js', 'screens', 'expedicao-admin.js');
const CLIENTE_READMODEL_TEST = path.join(ROOT, 'tests', 'cliente-pedido-summary-readmodel.smoke.js');

const db31 = fs.readFileSync(DB31, 'utf8');
const db23 = fs.readFileSync(DB23, 'utf8');
const db29 = fs.readFileSync(DB29, 'utf8');
const chainState = fs.readFileSync(CHAIN_STATE, 'utf8');
const ola = fs.readFileSync(OLA, 'utf8');
const pedidoEvents = fs.readFileSync(PEDIDO_EVENTS, 'utf8');
const pedidoProgress = fs.readFileSync(PEDIDO_PROGRESS, 'utf8');
const expedicaoAdmin = fs.readFileSync(EXPEDICAO_ADMIN, 'utf8');
const clienteReadmodelTest = fs.readFileSync(CLIENTE_READMODEL_TEST, 'utf8');

function derive(input) {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(chainState, sandbox, { filename: 'js/screens/pedido-chain-state.js' });
  return sandbox.window.RAVATEX_SCREENS.pedidoChainState.derivePedidoChainState(input);
}

test('1. OP Latex em_producao com acabado parcial pode liberar expedicao parcial', () => {
  assert.match(db31, /v_op\.status NOT IN \('em_producao', 'concluida', 'finalizada'\)/);
  assert.match(db31, /CREATE OR REPLACE FUNCTION public\.liberar_expedicao_latex_parcial/i);

  const result = derive({
    pedido: { id: 'p1', status: 'confirmado', metros_total: 100 },
    ops: [{
      id: 42,
      numero: 8,
      ano: 2026,
      status: 'em_producao',
      tipo: 'latex',
      op_itens: [{ id: 100, metros_pedidos: 100 }],
    }],
    entregaItens: [{ entrega_id: 501, op_id: 42, op_item_id: 100, metros_entregues: 30, defeito: false }],
    entregasById: { 501: { id: 501, etapa: 'latex' } },
    expedicoes: [],
    expedicaoItens: [],
  });

  assert.equal(result.actions.releaseExpedicao.mode, 'enabled');
  assert.equal(result.metrics.expedicao.liberavel, 30);
  assert.equal(result.stage, 'pronto_expedicao');
});

test('2. OP Latex em_producao sem quantidade acabada nao libera', () => {
  const result = derive({
    pedido: { id: 'p1', status: 'confirmado', metros_total: 100 },
    ops: [{
      id: 42,
      numero: 8,
      ano: 2026,
      status: 'em_producao',
      tipo: 'latex',
      op_itens: [{ id: 100, metros_pedidos: 100 }],
    }],
    entregaItens: [],
    entregasById: {},
    expedicoes: [],
    expedicaoItens: [],
  });

  assert.equal(result.actions.releaseExpedicao.mode, 'disabled');
  assert.equal(result.metrics.expedicao.liberavel, 0);
});

test('3. liberacao parcial nao muda status da OP', () => {
  assert.doesNotMatch(db31, /UPDATE\s+public\.ops\b/i);
  assert.doesNotMatch(db31, /alterar_status_op/i);
  assert.match(db31, /Nao altera ops\.status/i);
});

test('4. finalizacao da OP continua separada da liberacao', () => {
  assert.match(ola, /liberar_expedicao_latex_parcial/);
  assert.match(ola, /alterar_status_op/);
  assert.match(ola, /p_novo_status:\s*'concluida'/);
  assert.doesNotMatch(ola, /liberar_expedicao_latex_parcial[\s\S]{0,500}alterar_status_op/);
});

test('5. RPC parcial nao libera acima do acabado disponivel', () => {
  assert.match(db31, /v_req\.metros > ROUND\(GREATEST\(v_item\.acabado - v_item\.liberado, 0\)::NUMERIC, 2\)/);
  assert.match(db31, /Liberacao excede saldo acabado disponivel/);
  assert.match(db31, /FOR UPDATE/);
});

test('6. entrega ao cliente continua limitada ao liberado', () => {
  assert.match(db23, /CHECK \(metros_entregues <= metros_liberados\)/);
  assert.match(db23, /v_item\.metros_entregues \+ v_metros > v_item\.metros_liberados/);
  assert.match(expedicaoAdmin, /Quantidade maior que o saldo do item/);
});

test('7. fluxo terminal antigo continua valido', () => {
  assert.match(db23, /CREATE OR REPLACE FUNCTION public\.liberar_expedicao\s*\(\s*p_op_latex_id BIGINT\s*\)/i);
  assert.match(db23, /v_op\.status NOT IN \('finalizada', 'concluida'\)/);
  assert.match(ola, /Liberar total para expedicao/);
  assert.match(ola, /supa\.rpc\(\s*'liberar_expedicao'/);
});

test('8. split Latex e consolidacao default nao sao alterados pela db31', () => {
  assert.match(db29, /CREATE OR REPLACE FUNCTION public\.gerar_op_latex_split/i);
  assert.doesNotMatch(db31, /gerar_op_latex_split/i);
  assert.doesNotMatch(db31, /gerar_op_latex\s*\(/i);
  assert.doesNotMatch(db31, /motivo_separacao/i);
});

test('9. Pedido Detail reconhece disponibilidade parcial', () => {
  assert.match(pedidoEvents, /liberar_expedicao_latex_parcial/);
  assert.match(pedidoEvents, /buildAcabamentoLiberavelRows/);
  assert.match(pedidoProgress, /finishedLatex - expedicaoLiberado/);
  assert.doesNotMatch(pedidoProgress, /OP de acabamento finalizada/);
});

test('10. Cliente read model nao expoe campos internos', () => {
  assert.match(clienteReadmodelTest, /op_id/);
  assert.match(clienteReadmodelTest, /expedicao_id/);
  assert.match(clienteReadmodelTest, /motivo_separacao/);
});
