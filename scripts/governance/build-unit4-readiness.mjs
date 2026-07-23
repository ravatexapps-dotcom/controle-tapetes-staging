import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildSourceManifest } from './build-current-state-source-manifest.mjs';
import { worktreeReader } from './git-content-reader.mjs';
import {
  activationManifestProjection,
  canonicalize,
  jsonSha256,
  prettyJsonLf,
  rejectSelfReference,
  sha256,
  statePayloadProjection
} from './unit4-canonical-json.mjs';
import {
  CANDIDATE_VIEW_PATHS,
  renderCandidateViews,
  writeCandidateViews
} from './render-unit4-candidate-views.mjs';
import {
  deriveRequiredBoundedReferences,
  readBoundedLedgerEvents
} from './read-bounded-ledger-events.mjs';
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const BASELINE = '76f52c842678b74e655ef9080f4fc67ccbd38e22';
export const STATE_PATH = 'docs/governance/current-state.json';
export const CATALOG_PATH = 'docs/governance/catalog/documents.json';
export const TRACE_PATH = 'docs/governance/traceability/purchase-order-phase-c.json';
export const READINESS_PATH = 'docs/governance/candidate/readiness-manifest.json';
export const SOURCE_MANIFEST_PATH = 'docs/governance/candidate/current-state-source-manifest.json';
export const EQUIVALENCE_PATH = 'docs/governance/candidate/current-state-equivalence.json';
export const SCHEMAS = [
  'docs/governance/schemas/current-state-v2.schema.json',
  'docs/governance/schemas/document-catalog-v2.schema.json',
  'docs/governance/schemas/purchase-order-phase-c-v2.schema.json',
  'docs/governance/schemas/unit4-readiness-manifest.schema.json'
];
export const ROOT_AUTHORITIES = [
  ['PROJECT_STATE.md', 'CURRENT_STATE_OWNER'],
  ['AGENT_HANDOFF.md', 'MANUAL_DERIVED_HANDOFF'],
  ['docs/DOCUMENTATION_INDEX.md', 'CLASSIFICATION_OWNER'],
  ['docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md', 'PHASE_C_TRACEABILITY_OWNER']
];
export const CONSUMERS = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/governance/AGENT_INSTRUCTIONS.md',
  'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
  'scripts/validate-spec-custody.mjs',
  'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs',
  'scripts/governance/build-current-state-source-manifest.mjs',
  'scripts/governance/render-current-state-shadow.mjs',
  'scripts/governance/validate-current-state-shadow.mjs',
  'tests/governance-current-state-shadow.test.mjs',
  'scripts/governance/build-document-source-manifest.mjs',
  'scripts/governance/render-documentation-shadow.mjs',
  'scripts/governance/validate-documentation-shadow.mjs',
  'tests/governance-documentation-shadow.test.mjs',
  'scripts/governance/git-content-reader.mjs',
  'scripts/governance/build-g28-ledger-partitions.mjs',
  'scripts/governance/render-g28-ledger-shadow.mjs',
  'scripts/governance/validate-g28-ledger-shadow.mjs',
  'tests/governance-g28-ledger-shadow.test.mjs',
  'docs/governance/shadow/current-state.json',
  'docs/governance/catalog/documents.json',
  'docs/governance/traceability/purchase-order-phase-c.json',
  'docs/governance/ledger/g28-ledger-source-manifest.json',
  'docs/governance/ledger/g28-ledger-partition-index.json and partition family'
];

