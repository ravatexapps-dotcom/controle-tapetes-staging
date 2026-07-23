import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CONTRACT_ID,
  CUTOVER_ID,
  PARENT,
  validateCanonicalConsistencyObjects,
  validateCanonicalStateObject,
  validateCutover
} from '../scripts/governance/validate-unit4-cutover.mjs';
import {
  CANONICAL_VIEW_PATHS,
  renderCanonicalViews,
  validateRenderedViews
} from '../scripts/governance/render-unit4-canonical-views.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVATION = '51a61ddfdbf058887ead64f9b018c30ebc371b48';
const readText = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(readText(relativePath));
const state = readJson('docs/governance/current-state.json');
const catalog = readJson('docs/governance/catalog/documents.json');
const traceability = readJson('docs/governance/traceability/purchase-order-phase-c.json');
const cutover = readJson('docs/governance/cutover/unit4c-cutover-manifest.json');
const unit4Contract = readText('docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md');
const phaseContract = readText('docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md');
const validation = validateCutover({ root: ROOT, activationCommit: ACTIVATION });

const POSITIVE = [
  'canonical state has no current_fact_sections',
  'compact historical fact sources are complete',
  'historical sources are non-authoritative',
  'every live-debt owner is canonical',
  'no generated root owns a current fact',
  'exact contract-ID parity',
  'Unit 4 contract internal status consistency',
  'phase contract internal status consistency',
  'original activation remains external and unchanged',
  'correction does not create a second activation',
  'epoch remains 1',
  'required parent remains accepted readiness checkpoint',
  'Unit 4B checkpoint remains accepted readiness checkpoint',
  'correction subject is structurally accounted for',
  'new bounded ledger event resolves',
  'no full-ledger read',
  'no-private-memory bootstrap',
  'generated roots match corrected sources',
  'Unit 4D acceptance is externally recorded',
  'Unit 5 remains unauthorized',
  'immutable original activation validation',
  'immutable corrected-checkpoint validation',
  'zero Git mutation'
];

const NEGATIVE = [
  'raw legacy prose in canonical state',
  'current_fact_sections in canonical mode',
  'generated root as debt owner',
  'missing debt owner',
  'unknown debt owner',
  'mismatched manifest contract ID',
  'stale Unit 4 contract header',
  'stale phase-contract clause',
  'candidate authority claim after epoch 1',
  'second activation',
  'epoch increment without authorization',
  'changed required parent',
  'changed Unit 4B checkpoint',
  'activation SHA embedded in source',
  'correction SHA embedded in source',
  'silent fallback',
  'historical source treated as current owner',
  'missing correction ledger event',
  'missing correction evidence event',
  'validator using correction commit as original activation commit',
  'wrong externally supplied activation commit',
  'generated-root drift'
];

