// tests/manta-expedition-source-invariant.mjs
//
// PHASE-MANTA-B1 disposable-cluster proof of db/81 (Manta expedition source
// foundation) — full-chain apply, idempotent re-apply, the focused schema/guard
// integration test, regression, and distinct-session concurrency.
//
// Governing contract: docs/architecture/MANTA_DIRECT_ROUTE_PHASE_CONTRACT.md.
// Migration: db/81_manta_expedition_source_foundation.sql.
//
// ENVIRONMENT: disposable local PostgreSQL 18.4 ONLY
// (scripts/c3d/bootstrap-disposable-cluster.mjs). This harness NEVER connects to
// any shared/remote/managed host, contains no credential/token/project URL, and
// destroys its cluster before process exit. The Supabase-platform preamble and all
// fixtures are rebuilt in OS temp files outside the repository and removed on exit.
//
// WHAT THIS PROVES, on ONE fresh disposable cluster (then destroyed, Part Z):
//   Part A  full chain db/01..db/81 applies cleanly, in order (corpus injected
//           after db/66 so db/67 reconciles); db/81 terminal objects all present
//           (op_tecelagem_id nullable-latex + exactly-one-source CHECK + partial
//           unique index + the six guard triggers).
//   Part B  db/81 re-applies idempotently with a before/after schema fingerprint
//           proving zero schema/constraint/trigger/function/grant drift.
//   Part C  tests/manta-expedition-source.integration.sql passes against db/01..81
//           (exactly-one-source; route validation; membership; consumed-output
//           immutability; retificacao escape; reopening; Tapete unchanged).
//   Part D  regression: tests/manta-product-identity.integration.sql still passes
//           (db/78-80 identity/route guards unchanged by db/81); the Manta
//           finishing rejection is intact (gerar_op_latex / _split still reject a
//           Manta origin — db/81 does not touch them); and the C5A purchase-order
//           emission integration test still passes on the reconciled corpus.
//   Part E  distinct-session concurrency (real psql backends, pg_blocking_pids
//           evidence):
//             E1 two sessions create an expedition for the SAME Manta OP -> exactly
//                one commit + one controlled rejection (the partial unique index);
//                the loser blocks on the source-OP FOR UPDATE lock held by the
//                winner. Final state: one expedition.
//             E2 concurrent expedicao_itens writes cannot cross sources or overtake
//                a source change: a cross-OP item writer blocks on the source-OP
//                lock held by a valid item writer, then is rejected against the
//                committed source. No item overtakes the lock.
//             E3 creations for DIFFERENT Manta OPs do NOT serialize (per-OP lock
//                granularity) and complete with no deadlock (40P01).
//   Part Z  mandatory full cluster destruction (pid absent, port closed, dir
//           absent; no c3d-disposable-pg-* residue from this run).
//
// Run:  node tests/manta-expedition-source-invariant.mjs
// Exits nonzero on any missing or failed proof.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bootstrapCluster,
  getRepoRoot,
  isPidAlive,
  isPortOpen,
  DATA_DIR_PREFIX,
} from '../scripts/c3d/bootstrap-disposable-cluster.mjs';

const REPO_ROOT = getRepoRoot();
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Supabase-platform preamble a bare PG 18.4 cluster lacks (applied before db/01).
// Verbatim idiom from tests/manta-product-identity-invariant.mjs. No remote host,
// credential or token.
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

// Classification-faithful 64-row purchase-order corpus (after db/66, before db/67;
// db/67 hard-asserts 64/27/12/13/12). Byte-for-byte the corpus from
// tests/manta-product-identity-invariant.mjs. Inert for the Manta expedition
// guards; lets the full chain apply and the C5A emission test run on the
// reconciled 64/51/51/51/51 state.
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

