// scripts/backup/lib/manifest.mjs
//
// Bundle assembly for the exporter (Camada 3, BK4.2): SHA-256 (contract
// SS3, "stored... never recomputed-on-faith later without a persisted
// value to compare against") and the single dated archive + manifest.

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { spawnSync as realSpawnSync } from 'node:child_process';
import { dirname, basename } from 'node:path';

export function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(path);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * tar+gzip a directory's contents into a single dated archive. Shells
 * out to `tar` (present on GH Actions ubuntu runners, on Windows 10/11
 * via the built-in bsdtar, and via the operator's existing tooling) —
 * no new npm archive dependency, matching this repo's zero-dependency-
 * root convention (CODE_HEALTH_RULES.md SS1).
 *
 * The archive name is passed to `-f` as a bare filename with `cwd` set
 * to its directory, never as an absolute Windows path (`C:\...`).
 * GNU tar (the `tar` on PATH under Git Bash, and on GH Actions ubuntu
 * runners) parses an `-f` argument containing `<letter>:` as a
 * `[user@]host:path` remote-shell spec, not a Windows drive letter —
 * confirmed live during this phase's self-test (`tar_exit_2: Cannot
 * connect to C: resolve failed`). Passing a relative filename with an
 * explicit `cwd` sidesteps the ambiguity identically on GNU tar and
 * bsdtar, on every target OS.
 */
export function createBundle(sourceDir, outFile, opts = {}) {
  const spawnSync = opts.spawnSync || realSpawnSync;
  const bin = opts.tarBin || 'tar';
  const outDir = dirname(outFile);
  const outName = basename(outFile);
  const res = spawnSync(bin, ['-czf', outName, '-C', sourceDir, '.'], { encoding: 'utf-8', cwd: outDir });
  if (res.error) {
    throw new Error(`tar_spawn_failed: ${(opts.redact || ((s) => s))(res.error.message)}`);
  }
  if (res.status !== 0) {
    throw new Error(`tar_exit_${res.status}: ${(opts.redact || ((s) => s))(res.stderr || '').trim()}`);
  }
  return outFile;
}

export function bundleFilename(now = new Date()) {
  const iso = now.toISOString().replace(/[:.]/g, '').replace(/-/g, '');
  // e.g. ravatex-backup-20260717T140500Z.tar.gz
  const stamp = iso.slice(0, 8) + 'T' + iso.slice(9, 15) + 'Z';
  return `ravatex-backup-${stamp}.tar.gz`;
}
