-- tests/ordem-compra-c3d-acl.integration.sql
--
-- PHASE-C3D-D — Effective ACL and role-matrix rehearsal (OC-C3D-ACL-001).
-- Governing contract: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md
--   (§A objective; §C C3D-D row; §G test matrix). Normative ACL anchor:
--   docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md §13.15.2 (principal x
--   category effective post-closure authority); the concrete per-object
--   closure is db/75 public.ordem_compra_c3c_close_final_acl(BIGINT).
--
-- WHAT THIS PROVES, WITHOUT EVER INVOKING THE REAL CLOSURE:
--   * the installed ordem_compra_c3c_close_final_acl(BIGINT) body embeds the
--     exact 14-table protected list, the exact table/column/sequence REVOKEs,
--     and the exact PUBLIC-policy drop loop (empirical pg_get_functiondef proof);
--   * the closure's ACL effects, reproduced MANUALLY and EXACTLY inside one
--     rolled-back transaction, remove all direct table/column/sequence authority
--     from PUBLIC/anon/authenticated/service_role on the flat receipt table and
--     the cutover/receipt/ledger/movement tables, drop every PUBLIC-targeted
--     policy on the 14 protected tables, and leave the canonical order-structure
--     tables' grants/policies BYTE-IDENTICAL (canonical read authority retained,
--     not silently removed — §13.15.2 / task Section A);
--   * every owner-only ordem_compra_c3c_* command stays postgres-owned with no
--     EXECUTE for PUBLIC/anon/authenticated/service_role; Component A/B keep
--     authenticated EXECUTE and deny PUBLIC/anon/service_role; no SECURITY
--     DEFINER search_path/owner changes during the simulation;
--   * a TEST-ONLY canonical_active role-matrix fixture drives Component A and
--     Component B across the full eight-actor matrix (postgres owner, PUBLIC,
--     anon, authenticated admin / matching supplier / non-matching supplier /
--     without-supplier, service_role) with no productive receipt and PONR NULL;
--   * ROLLBACK restores the exact pre-simulation catalog + business state.
--
-- The real closure command public.ordem_compra_c3c_close_final_acl(BIGINT) is
-- NEVER invoked; final_acl_closed_at is proven NULL throughout the simulation;
-- public.ordem_compra_c3c_activate is never called; no productive receipt ever
-- commits (all Component B writes run on rolled-back savepoints).
--
-- ENVIRONMENT: local disposable PostgreSQL 18.4 only, against the full applied
-- db/01..db/76 schema ALREADY carrying the classification-shape-only synthetic
-- 64-row ordens_compra_fio corpus (27 Class A / 12 Class B / 13 Class C /
-- 12 Class D; 51 mapped) loaded before db/67, and the reserved synthetic
-- fornecedor/target/cutover identities. The corpus/migration sequencing and the
-- Supabase-platform preamble are out of this file's scope (they must exist
-- before db/67, which is before this file can connect to a schema that has these
-- objects) — this file creates only its four synthetic actor identities and one
-- clientes row. Never connects to a remote or shared host; contains no
-- credential, token, or project URL.
--
-- Run: psql -X -v ON_ERROR_STOP=1 -f tests/ordem-compra-c3d-acl.integration.sql
--
-- Reserved synthetic identities (PHASE-C3D-D order):
--   ADMIN UUID                      00000000-0000-4000-8000-00000000c3a1
--   MATCHING SUPPLIER UUID          00000000-0000-4000-8000-00000000c3b1
--   NON-MATCHING SUPPLIER UUID      00000000-0000-4000-8000-00000000c3b2
--   AUTHENTICATED WITHOUT SUPPLIER  00000000-0000-4000-8000-00000000c3b3 (tipo=cliente)
--   MATCHING FORNECEDOR ID          930000301
--   NON-MATCHING FORNECEDOR ID      930000302
--   TARGET FLAT ROW ID              930000311 (Class B, fornecedor 930000301, kg_pedido 15.500, mapped)
--   CUTOVER GENERATION              930004001

\set ON_ERROR_STOP on
\timing off

\set admin_uuid '''00000000-0000-4000-8000-00000000c3a1'''
\set msup_uuid  '''00000000-0000-4000-8000-00000000c3b1'''
\set nsup_uuid  '''00000000-0000-4000-8000-00000000c3b2'''
\set nosup_uuid '''00000000-0000-4000-8000-00000000c3b3'''

-- ===========================================================================
-- 0. Fixtures: four synthetic actor identities + one clientes row (needed only
--    so the without-supplier identity is a schema-valid active 'cliente'). All
--    planted under session_replication_role=replica in autocommit so they
--    outlive every later transaction in this file. No business/protected row is
--    created or mutated here.
-- ===========================================================================
SET session_replication_role = replica;

INSERT INTO auth.users(id, email) VALUES
  (:admin_uuid, 'c3dd-admin@example.invalid'),
  (:msup_uuid,  'c3dd-msup@example.invalid'),
  (:nsup_uuid,  'c3dd-nsup@example.invalid'),
  (:nosup_uuid, 'c3dd-nosup@example.invalid');

-- The without-supplier actor must be a schema-valid, active user classification
-- that is neither admin nor fornecedor with fornecedor_id NULL. The installed
-- domain (db/14 usuarios_tipo_check / usuarios_vinculo_exclusivo_check) is
-- admin|fornecedor|cliente, and 'cliente' requires cliente_id NOT NULL, so the
-- canonical without-supplier classification is tipo='cliente' bound to a clientes
-- row. EXACT VALUE USED: tipo='cliente', ativo=TRUE, fornecedor_id=NULL,
-- cliente_id=930000301.
INSERT INTO public.clientes(id, nome) VALUES (930000301, 'C3D-D ACL SYNTHETIC CLIENT')
  ON CONFLICT DO NOTHING;

INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, cliente_id, ativo, nivel_acesso) VALUES
  (:admin_uuid, 'c3dd-admin@example.invalid', 'C3D-D Admin',        'admin',      NULL,      NULL,      TRUE, 'completo'),
  (:msup_uuid,  'c3dd-msup@example.invalid',  'C3D-D MatchSupplier','fornecedor', 930000301, NULL,      TRUE, 'completo'),
  (:nsup_uuid,  'c3dd-nsup@example.invalid',  'C3D-D NonMatchSup',  'fornecedor', 930000302, NULL,      TRUE, 'completo'),
  (:nosup_uuid, 'c3dd-nosup@example.invalid', 'C3D-D NoSupplier',   'cliente',    NULL,      930000301, TRUE, 'completo');

SET session_replication_role = origin;

DO $fx$
DECLARE v_forn BIGINT;
BEGIN
  -- Corpus preconditions.
  IF (SELECT count(*) FROM public.ordem_compra_item_compat_fio WHERE ordens_compra_fio_id = 930000311) <> 1 THEN
    RAISE EXCEPTION 'FAIL[0/corpus]: target flat row 930000311 is not one of the mapped rows';
  END IF;
  SELECT oc.fornecedor_id INTO v_forn
  FROM public.ordem_compra_item_compat_fio c
  JOIN public.ordem_compra_item i ON i.id = c.ordem_compra_item_id
  JOIN public.ordem_compra oc ON oc.id = i.ordem_id
  WHERE c.ordens_compra_fio_id = 930000311;
  IF v_forn <> 930000301 THEN
    RAISE EXCEPTION 'FAIL[0/corpus]: target order fornecedor_id=% (expected 930000301)', v_forn;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_item_compat_fio c
    JOIN public.ordem_compra_item i ON i.id = c.ordem_compra_item_id
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    WHERE c.ordens_compra_fio_id = 930000312 AND oc.fornecedor_id = 930000302
  ) THEN
    RAISE EXCEPTION 'FAIL[0/corpus]: non-matching-only order 930000312 (fornecedor 930000302) missing';
  END IF;
  IF NOT public.is_admin() IS NOT NULL THEN RAISE EXCEPTION 'FAIL[0/setup]: is_admin unavailable'; END IF;
  RAISE NOTICE 'PASS[0]: four synthetic identities planted (admin c3a1, matching supplier c3b1/930000301, non-matching supplier c3b2/930000302, without-supplier c3b3=cliente); target order 930000311 owned by 930000301; order 930000312 owned by 930000302';
