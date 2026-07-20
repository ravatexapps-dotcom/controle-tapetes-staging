-- PHASE-C3C-A: inactive database implementation of the accepted Phase-C3
-- cutover contract. Applying this migration preserves legacy_active, flat
-- read authority, legacy grants, and every productive legacy behavior.
-- Snapshot, import, fence, reader switch, final ACL closure, and activation
-- are installed owner-only for later, separately authorized invocation.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

ALTER TABLE public.ordem_compra_cutover
  ADD COLUMN IF NOT EXISTS read_authority TEXT NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS cutover_generation BIGINT,
  ADD COLUMN IF NOT EXISTS source_snapshot_count INTEGER,
  ADD COLUMN IF NOT EXISTS source_snapshot_total_kg NUMERIC(15,3),
  ADD COLUMN IF NOT EXISTS source_snapshot_serialization TEXT,
  ADD COLUMN IF NOT EXISTS inventory_baseline_count INTEGER,
  ADD COLUMN IF NOT EXISTS inventory_baseline_total_kg NUMERIC(15,3),
  ADD COLUMN IF NOT EXISTS inventory_baseline_serialization TEXT,
  ADD COLUMN IF NOT EXISTS snapshot_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS import_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS import_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_acl_closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canonical_activated_at TIMESTAMPTZ;

ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_comando_hash_check,
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3c_hash_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3c_hash_check CHECK (
    (idempotency_namespace = 'native_receipt_v1' AND comando_hash ~ '^[0-9a-f]{32}$')
    OR
    (idempotency_namespace = 'legacy_initial_balance_v1' AND comando_hash ~ '^[0-9a-f]{64}$')
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.ordem_compra_cutover'::regclass
      AND conname = 'ordem_compra_cutover_c3c_state_check'
  ) THEN
    ALTER TABLE public.ordem_compra_cutover
      ADD CONSTRAINT ordem_compra_cutover_c3c_state_check CHECK (
        read_authority IN ('flat', 'canonical')
        AND (cutover_generation IS NULL OR cutover_generation > 0)
        AND (
          status <> 'legacy_active'
          OR (
            read_authority = 'flat'
            AND cutover_generation IS NULL
            AND snapshot_hash IS NULL
            AND inventory_baseline_hash IS NULL
            AND snapshot_captured_at IS NULL
            AND import_started_at IS NULL
            AND import_completed_at IS NULL
            AND final_acl_closed_at IS NULL
            AND canonical_activated_at IS NULL
            AND productive_receipt_started_at IS NULL
          )
        )
        AND (status <> 'canonical_active' OR (
          read_authority = 'canonical'
          AND reconciliation_status = 'reconciled'
          AND final_acl_closed_at IS NOT NULL
          AND canonical_activated_at IS NOT NULL
        ))
        AND (productive_receipt_started_at IS NULL OR read_authority = 'canonical')
      );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.ordem_compra_cutover_source_snapshot (
  id BIGSERIAL PRIMARY KEY,
  cutover_id BIGINT NOT NULL REFERENCES public.ordem_compra_cutover(id) ON DELETE RESTRICT,
  stable_position INTEGER NOT NULL CHECK (stable_position > 0),
  mapping_id BIGINT NOT NULL,
  flat_row_id BIGINT NOT NULL,
  ordem_compra_id BIGINT NOT NULL,
  item_id BIGINT NOT NULL,
  allocation_id BIGINT NOT NULL,
  necessidade_id BIGINT NOT NULL,
  op_id BIGINT,
  legacy_class TEXT NOT NULL CHECK (legacy_class IN ('A', 'B', 'D')),
  material TEXT NOT NULL CHECK (material IN ('algodao', 'poliester')),
  cor_id BIGINT,
  cor_poliester TEXT,
  kg_pedido NUMERIC(12,3) NOT NULL CHECK (kg_pedido >= 0),
  kg_recebido NUMERIC(12,3) NOT NULL CHECK (kg_recebido >= 0),
  kg_atribuido NUMERIC(12,3) NOT NULL CHECK (kg_atribuido >= 0),
  kg_excesso NUMERIC(12,3) NOT NULL CHECK (kg_excesso >= 0),
  canonical_line TEXT NOT NULL,
  row_sha256 TEXT NOT NULL CHECK (row_sha256 ~ '^[0-9a-f]{64}$'),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (kg_atribuido + kg_excesso = kg_recebido),
  CHECK ((material = 'algodao' AND cor_id IS NOT NULL AND cor_poliester IS NULL)
      OR (material = 'poliester' AND cor_id IS NULL AND cor_poliester IS NOT NULL)),
  UNIQUE (cutover_id, stable_position),
  UNIQUE (cutover_id, mapping_id),
  UNIQUE (cutover_id, flat_row_id)
);
ALTER TABLE public.ordem_compra_cutover_source_snapshot ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ordem_compra_cutover_inventory_baseline
  ADD COLUMN IF NOT EXISTS stable_position INTEGER,
  ADD COLUMN IF NOT EXISTS canonical_line TEXT,
  ADD COLUMN IF NOT EXISTS row_sha256 TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_cutover_inventory_baseline_position
  ON public.ordem_compra_cutover_inventory_baseline(cutover_id, stable_position)
  WHERE stable_position IS NOT NULL;

REVOKE ALL ON TABLE public.ordem_compra_cutover_source_snapshot FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_source_snapshot_id_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.ordem_compra_cutover_inventory_baseline FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_inventory_baseline_id_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_cutover_id_seq FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_c3c_protected_mutation_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state TEXT;
BEGIN
  SELECT status INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_state IS NULL OR v_state = 'legacy_active' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_TABLE_NAME = 'ordem_compra_item' THEN
    IF TG_OP = 'UPDATE'
       AND pg_trigger_depth() > 1
       AND NEW.id IS NOT DISTINCT FROM OLD.id
       AND NEW.ordem_id IS NOT DISTINCT FROM OLD.ordem_id
       AND NEW.material IS NOT DISTINCT FROM OLD.material
       AND NEW.cor_id IS NOT DISTINCT FROM OLD.cor_id
       AND NEW.cor_poliester IS NOT DISTINCT FROM OLD.cor_poliester
       AND NEW.kg_pedido IS NOT DISTINCT FROM OLD.kg_pedido THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'legacy_receipt_fenced' USING ERRCODE = '55000';
  END IF;

  IF TG_TABLE_NAME = 'ordem_compra' THEN
    IF TG_OP = 'UPDATE'
       AND pg_trigger_depth() > 1
       AND NEW.id IS NOT DISTINCT FROM OLD.id
       AND NEW.pedido_id IS NOT DISTINCT FROM OLD.pedido_id
       AND NEW.fornecedor_id IS NOT DISTINCT FROM OLD.fornecedor_id
       AND NEW.status_administrativo IS NOT DISTINCT FROM OLD.status_administrativo
       AND NEW.status_aceite IS NOT DISTINCT FROM OLD.status_aceite
       AND NEW.legado IS NOT DISTINCT FROM OLD.legado THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'legacy_receipt_fenced' USING ERRCODE = '55000';
  END IF;

  IF TG_TABLE_NAME IN ('saldo_fios', 'saldo_fios_op') THEN
    IF pg_trigger_depth() > 1 AND v_state = 'canonical_active' THEN
      RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;
    RAISE EXCEPTION 'legacy_receipt_fenced' USING ERRCODE = '55000';
  END IF;

  RAISE EXCEPTION 'legacy_receipt_fenced' USING ERRCODE = '55000';
