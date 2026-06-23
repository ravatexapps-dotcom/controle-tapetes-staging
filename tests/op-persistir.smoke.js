// Smoke test do módulo js/screens/op-persistir.js
// (OP-PERSISTIR-HELPERS-MODULE-A).
//
// Garante que a extração dos helpers puros de persistência
// (`itensValidosOP`, `montarPayloadItensOP`,
// `montarPayloadFornecedoresOP`, `montarPayloadOP`,
// `montarPayloadLote`) do <script> inline de index.html
// para js/screens/op-persistir.js preservou o comportamento exato.
//
// Estáticos:
//   1. js/screens/op-persistir.js existe.
//   2. node --check js/screens/op-persistir.js passa.
//   3. op-persistir.js é script clássico.
//   4. index.html carrega op-persistir.js exatamente uma vez.
//   5. Ordem: op-recalculo.js → op-persistir.js → jspdf → inline.
//   6. window.RAVATEX_SCREENS.opPersistir existe.
//   7-11. windows globais são funções.
//   12-15. itensValidosOP behavior.
//   16. montarPayloadItensOP behavior.
//   17-18. montarPayloadFornecedoresOP behavior.
//   19. montarPayloadOP behavior.
//   20. montarPayloadLote behavior.
//   21. inline ainda contém async function persistir.
//   22-26. writes permanecem inline.
//   27-29. outras funções inline preservadas.
//   30. boot chain sem SyntaxError.

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');
const cp     = require('node:child_process');

const ROOT  = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const OPP   = path.join(ROOT, 'js', 'screens', 'op-persistir.js');
const OPR   = path.join(ROOT, 'js', 'screens', 'op-recalculo.js');
const PAINEL= path.join(ROOT, 'js', 'screens', 'painel.js');
const OLA   = path.join(ROOT, 'js', 'screens', 'op-latex-admin.js');
const OPW   = path.join(ROOT, 'js', 'screens', 'op-writes.js');
const OFH   = path.join(ROOT, 'js', 'screens', 'op-form-helpers.js');
const EF    = path.join(ROOT, 'js', 'screens', 'entrega-form.js');
const EW    = path.join(ROOT, 'js', 'screens', 'entrega-writes.js');
const FORN  = path.join(ROOT, 'js', 'screens', 'fornecedor.js');
const UI    = path.join(ROOT, 'js', 'ui.js');
const BADGES= path.join(ROOT, 'js', 'badges.js');
const ROUTER= path.join(ROOT, 'js', 'router.js');
const CALC  = path.join(ROOT, 'js', 'calculo-op.js');
const SYSTEM_SCREENS = path.join(ROOT, 'js', 'screens', 'system-screens.js');
const COMMON= path.join(ROOT, 'js', 'screens', 'common.js');
const CAD   = path.join(ROOT, 'js', 'screens', 'cadastros.js');
const OPSLIST = path.join(ROOT, 'js', 'screens', 'ops-list.js');

const indexSrc  = fs.readFileSync(INDEX, 'utf8');
const oppSrc    = fs.readFileSync(OPP,   'utf8');
const oprSrc    = fs.readFileSync(OPR,   'utf8');
const painelSrc = fs.readFileSync(PAINEL,'utf8');
const olaSrc    = fs.readFileSync(OLA,   'utf8');
const opwSrc    = fs.readFileSync(OPW,   'utf8');
const ofhSrc    = fs.readFileSync(OFH,   'utf8');
const efSrc     = fs.readFileSync(EF,    'utf8');
const uiSrc     = fs.readFileSync(UI,    'utf8');
const badgesSrc = fs.readFileSync(BADGES,'utf8');
const calcSrc   = fs.readFileSync(CALC,  'utf8');
const routerSrc = fs.readFileSync(ROUTER,'utf8');
const sysSrc    = fs.readFileSync(SYSTEM_SCREENS, 'utf8');
const commonSrc = fs.readFileSync(COMMON,'utf8');
const cadSrc    = fs.readFileSync(CAD,   'utf8');
const opsSrc    = fs.readFileSync(OPSLIST,'utf8');
const ewSrc     = fs.readFileSync(EW,    'utf8');
const fornSrc   = fs.readFileSync(FORN,  'utf8');

