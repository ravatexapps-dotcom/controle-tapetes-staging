-- ============================================================
-- Phase: ORDEM-COMPRA REFOUNDATION — PRE-PROD-A (native needs, allocation,
--        live concurrency)
-- Spec:  docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
--        §R.23 (PRE-PROD-A-R1) — governs PRE-PROD-A over §R.17/§R.22.12.
-- Order: PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY.
--
-- Scope (order §§6-18):
--   1. pedido_compra_fio_regime — immutable per-Pedido purchasing regime,
--      + immutability guard + resolver_regime_compra_fio_pedido (§6).
--   2. avaliar_necessidades_compra_fio (read-only preview) and
--      sincronizar_necessidades_compra_fio (canonical writer), both deriving
--      demand SERVER-SIDE from op_itens -> modelos -> parametros_largura for
--      eligible aberta/em_producao tecelagem OPs (§8/§9). The authoritative
--      formula is the SQL image of js/calculo-op.js calcularFiosOP +
--      montarOrdensCompraFio; parity proven against staging (0.000 kg drift).
--   3. Hardened ABSOLUTE/idempotent alocar_necessidade_compra_fio on identity
--      (item, necessidade, op) + the uniqueness index (§10/§11).
--   4. remover_alocacao_compra_fio (§12).
--   5. Post-emission item/allocation mutation guards — DB backstop (§13).
--   6. obter_distribuicao_ordem_compra + read-model block-reason replacements
--      (§14).
--
-- Explicitly NOT authorized (order §15/§18): no emission grant
-- (emitir_ordem_compra stays ungranted); no compatibility bridge / native_bridge
-- rows; no flat ordens_compra_fio shadow; no receipt-ledger activation; no
-- saldo_fios movement; no native receipt; no unrelated schema change.
--
-- ACL (order §18): every new client RPC is SECURITY DEFINER + internal
-- is_admin(), EXECUTE to `authenticated` only, PUBLIC/anon/service_role revoked;
-- the new table gets SELECT to authenticated under is_admin() and no client DML
-- policy.
--
-- Concurrency (order §20-22): the hardened allocation writer locks the target
-- necessidade_compra_fio row with SELECT ... FOR UPDATE. Granting EXECUTE here
-- makes the writer callable, but the APPLICATION allocation controls stay
-- feature-disabled until the real authenticated two-session T1/T2 test passes
-- and closes LIVE_ALLOCATION_T1_T2_TEST_PENDING (order §22 step 5). The transient
-- probe/fixtures used by that test are NOT part of this migration.
--
-- Idempotent: CREATE TABLE / INDEX IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
-- DROP TRIGGER IF EXISTS. Transactional (BEGIN/COMMIT) with an allocation-identity
-- uniqueness preflight that fails loudly. No data seed. No destructive DELETE of
-- existing rows. No secrets.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. public.pedido_compra_fio_regime — immutable per-Pedido purchasing regime
--    (order §6). One regime per Pedido; no client DML; classification is
--    permanent (legacy | native).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedido_compra_fio_regime (
  pedido_id    UUID PRIMARY KEY REFERENCES public.pedidos(id) ON DELETE CASCADE,
  modelo       TEXT NOT NULL CHECK (modelo IN ('legacy', 'native')),
  origem       TEXT NOT NULL,
  definido_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  definido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.pedido_compra_fio_regime IS
  'PRE-PROD-A (§R.23.1). Immutable per-Pedido yarn-purchasing regime. modelo=legacy for any Pedido carrying pre-existing flat purchasing evidence, else native. Set once by resolver_regime_compra_fio_pedido; UPDATE is always rejected and direct DELETE is rejected while the Pedido exists (only ON DELETE CASCADE from pedidos removes it). No client DML surface.';
COMMENT ON COLUMN public.pedido_compra_fio_regime.origem IS
  'Provenance of the classification decision (e.g. legacy_seed_ordens_compra_fio, legacy_seed_necessidade, legacy_seed_ordem_compra, native_first_resolution).';

ALTER TABLE public.pedido_compra_fio_regime ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pedido_compra_fio_regime FROM PUBLIC;
REVOKE ALL ON TABLE public.pedido_compra_fio_regime FROM anon;
REVOKE ALL ON TABLE public.pedido_compra_fio_regime FROM authenticated;

GRANT SELECT ON TABLE public.pedido_compra_fio_regime TO authenticated;

DROP POLICY IF EXISTS pedido_compra_fio_regime_admin_select ON public.pedido_compra_fio_regime;
CREATE POLICY pedido_compra_fio_regime_admin_select ON public.pedido_compra_fio_regime FOR SELECT
  USING (is_admin());
-- No INSERT/UPDATE/DELETE policy for any client role: the resolver RPC is the
-- only write surface, and it is SECURITY DEFINER.


-- ------------------------------------------------------------
-- 1b. Immutability guard (order §6). Blocks UPDATE unconditionally and blocks
--     direct DELETE while the parent Pedido still exists; a cascade DELETE from
--     pedidos (parent already gone in-transaction) is allowed so Pedido removal
--     is not broken. Fires regardless of caller (incl. service_role/migration).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_regime_immutable_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'pedido_compra_fio_regime is immutable: UPDATE is not permitted (pedido_id=%)', OLD.pedido_id;
  END IF;
  -- TG_OP = 'DELETE'
  IF EXISTS (SELECT 1 FROM public.pedidos WHERE id = OLD.pedido_id) THEN
    RAISE EXCEPTION 'pedido_compra_fio_regime cannot be deleted while its Pedido exists (pedido_id=%)', OLD.pedido_id;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_regime_immutable_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_regime_immutable_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_regime_immutable_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_regime_immutable_guard() FROM service_role;

COMMENT ON FUNCTION public.trg_regime_immutable_guard() IS
  'PRE-PROD-A (§R.23.1) DB backstop: rejects UPDATE of any regime row and rejects direct DELETE while the parent Pedido exists; allows only the ON DELETE CASCADE from pedidos.';

DROP TRIGGER IF EXISTS regime_immutable_guard ON public.pedido_compra_fio_regime;
CREATE TRIGGER regime_immutable_guard
  BEFORE UPDATE OR DELETE ON public.pedido_compra_fio_regime
  FOR EACH ROW EXECUTE FUNCTION public.trg_regime_immutable_guard();


-- ------------------------------------------------------------
-- 1c. resolver_regime_compra_fio_pedido(UUID) — get-or-create the regime,
--     detecting historical legacy evidence before creating native (order §6).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolver_regime_compra_fio_pedido(p_pedido_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modelo TEXT;
  v_origem TEXT;
  v_has_flat   BOOLEAN;
  v_has_need   BOOLEAN;
  v_has_ordem  BOOLEAN;
  v_has_compat BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  IF p_pedido_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.pedidos WHERE id = p_pedido_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_invalido', 'erro', 'Pedido inexistente');
  END IF;

  -- Serialize the first resolution for this Pedido.
  PERFORM pg_advisory_xact_lock(hashtext('pedido_compra_fio_regime'), hashtext(p_pedido_id::text));

  SELECT modelo INTO v_modelo FROM public.pedido_compra_fio_regime WHERE pedido_id = p_pedido_id;
  IF v_modelo IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'pedido_id', p_pedido_id,
                              'modelo', v_modelo, 'criado', false);
  END IF;

  -- Legacy evidence detection (order §6): any flat purchasing row, any legado
  -- need, any imported legacy header, or any imported compatibility mapping.
  v_has_flat := EXISTS (
    SELECT 1 FROM public.ordens_compra_fio ocf
    JOIN public.ops o ON o.id = ocf.op_id
    JOIN public.lotes l ON l.id = o.lote_id
    WHERE l.pedido_id = p_pedido_id);
  v_has_need := EXISTS (
    SELECT 1 FROM public.necessidade_compra_fio
    WHERE pedido_id = p_pedido_id AND legado = TRUE);
  v_has_ordem := EXISTS (
    SELECT 1 FROM public.ordem_compra
    WHERE pedido_id = p_pedido_id AND legado = TRUE);
  v_has_compat := EXISTS (
    SELECT 1 FROM public.ordem_compra_item_compat_fio cf
    JOIN public.ordem_compra_item i ON i.id = cf.ordem_compra_item_id
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE oc.pedido_id = p_pedido_id AND cf.origem = 'imported_legacy');

  IF v_has_flat OR v_has_need OR v_has_ordem OR v_has_compat THEN
    v_modelo := 'legacy';
    v_origem := CASE
                  WHEN v_has_flat   THEN 'legacy_seed_ordens_compra_fio'
                  WHEN v_has_need   THEN 'legacy_seed_necessidade'
                  WHEN v_has_ordem  THEN 'legacy_seed_ordem_compra'
                  ELSE 'legacy_seed_compat'
                END;
  ELSE
    v_modelo := 'native';
    v_origem := 'native_first_resolution';
  END IF;

  INSERT INTO public.pedido_compra_fio_regime (pedido_id, modelo, origem, definido_por)
  VALUES (p_pedido_id, v_modelo, v_origem, auth.uid());

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'pedido_id', p_pedido_id,
                            'modelo', v_modelo, 'criado', true, 'origem', v_origem);
