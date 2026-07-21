// tests/ordem-compra-c3d-lock-concurrency.mjs
//
// PHASE-C3D-E — Session advisory lock, deterministic resource locking, Component B
// concurrency, idempotency, LIFO reversal, imported-balance floor, and the ONE
// authorized synthetic PONR crossing per disposable rehearsal cluster.
//
// Governing contract: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md
//   (§C C3D-E row; §D Option 2; §E entry/exit gates; §G items 7-8; §H the exact
//   11-step synthetic PONR crossing; §I names EXACTLY this one file; §L PONR
//   constants; §M OC-C3D-LOCK-001 exit criteria). Primary requirement
//   OC-C3D-LOCK-001 (ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §R.29.5).
//
// WHAT THIS PROVES, across TWO independently bootstrapped fresh disposable local
// PostgreSQL 18.4 clusters (Part M), each crossing the synthetic PONR exactly
// once and then destroyed (Part L):
//   * Part C  session advisory-lock: deterministic key, same-generation
//     exclusion, different-generation independence, release/reacquire,
//     backend-disconnect auto-release, owner-only command boundary, no leak.
//   * Part D  the INSTALLED Component B resource-lock order (empirical
//     pg_get_functiondef proof) + D.1 a real staged-blocker wait proof, rolled
//     back pre-PONR with no mutation and no leaked lock.
//   * Part E  pre-PONR cutover preparation: real session lock + real
//     fence_and_snapshot + the accepted synthetic equivalent of
//     import_and_reconcile (real per-row import_snapshot_row + real
//     assert_snapshot_and_live, WITHOUT the real-corpus-only 39/44/20221.280
//     assert_import_reconciled totals gate) establishing the target's 5.000 kg
//     imported opening balance as ONE immutable canonical ledger line; then the
//     minimum valid TEST-ONLY canonical_active state set MANUALLY (close_final_acl
//     and activate are NEVER invoked); Component A resolves the target row.
//   * Part F  two real sessions T1/T2 on the same compat-mapped item: T1 commits
//     a productive Component B increase (the synthetic PONR — productive_receipt
//     _started_at becomes non-NULL), T2 waits on the row lock, then re-evaluates
//     its absolute-total delta FRESH against the committed 10.000 kg (no stale
//     20.000 kg result).
//   * Part G  idempotency: same key/same payload deterministic replay; same
//     key/different payload -> idempotencia_conflitante; actor-scoped identity.
//   * Part H  the legitimate nested canonical-active inventory path
//     (ordem_compra_item.kg_recebido at pg_trigger_depth()>1; movement rows;
//     the saldo_fios/saldo_fios_op depth>1 canonical_active exception proven
//     structurally and by depth-1 denial probes; saldo_fios_op NOT_APPLICABLE).
//   * Part I  deterministic LIFO reversal 15.000 -> 8.000 (all of T2's 5.000 kg,
//     then exactly 2.000 kg of T1, leaving 3.000 kg; imported 5.000 kg untouched).
//   * Part J  the imported-balance immutable floor (reduce to 4.000 kg rejected
//     with reducao_abaixo_saldo_importado; zero mutation; total stays 8.000 kg).
//   * Part K  post-PONR prohibition compliance (no pre_ponr_rollback, no
//     legacy_active regression, sessions closed, no leaked lock, deadlocks
//     unchanged).
//   * Part L  mandatory full cluster destruction (postmaster PID absent, port
//     closed, data directory absent, no c3d-disposable-pg-* residue, no scratch
//     SQL file created by the run remains).
//
// ENVIRONMENT: disposable local PostgreSQL 18.4 only (scripts/c3d/bootstrap-
// disposable-cluster.mjs). The shared development database ucrjtfswnfdlxwtmxnoo
// is inspected read-only OUTSIDE this file (Part A/N); this file NEVER connects
// to any shared/remote/managed host, contains no credential/token/project URL,
// and performs its one authorized synthetic PONR crossing exclusively inside a
// disposable cluster that is destroyed immediately afterward. The Supabase-
// platform preamble and the classification-faithful 64-row corpus are external
// to the committed migrations; this file rebuilds them in OS temp files outside
// the repository and removes them before process exit.
//
// STRUCTURAL POLICY: one cohesive integration harness (CODE_HEALTH_RULES §7).
// Live cross-session lock observation, barriers, real backend PIDs, pg_locks /
// pg_stat_activity inspection, a single committed synthetic-PONR crossing, and
// mandatory teardown must share one process; splitting them across committed
// files would break the shared-session/barrier/teardown invariants. No unrelated
// functionality; no duplicated code (helpers are factored).
//
// Run:  node tests/ordem-compra-c3d-lock-concurrency.mjs
// Exits nonzero on any missing or failed proof.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readdir, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import {
  bootstrapCluster,
  getRepoRoot,
  isPidAlive,
  isPortOpen,
  DATA_DIR_PREFIX,
} from '../scripts/c3d/bootstrap-disposable-cluster.mjs';

// ---------------------------------------------------------------------------
// Synthetic identities and fixture constants (PHASE-C3D-E order).
// ---------------------------------------------------------------------------
const ADMIN_UUID = '00000000-0000-4000-8000-00000000c3a1';
const SUPPLIER_UUID = '00000000-0000-4000-8000-00000000c3b1';
const FORNECEDOR_ID = 930000301;
const TARGET_FLAT_ID = 930000311;
const PRIMARY_GEN = 930005001;
const CONTROL_GEN = 930005002;
const RECEIPT_DATE = '2026-07-21';
const IMPORTED_FLOOR = 5.0;

const REPO_ROOT = getRepoRoot();
const HERE = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Embedded SQL — Supabase-platform preamble (applied before db/01), the
// classification-faithful 64-row corpus (applied after db/66, before db/67),
// and the synthetic actor identities (applied after db/76). None reference a
// remote host, credential, or token.
// ---------------------------------------------------------------------------
const PREAMBLE_SQL = `
-- C3D disposable-cluster preamble: platform objects a bare PG 18.4 cluster lacks.
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

const CORPUS_SQL = `
-- C3D classification-faithful 64-row corpus (after db/66, before db/67).
INSERT INTO public.cores (id, nome) VALUES (930000201, 'C3D-CORPUS-COR-ALGODAO')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fornecedores (id, nome, tipo) VALUES
  (930000301, 'C3D-CORPUS-FORN-A (matching)', 'fio_algodao'),
  (930000302, 'C3D-CORPUS-FORN-B (control)',  'fio_algodao')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ops (id, numero, ano) VALUES (930000101, 990001, 2099)
  ON CONFLICT (id) DO NOTHING;
-- Inventory baseline row for the target material/color: makes fence_and_snapshot's
-- inventory baseline non-empty and gives the Part H depth-1 denial probe a real
-- saldo_fios row to target (a 0-row UPDATE would never fire the protected guard).
INSERT INTO public.saldo_fios (tipo, cor_id, cor_poliester, kg_total)
  VALUES ('algodao', 930000201, NULL, 100.000)
  ON CONFLICT DO NOTHING;

-- Two required specific rows (both Class B = emitida/pendente).
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

-- 62 filler rows (930000313..930000374): A=27, B=+10, C=13, D=12.
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
    RAISE EXCEPTION 'C3D corpus mismatch: total=%, A=%, B=%, C=%, D=% (expected 64/27/12/13/12)', v_tot, v_a, v_b, v_c, v_d;
  END IF;
END
$corpus$;
`;

const ACTORS_SQL = `
-- Synthetic authenticated identities (after db/76). Planted under
-- session_replication_role=replica so they bypass business triggers only for
-- the identity rows; no protected/business row is created or mutated here.
SET session_replication_role = replica;
INSERT INTO auth.users(id, email) VALUES
  ('${ADMIN_UUID}',    'c3de-admin@example.invalid'),
  ('${SUPPLIER_UUID}', 'c3de-supplier@example.invalid')
  ON CONFLICT (id) DO NOTHING;
INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, cliente_id, ativo, nivel_acesso) VALUES
  ('${ADMIN_UUID}',    'c3de-admin@example.invalid',    'C3D-E Admin',           'admin',      NULL,            NULL, TRUE, 'completo'),
  ('${SUPPLIER_UUID}', 'c3de-supplier@example.invalid', 'C3D-E MatchingSupplier','fornecedor', ${FORNECEDOR_ID}, NULL, TRUE, 'completo')
  ON CONFLICT (id) DO NOTHING;
