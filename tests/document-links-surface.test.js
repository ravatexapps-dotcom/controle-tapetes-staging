'use strict';

// G28-B7 — canonical link timeline projection + shared surface UI helper.
// Timeline entries and OP/Pedido surface rendering derive only from the active
// canonical revision (or explicit history records); never from pedido_manual /
// candidate.pedido_id.

var test = require('node:test');
var assert = require('node:assert/strict');
var surface = require('../js/document-surface-links-read-model.js');
var ui = require('../js/document-links-surface-ui.js');

var S = surface.constants.SURFACE_LINK_STATE;
var K = surface.constants.TIMELINE_KIND;

var PEDIDO_A = '11111111-1111-4111-8111-111111111111';
var PEDIDO_B = '22222222-2222-4222-8222-222222222222';

function supaDoc(over) {
  var d = {
    document_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    filename_original: 'NF-1.xml', tipo_documento: 'nf', formato: 'xml', direcao_nf: 'entrada',
    status: 'accepted', drive_web_view_link: 'https://drive.example/1',
    linked_at: '2026-07-10T10:00:00.000Z', pedido_manual: null, pedido_id: null,
    _ravatex_source: 'supabase', _ravatex_server_decision: { status: 'accepted' },
    _ravatex_link_revision: { state: 'available', revision_id: 'r1', version: 1, pedido_id: null, pedido_status: null, op_links: [] },
  };
  if (over) for (var k in over) if (Object.prototype.hasOwnProperty.call(over, k)) d[k] = over[k];
  return d;
}

function canon(documents) {
  return { documents: documents, globalSource: 'supabase', globalRemoteAvailability: 'available' };
}

// ---------------------------------------------------------------------
// Timeline projection
// ---------------------------------------------------------------------

test('timeline pedido: active confirmed link produces a linked entry', function () {
  var doc = supaDoc({ _ravatex_link_revision: { state: 'available', revision_id: 'r1', version: 2, pedido_id: PEDIDO_A, pedido_status: 'em_producao', op_links: [] } });
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, canon([doc]));
  assert.equal(tl.state, S.AVAILABLE);
  assert.equal(tl.entries.length, 1);
  assert.equal(tl.entries[0].kind, K.LINKED);
  assert.equal(tl.entries[0].confirmed, true);
  assert.equal(tl.entries[0].revision.version, 2);
});

test('timeline pedido: explicit empty active revision yields empty (no false entry)', function () {
  var doc = supaDoc(); // revision pedido_id null
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, canon([doc]));
  assert.equal(tl.state, S.EMPTY);
  assert.equal(tl.entries.length, 0);
});

test('timeline pedido: historical replaced revision via explicit revisions', function () {
  var revisions = [
    { document_id: 'd1', filename_original: 'NF.xml', version: 2, active: true, pedido_id: PEDIDO_A, op_ids: [], timestamp: '2026-07-11T09:00:00.000Z' },
    { document_id: 'd1', filename_original: 'NF.xml', version: 1, active: false, pedido_id: PEDIDO_A, op_ids: [], timestamp: '2026-07-10T09:00:00.000Z' },
    { document_id: 'dX', filename_original: 'other.xml', version: 1, active: true, pedido_id: PEDIDO_B, op_ids: [], timestamp: '2026-07-12T09:00:00.000Z' },
  ];
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, { revisions: revisions });
  assert.equal(tl.state, S.AVAILABLE);
  assert.equal(tl.entries.length, 2, 'only revisions touching PEDIDO_A');
  // newest first
  assert.equal(tl.entries[0].revision.version, 2);
  assert.equal(tl.entries[0].kind, K.LINKED);
  assert.equal(tl.entries[0].confirmed, true);
  assert.equal(tl.entries[1].kind, K.REPLACED);
  assert.equal(tl.entries[1].confirmed, false);
});

