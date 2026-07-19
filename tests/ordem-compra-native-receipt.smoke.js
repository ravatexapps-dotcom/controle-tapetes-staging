// Static contract smoke for PHASE-C2 native receipt authority.
// Live role, concurrency, rollback, and cleanup evidence is recorded separately
// after db/70 is applied to staging ucrjtfswnfdlxwtmxnoo.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL_PATH = path.join(ROOT, 'db', '70_ordem_compra_native_receipt_foundation.sql');
const sql = fs.readFileSync(SQL_PATH, 'utf8');
const executableSql = sql.replace(/^\s*--.*$/gm, '');

function has(pattern, message) {
  assert.match(sql, pattern, message);
}

function lacks(pattern, message) {
  assert.doesNotMatch(sql, pattern, message);
}

function block(start, end) {
  const startMatch = sql.match(start);
  assert.ok(startMatch, 'block start not found: ' + start);
  const tail = sql.slice(startMatch.index + startMatch[0].length);
  const endMatch = tail.match(end);
  assert.ok(endMatch, 'block end not found: ' + end);
  return sql.slice(startMatch.index, startMatch.index + startMatch[0].length + endMatch.index);
}

function assertOrdered(source, patterns) {
  let previous = -1;
  for (const pattern of patterns) {
    const match = source.match(pattern);
    assert.ok(match, 'ordered pattern not found: ' + pattern);
    assert.ok(match.index > previous, 'pattern is out of order: ' + pattern);
    previous = match.index;
  }
}

test('db/70 is one additive explicit transaction and reloads PostgREST', () => {
  assert.ok(fs.existsSync(SQL_PATH));
  assert.equal((executableSql.match(/^\s*BEGIN\s*;/gim) || []).length, 1);
  assert.equal((executableSql.match(/^\s*COMMIT\s*;/gim) || []).length, 1);
  assertOrdered(executableSql, [/^\s*BEGIN\s*;/im, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ordem_compra_recebimentos/i, /^\s*COMMIT\s*;/im]);
  has(/SET\s+LOCAL\s+lock_timeout\s*=\s*'5s'/i);
  has(/NOTIFY\s+pgrst\s*,\s*'reload schema'/i);
  has(/NOTIFY\s+pgrst\s*,\s*'reload config'/i);
});

test('receipt headers have actor-scoped native_receipt_v1 idempotency and immutable command/result data', () => {
  const header = block(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ordem_compra_recebimentos/i, /CREATE\s+INDEX/i);
  assert.match(header, /ordem_compra_id\s+BIGINT\s+NOT\s+NULL/i);
  assert.match(header, /comando_tipo\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(comando_tipo\s+IN\s*\(\s*'recebimento'\s*,\s*'estorno'\s*\)\)/i);
  assert.match(header, /idempotency_namespace\s+TEXT\s+NOT\s+NULL\s+CHECK\s*\(idempotency_namespace\s*=\s*'native_receipt_v1'\)/i);
  assert.match(header, /ator_id\s+UUID\s+NOT\s+NULL/i);
  assert.match(header, /ator_tipo\s+TEXT\s+NOT\s+NULL/i);
  assert.match(header, /comando_payload\s+JSONB\s+NOT\s+NULL/i);
  assert.match(header, /comando_hash\s+TEXT\s+NOT\s+NULL/i);
  assert.match(header, /resultado_metadata\s+JSONB\s+NOT\s+NULL/i);
  assert.match(header, /UNIQUE\s*\(\s*idempotency_namespace\s*,\s*ator_tipo\s*,\s*ator_id\s*,\s*idempotency_key\s*\)/i);
  has(/BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.ordem_compra_recebimentos/i);
});

test('native entries extend the sole ledger with allocation, real OP, material, excess, actor, and stable line identity', () => {
  const ledger = block(/ALTER\s+TABLE\s+public\.ordem_compra_fio_lancamentos\s+ADD\s+COLUMN/i, /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+ordem_compra_fio_lancamentos_recebimento_linha/i);
  for (const column of ['recebimento_id', 'ordem_compra_id', 'ordem_compra_item_alocacao_id', 'op_id', 'material', 'cor_id', 'cor_poliester', 'kg_excesso', 'ator_tipo', 'linha_indice']) {
    assert.match(ledger, new RegExp('ADD\\s+COLUMN\\s+IF\\s+NOT\\s+EXISTS\\s+' + column + '\\b', 'i'));
  }
  assert.match(ledger, /ordem_compra_item_alocacao_id\s+IS\s+NOT\s+NULL\s+AND\s+op_id\s+IS\s+NOT\s+NULL\s+AND\s+kg_excesso\s*=\s*0/i);
  assert.match(ledger, /ordem_compra_item_alocacao_id\s+IS\s+NULL\s+AND\s+op_id\s+IS\s+NULL\s+AND\s+kg_excesso\s*=\s*kg_recebido/i);
  has(/UNIQUE[\s\S]{0,120}\(recebimento_id,\s*linha_indice\)[\s\S]{0,80}WHERE\s+recebimento_id\s+IS\s+NOT\s+NULL/i);
});

