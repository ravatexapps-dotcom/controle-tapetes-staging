import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { writeDocumentManifest } from './build-document-source-manifest.mjs';
import { writeArtifacts as writeLedgerArtifacts } from './build-g28-ledger-partitions.mjs';
import { writeCompatibilityView as writeLedgerCompatibilityView } from './render-g28-ledger-shadow.mjs';
import { activationManifestProjection, jsonSha256, prettyJsonLf, rejectSelfReference, sha256, statePayloadProjection } from './unit4-canonical-json.mjs';
import { renderCanonicalViews, validateRenderedViews, writeCanonicalViews } from './render-unit4-canonical-views.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const BASELINE = '7abaff26559c71b62337356eccd0baaf36b5f214'; export const ACTIVATION = '51a61ddfdbf058887ead64f9b018c30ebc371b48';
export const PARENT = 'fa986cf935abbf053172cfd549b0171bb9446f58'; export const CUTOVER_ID = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1';
export const ORDER = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4D-POST-CUTOVER-ACCEPTANCE-CLOSEOUT-R1';
export const NEXT_ORDER = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-5-LEGACY-DEPRECATION-AND-POST-CUTOVER-AUDIT-DIAGNOSIS-R1';
export const SUBJECT = 'docs: close Unit 4 post-cutover acceptance';

const STATE = 'docs/governance/current-state.json'; const CATALOG = 'docs/governance/catalog/documents.json';
const TRACE = 'docs/governance/traceability/purchase-order-phase-c.json';
const ROLLBACK = 'docs/governance/cutover/unit4c-rollback-readiness.json'; const CUTOVER = 'docs/governance/cutover/unit4c-cutover-manifest.json';
const LEDGER = 'docs/ledgers/G28_LEDGER.md';
const PHASE_CONTRACT = 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md';
const UNIT4_CONTRACT = 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md';
const SCHEMAS = [
  'docs/governance/schemas/current-state-v2.schema.json', 'docs/governance/schemas/document-catalog-v2.schema.json',
  'docs/governance/schemas/purchase-order-phase-c-v2.schema.json', 'docs/governance/schemas/unit4-cutover-manifest.schema.json',
  'docs/governance/schemas/unit4-rollback-readiness.schema.json'
];
const GOVERNING_ARTIFACTS = [
  'docs/governance/AGENT_INSTRUCTIONS.md', 'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md', PHASE_CONTRACT, UNIT4_CONTRACT
];
const PROTECTED = new Set(['.gitignore', '.codex/config.toml', '.mcp.json']);
const AUTHORIZED_MUTATIONS = new Set([
  STATE, CATALOG, TRACE, ROLLBACK, CUTOVER, LEDGER, PHASE_CONTRACT, UNIT4_CONTRACT,
  'docs/governance/schemas/current-state-v2.schema.json', 'docs/governance/schemas/unit4-cutover-manifest.schema.json',
  'PROJECT_STATE.md', 'AGENT_HANDOFF.md', 'docs/DOCUMENTATION_INDEX.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md', 'docs/governance/catalog/document-source-manifest.json',
  'docs/governance/ledger/g28-ledger-source-manifest.json', 'docs/governance/ledger/g28-ledger-partition-index.json',
  'docs/governance/shadow/generated/G28_LEDGER.md', 'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0012.md',
  'docs/governance/shadow/ledger/partitions/G28_LEDGER_PART_0013.md',
  'scripts/governance/build-unit4d-acceptance-closeout.mjs', 'scripts/governance/validate-unit4d-acceptance-closeout.mjs',
  'scripts/governance/validate-unit4-cutover.mjs', 'tests/governance-unit4-cutover.test.mjs',
  'tests/governance-g28-ledger-shadow.test.mjs', 'tests/governance-unit4d-acceptance-closeout.test.mjs'
]);

function git(root, args) {
  return childProcess.execFileSync('git', args, {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }).trim();
}

function gitStatus(root) {
  return childProcess.execFileSync('git', ['status', '--porcelain=v1', '-uall'], {
    cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024
  }).split(/\r?\n/u).filter(Boolean);
}

