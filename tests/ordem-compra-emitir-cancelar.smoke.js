// Migration smoke for db/66_ordem_compra_emitir_cancelar.sql — phase
// ORDEM-COMPRA-LIFECYCLE Phase B1 (DB half): emitir/cancelar RPCs +
// partial ACL hardening.
// Spec: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §4, §8
// (Phase B1 row, ORDEM-COMPRA SPEC AMENDMENT).
// Static assertions on the SQL file (no DB access — live role-matrix and
// ACL-catalog verification was run against staging ucrjtfswnfdlxwtmxnoo
// directly via the Supabase MCP, recorded in the phase report/ledger, not
// re-run here).
//
// Intent: both RPCs are admin-gated SECURITY DEFINER with a fixed
// search_path, follow the ratified transition/precondition rules exactly,
// write one ordem_compra_eventos row each, and carry the least-privilege
// EXECUTE ACL (db/57/63 standard — PUBLIC/anon/service_role denied,
// authenticated only). The ACL hardening on ordens_compra_fio blocks
// direct authenticated UPDATE on the three new dimension columns while
// deliberately leaving kg_recebido (and every other existing column)
// writable — the architect-ruled ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL_PATH = path.join(ROOT, 'db', '66_ordem_compra_emitir_cancelar.sql');
const sql = fs.readFileSync(SQL_PATH, 'utf8');
const executableSql = sql.replace(/^\s*--.*$/gm, '');

function has(pattern, message) {
  assert.match(sql, pattern, message);
}

function lacks(pattern, message) {
  assert.doesNotMatch(sql, pattern, message);
}

function block(start, maxChars) {
  const match = sql.match(start);
  assert.ok(match, 'block not found: ' + start);
  return sql.slice(match.index, match.index + maxChars);
}

test('migration 66 exists and references the ratified spec + the architect ruling', () => {
  assert.ok(fs.existsSync(SQL_PATH));
  has(/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED\.md/i);
  has(/ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP/);
  has(/SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED/);
});

test('emitir_ordem_compra_fio: SECURITY DEFINER, fixed search_path, BIGINT param matching UI call sites', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.emitir_ordem_compra_fio/i, 2600);
  assert.match(t, /p_ordem_compra_fio_id\s+BIGINT/i);
  assert.match(t, /SECURITY\s+DEFINER/i);
  assert.match(t, /SET\s+search_path\s*=\s*public/i);
  assert.match(t, /RETURNS\s+JSONB/i);
});

test('emitir_ordem_compra_fio: admin-only, rascunho precondition, fornecedor precondition', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.emitir_ordem_compra_fio/i, 2600);
  assert.match(t, /IF\s+NOT\s+public\.is_admin\(\)\s+THEN/i);
  assert.match(t, /status_administrativo\s*!=\s*'rascunho'/i);
  assert.match(t, /fornecedor_id\s+IS\s+NULL/i);
});

test('emitir_ordem_compra_fio: freezes config into aceite_exigido_na_emissao, sets status_aceite per §2.3', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.emitir_ordem_compra_fio/i, 2600);
  assert.match(t, /SELECT\s+exige_aceite\s+INTO\s+v_exige_aceite\s+FROM\s+public\.ordem_compra_config\s+WHERE\s+id\s*=\s*1/i);
  assert.match(t, /CASE\s+WHEN\s+v_exige_aceite\s+THEN\s+'pendente'\s+ELSE\s+'nao_aplicavel'\s+END/i);
  assert.match(t, /status_administrativo\s*=\s*'emitida'/i);
  assert.match(t, /aceite_exigido_na_emissao\s*=\s*v_exige_aceite/i);
  assert.match(t, /emitida_em\s*=\s*now\(\)/i);
  assert.match(t, /emitida_por\s*=\s*auth\.uid\(\)/i);
});

test('emitir_ordem_compra_fio: writes exactly one ordem_compra_eventos row with the frozen policy in payload', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.emitir_ordem_compra_fio/i, 2600);
  const inserts = t.match(/INSERT\s+INTO\s+public\.ordem_compra_eventos/gi) || [];
  assert.equal(inserts.length, 1, 'expected exactly one ordem_compra_eventos insert in emitir');
  assert.match(t, /\(\s*ordem_compra_fio_id,\s*dimensao,\s*tipo_evento,\s*valor_anterior,\s*valor_novo,\s*payload,\s*criado_por\s*\)/i);
  assert.match(t, /VALUES\s*\(\s*p_ordem_compra_fio_id,\s*'administrativo',\s*'emitida',\s*'rascunho',\s*'emitida'/i);
  assert.match(t, /jsonb_build_object\(\s*'aceite_exigido_na_emissao',\s*v_exige_aceite,\s*'status_aceite',\s*v_status_aceite\s*\)/i);
});

test('cancelar_ordem_compra_fio: SECURITY DEFINER, fixed search_path, rascunho|emitida precondition, terminal', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.cancelar_ordem_compra_fio/i, 1550);
  assert.match(t, /p_ordem_compra_fio_id\s+BIGINT/i);
  assert.match(t, /SECURITY\s+DEFINER/i);
  assert.match(t, /SET\s+search_path\s*=\s*public/i);
  assert.match(t, /IF\s+NOT\s+public\.is_admin\(\)\s+THEN/i);
  assert.match(t, /status_administrativo\s+NOT\s+IN\s*\(\s*'rascunho'\s*,\s*'emitida'\s*\)/i);
  assert.match(t, /status_administrativo\s*=\s*'cancelada'/i);
  assert.match(t, /cancelada_em\s*=\s*now\(\)/i);
  assert.match(t, /cancelada_por\s*=\s*auth\.uid\(\)/i);
});

