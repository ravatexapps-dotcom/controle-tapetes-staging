-- PHASE-C5A-DB-EMISSION-READINESS: activate native purchase-order emission readiness.
-- Governing contract: docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md
--   (ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY, §22; classification
--    READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE).
-- Normative anchors: ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
--   §R.22.5 (emission preconditions), §R.22.6 / §R.23.8 / §R.23.9 (the installed-
--   but-inactive readiness state whose Phase-C activation flips pode_emitir),
--   §R.24.10 (separate post-C4 emission gate).
--
-- This migration installs exactly:
--   1. GRANT EXECUTE ON public.emitir_ordem_compra(BIGINT) TO authenticated.
--      The exact final ACL is: only authenticated executes; PUBLIC/anon/service_role
--      stay revoked. The db/68 emission-writer BODY is NOT redefined here (grant
--      only) and its internal public.is_admin() gate remains the authoritative
--      actor check -- the grant does not weaken it (grant != admin authorization).
--   2. CREATE OR REPLACE public.obter_ordem_compra_admin(BIGINT) and
--      public.listar_ordens_compra_admin(UUID): route the existing
--      public._distribuicao_completa_ordem(id) completeness signal + the
--      structurally-frozen ordem_compra_config.exige_aceite=FALSE regime into
--      pode_emitir / acoes.emitir / bloqueio_emissao. EVERY other field is
--      byte-preserved from the db/69 terminal bodies.
--
-- Readiness derivation (both read models, identical semantics):
--   * pode_emitir = acoes.emitir = TRUE  iff the order is a native rascunho with
--     _distribuicao_completa_ordem(id)=TRUE (>=1 item, every item fully allocated)
--     AND ordem_compra_config.exige_aceite = FALSE. _distribuicao_completa_ordem
--     already encodes native + rascunho, so completeness alone implies them.
--   * bloqueio_emissao (native rascunho only; NULL for legado / non-rascunho):
--       NOT complete            -> 'distribuicao_necessidades_pendente'
--       complete + exige_aceite -> 'emissao_bloqueada_exige_aceite'
--       complete + no aceite    -> NULL (ready to emit)
--     'emissao_bloqueada_exige_aceite' is the deterministic UI-enablement blocker
--     for a fully-distributed draft whose emission is withheld from the canonical
--     application path because acceptance is required and PHASE-C5B does not yet
--     exist. It is currently unreachable through any client path (exige_aceite is
--     seeded FALSE with no client write path, db/65) -- a defensive gate.
--
-- Frozen boundaries (contract §22, do NOT exceed here):
--   * the emitir_ordem_compra(BIGINT) body is NOT redefined (grant only), so its
--     terminal definition stays byte-identical to db/68;
--   * NO allocation-writer migration: definir_alocacao_necessidade_compra_fio
--     stays granted to authenticated + admin-gated, and the SUPERSEDED
--     alocar_necessidade_compra_fio stays revoked -- NEITHER is touched here;
--   * NO acceptance/rejection capability and NO exige_aceite writer: emission
--     readiness is exposed only for exige_aceite=FALSE
--     (EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE). A privileged direct RPC may
--     still emit an exige_aceite=TRUE order per the unchanged writer contract, but
--     these read models never expose acoes.emitir=true for it (the PHASE-C5B gap);
--   * the C3C protected-mutation guard (db/75, trg_c3c_protected_mutation_guard)
--     is NOT modified: under legacy_active emission/allocation DML is permitted;
--     under maintenance_fenced/canonical_active it is denied. That denial is a
--     REAL_CUTOVER concern, out of C5A scope -- C5A local readiness is NOT
--     REAL_CUTOVER readiness;
--   * no product, UI, JavaScript, HTML, or CSS change.
--
-- Idempotent: REVOKE/GRANT and CREATE OR REPLACE FUNCTION converge on re-run.
-- Rollback = the block at the foot of this file (revoke the emitir grant, restore
-- the two db/69 read-model bodies). Already-emitted orders are never reversed; no
-- ordem_compra_eventos row is deleted; the allocation path is untouched.

BEGIN;

