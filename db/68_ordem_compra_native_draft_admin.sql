-- ============================================================
-- Phase: ORDEM-COMPRA REFOUNDATION — REFUND-B1 (native draft admin)
-- Spec:  docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
--        §R.22 (REFUND-B1-CONTRACT-R2) — governs over §R.21.
-- Order: REFUND-B1-CONTRACT-R2 + REFUND-B1 IMPLEMENTATION ORDER, §14.
--
-- Scope (§R.22.2 / §R.22.13 — native DRAFT administrative authority only):
--   1. definir_item_ordem_compra  — create-or-get the single active native
--      draft for (pedido, supplier) and create-or-update the unique
--      (material, color) item. ABSOLUTE quantity (idempotent — sets, never
--      increments). No allocation / no need / no OP / no event. §R.22.3.
--   2. remover_item_ordem_compra  — remove a draft item (rejects legado /
--      non-rascunho / items with allocations). §R.22.4.
--   3. emitir_ordem_compra        — INSTALLED BUT INACTIVE: granted to NO
--      client role (owner-only, for rollback-safe tests). Rejects emission
--      unless every item is fully allocated with coherent Pedido ownership +
--      material/color identity. Because allocation is inactive in REFUND-B1,
--      no ordinary UI draft can satisfy this — intentional. §R.22.5.
--   4. cancelar_ordem_compra      — ACTIVE for native drafts (rascunho ->
--      cancelada), retains all items, one ordem_compra_id event. §R.22.7.
--   5. listar_ordens_compra_admin / obter_ordem_compra_admin — SECURITY
--      DEFINER read model, server-composed, native + imported-legacy each
--      once, server-derived allowed actions. §R.22.10.
--   6. Two partial unique indexes on ordem_compra_item guaranteeing one line
--      per (header, material, color) — strictly required as the DB backstop
--      for the idempotent definir writer (§R.22.3). This is the only
--      supporting object added.
--
-- Explicitly NOT authorized (order §14 / §R.22.8):
--   no compatibility-bridge RPC; no native_bridge rows; no flat
--   ordens_compra_fio shadow; no synthetic op_id; no allocation grant; no
--   allocation-schema change; no receipt-ledger activation; no opening
--   balance; no production-compatibility work; no unrelated table change; no
--   change to the db/66 flat emit/cancel RPCs or their grants.
--
-- Registered debt (§R.22.8): NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED.
--
-- ACL (§R.22.13): all client writers/readers SECURITY DEFINER + internal
-- is_admin(), EXECUTE to `authenticated` only, PUBLIC/anon/service_role
-- revoked; emitir_ordem_compra granted to NO role; no new-model client DML;
-- no anon grant (holds REFUND-A's clean bar, not the stale ordens_compra_fio
-- anon-UPDATE gap).
--
-- Idempotent: CREATE OR REPLACE FUNCTION / CREATE UNIQUE INDEX IF NOT EXISTS.
-- No BEGIN/COMMIT wrapper (pure DDL, db/66 pattern); no data seed; no
-- destructive DELETE; no secrets.
-- ============================================================


-- ============================================================
-- 0. Supporting backstop indexes (strictly required by definir_item)
--    One item line per (header, material, color). Legacy items are 1:1 per
--    header, so these hold against the seeded corpus.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_item_unico_algodao
  ON public.ordem_compra_item (ordem_id, cor_id)
  WHERE material = 'algodao';

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_item_unico_poliester
  ON public.ordem_compra_item (ordem_id, cor_poliester)
  WHERE material = 'poliester';


-- ============================================================
-- 1. public.definir_item_ordem_compra(...) — §R.22.3
--    Create-or-get the single active native draft for (pedido, supplier),
--    create-or-update the unique (material, color) item. ABSOLUTE quantity.
-- ============================================================

