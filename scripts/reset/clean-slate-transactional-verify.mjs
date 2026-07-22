// scripts/reset/clean-slate-transactional-verify.mjs
//
// Clean-Slate Transactional Reset — archive & restore-drill VERIFICATION tool.
//
// Governed by docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
// (§8.3 / §16). `verify-archive` re-derives every checksum and identity claim
// from the on-disk archive and fails closed (non-zero exit) on any mismatch,
// without ever printing archived business rows.
//
// Reuses the canonical constants and gate logic from the export tool so the two
// tools cannot drift.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sha256Hex, canonicalJSON,
  EXPORT_TABLES, EXPECTED_ROW_COUNTS, EXPECTED_OP_IDS, EXPECTED_LOTE_IDS, EXPECTED_PEDIDO_IDS,
  EXPECTED_B6, B6_DOCUMENT_ID, TERMINAL_MIGRATION, ARCHIVE_KIND,
  verifyIdentity, verifyCutover, verifyCorpusIdentities,
} from './clean-slate-transactional-export.mjs';

// Preserved-baseline invariants (contract §5/§1.3/§1.4).
export const EXPECTED_SALDO_FIOS = [
  { tipo: 'algodao', cor_id: 1, cor_poliester: null, kg_total: 732.010 },
  { tipo: 'algodao', cor_id: 2, cor_poliester: null, kg_total: 549.010 },
  { tipo: 'algodao', cor_id: 3, cor_poliester: null, kg_total: 549.000 },
  { tipo: 'poliester', cor_id: null, cor_poliester: 'BRANCO', kg_total: 427.500 },
  { tipo: 'poliester', cor_id: null, cor_poliester: 'PRETO', kg_total: 427.500 },
];
export const EXPECTED_OP_NUMEROS = { latex: 18, tecelagem: 41 };

class Verifier {
  constructor() { this.checks = []; this.failed = 0; }
  ok(name) { this.checks.push({ name, ok: true }); }
  fail(name, detail) { this.checks.push({ name, ok: false, detail }); this.failed += 1; }
  assert(cond, name, detail) { cond ? this.ok(name) : this.fail(name, detail); return cond; }
}

function eqSet(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const sa = [...a].map(String).sort(); const sb = [...b].map(String).sort();
  return sa.every((x, i) => x === sb[i]);
}

function readJSON(p) { return JSON.parse(readFileSync(p, 'utf8')); }

// Parse every NDJSON line; returns { rows, lines } or throws on malformed JSON.
function parseNdjson(abs) {
  const raw = existsSync(abs) ? readFileSync(abs, 'utf8') : '';
  if (raw.length === 0) return { rows: [], lines: 0, body: '' };
  if (!raw.endsWith('\n')) throw new Error(`NDJSON file not LF-terminated: ${path.basename(abs)}`);
  const lines = raw.slice(0, -1).split('\n');
  const rows = lines.map((l, i) => {
    if (l.length === 0) throw new Error(`empty NDJSON line ${i + 1} in ${path.basename(abs)}`);
    try { return JSON.parse(l); } catch { throw new Error(`malformed NDJSON line ${i + 1} in ${path.basename(abs)}`); }
  });
  return { rows, lines: rows.length, body: raw };
}

