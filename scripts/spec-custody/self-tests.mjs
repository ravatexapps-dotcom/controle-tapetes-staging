import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import {
  CONTRACT_BEGIN, CONTRACT_END, REGISTRIES, SHARED_INSTRUCTION,
  readText, runGit, validateRepository,
} from './validation-core.mjs';

const TRACEABILITY_FIXTURE_PATH = 'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md';

// Inline-pipe positives: prose that legitimately contains `|` and must be accepted
// when appended after the canonical traceability table.
const INLINE_PIPE_POSITIVES = [
  { name: 'POSITIVE_A_PIPE_B', content: 'A | B' },
  { name: 'POSITIVE_PIPE_PROSE', content: 'Use A | B as explanatory prose.' },
  { name: 'POSITIVE_PIPE_NOTATION', content: 'Use A | B as an explanatory notation.' },
  { name: 'POSITIVE_INLINE_CODE', content: 'The expression `A | B` is not a table.' },
  { name: 'POSITIVE_INLINE_SEPARATOR', content: 'This prose contains | one inline separator.' },
  { name: 'POSITIVE_MULTIPLE_PIPES', content: 'Use A | B and C | D as explanatory prose.' },
  { name: 'POSITIVE_BULLET_PIPES', content: '- Compare A | B and C | D.' },
  { name: 'POSITIVE_HEADING_PIPES', content: '### Compare A | B and C | D' },
  { name: 'POSITIVE_BLANK_LINES', content: '\n\n' },
  { name: 'POSITIVE_EXPLANATORY_PROSE', content: 'Ordinary explanatory prose.' },
];

function copyFixtureFile(source, target, path) {
  const destination = resolve(target, path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolve(source, path), destination);
}

// Reads ACTIVE_PHASE/ACTIVE_PHASE_CONTRACT directly out of the SOURCE repository's
// live PROJECT_STATE.md — never hardcoded to any specific phase or contract path,
// so the fixture builder stays generic across every future material phase. This
// is a minimal, self-tests-local extraction (not the full validateRepository
// parse) purely so the fixture can be built faithfully; validation-core.mjs is
// never modified to expose this.
function readSourceBootstrap(source) {
  const state = readText(source, 'PROJECT_STATE.md');
  const activePhase = state.match(/^ACTIVE_PHASE:[ \t]+(.+?)\s*$/m)?.[1];
  const activePhaseContract = state.match(/^ACTIVE_PHASE_CONTRACT:[ \t]+(.+?)\s*$/m)?.[1];
  if (!activePhase || !activePhaseContract) {
    throw new Error('spec-custody fixture: unable to read ACTIVE_PHASE/ACTIVE_PHASE_CONTRACT from the source PROJECT_STATE.md');
  }
  return { activePhase, activePhaseContract };
}

