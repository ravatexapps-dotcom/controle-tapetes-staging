import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const SOURCE_PATH = 'docs/ledgers/G28_LEDGER.md';
export const SOURCE_MANIFEST_PATH = 'docs/governance/ledger/g28-ledger-source-manifest.json';
export const INDEX_PATH = 'docs/governance/ledger/g28-ledger-partition-index.json';
export const PARTITION_DIR = 'docs/governance/shadow/ledger/partitions';
export const COMPATIBILITY_PATH = 'docs/governance/shadow/generated/G28_LEDGER.md';
export const MAX_LINES = 1000;
export const MAX_BYTES = 128 * 1024;
export const PARTITION_FILE_RE = /^G28_LEDGER_PART_[0-9]{4}\.md$/;
export const PAYLOAD_BEGIN = '<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->';
export const PAYLOAD_END = '<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->';
export const COMPATIBILITY_BEGIN = '<!-- G28_LEDGER_SHADOW_COMPATIBILITY_PAYLOAD_BEGIN_7b9d4e3a -->';
export const COMPATIBILITY_END = '<!-- G28_LEDGER_SHADOW_COMPATIBILITY_PAYLOAD_END_7b9d4e3a -->';

const ENTRY_RE = /^##\s+(.+)$/u;
const DATE_ENTRY_RE = /^##\s+(\d{4}-\d{2}-\d{2})\s+—\s+(.+)$/u;

export function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
export function asBytes(value) { return Buffer.isBuffer(value) ? value : Buffer.from(value); }

export function splitRawLines(bytes) {
  const lines = [];
  let start = 0;
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0x0a) continue;
    lines.push({
      number: lines.length + 1,
      start,
      end: index + 1,
      bytes: bytes.subarray(start, index + 1),
      text: bytes.subarray(start, index + 1).toString('utf8').replace(/\r?\n$/u, '')
    });
    start = index + 1;
  }
  if (start < bytes.length) lines.push({
    number: lines.length + 1,
    start,
    end: bytes.length,
    bytes: bytes.subarray(start),
    text: bytes.subarray(start).toString('utf8')
  });
  return lines;
}

function sourceUnit(id, kind, ordinal, heading, date, phaseOrderId, bytes, startLine, endLine) {
  return {
    unit_id: id,
    unit_kind: kind,
    ordinal,
    heading,
    date,
    phase_order_id: phaseOrderId,
    start_byte: startLine.start,
    end_byte: endLine.end,
    start_line: startLine.number,
    end_line: endLine.number,
    raw_sha256: sha256(bytes.subarray(startLine.start, endLine.end)),
    byte_count: endLine.end - startLine.start,
    line_count: endLine.number - startLine.number + 1
  };
}

