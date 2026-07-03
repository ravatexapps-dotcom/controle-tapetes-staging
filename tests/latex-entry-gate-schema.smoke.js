'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '22_latex_entry_gate.sql');
const sql = fs.readFileSync(MIGRATION, 'utf8');

test('db/22_latex_entry_gate.sql existe', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/22_latex_entry_gate.sql nao existe');
});

test('gerar_op_latex preserva assinatura atual', () => {
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex\s*\(\s*p_entrega_id\s+BIGINT\s*\)/i);
  assert.doesNotMatch(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?!public\.)?(?!gerar_op_latex\b)[a-z_]+\s*\(/i);
});

test('gerar_op_latex cria OP latex aberta aguardando entrada', () => {
  assert.match(sql, /INSERT\s+INTO\s+public\.ops\s*\([^)]*status[^)]*tipo[^)]*origem_op_id[^)]*origem_entrega_id[^)]*lote_id/i);
  assert.match(sql, /VALUES\s*\([\s\S]*'aberta'\s*,\s*'latex'\s*,\s*v_op_id\s*,\s*p_entrega_id\s*,\s*v_lote_id/i);
  assert.doesNotMatch(sql, /'em_producao'\s*,\s*'latex'/i);
});

test('gerar_op_latex preserva itens sem defeito e fornecedor de etapa latex', () => {
  assert.match(sql, /ei\.defeito\s*=\s*FALSE/i);
  assert.match(sql, /ei\.metros_entregues\s*>\s*0/i);
  assert.match(sql, /INSERT\s+INTO\s+public\.op_fornecedores/i);
  assert.match(sql, /v_entrega\.destino_fornecedor_id\s*,\s*'latex'/i);
});
