-- PHASE-C2: native receipt foundation, writer, reversal, and narrow inventory integration.
-- Staging project: ucrjtfswnfdlxwtmxnoo. Production is explicitly out of scope.
-- Governing contract: ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §R.25.
--
-- This migration is intentionally additive. It does not seed legacy balances, fence
-- flat writers, switch readers, change flat grants, create UI, or activate emission.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- -----------------------------------------------------------------------------
-- 1. Immutable command header
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ordem_compra_recebimentos (
  id                    BIGSERIAL PRIMARY KEY,
  ordem_compra_id       BIGINT NOT NULL REFERENCES public.ordem_compra(id) ON DELETE RESTRICT,
  comando_tipo          TEXT NOT NULL CHECK (comando_tipo IN ('recebimento', 'estorno')),
  idempotency_namespace TEXT NOT NULL CHECK (idempotency_namespace = 'native_receipt_v1'),
  idempotency_key       TEXT NOT NULL CHECK (length(btrim(idempotency_key)) BETWEEN 1 AND 200),
  ator_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ator_tipo             TEXT NOT NULL CHECK (ator_tipo IN ('admin', 'fornecedor')),
  ocorrido_em           TIMESTAMPTZ NOT NULL,
  documento_ref         TEXT,
  origem_tipo           TEXT NOT NULL CHECK (length(btrim(origem_tipo)) BETWEEN 1 AND 80),
  origem_ref            TEXT,
  comando_payload       JSONB NOT NULL CHECK (jsonb_typeof(comando_payload) = 'object'),
  comando_hash          TEXT NOT NULL CHECK (comando_hash ~ '^[0-9a-f]{32}$'),
  resultado_metadata    JSONB NOT NULL CHECK (jsonb_typeof(resultado_metadata) = 'object'),
  criado_em             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ordem_compra_recebimentos_idempotencia
    UNIQUE (idempotency_namespace, ator_tipo, ator_id, idempotency_key)
);

COMMENT ON TABLE public.ordem_compra_recebimentos IS
  'PHASE-C2 immutable command headers for native physical receipt and administrator reversal. One accepted command per actor-scoped native_receipt_v1 idempotency identity; no client DML.';
COMMENT ON COLUMN public.ordem_compra_recebimentos.comando_payload IS
  'Canonical normalized JSONB command. Equality plus the scoped idempotency identity distinguishes exact replay from conflicting reuse.';
COMMENT ON COLUMN public.ordem_compra_recebimentos.resultado_metadata IS
  'Immutable metadata needed to reconstruct the exact result from append-only ledger rows.';

CREATE INDEX IF NOT EXISTS ordem_compra_recebimentos_ordem_idx
  ON public.ordem_compra_recebimentos(ordem_compra_id, criado_em, id);

ALTER TABLE public.ordem_compra_recebimentos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ordem_compra_recebimentos FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_recebimentos FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_recebimentos FROM authenticated;

CREATE OR REPLACE FUNCTION public.trg_recebimento_header_immutable_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'ordem_compra_recebimentos is immutable: % is not permitted', TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_recebimento_header_immutable_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_recebimento_header_immutable_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_recebimento_header_immutable_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_recebimento_header_immutable_guard() FROM service_role;

DROP TRIGGER IF EXISTS trg_recebimento_header_immutable_guard ON public.ordem_compra_recebimentos;
CREATE TRIGGER trg_recebimento_header_immutable_guard
  BEFORE UPDATE OR DELETE ON public.ordem_compra_recebimentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_recebimento_header_immutable_guard();

