const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'db', '72_ordem_compra_c3a_cutover_initial_state.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const executable = sql.replace(/^\s*--.*$/gm, '');

test('db/72 is one bounded transaction over the existing db/71 cutover table', () => {
  assert.equal((executable.match(/^\s*BEGIN\s*;/gim) || []).length, 1);
  assert.equal((executable.match(/^\s*COMMIT\s*;/gim) || []).length, 1);
  assert.match(sql, /LOCK\s+TABLE\s+public\.ordem_compra_cutover\s+IN\s+ACCESS\s+EXCLUSIVE\s+MODE/i);
  assert.doesNotMatch(executable, /CREATE\s+TABLE/i);
  assert.doesNotMatch(executable, /\bCASCADE\b/i);
});

test('db/72 initializes exactly the deterministic untouched legacy_active singleton', () => {
  assert.match(sql, /IF\s+v_row_count\s*=\s*0[\s\S]*INSERT\s+INTO\s+public\.ordem_compra_cutover/i);
  assert.match(sql, /VALUES\s*\(\s*1\s*,\s*'legacy_active'\s*,\s*NULL\s*,\s*NULL\s*,\s*'not_started'\s*,\s*NULL\s*,\s*now\(\)/i);
  assert.match(sql, /CHECK\s*\(id\s*=\s*1\)/i);
  assert.doesNotMatch(executable, /ON\s+CONFLICT|UPSERT/i);
});

test('db/72 rejects multiple, transitioned, snapshot, import, and productive evidence', () => {
  assert.match(sql, /IF\s+v_row_count\s*>\s*1[\s\S]*RAISE\s+EXCEPTION/i);
  assert.match(sql, /v_state\.status\s*<>\s*'legacy_active'/i);
  assert.match(sql, /v_state\.snapshot_hash\s+IS\s+NOT\s+NULL/i);
  assert.match(sql, /v_state\.inventory_baseline_hash\s+IS\s+NOT\s+NULL/i);
  assert.match(sql, /idempotency_namespace\s*=\s*'legacy_initial_balance_v1'/i);
  assert.match(sql, /tipo\s*=\s*'import_saldo_inicial'/i);
  assert.match(sql, /idempotency_namespace\s*=\s*'native_receipt_v1'/i);
});

test('db/72 retains owner-only transition capability and grants no mutation path', () => {
  for (const role of ['PUBLIC', 'anon', 'authenticated', 'service_role']) {
    assert.match(sql, new RegExp(`REVOKE\\s+ALL\\s+ON\\s+TABLE\\s+public\\.ordem_compra_cutover\\s+FROM\\s+${role}`, 'i'));
    assert.match(sql, new RegExp(`REVOKE\\s+ALL\\s+ON\\s+SEQUENCE\\s+public\\.ordem_compra_cutover_id_seq\\s+FROM\\s+${role}`, 'i'));
  }
  assert.doesNotMatch(executable, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION|CREATE\s+TRIGGER|GRANT\s+/i);
  assert.doesNotMatch(executable, /UPDATE\s+public\.ordem_compra_cutover|DELETE\s+FROM\s+public\.ordem_compra_cutover/i);
});

test('db/72 does not touch receipt, ledger, inventory, flat authority, or emission', () => {
  assert.doesNotMatch(executable, /(?:INSERT|UPDATE|DELETE)\s+(?:INTO\s+|FROM\s+)?public\.(?:ordem_compra_recebimentos|ordem_compra_fio_lancamentos|ordem_compra_fio_movimentos_estoque|saldo_fios|saldo_fios_op|ordens_compra_fio)\b/i);
  assert.doesNotMatch(executable, /ALTER\s+TABLE\s+public\.ordens_compra_fio|emitir_ordem_compra/i);
});
