-- =====================================================================
-- db/32_acabamento_expedicao_direct_movement.sql
-- RAVATEX-TAPETES-ACABAMENTO-EXPEDICAO-FLOW-COHERENCE-C
--
-- Corrige a premissa errada da db/31. Nao existe etapa intermediaria
-- obrigatoria "registrar acabamento". O material disponivel na OP de
-- Acabamento/Latex e o que ENTROU vindo da Tecelagem (entregas
-- etapa='cima' vinculadas a OP Latex por op_latex_entregas). O movimento
-- Acabamento -> Expedicao e o proprio ato que declara aquela quantidade
-- como acabada/liberada.
--
-- Calculo canonico (paridade com Tecelagem):
--   recebido_no_acabamento =
--     SUM(entrega_itens.metros_entregues) das entregas etapa='cima'
--     vinculadas a OP Latex via op_latex_entregas, sem defeito, mapeadas
--     ao op_item da OP Latex por modelo_id (mesmo agrupamento de
--     gerar_op_latex; por construcao == op_itens.metros_pedidos acumulado).
--   ja_movimentado_para_expedicao =
--     SUM(expedicao_itens.metros_liberados) por op_latex_id + op_item_id.
--   disponivel_para_movimentar = saldo_em_acabamento =
--     recebido_no_acabamento - ja_movimentado_para_expedicao.
--
-- Esta migration SOBRESCREVE a semantica errada da db/31 nas RPCs
-- consultar_saldo_expedicao_latex(BIGINT) e
-- liberar_expedicao_latex_parcial(BIGINT, JSONB, TEXT) (mesmas
-- assinaturas). NAO altera ops.status, NAO exige OP terminal, NAO exige
-- "registrar acabamento" previo e NAO cria OP por parcial.
--
-- A RPC legada de liberacao total terminal liberar_expedicao(BIGINT) da
-- db/23 permanece intocada como atalho de liberacao total terminal.
--
-- NAO aplicada em Supabase automaticamente. Migration versionada.
-- Aplicar SOMENTE em staging (ucrjtfswnfdlxwtmxnoo). Producao proibida.
-- Idempotente: pode rodar novamente sem efeito cumulativo.
-- =====================================================================

BEGIN;

-- Ajuda a busca de recebido, que junta entrega_itens por entrega_id
-- atraves do vinculo op_latex_entregas.
CREATE INDEX IF NOT EXISTS entrega_itens_entrega_idx
  ON public.entrega_itens(entrega_id);