function phaseOrderId(heading) {
  const value = heading.replace(/^##\s+/u, '');
  const date = value.match(/^\d{4}-\d{2}-\d{2}\s+—\s+(.+)$/u);
  const candidate = date?.[1] ?? value;
  return candidate.split(' — ')[0].trim() || null;
}

export function deriveSourceUnits(bytes) {
  const source = asBytes(bytes);
  new TextDecoder('utf-8', { fatal: true }).decode(source);
  const lines = splitRawLines(source);
  if (!lines.length) throw new Error('canonical ledger is empty');
  const firstEntry = lines.find(line => DATE_ENTRY_RE.test(line.text));
  if (!firstEntry) throw new Error('canonical ledger preamble has no first dated entry');
  const boundaries = lines.filter(line => line.number >= firstEntry.number && ENTRY_RE.test(line.text));
  if (!boundaries.length || boundaries[0].number !== firstEntry.number) throw new Error('ledger entry boundary discovery failed');
  const units = [];
  const preambleEnd = lines[firstEntry.number - 2] ?? firstEntry;
  units.push(sourceUnit('G28-LEDGER-PREAMBLE', 'PREAMBLE', 0, null, null, null, source, lines[0], preambleEnd));
  boundaries.forEach((heading, index) => {
    const next = boundaries[index + 1];
    const endLine = next ? lines[next.number - 2] : lines.at(-1);
    const match = heading.text.match(DATE_ENTRY_RE);
    units.push(sourceUnit(
      `G28-LEDGER-UNIT-${String(index + 1).padStart(4, '0')}`,
      'ENTRY',
      index + 1,
      heading.text,
      match?.[1] ?? null,
      phaseOrderId(heading.text),
      source,
      heading,
      endLine
    ));
  });
  const last = units.at(-1);
  if (last.end_byte !== source.length) throw new Error('ledger source has uncovered trailing bytes');
  return { bytes: source, lines, units, firstEntryLine: firstEntry.number };
}

export function lineEndingProfile(lines) {
  const crlf = lines.filter(line => line.bytes.at(-2) === 0x0d && line.bytes.at(-1) === 0x0a).length;
  const lfOnly = lines.filter(line => line.bytes.at(-1) === 0x0a && line.bytes.at(-2) !== 0x0d).length;
  const bareCr = lines.filter(line => line.bytes.includes(0x0d) && line.bytes.at(-1) !== 0x0a).length;
  return { crlf, lf_only: lfOnly, bare_cr: bareCr, mixed: crlf > 0 && lfOnly > 0 };
}

function githubSlug(text) {
  return text.toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/<[^>]+>/gu, '')
    .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
    .replace(/\s+/gu, '-');
}