-- -----------------------------------------------------------------------------
-- 2. Additive native identity on the sole physical receipt ledger
-- -----------------------------------------------------------------------------

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD COLUMN IF NOT EXISTS recebimento_id BIGINT REFERENCES public.ordem_compra_recebimentos(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS ordem_compra_id BIGINT REFERENCES public.ordem_compra(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS ordem_compra_item_alocacao_id BIGINT REFERENCES public.ordem_compra_item_alocacao(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS op_id BIGINT REFERENCES public.ops(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS material TEXT CHECK (material IN ('algodao', 'poliester')),
  ADD COLUMN IF NOT EXISTS cor_id BIGINT REFERENCES public.cores(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS cor_poliester TEXT CHECK (cor_poliester IN ('PRETO', 'BRANCO')),
  ADD COLUMN IF NOT EXISTS kg_excesso NUMERIC(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ator_tipo TEXT CHECK (ator_tipo IN ('admin', 'fornecedor')),
  ADD COLUMN IF NOT EXISTS linha_indice INTEGER;

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
        (ordem_compra_item_alocacao_id IS NOT NULL AND op_id IS NOT NULL AND kg_excesso = 0)
        OR
        (ordem_compra_item_alocacao_id IS NULL AND op_id IS NULL AND kg_excesso = kg_recebido)
      )
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_fio_lancamentos_recebimento_linha
  ON public.ordem_compra_fio_lancamentos(recebimento_id, linha_indice)
  WHERE recebimento_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ordem_compra_fio_lancamentos_item_native_idx
  ON public.ordem_compra_fio_lancamentos(ordem_compra_item_id, id)
  WHERE ordem_compra_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ordem_compra_fio_lancamentos_alocacao_native_idx
  ON public.ordem_compra_fio_lancamentos(ordem_compra_item_alocacao_id, id)
  WHERE ordem_compra_item_alocacao_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ordem_compra_fio_lancamentos_estorno_native_idx
  ON public.ordem_compra_fio_lancamentos(estorno_de_id, id)
  WHERE estorno_de_id IS NOT NULL;

COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.recebimento_id IS
  'PHASE-C2 immutable native receipt/reversal command header. NULL for coexistence legacy rows until C3.';
COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.ordem_compra_item_alocacao_id IS
  'Concrete allocation satisfied by this native line. NULL only for explicit physical excess.';
COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.op_id IS
  'Real OP derived from ordem_compra_item_alocacao.op_id. Never supplied or fabricated by a client; NULL for explicit excess.';
COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.kg_excesso IS
  'Signed physical excess on this immutable line. Zero for allocated lines; equal to signed kg_recebido for explicit excess/reversal lines.';

-- -----------------------------------------------------------------------------
-- 3. Receipt-source inventory movement and saldo_fios cache identity
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS saldo_fios_identidade_material
  ON public.saldo_fios(
    tipo,
    COALESCE(cor_id, 0::BIGINT),
    COALESCE(cor_poliester, ''::TEXT)
  );

CREATE TABLE IF NOT EXISTS public.ordem_compra_fio_movimentos_estoque (
  id                              BIGSERIAL PRIMARY KEY,
  lancamento_id                   BIGINT NOT NULL UNIQUE REFERENCES public.ordem_compra_fio_lancamentos(id) ON DELETE RESTRICT,
  ordem_compra_id                 BIGINT NOT NULL REFERENCES public.ordem_compra(id) ON DELETE RESTRICT,
  ordem_compra_item_id            BIGINT NOT NULL REFERENCES public.ordem_compra_item(id) ON DELETE RESTRICT,
  ordem_compra_item_alocacao_id   BIGINT REFERENCES public.ordem_compra_item_alocacao(id) ON DELETE RESTRICT,
  op_id                           BIGINT REFERENCES public.ops(id) ON DELETE RESTRICT,
  material                        TEXT NOT NULL CHECK (material IN ('algodao', 'poliester')),
  cor_id                          BIGINT REFERENCES public.cores(id) ON DELETE RESTRICT,
  cor_poliester                   TEXT CHECK (cor_poliester IN ('PRETO', 'BRANCO')),
  kg_excedente_delta              NUMERIC(12,3) NOT NULL,
  excesso_antes                   NUMERIC(12,3) NOT NULL CHECK (excesso_antes >= 0),
  excesso_depois                  NUMERIC(12,3) NOT NULL CHECK (excesso_depois >= 0),
  ator_id                         UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ator_tipo                       TEXT NOT NULL CHECK (ator_tipo IN ('admin', 'fornecedor')),
  criado_em                       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((cor_id IS NOT NULL) <> (cor_poliester IS NOT NULL)),
  CHECK (excesso_depois = excesso_antes + kg_excedente_delta)
);

COMMENT ON TABLE public.ordem_compra_fio_movimentos_estoque IS
  'PHASE-C2 immutable source-linked surplus movement: exactly one row per native receipt ledger entry. Only kg_excedente_delta changes the existing multi-origin saldo_fios cache; this is not a competing physical receipt ledger or a general inventory redesign.';

CREATE INDEX IF NOT EXISTS ordem_compra_fio_movimentos_item_idx
  ON public.ordem_compra_fio_movimentos_estoque(ordem_compra_item_id, id);

ALTER TABLE public.ordem_compra_fio_movimentos_estoque ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ordem_compra_fio_movimentos_estoque FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_fio_movimentos_estoque FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_fio_movimentos_estoque FROM authenticated;

CREATE OR REPLACE FUNCTION public.trg_recebimento_movimento_immutable_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'ordem_compra_fio_movimentos_estoque is immutable: % is not permitted', TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_recebimento_movimento_immutable_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_recebimento_movimento_immutable_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_recebimento_movimento_immutable_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_recebimento_movimento_immutable_guard() FROM service_role;

DROP TRIGGER IF EXISTS trg_recebimento_movimento_immutable_guard ON public.ordem_compra_fio_movimentos_estoque;
CREATE TRIGGER trg_recebimento_movimento_immutable_guard
  BEFORE UPDATE OR DELETE ON public.ordem_compra_fio_movimentos_estoque
  FOR EACH ROW EXECUTE FUNCTION public.trg_recebimento_movimento_immutable_guard();

-- -----------------------------------------------------------------------------
-- 4. Native ledger structural guard and sole cache/movement maintainer
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_native_lancamento_shape_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_item public.ordem_compra_item%ROWTYPE;
  v_alloc public.ordem_compra_item_alocacao%ROWTYPE;
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
  IF v_header.ator_id IS DISTINCT FROM NEW.criado_por
     OR v_header.ator_tipo IS DISTINCT FROM NEW.ator_tipo THEN
    RAISE EXCEPTION 'native ledger actor mismatch';
  END IF;

  SELECT * INTO v_item
  FROM public.ordem_compra_item
  WHERE id = NEW.ordem_compra_item_id;
  IF NOT FOUND OR v_item.ordem_id <> NEW.ordem_compra_id
     OR v_item.material IS DISTINCT FROM NEW.material
     OR v_item.cor_id IS DISTINCT FROM NEW.cor_id
     OR v_item.cor_poliester IS DISTINCT FROM NEW.cor_poliester THEN
    RAISE EXCEPTION 'native ledger item/material identity mismatch';
  END IF;

  IF NEW.ordem_compra_item_alocacao_id IS NOT NULL THEN
    SELECT * INTO v_alloc
    FROM public.ordem_compra_item_alocacao
    WHERE id = NEW.ordem_compra_item_alocacao_id;
    IF NOT FOUND OR v_alloc.item_id <> NEW.ordem_compra_item_id
       OR v_alloc.op_id IS NULL OR v_alloc.op_id <> NEW.op_id THEN
      RAISE EXCEPTION 'native ledger allocation/real-OP mismatch';
    END IF;
  END IF;

  IF NEW.tipo = 'recebimento' THEN
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
    RAISE EXCEPTION 'C2 native command cannot create ledger tipo=%', NEW.tipo;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_native_lancamento_shape_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_shape_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_shape_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_shape_guard() FROM service_role;

DROP TRIGGER IF EXISTS trg_native_lancamento_shape_guard ON public.ordem_compra_fio_lancamentos;
CREATE TRIGGER trg_native_lancamento_shape_guard
  BEFORE INSERT ON public.ordem_compra_fio_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_native_lancamento_shape_guard();

CREATE OR REPLACE FUNCTION public.trg_native_lancamento_derive_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item public.ordem_compra_item%ROWTYPE;
  v_total NUMERIC(12,3);
  v_excess_before NUMERIC(12,3);
  v_excess_after NUMERIC(12,3);
  v_delta NUMERIC(12,3);
  v_saldo_id BIGINT;
  v_saldo_before NUMERIC(12,3);
  v_saldo_after NUMERIC(12,3);
  v_status TEXT;
BEGIN
  IF NEW.recebimento_id IS NULL OR NEW.ordem_compra_item_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item
  FROM public.ordem_compra_item
  WHERE id = NEW.ordem_compra_item_id
  FOR UPDATE;

  SELECT COALESCE(SUM(l.kg_recebido), 0)
  INTO v_total
  FROM public.ordem_compra_fio_lancamentos l
  WHERE l.ordem_compra_item_id = NEW.ordem_compra_item_id;

  IF v_total < 0 THEN
    RAISE EXCEPTION 'native ledger would make item % received total negative', NEW.ordem_compra_item_id;
  END IF;

  SELECT COALESCE(SUM(l.kg_excesso), 0) - NEW.kg_excesso
  INTO v_excess_before
  FROM public.ordem_compra_fio_lancamentos l
  WHERE l.ordem_compra_item_id = NEW.ordem_compra_item_id
    AND l.recebimento_id IS NOT NULL;
  v_excess_after := v_excess_before + NEW.kg_excesso;
  IF v_excess_after < 0 THEN
    RAISE EXCEPTION 'native ledger would make item % physical excess negative', NEW.ordem_compra_item_id;
  END IF;
  v_delta := NEW.kg_excesso;

  UPDATE public.ordem_compra_item
  SET kg_recebido = v_total
  WHERE id = NEW.ordem_compra_item_id;

  v_saldo_before := NULL;
  v_saldo_after := NULL;

  IF v_delta <> 0 THEN
    SELECT s.id, s.kg_total
    INTO v_saldo_id, v_saldo_before
    FROM public.saldo_fios s
    WHERE s.tipo = NEW.material
      AND s.cor_id IS NOT DISTINCT FROM NEW.cor_id
      AND s.cor_poliester IS NOT DISTINCT FROM NEW.cor_poliester
    ORDER BY s.id
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
      IF v_delta < 0 THEN
        RAISE EXCEPTION 'native receipt reversal has no saldo_fios cache row';
      END IF;
      INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total, atualizado_em)
      VALUES (NEW.material, NEW.cor_id, NEW.cor_poliester, v_delta, now())
      RETURNING id, kg_total INTO v_saldo_id, v_saldo_after;
      v_saldo_before := 0;
    ELSE
      v_saldo_after := v_saldo_before + v_delta;
      IF v_saldo_after < 0 THEN
        RAISE EXCEPTION 'native receipt movement would make saldo_fios negative';
      END IF;
      UPDATE public.saldo_fios
      SET kg_total = v_saldo_after,
          atualizado_em = now()
      WHERE id = v_saldo_id;
    END IF;
  END IF;

  INSERT INTO public.ordem_compra_fio_movimentos_estoque(
    lancamento_id, ordem_compra_id, ordem_compra_item_id,
    ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
    kg_excedente_delta, excesso_antes, excesso_depois, ator_id, ator_tipo
  ) VALUES (
    NEW.id, NEW.ordem_compra_id, NEW.ordem_compra_item_id,
    NEW.ordem_compra_item_alocacao_id, NEW.op_id, NEW.material, NEW.cor_id,
    NEW.cor_poliester, v_delta, v_excess_before, v_excess_after,
    NEW.criado_por, NEW.ator_tipo
  );

  SELECT CASE
    WHEN COALESCE(SUM(i.kg_recebido), 0) = 0 THEN 'nao_recebido'
    WHEN BOOL_AND(i.kg_recebido >= i.kg_pedido) THEN 'recebido'
    ELSE 'parcial'
  END
  INTO v_status
  FROM public.ordem_compra_item i
  WHERE i.ordem_id = NEW.ordem_compra_id;

  UPDATE public.ordem_compra
  SET status_recebimento = COALESCE(v_status, 'nao_recebido')
  WHERE id = NEW.ordem_compra_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_native_lancamento_derive_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_derive_state() FROM anon;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_derive_state() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_native_lancamento_derive_state() FROM service_role;

DROP TRIGGER IF EXISTS trg_native_lancamento_derive_state ON public.ordem_compra_fio_lancamentos;
CREATE TRIGGER trg_native_lancamento_derive_state
  AFTER INSERT ON public.ordem_compra_fio_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_native_lancamento_derive_state();

-- -----------------------------------------------------------------------------
-- 5. Deterministic immutable command result
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._resultado_comando_recebimento(p_recebimento_id BIGINT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'ok', TRUE,
    'codigo', 'ok',
    'recebimento_id', h.id,
    'ordem_compra_id', h.ordem_compra_id,
    'comando_tipo', h.comando_tipo,
    'ocorrido_em', h.ocorrido_em,
    'lancamentos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id,
        'linha_indice', l.linha_indice,
        'item_id', l.ordem_compra_item_id,
        'alocacao_id', l.ordem_compra_item_alocacao_id,
        'op_id', l.op_id,
        'kg', l.kg_recebido,
        'kg_excesso', l.kg_excesso,
        'estorno_de_id', l.estorno_de_id,
        'movimento_estoque_id', m.id,
        'kg_excedente_delta', m.kg_excedente_delta
      ) ORDER BY l.linha_indice)
      FROM public.ordem_compra_fio_lancamentos l
      LEFT JOIN public.ordem_compra_fio_movimentos_estoque m ON m.lancamento_id = l.id
      WHERE l.recebimento_id = h.id
    ), '[]'::jsonb)
  )
  FROM public.ordem_compra_recebimentos h
  WHERE h.id = p_recebimento_id;
