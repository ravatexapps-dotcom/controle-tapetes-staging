import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  catalogRenderProjection,
  jsonSha256,
  sha256,
  traceabilityRenderProjection
} from './unit4-canonical-json.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const RENDERER_ID = 'scripts/governance/render-unit4-canonical-views.mjs';
export const CUTOVER_ID = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1';
export const CANONICAL_VIEW_PATHS = Object.freeze({
  project: 'PROJECT_STATE.md',
  handoff: 'AGENT_HANDOFF.md',
  documentation: 'docs/DOCUMENTATION_INDEX.md',
  traceability: 'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md'
});
export const CANONICAL_OUTPUT_ALLOWLIST = new Set(Object.values(CANONICAL_VIEW_PATHS));

function marker(source, sourceHash) {
  return [
    '<!-- GOVERNANCE_GENERATED_VIEW:BEGIN -->',
    '',
    'STATUS: ACTIVE_GENERATED_COMPATIBILITY_VIEW',
    `STRUCTURED_SOURCE: ${source}`,
    `RENDERER: ${RENDERER_ID}`,
    'SCHEMA_VERSION: 2.0.0',
    'AUTHORITY_EPOCH: 1',
    `CUTOVER_ID: ${CUTOVER_ID}`,
    `SOURCE_PAYLOAD_SHA256: ${sourceHash}`,
    '',
    '<!-- GOVERNANCE_GENERATED_VIEW:END -->',
    ''
  ];
}

function bullets(object) {
  return Object.entries(object).map(([key, value]) => `- ${key}: \`${value}\``);
}

function projectView(state) {
  return [
    '# Current State',
    ...marker('docs/governance/current-state.json', state.activation.state_payload_sha256),
    'This compatibility view owns no facts. `docs/governance/current-state.json` is canonical.',
    '',
    '## Activation',
    '',
    `- Status: \`${state.activation.status}\``,
    `- Authority epoch: \`${state.authority_epoch}\``,
    `- Cutover ID: \`${state.cutover_id}\``,
    `- Active phase: \`${state.active_phase.status}\``,
    '',
    '## Accepted checkpoints',
    '',
    ...bullets(state.accepted_checkpoints),
    '',
    '## Next authorized action',
    '',
    `- \`${state.next_authorizable_action.canonical_value}\``,
    `- Mode: \`${state.next_authorizable_action.mode}\``,
    `- Status: \`${state.next_authorizable_action.status}\``,
    '',
    '## Governing pointers',
    '',
    ...bullets(state.governing_pointers),
    '',
    '## Blockers and debts',
    '',
    ...(state.live_debts.length ? state.live_debts.map(debt =>
      `- \`${debt.stable_id}\`: ${debt.status}; blocking=${debt.blocking}; owner=\`${debt.owner_path}\`.`)
      : ['- None recorded.']),
    '',
    '## Prohibitions',
    '',
    ...state.prohibitions.map(value => `- \`${value}\``),
    '',
    '## Authority matrix',
    '',
    ...state.root_authorities.map(item =>
      `- \`${item.path}\`: ${item.role}; generated=${item.generated_status}; authoritative=${item.remains_authoritative}.`),
    '',
    '## Bounded ledger references',
    '',
    ...state.bounded_recent_ledger_references.map(reference =>
      `- \`${reference.unit_id}\` / \`${reference.partition_id}\`: ${reference.reason}`),
    ''
  ].join('\n');
}

function handoffView(state) {
  return [
    '# Operational Handoff',
    ...marker('docs/governance/current-state.json', state.activation.state_payload_sha256),
    'This bounded compatibility view owns no facts. Use the structured source and its governing pointers.',
    '',
    `- Repository: \`${state.repository.identity}\``,
    `- Workspace: \`${state.repository.canonical_workspace}\``,
    `- Branch: \`${state.repository.branch}\``,
    `- Objective: \`${state.next_authorizable_action.canonical_value}\``,
    `- Unit 4D: \`${state.phase_status.unit4d}\``,
    `- Unit 5: \`${state.phase_status.unit5}\``,
    '',
    '## Governing pointers',
    '',
    ...bullets(state.governing_pointers),
    '',
    '## Bounded ledger evidence',
    '',
    ...state.bounded_recent_ledger_references.map(reference =>
      `- \`${reference.event_id ?? reference.unit_id}\` in \`${reference.partition_path}\`; ${reference.reason}`),
    ''
  ].join('\n');
}