test('timeline pedido: stable ordering newest-first, deterministic ties', function () {
  var revisions = [
    { document_id: 'b', version: 1, active: true, pedido_id: PEDIDO_A, op_ids: [], timestamp: '2026-07-10T00:00:00.000Z' },
    { document_id: 'a', version: 1, active: true, pedido_id: PEDIDO_A, op_ids: [], timestamp: '2026-07-10T00:00:00.000Z' },
    { document_id: 'c', version: 1, active: true, pedido_id: PEDIDO_A, op_ids: [], timestamp: '2026-07-12T00:00:00.000Z' },
  ];
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, { revisions: revisions });
  var order = tl.entries.map(function (e) { return e.revision.document_id; });
  assert.deepEqual(order, ['c', 'a', 'b'], 'newest first; equal timestamps tie-broken by document_id');
});

test('timeline pedido: unavailable canonical source is fail-closed', function () {
  var doc = supaDoc({ _ravatex_link_revision: { state: 'unavailable' } });
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, canon([doc]));
  assert.equal(tl.state, S.UNAVAILABLE);
  assert.equal(tl.entries.length, 0);
});

test('timeline op: included only when OP explicitly present in the revision', function () {
  var doc = supaDoc({ _ravatex_link_revision: { state: 'available', revision_id: 'r1', version: 1, pedido_id: PEDIDO_A, op_links: [{ op_id: 10, op_status: 'aberta' }] } });
  var inc = surface.buildDocumentLinkTimelineForOp(10, canon([doc]));
  var exc = surface.buildDocumentLinkTimelineForOp(99, canon([doc]));
  assert.equal(inc.state, S.AVAILABLE);
  assert.equal(inc.entries.length, 1);
  assert.equal(exc.state, S.EMPTY, 'OP not present -> not inferred via Pedido');
});

test('timeline: pedido_manual suggestion never appears as a confirmed entry', function () {
  var doc = supaDoc({ pedido_manual: 'PED-1', pedido_id: PEDIDO_A, _ravatex_link_revision: { state: 'available', revision_id: 'r1', version: 1, pedido_id: null, op_links: [] } });
  var tl = surface.buildDocumentLinkTimelineForPedido(PEDIDO_A, canon([doc]));
  assert.equal(tl.state, S.EMPTY);
});

// ---------------------------------------------------------------------
// Shared surface UI helper (mock el)
// ---------------------------------------------------------------------

function flatten(children) {
  var t = '';
  for (var i = 0; i < children.length; i++) {
    var c = children[i];
    if (c === null || c === undefined) continue;
    if (typeof c === 'string') t += c;
    else if (c && typeof c.textContent === 'string') t += c.textContent;
  }
  return t;
}
function mockEl() {
  return function (tag, attrs) {
    var kids = [];
    for (var i = 2; i < arguments.length; i++) { if (arguments[i] != null) kids.push(arguments[i]); }
    var node = { tag: tag, attrs: attrs || {}, children: kids, onclick: attrs && attrs.onclick };
    node.textContent = flatten(kids);
    node.appendChild = function (c) { if (c != null) { kids.push(c); node.children = kids; node.textContent = flatten(kids); } };
    return node;
  };
}
function texts(node, acc) {
  acc = acc || [];
  if (!node) return acc;
  if (typeof node === 'string') { acc.push(node); return acc; }
  if (node.textContent) acc.push(node.textContent);
  (node.children || []).forEach(function (c) { texts(c, acc); });
  return acc;
}
function findButton(node, label, found) {
  found = found || { btn: null };
  if (!node || typeof node !== 'object' || found.btn) return found.btn;
  if (node.tag === 'button' && node.textContent === label) { found.btn = node; return node; }
  (node.children || []).forEach(function (c) { findButton(c, label, found); });
  return found.btn;
}

var confirmedResult = { state: 'available', confirmed: [
  { document_id: 'd1', filename_original: 'NF-op.xml', tipo_documento: 'nf', formato: 'xml', status: 'accepted', drive_web_view_link: 'https://drive.example/op', link_version: 3, pedido_id: PEDIDO_A, op_ids: [7], target_cancelled: false },
] };