$$;

REVOKE ALL ON FUNCTION public._resultado_comando_recebimento(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._resultado_comando_recebimento(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public._resultado_comando_recebimento(BIGINT) FROM authenticated;
REVOKE ALL ON FUNCTION public._resultado_comando_recebimento(BIGINT) FROM service_role;

-- -----------------------------------------------------------------------------
-- 6. Canonical native receipt writer
-- -----------------------------------------------------------------------------

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
    AND a.op_id IS NOT NULL
    AND n.legado = FALSE
    AND n.pedido_id = v_order.pedido_id
    AND n.material = i.material
    AND n.cor_id IS NOT DISTINCT FROM i.cor_id
    AND n.cor_poliester IS NOT DISTINCT FROM i.cor_poliester
    AND (
      (n.origem_tipo = 'op' AND n.op_id = a.op_id)
      OR
      (n.origem_tipo = 'pedido' AND EXISTS (
        SELECT 1
        FROM public.ops o
        JOIN public.lotes lote ON lote.id = o.lote_id
        WHERE o.id = a.op_id AND lote.pedido_id = n.pedido_id
      ))
    );
  IF v_count <> (SELECT count(DISTINCT allocation_id) FROM pg_temp._c2_receipt_lines WHERE allocation_id IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'alocacao_invalida', 'erro', 'Alocacao, necessidade ou OP nao corresponde ao item e Pedido');
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

REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) FROM service_role;
GRANT EXECUTE ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.registrar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, TEXT, TEXT, JSONB) IS
  'PHASE-C2 canonical native physical receipt writer. Authenticated active admin or matching supplier; emitted acceptance-eligible native orders only; multi-line allocation/excess payload; deterministic locks; exact actor-scoped idempotency; ledger/cache/surplus movement atomic.';

