import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildSourceManifest,
  REQUIRED_BOOTSTRAP_KEYS
} from '../scripts/governance/build-current-state-source-manifest.mjs';
import {
  loadState,
  renderViews
} from '../scripts/governance/render-current-state-shadow.mjs';
import {
  parseBootstrapBlock,
  validateRepository,
  validateSchemaValue
} from '../scripts/governance/validate-current-state-shadow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clone = value => JSON.parse(JSON.stringify(value));
const hasError = (errors, text) => errors.some(error => error.includes(text));

const FIXTURE_FILES = [
  'CLAUDE.md',
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/ledgers/G28_LEDGER.md',
  'docs/governance/AGENT_INSTRUCTIONS.md',
  'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
  'docs/governance/schemas/current-state.schema.json',
  'docs/governance/shadow/current-state.json',
  'docs/governance/shadow/current-state-equivalence.json',
  'docs/governance/shadow/current-state-source-manifest.json',
  'docs/governance/shadow/generated/PROJECT_STATE.md',
  'docs/governance/shadow/generated/AGENT_HANDOFF.md',
  'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
  'docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md',
  'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md',
  'scripts/validate-spec-custody.mjs',
  'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs'
];

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'g28-shadow-fixture-'));
  for (const relativePath of FIXTURE_FILES) {
    const source = path.join(ROOT, relativePath);
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  return root;
}

function cleanup(root) { fs.rmSync(root, { recursive: true, force: true }); }
function read(root, relativePath) { return fs.readFileSync(path.join(root, relativePath), 'utf8'); }
function write(root, relativePath, text) { fs.writeFileSync(path.join(root, relativePath), text, 'utf8'); }
function mutateJson(root, relativePath, mutator) {
  const value = JSON.parse(read(root, relativePath));
  mutator(value);
  write(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}
function mutateBootstrap(root, key, value) {
  const current = read(root, 'PROJECT_STATE.md');
  const next = current.replace(new RegExp(`^${key}: .*?$`, 'm'), `${key}: ${value}`);
  assert.notEqual(next, current, `fixture bootstrap key not found: ${key}`);
  write(root, 'PROJECT_STATE.md', next);
}
function editBootstrapLines(root, mutator) {
  const lines = read(root, 'PROJECT_STATE.md').replace(/\r\n?/g, '\n').split('\n');
  mutator(lines);
  write(root, 'PROJECT_STATE.md', lines.join('\n'));
}

test('valid complete repository fixture passes', () => {
  const root = makeFixture();
  try { assert.deepEqual(validateRepository(root), []); } finally { cleanup(root); }
});

test('new unmapped PROJECT_STATE heading fails', () => {
  const root = makeFixture();
  try {
    write(root, 'PROJECT_STATE.md', `${read(root, 'PROJECT_STATE.md')}\n## Fixture-only unmapped state section\ncontent\n`);
    assert.ok(hasError(validateRepository(root), 'missing mapping source ID'));
  } finally { cleanup(root); }
});

test('new unmapped AGENT_HANDOFF heading fails', () => {
  const root = makeFixture();
  try {
    write(root, 'AGENT_HANDOFF.md', `${read(root, 'AGENT_HANDOFF.md')}\n## Fixture-only unmapped handoff section\ncontent\n`);
    assert.ok(hasError(validateRepository(root), 'missing mapping source ID'));
  } finally { cleanup(root); }
});

test('changed mapped section content with stale hash fails', () => {
  const root = makeFixture();
  try {
    write(root, 'PROJECT_STATE.md', read(root, 'PROJECT_STATE.md').replace('## Active phase and next action', '## Active phase and next action\nfixture mutation'));
    assert.ok(hasError(validateRepository(root), 'source manifest is stale'));
  } finally { cleanup(root); }
});

test('missing mapping fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-equivalence.json', value => value.mappings.pop());
    assert.ok(hasError(validateRepository(root), 'missing mapping source ID'));
  } finally { cleanup(root); }
});

test('duplicate mapping fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-equivalence.json', value => value.mappings.push(clone(value.mappings[0])));
    assert.ok(hasError(validateRepository(root), 'duplicate mapping source ID'));
  } finally { cleanup(root); }
});

test('extra mapping fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-equivalence.json', value => value.mappings.push({ ...value.mappings[0], source_id: 'EXTRA-SOURCE-ID' }));
    assert.ok(hasError(validateRepository(root), 'extra or nonexistent mapping source ID'));
  } finally { cleanup(root); }
});

test('mapping to nonexistent source ID fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-equivalence.json', value => { value.mappings[0].source_id = 'NO-SUCH-SOURCE-ID'; });
    assert.ok(hasError(validateRepository(root), 'extra or nonexistent mapping source ID'));
  } finally { cleanup(root); }
});

test('UNIQUE_CONTENT_REQUIRING_DISPOSITION fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-equivalence.json', value => { value.mappings[0].classification = 'UNIQUE_CONTENT_REQUIRING_DISPOSITION'; });
    assert.ok(hasError(validateRepository(root), 'unique content requires disposition'));
  } finally { cleanup(root); }
});

