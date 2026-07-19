-- PHASE-C3A-R1: initialize and protect the inactive cutover singleton.
-- Staging only. This migration does not activate a fence or expose a transition path.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

LOCK TABLE public.ordem_compra_cutover IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  v_row_count BIGINT;
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_import_headers BIGINT;
  v_import_entries BIGINT;
  v_native_commands BIGINT;
  v_baseline_rows BIGINT;
BEGIN
  SELECT count(*) INTO v_row_count
  FROM public.ordem_compra_cutover;

  SELECT count(*) INTO v_import_headers
  FROM public.ordem_compra_recebimentos
  WHERE idempotency_namespace = 'legacy_initial_balance_v1';

  SELECT count(*) INTO v_import_entries
  FROM public.ordem_compra_fio_lancamentos
  WHERE tipo = 'import_saldo_inicial';

  SELECT count(*) INTO v_native_commands
  FROM public.ordem_compra_recebimentos
  WHERE idempotency_namespace = 'native_receipt_v1';

  SELECT count(*) INTO v_baseline_rows
  FROM public.ordem_compra_cutover_inventory_baseline;

  IF v_row_count > 1 THEN
    RAISE EXCEPTION 'C3A-R1 conflict: expected at most one cutover row, found %', v_row_count;
  END IF;

  IF v_import_headers <> 0 OR v_import_entries <> 0 OR v_native_commands <> 0
     OR v_baseline_rows <> 0 THEN
    RAISE EXCEPTION
      'C3A-R1 conflict: initialization requires zero import headers (%), import entries (%), native commands (%), and baseline rows (%)',
      v_import_headers, v_import_entries, v_native_commands, v_baseline_rows;
  END IF;

  IF v_row_count = 0 THEN
    INSERT INTO public.ordem_compra_cutover(
      id,
      status,
      snapshot_hash,
      inventory_baseline_hash,
      reconciliation_status,
      productive_receipt_started_at,
      criado_em
    ) VALUES (
      1,
      'legacy_active',
      NULL,
      NULL,
      'not_started',
      NULL,
      now()
    );
  ELSE
    SELECT * INTO STRICT v_state
    FROM public.ordem_compra_cutover;

    IF v_state.id <> 1
       OR v_state.status <> 'legacy_active'
       OR v_state.snapshot_hash IS NOT NULL
       OR v_state.inventory_baseline_hash IS NOT NULL
       OR v_state.reconciliation_status <> 'not_started'
       OR v_state.productive_receipt_started_at IS NOT NULL THEN
      RAISE EXCEPTION
        'C3A-R1 conflict: existing cutover row is not the deterministic untouched legacy_active singleton';
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.ordem_compra_cutover'::regclass
      AND conname = 'ordem_compra_cutover_singleton_id'
  ) THEN
    ALTER TABLE public.ordem_compra_cutover
      ADD CONSTRAINT ordem_compra_cutover_singleton_id CHECK (id = 1);
  END IF;
END;
$$;

REVOKE ALL ON TABLE public.ordem_compra_cutover FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM authenticated;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_id_seq FROM anon;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_id_seq FROM service_role;

COMMENT ON CONSTRAINT ordem_compra_cutover_singleton_id
  ON public.ordem_compra_cutover IS
  'PHASE-C3A-R1 deterministic singleton identity. Future owner-controlled phases transition row id=1; they do not create another state row.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
