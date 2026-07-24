// tests/manta-product-identity-invariant.mjs
//
// PHASE-MANTA-A disposable-cluster proof of the db/79 route-invariant correction
// and the db/80 model-reference concurrency correction of db/78.
//
// Governing contract: docs/architecture/MANTA_PRODUCT_VARIANT_PHASE_CONTRACT.md.
// Correction migrations: db/79_manta_product_identity_invariant_correction.sql and
// db/80_manta_model_reference_concurrency_correction.sql.
//
// ENVIRONMENT: disposable local PostgreSQL 18.4 ONLY
// (scripts/c3d/bootstrap-disposable-cluster.mjs). This harness NEVER connects to
// any shared/remote/managed host, contains no credential/token/project URL, and
// destroys its cluster before process exit. The Supabase-platform preamble and all
// fixtures are rebuilt in OS temp files outside the repository and removed on exit.
//
// WHAT THIS PROVES, on ONE fresh disposable cluster (then destroyed, Part Z):
//   Part A  full chain db/01..db/79 applies cleanly, in order, with the informal
//           Manta fixture planted BEFORE db/78 so the db/78 backfill reclassifies
//           it (ordinary models stay tapete; MANTA ARABESCO -> ARABESCO/manta).
//   Part B  db/78 AND db/79 re-apply idempotently, with a before/after schema
//           fingerprint proving zero schema/constraint/trigger/function/grant drift.
//   Part C  tests/manta-product-identity.integration.sql passes against db/01..79
//           (width/uniqueness/pedido-override/sequential-homogeneity guards).
//   Part C2 C5 purchase-order emission regression: the 64-row corpus is injected
//           after db/66 (db/67 reconciles it to 64/51/51/51/51) and
//           tests/ordem-compra-c5a-emission-readiness.integration.sql still passes
//           with db/78+db/79 present (db/79 is orthogonal to the C5 domain).
//   Part D  model route/composition immutability (db/79 §C): unreferenced model may
//           change tipo_produto/largura; once referenced by pedido_itens OR op_itens
//           both are rejected; nome (non-routing metadata) stays editable.
//   Part E  concurrency (db/79 §B), TWO+ real distinct psql sessions:
//             E1 concurrent different-type FIRST inserts into one empty OP -> exactly
//                one commit + one controlled rejection; final OP homogeneous.
//             E2 concurrent same-type inserts -> both succeed.
//             E3 inserts into DIFFERENT OPs do not serialize.
//             E4 an UPDATE that moves an item locks the LOWER op id first, in BOTH
//                move directions (deterministic ascending lock order).
//             E5 two opposing concurrent moves complete with NO deadlock.
//   Part G  model-reference concurrency (db/80): real distinct psql sessions prove
//           the model identity used to validate an item cannot change between
//           validation and commit — A OP first-reference wins, B model update wins,
//           C pedido first-reference wins, D model update before pedido item,
//           E non-contention (same-model refs don't serialize; nome + same-value
//           model updates permitted), F opposing item modelo_id moves, no deadlock.
//   Part F  finishing-RPC regression (unchanged by db/79/db/80): gerar_op_latex
//           rejects a Manta origin; a Tapete origin still creates finishing.
//   Part Z  mandatory full cluster destruction (pid absent, port closed, dir absent).
//
// Run:  node tests/manta-product-identity-invariant.mjs
// Exits nonzero on any missing or failed proof.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bootstrapCluster,
  getRepoRoot,
} from '../scripts/c3d/bootstrap-disposable-cluster.mjs';

const REPO_ROOT = getRepoRoot();
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Supabase-platform preamble a bare PG 18.4 cluster lacks (applied before db/01).
// Identical in spirit to tests/ordem-compra-c3d-lock-concurrency.mjs. No remote
// host, credential or token.
// ---------------------------------------------------------------------------
const PREAMBLE_SQL = `
DO $preamble$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END
$preamble$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text,
  last_sign_in_at    timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  raw_user_meta_data jsonb,
  raw_app_meta_data  jsonb
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$fn$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $fn$
  SELECT NULLIF(current_setting('request.jwt.claim.role', true), '')::text;
$fn$;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA auth, extensions TO anon, authenticated, service_role;
`;

// Informal-Manta backfill fixture, planted AFTER db/77, BEFORE db/78. At that point
// modelos has NO tipo_produto column yet (db/78 adds it), so it is not referenced
// here; db/78's ADD COLUMN defaults it to 'tapete' and the db/78 backfill DO block
// then reclassifies MANTA ARABESCO -> ARABESCO/manta by semantic attributes.
const INFORMAL_MANTA_FIXTURE_SQL = `
DO $mi$
DECLARE c1 BIGINT; c2 BIGINT;
BEGIN
  INSERT INTO public.cores (nome) VALUES ('MI-BACKFILL-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores (nome) VALUES ('MI-BACKFILL-CRU')   RETURNING id INTO c2;
  -- The pre-existing informal Manta (semantic name, width 1.40).
  INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura)
    VALUES ('MANTA ARABESCO', c1, c2, 1.40);
  -- An ordinary model that must stay tapete after the backfill.
  INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura)
    VALUES ('MI-ORDINARY-TAPETE', c1, c2, 2.10);
END
$mi$;
`;

// Classification-faithful 64-row purchase-order corpus, injected AFTER db/66 and
// BEFORE db/67 (db/67 hard-asserts the 64/27/12/13/12 classification and would
// fail on an empty corpus). Byte-for-byte the corpus from
// tests/ordem-compra-c3d-lock-concurrency.mjs. It is inert for the Manta guards
// but (a) lets the full chain apply and (b) lets the C5A emission integration
// test run against the reconciled 64/51/51/51/51 state on this same cluster.
const CORPUS_SQL = `
INSERT INTO public.cores (id, nome) VALUES (930000201, 'C3D-CORPUS-COR-ALGODAO')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fornecedores (id, nome, tipo) VALUES
  (930000301, 'C3D-CORPUS-FORN-A (matching)', 'fio_algodao'),
  (930000302, 'C3D-CORPUS-FORN-B (control)',  'fio_algodao')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ops (id, numero, ano) VALUES (930000101, 990001, 2099)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.saldo_fios (tipo, cor_id, cor_poliester, kg_total)
  VALUES ('algodao', 930000201, NULL, 100.000)
  ON CONFLICT DO NOTHING;

INSERT INTO public.ordens_compra_fio
  (id, op_id, fornecedor_id, tipo, cor_id, cor_poliester,
   kg_pedido, kg_recebido, data_pedido, data_recebimento,
   status, status_administrativo, status_aceite, status_recebimento,
   legado_recebimento_automatico)
VALUES
  (930000311, 930000101, 930000301, 'algodao', 930000201, NULL,
   15.500, 5.000, DATE '2026-01-05', NULL,
   'pendente', 'emitida', 'nao_aplicavel', 'nao_recebido', FALSE),
  (930000312, 930000101, 930000302, 'algodao', 930000201, NULL,
   12.000, NULL, DATE '2026-01-05', NULL,
   'pendente', 'emitida', 'nao_aplicavel', 'nao_recebido', FALSE);

INSERT INTO public.ordens_compra_fio
  (id, op_id, fornecedor_id, tipo, cor_id, cor_poliester,
   kg_pedido, kg_recebido, data_pedido, data_recebimento,
   status, status_administrativo, status_aceite, status_recebimento,
   legado_recebimento_automatico)
SELECT
  gs, 930000101, 930000301, 'algodao', 930000201, NULL,
  10.000,
  CASE WHEN cls.status = 'recebido_total' THEN 10.000 ELSE NULL END,
  DATE '2026-01-01',
  CASE WHEN cls.status = 'recebido_total' THEN DATE '2026-02-01' ELSE NULL END,
  cls.status, cls.status_administrativo, 'nao_aplicavel', cls.status_recebimento, FALSE
FROM generate_series(930000313, 930000374) AS gs
CROSS JOIN LATERAL (
  SELECT
    CASE WHEN gs BETWEEN 930000313 AND 930000349 THEN 'emitida' ELSE 'rascunho' END AS status_administrativo,
    CASE
      WHEN gs BETWEEN 930000313 AND 930000322 THEN 'pendente'
      WHEN gs BETWEEN 930000323 AND 930000349 THEN 'recebido_total'
      WHEN gs BETWEEN 930000350 AND 930000362 THEN 'pendente'
      ELSE 'recebido_total'
    END AS status,
    CASE
      WHEN gs BETWEEN 930000323 AND 930000349 THEN 'recebido'
      WHEN gs BETWEEN 930000363 AND 930000374 THEN 'recebido'
      ELSE 'nao_recebido'
    END AS status_recebimento
) AS cls;

DO $corpus$
DECLARE v_a int; v_b int; v_c int; v_d int; v_tot int;
BEGIN
  SELECT count(*) FILTER (WHERE status_administrativo='emitida'  AND status='recebido_total'),
         count(*) FILTER (WHERE status_administrativo='emitida'  AND status='pendente'),
         count(*) FILTER (WHERE status_administrativo='rascunho' AND status='pendente'),
         count(*) FILTER (WHERE status_administrativo='rascunho' AND status='recebido_total'),
         count(*)
    INTO v_a, v_b, v_c, v_d, v_tot FROM public.ordens_compra_fio;
  IF v_tot <> 64 OR v_a <> 27 OR v_b <> 12 OR v_c <> 13 OR v_d <> 12 THEN
    RAISE EXCEPTION 'corpus mismatch: total=%, A=%, B=%, C=%, D=% (expected 64/27/12/13/12)', v_tot, v_a, v_b, v_c, v_d;
  END IF;
END
$corpus$;
`;

