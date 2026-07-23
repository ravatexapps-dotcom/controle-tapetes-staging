import childProcess from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { commitReader, validateCommit, worktreeReader } from './git-content-reader.mjs';
import { renderViews } from './render-documentation-shadow.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const CATALOG = 'docs/governance/catalog/documents.json';
export const STATE = 'docs/governance/current-state.json';
export const AGENT_INSTRUCTIONS = 'docs/governance/AGENT_INSTRUCTIONS.md';
export const TRACEABILITY = 'docs/governance/traceability/purchase-order-phase-c.json';
export const RENDERER = 'scripts/governance/render-documentation-shadow.mjs';
export const SHADOW_INDEX = 'docs/governance/shadow/generated/DOCUMENTATION_INDEX.md';
export const SHADOW_TRACE = 'docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md';
export const EXPECTED_ACTIVE_NORMATIVE = 25;

export const CORRECTED_PATHS = Object.freeze([
  'docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md',
  'docs/architecture/CAMADA3_BACKUP_CONTRACT.md',
  'docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md',
  'docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md',
  'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
  'docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md',
  'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md',
  'docs/design/CAMADA2_A32_MOCKUP_APPROVED.md',
  'docs/operations/AUTH_DISABLE_USER_PROD_RELEASE_PLAN.md'
]);

const GENERATED_ROOTS = Object.freeze([
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md'
]);
const GENERATED_PATH_RE = /docs\/governance\/(?:shadow|candidate)\//u;
const AUTHORITY_RE = /\b(?:sole|only|canonical|authority|authoritative|arbiter|owner|owns|source of (?:current state|truth)|current operational state|live current|current phase|next authorizable|precedence|bootstrap|mandatory|must read|records? operational continuity|accepted state for resumption|update)\b/iu;
const GENERATED_RE = /\b(?:generated|regenerate|derived|compatibility view|no independent authority|no independent facts|non-authoritative|optional human-readable|not a source)\b/iu;
const UNCERTAIN_RE = /\b(?:maybe|possibly|unclear|unknown owner|to be classified|unresolved authority)\b/iu;

function git(root, args) {
  return childProcess.execFileSync('git', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }).trim();
}

function snapshotGit(root) {
  return {
    head: git(root, ['rev-parse', 'HEAD']),
    index: git(root, ['write-tree']),
    status: git(root, ['status', '--porcelain=v1', '-uall']),
    refs: git(root, ['show-ref', '--head'])
  };
}

function hasGeneratedTarget(text) {
  return GENERATED_ROOTS.some(value => text.includes(value)) || GENERATED_PATH_RE.test(text);
}

function historicalScope(relativePath, heading, line, documentPreamble) {
  if (/HISTORICAL|SUPERSEDED BY STRUCTURED AUTHORITY EPOCH 1/iu.test(heading)) return true;
  if (relativePath === 'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md'
      && /^# Update \d{4}-\d{2}-\d{2}/u.test(heading)
      && /Every dated .*historical record|historical and superseded/iu.test(documentPreamble)) return true;
  if (relativePath === 'docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md'
      && /This design was .*implemented/iu.test(documentPreamble)) return true;
  if (relativePath === 'docs/ui/CLIENTE_PORTAL_UI_GAP_INVENTORY.md'
      && /diagnostic\/documentation.*Read-only/isu.test(documentPreamble)) return true;
  if (relativePath === 'docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md'
      && /Update \d{4}-\d{2}-\d{2}.*CLOSED \/ ACCEPTED/iu.test(heading)) return true;
  if (relativePath === 'docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md'
      && /CLOSED \/ ACCEPTED.*technical commit/iu.test(line)) return true;
  if (relativePath === 'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md'
      && /\b(?:Ruling 7|Ratification record|projected; NOT authorized)\b/iu.test(`${heading} ${line}`)) return true;
  return false;
}

