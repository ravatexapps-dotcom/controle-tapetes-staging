-- scripts/reset/clean-slate-transactional-reset.sql
--
-- Clean-Slate Transactional Reset — the one-time governed DELETE transaction.
-- Governed by docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
-- (§7 exact reset manifest, §9 mutation mechanism).
--
-- SCOPE OF THIS ORDER: this script may execute ONLY in the disposable-drill mode
-- (sentinel GUC `clean_slate.execution_mode = 'disposable-drill'`). Any real
-- shared-development execution mode is intentionally UNAVAILABLE and fails closed
-- here; a real shared-development reset requires a separate, explicitly
-- authorized destructive order. No shared-development database was reset by this
-- order.
--
-- Mechanism: one serialized transaction; `DELETE` only (never `TRUNCATE`);
-- children before parents; affected-row count asserted after every statement;
-- rollback on the first mismatch. FK enforcement and the C3C cutover fence
-- (`trg_c3c_protected_mutation_guard`, which passes through under `legacy_active`)
-- remain ACTIVE. The purge corpus includes 39 orders whose administrative status
-- is `emitida`; the per-row `*_rascunho_guard` business triggers reject deleting
-- an emitted order's items/allocations, so this transaction TEMPORARILY disables
-- exactly those blocking business guards (plus the allocation cache and the
-- pedido-parciais sync side-effect triggers) via table-owner `DISABLE TRIGGER`
-- and re-enables them before COMMIT. On any assertion failure the whole
-- transaction (including the DISABLE) rolls back, leaving all triggers enabled.
--
-- NOTE (recorded for the future real-reset order): the accepted contract §7
-- describes a "plain DELETE" reset. Because 39 of the 51 orders are `emitida`,
-- the rascunho guards must be handled for the delete to succeed; this file does
-- so with the minimal, transactional table-owner mechanism above.

\set ON_ERROR_STOP on

BEGIN;

-- 1) Execution-mode guard — fail closed unless the disposable-drill sentinel is set.
DO $guard$
BEGIN
  IF current_setting('clean_slate.execution_mode', true) IS DISTINCT FROM 'disposable-drill' THEN
    RAISE EXCEPTION 'clean-slate reset refused: execution mode % is not the authorized disposable-drill sentinel',
      coalesce(current_setting('clean_slate.execution_mode', true), '(unset)')
      USING ERRCODE = '42501';
  END IF;
END
$guard$;

-- 2) Precondition — cutover must be legacy_active (fence pass-through) with no PONR.
DO $pre$
DECLARE c public.ordem_compra_cutover%ROWTYPE;
BEGIN
  SELECT * INTO c FROM public.ordem_compra_cutover WHERE id = 1;
  IF c.status IS DISTINCT FROM 'legacy_active'
     OR c.read_authority IS DISTINCT FROM 'flat'
     OR c.reconciliation_status IS DISTINCT FROM 'not_started'
     OR c.productive_receipt_started_at IS NOT NULL THEN
    RAISE EXCEPTION 'clean-slate reset refused: cutover is not legacy_active/flat/not_started (status=%, read_authority=%, reconciliation=%, PONR=%)',
      c.status, c.read_authority, c.reconciliation_status, c.productive_receipt_started_at;
  END IF;
END
$pre$;

-- 3) Temporarily disable only the blocking business guards (re-enabled below).
ALTER TABLE public.ordem_compra_item          DISABLE TRIGGER item_quantidade_rascunho_guard;
ALTER TABLE public.ordem_compra_item_alocacao DISABLE TRIGGER alocacao_rascunho_guard;
ALTER TABLE public.ordem_compra_item_alocacao DISABLE TRIGGER trg_alocacao_kg_alocado_cache;
ALTER TABLE public.pedido_itens               DISABLE TRIGGER pedido_itens_sync_parciais_after_change_trigger;

-- 4) The exact contract §7 deletion order with per-statement affected-row assertions.
DO $reset$
DECLARE
  n      bigint;
  b6     text := 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT';
  seq    text := '';
  -- each DELETE is followed by an explicit GET DIAGNOSTICS + IF check
  -- (order §9: assert the affected-row count after every statement).
