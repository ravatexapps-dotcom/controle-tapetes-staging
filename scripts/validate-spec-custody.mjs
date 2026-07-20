import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

const REQUIRED_BOOTSTRAP_KEYS = [
  'LAST_ACCEPTED_PHASE',
  'ACTIVE_PHASE',
  'ACTIVE_PHASE_CONTRACT',
  'ACTIVE_TRACK',
  'NEXT_AUTHORIZABLE_ACTION',
  'GOVERNING_SPEC',
  'TECHNICAL_CONTRACT',
  'SEQUENCE_AUTHORITY',
  'TRACEABILITY',
  'LEDGER',
  'HANDOFF',
  'ACCEPTED_CHECKPOINT',
];

const PATH_KEYS = [
  'GOVERNING_SPEC',
  'TECHNICAL_CONTRACT',
  'SEQUENCE_AUTHORITY',
  'TRACEABILITY',
  'LEDGER',
  'HANDOFF',
];

const TERMINAL_DISPOSITIONS = new Set([
  'SATISFIED',
  'DEFERRED',
  'NOT_APPLICABLE',
  'SUPERSEDED',
]);

const WRAPPERS = ['CLAUDE.md', 'AGENTS.md'];
const SHARED_INSTRUCTION = 'docs/governance/AGENT_INSTRUCTIONS.md';

function runGit(root, args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (error) {
    if (options.allowFailure) return null;
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function readText(root, relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function parseBootstrap(text) {
  const match = text.match(
    /<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->[\s\S]*?```text\s*([\s\S]*?)```[\s\S]*?<!-- SPEC_CUSTODY_BOOTSTRAP:END -->/,
  );
  if (!match) return null;
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Z_]+):\s*(.+)$/);
    if (pair) values[pair[1]] = pair[2].trim();
  }
  return values;
}

function parseTraceability(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\|\s*OC-[A-Z0-9-]+\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length === 9) {
      rows.push({
        id: cells[0],
        anchor: cells[1],
        phase: cells[2],
        disposition: cells[3],
      });
    }
  }
  const closedMatch = text.match(/^CLOSED_MATERIAL_PHASES:\s*(.+)$/m);
  const closedPhases = new Set(
    (closedMatch?.[1] || '')
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value && value !== 'NONE'),
  );
  return { rows, closedPhases };
}

function validateCheckpoint(root, bootstrap, evidenceText, errors) {
  const checkpoint = bootstrap.ACCEPTED_CHECKPOINT;
  if (!/^[0-9a-f]{40}$/.test(checkpoint || '')) {
    errors.push('R4: ACCEPTED_CHECKPOINT must be a full Git SHA.');
    return;
  }
  if (!runGit(root, ['rev-parse', '--verify', `${checkpoint}^{commit}`], { allowFailure: true })) {
    errors.push(`R4: accepted checkpoint does not exist: ${checkpoint}`);
    return;
  }
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', checkpoint, 'HEAD'], {
      cwd: root,
      stdio: 'ignore',
    });
  } catch {
    errors.push(`R4: accepted checkpoint is not an ancestor of HEAD: ${checkpoint}`);
    return;
  }
  const later = runGit(root, ['log', '--format=%H%x09%s', `${checkpoint}..HEAD`]);
  for (const line of later ? later.split(/\r?\n/) : []) {
    const [sha, subject] = line.split('\t');
    if (!evidenceText.includes(sha) && !evidenceText.includes(sha.slice(0, 7)) && !evidenceText.includes(subject)) {
      errors.push(`R4: later commit is not accounted for: ${sha} ${subject}`);
    }
  }
}

function validateWrappers(root, errors) {
  for (const wrapper of WRAPPERS) {
    if (!runGit(root, ['ls-files', '--error-unmatch', '--', wrapper], { allowFailure: true })) {
      errors.push(`R5: wrapper is not tracked: ${wrapper}`);
    }
  }
  if (!existsSync(resolve(root, WRAPPERS[0])) || !existsSync(resolve(root, WRAPPERS[1]))) return;
  const first = readFileSync(resolve(root, WRAPPERS[0]));
  const second = readFileSync(resolve(root, WRAPPERS[1]));
  if (!first.equals(second)) errors.push('R5: CLAUDE.md and AGENTS.md are not byte-identical.');
  const text = first.toString('utf8');
  if (!text.includes(SHARED_INSTRUCTION)) errors.push('R5: wrappers do not point to the shared instruction source.');
  if (!runGit(root, ['ls-files', '--error-unmatch', '--', SHARED_INSTRUCTION], { allowFailure: true })) {
    errors.push(`R5: shared instruction source is not tracked: ${SHARED_INSTRUCTION}`);
  }
}

