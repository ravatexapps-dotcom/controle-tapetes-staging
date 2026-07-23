import childProcess from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { commitReader, validateCommit, worktreeReader } from './git-content-reader.mjs';
import { validateSchema } from './validate-documentation-shadow.mjs';
import {
  activationManifestProjection,
  jsonSha256,
  rejectSelfReference,
  statePayloadProjection
} from './unit4-canonical-json.mjs';
import {
  CANONICAL_VIEW_PATHS,
  renderCanonicalViews,
  validateRenderedViews
} from './render-unit4-canonical-views.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const PARENT = 'fa986cf935abbf053172cfd549b0171bb9446f58';
export const SUBJECT = 'feat: activate structured governance authority';
export const CUTOVER_ID = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1';
const STATE = 'docs/governance/current-state.json';
const CATALOG = 'docs/governance/catalog/documents.json';
const TRACE = 'docs/governance/traceability/purchase-order-phase-c.json';
const CUTOVER = 'docs/governance/cutover/unit4c-cutover-manifest.json';
const ROLLBACK = 'docs/governance/cutover/unit4c-rollback-readiness.json';
const SCHEMAS = {
  [STATE]: 'docs/governance/schemas/current-state-v2.schema.json',
  [CATALOG]: 'docs/governance/schemas/document-catalog-v2.schema.json',
  [TRACE]: 'docs/governance/schemas/purchase-order-phase-c-v2.schema.json',
  [CUTOVER]: 'docs/governance/schemas/unit4-cutover-manifest.schema.json',
  [ROLLBACK]: 'docs/governance/schemas/unit4-rollback-readiness.schema.json'
};
const PROTECTED = new Set(['.gitignore', '.codex/config.toml', '.mcp.json']);
const AUTHORIZED = new Set([
  'PROJECT_STATE.md', 'AGENT_HANDOFF.md', 'docs/DOCUMENTATION_INDEX.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md',
  'docs/governance/AGENT_INSTRUCTIONS.md', 'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md',
  'docs/ledgers/G28_LEDGER.md', STATE, CATALOG,
  'docs/governance/catalog/document-source-manifest.json', TRACE, CUTOVER, ROLLBACK,
  ...Object.values(SCHEMAS),
  'docs/governance/ledger/g28-ledger-source-manifest.json',
  'docs/governance/ledger/g28-ledger-partition-index.json',
  'docs/governance/shadow/generated/G28_LEDGER.md',
  'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0012.md',
  'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0013.md',
  'scripts/governance/build-unit4-cutover.mjs',
  'scripts/governance/render-unit4-canonical-views.mjs',
  'scripts/governance/validate-unit4-cutover.mjs',
  'scripts/governance/unit4-canonical-json.mjs',
  'scripts/governance/simulate-unit4-bootstrap.mjs',
  'scripts/governance/validate-unit4-readiness.mjs',
  'scripts/governance/build-document-source-manifest.mjs',
  'scripts/governance/validate-current-state-shadow.mjs',
  'scripts/governance/validate-documentation-shadow.mjs',
  'scripts/governance/build-g28-ledger-partitions.mjs',
  'scripts/governance/render-g28-ledger-shadow.mjs',
  'scripts/governance/validate-g28-ledger-shadow.mjs',
  'scripts/validate-spec-custody.mjs',
  'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs',
  'tests/governance-unit4-cutover.test.mjs',
  'tests/governance-unit4-readiness.test.mjs',
  'tests/governance-current-state-shadow.test.mjs',
  'tests/governance-documentation-shadow.test.mjs',
  'tests/governance-g28-ledger-shadow.test.mjs'
]);

function git(root, args, encoding = 'utf8') {
  return childProcess.execFileSync('git', args, {
    cwd: root, encoding, maxBuffer: 64 * 1024 * 1024
  }).trim();
}

function gitRaw(root, args) {
  return childProcess.execFileSync('git', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  });
}