BEGIN
  -- ---- Boundary A: yarn-purchasing corpus (expected 0,0,0,0,0,51,51,51,64,51,64)
  DELETE FROM public.ordem_compra_fio_movimentos_estoque;      GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'A1 movimentos: expected 0 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_fio_lancamentos;             GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'A2 lancamentos: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_recebimentos;                GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'A3 recebimentos: expected 0 got %', n;END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_eventos;                     GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'A4 oc_eventos: expected 0 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_distribuicao_comandos;       GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'A5 comandos: expected 0 got %', n;    END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_item_compat_fio;             GET DIAGNOSTICS n = ROW_COUNT; IF n <> 51 THEN RAISE EXCEPTION 'A6 compat_fio: expected 51 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_item_alocacao;               GET DIAGNOSTICS n = ROW_COUNT; IF n <> 51 THEN RAISE EXCEPTION 'A7 alocacao: expected 51 got %', n;   END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra_item;                        GET DIAGNOSTICS n = ROW_COUNT; IF n <> 51 THEN RAISE EXCEPTION 'A8 oc_item: expected 51 got %', n;    END IF; seq := seq||n||',';
  DELETE FROM public.necessidade_compra_fio;                   GET DIAGNOSTICS n = ROW_COUNT; IF n <> 64 THEN RAISE EXCEPTION 'A9 necessidade: expected 64 got %', n;END IF; seq := seq||n||',';
  DELETE FROM public.ordem_compra;                             GET DIAGNOSTICS n = ROW_COUNT; IF n <> 51 THEN RAISE EXCEPTION 'A10 ordem_compra: expected 51 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.ordens_compra_fio;                        GET DIAGNOSTICS n = ROW_COUNT; IF n <> 64 THEN RAISE EXCEPTION 'A11 ordens_compra_fio: expected 64 got %', n; END IF; seq := seq||n;
  RAISE NOTICE 'CLEAN_SLATE boundary A affected-row sequence: %', seq;

  -- ---- Synthetic B6 document fixture (expected 0,0,10,8,0,1) — exact id only.
  seq := '';
  DELETE FROM public.document_technical_evidences WHERE document_id = b6;  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'B1 tech_evidences: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.document_decisions           WHERE document_id = b6;  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'B2 decisions: expected 0 got %', n;      END IF; seq := seq||n||',';
  DELETE FROM public.document_link_revision_ops
    WHERE revision_id IN (SELECT id FROM public.document_link_revisions WHERE document_id = b6);
  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 10 THEN RAISE EXCEPTION 'B3 revision_ops: expected 10 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.document_link_revisions      WHERE document_id = b6;  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 8  THEN RAISE EXCEPTION 'B4 link_revisions: expected 8 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.document_events              WHERE document_id = b6;  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'B5 doc_events: expected 0 got %', n;      END IF; seq := seq||n||',';
  DELETE FROM public.document_candidates          WHERE document_id = b6;  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 1  THEN RAISE EXCEPTION 'B6 candidates: expected 1 got %', n;     END IF; seq := seq||n;
  RAISE NOTICE 'CLEAN_SLATE B6 fixture affected-row sequence: %', seq;

  -- ---- Boundary B: Pedido/OP/lote corpus (expected 27,16,4,18,0,0,0,0,0,0,20,16,25)
  seq := '';
  DELETE FROM public.op_itens;                 GET DIAGNOSTICS n = ROW_COUNT; IF n <> 27 THEN RAISE EXCEPTION 'C1 op_itens: expected 27 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.op_fornecedores;          GET DIAGNOSTICS n = ROW_COUNT; IF n <> 16 THEN RAISE EXCEPTION 'C2 op_fornecedores: expected 16 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.op_eventos;               GET DIAGNOSTICS n = ROW_COUNT; IF n <> 4  THEN RAISE EXCEPTION 'C3 op_eventos: expected 4 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.pedido_itens;             GET DIAGNOSTICS n = ROW_COUNT; IF n <> 18 THEN RAISE EXCEPTION 'C4 pedido_itens: expected 18 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.pedido_eventos;           GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C5 pedido_eventos: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.pedido_cliente_eventos;   GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C6 pedido_cliente_eventos: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.pedido_parcial_itens;     GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C7 pedido_parcial_itens: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.pedido_parciais;          GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C8 pedido_parciais: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.pedido_compra_fio_regime; GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C9 pedido_compra_fio_regime: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.op_latex_entregas;        GET DIAGNOSTICS n = ROW_COUNT; IF n <> 0  THEN RAISE EXCEPTION 'C10 op_latex_entregas: expected 0 got %', n; END IF; seq := seq||n||',';
  DELETE FROM public.ops;                      GET DIAGNOSTICS n = ROW_COUNT; IF n <> 20 THEN RAISE EXCEPTION 'C11 ops: expected 20 got %', n;      END IF; seq := seq||n||',';
  DELETE FROM public.pedidos;                  GET DIAGNOSTICS n = ROW_COUNT; IF n <> 16 THEN RAISE EXCEPTION 'C12 pedidos: expected 16 got %', n;  END IF; seq := seq||n||',';
  DELETE FROM public.lotes;                    GET DIAGNOSTICS n = ROW_COUNT; IF n <> 25 THEN RAISE EXCEPTION 'C13 lotes: expected 25 got %', n;    END IF; seq := seq||n;
  RAISE NOTICE 'CLEAN_SLATE boundary B affected-row sequence: %', seq;
