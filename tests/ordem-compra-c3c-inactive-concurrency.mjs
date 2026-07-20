import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const psql = process.env.PSQL || 'psql';
const database = process.env.PGDATABASE || 'postgres';
const generation = 750001;

function openSession(name) {
  const child = spawn(psql, ['-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', database], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
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
      const error = closeError || (code === 0 ? null : new Error(`${name} psql exited ${code}: ${stderr}`));
      for (const waiter of waiters.splice(0)) {
        clearTimeout(waiter.timer);
        waiter.reject(error || new Error(`${name} closed before expected output`));
      }
      if (error) reject(error); else resolve({ lines, stderr });
    });
  });

  return {
    send(sql) {
      assert.equal(closed, false, `${name} is already closed`);
      child.stdin.write(`${sql}\n`);
    },
    waitFor(predicate, timeoutMs = 10000) {
      const existing = lines.find(predicate);
      if (existing) return Promise.resolve(existing);
      return new Promise((resolve, reject) => {
        const waiter = { predicate, resolve, reject };
        waiter.timer = setTimeout(() => {
          const index = waiters.indexOf(waiter);
          if (index >= 0) waiters.splice(index, 1);
          reject(new Error(`${name} timed out; output=${lines.join(' | ')}; stderr=${stderr}`));
        }, timeoutMs);
        waiters.push(waiter);
      });
    },
    async close() {
      if (!closed) {
        child.stdin.end('\\q\n');
      }
      return completion;
    },
  };
}

async function query(sql) {
  const session = openSession('query');
  session.send(sql);
  const result = await session.close();
  return result.lines;
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForBlock(subjectPid, blockerPid) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row = ''] = await query(`
      SELECT array_to_string(pg_catalog.pg_blocking_pids(${subjectPid}), ',')
        || '|' || COALESCE(wait_event_type, '') || '|' || COALESCE(wait_event, '')
      FROM pg_catalog.pg_stat_activity WHERE pid = ${subjectPid};
    `);
    const [blocking = ''] = row.split('|');
    if (blocking.split(',').includes(String(blockerPid))) return row;
    await delay(50);
  }
  throw new Error(`backend ${subjectPid} did not block on ${blockerPid}`);
}

const holder = openSession('advisory-holder');
holder.send(`SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'LOCKED' ELSE 'FAILED' END;`);
await holder.waitFor((line) => line === 'LOCKED');
const contender = await query(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation})
    THEN 'UNEXPECTED_LOCK' ELSE 'CONTENDED' END;
`);
assert.deepEqual(contender, ['CONTENDED']);
holder.send(`SELECT CASE WHEN public.ordem_compra_c3c_release_session_lock(${generation}) THEN 'RELEASED' ELSE 'FAILED' END;`);
await holder.waitFor((line) => line === 'RELEASED');
await holder.close();
const successor = await query(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'REACQUIRED' ELSE 'FAILED' END;
  SELECT CASE WHEN public.ordem_compra_c3c_release_session_lock(${generation}) THEN 'RERELEASED' ELSE 'FAILED' END;
`);
assert.deepEqual(successor, ['REACQUIRED', 'RERELEASED']);

await query(`
  INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total)
  VALUES ('algodao', 99001, NULL, 1.000);
  SELECT public.ordem_compra_c3c_acquire_session_lock(${generation});
  SELECT public.ordem_compra_c3c_fence_and_snapshot(${generation});
  SELECT public.ordem_compra_c3c_release_session_lock(${generation});
`);

const [deadlocksBefore] = await query(`
  SELECT deadlocks FROM pg_catalog.pg_stat_database WHERE datname = current_database();
`);

