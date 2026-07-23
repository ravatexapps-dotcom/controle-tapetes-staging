import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function git(root, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', root, ...args], {
    encoding,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

export function validateCommit(root, commit) {
  if (!/^[0-9a-fA-F]{4,64}$/.test(commit ?? '')) throw new Error('invalid --commit value');
  try {
    return git(root, ['rev-parse', '--verify', `${commit}^{commit}`]).trim();
  } catch {
    throw new Error(`invalid --commit object: ${commit}`);
  }
}

export function worktreeReader(root) {
  return {
    mode: 'worktree',
    listFiles() {
      const output = git(root, ['ls-files', '--cached', '--others', '--exclude-standard', '-z']);
      return output.split('\0').filter(Boolean).sort();
    },
    exists(relativePath) {
      return fs.existsSync(path.join(root, relativePath));
    },
    readText(relativePath) {
      return fs.readFileSync(path.join(root, relativePath), 'utf8');
    },
    objectId(relativePath) {
      try { return git(root, ['hash-object', '--', relativePath]).trim(); }
      catch { return null; }
    }
  };
}

export function commitReader(root, commit) {
  const resolved = validateCommit(root, commit);
  const rows = git(root, ['ls-tree', '-r', '-z', resolved]).split('\0').filter(Boolean);
  const objects = new Map(rows.map(row => {
    const match = row.match(/^\d+\s+\w+\s+([0-9a-f]{40})\t(.+)$/s);
    if (!match) throw new Error(`cannot parse git tree row: ${row}`);
    return [match[2], match[1]];
  }));
  return {
    mode: 'commit',
    commit: resolved,
    listFiles() { return [...objects.keys()].sort(); },
    exists(relativePath) { return objects.has(relativePath); },
    readText(relativePath) {
      if (!objects.has(relativePath)) throw new Error(`missing tracked path at ${resolved}: ${relativePath}`);
      return git(root, ['show', `${resolved}:${relativePath}`]);
    },
    objectId(relativePath) { return objects.get(relativePath) ?? null; }
  };
}