test('native ledger guard derives and validates item, allocation, real OP, actor, and reversal source identities', () => {
  const guard = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.trg_native_lancamento_shape_guard/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.trg_native_lancamento_shape_guard/i);
  assert.match(guard, /SECURITY\s+DEFINER[\s\S]*SET\s+search_path\s*=\s*''/i);
  assert.match(guard, /v_header\.ordem_compra_id\s*<>\s*NEW\.ordem_compra_id/i);
  assert.match(guard, /v_header\.ator_id\s+IS\s+DISTINCT\s+FROM\s+NEW\.criado_por/i);
  assert.match(guard, /v_item\.material\s+IS\s+DISTINCT\s+FROM\s+NEW\.material/i);
  assert.match(guard, /v_alloc\.item_id\s*<>\s*NEW\.ordem_compra_item_id/i);
  assert.match(guard, /v_alloc\.op_id\s+IS\s+NULL\s+OR\s+v_alloc\.op_id\s*<>\s*NEW\.op_id/i);
  assert.match(guard, /v_source\.ordem_compra_item_alocacao_id\s+IS\s+DISTINCT\s+FROM\s+NEW\.ordem_compra_item_alocacao_id/i);
});

test('one immutable source movement per ledger entry owns only explicit excess cache delta', () => {
  const movement = block(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.ordem_compra_fio_movimentos_estoque/i, /COMMENT\s+ON\s+TABLE/i);
  assert.match(movement, /lancamento_id\s+BIGINT\s+NOT\s+NULL\s+UNIQUE/i);
  assert.match(movement, /kg_excedente_delta\s+NUMERIC\(12,3\)\s+NOT\s+NULL/i);
  assert.match(movement, /excesso_depois\s*=\s*excesso_antes\s*\+\s*kg_excedente_delta/i);
  has(/BEFORE\s+UPDATE\s+OR\s+DELETE\s+ON\s+public\.ordem_compra_fio_movimentos_estoque/i);

  const derive = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.trg_native_lancamento_derive_state/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.trg_native_lancamento_derive_state/i);
  assert.match(derive, /v_delta\s*:=\s*NEW\.kg_excesso/i);
  assert.match(derive, /SUM\(l\.kg_excesso\)/i);
  assert.doesNotMatch(derive, /SUM\(a\.kg_alocado\)/i);
  assert.match(derive, /INSERT\s+INTO\s+public\.ordem_compra_fio_movimentos_estoque/i);
  assert.match(derive, /UPDATE\s+public\.saldo_fios[\s\S]*kg_total\s*=\s*v_saldo_after/i);
  assert.match(derive, /UPDATE\s+public\.ordem_compra_item[\s\S]*kg_recebido\s*=\s*v_total/i);
  assert.match(derive, /UPDATE\s+public\.ordem_compra[\s\S]*status_recebimento/i);
});

test('receipt writer enforces actors, eligibility, ownership, full allocation identity, and absolute lines', () => {
  const writer = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i);
  assert.match(writer, /SECURITY\s+DEFINER[\s\S]*SET\s+search_path\s*=\s*''/i);
  assert.match(writer, /u\.tipo[\s\S]*u\.ativo[\s\S]*u\.fornecedor_id/i);
  assert.match(writer, /v_actor\.tipo\s+NOT\s+IN\s*\(\s*'admin'\s*,\s*'fornecedor'\s*\)/i);
  assert.match(writer, /v_order\.legado\s+OR\s+v_order\.status_administrativo\s*<>\s*'emitida'/i);
  assert.match(writer, /v_order\.status_aceite\s*=\s*'rejeitada'/i);
  assert.match(writer, /v_order\.status_aceite\s+NOT\s+IN\s*\(\s*'nao_aplicavel'\s*,\s*'aceita'\s*\)/i);
  assert.match(writer, /v_actor\.fornecedor_id\s+IS\s+DISTINCT\s+FROM\s+v_order\.fornecedor_id/i);
  assert.match(writer, /destination\s+NOT\s+IN\s*\(\s*'alocacao'\s*,\s*'excesso'\s*\)\s+OR\s+kg\s+IS\s+NULL\s+OR\s+kg\s*<=\s*0/i);
  assert.match(writer, /JOIN\s+public\.necessidade_compra_fio\s+n\s+ON\s+n\.id\s*=\s*a\.necessidade_id/i);
  assert.match(writer, /n\.pedido_id\s*=\s*v_order\.pedido_id/i);
  assert.match(writer, /n\.op_id\s*=\s*a\.op_id/i);
  assert.match(writer, /lote\.pedido_id\s*=\s*n\.pedido_id/i);
  assert.match(writer, /SET\s+op_id\s*=\s*a\.op_id/i);
});

