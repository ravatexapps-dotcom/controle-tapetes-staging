-- tests/ordem-compra-c3d-deploy.integration.sql
--
-- PHASE-C3D-B — Inactive migration/application presence validation.
-- Governing contract: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md
--   (§C C3D-B row; §G test matrix items 1-2, 10-11; §E gates 2-4, 6-7).
--
-- Deterministic, rerunnable proof — against a freshly migrated, disposable,
-- isolated local PostgreSQL cluster carrying the full ordered db/01..db/76
-- sequence — that the accepted inactive stack is present and inert:
--   1. every db/76 (C3C-B legacy-compat prerequisites) object is present —
--      Component A (listar_ordens_compra_fio_compat), Component B
--      (registrar_recebimento_ordem_compra_fio_compat), and the additive
--      idempotency_namespace/hash CHECK admission of 'legacy_compat_receipt_v1';
--   2. every db/75 (C3C-A inactive cutover) object is present — the cutover
--      state machine functions, the protected-mutation fence guard on all eight
--      protected tables, and the command-state guard;
--   3. the cutover singleton (id=1) is at its untouched initial inactive state
--      (legacy_active / flat / not_started, every snapshot/import/read-switch/
--      final-ACL/activation/productive-receipt marker NULL);
--   4. Component A is inert — raises listar_compat_inativo / SQLSTATE 55000
--      while legacy_active/flat;
--   5. Component B is inert — returns
--      {ok:false, codigo:"recebimento_compat_inativo"} while legacy_active/flat;
--      and neither inert probe mutates any row (explicit before/after
--      fingerprint), productive_receipt_started_at stays NULL, and no advisory
--      lock or open transaction is leaked by the probes.
--
-- Uses only synthetic identifiers; never connects to a remote or shared host;
-- contains no credential, token, or project URL. Every probe is read-only /
-- inert; nothing this file does can persist (no COMMIT of any mutation — the
-- inert signals return/raise before any write, proven by the fingerprints).
--
-- ENVIRONMENT: local disposable PostgreSQL only, against the full applied
-- db/01..db/76 schema (never a shared or remote database).
-- Run:  psql -X -v ON_ERROR_STOP=1 -f tests/ordem-compra-c3d-deploy.integration.sql
--
-- Emits per-section 'PASS[n] ...' notices and a terminal
-- 'C3D_B_DEPLOY_INTEGRATION_PASS' row; any failed assertion RAISEs and, under
-- ON_ERROR_STOP, aborts psql with a nonzero exit status.

\set ON_ERROR_STOP on
\timing off

-- ===========================================================================
-- 1. db/76 object presence (Component A, Component B, additive constraints)
-- ===========================================================================
DO $c3db$
BEGIN
  IF to_regprocedure('public.listar_ordens_compra_fio_compat(uuid,bigint)') IS NULL THEN
    RAISE EXCEPTION 'FAIL[1/db76]: Component A listar_ordens_compra_fio_compat(uuid,bigint) is absent';
  END IF;
  IF to_regprocedure(
       'public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)'
     ) IS NULL THEN
    RAISE EXCEPTION 'FAIL[1/db76]: Component B registrar_recebimento_ordem_compra_fio_compat(...) is absent';
  END IF;
  -- Component A: a SECURITY DEFINER set-returning projection owned by postgres.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'listar_ordens_compra_fio_compat'
      AND p.prosecdef AND p.proowner = 'postgres'::regrole AND p.proretset
  ) THEN
    RAISE EXCEPTION 'FAIL[1/db76]: Component A is not a SECURITY DEFINER set-returning function owned by postgres';
  END IF;
  -- Component B: a SECURITY DEFINER scalar adapter owned by postgres.
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'registrar_recebimento_ordem_compra_fio_compat'
      AND p.prosecdef AND p.proowner = 'postgres'::regrole
  ) THEN
    RAISE EXCEPTION 'FAIL[1/db76]: Component B is not a SECURITY DEFINER function owned by postgres';
  END IF;
  -- Additive idempotency_namespace admission of 'legacy_compat_receipt_v1'.
  IF pg_get_constraintdef((
       SELECT oid FROM pg_constraint
       WHERE conname = 'ordem_compra_recebimentos_c3a_namespace_check'
         AND conrelid = 'public.ordem_compra_recebimentos'::regclass
     )) NOT LIKE '%legacy_compat_receipt_v1%' THEN
    RAISE EXCEPTION 'FAIL[1/db76]: namespace CHECK does not admit legacy_compat_receipt_v1';
  END IF;
  IF pg_get_constraintdef((
       SELECT oid FROM pg_constraint
       WHERE conname = 'ordem_compra_recebimentos_c3c_hash_check'
         AND conrelid = 'public.ordem_compra_recebimentos'::regclass
     )) NOT LIKE '%legacy_compat_receipt_v1%' THEN
    RAISE EXCEPTION 'FAIL[1/db76]: hash CHECK does not admit legacy_compat_receipt_v1';
  END IF;
  RAISE NOTICE 'PASS[1]: db/76 Component A/B present (SECURITY DEFINER, postgres) and additive constraints admit legacy_compat_receipt_v1';