// Distinct-session concurrency fixtures (committed so concurrent backends share
// them). Planted with triggers OFF (session_replication_role=replica) so the
// db/78-81 guards do not fire during planting; the guards are exercised live by
// the concurrent sessions. EXP_C is a pre-existing Manta expedition (no items yet)
// used by the E2 cross-source item race.
const CONCURRENCY_FIXTURES_SQL = `
CREATE TABLE IF NOT EXISTS public._b1_ids (k TEXT PRIMARY KEY, v BIGINT);
SET session_replication_role = replica;
DO $cf$
DECLARE
  c1 BIGINT; c2 BIGINT; mm BIGINT;
  cli BIGINT; ped UUID; lote BIGINT;
  opA BIGINT; opB BIGINT; opC BIGINT; opD BIGINT;
  itA BIGINT; itB BIGINT; itC BIGINT; itD BIGINT;
  expC BIGINT;
BEGIN
  INSERT INTO public.cores(nome) VALUES ('B1-CONC-KRAFT') RETURNING id INTO c1;
  INSERT INTO public.cores(nome) VALUES ('B1-CONC-CRU')   RETURNING id INTO c2;
  INSERT INTO public.modelos(nome,cor_1_id,cor_2_id,largura,tipo_produto)
    VALUES ('B1-CONC-MANTA', c1, c2, 1.40, 'manta') RETURNING id INTO mm;

  INSERT INTO public.clientes(nome) VALUES ('B1-CONC-CLI') RETURNING id INTO cli;
  INSERT INTO public.pedidos(cliente_id, numero, status) VALUES (cli, 985001, 'confirmado') RETURNING id INTO ped;
  INSERT INTO public.lotes(numero, cliente_id, pedido_id) VALUES (985001, cli, ped) RETURNING id INTO lote;

  INSERT INTO public.ops(numero,ano,status,tipo,lote_id) VALUES (985001,2026,'concluida','tecelagem',lote) RETURNING id INTO opA;
  INSERT INTO public.ops(numero,ano,status,tipo,lote_id) VALUES (985002,2026,'concluida','tecelagem',lote) RETURNING id INTO opB;
  INSERT INTO public.ops(numero,ano,status,tipo,lote_id) VALUES (985003,2026,'concluida','tecelagem',lote) RETURNING id INTO opC;
  INSERT INTO public.ops(numero,ano,status,tipo,lote_id) VALUES (985004,2026,'concluida','tecelagem',lote) RETURNING id INTO opD;

  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opA, mm, 100) RETURNING id INTO itA;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opB, mm, 100) RETURNING id INTO itB;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opC, mm, 100) RETURNING id INTO itC;
  INSERT INTO public.op_itens(op_id,modelo_id,metros_pedidos) VALUES (opD, mm, 100) RETURNING id INTO itD;

  -- Pre-existing Manta expedition on opC (no items yet) for the E2 item race.
  INSERT INTO public.expedicoes(pedido_id, op_tecelagem_id, lote_id, cliente_id)
    VALUES (ped, opC, lote, cli) RETURNING id INTO expC;

  INSERT INTO public._b1_ids(k,v) VALUES
    ('mm',mm),
    ('opA',opA),('opB',opB),('opC',opC),('opD',opD),
    ('itA',itA),('itB',itB),('itC',itC),('itD',itD),
    ('expC',expC),('ped_lote', lote),('cli', cli);
END
$cf$;
SET session_replication_role = origin;
`;

// ---------------------------------------------------------------------------
// Small utilities (mirror the accepted idiom in the Manta identity harness).
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

// Interactive line-sentinel psql session (verbatim idiom from the identity harness).
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
// bodies, table + routine grants) — proves idempotent re-apply causes no drift.
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
// PART A — full chain apply (db/01..81) + terminal-object presence.
// ===========================================================================
async function partA(handle) {
  const manifest = await resolveManifest();
  check(manifest.length === 81, `manifest must be db/01..db/81 (got ${manifest.length})`);
  check(manifest[manifest.length - 1].n === 81, `terminal migration must be db/81 (got ${manifest[manifest.length - 1].n})`);

  await applySql(handle, 'preamble.sql', PREAMBLE_SQL, 'preamble');
  for (const { n, file } of manifest) {
    applyFile(handle, file, path.basename(file));
    if (n === 66) await applySql(handle, 'corpus.sql', CORPUS_SQL, 'corpus (after db/66, before db/67)');
  }

  const objs = await scalar(handle, `
    SELECT (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='expedicoes' AND column_name='op_tecelagem_id') || '/' ||
           (SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='expedicoes' AND column_name='op_latex_id') || '/' ||
           (SELECT count(*) FROM pg_constraint WHERE conname='expedicoes_exactly_one_source_chk') || '/' ||
           (SELECT count(*) FROM pg_class WHERE relname='expedicoes_op_tecelagem_id_uk' AND relkind='i') || '/' ||
           (SELECT count(*) FROM pg_trigger WHERE NOT tgisinternal AND tgname IN (
              'expedicoes_source_validation_guard','expedicao_itens_membership_guard',
              'op_itens_expedicao_reference_guard','entrega_itens_manta_consumo_guard',
              'entregas_manta_consumo_guard','ops_manta_reopen_guard'));`);
  check(objs === '1/YES/1/1/6', `db/81 terminal objects must all exist (tec_col/latex_nullable/chk/uk/triggers = ${objs})`);
  log('PART_A', { migrations: manifest.length, terminal: 81, objects: objs, clean_apply: true });
}

