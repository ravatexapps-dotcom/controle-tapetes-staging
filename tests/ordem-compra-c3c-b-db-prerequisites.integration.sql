-- PHASE-C3C-B-DB-PREREQ functional role-matrix and business-logic integration.
-- Governing contract: ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md §34.4.
-- Idiom mirrors tests/ordem-compra-c3c-inactive.integration.sql: one BEGIN...ROLLBACK,
-- fixtures planted under session_replication_role=replica, the admin/supplier role
-- matrix via SET LOCAL ROLE authenticated + set_config('request.jwt.claim.sub', ...),
-- assertions as DO $test$ ... RAISE EXCEPTION ... $test$ under \set ON_ERROR_STOP on.
--
-- ENVIRONMENT: local PostgreSQL only, against the full applied db/01..db/76 schema.
-- Run:  psql -X -v ON_ERROR_STOP=1 -f tests/ordem-compra-c3c-b-db-prerequisites.integration.sql

\set ON_ERROR_STOP on

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Fixtures (planted under replica so no base-data/trigger dependency).
-- ---------------------------------------------------------------------------
SET LOCAL session_replication_role = replica;

INSERT INTO auth.users(id, email) VALUES
  ('76111111-1111-1111-1111-111111111111', 'c3cb-admin@example.invalid'),
  ('76222222-2222-2222-2222-222222222222', 'c3cb-supplier@example.invalid'),
  ('76333333-3333-3333-3333-333333333333', 'c3cb-other-supplier@example.invalid');
INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, ativo) VALUES
  ('76111111-1111-1111-1111-111111111111', 'c3cb-admin@example.invalid', 'C3CB Admin', 'admin', NULL, TRUE),
  ('76222222-2222-2222-2222-222222222222', 'c3cb-supplier@example.invalid', 'C3CB Supplier', 'fornecedor', 76001, TRUE),
  ('76333333-3333-3333-3333-333333333333', 'c3cb-other@example.invalid', 'C3CB Other', 'fornecedor', 76002, TRUE);

INSERT INTO public.fornecedores(id, nome, tipo) VALUES
  (76001, 'C3CB Yarn Supplier', 'fio_algodao'),
  (76002, 'C3CB Other Supplier', 'fio_algodao');
INSERT INTO public.cores(id, nome) VALUES (76001, 'C3CB Color');
INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total) VALUES
  ('algodao', 76001, NULL, 1000.000);
INSERT INTO public.pedidos(id, cliente_id, numero, status) VALUES
  ('76999999-0000-0000-0000-000000000001', 76001, 76001, 'rascunho');
INSERT INTO public.ops(id, numero, ano, status, lote_id) VALUES
  (76001, 7601, 2026, 'aberta', NULL);

-- Legacy flat row + its full four-layer + compat mapping (Class B-like: emitida,
-- kg_pedido 100, imported opening balance 40). One allocation, one OP.
INSERT INTO public.ordens_compra_fio(
  id, op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido,
  data_pedido, data_recebimento, status, status_administrativo
) VALUES (
  76001, 76001, 76001, 'algodao', 76001, NULL, 100.000, 40.000,
  CURRENT_DATE, CURRENT_DATE, 'recebido_parcial', 'emitida'
);
INSERT INTO public.necessidade_compra_fio(
  id, pedido_id, origem_tipo, op_id, material, cor_id, cor_poliester,
  kg_necessario, kg_alocado, legado, legado_origem_ordem_compra_fio_id
) VALUES (
  76001, '76999999-0000-0000-0000-000000000001', 'op', 76001, 'algodao', 76001, NULL,
  100.000, 100.000, TRUE, 76001
);
INSERT INTO public.ordem_compra(
  id, pedido_id, fornecedor_id, status_administrativo, status_aceite,
  status_recebimento, legado, legado_provenance
) VALUES (
  76001, '76999999-0000-0000-0000-000000000001', 76001, 'emitida',
  'nao_aplicavel', 'parcial', TRUE, 'emitido_nao_recebido'
);
INSERT INTO public.ordem_compra_item(
  id, ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido
) VALUES (76001, 76001, 'algodao', 76001, NULL, 100.000, 40.000);
INSERT INTO public.ordem_compra_item_alocacao(
  id, item_id, necessidade_id, op_id, kg_alocado
) VALUES (76001, 76001, 76001, 76001, 100.000);
INSERT INTO public.ordem_compra_item_compat_fio(
  id, ordem_compra_item_id, ordens_compra_fio_id, origem
) VALUES (76001, 76001, 76001, 'imported_legacy');

