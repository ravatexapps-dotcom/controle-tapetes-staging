import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { commitReader, worktreeReader } from './git-content-reader.mjs';
import {
  COMPATIBILITY_BEGIN,
  COMPATIBILITY_END,
  COMPATIBILITY_PATH,
  INDEX_PATH,
  MAX_BYTES,
  MAX_LINES,
  PARTITION_DIR,
  PARTITION_FILE_RE,
  PAYLOAD_BEGIN,
  PAYLOAD_END,
  REPO_ROOT,
  SOURCE_MANIFEST_PATH,
  SOURCE_PATH,
  assertAppendStable,
  buildInboundMappings,
  buildPartitionIndex,
  buildSourceManifest,
  deriveSourceUnits,
  markdownHeadings,
  partitionUnits,
  payloadForPartition
} from './build-g28-ledger-partitions.mjs';

const CATALOG_PATH = 'docs/governance/catalog/document-source-manifest.json';
const DOCUMENT_CATALOG_PATH = 'docs/governance/catalog/documents.json';
const SOURCE_SCHEMA_PATH = 'docs/governance/schemas/g28-ledger-source-manifest.schema.json';
const INDEX_SCHEMA_PATH = 'docs/governance/schemas/g28-ledger-partition-index.schema.json';
const REQUIRED = [
  SOURCE_PATH, SOURCE_SCHEMA_PATH, INDEX_SCHEMA_PATH, SOURCE_MANIFEST_PATH,
  INDEX_PATH, COMPATIBILITY_PATH, CATALOG_PATH, DOCUMENT_CATALOG_PATH
];

function stable(value) { return JSON.stringify(value); }
function readBytes(reader, relativePath) { return Buffer.from(reader.readText(relativePath), 'utf8'); }
function parse(reader, relativePath, errors) {
  try { return JSON.parse(reader.readText(relativePath)); }
  catch (error) { errors.push(`${relativePath}: invalid JSON (${error.message})`); return null; }
}
function countToken(bytes, token) { let count = 0; let offset = 0; const needle = Buffer.from(token, 'utf8'); while ((offset = bytes.indexOf(needle, offset)) >= 0) { count += 1; offset += needle.length; } return count; }
function extractPayload(bytes, beginToken, endToken, label) {
  const begin = Buffer.from(`${beginToken}\n`, 'utf8');
  const end = Buffer.from(`\n${endToken}\n`, 'utf8');
  if (countToken(bytes, beginToken) !== 1 || countToken(bytes, endToken) !== 1) throw new Error(`${label}: invalid payload delimiter`);
  const start = bytes.indexOf(begin);
  const finish = bytes.indexOf(end, start + begin.length);
  if (finish < 0) throw new Error(`${label}: payload end delimiter is missing`);
  return bytes.subarray(start + begin.length, finish);
}
function schemaBasics(value, name, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) errors.push(`${name}: root must be an object`);
  for (const key of ['schema_version', 'authority']) if (!value?.[key]) errors.push(`${name}: missing ${key}`);
}
function errorText(error) { return error instanceof Error ? error.message : String(error); }

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  return typeof value === type;
}

function resolveLocalRef(rootSchema, reference) {
  if (!reference.startsWith('#/')) throw new Error(`unresolved local $ref: ${reference}`);
  let current = rootSchema;
  for (const token of reference.slice(2).split('/').map(value => value.replace(/~1/gu, '/').replace(/~0/gu, '~'))) {
    if (!current || typeof current !== 'object' || !(token in current)) throw new Error(`unresolved local $ref: ${reference}`);
    current = current[token];
  }
  return current;
}

function validateSchemaReferences(schema, rootSchema, location, errors) {
  if (Array.isArray(schema)) {
    schema.forEach((item, index) => validateSchemaReferences(item, rootSchema, `${location}[${index}]`, errors));
    return;
  }
  if (!schema || typeof schema !== 'object') return;
  if (Object.hasOwn(schema, '$ref')) {
    if (typeof schema.$ref !== 'string') errors.push(`${location}.$ref: invalid local $ref`);
    else {
      try { resolveLocalRef(rootSchema, schema.$ref); }
      catch (error) { errors.push(`${location}.$ref: ${errorText(error)}`); }
    }
  }
  for (const [key, value] of Object.entries(schema)) {
    if (key !== '$ref') validateSchemaReferences(value, rootSchema, `${location}.${key}`, errors);
  }
}

