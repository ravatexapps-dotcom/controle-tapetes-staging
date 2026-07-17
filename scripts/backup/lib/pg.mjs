// scripts/backup/lib/pg.mjs
//
// pg_dump/psql orchestration for the exporter (Camada 3, BK4.2).
//
// Credential handling (contract SS5 — "never as CLI arguments, which can
// leak into process listings/logs"): the connection is passed to every
// child process EXCLUSIVELY via the standard libpq environment variables
// (PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD/PGSSLMODE). No argv of any
// spawned command ever contains a connection string, a password, or any
// fragment of one — pg_dump/psql pick these up automatically from the
// child process environment. This mirrors the existing convention in
// docs/BACKUP_AND_RESTORE.md ("Senha nunca em URL. Use $env:PGPASSWORD
// antes de psql.").
//
// Every function here accepts an injected `spawnSync` (defaults to
// node:child_process.spawnSync) so tests can substitute a fake process
// runner without needing real pg_dump/psql binaries on PATH.

import { spawnSync as realSpawnSync } from 'node:child_process';

export function pgEnv(conn) {
  const env = { ...process.env };
  env.PGHOST = conn.host;
  env.PGPORT = String(conn.port ?? 5432);
  env.PGDATABASE = conn.database ?? 'postgres';
  env.PGUSER = conn.user ?? 'postgres';
  env.PGPASSWORD = conn.password ?? '';
  env.PGSSLMODE = conn.sslmode ?? 'require';
  return env;
}

/**
 * Reads the standard PG* connection env vars. Returns null if the
 * minimum required set (host + password) is not present — the caller
 * decides whether that is a hard error (real run) or fine (dry-run).
 */
export function readPgConnFromEnv(env = process.env) {
  if (!env.PGHOST || !env.PGPASSWORD) return null;
  return {
    host: env.PGHOST,
    port: env.PGPORT ? Number(env.PGPORT) : 5432,
    database: env.PGDATABASE || 'postgres',
    user: env.PGUSER || 'postgres',
    password: env.PGPASSWORD,
    sslmode: env.PGSSLMODE || 'require',
  };
}

function run(bin, args, conn, { spawnSync = realSpawnSync, redact = (s) => s } = {}) {
  const res = spawnSync(bin, args, {
    env: pgEnv(conn),
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (res.error) {
    throw new Error(`${bin}_spawn_failed: ${redact(res.error.message)}`);
  }
  if (res.status !== 0) {
    const stderr = redact(res.stderr || '').trim();
    throw new Error(`${bin}_exit_${res.status}: ${stderr || '(no stderr)'}`);
  }
  return res.stdout ?? '';
}

export function checkBinaryAvailable(bin, { spawnSync = realSpawnSync } = {}) {
  const res = spawnSync(bin, ['--version'], { encoding: 'utf-8' });
  return !res.error && res.status === 0;
}

/**
 * Schema-only dump of the public schema (DDL, restore-into-scratch
 * convenience — the repo's db/*.sql remains the authoritative source).
 *   pg_dump --schema=public --schema-only --no-owner --no-privileges -f <outFile>
 */
export function dumpPublicSchema(conn, outFile, opts = {}) {
  const bin = opts.pgDumpBin || 'pg_dump';
  return run(bin, ['--schema=public', '--schema-only', '--no-owner', '--no-privileges', '-f', outFile], conn, opts);
}

/**
 * Data-only dump of the public schema. --disable-triggers wraps each
 * table's COPY in ALTER TABLE ... DISABLE/ENABLE TRIGGER ALL, so a
 * restore into a schema that already has FK-validating triggers does
 * not fail on load order.
 *   pg_dump --schema=public --data-only --no-owner --no-privileges --disable-triggers -f <outFile>
 */
export function dumpPublicData(conn, outFile, opts = {}) {
  const bin = opts.pgDumpBin || 'pg_dump';
  return run(bin, ['--schema=public', '--data-only', '--no-owner', '--no-privileges', '--disable-triggers', '-f', outFile], conn, opts);
}

/**
 * Full auth schema — structure AND data together (contract SS1: a
 * restore without auth.identities cannot log in; a local scratch
 * Postgres has no pre-existing Supabase auth schema to data-only into).
 *   pg_dump --schema=auth --no-owner --no-privileges -f <outFile>
 */
export function dumpAuthFull(conn, outFile, opts = {}) {
  const bin = opts.pgDumpBin || 'pg_dump';
  return run(bin, ['--schema=auth', '--no-owner', '--no-privileges', '-f', outFile], conn, opts);
}

/**
 * Pre-flight per contract SS1: Storage bucket count must be re-verified
 * every run. Queried directly over the same connection (no PostgREST/
 * Storage-API hop) since the exporter already holds a superuser-class
 * connection.
 */
export function queryStorageBucketCount(conn, opts = {}) {
  const bin = opts.psqlBin || 'psql';
  const out = run(bin, ['-t', '-A', '-c', 'select count(*) from storage.buckets;'], conn, opts);
  const n = parseInt(String(out).trim(), 10);
  if (!Number.isFinite(n)) {
    throw new Error(`storage_bucket_count_unparseable: ${JSON.stringify(out).slice(0, 200)}`);
  }
  return n;
}

/**
 * Per-table row counts across public+auth (the same scope as the dumps,
 * storage/supabase_migrations excluded by construction) — the restore
 * assertion baseline (contract SS3/SS6). Built dynamically via
 * pg_catalog/query_to_xml so no table name is ever hardcoded here — a
 * future table is picked up automatically, never silently missed.
 */
const ROW_COUNT_SQL = `
SELECT COALESCE(jsonb_object_agg(t.tbl, t.row_count), '{}'::jsonb)::text
FROM (
  SELECT (c.relnamespace::regnamespace::text || '.' || c.relname) AS tbl,
         (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', c.relnamespace::regnamespace::text, c.relname), false, true, '')))[1]::text::bigint AS row_count
  FROM pg_class c
  WHERE c.relkind = 'r'
    AND c.relnamespace::regnamespace::text IN ('public','auth')
  ORDER BY 1
) t;
`.trim();

export function queryRowCountManifest(conn, opts = {}) {
  const bin = opts.psqlBin || 'psql';
  const out = run(bin, ['-t', '-A', '-c', ROW_COUNT_SQL], conn, opts);
  const trimmed = String(out).trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    throw new Error(`row_count_manifest_unparseable: ${JSON.stringify(trimmed).slice(0, 200)}`);
  }
}
