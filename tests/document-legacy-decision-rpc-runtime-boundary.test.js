'use strict';

// =====================================================================
// === tests/document-legacy-decision-rpc-runtime-boundary.test.js ======
// Static boundary: verifies that legacy decision RPC patterns do NOT
// appear in runtime JavaScript after G28-B5-D5-B4 removal.
//
// Analysis is performed on executable code only (comments stripped).
//
// Permitted patterns (NOT banned):
//   - registrar_decisao_documento (canonical)
//   - desfazer_decisao_documento   (independent undo)
//   - textual absence assertions (test code itself)
//
// Scanned: all js/**/*.js files (excluding node_modules).
// =====================================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');

function collectJsFiles(dir) {
  const result = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.js')) result.push(full);
    }
  }
  walk(dir);
  return result.sort();
}

const RUNTIME_FILES = collectJsFiles(JS_DIR).filter(function (f) {
  return !f.includes('node_modules');
});

function stripComments(src) {
  return src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function readAllRuntimeSource() {
  return RUNTIME_FILES.map(function (f) {
    try {
      var src = fs.readFileSync(f, 'utf8');
      return { path: path.relative(ROOT, f), src: src, executable: stripComments(src) };
    }
    catch (e) { return { path: path.relative(ROOT, f), src: '', executable: '' }; }
  });
}

test('G28-B5-D5-B4: zero executable-code occurrences of decideDocumentInCloud', function () {
  var sources = readAllRuntimeSource();
  var found = sources.filter(function (s) {
    return /\bdecideDocumentInCloud\b/.test(s.executable);
  });
  if (found.length > 0) {
    var paths = found.map(function (f) { return f.path; }).join(', ');
    assert.fail('decideDocumentInCloud found in executable code of: ' + paths);
  }
});

test('G28-B5-D5-B4: zero direct .rpc(decidir_documento) calls', function () {
  var sources = readAllRuntimeSource();
  var found = sources.filter(function (s) {
    return /\.rpc\s*\(\s*['"]decidir_documento['"]/.test(s.executable);
  });
  if (found.length > 0) {
    var paths = found.map(function (f) { return f.path; }).join(', ');
    assert.fail('rpc(decidir_documento) found in: ' + paths);
  }
});

test('G28-B5-D5-B4: canonical RPCs registrar_decisao_documento and desfazer_decisao_documento still present', function () {
  var sources = readAllRuntimeSource();
  var registerFound = sources.filter(function (s) {
    return /\.rpc\s*\(\s*['"]registrar_decisao_documento['"]/.test(s.executable);
  });
  assert.ok(registerFound.length > 0, 'registrar_decisao_documento RPC should be present in executable code');
  var undoFound = sources.filter(function (s) {
    return /\.rpc\s*\(\s*['"]desfazer_decisao_documento['"]/.test(s.executable);
  });
  assert.ok(undoFound.length > 0, 'desfazer_decisao_documento RPC should be present in executable code');
});