// ---------------------------------------------------------------------------
// Small utilities (mirrors the accepted idiom in the C3D lock harness).
// ---------------------------------------------------------------------------
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let FAILURES = 0;
function check(cond, msg) {
  if (cond) return true;
  FAILURES += 1;
  throw new Error(`PROOF FAILED: ${msg}`);
}
function log(tag, obj) {
  const body = obj && typeof obj === 'object'
    ? Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('|')
    : String(obj ?? '');
  console.log(body ? `${tag}|${body}` : tag);
}
function psqlBinary(handle) {
  return path.join(handle.pgBinDir, process.platform === 'win32' ? 'psql.exe' : 'psql');
}
function baseArgs(handle) {
  return ['-X', '-w', '-q', '-A', '-t', '-h', handle.host, '-p', String(handle.port), '-U', handle.user, '-d', handle.database];
}

function applyFile(handle, file, labelForError) {
  const result = spawnSync(psqlBinary(handle), [...baseArgs(handle), '-v', 'ON_ERROR_STOP=1', '-f', file], {
    encoding: 'utf8', timeout: 120000,
  });
  if (result.status !== 0) {
    const diag = result.error ? result.error.message : (result.stderr || result.stdout || `exit ${result.status}`);
    throw new Error(`APPLY_FAILED (${labelForError || file}): ${diag}`);
  }
  return result.stdout || '';
}

let SCRATCH_DIR = null;
async function applySql(handle, name, sql, label) {
  const file = path.join(SCRATCH_DIR, name);
  await writeFile(file, sql, 'utf8');
  return applyFile(handle, file, label || name);
}