SET session_replication_role = origin;
`;

// ---------------------------------------------------------------------------
// Small utilities.
// ---------------------------------------------------------------------------
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let FAILURES = 0;
function check(cond, msg) {
  if (cond) { return true; }
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

// Apply one .sql file synchronously with ON_ERROR_STOP; throw with diagnostics.
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

// ---------------------------------------------------------------------------
// Interactive psql session (line-oriented sentinel protocol). Mirrors the
// accepted idiom in tests/ordem-compra-c3c-inactive-concurrency.mjs /
// tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs.
// ---------------------------------------------------------------------------
function openSession(handle, name) {
  const child = spawn(psqlBinary(handle), [...baseArgs(handle), '-v', 'ON_ERROR_STOP=1'], {
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
  // A session killed via kill() (the C.5 disconnect proof) rejects `completion`
  // with nobody awaiting it; swallow that here so it never becomes an unhandled
  // rejection. close() still awaits the same promise and surfaces real errors.
  completion.catch(() => {});
  return {
    name,
    get closed() { return closed; },
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
    // Abrupt backend disconnect for the auto-release proof (kills the client
    // process so the server backend terminates without an explicit unlock).
    kill() { if (!closed) { try { child.kill('SIGKILL'); } catch { /* already gone */ } } },
    async close() { if (!closed) { try { child.stdin.end('\\q\n'); } catch { /* ignore */ } } return completion; },
  };
}

// One-shot query: returns trimmed non-sentinel output lines.
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

// Evaluate ONE scalar expression as the authenticated actor `uid`. Sends the
// role/JWT setup as its own statement first (so the set_config row never
// pollutes the result), then tags the value line so it is unambiguous. Each
// call is its own transient session. is_local=FALSE keeps the GUC alive across
// the two statements (each interactive statement is its own implicit txn).
async function authScalar(handle, uid, expr) {
  const s = openSession(handle, 'auth-q');
  s.send(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${uid}', FALSE);`);
  s.send(`SELECT 'VAL|' || COALESCE((${expr})::text, '<NULL>');`);
  s.send(`SELECT 'AQ_DONE';`);
  let val = null;
  await s.waitFor((l) => { if (l.startsWith('VAL|')) val = l.slice(4); return l === 'AQ_DONE'; });
  await s.close();
  return val;
}
// Call Component B as `uid`; the RPC runs in its own statement/transaction (so
// its mutation commits) and returns the full JSONB, parsed here.
async function callB(handle, uid, flatId, total, key) {
  const txt = await authScalar(handle, uid,
    `public.registrar_recebimento_ordem_compra_fio_compat(${flatId}, ${total}, DATE '${RECEIPT_DATE}', '${key}', 'c3de-doc', 'c3de-origin')`);
  return JSON.parse(txt);
}

// Poll pg_blocking_pids until the subject backend is blocked by the blocker.
async function waitForBlock(handle, subjectPid, blockerPid, attempts = 200) {
  for (let i = 0; i < attempts; i += 1) {
    const row = await scalar(handle, `
      SELECT array_to_string(pg_catalog.pg_blocking_pids(${subjectPid}), ',')
        || '|' || COALESCE(wait_event_type, '') || '|' || COALESCE(wait_event, '')
      FROM pg_catalog.pg_stat_activity WHERE pid = ${subjectPid};`);
    const [blocking = ''] = row.split('|');
    if (blocking.split(',').includes(String(blockerPid))) return row;
    await delay(50);
  }
  throw new Error(`backend ${subjectPid} did not block on ${blockerPid}`);
}

// ---------------------------------------------------------------------------
// Manifest resolution + cluster build.
// ---------------------------------------------------------------------------
async function resolveManifest() {
  const dbDir = path.join(REPO_ROOT, 'db');
  const entries = await readdir(dbDir);
  const primary = entries
    .filter((f) => /^\d{2,}_.*\.sql$/.test(f) && !/\.verify\.sql$/.test(f) && f !== 'setup_completo.sql')
    .map((f) => ({ n: Number(f.match(/^(\d+)_/)[1]), file: path.join(dbDir, f) }))
    .sort((a, b) => a.n - b.n);
  return primary;
}

async function writeTemp(scratchDir, name, sql) {
  const file = path.join(scratchDir, name);
  await writeFile(file, sql, 'utf8');
  return file;
}

// Apply preamble + db/01..66 + corpus + db/67..76 + actors onto an already
// bootstrapped cluster, and validate the db/67 self-check + reconciliation
// counts. The cluster is created by the caller (runProof) BEFORE the try block
// so that any provisioning failure here still routes the live handle to Part L
// destruction.
async function provisionCluster(handle, runLabel) {
  const scratchDir = await mkdtemp(path.join(tmpdir(), 'c3d-lock-scratch-'));
  handle._scratchDir = scratchDir;
  const manifest = await resolveManifest();
  check(manifest.length === 76, `manifest must be db/01..db/76 (got ${manifest.length})`);

  const preambleFile = await writeTemp(scratchDir, 'preamble.sql', PREAMBLE_SQL);
  const corpusFile = await writeTemp(scratchDir, 'corpus.sql', CORPUS_SQL);
  const actorsFile = await writeTemp(scratchDir, 'actors.sql', ACTORS_SQL);

  applyFile(handle, preambleFile, 'preamble');
  for (const { n, file } of manifest) {
    applyFile(handle, file, path.basename(file));
    if (n === 66) applyFile(handle, corpusFile, 'corpus (after db/66, before db/67)');
  }
  applyFile(handle, actorsFile, 'actors');

  // Validate corpus + reconciliation produced by db/67 and the target shape.
  const shape = await scalar(handle, `
    SELECT (SELECT count(*) FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FILTER (WHERE status_administrativo='emitida' AND status='recebido_total') FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FILTER (WHERE status_administrativo='emitida' AND status='pendente') FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FILTER (WHERE status_administrativo='rascunho' AND status='pendente') FROM public.ordens_compra_fio) || '/' ||
           (SELECT count(*) FILTER (WHERE status_administrativo='rascunho' AND status='recebido_total') FROM public.ordens_compra_fio) || ' recon ' ||
           (SELECT count(*) FROM public.necessidade_compra_fio) || '/' ||
           (SELECT count(*) FROM public.ordem_compra) || '/' ||
           (SELECT count(*) FROM public.ordem_compra_item) || '/' ||
           (SELECT count(*) FROM public.ordem_compra_item_alocacao) || '/' ||
           (SELECT count(*) FROM public.ordem_compra_item_compat_fio);`);
  check(shape.startsWith('64/27/12/13/12 recon 64/51/51/51/51'), `corpus/reconciliation shape unexpected: ${shape}`);
  const target = await scalar(handle, `
    SELECT c.ordem_compra_item_id || '|' || i.kg_pedido || '|' || i.kg_recebido || '|' || a.kg_alocado || '|' || oc.fornecedor_id || '|' || oc.legado
    FROM public.ordem_compra_item_compat_fio c
    JOIN public.ordem_compra_item i ON i.id = c.ordem_compra_item_id
    JOIN public.ordem_compra oc ON oc.id = i.ordem_id
    JOIN public.ordem_compra_item_alocacao a ON a.item_id = i.id
    WHERE c.ordens_compra_fio_id = ${TARGET_FLAT_ID};`);
  const [itemId, kgPed, kgRec, kgAloc, forn, legado] = target.split('|');
  check(Number(kgRec) === 5.0 && Number(kgPed) === 15.5 && Number(kgAloc) === 15.5 && Number(forn) === FORNECEDOR_ID && legado === 'true',
    `target native shape unexpected: ${target}`);
  handle._targetItemId = Number(itemId);
  log('CORPUS', { run: runLabel, classes: '64/27/12/13/12', reconciliation: '64/51/51/51/51', target_item: itemId, target_kg_pedido: kgPed, target_kg_recebido: kgRec, target_kg_alocado: kgAloc, target_fornecedor: forn, legado });
}

