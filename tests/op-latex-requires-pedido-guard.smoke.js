// =====================================================================
// === tests/op-latex-requires-pedido-guard.smoke.js ====================
// Smoke estatico da migration db/33_op_latex_requires_pedido_guard.sql.
//
// Valida por leitura do SQL que gerar_op_latex e gerar_op_latex_split
// bloqueiam OP origem sem lote/Pedido antes de reservar numero ou criar
// OP de Acabamento/Latex.
//
// Nao executa o app nem acessa Supabase real.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '33_op_latex_requires_pedido_guard.sql');
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

test('db/33_op_latex_requires_pedido_guard.sql existe', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/33_op_latex_requires_pedido_guard.sql nao existe');
});

test('gerar_op_latex bloqueia OP origem sem lote ou Pedido antes da numeracao', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.ok(slice, 'gerar_op_latex nao encontrada na db/33');
  assert.match(slice, /v_pedido_id\s+public\.lotes\.pedido_id%TYPE/i);
  assert.match(slice, /SELECT\s+o\.lote_id,\s*l\.pedido_id\s+INTO\s+v_lote_id,\s*v_pedido_id[\s\S]*LEFT\s+JOIN\s+public\.lotes\s+l\s+ON\s+l\.id\s*=\s*o\.lote_id/i);
  assert.match(slice, /IF\s+v_lote_id\s+IS\s+NULL\s+OR\s+v_pedido_id\s+IS\s+NULL\s+THEN[\s\S]*Nao e possivel gerar OP de Acabamento\/Latex: OP origem nao possui Pedido vinculado/i);

  const guardIdx = indexOfRequired(slice, /v_pedido_id\s+IS\s+NULL/i, 'guard pedido');
  const numberIdx = indexOfRequired(slice, /public\.proximo_numero_op\s*\(/i, 'proximo_numero_op');
  assert.ok(guardIdx < numberIdx, 'guard deve ocorrer antes de reservar numero');
});

test('gerar_op_latex preserva fluxo valido com Pedido', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /INSERT\s+INTO\s+public\.ops[\s\S]*v_lote_id,\s*v_destino/i);
  assert.match(slice, /ON\s+CONFLICT\s*\(\s*origem_op_id\s*,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'\s+AND\s+motivo_separacao\s+IS\s+NULL\s+DO\s+NOTHING/i);
  for (const key of ['op_latex_id', 'numero', 'ano', 'created', 'accumulated', 'already_linked']) {
    assert.match(slice, new RegExp("'" + key + "'", 'i'));
  }
});

test('gerar_op_latex_split bloqueia OP origem sem lote ou Pedido antes da numeracao', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.ok(slice, 'gerar_op_latex_split nao encontrada na db/33');
  assert.match(slice, /v_pedido_id\s+public\.lotes\.pedido_id%TYPE/i);
  assert.match(slice, /SELECT\s+o\.lote_id,\s*l\.pedido_id\s+INTO\s+v_lote_id,\s*v_pedido_id[\s\S]*LEFT\s+JOIN\s+public\.lotes\s+l\s+ON\s+l\.id\s*=\s*o\.lote_id/i);
  assert.match(slice, /IF\s+v_lote_id\s+IS\s+NULL\s+OR\s+v_pedido_id\s+IS\s+NULL\s+THEN[\s\S]*Nao e possivel gerar OP de Acabamento\/Latex: OP origem nao possui Pedido vinculado/i);

  const guardIdx = indexOfRequired(slice, /v_pedido_id\s+IS\s+NULL/i, 'guard pedido split');
  const numberIdx = indexOfRequired(slice, /public\.proximo_numero_op\s*\(/i, 'proximo_numero_op split');
  assert.ok(guardIdx < numberIdx, 'guard split deve ocorrer antes de reservar numero');
});

test('gerar_op_latex_split preserva split valido com Pedido', () => {
  const slice = fnSlice('gerar_op_latex_split');
  assert.match(slice, /p_motivo\s+IS\s+NULL\s+OR\s+btrim\s*\(\s*p_motivo\s*\)\s*=\s*''/i);
  assert.match(slice, /INSERT\s+INTO\s+public\.ops[\s\S]*motivo_separacao[\s\S]*v_destino,\s*v_motivo/i);
  assert.match(slice, /criacao_split/i);
  assert.match(slice, /split_derivado/i);
  assert.match(slice, /'split',\s*true/i);
});

test('db/33 nao cria constraint global nem altera dados historicos', () => {
  assert.doesNotMatch(rawSql, /ALTER\s+TABLE\s+public\.lotes[\s\S]*NOT\s+NULL/i);
  assert.doesNotMatch(rawSql, /CREATE\s+TRIGGER/i);
  assert.doesNotMatch(rawSql, /DELETE\s+FROM\s+public\./i);
  assert.doesNotMatch(rawSql, /UPDATE\s+public\.(?!op_itens\b)/i);
  assert.doesNotMatch(rawSql, /INSERT\s+INTO\s+public\.(?!ops\b|op_fornecedores\b|op_latex_entregas\b|op_itens\b|op_eventos\b)/i);
});

test('db/33 preserva grants e reload PostgREST', () => {
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex\s*\(\s*BIGINT\s*\)\s+TO\s+authenticated/i);
  assert.match(rawSql, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.gerar_op_latex_split\s*\(\s*BIGINT\s*,\s*TEXT\s*\)\s+TO\s+authenticated/i);
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload schema'/i);
  assert.match(rawSql, /NOTIFY\s+pgrst,\s*'reload config'/i);
});