export function verifyArchive(archiveDir) {
  const v = new Verifier();
  const rel = (r) => path.join(archiveDir, r);

  // --- Structure ---
  if (!v.assert(existsSync(archiveDir) && statSync(archiveDir).isDirectory(), 'archive dir exists', archiveDir)) return v;
  for (const f of ['manifest.json', 'checksums.sha256', 'tables', 'evidence']) {
    v.assert(existsSync(rel(f)), `required entry present: ${f}`, f);
  }
  for (const e of ['database-identity.json', 'cutover-state.json', 'preserved-baseline.json', 'corpus-identities.json']) {
    v.assert(existsSync(rel(`evidence/${e}`)), `evidence present: ${e}`, e);
  }
  if (v.failed) return v;

  let manifest;
  try { manifest = readJSON(rel('manifest.json')); } catch (e) { v.fail('manifest parseable', e.message); return v; }
  v.assert(manifest.archive_kind === ARCHIVE_KIND, 'manifest.archive_kind', manifest.archive_kind);
  v.assert(manifest.database?.terminal_migration === TERMINAL_MIGRATION, 'terminal migration evidence', manifest.database?.terminal_migration);

  // --- Prohibited content: only the exact public.* purge tables, no extras ---
  const expectedTables = new Set(EXPORT_TABLES.map((t) => t.name));
  const tableFiles = readdirSync(rel('tables')).filter((f) => f.endsWith('.ndjson'));
  for (const f of tableFiles) {
    const name = f.replace(/\.ndjson$/, '');
    v.assert(expectedTables.has(name), `no prohibited/unexpected table file: ${f}`, name);
    v.assert(name.startsWith('public.'), `no non-public schema exported: ${f}`, name);
    v.assert(!/^auth\./.test(name), `no auth.* content: ${f}`, name);
  }
  v.assert(tableFiles.length === EXPORT_TABLES.length, 'exact table-file count', `${tableFiles.length} != ${EXPORT_TABLES.length}`);

  // --- Per-table: parseable NDJSON, row counts, per-file checksum ---
  const manifestByTable = new Map((manifest.tables || []).map((t) => [t.table, t]));
  const fileShas = new Map();
  for (const t of EXPORT_TABLES) {
    const abs = rel(`tables/${t.name}.ndjson`);
    if (!v.assert(existsSync(abs), `table file present: ${t.name}`, t.name)) continue;
    let parsed;
    try { parsed = parseNdjson(abs); } catch (e) { v.fail(`NDJSON parseable: ${t.name}`, e.message); continue; }
    v.ok(`NDJSON parseable: ${t.name}`);
    v.assert(parsed.lines === EXPECTED_ROW_COUNTS[t.name], `row count: ${t.name}`, `${parsed.lines} != ${EXPECTED_ROW_COUNTS[t.name]}`);
    const mt = manifestByTable.get(t.name);
    v.assert(mt && mt.row_count === parsed.lines, `manifest row_count: ${t.name}`, mt?.row_count);
    const sha = sha256Hex(Buffer.from(parsed.body, 'utf8'));
    fileShas.set(`tables/${t.name}.ndjson`, sha);
    v.assert(mt && mt.sha256 === sha, `per-file checksum: ${t.name}`, 'sha mismatch');
  }

  // --- Evidence checksums ---
  for (const e of ['database-identity.json', 'cutover-state.json', 'preserved-baseline.json', 'corpus-identities.json']) {
    const body = readFileSync(rel(`evidence/${e}`), 'utf8');
    fileShas.set(`evidence/${e}`, sha256Hex(Buffer.from(body, 'utf8')));
  }

  // --- checksums.sha256 cross-check (every listed file matches recomputation) ---
  const manifestBodySha = sha256Hex(Buffer.from(readFileSync(rel('manifest.json'), 'utf8'), 'utf8'));
  const declared = new Map();
  for (const line of readFileSync(rel('checksums.sha256'), 'utf8').split('\n')) {
    const m = line.match(/^([0-9a-f]{64})\s{2}(.+)$/);
    if (m) declared.set(m[2], m[1]);
  }
  for (const [p, sha] of fileShas) {
    v.assert(declared.get(p) === sha, `checksums.sha256 entry: ${p}`, `declared ${declared.get(p)} vs actual ${sha}`);
  }
  v.assert(declared.get('manifest.json') === manifestBodySha, 'checksums.sha256 entry: manifest.json', 'manifest sha mismatch');

  // --- Aggregate checksum recomputation ---
  const aggFiles = [...fileShas.entries()].map(([r, sha]) => ({ rel: r, sha }))
    .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  const aggregate = sha256Hex(aggFiles.map((f) => `${f.rel}\n${f.sha}\n`).join(''));
  v.assert(manifest.aggregate_sha256 === aggregate, 'aggregate checksum', `${manifest.aggregate_sha256} != ${aggregate}`);

  // --- Identity / cutover / preserved-baseline evidence ---
  try { verifyIdentity(readJSON(rel('evidence/database-identity.json'))); v.ok('database identity evidence'); }
  catch (e) { v.fail('database identity evidence', e.message); }
  try { verifyCutover(readJSON(rel('evidence/cutover-state.json'))); v.ok('cutover evidence'); }
  catch (e) { v.fail('cutover evidence', e.message); }

  const preserved = readJSON(rel('evidence/preserved-baseline.json'));
  verifyPreserved(v, preserved);

  // --- Corpus identities (16/20/25 + B6) from evidence AND manifest ---
  try { verifyCorpusIdentities(readJSON(rel('evidence/corpus-identities.json'))); v.ok('corpus identities evidence'); }
  catch (e) { v.fail('corpus identities evidence', e.message); }
  v.assert(eqSet(manifest.targets?.pedido_ids || [], EXPECTED_PEDIDO_IDS), 'manifest 16 Pedido ids', 'mismatch');
  v.assert(eqSet(manifest.targets?.op_ids || [], EXPECTED_OP_IDS), 'manifest 20 OP ids', 'mismatch');
  v.assert(eqSet(manifest.targets?.lote_ids || [], EXPECTED_LOTE_IDS), 'manifest 25 lote ids', 'mismatch');

  // --- B6 fixture footprint from manifest + actual NDJSON ---
  verifyB6(v, archiveDir, manifest);

  // --- Duplicate-identity rejection (PK / target-id uniqueness) ---
  verifyNoDuplicates(v, archiveDir);

  return v;
}

