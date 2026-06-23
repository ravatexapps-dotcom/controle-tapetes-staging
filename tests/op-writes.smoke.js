// Smoke test do módulo js/screens/op-writes.js
// (OP-ORDER-WRITE-MODULE-A).
//
// Garante que a extração do helper de write
// `registrarRecebimentoOrdemFio` (write inline em
// buildOrdemPendenteRow de screenNovaOP) do <script> inline de
// index.html para js/screens/op-writes.js preservou o
// comportamento exato. O write é um único update atômico em
// ordens_compra_fio (kg_recebido, data_recebimento, status).
//
// Estáticos:
//   1. js/screens/op-writes.js existe e é script clássico;
//   2. sintaxe JS válida (node --check);
//   3. index.html carrega op-writes.js exatamente 1 vez, sem
//      type=module;
//   4. ordem: op-form-helpers.js → op-writes.js → jspdf → inline;
//   5. inline AINDA contém buildOrdemPendenteRow;
//   6. inline AINDA contém validação kg > 0;
//   7. inline AINDA contém cálculo de status parcial/total;
//   8. inline NÃO contém mais o write inline específico de
//      recebimento em buildOrdemPendenteRow;
//   9. inline AINDA contém atribuirFornecedorFio (que continua
//      com seu próprio supa.from('ordens_compra_fio').update
//      para atribuir fornecedor — NÃO extraído nesta fase);
//  10. inline AINDA contém persistir;
//  11. inline AINDA contém aplicarRecalculo;
//  12. inline AINDA contém screenNovaOP e renderOPLatexAdmin;
//  13. op-writes.js NÃO contém service_role nem password
//      literal longo;
//  14. index.html NÃO contém service_role nem password literal
//      longo;
//
// Runtime (carrega ui + op-writes num vm.Context com supa
// mockado por tabela):
//  15. window.RAVATEX_SCREENS.opWrites existe;
//  16. window.RAVATEX_SCREENS.opWrites.registrarRecebimentoOrdemFio
//      é função;
//  17. window.registrarRecebimentoOrdemFio (global legado) é
//      função;
//  18. registrarRecebimentoOrdemFio chama supa.from('ordens_compra_fio');
//  19. registrarRecebimentoOrdemFio chama .update com
//      { kg_recebido, data_recebimento, status } usando os
//      argumentos recebidos;
//  20. registrarRecebimentoOrdemFio chama .eq('id', ordemId);
//  21. em caso de erro mockado, retorna { error } sem engolir
//      o erro (propaga o valor original);
//  22. em caso de sucesso mockado, retorna o resultado do update
//      sem sobrescrever nada.
//
// Integração (boot chain completa):
//  23. boot: ui + calculo-op + entrega-form + entrega-writes +
//      fornecedor + op-form-helpers + op-writes + inline coexiste
//      sem SyntaxError de duplicate identifier;
//  24. screenPainel (inline) ainda renderiza via shellLayout com
//      9 itens do ADMIN_MENU (regressão common).

'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('node:fs');
const path   = require('node:path');
const vm     = require('node:vm');
const cp     = require('node:child_process');

const ROOT   = path.resolve(__dirname, '..');
const INDEX  = path.join(ROOT, 'index.html');
const OPW    = path.join(ROOT, 'js', 'screens', 'op-writes.js');
const EF     = path.join(ROOT, 'js', 'screens', 'entrega-form.js');
const EW     = path.join(ROOT, 'js', 'screens', 'entrega-writes.js');
const OFH    = path.join(ROOT, 'js', 'screens', 'op-form-helpers.js');
const FORN   = path.join(ROOT, 'js', 'screens', 'fornecedor.js');
const UI     = path.join(ROOT, 'js', 'ui.js');
const BADGES = path.join(ROOT, 'js', 'badges.js');
const ROUTER = path.join(ROOT, 'js', 'router.js');
const CALC   = path.join(ROOT, 'js', 'calculo-op.js');
const SYSTEM_SCREENS = path.join(ROOT, 'js', 'screens', 'system-screens.js');
const COMMON = path.join(ROOT, 'js', 'screens', 'common.js');
const CAD    = path.join(ROOT, 'js', 'screens', 'cadastros.js');
const OPS    = path.join(ROOT, 'js', 'screens', 'ops-list.js');

