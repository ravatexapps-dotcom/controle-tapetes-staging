-- =====================================================================
-- db/80_manta_model_reference_concurrency_correction.sql
-- PHASE-MANTA-A — serialize model identity against the first item reference.
--
-- Forward-only, idempotent correction of one remaining concurrency gap left by
-- db/79. It does NOT edit db/78 or db/79 (forward-only migration policy;
-- PEDIDO_OP_SCHEMA_CONTRACT.md §12). The migration terminal guard advances
-- 79 -> 80 in the same commit (tests/ordem-compra-c3d-deploy.smoke.js).
--
-- THE GAP. db/79 serializes competing writes to the same OP (ops-row FOR UPDATE)
-- and makes model tipo_produto/largura immutable once referenced. But product
-- identity is still derived live through modelo_id, and the item-side guards read
-- modelos.tipo_produto/largura WITHOUT locking the model row. So the first
-- Pedido/OP reference to a model does not serialize against a concurrent change of
-- that model's tipo_produto or largura:
--   * an item writer can read the model as 'tapete', validate homogeneity/width,
--     and commit, while a concurrent modelos UPDATE (whose immutability guard does
--     not yet see the still-uncommitted reference) changes the model to 'manta' and
--     commits -> a committed route/identity inconsistency; and symmetrically
--   * an item writer can validate against a model whose committed identity has
--     already changed under a concurrent snapshot.
--
-- THE FIX. Both item-side guards now lock every affected modelos row with FOR
-- SHARE, in deterministic ascending modelo_id order, BEFORE reading the model's
-- type/width. FOR SHARE conflicts with the row lock a modelos UPDATE takes
-- (a BEFORE UPDATE row trigger locks its target row FOR UPDATE-equivalently via
-- GetTupleForTrigger BEFORE the immutability guard fires), so:
--   * if the reference goes first, the model UPDATE blocks until it commits and
--     the immutability guard then observes the committed reference and rejects; and
--   * if the model UPDATE goes first, the item writer blocks until it commits and
--     then re-reads the new committed identity and validates against it.
-- No transaction can validate against one identity and commit against another.
-- FOR SHARE is compatible with FOR SHARE, so concurrent references to the same or
-- different models never block each other; only a concurrent identity change does.
--
-- GLOBAL DETERMINISTIC LOCK ORDER (no db/80 path takes these in reverse):
--   1. affected public.ops rows, ascending op_id      (FOR UPDATE, from db/79);
--   2. affected public.modelos rows, ascending modelo_id (FOR SHARE, new here);
--   3. inspect op_itens / pedido_itens and continue the write.
-- This composes deadlock-free with db/79 movement locks (ops locked before models)
-- and with the existing db/31/db/32 finishing functions (they lock the owning ops
-- row before that op's op_itens and take no modelos row lock). A modelos UPDATE
-- locks only its own target row and takes no ops row, so it can never invert the
-- ops-before-models order.
--
-- PRESERVED: op_itens homogeneity semantics and db/79 ops-row serialization; the
-- Manta width-override rule; modelos_route_identity_immutability_guard_fn (not
-- modified); function signatures, trigger names, SECURITY DEFINER, fixed
-- search_path, grants; the finishing guards. No denormalized tipo_produto column
-- is introduced on pedido_itens, op_itens or ops. No business data.
--
-- Depende de db/79. Aplicar SOMENTE em ambiente local/descartavel ou em staging
-- autorizado. Producao proibida sem ordem explicita.
-- =====================================================================

BEGIN;

-- ============================================================
-- 1. op_itens route-homogeneity guard — serialize the model identity.
--    db/79 body, plus an ascending FOR SHARE lock on every affected modelos
--    row (destination model, plus the source model when an UPDATE moves the
--    item) taken AFTER the ops-row locks and BEFORE the type is read.
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
  -- Lock order step 1: affected OP rows, ascending op_id (db/79).
  FOR v_lock_id IN
    SELECT DISTINCT oid
      FROM unnest(
             CASE WHEN TG_OP = 'UPDATE' THEN ARRAY[NEW.op_id, OLD.op_id]
                  ELSE ARRAY[NEW.op_id] END
           ) AS t(oid)
     WHERE oid IS NOT NULL
     ORDER BY oid
  LOOP
    PERFORM 1 FROM public.ops WHERE id = v_lock_id FOR UPDATE;
  END LOOP;

  -- Lock order step 2: affected model rows, ascending modelo_id, FOR SHARE
  -- (db/80). Conflicts with a concurrent UPDATE of modelos.tipo_produto/largura,
  -- so the identity used below cannot change before this item commits. Held to
  -- transaction end.
  FOR v_lock_id IN
    SELECT DISTINCT mid
      FROM unnest(
             CASE WHEN TG_OP = 'UPDATE' THEN ARRAY[NEW.modelo_id, OLD.modelo_id]
                  ELSE ARRAY[NEW.modelo_id] END
           ) AS t(mid)
     WHERE mid IS NOT NULL
     ORDER BY mid
  LOOP
    PERFORM 1 FROM public.modelos WHERE id = v_lock_id FOR SHARE;
  END LOOP;

  -- Lock order step 3: inspect and continue. The incoming model's type is now
  -- read under its held FOR SHARE lock (committed identity); the other items'
  -- models are already referenced and therefore immutable, so reading them
  -- unlocked is safe.
  SELECT m.tipo_produto INTO v_new_tipo FROM public.modelos m WHERE m.id = NEW.modelo_id;
  IF v_new_tipo IS NULL THEN
    RAISE EXCEPTION 'Modelo % sem tipo_produto ao inserir/atualizar item de OP.', NEW.modelo_id;
  END IF;

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
  'db/80: como db/79 (rota homogenea por OP; serializa gravacoes na mesma OP via public.ops FOR UPDATE em ordem crescente de op_id) e adicionalmente trava a(s) linha(s) public.modelos afetada(s) (destino, e origem no UPDATE que move o item) com FOR SHARE em ordem crescente de modelo_id ANTES de ler tipo_produto. Impede que a identidade do modelo mude entre validacao e commit; FOR SHARE nao serializa referencias concorrentes entre si. Ordem global: ops(op_id asc) -> modelos(modelo_id asc) -> inspecao. Sem coluna de tipo desnormalizada; BEFORE trigger, sem escrita parcial.';

-- ============================================================
-- 2. pedido_itens Manta width guard — serialize the model identity.
--    db/78 body, plus an ascending FOR SHARE lock on every affected modelos
--    row taken BEFORE the type/width is derived, so the FIRST pedido reference
--    also serializes against a concurrent tipo_produto/largura change.
-- ============================================================
CREATE OR REPLACE FUNCTION public.pedido_itens_manta_largura_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo    TEXT;
  v_lock_id BIGINT;
BEGIN
  -- Lock the referenced model row(s) FOR SHARE, ascending modelo_id (db/80), so
  -- the model identity cannot change before this reference commits. Applies to
  -- every reference (not only Manta width overrides) so the first pedido
  -- reference serializes against a concurrent identity change. Held to txn end.
  FOR v_lock_id IN
    SELECT DISTINCT mid
      FROM unnest(
             CASE WHEN TG_OP = 'UPDATE' THEN ARRAY[NEW.modelo_id, OLD.modelo_id]
                  ELSE ARRAY[NEW.modelo_id] END
           ) AS t(mid)
     WHERE mid IS NOT NULL
     ORDER BY mid
  LOOP
    PERFORM 1 FROM public.modelos WHERE id = v_lock_id FOR SHARE;
  END LOOP;

  -- Manta width-override validation (db/78), now against the locked identity.
  IF NEW.largura IS NOT NULL THEN
    SELECT m.tipo_produto INTO v_tipo FROM public.modelos m WHERE m.id = NEW.modelo_id;
    IF v_tipo = 'manta' AND NEW.largura <> 1.40 THEN
      RAISE EXCEPTION 'Item Manta so admite largura 1.40 m (override invalido: %).', NEW.largura;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pedido_itens_manta_largura_guard ON public.pedido_itens;
CREATE TRIGGER pedido_itens_manta_largura_guard
  BEFORE INSERT OR UPDATE ON public.pedido_itens
  FOR EACH ROW EXECUTE FUNCTION public.pedido_itens_manta_largura_guard_fn();

COMMENT ON FUNCTION public.pedido_itens_manta_largura_guard_fn() IS
  'db/80: como db/78 (rejeita override de largura <> 1.40 para item Manta) e adicionalmente trava a(s) linha(s) public.modelos referenciada(s) com FOR SHARE em ordem crescente de modelo_id ANTES de derivar tipo/largura, para toda referencia. Serializa a primeira referencia de Pedido contra alteracao concorrente de tipo_produto/largura; FOR SHARE nao serializa referencias concorrentes entre si.';

-- ============================================================
-- 3. Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