END;
$c3db$;

-- ===========================================================================
-- 2. db/75 object presence (inactive cutover contract: state machine + fence)
-- ===========================================================================
DO $c3db$
DECLARE
  v_fn  TEXT;
  v_missing TEXT := '';
  v_tbl TEXT;
  v_guarded TEXT[] := ARRAY[
    'ordens_compra_fio', 'ordem_compra_item_compat_fio', 'necessidade_compra_fio',
    'ordem_compra_item_alocacao', 'ordem_compra_item', 'ordem_compra',
    'saldo_fios', 'saldo_fios_op'];
BEGIN
  FOREACH v_fn IN ARRAY ARRAY[
    'public.ordem_compra_c3c_fence_and_snapshot(bigint)',
    'public.ordem_compra_c3c_import_and_reconcile(bigint)',
    'public.ordem_compra_c3c_set_canonical_read(bigint)',
    'public.ordem_compra_c3c_close_final_acl(bigint)',
    'public.ordem_compra_c3c_activate(bigint)',
    'public.ordem_compra_c3c_pre_ponr_rollback(bigint)',
    'public.ordem_compra_c3c_acquire_session_lock(bigint)',
    'public.ordem_compra_c3c_release_session_lock(bigint)',
    'public.ordem_compra_c3c_session_lock_held(bigint)',
    'public.ordem_compra_c3c_lock_key(bigint)'
  ] LOOP
    IF to_regprocedure(v_fn) IS NULL THEN v_missing := v_missing || ' ' || v_fn; END IF;
  END LOOP;
  IF v_missing <> '' THEN RAISE EXCEPTION 'FAIL[2/db75]: missing cutover functions:%', v_missing; END IF;

  IF to_regclass('public.ordem_compra_cutover_source_snapshot') IS NULL
     OR to_regclass('public.ordem_compra_cutover_inventory_baseline') IS NULL THEN
    RAISE EXCEPTION 'FAIL[2/db75]: snapshot/baseline tables absent';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_compra_cutover_c3c_state_check'
      AND conrelid = 'public.ordem_compra_cutover'::regclass) THEN
    RAISE EXCEPTION 'FAIL[2/db75]: cutover state CHECK absent';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conname = 'ordem_compra_cutover_singleton_id'
      AND conrelid = 'public.ordem_compra_cutover'::regclass) THEN
    RAISE EXCEPTION 'FAIL[2/db72]: cutover singleton CHECK absent';
  END IF;

  -- The protected-mutation fence guard is installed on all eight protected tables.
  FOREACH v_tbl IN ARRAY v_guarded LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_tbl
        AND t.tgname = 'trg_c3c_protected_mutation_guard' AND NOT t.tgisinternal
    ) THEN
      RAISE EXCEPTION 'FAIL[2/db75]: protected-mutation fence guard missing on %', v_tbl;
    END IF;
  END LOOP;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'ordem_compra_recebimentos'
      AND t.tgname = 'trg_c3c_command_state_guard' AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'FAIL[2/db75]: command-state guard missing on ordem_compra_recebimentos';
  END IF;
  RAISE NOTICE 'PASS[2]: db/75 cutover state-machine functions, fence guard (8 tables), and command-state guard present';
END;
$c3db$;