END
$reset$;

-- 4b) Flush the deferred kg_pedido constraint guard (its per-item checks skip the
-- now-deleted items) so no pending trigger events remain — otherwise the ENABLE
-- TRIGGER below cannot run ("pending trigger events") and the transaction aborts.
SET CONSTRAINTS ALL IMMEDIATE;

-- 5) Post-delete invariants (contract §7.4): zero-state + preserved untouched.
DO $post$
DECLARE bad text := '';
BEGIN
  IF (SELECT count(*) FROM public.ordens_compra_fio) <> 0
     OR (SELECT count(*) FROM public.ordem_compra) <> 0
     OR (SELECT count(*) FROM public.ordem_compra_item) <> 0
     OR (SELECT count(*) FROM public.ordem_compra_item_alocacao) <> 0
     OR (SELECT count(*) FROM public.ordem_compra_item_compat_fio) <> 0
     OR (SELECT count(*) FROM public.necessidade_compra_fio) <> 0
     OR (SELECT count(*) FROM public.pedidos) <> 0
     OR (SELECT count(*) FROM public.pedido_itens) <> 0
     OR (SELECT count(*) FROM public.ops) <> 0
     OR (SELECT count(*) FROM public.op_itens) <> 0
     OR (SELECT count(*) FROM public.op_fornecedores) <> 0
     OR (SELECT count(*) FROM public.op_eventos) <> 0
     OR (SELECT count(*) FROM public.lotes) <> 0
     OR (SELECT count(*) FROM public.document_candidates WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT') <> 0
     OR (SELECT count(*) FROM public.document_link_revisions WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT') <> 0 THEN
    RAISE EXCEPTION 'clean-slate reset post-invariant: target corpus is not zero';
  END IF;

  IF (SELECT count(*) FROM public.saldo_fios) <> 5 THEN bad := bad||'saldo_fios;'; END IF;
  IF (SELECT count(*) FROM public.saldo_fios_op) <> 0 THEN bad := bad||'saldo_fios_op;'; END IF;
  IF (SELECT ultimo_numero FROM public.op_numeros WHERE tipo='latex') <> 18 THEN bad := bad||'op_numeros.latex;'; END IF;
  IF (SELECT ultimo_numero FROM public.op_numeros WHERE tipo='tecelagem') <> 41 THEN bad := bad||'op_numeros.tecelagem;'; END IF;
  IF (SELECT status FROM public.ordem_compra_cutover WHERE id=1) <> 'legacy_active' THEN bad := bad||'cutover.status;'; END IF;
  IF bad <> '' THEN RAISE EXCEPTION 'clean-slate reset post-invariant: preserved state changed (%)', bad; END IF;
END
$post$;

-- 6) Re-enable the temporarily disabled business guards.
ALTER TABLE public.ordem_compra_item          ENABLE TRIGGER item_quantidade_rascunho_guard;
ALTER TABLE public.ordem_compra_item_alocacao ENABLE TRIGGER alocacao_rascunho_guard;
ALTER TABLE public.ordem_compra_item_alocacao ENABLE TRIGGER trg_alocacao_kg_alocado_cache;
ALTER TABLE public.pedido_itens               ENABLE TRIGGER pedido_itens_sync_parciais_after_change_trigger;

DO $done$ BEGIN RAISE NOTICE 'CLEAN_SLATE_RESET_DISPOSABLE_DRILL_PASS'; END $done$;

COMMIT;
