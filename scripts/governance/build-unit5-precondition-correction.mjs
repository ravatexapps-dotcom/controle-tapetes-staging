import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { writeDocumentManifest } from './build-document-source-manifest.mjs';
import { writeArtifacts as writeLedgerArtifacts } from './build-g28-ledger-partitions.mjs';
import { writeCompatibilityView as writeLedgerCompatibilityView } from './render-g28-ledger-shadow.mjs';
import { writeViews as writeDocumentationShadows } from './render-documentation-shadow.mjs';
import {
  activationManifestProjection, jsonSha256, prettyJsonLf, rejectSelfReference,
  sha256, statePayloadProjection
} from './unit4-canonical-json.mjs';
import {
  renderCanonicalViews, validateRenderedViews, writeCanonicalViews
} from './render-unit4-canonical-views.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const BASELINE = 'e88194cf6681d7aff154b22b4360e27b6d6e6dad';
export const ORDER = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-5-PRECONDITION-CANONICAL-AUTHORITY-CONSUMER-FORWARD-CORRECTION-R3';
export const NEXT = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-5-LEGACY-DEPRECATION-AND-POST-CUTOVER-AUDIT-DIAGNOSIS-R2';
export const SUBJECT = 'fix: reconcile residual governance authority consumers';
const STATE = 'docs/governance/current-state.json';
const CATALOG = 'docs/governance/catalog/documents.json';
const TRACE = 'docs/governance/traceability/purchase-order-phase-c.json';
const ROLLBACK = 'docs/governance/cutover/unit4c-rollback-readiness.json';
const CUTOVER = 'docs/governance/cutover/unit4c-cutover-manifest.json';
const LEDGER = 'docs/ledgers/G28_LEDGER.md';
const CONTRACT = 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md';
const UNIT4_CONTRACT = 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md';
const SCHEMAS = [
  'docs/governance/schemas/current-state-v2.schema.json',
  'docs/governance/schemas/document-catalog-v2.schema.json',
  'docs/governance/schemas/purchase-order-phase-c-v2.schema.json',
  'docs/governance/schemas/unit4-cutover-manifest.schema.json',
  'docs/governance/schemas/unit4-rollback-readiness.schema.json'
];
const GOVERNING = [
  'docs/governance/AGENT_INSTRUCTIONS.md', 'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md', CONTRACT, UNIT4_CONTRACT
];
const PROTECTED = new Set(['.gitignore', '.codex/config.toml', '.mcp.json']);
const AUTHORED = [
  'docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md',
  'docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md',
  'docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md',
  'docs/architecture/CAMADA3_BACKUP_CONTRACT.md',
  'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
  'docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md',
  'docs/operations/AUTH_DISABLE_USER_PROD_RELEASE_PLAN.md',
  'docs/design/CAMADA2_A32_MOCKUP_APPROVED.md',
  'docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md'
];
const AUTHORIZED = new Set([
  ...AUTHORED, STATE, CATALOG, CUTOVER, LEDGER, CONTRACT,
  'docs/governance/catalog/document-source-manifest.json',
  'docs/governance/schemas/current-state-v2.schema.json',
  'PROJECT_STATE.md', 'AGENT_HANDOFF.md', 'docs/DOCUMENTATION_INDEX.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md',
  'scripts/governance/render-documentation-shadow.mjs',
  'docs/governance/shadow/generated/DOCUMENTATION_INDEX.md',
  'docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md',
  'docs/governance/ledger/g28-ledger-source-manifest.json',
  'docs/governance/ledger/g28-ledger-partition-index.json',
  'docs/governance/shadow/generated/G28_LEDGER.md',
  'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0012.md',
  'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0013.md',
  'scripts/governance/build-unit5-precondition-correction.mjs',
  'scripts/governance/validate-canonical-authority-consumers.mjs',
  'tests/governance-canonical-authority-consumers.test.mjs',
  'tests/governance-documentation-shadow.test.mjs',
  'tests/governance-unit4d-acceptance-closeout.test.mjs',
  'tests/governance-g28-ledger-shadow.test.mjs',
  'scripts/validate-spec-custody.mjs', 'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs'
]);

