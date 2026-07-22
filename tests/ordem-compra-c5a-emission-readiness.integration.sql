-- tests/ordem-compra-c5a-emission-readiness.integration.sql
--
-- PHASE-C5A-DB-EMISSION-READINESS integration proof (db/77).
-- Governing contract: docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md
--   (ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY, §22). Requirement
--   OC-C5-EMISSION-001 (ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §R.24.10).
--
-- ENVIRONMENT: disposable local PostgreSQL 18.4 ONLY. The external runner applies
-- the Supabase-platform preamble, then db/01..db/77 in order (the classification-
-- faithful 64-row corpus loaded after db/66 before db/67, reconciliation
-- 64/51/51/51/51), then this file. Never a shared/remote/managed host. This file
-- opens ONE transaction, plants its own fixtures, and ROLLBACKs at the end — zero
-- persistent mutation. Points 1 (db/77 applies after the full chain) and 2 (clean
-- reapply idempotency) are proven by the runner (apply then reapply db/77); every
-- other point below is proven here.
--
-- Run:  psql -X -v ON_ERROR_STOP=1 -f tests/ordem-compra-c5a-emission-readiness.integration.sql
-- Success = the C5A_EMISSION_READINESS_INTEGRATION_PASS sentinel with no error.
--
-- Actor model: administrator claims use the synthetic admin
-- 00000000-0000-4000-8000-0000000c5a01 (tipo=admin) and non-admin
-- 00000000-0000-4000-8000-0000000c5a02. Role-scoped proofs (10/11/12) switch to
-- the real authenticated/anon roles; everything else runs as the migration owner
-- with the admin claim set (is_admin() is enforced by the claim, not the role).

\set ON_ERROR_STOP on
\set admin_uuid '''00000000-0000-4000-8000-0000000c5a01'''
\set nonadmin_uuid '''00000000-0000-4000-8000-0000000c5a02'''

BEGIN;

CREATE TEMP TABLE c5a_ctx (k TEXT PRIMARY KEY, v TEXT) ON COMMIT DROP;

-- ============================================================================
-- Section 0 — fixtures (planted with triggers off; identities + shaped orders).
-- ============================================================================
SET LOCAL session_replication_role = replica;

INSERT INTO auth.users(id, email) VALUES
  (:admin_uuid,    'c5a-int-admin@example.invalid'),
  (:nonadmin_uuid, 'c5a-int-nonadmin@example.invalid')
  ON CONFLICT (id) DO NOTHING;
-- The non-admin is an INACTIVE admin: authenticated (holds the authenticated
-- EXECUTE grant) but is_admin()=FALSE (tipo='admin' AND ativo IS TRUE fails),
-- so it exercises the internal administrator gate, not the ACL.
INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, cliente_id, ativo, nivel_acesso) VALUES
  (:admin_uuid,    'c5a-int-admin@example.invalid',    'C5A Int Admin',    'admin', NULL, NULL, TRUE,  'completo'),
  (:nonadmin_uuid, 'c5a-int-nonadmin@example.invalid', 'C5A Int NonAdmin', 'admin', NULL, NULL, FALSE, 'completo')
  ON CONFLICT (id) DO NOTHING;

DO $fixtures$
DECLARE
  v_cli BIGINT; v_forn BIGINT;
  v_p_elig UUID; v_p_zero UUID; v_p_incomp UUID; v_p_nosup UUID; v_p_cancel UUID; v_p_over UUID;
  v_n_elig BIGINT; v_n_incomp BIGINT; v_n_over BIGINT;
  v_o_zero BIGINT; v_o_incomp BIGINT; v_o_nosup BIGINT; v_o_cancel BIGINT; v_o_legacy BIGINT;
  v_item BIGINT;