END
$fx$;

-- ===========================================================================
-- 1. Deterministic protected-object inventories (14 tables / 7 sequences /
--    11 targeted columns). Populated into session TEMP tables so every later
--    section iterates the exact same authoritative sets.
-- ===========================================================================
CREATE TEMP TABLE c3dd_tables (ord INT PRIMARY KEY, name TEXT UNIQUE, grant_revoked BOOLEAN);
INSERT INTO c3dd_tables VALUES
  ( 1, 'ordens_compra_fio',                       TRUE),
  ( 2, 'necessidade_compra_fio',                  FALSE),
  ( 3, 'ordem_compra_item_compat_fio',            FALSE),
  ( 4, 'ordem_compra_item_alocacao',              FALSE),
  ( 5, 'ordem_compra_item',                       FALSE),
  ( 6, 'ordem_compra',                            FALSE),
  ( 7, 'saldo_fios',                              FALSE),
  ( 8, 'saldo_fios_op',                           FALSE),
  ( 9, 'ordem_compra_recebimentos',               TRUE),
  (10, 'ordem_compra_fio_lancamentos',            TRUE),
  (11, 'ordem_compra_fio_movimentos_estoque',     TRUE),
  (12, 'ordem_compra_cutover',                    TRUE),
  (13, 'ordem_compra_cutover_source_snapshot',    TRUE),
  (14, 'ordem_compra_cutover_inventory_baseline', TRUE);

CREATE TEMP TABLE c3dd_seqs (ord INT PRIMARY KEY, name TEXT UNIQUE);
INSERT INTO c3dd_seqs VALUES
  (1, 'ordens_compra_fio_id_seq'),
  (2, 'ordem_compra_recebimentos_id_seq'),
  (3, 'ordem_compra_fio_lancamentos_id_seq'),
  (4, 'ordem_compra_fio_movimentos_estoque_id_seq'),
  (5, 'ordem_compra_cutover_id_seq'),
  (6, 'ordem_compra_cutover_source_snapshot_id_seq'),
  (7, 'ordem_compra_cutover_inventory_baseline_id_seq');

CREATE TEMP TABLE c3dd_cols (ord INT PRIMARY KEY, name TEXT UNIQUE);
INSERT INTO c3dd_cols VALUES
  (1,'op_id'),(2,'fornecedor_id'),(3,'tipo'),(4,'cor_id'),(5,'cor_poliester'),
  (6,'kg_pedido'),(7,'kg_recebido'),(8,'data_recebimento'),(9,'status'),
  (10,'status_administrativo'),(11,'status_recebimento');

DO $inv$
DECLARE r RECORD; v_missing TEXT := '';
BEGIN
  FOR r IN SELECT name FROM c3dd_tables LOOP
    IF to_regclass('public.'||r.name) IS NULL THEN v_missing := v_missing||' table:'||r.name; END IF;
  END LOOP;
  FOR r IN SELECT name FROM c3dd_seqs LOOP
    IF to_regclass('public.'||r.name) IS NULL THEN v_missing := v_missing||' seq:'||r.name; END IF;
  END LOOP;
  FOR r IN SELECT name FROM c3dd_cols LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.ordens_compra_fio'::regclass
                     AND attname=r.name AND attnum>0 AND NOT attisdropped) THEN
      v_missing := v_missing||' col:'||r.name;
    END IF;
  END LOOP;
  IF v_missing <> '' THEN RAISE EXCEPTION 'FAIL[1/inventory]: missing protected objects:%', v_missing; END IF;
  RAISE NOTICE 'PASS[1]: protected inventory present — 14 tables, 7 sequences, 11 ordens_compra_fio columns';
END
$inv$;

-- ===========================================================================
-- 2. Function inventory + empirical proof that the installed
--    ordem_compra_c3c_close_final_acl(BIGINT) body embeds EXACTLY db/75's
--    14-table protected list, table/column/sequence REVOKEs, and PUBLIC-policy
--    drop loop (pg_get_functiondef catalog proof, not a source-file compare).
-- ===========================================================================
CREATE TEMP TABLE c3dd_funcs (
  signature TEXT PRIMARY KEY, owner TEXT, secdef BOOLEAN, search_path TEXT,
  x_public BOOLEAN, x_anon BOOLEAN, x_authenticated BOOLEAN, x_service_role BOOLEAN, owner_only BOOLEAN);
INSERT INTO c3dd_funcs
SELECT p.oid::regprocedure::text,
       po.rolname,
       p.prosecdef,
       COALESCE(array_to_string(p.proconfig, ','), ''),
       has_function_privilege('public',        p.oid, 'EXECUTE'),
       has_function_privilege('anon',          p.oid, 'EXECUTE'),
       has_function_privilege('authenticated', p.oid, 'EXECUTE'),
       has_function_privilege('service_role',  p.oid, 'EXECUTE'),
       (p.proname LIKE 'ordem_compra_c3c_%'
        OR p.proname IN ('trg_c3c_protected_mutation_guard','trg_c3c_command_state_guard')) AS owner_only
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace AND n.nspname = 'public'
JOIN pg_roles po ON po.oid = p.proowner
WHERE p.proname LIKE 'ordem_compra_c3c_%'
   OR p.proname IN ('trg_c3c_protected_mutation_guard','trg_c3c_command_state_guard',
        'listar_ordens_compra_fio_compat','registrar_recebimento_ordem_compra_fio_compat',
        'registrar_recebimento_ordem_compra','estornar_recebimento_ordem_compra',
        'listar_recebimentos_ordem_compra_normalizados');

DO $fninv$
DECLARE v_n INT; v_bad TEXT := '';
BEGIN
  SELECT count(*) INTO v_n FROM c3dd_funcs;
  IF v_n < 20 THEN RAISE EXCEPTION 'FAIL[2/inventory]: function inventory unexpectedly small (%)', v_n; END IF;
  -- Every owner-only C3C command/guard must be postgres-owned, empty search_path,
  -- and expose EXECUTE to nobody.
  FOR v_bad IN
    SELECT signature FROM c3dd_funcs
    WHERE owner_only AND (owner <> 'postgres' OR search_path NOT IN ('search_path=', 'search_path=""') OR x_public OR x_anon OR x_authenticated OR x_service_role)
  LOOP
    RAISE EXCEPTION 'FAIL[2/inventory]: owner-only function % is not postgres/empty-search_path/no-EXECUTE', v_bad;
  END LOOP;
  -- Component A/B and the canonical receipt/reversal/history RPCs must keep an
  -- authenticated-only EXECUTE (owner postgres, empty search_path).
  FOR v_bad IN
    SELECT signature FROM c3dd_funcs
    WHERE signature LIKE 'listar_ordens_compra_fio_compat(%'
       OR signature LIKE 'registrar_recebimento_ordem_compra_fio_compat(%'
       OR signature LIKE 'registrar_recebimento_ordem_compra(%'
       OR signature LIKE 'estornar_recebimento_ordem_compra(%'
       OR signature LIKE 'listar_recebimentos_ordem_compra_normalizados(%'
  LOOP
    IF (SELECT NOT x_authenticated OR x_public OR x_anon OR x_service_role OR owner <> 'postgres' OR search_path NOT IN ('search_path=', 'search_path=""')
        FROM c3dd_funcs WHERE signature = v_bad) THEN
      RAISE EXCEPTION 'FAIL[2/inventory]: RPC % is not authenticated-only EXECUTE / postgres / empty search_path', v_bad;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS[2/inventory]: % catalogued functions; every owner-only ordem_compra_c3c_* command + both guards are postgres-owned, empty search_path, no EXECUTE; Component A/B + canonical receipt/reversal/history RPCs are authenticated-only EXECUTE', v_n;
