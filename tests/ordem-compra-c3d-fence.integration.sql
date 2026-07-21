-- tests/ordem-compra-c3d-fence.integration.sql
--
-- PHASE-C3D-C — Fence and pre-PONR rollback rehearsal.
-- Governing contract: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md
--   (§C C3D-C row, corrected §0 Findings 2 & 6; §G.5A/§G.5B evidence classes).
--
-- Idiom mirrors tests/ordem-compra-c3c-b-db-prerequisites.integration.sql:
-- fixtures planted under session_replication_role=replica, the admin/supplier
-- role matrix via SET LOCAL ROLE authenticated + set_config('request.jwt.claim.sub',
-- ...), assertions as DO $test$ ... RAISE EXCEPTION ... $test$ under
-- \set ON_ERROR_STOP on. Database-faithful proof only: no JavaScript,
-- browser, or PostgREST execution (§0 Finding 6).
--
-- ENVIRONMENT: local disposable PostgreSQL 18.4 only, against the full
-- applied db/01..db/76 schema, ALREADY carrying the classification-shape-only
-- synthetic 64-row ordens_compra_fio corpus (27 Class A / 12 Class B /
-- 13 Class C / 12 Class D; 51 mapped) loaded before db/67, and its reserved
-- synthetic identities:
--   ADMIN AUTH USER UUID:      00000000-0000-4000-8000-00000000c3a1
--   MATCHING SUPPLIER UUID:    00000000-0000-4000-8000-00000000c3b1
--   MATCHING FORNECEDOR ID:    930000301
--   TARGET FLAT ROW ID:        930000311 (fornecedor 930000301, kg_pedido
--                               15.500, one of the 51 mapped rows)
--   CUTOVER GENERATION:        930003001
-- The corpus/migration-sequencing itself is out of this file's scope (it must
-- exist before db/67 runs, which is before this file can even connect to a
-- schema that has these functions) — this file only creates the two auth
-- actor identities and one saldo_fios/saldo_fios_op fixture row apiece,
-- needed solely for its own actor-context and structural-fence probes.
--
-- Never connects to a remote or shared host; contains no credential, token,
-- or project URL. This sublot never crosses the point of no return: no
-- import, no read switch, no final ACL closure, no activation, no productive
-- receipt.
--
-- Run:  psql -X -v ON_ERROR_STOP=1 -f tests/ordem-compra-c3d-fence.integration.sql

\set ON_ERROR_STOP on
\timing off

\set admin_uuid '''00000000-0000-4000-8000-00000000c3a1'''
\set supplier_uuid '''00000000-0000-4000-8000-00000000c3b1'''

-- ===========================================================================
-- 0. Fixtures: the two synthetic actor identities + one saldo_fios/
--    saldo_fios_op row apiece (needed only so the later UPDATE/DELETE
--    structural probes on these two otherwise-empty tables have a real row
--    to affect — a zero-row UPDATE/DELETE never fires a BEFORE ROW trigger,
--    which would be a false pass, not a proof). Planted under replica so no
--    audit-trigger/base-data dependency; committed in autocommit (they must
--    outlive every later transaction in this file).
-- ===========================================================================
SET session_replication_role = replica;

INSERT INTO auth.users(id, email) VALUES
  (:admin_uuid, 'c3dc-admin@example.invalid'),
  (:supplier_uuid, 'c3dc-supplier@example.invalid');
INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id) VALUES
  (:admin_uuid, 'c3dc-admin@example.invalid', 'C3D-C Admin', 'admin', NULL),
  (:supplier_uuid, 'c3dc-supplier@example.invalid', 'C3D-C Supplier', 'fornecedor', 930000301);

INSERT INTO public.cores(id, nome) VALUES (930000301, 'C3D-C FENCE SYNTHETIC COLOR')
  ON CONFLICT DO NOTHING;
INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total) VALUES
  ('algodao', 930000301, NULL, 12.000);
INSERT INTO public.ops(id, numero, ano, status, tipo) VALUES
  (930000301, 930301, 2020, 'finalizada', 'tecelagem')
  ON CONFLICT DO NOTHING;
INSERT INTO public.saldo_fios_op(id, op_id, cor_id, cor_poliester, tipo, kg_sobra) VALUES
  (930000301, 930000301, 930000301, NULL, 'algodao', 3.000);

SET session_replication_role = origin;

DO $fx$
BEGIN
  IF (SELECT count(*) FROM public.ordens_compra_fio WHERE id = 930000311
        AND fornecedor_id = 930000301 AND kg_pedido >= 10.000) <> 1 THEN
    RAISE EXCEPTION 'FAIL[0/target]: target flat row 930000311 missing or does not satisfy fornecedor_id=930000301/kg_pedido>=10.000';
  END IF;
  IF (SELECT count(*) FROM public.ordem_compra_item_compat_fio WHERE ordens_compra_fio_id = 930000311) <> 1 THEN
    RAISE EXCEPTION 'FAIL[0/target]: target flat row 930000311 is not one of the 51 mapped rows';
  END IF;
  RAISE NOTICE 'PASS[0]: fixtures planted (2 synthetic actor identities, 1 saldo_fios row, 1 saldo_fios_op row); target row 930000311 confirmed mapped';
END
$fx$;