const indexSrc  = fs.readFileSync(INDEX, 'utf8');
const opwSrc    = fs.readFileSync(OPW,   'utf8');
const efSrc     = fs.readFileSync(EF,    'utf8');
const uiSrc     = fs.readFileSync(UI,    'utf8');
const badgesSrc = fs.readFileSync(BADGES, 'utf8');
const calcSrc   = fs.readFileSync(CALC,  'utf8');
const routerSrc = fs.readFileSync(ROUTER, 'utf8');
const sysSrc    = fs.readFileSync(SYSTEM_SCREENS, 'utf8');
const commonSrc = fs.readFileSync(COMMON, 'utf8');
const cadSrc    = fs.readFileSync(CAD,   'utf8');
const opsSrc    = fs.readFileSync(OPS,   'utf8');
const ewSrc     = fs.readFileSync(EW,    'utf8');
const fornSrc   = fs.readFileSync(FORN,  'utf8');
const ofhSrc    = fs.readFileSync(OFH,   'utf8');

// -----------------------------------------------------------------------------
// Helpers estáticos
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// FakeNode mínimo (para boot chain)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// 1. Estáticos
// -----------------------------------------------------------------------------

test('1. js/screens/op-writes.js existe e é script clássico (não ES module)', () => {
  assert.ok(fs.existsSync(OPW), 'js/screens/op-writes.js não existe');
  assert.equal(/^\s*export\s+/m.test(opwSrc), false,
    'op-writes.js parece usar export — deve ser script clássico');
  assert.equal(/import\s+.*\s+from\s+/.test(opwSrc), false,
    'op-writes.js parece usar import — deve ser script clássico');
});

test('2. op-writes.js: sintaxe JS válida (node --check)', () => {
  cp.execSync(`node --check "${OPW}"`, { stdio: 'pipe' });
});

test('3. index.html carrega op-writes.js EXATAMENTE UMA VEZ, sem type=module', () => {
  const re = /<script\s+src="js\/screens\/op-writes\.js"\s*><\/script>/g;
  const matches = indexSrc.match(re) || [];
  assert.equal(matches.length, 1,
    `esperado 1 <script src="js/screens/op-writes.js">, encontrado ${matches.length}`);
  assert.equal(/<script[^>]*src="js\/screens\/op-writes\.js"[^>]*type=/.test(indexSrc), false,
    'op-writes.js está sendo carregado com type=module');
});

test('4. index.html: ordem op-form-helpers.js → op-writes.js → jspdf → inline', () => {
  const ofhIdx   = findScriptIdx(indexSrc, 'js/screens/op-form-helpers.js');
  const opwIdx   = findScriptIdx(indexSrc, 'js/screens/op-writes.js');
  const jspdfIdx = indexSrc.indexOf('cdnjs.cloudflare.com/ajax/libs/jspdf');
  const inlineIdx = firstInlineScriptIndex(indexSrc);
  assert.ok(ofhIdx > 0, 'op-form-helpers.js não encontrado');
  assert.ok(opwIdx > 0, 'op-writes.js não encontrado');
  assert.ok(jspdfIdx > 0, 'jspdf não encontrado');
  assert.ok(inlineIdx > 0, 'inline não encontrado');
  assert.ok(ofhIdx < opwIdx, 'op-form-helpers deve vir antes de op-writes');
  assert.ok(opwIdx < jspdfIdx, 'op-writes deve vir antes de jspdf');
  assert.ok(opwIdx < inlineIdx, 'op-writes deve vir antes do inline');
});

