import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { config } from '../src/config.js';
import { packageRoot, resolveFromPackageRoot } from '../src/packagePaths.js';

describe('config (Drive-first)', () => {
  it('exposes googleDriveRootFolderName (Drive-first)', () => {
    expect(config.googleDriveRootFolderName).toBeTruthy();
  });

  it('exposes googleDriveCreateMissingFolders flag', () => {
    expect(typeof config.googleDriveCreateMissingFolders).toBe('boolean');
  });

  it('exposes localCachePath for non-canonical cache', () => {
    expect(config.localCachePath).toBeTruthy();
    expect(isAbsolute(config.localCachePath)).toBe(true);
  });

  it('keeps databasePath and outboxPath local', () => {
    expect(config.databasePath).toBeTruthy();
    expect(config.outboxPath).toBeTruthy();
    expect(isAbsolute(config.databasePath)).toBe(true);
    expect(isAbsolute(config.outboxPath)).toBe(true);
  });
});

describe('packagePaths (G26-B-B1)', () => {
  it('packageRoot points at the documents-ingestor package directory', () => {
    const pkgJsonPath = resolve(packageRoot, 'package.json');
    expect(existsSync(pkgJsonPath)).toBe(true);
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    expect(pkg.name).toBe('ravatex-documents-ingestor');
  });

  it('resolveFromPackageRoot joins segments under packageRoot', () => {
    expect(resolveFromPackageRoot('data', 'app.db')).toBe(resolve(packageRoot, 'data', 'app.db'));
  });

  it('resolveFromPackageRoot ignores process.cwd(), even when cwd is the monorepo root', () => {
    const originalCwd = process.cwd();
    const monorepoRoot = resolve(packageRoot, '..', '..');
    try {
      process.chdir(monorepoRoot);
      expect(resolveFromPackageRoot('data', 'app.db')).toBe(resolve(packageRoot, 'data', 'app.db'));
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('resolveFromPackageRoot passes an absolute override through unchanged (same contract as env var overrides)', () => {
    const absoluteOverride = resolve(packageRoot, '..', 'elsewhere', 'app.db');
    expect(resolveFromPackageRoot(absoluteOverride)).toBe(absoluteOverride);
  });
});
