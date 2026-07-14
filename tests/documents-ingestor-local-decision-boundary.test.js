// =====================================================================
// === tests/documents-ingestor-local-decision-boundary.test.js ==========
// IAexec source-context guard for local decision helpers.
//
// Fase: G28-B5-D5-B2
// Escopo: prova que o codigo PATCHADO exige fonte explicita
//   (manual/legacy) para operacoes locais e rejeita qualquer
//   outra proveniencia com fail-closed. Todos os casos rejeitados
//   devem ter zero acesso a localStorage (getItem/setItem).
//
// Contraste:
//   RED = comportamento do codigo ANTIGO (sem guarda) documentado
//   no commit original; esses testes falham agora APOS o patch.
//   GREEN = comportamento obrigatorio POS-patch.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const INGESTOR = path.join(ROOT, 'js', 'documents-ingestor.js');
const ingestorSrc = fs.readFileSync(INGESTOR, 'utf8');

const DOC_ID = 'cda18ef9-d1d9-4f5a-8956-74875cd60b05';

function makeSandbox() {
  var getItemCount = 0;
  var setItemCount = 0;
  var localStorageMock = (function () {
    var _data = {};
    return {
      getItem: function (k) { getItemCount++; return _data.hasOwnProperty(k) ? _data[k] : null; },
      setItem: function (k, v) { setItemCount++; _data[k] = String(v); },
      removeItem: function (k) { delete _data[k]; },
      clear: function () { _data = {}; },
      get length() { return Object.keys(_data).length; },
      key: function (i) { return Object.keys(_data)[i] || null; },
    };
  })();

  var sandbox = {
    window: null,
    globalThis: null,
    console: console,
    setTimeout: setTimeout,
    localStorage: localStorageMock,
    _getItemCount: function () { return getItemCount; },
    _setItemCount: function () { return setItemCount; },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(ingestorSrc, sandbox, { filename: 'js/documents-ingestor.js' });
  return sandbox;
}

function makeDoc(overrides) {
  return Object.assign({
    document_id: DOC_ID,
    filename_original: 'doc.pdf',
    tipo_documento: 'nf',
    formato: 'pdf',
    status: 'pending',
  }, overrides || {});
}

// =====================================================================
// IAexec guard: source obrigatorio para operacoes locais
// =====================================================================

test('GREEN: saveDocumentDecision aceita com source manual', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  assert.ok(r.ok, 'save com source manual');
});

test('GREEN: saveDocumentDecision aceita com source legacy', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'x' }, 'legacy');
  assert.ok(r.ok, 'save com source legacy');
});

test('RED: saveDocumentDecision recusado sem source', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' });
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save sem source');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save sem source');
});

test('RED: saveDocumentDecision recusado com source supabase', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'supabase');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com supabase');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com supabase');
});

test('RED: saveDocumentDecision recusado com source unknown', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'unknown');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com unknown');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com unknown');
});

test('RED: saveDocumentDecision recusado com source vazio', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, '');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com source vazio');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com source vazio');
});

test('RED: saveDocumentDecision recusado com source null', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, null);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com source null');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com source null');
});

test('RED: saveDocumentDecision recusado com source undefined', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, undefined);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com source undefined');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com source undefined');
});

test('RED: saveDocumentDecision recusado com source whitespace', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, '   ');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com whitespace');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com whitespace');
});

test('RED: saveDocumentDecision recusado com source bogus', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'bogus');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos save com bogus');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos save com bogus');
});

// =====================================================================
// removeDocumentDecision guard
// =====================================================================

test('GREEN: removeDocumentDecision aceita com source manual', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var r = ns.removeDocumentDecision(DOC_ID, 'manual');
  assert.ok(r.ok);
});

test('RED: removeDocumentDecision recusado sem source', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.removeDocumentDecision(DOC_ID);
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos remove sem source');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos remove sem source');
});

test('RED: removeDocumentDecision recusado com source supabase', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var r = ns.removeDocumentDecision(DOC_ID, 'supabase');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos remove com supabase');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos remove com supabase');
});

// =====================================================================
// getDocumentDecision guard
// =====================================================================

