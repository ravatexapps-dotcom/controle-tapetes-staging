-- scripts/reset/clean-slate-transactional-restore.sql
--
-- Clean-Slate Transactional Reset — verified RESTORE operation.
-- Governed by docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
-- (§8.2 restore runbook, §8.3 disposable restore drill).
--
-- SCOPE: disposable-drill only (sentinel GUC `clean_slate.execution_mode`).
--
-- Input contract: the caller (the drill harness) must first create and populate
--   TABLE clean_slate_restore_stage (table_name text NOT NULL, payload jsonb NOT NULL)
-- with one row per archived NDJSON row (payload = the exact archived `to_json`
-- object). This keeps the restore a pure, data-driven SQL operation.
--
-- Mechanism: exact primary keys / UUIDs / timestamps are preserved (rows are
-- inserted verbatim from `payload`). The archived snapshot is a consistent,
-- already-valid image, so it is loaded with `SET LOCAL session_replication_role
-- = replica` (a TRANSACTION-scoped setting that reverts at COMMIT — no session
-- safety setting is left changed, and no trigger/RLS object is permanently
-- disabled). FK/constraint validity is then PROVEN explicitly with triggers back
-- on: every foreign key of the restored tables is orphan-checked, and the exact
-- 16 Pedido / 20 OP / 25 lote / B6 identities are asserted. Any failure rolls the
-- whole transaction back.

\set ON_ERROR_STOP on

BEGIN;

DO $guard$
BEGIN
  IF current_setting('clean_slate.execution_mode', true) IS DISTINCT FROM 'disposable-drill' THEN
    RAISE EXCEPTION 'clean-slate restore refused: not the disposable-drill sentinel (%)',
      coalesce(current_setting('clean_slate.execution_mode', true), '(unset)') USING ERRCODE = '42501';
  END IF;
  IF to_regclass('clean_slate_restore_stage') IS NULL THEN
    RAISE EXCEPTION 'clean-slate restore refused: clean_slate_restore_stage is not loaded';
  END IF;
END
$guard$;

SET LOCAL session_replication_role = replica;

DO $restore$
DECLARE
  restore_order text[] := ARRAY[
    'public.pedidos', 'public.lotes', 'public.pedido_itens',
    'public.ops', 'public.op_itens', 'public.op_fornecedores', 'public.op_eventos', 'public.op_latex_entregas',
    'public.ordens_compra_fio', 'public.necessidade_compra_fio', 'public.ordem_compra', 'public.ordem_compra_item',
    'public.ordem_compra_item_alocacao', 'public.ordem_compra_item_compat_fio',
    'public.ordem_compra_recebimentos', 'public.ordem_compra_eventos', 'public.ordem_compra_fio_lancamentos',
    'public.ordem_compra_fio_movimentos_estoque', 'public.ordem_compra_distribuicao_comandos',
    'public.document_candidates', 'public.document_link_revisions', 'public.document_link_revision_ops',
    'public.document_events', 'public.document_technical_evidences', 'public.document_decisions',
    'public.pedido_eventos', 'public.pedido_cliente_eventos', 'public.pedido_parciais',
    'public.pedido_parcial_itens', 'public.pedido_compra_fio_regime'
  ];
  tbl        text;
  inserted   bigint;
  staged     bigint;
  total_in   bigint := 0;
  total_stg  bigint := (SELECT count(*) FROM clean_slate_restore_stage);
BEGIN
  FOREACH tbl IN ARRAY restore_order LOOP
    EXECUTE format(
      'INSERT INTO %s SELECT * FROM jsonb_populate_recordset(NULL::%s, '
      || 'coalesce((SELECT jsonb_agg(payload) FROM clean_slate_restore_stage WHERE table_name = %L), ''[]''::jsonb))',
      tbl, tbl, tbl);
    GET DIAGNOSTICS inserted = ROW_COUNT;
    SELECT count(*) INTO staged FROM clean_slate_restore_stage WHERE table_name = tbl;
    IF inserted <> staged THEN
      RAISE EXCEPTION 'restore %: inserted % rows but % were staged', tbl, inserted, staged;
    END IF;
    total_in := total_in + inserted;
  END LOOP;

  IF total_in <> total_stg THEN
    RAISE EXCEPTION 'restore total mismatch: inserted % but staged % (an unknown table_name may be present)', total_in, total_stg;
  END IF;
END
$restore$;

SET LOCAL session_replication_role = DEFAULT;