-- --------------------------------------------------------------------------
-- 1. Emission-writer grant (exact final ACL: only authenticated executes;
--    the internal is_admin() gate in db/68 stays authoritative).
-- --------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.emitir_ordem_compra(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.emitir_ordem_compra(BIGINT) IS
  'PHASE-C5A (§R.22.5/§R.23.8/§R.23.9). Native emission writer, ACTIVATED for the authenticated administrator: EXECUTE granted to authenticated only (PUBLIC/anon/service_role revoked); the internal is_admin() gate remains the authoritative actor check. Body byte-unchanged from db/68. Emits a native rascunho whose items are fully allocated; freezes the acceptance snapshot from ordem_compra_config.exige_aceite (nao_aplicavel while exige_aceite=FALSE); natural idempotency (estado_invalido on replay).';

-- --------------------------------------------------------------------------
-- 2. Read model (list): server-derive pode_emitir / acoes.emitir /
--    bloqueio_emissao. Body byte-preserved from db/69:913 except those three
--    fields and the added exige_aceite lookup.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listar_ordens_compra_admin(p_pedido_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordens JSONB; v_exige_aceite BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT exige_aceite INTO v_exige_aceite FROM public.ordem_compra_config WHERE id = 1;
  v_exige_aceite := COALESCE(v_exige_aceite, FALSE);

  SELECT COALESCE(jsonb_agg(j ORDER BY oid DESC), '[]'::jsonb)
  INTO v_ordens
  FROM (
    SELECT oc.id AS oid,
      jsonb_build_object(
        'ordem_id',              oc.id,
        'modelo',                CASE WHEN oc.legado THEN 'legado' ELSE 'nativo' END,
        'pedido_id',             oc.pedido_id,
        'fornecedor_id',         oc.fornecedor_id,
        'fornecedor_nome',       f.nome,
        'status_administrativo', oc.status_administrativo,
        'status_aceite',         oc.status_aceite,
        'status_recebimento',    oc.status_recebimento,
        'legado',                oc.legado,
        'legado_provenance',     oc.legado_provenance,
        'emitida_em',            oc.emitida_em,
        'itens_total',           (SELECT count(*) FROM public.ordem_compra_item i WHERE i.ordem_id = oc.id),
        'itens',                 COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
              'item_id',       i.id,
              'material',      i.material,
              'cor_id',        i.cor_id,
              'cor_poliester', i.cor_poliester,
              'cor_nome',      c.nome,
              'kg_pedido',     i.kg_pedido,
              'kg_recebido',   i.kg_recebido,
              'alocacoes',     (SELECT count(*) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id),
              'kg_alocado',    COALESCE((SELECT SUM(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0)
            ) ORDER BY i.id)
            FROM public.ordem_compra_item i
            LEFT JOIN public.cores c ON c.id = i.cor_id
            WHERE i.ordem_id = oc.id
          ), '[]'::jsonb),
        'acoes',                 CASE
            WHEN oc.legado THEN jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
            WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'distribuir', true, 'emitir', (public._distribuicao_completa_ordem(oc.id) AND NOT v_exige_aceite), 'receber', false)
            ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
          END,
        'distribuicao_completa', public._distribuicao_completa_ordem(oc.id),
        'pronta_para_emissao',   public._distribuicao_completa_ordem(oc.id),
        'pode_emitir',           (public._distribuicao_completa_ordem(oc.id) AND NOT v_exige_aceite),
        'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                      THEN CASE WHEN NOT public._distribuicao_completa_ordem(oc.id)
                                                THEN 'distribuicao_necessidades_pendente'
                                                WHEN v_exige_aceite
                                                THEN 'emissao_bloqueada_exige_aceite'
                                                ELSE NULL END
                                      ELSE NULL END
      ) AS j
    FROM public.ordem_compra oc
    LEFT JOIN public.fornecedores f ON f.id = oc.fornecedor_id
    WHERE p_pedido_id IS NULL OR oc.pedido_id = p_pedido_id
  ) s;

  RETURN jsonb_build_object('ok', true, 'ordens', v_ordens);
END;
$$;

