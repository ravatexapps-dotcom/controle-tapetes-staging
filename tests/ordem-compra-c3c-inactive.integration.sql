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

-- A pre-existing, unrelated inventory movement must not be attributed to C3C.
SET LOCAL session_replication_role = replica;
WITH unrelated_line AS (
  INSERT INTO public.ordem_compra_fio_lancamentos(
    ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
    observacao, criado_por, tipo, idempotency_key, origem_tipo, origem_ref
  ) VALUES (
    99001, NULL, 1.000, CURRENT_DATE, 'C3C unrelated fixture',
    '91111111-1111-1111-1111-111111111111', 'recebimento',
    'c3c-unrelated-existing-line', 'integration_fixture', 'outside-c3c-import'
  ) RETURNING id
)
INSERT INTO public.ordem_compra_fio_movimentos_estoque(
  lancamento_id, ordem_compra_id, ordem_compra_item_id,
  ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
  kg_excedente_delta, excesso_antes, excesso_depois, ator_id, ator_tipo
)
SELECT id, 99100, 99100, NULL, NULL, 'poliester', NULL, 'PRETO',
       0.000, 0.000, 0.000, '91111111-1111-1111-1111-111111111111', 'admin'
FROM unrelated_line;
SET LOCAL session_replication_role = origin;

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
  (SELECT encode(extensions.digest(COALESCE(string_agg(concat_ws('|', id, kg_pedido, kg_recebido, status, status_administrativo), E'\n' ORDER BY id), ''), 'sha256'), 'hex')
   FROM public.ordens_compra_fio),
  (SELECT encode(extensions.digest(COALESCE(string_agg(concat_ws('|', tipo, COALESCE(cor_id::TEXT,''), COALESCE(cor_poliester,''),
     to_char(kg_total, 'FM999999999990.000')), E'\n' ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST), ''), 'sha256'), 'hex')
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
  SELECT encode(extensions.digest(COALESCE(string_agg(concat_ws('|', id, kg_pedido, kg_recebido, status, status_administrativo), E'\n' ORDER BY id), ''), 'sha256'), 'hex')
  INTO v_source FROM public.ordens_compra_fio;
  SELECT encode(extensions.digest(COALESCE(string_agg(concat_ws('|', tipo, COALESCE(cor_id::TEXT,''), COALESCE(cor_poliester,''),
    to_char(kg_total, 'FM999999999990.000')), E'\n' ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST), ''), 'sha256'), 'hex')
  INTO v_inventory FROM public.saldo_fios;
  IF v_source <> v_expected.source_hash OR v_inventory <> v_expected.inventory_hash THEN
    RAISE EXCEPTION 'source or inventory hash changed after fencing';
  END IF;
END;
$test$;

CREATE TEMP TABLE _c3c_first_import_result ON COMMIT DROP AS
SELECT public.ordem_compra_c3c_import_and_reconcile(75) AS result;

DO $test$
DECLARE v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_state.status <> 'maintenance_fenced' OR v_state.read_authority <> 'flat'
     OR v_state.reconciliation_status <> 'reconciled'
     OR v_state.source_snapshot_count <> 51 OR v_state.inventory_baseline_count <> 5 THEN
    RAISE EXCEPTION 'snapshot/reconciliation state mismatch';
  END IF;
  IF (SELECT count(*) FROM public.ordem_compra_recebimentos
      WHERE idempotency_namespace = 'legacy_initial_balance_v1') <> 39
     OR (SELECT count(*) FROM public.ordem_compra_fio_lancamentos l
         JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
         WHERE h.idempotency_namespace = 'legacy_initial_balance_v1') <> 44
     OR (SELECT sum(l.kg_recebido) FROM public.ordem_compra_fio_lancamentos l
         JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
         WHERE h.idempotency_namespace = 'legacy_initial_balance_v1') <> 20221.280
     OR (SELECT sum(l.kg_excesso) FROM public.ordem_compra_fio_lancamentos l
         JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
         WHERE h.idempotency_namespace = 'legacy_initial_balance_v1') <> 405.980
     OR (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque) <> 1
     OR (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque m
         JOIN public.ordem_compra_fio_lancamentos l ON l.id = m.lancamento_id
         JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
         WHERE h.idempotency_namespace = 'legacy_initial_balance_v1') <> 0 THEN
    RAISE EXCEPTION 'exact scoped import shape or movement invariant failed';
  END IF;
END;
$test$;

CREATE TEMP TABLE _c3c_replay_before ON COMMIT DROP AS
SELECT f.result,
  (SELECT count(*) FROM public.ordem_compra_recebimentos) AS header_count,
  (SELECT count(*) FROM public.ordem_compra_fio_lancamentos) AS line_count,
  (SELECT count(*) FROM public.ordem_compra_fio_lancamentos l
   JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
   WHERE h.idempotency_namespace = 'legacy_initial_balance_v1') AS import_line_count,
  s.import_started_at, s.import_completed_at, s.reconciliation_status,
  s.snapshot_hash, s.inventory_baseline_hash
FROM _c3c_first_import_result f
CROSS JOIN public.ordem_compra_cutover s
WHERE s.id = 1;
CREATE TEMP TABLE _c3c_replay_result ON COMMIT DROP AS
SELECT public.ordem_compra_c3c_import_and_reconcile(75) AS result;

DO $test$
DECLARE v_before _c3c_replay_before%ROWTYPE; v_result JSONB;
BEGIN
  SELECT * INTO v_before FROM _c3c_replay_before;
  SELECT result INTO v_result FROM _c3c_replay_result;
  IF v_result IS DISTINCT FROM v_before.result
     OR (SELECT count(*) FROM public.ordem_compra_recebimentos) <> v_before.header_count
     OR (SELECT count(*) FROM public.ordem_compra_fio_lancamentos) <> v_before.line_count
     OR EXISTS (
       SELECT 1 FROM public.ordem_compra_cutover s WHERE s.id = 1 AND (
         s.import_started_at IS DISTINCT FROM v_before.import_started_at
         OR s.import_completed_at IS DISTINCT FROM v_before.import_completed_at
         OR s.reconciliation_status IS DISTINCT FROM v_before.reconciliation_status
         OR s.snapshot_hash IS DISTINCT FROM v_before.snapshot_hash
         OR s.inventory_baseline_hash IS DISTINCT FROM v_before.inventory_baseline_hash)) THEN
    RAISE EXCEPTION 'exact replay changed result, rows, timestamps, or state';
  END IF;
END;
$test$;

-- Conflicting header reuse and missing, duplicate, or mismatched immutable lines
-- must reject with one stable error and roll every simulation back.
DO $test$
BEGIN
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    UPDATE public.ordem_compra_recebimentos
    SET comando_payload = comando_payload || '{"conflict":true}'::JSONB
    WHERE id = (SELECT min(id) FROM public.ordem_compra_recebimentos
                WHERE idempotency_namespace = 'legacy_initial_balance_v1');
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'conflicting replay was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'idempotencia_conflitante' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    DELETE FROM public.ordem_compra_fio_lancamentos
    WHERE id = (SELECT min(l.id) FROM public.ordem_compra_fio_lancamentos l
                JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
                WHERE h.idempotency_namespace = 'legacy_initial_balance_v1');
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'missing import line was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'idempotencia_conflitante' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key, origem_tipo,
      origem_ref, recebimento_id, ordem_compra_id, ordem_compra_item_alocacao_id,
      op_id, material, cor_id, cor_poliester, kg_excesso, ator_tipo, linha_indice
    ) SELECT ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key || ':duplicate',
      origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
      kg_excesso, ator_tipo, 99
    FROM public.ordem_compra_fio_lancamentos
    WHERE id = (SELECT min(l.id) FROM public.ordem_compra_fio_lancamentos l
                JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
                WHERE h.idempotency_namespace = 'legacy_initial_balance_v1');
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'duplicate import line was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'idempotencia_conflitante' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    UPDATE public.ordem_compra_fio_lancamentos SET kg_recebido = kg_recebido + 0.001
    WHERE id = (SELECT min(l.id) FROM public.ordem_compra_fio_lancamentos l
                JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
                WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
                  AND l.ordem_compra_item_alocacao_id IS NOT NULL);
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'mismatched import line was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'idempotencia_conflitante' THEN RAISE; END IF;
  END;
