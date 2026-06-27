const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCREEN = path.join(ROOT, 'js', 'screens', 'cliente-pedido-detail.js');

function readOrFail(p) {
  assert.ok(fs.existsSync(p), 'arquivo nao encontrado: ' + p);
  return fs.readFileSync(p, 'utf8');
}

const screen = readOrFail(SCREEN);

test('cliente-pedido-events: arquivo screen existe', () => {
  assert.ok(fs.existsSync(SCREEN), 'js/screens/cliente-pedido-detail.js ausente');
});

test('cliente-pedido-events: sintaxe JS valida (node --check)', () => {
  require('node:child_process').execFileSync(
    process.execPath, ['--check', SCREEN], { stdio: 'pipe' }
  );
});

test('cliente-pedido-events: consulta from(\'pedido_cliente_eventos\')', () => {
  assert.match(screen, /from\(['"]pedido_cliente_eventos['"]\)/);
});

test('cliente-pedido-events: SELECT explicito com id, pedido_id, status, titulo, mensagem, criado_em', () => {
  assert.match(
    screen,
    /\.select\(\s*['"]id,\s*pedido_id,\s*status,\s*titulo,\s*mensagem,\s*criado_em['"]\s*\)/
  );
});

test('cliente-pedido-events: nao seleciona metadata', () => {
  const selectRe = /\.from\(['"]pedido_cliente_eventos['"]\)\s*\.select\(['"]([^'"]*)['"]\)/g;
  let m;
  let found = false;
  while ((m = selectRe.exec(screen)) !== null) {
    if (m[1].includes('metadata')) found = true;
  }
  assert.equal(found, false);
});

test('cliente-pedido-events: nao seleciona criado_por', () => {
  const selectRe = /\.from\(['"]pedido_cliente_eventos['"]\)\s*\.select\(['"]([^'"]*)['"]\)/g;
  let m;
  let found = false;
  while ((m = selectRe.exec(screen)) !== null) {
    if (m[1].includes('criado_por')) found = true;
  }
  assert.equal(found, false);
});

test('cliente-pedido-events: nao seleciona origem', () => {
  const selectRe = /\.from\(['"]pedido_cliente_eventos['"]\)\s*\.select\(['"]([^'"]*)['"]\)/g;
  let m;
  let found = false;
  while ((m = selectRe.exec(screen)) !== null) {
    if (m[1].includes('origem')) found = true;
  }
  assert.equal(found, false);
});

test('cliente-pedido-events: nao usa select(*) em nenhum lugar do arquivo', () => {
  assert.doesNotMatch(screen, /\.select\(\s*['"]\*['"]\s*\)/);
});

test('cliente-pedido-events: filtra eventos por pedido_id', () => {
  const idx = screen.indexOf("from('pedido_cliente_eventos')");
  assert.ok(idx !== -1);
  const trecho = screen.slice(idx, idx + 300);
  assert.match(trecho, /\.eq\(['"]pedido_id['"]\s*,\s*pedidoId\)/);
});

test('cliente-pedido-events: ordena eventos por criado_em desc', () => {
  const idx = screen.indexOf("from('pedido_cliente_eventos')");
  assert.ok(idx !== -1);
  const trecho = screen.slice(idx, idx + 300);
  assert.match(trecho, /\.order\(['"]criado_em['"]\s*,\s*\{\s*ascending:\s*false\s*\}\)/);
});

test('cliente-pedido-events: nao consulta a tabela interna pedido_eventos', () => {
  assert.equal(/from\(['"]pedido_eventos['"]\)/.test(screen), false);
});

test('cliente-pedido-events: nao faz insert/update/delete', () => {
  assert.equal(/\.insert\s*\(/.test(screen), false);
  assert.equal(/\.update\s*\(/.test(screen), false);
  assert.equal(/\.delete\s*\(/.test(screen), false);
});

test('cliente-pedido-events: nao usa rpc nem functions.invoke', () => {
  assert.equal(/\.rpc\s*\(/.test(screen), false);
  assert.equal(/functions\.invoke/.test(screen), false);
});

test('cliente-pedido-events: nao referencia service_role nem token_acesso', () => {
  assert.equal(/service_role/.test(screen), false);
  assert.equal(/token_acesso/.test(screen), false);
});

test('cliente-pedido-events: nao referencia OP, lote, fornecedor, NF, romaneio, custo ou margem', () => {
  assert.equal(/\bop\b/i.test(screen), false);
  assert.equal(/\blote\b/i.test(screen), false);
  assert.equal(/fornecedor/i.test(screen), false);
  assert.equal(/\bNF\b/.test(screen), false);
  assert.equal(/romaneio/i.test(screen), false);
  assert.equal(/custo/i.test(screen), false);
  assert.equal(/margem/i.test(screen), false);
});

test('cliente-pedido-events: renderiza a secao "Atualizacoes do pedido"', () => {
  assert.match(screen, /Atualiza[cç][oõ]es do pedido/i);
});

test('cliente-pedido-events: possui empty state quando nao ha eventos', () => {
  assert.match(screen, /Assim que houver novas atualiza[cç][oõ]es, elas aparecer[aã]o aqui\./);
  assert.match(screen, /state\.eventos\.length\s*===\s*0/);
});

test('cliente-pedido-events: erro na consulta fica isolado em eventosError (nao quebra a tela)', () => {
  assert.match(screen, /eventosError/);
  assert.equal(/loadingError\s*=\s*['"]eventos['"]/.test(screen), false);
});

test('cliente-pedido-events: nao expoe admin (publicador continua sendo o admin, sem UI admin aqui)', () => {
  assert.equal(/RAVATEX_SCREENS\.pedidoTrackingAdmin/.test(screen), false);
  assert.equal(/buildPedidoTrackingAdminCard/.test(screen), false);
});