-- ===========================================================================
-- 1. Pre-fence authorization controls (admin, then matching supplier).
--    Each: rolled-back transaction, authenticated role + exact claim,
--    prove auth.uid() resolves, prove the exact real writer-shape UPDATE
--    affects exactly one row with no 42501/RLS/grant failure, roll back,
--    prove the target row returned byte-identical to its initial state.
-- ===========================================================================
DO $pf$
DECLARE v_before TEXT;
BEGIN
  SELECT ocf::text INTO v_before FROM public.ordens_compra_fio ocf WHERE id = 930000311;
  IF v_before IS NULL THEN RAISE EXCEPTION 'FAIL[1/setup]: target row missing before pre-fence controls'; END IF;
END
$pf$;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3a1', TRUE);
DO $pf_admin$
DECLARE v_uid UUID; v_rows INT;
BEGIN
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3a1'::uuid THEN
    RAISE EXCEPTION 'FAIL[1/admin]: auth.uid() resolved to % (expected admin)', v_uid;
  END IF;
  UPDATE public.ordens_compra_fio
  SET kg_recebido = 1.000, data_recebimento = DATE '2000-01-02', status = 'recebido_parcial'
  WHERE id = 930000311;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'FAIL[1/admin]: expected exactly 1 row affected, got %', v_rows; END IF;
  RAISE NOTICE 'PASS[1/admin]: authenticated admin (auth.uid()=%) updated exactly 1 row pre-fence, no 42501/RLS/grant failure', v_uid;
END
$pf_admin$;
RESET ROLE;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b1', TRUE);
DO $pf_supplier$
DECLARE v_uid UUID; v_rows INT;
BEGIN
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3b1'::uuid THEN
    RAISE EXCEPTION 'FAIL[1/supplier]: auth.uid() resolved to % (expected matching supplier)', v_uid;
  END IF;
  UPDATE public.ordens_compra_fio
  SET kg_recebido = 1.000, data_recebimento = DATE '2000-01-02', status = 'recebido_parcial'
  WHERE id = 930000311;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'FAIL[1/supplier]: expected exactly 1 row affected, got %', v_rows; END IF;
  RAISE NOTICE 'PASS[1/supplier]: authenticated matching-supplier (auth.uid()=%) updated exactly 1 row pre-fence, no 42501/RLS/grant failure', v_uid;
END
$pf_supplier$;
RESET ROLE;
ROLLBACK;

DO $pf_verify$
DECLARE v_status TEXT; v_kg_recebido NUMERIC; v_data_recebimento DATE;
BEGIN
  SELECT status, kg_recebido, data_recebimento INTO v_status, v_kg_recebido, v_data_recebimento
  FROM public.ordens_compra_fio WHERE id = 930000311;
  IF v_status <> 'pendente' OR v_kg_recebido IS NOT NULL OR v_data_recebimento IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[1/revert]: target row not byte-identical to initial state after rollback (status=%, kg_recebido=%, data_recebimento=%)',
      v_status, v_kg_recebido, v_data_recebimento;
  END IF;
  RAISE NOTICE 'PASS[1/revert]: target row 930000311 returned byte-identical to its initial state after both pre-fence rollbacks';
END
$pf_verify$;

-- ===========================================================================
-- 2. Fence entry.
-- ===========================================================================
DO $fe_initial$
DECLARE v_n INT; v_mapped INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover WHERE id = 1
      AND status = 'legacy_active' AND read_authority = 'flat'
      AND reconciliation_status = 'not_started' AND cutover_generation IS NULL
      AND snapshot_hash IS NULL AND inventory_baseline_hash IS NULL
      AND productive_receipt_started_at IS NULL AND canonical_activated_at IS NULL
      AND final_acl_closed_at IS NULL
  ) THEN
    RAISE EXCEPTION 'FAIL[2/initial]: cutover singleton is not the untouched legacy_active/flat/not_started/all-null row';
  END IF;
  SELECT count(*) INTO v_mapped FROM public.ordem_compra_item_compat_fio;
  IF v_mapped <> 51 THEN
    RAISE EXCEPTION 'FAIL[2/initial]: expected exactly 51 mapped synthetic rows, found %', v_mapped;
  END IF;
  RAISE NOTICE 'PASS[2/initial]: legacy_active/flat/not_started/all-null, exactly 51 mapped synthetic rows';
END
$fe_initial$;

DO $fe_lock$
DECLARE v_locked BOOLEAN;
BEGIN
  SELECT public.ordem_compra_c3c_acquire_session_lock(930003001) INTO v_locked;
  IF NOT v_locked THEN RAISE EXCEPTION 'FAIL[2/lock]: could not acquire session advisory lock for generation 930003001'; END IF;
  IF NOT public.ordem_compra_c3c_session_lock_held(930003001) THEN
    RAISE EXCEPTION 'FAIL[2/lock]: session_lock_held reports false immediately after acquisition';
  END IF;
  RAISE NOTICE 'PASS[2/lock]: session advisory lock for generation 930003001 acquired and held';
END
$fe_lock$;

DO $fe_call$
DECLARE v_result JSONB;
BEGIN
  SELECT public.ordem_compra_c3c_fence_and_snapshot(930003001) INTO v_result;
  IF COALESCE((v_result ->> 'ok')::boolean, FALSE) IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL[2/fence]: fence_and_snapshot did not return ok=true: %', v_result;
  END IF;
  RAISE NOTICE 'PASS[2/fence]: ordem_compra_c3c_fence_and_snapshot(930003001) => %', v_result;
END
$fe_call$;

DO $fe_verify$
DECLARE
  v_row public.ordem_compra_cutover%ROWTYPE;
  v_live_source_count INT;
  v_live_inventory_count INT;