test('receipt idempotency is exact replay or conflict and inserts ledger through the canonical path', () => {
  const writer = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i);
  assert.match(writer, /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\([\s\S]*native_receipt_v1/i);
  assert.match(writer, /v_header\.comando_hash\s*=\s*v_hash[\s\S]*v_header\.comando_payload\s*=\s*v_payload/i);
  assert.match(writer, /RETURN\s+public\._resultado_comando_recebimento\(v_header\.id\)/i);
  assert.match(writer, /'idempotencia_conflitante'/i);
  assert.equal((writer.match(/INSERT\s+INTO\s+public\.ordem_compra_recebimentos/gi) || []).length, 1);
  assert.equal((writer.match(/INSERT\s+INTO\s+public\.ordem_compra_fio_lancamentos/gi) || []).length, 1);
});

test('receipt lock order is header, items, allocations, idempotency, ledger, inventory', () => {
  const writer = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.registrar_recebimento_ordem_compra/i);
  assertOrdered(writer, [
    /FROM\s+public\.ordem_compra\s+WHERE\s+id\s*=\s*p_ordem_id\s+FOR\s+UPDATE/i,
    /FROM\s+public\.ordem_compra_item\s+i[\s\S]{0,220}ORDER\s+BY\s+i\.id[\s\S]{0,40}FOR\s+UPDATE/i,
    /FROM\s+public\.ordem_compra_item_alocacao\s+a[\s\S]{0,250}ORDER\s+BY\s+a\.id[\s\S]{0,40}FOR\s+UPDATE/i,
    /pg_advisory_xact_lock\s*\(\s*hashtextextended\s*\([\s\S]{0,180}native_receipt_v1/i,
    /FROM\s+public\.ordem_compra_fio_lancamentos\s+l[\s\S]{0,220}ORDER\s+BY\s+l\.id[\s\S]{0,40}FOR\s+UPDATE/i,
    /native_receipt_inventory/i,
  ]);
  assert.match(writer, /v_existing\s*\+\s*v_line\.kg\s*>\s*v_line\.kg_alocado/i);
  assert.match(writer, /COALESCE\(q\.requested,\s*0\)\s*>\s*i\.kg_pedido/i);
});

test('reversal writer is admin-only, source-linked, capped, negative, immutable, and idempotent', () => {
  const reversal = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.estornar_recebimento_ordem_compra/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.estornar_recebimento_ordem_compra/i);
  assert.match(reversal, /auth\.uid\(\)\s+IS\s+NULL\s+OR\s+NOT\s+public\.is_admin\(\)/i);
  assert.match(reversal, /l\.tipo\s*=\s*'recebimento'[\s\S]*l\.recebimento_id\s+IS\s+NOT\s+NULL/i);
  assert.match(reversal, /l\.id\s+IN[\s\S]*OR\s+l\.estorno_de_id\s+IN[\s\S]*ORDER\s+BY\s+l\.id\s+FOR\s+UPDATE/i);
  assert.match(reversal, /v_line\.source_kg\s*\+\s*COALESCE\(SUM\(l\.kg_recebido\),\s*0\)/i);
  assert.match(reversal, /v_line\.kg\s*>\s*v_remaining/i);
  assert.match(reversal, /NULL,\s*v_line\.item_id,\s*-v_line\.kg/i);
  assert.match(reversal, /CASE\s+WHEN\s+v_line\.source_excess\s*<>\s*0\s+THEN\s+-v_line\.kg\s+ELSE\s+0\s+END/i);
  assert.match(reversal, /v_header\.comando_hash\s*=\s*v_hash[\s\S]*v_header\.comando_payload\s*=\s*v_payload/i);
  assert.doesNotMatch(reversal, /UPDATE\s+public\.ordem_compra_fio_lancamentos|DELETE\s+FROM\s+public\.ordem_compra_fio_lancamentos/i);
});

