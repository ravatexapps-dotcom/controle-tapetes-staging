import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  REPO_ROOT,
  SHADOW_MARKER,
  loadState,
  renderViews,
  validateStateShape
} from './render-current-state-shadow.mjs';
import {
  buildSourceManifest,
  REQUIRED_BOOTSTRAP_KEYS
} from './build-current-state-source-manifest.mjs';

const ALLOWED_CLASSIFICATIONS = new Set([
  'STRUCTURED_FIELD',
  'NORMATIVE_OWNER_POINTER',
  'HISTORICAL_LEDGER_CONTENT',
  'DUPLICATED_CURRENT_STATE',
  'UNIQUE_CONTENT_REQUIRING_DISPOSITION'
]);
const REQUIRED_SOURCE_PATHS = [
  'CLAUDE.md',
  'docs/governance/AGENT_INSTRUCTIONS.md',
  'docs/governance/DOCUMENTATION_MODEL.md',
  'docs/governance/SUPERVISION_PROTOCOL.md',
  'PROJECT_STATE.md',
  'AGENT_HANDOFF.md',
  'docs/DOCUMENTATION_INDEX.md',
  'docs/ledgers/G28_LEDGER.md',
  'scripts/validate-spec-custody.mjs',
  'scripts/spec-custody/validation-core.mjs',
  'scripts/spec-custody/self-tests.mjs'
];

const CHECKPOINTS = {
  product: '3405fdab8e05ec0f81cbfe07c63c489e551fee92',
  clean_slate_readiness: '62bdcc75c335e3881adb1af6350de801675aa788',
  clean_slate_execution: '770772548baf04c52e9ef020ff94f8bdabf77f03'
};
const ENVIRONMENT_BOUNDARIES = {
  shared_development: 'ucrjtfswnfdlxwtmxnoo',
  production: 'gqmpsxkxynrjvidfmojk',
  forbidden_project: 'bhgifjrfagkzubpyqpew'
};

function normalizeLf(text) { return text.replace(/\r\n?/g, '\n'); }
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
function deepEqual(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function fullPath(root, relativePath) { return path.join(root, relativePath); }

function typeMatches(value, type) {
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  return typeof value === type;
}

export function validateSchemaValue(value, schema, location = '$') {
  const errors = [];
  if (schema.type && !typeMatches(value, schema.type)) errors.push(`${location}: expected type ${schema.type}`);
  if (Object.prototype.hasOwnProperty.call(schema, 'const') && !deepEqual(value, schema.const)) errors.push(`${location}: const mismatch`);
  if (schema.enum && !schema.enum.some(item => deepEqual(value, item))) errors.push(`${location}: enum mismatch`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: minLength violated`);
    if (schema.pattern !== undefined && !(new RegExp(schema.pattern)).test(value)) errors.push(`${location}: pattern mismatch`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location}: minItems violated`);
    if (schema.items) value.forEach((item, index) => errors.push(...validateSchemaValue(item, schema.items, `${location}[${index}]`)));
  }
  if (typeMatches(value, 'object')) {
    for (const required of schema.required ?? []) if (!Object.prototype.hasOwnProperty.call(value, required)) errors.push(`${location}: missing required property ${required}`);
    const properties = schema.properties ?? {};
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) errors.push(`${location}: minProperties violated`);
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push(`${location}: unknown property ${key}`);
    } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      for (const key of Object.keys(value)) if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push(...validateSchemaValue(value[key], schema.additionalProperties, `${location}.${key}`));
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) errors.push(...validateSchemaValue(value[key], childSchema, `${location}.${key}`));
    }
  }
  return errors;
}

export function parseBootstrapBlock(text) {
  const normalized = normalizeLf(text);
  const beginMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->';
  const endMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:END -->';
  const lines = normalized.split('\n');
  const beginIndexes = lines.flatMap((line, index) => line === beginMarker ? [index] : []);
  const endIndexes = lines.flatMap((line, index) => line === endMarker ? [index] : []);
  const errors = [];
  if (beginIndexes.length !== 1) errors.push(`bootstrap begin marker count ${beginIndexes.length}`);
  if (endIndexes.length !== 1) errors.push(`bootstrap end marker count ${endIndexes.length}`);
  if (errors.length) return { errors, values: {}, order: [] };
  const begin = beginIndexes[0];
  const end = endIndexes[0];
  if (end <= begin + 3 || lines[begin + 1] !== '```text' || lines[end - 1] !== '```') errors.push('bootstrap fence malformed');
  const values = {};
  const order = [];
  for (const line of lines.slice(begin + 2, end - 1)) {
    const match = line.match(/^([A-Z_]+):[ \t]+(.+)$/);
    if (!match) { errors.push(`malformed bootstrap line: ${line || '<blank>'}`); continue; }
    const [, key, value] = match;
    if (!REQUIRED_BOOTSTRAP_KEYS.includes(key)) errors.push(`unknown bootstrap key: ${key}`);
    if (Object.prototype.hasOwnProperty.call(values, key)) errors.push(`duplicate bootstrap key: ${key}`);
    values[key] = value;
    order.push(key);
  }
  for (const key of REQUIRED_BOOTSTRAP_KEYS) if (!Object.prototype.hasOwnProperty.call(values, key)) errors.push(`missing bootstrap key: ${key}`);
  if (!deepEqual(order, REQUIRED_BOOTSTRAP_KEYS)) errors.push('bootstrap key order mismatch');
  return { errors, values, order };
}

