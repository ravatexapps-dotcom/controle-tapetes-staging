-- ============================================================================
-- PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION IMPLEMENTATION R1
-- Accepted contract: lifecycle §R.28 + schema contract §13.
-- Forward-only. No data conversion. No db/67-db/73 rewrite.
-- ============================================================================

BEGIN;
SET LOCAL lock_timeout = '5s';

-- --------------------------------------------------------------------------
-- 1. Permanent actor-scoped successful-command journal
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ordem_compra_distribuicao_comandos (
  id                     BIGSERIAL PRIMARY KEY,
  idempotency_namespace  TEXT NOT NULL DEFAULT 'native_distribution_v1'
    CHECK (idempotency_namespace = 'native_distribution_v1'),
  ator_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  idempotency_key        TEXT NOT NULL CHECK (
    idempotency_key = btrim(idempotency_key)
    AND length(idempotency_key) BETWEEN 1 AND 200
  ),
  comando_payload        JSONB NOT NULL,
  comando_hash           TEXT NOT NULL CHECK (comando_hash ~ '^[0-9a-f]{32}$'),
  resultado              JSONB NOT NULL,
  criado_em              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ordem_compra_distribuicao_comandos_identidade
    UNIQUE (idempotency_namespace, ator_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS ordem_compra_distribuicao_comandos_hash_idx
  ON public.ordem_compra_distribuicao_comandos(comando_hash);

ALTER TABLE public.ordem_compra_distribuicao_comandos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ordem_compra_distribuicao_comandos FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_distribuicao_comandos FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_distribuicao_comandos FROM authenticated;
REVOKE ALL ON TABLE public.ordem_compra_distribuicao_comandos FROM service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_distribuicao_comandos_id_seq FROM PUBLIC;
REVOKE ALL ON SEQUENCE public.ordem_compra_distribuicao_comandos_id_seq FROM anon;
REVOKE ALL ON SEQUENCE public.ordem_compra_distribuicao_comandos_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.ordem_compra_distribuicao_comandos_id_seq FROM service_role;

CREATE OR REPLACE FUNCTION public.trg_distribuicao_comando_immutable_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'ordem_compra_distribuicao_comandos is immutable: % is not permitted', TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_distribuicao_comando_immutable_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_distribuicao_comando_immutable_guard
  ON public.ordem_compra_distribuicao_comandos;
CREATE TRIGGER trg_distribuicao_comando_immutable_guard
  BEFORE UPDATE OR DELETE ON public.ordem_compra_distribuicao_comandos
  FOR EACH ROW EXECUTE FUNCTION public.trg_distribuicao_comando_immutable_guard();

COMMENT ON TABLE public.ordem_compra_distribuicao_comandos IS
  'F1 permanent immutable successful-command journal. Actor/key replay survives allocation, item, and never-emitted draft cleanup.';

-- --------------------------------------------------------------------------
-- 2. Correct logical allocation identity: exactly (item_id, necessidade_id)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ordem_compra_item_alocacao
    GROUP BY item_id, necessidade_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'F1 allocation-identity preflight failed: duplicate (item_id, necessidade_id) groups exist';
  END IF;
END;
$$;

DROP INDEX IF EXISTS public.ordem_compra_item_alocacao_identidade;
CREATE UNIQUE INDEX ordem_compra_item_alocacao_identidade
  ON public.ordem_compra_item_alocacao(item_id, necessidade_id);

-- --------------------------------------------------------------------------
-- 3. Provenance, freeze, and derived-quantity database backstops
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_alocacao_origem_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_need public.necessidade_compra_fio%ROWTYPE;
  v_item public.ordem_compra_item%ROWTYPE;
  v_order public.ordem_compra%ROWTYPE;
BEGIN
  SELECT * INTO v_need
  FROM public.necessidade_compra_fio
  WHERE id = NEW.necessidade_id;
  SELECT * INTO v_item
  FROM public.ordem_compra_item
  WHERE id = NEW.item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'allocation item does not exist';
  END IF;
  SELECT * INTO v_order
  FROM public.ordem_compra
  WHERE id = v_item.ordem_id;

  IF v_need.id IS NULL
     OR v_order.id IS NULL
     OR v_need.pedido_id IS DISTINCT FROM v_order.pedido_id
     OR v_need.material IS DISTINCT FROM v_item.material
     OR v_need.cor_id IS DISTINCT FROM v_item.cor_id
     OR v_need.cor_poliester IS DISTINCT FROM v_item.cor_poliester THEN
    RAISE EXCEPTION 'allocation need/item/Pedido identity is invalid';
  END IF;

  IF v_need.legado THEN
    IF NEW.op_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.op_id IS DISTINCT FROM OLD.op_id) THEN
      RAISE EXCEPTION 'legacy allocation real-OP provenance is immutable';
    END IF;
    RETURN NEW;
  END IF;

  IF v_need.origem_tipo = 'op' THEN
    IF v_need.op_id IS NULL OR NEW.op_id IS DISTINCT FROM v_need.op_id THEN
      RAISE EXCEPTION 'OP-origin allocation must preserve the locked need real OP';
    END IF;
  ELSIF v_need.origem_tipo = 'pedido' THEN
    IF v_need.op_id IS NOT NULL OR NEW.op_id IS NOT NULL THEN
      RAISE EXCEPTION 'Pedido-origin allocation must preserve NULL OP provenance';
    END IF;
  ELSE
    RAISE EXCEPTION 'allocation need origin is invalid';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_alocacao_origem_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS alocacao_origem_guard ON public.ordem_compra_item_alocacao;
CREATE TRIGGER alocacao_origem_guard
  BEFORE INSERT OR UPDATE OF item_id, necessidade_id, op_id
  ON public.ordem_compra_item_alocacao
  FOR EACH ROW EXECUTE FUNCTION public.trg_alocacao_origem_guard();

CREATE OR REPLACE FUNCTION public.trg_ordem_compra_identity_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (NEW.pedido_id IS DISTINCT FROM OLD.pedido_id
      OR NEW.fornecedor_id IS DISTINCT FROM OLD.fornecedor_id)
     AND (OLD.status_administrativo IS DISTINCT FROM 'rascunho'
          OR NEW.status_administrativo IS DISTINCT FROM 'rascunho') THEN
    RAISE EXCEPTION 'ordem_compra Pedido/supplier identity is immutable outside rascunho';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_ordem_compra_identity_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS ordem_compra_identity_guard ON public.ordem_compra;
CREATE TRIGGER ordem_compra_identity_guard
  BEFORE UPDATE OF pedido_id, fornecedor_id ON public.ordem_compra
  FOR EACH ROW EXECUTE FUNCTION public.trg_ordem_compra_identity_guard();

CREATE OR REPLACE FUNCTION public.trg_item_quantidade_rascunho_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT status_administrativo INTO v_old_status
    FROM public.ordem_compra WHERE id = OLD.ordem_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT status_administrativo INTO v_new_status
    FROM public.ordem_compra WHERE id = NEW.ordem_id;
  END IF;

  IF TG_OP = 'INSERT' AND v_new_status IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'ordem_compra_item cannot be inserted outside rascunho';
  ELSIF TG_OP = 'DELETE' AND v_old_status IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'ordem_compra_item cannot be deleted outside rascunho';
  ELSIF TG_OP = 'UPDATE'
    AND (NEW.ordem_id IS DISTINCT FROM OLD.ordem_id
      OR NEW.material IS DISTINCT FROM OLD.material
      OR NEW.cor_id IS DISTINCT FROM OLD.cor_id
      OR NEW.cor_poliester IS DISTINCT FROM OLD.cor_poliester
      OR NEW.kg_pedido IS DISTINCT FROM OLD.kg_pedido)
    AND (v_old_status IS DISTINCT FROM 'rascunho'
      OR v_new_status IS DISTINCT FROM 'rascunho') THEN
    RAISE EXCEPTION 'ordem_compra_item identity/quantity is immutable outside rascunho';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_item_quantidade_rascunho_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS item_quantidade_rascunho_guard ON public.ordem_compra_item;
CREATE TRIGGER item_quantidade_rascunho_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_compra_item
  FOR EACH ROW EXECUTE FUNCTION public.trg_item_quantidade_rascunho_guard();

CREATE OR REPLACE FUNCTION public.trg_alocacao_rascunho_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    SELECT oc.status_administrativo INTO v_old_status
    FROM public.ordem_compra_item i
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE i.id = OLD.item_id;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT oc.status_administrativo INTO v_new_status
    FROM public.ordem_compra_item i
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE i.id = NEW.item_id;
  END IF;

  IF COALESCE(v_old_status, 'rascunho') IS DISTINCT FROM 'rascunho'
     OR COALESCE(v_new_status, 'rascunho') IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'ordem_compra_item_alocacao is immutable outside rascunho';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_alocacao_rascunho_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS alocacao_rascunho_guard ON public.ordem_compra_item_alocacao;
CREATE TRIGGER alocacao_rascunho_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.ordem_compra_item_alocacao
  FOR EACH ROW EXECUTE FUNCTION public.trg_alocacao_rascunho_guard();

CREATE OR REPLACE FUNCTION public.trg_item_kg_pedido_derivado_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item_id BIGINT;
  v_item_ids BIGINT[];
  v_count BIGINT;
  v_sum NUMERIC(12,3);
  v_kg NUMERIC(12,3);
BEGIN
  IF TG_TABLE_NAME = 'ordem_compra_item' THEN
    IF TG_OP = 'DELETE' THEN
      v_item_ids := ARRAY[OLD.id];
    ELSE
      v_item_ids := ARRAY[NEW.id];
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_item_ids := ARRAY[OLD.item_id];
  ELSIF TG_OP = 'UPDATE' THEN
    v_item_ids := ARRAY[NEW.item_id, OLD.item_id];
  ELSE
    v_item_ids := ARRAY[NEW.item_id];
  END IF;

  FOREACH v_item_id IN ARRAY v_item_ids LOOP
    CONTINUE WHEN v_item_id IS NULL;
    SELECT i.kg_pedido, count(a.id), COALESCE(sum(a.kg_alocado), 0)
    INTO v_kg, v_count, v_sum
    FROM public.ordem_compra_item i
    LEFT JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
    WHERE i.id = v_item_id
    GROUP BY i.kg_pedido;

    IF FOUND AND (v_count = 0 OR v_kg IS DISTINCT FROM v_sum) THEN
      RAISE EXCEPTION 'ordem_compra_item % kg_pedido must equal its positive allocation sum', v_item_id;
    END IF;
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_item_kg_pedido_derivado_guard()
  FROM PUBLIC, anon, authenticated, service_role;

DROP TRIGGER IF EXISTS trg_item_kg_pedido_derivado_guard ON public.ordem_compra_item;
CREATE CONSTRAINT TRIGGER trg_item_kg_pedido_derivado_guard
  AFTER INSERT OR UPDATE OR DELETE ON public.ordem_compra_item
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_item_kg_pedido_derivado_guard();

DROP TRIGGER IF EXISTS trg_item_kg_pedido_derivado_guard ON public.ordem_compra_item_alocacao;
CREATE CONSTRAINT TRIGGER trg_item_kg_pedido_derivado_guard
  AFTER INSERT OR UPDATE OR DELETE ON public.ordem_compra_item_alocacao
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.trg_item_kg_pedido_derivado_guard();

-- --------------------------------------------------------------------------
-- 4. Sole need-first absolute-target distribution command
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.definir_alocacao_necessidade_compra_fio(
  p_necessidade_id BIGINT,
  p_fornecedor_id BIGINT,
  p_kg_alocado NUMERIC,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_key TEXT;
  v_target NUMERIC(12,3);
  v_payload JSONB;
  v_hash TEXT;
  v_command public.ordem_compra_distribuicao_comandos%ROWTYPE;
  v_need public.necessidade_compra_fio%ROWTYPE;
  v_supplier public.fornecedores%ROWTYPE;
  v_order public.ordem_compra%ROWTYPE;
  v_item public.ordem_compra_item%ROWTYPE;
  v_allocation public.ordem_compra_item_alocacao%ROWTYPE;
  v_resolved_pedido UUID;
  v_previous NUMERIC(12,3) := 0;
  v_available NUMERIC(12,3);
  v_item_total NUMERIC(12,3);
  v_need_allocated NUMERIC(12,3);
  v_discriminator TEXT;
  v_order_id BIGINT;
  v_item_id BIGINT;
  v_allocation_id BIGINT;
  v_item_removed BOOLEAN := FALSE;
  v_order_removed BOOLEAN := FALSE;
  v_remove_item BOOLEAN := FALSE;
  v_remove_order BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  IF v_actor IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Somente administrador autenticado pode distribuir necessidades');
  END IF;

  v_key := btrim(p_idempotency_key);
  IF p_idempotency_key IS NULL OR length(v_key) NOT BETWEEN 1 AND 200 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_invalida', 'erro', 'Chave de idempotencia invalida');
  END IF;
  IF p_kg_alocado IS NULL OR p_kg_alocado < 0
     OR round(p_kg_alocado, 3) IS DISTINCT FROM p_kg_alocado
     OR p_kg_alocado > 999999999.999 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'kg_invalido', 'erro', 'Quantidade deve usar NUMERIC(12,3), sem sinal negativo');
  END IF;
  v_target := p_kg_alocado::NUMERIC(12,3);

  v_payload := jsonb_build_object(
    'namespace', 'native_distribution_v1',
    'necessidade_id', p_necessidade_id,
    'fornecedor_id', p_fornecedor_id,
    'kg_alocado', to_char(v_target, 'FM9999999990.000')
  );
  v_hash := md5(v_payload::TEXT);

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'native_distribution_v1|command|' || v_actor::TEXT || '|' || v_key, 0
  ));

  SELECT * INTO v_command
  FROM public.ordem_compra_distribuicao_comandos
  WHERE idempotency_namespace = 'native_distribution_v1'
    AND ator_id = v_actor
    AND idempotency_key = v_key
  FOR UPDATE;
  IF FOUND THEN
    IF v_command.comando_payload = v_payload THEN
      RETURN v_command.resultado;
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Chave reutilizada com comando materialmente diferente');
  END IF;

  SELECT * INTO v_need
  FROM public.necessidade_compra_fio
  WHERE id = p_necessidade_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_nao_encontrada', 'erro', 'Necessidade nao encontrada');
  END IF;
  IF v_need.legado OR v_need.kg_necessario <= 0 OR v_need.pedido_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_invalida', 'erro', 'Necessidade nao e nativa e distribuivel');
  END IF;

  IF v_need.origem_tipo = 'op' THEN
    IF v_need.material <> 'algodao' OR v_need.op_id IS NULL OR v_need.cor_id IS NULL OR v_need.cor_poliester IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_origem_invalida', 'erro', 'Forma OP-origin invalida');
    END IF;
    SELECT l.pedido_id INTO v_resolved_pedido
    FROM public.ops o
    JOIN public.lotes l ON l.id = o.lote_id
    WHERE o.id = v_need.op_id;
    IF v_resolved_pedido IS DISTINCT FROM v_need.pedido_id THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'pedido_incoerente', 'erro', 'OP da necessidade nao pertence ao Pedido');
    END IF;
  ELSIF v_need.origem_tipo = 'pedido' THEN
    IF v_need.material <> 'poliester' OR v_need.op_id IS NOT NULL OR v_need.cor_id IS NOT NULL OR v_need.cor_poliester IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_origem_invalida', 'erro', 'Forma Pedido-origin invalida');
    END IF;
  ELSE
    RETURN jsonb_build_object('ok', false, 'codigo', 'necessidade_origem_invalida', 'erro', 'Origem da necessidade invalida');
  END IF;

  SELECT * INTO v_supplier
  FROM public.fornecedores
  WHERE id = p_fornecedor_id
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fornecedor_invalido', 'erro', 'Fornecedor inexistente');
  END IF;
  IF (v_need.material = 'algodao' AND v_supplier.tipo <> 'fio_algodao')
     OR (v_need.material = 'poliester' AND v_supplier.tipo <> 'fio_poliester') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fornecedor_incompativel', 'erro', 'Fornecedor incompativel com o material');
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'native_distribution_v1|draft|' || v_need.pedido_id::TEXT || '|' || p_fornecedor_id::TEXT, 0
  ));

  SELECT * INTO v_order
  FROM public.ordem_compra
  WHERE pedido_id = v_need.pedido_id
    AND fornecedor_id = p_fornecedor_id
    AND legado = FALSE
    AND status_administrativo = 'rascunho'
  FOR UPDATE;

  IF NOT FOUND THEN
    IF EXISTS (
      SELECT 1
      FROM public.ordem_compra_item_alocacao a
      JOIN public.ordem_compra_item i ON i.id = a.item_id
      JOIN public.ordem_compra o ON o.id = i.ordem_id
      WHERE a.necessidade_id = v_need.id
        AND o.pedido_id = v_need.pedido_id
        AND o.fornecedor_id = p_fornecedor_id
        AND o.status_administrativo <> 'rascunho'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'A alocacao correspondente pertence a entidade historica congelada');
    END IF;
    IF v_target = 0 THEN
      v_discriminator := 'unchanged';
      v_need_allocated := v_need.kg_alocado;
      v_result := jsonb_build_object(
        'ok', true, 'codigo', 'ok', 'idempotency_key', v_key,
        'discriminador', v_discriminator, 'necessidade_id', v_need.id,
        'pedido_id', v_need.pedido_id, 'fornecedor_id', p_fornecedor_id,
        'origem_tipo', v_need.origem_tipo, 'op_id', v_need.op_id,
        'material', v_need.material, 'cor_id', v_need.cor_id,
        'cor_poliester', v_need.cor_poliester, 'ordem_compra_id', NULL,
        'ordem_compra_item_id', NULL, 'alocacao_id', NULL,
        'kg_anterior', 0::NUMERIC(12,3), 'kg_final', v_target,
        'item_kg_pedido', NULL, 'necessidade_kg_necessario', v_need.kg_necessario,
        'necessidade_kg_alocado', v_need_allocated,
        'necessidade_kg_restante', v_need.kg_necessario - v_need_allocated,
        'item_removido', false, 'ordem_removida', false
      );
      INSERT INTO public.ordem_compra_distribuicao_comandos(
        ator_id, idempotency_key, comando_payload, comando_hash, resultado
      ) VALUES (v_actor, v_key, v_payload, v_hash, v_result);
      RETURN v_result;
    END IF;

    v_available := v_need.kg_necessario - v_need.kg_alocado;
    IF v_target > v_available THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'excede_saldo',
        'erro', 'Alocacao excede o saldo da necessidade',
        'necessidade_id', v_need.id, 'disponivel', v_available);
    END IF;

    INSERT INTO public.ordem_compra(
      pedido_id, fornecedor_id, status_administrativo, status_aceite,
      status_recebimento, legado
    ) VALUES (
      v_need.pedido_id, p_fornecedor_id, 'rascunho', 'nao_aplicavel',
      'nao_recebido', FALSE
    ) RETURNING * INTO v_order;
  END IF;
  v_order_id := v_order.id;

  SELECT * INTO v_item
  FROM public.ordem_compra_item
  WHERE ordem_id = v_order.id
    AND material = v_need.material
    AND cor_id IS NOT DISTINCT FROM v_need.cor_id
    AND cor_poliester IS NOT DISTINCT FROM v_need.cor_poliester
  FOR UPDATE;

  IF NOT FOUND AND v_target = 0 THEN
    v_need_allocated := v_need.kg_alocado;
    v_result := jsonb_build_object(
      'ok', true, 'codigo', 'ok', 'idempotency_key', v_key,
      'discriminador', 'unchanged', 'necessidade_id', v_need.id,
      'pedido_id', v_need.pedido_id, 'fornecedor_id', p_fornecedor_id,
      'origem_tipo', v_need.origem_tipo, 'op_id', v_need.op_id,
      'material', v_need.material, 'cor_id', v_need.cor_id,
      'cor_poliester', v_need.cor_poliester, 'ordem_compra_id', NULL,
      'ordem_compra_item_id', NULL, 'alocacao_id', NULL,
      'kg_anterior', 0::NUMERIC(12,3), 'kg_final', v_target,
      'item_kg_pedido', NULL, 'necessidade_kg_necessario', v_need.kg_necessario,
      'necessidade_kg_alocado', v_need_allocated,
      'necessidade_kg_restante', v_need.kg_necessario - v_need_allocated,
      'item_removido', false, 'ordem_removida', false
    );
    INSERT INTO public.ordem_compra_distribuicao_comandos(
      ator_id, idempotency_key, comando_payload, comando_hash, resultado
    ) VALUES (v_actor, v_key, v_payload, v_hash, v_result);
    RETURN v_result;
  ELSIF NOT FOUND THEN
    v_available := v_need.kg_necessario - v_need.kg_alocado;
    IF v_target > v_available THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'excede_saldo',
        'erro', 'Alocacao excede o saldo da necessidade',
        'necessidade_id', v_need.id, 'disponivel', v_available);
    END IF;
    INSERT INTO public.ordem_compra_item(
      ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido
    ) VALUES (
      v_order.id, v_need.material, v_need.cor_id, v_need.cor_poliester,
      v_target, 0
    ) RETURNING * INTO v_item;
  END IF;
  v_item_id := v_item.id;

  SELECT * INTO v_allocation
  FROM public.ordem_compra_item_alocacao
  WHERE item_id = v_item.id
    AND necessidade_id = v_need.id
  FOR UPDATE;
  IF FOUND THEN
    v_previous := v_allocation.kg_alocado;
    v_allocation_id := v_allocation.id;
  END IF;

  v_available := v_need.kg_necessario - (v_need.kg_alocado - v_previous);
  IF v_target > v_available THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'excede_saldo',
      'erro', 'Alocacao excede o saldo da necessidade',
      'necessidade_id', v_need.id, 'disponivel', v_available);
  END IF;

  IF v_target = 0 AND v_allocation.id IS NOT NULL THEN
    SELECT NOT EXISTS (
      SELECT 1
      FROM public.ordem_compra_item_alocacao
      WHERE item_id = v_item.id
        AND id <> v_allocation.id
    ) INTO v_remove_item;

    IF v_remove_item THEN
      IF EXISTS (
        SELECT 1 FROM public.ordem_compra_fio_lancamentos
        WHERE ordem_compra_item_id = v_item.id
      ) THEN
        RETURN jsonb_build_object('ok', false, 'codigo', 'limpeza_conflitante', 'erro', 'Item possui historico e nao pode ser limpo');
      END IF;

      SELECT NOT EXISTS (
        SELECT 1
        FROM public.ordem_compra_item
        WHERE ordem_id = v_order.id
          AND id <> v_item.id
      ) INTO v_remove_order;

      IF v_remove_order AND (
        v_order.status_administrativo <> 'rascunho'
        OR v_order.emitida_em IS NOT NULL
        OR v_order.cancelada_em IS NOT NULL
        OR EXISTS (SELECT 1 FROM public.ordem_compra_eventos WHERE ordem_compra_id = v_order.id)
        OR EXISTS (SELECT 1 FROM public.ordem_compra_recebimentos WHERE ordem_compra_id = v_order.id)
      ) THEN
        RETURN jsonb_build_object('ok', false, 'codigo', 'limpeza_conflitante', 'erro', 'Ordem possui historico e nao pode ser limpa');
      END IF;
    END IF;
  END IF;

  IF v_target > 0 AND v_allocation.id IS NULL THEN
    INSERT INTO public.ordem_compra_item_alocacao(
      item_id, necessidade_id, op_id, kg_alocado
    ) VALUES (
      v_item.id, v_need.id,
      CASE WHEN v_need.origem_tipo = 'op' THEN v_need.op_id ELSE NULL END,
      v_target
    ) RETURNING id INTO v_allocation_id;
    v_discriminator := 'created';
  ELSIF v_target > v_previous THEN
    UPDATE public.ordem_compra_item_alocacao
    SET kg_alocado = v_target
    WHERE id = v_allocation.id;
    v_discriminator := 'increased';
  ELSIF v_target > 0 AND v_target < v_previous THEN
    UPDATE public.ordem_compra_item_alocacao
    SET kg_alocado = v_target
    WHERE id = v_allocation.id;
    v_discriminator := 'reduced';
  ELSIF v_target = 0 AND v_allocation.id IS NOT NULL THEN
    DELETE FROM public.ordem_compra_item_alocacao WHERE id = v_allocation.id;
    v_discriminator := 'removed';
  ELSE
    v_discriminator := 'unchanged';
  END IF;

  IF v_target = 0 AND v_allocation.id IS NOT NULL AND v_remove_item THEN
      DELETE FROM public.ordem_compra_item WHERE id = v_item.id;
      v_item_removed := TRUE;
      v_item_total := NULL;

      IF v_remove_order THEN
        DELETE FROM public.ordem_compra WHERE id = v_order.id;
        v_order_removed := TRUE;
      END IF;
  END IF;

  IF NOT v_item_removed THEN
    SELECT sum(kg_alocado)::NUMERIC(12,3) INTO v_item_total
    FROM public.ordem_compra_item_alocacao
    WHERE item_id = v_item.id;
    UPDATE public.ordem_compra_item
    SET kg_pedido = v_item_total
    WHERE id = v_item.id;
  END IF;

  SELECT kg_alocado INTO v_need_allocated
  FROM public.necessidade_compra_fio
  WHERE id = v_need.id;

  v_result := jsonb_build_object(
    'ok', true, 'codigo', 'ok', 'idempotency_key', v_key,
    'discriminador', v_discriminator, 'necessidade_id', v_need.id,
    'pedido_id', v_need.pedido_id, 'fornecedor_id', p_fornecedor_id,
    'origem_tipo', v_need.origem_tipo,
    'op_id', CASE WHEN v_need.origem_tipo = 'op' THEN v_need.op_id ELSE NULL END,
    'material', v_need.material, 'cor_id', v_need.cor_id,
    'cor_poliester', v_need.cor_poliester,
    'ordem_compra_id', v_order_id, 'ordem_compra_item_id', v_item_id,
    'alocacao_id', v_allocation_id, 'kg_anterior', v_previous,
    'kg_final', v_target, 'item_kg_pedido', v_item_total,
    'necessidade_kg_necessario', v_need.kg_necessario,
    'necessidade_kg_alocado', v_need_allocated,
    'necessidade_kg_restante', v_need.kg_necessario - v_need_allocated,
    'item_removido', v_item_removed, 'ordem_removida', v_order_removed
  );

  INSERT INTO public.ordem_compra_distribuicao_comandos(
    ator_id, idempotency_key, comando_payload, comando_hash, resultado
  ) VALUES (v_actor, v_key, v_payload, v_hash, v_result);

  RETURN v_result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alocacao_duplicada', 'erro', 'Identidade logica de alocacao duplicada');
