\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users(id, email) VALUES
  ('91111111-1111-1111-1111-111111111111', 'c3c-admin@example.invalid'),
  ('92222222-2222-2222-2222-222222222222', 'c3c-supplier@example.invalid');
INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, ativo) VALUES
  ('91111111-1111-1111-1111-111111111111', 'c3c-admin@example.invalid', 'C3C Admin', 'admin', NULL, TRUE),
  ('92222222-2222-2222-2222-222222222222', 'c3c-supplier@example.invalid', 'C3C Supplier', 'fornecedor', 99001, TRUE);

INSERT INTO public.cores(id, nome) VALUES
  (99002, 'C3C Inventory Color 2'),
  (99003, 'C3C Inventory Color 3');
INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total) VALUES
  ('algodao', 99001, NULL, 500.000),
  ('algodao', 99002, NULL, 500.000),
  ('algodao', 99003, NULL, 400.000),
  ('poliester', NULL, 'PRETO', 500.000),
  ('poliester', NULL, 'BRANCO', 785.020);

INSERT INTO public.fornecedores(id, nome, tipo)
VALUES (99002, 'C3C Shared Polyester', 'fio_poliester');
INSERT INTO public.pedidos(id, cliente_id, numero, status)
VALUES ('99999999-0000-0000-0000-000000000002', 99001, 99002, 'rascunho');
INSERT INTO public.necessidade_compra_fio(
  id, pedido_id, origem_tipo, op_id, material, cor_id, cor_poliester,
  kg_necessario, kg_alocado, legado
) VALUES (
  99100, '99999999-0000-0000-0000-000000000002', 'pedido', NULL,
  'poliester', NULL, 'PRETO', 10.000, 0, FALSE
);
INSERT INTO public.ordem_compra(
  id, pedido_id, fornecedor_id, status_administrativo, status_aceite,
  status_recebimento, aceite_exigido_na_emissao, legado, emitida_em
) VALUES (
  99100, '99999999-0000-0000-0000-000000000002', 99002, 'rascunho',
  'nao_aplicavel', 'nao_recebido', NULL, FALSE, NULL
);
INSERT INTO public.ordem_compra_item(
  id, ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido
) VALUES (99100, 99100, 'poliester', NULL, 'PRETO', 10.000, 0);
INSERT INTO public.ordem_compra_item_alocacao(
  id, item_id, necessidade_id, op_id, kg_alocado
) VALUES (99100, 99100, 99100, NULL, 10.000);
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;
UPDATE public.ordem_compra
SET status_administrativo = 'emitida', aceite_exigido_na_emissao = FALSE,
    emitida_em = clock_timestamp()
WHERE id = 99100;

-- Both productive legacy receipt paths retain their direct-write behavior
-- while the singleton is legacy_active.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.ordens_compra_fio SET kg_recebido = kg_recebido WHERE id = 99001;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'legacy admin receipt path changed'; END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', '92222222-2222-2222-2222-222222222222', TRUE);
DO $test$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.ordens_compra_fio
  SET kg_recebido = kg_recebido, data_recebimento = data_recebimento, status = status
  WHERE id = 99001 AND fornecedor_id = 99001;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'legacy matching-supplier receipt path changed'; END IF;
END;
$test$;
RESET ROLE;

DO $test$
DECLARE v_result JSONB;
BEGIN
  v_result := public.registrar_recebimento_ordem_compra(
    99100, 'inactive-receipt', clock_timestamp(), NULL, 'integration', NULL,
    jsonb_build_array(jsonb_build_object(
      'item_id', 99100, 'destino', 'alocacao', 'alocacao_id', 99100, 'kg', 1.000
    ))
  );
  IF v_result ->> 'codigo' <> 'recebimento_canonico_inativo' THEN
    RAISE EXCEPTION 'canonical receipt did not reject inactive state: %', v_result;
  END IF;
  v_result := public.estornar_recebimento_ordem_compra(
    99100, 'inactive-reversal', clock_timestamp(), 'inactive', '[]'::JSONB
  );
  IF v_result ->> 'codigo' <> 'recebimento_canonico_inativo' THEN
    RAISE EXCEPTION 'canonical reversal did not reject inactive state: %', v_result;
  END IF;
  IF EXISTS (SELECT 1 FROM public.ordem_compra_recebimentos) THEN
    RAISE EXCEPTION 'inactive canonical command wrote a header';
  END IF;