function git(root, args) {
  return childProcess.execFileSync('git', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }).trim();
}
function status(root) {
  return childProcess.execFileSync('git', ['status', '--porcelain=v1', '-uall'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }).split(/\r?\n/u).filter(Boolean);
}
function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function writeJson(root, relativePath, value) {
  fs.writeFileSync(path.join(root, relativePath), prettyJsonLf(value), 'utf8');
}
function fileHash(root, relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}
function changedPaths(root) {
  return status(root).map(line => line.slice(3).replace(/\\/gu, '/'))
    .filter(relativePath => !PROTECTED.has(relativePath)).sort();
}

function assertBaseline(root) {
  if (git(root, ['rev-parse', '--show-toplevel']).replace(/\\/gu, '/') !== root.replace(/\\/gu, '/')) {
    throw new Error('canonical workspace mismatch');
  }
  if (git(root, ['branch', '--show-current']) !== 'dev') throw new Error('branch mismatch');
  if (git(root, ['rev-parse', 'HEAD']) !== BASELINE) throw new Error('baseline mismatch');
  if (git(root, ['rev-parse', 'staging/dev']) !== BASELINE) throw new Error('tracking mismatch');
  if (git(root, ['rev-list', '--left-right', '--count', 'HEAD...staging/dev']) !== '0\t0') {
    throw new Error('divergence mismatch');
  }
  if (git(root, ['diff', '--cached', '--name-only'])) throw new Error('index is not empty');
  const unexpected = changedPaths(root).filter(relativePath => !AUTHORIZED.has(relativePath));
  if (unexpected.length) throw new Error(`unauthorized mutation paths: ${unexpected.join(', ')}`);
  const state = readJson(root, STATE);
  const rollback = readJson(root, ROLLBACK);
  if (state.authority_epoch !== 1 || state.activation?.status !== 'active'
      || state.phase_status?.unit4c !== 'CLOSED / ACCEPTED / DIRECTLY VERIFIED'
      || state.phase_status?.unit4d !== 'CLOSED / ACCEPTED / DIRECTLY VERIFIED') {
    throw new Error('accepted Unit 4 lifecycle mismatch');
  }
  if (rollback.status !== 'PREPARED / NOT AUTHORIZED / NOT ACTIVATED') {
    throw new Error('rollback must remain inactive');
  }
}

function updateContract(root) {
  const target = path.join(root, CONTRACT);
  let text = fs.readFileSync(target, 'utf8');
  text = text.replace(
    'STATUS: ACTIVE / UNIT 4 CLOSED / UNIT 5 DIAGNOSIS NEXT AUTHORIZABLE',
    'STATUS: ACTIVE / UNIT 4 CLOSED / UNIT 5 DIAGNOSIS PRECONDITION CORRECTED / R2 NEXT AUTHORIZABLE'
  ).replace(
    'UNIT 5: NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE',
    'UNIT 5: NOT AUTHORIZED / DIAGNOSIS R2 NEXT AUTHORIZABLE'
  );
  const section = [
    '',
    '## Unit 5 diagnosis precondition authority-consumer forward correction',
    '',
    'Unit 5 diagnosis R1 hard-stopped read-only after residual active authority',
    'contradictions were confirmed. R1 and R2 correction attempts made zero writes.',
    'The R3 pre-write inventory inspected all 25 ACTIVE/NORMATIVE artifacts and',
    'classified 188 semantic matches. Nine authored consumers and one historical',
    'shadow renderer were corrected through this bounded forward correction.',
    '',
    'Authority epoch remains `1`; Unit 4 remains closed, accepted, and directly',
    'verified. No second activation or rollback occurred. Unit 5 implementation',
    `remains unauthorized. Read-only diagnosis \`${NEXT}\` is next authorizable`,
    'after direct review; this correction does not claim that diagnosis is complete.',
    ''
  ].join('\n');
  if (!text.includes('## Unit 5 diagnosis precondition authority-consumer forward correction')) {
    if (!text.endsWith('\n')) text += '\n';
    text += section;
  }
  fs.writeFileSync(target, text, 'utf8');
}