function flattenManifestUnits(manifest) {
  return manifest.sources.flatMap(source => source.units.map(unit => ({ ...unit, source_path: source.source_path })));
}

export function validateSourceManifest(manifest, root = REPO_ROOT) {
  const errors = [];
  let expected;
  try { expected = buildSourceManifest(root); } catch (error) { return [`source manifest rebuild failed: ${error.message}`]; }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return { errors: ['source manifest must be an object'], expected, actualUnits: [], expectedUnits: flattenManifestUnits(expected) };
  if (!deepEqual(manifest, expected)) errors.push('source manifest is stale, incomplete, or non-deterministic');
  if (manifest.schema_version !== '1.0.0') errors.push('source manifest schema_version mismatch');
  if (manifest.line_ending !== 'LF') errors.push('source manifest must declare LF normalization');
  if (!deepEqual(manifest.source_paths, ['PROJECT_STATE.md', 'AGENT_HANDOFF.md'])) errors.push('source manifest source_paths mismatch');
  const sourcePaths = new Set(manifest.sources?.map(source => source.source_path) ?? []);
  for (const sourcePath of ['PROJECT_STATE.md', 'AGENT_HANDOFF.md']) if (!sourcePaths.has(sourcePath)) errors.push(`source manifest missing source ${sourcePath}`);
  const expectedUnits = flattenManifestUnits(expected);
  const actualUnits = Array.isArray(manifest.sources) ? flattenManifestUnits(manifest) : [];
  const ids = new Set();
  for (const unit of actualUnits) {
    if (ids.has(unit.source_id)) errors.push(`duplicate source unit ID: ${unit.source_id}`);
    ids.add(unit.source_id);
    for (const key of ['source_id', 'source_path', 'heading_text', 'sha256', 'source_kind']) if (typeof unit[key] !== 'string' || unit[key].length === 0) errors.push(`source unit missing ${key}`);
    if (!Number.isInteger(unit.heading_level) || unit.heading_level < 0 || unit.heading_level > 3) errors.push(`invalid heading level: ${unit.source_id}`);
    if (!Number.isInteger(unit.start_line) || !Number.isInteger(unit.end_line) || unit.start_line < 1 || unit.end_line < unit.start_line) errors.push(`invalid line range: ${unit.source_id}`);
    if (!['BOOTSTRAP_KEY', 'MARKDOWN_SECTION', 'PREAMBLE'].includes(unit.source_kind)) errors.push(`invalid source kind: ${unit.source_id}`);
  }
  if (actualUnits.length !== expectedUnits.length) errors.push(`source unit count mismatch: expected ${expectedUnits.length}, got ${actualUnits.length}`);
  return { errors, expected, actualUnits, expectedUnits };
}

