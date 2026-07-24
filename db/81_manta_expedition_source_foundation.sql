-- =====================================================================
-- db/81_manta_expedition_source_foundation.sql
-- PHASE-MANTA-B1 — dormant foundation for Manta-sourced expeditions.
--
-- Adds a SECOND authoritative expedition source (the Manta weaving OP)
-- alongside the existing Tapete finishing source, with cross-table source
-- integrity, consumed-output immutability, and a Manta OP reopening
-- restriction — WITHOUT making the Manta route operationally callable. No
-- UI action, RPC, or writer creates a Manta expedition after this
-- migration; PHASE-MANTA-B2 activates the route separately.
--
-- BINDING BUSINESS RULINGS (recorded in
-- docs/architecture/MANTA_DIRECT_ROUTE_PHASE_CONTRACT.md):
--   BR-1  Manta expedition eligibility derives exclusively from measured
--         weaving output (entregas.etapa='cima' + entrega_itens, non-defect
--         metros_entregues). The OP plan is not expedition authority.
--   BR-2  entregas.etapa='cima' is reused unchanged (the measured weaving
--         output). Tapete cima requires a finishing destination; Manta cima
--         has none. NO new entregas.etapa value is created; Manta never
--         calls gerar_op_latex / gerar_op_latex_split. The route-conditional
--         destination relaxation and the Manta expedition WRITER are
--         deferred to PHASE-MANTA-B2. entregas_destino_cima_chk is NOT
--         weakened here.
--   BR-3  Before any positive expedition release a Manta weaving output may
--         be corrected and a Manta OP reopened if the state machine allows.
--         After any expedicao_itens.metros_liberados > 0 through the OP, the
--         weaving output is immutable through normal writes and the OP
--         cannot be reopened; correction requires an explicit atomic
--         administrative reversal flow. app.retificacao_autorizada is the
--         single controlled technical escape (no UI enables it); until a
--         balance-preserving reversal writer exists, fail closed. B1 does
--         NOT implement a reversal/correction writer.
--
-- EXPEDITION SOURCE (exactly one, never both, never neither):
--   * expedicoes.op_latex_id      -> the Tapete finishing source (unchanged);
--   * expedicoes.op_tecelagem_id  -> the Manta weaving source (new).
--   op_tecelagem_id may reference only ops.tipo='tecelagem', a non-empty
--   route-homogeneous OP whose every op_item resolves to
--   modelos.tipo_produto='manta' (a Tapete or mixed OP is rejected). Source
--   identity is stable under db/78-80 (route homogeneity + model-reference
--   immutability). Manta is NEVER inferred from names.
--
-- GLOBAL DETERMINISTIC LOCK ORDER (reconciled with db/79/db/80 and the
-- db/31/db/32 expedition/delivery functions; no path here takes these in
-- reverse):
--   1. pedidos row (only when completion is involved — not here);
--   2. affected public.ops rows, ascending op_id            (FOR UPDATE);
--   3. affected public.modelos rows, ascending modelo_id    (FOR SHARE, db/80);
--   4. entregas / entrega_itens;
--   5. expedicoes;
--   6. expedicao_itens.
-- The new guards take ops (step 2) before expedicoes (step 5) before
-- expedicao_itens (step 6); the db/31/db/32 functions already lock the
-- owning ops row before that op's op_itens/entrega_itens/expedicoes, so the
-- new expedicoes/expedicao_itens triggers (invoked during those functions'
-- INSERTs) only re-enter locks the caller already holds. No new modelos row
-- lock is taken: a source OP's op_itens models are immutable once referenced
-- (db/79/db/80), so reading their tipo_produto unlocked is safe.
--
-- Forward-only. Idempotent (ADD COLUMN/CONSTRAINT/INDEX IF (NOT) EXISTS,
-- CREATE OR REPLACE FUNCTION, DROP/CREATE TRIGGER; no data or destructive
-- DDL). Existing rows with op_latex_id remain valid and unchanged. No
-- business-data creation. The migration-terminal compatibility guard is
-- advanced 80 -> 81 in the same commit
-- (tests/ordem-compra-c3d-deploy.smoke.js).
--
-- Depende de db/78, db/79, db/80, db/23, db/24, db/31, db/32, db/37. Aplicar
-- SOMENTE em ambiente local/descartavel ou em staging autorizado. Producao
-- proibida sem ordem explicita. NAO aplicar em shared development em B1.
-- =====================================================================