function extractInlineScript(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const matches = [];
  let m;
  while ((m = re.exec(html)) !== null) matches.push(m[1]);
  if (matches.length === 0) throw new Error('nenhum <script> inline encontrado');
  return matches.reduce((a, b) => (a.length >= b.length ? a : b));
}

function findScriptIdx(html, src) {
  const re = new RegExp(`<script\\s+src="${src.replace(/\//g, '\\/')}"\\s*></script>`);
  const m = re.exec(html);
  return m ? m.index : -1;
}

function firstInlineScriptIndex(html) {
  const re = /<script(?![^>]*\bsrc=)[^>]*>/g;
  const m = re.exec(html);
  return m ? m.index : -1;
}

class FakeNode {
  constructor(t) {
    this.tagName = (t + '').toUpperCase();
    this.children = [];
    this.className = '';
    this._text = null;
    this._listeners = {};
    this.disabled = false;
    this.value = '';
    this._attrs = {};
  }
  appendChild(n) { this.children.push(n); return n; }
  setAttribute(k, v) { this._attrs[k] = v; if (k === 'disabled') this.disabled = v; }
  addEventListener(type, fn) { this._listeners[type] = fn; }
  removeEventListener(type) { delete this._listeners[type]; }
  replaceChildren(...ns) {
    this.children = [];
    for (const n of ns.flat()) {
      if (n == null || n === false) continue;
      this.children.push(typeof n === 'string' ? { textContent: n, appendChild(){}, setAttribute(){} } : n);
    }
  }
  remove() { this._removed = true; }
  get textContent() { return this._text != null ? this._text : ''; }
  set textContent(v) { this._text = v; }
}

// -------------------------------------------------------------------------
// 1. Estáticos
// -------------------------------------------------------------------------

test('1. js/screens/op-persistir.js existe', () => {
  assert.ok(fs.existsSync(OPP), 'js/screens/op-persistir.js não existe');
});

test('2. op-persistir.js: sintaxe JS válida (node --check)', () => {
  cp.execSync(`node --check "${OPP}"`, { stdio: 'pipe' });
});

test('3. op-persistir.js é script clássico, sem import/export', () => {
  assert.equal(/^\s*export\s+/m.test(oppSrc), false,
    'op-persistir.js parece usar export — deve ser script clássico');
  assert.equal(/import\s+.*\s+from\s+/.test(oppSrc), false,
    'op-persistir.js parece usar import — deve ser script clássico');
});

test('4. index.html carrega op-persistir.js EXATAMENTE UMA VEZ, sem type=module', () => {
  const re = /<script\s+src="js\/screens\/op-persistir\.js"\s*><\/script>/g;
  const matches = indexSrc.match(re) || [];
  assert.equal(matches.length, 1,
    `esperado 1 <script src="js/screens/op-persistir.js">, encontrado ${matches.length}`);
  assert.equal(/<script[^>]*src="js\/screens\/op-persistir\.js"[^>]*type=/.test(indexSrc), false,
    'op-persistir.js está sendo carregado com type=module');
});