export function validateEquivalence(equivalence, root = REPO_ROOT, manifest = null) {
  const errors = [];
  const sourceManifest = manifest ?? buildSourceManifest(root);
  const expectedUnits = flattenManifestUnits(sourceManifest);
  if (!equivalence || typeof equivalence !== 'object') return ['equivalence must be an object'];
  if (Object.prototype.hasOwnProperty.call(equivalence, 'unmapped_operational_facts') || Object.prototype.hasOwnProperty.call(equivalence, 'unique_normative_handoff_rules_without_owner')) errors.push('equivalence counters are not allowed as trusted inputs');
  if (equivalence.schema_version !== '1.0.0') errors.push('equivalence schema_version mismatch');
  if (equivalence.manifest_id !== sourceManifest.manifest_id) errors.push('equivalence manifest_id mismatch');
  if (!Array.isArray(equivalence.mappings)) return [...errors, 'equivalence mappings must be an array'];
  const expectedById = new Map(expectedUnits.map(unit => [unit.source_id, unit]));
  const seen = new Set();
  for (const [index, mapping] of equivalence.mappings.entries()) {
    for (const key of ['source_id', 'source_path', 'source_sha256', 'classification', 'destination', 'structured_field_or_owner', 'semantic_status', 'notes']) {
      if (typeof mapping[key] !== 'string' || mapping[key].length === 0) errors.push(`mapping ${index} missing ${key}`);
    }
    if (seen.has(mapping.source_id)) errors.push(`duplicate mapping source ID: ${mapping.source_id}`);
    seen.add(mapping.source_id);
    if (!expectedById.has(mapping.source_id)) errors.push(`extra or nonexistent mapping source ID: ${mapping.source_id}`);
    const unit = expectedById.get(mapping.source_id);
    if (unit) {
      if (mapping.source_path !== unit.source_path) errors.push(`mapping source path mismatch: ${mapping.source_id}`);
      if (mapping.source_sha256 !== unit.sha256) errors.push(`stale mapping source hash: ${mapping.source_id}`);
    }
    if (!ALLOWED_CLASSIFICATIONS.has(mapping.classification)) errors.push(`mapping ${index} has invalid classification`);
    if (mapping.classification === 'UNIQUE_CONTENT_REQUIRING_DISPOSITION') errors.push(`unique content requires disposition: ${mapping.source_id}`);
    if (mapping.classification === 'NORMATIVE_OWNER_POINTER' && (!mapping.structured_field_or_owner || !mapping.destination)) errors.push(`ownerless normative mapping: ${mapping.source_id}`);
  }
  for (const unit of expectedUnits) if (!seen.has(unit.source_id)) errors.push(`missing mapping source ID: ${unit.source_id}`);
  if (equivalence.mappings.length !== expectedUnits.length) errors.push(`mapping count mismatch: expected ${expectedUnits.length}, got ${equivalence.mappings.length}`);
  return errors;
}

function sourceUnitText(root, unit) {
  const text = normalizeLf(fs.readFileSync(fullPath(root, unit.source_path), 'utf8'));
  const hasFinalNewline = text.endsWith('\n');
  const lines = text.split('\n');
  if (hasFinalNewline) lines.pop();
  const endExclusive = unit.end_line;
  const body = lines.slice(unit.start_line - 1, endExclusive).join('\n');
  return `${body}${endExclusive < lines.length || hasFinalNewline ? '\n' : ''}`;
}

function requireMappedSection(root, manifest, equivalence, token) {
  const candidates = flattenManifestUnits(manifest).filter(unit => unit.source_path === 'PROJECT_STATE.md' && unit.source_kind === 'MARKDOWN_SECTION' && sourceUnitText(root, unit).includes(token));
  if (candidates.length === 0) return [`canonical owner section count for ${token}: 0`];
  const shortestLength = Math.min(...candidates.map(unit => unit.end_line - unit.start_line));
  const shortest = candidates.filter(unit => unit.end_line - unit.start_line === shortestLength);
  if (shortest.length !== 1) return [`canonical owner section is ambiguous for ${token}: ${shortest.length}`];
  const mapping = equivalence.mappings.find(item => item.source_id === shortest[0].source_id);
  return mapping ? [] : [`canonical owner section is unmapped for ${token}`];
}

export function validateGeneratedText(projectText, handoffText) {
  const errors = [];
  for (const [name, text, maxLines] of [['PROJECT_STATE', projectText, 150], ['AGENT_HANDOFF', handoffText, 120]]) {
    if (typeof text !== 'string') { errors.push(`${name} generated view is not text`); continue; }
    if (!text.includes(SHADOW_MARKER)) errors.push(`${name} generated view marker missing`);
    if (!text.endsWith('\n')) errors.push(`${name} generated view must end with LF`);
    if (text.includes('\r')) errors.push(`${name} generated view must use LF only`);
    if (text.split('\n').length - 1 > maxLines) errors.push(`${name} generated view exceeds ${maxLines} lines`);
    if (/timestamp|git_status|live_git|credential/i.test(text)) errors.push(`${name} generated view contains unstable or secret content`);
  }
  return errors;
}

export function validateGeneratedFiles(root = REPO_ROOT, state = null) {
  const actualState = state ?? loadState(root);
  const projectPath = fullPath(root, 'docs/governance/shadow/generated/PROJECT_STATE.md');
  const handoffPath = fullPath(root, 'docs/governance/shadow/generated/AGENT_HANDOFF.md');
  if (!fs.existsSync(projectPath) || !fs.existsSync(handoffPath)) return ['generated shadow files are missing'];
  const projectText = fs.readFileSync(projectPath, 'utf8');
  const handoffText = fs.readFileSync(handoffPath, 'utf8');
  const errors = validateGeneratedText(projectText, handoffText);
  try {
    const expected = renderViews(actualState);
    if (projectText !== expected.project) errors.push('PROJECT_STATE generated view drifted from deterministic renderer');
    if (handoffText !== expected.handoff) errors.push('AGENT_HANDOFF generated view drifted from deterministic renderer');
    const second = renderViews(actualState);
    if (expected.project !== second.project || expected.handoff !== second.handoff) errors.push('renderer is not deterministic');
  } catch (error) { errors.push(`renderer failed: ${error.message}`); }
  return errors;
}