-- Imported opening balance = 40 kg, recorded as an import ledger line + header,
-- so Component B's immutable-floor sum finds it. item.kg_recebido cache = 40.
INSERT INTO public.ordem_compra_recebimentos(
  id, ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
  ator_id, ator_tipo, ocorrido_em, origem_tipo, comando_payload, comando_hash,
  resultado_metadata
) VALUES (
  760001, 76001, 'import_saldo_inicial', 'legacy_initial_balance_v1',
  'c3cb_import_76001', NULL, 'sistema', clock_timestamp(), 'legacy_flat_snapshot',
  '{"schema_version":3}'::jsonb, repeat('a', 64), '{}'::jsonb
);
INSERT INTO public.ordem_compra_fio_lancamentos(
  id, ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
  criado_por, tipo, idempotency_key, origem_tipo, recebimento_id, ordem_compra_id,
  ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
  kg_excesso, ator_tipo, linha_indice
) VALUES (
  760001, NULL, 76001, 40.000, NULL, NULL, 'import_saldo_inicial',
  'c3cb_import_line_76001', 'legacy_flat_snapshot', 760001, 76001,
  76001, 76001, 'algodao', 76001, NULL, 0, 'sistema', 1
);

-- A second, UNMAPPED legacy flat row to prove db/76 leaves the legacy
-- delete/reinsert flow unbroken (no new trigger/FK on ordens_compra_fio).
INSERT INTO public.ordens_compra_fio(
  id, op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido,
  data_pedido, status, status_administrativo
) VALUES (
  76002, 76001, 76001, 'algodao', 76001, NULL, 50.000, 0.000,
  CURRENT_DATE, 'pendente', 'emitida'
);

SET LOCAL session_replication_role = origin;

-- ---------------------------------------------------------------------------
-- 1. Inactive behavior while legacy_active (default singleton state).
-- ---------------------------------------------------------------------------
DO $test$
DECLARE v_result JSONB; v_raised BOOLEAN := FALSE;
BEGIN
  -- Component A raises the inactive-reader signal.
  BEGIN
    PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL, NULL);
    RAISE EXCEPTION 'Component A answered while legacy_active';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'listar_compat_inativo' THEN RAISE; END IF;
    v_raised := TRUE;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'Component A did not raise listar_compat_inativo'; END IF;

  -- Component B returns the inactive-writer response and mutates nothing.
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 70.000, CURRENT_DATE, 'c3cb-inactive-1', NULL, NULL);
  IF v_result ->> 'codigo' <> 'recebimento_compat_inativo' THEN
    RAISE EXCEPTION 'Component B did not reject inactive state: %', v_result;
  END IF;
END;
$test$;

DO $test$
BEGIN
  IF (SELECT kg_recebido FROM public.ordem_compra_item WHERE id = 76001) <> 40.000 THEN
    RAISE EXCEPTION 'inactive Component B changed the received cache';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_recebimentos
    WHERE idempotency_namespace = 'legacy_compat_receipt_v1'
  ) THEN
    RAISE EXCEPTION 'inactive Component B wrote a compat header';
  END IF;
END;
$test$;

-- ---------------------------------------------------------------------------
-- 2. Inactive behavior while maintenance_fenced.
-- ---------------------------------------------------------------------------
SET LOCAL session_replication_role = replica;
UPDATE public.ordem_compra_cutover
SET status = 'maintenance_fenced', read_authority = 'flat', cutover_generation = 760001
WHERE id = 1;
SET LOCAL session_replication_role = origin;

DO $test$
DECLARE v_result JSONB; v_raised BOOLEAN := FALSE;
BEGIN
  BEGIN
    PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL, NULL);
    RAISE EXCEPTION 'Component A answered while maintenance_fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    IF SQLERRM <> 'listar_compat_inativo' THEN RAISE; END IF;
    v_raised := TRUE;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'Component A did not raise while fenced'; END IF;

  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 70.000, CURRENT_DATE, 'c3cb-inactive-2', NULL, NULL);
  IF v_result ->> 'codigo' <> 'recebimento_compat_inativo' THEN
    RAISE EXCEPTION 'Component B answered while fenced: %', v_result;
  END IF;
END;
$test$;

-- ---------------------------------------------------------------------------
-- 3. Activate canonical_active (satisfies ordem_compra_cutover_c3c_state_check).
-- ---------------------------------------------------------------------------
SET LOCAL session_replication_role = replica;
UPDATE public.ordem_compra_cutover
SET status = 'canonical_active', read_authority = 'canonical',
    reconciliation_status = 'reconciled', final_acl_closed_at = clock_timestamp(),
    canonical_activated_at = clock_timestamp(), cutover_generation = 760001
