import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const moduleDir = dirname(fileURLToPath(import.meta.url));

export const packageRoot = resolve(moduleDir, '..');

export function resolveFromPackageRoot(...segments: string[]): string {
  return resolve(packageRoot, ...segments);
}