END
$fninv$;

DO $defmatch$
DECLARE v_def TEXT; v_norm TEXT;
BEGIN
  SELECT pg_get_functiondef('public.ordem_compra_c3c_close_final_acl(bigint)'::regprocedure) INTO v_def;
  IF v_def IS NULL THEN RAISE EXCEPTION 'FAIL[2/def]: close_final_acl definition not found'; END IF;
  v_norm := regexp_replace(v_def, '\s+', ' ', 'g');

  -- Exact 14-table protected array membership.
  IF v_norm NOT LIKE '%''ordens_compra_fio'', ''necessidade_compra_fio'', ''ordem_compra_item_compat_fio'', ''ordem_compra_item_alocacao'', ''ordem_compra_item'', ''ordem_compra'', ''saldo_fios'', ''saldo_fios_op'', ''ordem_compra_recebimentos'', ''ordem_compra_fio_lancamentos'', ''ordem_compra_fio_movimentos_estoque'', ''ordem_compra_cutover'', ''ordem_compra_cutover_source_snapshot'', ''ordem_compra_cutover_inventory_baseline''%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the exact 14-table protected list';
  END IF;
  -- Exact ordens_compra_fio table revoke.
  IF v_norm NOT LIKE '%REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.ordens_compra_fio FROM PUBLIC, anon, authenticated, service_role;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the exact ordens_compra_fio table revoke';
  END IF;
  -- Exact 11-column UPDATE revoke.
  IF v_norm NOT LIKE '%REVOKE UPDATE(op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido, data_recebimento, status, status_administrativo, status_recebimento) ON TABLE public.ordens_compra_fio FROM PUBLIC, anon, authenticated, service_role;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the exact 11-column UPDATE revoke';
  END IF;
  -- Exact ordens_compra_fio_id_seq revoke.
  IF v_norm NOT LIKE '%REVOKE ALL ON SEQUENCE public.ordens_compra_fio_id_seq FROM PUBLIC, anon, authenticated, service_role;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the ordens_compra_fio_id_seq revoke';
  END IF;
  -- Exact six-table REVOKE ALL.
  IF v_norm NOT LIKE '%REVOKE ALL ON TABLE public.ordem_compra_recebimentos, public.ordem_compra_fio_lancamentos, public.ordem_compra_fio_movimentos_estoque, public.ordem_compra_cutover, public.ordem_compra_cutover_source_snapshot, public.ordem_compra_cutover_inventory_baseline FROM PUBLIC, anon, authenticated, service_role;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the exact six-table REVOKE ALL';
  END IF;
  -- Exact six-sequence REVOKE ALL.
  IF v_norm NOT LIKE '%REVOKE ALL ON SEQUENCE public.ordem_compra_recebimentos_id_seq, public.ordem_compra_fio_lancamentos_id_seq, public.ordem_compra_fio_movimentos_estoque_id_seq, public.ordem_compra_cutover_id_seq, public.ordem_compra_cutover_source_snapshot_id_seq, public.ordem_compra_cutover_inventory_baseline_id_seq FROM PUBLIC, anon, authenticated, service_role;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the exact six-sequence REVOKE ALL';
  END IF;
  -- Exact PUBLIC-policy drop loop predicate + DROP POLICY.
  IF v_norm NOT LIKE '%0::oid = ANY (p.polroles)%' OR v_norm NOT LIKE '%DROP POLICY %I ON %I.%I%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not embed the PUBLIC-policy drop loop';
  END IF;
  -- And it sets final_acl_closed_at (the one effect the simulation must NOT perform).
  IF v_norm NOT LIKE '%UPDATE public.ordem_compra_cutover SET final_acl_closed_at = clock_timestamp() WHERE id = 1;%' THEN
    RAISE EXCEPTION 'FAIL[2/def]: installed close_final_acl does not set final_acl_closed_at (structure changed)';
  END IF;
  RAISE NOTICE 'PASS[2/def]: installed ordem_compra_c3c_close_final_acl(bigint) embeds the exact db/75 14-table list, ordens_compra_fio 7-privilege + 11-column revokes, its own sequence revoke, the six-table/six-sequence REVOKE ALL, and the 0::oid=ANY(polroles) PUBLIC-policy drop loop';
END
$defmatch$;