END;
$$;

REVOKE ALL ON FUNCTION public.resolver_regime_compra_fio_pedido(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolver_regime_compra_fio_pedido(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.resolver_regime_compra_fio_pedido(UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.resolver_regime_compra_fio_pedido(UUID) TO authenticated;

COMMENT ON FUNCTION public.resolver_regime_compra_fio_pedido(UUID) IS
  'PRE-PROD-A (§R.23.1). Admin-only, transactional, advisory-locked get-or-create of the Pedido purchasing regime. Returns an existing regime unchanged; otherwise classifies legacy on any historical flat/legado/imported evidence, else native. Idempotent.';


-- ============================================================
-- 2. Native need assessment — avaliar (preview) + sincronizar (writer)
--    (order §8/§9). Demand is derived SERVER-SIDE; ordens_compra_fio is never
--    the source. Cotton: per (Pedido, OP, cor_id); shared polyester: per
--    (Pedido, cor_poliester) aggregated across the Pedido's eligible OPs.
-- ============================================================

CREATE OR REPLACE FUNCTION public.avaliar_necessidades_compra_fio(p_pedido_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modelo TEXT;
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;
  IF p_pedido_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.pedidos WHERE id = p_pedido_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_invalido', 'erro', 'Pedido inexistente');
  END IF;

  SELECT modelo INTO v_modelo FROM public.pedido_compra_fio_regime WHERE pedido_id = p_pedido_id;
  IF v_modelo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_regime', 'erro', 'Regime de compra nao resolvido para o Pedido');
  END IF;
  IF v_modelo <> 'native' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'regime_nao_nativo', 'erro', 'Pedido nao e nativo', 'modelo', v_modelo);
  END IF;

  -- Read-only plan (no writes).
  WITH params AS (
    SELECT round(largura::numeric, 2) AS lk, algodao_por_ml, poliester_por_ml, valor_x
    FROM public.parametros_largura
  ),
  elig AS (
    SELECT o.id AS op_id
    FROM public.ops o JOIN public.lotes l ON l.id = o.lote_id
    WHERE l.pedido_id = p_pedido_id AND o.status IN ('aberta', 'em_producao') AND o.tipo = 'tecelagem'
  ),
  cotton AS (
    SELECT 'op'::text AS origem_tipo, oi.op_id, 'algodao'::text AS material,
           cc.cor_id, NULL::text AS cor_poliester,
           round(sum(p.algodao_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) AS kg
    FROM public.op_itens oi
    JOIN elig e ON e.op_id = oi.op_id
    JOIN public.modelos m ON m.id = oi.modelo_id
    JOIN params p ON p.lk = round(m.largura::numeric, 2)
    CROSS JOIN LATERAL (VALUES (m.cor_1_id), (m.cor_2_id)) AS cc(cor_id)
    GROUP BY oi.op_id, cc.cor_id
    HAVING round(sum(p.algodao_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) > 0
  ),
  poly_perop AS (
    SELECT oi.op_id, pc.cp,
           round(sum(p.poliester_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) AS kg
    FROM public.op_itens oi
    JOIN elig e ON e.op_id = oi.op_id
    JOIN public.modelos m ON m.id = oi.modelo_id
    JOIN params p ON p.lk = round(m.largura::numeric, 2)
    CROSS JOIN LATERAL (VALUES ('PRETO'), ('BRANCO')) AS pc(cp)
    GROUP BY oi.op_id, pc.cp
  ),
  poly AS (
    SELECT 'pedido'::text AS origem_tipo, NULL::bigint AS op_id, 'poliester'::text AS material,
           NULL::bigint AS cor_id, cp AS cor_poliester, sum(kg) AS kg
    FROM poly_perop GROUP BY cp HAVING sum(kg) > 0
  ),
  tgt AS (
    SELECT origem_tipo, op_id, material, cor_id, cor_poliester, kg,
           material || ':' || coalesce(op_id::text, '') || ':' || coalesce(cor_id::text, '') || ':' || coalesce(cor_poliester, '') AS key
    FROM (SELECT * FROM cotton UNION ALL SELECT * FROM poly) u
  ),
  existing AS (
    SELECT id, op_id, material, cor_id, cor_poliester, kg_necessario, kg_alocado,
           material || ':' || coalesce(op_id::text, '') || ':' || coalesce(cor_id::text, '') || ':' || coalesce(cor_poliester, '') AS key
    FROM public.necessidade_compra_fio
    WHERE pedido_id = p_pedido_id AND legado = FALSE
  ),
  plan AS (
    SELECT coalesce(t.key, e.key) AS key, t.origem_tipo, t.op_id AS t_op, t.cor_id AS t_cor,
           t.cor_poliester AS t_cp, t.kg AS t_kg, e.id AS e_id, e.kg_necessario AS e_kg, e.kg_alocado AS e_aloc,
           CASE WHEN e.id IS NULL THEN 'create'
                WHEN t.key IS NULL THEN 'delete'
                WHEN t.kg = e.kg_necessario THEN 'unchanged'
                ELSE 'update' END AS action
    FROM tgt t FULL JOIN existing e ON e.key = t.key
  )
  SELECT jsonb_build_object(
    'created',   coalesce(count(*) FILTER (WHERE action = 'create'), 0),
    'updated',   coalesce(count(*) FILTER (WHERE action = 'update'), 0),
    'deleted',   coalesce(count(*) FILTER (WHERE action = 'delete'), 0),
    'unchanged', coalesce(count(*) FILTER (WHERE action = 'unchanged'), 0),
    'detalhes',  coalesce(jsonb_agg(jsonb_build_object(
                    'acao', action, 'origem_tipo', origem_tipo, 'op_id', t_op,
                    'cor_id', t_cor, 'cor_poliester', t_cp,
                    'kg_atual', e_kg, 'kg_novo', t_kg, 'kg_alocado', e_aloc)), '[]'::jsonb)
  ) INTO v_result FROM plan;

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'pedido_id', p_pedido_id, 'preview', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.avaliar_necessidades_compra_fio(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.avaliar_necessidades_compra_fio(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.avaliar_necessidades_compra_fio(UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.avaliar_necessidades_compra_fio(UUID) TO authenticated;

COMMENT ON FUNCTION public.avaliar_necessidades_compra_fio(UUID) IS
  'PRE-PROD-A (§R.23.4). Admin-only, native-regime-only, READ-ONLY preview of the native need synchronization plan (created/updated/deleted/unchanged) derived server-side from production demand. No writes.';


CREATE OR REPLACE FUNCTION public.sincronizar_necessidades_compra_fio(p_pedido_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_modelo    TEXT;
  v_conflicts JSONB;
  v_created   INT := 0;
  v_updated   INT := 0;
  v_deleted   INT := 0;
  v_unchanged INT := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;
  IF p_pedido_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.pedidos WHERE id = p_pedido_id) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_invalido', 'erro', 'Pedido inexistente');
  END IF;

  SELECT modelo INTO v_modelo FROM public.pedido_compra_fio_regime WHERE pedido_id = p_pedido_id;
  IF v_modelo IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_regime', 'erro', 'Regime de compra nao resolvido para o Pedido');
  END IF;
  IF v_modelo <> 'native' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'regime_nao_nativo', 'erro', 'Pedido nao e nativo', 'modelo', v_modelo);
  END IF;

  -- Build the reconciliation plan into a transaction-local temp table.
  -- DROP-first so repeated calls in one transaction (tests/batches) are safe;
  -- via PostgREST each call is its own transaction and ON COMMIT DROP suffices.
  DROP TABLE IF EXISTS _sync_plan;
  CREATE TEMP TABLE _sync_plan ON COMMIT DROP AS
  WITH params AS (
    SELECT round(largura::numeric, 2) AS lk, algodao_por_ml, poliester_por_ml, valor_x
    FROM public.parametros_largura
  ),
  elig AS (
    SELECT o.id AS op_id
    FROM public.ops o JOIN public.lotes l ON l.id = o.lote_id
    WHERE l.pedido_id = p_pedido_id AND o.status IN ('aberta', 'em_producao') AND o.tipo = 'tecelagem'
  ),
  cotton AS (
    SELECT 'op'::text AS origem_tipo, oi.op_id, 'algodao'::text AS material,
           cc.cor_id, NULL::text AS cor_poliester,
           round(sum(p.algodao_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) AS kg
    FROM public.op_itens oi
    JOIN elig e ON e.op_id = oi.op_id
    JOIN public.modelos m ON m.id = oi.modelo_id
    JOIN params p ON p.lk = round(m.largura::numeric, 2)
    CROSS JOIN LATERAL (VALUES (m.cor_1_id), (m.cor_2_id)) AS cc(cor_id)
    GROUP BY oi.op_id, cc.cor_id
    HAVING round(sum(p.algodao_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) > 0
  ),
  poly_perop AS (
    SELECT oi.op_id, pc.cp,
           round(sum(p.poliester_por_ml * p.valor_x * oi.metros_pedidos)::numeric, 3) AS kg
    FROM public.op_itens oi
    JOIN elig e ON e.op_id = oi.op_id
    JOIN public.modelos m ON m.id = oi.modelo_id
    JOIN params p ON p.lk = round(m.largura::numeric, 2)
    CROSS JOIN LATERAL (VALUES ('PRETO'), ('BRANCO')) AS pc(cp)
    GROUP BY oi.op_id, pc.cp
  ),
  poly AS (
    SELECT 'pedido'::text AS origem_tipo, NULL::bigint AS op_id, 'poliester'::text AS material,
           NULL::bigint AS cor_id, cp AS cor_poliester, sum(kg) AS kg
    FROM poly_perop GROUP BY cp HAVING sum(kg) > 0
  ),
  tgt AS (
    SELECT origem_tipo, op_id, material, cor_id, cor_poliester, kg,
           material || ':' || coalesce(op_id::text, '') || ':' || coalesce(cor_id::text, '') || ':' || coalesce(cor_poliester, '') AS key
    FROM (SELECT * FROM cotton UNION ALL SELECT * FROM poly) u
  ),
  existing AS (
    SELECT id, op_id, material, cor_id, cor_poliester, kg_necessario, kg_alocado,
           material || ':' || coalesce(op_id::text, '') || ':' || coalesce(cor_id::text, '') || ':' || coalesce(cor_poliester, '') AS key
    FROM public.necessidade_compra_fio
    WHERE pedido_id = p_pedido_id AND legado = FALSE
  )
  SELECT
    coalesce(t.key, e.key) AS key,
    t.origem_tipo, t.op_id AS t_op, t.material AS t_mat, t.cor_id AS t_cor, t.cor_poliester AS t_cp, t.kg AS t_kg,
    e.id AS e_id, e.kg_necessario AS e_kg, e.kg_alocado AS e_aloc,
    (SELECT count(*) FROM public.ordem_compra_item_alocacao a WHERE a.necessidade_id = e.id) AS e_alloc_rows,
    EXISTS (
      SELECT 1 FROM public.ordem_compra_item_alocacao a
      JOIN public.ordem_compra_item i ON i.id = a.item_id
      JOIN public.ordem_compra oc ON oc.id = i.ordem_id
      WHERE a.necessidade_id = e.id AND oc.status_administrativo <> 'rascunho'
    ) AS e_nondraft,
    CASE WHEN e.id IS NULL THEN 'create'
         WHEN t.key IS NULL THEN 'delete'
         WHEN t.kg = e.kg_necessario THEN 'unchanged'
         ELSE 'update' END AS action
  FROM tgt t FULL JOIN existing e ON e.key = t.key;

  -- Conflicts (order §9): decrease below allocation; any mutation touching
  -- allocations on a non-draft order; obsolete need still carrying allocations.
  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'motivo', motivo, 'necessidade_id', e_id, 'op_id', t_op,
           'cor_id', t_cor, 'cor_poliester', t_cp, 'kg_atual', e_kg,
           'kg_novo', t_kg, 'kg_alocado', e_aloc)), '[]'::jsonb)
  INTO v_conflicts
  FROM (
    SELECT *,
      CASE
        WHEN action = 'update' AND t_kg < e_aloc THEN 'diminui_abaixo_do_alocado'
        WHEN action IN ('update', 'delete') AND e_nondraft THEN 'alocacao_em_ordem_nao_rascunho'
        WHEN action = 'delete' AND (e_aloc > 0 OR e_alloc_rows > 0) THEN 'obsoleta_com_alocacao'
        ELSE NULL
      END AS motivo
    FROM _sync_plan
  ) c
  WHERE motivo IS NOT NULL;

  IF jsonb_array_length(v_conflicts) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'conflito',
      'erro', 'Sincronizacao rejeitada por conflito de alocacao', 'conflicts', v_conflicts);
  END IF;

  -- Apply (all-or-nothing; the whole function is one transaction).
  DELETE FROM public.necessidade_compra_fio
  WHERE id IN (SELECT e_id FROM _sync_plan WHERE action = 'delete');
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  UPDATE public.necessidade_compra_fio n
  SET kg_necessario = pl.t_kg
  FROM _sync_plan pl
  WHERE pl.action = 'update' AND n.id = pl.e_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  INSERT INTO public.necessidade_compra_fio
    (pedido_id, origem_tipo, op_id, material, cor_id, cor_poliester, kg_necessario, kg_alocado, legado)
  SELECT p_pedido_id, origem_tipo, t_op, t_mat, t_cor, t_cp, t_kg, 0, FALSE
  FROM _sync_plan WHERE action = 'create';
  GET DIAGNOSTICS v_created = ROW_COUNT;

  SELECT count(*) INTO v_unchanged FROM _sync_plan WHERE action = 'unchanged';

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'pedido_id', p_pedido_id,
    'created', v_created, 'updated', v_updated, 'deleted', v_deleted, 'unchanged', v_unchanged,
    'conflicts', '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID) FROM service_role;
GRANT EXECUTE ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID) TO authenticated;

COMMENT ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID) IS
  'PRE-PROD-A (§R.23.4). Admin-only, native-regime-only canonical native-need writer. All-or-nothing, idempotent: creates missing native needs, updates kg_necessario absolutely, deletes only unallocated obsolete needs; never mutates legado needs; rejects the whole sync on any decrease below kg_alocado, any allocation on a non-draft order, or any obsolete need still allocated. kg_alocado stays trigger-maintained.';


-- ============================================================
-- 3. Allocation identity uniqueness (order §10) — one allocation row per
--    (item, necessidade, op). Preflight the 51 imported allocations first.
-- ============================================================

DO $$
DECLARE v_dups INT;
BEGIN
  SELECT count(*) INTO v_dups FROM (
    SELECT item_id, necessidade_id, op_id
    FROM public.ordem_compra_item_alocacao
    GROUP BY item_id, necessidade_id, op_id
    HAVING count(*) > 1
  ) d;
  IF v_dups > 0 THEN
    RAISE EXCEPTION 'PRE-PROD-A allocation-identity preflight failed: % duplicate (item,necessidade,op) groups exist', v_dups;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_item_alocacao_identidade
  ON public.ordem_compra_item_alocacao (item_id, necessidade_id, op_id);


-- ============================================================
-- 4. Hardened ABSOLUTE alocar_necessidade_compra_fio (order §10/§11).
--    Replaces the inactive db/67 increment version. p_kg is the absolute
--    desired quantity for the identity (item, necessidade, op).
-- ============================================================

CREATE OR REPLACE FUNCTION public.alocar_necessidade_compra_fio(
  p_item_id        BIGINT,
  p_necessidade_id BIGINT,
  p_op_id          BIGINT,
  p_kg             NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_need    RECORD;
  v_item    RECORD;
  v_ordem   RECORD;
  v_aloc    RECORD;
  v_prev    NUMERIC := 0;
  v_disp    NUMERIC;
  v_aloc_id BIGINT;
  v_disc    TEXT;
  v_total   NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;
  IF p_kg IS NULL OR p_kg <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'kg_invalido', 'erro', 'Quantidade deve ser maior que zero');
  END IF;

  -- Serialize on the target need (concurrency mechanism, order §20).
  SELECT * INTO v_need FROM public.necessidade_compra_fio WHERE id = p_necessidade_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_nao_encontrada', 'erro', 'Necessidade nao encontrada');
  END IF;
  IF v_need.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_legado', 'erro', 'Necessidade legado nao recebe alocacao nativa');
  END IF;

  SELECT * INTO v_item FROM public.ordem_compra_item WHERE id = p_item_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'item_nao_encontrado', 'erro', 'Item nao encontrado');
  END IF;

  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = v_item.ordem_id FOR UPDATE;
  IF v_ordem.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_legado', 'erro', 'Ordem legado nao pode ser distribuida');
  END IF;
  IF v_ordem.status_administrativo <> 'rascunho' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente rascunho pode ser distribuida');
  END IF;

  -- Same-Pedido ownership + material/color identity equality.
  IF v_ordem.pedido_id IS DISTINCT FROM v_need.pedido_id THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_incoerente', 'erro', 'Item e necessidade de Pedidos diferentes');
  END IF;
  IF v_item.material <> v_need.material THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'material_incoerente', 'erro', 'Material do item difere da necessidade');
  END IF;
  IF v_item.material = 'algodao' AND v_item.cor_id IS DISTINCT FROM v_need.cor_id THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cor_incoerente', 'erro', 'Cor de algodao difere da necessidade');
  END IF;
  IF v_item.material = 'poliester' AND v_item.cor_poliester IS DISTINCT FROM v_need.cor_poliester THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'cor_incoerente', 'erro', 'Cor de poliester difere da necessidade');
  END IF;

  -- OP attribution rules (order §11).
  IF p_op_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'op_obrigatoria', 'erro', 'op_id e obrigatorio na alocacao');
  END IF;
  IF v_need.origem_tipo = 'op' THEN
    IF p_op_id <> v_need.op_id THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'op_incoerente', 'erro', 'Alocacao de algodao deve usar a OP da necessidade');
    END IF;
  ELSE
    -- shared polyester: op_id must be a real OP of the same Pedido.
    IF NOT EXISTS (
      SELECT 1 FROM public.ops o JOIN public.lotes l ON l.id = o.lote_id
      WHERE o.id = p_op_id AND l.pedido_id = v_need.pedido_id
    ) THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'op_incoerente', 'erro', 'OP informada nao pertence ao Pedido da necessidade');
    END IF;
  END IF;

  -- Existing allocation for this exact identity (item, necessidade, op).
  SELECT * INTO v_aloc FROM public.ordem_compra_item_alocacao
  WHERE item_id = p_item_id AND necessidade_id = p_necessidade_id AND op_id = p_op_id
  FOR UPDATE;
  IF FOUND THEN v_prev := v_aloc.kg_alocado; END IF;

  -- Absolute cap: available = need total - (allocated excluding this identity).
  v_disp := v_need.kg_necessario - (v_need.kg_alocado - v_prev);
  IF p_kg > v_disp THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'excede_saldo',
      'erro', 'Alocacao excede o saldo da necessidade', 'disponivel', v_disp,
      'kg_necessario', v_need.kg_necessario, 'kg_alocado', v_need.kg_alocado);
  END IF;

  IF v_aloc.id IS NULL THEN
    INSERT INTO public.ordem_compra_item_alocacao (item_id, necessidade_id, op_id, kg_alocado)
    VALUES (p_item_id, p_necessidade_id, p_op_id, p_kg)
    RETURNING id INTO v_aloc_id;
    v_disc := 'created';
  ELSIF v_prev = p_kg THEN
    v_aloc_id := v_aloc.id;
    v_disc := 'unchanged';
  ELSE
    UPDATE public.ordem_compra_item_alocacao SET kg_alocado = p_kg WHERE id = v_aloc.id;
    v_aloc_id := v_aloc.id;
    v_disc := 'updated';
  END IF;

  -- Read the trigger-maintained cache back for the response.
  SELECT kg_alocado INTO v_total FROM public.necessidade_compra_fio WHERE id = p_necessidade_id;

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'alocacao_id', v_aloc_id,
    'discriminador', v_disc, 'kg_anterior', v_prev, 'kg_final', p_kg,
    'necessidade_total', v_need.kg_necessario, 'alocado_total', v_total,
    'restante_total', v_need.kg_necessario - v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM service_role;