test('5. index.html: ordem op-recalculo.js → op-persistir.js → jspdf → inline', () => {
  const oprIdx    = findScriptIdx(indexSrc, 'js/screens/op-recalculo.js');
  const oppIdx    = findScriptIdx(indexSrc, 'js/screens/op-persistir.js');
  const jspdfIdx  = indexSrc.indexOf('cdnjs.cloudflare.com/ajax/libs/jspdf');
  const inlineIdx = firstInlineScriptIndex(indexSrc);
  assert.ok(oprIdx > 0, 'op-recalculo.js não encontrado');
  assert.ok(oppIdx > 0, 'op-persistir.js não encontrado');
  assert.ok(jspdfIdx > 0, 'jspdf não encontrado');
  assert.ok(inlineIdx > 0, 'inline não encontrado');
  assert.ok(oprIdx < oppIdx, 'op-recalculo.js deve vir antes de op-persistir.js');
  assert.ok(oppIdx < jspdfIdx, 'op-persistir.js deve vir antes de jspdf');
  assert.ok(oppIdx < inlineIdx, 'op-persistir.js deve vir antes do inline');
});

// -------------------------------------------------------------------------
// 2. Runtime
// -------------------------------------------------------------------------

function makePersistirBootSandbox() {
  const toastsNode = new FakeNode('div');
  const document = {
    createElement: (t) => new FakeNode(t),
    createTextNode: (t) => ({ textContent: t, appendChild() {}, setAttribute() {} }),
    querySelector: (sel) => (sel === '#toasts') ? toastsNode : new FakeNode('div'),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    body: new FakeNode('body'),
  };
  const fakeSupa = {
    from: () => ({
      select() { return this; },
      order() { return this; },
      eq() { return this; },
      single() { return Promise.resolve({ data: null, error: null }); },
      then(r) { return Promise.resolve({ data: null, error: null }).then(r); },
    }),
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {},
  };
  const sandbox = {
    document, setTimeout, clearTimeout, console, URL, URLSearchParams,
    location: { hash: '' }, supa: fakeSupa,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  vm.runInContext(uiSrc,     sandbox, { filename: 'js/ui.js' });
  vm.runInContext(badgesSrc, sandbox, { filename: 'js/badges.js' });
  vm.runInContext(calcSrc,   sandbox, { filename: 'js/calculo-op.js' });
  vm.runInContext(routerSrc, sandbox, { filename: 'js/router.js' });
  vm.runInContext(sysSrc,    sandbox, { filename: 'js/screens/system-screens.js' });
  vm.runInContext(commonSrc, sandbox, { filename: 'js/screens/common.js' });
  vm.runInContext(cadSrc,    sandbox, { filename: 'js/screens/cadastros.js' });
  vm.runInContext(opsSrc,    sandbox, { filename: 'js/screens/ops-list.js' });
  vm.runInContext(efSrc,     sandbox, { filename: 'js/screens/entrega-form.js' });
  vm.runInContext(ewSrc,     sandbox, { filename: 'js/screens/entrega-writes.js' });
  vm.runInContext(fornSrc,   sandbox, { filename: 'js/screens/fornecedor.js' });
  vm.runInContext(ofhSrc,    sandbox, { filename: 'js/screens/op-form-helpers.js' });
  vm.runInContext(opwSrc,    sandbox, { filename: 'js/screens/op-writes.js' });
  vm.runInContext(olaSrc,    sandbox, { filename: 'js/screens/op-latex-admin.js' });
  vm.runInContext(painelSrc, sandbox, { filename: 'js/screens/painel.js' });
  vm.runInContext(oprSrc,    sandbox, { filename: 'js/screens/op-recalculo.js' });
  vm.runInContext(oppSrc,    sandbox, { filename: 'js/screens/op-persistir.js' });

  sandbox.CURRENT_USER = { nome: 'Tester', tipo: 'admin' };
  sandbox.logout = () => {};

  return { sandbox };
}

test('6. runtime: window.RAVATEX_SCREENS.opPersistir existe', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.ok(vm.runInContext('window.RAVATEX_SCREENS.opPersistir', sandbox),
    'window.RAVATEX_SCREENS.opPersistir não existe');
});

test('7. runtime: window.itensValidosOP é função', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.equal(typeof vm.runInContext('window.itensValidosOP', sandbox), 'function');
});

test('8. runtime: window.montarPayloadItensOP é função', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.equal(typeof vm.runInContext('window.montarPayloadItensOP', sandbox), 'function');
});

