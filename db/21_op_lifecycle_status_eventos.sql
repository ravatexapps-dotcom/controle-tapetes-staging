-- ============================================================
-- Fase: RAVATEX-TAPETES-OP-LIFECYCLE-BACKEND-B (R1 — hardening)
-- Lifecycle de OP: status expandido + eventos + RPC de transicao.
--
-- Escopo:
--   1. Expandir CHECK de ops.status:
--      simulada|aberta|em_producao|pausada|concluida|cancelada|finalizada
--   2. Criar tabela public.op_eventos (historico de eventos).
--   3. Trigger AFTER UPDATE OF status para registrar alteracoes.
--   4. RPC public.alterar_status_op com validacao de transicoes.
--   5. RLS para op_eventos (padrao admin ALL + fornecedor SELECT).
--
-- finalizada permanece como legado compativel (usado por OP de latex).
-- concluida e o novo status canonico para conclusao.
-- Nao migra dados finalizada -> concluida nesta fase.
--
-- Idempotente: pode rodar varias vezes sem efeito cumulativo.
-- Sem DELETE destrutivo, sem dados reais, sem secrets.
-- ============================================================

-- ============================================================
-- 1. Expandir CHECK de ops.status
-- ============================================================

-- Drop seguro de qualquer CHECK constraint sobre a coluna ops.status.
-- O nome real pode variar entre ambientes (ops_status_check ou outro
-- nome auto-gerado pelo PostgreSQL). O bloco DO busca todos os CHECKs
-- que referenciam a coluna status e os derruba.
DO $$
DECLARE
  v_conname TEXT;
  v_status_attnum SMALLINT := (
    SELECT attnum FROM pg_attribute
    WHERE attrelid = 'public.ops'::regclass AND attname = 'status'
  );