// ===========================================================================
// PART C — Session advisory-lock matrix (does not require canonical_active).
// ===========================================================================
async function partC(handle, run) {
  // C.1 deterministic key: stable across connections; distinct per generation;
  // NULL/0/negative rejected by the owner acquire command.
  const k1a = await scalar(handle, `SELECT public.ordem_compra_c3c_lock_key(${PRIMARY_GEN});`);
  const k1b = await scalar(handle, `SELECT public.ordem_compra_c3c_lock_key(${PRIMARY_GEN});`);
  const k2 = await scalar(handle, `SELECT public.ordem_compra_c3c_lock_key(${CONTROL_GEN});`);
  check(k1a === k1b && k1a !== '' , `lock key not stable across connections (${k1a} vs ${k1b})`);
  check(k1a !== k2, `generations must produce distinct keys (${k1a} == ${k2})`);
  // NULL / 0 / negative generation is rejected by the owner acquire command
  // (owner_only_cutover_command, SQLSTATE 42501). Probed in ONE session via a
  // temp table so each SQLSTATE is captured deterministically.
  const rejectRows = await (async () => {
    const s = openSession(handle, 'reject-probe');
    const out = [];
    s.send(`CREATE TEMP TABLE c3de_reject(g text primary key, code text);`);
    s.send(`DO $$ DECLARE arr text[] := ARRAY['NULL','0','-1']; v text; BEGIN
      FOREACH v IN ARRAY arr LOOP
        BEGIN
          IF v='NULL' THEN PERFORM public.ordem_compra_c3c_acquire_session_lock(NULL);
          ELSE PERFORM public.ordem_compra_c3c_acquire_session_lock(v::bigint); END IF;
          INSERT INTO c3de_reject VALUES (v, 'UNEXPECTED_OK');
        EXCEPTION WHEN OTHERS THEN INSERT INTO c3de_reject VALUES (v, SQLSTATE); END;
      END LOOP;
    END $$;`);
    s.send(`SELECT string_agg(g || '=' || code, ',' ORDER BY g) FROM c3de_reject; SELECT 'RP_DONE';`);
    await s.waitFor((l) => { if (l !== 'RP_DONE') out.push(l); return l === 'RP_DONE'; });
    await s.close();
    return out;
  })();
  const rejectStr = rejectRows.join(',');
  check(/(-1|0|NULL)=42501/.test(rejectStr) && (rejectStr.match(/42501/g) || []).length === 3,
    `owner acquire must reject NULL/0/-1 with 42501 (got ${rejectStr})`);
  log('LOCKKEY', { run, gen: PRIMARY_GEN, key: k1a, stable: true, control_gen: CONTROL_GEN, control_key: k2, distinct: true, invalid_rejected: rejectStr });

  // C.2 same-generation exclusion.
  const l1 = openSession(handle, 'L1');
  l1.send(`SELECT 'L1PID|' || pg_backend_pid();`);
  l1.send(`SELECT 'L1ACQ|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  l1.send(`SELECT 'L1HELD|' || public.ordem_compra_c3c_session_lock_held(${PRIMARY_GEN})::text;`);
  const l1pid = Number((await l1.waitFor((l) => l.startsWith('L1PID|'))).split('|')[1]);
  check((await l1.waitFor((l) => l.startsWith('L1ACQ|'))).endsWith('true'), 'L1 must acquire the primary generation lock');
  check((await l1.waitFor((l) => l.startsWith('L1HELD|'))).endsWith('true'), 'L1 must report the lock held');
  const l2 = openSession(handle, 'L2');
  l2.send(`SELECT 'L2PID|' || pg_backend_pid();`);
  l2.send(`SELECT 'L2ACQ|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  l2.send(`SELECT 'L2HELD|' || public.ordem_compra_c3c_session_lock_held(${PRIMARY_GEN})::text;`);
  const l2pid = Number((await l2.waitFor((l) => l.startsWith('L2PID|'))).split('|')[1]);
  check((await l2.waitFor((l) => l.startsWith('L2ACQ|'))).endsWith('false'), 'L2 must NOT acquire the held primary generation lock');
  check((await l2.waitFor((l) => l.startsWith('L2HELD|'))).endsWith('false'), 'L2 must not report the lock held');
  const ownerPid = await scalar(handle, `
    SELECT pid FROM pg_locks
    WHERE locktype='advisory' AND granted AND objsubid=1
      AND classid::bigint = ((public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) >> 32) & 4294967295)
      AND objid::bigint = (public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) & 4294967295);`);
  check(Number(ownerPid) === l1pid, `granted advisory lock must belong to L1 pid ${l1pid} (found ${ownerPid})`);
  log('SESSIONLOCK', { run, phase: 'C2_same_gen_exclusion', L1pid: l1pid, L2pid: l2pid, L2_acquire: false, owner_pid: ownerPid });

  // C.3 different-generation independence.
  l2.send(`SELECT 'L2ACQ2|' || public.ordem_compra_c3c_acquire_session_lock(${CONTROL_GEN})::text;`);
  check((await l2.waitFor((l) => l.startsWith('L2ACQ2|'))).endsWith('true'), 'L2 must acquire the control generation while L1 holds the primary');
  const bothVisible = await scalar(handle, `
    SELECT count(*) FROM pg_locks
    WHERE locktype='advisory' AND granted AND objsubid=1 AND pid IN (${l1pid}, ${l2pid})
      AND ((classid::bigint = ((public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) >> 32) & 4294967295) AND objid::bigint = (public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) & 4294967295))
        OR (classid::bigint = ((public.ordem_compra_c3c_lock_key(${CONTROL_GEN}) >> 32) & 4294967295) AND objid::bigint = (public.ordem_compra_c3c_lock_key(${CONTROL_GEN}) & 4294967295)));`);
  check(Number(bothVisible) === 2, `both generation locks must be visible under their backends (got ${bothVisible})`);
  l2.send(`SELECT 'L2REL2|' || public.ordem_compra_c3c_release_session_lock(${CONTROL_GEN})::text;`);
  check((await l2.waitFor((l) => l.startsWith('L2REL2|'))).endsWith('true'), 'L2 must release the control generation');
  log('SESSIONLOCK', { run, phase: 'C3_diff_gen_independence', control_gen_acquired: true, both_visible: true });

  // C.4 release and reacquire.
  l1.send(`SELECT 'L1REL|' || public.ordem_compra_c3c_release_session_lock(${PRIMARY_GEN})::text;`);
  check((await l1.waitFor((l) => l.startsWith('L1REL|'))).endsWith('true'), 'L1 release must return true');
  l1.send(`SELECT 'L1HELD2|' || public.ordem_compra_c3c_session_lock_held(${PRIMARY_GEN})::text;`);
  check((await l1.waitFor((l) => l.startsWith('L1HELD2|'))).endsWith('false'), 'L1 must no longer report the lock held');
  l2.send(`SELECT 'L2ACQ3|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  check((await l2.waitFor((l) => l.startsWith('L2ACQ3|'))).endsWith('true'), 'L2 must immediately reacquire the released primary generation');
  l2.send(`SELECT 'L2REL3|' || public.ordem_compra_c3c_release_session_lock(${PRIMARY_GEN})::text;`);
  check((await l2.waitFor((l) => l.startsWith('L2REL3|'))).endsWith('true'), 'L2 must release the reacquired lock');
  l2.send(`SELECT 'L2REL4|' || public.ordem_compra_c3c_release_session_lock(${PRIMARY_GEN})::text;`);
  check((await l2.waitFor((l) => l.startsWith('L2REL4|'))).endsWith('false'), 'second release of a not-held lock must return false');
  await l1.close();
  await l2.close();
  log('SESSIONLOCK', { run, phase: 'C4_release_reacquire', release: true, reacquire: true, double_release_false: true });

  // C.5 backend disconnect auto-release.
  const l3 = openSession(handle, 'L3');
  l3.send(`SELECT 'L3PID|' || pg_backend_pid();`);
  l3.send(`SELECT 'L3ACQ|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  const l3pid = Number((await l3.waitFor((l) => l.startsWith('L3PID|'))).split('|')[1]);
  check((await l3.waitFor((l) => l.startsWith('L3ACQ|'))).endsWith('true'), 'L3 must acquire the lock before disconnect');
  l3.kill();
  let pidGone = false; let lockGone = false;
  for (let i = 0; i < 300; i += 1) {
    const present = await scalar(handle, `SELECT count(*) FROM pg_stat_activity WHERE pid = ${l3pid};`);
    const held = await scalar(handle, `
      SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND granted AND objsubid=1 AND pid=${l3pid}
        AND classid::bigint = ((public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) >> 32) & 4294967295)
        AND objid::bigint = (public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) & 4294967295);`);
    if (Number(present) === 0) pidGone = true;
    if (Number(held) === 0) lockGone = true;
    if (pidGone && lockGone) break;
    await delay(50);
  }
  check(pidGone, `L3 backend pid ${l3pid} must disappear from pg_stat_activity after disconnect`);
  check(lockGone, `L3's advisory lock must disappear after disconnect`);
  const l4 = openSession(handle, 'L4');
  l4.send(`SELECT 'L4ACQ|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  l4.send(`SELECT 'L4REL|' || public.ordem_compra_c3c_release_session_lock(${PRIMARY_GEN})::text;`);
  check((await l4.waitFor((l) => l.startsWith('L4ACQ|'))).endsWith('true'), 'L4 must acquire the lock after L3 auto-release');
  check((await l4.waitFor((l) => l.startsWith('L4REL|'))).endsWith('true'), 'L4 must release the lock');
  await l4.close();
  log('SESSIONLOCK', { run, phase: 'C5_disconnect_autorelease', L3pid: l3pid, pid_absent: pidGone, lock_gone: lockGone, L4_reacquired: true });

  // C.6 owner-only boundary: no EXECUTE for authenticated/anon/service_role on
  // either owner session-lock command — the exact "function-privilege denial"
  // the contract accepts (no temporary grant manufactured). An empirical call by
  // any of those roles would therefore raise 42501 before the body runs.
  const ownerProbe = await scalar(handle, `
    SELECT string_agg(r || ':' || split_part(fn,'_',5) || '=' ||
      has_function_privilege(r, 'public.'||fn||'(bigint)', 'EXECUTE')::text, ',' ORDER BY r, fn)
    FROM unnest(ARRAY['anon','authenticated','service_role']) r,
         unnest(ARRAY['ordem_compra_c3c_acquire_session_lock','ordem_compra_c3c_release_session_lock']) fn;`);
  check(!/=true/.test(ownerProbe) && (ownerProbe.match(/=false/g) || []).length === 6,
    `owner-only session-lock commands must deny EXECUTE to authenticated/anon/service_role (got ${ownerProbe})`);
  log('SESSIONLOCK', { run, phase: 'C6_owner_only', function_privilege_denied: ownerProbe });

  // C.7 no leak.
  const leak = await scalar(handle, `
    SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND objsubid=1
      AND (objid::bigint = (public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) & 4294967295)
        OR objid::bigint = (public.ordem_compra_c3c_lock_key(${CONTROL_GEN}) & 4294967295));`);
  check(Number(leak) === 0, `no session advisory lock may remain for either generation (found ${leak})`);
  log('SESSIONLOCK', { run, phase: 'C7_no_leak', remaining_advisory: leak });
}

// ===========================================================================
// PART D — Installed Component B resource-lock order (static) + D.1 staged
// blocker (empirical). D.1 runs after Part E establishes canonical_active but
// before Part F crosses the PONR, and is fully rolled back.
// ===========================================================================
async function partD_static(handle, run) {
  const def = (await query(handle, `SELECT pg_get_functiondef('public.registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)'::regprocedure);`)).join('\n');
  // Unambiguous single-line anchors checked by position. psql -A -t may trim and
  // drop blank lines, but each anchor sits within one preserved line, so relative
  // order is preserved. This is the INSTALLED database definition (§D authority).
  const anchors = [
    ['order_row', 'INTO v_order'],
    ['item_row', 'INTO v_item'],
    ['idem_advisory', "'legacy_compat_receipt_v1|'"],
    ['header_lookup', 'INTO v_header'],
    ['alloc_asc', 'ORDER BY a.id'],
    ['ledger_asc', 'ORDER BY l.id'],
    ['inventory_advisory', "'native_receipt_inventory|'"],
  ];
  const pos = anchors.map(([name, s]) => { const i = def.indexOf(s); check(i >= 0, `installed Component B must contain lock step ${name} (${s})`); return [name, i]; });
  for (let i = 1; i < pos.length; i += 1) check(pos[i - 1][1] < pos[i][1], `installed lock order violated: ${pos[i - 1][0]} must precede ${pos[i][0]}`);
  check(pos[2][1] < pos[3][1], 'idempotency advisory lock must precede the idempotency-header lookup');
  log('LOCKORDER', { run, installed: anchors.map(([n]) => n).join(' -> '), deterministic: true });
}

async function partD1_stagedBlocker(handle, run) {
  // Blocker B1 holds the target order row; a real Component B worker W (admin,
  // absolute total that would increase) must block on the SAME order row lock,
  // then advance when B1 releases. Fully rolled back; no PONR.
  const b1 = openSession(handle, 'D1-blocker');
  b1.send(`BEGIN; SELECT 'B1PID|' || pg_backend_pid();
    SELECT id FROM public.ordem_compra WHERE id = (SELECT ordem_id FROM public.ordem_compra_item WHERE id = ${handle._targetItemId}) FOR UPDATE;
    SELECT 'B1READY';`);
  const b1pid = Number((await b1.waitFor((l) => l.startsWith('B1PID|'))).split('|')[1]);
  await b1.waitFor((l) => l === 'B1READY');

  const w = openSession(handle, 'D1-worker');
  w.send(`SET statement_timeout='30s'; SET lock_timeout='25s';
    SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${ADMIN_UUID}', FALSE);
    BEGIN;
    SELECT 'WPID|' || pg_backend_pid();
    SELECT 'WRESULT|' || public.registrar_recebimento_ordem_compra_fio_compat(${TARGET_FLAT_ID}, 9.000, DATE '${RECEIPT_DATE}', 'c3de-d1-probe', NULL, NULL)::text;`);
  const wpid = Number((await w.waitFor((l) => l.startsWith('WPID|'))).split('|')[1]);
  const evidence = await waitForBlock(handle, wpid, b1pid);
  const [blocking, waitType, waitEvent] = evidence.split('|');
  const noHeaderYet = await scalar(handle, `SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_key='c3de-d1-probe';`);
  check(Number(noHeaderYet) === 0, 'blocked worker must not have created a receipt header');
  log('LOCKORDER', { run, phase: 'D1_staged_blocker', worker_pid: wpid, blocker_pid: b1pid, blocking_pids: blocking, wait_event_type: waitType, wait_event: waitEvent, worker_blocked: true, no_header_yet: true });

  // Release B1 -> worker advances; then roll the worker back (pre-PONR probe).
  b1.send(`ROLLBACK; SELECT 'B1DONE';`);
  await b1.waitFor((l) => l === 'B1DONE');
  const wres = await w.waitFor((l) => l.startsWith('WRESULT|'));
  check(/"ok"\s*:\s*true/.test(wres), `worker must succeed once unblocked (got ${wres})`);
  w.send(`ROLLBACK; RESET ROLE; SELECT 'WDONE';`);
  await w.waitFor((l) => l === 'WDONE');
  await b1.close();
  await w.close();

  const ponr = await scalar(handle, `SELECT COALESCE(productive_receipt_started_at::text,'NULL') FROM public.ordem_compra_cutover WHERE id=1;`);
  // Zero mutation = the rolled-back worker created no receipt under its own key
  // and no productive (recebimento/estorno) ledger line, and the target item is
  // still at its 5.000 imported balance. The 40 legitimate import headers from
  // Part E are unrelated and intentionally not counted here.
  const mutated = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_key='c3de-d1-probe') || '/' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo IN ('recebimento','estorno')) || '/' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId});`);
  check(ponr === 'NULL', `D.1 probe must not cross the PONR (productive_receipt_started_at=${ponr})`);
  check(mutated === '0/0/5.000', `D.1 probe must leave zero mutation (probe_receipts/productive_lines/item_kg=${mutated})`);
  const leak = await scalar(handle, `SELECT count(*) FROM pg_locks WHERE locktype='advisory';`);
  check(Number(leak) === 0, `D.1 probe must leave no advisory lock (found ${leak})`);
  log('LOCKORDER', { run, phase: 'D1_rolled_back', ponr: 'NULL', mutation: 'none', advisory_leak: 0, worker_advanced: true });
}

// ===========================================================================
// PART E — Pre-PONR cutover preparation (real session lock + real
// fence_and_snapshot + synthetic-equivalent per-row import + manual
// canonical_active). close_final_acl / activate are NEVER invoked.
// ===========================================================================
async function partE(handle, run) {
  const prep = openSession(handle, 'E-prep');
  prep.send(`SELECT 'EACQ|' || public.ordem_compra_c3c_acquire_session_lock(${PRIMARY_GEN})::text;`);
  prep.send(`SELECT 'EHELD|' || public.ordem_compra_c3c_session_lock_held(${PRIMARY_GEN})::text;`);
  check((await prep.waitFor((l) => l.startsWith('EACQ|'))).endsWith('true'), 'E: preparation session must acquire the cutover session lock');
  check((await prep.waitFor((l) => l.startsWith('EHELD|'))).endsWith('true'), 'E: cutover session lock must be held by the preparation session');

  // Real fence_and_snapshot: legacy_active -> maintenance_fenced, 51-row snapshot
  // + inventory baseline (the installed count=51 guard passes on the corpus).
  prep.send(`SELECT 'EFENCE|' || public.ordem_compra_c3c_fence_and_snapshot(${PRIMARY_GEN})::text;`);
  const fence = await prep.waitFor((l) => l.startsWith('EFENCE|'));
  check(/"ok"\s*:\s*true/.test(fence) && /"mapping_count"\s*:\s*51/.test(fence), `E: fence_and_snapshot must succeed with 51 mappings (got ${fence})`);

  // Synthetic equivalent of import_and_reconcile: the real per-snapshot-row
  // importer for every snapshot row with kg_recebido>0 (this IS the loop inside
  // ordem_compra_c3c_import_and_reconcile), WITHOUT the real-corpus-only
  // 39/44/20221.280/405.980 assert_import_reconciled totals gate (that gate is
  // recorded, accepted, C3C-A fixture debt — unexecutable on a synthetic corpus).
  prep.send(`DO $imp$ DECLARE r RECORD; BEGIN
    FOR r IN SELECT id FROM public.ordem_compra_cutover_source_snapshot
             WHERE cutover_id=1 AND kg_recebido>0 ORDER BY stable_position LOOP
      PERFORM public.ordem_compra_c3c_import_snapshot_row(r.id);
    END LOOP;
  END $imp$;
  SELECT 'EIMP|' || count(*)::text FROM public.ordem_compra_recebimentos
    WHERE idempotency_namespace='legacy_initial_balance_v1';`);
  const imp = await prep.waitFor((l) => l.startsWith('EIMP|'));
  const importedHeaders = Number(imp.split('|')[1]);
  check(importedHeaders > 0, `E: synthetic per-row import must create import headers (got ${importedHeaders})`);

  // Real source + inventory reconciliation vs live (Part E step 5).
  prep.send(`DO $$ BEGIN PERFORM public.ordem_compra_c3c_assert_snapshot_and_live(${PRIMARY_GEN}); RAISE NOTICE 'ok'; END $$; SELECT 'ERECON|ok';`);
  check((await prep.waitFor((l) => l === 'ERECON|ok')) === 'ERECON|ok', 'E: assert_snapshot_and_live must pass');

  // Target imported opening balance = exactly ONE 5.000 kg immutable line.
  const importLine = await scalar(handle, `
    SELECT count(*) || '|' || COALESCE(sum(kg_recebido),0) || '|' || COALESCE(sum(kg_excesso),0)
    FROM public.ordem_compra_fio_lancamentos
    WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='import_saldo_inicial' AND recebimento_id IS NOT NULL;`);
  check(importLine === '1|5.000|0.000' || importLine === '1|5.000|0', `E: target imported opening balance must be one 5.000 kg line (got ${importLine})`);
  const itemKg = await scalar(handle, `SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId};`);
  check(Number(itemKg) === 5.0, `E: target item kg_recebido must be 5.000 after import (got ${itemKg})`);
  const ponrNull = await scalar(handle, `SELECT COALESCE(productive_receipt_started_at::text,'NULL') FROM public.ordem_compra_cutover WHERE id=1;`);
  check(ponrNull === 'NULL', `E: productive_receipt_started_at must remain NULL through preparation (got ${ponrNull})`);
  const aclNull = await scalar(handle, `SELECT COALESCE(final_acl_closed_at::text,'NULL') FROM public.ordem_compra_cutover WHERE id=1;`);
  check(aclNull === 'NULL', 'E: final_acl_closed_at must be NULL (close_final_acl NOT invoked before manual markers)');

  // Manual minimum-valid TEST-ONLY canonical_active state (Part E step 9). The
  // synthetic final_acl_closed_at / canonical_activated_at exist ONLY because the
  // installed db/75 CHECK requires them for canonical_active; their presence is
  // NOT a claim that close_final_acl or activate ran (both are proven un-invoked
  // by final_acl_closed_at being NULL immediately above and canonical_activated_at
  // being set by this UPDATE, not by ordem_compra_c3c_activate).
  prep.send(`UPDATE public.ordem_compra_cutover SET
      status='canonical_active', read_authority='canonical', reconciliation_status='reconciled',
      cutover_generation=${PRIMARY_GEN}, final_acl_closed_at=clock_timestamp(),
      canonical_activated_at=clock_timestamp(), productive_receipt_started_at=NULL WHERE id=1;
    SELECT 'ECANON|' || status || '/' || read_authority || '/' || reconciliation_status || '/' ||
      (final_acl_closed_at IS NOT NULL)::text || '/' || (canonical_activated_at IS NOT NULL)::text || '/' ||
      COALESCE(productive_receipt_started_at::text,'NULL') FROM public.ordem_compra_cutover WHERE id=1;`);
  const canon = await prep.waitFor((l) => l.startsWith('ECANON|'));
  check(canon.endsWith('canonical_active/canonical/reconciled/true/true/NULL'), `E: manual canonical_active state unexpected (${canon})`);

  // Component A resolves the target row (step 10), as the matching supplier.
  const compA = await authScalar(handle, SUPPLIER_UUID,
    `(SELECT ordens_compra_fio_id || '|' || ordem_compra_id || '|' || ordem_compra_item_id || '|' || fornecedor_id
      FROM public.listar_ordens_compra_fio_compat(NULL, NULL) WHERE ordens_compra_fio_id=${TARGET_FLAT_ID})`);
  check(compA.startsWith(`${TARGET_FLAT_ID}|`) && compA.endsWith(`|${handle._targetItemId}|${FORNECEDOR_ID}`),
    `E: Component A must resolve target ${TARGET_FLAT_ID} to its native order/item (got ${compA})`);

  // Release the cutover session lock; prove none remains.
  prep.send(`SELECT 'EREL|' || public.ordem_compra_c3c_release_session_lock(${PRIMARY_GEN})::text;`);
  check((await prep.waitFor((l) => l.startsWith('EREL|'))).endsWith('true'), 'E: cutover session lock must release');
  await prep.close();
  const remaining = await scalar(handle, `SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND objsubid=1
    AND objid::bigint = (public.ordem_compra_c3c_lock_key(${PRIMARY_GEN}) & 4294967295);`);
  check(Number(remaining) === 0, `E: no session cutover lock may remain before the concurrent receipt test (found ${remaining})`);
  log('CUTOVERPREP', { run, session_lock_held: true, fence: 'ok', imported_headers: importedHeaders, target_import_kg: '5.000', reconcile: 'ok', ponr: 'NULL', close_final_acl: 'NOT_INVOKED', activate: 'NOT_INVOKED', canonical_active: 'set', component_a_resolves: true, lock_released: true });
}

// ===========================================================================
// PART F — Two-session Component B concurrency + the ONE synthetic PONR crossing.
// PART G — idempotency. PART H — nested inventory path (invoked after F).
// ===========================================================================
async function partFGH(handle, run, keys) {
  const deadlocksBefore = Number(await scalar(handle, `SELECT deadlocks FROM pg_stat_database WHERE datname=current_database();`));
  const beforeCounts = await scalar(handle, `SELECT
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId}) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_recebimentos) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos) || '|' ||
    COALESCE((SELECT sum(kg_recebido) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='import_saldo_inicial'),0);`);
  check(beforeCounts.startsWith('5.000|'), `F: initial target total must be 5.000 (got ${beforeCounts})`);
  const observer = openSession(handle, 'F-observer');
  observer.send(`SELECT 'OPID|' || pg_backend_pid();`);
  const oPid = Number((await observer.waitFor((l) => l.startsWith('OPID|'))).split('|')[1]);
  await observer.close(); // block evidence below is gathered by independent observer queries

  // T1: BEGIN + increase to 10.000, keep the transaction open.
  const t1 = openSession(handle, 'F-T1');
  t1.send(`SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${SUPPLIER_UUID}', FALSE);
    BEGIN; SELECT 'T1PID|' || pg_backend_pid();
    SELECT 'T1RESULT|' || public.registrar_recebimento_ordem_compra_fio_compat(${TARGET_FLAT_ID}, 10.000, DATE '${RECEIPT_DATE}', '${keys.t1}', 'c3de-doc', 'c3de-origin')::text;`);
  const t1Pid = Number((await t1.waitFor((l) => l.startsWith('T1PID|'))).split('|')[1]);
  const t1res = await t1.waitFor((l) => l.startsWith('T1RESULT|'));
  check(/"ok"\s*:\s*true/.test(t1res), `F.1: T1 increase to 10.000 must return ok (got ${t1res})`);

  // T2: BEGIN + increase to 15.000; must block on T1's row lock.
  const t2 = openSession(handle, 'F-T2');
  t2.send(`SET statement_timeout='30s';
    SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${SUPPLIER_UUID}', FALSE);
    BEGIN; SELECT 'T2PID|' || pg_backend_pid();
    SELECT 'T2RESULT|' || public.registrar_recebimento_ordem_compra_fio_compat(${TARGET_FLAT_ID}, 15.000, DATE '${RECEIPT_DATE}', '${keys.t2}', 'c3de-doc', 'c3de-origin')::text;`);
  const t2Pid = Number((await t2.waitFor((l) => l.startsWith('T2PID|'))).split('|')[1]);
  check(t1Pid !== t2Pid, `F: T1 and T2 must be distinct backends (${t1Pid} vs ${t2Pid})`);
  const blockEvidence = await waitForBlock(handle, t2Pid, t1Pid);
  const [blocking, waitType, waitEvent] = blockEvidence.split('|');
  const t2HeaderYet = await scalar(handle, `SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_key='${keys.t2}';`);
  check(Number(t2HeaderYet) === 0, 'F.2: blocked T2 must not yet have created a header/ledger line');
  const midDeadlocks = Number(await scalar(handle, `SELECT deadlocks FROM pg_stat_database WHERE datname=current_database();`));
  check(midDeadlocks === deadlocksBefore, 'F.2: no deadlock may occur while T2 waits');
  log('CONCURRENCY', { run, T1pid: t1Pid, T2pid: t2Pid, observer_pid: oPid, T2_blocked: true, blocking_pids: blocking, wait_event_type: waitType, wait_event: waitEvent, T2_no_header: true });

  // Commit T1 -> the synthetic PONR. Record the observable wait. The cutover
  // singleton is read via a separate postgres session (authenticated has no
  // grant on ordem_compra_cutover — db/75 final ACL model).
  const waitStart = Date.now();
  t1.send(`COMMIT; SELECT 'T1COMMIT';`);
  await t1.waitFor((l) => l === 'T1COMMIT');
  const ponrSet = await scalar(handle, `SELECT (productive_receipt_started_at IS NOT NULL)::text FROM public.ordem_compra_cutover WHERE id=1;`);
  check(ponrSet === 'true', 'F.3: committing T1 must set productive_receipt_started_at (the synthetic PONR)');
  const t2res = await t2.waitFor((l) => l.startsWith('T2RESULT|'));
  const waitMs = Date.now() - waitStart;
  check(/"ok"\s*:\s*true/.test(t2res), `F.3: T2 must succeed after T1 commits (got ${t2res})`);
  t2.send(`COMMIT; SELECT 'T2COMMIT';`);
  await t2.waitFor((l) => l === 'T2COMMIT');
  await t1.close();
  await t2.close();

  const ponrTs = await scalar(handle, `SELECT productive_receipt_started_at::text FROM public.ordem_compra_cutover WHERE id=1;`);
  log('CONCURRENCY', { run, T1_committed: true, ponr_set: true, ponr_ts: ponrTs, observed_wait_ms: waitMs });

  // Fresh delta re-evaluation: final total 15.000 (NOT 20.000/25.000 stale).
  const finalItem = Number(await scalar(handle, `SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId};`));
  check(finalItem === 15.0, `F.3: fresh re-evaluation must yield item total 15.000, not a stale 20.000 (got ${finalItem})`);
  const t2delta = await scalar(handle, `SELECT (resultado_metadata->>'delta') FROM public.ordem_compra_recebimentos WHERE idempotency_key='${keys.t2}';`);
  check(t2delta === '5.000', `F.3: T2 must re-evaluate a fresh +5.000 delta (got ${t2delta})`);

  // FINAL reconciliation after T1+T2.
  const recon = await scalar(handle, `SELECT
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId}) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_namespace='legacy_compat_receipt_v1') || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='recebimento') || '|' ||
    COALESCE((SELECT sum(kg_recebido) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='import_saldo_inicial'),0) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque WHERE ordem_compra_item_id=${handle._targetItemId});`);
  const [rItem, rHeaders, rReceiptLines, rImport, rMoves] = recon.split('|');
  check(rItem === '15.000', `final item total must be 15.000 (got ${rItem})`);
  check(rHeaders === '2', `exactly 2 productive compat receipt headers expected (got ${rHeaders})`);
  check(rReceiptLines === '2', `exactly 2 productive tipo=recebimento ledger lines expected (got ${rReceiptLines})`);
  check(rImport === '5.000', `imported opening balance must remain 5.000 (got ${rImport})`);
  const deadlocksAfterF = Number(await scalar(handle, `SELECT deadlocks FROM pg_stat_database WHERE datname=current_database();`));
  check(deadlocksAfterF === deadlocksBefore, 'F: pg_stat_database.deadlocks must be unchanged');
  check(waitMs > 0, 'F: an observable nonzero wait must have occurred');
  log('CONCURRENCY', { run, phase: 'FINAL', import: '5.000', T1: '5.000', T2: '5.000', item_kg: rItem, headers: rHeaders, receipt_lines: rReceiptLines, movements: rMoves, no_stale_20_or_25: true, deadlocks_unchanged: true });

  // PART G — idempotency (after commit).
  const headersBeforeG = Number(await scalar(handle, `SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_namespace='legacy_compat_receipt_v1';`));
  const ledgerBeforeG = Number(await scalar(handle, `SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId};`));
  // G.1 same key / same payload -> deterministic replay, zero mutation.
  const g1 = await callB(handle, SUPPLIER_UUID, TARGET_FLAT_ID, '10.000', keys.t1);
  const afterG1 = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_namespace='legacy_compat_receipt_v1') || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId});`);
  check(g1.ok === true && afterG1 === `${headersBeforeG}|${ledgerBeforeG}|15.000`,
    `G.1: same key/same payload must replay with no new header/line/total change (result=${JSON.stringify(g1)} state=${afterG1})`);
  // G.2 same key / different payload -> idempotencia_conflitante, zero mutation.
  const g2 = await callB(handle, SUPPLIER_UUID, TARGET_FLAT_ID, '12.000', keys.t1);
  const afterG2 = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId});`);
  check(g2.codigo === 'idempotencia_conflitante' && afterG2 === `${ledgerBeforeG}|15.000`,
    `G.2: same key/different payload must return idempotencia_conflitante with zero mutation (result=${JSON.stringify(g2)} state=${afterG2})`);
  const g3 = await scalar(handle, `
    SELECT idempotency_namespace || '|' || ator_tipo || '|' || (ator_id::text) || '|' || idempotency_key
    FROM public.ordem_compra_recebimentos WHERE idempotency_key='${keys.t1}';`);
  check(g3 === `legacy_compat_receipt_v1|fornecedor|${SUPPLIER_UUID}|${keys.t1}`, `G.3: actor-scoped identity mismatch (got ${g3})`);
  log('IDEMPOTENCY', { run, same_key_same_payload: 'replay_no_mutation', same_key_diff_payload: 'idempotencia_conflitante', actor_scope: 'namespace|ator_tipo|ator_id|key' });

  // PART H — nested canonical-active inventory path.
  const nested = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT count(*) FROM public.saldo_fios_op) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND kg_excesso<>0);`);
  const [moveRows, saldoOpRows, excessLines] = nested.split('|');
  check(Number(moveRows) === 2, `H: each productive receipt line must yield one movement row (got ${moveRows})`);
  check(Number(saldoOpRows) === 0, `H: no saldo_fios_op row is written by the receipt path (got ${saldoOpRows})`);
  check(Number(excessLines) === 0, 'H: this fixture (kg_alocado 15.500 >= max total 15.000) produces no excess line, so saldo_fios is not empirically mutated');
  // Depth>1 requirement: a direct depth-1 client mutation of the nested caches is
  // denied under canonical_active (legacy_receipt_fenced/55000). Rolled back.
  const denials = await (async () => {
    const s = openSession(handle, 'H-denial');
    const out = [];
    s.send(`CREATE TEMP TABLE c3de_deny(t text primary key, code text);`);
    s.send(`DO $$ BEGIN
      BEGIN UPDATE public.saldo_fios SET kg_total=kg_total WHERE tipo='algodao' AND cor_id=930000201;
            INSERT INTO c3de_deny VALUES ('saldo_fios','UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO c3de_deny VALUES ('saldo_fios', SQLSTATE); END;
      BEGIN UPDATE public.ordem_compra_item SET kg_recebido=kg_recebido WHERE id=${handle._targetItemId};
            INSERT INTO c3de_deny VALUES ('ordem_compra_item','UNEXPECTED_OK');
      EXCEPTION WHEN OTHERS THEN INSERT INTO c3de_deny VALUES ('ordem_compra_item', SQLSTATE); END;
    END $$;`);
    s.send(`SELECT string_agg(t || '=' || code, ',' ORDER BY t) FROM c3de_deny; SELECT 'H_DONE';`);
    await s.waitFor((l) => { if (l !== 'H_DONE') out.push(l); return l === 'H_DONE'; });
    await s.close();
    return out.join(',');
  })();
  check(/saldo_fios=55000/.test(denials) && /ordem_compra_item=55000/.test(denials),
    `H: direct depth-1 client mutation of saldo_fios/ordem_compra_item must be denied 55000 under canonical_active (got ${denials})`);
  // Structural proof: the installed protected guard's saldo_fios/saldo_fios_op
  // exception is exactly pg_trigger_depth()>1 AND canonical_active.
  const guardDef = (await query(handle, `SELECT pg_get_functiondef('public.trg_c3c_protected_mutation_guard()'::regprocedure);`)).join('\n');
  const iSaldoBranch = guardDef.indexOf("IN ('saldo_fios', 'saldo_fios_op')");
  const iCanonicalExc = guardDef.search(/pg_trigger_depth\(\)\s*>\s*1\s+AND\s+v_state\s*=\s*'canonical_active'/);
  check(iSaldoBranch >= 0 && iCanonicalExc > iSaldoBranch,
    `H: installed guard must gate saldo_fios/saldo_fios_op on pg_trigger_depth()>1 AND canonical_active (branch=${iSaldoBranch} exc=${iCanonicalExc})`);
  const itemReconciles = Number(await scalar(handle, `SELECT (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId})
    - COALESCE((SELECT sum(kg_recebido) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}),0);`));
  check(itemReconciles === 0, 'H: item.kg_recebido must reconcile exactly with the ledger sum');
  log('NESTED', { run, ordem_compra_item: 'exercised_depth2', movement_rows: moveRows, saldo_fios: 'exception_structural_only(no_excess_in_fixture)', saldo_fios_op: 'NOT_APPLICABLE(never_written_by_receipt_path)', direct_depth1_denied: '55000', item_reconciles: true, denials });
}

// ===========================================================================
// PART I — deterministic LIFO reversal 15.000 -> 8.000. PART J — imported floor.
// ===========================================================================
async function partIJ(handle, run, keys) {
  const linesBefore = await scalar(handle, `
    SELECT string_agg(id || ':' || tipo || ':' || kg_recebido, ',' ORDER BY id)
    FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId};`);
  // Admin reduces the absolute total to 8.000 (delta -7.000).
  const reduce = await callB(handle, ADMIN_UUID, TARGET_FLAT_ID, '8.000', keys.reduce);
  check(reduce.ok === true, `I: admin reduction to 8.000 must succeed (got ${JSON.stringify(reduce)})`);
  const finalKg = Number(await scalar(handle, `SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId};`));
  check(finalKg === 8.0, `I: final target total must be 8.000 (got ${finalKg})`);

  // Reversal lines reference the correct source receipt lines, newest first.
  // Source receipt lines are the T1 line (older id) and the T2 line (newer id).
  const receiptLines = (await query(handle, `
    SELECT id || '|' || kg_recebido FROM public.ordem_compra_fio_lancamentos
    WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='recebimento' ORDER BY id;`)).map((r) => r.split('|'));
  const [t1LineId] = receiptLines[0];
  const [t2LineId] = receiptLines[1];
  const reversals = (await query(handle, `
    SELECT estorno_de_id || '|' || kg_recebido || '|' || id FROM public.ordem_compra_fio_lancamentos
    WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='estorno' ORDER BY id;`)).map((r) => r.split('|'));
  // Per-source reversed totals.
  const revByT2 = reversals.filter((r) => r[0] === t2LineId).reduce((a, r) => a + Number(r[1]), 0);
  const revByT1 = reversals.filter((r) => r[0] === t1LineId).reduce((a, r) => a + Number(r[1]), 0);
  check(revByT2 === -5.0, `I: all of T2's latest 5.000 kg receipt must be reversed first (got ${revByT2})`);
  check(revByT1 === -2.0, `I: exactly 2.000 kg of T1's earlier receipt must be reversed (got ${revByT1})`);
  // Remaining reversible on each line.
  const t1Remaining = Number(await scalar(handle, `
    SELECT p.kg_recebido + COALESCE((SELECT sum(r.kg_recebido) FROM public.ordem_compra_fio_lancamentos r WHERE r.estorno_de_id=p.id),0)
    FROM public.ordem_compra_fio_lancamentos p WHERE p.id=${t1LineId};`));
  const t2Remaining = Number(await scalar(handle, `
    SELECT p.kg_recebido + COALESCE((SELECT sum(r.kg_recebido) FROM public.ordem_compra_fio_lancamentos r WHERE r.estorno_de_id=p.id),0)
    FROM public.ordem_compra_fio_lancamentos p WHERE p.id=${t2LineId};`));
  check(t1Remaining === 3.0, `I: 3.000 kg of T1's receipt must remain unreversed (got ${t1Remaining})`);
  check(t2Remaining === 0.0, `I: T2's receipt must be fully reversed (got ${t2Remaining})`);
  // Import line untouched.
  const importAfter = Number(await scalar(handle, `
    SELECT COALESCE(sum(kg_recebido),0) FROM public.ordem_compra_fio_lancamentos
    WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='import_saldo_inicial';`));
  check(importAfter === 5.0, `I: the imported 5.000 kg opening balance must be untouched (got ${importAfter})`);
  const importReversed = Number(await scalar(handle, `
    SELECT count(*) FROM public.ordem_compra_fio_lancamentos r
    WHERE r.estorno_de_id IN (SELECT id FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId} AND tipo='import_saldo_inicial');`));
  check(importReversed === 0, 'I: the imported line must have no reversal');
  // Deterministic order: no earlier (T1) line reversed before the later (T2) line
  // is exhausted — the first estorno rows must target T2, only then T1.
  const firstTargets = reversals.map((r) => r[0]);
  const firstT1Idx = firstTargets.indexOf(t1LineId);
  const lastT2Idx = firstTargets.lastIndexOf(t2LineId);
  check(firstT1Idx === -1 || lastT2Idx < firstT1Idx, 'I: reversal must be LIFO — no earlier line reversed before the later reversible line');
  const ponrStill = await scalar(handle, `SELECT (productive_receipt_started_at IS NOT NULL)::text FROM public.ordem_compra_cutover WHERE id=1;`);
  check(ponrStill === 'true', 'I: productive_receipt_started_at must remain non-NULL');
  log('LIFO', { run, reduce_15_to_8: true, delta: '-7.000', reversed_T2: '5.000', reversed_T1: '2.000', T1_remaining: '3.000', import_untouched: '5.000', order: 'id_desc_LIFO', final: '8.000' });

  // Replay the reduction key: deterministic idempotency, zero extra mutation.
  const ledgerBeforeReplay = Number(await scalar(handle, `SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId};`));
  const replay = await callB(handle, ADMIN_UUID, TARGET_FLAT_ID, '8.000', keys.reduce);
  const afterReplay = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId});`);
  check(replay.ok === true && afterReplay === `${ledgerBeforeReplay}|8.000`,
    `I: reduction replay must be idempotent with zero extra mutation (result=${JSON.stringify(replay)} state=${afterReplay})`);
  log('LIFO', { run, phase: 'replay', idempotent: true, zero_extra_mutation: true });

  // PART J — imported-balance immutable floor.
  const beforeFloor = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_recebimentos) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId}) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque WHERE ordem_compra_item_id=${handle._targetItemId});`);
  const floorRes = await callB(handle, ADMIN_UUID, TARGET_FLAT_ID, '4.000', keys.floor);
  check(floorRes.codigo === 'reducao_abaixo_saldo_importado' && floorRes.saldo_importado === '5.000',
    `J: reduction below the 5.000 floor must be rejected with the imported-floor code + quantity (got ${JSON.stringify(floorRes)})`);
  const afterFloor = await scalar(handle, `SELECT
    (SELECT count(*) FROM public.ordem_compra_recebimentos) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=${handle._targetItemId}) || '|' ||
    (SELECT kg_recebido FROM public.ordem_compra_item WHERE id=${handle._targetItemId}) || '|' ||
    (SELECT count(*) FROM public.ordem_compra_fio_movimentos_estoque WHERE ordem_compra_item_id=${handle._targetItemId});`);
  check(afterFloor === beforeFloor && afterFloor.split('|')[2] === '8.000',
    `J: below-floor rejection must mutate nothing and leave the total at 8.000 (before=${beforeFloor} after=${afterFloor})`);
  const floorIdentity = await scalar(handle, `SELECT count(*) FROM public.ordem_compra_recebimentos WHERE idempotency_key='${keys.floor}';`);
  check(Number(floorIdentity) === 0, 'J: the rejected below-floor command must create no idempotency identity');
  log('FLOOR', { run, reduce_to_4: 'rejected', codigo: 'reducao_abaixo_saldo_importado', saldo_importado: '5.000', zero_mutation: true, final: '8.000' });
}