export function validateCanonicalReconciliation(root, state, manifest, equivalence) {
  const errors = [];
  const projectText = fs.readFileSync(fullPath(root, 'PROJECT_STATE.md'), 'utf8');
  const handoffText = fs.readFileSync(fullPath(root, 'AGENT_HANDOFF.md'), 'utf8');
  const parsed = parseBootstrapBlock(projectText);
  errors.push(...parsed.errors);
  const expected = {
    LAST_ACCEPTED_PHASE: state.last_accepted_phase,
    ACTIVE_PHASE: state.active_phase.id,
    ACTIVE_PHASE_CONTRACT: state.active_phase.contract,
    ACTIVE_TRACK: state.active_track,
    NEXT_AUTHORIZABLE_ACTION: state.next_authorizable_action.canonical_value,
    GOVERNING_SPEC: state.governing_pointers.governing_spec,
    TECHNICAL_CONTRACT: state.governing_pointers.technical_contract,
    SEQUENCE_AUTHORITY: state.governing_pointers.sequence_authority,
    TRACEABILITY: state.governing_pointers.traceability,
    LEDGER: state.governing_pointers.ledger,
    HANDOFF: state.governing_pointers.handoff,
    ACCEPTED_CHECKPOINT: state.accepted_checkpoints.product
  };
  for (const key of REQUIRED_BOOTSTRAP_KEYS) if (parsed.values[key] !== expected[key]) errors.push(`bootstrap value mismatch: ${key}`);
  for (const text of ['GOVERNANCE-EFFICIENCY-REFOUNDATION', 'GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-HARDENING-R1']) if (!handoffText.includes(text)) errors.push(`AGENT_HANDOFF missing current action text: ${text}`);
  const contractPath = fullPath(root, state.active_phase.contract);
  if (!fs.existsSync(contractPath)) errors.push('active phase contract is missing');
  else {
    const contract = normalizeLf(fs.readFileSync(contractPath, 'utf8'));
    const marker = '<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->\nPHASE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION\n<!-- MATERIAL_PHASE_CONTRACT:END -->';
    if (!contract.includes(marker)) errors.push('active phase contract material marker mismatch');
  }
  for (const [name, pointer] of Object.entries(state.governing_pointers)) if (!fs.existsSync(fullPath(root, pointer))) errors.push(`governing pointer missing (${name}): ${pointer}`);
  for (const relativePath of REQUIRED_SOURCE_PATHS) if (!fs.existsSync(fullPath(root, relativePath))) errors.push(`mandatory reconciliation source missing: ${relativePath}`);
  for (const [key, value] of Object.entries(CHECKPOINTS)) errors.push(...requireMappedSection(root, manifest, equivalence, value).map(error => `${key}: ${error}`));
  for (const [key, value] of Object.entries(ENVIRONMENT_BOUNDARIES)) errors.push(...requireMappedSection(root, manifest, equivalence, value).map(error => `${key}: ${error}`));
  return errors;
}

export function validateRepository(root = REPO_ROOT) {
  const errors = [];
  let state;
  let schema;
  let manifest;
  let manifestResult;
  let equivalence;
  try { state = loadState(root); } catch (error) { return [`cannot load state: ${error.message}`]; }
  try { schema = readJson(fullPath(root, 'docs/governance/schemas/current-state.schema.json')); } catch (error) { errors.push(`cannot load schema: ${error.message}`); }
  if (schema) errors.push(...validateSchemaValue(state, schema));
  errors.push(...validateStateShape(state));
  try { manifest = readJson(fullPath(root, 'docs/governance/shadow/current-state-source-manifest.json')); } catch (error) { errors.push(`cannot load source manifest: ${error.message}`); }
  if (manifest) {
    manifestResult = validateSourceManifest(manifest, root);
    if (Array.isArray(manifestResult)) errors.push(...manifestResult);
    else errors.push(...manifestResult.errors);
  }
  try { equivalence = readJson(fullPath(root, 'docs/governance/shadow/current-state-equivalence.json')); } catch (error) { errors.push(`cannot load equivalence: ${error.message}`); }
  if (equivalence && manifest) errors.push(...validateEquivalence(equivalence, root, manifestResult?.expected ?? manifest));
  if (manifest && equivalence) errors.push(...validateCanonicalReconciliation(root, state, manifestResult?.expected ?? manifest, equivalence));
  if (!errors.length) errors.push(...validateGeneratedFiles(root, state));
  return errors;
}

function main() {
  const rootIndex = process.argv.indexOf('--root');
  const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
  const errors = validateRepository(root);
  if (errors.length) { for (const error of errors) console.error(error); process.exitCode = 1; }
  else console.log('CURRENT_STATE_SHADOW_VALIDATION: PASS');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