REVOKE ALL ON FUNCTION public.listar_ordens_compra_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_ordens_compra_admin(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.listar_ordens_compra_admin(UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.listar_ordens_compra_admin(UUID) TO authenticated;

-- --------------------------------------------------------------------------
-- 3. Read model (single order): identical readiness derivation. Body
--    byte-preserved from db/69:987 except those three fields and the added
--    exige_aceite lookup.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.obter_ordem_compra_admin(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordem JSONB; v_eventos JSONB; v_completa BOOLEAN; v_legado BOOLEAN; v_status TEXT; v_exige_aceite BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT oc.legado, oc.status_administrativo INTO v_legado, v_status
  FROM public.ordem_compra oc WHERE oc.id = p_ordem_id;
  IF v_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;
  v_completa := public._distribuicao_completa_ordem(p_ordem_id);
  SELECT exige_aceite INTO v_exige_aceite FROM public.ordem_compra_config WHERE id = 1;
  v_exige_aceite := COALESCE(v_exige_aceite, FALSE);

  SELECT jsonb_build_object(
    'ordem_id',              oc.id,
    'modelo',                CASE WHEN oc.legado THEN 'legado' ELSE 'nativo' END,
    'pedido_id',             oc.pedido_id,
    'fornecedor_id',         oc.fornecedor_id,
    'fornecedor_nome',       f.nome,
    'status_administrativo', oc.status_administrativo,
    'status_aceite',         oc.status_aceite,
    'status_recebimento',    oc.status_recebimento,
    'legado',                oc.legado,
    'legado_provenance',     oc.legado_provenance,
    'emitida_em',            oc.emitida_em,
    'cancelada_em',          oc.cancelada_em,
    'itens_total',           (SELECT count(*) FROM public.ordem_compra_item i WHERE i.ordem_id = oc.id),
    'itens',                 COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'item_id',       i.id,
          'material',      i.material,
          'cor_id',        i.cor_id,
          'cor_poliester', i.cor_poliester,
          'cor_nome',      c.nome,
          'kg_pedido',     i.kg_pedido,
          'kg_recebido',   i.kg_recebido,
          'alocacoes',     (SELECT count(*) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id),
          'kg_alocado',    COALESCE((SELECT SUM(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0)
        ) ORDER BY i.id)
        FROM public.ordem_compra_item i
        LEFT JOIN public.cores c ON c.id = i.cor_id
        WHERE i.ordem_id = oc.id
      ), '[]'::jsonb),
    'acoes',                 CASE
        WHEN oc.legado THEN jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
        WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'distribuir', true, 'emitir', (v_completa AND NOT v_exige_aceite), 'receber', false)
        ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
      END,
    'distribuicao_completa', v_completa,
    'pronta_para_emissao',   v_completa,
    'pode_emitir',           (v_completa AND NOT v_exige_aceite),
    'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                  THEN CASE WHEN NOT v_completa THEN 'distribuicao_necessidades_pendente'
                                            WHEN v_exige_aceite THEN 'emissao_bloqueada_exige_aceite'
                                            ELSE NULL END
                                  ELSE NULL END
  )
  INTO v_ordem
  FROM public.ordem_compra oc
  LEFT JOIN public.fornecedores f ON f.id = oc.fornecedor_id
  WHERE oc.id = p_ordem_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', e.id, 'dimensao', e.dimensao, 'tipo_evento', e.tipo_evento,
      'valor_anterior', e.valor_anterior, 'valor_novo', e.valor_novo, 'criado_em', e.criado_em
    ) ORDER BY e.id), '[]'::jsonb)
  INTO v_eventos
  FROM public.ordem_compra_eventos e
  WHERE e.ordem_compra_id = p_ordem_id;

  RETURN jsonb_build_object('ok', true, 'ordem', v_ordem, 'eventos', v_eventos);
END;
$$;

REVOKE ALL ON FUNCTION public.obter_ordem_compra_admin(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obter_ordem_compra_admin(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.obter_ordem_compra_admin(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.obter_ordem_compra_admin(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.listar_ordens_compra_admin(UUID) IS
  'REFUND-B1 (§R.22.10) + PRE-PROD-A (§R.23.8) + PHASE-C5A (§R.23.9). Admin-only read model. pode_emitir/acoes.emitir now derive server-side: TRUE iff a native rascunho is fully distributed (_distribuicao_completa_ordem) AND ordem_compra_config.exige_aceite=FALSE. bloqueio_emissao is distribuicao_necessidades_pendente when incomplete, emissao_bloqueada_exige_aceite when complete but aceite is required (PHASE-C5B gap), else NULL.';
COMMENT ON FUNCTION public.obter_ordem_compra_admin(BIGINT) IS
  'REFUND-B1 (§R.22.10) + PRE-PROD-A (§R.23.8) + PHASE-C5A (§R.23.9). Admin-only single-order read model + events, with the same server-derived emission readiness as the list: pode_emitir/acoes.emitir TRUE only for a fully-distributed native rascunho with exige_aceite=FALSE; two-way-plus-aceite bloqueio_emissao.';

COMMIT;

-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- ============================================================================
-- ROLLBACK REHEARSAL (documentary; not executed on apply)
--
-- Restores the pre-C5A state byte-for-byte: revoke the emission grant (returning
-- emitir_ordem_compra to owner-only) and restore the db/69 terminal read-model
-- bodies (pode_emitir/acoes.emitir hard-coded false; the two-way bloqueio_emissao
-- with recebimento_nativo_ainda_inativo when complete). No business record is
-- deleted; a valid historical emission (status_administrativo='emitida' + its
-- ordem_compra_eventos row) is NEVER reversed by this rollback; the allocation
-- path and already-created drafts are unaffected.
--
--   BEGIN;
--   REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT)
--     FROM PUBLIC, anon, authenticated, service_role;   -- back to owner-only
--   -- then CREATE OR REPLACE public.listar_ordens_compra_admin(UUID) and
--   -- public.obter_ordem_compra_admin(BIGINT) with their db/69 terminal bodies
--   -- (pode_emitir=false, acoes.emitir=false, two-way bloqueio_emissao), and
--   -- restore their db/69 COMMENTs.
--   NOTIFY pgrst, 'reload schema';
--   COMMIT;
-- ============================================================================