// createFixture() must faithfully represent the source repository's CURRENT
// bootstrap state, including whichever material phase is active right now (if
// any). It never hardcodes a specific contract path: when ACTIVE_PHASE != NONE
// it copies whatever ACTIVE_PHASE_CONTRACT currently points to, preserving its
// repository-relative path, and tracks it in the fixture commit; when
// ACTIVE_PHASE == NONE it copies nothing extra. A source repository whose
// ACTIVE_PHASE/ACTIVE_PHASE_CONTRACT combination is itself invalid (one NONE,
// the other not) must not silently produce a fixture that looks valid — it
// throws instead.
function createFixture(source) {
  const parent = mkdtempSync(join(tmpdir(), 'spec-custody-review-'));
  const root = join(parent, 'repository with spaces');
  mkdirSync(root);
  runGit(root, ['init', '-b', 'dev']);
  runGit(root, ['config', 'user.name', 'Spec Custody Test']);
  runGit(root, ['config', 'user.email', 'spec-custody@example.invalid']);
  runGit(root, ['commit', '--allow-empty', '-m', 'fixture baseline']);
  const checkpoint = runGit(root, ['rev-parse', 'HEAD']);

  const { activePhase, activePhaseContract } = readSourceBootstrap(source);
  if (activePhase === 'NONE') {
    if (activePhaseContract !== 'NONE') {
      throw new Error(`spec-custody fixture: source ACTIVE_PHASE is NONE but ACTIVE_PHASE_CONTRACT is ${activePhaseContract} (invalid source state)`);
    }
  } else if (activePhaseContract === 'NONE') {
    throw new Error(`spec-custody fixture: source ACTIVE_PHASE is ${activePhase} but ACTIVE_PHASE_CONTRACT is NONE (invalid source state)`);
  }

  const files = [
    'PROJECT_STATE.md', 'AGENT_HANDOFF.md', 'CLAUDE.md', 'AGENTS.md', SHARED_INSTRUCTION,
    ...REGISTRIES.map((entry) => entry.path),
    'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md',
    'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md', 'docs/ledgers/G28_LEDGER.md',
  ];
  if (activePhase !== 'NONE') files.push(activePhaseContract);

  for (const file of files) copyFixtureFile(source, root, file);
  const statePath = resolve(root, 'PROJECT_STATE.md');
  const state = readText(root, 'PROJECT_STATE.md');
  writeFileSync(statePath, state.replace(/^ACCEPTED_CHECKPOINT:\s*[0-9a-f]{40}$/m, `ACCEPTED_CHECKPOINT: ${checkpoint}`));
  runGit(root, ['add', '--', ...files]);
  runGit(root, ['commit', '-m', 'docs: establish shared spec custody']);
  return { parent, root };
}

// Sets one bootstrap `KEY: value` line wholesale (used to force ACTIVE_PHASE /
// ACTIVE_PHASE_CONTRACT combinations for testing without hardcoding today's
// specific phase name or contract path).
function setBootstrapLine(text, key, value) {
  return text.replace(new RegExp(`^${key}:.*$`, 'm'), `${key}: ${value}`);
}

// Plants a fresh, correctly-tracked synthetic active-phase contract at `path`
// and points the fixture's bootstrap at it — independent of whatever phase is
// actually active in the real source repository, so these tests stay valid
// across future phase transitions.
function plantActiveContract(fixture, phaseId, path) {
  const marker = `${CONTRACT_BEGIN}\nPHASE_ID: ${phaseId}\n${CONTRACT_END}\n`;
  writeFileSync(resolve(fixture.root, path), marker);
  runGit(fixture.root, ['add', '--', path]);
  mutateState(fixture, (text) => setBootstrapLine(setBootstrapLine(text, 'ACTIVE_PHASE', phaseId), 'ACTIVE_PHASE_CONTRACT', path));
}

function disposeFixture(fixture) {
  const target = resolve(fixture.parent);
  if (!target.startsWith(resolve(tmpdir()))) throw new Error('unsafe fixture cleanup target');
  rmSync(target, { recursive: true, force: true });
}

function mutateFile(root, path, transform) {
  const target = resolve(root, path);
  writeFileSync(target, transform(readFileSync(target, 'utf8')));
}