export function validateRepository(root) {
  const errors = [];
  const statePath = resolve(root, 'PROJECT_STATE.md');
  if (!existsSync(statePath)) return ['R1: PROJECT_STATE.md is missing.'];
  const stateText = readText(root, 'PROJECT_STATE.md');
  const bootstrap = parseBootstrap(stateText);
  if (!bootstrap) return ['R1: SPEC_CUSTODY_BOOTSTRAP block is missing or malformed.'];

  for (const key of REQUIRED_BOOTSTRAP_KEYS) {
    if (!bootstrap[key]) errors.push(`R1: bootstrap key is missing: ${key}`);
  }
  for (const key of PATH_KEYS) {
    if (bootstrap[key] && !existsSync(resolve(root, bootstrap[key]))) {
      errors.push(`R1: bootstrap path does not exist: ${key}=${bootstrap[key]}`);
    }
  }

  if (bootstrap.ACTIVE_PHASE === 'NONE') {
    if (bootstrap.ACTIVE_PHASE_CONTRACT !== 'NONE') {
      errors.push('R2: ACTIVE_PHASE is NONE but ACTIVE_PHASE_CONTRACT is not NONE.');
    }
  } else if (bootstrap.ACTIVE_PHASE_CONTRACT === 'NONE') {
    errors.push('R2: active phase has no referenced phase contract.');
  } else {
    const contractPath = resolve(root, bootstrap.ACTIVE_PHASE_CONTRACT);
    if (!existsSync(contractPath) || !readFileSync(contractPath, 'utf8').includes(bootstrap.ACTIVE_PHASE)) {
      errors.push('R2: active phase and referenced phase contract do not agree.');
    }
  }

  const tracePath = bootstrap.TRACEABILITY;
  if (tracePath && existsSync(resolve(root, tracePath))) {
    const traceText = readText(root, tracePath);
    const { rows, closedPhases } = parseTraceability(traceText);
    const seen = new Set();
    const normativeTexts = [bootstrap.GOVERNING_SPEC, bootstrap.TECHNICAL_CONTRACT]
      .filter((value) => value && existsSync(resolve(root, value)))
      .map((value) => readText(root, value));
    for (const row of rows) {
      if (seen.has(row.id)) errors.push(`R6: duplicate requirement ID: ${row.id}`);
      seen.add(row.id);
      if (closedPhases.has(row.phase) && !TERMINAL_DISPOSITIONS.has(row.disposition)) {
        errors.push(`R3: closed phase ${row.phase} has pending disposition ${row.disposition} for ${row.id}`);
      }
      const [anchorPath, anchorToken] = row.anchor.split('::');
      if (!anchorPath || !anchorToken || !existsSync(resolve(root, anchorPath))) {
        errors.push(`R6: unresolved normative anchor for ${row.id}: ${row.anchor}`);
      } else if (!readText(root, anchorPath).includes(anchorToken)) {
        errors.push(`R6: anchor token is absent for ${row.id}: ${anchorToken}`);
      }
      const registryCount = normativeTexts.reduce(
        (total, text) => total + [...text.matchAll(new RegExp(row.id, 'g'))].length,
        0,
      );
      if (registryCount !== 1) errors.push(`R6: requirement registry count for ${row.id} is ${registryCount}, expected 1.`);
    }
    if (rows.length === 0) errors.push('R6: traceability matrix contains no active requirement rows.');
    const evidenceText = [stateText, readText(root, bootstrap.LEDGER), traceText].join('\n');
    validateCheckpoint(root, bootstrap, evidenceText, errors);
  }

  validateWrappers(root, errors);
  return errors;
}

function copyFixtureFile(sourceRoot, targetRoot, relativePath) {
  const target = resolve(targetRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(sourceRoot, relativePath), target);
}

function createFixture(sourceRoot) {
  const fixture = mkdtempSync(join(tmpdir(), 'spec-custody-validator-'));
  runGit(fixture, ['init', '-b', 'dev']);
  runGit(fixture, ['config', 'user.name', 'Spec Custody Test']);
  runGit(fixture, ['config', 'user.email', 'spec-custody@example.invalid']);
  runGit(fixture, ['commit', '--allow-empty', '-m', 'fixture baseline']);
  const checkpoint = runGit(fixture, ['rev-parse', 'HEAD']);
  const files = [
    'PROJECT_STATE.md',
    'AGENT_HANDOFF.md',
    'CLAUDE.md',
    'AGENTS.md',
    SHARED_INSTRUCTION,
    'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
    'docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md',
    'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md',
    'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md',
    'docs/ledgers/G28_LEDGER.md',
  ];
  for (const file of files) copyFixtureFile(sourceRoot, fixture, file);
  const statePath = resolve(fixture, 'PROJECT_STATE.md');
  writeFileSync(
    statePath,
    readFileSync(statePath, 'utf8').replace(/^ACCEPTED_CHECKPOINT:\s*[0-9a-f]{40}$/m, `ACCEPTED_CHECKPOINT: ${checkpoint}`),
  );
  runGit(fixture, ['add', '--', ...files]);
  runGit(fixture, ['commit', '-m', 'docs: establish shared spec custody']);
  return fixture;
}