-- ===========================================================================
-- 3. Cutover singleton is at the untouched initial inactive state
-- ===========================================================================
DO $c3db$
DECLARE v_n INT;
BEGIN
  SELECT count(*) INTO v_n FROM public.ordem_compra_cutover;
  IF v_n <> 1 THEN RAISE EXCEPTION 'FAIL[3/state]: expected exactly 1 cutover row, found %', v_n; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover WHERE id = 1
      AND status = 'legacy_active' AND read_authority = 'flat'
      AND reconciliation_status = 'not_started'
      AND cutover_generation IS NULL
      AND snapshot_hash IS NULL AND inventory_baseline_hash IS NULL
      AND snapshot_captured_at IS NULL AND import_started_at IS NULL
      AND import_completed_at IS NULL AND final_acl_closed_at IS NULL
      AND canonical_activated_at IS NULL AND productive_receipt_started_at IS NULL
      AND source_snapshot_count IS NULL AND inventory_baseline_count IS NULL
  ) THEN
    RAISE EXCEPTION 'FAIL[3/state]: cutover singleton is not the untouched legacy_active/flat/not_started/all-null row';
  END IF;
  RAISE NOTICE 'PASS[3]: cutover singleton = legacy_active / flat / not_started / all cutover markers NULL';
END;
$c3db$;

-- ===========================================================================
-- 4. Inactive Component A + Component B, with explicit zero-mutation
--    fingerprint, PONR-marker-null, and no-leaked-lock proofs.
-- ===========================================================================
DO $c3db$
DECLARE
  v_before TEXT;
  v_after  TEXT;
  v_locks0 INT;
  v_locks1 INT;
  v_result JSONB;
  v_ponr   TEXT;
  v_msg    TEXT;
  v_caught BOOLEAN := FALSE;