END;
$$;
REVOKE ALL ON FUNCTION public.trg_c3c_protected_mutation_guard() FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'ordens_compra_fio', 'ordem_compra_item_compat_fio',
    'necessidade_compra_fio', 'ordem_compra_item_alocacao',
    'ordem_compra_item', 'ordem_compra', 'saldo_fios', 'saldo_fios_op'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_c3c_protected_mutation_guard ON public.%I', v_table);
    EXECUTE format(
      'CREATE TRIGGER trg_c3c_protected_mutation_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.trg_c3c_protected_mutation_guard()',
      v_table
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_c3c_command_state_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000';
  END IF;
  IF NEW.comando_tipo = 'import_saldo_inicial' THEN
    IF v_state.status <> 'maintenance_fenced'
       OR v_state.read_authority <> 'flat'
       OR v_state.productive_receipt_started_at IS NOT NULL THEN
      RAISE EXCEPTION 'importacao_canonica_inativa' USING ERRCODE = '55000';
    END IF;
  ELSIF v_state.status <> 'canonical_active' OR v_state.read_authority <> 'canonical' THEN
    RAISE EXCEPTION 'recebimento_canonico_inativo' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.trg_c3c_command_state_guard() FROM PUBLIC, anon, authenticated, service_role;
DROP TRIGGER IF EXISTS trg_c3c_command_state_guard ON public.ordem_compra_recebimentos;
CREATE TRIGGER trg_c3c_command_state_guard
  BEFORE INSERT ON public.ordem_compra_recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_c3c_command_state_guard();

DO $$
BEGIN
  IF to_regprocedure('public._c3c_registrar_recebimento_impl(bigint,text,timestamptz,text,text,text,jsonb)') IS NULL THEN
    ALTER FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB)
      RENAME TO _c3c_registrar_recebimento_impl;
  END IF;
  IF to_regprocedure('public._c3c_estornar_recebimento_impl(bigint,text,timestamptz,text,jsonb)') IS NULL THEN
    ALTER FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB)
      RENAME TO _c3c_estornar_recebimento_impl;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._c3c_registrar_recebimento_impl(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public._c3c_estornar_recebimento_impl(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_recebimento_ordem_compra(
  p_ordem_id BIGINT, p_idempotency_key TEXT, p_ocorrido_em TIMESTAMPTZ,
  p_documento_ref TEXT, p_origem_tipo TEXT, p_origem_ref TEXT, p_linhas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1 FOR UPDATE;
  IF NOT FOUND OR v_state.status <> 'canonical_active' OR v_state.read_authority <> 'canonical' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'recebimento_canonico_inativo', 'erro', 'Canonical receipt is inactive');
  END IF;
  v_result := public._c3c_registrar_recebimento_impl(
    p_ordem_id, p_idempotency_key, p_ocorrido_em, p_documento_ref,
    p_origem_tipo, p_origem_ref, p_linhas
  );
  IF COALESCE((v_result ->> 'ok')::BOOLEAN, FALSE) THEN
    UPDATE public.ordem_compra_cutover
    SET productive_receipt_started_at = COALESCE(productive_receipt_started_at, clock_timestamp())
    WHERE id = 1;
  END IF;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.estornar_recebimento_ordem_compra(
  p_ordem_id BIGINT, p_idempotency_key TEXT, p_ocorrido_em TIMESTAMPTZ,
  p_motivo TEXT, p_linhas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF NOT FOUND OR v_state.status <> 'canonical_active' OR v_state.read_authority <> 'canonical' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'recebimento_canonico_inativo', 'erro', 'Canonical reversal is inactive');
  END IF;
  RETURN public._c3c_estornar_recebimento_impl(
    p_ordem_id, p_idempotency_key, p_ocorrido_em, p_motivo, p_linhas
  );
END;
$$;

ALTER FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) OWNER TO postgres;
ALTER FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.listar_recebimentos_ordem_compra_normalizados(
  p_pedido_id UUID DEFAULT NULL, p_op_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  recebimento_id BIGINT, lancamento_id BIGINT, ordem_compra_id BIGINT,
  ordem_compra_item_id BIGINT, allocation_id BIGINT, pedido_id UUID,
  fornecedor_id BIGINT, op_id BIGINT, origem_tipo TEXT, material TEXT,
  cor_id BIGINT, cor_poliester TEXT, kg_recebido_atribuido NUMERIC,
  kg_excesso NUMERIC, tipo TEXT, estorno_de_id BIGINT, ocorrido_em TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supplier_id BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover
    WHERE id = 1 AND read_authority = 'canonical'
  ) THEN
    RAISE EXCEPTION 'canonical_reader_inactive' USING ERRCODE = '55000';
  END IF;
  IF NOT public.is_admin() THEN
    SELECT fornecedor_id INTO v_supplier_id
    FROM public.usuarios
    WHERE id = auth.uid() AND tipo = 'fornecedor' AND ativo = TRUE;
    IF v_supplier_id IS NULL THEN
      RAISE EXCEPTION 'sem_permissao' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN QUERY
  SELECT h.id, l.id, h.ordem_compra_id, l.ordem_compra_item_id,
         l.ordem_compra_item_alocacao_id, o.pedido_id, o.fornecedor_id,
         l.op_id,
         CASE WHEN l.ordem_compra_item_alocacao_id IS NULL THEN 'excesso'
              ELSE n.origem_tipo END,
         l.material, l.cor_id, l.cor_poliester,
         CASE WHEN l.ordem_compra_item_alocacao_id IS NOT NULL THEN l.kg_recebido ELSE 0::NUMERIC END,
         CASE WHEN l.ordem_compra_item_alocacao_id IS NULL THEN l.kg_recebido ELSE 0::NUMERIC END,
         l.tipo, l.estorno_de_id, h.ocorrido_em
  FROM public.ordem_compra_recebimentos h
  JOIN public.ordem_compra_fio_lancamentos l ON l.recebimento_id = h.id
  JOIN public.ordem_compra o ON o.id = h.ordem_compra_id
  LEFT JOIN public.ordem_compra_item_alocacao a ON a.id = l.ordem_compra_item_alocacao_id
  LEFT JOIN public.necessidade_compra_fio n ON n.id = a.necessidade_id
  WHERE (p_pedido_id IS NULL OR o.pedido_id = p_pedido_id)
    AND (p_op_id IS NULL OR l.op_id = p_op_id)
    AND (public.is_admin() OR o.fornecedor_id = v_supplier_id)
  ORDER BY h.id, l.linha_indice, l.id;
END;
$$;
ALTER FUNCTION public.listar_recebimentos_ordem_compra_normalizados(UUID, BIGINT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.listar_recebimentos_ordem_compra_normalizados(UUID, BIGINT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.listar_recebimentos_ordem_compra_normalizados(UUID, BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_lock_key(p_generation BIGINT)
RETURNS BIGINT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT hashtextextended('ordem_compra_c3c|' || p_generation::TEXT, 0)
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_lock_key(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_session_lock_held(p_generation BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_locks
    WHERE locktype = 'advisory' AND pid = pg_backend_pid() AND granted
      AND classid::BIGINT = ((public.ordem_compra_c3c_lock_key(p_generation) >> 32) & 4294967295)
      AND objid::BIGINT = (public.ordem_compra_c3c_lock_key(p_generation) & 4294967295)
      AND objsubid = 1
  )
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_session_lock_held(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_acquire_session_lock(p_generation BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres' OR p_generation IS NULL OR p_generation <= 0 THEN
    RAISE EXCEPTION 'owner_only_cutover_command' USING ERRCODE = '42501';
  END IF;
  RETURN pg_try_advisory_lock(public.ordem_compra_c3c_lock_key(p_generation));
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_acquire_session_lock(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_release_session_lock(p_generation BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres' THEN
    RAISE EXCEPTION 'owner_only_cutover_command' USING ERRCODE = '42501';
  END IF;
  RETURN pg_advisory_unlock(public.ordem_compra_c3c_lock_key(p_generation));
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_release_session_lock(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_source_canonical_line(
  p_generation BIGINT, p_stable_position BIGINT, p_flat_row_id BIGINT,
  p_mapping_id BIGINT, p_order_id BIGINT, p_item_id BIGINT,
  p_allocation_id BIGINT, p_need_id BIGINT, p_op_id BIGINT,
  p_legacy_class TEXT, p_material TEXT, p_cor_id BIGINT,
  p_cor_poliester TEXT, p_kg_pedido NUMERIC, p_kg_recebido NUMERIC,
  p_kg_atribuido NUMERIC, p_kg_excesso NUMERIC
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT concat_ws('|', 'c3c-source-v3', p_generation, p_stable_position,
    p_flat_row_id, p_mapping_id, p_order_id, p_item_id, p_allocation_id,
    p_need_id, COALESCE(p_op_id::TEXT, ''), p_legacy_class, p_material,
    COALESCE(p_cor_id::TEXT, ''), COALESCE(p_cor_poliester, ''),
    to_char(p_kg_pedido, 'FM999999999990.000'),
    to_char(p_kg_recebido, 'FM999999999990.000'),
    to_char(p_kg_atribuido, 'FM999999999990.000'),
    to_char(p_kg_excesso, 'FM999999999990.000'))
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_source_canonical_line(
  BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT,
  TEXT, TEXT, BIGINT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_inventory_canonical_line(
  p_generation BIGINT, p_stable_position BIGINT, p_material TEXT,
  p_cor_id BIGINT, p_cor_poliester TEXT, p_kg_total NUMERIC
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT concat_ws('|', 'c3c-inventory-v3', p_generation, p_stable_position,
    p_material, COALESCE(p_cor_id::TEXT, ''), COALESCE(p_cor_poliester, ''),
    to_char(p_kg_total, 'FM999999999990.000'))
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_inventory_canonical_line(
  BIGINT, BIGINT, TEXT, BIGINT, TEXT, NUMERIC
) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_fence_and_snapshot(p_generation BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_source_serialization TEXT;
  v_inventory_serialization TEXT;
  v_source_count INTEGER;
  v_inventory_count INTEGER;
  v_source_total NUMERIC(15,3);
  v_inventory_total NUMERIC(15,3);
BEGIN
  IF current_user <> 'postgres'
     OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  PERFORM 1 FROM public.ordem_compra_cutover
  WHERE id = 1 AND status = 'legacy_active' AND read_authority = 'flat'
    AND reconciliation_status = 'not_started'
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000'; END IF;
  UPDATE public.ordem_compra_cutover
  SET status = 'maintenance_fenced', cutover_generation = p_generation
  WHERE id = 1;

  PERFORM 1
  FROM public.ordens_compra_fio f
  JOIN public.ordem_compra_item_compat_fio c ON c.ordens_compra_fio_id = f.id
  ORDER BY f.id, c.id FOR UPDATE OF f, c;
  PERFORM 1 FROM public.saldo_fios
  ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST FOR UPDATE;
  PERFORM 1
  FROM public.ordem_compra_item i
  JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
  ORDER BY i.id, a.id FOR UPDATE OF i, a;
  PERFORM 1 FROM public.ordem_compra o
  WHERE EXISTS (SELECT 1 FROM public.ordem_compra_item i WHERE i.ordem_id = o.id)
  ORDER BY o.id FOR UPDATE;

  WITH source_rows AS (
    SELECT row_number() OVER (ORDER BY f.id, c.id, i.id, a.id) AS stable_position,
           c.id AS mapping_id, f.id AS flat_row_id, i.ordem_id, i.id AS item_id,
           a.id AS allocation_id, a.necessidade_id, a.op_id,
           CASE WHEN f.status_administrativo = 'rascunho' AND f.status = 'recebido_total' THEN 'D'
                WHEN f.status_administrativo = 'emitida' AND f.status = 'recebido_total' THEN 'A'
                ELSE 'B' END AS legacy_class,
           i.material, i.cor_id, i.cor_poliester, f.kg_pedido,
           COALESCE(f.kg_recebido, 0) AS kg_recebido,
           LEAST(COALESCE(f.kg_recebido, 0), a.kg_alocado) AS kg_atribuido,
           GREATEST(COALESCE(f.kg_recebido, 0) - a.kg_alocado, 0) AS kg_excesso
    FROM public.ordens_compra_fio f
    JOIN public.ordem_compra_item_compat_fio c ON c.ordens_compra_fio_id = f.id
    JOIN public.ordem_compra_item i ON i.id = c.ordem_compra_item_id
    JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
  ), serialized AS (
    SELECT r.*, public.ordem_compra_c3c_source_canonical_line(
      p_generation, r.stable_position, r.flat_row_id, r.mapping_id,
      r.ordem_id, r.item_id, r.allocation_id, r.necessidade_id, r.op_id,
      r.legacy_class, r.material, r.cor_id, r.cor_poliester, r.kg_pedido,
      r.kg_recebido, r.kg_atribuido, r.kg_excesso
    ) AS canonical_line
    FROM source_rows r
  )
  INSERT INTO public.ordem_compra_cutover_source_snapshot(
    cutover_id, stable_position, mapping_id, flat_row_id, ordem_compra_id,
    item_id, allocation_id, necessidade_id, op_id, legacy_class, material,
    cor_id, cor_poliester, kg_pedido, kg_recebido, kg_atribuido, kg_excesso,
    canonical_line, row_sha256
  )
  SELECT 1, stable_position, mapping_id, flat_row_id, ordem_id, item_id,
         allocation_id, necessidade_id, op_id, legacy_class, material, cor_id,
         cor_poliester, kg_pedido, kg_recebido, kg_atribuido, kg_excesso,
         canonical_line, encode(extensions.digest(canonical_line, 'sha256'), 'hex')
  FROM serialized ORDER BY stable_position;

  WITH inventory_rows AS (
    SELECT row_number() OVER (
             ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST
           ) AS stable_position,
           tipo AS material, cor_id, cor_poliester, kg_total
    FROM public.saldo_fios
  ), serialized AS (
    SELECT r.*, public.ordem_compra_c3c_inventory_canonical_line(
      p_generation, r.stable_position, r.material, r.cor_id,
      r.cor_poliester, r.kg_total
    ) AS canonical_line
    FROM inventory_rows r
  )
  INSERT INTO public.ordem_compra_cutover_inventory_baseline(
    cutover_id, stable_position, material, cor_id, cor_poliester, kg_total,
    canonical_line, row_sha256
  )
  SELECT 1, stable_position, material, cor_id, cor_poliester, kg_total,
         canonical_line, encode(extensions.digest(canonical_line, 'sha256'), 'hex')
  FROM serialized ORDER BY stable_position;

  SELECT count(*), COALESCE(sum(kg_recebido), 0), COALESCE(string_agg(canonical_line, E'\n' ORDER BY stable_position), '')
  INTO v_source_count, v_source_total, v_source_serialization
  FROM public.ordem_compra_cutover_source_snapshot WHERE cutover_id = 1;
  SELECT count(*), COALESCE(sum(kg_total), 0), COALESCE(string_agg(canonical_line, E'\n' ORDER BY stable_position), '')
  INTO v_inventory_count, v_inventory_total, v_inventory_serialization
  FROM public.ordem_compra_cutover_inventory_baseline WHERE cutover_id = 1;
  IF v_source_count <> 51 THEN RAISE EXCEPTION 'snapshot_mapping_count_mismatch'; END IF;
  UPDATE public.ordem_compra_cutover SET
    source_snapshot_count = v_source_count,
    source_snapshot_total_kg = v_source_total,
    source_snapshot_serialization = v_source_serialization,
    snapshot_hash = encode(extensions.digest(v_source_serialization, 'sha256'), 'hex'),
    inventory_baseline_count = v_inventory_count,
    inventory_baseline_total_kg = v_inventory_total,
    inventory_baseline_serialization = v_inventory_serialization,
    inventory_baseline_hash = encode(extensions.digest(v_inventory_serialization, 'sha256'), 'hex'),
    snapshot_captured_at = clock_timestamp(), reconciliation_status = 'previewed'
  WHERE id = 1;
  RETURN jsonb_build_object('ok', true, 'mapping_count', v_source_count,
    'source_total_kg', to_char(v_source_total, 'FM999999999990.000'),
    'inventory_count', v_inventory_count,
    'inventory_total_kg', to_char(v_inventory_total, 'FM999999999990.000'));
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_fence_and_snapshot(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_lock_import_resources(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres'
     OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  PERFORM 1 FROM public.ordem_compra_cutover
  WHERE id = 1 AND status = 'maintenance_fenced' AND read_authority = 'flat'
    AND reconciliation_status IN ('previewed', 'reconciled')
    AND cutover_generation = p_generation
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000'; END IF;
  PERFORM 1
  FROM public.ordem_compra_cutover_source_snapshot s
  JOIN public.ordem_compra_item_compat_fio c ON c.id = s.mapping_id
  WHERE s.cutover_id = 1
  ORDER BY s.stable_position, c.id FOR UPDATE OF s, c;
  PERFORM 1
  FROM public.ordem_compra_cutover_inventory_baseline b
  JOIN public.saldo_fios f ON f.tipo = b.material
    AND f.cor_id IS NOT DISTINCT FROM b.cor_id
    AND f.cor_poliester IS NOT DISTINCT FROM b.cor_poliester
  WHERE b.cutover_id = 1
  ORDER BY b.stable_position FOR UPDATE OF b, f;
  PERFORM 1
  FROM public.ordem_compra_cutover_source_snapshot s
  JOIN public.ordem_compra_item i ON i.id = s.item_id
  JOIN public.ordem_compra_item_alocacao a ON a.id = s.allocation_id
  WHERE s.cutover_id = 1
  ORDER BY i.id, a.id FOR UPDATE OF i, a;
  PERFORM 1
  FROM public.ordem_compra_cutover_source_snapshot s
  JOIN public.ordem_compra o ON o.id = s.ordem_compra_id
  WHERE s.cutover_id = 1
  ORDER BY o.id FOR UPDATE OF o;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_lock_import_resources(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_assert_snapshot_and_live(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_source_count INTEGER; v_inventory_count INTEGER;
  v_source_total NUMERIC(15,3); v_inventory_total NUMERIC(15,3);
  v_source_serialization TEXT; v_inventory_serialization TEXT;
  v_source_hash TEXT; v_inventory_hash TEXT;
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF NOT FOUND OR v_state.cutover_generation <> p_generation THEN
    RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover_source_snapshot s
    WHERE s.cutover_id = 1 AND (
      s.canonical_line IS DISTINCT FROM public.ordem_compra_c3c_source_canonical_line(
        p_generation, s.stable_position, s.flat_row_id, s.mapping_id,
        s.ordem_compra_id, s.item_id, s.allocation_id, s.necessidade_id, s.op_id,
        s.legacy_class, s.material, s.cor_id, s.cor_poliester, s.kg_pedido,
        s.kg_recebido, s.kg_atribuido, s.kg_excesso)
      OR s.row_sha256 IS DISTINCT FROM encode(extensions.digest(s.canonical_line, 'sha256'), 'hex')
    )
  ) THEN RAISE EXCEPTION 'source_snapshot_hash_mismatch' USING ERRCODE = '55000'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover_inventory_baseline b
    WHERE b.cutover_id = 1 AND (
      b.canonical_line IS DISTINCT FROM public.ordem_compra_c3c_inventory_canonical_line(
        p_generation, b.stable_position, b.material, b.cor_id, b.cor_poliester, b.kg_total)
      OR b.row_sha256 IS DISTINCT FROM encode(extensions.digest(b.canonical_line, 'sha256'), 'hex')
    )
  ) THEN RAISE EXCEPTION 'inventory_snapshot_hash_mismatch' USING ERRCODE = '55000'; END IF;
  SELECT count(*), COALESCE(sum(kg_recebido), 0),
         COALESCE(string_agg(canonical_line, E'\n' ORDER BY stable_position), '')
  INTO v_source_count, v_source_total, v_source_serialization
  FROM public.ordem_compra_cutover_source_snapshot WHERE cutover_id = 1;
  SELECT count(*), COALESCE(sum(kg_total), 0),
         COALESCE(string_agg(canonical_line, E'\n' ORDER BY stable_position), '')
  INTO v_inventory_count, v_inventory_total, v_inventory_serialization
  FROM public.ordem_compra_cutover_inventory_baseline WHERE cutover_id = 1;
  v_source_hash := encode(extensions.digest(v_source_serialization, 'sha256'), 'hex');
  v_inventory_hash := encode(extensions.digest(v_inventory_serialization, 'sha256'), 'hex');
  IF v_source_count <> v_state.source_snapshot_count
     OR v_source_total <> v_state.source_snapshot_total_kg
     OR v_source_serialization IS DISTINCT FROM v_state.source_snapshot_serialization
     OR v_source_hash IS DISTINCT FROM v_state.snapshot_hash THEN
    RAISE EXCEPTION 'source_snapshot_hash_mismatch' USING ERRCODE = '55000';
  END IF;
  IF v_inventory_count <> v_state.inventory_baseline_count
     OR v_inventory_total <> v_state.inventory_baseline_total_kg
     OR v_inventory_serialization IS DISTINCT FROM v_state.inventory_baseline_serialization
     OR v_inventory_hash IS DISTINCT FROM v_state.inventory_baseline_hash THEN
    RAISE EXCEPTION 'inventory_snapshot_hash_mismatch' USING ERRCODE = '55000';
  END IF;
  WITH live_rows AS (
    SELECT row_number() OVER (ORDER BY f.id, c.id, i.id, a.id) AS stable_position,
      f.id flat_row_id, c.id mapping_id, i.ordem_id, i.id item_id,
      a.id allocation_id, a.necessidade_id, a.op_id,
      CASE WHEN f.status_administrativo='rascunho' AND f.status='recebido_total' THEN 'D'
           WHEN f.status_administrativo='emitida' AND f.status='recebido_total' THEN 'A'
           ELSE 'B' END legacy_class,
      i.material, i.cor_id, i.cor_poliester, f.kg_pedido,
      COALESCE(f.kg_recebido,0) kg_recebido,
      LEAST(COALESCE(f.kg_recebido,0),a.kg_alocado) kg_atribuido,
      GREATEST(COALESCE(f.kg_recebido,0)-a.kg_alocado,0) kg_excesso
    FROM public.ordens_compra_fio f
    JOIN public.ordem_compra_item_compat_fio c ON c.ordens_compra_fio_id=f.id
    JOIN public.ordem_compra_item i ON i.id=c.ordem_compra_item_id
    JOIN public.ordem_compra_item_alocacao a ON a.item_id=i.id
  )
  SELECT count(*), COALESCE(sum(kg_recebido),0),
    encode(extensions.digest(COALESCE(string_agg(
      public.ordem_compra_c3c_source_canonical_line(p_generation, stable_position,
        flat_row_id, mapping_id, ordem_id, item_id, allocation_id, necessidade_id,
        op_id, legacy_class, material, cor_id, cor_poliester, kg_pedido,
        kg_recebido, kg_atribuido, kg_excesso), E'\n' ORDER BY stable_position),''), 'sha256'),'hex')
  INTO v_source_count, v_source_total, v_source_hash FROM live_rows;
  IF v_source_count <> v_state.source_snapshot_count
     OR v_source_total <> v_state.source_snapshot_total_kg
     OR v_source_hash IS DISTINCT FROM v_state.snapshot_hash THEN
    RAISE EXCEPTION 'source_drift_detected' USING ERRCODE = '55000';
  END IF;
  WITH live_rows AS (
    SELECT row_number() OVER (ORDER BY tipo,cor_id NULLS FIRST,cor_poliester NULLS FIRST) stable_position,
      tipo material, cor_id, cor_poliester, kg_total FROM public.saldo_fios
  )
  SELECT count(*), COALESCE(sum(kg_total),0),
    encode(extensions.digest(COALESCE(string_agg(
      public.ordem_compra_c3c_inventory_canonical_line(p_generation, stable_position,
        material, cor_id, cor_poliester, kg_total), E'\n' ORDER BY stable_position),''), 'sha256'),'hex')
  INTO v_inventory_count, v_inventory_total, v_inventory_hash FROM live_rows;
  IF v_inventory_count <> v_state.inventory_baseline_count
     OR v_inventory_total <> v_state.inventory_baseline_total_kg
     OR v_inventory_hash IS DISTINCT FROM v_state.inventory_baseline_hash THEN
    RAISE EXCEPTION 'inventory_drift_detected' USING ERRCODE = '55000';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_assert_snapshot_and_live(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_import_snapshot_row(p_snapshot_id BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row public.ordem_compra_cutover_source_snapshot%ROWTYPE;
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_payload JSONB;
  v_result_metadata JSONB;
  v_command_hash TEXT;
  v_header_key TEXT;
  v_header_id BIGINT;
  v_line INTEGER := 0;
  v_expected_lines INTEGER;
  v_actual_lines INTEGER;
  v_valid_attributed INTEGER;
  v_valid_excess INTEGER;
  v_excess_line INTEGER;
BEGIN
  IF current_user <> 'postgres' THEN RAISE EXCEPTION 'owner_only_cutover_command' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_row FROM public.ordem_compra_cutover_source_snapshot WHERE id = p_snapshot_id;
  IF NOT FOUND OR v_row.kg_recebido = 0 THEN RETURN NULL; END IF;
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = v_row.cutover_id;
  IF NOT FOUND OR v_state.status <> 'maintenance_fenced' OR v_state.read_authority <> 'flat'
     OR v_state.cutover_generation IS NULL
     OR NOT public.ordem_compra_c3c_session_lock_held(v_state.cutover_generation) THEN
    RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000';
  END IF;
  v_header_key := 'c3c_snapshot:' || v_row.cutover_id || ':'
    || v_state.cutover_generation || ':' || v_row.flat_row_id;
  v_payload := jsonb_build_object(
    'schema_version', 3, 'cutover_id', v_row.cutover_id,
    'cutover_generation', v_state.cutover_generation,
    'snapshot_hash', v_state.snapshot_hash,
    'inventory_baseline_hash', v_state.inventory_baseline_hash,
    'flat_row_id', v_row.flat_row_id, 'mapping_id', v_row.mapping_id,
    'snapshot_row_id', v_row.id, 'snapshot_row_sha256', v_row.row_sha256,
    'order_id', v_row.ordem_compra_id, 'item_id', v_row.item_id,
    'allocation_id', v_row.allocation_id, 'need_id', v_row.necessidade_id,
    'op_id', v_row.op_id, 'legacy_class', v_row.legacy_class,
    'material', v_row.material, 'cor_id', v_row.cor_id,
    'cor_poliester', v_row.cor_poliester,
    'total_kg', to_char(v_row.kg_recebido, 'FM999999999990.000'),
    'attributed_kg', to_char(v_row.kg_atribuido, 'FM999999999990.000'),
    'excess_kg', to_char(v_row.kg_excesso, 'FM999999999990.000'),
    'expected_line_count', (CASE WHEN v_row.kg_atribuido > 0 THEN 1 ELSE 0 END)
      + (CASE WHEN v_row.kg_excesso > 0 THEN 1 ELSE 0 END));
  v_command_hash := encode(extensions.digest(v_payload::TEXT, 'sha256'), 'hex');
  v_result_metadata := jsonb_build_object('schema_version', 3,
    'cutover_generation', v_state.cutover_generation,
    'snapshot_hash', v_state.snapshot_hash,
    'snapshot_row_sha256', v_row.row_sha256);
  SELECT * INTO v_header FROM public.ordem_compra_recebimentos
  WHERE idempotency_namespace = 'legacy_initial_balance_v1'
    AND ator_tipo = 'sistema' AND ator_id IS NULL
    AND idempotency_key = v_header_key;
  IF FOUND THEN
    IF v_header.ordem_compra_id <> v_row.ordem_compra_id
       OR v_header.comando_tipo <> 'import_saldo_inicial'
       OR v_header.documento_ref IS NOT NULL
       OR v_header.origem_tipo <> 'legacy_flat_snapshot'
       OR v_header.origem_ref IS DISTINCT FROM v_row.row_sha256
       OR v_header.comando_payload IS DISTINCT FROM v_payload
       OR v_header.comando_hash IS DISTINCT FROM v_command_hash
       OR v_header.resultado_metadata IS DISTINCT FROM v_result_metadata THEN
      RAISE EXCEPTION 'idempotencia_conflitante' USING ERRCODE = '55000';
    END IF;
    v_expected_lines := (CASE WHEN v_row.kg_atribuido > 0 THEN 1 ELSE 0 END)
      + (CASE WHEN v_row.kg_excesso > 0 THEN 1 ELSE 0 END);
    v_excess_line := CASE WHEN v_row.kg_atribuido > 0 THEN 2 ELSE 1 END;
    SELECT count(*),
      count(*) FILTER (WHERE v_row.kg_atribuido > 0 AND l.linha_indice = 1
        AND l.ordem_compra_fio_id IS NULL AND l.ordem_compra_item_id = v_row.item_id
        AND l.kg_recebido = v_row.kg_atribuido AND l.data_recebimento IS NULL
        AND l.observacao IS NULL AND l.criado_por IS NULL AND l.tipo = 'import_saldo_inicial'
        AND l.estorno_de_id IS NULL
        AND l.idempotency_key = 'c3c:' || v_state.cutover_generation || ':' || v_row.flat_row_id || ':1'
        AND l.origem_tipo = 'legacy_flat_snapshot' AND l.origem_ref = v_row.row_sha256
        AND l.ordem_compra_id = v_row.ordem_compra_id
        AND l.ordem_compra_item_alocacao_id = v_row.allocation_id
        AND l.op_id IS NOT DISTINCT FROM v_row.op_id AND l.material = v_row.material
        AND l.cor_id IS NOT DISTINCT FROM v_row.cor_id
        AND l.cor_poliester IS NOT DISTINCT FROM v_row.cor_poliester
        AND l.kg_excesso = 0 AND l.ator_tipo = 'sistema'),
      count(*) FILTER (WHERE v_row.kg_excesso > 0 AND l.linha_indice = v_excess_line
        AND l.ordem_compra_fio_id IS NULL AND l.ordem_compra_item_id = v_row.item_id
        AND l.kg_recebido = v_row.kg_excesso AND l.data_recebimento IS NULL
        AND l.observacao IS NULL AND l.criado_por IS NULL AND l.tipo = 'import_saldo_inicial'
        AND l.estorno_de_id IS NULL
        AND l.idempotency_key = 'c3c:' || v_state.cutover_generation || ':' || v_row.flat_row_id || ':' || v_excess_line
        AND l.origem_tipo = 'legacy_flat_snapshot' AND l.origem_ref = v_row.row_sha256
        AND l.ordem_compra_id = v_row.ordem_compra_id
        AND l.ordem_compra_item_alocacao_id IS NULL AND l.op_id IS NULL
        AND l.material = v_row.material AND l.cor_id IS NOT DISTINCT FROM v_row.cor_id
        AND l.cor_poliester IS NOT DISTINCT FROM v_row.cor_poliester
        AND l.kg_excesso = v_row.kg_excesso AND l.ator_tipo = 'sistema')
    INTO v_actual_lines, v_valid_attributed, v_valid_excess
    FROM public.ordem_compra_fio_lancamentos l WHERE l.recebimento_id = v_header.id;
    IF v_actual_lines <> v_expected_lines
       OR v_valid_attributed <> (CASE WHEN v_row.kg_atribuido > 0 THEN 1 ELSE 0 END)
       OR v_valid_excess <> (CASE WHEN v_row.kg_excesso > 0 THEN 1 ELSE 0 END) THEN
      RAISE EXCEPTION 'idempotencia_conflitante' USING ERRCODE = '55000';
    END IF;
    RETURN v_header.id;
  END IF;
  INSERT INTO public.ordem_compra_recebimentos(
    ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
    ator_id, ator_tipo, ocorrido_em, origem_tipo, origem_ref,
    comando_payload, comando_hash, resultado_metadata
  ) VALUES (
    v_row.ordem_compra_id, 'import_saldo_inicial', 'legacy_initial_balance_v1',
    v_header_key,
    NULL, 'sistema', clock_timestamp(), 'legacy_flat_snapshot', v_row.row_sha256,
    v_payload, v_command_hash, v_result_metadata
  ) RETURNING id INTO v_header_id;
  IF v_row.kg_atribuido > 0 THEN
    v_line := v_line + 1;
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      criado_por, tipo, idempotency_key, origem_tipo, origem_ref, recebimento_id,
      ordem_compra_id, ordem_compra_item_alocacao_id, op_id, material, cor_id,
      cor_poliester, kg_excesso, ator_tipo, linha_indice
    ) VALUES (NULL, v_row.item_id, v_row.kg_atribuido, NULL, NULL,
      'import_saldo_inicial', 'c3c:' || v_state.cutover_generation || ':' || v_row.flat_row_id || ':' || v_line,
      'legacy_flat_snapshot', v_row.row_sha256, v_header_id, v_row.ordem_compra_id,
      v_row.allocation_id, v_row.op_id, v_row.material, v_row.cor_id,
      v_row.cor_poliester, 0, 'sistema', v_line);
  END IF;
  IF v_row.kg_excesso > 0 THEN
    v_line := v_line + 1;
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      criado_por, tipo, idempotency_key, origem_tipo, origem_ref, recebimento_id,
      ordem_compra_id, ordem_compra_item_alocacao_id, op_id, material, cor_id,
      cor_poliester, kg_excesso, ator_tipo, linha_indice
    ) VALUES (NULL, v_row.item_id, v_row.kg_excesso, NULL, NULL,
      'import_saldo_inicial', 'c3c:' || v_state.cutover_generation || ':' || v_row.flat_row_id || ':' || v_line,
      'legacy_flat_snapshot', v_row.row_sha256, v_header_id, v_row.ordem_compra_id,
      NULL, NULL, v_row.material, v_row.cor_id, v_row.cor_poliester,
      v_row.kg_excesso, 'sistema', v_line);
  END IF;
  RETURN v_header_id;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_import_snapshot_row(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_assert_import_reconciled(p_generation BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_headers INTEGER; v_lines INTEGER; v_movements INTEGER;
  v_total NUMERIC(15,3); v_excess NUMERIC(15,3); v_attributed NUMERIC(15,3);
  v_expected_attributed NUMERIC(15,3); v_expected_excess NUMERIC(15,3);
BEGIN
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF NOT FOUND OR v_state.cutover_generation <> p_generation THEN
    RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000';
  END IF;
  IF v_state.productive_receipt_started_at IS NOT NULL OR EXISTS (
    SELECT 1 FROM public.ordem_compra_recebimentos
    WHERE idempotency_namespace = 'native_receipt_v1' AND comando_tipo = 'recebimento'
  ) THEN RAISE EXCEPTION 'productive_receipt_exists' USING ERRCODE = '55000'; END IF;
  IF EXISTS (
    SELECT s.id
    FROM public.ordem_compra_cutover_source_snapshot s
    LEFT JOIN public.ordem_compra_recebimentos h
      ON h.idempotency_namespace = 'legacy_initial_balance_v1'
     AND h.comando_payload ->> 'cutover_generation' = p_generation::TEXT
     AND h.comando_payload ->> 'snapshot_hash' = v_state.snapshot_hash
     AND h.comando_payload ->> 'snapshot_row_id' = s.id::TEXT
    WHERE s.cutover_id = 1 AND s.kg_recebido > 0
    GROUP BY s.id HAVING count(h.id) <> 1
  ) THEN RAISE EXCEPTION 'import_reconciliation_mismatch' USING ERRCODE = '55000'; END IF;
  SELECT count(DISTINCT h.id), count(l.id), COALESCE(sum(l.kg_recebido),0),
         COALESCE(sum(l.kg_excesso),0),
         COALESCE(sum(l.kg_recebido) FILTER (WHERE l.ordem_compra_item_alocacao_id IS NOT NULL),0)
  INTO v_headers, v_lines, v_total, v_excess, v_attributed
  FROM public.ordem_compra_recebimentos h
  LEFT JOIN public.ordem_compra_fio_lancamentos l ON l.recebimento_id = h.id
  WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
    AND h.comando_payload ->> 'cutover_generation' = p_generation::TEXT
    AND h.comando_payload ->> 'snapshot_hash' = v_state.snapshot_hash;
  SELECT COALESCE(sum(kg_atribuido),0), COALESCE(sum(kg_excesso),0)
  INTO v_expected_attributed, v_expected_excess
  FROM public.ordem_compra_cutover_source_snapshot WHERE cutover_id = 1;
  SELECT count(*) INTO v_movements
  FROM public.ordem_compra_fio_movimentos_estoque m
  JOIN public.ordem_compra_fio_lancamentos l ON l.id = m.lancamento_id
  JOIN public.ordem_compra_recebimentos h ON h.id = l.recebimento_id
  WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
    AND h.comando_payload ->> 'cutover_generation' = p_generation::TEXT
    AND h.comando_payload ->> 'snapshot_hash' = v_state.snapshot_hash;
  IF v_headers <> 39 OR v_lines <> 44 OR v_total <> 20221.280
     OR v_excess <> 405.980 OR v_movements <> 0
     OR v_attributed <> v_expected_attributed OR v_excess <> v_expected_excess
     OR v_total <> v_attributed + v_excess THEN
    RAISE EXCEPTION 'import_reconciliation_mismatch' USING ERRCODE = '55000';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.ordem_compra_recebimentos h
    JOIN public.ordem_compra_fio_lancamentos l ON l.recebimento_id = h.id
    JOIN public.ordem_compra_cutover_source_snapshot s
      ON h.comando_payload ->> 'snapshot_row_id' = s.id::TEXT
    WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
      AND h.comando_payload ->> 'cutover_generation' = p_generation::TEXT
      AND h.comando_payload ->> 'snapshot_hash' = v_state.snapshot_hash
      AND ((l.ordem_compra_item_alocacao_id IS NOT NULL AND l.op_id IS DISTINCT FROM s.op_id)
        OR (l.ordem_compra_item_alocacao_id IS NULL AND l.op_id IS NOT NULL))
  ) THEN RAISE EXCEPTION 'import_reconciliation_mismatch' USING ERRCODE = '55000'; END IF;
  PERFORM public.ordem_compra_c3c_assert_snapshot_and_live(p_generation);
  RETURN jsonb_build_object('ok', true, 'headers', v_headers, 'ledger_lines', v_lines,
    'reconstructed_kg', to_char(v_total, 'FM999999999990.000'),
    'excess_kg', to_char(v_excess, 'FM999999999990.000'),
    'inventory_movements', v_movements);
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_assert_import_reconciled(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_import_and_reconcile(p_generation BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r RECORD;
  v_result JSONB;
  v_replay BOOLEAN;
  v_state public.ordem_compra_cutover%ROWTYPE;
BEGIN
  IF current_user <> 'postgres'
     OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  PERFORM public.ordem_compra_c3c_lock_import_resources(p_generation);
  SELECT * INTO v_state FROM public.ordem_compra_cutover WHERE id = 1;
  IF v_state.status <> 'maintenance_fenced' OR v_state.read_authority <> 'flat'
     OR v_state.reconciliation_status NOT IN ('previewed', 'reconciled')
     OR v_state.cutover_generation <> p_generation THEN
    RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000';
  END IF;
  v_replay := v_state.reconciliation_status = 'reconciled';
  PERFORM public.ordem_compra_c3c_assert_snapshot_and_live(p_generation);
  IF NOT v_replay THEN
    UPDATE public.ordem_compra_cutover
    SET import_started_at = COALESCE(import_started_at, clock_timestamp()) WHERE id = 1;
  END IF;
  FOR r IN SELECT id FROM public.ordem_compra_cutover_source_snapshot
           WHERE cutover_id = 1 AND kg_recebido > 0 ORDER BY stable_position LOOP
    PERFORM public.ordem_compra_c3c_import_snapshot_row(r.id);
  END LOOP;
  v_result := public.ordem_compra_c3c_assert_import_reconciled(p_generation);
  IF NOT v_replay THEN
    UPDATE public.ordem_compra_cutover
    SET reconciliation_status = 'reconciled', import_completed_at = clock_timestamp()
    WHERE id = 1;
  END IF;
  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_import_and_reconcile(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_set_canonical_read(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres' OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  UPDATE public.ordem_compra_cutover SET read_authority = 'canonical'
  WHERE id = 1 AND status = 'maintenance_fenced' AND reconciliation_status = 'reconciled'
    AND cutover_generation = p_generation AND productive_receipt_started_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_set_canonical_read(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_close_final_acl(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  r RECORD;
  v_protected_tables CONSTANT TEXT[] := ARRAY[
    'ordens_compra_fio',
    'necessidade_compra_fio',
    'ordem_compra_item_compat_fio',
    'ordem_compra_item_alocacao',
    'ordem_compra_item',
    'ordem_compra',
    'saldo_fios',
    'saldo_fios_op',
    'ordem_compra_recebimentos',
    'ordem_compra_fio_lancamentos',
    'ordem_compra_fio_movimentos_estoque',
    'ordem_compra_cutover',
    'ordem_compra_cutover_source_snapshot',
    'ordem_compra_cutover_inventory_baseline'
  ]::TEXT[];
BEGIN
  IF current_user <> 'postgres' OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  PERFORM 1 FROM public.ordem_compra_cutover WHERE id = 1
    AND status = 'maintenance_fenced' AND read_authority = 'canonical'
    AND reconciliation_status = 'reconciled' AND cutover_generation = p_generation
    AND productive_receipt_started_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000'; END IF;
  REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.ordens_compra_fio FROM PUBLIC, anon, authenticated, service_role;
  REVOKE UPDATE(op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido,
    kg_recebido, data_recebimento, status, status_administrativo,
    status_recebimento) ON TABLE public.ordens_compra_fio
    FROM PUBLIC, anon, authenticated, service_role;
  REVOKE ALL ON SEQUENCE public.ordens_compra_fio_id_seq FROM PUBLIC, anon, authenticated, service_role;
  REVOKE ALL ON TABLE public.ordem_compra_recebimentos,
    public.ordem_compra_fio_lancamentos,
    public.ordem_compra_fio_movimentos_estoque,
    public.ordem_compra_cutover,
    public.ordem_compra_cutover_source_snapshot,
    public.ordem_compra_cutover_inventory_baseline
    FROM PUBLIC, anon, authenticated, service_role;
  REVOKE ALL ON SEQUENCE public.ordem_compra_recebimentos_id_seq,
    public.ordem_compra_fio_lancamentos_id_seq,
    public.ordem_compra_fio_movimentos_estoque_id_seq,
    public.ordem_compra_cutover_id_seq,
    public.ordem_compra_cutover_source_snapshot_id_seq,
    public.ordem_compra_cutover_inventory_baseline_id_seq
    FROM PUBLIC, anon, authenticated, service_role;
  FOR r IN
    SELECT n.nspname, c.relname, p.polname
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND 0::oid = ANY (p.polroles)
      AND c.relname::TEXT = ANY (v_protected_tables)
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.polname, r.nspname, r.relname);
  END LOOP;
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND 0::oid = ANY (p.polroles)
      AND c.relname::TEXT = ANY (v_protected_tables)
  ) THEN
    RAISE EXCEPTION 'public_policy_remaining' USING ERRCODE = '55000';
  END IF;
  UPDATE public.ordem_compra_cutover SET final_acl_closed_at = clock_timestamp() WHERE id = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_close_final_acl(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_activate(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres' OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  UPDATE public.ordem_compra_cutover SET status = 'canonical_active', canonical_activated_at = clock_timestamp()
  WHERE id = 1 AND status = 'maintenance_fenced' AND read_authority = 'canonical'
    AND reconciliation_status = 'reconciled' AND final_acl_closed_at IS NOT NULL
    AND cutover_generation = p_generation AND productive_receipt_started_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'estado_cutover_invalido' USING ERRCODE = '55000'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_activate(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.ordem_compra_c3c_pre_ponr_rollback(p_generation BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'postgres' OR NOT public.ordem_compra_c3c_session_lock_held(p_generation) THEN
    RAISE EXCEPTION 'cutover_session_lock_required' USING ERRCODE = '55000';
  END IF;
  UPDATE public.ordem_compra_cutover
  SET read_authority = 'flat', status = 'maintenance_fenced', canonical_activated_at = NULL
  WHERE id = 1 AND status IN ('maintenance_fenced','canonical_active')
    AND cutover_generation = p_generation AND productive_receipt_started_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'forward_recovery_only' USING ERRCODE = '55000'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.ordem_compra_c3c_pre_ponr_rollback(BIGINT) FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.proname LIKE 'ordem_compra_c3c_%'
        OR p.proname IN ('trg_c3c_protected_mutation_guard','trg_c3c_command_state_guard'))
  LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres', r.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', r.signature);
  END LOOP;
END;
$$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
COMMIT;