// ===========================================================================
// PART B — db/81 idempotent re-apply with zero drift.
// ===========================================================================
async function partB(handle) {
  const before = await schemaFingerprint(handle);
  applyFile(handle, path.join(REPO_ROOT, 'db', '81_manta_expedition_source_foundation.sql'), 'db/81 re-apply');
  const after = await schemaFingerprint(handle);
  check(before === after, `idempotent re-apply of db/81 must cause zero schema drift (before=${before}, after=${after})`);
  log('PART_B', { fingerprint_stable: true, reapply: 'db/81', drift: 'none' });
}

// ===========================================================================
// PART C — the focused db/81 schema/guard integration test.
// ===========================================================================
async function partC(handle) {
  const file = path.join(HERE, 'manta-expedition-source.integration.sql');
  const out = applyFile(handle, file, 'manta-expedition-source.integration.sql');
  check(/MANTA_EXPEDITION_SOURCE_INTEGRATION_PASS/.test(out),
    `integration test must emit its PASS sentinel (got: ${out.trim().split(/\r?\n/).slice(-3).join(' / ')})`);
  log('PART_C', { integration_test: 'manta-expedition-source.integration.sql', result: 'PASS' });
}

// ===========================================================================
// PART D — regression: identity guards, finishing rejection, C5A emission.
// ===========================================================================
async function partD(handle) {
  // D1: db/78-80 identity/route guards unchanged by db/81.
  const idOut = applyFile(handle, path.join(HERE, 'manta-product-identity.integration.sql'), 'manta-product-identity.integration.sql');
  check(/MANTA_PRODUCT_IDENTITY_INTEGRATION_PASS/.test(idOut),
    `db/78-80 identity integration test must still pass (got: ${idOut.trim().split(/\r?\n/).slice(-3).join(' / ')})`);

  // D2: Manta finishing rejection intact — db/81 does not touch these functions.
  const fin = await scalar(handle, `
    SELECT (CASE WHEN pg_get_functiondef('public.gerar_op_latex(bigint)'::regprocedure) LIKE '%e de Manta%' THEN 'latex_ok' ELSE 'latex_MISSING' END)
        || '/' ||
           (CASE WHEN pg_get_functiondef('public.gerar_op_latex_split(bigint,text)'::regprocedure) LIKE '%e de Manta%' THEN 'split_ok' ELSE 'split_MISSING' END);`);
  check(fin === 'latex_ok/split_ok', `Manta finishing rejection must remain in gerar_op_latex/_split (got ${fin})`);

  // D3: C5 purchase-order emission regression on the reconciled corpus.
  const recon = await scalar(handle, `
    SELECT (SELECT count(*) FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FROM public.ordem_compra) || '/' ||
           (SELECT count(*) FROM public.ordem_compra_item);`);
  check(recon.startsWith('64/51/51'), `C5 corpus must be reconciled 64/51/51 before the emission test (got ${recon})`);
  const c5 = applyFile(handle, path.join(HERE, 'ordem-compra-c5a-emission-readiness.integration.sql'), 'ordem-compra-c5a-emission-readiness.integration.sql');
  check(/C5A_EMISSION_READINESS_INTEGRATION_PASS/.test(c5),
    `C5A emission test must still pass (got: ${c5.trim().split(/\r?\n/).slice(-3).join(' / ')})`);
  log('PART_D', { identity_regression: 'PASS', finishing_rejection: fin, c5_reconciliation: recon.split(' ')[0], c5a_emission: 'PASS' });
}

