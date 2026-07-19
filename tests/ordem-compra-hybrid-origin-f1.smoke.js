const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sql = fs.readFileSync(
  path.join(__dirname, '..', 'db', '74_ordem_compra_hybrid_origin_forward_correction.sql'),
  'utf8',
);
const executable = sql.replace(/^\s*--.*$/gm, '');
const distributionUi = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'screens', 'ordem-compra-distribuicao.js'),
  'utf8',
);
const orderUi = fs.readFileSync(
  path.join(__dirname, '..', 'js', 'screens', 'ordem-compra-render.js'),
  'utf8',
);

test('F1 is one transactional forward-only migration without CASCADE', () => {
  assert.match(executable, /^\s*BEGIN\s*;/m);
  assert.match(executable, /^\s*COMMIT\s*;/m);
  assert.doesNotMatch(executable, /\bCASCADE\b/i);
  assert.doesNotMatch(executable, /^\s*(?:DELETE|UPDATE|INSERT)\s+.*ordens_compra_fio\b/im);
});

test('F1 installs the absolute-target idempotent distribution command', () => {
  assert.match(sql, /definir_alocacao_necessidade_compra_fio\s*\(\s*p_necessidade_id\s+BIGINT,\s*p_fornecedor_id\s+BIGINT,\s*p_kg_alocado\s+NUMERIC,\s*p_idempotency_key\s+TEXT/is);
  assert.match(sql, /idempotency_namespace\s+TEXT\s+NOT NULL\s+DEFAULT\s+'native_distribution_v1'/i);
  assert.match(sql, /UNIQUE\s*\(idempotency_namespace, ator_id, idempotency_key\)/i);
  assert.match(sql, /pg_advisory_xact_lock[\s\S]*hashtextextended/i);
  assert.match(sql, /'discriminador'[\s\S]*'kg_anterior'[\s\S]*'kg_final'[\s\S]*'item_removido'[\s\S]*'ordem_removida'/i);
  assert.match(sql, /'created'|'increased'|'reduced'|'removed'|'unchanged'/i);
});

test('F1 enforces one allocation per item and need with derived item quantity', () => {
  assert.match(sql, /CREATE UNIQUE INDEX ordem_compra_item_alocacao_identidade\s+ON public\.ordem_compra_item_alocacao\(item_id, necessidade_id\)/i);
  assert.match(sql, /v_kg\s+IS DISTINCT FROM\s+v_sum/i);
  assert.match(sql, /SET kg_pedido = v_item_total/i);
  assert.match(sql, /ordem_compra_item_alocacao is immutable outside rascunho/i);
  assert.match(sql, /ordem_compra Pedido\/supplier identity is immutable/i);
});

test('F1 permits attributed Pedido-origin ledger rows while preserving OP-origin attribution', () => {
  assert.match(sql, /ordem_compra_item_alocacao_id IS NOT NULL AND kg_excesso = 0/i);
  assert.match(sql, /origem_tipo = 'pedido'[\s\S]*NEW\.op_id IS NOT NULL[\s\S]*must preserve NULL OP provenance/i);
  assert.match(sql, /origem_tipo = 'op'[\s\S]*NEW\.op_id IS DISTINCT FROM v_need\.op_id[\s\S]*must preserve the locked need real OP/i);
  assert.match(sql, /SET op_id = a\.op_id/i);
  assert.doesNotMatch(sql, /INSERT INTO public\.ops\s*\(/i);
});

test('F1 ACL exposes only the authorized operational surface', () => {
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.definir_alocacao_necessidade_compra_fio\(BIGINT, BIGINT, NUMERIC, TEXT\)\s+TO authenticated/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.definir_item_ordem_compra\(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC\)[\s\S]*FROM PUBLIC, anon, authenticated, service_role/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.alocar_necessidade_compra_fio\(BIGINT, BIGINT, BIGINT, NUMERIC\)[\s\S]*FROM PUBLIC, anon, authenticated, service_role/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.remover_alocacao_compra_fio\(BIGINT\)[\s\S]*FROM PUBLIC, anon, authenticated, service_role/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.sincronizar_necessidades_compra_fio\(UUID\)[\s\S]*FROM PUBLIC, anon, authenticated, service_role[\s\S]*GRANT EXECUTE ON FUNCTION public\.sincronizar_necessidades_compra_fio\(UUID\)\s+TO authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.cancelar_ordem_compra\(BIGINT\)\s+TO authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.registrar_recebimento_ordem_compra\(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB\)\s+TO authenticated/i);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.estornar_recebimento_ordem_compra\(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB\)\s+TO authenticated/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.visualizar_importacao_saldo_inicial_c3a\(\)[\s\S]*FROM PUBLIC, anon, authenticated, service_role/i);
});

test('F1 preserves the F2 UI activation boundary and shared Pedido label', () => {
  assert.match(distributionUi, /var ALLOCATION_ENABLED = false;/);
  assert.match(distributionUi, /Pedido compartilhado/);
  assert.match(distributionUi, /somente leitura/);
  assert.match(orderUi, /var LEGACY_ITEM_MUTATION_ENABLED = false;/);
  assert.doesNotMatch(orderUi, /id: 'oc-nova'[\s\S]{0,300}handlers\.novaOrdem/);
  assert.doesNotMatch(orderUi, /id: 'oc-add-item'[\s\S]{0,350}handlers\.adicionarItem/);
});