CREATE OR REPLACE FUNCTION public.definir_item_ordem_compra(
  p_pedido_id     UUID,
  p_fornecedor_id BIGINT,
  p_material      TEXT,
  p_cor_id        BIGINT,
  p_cor_poliester TEXT,
  p_kg_pedido     NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem_id     BIGINT;
  v_item_id      BIGINT;
  v_criado_ordem BOOLEAN := FALSE;
  v_criado_item  BOOLEAN := FALSE;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  -- Absolute positive quantity.
  IF p_kg_pedido IS NULL OR p_kg_pedido <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'kg_invalido', 'erro', 'Quantidade deve ser maior que zero');
  END IF;

  -- Canonical material/color identity (§R.3): cotton uses cor_id, polyester
  -- uses cor_poliester PRETO/BRANCO; exactly one axis.
  IF p_material NOT IN ('algodao', 'poliester') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'material_invalido', 'erro', 'Material invalido');
  END IF;
  IF p_material = 'algodao' THEN
    IF p_cor_id IS NULL OR p_cor_poliester IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'cor_invalida', 'erro', 'Algodao exige cor_id e nao cor_poliester');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cores WHERE id = p_cor_id) THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'cor_invalida', 'erro', 'Cor inexistente');
    END IF;
  ELSE
    IF p_cor_id IS NOT NULL OR p_cor_poliester IS NULL OR p_cor_poliester NOT IN ('PRETO', 'BRANCO') THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'cor_invalida', 'erro', 'Poliester exige cor_poliester PRETO/BRANCO e nao cor_id');
    END IF;
  END IF;

  -- Supplier + Pedido must exist. Supplier is mandatory for a native order.
  IF p_fornecedor_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.fornecedores WHERE id = p_fornecedor_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fornecedor_invalido', 'erro', 'Fornecedor inexistente');
  END IF;
  IF p_pedido_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.pedidos WHERE id = p_pedido_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_invalido', 'erro', 'Pedido inexistente');
  END IF;

  -- Serialize get-or-create for this (pedido, supplier). The partial unique
  -- index ordem_compra_um_rascunho_ativo is the structural backstop.
  PERFORM pg_advisory_xact_lock(hashtext('oc_native_draft'),
                                hashtext(p_pedido_id::text || ':' || p_fornecedor_id::text));

  SELECT id INTO v_ordem_id
  FROM public.ordem_compra
  WHERE pedido_id = p_pedido_id
    AND fornecedor_id = p_fornecedor_id
    AND legado = FALSE
    AND status_administrativo = 'rascunho'
  FOR UPDATE;

  IF v_ordem_id IS NULL THEN
    INSERT INTO public.ordem_compra
      (pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado)
    VALUES (p_pedido_id, p_fornecedor_id, 'rascunho', 'nao_aplicavel', 'nao_recebido', FALSE)
    RETURNING id INTO v_ordem_id;
    v_criado_ordem := TRUE;
  END IF;

  -- Create-or-update the unique (material, color) item. ABSOLUTE quantity:
  -- kg_pedido is SET, never accumulated (idempotent — Defect 2 fix).
  IF p_material = 'algodao' THEN
    SELECT id INTO v_item_id FROM public.ordem_compra_item
    WHERE ordem_id = v_ordem_id AND material = 'algodao' AND cor_id = p_cor_id;
  ELSE
    SELECT id INTO v_item_id FROM public.ordem_compra_item
    WHERE ordem_id = v_ordem_id AND material = 'poliester' AND cor_poliester = p_cor_poliester;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.ordem_compra_item
      (ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido)
    VALUES (v_ordem_id, p_material, p_cor_id, p_cor_poliester, p_kg_pedido, 0)
    RETURNING id INTO v_item_id;
    v_criado_item := TRUE;
  ELSE
    UPDATE public.ordem_compra_item SET kg_pedido = p_kg_pedido WHERE id = v_item_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'codigo', 'ok',
    'ordem_compra_id', v_ordem_id,
    'ordem_compra_item_id', v_item_id,
    'criado_ordem', v_criado_ordem,
    'criado_item', v_criado_item,
    'kg_pedido_final', p_kg_pedido
  );
END;
$$;

REVOKE ALL ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC) FROM service_role;
GRANT EXECUTE ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC) IS
  'REFUND-B1 (§R.22.3). Admin-only. Create-or-get the single active native draft (rascunho, legado=FALSE) for (pedido, supplier) and create-or-update its unique (material, color) item. p_kg_pedido is the ABSOLUTE item quantity (idempotent — set, never incremented). No allocation/need/OP/event. Advisory-locked per (pedido, supplier); partial unique index ordem_compra_um_rascunho_ativo is the backstop.';


-- ============================================================
-- 2. public.remover_item_ordem_compra(BIGINT) — §R.22.4
-- ============================================================

CREATE OR REPLACE FUNCTION public.remover_item_ordem_compra(p_item_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item  RECORD;
  v_ordem RECORD;
  v_aloc  INT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_item FROM public.ordem_compra_item WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrado', 'erro', 'Item nao encontrado');
  END IF;

  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = v_item.ordem_id FOR UPDATE;
  IF v_ordem.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_legado', 'erro', 'Ordem legado nao pode ser alterada');
  END IF;
  IF v_ordem.status_administrativo <> 'rascunho' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente rascunho pode ter itens removidos');
  END IF;

  SELECT count(*) INTO v_aloc FROM public.ordem_compra_item_alocacao WHERE item_id = p_item_id;
  IF v_aloc > 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'possui_alocacao', 'erro', 'Item com alocacao nao pode ser removido');
  END IF;

  -- Delete only the draft item; never the parent order (an empty draft may
  -- remain, receive another item later, or be cancelled).
  DELETE FROM public.ordem_compra_item WHERE id = p_item_id;

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok',
    'ordem_compra_id', v_ordem.id, 'ordem_compra_item_id', p_item_id);
