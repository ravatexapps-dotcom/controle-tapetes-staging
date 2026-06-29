-- ============================================================
-- Fase: RAVATEX-TAPETES-CLIENTE-PARCIAIS-SCHEMA-A
-- Schema minimo para acompanhamento parcial B2B do cliente.
--
-- Escopo:
--   - adicionar campos de controle parcial em public.pedidos;
--   - criar public.pedido_parciais;
--   - criar public.pedido_parcial_itens;
--   - criar triggers de timestamp e consistencia;
--   - criar RLS admin + cliente SELECT.
--
-- Contrato de modelagem:
--   - pedido_parciais representa parciais/chunks ATUAIS do pedido;
--   - a distribuicao por etapa/situacao sera calculada depois por
--     agrupamento dessas linhas;
--   - esta tabela NAO e historico bruto de eventos operacionais;
--   - esta tabela NAO deve ser reduzida a uma linha unica por
--     pedido_id+situacao;
--   - "parcial" e condicao/quantidade, NAO um status novo.
--
-- Nao implementado nesta fase:
--   - frontend cliente/admin;
--   - automacao;
--   - aplicacao remota da migration;
--   - RPC/view/read-model consolidado;
--   - stepper percentual.
--
-- Idempotente: pode rodar varias vezes sem efeito cumulativo.
-- Sem DELETE destrutivo, sem dados reais, sem secrets.
-- ============================================================


-- ============================================================
-- 1. Novos campos em public.pedidos
-- ============================================================

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS parcial_habilitado     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parcial_atualizado_em  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metros_total           NUMERIC(12,2);

COMMENT ON COLUMN public.pedidos.parcial_habilitado
  IS 'Indica que o pedido possui parciais/chunks atuais cadastrados.';
COMMENT ON COLUMN public.pedidos.parcial_atualizado_em
  IS 'Timestamp da ultima alteracao nas parciais atuais do pedido.';
COMMENT ON COLUMN public.pedidos.metros_total
  IS 'Soma consolidada de pedido_itens.metros, mantida por trigger.';