const blockerSpecs = [
  ['cutover', `SELECT id FROM public.ordem_compra_cutover WHERE id = 1 FOR UPDATE;`],
  ['frozen_source', `SELECT id FROM public.ordem_compra_cutover_source_snapshot WHERE cutover_id = 1 ORDER BY stable_position LIMIT 1 FOR UPDATE;`],
  ['mapping', `SELECT c.id FROM public.ordem_compra_item_compat_fio c JOIN public.ordem_compra_cutover_source_snapshot s ON s.mapping_id = c.id WHERE s.cutover_id = 1 ORDER BY s.stable_position LIMIT 1 FOR UPDATE OF c;`],
  ['inventory_baseline', `SELECT id FROM public.ordem_compra_cutover_inventory_baseline WHERE cutover_id = 1 ORDER BY stable_position LIMIT 1 FOR UPDATE;`],
  ['inventory_live', `SELECT f.tipo FROM public.saldo_fios f JOIN public.ordem_compra_cutover_inventory_baseline b ON b.material = f.tipo AND b.cor_id IS NOT DISTINCT FROM f.cor_id AND b.cor_poliester IS NOT DISTINCT FROM f.cor_poliester WHERE b.cutover_id = 1 ORDER BY b.stable_position LIMIT 1 FOR UPDATE OF f;`],
  ['canonical_item', `SELECT i.id FROM public.ordem_compra_item i JOIN public.ordem_compra_cutover_source_snapshot s ON s.item_id = i.id WHERE s.cutover_id = 1 ORDER BY i.id LIMIT 1 FOR UPDATE OF i;`],
  ['canonical_allocation', `SELECT a.id FROM public.ordem_compra_item_alocacao a JOIN public.ordem_compra_cutover_source_snapshot s ON s.allocation_id = a.id WHERE s.cutover_id = 1 ORDER BY a.item_id, a.id LIMIT 1 FOR UPDATE OF a;`],
  ['order', `SELECT o.id FROM public.ordem_compra o JOIN public.ordem_compra_cutover_source_snapshot s ON s.ordem_compra_id = o.id WHERE s.cutover_id = 1 ORDER BY o.id LIMIT 1 FOR UPDATE OF o;`],
];

const blockers = [];
for (const [name, lockSql] of blockerSpecs) {
  const blocker = openSession(`blocker-${name}`);
  blocker.send(`BEGIN; SELECT 'PID|' || pg_backend_pid(); ${lockSql} SELECT 'READY';`);
  const pidLine = await blocker.waitFor((line) => line.startsWith('PID|'));
  await blocker.waitFor((line) => line === 'READY');
  blockers.push({ name, blocker, pid: Number(pidLine.split('|')[1]) });
}

const subject = openSession('lock-subject');
subject.send(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'SUBJECT_LOCKED' ELSE 'FAILED' END;
  BEGIN;
  SELECT 'SUBJECT_PID|' || pg_backend_pid();
  SELECT 'IMPORT_RESULT|' || public.ordem_compra_c3c_import_and_reconcile(${generation})::TEXT;
  SELECT 'SUBJECT_DONE';
  COMMIT;
  SELECT 'SUBJECT_COMMITTED';
  SELECT CASE WHEN public.ordem_compra_c3c_release_session_lock(${generation}) THEN 'SUBJECT_RELEASED' ELSE 'FAILED' END;
`);
await subject.waitFor((line) => line === 'SUBJECT_LOCKED');
const subjectPidLine = await subject.waitFor((line) => line.startsWith('SUBJECT_PID|'));
const subjectPid = Number(subjectPidLine.split('|')[1]);

for (const { name, blocker, pid } of blockers) {
  const evidence = await waitForBlock(subjectPid, pid);
  console.log(`LOCK_STAGE|${name}|subject=${subjectPid}|blocker=${pid}|catalog=${evidence}`);
  blocker.send(`COMMIT; SELECT 'RELEASED';`);
  await blocker.waitFor((line) => line === 'RELEASED');
  await blocker.close();
}

const importResult = await subject.waitFor((line) => line.startsWith('IMPORT_RESULT|'));
assert.match(importResult, /"headers": 39/);
await subject.waitFor((line) => line === 'SUBJECT_DONE');
await subject.waitFor((line) => line === 'SUBJECT_COMMITTED');
await subject.waitFor((line) => line === 'SUBJECT_RELEASED');
const [idleEvidence] = await query(`
  SELECT state || '|' || (xact_start IS NULL)::TEXT
  FROM pg_catalog.pg_stat_activity WHERE pid = ${subjectPid};
`);
assert.equal(idleEvidence, 'idle|true');
await subject.close();

const [deadlocksAfter] = await query(`
  SELECT deadlocks FROM pg_catalog.pg_stat_database WHERE datname = current_database();
`);
assert.equal(deadlocksAfter, deadlocksBefore);
console.log(`ADVISORY|contended=true|released=true|reacquired=true`);
console.log('TEST_INSTRUMENTATION|catalog_probes=pg_blocking_pids|controlled_blocker_release=true');
console.log('PRODUCTION_PATH|server_side_import_calls=1|client_callbacks=0');
console.log(`FINAL_BACKEND|state=idle|open_transaction=false|deadlocks=${deadlocksAfter}`);
console.log('C3C_CONCURRENCY_PASS');
