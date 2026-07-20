const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(__dirname, '..', 'db', '75_ordem_compra_c3c_inactive_cutover.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');
const executable = sql.replace(/^\s*--.*$/gm, '');

test('C3C-A is one inactive transactional migration', () => {
  assert.equal((executable.match(/^\s*BEGIN\s*;/gim) || []).length, 1);
  assert.equal((executable.match(/^\s*COMMIT\s*;/gim) || []).length, 1);
  assert.match(sql, /read_authority\s+TEXT\s+NOT NULL\s+DEFAULT\s+'flat'/i);
  assert.match(sql, /status\s*<>\s*'legacy_active'[\s\S]*read_authority\s*=\s*'flat'/i);
  const transition = sql.search(/UPDATE\s+public\.ordem_compra_cutover\s+SET\s+status\s*=\s*'maintenance_fenced'/i);
  const ownerCommand = sql.search(/CREATE OR REPLACE FUNCTION public\.ordem_compra_c3c_fence_and_snapshot/i);
  assert.ok(transition > ownerCommand, 'maintenance transition must exist only inside the owner command');
});

test('C3C-A freezes all mappings and inventory with stable three-decimal SHA-256 identity', () => {
  assert.match(sql, /ordem_compra_cutover_source_snapshot/);
  assert.match(sql, /stable_position/);
  assert.match(sql, /canonical_line/);
  assert.match(sql, /row_sha256/);
  assert.match(sql, /IF\s+v_source_count\s*<>\s*51/i);
  assert.match(sql, /FM999999999990\.000/g);
  assert.match(sql, /extensions\.digest\([\s\S]{0,500}'sha256'/i);
});

test('C3C-A installs database-owned fence guards without a UI bypass', () => {
  assert.match(sql, /trg_c3c_protected_mutation_guard/);
  assert.match(sql, /'ordens_compra_fio'[\s\S]*'ordem_compra_item_compat_fio'[\s\S]*'saldo_fios'/i);
  assert.match(sql, /RAISE EXCEPTION 'legacy_receipt_fenced'/i);
  assert.doesNotMatch(sql, /window\.|localStorage|feature[_-]?flag/i);
});

test('canonical receipt and reversal wrappers reject while inactive and record PONR atomically', () => {
  assert.match(sql, /recebimento_canonico_inativo/g);
  assert.match(sql, /_c3c_registrar_recebimento_impl/);
  assert.match(sql, /_c3c_estornar_recebimento_impl/);
  assert.match(sql, /productive_receipt_started_at\s*=\s*COALESCE\(productive_receipt_started_at,\s*clock_timestamp\(\)\)/i);
  assert.match(sql, /IF\s+COALESCE\(\(v_result\s*->>\s*'ok'\)::BOOLEAN,\s*FALSE\)/i);
});

test('normalized reader preserves nullable OP and separates attributable and excess quantities', () => {
  assert.match(sql, /listar_recebimentos_ordem_compra_normalizados/i);
  assert.match(sql, /kg_recebido_atribuido\s+NUMERIC/);
  assert.match(sql, /kg_excesso\s+NUMERIC/);
  assert.match(sql, /CASE WHEN l\.ordem_compra_item_alocacao_id IS NOT NULL THEN l\.kg_recebido ELSE 0::NUMERIC END/i);
  assert.match(sql, /CASE WHEN l\.ordem_compra_item_alocacao_id IS NULL THEN l\.kg_recebido ELSE 0::NUMERIC END/i);
  assert.doesNotMatch(sql, /COALESCE\(l\.op_id\s*,/i);
});

test('snapshot import is postgres-only, frozen-source based, deterministic, and non-posting', () => {
  assert.match(sql, /ordem_compra_c3c_import_snapshot_row/);
  assert.match(sql, /FROM public\.ordem_compra_cutover_source_snapshot/i);
  assert.match(sql, /v_headers\s*<>\s*39[\s\S]*v_lines\s*<>\s*44[\s\S]*v_total\s*<>\s*20221\.280[\s\S]*v_excess\s*<>\s*405\.980[\s\S]*v_movements\s*<>\s*0/i);
  assert.doesNotMatch(executable, /INSERT\s+INTO\s+public\.ordem_compra_fio_movimentos_estoque/i);
});

test('cutover orchestration requires a session advisory lock and deterministic resource order', () => {
  assert.match(sql, /pg_try_advisory_lock\(public\.ordem_compra_c3c_lock_key\(p_generation\)\)/i);
  assert.doesNotMatch(sql, /pg_try_advisory_xact_lock|pg_advisory_xact_lock\(public\.ordem_compra_c3c_lock_key/i);
  const cutover = sql.indexOf('PERFORM 1 FROM public.ordem_compra_cutover');
  const source = sql.indexOf('FROM public.ordens_compra_fio f', cutover);
  const inventory = sql.indexOf('PERFORM 1 FROM public.saldo_fios', source);
  const allocation = sql.indexOf('FROM public.ordem_compra_item i', inventory);
  const order = sql.indexOf('PERFORM 1 FROM public.ordem_compra o', allocation);
  assert.ok(cutover < source && source < inventory && inventory < allocation && allocation < order);
});

test('final ACL closure is owner-only, separate, and not invoked by migration apply', () => {
  assert.match(sql, /ordem_compra_c3c_close_final_acl/);
  assert.match(sql, /REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER[\s\S]*ordens_compra_fio/i);
  assert.match(sql, /REVOKE UPDATE\(op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido,[\s\S]*status_recebimento\)/i);
  assert.doesNotMatch(sql, /p\.polroles\s*=\s*ARRAY\[0::oid\]/i);
  assert.equal((sql.match(/0::oid\s*=\s*ANY\s*\(\s*p\.polroles\s*\)/gi) || []).length, 2);
  assert.equal((sql.match(/c\.relname::TEXT\s*=\s*ANY\s*\(\s*v_protected_tables\s*\)/gi) || []).length, 2);
  const protectedTables = [
    'ordens_compra_fio',
    'necessidade_compra_fio',
    'ordem_compra_item_compat_fio',
    'ordem_compra_item_alocacao',
    'ordem_compra_item',
    'ordem_compra',
    'saldo_fios',
    'saldo_fios_op',
    'ordem_compra_recebimentos',
    'ordem_compra_fio_lancamentos',
    'ordem_compra_fio_movimentos_estoque',
    'ordem_compra_cutover',
    'ordem_compra_cutover_source_snapshot',
    'ordem_compra_cutover_inventory_baseline',
  ];
  const tableSet = sql.match(/v_protected_tables\s+CONSTANT\s+TEXT\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]::TEXT\[\]/i);
  assert.ok(tableSet, 'final ACL closure must define one protected-table set');
  assert.deepEqual([...tableSet[1].matchAll(/'([^']+)'/g)].map((match) => match[1]), protectedTables);
  assert.match(sql, /RAISE EXCEPTION 'public_policy_remaining' USING ERRCODE = '55000'[\s\S]*UPDATE public\.ordem_compra_cutover SET final_acl_closed_at/i);
  assert.doesNotMatch(executable, /^\s*SELECT\s+public\.ordem_compra_c3c_close_final_acl/im);
});

test('new and internal objects are immediately closed to all API roles', () => {
  for (const role of ['PUBLIC', 'anon', 'authenticated', 'service_role']) {
    assert.match(sql, new RegExp(`REVOKE ALL ON TABLE public\\.ordem_compra_cutover_source_snapshot FROM[\\s\\S]{0,100}\\b${role}\\b`, 'i'));
    assert.match(sql, new RegExp(`REVOKE ALL ON SEQUENCE public\\.ordem_compra_cutover_source_snapshot_id_seq FROM[\\s\\S]{0,100}\\b${role}\\b`, 'i'));
  }
  assert.doesNotMatch(sql, /CREATE\s+POLICY[\s\S]{0,200}\bTO\s+PUBLIC\b/i);
});

test('pre-PONR rollback retains the fence and post-PONR recovery is forward-only', () => {
  assert.match(sql, /SET read_authority = 'flat', status = 'maintenance_fenced'/i);
  assert.match(sql, /productive_receipt_started_at IS NULL/i);
  assert.match(sql, /RAISE EXCEPTION 'forward_recovery_only'/i);
  assert.doesNotMatch(sql, /GRANT[\s\S]{0,100}UPDATE[\s\S]{0,100}ordens_compra_fio/i);
});

test('every newly defined definer function fixes an empty search path', () => {
  const definitions = [...sql.matchAll(/CREATE OR REPLACE FUNCTION\s+public\.([a-z0-9_]+)[\s\S]*?AS\s+\$\$/gi)];
  assert.ok(definitions.length >= 15);
  for (let i = 0; i < definitions.length; i += 1) {
    const start = definitions[i].index;
    const end = i + 1 < definitions.length ? definitions[i + 1].index : sql.length;
    const definition = sql.slice(start, end);
    assert.match(definition, /SECURITY DEFINER/i, `${definitions[i][1]} is not SECURITY DEFINER`);
    assert.match(definition, /SET search_path = ''/i, `${definitions[i][1]} lacks empty search_path`);
  }
});