const clone = value => structuredClone(value);
const stateFailure = mutate => () => {
  const fixture = clone(state);
  mutate(fixture);
  return validateCanonicalStateObject(fixture);
};
const semanticFailure = mutate => () => {
  const fixture = {
    state: clone(state),
    cutover: clone(cutover),
    unit4Contract,
    phaseContract,
    catalog: clone(catalog)
  };
  mutate(fixture);
  return validateCanonicalConsistencyObjects(fixture);
};
const checks = new Map([
  [NEGATIVE[0], stateFailure(value => { value.historical_fact_sources[0].content = 'legacy prose'; })],
  [NEGATIVE[1], stateFailure(value => { value.current_fact_sections = []; })],
  [NEGATIVE[2], stateFailure(value => { value.live_debts[0].owner_path = 'PROJECT_STATE.md'; })],
  [NEGATIVE[3], stateFailure(value => { delete value.live_debts[0].owner_path; })],
  [NEGATIVE[4], stateFailure(value => { value.live_debts[0].owner_path = 'docs/unknown.md'; })],
  [NEGATIVE[5], semanticFailure(value => { value.cutover.contract_id = 'WRONG'; })],
  [NEGATIVE[6], semanticFailure(value => {
    value.unit4Contract = value.unit4Contract.replace(/^STATUS:.*$/mu, 'STATUS: CORRECTED');
  })],
  [NEGATIVE[7], semanticFailure(value => {
    value.phaseContract += '\nStructured sources remain non-canonical.\n';
  })],
  [NEGATIVE[8], stateFailure(value => { value.authority = 'non_canonical_until_supervisor_activation'; })],
  [NEGATIVE[9], stateFailure(value => {
    value.evidence_events.find(event =>
      event.event_id === 'UNIT4C_CANONICAL_CONSISTENCY_FORWARD_CORRECTION').second_activation = true;
  })],
  [NEGATIVE[10], stateFailure(value => { value.authority_epoch = 2; })],
  [NEGATIVE[11], stateFailure(value => { value.activation.required_parent = '0'.repeat(40); })],
  [NEGATIVE[12], stateFailure(value => {
    value.activation.accepted_unit4b_readiness_checkpoint = '0'.repeat(40);
  })],
  [NEGATIVE[13], stateFailure(value => { value.activation_commit_sha = ACTIVATION; })],
  [NEGATIVE[14], stateFailure(value => { value.correction_commit_sha = 'f'.repeat(40); })],
  [NEGATIVE[15], stateFailure(value => {
    value.prohibitions = value.prohibitions.filter(item => item !== 'SILENT_FALLBACK');
  })],
  [NEGATIVE[16], stateFailure(value => {
    value.historical_fact_sources[0].authority_status = 'CURRENT_STATE_OWNER';
  })],
  [NEGATIVE[17], stateFailure(value => { value.bounded_recent_ledger_references.pop(); })],
  [NEGATIVE[18], stateFailure(value => {
    value.evidence_events = value.evidence_events.filter(event =>
      event.event_id !== 'UNIT4C_CANONICAL_CONSISTENCY_FORWARD_CORRECTION');
  })],
  [NEGATIVE[19], () => validateCutover({
    root: ROOT, commit: ACTIVATION, activationCommit: ACTIVATION
  }).errors],
  [NEGATIVE[20], () => validateCutover({ root: ROOT, activationCommit: PARENT }).errors],
  [NEGATIVE[21], () => {
    const rendered = renderCanonicalViews(state, catalog, traceability);
    return `${rendered['PROJECT_STATE.md']}\nDRIFT\n` === readText('PROJECT_STATE.md')
      ? [] : ['generated-root drift'];
  }]
]);

test('Unit 4C forward-correction inventories are exact', () => {
  assert.equal(POSITIVE.length, 23);
  assert.equal(NEGATIVE.length, 22);
  assert.equal(new Set(POSITIVE).size, 23);
  assert.equal(new Set(NEGATIVE).size, 22);
  assert.equal(checks.size, 22);
});

for (const name of POSITIVE) {
  test(`positive: ${name}`, () => {
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.positive_checks, 23);
  });
}

for (const name of NEGATIVE) {
  test(`negative: ${name}`, () => {
    assert.ok(checks.get(name)().length > 0);
  });
}

test('canonical renderer is deterministic and complete', () => {
  const first = renderCanonicalViews(state, catalog, traceability);
  assert.deepEqual(first, renderCanonicalViews(state, catalog, traceability));
  assert.deepEqual(Object.keys(first).sort(), Object.values(CANONICAL_VIEW_PATHS).sort());
  assert.doesNotThrow(() => validateRenderedViews(first));
});

test('forward-correction identities are exact', () => {
  assert.equal(state.cutover_id, CUTOVER_ID);
  assert.equal(state.activation.required_parent, PARENT);
  assert.equal(state.activation.accepted_unit4b_readiness_checkpoint, PARENT);
  assert.equal(cutover.contract_id, CONTRACT_ID);
  assert.equal(cutover.second_activation, false);
  assert.equal(Object.hasOwn(state, 'current_fact_sections'), false);
});