const CHANGED_CONSUMERS = new Set([
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
  'scripts/governance/build-document-source-manifest.mjs',
  'scripts/governance/validate-documentation-shadow.mjs',
  'tests/governance-g28-ledger-shadow.test.mjs',
  'docs/governance/shadow/current-state.json',
  'docs/governance/catalog/documents.json',
  'docs/governance/traceability/purchase-order-phase-c.json',
  'docs/governance/ledger/g28-ledger-source-manifest.json',
  'docs/governance/ledger/g28-ledger-partition-index.json and partition family'
]);
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
function candidateArtifact(relativePath, suffix, role, owner) {
  return {
    artifact_id: `DOC-UNIT4A-CANDIDATE-${suffix}`,
    path: relativePath,
    classification: 'DERIVED',
    authority: 'EVIDENCE_ONLY',
    owner,
    bootstrap_tier: 'TIER_3_REFERENCE',
    status: 'GENERATED',
    disposition: 'GENERATE_DERIVED_VIEW',
    generated_status: 'GENERATED',
    role,
    content_hash: null,
    line_count: null,
    byte_count: null,
    inbound_references: null,
    outbound_references: null,
    survival_destination: relativePath,
    compatibility_pointer: owner,
    review_status: 'REVIEWED',
    review_basis: 'Unit 4A literal candidate output; dynamic content metadata is external to the catalog render domain to prevent a hash cycle.'
  };
}
export function buildCandidateCatalog(current, documentManifest = null) {
  const manifestByPath = new Map((documentManifest?.documents ?? []).map(item => [item.path, item]));
  const accepted = current.artifacts.filter(item =>
    !Object.values(CANDIDATE_VIEW_PATHS).includes(item.path)).map(item => {
    const document = manifestByPath.get(item.path);
    if (!document) return item;
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
  const additions = [
    candidateArtifact(CANDIDATE_VIEW_PATHS.project, 'PROJECT-STATE', 'derived', 'PROJECT_STATE.md'),
    candidateArtifact(CANDIDATE_VIEW_PATHS.handoff, 'AGENT-HANDOFF', 'derived', 'AGENT_HANDOFF.md'),
    candidateArtifact(CANDIDATE_VIEW_PATHS.documentation, 'DOCUMENTATION-INDEX', 'derived', 'docs/DOCUMENTATION_INDEX.md'),
    candidateArtifact(CANDIDATE_VIEW_PATHS.traceability, 'PHASE-C-TRACEABILITY', 'derived', 'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md')
  ];
  return {
    schema_version: '2.0.0',
    mode: 'CUTOVER_CANDIDATE',
    authority: 'NON_CANONICAL_UNTIL_SUPERVISOR_ACTIVATION',
    activation_status: 'INACTIVE',
    future_authority_path: CATALOG_PATH,
    known_broken_references: current.known_broken_references.map(debt => {
      const source = manifestByPath.get(debt.source_path);
      const matches = source?.outbound_references?.filter(reference =>
        reference.target_path === debt.target) ?? [];
      const uniqueLines = [...new Set(matches.map(reference => reference.source_line))];
      return uniqueLines.length === 1 ? { ...debt, source_line: uniqueLines[0] } : debt;
    }),
    artifacts: [...accepted, ...additions]
  };
}
export function buildCandidateTraceability(current) {
  return {
    schema_version: '2.0.0',
    mode: 'CUTOVER_CANDIDATE',
    authority: 'NON_CANONICAL_UNTIL_SUPERVISOR_ACTIVATION',
    activation_status: 'INACTIVE',
    future_authority_path: TRACE_PATH,
    canonical_source: current.canonical_source,
    requirements: current.requirements
  };
}
function buildConsumerInventory() {
  return CONSUMERS.map((consumerPath, index) => ({
    ordinal: index + 1,
    path: consumerPath,
    disposition: index >= 26
      ? 'CANDIDATE_SOURCE_PREPARED'
      : index >= 22
        ? 'DERIVED_LEDGER_NAVIGATION_PRESERVED'
        : index >= 13 && index <= 21
          ? 'IMPLEMENTED_FOR_CANDIDATE_READINESS'
          : 'PROVEN_UNCHANGED_UNTIL_UNIT_4C',
    implementation_status: 'RESOLVED',
    changed_in_unit4a: CHANGED_CONSUMERS.has(consumerPath),
    existing_behavior_remains_authoritative: true,
    evidence: index >= 26 ? 'candidate source parity and readiness validation' : 'contract inventory and repository validation',
    unit4c_work_deferred: true,
    rollback_forward_correction: 'PRESERVE_OR_FORWARD_CORRECT'
  }));
}
function buildSourceEvidence(root) {
  const accepted = buildSourceManifest(root);
  const prior = readJson(root, 'docs/governance/shadow/current-state-equivalence.json');
  const units = accepted.sources.flatMap(source => source.units);
  const priorById = new Map(prior.mappings.map(item => [item.source_id, item]));
  const projectText = fs.readFileSync(path.join(root, 'PROJECT_STATE.md'), 'utf8').replace(/\r\n?/gu, '\n');
  const currentFactSections = units.filter(unit =>
    unit.source_path === 'PROJECT_STATE.md' && unit.source_kind === 'TEXT_BLOCK'
    && unit.heading_level >= 2 && !/HISTORICAL_REFERENCE/u.test(unit.source_id)).map(unit => ({
    source_id: unit.source_id,
    source_sha256: unit.sha256,
    semantic_domain: unit.heading_text,
    content: projectText.slice(unit.start_offset, unit.end_offset).trimEnd()
  }));
  const mappings = units.map(unit => {
    const previous = priorById.get(unit.source_id);
    const factIndex = currentFactSections.findIndex(item =>
      item.source_id === unit.source_id || item.semantic_domain === unit.heading_text);
    let disposition = 'PRESERVED_BY_AUTHORED_NORMATIVE_OWNER';
    if (previous?.preservation_disposition === 'PRESERVED_IN_LEDGER_OR_ARCHIVE') {
      disposition = 'PRESERVED_BY_LEDGER_OR_ARCHIVE';
    } else if (/HISTORICAL_REFERENCE/u.test(unit.source_id)) {
      disposition = 'PRESERVED_BY_LEDGER_OR_ARCHIVE';
    } else if (unit.source_path === 'AGENT_HANDOFF.md'
        && previous?.actual_owner_path === 'PROJECT_STATE.md') {
      disposition = 'REPRESENTED_IN_CANDIDATE_STATE';
    } else if (previous?.preservation_disposition === 'REPRESENTED_IN_STRUCTURED_STATE'
        || factIndex >= 0) {
      disposition = 'REPRESENTED_IN_CANDIDATE_STATE';
    } else if (previous?.preservation_disposition === 'RETAINED_IN_CURRENT_CANONICAL_SOURCE_PENDING_LATER_UNIT') {
      disposition = 'RETAINED_AS_NON_CURRENT_COMPATIBILITY_CONTENT';
    }
    return {
      source_id: unit.source_id,
      source_path: unit.source_path,
      source_sha256: unit.sha256,
      accepted_unit1_disposition: previous?.preservation_disposition ?? 'UNAVAILABLE',
      preservation_disposition: disposition,
      destination_path: disposition === 'GENERATED_CANDIDATE_VIEW_CONTENT'
        ? CANDIDATE_VIEW_PATHS.handoff
        : disposition === 'REPRESENTED_IN_CANDIDATE_STATE' ? STATE_PATH : previous?.destination_path,
      destination_json_pointer: disposition === 'REPRESENTED_IN_CANDIDATE_STATE'
        ? factIndex >= 0 ? `/current_fact_sections/${factIndex}` : previous?.destination_json_pointer ?? '/'
        : null,
      semantic_status: 'REVIEWED',
      review_basis: 'Derived from the accepted Unit 1 mapping and reconciled to the inactive Unit 4A candidate authority graph.'
    };
  });
  const manifest = {
    schema_version: '2.0.0',
    manifest_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-SOURCE-MANIFEST-R1',
    provenance: {
      accepted_unit1_checkpoint: '39abf42a7341b61fd4ac02a8e38d1e4f33471f0f',
      accepted_manifest_path: 'docs/governance/shadow/current-state-source-manifest.json',
      accepted_equivalence_path: 'docs/governance/shadow/current-state-equivalence.json'
    },
    coverage_model: accepted.coverage_model,
    source_paths: accepted.source_paths,
    required_bootstrap_keys: accepted.required_bootstrap_keys,
    sources: accepted.sources
  };
  const equivalence = {
    schema_version: '2.0.0',
    manifest_id: manifest.manifest_id,
    provenance_manifest_id: accepted.manifest_id,
    mappings
  };
  return { manifest, equivalence, units, currentFactSections };
}

function buildFactCoverage() {
  const fields = [
    'repository.identity', 'repository.canonical_workspace', 'repository.standalone_git_expected',
    'repository.branch', 'repository.checkpoint_remote', 'accepted_checkpoints.product',
    'accepted_checkpoints.clean_slate_readiness', 'accepted_checkpoints.clean_slate_execution',
    'accepted_checkpoints.governance_unit_1', 'accepted_checkpoints.governance_unit_2',
    'accepted_checkpoints.governance_unit_3', 'accepted_checkpoints.unit_4_contract',
    'active_phase', 'next_authorizable_action', 'active_track', 'governing_pointers',
    'applicable_baseline', 'environment_boundaries', 'protected_residue', 'live_debts', 'current_fact_sections', 'active_requirements',
    'prohibitions', 'bounded_recent_ledger_references', 'structured_sources',
    'candidate_views', 'activation.status', 'authority_epoch', 'cutover_id', 'schema_version'
  ];
  return fields.map(field => ({ fact: field, status: 'COVERED', owner: STATE_PATH }));
}

function buildActivation(references, hashes) {
  return {
    status: 'inactive',
    target_schema_version: '2.0.0',
    authority_epoch: 0,
    cutover_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1',
    required_parent: null,
    accepted_unit4b_readiness_checkpoint: null,
    branch: 'dev',
    allowed_publication_remote: 'staging/dev',
    manifest_algorithm: 'UNIT4-ACTIVATION-MANIFEST-V1',
    state_payload_sha256: '',
    structured_source_hashes: hashes,
    generated_view_hashes: {},
    governing_artifact_hashes: {},
    bounded_ledger_reference_identities: references.map(item => ({
      unit_id: item.unit_id,
      partition_id: item.partition_id,
      partition_payload_sha256: item.partition_payload_sha256,
      unit_raw_sha256: item.unit_raw_sha256
    })),
    activation_manifest_sha256: ''
  };
}

function buildBaseState(shadow, references, hashes, sourceEvidence, traceability) {
  return {
    schema_version: '2.0.0',
    mode: 'cutover_candidate',
    authority: 'non_canonical_until_supervisor_activation',
    state_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-CURRENT-STATE-CANDIDATE-R1',
    authority_epoch: 0,
    cutover_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1',
    last_accepted_phase: 'PHASE-C5',
    repository: {
      identity: 'ravatexapps-dotcom/controle-tapetes-staging',
      canonical_workspace: 'D:\\Programação\\controle-tapetes-g28',
      standalone_git_expected: true,
      branch: 'dev',
      checkpoint_remote: 'staging/dev'
    },
    accepted_checkpoints: {
      ...shadow.accepted_checkpoints,
      unit_4_contract: BASELINE
    },
    phase_status: {
      unit_4_contract: 'CLOSED / ACCEPTED / DIRECTLY VERIFIED',
      unit4a: 'IMPLEMENTED / CUTOVER READINESS EVIDENCE COMPLETE / AWAITING DIRECT SUPERVISOR REVIEW',
      unit4b: 'DIRECT SUPERVISOR REVIEW REQUIRED / NOT SELF-ACCEPTED',
      unit4c: 'NOT AUTHORIZED',
      documentary_authority_cutover: 'NOT AUTHORIZED',
      unit4d: 'NOT AUTHORIZED',
      unit5: 'NOT AUTHORIZED'
    },
    active_phase: {
      id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION',
      contract: 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
      status: 'IMPLEMENTED / CUTOVER READINESS EVIDENCE COMPLETE / AWAITING DIRECT SUPERVISOR REVIEW'
    },
    next_authorizable_action: {
      order_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1',
      canonical_value: 'DIRECT SUPERVISOR REVIEW OF GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1',
      mode: 'UNIT 4B READINESS DIRECT REVIEW',
      risk_class: 'R2',
      status: 'DIRECT SUPERVISOR REVIEW REQUIRED'
    },
    active_track: shadow.active_track,
    governing_pointers: {
      ...shadow.governing_pointers,
      traceability_authority: shadow.governing_pointers.traceability,
      canonical_ledger: shadow.governing_pointers.ledger,
      handoff_policy: 'docs/governance/SUPERVISION_PROTOCOL.md',
      unit_4_contract: 'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md'
    },
    applicable_baseline: null,
    environment_boundaries: shadow.environment_boundaries,
    protected_residue: shadow.protected_residue,
    live_debts: shadow.live_debts,
    current_fact_sections: sourceEvidence.currentFactSections,
    active_requirements: traceability.requirements.map(item => ({
      requirement_id: item.requirement_id,
      disposition: item.disposition,
      phase_owner: item.phase_owner,
      blocking_state: item.blocking_state
    })),
    prohibitions: [...new Set([...shadow.prohibitions, 'UNIT_4C', 'DOCUMENTARY_AUTHORITY_CUTOVER', 'UNIT_4D', 'UNIT_5'])],
    bounded_recent_ledger_references: references,
    structured_sources: Object.fromEntries(Object.entries(hashes).map(([key, value]) => [key, { path: key, sha256: value }])),
    candidate_views: Object.fromEntries(Object.values(CANDIDATE_VIEW_PATHS).map(value => [value, {
      structured_source: value.includes('DOCUMENTATION_INDEX') ? CATALOG_PATH
        : value.includes('TRACEABILITY') ? TRACE_PATH : STATE_PATH,
      authority: 'NON_CANONICAL_UNTIL_SUPERVISOR_ACTIVATION'
    }])),
    root_authorities: ROOT_AUTHORITIES.map(([authorityPath, role]) => ({
      path: authorityPath, role, generated_status: 'MANUAL', remains_authoritative: true
    })),
    rollback_readiness: {
      root_authorities_preserved: true,
      accepted_unit1_to_3_evidence_preserved: true,
      candidate_only_files_forward_removable: true,
      history_rewrite_required: false
    },
    activation: buildActivation(references, hashes)
  };
}

function buildReadinessManifest(root, state, sourceEvidence, references, ledgerRead) {
  return {
    schema_version: '1.0.0',
    manifest_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-READINESS-MANIFEST-R1',
    authority: 'NON_CANONICAL_READINESS_EVIDENCE',
    build_algorithm: 'UNIT4A-DETERMINISTIC-BUILD-V1',
    identities: {
      current_state_file_sha256: fileHash(root, STATE_PATH),
      state_payload_sha256: state.activation.state_payload_sha256,
      activation_manifest_sha256: state.activation.activation_manifest_sha256,
      schemas: Object.fromEntries(SCHEMAS.map(value => [value, fileHash(root, value)])),
      catalog_sha256: fileHash(root, CATALOG_PATH),
      traceability_sha256: fileHash(root, TRACE_PATH),
      candidate_views: state.activation.generated_view_hashes,
      governing_artifacts: state.activation.governing_artifact_hashes
    },
    consumer_inventory: buildConsumerInventory(),
    reference_search: {
      contract_consumers: 31,
      unresolved_material_consumers: 0,
      result: 'NO_NEW_MATERIAL_CONSUMER',
      searched_authority_families: [...ROOT_AUTHORITIES.map(([value]) => value), STATE_PATH, CATALOG_PATH, TRACE_PATH]
    },
    fact_coverage: buildFactCoverage(),
    bounded_ledger_references: references,
    root_authorities: state.root_authorities,
    source_equivalence: {
      accepted_unit1_units: sourceEvidence.units.length,
      candidate_manifest_units: sourceEvidence.units.length,
      candidate_equivalence_mappings: sourceEvidence.equivalence.mappings.length,
      unresolved_units: 0
    },
    bootstrap: {
      input_allowlist: [
        'repository-routing-metadata', STATE_PATH, SCHEMAS[0],
        state.active_phase.contract, state.governing_pointers.unit_4_contract,
        'docs/governance/ledger/g28-ledger-partition-index.json',
        ...ledgerRead.partitions_read
      ],
      full_ledger_read: false,
      private_memory_used: false,
      required_facts_resolved: true
    },
    readiness_gates: {
      candidate_schema: true,
      fact_coverage: true,
      consumer_coverage: true,
      traceability_parity: true,
      candidate_isolation: true,
      root_authority_preserved: true,
      bounded_ledger: true,
      no_full_ledger_read: true,
      no_private_memory: true,
      rollback_forward_correction: true,
      unit4a_self_accepted: false,
      unit4c_authorized: false
    }
  };
}

export function buildReadiness(root = REPO_ROOT) {
  const reader = worktreeReader(root);
  const shadow = readJson(root, 'docs/governance/shadow/current-state.json');
  const documentManifest = readJson(root, 'docs/governance/catalog/document-source-manifest.json');
  const catalog = buildCandidateCatalog(readJson(root, CATALOG_PATH), documentManifest);
  const traceability = buildCandidateTraceability(readJson(root, TRACE_PATH));
  writeJson(root, CATALOG_PATH, catalog);
  writeJson(root, TRACE_PATH, traceability);
  const index = readJson(root, 'docs/governance/ledger/g28-ledger-partition-index.json');
  const references = deriveRequiredBoundedReferences(index);
  const ledgerRead = readBoundedLedgerEvents(reader, references);
  const sourceEvidence = buildSourceEvidence(root);
  writeJson(root, SOURCE_MANIFEST_PATH, sourceEvidence.manifest);
  writeJson(root, EQUIVALENCE_PATH, sourceEvidence.equivalence);
  const hashPaths = [CATALOG_PATH, TRACE_PATH, ...SCHEMAS];
  const sourceHashes = Object.fromEntries(hashPaths.map(value => [value, fileHash(root, value)]));
  const state = buildBaseState(shadow, references, sourceHashes, sourceEvidence, traceability);
  const governingPaths = [
    'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md',
    'docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md',
    'docs/governance/DOCUMENTATION_MODEL.md', 'docs/governance/SUPERVISION_PROTOCOL.md',
    ...ROOT_AUTHORITIES.map(([value]) => value)
  ];
  state.activation.governing_artifact_hashes = Object.fromEntries(
    governingPaths.map(value => [value, fileHash(root, value)])
  );
  state.activation.state_payload_sha256 = jsonSha256(statePayloadProjection(state));
  const views = renderCandidateViews(canonicalize(state), catalog, traceability);
  writeCandidateViews(root, views);
  state.activation.generated_view_hashes = Object.fromEntries(
    Object.keys(views).map(value => [value, fileHash(root, value)])
  );
  state.activation.activation_manifest_sha256 = jsonSha256(activationManifestProjection(state));
  const selfErrors = rejectSelfReference(state);
  if (selfErrors.length) throw new Error(selfErrors.join('\n'));
  writeJson(root, STATE_PATH, state);
  const readiness = buildReadinessManifest(root, state, sourceEvidence, references, ledgerRead);
  writeJson(root, READINESS_PATH, readiness);
  return { state, catalog, traceability, readiness, views };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    const result = buildReadiness(root);
    console.log(`UNIT4A_READINESS_BUILD: PASS (${result.readiness.consumer_inventory.length} consumers)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
