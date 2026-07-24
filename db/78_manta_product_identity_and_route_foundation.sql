-- =====================================================================
-- db/78_manta_product_identity_and_route_foundation.sql
-- PHASE-MANTA-A — Product identity + route-homogeneity foundation.
--
-- Establishes the canonical product-variation owner and the invariants
-- required before (and independent of) any direct-delivery route:
--   1. modelos.tipo_produto ('tapete' | 'manta') — sole canonical owner.
--   2. Manta width invariant (tipo_produto = 'manta' => largura = 1.40).
--   3. Uniqueness expanded to include tipo_produto so a Tapete and a
--      Manta may share name + colors + width without colliding.
--   4. Deterministic compatibility backfill: existing rows stay 'tapete'
--      (column default); the pre-existing informal Manta row (semantic
--      name 'MANTA ARABESCO', width 1.40) becomes nome='ARABESCO',
--      tipo_produto='manta'. Guarded by semantic attributes, never a
--      hardcoded id. Fails closed on an ambiguous (>1) match; emits an
--      explicit NOTICE when absent (fresh/disposable clusters legitimately
--      lack it).
--   5. Authoritative pedido_itens width-override guard: a Manta item may
--      not carry a non-null largura override other than 1.40.
--   6. Authoritative route-homogeneous OP guard: one OP may contain only
--      one product type (all Tapete or all Manta), enforced at the
--      database, not the UI.
--   7. Hardens gerar_op_latex / gerar_op_latex_split so a Manta (or a
--      non-homogeneous) weaving origin can never create or enter
--      Acabamento/Latex. All other behavior, signatures, grants, security
--      mode, search_path, locking, events and generated rows preserved
--      from db/33.
--
-- Product identity is derived by pedido_itens/op_itens through modelo_id;
-- no redundant product-type column is added to pedido_itens, op_itens,
-- ops, lotes or deliveries.
--
-- Forward-only. Idempotent (safe to re-apply). No business-data creation.
-- No finishing data. No expedition/delivery route (deferred to
-- PHASE-MANTA-B via entregas.etapa = 'tecelagem_direto'; NOT implemented
-- here). No yarn factor is duplicated: Manta 1.40 reuses
-- parametros_largura[1.40] through the unchanged width-keyed calculation.
--
-- Depende de db/33. Aplicar SOMENTE em ambiente local/descartavel ou em
-- staging autorizado. Producao proibida sem ordem explicita.
-- =====================================================================

BEGIN;

-- ============================================================
-- 1. modelos.tipo_produto — canonical product-variation owner
-- ============================================================
ALTER TABLE public.modelos
  ADD COLUMN IF NOT EXISTS tipo_produto TEXT NOT NULL DEFAULT 'tapete';

COMMENT ON COLUMN public.modelos.tipo_produto IS
  'Canonical product variation: tapete | manta. Sole owner of product type; pedido_itens/op_itens derive it through modelo_id. Manta implies largura = 1.40 (modelos_manta_largura_chk).';

ALTER TABLE public.modelos DROP CONSTRAINT IF EXISTS modelos_tipo_produto_chk;
ALTER TABLE public.modelos
  ADD CONSTRAINT modelos_tipo_produto_chk CHECK (tipo_produto IN ('tapete', 'manta'));

-- Manta width invariant. Evaluated while every row is still 'tapete'
-- (the column default), so it validates cleanly before the backfill in
-- step 2 sets a single row to manta/1.40.
ALTER TABLE public.modelos DROP CONSTRAINT IF EXISTS modelos_manta_largura_chk;
ALTER TABLE public.modelos
  ADD CONSTRAINT modelos_manta_largura_chk CHECK (tipo_produto <> 'manta' OR largura = 1.40);

