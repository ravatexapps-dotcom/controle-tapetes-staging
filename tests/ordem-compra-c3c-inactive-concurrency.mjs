import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const migration = readFileSync(
  join(here, '..', 'db', '75_ordem_compra_c3c_inactive_cutover.sql'),
  'utf8',
);
const psql = process.env.PSQL || 'psql';
const database = process.env.PGDATABASE || 'postgres';
const generation = 750001;

function session(sql, onLine) {
  return new Promise((resolve, reject) => {
    const child = spawn(psql, ['-X', '-w', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', database], {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let pending = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      pending += chunk;
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      for (const line of lines) onLine?.(line.trim());
    });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) reject(new Error(`psql exited ${code}: ${stderr}`));
      else resolve({ stdout, stderr });
    });
    child.stdin.end(sql);
  });
}

const lockOrder = [
  'PERFORM 1 FROM public.ordem_compra_cutover',
  'FROM public.ordens_compra_fio f',
  'PERFORM 1 FROM public.saldo_fios',
  'FROM public.ordem_compra_item i',
  'PERFORM 1 FROM public.ordem_compra o',
];
let cursor = -1;
for (const token of lockOrder) {
  const next = migration.indexOf(token, cursor + 1);
  assert.ok(next > cursor, `deterministic lock-order token missing/out of order: ${token}`);
  cursor = next;
}

let startContender;
const contenderReady = new Promise((resolve) => { startContender = resolve; });
const holder = session(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'LOCKED' ELSE 'FAILED' END;
  SELECT pg_sleep(2);
  SELECT CASE WHEN public.ordem_compra_c3c_session_lock_held(${generation}) THEN 'HELD' ELSE 'LOST' END;
  SELECT CASE WHEN public.ordem_compra_c3c_release_session_lock(${generation}) THEN 'RELEASED' ELSE 'NOT_RELEASED' END;
`, (line) => {
  if (line === 'LOCKED') startContender();
});

await contenderReady;
const contender = await session(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'UNEXPECTED_LOCK' ELSE 'CONTENDED' END;
`);
assert.match(contender.stdout, /CONTENDED/);

const holderResult = await holder;
assert.match(holderResult.stdout, /LOCKED/);
assert.match(holderResult.stdout, /HELD/);
assert.match(holderResult.stdout, /RELEASED/);

const successor = await session(`
  SELECT CASE WHEN public.ordem_compra_c3c_acquire_session_lock(${generation}) THEN 'REACQUIRED' ELSE 'FAILED' END;
  SELECT CASE WHEN public.ordem_compra_c3c_release_session_lock(${generation}) THEN 'RERELEASED' ELSE 'FAILED' END;
`);
assert.match(successor.stdout, /REACQUIRED/);
assert.match(successor.stdout, /RERELEASED/);

console.log('C3C_CONCURRENCY_PASS');