END;
$$;

REVOKE ALL ON FUNCTION public.remover_item_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remover_item_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.remover_item_ordem_compra(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.remover_item_ordem_compra(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.remover_item_ordem_compra(BIGINT) IS
  'REFUND-B1 (§R.22.4). Admin-only. Removes a draft item from a native rascunho order. Rejects legado, non-rascunho, and items with any allocation. Never deletes the parent order. No lifecycle event.';


-- ============================================================
-- 3. public.emitir_ordem_compra(BIGINT) — §R.22.5
--    INSTALLED BUT INACTIVE: granted to NO client role. Owner-only, for
--    rollback-safe tests. Full-allocation precondition.
-- ============================================================

CREATE OR REPLACE FUNCTION public.emitir_ordem_compra(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem         RECORD;
  v_itens         INT;
  v_itens_ruins   INT;
  v_exige_aceite  BOOLEAN;
  v_status_aceite TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = p_ordem_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;
  IF v_ordem.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_legado', 'erro', 'Ordem legado nao pode ser emitida por esta via');
  END IF;
  IF v_ordem.status_administrativo <> 'rascunho' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente rascunho pode ser emitida');
  END IF;
  IF v_ordem.fornecedor_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_fornecedor', 'erro', 'Ordem sem fornecedor');
  END IF;

  SELECT count(*) INTO v_itens FROM public.ordem_compra_item WHERE ordem_id = p_ordem_id;
  IF v_itens = 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_itens', 'erro', 'Ordem sem itens');
  END IF;

  -- Every item must have >= 1 allocation AND SUM(active alloc kg) = kg_pedido.
  SELECT count(*) INTO v_itens_ruins
  FROM public.ordem_compra_item i
  LEFT JOIN (
    SELECT item_id, count(*) AS n, COALESCE(SUM(kg_alocado), 0) AS soma
    FROM public.ordem_compra_item_alocacao
    GROUP BY item_id
  ) a ON a.item_id = i.id
  WHERE i.ordem_id = p_ordem_id
    AND (COALESCE(a.n, 0) = 0 OR a.soma <> i.kg_pedido);
  IF v_itens_ruins > 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alocacao_incompleta',
      'erro', 'Itens sem alocacao completa', 'itens_pendentes', v_itens_ruins);
  END IF;

  -- Every allocation must belong to a need with matching Pedido ownership and
  -- the immutable material/color identity of its item. Never fabricate OP
  -- provenance.
  IF EXISTS (
    SELECT 1
    FROM public.ordem_compra_item i
    JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
    JOIN public.necessidade_compra_fio n ON n.id = a.necessidade_id
    WHERE i.ordem_id = p_ordem_id
      AND (   n.pedido_id     IS DISTINCT FROM v_ordem.pedido_id
           OR n.material      <> i.material
           OR n.cor_id        IS DISTINCT FROM i.cor_id
           OR n.cor_poliester IS DISTINCT FROM i.cor_poliester )
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alocacao_incoerente',
      'erro', 'Alocacao com ownership/identidade incoerente');
  END IF;

  -- Freeze the acceptance snapshot and transition atomically.
  SELECT exige_aceite INTO v_exige_aceite FROM public.ordem_compra_config WHERE id = 1;
  v_exige_aceite := COALESCE(v_exige_aceite, FALSE);
  v_status_aceite := CASE WHEN v_exige_aceite THEN 'pendente' ELSE 'nao_aplicavel' END;

  UPDATE public.ordem_compra
  SET status_administrativo     = 'emitida',
      aceite_exigido_na_emissao = v_exige_aceite,
      status_aceite             = v_status_aceite,
      emitida_em                = now(),
      emitida_por               = auth.uid()
  WHERE id = p_ordem_id;

  -- One event on the NEW model parent; ordem_compra_fio_id stays NULL.
  INSERT INTO public.ordem_compra_eventos
    (ordem_compra_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por)
  VALUES (p_ordem_id, 'administrativo', 'emitida', 'rascunho', 'emitida',
    jsonb_build_object('aceite_exigido_na_emissao', v_exige_aceite, 'status_aceite', v_status_aceite),
    auth.uid());

  -- Post-emission immutability of items/allocations holds by construction:
  -- the draft writers reject non-rascunho orders and the allocation writer is
  -- ungranted, so no active writer can mutate an emitted order.
  RETURN jsonb_build_object('ok', true, 'codigo', 'ok',
    'ordem_compra_id', p_ordem_id, 'status_administrativo', 'emitida', 'status_aceite', v_status_aceite);
END;
$$;

-- INSTALLED BUT INACTIVE (§R.22.5): no client grant. Only postgres/owner may
-- execute (rollback-safe tests). PRE-PROD grants EXECUTE after the allocation
-- path and LIVE_ALLOCATION_T1_T2_TEST_PENDING are resolved.
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM authenticated;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM service_role;

COMMENT ON FUNCTION public.emitir_ordem_compra(BIGINT) IS
  'REFUND-B1 (§R.22.5). INSTALLED BUT INACTIVE — granted to NO client role (owner-only, rollback-safe tests). Admin-gated internally. Rejects emission unless native + rascunho + fornecedor + >=1 item + every item fully allocated (SUM(active alloc)=kg_pedido, matching Pedido ownership + material/color identity). Because allocation is inactive in REFUND-B1, no ordinary UI draft can satisfy this. Never fabricates OP provenance, never creates a flat shadow. PRE-PROD grants EXECUTE.';


-- ============================================================
-- 4. public.cancelar_ordem_compra(BIGINT) — §R.22.7
--    ACTIVE for native drafts (rascunho -> cancelada). Retains all items.
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancelar_ordem_compra(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordem RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = p_ordem_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;
  IF v_ordem.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_legado', 'erro', 'Ordem legado nao pode ser cancelada por esta via');
  END IF;
  -- REFUND-B1 cancels DRAFTS only; emitted-order cancellation is PRE-PROD+.
  IF v_ordem.status_administrativo <> 'rascunho' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente rascunho pode ser cancelada nesta fase');
  END IF;

  UPDATE public.ordem_compra
  SET status_administrativo = 'cancelada',
      cancelada_em          = now(),
      cancelada_por         = auth.uid()
  WHERE id = p_ordem_id;

  INSERT INTO public.ordem_compra_eventos
    (ordem_compra_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por)
  VALUES (p_ordem_id, 'administrativo', 'cancelada', 'rascunho', 'cancelada', '{}'::jsonb, auth.uid());

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok',
    'ordem_compra_id', p_ordem_id, 'status_administrativo', 'cancelada');
END;
$$;

REVOKE ALL ON FUNCTION public.cancelar_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancelar_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.cancelar_ordem_compra(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_ordem_compra(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.cancelar_ordem_compra(BIGINT) IS
  'REFUND-B1 (§R.22.7). Admin-only. Cancels a native DRAFT (rascunho -> cancelada). Retains all items, deletes nothing, writes one ordem_compra_id administrative event. Terminal; repeated cancellation returns estado_invalido. Emitted-order cancellation is deferred to PRE-PROD/Phase C.';


-- ============================================================
-- 5. Read model (§R.22.10) — SECURITY DEFINER, server-composed.
--    Native + imported-legacy each once; server-derived allowed actions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.listar_ordens_compra_admin(p_pedido_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordens JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

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
            WHEN oc.legado THEN jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'emitir', false, 'receber', false)
            WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'emitir', false, 'receber', false)
            ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'emitir', false, 'receber', false)
          END,
        'pode_emitir',           false,
        'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                      THEN 'distribuicao_necessidades_pendente' ELSE NULL END
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

COMMENT ON FUNCTION public.listar_ordens_compra_admin(UUID) IS
  'REFUND-B1 (§R.22.10). Admin-only read model. Server-composed list of purchase orders (native + imported-legacy, each once) optionally filtered by Pedido. Model discriminator + server-derived allowed actions (native draft: editar_itens/remover_itens/cancelar=true, emitir/receber=false, bloqueio_emissao=distribuicao_necessidades_pendente; legado + non-draft: all false). Never infers receipt authority from client joins.';


CREATE OR REPLACE FUNCTION public.obter_ordem_compra_admin(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordem JSONB; v_eventos JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

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
        WHEN oc.legado THEN jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'emitir', false, 'receber', false)
        WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'emitir', false, 'receber', false)
        ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'emitir', false, 'receber', false)
      END,
    'pode_emitir',           false,
    'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                  THEN 'distribuicao_necessidades_pendente' ELSE NULL END
  )
  INTO v_ordem
  FROM public.ordem_compra oc
  LEFT JOIN public.fornecedores f ON f.id = oc.fornecedor_id
  WHERE oc.id = p_ordem_id;

  IF v_ordem IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',             e.id,
      'dimensao',       e.dimensao,
      'tipo_evento',    e.tipo_evento,
      'valor_anterior', e.valor_anterior,
      'valor_novo',     e.valor_novo,
      'criado_em',      e.criado_em
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

COMMENT ON FUNCTION public.obter_ordem_compra_admin(BIGINT) IS
  'REFUND-B1 (§R.22.10). Admin-only read model for one order + its ordem_compra_eventos history. Same server-composed shape and allowed-action derivation as listar_ordens_compra_admin.';


-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