BEGIN
  FOR v_conname IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.ops'::regclass
      AND con.contype = 'c'
      AND array_length(con.conkey, 1) > 0
      AND con.conkey @> ARRAY[v_status_attnum]
  LOOP
    EXECUTE format('ALTER TABLE public.ops DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;
END $$;

ALTER TABLE public.ops
  ADD CONSTRAINT ops_status_chk
  CHECK (
    status IN (
      'simulada',
      'aberta',
      'em_producao',
      'pausada',
      'concluida',
      'cancelada',
      'finalizada'
    )
  );

COMMENT ON CONSTRAINT ops_status_chk ON public.ops IS
  'simulada|aberta|em_producao|pausada|concluida|cancelada|finalizada — concluida = canonico, finalizada = legado latex.';


-- ============================================================
-- 2. Tabela public.op_eventos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.op_eventos (
  id              BIGSERIAL PRIMARY KEY,
  op_id           BIGINT NOT NULL REFERENCES public.ops(id) ON DELETE CASCADE,
  tipo_evento     TEXT NOT NULL,
  status_anterior TEXT,
  status_novo     TEXT,
  observacao      TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.op_eventos IS
  'Historico de eventos da OP. Registra mudancas de status e eventos operacionais.';

COMMENT ON COLUMN public.op_eventos.tipo_evento IS
  'Tipo do evento. status_alterado para transicoes de status. Extensivel para eventos futuros.';

COMMENT ON COLUMN public.op_eventos.payload IS
  'Metadados complementares do evento. Nao usar como substituto de colunas tipadas.';

CREATE INDEX IF NOT EXISTS op_eventos_op_id_idx
  ON public.op_eventos(op_id);

CREATE INDEX IF NOT EXISTS op_eventos_criado_em_idx
  ON public.op_eventos(op_id, criado_em DESC);


-- ============================================================
-- 3. Trigger: registrar alteracao de status em op_eventos
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_op_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.op_eventos (op_id, tipo_evento, status_anterior, status_novo, criado_por)
    VALUES (NEW.id, 'status_alterado', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_op_evento ON public.ops;
CREATE TRIGGER trg_op_evento
  AFTER UPDATE OF status ON public.ops
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_op_evento();


-- ============================================================
-- 4. RPC public.alterar_status_op
-- ============================================================

CREATE OR REPLACE FUNCTION public.alterar_status_op(
  p_op_id       BIGINT,
  p_novo_status TEXT,
  p_observacao  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op            RECORD;
  v_status_atual  TEXT;
BEGIN
  -- Autorizacao: admin-only nesta fase (fornecedor nao tem WRITE em ops).
  -- Padrao do projeto (cf. gerar_op_latex em db/08 e db/09), porem aqui
  -- apenas admin pode transitar status — fornecedor nao pode alterar status.
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Sem permissao');
  END IF;

  SELECT * INTO v_op FROM public.ops WHERE id = p_op_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'OP nao encontrada');
  END IF;

  v_status_atual := v_op.status;

  -- Estados finais: nao permitir transitar para fora
  IF v_status_atual IN ('concluida', 'cancelada', 'finalizada') THEN
    RETURN jsonb_build_object(
      'ok', false,
      'erro', 'OP com status final (' || v_status_atual || ') nao pode ser alterada'
    );
  END IF;

  -- Validar transicao conforme matriz de estados
  CASE v_status_atual
    WHEN 'simulada' THEN
      IF p_novo_status NOT IN ('aberta', 'cancelada') THEN
        RETURN jsonb_build_object(
          'ok', false,
          'erro', 'Transicao invalida: ' || v_status_atual || ' -> ' || p_novo_status
        );
      END IF;

    WHEN 'aberta' THEN
      IF p_novo_status NOT IN ('em_producao', 'cancelada') THEN
        RETURN jsonb_build_object(
          'ok', false,
          'erro', 'Transicao invalida: ' || v_status_atual || ' -> ' || p_novo_status
        );
      END IF;

    WHEN 'em_producao' THEN
      IF p_novo_status NOT IN ('pausada', 'concluida', 'cancelada') THEN
        RETURN jsonb_build_object(
          'ok', false,
          'erro', 'Transicao invalida: ' || v_status_atual || ' -> ' || p_novo_status
        );
      END IF;

    WHEN 'pausada' THEN
      IF p_novo_status NOT IN ('em_producao', 'cancelada') THEN
        RETURN jsonb_build_object(
          'ok', false,
          'erro', 'Transicao invalida: ' || v_status_atual || ' -> ' || p_novo_status
        );
      END IF;

    ELSE
      RETURN jsonb_build_object(
        'ok', false,
        'erro', 'Status atual desconhecido: ' || v_status_atual
      );
  END CASE;

  -- Validar que status novo esta na constraint
  IF p_novo_status NOT IN (
    'simulada','aberta','em_producao','pausada','concluida','cancelada','finalizada'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Status invalido: ' || p_novo_status);
  END IF;

  -- Aplicar mudanca
  IF p_novo_status = 'concluida' THEN
    UPDATE public.ops
    SET status = p_novo_status,
        finalizada_em = COALESCE(finalizada_em, now())
    WHERE id = p_op_id;
  ELSE
    UPDATE public.ops
    SET status = p_novo_status
    WHERE id = p_op_id;
  END IF;

  -- Trigger trg_op_evento ja registrou o evento basico.
  -- Se houver observacao, vincula ao evento recem-criado correspondente
  -- a esta transicao (mesmo status_novo). Filtro+ordenacao deterministicos
  -- reduzem risco de observacao cair em evento errado sob concorrencia.
  IF p_observacao IS NOT NULL THEN
    UPDATE public.op_eventos
    SET observacao = p_observacao
    WHERE id = (
      SELECT id FROM public.op_eventos
      WHERE op_id = p_op_id
        AND tipo_evento = 'status_alterado'
        AND status_novo = p_novo_status
      ORDER BY criado_em DESC, id DESC
      LIMIT 1
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status_anterior', v_status_atual,
    'status_novo', p_novo_status,
    'op_id', p_op_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.alterar_status_op(BIGINT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.alterar_status_op(BIGINT, TEXT, TEXT) IS
  'Transicao validada de status da OP. Admin-only (is_admin()). '
  'Retorna JSON {ok, status_anterior, status_novo, op_id} ou {ok:false, erro}. '
  'Transicoes validas: simulada->aberta|cancelada; aberta->em_producao|cancelada; '
  'em_producao->pausada|concluida|cancelada; pausada->em_producao|cancelada. '
  'Observacao (p_observacao) e vinculada ao evento status_alterado correspondente '
  'ao novo status (filtro por status_novo + ordenacao criado_em DESC, id DESC).';


-- ============================================================
-- 5. RLS para public.op_eventos
-- ============================================================

ALTER TABLE public.op_eventos ENABLE ROW LEVEL SECURITY;

-- Admin: ALL (idem ops_admin)
DROP POLICY IF EXISTS op_eventos_admin ON public.op_eventos;
CREATE POLICY op_eventos_admin ON public.op_eventos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fornecedor: SELECT se vinculado via op_fornecedores (idem ops_fornecedor_read)
DROP POLICY IF EXISTS op_eventos_fornecedor_read ON public.op_eventos;
CREATE POLICY op_eventos_fornecedor_read ON public.op_eventos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.op_fornecedores
    WHERE op_fornecedores.op_id = op_eventos.op_id
      AND op_fornecedores.fornecedor_id = meu_fornecedor_id()
  ));


-- ============================================================
-- Reload do schema cache (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
