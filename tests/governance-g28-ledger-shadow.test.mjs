import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  COMPATIBILITY_BEGIN,
  COMPATIBILITY_PATH,
  INDEX_PATH,
  PARTITION_DIR,
  PAYLOAD_BEGIN,
  PAYLOAD_END,
  SOURCE_MANIFEST_PATH,
  SOURCE_PATH,
  assertAppendStable,
  assertAppendStablePartitions,
  buildArtifacts,
  buildInboundMappings,
  buildPartitionIndex,
  buildSourceManifest,
  deriveSourceUnits,
  markdownHeadings,
  partitionUnits,
  sha256,
  splitRawLines
} from '../scripts/governance/build-g28-ledger-partitions.mjs';
import { renderCompatibilityPayload, renderCompatibilityView } from '../scripts/governance/render-g28-ledger-shadow.mjs';
import { validateRepository, validateWithReader } from '../scripts/governance/validate-g28-ledger-shadow.mjs';
import { worktreeReader } from '../scripts/governance/git-content-reader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG_PATH = 'docs/governance/catalog/document-source-manifest.json';
const DOCUMENT_CATALOG_PATH = 'docs/governance/catalog/documents.json';
const live = worktreeReader(ROOT);
const snapshotPaths = [SOURCE_PATH, SOURCE_MANIFEST_PATH, INDEX_PATH, COMPATIBILITY_PATH,
  CATALOG_PATH, DOCUMENT_CATALOG_PATH, ...live.listFiles().filter(file => file.startsWith(`${PARTITION_DIR}/`))];
const files = new Map([...new Set(snapshotPaths)].map(file => [file, live.readText(file)]));

function gitBlobId(text) {
  const bytes = Buffer.from(text, 'utf8');
  return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

function memoryReader(changes = {}) {
  const content = new Map(files);
  for (const [file, value] of Object.entries(changes)) {
    if (value === null) content.delete(file);
    else content.set(file, value);
  }
  return {
    mode: 'memory',
    listFiles: () => [...content.keys()].sort(),
    exists: file => content.has(file),
    readText: file => {
      if (!content.has(file)) throw new Error(`missing ${file}`);
      return content.get(file);
    },
    objectId: file => content.has(file)
      ? (file === SOURCE_PATH && content.get(file) === files.get(file) ? live.objectId(file) : gitBlobId(content.get(file)))
      : null
  };
}

function jsonChange(file, mutate) {
  const value = JSON.parse(files.get(file));
  mutate(value);
  return { [file]: `${JSON.stringify(value, null, 2)}\n` };
}

function textChange(file, mutate) {
  return { [file]: mutate(files.get(file)) };
}

function validationResult(changes = {}) {
  try { return validateWithReader(memoryReader(changes)); }
  catch (error) { return { errors: [error.message] }; }
}

function expectValidationFailure(name, changes, message) {
  test(name, () => {
    const result = validationResult(changes);
    assert.ok(result.errors.length > 0, 'mutation unexpectedly passed');
    if (message) assert.ok(result.errors.some(error => error.includes(message)), result.errors.join('\n'));
  });
}

function partitionFile(number) { return `${PARTITION_DIR}/G28_LEDGER_PART_${String(number).padStart(4, '0')}.md`; }
function mutatePartition(number, mutate) { return textChange(partitionFile(number), mutate); }
function currentManifest() { return JSON.parse(files.get(SOURCE_MANIFEST_PATH)); }
function currentIndex() { return JSON.parse(files.get(INDEX_PATH)); }
function currentSourceBytes() { return Buffer.from(files.get(SOURCE_PATH), 'utf8'); }

test('valid complete Unit 3 fixture passes', () => {
  const result = validateWithReader(memoryReader());
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.results, {
    source_bytes: 973755,
    source_lines: 9626,
    source_units: 201,
    entry_count: 200,
    partitions: 12,
    inbound_references: 303,
    errors: 0
  });
});

test('canonical source Git object, hash, bytes, and lines are exact', () => {
  const manifest = currentManifest();
  assert.equal(manifest.canonical_source_git_object, live.objectId(SOURCE_PATH));
  assert.equal(manifest.canonical_source_sha256, sha256(currentSourceBytes()));
  assert.equal(manifest.canonical_byte_count, currentSourceBytes().length);
  assert.equal(manifest.canonical_line_count, splitRawLines(currentSourceBytes()).length);
});

