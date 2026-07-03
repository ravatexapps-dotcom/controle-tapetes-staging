-- ============================================================
-- Fase: RAVATEX-TAPETES-END-TO-END-PRODUCTION-FLOW-B
-- Expedicao e conclusao operacional do pedido.
--
-- Escopo:
--   1. Criar estrutura minima de expedicao.
--   2. Liberar expedicao a partir de OP Latex/Acabamento finalizada.
--   3. Registrar entrega/coleta parcial ou total por RPC.
--   4. Concluir pedido somente quando a cadeia vinculada estiver pronta.
--
-- Nao altera gerar_op_latex. Nao edita migrations antigas.
-- ============================================================

-- ============================================================
-- 1. Tabelas
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expedicoes (
  id            BIGSERIAL PRIMARY KEY,
  pedido_id     UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE RESTRICT,
  op_latex_id   BIGINT NOT NULL REFERENCES public.ops(id) ON DELETE RESTRICT,
  lote_id       BIGINT REFERENCES public.lotes(id) ON DELETE SET NULL,
  cliente_id    BIGINT REFERENCES public.clientes(id) ON DELETE RESTRICT,
  status        TEXT NOT NULL DEFAULT 'aguardando_expedicao'
                CHECK (status IN ('aguardando_expedicao','parcial','concluida')),
  liberado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (op_latex_id)
);

COMMENT ON TABLE public.expedicoes IS
  'Expedicao operacional vinculada ao Pedido e a OP de Acabamento/Latex finalizada.';

COMMENT ON COLUMN public.expedicoes.status IS
  'aguardando_expedicao|parcial|concluida';

CREATE TABLE IF NOT EXISTS public.expedicao_itens (
  id                BIGSERIAL PRIMARY KEY,
  expedicao_id      BIGINT NOT NULL REFERENCES public.expedicoes(id) ON DELETE CASCADE,
  op_item_id        BIGINT NOT NULL REFERENCES public.op_itens(id) ON DELETE RESTRICT,
  pedido_item_id    UUID REFERENCES public.pedido_itens(id) ON DELETE SET NULL,
  modelo_id         BIGINT NOT NULL REFERENCES public.modelos(id) ON DELETE RESTRICT,
  metros_liberados  NUMERIC(10,2) NOT NULL CHECK (metros_liberados > 0),
  metros_entregues  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (metros_entregues >= 0),
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (expedicao_id, op_item_id),
  CHECK (metros_entregues <= metros_liberados)
);

COMMENT ON TABLE public.expedicao_itens IS
  'Itens liberados para expedicao e saldo entregue/coletado ao cliente.';