// ===========================================================================
// PART K — post-PONR prohibition compliance.
// ===========================================================================
async function partK(handle, run) {
  const state = await scalar(handle, `SELECT status || '|' || read_authority || '|' ||
    (productive_receipt_started_at IS NOT NULL)::text || '|' ||
    (snapshot_hash IS NOT NULL)::text || '|' || (inventory_baseline_hash IS NOT NULL)::text
    FROM public.ordem_compra_cutover WHERE id=1;`);
  check(state === 'canonical_active|canonical|true|true|true',
    `K: post-PONR state must remain canonical_active/canonical with PONR set and snapshots present (got ${state})`);
  const advisory = await scalar(handle, `SELECT count(*) FROM pg_locks WHERE locktype='advisory';`);
  check(Number(advisory) === 0, `K: no advisory lock may remain (found ${advisory})`);
  const idleInTx = await scalar(handle, `SELECT count(*) FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND state='idle in transaction';`);
  check(Number(idleInTx) === 0, `K: no backend may remain idle in transaction (found ${idleInTx})`);
  log('POSTPONR', { run, ponr_not_null: true, canonical_active: true, snapshots_present: true, no_pre_ponr_rollback_invoked: true, no_legacy_regression: true, advisory_leak: 0, idle_in_transaction: 0 });
}

