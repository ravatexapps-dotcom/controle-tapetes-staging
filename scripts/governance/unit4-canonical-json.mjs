import crypto from 'node:crypto';

const FORBIDDEN_KEYS = new Set([
  'cutovercommit',
  'currentcommitsha',
  'commitsha',
  'treesha',
  'enclosingcommitsha',
  'enclosingtreesha',
  'timestamp',
  'timestamps',
  'livegitstate',
  'worktreecontent',
  'stagingstate',
  'livedivergence',
  'protectedresiduecontent',
  'protectedresiduecontents',
  'silentfallback'
]);

function normalizedKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/gu, '');
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map(key => [key, canonicalize(value[key])])
  );
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function prettyJsonLf(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function jsonSha256(value) {
  return sha256(Buffer.from(canonicalJson(value), 'utf8'));
}

export function clone(value) {
  return structuredClone(value);
}

export function rejectSelfReference(value, location = '$') {
  const errors = [];
  function visit(current, pointer) {
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }
    if (!current || typeof current !== 'object') return;
    for (const [key, child] of Object.entries(current)) {
      const normalized = normalizedKey(key);
      if (FORBIDDEN_KEYS.has(normalized)
          || normalized.includes('currentcommitsha')
          || normalized.includes('cutovercommit')
          || normalized.includes('enclosingcommit')
          || normalized.includes('enclosingtree')) {
        errors.push(`${pointer}/${key}: self-referential or transient field forbidden`);
      }
      visit(child, `${pointer}/${key}`);
    }
  }
  visit(value, location);
  return errors;
}

export function statePayloadProjection(state) {
  const projection = clone(state);
  if (projection.activation) {
    delete projection.activation.activation_manifest_sha256;
    delete projection.activation.generated_view_hashes;
    // A digest cannot be inside its own hash domain. This is the explicit
    // identity-field exclusion required to keep the Unit 4A graph acyclic.
    delete projection.activation.state_payload_sha256;
  }
  return canonicalize(projection);
}

export function activationManifestProjection(state) {
  const projection = clone(state.activation);
  delete projection.activation_manifest_sha256;
  return canonicalize(projection);
}

export function catalogRenderProjection(catalog) {
  return canonicalize({
    schema_version: catalog.schema_version,
    mode: catalog.mode,
    authority: catalog.authority,
    activation_status: catalog.activation_status,
    future_authority_path: catalog.future_authority_path,
    artifacts: catalog.artifacts.map(entry => ({
      artifact_id: entry.artifact_id,
      path: entry.path,
      classification: entry.classification,
      authority: entry.authority,
      bootstrap_tier: entry.bootstrap_tier,
      disposition: entry.disposition
    }))
  });
}

export function traceabilityRenderProjection(traceability) {
  return canonicalize({
    schema_version: traceability.schema_version,
    mode: traceability.mode,
    authority: traceability.authority,
    activation_status: traceability.activation_status,
    future_authority_path: traceability.future_authority_path,
    requirements: traceability.requirements
  });
}
