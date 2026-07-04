// =====================================================================
// === tests/latex-consolidation-schema.smoke.js =======================
// Smoke estático da migration db/25_latex_consolidation.sql.
//
// Fase: RAVATEX-TAPETES-TEC_TO_ACABAMENTO-CONSOLIDATED-LATEX-OP-A
//
// Valida por leitura do SQL (sem executar a migration) que a correção
// estrutural do fluxo TECELAGEM -> ACABAMENTO está presente:
//   - ops.destino_fornecedor_id (coluna + backfill);
//   - tabela op_latex_entregas (N entregas -> 1 OP Látex) com UNIQUE(entrega_id);
//   - backfill de op_latex_entregas a partir de origem_entrega_id;
//   - reconciliação de duplicatas com HARD-STOP (RAISE) se houver
//     downstream (status<>aberta, recebimento latex, expedição);
//   - troca do índice: dropa ops_origem_entrega_latex_uidx e cria
//     UNIQUE parcial (origem_op_id, destino_fornecedor_id) WHERE tipo='latex';
//   - gerar_op_latex find-or-accumulate (chave origem_op_id+destino,
//     vínculo op_latex_entregas, acúmulo de op_itens sem apagar linhas);
//   - guards passam a checar op_latex_entregas;
//   - idempotência + NOTIFY pgrst.
//
// Não executa o app nem acessa Supabase real.
// =====================================================================

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIGRATION = path.join(ROOT, 'db', '25_latex_consolidation.sql');
const MIGRATION_28 = path.join(ROOT, 'db', '28_op_latex_split_discriminator.sql');
const MIGRATION_29 = path.join(ROOT, 'db', '29_op_latex_split_rpc.sql');
const rawSql = fs.existsSync(MIGRATION) ? fs.readFileSync(MIGRATION, 'utf8') : '';
const rawSql28 = fs.existsSync(MIGRATION_28) ? fs.readFileSync(MIGRATION_28, 'utf8') : '';
const rawSql29 = fs.existsSync(MIGRATION_29) ? fs.readFileSync(MIGRATION_29, 'utf8') : '';
const stripLineComments = (s) => s.replace(/^\s*--.*$/gm, '');
const sql = stripLineComments(rawSql);
const sql28 = stripLineComments(rawSql28);
const sql29 = stripLineComments(rawSql29);

// ---------------------------------------------------------------------
// 1. Existência
// ---------------------------------------------------------------------

test('db/25_latex_consolidation.sql existe', () => {
  assert.ok(fs.existsSync(MIGRATION), 'migration db/25_latex_consolidation.sql não existe');
});

// ---------------------------------------------------------------------
// 2. Coluna destino_fornecedor_id em ops
// ---------------------------------------------------------------------

test('adiciona ops.destino_fornecedor_id (idempotente)', () => {
  assert.match(sql, /ALTER\s+TABLE\s+public\.ops\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+destino_fornecedor_id\s+BIGINT/i);
});

test('backfill de destino_fornecedor_id a partir de op_fornecedores(etapa=latex)', () => {
  assert.match(sql, /UPDATE\s+public\.ops\s+o[\s\S]*op_fornecedores\s+ofn[\s\S]*ofn\.etapa\s*=\s*'latex'/i);
});

// ---------------------------------------------------------------------
// 3. Tabela de vínculo N:1
// ---------------------------------------------------------------------

test('cria op_latex_entregas com UNIQUE(entrega_id) (uma entrega -> uma OP)', () => {
  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.op_latex_entregas/i);
  const tableSlice = (sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.op_latex_entregas[\s\S]*?\);/i) || [''])[0];
  assert.match(tableSlice, /op_latex_id\s+BIGINT\s+NOT\s+NULL\s+REFERENCES\s+public\.ops\(id\)\s+ON\s+DELETE\s+CASCADE/i);
  assert.match(tableSlice, /entrega_id\s+BIGINT\s+NOT\s+NULL\s+REFERENCES\s+public\.entregas\(id\)/i);
  assert.match(tableSlice, /UNIQUE\s*\(\s*entrega_id\s*\)/i);
});

test('backfill de op_latex_entregas a partir do vínculo legado origem_entrega_id', () => {
  assert.match(sql, /INSERT\s+INTO\s+public\.op_latex_entregas[\s\S]*origem_entrega_id[\s\S]*ON\s+CONFLICT\s*\(\s*entrega_id\s*\)\s+DO\s+NOTHING/i);
});

// ---------------------------------------------------------------------
// 4. Reconciliação de duplicatas com hard-stop
// ---------------------------------------------------------------------

test('reconciliação agrupa por (origem_op_id, destino_fornecedor_id) com HAVING count(*) > 1', () => {
  assert.match(sql, /GROUP\s+BY\s+o\.origem_op_id,\s*o\.destino_fornecedor_id[\s\S]*HAVING\s+count\(\*\)\s*>\s*1/i);
});

