// =====================================================================
// === tests/production-flow-numbering-schema.smoke.js =================
// Smoke estatico da migration db/26_production_flow_invariants.sql.
//
// Fase: RAVATEX-TAPETES-OP-NUMBERING-MONOTONIC-DB26-A
//
// Valida por leitura de arquivos, sem executar DDL e sem acessar Supabase:
//   - op_numeros como high-water por tipo/ano;
//   - proximo_numero_op lock-safe por UPSERT;
//   - gerar_op_latex sem MAX(numero)+1 e chamando proximo_numero_op;
//   - retorno operacional da RPC;
//   - politica anti-delete fisico de OP numerada;
//   - entrega-writes.js consumindo created/accumulated/already_linked.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '26_production_flow_invariants.sql');
const MIGRATION_27 = path.join(ROOT, 'db', '27_op_numbering_highwater_reconcile.sql');
const ENTREGA_WRITES = path.join(ROOT, 'js', 'screens', 'entrega-writes.js');
const OP_PERSISTIR = path.join(ROOT, 'js', 'screens', 'op-persistir.js');
const OP_NOVA = path.join(ROOT, 'js', 'screens', 'op-nova.js');

const rawSql = fs.existsSync(MIGRATION) ? fs.readFileSync(MIGRATION, 'utf8') : '';
const rawSql27 = fs.existsSync(MIGRATION_27) ? fs.readFileSync(MIGRATION_27, 'utf8') : '';
const sql = rawSql.replace(/^\s*--.*$/gm, '');
const sql27 = rawSql27.replace(/^\s*--.*$/gm, '');
const entregaWrites = fs.existsSync(ENTREGA_WRITES) ? fs.readFileSync(ENTREGA_WRITES, 'utf8') : '';
const opPersistir = fs.existsSync(OP_PERSISTIR) ? fs.readFileSync(OP_PERSISTIR, 'utf8') : '';
const opNova = fs.existsSync(OP_NOVA) ? fs.readFileSync(OP_NOVA, 'utf8') : '';

function fnSlice(name) {
  const re = new RegExp(
    'CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+public\\.' + name + '[\\s\\S]*?\\n\\$\\$;',
    'i',
  );
  return (sql.match(re) || [''])[0];
}

test('db/26_production_flow_invariants.sql existe', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/26_production_flow_invariants.sql nao existe');
});

test('op_numeros existe como high-water por tipo/ano', () => {
  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.op_numeros/i);
  const tableSlice = (sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.op_numeros[\s\S]*?\);/i) || [''])[0];
  assert.match(tableSlice, /tipo\s+TEXT\s+NOT\s+NULL/i);
  assert.match(tableSlice, /ano\s+INTEGER\s+NOT\s+NULL/i);
  assert.match(tableSlice, /ultimo_numero\s+INTEGER\s+NOT\s+NULL/i);
  assert.match(tableSlice, /PRIMARY\s+KEY\s*\(\s*tipo,\s*ano\s*\)/i);
});

test('backfill de op_numeros usa MAX atual sem reduzir high-water', () => {
  assert.match(sql, /INSERT\s+INTO\s+public\.op_numeros[\s\S]*MAX\s*\(\s*o\.numero\s*\)[\s\S]*GROUP\s+BY\s+o\.tipo,\s*o\.ano/i);
  assert.match(sql, /ON\s+CONFLICT\s*\(\s*tipo,\s*ano\s*\)\s+DO\s+UPDATE[\s\S]*GREATEST\s*\(\s*public\.op_numeros\.ultimo_numero,\s*EXCLUDED\.ultimo_numero\s*\)/i);
});

test('db/27 reconcilia high-water por tipo/ano sem reduzir contador', () => {
  assert.ok(fs.existsSync(MIGRATION_27), 'migration db/27_op_numbering_highwater_reconcile.sql nao existe');
  assert.match(sql27, /INSERT\s+INTO\s+public\.op_numeros[\s\S]*MAX\s*\(\s*o\.numero\s*\)[\s\S]*GROUP\s+BY\s+o\.tipo,\s*o\.ano/i);
  assert.match(sql27, /ON\s+CONFLICT\s*\(\s*tipo,\s*ano\s*\)\s+DO\s+UPDATE[\s\S]*GREATEST\s*\(\s*public\.op_numeros\.ultimo_numero,\s*EXCLUDED\.ultimo_numero\s*\)/i);
  assert.match(sql27, /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.proximo_numero_op\s*\(\s*TEXT\s*,\s*INTEGER\s*\)\s+TO\s+authenticated/i);
  assert.doesNotMatch(sql27, /DELETE\s+FROM\s+(?:public\.)?ops\b/i);
  assert.doesNotMatch(sql27, /UPDATE\s+(?:public\.)?ops\b/i);
});

