-- PHASE-C3A-R2: owner-only legacy opening-balance import command.
-- Staging only. This migration does not activate a fence, import real rows,
-- switch readers/writers, change flat ACL, or grant native emission.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- db/71 admitted the system command header but retained the db/70 ledger actor
-- and physical-date shapes. Widen only the import branch: productive and legacy
-- physical receipt rows retain their existing actor and date requirements.
ALTER TABLE public.ordem_compra_fio_lancamentos
  DROP CONSTRAINT ordem_compra_fio_lancamentos_ator_tipo_check;

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_c3a_actor_check CHECK (
    (tipo = 'import_saldo_inicial' AND ator_tipo = 'sistema' AND criado_por IS NULL)
    OR
    (tipo <> 'import_saldo_inicial' AND (ator_tipo IS NULL OR ator_tipo IN ('admin', 'fornecedor')))
  );

ALTER TABLE public.ordem_compra_fio_lancamentos
  ALTER COLUMN data_recebimento DROP NOT NULL;

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_c3a_receipt_date_check CHECK (
    (tipo = 'import_saldo_inicial' AND data_recebimento IS NULL)
    OR
    (tipo <> 'import_saldo_inicial' AND data_recebimento IS NOT NULL)
  );

-- Defense in depth for the command-level source lock and semantic conflict.
CREATE UNIQUE INDEX ordem_compra_recebimentos_c3a_import_source
  ON public.ordem_compra_recebimentos(
    (comando_payload ->> 'cutover_id'),
    (comando_payload ->> 'flat_row_id')
  )
  WHERE idempotency_namespace = 'legacy_initial_balance_v1';

