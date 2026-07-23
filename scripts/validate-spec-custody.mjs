import { resolve } from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { validateRepository } from './spec-custody/validation-core.mjs';
import { runSelfTests } from './spec-custody/self-tests.mjs';

function parseOptions(argv) {
  const rootIndex = argv.indexOf('--root');
  if (rootIndex >= 0 && !argv[rootIndex + 1]) throw new Error('--root requires a path');
  const root = resolve(rootIndex >= 0 ? argv[rootIndex + 1] : process.cwd());
  const selfTest = argv.includes('--self-test');
  const commitIndex = argv.indexOf('--commit');
  if (commitIndex >= 0 && !argv[commitIndex + 1]) throw new Error('--commit requires a SHA');
  const commit = commitIndex >= 0 ? argv[commitIndex + 1] : null;
  return { root, selfTest, commit };
}

function validateCommitBinding(root, commit) {
  if (!commit) return null;
  const resolved = execFileSync('git', ['rev-parse', '--verify', `${commit}^{commit}`], {
    cwd: root, encoding: 'utf8'
  }).trim();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (resolved !== head) throw new Error('immutable spec-custody validation requires the supplied commit at HEAD');
  const paths = [
    'docs/governance/current-state.json',
    'docs/governance/traceability/purchase-order-phase-c.json',
    'docs/ledgers/G28_LEDGER.md',
    'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
    'docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md',
    'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
    'docs/governance/AGENT_INSTRUCTIONS.md',
    'AGENTS.md',
    'CLAUDE.md'
  ];
  execFileSync('git', ['diff', '--quiet', resolved, '--', ...paths], { cwd: root });
  return resolved;
}

function runValidation(root, commit = null) {
  const resolved = validateCommitBinding(root, commit);
  const errors = validateRepository(root);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
    return;
  }
  console.log(resolved
    ? `SPEC_CUSTODY_IMMUTABLE_VALIDATION: PASS (${resolved})`
    : 'SPEC_CUSTODY_VALIDATION: PASS');
}

function main() {
  const { root, selfTest, commit } = parseOptions(process.argv);
  if (selfTest) {
    for (const result of runSelfTests(root)) console.log(result);
    return;
  }
  runValidation(root, commit);
}

main();