CREATE TABLE IF NOT EXISTS public.expedicao_movimentos (
  id            BIGSERIAL PRIMARY KEY,
  expedicao_id  BIGINT NOT NULL REFERENCES public.expedicoes(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrega','coleta')),
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao    TEXT,
  criado_por    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.expedicao_movimentos IS
  'Historico de saidas da expedicao: entrega ou coleta.';

CREATE TABLE IF NOT EXISTS public.expedicao_movimento_itens (
  id                 BIGSERIAL PRIMARY KEY,
  movimento_id        BIGINT NOT NULL REFERENCES public.expedicao_movimentos(id) ON DELETE CASCADE,
  expedicao_item_id   BIGINT NOT NULL REFERENCES public.expedicao_itens(id) ON DELETE RESTRICT,
  metros             NUMERIC(10,2) NOT NULL CHECK (metros > 0)
);

COMMENT ON TABLE public.expedicao_movimento_itens IS
  'Itens e metragem de cada movimento de expedicao.';

CREATE INDEX IF NOT EXISTS expedicoes_pedido_idx
  ON public.expedicoes(pedido_id);

CREATE INDEX IF NOT EXISTS expedicoes_status_idx
  ON public.expedicoes(status);

CREATE INDEX IF NOT EXISTS expedicoes_op_latex_idx
  ON public.expedicoes(op_latex_id);

CREATE INDEX IF NOT EXISTS expedicao_itens_expedicao_idx
  ON public.expedicao_itens(expedicao_id);

CREATE INDEX IF NOT EXISTS expedicao_movimentos_expedicao_idx
  ON public.expedicao_movimentos(expedicao_id, data DESC, id DESC);

CREATE INDEX IF NOT EXISTS expedicao_movimento_itens_movimento_idx
  ON public.expedicao_movimento_itens(movimento_id);


-- ============================================================
-- 2. RLS admin-only
-- ============================================================

ALTER TABLE public.expedicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedicao_movimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedicao_movimento_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS expedicoes_admin_all ON public.expedicoes;
CREATE POLICY expedicoes_admin_all ON public.expedicoes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS expedicao_itens_admin_all ON public.expedicao_itens;
CREATE POLICY expedicao_itens_admin_all ON public.expedicao_itens
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS expedicao_movimentos_admin_all ON public.expedicao_movimentos;
CREATE POLICY expedicao_movimentos_admin_all ON public.expedicao_movimentos
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS expedicao_movimento_itens_admin_all ON public.expedicao_movimento_itens;
CREATE POLICY expedicao_movimento_itens_admin_all ON public.expedicao_movimento_itens
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 3. Helper: recalcular status da expedicao
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalcular_status_expedicao(p_expedicao_id BIGINT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_liberado NUMERIC(10,2);
  v_entregue NUMERIC(10,2);
  v_status   TEXT;
BEGIN
  SELECT
    COALESCE(SUM(metros_liberados), 0),
    COALESCE(SUM(metros_entregues), 0)
  INTO v_liberado, v_entregue
  FROM public.expedicao_itens
  WHERE expedicao_id = p_expedicao_id;

  IF v_liberado > 0 AND v_entregue >= v_liberado THEN
    v_status := 'concluida';
  ELSIF v_entregue > 0 THEN
    v_status := 'parcial';
  ELSE
    v_status := 'aguardando_expedicao';
  END IF;

  UPDATE public.expedicoes
  SET status = v_status,
      atualizado_em = now()
  WHERE id = p_expedicao_id;

  RETURN v_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalcular_status_expedicao(BIGINT) TO authenticated;


-- ============================================================
-- 4. RPC: liberar_expedicao
-- ============================================================

CREATE OR REPLACE FUNCTION public.liberar_expedicao(p_op_latex_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op           RECORD;
  v_lote         RECORD;
  v_expedicao_id BIGINT;
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
    RETURN jsonb_build_object('ok', false, 'erro', 'Somente OP de acabamento/latex pode liberar expedicao');
  END IF;

  IF v_op.status NOT IN ('finalizada', 'concluida') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Finalize o acabamento antes de liberar expedicao');
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

  SELECT id INTO v_expedicao_id
  FROM public.expedicoes
  WHERE op_latex_id = p_op_latex_id;

  IF v_expedicao_id IS NULL THEN
    INSERT INTO public.expedicoes (pedido_id, op_latex_id, lote_id, cliente_id, status)
    VALUES (v_lote.pedido_id, p_op_latex_id, v_op.lote_id, v_lote.cliente_id, 'aguardando_expedicao')
    RETURNING id INTO v_expedicao_id;
  END IF;

  INSERT INTO public.expedicao_itens (
    expedicao_id, op_item_id, pedido_item_id, modelo_id, metros_liberados
  )
  SELECT
    v_expedicao_id,
    oi.id,
    oi.pedido_item_id,
    oi.modelo_id,
    COALESCE(oi.metros_ajustados, oi.metros_pedidos)
  FROM public.op_itens oi
  WHERE oi.op_id = p_op_latex_id
    AND COALESCE(oi.metros_ajustados, oi.metros_pedidos) > 0
  ON CONFLICT (expedicao_id, op_item_id) DO UPDATE
    SET pedido_item_id = EXCLUDED.pedido_item_id,
        modelo_id = EXCLUDED.modelo_id,
        metros_liberados = EXCLUDED.metros_liberados,
        atualizado_em = now();

  PERFORM public.recalcular_status_expedicao(v_expedicao_id);

  RETURN jsonb_build_object(
    'ok', true,
    'expedicao_id', v_expedicao_id,
    'pedido_id', v_lote.pedido_id,
    'op_latex_id', p_op_latex_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.liberar_expedicao(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.liberar_expedicao(BIGINT) IS
  'Cria ou retorna expedicao para OP Latex finalizada. Nao conclui pedido.';


-- ============================================================
-- 5. RPC: registrar_entrega_expedicao
-- ============================================================

CREATE OR REPLACE FUNCTION public.registrar_entrega_expedicao(
  p_expedicao_id BIGINT,
  p_tipo         TEXT,
  p_data         DATE,
  p_itens        JSONB,
  p_observacao   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expedicao        RECORD;
  v_movimento_id     BIGINT;
  v_item_payload     JSONB;
  v_expedicao_item_id BIGINT;
  v_metros           NUMERIC(10,2);
  v_item             RECORD;
  v_status           TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  IF p_tipo NOT IN ('entrega', 'coleta') THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Tipo invalido');
  END IF;

  IF p_itens IS NULL OR jsonb_typeof(p_itens) <> 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Informe ao menos um item');
  END IF;

  SELECT * INTO v_expedicao
  FROM public.expedicoes
  WHERE id = p_expedicao_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Expedicao nao encontrada');
  END IF;

  IF v_expedicao.status = 'concluida' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Expedicao ja concluida');
  END IF;

  INSERT INTO public.expedicao_movimentos (expedicao_id, tipo, data, observacao, criado_por)
  VALUES (p_expedicao_id, p_tipo, COALESCE(p_data, CURRENT_DATE), p_observacao, auth.uid())
  RETURNING id INTO v_movimento_id;

  FOR v_item_payload IN SELECT value FROM jsonb_array_elements(p_itens)
  LOOP
    v_expedicao_item_id := (v_item_payload->>'expedicao_item_id')::BIGINT;
    v_metros := (v_item_payload->>'metros')::NUMERIC(10,2);

    IF v_expedicao_item_id IS NULL OR v_metros IS NULL OR v_metros <= 0 THEN
      RAISE EXCEPTION 'Item de expedicao invalido';
    END IF;

    SELECT * INTO v_item
    FROM public.expedicao_itens
    WHERE id = v_expedicao_item_id
      AND expedicao_id = p_expedicao_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item % nao pertence a expedicao %', v_expedicao_item_id, p_expedicao_id;
    END IF;

    IF v_item.metros_entregues + v_metros > v_item.metros_liberados THEN
      RAISE EXCEPTION 'Movimento excede saldo do item %', v_expedicao_item_id;
    END IF;

    INSERT INTO public.expedicao_movimento_itens (movimento_id, expedicao_item_id, metros)
    VALUES (v_movimento_id, v_expedicao_item_id, v_metros);

    UPDATE public.expedicao_itens
    SET metros_entregues = metros_entregues + v_metros,
        atualizado_em = now()
    WHERE id = v_expedicao_item_id;
  END LOOP;

  v_status := public.recalcular_status_expedicao(p_expedicao_id);

  RETURN jsonb_build_object(
    'ok', true,
    'expedicao_id', p_expedicao_id,
    'movimento_id', v_movimento_id,
    'status', v_status
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'erro', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_entrega_expedicao(BIGINT, TEXT, DATE, JSONB, TEXT) TO authenticated;

COMMENT ON FUNCTION public.registrar_entrega_expedicao(BIGINT, TEXT, DATE, JSONB, TEXT) IS
  'Registra entrega/coleta da expedicao e recalcula status parcial/concluida.';


-- ============================================================
-- 6. RPC: concluir_pedido_se_pronto
-- ============================================================

CREATE OR REPLACE FUNCTION public.concluir_pedido_se_pronto(p_pedido_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido        RECORD;
  v_pendencias    TEXT[] := ARRAY[]::TEXT[];
  v_total_ops      INTEGER;
  v_ops_abertas    INTEGER;
  v_latex_pendente INTEGER;
  v_exp_pendente   INTEGER;
  v_latex_sem_exp  INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_pedido
  FROM public.pedidos
  WHERE id = p_pedido_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Pedido nao encontrado');
  END IF;

  IF v_pedido.status = 'cancelado' THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Pedido cancelado nao pode ser concluido');
  END IF;

  SELECT COUNT(*) INTO v_total_ops
  FROM public.ops o
  JOIN public.lotes l ON l.id = o.lote_id
  WHERE l.pedido_id = p_pedido_id;

  IF v_total_ops = 0 THEN
    v_pendencias := array_append(v_pendencias, 'Pedido sem OP vinculada');
  END IF;

  SELECT COUNT(*) INTO v_ops_abertas
  FROM public.ops o
  JOIN public.lotes l ON l.id = o.lote_id
  WHERE l.pedido_id = p_pedido_id
    AND o.status NOT IN ('concluida','finalizada','cancelada');

  IF v_ops_abertas > 0 THEN
    v_pendencias := array_append(v_pendencias, 'Ha OP vinculada aberta ou em producao');
  END IF;

  SELECT COUNT(*) INTO v_latex_pendente
  FROM public.ops o
  JOIN public.lotes l ON l.id = o.lote_id
  WHERE l.pedido_id = p_pedido_id
    AND o.tipo = 'latex'
    AND o.status NOT IN ('concluida','finalizada','cancelada');

  IF v_latex_pendente > 0 THEN
    v_pendencias := array_append(v_pendencias, 'Ha OP de acabamento pendente');
  END IF;

  SELECT COUNT(*) INTO v_latex_sem_exp
  FROM public.ops o
  JOIN public.lotes l ON l.id = o.lote_id
  LEFT JOIN public.expedicoes e ON e.op_latex_id = o.id
  WHERE l.pedido_id = p_pedido_id
    AND o.tipo = 'latex'
    AND o.status IN ('concluida','finalizada')
    AND e.id IS NULL;

  IF v_latex_sem_exp > 0 THEN
    v_pendencias := array_append(v_pendencias, 'Ha acabamento finalizado sem expedicao');
  END IF;

  SELECT COUNT(*) INTO v_exp_pendente
  FROM public.expedicoes e
  WHERE e.pedido_id = p_pedido_id
    AND e.status <> 'concluida';

  IF v_exp_pendente > 0 THEN
    v_pendencias := array_append(v_pendencias, 'Ha expedicao com saldo pendente');
  END IF;

  IF array_length(v_pendencias, 1) IS NOT NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'erro', 'Pedido ainda possui pendencias',
      'pendencias', to_jsonb(v_pendencias)
    );
  END IF;

  UPDATE public.pedidos
  SET status = 'entregue',
      status_cliente_visual = 'concluido',
      status_cliente_mensagem = COALESCE(status_cliente_mensagem, 'Pedido entregue/coletado e concluido.'),
      status_cliente_atualizado_em = now(),
      atualizado_em = now()
  WHERE id = p_pedido_id;

  INSERT INTO public.pedido_eventos (pedido_id, status_anterior, status_novo, criado_por, observacao)
  VALUES (p_pedido_id, v_pedido.status, 'entregue', auth.uid(), 'Pedido concluido apos expedicao finalizada');

  RETURN jsonb_build_object('ok', true, 'pedido_id', p_pedido_id, 'status', 'entregue');
END;
$$;

GRANT EXECUTE ON FUNCTION public.concluir_pedido_se_pronto(UUID) TO authenticated;

COMMENT ON FUNCTION public.concluir_pedido_se_pronto(UUID) IS
  'Conclui pedido usando status operacional existente entregue, somente se OPs e expedicoes estiverem concluidas.';

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