test('cancelar_ordem_compra_fio: does not touch kg_recebido or ordem_compra_fio_lancamentos (ratified §7g)', () => {
  const t = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.cancelar_ordem_compra_fio/i, 1550);
  assert.doesNotMatch(t, /kg_recebido/i);
  assert.doesNotMatch(t, /ordem_compra_fio_lancamentos/i);
  const inserts = t.match(/INSERT\s+INTO\s+public\.ordem_compra_eventos/gi) || [];
  assert.equal(inserts.length, 1, 'expected exactly one ordem_compra_eventos insert in cancelar');
});

test('both RPCs carry the least-privilege EXECUTE ACL (db/57/63 standard)', () => {
  for (const fn of ['emitir_ordem_compra_fio', 'cancelar_ordem_compra_fio']) {
    has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.' + fn + '\\(BIGINT\\)\\s+FROM\\s+PUBLIC', 'i'));
    has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.' + fn + '\\(BIGINT\\)\\s+FROM\\s+anon', 'i'));
    has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.' + fn + '\\(BIGINT\\)\\s+FROM\\s+service_role', 'i'));
    has(new RegExp('GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.' + fn + '\\(BIGINT\\)\\s+TO\\s+authenticated', 'i'));
  }
});

test('ACL hardening: table-level UPDATE revoked from authenticated, column-level UPDATE restored on every column except the three dimension columns', () => {
  has(/REVOKE\s+UPDATE\s+ON\s+TABLE\s+public\.ordens_compra_fio\s+FROM\s+authenticated/i);
  const grantMatch = sql.match(/GRANT\s+UPDATE\s*\(([\s\S]*?)\)\s*ON\s+public\.ordens_compra_fio\s+TO\s+authenticated/i);
  assert.ok(grantMatch, 'GRANT UPDATE (...) ON public.ordens_compra_fio TO authenticated not found');
  const grantBlock = grantMatch[0];
  const columnList = grantMatch[1];
  // kg_recebido intentionally included (the accepted, deferred gap).
  assert.match(grantBlock, /\bkg_recebido\b/);
  assert.match(grantBlock, /\bfornecedor_id\b/);
  assert.match(grantBlock, /\bstatus\b/);
  assert.match(grantBlock, /\bdata_recebimento\b/);
  assert.match(grantBlock, /ON\s+public\.ordens_compra_fio\s+TO\s+authenticated/i);
  // The three new dimension columns must NOT appear in the restored grant list
  // (checked against the column list only — not the file's surrounding prose,
  // which legitimately names them as the excluded columns).
  assert.doesNotMatch(columnList, /\bstatus_administrativo\b/);
  assert.doesNotMatch(columnList, /\bstatus_aceite\b/);
  assert.doesNotMatch(columnList, /\bstatus_recebimento\b/);
});

test('scope guard: no anon/PUBLIC grant change on ordens_compra_fio, no trigger, no touch of ordem_compra_fio_lancamentos writer (Phase C, out of scope)', () => {
  lacks(/REVOKE[\s\S]{0,80}ordens_compra_fio[\s\S]{0,80}FROM\s+anon/i);
  lacks(/GRANT[\s\S]{0,80}ordens_compra_fio[\s\S]{0,80}TO\s+anon/i);
  lacks(/CREATE\s+TRIGGER[\s\S]{0,200}ON\s+public\.ordens_compra_fio\b/i);
  lacks(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+public\.(decidir_aceite|registrar_recebimento)_ordem_compra_fio/i);
  lacks(/INSERT\s+INTO\s+public\.ordem_compra_fio_lancamentos/i);
});

test('no destructive commands, no secrets, no production project ref, reloads PostgREST', () => {
  assert.doesNotMatch(sql, /^\s*DELETE\s+FROM\b/im);
  assert.doesNotMatch(sql, /^\s*TRUNCATE\b/im);
  assert.doesNotMatch(sql, /^\s*DROP\s+(TABLE|FUNCTION)\b/im);
  assert.doesNotMatch(executableSql, /SUPABASE_SERVICE_ROLE_KEY/i);
  assert.doesNotMatch(executableSql, /postgres:\/\/|password\s*[:=]|eyJ[A-Za-z0-9_-]{10,}\.eyJ/i);
  assert.doesNotMatch(executableSql, /\bbhgifjrfagkzubpyqpew\b|\bgqmpsxkxynrjvidfmojk\b/i);

  has(/NOTIFY\s+pgrst\s*,\s*'reload schema'/i);
  has(/NOTIFY\s+pgrst\s*,\s*'reload config'/i);
});

test('migration 65 was not altered (non-regression gate)', () => {
  const DB65 = path.join(ROOT, 'db', '65_ordem_compra_lifecycle_schema.sql');
  assert.ok(fs.existsSync(DB65), 'db/65_ordem_compra_lifecycle_schema.sql missing');
  const db65 = fs.readFileSync(DB65, 'utf8');
  assert.match(db65, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ordem_compra_eventos/i);
  assert.match(db65, /INSERT\s+INTO\s+public\.ordem_compra_config\s*\(id,\s*exige_aceite\)/i);
});
