// =====================================================================
// === tests/ordem-compra-receipt-routing.smoke.js =====================
// PHASE-C4 (OC-C4-ADMIN-001) — route resolution + script registration +
// call-graph guard. Deviation note (contract §15): the §15 manifest lists
// "extension of tests/boot.smoke.js and/or tests/router.smoke.js"; this
// coverage is instead a NEW sibling test file so the existing boot/router
// suites stay byte-unchanged (cleaner manifest / diff). It proves the exact
// same obligations: #/ordens-compra/:id resolves through the real
// router.js matchRoute() to window.screenOrdemCompra(id); the three new
// receipt scripts are registered in index.html, exactly once, cache-busted,
// ordered before ordem-compra.js; and no legacy-compat receipt RPC exists in
// the C4 call graph.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const indexSrc = read('index.html');

function scriptIdx(html, src) {
  const re = new RegExp(`<script\\s+src="${src.replace(/\//g, '\\/')}(?:\\?[^"]*)?"\\s*></script>`);
  const m = re.exec(html);
  return m ? m.index : -1;
}

test('#/ordens-compra/:id resolves through router.js to screenOrdemCompra(id), admin-gated', () => {
  const calls = [];
  const sandbox = { console, location: { hash: '' }, screenOrdemCompra: (id) => { calls.push(id); return 'view'; } };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('js/router.js'), sandbox, { filename: 'js/router.js' });

  const route = sandbox.RAVATEX_ROUTER.matchRoute('#/ordens-compra/123');
  assert.ok(route, 'dynamic ordem-compra route matched');
  assert.deepEqual([...route.roles], ['admin'], 'admin-gated');
  assert.equal(route.render(), 'view');
  assert.deepEqual(calls, [123], 'render invokes screenOrdemCompra with the numeric id');
  // Not matched by an unrelated / non-numeric hash.
  assert.equal(sandbox.RAVATEX_ROUTER.matchRoute('#/ordens-compra/abc'), null);
});

test('index.html registers the three receipt scripts once, cache-busted, in order before ordem-compra.js', () => {
  const receipt = [
    'js/screens/ordem-compra-receipt-data.js',
    'js/screens/ordem-compra-receipt-render.js',
    'js/screens/ordem-compra-receipt-events.js',
  ];
  for (const src of receipt) {
    const cacheBust = new RegExp(`<script\\s+src="${src.replace(/\//g, '\\/')}\\?v=[^"]+"\\s*></script>`);
    assert.match(indexSrc, cacheBust, `${src} must carry a ?v= cache-buster`);
    const count = (indexSrc.match(new RegExp(`<script\\s+src="${src.replace(/\//g, '\\/')}(?:\\?[^"]*)?"\\s*></script>`, 'g')) || []).length;
    assert.equal(count, 1, `${src} registered exactly once`);
    // Classic script, never type=module.
    assert.equal(new RegExp(`<script[^>]*src="${src.replace(/\//g, '\\/')}(?:\\?[^"]*)?"[^>]*type=`).test(indexSrc), false, `${src} must be a classic script`);
  }
  const dataI = scriptIdx(indexSrc, receipt[0]);
  const renderI = scriptIdx(indexSrc, receipt[1]);
  const eventsI = scriptIdx(indexSrc, receipt[2]);
  const distI = scriptIdx(indexSrc, 'js/screens/ordem-compra-distribuicao.js');
  const detailI = scriptIdx(indexSrc, 'js/screens/ordem-compra.js');
  assert.ok(distI < dataI, 'receipt-data after the existing ordem-compra family');
  assert.ok(dataI < renderI && renderI < eventsI, 'data → render → events order');
  assert.ok(eventsI < detailI, 'all three loaded before the ordem-compra.js orchestrator');
});

test('no legacy-compat receipt RPC in the C4 call graph; native RPCs only', () => {
  // Scan EXECUTABLE code only — the binding-scoping comments legitimately
  // NAME the forbidden compat RPCs to state they are never used.
  const stripComments = (src) => src.replace(/\/\/.*$/gm, '');
  const data = read('js/screens/ordem-compra-receipt-data.js');
  const files = {
    data: stripComments(data),
    render: stripComments(read('js/screens/ordem-compra-receipt-render.js')),
    events: stripComments(read('js/screens/ordem-compra-receipt-events.js')),
  };
  for (const [name, code] of Object.entries(files)) {
    assert.equal(/fio_compat/.test(code), false, `${name}: no legacy compat RPC in executable code`);
    assert.equal(/ordemCompraReceiptCutover|receipt-cutover/.test(code), false, `${name}: does not touch the legacy cutover adapter`);
  }
  // The native RPCs are actually invoked via supa.rpc(...) in the data layer.
  assert.match(files.data, /rpc\(\s*['"]obter_historico_recebimento_ordem_compra['"]/);
  assert.match(files.data, /rpc\(\s*['"]registrar_recebimento_ordem_compra['"]/);
  assert.match(files.data, /rpc\(\s*['"]estornar_recebimento_ordem_compra['"]/);
});