-- Uniqueness now includes tipo_produto. Drop the base key (db/01) and any
-- prior composite (idempotent re-apply) before adding the canonical one.
ALTER TABLE public.modelos DROP CONSTRAINT IF EXISTS modelos_nome_cor_1_id_cor_2_id_largura_key;
ALTER TABLE public.modelos DROP CONSTRAINT IF EXISTS modelos_nome_cor_1_id_cor_2_id_largura_tipo_produto_key;
ALTER TABLE public.modelos
  ADD CONSTRAINT modelos_nome_cor_1_id_cor_2_id_largura_tipo_produto_key
  UNIQUE (nome, cor_1_id, cor_2_id, largura, tipo_produto);

-- ============================================================
-- 2. Deterministic compatibility backfill of the informal Manta.
--    Existing rows already default to 'tapete'. The pre-existing
--    semantic Manta row is reclassified by guarded semantic attributes.
--    Fail closed on ambiguity; explicit NOTICE when absent; idempotent
--    (after the first apply the source name no longer matches).
-- ============================================================
DO $$
DECLARE
  v_count INTEGER;
  v_id    BIGINT;
BEGIN
  SELECT count(*) INTO v_count
    FROM public.modelos
   WHERE upper(btrim(nome)) = 'MANTA ARABESCO'
     AND largura = 1.40
     AND tipo_produto = 'tapete';

  IF v_count > 1 THEN
    RAISE EXCEPTION
      'PHASE-MANTA-A backfill ambiguo: % linhas candidatas a Manta informal (MANTA ARABESCO / 1.40 / tapete). Reclassificacao abortada; nenhuma linha alterada.',
      v_count;
  ELSIF v_count = 1 THEN
    SELECT id INTO v_id
      FROM public.modelos
     WHERE upper(btrim(nome)) = 'MANTA ARABESCO'
       AND largura = 1.40
       AND tipo_produto = 'tapete';
    UPDATE public.modelos
       SET nome = 'ARABESCO', tipo_produto = 'manta'
     WHERE id = v_id;
    RAISE NOTICE 'PHASE-MANTA-A: modelo informal id=% reclassificado para ARABESCO / manta.', v_id;
  ELSE
    RAISE NOTICE 'PHASE-MANTA-A: nenhum modelo informal (MANTA ARABESCO / 1.40 / tapete) encontrado; backfill de Manta ignorado.';
  END IF;
END $$;

-- ============================================================
-- 3. pedido_itens width-override guard (Manta => override only 1.40).
--    Preserves all existing Tapete behavior (NULL override inherits the
--    modelo width; MVP does not use the override).
-- ============================================================
CREATE OR REPLACE FUNCTION public.pedido_itens_manta_largura_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo TEXT;
BEGIN
  IF NEW.largura IS NOT NULL THEN
    SELECT m.tipo_produto INTO v_tipo FROM public.modelos m WHERE m.id = NEW.modelo_id;
    IF v_tipo = 'manta' AND NEW.largura <> 1.40 THEN
      RAISE EXCEPTION 'Item Manta so admite largura 1.40 m (override invalido: %).', NEW.largura;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedido_itens_manta_largura_guard ON public.pedido_itens;
CREATE TRIGGER pedido_itens_manta_largura_guard
  BEFORE INSERT OR UPDATE ON public.pedido_itens
  FOR EACH ROW EXECUTE FUNCTION public.pedido_itens_manta_largura_guard_fn();

-- ============================================================
-- 4. Route-homogeneous OP guard: an OP may hold only one product type.
--    Authoritative (DB-level); the UI selection is a convenience, not
--    the enforcement. A BEFORE trigger aborts the statement, so a mixed
--    insert leaves no partial write.
-- ============================================================
CREATE OR REPLACE FUNCTION public.op_itens_route_homogeneity_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_tipo TEXT;
  v_other    TEXT;