END;
$$;

COMMENT ON FUNCTION public.definir_alocacao_necessidade_compra_fio(BIGINT, BIGINT, NUMERIC, TEXT) IS
  'F1 sole native distribution writer: actor-scoped exact replay, locked need-derived Pedido/material/color/real-or-NULL OP, absolute target, allocation-derived item quantity, and deterministic draft cleanup.';

-- --------------------------------------------------------------------------
-- 5. Phase C shared Pedido-origin NULL-OP receipt/ledger correction
-- --------------------------------------------------------------------------

ALTER TABLE public.ordem_compra_fio_lancamentos
  DROP CONSTRAINT IF EXISTS ordem_compra_fio_lancamentos_native_shape;
ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_native_shape CHECK (
    recebimento_id IS NULL
    OR (
      ordem_compra_fio_id IS NULL
      AND ordem_compra_item_id IS NOT NULL
      AND ordem_compra_id IS NOT NULL
      AND material IS NOT NULL
      AND ((material = 'algodao' AND cor_id IS NOT NULL AND cor_poliester IS NULL)
        OR (material = 'poliester' AND cor_id IS NULL AND cor_poliester IS NOT NULL))
      AND ator_tipo IS NOT NULL
      AND linha_indice IS NOT NULL AND linha_indice > 0
      AND (
        (ordem_compra_item_alocacao_id IS NOT NULL AND kg_excesso = 0)
        OR
        (ordem_compra_item_alocacao_id IS NULL AND op_id IS NULL AND kg_excesso = kg_recebido)
      )
    )
  );

COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.op_id IS
  'Server-derived allocation provenance: real OP for native OP-origin and C3A legacy attributed lines, NULL for shared Pedido-origin allocated lines and explicit excess.';

CREATE OR REPLACE FUNCTION public.trg_native_lancamento_shape_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_order public.ordem_compra%ROWTYPE;
  v_item public.ordem_compra_item%ROWTYPE;
  v_alloc public.ordem_compra_item_alocacao%ROWTYPE;
  v_need public.necessidade_compra_fio%ROWTYPE;
  v_source public.ordem_compra_fio_lancamentos%ROWTYPE;
BEGIN
  IF NEW.recebimento_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_header
  FROM public.ordem_compra_recebimentos
  WHERE id = NEW.recebimento_id;
  IF NOT FOUND OR v_header.ordem_compra_id <> NEW.ordem_compra_id THEN
    RAISE EXCEPTION 'native ledger header/order mismatch';
  END IF;
  IF (v_header.ator_tipo = 'sistema' AND NEW.criado_por IS NOT NULL)
     OR (v_header.ator_tipo <> 'sistema'
       AND (v_header.ator_id IS DISTINCT FROM NEW.criado_por
         OR v_header.ator_tipo IS DISTINCT FROM NEW.ator_tipo)) THEN
    RAISE EXCEPTION 'native ledger actor mismatch';
  END IF;

  SELECT * INTO v_order FROM public.ordem_compra WHERE id = NEW.ordem_compra_id;
  SELECT * INTO v_item FROM public.ordem_compra_item WHERE id = NEW.ordem_compra_item_id;
  IF v_order.id IS NULL OR v_item.id IS NULL OR v_item.ordem_id <> NEW.ordem_compra_id
     OR v_item.material IS DISTINCT FROM NEW.material
     OR v_item.cor_id IS DISTINCT FROM NEW.cor_id
     OR v_item.cor_poliester IS DISTINCT FROM NEW.cor_poliester THEN
    RAISE EXCEPTION 'native ledger item/material identity mismatch';
  END IF;

  IF NEW.ordem_compra_item_alocacao_id IS NOT NULL THEN
    SELECT * INTO v_alloc
    FROM public.ordem_compra_item_alocacao
    WHERE id = NEW.ordem_compra_item_alocacao_id;
    SELECT * INTO v_need
    FROM public.necessidade_compra_fio
    WHERE id = v_alloc.necessidade_id;

    IF v_alloc.id IS NULL OR v_need.id IS NULL
       OR v_alloc.item_id <> NEW.ordem_compra_item_id
       OR v_alloc.op_id IS DISTINCT FROM NEW.op_id
       OR v_need.pedido_id IS DISTINCT FROM v_order.pedido_id
       OR v_need.material IS DISTINCT FROM v_item.material
       OR v_need.cor_id IS DISTINCT FROM v_item.cor_id
       OR v_need.cor_poliester IS DISTINCT FROM v_item.cor_poliester THEN
      RAISE EXCEPTION 'native ledger allocation/provenance identity mismatch';
    END IF;

    IF NOT v_need.legado AND NOT (
      (v_need.origem_tipo = 'op' AND v_need.op_id IS NOT NULL
        AND v_alloc.op_id IS NOT DISTINCT FROM v_need.op_id)
      OR
      (v_need.origem_tipo = 'pedido' AND v_need.op_id IS NULL
        AND v_alloc.op_id IS NULL)
    ) THEN
      RAISE EXCEPTION 'native ledger allocation origin mismatch';
    END IF;
    IF v_need.legado AND v_alloc.op_id IS NULL THEN
      RAISE EXCEPTION 'legacy attributed ledger line requires its real OP';
    END IF;
  ELSIF NEW.op_id IS NOT NULL THEN
    RAISE EXCEPTION 'explicit excess cannot carry OP provenance';
  END IF;

  IF NEW.tipo = 'import_saldo_inicial' THEN
    IF v_header.comando_tipo <> 'import_saldo_inicial'
       OR v_header.ator_tipo <> 'sistema'
       OR NEW.estorno_de_id IS NOT NULL
       OR NEW.kg_recebido <= 0 THEN
      RAISE EXCEPTION 'invalid opening-balance import';
    END IF;
  ELSIF NEW.tipo = 'recebimento' THEN
    IF v_header.comando_tipo <> 'recebimento' OR NEW.estorno_de_id IS NOT NULL THEN
      RAISE EXCEPTION 'positive native receipt/header mismatch';
    END IF;
  ELSIF NEW.tipo = 'estorno' THEN
    IF v_header.comando_tipo <> 'estorno' OR NEW.estorno_de_id IS NULL THEN
      RAISE EXCEPTION 'native reversal/header mismatch';
    END IF;
    SELECT * INTO v_source
    FROM public.ordem_compra_fio_lancamentos
    WHERE id = NEW.estorno_de_id;
    IF NOT FOUND OR v_source.tipo <> 'recebimento'
       OR v_source.recebimento_id IS NULL
       OR v_source.ordem_compra_id IS DISTINCT FROM NEW.ordem_compra_id
       OR v_source.ordem_compra_item_id IS DISTINCT FROM NEW.ordem_compra_item_id
       OR v_source.ordem_compra_item_alocacao_id IS DISTINCT FROM NEW.ordem_compra_item_alocacao_id
       OR v_source.op_id IS DISTINCT FROM NEW.op_id
       OR v_source.material IS DISTINCT FROM NEW.material
       OR v_source.cor_id IS DISTINCT FROM NEW.cor_id
       OR v_source.cor_poliester IS DISTINCT FROM NEW.cor_poliester THEN
      RAISE EXCEPTION 'native reversal attribution differs from its positive source';
    END IF;
  ELSE
    RAISE EXCEPTION 'invalid ledger type';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_native_lancamento_shape_guard()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.registrar_recebimento_ordem_compra(
  p_ordem_id BIGINT,
  p_idempotency_key TEXT,
  p_recebido_em TIMESTAMPTZ,
  p_documento_ref TEXT,
  p_origem_tipo TEXT,
  p_origem_ref TEXT,
  p_linhas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor RECORD;
  v_actor_type TEXT;
  v_order public.ordem_compra%ROWTYPE;
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_payload JSONB;
  v_hash TEXT;
  v_header_id BIGINT;
  v_line RECORD;
  v_count INTEGER;
  v_existing NUMERIC(12,3);
  v_error TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Usuario nao autenticado');
  END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) NOT BETWEEN 1 AND 200 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_invalida', 'erro', 'Chave de idempotencia invalida');
  END IF;
  IF p_recebido_em IS NULL OR p_origem_tipo IS NULL OR length(btrim(p_origem_tipo)) NOT BETWEEN 1 AND 80 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Data e origem sao obrigatorias');
  END IF;
  IF jsonb_typeof(p_linhas) <> 'array' OR jsonb_array_length(p_linhas) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linhas_invalidas', 'erro', 'Informe ao menos uma linha');
  END IF;

  SELECT u.tipo, u.ativo, u.fornecedor_id
  INTO v_actor
  FROM public.usuarios u
  WHERE u.id = auth.uid();
  IF NOT FOUND OR v_actor.ativo IS NOT TRUE OR v_actor.tipo NOT IN ('admin', 'fornecedor') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Ator sem permissao de recebimento');
  END IF;
  v_actor_type := v_actor.tipo;

  DROP TABLE IF EXISTS pg_temp._c2_receipt_lines;
  CREATE TEMP TABLE pg_temp._c2_receipt_lines (
    input_index INTEGER,
    line_index INTEGER,
    item_id BIGINT,
    destination TEXT,
    allocation_id BIGINT,
    kg NUMERIC(12,3),
    material TEXT,
    cor_id BIGINT,
    cor_poliester TEXT,
    op_id BIGINT
  ) ON COMMIT DROP;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_linhas) e(value)
    WHERE jsonb_typeof(e.value) <> 'object'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Cada linha deve ser um objeto');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_linhas) e(value),
         LATERAL jsonb_object_keys(e.value) k(key)
    WHERE k.key NOT IN ('item_id', 'destino', 'alocacao_id', 'kg')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Linha contem campo nao permitido');
  END IF;

  BEGIN
    INSERT INTO pg_temp._c2_receipt_lines(input_index, item_id, destination, allocation_id, kg)
    SELECT ordinality::INTEGER,
           (value->>'item_id')::BIGINT,
           value->>'destino',
           NULLIF(value->>'alocacao_id', '')::BIGINT,
           (value->>'kg')::NUMERIC(12,3)
    FROM jsonb_array_elements(p_linhas) WITH ORDINALITY AS x(value, ordinality);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Formato de linha invalido');
  END;

  IF EXISTS (
    SELECT 1 FROM pg_temp._c2_receipt_lines
    WHERE item_id IS NULL OR destination NOT IN ('alocacao', 'excesso') OR kg IS NULL OR kg <= 0
       OR (destination = 'alocacao' AND allocation_id IS NULL)
       OR (destination = 'excesso' AND allocation_id IS NOT NULL)
  ) OR EXISTS (
    SELECT 1 FROM pg_temp._c2_receipt_lines
    GROUP BY item_id, destination, allocation_id HAVING count(*) > 1
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Identidade, destino ou quantidade de linha invalida');
  END IF;

  WITH ranked AS (
    SELECT input_index,
           row_number() OVER (
             ORDER BY item_id, CASE destination WHEN 'alocacao' THEN 0 ELSE 1 END,
                      allocation_id NULLS LAST, input_index
           )::INTEGER AS stable_index
    FROM pg_temp._c2_receipt_lines
  )
  UPDATE pg_temp._c2_receipt_lines t
  SET line_index = r.stable_index
  FROM ranked r
  WHERE r.input_index = t.input_index;

  SELECT * INTO v_order
  FROM public.ordem_compra
  WHERE id = p_ordem_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;

  PERFORM i.id
  FROM public.ordem_compra_item i
  WHERE i.id IN (SELECT DISTINCT t.item_id FROM pg_temp._c2_receipt_lines t)
  ORDER BY i.id
  FOR UPDATE;

  SELECT count(DISTINCT i.id) INTO v_count
  FROM public.ordem_compra_item i
  WHERE i.ordem_id = p_ordem_id
    AND i.id IN (SELECT DISTINCT t.item_id FROM pg_temp._c2_receipt_lines t);
  IF v_count <> (SELECT count(DISTINCT item_id) FROM pg_temp._c2_receipt_lines) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'item_invalido', 'erro', 'Item nao pertence a ordem');
  END IF;

  PERFORM a.id
  FROM public.ordem_compra_item_alocacao a
  WHERE a.id IN (
    SELECT DISTINCT t.allocation_id FROM pg_temp._c2_receipt_lines t WHERE t.allocation_id IS NOT NULL
  )
  ORDER BY a.id
  FOR UPDATE;

  SELECT count(DISTINCT a.id) INTO v_count
  FROM public.ordem_compra_item_alocacao a
  JOIN pg_temp._c2_receipt_lines t ON t.allocation_id = a.id
  JOIN public.ordem_compra_item i ON i.id = a.item_id
  JOIN public.necessidade_compra_fio n ON n.id = a.necessidade_id
  WHERE a.item_id = t.item_id
    AND n.legado = FALSE
    AND n.pedido_id = v_order.pedido_id
    AND n.material = i.material
    AND n.cor_id IS NOT DISTINCT FROM i.cor_id
    AND n.cor_poliester IS NOT DISTINCT FROM i.cor_poliester
    AND (
      (n.origem_tipo = 'op' AND n.op_id IS NOT NULL
        AND a.op_id IS NOT DISTINCT FROM n.op_id)
      OR
      (n.origem_tipo = 'pedido' AND n.op_id IS NULL AND a.op_id IS NULL)
    );
  IF v_count <> (SELECT count(DISTINCT allocation_id) FROM pg_temp._c2_receipt_lines WHERE allocation_id IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alocacao_invalida', 'erro', 'Alocacao, necessidade ou proveniencia nao corresponde ao item e Pedido');
  END IF;

  UPDATE pg_temp._c2_receipt_lines t
  SET material = i.material,
      cor_id = i.cor_id,
      cor_poliester = i.cor_poliester
  FROM public.ordem_compra_item i
  WHERE i.id = t.item_id;

  UPDATE pg_temp._c2_receipt_lines t
  SET op_id = a.op_id
  FROM public.ordem_compra_item_alocacao a
  WHERE a.id = t.allocation_id;

  SELECT jsonb_build_object(
    'schema_version', 1,
    'ordem_compra_id', p_ordem_id,
    'recebido_em', p_recebido_em,
    'documento_ref', p_documento_ref,
    'origem_tipo', btrim(p_origem_tipo),
    'origem_ref', p_origem_ref,
    'linhas', jsonb_agg(jsonb_build_object(
      'linha_indice', line_index,
      'item_id', item_id,
      'destino', destination,
      'alocacao_id', allocation_id,
      'kg', kg
    ) ORDER BY line_index)
  )
  INTO v_payload
  FROM pg_temp._c2_receipt_lines;
  v_hash := md5(v_payload::TEXT);

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'native_receipt_v1|' || v_actor_type || '|' || auth.uid()::TEXT || '|' || btrim(p_idempotency_key), 0
  ));

  SELECT * INTO v_header
  FROM public.ordem_compra_recebimentos h
  WHERE h.idempotency_namespace = 'native_receipt_v1'
    AND h.ator_tipo = v_actor_type
    AND h.ator_id = auth.uid()
    AND h.idempotency_key = btrim(p_idempotency_key)
  FOR UPDATE;
  IF FOUND THEN
    IF v_header.comando_tipo = 'recebimento'
       AND v_header.ordem_compra_id = p_ordem_id
       AND v_header.comando_hash = v_hash
       AND v_header.comando_payload = v_payload THEN
      RETURN public._resultado_comando_recebimento(v_header.id);
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Chave reutilizada com comando diferente');
  END IF;

  IF v_order.legado OR v_order.status_administrativo <> 'emitida' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', 'erro', 'Somente ordem nativa emitida pode receber');
  END IF;
  IF v_order.status_aceite = 'rejeitada' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'aceite_rejeitada', 'erro', 'Ordem rejeitada nao pode receber');
  END IF;
  IF v_order.status_aceite NOT IN ('nao_aplicavel', 'aceita') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'aceite_pendente', 'erro', 'Ordem ainda nao esta elegivel para recebimento');
  END IF;
  IF v_actor_type = 'admin' THEN
    IF NOT public.is_admin() THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Administrador invalido');
    END IF;
  ELSIF v_actor.fornecedor_id IS NULL OR v_actor.fornecedor_id IS DISTINCT FROM v_order.fornecedor_id THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'fornecedor_incorreto', 'erro', 'Fornecedor nao corresponde a ordem');
  END IF;

  PERFORM l.id
  FROM public.ordem_compra_fio_lancamentos l
  WHERE l.ordem_compra_item_id IN (SELECT DISTINCT t.item_id FROM pg_temp._c2_receipt_lines t)
  ORDER BY l.id
  FOR UPDATE;

  FOR v_line IN
    SELECT t.*, a.kg_alocado, i.kg_pedido
    FROM pg_temp._c2_receipt_lines t
    JOIN public.ordem_compra_item i ON i.id = t.item_id
    LEFT JOIN public.ordem_compra_item_alocacao a ON a.id = t.allocation_id
    ORDER BY t.line_index
  LOOP
    IF v_line.destination = 'alocacao' THEN
      SELECT COALESCE(SUM(l.kg_recebido), 0)
      INTO v_existing
      FROM public.ordem_compra_fio_lancamentos l
      WHERE l.ordem_compra_item_alocacao_id = v_line.allocation_id;
      IF v_existing + v_line.kg > v_line.kg_alocado THEN
        RETURN jsonb_build_object('ok', false, 'codigo', 'excede_alocacao', 'erro', 'Recebimento excede a alocacao', 'alocacao_id', v_line.allocation_id, 'disponivel', v_line.kg_alocado - v_existing);
      END IF;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.ordem_compra_item i
    JOIN (
      SELECT t.item_id, SUM(t.kg) FILTER (WHERE t.destination = 'alocacao') AS requested
      FROM pg_temp._c2_receipt_lines t GROUP BY t.item_id
    ) q ON q.item_id = i.id
    WHERE COALESCE((
      SELECT SUM(l.kg_recebido)
      FROM public.ordem_compra_fio_lancamentos l
      WHERE l.ordem_compra_item_id = i.id
        AND l.ordem_compra_item_alocacao_id IS NOT NULL
    ), 0) + COALESCE(q.requested, 0) > i.kg_pedido
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'excede_item', 'erro', 'Quantidade alocada recebida excede o item; classifique o excedente explicitamente');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'native_receipt_inventory|' || x.material || '|' || COALESCE(x.cor_id::TEXT, '') || '|' || COALESCE(x.cor_poliester, ''), 0
  ))
  FROM (
    SELECT DISTINCT material, cor_id, cor_poliester
    FROM pg_temp._c2_receipt_lines
    ORDER BY material, cor_id NULLS LAST, cor_poliester NULLS LAST
  ) x;

  INSERT INTO public.ordem_compra_recebimentos(
    ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
    ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
    comando_payload, comando_hash, resultado_metadata
  ) VALUES (
    p_ordem_id, 'recebimento', 'native_receipt_v1', btrim(p_idempotency_key),
    auth.uid(), v_actor_type, p_recebido_em, NULLIF(btrim(p_documento_ref), ''),
    btrim(p_origem_tipo), NULLIF(btrim(p_origem_ref), ''), v_payload, v_hash,
    jsonb_build_object('schema_version', 1, 'line_count', jsonb_array_length(p_linhas))
  ) RETURNING id INTO v_header_id;

  FOR v_line IN SELECT * FROM pg_temp._c2_receipt_lines ORDER BY line_index LOOP
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key,
      origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
      kg_excesso, ator_tipo, linha_indice
    ) VALUES (
      NULL, v_line.item_id, v_line.kg, p_recebido_em::DATE,
      NULLIF(btrim(p_documento_ref), ''), auth.uid(), 'recebimento', NULL,
      'native_receipt:' || v_header_id::TEXT || ':' || v_line.line_index::TEXT,
      btrim(p_origem_tipo), NULLIF(btrim(p_origem_ref), ''), v_header_id, p_ordem_id,
      v_line.allocation_id, v_line.op_id, v_line.material, v_line.cor_id,
      v_line.cor_poliester, CASE WHEN v_line.destination = 'excesso' THEN v_line.kg ELSE 0 END,
      v_actor_type, v_line.line_index
    );
  END LOOP;

  INSERT INTO public.ordem_compra_eventos(
    ordem_compra_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por
  ) VALUES (
    p_ordem_id, 'recebimento', 'recebimento_registrado', NULL,
    (SELECT status_recebimento FROM public.ordem_compra WHERE id = p_ordem_id),
    jsonb_build_object('recebimento_id', v_header_id, 'ator_tipo', v_actor_type), auth.uid()
  );

  RETURN public._resultado_comando_recebimento(v_header_id);
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
  RETURN jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'erro', v_error);
