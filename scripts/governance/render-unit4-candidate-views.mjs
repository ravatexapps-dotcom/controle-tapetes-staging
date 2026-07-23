import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  catalogRenderProjection,
  jsonSha256,
  traceabilityRenderProjection
} from './unit4-canonical-json.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const CANDIDATE_MARKER = 'CANDIDATE READINESS VIEW — NON-CANONICAL — DO NOT EDIT';
export const RENDERER_ID = 'scripts/governance/render-unit4-candidate-views.mjs';
export const CANDIDATE_VIEW_PATHS = Object.freeze({
  project: 'docs/governance/candidate/generated/PROJECT_STATE.md',
  handoff: 'docs/governance/candidate/generated/AGENT_HANDOFF.md',
  documentation: 'docs/governance/candidate/generated/DOCUMENTATION_INDEX.md',
  traceability: 'docs/governance/candidate/generated/ORDEM_COMPRA_C3_TRACEABILITY.md'
});
export const CANDIDATE_OUTPUT_ALLOWLIST = new Set(Object.values(CANDIDATE_VIEW_PATHS));

function marker(source, sourceHash, rootAuthority) {
  return [
    `<!-- ${CANDIDATE_MARKER} -->`,
    `<!-- structured_source: ${source} -->`,
    `<!-- renderer: ${RENDERER_ID} -->`,
    '<!-- target_schema_version: 2.0.0 -->',
    `<!-- deterministic_source_sha256: ${sourceHash} -->`,
    '<!-- candidate_authority: NON_CANONICAL_UNTIL_SUPERVISOR_ACTIVATION -->',
    `<!-- root_authority_path: ${rootAuthority} -->`,
    '',
    `The root document \`${rootAuthority}\` remains authoritative until an accepted Unit 4C cutover.`,
    ''
  ];
}

function projectView(state) {
  const hash = state.activation.state_payload_sha256;
  return [
    '# Current State — Unit 4A candidate readiness view',
    ...marker('docs/governance/current-state.json', hash, 'PROJECT_STATE.md'),
    `- State ID: \`${state.state_id}\``,
    `- Active phase: \`${state.active_phase.id}\``,
    `- Phase status: \`${state.active_phase.status}\``,
    `- Next action: \`${state.next_authorizable_action.canonical_value}\``,
    `- Unit 4A: \`${state.phase_status.unit4a}\``,
    `- Unit 4B: \`${state.phase_status.unit4b}\``,
    `- Authority epoch: \`${state.authority_epoch}\``,
    `- Activation: \`${state.activation.status}\``,
    `- Cutover ID: \`${state.cutover_id}\``,
    '',
    '## Governing pointers',
    '',
    ...Object.entries(state.governing_pointers).map(([key, value]) => `- ${key}: \`${value}\``),
    '',
    '## Live debts and blockers',
    '',
    ...state.live_debts.map(debt =>
      `- \`${debt.stable_id}\` — ${debt.status}; blocking=${debt.blocking}; owner=\`${debt.owner_path}\`.`),
    ''
  ].join('\n');
}

function handoffView(state) {
  const hash = state.activation.state_payload_sha256;
  return [
    '# Operational Handoff — Unit 4A candidate readiness view',
    ...marker('docs/governance/current-state.json', hash, 'AGENT_HANDOFF.md'),
    `- Repository: \`${state.repository.identity}\``,
    `- Workspace: \`${state.repository.canonical_workspace}\``,
    `- Branch: \`${state.repository.branch}\``,
    `- Checkpoint remote: \`${state.repository.checkpoint_remote}\``,
    `- Immediate objective: \`${state.next_authorizable_action.canonical_value}\``,
    `- Mode: \`${state.next_authorizable_action.mode}\``,
    `- Risk: \`${state.next_authorizable_action.risk_class}\``,
    `- Status: \`${state.next_authorizable_action.status}\``,
    '- Unit 4A is not self-accepted.',
    '- Unit 4C, documentary-authority cutover, Unit 4D, and Unit 5 remain unauthorized.',
    '',
    '## Bounded recent ledger evidence',
    '',
    ...state.bounded_recent_ledger_references.map(reference =>
      `- \`${reference.unit_id}\` / \`${reference.partition_id}\` — ${reference.reason}`),
    ''
  ].join('\n');
}

function documentationView(catalog) {
  const hash = jsonSha256(catalogRenderProjection(catalog));
  const rows = catalog.artifacts.map(entry =>
    `| ${entry.artifact_id} | \`${entry.path}\` | ${entry.classification} | ${entry.authority} | ${entry.disposition} |`);
  return [
    '# Documentation Index — Unit 4A candidate readiness view',
    ...marker('docs/governance/catalog/documents.json', hash, 'docs/DOCUMENTATION_INDEX.md'),
    '| ID | Path | Classification | Authority | Disposition |',
    '|---|---|---|---|---|',
    ...rows,
    '',
    `Artifacts classified: ${catalog.artifacts.length}. Candidate activation: ${catalog.activation_status}.`,
    ''
  ].join('\n');
}

function traceabilityView(traceability) {
  const hash = jsonSha256(traceabilityRenderProjection(traceability));
  const rows = traceability.requirements.map(entry => {
    const sources = entry.normative_sources.map(source => `\`${source.path}::${source.anchor}\``).join('; ');
    return `| ${entry.requirement_id} | ${sources} | ${entry.phase_owner} | ${entry.disposition} | ${entry.blocking_state} |`;
  });
  return [
    '# Purchase Order Phase-C Traceability — Unit 4A candidate readiness view',
    ...marker('docs/governance/traceability/purchase-order-phase-c.json', hash,
      'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md'),
    '| Requirement | Normative pointers | Owner | Disposition | Blocking |',
    '|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

export function renderCandidateViews(state, catalog, traceability) {
  return {
    [CANDIDATE_VIEW_PATHS.project]: projectView(state),
    [CANDIDATE_VIEW_PATHS.handoff]: handoffView(state),
    [CANDIDATE_VIEW_PATHS.documentation]: documentationView(catalog),
    [CANDIDATE_VIEW_PATHS.traceability]: traceabilityView(traceability)
  };
}

export function assertCandidateOutputPaths(requestedPaths) {
  const paths = [...requestedPaths];
  const invalid = paths.filter(value => !CANDIDATE_OUTPUT_ALLOWLIST.has(value));
  if (invalid.length || paths.length !== CANDIDATE_OUTPUT_ALLOWLIST.size
      || new Set(paths).size !== CANDIDATE_OUTPUT_ALLOWLIST.size) {
    throw new Error(`candidate output allowlist violation: ${invalid.join(',') || 'incomplete or duplicate set'}`);
  }
}

export function writeCandidateViews(root, views, requestedPaths = Object.keys(views)) {
  assertCandidateOutputPaths(requestedPaths);
  for (const relativePath of requestedPaths) {
    const output = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, views[relativePath].replace(/\r\n?/gu, '\n'), 'utf8');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  console.error('Use build-unit4-readiness.mjs to render candidate views in dependency order.');
  process.exitCode = 1;
}