test('ui: OP card renders one confirmed document with confirmed pill', function () {
  var el = mockEl();
  var built = ui.buildLinkedDocumentNodes({ el: el }, confirmedResult, { emptyText: 'Nenhum documento vinculado a esta OP.' });
  assert.equal(built.state, 'available');
  var joined = built.nodes.map(function (n) { return texts(n).join(' '); }).join(' | ');
  assert.match(joined, /NF-op\.xml/);
  assert.match(joined, /Vinculo confirmado/);
  assert.match(joined, /Revisao v3/);
});

test('ui: OP card renders multiple confirmed documents', function () {
  var el = mockEl();
  var res = { state: 'available', confirmed: [confirmedResult.confirmed[0], { document_id: 'd2', filename_original: 'romaneio.pdf', tipo_documento: 'romaneio', formato: 'pdf', status: 'pending', drive_web_view_link: null, link_version: 1, op_ids: [7], target_cancelled: false }] };
  var built = ui.buildLinkedDocumentNodes({ el: el }, res, {});
  assert.equal(built.nodes.length, 2);
});

test('ui: OP card empty state is explicit', function () {
  var el = mockEl();
  var built = ui.buildLinkedDocumentNodes({ el: el }, { state: 'empty', confirmed: [] }, { emptyText: 'Nenhum documento vinculado a esta OP.' });
  assert.equal(built.state, 'empty');
  assert.match(texts(built.nodes[0]).join(' '), /Nenhum documento vinculado a esta OP\./);
});

test('ui: OP card unavailable state is explicit, not a silent empty', function () {
  var el = mockEl();
  var built = ui.buildLinkedDocumentNodes({ el: el }, { state: 'unavailable', confirmed: [] }, {});
  assert.equal(built.state, 'unavailable');
  assert.match(texts(built.nodes[0]).join(' '), /indisponiveis nesta sessao/);
});

test('ui: OP card safe open action calls openDoc with the drive url only', function () {
  var el = mockEl();
  var opened = [];
  var built = ui.buildLinkedDocumentNodes({ el: el, openDoc: function (u) { opened.push(u); } }, confirmedResult, {});
  var btn = null;
  built.nodes.forEach(function (n) { btn = btn || findButton(n, 'Ver'); });
  assert.ok(btn, 'Ver button present');
  assert.equal(typeof btn.onclick, 'function');
  assert.equal(btn.onclick.length, 0, 'onclick takes no arguments');
  btn.onclick();
  assert.deepEqual(opened, ['https://drive.example/op']);
});

test('ui: OP card flags a cancelled linked target', function () {
  var el = mockEl();
  var res = { state: 'available', confirmed: [Object.assign({}, confirmedResult.confirmed[0], { target_cancelled: true })] };
  var built = ui.buildLinkedDocumentNodes({ el: el }, res, {});
  assert.match(built.nodes.map(function (n) { return texts(n).join(' '); }).join(' '), /cancelado/);
});

test('ui: timeline nodes render confirmed entries; empty yields no nodes', function () {
  var el = mockEl();
  var tl = { state: 'available', entries: [
    { kind: 'linked', confirmed: true, revision: { document_id: 'd1', filename_original: 'NF.xml', version: 2, timestamp: '2026-07-10T00:00:00.000Z', target_cancelled: false } },
    { kind: 'replaced', confirmed: false, revision: { document_id: 'd1', filename_original: 'NF.xml', version: 1, timestamp: '2026-07-09T00:00:00.000Z', target_cancelled: false } },
  ] };
  var built = ui.buildLinkTimelineNodes({ el: el }, tl, {});
  assert.equal(built.nodes.length, 2);
  var joined = built.nodes.map(function (n) { return texts(n).join(' '); }).join(' | ');
  assert.match(joined, /Documento vinculado/);
  assert.match(joined, /Vinculo substituido/);

  var emptyBuilt = ui.buildLinkTimelineNodes({ el: el }, { state: 'empty', entries: [] }, {});
  assert.equal(emptyBuilt.nodes.length, 0);
  var unavailBuilt = ui.buildLinkTimelineNodes({ el: el }, { state: 'unavailable', entries: [] }, {});
  assert.equal(unavailBuilt.nodes.length, 0);
});