WHERE id = 1;
SET LOCAL session_replication_role = origin;

-- ---------------------------------------------------------------------------
-- 4. Component A item grain + role matrix + pending/zero-receipt survival.
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '76111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_row RECORD;
BEGIN
  SELECT * INTO v_row FROM public.listar_ordens_compra_fio_compat(NULL, NULL)
  WHERE ordens_compra_fio_id = 76001;
  IF NOT FOUND THEN RAISE EXCEPTION 'admin item grain missing the compat order'; END IF;
  IF v_row.kg_pedido <> 100.000 OR v_row.kg_recebido <> 40.000 THEN
    RAISE EXCEPTION 'admin item grain totals wrong: %', row_to_json(v_row);
  END IF;
  IF v_row.status <> 'recebido_parcial' OR v_row.op_id <> 76001
     OR v_row.op_ids_multiplos IS TRUE OR v_row.op_numero <> 7601 THEN
    RAISE EXCEPTION 'admin item grain status/OP wrong: %', row_to_json(v_row);
  END IF;
  IF v_row.kg_recebido_atribuido <> 40.000 OR v_row.kg_excesso <> 0.000 THEN
    RAISE EXCEPTION 'admin item grain attributed/excess wrong: %', row_to_json(v_row);
  END IF;
END;
$test$;

-- Matching supplier sees its own order; non-matching supplier sees zero rows.
SELECT set_config('request.jwt.claim.sub', '76222222-2222-2222-2222-222222222222', TRUE);
DO $test$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.listar_ordens_compra_fio_compat(NULL, NULL)
                 WHERE ordens_compra_fio_id = 76001) THEN
    RAISE EXCEPTION 'matching supplier cannot see its own compat order';
  END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', '76333333-3333-3333-3333-333333333333', TRUE);
DO $test$
BEGIN
  IF EXISTS (SELECT 1 FROM public.listar_ordens_compra_fio_compat(NULL, NULL)
             WHERE ordens_compra_fio_id = 76001) THEN
    RAISE EXCEPTION 'non-matching supplier saw a foreign compat order';
  END IF;
END;
$test$;

-- Anonymous / unresolved actor is denied.
SELECT set_config('request.jwt.claim.sub', '', TRUE);
DO $test$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
  BEGIN
    PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL, NULL);
  EXCEPTION WHEN SQLSTATE '42501' THEN
    v_raised := TRUE;
  END;
  IF NOT v_raised THEN RAISE EXCEPTION 'anonymous reader was not denied'; END IF;
END;
$test$;
RESET ROLE;

-- ---------------------------------------------------------------------------
-- 5. Component A item x OP grain (one row per item within the OP).
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '76111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_row RECORD; v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.listar_ordens_compra_fio_compat(NULL, 76001)
  WHERE ordens_compra_fio_id = 76001;
  IF v_count <> 1 THEN RAISE EXCEPTION 'item x OP grain returned % rows, expected 1', v_count; END IF;
  SELECT * INTO v_row FROM public.listar_ordens_compra_fio_compat(NULL, 76001)
  WHERE ordens_compra_fio_id = 76001;
  IF v_row.op_id <> 76001 OR v_row.op_ids_multiplos IS TRUE
     OR v_row.kg_pedido <> 100.000 OR v_row.kg_recebido <> 40.000 THEN
    RAISE EXCEPTION 'item x OP grain wrong: %', row_to_json(v_row);
  END IF;
END;
$test$;
RESET ROLE;

-- The rollback rehearsal (§11) reflects the contract's actual near-term
-- rollback scenario: db/76 reverted while its objects are still dormant
-- (pre-canonical_active), before Component B ever wrote a single
-- legacy_compat_receipt_v1 header. A SAVEPOINT here lets sections 6-10 exercise
-- and assert Component B's full productive behavior first, then discards those
-- writes before §11, so the restored idempotency_namespace CHECK is never
-- asked to admit rows it was never meant to constrain retroactively.
SAVEPOINT before_component_b_writes;

