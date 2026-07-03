-- ============================================================
-- Fase: RAVATEX-TAPETES-OP-LATEX-ENTRY-GATE-B
-- Contrato: transferencia da Tecelagem cria OP de Acabamento/Latex
-- aberta, aguardando confirmacao de entrada antes de producao.
--
-- Nao edita as migrations antigas db/08 e db/09. Esta migration
-- substitui a definicao da RPC preservando a assinatura atual.
-- ============================================================

CREATE OR REPLACE FUNCTION public.gerar_op_latex(p_entrega_id BIGINT)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entrega       public.entregas%ROWTYPE;
  v_op_id         BIGINT;
  v_lote_id       BIGINT;
  v_ano           INTEGER;
  v_numero        INTEGER;
  v_latex_op_id   BIGINT;
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

  IF v_entrega.destino_fornecedor_id IS NULL THEN
    RAISE EXCEPTION 'Entrega % sem destino de latex', p_entrega_id;
  END IF;

  SELECT id INTO v_latex_op_id
  FROM public.ops
  WHERE tipo = 'latex'
    AND origem_entrega_id = p_entrega_id;

  IF v_latex_op_id IS NOT NULL THEN
    RETURN v_latex_op_id;
  END IF;

  SELECT op_id INTO v_op_id
  FROM public.entrega_itens
  WHERE entrega_id = p_entrega_id
  LIMIT 1;

  IF v_op_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.entrega_itens
    WHERE entrega_id = p_entrega_id
      AND defeito = FALSE
      AND metros_entregues > 0
  ) THEN
    RETURN NULL;
  END IF;

  SELECT lote_id INTO v_lote_id
  FROM public.ops
  WHERE id = v_op_id;

  v_ano := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_numero
  FROM public.ops
  WHERE tipo = 'latex'
    AND ano = v_ano;

  INSERT INTO public.ops (numero, ano, status, tipo, origem_op_id, origem_entrega_id, lote_id, observacao)
  VALUES (
    v_numero, v_ano, 'aberta', 'latex', v_op_id, p_entrega_id, v_lote_id,
    'Gerada da entrega de ' || to_char(v_entrega.data, 'DD/MM/YYYY')
      || ' da OP ' || (SELECT numero || '/' || ano FROM public.ops WHERE id = v_op_id) || ' (tecelagem)'
  )
  RETURNING id INTO v_latex_op_id;

  INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos)
  SELECT v_latex_op_id, oi.modelo_id, SUM(ei.metros_entregues)
  FROM public.entrega_itens ei
  JOIN public.op_itens oi ON oi.id = ei.op_item_id
  WHERE ei.entrega_id = p_entrega_id
    AND ei.defeito = FALSE
    AND ei.metros_entregues > 0
  GROUP BY oi.modelo_id;

  INSERT INTO public.op_fornecedores (op_id, fornecedor_id, etapa)
  VALUES (v_latex_op_id, v_entrega.destino_fornecedor_id, 'latex')
  ON CONFLICT (op_id, fornecedor_id, etapa) DO NOTHING;

  RETURN v_latex_op_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_op_latex(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.gerar_op_latex(BIGINT) IS
  'Cria ou retorna OP de Acabamento/Latex a partir de entrega de Tecelagem. '
  'A OP nasce aberta, aguardando confirmacao de entrada no acabamento.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