function readJson(root, relativePath) { return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')); }
function writeJson(root, relativePath, value) { fs.writeFileSync(path.join(root, relativePath), prettyJsonLf(value), 'utf8'); }
function fileHash(root, relativePath) { return sha256(fs.readFileSync(path.join(root, relativePath))); }

function replaceRequired(text, before, after, label) {
  if (text.includes(after)) return text;
  if (!text.includes(before)) throw new Error(`missing contract closeout anchor: ${label}`);
  return text.replace(before, after);
}

function updateContracts(root) {
  const phasePath = path.join(root, PHASE_CONTRACT);
  let phase = fs.readFileSync(phasePath, 'utf8');
  const phaseReplacements = [
    ['STATUS: ACTIVE / UNIT 4C FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW',
      'STATUS: ACTIVE / UNIT 4 CLOSED / UNIT 5 DIAGNOSIS NEXT AUTHORIZABLE'],
    ['UNIT 4C: ACTIVATED / FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW',
      'UNIT 4C: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['UNIT 4D ACCEPTANCE: DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
      'UNIT 4D ACCEPTANCE: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['DOCUMENTARY-AUTHORITY CUTOVER: ACTIVE / AWAITING UNIT 4D REVIEW',
      'DOCUMENTARY-AUTHORITY CUTOVER: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['UNIT 5: NOT AUTHORIZED', 'UNIT 5: NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE'],
    [
      'Structured\nauthority is activated at epoch `1`; Unit 4D remains direct-review only and is\nnot self-accepted. Unit 5, cleanup, archival, deprecation, and deletion remain\nunauthorized.',
      'Structured\nauthority remains active at epoch `1`. Direct post-cutover review accepted Unit\n4C, Unit 4D, and the documentary-authority cutover. Unit 5 diagnosis is next\nauthorizable but remains unauthorized by this closeout.'
    ],
    [
      '- This contract records the active authority-epoch-`1` model and the Unit 4C\n  forward correction. It does not self-accept Unit 4D or authorize Unit 5,',
      '- This contract records the active authority-epoch-`1` model and the accepted Unit 4\n  closeout. It does not authorize Unit 5,'
    ]
  ];
  phaseReplacements.forEach(([before, after], index) => {
    phase = replaceRequired(phase, before, after, `phase-${index + 1}`);
  });
  const phaseCloseout = [
    '',
    '## Unit 4 post-cutover acceptance closeout',
    '',
    `External direct review accepted activation checkpoint \`${ACTIVATION}\` and corrected`,
    `canonical checkpoint \`${BASELINE}\`. Unit 4A, Unit 4B, Unit 4C, Unit 4D,`,
    'and the documentary-authority cutover are accepted. Authority epoch `1`, the',
    `cutover ID \`${CUTOVER_ID}\`, and the original PONR remain unchanged. No second`,
    'activation or rollback occurred. Recovery remains forward-only. Unit 5 requires',
    `its own order; only read-only diagnosis \`${NEXT_ORDER}\` is next authorizable.`,
    ''
  ].join('\n');
  if (!phase.includes('## Unit 4 post-cutover acceptance closeout')) phase += phaseCloseout;
  fs.writeFileSync(phasePath, phase, 'utf8');

  const unitPath = path.join(root, UNIT4_CONTRACT);
  let unit = fs.readFileSync(unitPath, 'utf8');
  const unitReplacements = [
    ['STATUS: UNIT 4C PUBLISHED / FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW',
      'STATUS: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['DOCUMENTARY-AUTHORITY CUTOVER: ACTIVE / AWAITING UNIT 4D REVIEW',
      'DOCUMENTARY-AUTHORITY CUTOVER: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['UNIT 4D: DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
      'UNIT 4D: CLOSED / ACCEPTED / DIRECTLY VERIFIED'],
    ['UNIT 5: NOT AUTHORIZED', 'UNIT 5: NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE'],
    ['| Unit 4C — authority cutover execution | ACTIVATED / FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW |',
      '| Unit 4C — authority cutover execution | CLOSED / ACCEPTED / DIRECTLY VERIFIED |'],
    ['| Unit 4D — post-cutover acceptance | DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED |',
      '| Unit 4D — post-cutover acceptance | CLOSED / ACCEPTED / DIRECTLY VERIFIED |'],
    ['| Documentary-authority cutover | ACTIVE / AWAITING UNIT 4D REVIEW |',
      '| Documentary-authority cutover | CLOSED / ACCEPTED / DIRECTLY VERIFIED |']
  ];
  unitReplacements.forEach(([before, after], index) => {
    unit = replaceRequired(unit, before, after, `unit4-${index + 1}`);
  });
  const unitCloseout = [
    '',
    '## 26. Post-cutover acceptance closeout',
    '',
    `ACCEPTED ACTIVATION CHECKPOINT: ${ACTIVATION}`,
    '',
    `ACCEPTED CORRECTED CANONICAL CHECKPOINT: ${BASELINE}`,
    '',
    'AUTHORITY EPOCH: 1',
    '',
    'SECOND ACTIVATION: NO',
    '',
    'ROLLBACK: NOT AUTHORIZED / NOT ACTIVATED',
    '',
    'UNIT 5: NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE',
    '',
    'The original activation remains the immutable authority-epoch-1 PONR. The',
    'accepted forward correction did not move the PONR or create authority epoch `2`.',
    'Direct post-cutover review accepted the corrected canonical checkpoint. Recovery',
    'remains forward-only, and Unit 5 requires its own authorization.',
    ''
  ].join('\n');
  if (!unit.includes('## 26. Post-cutover acceptance closeout')) unit += unitCloseout;
  fs.writeFileSync(unitPath, unit, 'utf8');
}

function appendLedger(root) {
  const target = path.join(root, LEDGER);
  let ledger = fs.readFileSync(target, 'utf8');
  if (ledger.includes(`— ${ORDER} —`)) return;
  const entry = [
    '',
    `## 2026-07-23 — ${ORDER} — ${SUBJECT}`,
    '',
    `- **External supervisor acceptance.** Direct review accepted correction checkpoint \`${BASELINE}\`, original activation checkpoint \`${ACTIVATION}\`, and original activation parent \`${PARENT}\`. This is an external ruling, not executor self-acceptance.`,
    `- **Closeout.** Unit 4C, Unit 4D, and the documentary-authority cutover are \`CLOSED / ACCEPTED / DIRECTLY VERIFIED\`. Authority epoch \`1\` and cutover ID \`${CUTOVER_ID}\` remain unchanged.`,
    '- **PONR and recovery.** The original activation remains the PONR. No second activation or rollback occurred; recovery remains forward-only.',
    '- **Authority continuity.** Structured owners remain canonical, generated roots remain non-authoritative compatibility views, and canonical ledger authority remains unchanged.',
    `- **Next action.** Unit 5 diagnosis \`${NEXT_ORDER}\` is next authorizable but is not authorized by this closeout.`,
    '- **Scope exclusions.** No product, database, migration, environment, deployment, production, cleanup, archival, deprecation, compaction, deletion, reset, force push, or history rewrite occurred.',
    `- **Commit subject.** \`${SUBJECT}\`.`,
    ''
  ].join('\n');
  if (!ledger.endsWith('\n')) ledger += '\n';
  fs.writeFileSync(target, `${ledger}${entry}`, 'utf8');
}

function artifact(relativePath, suffix, classification, authority) {
  return {
    artifact_id: `DOC-UNIT4D-${suffix}`,
    path: relativePath,
    classification,
    authority,
    owner: relativePath,
    bootstrap_tier: 'TIER_2_STRUCTURED',
    status: 'ACTIVE',
    disposition: 'KEEP_CANONICAL',
    generated_status: 'MANUAL',
    role: 'governance',
    content_hash: null,
    line_count: null,
    byte_count: null,
    inbound_references: null,
    outbound_references: null,
    survival_destination: relativePath,
    compatibility_pointer: null,
    review_status: 'REVIEWED',
    review_basis: 'Unit 4D externally authorized post-cutover acceptance closeout.'
  };
}

function updateCatalog(root, catalog, manifest) {
  const manifestByPath = new Map((manifest?.documents ?? []).map(item => [item.path, item]));
  const additions = [
    artifact('scripts/governance/build-unit4d-acceptance-closeout.mjs', 'BUILDER',
      'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    artifact('scripts/governance/validate-unit4d-acceptance-closeout.mjs', 'VALIDATOR',
      'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    artifact('tests/governance-unit4d-acceptance-closeout.test.mjs', 'TESTS',
      'GOVERNANCE_TEST', 'EVIDENCE_ONLY')
  ];
  const paths = new Set(catalog.artifacts.map(item => item.path));
  const artifacts = [...catalog.artifacts, ...additions.filter(item => !paths.has(item.path))]
    .map(item => {
      const document = manifestByPath.get(item.path);
      if (!document || item.content_hash === null) return item;
      return {
        ...item,
        content_hash: document.sha256,
        line_count: document.line_count,
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
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-BOOTSTRAP-AUTHORITY-CUTOVER-CONTRACT-R1',
      'Unit 3 acceptance and Unit 4 contract definition'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1',
      'Unit 4A authorization and accepted readiness'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-DOCUMENTARY-AUTHORITY-CUTOVER-R1',
      'Unit 4C activation'],
    ['GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-CANONICAL-CONSISTENCY-FORWARD-CORRECTION-R1',
      'Unit 4C canonical consistency forward correction'],
    [ORDER, 'Unit 4D post-cutover acceptance closeout']
  ];
  return wanted.map(([eventId, reason]) => {
    const unit = manifest.units.find(item => item.phase_order_id === eventId);
    if (!unit) throw new Error(`missing bounded ledger event: ${eventId}`);
    const partitionId = index.unit_to_partition.find(item => item.unit_id === unit.unit_id)?.partition_id;
    const partition = index.partitions.find(item => item.partition_id === partitionId);
    if (!partition) throw new Error(`missing bounded ledger partition: ${unit.unit_id}`);
    return {
      event_id: eventId,
      phase_order_id: eventId,
      unit_id: unit.unit_id,
      heading: unit.heading,
      partition_id: partition.partition_id,
      partition_path: `docs/governance/shadow/ledger/partitions/${partition.file_name}`,
      unit_raw_sha256: unit.raw_sha256,
      partition_payload_sha256: partition.payload_sha256,
      start_byte: unit.start_byte,
      end_byte: unit.end_byte,
      start_line: unit.start_line,
      end_line: unit.end_line,
      reason
    };
  });
}

function acceptanceEvent() {
  return {
    event_id: 'UNIT4D_POST_CUTOVER_ACCEPTANCE',
    classification: 'EXTERNAL_SUPERVISOR_ACCEPTANCE',
    subject: SUBJECT,
    original_activation_checkpoint: ACTIVATION,
    accepted_corrected_checkpoint: BASELINE,
    unit4c_status: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    unit4d_status: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    documentary_authority_cutover_status: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    authority_epoch: 1,
    second_activation: false,
    rollback_executed: false,
    unit5_authorized: false
  };
}

function buildState(root, prior, references, catalog) {
  const traceability = readJson(root, TRACE);
  const rollbackHash = fileHash(root, ROLLBACK);
  const sourceHashes = Object.fromEntries(
    [CATALOG, TRACE, ROLLBACK, ...SCHEMAS].map(relativePath => [relativePath, fileHash(root, relativePath)])
  );
  const governingHashes = Object.fromEntries(
    GOVERNING_ARTIFACTS.map(relativePath => [relativePath, fileHash(root, relativePath)])
  );
  const ledgerManifest = readJson(root, 'docs/governance/ledger/g28-ledger-source-manifest.json');
  const events = (prior.evidence_events ?? []).filter(event =>
    event.event_id !== 'UNIT4D_POST_CUTOVER_ACCEPTANCE').concat([acceptanceEvent()]);
  const historical = prior.historical_fact_sources.map(item =>
    item.source_path === LEDGER ? { ...item, record_count: ledgerManifest.units.length } : item);
  const state = {
    ...prior,
    accepted_checkpoints: {
      ...prior.accepted_checkpoints,
      unit_4c_activation: ACTIVATION,
      unit_4c_canonical_correction: BASELINE,
      unit_4d_acceptance: BASELINE
    },
    phase_status: {
      unit_4_contract: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4a: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4b: 'DIRECT REVIEW COMPLETED / ACCEPTED',
      unit4c: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4d: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      documentary_authority_cutover: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit5: 'NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE'
    },
    active_phase: {
      ...prior.active_phase,
      status: 'UNIT 4 CLOSED / UNIT 5 DIAGNOSIS NEXT AUTHORIZABLE'
    },
    next_authorizable_action: {
      order_id: NEXT_ORDER,
      canonical_value: NEXT_ORDER,
      mode: 'READ_ONLY_DIAGNOSIS',
      risk_class: 'R1',
      status: 'AUTHORIZABLE / NOT AUTHORIZED BY THIS CLOSEOUT'
    },
    prohibitions: [...new Set(prior.prohibitions.filter(value =>
      value !== 'UNIT_4D_ACCEPTANCE').concat([
      'UNIT_5_IMPLEMENTATION', 'SILENT_FALLBACK', 'MANUAL_GENERATED_ROOT_EDIT'
    ]))],
    bounded_recent_ledger_references: references,
    historical_fact_sources: historical,
    evidence_events: events,
    structured_sources: Object.fromEntries(Object.entries(sourceHashes).map(([sourcePath, hash]) =>
      [sourcePath, { path: sourcePath, sha256: hash }])),
    activation: {
      ...prior.activation,
      status: 'active',
      authority_epoch: 1,
      required_parent: PARENT,
      accepted_unit4b_readiness_checkpoint: PARENT,
      structured_source_hashes: sourceHashes,
      governing_artifact_hashes: governingHashes,
      bounded_ledger_reference_identities: references.map(item => ({
        unit_id: item.unit_id,
        partition_id: item.partition_id,
        partition_payload_sha256: item.partition_payload_sha256,
        unit_raw_sha256: item.unit_raw_sha256
      })),
      rollback_readiness_sha256: rollbackHash,
      generated_view_hashes: {},
      activation_manifest_sha256: ''
    }
  };
  state.activation.state_payload_sha256 = jsonSha256(statePayloadProjection(state));
  const views = renderCanonicalViews(state, catalog, traceability);
  validateRenderedViews(views);
  state.activation.generated_view_hashes = Object.fromEntries(
    Object.entries(views).map(([relativePath, text]) => [relativePath, sha256(text.replace(/\r\n?/gu, '\n'))])
  );
  state.activation.activation_manifest_sha256 = jsonSha256(activationManifestProjection(state));
  const selfErrors = rejectSelfReference(state);
  if (selfErrors.length) throw new Error(selfErrors.join('\n'));
  return { state, traceability };
}

function closeoutManifest(root, prior, state, references, changedPaths) {
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  const originalHash = state.evidence_events.find(event =>
    event.event_id === 'UNIT4C_CANONICAL_CONSISTENCY_FORWARD_CORRECTION')
    ?.original_activation_manifest_sha256;
  if (!/^[0-9a-f]{64}$/u.test(originalHash ?? '')) {
    throw new Error('original activation-manifest identity missing');
  }
  return {
    ...prior,
    review_status: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    unit4c_activation_checkpoint: ACTIVATION,
    accepted_corrected_checkpoint: BASELINE,
    unit4d_acceptance_checkpoint: BASELINE,
    actual_activation_commit_identity: 'EXTERNAL_GIT_FACT_RECORDED_AFTER_UNIT4D_ACCEPTANCE',
    original_activation_manifest_sha256: originalHash,
    second_activation: false,
    original_ponr_unchanged: true,
    rollback_executed: false,
    unit4d_review: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
    state_payload_sha256: state.activation.state_payload_sha256,
    activation_manifest_sha256: state.activation.activation_manifest_sha256,
    current_state_file_sha256: fileHash(root, STATE),
    catalog_sha256: fileHash(root, CATALOG),
    traceability_sha256: fileHash(root, TRACE),
    schema_hashes: Object.fromEntries(SCHEMAS.map(relativePath => [relativePath, fileHash(root, relativePath)])),
    generated_root_hashes: state.activation.generated_view_hashes,
    governing_artifact_hashes: state.activation.governing_artifact_hashes,
    canonical_ledger_identity: {
      path: LEDGER,
      sha256: index.canonical_source_sha256,
      git_object_classification: 'WORKTREE_CONTENT_EXTERNAL_TO_ACTIVATION_SOURCE',
      authority: 'AUTHORED_APPEND_ONLY_CANONICAL_LEDGER'
    },
    bounded_ledger_reference_identities: references,
    changed_paths: changedPaths,
    prohibited_actions: [
      'UNIT_5_IMPLEMENTATION', 'RESET', 'FORCE_PUSH', 'HISTORY_REWRITE',
      'SILENT_FALLBACK', 'PRODUCT_OR_DATABASE_OR_ENVIRONMENT_ACTION'
    ]
  };
}

function changedPaths(root) {
  return gitStatus(root)
    .map(line => line.slice(3).replace(/\\/gu, '/'))
    .filter(relativePath => !PROTECTED.has(relativePath)).sort();
}

function assertBaseline(root) {
  if (git(root, ['branch', '--show-current']) !== 'dev') throw new Error('Unit 4D branch mismatch');
  if (git(root, ['rev-parse', 'HEAD']) !== BASELINE) throw new Error('Unit 4D baseline mismatch');
  if (git(root, ['rev-parse', 'refs/remotes/staging/dev']) !== BASELINE) {
    throw new Error('Unit 4D tracking checkpoint mismatch');
  }
  if (git(root, ['rev-list', '--left-right', '--count', 'refs/remotes/staging/dev...HEAD']) !== '0\t0') {
    throw new Error('Unit 4D divergence mismatch');
  }
  if (git(root, ['diff', '--cached', '--name-only'])) throw new Error('Unit 4D index is not empty');
  const statusPaths = gitStatus(root)
    .map(line => line.slice(3).replace(/\\/gu, '/')).sort();
  const unexpected = statusPaths.filter(relativePath =>
    !PROTECTED.has(relativePath) && !AUTHORIZED_MUTATIONS.has(relativePath));
  if (unexpected.length) {
    throw new Error(`unexpected pre-existing residue: ${unexpected.join(', ')}`);
  }
  const state = readJson(root, STATE);
  if (state.authority_epoch !== 1 || state.activation?.status !== 'active'
      || state.activation?.required_parent !== PARENT
      || ![
        'DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
        'CLOSED / ACCEPTED / DIRECTLY VERIFIED'
      ].includes(state.phase_status?.unit4d)) {
    throw new Error('Unit 4D source lifecycle mismatch');
  }
  const rollback = readJson(root, ROLLBACK);
  if (rollback.status !== 'PREPARED / NOT AUTHORIZED / NOT ACTIVATED') {
    throw new Error('rollback must remain inactive');
  }
}

export function buildCloseout(root = REPO_ROOT) {
  assertBaseline(root);
  const priorState = readJson(root, STATE);
  const priorCutover = readJson(root, CUTOVER);
  updateContracts(root);
  appendLedger(root);
  writeLedgerArtifacts(root);
  writeLedgerCompatibilityView(root);
  const references = deriveReferences(root);
  let catalog = readJson(root, CATALOG);
  let state;
  let traceability;
  for (let pass = 0; pass < 4; pass += 1) {
    const documentManifest = writeDocumentManifest(root);
    catalog = updateCatalog(root, catalog, documentManifest);
    writeJson(root, CATALOG, catalog);
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
  writeJson(root, CUTOVER, closeoutManifest(root, priorCutover, state, references, []));
  const exactPaths = changedPaths(root);
  writeJson(root, CUTOVER, closeoutManifest(root, priorCutover, state, references, exactPaths));
  const finalPaths = changedPaths(root);
  if (JSON.stringify(exactPaths) !== JSON.stringify(finalPaths)) {
    throw new Error('closeout changed-path manifest did not reach fixed point');
  }
  return {
    state,
    catalog,
    cutover: readJson(root, CUTOVER),
    references,
    changed_paths: finalPaths
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    const result = buildCloseout(root);
    console.log(`UNIT4D_ACCEPTANCE_CLOSEOUT_BUILD: PASS (${result.references.length} bounded events, ${result.changed_paths.length} paths)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