BEGIN
  SELECT * INTO v_row FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_row.status <> 'maintenance_fenced' THEN RAISE EXCEPTION 'FAIL[2/verify]: status=% (expected maintenance_fenced)', v_row.status; END IF;
  IF v_row.read_authority <> 'flat' THEN RAISE EXCEPTION 'FAIL[2/verify]: read_authority=% (expected flat)', v_row.read_authority; END IF;
  IF v_row.reconciliation_status <> 'previewed' THEN RAISE EXCEPTION 'FAIL[2/verify]: reconciliation_status=% (expected previewed)', v_row.reconciliation_status; END IF;
  IF v_row.cutover_generation <> 930003001 THEN RAISE EXCEPTION 'FAIL[2/verify]: cutover_generation=% (expected 930003001)', v_row.cutover_generation; END IF;
  IF v_row.source_snapshot_count <> 51 THEN RAISE EXCEPTION 'FAIL[2/verify]: source_snapshot_count=% (expected 51)', v_row.source_snapshot_count; END IF;
  IF v_row.snapshot_hash IS NULL OR v_row.inventory_baseline_hash IS NULL THEN
    RAISE EXCEPTION 'FAIL[2/verify]: source/inventory hashes are null';
  END IF;
  IF v_row.productive_receipt_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[2/verify]: productive_receipt_started_at=% (expected NULL)', v_row.productive_receipt_started_at;
  END IF;
  IF NOT public.ordem_compra_c3c_session_lock_held(930003001) THEN
    RAISE EXCEPTION 'FAIL[2/verify]: session lock not held after fence_and_snapshot';
  END IF;

  SELECT count(*) INTO v_live_source_count FROM public.ordem_compra_cutover_source_snapshot;
  SELECT count(*) INTO v_live_inventory_count FROM public.ordem_compra_cutover_inventory_baseline;
  IF v_live_source_count <> v_row.source_snapshot_count THEN
    RAISE EXCEPTION 'FAIL[2/verify]: live source_snapshot row count % <> frozen source_snapshot_count %', v_live_source_count, v_row.source_snapshot_count;
  END IF;
  IF v_live_inventory_count <> v_row.inventory_baseline_count THEN
    RAISE EXCEPTION 'FAIL[2/verify]: live inventory_baseline row count % <> frozen inventory_baseline_count %', v_live_inventory_count, v_row.inventory_baseline_count;
  END IF;

  RAISE NOTICE 'PASS[2/verify]: maintenance_fenced/flat/previewed/930003001, source_snapshot_count=51, hashes non-null, PONR NULL, session lock held, live source/inventory fingerprints match frozen counts';
END
$fe_verify$;

