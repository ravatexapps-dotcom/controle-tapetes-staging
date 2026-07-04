// =====================================================================
// === tests/op-latex-split.smoke.js ===================================
// Smoke estatico da migration db/29_op_latex_split_rpc.sql.
//
// Fase: RAVATEX-TAPETES-OP-PARTIAL-SPLIT-DB29-RPC-B
//
// Valida por leitura do SQL (sem executar a migration) que:
//   - db/29 existe e define as duas RPCs;
//   - gerar_op_latex filtra motivo_separacao IS NULL;
//   - gerar_op_latex usa ON CONFLICT com o predicado do novo indice;
//   - gerar_op_latex_split existe com assinatura (BIGINT, TEXT);
//   - gerar_op_latex_split exige p_motivo nao vazio;
//   - gerar_op_latex_split escreve motivo_separacao;
//   - gerar_op_latex_split verifica op_latex_entregas (idempotencia);
//   - gerar_op_latex_split usa proximo_numero_op;
//   - gerar_op_latex_split registra criacao_split e split_derivado;
//   - gerar_op_latex_split retorna split:true;
//   - gerar_op_latex nao cria split automaticamente.
//
// Nao executa o app nem acessa Supabase real.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '29_op_latex_split_rpc.sql');
const rawSql = fs.existsSync(MIGRATION) ? fs.readFileSync(MIGRATION, 'utf8') : '';

function fnSlice(name) {
  const re = new RegExp(
    'CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.' + name + '[\\s\\S]*?\\n\\$\\$;',
    'i',
  );
  return (rawSql.match(re) || [''])[0];
}

// ---------------------------------------------------------------------
// 1. Existencia
// ---------------------------------------------------------------------

test('db/29_op_latex_split_rpc.sql existe', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/29_op_latex_split_rpc.sql nao existe');
});

// ---------------------------------------------------------------------
// 2. gerar_op_latex atualizada para motivo_separacao IS NULL
// ---------------------------------------------------------------------

test('gerar_op_latex redefine a funcao com CREATE OR REPLACE', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.ok(slice, 'gerar_op_latex nao encontrada na db/29');
  assert.match(slice, /RETURNS\s+JSONB/i);
});

test('gerar_op_latex filtra motivo_separacao IS NULL no SELECT da OP default', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /WHERE\s+tipo\s*=\s*'latex'[\s\S]*origem_op_id\s*=\s*v_op_id[\s\S]*destino_fornecedor_id\s*=\s*v_destino[\s\S]*motivo_separacao\s+IS\s+NULL/i);
});

test('gerar_op_latex usa ON CONFLICT com o predicado do indice parcial da db/28', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /ON\s+CONFLICT\s*\(\s*origem_op_id\s*,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'\s+AND\s+motivo_separacao\s+IS\s+NULL\s+DO\s+NOTHING/i);
});

test('gerar_op_latex fallback de concorrencia tambem filtra motivo_separacao IS NULL', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /WHERE\s+tipo\s*=\s*'latex'[\s\S]*origem_op_id\s*=\s*v_op_id[\s\S]*destino_fornecedor_id\s*=\s*v_destino[\s\S]*motivo_separacao\s+IS\s+NULL\s*;/i);
});

test('gerar_op_latex preserva retorno JSONB com todas as 6 chaves', () => {
  const slice = fnSlice('gerar_op_latex');
  for (const key of ['op_latex_id', 'numero', 'ano', 'created', 'accumulated', 'already_linked']) {
    assert.match(slice, new RegExp("'" + key + "'", 'i'), 'retorno nao contem chave ' + key);
  }
});

test('gerar_op_latex nao insere motivo_separacao (default = NULL)', () => {
  // gerar_op_latex contem motivo_separacao no SELECT de filtro e no ON CONFLICT,
  // mas o INSERT da nova OP default nao lista motivo_separacao nas colunas.
  const slice = fnSlice('gerar_op_latex');
  const insertCols = slice.match(/INSERT\s+INTO\s+public\.ops\s*\(([^)]+)\)/i) || [];
  const cols = insertCols[1] || '';
  assert.doesNotMatch(cols, /motivo_separacao/i);
});

// ---------------------------------------------------------------------
// 3. gerar_op_latex_split — split excepcional explicito
// ---------------------------------------------------------------------

test('gerar_op_latex_split existe com assinatura (BIGINT, TEXT) e retorna JSONB', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.ok(slice, 'gerar_op_latex_split nao encontrada na db/29');
  assert.match(slice, /p_entrega_id\s+BIGINT,\s*p_motivo\s+TEXT/i);
  assert.match(slice, /RETURNS\s+JSONB/i);
  assert.match(slice, /SECURITY\s+DEFINER/i);
});

test('gerar_op_latex_split exige p_motivo nao nulo e nao vazio', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /p_motivo\s+IS\s+NULL\s+OR\s+btrim\s*\(\s*p_motivo\s*\)\s*=\s*''/i);
  assert.match(slice, /RAISE\s+EXCEPTION\s+'Motivo de separacao/i);
});