function insertInSection(text, heading, content) {
  const lines = text.split(/\r?\n/);
  const start = lines.indexOf(heading);
  if (start < 0) throw new Error(`fixture section missing: ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const found = lines[index].match(/^(#+)\s/);
    if (found && found[1].length <= level) {
      end = index;
      break;
    }
  }
  lines.splice(end, 0, '', content);
  return lines.join('\n');
}

function expectFailure(source, name, prefix, mutate) {
  const fixture = createFixture(source);
  try {
    mutate(fixture);
    const errors = validateRepository(fixture.root);
    if (!errors.some((error) => error.startsWith(`${prefix}:`))) {
      throw new Error(`${name} did not trigger ${prefix}. Errors: ${errors.join(' | ')}`);
    }
    return `${name}=PASS`;
  } finally {
    disposeFixture(fixture);
  }
}

function expectSuccess(source, name, mutate) {
  const fixture = createFixture(source);
  try {
    mutate(fixture);
    const errors = validateRepository(fixture.root);
    if (errors.length) throw new Error(`${name} failed: ${errors.join(' | ')}`);
    return `${name}=PASS`;
  } finally {
    disposeFixture(fixture);
  }
}

// Convenience mutators bound to the fixture repository's canonical documents.
function mutateState(fixture, transform) {
  mutateFile(fixture.root, 'PROJECT_STATE.md', transform);
}

function mutateTrace(fixture, transform) {
  mutateFile(fixture.root, TRACEABILITY_FIXTURE_PATH, transform);
}

function insertInTrace(text, content) {
  return insertInSection(text, '## Requirement matrix', content);
}

function insertInRegistry(text, index, content) {
  return insertInSection(text, REGISTRIES[index].heading, content);
}

// Positive fixtures: baseline acceptance and legitimate inline-pipe prose.
function collectPositiveResults(source) {
  const results = [];
  const baseline = createFixture(source);
  try {
    const errors = validateRepository(baseline.root);
    if (errors.length) throw new Error(`baseline failed: ${errors.join(' | ')}`);
    // The baseline fixture faithfully mirrors the source's CURRENT bootstrap —
    // whichever material phase (if any) is actually active right now. When a
    // phase is active, its contract must have been copied and tracked into the
    // fixture (proven here directly, not merely inferred from a clean pass).
    const { activePhase, activePhaseContract } = readSourceBootstrap(source);
    if (activePhase !== 'NONE') {
      if (!existsSync(resolve(baseline.root, activePhaseContract))) {
        throw new Error(`baseline ACTIVE_PHASE_CONTRACT was not copied into the fixture: ${activePhaseContract}`);
      }
      if (!runGit(baseline.root, ['ls-files', '--error-unmatch', '--', activePhaseContract], { allowFailure: true })) {
        throw new Error(`baseline ACTIVE_PHASE_CONTRACT is not tracked in the fixture: ${activePhaseContract}`);
      }
    }
    results.push(
      'POSITIVE_SPACE_PATH=PASS',
      'POSITIVE_ACTIVE_CONTRACT_BASELINE=PASS',
      'POSITIVE_COMPOUND_ANCHOR=PASS',
      'POSITIVE_ACCOUNTED_ANCESTOR=PASS',
    );
  } finally {
    disposeFixture(baseline);
  }
  for (const positive of INLINE_PIPE_POSITIVES) {
    results.push(expectSuccess(source, positive.name, (fixture) => {
      mutateTrace(fixture, (text) => insertInTrace(text, positive.content));
    }));
  }
  results.push(expectSuccess(source, 'POSITIVE_ACTIVE_CONTRACT_TRACKED', (fixture) => {
    plantActiveContract(fixture, 'TEST-PHASE-TRACKED', 'docs/architecture/TEST_PHASE_CONTRACT_TRACKED.md');
  }));
  results.push(expectSuccess(source, 'POSITIVE_NONE_NONE_STATE', (fixture) => {
    mutateState(fixture, (text) => setBootstrapLine(setBootstrapLine(text, 'ACTIVE_PHASE', 'NONE'), 'ACTIVE_PHASE_CONTRACT', 'NONE'));
  }));
  return results;
}

// Negative fixtures covering bootstrap and active-contract rejection (R1, R2).
function collectBootstrapNegatives(source) {
  const results = [];

  results.push(expectFailure(source, 'DUPLICATE_BOOTSTRAP_BLOCK', 'R1', (fixture) => {
    mutateState(fixture, (text) => {
      const block = text.match(/<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->[\s\S]*?<!-- SPEC_CUSTODY_BOOTSTRAP:END -->/)[0];
      return `${text}\n${block}\n`;
    });
  }));

  results.push(expectFailure(source, 'DUPLICATE_BOOTSTRAP_KEY', 'R1', (fixture) => {
    mutateState(fixture, (text) => text.replace(
      'ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C',
      'ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C\nACTIVE_TRACK: PURCHASE_ORDER_PHASE_C',
    ));
  }));

  results.push(expectFailure(source, 'MISSING_BOOTSTRAP_KEY', 'R1', (fixture) => {
    mutateState(fixture, (text) => text.replace(/^ACTIVE_TRACK:.*\r?\n/m, ''));
  }));

  results.push(expectFailure(source, 'MALFORMED_BOOTSTRAP_LINE', 'R1', (fixture) => {
    mutateState(fixture, (text) => text.replace(
      'ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C',
      'ACTIVE TRACK PURCHASE_ORDER_PHASE_C',
    ));
  }));

  results.push(expectFailure(source, 'OUTSIDE_REPOSITORY_POINTER', 'R1', (fixture) => {
    writeFileSync(join(fixture.parent, 'outside.md'), 'outside');
    mutateState(fixture, (text) => text.replace('HANDOFF: AGENT_HANDOFF.md', 'HANDOFF: ../outside.md'));
  }));

  results.push(expectFailure(source, 'UNTRACKED_POINTER', 'R1', (fixture) => {
    writeFileSync(join(fixture.root, 'UNTRACKED.md'), 'untracked');
    mutateState(fixture, (text) => text.replace('HANDOFF: AGENT_HANDOFF.md', 'HANDOFF: UNTRACKED.md'));
  }));

  results.push(expectFailure(source, 'UNRELATED_CONTRACT_SUBSTRING', 'R2', (fixture) => {
    // Uses setBootstrapLine (not a literal 'ACTIVE_PHASE: NONE' replace) so this
    // stays correct regardless of whatever phase is actually active in source.
    mutateState(fixture, (text) => setBootstrapLine(setBootstrapLine(text, 'ACTIVE_PHASE', 'C3C-B'), 'ACTIVE_PHASE_CONTRACT', 'AGENT_HANDOFF.md'));
  }));

  results.push(expectFailure(source, 'DUPLICATE_CONTRACT_MARKERS', 'R2', (fixture) => {
    const path = 'docs/architecture/TEST_PHASE_CONTRACT.md';
    const marker = `${CONTRACT_BEGIN}\nPHASE_ID: C3C-B\n${CONTRACT_END}\n`;
    writeFileSync(resolve(fixture.root, path), marker + marker);
    runGit(fixture.root, ['add', '--', path]);
    mutateState(fixture, (text) => setBootstrapLine(setBootstrapLine(text, 'ACTIVE_PHASE', 'C3C-B'), 'ACTIVE_PHASE_CONTRACT', path));
  }));

  results.push(expectFailure(source, 'MISSING_ACTIVE_CONTRACT_FILE', 'R1', (fixture) => {
    const path = 'docs/architecture/TEST_PHASE_CONTRACT_MISSING.md';
    plantActiveContract(fixture, 'TEST-PHASE-MISSING', path);
    rmSync(resolve(fixture.root, path));
  }));

  results.push(expectFailure(source, 'UNTRACKED_ACTIVE_CONTRACT_FILE', 'R1', (fixture) => {
    const path = 'docs/architecture/TEST_PHASE_CONTRACT_UNTRACKED.md';
    plantActiveContract(fixture, 'TEST-PHASE-UNTRACKED', path);
    runGit(fixture.root, ['rm', '--cached', '--quiet', '--', path]);
  }));

  results.push(expectFailure(source, 'ACTIVE_CONTRACT_PHASE_ID_MISMATCH', 'R2', (fixture) => {
    const path = 'docs/architecture/TEST_PHASE_CONTRACT_MISMATCH.md';
    plantActiveContract(fixture, 'TEST-PHASE-MISMATCH', path);
    mutateFile(fixture.root, path, (text) => text.replace('PHASE_ID: TEST-PHASE-MISMATCH', 'PHASE_ID: TEST-PHASE-WRONG'));
  }));

  results.push(expectFailure(source, 'ACTIVE_PHASE_WITHOUT_CONTRACT', 'R2', (fixture) => {
    // Forces the real (whatever it currently is) active phase's CONTRACT to
    // NONE, leaving ACTIVE_PHASE itself untouched — generic across phases.
    mutateState(fixture, (text) => setBootstrapLine(text, 'ACTIVE_PHASE_CONTRACT', 'NONE'));
  }));

  results.push(expectFailure(source, 'NONE_PHASE_WITH_CONTRACT', 'R2', (fixture) => {
    // Forces ACTIVE_PHASE to NONE while leaving the real ACTIVE_PHASE_CONTRACT
    // (already copied/tracked by createFixture) pointed at a real, valid file.
    mutateState(fixture, (text) => setBootstrapLine(text, 'ACTIVE_PHASE', 'NONE'));
  }));

  return results;
}

// Negative fixtures covering registry, anchor, checkpoint and wrapper rejection
// (R4, R5, R6): malformed rows, mismatched anchors, unaccounted commits, wrappers.
function collectRegistryNegatives(source) {
  const results = [];

  results.push(expectFailure(source, 'MISSING_REQUIREMENT_ROW', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => text.split(/\r?\n/).filter((line) => !line.startsWith('| OC-C3-WRITE-001 |')).join('\n'));
  }));

  results.push(expectFailure(source, 'MALFORMED_NINE_CELL_ROW', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => text.replace(/^\| OC-C3-WRITE-001 \|.*$/m, '| OC-C3-WRITE-001 | malformed |'));
  }));

  results.push(expectFailure(source, 'DUPLICATE_REQUIREMENT_ID', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => {
      const row = text.match(/^\| OC-C3-READ-001 \|.*$/m)[0];
      return text.replace(row, `${row}\n${row}`);
    });
  }));

  results.push(expectFailure(source, 'UNRESOLVED_EXACT_ANCHOR', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => text.replace('::§R.29.2', '::§R.MISSING'));
  }));

  results.push(expectFailure(source, 'AMBIGUOUS_DUPLICATE_HEADING', 'R6', (fixture) => {
    mutateFile(fixture.root, REGISTRIES[0].path, (text) => `${text}\n### §R.29.2 duplicate\n`);
  }));

  results.push(expectFailure(source, 'SHORTENED_ANCHOR_TOKEN', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => text.replace('::§R.29.2', '::§R.29'));
  }));

  results.push(expectFailure(source, 'REGISTRY_MATRIX_ANCHOR_MISMATCH', 'R6', (fixture) => {
    mutateFile(fixture.root, REGISTRIES[0].path, (text) => text.replace(
      '| `OC-C3-READ-001` | `§R.29.2` |',
      '| `OC-C3-READ-001` | `§R.29.4` |',
    ));
  }));

  results.push(expectFailure(source, 'REUSED_SUBJECT_UNACCOUNTED_COMMIT', 'R4', (fixture) => {
    runGit(fixture.root, ['commit', '--allow-empty', '-m', 'docs: establish shared spec custody']);
  }));

  results.push(expectFailure(source, 'UNRELATED_CHECKPOINT', 'R4', (fixture) => {
    const tree = runGit(fixture.root, ['write-tree']);
    const unrelated = runGit(fixture.root, ['commit-tree', tree, '-m', 'unrelated checkpoint']);
    mutateState(fixture, (text) => text.replace(/^ACCEPTED_CHECKPOINT:\s*[0-9a-f]{40}$/m, `ACCEPTED_CHECKPOINT: ${unrelated}`));
  }));

  results.push(expectFailure(source, 'DIVERGENT_WRAPPERS', 'R5', (fixture) => {
    mutateFile(fixture.root, 'AGENTS.md', (text) => `${text}\nDIVERGED\n`);
  }));

  results.push(expectFailure(source, 'UNTRACKED_WRAPPER', 'R1', (fixture) => {
    runGit(fixture.root, ['rm', '--cached', '--quiet', '--', 'AGENTS.md']);
  }));

  return results;
}