test('9. runtime: window.montarPayloadFornecedoresOP é função', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.equal(typeof vm.runInContext('window.montarPayloadFornecedoresOP', sandbox), 'function');
});

test('10. runtime: window.montarPayloadOP é função', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.equal(typeof vm.runInContext('window.montarPayloadOP', sandbox), 'function');
});

test('11. runtime: window.montarPayloadLote é função', () => {
  const { sandbox } = makePersistirBootSandbox();
  assert.equal(typeof vm.runInContext('window.montarPayloadLote', sandbox), 'function');
});

// -------------------------------------------------------------------------
// 3. Testes unitários
// -------------------------------------------------------------------------

function makeUnitSandbox() {
  const sandbox = {};
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(oppSrc, sandbox, { filename: 'js/screens/op-persistir.js' });
  return sandbox;
}

test('12. itensValidosOP filtra item sem modeloId', () => {
  const sandbox = makeUnitSandbox();
  sandbox.itens = [{ modeloId: 0, metros: 100 }, { modeloId: 2, metros: 50 }];
  const result = vm.runInContext('window.itensValidosOP(itens)', sandbox);
  assert.equal(result.length, 1, 'devia filtrar item sem modeloId');
  assert.equal(result[0].modeloId, 2);
});

test('13. itensValidosOP filtra metros zero', () => {
  const sandbox = makeUnitSandbox();
  sandbox.itens = [{ modeloId: 1, metros: 0 }, { modeloId: 2, metros: 50 }];
  const result = vm.runInContext('window.itensValidosOP(itens)', sandbox);
  assert.equal(result.length, 1, 'devia filtrar item com metros zero');
  assert.equal(result[0].modeloId, 2);
});

test('14. itensValidosOP filtra metros inválidos (NaN, negativo)', () => {
  const sandbox = makeUnitSandbox();
  sandbox.itens = [{ modeloId: 1, metros: -10 }, { modeloId: 2, metros: 'abc' }, { modeloId: 3, metros: 30 }];
  const result = vm.runInContext('window.itensValidosOP(itens)', sandbox);
  assert.equal(result.length, 1, 'devia filtrar metros inválidos');
  assert.equal(result[0].modeloId, 3);
});

test('15. itensValidosOP preserva item válido', () => {
  const sandbox = makeUnitSandbox();
  sandbox.itens = [{ modeloId: 1, metros: 100 }];
  const result = vm.runInContext('window.itensValidosOP(itens)', sandbox);
  assert.equal(result.length, 1, 'devia preservar item válido');
  assert.equal(result[0].modeloId, 1);
  assert.equal(result[0].metros, 100);
});

test('16. montarPayloadItensOP gera { op_id, modelo_id, metros_pedidos }', () => {
  const sandbox = makeUnitSandbox();
  sandbox.validos = [{ modeloId: 1, metros: 50 }, { modeloId: 2, metros: 60.5 }];
  sandbox.opId = 42;
  const result = vm.runInContext('window.montarPayloadItensOP(validos, opId)', sandbox);
  assert.equal(result.length, 2);
  assert.equal(result[0].op_id, 42);
  assert.equal(result[0].modelo_id, 1);
  assert.equal(result[0].metros_pedidos, 50);
  assert.equal(result[1].op_id, 42);
  assert.equal(result[1].modelo_id, 2);
  assert.equal(result[1].metros_pedidos, 60.5);
});

test('17. montarPayloadFornecedoresOP gera fornecedor cima quando fornSel.cima existe', () => {
  const sandbox = makeUnitSandbox();
  sandbox.fornSel = { cima: 7, fio_algodao: '', fio_poliester: '' };
  sandbox.opId = 42;
  const result = vm.runInContext('window.montarPayloadFornecedoresOP(fornSel, opId)', sandbox);
  assert.equal(result.length, 1);
  assert.equal(result[0].op_id, 42);
  assert.equal(result[0].fornecedor_id, 7);
  assert.equal(result[0].etapa, 'cima');
});

