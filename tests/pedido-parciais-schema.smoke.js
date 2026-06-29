const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SQL = path.join(ROOT, 'db', '17_pedido_parciais_schema.sql');

function readOrFail(target) {
  assert.ok(fs.existsSync(target), 'arquivo nao encontrado: ' + target);
  return fs.readFileSync(target, 'utf8');
}

function blockAround(src, marker, extra = 1200) {
  const idx = src.indexOf(marker);
  assert.ok(idx >= 0, 'marcador nao encontrado: ' + marker);
  return src.slice(Math.max(0, idx - 200), idx + extra);
}

const sql = readOrFail(SQL);

test('arquivo db/17_pedido_parciais_schema.sql existe', () => {
  assert.ok(fs.existsSync(SQL), 'db/17_pedido_parciais_schema.sql ausente');
});

test('SQL: cria public.pedido_parciais', () => {
  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.pedido_parciais/i);
});

test('SQL: cria public.pedido_parcial_itens', () => {
  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.pedido_parcial_itens/i);
});

test('SQL: altera public.pedidos com campos versionados de parciais', () => {
  assert.match(sql, /ALTER\s+TABLE\s+public\.pedidos/i);
  assert.match(sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+parcial_habilitado\s+BOOLEAN/i);
  assert.match(sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+parcial_atualizado_em\s+TIMESTAMPTZ/i);
  assert.match(sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+metros_total\s+NUMERIC\(12,2\)/i);
});

test('SQL: constraints idempotentes usam IF NOT EXISTS em bloco DO', () => {
  for (const constraint of [
    'pedido_parciais_situacao_check',
    'pedido_parciais_origem_check',
    'pedido_parciais_sequencia_check',
    'pedido_parcial_itens_parcial_item_key',
  ]) {
    const idx = sql.indexOf(constraint);
    assert.ok(idx >= 0, 'constraint nao encontrada: ' + constraint);
    const bloco = sql.slice(Math.max(0, idx - 1200), idx + 900);
    assert.match(bloco, /DO\s+\$\$/i);
    assert.match(bloco, /IF\s+NOT\s+EXISTS/i);
    assert.match(bloco, /ALTER\s+TABLE\s+public\./i);
  }
});

test('SQL: cria funcoes e triggers de consistencia de metros/parciais', () => {
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.recalcular_pedido_metros_total\s*\(/i);
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.sincronizar_pedido_parciais_resumo\s*\(/i);
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.touch_pedido_parciais_updated_at\s*\(/i);
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.pedido_parciais_after_change\s*\(/i);
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.pedido_itens_sync_parciais_after_change\s*\(/i);
  assert.match(sql, /CREATE\s+TRIGGER\s+pedido_parciais_after_change_trigger/i);
  assert.match(sql, /CREATE\s+TRIGGER\s+pedido_itens_sync_parciais_after_change_trigger/i);
});

test('SQL: protege a soma das parciais nao canceladas contra excesso de metros_total', () => {
  const bloco = blockAround(sql, 'CREATE OR REPLACE FUNCTION public.sincronizar_pedido_parciais_resumo', 2600);
  assert.match(bloco, /SUM\(pp\.metros\)/i);
  assert.match(bloco, /pp\.situacao\s*<>\s*'cancelado'/i);
  assert.match(bloco, /v_total_parciais\s*>\s*COALESCE\(v_total_pedido,\s*0\)/i);
  assert.match(bloco, /RAISE\s+EXCEPTION/i);
});

test('SQL: habilita RLS nas tabelas novas', () => {
  assert.match(sql, /ALTER\s+TABLE\s+public\.pedido_parciais\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
  assert.match(sql, /ALTER\s+TABLE\s+public\.pedido_parcial_itens\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i);
});

test('SQL: cria policies admin ALL nas tabelas novas', () => {
  const parciais = blockAround(sql, 'CREATE POLICY pedido_parciais_admin_all', 700);
  const itens = blockAround(sql, 'CREATE POLICY pedido_parcial_itens_admin_all', 700);
  assert.match(parciais, /FOR\s+ALL/i);
  assert.match(parciais, /USING\s*\(\s*public\.is_admin\(\)\s*\)/i);
  assert.match(parciais, /WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i);
  assert.match(itens, /FOR\s+ALL/i);
  assert.match(itens, /USING\s*\(\s*public\.is_admin\(\)\s*\)/i);
  assert.match(itens, /WITH\s+CHECK\s*\(\s*public\.is_admin\(\)\s*\)/i);
});

test('SQL: cria policy cliente somente SELECT em pedido_parciais', () => {
  const bloco = blockAround(sql, 'CREATE POLICY pedido_parciais_cliente_select', 1100);
  assert.match(bloco, /FOR\s+SELECT/i);
  assert.match(bloco, /visivel_cliente\s*=\s*true/i);
  assert.match(bloco, /FROM\s+public\.pedidos\s+p/i);
  assert.match(bloco, /p\.id\s*=\s*pedido_parciais\.pedido_id/i);
  assert.match(bloco, /p\.cliente_id\s*=\s*public\.meu_cliente_id\(\)/i);
});

test('SQL: cria policy cliente somente SELECT em pedido_parcial_itens', () => {
  const bloco = blockAround(sql, 'CREATE POLICY pedido_parcial_itens_cliente_select', 1300);
  assert.match(bloco, /FOR\s+SELECT/i);
  assert.match(bloco, /FROM\s+public\.pedido_parciais\s+pp/i);
  assert.match(bloco, /JOIN\s+public\.pedidos\s+p/i);
  assert.match(bloco, /pp\.visivel_cliente\s*=\s*true/i);
  assert.match(bloco, /p\.cliente_id\s*=\s*public\.meu_cliente_id\(\)/i);
});

test('SQL: nao cria write de cliente nas tabelas novas', () => {
  assert.doesNotMatch(sql, /CREATE\s+POLICY\s+pedido_parciais_cliente_(insert|update|delete)/i);
  assert.doesNotMatch(sql, /CREATE\s+POLICY\s+pedido_parcial_itens_cliente_(insert|update|delete)/i);
  assert.doesNotMatch(sql, /pedido_parciais_cliente_select[\s\S]{0,600}WITH\s+CHECK/i);
  assert.doesNotMatch(sql, /pedido_parcial_itens_cliente_select[\s\S]{0,600}WITH\s+CHECK/i);
});

test('SQL: nao contem service_role', () => {
  assert.doesNotMatch(sql, /service_role/i);
});

test('SQL: nao expone campos internos proibidos no schema de parciais', () => {
  assert.doesNotMatch(sql, /\bOP\b/);
  assert.doesNotMatch(sql, /\blote\b/i);
  assert.doesNotMatch(sql, /fornecedor/i);
  assert.doesNotMatch(sql, /\bNF\b/);
  assert.doesNotMatch(sql, /romaneio/i);
  assert.doesNotMatch(sql, /custo/i);
  assert.doesNotMatch(sql, /margem/i);
});

test('SQL: nao altera frontend, UI ou Edge Function', () => {
  assert.doesNotMatch(sql, /js\//i);
  assert.doesNotMatch(sql, /index\.html/i);
  assert.doesNotMatch(sql, /supabase\/functions\//i);
});

test('SQL: termina com reload do schema cache (PostgREST)', () => {
  assert.match(sql, /NOTIFY\s+pgrst,\s*'reload\s+schema'/i);
  assert.match(sql, /NOTIFY\s+pgrst,\s*'reload\s+config'/i);
});