END;
$$;

COMMENT ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) IS
  'PHASE-C F1-corrected native receipt writer: OP-origin uses the allocation real OP; shared Pedido-origin preserves NULL OP; excess remains allocation-free and OP-free.';

COMMENT ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) IS
  'PHASE-C verification read model. Shared Pedido-origin allocation, ledger, reversal, and movement identities are returned with op_id null; OP-origin and C3A legacy identities retain real OP.';

-- --------------------------------------------------------------------------
-- 6. Exact final execution ACL matrix
-- --------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.definir_alocacao_necessidade_compra_fio(BIGINT, BIGINT, NUMERIC, TEXT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.definir_alocacao_necessidade_compra_fio(BIGINT, BIGINT, NUMERIC, TEXT)
  TO authenticated;

REVOKE ALL ON FUNCTION public.definir_item_ordem_compra(UUID, BIGINT, TEXT, BIGINT, TEXT, NUMERIC)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.remover_item_ordem_compra(BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.remover_alocacao_compra_fio(BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sincronizar_necessidades_compra_fio(UUID)
  TO authenticated;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancelar_ordem_compra(BIGINT)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancelar_ordem_compra(BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB)
  TO authenticated;

REVOKE ALL ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB)
  TO authenticated;

REVOKE ALL ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a()
  FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() TO authenticated;

REVOKE ALL ON FUNCTION public.importar_saldo_inicial_ordem_compra_c3a(JSONB)
  FROM PUBLIC, anon, authenticated, service_role;

ALTER FUNCTION public.definir_alocacao_necessidade_compra_fio(BIGINT, BIGINT, NUMERIC, TEXT) OWNER TO postgres;
ALTER FUNCTION public.trg_distribuicao_comando_immutable_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_alocacao_origem_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_ordem_compra_identity_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_item_quantidade_rascunho_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_alocacao_rascunho_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_item_kg_pedido_derivado_guard() OWNER TO postgres;
ALTER FUNCTION public.trg_native_lancamento_shape_guard() OWNER TO postgres;
ALTER FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) OWNER TO postgres;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