CREATE OR REPLACE FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(p_command JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cutover_id BIGINT;
  v_flat_row_id BIGINT;
  v_mapping_id BIGINT;
  v_item_id BIGINT;
  v_allocation_id BIGINT;
  v_excess_allocation_id BIGINT;
  v_legacy_class TEXT;
  v_total_kg NUMERIC;
  v_attributed_kg NUMERIC;
  v_excess_kg NUMERIC;
  v_snapshot_identity TEXT;
  v_snapshot_hash TEXT;
  v_identity_key TEXT;
  v_source_lock_key BIGINT;
  v_identity_lock_key BIGINT;
  v_request JSONB;
  v_request_sha256 TEXT;
  v_payload JSONB;
  v_payload_md5 TEXT;
  v_payload_sha256 TEXT;
  v_state_count BIGINT;
  v_state public.ordem_compra_cutover%ROWTYPE;
  v_source RECORD;
  v_snapshot_actual TEXT;
  v_inventory_actual TEXT;
  v_inventory_baseline TEXT;
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_header_id BIGINT;
  v_execution_timestamp TIMESTAMPTZ;
  v_line_index INTEGER := 0;
  v_error TEXT;
BEGIN
  IF jsonb_typeof(p_command) <> 'object' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Comando deve ser um objeto JSON');
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_command) AS k(key)
    WHERE k.key NOT IN (
      'cutover_id', 'flat_row_id', 'mapping_id', 'item_id', 'allocation_id',
      'excess_allocation_id', 'legacy_class', 'total_kg', 'attributed_kg',
      'excess_kg', 'snapshot_identity', 'snapshot_hash'
    )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Comando contem campo nao permitido');
  END IF;

  BEGIN
    v_cutover_id := (p_command ->> 'cutover_id')::BIGINT;
    v_flat_row_id := (p_command ->> 'flat_row_id')::BIGINT;
    v_mapping_id := (p_command ->> 'mapping_id')::BIGINT;
    v_item_id := (p_command ->> 'item_id')::BIGINT;
    v_allocation_id := (p_command ->> 'allocation_id')::BIGINT;
    v_excess_allocation_id := NULLIF(p_command ->> 'excess_allocation_id', '')::BIGINT;
    v_legacy_class := upper(btrim(p_command ->> 'legacy_class'));
    v_total_kg := (p_command ->> 'total_kg')::NUMERIC;
    v_attributed_kg := (p_command ->> 'attributed_kg')::NUMERIC;
    v_excess_kg := (p_command ->> 'excess_kg')::NUMERIC;
    v_snapshot_identity := btrim(p_command ->> 'snapshot_identity');
    v_snapshot_hash := lower(btrim(p_command ->> 'snapshot_hash'));
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Formato de comando invalido');
  END;

  IF v_cutover_id IS NULL OR v_cutover_id <= 0
     OR v_flat_row_id IS NULL OR v_flat_row_id <= 0
     OR v_mapping_id IS NULL OR v_mapping_id <= 0
     OR v_item_id IS NULL OR v_item_id <= 0
     OR v_allocation_id IS NULL OR v_allocation_id <= 0
     OR v_legacy_class IS NULL OR v_snapshot_identity IS NULL
     OR v_snapshot_hash IS NULL OR v_snapshot_hash !~ '^[0-9a-f]{64}$'
     OR v_total_kg IS NULL OR v_total_kg <= 0
     OR v_attributed_kg IS NULL OR v_attributed_kg < 0
     OR v_excess_kg IS NULL OR v_excess_kg < 0
     OR v_total_kg <> round(v_total_kg, 3)
     OR v_attributed_kg <> round(v_attributed_kg, 3)
     OR v_excess_kg <> round(v_excess_kg, 3)
     OR v_attributed_kg + v_excess_kg <> v_total_kg
     OR v_excess_allocation_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Identidade, quantidade, snapshot ou forma de excesso invalida');
  END IF;
  IF v_legacy_class NOT IN ('A', 'D') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'classe_legada_invalida', 'erro', 'Somente classes legadas A e D podem ser importadas');
  END IF;

  v_identity_key := 'legacy_initial_balance_v1|cutover=' || v_cutover_id::TEXT
    || '|flat=' || v_flat_row_id::TEXT || '|mapping=' || v_mapping_id::TEXT
    || '|item=' || v_item_id::TEXT;
  v_source_lock_key := hashtextextended(
    'legacy_initial_balance_v1|source|' || v_cutover_id::TEXT || '|' || v_flat_row_id::TEXT, 0
  );
  v_identity_lock_key := hashtextextended(
    'legacy_initial_balance_v1|identity|' || v_cutover_id::TEXT || '|' || v_flat_row_id::TEXT
      || '|' || v_mapping_id::TEXT || '|' || v_item_id::TEXT, 0
  );

  v_request := jsonb_build_object(
    'cutover_id', v_cutover_id,
    'flat_row_id', v_flat_row_id,
    'mapping_id', v_mapping_id,
    'item_id', v_item_id,
    'allocation_id', v_allocation_id,
    'excess_allocation_id', NULL,
    'legacy_class', v_legacy_class,
    'total_kg', to_char(v_total_kg, 'FM999999999990.000'),
    'attributed_kg', to_char(v_attributed_kg, 'FM999999999990.000'),
    'excess_kg', to_char(v_excess_kg, 'FM999999999990.000'),
    'snapshot_identity', v_snapshot_identity,
    'snapshot_hash', v_snapshot_hash
  );
  v_request_sha256 := encode(extensions.digest(v_request::TEXT, 'sha256'), 'hex');

  PERFORM pg_advisory_xact_lock(v_source_lock_key);
  PERFORM pg_advisory_xact_lock(v_identity_lock_key);

  SELECT * INTO v_header
  FROM public.ordem_compra_recebimentos h
  WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
    AND h.ator_tipo = 'sistema'
    AND h.ator_id IS NULL
    AND h.idempotency_key = v_identity_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_header.comando_tipo = 'import_saldo_inicial'
       AND v_header.comando_payload -> 'request' = v_request
       AND v_header.resultado_metadata ->> 'request_sha256' = v_request_sha256 THEN
      RETURN public._resultado_comando_recebimento(v_header.id);
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Identidade reutilizada com importacao diferente');
  END IF;

  SELECT * INTO v_header
  FROM public.ordem_compra_recebimentos h
  WHERE h.idempotency_namespace = 'legacy_initial_balance_v1'
    AND h.comando_payload ->> 'cutover_id' = v_cutover_id::TEXT
    AND h.comando_payload ->> 'flat_row_id' = v_flat_row_id::TEXT
  FOR UPDATE;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Fonte legada ja importada por identidade diferente');
  END IF;

  SELECT count(*) INTO v_state_count FROM public.ordem_compra_cutover;
  IF v_state_count <> 1 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_cutover_invalido', 'erro', 'Cutover deve possuir exatamente um estado');
  END IF;
  SELECT * INTO STRICT v_state FROM public.ordem_compra_cutover FOR UPDATE;
  IF v_state.id <> v_cutover_id OR v_state.status <> 'maintenance_fenced'
     OR v_state.reconciliation_status <> 'previewed'
     OR v_state.productive_receipt_started_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_cutover_invalido', 'erro', 'Importacao permitida somente em manutencao cercada, pre-visualizada e sem recebimento produtivo');
  END IF;
  IF v_state.snapshot_hash IS NULL OR v_state.snapshot_hash <> v_snapshot_hash
     OR v_snapshot_identity <> 'legacy_initial_balance_v1|cutover=' || v_cutover_id::TEXT || '|snapshot=' || v_snapshot_hash THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'snapshot_incompativel', 'erro', 'Identidade ou hash de snapshot incompativel');
  END IF;

  SELECT encode(extensions.digest(COALESCE(string_agg(
    concat_ws('|', f.id::TEXT, c.id::TEXT, i.id::TEXT, i.ordem_id::TEXT, a.id::TEXT,
      a.op_id::TEXT,
      CASE WHEN f.status_administrativo = 'rascunho' AND f.status = 'recebido_total' THEN 'D'
           WHEN f.status_administrativo = 'emitida' AND f.kg_recebido > 0 THEN 'A'
           WHEN f.status_administrativo = 'emitida' THEN 'B' ELSE 'C' END,
      f.tipo, COALESCE(f.cor_id::TEXT, ''), COALESCE(f.cor_poliester, ''),
      to_char(f.kg_recebido, 'FM999999999990.000'),
      to_char(LEAST(f.kg_recebido, a.kg_alocado), 'FM999999999990.000'),
      to_char(GREATEST(f.kg_recebido - a.kg_alocado, 0), 'FM999999999990.000'),
      f.status_administrativo, f.status), E'\n'
    ORDER BY f.id, c.id, i.id, a.id
  ), ''), 'sha256'), 'hex')
  INTO v_snapshot_actual
  FROM public.ordens_compra_fio f
  JOIN public.ordem_compra_item_compat_fio c ON c.ordens_compra_fio_id = f.id
  JOIN public.ordem_compra_item i ON i.id = c.ordem_compra_item_id
  JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
  WHERE f.kg_recebido > 0;
  IF v_snapshot_actual <> v_snapshot_hash THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'snapshot_incompativel', 'erro', 'Corpus atual diverge do snapshot congelado');
  END IF;

  SELECT encode(extensions.digest(COALESCE(string_agg(
    concat_ws('|', tipo, COALESCE(cor_id::TEXT, ''), COALESCE(cor_poliester, ''),
      to_char(kg_total, 'FM999999999990.000')), E'\n'
    ORDER BY tipo, cor_id NULLS FIRST, cor_poliester NULLS FIRST
  ), ''), 'sha256'), 'hex') INTO v_inventory_actual FROM public.saldo_fios;
  SELECT encode(extensions.digest(COALESCE(string_agg(
    concat_ws('|', material, COALESCE(cor_id::TEXT, ''), COALESCE(cor_poliester, ''),
      to_char(kg_total, 'FM999999999990.000')), E'\n'
    ORDER BY material, cor_id NULLS FIRST, cor_poliester NULLS FIRST
  ), ''), 'sha256'), 'hex') INTO v_inventory_baseline
  FROM public.ordem_compra_cutover_inventory_baseline WHERE cutover_id = v_cutover_id;
  IF v_state.inventory_baseline_hash IS NULL
     OR v_inventory_actual <> v_state.inventory_baseline_hash
     OR v_inventory_baseline <> v_state.inventory_baseline_hash THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'baseline_incompativel', 'erro', 'Baseline de inventario ausente ou divergente');
  END IF;

  SELECT count(*) AS source_count, min(x.ordem_id) AS ordem_id,
         min(x.material) AS material, min(x.cor_id) AS cor_id,
         min(x.cor_poliester) AS cor_poliester, min(x.kg_source) AS kg_source,
         min(x.kg_allocated) AS kg_allocated, min(x.op_id) AS op_id,
         min(x.derived_class) AS derived_class, min(x.flat_status) AS flat_status,
         min(x.flat_admin_status) AS flat_admin_status,
         min(x.allocation_count) AS allocation_count
  INTO v_source
  FROM (
    SELECT i.ordem_id, i.material, i.cor_id, i.cor_poliester,
           f.kg_recebido AS kg_source, a.kg_alocado AS kg_allocated, a.op_id,
           CASE WHEN f.status_administrativo = 'rascunho' AND f.status = 'recebido_total' THEN 'D'
                WHEN f.status_administrativo = 'emitida' AND f.kg_recebido > 0 THEN 'A'
                WHEN f.status_administrativo = 'emitida' THEN 'B' ELSE 'C' END AS derived_class,
           f.status AS flat_status, f.status_administrativo AS flat_admin_status,
           (SELECT count(*) FROM public.ordem_compra_item_alocacao ax WHERE ax.item_id = i.id) AS allocation_count
    FROM public.ordens_compra_fio f
    JOIN public.ordem_compra_item_compat_fio c
      ON c.id = v_mapping_id AND c.ordens_compra_fio_id = f.id
    JOIN public.ordem_compra_item i
      ON i.id = v_item_id AND i.id = c.ordem_compra_item_id
    JOIN public.ordem_compra_item_alocacao a
      ON a.id = v_allocation_id AND a.item_id = i.id
    WHERE f.id = v_flat_row_id AND f.kg_recebido > 0
  ) x;
  IF v_source.source_count <> 1 OR v_source.allocation_count <> 1 OR v_source.op_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fonte_legada_invalida', 'erro', 'Fonte, mapeamento, item ou alocacao nao pertence ao snapshot');
  END IF;
  IF v_source.derived_class <> v_legacy_class OR v_source.derived_class NOT IN ('A', 'D') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'classe_legada_invalida', 'erro', 'Classe legada informada diverge da fonte');
  END IF;
  IF v_source.kg_source <> v_total_kg
     OR LEAST(v_source.kg_source, v_source.kg_allocated) <> v_attributed_kg
     OR GREATEST(v_source.kg_source - v_source.kg_allocated, 0) <> v_excess_kg
     OR v_attributed_kg > v_source.kg_allocated THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'quantidade_incompativel', 'erro', 'Total, atribuicao ou excesso diverge da fonte congelada');
  END IF;

  v_payload := jsonb_build_object(
    'schema_version', 1,
    'namespace', 'legacy_initial_balance_v1',
    'cutover_id', v_cutover_id,
    'flat_row_id', v_flat_row_id,
    'mapping_id', v_mapping_id,
    'order_id', v_source.ordem_id,
    'item_id', v_item_id,
    'allocation_id', v_allocation_id,
    'op_id', v_source.op_id,
    'legacy_class', v_legacy_class,
    'total_kg', to_char(v_total_kg, 'FM999999999990.000'),
    'attributed_kg', to_char(v_attributed_kg, 'FM999999999990.000'),
    'excess_kg', to_char(v_excess_kg, 'FM999999999990.000'),
    'snapshot_identity', v_snapshot_identity,
    'snapshot_hash', v_snapshot_hash,
    'request', v_request,
    'provenance', jsonb_build_object(
      'source_table', 'public.ordens_compra_fio',
      'source_row_id', v_flat_row_id,
      'mapping_table', 'public.ordem_compra_item_compat_fio',
      'mapping_id', v_mapping_id,
      'legacy_status', v_source.flat_status,
      'legacy_administrative_status', v_source.flat_admin_status,
      'receipt_semantics', CASE WHEN v_legacy_class = 'D' THEN 'recebido_sem_emissao' ELSE 'legacy_emitted_receipt' END,
      'received_without_emission', v_legacy_class = 'D'
    ),
    'execution_timestamp_semantics', 'header.ocorrido_em_is_command_acceptance_time_not_physical_receipt_time'
  );
  v_payload_md5 := md5(v_payload::TEXT);
  v_payload_sha256 := encode(extensions.digest(v_payload::TEXT, 'sha256'), 'hex');
  v_execution_timestamp := clock_timestamp();

  INSERT INTO public.ordem_compra_recebimentos(
    ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
    ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
    comando_payload, comando_hash, resultado_metadata
  ) VALUES (
    v_source.ordem_id, 'import_saldo_inicial', 'legacy_initial_balance_v1', v_identity_key,
    NULL, 'sistema', v_execution_timestamp, NULL, 'legacy_flat_snapshot', v_snapshot_identity,
    v_payload, v_payload_md5,
    jsonb_build_object(
      'schema_version', 1,
      'line_count', CASE WHEN v_excess_kg > 0 THEN 2 ELSE 1 END,
      'request_sha256', v_request_sha256,
      'payload_sha256', v_payload_sha256,
      'source_lock_key', v_source_lock_key,
      'identity_lock_key', v_identity_lock_key
    )
  ) RETURNING id INTO v_header_id;

  IF v_attributed_kg > 0 THEN
    v_line_index := v_line_index + 1;
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key,
      origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
      kg_excesso, ator_tipo, linha_indice
    ) VALUES (
      NULL, v_item_id, v_attributed_kg, NULL, NULL, NULL, 'import_saldo_inicial', NULL,
      'legacy_initial_balance:' || v_header_id::TEXT || ':' || v_line_index::TEXT,
      'legacy_flat_snapshot', v_snapshot_identity, v_header_id, v_source.ordem_id,
      v_allocation_id, v_source.op_id, v_source.material, v_source.cor_id,
      v_source.cor_poliester, 0, 'sistema', v_line_index
    );
  END IF;

  IF v_excess_kg > 0 THEN
    v_line_index := v_line_index + 1;
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key,
      origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
      kg_excesso, ator_tipo, linha_indice
    ) VALUES (
      NULL, v_item_id, v_excess_kg, NULL, NULL, NULL, 'import_saldo_inicial', NULL,
      'legacy_initial_balance:' || v_header_id::TEXT || ':' || v_line_index::TEXT,
      'legacy_flat_snapshot', v_snapshot_identity, v_header_id, v_source.ordem_id,
      NULL, NULL, v_source.material, v_source.cor_id, v_source.cor_poliester,
      v_excess_kg, 'sistema', v_line_index
    );
  END IF;

  RETURN public._resultado_comando_recebimento(v_header_id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Importacao concorrente conflitou com identidade imutavel');
  WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
    RETURN jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'erro', v_error);
END;
$$;

ALTER FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) FROM authenticated;
REVOKE ALL ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) FROM service_role;

COMMENT ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB) IS
  'PHASE-C3A-R2 owner-only maintenance command. Imports one frozen Class A/D legacy opening balance with semantic idempotency, source/identity advisory locks, immutable allocation/excess ledger shape, no physical receipt date, and zero inventory posting.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