test('GREEN: getDocumentDecision funciona com source manual', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'x' }, 'manual');
  var d = ns.getDocumentDecision(DOC_ID, 'manual');
  assert.ok(d);
  assert.equal(d.status, 'rejected');
});

test('RED: getDocumentDecision retorna null sem source', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var d = ns.getDocumentDecision(DOC_ID);
  assert.strictEqual(d, null);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos get sem source');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos get sem source');
});

test('RED: getDocumentDecision retorna null com source supabase', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var d = ns.getDocumentDecision(DOC_ID, 'supabase');
  assert.strictEqual(d, null);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos get com supabase');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos get com supabase');
});

test('RED: getDocumentDecision retorna null com source bogus', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var d = ns.getDocumentDecision(DOC_ID, 'bogus');
  assert.strictEqual(d, null);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos get com bogus');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos get com bogus');
});

// =====================================================================
// getEffectiveDocumentStatus: ID-only nunca le mapa local
// =====================================================================

test('RED: getEffectiveDocumentStatus ID-only sem source NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var eff = ns.getEffectiveDocumentStatus(DOC_ID, 'pending');
  assert.ok(eff);
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus, ignora decisao local');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos ID-only sem source');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos ID-only sem source');
});

test('GREEN: getEffectiveDocumentStatus ID-only com source manual le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var eff = ns.getEffectiveDocumentStatus(DOC_ID, 'pending', 'manual');
  assert.ok(eff);
  assert.equal(eff.effectiveStatus, 'accepted');
  assert.ok(eff.isLocalDecision);
});

// =====================================================================
// Objeto _ravatex_source manual/legacy — autoriza leitura local
// =====================================================================

test('GREEN: objeto _ravatex_source manual funciona', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var doc = makeDoc({ _ravatex_source: 'manual' });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'accepted');
  assert.ok(eff.isLocalDecision);
});

test('GREEN: objeto _ravatex_source legacy funciona', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'x' }, 'legacy');
  var doc = makeDoc({ _ravatex_source: 'legacy' });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'rejected');
  assert.ok(eff.isLocalDecision);
});

// =====================================================================
// Objeto _ravatex_source supabase, unknown, ausente — fail-closed
// =====================================================================

test('RED/GREEN: objeto _ravatex_source supabase NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: 'supabase' });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos source supabase');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos source supabase');
});

test('RED/GREEN: objeto _ravatex_source unknown NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'x' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: 'bogus' });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos source bogus');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos source bogus');
});

test('RED/GREEN: objeto sem _ravatex_source NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({});
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos source ausente');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos source ausente');
});

test('RED/GREEN: objeto _ravatex_source null NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: null });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'pending');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos source null');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos source null');
});

test('RED/GREEN: objeto _ravatex_source vazio NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: '' });
  var eff = ns.getEffectiveDocumentStatus(doc);
  assert.equal(eff.effectiveStatus, 'pending');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos source vazio');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos source vazio');
});

// =====================================================================
// Objeto unknown/bogus + terceiro argumento 'manual' — objeto e autoritativo
// =====================================================================

test('RED/GREEN: objeto bogus + terceiro arg manual ainda falha closed', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: 'bogus' });
  var eff = ns.getEffectiveDocumentStatus(doc, 'pending', 'manual');
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus, ignora terceiro arg');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos objeto bogus + arg manual');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos objeto bogus + arg manual');
});

test('RED/GREEN: objeto sem source + terceiro arg legacy falha closed', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var doc = makeDoc({ _ravatex_source: undefined }); // source undefined
  var eff = ns.getEffectiveDocumentStatus(doc, 'pending', 'legacy');
  assert.equal(eff.effectiveStatus, 'pending', 'usa importedStatus do objeto, terceiro arg nao sobrepoe');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos objeto sem source + arg legacy');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos objeto sem source + arg legacy');
});

// =====================================================================
// loadDocumentDecisions direto — exige source explicita
// =====================================================================

test('RED: loadDocumentDecisions sem source retorna {} sem ler localStorage', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var result = ns.loadDocumentDecisions();
  assert.strictEqual(typeof result, 'object', 'retorna objeto');
  assert.strictEqual(Object.keys(result).length, 0, 'objeto vazio sem source');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos load sem source');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos load sem source');
});

