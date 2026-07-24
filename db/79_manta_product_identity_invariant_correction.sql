-- =====================================================================
-- db/79_manta_product_identity_invariant_correction.sql
-- PHASE-MANTA-A — forward correction of db/78 route invariants.
--
-- Corrects two invariant defects in db/78 WITHOUT editing the published,
-- byte-stable db/78. The repository migration policy is forward-only:
-- published migrations are immutable read-only inputs (proven by the
-- per-migration checkpoint-hash + byte-stability guard in
-- tests/ordem-compra-c3d-deploy.smoke.js) and a correction is a new
-- linked migration (PEDIDO_OP_SCHEMA_CONTRACT.md §12: "The accepted
-- strategy is forward correction").
--
--   B. Route-homogeneity guard concurrency race.
--      db/78's op_itens_route_homogeneity_guard_fn inspected existing
--      op_itens for the target OP WITHOUT serializing concurrent inserts,
--      so two concurrent FIRST inserts of DIFFERENT product types into the
--      same (empty) OP could each observe an empty OP and both commit — a
--      committed mixed-route OP with no partial-write signal. This
--      correction serializes writers on the owning public.ops row(s)
--      (FOR UPDATE) BEFORE inspecting op_itens: the second writer blocks
--      until the first commits, then (under the canonical READ COMMITTED
--      isolation) re-reads the now-committed op_itens rows under a fresh
--      per-statement snapshot and is correctly rejected. Different OPs
--      never block each other (the lock is the per-op ops row). An UPDATE
--      that changes modelo_id or moves an item between OPs locks EVERY
--      affected OP identity in deterministic ascending id order, so
--      opposing moves cannot deadlock. It stays a BEFORE trigger, so an
--      aborted statement leaves no partial write.
--
--      Design note: product type stays DERIVED through
--      modelos.tipo_produto (no denormalized type column is introduced on
--      ops/op_itens, per the PHASE-MANTA-A contract §2.1). The
--      serialize-then-reinspect guarantee therefore depends on the
--      READ COMMITTED isolation used by PostgREST/Supabase (each statement
--      inside the trigger takes a fresh snapshot after the row-lock wait
--      resolves) — the same isolation db/78 already assumed. The existing
--      db/31 / db/32 finishing functions already lock the owning ops row
--      FOR UPDATE before touching that op's op_itens, so this guard's
--      ops-row-first, ascending-id lock order composes deadlock-free with
--      them.
--
--   C. Model route/composition mutability after use.
--      Because product type and composition are derived live through
--      modelos, an in-place change to modelos.tipo_produto or
--      modelos.largura silently rewrites the product identity of every
--      historical Pedido/OP that already references the model. This
--      correction adds an authoritative BEFORE UPDATE guard on
--      public.modelos: once a model is referenced by pedido_itens OR
--      op_itens, changing tipo_produto or largura is rejected (direct SQL
--      and stale UI alike). An UNreferenced model may still change them,
--      subject to the db/78 CHECK constraints. Non-routing metadata (e.g.
--      nome) stays editable. The preferred operational path for a post-use
--      type/width change is a new model SKU, not a rewrite of historical
--      identity. The db/78 informal-Manta backfill is unaffected: it runs
--      before this guard exists and, on any re-apply, no longer matches its
--      source row, so it performs no modelos UPDATE.
--
-- Forward-only. Idempotent (CREATE OR REPLACE FUNCTION + DROP/CREATE
-- TRIGGER only; no data or destructive DDL). Preserves db/78 verbatim.
-- Grants, SECURITY DEFINER mode and search_path preserved from db/78. No
-- business-data creation. The migration-terminal compatibility guard is
-- advanced 78 -> 79 in the same commit
-- (tests/ordem-compra-c3d-deploy.smoke.js).
--
-- Depende de db/78. Aplicar SOMENTE em ambiente local/descartavel ou em
-- staging autorizado. Producao proibida sem ordem explicita.
-- =====================================================================

BEGIN;

-- ============================================================
-- B. Concurrency-safe route-homogeneous OP guard.
--    Same homogeneity semantics as db/78, now serialized on the owning
--    ops row(s) before op_itens is inspected.
-- ============================================================
CREATE OR REPLACE FUNCTION public.op_itens_route_homogeneity_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_tipo TEXT;
  v_other    TEXT;
  v_lock_id  BIGINT;
BEGIN
  -- Serialize concurrent writers targeting the same OP(s) BEFORE inspecting
  -- op_itens. Lock every affected OP identity (the destination op, plus the
  -- source op when an UPDATE moves the item) in deterministic ascending id
  -- order so opposing moves cannot deadlock. Under READ COMMITTED the
  -- op_itens inspection below runs as a later statement with a fresh
  -- snapshot, so a writer that waited on this lock observes the committed
  -- rows of the writer that went first.
  FOR v_lock_id IN
    SELECT DISTINCT oid
      FROM unnest(
             CASE
               WHEN TG_OP = 'UPDATE' THEN ARRAY[NEW.op_id, OLD.op_id]
               ELSE ARRAY[NEW.op_id]
             END
           ) AS t(oid)
     WHERE oid IS NOT NULL
     ORDER BY oid
  LOOP
    PERFORM 1 FROM public.ops WHERE id = v_lock_id FOR UPDATE;
  END LOOP;

  -- Incoming item's product type (derived through modelos).
  SELECT m.tipo_produto INTO v_new_tipo FROM public.modelos m WHERE m.id = NEW.modelo_id;
  IF v_new_tipo IS NULL THEN
    RAISE EXCEPTION 'Modelo % sem tipo_produto ao inserir/atualizar item de OP.', NEW.modelo_id;
  END IF;

  -- Reject if the destination OP already holds any item of a different type.
  SELECT m.tipo_produto INTO v_other
    FROM public.op_itens oi
    JOIN public.modelos m ON m.id = oi.modelo_id
   WHERE oi.op_id = NEW.op_id
     AND oi.id IS DISTINCT FROM NEW.id
     AND m.tipo_produto <> v_new_tipo
   LIMIT 1;

  IF v_other IS NOT NULL THEN
    RAISE EXCEPTION
      'OP % nao pode misturar produtos (% x %): a rota da OP deve ser homogenea (apenas Tapete ou apenas Manta).',
      NEW.op_id, v_new_tipo, v_other;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS op_itens_route_homogeneity_guard ON public.op_itens;
CREATE TRIGGER op_itens_route_homogeneity_guard
  BEFORE INSERT OR UPDATE ON public.op_itens
  FOR EACH ROW EXECUTE FUNCTION public.op_itens_route_homogeneity_guard_fn();

COMMENT ON FUNCTION public.op_itens_route_homogeneity_guard_fn() IS
  'db/79: como db/78 (rota homogenea por OP; tipo derivado de modelos.tipo_produto) e adicionalmente serializa gravacoes concorrentes na mesma OP travando a(s) linha(s) public.ops (FOR UPDATE) em ordem crescente de id ANTES de inspecionar op_itens. Sob READ COMMITTED o segundo gravador re-le a linha ja commitada e e rejeitado; OPs diferentes nao se bloqueiam; UPDATE que move item entre OPs trava ambas em ordem crescente (sem deadlock). Sem coluna de tipo desnormalizada; BEFORE trigger, sem escrita parcial.';

-- ============================================================
-- C. Model route/composition immutability once referenced.
-- ============================================================
CREATE OR REPLACE FUNCTION public.modelos_route_identity_immutability_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the routing/composition identity is protected. Any other column
  -- (e.g. nome) is unaffected by this guard.
  IF NEW.tipo_produto IS DISTINCT FROM OLD.tipo_produto
     OR NEW.largura     IS DISTINCT FROM OLD.largura THEN
    IF EXISTS (SELECT 1 FROM public.pedido_itens WHERE modelo_id = OLD.id)
       OR EXISTS (SELECT 1 FROM public.op_itens  WHERE modelo_id = OLD.id) THEN
      RAISE EXCEPTION
        'Modelo % ja referenciado por Pedido/OP: tipo_produto e largura sao imutaveis apos uso (identidade historica derivada por modelo_id). Crie um novo modelo (SKU) para outro tipo/largura.',
        OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS modelos_route_identity_immutability_guard ON public.modelos;
CREATE TRIGGER modelos_route_identity_immutability_guard
  BEFORE UPDATE ON public.modelos
  FOR EACH ROW EXECUTE FUNCTION public.modelos_route_identity_immutability_guard_fn();

COMMENT ON FUNCTION public.modelos_route_identity_immutability_guard_fn() IS
  'db/79: apos um modelo ser referenciado por pedido_itens ou op_itens, rejeita alteracao de tipo_produto ou largura (protege a identidade historica de Pedido/OP, que derivam o produto via modelo_id). Modelo nao referenciado pode alterar esses campos sujeito aos CHECKs de db/78; nome e demais metadados permanecem editaveis. SQL direto e UI defasada recebem a mesma rejeicao.';

-- ============================================================
-- Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
