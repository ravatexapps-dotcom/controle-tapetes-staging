import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { buildDocumentManifest, normalizeLf } from './build-document-source-manifest.mjs';
import { commitReader, worktreeReader } from './git-content-reader.mjs';
import { renderViews, MARKER } from './render-documentation-shadow.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
const MANIFEST = 'docs/governance/catalog/document-source-manifest.json';
const CATALOG = 'docs/governance/catalog/documents.json';
const TRACE = 'docs/governance/traceability/purchase-order-phase-c.json';
const INDEX_VIEW = 'docs/governance/shadow/generated/DOCUMENTATION_INDEX.md';
const TRACE_VIEW = 'docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md';
const ALLOWED_DISPOSITIONS = new Set(['PLANNED', 'PARTIALLY_SATISFIED', 'SATISFIED', 'DEFERRED', 'BLOCKED', 'NOT_APPLICABLE', 'SUPERSEDED']);

function parseJson(reader, relativePath, errors) {
  try { return JSON.parse(reader.readText(relativePath)); }
  catch (error) { errors.push(`${relativePath}: invalid JSON: ${error.message}`); return null; }
}
function stable(value) { return JSON.stringify(value); }
function duplicateValues(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) seen.has(value) ? duplicate.add(value) : seen.add(value);
  return [...duplicate];
}
function schemaTypeMatches(value, type) {
  if (Array.isArray(type)) return type.some(item => schemaTypeMatches(value, item));
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}
function validateSchema(value, schema, location = '$') {
  const errors = [];
  if (schema.type && !schemaTypeMatches(value, schema.type)) return [`${location}: invalid type`];
  if ('const' in schema && stable(value) !== stable(schema.const)) errors.push(`${location}: const mismatch`);
  if (schema.enum && !schema.enum.some(item => stable(item) === stable(value))) errors.push(`${location}: enum mismatch`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: minLength`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${location}: pattern`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location}: minItems`);
    if (schema.items) value.forEach((item, index) => errors.push(...validateSchema(item, schema.items, `${location}[${index}]`)));
  }
  if (schemaTypeMatches(value, 'object')) {
    for (const key of schema.required ?? []) if (!(key in value)) errors.push(`${location}: missing ${key}`);
    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in properties)) errors.push(`${location}: unknown ${key}`);
    for (const [key, child] of Object.entries(properties)) if (key in value) errors.push(...validateSchema(value[key], child, `${location}.${key}`));
  }
  return errors;
}
function validateRootRelative(value, label, errors) {
  if (typeof value !== 'string' || value.length === 0) { errors.push(`${label}: missing path`); return; }
  if (path.posix.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) errors.push(`${label}: absolute path forbidden`);
  if (value.includes('\\')) errors.push(`${label}: backslash forbidden`);
  if (value.split('/').includes('..')) errors.push(`${label}: path traversal forbidden`);
  if (path.posix.normalize(value) !== value) errors.push(`${label}: non-normalized path`);
}

export function parseCanonicalTraceability(text, errors = []) {
  const lines = normalizeLf(text).split('\n');
  const heading = lines.indexOf('## Requirement matrix');
  if (heading < 0) { errors.push('traceability: missing Requirement matrix'); return []; }
  const header = lines.findIndex((line, index) => index > heading && line.startsWith('| REQUIREMENT_ID |'));
  const dividerCells = (lines[header + 1] ?? '').split('|').slice(1, -1);
  if (header < 0 || dividerCells.length !== 9 || dividerCells.some(cell => !/^\s*:?-{3,}:?\s*$/.test(cell))) {
    errors.push('traceability: malformed requirement table header');
    return [];
  }
  const rows = [];
  for (let index = header + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith('|')) break;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length !== 9) { errors.push(`traceability:${index + 1}: ambiguous canonical traceability row`); continue; }
    if (!/^OC-[A-Z0-9-]+$/.test(cells[0])) { errors.push(`traceability:${index + 1}: malformed requirement ID`); continue; }
    rows.push({
      requirement_id: cells[0],
      normative_anchor_cell: cells[1],
      phase_owner: cells[2],
      disposition: cells[3],
      implementation_cell: cells[4],
      evidence_cell: cells[5],
      environment_cell: cells[6],
      checkpoint_cell: cells[7],
      residual_cell: cells[8],
      line: index + 1
    });
  }
  return rows;
}

function parseNormativeSources(cell, label, errors) {
  const sources = [];
  for (const token of cell.split(';').map(value => value.trim()).filter(Boolean)) {
    const match = token.match(/^([^:]+\.md)::(.+)$/);
    if (!match) { errors.push(`${label}: ambiguous normative source token: ${token}`); continue; }
    sources.push({ path: match[1], anchor: match[2] });
  }
  return sources;
}

function anchorMatches(document, anchor) {
  if (anchor.startsWith('§') || /^\d+(?:\.\d+)+$/.test(anchor)) {
    const token = anchor.startsWith('§') ? anchor.slice(1) : anchor;
    return document.headings.filter(heading => new RegExp(`(^|[^A-Za-z0-9.])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9.]|$)`).test(heading.text));
  }
  return document.headings.filter(heading => heading.anchor === anchor);
}

function validateManifest(recorded, actual, errors) {
  if (!recorded) return;
  if (recorded.scope_id !== actual.scope_id || recorded.discovery_rule !== actual.discovery_rule) errors.push('manifest: discovery contract drift');
  const paths = recorded.documents.map(document => document.path);
  for (const duplicate of duplicateValues(paths)) errors.push(`manifest: duplicate path ${duplicate}`);
  if (stable(paths) !== stable([...paths].sort())) errors.push('manifest: non-deterministic path ordering');
  const actualByPath = new Map(actual.documents.map(document => [document.path, document]));
  for (const document of recorded.documents) {
    validateRootRelative(document.path, `manifest:${document.path}`, errors);
    const current = actualByPath.get(document.path);
    if (!current) { errors.push(`manifest: unexpected governed path entry ${document.path}`); continue; }
    for (const key of ['git_object_id', 'sha256', 'line_count', 'byte_count', 'generated_status']) {
      if (document[key] !== current[key]) errors.push(`manifest:${document.path}: stale ${key}`);
    }
    if (stable(document.outbound_references) !== stable(current.outbound_references)) errors.push(`manifest:${document.path}: stale outbound references`);
    if (stable(document.inbound_references) !== stable(current.inbound_references)) errors.push(`manifest:${document.path}: stale inbound references`);
    if (stable(document.headings) !== stable(current.headings)) errors.push(`manifest:${document.path}: stale heading inventory`);
    actualByPath.delete(document.path);
  }
  for (const missing of actualByPath.keys()) errors.push(`manifest: missing governed path ${missing}`);
}

function validateCatalog(catalog, manifest, reader, errors) {
  if (!catalog || !manifest) return { validReferences: 0, unresolvedReferences: 0 };
  if (catalog.mode !== 'NON_CANONICAL_SHADOW' || catalog.authority !== 'CURRENT_CANONICAL_OWNERS_UNCHANGED') errors.push('catalog: shadow authority boundary invalid');
  const ids = catalog.artifacts.map(entry => entry.artifact_id);
  const paths = catalog.artifacts.map(entry => entry.path);
  for (const duplicate of duplicateValues(ids)) errors.push(`catalog: duplicate artifact ID ${duplicate}`);
  for (const duplicate of duplicateValues(paths)) errors.push(`catalog: duplicate path ${duplicate}`);
  const manifestByPath = new Map(manifest.documents.map(document => [document.path, document]));
  const catalogByPath = new Map(catalog.artifacts.map(entry => [entry.path, entry]));
  for (const document of manifest.documents) {
    const entry = catalogByPath.get(document.path);
    if (!entry) { errors.push(`catalog: governed document missing from catalog: ${document.path}`); continue; }
    if (entry.review_status !== 'REVIEWED' || /UNREVIEWED|ambiguous/i.test(`${entry.classification} ${entry.disposition} ${entry.review_basis}`)) errors.push(`catalog:${entry.path}: UNREVIEWED or ambiguous entry`);
    if (entry.content_hash !== document.sha256 || entry.line_count !== document.line_count || entry.byte_count !== document.byte_count) errors.push(`catalog:${entry.path}: stale content metadata`);
    if (entry.inbound_references !== document.inbound_references.length || entry.outbound_references !== document.outbound_references.length) errors.push(`catalog:${entry.path}: stale reference counts`);
    if (entry.generated_status !== document.generated_status) errors.push(`catalog:${entry.path}: generated/manual mismatch`);
    validateRootRelative(entry.owner, `catalog:${entry.path}:owner`, errors);
    validateRootRelative(entry.survival_destination, `catalog:${entry.path}:survival`, errors);
    if (!reader.exists(entry.owner)) errors.push(`catalog:${entry.path}: invalid owner path ${entry.owner}`);
    if (!reader.exists(entry.survival_destination)) errors.push(`catalog:${entry.path}: invalid survival destination ${entry.survival_destination}`);
    if (entry.compatibility_pointer !== null) {
      validateRootRelative(entry.compatibility_pointer, `catalog:${entry.path}:compatibility`, errors);
      if (!reader.exists(entry.compatibility_pointer)) errors.push(`catalog:${entry.path}: reference to an untracked replacement`);
    }
    if (entry.generated_status === 'GENERATED' && ['NORMATIVE', 'STATE_OWNER', 'CLASSIFICATION_OWNER'].includes(entry.authority)) errors.push(`catalog:${entry.path}: generated view presented as an independent normative owner`);
  }
  for (const entry of catalog.artifacts) if (!manifestByPath.has(entry.path)) errors.push(`catalog: extra catalog entry ${entry.path}`);
  const debts = catalog.known_broken_references ?? [];
  for (const duplicate of duplicateValues(debts.map(debt => debt.debt_id))) errors.push(`catalog: duplicate stable reference ID ${duplicate}`);
  for (const debt of debts) {
    for (const key of ['debt_id', 'source_path', 'source_line', 'target', 'status', 'owner', 'reason', 'future_resolution_unit']) {
      if (debt[key] === undefined || debt[key] === '') errors.push(`catalog: broken-reference debt missing ${key}`);
    }
  }
  const known = new Set(debts.map(debt => `${debt.source_path}:${debt.source_line}->${debt.target}`));
  if (!known.has('docs/HANDOFF.md:146->docs/RETOMAR.md')) errors.push('catalog: explicit known-broken-reference disposition removed');
  const allFiles = new Set(reader.listFiles());
  const governedByPath = new Map(manifest.documents.map(document => [document.path, document]));
  let validReferences = 0;
  let unresolvedReferences = 0;
  for (const source of manifest.documents) {
    const sourceEntry = catalogByPath.get(source.path);
    const validateAll = !['HISTORY_ONLY'].includes(sourceEntry?.authority) && sourceEntry?.classification !== 'LEGACY';
    for (const reference of source.outbound_references) {
      const key = `${source.path}:${reference.source_line}->${reference.target_path}`;
      if (!validateAll && key !== 'docs/HANDOFF.md:146->docs/RETOMAR.md') continue;
      if (reference.raw.includes('..')) errors.push(`reference:${key}: path traversal`);
      if (/`?[A-Za-z]:[\\/]/.test(reference.raw) || /\]\(\/[^)]/.test(reference.raw)) errors.push(`reference:${key}: absolute path where root-relative required`);
      const validRange = typeof reference.line_suffix === 'string' && /^\d+-\d+$/.test(reference.line_suffix);
      if (reference.line_suffix !== null && !Number.isInteger(reference.line_suffix) && !validRange) errors.push(`reference:${key}: malformed line suffix`);
      if (!allFiles.has(reference.target_path)) {
        if (!known.has(key)) { errors.push(`reference:${key}: missing target`); unresolvedReferences += 1; }
        continue;
      }
      const target = governedByPath.get(reference.target_path);
      if (reference.anchor && target) {
        const matches = anchorMatches(target, reference.anchor);
        if (matches.length === 0) errors.push(`reference:${key}: missing anchor ${reference.anchor}`);
        if (matches.length > 1) errors.push(`reference:${key}: ambiguous duplicate anchor ${reference.anchor}`);
      }
      if (reference.line_suffix && target) {
        const [start, end = start] = String(reference.line_suffix).split('-').map(Number);
        if (start < 1 || end < start || end > target.line_count) errors.push(`reference:${key}: malformed line suffix`);
      }
      validReferences += 1;
    }
  }
  return { validReferences, unresolvedReferences };
}

