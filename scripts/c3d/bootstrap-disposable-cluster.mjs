// scripts/c3d/bootstrap-disposable-cluster.mjs
//
// PHASE-C3D-A disposable PostgreSQL cluster bootstrap.
//
// Creates a fresh, isolated, disposable local PostgreSQL cluster for
// rehearsal/testing only: resolves local binaries, allocates a temp data
// directory outside the repository, picks a distinct non-default port,
// initializes and starts the cluster, proves readiness and a connection,
// and exposes a `stop()` that shuts the cluster down and deletes the data
// directory. Fails closed: any startup/readiness failure still tears down
// whatever was created before rethrowing.
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

function runPgCtlStop({ pgCtl, dataDir }) {
  const result = spawnSync(pgCtl, ['stop', '-D', dataDir, '-m', 'fast', '-w', '-t', '30'], {
    stdio: 'ignore',
    timeout: 45000,
  });
  return result.status === 0;
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
  const cleanup = async () => {
    if (started) {
      runPgCtlStop({ pgCtl: binaries.pgCtl, dataDir });
      await waitForPortClosed(host, port, 10000).catch(() => {});
      // Grace period for Windows auxiliary worker processes (checkpointer,
      // background writer, ...) to finish exiting and release their open
      // handles inside the data directory after the listener has already
      // closed -- see `removeWithRetry`.
      await delay(500);
      started = false;
    }
    await removeWithRetry(base);
  };

  try {
    runInitdb({ initdb: binaries.initdb, dataDir, user });
    runPgCtlStart({ pgCtl: binaries.pgCtl, dataDir, logFile, port, host, startTimeoutSec });
    started = true;
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
    await cleanup();
    const wrapped = new Error(`C3D_BOOTSTRAP_FAILED: ${err.message}`);
    wrapped.dataDir = base;
    wrapped.port = port;
    wrapped.cause = err;
    throw wrapped;
  }

  let stopped = false;
  const stop = async () => {
    if (stopped) return;
    stopped = true;
    // `cleanup()` (via `removeWithRetry`) throws if `base` cannot be proven
    // removed, so a successful return here already guarantees cleanup.
    await cleanup();
  };

  return {
    dataDir: base,
    pgDataDir: dataDir,
    logFile,
    host,
    port,
    user,
    database,
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