function documentationView(catalog) {
  const rows = catalog.artifacts.map(item =>
    `| ${item.artifact_id} | \`${item.path}\` | ${item.classification} | ${item.authority} | ${item.disposition} |`);
  return [
    '# Documentation Index',
    ...marker('docs/governance/catalog/documents.json', jsonSha256(catalogRenderProjection(catalog))),
    'This generated view owns no classifications. Normative governance semantics remain in `docs/governance/DOCUMENTATION_MODEL.md`.',
    '',
    '| ID | Path | Classification | Authority | Disposition |',
    '|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

function traceabilityView(traceability) {
  const rows = traceability.requirements.map(item => {
    const sources = item.normative_sources.map(source => `\`${source.path}::${source.anchor}\``).join('; ');
    return `| ${item.requirement_id} | ${sources} | ${item.phase_owner} | ${item.disposition} | ${item.blocking_state} |`;
  });
  return [
    '# Purchase Order Phase-C Traceability',
    ...marker('docs/governance/traceability/purchase-order-phase-c.json',
      jsonSha256(traceabilityRenderProjection(traceability))),
    'This generated view owns no product or technical semantics.',
    '',
    '| Requirement | Normative pointers | Owner | Disposition | Blocking |',
    '|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

export function renderCanonicalViews(state, catalog, traceability) {
  return {
    [CANONICAL_VIEW_PATHS.project]: projectView(state),
    [CANONICAL_VIEW_PATHS.handoff]: handoffView(state),
    [CANONICAL_VIEW_PATHS.documentation]: documentationView(catalog),
    [CANONICAL_VIEW_PATHS.traceability]: traceabilityView(traceability)
  };
}

export function assertCanonicalOutputPaths(requestedPaths) {
  const paths = [...requestedPaths];
  const invalid = paths.filter(value => !CANONICAL_OUTPUT_ALLOWLIST.has(value));
  if (invalid.length || paths.length !== 4 || new Set(paths).size !== 4) {
    throw new Error(`canonical root transaction violation: ${invalid.join(',') || 'partial or duplicate set'}`);
  }
}

export function validateRenderedViews(views) {
  assertCanonicalOutputPaths(Object.keys(views));
  for (const [relativePath, text] of Object.entries(views)) {
    if ((text.match(/GOVERNANCE_GENERATED_VIEW:BEGIN/gu) ?? []).length !== 1
        || (text.match(/GOVERNANCE_GENERATED_VIEW:END/gu) ?? []).length !== 1) {
      throw new Error(`invalid generated marker cardinality: ${relativePath}`);
    }
    if (/CANDIDATE READINESS VIEW|commit_sha|tree_sha|TIMESTAMP:/iu.test(text)) {
      throw new Error(`forbidden generated content: ${relativePath}`);
    }
  }
}

export function writeCanonicalViews(root, views) {
  validateRenderedViews(views);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'unit4c-roots-'));
  try {
    for (const [relativePath, text] of Object.entries(views)) {
      const output = path.join(temporary, relativePath);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, text.replace(/\r\n?/gu, '\n'), 'utf8');
    }
    for (const relativePath of Object.keys(views)) {
      const source = path.join(temporary, relativePath);
      const target = path.join(root, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  return Object.fromEntries(Object.keys(views).map(relativePath =>
    [relativePath, sha256(fs.readFileSync(path.join(root, relativePath)))]));
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  console.error('Use build-unit4-cutover.mjs for the controlled four-root transaction.');
  process.exitCode = 1;
}