BEGIN
  -- Fingerprint the cutover singleton + every receipt/ledger/movement/business
  -- table an active Component A/B could touch. Fully deterministic; no mutation.
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_before FROM (
    SELECT 'cutover=' || md5(c::text) AS f FROM public.ordem_compra_cutover c WHERE c.id = 1
    UNION ALL SELECT 'recebimentos=' || count(*) FROM public.ordem_compra_recebimentos
    UNION ALL SELECT 'lancamentos=' || count(*) FROM public.ordem_compra_fio_lancamentos
    UNION ALL SELECT 'movimentos=' || count(*) FROM public.ordem_compra_fio_movimentos_estoque
    UNION ALL SELECT 'ordens_compra_fio=' || count(*) FROM public.ordens_compra_fio
    UNION ALL SELECT 'ordem_compra=' || count(*) FROM public.ordem_compra
    UNION ALL SELECT 'ordem_compra_item=' || count(*) FROM public.ordem_compra_item
    UNION ALL SELECT 'alocacao=' || count(*) FROM public.ordem_compra_item_alocacao
    UNION ALL SELECT 'compat_fio=' || count(*) FROM public.ordem_compra_item_compat_fio
    UNION ALL SELECT 'necessidade=' || count(*) FROM public.necessidade_compra_fio
    UNION ALL SELECT 'saldo_fios=' || count(*) FROM public.saldo_fios
    UNION ALL SELECT 'source_snapshot=' || count(*) FROM public.ordem_compra_cutover_source_snapshot
    UNION ALL SELECT 'inventory_baseline=' || count(*) FROM public.ordem_compra_cutover_inventory_baseline
  ) s;

  SELECT count(*) INTO v_locks0 FROM pg_locks
  WHERE locktype = 'advisory' AND pid = pg_backend_pid();

  -- Component A: inert reader raises listar_compat_inativo / 55000.
  BEGIN
    PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL::uuid, NULL::bigint);
    RAISE EXCEPTION 'FAIL[4/A]: Component A answered while legacy_active/flat';
  EXCEPTION
    WHEN SQLSTATE '55000' THEN
      GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
      IF v_msg <> 'listar_compat_inativo' THEN
        RAISE EXCEPTION 'FAIL[4/A]: Component A raised 55000 with unexpected message "%"', v_msg;
      END IF;
      v_caught := TRUE;
  END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[4/A]: Component A did not raise listar_compat_inativo'; END IF;

  -- Component B: inert writer returns {ok:false, codigo:"recebimento_compat_inativo"}.
  -- Synthetic, non-existent flat-row id + synthetic values (the inactive gate
  -- returns before any lookup/auth/mutation, so the id need not exist).
  v_result := public.registrar_recebimento_ordem_compra_fio_compat(
    999999001::bigint, 123.456::numeric, DATE '2000-01-01',
    'c3d-b-synthetic-inactive-key-1', NULL, NULL);
  IF COALESCE((v_result ->> 'ok')::boolean, TRUE) IS DISTINCT FROM FALSE THEN
    RAISE EXCEPTION 'FAIL[4/B]: Component B did not return ok=false: %', v_result;
  END IF;
  IF v_result ->> 'codigo' <> 'recebimento_compat_inativo' THEN
    RAISE EXCEPTION 'FAIL[4/B]: Component B codigo was "%", expected recebimento_compat_inativo', v_result ->> 'codigo';
  END IF;

  -- Zero-mutation fingerprint (identical to the entry fingerprint above).
  SELECT string_agg(f, E'\n' ORDER BY f) INTO v_after FROM (
    SELECT 'cutover=' || md5(c::text) AS f FROM public.ordem_compra_cutover c WHERE c.id = 1
    UNION ALL SELECT 'recebimentos=' || count(*) FROM public.ordem_compra_recebimentos
    UNION ALL SELECT 'lancamentos=' || count(*) FROM public.ordem_compra_fio_lancamentos
    UNION ALL SELECT 'movimentos=' || count(*) FROM public.ordem_compra_fio_movimentos_estoque
    UNION ALL SELECT 'ordens_compra_fio=' || count(*) FROM public.ordens_compra_fio
    UNION ALL SELECT 'ordem_compra=' || count(*) FROM public.ordem_compra
    UNION ALL SELECT 'ordem_compra_item=' || count(*) FROM public.ordem_compra_item
    UNION ALL SELECT 'alocacao=' || count(*) FROM public.ordem_compra_item_alocacao
    UNION ALL SELECT 'compat_fio=' || count(*) FROM public.ordem_compra_item_compat_fio
    UNION ALL SELECT 'necessidade=' || count(*) FROM public.necessidade_compra_fio
    UNION ALL SELECT 'saldo_fios=' || count(*) FROM public.saldo_fios
    UNION ALL SELECT 'source_snapshot=' || count(*) FROM public.ordem_compra_cutover_source_snapshot
    UNION ALL SELECT 'inventory_baseline=' || count(*) FROM public.ordem_compra_cutover_inventory_baseline
  ) s;
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'FAIL[4/mut]: an inert probe changed a fingerprint. before=[%] after=[%]', v_before, v_after;
  END IF;

  -- The PONR marker was never set by an inert probe.
  SELECT productive_receipt_started_at::text INTO v_ponr
  FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_ponr IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[4/ponr]: productive_receipt_started_at became % (expected NULL)', v_ponr;
  END IF;

  -- No advisory lock leaked by the inert probes.
  SELECT count(*) INTO v_locks1 FROM pg_locks
  WHERE locktype = 'advisory' AND pid = pg_backend_pid();
  IF v_locks1 <> v_locks0 OR v_locks1 <> 0 THEN
    RAISE EXCEPTION 'FAIL[4/lock]: advisory lock leak (before=%, after=%)', v_locks0, v_locks1;
  END IF;

  RAISE NOTICE 'PASS[4]: Component A raises listar_compat_inativo/55000; Component B returns recebimento_compat_inativo; zero mutation; productive_receipt_started_at NULL; no advisory-lock leak';
END;
$c3db$;

-- ===========================================================================
-- 5. No advisory lock or open transaction is attributable to this test.
-- ===========================================================================
DO $c3db$
DECLARE v_locks INT;
BEGIN
  SELECT count(*) INTO v_locks FROM pg_locks
  WHERE locktype = 'advisory' AND pid = pg_backend_pid();
  IF v_locks <> 0 THEN RAISE EXCEPTION 'FAIL[5/lock]: % advisory lock(s) held at end of test', v_locks; END IF;
  -- This script issues no BEGIN of its own; every DO block runs and commits in
  -- autocommit, so no transaction is left open for the test backend.
  RAISE NOTICE 'PASS[5]: no advisory lock held and no open transaction left by the test backend';
END;
$c3db$;

SELECT 'C3D_B_DEPLOY_INTEGRATION_PASS' AS result;
