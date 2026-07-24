// =====================================================================
// === tests/manta-product-identity-schema.smoke.js ====================
// Static smoke of db/78_manta_product_identity_and_route_foundation.sql.
//
// Proves, by reading the SQL (no app, no Supabase, no DB), that the
// PHASE-MANTA-A foundation is present and shaped as the order requires:
//   - modelos.tipo_produto column + CHECK ('tapete','manta');
//   - Manta width invariant (manta => 1.40);
//   - uniqueness expanded to include tipo_produto;
//   - deterministic, id-free, fail-closed informal-Manta backfill;
//   - pedido_itens Manta width-override guard;
//   - route-homogeneous OP-item guard;
//   - finishing RPCs reject a Manta / non-homogeneous origin by
//     tipo_produto (never by model name), before reserving an OP number,
//     preserving grants and PostgREST reload;
//   - forward-only, idempotent shape.
//
// The live-DB behavior (clean apply, idempotent re-apply, actual
// rejection) is exercised separately by the disposable-cluster
// integration test; this file guards the migration text itself.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '78_manta_product_identity_and_route_foundation.sql');
const rawSql = fs.existsSync(MIGRATION) ? fs.readFileSync(MIGRATION, 'utf8') : '';

function fnSlice(name) {
  const re = new RegExp(
    'CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.' + name + '[\\s\\S]*?\\n\\$\\$;',
    'i',
  );
  return (rawSql.match(re) || [''])[0];
}

function indexOfRequired(haystack, needle, label) {
  const idx = haystack.search(needle);
  assert.ok(idx >= 0, label + ' nao encontrado');
  return idx;
}

test('db/78 migration exists', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/78 nao existe');
});

test('adds modelos.tipo_produto as a NOT NULL column defaulting to tapete', () => {
  assert.match(
    rawSql,
    /ALTER\s+TABLE\s+public\.modelos\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+tipo_produto\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'tapete'/i,
  );
});

test('constrains tipo_produto to tapete | manta', () => {
  assert.match(
    rawSql,
    /ADD\s+CONSTRAINT\s+modelos_tipo_produto_chk\s+CHECK\s*\(\s*tipo_produto\s+IN\s*\(\s*'tapete'\s*,\s*'manta'\s*\)\s*\)/i,
  );
});

test('adds the authoritative Manta width invariant (manta => 1.40)', () => {
  assert.match(
    rawSql,
    /ADD\s+CONSTRAINT\s+modelos_manta_largura_chk\s+CHECK\s*\(\s*tipo_produto\s*<>\s*'manta'\s+OR\s+largura\s*=\s*1\.40\s*\)/i,
  );
});

test('replaces the model uniqueness to include tipo_produto', () => {
  assert.match(rawSql, /DROP\s+CONSTRAINT\s+IF\s+EXISTS\s+modelos_nome_cor_1_id_cor_2_id_largura_key/i);
  assert.match(
    rawSql,
    /ADD\s+CONSTRAINT\s+modelos_nome_cor_1_id_cor_2_id_largura_tipo_produto_key\s+UNIQUE\s*\(\s*nome\s*,\s*cor_1_id\s*,\s*cor_2_id\s*,\s*largura\s*,\s*tipo_produto\s*\)/i,
  );
});

test('backfill identifies the informal Manta by guarded semantics, not a hardcoded id', () => {
  // Semantic match on name + width + current type, upper/trim guarded.
  assert.match(rawSql, /upper\s*\(\s*btrim\s*\(\s*nome\s*\)\s*\)\s*=\s*'MANTA ARABESCO'/i);
  assert.match(rawSql, /largura\s*=\s*1\.40/i);
  // Reclassified target.
  assert.match(rawSql, /SET\s+nome\s*=\s*'ARABESCO'\s*,\s*tipo_produto\s*=\s*'manta'/i);
  // Must NOT hinge on a hardcoded primary key.
  assert.doesNotMatch(rawSql, /WHERE\s+id\s*=\s*13\b/i);
});

test('backfill fails closed on an ambiguous (>1) informal-Manta match', () => {
  assert.match(rawSql, /IF\s+v_count\s*>\s*1\s+THEN[\s\S]*RAISE\s+EXCEPTION[\s\S]*ambiguo/i);
});

test('backfill emits an explicit diagnostic when the informal row is absent (fresh cluster)', () => {
  assert.match(rawSql, /RAISE\s+NOTICE[\s\S]*nenhum modelo informal/i);
});