-- -----------------------------------------------------------------------------
-- 7. Administrator-only reversal writer
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.estornar_recebimento_ordem_compra(
  p_ordem_id BIGINT,
  p_idempotency_key TEXT,
  p_estornado_em TIMESTAMPTZ,
  p_motivo TEXT,
  p_linhas JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.ordem_compra%ROWTYPE;
  v_header public.ordem_compra_recebimentos%ROWTYPE;
  v_payload JSONB;
  v_hash TEXT;
  v_header_id BIGINT;
  v_line RECORD;
  v_remaining NUMERIC(12,3);
  v_error TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Somente administrador pode estornar recebimento');
  END IF;
  IF p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) NOT BETWEEN 1 AND 200
     OR p_estornado_em IS NULL OR p_motivo IS NULL OR length(btrim(p_motivo)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'comando_invalido', 'erro', 'Idempotencia, data e motivo sao obrigatorios');
  END IF;
  IF jsonb_typeof(p_linhas) <> 'array' OR jsonb_array_length(p_linhas) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linhas_invalidas', 'erro', 'Informe ao menos um lancamento');
  END IF;

  DROP TABLE IF EXISTS pg_temp._c2_reversal_lines;
  CREATE TEMP TABLE pg_temp._c2_reversal_lines (
    input_index INTEGER,
    line_index INTEGER,
    source_id BIGINT,
    kg NUMERIC(12,3),
    item_id BIGINT,
    allocation_id BIGINT,
    op_id BIGINT,
    material TEXT,
    cor_id BIGINT,
    cor_poliester TEXT,
    source_excess NUMERIC(12,3)
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
    WHERE k.key NOT IN ('lancamento_id', 'kg')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Linha contem campo nao permitido');
  END IF;

  BEGIN
    INSERT INTO pg_temp._c2_reversal_lines(input_index, source_id, kg)
    SELECT ordinality::INTEGER,
           (value->>'lancamento_id')::BIGINT,
           (value->>'kg')::NUMERIC(12,3)
    FROM jsonb_array_elements(p_linhas) WITH ORDINALITY AS x(value, ordinality);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Formato de linha invalido');
  END;

  IF EXISTS (SELECT 1 FROM pg_temp._c2_reversal_lines WHERE source_id IS NULL OR kg IS NULL OR kg <= 0)
     OR EXISTS (SELECT 1 FROM pg_temp._c2_reversal_lines GROUP BY source_id HAVING count(*) > 1) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'linha_invalida', 'erro', 'Lancamento ou quantidade invalida');
  END IF;

  WITH ranked AS (
    SELECT input_index, row_number() OVER (ORDER BY source_id)::INTEGER AS stable_index
    FROM pg_temp._c2_reversal_lines
  )
  UPDATE pg_temp._c2_reversal_lines t
  SET line_index = r.stable_index
  FROM ranked r WHERE r.input_index = t.input_index;

  SELECT * INTO v_order
  FROM public.ordem_compra
  WHERE id = p_ordem_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_nao_encontrada', 'erro', 'Ordem nao encontrada');
  END IF;

  UPDATE pg_temp._c2_reversal_lines t
  SET item_id = l.ordem_compra_item_id,
      allocation_id = l.ordem_compra_item_alocacao_id,
      op_id = l.op_id,
      material = l.material,
      cor_id = l.cor_id,
      cor_poliester = l.cor_poliester,
      source_excess = l.kg_excesso
  FROM public.ordem_compra_fio_lancamentos l
  WHERE l.id = t.source_id
    AND l.ordem_compra_id = p_ordem_id
    AND l.tipo = 'recebimento'
    AND l.recebimento_id IS NOT NULL;

  IF EXISTS (SELECT 1 FROM pg_temp._c2_reversal_lines WHERE item_id IS NULL) THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'lancamento_invalido', 'erro', 'Somente recebimento nativo positivo pode ser estornado em C2');
  END IF;

  PERFORM i.id
  FROM public.ordem_compra_item i
  WHERE i.id IN (SELECT DISTINCT t.item_id FROM pg_temp._c2_reversal_lines t)
  ORDER BY i.id FOR UPDATE;

  PERFORM a.id
  FROM public.ordem_compra_item_alocacao a
  WHERE a.id IN (SELECT DISTINCT t.allocation_id FROM pg_temp._c2_reversal_lines t WHERE t.allocation_id IS NOT NULL)
  ORDER BY a.id FOR UPDATE;

  SELECT jsonb_build_object(
    'schema_version', 1,
    'ordem_compra_id', p_ordem_id,
    'estornado_em', p_estornado_em,
    'motivo', btrim(p_motivo),
    'linhas', jsonb_agg(jsonb_build_object(
      'linha_indice', line_index,
      'lancamento_id', source_id,
      'kg', kg
    ) ORDER BY line_index)
  )
  INTO v_payload
  FROM pg_temp._c2_reversal_lines;
  v_hash := md5(v_payload::TEXT);

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'native_receipt_v1|admin|' || auth.uid()::TEXT || '|' || btrim(p_idempotency_key), 0
  ));

  SELECT * INTO v_header
  FROM public.ordem_compra_recebimentos h
  WHERE h.idempotency_namespace = 'native_receipt_v1'
    AND h.ator_tipo = 'admin'
    AND h.ator_id = auth.uid()
    AND h.idempotency_key = btrim(p_idempotency_key)
  FOR UPDATE;
  IF FOUND THEN
    IF v_header.comando_tipo = 'estorno'
       AND v_header.ordem_compra_id = p_ordem_id
       AND v_header.comando_hash = v_hash
       AND v_header.comando_payload = v_payload THEN
      RETURN public._resultado_comando_recebimento(v_header.id);
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante', 'erro', 'Chave reutilizada com comando diferente');
  END IF;

  PERFORM l.id
  FROM public.ordem_compra_fio_lancamentos l
  WHERE l.id IN (SELECT t.source_id FROM pg_temp._c2_reversal_lines t)
     OR l.estorno_de_id IN (SELECT t.source_id FROM pg_temp._c2_reversal_lines t)
  ORDER BY l.id FOR UPDATE;

  FOR v_line IN
    SELECT t.*, l.kg_recebido AS source_kg, l.tipo AS source_type,
           l.ordem_compra_id AS source_order, l.recebimento_id AS source_header
    FROM pg_temp._c2_reversal_lines t
    JOIN public.ordem_compra_fio_lancamentos l ON l.id = t.source_id
    ORDER BY t.source_id
  LOOP
    IF v_line.source_type <> 'recebimento' OR v_line.source_header IS NULL
       OR v_line.source_order <> p_ordem_id THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'lancamento_invalido', 'erro', 'Fonte nao e recebimento nativo positivo');
    END IF;
    SELECT v_line.source_kg + COALESCE(SUM(l.kg_recebido), 0)
    INTO v_remaining
    FROM public.ordem_compra_fio_lancamentos l
    WHERE l.estorno_de_id = v_line.source_id;
    IF v_line.kg > v_remaining THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'excede_estornavel', 'erro', 'Estorno excede o saldo reversivel', 'lancamento_id', v_line.source_id, 'disponivel', v_remaining);
    END IF;
  END LOOP;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    'native_receipt_inventory|' || x.material || '|' || COALESCE(x.cor_id::TEXT, '') || '|' || COALESCE(x.cor_poliester, ''), 0
  ))
  FROM (
    SELECT DISTINCT material, cor_id, cor_poliester
    FROM pg_temp._c2_reversal_lines
    ORDER BY material, cor_id NULLS LAST, cor_poliester NULLS LAST
  ) x;

  INSERT INTO public.ordem_compra_recebimentos(
    ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
    ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
    comando_payload, comando_hash, resultado_metadata
  ) VALUES (
    p_ordem_id, 'estorno', 'native_receipt_v1', btrim(p_idempotency_key),
    auth.uid(), 'admin', p_estornado_em, NULL, 'estorno_admin', btrim(p_motivo),
    v_payload, v_hash,
    jsonb_build_object('schema_version', 1, 'line_count', jsonb_array_length(p_linhas))
  ) RETURNING id INTO v_header_id;

  FOR v_line IN
    SELECT t.*, l.kg_excesso AS source_excess
    FROM pg_temp._c2_reversal_lines t
    JOIN public.ordem_compra_fio_lancamentos l ON l.id = t.source_id
    ORDER BY t.line_index
  LOOP
    INSERT INTO public.ordem_compra_fio_lancamentos(
      ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
      observacao, criado_por, tipo, estorno_de_id, idempotency_key,
      origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
      kg_excesso, ator_tipo, linha_indice
    ) VALUES (
      NULL, v_line.item_id, -v_line.kg, p_estornado_em::DATE,
      btrim(p_motivo), auth.uid(), 'estorno', v_line.source_id,
      'native_reversal:' || v_header_id::TEXT || ':' || v_line.line_index::TEXT,
      'estorno_admin', v_line.source_id::TEXT, v_header_id, p_ordem_id,
      v_line.allocation_id, v_line.op_id, v_line.material, v_line.cor_id,
      v_line.cor_poliester,
      CASE WHEN v_line.source_excess <> 0 THEN -v_line.kg ELSE 0 END,
      'admin', v_line.line_index
    );
  END LOOP;

  INSERT INTO public.ordem_compra_eventos(
    ordem_compra_id, dimensao, tipo_evento, valor_anterior, valor_novo, payload, criado_por
  ) VALUES (
    p_ordem_id, 'recebimento', 'recebimento_estornado', NULL,
    (SELECT status_recebimento FROM public.ordem_compra WHERE id = p_ordem_id),
    jsonb_build_object('recebimento_id', v_header_id, 'motivo', btrim(p_motivo)), auth.uid()
  );

  RETURN public._resultado_comando_recebimento(v_header_id);
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
  RETURN jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'erro', v_error);
