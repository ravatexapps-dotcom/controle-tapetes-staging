import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  ACTIVATION,
  CORRECTION,
  CUTOVER_ID,
  NEXT_ORDER,
  PARENT,
  SUBJECT,
  validateCloseout,
  validateCloseoutObjects,
  validateGitSnapshot
} from '../scripts/governance/validate-unit4d-acceptance-closeout.mjs';
import {
  renderCanonicalViews,
  validateRenderedViews
} from '../scripts/governance/render-unit4-canonical-views.mjs';
import {
  activationManifestProjection,
  jsonSha256,
  statePayloadProjection
} from '../scripts/governance/unit4-canonical-json.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(readText(relativePath));
const state = readJson('docs/governance/current-state.json');
const catalog = readJson('docs/governance/catalog/documents.json');
const traceability = readJson('docs/governance/traceability/purchase-order-phase-c.json');
const cutover = readJson('docs/governance/cutover/unit4c-cutover-manifest.json');
const unit4Contract = readText(
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md');
const phaseContract = readText(
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md');

const POSITIVE = [
  'original activation identity',
  'accepted correction identity',
  'closeout parent chain',
  'Unit 4C acceptance',
  'Unit 4D acceptance',
  'documentary-cutover acceptance',
  'epoch remains 1',
  'cutover ID preserved',
  'required parent preserved',
  'accepted checkpoints exact',
  'no second activation',
  'rollback inactive',
  'Unit 5 unauthorized',
  'Unit 5 diagnosis next authorizable',
  'generated-root parity',
  'structured owner continuity',
  'ledger authority continuity',
  'bounded acceptance event',
  'no full-ledger read',
  'no private memory',
  'deterministic fixed point',
  'immutable validation',
  'zero Git mutation'
];

const NEGATIVE = [
  'wrong activation commit',
  'wrong activation parent',
  'wrong correction commit',
  'wrong correction parent',
  'wrong closeout parent',
  'epoch 2',
  'changed cutover ID',
  'changed required parent',
  'second activation',
  'rollback activated',
  'Unit 5 authorized',
  'Unit 4D self-accepted by executor',
  'missing accepted checkpoint',
  'self-referential closeout SHA',
  'root drift',
  'missing ledger acceptance event',
  'full-ledger fallback',
  'generated root treated as owner',
  'closeout claiming cleanup or archival',
  'immutable validator mutation'
];

const clone = value => structuredClone(value);
const objectFixture = () => ({
  state: clone(state),
  cutover: clone(cutover),
  unit4Contract,
  phaseContract,
  catalog: clone(catalog)
});
const stateFailure = mutate => {
  const fixture = objectFixture();
  mutate(fixture);
  return validateCloseoutObjects(fixture);
};
const validation = validateCloseout({
  root: ROOT,
  activationCommit: ACTIVATION,
  acceptedCorrection: CORRECTION
});
const negativeChecks = new Map([
  [NEGATIVE[0], () => stateFailure(value => {
    value.state.accepted_checkpoints.unit_4c_activation = '0'.repeat(40);
  })],
  [NEGATIVE[1], () => stateFailure(value => {
    value.state.activation.required_parent = '0'.repeat(40);
  })],
  [NEGATIVE[2], () => stateFailure(value => {
    value.state.accepted_checkpoints.unit_4c_canonical_correction = '0'.repeat(40);
  })],
  [NEGATIVE[3], () => stateFailure(value => {
    value.cutover.accepted_corrected_checkpoint = ACTIVATION;
  })],
  [NEGATIVE[4], () => validateCloseout({
    root: ROOT,
    commit: CORRECTION,
    activationCommit: ACTIVATION,
    acceptedCorrection: CORRECTION
  }).errors],
  [NEGATIVE[5], () => stateFailure(value => { value.state.authority_epoch = 2; })],
  [NEGATIVE[6], () => stateFailure(value => { value.state.cutover_id = 'WRONG'; })],
  [NEGATIVE[7], () => stateFailure(value => {
    value.cutover.required_parent = '0'.repeat(40);
  })],
  [NEGATIVE[8], () => stateFailure(value => { value.cutover.second_activation = true; })],
  [NEGATIVE[9], () => stateFailure(value => { value.cutover.rollback_executed = true; })],
  [NEGATIVE[10], () => stateFailure(value => {
    value.state.evidence_events.find(event =>
      event.event_id === 'UNIT4D_POST_CUTOVER_ACCEPTANCE').unit5_authorized = true;
  })],
  [NEGATIVE[11], () => stateFailure(value => {
    value.state.evidence_events.find(event =>
      event.event_id === 'UNIT4D_POST_CUTOVER_ACCEPTANCE').classification = 'EXECUTOR_SELF_ACCEPTANCE';
  })],
  [NEGATIVE[12], () => stateFailure(value => {
    delete value.state.accepted_checkpoints.unit_4d_acceptance;
  })],
  [NEGATIVE[13], () => stateFailure(value => {
    value.cutover.closeout_commit = 'f'.repeat(40);
  })],
  [NEGATIVE[14], () => {
    const rendered = renderCanonicalViews(state, catalog, traceability);
    return `${rendered['PROJECT_STATE.md']}\nDRIFT\n` === readText('PROJECT_STATE.md') ? [] : ['root drift'];
  }],
  [NEGATIVE[15], () => stateFailure(value => {
    value.state.bounded_recent_ledger_references = value.state.bounded_recent_ledger_references
      .filter(reference =>
        reference.event_id !== 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4D-POST-CUTOVER-ACCEPTANCE-CLOSEOUT-R1');
  })],
  [NEGATIVE[16], () => stateFailure(value => {
    value.state.bounded_recent_ledger_references[0].partition_path = 'docs/ledgers/G28_LEDGER.md';
  })],
  [NEGATIVE[17], () => stateFailure(value => {
    value.catalog.artifacts.find(item => item.path === 'PROJECT_STATE.md').classification = 'STATE_OWNER';
  })],
  [NEGATIVE[18], () => stateFailure(value => {
    value.phaseContract += '\nUnit 5 cleanup and archival authorized.\n';
  })],
  [NEGATIVE[19], () => validateGitSnapshot({ head: 'a' }, { head: 'b' })]
]);

test('Unit 4D closeout inventories are exact', () => {
  assert.equal(POSITIVE.length, 23);
  assert.equal(NEGATIVE.length, 20);
  assert.equal(new Set(POSITIVE).size, 23);
  assert.equal(new Set(NEGATIVE).size, 20);
  assert.equal(negativeChecks.size, 20);
});

for (const name of POSITIVE) {
  test(`positive: ${name}`, () => {
    assert.deepEqual(validation.errors, []);
    assert.equal(validation.positive_checks, 23);
  });
}

for (const name of NEGATIVE) {
  test(`negative: ${name}`, () => {
    assert.ok(negativeChecks.get(name)().length > 0);
  });
}

test('deterministic identities and generated roots are exact', () => {
  assert.deepEqual(validateCloseoutObjects(objectFixture()), []);
  assert.equal(jsonSha256(statePayloadProjection(state)), state.activation.state_payload_sha256);
  assert.equal(jsonSha256(activationManifestProjection(state)), state.activation.activation_manifest_sha256);
  assert.equal(state.accepted_checkpoints.unit_4c_activation, ACTIVATION);
  assert.equal(state.accepted_checkpoints.unit_4c_canonical_correction, CORRECTION);
  assert.equal(state.accepted_checkpoints.unit_4d_acceptance, CORRECTION);
  assert.equal(state.activation.required_parent, PARENT);
  assert.equal(state.cutover_id, CUTOVER_ID);
  assert.equal(state.next_authorizable_action.order_id, NEXT_ORDER);
  const first = renderCanonicalViews(state, catalog, traceability);
  assert.deepEqual(first, renderCanonicalViews(state, catalog, traceability));
  assert.doesNotThrow(() => validateRenderedViews(first));
  for (const [relativePath, text] of Object.entries(first)) {
    assert.equal(readText(relativePath).replace(/\r\n?/gu, '\n'), text);
  }
});

test('subject is accounted for in structured evidence', () => {
  const event = state.evidence_events.find(item => item.event_id === 'UNIT4D_POST_CUTOVER_ACCEPTANCE');
  assert.equal(event.subject, SUBJECT);
  assert.equal(event.classification, 'EXTERNAL_SUPERVISOR_ACCEPTANCE');
});