test('RED: loadDocumentDecisions com source invalido retorna {} sem ler localStorage', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var result = ns.loadDocumentDecisions('supabase');
  assert.strictEqual(typeof result, 'object', 'retorna objeto');
  assert.strictEqual(Object.keys(result).length, 0, 'objeto vazio com supabase');
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos load com supabase');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos load com supabase');
});

test('GREEN: loadDocumentDecisions com source manual le localStorage', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var result = ns.loadDocumentDecisions('manual');
  assert.ok(typeof result === 'object');
  assert.ok(result[DOC_ID]);
  assert.equal(result[DOC_ID].status, 'accepted');
});

test('GREEN: loadDocumentDecisions com source legacy le localStorage', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'x' }, 'legacy');
  var result = ns.loadDocumentDecisions('legacy');
  assert.ok(typeof result === 'object');
  assert.ok(result[DOC_ID]);
  assert.equal(result[DOC_ID].status, 'rejected');
});

// =====================================================================
// Supabase save/remove rejeitados (antes eram aceitos)
// =====================================================================

test('RED: Supabase save rejeitado (antes aceito)', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'supabase');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
});

test('RED: Supabase remove rejeitado (antes aceito)', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.removeDocumentDecision(DOC_ID, 'supabase');
  assert.equal(r.ok, false);
  assert.equal(r.error, 'legacy_source_required');
});

// =====================================================================
// Pedido Detail bridge rdoc fail-closed: objeto sem _ravatex_source
// =====================================================================

test('RED: bridge rdoc sem source getEffectiveDocumentStatus NAO le mapa local', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var getBefore = sb._getItemCount();
  var setBefore = sb._setItemCount();
  var eff = ns.getEffectiveDocumentStatus(makeDoc({}));
  assert.equal(eff.effectiveStatus, 'pending', 'bridge rdoc fail-closed');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(sb._getItemCount() - getBefore, 0, 'zero getItem apos bridge rdoc');
  assert.equal(sb._setItemCount() - setBefore, 0, 'zero setItem apos bridge rdoc');
});

// =====================================================================
// Decorated doc com _ravatex_source (screen handlers pass real source)
// =====================================================================

test('GREEN: screen accept handler passes source — saveDocumentDecision ok', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  assert.ok(r.ok);
  // reload
  var d = ns.getDocumentDecision(DOC_ID, 'manual');
  assert.ok(d);
  assert.equal(d.status, 'accepted');
});

test('GREEN: screen reject handler passes source', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var r = ns.saveDocumentDecision(DOC_ID, { status: 'rejected', motivo: 'teste' }, 'legacy');
  assert.ok(r.ok);
  var d = ns.getDocumentDecision(DOC_ID, 'legacy');
  assert.equal(d.status, 'rejected');
});

test('GREEN: screen undo handler passes source — remove ok', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var r = ns.removeDocumentDecision(DOC_ID, 'manual');
  assert.ok(r.ok);
  var d = ns.getDocumentDecision(DOC_ID, 'manual');
  assert.strictEqual(d, null);
});

// =====================================================================
// getEffectiveDocumentStatus preserve exists expected fields
// =====================================================================

test('GREEN: effective status preserves fields for manual source', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  ns.saveDocumentDecision(DOC_ID, { status: 'accepted' }, 'manual');
  var eff = ns.getEffectiveDocumentStatus(DOC_ID, 'pending', 'manual');
  assert.ok(eff.document_id);
  assert.equal(eff.importedStatus, 'pending');
  assert.equal(eff.effectiveStatus, 'accepted');
  assert.ok(eff.isLocalDecision);
  assert.ok(eff.isDivergent);
  assert.ok(eff.decision);
});

test('GREEN: effective status no decision fields corretos', function () {
  var sb = makeSandbox();
  var ns = sb.window.RAVATEX_DOCUMENTS;
  var eff = ns.getEffectiveDocumentStatus(DOC_ID, 'accepted', 'manual');
  assert.equal(eff.importedStatus, 'accepted');
  assert.equal(eff.effectiveStatus, 'accepted');
  assert.equal(eff.isLocalDecision, false);
  assert.equal(eff.isDivergent, false);
  assert.strictEqual(eff.decision, null);
});