// Interactive line-sentinel psql session (verbatim idiom from the C3D lock harness).
function openSession(handle, name) {
  const child = spawn(psqlBinary(handle), [...baseArgs(handle), '-v', 'ON_ERROR_STOP=0'], {
    env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = [];
  const waiters = [];
  let pending = '';
  let stderr = '';
  let closed = false;
  let closeError;
  function publish(line) {
    const value = line.trim();
    if (!value) return;
    lines.push(value);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(value)) {
        clearTimeout(waiter.timer);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(value);
      }
    }
  }
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    pending += chunk;
    const complete = pending.split(/\r?\n/);
    pending = complete.pop() || '';
    complete.forEach(publish);
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', (error) => { closeError = error; });
  const completion = new Promise((resolve, reject) => {
    child.on('close', (code) => {
      closed = true;
      if (pending) publish(pending);
      const err = closeError || (code === 0 ? null : new Error(`${name} psql exited ${code}: ${stderr}`));
      for (const waiter of waiters.splice(0)) { clearTimeout(waiter.timer); waiter.reject(err || new Error(`${name} closed early`)); }
      if (err) reject(err); else resolve({ lines, stderr });
    });
  });
  completion.catch(() => {});
  return {
    name,
    get closed() { return closed; },
    get stderr() { return stderr; },
    send(sql) { assert.equal(closed, false, `${name} is already closed`); child.stdin.write(`${sql}\n`); },
    waitFor(predicate, timeoutMs = 20000) {
      const existing = lines.find(predicate);
      if (existing) return Promise.resolve(existing);
      if (closed) return Promise.reject(closeError || new Error(`${name} closed`));
      return new Promise((resolve, reject) => {
        const waiter = { predicate, resolve, reject };
        waiter.timer = setTimeout(() => {
          const i = waiters.indexOf(waiter); if (i >= 0) waiters.splice(i, 1);
          reject(new Error(`${name} timed out; output=${lines.join(' | ')}; stderr=${stderr}`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
    async close() { if (!closed) { try { child.stdin.end('\\q\n'); } catch { /* ignore */ } } return completion; },
  };
}

async function query(handle, sql) {
  const s = openSession(handle, 'query');
  const collected = [];
  s.send(sql);
  s.send(`SELECT 'Q_DONE';`);
  await s.waitFor((l) => { if (l !== 'Q_DONE') collected.push(l); return l === 'Q_DONE'; });
  await s.close();
  return collected;
}
async function scalar(handle, sql) { const [row = ''] = await query(handle, sql); return row; }

// Poll pg_blocking_pids until `subjectPid` is blocked by `blockerPid`.
async function waitForBlock(handle, subjectPid, blockerPid, attempts = 200) {
  for (let i = 0; i < attempts; i += 1) {
    const row = await scalar(handle,
      `SELECT array_to_string(pg_catalog.pg_blocking_pids(${subjectPid}), ',');`);
    if (row.split(',').includes(String(blockerPid))) return row;
    await delay(50);
  }
  throw new Error(`backend ${subjectPid} did not block on ${blockerPid}`);
}
async function blockingPids(handle, subjectPid) {
  return scalar(handle, `SELECT array_to_string(pg_catalog.pg_blocking_pids(${subjectPid}), ',');`);
}

// Order-stable schema fingerprint (columns, constraints, triggers, function
// bodies, table + routine grants). Used to prove idempotent re-apply causes no
// drift. ORDER BY the line text makes it independent of catalog/OID ordering.
async function schemaFingerprint(handle) {
  return scalar(handle, `
    WITH t AS (
      SELECT 'COL '||table_schema||'.'||table_name||'.'||column_name||' '||data_type||' '||is_nullable||' '||coalesce(column_default,'') AS line
        FROM information_schema.columns WHERE table_schema='public'
      UNION ALL
      SELECT 'CON '||conrelid::regclass::text||' '||conname||' '||pg_get_constraintdef(oid)
        FROM pg_constraint WHERE connamespace='public'::regnamespace
      UNION ALL
      SELECT 'TRG '||tgrelid::regclass::text||' '||tgname||' '||pg_get_triggerdef(oid)
        FROM pg_trigger WHERE NOT tgisinternal AND tgrelid::regclass::text LIKE 'public.%'
      UNION ALL
      SELECT 'FN '||p.proname||'('||pg_get_function_identity_arguments(p.oid)||') '||md5(pg_get_functiondef(p.oid))
        FROM pg_proc p WHERE p.pronamespace='public'::regnamespace
      UNION ALL
      SELECT 'GRANT '||grantee||' '||table_name||' '||privilege_type
        FROM information_schema.role_table_grants WHERE table_schema='public'
      UNION ALL
      SELECT 'GRANTFN '||grantee||' '||routine_name||' '||privilege_type
        FROM information_schema.role_routine_grants WHERE routine_schema='public'
    )
    SELECT md5(string_agg(line, E'\\n' ORDER BY line)) FROM t;`);
}

async function resolveManifest() {
  const dbDir = path.join(REPO_ROOT, 'db');
  const entries = await readdir(dbDir);
  return entries
    .filter((f) => /^\d{2,}_.*\.sql$/.test(f) && !/\.verify\.sql$/.test(f) && f !== 'setup_completo.sql')
    .map((f) => ({ n: Number(f.match(/^(\d+)_/)[1]), file: path.join(dbDir, f) }))
    .sort((a, b) => a.n - b.n);
}

// ===========================================================================
// PART A — full chain apply (db/01..79) + informal-Manta backfill proof.
// ===========================================================================
async function partA(handle) {
  const manifest = await resolveManifest();
  check(manifest.length === 80, `manifest must be db/01..db/80 (got ${manifest.length})`);
  check(manifest[manifest.length - 1].n === 80, `terminal migration must be db/80 (got ${manifest[manifest.length - 1].n})`);

  await applySql(handle, 'preamble.sql', PREAMBLE_SQL, 'preamble');
  for (const { n, file } of manifest) {
    applyFile(handle, file, path.basename(file));
    if (n === 66) {
      await applySql(handle, 'corpus.sql', CORPUS_SQL, 'corpus (after db/66, before db/67)');
    }
    if (n === 77) {
      await applySql(handle, 'informal-manta.sql', INFORMAL_MANTA_FIXTURE_SQL, 'informal-manta (after db/77, before db/78)');
    }
  }

  // Backfill proof (test 4): informal reclassified, ordinary stays tapete.
  const arabesco = await scalar(handle,
    `SELECT count(*) FROM public.modelos WHERE nome='ARABESCO' AND tipo_produto='manta' AND largura=1.40;`);
  const staleName = await scalar(handle,
    `SELECT count(*) FROM public.modelos WHERE nome='MANTA ARABESCO';`);
  const ordinary = await scalar(handle,
    `SELECT count(*) FROM public.modelos WHERE nome='MI-ORDINARY-TAPETE' AND tipo_produto='tapete';`);
  const anyManta = await scalar(handle, `SELECT count(*) FROM public.modelos WHERE tipo_produto='manta';`);
  check(Number(arabesco) === 1, `informal Manta must become ARABESCO/manta/1.40 (got ${arabesco})`);
  check(Number(staleName) === 0, `no model may keep the informal name MANTA ARABESCO (got ${staleName})`);
  check(Number(ordinary) === 1, `ordinary model must stay tapete (got ${ordinary})`);
  check(Number(anyManta) === 1, `exactly one Manta after backfill (got ${anyManta})`);

  // Terminal objects present (db/78 + db/79).
  const objs = await scalar(handle, `
    SELECT (SELECT count(*) FROM pg_trigger WHERE tgname='op_itens_route_homogeneity_guard' AND NOT tgisinternal) || '/' ||
           (SELECT count(*) FROM pg_trigger WHERE tgname='modelos_route_identity_immutability_guard' AND NOT tgisinternal) || '/' ||
           (SELECT count(*) FROM pg_trigger WHERE tgname='pedido_itens_manta_largura_guard' AND NOT tgisinternal) || '/' ||
           (SELECT count(*) FROM pg_constraint WHERE conname='modelos_manta_largura_chk') || '/' ||
           (SELECT count(*) FROM pg_constraint WHERE conname='modelos_tipo_produto_chk');`);
  check(objs === '1/1/1/1/1', `db/78+db/79+db/80 terminal objects must all exist (homog/immut/width/mantachk/typechk = ${objs})`);
  log('PART_A', { migrations: manifest.length, backfill: 'ARABESCO/manta', ordinary: 'tapete', objects: objs, clean_apply: true });
}

// ===========================================================================
// PART B — db/78 + db/79 + db/80 idempotent re-apply with zero drift.
// ===========================================================================
async function partB(handle) {
  const before = await schemaFingerprint(handle);
  const dbDir = path.join(REPO_ROOT, 'db');
  applyFile(handle, path.join(dbDir, '78_manta_product_identity_and_route_foundation.sql'), 'db/78 re-apply');
  applyFile(handle, path.join(dbDir, '79_manta_product_identity_invariant_correction.sql'), 'db/79 re-apply');
  applyFile(handle, path.join(dbDir, '80_manta_model_reference_concurrency_correction.sql'), 'db/80 re-apply');
  const after = await schemaFingerprint(handle);
  check(before === after, `idempotent re-apply of db/78+db/79+db/80 must cause zero schema drift (before=${before}, after=${after})`);
  // Backfill is a no-op on re-apply (source name already renamed).
  const stale = await scalar(handle, `SELECT count(*) FROM public.modelos WHERE nome='MANTA ARABESCO';`);
  const arabesco = await scalar(handle, `SELECT count(*) FROM public.modelos WHERE nome='ARABESCO' AND tipo_produto='manta';`);
  check(Number(stale) === 0 && Number(arabesco) === 1, `re-apply must not re-run or duplicate the backfill (stale=${stale}, arabesco=${arabesco})`);
  log('PART_B', { fingerprint_stable: true, reapply: 'db/78+db/79+db/80', drift: 'none', backfill_reapply: 'noop' });
}

// ===========================================================================
// PART C — existing db/78 integration test against db/01..79.
// ===========================================================================
async function partC(handle) {
  const file = path.join(HERE, 'manta-product-identity.integration.sql');
  const out = applyFile(handle, file, 'manta-product-identity.integration.sql');
  check(/MANTA_PRODUCT_IDENTITY_INTEGRATION_PASS/.test(out),
    `integration test must emit its PASS sentinel (got: ${out.trim().split(/\r?\n/).slice(-3).join(' / ')})`);
  log('PART_C', { integration_test: 'manta-product-identity.integration.sql', result: 'PASS' });
}

// ===========================================================================
// PART C2 — C5 purchase-order emission regression against db/01..79 (test 19).
// db/79 is orthogonal to the ordem_compra/C5 domain; this proves the C5A emission
// integration test still passes with db/78+db/79 present (corpus reconciled to
// 64/51/51/51/51 by db/67).
// ===========================================================================
async function partC2(handle) {
  const recon = await scalar(handle, `
    SELECT (SELECT count(*) FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FROM public.ordem_compra) || '/' ||
           (SELECT count(*) FROM public.ordem_compra_item);`);
  check(recon.startsWith('64/51/51'), `C5 corpus must be reconciled 64/51/51 before the emission test (got ${recon})`);
  const file = path.join(HERE, 'ordem-compra-c5a-emission-readiness.integration.sql');
  const out = applyFile(handle, file, 'ordem-compra-c5a-emission-readiness.integration.sql');
  check(/C5A_EMISSION_READINESS_INTEGRATION_PASS/.test(out),
    `C5A emission test must emit its PASS sentinel (got: ${out.trim().split(/\r?\n/).slice(-3).join(' / ')})`);
  log('PART_C2', { c5_reconciliation: recon, emission_test: 'C5A', result: 'PASS' });
}

// ===========================================================================
// PART D — model route/composition immutability (db/79 §C).
// Self-contained, plants fixtures with triggers off, exercises the guard with
// triggers on, and ROLLBACKs — zero persistent mutation.
// ===========================================================================
const IMMUTABILITY_PROOF_SQL = `
\\set ON_ERROR_STOP on
BEGIN;
SET LOCAL session_replication_role = replica;

DO $imm$
DECLARE
  c1 BIGINT; c2 BIGINT; cli BIGINT; ped UUID; lote BIGINT; op BIGINT;
  m_free BIGINT; m_ped BIGINT; m_op BIGINT; v_ok BOOLEAN;
BEGIN
  INSERT INTO public.cores(nome) VALUES ('IMM-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores(nome) VALUES ('IMM-CRU')   RETURNING id INTO c2;

  -- m_free: never referenced. m_ped: referenced by pedido_itens. m_op: by op_itens.
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto)
    VALUES ('IMM-FREE', c1, c2, 2.10, 'tapete') RETURNING id INTO m_free;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto)
    VALUES ('IMM-PED', c1, c2, 1.40, 'tapete') RETURNING id INTO m_ped;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto)
    VALUES ('IMM-OP', c1, c2, 1.40, 'tapete') RETURNING id INTO m_op;

  INSERT INTO public.clientes(nome) VALUES ('IMM-CLI') RETURNING id INTO cli;
  INSERT INTO public.pedidos(cliente_id, numero, status) VALUES (cli, 970101, 'confirmado') RETURNING id INTO ped;
  INSERT INTO public.lotes(numero, cliente_id, pedido_id) VALUES (970101, cli, ped) RETURNING id INTO lote;
  INSERT INTO public.ops(numero, ano, status, tipo, lote_id) VALUES (970101, 2097, 'simulada', 'tecelagem', lote) RETURNING id INTO op;

  -- Establish references.
  INSERT INTO public.pedido_itens(pedido_id, modelo_id, metros, ordem) VALUES (ped, m_ped, 100, 1);
  INSERT INTO public.op_itens(op_id, modelo_id, metros_pedidos) VALUES (op, m_op, 100);

  SET LOCAL session_replication_role = origin;  -- guards ON from here.

  -- (7) Unreferenced model: tipo_produto AND largura may change legally.
  UPDATE public.modelos SET largura = 1.40 WHERE id = m_free;          -- width change OK
  UPDATE public.modelos SET tipo_produto = 'manta' WHERE id = m_free;  -- type change OK (now 1.40)
  IF (SELECT tipo_produto FROM public.modelos WHERE id=m_free) <> 'manta' THEN
    RAISE EXCEPTION 'FAIL(7): unreferenced model type/width change did not persist';
  END IF;

  -- (8) Referenced-by-pedido model: tipo_produto change rejected.
  v_ok := FALSE;
  BEGIN
    UPDATE public.modelos SET tipo_produto = 'manta' WHERE id = m_ped;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%imutaveis apos uso%' THEN v_ok := TRUE; ELSE RAISE; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(8): referenced (pedido) tipo_produto change was accepted'; END IF;

  -- (9) Referenced model: largura change rejected.
  v_ok := FALSE;
  BEGIN
    UPDATE public.modelos SET largura = 2.10 WHERE id = m_ped;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%imutaveis apos uso%' THEN v_ok := TRUE; ELSE RAISE; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(9): referenced largura change was accepted'; END IF;

  -- (8b) Referenced-by-OP model: tipo_produto change rejected too (either table).
  v_ok := FALSE;
  BEGIN
    UPDATE public.modelos SET tipo_produto = 'manta' WHERE id = m_op;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%imutaveis apos uso%' THEN v_ok := TRUE; ELSE RAISE; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(8b): referenced (op) tipo_produto change was accepted'; END IF;

  -- (10) Permitted metadata edit (nome) on a referenced model stays functional.
  UPDATE public.modelos SET nome = 'IMM-PED-RENAMED' WHERE id = m_ped;
  IF (SELECT nome FROM public.modelos WHERE id=m_ped) <> 'IMM-PED-RENAMED' THEN
    RAISE EXCEPTION 'FAIL(10): permitted metadata edit (nome) did not persist';
  END IF;

  -- Same-value UPDATE of tipo_produto/largura on a referenced model is a no-op
  -- (IS DISTINCT FROM), so it must NOT be rejected.
  UPDATE public.modelos SET tipo_produto = tipo_produto, largura = largura WHERE id = m_ped;

  RAISE NOTICE 'MANTA_IMMUTABILITY_PASS';
END
$imm$;

SELECT 'MANTA_IMMUTABILITY_PASS' AS result;
ROLLBACK;
`;

async function partD(handle) {
  const out = await applySql(handle, 'immutability.sql', IMMUTABILITY_PROOF_SQL, 'immutability proof');
  check(/MANTA_IMMUTABILITY_PASS/.test(out), `immutability proof must pass (got: ${out.trim()})`);
  log('PART_D', { referenced_type_change: 'rejected', referenced_width_change: 'rejected', unreferenced_change: 'allowed', metadata_edit: 'allowed', result: 'PASS' });
}

// ===========================================================================
// PART E — distinct-session concurrency (db/79 §B). Fixtures are committed so
// concurrent backends share them.
// ===========================================================================
const CONCURRENCY_FIXTURES_SQL = `
CREATE TABLE IF NOT EXISTS public._mi_ids (k TEXT PRIMARY KEY, v BIGINT);
DO $cf$
DECLARE
  c1 BIGINT; c2 BIGINT; mt BIGINT; mt2 BIGINT; mm BIGINT;
  opX BIGINT; opY BIGINT; opA BIGINT; opB BIGINT;
  p1 BIGINT; q1 BIGINT; p2 BIGINT; q2 BIGINT; p3 BIGINT; q3 BIGINT;
  ip1 BIGINT; iq1 BIGINT; iq2 BIGINT; ip3 BIGINT; iq3 BIGINT;
BEGIN
  INSERT INTO public.cores(nome) VALUES ('MI-CONC-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores(nome) VALUES ('MI-CONC-CRU')   RETURNING id INTO c2;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MI-CONC-T',  c1,c2,2.10,'tapete') RETURNING id INTO mt;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MI-CONC-T2', c1,c2,1.40,'tapete') RETURNING id INTO mt2;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MI-CONC-MA', c1,c2,1.40,'manta')  RETURNING id INTO mm;

  -- Empty OPs for first-insert races (X different-type, Y same-type) and the
  -- different-OP independence test (A, B). ops.numero unique per ano.
  INSERT INTO public.ops(numero,ano) VALUES (971001,2097) RETURNING id INTO opX;
  INSERT INTO public.ops(numero,ano) VALUES (971002,2097) RETURNING id INTO opY;
  INSERT INTO public.ops(numero,ano) VALUES (971003,2097) RETURNING id INTO opA;
  INSERT INTO public.ops(numero,ano) VALUES (971004,2097) RETURNING id INTO opB;

  -- Move-test pairs, each pre-seeded with one tapete item (created ascending so
  -- p<q deterministically).
  INSERT INTO public.ops(numero,ano) VALUES (971101,2097) RETURNING id INTO p1;
  INSERT INTO public.ops(numero,ano) VALUES (971102,2097) RETURNING id INTO q1;
  INSERT INTO public.ops(numero,ano) VALUES (971201,2097) RETURNING id INTO p2;
  INSERT INTO public.ops(numero,ano) VALUES (971202,2097) RETURNING id INTO q2;
  INSERT INTO public.ops(numero,ano) VALUES (971301,2097) RETURNING id INTO p3;
  INSERT INTO public.ops(numero,ano) VALUES (971302,2097) RETURNING id INTO q3;

  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (p1, mt, 10) RETURNING id INTO ip1;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (q1, mt2, 10) RETURNING id INTO iq1;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (q2, mt2, 10) RETURNING id INTO iq2;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (p3, mt, 10) RETURNING id INTO ip3;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (q3, mt2, 10) RETURNING id INTO iq3;

  INSERT INTO public._mi_ids(k,v) VALUES
    ('mt',mt),('mt2',mt2),('mm',mm),
    ('opX',opX),('opY',opY),('opA',opA),('opB',opB),
    ('p1',p1),('q1',q1),('p2',p2),('q2',q2),('p3',p3),('q3',q3),
    ('ip1',ip1),('iq1',iq1),('iq2',iq2),('ip3',ip3),('iq3',iq3);
END
$cf$;
`;

async function partE(handle) {
  await applySql(handle, 'concurrency-fixtures.sql', CONCURRENCY_FIXTURES_SQL, 'concurrency fixtures');
  const id = {};
  for (const k of ['mt', 'mt2', 'mm', 'opX', 'opY', 'opA', 'opB', 'p1', 'q1', 'p2', 'q2', 'p3', 'q3', 'ip1', 'iq1', 'iq2', 'ip3', 'iq3']) {
    id[k] = Number(await scalar(handle, `SELECT v FROM public._mi_ids WHERE k='${k}';`));
    check(Number.isInteger(id[k]) && id[k] > 0, `fixture id ${k} must resolve (got ${id[k]})`);
  }
  check(id.p1 < id.q1 && id.p2 < id.q2 && id.p3 < id.q3, 'move-pair ops must be created ascending (p<q)');

  // ---- E1: concurrent different-type first inserts into empty OP X ----------
  {
    const s1 = openSession(handle, 'E1-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opX}, ${id.mt}, 10); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');

    const s2 = openSession(handle, 'E1-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    // Wrapped so the post-unblock rejection is captured as a value line.
    s2.send(`CREATE TEMP TABLE _o(v text);`);
    s2.send(`DO $$ BEGIN
        INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opX}, ${id.mm}, 20);
        INSERT INTO _o VALUES ('UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO _o VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o;`);

    // S2's INSERT must block on S1's ops(X) row lock.
    await waitForBlock(handle, s2pid, s1pid);
    log('E1', { s1pid, s2pid, s2_blocked_by_s1: true });

    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');

    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && /(misturar|homogenea)/.test(res),
      `E1: the second different-type insert must be rejected (got ${res})`);
    await s1.close();
    await s2.close();

    const shape = await scalar(handle, `
      SELECT count(*) || '/' || count(DISTINCT m.tipo_produto) || '/' || coalesce(max(m.tipo_produto),'')
        FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${id.opX};`);
    check(shape === '1/1/tapete', `E1: OP X must end homogeneous with exactly one tapete item (got ${shape})`);
    log('E1', { outcome: 'one_commit_one_rejection', final_op: shape, homogeneous: true });
  }

  // ---- E2: concurrent SAME-type inserts both succeed -----------------------
  {
    const s1 = openSession(handle, 'E2-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opY}, ${id.mt}, 10); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');

    const s2 = openSession(handle, 'E2-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opY}, ${id.mt2}, 10); SELECT 'S2INS_DONE';`);
    await waitForBlock(handle, s2pid, s1pid);   // serialized on ops(Y), but same type
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    await s2.waitFor((l) => l === 'S2INS_DONE');  // proceeds: same type accepted
    s2.send(`COMMIT; SELECT 'S2COMMIT';`);
    await s2.waitFor((l) => l === 'S2COMMIT');
    await s1.close();
    await s2.close();

    const shape = await scalar(handle, `
      SELECT count(*) || '/' || count(DISTINCT m.tipo_produto)
        FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${id.opY};`);
    check(shape === '2/1', `E2: OP Y must hold two same-type items (got ${shape})`);
    log('E2', { both_committed: true, final_op: shape });
  }

  // ---- E3: inserts into DIFFERENT OPs do not serialize ---------------------
  {
    const s1 = openSession(handle, 'E3-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opA}, ${id.mt}, 10); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');   // holds ops(A), uncommitted

    const s2 = openSession(handle, 'E3-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    // Different OP (B, manta) — must NOT block on S1 (which holds A).
    s2.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${id.opB}, ${id.mm}, 10); SELECT 'S2INS_DONE';`);
    await s2.waitFor((l) => l === 'S2INS_DONE', 10000);
    const blockers = await blockingPids(handle, s2pid);
    check(!blockers.split(',').includes(String(s1pid)), `E3: insert into a different OP must not be blocked by S1 (blockers=${blockers})`);
    s2.send(`COMMIT; SELECT 'S2COMMIT';`);
    await s2.waitFor((l) => l === 'S2COMMIT');
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    await s1.close();
    await s2.close();
    log('E3', { different_ops_serialize: false, s1pid, s2pid });
  }

  // ---- E4: deterministic ascending lock order for a move, BOTH directions --
  // A blocker holds the LOWER op id; a mover that touches {low,high} must wait
  // on the LOWER id WITHOUT having locked the higher (proven by a NOWAIT probe
  // on the higher succeeding). Proven for a forward (p1->q1) and reverse
  // (q2->p2) move, so the lower id is always locked first regardless of source.
  async function proveAscending(label, low, high, itemId, fromOp, toOp) {
    const blk = openSession(handle, `${label}-blk`);
    blk.send('BEGIN;');
    blk.send(`SELECT 'BPID|' || pg_backend_pid();`);
    const bpid = Number((await blk.waitFor((l) => l.startsWith('BPID|'))).split('|')[1]);
    blk.send(`SELECT 1 FROM public.ops WHERE id=${low} FOR UPDATE; SELECT 'BLOCKER_READY';`);
    await blk.waitFor((l) => l === 'BLOCKER_READY');

    const mov = openSession(handle, `${label}-mov`);
    mov.send('BEGIN;');
    mov.send(`SELECT 'MPID|' || pg_backend_pid();`);
    const mpid = Number((await mov.waitFor((l) => l.startsWith('MPID|'))).split('|')[1]);
    // Move item from fromOp -> toOp (touches {low,high}); trigger locks ascending.
    mov.send(`UPDATE public.op_itens SET op_id=${toOp} WHERE id=${itemId}; SELECT 'MOVE_DONE';`);
    await waitForBlock(handle, mpid, bpid);   // mover waits on the LOWER id held by blk

    // The higher op must still be lockable => the mover has NOT locked it yet.
    // (Autocommit: the FOR UPDATE lock is released at DO-block end, so the probe
    // never interferes with the mover's later acquisition of the higher id.)
    const probe = openSession(handle, `${label}-probe`);
    probe.send(`CREATE TEMP TABLE _pp(v text);`);
    probe.send(`SET lock_timeout='1500ms';`);
    probe.send(`DO $$ BEGIN PERFORM 1 FROM public.ops WHERE id=${high} FOR UPDATE;
        INSERT INTO _pp VALUES ('HIGH_FREE'); EXCEPTION WHEN lock_not_available THEN INSERT INTO _pp VALUES ('HIGH_LOCKED'); END $$;`);
    probe.send(`SELECT 'PROBE|' || v FROM _pp;`);
    const probeVal = await probe.waitFor((l) => l.startsWith('PROBE|'));
    await probe.close();
    check(/HIGH_FREE/.test(probeVal), `${label}: mover must not have locked the higher op id ${high} while waiting on the lower ${low} (got ${probeVal})`);

    blk.send('ROLLBACK; SELECT \'BLK_DONE\';');
    await blk.waitFor((l) => l === 'BLK_DONE');
    await mov.waitFor((l) => l === 'MOVE_DONE');   // proceeds once lower id freed
    check(!/deadlock|40P01/i.test(mov.stderr), `${label}: mover must not deadlock`);
    mov.send('ROLLBACK;');
    await blk.close();
    await mov.close();
    log('E4', { case: label, low, high, waited_on_lower_first: true, higher_free_while_waiting: true, no_deadlock: true });
  }
  // Pre-create the probe temp table pattern is handled inside proveAscending.
  await proveAscending('E4a_forward', id.p1, id.q1, id.ip1, id.p1, id.q1);   // move p1->q1, low=p1
  await proveAscending('E4b_reverse', id.p2, id.q2, id.iq2, id.q2, id.p2);   // move q2->p2, low=p2

  // ---- E5: two opposing concurrent moves complete with NO deadlock ---------
  {
    // ma holds both {p3,q3} (locked ascending) via its move p3->q3, uncommitted.
    const ma = openSession(handle, 'E5-ma');
    ma.send('BEGIN;');
    ma.send(`SELECT 'MAPID|' || pg_backend_pid();`);
    const mapid = Number((await ma.waitFor((l) => l.startsWith('MAPID|'))).split('|')[1]);
    ma.send(`UPDATE public.op_itens SET op_id=${id.q3} WHERE id=${id.ip3}; SELECT 'MA_DONE';`);
    await ma.waitFor((l) => l === 'MA_DONE');   // holds ops(p3)+ops(q3)

    // mb opposing move q3->p3; must lock ascending => wait on p3 (held by ma).
    const mb = openSession(handle, 'E5-mb');
    mb.send('BEGIN;');
    mb.send(`SELECT 'MBPID|' || pg_backend_pid();`);
    const mbpid = Number((await mb.waitFor((l) => l.startsWith('MBPID|'))).split('|')[1]);
    mb.send(`UPDATE public.op_itens SET op_id=${id.p3} WHERE id=${id.iq3}; SELECT 'MB_DONE';`);
    await waitForBlock(handle, mbpid, mapid);   // mb waits on ma; no cycle (ma holds both)

    ma.send('COMMIT; SELECT \'MA_COMMIT\';');
    await ma.waitFor((l) => l === 'MA_COMMIT');
    await mb.waitFor((l) => l === 'MB_DONE');    // mb proceeds after ma frees p3
    mb.send('COMMIT; SELECT \'MB_COMMIT\';');
    await mb.waitFor((l) => l === 'MB_COMMIT');
    check(!/deadlock|40P01/i.test(ma.stderr + mb.stderr), 'E5: opposing moves must not deadlock');
    await ma.close();
    await mb.close();
    log('E5', { opposing_moves: 'serialized', deadlock: false });
  }
}

// ===========================================================================
// PART F — finishing-RPC regression (unchanged by db/79).
// gerar_op_latex rejects a Manta origin (17); a Tapete origin still finishes (18).
// ===========================================================================
const FINISHING_PROOF_SQL = `
\\set ON_ERROR_STOP on
\\set admin_uuid '''00000000-0000-4000-8000-00000000fa01'''
BEGIN;
SET LOCAL session_replication_role = replica;

INSERT INTO auth.users(id,email) VALUES (:admin_uuid,'fa-admin@example.invalid') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.usuarios(id,email,nome,tipo,fornecedor_id,cliente_id,ativo,nivel_acesso)
  VALUES (:admin_uuid,'fa-admin@example.invalid','FA Admin','admin',NULL,NULL,TRUE,'completo') ON CONFLICT (id) DO NOTHING;

DO $fa$
DECLARE
  c1 BIGINT; c2 BIGINT; forn_tec BIGINT; forn_latex BIGINT; cli BIGINT; ped UUID; lote BIGINT;
  m_t BIGINT; m_m BIGINT;
  op_manta BIGINT; op_tapete BIGINT; oi_manta BIGINT; oi_tapete BIGINT;
  ent_manta BIGINT; ent_tapete BIGINT;
  v_res JSONB; v_ok BOOLEAN;
BEGIN
  INSERT INTO public.cores(nome) VALUES ('FA-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores(nome) VALUES ('FA-CRU')   RETURNING id INTO c2;
  INSERT INTO public.fornecedores(nome,tipo) VALUES ('FA-TEC','tecelagem') RETURNING id INTO forn_tec;
  INSERT INTO public.fornecedores(nome,tipo) VALUES ('FA-LATEX','latex')   RETURNING id INTO forn_latex;
  INSERT INTO public.clientes(nome) VALUES ('FA-CLI') RETURNING id INTO cli;
  INSERT INTO public.pedidos(cliente_id,numero,status) VALUES (cli,972001,'confirmado') RETURNING id INTO ped;
  INSERT INTO public.lotes(numero,cliente_id,pedido_id) VALUES (972001,cli,ped) RETURNING id INTO lote;

  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('FA-TAP',c1,c2,2.10,'tapete') RETURNING id INTO m_t;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('FA-MAN',c1,c2,1.40,'manta')  RETURNING id INTO m_m;

  -- Manta weaving OP (no lote needed: the Manta guard rejects before the lote check).
  INSERT INTO public.ops(numero,ano,status,tipo) VALUES (972101,2097,'aberta','tecelagem') RETURNING id INTO op_manta;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (op_manta,m_m,100) RETURNING id INTO oi_manta;
  INSERT INTO public.entregas(fornecedor_id,etapa,destino_fornecedor_id) VALUES (forn_tec,'cima',forn_latex) RETURNING id INTO ent_manta;
  INSERT INTO public.entrega_itens(entrega_id,op_id,op_item_id,metros_entregues,defeito)
    VALUES (ent_manta,op_manta,oi_manta,100,FALSE);

  -- Tapete weaving OP with lote/pedido so finishing can fully proceed.
  INSERT INTO public.ops(numero,ano,status,tipo,lote_id) VALUES (972201,2097,'aberta','tecelagem',lote) RETURNING id INTO op_tapete;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (op_tapete,m_t,100) RETURNING id INTO oi_tapete;
  INSERT INTO public.entregas(fornecedor_id,etapa,destino_fornecedor_id) VALUES (forn_tec,'cima',forn_latex) RETURNING id INTO ent_tapete;
  INSERT INTO public.entrega_itens(entrega_id,op_id,op_item_id,metros_entregues,defeito)
    VALUES (ent_tapete,op_tapete,oi_tapete,100,FALSE);

  SET LOCAL session_replication_role = origin;                 -- guards ON.
  -- Literal (not :admin_uuid) so it is unambiguous inside the dollar-quoted body.
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000fa01', true);  -- is_admin() => TRUE.

  -- (17) Manta origin rejected by gerar_op_latex.
  v_ok := FALSE;
  BEGIN
    PERFORM public.gerar_op_latex(ent_manta);
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%e de Manta%' THEN v_ok := TRUE; ELSE RAISE; END IF;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(17): Manta finishing was not rejected'; END IF;

  -- (18) Tapete origin still finishes (creates the latex OP).
  v_res := public.gerar_op_latex(ent_tapete);
  IF NOT (v_res->>'created')::boolean OR (v_res->>'op_latex_id') IS NULL THEN
    RAISE EXCEPTION 'FAIL(18): Tapete finishing did not create a latex OP (%)', v_res;
  END IF;

  RAISE NOTICE 'MANTA_FINISHING_REGRESSION_PASS';
END
$fa$;

SELECT 'MANTA_FINISHING_REGRESSION_PASS' AS result;
ROLLBACK;
`;

async function partF(handle) {
  const out = await applySql(handle, 'finishing.sql', FINISHING_PROOF_SQL, 'finishing regression proof');
  check(/MANTA_FINISHING_REGRESSION_PASS/.test(out), `finishing regression must pass (got: ${out.trim()})`);
  log('PART_F', { manta_origin: 'rejected', tapete_origin: 'finished', result: 'PASS' });
}

// ===========================================================================
// PART G — model-reference concurrency (db/80). Distinct real psql sessions
// prove the model identity used to validate an item cannot change between
// validation and commit. Committed fixtures (973xxx / MG-*) so backends share
// them.
// ===========================================================================
const MRACE_FIXTURES_G_SQL = `
CREATE TABLE IF NOT EXISTS public._mi_ids (k TEXT PRIMARY KEY, v BIGINT);
DO $cg$
DECLARE
  c1 BIGINT; c2 BIGINT;
  tstableA BIGINT; newA BIGINT; tstableB BIGINT; mB BIGINT;
  pC BIGINT; qD BIGINT; e1 BIGINT; e2 BIGINT; eref BIGINT; fa BIGINT; fb BIGINT;
  cli BIGINT; pedC UUID; pedD UUID;
  opA BIGINT; opB BIGINT; opE1 BIGINT; opE2 BIGINT; opEref BIGINT; opF1 BIGINT; opF2 BIGINT;
  ix BIGINT; iy BIGINT;
BEGIN
  INSERT INTO public.cores(nome) VALUES ('MG-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores(nome) VALUES ('MG-CRU')   RETURNING id INTO c2;

  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-TSTABLE-A',c1,c2,2.10,'tapete') RETURNING id INTO tstableA;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-NEW-A',    c1,c2,1.40,'tapete') RETURNING id INTO newA;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-TSTABLE-B',c1,c2,2.10,'tapete') RETURNING id INTO tstableB;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-M-B',      c1,c2,1.40,'tapete') RETURNING id INTO mB;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-P-C',      c1,c2,1.40,'tapete') RETURNING id INTO pC;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-Q-D',      c1,c2,1.40,'tapete') RETURNING id INTO qD;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-E1',       c1,c2,2.10,'tapete') RETURNING id INTO e1;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-E2',       c1,c2,2.10,'tapete') RETURNING id INTO e2;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-EREF',     c1,c2,1.40,'tapete') RETURNING id INTO eref;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-FA',       c1,c2,2.10,'tapete') RETURNING id INTO fa;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto) VALUES ('MG-FB',       c1,c2,2.10,'tapete') RETURNING id INTO fb;

  INSERT INTO public.clientes(nome) VALUES ('MG-CLI') RETURNING id INTO cli;
  INSERT INTO public.pedidos(cliente_id,numero,status) VALUES (cli,973001,'confirmado') RETURNING id INTO pedC;
  INSERT INTO public.pedidos(cliente_id,numero,status) VALUES (cli,973002,'confirmado') RETURNING id INTO pedD;

  INSERT INTO public.ops(numero,ano) VALUES (973101,2097) RETURNING id INTO opA;
  INSERT INTO public.ops(numero,ano) VALUES (973102,2097) RETURNING id INTO opB;
  INSERT INTO public.ops(numero,ano) VALUES (973103,2097) RETURNING id INTO opE1;
  INSERT INTO public.ops(numero,ano) VALUES (973104,2097) RETURNING id INTO opE2;
  INSERT INTO public.ops(numero,ano) VALUES (973105,2097) RETURNING id INTO opEref;
  INSERT INTO public.ops(numero,ano) VALUES (973106,2097) RETURNING id INTO opF1;
  INSERT INTO public.ops(numero,ano) VALUES (973107,2097) RETURNING id INTO opF2;

  -- Committed references: A/B OPs each already hold a stable Tapete item; eref is
  -- referenced by an OP; F OPs each hold one Tapete item to move.
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opA, tstableA, 100);
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opB, tstableB, 100);
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opEref, eref, 100);
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opF1, fa, 100) RETURNING id INTO ix;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opF2, fb, 100) RETURNING id INTO iy;

  INSERT INTO public._mi_ids(k,v) VALUES
    ('g_tstableA',tstableA),('g_newA',newA),('g_tstableB',tstableB),('g_mB',mB),
    ('g_pC',pC),('g_qD',qD),('g_e1',e1),('g_e2',e2),('g_eref',eref),('g_fa',fa),('g_fb',fb),
    ('g_opA',opA),('g_opB',opB),('g_opE1',opE1),('g_opE2',opE2),('g_opEref',opEref),('g_opF1',opF1),('g_opF2',opF2),
    ('g_ix',ix),('g_iy',iy);
END
$cg$;
`;

async function partG(handle) {
  await applySql(handle, 'mrace-fixtures.sql', MRACE_FIXTURES_G_SQL, 'model-race fixtures');
  const g = {};
  for (const k of ['g_tstableA', 'g_newA', 'g_tstableB', 'g_mB', 'g_pC', 'g_qD', 'g_e1', 'g_e2', 'g_eref', 'g_fa', 'g_fb', 'g_opA', 'g_opB', 'g_opE1', 'g_opE2', 'g_opEref', 'g_opF1', 'g_opF2', 'g_ix', 'g_iy']) {
    g[k] = Number(await scalar(handle, `SELECT v FROM public._mi_ids WHERE k='${k}';`));
    check(Number.isInteger(g[k]) && g[k] > 0, `model-race fixture id ${k} must resolve (got ${g[k]})`);
  }
  const pedC = await scalar(handle, `SELECT id FROM public.pedidos WHERE numero=973001;`);
  const pedD = await scalar(handle, `SELECT id FROM public.pedidos WHERE numero=973002;`);

  // Reusable "reference-first blocks a racing model UPDATE, which is rejected once
  // it observes the committed reference" driver. `refSql` establishes the
  // uncommitted reference; `updSql` is the model UPDATE expected to be rejected.
  async function refFirstBlocksModelUpdate(label, refSql, updSql, rejectRe) {
    const s1 = openSession(handle, `${label}-s1`);
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`${refSql} SELECT 'S1REF_DONE';`);
    await s1.waitFor((l) => l === 'S1REF_DONE');

    const s2 = openSession(handle, `${label}-s2`);
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`CREATE TEMP TABLE _o(v text);`);
    s2.send(`DO $$ BEGIN ${updSql} INSERT INTO _o VALUES ('UNEXPECTED_OK'); EXCEPTION WHEN OTHERS THEN INSERT INTO _o VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o;`);

    await waitForBlock(handle, s2pid, s1pid);           // model UPDATE blocks on the reference's FOR SHARE
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && rejectRe.test(res), `${label}: racing model change must be rejected after the committed reference (got ${res})`);
    await s1.close();
    await s2.close();
    return { s1pid, s2pid };
  }

  // ---- A: OP first-reference wins -----------------------------------------
  {
    const { s1pid, s2pid } = await refFirstBlocksModelUpdate('MRACE_A',
      `INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${g.g_opA}, ${g.g_newA}, 50);`,
      `UPDATE public.modelos SET tipo_produto='manta' WHERE id=${g.g_newA};`,
      /imutaveis apos uso/);
    const shape = await scalar(handle, `SELECT count(*)||'/'||count(DISTINCT m.tipo_produto) FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${g.g_opA};`);
    check(shape === '2/1', `A: OP must remain homogeneous (2 tapete items) (got ${shape})`);
    log('MRACE_A', { s1pid, s2pid, s2_blocked: true, model_update: 'rejected(immutability)', final_op: shape });
  }

  // ---- B: MODEL update wins ------------------------------------------------
  {
    const s1 = openSession(handle, 'MRACE_B-s1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`UPDATE public.modelos SET tipo_produto='manta' WHERE id=${g.g_mB}; SELECT 'S1UPD_DONE';`);
    await s1.waitFor((l) => l === 'S1UPD_DONE');        // mB now manta, uncommitted, holds exclusive row lock

    const s2 = openSession(handle, 'MRACE_B-s2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`CREATE TEMP TABLE _o(v text);`);
    s2.send(`DO $$ BEGIN
        INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${g.g_opB}, ${g.g_mB}, 50);
        INSERT INTO _o VALUES ('UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO _o VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o;`);
    await waitForBlock(handle, s2pid, s1pid);           // op_item FOR SHARE blocks on the model UPDATE's exclusive lock
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && /(misturar|homogenea)/.test(res), `B: op_item must be rejected against the committed manta identity (got ${res})`);
    await s1.close();
    await s2.close();
    const shape = await scalar(handle, `SELECT count(*)||'/'||count(DISTINCT m.tipo_produto) FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${g.g_opB};`);
    check(shape === '1/1', `B: OP must remain homogeneous (only the stable tapete item) (got ${shape})`);
    log('MRACE_B', { s1pid, s2pid, s2_blocked: true, op_item: 'rejected(homogeneity)', final_op: shape });
  }

  // ---- C: PEDIDO first-reference wins --------------------------------------
  {
    const { s1pid, s2pid } = await refFirstBlocksModelUpdate('MRACE_C',
      `INSERT INTO public.pedido_itens(pedido_id,modelo_id,metros,ordem) VALUES ('${pedC}', ${g.g_pC}, 100, 1);`,
      `UPDATE public.modelos SET tipo_produto='manta' WHERE id=${g.g_pC};`,
      /imutaveis apos uso/);
    const tipo = await scalar(handle, `SELECT tipo_produto FROM public.modelos WHERE id=${g.g_pC};`);
    check(tipo === 'tapete', `C: pedido item's model identity must stay tapete (got ${tipo})`);
    log('MRACE_C', { s1pid, s2pid, s2_blocked: true, model_update: 'rejected(immutability)', pedido_model_tipo: tipo });
  }

  // ---- D: MODEL update before Pedido item ----------------------------------
  {
    const s1 = openSession(handle, 'MRACE_D-s1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`UPDATE public.modelos SET tipo_produto='manta' WHERE id=${g.g_qD}; SELECT 'S1UPD_DONE';`);
    await s1.waitFor((l) => l === 'S1UPD_DONE');

    const s2 = openSession(handle, 'MRACE_D-s2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`CREATE TEMP TABLE _o(v text);`);
    // Invalid Manta width override (2.10) validated against the NEW committed type.
    s2.send(`DO $$ BEGIN
        INSERT INTO public.pedido_itens(pedido_id,modelo_id,metros,largura,ordem) VALUES ('${pedD}', ${g.g_qD}, 100, 2.10, 1);
        INSERT INTO _o VALUES ('UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO _o VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o;`);
    await waitForBlock(handle, s2pid, s1pid);
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && /Manta so admite largura 1\.40/.test(res), `D: invalid Manta width override must be rejected against the new committed type (got ${res})`);
    await s1.close();
    await s2.close();
    log('MRACE_D', { s1pid, s2pid, s2_blocked: true, width_override: 'rejected', validated_against: 'new committed manta identity' });
  }

  // ---- E: NON-CONTENTION ---------------------------------------------------
  {
    // E.1 two concurrent references to the SAME model (different OPs) must not
    // serialize (FOR SHARE is compatible with FOR SHARE).
    const s1 = openSession(handle, 'MRACE_E-s1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${g.g_opE1}, ${g.g_e1}, 10); SELECT 'S1REF';`);
    await s1.waitFor((l) => l === 'S1REF');             // holds FOR SHARE on e1, uncommitted

    const s2 = openSession(handle, 'MRACE_E-s2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (${g.g_opE2}, ${g.g_e1}, 10); SELECT 'S2REF';`);
    await s2.waitFor((l) => l === 'S2REF', 10000);      // must NOT block
    const blockers = await blockingPids(handle, s2pid);
    check(!blockers.split(',').includes(String(s1pid)), `E: concurrent reference to the same model must not serialize (blockers=${blockers})`);
    s1.send('COMMIT; SELECT \'S1COMMIT\';');
    s2.send('COMMIT; SELECT \'S2COMMIT\';');
    await s1.waitFor((l) => l === 'S1COMMIT');
    await s2.waitFor((l) => l === 'S2COMMIT');
    await s1.close();
    await s2.close();

    // E.2 metadata-only (nome) edit + E.3 same-value tipo/largura update on a
    // referenced model remain permitted (db/79 behavior preserved).
    const meta = await applySql(handle, 'mrace-meta.sql',
      `\\set ON_ERROR_STOP on
       BEGIN;
       DO $$ BEGIN
         UPDATE public.modelos SET nome='MG-EREF-RENAMED' WHERE id=${g.g_eref};
         UPDATE public.modelos SET tipo_produto=tipo_produto, largura=largura WHERE id=${g.g_eref};
       END $$;
       SELECT 'MRACE_E_META_PASS' AS result;
       ROLLBACK;`, 'model-race metadata edit');
    check(/MRACE_E_META_PASS/.test(meta), `E: nome edit + same-value update on a referenced model must be permitted (got ${meta.trim()})`);
    log('MRACE_E', { same_model_refs_serialize: false, nome_edit: 'allowed', same_value_update: 'allowed' });
  }

  // ---- F: DEADLOCK — opposing item modelo_id moves -------------------------
  {
    // ma: move ix from fa->fb (opF1). mb: move iy from fb->fa (opF2). Different
    // OPs (no ops serialization), same model pair {fa,fb}; both take FOR SHARE on
    // {fa,fb} ascending -> compatible, so neither blocks and neither deadlocks.
    const ma = openSession(handle, 'MRACE_F-ma');
    ma.send('BEGIN;');
    ma.send(`SELECT 'MAPID|' || pg_backend_pid();`);
    const mapid = Number((await ma.waitFor((l) => l.startsWith('MAPID|'))).split('|')[1]);
    ma.send(`UPDATE public.op_itens SET modelo_id=${g.g_fb} WHERE id=${g.g_ix}; SELECT 'MA_DONE';`);
    await ma.waitFor((l) => l === 'MA_DONE');

    const mb = openSession(handle, 'MRACE_F-mb');
    mb.send('BEGIN;');
    mb.send(`SELECT 'MBPID|' || pg_backend_pid();`);
    const mbpid = Number((await mb.waitFor((l) => l.startsWith('MBPID|'))).split('|')[1]);
    mb.send(`UPDATE public.op_itens SET modelo_id=${g.g_fa} WHERE id=${g.g_iy}; SELECT 'MB_DONE';`);
    await mb.waitFor((l) => l === 'MB_DONE', 10000);    // FOR SHARE compatible -> not blocked
    const blockers = await blockingPids(handle, mbpid);
    check(!blockers.split(',').includes(String(mapid)), `F: opposing item moves on shared model locks must not block (blockers=${blockers})`);

    ma.send('COMMIT; SELECT \'MA_COMMIT\';');
    mb.send('COMMIT; SELECT \'MB_COMMIT\';');
    await ma.waitFor((l) => l === 'MA_COMMIT');
    await mb.waitFor((l) => l === 'MB_COMMIT');
    check(!/deadlock|40P01/i.test(ma.stderr + mb.stderr), 'F: opposing item moves must not deadlock');
    await ma.close();
    await mb.close();
    // Both invariants hold: each OP homogeneous, each item at its new model.
    const fShape = await scalar(handle, `
      SELECT (SELECT count(DISTINCT m.tipo_produto) FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${g.g_opF1}) || '/' ||
             (SELECT count(DISTINCT m.tipo_produto) FROM public.op_itens oi JOIN public.modelos m ON m.id=oi.modelo_id WHERE oi.op_id=${g.g_opF2}) || '/' ||
             (SELECT modelo_id FROM public.op_itens WHERE id=${g.g_ix}) || '/' ||
             (SELECT modelo_id FROM public.op_itens WHERE id=${g.g_iy});`);
    check(fShape === `1/1/${g.g_fb}/${g.g_fa}`, `F: final state must satisfy route+identity invariants (got ${fShape}, want 1/1/${g.g_fb}/${g.g_fa})`);
    log('MRACE_F', { opposing_moves: 'both_committed', deadlock: false, ascending_model_order: true, final: fShape });
  }
}

// ===========================================================================
// Orchestration + mandatory teardown (Part Z).
// ===========================================================================
async function main() {
  SCRATCH_DIR = await mkdtemp(path.join(tmpdir(), 'manta-invariant-scratch-'));
  let handle = null;
  try {
    handle = await bootstrapCluster({});
    log('CLUSTER', { host: handle.host, port: handle.port, pgVersion: handle.pgVersion, dataDir: handle.dataDir });

    await partA(handle);
    await partB(handle);
    await partC(handle);
    await partC2(handle);
    await partD(handle);
    await partE(handle);
    await partG(handle);
    await partF(handle);
  } finally {
    if (handle) {
      const proof = await handle.stop();
      check(proof.stopResult.ok === true, 'Part Z: cluster stop must report success');
      check(proof.portClosed === true, 'Part Z: cluster port must be closed');
      check(proof.pidAbsent === true, 'Part Z: postmaster PID must be absent');
      check(proof.dirAbsent === true, 'Part Z: data directory must be removed');
      log('PART_Z', { destroyed: true, port_closed: proof.portClosed, pid_absent: proof.pidAbsent, dir_absent: proof.dirAbsent });
    }
    if (SCRATCH_DIR) await rm(SCRATCH_DIR, { recursive: true, force: true });
  }
  check(FAILURES === 0, `${FAILURES} proof(s) failed`);
  log('RESULT', { status: 'MANTA_INVARIANT_ALL_PROOFS_PASS' });
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exitCode = 1;
});