test('18. montarPayloadFornecedoresOP retorna [] quando fornSel.cima não existe', () => {
  const sandbox = makeUnitSandbox();
  sandbox.fornSel = { cima: '', fio_algodao: '', fio_poliester: '' };
  sandbox.opId = 42;
  const result = vm.runInContext('window.montarPayloadFornecedoresOP(fornSel, opId)', sandbox);
  assert.equal(result.length, 0);
});

test('19. montarPayloadOP gera { numero, ano, status } com números convertidos', () => {
  const sandbox = makeUnitSandbox();
  const result = vm.runInContext(
    'window.montarPayloadOP({ numero: "5", ano: 2026, status: "simulada" })',
    sandbox
  );
  assert.equal(result.numero, 5);
  assert.equal(result.ano, 2026);
  assert.equal(result.status, 'simulada');
});

test('20. montarPayloadLote gera { numero, cliente_id } com números convertidos', () => {
  const sandbox = makeUnitSandbox();
  const result = vm.runInContext(
    'window.montarPayloadLote({ numero: 3, clienteSel: "7" })',
    sandbox
  );
  assert.equal(result.numero, 3);
  assert.equal(result.cliente_id, 7);
});

// -------------------------------------------------------------------------
// 4. Estáticos — inline persistir preservado
// -------------------------------------------------------------------------

test('21. inline AINDA contém async function persistir', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /async\s+function\s+persistir\s*\(/,
    'inline perdeu persistir — função deveria continuar inline');
});

test('22. bloco persistir ainda contém ops.insert/update', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /from\s*\(\s*['"]ops['"]\s*\)/,
    'inline perdeu from("ops")');
});

test('23. bloco persistir ainda contém lotes insert/update', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /from\s*\(\s*['"]lotes['"]\s*\)/);
});

test('24. bloco persistir ainda contém op_itens delete/insert', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /from\s*\(\s*['"]op_itens['"]\s*\)/);
});

test('25. bloco persistir ainda contém op_fornecedores delete/insert', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /from\s*\(\s*['"]op_fornecedores['"]\s*\)/);
});

test('26. bloco persistir ainda contém ordens_compra_fio delete/insert', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /from\s*\(\s*['"]ordens_compra_fio['"]\s*\)/);
});

test('27. salvarSimulacao e abrirOP continuam inline', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /async\s+function\s+salvarSimulacao\s*\(/);
  assert.match(inline, /async\s+function\s+abrirOP\s*\(/);
});

test('28. screenNovaOP continua inline', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /async\s+function\s+screenNovaOP\s*\(/,
    'screenNovaOP não está mais inline');
});

test('29. setRoutes e main continuam inline', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /window\.RAVATEX_ROUTER\.setRoutes\(/);
  assert.match(inline, /async\s+function\s+main\s*\(/);
});

// -------------------------------------------------------------------------
// 5. Boot chain
// -------------------------------------------------------------------------

test('30. boot chain: todos os módulos + op-persistir + inline coexiste sem SyntaxError', () => {
  const inline = extractInlineScript(indexSrc);
  const { sandbox } = makePersistirBootSandbox();

  let threwSyntax = false;
  let otherErr = null;
  try {
    vm.runInContext(inline, sandbox, { filename: 'index-inline.js' });
  } catch (e) {
    if (e instanceof SyntaxError && /already been declared|Identifier .* has already/.test(e.message)) {
      threwSyntax = true;
    } else {
      otherErr = e;
    }
  }
  assert.equal(threwSyntax, false,
    'boot com op-persistir + inline lançou SyntaxError de duplicate identifier');

  if (otherErr) {
    console.log('(esperado) inline falhou em runtime fora do duplicate-identifier:',
      String(otherErr.message).slice(0, 120));
  }
});
