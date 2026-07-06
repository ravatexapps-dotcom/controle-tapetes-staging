-- =====================================================================
-- db/33_op_latex_requires_pedido_guard.sql
-- RAVATEX-TAPETES-OP-CREATE-REQUIRES-PEDIDO-RPC-GUARD-C
--
-- Adiciona guarda backend nas RPCs que geram OP Acabamento/Latex:
-- a OP origem precisa ter lote_id e o lote precisa ter pedido_id.
--
-- Preserva o contrato da db/29:
--   - gerar_op_latex default split-aware;
--   - gerar_op_latex_split(p_entrega_id, p_motivo);
--   - retorno JSONB;
--   - op_numeros/proximo_numero_op sem alteracao;
--   - nenhuma correcao de dados historicos.
--
-- Depende de db/29.
-- Nao altera UI. Nao altera cardinalidade default.
-- =====================================================================

BEGIN;

-- ============================================================
-- 1. Atualizar gerar_op_latex para o contrato split-aware
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
  'db/33: Cria ou reutiliza OP de Acabamento/Latex consolidada por (origem_op_id, destino_fornecedor_id) apenas para OPs default (motivo_separacao IS NULL). Bloqueia origem sem lote/Pedido. Retorna flags created/accumulated/already_linked.';

-- ============================================================
-- 2. Criar gerar_op_latex_split — split excepcional explicito
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
  'db/33: Cria OP Latex excepcional com motivo_separacao = p_motivo. Bloqueia origem sem lote/Pedido. Idempotente por entrega (op_latex_entregas). Registra rastro em op_eventos (criacao_split + split_derivado). Admin-only.';

-- ============================================================
-- 3. Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
