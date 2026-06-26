const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'js', 'pedido-tracking-ui.js');
const INDEX = path.join(ROOT, 'index.html');

function readOrFail(target) {
  assert.ok(fs.existsSync(target), 'arquivo nao encontrado: ' + target);
  return fs.readFileSync(target, 'utf8');
}

function loadTrackingApi() {
  const source = readOrFail(FILE);
  const sandbox = { window: { RAVATEX_PEDIDO_UI: {} }, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'js/pedido-tracking-ui.js' });
  return sandbox.window;
}

const source = readOrFail(FILE);
const indexHtml = readOrFail(INDEX);

test('cliente-tracking-steps: arquivo existe', () => {
  assert.ok(fs.existsSync(FILE), 'js/pedido-tracking-ui.js ausente');
});

test('cliente-tracking-steps: sintaxe JS valida', () => {
  require('node:child_process').execFileSync(
    process.execPath,
    ['--check', FILE],
    { stdio: 'pipe' }
  );
});

test('cliente-tracking-steps: expone namespace global', () => {
  const window = loadTrackingApi();
  assert.equal(typeof window.RavatexPedidoTracking, 'object');
  assert.equal(window.RAVATEX_PEDIDO_UI.CLIENTE_TRACKING, window.RavatexPedidoTracking);
});

test('cliente-tracking-steps: contem exatamente 8 etapas principais na ordem correta', () => {
  const window = loadTrackingApi();
  const steps = window.RavatexPedidoTracking.CLIENTE_TRACKING_STEPS;
  assert.equal(steps.length, 8);
  assert.deepEqual(
    Array.from(steps, function (item) { return item.key; }),
    ['recebido', 'confirmado', 'insumos', 'tecelagem', 'acabamento', 'expedicao', 'transporte', 'concluido']
  );
});

test('cliente-tracking-steps: labels principais estao corretos', () => {
  const window = loadTrackingApi();
  const steps = window.RavatexPedidoTracking.CLIENTE_TRACKING_STEPS;
  assert.deepEqual(
    Array.from(steps, function (item) { return item.label; }),
    ['Recebido', 'Confirmado', 'Insumos', 'Tecelagem', 'Acabamento', 'Expedição', 'Transporte', 'Concluído']
  );
});

test('cliente-tracking-steps: contem exatamente 4 excecoes', () => {
  const window = loadTrackingApi();
  const exceptions = window.RavatexPedidoTracking.CLIENTE_TRACKING_EXCECOES;
  assert.equal(exceptions.length, 4);
  assert.deepEqual(
    Array.from(exceptions, function (item) { return item.key; }),
    ['aguardando_definicao', 'aguardando_insumo', 'pausado', 'cancelado']
  );
});

test('cliente-tracking-steps: cancelado fica nas excecoes e nao nas etapas', () => {
  const window = loadTrackingApi();
  const steps = window.RavatexPedidoTracking.CLIENTE_TRACKING_STEPS;
  const exceptions = window.RavatexPedidoTracking.CLIENTE_TRACKING_EXCECOES;
  assert.equal(steps.some(function (item) { return item.key === 'cancelado'; }), false);
  assert.equal(exceptions.some(function (item) { return item.key === 'cancelado'; }), true);
});

test('cliente-tracking-steps: insumos e transporte sao pulaveis', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  assert.equal(api.getClienteTrackingStep('insumos').pulavel, true);
  assert.equal(api.getClienteTrackingStep('transporte').pulavel, true);
});

test('cliente-tracking-steps: helpers existem', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  assert.equal(typeof api.getClienteTrackingStep, 'function');
  assert.equal(typeof api.getClienteTrackingException, 'function');
  assert.equal(typeof api.getClienteTrackingStatusLabel, 'function');
  assert.equal(typeof api.getClienteTrackingMensagem, 'function');
  assert.equal(typeof api.getClienteTrackingProgress, 'function');
});

test('cliente-tracking-steps: helper de label prioriza excecao antes da etapa', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  assert.equal(
    api.getClienteTrackingStatusLabel({
      status_cliente_visual: 'tecelagem',
      status_cliente_excecao: 'pausado',
    }),
    'Pausado'
  );
});

test('cliente-tracking-steps: helper de mensagem respeita status_cliente_mensagem', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  assert.equal(
    api.getClienteTrackingMensagem({
      status_cliente_visual: 'expedicao',
      status_cliente_excecao: 'aguardando_insumo',
      status_cliente_mensagem: 'Mensagem publicada pelo admin.',
    }),
    'Mensagem publicada pelo admin.'
  );
});

test('cliente-tracking-steps: status visual nulo ou desconhecido faz fallback para recebido', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  assert.equal(api.getClienteTrackingStatusLabel({}), 'Recebido');
  assert.equal(api.getClienteTrackingStatusLabel({ status_cliente_visual: 'nao_mapeado' }), 'Recebido');

  var progress = api.getClienteTrackingProgress({ status_cliente_visual: 'nao_mapeado' });
  assert.equal(progress.currentKey, 'recebido');
  assert.equal(progress.currentIndex, 0);
  assert.equal(progress.fallbackToRecebido, true);
});

test('cliente-tracking-steps: cancelado e excecao terminal fora da etapa principal', () => {
  const window = loadTrackingApi();
  const api = window.RavatexPedidoTracking;
  var progress = api.getClienteTrackingProgress({
    status_cliente_visual: 'acabamento',
    status_cliente_excecao: 'cancelado',
  });
  assert.equal(progress.currentKey, null);
  assert.equal(progress.currentIndex, -1);
  assert.equal(progress.isTerminal, true);
});

test('cliente-tracking-steps: nao contem termos proibidos para cliente', () => {
  assert.equal(/\bOP\b/.test(source), false, 'nao deve conter OP');
  assert.equal(/\blote\b/i.test(source), false, 'nao deve conter lote');
  assert.equal(/fornecedor/i.test(source), false, 'nao deve conter fornecedor');
  assert.equal(/\bNF\b/.test(source), false, 'nao deve conter NF');
  assert.equal(/romaneio/i.test(source), false, 'nao deve conter romaneio');
  assert.equal(/custo/i.test(source), false, 'nao deve conter custo');
  assert.equal(/margem/i.test(source), false, 'nao deve conter margem');
  assert.equal(/service_role/i.test(source), false, 'nao deve conter service_role');
});

test('cliente-tracking-steps: nao faz query nem writes', () => {
  assert.equal(/window\.supa/.test(source), false, 'nao deve chamar window.supa');
  assert.equal(/\.from\s*\(/.test(source), false, 'nao deve fazer query');
  assert.equal(/\.insert\s*\(/.test(source), false, 'nao deve fazer insert');
  assert.equal(/\.update\s*\(/.test(source), false, 'nao deve fazer update');
  assert.equal(/\.delete\s*\(/.test(source), false, 'nao deve fazer delete');
});

test('index.html: carrega pedido-tracking-ui.js exatamente uma vez depois de pedido-ui.js', () => {
  const matches = indexHtml.match(/js\/pedido-tracking-ui\.js/g) || [];
  assert.equal(matches.length, 1);

  const idxPedidoUi = indexHtml.indexOf('js/pedido-ui.js');
  const idxTrackingUi = indexHtml.indexOf('js/pedido-tracking-ui.js');
  assert.ok(idxPedidoUi > 0, 'pedido-ui.js deve estar no head');
  assert.ok(idxTrackingUi > 0, 'pedido-tracking-ui.js deve estar no head');
  assert.ok(idxPedidoUi < idxTrackingUi, 'pedido-tracking-ui.js deve vir depois de pedido-ui.js');
});