test('source units are exhaustive, ordered, contiguous, and complete', () => {
  const manifest = currentManifest();
  let byte = 0;
  let line = 1;
  for (const unit of manifest.units) {
    assert.equal(unit.start_byte, byte);
    assert.equal(unit.start_line, line);
    assert.ok(unit.end_byte > unit.start_byte);
    assert.ok(unit.end_line >= unit.start_line);
    byte = unit.end_byte;
    line = unit.end_line + 1;
  }
  assert.equal(byte, manifest.canonical_byte_count);
  assert.equal(line, manifest.canonical_line_count + 1);
  assert.equal(new Set(manifest.units.map(unit => unit.unit_id)).size, manifest.units.length);
});

test('entry inventory and heading exceptions are deterministic', () => {
  const manifest = currentManifest();
  assert.equal(manifest.units.filter(unit => unit.unit_kind === 'PREAMBLE').length, 1);
  assert.equal(manifest.units.filter(unit => unit.unit_kind === 'ENTRY').length, 200);
  assert.equal(manifest.heading_exceptions.length, 2);
  assert.equal(manifest.entry_heading_grammar, '^##\\s+.+$ within the post-preamble region; dated form ^## YYYY-MM-DD \u2014 <non-empty title>$');
});

test('partitions contain complete source units without split entries', () => {
  const index = currentIndex();
  const unitIds = index.source_units.map(unit => unit.unit_id);
  assert.deepEqual(index.partitions.flatMap(partition => partition.unit_ids), unitIds);
  assert.equal(index.partitions.filter(partition => partition.oversized_single_unit).length, 0);
  assert.ok(index.partitions.every(partition => partition.line_count <= 1000 && partition.byte_count <= 128 * 1024));
  assert.equal(index.partitions.at(-1).status, 'OPEN');
  assert.ok(index.partitions.slice(0, -1).every(partition => partition.status === 'CLOSED'));
});

test('compatibility payload is reconstructed exactly from ordered partition payloads', () => {
  const compatibility = fs.readFileSync(path.join(ROOT, COMPATIBILITY_PATH));
  const begin = Buffer.from(`${COMPATIBILITY_BEGIN}\n`, 'utf8');
  const end = Buffer.from(`\n<!-- G28_LEDGER_SHADOW_COMPATIBILITY_PAYLOAD_END_7b9d4e3a -->\n`, 'utf8');
  const start = compatibility.indexOf(begin);
  const finish = compatibility.indexOf(end, start + begin.length);
  assert.ok(start >= 0 && finish >= 0);
  const payload = compatibility.subarray(start + begin.length, finish);
  assert.deepEqual(payload, renderCompatibilityPayload(ROOT));
  assert.deepEqual(payload, currentSourceBytes());
});

test('reference survival has exact cardinality and path-only destination', () => {
  const index = currentIndex();
  assert.equal(index.inbound_reference_survival_mappings.length, 303);
  assert.ok(index.inbound_reference_survival_mappings.every(mapping => mapping.resolution_status === 'COMPATIBILITY_VIEW'));
  assert.ok(index.inbound_reference_survival_mappings.every(mapping => mapping.compatibility_view_destination === COMPATIBILITY_PATH));
  assert.equal(new Set(index.inbound_reference_survival_mappings.map(mapping => mapping.mapping_id)).size, 303);
});

test('append-stability fixture preserves every previously closed partition', () => {
  const result = assertAppendStable(currentSourceBytes(), currentIndex().partitions);
  assert.deepEqual(result, { old_partition_count: 12, appended_partition_count: 12 });
});

test('double build is deterministic', () => {
  const first = buildArtifacts(ROOT);
  const second = buildArtifacts(ROOT);
  assert.deepEqual(second.manifest, first.manifest);
  assert.deepEqual(second.index, first.index);
  assert.deepEqual(second.partitions, first.partitions);
});

test('double render is deterministic', () => {
  assert.deepEqual(renderCompatibilityView(ROOT), renderCompatibilityView(ROOT));
});

test('Unit 3 worktree validator passes', () => {
  assert.deepEqual(validateRepository(ROOT).errors, []);
});