BEGIN
  SELECT m.tipo_produto INTO v_new_tipo FROM public.modelos m WHERE m.id = NEW.modelo_id;
  IF v_new_tipo IS NULL THEN
    RAISE EXCEPTION 'Modelo % sem tipo_produto ao inserir/atualizar item de OP.', NEW.modelo_id;
  END IF;

  SELECT m.tipo_produto INTO v_other
    FROM public.op_itens oi
    JOIN public.modelos m ON m.id = oi.modelo_id
   WHERE oi.op_id = NEW.op_id
     AND oi.id IS DISTINCT FROM NEW.id
     AND m.tipo_produto <> v_new_tipo
   LIMIT 1;

  IF v_other IS NOT NULL THEN
    RAISE EXCEPTION
      'OP % nao pode misturar produtos (% x %): a rota da OP deve ser homogenea (apenas Tapete ou apenas Manta).',
      NEW.op_id, v_new_tipo, v_other;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS op_itens_route_homogeneity_guard ON public.op_itens;
CREATE TRIGGER op_itens_route_homogeneity_guard
  BEFORE INSERT OR UPDATE ON public.op_itens
  FOR EACH ROW EXECUTE FUNCTION public.op_itens_route_homogeneity_guard_fn();

-- ============================================================
-- 5. Harden gerar_op_latex — reject a Manta / non-homogeneous origin.
--    Body preserved from db/33; the only change is the PHASE-MANTA-A
--    guard inserted after the origin OP is resolved and before any OP
--    number is reserved. Signature, grants, security mode, search_path,
--    ON CONFLICT, generated rows and return contract are unchanged.
-- ============================================================
CREATE OR REPLACE FUNCTION public.gerar_op_latex(p_entrega_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entrega        public.entregas%ROWTYPE;
  v_op_id          BIGINT;
  v_lote_id        BIGINT;
  v_pedido_id      public.lotes.pedido_id%TYPE;
  v_destino        BIGINT;
  v_ano            INTEGER;
  v_numero         INTEGER;
  v_latex_op_id    BIGINT;
  v_latex_numero   INTEGER;
  v_latex_ano      INTEGER;
  v_existing       BIGINT;
  v_link_id        BIGINT;
  v_created        BOOLEAN := FALSE;
  v_accumulated    BOOLEAN := FALSE;
  v_already_linked BOOLEAN := FALSE;
  ei               RECORD;
BEGIN
  SELECT * INTO v_entrega FROM public.entregas WHERE id = p_entrega_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega % nao encontrada', p_entrega_id;
  END IF;

  IF v_entrega.etapa <> 'cima' THEN
    RAISE EXCEPTION 'Entrega % nao e de tecelagem (etapa=%)', p_entrega_id, v_entrega.etapa;
  END IF;

  IF NOT (public.is_admin() OR v_entrega.fornecedor_id = public.meu_fornecedor_id()) THEN
    RAISE EXCEPTION 'Sem permissao para gerar OP de latex da entrega %', p_entrega_id;
  END IF;

  v_destino := v_entrega.destino_fornecedor_id;
  IF v_destino IS NULL THEN
    RAISE EXCEPTION 'Entrega % sem destino de latex', p_entrega_id;
  END IF;

  SELECT ole.op_latex_id, o.numero, o.ano
    INTO v_existing, v_latex_numero, v_latex_ano
    FROM public.op_latex_entregas ole
    JOIN public.ops o ON o.id = ole.op_latex_id
   WHERE ole.entrega_id = p_entrega_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'op_latex_id', v_existing,
      'numero', v_latex_numero,
      'ano', v_latex_ano,
      'created', false,
      'accumulated', false,
      'already_linked', true
    );
  END IF;

  SELECT op_id INTO v_op_id
    FROM public.entrega_itens
   WHERE entrega_id = p_entrega_id
   LIMIT 1;

  IF v_op_id IS NULL THEN
    RETURN jsonb_build_object(
      'op_latex_id', NULL,
      'numero', NULL,
      'ano', NULL,
      'created', false,
      'accumulated', false,
      'already_linked', false
    );
  END IF;

  -- PHASE-MANTA-A: a Manta weaving OP must never create or enter
  -- Acabamento/Latex. Reject a Manta origin, and defensively reject a
  -- non-homogeneous origin (which the op_itens guard already prevents).
  -- Derived from modelos.tipo_produto via modelo_id; no name comparison.
  IF EXISTS (
    SELECT 1
      FROM public.op_itens oi
      JOIN public.modelos m ON m.id = oi.modelo_id
     WHERE oi.op_id = v_op_id
       AND m.tipo_produto = 'manta'
  ) THEN
    RAISE EXCEPTION 'OP % e de Manta (rota tecelagem-direta): nao gera Acabamento/Latex.', v_op_id;
  END IF;

  IF (
    SELECT count(DISTINCT m.tipo_produto)
      FROM public.op_itens oi
      JOIN public.modelos m ON m.id = oi.modelo_id
     WHERE oi.op_id = v_op_id
  ) > 1 THEN
    RAISE EXCEPTION 'OP % nao e homogenea; geracao de Acabamento/Latex bloqueada.', v_op_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.entrega_itens
     WHERE entrega_id = p_entrega_id
       AND defeito = FALSE
       AND metros_entregues > 0
  ) THEN
    RETURN jsonb_build_object(
      'op_latex_id', NULL,
      'numero', NULL,
      'ano', NULL,
      'created', false,
      'accumulated', false,
      'already_linked', false
    );
  END IF;

  -- db/29: busca apenas OPs default (motivo_separacao IS NULL).
  -- OPs split (motivo_separacao IS NOT NULL) nao sao candidatas
  -- a acumulacao default.
  SELECT id, numero, ano
    INTO v_latex_op_id, v_latex_numero, v_latex_ano
    FROM public.ops
   WHERE tipo = 'latex'
     AND origem_op_id = v_op_id
     AND destino_fornecedor_id = v_destino
     AND motivo_separacao IS NULL;

  SELECT o.lote_id, l.pedido_id
    INTO v_lote_id, v_pedido_id
    FROM public.ops o
    LEFT JOIN public.lotes l ON l.id = o.lote_id
   WHERE o.id = v_op_id;

  IF v_lote_id IS NULL OR v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Nao e possivel gerar OP de Acabamento/Latex: OP origem nao possui Pedido vinculado.';
  END IF;

  IF v_latex_op_id IS NULL THEN
    v_ano := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
    v_numero := public.proximo_numero_op('latex', v_ano);

    INSERT INTO public.ops
      (numero, ano, status, tipo, origem_op_id, origem_entrega_id, lote_id, destino_fornecedor_id, observacao)
    VALUES (
      v_numero, v_ano, 'aberta', 'latex', v_op_id, p_entrega_id, v_lote_id, v_destino,
      'Consolidada da OP ' || (SELECT numero || '/' || ano FROM public.ops WHERE id = v_op_id)
        || ' (tecelagem) para o acabamento'
    )
    -- db/29: ON CONFLICT com o predicado do novo indice parcial.
    ON CONFLICT (origem_op_id, destino_fornecedor_id)
      WHERE tipo = 'latex' AND motivo_separacao IS NULL
    DO NOTHING
    RETURNING id, numero, ano INTO v_latex_op_id, v_latex_numero, v_latex_ano;

    IF v_latex_op_id IS NOT NULL THEN
      v_created := TRUE;
    ELSE
      SELECT id, numero, ano
        INTO v_latex_op_id, v_latex_numero, v_latex_ano
        FROM public.ops
       WHERE tipo = 'latex'
         AND origem_op_id = v_op_id
         AND destino_fornecedor_id = v_destino
         AND motivo_separacao IS NULL;
    END IF;
  END IF;

  IF v_latex_op_id IS NULL THEN
    RAISE EXCEPTION 'Nao foi possivel resolver OP de latex para entrega %', p_entrega_id;
  END IF;

  INSERT INTO public.op_fornecedores (op_id, fornecedor_id, etapa)
  VALUES (v_latex_op_id, v_destino, 'latex')
  ON CONFLICT (op_id, fornecedor_id, etapa) DO NOTHING;

  INSERT INTO public.op_latex_entregas (op_latex_id, entrega_id)
  VALUES (v_latex_op_id, p_entrega_id)
  ON CONFLICT (entrega_id) DO NOTHING
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    v_already_linked := TRUE;
  ELSE
    v_accumulated := NOT v_created;

    FOR ei IN
      SELECT oi.modelo_id AS modelo_id, SUM(e.metros_entregues) AS metros
        FROM public.entrega_itens e
        JOIN public.op_itens oi ON oi.id = e.op_item_id
       WHERE e.entrega_id = p_entrega_id
         AND e.defeito = FALSE
         AND e.metros_entregues > 0
       GROUP BY oi.modelo_id
    LOOP
      UPDATE public.op_itens c
         SET metros_pedidos = c.metros_pedidos + ei.metros
       WHERE c.op_id = v_latex_op_id
         AND c.modelo_id = ei.modelo_id
         AND c.pedido_item_id IS NULL;

      IF NOT FOUND THEN
        INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos)
        VALUES (v_latex_op_id, ei.modelo_id, ei.metros);
      END IF;
    END LOOP;
  END IF;

  SELECT numero, ano INTO v_latex_numero, v_latex_ano
    FROM public.ops
   WHERE id = v_latex_op_id;

  RETURN jsonb_build_object(
    'op_latex_id', v_latex_op_id,
    'numero', v_latex_numero,
    'ano', v_latex_ano,
    'created', v_created,
    'accumulated', v_accumulated,
    'already_linked', v_already_linked
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_op_latex(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.gerar_op_latex(BIGINT) IS
  'db/78: como db/33 (consolida OP Acabamento/Latex por origem_op_id+destino, bloqueia origem sem Pedido) e adicionalmente rejeita origem Manta ou nao-homogenea (PHASE-MANTA-A). Manta nunca entra em acabamento.';

-- ============================================================
-- 6. Harden gerar_op_latex_split — reject a Manta / non-homogeneous
--    origin. Body preserved from db/33 (admin-only, LOCK, op_eventos
--    trail); guard inserted after the single-origin check and before
--    any OP number is reserved.
-- ============================================================
CREATE OR REPLACE FUNCTION public.gerar_op_latex_split(
  p_entrega_id BIGINT,
  p_motivo     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entrega        public.entregas%ROWTYPE;
  v_op_id          BIGINT;
  v_lote_id        BIGINT;
  v_pedido_id      public.lotes.pedido_id%TYPE;
  v_destino        BIGINT;
  v_ano            INTEGER;
  v_numero         INTEGER;
  v_nova_op_id     BIGINT;
  v_existing       BIGINT;
  v_exist_numero   INTEGER;
  v_exist_ano      INTEGER;
  v_link_id        BIGINT;
  v_motivo         TEXT;
  v_payload        JSONB;
  ei               RECORD;
BEGIN
  -- p_motivo obrigatorio
  IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
    RAISE EXCEPTION 'Motivo de separacao e obrigatorio para split. Use gerar_op_latex para consolidacao default.';
  END IF;
  v_motivo := btrim(p_motivo);

  -- Validar entrega
  SELECT * INTO v_entrega FROM public.entregas WHERE id = p_entrega_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entrega % nao encontrada', p_entrega_id;
  END IF;

  IF v_entrega.etapa <> 'cima' THEN
    RAISE EXCEPTION 'Entrega % nao e de tecelagem (etapa=%)', p_entrega_id, v_entrega.etapa;
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem criar split de OP latex.';
  END IF;

  v_destino := v_entrega.destino_fornecedor_id;
  IF v_destino IS NULL THEN
    RAISE EXCEPTION 'Entrega % sem destino de latex', p_entrega_id;
  END IF;

  -- Serializa a decisao por entrega entre a checagem idempotente e o vinculo.
  LOCK TABLE public.op_latex_entregas IN SHARE ROW EXCLUSIVE MODE;

  -- Idempotencia por entrega: ja vinculada a alguma OP Latex
  SELECT ole.op_latex_id, o.numero, o.ano
    INTO v_existing, v_exist_numero, v_exist_ano
    FROM public.op_latex_entregas ole
    JOIN public.ops o ON o.id = ole.op_latex_id
   WHERE ole.entrega_id = p_entrega_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'op_latex_id', v_existing,
      'numero', v_exist_numero,
      'ano', v_exist_ano,
      'created', false,
      'split', false,
      'already_linked', true,
      'erro', 'Entrega ja vinculada a OP ' || v_exist_numero || '/' || v_exist_ano || '. Nao foi criado split.'
    );
  END IF;

  -- Validar origem: a fonte canonica e entrega_itens.op_item_id -> op_itens.op_id.
  SELECT oi.op_id INTO v_op_id
    FROM public.entrega_itens e
    JOIN public.op_itens oi ON oi.id = e.op_item_id
   WHERE e.entrega_id = p_entrega_id
   LIMIT 1;

  IF v_op_id IS NULL THEN
    RAISE EXCEPTION 'Entrega % sem itens vinculados a OP de origem', p_entrega_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.entrega_itens
     WHERE entrega_id = p_entrega_id
       AND defeito = FALSE
       AND metros_entregues > 0
  ) THEN
    RAISE EXCEPTION 'Entrega % sem metros validos (sem defeito) para split', p_entrega_id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.entrega_itens e
      JOIN public.op_itens oi ON oi.id = e.op_item_id
     WHERE e.entrega_id = p_entrega_id
       AND e.defeito = FALSE
       AND e.metros_entregues > 0
       AND oi.op_id IS DISTINCT FROM v_op_id
  ) THEN
    RAISE EXCEPTION 'Entrega % possui itens validos de mais de uma OP origem; split exige origem unica', p_entrega_id;
  END IF;

  -- PHASE-MANTA-A: a Manta weaving OP must never create or enter
  -- Acabamento/Latex, including via the exceptional split path. Reject a
  -- Manta origin and defensively a non-homogeneous origin.
  IF EXISTS (
    SELECT 1
      FROM public.op_itens oi
      JOIN public.modelos m ON m.id = oi.modelo_id
     WHERE oi.op_id = v_op_id
       AND m.tipo_produto = 'manta'
  ) THEN
    RAISE EXCEPTION 'OP % e de Manta (rota tecelagem-direta): nao gera Acabamento/Latex.', v_op_id;
  END IF;

  IF (
    SELECT count(DISTINCT m.tipo_produto)
      FROM public.op_itens oi
      JOIN public.modelos m ON m.id = oi.modelo_id
     WHERE oi.op_id = v_op_id
  ) > 1 THEN
    RAISE EXCEPTION 'OP % nao e homogenea; geracao de Acabamento/Latex bloqueada.', v_op_id;
  END IF;

  -- Resolver lote/Pedido da OP origem antes de reservar numero.
  SELECT o.lote_id, l.pedido_id
    INTO v_lote_id, v_pedido_id
    FROM public.ops o
    LEFT JOIN public.lotes l ON l.id = o.lote_id
   WHERE o.id = v_op_id;

  IF v_lote_id IS NULL OR v_pedido_id IS NULL THEN
    RAISE EXCEPTION 'Nao e possivel gerar OP de Acabamento/Latex: OP origem nao possui Pedido vinculado.';
  END IF;

  -- Criar nova OP split
  v_ano := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_numero := public.proximo_numero_op('latex', v_ano);

  INSERT INTO public.ops
    (numero, ano, status, tipo, origem_op_id, origem_entrega_id, lote_id,
     destino_fornecedor_id, motivo_separacao, observacao)
  VALUES (
    v_numero, v_ano, 'aberta', 'latex', v_op_id, p_entrega_id, v_lote_id,
    v_destino, v_motivo,
    'Split excepcional da OP ' || (SELECT numero || '/' || ano FROM public.ops WHERE id = v_op_id)
      || ' (tecelagem). Motivo: ' || v_motivo || '. Entrega origem: ' || p_entrega_id || '.'
  )
  RETURNING id INTO v_nova_op_id;

  -- Criar op_fornecedores
  INSERT INTO public.op_fornecedores (op_id, fornecedor_id, etapa)
  VALUES (v_nova_op_id, v_destino, 'latex')
  ON CONFLICT (op_id, fornecedor_id, etapa) DO NOTHING;

  -- Criar link N:1
  INSERT INTO public.op_latex_entregas (op_latex_id, entrega_id)
  VALUES (v_nova_op_id, p_entrega_id)
  ON CONFLICT (entrega_id) DO NOTHING
  RETURNING id INTO v_link_id;

  IF v_link_id IS NULL THEN
    -- Guardrail defensivo: com o LOCK acima, este caminho nao deve ocorrer
    -- em concorrencia normal. Se ocorrer, nao duplica itens nem eventos.
    SELECT ole.op_latex_id, o.numero, o.ano
      INTO v_existing, v_exist_numero, v_exist_ano
      FROM public.op_latex_entregas ole
      JOIN public.ops o ON o.id = ole.op_latex_id
     WHERE ole.entrega_id = p_entrega_id;

    RETURN jsonb_build_object(
      'op_latex_id', v_existing,
      'numero', v_exist_numero,
      'ano', v_exist_ano,
      'created', false,
      'split', false,
      'already_linked', true,
      'erro', 'Entrega vinculada a outra OP antes de finalizar o split. Nenhum item/evento foi duplicado.'
    );

  END IF;

  -- Acumular op_itens na nova OP (por modelo, sem defeito, metros > 0)
  FOR ei IN
    SELECT oi.modelo_id AS modelo_id, SUM(e.metros_entregues) AS metros
      FROM public.entrega_itens e
      JOIN public.op_itens oi ON oi.id = e.op_item_id
     WHERE e.entrega_id = p_entrega_id
       AND e.defeito = FALSE
       AND e.metros_entregues > 0
     GROUP BY oi.modelo_id
  LOOP
    INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos)
    VALUES (v_nova_op_id, ei.modelo_id, ei.metros);
  END LOOP;

  v_payload := jsonb_build_object(
    'origem_op_id', v_op_id,
    'entrega_id', p_entrega_id,
    'nova_op_id', v_nova_op_id,
    'destino_fornecedor_id', v_destino,
    'motivo', v_motivo
  );

  -- Registrar rastro na nova OP
  INSERT INTO public.op_eventos (op_id, tipo_evento, observacao, payload, criado_por)
  VALUES (
    v_nova_op_id,
    'criacao_split',
    'OP Latex split criada a partir da entrega ' || p_entrega_id || '. Motivo: ' || v_motivo,
    v_payload,
    auth.uid()
  );

  -- Registrar rastro na OP origem
  INSERT INTO public.op_eventos (op_id, tipo_evento, observacao, payload, criado_por)
  VALUES (
    v_op_id,
    'split_derivado',
    'Entrega ' || p_entrega_id || ' separada para OP Latex split ' || v_numero || '/' || v_ano || '. Motivo: ' || v_motivo,
    v_payload,
    auth.uid()
  );

  RETURN jsonb_build_object(
    'op_latex_id', v_nova_op_id,
    'numero', v_numero,
    'ano', v_ano,
    'created', true,
    'split', true,
    'motivo', v_motivo
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_op_latex_split(BIGINT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.gerar_op_latex_split(BIGINT, TEXT) IS
  'db/78: como db/33 (split excepcional admin-only com motivo_separacao, idempotente por entrega, rastro em op_eventos) e adicionalmente rejeita origem Manta ou nao-homogenea (PHASE-MANTA-A).';

-- ============================================================
-- 7. Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
