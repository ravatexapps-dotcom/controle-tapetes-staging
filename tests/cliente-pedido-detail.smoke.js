const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCREEN = path.join(ROOT, 'js', 'screens', 'cliente-pedido-detail.js');
const ROUTER = path.join(ROOT, 'js', 'router.js');
const INDEX = path.join(ROOT, 'index.html');

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo nao encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const screen = readOrFail(SCREEN);
const router = readOrFail(ROUTER);
const index = readOrFail(INDEX);

test('cliente-pedido-detail: arquivo existe', () => {
  assert.ok(fs.existsSync(SCREEN), 'js/screens/cliente-pedido-detail.js ausente');
});

test('cliente-pedido-detail: sintaxe JS valida (node --check)', () => {
  const { execSync } = require('node:child_process');
  execSync(`node --check "${SCREEN}"`, { stdio: 'pipe' });
});

test('cliente-pedido-detail: script classico (nao ES module)', () => {
  assert.equal(/^\s*export\s+/m.test(screen), false);
  assert.equal(/import\s+.*\s+from\s+/.test(screen), false);
});

test('cliente-pedido-detail: expoe window.screenClientePedidoDetalhe', () => {
  assert.match(screen, /window\.screenClientePedidoDetalhe\s*=\s*screenClientePedidoDetalhe/);
});

test('cliente-pedido-detail: expoe RAVATEX_SCREENS.clientePedidoDetail', () => {
  assert.match(screen, /RAVATEX_SCREENS\.clientePedidoDetail/);
});

