import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { writeDocumentManifest } from './build-document-source-manifest.mjs';
import { writeArtifacts as writeLedgerArtifacts } from './build-g28-ledger-partitions.mjs';
import { writeCompatibilityView as writeLedgerCompatibilityView } from './render-g28-ledger-shadow.mjs';
import { activationManifestProjection, jsonSha256, prettyJsonLf, rejectSelfReference, sha256, statePayloadProjection } from './unit4-canonical-json.mjs';
import { CANONICAL_VIEW_PATHS, renderCanonicalViews, validateRenderedViews, writeCanonicalViews } from './render-unit4-canonical-views.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const PARENT = 'fa986cf935abbf053172cfd549b0171bb9446f58';
export const CUTOVER_ID = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1';
export const STATE_PATH = 'docs/governance/current-state.json';
export const CATALOG_PATH = 'docs/governance/catalog/documents.json';
export const TRACE_PATH = 'docs/governance/traceability/purchase-order-phase-c.json';
export const ROLLBACK_PATH = 'docs/governance/cutover/unit4c-rollback-readiness.json';
export const CUTOVER_PATH = 'docs/governance/cutover/unit4c-cutover-manifest.json';
export const LEDGER_PATH = 'docs/ledgers/G28_LEDGER.md';
export const CORRECTION_ORDER = 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-CANONICAL-CONSISTENCY-FORWARD-CORRECTION-R1';
export const SCHEMAS = [
  'docs/governance/schemas/current-state-v2.schema.json',
  'docs/governance/schemas/document-catalog-v2.schema.json',
  'docs/governance/schemas/purchase-order-phase-c-v2.schema.json',
  'docs/governance/schemas/unit4-cutover-manifest.schema.json',
  'docs/governance/schemas/unit4-rollback-readiness.schema.json'
];
const GOVERNING_ARTIFACTS = [
  'docs/governance/AGENT_INSTRUCTIONS.md',
  'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md'
];

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(root, relativePath, value) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, prettyJsonLf(value), 'utf8');
}