test('reconciliação faz HARD-STOP (RAISE) para OP não-aberta / recebimento latex / expedição', () => {
  const raises = sql.match(/RAISE\s+EXCEPTION\s+'Consolidacao abortada/gi) || [];
  assert.ok(raises.length >= 3, 'esperado >= 3 hard-stops (status, recebimento latex, expedição)');
  assert.match(sql, /o\.status\s*<>\s*'aberta'/i);
  assert.match(sql, /e\.etapa\s*=\s*'latex'/i);
  assert.match(sql, /FROM\s+public\.expedicoes\s+x[\s\S]*op_latex_id\s*=\s*ANY/i);
});

test('reconciliação acumula op_itens por modelo (upsert) e NÃO apaga op_itens', () => {
  assert.match(sql, /UPDATE\s+public\.op_itens\s+c[\s\S]*metros_pedidos\s*=\s*c\.metros_pedidos\s*\+/i);
  // op_itens é referenciado por expedicao_itens (ON DELETE RESTRICT):
  // a migration nunca deve apagar linhas de op_itens diretamente.
  assert.doesNotMatch(sql, /DELETE\s+FROM\s+public\.op_itens\b/i);
});

// ---------------------------------------------------------------------
// 5. Índice: troca a chave de identidade
// ---------------------------------------------------------------------

test('substitui o índice por-entrega pelo índice consolidado', () => {
  assert.match(sql, /DROP\s+INDEX\s+IF\s+EXISTS\s+public\.ops_origem_entrega_latex_uidx/i);
  assert.match(sql, /CREATE\s+UNIQUE\s+INDEX\s+ops_latex_origem_destino_uidx\s+ON\s+public\.ops\s*\(\s*origem_op_id,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'/i);
});

// ---------------------------------------------------------------------
// 6. gerar_op_latex find-or-accumulate
// ---------------------------------------------------------------------

test('gerar_op_latex é redefinida (CREATE OR REPLACE) com find-or-accumulate', () => {
  assert.match(sql, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex\(p_entrega_id\s+BIGINT\)/i);
  const fnSlice = (sql.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex[\s\S]*?END;\s*\$\$;/i) || [''])[0];
  assert.ok(fnSlice, 'corpo de gerar_op_latex não encontrado');
  // Idempotência por entrega via op_latex_entregas.
  assert.match(fnSlice, /FROM\s+public\.op_latex_entregas\s+WHERE\s+entrega_id\s*=\s*p_entrega_id/i);
  // Chave de consolidação.
  assert.match(fnSlice, /origem_op_id\s*=\s*v_op_id[\s\S]*destino_fornecedor_id\s*=\s*v_destino/i);
  // Vincula a entrega (N:1) de forma idempotente.
  assert.match(fnSlice, /INSERT\s+INTO\s+public\.op_latex_entregas[\s\S]*ON\s+CONFLICT\s*\(\s*entrega_id\s*\)\s+DO\s+NOTHING/i);
  // Acúmulo incremental de op_itens (não recria linhas).
  assert.match(fnSlice, /UPDATE\s+public\.op_itens\s+c[\s\S]*metros_pedidos\s*=\s*c\.metros_pedidos\s*\+/i);
  assert.doesNotMatch(fnSlice, /DELETE\s+FROM\s+public\.op_itens\b/i);
});

// ---------------------------------------------------------------------
// 7. Guards passam a checar op_latex_entregas
// ---------------------------------------------------------------------

test('guards (entregas / entrega_itens) checam op_latex_entregas', () => {
  const guardEntregas = (sql.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.entrega_cima_latex_guard_fn[\s\S]*?END;\s*\$\$;/i) || [''])[0];
  const guardItens = (sql.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.entrega_itens_cima_latex_guard_fn[\s\S]*?END;\s*\$\$;/i) || [''])[0];
  assert.ok(guardEntregas, 'guard de entregas não encontrado');
  assert.ok(guardItens, 'guard de entrega_itens não encontrado');
  assert.match(guardEntregas, /op_latex_entregas\s+ole\s+WHERE\s+ole\.entrega_id\s*=\s*OLD\.id/i);
  assert.match(guardItens, /op_latex_entregas\s+ole\s+WHERE\s+ole\.entrega_id\s*=\s*v_entrega_id/i);
  // Mantém o escape por GUC de retificação.
  assert.match(guardEntregas, /current_setting\(\s*'app\.retificacao_autorizada'/i);
});

// ---------------------------------------------------------------------
// 8. Idempotência e reload
// ---------------------------------------------------------------------

test('idempotência: usa IF NOT EXISTS / CREATE OR REPLACE e NOTIFY pgrst', () => {
  assert.match(sql, /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i);
  assert.match(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/i);
  assert.match(sql, /NOTIFY\s+pgrst/i);
});

test('não cria/dropa tabelas de dados destrutivamente (só op_latex_entregas via IF NOT EXISTS)', () => {
  assert.doesNotMatch(sql, /DROP\s+TABLE/i);
});

// ---------------------------------------------------------------------
// 9. db/28: discriminador de split Latex sem alterar a RPC
// ---------------------------------------------------------------------

test('db/28 adiciona ops.motivo_separacao como discriminador nullable de split Latex', () => {
  assert.ok(fs.existsSync(MIGRATION_28), 'migration db/28_op_latex_split_discriminator.sql nao existe');
  assert.match(sql28, /ALTER\s+TABLE\s+public\.ops\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+motivo_separacao\s+TEXT\s+NULL/i);
  assert.match(rawSql28, /COMMENT\s+ON\s+COLUMN\s+public\.ops\.motivo_separacao\s+IS[\s\S]*NULL = OP latex consolidada default/i);
});

test('db/28 faz hard-stop se houver duplicidade default antes de recriar indice', () => {
  assert.match(sql28, /DO\s+\$\$[\s\S]*WHERE\s+o\.tipo\s*=\s*'latex'[\s\S]*o\.motivo_separacao\s+IS\s+NULL[\s\S]*GROUP\s+BY\s+o\.origem_op_id,\s*o\.destino_fornecedor_id[\s\S]*HAVING\s+count\(\*\)\s*>\s*1/i);
  assert.match(sql28, /RAISE\s+EXCEPTION\s+'db\/28 abortada: duplicidade default de OP latex/i);
});

test('db/28 recria indice unico parcial somente para OP Latex default', () => {
  assert.match(sql28, /DROP\s+INDEX\s+IF\s+EXISTS\s+public\.ops_latex_origem_destino_uidx/i);
  assert.match(sql28, /CREATE\s+UNIQUE\s+INDEX\s+ops_latex_origem_destino_uidx\s+ON\s+public\.ops\s*\(\s*origem_op_id,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'\s+AND\s+motivo_separacao\s+IS\s+NULL/i);
});

test('db/28 cria indice auxiliar para auditoria de OPs Latex split', () => {
  assert.match(sql28, /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+ops_latex_split_idx\s+ON\s+public\.ops\s*\(\s*origem_op_id,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'\s+AND\s+motivo_separacao\s+IS\s+NOT\s+NULL/i);
});

test('db/28 nao altera gerar_op_latex, nao cria split funcional e nao mexe em dados operacionais', () => {
  assert.doesNotMatch(sql28, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex/i);
  assert.doesNotMatch(sql28, /DROP\s+FUNCTION\s+IF\s+EXISTS\s+public\.gerar_op_latex/i);
  assert.doesNotMatch(sql28, /gerar_op_latex_split/i);
  assert.doesNotMatch(sql28, /INSERT\s+INTO\s+public\./i);
  assert.doesNotMatch(sql28, /UPDATE\s+public\.ops\b/i);
  assert.doesNotMatch(sql28, /DELETE\s+FROM\s+public\.ops\b/i);
  assert.doesNotMatch(sql28, /op_latex_entregas/i);
  assert.doesNotMatch(sql28, /op_numeros/i);
  assert.match(sql28, /NOTIFY\s+pgrst,\s*'reload schema'/i);
  assert.match(sql28, /NOTIFY\s+pgrst,\s*'reload config'/i);
});

// ---------------------------------------------------------------------
// 10. db/29: ajuste do ON CONFLICT e criacao da split RPC
// ---------------------------------------------------------------------

test('db/29 existe como migration seguinte a db/28', () => {
  assert.ok(fs.existsSync(MIGRATION_29), 'migration db/29_op_latex_split_rpc.sql nao existe');
});

test('db/29 redefine gerar_op_latex com CREATE OR REPLACE', () => {
  assert.match(sql29, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex/i);
});

test('db/29 ajusta gerar_op_latex: SELECT filtra motivo_separacao IS NULL', () => {
  const slice = (sql29.match(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex[\s\S]*?END;\s*\$\$;/i) || [''])[0];
  assert.match(slice, /motivo_separacao\s+IS\s+NULL/i);
});

test('db/29 ajusta gerar_op_latex: ON CONFLICT com predicado parcial', () => {
  assert.match(sql29, /ON\s+CONFLICT\s*\(\s*origem_op_id\s*,\s*destino_fornecedor_id\s*\)\s*WHERE\s+tipo\s*=\s*'latex'\s+AND\s+motivo_separacao\s+IS\s+NULL\s+DO\s+NOTHING/i);
});

test('db/29 cria gerar_op_latex_split com assinatura (BIGINT, TEXT)', () => {
  assert.match(sql29, /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.gerar_op_latex_split\s*\(\s*p_entrega_id\s+BIGINT\s*,\s*p_motivo\s+TEXT\s*\)/i);
});

test('db/29: gerar_op_latex_split exige p_motivo com RAISE EXCEPTION', () => {
  assert.match(sql29, /p_motivo\s+IS\s+NULL\s+OR\s+btrim\s*\(\s*p_motivo\s*\)\s*=\s*''/i);
  assert.match(sql29, /RAISE\s+EXCEPTION\s+'Motivo de separacao/i);
});

test('db/29: gerar_op_latex_split registra criacao_split e split_derivado em op_eventos', () => {
  assert.match(sql29, /criacao_split/i);
  assert.match(sql29, /split_derivado/i);
});
