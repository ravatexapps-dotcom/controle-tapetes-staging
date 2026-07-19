const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(path.join(__dirname, '..', 'db', '71_ordem_compra_c3a_cutover_foundation.sql'), 'utf8');
const executable = sql.replace(/^\s*--.*$/gm, '');

test('C3A is one inactive migration with no seed or flat ACL change', () => {
  assert.match(executable, /^\s*BEGIN\s*;/m);
  assert.match(executable, /^\s*COMMIT\s*;/m);
  assert.match(sql, /legacy_active/);
  assert.doesNotMatch(executable, /^\s*INSERT\s+INTO\s+public\.(?:ordem_compra_recebimentos|ordem_compra_fio_lancamentos)\b/im);
  assert.doesNotMatch(executable, /REVOKE\s+UPDATE[\s\S]{0,120}ordens_compra_fio/i);
});

test('C3A introduces system-only opening-balance semantics and non-posting guard', () => {
  assert.match(sql, /import_saldo_inicial/);
  assert.match(sql, /ator_tipo\s*=\s*'sistema'[\s\S]*ator_id\s+IS\s+NULL/i);
  assert.match(sql, /WHEN\s*\(NEW\.tipo\s*<>\s*'import_saldo_inicial'\)/i);
  assert.match(sql, /import or invalid source cannot be reversed/i);
  assert.match(sql, /legacy_initial_balance_v1/);
});

test('C3A preview is read-only, deterministic, and constrained to admin-readable execution', () => {
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.visualizar_importacao_saldo_inicial_c3a/i);
  assert.match(sql, /RETURNS\s+JSONB\s+LANGUAGE\s+sql\s+STABLE\s+SECURITY\s+DEFINER/i);
  assert.match(sql, /'headers'[\s\S]*'ledger_entries'[\s\S]*'reconstructed_kg'[\s\S]*'excess_kg'[\s\S]*'inventory_movements'/i);
  assert.match(sql, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.visualizar_importacao_saldo_inicial_c3a\(\)\s+FROM\s+PUBLIC/i);
  assert.match(sql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.visualizar_importacao_saldo_inicial_c3a\(\)\s+TO\s+authenticated/i);
});