test('adds the pedido_itens Manta width-override guard trigger', () => {
  assert.match(rawSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.pedido_itens_manta_largura_guard_fn/i);
  const slice = fnSlice('pedido_itens_manta_largura_guard_fn');
  assert.ok(slice, 'guard fn nao encontrada');
  assert.match(slice, /v_tipo\s*=\s*'manta'\s+AND\s+NEW\.largura\s*<>\s*1\.40/i);
  assert.match(slice, /RAISE\s+EXCEPTION/i);
  assert.match(
    rawSql,
    /CREATE\s+TRIGGER\s+pedido_itens_manta_largura_guard\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.pedido_itens/i,
  );
});

test('adds the authoritative route-homogeneous OP-item guard trigger', () => {
  assert.match(rawSql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.op_itens_route_homogeneity_guard_fn/i);
  const slice = fnSlice('op_itens_route_homogeneity_guard_fn');
  assert.ok(slice, 'homogeneity guard fn nao encontrada');
  assert.match(slice, /m\.tipo_produto\s*<>\s*v_new_tipo/i);
  assert.match(slice, /RAISE\s+EXCEPTION[\s\S]*homogenea/i);
  assert.match(
    rawSql,
    /CREATE\s+TRIGGER\s+op_itens_route_homogeneity_guard\s+BEFORE\s+INSERT\s+OR\s+UPDATE\s+ON\s+public\.op_itens/i,
  );
});

for (const fn of ['gerar_op_latex', 'gerar_op_latex_split']) {
  test(`${fn} rejects a Manta origin by tipo_produto before reserving an OP number`, () => {
    const slice = fnSlice(fn);
    assert.ok(slice, `${fn} nao encontrada na db/78`);
    // Manta rejection derived from modelos.tipo_produto (no name compare).
    assert.match(slice, /JOIN\s+public\.modelos\s+m\s+ON\s+m\.id\s*=\s*oi\.modelo_id[\s\S]*m\.tipo_produto\s*=\s*'manta'/i);
    assert.match(slice, /RAISE\s+EXCEPTION[\s\S]*Manta[\s\S]*Acabamento\/Latex/i);
    // Defensive non-homogeneous rejection.
    assert.match(slice, /count\s*\(\s*DISTINCT\s+m\.tipo_produto\s*\)[\s\S]*>\s*1/i);
    // Guard precedes number reservation.
    const guardIdx = indexOfRequired(slice, /m\.tipo_produto\s*=\s*'manta'/i, `${fn} manta guard`);
    const numberIdx = indexOfRequired(slice, /public\.proximo_numero_op\s*\(/i, `${fn} proximo_numero_op`);
    assert.ok(guardIdx < numberIdx, `${fn}: Manta guard deve ocorrer antes de reservar numero`);
  });
}

test('finishing exclusion never compares against the model name string', () => {
  const g1 = fnSlice('gerar_op_latex');
  const g2 = fnSlice('gerar_op_latex_split');
  for (const slice of [g1, g2]) {
    assert.doesNotMatch(slice, /nome\s+ILIKE/i);
    assert.doesNotMatch(slice, /m\.nome\s*=/i);
    assert.doesNotMatch(slice, /ILIKE\s+'%manta%'/i);
  }
});

test('db/78 preserves finishing RPC grants and PostgREST reload', () => {
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex\s*\(\s*BIGINT\s*\)\s+TO\s+authenticated/i);
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex_split\s*\(\s*BIGINT\s*,\s*TEXT\s*\)\s+TO\s+authenticated/i);
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload schema'/i);
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload config'/i);
});

test('db/78 is forward-only and idempotent in shape', () => {
  assert.match(rawSql, /\bBEGIN;/i);
  assert.match(rawSql, /\bCOMMIT;/i);
  assert.match(rawSql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i);
  assert.match(rawSql, /DROP\s+CONSTRAINT\s+IF\s+EXISTS/i);
  assert.match(rawSql, /DROP\s+TRIGGER\s+IF\s+EXISTS/i);
  // No destructive reinterpretation of operational history.
  assert.doesNotMatch(rawSql, /DELETE\s+FROM\s+public\./i);
  assert.doesNotMatch(rawSql, /DROP\s+TABLE/i);
});

test('db/78 adds no redundant product-type column outside modelos', () => {
  for (const tbl of ['pedido_itens', 'op_itens', 'ops', 'lotes', 'entregas']) {
    assert.doesNotMatch(
      rawSql,
      new RegExp('ALTER\\s+TABLE\\s+public\\.' + tbl + '\\s+ADD\\s+COLUMN[\\s\\S]*tipo_produto', 'i'),
    );
  }
});