-- ===========================================================================
-- 3. Fingerprint helpers + pre-simulation capture. Deterministic full-content
--    fingerprints for: table/sequence ACLs, ordens_compra_fio column ACLs,
--    function ACLs + owner/security/search-path metadata, and every RLS policy
--    on the 14 protected tables (pg_temp.c3dd_fp_of / _fp_all); plus a full
--    business fingerprint of the eleven receipt/ledger/movement/business tables
--    (pg_temp.c3dd_fp_business) and the cutover singleton. Created in autocommit
--    so they survive the rolled-back simulation transaction below.
-- ===========================================================================
-- Grants-only (relacl) fingerprint for a given set of tables. Used to prove the
-- retained canonical tables keep their direct GRANTs (the closure revokes no
-- grant on them); their PUBLIC-targeted policies are legitimately dropped by the
-- closure on all 14 tables and are covered by the non-PUBLIC-policy check below.
CREATE FUNCTION pg_temp.c3dd_fp_of(p_tables TEXT[]) RETURNS TEXT LANGUAGE sql STABLE AS $fp$
  SELECT md5(COALESCE(string_agg(line, E'\n' ORDER BY line), '')) FROM (
    SELECT 'relacl:'||c.relname||':'||COALESCE(r.rolname,'PUBLIC')||':'||a.privilege_type AS line
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public',
         LATERAL aclexplode(c.relacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee
    WHERE c.relname = ANY(p_tables)
  ) s
$fp$;

-- Non-PUBLIC RLS-policy fingerprint across the 14 protected tables. The closure
-- drops ONLY policies whose polroles contain PUBLIC (0); every non-PUBLIC policy
-- must be byte-identical before and after (canonical RLS read authority retained).
CREATE FUNCTION pg_temp.c3dd_fp_nonpub_pol() RETURNS TEXT LANGUAGE sql STABLE AS $fp$
  SELECT md5(COALESCE(string_agg(line, E'\n' ORDER BY line), '')) FROM (
    SELECT c.relname||':'||pol.polname||':'||pol.polcmd::text||':'||
           COALESCE(pg_get_expr(pol.polqual,pol.polrelid),'')||':'||
           COALESCE(pg_get_expr(pol.polwithcheck,pol.polrelid),'') AS line
    FROM pg_policy pol JOIN pg_class c ON c.oid=pol.polrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
    WHERE c.relname IN (SELECT name FROM c3dd_tables) AND NOT (0::oid = ANY (pol.polroles))
  ) s
$fp$;

CREATE FUNCTION pg_temp.c3dd_fp_all() RETURNS TEXT LANGUAGE sql STABLE AS $fp$
  SELECT md5(string_agg(line, E'\n' ORDER BY line)) FROM (
    -- table + sequence ACLs (14 tables + 7 sequences)
    SELECT 'relacl:'||c.relname||':'||COALESCE(r.rolname,'PUBLIC')||':'||a.privilege_type AS line
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public',
         LATERAL aclexplode(c.relacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee
    WHERE c.relname IN (SELECT name FROM c3dd_tables) OR c.relname IN (SELECT name FROM c3dd_seqs)
    UNION ALL
    -- ordens_compra_fio column ACLs
    SELECT 'attacl:'||att.attname||':'||COALESCE(r.rolname,'PUBLIC')||':'||a.privilege_type
    FROM pg_attribute att, LATERAL aclexplode(att.attacl) a LEFT JOIN pg_roles r ON r.oid=a.grantee
    WHERE att.attrelid='public.ordens_compra_fio'::regclass AND att.attnum>0 AND NOT att.attisdropped
    UNION ALL
    -- function ACLs + owner/security/search-path metadata
    SELECT 'func:'||p.oid::regprocedure::text||':owner='||po.rolname||':secdef='||p.prosecdef
           ||':cfg='||COALESCE(array_to_string(p.proconfig,','),'')
           ||':grant='||COALESCE(r.rolname,'PUBLIC')||':'||a.privilege_type
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace AND n.nspname='public'
    JOIN pg_roles po ON po.oid=p.proowner
    LEFT JOIN LATERAL aclexplode(p.proacl) a ON TRUE LEFT JOIN pg_roles r ON r.oid=a.grantee
    WHERE p.proname LIKE 'ordem_compra_c3c_%'
       OR p.proname IN ('trg_c3c_protected_mutation_guard','trg_c3c_command_state_guard',
            'listar_ordens_compra_fio_compat','registrar_recebimento_ordem_compra_fio_compat',
            'registrar_recebimento_ordem_compra','estornar_recebimento_ordem_compra',
            'listar_recebimentos_ordem_compra_normalizados')
    UNION ALL
    -- every RLS policy on the 14 protected tables
    SELECT 'pol:'||c.relname||':'||pol.polname||':'||pol.polcmd::text||':roles='||
           COALESCE((SELECT string_agg(COALESCE(rr.rolname,'PUBLIC'),',' ORDER BY 1)
                     FROM unnest(pol.polroles) gr LEFT JOIN pg_roles rr ON rr.oid=gr),'')||':'||
           COALESCE(pg_get_expr(pol.polqual,pol.polrelid),'')||':'||
           COALESCE(pg_get_expr(pol.polwithcheck,pol.polrelid),'')
    FROM pg_policy pol JOIN pg_class c ON c.oid=pol.polrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
    WHERE c.relname IN (SELECT name FROM c3dd_tables)
  ) s
$fp$;

CREATE FUNCTION pg_temp.c3dd_fp_business() RETURNS TEXT LANGUAGE sql STABLE AS $fp$
  SELECT string_agg(f, E'\n' ORDER BY f) FROM (
    SELECT 'ordens_compra_fio=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') AS f FROM public.ordens_compra_fio t
    UNION ALL SELECT 'ordem_compra=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra t
    UNION ALL SELECT 'ordem_compra_item=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_item t
    UNION ALL SELECT 'alocacao=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_item_alocacao t
    UNION ALL SELECT 'compat_fio=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_item_compat_fio t
    UNION ALL SELECT 'necessidade=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.necessidade_compra_fio t
    UNION ALL SELECT 'saldo_fios=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.cor_id, t.cor_poliester, t.tipo)), 'EMPTY') FROM public.saldo_fios t
    UNION ALL SELECT 'saldo_fios_op=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.saldo_fios_op t
    UNION ALL SELECT 'recebimentos=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_recebimentos t
    UNION ALL SELECT 'lancamentos=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_fio_lancamentos t
    UNION ALL SELECT 'movimentos=' || COALESCE(md5(string_agg(t::text, E'\n' ORDER BY t.id)), 'EMPTY') FROM public.ordem_compra_fio_movimentos_estoque t
  ) s
$fp$;

CREATE TEMP TABLE c3dd_capture (label TEXT PRIMARY KEY, fp_all TEXT, fp_retained TEXT, fp_nonpub_pol TEXT, fp_business TEXT, cutover_md5 TEXT, acl_closed TEXT);
INSERT INTO c3dd_capture
SELECT 'pre_sim',
       pg_temp.c3dd_fp_all(),
       pg_temp.c3dd_fp_of(ARRAY(SELECT name FROM c3dd_tables WHERE NOT grant_revoked)),
       pg_temp.c3dd_fp_nonpub_pol(),
       pg_temp.c3dd_fp_business(),
       (SELECT md5(c::text) FROM public.ordem_compra_cutover c WHERE c.id=1),
       (SELECT COALESCE(final_acl_closed_at::text,'NULL') FROM public.ordem_compra_cutover WHERE id=1);

DO $precap$
DECLARE v_locks INT;
BEGIN
  SELECT count(*) INTO v_locks FROM pg_locks WHERE locktype='advisory' AND pid=pg_backend_pid();
  IF v_locks <> 0 THEN RAISE EXCEPTION 'FAIL[3/pre]: % advisory lock(s) held before simulation', v_locks; END IF;
  IF (SELECT acl_closed FROM c3dd_capture WHERE label='pre_sim') <> 'NULL' THEN
    RAISE EXCEPTION 'FAIL[3/pre]: final_acl_closed_at is not NULL at entry';
  END IF;
  RAISE NOTICE 'PASS[3/pre]: pre-simulation ACL/policy/function + business fingerprints captured; final_acl_closed_at NULL; zero advisory locks';
END
$precap$;

-- ===========================================================================
-- 4. SIMULATED CLOSURE — reproduce db/75 close_final_acl's ACL effects EXACTLY
--    inside ONE explicit transaction, WITHOUT invoking close_final_acl, without
--    setting final_acl_closed_at, without activate/import/commit. ROLLBACK at
--    the end restores the exact pre-simulation catalog.
-- ===========================================================================
BEGIN;

-- 4.1 final_acl_closed_at NULL at the start of the simulation.
DO $s_start$
BEGIN
  IF (SELECT final_acl_closed_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[4/start]: final_acl_closed_at is not NULL at simulation start';
  END IF;
  RAISE NOTICE 'PASS[4/start]: final_acl_closed_at NULL at simulation start; close_final_acl NOT invoked';
END
$s_start$;

-- 4.2 Manual, exact reproduction of the closure ACL effects (mirrors db/75
--     ordem_compra_c3c_close_final_acl body lines revokes + PUBLIC-policy loop).
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.ordens_compra_fio FROM PUBLIC, anon, authenticated, service_role;
REVOKE UPDATE(op_id, fornecedor_id, tipo, cor_id, cor_poliester, kg_pedido,
  kg_recebido, data_recebimento, status, status_administrativo,
  status_recebimento) ON TABLE public.ordens_compra_fio
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.ordens_compra_fio_id_seq FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.ordem_compra_recebimentos,
  public.ordem_compra_fio_lancamentos,
  public.ordem_compra_fio_movimentos_estoque,
  public.ordem_compra_cutover,
  public.ordem_compra_cutover_source_snapshot,
  public.ordem_compra_cutover_inventory_baseline
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON SEQUENCE public.ordem_compra_recebimentos_id_seq,
  public.ordem_compra_fio_lancamentos_id_seq,
  public.ordem_compra_fio_movimentos_estoque_id_seq,
  public.ordem_compra_cutover_id_seq,
  public.ordem_compra_cutover_source_snapshot_id_seq,
  public.ordem_compra_cutover_inventory_baseline_id_seq
  FROM PUBLIC, anon, authenticated, service_role;

DO $droppol$
DECLARE r RECORD; v_dropped INT := 0;
BEGIN
  FOR r IN
    SELECT n.nspname, c.relname, p.polname
    FROM pg_catalog.pg_policy p
    JOIN pg_catalog.pg_class c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND 0::oid = ANY (p.polroles)
      AND c.relname IN (SELECT name FROM c3dd_tables)
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.polname, r.nspname, r.relname);
    v_dropped := v_dropped + 1;
  END LOOP;
  RAISE NOTICE 'PASS[4/simulate]: reproduced exact table/column/sequence revokes and dropped % PUBLIC-targeted policy(ies) on the 14 protected tables (close_final_acl NOT invoked)', v_dropped;
END
$droppol$;

-- 4.3 EFFECTIVE POST-CLOSURE TABLE MATRIX.
DO $mtx_tables$
DECLARE r RECORD; p TEXT; v_role TEXT;
  v_privs TEXT[] := ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'];
  v_roles TEXT[] := ARRAY['public','anon','authenticated','service_role'];
BEGIN
  -- Grant-revoked tables: every principal has zero of the seven privileges.
  FOR r IN SELECT name FROM c3dd_tables WHERE grant_revoked ORDER BY ord LOOP
    FOREACH v_role IN ARRAY v_roles LOOP
      FOREACH p IN ARRAY v_privs LOOP
        IF has_table_privilege(v_role, 'public.'||r.name, p) THEN
          RAISE EXCEPTION 'FAIL[4/tables]: % retains % on % after simulation', v_role, p, r.name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  -- Retained canonical tables: direct GRANTs BYTE-IDENTICAL to pre-simulation
  -- (the closure revokes no grant on them — canonical direct-read authority not
  -- silently removed; §13.15.2 / task Section A). Their PUBLIC-targeted policies
  -- are legitimately dropped on all 14 tables and are proven separately (4.6).
  IF pg_temp.c3dd_fp_of(ARRAY(SELECT name FROM c3dd_tables WHERE NOT grant_revoked))
     IS DISTINCT FROM (SELECT fp_retained FROM c3dd_capture WHERE label='pre_sim') THEN
    RAISE EXCEPTION 'FAIL[4/tables]: a retained canonical table GRANT changed during simulation (silent canonical-read removal)';
  END IF;
  RAISE NOTICE 'PASS[4/tables]: 7 grant-revoked protected tables expose zero SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER to public/anon/authenticated/service_role; 7 retained canonical tables'' direct grants byte-identical (canonical direct-read authority preserved)';
END
$mtx_tables$;

-- 4.4 EFFECTIVE POST-CLOSURE COLUMN MATRIX (11 ordens_compra_fio columns).
DO $mtx_cols$
DECLARE c RECORD; v_role TEXT; v_roles TEXT[] := ARRAY['public','anon','authenticated','service_role'];
BEGIN
  FOREACH v_role IN ARRAY v_roles LOOP
    -- No table-level UPDATE that would make the column revoke ineffective.
    IF has_table_privilege(v_role, 'public.ordens_compra_fio', 'UPDATE') THEN
      RAISE EXCEPTION 'FAIL[4/cols]: % holds table-level UPDATE on ordens_compra_fio (column revoke moot)', v_role;
    END IF;
    FOR c IN SELECT name FROM c3dd_cols ORDER BY ord LOOP
      IF has_column_privilege(v_role, 'public.ordens_compra_fio', c.name, 'UPDATE') THEN
        RAISE EXCEPTION 'FAIL[4/cols]: % retains UPDATE on ordens_compra_fio.% after simulation', v_role, c.name;
      END IF;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'PASS[4/cols]: public/anon/authenticated/service_role have no effective UPDATE on any of the 11 targeted ordens_compra_fio columns and no equivalent table-level UPDATE';
END
$mtx_cols$;

-- 4.5 EFFECTIVE POST-CLOSURE SEQUENCE MATRIX (7 sequences).
DO $mtx_seq$
DECLARE s RECORD; p TEXT; v_role TEXT;
  v_privs TEXT[] := ARRAY['USAGE','SELECT','UPDATE'];
  v_roles TEXT[] := ARRAY['public','anon','authenticated','service_role'];
BEGIN
  FOR s IN SELECT name FROM c3dd_seqs ORDER BY ord LOOP
    FOREACH v_role IN ARRAY v_roles LOOP
      FOREACH p IN ARRAY v_privs LOOP
        IF has_sequence_privilege(v_role, 'public.'||s.name, p) THEN
          RAISE EXCEPTION 'FAIL[4/seq]: % retains % on sequence % after simulation', v_role, p, s.name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'PASS[4/seq]: public/anon/authenticated/service_role have no USAGE/SELECT/UPDATE on any of the 7 closure-targeted sequences';
END
$mtx_seq$;

-- 4.6 REMAINING RLS-POLICY MATRIX.
DO $mtx_pol$
DECLARE v_pub INT; v_before TEXT; v_after TEXT;
BEGIN
  -- Zero PUBLIC-targeted policy remains on any of the 14 protected tables.
  SELECT count(*) INTO v_pub
  FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname='public'
  WHERE 0::oid = ANY (p.polroles) AND c.relname IN (SELECT name FROM c3dd_tables);
  IF v_pub <> 0 THEN RAISE EXCEPTION 'FAIL[4/pol]: % PUBLIC-targeted policy(ies) remain on the 14 protected tables', v_pub; END IF;
  -- Every remaining (non-PUBLIC) policy on the 14 tables is byte-identical to the
  -- pre-simulation non-PUBLIC policy set (closure removes ONLY PUBLIC policies).
  v_after := pg_temp.c3dd_fp_nonpub_pol();
  SELECT fp_nonpub_pol INTO v_before FROM c3dd_capture WHERE label='pre_sim';
  IF v_after IS DISTINCT FROM v_before THEN
    RAISE EXCEPTION 'FAIL[4/pol]: the non-PUBLIC RLS policy set on the 14 protected tables changed during simulation (before=% after=%)', v_before, v_after;
  END IF;
  RAISE NOTICE 'PASS[4/pol]: zero PUBLIC-targeted RLS policy remains on the 14 protected tables; every non-PUBLIC policy byte-identical to pre-simulation (fingerprint %)', v_after;
END
$mtx_pol$;

-- 4.7 EFFECTIVE POST-CLOSURE FUNCTION MATRIX + no-metadata-drift proof.
DO $mtx_fn$
DECLARE v_sig TEXT;
BEGIN
  -- Owner-only ordem_compra_c3c_* commands + guards: postgres-owned, no EXECUTE.
  FOR v_sig IN
    SELECT p.oid::regprocedure::text FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace AND n.nspname='public'
    WHERE p.proname LIKE 'ordem_compra_c3c_%' OR p.proname IN ('trg_c3c_protected_mutation_guard','trg_c3c_command_state_guard')
  LOOP
    IF has_function_privilege('public', v_sig, 'EXECUTE') OR has_function_privilege('anon', v_sig, 'EXECUTE')
       OR has_function_privilege('authenticated', v_sig, 'EXECUTE') OR has_function_privilege('service_role', v_sig, 'EXECUTE') THEN
      RAISE EXCEPTION 'FAIL[4/fn]: owner-only % exposes EXECUTE after simulation', v_sig;
    END IF;
  END LOOP;
  -- Component A / Component B: authenticated retains EXECUTE; public/anon/service_role denied.
  IF NOT has_function_privilege('authenticated','public.listar_ordens_compra_fio_compat(uuid,bigint)','EXECUTE')
     OR has_function_privilege('public','public.listar_ordens_compra_fio_compat(uuid,bigint)','EXECUTE')
     OR has_function_privilege('anon','public.listar_ordens_compra_fio_compat(uuid,bigint)','EXECUTE')
     OR has_function_privilege('service_role','public.listar_ordens_compra_fio_compat(uuid,bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL[4/fn]: Component A EXECUTE matrix wrong after simulation';
  END IF;
  IF NOT has_function_privilege('authenticated','public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)','EXECUTE')
     OR has_function_privilege('public','public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)','EXECUTE')
     OR has_function_privilege('service_role','public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL[4/fn]: Component B EXECUTE matrix wrong after simulation';
  END IF;
  -- No function owner / security-definer / search_path changed during the simulation.
  IF EXISTS (
    SELECT 1 FROM c3dd_funcs f
    JOIN pg_proc p ON p.oid::regprocedure::text = f.signature
    JOIN pg_roles po ON po.oid = p.proowner
    WHERE f.owner <> po.rolname OR f.secdef <> p.prosecdef
       OR f.search_path <> COALESCE(array_to_string(p.proconfig,','),'')
  ) THEN
    RAISE EXCEPTION 'FAIL[4/fn]: a function owner/security-definer/search_path changed during simulation';
  END IF;
  RAISE NOTICE 'PASS[4/fn]: owner-only ordem_compra_c3c_* commands + guards expose no EXECUTE; Component A/B keep authenticated-only EXECUTE; no owner/security-definer/search_path drift; no bypass overload';
END
$mtx_fn$;

-- 4.8 DIRECT-TABLE ROLE PROBES (post-simulation ACL denies direct mutation).
--     Each of the four authenticated actors, on the flat receipt table and one
--     cutover table, is denied by privilege (42501) — rolled-back probes only,
--     no temporary grant manufactured.
DO $direct$
DECLARE
  v_actors TEXT[] := ARRAY[
    '00000000-0000-4000-8000-00000000c3a1',
    '00000000-0000-4000-8000-00000000c3b1',
    '00000000-0000-4000-8000-00000000c3b2',
    '00000000-0000-4000-8000-00000000c3b3'];
  a TEXT; v_n INT := 0; v_msg TEXT; v_state TEXT;
BEGIN
  FOREACH a IN ARRAY v_actors LOOP
    -- Switch to the authenticated role with this actor's claim for the probe.
    EXECUTE 'SET LOCAL ROLE authenticated';
    PERFORM set_config('request.jwt.claim.sub', a, TRUE);
    -- INSERT on the flat receipt table.
    BEGIN
      INSERT INTO public.ordens_compra_fio (op_id, fornecedor_id, tipo, cor_id, kg_pedido, status, status_administrativo)
        VALUES (930000401, 930000301, 'algodao', 930000301, 1.000, 'pendente', 'emitida');
      RAISE EXCEPTION 'FAIL[4/direct]: actor % INSERT on ordens_compra_fio succeeded post-simulation', a;
    EXCEPTION WHEN insufficient_privilege THEN v_n := v_n + 1;
    END;
    -- UPDATE on the flat receipt table.
    BEGIN
      UPDATE public.ordens_compra_fio SET kg_recebido = 1.000 WHERE id = 930000311;
      RAISE EXCEPTION 'FAIL[4/direct]: actor % UPDATE on ordens_compra_fio succeeded post-simulation', a;
    EXCEPTION WHEN insufficient_privilege THEN v_n := v_n + 1;
    END;
    -- DELETE on a cutover/receipt table.
    BEGIN
      DELETE FROM public.ordem_compra_recebimentos WHERE id = -1;
      RAISE EXCEPTION 'FAIL[4/direct]: actor % DELETE on ordem_compra_recebimentos succeeded post-simulation', a;
    EXCEPTION WHEN insufficient_privilege THEN v_n := v_n + 1;
    END;
    EXECUTE 'RESET ROLE';
  END LOOP;
  IF v_n <> 12 THEN RAISE EXCEPTION 'FAIL[4/direct]: expected 12 privilege denials (4 actors x 3 probes), got %', v_n; END IF;
  RAISE NOTICE 'PASS[4/direct]: all four authenticated actors denied (42501/insufficient_privilege) on direct INSERT/UPDATE/DELETE of protected tables post-simulation (12/12); no temporary grant manufactured';
END
$direct$;

-- 4.9 final_acl_closed_at STILL NULL; close_final_acl never invoked.
DO $s_end$
BEGIN
  IF (SELECT final_acl_closed_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[4/end]: final_acl_closed_at became non-NULL during simulation';
  END IF;
  RAISE NOTICE 'PASS[4/end]: final_acl_closed_at remained NULL throughout the simulated closure';
END
$s_end$;

ROLLBACK;  -- discard the entire simulated closure

-- ===========================================================================
-- 5. Post-rollback restoration proof: the real closure was never invoked, so
--    the ROLLBACK must restore the exact pre-simulation catalog and business
--    state byte-for-byte.
-- ===========================================================================
DO $restore$
DECLARE v RECORD;
BEGIN
  SELECT * INTO v FROM c3dd_capture WHERE label='pre_sim';
  IF pg_temp.c3dd_fp_all() IS DISTINCT FROM v.fp_all THEN
    RAISE EXCEPTION 'FAIL[5/restore]: table/sequence/column/function/policy ACL fingerprint not byte-identical after rollback';
  END IF;
  IF pg_temp.c3dd_fp_business() IS DISTINCT FROM v.fp_business THEN
    RAISE EXCEPTION 'FAIL[5/restore]: business-data fingerprint changed across the simulation';
  END IF;
  IF (SELECT md5(c::text) FROM public.ordem_compra_cutover c WHERE c.id=1) IS DISTINCT FROM v.cutover_md5 THEN
    RAISE EXCEPTION 'FAIL[5/restore]: cutover singleton changed across the simulation';
  END IF;
  IF (SELECT final_acl_closed_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[5/restore]: final_acl_closed_at not NULL after rollback';
  END IF;
  RAISE NOTICE 'PASS[5/restore]: post-rollback ACL/policy/function fingerprint, business-data fingerprint, and cutover singleton byte-identical to pre-simulation; final_acl_closed_at NULL';
END
$restore$;

-- ===========================================================================
-- 6. RUNTIME ROLE MATRIX — TEST-ONLY CANONICAL-ACTIVE ROLE-MATRIX FIXTURE.
--
--    NOTE (deviation, reported): making Component A/B active requires the cutover
--    singleton at status='canonical_active'. The installed db/75
--    ordem_compra_cutover_c3c_state_check makes canonical_active UNREPRESENTABLE
--    unless final_acl_closed_at IS NOT NULL AND canonical_activated_at IS NOT NULL.
--    A canonical_active fixture therefore cannot literally keep final_acl_closed_at
--    NULL; this section sets synthetic non-null final_acl_closed_at/
--    canonical_activated_at ONLY to satisfy that CHECK. This is NOT a real closure:
--    ordem_compra_c3c_close_final_acl / _activate are never invoked, no ACL is
--    revoked here, and the whole fixture is rolled back. The closure-simulation
--    section 4 (the requirement that final_acl_closed_at stays NULL) uses
--    maintenance-independent legacy_active state and keeps it NULL throughout.
-- ===========================================================================
BEGIN;
DO $fixture$
DECLARE v_rows INT;
BEGIN
  UPDATE public.ordem_compra_cutover
  SET status='canonical_active', read_authority='canonical', reconciliation_status='reconciled',
      cutover_generation=930004001,
      final_acl_closed_at=clock_timestamp(),      -- required by db/75 CHECK for canonical_active (test-only)
      canonical_activated_at=clock_timestamp(),   -- required by db/75 CHECK for canonical_active (test-only)
      productive_receipt_started_at=NULL
  WHERE id=1 AND status='legacy_active';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'FAIL[6/fixture]: canonical_active fixture affected % rows (expected 1)', v_rows; END IF;
  RAISE NOTICE 'PASS[6/fixture]: TEST-ONLY canonical_active/canonical/reconciled fixture applied (generation 930004001, productive_receipt_started_at NULL; close_final_acl/activate NOT invoked)';
END
$fixture$;

-- 6.A Component A runtime matrix.
-- Admin: sees the target mapped order, unrestricted by supplier ownership.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3a1', TRUE);
DO $a_admin$
DECLARE v_target INT; v_total INT;
BEGIN
  SELECT count(*) INTO v_target FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000311;
  SELECT count(*) INTO v_total  FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint);
  IF v_target <> 1 THEN RAISE EXCEPTION 'FAIL[6/A/admin]: admin does not see target order (got %)', v_target; END IF;
  IF v_total <> 51 THEN RAISE EXCEPTION 'FAIL[6/A/admin]: admin total=% (expected 51, unrestricted)', v_total; END IF;
  RAISE NOTICE 'PASS[6/A/admin]: admin sees the target mapped order and all 51 mapped orders (unrestricted by supplier ownership)';
END
$a_admin$;
RESET ROLE;

-- Matching supplier: sees the target order; sees no order belonging only to another supplier.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b1', TRUE);
DO $a_msup$
DECLARE v_target INT; v_other INT; v_foreign INT;
BEGIN
  SELECT count(*) INTO v_target FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000311;
  SELECT count(*) INTO v_other  FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000312;
  SELECT count(*) INTO v_foreign FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE fornecedor_id <> 930000301;
  IF v_target <> 1 THEN RAISE EXCEPTION 'FAIL[6/A/msup]: matching supplier does not see target order (got %)', v_target; END IF;
  IF v_other <> 0 THEN RAISE EXCEPTION 'FAIL[6/A/msup]: matching supplier sees the 930000302-only order (got %)', v_other; END IF;
  IF v_foreign <> 0 THEN RAISE EXCEPTION 'FAIL[6/A/msup]: matching supplier sees % foreign-supplier rows', v_foreign; END IF;
  RAISE NOTICE 'PASS[6/A/msup]: matching supplier sees the target order and zero orders belonging only to another supplier';
END
$a_msup$;
RESET ROLE;

-- Non-matching supplier: sees zero rows for the target order.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b2', TRUE);
DO $a_nsup$
DECLARE v_target INT;
BEGIN
  SELECT count(*) INTO v_target FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000311;
  IF v_target <> 0 THEN RAISE EXCEPTION 'FAIL[6/A/nsup]: non-matching supplier sees the target order (got %)', v_target; END IF;
  RAISE NOTICE 'PASS[6/A/nsup]: non-matching supplier sees zero rows for the target order';
END
$a_nsup$;
RESET ROLE;

-- Without-supplier (cliente): exact sem_permissao / 42501.
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b3', TRUE);
DO $a_nosup$
DECLARE v_msg TEXT; v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN
    PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint);
    RAISE EXCEPTION 'FAIL[6/A/nosup]: without-supplier actor answered';
  EXCEPTION WHEN SQLSTATE '42501' THEN
    GET STACKED DIAGNOSTICS v_msg = MESSAGE_TEXT;
    IF v_msg <> 'sem_permissao' THEN RAISE EXCEPTION 'FAIL[6/A/nosup]: 42501 message "%" (expected sem_permissao)', v_msg; END IF;
    v_caught := TRUE;
  END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[6/A/nosup]: sem_permissao not raised'; END IF;
  RAISE NOTICE 'PASS[6/A/nosup]: without-supplier (cliente) actor denied with exact sem_permissao/42501 by business logic';
END
$a_nosup$;
RESET ROLE;

-- Anon / service_role: denied by function privilege before business execution.
SET LOCAL ROLE anon;
DO $a_anon$
DECLARE v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint);
    RAISE EXCEPTION 'FAIL[6/A/anon]: anon executed Component A';
  EXCEPTION WHEN insufficient_privilege THEN v_caught := TRUE; END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[6/A/anon]: anon not denied by function privilege'; END IF;
  RAISE NOTICE 'PASS[6/A/anon]: anon denied by function EXECUTE privilege (42501) before any business execution';
END
$a_anon$;
RESET ROLE;

SET LOCAL ROLE service_role;
DO $a_srole$
DECLARE v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN PERFORM * FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint);
    RAISE EXCEPTION 'FAIL[6/A/srole]: service_role executed Component A';
  EXCEPTION WHEN insufficient_privilege THEN v_caught := TRUE; END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[6/A/srole]: service_role not denied by function privilege'; END IF;
  RAISE NOTICE 'PASS[6/A/srole]: service_role denied by function EXECUTE privilege (42501) before any business execution';
END
$a_srole$;
RESET ROLE;

-- PUBLIC / unauthenticated: catalog proof that EXECUTE is not granted to PUBLIC.
DO $a_public$
BEGIN
  IF has_function_privilege('public','public.listar_ordens_compra_fio_compat(uuid,bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL[6/A/public]: PUBLIC holds EXECUTE on Component A';
  END IF;
  RAISE NOTICE 'PASS[6/A/public]: PUBLIC/unauthenticated has no EXECUTE on Component A (function-privilege denial)';
END
$a_public$;

-- 6.B Component B runtime matrix (rolled-back savepoints; unique idempotency keys).
--     Each mutating probe runs inside its own SAVEPOINT rolled back afterward, so
--     no successful increase/decrease and no productive receipt can ever commit.

-- Admin: absolute total = current total -> deterministic no-op; roll back.
SAVEPOINT b_admin;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3a1', TRUE);
DO $b_admin$
DECLARE v_cur NUMERIC; v_res JSONB;
BEGIN
  -- Read the current total via Component A (the canonical read path this actor is
  -- authorized for) rather than a direct table SELECT, so both admin and supplier
  -- observe the same absolute total under their own RLS scope.
  SELECT kg_recebido INTO v_cur FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000311;
  v_res := public.registrar_recebimento_ordem_compra_fio_compat(930000311, v_cur, DATE '2020-01-02', 'c3dd-acl-admin-1', NULL, NULL);
  IF COALESCE((v_res->>'ok')::boolean,FALSE) IS NOT TRUE OR v_res->>'codigo' <> 'sem_alteracao' THEN
    RAISE EXCEPTION 'FAIL[6/B/admin]: admin absolute-total no-op did not return sem_alteracao: %', v_res;
  END IF;
  RAISE NOTICE 'PASS[6/B/admin]: admin absolute-total (=current %) -> deterministic no-op (sem_alteracao)', to_char(v_cur,'FM999999990.000');
END
$b_admin$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_admin;

-- Matching supplier: absolute total = current total -> deterministic no-op; roll back.
SAVEPOINT b_msup;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b1', TRUE);
DO $b_msup$
DECLARE v_cur NUMERIC; v_res JSONB;
BEGIN
  -- Read the current total via Component A (the canonical read path this actor is
  -- authorized for) rather than a direct table SELECT, so both admin and supplier
  -- observe the same absolute total under their own RLS scope.
  SELECT kg_recebido INTO v_cur FROM public.listar_ordens_compra_fio_compat(NULL::uuid,NULL::bigint) WHERE ordens_compra_fio_id=930000311;
  v_res := public.registrar_recebimento_ordem_compra_fio_compat(930000311, v_cur, DATE '2020-01-02', 'c3dd-acl-msup-1', NULL, NULL);
  IF COALESCE((v_res->>'ok')::boolean,FALSE) IS NOT TRUE OR v_res->>'codigo' <> 'sem_alteracao' THEN
    RAISE EXCEPTION 'FAIL[6/B/msup]: matching-supplier absolute-total no-op did not return sem_alteracao: %', v_res;
  END IF;
  RAISE NOTICE 'PASS[6/B/msup]: matching supplier absolute-total (=current %) -> deterministic no-op (sem_alteracao)', to_char(v_cur,'FM999999990.000');
END
$b_msup$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_msup;

-- Non-matching supplier: sem_permissao; zero mutation.
SAVEPOINT b_nsup;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b2', TRUE);
DO $b_nsup$
DECLARE v_res JSONB;
BEGIN
  v_res := public.registrar_recebimento_ordem_compra_fio_compat(930000311, 0, DATE '2020-01-02', 'c3dd-acl-nsup-1', NULL, NULL);
  IF COALESCE((v_res->>'ok')::boolean,TRUE) IS DISTINCT FROM FALSE OR v_res->>'codigo' <> 'sem_permissao' THEN
    RAISE EXCEPTION 'FAIL[6/B/nsup]: non-matching supplier not denied with sem_permissao: %', v_res;
  END IF;
  RAISE NOTICE 'PASS[6/B/nsup]: non-matching supplier denied with sem_permissao, zero mutation';
END
$b_nsup$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_nsup;

-- Without-supplier (cliente): sem_permissao; zero mutation.
SAVEPOINT b_nosup;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000c3b3', TRUE);
DO $b_nosup$
DECLARE v_res JSONB;
BEGIN
  v_res := public.registrar_recebimento_ordem_compra_fio_compat(930000311, 0, DATE '2020-01-02', 'c3dd-acl-nosup-1', NULL, NULL);
  IF COALESCE((v_res->>'ok')::boolean,TRUE) IS DISTINCT FROM FALSE OR v_res->>'codigo' <> 'sem_permissao' THEN
    RAISE EXCEPTION 'FAIL[6/B/nosup]: without-supplier not denied with sem_permissao: %', v_res;
  END IF;
  RAISE NOTICE 'PASS[6/B/nosup]: without-supplier (cliente) denied with sem_permissao, zero mutation';
END
$b_nosup$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_nosup;

-- Anon / service_role: denied by function EXECUTE privilege before business execution.
SAVEPOINT b_anon;
SET LOCAL ROLE anon;
DO $b_anon$
DECLARE v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN PERFORM public.registrar_recebimento_ordem_compra_fio_compat(930000311, 0, DATE '2020-01-02', 'c3dd-acl-anon-1', NULL, NULL);
    RAISE EXCEPTION 'FAIL[6/B/anon]: anon executed Component B';
  EXCEPTION WHEN insufficient_privilege THEN v_caught := TRUE; END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[6/B/anon]: anon not denied by function privilege'; END IF;
  RAISE NOTICE 'PASS[6/B/anon]: anon denied by function EXECUTE privilege (42501) before any business execution';
END
$b_anon$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_anon;

SAVEPOINT b_srole;
SET LOCAL ROLE service_role;
DO $b_srole$
DECLARE v_caught BOOLEAN := FALSE;
BEGIN
  BEGIN PERFORM public.registrar_recebimento_ordem_compra_fio_compat(930000311, 0, DATE '2020-01-02', 'c3dd-acl-srole-1', NULL, NULL);
    RAISE EXCEPTION 'FAIL[6/B/srole]: service_role executed Component B';
  EXCEPTION WHEN insufficient_privilege THEN v_caught := TRUE; END;
  IF NOT v_caught THEN RAISE EXCEPTION 'FAIL[6/B/srole]: service_role not denied by function privilege'; END IF;
  RAISE NOTICE 'PASS[6/B/srole]: service_role denied by function EXECUTE privilege (42501) before any business execution';
END
$b_srole$;
RESET ROLE;
ROLLBACK TO SAVEPOINT b_srole;

-- PUBLIC / unauthenticated: catalog proof that EXECUTE is not granted to PUBLIC.
DO $b_public$
BEGIN
  IF has_function_privilege('public','public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'FAIL[6/B/public]: PUBLIC holds EXECUTE on Component B';
  END IF;
  RAISE NOTICE 'PASS[6/B/public]: PUBLIC/unauthenticated has no EXECUTE on Component B (function-privilege denial)';
END
$b_public$;

-- 6.C No productive receipt occurred; PONR remains NULL under the fixture.
DO $ponr$
BEGIN
  IF (SELECT productive_receipt_started_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[6/ponr]: productive_receipt_started_at became non-NULL during the runtime matrix';
  END IF;
  RAISE NOTICE 'PASS[6/ponr]: no successful increase/decrease committed; productive_receipt_started_at remained NULL across the entire runtime matrix';
END
$ponr$;

ROLLBACK;  -- discard the TEST-ONLY canonical_active fixture

-- ===========================================================================
-- 7. Post-fixture restoration + lock/backend cleanup evidence.
-- ===========================================================================
DO $restore2$
DECLARE v RECORD; v_state TEXT;
BEGIN
  SELECT * INTO v FROM c3dd_capture WHERE label='pre_sim';
  SELECT status||'/'||read_authority||'/'||reconciliation_status INTO v_state FROM public.ordem_compra_cutover WHERE id=1;
  IF v_state <> 'legacy_active/flat/not_started' THEN
    RAISE EXCEPTION 'FAIL[7/restore]: cutover singleton not restored to legacy_active/flat/not_started (got %)', v_state;
  END IF;
  IF (SELECT final_acl_closed_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[7/restore]: final_acl_closed_at not NULL after fixture rollback';
  END IF;
  IF (SELECT productive_receipt_started_at FROM public.ordem_compra_cutover WHERE id=1) IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL[7/restore]: productive_receipt_started_at not NULL after fixture rollback';
  END IF;
  IF pg_temp.c3dd_fp_business() IS DISTINCT FROM v.fp_business THEN
    RAISE EXCEPTION 'FAIL[7/restore]: business-data fingerprint changed across the runtime matrix';
  END IF;
  IF pg_temp.c3dd_fp_all() IS DISTINCT FROM v.fp_all THEN
    RAISE EXCEPTION 'FAIL[7/restore]: ACL/policy/function fingerprint changed across the runtime matrix';
  END IF;
  RAISE NOTICE 'PASS[7/restore]: after fixture rollback the cutover singleton is legacy_active/flat/not_started, final_acl_closed_at/PONR NULL, business + ACL fingerprints byte-identical to pre-simulation';
END
$restore2$;

DO $locks$
DECLARE v_n INT;
BEGIN
  SELECT count(*) INTO v_n FROM pg_locks WHERE locktype='advisory' AND pid=pg_backend_pid();
  IF v_n <> 0 THEN RAISE EXCEPTION 'FAIL[7/locks]: % advisory lock(s) held at end of test', v_n; END IF;
  RAISE NOTICE 'PASS[7/locks]: zero advisory lock held by this backend immediately before disconnect; no open transaction left';
END
$locks$;

-- Emit this backend's PID in stable, greppable form so the ephemeral
-- orchestrator (outside this file, after psql exits) can prove — from a separate
-- connection — that this PID is absent from pg_stat_activity and holds zero
-- advisory locks before any cluster teardown.
SELECT 'C3D_D_ACL_INTEGRATION_PASS' AS result, pg_backend_pid() AS test_backend_pid;
DO $emit_pid$
BEGIN
  RAISE NOTICE 'TEST_BACKEND_PID=%', pg_backend_pid();
END
$emit_pid$;