-- ===========================================================================
-- 3. Evidence Class 5A — authenticated actor-context fence proof
--    (database-faithful; no JavaScript/PostgREST/browser execution).
-- ===========================================================================
DO $fp_capture$
DECLARE v_fp TEXT;
BEGIN
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_fp FROM (
    SELECT 'cutover=' || md5(c::text) AS f FROM public.ordem_compra_cutover c WHERE c.id = 1
    UNION ALL SELECT 'snapshot_hash=' || COALESCE(snapshot_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'inventory_hash=' || COALESCE(inventory_baseline_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'ordens_compra_fio=' || count(*) || ':' || COALESCE(md5(string_agg(id::text||status||COALESCE(kg_recebido::text,''), ',' ORDER BY id)),'') FROM public.ordens_compra_fio
    UNION ALL SELECT 'ordem_compra=' || count(*) FROM public.ordem_compra
    UNION ALL SELECT 'ordem_compra_item=' || count(*) FROM public.ordem_compra_item
    UNION ALL SELECT 'alocacao=' || count(*) FROM public.ordem_compra_item_alocacao
    UNION ALL SELECT 'compat_fio=' || count(*) FROM public.ordem_compra_item_compat_fio
    UNION ALL SELECT 'necessidade=' || count(*) FROM public.necessidade_compra_fio
    UNION ALL SELECT 'saldo_fios=' || count(*) || ':' || COALESCE(md5(string_agg(kg_total::text, ',' ORDER BY cor_id)),'') FROM public.saldo_fios
    UNION ALL SELECT 'saldo_fios_op=' || count(*) || ':' || COALESCE(md5(string_agg(kg_sobra::text, ',' ORDER BY id)),'') FROM public.saldo_fios_op
    UNION ALL SELECT 'recebimentos=' || count(*) FROM public.ordem_compra_recebimentos
    UNION ALL SELECT 'lancamentos=' || count(*) FROM public.ordem_compra_fio_lancamentos
    UNION ALL SELECT 'movimentos=' || count(*) FROM public.ordem_compra_fio_movimentos_estoque
  ) s;
  -- No ON COMMIT DROP: each top-level statement in this autocommit script is
  -- its own transaction, so an ON COMMIT DROP temp table would vanish before
  -- the next statement could read it. A session-scoped TEMP table already
  -- disappears at disconnect, which is all the isolation this needs.
  CREATE TEMP TABLE c3dc_fp (label TEXT PRIMARY KEY, fp TEXT);
  INSERT INTO c3dc_fp VALUES ('pre_5a', v_fp);
END
$fp_capture$;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3a1', TRUE);
DO $ev5a_admin$
DECLARE v_uid UUID; v_msg TEXT; v_caught BOOLEAN := FALSE;
BEGIN
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3a1'::uuid THEN
    RAISE EXCEPTION 'FAIL[3/admin]: auth.uid() resolved to % before the probe', v_uid;
  END IF;
  BEGIN
    UPDATE public.ordens_compra_fio
    SET kg_recebido = 1.000, data_recebimento = DATE '2000-01-02', status = 'recebido_parcial'
    WHERE id = 930000311;
    RAISE EXCEPTION 'FAIL[3/admin]: admin UPDATE succeeded while maintenance_fenced';
  EXCEPTION
    WHEN SQLSTATE '55000' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg <> 'legacy_receipt_fenced' THEN
        RAISE EXCEPTION 'FAIL[3/admin]: 55000 with unexpected message "%"', v_msg;
      END IF;
      v_caught := TRUE;
    WHEN SQLSTATE '42501' THEN
      RAISE EXCEPTION 'FAIL[3/admin]: got 42501 permission/RLS error instead of the 55000 fence';
  END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[3/admin]: legacy_receipt_fenced was not raised'; END IF;
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3a1'::uuid THEN
    RAISE EXCEPTION 'FAIL[3/admin]: auth.uid() resolved to % after the caught exception (expected admin still)', v_uid;
  END IF;
  RAISE NOTICE 'PASS[3/admin]: authenticated admin (auth.uid()=%) denied with exact legacy_receipt_fenced/55000; no 42501; auth.uid() still resolves', v_uid;
END
$ev5a_admin$;
RESET ROLE;
ROLLBACK;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b1', TRUE);
DO $ev5a_supplier$
DECLARE v_uid UUID; v_msg TEXT; v_caught BOOLEAN := FALSE;
BEGIN
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3b1'::uuid THEN
    RAISE EXCEPTION 'FAIL[3/supplier]: auth.uid() resolved to % before the probe', v_uid;
  END IF;
  BEGIN
    UPDATE public.ordens_compra_fio
    SET kg_recebido = 1.000, data_recebimento = DATE '2000-01-02', status = 'recebido_parcial'
    WHERE id = 930000311;
    RAISE EXCEPTION 'FAIL[3/supplier]: matching-supplier UPDATE succeeded while maintenance_fenced';
  EXCEPTION
    WHEN SQLSTATE '55000' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg <> 'legacy_receipt_fenced' THEN
        RAISE EXCEPTION 'FAIL[3/supplier]: 55000 with unexpected message "%"', v_msg;
      END IF;
      v_caught := TRUE;
    WHEN SQLSTATE '42501' THEN
      RAISE EXCEPTION 'FAIL[3/supplier]: got 42501 permission/RLS error instead of the 55000 fence';
  END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[3/supplier]: legacy_receipt_fenced was not raised'; END IF;
  SELECT auth.uid() INTO v_uid;
  IF v_uid <> '00000000-0000-4000-8000-00000000c3b1'::uuid THEN
    RAISE EXCEPTION 'FAIL[3/supplier]: auth.uid() resolved to % after the caught exception (expected matching supplier still)', v_uid;
  END IF;
  RAISE NOTICE 'PASS[3/supplier]: authenticated matching-supplier (auth.uid()=%) denied with exact legacy_receipt_fenced/55000; no 42501; auth.uid() still resolves', v_uid;
END
$ev5a_supplier$;
RESET ROLE;
ROLLBACK;

DO $fp_verify_5a$
DECLARE v_before TEXT; v_after TEXT;
BEGIN
  SELECT fp INTO v_before FROM c3dc_fp WHERE label = 'pre_5a';
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_after FROM (
    SELECT 'cutover=' || md5(c::text) AS f FROM public.ordem_compra_cutover c WHERE c.id = 1
    UNION ALL SELECT 'snapshot_hash=' || COALESCE(snapshot_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'inventory_hash=' || COALESCE(inventory_baseline_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'ordens_compra_fio=' || count(*) || ':' || COALESCE(md5(string_agg(id::text||status||COALESCE(kg_recebido::text,''), ',' ORDER BY id)),'') FROM public.ordens_compra_fio
    UNION ALL SELECT 'ordem_compra=' || count(*) FROM public.ordem_compra
    UNION ALL SELECT 'ordem_compra_item=' || count(*) FROM public.ordem_compra_item
    UNION ALL SELECT 'alocacao=' || count(*) FROM public.ordem_compra_item_alocacao
    UNION ALL SELECT 'compat_fio=' || count(*) FROM public.ordem_compra_item_compat_fio
    UNION ALL SELECT 'necessidade=' || count(*) FROM public.necessidade_compra_fio
    UNION ALL SELECT 'saldo_fios=' || count(*) || ':' || COALESCE(md5(string_agg(kg_total::text, ',' ORDER BY cor_id)),'') FROM public.saldo_fios
    UNION ALL SELECT 'saldo_fios_op=' || count(*) || ':' || COALESCE(md5(string_agg(kg_sobra::text, ',' ORDER BY id)),'') FROM public.saldo_fios_op
    UNION ALL SELECT 'recebimentos=' || count(*) FROM public.ordem_compra_recebimentos
    UNION ALL SELECT 'lancamentos=' || count(*) FROM public.ordem_compra_fio_lancamentos
    UNION ALL SELECT 'movimentos=' || count(*) FROM public.ordem_compra_fio_movimentos_estoque
  ) s;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'FAIL[3/mutation]: a fingerprint changed across Evidence 5A. before=[%] after=[%]', v_before, v_after;
  END IF;
  INSERT INTO c3dc_fp VALUES ('post_5a', v_after);
  RAISE NOTICE 'PASS[3/mutation]: zero mutation across Evidence 5A (source/inventory hashes and every business fingerprint unchanged)';
END
$fp_verify_5a$;

-- ===========================================================================
-- 4. Evidence Class 5B — eight-table structural fence (8 tables x 3 ops =
--    24 controlled probes, owner-level, each in its own savepoint).
-- ===========================================================================
DO $trg_shape$
DECLARE v_tbl TEXT; v_def TEXT;
        v_guarded TEXT[] := ARRAY[
          'ordens_compra_fio', 'ordem_compra_item_compat_fio', 'necessidade_compra_fio',
          'ordem_compra_item_alocacao', 'ordem_compra_item', 'ordem_compra',
          'saldo_fios', 'saldo_fios_op'];
BEGIN
  FOREACH v_tbl IN ARRAY v_guarded LOOP
    SELECT pg_get_triggerdef(t.oid) INTO v_def
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_tbl
      AND t.tgname = 'trg_c3c_protected_mutation_guard' AND NOT t.tgisinternal;
    IF v_def IS NULL THEN
      RAISE EXCEPTION 'FAIL[4/shape]: trg_c3c_protected_mutation_guard missing on %', v_tbl;
    END IF;
    IF v_def NOT LIKE '%BEFORE%' OR v_def NOT LIKE '%INSERT%' OR v_def NOT LIKE '%UPDATE%'
       OR v_def NOT LIKE '%DELETE%' OR v_def NOT LIKE '%FOR EACH ROW%' THEN
      RAISE EXCEPTION 'FAIL[4/shape]: % guard is not installed as BEFORE INSERT OR UPDATE OR DELETE FOR EACH ROW (got: %)', v_tbl, v_def;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS[4/shape]: all eight guards installed as BEFORE INSERT OR UPDATE OR DELETE';
END
$trg_shape$;

DO $probes$
DECLARE
  v_msg TEXT;
  v_n INT := 0;
BEGIN
  -- ordens_compra_fio (target row exists: 930000311)
  BEGIN
    INSERT INTO public.ordens_compra_fio DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.ordens_compra_fio SET kg_pedido = kg_pedido WHERE id = 930000311;
    RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.ordens_compra_fio WHERE id = 930000311;
    RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordens_compra_fio/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- ordem_compra_item_compat_fio (51 real mapped rows)
  BEGIN
    INSERT INTO public.ordem_compra_item_compat_fio DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/compat_fio/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/compat_fio/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.ordem_compra_item_compat_fio SET ordens_compra_fio_id = ordens_compra_fio_id WHERE ordens_compra_fio_id = 930000311;
    RAISE EXCEPTION 'FAIL[4/compat_fio/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/compat_fio/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.ordem_compra_item_compat_fio WHERE ordens_compra_fio_id = 930000311;
    RAISE EXCEPTION 'FAIL[4/compat_fio/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/compat_fio/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- necessidade_compra_fio (64 real rows)
  BEGIN
    INSERT INTO public.necessidade_compra_fio DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/necessidade/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/necessidade/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.necessidade_compra_fio SET kg_alocado = kg_alocado
    WHERE id = (SELECT id FROM public.necessidade_compra_fio ORDER BY id LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/necessidade/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/necessidade/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.necessidade_compra_fio
    WHERE id = (SELECT id FROM public.necessidade_compra_fio ORDER BY id LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/necessidade/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/necessidade/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- ordem_compra_item_alocacao (51 real rows). DEFAULT VALUES cannot be used
  -- here: two other BEFORE triggers (alocacao_origem_guard,
  -- alocacao_rascunho_guard) fire first alphabetically and require a
  -- consistent, rascunho-status parent order, or they raise their own
  -- (non-fence) error before trg_c3c_protected_mutation_guard ever runs. A
  -- minimal row cloned from a real rascunho-status (Class D) allocation
  -- satisfies both upstream guards so the fence guard is the one that denies.
  BEGIN
    INSERT INTO public.ordem_compra_item_alocacao (item_id, necessidade_id, op_id, kg_alocado)
    SELECT a.item_id, a.necessidade_id, a.op_id, a.kg_alocado
    FROM public.ordem_compra_item_alocacao a
    JOIN public.ordem_compra_item i ON i.id = a.item_id
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE oc.status_administrativo = 'rascunho'
    LIMIT 1;
    RAISE EXCEPTION 'FAIL[4/alocacao/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/alocacao/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  -- UPDATE/DELETE target a rascunho-status (Class D) row for the same
  -- upstream-guard reason as the INSERT probe above.
  BEGIN
    UPDATE public.ordem_compra_item_alocacao SET id = id
    WHERE id = (
      SELECT a.id FROM public.ordem_compra_item_alocacao a
      JOIN public.ordem_compra_item i ON i.id = a.item_id
      JOIN public.ordem_compra oc ON oc.id = i.ordem_id
      WHERE oc.status_administrativo = 'rascunho' LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/alocacao/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/alocacao/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.ordem_compra_item_alocacao
    WHERE id = (
      SELECT a.id FROM public.ordem_compra_item_alocacao a
      JOIN public.ordem_compra_item i ON i.id = a.item_id
      JOIN public.ordem_compra oc ON oc.id = i.ordem_id
      WHERE oc.status_administrativo = 'rascunho' LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/alocacao/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/alocacao/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- ordem_compra_item (51 real rows). DEFAULT VALUES cannot be used here:
  -- item_quantidade_rascunho_guard fires first alphabetically and requires
  -- the parent order to be rascunho-status, or it raises its own (non-fence)
  -- error before trg_c3c_protected_mutation_guard ever runs. A minimal row
  -- cloned from a real rascunho-status (Class D) item satisfies that
  -- upstream guard so the fence guard is the one that denies.
  BEGIN
    INSERT INTO public.ordem_compra_item (ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido)
    SELECT i.ordem_id, i.material, i.cor_id, i.cor_poliester, i.kg_pedido, i.kg_recebido
    FROM public.ordem_compra_item i
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE oc.status_administrativo = 'rascunho'
    LIMIT 1;
    RAISE EXCEPTION 'FAIL[4/item/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/item/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  -- UPDATE/DELETE target a rascunho-status (Class D) row for the same
  -- upstream-guard reason as the INSERT probe above.
  BEGIN
    UPDATE public.ordem_compra_item SET id = id
    WHERE id = (
      SELECT i2.id FROM public.ordem_compra_item i2
      JOIN public.ordem_compra oc2 ON oc2.id = i2.ordem_id
      WHERE oc2.status_administrativo = 'rascunho' LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/item/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/item/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.ordem_compra_item
    WHERE id = (
      SELECT i2.id FROM public.ordem_compra_item i2
      JOIN public.ordem_compra oc2 ON oc2.id = i2.ordem_id
      WHERE oc2.status_administrativo = 'rascunho' LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/item/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/item/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- ordem_compra (51 real rows)
  BEGIN
    INSERT INTO public.ordem_compra DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/ordem_compra/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordem_compra/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.ordem_compra SET id = id
    WHERE id = (SELECT id FROM public.ordem_compra ORDER BY id LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/ordem_compra/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordem_compra/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.ordem_compra
    WHERE id = (SELECT id FROM public.ordem_compra ORDER BY id LIMIT 1);
    RAISE EXCEPTION 'FAIL[4/ordem_compra/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/ordem_compra/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- saldo_fios (1 fixture row; internal trigger-depth exception structurally
  -- requires pg_trigger_depth() > 1 AND status = canonical_active — this is a
  -- direct depth-1 owner probe, so it must be denied, proving the direct
  -- fence path independent of that internal exception).
  BEGIN
    INSERT INTO public.saldo_fios DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/saldo_fios/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.saldo_fios SET kg_total = kg_total WHERE cor_id = 930000301 AND tipo = 'algodao';
    RAISE EXCEPTION 'FAIL[4/saldo_fios/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.saldo_fios WHERE cor_id = 930000301 AND tipo = 'algodao';
    RAISE EXCEPTION 'FAIL[4/saldo_fios/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  -- saldo_fios_op (1 fixture row; same internal-exception disposition as saldo_fios).
  BEGIN
    INSERT INTO public.saldo_fios_op DEFAULT VALUES;
    RAISE EXCEPTION 'FAIL[4/saldo_fios_op/INSERT]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios_op/INSERT]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    UPDATE public.saldo_fios_op SET kg_sobra = kg_sobra WHERE id = 930000301;
    RAISE EXCEPTION 'FAIL[4/saldo_fios_op/UPDATE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios_op/UPDATE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;
  BEGIN
    DELETE FROM public.saldo_fios_op WHERE id = 930000301;
    RAISE EXCEPTION 'FAIL[4/saldo_fios_op/DELETE]: not fenced';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[4/saldo_fios_op/DELETE]: unexpected message "%"', v_msg; END IF;
    v_n := v_n + 1;
  END;

  IF v_n <> 24 THEN
    RAISE EXCEPTION 'FAIL[4/count]: expected exactly 24 controlled probes to pass, got %', v_n;
  END IF;
  RAISE NOTICE 'PASS[4]: all 24 structural probes (8 tables x 3 operations) returned exact legacy_receipt_fenced/55000';
END
$probes$;

-- Internal trigger-depth exception (saldo_fios/saldo_fios_op): the guard's
-- own source (db/75) requires BOTH pg_trigger_depth() > 1 AND
-- status = canonical_active to pass a nested write through. This sublot
-- never reaches canonical_active (no import/read-switch/activation is
-- authorized), so no real nested call site exists to exercise that path
-- without fabricating a SECURITY DEFINER function whose sole purpose would
-- be to synthesize a depth>1 caller — which is explicitly prohibited. The
-- direct depth-1 denial is proven above (24-probe matrix); the legitimate
-- nested-path runtime is out of scope here and belongs to PHASE-C3D-E.
DO $depth_note$
BEGIN
  RAISE NOTICE 'NOTE[4/depth]: internal trigger-depth exception (pg_trigger_depth()>1 AND status=canonical_active) requires a real nested canonical-active call site not reachable pre-PONR; direct depth-1 denial proven above; nested-path runtime deferred to PHASE-C3D-E, not claimed as covered here';
END
$depth_note$;

DO $fp_verify_5b$
DECLARE v_before TEXT; v_after TEXT;
BEGIN
  SELECT fp INTO v_before FROM c3dc_fp WHERE label = 'post_5a';
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_after FROM (
    SELECT 'cutover=' || md5(c::text) AS f FROM public.ordem_compra_cutover c WHERE c.id = 1
    UNION ALL SELECT 'snapshot_hash=' || COALESCE(snapshot_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'inventory_hash=' || COALESCE(inventory_baseline_hash,'') FROM public.ordem_compra_cutover WHERE id = 1
    UNION ALL SELECT 'ordens_compra_fio=' || count(*) || ':' || COALESCE(md5(string_agg(id::text||status||COALESCE(kg_recebido::text,''), ',' ORDER BY id)),'') FROM public.ordens_compra_fio
    UNION ALL SELECT 'ordem_compra=' || count(*) FROM public.ordem_compra
    UNION ALL SELECT 'ordem_compra_item=' || count(*) FROM public.ordem_compra_item
    UNION ALL SELECT 'alocacao=' || count(*) FROM public.ordem_compra_item_alocacao
    UNION ALL SELECT 'compat_fio=' || count(*) FROM public.ordem_compra_item_compat_fio
    UNION ALL SELECT 'necessidade=' || count(*) FROM public.necessidade_compra_fio
    UNION ALL SELECT 'saldo_fios=' || count(*) || ':' || COALESCE(md5(string_agg(kg_total::text, ',' ORDER BY cor_id)),'') FROM public.saldo_fios
    UNION ALL SELECT 'saldo_fios_op=' || count(*) || ':' || COALESCE(md5(string_agg(kg_sobra::text, ',' ORDER BY id)),'') FROM public.saldo_fios_op
    UNION ALL SELECT 'recebimentos=' || count(*) FROM public.ordem_compra_recebimentos
    UNION ALL SELECT 'lancamentos=' || count(*) FROM public.ordem_compra_fio_lancamentos
    UNION ALL SELECT 'movimentos=' || count(*) FROM public.ordem_compra_fio_movimentos_estoque
  ) s;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'FAIL[4/mutation]: a fingerprint changed across the 24-probe matrix. before=[%] after=[%]', v_before, v_after;
  END IF;
  INSERT INTO c3dc_fp VALUES ('post_5b', v_after);
  RAISE NOTICE 'PASS[4/mutation]: zero mutation across the 24-probe matrix (source/inventory hashes and every business fingerprint unchanged)';
END
$fp_verify_5b$;

-- ===========================================================================
-- 5. Pre-PONR rollback rehearsal.
-- ===========================================================================

-- 5.A: entry fence state already proven in section 2 (maintenance_fenced /
-- flat / previewed, PONR NULL, session lock held, frozen snapshots intact —
-- re-confirmed unchanged by section 4's fingerprint proof).

-- 5.B: test-only pre-PONR post-read-switch fixture. The exact real
-- historical import totals are unavailable to this synthetic corpus; this is
-- NOT a claim of real import/reconciliation. Owner-level, minimum valid
-- state only.
DO $grant_policy_capture$
DECLARE v_fp TEXT;
BEGIN
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_fp FROM (
    SELECT 'policy=' || p.polrelid::regclass::text || '|' || p.polname || '|' || p.polcmd::text || '|'
           || COALESCE(pg_get_expr(p.polqual, p.polrelid), '') || '|'
           || COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') AS f
    FROM pg_policy p
    WHERE p.polrelid = ANY (ARRAY[
      'public.ordens_compra_fio','public.ordem_compra_item_compat_fio','public.necessidade_compra_fio',
      'public.ordem_compra_item_alocacao','public.ordem_compra_item','public.ordem_compra',
      'public.saldo_fios','public.saldo_fios_op','public.ordem_compra_cutover']::regclass[])
    UNION ALL
    SELECT 'grant=' || table_name || '|' || grantee || '|' || privilege_type
    FROM information_schema.role_table_grants
    WHERE table_name IN ('ordens_compra_fio','ordem_compra_item_compat_fio','necessidade_compra_fio',
      'ordem_compra_item_alocacao','ordem_compra_item','ordem_compra','saldo_fios','saldo_fios_op','ordem_compra_cutover')
  ) s;
  CREATE TEMP TABLE c3dc_gp (label TEXT PRIMARY KEY, fp TEXT);
  INSERT INTO c3dc_gp VALUES ('pre_rollback', v_fp);
END
$grant_policy_capture$;

DO $ponr_fixture$
DECLARE v_rows INT;
BEGIN
  UPDATE public.ordem_compra_cutover
  SET read_authority = 'canonical', reconciliation_status = 'reconciled'
  WHERE id = 1 AND status = 'maintenance_fenced' AND cutover_generation = 930003001
    AND productive_receipt_started_at IS NULL AND canonical_activated_at IS NULL
    AND final_acl_closed_at IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'FAIL[5/fixture]: test-only pre-PONR fixture update affected % rows (expected 1)', v_rows; END IF;
  RAISE NOTICE 'PASS[5/fixture]: test-only pre-PONR fixture applied (read_authority=canonical, reconciliation_status=reconciled, productive_receipt_started_at/canonical_activated_at/final_acl_closed_at remain NULL)';
END
$ponr_fixture$;

-- 5.C: invoke rollback.
DO $rollback_call$
BEGIN
  PERFORM public.ordem_compra_c3c_pre_ponr_rollback(930003001);
  RAISE NOTICE 'PASS[5/call]: ordem_compra_c3c_pre_ponr_rollback(930003001) returned without error';
END
$rollback_call$;

DO $rollback_verify$
DECLARE
  v_row public.ordem_compra_cutover%ROWTYPE;
  v_source_count INT;
  v_inventory_count INT;
  v_gp_after TEXT;
  v_gp_before TEXT;
BEGIN
  SELECT * INTO v_row FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_row.status <> 'maintenance_fenced' THEN RAISE EXCEPTION 'FAIL[5/verify]: status=% (expected maintenance_fenced)', v_row.status; END IF;
  IF v_row.read_authority <> 'flat' THEN RAISE EXCEPTION 'FAIL[5/verify]: read_authority=% (expected flat)', v_row.read_authority; END IF;
  IF v_row.canonical_activated_at IS NOT NULL THEN RAISE EXCEPTION 'FAIL[5/verify]: canonical_activated_at=% (expected NULL)', v_row.canonical_activated_at; END IF;
  IF v_row.productive_receipt_started_at IS NOT NULL THEN RAISE EXCEPTION 'FAIL[5/verify]: productive_receipt_started_at=% (expected NULL)', v_row.productive_receipt_started_at; END IF;
  IF v_row.cutover_generation <> 930003001 THEN RAISE EXCEPTION 'FAIL[5/verify]: cutover_generation=% (expected 930003001)', v_row.cutover_generation; END IF;
  IF v_row.status = 'legacy_active' THEN RAISE EXCEPTION 'FAIL[5/verify]: status regressed to legacy_active (never permitted)'; END IF;

  SELECT count(*) INTO v_source_count FROM public.ordem_compra_cutover_source_snapshot;
  SELECT count(*) INTO v_inventory_count FROM public.ordem_compra_cutover_inventory_baseline;
  IF v_source_count <> v_row.source_snapshot_count THEN
    RAISE EXCEPTION 'FAIL[5/verify]: source_snapshot rows % <> frozen count %', v_source_count, v_row.source_snapshot_count;
  END IF;
  IF v_inventory_count <> v_row.inventory_baseline_count THEN
    RAISE EXCEPTION 'FAIL[5/verify]: inventory_baseline rows % <> frozen count %', v_inventory_count, v_row.inventory_baseline_count;
  END IF;

  SELECT fp INTO v_gp_before FROM c3dc_gp WHERE label = 'pre_rollback';
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_gp_after FROM (
    SELECT 'policy=' || p.polrelid::regclass::text || '|' || p.polname || '|' || p.polcmd::text || '|'
           || COALESCE(pg_get_expr(p.polqual, p.polrelid), '') || '|'
           || COALESCE(pg_get_expr(p.polwithcheck, p.polrelid), '') AS f
    FROM pg_policy p
    WHERE p.polrelid = ANY (ARRAY[
      'public.ordens_compra_fio','public.ordem_compra_item_compat_fio','public.necessidade_compra_fio',
      'public.ordem_compra_item_alocacao','public.ordem_compra_item','public.ordem_compra',
      'public.saldo_fios','public.saldo_fios_op','public.ordem_compra_cutover']::regclass[])
    UNION ALL
    SELECT 'grant=' || table_name || '|' || grantee || '|' || privilege_type
    FROM information_schema.role_table_grants
    WHERE table_name IN ('ordens_compra_fio','ordem_compra_item_compat_fio','necessidade_compra_fio',
      'ordem_compra_item_alocacao','ordem_compra_item','ordem_compra','saldo_fios','saldo_fios_op','ordem_compra_cutover')
  ) s;
  IF v_gp_after IS DISTINCT FROM v_gp_before THEN
    RAISE EXCEPTION 'FAIL[5/verify]: effective grants/policies changed across the rollback (before=[%] after=[%])', v_gp_before, v_gp_after;
  END IF;

  RAISE NOTICE 'PASS[5/verify]: maintenance_fenced/flat, canonical_activated_at/productive_receipt_started_at NULL, cutover_generation=930003001, snapshot/inventory rows and grants/policies byte-identical, no legacy_active regression';
END
$rollback_verify$;

DO $direct_write_still_fenced$
DECLARE v_msg TEXT; v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN
    UPDATE public.ordens_compra_fio SET kg_pedido = kg_pedido WHERE id = 930000311;
    RAISE EXCEPTION 'FAIL[5/still-fenced]: direct protected-table write succeeded after rollback';
  EXCEPTION WHEN SQLSTATE '55000' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'legacy_receipt_fenced' THEN RAISE EXCEPTION 'FAIL[5/still-fenced]: unexpected message "%"', v_msg; END IF;
    v_caught := TRUE;
  END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[5/still-fenced]: legacy_receipt_fenced not raised after rollback'; END IF;
  RAISE NOTICE 'PASS[5/still-fenced]: direct protected-table writes remain fenced after the rollback';
END
$direct_write_still_fenced$;

-- ===========================================================================
-- 6. Lock release and backend-idle proof.
-- ===========================================================================
DO $lock_release$
DECLARE v_released BOOLEAN;
BEGIN
  SELECT public.ordem_compra_c3c_release_session_lock(930003001) INTO v_released;
  IF NOT v_released THEN RAISE EXCEPTION 'FAIL[6/release]: release_session_lock returned false'; END IF;
  IF public.ordem_compra_c3c_session_lock_held(930003001) THEN
    RAISE EXCEPTION 'FAIL[6/release]: session_lock_held still true after release';
  END IF;
  RAISE NOTICE 'PASS[6/release]: advisory lock for generation 930003001 released';
END
$lock_release$;

DO $lock_final$
DECLARE v_n INT;
BEGIN
  SELECT count(*) INTO v_n FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid();
  IF v_n <> 0 THEN RAISE EXCEPTION 'FAIL[6/final]: % advisory lock(s) leaked', v_n; END IF;
  RAISE NOTICE 'PASS[6/final]: zero leaked advisory lock; this script issues no unterminated BEGIN, so no open transaction is left by the test backend';
END
$lock_final$;

SELECT 'C3D_C_FENCE_INTEGRATION_PASS' AS result;