test('gerar_op_latex_split e admin-only', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /NOT\s+public\.is_admin\s*\(\s*\)/i);
  assert.match(slice, /Apenas administradores/i);
});

test('gerar_op_latex_split verifica op_latex_entregas antes de criar (idempotencia por entrega)', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /FROM\s+public\.op_latex_entregas[\s\S]*WHERE\s+ole\.entrega_id\s*=\s*p_entrega_id/i);
});

test('gerar_op_latex_split retorna already_linked:true quando entrega ja vinculada', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /'created',\s*false\s*,\s*'split',\s*false\s*,\s*'already_linked',\s*true/i);
});

test('gerar_op_latex_split valida entrega (existe, etapa=cima, destino)', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /v_entrega\.etapa\s*<>\s*'cima'/i);
  assert.match(slice, /v_destino\s+IS\s+NULL[\s\S]*sem destino de latex/i);
});

test('gerar_op_latex_split valida itens com defeito=false e metros>0', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /defeito\s*=\s*FALSE[\s\S]*metros_entregues\s*>\s*0/i);
});

test('gerar_op_latex_split resolve OP origem via entrega_itens.op_item_id -> op_itens.op_id', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /SELECT\s+oi\.op_id\s+INTO\s+v_op_id/i);
  assert.match(slice, /JOIN\s+public\.op_itens\s+oi\s+ON\s+oi\.id\s*=\s*e\.op_item_id/i);
});

test('gerar_op_latex_split usa proximo_numero_op para numeracao lock-safe', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /public\.proximo_numero_op\s*\(\s*'latex'\s*,\s*v_ano\s*\)/i);
});

test('gerar_op_latex_split escreve motivo_separacao no INSERT da nova OP', () => {
  const slice = fnSlice('gerar_op_latex_split');
  // motivo_separacao na lista de colunas e btrim(p_motivo) no VALUES podem estar em linhas diferentes
  assert.match(slice, /motivo_separacao/i);
  assert.match(slice, /btrim\s*\(\s*p_motivo\s*\)/i);
});

test('gerar_op_latex_split escreve observacao indicando split e motivo', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /Split excepcional da OP/i);
  assert.match(slice, /Motivo:\s/i);
});

test('gerar_op_latex_split cria op_fornecedores com ON CONFLICT DO NOTHING', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /INSERT\s+INTO\s+public\.op_fornecedores[\s\S]*ON\s+CONFLICT\s*\(\s*op_id\s*,\s*fornecedor_id\s*,\s*etapa\s*\)\s+DO\s+NOTHING/i);
});

test('gerar_op_latex_split cria link op_latex_entregas com ON CONFLICT DO NOTHING', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /INSERT\s+INTO\s+public\.op_latex_entregas[\s\S]*ON\s+CONFLICT\s*\(\s*entrega_id\s*\)\s+DO\s+NOTHING/i);
});

test('gerar_op_latex_split registra criacao_split na nova OP via op_eventos', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /INSERT\s+INTO\s+public\.op_eventos[\s\S]*criacao_split/i);
  assert.match(slice, /payload/i);
  assert.match(slice, /origem_op_id[\s\S]*entrega_id[\s\S]*nova_op_id[\s\S]*destino_fornecedor_id[\s\S]*motivo/i);
});

test('gerar_op_latex_split registra split_derivado na OP origem via op_eventos', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /INSERT\s+INTO\s+public\.op_eventos[\s\S]*split_derivado/i);
  assert.match(slice, /payload/i);
  assert.match(slice, /nova_op_id[\s\S]*destino_fornecedor_id[\s\S]*motivo/i);
});

test('gerar_op_latex_split retorna split:true e motivo', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /'split',\s*true/i);
  assert.match(slice, /'motivo',\s*v_motivo/i);
});

test('gerar_op_latex_split tem GRANT EXECUTE para authenticated', () => {
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex_split\s*\(\s*BIGINT\s*,\s*TEXT\s*\)\s+TO\s+authenticated/i);
});

test('gerar_op_latex preserva GRANT EXECUTE para authenticated', () => {
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex\s*\(\s*BIGINT\s*\)\s+TO\s+authenticated/i);
});

// ---------------------------------------------------------------------
// 4. Invariantes
// ---------------------------------------------------------------------

test('db/29 nao contem DELETE fisico de ops, op_itens ou op_eventos', () => {
  assert.doesNotMatch(rawSql, /DELETE\s+FROM\s+(?:public\.)?ops\b/i);
  assert.doesNotMatch(rawSql, /DELETE\s+FROM\s+(?:public\.)?op_itens\b/i);
  assert.doesNotMatch(rawSql, /DELETE\s+FROM\s+(?:public\.)?op_eventos\b/i);
});

test('db/29 notifica PostgREST', () => {
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload schema'/i);
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload config'/i);
});

test('db/29 usa BEGIN/COMMIT transacional', () => {
  assert.match(rawSql, /^BEGIN;/m);
  assert.match(rawSql, /^COMMIT;/m);
});