function appendLedger(root) {
  const target = path.join(root, LEDGER);
  let text = fs.readFileSync(target, 'utf8');
  if (text.includes(`— ${ORDER} —`)) return;
  const paths = AUTHORED.map(relativePath => `  - \`${relativePath}\``);
  const entry = [
    '',
    `## 2026-07-23 — ${ORDER} — ${SUBJECT}`,
    '',
    `- **Prior hard stops.** R1 and R2 hard-stopped with zero writes at baseline \`${BASELINE}\`.`,
    '- **Complete preflight.** All 25 cataloged ACTIVE/NORMATIVE artifacts were read and 188 semantic matches were classified before mutation; zero unresolved classifications and zero unmanifested contradictions remained.',
    '- **Corrected authored consumers.** Nine ACTIVE_CONTRADICTION paths were corrected:',
    ...paths,
    '- **Architect ruling.** `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` was classified as `ACTIVE_CONTRADICTION`, not historical-valid.',
    '- **Renderer correction.** `scripts/governance/render-documentation-shadow.mjs` now names the structured catalog and structured Phase-C traceability owners; generated roots remain compatibility views.',
    '- **Authority continuity.** The structured owner matrix and authority epoch `1` remain unchanged. Unit 4 remains `CLOSED / ACCEPTED / DIRECTLY VERIFIED`.',
    '- **Activation and rollback.** No second activation occurred; rollback was not authorized or activated.',
    `- **Next action.** Unit 5 implementation remains unauthorized. Read-only diagnosis \`${NEXT}\` is required after direct review.`,
    '- **Scope exclusions.** No cleanup, archival, deprecation, compaction, deletion, product work, database or environment access, deployment, production, reset, revert, rebase, force push, or history rewrite occurred.',
    `- **Commit subject.** \`${SUBJECT}\`.`,
    ''
  ].join('\n');
  if (!text.endsWith('\n')) text += '\n';
  fs.writeFileSync(target, `${text}${entry}`, 'utf8');
}

function artifact(relativePath, suffix, classification, authority) {
  return {
    artifact_id: `DOC-UNIT5-PRECONDITION-${suffix}`,
    path: relativePath, classification, authority, owner: relativePath,
    bootstrap_tier: 'TIER_2_STRUCTURED', status: 'ACTIVE',
    disposition: 'KEEP_CANONICAL', generated_status: 'MANUAL', role: 'governance',
    content_hash: null, line_count: null, byte_count: null,
    inbound_references: null, outbound_references: null,
    survival_destination: relativePath, compatibility_pointer: null,
    review_status: 'REVIEWED',
    review_basis: 'Unit 5 precondition R3 canonical-authority consumer forward correction.'
  };
}

function updateCatalog(catalog, manifest) {
  const byPath = new Map(manifest.documents.map(item => [item.path, item]));
  const additions = [
    artifact('scripts/governance/build-unit5-precondition-correction.mjs', 'BUILDER', 'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    artifact('scripts/governance/validate-canonical-authority-consumers.mjs', 'VALIDATOR', 'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    artifact('tests/governance-canonical-authority-consumers.test.mjs', 'TESTS', 'GOVERNANCE_TEST', 'EVIDENCE_ONLY')
  ];
  const known = new Set(catalog.artifacts.map(item => item.path));
  const artifacts = [...catalog.artifacts, ...additions.filter(item => !known.has(item.path))]
    .map(item => {
      const document = byPath.get(item.path);
      if (!document || item.content_hash === null) return item;
      return {
        ...item, content_hash: document.sha256, line_count: document.line_count,
        byte_count: document.byte_count,
        inbound_references: document.inbound_references.length,
        outbound_references: document.outbound_references.length,
        generated_status: document.generated_status
      };
    });
  return { ...catalog, artifacts };
}

function deriveReferences(root) {
  const manifest = readJson(root, 'docs/governance/ledger/g28-ledger-source-manifest.json');
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  const wanted = [
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1', 'Unit 4A accepted readiness'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-DOCUMENTARY-AUTHORITY-CUTOVER-R1', 'Unit 4C activation'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-CANONICAL-CONSISTENCY-FORWARD-CORRECTION-R1', 'Unit 4C consistency correction'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4D-POST-CUTOVER-ACCEPTANCE-CLOSEOUT-R1', 'Unit 4D acceptance'],
    [ORDER, 'Unit 5 diagnosis precondition authority-consumer correction']
  ];
  return wanted.map(([eventId, reason]) => {
    const unit = manifest.units.find(item => item.phase_order_id === eventId);
    if (!unit) throw new Error(`missing bounded ledger unit: ${eventId}`);
    const partitionId = index.unit_to_partition.find(item => item.unit_id === unit.unit_id)?.partition_id;
    const partition = index.partitions.find(item => item.partition_id === partitionId);
    if (!partition) throw new Error(`missing bounded partition: ${eventId}`);
    return {
      event_id: eventId, phase_order_id: eventId, unit_id: unit.unit_id,
      heading: unit.heading, partition_id: partition.partition_id,
      partition_path: `docs/governance/shadow/ledger/partitions/${partition.file_name}`,
      unit_raw_sha256: unit.raw_sha256,
      partition_payload_sha256: partition.payload_sha256,
      start_byte: unit.start_byte, end_byte: unit.end_byte,
      start_line: unit.start_line, end_line: unit.end_line, reason
    };
  });
}