END;
$test$;

-- Live-source drift, inventory drift, and a pre-switch productive receipt each
-- fail independently and leave the reconciled import unchanged.
DO $test$
BEGIN
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    UPDATE public.ordens_compra_fio SET kg_recebido = kg_recebido + 1 WHERE id = 99001;
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'live source drift was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'source_drift_detected' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    UPDATE public.saldo_fios SET kg_total = kg_total + 1
    WHERE tipo = 'algodao' AND cor_id = 99001;
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'live inventory drift was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'inventory_drift_detected' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM set_config('session_replication_role', 'replica', TRUE);
    INSERT INTO public.ordem_compra_recebimentos(
      ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
      ator_id, ator_tipo, ocorrido_em, origem_tipo, comando_payload,
      comando_hash, resultado_metadata
    ) VALUES (
      99100, 'recebimento', 'native_receipt_v1', 'c3c-pre-switch-productive',
      '91111111-1111-1111-1111-111111111111', 'admin', clock_timestamp(),
      'integration_fixture', '{}'::JSONB, repeat('0', 32), '{}'::JSONB
    );
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    PERFORM public.ordem_compra_c3c_import_and_reconcile(75);
    RAISE EXCEPTION 'pre-switch productive receipt was accepted';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    PERFORM set_config('session_replication_role', 'origin', TRUE);
    IF SQLERRM <> 'productive_receipt_exists' THEN RAISE; END IF;
  END;