// Negative fixtures for the detached-table detection behavior (R6): rows, ids and
// hidden registry entries that must be rejected outside the canonical table.
function collectDetachedTableNegatives(source) {
  const results = [];
  const traceRow = readText(source, 'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md').match(/^\| OC-C3-READ-001 \|.*$/m)[0];
  const lifecycleRow = readText(source, REGISTRIES[0].path).match(/^\| `OC-C3-READ-001` \|.*$/m)[0];
  const schemaRow = readText(source, REGISTRIES[1].path).match(/^\| `OC-C3D-ACL-001` \|.*$/m)[0];

  results.push(expectFailure(source, 'UNEXPECTED_TRACE_ROW_AFTER_BLANK', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, traceRow.replaceAll('OC-C3-READ-001', 'OC-UNEXPECTED-TRACE-001')));
  }));

  results.push(expectFailure(source, 'DUPLICATE_TRACE_ROW_AFTER_BLANK', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, traceRow));
  }));

  results.push(expectFailure(source, 'MALFORMED_NINE_CELL_TRACE_ROW_AFTER_BLANK', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, '| OC-C3-DETACHED-001 | anchor | owner | PLANNED | NONE | NONE | LOCAL | NONE | |'));
  }));

  results.push(expectFailure(source, 'REQUIREMENT_ID_ALONE_AFTER_BLANK', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, 'OC-C3-READ-001'));
  }));

  results.push(expectFailure(source, 'HIDDEN_LIFECYCLE_REGISTRY_ROW', 'R6', (fixture) => {
    mutateFile(fixture.root, REGISTRIES[0].path, (text) => insertInRegistry(text, 0, lifecycleRow.replaceAll('OC-C3-READ-001', 'OC-HIDDEN-LIFECYCLE-001')));
  }));

  results.push(expectFailure(source, 'HIDDEN_SCHEMA_REGISTRY_ROW', 'R6', (fixture) => {
    mutateFile(fixture.root, REGISTRIES[1].path, (text) => insertInRegistry(text, 1, schemaRow.replaceAll('OC-C3D-ACL-001', 'OC-HIDDEN-SCHEMA-001')));
  }));

  results.push(expectFailure(source, 'SECOND_TABLE_AFTER_PROSE', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, 'Explanatory prose.\n\nOTHER | TABLE\n--- | ---'));
  }));

  results.push(expectFailure(source, 'DETACHED_ROW_AFTER_HTML_COMMENT', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, `<!-- note -->\n${traceRow}`));
  }));

  results.push(expectFailure(source, 'DETACHED_ROW_AFTER_MARKDOWN_HEADING', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, `### Notes\n${traceRow}`));
  }));

  results.push(expectFailure(source, 'UNEXPECTED_ID_OUTSIDE_TABLE', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, 'OC-UNEXPECTED-OUTSIDE-001'));
  }));

  results.push(expectFailure(source, 'DUPLICATE_ID_OUTSIDE_TABLE', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, 'OC-C3-READ-001'));
  }));

  results.push(expectFailure(source, 'TABLE_ROW_WITHOUT_LEADING_PIPE', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, 'A | B | C |'));
  }));

  results.push(expectFailure(source, 'TABLE_ROW_WITHOUT_TRAILING_PIPE', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, '| A | B | C'));
  }));

  results.push(expectFailure(source, 'MARKDOWN_SEPARATOR_ROW', 'R6', (fixture) => {
    mutateTrace(fixture, (text) => insertInTrace(text, '--- | --- | ---'));
  }));

  return results;
}

export function runSelfTests(source) {
  return [
    ...collectPositiveResults(source),
    ...collectBootstrapNegatives(source),
    ...collectRegistryNegatives(source),
    ...collectDetachedTableNegatives(source),
  ];
}
