// scripts/c3d/bootstrap-disposable-cluster.mjs
//
// PHASE-C3D-A disposable PostgreSQL cluster bootstrap.
//
// Creates a fresh, isolated, disposable local PostgreSQL cluster for
// rehearsal/testing only: resolves local binaries, allocates a temp data
// directory outside the repository, picks a distinct non-default port,
// initializes and starts the cluster, proves readiness and a connection,
// and exposes a `stop()` that shuts the cluster down and proves -- never
// infers -- that the captured postmaster PID is gone, the port is closed,
// and the data directory is removed, in that order, before reporting
// success. Fails closed: any startup/readiness failure, or any failed
// shutdown/port/process proof, tears down whatever can be torn down and
// rejects with a stable `C3D_BOOTSTRAP_*` error rather than silently
// reporting success; a failed attempt never blocks a later retry.
//
// Out of scope by design: no migration application, no fixture loading, no
// connection of any kind to a managed/hosted/shared/remote backend, no
// repository file writes, no Windows service registration
// (`pg_ctl register`), no reuse of the host's persistent cluster.

import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, access } from 'node:fs/promises';
import { constants as fsConstants, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

export const DATA_DIR_PREFIX = 'c3d-disposable-pg-';
export const DEFAULT_READINESS_TIMEOUT_MS = 30000;
export const READINESS_POLL_INTERVAL_MS = 250;
export const DEFAULT_HOST = '127.0.0.1';
export const FORBIDDEN_DEFAULT_PORT = 5432;
export const DISPOSABLE_USER = 'postgres';
export const DISPOSABLE_DATABASE = 'postgres';

export function getRepoRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function which(binaryName) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const probe = spawnSync(finder, [binaryName], { encoding: 'utf8', timeout: 5000 });
  if (probe.status !== 0) return null;
  const first = probe.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return first || null;
}

// Resolves the local PostgreSQL binaries required for this bootstrap.
// Never targets the host's persistent scoop cluster/data directory; it only
// reads that install's `bin/` directory for the executables themselves.
export function resolvePgBinaries(env = process.env) {
  let dir = env.C3D_PG_BIN_DIR || null;
  if (!dir) {
    const initdbPath = which('initdb');
    if (initdbPath) dir = path.dirname(initdbPath);
  }
  if (!dir && process.platform === 'win32' && env.USERPROFILE) {
    dir = path.join(env.USERPROFILE, 'scoop', 'apps', 'postgresql', 'current', 'bin');
  }
  if (!dir) {
    throw new Error(
      'C3D_BOOTSTRAP_PG_BINARIES_NOT_FOUND: unable to resolve a local PostgreSQL bin directory (set C3D_PG_BIN_DIR to override)'
    );
  }

  const exe = (name) => path.join(dir, process.platform === 'win32' ? `${name}.exe` : name);
  const binaries = {
    dir,
    initdb: exe('initdb'),
    pgCtl: exe('pg_ctl'),
    psql: exe('psql'),
    pgIsReady: exe('pg_isready'),
  };

  let version = null;
  for (const [key, binPath] of Object.entries(binaries)) {
    if (key === 'dir') continue;
    const check = spawnSync(binPath, ['--version'], { encoding: 'utf8', timeout: 5000 });
    if (check.status !== 0) {
      throw new Error(`C3D_BOOTSTRAP_PG_BINARY_UNAVAILABLE: ${key} at ${binPath}`);
    }
    if (key === 'initdb') {
      const match = /(\d+(?:\.\d+)?)/.exec(check.stdout);
      version = match ? match[1] : check.stdout.trim();
    }
  }

  return { ...binaries, version };
}

// Allocates a free ephemeral TCP port on `host` via a bind-to-0 probe, and
// explicitly refuses the conventional default port so the disposable
// cluster is never reachable at the same address as a real installation.
export async function allocateFreePort(host = DEFAULT_HOST) {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close((err) => {
        if (err) reject(err);
        else resolve(address.port);
      });
    });
  });
  if (port === FORBIDDEN_DEFAULT_PORT) {
    return allocateFreePort(host);
  }
  return port;
}

export function isPortOpen(host, port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForPortClosed(host, port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const open = await isPortOpen(host, port, 500);
    if (!open) return true;
    await delay(200);
  }
  return false;
}