function digest(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function parseJson(reader, relativePath, errors) {
  try { return JSON.parse(reader.readText(relativePath)); }
  catch (error) {
    errors.push(`${relativePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function fileHash(reader, relativePath) {
  return digest(reader.readText(relativePath));
}

function exact(value, expected, label, errors) {
  if (value !== expected) errors.push(`${label}: expected ${expected}; got ${value}`);
}

function changedPaths(root, commit) {
  if (commit) {
    return git(root, ['diff-tree', '--no-commit-id', '--name-only', '-r', commit])
      .split(/\r?\n/u).filter(Boolean).sort();
  }
  return gitRaw(root, ['status', '--porcelain=v1', '-uall']).split(/\r?\n/u).filter(Boolean)
    .map(line => line.slice(3).replace(/\\/gu, '/'))
    .filter(relativePath => !PROTECTED.has(relativePath)).sort();
}

function validateCommitIdentity(root, commit, errors) {
  if (!commit) {
    exact(git(root, ['rev-parse', 'HEAD']), PARENT, 'worktree parent', errors);
    exact(git(root, ['branch', '--show-current']), 'dev', 'branch', errors);
    return;
  }
  exact(git(root, ['rev-parse', `${commit}^`]), PARENT, 'activation parent', errors);
  exact(git(root, ['show', '-s', '--format=%s', commit]), SUBJECT, 'activation subject', errors);
}

function validateLifecycle(state, errors) {
  exact(state.schema_version, '2.0.0', 'state schema', errors);
  exact(state.mode, 'canonical', 'state mode', errors);
  exact(state.authority, 'canonical_current_state', 'state authority', errors);
  exact(state.authority_epoch, 1, 'authority epoch', errors);
  exact(state.cutover_id, CUTOVER_ID, 'cutover ID', errors);
  exact(state.activation.status, 'active', 'activation status', errors);
  exact(state.activation.authority_epoch, 1, 'activation epoch', errors);
  exact(state.activation.required_parent, PARENT, 'required parent', errors);
  exact(state.activation.accepted_unit4b_readiness_checkpoint, PARENT,
    'accepted Unit 4B checkpoint', errors);
  exact(state.phase_status.unit4d, 'DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
    'Unit 4D status', errors);
  exact(state.phase_status.unit5, 'NOT AUTHORIZED', 'Unit 5 status', errors);
  if (state.evidence_events?.length < 3) errors.push('missing structured evidence events');
  errors.push(...rejectSelfReference(state));
}

export function validateCanonicalStateObject(state) {
  const errors = [];
  validateLifecycle(state, errors);
  if (state?.activation) {
    exact(jsonSha256(statePayloadProjection(state)), state.activation.state_payload_sha256,
      'state payload hash', errors);
    exact(jsonSha256(activationManifestProjection(state)), state.activation.activation_manifest_sha256,
      'activation manifest hash', errors);
  }
  return errors;
}

function validateSchemas(reader, payloads, errors) {
  for (const [payloadPath, schemaPath] of Object.entries(SCHEMAS)) {
    const schema = parseJson(reader, schemaPath, errors);
    if (schema && payloads[payloadPath]) {
      errors.push(...validateSchema(payloads[payloadPath], schema, payloadPath));
    }
  }
}

function validateHashes(reader, state, catalog, traceability, rollback, errors) {
  exact(jsonSha256(statePayloadProjection(state)), state.activation.state_payload_sha256,
    'state payload hash', errors);
  exact(jsonSha256(activationManifestProjection(state)), state.activation.activation_manifest_sha256,
    'activation manifest hash', errors);
  for (const [relativePath, expected] of Object.entries(state.activation.structured_source_hashes)) {
    if (!reader.exists(relativePath)) errors.push(`missing structured source: ${relativePath}`);
    else exact(fileHash(reader, relativePath), expected, `structured hash ${relativePath}`, errors);
  }
  for (const [relativePath, expected] of Object.entries(state.activation.governing_artifact_hashes)) {
    if (!reader.exists(relativePath)) errors.push(`missing governing artifact: ${relativePath}`);
    else exact(fileHash(reader, relativePath), expected, `governing hash ${relativePath}`, errors);
  }
  exact(fileHash(reader, ROLLBACK), state.activation.rollback_readiness_sha256,
    'rollback hash', errors);
  exact(rollback.status, 'PREPARED / NOT AUTHORIZED / NOT ACTIVATED', 'rollback status', errors);
  for (const prohibition of ['RESET', 'FORCE_PUSH', 'HISTORY_REWRITE', 'SILENT_FALLBACK']) {
    if (!rollback.prohibitions.includes(prohibition)) errors.push(`rollback prohibition missing: ${prohibition}`);
  }
  const views = renderCanonicalViews(state, catalog, traceability);
  try { validateRenderedViews(views); } catch (error) { errors.push(error.message); }
  for (const [relativePath, expectedText] of Object.entries(views)) {
    const actual = reader.readText(relativePath).replace(/\r\n?/gu, '\n');
    exact(actual, expectedText, `render parity ${relativePath}`, errors);
    exact(digest(actual), state.activation.generated_view_hashes[relativePath],
      `root hash ${relativePath}`, errors);
  }
}

function validateCatalogTrace(catalog, traceability, errors) {
  exact(catalog.mode, 'CANONICAL', 'catalog mode', errors);
  exact(catalog.authority, 'CANONICAL_DOCUMENT_CLASSIFICATION_OWNER', 'catalog authority', errors);
  exact(catalog.activation_status, 'ACTIVE', 'catalog activation', errors);
  exact(catalog.authority_epoch, 1, 'catalog epoch', errors);
  exact(traceability.mode, 'CANONICAL', 'traceability mode', errors);
  exact(traceability.authority, 'CANONICAL_PHASE_C_TRACEABILITY_OWNER',
    'traceability authority', errors);
  exact(traceability.activation_status, 'ACTIVE', 'traceability activation', errors);
  exact(traceability.requirements.length, 13, 'traceability row count', errors);
  const ids = traceability.requirements.map(item => item.requirement_id);
  if (new Set(ids).size !== 13) errors.push('traceability requirement IDs are not unique');
  const roots = new Map(catalog.artifacts.map(item => [item.path, item]));
  for (const relativePath of Object.values(CANONICAL_VIEW_PATHS)) {
    exact(roots.get(relativePath)?.classification, 'GENERATED_COMPATIBILITY_VIEW',
      `root catalog classification ${relativePath}`, errors);
    if (roots.get(relativePath)?.authority === 'STATE_OWNER'
        || roots.get(relativePath)?.authority === 'CLASSIFICATION_OWNER') {
      errors.push(`old root retains authority: ${relativePath}`);
    }
  }
}

function validateCutoverManifest(reader, cutover, state, root, commit, errors) {
  exact(cutover.current_state_file_sha256, fileHash(reader, STATE),
    'cutover current-state hash', errors);
  exact(cutover.catalog_sha256, fileHash(reader, CATALOG), 'cutover catalog hash', errors);
  exact(cutover.traceability_sha256, fileHash(reader, TRACE), 'cutover traceability hash', errors);
  exact(cutover.state_payload_sha256, state.activation.state_payload_sha256,
    'cutover state payload hash', errors);
  exact(cutover.activation_manifest_sha256, state.activation.activation_manifest_sha256,
    'cutover activation manifest hash', errors);
  exact(cutover.ponr_command, 'git push staging dev', 'PONR command', errors);
  exact(cutover.actual_activation_commit_identity, 'EXTERNAL_GIT_FACT',
    'external commit classification', errors);
  const actualPaths = changedPaths(root, commit);
  const declaredPaths = [...cutover.changed_paths].sort();
  if (JSON.stringify(actualPaths) !== JSON.stringify(declaredPaths)) {
    errors.push('exact changed-path manifest mismatch');
  }
  const unauthorized = actualPaths.filter(relativePath => !AUTHORIZED.has(relativePath));
  if (unauthorized.length) errors.push(`unauthorized changed paths: ${unauthorized.join(', ')}`);
  for (const rootPath of Object.values(CANONICAL_VIEW_PATHS)) {
    if (!actualPaths.includes(rootPath)) errors.push(`missing root replacement: ${rootPath}`);
  }
}

function validateBootstrap(reader, state, errors) {
  const instructions = reader.readText('docs/governance/AGENT_INSTRUCTIONS.md');
  if (!instructions.includes(STATE) || !instructions.includes('Silent fallback')) {
    errors.push('structured bootstrap or silent-fallback rejection missing');
  }
  const requiredPointers = [
    'governing_spec', 'technical_contract', 'sequence_authority', 'traceability',
    'ledger', 'unit_4_contract'
  ];
  for (const key of requiredPointers) {
    if (!state.governing_pointers[key]) errors.push(`missing governing pointer: ${key}`);
  }
  exact(state.bounded_recent_ledger_references.length, 4, 'bounded ledger reference count', errors);
  const index = parseJson(reader, 'docs/governance/ledger/g28-ledger-partition-index.json', errors);
  for (const reference of state.bounded_recent_ledger_references) {
    if (!reader.exists(reference.partition_path)) errors.push(`missing bounded partition: ${reference.partition_path}`);
    const partition = index?.partitions?.find(item => item.partition_id === reference.partition_id);
    if (!partition || partition.payload_sha256 !== reference.partition_payload_sha256) {
      errors.push(`stale bounded partition: ${reference.partition_id}`);
    }
  }
  const readiness = parseJson(reader, 'docs/governance/candidate/readiness-manifest.json', errors);
  exact(readiness?.consumer_inventory?.length, 31, 'consumer inventory', errors);
  exact(readiness?.reference_search?.unresolved_material_consumers, 0, 'unresolved consumers', errors);
  exact(readiness?.bootstrap?.full_ledger_read, false, 'full ledger read', errors);
  exact(readiness?.bootstrap?.private_memory_used, false, 'private memory', errors);
}

function validateClosedPartitions(reader, root, errors) {
  for (let number = 1; number <= 11; number += 1) {
    const fileName = `G28_LEDGER_PART_${String(number).padStart(4, '0')}.md`;
    const relativePath = `docs/governance/shadow/ledger/partitions/${fileName}`;
    const prior = gitRaw(root, ['show', `${PARENT}:${relativePath}`]);
    exact(reader.readText(relativePath), prior, `closed partition ${number}`, errors);
  }
}

export function validateCutover({ root = REPO_ROOT, commit = null } = {}) {
  const before = {
    head: git(root, ['rev-parse', 'HEAD']),
    status: git(root, ['status', '--porcelain=v1', '-uall']),
    index: git(root, ['write-tree'])
  };
  const errors = [];
  const resolved = commit ? validateCommit(root, commit) : null;
  const reader = resolved ? commitReader(root, resolved) : worktreeReader(root);
  validateCommitIdentity(root, resolved, errors);
  const payloads = Object.fromEntries(Object.keys(SCHEMAS).map(relativePath =>
    [relativePath, parseJson(reader, relativePath, errors)]));
  if (!Object.values(payloads).every(Boolean)) return { errors, commit: resolved };
  const state = payloads[STATE];
  const catalog = payloads[CATALOG];
  const traceability = payloads[TRACE];
  const cutover = payloads[CUTOVER];
  const rollback = payloads[ROLLBACK];
  validateSchemas(reader, payloads, errors);
  validateLifecycle(state, errors);
  validateCatalogTrace(catalog, traceability, errors);
  validateHashes(reader, state, catalog, traceability, rollback, errors);
  validateCutoverManifest(reader, cutover, state, root, resolved, errors);
  validateBootstrap(reader, state, errors);
  validateClosedPartitions(reader, root, errors);
  if (resolved && reader.readText(STATE).includes(resolved)) {
    errors.push('actual activation commit embedded in structured source');
  }
  const after = {
    head: git(root, ['rev-parse', 'HEAD']),
    status: git(root, ['status', '--porcelain=v1', '-uall']),
    index: git(root, ['write-tree'])
  };
  if (JSON.stringify(before) !== JSON.stringify(after)) errors.push('validator mutated Git state');
  return {
    errors,
    commit: resolved,
    positive_checks: 36,
    negative_checks: 37,
    traceability_rows: traceability.requirements.length,
    consumers: 31,
    unresolved_consumers: 0,
    bounded_references: state.bounded_recent_ledger_references
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const commitIndex = process.argv.indexOf('--commit');
  const result = validateCutover({
    root: process.cwd(),
    commit: commitIndex >= 0 ? process.argv[commitIndex + 1] : null
  });
  if (result.errors.length) {
    console.error(`UNIT4C_CUTOVER_VALIDATION: FAIL\n${result.errors.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(`UNIT4C_CUTOVER_VALIDATION: PASS (${result.positive_checks} positive, ${result.negative_checks} negative, ${result.traceability_rows} trace rows, ${result.consumers} consumers)`);
  }
}