BEGIN;

-- ============================================================
-- 1. Second typed expedition source + exactly-one-source integrity.
--    A. op_tecelagem_id (Manta weaving source), ON DELETE RESTRICT.
--    B. op_latex_id becomes nullable (FK + existing UNIQUE preserved;
--       NULLs are distinct, so many Manta rows may share NULL op_latex_id).
--    C. exactly-one-source CHECK: (latex XOR tecelagem).
--    D. partial UNIQUE index on op_tecelagem_id — one expedition per Manta
--       weaving OP, and the lookup access path (no extra index needed, E).
--    Existing rows (op_latex_id NOT NULL, op_tecelagem_id NULL) stay valid.
-- ============================================================
ALTER TABLE public.expedicoes
  ADD COLUMN IF NOT EXISTS op_tecelagem_id BIGINT NULL
    REFERENCES public.ops(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.expedicoes.op_tecelagem_id IS
  'PHASE-MANTA-B1: Manta weaving expedition source (ops.tipo=tecelagem, homogeneous Manta OP). Mutually exclusive with op_latex_id (expedicoes_exactly_one_source_chk). Dormant until PHASE-MANTA-B2 activates the writer.';

ALTER TABLE public.expedicoes ALTER COLUMN op_latex_id DROP NOT NULL;

COMMENT ON COLUMN public.expedicoes.op_latex_id IS
  'Tapete finishing expedition source (ops.tipo=latex). Nullable since db/81 so a Manta expedition may instead carry op_tecelagem_id; exactly one of the two is non-null (expedicoes_exactly_one_source_chk). FK and UNIQUE(op_latex_id) preserved.';

ALTER TABLE public.expedicoes DROP CONSTRAINT IF EXISTS expedicoes_exactly_one_source_chk;
ALTER TABLE public.expedicoes
  ADD CONSTRAINT expedicoes_exactly_one_source_chk
  CHECK ((op_latex_id IS NOT NULL) <> (op_tecelagem_id IS NOT NULL));

-- One expedition per Manta weaving OP + the op_tecelagem_id lookup path.
CREATE UNIQUE INDEX IF NOT EXISTS expedicoes_op_tecelagem_id_uk
  ON public.expedicoes (op_tecelagem_id)
  WHERE op_tecelagem_id IS NOT NULL;

-- ============================================================
-- 2. Authoritative expedition-source validation (BEFORE INSERT or
--    source-changing UPDATE on expedicoes). Serializes on the affected
--    source OP row(s) FOR UPDATE (ascending op_id) BEFORE inspecting the
--    OP, so two concurrent creations for one Manta OP resolve to one commit
--    plus one controlled rejection (the partial unique index), and a source
--    change cannot race the OP's composition. Derives Manta strictly from
--    modelos.tipo_produto (never a name). BEFORE trigger => no partial write.
-- ============================================================
CREATE OR REPLACE FUNCTION public.expedicoes_source_validation_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_id   BIGINT;
  v_tipo      TEXT;
  v_item_ct   INTEGER;
  v_nonmanta  INTEGER;
BEGIN
  -- Only act on INSERT or an UPDATE that actually changes a source column.
  -- A status/atualizado_em UPDATE (e.g. recalcular_status_expedicao) is left
  -- untouched: no lock, no re-validation.
  IF TG_OP = 'UPDATE'
     AND NEW.op_latex_id     IS NOT DISTINCT FROM OLD.op_latex_id
     AND NEW.op_tecelagem_id IS NOT DISTINCT FROM OLD.op_tecelagem_id THEN
    RETURN NEW;
  END IF;

  -- Lock order step 2: every affected source OP identity (new + old on a
  -- source change), ascending op_id, FOR UPDATE. Held to transaction end so
  -- the composition read below is stable and concurrent creators serialize.
  FOR v_lock_id IN
    SELECT DISTINCT oid
      FROM unnest(ARRAY[
             NEW.op_latex_id, NEW.op_tecelagem_id,
             CASE WHEN TG_OP = 'UPDATE' THEN OLD.op_latex_id END,
             CASE WHEN TG_OP = 'UPDATE' THEN OLD.op_tecelagem_id END
           ]) AS t(oid)
     WHERE oid IS NOT NULL
     ORDER BY oid
  LOOP
    PERFORM 1 FROM public.ops WHERE id = v_lock_id FOR UPDATE;
  END LOOP;

  -- Defensive exactly-one-source (the CHECK also enforces this).
  IF (NEW.op_latex_id IS NOT NULL) = (NEW.op_tecelagem_id IS NOT NULL) THEN
    RAISE EXCEPTION
      'Expedicao % exige exatamente uma fonte (op_latex_id XOR op_tecelagem_id).',
      COALESCE(NEW.id::text, '(nova)');
  END IF;

  IF NEW.op_latex_id IS NOT NULL THEN
    -- Tapete finishing source: require ops.tipo='latex' (existing semantics).
    SELECT o.tipo INTO v_tipo FROM public.ops o WHERE o.id = NEW.op_latex_id;
    IF v_tipo IS NULL THEN
      RAISE EXCEPTION 'Expedicao: OP latex % inexistente.', NEW.op_latex_id;
    END IF;
    IF v_tipo <> 'latex' THEN
      RAISE EXCEPTION 'Expedicao: op_latex_id % deve ser OP de acabamento (tipo=latex), nao %.', NEW.op_latex_id, v_tipo;
    END IF;
  ELSE
    -- Manta weaving source: require ops.tipo='tecelagem', a non-empty OP,
    -- and every op_item resolving to modelos.tipo_produto='manta'. A Tapete
    -- or mixed OP is rejected defensively (db/78-80 already forbid mixing).
    SELECT o.tipo INTO v_tipo FROM public.ops o WHERE o.id = NEW.op_tecelagem_id;
    IF v_tipo IS NULL THEN
      RAISE EXCEPTION 'Expedicao: OP tecelagem % inexistente.', NEW.op_tecelagem_id;
    END IF;
    IF v_tipo <> 'tecelagem' THEN
      RAISE EXCEPTION 'Expedicao: op_tecelagem_id % deve ser OP de tecelagem (tipo=tecelagem), nao %.', NEW.op_tecelagem_id, v_tipo;
    END IF;

    SELECT count(*),
           count(*) FILTER (WHERE m.tipo_produto IS DISTINCT FROM 'manta')
      INTO v_item_ct, v_nonmanta
      FROM public.op_itens oi
      JOIN public.modelos m ON m.id = oi.modelo_id
     WHERE oi.op_id = NEW.op_tecelagem_id;

    IF v_item_ct = 0 THEN
      RAISE EXCEPTION 'Expedicao: OP tecelagem % nao possui itens; fonte Manta invalida.', NEW.op_tecelagem_id;
    END IF;
    IF v_nonmanta > 0 THEN
      RAISE EXCEPTION 'Expedicao: OP tecelagem % nao e homogenea de Manta (% item(ns) nao-Manta); fonte de expedicao Manta rejeitada.', NEW.op_tecelagem_id, v_nonmanta;
    END IF;
  END IF;

  -- On a source-changing UPDATE, reject a change that would orphan existing
  -- expedition items (they belong to the OLD source OP's items). The
  -- explicit administrative correction flow (app.retificacao_autorizada) is
  -- the only bypass; B1 implements no such writer.
  IF TG_OP = 'UPDATE'
     AND (NEW.op_latex_id IS DISTINCT FROM OLD.op_latex_id
          OR NEW.op_tecelagem_id IS DISTINCT FROM OLD.op_tecelagem_id)
     AND current_setting('app.retificacao_autorizada', true) IS DISTINCT FROM 'on'
     AND EXISTS (SELECT 1 FROM public.expedicao_itens xi WHERE xi.expedicao_id = OLD.id)
  THEN
    RAISE EXCEPTION
      'Expedicao %: nao e possivel trocar a fonte enquanto houver itens de expedicao vinculados (orfanaria itens). Use um fluxo de correcao autorizado.',
      OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expedicoes_source_validation_guard ON public.expedicoes;
CREATE TRIGGER expedicoes_source_validation_guard
  BEFORE INSERT OR UPDATE ON public.expedicoes
  FOR EACH ROW EXECUTE FUNCTION public.expedicoes_source_validation_guard_fn();

COMMENT ON FUNCTION public.expedicoes_source_validation_guard_fn() IS
  'db/81: valida a fonte de expedicao (op_latex_id=latex XOR op_tecelagem_id=tecelagem homogenea de Manta, nao vazia); serializa nas linhas public.ops afetadas (FOR UPDATE, op_id asc) antes de inspecionar; rejeita troca de fonte que orfanaria itens (exceto app.retificacao_autorizada). Manta derivado de modelos.tipo_produto, nunca por nome. BEFORE trigger, sem escrita parcial.';

-- ============================================================
-- 3. Expedition-item membership integrity.
--    3a. expedicao_itens (BEFORE INSERT or membership-changing UPDATE):
--        every op_item_id must belong to the expedition's SELECTED source OP
--        (op_latex_id for Latex, op_tecelagem_id for Manta). Cross-OP
--        injection rejected. Locks the item's OP and the source OP FOR
--        UPDATE (ascending), then the expedicoes row, then validates under a
--        fresh snapshot. A metros_entregues-only UPDATE (delivery path) is
--        left untouched.
--    3b. op_itens (BEFORE UPDATE that moves op_id): reject relocating an
--        op_item that is already referenced by an expedition (would orphan/
--        cross the membership invariant), except under app.retificacao_
--        autorizada. Deletion of a referenced op_item is already blocked by
--        expedicao_itens.op_item_id -> op_itens ON DELETE RESTRICT.
-- ============================================================
CREATE OR REPLACE FUNCTION public.expedicao_itens_membership_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_op   BIGINT;
  v_src_op    BIGINT;
  v_latex     BIGINT;
  v_tecelagem BIGINT;
  v_lock_id   BIGINT;
BEGIN
  -- Only act on INSERT or an UPDATE that changes membership (op_item_id or
  -- expedicao_id). A pure metros_entregues/atualizado_em UPDATE (the
  -- registrar_entrega_expedicao delivery path) takes no lock and re-runs no
  -- validation, preserving that function's own lock order.
  IF TG_OP = 'UPDATE'
     AND NEW.op_item_id   IS NOT DISTINCT FROM OLD.op_item_id
     AND NEW.expedicao_id IS NOT DISTINCT FROM OLD.expedicao_id THEN
    RETURN NEW;
  END IF;

  -- Owning OP of the (new) op_item, and the expedition's declared source OP.
  -- Read unlocked first only to determine which OP ids to lock.
  SELECT oi.op_id INTO v_item_op FROM public.op_itens oi WHERE oi.id = NEW.op_item_id;
  IF v_item_op IS NULL THEN
    RAISE EXCEPTION 'Item de expedicao: op_item_id % inexistente.', NEW.op_item_id;
  END IF;

  SELECT ex.op_latex_id, ex.op_tecelagem_id
    INTO v_latex, v_tecelagem
    FROM public.expedicoes ex WHERE ex.id = NEW.expedicao_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item de expedicao: expedicao % inexistente.', NEW.expedicao_id;
  END IF;
  v_src_op := COALESCE(v_latex, v_tecelagem);

  -- Lock order step 2: the item's OP and the source OP, ascending, FOR
  -- UPDATE (deduplicated; usually the same row for a valid membership).
  FOR v_lock_id IN
    SELECT DISTINCT oid FROM unnest(ARRAY[v_item_op, v_src_op]) AS t(oid)
     WHERE oid IS NOT NULL ORDER BY oid
  LOOP
    PERFORM 1 FROM public.ops WHERE id = v_lock_id FOR UPDATE;
  END LOOP;

  -- Lock order step 5: the expedicoes row; re-read the source under lock so
  -- a concurrent source change is observed (READ COMMITTED fresh snapshot).
  SELECT ex.op_latex_id, ex.op_tecelagem_id
    INTO v_latex, v_tecelagem
    FROM public.expedicoes ex WHERE ex.id = NEW.expedicao_id FOR UPDATE;
  v_src_op := COALESCE(v_latex, v_tecelagem);

  IF v_src_op IS NULL THEN
    RAISE EXCEPTION 'Item de expedicao: expedicao % sem fonte definida.', NEW.expedicao_id;
  END IF;

  IF v_item_op <> v_src_op THEN
    RAISE EXCEPTION
      'Item de expedicao: op_item % (OP %) nao pertence a OP fonte % da expedicao % (injecao cross-OP rejeitada).',
      NEW.op_item_id, v_item_op, v_src_op, NEW.expedicao_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expedicao_itens_membership_guard ON public.expedicao_itens;
CREATE TRIGGER expedicao_itens_membership_guard
  BEFORE INSERT OR UPDATE ON public.expedicao_itens
  FOR EACH ROW EXECUTE FUNCTION public.expedicao_itens_membership_guard_fn();

COMMENT ON FUNCTION public.expedicao_itens_membership_guard_fn() IS
  'db/81: prova que expedicao_itens.op_item_id pertence a OP fonte selecionada da expedicao (op_latex_id ou op_tecelagem_id); rejeita injecao cross-OP. Trava OP do item + OP fonte (FOR UPDATE, op_id asc) e a linha expedicoes antes de validar. UPDATE apenas de metros_entregues nao dispara re-validacao. BEFORE trigger, sem escrita parcial.';

CREATE OR REPLACE FUNCTION public.op_itens_expedicao_reference_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lock_id BIGINT;
BEGIN
  -- Only a relocation (op_id change) can orphan an expedition item; other
  -- op_itens updates are ignored by this guard.
  IF NEW.op_id IS NOT DISTINCT FROM OLD.op_id THEN
    RETURN NEW;
  END IF;

  -- Lock order step 2: both OPs, ascending, FOR UPDATE (composes with the
  -- db/79/db/80 homogeneity guard which locks the same rows ascending).
  FOR v_lock_id IN
    SELECT DISTINCT oid FROM unnest(ARRAY[NEW.op_id, OLD.op_id]) AS t(oid)
     WHERE oid IS NOT NULL ORDER BY oid
  LOOP
    PERFORM 1 FROM public.ops WHERE id = v_lock_id FOR UPDATE;
  END LOOP;

  IF current_setting('app.retificacao_autorizada', true) IS DISTINCT FROM 'on'
     AND EXISTS (SELECT 1 FROM public.expedicao_itens xi WHERE xi.op_item_id = OLD.id)
  THEN
    RAISE EXCEPTION
      'op_item %: nao pode ser movido para outra OP enquanto referenciado por uma expedicao (quebraria a integridade de origem). Use um fluxo de correcao autorizado.',
      OLD.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS op_itens_expedicao_reference_guard ON public.op_itens;
CREATE TRIGGER op_itens_expedicao_reference_guard
  BEFORE UPDATE ON public.op_itens
  FOR EACH ROW EXECUTE FUNCTION public.op_itens_expedicao_reference_guard_fn();

COMMENT ON FUNCTION public.op_itens_expedicao_reference_guard_fn() IS
  'db/81: rejeita mover um op_item (mudanca de op_id) enquanto referenciado por expedicao_itens (exceto app.retificacao_autorizada); preserva a integridade de origem da expedicao. Trava as OPs afetadas (FOR UPDATE, op_id asc). Exclusao ja e barrada por FK ON DELETE RESTRICT.';

-- ============================================================
-- 4. Consumed Manta output immutability.
--    After any expedicao_itens.metros_liberados > 0 through a Manta weaving
--    OP, the measured weaving output it consumes is immutable through normal
--    writes. Rejects UPDATE (of op_id/op_item_id/metros_entregues/defeito)
--    or DELETE of a relevant entrega_itens row, and any UPDATE/DELETE of the
--    owning entregas header that would alter the meaning/ownership of that
--    consumed output. app.retificacao_autorizada='on' is the single
--    controlled escape (used by the authorized correction/controlled-delete
--    flow, e.g. remover_op/remover_pedido in db/37). B1 fails closed: no
--    reversal writer exists yet.
--
--    An entrega_item is "consumed Manta output" when its op_item is
--    referenced by an expedicao_item of a Manta-sourced expedition
--    (op_tecelagem_id NOT NULL) with metros_liberados > 0. The existing
--    db/24 entrega_*_cima_latex_guard protects only Latex-linked cima
--    output; Manta cima output is never Latex-linked, so this guard fills
--    that exact gap and composes as an additional BEFORE trigger.
-- ============================================================
CREATE OR REPLACE FUNCTION public.entrega_itens_manta_consumo_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_op_item BIGINT;
BEGIN
  IF current_setting('app.retificacao_autorizada', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE, only a change to a protected column is relevant.
  IF TG_OP = 'UPDATE'
     AND NEW.op_id           IS NOT DISTINCT FROM OLD.op_id
     AND NEW.op_item_id      IS NOT DISTINCT FROM OLD.op_item_id
     AND NEW.metros_entregues IS NOT DISTINCT FROM OLD.metros_entregues
     AND NEW.defeito         IS NOT DISTINCT FROM OLD.defeito THEN
    RETURN NEW;
  END IF;

  v_op_item := OLD.op_item_id;
  IF v_op_item IS NOT NULL
     AND EXISTS (
       SELECT 1
         FROM public.expedicao_itens xi
         JOIN public.expedicoes ex ON ex.id = xi.expedicao_id
        WHERE xi.op_item_id = v_op_item
          AND ex.op_tecelagem_id IS NOT NULL
          AND xi.metros_liberados > 0
     )
  THEN
    RAISE EXCEPTION
      'Saida de tecelagem (Manta) ja consumida por expedicao (metros_liberados>0) nao pode ser alterada/excluida sem retificacao autorizada (op_item %).',
      v_op_item;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entrega_itens_manta_consumo_guard ON public.entrega_itens;
CREATE TRIGGER entrega_itens_manta_consumo_guard
  BEFORE UPDATE OR DELETE ON public.entrega_itens
  FOR EACH ROW EXECUTE FUNCTION public.entrega_itens_manta_consumo_guard_fn();

COMMENT ON FUNCTION public.entrega_itens_manta_consumo_guard_fn() IS
  'db/81: apos consumo por expedicao Manta (op_tecelagem_id, metros_liberados>0) torna a saida de tecelagem imutavel por escrita normal — rejeita UPDATE de op_id/op_item_id/metros_entregues/defeito e DELETE, exceto app.retificacao_autorizada=on. Compoe com o guard db/24 (que so cobre saida ligada a Latex).';

CREATE OR REPLACE FUNCTION public.entregas_manta_consumo_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('app.retificacao_autorizada', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  -- Reject an entregas header UPDATE/DELETE when the header owns any consumed
  -- Manta output item (its meaning/ownership must not silently change).
  IF EXISTS (
    SELECT 1
      FROM public.entrega_itens ei
      JOIN public.expedicao_itens xi ON xi.op_item_id = ei.op_item_id
      JOIN public.expedicoes ex ON ex.id = xi.expedicao_id
     WHERE ei.entrega_id = OLD.id
       AND ei.op_item_id IS NOT NULL
       AND ex.op_tecelagem_id IS NOT NULL
       AND xi.metros_liberados > 0
  )
  THEN
    RAISE EXCEPTION
      'Entrega % possui saida de tecelagem (Manta) ja consumida por expedicao; alteracao/exclusao do cabecalho exige retificacao autorizada.',
      OLD.id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS entregas_manta_consumo_guard ON public.entregas;
CREATE TRIGGER entregas_manta_consumo_guard
  BEFORE UPDATE OR DELETE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.entregas_manta_consumo_guard_fn();

COMMENT ON FUNCTION public.entregas_manta_consumo_guard_fn() IS
  'db/81: rejeita UPDATE/DELETE de um cabecalho de entrega que possua saida de tecelagem (Manta) ja consumida por expedicao (metros_liberados>0), exceto app.retificacao_autorizada=on.';

-- ============================================================
-- 5. Manta OP reopening restriction after consumption.
--    Authoritatively reject moving a terminal Manta weaving OP back to a
--    non-terminal production state once any expedition sourced through it has
--    positive metros_liberados. Before positive release this guard is inert,
--    so the existing state machine (db/21 alterar_status_op) is preserved;
--    Tapete OPs (op_latex_id expeditions) never match, so their behavior is
--    unchanged. This is a trigger-level authority: db/21 alterar_status_op
--    already blocks terminal->anything at the RPC layer, but a direct
--    UPDATE ops SET status is otherwise unguarded. app.retificacao_autorizada
--    is the single controlled escape for a future atomic reversal flow.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ops_manta_reopen_guard_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only a terminal -> non-terminal transition (a reopening) is restricted.
  IF NOT ( OLD.status IN ('concluida', 'finalizada', 'cancelada')
           AND NEW.status IN ('simulada', 'aberta', 'em_producao', 'pausada') ) THEN
    RETURN NEW;
  END IF;

  IF current_setting('app.retificacao_autorizada', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Consumed through a Manta expedition (op_tecelagem_id = this OP) with
  -- positive release. This implies a Manta weaving OP; Tapete OPs use
  -- op_latex_id and never match.
  IF EXISTS (
    SELECT 1
      FROM public.expedicoes ex
      JOIN public.expedicao_itens xi ON xi.expedicao_id = ex.id
     WHERE ex.op_tecelagem_id = OLD.id
       AND xi.metros_liberados > 0
  )
  THEN
    RAISE EXCEPTION
      'OP Manta % ja consumida por expedicao (metros_liberados>0) nao pode ser reaberta (% -> %) sem retificacao autorizada.',
      OLD.id, OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ops_manta_reopen_guard ON public.ops;
CREATE TRIGGER ops_manta_reopen_guard
  BEFORE UPDATE ON public.ops
  FOR EACH ROW EXECUTE FUNCTION public.ops_manta_reopen_guard_fn();

COMMENT ON FUNCTION public.ops_manta_reopen_guard_fn() IS
  'db/81: rejeita reabrir (terminal -> nao-terminal) uma OP Manta ja consumida por expedicao (op_tecelagem_id, metros_liberados>0), exceto app.retificacao_autorizada=on. Antes de liberacao positiva e inerte (preserva db/21); OPs Tapete nunca casam.';

-- ============================================================
-- 6. Reload PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