test('proximo_numero_op existe e incrementa por UPSERT lock-safe', () => {
  const slice = fnSlice('proximo_numero_op');
  assert.ok(slice, 'funcao proximo_numero_op nao encontrada');
  assert.match(slice, /RETURNS\s+INTEGER/i);
  assert.match(slice, /INSERT\s+INTO\s+public\.op_numeros\s+AS\s+n/i);
  assert.match(slice, /ON\s+CONFLICT\s*\(\s*tipo,\s*ano\s*\)\s+DO\s+UPDATE/i);
  assert.match(slice, /ultimo_numero\s*=\s*n\.ultimo_numero\s*\+\s*1/i);
  assert.match(slice, /RETURNING\s+ultimo_numero\s+INTO\s+v_numero/i);
});

test('gerar_op_latex nao usa MAX(numero)+1', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.ok(slice, 'funcao gerar_op_latex nao encontrada');
  assert.doesNotMatch(slice, /MAX\s*\(\s*numero\s*\)\s*\+\s*1/i);
  assert.doesNotMatch(slice, /COALESCE\s*\(\s*MAX\s*\(\s*numero\s*\)\s*,\s*0\s*\)\s*\+\s*1/i);
});

test('gerar_op_latex chama proximo_numero_op', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /public\.proximo_numero_op\s*\(\s*'latex'\s*,\s*v_ano\s*\)/i);
});

test('criacao de OP Tecelagem chama proximo_numero_op e nao depende de MAX(numero)+1', () => {
  assert.match(opPersistir, /rpc\(\s*['"]proximo_numero_op['"]\s*,\s*\{\s*p_tipo:\s*['"]tecelagem['"],\s*p_ano:\s*anoInt\s*\}\s*\)/);
  assert.doesNotMatch(opNova, /from\(\s*['"]ops['"]\s*\)\s*\.select\(\s*['"]numero['"]\s*\)[\s\S]*?order\(\s*['"]numero['"]/);
  assert.match(opNova, /from\(\s*['"]op_numeros['"]\s*\)[\s\S]*?eq\(\s*['"]tipo['"]\s*,\s*['"]tecelagem['"]\s*\)/);
});

test('gerar_op_latex retorna flags operacionais e identificacao da OP', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /RETURNS\s+JSONB/i);
  for (const key of ['created', 'accumulated', 'already_linked', 'numero', 'ano', 'op_latex_id']) {
    assert.match(slice, new RegExp("'" + key + "'", 'i'), 'retorno nao contem chave ' + key);
  }
});

test('gerar_op_latex preserva consolidacao por origem_op_id + destino_fornecedor_id', () => {
  const slice = fnSlice('gerar_op_latex');
  assert.match(slice, /WHERE\s+tipo\s*=\s*'latex'[\s\S]*origem_op_id\s*=\s*v_op_id[\s\S]*destino_fornecedor_id\s*=\s*v_destino/i);
  assert.match(slice, /INSERT\s+INTO\s+public\.op_latex_entregas[\s\S]*ON\s+CONFLICT\s*\(\s*entrega_id\s*\)\s+DO\s+NOTHING/i);
});

test('migration nao contem DELETE fisico de ops para reconciliacao futura', () => {
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+(?:public\.)?ops\b/i);
});

test('politica anti-delete fisico de OP numerada esta documentada e estruturada', () => {
  assert.match(rawSql, /ops_numeradas_no_delete/i);
  assert.match(rawSql, /OP numerada nao deve ser removida fisicamente/i);
  assert.match(rawSql, /Reconciliacoes futuras devem cancelar\/arquivar\/consolidar com rastro/i);
});

test('entrega-writes.js trata created/accumulated/already_linked da RPC', () => {
  assert.match(entregaWrites, /created\s*===\s*true[\s\S]*Criou\s+/);
  assert.match(entregaWrites, /accumulated\s*===\s*true[\s\S]*Acumulou na\s+/);
  assert.match(entregaWrites, /already_linked\s*===\s*true[\s\S]*J[aá]\s+vinculada\s+[àa]\s+/i);
  assert.match(entregaWrites, /normalizeGerarOpLatexResult/);
});