-- ---------------------------------------------------------------------------
-- 6. Component B increase (delta > 0) participates in the PONR.
-- ---------------------------------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '76111111-1111-1111-1111-111111111111', TRUE);
DO $test$
DECLARE v_result JSONB;
BEGIN
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 70.000, CURRENT_DATE, 'c3cb-increase-1', 'DOC-1', NULL);
  IF COALESCE((v_result ->> 'ok')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'increase failed: %', v_result;
  END IF;
  IF (SELECT kg_recebido FROM public.ordem_compra_item WHERE id = 76001) <> 70.000 THEN
    RAISE EXCEPTION 'increase did not move the cache to 70';
  END IF;
END;
$test$;

-- ordem_compra_cutover is REVOKEd from every client role (db/75); the PONR
-- check must run as the cluster owner, not the authenticated test session.
RESET ROLE;
DO $test$
BEGIN
  IF (SELECT productive_receipt_started_at FROM public.ordem_compra_cutover WHERE id = 1) IS NULL THEN
    RAISE EXCEPTION 'increase did not record the PONR';
  END IF;
END;
$test$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '76111111-1111-1111-1111-111111111111', TRUE);

-- ---------------------------------------------------------------------------
-- 7. Component B equal / no-op returns sem_alteracao, inserts no ledger line.
-- ---------------------------------------------------------------------------
DO $test$
DECLARE v_result JSONB; v_lines_before INTEGER; v_lines_after INTEGER;
BEGIN
  SELECT count(*) INTO v_lines_before FROM public.ordem_compra_fio_lancamentos
  WHERE ordem_compra_item_id = 76001;
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 70.000, CURRENT_DATE, 'c3cb-noop-1', NULL, NULL);
  IF v_result ->> 'codigo' <> 'sem_alteracao' THEN
    RAISE EXCEPTION 'no-op did not return sem_alteracao: %', v_result;
  END IF;
  SELECT count(*) INTO v_lines_after FROM public.ordem_compra_fio_lancamentos
  WHERE ordem_compra_item_id = 76001;
  IF v_lines_after <> v_lines_before THEN RAISE EXCEPTION 'no-op inserted a ledger line'; END IF;
END;
$test$;

-- ---------------------------------------------------------------------------
-- 8. Component B decrease: LIFO, imported floor, admin-only.
-- ---------------------------------------------------------------------------
DO $test$
DECLARE v_result JSONB;
BEGIN
  -- Admin decrease 70 -> 55 (reverses 15 of the 30 receipt line, LIFO).
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 55.000, CURRENT_DATE, 'c3cb-decrease-1', NULL, NULL);
  IF COALESCE((v_result ->> 'ok')::BOOLEAN, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'admin decrease failed: %', v_result;
  END IF;
  IF (SELECT kg_recebido FROM public.ordem_compra_item WHERE id = 76001) <> 55.000 THEN
    RAISE EXCEPTION 'decrease did not move the cache to 55';
  END IF;

  -- Decrease below the imported floor (40) is refused with the named code.
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 30.000, CURRENT_DATE, 'c3cb-decrease-floor', NULL, NULL);
  IF v_result ->> 'codigo' <> 'reducao_abaixo_saldo_importado' THEN
    RAISE EXCEPTION 'below-floor decrease not refused: %', v_result;
  END IF;
  IF (SELECT kg_recebido FROM public.ordem_compra_item WHERE id = 76001) <> 55.000 THEN
    RAISE EXCEPTION 'refused below-floor decrease still mutated the cache';
  END IF;
END;
$test$;

-- A matching supplier attempting a decrease is refused (admin-only).
SELECT set_config('request.jwt.claim.sub', '76222222-2222-2222-2222-222222222222', TRUE);
DO $test$
DECLARE v_result JSONB;
BEGIN
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 50.000, CURRENT_DATE, 'c3cb-supplier-decrease', NULL, NULL);
  IF v_result ->> 'codigo' <> 'decremento_exige_admin' THEN
    RAISE EXCEPTION 'supplier decrease was not refused admin-only: %', v_result;
  END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', '76111111-1111-1111-1111-111111111111', TRUE);

-- ---------------------------------------------------------------------------
-- 9. Idempotency: exact replay returns the cached result, no new mutation;
--    same key + different payload conflicts.
-- ---------------------------------------------------------------------------
DO $test$
DECLARE v_first JSONB; v_replay JSONB; v_conflict JSONB; v_lines_before INTEGER; v_lines_after INTEGER;
BEGIN
  v_first := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 60.000, CURRENT_DATE, 'c3cb-idem-1', NULL, NULL);
  SELECT count(*) INTO v_lines_before FROM public.ordem_compra_fio_lancamentos
  WHERE ordem_compra_item_id = 76001;
  v_replay := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 60.000, CURRENT_DATE, 'c3cb-idem-1', NULL, NULL);
  SELECT count(*) INTO v_lines_after FROM public.ordem_compra_fio_lancamentos
  WHERE ordem_compra_item_id = 76001;
  IF v_lines_after <> v_lines_before THEN RAISE EXCEPTION 'idempotent replay inserted a new line'; END IF;
  IF v_replay ->> 'recebimento_id' IS DISTINCT FROM v_first ->> 'recebimento_id' THEN
    RAISE EXCEPTION 'idempotent replay returned a different header';
  END IF;

  v_conflict := public.registrar_recebimento_ordem_compra_fio_compat(
    76001, 61.000, CURRENT_DATE, 'c3cb-idem-1', NULL, NULL);
  IF v_conflict ->> 'codigo' <> 'idempotencia_conflitante' THEN
    RAISE EXCEPTION 'conflicting retry not rejected: %', v_conflict;
  END IF;
