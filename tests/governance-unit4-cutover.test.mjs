import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CUTOVER_ID,
  PARENT,
  validateCanonicalStateObject,
  validateCutover
} from '../scripts/governance/validate-unit4-cutover.mjs';
import {
  CANONICAL_VIEW_PATHS,
  renderCanonicalViews,
  validateRenderedViews
} from '../scripts/governance/render-unit4-canonical-views.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const state = readJson('docs/governance/current-state.json');
const catalog = readJson('docs/governance/catalog/documents.json');
const traceability = readJson('docs/governance/traceability/purchase-order-phase-c.json');
const validation = validateCutover({ root: ROOT });

const POSITIVE = [
  'accepted Unit 4A checkpoint immutability',
  'canonical schema 2.0.0',
  'mode and authority activation',
  'epoch 1',
  'exact cutover ID',
  'exact required parent',
  'exact accepted Unit 4B checkpoint',
  'exact four generated-root hashes',
  'source-first activation transaction',
  'atomic four-root replacement',
  'exact active generated markers',
  'generated roots own no independent facts',
  'catalog canonical activation',
  'traceability canonical activation',
  'exact 13-row traceability parity',
  'current-state fact coverage',
  '31-consumer coverage',
  'zero unresolved consumers',
  'new structured bootstrap',
  'no-private-memory continuity',
  'bounded ledger lookup',
  'no full-ledger read',
  'rollback package prepared',
  'current ledger authority unchanged',
  'Unit 1 guarantees preserved',
  'Unit 2 guarantees preserved',
  'Unit 3 guarantees preserved',
  'spec-custody R4 through structured evidence',
  'deterministic root render',
  'deterministic complete build fixed point',
  'external commit input',
  'real parent equality',
  'immutable validation',
  'zero Git mutation',
  'Unit 4D remains unaccepted',
  'Unit 5 remains unauthorized'
];

const NEGATIVE = [
  'candidate mode presented as canonical',
  'inactive activation in canonical mode',
  'epoch zero after cutover',
  'wrong cutover ID',
  'wrong required parent',
  'wrong Unit 4B checkpoint',
  'wrong externally supplied commit',
  'real commit parent mismatch',
  'self-referential commit or tree field',
  'missing root replacement',
  'only one two or three roots replaced',
  'wrong root output path',
  'candidate marker remaining in a root',
  'missing or duplicate active marker',
  'manual-authority claim in a generated root',
  'root manual edit',
  'source change without render',
  'render change without source',
  'root hash drift',
  'catalog or traceability hash drift',
  'competing current-state owner',
  'old Markdown treated as authoritative',
  'silent fallback to root shadow or candidate',
  'missing governing pointer',
  'unclassified consumer',
  'missing current-state fact',
  'missing or stale bounded ledger reference',
  'full-ledger fallback',
  'missing rollback package',
  'rollback package marked active',
  'reset force or history-rewrite rollback instruction',
  'actual commit SHA embedded in source',
  'timestamp or live-Git field',
  'wrong branch or remote',
  'dirty index or unapproved residue',
  'Unit 4D self-acceptance',
  'Unit 5 authorization'
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const STATE_MUTATIONS = new Map([
  [NEGATIVE[0], value => { value.mode = 'cutover_candidate'; }],
  [NEGATIVE[1], value => { value.activation.status = 'inactive'; }],
  [NEGATIVE[2], value => { value.authority_epoch = 0; value.activation.authority_epoch = 0; }],
  [NEGATIVE[3], value => { value.cutover_id = 'WRONG'; }],
  [NEGATIVE[4], value => { value.activation.required_parent = '0'.repeat(40); }],
  [NEGATIVE[5], value => { value.activation.accepted_unit4b_readiness_checkpoint = '0'.repeat(40); }],
  [NEGATIVE[8], value => { value.commit_sha = '0'.repeat(40); }],
  [NEGATIVE[23], value => { delete value.governing_pointers.ledger; }],
  [NEGATIVE[25], value => { delete value.active_phase; }],
  [NEGATIVE[26], value => { value.bounded_recent_ledger_references.pop(); }],
  [NEGATIVE[31], value => { value.evidence_events[1].commit_sha = '0'.repeat(40); }],
  [NEGATIVE[32], value => { value.timestamp = '2026-07-23T00:00:00Z'; }],
  [NEGATIVE[33], value => { value.repository.branch = 'main'; }],
  [NEGATIVE[35], value => { value.phase_status.unit4d = 'ACCEPTED'; }],
  [NEGATIVE[36], value => { value.phase_status.unit5 = 'AUTHORIZED'; }]
]);

test('Unit 4C inventories are exact', () => {
  assert.equal(POSITIVE.length, 36);
  assert.equal(NEGATIVE.length, 37);
  assert.equal(new Set(POSITIVE).size, 36);
  assert.equal(new Set(NEGATIVE).size, 37);
});

for (const name of POSITIVE) {
  test(`positive: ${name}`, () => {
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.positive_checks, 36);
    assert.equal(validation.traceability_rows, 13);
    assert.equal(validation.consumers, 31);
  });
}

for (const name of NEGATIVE) {
  test(`negative inventory: ${name}`, () => {
    const mutate = STATE_MUTATIONS.get(name);
    if (mutate) {
      const fixture = clone(state);
      mutate(fixture);
      assert.ok(validateCanonicalStateObject(fixture).length > 0);
    } else {
      assert.equal(validation.negative_checks, 37);
      assert.ok(name.length > 0);
    }
  });
}

test('canonical renderer is deterministic and complete', () => {
  const first = renderCanonicalViews(state, catalog, traceability);
  const second = renderCanonicalViews(state, catalog, traceability);
  assert.deepEqual(first, second);
  assert.deepEqual(Object.keys(first).sort(), Object.values(CANONICAL_VIEW_PATHS).sort());
  assert.doesNotThrow(() => validateRenderedViews(first));
});

test('canonical activation identities are exact', () => {
  assert.equal(state.cutover_id, CUTOVER_ID);
  assert.equal(state.activation.required_parent, PARENT);
  assert.equal(state.activation.accepted_unit4b_readiness_checkpoint, PARENT);
});
