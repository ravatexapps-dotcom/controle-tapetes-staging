import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const SOURCE_PATHS = ['PROJECT_STATE.md', 'AGENT_HANDOFF.md'];
export const REQUIRED_BOOTSTRAP_KEYS = [
  'LAST_ACCEPTED_PHASE', 'ACTIVE_PHASE', 'ACTIVE_PHASE_CONTRACT', 'ACTIVE_TRACK',
  'NEXT_AUTHORIZABLE_ACTION', 'GOVERNING_SPEC', 'TECHNICAL_CONTRACT',
  'SEQUENCE_AUTHORITY', 'TRACEABILITY', 'LEDGER', 'HANDOFF', 'ACCEPTED_CHECKPOINT'
];
export const MANIFEST_PATH = path.join(REPO_ROOT, 'docs', 'governance', 'shadow', 'current-state-source-manifest.json');
export const EQUIVALENCE_PATH = path.join(REPO_ROOT, 'docs', 'governance', 'shadow', 'current-state-equivalence.json');

export function normalizeLf(text) { return text.replace(/\r\n?/g, '\n'); }
export function sha256(text) { return crypto.createHash('sha256').update(text, 'utf8').digest('hex'); }
function plainLine(line) { return line.endsWith('\n') ? line.slice(0, -1) : line; }
function slug(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 96) || 'UNTITLED';
}

function splitLines(normalized) {
  if (normalized.length === 0) return [];
  const lines = normalized.match(/[^\n]*(?:\n|$)/g).filter(Boolean);
  return lines;
}