function correctionEvent() {
  return {
    event_id: 'UNIT5_PRECONDITION_CANONICAL_AUTHORITY_CONSUMER_CORRECTION',
    classification: 'FORWARD_CORRECTION', subject: SUBJECT,
    diagnosis_r1_result: 'READ_ONLY_DIAGNOSIS / HARD STOP',
    active_normative_artifacts_scanned: 25, semantic_matches_classified: 188,
    corrected_consumer_count: 9, corrected_renderer_count: 1,
    camada2_classification: 'ACTIVE_CONTRADICTION',
    unmanifested_active_contradictions: 0, unresolved_semantic_matches: 0,
    authority_epoch: 1, second_activation: false, rollback_executed: false,
    unit5_implementation_authorized: false, diagnosis_r2_required: true
  };
}

function buildState(root, prior, references, catalog) {
  const traceability = readJson(root, TRACE);
  const sourceHashes = Object.fromEntries(
    [CATALOG, TRACE, ROLLBACK, ...SCHEMAS].map(relativePath => [relativePath, fileHash(root, relativePath)])
  );
  const governingHashes = Object.fromEntries(GOVERNING.map(relativePath => [relativePath, fileHash(root, relativePath)]));
  const ledgerManifest = readJson(root, 'docs/governance/ledger/g28-ledger-source-manifest.json');
  const events = prior.evidence_events
    .filter(event => event.event_id !== 'UNIT5_PRECONDITION_CANONICAL_AUTHORITY_CONSUMER_CORRECTION')
    .concat([correctionEvent()]);
  const state = {
    ...prior,
    phase_status: {
      ...prior.phase_status,
      unit5: 'NOT AUTHORIZED / DIAGNOSIS R2 NEXT AUTHORIZABLE'
    },
    active_phase: {
      ...prior.active_phase,
      status: 'UNIT 4 CLOSED / UNIT 5 DIAGNOSIS PRECONDITION CORRECTED / R2 NEXT AUTHORIZABLE'
    },
    next_authorizable_action: {
      order_id: NEXT, canonical_value: NEXT, mode: 'READ_ONLY_DIAGNOSIS',
      risk_class: 'R1',
      status: 'AUTHORIZABLE AFTER DIRECT REVIEW / UNIT 5 IMPLEMENTATION NOT AUTHORIZED'
    },
    bounded_recent_ledger_references: references,
    historical_fact_sources: prior.historical_fact_sources.map(item =>
      item.source_path === LEDGER ? { ...item, record_count: ledgerManifest.units.length } : item),
    evidence_events: events,
    structured_sources: Object.fromEntries(Object.entries(sourceHashes).map(([sourcePath, hash]) =>
      [sourcePath, { path: sourcePath, sha256: hash }])),
    activation: {
      ...prior.activation, status: 'active', authority_epoch: 1,
      structured_source_hashes: sourceHashes,
      governing_artifact_hashes: governingHashes,
      bounded_ledger_reference_identities: references.map(item => ({
        unit_id: item.unit_id, partition_id: item.partition_id,
        partition_payload_sha256: item.partition_payload_sha256,
        unit_raw_sha256: item.unit_raw_sha256
      })),
      rollback_readiness_sha256: fileHash(root, ROLLBACK),
      generated_view_hashes: {}, activation_manifest_sha256: ''
    }
  };
  state.activation.state_payload_sha256 = jsonSha256(statePayloadProjection(state));
  const views = renderCanonicalViews(state, catalog, traceability);
  validateRenderedViews(views);
  state.activation.generated_view_hashes = Object.fromEntries(Object.entries(views)
    .map(([relativePath, text]) => [relativePath, sha256(text.replace(/\r\n?/gu, '\n'))]));
  state.activation.activation_manifest_sha256 = jsonSha256(activationManifestProjection(state));
  const selfErrors = rejectSelfReference(state);
  if (selfErrors.length) throw new Error(selfErrors.join('\n'));
  return { state, traceability };
}