export function markdownHeadings(lines) {
  const headings = [];
  const counts = new Map();
  let fenced = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/u.test(line.text)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = line.text.match(/^(#{1,6})\s+(.+?)\s*$/u);
    if (!match) continue;
    const base = githubSlug(match[2]);
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    headings.push({ level: match[1].length, text: match[2], base_anchor: base, anchor: occurrence ? `${base}-${occurrence}` : base, line: line.number });
  }
  return headings;
}

export function buildSourceManifest(bytes, sourceGitObject) {
  const derived = deriveSourceUnits(bytes);
  const preamble = derived.units[0];
  return {
    schema_version: '1.0.0',
    manifest_id: 'G28-LEDGER-SOURCE-MANIFEST-R1',
    authority: 'NON-CANONICAL_DERIVED_FROM_CANONICAL_LEDGER',
    canonical_source: SOURCE_PATH,
    canonical_source_git_object: sourceGitObject,
    canonical_source_sha256: sha256(derived.bytes),
    canonical_byte_count: derived.bytes.length,
    canonical_line_count: derived.lines.length,
    encoding: 'UTF-8',
    line_endings: lineEndingProfile(derived.lines),
    entry_heading_grammar: '^##\\s+.+$ within the post-preamble region; dated form ^## YYYY-MM-DD — <non-empty title>$',
    preamble_unit_id: preamble.unit_id,
    units: derived.units,
    coverage: {
      model: 'EXHAUSTIVE_NON_OVERLAPPING_RAW_UTF8_BYTE_AND_SOURCE_LINE_RANGES',
      first_byte: 0,
      last_byte_exclusive: derived.bytes.length,
      first_line: 1,
      last_line: derived.lines.length,
      uncovered_bytes: 0,
      overlapping_ranges: 0
    },
    heading_exceptions: derived.units
      .filter(unit => unit.unit_kind === 'ENTRY' && !unit.date)
      .map(unit => ({ unit_id: unit.unit_id, line: unit.start_line, heading: unit.heading }))
  };
}

export function partitionUnits(units) {
  const partitions = [];
  let current = [];
  const close = () => {
    if (!current.length) return;
    const first = current[0];
    const last = current.at(-1);
    const lines = current.reduce((sum, unit) => sum + unit.line_count, 0);
    const bytes = current.reduce((sum, unit) => sum + unit.byte_count, 0);
    partitions.push({
      partition_id: `G28-LEDGER-PART-${String(partitions.length + 1).padStart(4, '0')}`,
      file_name: `G28_LEDGER_PART_${String(partitions.length + 1).padStart(4, '0')}.md`,
      first_unit_ordinal: first.ordinal,
      last_unit_ordinal: last.ordinal,
      first_unit_id: first.unit_id,
      last_unit_id: last.unit_id,
      start_byte: first.start_byte,
      end_byte: last.end_byte,
      start_line: first.start_line,
      end_line: last.end_line,
      byte_count: bytes,
      line_count: lines,
      oversized_single_unit: current.length === 1 && (lines > MAX_LINES || bytes > MAX_BYTES),
      status: 'CLOSED',
      unit_ids: current.map(unit => unit.unit_id)
    });
    current = [];
  };
  for (const unit of units) {
    const currentLines = current.reduce((sum, item) => sum + item.line_count, 0);
    const currentBytes = current.reduce((sum, item) => sum + item.byte_count, 0);
    const exceeds = current.length > 0
      && (currentLines + unit.line_count > MAX_LINES || currentBytes + unit.byte_count > MAX_BYTES);
    if (exceeds) close();
    current.push(unit);
    if (unit.line_count > MAX_LINES || unit.byte_count > MAX_BYTES) close();
  }
  close();
  partitions.at(-1).status = 'OPEN';
  return partitions;
}

export function assertAppendStablePartitions(sourceBytes, oldPartitions, newPartitions) {
  if (newPartitions.length < oldPartitions.length) throw new Error('append stability reduced partition count');
  const oldUnits = oldPartitions.slice(0, -1).flatMap(partition => partition.unit_ids);
  const newUnits = newPartitions.slice(0, oldPartitions.length - 1).flatMap(partition => partition.unit_ids);
  if (JSON.stringify(oldUnits) !== JSON.stringify(newUnits)) throw new Error('append changed a previously closed partition unit interval');
  for (let index = 0; index < oldPartitions.length - 1; index += 1) {
    const oldPayload = payloadForPartition(sourceBytes, oldPartitions[index]);
    const newPayload = payloadForPartition(sourceBytes, newPartitions[index]);
    if (!oldPayload.equals(newPayload)) throw new Error(`append changed a previously closed partition payload: ${index + 1}`);
  }
  return true;
}

export function assertAppendStable(sourceBytes, oldPartitions) {
  const suffix = Buffer.from('## 2099-12-31 — G28-LEDGER-APPEND-STABILITY-FIXTURE\n\n- fixture\n', 'utf8');
  const appended = Buffer.concat([asBytes(sourceBytes), asBytes(sourceBytes).at(-1) === 0x0a ? Buffer.alloc(0) : Buffer.from('\n', 'utf8'), suffix]);
  const next = partitionUnits(deriveSourceUnits(appended).units);
  assertAppendStablePartitions(sourceBytes, oldPartitions, next);
  return { old_partition_count: oldPartitions.length, appended_partition_count: next.length };
}

export function payloadForPartition(sourceBytes, partition) {
  return asBytes(sourceBytes).subarray(partition.start_byte, partition.end_byte);
}

function headerLines(partition, sourceManifest) {
  return [
    '<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->',
    `<!-- partition_id: ${partition.partition_id} -->`,
    `<!-- canonical_source: ${SOURCE_PATH} -->`,
    `<!-- source_unit_interval: ${partition.first_unit_id}..${partition.last_unit_id} -->`,
    `<!-- canonical_byte_interval: ${partition.start_byte}..${partition.end_byte} -->`,
    `<!-- canonical_line_interval: ${partition.start_line}..${partition.end_line} -->`,
    `<!-- payload_sha256: ${partition.payload_sha256} -->`,
    `<!-- oversized_single_unit: ${partition.oversized_single_unit ? 'true' : 'false'} -->`,
    `<!-- partition_status: ${partition.status} -->`,
    PAYLOAD_BEGIN,
    ''
  ].join('\n');
}

export function renderPartitionFile(sourceBytes, partition, sourceManifest) {
  const payload = payloadForPartition(sourceBytes, partition);
  return Buffer.concat([Buffer.from(headerLines(partition, sourceManifest), 'utf8'), payload, Buffer.from(`\n${PAYLOAD_END}\n`, 'utf8')]);
}

export function buildPartitionIndex(sourceBytes, sourceManifest, partitions, inboundMappings) {
  const withHashes = partitions.map(partition => ({
    ...partition,
    payload_sha256: sha256(payloadForPartition(sourceBytes, partition))
  }));
  const mapping = sourceManifest.units.map(unit => {
    const partition = withHashes.find(item => item.unit_ids.includes(unit.unit_id));
    return { unit_id: unit.unit_id, partition_id: partition.partition_id };
  });
  return {
    schema_version: '1.0.0',
    index_id: 'G28-LEDGER-PARTITION-INDEX-R1',
    authority: 'NON-CANONICAL_SHADOW; CANONICAL_LEDGER_AUTHORITY_UNCHANGED',
    canonical_source: SOURCE_PATH,
    canonical_source_git_object: sourceManifest.canonical_source_git_object,
    canonical_source_sha256: sourceManifest.canonical_source_sha256,
    canonical_byte_count: sourceManifest.canonical_byte_count,
    canonical_line_count: sourceManifest.canonical_line_count,
    source_manifest_path: SOURCE_MANIFEST_PATH,
    preamble_unit_id: sourceManifest.preamble_unit_id,
    thresholds: { max_source_lines: MAX_LINES, max_source_bytes: MAX_BYTES },
    source_units: sourceManifest.units.map(unit => ({
      unit_id: unit.unit_id, ordinal: unit.ordinal, unit_kind: unit.unit_kind,
      heading: unit.heading, date: unit.date, phase_order_id: unit.phase_order_id,
      start_byte: unit.start_byte, end_byte: unit.end_byte,
      start_line: unit.start_line, end_line: unit.end_line,
      raw_sha256: unit.raw_sha256, byte_count: unit.byte_count, line_count: unit.line_count
    })),
    partitions: withHashes,
    unit_to_partition: mapping,
    inbound_reference_survival_mappings: inboundMappings,
    compatibility_view: {
      path: COMPATIBILITY_PATH,
      reconstructed_from: 'ORDERED_PARTITION_PAYLOADS',
      payload_sha256: sourceManifest.canonical_source_sha256
    },
    complete_reassembly_sha256: sourceManifest.canonical_source_sha256
  };
}

export function buildInboundMappings(catalog, sourceManifest, partitions, headings) {
  const ledger = catalog.documents?.find(document => document.path === SOURCE_PATH);
  if (!ledger) throw new Error('accepted Unit 2 document manifest has no canonical ledger entry');
  const unitsByLine = line => sourceManifest.units.find(unit => line >= unit.start_line && line <= unit.end_line);
  const partitionFor = unitId => partitions.find(partition => partition.unit_ids.includes(unitId));
  const headingMatches = anchor => {
    const matches = headings.filter(heading => heading.anchor === anchor);
    const baseMatches = headings.filter(heading => heading.base_anchor === anchor);
    if (baseMatches.length > 1 && matches.length <= 1) throw new Error(`inbound anchor is ambiguous: ${anchor}`);
    return matches;
  };
  return (ledger.inbound_references ?? []).map((reference, index) => {
    const lineSuffix = reference.line_suffix;
    const anchor = reference.anchor;
    const sourceLine = Number(reference.source_line);
    let unit = null;
    let status = 'COMPATIBILITY_VIEW';
    if (anchor) {
      const matches = headingMatches(anchor);
      if (!matches.length) throw new Error(`inbound anchor cannot be resolved: ${anchor}`);
      if (matches.length > 1) throw new Error(`inbound anchor is ambiguous: ${anchor}`);
      unit = unitsByLine(matches[0].line);
      status = 'ANCHOR_RESOLVED';
    } else if (lineSuffix !== null && lineSuffix !== undefined) {
      const match = String(lineSuffix).match(/^(\d+)(?:-(\d+))?$/u);
      if (!match) throw new Error(`inbound line suffix is malformed: ${lineSuffix}`);
      const start = Number(match[1]); const end = Number(match[2] ?? match[1]);
      if (start < 1 || end < start || end > sourceManifest.canonical_line_count) throw new Error(`inbound line suffix is invalid: ${lineSuffix}`);
      unit = unitsByLine(start);
      if (!unit || end > unit.end_line) throw new Error(`inbound line suffix crosses source units: ${lineSuffix}`);
      status = 'LINE_SUFFIX_RESOLVED';
    }
    const partition = unit ? partitionFor(unit.unit_id) : null;
    return {
      mapping_id: `G28-LEDGER-REF-${String(index + 1).padStart(4, '0')}`,
      source_document: reference.source_path,
      source_line: sourceLine,
      reference_kind: reference.kind,
      original_target: SOURCE_PATH,
      anchor,
      line_suffix: lineSuffix,
      resolved_canonical_unit_id: unit?.unit_id ?? null,
      resolved_partition_id: partition?.partition_id ?? null,
      compatibility_view_destination: COMPATIBILITY_PATH,
      resolution_status: status
    };
  });
}

function loadInboundMappings(root, sourceManifest, partitions, headings) {
  const catalogPath = path.join(root, 'docs/governance/catalog/document-source-manifest.json');
  if (!fs.existsSync(catalogPath)) throw new Error(`missing accepted Unit 2 document manifest: ${catalogPath}`);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  return buildInboundMappings(catalog, sourceManifest, partitions, headings);
}

export function buildArtifacts(root = REPO_ROOT) {
  const sourcePath = path.join(root, SOURCE_PATH);
  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceGitObject = execFileSync('git', ['-C', root, 'hash-object', '--', SOURCE_PATH], { encoding: 'utf8' }).trim();
  const derived = deriveSourceUnits(sourceBytes);
  const manifest = buildSourceManifest(sourceBytes, sourceGitObject);
  const partitions = partitionUnits(manifest.units);
  const mappings = loadInboundMappings(root, manifest, partitions, markdownHeadings(derived.lines));
  const index = buildPartitionIndex(sourceBytes, manifest, partitions, mappings);
  const collisionTokens = [PAYLOAD_BEGIN, PAYLOAD_END, COMPATIBILITY_BEGIN, COMPATIBILITY_END];
  if (collisionTokens.some(token => sourceBytes.includes(Buffer.from(token, 'utf8')))) throw new Error('partition delimiter collides with canonical source content');
  return { sourceBytes, derived, manifest, partitions: index.partitions, index, collisionTokens };
}

export function writeArtifacts(root = REPO_ROOT) {
  const artifacts = buildArtifacts(root);
  const manifestPath = path.join(root, SOURCE_MANIFEST_PATH);
  const indexPath = path.join(root, INDEX_PATH);
  const partitionDir = path.join(root, PARTITION_DIR);
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.mkdirSync(partitionDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(artifacts.manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(indexPath, `${JSON.stringify(artifacts.index, null, 2)}\n`, 'utf8');
  for (const partition of artifacts.partitions) {
    const file = path.join(partitionDir, partition.file_name);
    fs.writeFileSync(file, renderPartitionFile(artifacts.sourceBytes, partition, artifacts.manifest));
  }
  return artifacts;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    const result = writeArtifacts(root);
    console.log(`G28_LEDGER_PARTITION_BUILD: PASS (${result.partitions.length} partitions, ${result.manifest.units.length} units)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