// ===========================================================================
// PART E — distinct-session concurrency.
// ===========================================================================
async function partE(handle) {
  await applySql(handle, 'concurrency-fixtures.sql', CONCURRENCY_FIXTURES_SQL, 'concurrency fixtures');
  const id = {};
  for (const k of ['mm', 'opA', 'opB', 'opC', 'opD', 'itA', 'itB', 'itC', 'itD', 'expC', 'ped_lote', 'cli']) {
    id[k] = Number(await scalar(handle, `SELECT v FROM public._b1_ids WHERE k='${k}';`));
    check(Number.isInteger(id[k]) && id[k] > 0, `fixture id ${k} must resolve (got ${id[k]})`);
  }
  const pedC = await scalar(handle, `SELECT pedido_id FROM public.expedicoes WHERE id=${id.expC};`);
  check(/^[0-9a-f-]{36}$/.test(pedC), `expedition C must resolve its pedido (got ${pedC})`);

  // ---- E1: two sessions create an expedition for the SAME Manta OP (opA) -----
  {
    const s1 = openSession(handle, 'E1-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.expedicoes(pedido_id, op_tecelagem_id, lote_id, cliente_id) VALUES ('${pedC}', ${id.opA}, ${id.ped_lote}, ${id.cli}); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');   // holds ops(opA) FOR UPDATE, uncommitted

    const s2 = openSession(handle, 'E1-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`CREATE TEMP TABLE _o(v text);`);
    s2.send(`DO $$ BEGIN
        INSERT INTO public.expedicoes(pedido_id, op_tecelagem_id, lote_id, cliente_id) VALUES ('${pedC}', ${id.opA}, ${id.ped_lote}, ${id.cli});
        INSERT INTO _o VALUES ('UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO _o VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o;`);

    await waitForBlock(handle, s2pid, s1pid);   // S2 blocks on opA source lock held by S1
    log('E1', { s1pid, s2pid, s2_blocked_by_s1: true });

    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && /(unique|duplicate|única|expedicoes_op_tecelagem_id_uk)/i.test(res),
      `E1: the second creation for the same Manta OP must be rejected (got ${res})`);
    check(!/deadlock|40P01/i.test(s1.stderr + s2.stderr), 'E1: no deadlock');
    await s1.close();
    await s2.close();

    const ct = await scalar(handle, `SELECT count(*) FROM public.expedicoes WHERE op_tecelagem_id=${id.opA};`);
    check(Number(ct) === 1, `E1: exactly one expedition must exist for opA (got ${ct})`);
    log('E1', { outcome: 'one_commit_one_rejection', expeditions_for_opA: ct });
  }

  // ---- E2: concurrent item writes cannot cross sources / overtake source ------
  {
    // S1 inserts a VALID item (opC's item) into EXP_C; holds ops(opC) FOR UPDATE.
    const s1 = openSession(handle, 'E2-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.expedicao_itens(expedicao_id, op_item_id, modelo_id, metros_liberados) VALUES (${id.expC}, ${id.itC}, ${id.mm}, 40); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');

    // S2 attempts a CROSS-OP item (opD's item) into EXP_C; must block on opC, then reject.
    const s2 = openSession(handle, 'E2-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    s2.send(`CREATE TEMP TABLE _o2(v text);`);
    s2.send(`DO $$ BEGIN
        INSERT INTO public.expedicao_itens(expedicao_id, op_item_id, modelo_id, metros_liberados) VALUES (${id.expC}, ${id.itD}, ${id.mm}, 10);
        INSERT INTO _o2 VALUES ('UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO _o2 VALUES ('REJECTED|'||SQLERRM); END $$;`);
    s2.send(`SELECT 'S2RES|' || v FROM _o2;`);

    await waitForBlock(handle, s2pid, s1pid);   // S2 blocks on opC source lock held by S1
    log('E2', { s1pid, s2pid, s2_blocked_on_source: true });

    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    const res = await s2.waitFor((l) => l.startsWith('S2RES|'));
    s2.send('ROLLBACK;');
    check(/REJECTED\|/.test(res) && /(cross-OP|nao pertence)/i.test(res),
      `E2: the cross-OP item must be rejected against the committed source (got ${res})`);
    check(!/deadlock|40P01/i.test(s1.stderr + s2.stderr), 'E2: no deadlock');
    await s1.close();
    await s2.close();

    const shape = await scalar(handle, `
      SELECT count(*) || '/' || count(*) FILTER (WHERE op_item_id=${id.itC}) || '/' || count(*) FILTER (WHERE op_item_id=${id.itD})
        FROM public.expedicao_itens WHERE expedicao_id=${id.expC};`);
    check(shape === '1/1/0', `E2: EXP_C must hold exactly the valid opC item, no cross-OP item (got ${shape})`);
    log('E2', { outcome: 'cross_source_rejected_under_concurrency', items: shape });
  }

  // ---- E3: creations for DIFFERENT Manta OPs do NOT serialize, no deadlock ----
  {
    const s1 = openSession(handle, 'E3-S1');
    s1.send('BEGIN;');
    s1.send(`SELECT 'S1PID|' || pg_backend_pid();`);
    const s1pid = Number((await s1.waitFor((l) => l.startsWith('S1PID|'))).split('|')[1]);
    s1.send(`INSERT INTO public.expedicoes(pedido_id, op_tecelagem_id, lote_id, cliente_id) VALUES ('${pedC}', ${id.opB}, ${id.ped_lote}, ${id.cli}); SELECT 'S1INS_DONE';`);
    await s1.waitFor((l) => l === 'S1INS_DONE');   // holds ops(opB), uncommitted

    const s2 = openSession(handle, 'E3-S2');
    s2.send('BEGIN;');
    s2.send(`SELECT 'S2PID|' || pg_backend_pid();`);
    const s2pid = Number((await s2.waitFor((l) => l.startsWith('S2PID|'))).split('|')[1]);
    // Different OP (opD) — must NOT block on S1 (which holds opB).
    s2.send(`INSERT INTO public.expedicoes(pedido_id, op_tecelagem_id, lote_id, cliente_id) VALUES ('${pedC}', ${id.opD}, ${id.ped_lote}, ${id.cli}); SELECT 'S2INS_DONE';`);
    await s2.waitFor((l) => l === 'S2INS_DONE', 10000);
    const blockers = await blockingPids(handle, s2pid);
    check(!blockers.split(',').includes(String(s1pid)), `E3: creation for a different Manta OP must not block on S1 (blockers=${blockers})`);
    s2.send(`COMMIT; SELECT 'S2COMMIT';`);
    await s2.waitFor((l) => l === 'S2COMMIT');
    s1.send(`COMMIT; SELECT 'S1COMMIT';`);
    await s1.waitFor((l) => l === 'S1COMMIT');
    check(!/deadlock|40P01/i.test(s1.stderr + s2.stderr), 'E3: no deadlock');
    await s1.close();
    await s2.close();
    log('E3', { different_ops_serialize: false, s1pid, s2pid, no_deadlock: true });
  }
}

// ===========================================================================
// PART Z — mandatory full cluster destruction.
// ===========================================================================
async function partZ(handle) {
  const { postmasterPid, host, port, dataDir } = handle;
  const proof = await handle.stop();
  check(proof.stopResult.ok === true, 'Z: pg_ctl stop must report success');
  check(proof.pidAbsent === true, 'Z: postmaster PID must be absent');
  check(proof.portClosed === true, 'Z: port must be closed');
  check(proof.dirAbsent === true, 'Z: data directory must be removed');

  check(isPidAlive(postmasterPid) === false, `Z: postmaster PID ${postmasterPid} must no longer exist`);
  check((await isPortOpen(host, port, 1000)) === false, `Z: ${host}:${port} must no longer listen`);
  await assert.rejects(access(dataDir, fsConstants.F_OK), /ENOENT/, `Z: ${dataDir} must no longer exist`);

  const leftover = (await readdir(tmpdir())).filter((n) => n.startsWith(DATA_DIR_PREFIX) && dataDir.includes(n));
  check(leftover.length === 0, `Z: no ${DATA_DIR_PREFIX}* directory from this run may remain (${leftover.join(',')})`);
  log('PART_Z', { pid_absent: true, port_closed: true, dir_absent: true, postmasterPid, port });
}

// ===========================================================================
// Runner.
// ===========================================================================
async function main() {
  SCRATCH_DIR = await mkdtemp(path.join(tmpdir(), 'b1-expedition-scratch-'));
  let handle = null;
  try {
    handle = await bootstrapCluster({});
    log('CLUSTER', { host: handle.host, port: handle.port, pgVersion: handle.pgVersion, pid: handle.postmasterPid });
    await partA(handle);
    await partB(handle);
    await partC(handle);
    await partD(handle);
    await partE(handle);
    await partZ(handle);
    handle = null;   // destroyed by partZ
    log('RESULT', { failures: FAILURES, status: FAILURES === 0 ? 'ALL_PROOFS_PASSED' : 'FAILED' });
  } finally {
    if (handle) { try { await handle.stop(); } catch { /* best effort */ } }
    if (SCRATCH_DIR) { try { await rm(SCRATCH_DIR, { recursive: true, force: true }); } catch { /* best effort */ } }
  }
  if (FAILURES > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exitCode = 1;
});