// ===========================================================================
// One complete proof run for a single disposable cluster.
// ===========================================================================
async function runProof(run) {
  const keys = run === 1
    ? { t1: 'c3de--t1-increase', t2: 'c3de--t2-increase', reduce: 'c3de--admin-reduce-to-8', floor: 'c3de--admin-below-floor' }
    : { t1: 'c3de-r2--t1-increase', t2: 'c3de-r2--t2-increase', reduce: 'c3de-r2--admin-reduce-to-8', floor: 'c3de-r2--admin-below-floor' };
  const handle = await bootstrapCluster({});
  log('CLUSTER', { run: `run${run}`, host: handle.host, port: handle.port, pgVersion: handle.pgVersion, dataDir: handle.dataDir, postmasterPid: handle.postmasterPid });
  try {
    await provisionCluster(handle, `run${run}`);
    await partC(handle, run);           // session-lock matrix (legacy_active)
    await partD_static(handle, run);    // installed resource-lock order
    await partE(handle, run);           // pre-PONR cutover prep -> canonical_active
    await partD1_stagedBlocker(handle, run); // empirical staged blocker (pre-PONR, rolled back)
    await partFGH(handle, run, keys);   // two-session concurrency (PONR) + idempotency + nested path
    await partIJ(handle, run, keys);    // LIFO reversal + imported floor
    await partK(handle, run);           // post-PONR compliance
    // Close all remaining backends before destruction (Part L step 1). All named
    // sessions above are explicitly closed within their parts; assert idle.
    const backends = Number(await scalar(handle, `SELECT count(*) FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND datname=current_database();`));
    log('SESSIONS', { run, live_client_backends_before_destroy: backends });
    log('RUNPASS', { run, label: `run${run}` });
    return { handle, ok: true };
  } catch (err) {
    return { handle, ok: false, err };
  }
}

