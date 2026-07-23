import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const STATE_PATH = path.join(REPO_ROOT, 'docs', 'governance', 'shadow', 'current-state.json');
export const PROJECT_VIEW_PATH = path.join(REPO_ROOT, 'docs', 'governance', 'shadow', 'generated', 'PROJECT_STATE.md');
export const HANDOFF_VIEW_PATH = path.join(REPO_ROOT, 'docs', 'governance', 'shadow', 'generated', 'AGENT_HANDOFF.md');
export const SHADOW_MARKER = 'GENERATED SHADOW VIEW \u2014 NON-CANONICAL \u2014 DO NOT EDIT';

const REQUIRED_KEYS = [
  'mode', 'authority', 'schema_version', 'state_id', 'last_accepted_phase', 'repository',
  'accepted_checkpoints', 'active_phase', 'next_authorizable_action',
  'active_track', 'governing_pointers', 'environment_boundaries',
  'prohibitions', 'protected_residue', 'live_debts', 'source_mappings'
];

export function loadState(root = REPO_ROOT) {
  const statePath = path.join(root, 'docs', 'governance', 'shadow', 'current-state.json');
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function requireString(value, label, errors) {
  if (typeof value !== 'string' || value.length === 0) errors.push(`${label} must be a non-empty string`);
}

export function validateStateShape(state) {
  const errors = [];
  if (!state || typeof state !== 'object' || Array.isArray(state)) return ['state must be an object'];
  for (const key of REQUIRED_KEYS) if (!(key in state)) errors.push(`missing required field: ${key}`);
  if (state.mode !== 'shadow') errors.push('mode must be shadow');
  if (state.authority !== 'non_canonical_until_supervisor_cutover') errors.push('authority must remain non-canonical_until_supervisor_cutover');
  if (state.schema_version !== '1.0.0') errors.push('schema_version must be 1.0.0');
  requireString(state.state_id, 'state_id', errors);
  if (state.last_accepted_phase !== 'PHASE-C5') errors.push('last_accepted_phase mismatch');
  const repo = state.repository;
  if (!repo || typeof repo !== 'object') errors.push('repository must be an object');
  else {
    for (const key of ['canonical_workspace', 'repository', 'branch', 'checkpoint_remote']) requireString(repo[key], `repository.${key}`, errors);
    if (repo.branch !== 'dev') errors.push('repository.branch must be dev');
    if (repo.checkpoint_remote !== 'staging/dev') errors.push('repository.checkpoint_remote must be staging/dev');
  }
  const checkpoints = state.accepted_checkpoints;
  if (!checkpoints || typeof checkpoints !== 'object') errors.push('accepted_checkpoints must be an object');
  else for (const key of ['product', 'clean_slate_readiness', 'clean_slate_execution']) {
    if (!/^[0-9a-f]{40}$/.test(checkpoints[key] ?? '')) errors.push(`accepted_checkpoints.${key} must be a 40-character lowercase SHA`);
  }
  if (checkpoints?.product !== '3405fdab8e05ec0f81cbfe07c63c489e551fee92') errors.push('accepted_checkpoints.product mismatch');
  if (checkpoints?.clean_slate_readiness !== '62bdcc75c335e3881adb1af6350de801675aa788') errors.push('accepted_checkpoints.clean_slate_readiness mismatch');
  if (checkpoints?.clean_slate_execution !== '770772548baf04c52e9ef020ff94f8bdabf77f03') errors.push('accepted_checkpoints.clean_slate_execution mismatch');
  const phase = state.active_phase;
  if (!phase || typeof phase !== 'object') errors.push('active_phase must be an object');
  else {
    if (phase.id !== 'GOVERNANCE-EFFICIENCY-REFOUNDATION') errors.push('active_phase.id mismatch');
    if (phase.contract !== 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md') errors.push('active_phase.contract mismatch');
    requireString(phase.status, 'active_phase.status', errors);
  }
  const action = state.next_authorizable_action;
  if (!action || typeof action !== 'object') errors.push('next_authorizable_action must be an object');
  else {
    if (action.order_id !== 'GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-HARDENING-R2') errors.push('next_authorizable_action.order_id mismatch');
    if (action.canonical_value !== 'DIRECT SUPERVISOR REVIEW OF GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-HARDENING-R2') errors.push('next_authorizable_action.canonical_value mismatch');
    if (action.risk_class !== 'R1') errors.push('next_authorizable_action.risk_class must be R1');
    requireString(action.mode, 'next_authorizable_action.mode', errors);
    requireString(action.status, 'next_authorizable_action.status', errors);
  }
  requireString(state.active_track, 'active_track', errors);
  const pointers = state.governing_pointers;
  if (!pointers || typeof pointers !== 'object') errors.push('governing_pointers must be an object');
  else for (const [key, value] of Object.entries(pointers)) requireString(value, `governing_pointers.${key}`, errors);
  const env = state.environment_boundaries;
  if (!env || typeof env !== 'object') errors.push('environment_boundaries must be an object');
  else {
    if (env.shared_development !== 'ucrjtfswnfdlxwtmxnoo') errors.push('shared development project mismatch');
    if (env.production !== 'gqmpsxkxynrjvidfmojk') errors.push('production project mismatch');
    if (env.forbidden_project !== 'bhgifjrfagkzubpyqpew') errors.push('forbidden project mismatch');
  }
  if (!Array.isArray(state.prohibitions) || state.prohibitions.length === 0) errors.push('prohibitions must be a non-empty array');
  if (!Array.isArray(state.protected_residue) || state.protected_residue.length !== 3) errors.push('protected_residue must contain exactly three entries');
  if (!Array.isArray(state.live_debts)) errors.push('live_debts must be an array');
  if (!Array.isArray(state.source_mappings)) errors.push('source_mappings must be an array');
  for (const forbidden of ['timestamp', 'git_status', 'credentials', 'live_git']) {
    if (JSON.stringify(state).toLowerCase().includes(forbidden)) errors.push(`state contains forbidden unstable field/content: ${forbidden}`);
  }
  if (Object.keys(state).some(key => /timestamp|created_at|updated_at/i.test(key)) || /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(JSON.stringify(state))) {
    errors.push('state contains forbidden timestamp field/content');
  }
  return errors;
}

function lineList(items, formatter) {
  return items.map(formatter);
}

export function renderProjectStateView(state) {
  const p = state.governing_pointers;
  const c = state.accepted_checkpoints;
  const e = state.environment_boundaries;
  const lines = [
    `# PROJECT_STATE shadow view`,
    `<!-- ${SHADOW_MARKER} -->`,
    '',
    `MODE: ${state.mode}`,
    `AUTHORITY: ${state.authority}`,
    `STATE_ID: ${state.state_id}`,
    '',
    '## Repository',
    `- Branch: ${state.repository.branch}`,
    `- Checkpoint remote: ${state.repository.checkpoint_remote}`,
    '',
    '## Accepted checkpoints',
    `- Product: ${c.product}`,
    `- Clean-slate readiness: ${c.clean_slate_readiness}`,
    `- Clean-slate execution: ${c.clean_slate_execution}`,
    '',
    '## Active phase and next action',
    `- Phase: ${state.active_phase.id}`,
    `- Contract: ${state.active_phase.contract}`,
    `- Status: ${state.active_phase.status}`,
    `- Last accepted phase: ${state.last_accepted_phase}`,
    `- Next action: ${state.next_authorizable_action.canonical_value}`,
    `- Risk class: ${state.next_authorizable_action.risk_class}`,
    `- Gate: ${state.next_authorizable_action.status}`,
    `- Track: ${state.active_track}`,
    '',
    '## Governing pointers',
    ...Object.entries(p).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Environment boundaries',
    `- Shared development: ${e.shared_development}`,
    `- Production: ${e.production}`,
    `- Forbidden project: ${e.forbidden_project}`,
    '',
    '## Protected residue',
    ...lineList(state.protected_residue, item => `- ${item.path}: ${item.status}`),
    '',
    '## Blocking debts',
    ...lineList(state.live_debts.filter(item => item.blocking), item => `- ${item.stable_id} (${item.owner_path}): ${item.status}`),
    '',
    '## Prohibitions',
    ...state.prohibitions.map(item => `- ${item}`),
    '',
    'This is a generated compatibility view. It owns no independent facts; consult the canonical documents and Git directly.'
  ];
  return `${lines.join('\n')}\n`;
}

export function renderHandoffView(state) {
  const p = state.governing_pointers;
  const c = state.accepted_checkpoints;
  const e = state.environment_boundaries;
  const lines = [
    '# ACTIVE OPERATIONAL HANDOFF shadow view',
    `<!-- ${SHADOW_MARKER} -->`,
    '',
    '## Continuity',
    '- Canonical current-state owner: PROJECT_STATE.md.',
    '- This generated handoff is non-canonical and review-only.',
    `- Branch: ${state.repository.branch}; checkpoint remote: ${state.repository.checkpoint_remote}.`,
    '',
    '## Accepted checkpoints',
    `- Product: ${c.product}`,
    `- Clean-slate readiness: ${c.clean_slate_readiness}`,
    `- Clean-slate execution: ${c.clean_slate_execution}`,
    '',
    '## Phase and action',
    `- ${state.active_phase.id}: ${state.active_phase.status}`,
    `- Contract: ${state.active_phase.contract}`,
    `- Next authorizable action: ${state.next_authorizable_action.canonical_value}`,
    `- Risk class: ${state.next_authorizable_action.risk_class}; gate: ${state.next_authorizable_action.status}`,
    `- Active track: ${state.active_track}`,
    '',
    '## Governing pointers',
    ...Object.entries(p).map(([key, value]) => `- ${key}: ${value}`),
    '',
    '## Environment boundaries',
    `- Shared development: ${e.shared_development}`,
    `- Production: ${e.production}`,
    `- Forbidden project: ${e.forbidden_project}`,
    '',
    '## Protected residue and hard stops',
    ...lineList(state.protected_residue, item => `- Preserve ${item.path} exactly (${item.status}).`),
    ...state.prohibitions.map(item => `- ${item}`),
    '',
    '## Recent ledger pointer',
    `- ${p.ledger}: append-only governance phase event for ${state.next_authorizable_action.order_id}.`,
    '',
    'Do not infer documentary-authority cutover, cleanup, compaction, partitioning, archival, or product authorization from this view.'
  ];
  return `${lines.join('\n')}\n`;
}

export function renderViews(state) {
  const shapeErrors = validateStateShape(state);
  if (shapeErrors.length) throw new Error(shapeErrors.join('; '));
  return { project: renderProjectStateView(state), handoff: renderHandoffView(state) };
}

export function writeViews(root = REPO_ROOT) {
  const state = loadState(root);
  const views = renderViews(state);
  const generatedDir = path.join(root, 'docs', 'governance', 'shadow', 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });
  fs.writeFileSync(path.join(generatedDir, 'PROJECT_STATE.md'), views.project, 'utf8');
  fs.writeFileSync(path.join(generatedDir, 'AGENT_HANDOFF.md'), views.handoff, 'utf8');
  return views;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    writeViews(process.cwd());
    console.log('CURRENT_STATE_SHADOW_RENDER: PASS');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