-- ============================================================
-- 2. Tabela public.pedido_parciais
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedido_parciais (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id        UUID          NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  sequencia        INTEGER,
  situacao         TEXT          NOT NULL,
  metros           NUMERIC(12,2) NOT NULL CHECK (metros > 0),
  data_referencia  DATE,
  titulo           TEXT,
  mensagem_cliente TEXT,
  observacao_admin TEXT,
  visivel_cliente  BOOLEAN       NOT NULL DEFAULT TRUE,
  origem           TEXT          NOT NULL DEFAULT 'manual',
  criado_por       UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  metadata         JSONB         NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.pedido_parciais
  IS 'Parciais/chunks atuais do pedido. A distribuicao por situacao sera derivada por agrupamento, sem unicidade por etapa.';
COMMENT ON COLUMN public.pedido_parciais.situacao
  IS 'Situacao atual do chunk: em_tecelagem|em_acabamento|pronto_retirada|pronto_envio|em_transporte|entregue|cancelado.';
COMMENT ON COLUMN public.pedido_parciais.metadata
  IS 'Metadados complementares do chunk atual. Nao usar como historico bruto de eventos.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'pedido_parciais'
      AND con.conname = 'pedido_parciais_situacao_check'
  ) THEN
    ALTER TABLE public.pedido_parciais
      ADD CONSTRAINT pedido_parciais_situacao_check
      CHECK (
        situacao IN (
          'em_tecelagem',
          'em_acabamento',
          'pronto_retirada',
          'pronto_envio',
          'em_transporte',
          'entregue',
          'cancelado'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'pedido_parciais'
      AND con.conname = 'pedido_parciais_origem_check'
  ) THEN
    ALTER TABLE public.pedido_parciais
      ADD CONSTRAINT pedido_parciais_origem_check
      CHECK (origem IN ('manual', 'automatico', 'sistema'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'pedido_parciais'
      AND con.conname = 'pedido_parciais_sequencia_check'
  ) THEN
    ALTER TABLE public.pedido_parciais
      ADD CONSTRAINT pedido_parciais_sequencia_check
      CHECK (sequencia IS NULL OR sequencia > 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pedido_parciais_pedido_criado
  ON public.pedido_parciais (pedido_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_pedido_parciais_pedido_visivel
  ON public.pedido_parciais (pedido_id, visivel_cliente, situacao);


-- ============================================================
-- 3. Tabela public.pedido_parcial_itens
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedido_parcial_itens (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  parcial_id     UUID          NOT NULL REFERENCES public.pedido_parciais(id) ON DELETE CASCADE,
  pedido_item_id UUID          NOT NULL REFERENCES public.pedido_itens(id) ON DELETE CASCADE,
  metros         NUMERIC(12,2) NOT NULL CHECK (metros > 0),
  criado_em      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.pedido_parcial_itens
  IS 'Detalhamento opcional da parcial por item do pedido. Pode ficar sem uso no MVP de leitura.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'pedido_parcial_itens'
      AND con.conname = 'pedido_parcial_itens_parcial_item_key'
  ) THEN
    ALTER TABLE public.pedido_parcial_itens
      ADD CONSTRAINT pedido_parcial_itens_parcial_item_key
      UNIQUE (parcial_id, pedido_item_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pedido_parcial_itens_parcial
  ON public.pedido_parcial_itens (parcial_id);

CREATE INDEX IF NOT EXISTS idx_pedido_parcial_itens_pedido_item
  ON public.pedido_parcial_itens (pedido_item_id);


-- ============================================================
-- 4. Helpers de consistencia
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalcular_pedido_metros_total(p_pedido_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_total NUMERIC(12,2);
BEGIN
  IF p_pedido_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(pi.metros), 0)::NUMERIC(12,2)
    INTO v_total
  FROM public.pedido_itens pi
  WHERE pi.pedido_id = p_pedido_id;

  UPDATE public.pedidos
     SET metros_total = v_total
   WHERE id = p_pedido_id;

  RETURN v_total;
END;
$$;

COMMENT ON FUNCTION public.recalcular_pedido_metros_total(UUID)
  IS 'Recalcula pedidos.metros_total a partir de pedido_itens.metros.';

CREATE OR REPLACE FUNCTION public.sincronizar_pedido_parciais_resumo(
  p_pedido_id UUID,
  p_touch_timestamp BOOLEAN DEFAULT TRUE
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_total_pedido       NUMERIC(12,2);
  v_total_parciais     NUMERIC(12,2);
  v_tem_parciais       BOOLEAN;
BEGIN
  IF p_pedido_id IS NULL THEN
    RETURN;
  END IF;

  v_total_pedido := public.recalcular_pedido_metros_total(p_pedido_id);

  SELECT COALESCE(SUM(pp.metros), 0)::NUMERIC(12,2)
    INTO v_total_parciais
  FROM public.pedido_parciais pp
  WHERE pp.pedido_id = p_pedido_id
    AND pp.situacao <> 'cancelado';

  IF v_total_parciais > COALESCE(v_total_pedido, 0) THEN
    RAISE EXCEPTION
      'Soma das parciais do pedido % (%.2f) excede metros_total (%.2f).',
      p_pedido_id, v_total_parciais, COALESCE(v_total_pedido, 0);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.pedido_parciais pp
    WHERE pp.pedido_id = p_pedido_id
  )
    INTO v_tem_parciais;

  UPDATE public.pedidos
     SET parcial_habilitado = v_tem_parciais,
         parcial_atualizado_em = CASE
           WHEN NOT v_tem_parciais THEN NULL
           WHEN p_touch_timestamp THEN now()
           ELSE parcial_atualizado_em
         END
   WHERE id = p_pedido_id;
END;
$$;

COMMENT ON FUNCTION public.sincronizar_pedido_parciais_resumo(UUID, BOOLEAN)
  IS 'Valida soma das parciais nao canceladas, sincroniza parcial_habilitado e opcionalmente parcial_atualizado_em.';


-- ============================================================
-- 5. Triggers de pedido_parciais
-- ============================================================

CREATE OR REPLACE FUNCTION public.touch_pedido_parciais_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pedido_parciais_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_pedido_id UUID;
BEGIN
  v_pedido_id := COALESCE(NEW.pedido_id, OLD.pedido_id);
  PERFORM public.sincronizar_pedido_parciais_resumo(v_pedido_id, TRUE);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pedido_parciais_touch_updated_at
  ON public.pedido_parciais;
CREATE TRIGGER pedido_parciais_touch_updated_at
  BEFORE UPDATE ON public.pedido_parciais
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_pedido_parciais_updated_at();

DROP TRIGGER IF EXISTS pedido_parciais_after_change_trigger
  ON public.pedido_parciais;
CREATE TRIGGER pedido_parciais_after_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pedido_parciais
  FOR EACH ROW
  EXECUTE FUNCTION public.pedido_parciais_after_change();


-- ============================================================
-- 6. Trigger de pedido_itens -> metros_total / consistencia
-- ============================================================

CREATE OR REPLACE FUNCTION public.pedido_itens_sync_parciais_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
DECLARE
  v_old_pedido_id UUID;
  v_new_pedido_id UUID;
BEGIN
  v_old_pedido_id := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.pedido_id ELSE NULL END;
  v_new_pedido_id := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.pedido_id ELSE NULL END;

  IF v_old_pedido_id IS NOT NULL THEN
    PERFORM public.sincronizar_pedido_parciais_resumo(v_old_pedido_id, FALSE);
  END IF;

  IF v_new_pedido_id IS NOT NULL AND v_new_pedido_id IS DISTINCT FROM v_old_pedido_id THEN
    PERFORM public.sincronizar_pedido_parciais_resumo(v_new_pedido_id, FALSE);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pedido_itens_sync_parciais_after_change_trigger
  ON public.pedido_itens;
CREATE TRIGGER pedido_itens_sync_parciais_after_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pedido_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.pedido_itens_sync_parciais_after_change();


-- ============================================================
-- 7. RLS em public.pedido_parciais
-- ============================================================

ALTER TABLE public.pedido_parciais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pedido_parciais_admin_all
  ON public.pedido_parciais;
CREATE POLICY pedido_parciais_admin_all
  ON public.pedido_parciais
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS pedido_parciais_cliente_select
  ON public.pedido_parciais;
CREATE POLICY pedido_parciais_cliente_select
  ON public.pedido_parciais
  FOR SELECT
  USING (
    visivel_cliente = true
    AND EXISTS (
      SELECT 1
      FROM public.pedidos p
      WHERE p.id = pedido_parciais.pedido_id
        AND p.cliente_id = public.meu_cliente_id()
    )
  );


-- ============================================================
-- 8. RLS em public.pedido_parcial_itens
-- ============================================================

ALTER TABLE public.pedido_parcial_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pedido_parcial_itens_admin_all
  ON public.pedido_parcial_itens;
CREATE POLICY pedido_parcial_itens_admin_all
  ON public.pedido_parcial_itens
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS pedido_parcial_itens_cliente_select
  ON public.pedido_parcial_itens;
CREATE POLICY pedido_parcial_itens_cliente_select
  ON public.pedido_parcial_itens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.pedido_parciais pp
      JOIN public.pedidos p
        ON p.id = pp.pedido_id
      WHERE pp.id = pedido_parcial_itens.parcial_id
        AND pp.visivel_cliente = true
        AND p.cliente_id = public.meu_cliente_id()
    )
  );


-- ============================================================
-- 9. Comentarios finais de semantica
-- ============================================================
-- - pedido_parciais guarda chunks/parciais ATUAIS do pedido.
-- - A distribuicao atual por situacao vira de GROUP BY situacao.
-- - O stepper percentual sera calculado depois sobre essa distribuicao.
-- - Nao criar UNIQUE(pedido_id, situacao): varias parciais podem
--   coexistir na mesma situacao.
-- - Esta migration nao expone dados operacionais internos ao cliente.
-- ============================================================


-- ============================================================
-- 10. Reload do schema cache (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