test('all Unit 3 JSON artifacts parse', () => {
  for (const file of [SOURCE_MANIFEST_PATH, INDEX_PATH, CATALOG_PATH, DOCUMENT_CATALOG_PATH]) JSON.parse(files.get(file));
});

test('all Unit 3 modules pass syntax checking', () => {
  for (const file of ['scripts/governance/build-g28-ledger-partitions.mjs',
    'scripts/governance/render-g28-ledger-shadow.mjs', 'scripts/governance/validate-g28-ledger-shadow.mjs']) {
    execFileSync(process.execPath, ['--check', file], { cwd: ROOT, stdio: 'pipe' });
  }
});

expectValidationFailure('canonical ledger hash drift fails', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.canonical_source_sha256 = '0'.repeat(64);
}), 'canonical ledger source hash drift');

expectValidationFailure('missing source byte fails', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.units[1].end_byte -= 1;
}), 'source manifest drift');

expectValidationFailure('duplicated source byte fails', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.units[2].start_byte = value.units[1].start_byte;
}), 'source manifest drift');

expectValidationFailure('overlapping source-unit ranges fail', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.units[2].start_line = value.units[1].start_line;
}), 'source manifest drift');

expectValidationFailure('uncovered source range fails', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.units[1].start_byte += 1;
}), 'source manifest drift');

expectValidationFailure('reordered source units fail', jsonChange(SOURCE_MANIFEST_PATH, value => {
  [value.units[1], value.units[2]] = [value.units[2], value.units[1]];
}), 'source manifest drift');

