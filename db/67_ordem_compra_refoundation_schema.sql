-- ============================================================
-- Phase: ORDEM-COMPRA REFOUNDATION — REFUND-A (schema-and-seed only)
-- Spec:  docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
--        Part R (RATIFIED / ACCEPTED) + §R.20 structural clarification
--        (RATIFIABLE / ACCEPTED)
-- Diagnosis: docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md
-- Order: REFUND-A — EXECUTION ORDER (+ concurrency-gate waiver ruling
--        recording LIVE_ALLOCATION_T1_T2_TEST_PENDING as a non-blocking
--        debt, HARD STOP before PRE-PROD activates allocation).
--
-- Scope (§R.20.3 — REFUND-A is schema-and-seed only):
--   1. Four new persistence layers: necessidade_compra_fio, ordem_compra,
--      ordem_compra_item, ordem_compra_item_alocacao (§R.3).
--   2. Compatibility mapping ordem_compra_item_compat_fio (§R.11),
--      seeded for the 51 header-bearing legacy rows, inactive.
--   3. Additive dual-reference transition on ordem_compra_eventos
--      (§R.20.1) and ordem_compra_fio_lancamentos (§R.20.2) — legacy
--      reference retained (relaxed to nullable so the exactly-one-parent
--      CHECK is satisfiable by either model), new reference added
--      nullable, no writer switched, no opening balance.
--   4. Seed the ratified 64/51/51/51/51 conversion from
--      ordens_compra_fio (§R.10), 1:1, no merge.
--   5. Ownership guard trigger (native OP -> lote -> Pedido, §R.3),
--      kg_alocado sole-cache-maintainer trigger + CHECK backstop (§R.4),
--      and the canonical allocation RPC with SELECT ... FOR UPDATE
--      (§R.4) — built but granted to NO client role (inactive business
--      writer; PRE-PROD activates it, §R.17).
--   6. Ledger structural contract (append-only guard, estorno-relationship
--      guard, sign CHECKs, idempotency_key) built on the EXISTING
--      ordem_compra_fio_lancamentos table, inactive (no writer, no rows).
--
-- Explicitly OUT of scope (order §§ "Not authorized" + §15/§17):
--   no application-code/UI change; no reader/writer cutover; no grant of
--   EXECUTE on the allocation RPC to any client role; no opening ledger
--   balance; no revoke of any existing flat privilege on
--   ordens_compra_fio; no native-need assessment/recalculation RPC
--   (PRE-PROD scope, §R.17); no REFUND-B1 work.
--
-- Concurrency-gate waiver (architect ruling, this order): the live
-- two-session T1/T2 interleave test is WAIVED for REFUND-A because
-- allocation is not activated as a business path. Substituted with:
-- catalog proof of SELECT ... FOR UPDATE in the allocation RPC (below),
-- proof the trigger is the sole kg_alocado maintainer, the
-- kg_alocado>=0 / kg_alocado<=kg_necessario CHECKs, direct-DML denial to
-- authenticated/anon, and deterministic sequential tests (valid alloc,
-- over-allocation rejection, reversal, rollback) run after this
-- migration. Debt recorded: LIVE_ALLOCATION_T1_T2_TEST_PENDING — HARD
-- STOP before PRE-PROD activates purchase distribution, before any
-- authenticated grant is added to allocation RPCs, before any
-- application calls the allocation writer, and before any production
-- promotion involving allocation.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS /
-- CREATE INDEX IF NOT EXISTS / CREATE OR REPLACE FUNCTION / DROP
-- TRIGGER IF EXISTS / DROP CONSTRAINT IF EXISTS throughout. The seed
-- block is NOT naturally idempotent on rerun against a partially-seeded
-- table (by design — this is a one-time historical import, not a
-- steady-state sync); the migration's own self-check (Section 6) fails
-- loudly rather than silently duplicating on a second run against
-- already-seeded data. No destructive DELETE. No existing
-- ordens_compra_fio row is modified. No secrets.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. public.necessidade_compra_fio — Layer 1: atomic need per origin
--    (Part R §R.3, Model A — no _origem child, no JSONB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.necessidade_compra_fio (
  id             BIGSERIAL PRIMARY KEY,
  pedido_id      UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  origem_tipo    TEXT NOT NULL CHECK (origem_tipo IN ('op', 'pedido')),
  op_id          BIGINT REFERENCES public.ops(id) ON DELETE RESTRICT,
  material       TEXT NOT NULL CHECK (material IN ('algodao', 'poliester')),
  cor_id         BIGINT REFERENCES public.cores(id),
  cor_poliester  TEXT CHECK (cor_poliester IN ('PRETO', 'BRANCO')),
  kg_necessario  NUMERIC(12,3) NOT NULL CHECK (kg_necessario >= 0),
  kg_alocado     NUMERIC(12,3) NOT NULL DEFAULT 0
                   CHECK (kg_alocado >= 0 AND kg_alocado <= kg_necessario),
  legado         BOOLEAN NOT NULL DEFAULT FALSE,
  legado_origem_ordem_compra_fio_id BIGINT REFERENCES public.ordens_compra_fio(id),
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT necessidade_origem_shape CHECK (
       (origem_tipo = 'op'     AND op_id IS NOT NULL)
    OR (origem_tipo = 'pedido' AND op_id IS NULL)),
  CONSTRAINT necessidade_um_eixo_cor CHECK ((cor_id IS NOT NULL) <> (cor_poliester IS NOT NULL)),
  CONSTRAINT necessidade_pedido_native CHECK (legado = TRUE OR pedido_id IS NOT NULL),
  CONSTRAINT necessidade_legado_ref CHECK (
       (legado = FALSE AND legado_origem_ordem_compra_fio_id IS NULL)
    OR (legado = TRUE  AND legado_origem_ordem_compra_fio_id IS NOT NULL)),
  CONSTRAINT necessidade_material_origem CHECK (
       (legado = FALSE AND material = 'algodao'   AND origem_tipo = 'op')
    OR (legado = FALSE AND material = 'poliester' AND origem_tipo = 'pedido')
    OR (legado = TRUE  AND origem_tipo = 'op')
    OR (legado = TRUE  AND origem_tipo = 'pedido' AND material = 'poliester'))
);

COMMENT ON TABLE public.necessidade_compra_fio IS
  'Layer 1 of the Part R refoundation (spec §R.3): one atomic yarn need per origin (OP or Pedido-shared). REFUND-A seeds this from the 64-row legacy ordens_compra_fio corpus 1:1; native rows are created only from PRE-PROD onward (assessment RPC, not built in REFUND-A).';
COMMENT ON COLUMN public.necessidade_compra_fio.kg_alocado IS
  'Running allocation cache. Sole maintainer is trg_alocacao_kg_alocado_cache (below) — never written directly by any RPC or client role.';
COMMENT ON COLUMN public.necessidade_compra_fio.legado_origem_ordem_compra_fio_id IS
  'Ruling 2 (design-gate patch): imported-need canonical identity. Legacy duplicate prevention derives from this source-row reference, never from nullable-Pedido equality.';

CREATE UNIQUE INDEX IF NOT EXISTS necessidade_native_algodao ON public.necessidade_compra_fio
  (pedido_id, op_id, cor_id)
  WHERE legado = FALSE AND material = 'algodao' AND origem_tipo = 'op';
CREATE UNIQUE INDEX IF NOT EXISTS necessidade_native_poliester ON public.necessidade_compra_fio
  (pedido_id, cor_poliester)
  WHERE legado = FALSE AND material = 'poliester' AND origem_tipo = 'pedido';
CREATE UNIQUE INDEX IF NOT EXISTS necessidade_legado_origem ON public.necessidade_compra_fio
  (legado_origem_ordem_compra_fio_id)
  WHERE legado = TRUE;

ALTER TABLE public.necessidade_compra_fio ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.necessidade_compra_fio FROM PUBLIC;
REVOKE ALL ON TABLE public.necessidade_compra_fio FROM anon;
REVOKE ALL ON TABLE public.necessidade_compra_fio FROM authenticated;

GRANT SELECT ON TABLE public.necessidade_compra_fio TO authenticated;

DROP POLICY IF EXISTS necessidade_compra_fio_admin_select ON public.necessidade_compra_fio;
CREATE POLICY necessidade_compra_fio_admin_select ON public.necessidade_compra_fio FOR SELECT
  USING (is_admin());

-- No INSERT/UPDATE/DELETE policy for any client role — §R.3 Ruling 5:
-- authenticated/anon get no direct DML; the future canonical writers
-- (native assessment RPC, PRE-PROD) are the only application write
-- surface. Not built in REFUND-A (schema-and-seed only).


-- ============================================================
-- 1b. Ownership guard trigger (Ruling 5) — op -> lote -> pedido,
--     regardless of caller including service_role/migration.
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_necessidade_ownership_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resolved_pedido UUID;
BEGIN
  IF NEW.origem_tipo = 'op' AND NEW.op_id IS NOT NULL THEN
    SELECT l.pedido_id INTO v_resolved_pedido
    FROM public.ops o
    JOIN public.lotes l ON l.id = o.lote_id
    WHERE o.id = NEW.op_id;

    IF NEW.pedido_id IS NOT NULL AND v_resolved_pedido IS DISTINCT FROM NEW.pedido_id THEN
      RAISE EXCEPTION
        'necessidade_compra_fio ownership guard: op_id % resolves to pedido % via lote, not the row''s pedido_id %',
        NEW.op_id, v_resolved_pedido, NEW.pedido_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_necessidade_ownership_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_necessidade_ownership_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_necessidade_ownership_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_necessidade_ownership_guard() FROM service_role;

COMMENT ON FUNCTION public.trg_necessidade_ownership_guard() IS
  'Part R §R.3 Ruling 5 database ownership guard: verifies op_id -> ops.lote_id -> lotes.pedido_id = necessidade_compra_fio.pedido_id transactionally on every INSERT/UPDATE, regardless of caller (including service_role/migration). RPC validation alone is insufficient per the ratified rule.';

DROP TRIGGER IF EXISTS necessidade_ownership_guard ON public.necessidade_compra_fio;
CREATE TRIGGER necessidade_ownership_guard
  BEFORE INSERT OR UPDATE ON public.necessidade_compra_fio
  FOR EACH ROW EXECUTE FUNCTION public.trg_necessidade_ownership_guard();


-- ============================================================
-- 2. public.ordem_compra — Layer 2: header
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ordem_compra (
  id                          BIGSERIAL PRIMARY KEY,
  pedido_id                   UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  fornecedor_id               BIGINT REFERENCES public.fornecedores(id),
  status_administrativo       TEXT NOT NULL DEFAULT 'rascunho'
                                CHECK (status_administrativo IN ('rascunho', 'emitida', 'cancelada')),
  status_aceite               TEXT NOT NULL DEFAULT 'nao_aplicavel'
                                CHECK (status_aceite IN ('nao_aplicavel', 'pendente', 'aceita', 'rejeitada')),
  status_recebimento          TEXT NOT NULL DEFAULT 'nao_recebido'
                                CHECK (status_recebimento IN ('nao_recebido', 'parcial', 'recebido')),
  aceite_exigido_na_emissao   BOOLEAN,
  legado                      BOOLEAN NOT NULL DEFAULT FALSE,
  legado_provenance           TEXT CHECK (legado_provenance IN
                                ('emitido_recebido', 'emitido_nao_recebido', 'recebido_sem_emissao')),
  emitida_em TIMESTAMPTZ, emitida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelada_em TIMESTAMPTZ, cancelada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aceite_decidida_em TIMESTAMPTZ, aceite_decidida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  aceite_motivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ordem_compra_provenance_scope
    CHECK (legado = TRUE OR legado_provenance IS NULL),
  CONSTRAINT ordem_compra_no_native_anomaly
    CHECK (legado = TRUE
        OR NOT (status_administrativo = 'rascunho' AND status_recebimento <> 'nao_recebido'))
);

COMMENT ON TABLE public.ordem_compra IS
  'Layer 2 of the Part R refoundation (spec §R.3): purchase-order header, three orthogonal dimensions. REFUND-A seeds 51 legacy headers (Class A/B/D) 1:1 from ordens_compra_fio; no native header is created in this phase. Administrative and receipt authority remain on ordens_compra_fio until REFUND-B1 (admin) and Phase C (receipt) respectively (§R.11).';
COMMENT ON COLUMN public.ordem_compra.legado_provenance IS
  'Ruling 4 domain: emitido_recebido (Class A), emitido_nao_recebido (Class B), recebido_sem_emissao (Class D). NULL for native headers (none seeded in REFUND-A).';

CREATE UNIQUE INDEX IF NOT EXISTS ordem_compra_um_rascunho_ativo
  ON public.ordem_compra (pedido_id, fornecedor_id)
  WHERE status_administrativo = 'rascunho' AND legado = FALSE AND fornecedor_id IS NOT NULL;

ALTER TABLE public.ordem_compra ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ordem_compra FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra FROM anon;
REVOKE ALL ON TABLE public.ordem_compra FROM authenticated;

GRANT SELECT ON TABLE public.ordem_compra TO authenticated;

DROP POLICY IF EXISTS ordem_compra_admin_select ON public.ordem_compra;
CREATE POLICY ordem_compra_admin_select ON public.ordem_compra FOR SELECT
  USING (is_admin());

-- No INSERT/UPDATE/DELETE policy for any client role — REFUND-B1 wires
-- native admin RPCs (emit/cancel on this table); not built here.


-- ============================================================
-- 3. public.ordem_compra_item — Layer 3: header's material/color line
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ordem_compra_item (
  id             BIGSERIAL PRIMARY KEY,
  ordem_id       BIGINT NOT NULL REFERENCES public.ordem_compra(id) ON DELETE CASCADE,
  material       TEXT NOT NULL CHECK (material IN ('algodao', 'poliester')),
  cor_id         BIGINT REFERENCES public.cores(id),
  cor_poliester  TEXT CHECK (cor_poliester IN ('PRETO', 'BRANCO')),
  kg_pedido      NUMERIC(12,3) NOT NULL CHECK (kg_pedido > 0),
  kg_recebido    NUMERIC(12,3) NOT NULL DEFAULT 0,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((cor_id IS NOT NULL) <> (cor_poliester IS NOT NULL))
);

COMMENT ON TABLE public.ordem_compra_item IS
  'Layer 3 of the Part R refoundation (spec §R.3). REFUND-A seeds 51 items (1 per legacy header). kg_recebido is a transitional cache during coexistence (§R.3 layer-3 note), ledger-derived only from Phase C.';
COMMENT ON COLUMN public.ordem_compra_item.kg_recebido IS
  'Transitional receipt cache seeded from the legacy ordens_compra_fio.kg_recebido snapshot at import time. Not written by any live REFUND-A writer; becomes ledger-derived at Phase C (Rule 2).';

ALTER TABLE public.ordem_compra_item ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ordem_compra_item FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_item FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_item FROM authenticated;

GRANT SELECT ON TABLE public.ordem_compra_item TO authenticated;

DROP POLICY IF EXISTS ordem_compra_item_admin_select ON public.ordem_compra_item;
CREATE POLICY ordem_compra_item_admin_select ON public.ordem_compra_item FOR SELECT
  USING (is_admin());


-- ============================================================
-- 4. public.ordem_compra_item_alocacao — Layer 4: item-slice -> need
--    (mandatory, Flaw 1). Double-distribution structurally impossible
--    (§R.4).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ordem_compra_item_alocacao (
  id              BIGSERIAL PRIMARY KEY,
  item_id         BIGINT NOT NULL REFERENCES public.ordem_compra_item(id) ON DELETE CASCADE,
  necessidade_id  BIGINT NOT NULL REFERENCES public.necessidade_compra_fio(id) ON DELETE RESTRICT,
  op_id           BIGINT REFERENCES public.ops(id) ON DELETE RESTRICT,
  kg_alocado      NUMERIC(12,3) NOT NULL CHECK (kg_alocado > 0),
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ordem_compra_item_alocacao IS
  'Layer 4 of the Part R refoundation (spec §R.3/§R.4), mandatory (Flaw 1). REFUND-A seeds 51 allocations, one per legacy item, fully allocating each header-bearing need to itself (kg_alocado = kg_pedido = kg_necessario). Immutable after issuance (business rule, enforced by the future PRE-PROD writer — not by a schema-level immutability trigger in REFUND-A, since no live writer exists yet to issue against).';

ALTER TABLE public.ordem_compra_item_alocacao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ordem_compra_item_alocacao FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_item_alocacao FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_item_alocacao FROM authenticated;

GRANT SELECT ON TABLE public.ordem_compra_item_alocacao TO authenticated;

DROP POLICY IF EXISTS ordem_compra_item_alocacao_admin_select ON public.ordem_compra_item_alocacao;
CREATE POLICY ordem_compra_item_alocacao_admin_select ON public.ordem_compra_item_alocacao FOR SELECT
  USING (is_admin());

-- No INSERT/UPDATE/DELETE policy for any client role (§R.4 Ruling 3):
-- authenticated/anon get no direct DML on this table. The canonical
-- allocation RPC below (SECURITY DEFINER) is the only write surface,
-- and it is granted to NO client role in REFUND-A — inactive until
-- PRE-PROD (§R.17).


-- ============================================================
-- 4b. kg_alocado sole-cache-maintainer trigger (§R.4)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trg_alocacao_kg_alocado_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.necessidade_id IS DISTINCT FROM OLD.necessidade_id THEN
    UPDATE public.necessidade_compra_fio
    SET kg_alocado = COALESCE(
      (SELECT SUM(kg_alocado) FROM public.ordem_compra_item_alocacao WHERE necessidade_id = OLD.necessidade_id), 0)
    WHERE id = OLD.necessidade_id;
  END IF;

  UPDATE public.necessidade_compra_fio
  SET kg_alocado = COALESCE(
    (SELECT SUM(kg_alocado) FROM public.ordem_compra_item_alocacao
       WHERE necessidade_id = COALESCE(NEW.necessidade_id, OLD.necessidade_id)), 0)
  WHERE id = COALESCE(NEW.necessidade_id, OLD.necessidade_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.trg_alocacao_kg_alocado_cache() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_alocacao_kg_alocado_cache() FROM anon;
REVOKE ALL ON FUNCTION public.trg_alocacao_kg_alocado_cache() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_alocacao_kg_alocado_cache() FROM service_role;

COMMENT ON FUNCTION public.trg_alocacao_kg_alocado_cache() IS
  'Sole maintainer of necessidade_compra_fio.kg_alocado (§R.4). Recomputes by full SUM on every INSERT/UPDATE/DELETE of ordem_compra_item_alocacao — no direct write to kg_alocado exists anywhere else in this migration.';

DROP TRIGGER IF EXISTS trg_alocacao_kg_alocado_cache ON public.ordem_compra_item_alocacao;
CREATE TRIGGER trg_alocacao_kg_alocado_cache
  AFTER INSERT OR UPDATE OR DELETE ON public.ordem_compra_item_alocacao
  FOR EACH ROW EXECUTE FUNCTION public.trg_alocacao_kg_alocado_cache();


-- ============================================================
-- 4c. Canonical allocation RPC (§R.4) — built, INACTIVE (no client
--     grant). Catalog proof of SELECT ... FOR UPDATE per the
--     concurrency-gate waiver ruling (this order): the live T1/T2
--     interleave test is waived for REFUND-A; this function's row lock
--     + the kg_alocado<=kg_necessario CHECK are the accepted structural
--     evidence. LIVE_ALLOCATION_T1_T2_TEST_PENDING is a HARD STOP before
--     PRE-PROD grants EXECUTE on this function to any client role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.alocar_necessidade_compra_fio(
  p_item_id        BIGINT,
  p_necessidade_id BIGINT,
  p_op_id          BIGINT,
  p_kg             NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_necessidade RECORD;
  v_disponivel  NUMERIC;
BEGIN
  IF p_kg IS NULL OR p_kg <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'kg_alocado deve ser maior que zero');
  END IF;

  -- Row-level serialization lock (concurrency-gate waiver evidence):
  -- callers allocating across MULTIPLE needs in one transaction must
  -- invoke this RPC in ascending p_necessidade_id order to avoid
  -- deadlock (deterministic ascending lock order, order §10).
  SELECT * INTO v_necessidade
  FROM public.necessidade_compra_fio
  WHERE id = p_necessidade_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'erro', 'Necessidade nao encontrada');
  END IF;

  v_disponivel := v_necessidade.kg_necessario - v_necessidade.kg_alocado;
  IF p_kg > v_disponivel THEN
    RETURN jsonb_build_object(
      'ok', false,
      'erro', 'Alocacao excede o saldo disponivel da necessidade',
      'disponivel', v_disponivel
    );
  END IF;

  INSERT INTO public.ordem_compra_item_alocacao (item_id, necessidade_id, op_id, kg_alocado)
  VALUES (p_item_id, p_necessidade_id, p_op_id, p_kg);

  RETURN jsonb_build_object('ok', true, 'necessidade_id', p_necessidade_id, 'kg_alocado', p_kg);
END;
$$;

REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM authenticated;
REVOKE ALL ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) FROM service_role;
-- No GRANT to any client role in REFUND-A: inactive business writer.
-- PRE-PROD (§R.17) is the only phase authorized to grant EXECUTE, and
-- only after LIVE_ALLOCATION_T1_T2_TEST_PENDING is closed by a real
-- two-session test through a tooling channel that supports it.

COMMENT ON FUNCTION public.alocar_necessidade_compra_fio(BIGINT, BIGINT, BIGINT, NUMERIC) IS
  'Canonical allocation writer (§R.4). Locks the target necessidade_compra_fio row with SELECT ... FOR UPDATE, validates against the live kg_necessario - kg_alocado balance, inserts one ordem_compra_item_alocacao row (the AFTER trigger recomputes the cache). Built in REFUND-A, granted to NO client role (inactive) — activation is PRE-PROD scope, gated on closing LIVE_ALLOCATION_T1_T2_TEST_PENDING with a real two-session concurrency test.';


-- ============================================================
-- 5. public.ordem_compra_item_compat_fio — explicit one-to-one
--    compatibility mapping (§R.11 Ruling 9). Seeded for the 51
--    header-bearing legacy rows, inactive as a live application path.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ordem_compra_item_compat_fio (
  id                     BIGSERIAL PRIMARY KEY,
  ordem_compra_item_id   BIGINT NOT NULL UNIQUE REFERENCES public.ordem_compra_item(id),
  ordens_compra_fio_id   BIGINT NOT NULL UNIQUE REFERENCES public.ordens_compra_fio(id),
  origem                 TEXT NOT NULL CHECK (origem IN ('imported_legacy', 'native_bridge')),
  criado_em              TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por             UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.ordem_compra_item_compat_fio IS
  'Explicit one-to-one compatibility mapping between the new and flat models (§R.11 Ruling 9). Both UNIQUE constraints establish one-to-one in both directions. Immutable — never deleted, even when the order is cancelled. REFUND-A seeds 51 imported_legacy mappings (Class A/B/D); Class C creates none (no item). native_bridge mappings are created only from REFUND-B1/PRE-PROD onward by the future bridge writer (not built in REFUND-A). Two existing receipt writers (op-writes.js registrarRecebimentoOrdemFio; fornecedor.js screenFornecedorOrdens) will locate the flat row through this mapping starting in a later authorized phase — REFUND-A does not switch either writer.';

ALTER TABLE public.ordem_compra_item_compat_fio ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.ordem_compra_item_compat_fio FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_item_compat_fio FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_item_compat_fio FROM authenticated;

GRANT SELECT ON TABLE public.ordem_compra_item_compat_fio TO authenticated;

DROP POLICY IF EXISTS ordem_compra_item_compat_fio_admin_select ON public.ordem_compra_item_compat_fio;
CREATE POLICY ordem_compra_item_compat_fio_admin_select ON public.ordem_compra_item_compat_fio FOR SELECT
  USING (is_admin());


-- ============================================================
-- 6. Additive dual-reference transition — ordem_compra_eventos
--    (§R.20.1). Legacy reference RETAINED (relaxed to nullable only so
--    the exactly-one-parent CHECK is satisfiable by either model from a
--    future phase onward); new reference ADDED nullable. No writer
--    switched — db/66's emitir_ordem_compra_fio/cancelar_ordem_compra_fio
--    keep writing legacy-referenced events unchanged (they always set
--    ordem_compra_fio_id, never ordem_compra_id, so the CHECK is
--    trivially satisfied by every existing and future write from those
--    two writers).
-- ============================================================

ALTER TABLE public.ordem_compra_eventos
  ALTER COLUMN ordem_compra_fio_id DROP NOT NULL;

ALTER TABLE public.ordem_compra_eventos
  ADD COLUMN IF NOT EXISTS ordem_compra_id BIGINT REFERENCES public.ordem_compra(id) ON DELETE CASCADE;

ALTER TABLE public.ordem_compra_eventos
  ADD CONSTRAINT ordem_compra_eventos_um_pai_apenas
  CHECK ((ordem_compra_fio_id IS NOT NULL) <> (ordem_compra_id IS NOT NULL));

COMMENT ON COLUMN public.ordem_compra_eventos.ordem_compra_id IS
  'Additive transitional reference (§R.20.1). Nullable. NULL for every row written by the current legacy emit/cancel writers (db/66), which always set ordem_compra_fio_id instead. REFUND-B1 switches administrative writers to insert here instead; the legacy reference is removed only in a later authorized cleanup after reconciliation.';


-- ============================================================
-- 7. Additive dual-reference transition — ordem_compra_fio_lancamentos
--    (§R.20.2) + the ratified ledger structural contract (§R.8),
--    built INACTIVE (no writer, no opening balance, table stays empty).
-- ============================================================

ALTER TABLE public.ordem_compra_fio_lancamentos
  ALTER COLUMN ordem_compra_fio_id DROP NOT NULL;

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD COLUMN IF NOT EXISTS ordem_compra_item_id BIGINT REFERENCES public.ordem_compra_item(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL CHECK (tipo IN ('recebimento', 'import_saldo_inicial', 'estorno')),
  ADD COLUMN IF NOT EXISTS estorno_de_id BIGINT REFERENCES public.ordem_compra_fio_lancamentos(id),
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT NOT NULL UNIQUE,
  ADD COLUMN IF NOT EXISTS origem_tipo TEXT,
  ADD COLUMN IF NOT EXISTS origem_ref TEXT;

ALTER TABLE public.ordem_compra_fio_lancamentos
  DROP CONSTRAINT IF EXISTS ordem_compra_fio_lancamentos_kg_recebido_check;

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_sinal_kg CHECK (
       (tipo IN ('recebimento', 'import_saldo_inicial') AND kg_recebido > 0 AND estorno_de_id IS NULL)
    OR (tipo = 'estorno' AND kg_recebido < 0 AND estorno_de_id IS NOT NULL)
  );

ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_um_pai_apenas
  CHECK ((ordem_compra_fio_id IS NOT NULL) <> (ordem_compra_item_id IS NOT NULL));

COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.ordem_compra_item_id IS
  'Additive transitional reference (§R.20.2). Nullable in REFUND-A; becomes the sole applicable parent only at Phase C. No row currently exists (table stays empty through REFUND-A — no opening balance, no canonical receipt write).';
COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.tipo IS
  'Ruling 7: recebimento | import_saldo_inicial | estorno. Sign CHECK enforces kg_recebido>0 with estorno_de_id NULL for the first two, kg_recebido<0 with estorno_de_id NOT NULL for estorno.';
COMMENT ON COLUMN public.ordem_compra_fio_lancamentos.idempotency_key IS
  'Ruling 7: retrying the same receipt/correction creates no second row. NOT NULL UNIQUE from creation — no legacy row exists to backfill (table is empty).';

-- Append-only guard (§R.8): rejects UPDATE/DELETE even from privileged
-- paths (postgres/service_role), not just via REVOKE. Safe to install
-- now — the table is empty and no writer exists yet.
CREATE OR REPLACE FUNCTION public.trg_lancamento_append_only_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'ordem_compra_fio_lancamentos is append-only: % is not permitted', TG_OP;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_lancamento_append_only_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_lancamento_append_only_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_lancamento_append_only_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_lancamento_append_only_guard() FROM service_role;

DROP TRIGGER IF EXISTS trg_lancamento_append_only_guard ON public.ordem_compra_fio_lancamentos;
CREATE TRIGGER trg_lancamento_append_only_guard
  BEFORE UPDATE OR DELETE ON public.ordem_compra_fio_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_lancamento_append_only_guard();

-- Estorno-relationship guard (§R.8 Ruling 8): an estorno may reference
-- only a positive recebimento/import_saldo_inicial entry of the SAME
-- parent, never another item's entry, another estorno, or itself.
CREATE OR REPLACE FUNCTION public.trg_lancamento_estorno_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref RECORD;
BEGIN
  IF NEW.tipo = 'estorno' THEN
    SELECT * INTO v_ref FROM public.ordem_compra_fio_lancamentos WHERE id = NEW.estorno_de_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'estorno_de_id % not found', NEW.estorno_de_id;
    END IF;
    IF v_ref.id = NEW.id THEN
      RAISE EXCEPTION 'estorno cannot reference itself';
    END IF;
    IF v_ref.tipo NOT IN ('recebimento', 'import_saldo_inicial') THEN
      RAISE EXCEPTION 'estorno_de_id must reference a positive recebimento/import_saldo_inicial entry, found tipo=%', v_ref.tipo;
    END IF;
    IF v_ref.ordem_compra_fio_id IS DISTINCT FROM NEW.ordem_compra_fio_id
       OR v_ref.ordem_compra_item_id IS DISTINCT FROM NEW.ordem_compra_item_id THEN
      RAISE EXCEPTION 'estorno must reference an entry of the same parent (item/order)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_lancamento_estorno_guard() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_lancamento_estorno_guard() FROM anon;
REVOKE ALL ON FUNCTION public.trg_lancamento_estorno_guard() FROM authenticated;
REVOKE ALL ON FUNCTION public.trg_lancamento_estorno_guard() FROM service_role;

DROP TRIGGER IF EXISTS trg_lancamento_estorno_guard ON public.ordem_compra_fio_lancamentos;
CREATE TRIGGER trg_lancamento_estorno_guard
  BEFORE INSERT ON public.ordem_compra_fio_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.trg_lancamento_estorno_guard();


-- ============================================================
-- 8. Seed the ratified 64/51/51/51/51 conversion (§R.10) from the
--    64-row ordens_compra_fio corpus, 1:1, no merge.
-- ============================================================

CREATE TEMP TABLE _refund_a_classify ON COMMIT DROP AS
SELECT o.id AS ocf_id, o.op_id, o.fornecedor_id, o.tipo, o.cor_id, o.cor_poliester,
       o.kg_pedido, o.kg_recebido, o.status, o.status_administrativo,
       l.pedido_id AS resolved_pedido,
       CASE
         WHEN o.status_administrativo = 'emitida'  AND o.status = 'recebido_total' THEN 'A'
         WHEN o.status_administrativo = 'emitida'  AND o.status = 'pendente'       THEN 'B'
         WHEN o.status_administrativo = 'rascunho' AND o.status = 'pendente'       THEN 'C'
         WHEN o.status_administrativo = 'rascunho' AND o.status = 'recebido_total' THEN 'D'
       END AS class
FROM public.ordens_compra_fio o
LEFT JOIN public.ops   ops ON ops.id = o.op_id
LEFT JOIN public.lotes l   ON l.id   = ops.lote_id;

-- Migration-time self-check against the ratified diagnosis
-- (docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md §4) — fails
-- loudly rather than silently seeding a wrong conversion.
DO $$
DECLARE v_a int; v_b int; v_c int; v_d int; v_u int; v_total int;
BEGIN
  SELECT count(*) FILTER (WHERE class = 'A'), count(*) FILTER (WHERE class = 'B'),
         count(*) FILTER (WHERE class = 'C'), count(*) FILTER (WHERE class = 'D'),
         count(*) FILTER (WHERE class IS NULL), count(*)
  INTO v_a, v_b, v_c, v_d, v_u, v_total
  FROM _refund_a_classify;

  IF v_total <> 64 OR v_a <> 27 OR v_b <> 12 OR v_c <> 13 OR v_d <> 12 OR v_u <> 0 THEN
    RAISE EXCEPTION
      'REFUND-A seed classification mismatch: total=%, A=%, B=%, C=%, D=%, unknown=% (expected 64/27/12/13/12/0)',
      v_total, v_a, v_b, v_c, v_d, v_u;
  END IF;
END $$;

-- 8a. necessidade_compra_fio — one row per source row (64). Every
-- legacy need is OP-origin (origem_tipo='op') because ordens_compra_fio
-- always carries a non-null op_id (§R.10.7/§3.4 of the diagnosis).
-- kg_alocado starts at 0; step 8d's allocation insert (via the trigger)
-- raises it to kg_pedido for the 51 header-bearing needs.
INSERT INTO public.necessidade_compra_fio
  (pedido_id, origem_tipo, op_id, material, cor_id, cor_poliester, kg_necessario, kg_alocado, legado, legado_origem_ordem_compra_fio_id)
SELECT resolved_pedido, 'op', op_id, tipo, cor_id, cor_poliester, kg_pedido, 0, TRUE, ocf_id
FROM _refund_a_classify;

-- 8b-8e. ordem_compra / ordem_compra_item / ordem_compra_item_alocacao /
-- ordem_compra_item_compat_fio — row-by-row loop for exact correlation
-- (BIGSERIAL ids captured via RETURNING ... INTO, no ordering
-- assumption). Only Class A/B/D (51 rows) — Class C gets needs only.
DO $$
DECLARE
  r RECORD;
  v_ordem_id        BIGINT;
  v_item_id         BIGINT;
  v_necessidade_id  BIGINT;
  v_headers_created INT := 0;
BEGIN
  FOR r IN
    SELECT * FROM _refund_a_classify WHERE class IN ('A', 'B', 'D') ORDER BY ocf_id
  LOOP
    SELECT id INTO v_necessidade_id
    FROM public.necessidade_compra_fio
    WHERE legado_origem_ordem_compra_fio_id = r.ocf_id;

    IF v_necessidade_id IS NULL THEN
      RAISE EXCEPTION 'REFUND-A seed: no necessidade_compra_fio found for ordens_compra_fio.id=%', r.ocf_id;
    END IF;

    INSERT INTO public.ordem_compra
      (pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado, legado_provenance)
    VALUES (
      r.resolved_pedido, r.fornecedor_id,
      CASE r.class WHEN 'D' THEN 'rascunho' ELSE 'emitida' END,
      'nao_aplicavel',
      CASE r.class WHEN 'B' THEN 'nao_recebido' ELSE 'recebido' END,
      TRUE,
      CASE r.class WHEN 'A' THEN 'emitido_recebido' WHEN 'B' THEN 'emitido_nao_recebido' WHEN 'D' THEN 'recebido_sem_emissao' END
    )
    RETURNING id INTO v_ordem_id;

    INSERT INTO public.ordem_compra_item
      (ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido)
    VALUES (v_ordem_id, r.tipo, r.cor_id, r.cor_poliester, r.kg_pedido, COALESCE(r.kg_recebido, 0))
    RETURNING id INTO v_item_id;

    INSERT INTO public.ordem_compra_item_alocacao (item_id, necessidade_id, op_id, kg_alocado)
    VALUES (v_item_id, v_necessidade_id, r.op_id, r.kg_pedido);

    INSERT INTO public.ordem_compra_item_compat_fio (ordem_compra_item_id, ordens_compra_fio_id, origem)
    VALUES (v_item_id, r.ocf_id, 'imported_legacy');

    v_headers_created := v_headers_created + 1;
  END LOOP;

  IF v_headers_created <> 51 THEN
    RAISE EXCEPTION 'REFUND-A seed: expected 51 headers created, got %', v_headers_created;
  END IF;
END $$;

-- 8f. Final reconciliation self-check (defense in depth, before COMMIT).
DO $$
DECLARE v_needs int; v_headers int; v_items int; v_alocacoes int; v_mapeamentos int;
BEGIN
  SELECT count(*) INTO v_needs      FROM public.necessidade_compra_fio      WHERE legado = TRUE;
  SELECT count(*) INTO v_headers    FROM public.ordem_compra                WHERE legado = TRUE;
  SELECT count(*) INTO v_items      FROM public.ordem_compra_item;
  SELECT count(*) INTO v_alocacoes  FROM public.ordem_compra_item_alocacao;
  SELECT count(*) INTO v_mapeamentos FROM public.ordem_compra_item_compat_fio;

  IF v_needs <> 64 OR v_headers <> 51 OR v_items <> 51 OR v_alocacoes <> 51 OR v_mapeamentos <> 51 THEN
    RAISE EXCEPTION
      'REFUND-A seed reconciliation mismatch: needs=%, headers=%, items=%, allocations=%, mappings=% (expected 64/51/51/51/51)',
      v_needs, v_headers, v_items, v_alocacoes, v_mapeamentos;
  END IF;
END $$;

COMMIT;

-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