test('bootstrap active phase mismatch fails', () => {
  const root = makeFixture();
  try { mutateBootstrap(root, 'ACTIVE_PHASE', 'WRONG-PHASE'); assert.ok(hasError(validateRepository(root), 'bootstrap value mismatch: ACTIVE_PHASE')); } finally { cleanup(root); }
});

test('bootstrap active track mismatch fails', () => {
  const root = makeFixture();
  try { mutateBootstrap(root, 'ACTIVE_TRACK', 'WRONG-TRACK'); assert.ok(hasError(validateRepository(root), 'bootstrap value mismatch: ACTIVE_TRACK')); } finally { cleanup(root); }
});

test('bootstrap governing pointer mismatch fails', () => {
  const root = makeFixture();
  try { mutateBootstrap(root, 'LEDGER', 'wrong-ledger.md'); assert.ok(hasError(validateRepository(root), 'bootstrap value mismatch: LEDGER')); } finally { cleanup(root); }
});

test('bootstrap accepted checkpoint mismatch fails', () => {
  const root = makeFixture();
  try { mutateBootstrap(root, 'ACCEPTED_CHECKPOINT', '0000000000000000000000000000000000000000'); assert.ok(hasError(validateRepository(root), 'bootstrap value mismatch: ACCEPTED_CHECKPOINT')); } finally { cleanup(root); }
});

test('missing bootstrap key fails', () => {
  const root = makeFixture();
  try {
    editBootstrapLines(root, lines => lines.splice(lines.findIndex(line => line.startsWith('ACTIVE_TRACK:')), 1));
    assert.ok(hasError(validateRepository(root), 'missing bootstrap key: ACTIVE_TRACK'));
  } finally { cleanup(root); }
});

test('duplicate bootstrap key fails', () => {
  const root = makeFixture();
  try {
    editBootstrapLines(root, lines => { const index = lines.findIndex(line => line.startsWith('ACTIVE_TRACK:')); lines.splice(index + 1, 0, lines[index]); });
    assert.ok(hasError(validateRepository(root), 'duplicate bootstrap key: ACTIVE_TRACK'));
  } finally { cleanup(root); }
});

test('unknown bootstrap key fails', () => {
  const root = makeFixture();
  try {
    editBootstrapLines(root, lines => { const index = lines.findIndex(line => line.startsWith('ACTIVE_TRACK:')); lines.splice(index, 0, 'UNKNOWN_BOOTSTRAP_KEY: value'); });
    assert.ok(hasError(validateRepository(root), 'unknown bootstrap key: UNKNOWN_BOOTSTRAP_KEY'));
  } finally { cleanup(root); }
});

test('unknown top-level state property fails schema validation', () => {
  const state = loadState(ROOT);
  state.unknown_top_level = true;
  const schema = JSON.parse(read(ROOT, 'docs/governance/schemas/current-state.schema.json'));
  assert.ok(hasError(validateSchemaValue(state, schema), 'unknown property unknown_top_level'));
});

test('unknown nested state property fails schema validation', () => {
  const state = loadState(ROOT);
  state.repository.unknown_nested = true;
  const schema = JSON.parse(read(ROOT, 'docs/governance/schemas/current-state.schema.json'));
  assert.ok(hasError(validateSchemaValue(state, schema), 'unknown property unknown_nested'));
});

test('wrong array-item shape fails schema validation', () => {
  const state = loadState(ROOT);
  state.protected_residue[0] = 'wrong-shape';
  const schema = JSON.parse(read(ROOT, 'docs/governance/schemas/current-state.schema.json'));
  assert.ok(hasError(validateSchemaValue(state, schema), 'expected type object'));
});

test('manual generated-view edit fails', () => {
  const root = makeFixture();
  try {
    write(root, 'docs/governance/shadow/generated/PROJECT_STATE.md', `${read(root, 'docs/governance/shadow/generated/PROJECT_STATE.md')}manual edit\n`);
    assert.ok(hasError(validateRepository(root), 'generated view drifted'));
  } finally { cleanup(root); }
});

test('source-manifest stale line range or hash fails', () => {
  const root = makeFixture();
  try {
    mutateJson(root, 'docs/governance/shadow/current-state-source-manifest.json', value => { value.sources[0].units[0].start_line += 1; });
    assert.ok(hasError(validateRepository(root), 'source manifest is stale'));
  } finally { cleanup(root); }
});

test('deterministic source-manifest double build passes', () => {
  const first = buildSourceManifest(ROOT);
  const second = buildSourceManifest(ROOT);
  assert.deepEqual(second, first);
});

test('deterministic generated-view double render passes', () => {
  const state = loadState(ROOT);
  assert.deepEqual(renderViews(clone(state)), renderViews(clone(state)));
});

test('bootstrap parser rejects changed key order', () => {
  const current = read(ROOT, 'PROJECT_STATE.md');
  const parsed = parseBootstrapBlock(current);
  assert.deepEqual(parsed.order, REQUIRED_BOOTSTRAP_KEYS);
});