-- Prove FK validity with triggers back on: orphan-check every single-column FK of
-- the restored tables (this also proves the required master stubs are present).
DO $fk$
DECLARE
  r         record;
  orphans   bigint;
  restored  text[] := ARRAY[
    'ordens_compra_fio','necessidade_compra_fio','ordem_compra','ordem_compra_item','ordem_compra_item_alocacao',
    'ordem_compra_item_compat_fio','ordem_compra_recebimentos','ordem_compra_eventos','ordem_compra_fio_lancamentos',
    'ordem_compra_fio_movimentos_estoque','ordem_compra_distribuicao_comandos','document_candidates',
    'document_link_revisions','document_link_revision_ops','document_events','document_technical_evidences',
    'document_decisions','pedidos','pedido_itens','pedido_eventos','pedido_cliente_eventos','pedido_parciais',
    'pedido_parcial_itens','pedido_compra_fio_regime','ops','op_itens','op_fornecedores','op_eventos',
    'op_latex_entregas','lotes'];
BEGIN
  FOR r IN
    SELECT rel.relname AS child, att.attname AS ccol,
           fn.nspname AS pschema, frel.relname AS parent, fatt.attname AS pcol
    FROM pg_constraint con
    JOIN pg_class rel   ON rel.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace AND n.nspname = 'public'
    JOIN pg_class frel  ON frel.oid = con.confrelid
    JOIN pg_namespace fn ON fn.oid = frel.relnamespace
    JOIN pg_attribute att  ON att.attrelid = con.conrelid  AND att.attnum = con.conkey[1]
    JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = con.confkey[1]
    WHERE con.contype = 'f'
      AND array_length(con.conkey, 1) = 1
      AND rel.relname = ANY(restored)
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I c WHERE c.%I IS NOT NULL '
      || 'AND NOT EXISTS (SELECT 1 FROM %I.%I p WHERE p.%I = c.%I)',
      r.child, r.ccol, r.pschema, r.parent, r.pcol, r.ccol) INTO orphans;
    IF orphans <> 0 THEN
      RAISE EXCEPTION 'restore FK validity failed: %.% -> %.%.% has % orphan(s)', r.child, r.ccol, r.pschema, r.parent, r.pcol, orphans;
    END IF;
  END LOOP;
END
$fk$;

-- Prove exact restored identities (contract §6; drill §13.15-18).
DO $ident$
DECLARE
  b6 text := 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT';
  n  bigint;
  ops_txt text;
BEGIN
  IF (SELECT count(*) FROM public.pedidos) <> 16 THEN RAISE EXCEPTION 'restore identity: pedidos <> 16'; END IF;
  IF (SELECT count(*) FROM public.ops)     <> 20 THEN RAISE EXCEPTION 'restore identity: ops <> 20'; END IF;
  IF (SELECT count(*) FROM public.lotes)   <> 25 THEN RAISE EXCEPTION 'restore identity: lotes <> 25'; END IF;

  SELECT string_agg(id::text, ',' ORDER BY id) INTO ops_txt FROM public.ops;
  IF ops_txt <> '1,2,53,55,57,61,63,87,88,89,90,91,92,93,94,95,96,97,98,99' THEN
    RAISE EXCEPTION 'restore identity: OP id set mismatch (%)', ops_txt;
  END IF;
  IF (SELECT string_agg(id::text, ',' ORDER BY id) FROM public.lotes)
     <> '1,2,3,4,5,6,7,8,13,31,33,37,56,57,58,59,60,61,62,63,64,65,66,67,68' THEN
    RAISE EXCEPTION 'restore identity: lote id set mismatch';
  END IF;

  -- B6 fixture: 8 revisions, 10 revision-op rows across exactly OPs 55,57,61,63.
  IF (SELECT count(*) FROM public.document_link_revisions WHERE document_id = b6) <> 8 THEN
    RAISE EXCEPTION 'restore identity: B6 revisions <> 8'; END IF;
  SELECT count(*) INTO n FROM public.document_link_revision_ops
    WHERE revision_id IN (SELECT id FROM public.document_link_revisions WHERE document_id = b6);
  IF n <> 10 THEN RAISE EXCEPTION 'restore identity: B6 revision-op rows <> 10 (got %)', n; END IF;
  SELECT string_agg(DISTINCT op_id::text, ',' ORDER BY op_id::text) INTO ops_txt
    FROM public.document_link_revision_ops
    WHERE revision_id IN (SELECT id FROM public.document_link_revisions WHERE document_id = b6);
  IF ops_txt <> '55,57,61,63' THEN RAISE EXCEPTION 'restore identity: B6 OP footprint mismatch (%)', ops_txt; END IF;
END
$ident$;

DO $done$ BEGIN RAISE NOTICE 'CLEAN_SLATE_RESTORE_DISPOSABLE_DRILL_PASS'; END $done$;

COMMIT;