function validateTraceability(structured, reader, actualManifest, errors) {
  if (!structured) return;
  const canonicalText = reader.readText('docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md');
  const rows = parseCanonicalTraceability(canonicalText, errors);
  const canonicalIds = rows.map(row => row.requirement_id);
  const structuredIds = structured.requirements.map(row => row.requirement_id);
  for (const duplicate of duplicateValues(canonicalIds)) errors.push(`traceability: duplicate canonical requirement ID ${duplicate}`);
  for (const duplicate of duplicateValues(structuredIds)) errors.push(`traceability: duplicate requirement ID ${duplicate}`);
  for (const id of canonicalIds) if (!structuredIds.includes(id)) errors.push(`traceability: missing structured requirement ${id}`);
  for (const id of structuredIds) if (!canonicalIds.includes(id)) errors.push(`traceability: extra structured requirement ${id}`);
  if (stable(structuredIds) !== stable(canonicalIds)) errors.push('traceability: requirement ordering differs from canonical source order');
  const documents = new Map(actualManifest.documents.map(document => [document.path, document]));
  const structuredById = new Map(structured.requirements.map(row => [row.requirement_id, row]));
  for (const row of rows) {
    const entry = structuredById.get(row.requirement_id);
    if (!entry) continue;
    if (!ALLOWED_DISPOSITIONS.has(row.disposition)) errors.push(`traceability:${row.requirement_id}: unknown canonical disposition`);
    if (entry.disposition !== row.disposition) errors.push(`traceability:${row.requirement_id}: changed canonical traceability disposition`);
    if (entry.phase_owner !== row.phase_owner) errors.push(`traceability:${row.requirement_id}: phase owner drift`);
    if (entry.source_location !== `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md:${row.line}`) errors.push(`traceability:${row.requirement_id}: source location drift`);
    if (entry.review_status !== 'REVIEWED') errors.push(`traceability:${row.requirement_id}: UNREVIEWED`);
    const canonicalSources = parseNormativeSources(row.normative_anchor_cell, row.requirement_id, errors);
    if (stable(entry.normative_sources) !== stable(canonicalSources)) errors.push(`traceability:${row.requirement_id}: normative source set drift`);
    for (const source of entry.normative_sources) {
      validateRootRelative(source.path, `traceability:${row.requirement_id}:normative`, errors);
      const document = documents.get(source.path);
      if (!document) { errors.push(`traceability:${row.requirement_id}: invalid normative source ${source.path}`); continue; }
      const matches = anchorMatches(document, source.anchor);
      if (matches.length === 0) errors.push(`traceability:${row.requirement_id}: invalid requirement anchor ${source.anchor}`);
      if (matches.length > 1) errors.push(`traceability:${row.requirement_id}: ambiguous requirement anchor ${source.anchor}`);
    }
    for (const pointer of entry.evidence_pointers) {
      const pointerPath = pointer.replace(/:\d+$/, '');
      validateRootRelative(pointerPath, `traceability:${row.requirement_id}:evidence`, errors);
      if (!reader.exists(pointerPath)) errors.push(`traceability:${row.requirement_id}: invalid evidence pointer ${pointer}`);
    }
  }
}

