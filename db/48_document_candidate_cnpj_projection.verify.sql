-- ============================================================
-- Verify transacional de 48_document_candidate_cnpj_projection.sql.
-- Executar somente em staging apos aplicar a migration. Faz ROLLBACK.
-- Exercita o RPC upsert_document_candidate_ingestor_state e prova:
--   * CNPJ de 14 digitos preenche as colunas estruturadas;
--   * null / ausente / '' resultam em coluna NULL;
--   * valor invalido continua bloqueado pelo CHECK (check_violation);
--   * raw_payload permanece intacto;
--   * nenhum candidate existente e alterado; contagem restaurada.
-- ============================================================

BEGIN;

DO $$
DECLARE
  v_tag TEXT := '__verify_b8c_' || txid_current()::TEXT;
  v_count_before INTEGER;
  v_res JSONB;
  v_emit TEXT;
  v_dest TEXT;
  v_raw JSONB;
  v_snap_doc TEXT;
  v_snap_before TEXT;
  v_snap_after TEXT;
  v_invalid_blocked BOOLEAN := FALSE;
BEGIN
  -- Establish service_role context so the writer guard passes (transaction-local).
  PERFORM set_config('request.jwt.claims', '{"role":"service_role"}', true);
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'verify setup failed: auth.role()=% (expected service_role)', auth.role();
  END IF;

  SELECT COUNT(*) INTO v_count_before FROM public.document_candidates;

  -- Snapshot one pre-existing candidate to prove it is not mutated.
  SELECT document_id, md5(t::text) INTO v_snap_doc, v_snap_before
  FROM public.document_candidates t
  WHERE document_id NOT LIKE '__verify_%'
  ORDER BY document_id LIMIT 1;

  -- (A) 14-digit CNPJs must fill the structured columns; raw_payload intact.
  v_res := public.upsert_document_candidate_ingestor_state(
    jsonb_build_object(
      'document_id', v_tag || '_a',
      'cnpj_emitente', '11222333000181',
      'cnpj_destinatario', '11222333000181',
      'status', 'pending', 'schema_version', 1,
      'raw_payload', jsonb_build_object('marker', 'b8c', 'cnpj_emitente', '11222333000181')
    ), 'pending', now(), 'evt_' || v_tag || '_a', NULL);
  ASSERT v_res ->> 'ok' = 'true', 'RPC A did not return ok=true: ' || v_res::text;
  SELECT cnpj_emitente, cnpj_destinatario, raw_payload INTO v_emit, v_dest, v_raw
    FROM public.document_candidates WHERE document_id = v_tag || '_a';
  ASSERT v_emit = '11222333000181', 'A: cnpj_emitente column not projected (got ' || COALESCE(v_emit,'NULL') || ')';
  ASSERT v_dest = '11222333000181', 'A: cnpj_destinatario column not projected (got ' || COALESCE(v_dest,'NULL') || ')';
  ASSERT v_raw ? 'marker' AND v_raw ->> 'cnpj_emitente' = '11222333000181', 'A: raw_payload not intact';

  -- (B) missing CNPJ keys -> NULL columns.
  v_res := public.upsert_document_candidate_ingestor_state(
    jsonb_build_object('document_id', v_tag || '_b', 'status', 'pending'),
    'pending', now(), 'evt_' || v_tag || '_b', NULL);
  SELECT cnpj_emitente, cnpj_destinatario INTO v_emit, v_dest
    FROM public.document_candidates WHERE document_id = v_tag || '_b';
  ASSERT v_emit IS NULL AND v_dest IS NULL, 'B: absent CNPJ should stay NULL';

  -- (C) empty-string CNPJs -> NULL via NULLIF (must NOT trip the CHECK).
  v_res := public.upsert_document_candidate_ingestor_state(
    jsonb_build_object('document_id', v_tag || '_c', 'cnpj_emitente', '', 'cnpj_destinatario', '', 'status', 'pending'),
    'pending', now(), 'evt_' || v_tag || '_c', NULL);
  SELECT cnpj_emitente, cnpj_destinatario INTO v_emit, v_dest
    FROM public.document_candidates WHERE document_id = v_tag || '_c';
  ASSERT v_emit IS NULL AND v_dest IS NULL, 'C: empty-string CNPJ should become NULL';

  -- (D) invalid (non 14-digit) CNPJ must be blocked by the CHECK.
  BEGIN
    v_res := public.upsert_document_candidate_ingestor_state(
      jsonb_build_object('document_id', v_tag || '_d', 'cnpj_emitente', '123', 'status', 'pending'),
      'pending', now(), 'evt_' || v_tag || '_d', NULL);
    RAISE EXCEPTION 'D: invalid CNPJ was accepted (res=%)', v_res;
  EXCEPTION WHEN check_violation THEN
    v_invalid_blocked := TRUE;
  END;
  ASSERT v_invalid_blocked, 'D: invalid CNPJ was not blocked by CHECK';

  -- Pre-existing candidate must be byte-identical.
  IF v_snap_doc IS NOT NULL THEN
    SELECT md5(t::text) INTO v_snap_after FROM public.document_candidates t WHERE document_id = v_snap_doc;
    ASSERT v_snap_after = v_snap_before, 'existing candidate ' || v_snap_doc || ' was mutated';
  END IF;

  -- Cleanup test rows and confirm count restored.
  DELETE FROM public.document_candidates WHERE document_id LIKE v_tag || '%';
  ASSERT (SELECT COUNT(*) FROM public.document_candidates) = v_count_before, 'count not restored to baseline';

  RAISE NOTICE 'ALL B8-C CNPJ PROJECTION VERIFY ASSERTIONS PASSED';
END;
$$;

ROLLBACK;