test('5. inline AINDA contém buildOrdemPendenteRow (a função não foi extraída)', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /function\s+buildOrdemPendenteRow\s*\(/,
    'inline perdeu buildOrdemPendenteRow — função deveria continuar inline');
});

test('6. inline AINDA contém validação kg > 0 em buildOrdemPendenteRow', () => {
  const inline = extractInlineScript(indexSrc);
  // A regra "Informe o kg recebido" + "kg > 0" é da UI, não do write.
  assert.match(inline, /Informe o kg recebido/,
    'inline perdeu a mensagem de validação de kg');
  // Garantia da regra: a expressão "kg > 0" ou "!(kg > 0)" deve estar presente
  assert.match(inline, /!.*kg\s*>\s*0/,
    'inline perdeu a validação "kg > 0"');
});

test('7. inline AINDA contém cálculo de status parcial/total', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /recebido_parcial/,
    'inline perdeu literal "recebido_parcial"');
  assert.match(inline, /recebido_total/,
    'inline perdeu literal "recebido_total"');
});

test('8. inline NÃO contém mais o write inline específico de recebimento', () => {
  // A tripla (supa.from('ordens_compra_fio').update({ kg_recebido, ...
  // data_recebimento, status }) + .eq('id', ordem.id)) era o write
  // movido. Após a extração, o call-site em buildOrdemPendenteRow
  // deve usar window.registrarRecebimentoOrdemFio.
  const inline = extractInlineScript(indexSrc);
  // Buscamos especificamente a forma inline que existia:
  //   supa.from('ordens_compra_fio').update({ kg_recebido: kg, data_recebimento: dataRec, status }).eq('id', ordem.id)
  // Como as variáveis 'kg' e 'dataRec' e 'ordem' são do escopo do
  // onclick, o write inline tinha uma assinatura bem específica.
  const oldInlineWriteRe = /supa\.from\(['"`]ordens_compra_fio['"`]\)\s*\.update\(\s*\{\s*kg_recebido\s*:\s*kg\s*,\s*data_recebimento\s*:\s*dataRec\s*,\s*status\s*\}\s*\)\s*\.eq\(['"`]id['"`]\s*,\s*ordem\.id\s*\)/;
  assert.equal(oldInlineWriteRe.test(inline), false,
    'inline ainda tem o write inline de recebimento que deveria ter sido movido para window.registrarRecebimentoOrdemFio');
  // E deve usar o novo helper:
  assert.match(inline, /window\.registrarRecebimentoOrdemFio\(/,
    'inline não usa window.registrarRecebimentoOrdemFio — call-site não foi atualizado');
});

test('9. inline AINDA contém atribuirFornecedorFio com supa.from("ordens_compra_fio").update (NÃO extraído nesta fase)', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /function\s+atribuirFornecedorFio\s*\(/,
    'inline perdeu atribuirFornecedorFio — função deveria continuar inline');
  // Esse write NÃO foi extraído: ele continua com o write inline
  // para o caso de atribuição de fornecedor.
  // Padrão típico:
  //   supa.from('ordens_compra_fio').update({ fornecedor_id: fornecedorId }).eq('op_id', op.id).eq('tipo', tipo)
  assert.match(inline, /fornecedor_id\s*:\s*fornecedorId/,
    'inline perdeu o write de atribuição de fornecedor (que NÃO deveria ter sido extraído)');
});

test('10. inline AINDA contém persistir (NÃO extraído nesta fase)', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /function\s+persistir\s*\(/,
    'inline perdeu persistir — função deveria continuar inline');
});

