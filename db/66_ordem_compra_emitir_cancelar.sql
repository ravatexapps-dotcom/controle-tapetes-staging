-- ============================================================
-- Phase: ORDEM-COMPRA-LIFECYCLE Phase B1 (DB half) — emitir/cancelar RPCs
--        + partial ACL hardening
-- Spec:  docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §4,
--        §8 (Phase B1 row, ORDEM-COMPRA SPEC AMENDMENT)
-- Order: ORDEM-COMPRA-B1-DB, amended by the architect's ruling on the
--        kg_recebido ACL conflict (alternative (a) — partial hardening
--        now, kg_recebido's revoke deferred to Phase C).
--
-- Scope:
--   1. emitir_ordem_compra_fio(p_ordem_compra_fio_id BIGINT) — admin-only,
--      rascunho -> emitida. Requires fornecedor_id assigned. Freezes
--      ordem_compra_config.exige_aceite into aceite_exigido_na_emissao and
--      sets status_aceite accordingly. Writes one ordem_compra_eventos row
--      with the frozen policy in its payload.
--   2. cancelar_ordem_compra_fio(p_ordem_compra_fio_id BIGINT) — admin-only,
--      rascunho|emitida -> cancelada. Terminal. Does not touch kg_recebido
--      or ordem_compra_fio_lancamentos (ratified decision §7g — receipt
--      ledger entries never reverse). Writes one ordem_compra_eventos row.
--   3. ACL hardening (spec §8 gap 2) — PARTIAL, per architect ruling:
--      REVOKE table-level UPDATE on ordens_compra_fio from authenticated;
--      RESTORE column-level UPDATE on every column EXCEPT
--      status_administrativo / status_aceite / status_recebimento, which
--      become writable only via the two SECURITY DEFINER RPCs above
--      (table-owner execution bypasses column grants).
--
-- Parameter name/type: p_ordem_compra_fio_id BIGINT — matches the existing
-- UI call sites exactly (js/screens/op-nova.js:1074/1080, which pass
-- ordem.id, a BIGINT per ordens_compra_fio.id — not UUID). No UI file is
-- modified by this migration.
--
-- ------------------------------------------------------------------------
-- ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP (accepted, live debt, architect-ruled
-- 2026-07-18, alternative (a) of the ACL HARD STOP raised this session):
--
--   kg_recebido remains directly writable by `authenticated` after this
--   migration — both admin (registrarRecebimentoOrdemFio, op-writes.js:
--   29-43, called from op-nova.js's "Insumos" card and pedido-detail-
--   events.js's insumos-stage transition modal) and supplier
--   (screenFornecedorOrdens, fornecedor.js:461-463, gated by the
--   pre-existing ocf_fornecedor_update RLS policy) keep writing it
--   directly. PostgreSQL column-level REVOKE cannot narrow an existing
--   table-level GRANT, and authenticated held table-level UPDATE on this
--   table before this migration — the only way to actually block
--   kg_recebido was to REVOKE the table-level grant and NOT restore it on
--   this column, which would have broken both live consumers immediately,
--   with no replacement RPC (Phase C's ledger-based
--   registrar_recebimento_ordem_compra_fio is explicitly out of scope
--   here). The architect ruled to defer the kg_recebido revoke rather than
--   accept that regression.
--
--   Closing condition: Phase C's migration MUST revoke kg_recebido from
--   authenticated in the SAME migration that ships the ledger-based
--   registrar_recebimento_ordem_compra_fio RPC, and that RPC/rewrite MUST
--   serve BOTH op-writes.js's registrarRecebimentoOrdemFio call sites AND
--   fornecedor.js's screenFornecedorOrdens (Phase C's scope is amended
--   accordingly by this ruling — it was previously scoped only around
--   op-writes.js's writer).
--
-- SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED (discovered this phase, flagged
-- in the canonical docs closeout, NOT silently patched into the spec
-- body): js/screens/fornecedor.js:461 (screenFornecedorOrdens) is a live,
-- independent supplier-facing direct UPDATE of
-- kg_recebido/data_recebimento/status on ordens_compra_fio, gated by the
-- pre-existing ocf_fornecedor_update RLS policy
-- (fornecedor_id = meu_fornecedor_id()). This consumer is NOT mentioned in
-- docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §0's evidenced
-- inventory, which asserts suppliers have no existing write path on this
-- table. The spec text itself is not edited by this migration.
-- ------------------------------------------------------------------------
--
-- Idempotent: CREATE OR REPLACE FUNCTION; REVOKE/GRANT restated in full
-- (not deltas) so a reader of this file alone sees the complete intended
-- ACL. No destructive DELETE, no data rewritten, no secrets.
-- ============================================================


-- ============================================================
-- 1. public.emitir_ordem_compra_fio(BIGINT)
-- ============================================================

CREATE OR REPLACE FUNCTION public.emitir_ordem_compra_fio(
  p_ordem_compra_fio_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem         RECORD;
  v_exige_aceite  BOOLEAN;
  v_status_aceite TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_ordem
  FROM public.ordens_compra_fio
  WHERE id = p_ordem_compra_fio_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Ordem de compra nao encontrada');
  END IF;

  IF v_ordem.status_administrativo != 'rascunho' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'erro', 'Transicao invalida: ordem em status ' || v_ordem.status_administrativo || ' nao pode ser emitida'
    );
  END IF;

  IF v_ordem.fornecedor_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Ordem sem fornecedor atribuido nao pode ser emitida');
  END IF;

  SELECT exige_aceite INTO v_exige_aceite FROM public.ordem_compra_config WHERE id = 1;
  v_exige_aceite := COALESCE(v_exige_aceite, FALSE);
  v_status_aceite := CASE WHEN v_exige_aceite THEN 'pendente' ELSE 'nao_aplicavel' END;

  UPDATE public.ordens_compra_fio
  SET status_administrativo     = 'emitida',
      aceite_exigido_na_emissao = v_exige_aceite,
      status_aceite             = v_status_aceite,
      emitida_em                = now(),
      emitida_por               = auth.uid()
  WHERE id = p_ordem_compra_fio_id;

  INSERT INTO public.ordem_compra_eventos
    (ordem_compra_fio_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por)
  VALUES (
    p_ordem_compra_fio_id, 'administrativo', 'emitida', 'rascunho', 'emitida',
    jsonb_build_object(
      'aceite_exigido_na_emissao', v_exige_aceite,
      'status_aceite', v_status_aceite
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'ordem_compra_fio_id', p_ordem_compra_fio_id,
    'status_administrativo', 'emitida',
    'status_aceite', v_status_aceite,
    'aceite_exigido_na_emissao', v_exige_aceite
  );
END;
$$;

REVOKE ALL ON FUNCTION public.emitir_ordem_compra_fio(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra_fio(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra_fio(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.emitir_ordem_compra_fio(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.emitir_ordem_compra_fio(BIGINT) IS
  'Admin-only (is_admin()). rascunho -> emitida. Requires fornecedor_id assigned. '
  'Freezes ordem_compra_config.exige_aceite into aceite_exigido_na_emissao and sets '
  'status_aceite (pendente if exige_aceite, else nao_aplicavel). Writes one '
  'ordem_compra_eventos row (dimensao=administrativo) with the frozen policy in its '
  'payload. Spec §4/§8 (Phase B1).';


-- ============================================================
-- 2. public.cancelar_ordem_compra_fio(BIGINT)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancelar_ordem_compra_fio(
  p_ordem_compra_fio_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_ordem
  FROM public.ordens_compra_fio
  WHERE id = p_ordem_compra_fio_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Ordem de compra nao encontrada');
  END IF;

  IF v_ordem.status_administrativo NOT IN ('rascunho', 'emitida') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'erro', 'Transicao invalida: ordem em status ' || v_ordem.status_administrativo || ' nao pode ser cancelada'
    );
  END IF;

  UPDATE public.ordens_compra_fio
  SET status_administrativo = 'cancelada',
      cancelada_em          = now(),
      cancelada_por         = auth.uid()
  WHERE id = p_ordem_compra_fio_id;

  INSERT INTO public.ordem_compra_eventos
    (ordem_compra_fio_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por)
  VALUES (
    p_ordem_compra_fio_id, 'administrativo', 'cancelada', v_ordem.status_administrativo, 'cancelada',
    '{}'::jsonb, auth.uid()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'ordem_compra_fio_id', p_ordem_compra_fio_id,
    'status_administrativo', 'cancelada',
    'status_administrativo_anterior', v_ordem.status_administrativo
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_ordem_compra_fio(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancelar_ordem_compra_fio(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.cancelar_ordem_compra_fio(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_ordem_compra_fio(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.cancelar_ordem_compra_fio(BIGINT) IS
  'Admin-only (is_admin()). rascunho|emitida -> cancelada. Terminal transition; does not '
  'touch kg_recebido/ordem_compra_fio_lancamentos (ratified decision §7g — receipt '
  'ledger entries never reverse). Writes one ordem_compra_eventos row '
  '(dimensao=administrativo). Spec §4/§7g/§8 (Phase B1).';


-- ============================================================
-- 3. ACL hardening on public.ordens_compra_fio (spec §8 gap 2, PARTIAL —
--    architect-ruled alternative (a); see ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP
--    above)
-- ============================================================

REVOKE UPDATE ON TABLE public.ordens_compra_fio FROM authenticated;

-- Restore column-level UPDATE on every column EXCEPT the three dimension
-- columns with zero live direct writers today. kg_recebido is
-- intentionally INCLUDED (not blocked) — see the accepted gap above.
-- status_administrativo / status_aceite / status_recebimento are
-- intentionally EXCLUDED — writable only via emitir_ordem_compra_fio /
-- cancelar_ordem_compra_fio above (SECURITY DEFINER, table-owner
-- execution bypasses column grants).
GRANT UPDATE (
  id, op_id, fornecedor_id, tipo, cor_id, cor_poliester,
  kg_pedido, kg_recebido, data_pedido, data_recebimento, status,
  aceite_exigido_na_emissao, emitida_em, emitida_por,
  cancelada_em, cancelada_por, aceite_decidida_em, aceite_decidida_por,
  aceite_motivo, legado_recebimento_automatico
) ON public.ordens_compra_fio TO authenticated;

-- No grant restored for status_administrativo, status_aceite,
-- status_recebimento — direct UPDATE on these three from `authenticated`
-- now fails with 42501, regardless of RLS (ocf_admin/ocf_fornecedor_update
-- still evaluate normally for every other column).


-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
