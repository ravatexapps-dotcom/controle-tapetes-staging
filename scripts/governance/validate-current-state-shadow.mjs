import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  REPO_ROOT,
  STATE_PATH,
  PROJECT_VIEW_PATH,
  HANDOFF_VIEW_PATH,
  SHADOW_MARKER,
  loadState,
  renderViews,
  validateStateShape
} from './render-current-state-shadow.mjs';

const ALLOWED_CLASSIFICATIONS = new Set([
  'STRUCTURED_FIELD',
  'NORMATIVE_OWNER_POINTER',
  'HISTORICAL_LEDGER_CONTENT',
  'DUPLICATED_CURRENT_STATE',
  'UNIQUE_CONTENT_REQUIRING_DISPOSITION'
]);
const REQUIRED_SOURCE_PATHS = [
  'CLAUDE.md',
  'docs/governance/AGENT_INSTRUCTIONS.md',
  'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/ledgers/G28_LEDGER.md',
  'scripts/validate-spec-custody.mjs',
  'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs'
];

function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (error) { throw new Error(`cannot parse ${filePath}: ${error.message}`); }
}

function hasText(root, relativePath, text) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) && fs.readFileSync(fullPath, 'utf8').includes(text);
}

export function validateEquivalence(equivalence, root = REPO_ROOT) {
  const errors = [];
  if (!equivalence || typeof equivalence !== 'object') return ['equivalence must be an object'];
  if (equivalence.schema_version !== '1.0.0') errors.push('equivalence schema_version must be 1.0.0');
  if (equivalence.source_owner !== 'PROJECT_STATE.md') errors.push('equivalence source_owner must be PROJECT_STATE.md');
  if (equivalence.unmapped_operational_facts !== 0) errors.push('equivalence has unmapped operational facts');
  if (equivalence.unique_normative_handoff_rules_without_owner !== 0) errors.push('equivalence has unique normative handoff rules without owner');
  if (!Array.isArray(equivalence.mappings) || equivalence.mappings.length === 0) errors.push('equivalence mappings must be non-empty');
  for (const [index, mapping] of (equivalence.mappings ?? []).entries()) {
    for (const key of ['source_path', 'source_heading_or_range', 'classification', 'destination', 'structured_field_or_owner', 'semantic_status', 'notes']) {
      if (typeof mapping[key] !== 'string' || mapping[key].length === 0) errors.push(`mapping ${index} missing ${key}`);
    }
    if (!ALLOWED_CLASSIFICATIONS.has(mapping.classification)) errors.push(`mapping ${index} has invalid classification`);
    if (mapping.classification === 'UNIQUE_CONTENT_REQUIRING_DISPOSITION') errors.push(`mapping ${index} leaves unique content requiring disposition`);
    if (typeof mapping.source_path === 'string' && !fs.existsSync(path.join(root, mapping.source_path))) errors.push(`mapping ${index} source does not exist: ${mapping.source_path}`);
  }
  return errors;
}

export function validateGeneratedText(projectText, handoffText) {
  const errors = [];
  const checks = [
    ['PROJECT_STATE', projectText, 150],
    ['AGENT_HANDOFF', handoffText, 120]
  ];
  for (const [name, text, maxLines] of checks) {
    if (typeof text !== 'string') { errors.push(`${name} generated view is not text`); continue; }
    if (!text.includes(SHADOW_MARKER)) errors.push(`${name} generated view marker missing`);
    if (!text.endsWith('\n')) errors.push(`${name} generated view must end with LF`);
    if (text.includes('\r')) errors.push(`${name} generated view must use LF only`);
    const lines = text.split('\n');
    if (lines.length - 1 > maxLines) errors.push(`${name} generated view exceeds ${maxLines} lines`);
    if (lines.some(line => line.length > 240)) errors.push(`${name} generated view contains an overlong line`);
    if (/timestamp|git_status|live_git|credential/i.test(text)) errors.push(`${name} generated view contains unstable or secret content`);
  }
  return errors;
}