BEGIN
  INSERT INTO public.clientes(nome) VALUES ('C5A Integration Cliente') RETURNING id INTO v_cli;
  INSERT INTO public.fornecedores(nome, tipo) VALUES ('C5A Integration Poliester', 'fio_poliester') RETURNING id INTO v_forn;

  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_elig;
  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_zero;
  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_incomp;
  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_nosup;
  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_cancel;
  INSERT INTO public.pedidos(cliente_id) VALUES (v_cli) RETURNING id INTO v_p_over;

  -- Native (Pedido-origin polyester) needs for the allocation-writer path.
  INSERT INTO public.necessidade_compra_fio(pedido_id, origem_tipo, material, cor_poliester, kg_necessario, legado)
    VALUES (v_p_elig,   'pedido', 'poliester', 'PRETO',  100.000, FALSE) RETURNING id INTO v_n_elig;
  INSERT INTO public.necessidade_compra_fio(pedido_id, origem_tipo, material, cor_poliester, kg_necessario, legado)
    VALUES (v_p_incomp, 'pedido', 'poliester', 'PRETO',  100.000, FALSE) RETURNING id INTO v_n_incomp;
  INSERT INTO public.necessidade_compra_fio(pedido_id, origem_tipo, material, cor_poliester, kg_necessario, legado)
    VALUES (v_p_over,   'pedido', 'poliester', 'BRANCO', 100.000, FALSE) RETURNING id INTO v_n_over;

  -- Shaped native drafts (unique (pedido,fornecedor) per the partial index).
  -- Zero-item native rascunho (fornecedor set, no items).
  INSERT INTO public.ordem_compra(pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado)
    VALUES (v_p_zero, v_forn, 'rascunho', 'nao_aplicavel', 'nao_recebido', FALSE) RETURNING id INTO v_o_zero;
  -- Missing-supplier native rascunho (fornecedor NULL, no items).
  INSERT INTO public.ordem_compra(pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado)
    VALUES (v_p_nosup, NULL, 'rascunho', 'nao_aplicavel', 'nao_recebido', FALSE) RETURNING id INTO v_o_nosup;
  -- Incomplete native rascunho: item kg_pedido=100 with only 60 allocated.
  INSERT INTO public.ordem_compra(pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado)
    VALUES (v_p_incomp, v_forn, 'rascunho', 'nao_aplicavel', 'nao_recebido', FALSE) RETURNING id INTO v_o_incomp;
  INSERT INTO public.ordem_compra_item(ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido)
    VALUES (v_o_incomp, 'poliester', NULL, 'PRETO', 100.000, 0) RETURNING id INTO v_item;
  INSERT INTO public.ordem_compra_item_alocacao(item_id, necessidade_id, op_id, kg_alocado)
    VALUES (v_item, v_n_incomp, NULL, 60.000);
  -- Cancelled native order.
  INSERT INTO public.ordem_compra(pedido_id, fornecedor_id, status_administrativo, status_aceite, status_recebimento, legado, cancelada_em)
    VALUES (v_p_cancel, v_forn, 'cancelada', 'nao_aplicavel', 'nao_recebido', FALSE, now()) RETURNING id INTO v_o_cancel;

  -- A legacy (legado=TRUE) order from the reconciled corpus.
  SELECT id INTO v_o_legacy FROM public.ordem_compra WHERE legado = TRUE ORDER BY id LIMIT 1;
  IF v_o_legacy IS NULL THEN RAISE EXCEPTION 'C5A_FIXTURE: no legacy ordem_compra found (corpus not reconciled?)'; END IF;

  INSERT INTO c5a_ctx(k, v) VALUES
    ('forn', v_forn::text),
    ('n_elig', v_n_elig::text), ('n_over', v_n_over::text),
    ('o_zero', v_o_zero::text), ('o_incomp', v_o_incomp::text),
    ('o_nosup', v_o_nosup::text), ('o_cancel', v_o_cancel::text), ('o_legacy', v_o_legacy::text);
END
$fixtures$;

SET LOCAL session_replication_role = origin;

-- Administrator claim for all owner-context RPC calls below.
SELECT set_config('request.jwt.claim.sub', :admin_uuid, true);

-- ============================================================================
-- Section 1 — terminal grant matrix (points 4,5,6,7,8,9).
-- ============================================================================
DO $acl$
DECLARE
  v BOOLEAN;