END;
$test$;

CREATE TEMP TABLE _c3c_hashes(source_hash TEXT, inventory_hash TEXT) ON COMMIT DROP;
INSERT INTO _c3c_hashes
SELECT
  (SELECT md5(COALESCE(string_agg(concat_ws('|', id, kg_pedido, kg_recebido, status, status_administrativo), E'\n' ORDER BY id), ''))
   FROM public.ordens_compra_fio),
  (SELECT md5(COALESCE(string_agg(concat_ws('|', tipo, COALESCE(cor_id::TEXT,''), COALESCE(cor_poliester,''),
     to_char(kg_total, 'FM999999999990.000')), E'\n' ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST), ''))
   FROM public.saldo_fios);

DO $test$
BEGIN
  IF NOT public.ordem_compra_c3c_acquire_session_lock(75) THEN
    RAISE EXCEPTION 'session advisory lock was not acquired';
  END IF;
END;
$test$;
SELECT public.ordem_compra_c3c_fence_and_snapshot(75);

-- The actual admin and matching-supplier legacy writers are fenced.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', TRUE);
DO $test$
BEGIN
  BEGIN
    UPDATE public.ordens_compra_fio SET kg_recebido = kg_recebido WHERE id = 99001;
    RAISE EXCEPTION 'admin legacy writer escaped fence';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'legacy_receipt_fenced' THEN RAISE; END IF;
  END;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', '92222222-2222-2222-2222-222222222222', TRUE);
DO $test$
BEGIN
  BEGIN
    UPDATE public.ordens_compra_fio
    SET kg_recebido = kg_recebido, data_recebimento = data_recebimento, status = status
    WHERE id = 99001 AND fornecedor_id = 99001;
    RAISE EXCEPTION 'supplier legacy writer escaped fence';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'legacy_receipt_fenced' THEN RAISE; END IF;
  END;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  BEGIN
    UPDATE public.ordem_compra_item_compat_fio SET origem = origem WHERE id = 1;
    RAISE EXCEPTION 'protected source mutation escaped fence';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'legacy_receipt_fenced' THEN RAISE; END IF;
  END;
  BEGIN
    UPDATE public.saldo_fios SET kg_total = kg_total WHERE tipo = 'algodao' AND cor_id = 99001;
    RAISE EXCEPTION 'protected inventory mutation escaped fence';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'legacy_receipt_fenced' THEN RAISE; END IF;
  END;
END;
$test$;

DO $test$
DECLARE v_source TEXT; v_inventory TEXT; v_expected RECORD;
BEGIN
  SELECT * INTO v_expected FROM _c3c_hashes;
  SELECT md5(COALESCE(string_agg(concat_ws('|', id, kg_pedido, kg_recebido, status, status_administrativo), E'\n' ORDER BY id), ''))
  INTO v_source FROM public.ordens_compra_fio;
  SELECT md5(COALESCE(string_agg(concat_ws('|', tipo, COALESCE(cor_id::TEXT,''), COALESCE(cor_poliester,''),
    to_char(kg_total, 'FM999999999990.000')), E'\n' ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST), ''))
  INTO v_inventory FROM public.saldo_fios;
  IF v_source <> v_expected.source_hash OR v_inventory <> v_expected.inventory_hash THEN
    RAISE EXCEPTION 'source or inventory hash changed after fencing';
  END IF;
END;
$test$;

SELECT public.ordem_compra_c3c_import_and_reconcile(75);