function fileHash(root, relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function git(root, args) {
  return childProcess.execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function canonicalArtifact(relativePath, suffix, classification, authority) {
  return {
    artifact_id: `DOC-UNIT4C-${suffix}`,
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
    review_basis: 'Unit 4C externally authorized canonical authority activation.'
  };
}

function transformRootArtifact(item) {
  const sourceByRoot = {
    'PROJECT_STATE.md': STATE_PATH,
    'AGENT_HANDOFF.md': STATE_PATH,
    'docs/DOCUMENTATION_INDEX.md': CATALOG_PATH,
    'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md': TRACE_PATH
  };
  const source = sourceByRoot[item.path];
  if (!source) return item;
  return {
    ...item,
    classification: 'GENERATED_COMPATIBILITY_VIEW',
    authority: 'NONE / STRUCTURED_SOURCE_OWNED',
    owner: source,
    status: 'ACTIVE_GENERATED',
    disposition: 'GENERATE_FROM_STRUCTURED_SOURCE',
    generated_status: 'GENERATED',
    role: 'compatibility',
    content_hash: null,
    line_count: null,
    byte_count: null,
    inbound_references: null,
    outbound_references: null,
    survival_destination: item.path,
    compatibility_pointer: source,
    review_basis: 'Unit 4C active generated compatibility view; dynamic hash is externally owned.'
  };
}

function refreshArtifact(item, manifestByPath) {
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
}

function buildCatalog(candidate, manifest) {
  const manifestByPath = new Map((manifest?.documents ?? []).map(item => [item.path, item]));
  const existing = candidate.artifacts.map(item => {
    const rooted = transformRootArtifact(item);
    if (rooted !== item) return rooted;
    let updated = item;
    if (item.path === 'docs/governance/shadow/generated/G28_LEDGER.md'
        || item.path.startsWith('docs/governance/shadow/ledger/partitions/')) {
      updated = {
        ...item,
        classification: 'DERIVED',
        authority: 'DERIVED',
        status: 'GENERATED'
      };
    } else if (item.path.startsWith('docs/governance/candidate/')
        || item.path.startsWith('docs/governance/shadow/')) {
      updated = {
        ...item,
        authority: 'EVIDENCE_ONLY',
        status: 'HISTORICAL'
      };
    }
    return refreshArtifact(updated, manifestByPath);
  });
  const additions = [
    canonicalArtifact(STATE_PATH, 'CURRENT-STATE', 'STRUCTURED_CURRENT_STATE', 'CANONICAL_CURRENT_STATE_OWNER'),
    canonicalArtifact(CATALOG_PATH, 'CATALOG', 'STRUCTURED_CATALOG', 'CANONICAL_DOCUMENT_CLASSIFICATION_OWNER'),
    canonicalArtifact(TRACE_PATH, 'TRACEABILITY', 'STRUCTURED_TRACEABILITY', 'CANONICAL_PHASE_C_TRACEABILITY_OWNER'),
    canonicalArtifact(CUTOVER_PATH, 'CUTOVER-MANIFEST', 'CUTOVER_EVIDENCE', 'EVIDENCE_ONLY'),
    canonicalArtifact(ROLLBACK_PATH, 'ROLLBACK-READINESS', 'FORWARD_CORRECTION_READINESS', 'EVIDENCE_ONLY'),
    canonicalArtifact('scripts/governance/build-unit4-cutover.mjs', 'BUILDER', 'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    canonicalArtifact('scripts/governance/render-unit4-canonical-views.mjs', 'RENDERER', 'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    canonicalArtifact('scripts/governance/validate-unit4-cutover.mjs', 'VALIDATOR', 'GOVERNANCE_TOOLING', 'IMPLEMENTATION'),
    canonicalArtifact('tests/governance-unit4-cutover.test.mjs', 'TESTS', 'GOVERNANCE_TEST', 'EVIDENCE_ONLY')
  ];
  const paths = new Set(existing.map(item => item.path));
  return {
    ...candidate,
    mode: 'CANONICAL',
    authority: 'CANONICAL_DOCUMENT_CLASSIFICATION_OWNER',
    activation_status: 'ACTIVE',
    authority_epoch: 1,
    cutover_id: CUTOVER_ID,
    artifacts: [...existing, ...additions.filter(item => !paths.has(item.path))]
  };
}

function buildTraceability(candidate) {
  return {
    ...candidate,
    mode: 'CANONICAL',
    authority: 'CANONICAL_PHASE_C_TRACEABILITY_OWNER',
    activation_status: 'ACTIVE',
    authority_epoch: 1,
    cutover_id: CUTOVER_ID
  };
}

function deriveReferences(root) {
  const manifest = readJson(root, 'docs/governance/ledger/g28-ledger-source-manifest.json');
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  const wanted = [
    'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-BOOTSTRAP-AUTHORITY-CUTOVER-CONTRACT-R1',
    'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-CONTRACT-COMMIT-BINDING-AND-CANDIDATE-PATH-CORRECTION-R2',
    'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1',
    'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-DOCUMENTARY-AUTHORITY-CUTOVER-R1',
    CORRECTION_ORDER
  ];
  return wanted.map((eventId, ordinal) => {
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
      reason: ordinal === 0 ? 'Unit 3 acceptance and Unit 4 contract definition'
        : ordinal === 1 ? 'Unit 4 contract correction'
          : ordinal === 2 ? 'Unit 4A authorization and accepted readiness'
            : ordinal === 3 ? 'Unit 4C activation'
              : 'Unit 4C canonical consistency forward correction'
    };
  });
}

function evidenceEvents(originalActivationManifestHash) {
  return [
    {
      event_id: 'UNIT4A_UNIT4B_ACCEPTANCE',
      classification: 'EXTERNAL_SUPERVISOR_RULING',
      checkpoint: PARENT,
      unit4a: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4b: 'DIRECT REVIEW COMPLETED / ACCEPTED'
    },
    {
      event_id: 'UNIT4C_ACTIVATION',
      classification: 'MATERIAL_STATE_CHANGE_AND_NORMATIVE_AUTHORITY_CHANGE',
      accepted_readiness_checkpoint: PARENT,
      authority_epoch: 1,
      cutover_id: CUTOVER_ID,
      activation_status: 'active',
      unit4d_review_required: true,
      unit4c_self_accepted: false,
      actual_activation_commit_identity: 'EXTERNAL_GIT_FACT',
      publication_ponr: 'git push staging dev'
    },
    {
      event_id: 'UNIT4C_ACTIVATION_SUBJECT',
      classification: 'SPEC_CUSTODY_ACCOUNTING',
      subject: 'feat: activate structured governance authority'
    },
    {
      event_id: 'UNIT4C_CANONICAL_CONSISTENCY_FORWARD_CORRECTION',
      classification: 'FORWARD_CORRECTION',
      subject: 'fix: reconcile post-cutover governance authority',
      authority_epoch: 1,
      second_activation: false,
      rollback_executed: false,
      unit4d_review_required: true,
      original_ponr_unchanged: true,
      original_activation_manifest_sha256: originalActivationManifestHash
    }
  ];
}

function historicalFactSources(root, legacySectionCount) {
  const shadow = readJson(root, 'docs/governance/shadow/current-state-equivalence.json');
  const candidate = readJson(root, 'docs/governance/candidate/current-state-equivalence.json');
  const ledger = readJson(root, 'docs/governance/ledger/g28-ledger-source-manifest.json');
  return [
    ['docs/governance/shadow/current-state-equivalence.json', 'PRE_CUTOVER_SEMANTIC_EQUIVALENCE',
      shadow.manifest_id, 'MAPPING', shadow.mappings.length, 'HISTORICAL_NON_AUTHORITATIVE'],
    ['docs/governance/candidate/current-state-equivalence.json', 'ACCEPTED_UNIT4A_READINESS_EQUIVALENCE',
      candidate.manifest_id, 'MAPPING', candidate.mappings.length, 'HISTORICAL_NON_AUTHORITATIVE'],
    ['docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md', 'PRE_CUTOVER_CURRENT_STATE_ARCHIVE',
      `ACCEPTED_UNIT4B_CHECKPOINT:${PARENT}`, 'UNIT', legacySectionCount, 'HISTORICAL_NON_AUTHORITATIVE'],
    [LEDGER_PATH, 'APPEND_ONLY_GOVERNANCE_HISTORY', ledger.manifest_id, 'UNIT', ledger.units.length,
      'CANONICAL_APPEND_ONLY_HISTORY_NON_AUTHORITATIVE_FOR_CURRENT_STATE']
  ].map(([source_path, evidence_role, evidence_identity, record_kind, record_count, authority_status]) => ({
    source_path, evidence_role, evidence_identity, record_kind, record_count,
    unresolved_count: 0, authority_status, bootstrap_required: false
  }));
}

function buildState(candidate, references, rollbackHash, sourceHashes, governingHashes, historicalSources) {
  const {
    current_fact_sections: legacySections,
    historical_fact_sources: ignoredHistoricalSources,
    ...currentFields
  } = candidate;
  const state = {
    ...currentFields,
    mode: 'canonical',
    authority: 'canonical_current_state',
    state_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-CURRENT-STATE-R1',
    authority_epoch: 1,
    accepted_checkpoints: {
      ...candidate.accepted_checkpoints,
      unit_4a_readiness: PARENT,
      unit_4b_readiness: PARENT
    },
    phase_status: {
      unit_4_contract: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4a: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4b: 'DIRECT REVIEW COMPLETED / ACCEPTED',
      unit4c: 'ACTIVATED / FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW',
      documentary_authority_cutover: 'ACTIVE / FORWARD CORRECTION APPLIED / AWAITING UNIT 4D REVIEW',
      unit4d: 'DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
      unit5: 'NOT AUTHORIZED'
    },
    active_phase: {
      ...candidate.active_phase,
      status: 'UNIT 4C FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW'
    },
    next_authorizable_action: {
      order_id: CORRECTION_ORDER,
      canonical_value: `DIRECT SUPERVISOR REVIEW OF ${CORRECTION_ORDER}`,
      mode: 'UNIT 4D POST-CORRECTION DIRECT REVIEW',
      risk_class: 'R2',
      status: 'DIRECT SUPERVISOR REVIEW REQUIRED'
    },
    governing_pointers: {
      ...candidate.governing_pointers,
      current_state: STATE_PATH,
      document_classification: CATALOG_PATH,
      traceability: TRACE_PATH,
      traceability_authority: TRACE_PATH,
      canonical_ledger: LEDGER_PATH
    },
    prohibitions: [...new Set(candidate.prohibitions.filter(value =>
      !['UNIT_4C', 'DOCUMENTARY_AUTHORITY_CUTOVER', 'UNIT_4D'].includes(value)
      && !value.includes('DOCUMENTARY-AUTHORITY CUTOVER')).concat([
      'UNIT_4D_ACCEPTANCE', 'UNIT_5', 'SILENT_FALLBACK', 'MANUAL_GENERATED_ROOT_EDIT'
    ]))],
    bounded_recent_ledger_references: references,
    historical_fact_sources: historicalSources,
    live_debts: candidate.live_debts.map(debt => ({
      ...debt,
      owner_path: debt.owner_path === 'PROJECT_STATE.md' ? STATE_PATH : debt.owner_path
    })),
    structured_sources: Object.fromEntries(Object.entries(sourceHashes).map(([sourcePath, hash]) =>
      [sourcePath, { path: sourcePath, sha256: hash }])),
    candidate_views: Object.fromEntries(Object.entries(candidate.candidate_views).map(([viewPath, value]) =>
      [viewPath, { ...value, authority: 'HISTORICAL_READINESS_EVIDENCE' }])),
    root_authorities: [
      ['PROJECT_STATE.md', 'GENERATED_CURRENT_STATE_COMPATIBILITY'],
      ['AGENT_HANDOFF.md', 'GENERATED_OPERATIONAL_HANDOFF'],
      ['docs/DOCUMENTATION_INDEX.md', 'GENERATED_CLASSIFICATION_COMPATIBILITY'],
      ['docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md', 'GENERATED_TRACEABILITY_COMPATIBILITY']
    ].map(([rootPath, role]) => ({
      path: rootPath, role, generated_status: 'GENERATED', remains_authoritative: false
    })),
    rollback_readiness: {
      status: 'PREPARED / NOT AUTHORIZED / NOT ACTIVATED',
      path: ROLLBACK_PATH,
      sha256: rollbackHash,
      forward_only: true
    },
    evidence_events: evidenceEvents(
      candidate.evidence_events?.find(event =>
        event.event_id === 'UNIT4C_CANONICAL_CONSISTENCY_FORWARD_CORRECTION')
        ?.original_activation_manifest_sha256 ?? candidate.activation.activation_manifest_sha256
    ),
    activation: {
      ...candidate.activation,
      status: 'active',
      authority_epoch: 1,
      required_parent: PARENT,
      accepted_unit4b_readiness_checkpoint: PARENT,
      structured_source_hashes: sourceHashes,
      generated_view_hashes: {},
      governing_artifact_hashes: governingHashes,
      bounded_ledger_reference_identities: references.map(item => ({
        unit_id: item.unit_id,
        partition_id: item.partition_id,
        partition_payload_sha256: item.partition_payload_sha256,
        unit_raw_sha256: item.unit_raw_sha256
      })),
      rollback_readiness_sha256: rollbackHash,
      activation_manifest_sha256: ''
    }
  };
  state.activation.state_payload_sha256 = jsonSha256(statePayloadProjection(state));
  return state;
}

function contractId(root) {
  const contract = fs.readFileSync(path.join(root, GOVERNING_ARTIFACTS[4]), 'utf8');
  const identity = contract.match(/^CONTRACT_ID:\s*(\S+)\s*$/mu)?.[1];
  if (!identity) throw new Error('literal Unit 4 contract ID missing');
  return identity;
}

function buildCutoverManifest(root, state, references, rollbackHash, activationPaths) {
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  return {
    schema_version: '1.0.0',
    manifest_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-CUTOVER-MANIFEST-R1',
    contract_id: contractId(root),
    order_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-DOCUMENTARY-AUTHORITY-CUTOVER-R1',
    required_parent: PARENT,
    accepted_unit4b_checkpoint: PARENT,
    target_branch: 'dev',
    allowed_remote: 'staging/dev',
    cutover_id: CUTOVER_ID,
    authority_epoch: 1,
    activation_status: 'active',
    review_status: 'CHANGES_REQUIRED / FORWARD CORRECTION APPLIED / AWAITING DIRECT SUPERVISOR REVIEW',
    second_activation: false,
    original_ponr_unchanged: true,
    state_payload_sha256: state.activation.state_payload_sha256,
    activation_manifest_sha256: state.activation.activation_manifest_sha256,
    current_state_file_sha256: fileHash(root, STATE_PATH),
    catalog_sha256: fileHash(root, CATALOG_PATH),
    traceability_sha256: fileHash(root, TRACE_PATH),
    schema_hashes: Object.fromEntries(SCHEMAS.map(relativePath => [relativePath, fileHash(root, relativePath)])),
    generated_root_hashes: state.activation.generated_view_hashes,
    governing_artifact_hashes: state.activation.governing_artifact_hashes,
    canonical_ledger_identity: {
      path: LEDGER_PATH,
      sha256: index.canonical_source_sha256,
      git_object_classification: 'WORKTREE_CONTENT_EXTERNAL_TO_ACTIVATION_SOURCE',
      authority: 'AUTHORED_APPEND_ONLY_CANONICAL_LEDGER'
    },
    bounded_ledger_reference_identities: references,
    rollback_readiness_sha256: rollbackHash,
    changed_paths: activationPaths,
    ponr_command: 'git push staging dev',
    actual_activation_commit_identity: 'EXTERNAL_GIT_FACT',
    unit4d_review: 'DIRECT_SUPERVISOR_REVIEW_REQUIRED / NOT_SELF_ACCEPTED',
    prohibited_actions: [
      'UNIT_4D_ACCEPTANCE', 'UNIT_5', 'RESET', 'FORCE_PUSH', 'HISTORY_REWRITE',
      'SILENT_FALLBACK', 'PRODUCT_OR_DATABASE_OR_ENVIRONMENT_ACTION'
    ]
  };
}

export function buildCutover(root = REPO_ROOT) {
  if (git(root, ['branch', '--show-current']) !== 'dev') throw new Error('Unit 4C branch mismatch');
  const candidateState = readJson(root, STATE_PATH);
  if (candidateState.mode !== 'canonical' || candidateState.authority_epoch !== 1
      || candidateState.activation?.status !== 'active'
      || candidateState.activation?.required_parent !== PARENT
      || candidateState.activation?.accepted_unit4b_readiness_checkpoint !== PARENT) {
    throw new Error('forward correction requires active authority epoch 1');
  }
  const priorCutover = readJson(root, CUTOVER_PATH);
  const rollback = readJson(root, ROLLBACK_PATH);
  if (rollback.status !== 'PREPARED / NOT AUTHORIZED / NOT ACTIVATED') {
    throw new Error('rollback readiness must remain inactive');
  }
  const traceability = readJson(root, TRACE_PATH);
  if (JSON.stringify(buildTraceability(traceability)) !== JSON.stringify(traceability)) {
    throw new Error('traceability authority drift requires an unauthorized path');
  }
  writeLedgerArtifacts(root);
  writeLedgerCompatibilityView(root);
  const references = deriveReferences(root);
  const rollbackHash = fileHash(root, ROLLBACK_PATH);
  const legacySectionCount = candidateState.current_fact_sections?.length ?? 10;
  const historicalSources = historicalFactSources(root, legacySectionCount);
  let catalog = readJson(root, CATALOG_PATH);
  let state;
  for (let pass = 0; pass < 3; pass += 1) {
    catalog = buildCatalog(catalog, writeDocumentManifest(root));
    writeJson(root, CATALOG_PATH, catalog);
    const sourceHashes = Object.fromEntries([
      CATALOG_PATH, TRACE_PATH, ROLLBACK_PATH, ...SCHEMAS
    ].map(relativePath => [relativePath, fileHash(root, relativePath)]));
    const governingHashes = Object.fromEntries(GOVERNING_ARTIFACTS.map(relativePath =>
      [relativePath, fileHash(root, relativePath)]));
    state = buildState(candidateState, references, rollbackHash, sourceHashes, governingHashes, historicalSources);
    const views = renderCanonicalViews(state, catalog, traceability);
    validateRenderedViews(views);
    state.activation.generated_view_hashes = Object.fromEntries(Object.entries(views).map(([relativePath, text]) =>
      [relativePath, sha256(text.replace(/\r\n?/gu, '\n'))]));
    state.activation.activation_manifest_sha256 = jsonSha256(activationManifestProjection(state));
    const selfErrors = rejectSelfReference(state);
    if (selfErrors.length) throw new Error(selfErrors.join('\n'));
    writeJson(root, STATE_PATH, state);
    const writtenHashes = writeCanonicalViews(root, renderCanonicalViews(state, catalog, traceability));
    if (JSON.stringify(writtenHashes) !== JSON.stringify(state.activation.generated_view_hashes)) {
      throw new Error('generated root hash drift');
    }
  }
  writeDocumentManifest(root);
  writeLedgerArtifacts(root);
  writeLedgerCompatibilityView(root);
  const cutover = buildCutoverManifest(root, state, references, rollbackHash, priorCutover.changed_paths);
  writeJson(root, CUTOVER_PATH, cutover);
  return { state, catalog, traceability, rollback, cutover };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    const result = buildCutover(root);
    console.log(`UNIT4C_CUTOVER_BUILD: PASS (${result.traceability.requirements.length} trace rows)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