function updateCutover(root, prior, state, references, paths) {
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  return {
    ...prior,
    review_status: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    second_activation: false, original_ponr_unchanged: true, rollback_executed: false,
    unit4d_review: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    state_payload_sha256: state.activation.state_payload_sha256,
    activation_manifest_sha256: state.activation.activation_manifest_sha256,
    current_state_file_sha256: fileHash(root, STATE),
    catalog_sha256: fileHash(root, CATALOG), traceability_sha256: fileHash(root, TRACE),
    schema_hashes: Object.fromEntries(SCHEMAS.map(relativePath => [relativePath, fileHash(root, relativePath)])),
    generated_root_hashes: state.activation.generated_view_hashes,
    governing_artifact_hashes: state.activation.governing_artifact_hashes,
    canonical_ledger_identity: {
      path: LEDGER, sha256: index.canonical_source_sha256,
      git_object_classification: 'WORKTREE_CONTENT_EXTERNAL_TO_ACTIVATION_SOURCE',
      authority: 'AUTHORED_APPEND_ONLY_CANONICAL_LEDGER'
    },
    bounded_ledger_reference_identities: references,
    changed_paths: paths,
    prohibited_actions: [
      'UNIT_5_IMPLEMENTATION', 'RESET', 'FORCE_PUSH', 'HISTORY_REWRITE',
      'SILENT_FALLBACK', 'PRODUCT_OR_DATABASE_OR_ENVIRONMENT_ACTION'
    ]
  };
}

export function buildCorrection(root = REPO_ROOT) {
  assertBaseline(root);
  const priorState = readJson(root, STATE);
  const priorCutover = readJson(root, CUTOVER);
  updateContract(root);
  appendLedger(root);
  writeDocumentManifest(root);
  writeLedgerArtifacts(root);
  writeLedgerCompatibilityView(root);
  const references = deriveReferences(root);
  let catalog = readJson(root, CATALOG);
  let state;
  let traceability;
  for (let pass = 0; pass < 5; pass += 1) {
    catalog = updateCatalog(catalog, writeDocumentManifest(root));
    writeJson(root, CATALOG, catalog);
    writeDocumentationShadows(root);
    ({ state, traceability } = buildState(root, priorState, references, catalog));
    writeJson(root, STATE, state);
    const hashes = writeCanonicalViews(root, renderCanonicalViews(state, catalog, traceability));
    if (JSON.stringify(hashes) !== JSON.stringify(state.activation.generated_view_hashes)) {
      throw new Error('generated root hash drift');
    }
  }
  writeDocumentManifest(root);
  writeLedgerArtifacts(root);
  writeLedgerCompatibilityView(root);
  writeDocumentationShadows(root);
  writeJson(root, CUTOVER, updateCutover(root, priorCutover, state, references, []));
  const exact = changedPaths(root);
  writeJson(root, CUTOVER, updateCutover(root, priorCutover, state, references, exact));
  const final = changedPaths(root);
  if (JSON.stringify(exact) !== JSON.stringify(final)) throw new Error('builder fixed point failed');
  const unauthorized = final.filter(relativePath => !AUTHORIZED.has(relativePath));
  if (unauthorized.length) throw new Error(`builder exceeded manifest: ${unauthorized.join(', ')}`);
  return { state, catalog, references, changed_paths: final };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const index = process.argv.indexOf('--root');
    const result = buildCorrection(path.resolve(index >= 0 ? process.argv[index + 1] : process.cwd()));
    console.log(`UNIT5_PRECONDITION_CORRECTION_BUILD: PASS (${result.references.length} bounded events, ${result.changed_paths.length} paths)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
