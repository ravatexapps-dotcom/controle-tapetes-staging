-- =====================================================================
-- db/31_acabamento_partial_expedition_flow.sql
-- RAVATEX-TAPETES-ACABAMENTO-PARTIAL-EXPEDITION-CONTRACT-B
--
-- Contract:
--   - OP Latex/Acabamento is the productive unit.
--   - Partial completion is a movement/trace in entregas/entrega_itens.
--   - OP completion is terminality of the expected total.
--   - Expedition release may be partial when finished quantity exists.
--
-- This migration adds a partial expedition path without changing
-- ops.status and without replacing the legacy liberar_expedicao(BIGINT)
-- terminal flow from db/23.
-- =====================================================================

BEGIN;

CREATE INDEX IF NOT EXISTS entrega_itens_op_item_idx
  ON public.entrega_itens(op_id, op_item_id);

CREATE INDEX IF NOT EXISTS expedicao_itens_op_item_idx
  ON public.expedicao_itens(op_item_id);

-- ============================================================
-- 1. Read RPC: saldo liberavel from finished Latex movements
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
  v_op              RECORD;
  v_lote            RECORD;
  v_expedicao_id    BIGINT;
  v_itens           JSONB;
  v_pedido_id       UUID;
  v_previsto_total  NUMERIC(10,2);
  v_acabado_total   NUMERIC(10,2);
  v_liberado_total  NUMERIC(10,2);
  v_saldo_total     NUMERIC(10,2);
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
  acabado AS (
    SELECT
      ei.op_item_id,
      ROUND(COALESCE(SUM(ei.metros_entregues), 0)::NUMERIC, 2) AS metros
    FROM public.entrega_itens ei
    JOIN public.entregas e ON e.id = ei.entrega_id
    WHERE ei.op_id = p_op_latex_id
      AND e.etapa = 'latex'
      AND COALESCE(ei.defeito, FALSE) = FALSE
      AND ei.op_item_id IS NOT NULL
    GROUP BY ei.op_item_id
  ),
  liberado AS (
    SELECT
      xi.op_item_id,
      ROUND(COALESCE(SUM(xi.metros_liberados), 0)::NUMERIC, 2) AS metros
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
      ROUND(COALESCE(a.metros, 0)::NUMERIC, 2) AS acabado,
      ROUND(COALESCE(l.metros, 0)::NUMERIC, 2) AS liberado,
      ROUND(GREATEST(COALESCE(a.metros, 0) - COALESCE(l.metros, 0), 0)::NUMERIC, 2) AS saldo_disponivel
    FROM item_base ib
    LEFT JOIN acabado a ON a.op_item_id = ib.op_item_id
    LEFT JOIN liberado l ON l.op_item_id = ib.op_item_id
  )
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'op_item_id', op_item_id,
        'pedido_item_id', pedido_item_id,
        'modelo_id', modelo_id,
        'previsto', previsto,
        'acabado', acabado,
        'liberado', liberado,
        'saldo_disponivel', saldo_disponivel
      )
      ORDER BY op_item_id
    ), '[]'::jsonb),
    ROUND(COALESCE(SUM(previsto), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(acabado), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(liberado), 0)::NUMERIC, 2),
    ROUND(COALESCE(SUM(saldo_disponivel), 0)::NUMERIC, 2)
  INTO v_itens, v_previsto_total, v_acabado_total, v_liberado_total, v_saldo_total
  FROM saldo;

  RETURN jsonb_build_object(
    'ok', true,
    'op_latex_id', p_op_latex_id,
    'op_status', v_op.status,
    'pedido_id', v_pedido_id,
    'lote_id', v_op.lote_id,
    'expedicao_id', v_expedicao_id,
    'previsto_total', COALESCE(v_previsto_total, 0),
    'acabado_total', COALESCE(v_acabado_total, 0),
    'liberado_total', COALESCE(v_liberado_total, 0),
    'saldo_disponivel_total', COALESCE(v_saldo_total, 0),
    'itens', v_itens
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultar_saldo_expedicao_latex(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.consultar_saldo_expedicao_latex(BIGINT) IS
  'Consulta saldo liberavel de OP Latex: acabado em entregas/entrega_itens etapa latex menos expedicao_itens.metros_liberados.';

-- ============================================================
-- 2. Write RPC: partial release without terminal status gate
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
    RETURN jsonb_build_object('ok', false, 'erro', 'Informe ao menos um item para liberar');
  END IF;

  SELECT * INTO v_op
    FROM public.ops
   WHERE id = p_op_latex_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP de acabamento nao encontrada');
  END IF;

  IF COALESCE(v_op.tipo, '') <> 'latex' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Somente OP de acabamento/latex pode liberar expedicao');
  END IF;

  IF v_op.status NOT IN ('em_producao', 'concluida', 'finalizada') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP de acabamento precisa estar em producao ou concluida para liberar expedicao');
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

  -- Serialize release for this OP and lock the committed movement rows
  -- used to calculate saldo. The locked OP row serializes concurrent
  -- release attempts for the same productive unit.
  PERFORM 1
    FROM public.op_itens oi
   WHERE oi.op_id = p_op_latex_id
   FOR UPDATE;

  PERFORM 1
    FROM public.entrega_itens ei
    JOIN public.entregas e ON e.id = ei.entrega_id
   WHERE ei.op_id = p_op_latex_id
     AND e.etapa = 'latex'
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
      RETURN jsonb_build_object('ok', false, 'erro', 'Item de liberacao invalido');
    END IF;

    SELECT
      oi.id AS op_item_id,
      oi.pedido_item_id,
      oi.modelo_id,
      ROUND(COALESCE(oi.metros_ajustados, oi.metros_pedidos)::NUMERIC, 2) AS previsto,
      ROUND(COALESCE((
        SELECT SUM(ei.metros_entregues)
          FROM public.entrega_itens ei
          JOIN public.entregas e ON e.id = ei.entrega_id
         WHERE ei.op_id = p_op_latex_id
           AND ei.op_item_id = oi.id
           AND e.etapa = 'latex'
           AND COALESCE(ei.defeito, FALSE) = FALSE
      ), 0)::NUMERIC, 2) AS acabado,
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

    IF v_req.metros > ROUND(GREATEST(v_item.acabado - v_item.liberado, 0)::NUMERIC, 2) THEN
      RETURN jsonb_build_object(
        'ok', false,
        'erro', 'Liberacao excede saldo acabado disponivel',
        'op_item_id', v_req.op_item_id,
        'acabado', v_item.acabado,
        'liberado', v_item.liberado,
        'saldo_disponivel', ROUND(GREATEST(v_item.acabado - v_item.liberado, 0)::NUMERIC, 2)
      );
    END IF;

    v_liberado_total := ROUND((v_liberado_total + v_req.metros)::NUMERIC, 2);
    v_saldo_restante_total := ROUND((
      v_saldo_restante_total + GREATEST(v_item.acabado - v_item.liberado - v_req.metros, 0)
    )::NUMERIC, 2);

    v_items_result := v_items_result || jsonb_build_array(jsonb_build_object(
      'op_item_id', v_item.op_item_id,
      'pedido_item_id', v_item.pedido_item_id,
      'modelo_id', v_item.modelo_id,
      'previsto', v_item.previsto,
      'acabado', v_item.acabado,
      'liberado_antes', v_item.liberado,
      'liberar', v_req.metros,
      'saldo_restante', ROUND(GREATEST(v_item.acabado - v_item.liberado - v_req.metros, 0)::NUMERIC, 2)
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
      (v_payload_item->>'liberar')::NUMERIC(10,2)
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
  'Libera expedicao parcial de OP Latex em producao/concluida/finalizada com saldo acabado disponivel. Nao altera ops.status.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
