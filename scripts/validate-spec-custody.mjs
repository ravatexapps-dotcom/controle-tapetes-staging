import { resolve } from 'node:path';
import process from 'node:process';
import { validateRepository } from './spec-custody/validation-core.mjs';
import { runSelfTests } from './spec-custody/self-tests.mjs';

function parseOptions(argv) {
  const rootIndex = argv.indexOf('--root');
  if (rootIndex >= 0 && !argv[rootIndex + 1]) throw new Error('--root requires a path');
  const root = resolve(rootIndex >= 0 ? argv[rootIndex + 1] : process.cwd());
  const selfTest = argv.includes('--self-test');
  return { root, selfTest };
}

function runValidation(root) {
  const errors = validateRepository(root);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log('SPEC_CUSTODY_VALIDATION: PASS');
}

function main() {
  const { root, selfTest } = parseOptions(process.argv);
  if (selfTest) {
    for (const result of runSelfTests(root)) console.log(result);
    return;
  }
  runValidation(root);
}

main();
