import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
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
const ALL_CANONICAL_VIEW_PATHS = Object.freeze(Object.values(CANONICAL_VIEW_PATHS));
export const CANONICAL_OUTPUT_ALLOWLIST = new Set(Object.values(CANONICAL_VIEW_PATHS));

function compatibilityMarker(source) {
  return `<!-- GENERATED_COMPATIBILITY_VIEW: ${source} via ${RENDERER_ID}; NO INDEPENDENT AUTHORITY -->`;
}

function legacyTraceabilityMarker(source, sourceHash) {
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

function pointerText(pointer) {
  return `${pointer.path}::${pointer.anchor}`;
}

function projectView() {
  return [
    '# Project State Compatibility Pointer',
    '',
    compatibilityMarker('docs/governance/current-state.json'),
    '',
    '`docs/governance/current-state.json` is the sole current operational state owner.',
    '`AGENT_HANDOFF.md` is the generated continuation view. Read neither this file nor any historical ledger as independent current-state authority.',
    ''
  ].join('\n');
}

function handoffView(state) {
  const pointers = [
    state.active_phase.contract,
    ...state.active_track.governing_pointers
  ];
  return [
    '# Agent Handoff',
    compatibilityMarker('docs/governance/current-state.json'),
    '',
    'This generated continuation view owns no rules, state, product semantics, or acceptance.',
    '',
    '## Routing',
    '',
    `- Repository: \`${state.repository.identity}\``,
    `- Workspace: \`${state.repository.canonical_workspace}\``,
    `- Branch: \`${state.repository.branch}\``,
    `- Publication boundary: \`${state.repository.publication.remote}/${state.repository.publication.branch}\`; ${state.repository.publication.mode}`,
    '',
    '## Current objective',
    '',
    `- Status: \`${state.active_phase.status}\``,
    `- Objective: ${state.active_phase.immediate_objective}`,
    `- Next authorizable action: \`${state.next_authorizable_action.id}\` / \`${state.next_authorizable_action.mode}\``,
    '',
    '## Blockers and decisions',
    '',
    `- Blockers/debts: ${state.blockers_and_material_debts.map(item => `\`${item.id}\``).join(', ')}`,
    `- Open architect decisions: ${state.open_architect_decisions.join(' | ')}`,
    '',
    '## Prohibitions',
    '',
    `- ${state.prohibitions.join(' | ')}`,
    '',
    '## Task-specific pointers',
    '',
    ...pointers.map(pointer => `- \`${pointerText(pointer)}\``),
    ''
  ].join('\n');
}

