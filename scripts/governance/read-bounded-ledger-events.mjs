import path from 'node:path';
import {
  PARTITION_DIR,
  PAYLOAD_BEGIN,
  PAYLOAD_END,
  INDEX_PATH
} from './build-g28-ledger-partitions.mjs';
import { sha256 } from './unit4-canonical-json.mjs';

export const FULL_LEDGER_PATHS = new Set([
  'docs/ledgers/G28_LEDGER.md',
  'docs/governance/shadow/generated/G28_LEDGER.md'
]);

function parseJson(reader, relativePath) {
  return JSON.parse(reader.readText(relativePath));
}

function extractPayload(text, label) {
  const begin = `${PAYLOAD_BEGIN}\n`;
  const end = `\n${PAYLOAD_END}\n`;
  if (text.split(PAYLOAD_BEGIN).length !== 2 || text.split(PAYLOAD_END).length !== 2) {
    throw new Error(`${label}: invalid partition payload delimiters`);
  }
  const start = text.indexOf(begin);
  const finish = text.indexOf(end, start + begin.length);
  if (start < 0 || finish < 0) throw new Error(`${label}: partition payload missing`);
  return Buffer.from(text.slice(start + begin.length, finish), 'utf8');
}

function validateReferenceShape(reference) {
  const required = [
    'unit_id', 'phase_order_id', 'heading', 'partition_id', 'partition_path',
    'partition_payload_sha256', 'unit_raw_sha256', 'start_byte', 'end_byte',
    'start_line', 'end_line', 'reason'
  ];
  for (const key of required) if (!(key in reference)) throw new Error(`bounded reference missing ${key}`);
  if (FULL_LEDGER_PATHS.has(reference.partition_path)) throw new Error('full-ledger fallback forbidden');
}

export function deriveBoundedReference(index, phaseOrderId, reason) {
  const matches = index.source_units.filter(unit => unit.phase_order_id === phaseOrderId);
  if (matches.length !== 1) throw new Error(`ledger event resolution must be unique: ${phaseOrderId}`);
  const unit = matches[0];
  const mapping = index.unit_to_partition.find(item => item.unit_id === unit.unit_id);
  const partition = index.partitions.find(item => item.partition_id === mapping?.partition_id);
  if (!partition) throw new Error(`ledger partition missing for ${unit.unit_id}`);
  return {
    unit_id: unit.unit_id,
    phase_order_id: unit.phase_order_id,
    heading: unit.heading,
    partition_id: partition.partition_id,
    partition_path: path.posix.join(PARTITION_DIR, partition.file_name),
    partition_payload_sha256: partition.payload_sha256,
    unit_raw_sha256: unit.raw_sha256,
    start_byte: unit.start_byte,
    end_byte: unit.end_byte,
    start_line: unit.start_line,
    end_line: unit.end_line,
    reason
  };
}

export function deriveRequiredBoundedReferences(index) {
  return [
    deriveBoundedReference(
      index,
      'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-BOOTSTRAP-AUTHORITY-CUTOVER-CONTRACT-R1',
      'Establishes direct Unit 3 acceptance and the Unit 4 contract definition.'
    ),
    deriveBoundedReference(
      index,
      'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-CONTRACT-COMMIT-BINDING-AND-CANDIDATE-PATH-CORRECTION-R2',
      'Establishes the accepted non-self-referential contract correction.'
    ),
    deriveBoundedReference(
      index,
      'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1',
      'Establishes external contract acceptance, Unit 4A authorization, and current readiness status.'
    )
  ];
}

export function readBoundedLedgerEvents(reader, references) {
  if (!Array.isArray(references) || references.length === 0) throw new Error('bounded references required');
  const duplicates = references.filter((item, index) =>
    references.findIndex(candidate => candidate.unit_id === item.unit_id) !== index);
  if (duplicates.length) throw new Error('duplicated bounded reference');
  const index = parseJson(reader, INDEX_PATH);
  const allowedPartitions = new Set(references.map(reference => reference.partition_path));
  const partitionCache = new Map();
  const events = [];
  for (const reference of references) {
    validateReferenceShape(reference);
    if (!allowedPartitions.has(reference.partition_path)) throw new Error('reference outside declared partitions');
    const unitMatches = index.source_units.filter(unit =>
      unit.unit_id === reference.unit_id || unit.phase_order_id === reference.phase_order_id);
    const exact = unitMatches.filter(unit =>
      unit.unit_id === reference.unit_id && unit.phase_order_id === reference.phase_order_id);
    if (exact.length !== 1 || unitMatches.length !== 1) throw new Error(`missing, stale, or ambiguous ledger event: ${reference.unit_id}`);
    const unit = exact[0];
    const mapping = index.unit_to_partition.find(item => item.unit_id === unit.unit_id);
    const partition = index.partitions.find(item => item.partition_id === mapping?.partition_id);
    if (!partition || partition.partition_id !== reference.partition_id) throw new Error(`wrong partition: ${unit.unit_id}`);
    const expectedPath = path.posix.join(PARTITION_DIR, partition.file_name);
    if (expectedPath !== reference.partition_path) throw new Error(`wrong partition path: ${unit.unit_id}`);
    let payload = partitionCache.get(expectedPath);
    if (!payload) {
      payload = extractPayload(reader.readText(expectedPath), expectedPath);
      partitionCache.set(expectedPath, payload);
    }
    const payloadHash = sha256(payload);
    if (payloadHash !== partition.payload_sha256
        || payloadHash !== reference.partition_payload_sha256) {
      throw new Error(`wrong partition payload hash: ${unit.unit_id}`);
    }
    const start = unit.start_byte - partition.start_byte;
    const end = unit.end_byte - partition.start_byte;
    const raw = payload.subarray(start, end);
    if (sha256(raw) !== unit.raw_sha256 || unit.raw_sha256 !== reference.unit_raw_sha256) {
      throw new Error(`stale unit identity: ${unit.unit_id}`);
    }
    if (unit.heading !== reference.heading
        || unit.start_byte !== reference.start_byte || unit.end_byte !== reference.end_byte
        || unit.start_line !== reference.start_line || unit.end_line !== reference.end_line) {
      throw new Error(`ledger interval or heading drift: ${unit.unit_id}`);
    }
    events.push({ reference, text: raw.toString('utf8') });
  }
  return {
    events,
    partitions_read: [...partitionCache.keys()],
    full_ledger_read: false
  };
}