test('read model is active-admin or matching-supplier scoped and exposes reconciliation evidence', () => {
  const readModel = block(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.obter_historico_recebimento_ordem_compra/i, /REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.obter_historico_recebimento_ordem_compra/i);
  assert.match(readModel, /v_user\.ativo\s+IS\s+TRUE[\s\S]*v_user\.tipo\s*=\s*'admin'/i);
  assert.match(readModel, /v_user\.fornecedor_id\s*=\s*v_order\.fornecedor_id/i);
  for (const field of ['alocacao_id', 'op_id', 'kg_excesso', 'kg_reversivel', 'movimento_estoque', 'acoes']) {
    assert.match(readModel, new RegExp("'" + field + "'", 'i'));
  }
  assert.match(readModel, /SUM\(l\.kg_excesso\)/i);
});

test('tables have no client mutation grants and RPC execution is authenticated-only', () => {
  for (const table of ['ordem_compra_recebimentos', 'ordem_compra_fio_movimentos_estoque']) {
    has(new RegExp('ALTER\\s+TABLE\\s+public\\.' + table + '\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY', 'i'));
    for (const role of ['PUBLIC', 'anon', 'authenticated']) {
      has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+TABLE\\s+public\\.' + table + '\\s+FROM\\s+' + role, 'i'));
    }
  }
  const signatures = [
    'registrar_recebimento_ordem_compra\\(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB\\)',
    'estornar_recebimento_ordem_compra\\(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB\\)',
    'obter_historico_recebimento_ordem_compra\\(BIGINT\\)',
  ];
  for (const signature of signatures) {
    for (const role of ['PUBLIC', 'anon', 'service_role']) {
      has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.' + signature + '\\s+FROM\\s+' + role, 'i'));
    }
    has(new RegExp('GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+public\\.' + signature + '\\s+TO\\s+authenticated', 'i'));
  }
});

test('all C2 functions use fixed empty search_path and helper/trigger functions retain no client execute', () => {
  const functions = [...sql.matchAll(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.([a-z0-9_]+)\s*\(([^)]*)\)[\s\S]*?AS\s+\$\$/gi)];
  assert.equal(functions.length, 8);
  for (const match of functions) {
    assert.match(match[0], /SECURITY\s+DEFINER[\s\S]*SET\s+search_path\s*=\s*''/i, match[1] + ' lacks fixed empty search_path');
  }
  for (const fn of ['trg_recebimento_header_immutable_guard', 'trg_recebimento_movimento_immutable_guard', 'trg_native_lancamento_shape_guard', 'trg_native_lancamento_derive_state', '_resultado_comando_recebimento']) {
    for (const role of ['PUBLIC', 'anon', 'authenticated', 'service_role']) {
      has(new RegExp('REVOKE\\s+ALL\\s+ON\\s+FUNCTION\\s+public\\.' + fn + '\\([^;]*\\)\\s+FROM\\s+' + role, 'i'));
    }
  }
});

test('C2 scope guard preserves coexistence: no cutover, import seed, flat ACL change, UI, or emission activation', () => {
  lacks(/^\s*INSERT\s+INTO\s+public\.ordem_compra_fio_lancamentos[\s\S]{0,300}'import_saldo_inicial'/im);
  lacks(/REVOKE\s+UPDATE[\s\S]{0,160}public\.ordens_compra_fio/i);
  lacks(/UPDATE\s+public\.ordens_compra_fio/i);
  lacks(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.emitir_ordem_compra\(BIGINT\)/i);
  assert.doesNotMatch(executableSql, /\bbhgifjrfagkzubpyqpew\b|\bgqmpsxkxynrjvidfmojk\b/i);
  assert.doesNotMatch(executableSql, /SUPABASE_SERVICE_ROLE_KEY|postgres:\/\/|password\s*[:=]|eyJ[A-Za-z0-9_-]{10,}\.eyJ/i);
  assert.doesNotMatch(executableSql, /^\s*(TRUNCATE|DELETE\s+FROM)\b/im);
  assert.doesNotMatch(executableSql, /^\s*DROP\s+TABLE\s+(IF\s+EXISTS\s+)?public\./im);
  has(/REVOKE\s+ALL\s+ON\s+FUNCTION\s+public\.emitir_ordem_compra\(BIGINT\)\s+FROM\s+authenticated/i);
});