function expectRuleFailure(fixture, name, rule, mutate, restore) {
  mutate();
  const errors = validateRepository(fixture);
  restore();
  if (!errors.some((error) => error.startsWith(`${rule}:`))) {
    throw new Error(`${name} did not trigger ${rule}. Errors: ${errors.join(' | ')}`);
  }
  return `${name}=PASS`;
}

function runSelfTests(sourceRoot) {
  const fixture = createFixture(sourceRoot);
  const results = [];
  try {
    const baseline = validateRepository(fixture);
    if (baseline.length) throw new Error(`self-test baseline failed: ${baseline.join(' | ')}`);
    results.push('BASELINE=PASS');

    const tracePath = resolve(fixture, 'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md');
    const statePath = resolve(fixture, 'PROJECT_STATE.md');
    const agentsPath = resolve(fixture, 'AGENTS.md');
    const originalTrace = readFileSync(tracePath, 'utf8');
    const originalState = readFileSync(statePath, 'utf8');
    const originalAgents = readFileSync(agentsPath);

    results.push(expectRuleFailure(fixture, 'R1_MISSING_PATH', 'R1', () => rmSync(tracePath), () => writeFileSync(tracePath, originalTrace)));
    results.push(expectRuleFailure(
      fixture,
      'R2_PHASE_CONTRACT',
      'R2',
      () => writeFileSync(statePath, originalState.replace('ACTIVE_PHASE: NONE', 'ACTIVE_PHASE: C3C-B')),
      () => writeFileSync(statePath, originalState),
    ));
    results.push(expectRuleFailure(
      fixture,
      'R3_CLOSED_PENDING',
      'R3',
      () => writeFileSync(tracePath, originalTrace.replace('| C3C-B | PLANNED |', '| PHASE-C3C-A | PLANNED |')),
      () => writeFileSync(tracePath, originalTrace),
    ));
    results.push(expectRuleFailure(
      fixture,
      'R4_BAD_CHECKPOINT',
      'R4',
      () => writeFileSync(statePath, originalState.replace(/^ACCEPTED_CHECKPOINT:\s*[0-9a-f]{40}$/m, `ACCEPTED_CHECKPOINT: ${'0'.repeat(40)}`)),
      () => writeFileSync(statePath, originalState),
    ));
    results.push(expectRuleFailure(
      fixture,
      'R5_WRAPPER_DIVERGENCE',
      'R5',
      () => writeFileSync(agentsPath, Buffer.concat([originalAgents, Buffer.from('\nDIVERGED\n')])),
      () => writeFileSync(agentsPath, originalAgents),
    ));
    results.push(expectRuleFailure(
      fixture,
      'R6_DUPLICATE_ID',
      'R6',
      () => {
        const row = originalTrace.split(/\r?\n/).find((line) => /^\| OC-/.test(line));
        writeFileSync(tracePath, `${originalTrace}\n${row}\n`);
      },
      () => writeFileSync(tracePath, originalTrace),
    ));
    results.push(expectRuleFailure(
      fixture,
      'R6_BAD_ANCHOR',
      'R6',
      () => writeFileSync(tracePath, originalTrace.replace('::§R.29.2', '::§R.MISSING')),
      () => writeFileSync(tracePath, originalTrace),
    ));
    return results;
  } finally {
    const resolvedFixture = resolve(fixture);
    if (!resolvedFixture.startsWith(resolve(tmpdir()))) throw new Error('unsafe temporary cleanup target');
    rmSync(resolvedFixture, { recursive: true, force: true });
  }
}

const rootArgIndex = process.argv.indexOf('--root');
const root = resolve(rootArgIndex >= 0 ? process.argv[rootArgIndex + 1] : process.cwd());
if (process.argv.includes('--self-test')) {
  for (const result of runSelfTests(root)) console.log(result);
} else {
  const errors = validateRepository(root);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log('SPEC_CUSTODY_VALIDATION: PASS');
  }
}