// Reads the disposable cluster's own postmaster PID from its data
// directory -- never from global process-name enumeration, which could
// match an unrelated PostgreSQL installation on the host. Safe to call only
// after `pg_ctl start -w` has returned successfully, since `-w` waits for
// the server to reach a state where this file is guaranteed to exist.
export function readPostmasterPid(dataDir) {
  const pidFile = path.join(dataDir, 'postmaster.pid');
  let raw;
  try {
    raw = readFileSync(pidFile, 'utf8');
  } catch (err) {
    throw new Error(`C3D_BOOTSTRAP_PID_UNREADABLE: could not read ${pidFile}: ${err.message}`);
  }
  const firstLine = raw.split(/\r?\n/)[0].trim();
  const pid = Number(firstLine);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(`C3D_BOOTSTRAP_PID_UNREADABLE: could not parse a postmaster PID from ${pidFile}`);
  }
  return pid;
}

// Cross-platform process-existence check (works on Windows and POSIX):
// signal 0 never actually signals the process, it only probes whether the
// OS still has a process table entry for this exact PID.
export function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    if (err.code === 'ESRCH') return false;
    if (err.code === 'EPERM') return true;
    throw err;
  }
}

async function waitForPidExit(pid, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isPidAlive(pid)) return true;
    await delay(200);
  }
  return !isPidAlive(pid);
}

// A Windows-specific race: `pg_ctl stop -w` returning success only means
// the postmaster removed its PID file, not that every auxiliary worker
// process (checkpointer, background writer, ...) has fully exited and
// released its open handles inside the data directory yet. Windows marks
// such a directory "pending delete" -- `fs.rm` can report success while the
// entry (and the process still holding it) linger for a short window
// afterward. Retrying absorbs that window instead of leaving a process or
// directory behind.
async function removeWithRetry(targetPath, { attempts = 10, delayMs = 300 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await rm(targetPath, { recursive: true, force: true });
      const stillThere = await access(targetPath, fsConstants.F_OK)
        .then(() => true)
        .catch(() => false);
      if (!stillThere) return;
    } catch (err) {
      lastErr = err;
    }
    await delay(delayMs);
  }
  throw new Error(
    `C3D_BOOTSTRAP_CLEANUP_INCOMPLETE: ${targetPath} still exists after ${attempts} removal attempts${
      lastErr ? ` (last error: ${lastErr.message})` : ''
    }`
  );
}

function runInitdb({ initdb, dataDir, user }) {
  const result = spawnSync(initdb, ['-D', dataDir, '-U', user, '-A', 'trust', '-E', 'UTF8'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 60000,
  });
  if (result.status !== 0) {
    const diagnostic = result.error ? result.error.message : result.stderr || result.stdout || 'no diagnostic output';
    throw new Error(`C3D_BOOTSTRAP_INITDB_FAILED: ${diagnostic}`);
  }
}

function pgCtlStartOptions({ port, host }) {
  // Reduced shared-memory footprint mitigates the Windows shared-memory
  // reservation crash observed on this host's persistent scoop cluster
  // (ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md §35.5/§36.1).
  return [
    `-p ${port}`,
    `-c listen_addresses=${host}`,
    '-c autovacuum=off',
    '-c max_connections=20',
    '-c shared_buffers=32MB',
    '-c fsync=off',
    '-c max_worker_processes=4',
    '-c max_parallel_workers=0',
    '-c max_parallel_workers_per_gather=0',
  ].join(' ');
}

function runPgCtlStart({ pgCtl, dataDir, logFile, port, host, startTimeoutSec }) {
  // `stdio: 'ignore'` is deliberate: `pg_ctl start -w` launches a detached,
  // long-lived `postgres` grandchild. If that grandchild inherited piped
  // stdout/stderr handles from this call, `spawnSync` would block waiting
  // for EOF on those pipes for as long as the server keeps running, well
  // past `pg_ctl`'s own (successful, fast) exit. Diagnostics come from the
  // `-l logFile` server log instead, which carries no such risk.
  const result = spawnSync(
    pgCtl,
    ['start', '-D', dataDir, '-l', logFile, '-w', '-t', String(startTimeoutSec), '-o', pgCtlStartOptions({ port, host })],
    { stdio: 'ignore', timeout: (startTimeoutSec + 15) * 1000 }
  );
  if (result.status !== 0) {
    let diagnostic = result.error ? result.error.message : `exit status ${result.status}`;
    try {
      diagnostic += `\n${readFileSync(logFile, 'utf8')}`;
    } catch {
      // log file may not exist yet if postgres never started; the exit
      // status/spawn error above is the only diagnostic available then.
    }
    throw new Error(`C3D_BOOTSTRAP_START_FAILED: ${diagnostic}`);
  }
}

