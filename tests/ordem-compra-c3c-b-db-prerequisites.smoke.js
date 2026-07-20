const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'db', '76_ordem_compra_c3c_b_db_prerequisites.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
// Executable = migration text with line comments stripped, so structural
// assertions about "no forbidden statement" cannot be satisfied by a comment.
const executable = sql.replace(/^\s*--.*$/gm, '');

test('C3C-B is one additive transactional migration', () => {
  assert.equal((executable.match(/^\s*BEGIN\s*;/gim) || []).length, 1);
  assert.equal((executable.match(/^\s*COMMIT\s*;/gim) || []).length, 1);
  assert.match(sql, /SET LOCAL lock_timeout/i);
  assert.match(sql, /SET LOCAL statement_timeout/i);
});

test('exactly the two contracted functions are created, both definer with empty search_path', () => {
  const definitions = [...sql.matchAll(/CREATE OR REPLACE FUNCTION\s+public\.([a-z0-9_]+)\s*\(/gi)]
    .map((match) => match[1]);
  assert.deepEqual(definitions.sort(), [
    'listar_ordens_compra_fio_compat',
    'registrar_recebimento_ordem_compra_fio_compat',
  ]);
  const blocks = [...sql.matchAll(/CREATE OR REPLACE FUNCTION\s+public\.[a-z0-9_]+[\s\S]*?AS\s+\$\$/gi)];
  assert.equal(blocks.length, 2);
  for (const block of blocks) {
    assert.match(block[0], /SECURITY DEFINER/i);
    assert.match(block[0], /SET search_path = ''/i);
  }
});

test('both functions are owner postgres and closed to every role except authenticated', () => {
  for (const signature of [
    'listar_ordens_compra_fio_compat(UUID, BIGINT)',
    'registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT)',
  ]) {
    const escaped = signature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(sql, new RegExp(`ALTER FUNCTION public\\.${escaped} OWNER TO postgres`, 'i'));
    assert.match(sql, new RegExp(`REVOKE ALL ON FUNCTION public\\.${escaped} FROM PUBLIC, anon, service_role`, 'i'));
    assert.match(sql, new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${escaped} TO authenticated`, 'i'));
  }
});

test('Component A is inert until canonical_active and reads only the fixed legacy corpus', () => {
  assert.match(sql, /RAISE EXCEPTION 'listar_compat_inativo' USING ERRCODE = '55000'/i);
  // %ROWTYPE variable, not a bare column reference (this function's own
  // RETURNS TABLE declares an OUT column named "status", which would make a
  // bare "status" ambiguous under PL/pgSQL's variable/column resolution).
  assert.match(sql, /v_cutover public\.ordem_compra_cutover%ROWTYPE/i);
  assert.match(sql, /v_cutover\.status <> 'canonical_active'/i);
  assert.match(sql, /v_cutover\.read_authority <> 'canonical'/i);
  assert.match(sql, /WHERE oc\.legado = TRUE/i);
  // Supplier scoping mirrors the installed canonical reader.
  assert.match(sql, /public\.is_admin\(\) OR oc\.fornecedor_id = v_supplier_id/i);
});

test('Component A exposes both the item grain and the aggregated item x OP grain', () => {
  assert.match(sql, /IF p_op_id IS NULL THEN/i);
  assert.match(sql, /op_ids_multiplos/);
  // OP grain restricts and aggregates allocations to the requested OP.
  assert.match(sql, /a\.op_id = p_op_id/);
  assert.match(sql, /sum\(a\.kg_alocado\)/i);
  // Pending/zero-receipt orders survive: FROM anchors on the compat mapping,
  // ledger is LEFT JOINed for aggregation only.
  assert.match(sql, /FROM public\.ordem_compra_item_compat_fio c/i);
  assert.match(sql, /LEFT JOIN led/i);
  assert.match(sql, /WHEN base\.kg_rec = 0 THEN 'pendente'/i);
});

test('Component B is inert until canonical_active', () => {
  assert.match(sql, /'recebimento_compat_inativo'/);
  assert.match(sql, /v_cutover\.status <> 'canonical_active'\s*\n?\s*OR v_cutover\.read_authority <> 'canonical'/i);
});

test('Component B carries compat identity only in the namespace, never a recebimento_compat command type', () => {
  assert.match(sql, /'legacy_compat_receipt_v1'/);
  assert.match(sql, /'legacy_compat_intent_v1'/);
  // Ruling §35: reuse native command types, never introduce recebimento_compat
  // as a comando_tipo value (recebimento_compat_inativo, the inactive response
  // code, is unaffected). Checked against executable code, not comments.
  assert.doesNotMatch(executable, /recebimento_compat\b(?!_inativo)/);
  assert.match(sql, /'recebimento', 'legacy_compat_receipt_v1'/);
  assert.match(sql, /'estorno', 'legacy_compat_receipt_v1'/);
});

test('Component B computes an immutable absolute delta and branches equal/increase/decrease', () => {
  assert.match(sql, /v_delta\s*:=\s*v_target - v_current/i);
  assert.match(sql, /IF v_delta = 0 THEN/i);
  assert.match(sql, /ELSIF v_delta > 0 THEN/i);
  // Increase fans out across allocations then one explicit excess line.
  assert.match(sql, /v_capacity\s*:=\s*v_alloc\.kg_alocado - v_alloc_recv/i);
  assert.match(sql, /IF v_remaining > 0 THEN[\s\S]{0,400}kg_excesso/i);
});

test('decrease is admin-only, deterministic LIFO, with an immutable imported-balance floor', () => {
  assert.match(sql, /'decremento_exige_admin'/);
  assert.match(sql, /v_delta < 0 AND NOT public\.is_admin\(\)/i);
  // LIFO: most recent positive receipt lines first.
  assert.match(sql, /tipo = 'recebimento' AND p\.recebimento_id IS NOT NULL[\s\S]{0,120}ORDER BY p\.id DESC/i);
  // Imported opening balance is an immutable floor and never in the reversible sum.
  assert.match(sql, /'reducao_abaixo_saldo_importado'/);
  assert.match(sql, /tipo = 'import_saldo_inicial'/);
  assert.match(sql, /'excede_estornavel'/);
});

test('a productive increase participates in the single existing PONR; reversal and no-op do not', () => {
  assert.match(sql, /productive_receipt_started_at = COALESCE\(productive_receipt_started_at, clock_timestamp\(\)\)/i);
  // Only one PONR write exists, inside the increase branch.
  assert.equal((sql.match(/productive_receipt_started_at = COALESCE/gi) || []).length, 1);
});

test('the only schema change is the additive idempotency_namespace CHECK extension', () => {
  assert.match(sql, /DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3a_namespace_check/);
  assert.match(sql, /ADD CONSTRAINT ordem_compra_recebimentos_c3a_namespace_check[\s\S]{0,160}'legacy_compat_receipt_v1'/i);
  assert.match(sql, /DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3c_hash_check/);
  assert.match(sql, /idempotency_namespace = 'legacy_compat_receipt_v1' AND comando_hash ~ '\^\[0-9a-f\]\{32\}\$'/i);
  // comando_tipo CHECK is intentionally left unchanged (architect ruling §35).
  assert.doesNotMatch(executable, /CONSTRAINT ordem_compra_recebimentos_c3a_tipo_check/);
});

test('no bridge trigger, no backfill, no compat-mapping row creation, no db/67 or db/75 object modification', () => {
  assert.doesNotMatch(executable, /CREATE\s+TRIGGER/i);
  assert.doesNotMatch(executable, /CREATE OR REPLACE FUNCTION\s+public\.trg_/i);
  assert.doesNotMatch(executable, /ON\s+public\.ordens_compra_fio/i);
  assert.doesNotMatch(executable, /INSERT\s+INTO\s+public\.ordem_compra_item_compat_fio/i);
  assert.doesNotMatch(executable, /INSERT\s+INTO\s+public\.necessidade_compra_fio/i);
  // No modification of the installed shape guard or any other C3C-A object.
  assert.doesNotMatch(executable, /trg_native_lancamento_shape_guard/i);
  assert.doesNotMatch(executable, /DROP\s+TABLE|TRUNCATE/i);
});

test('rollback rehearsal is documented: drop two functions, restore the two prior constraints', () => {
  assert.match(sql, /ROLLBACK REHEARSAL/i);
  assert.match(sql, /DROP FUNCTION IF EXISTS public\.registrar_recebimento_ordem_compra_fio_compat/i);
  assert.match(sql, /DROP FUNCTION IF EXISTS public\.listar_ordens_compra_fio_compat/i);
  // Restored prior namespace constraint (two values, native shape) is documented.
  assert.match(sql, /idempotency_namespace IN \('native_receipt_v1','legacy_initial_balance_v1'\)\)/i);
});

test('the migration touches no product, UI, JavaScript, HTML, or CSS surface', () => {
  assert.doesNotMatch(sql, /window\.|localStorage|document\.getElementById|<script|<style/i);
});