function validateJsonSchema(value, schema, rootSchema, location, errors) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    errors.push(`${location}: invalid schema node`);
    return;
  }
  if (schema.$ref) {
    try { validateJsonSchema(value, resolveLocalRef(rootSchema, schema.$ref), rootSchema, location, errors); }
    catch (error) { errors.push(`${location}: ${errorText(error)}`); }
    return;
  }
  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (allowedTypes.length && !allowedTypes.some(type => matchesType(value, type))) {
    errors.push(`${location}: type violation; expected ${allowedTypes.join('|')}`);
    return;
  }
  if (Object.hasOwn(schema, 'const') && stable(value) !== stable(schema.const)) errors.push(`${location}: const violation`);
  if (schema.enum && !schema.enum.some(candidate => stable(candidate) === stable(value))) errors.push(`${location}: enum violation`);
  if (typeof value === 'string' && schema.pattern) {
    try { if (!new RegExp(schema.pattern, 'u').test(value)) errors.push(`${location}: pattern violation`); }
    catch (error) { errors.push(`${location}: invalid schema pattern (${errorText(error)})`); }
  }
  if (typeof value === 'string' && schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: minLength violation`);
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) errors.push(`${location}: minimum violation`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location}: minItems violation`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${location}: maxItems violation`);
    if (schema.items) value.forEach((item, index) => validateJsonSchema(item, schema.items, rootSchema, `${location}[${index}]`, errors));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) errors.push(`${location}: missing required property ${key}`);
    const properties = schema.properties ?? {};
    for (const [key, item] of Object.entries(value)) {
      if (properties[key]) validateJsonSchema(item, properties[key], rootSchema, `${location}.${key}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${location}: unknown property ${key}`);
    }
  }
}

function validateSource(reader, sourceBytes, recorded, errors) {
  if (!recorded) return null;
  schemaBasics(recorded, SOURCE_MANIFEST_PATH, errors);
  const actual = deriveSourceUnits(sourceBytes);
  const expected = buildSourceManifest(sourceBytes, reader.objectId(SOURCE_PATH));
  if (sourceBytes.includes(Buffer.from(PAYLOAD_BEGIN, 'utf8')) || sourceBytes.includes(Buffer.from(PAYLOAD_END, 'utf8'))
      || sourceBytes.includes(Buffer.from(COMPATIBILITY_BEGIN, 'utf8')) || sourceBytes.includes(Buffer.from(COMPATIBILITY_END, 'utf8'))) {
    errors.push('delimiter collision with source content');
  }
  if (recorded.canonical_source_sha256 !== expected.canonical_source_sha256) errors.push('canonical ledger source hash drift');
  if (recorded.canonical_source_git_object !== expected.canonical_source_git_object) errors.push('canonical ledger Git object drift');
  if (recorded.canonical_byte_count !== expected.canonical_byte_count) errors.push('canonical ledger byte count drift');
  if (recorded.canonical_line_count !== expected.canonical_line_count) errors.push('canonical ledger line count drift');
  const units = recorded.units ?? [];
  const ids = units.map(unit => unit.unit_id);
  if (new Set(ids).size !== ids.length) errors.push('duplicate source-unit ID');
  if (stable(recorded.units) !== stable(expected.units)) errors.push('source manifest drift: source-unit ranges, hashes, order, or headings');
  let previousEnd = 0; let previousLine = 1;
  for (const unit of units) {
    if (unit.start_byte !== previousEnd || unit.start_byte >= unit.end_byte) errors.push('overlapping or uncovered source-unit ranges');
    if (unit.start_line !== previousLine || unit.start_line > unit.end_line) errors.push('overlapping or uncovered source-line ranges');
    previousEnd = unit.end_byte; previousLine = unit.end_line + 1;
  }
  if (previousEnd !== sourceBytes.length) errors.push('uncovered source range');
  if (previousLine !== actual.lines.length + 1) errors.push('source-line coverage is incomplete');
  if (recorded.coverage?.uncovered_bytes !== 0) errors.push('manifest reports uncovered bytes');
  if (recorded.coverage?.overlapping_ranges !== 0) errors.push('manifest reports overlapping ranges');
  if (actual.units.filter(unit => unit.unit_kind === 'ENTRY' && !unit.date).length !== recorded.heading_exceptions?.length) errors.push('malformed or exceptional entry manifest drift');
  return { actual, expected, recorded };
}

function validateIndexIdentity(index, sourceBytes, source, expectedIndex, errors) {
  const actualSha256 = cryptoSha(sourceBytes);
  const checks = [
    [index.canonical_source_git_object,
      [source.recorded.canonical_source_git_object, source.expected.canonical_source_git_object, expectedIndex.canonical_source_git_object],
      'partition index canonical source Git object identity drift'],
    [index.canonical_source_sha256,
      [source.recorded.canonical_source_sha256, source.expected.canonical_source_sha256, expectedIndex.canonical_source_sha256, actualSha256],
      'partition index canonical source SHA-256 identity drift'],
    [index.canonical_byte_count,
      [source.recorded.canonical_byte_count, source.expected.canonical_byte_count, expectedIndex.canonical_byte_count, sourceBytes.length],
      'partition index canonical byte count identity drift'],
    [index.canonical_line_count,
      [source.recorded.canonical_line_count, source.expected.canonical_line_count, expectedIndex.canonical_line_count, source.actual.lines.length],
      'partition index canonical line count identity drift']
  ];
  for (const [recorded, expectedValues, message] of checks) {
    if (expectedValues.some(expected => recorded !== expected)) errors.push(message);
  }
}

function validatePartitionFiles(reader, sourceBytes, source, index, errors) {
  if (!index) return null;
  const expectedPartitions = partitionUnits(source.expected.units);
  const expectedIndex = buildPartitionIndex(
    sourceBytes,
    source.expected,
    expectedPartitions,
    buildInboundMappings(parse(reader, CATALOG_PATH, errors) ?? {}, source.expected, expectedPartitions, markdownHeadings(source.actual.lines))
  );
  validateIndexIdentity(index, sourceBytes, source, expectedIndex, errors);
  const files = reader.listFiles().filter(relativePath => relativePath.startsWith(`${PARTITION_DIR}/`));
  const expectedFiles = expectedPartitions.map(partition => `${PARTITION_DIR}/${partition.file_name}`);
  const unexpected = files.filter(file => !expectedFiles.includes(file));
  const missing = expectedFiles.filter(file => !files.includes(file));
  if (unexpected.length) errors.push(`extra partition: ${unexpected.join(', ')}`);
  if (missing.length) errors.push(`missing partition: ${missing.join(', ')}`);
  if ((index.partitions ?? []).length !== expectedPartitions.length) errors.push('partition count drift');
  if (stable(index.thresholds) !== stable(expectedIndex.thresholds)) errors.push('partition thresholds drift');
  if (stable(index.source_units) !== stable(expectedIndex.source_units)) errors.push('source units in partition index drift');
  if (stable(index.partitions) !== stable(expectedIndex.partitions)) errors.push('partition ordering, ranges, thresholds, or payload hashes drift');
  if (stable(index.unit_to_partition) !== stable(expectedIndex.unit_to_partition)) errors.push('unit-to-partition mapping drift');
  const expectedMappings = expectedIndex.inbound_reference_survival_mappings;
  const actualMappings = index.inbound_reference_survival_mappings ?? [];
  const key = mapping => stable([mapping.source_document, mapping.source_line, mapping.reference_kind, mapping.original_target, mapping.anchor, mapping.line_suffix]);
  if (new Set(actualMappings.map(key)).size !== actualMappings.length) errors.push('duplicate inbound survival mapping');
  if (actualMappings.length < expectedMappings.length) errors.push('inbound ledger reference missing from survival mapping');
  if (actualMappings.length > expectedMappings.length) errors.push('extra unused survival mapping');
  if (stable(actualMappings) !== stable(expectedMappings)) errors.push('inbound reference survival mapping drift');
  if (stable(index) !== stable(expectedIndex)) errors.push('partition index full parity drift');
  if (index.authority !== 'NON-CANONICAL_SHADOW; CANONICAL_LEDGER_AUTHORITY_UNCHANGED') errors.push('partition index declares canonical authority');
  const actualPartitionById = new Map((index.partitions ?? []).map(partition => [partition.partition_id, partition]));
  for (const partition of expectedPartitions) {
    const pathName = `${PARTITION_DIR}/${partition.file_name}`;
    if (!reader.exists(pathName)) continue;
    let payload;
    try { payload = extractPayload(readBytes(reader, pathName), PAYLOAD_BEGIN, PAYLOAD_END, pathName); }
    catch (error) { errors.push(errorText(error)); continue; }
    const expectedPayload = payloadForPartition(sourceBytes, partition);
    if (!payload.equals(expectedPayload)) errors.push(`altered partition payload: ${partition.file_name}`);
    if (actualPartitionById.get(partition.partition_id)?.payload_sha256 !== cryptoSha(payload)) errors.push(`stale partition payload hash: ${partition.file_name}`);
    const wrapper = reader.readText(pathName).split(PAYLOAD_BEGIN, 1)[0];
    if (!wrapper.includes('GENERATED NON-CANONICAL SHADOW LEDGER PARTITION')) errors.push(`partition marker missing: ${partition.file_name}`);
    if (wrapper.includes('NORMATIVE')) errors.push(`generated partition declared normative: ${partition.file_name}`);
  }
  return { expectedPartitions, expectedIndex };
}

function cryptoSha(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

function validateCompatibility(reader, sourceBytes, index, expectedIndex, errors) {
  if (!reader.exists(COMPATIBILITY_PATH)) return;
  let payload;
  try { payload = extractPayload(readBytes(reader, COMPATIBILITY_PATH), COMPATIBILITY_BEGIN, COMPATIBILITY_END, COMPATIBILITY_PATH); }
  catch (error) { errors.push(errorText(error)); return; }
  if (!reader.readText(COMPATIBILITY_PATH).includes('reconstruction: ORDERED_PARTITION_PAYLOADS')) errors.push('compatibility view reconstructed independently rather than from partition payloads');
  const parts = (index?.partitions ?? []).map(partition => {
    const file = `${PARTITION_DIR}/${partition.file_name}`;
    try { return extractPayload(readBytes(reader, file), PAYLOAD_BEGIN, PAYLOAD_END, file); }
    catch { return Buffer.alloc(0); }
  });
  const reassembled = Buffer.concat(parts);
  const canonicalSha256 = cryptoSha(sourceBytes);
  const payloadSha256 = cryptoSha(payload);
  const reassemblySha256 = cryptoSha(reassembled);
  const recordedPayloadSha256 = index?.compatibility_view?.payload_sha256;
  if (!payload.equals(reassembled)) errors.push('compatibility payload differs from ordered partition payloads');
  if (!payload.equals(sourceBytes)) errors.push('compatibility payload differing from canonical source');
  if (index?.compatibility_view?.reconstructed_from !== 'ORDERED_PARTITION_PAYLOADS') errors.push('compatibility view reconstruction provenance drift');
  if ([canonicalSha256, payloadSha256, reassemblySha256, expectedIndex?.compatibility_view?.payload_sha256]
    .some(expected => recordedPayloadSha256 !== expected)) errors.push('partition index compatibility payload SHA-256 identity drift');
  if ([reassemblySha256, expectedIndex?.complete_reassembly_sha256]
    .some(expected => index?.complete_reassembly_sha256 !== expected)) errors.push('partition index complete reassembly SHA-256 identity drift');
}

function validateCatalogIntegration(reader, index, errors) {
  const catalog = parse(reader, DOCUMENT_CATALOG_PATH, errors);
  if (!catalog || !index) return;
  const paths = [COMPATIBILITY_PATH, ...(index.partitions ?? []).map(partition => `${PARTITION_DIR}/${partition.file_name}`)];
  for (const relativePath of paths) {
    const entry = catalog.artifacts?.find(artifact => artifact.path === relativePath);
    if (!entry) { errors.push(`generated artifact added without explicit catalog review: ${relativePath}`); continue; }
    if (entry.classification !== 'DERIVED' || entry.authority !== 'DERIVED' || entry.generated_status !== 'GENERATED'
        || entry.role !== 'derived' || entry.status !== 'GENERATED' || entry.disposition !== 'DELETE_ONLY_IF_REGENERABLE_DERIVED_ARTIFACT'
        || entry.owner !== SOURCE_PATH || entry.review_status !== 'REVIEWED') errors.push(`generated artifact catalog classification drift: ${relativePath}`);
    if (!/Unit 3 explicit review/u.test(entry.review_basis ?? '')) errors.push(`generated artifact lacks explicit catalog review basis: ${relativePath}`);
  }
}

export function validateWithReader(reader) {
  const errors = [];
  for (const relativePath of REQUIRED) if (!reader.exists(relativePath)) errors.push(`missing required ledger shadow artifact: ${relativePath}`);
  if (errors.length) return { errors, results: { errors: errors.length } };
  const sourceBytes = readBytes(reader, SOURCE_PATH);
  const sourceSchema = parse(reader, SOURCE_SCHEMA_PATH, errors);
  const indexSchema = parse(reader, INDEX_SCHEMA_PATH, errors);
  const sourceManifest = parse(reader, SOURCE_MANIFEST_PATH, errors);
  const index = parse(reader, INDEX_PATH, errors);
  if (sourceSchema) validateSchemaReferences(sourceSchema, sourceSchema, SOURCE_SCHEMA_PATH, errors);
  if (indexSchema) validateSchemaReferences(indexSchema, indexSchema, INDEX_SCHEMA_PATH, errors);
  if (sourceSchema && sourceManifest) validateJsonSchema(sourceManifest, sourceSchema, sourceSchema, SOURCE_MANIFEST_PATH, errors);
  if (indexSchema && index) validateJsonSchema(index, indexSchema, indexSchema, INDEX_PATH, errors);
  const source = validateSource(reader, sourceBytes, sourceManifest, errors);
  if (source && index) {
    schemaBasics(index, INDEX_PATH, errors);
    const partitionResult = validatePartitionFiles(reader, sourceBytes, source, index, errors);
    validateCompatibility(reader, sourceBytes, index, partitionResult?.expectedIndex, errors);
    try { assertAppendStable(sourceBytes, partitionResult?.expectedPartitions ?? []); }
    catch (error) { errors.push(`append-stability fixture failed: ${errorText(error)}`); }
    validateCatalogIntegration(reader, index, errors);
  }
  const results = {
    source_bytes: sourceManifest?.canonical_byte_count ?? 0,
    source_lines: sourceManifest?.canonical_line_count ?? 0,
    source_units: sourceManifest?.units?.length ?? 0,
    entry_count: (sourceManifest?.units ?? []).filter(unit => unit.unit_kind === 'ENTRY').length,
    partitions: index?.partitions?.length ?? 0,
    inbound_references: index?.inbound_reference_survival_mappings?.length ?? 0,
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
    const result = validateRepository(root, commit);
    console.log(`G28_LEDGER_SHADOW_RESULTS: ${JSON.stringify(result.results)}`);
    if (result.errors.length) { result.errors.forEach(error => console.error(error)); console.error('G28_LEDGER_SHADOW_VALIDATION: FAIL'); process.exitCode = 1; }
    else console.log('G28_LEDGER_SHADOW_VALIDATION: PASS');
  } catch (error) {
    console.error(error.stack ?? error.message);
    console.error('G28_LEDGER_SHADOW_VALIDATION: FAIL');
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) main();