END;
$$;

REVOKE ALL ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) FROM service_role;
GRANT EXECUTE ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) TO authenticated;

COMMENT ON FUNCTION public.estornar_recebimento_ordem_compra(BIGINT, TEXT, TIMESTAMPTZ, TEXT, JSONB) IS
  'PHASE-C2 administrator-only immutable native receipt reversal. Locks sources and reversals, caps by remaining reversible kg, denies imported balances and supplier actors, and atomically derives caches/surplus movement.';

-- -----------------------------------------------------------------------------
-- 8. Actor-scoped verification read model
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.obter_historico_recebimento_ordem_compra(p_ordem_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.ordem_compra%ROWTYPE;
  v_user RECORD;
  v_is_admin BOOLEAN;
  v_is_supplier BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao');
  END IF;
  SELECT * INTO v_order FROM public.ordem_compra WHERE id = p_ordem_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'ordem_nao_encontrada');
  END IF;
  SELECT u.tipo, u.ativo, u.fornecedor_id INTO v_user
  FROM public.usuarios u WHERE u.id = auth.uid();
  v_is_admin := COALESCE(v_user.ativo IS TRUE AND v_user.tipo = 'admin' AND public.is_admin(), FALSE);
  v_is_supplier := COALESCE(v_user.ativo IS TRUE AND v_user.tipo = 'fornecedor'
    AND v_user.fornecedor_id IS NOT NULL
    AND v_user.fornecedor_id = v_order.fornecedor_id, FALSE);
  IF NOT v_is_admin AND NOT v_is_supplier THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'codigo', 'ok',
    'ordem_compra_id', v_order.id,
    'status_administrativo', v_order.status_administrativo,
    'status_aceite', v_order.status_aceite,
    'status_recebimento', v_order.status_recebimento,
    'ator_tipo', CASE WHEN v_is_admin THEN 'admin' ELSE 'fornecedor' END,
    'acoes', jsonb_build_object(
      'receber', (NOT v_order.legado AND v_order.status_administrativo = 'emitida'
        AND v_order.status_aceite IN ('nao_aplicavel', 'aceita')),
      'estornar', (v_is_admin AND EXISTS (
        SELECT 1
        FROM public.ordem_compra_fio_lancamentos p
        WHERE p.ordem_compra_id = v_order.id AND p.tipo = 'recebimento'
          AND p.recebimento_id IS NOT NULL
          AND p.kg_recebido + COALESCE((
            SELECT SUM(r.kg_recebido)
            FROM public.ordem_compra_fio_lancamentos r
            WHERE r.estorno_de_id = p.id
          ), 0) > 0
      ))
    ),
    'itens', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'item_id', i.id,
        'material', i.material,
        'cor_id', i.cor_id,
        'cor_poliester', i.cor_poliester,
        'kg_pedido', i.kg_pedido,
        'kg_recebido', i.kg_recebido,
        'kg_restante', GREATEST(i.kg_pedido - i.kg_recebido, 0),
        'kg_excesso', COALESCE((
          SELECT SUM(l.kg_excesso)
          FROM public.ordem_compra_fio_lancamentos l
          WHERE l.ordem_compra_item_id = i.id AND l.recebimento_id IS NOT NULL
        ), 0),
        'alocacoes', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'alocacao_id', a.id,
            'op_id', a.op_id,
            'kg_alocado', a.kg_alocado,
            'kg_recebido', COALESCE((
              SELECT SUM(l.kg_recebido)
              FROM public.ordem_compra_fio_lancamentos l
              WHERE l.ordem_compra_item_alocacao_id = a.id
            ), 0),
            'kg_restante', a.kg_alocado - COALESCE((
              SELECT SUM(l.kg_recebido)
              FROM public.ordem_compra_fio_lancamentos l
              WHERE l.ordem_compra_item_alocacao_id = a.id
            ), 0)
          ) ORDER BY a.id)
          FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id
        ), '[]'::jsonb)
      ) ORDER BY i.id)
      FROM public.ordem_compra_item i WHERE i.ordem_id = v_order.id
    ), '[]'::jsonb),
    'comandos', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', h.id,
        'comando_tipo', h.comando_tipo,
        'ator_tipo', h.ator_tipo,
        'ocorrido_em', h.ocorrido_em,
        'documento_ref', h.documento_ref,
        'origem_tipo', h.origem_tipo,
        'origem_ref', h.origem_ref,
        'lancamentos', COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', l.id,
            'linha_indice', l.linha_indice,
            'item_id', l.ordem_compra_item_id,
            'alocacao_id', l.ordem_compra_item_alocacao_id,
            'op_id', l.op_id,
            'material', l.material,
            'cor_id', l.cor_id,
            'cor_poliester', l.cor_poliester,
            'kg', l.kg_recebido,
            'kg_excesso', l.kg_excesso,
            'estorno_de_id', l.estorno_de_id,
            'kg_reversivel', CASE WHEN l.tipo = 'recebimento' THEN
              l.kg_recebido + COALESCE((
                SELECT SUM(r.kg_recebido) FROM public.ordem_compra_fio_lancamentos r
                WHERE r.estorno_de_id = l.id
              ), 0) ELSE 0 END,
            'movimento_estoque', CASE WHEN m.id IS NULL THEN NULL ELSE jsonb_build_object(
              'id', m.id,
              'kg_excedente_delta', m.kg_excedente_delta,
              'excesso_antes', m.excesso_antes,
              'excesso_depois', m.excesso_depois
            ) END
          ) ORDER BY l.linha_indice)
          FROM public.ordem_compra_fio_lancamentos l
          LEFT JOIN public.ordem_compra_fio_movimentos_estoque m ON m.lancamento_id = l.id
          WHERE l.recebimento_id = h.id
        ), '[]'::jsonb)
      ) ORDER BY h.criado_em, h.id)
      FROM public.ordem_compra_recebimentos h WHERE h.ordem_compra_id = v_order.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) FROM service_role;
GRANT EXECUTE ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) TO authenticated;

COMMENT ON FUNCTION public.obter_historico_recebimento_ordem_compra(BIGINT) IS
  'PHASE-C2 verification read model for active admin or matching supplier. Returns immutable commands/ledger, allocation real-OP attribution, derived caches/excess/reversible kg, inventory linkage, and actor-specific allowed actions.';

-- Explicitly preserve the later emission gate and the C3 flat ACL boundary.
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM anon;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM authenticated;
REVOKE ALL ON FUNCTION public.emitir_ordem_compra(BIGINT) FROM service_role;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