function validateGenerated(reader, catalog, traceability, errors) {
  if (!catalog || !traceability) return;
  const expected = renderViews(catalog, traceability);
  for (const [relativePath, rendered] of [[INDEX_VIEW, expected.documentationIndex], [TRACE_VIEW, expected.traceability]]) {
    if (!reader.exists(relativePath)) { errors.push(`generated: missing ${relativePath}`); continue; }
    const actual = reader.readText(relativePath);
    if (!actual.includes(MARKER)) errors.push(`generated:${relativePath}: non-canonical marker missing`);
    if (actual !== rendered) errors.push(`generated:${relativePath}: drift`);
  }
  const second = renderViews(JSON.parse(JSON.stringify(catalog)), JSON.parse(JSON.stringify(traceability)));
  if (stable(expected) !== stable(second)) errors.push('generated: non-deterministic render');
}

export function validateWithReader(reader) {
  const errors = [];
  const recordedManifest = parseJson(reader, MANIFEST, errors);
  const catalog = parseJson(reader, CATALOG, errors);
  const traceability = parseJson(reader, TRACE, errors);
  const actualManifest = buildDocumentManifest(reader);
  const catalogSchema = parseJson(reader, 'docs/governance/schemas/document-catalog.schema.json', errors);
  const traceSchema = parseJson(reader, 'docs/governance/schemas/purchase-order-phase-c-traceability.schema.json', errors);
  if (catalog && catalogSchema) errors.push(...validateSchema(catalog, catalogSchema, 'catalog-schema'));
  if (traceability && traceSchema) errors.push(...validateSchema(traceability, traceSchema, 'traceability-schema'));
  validateManifest(recordedManifest, actualManifest, errors);
  const referenceResults = validateCatalog(catalog, actualManifest, reader, errors);
  validateTraceability(traceability, reader, actualManifest, errors);
  validateGenerated(reader, catalog, traceability, errors);
  const results = {
    governed_documents: actualManifest.documents.length,
    catalog_entries: catalog?.artifacts?.length ?? 0,
    unreviewed_entries: catalog?.artifacts?.filter(entry => entry.review_status !== 'REVIEWED').length ?? 0,
    outbound_references: actualManifest.documents.reduce((sum, document) => sum + document.outbound_references.length, 0),
    inbound_references: actualManifest.documents.reduce((sum, document) => sum + document.inbound_references.length, 0),
    deferred_known_broken: catalog?.known_broken_references?.length ?? 0,
    valid_references: referenceResults.validReferences,
    unresolved_references: referenceResults.unresolvedReferences,
    requirements: traceability?.requirements?.length ?? 0,
    errors: errors.length
  };
  return { errors, results };
}

export function validateRepository(root = REPO_ROOT, commit = null) {
  return validateWithReader(commit ? commitReader(root, commit) : worktreeReader(root));
}

function main() {
  const rootIndex = process.argv.indexOf('--root');
  const commitIndex = process.argv.indexOf('--commit');
  const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
  const commit = commitIndex >= 0 ? process.argv[commitIndex + 1] : null;
  try {
    if (commitIndex >= 0 && !commit) throw new Error('--commit requires a SHA');
    const { errors, results } = validateRepository(root, commit);
    console.log(`DOCUMENTATION_SHADOW_RESULTS: ${JSON.stringify(results)}`);
    if (errors.length) {
      for (const error of errors) console.error(error);
      console.error('DOCUMENTATION_SHADOW_VALIDATION: FAIL');
      process.exitCode = 1;
    } else {
      console.log('DOCUMENTATION_SHADOW_VALIDATION: PASS');
    }
  } catch (error) {
    console.error(error.message);
    console.error('DOCUMENTATION_SHADOW_VALIDATION: FAIL');
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