export function validateGeneratedFiles(root = REPO_ROOT, state = null) {
  const actualState = state ?? loadState(root);
  const errors = [];
  if (!fs.existsSync(PROJECT_VIEW_PATH.replace(REPO_ROOT, root)) || !fs.existsSync(HANDOFF_VIEW_PATH.replace(REPO_ROOT, root))) {
    errors.push('generated shadow files are missing');
    return errors;
  }
  const projectText = fs.readFileSync(path.join(root, 'docs', 'governance', 'shadow', 'generated', 'PROJECT_STATE.md'), 'utf8');
  const handoffText = fs.readFileSync(path.join(root, 'docs', 'governance', 'shadow', 'generated', 'AGENT_HANDOFF.md'), 'utf8');
  errors.push(...validateGeneratedText(projectText, handoffText));
  try {
    const expected = renderViews(actualState);
    if (projectText !== expected.project) errors.push('PROJECT_STATE generated view drifted from deterministic renderer');
    if (handoffText !== expected.handoff) errors.push('AGENT_HANDOFF generated view drifted from deterministic renderer');
    const second = renderViews(actualState);
    if (expected.project !== second.project || expected.handoff !== second.handoff) errors.push('renderer is not deterministic');
  } catch (error) { errors.push(`renderer failed: ${error.message}`); }
  return errors;
}

export function validateCanonicalReconciliation(root = REPO_ROOT, state) {
  const errors = [];
  const project = fs.readFileSync(path.join(root, 'PROJECT_STATE.md'), 'utf8');
  const handoff = fs.readFileSync(path.join(root, 'AGENT_HANDOFF.md'), 'utf8');
  const expected = [
    'ACTIVE_PHASE: GOVERNANCE-EFFICIENCY-REFOUNDATION',
    'ACTIVE_PHASE_CONTRACT: docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
    'NEXT_AUTHORIZABLE_ACTION: DIRECT SUPERVISOR REVIEW OF GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-R1',
    'ACCEPTED_CHECKPOINT: 3405fdab8e05ec0f81cbfe07c63c489e551fee92',
    'ACCEPTED_CLEAN_SLATE_RESET_EXECUTION_CHECKPOINT = 770772548baf04c52e9ef020ff94f8bdabf77f03',
    'ucrjtfswnfdlxwtmxnoo',
    'gqmpsxkxynrjvidfmojk',
    'bhgifjrfagkzubpyqpew'
  ];
  for (const text of expected) if (!project.includes(text)) errors.push(`PROJECT_STATE missing reconciliation text: ${text}`);
  for (const text of ['GOVERNANCE-EFFICIENCY-REFOUNDATION', 'GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-R1', 'PROJECT_STATE.md']) if (!handoff.includes(text)) errors.push(`AGENT_HANDOFF missing reconciliation text: ${text}`);
  const contractPath = path.join(root, state.active_phase.contract);
  if (!fs.existsSync(contractPath)) errors.push('active phase contract is missing');
  else {
    const contract = fs.readFileSync(contractPath, 'utf8');
    const marker = '<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->\nPHASE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION\n<!-- MATERIAL_PHASE_CONTRACT:END -->';
    if (!contract.includes(marker)) errors.push('active phase contract material marker mismatch');
  }
  for (const [name, pointer] of Object.entries(state.governing_pointers)) {
    if (!fs.existsSync(path.join(root, pointer))) errors.push(`governing pointer missing (${name}): ${pointer}`);
  }
  for (const relativePath of REQUIRED_SOURCE_PATHS) if (!fs.existsSync(path.join(root, relativePath))) errors.push(`mandatory reconciliation source missing: ${relativePath}`);
  return errors;
}

export function validateRepository(root = REPO_ROOT) {
  const errors = [];
  let state;
  try { state = loadState(root); } catch (error) { return [error.message]; }
  errors.push(...validateStateShape(state));
  const schemaPath = path.join(root, 'docs', 'governance', 'schemas', 'current-state.schema.json');
  if (!fs.existsSync(schemaPath)) errors.push('current-state.schema.json is missing');
  else {
    try {
      const schema = readJson(schemaPath);
      for (const key of ['mode', 'authority', 'schema_version', 'state_id', 'repository', 'accepted_checkpoints', 'active_phase', 'next_authorizable_action']) if (!schema.required.includes(key)) errors.push(`schema missing required property: ${key}`);
    } catch (error) { errors.push(error.message); }
  }
  const equivalencePath = path.join(root, 'docs', 'governance', 'shadow', 'current-state-equivalence.json');
  if (!fs.existsSync(equivalencePath)) errors.push('current-state-equivalence.json is missing');
  else {
    try { errors.push(...validateEquivalence(readJson(equivalencePath), root)); }
    catch (error) { errors.push(error.message); }
  }
  if (!errors.length) errors.push(...validateCanonicalReconciliation(root, state));
  if (!errors.length) errors.push(...validateGeneratedFiles(root, state));
  return errors;
}

function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
  const errors = validateRepository(root);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else console.log('CURRENT_STATE_SHADOW_VALIDATION: PASS');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