test('router.js: matchRoute reconhece #/cliente/pedidos/<uuid>', () => {
  assert.match(router, /cliente\\\/pedidos\\\//);
});

test('router.js: matchRoute #/cliente/pedidos/<uuid> role e ["cliente"]', () => {
  assert.match(router, /roles:\s*\[['"]cliente['"]\]/);
});

test('cliente-pedido-detail: usa from(\'pedidos\')', () => {
  assert.match(screen, /from\(['"]pedidos['"]\)/);
});

test('cliente-pedido-detail: usa from(\'pedido_parciais\')', () => {
  assert.match(screen, /from\(['"]pedido_parciais['"]\)/);
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

test('cliente-pedido-detail: seleciona status_cliente_visual, status_cliente_excecao, status_cliente_mensagem e status_cliente_atualizado_em', () => {
  assert.match(screen, /status_cliente_visual/);
  assert.match(screen, /status_cliente_excecao/);
  assert.match(screen, /status_cliente_mensagem/);
  assert.match(screen, /status_cliente_atualizado_em/);
});

test('cliente-pedido-detail: mantem SELECT explicito e nao usa select(*)', () => {
  assert.doesNotMatch(screen, /\.select\(\s*['"]\*['"]\s*\)/);
});

test('cliente-pedido-detail: nao expoe cliente_id no select de pedidos', () => {
  const selectRe = /\.select\(['"]([^'"]*)['"]\)/g;
  let m;
  let foundClienteIdInSelect = false;
  while ((m = selectRe.exec(screen)) !== null) {
    if (m[1].includes('cliente_id')) foundClienteIdInSelect = true;
  }
  assert.equal(foundClienteIdInSelect, false);
});

test('cliente-pedido-detail: nao expoe token_acesso', () => {
  assert.equal(/token_acesso/.test(screen), false);
});

test('cliente-pedido-detail: nao expoe pedido_eventos', () => {
  assert.equal(/pedido_eventos/.test(screen), false);
});

test('cliente-pedido-detail: consulta pedido_cliente_eventos para a timeline read-only', () => {
  assert.match(screen, /from\(['"]pedido_cliente_eventos['"]\)/);
});

test('cliente-pedido-detail: select de pedido_parciais usa apenas colunas seguras', () => {
  const match = screen.match(/from\(['"]pedido_parciais['"]\)\s*\.select\('([^']*)'\)/);
  assert.ok(match, 'select de pedido_parciais nao encontrado');
  const select = match[1];
  assert.equal(select, 'id, pedido_id, sequencia, situacao, metros, data_referencia, titulo, mensagem_cliente, criado_em, atualizado_em');
});

test('cliente-pedido-detail: pedido_parciais nao seleciona metadata, criado_por, origem, observacao_admin ou visivel_cliente', () => {
  const match = screen.match(/from\(['"]pedido_parciais['"]\)\s*\.select\('([^']*)'\)/);
  assert.ok(match, 'select de pedido_parciais nao encontrado');
  const select = match[1];
  assert.equal(select.includes('metadata'), false);
  assert.equal(select.includes('criado_por'), false);
  assert.equal(select.includes('origem'), false);
  assert.equal(select.includes('observacao_admin'), false);
  assert.equal(select.includes('visivel_cliente'), false);
});

test('cliente-pedido-detail: pedido_parciais filtra por pedido_id e ordena por sequencia e criado_em', () => {
  assert.match(screen, /from\(['"]pedido_parciais['"]\)[\s\S]*?\.eq\(['"]pedido_id['"],\s*pedidoId\)/);
  assert.match(screen, /from\(['"]pedido_parciais['"]\)[\s\S]*?\.order\(['"]sequencia['"],\s*\{\s*ascending:\s*true\s*\}\)/);
  assert.match(screen, /from\(['"]pedido_parciais['"]\)[\s\S]*?\.order\(['"]criado_em['"],\s*\{\s*ascending:\s*true\s*\}\)/);
});

test('cliente-pedido-detail: usa helper compartilhado buildPedidoAcompanhamentoParcial', () => {
  assert.match(screen, /buildPedidoAcompanhamentoParcial/);
});

test('cliente-pedido-detail: nao consulta pedido_parcial_itens', () => {
  assert.equal(/from\(['"]pedido_parcial_itens['"]\)/.test(screen), false);
});

test('cliente-pedido-detail: nao referencia OP', () => {
  assert.equal(/\bop\b/i.test(screen), false);
});

test('cliente-pedido-detail: nao referencia lote', () => {
  assert.equal(/\blote\b/i.test(screen), false);
});

test('cliente-pedido-detail: nao referencia fornecedor', () => {
  assert.equal(/fornecedor/i.test(screen), false);
});

test('cliente-pedido-detail: nao referencia NF, romaneio, custo ou margem', () => {
  assert.equal(/\bNF\b/.test(screen), false);
  assert.equal(/romaneio/i.test(screen), false);
  assert.equal(/custo/i.test(screen), false);
  assert.equal(/margem/i.test(screen), false);
});

test('cliente-pedido-detail: nao referencia service_role', () => {
  assert.equal(/service_role/.test(screen), false);
});

test('cliente-pedido-detail: nao referencia functions.invoke', () => {
  assert.equal(/functions\.invoke/.test(screen), false);
});

test('cliente-pedido-detail: nao faz insert', () => {
  assert.equal(/\.insert\s*\(/.test(screen), false);
});

test('cliente-pedido-detail: nao faz update', () => {
  assert.equal(/\.update\s*\(/.test(screen), false);
});

test('cliente-pedido-detail: nao faz delete', () => {
  assert.equal(/\.delete\s*\(/.test(screen), false);
});

test('cliente-pedido-detail: nao usa rpc', () => {
  assert.equal(/\.rpc\s*\(/.test(screen), false);
});

test('cliente-pedido-detail: nao tem botao Editar', () => {
  assert.equal(/Editar/i.test(screen), false);
});

test('cliente-pedido-detail: nao tem botao Cancelar', () => {
  assert.equal(/Cancelar pedido/i.test(screen), false);
});

test('cliente-pedido-detail: nao tem botao Confirmar', () => {
  assert.equal(/Confirmar pedido/i.test(screen), false);
});

test('cliente-pedido-detail: nao tem botao "Editar itens"', () => {
  assert.equal(/Editar itens/i.test(screen), false);
});

test('cliente-pedido-detail: valida UUID antes de consultar', () => {
  assert.match(screen, /UUID_RE\.test/);
});

test('cliente-pedido-detail: mensagem "nao encontrado ou sem permissao" presente', () => {
  assert.match(screen, /n[aã]o encontrado ou sem permiss[aã]o/i);
});

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

test('cliente-pedido-detail: usa window.clienteShellLayout', () => {
  assert.match(screen, /window\.clienteShellLayout/);
  assert.equal(/window\.ADMIN_MENU/.test(screen), false);
});

test('cliente-pedido-detail: chama window.buildClientePedidoTrackingCard', () => {
  assert.match(screen, /window\.buildClientePedidoTrackingCard/);
});

test('cliente-pedido-detail: renderiza o card de acompanhamento depois do resumo', () => {
  const matches = [...screen.matchAll(/container\.replaceChildren\(([^;]*)\);/g)];
  const principal = matches.find((m) => m[1].includes('buildResumo()'));
  assert.ok(principal);
  const args = principal[1];
  const idxTracking = args.indexOf('buildTracking()');
  const idxResumo = args.indexOf('buildResumo()');
  assert.ok(idxTracking !== -1);
  assert.ok(idxResumo < idxTracking);
});

function extractFunctionBody(source, fnName) {
  const start = source.indexOf('function ' + fnName + '(');
  assert.ok(start !== -1, 'function ' + fnName + ' nao encontrada');
  const next = source.indexOf('\n    function ', start + 1);
  return next === -1 ? source.slice(start) : source.slice(start, next);
}

test('cliente-pedido-detail: itens do pedido usa layout local compacto (sem window.dataTable)', () => {
  const body = extractFunctionBody(screen, 'buildItens');
  assert.equal(/window\.dataTable\(/.test(body), false);
  assert.match(body, /Itens do pedido/);
  const rowBody = extractFunctionBody(screen, 'buildItemRow');
  assert.match(rowBody, /modelLabel\(/);
  assert.match(rowBody, /itemCoresLabel\(/);
  assert.match(rowBody, /itemPreviewEl\(/);
  assert.match(rowBody, /fmtMetros\(/);
});

test('cliente-pedido-detail: itens do pedido nao renderiza botoes de acao', () => {
  const body = extractFunctionBody(screen, 'buildItens') + extractFunctionBody(screen, 'buildItemRow');
  assert.equal(/<button/i.test(body), false);
  assert.equal(/'button'/.test(body), false);
});

test('cliente-pedido-detail: secao "Distribuicao atual" presente e usa buildPedidoAcompanhamentoParcial', () => {
  assert.match(screen, /Distribui[cç][aã]o atual/i);
  const body = extractFunctionBody(screen, 'buildDistribuicaoAtual');
  assert.match(body, /buildPedidoAcompanhamentoParcial/);
  assert.match(body, /acompanhamento\.distribuicao/);
  assert.equal(/window\.supa/.test(body), false);
});

test('cliente-pedido-detail: renderiza a timeline de eventos depois dos itens', () => {
  const matches = [...screen.matchAll(/container\.replaceChildren\(([^;]*)\);/g)];
  const principal = matches.find((m) => m[1].includes('buildResumo()'));
  assert.ok(principal);
  const args = principal[1];
  const idxItens = args.indexOf('buildItens()');
  const idxEventos = args.indexOf('buildEventos()');
  assert.ok(idxItens !== -1);
  assert.ok(idxEventos !== -1);
  assert.ok(idxItens < idxEventos);
});

test('cliente-pedido-detail: titulo da secao "Historico" presente', () => {
  assert.match(screen, /Hist[oó]rico/i);
});

test('cliente-pedido-detail: possui empty state para timeline sem eventos', () => {
  assert.match(screen, /Assim que houver novas atualiza[cç][oõ]es, elas aparecer[aã]o aqui\./);
});

test('cliente-pedido-detail: erro na timeline nao quebra o restante do detalhe (sem loadingError = eventos)', () => {
  assert.equal(/loadingError\s*=\s*['"]eventos['"]/.test(screen), false);
  assert.match(screen, /eventosError/);
});

test('cliente-pedido-detail: titulo da secao "Parciais do pedido" presente', () => {
  assert.match(screen, /Parciais do pedido/i);
});

test('cliente-pedido-detail: possui empty state para parciais sem registros', () => {
  assert.match(screen, /Este pedido ainda n[aÃ£]o possui parciais publicadas\./);
});

test('cliente-pedido-detail: erro nas parciais nao quebra o restante do detalhe', () => {
  assert.equal(/loadingError\s*=\s*['"]parciais['"]/.test(screen), false);
  assert.match(screen, /parciaisError/);
});

test('cliente-pedido-detail: parciais em layout tabular com colunas Parcial/Situacao/Metragem/Atualizado em', () => {
  const body = extractFunctionBody(screen, 'buildParciaisHeaderRow');
  assert.match(body, /['"]Parcial['"]/);
  assert.match(body, /Situa[cç][aã]o/);
  assert.match(body, /Metragem/);
  assert.match(body, /Atualizado em/);
});

test('cliente-pedido-detail: parciais nao usa campos alem do DTO existente (codigo, label, metros, dataReferencia, titulo, mensagemCliente)', () => {
  const body = extractFunctionBody(screen, 'buildParcialRow');
  assert.match(body, /parcial\.codigo/);
  assert.match(body, /parcial\.label/);
  assert.match(body, /parcial\.metros/);
  assert.match(body, /parcial\.dataReferencia/);
  assert.equal(/parcial\.atualizadoEm/.test(body), false);
});

test('cliente-pedido-detail: renderiza itens e distribuicao antes das parciais e preserva timeline depois', () => {
  const matches = [...screen.matchAll(/container\.replaceChildren\(([\s\S]*?)\);/g)];
  const principal = matches.find((m) => m[1].includes('buildResumo()'));
  assert.ok(principal);
  const args = principal[1];
  const idxParciais = args.indexOf('buildParciais()');
  const idxItens = args.indexOf('buildItens()');
  const idxDistribuicao = args.indexOf('buildDistribuicaoAtual()');
  const idxEventos = args.indexOf('buildEventos()');
  assert.ok(idxParciais !== -1);
  assert.ok(idxItens !== -1);
  assert.ok(idxDistribuicao !== -1);
  assert.ok(idxEventos !== -1);
  assert.ok(idxItens < idxParciais);
  assert.ok(idxDistribuicao < idxParciais);
  assert.ok(idxParciais < idxEventos);
});