END;
$test$;

DO $test$
DECLARE v_before _c3c_replay_before%ROWTYPE;
BEGIN
  SELECT * INTO v_before FROM _c3c_replay_before;
  IF (SELECT count(*) FROM public.ordem_compra_recebimentos) <> v_before.header_count
     OR (SELECT count(*) FROM public.ordem_compra_fio_lancamentos) <> v_before.line_count
     OR EXISTS (SELECT 1 FROM public.ordem_compra_cutover s WHERE s.id = 1 AND
       (s.import_started_at IS DISTINCT FROM v_before.import_started_at
        OR s.import_completed_at IS DISTINCT FROM v_before.import_completed_at
        OR s.reconciliation_status IS DISTINCT FROM v_before.reconciliation_status)) THEN
    RAISE EXCEPTION 'rejected replay or drift simulation left writes';
  END IF;
END;
$test$;

SELECT 'C3C_REPLAY_PROOF' AS proof, header_count, line_count,
       import_line_count, import_started_at, import_completed_at, snapshot_hash,
       inventory_baseline_hash
FROM _c3c_replay_before;
SELECT 'C3C_NEGATIVE_PROOFS' AS proof,
       'conflict,missing,duplicate,mismatch,source_drift,inventory_drift,productive_receipt' AS rejected;

SELECT public.ordem_compra_c3c_set_canonical_read(75);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '91111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_rows INTEGER; v_attributed NUMERIC; v_excess NUMERIC; v_fabricated_op INTEGER;
BEGIN
  SELECT count(*), sum(kg_recebido_atribuido), sum(kg_excesso),
         count(*) FILTER (WHERE origem_tipo = 'excesso' AND op_id IS NOT NULL)
  INTO v_rows, v_attributed, v_excess, v_fabricated_op
  FROM public.listar_recebimentos_ordem_compra_normalizados(
    '99999999-0000-0000-0000-000000000001', NULL
  );
  IF v_rows <> 44 OR v_attributed <> 19815.300 OR v_excess <> 405.980
     OR v_attributed + v_excess <> 20221.280 OR v_fabricated_op <> 0 THEN
    RAISE EXCEPTION 'normalized import reconciliation failed: % % % %',
      v_rows, v_attributed, v_excess, v_fabricated_op;
  END IF;
END;
$test$;
RESET ROLE;