DO $test$
DECLARE v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_state.status <> 'maintenance_fenced' OR v_state.read_authority <> 'flat'
     OR v_state.reconciliation_status <> 'reconciled'
     OR v_state.source_snapshot_count <> 51 OR v_state.inventory_baseline_count <> 5 THEN
    RAISE EXCEPTION 'snapshot/reconciliation state mismatch';
  END IF;
  IF (SELECT count(*) FROM public.ordem_compra_recebimentos) <> 39
     OR (SELECT count(*) FROM public.ordem_compra_fio_lancamentos) <> 44
     OR (SELECT sum(kg_recebido) FROM public.ordem_compra_fio_lancamentos) <> 20221.280
     OR (SELECT sum(kg_excesso) FROM public.ordem_compra_fio_lancamentos) <> 405.980
     OR EXISTS (SELECT 1 FROM public.ordem_compra_fio_movimentos_estoque) THEN
    RAISE EXCEPTION 'exact import shape or zero-movement invariant failed';
  END IF;
END;
$test$;

SELECT public.ordem_compra_c3c_set_canonical_read(75);
SELECT public.ordem_compra_c3c_close_final_acl(75);
SELECT public.ordem_compra_c3c_pre_ponr_rollback(75);

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ordem_compra_cutover
                 WHERE id = 1 AND status = 'maintenance_fenced' AND read_authority = 'flat'
                   AND productive_receipt_started_at IS NULL AND final_acl_closed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'pre-PONR rollback did not retain fence/closure';
  END IF;
  IF has_table_privilege('authenticated', 'public.ordens_compra_fio', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.ordens_compra_fio', 'kg_recebido', 'UPDATE')
     OR has_column_privilege('anon', 'public.ordens_compra_fio', 'kg_recebido', 'UPDATE') THEN
    RAISE EXCEPTION 'pre-PONR rollback restored a flat mutation grant';
  END IF;
END;
$test$;

SELECT public.ordem_compra_c3c_set_canonical_read(75);
SELECT public.ordem_compra_c3c_activate(75);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_result JSONB;
BEGIN
  v_result := public.registrar_recebimento_ordem_compra(
    99100, 'productive-shared-receipt', clock_timestamp(), 'C3C-PONR',
    'integration', 'shared',
    jsonb_build_array(
      jsonb_build_object('item_id', 99100, 'destino', 'alocacao', 'alocacao_id', 99100, 'kg', 10.000),
      jsonb_build_object('item_id', 99100, 'destino', 'excesso', 'kg', 2.000)
    )
  );
  IF COALESCE((v_result ->> 'ok')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'productive shared receipt failed: %', v_result;
  END IF;
END;
$test$;

DO $test$
DECLARE v_rows INTEGER; v_attributed NUMERIC; v_excess NUMERIC; v_non_null_op INTEGER;
BEGIN
  SELECT count(*), sum(kg_recebido_atribuido), sum(kg_excesso),
         count(*) FILTER (WHERE op_id IS NOT NULL)
  INTO v_rows, v_attributed, v_excess, v_non_null_op
  FROM public.listar_recebimentos_ordem_compra_normalizados(
    '99999999-0000-0000-0000-000000000002', NULL
  );
  IF v_rows <> 2 OR v_attributed <> 10.000 OR v_excess <> 2.000 OR v_non_null_op <> 0 THEN
    RAISE EXCEPTION 'nullable Pedido OP / attributable / excess / no-double-count failed: % % % %',
      v_rows, v_attributed, v_excess, v_non_null_op;
  END IF;
END;
$test$;
RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.ordem_compra_cutover
                 WHERE id = 1 AND status = 'canonical_active'
                   AND productive_receipt_started_at IS NOT NULL) THEN
    RAISE EXCEPTION 'first committed-path productive receipt did not record PONR';
  END IF;
  BEGIN
    PERFORM public.ordem_compra_c3c_pre_ponr_rollback(75);
    RAISE EXCEPTION 'post-PONR rollback was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'forward_recovery_only' THEN RAISE; END IF;
  END;
END;
$test$;

ROLLBACK;
SELECT public.ordem_compra_c3c_release_session_lock(75);
SELECT 'C3C_INTEGRATION_PASS' AS result;