// PART L — mandatory cluster destruction with full proof.
async function destroyCluster(handle, run) {
  const postmasterPid = handle.postmasterPid;
  const port = handle.port;
  const dataDir = handle.dataDir;
  const stop = await handle.stop();
  check(stop.stopResult && stop.stopResult.ok === true, `L: bootstrap stopResult.ok must be true (got ${JSON.stringify(stop)})`);
  check(stop.pidAbsent === true, 'L: postmaster PID must be proven absent');
  check(stop.portClosed === true, 'L: TCP port must be proven closed');
  check(stop.dirAbsent === true, 'L: data directory must be proven absent');
  const pidAlive = postmasterPid ? isPidAlive(postmasterPid) : false;
  check(!pidAlive, `L: captured postmaster PID ${postmasterPid} must be absent`);
  const portOpen = await isPortOpen(handle.host, port, 500);
  check(!portOpen, `L: TCP port ${port} must be closed`);
  const dirGone = await access(dataDir, fsConstants.F_OK).then(() => false).catch(() => true);
  check(dirGone, `L: data directory ${dataDir} must be absent`);
  // Remove the run's scratch preamble/corpus/actors files and prove absence.
  if (handle._scratchDir) await rm(handle._scratchDir, { recursive: true, force: true });
  const scratchGone = handle._scratchDir ? await access(handle._scratchDir, fsConstants.F_OK).then(() => false).catch(() => true) : true;
  check(scratchGone, 'L: run scratch SQL directory must be absent');
  // No c3d-disposable-pg-* child directory left behind by this run.
  const tmpEntries = await readdir(tmpdir());
  const leftover = tmpEntries.filter((e) => e.startsWith(DATA_DIR_PREFIX) && dataDir.includes(e));
  check(leftover.length === 0, `L: no ${DATA_DIR_PREFIX}* directory from this run may remain (${leftover.join(',')})`);
  log('DESTROY', { run, postmaster_pid: postmasterPid, stop_ok: true, pid_absent: true, port_closed: true, dir_absent: true, scratch_absent: true, no_disposable_residue: true });
}

async function main() {
  log('C3DE', { start: 'PHASE-C3D-E lock/concurrency rehearsal', runs: 2 });
  const results = [];
  for (const run of [1, 2]) {
    const { handle, ok, err } = await runProof(run);
    // Destruction is mandatory regardless of proof outcome (post-PONR recovery
    // is cluster destruction, never rollback). A proof failure still destroys,
    // then rethrows so the run is FAILED.
    try {
      await destroyCluster(handle, run);
    } catch (destroyErr) {
      if (ok) throw destroyErr;
      console.error(`run${run} destruction also failed:`, destroyErr.message);
    }
    if (!ok) throw err;
    results.push(`run${run}`);
  }
  log('C3DE', { done: results.join('+'), result: 'TWO_FRESH_CLUSTER_PROOFS_PASS' });
  console.log('C3D_E_LOCK_CONCURRENCY_PASS');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