function documentationView() {
  return [
    '# Documentation Inventory Pointer',
    '',
    compatibilityMarker('docs/governance/catalog/documents.json'),
    '',
    'This passive generated notice owns no current state, bootstrap rule, classification decision, supervision rule, authorization, or product semantics.',
    '',
    '- Active operational rules: `docs/governance/AGENT_INSTRUCTIONS.md`',
    '- Current operational continuity: `docs/governance/current-state.json`',
    '- Generated continuation view: `AGENT_HANDOFF.md`',
    '- Passive structured inventory: `docs/governance/catalog/documents.json`',
    '- Product and technical semantics: applicable authored specifications and contracts',
    '- Sequence and dependencies: applicable plans and backlogs',
    '- Historical evidence: applicable append-only ledgers and Git',
    '',
    'The complete governed corpus remains discoverable through repository search and the passive structured inventory; it is not a fixed-bootstrap input.',
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
    ...legacyTraceabilityMarker('docs/governance/traceability/purchase-order-phase-c.json',
      jsonSha256(traceabilityRenderProjection(traceability))),
    'This generated view owns no product or technical semantics.',
    '',
    '| Requirement | Normative pointers | Owner | Disposition | Blocking |',
    '|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

function selectionPaths(requestedPaths) {
  if (!Array.isArray(requestedPaths) && !(requestedPaths instanceof Set)) {
    throw new Error('canonical output selection must be an array or set');
  }
  const paths = [...requestedPaths];
  if (!paths.length) throw new Error('canonical output selection must not be empty');
  if (paths.some(value => typeof value !== 'string')) {
    throw new Error('canonical output selection contains a non-string path');
  }
  if (new Set(paths).size !== paths.length) {
    throw new Error('canonical output selection contains a duplicate path');
  }
  const invalid = paths.filter(value => !CANONICAL_OUTPUT_ALLOWLIST.has(value));
  if (invalid.length) {
    throw new Error(`canonical output selection contains an unknown path: ${invalid.join(',')}`);
  }
  return paths;
}

function requiredSource(sources, key, relativePath) {
  const source = sources?.[key];
  if (!source || typeof source !== 'object') {
    throw new Error(`missing required ${key} source for ${relativePath}`);
  }
  return source;
}

function renderSelectedView(relativePath, sources) {
  if (relativePath === CANONICAL_VIEW_PATHS.project) return projectView();
  if (relativePath === CANONICAL_VIEW_PATHS.handoff) {
    return handoffView(requiredSource(sources, 'state', relativePath));
  }
  if (relativePath === CANONICAL_VIEW_PATHS.documentation) return documentationView();
  return traceabilityView(requiredSource(sources, 'traceability', relativePath));
}

function validateViewEntries(views) {
  for (const [relativePath, text] of Object.entries(views)) {
    if (typeof text !== 'string') {
      throw new Error(`rendered canonical output must be text: ${relativePath}`);
    }
    if (relativePath === CANONICAL_VIEW_PATHS.traceability) {
      if ((text.match(/GOVERNANCE_GENERATED_VIEW:BEGIN/gu) ?? []).length !== 1
          || (text.match(/GOVERNANCE_GENERATED_VIEW:END/gu) ?? []).length !== 1) {
        throw new Error(`invalid historical traceability marker cardinality: ${relativePath}`);
      }
    } else if ((text.match(/GENERATED_COMPATIBILITY_VIEW/gu) ?? []).length !== 1) {
      throw new Error(`invalid compact generated marker cardinality: ${relativePath}`);
    }
    if (/CANDIDATE READINESS VIEW|commit_sha|tree_sha|TIMESTAMP:/iu.test(text)) {
      throw new Error(`forbidden generated content: ${relativePath}`);
    }
  }
  if (Object.hasOwn(views, CANONICAL_VIEW_PATHS.handoff)
      && /SHA256|hash chain|ledger history/iu.test(views[CANONICAL_VIEW_PATHS.handoff])) {
    throw new Error('compact handoff contains historical hash or ledger machinery');
  }
}

function assertRenderedPathMatch(views, requestedPaths) {
  if (!views || typeof views !== 'object' || Array.isArray(views)) {
    throw new Error('rendered canonical outputs must be an object');
  }
  const renderedPaths = Object.keys(views);
  if (renderedPaths.length !== requestedPaths.length
      || renderedPaths.some(value => !requestedPaths.includes(value))
      || requestedPaths.some(value => !Object.hasOwn(views, value))) {
    throw new Error('rendered canonical outputs do not match the requested paths');
  }
}

function writeValidatedViews(root, views) {
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

export function assertSelectiveOutputPaths(requestedPaths) {
  return selectionPaths(requestedPaths);
}

export function assertCanonicalOutputPaths(requestedPaths) {
  const paths = selectionPaths(requestedPaths);
  if (paths.length !== ALL_CANONICAL_VIEW_PATHS.length) {
    throw new Error('canonical root transaction violation: partial set');
  }
  return paths;
}

export function renderSelectedCanonicalViews(sources, requestedPaths) {
  const paths = assertSelectiveOutputPaths(requestedPaths);
  return Object.fromEntries(paths.map(relativePath =>
    [relativePath, renderSelectedView(relativePath, sources)]));
}

export function renderCanonicalViews(state, catalog, traceability) {
  assertCanonicalOutputPaths(ALL_CANONICAL_VIEW_PATHS);
  return renderSelectedCanonicalViews({ state, catalog, traceability }, ALL_CANONICAL_VIEW_PATHS);
}

export function validateSelectedRenderedViews(views, requestedPaths) {
  const paths = assertSelectiveOutputPaths(requestedPaths);
  assertRenderedPathMatch(views, paths);
  validateViewEntries(views);
}

export function validateRenderedViews(views) {
  const paths = assertCanonicalOutputPaths(Object.keys(views));
  assertRenderedPathMatch(views, paths);
  validateViewEntries(views);
}

export function writeSelectedCanonicalViews(root, views, requestedPaths) {
  validateSelectedRenderedViews(views, requestedPaths);
  return writeValidatedViews(root, views);
}

export function writeCanonicalViews(root, views) {
  validateRenderedViews(views);
  return writeValidatedViews(root, views);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  console.error('Import this module and write only the explicitly authorized generated paths.');
  process.exitCode = 1;
}