test('11. inline AINDA contém aplicarRecalculo (NÃO extraído nesta fase)', () => {
  const inline = extractInlineScript(indexSrc);
  assert.match(inline, /function\s+aplicarRecalculo\s*\(/,
    'inline perdeu aplicarRecalculo — função deveria continuar inline');
});

test('12. inline AINDA contém screenNovaOP e renderOPLatexAdmin', () => {
  const inline = extractInlineScript(indexSrc);
  for (const fn of ['screenNovaOP', 'renderOPLatexAdmin']) {
    assert.match(inline, new RegExp(`(async\\s+)?function\\s+${fn}\\s*\\(`),
      `inline perdeu a função ${fn}`);
  }
});

test('13. op-writes.js NÃO contém service_role nem password literal longo', () => {
  assert.equal(/service_role/i.test(opwSrc), false, 'service_role em op-writes.js');
  assert.equal(/password\s*[:=]\s*['"][A-Za-z0-9._-]{20,}['"]/.test(opwSrc), false,
    'password literal longo em op-writes.js');
});

test('14. index.html NÃO contém service_role nem password literal longo', () => {
  assert.equal(/service_role/i.test(indexSrc), false, 'service_role em index.html');
  assert.equal(/password\s*[:=]\s*['"][A-Za-z0-9._-]{20,}['"]/.test(indexSrc), false,
    'password literal longo em index.html');
});

// -----------------------------------------------------------------------------
// 2. Runtime
// -----------------------------------------------------------------------------

function makeOpWSandbox({ updateResult = { data: null, error: null } } = {}) {
  const document = {
    createElement: (t) => new FakeNode(t),
    createTextNode: (t) => ({ textContent: t, appendChild() {}, setAttribute() {} }),
    querySelector: () => new FakeNode('div'),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    body: new FakeNode('body'),
  };
  const calls = [];
  const fakeSupa = {
    from: (table) => {
      calls.push({ op: 'from', table });
      const chain = {
        _table: table,
        _lastUpdate: null,
        select() { calls.push({ op: 'select', table }); return chain; },
        insert() { calls.push({ op: 'insert', table }); return Promise.resolve({ data: null, error: null }); },
        update(payload) {
          calls.push({ op: 'update', table, args: [payload] });
          chain._lastUpdate = payload;
          return chain;
        },
        delete() { calls.push({ op: 'delete', table }); return chain; },
        eq(col, val) {
          calls.push({ op: 'eq', col, val });
          // Em op-writes.js, o .update().eq() é terminal — retorna a
          // Promise com o resultado configurado.
          if (chain._lastUpdate != null) {
            return Promise.resolve(updateResult);
          }
          return chain;
        },
        order() { return chain; },
        in() { return chain; },
        single() { return Promise.resolve(updateResult); },
        then(resolveThen, rejectThen) {
          return Promise.resolve(updateResult).then(resolveThen, rejectThen);
        },
      };
      return chain;
    },
    rpc: () => { calls.push({ op: 'rpc' }); return Promise.resolve({ data: null, error: null }); },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {},
    _calls: calls,
  };
  const sandbox = {
    document, console, setTimeout, clearTimeout, URL, URLSearchParams,
    Node: FakeNode,
    supa: fakeSupa,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  vm.runInContext(uiSrc,   sandbox, { filename: 'js/ui.js' });
  vm.runInContext(calcSrc, sandbox, { filename: 'js/calculo-op.js' });
  vm.runInContext(opwSrc,  sandbox, { filename: 'js/screens/op-writes.js' });

  return { sandbox, fakeSupa };
}

test('15. runtime: window.RAVATEX_SCREENS.opWrites existe', () => {
  const { sandbox } = makeOpWSandbox();
  assert.ok(vm.runInContext('window.RAVATEX_SCREENS.opWrites', sandbox),
    'window.RAVATEX_SCREENS.opWrites não existe');
});

test('16. runtime: window.RAVATEX_SCREENS.opWrites.registrarRecebimentoOrdemFio é função', () => {
  const { sandbox } = makeOpWSandbox();
  const fn = vm.runInContext('window.RAVATEX_SCREENS.opWrites.registrarRecebimentoOrdemFio', sandbox);
  assert.equal(typeof fn, 'function', 'registrarRecebimentoOrdemFio não é função');
});

test('17. runtime: window.registrarRecebimentoOrdemFio (global legado) é função', () => {
  const { sandbox } = makeOpWSandbox();
  assert.equal(typeof vm.runInContext('window.registrarRecebimentoOrdemFio', sandbox), 'function',
    'window.registrarRecebimentoOrdemFio não é função');
});

test('18. runtime: registrarRecebimentoOrdemFio chama supa.from("ordens_compra_fio")', async () => {
  const { sandbox, fakeSupa } = makeOpWSandbox();
  await vm.runInContext(
    'window.registrarRecebimentoOrdemFio({ ordemId: 99, kgRecebido: 5, dataRecebimento: "2026-06-23", status: "recebido_parcial" })',
    sandbox);
  const fromCalls = fakeSupa._calls.filter(c => c.op === 'from').map(c => c.table);
  assert.ok(fromCalls.includes('ordens_compra_fio'),
    `helper não chamou from('ordens_compra_fio') (tabelas: ${fromCalls.join(',')})`);
});

test('19. runtime: registrarRecebimentoOrdemFio chama .update com { kg_recebido, data_recebimento, status } dos argumentos', async () => {
  const { sandbox, fakeSupa } = makeOpWSandbox();
  await vm.runInContext(
    'window.registrarRecebimentoOrdemFio({ ordemId: 99, kgRecebido: 5, dataRecebimento: "2026-06-23", status: "recebido_parcial" })',
    sandbox);
  const updateCalls = fakeSupa._calls.filter(c => c.op === 'update' && c.table === 'ordens_compra_fio');
  assert.equal(updateCalls.length, 1, 'esperado 1 update em ordens_compra_fio');
  const payload = updateCalls[0].args[0];
  assert.equal(payload.kg_recebido, 5, 'payload kg_recebido não bate');
  assert.equal(payload.data_recebimento, '2026-06-23', 'payload data_recebimento não bate');
  assert.equal(payload.status, 'recebido_parcial', 'payload status não bate');
});

test('20. runtime: registrarRecebimentoOrdemFio chama .eq("id", ordemId)', async () => {
  const { sandbox, fakeSupa } = makeOpWSandbox();
  await vm.runInContext(
    'window.registrarRecebimentoOrdemFio({ ordemId: 99, kgRecebido: 5, dataRecebimento: "2026-06-23", status: "recebido_parcial" })',
    sandbox);
  const eqCalls = fakeSupa._calls.filter(c => c.op === 'eq');
  assert.ok(eqCalls.length >= 1, 'esperado ao menos 1 eq()');
  const idEq = eqCalls.find(c => c.col === 'id');
  assert.ok(idEq, 'esperado eq("id", ...)');
  assert.equal(idEq.val, 99, 'eq("id", ...) deve usar ordemId do argumento');
});

test('21. runtime: em caso de erro, retorna { error } sem engolir o erro', async () => {
  const { sandbox } = makeOpWSandbox({
    updateResult: { data: null, error: { message: 'fake error' } },
  });
  const result = await vm.runInContext(
    'window.registrarRecebimentoOrdemFio({ ordemId: 1, kgRecebido: 2, dataRecebimento: "2026-06-23", status: "recebido_total" })',
    sandbox);
  assert.ok(result, 'helper não devolveu resultado');
  assert.ok(result.error, 'helper não devolveu error');
  assert.equal(result.error.message, 'fake error', 'error.message propagado incorretamente');
});

test('22. runtime: em caso de sucesso, retorna o resultado do update sem sobrescrever', async () => {
  const { sandbox } = makeOpWSandbox({
    updateResult: { data: { id: 7, kg_recebido: 3 }, error: null },
  });
  const result = await vm.runInContext(
    'window.registrarRecebimentoOrdemFio({ ordemId: 7, kgRecebido: 3, dataRecebimento: "2026-06-23", status: "recebido_total" })',
    sandbox);
  assert.ok(result, 'helper não devolveu resultado');
  assert.equal(result.error, null, 'helper em sucesso não devolve error');
  assert.deepEqual(result.data, { id: 7, kg_recebido: 3 }, 'helper em sucesso não propaga data');
});

// -----------------------------------------------------------------------------
// 3. Integração: boot completo
// -----------------------------------------------------------------------------

test('23. boot: ui + calculo-op + entrega-form + entrega-writes + fornecedor + op-form-helpers + op-writes + inline coexiste sem SyntaxError', () => {
  const inline = extractInlineScript(indexSrc);
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
    from: (t) => {
      const chain = {
        _table: t,
        select() { return chain; },
        insert() { return Promise.resolve({ data: null, error: null }); },
        update() { return Promise.resolve({ data: null, error: null }); },
        delete() { return chain; },
        eq() { return Promise.resolve({ data: null, error: null }); },
        order() { return chain; },
        in() { return chain; },
        then(r) { return Promise.resolve({ data: null, error: null }).then(r); },
      };
      return chain;
    },
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
    location: { hash: '' },
    supa: fakeSupa,
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

  sandbox.CURRENT_USER = { nome: 'Tester', tipo: 'admin' };
  sandbox.logout = () => {};

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
    'boot com op-writes + inline lançou SyntaxError de duplicate identifier');

  // Valida rotas
  const routes = vm.runInContext('window.routes', sandbox);
  assert.ok(routes && routes['#/login'], 'rota #/login não registrada');
  assert.ok(routes && routes['#/ops'], 'rota #/ops não registrada');
  assert.ok(routes && routes['#/fornecedor/home'], 'rota #/fornecedor/home não registrada');

  // window.registrarRecebimentoOrdemFio deve existir após o boot
  const fn = vm.runInContext('window.registrarRecebimentoOrdemFio', sandbox);
  assert.equal(typeof fn, 'function',
    'window.registrarRecebimentoOrdemFio não é função após o boot completo');

  if (otherErr) {
    console.log('(esperado) inline falhou em runtime fora do duplicate-identifier:',
      String(otherErr.message).slice(0, 120));
  }
});

test('24. screenPainel (inline) ainda renderiza via shellLayout com 9 itens do ADMIN_MENU (regressão common)', () => {
  const inline = extractInlineScript(indexSrc);
  const toastsNode = new FakeNode('div');
  const document = {
    createElement: (t) => new FakeNode(t),
    createTextNode: (t) => ({ textContent: t, appendChild() {}, setAttribute() {} }),
    querySelector: (sel) => (sel === '#toasts') ? toastsNode : new FakeNode('div'),
    querySelectorAll: () => [],
    addEventListener: () => {}, removeEventListener: () => {},
    body: new FakeNode('body'),
  };
  const fakeSupa = { from: () => ({ select() { return this; }, order() { return this; }, then(r) { return Promise.resolve({ data: [], error: null }).then(r); } }) };
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
  sandbox.CURRENT_USER = { nome: 'Tester', tipo: 'admin' };
  sandbox.logout = () => {};
  try {
    vm.runInContext(inline, sandbox, { filename: 'index-inline.js' });
  } catch (e) {
    if (e instanceof SyntaxError && /already been declared/.test(e.message)) {
      throw new Error('duplicate-identifier SyntaxError no boot: ' + e.message);
    }
  }
  const root = vm.runInContext('window.screenPainel()', sandbox);
  assert.ok(root && root.tagName === 'DIV', 'screenPainel não devolveu <div>');
  const flex = root.children.find((c) => c.tagName === 'DIV');
  const aside = flex && flex.children.find((c) => c.tagName === 'ASIDE');
  const links = aside && aside.children.filter((c) => c.tagName === 'A');
  assert.ok(links && links.length === 9,
    `screenPainel não renderizou 9 itens do ADMIN_MENU (renderizou ${links ? links.length : 0})`);
});