function verifyPreserved(v, preserved) {
  const sf = preserved?.saldo_fios || [];
  v.assert(sf.length === 5, 'preserved saldo_fios = 5 rows', sf.length);
  for (const exp of EXPECTED_SALDO_FIOS) {
    const row = sf.find((r) => r.tipo === exp.tipo && (r.cor_id ?? null) === exp.cor_id && (r.cor_poliester ?? null) === exp.cor_poliester);
    v.assert(row && Number(row.kg_total) === exp.kg_total,
      `saldo_fios ${exp.tipo}/${exp.cor_id ?? exp.cor_poliester} = ${exp.kg_total}`, row?.kg_total);
  }
  v.assert((preserved?.saldo_fios_op_count ?? -1) === 0, 'preserved saldo_fios_op empty', preserved?.saldo_fios_op_count);
  const num = Object.fromEntries((preserved?.op_numeros || []).map((r) => [r.tipo, r.ultimo_numero]));
  v.assert(num.latex === EXPECTED_OP_NUMEROS.latex, 'op_numeros latex = 18', num.latex);
  v.assert(num.tecelagem === EXPECTED_OP_NUMEROS.tecelagem, 'op_numeros tecelagem = 41', num.tecelagem);
  const mc = preserved?.master_counts || {};
  for (const [k, expected] of Object.entries({ clientes: 6, fornecedores: 6, cores: 6, modelos: 12, usuarios: 10, parametros_largura: 2, ordem_compra_config: 1, ordem_compra_cutover: 1, ordem_compra_cutover_source_snapshot: 0, ordem_compra_cutover_inventory_baseline: 0 })) {
    v.assert(mc[k] === expected, `preserved master ${k} = ${expected}`, mc[k]);
  }
  const df = preserved?.documents_front || {};
  for (const [k, expected] of Object.entries({ document_candidates_excl_b6: 39, document_events_total: 1, document_scan_requests: 24, document_scan_runs: 30 })) {
    v.assert(df[k] === expected, `documents front ${k} = ${expected}`, df[k]);
  }
}

function verifyB6(v, archiveDir, manifest) {
  const bf = manifest.b6_fixture || {};
  v.assert(bf.document_id === B6_DOCUMENT_ID, 'B6 fixture id', bf.document_id);
  v.assert(bf.document_link_revision_ops === EXPECTED_B6.document_link_revision_ops, 'B6 document_link_revision_ops = 10', bf.document_link_revision_ops);
  v.assert(bf.document_link_revisions === EXPECTED_B6.document_link_revisions, 'B6 document_link_revisions = 8', bf.document_link_revisions);
  v.assert(eqSet(bf.distinct_ops || [], EXPECTED_B6.distinct_ops), 'B6 distinct OPs = 55,57,61,63', bf.distinct_ops);

  const ropsAbs = path.join(archiveDir, 'tables/public.document_link_revision_ops.ndjson');
  let rops;
  try { rops = parseNdjson(ropsAbs).rows; } catch (e) { v.fail('B6 revision-ops parseable', e.message); return; }
  v.assert(rops.length === 10, 'B6 revision-op rows on disk = 10', rops.length);
  const ops = [...new Set(rops.map((r) => r.op_id))].sort((a, b) => a - b);
  v.assert(eqSet(ops, EXPECTED_B6.distinct_ops), 'B6 revision-op distinct OP footprint = 55,57,61,63', ops.join(','));
  const revAbs = path.join(archiveDir, 'tables/public.document_link_revisions.ndjson');
  const revs = parseNdjson(revAbs).rows;
  const perRev = revs.sort((a, b) => a.version - b.version)
    .map((r) => rops.filter((o) => o.revision_id === r.id).length);
  v.assert(JSON.stringify(perRev) === JSON.stringify(EXPECTED_B6.per_revision),
    'B6 per-revision footprint = 0,0,2,1,2,2,1,2', perRev.join(','));
}

function verifyNoDuplicates(v, archiveDir) {
  const check = (table, keyFn, label) => {
    const abs = path.join(archiveDir, `tables/${table}.ndjson`);
    if (!existsSync(abs)) return;
    let rows;
    try { rows = parseNdjson(abs).rows; } catch { return; }
    const keys = rows.map(keyFn);
    v.assert(new Set(keys.map(String)).size === keys.length, `no duplicate identity: ${label}`, table);
  };
  check('public.pedidos', (r) => r.id, 'pedidos.id');
  check('public.ops', (r) => r.id, 'ops.id');
  check('public.lotes', (r) => r.id, 'lotes.id');
  check('public.document_link_revisions', (r) => r.id, 'document_link_revisions.id');
  check('public.document_link_revision_ops', (r) => `${r.revision_id}|${r.op_id}`, 'document_link_revision_ops(revision_id,op_id)');
  check('public.ordem_compra_item', (r) => r.id, 'ordem_compra_item.id');
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
    else out._.push(a);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._[0] !== 'verify-archive' || !args.archive) {
    process.stderr.write('usage: clean-slate-transactional-verify.mjs verify-archive --archive <ABSOLUTE_ARCHIVE_PATH>\n');
    process.exit(2);
  }
  const v = verifyArchive(path.resolve(args.archive));
  const passed = v.checks.length - v.failed;
  process.stdout.write(`clean-slate archive verification: ${passed}/${v.checks.length} checks passed\n`);
  if (v.failed) {
    for (const c of v.checks.filter((c) => !c.ok)) process.stderr.write(`FAIL: ${c.name}${c.detail ? ` (${c.detail})` : ''}\n`);
    process.exit(1);
  }
}

const isDirect = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirect) {
  try { main(); } catch (err) { process.stderr.write(`${err.message}\n`); process.exit(1); }
}