CREATE POLICY c3c_test_public_only
  ON public.ordem_compra_cutover FOR SELECT TO PUBLIC USING (TRUE);
CREATE POLICY c3c_test_public_mixed
  ON public.ordem_compra_cutover_source_snapshot FOR SELECT
  TO PUBLIC, authenticated USING (TRUE);
CREATE POLICY c3c_test_public_outside_scope
  ON public.pedidos FOR SELECT TO PUBLIC USING (FALSE);

CREATE TEMP TABLE _c3c_acl_before (
  mixed_targets_public BOOLEAN NOT NULL,
  mixed_roles_retained BOOLEAN NOT NULL,
  outside_select BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  read_authority TEXT NOT NULL,
  reconciliation_status TEXT NOT NULL,
  cutover_generation BIGINT,
  productive_receipt_started_at TIMESTAMPTZ
) ON COMMIT DROP;

INSERT INTO _c3c_acl_before
SELECT
  0::oid = ANY(p.polroles),
  cardinality(p.polroles) > 1,
  has_table_privilege('authenticated', 'public.pedidos', 'SELECT'),
  s.status,
  s.read_authority,
  s.reconciliation_status,
  s.cutover_generation,
  s.productive_receipt_started_at
FROM pg_catalog.pg_policy p
JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
CROSS JOIN public.ordem_compra_cutover s
WHERE n.nspname = 'public'
  AND c.relname = 'ordem_compra_cutover_source_snapshot'
  AND p.polname = 'c3c_test_public_mixed'
  AND s.id = 1;

DO $test$
BEGIN
  IF (SELECT count(*) FROM _c3c_acl_before) <> 1
     OR NOT (SELECT mixed_targets_public FROM _c3c_acl_before) THEN
    RAISE EXCEPTION 'mixed PUBLIC policy fixture was not represented in pg_policy';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policy p
      JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND p.polname IN ('c3c_test_public_only', 'c3c_test_public_mixed')
        AND 0::oid = ANY(p.polroles)) <> 2 THEN
    RAISE EXCEPTION 'protected PUBLIC policy fixtures were not detected';
  END IF;
END;
$test$;

SELECT public.ordem_compra_c3c_close_final_acl(75);

DO $test$
DECLARE
  v_before _c3c_acl_before%ROWTYPE;
  v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO v_before FROM _c3c_acl_before;
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND 0::oid = ANY(p.polroles)
      AND c.relname IN (
        'ordens_compra_fio', 'necessidade_compra_fio',
        'ordem_compra_item_compat_fio', 'ordem_compra_item_alocacao',
        'ordem_compra_item', 'ordem_compra', 'saldo_fios', 'saldo_fios_op',
        'ordem_compra_recebimentos', 'ordem_compra_fio_lancamentos',
        'ordem_compra_fio_movimentos_estoque', 'ordem_compra_cutover',
        'ordem_compra_cutover_source_snapshot',
        'ordem_compra_cutover_inventory_baseline'
      )
  ) THEN
    RAISE EXCEPTION 'protected PUBLIC policy remained after closure';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'pedidos'
      AND p.polname = 'c3c_test_public_outside_scope'
      AND 0::oid = ANY(p.polroles)
  ) THEN
    RAISE EXCEPTION 'PUBLIC policy outside protected scope was changed';
  END IF;
  IF has_table_privilege('authenticated', 'public.pedidos', 'SELECT')
       IS DISTINCT FROM v_before.outside_select
     OR v_state.status IS DISTINCT FROM v_before.status
     OR v_state.read_authority IS DISTINCT FROM v_before.read_authority
     OR v_state.reconciliation_status IS DISTINCT FROM v_before.reconciliation_status
     OR v_state.cutover_generation IS DISTINCT FROM v_before.cutover_generation
     OR v_state.productive_receipt_started_at IS DISTINCT FROM v_before.productive_receipt_started_at
     OR v_state.final_acl_closed_at IS NULL THEN
    RAISE EXCEPTION 'ACL closure changed unrelated privilege or cutover state';
  END IF;
END;
$test$;

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