// `pg_ctl stop` (unlike `pg_ctl start`) never leaves a detached grandchild
// behind -- it only signals the already-running postmaster and waits for it
// to exit -- so capturing its own stdout/stderr via pipes is safe here and
// carries none of `runPgCtlStart`'s inherited-handle hang risk. The full
// result (exit status, spawn error, diagnostic text) is returned rather
// than collapsed to a boolean, so a caller can report *why* shutdown failed
// without exposing any secret (there is none under local trust auth).
function runPgCtlStop({ pgCtl, dataDir }) {
  const result = spawnSync(pgCtl, ['stop', '-D', dataDir, '-m', 'fast', '-w', '-t', '30'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 45000,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    diagnostic: result.error ? result.error.message : result.stderr || result.stdout || null,
  };
}

async function waitForReady({ pgIsReady, psql, host, port, user, database, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  let lastDiagnostic = 'no diagnostic output';
  while (Date.now() < deadline) {
    const ready = spawnSync(pgIsReady, ['-h', host, '-p', String(port), '-U', user, '-d', database, '-t', '2'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
    });
    if (ready.status === 0) {
      const check = spawnSync(psql, ['-h', host, '-p', String(port), '-U', user, '-d', database, '-tAc', 'SELECT 1'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 5000,
      });
      if (check.status === 0 && check.stdout.trim() === '1') {
        return true;
      }
      lastDiagnostic = (check.error && check.error.message) || check.stderr || check.stdout || lastDiagnostic;
    } else {
      lastDiagnostic = (ready.error && ready.error.message) || ready.stderr || ready.stdout || lastDiagnostic;
    }
    await delay(READINESS_POLL_INTERVAL_MS);
  }
  throw new Error(`C3D_BOOTSTRAP_READINESS_TIMEOUT: cluster not ready within ${timeoutMs}ms (${lastDiagnostic})`);
}

// Bootstraps one disposable cluster and returns a handle with `stop()`.
// On any failure during initdb/start/readiness, performs best-effort
// cleanup (stop attempt + recursive removal of the temp directory) before
// rethrowing, with `dataDir`/`port` attached to the thrown error so callers
// can independently verify cleanup even on the failure path.
export async function bootstrapCluster(options = {}) {
  const env = options.env || process.env;
  const host = options.host || DEFAULT_HOST;
  const readinessTimeoutMs = options.readinessTimeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS;
  const startTimeoutSec = options.startTimeoutSec ?? 30;
  const user = DISPOSABLE_USER;
  const database = DISPOSABLE_DATABASE;

  const repoRoot = getRepoRoot();
  const binaries = resolvePgBinaries(env);

  const base = await mkdtemp(path.join(tmpdir(), DATA_DIR_PREFIX));
  if (base.startsWith(repoRoot)) {
    await rm(base, { recursive: true, force: true });
    throw new Error('C3D_BOOTSTRAP_DATA_DIR_INSIDE_REPOSITORY: refusing a temp directory inside the repository');
  }

  const dataDir = path.join(base, 'data');
  const logFile = path.join(base, 'postgres.log');
  const port = options.port ?? (await allocateFreePort(host));
  if (port === FORBIDDEN_DEFAULT_PORT) {
    await rm(base, { recursive: true, force: true });
    throw new Error('C3D_BOOTSTRAP_DEFAULT_PORT_REJECTED: refusing to bind the conventional default PostgreSQL port');
  }

  let started = false;
  let postmasterPid = null;

  // Attempts one full cleanup pass and returns a proof object once every
  // step is genuinely confirmed, or throws a stable `C3D_BOOTSTRAP_*` error
  // with the partial proof attached the moment any step fails -- directory
  // removal never runs until shutdown, port closure, and process exit are
  // all independently proven (never inferred from one another). `overrides`
  // exists solely for deterministic fault injection in tests (forcing one
  // step to behave as if it failed) and defaults to the real checks.
  // Idempotent and retry-safe: `started`/`postmasterPid` are only cleared
  // once a step is genuinely proven, so a failed attempt changes nothing
  // that a later real attempt still needs to check.
  const attemptCleanup = async (overrides = {}) => {
    const proof = { stopResult: null, portClosed: null, pidAbsent: null, dirAbsent: null };

    if (started) {
      const alreadyStopped = postmasterPid !== null && !isPidAlive(postmasterPid);
      if (alreadyStopped) {
        proof.stopResult = { ok: true, status: 0, diagnostic: 'already stopped' };
      } else {
        const stopResult = overrides.forceStopFailure
          ? { ok: false, status: null, diagnostic: 'C3D_TEST_INJECTED_STOP_FAILURE' }
          : runPgCtlStop({ pgCtl: binaries.pgCtl, dataDir });
        proof.stopResult = stopResult;
        if (!stopResult.ok) {
          const err = new Error(
            `C3D_BOOTSTRAP_STOP_FAILED: pg_ctl stop did not report success (status=${stopResult.status}, diagnostic=${
              stopResult.diagnostic || 'none'
            })`
          );
          err.proof = proof;
          throw err;
        }
      }

      const portClosed = overrides.forcePortStillOpen ? false : await waitForPortClosed(host, port, 10000);
      proof.portClosed = portClosed;
      if (!portClosed) {
        const err = new Error(`C3D_BOOTSTRAP_PORT_STILL_OPEN: ${host}:${port} did not close after shutdown was requested`);
        err.proof = proof;
        throw err;
      }

      const pidAbsent = overrides.forceProcessStillAlive
        ? false
        : postmasterPid === null || (await waitForPidExit(postmasterPid, 10000));
      proof.pidAbsent = pidAbsent;
      if (!pidAbsent) {
        const err = new Error(`C3D_BOOTSTRAP_PROCESS_STILL_ALIVE: postmaster PID ${postmasterPid} still exists after shutdown was requested`);
        err.proof = proof;
        throw err;
      }

      started = false;
    } else {
      proof.stopResult = { ok: true, status: 0, diagnostic: 'not started' };
      proof.portClosed = true;
      proof.pidAbsent = true;
    }

    await removeWithRetry(base);
    proof.dirAbsent = true;
    return proof;
  };

  try {
    runInitdb({ initdb: binaries.initdb, dataDir, user });
    runPgCtlStart({ pgCtl: binaries.pgCtl, dataDir, logFile, port, host, startTimeoutSec });
    started = true;
    postmasterPid = readPostmasterPid(dataDir);
    if (options.simulateReadinessFailure) {
      // `pg_ctl start -w` already waits for the server's own internal
      // readiness, so a real slow/unreachable readiness check cannot be
      // reproduced deterministically by racing a short timeout against it.
      // This explicit fault-injection hook forces the failure path after a
      // real cluster has genuinely been created and started, so the
      // fail-closed cleanup guarantee is exercised against real artifacts.
      throw new Error('C3D_BOOTSTRAP_SIMULATED_READINESS_FAILURE: injected for fail-closed cleanup verification');
    }
    await waitForReady({ pgIsReady: binaries.pgIsReady, psql: binaries.psql, host, port, user, database, timeoutMs: readinessTimeoutMs });
  } catch (err) {
    let cleanupError = null;
    try {
      await attemptCleanup({});
    } catch (innerErr) {
      cleanupError = innerErr;
    }
    // Both facts are preserved even when cleanup itself also fails -- the
    // original bootstrap error is never discarded by a secondary cleanup
    // failure, and vice versa.
    const wrapped = new Error(
      `C3D_BOOTSTRAP_FAILED: ${err.message}${cleanupError ? ` | CLEANUP_ALSO_FAILED: ${cleanupError.message}` : ''}`
    );
    wrapped.dataDir = base;
    wrapped.port = port;
    wrapped.postmasterPid = postmasterPid;
    wrapped.cause = err;
    wrapped.cleanupError = cleanupError;
    throw wrapped;
  }

  let cleanedUp = false;
  let lastCleanupProof = null;
  const stop = async (overrides = {}) => {
    if (cleanedUp) return lastCleanupProof;
    // Throws (and leaves `cleanedUp` false) on any failed proof, so a
    // caller can freely retry -- a failed attempt never poisons the
    // ability to try again, and a genuinely successful attempt is cached
    // so a second call is a safe no-op rather than re-running anything.
    const proof = await attemptCleanup(overrides);
    cleanedUp = true;
    lastCleanupProof = proof;
    return proof;
  };

  return {
    dataDir: base,
    pgDataDir: dataDir,
    logFile,
    host,
    port,
    user,
    database,
    postmasterPid,
    pgBinDir: binaries.dir,
    pgVersion: binaries.version,
    stop,
  };
}

async function main() {
  const handle = await bootstrapCluster({});
  try {
    console.log(
      JSON.stringify(
        {
          dataDir: handle.dataDir,
          host: handle.host,
          port: handle.port,
          user: handle.user,
          database: handle.database,
          pgBinDir: handle.pgBinDir,
          pgVersion: handle.pgVersion,
        },
        null,
        2
      )
    );
  } finally {
    await handle.stop();
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err.stack || String(err));
    process.exitCode = 1;
  });
}