function semanticAnchors(lines, sourcePath) {
  const anchors = new Map();
  const occurrences = new Map();
  let fenced = false;
  let bootstrapBegin = -1;
  let bootstrapEnd = -1;
  const beginMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->';
  const endMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:END -->';
  const plain = lines.map(plainLine);
  if (sourcePath === 'PROJECT_STATE.md') {
    const begins = plain.flatMap((line, index) => line === beginMarker ? [index] : []);
    const ends = plain.flatMap((line, index) => line === endMarker ? [index] : []);
    if (begins.length !== 1 || ends.length !== 1 || ends[0] <= begins[0]) throw new Error(`${sourcePath}: bootstrap markers are not exactly one ordered pair`);
    bootstrapBegin = begins[0];
    bootstrapEnd = ends[0];
    if (plain[bootstrapBegin + 1] !== '```text' || plain[bootstrapEnd - 1] !== '```') throw new Error(`${sourcePath}: malformed bootstrap fence`);
    const bootstrapLines = plain.slice(bootstrapBegin + 2, bootstrapEnd - 1);
    const keys = [];
    for (const [offset, line] of bootstrapLines.entries()) {
      const match = line.match(/^([A-Z_]+):[ \t]+(.+)$/);
      if (!match) throw new Error(`${sourcePath}: malformed bootstrap line ${bootstrapBegin + offset + 3}`);
      keys.push(match[1]);
      anchors.set(bootstrapBegin + offset + 2, { kind: 'BOOTSTRAP_KEY', id: match[1], heading_level: 0, heading_text: match[1] });
    }
    if (JSON.stringify(keys) !== JSON.stringify(REQUIRED_BOOTSTRAP_KEYS)) throw new Error(`${sourcePath}: bootstrap key order mismatch`);
  }
  for (let index = 0; index < plain.length; index += 1) {
    const line = plain[index];
    if (index >= bootstrapBegin && index <= bootstrapEnd) continue;
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = line.match(/^(#{1,6})[ \t]+(.+?)\s*$/);
    if (!match) continue;
    const level = match[1].length;
    const headingText = match[2].trim();
    const key = `${level}:${headingText}`;
    const occurrence = (occurrences.get(key) ?? 0) + 1;
    occurrences.set(key, occurrence);
    anchors.set(index, {
      kind: 'MARKDOWN_HEADING',
      id: `L${level}:${slug(headingText)}:${occurrence}`,
      heading_level: level,
      heading_text: headingText
    });
  }
  return anchors;
}

function buildUnits(normalized, sourcePath) {
  const lines = splitLines(normalized);
  const anchors = semanticAnchors(lines, sourcePath);
  const boundaries = new Set([0, lines.length]);
  for (const index of anchors.keys()) { boundaries.add(index); boundaries.add(index + 1); }
  const ordered = [...boundaries].sort((left, right) => left - right);
  const offsets = [0];
  for (const line of lines) offsets.push(offsets.at(-1) + Buffer.byteLength(line, 'utf8'));
  let context = { id: 'PREAMBLE', heading_text: 'PREAMBLE', heading_level: 0 };
  const blockCounts = new Map();
  const units = [];
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const start = ordered[index];
    const end = ordered[index + 1];
    if (start === end) continue;
    const anchor = anchors.get(start);
    let sourceKind;
    let idPart;
    if (anchor) {
      sourceKind = anchor.kind;
      idPart = anchor.id;
      context = anchor;
    } else {
      sourceKind = start === 0 ? 'PREAMBLE' : 'TEXT_BLOCK';
      const count = (blockCounts.get(context.id) ?? 0) + 1;
      blockCounts.set(context.id, count);
      idPart = `${context.id}:BLOCK:${count}`;
    }
    const text = lines.slice(start, end).join('');
    units.push({
      source_id: `${sourcePath}:${sourceKind}:${idPart}`,
      source_path: sourcePath,
      start_offset: offsets[start],
      end_offset: offsets[end],
      start_line: start + 1,
      end_line: end,
      sha256: sha256(text),
      source_kind: sourceKind,
      heading_level: anchor?.heading_level ?? context.heading_level,
      heading_text: anchor?.heading_text ?? context.heading_text,
      destination_anchor_hint: context.kind === 'MARKDOWN_HEADING' || anchor?.kind === 'MARKDOWN_HEADING'
        ? `${'#'.repeat(context.heading_level)} ${context.heading_text}`
        : null
    });
  }
  return { lines, units };
}

export function buildSourceManifest(root = REPO_ROOT) {
  const sources = SOURCE_PATHS.map(sourcePath => {
    const normalized = normalizeLf(fs.readFileSync(path.join(root, sourcePath), 'utf8'));
    const { lines, units } = buildUnits(normalized, sourcePath);
    return {
      source_path: sourcePath,
      source_sha256: sha256(normalized),
      normalized_byte_length: Buffer.byteLength(normalized, 'utf8'),
      line_count: lines.length,
      units
    };
  });
  return {
    schema_version: '2.0.0',
    manifest_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-SOURCE-MANIFEST',
    line_ending: 'LF',
    coverage_model: 'CONTIGUOUS_NORMALIZED_UTF8_BYTE_PARTITION',
    source_paths: SOURCE_PATHS,
    required_bootstrap_keys: REQUIRED_BOOTSTRAP_KEYS,
    sources
  };
}

export function buildEquivalenceSkeleton(manifest) {
  return {
    schema_version: '2.0.0',
    manifest_id: manifest.manifest_id,
    mappings: manifest.sources.flatMap(source => source.units.map(unit => ({
      source_id: unit.source_id,
      source_path: unit.source_path,
      source_sha256: unit.sha256,
      classification: 'UNREVIEWED',
      preservation_disposition: 'UNREVIEWED',
      destination_path: null,
      destination_json_pointer: null,
      destination_anchor: null,
      actual_owner_path: null,
      semantic_status: 'UNREVIEWED',
      review_basis: 'Generated skeleton; explicit semantic review required.'
    })))
  };
}

function writeJson(filePath, value) { fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); }
export function writeManifest(root = REPO_ROOT, writeSkeleton = false) {
  const manifest = buildSourceManifest(root);
  writeJson(path.join(root, 'docs', 'governance', 'shadow', 'current-state-source-manifest.json'), manifest);
  if (writeSkeleton) writeJson(path.join(root, 'docs', 'governance', 'shadow', 'current-state-equivalence.json'), buildEquivalenceSkeleton(manifest));
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    writeManifest(root, process.argv.includes('--write-equivalence-skeleton'));
    console.log('CURRENT_STATE_SOURCE_MANIFEST: PASS');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