BEGIN
  -- emitir_ordem_compra: authenticated ONLY.
  IF NOT has_function_privilege('authenticated', 'public.emitir_ordem_compra(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_4: authenticated must have EXECUTE on emitir_ordem_compra';
  END IF;
  IF has_function_privilege('public', 'public.emitir_ordem_compra(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_6: PUBLIC must NOT have EXECUTE on emitir_ordem_compra';
  END IF;
  IF has_function_privilege('anon', 'public.emitir_ordem_compra(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_5: anon must NOT have EXECUTE on emitir_ordem_compra';
  END IF;
  IF has_function_privilege('service_role', 'public.emitir_ordem_compra(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_7: service_role must NOT have EXECUTE on emitir_ordem_compra';
  END IF;
  -- Superseded allocation writer stays ungranted (point 8).
  IF has_function_privilege('authenticated', 'public.alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)', 'EXECUTE')
     OR has_function_privilege('public', 'public.alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_8: superseded alocar_necessidade_compra_fio must stay ungranted';
  END IF;
  -- Active allocation writer stays granted to authenticated only (point 9).
  IF NOT has_function_privilege('authenticated', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_9a: authenticated must keep EXECUTE on definir_alocacao_necessidade_compra_fio';
  END IF;
  IF has_function_privilege('anon', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE')
     OR has_function_privilege('public', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_9b: active allocation writer must not be granted beyond authenticated';
  END IF;
  RAISE NOTICE 'C5A ok: grant matrix (points 4-9)';
END
$acl$;

-- ============================================================================
-- Section 2 — emitir_ordem_compra terminal body byte-unchanged (point 3).
-- db/77 grants only; it never CREATE-OR-REPLACEs the writer. The db/68 body is
-- proven present by its full deterministic error vocabulary, the acceptance
-- snapshot, the FOR UPDATE serialization, and the single audit event.
-- ============================================================================
DO $body$
DECLARE
  d TEXT := pg_get_functiondef('public.emitir_ordem_compra(bigint)'::regprocedure);
  needle TEXT;
BEGIN
  FOREACH needle IN ARRAY ARRAY[
    'sem_permissao','nao_encontrada','ordem_legado','estado_invalido',
    'sem_fornecedor','sem_itens','alocacao_incompleta','alocacao_incoerente',
    'aceite_exigido_na_emissao','FOR UPDATE','SECURITY DEFINER',
    'is_admin()', 'tipo_evento'
  ] LOOP
    IF position(needle IN d) = 0 THEN
      RAISE EXCEPTION 'C5A_FAIL_3: emitir_ordem_compra body missing marker %, body changed?', needle;
    END IF;
  END LOOP;
  -- The writer must NOT have acquired any read-model readiness derivation.
  IF position('bloqueio_emissao' IN d) > 0 OR position('_distribuicao_completa_ordem' IN d) > 0 THEN
    RAISE EXCEPTION 'C5A_FAIL_3: emitir_ordem_compra body unexpectedly carries read-model logic';
  END IF;
  RAISE NOTICE 'C5A ok: emitir body unchanged (point 3)';
END
$body$;

-- ============================================================================
-- Section 3 — active allocation writer: build the eligible order, over-alloc
-- denial, idempotent replay, conflicting key (points 9,17,18,31).
-- ============================================================================
DO $alloc$
DECLARE
  v_forn BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='forn');
  v_n_elig BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='n_elig');
  v_n_over BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='n_over');
  r1 JSONB; r2 JSONB; r3 JSONB; over JSONB; v_order BIGINT;
BEGIN
  -- Legacy_active permits the writer path (point 31): the create succeeds.
  r1 := public.definir_alocacao_necessidade_compra_fio(v_n_elig, v_forn, 100.000, 'c5a-elig');
  IF (r1->>'ok') <> 'true' OR (r1->>'codigo') <> 'ok' THEN
    RAISE EXCEPTION 'C5A_FAIL_31: allocation writer must succeed under legacy_active (got %)', r1;
  END IF;
  v_order := (r1->>'ordem_compra_id')::bigint;
  INSERT INTO c5a_ctx(k,v) VALUES ('o_elig', v_order::text);

  -- Idempotent replay: same key + same payload returns the identical result.
  r2 := public.definir_alocacao_necessidade_compra_fio(v_n_elig, v_forn, 100.000, 'c5a-elig');
  IF r2 <> r1 THEN
    RAISE EXCEPTION 'C5A_FAIL_18a: idempotent replay must return the identical result';
  END IF;
  -- Same key + different payload -> idempotencia_conflitante.
  r3 := public.definir_alocacao_necessidade_compra_fio(v_n_elig, v_forn, 50.000, 'c5a-elig');
  IF (r3->>'codigo') <> 'idempotencia_conflitante' THEN
    RAISE EXCEPTION 'C5A_FAIL_18b: reused key with different payload must be idempotencia_conflitante (got %)', r3;
  END IF;

  -- Over-allocation through the writer -> excede_saldo (point 17).
  over := public.definir_alocacao_necessidade_compra_fio(v_n_over, v_forn, 150.000, 'c5a-over');
  IF (over->>'codigo') <> 'excede_saldo' THEN
    RAISE EXCEPTION 'C5A_FAIL_17: over-allocation must be denied excede_saldo (got %)', over;
  END IF;
  RAISE NOTICE 'C5A ok: allocation writer create/idempotency/over-alloc (points 9,17,18,31)';
END
$alloc$;

-- ============================================================================
-- Section 4 — read model exposes emitir=true only for the eligible order
-- (points 23,24) and acoes.receber stays false (point 30).
-- ============================================================================
DO $ready$
DECLARE
  v_order BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_elig');
  det JSONB; lst JSONB; row JSONB;
BEGIN
  det := public.obter_ordem_compra_admin(v_order);
  IF (det#>>'{ordem,acoes,emitir}') <> 'true'
     OR (det#>>'{ordem,pode_emitir}') <> 'true'
     OR (det#>>'{ordem,bloqueio_emissao}') IS NOT NULL THEN
    RAISE EXCEPTION 'C5A_FAIL_23: detail read model must expose emitir=true/pode_emitir=true/bloqueio=NULL for the eligible order (got %)', det#>'{ordem}';
  END IF;
  IF (det#>>'{ordem,acoes,receber}') <> 'false' THEN
    RAISE EXCEPTION 'C5A_FAIL_30: receipt action must remain false in the read model';
  END IF;

  lst := public.listar_ordens_compra_admin((SELECT pedido_id::text::uuid FROM public.ordem_compra WHERE id=v_order));
  SELECT e INTO row FROM jsonb_array_elements(lst->'ordens') e WHERE (e->>'ordem_id')::bigint = v_order;
  IF row IS NULL THEN RAISE EXCEPTION 'C5A_FAIL_24: eligible order missing from list read model'; END IF;
  IF (row#>>'{acoes,emitir}') <> 'true' OR (row->>'pode_emitir') <> 'true' OR (row->>'bloqueio_emissao') IS NOT NULL THEN
    RAISE EXCEPTION 'C5A_FAIL_24: list read model disposition must match detail (got %)', row;
  END IF;
  RAISE NOTICE 'C5A ok: read models expose readiness (points 23,24,30)';
END
$ready$;

-- ============================================================================
-- Section 5 — exige_aceite=TRUE gates readiness off in both read models
-- (point 25); restoring FALSE restores readiness.
-- ============================================================================
DO $aceite$
DECLARE
  v_order BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_elig');
  det JSONB; lst JSONB; row JSONB;
BEGIN
  UPDATE public.ordem_compra_config SET exige_aceite = TRUE WHERE id = 1;
  det := public.obter_ordem_compra_admin(v_order);
  IF (det#>>'{ordem,acoes,emitir}') <> 'false' OR (det#>>'{ordem,pode_emitir}') <> 'false'
     OR (det#>>'{ordem,bloqueio_emissao}') <> 'emissao_bloqueada_exige_aceite' THEN
    RAISE EXCEPTION 'C5A_FAIL_25a: detail read model must gate emitir off when exige_aceite=TRUE (got %)', det#>'{ordem}';
  END IF;
  lst := public.listar_ordens_compra_admin((SELECT pedido_id::text::uuid FROM public.ordem_compra WHERE id=v_order));
  SELECT e INTO row FROM jsonb_array_elements(lst->'ordens') e WHERE (e->>'ordem_id')::bigint = v_order;
  IF (row#>>'{acoes,emitir}') <> 'false' OR (row->>'bloqueio_emissao') <> 'emissao_bloqueada_exige_aceite' THEN
    RAISE EXCEPTION 'C5A_FAIL_25b: list read model must gate emitir off when exige_aceite=TRUE (got %)', row;
  END IF;
  UPDATE public.ordem_compra_config SET exige_aceite = FALSE WHERE id = 1;
  det := public.obter_ordem_compra_admin(v_order);
  IF (det#>>'{ordem,acoes,emitir}') <> 'true' THEN
    RAISE EXCEPTION 'C5A_FAIL_25c: restoring exige_aceite=FALSE must restore readiness';
  END IF;
  RAISE NOTICE 'C5A ok: exige_aceite gate (point 25)';
END
$aceite$;

-- ============================================================================
-- Section 6 — deterministic emission denials, owner-context (points 13,14,15,16)
-- plus atomic-failure invariance (point 34).
-- ============================================================================
DO $deny$
DECLARE
  v_zero BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_zero');
  v_incomp BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_incomp');
  v_nosup BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_nosup');
  v_cancel BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_cancel');
  r JSONB; v_status_before TEXT; v_status_after TEXT; v_events INT;
BEGIN
  IF (public.emitir_ordem_compra(v_nosup)->>'codigo') <> 'sem_fornecedor' THEN
    RAISE EXCEPTION 'C5A_FAIL_15: missing-supplier emission must be sem_fornecedor';
  END IF;
  IF (public.emitir_ordem_compra(v_zero)->>'codigo') <> 'sem_itens' THEN
    RAISE EXCEPTION 'C5A_FAIL_16: zero-item emission must be sem_itens';
  END IF;
  IF (public.emitir_ordem_compra(v_cancel)->>'codigo') <> 'estado_invalido' THEN
    RAISE EXCEPTION 'C5A_FAIL_13: cancelled/wrong-state emission must be estado_invalido';
  END IF;

  -- Incomplete allocation: reject + prove atomic invariance (point 34).
  SELECT status_administrativo INTO v_status_before FROM public.ordem_compra WHERE id = v_incomp;
  r := public.emitir_ordem_compra(v_incomp);
  IF (r->>'codigo') <> 'alocacao_incompleta' THEN
    RAISE EXCEPTION 'C5A_FAIL_14: incomplete-allocation emission must be alocacao_incompleta (got %)', r;
  END IF;
  SELECT status_administrativo INTO v_status_after FROM public.ordem_compra WHERE id = v_incomp;
  SELECT count(*) INTO v_events FROM public.ordem_compra_eventos WHERE ordem_compra_id = v_incomp AND tipo_evento = 'emitida';
  IF v_status_after <> v_status_before OR v_status_after <> 'rascunho' OR v_events <> 0 THEN
    RAISE EXCEPTION 'C5A_FAIL_34: a rejected emission must leave zero partial mutation (status %/% events %)', v_status_before, v_status_after, v_events;
  END IF;
  RAISE NOTICE 'C5A ok: deterministic denials + atomic invariance (points 13,14,15,16,34)';
END
$deny$;

-- ============================================================================
-- Section 7 — role-scoped denials: authenticated non-admin internal gate
-- (point 10) and anon ACL denial (point 12).
-- ============================================================================
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :nonadmin_uuid, true);
SELECT (public.emitir_ordem_compra(0)->>'codigo') AS nonadmin_code \gset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :admin_uuid, true);
INSERT INTO c5a_ctx(k, v) VALUES ('nonadmin_code', :'nonadmin_code');
DO $g10$
DECLARE
  v_code TEXT := (SELECT v FROM c5a_ctx WHERE k = 'nonadmin_code');
BEGIN
  IF v_code <> 'sem_permissao' THEN
    RAISE EXCEPTION 'C5A_FAIL_10: authenticated non-admin must be denied sem_permissao by the internal gate (got %)', v_code;
  END IF;
  RAISE NOTICE 'C5A ok: authenticated non-admin internal denial (point 10)';
END
$g10$;

SET LOCAL ROLE anon;
DO $g12$
BEGIN
  BEGIN
    PERFORM public.emitir_ordem_compra(0);
    RAISE EXCEPTION 'C5A_FAIL_12: anon must not be able to EXECUTE emitir_ordem_compra';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;  -- expected 42501
  END;
END
$g12$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :admin_uuid, true);

-- ============================================================================
-- Section 8 — authorized emission via the REAL authenticated admin role
-- (points 11,19,20,21,22): success, acceptance init, one audit event,
-- duplicate replay, no fabricated acceptance decision.
-- ============================================================================
SELECT v::bigint AS elig_id FROM c5a_ctx WHERE k='o_elig' \gset
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', :admin_uuid, true);
SELECT public.emitir_ordem_compra(:elig_id)::text AS emit1 \gset
SELECT public.emitir_ordem_compra(:elig_id)::text AS emit2 \gset
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', :admin_uuid, true);
INSERT INTO c5a_ctx(k, v) VALUES ('emit1', :'emit1'), ('emit2', :'emit2');

DO $emit$
DECLARE
  v_elig BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k = 'o_elig');
  e1 JSONB := (SELECT v::jsonb FROM c5a_ctx WHERE k = 'emit1');
  e2 JSONB := (SELECT v::jsonb FROM c5a_ctx WHERE k = 'emit2');
  v_events INT;
  v_status_aceite TEXT;
  v_decided INT;
BEGIN
  -- Point 11: an authenticated admin actually emitted through the granted path.
  IF (e1->>'ok') <> 'true' OR (e1->>'codigo') <> 'ok' OR (e1->>'status_administrativo') <> 'emitida' THEN
    RAISE EXCEPTION 'C5A_FAIL_11: authenticated admin emission must succeed (got %)', e1;
  END IF;
  -- Point 21: acceptance initialized nao_aplicavel under exige_aceite=FALSE.
  IF (e1->>'status_aceite') <> 'nao_aplicavel' THEN
    RAISE EXCEPTION 'C5A_FAIL_21: acceptance must initialize nao_aplicavel when exige_aceite=FALSE (got %)', e1->>'status_aceite';
  END IF;
  -- Point 19: duplicate emission is the deterministic estado_invalido replay.
  IF (e2->>'codigo') <> 'estado_invalido' THEN
    RAISE EXCEPTION 'C5A_FAIL_19: duplicate emission must be estado_invalido (got %)', e2;
  END IF;
  -- Point 20: exactly one administrative emission event.
  SELECT count(*) INTO v_events
    FROM public.ordem_compra_eventos
    WHERE ordem_compra_id = v_elig AND dimensao = 'administrativo' AND tipo_evento = 'emitida';
  IF v_events <> 1 THEN
    RAISE EXCEPTION 'C5A_FAIL_20: emission must write exactly one administrativo/emitida event (got %)', v_events;
  END IF;
  -- Point 22: acceptance stays nao_aplicavel; the emission writer never fabricates
  -- an aceita/rejeitada decision. The emitir body only ever produces pendente or
  -- nao_aplicavel for status_aceite (it contains neither decided literal); the
  -- pendente -> aceita/rejeitada transition is the unbuilt PHASE-C5B capability.
  SELECT status_aceite INTO v_status_aceite FROM public.ordem_compra WHERE id = v_elig;
  IF v_status_aceite <> 'nao_aplicavel' THEN
    RAISE EXCEPTION 'C5A_FAIL_22: no acceptance decision may be fabricated (status_aceite=%)', v_status_aceite;
  END IF;
  SELECT count(*) INTO v_decided
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'emitir_ordem_compra'
      AND (p.prosrc LIKE '%''aceita''%' OR p.prosrc LIKE '%''rejeitada''%');
  IF v_decided <> 0 THEN
    RAISE EXCEPTION 'C5A_FAIL_22: the emission writer must never assign an aceita/rejeitada decision';
  END IF;
  RAISE NOTICE 'C5A ok: authorized emission + acceptance init + audit + duplicate (points 11,19,20,21,22)';
END
$emit$;

-- ============================================================================
-- Section 9 — read models stay inert for every non-eligible state
-- (points 26,27,28,29).
-- ============================================================================
DO $inert$
DECLARE
  v_legacy BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_legacy');
  v_elig BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_elig');     -- now emitida
  v_cancel BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_cancel');
  v_incomp BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_incomp');
  det JSONB;
BEGIN
  det := public.obter_ordem_compra_admin(v_legacy);
  IF (det#>>'{ordem,acoes,emitir}') <> 'false' OR (det#>>'{ordem,pode_emitir}') <> 'false' THEN
    RAISE EXCEPTION 'C5A_FAIL_26: legacy order must expose emitir=false';
  END IF;
  det := public.obter_ordem_compra_admin(v_elig);
  IF (det#>>'{ordem,status_administrativo}') <> 'emitida' OR (det#>>'{ordem,acoes,emitir}') <> 'false' OR (det#>>'{ordem,pode_emitir}') <> 'false' THEN
    RAISE EXCEPTION 'C5A_FAIL_27: emitted order must expose emitir=false';
  END IF;
  det := public.obter_ordem_compra_admin(v_cancel);
  IF (det#>>'{ordem,acoes,emitir}') <> 'false' OR (det#>>'{ordem,pode_emitir}') <> 'false' THEN
    RAISE EXCEPTION 'C5A_FAIL_28: cancelled order must expose emitir=false';
  END IF;
  det := public.obter_ordem_compra_admin(v_incomp);
  IF (det#>>'{ordem,acoes,emitir}') <> 'false' OR (det#>>'{ordem,pode_emitir}') <> 'false'
     OR (det#>>'{ordem,bloqueio_emissao}') <> 'distribuicao_necessidades_pendente' THEN
    RAISE EXCEPTION 'C5A_FAIL_29: incomplete order must expose emitir=false / distribuicao_necessidades_pendente (got %)', det#>'{ordem}';
  END IF;
  RAISE NOTICE 'C5A ok: read models inert for legacy/emitted/cancelled/incomplete (points 26,27,28,29)';
END
$inert$;

-- ============================================================================
-- Section 10 — receipt writers unchanged (point 30) and audit preserved
-- (point 35): db/77 performs no receipt/event DML.
-- ============================================================================
DO $receipt$
DECLARE
  v_elig BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_elig');
  v_events INT;
BEGIN
  IF NOT has_function_privilege('authenticated', 'public.registrar_recebimento_ordem_compra(bigint,text,timestamptz,text,text,text,jsonb)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.registrar_recebimento_ordem_compra(bigint,text,timestamptz,text,text,text,jsonb)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.registrar_recebimento_ordem_compra(bigint,text,timestamptz,text,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_30: receipt writer ACL must be unchanged (authenticated-only)';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.estornar_recebimento_ordem_compra(bigint,text,timestamptz,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'C5A_FAIL_30: reversal writer ACL must be unchanged (authenticated)';
  END IF;
  -- The only administrativo/emitida event that exists is the one this test wrote
  -- (the corpus seeds none); db/77 deletes/alters no event.
  SELECT count(*) INTO v_events FROM public.ordem_compra_eventos WHERE ordem_compra_id = v_elig;
  IF v_events < 1 THEN
    RAISE EXCEPTION 'C5A_FAIL_35: the emission audit event must be preserved and readable';
  END IF;
  RAISE NOTICE 'C5A ok: receipt writers unchanged + audit preserved (points 30,35)';
END
$receipt$;

-- ============================================================================
-- Section 11 — cutover fence: legacy_active permits, maintenance_fenced and
-- canonical_active deny protected DML (points 31,32,33). The guard is NOT
-- modified by C5A; C5A local readiness is NOT REAL_CUTOVER readiness.
-- ============================================================================
DO $fence$
DECLARE
  v_legacy BIGINT := (SELECT v::bigint FROM c5a_ctx WHERE k='o_legacy');
  v_denied BOOLEAN;
BEGIN
  -- maintenance_fenced denies a depth-1 protected UPDATE.
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.ordem_compra_cutover SET status = 'maintenance_fenced' WHERE id = 1;
  PERFORM set_config('session_replication_role', 'origin', true);
  v_denied := FALSE;
  BEGIN
    UPDATE public.ordem_compra SET status_administrativo = 'cancelada' WHERE id = v_legacy;
  EXCEPTION WHEN sqlstate '55000' THEN v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'C5A_FAIL_32: maintenance_fenced must deny protected DML (55000)'; END IF;

  -- canonical_active denies protected DML too.
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.ordem_compra_cutover
    SET status = 'canonical_active', read_authority = 'canonical', reconciliation_status = 'reconciled',
        final_acl_closed_at = now(), canonical_activated_at = now()
    WHERE id = 1;
  PERFORM set_config('session_replication_role', 'origin', true);
  v_denied := FALSE;
  BEGIN
    UPDATE public.ordem_compra SET status_administrativo = 'cancelada' WHERE id = v_legacy;
  EXCEPTION WHEN sqlstate '55000' THEN v_denied := TRUE;
  END;
  IF NOT v_denied THEN RAISE EXCEPTION 'C5A_FAIL_33: canonical_active must deny protected DML (55000)'; END IF;

  -- Restore legacy_active (permits) — the state the whole test ran under (31).
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.ordem_compra_cutover
    SET status = 'legacy_active', read_authority = 'flat', reconciliation_status = 'not_started',
        final_acl_closed_at = NULL, canonical_activated_at = NULL
    WHERE id = 1;
  PERFORM set_config('session_replication_role', 'origin', true);
  IF (SELECT status FROM public.ordem_compra_cutover WHERE id = 1) <> 'legacy_active' THEN
    RAISE EXCEPTION 'C5A_FAIL_31: legacy_active must be restorable (permits path)';
  END IF;
  RAISE NOTICE 'C5A ok: cutover fence legacy_active permits / fenced+canonical deny (points 31,32,33)';
END
$fence$;

SELECT 'C5A_EMISSION_READINESS_INTEGRATION_PASS' AS result;

ROLLBACK;
