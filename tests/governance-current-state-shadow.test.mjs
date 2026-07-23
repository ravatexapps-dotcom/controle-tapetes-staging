import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadState,
  renderViews,
  validateStateShape
} from '../scripts/governance/render-current-state-shadow.mjs';
import {
  validateEquivalence,
  validateGeneratedFiles,
  validateGeneratedText
} from '../scripts/governance/validate-current-state-shadow.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validState = loadState(ROOT);
const clone = value => JSON.parse(JSON.stringify(value));
const hasError = (errors, text) => errors.some(error => error.includes(text));

test('valid structured state passes', () => assert.deepEqual(validateStateShape(clone(validState)), []));

test('missing required field fails', () => {
  const state = clone(validState);
  delete state.active_track;
  assert.ok(hasError(validateStateShape(state), 'active_track'));
});

test('unknown schema version fails', () => {
  const state = clone(validState);
  state.schema_version = '9.9.9';
  assert.ok(hasError(validateStateShape(state), 'schema_version'));
});

test('wrong shared-development project fails', () => {
  const state = clone(validState);
  state.environment_boundaries.shared_development = 'wrong';
  assert.ok(hasError(validateStateShape(state), 'shared development'));
});

test('production and forbidden project swap fails', () => {
  const state = clone(validState);
  [state.environment_boundaries.production, state.environment_boundaries.forbidden_project] = [state.environment_boundaries.forbidden_project, state.environment_boundaries.production];
  const errors = validateStateShape(state);
  assert.ok(hasError(errors, 'production project'));
  assert.ok(hasError(errors, 'forbidden project'));
});

test('product checkpoint mismatch fails', () => {
  const state = clone(validState);
  state.accepted_checkpoints.product = '0000000000000000000000000000000000000000';
  assert.ok(hasError(validateStateShape(state), 'accepted_checkpoints.product mismatch'));
});

test('clean-slate execution checkpoint mismatch fails', () => {
  const state = clone(validState);
  state.accepted_checkpoints.clean_slate_execution = '1111111111111111111111111111111111111111';
  assert.ok(hasError(validateStateShape(state), 'accepted_checkpoints.clean_slate_execution mismatch'));
});

test('active phase without contract fails', () => {
  const state = clone(validState);
  state.active_phase.contract = 'NONE';
  assert.ok(hasError(validateStateShape(state), 'active_phase.contract'));
});

test('NONE phase with contract fails', () => {
  const state = clone(validState);
  state.active_phase.id = 'NONE';
  assert.ok(hasError(validateStateShape(state), 'active_phase.id'));
});

test('missing governing pointer fails repository-level equivalence', () => {
  const state = clone(validState);
  state.governing_pointers.ledger = '';
  assert.ok(hasError(validateStateShape(state), 'governing_pointers.ledger'));
});

test('unmapped fact fails equivalence', () => {
  const equivalence = {
    schema_version: '1.0.0',
    source_owner: 'PROJECT_STATE.md',
    unmapped_operational_facts: 1,
    unique_normative_handoff_rules_without_owner: 0,
    mappings: []
  };
  assert.ok(hasError(validateEquivalence(equivalence, ROOT), 'unmapped operational facts'));
});

test('unique handoff rule without owner fails equivalence', () => {
  const equivalence = {
    schema_version: '1.0.0',
    source_owner: 'PROJECT_STATE.md',
    unmapped_operational_facts: 0,
    unique_normative_handoff_rules_without_owner: 1,
    mappings: []
  };
  assert.ok(hasError(validateEquivalence(equivalence, ROOT), 'unique normative handoff rules'));
});

test('generated drift fails exact generated-file validation', () => {
  const state = clone(validState);
  const views = renderViews(state);
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'g28-shadow-'));
  const generated = path.join(tempRoot, 'docs', 'governance', 'shadow', 'generated');
  fs.mkdirSync(generated, { recursive: true });
  fs.writeFileSync(path.join(generated, 'PROJECT_STATE.md'), `${views.project}DRIFT\n`);
  fs.writeFileSync(path.join(generated, 'AGENT_HANDOFF.md'), views.handoff);
  assert.ok(hasError(validateGeneratedFiles(tempRoot, state), 'drifted'));
});

test('deterministic double render is byte-identical', () => {
  const first = renderViews(clone(validState));
  const second = renderViews(clone(validState));
  assert.deepEqual(second, first);
});

test('timestamp field is rejected', () => {
  const state = clone(validState);
  state.created_at = '2026-07-22T00:00:00Z';
  assert.ok(hasError(validateStateShape(state), 'timestamp'));
});

test('live Git status is rejected', () => {
  const state = clone(validState);
  state.git_status = 'clean';
  assert.ok(hasError(validateStateShape(state), 'git_status'));
});

test('state line overflow fails generated view validation', () => {
  const views = renderViews(clone(validState));
  const overflow = `${views.project}${'x\n'.repeat(151)}`;
  assert.ok(hasError(validateGeneratedText(overflow, views.handoff), 'PROJECT_STATE generated view exceeds'));
});

test('handoff line overflow fails generated view validation', () => {
  const views = renderViews(clone(validState));
  const overflow = `${views.handoff}${'x\n'.repeat(121)}`;
  assert.ok(hasError(validateGeneratedText(views.project, overflow), 'AGENT_HANDOFF generated view exceeds'));
});