GRANT EXECUTE ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) IS
  'PRE-PROD-A (§R.23.5). Admin-only ABSOLUTE/idempotent allocation writer for identity (item, necessidade, op). Locks the need FOR UPDATE (concurrency), requires a native rascunho parent order, same-Pedido ownership, material/color identity, valid OP attribution (cotton=need.op_id; polyester=any OP of the Pedido), and enforces the need cap after replacing the identity quantity. kg_alocado stays trigger-maintained. EXECUTE granted to authenticated; the UI stays disabled until the live T1/T2 test passes.';


-- ============================================================
-- 5. remover_alocacao_compra_fio (order §12).
-- ============================================================

CREATE OR REPLACE FUNCTION public.remover_alocacao_compra_fio(p_alocacao_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_aloc  RECORD;
  v_item  RECORD;
  v_ordem RECORD;
  v_need  RECORD;
  v_total NUMERIC;
  v_necid BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_aloc FROM public.ordem_compra_item_alocacao WHERE id = p_alocacao_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Alocacao nao encontrada');
  END IF;
  v_necid := v_aloc.necessidade_id;

  SELECT * INTO v_need FROM public.necessidade_compra_fio WHERE id = v_necid FOR UPDATE;

  SELECT * INTO v_item FROM public.ordem_compra_item WHERE id = v_aloc.item_id;
  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = v_item.ordem_id FOR UPDATE;
  IF v_ordem.legado THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_legado', 'erro', 'Alocacao importada legado nao pode ser removida');
  END IF;
  IF v_ordem.status_administrativo <> 'rascunho' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente rascunho pode ter alocacao removida');
  END IF;

  DELETE FROM public.ordem_compra_item_alocacao WHERE id = p_alocacao_id;

  SELECT kg_alocado INTO v_total FROM public.necessidade_compra_fio WHERE id = v_necid;

  RETURN jsonb_build_object('ok', true, 'codigo', 'ok', 'alocacao_id', p_alocacao_id,
    'necessidade_id', v_necid, 'alocado_total', v_total,
    'necessidade_total', v_need.kg_necessario, 'restante_total', v_need.kg_necessario - v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.remover_alocacao_compra_fio(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remover_alocacao_compra_fio(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.remover_alocacao_compra_fio(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.remover_alocacao_compra_fio(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.remover_alocacao_compra_fio(BIGINT) IS
  'PRE-PROD-A (§R.23.6). Admin-only. Removes one allocation from a native rascunho order; rejects imported-legacy and non-rascunho parents; returns a stable not-found result without fabricating success. The cache trigger recomputes kg_alocado.';


-- ============================================================
-- 6. Post-emission immutability backstop (order §13). DB-level, caller-agnostic.
--    Allocations frozen once the parent order leaves rascunho; item QUANTITY
--    (kg_pedido) frozen likewise (kg_recebido stays writable for Phase C).
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_alocacao_rascunho_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id BIGINT;
  v_status  TEXT;
BEGIN
  v_item_id := COALESCE(NEW.item_id, OLD.item_id);
  SELECT oc.status_administrativo INTO v_status
  FROM public.ordem_compra_item i
  JOIN public.ordem_compra oc ON oc.id = i.ordem_id
  WHERE i.id = v_item_id;

  IF v_status IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'ordem_compra_item_alocacao is immutable once the parent order is not rascunho (status=%)', v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_alocacao_rascunho_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_alocacao_rascunho_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_alocacao_rascunho_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_alocacao_rascunho_guard() FROM service_role;

COMMENT ON FUNCTION public.trg_alocacao_rascunho_guard() IS
  'PRE-PROD-A (§R.23.7) DB backstop: rejects INSERT/UPDATE/DELETE of an allocation whose parent order is not rascunho. Fires BEFORE the AFTER cache trigger, so an emitted/cancelled order can never have its allocations mutated by any writer.';

DROP TRIGGER IF EXISTS alocacao_rascunho_guard ON public.ordem_compra_item_alocacao;
CREATE TRIGGER alocacao_rascunho_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_compra_item_alocacao
  FOR EACH ROW EXECUTE FUNCTION public.trg_alocacao_rascunho_guard();


CREATE OR REPLACE FUNCTION public.trg_item_quantidade_rascunho_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_status TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.kg_pedido IS NOT DISTINCT FROM OLD.kg_pedido THEN
    RETURN NEW; -- quantity unchanged; allow (e.g. future kg_recebido writes)
  END IF;
  SELECT status_administrativo INTO v_status FROM public.ordem_compra WHERE id = COALESCE(NEW.ordem_id, OLD.ordem_id);
  IF v_status IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'ordem_compra_item quantity/existence is immutable once the parent order is not rascunho (status=%)', v_status;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_item_quantidade_rascunho_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_item_quantidade_rascunho_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_item_quantidade_rascunho_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_item_quantidade_rascunho_guard() FROM service_role;

COMMENT ON FUNCTION public.trg_item_quantidade_rascunho_guard() IS
  'PRE-PROD-A (§R.23.7) DB backstop: rejects DELETE and kg_pedido (quantity) UPDATE of an item whose parent order is not rascunho. kg_recebido updates remain allowed for Phase C.';

DROP TRIGGER IF EXISTS item_quantidade_rascunho_guard ON public.ordem_compra_item;
CREATE TRIGGER item_quantidade_rascunho_guard
  BEFORE UPDATE OR DELETE ON public.ordem_compra_item
  FOR EACH ROW EXECUTE FUNCTION public.trg_item_quantidade_rascunho_guard();


-- ============================================================
-- 7. obter_distribuicao_ordem_compra (order §14) — server-composed distribution
--    read model. No client-side authority reconstruction.
-- ============================================================

CREATE OR REPLACE FUNCTION public.obter_distribuicao_ordem_compra(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem   RECORD;
  v_itens   JSONB;
  v_native  BOOLEAN;
  v_rascunho BOOLEAN;
  v_completa BOOLEAN;
  v_bloqueio TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_ordem FROM public.ordem_compra WHERE id = p_ordem_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;

  v_native   := NOT v_ordem.legado;
  v_rascunho := v_ordem.status_administrativo = 'rascunho';

  SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.item_id), '[]'::jsonb)
  INTO v_itens
  FROM (
    SELECT
      i.id AS item_id, i.material, i.cor_id, i.cor_poliester, c.nome AS cor_nome,
      i.kg_pedido,
      coalesce((SELECT sum(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0) AS kg_alocado,
      i.kg_pedido - coalesce((SELECT sum(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0) AS kg_diferenca,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'alocacao_id', a.id, 'necessidade_id', a.necessidade_id, 'op_id', a.op_id,
          'op_numero', o.numero, 'op_ano', o.ano, 'kg_alocado', a.kg_alocado) ORDER BY a.id)
        FROM public.ordem_compra_item_alocacao a
        LEFT JOIN public.ops o ON o.id = a.op_id
        WHERE a.item_id = i.id), '[]'::jsonb) AS alocacoes,
      coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'necessidade_id', n.id, 'origem_tipo', n.origem_tipo, 'op_id', n.op_id,
          'op_numero', no2.numero, 'kg_necessario', n.kg_necessario, 'kg_alocado', n.kg_alocado,
          'kg_restante', n.kg_necessario - n.kg_alocado) ORDER BY n.id)
        FROM public.necessidade_compra_fio n
        LEFT JOIN public.ops no2 ON no2.id = n.op_id
        WHERE n.pedido_id = v_ordem.pedido_id AND n.legado = FALSE
          AND n.material = i.material
          AND ((i.material = 'algodao' AND n.cor_id = i.cor_id)
            OR (i.material = 'poliester' AND n.cor_poliester = i.cor_poliester))
      ), '[]'::jsonb) AS necessidades_compativeis,
      jsonb_build_object(
        'alocar',  (v_native AND v_rascunho),
        'editar',  (v_native AND v_rascunho),
        'remover', (v_native AND v_rascunho)
      ) AS acoes
    FROM public.ordem_compra_item i
    LEFT JOIN public.cores c ON c.id = i.cor_id
    WHERE i.ordem_id = p_ordem_id
  ) x;

  -- Distribution completeness: native rascunho order with >=1 item, every item
  -- fully allocated (SUM(alloc) = kg_pedido).
  v_completa := v_native AND v_rascunho
    AND EXISTS (SELECT 1 FROM public.ordem_compra_item i WHERE i.ordem_id = p_ordem_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.ordem_compra_item i
      WHERE i.ordem_id = p_ordem_id
        AND coalesce((SELECT sum(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0) <> i.kg_pedido
    );

  IF v_native AND v_rascunho THEN
    v_bloqueio := CASE WHEN v_completa THEN 'recebimento_nativo_ainda_inativo'
                       ELSE 'distribuicao_necessidades_pendente' END;
  ELSE
    v_bloqueio := NULL;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'ordem', jsonb_build_object(
      'ordem_id', v_ordem.id, 'modelo', CASE WHEN v_ordem.legado THEN 'legado' ELSE 'nativo' END,
      'pedido_id', v_ordem.pedido_id, 'fornecedor_id', v_ordem.fornecedor_id,
      'status_administrativo', v_ordem.status_administrativo, 'legado', v_ordem.legado),
    'itens', v_itens,
    'distribuicao_completa', coalesce(v_completa, false),
    'pronta_para_emissao', coalesce(v_completa, false),
    'pode_emitir', false,
    'bloqueio_emissao', v_bloqueio
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obter_distribuicao_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obter_distribuicao_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.obter_distribuicao_ordem_compra(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.obter_distribuicao_ordem_compra(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.obter_distribuicao_ordem_compra(BIGINT) IS
  'PRE-PROD-A (§R.23.8). Admin-only server-composed distribution read model: items with kg required/allocated/reconciliation, compatible native needs (with OP attribution + remaining), current allocations, distribution completeness, pode_emitir=false, and the block reason (recebimento_nativo_ainda_inativo when complete, else distribuicao_necessidades_pendente). Never authorizes emission.';


-- ============================================================
-- 8. Read-model replacements (order §14): expose distribuicao_completa,
--    pronta_para_emissao, pode_emitir=false and the correct bloqueio_emissao
--    on the existing admin read model. Only the emission-readiness fields
--    change vs db/68; allowed actions and shape are otherwise preserved.
-- ============================================================

-- Internal helper: order-level distribution completeness (native rascunho,
-- >=1 item, every item fully allocated). SECURITY DEFINER, granted to no client
-- role — used only inside the read-model RPCs below. Defined first so the
-- read models resolve it.
CREATE OR REPLACE FUNCTION public._distribuicao_completa_ordem(p_ordem_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.ordem_compra oc WHERE oc.id = p_ordem_id AND oc.legado = FALSE AND oc.status_administrativo = 'rascunho')
     AND EXISTS (SELECT 1 FROM public.ordem_compra_item i WHERE i.ordem_id = p_ordem_id)
     AND NOT EXISTS (
       SELECT 1 FROM public.ordem_compra_item i
       WHERE i.ordem_id = p_ordem_id
         AND COALESCE((SELECT SUM(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id), 0) <> i.kg_pedido
     );
$$;

REVOKE ALL ON FUNCTION public._distribuicao_completa_ordem(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._distribuicao_completa_ordem(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public._distribuicao_completa_ordem(BIGINT) FROM authenticated;
REVOKE ALL ON FUNCTION public._distribuicao_completa_ordem(BIGINT) FROM service_role;

COMMENT ON FUNCTION public._distribuicao_completa_ordem(BIGINT) IS
  'PRE-PROD-A (§R.23.8) internal helper for the admin read model: TRUE when a native rascunho order has >=1 item and every item is fully allocated. Granted to no client role.';

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
            WHEN oc.legado THEN jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
            WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'distribuir', true, 'emitir', false, 'receber', false)
            ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
          END,
        'distribuicao_completa', public._distribuicao_completa_ordem(oc.id),
        'pronta_para_emissao',   public._distribuicao_completa_ordem(oc.id),
        'pode_emitir',           false,
        'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                      THEN CASE WHEN public._distribuicao_completa_ordem(oc.id)
                                                THEN 'recebimento_nativo_ainda_inativo'
                                                ELSE 'distribuicao_necessidades_pendente' END
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


CREATE OR REPLACE FUNCTION public.obter_ordem_compra_admin(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ordem JSONB; v_eventos JSONB; v_completa BOOLEAN; v_legado BOOLEAN; v_status TEXT;
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
        WHEN oc.status_administrativo = 'rascunho' THEN jsonb_build_object('editar_itens', true, 'remover_itens', true, 'cancelar', true, 'distribuir', true, 'emitir', false, 'receber', false)
        ELSE jsonb_build_object('editar_itens', false, 'remover_itens', false, 'cancelar', false, 'distribuir', false, 'emitir', false, 'receber', false)
      END,
    'distribuicao_completa', v_completa,
    'pronta_para_emissao',   v_completa,
    'pode_emitir',           false,
    'bloqueio_emissao',      CASE WHEN (NOT oc.legado) AND oc.status_administrativo = 'rascunho'
                                  THEN CASE WHEN v_completa THEN 'recebimento_nativo_ainda_inativo'
                                            ELSE 'distribuicao_necessidades_pendente' END
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
  'REFUND-B1 (§R.22.10) + PRE-PROD-A (§R.23.8). Admin-only read model. Adds distribuicao_completa/pronta_para_emissao and the two-way bloqueio_emissao (recebimento_nativo_ainda_inativo when complete, else distribuicao_necessidades_pendente) plus the distribuir action for native drafts. pode_emitir stays false.';
COMMENT ON FUNCTION public.obter_ordem_compra_admin(BIGINT) IS
  'REFUND-B1 (§R.22.10) + PRE-PROD-A (§R.23.8). Admin-only single-order read model + events, with the same distribution-readiness fields as the list; pode_emitir stays false; emission awaits Phase C native receipt.';

COMMIT;

-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