export function classifyMatch({ relativePath, heading, line, window, documentPreamble }) {
  if (!hasGeneratedTarget(line)) return null;
  if (historicalScope(relativePath, heading, line, documentPreamble)) return 'HISTORICAL_VALID';
  if (UNCERTAIN_RE.test(window) && AUTHORITY_RE.test(window)) return 'UNRESOLVED';
  if (GENERATED_RE.test(window)) return 'GENERATED_COMPATIBILITY_REFERENCE';
  if (relativePath === 'docs/governance/SUPERVISION_PROTOCOL.md'
      && /AGENT_HANDOFF\.md|docs\/DOCUMENTATION_INDEX\.md/iu.test(line)) {
    return line.includes('AGENT_HANDOFF.md')
      ? 'GENERATED_COMPATIBILITY_REFERENCE'
      : 'NON_AUTHORITY_REFERENCE';
  }
  if (/Indexed in `docs\/DOCUMENTATION_INDEX\.md`|listed in\s+`docs\/DOCUMENTATION_INDEX\.md`/iu.test(window)) {
    return 'NON_AUTHORITY_REFERENCE';
  }
  const referenceOnly = line.replace(/[`>*\s;,.()[\]—/-]/gu, '')
    .replace(/PROJECT_STATEmd|AGENT_HANDOFFmd|docsDOCUMENTATION_INDEXmd|docsarchitectureORDEM_COMPRA_C3_TRACEABILITYmd/gu, '') === '';
  if (AUTHORITY_RE.test(line) || (referenceOnly && AUTHORITY_RE.test(window))) return 'ACTIVE_CONTRADICTION';
  return 'NON_AUTHORITY_REFERENCE';
}

export function scanActiveNormative(reader) {
  const catalog = JSON.parse(reader.readText(CATALOG));
  const artifacts = catalog.artifacts.filter(item =>
    item.status === 'ACTIVE' && (item.authority === 'NORMATIVE' || item.role === 'normative'));
  const rows = [];
  const missing = [];
  for (const artifact of artifacts) {
    if (!reader.exists(artifact.path)) { missing.push(artifact.path); continue; }
    const lines = reader.readText(artifact.path).replace(/\r\n?/gu, '\n').split('\n');
    const preamble = lines.slice(0, 30).join('\n');
    let heading = '';
    for (let index = 0; index < lines.length; index += 1) {
      if (/^#{1,6}\s/u.test(lines[index])) heading = lines[index];
      if (!hasGeneratedTarget(lines[index])) continue;
      const window = lines.slice(Math.max(0, index - 2), index + 3).join(' ');
      rows.push({
        path: artifact.path,
        artifact_id: artifact.artifact_id,
        catalog_status: artifact.status,
        catalog_classification: artifact.classification,
        line: index + 1,
        matched_clause: lines[index],
        semantic_classification: classifyMatch({
          relativePath: artifact.path,
          heading,
          line: lines[index],
          window,
          documentPreamble: preamble
        })
      });
    }
  }
  return { artifacts, rows, missing };
}

function requireText(reader, relativePath, values, errors) {
  const text = reader.readText(relativePath);
  for (const value of values) if (!text.includes(value)) errors.push(`${relativePath}: missing ${value}`);
}

function validateCorrectedDocuments(reader, errors) {
  requireText(reader, 'docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md', [
    '`docs/governance/catalog/documents.json`', '`docs/governance/current-state.json`',
    '`docs/governance/AGENT_INSTRUCTIONS.md`', 'optional generated compatibility views'
  ], errors);
  requireText(reader, 'docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md', [
    'this plan owns G28 architecture, sequence, backlog, and hard stops',
    '`docs/governance/current-state.json` owns current operational state',
    'never edit them as independent owners'
  ], errors);
  requireText(reader, 'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md', [
    '`docs/governance/current-state.json` — **Sole owner of live current operational state**',
    'no independent continuity or current-state facts'
  ], errors);
  requireText(reader, 'docs/architecture/CAMADA3_BACKUP_CONTRACT.md', [
    '`docs/governance/current-state.json`', 'no independent authority'
  ], errors);
  requireText(reader, 'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md', [
    'Classification is', 'owned by `docs/governance/catalog/documents.json`',
    '`docs/DOCUMENTATION_INDEX.md` is its generated compatibility view'
  ], errors);
  requireText(reader, 'docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md', [
    'owned solely by `docs/governance/current-state.json`',
    'never edit either as an independent owner'
  ], errors);
  requireText(reader, 'docs/operations/AUTH_DISABLE_USER_PROD_RELEASE_PLAN.md', [
    '`docs/governance/current-state.json` — canonical current operational state',
    '`AGENT_HANDOFF.md` — generated compatibility handoff with no independent authority'
  ], errors);
  requireText(reader, 'docs/design/CAMADA2_A32_MOCKUP_APPROVED.md', [
    'operational state is owned by', '`PROJECT_STATE.md` is a generated'
  ], errors);
  requireText(reader, 'docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md', [
    'This document owns no current operational state',
    '`PROJECT_STATE.md` and', '`AGENT_HANDOFF.md` are generated compatibility views only'
  ], errors);
}

function validateOwners(reader, errors) {
  const state = JSON.parse(reader.readText(STATE));
  const catalog = JSON.parse(reader.readText(CATALOG));
  const traceability = JSON.parse(reader.readText(TRACEABILITY));
  if (state.authority !== 'canonical_current_state') errors.push('structured current-state ownership mismatch');
  if (catalog.authority !== 'CANONICAL_DOCUMENT_CLASSIFICATION_OWNER') errors.push('structured catalog ownership mismatch');
  if (traceability.authority !== 'CANONICAL_PHASE_C_TRACEABILITY_OWNER') errors.push('structured traceability ownership mismatch');
  const instructions = reader.readText(AGENT_INSTRUCTIONS);
  if (!instructions.includes('Generated compatibility views') && !instructions.includes('generated compatibility')) {
    errors.push('agent bootstrap generated-root rejection missing');
  }
  if (!instructions.includes('Normal bootstrap must not require full reads of the four generated roots')) {
    errors.push('agent bootstrap still permits mandatory generated-root reads');
  }
}

function validateRenderer(reader, errors) {
  const catalog = JSON.parse(reader.readText(CATALOG));
  const traceability = JSON.parse(reader.readText(TRACEABILITY));
  const rendered = renderViews(catalog, traceability);
  const renderer = reader.readText(RENDERER);
  if (!renderer.includes('Canonical structured owner: `docs/governance/catalog/documents.json`')) {
    errors.push('shadow renderer catalog owner mismatch');
  }
  if (!renderer.includes('Canonical structured owner: `docs/governance/traceability/purchase-order-phase-c.json`')) {
    errors.push('shadow renderer traceability owner mismatch');
  }
  if (reader.readText(SHADOW_INDEX).replace(/\r\n?/gu, '\n') !== rendered.documentationIndex) {
    errors.push('Documentation Index shadow output drift');
  }
  if (reader.readText(SHADOW_TRACE).replace(/\r\n?/gu, '\n') !== rendered.traceability) {
    errors.push('Phase-C traceability shadow output drift');
  }
  for (const relativePath of [SHADOW_INDEX, SHADOW_TRACE]) {
    if (!reader.readText(relativePath).includes('owns no independent facts')) {
      errors.push(`${relativePath}: independent-fact rejection missing`);
    }
  }
}

export function validateReader(reader) {
  const errors = [];
  const scan = scanActiveNormative(reader);
  if (scan.artifacts.length !== EXPECTED_ACTIVE_NORMATIVE) {
    errors.push(`active normative inventory incomplete: expected ${EXPECTED_ACTIVE_NORMATIVE}; got ${scan.artifacts.length}`);
  }
  if (scan.missing.length) errors.push(`missing active normative artifacts: ${scan.missing.join(', ')}`);
  const contradictions = scan.rows.filter(row => row.semantic_classification === 'ACTIVE_CONTRADICTION');
  const unresolved = scan.rows.filter(row => row.semantic_classification === 'UNRESOLVED');
  if (contradictions.length) errors.push(`active authority contradictions: ${[...new Set(contradictions.map(row => row.path))].join(', ')}`);
  if (unresolved.length) errors.push(`unresolved semantic matches: ${unresolved.map(row => `${row.path}:${row.line}`).join(', ')}`);
  validateCorrectedDocuments(reader, errors);
  validateOwners(reader, errors);
  validateRenderer(reader, errors);
  const count = value => scan.rows.filter(row => row.semantic_classification === value).length;
  return {
    errors,
    active_normative_artifacts: scan.artifacts.length,
    semantic_matches: scan.rows.length,
    active_contradictions: contradictions.length,
    historical_valid: count('HISTORICAL_VALID'),
    generated_references: count('GENERATED_COMPATIBILITY_REFERENCE'),
    non_authority_references: count('NON_AUTHORITY_REFERENCE'),
    unresolved: unresolved.length,
    contradiction_paths: [...new Set(contradictions.map(row => row.path))].sort(),
    rows: scan.rows
  };
}

export function validateRepository({ root = REPO_ROOT, commit = null } = {}) {
  const before = snapshotGit(root);
  const resolved = commit ? validateCommit(root, commit) : null;
  const reader = resolved ? commitReader(root, resolved) : worktreeReader(root);
  const result = validateReader(reader);
  const after = snapshotGit(root);
  if (JSON.stringify(before) !== JSON.stringify(after)) result.errors.push('validator mutated Git state');
  return { ...result, commit: resolved, git_unchanged: JSON.stringify(before) === JSON.stringify(after) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const index = process.argv.indexOf('--commit');
  const result = validateRepository({
    root: process.cwd(),
    commit: index >= 0 ? process.argv[index + 1] : null
  });
  if (result.errors.length) {
    console.error(`CANONICAL_AUTHORITY_CONSUMERS: FAIL\n${result.errors.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log([
      'CANONICAL_AUTHORITY_CONSUMERS: PASS',
      `ACTIVE_NORMATIVE_ARTIFACTS: ${result.active_normative_artifacts}`,
      `SEMANTIC_MATCHES: ${result.semantic_matches}`,
      `ACTIVE_CONTRADICTIONS: ${result.active_contradictions}`,
      `HISTORICAL_VALID: ${result.historical_valid}`,
      `GENERATED_COMPATIBILITY_REFERENCE: ${result.generated_references}`,
      `NON_AUTHORITY_REFERENCE: ${result.non_authority_references}`,
      `UNRESOLVED_MATCHES: ${result.unresolved}`,
      `GIT_UNCHANGED: ${result.git_unchanged}`
    ].join('\n'));
  }
}
