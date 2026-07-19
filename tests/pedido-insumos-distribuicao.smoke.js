const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'js/screens/pedido-insumos-distribuicao.js'), 'utf8');
const router = fs.readFileSync(path.join(root, 'js/router.js'), 'utf8');
const orderRender = fs.readFileSync(path.join(root, 'js/screens/ordem-compra-render.js'), 'utf8');
const orderEvents = fs.readFileSync(path.join(root, 'js/screens/ordem-compra-events.js'), 'utf8');
const op = fs.readFileSync(path.join(root, 'js/screens/op-nova.js'), 'utf8');

test('F2 owns purchasing distribution at Pedido / Insumos', () => {
  assert.match(router, /#\\\/pedidos\\\/.+\\\/insumos/);
  assert.match(ui, /screenPedidoInsumosDistribuicao/);
  assert.match(ui, /necessidade_compra_fio/);
  assert.match(ui, /definir_alocacao_necessidade_compra_fio/);
  assert.doesNotMatch(ui, /p_op_id|p_item_id|p_pedido_id/);
});

test('F2 preserves absolute target and replay-safe client command keys', () => {
  assert.match(ui, /Quantidade alvo absoluta/);
  assert.match(ui, /Use zero para remover/);
  assert.match(ui, /commandKey\(\)/);
  assert.match(ui, /Resposta incerta.*mesma chave de comando/);
  assert.match(ui, /idempotencia_conflitante/);
});

test('F2 represents both OP and shared Pedido provenance without an OP selector', () => {
  assert.match(ui, /Pedido compartilhado/);
  assert.match(ui, /proveniência somente leitura/);
  assert.match(ui, /need\.ops/);
  assert.doesNotMatch(ui, /Selecione a OP/);
});

test('order and OP screens no longer own purchasing origination', () => {
  assert.doesNotMatch(orderRender, /oc-nova|oc-add-item/);
  assert.doesNotMatch(orderEvents, /definir_item_ordem_compra|alocar_necessidade_compra_fio|remover_alocacao_compra_fio/);
  assert.match(op, /op-purchase-assignment-readonly/);
  assert.match(op, /op-abrir-distribuicao-pedido/);
});