-- ============================================================
-- 1. Read RPC: saldo movimentavel do Acabamento para a Expedicao.
--    recebido (Tecelagem -> Acabamento) menos ja movimentado
--    (Acabamento -> Expedicao). Sem premissa etapa='latex'.
-- ============================================================
CREATE OR REPLACE FUNCTION public.consultar_saldo_expedicao_latex(
  p_op_latex_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op                    RECORD;
  v_lote                  RECORD;
  v_expedicao_id          BIGINT;
  v_itens                 JSONB;
  v_pedido_id             UUID;
  v_previsto_total        NUMERIC(10,2);
  v_recebido_total        NUMERIC(10,2);
  v_liberado_total        NUMERIC(10,2);
  v_entregue_total        NUMERIC(10,2);
  v_disponivel_total      NUMERIC(10,2);
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_op
    FROM public.ops
   WHERE id = p_op_latex_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP de acabamento nao encontrada');
  END IF;

  IF COALESCE(v_op.tipo, '') <> 'latex' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Somente OP de acabamento/latex possui saldo de expedicao');
  END IF;

  IF v_op.lote_id IS NOT NULL THEN
    SELECT * INTO v_lote
      FROM public.lotes
     WHERE id = v_op.lote_id;
    IF FOUND THEN
      v_pedido_id := v_lote.pedido_id;
    END IF;
  END IF;

  SELECT id INTO v_expedicao_id
    FROM public.expedicoes
   WHERE op_latex_id = p_op_latex_id;

  WITH item_base AS (
    SELECT
      oi.id AS op_item_id,
      oi.pedido_item_id,
      oi.modelo_id,
      ROUND(COALESCE(oi.metros_ajustados, oi.metros_pedidos)::NUMERIC, 2) AS previsto
    FROM public.op_itens oi
    WHERE oi.op_id = p_op_latex_id
  ),
  -- Recebido no acabamento: entregas Tecelagem -> Acabamento (etapa='cima')
  -- vinculadas a esta OP Latex por op_latex_entregas, por modelo.
  recebido AS (
    SELECT
      COALESCE(tec.modelo_id, ei.modelo_id) AS modelo_id,
      ROUND(COALESCE(SUM(ei.metros_entregues), 0)::NUMERIC, 2) AS metros
    FROM public.op_latex_entregas ole
    JOIN public.entregas e ON e.id = ole.entrega_id
    JOIN public.entrega_itens ei ON ei.entrega_id = ole.entrega_id
    LEFT JOIN public.op_itens tec ON tec.id = ei.op_item_id
    WHERE ole.op_latex_id = p_op_latex_id
      AND e.etapa = 'cima'
      AND COALESCE(ei.defeito, FALSE) = FALSE
      AND ei.metros_entregues > 0
    GROUP BY COALESCE(tec.modelo_id, ei.modelo_id)
  ),
  -- Ja movimentado para expedicao por op_item da OP Latex.
  liberado AS (
    SELECT
      xi.op_item_id,
      ROUND(COALESCE(SUM(xi.metros_liberados), 0)::NUMERIC, 2) AS metros,
      ROUND(COALESCE(SUM(xi.metros_entregues), 0)::NUMERIC, 2) AS entregue
    FROM public.expedicao_itens xi
    JOIN public.expedicoes ex ON ex.id = xi.expedicao_id
    WHERE ex.op_latex_id = p_op_latex_id
    GROUP BY xi.op_item_id
  ),
  saldo AS (
    SELECT
      ib.op_item_id,
      ib.pedido_item_id,
      ib.modelo_id,
      ib.previsto,
      ROUND(COALESCE(r.metros, 0)::NUMERIC, 2) AS recebido,
      ROUND(COALESCE(l.metros, 0)::NUMERIC, 2) AS liberado,
      ROUND(COALESCE(l.entregue, 0)::NUMERIC, 2) AS entregue,
      ROUND(GREATEST(COALESCE(r.metros, 0) - COALESCE(l.metros, 0), 0)::NUMERIC, 2) AS disponivel
    FROM item_base ib
    LEFT JOIN recebido r ON r.modelo_id = ib.modelo_id
    LEFT JOIN liberado l ON l.op_item_id = ib.op_item_id
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'op_item_id', op_item_id,
        'pedido_item_id', pedido_item_id,
        'modelo_id', modelo_id,
        'previsto', previsto,
        'recebido', recebido,
        'liberado', liberado,
        'entregue', entregue,
        'disponivel', disponivel,
        'saldo_em_acabamento', disponivel
      )
      ORDER BY op_item_id
    ), '[]'::jsonb),
    ROUND(COALESCE(SUM(previsto), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(recebido), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(liberado), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(entregue), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(disponivel), 0)::NUMERIC, 2)
  INTO v_itens, v_previsto_total, v_recebido_total, v_liberado_total, v_entregue_total, v_disponivel_total
  FROM saldo;

  RETURN jsonb_build_object(
    'ok', true,
    'op_latex_id', p_op_latex_id,
    'op_status', v_op.status,
    'pedido_id', v_pedido_id,
    'lote_id', v_op.lote_id,
    'expedicao_id', v_expedicao_id,
    'previsto_total', COALESCE(v_previsto_total, 0),
    'recebido_total', COALESCE(v_recebido_total, 0),
    'liberado_total', COALESCE(v_liberado_total, 0),
    'entregue_total', COALESCE(v_entregue_total, 0),
    'disponivel_total', COALESCE(v_disponivel_total, 0),
    'saldo_em_acabamento_total', COALESCE(v_disponivel_total, 0),
    'itens', v_itens
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultar_saldo_expedicao_latex(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.consultar_saldo_expedicao_latex(BIGINT) IS
  'db/32: Saldo movimentavel Acabamento->Expedicao. recebido = entregas '
  'etapa=cima vinculadas por op_latex_entregas; menos expedicao_itens.'
  'metros_liberados. disponivel = saldo_em_acabamento = recebido - liberado. '
  'Sem premissa etapa=latex e sem exigir OP terminal.';

-- ============================================================
-- 2. Write RPC: movimenta do Acabamento para a Expedicao.
--    Guarda por recebido - ja_movimentado. Nao altera ops.status.
-- ============================================================
CREATE OR REPLACE FUNCTION public.liberar_expedicao_latex_parcial(
  p_op_latex_id BIGINT,
  p_itens       JSONB,
  p_observacao  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op                    RECORD;
  v_lote                  RECORD;
  v_expedicao_id          BIGINT;
  v_expedicao_created     BOOLEAN := FALSE;
  v_req                   RECORD;
  v_item                  RECORD;
  v_items_result          JSONB := '[]'::jsonb;
  v_items_written         JSONB := '[]'::jsonb;
  v_payload_item          JSONB;
  v_liberado_total        NUMERIC(10,2) := 0;
  v_saldo_restante_total  NUMERIC(10,2) := 0;
  v_upsert_id             BIGINT;
  v_upsert_inserted       BOOLEAN;
  v_liberado_depois       NUMERIC(10,2);
  v_rows                  INTEGER := 0;
  v_existing_item_id      BIGINT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Informe ao menos um item para movimentar');
  END IF;

  SELECT * INTO v_op
    FROM public.ops
   WHERE id = p_op_latex_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP de acabamento nao encontrada');
  END IF;

  IF COALESCE(v_op.tipo, '') <> 'latex' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Somente OP de acabamento/latex pode movimentar para expedicao');
  END IF;

  -- Paridade com Tecelagem: aceita em_producao/concluida/finalizada.
  -- Nao exige OP terminal e nao exige "registrar acabamento" previo.
  IF v_op.status NOT IN ('em_producao', 'concluida', 'finalizada') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Confirme a entrada no acabamento antes de movimentar para expedicao');
  END IF;

  IF v_op.lote_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP sem lote vinculado');
  END IF;

  SELECT * INTO v_lote
    FROM public.lotes
   WHERE id = v_op.lote_id;

  IF NOT FOUND OR v_lote.pedido_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Lote sem pedido vinculado');
  END IF;

  -- Serializa a movimentacao desta OP e trava as linhas de movimento
  -- usadas no calculo de saldo. A OP travada serializa tentativas
  -- concorrentes para a mesma unidade produtiva.
  PERFORM 1
    FROM public.op_itens oi
   WHERE oi.op_id = p_op_latex_id
   FOR UPDATE;

  -- Entregas Tecelagem -> Acabamento (etapa='cima') que compoem o recebido.
  PERFORM 1
    FROM public.entrega_itens ei
    JOIN public.op_latex_entregas ole ON ole.entrega_id = ei.entrega_id
   WHERE ole.op_latex_id = p_op_latex_id
   FOR UPDATE OF ei;

  PERFORM 1
    FROM public.expedicoes ex
   WHERE ex.op_latex_id = p_op_latex_id
   FOR UPDATE;

  PERFORM 1
    FROM public.expedicao_itens xi
    JOIN public.expedicoes ex ON ex.id = xi.expedicao_id
   WHERE ex.op_latex_id = p_op_latex_id
   FOR UPDATE OF xi;

  FOR v_req IN
    SELECT
      x.op_item_id::BIGINT AS op_item_id,
      ROUND(SUM(x.metros)::NUMERIC, 2) AS metros
    FROM jsonb_to_recordset(p_itens) AS x(op_item_id BIGINT, metros NUMERIC)
    GROUP BY x.op_item_id
    ORDER BY x.op_item_id
  LOOP
    v_rows := v_rows + 1;

    IF v_req.op_item_id IS NULL OR v_req.metros IS NULL OR v_req.metros <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'erro', 'Item de movimentacao invalido');
    END IF;

    SELECT
      oi.id AS op_item_id,
      oi.pedido_item_id,
      oi.modelo_id,
      ROUND(COALESCE(oi.metros_ajustados, oi.metros_pedidos)::NUMERIC, 2) AS previsto,
      -- Recebido no acabamento vindo da Tecelagem (etapa='cima').
      ROUND(COALESCE((
        SELECT SUM(ei.metros_entregues)
          FROM public.op_latex_entregas ole
          JOIN public.entregas e ON e.id = ole.entrega_id
          JOIN public.entrega_itens ei ON ei.entrega_id = ole.entrega_id
          LEFT JOIN public.op_itens tec ON tec.id = ei.op_item_id
         WHERE ole.op_latex_id = p_op_latex_id
           AND e.etapa = 'cima'
           AND COALESCE(ei.defeito, FALSE) = FALSE
           AND ei.metros_entregues > 0
           AND COALESCE(tec.modelo_id, ei.modelo_id) = oi.modelo_id
      ), 0)::NUMERIC, 2) AS recebido,
      -- Ja movimentado para expedicao deste op_item.
      ROUND(COALESCE((
        SELECT SUM(xi.metros_liberados)
          FROM public.expedicao_itens xi
          JOIN public.expedicoes ex ON ex.id = xi.expedicao_id
         WHERE ex.op_latex_id = p_op_latex_id
           AND xi.op_item_id = oi.id
      ), 0)::NUMERIC, 2) AS liberado
    INTO v_item
    FROM public.op_itens oi
    WHERE oi.id = v_req.op_item_id
      AND oi.op_id = p_op_latex_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'erro', 'Item nao pertence a OP de acabamento');
    END IF;

    IF v_req.metros > ROUND(GREATEST(v_item.recebido - v_item.liberado, 0)::NUMERIC, 2) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'erro', 'Movimentacao excede saldo recebido no acabamento',
        'op_item_id', v_req.op_item_id,
        'recebido', v_item.recebido,
        'liberado', v_item.liberado,
        'disponivel', ROUND(GREATEST(v_item.recebido - v_item.liberado, 0)::NUMERIC, 2)
      );
    END IF;

    v_liberado_total := ROUND((v_liberado_total + v_req.metros)::NUMERIC, 2);
    v_saldo_restante_total := ROUND((
      v_saldo_restante_total + GREATEST(v_item.recebido - v_item.liberado - v_req.metros, 0)
    )::NUMERIC, 2);

    v_items_result := v_items_result || jsonb_build_array(jsonb_build_object(
      'op_item_id', v_item.op_item_id,
      'pedido_item_id', v_item.pedido_item_id,
      'modelo_id', v_item.modelo_id,
      'previsto', v_item.previsto,
      'recebido', v_item.recebido,
      'liberado_antes', v_item.liberado,
      'movimentar', v_req.metros,
      'saldo_restante', ROUND(GREATEST(v_item.recebido - v_item.liberado - v_req.metros, 0)::NUMERIC, 2)
    ));
  END LOOP;

  IF v_rows = 0 OR v_liberado_total <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Informe quantidade maior que zero');
  END IF;

  SELECT id INTO v_expedicao_id
    FROM public.expedicoes
   WHERE op_latex_id = p_op_latex_id
   FOR UPDATE;

  IF v_expedicao_id IS NULL THEN
    INSERT INTO public.expedicoes (pedido_id, op_latex_id, lote_id, cliente_id, status)
    VALUES (v_lote.pedido_id, p_op_latex_id, v_op.lote_id, v_lote.cliente_id, 'aguardando_expedicao')
    RETURNING id INTO v_expedicao_id;
    v_expedicao_created := TRUE;
  END IF;

  FOR v_payload_item IN
    SELECT value FROM jsonb_array_elements(v_items_result)
  LOOP
    v_existing_item_id := NULL;

    SELECT id INTO v_existing_item_id
      FROM public.expedicao_itens
     WHERE expedicao_id = v_expedicao_id
       AND op_item_id = (v_payload_item->>'op_item_id')::BIGINT
     FOR UPDATE;

    INSERT INTO public.expedicao_itens (
      expedicao_id,
      op_item_id,
      pedido_item_id,
      modelo_id,
      metros_liberados
    )
    VALUES (
      v_expedicao_id,
      (v_payload_item->>'op_item_id')::BIGINT,
      NULLIF(v_payload_item->>'pedido_item_id', '')::UUID,
      (v_payload_item->>'modelo_id')::BIGINT,
      (v_payload_item->>'movimentar')::NUMERIC(10,2)
    )
    ON CONFLICT (expedicao_id, op_item_id) DO UPDATE
      SET pedido_item_id = EXCLUDED.pedido_item_id,
          modelo_id = EXCLUDED.modelo_id,
          metros_liberados = public.expedicao_itens.metros_liberados + EXCLUDED.metros_liberados,
          atualizado_em = now()
    RETURNING id, metros_liberados
      INTO v_upsert_id, v_liberado_depois;

    v_upsert_inserted := v_existing_item_id IS NULL;

    v_items_written := v_items_written || jsonb_build_array(
      v_payload_item ||
      jsonb_build_object(
        'expedicao_item_id', v_upsert_id,
        'created', v_upsert_inserted,
        'liberado_depois', v_liberado_depois
      )
    );
  END LOOP;

  PERFORM public.recalcular_status_expedicao(v_expedicao_id);

  RETURN jsonb_build_object(
    'ok', true,
    'created', v_expedicao_created,
    'updated', NOT v_expedicao_created,
    'expedicao_id', v_expedicao_id,
    'pedido_id', v_lote.pedido_id,
    'op_latex_id', p_op_latex_id,
    'liberado_total', v_liberado_total,
    'saldo_restante', v_saldo_restante_total,
    'observacao', p_observacao,
    'itens', v_items_written
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'erro', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.liberar_expedicao_latex_parcial(BIGINT, JSONB, TEXT) TO authenticated;

COMMENT ON FUNCTION public.liberar_expedicao_latex_parcial(BIGINT, JSONB, TEXT) IS
  'db/32: Movimenta do Acabamento para a Expedicao a quantidade recebida da '
  'Tecelagem ainda nao movimentada. Aceita OP em_producao/concluida/'
  'finalizada; guarda por recebido - ja_movimentado; nao altera ops.status; '
  'nao registra entrega ao cliente.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