const exceptionalHeading = currentManifest().heading_exceptions[0].heading;
expectValidationFailure('malformed entry heading fails', textChange(SOURCE_PATH, value => {
  assert.ok(value.includes(exceptionalHeading));
  return value.replace(exceptionalHeading, exceptionalHeading.replace(/^##/u, '#'));
}), 'source manifest drift');

expectValidationFailure('duplicate unit ID fails', jsonChange(SOURCE_MANIFEST_PATH, value => {
  value.units[1].unit_id = value.units[2].unit_id;
}), 'duplicate source-unit ID');

expectValidationFailure('entry split between partitions fails', jsonChange(INDEX_PATH, value => {
  value.partitions[0].unit_ids.pop();
}), 'partition ordering');

expectValidationFailure('unjustified threshold overflow fails', jsonChange(INDEX_PATH, value => {
  value.thresholds.max_source_lines = 1001;
}), 'partition thresholds drift');

expectValidationFailure('missing partition fails', { [partitionFile(1)]: null }, 'missing partition');

expectValidationFailure('extra partition fails', { [partitionFile(9999)]: files.get(partitionFile(1)) }, 'extra partition');

expectValidationFailure('reordered partitions fail', jsonChange(INDEX_PATH, value => {
  [value.partitions[0], value.partitions[1]] = [value.partitions[1], value.partitions[0]];
}), 'partition ordering');

expectValidationFailure('altered partition payload fails', mutatePartition(1, value => value.replace(`${PAYLOAD_BEGIN}\n`, `${PAYLOAD_BEGIN}\nfixture mutation\n`)), 'altered partition payload');

expectValidationFailure('stale payload hash fails', jsonChange(INDEX_PATH, value => {
  value.partitions[0].payload_sha256 = '0'.repeat(64);
}), 'stale partition payload hash');

expectValidationFailure('invalid delimiter fails', mutatePartition(1, value => value.replace(PAYLOAD_END, 'BROKEN_PAYLOAD_END')), 'invalid payload delimiter');

expectValidationFailure('delimiter collision fails', textChange(SOURCE_PATH, value => `${value}\n${PAYLOAD_BEGIN}`), 'delimiter collision');

expectValidationFailure('compatibility payload drift fails', textChange(COMPATIBILITY_PATH, value => value.replace(`${COMPATIBILITY_BEGIN}\n`, `${COMPATIBILITY_BEGIN}\nfixture mutation\n`)), 'compatibility payload differs');

expectValidationFailure('independently sourced compatibility payload fails', textChange(COMPATIBILITY_PATH, value => value.replace('ORDERED_PARTITION_PAYLOADS', 'INDEPENDENT_COPY')), 'reconstructed independently');

expectValidationFailure('missing unit mapping fails', jsonChange(INDEX_PATH, value => {
  value.unit_to_partition.pop();
}), 'unit-to-partition mapping drift');

expectValidationFailure('duplicate unit mapping fails', jsonChange(INDEX_PATH, value => {
  value.unit_to_partition.push({ ...value.unit_to_partition[0] });
}), 'unit-to-partition mapping drift');

expectValidationFailure('missing inbound-reference mapping fails', jsonChange(INDEX_PATH, value => {
  value.inbound_reference_survival_mappings.pop();
}), 'inbound ledger reference missing');

expectValidationFailure('unused reference mapping fails', jsonChange(INDEX_PATH, value => {
  value.inbound_reference_survival_mappings.push({ ...value.inbound_reference_survival_mappings[0], mapping_id: 'G28-LEDGER-REF-9999' });
}), 'extra unused survival mapping');

function syntheticReference(overrides = {}) {
  return { source_path: 'fixture.md', source_line: 1, kind: 'ROOT_REFERENCE', anchor: null, line_suffix: null, ...overrides };
}

function syntheticMappings(reference, headings = markdownHeadings(splitRawLines(currentSourceBytes()))) {
  const manifest = buildSourceManifest(currentSourceBytes(), live.objectId(SOURCE_PATH));
  const partitions = partitionUnits(manifest.units);
  return () => buildInboundMappings({ documents: [{ path: SOURCE_PATH, inbound_references: [reference] }] }, manifest, partitions, headings);
}

test('missing anchor fails', () => {
  assert.throws(syntheticMappings(syntheticReference({ anchor: 'missing-anchor' })), /cannot be resolved/);
});

test('ambiguous anchor fails', () => {
  const headings = [{ anchor: 'duplicate-1', base_anchor: 'duplicate', line: 1 }, { anchor: 'duplicate-2', base_anchor: 'duplicate', line: 2 }];
  assert.throws(syntheticMappings(syntheticReference({ anchor: 'duplicate' }), headings), /ambiguous/);
});

test('invalid line suffix fails', () => {
  assert.throws(syntheticMappings(syntheticReference({ line_suffix: 'bad' })), /malformed/);
});

expectValidationFailure('line mapped to wrong partition fails', jsonChange(INDEX_PATH, value => {
  value.inbound_reference_survival_mappings[0].resolved_partition_id = value.partitions[0].partition_id;
}), 'inbound reference survival mapping drift');

expectValidationFailure('generated partition declared normative fails', mutatePartition(1, value => value.replace('GENERATED NON-CANONICAL', 'GENERATED NORMATIVE')), 'declared normative');

expectValidationFailure('appended ledger entry without regeneration fails', textChange(SOURCE_PATH, value => `${value}\n## 2099-12-31 — G28-LEDGER-APPEND-UNREGENERATED\n\n- fixture\n`), 'canonical ledger source hash drift');

test('pure append changing a closed partition fails append-stability proof', () => {
  const source = currentSourceBytes();
  const appended = Buffer.concat([source, Buffer.from('## 2099-12-31 — G28-LEDGER-APPEND-STABILITY-FIXTURE\n\n- fixture\n', 'utf8')]);
  const next = partitionUnits(deriveSourceUnits(appended).units);
  next[0].unit_ids = [...next[0].unit_ids, 'G28-LEDGER-FAKE-UNIT'];
  assert.throws(() => assertAppendStablePartitions(source, currentIndex().partitions, next), /closed partition unit interval/);
});

test('immutable validation produces zero Git mutation', () => {
  const before = execFileSync('git', ['status', '--short', '--branch'], { cwd: ROOT, encoding: 'utf8' });
  assert.deepEqual(validateRepository(ROOT).errors, []);
  const after = execFileSync('git', ['status', '--short', '--branch'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(after, before);
});

expectValidationFailure('generated artifact without explicit catalog review fails', jsonChange(DOCUMENT_CATALOG_PATH, value => {
  value.artifacts = value.artifacts.filter(artifact => artifact.path !== COMPATIBILITY_PATH);
}), `generated artifact added without explicit catalog review: ${COMPATIBILITY_PATH}`);