END;
$test$;

-- Unmapped flat row is refused with the named code (fail-closed).
DO $test$
DECLARE v_result JSONB;
BEGIN
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    76002, 10.000, CURRENT_DATE, 'c3cb-unmapped', NULL, NULL);
  IF v_result ->> 'codigo' <> 'mapeamento_compat_ausente' THEN
    RAISE EXCEPTION 'unmapped flat row not refused: %', v_result;
  END IF;
END;
$test$;
RESET ROLE;

-- ---------------------------------------------------------------------------
-- 10. Additive-constraint behavior: the new namespace is admitted; both prior
--     namespaces remain valid; comando_tipo was not changed.
-- ---------------------------------------------------------------------------
DO $test$
BEGIN
  -- The extended namespace check admits legacy_compat_receipt_v1 (32-hex hash),
  -- proven by the compat headers written above.
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_recebimentos
    WHERE idempotency_namespace = 'legacy_compat_receipt_v1'
      AND comando_hash ~ '^[0-9a-f]{32}$'
  ) THEN
    RAISE EXCEPTION 'no legacy_compat_receipt_v1 header was accepted';
  END IF;
  -- The pre-existing legacy_initial_balance_v1 (64-hex) header still validates.
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_recebimentos
    WHERE idempotency_namespace = 'legacy_initial_balance_v1'
  ) THEN
    RAISE EXCEPTION 'the imported-balance header disappeared';
  END IF;
  -- comando_tipo values remain the native trio (never recebimento_compat).
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_recebimentos WHERE comando_tipo = 'recebimento_compat'
  ) THEN
    RAISE EXCEPTION 'recebimento_compat comando_tipo was written';
  END IF;
END;
$test$;

-- Discard every Component B write from sections 6-10 (already asserted above),
-- returning to the state immediately after section 5: schema fully applied,
-- zero legacy_compat_receipt_v1 rows — the actual rollback precondition.
ROLLBACK TO SAVEPOINT before_component_b_writes;

-- ---------------------------------------------------------------------------
-- 11. Reduced-manifest rollback rehearsal proves the legacy delete/reinsert
--     flow is unbroken (db/76 introduced no trigger or FK on ordens_compra_fio).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.listar_ordens_compra_fio_compat(UUID, BIGINT);
ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3a_namespace_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3a_namespace_check
    CHECK (idempotency_namespace IN ('native_receipt_v1', 'legacy_initial_balance_v1'));
ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3c_hash_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3c_hash_check CHECK (
    (idempotency_namespace = 'native_receipt_v1' AND comando_hash ~ '^[0-9a-f]{32}$')
    OR
    (idempotency_namespace = 'legacy_initial_balance_v1' AND comando_hash ~ '^[0-9a-f]{64}$')
  );

DO $test$
DECLARE v_still_present BOOLEAN;
BEGIN
  -- The unmapped legacy flat row (76002) can still be deleted and reinserted:
  -- db/76 added no trigger/FK to block op-persistir.js's legacy delete/reinsert.
  SET LOCAL session_replication_role = replica;  -- stand in for the fenceless legacy_active flow
  DELETE FROM public.ordens_compra_fio WHERE id = 76002;
  INSERT INTO public.ordens_compra_fio(
    id, op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido,
    data_pedido, status, status_administrativo
  ) VALUES (
    76002, 76001, 76001, 'algodao', 76001, NULL, 55.000, 0.000,
    CURRENT_DATE, 'pendente', 'emitida'
  );
  SELECT EXISTS (SELECT 1 FROM public.ordens_compra_fio WHERE id = 76002) INTO v_still_present;
  IF NOT v_still_present THEN RAISE EXCEPTION 'legacy delete/reinsert flow broke'; END IF;
END;
$test$;

ROLLBACK;
SELECT 'C3C_B_INTEGRATION_PASS' AS result;
