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

function normalizeLf(text) {
  return text.replace(/\r\n?/g, '\n');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function rangeText(lines, startIndex, endExclusive, hasFinalNewline) {
  const text = lines.slice(startIndex, endExclusive).join('\n');
  return `${text}${endExclusive < lines.length || hasFinalNewline ? '\n' : ''}`;
}

function slug(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 96) || 'UNTITLED';
}

function sourceUnit({ sourcePath, sourceKind, headingLevel, headingText, occurrence, startLine, endLine, text }) {
  return {
    source_id: `${sourcePath}:${sourceKind}:${sourceKind === 'BOOTSTRAP_KEY' ? headingText : `L${headingLevel}:${slug(headingText)}:${occurrence}`}`,
    source_path: sourcePath,
    heading_level: headingLevel,
    heading_text: headingText,
    heading_occurrence: occurrence,
    start_line: startLine,
    end_line: endLine,
    sha256: sha256(text),
    source_kind: sourceKind
  };
}

function parseBootstrap(text, sourcePath, lines) {
  const beginMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->';
  const endMarker = '<!-- SPEC_CUSTODY_BOOTSTRAP:END -->';
  const begin = lines.findIndex(line => line === beginMarker);
  const end = lines.findIndex((line, index) => index > begin && line === endMarker);
  const beginCount = lines.filter(line => line === beginMarker).length;
  const endCount = lines.filter(line => line === endMarker).length;
  if (beginCount === 0 && endCount === 0) return { begin: -1, end: -1, units: [] };
  if (begin < 0 || end < 0 || beginCount !== 1 || endCount !== 1) {
    throw new Error(`${sourcePath}: bootstrap markers are not exactly one pair`);
  }
  const fenceStart = begin + 2;
  const fenceEnd = end - 2;
  if (lines[begin + 1] !== '```text' || lines[end - 1] !== '```') throw new Error(`${sourcePath}: malformed bootstrap fence`);
  const units = [];
  for (let index = fenceStart; index <= fenceEnd; index += 1) {
    const line = lines[index];
    const match = line.match(/^([A-Z_]+):[ \t]+(.+)$/);
    if (!match) throw new Error(`${sourcePath}: malformed bootstrap line ${index + 1}`);
    units.push(sourceUnit({
      sourcePath,
      sourceKind: 'BOOTSTRAP_KEY',
      headingLevel: 0,
      headingText: match[1],
      occurrence: 1,
      startLine: index + 1,
      endLine: index + 1,
        text: rangeText(lines, index, index + 1, true)
    }));
  }
  return { begin, end, units };
}

function headingRanges(lines) {
  const headings = [];
  let fenced = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = line.match(/^(#{1,3})[ \t]+(.+?)\s*$/);
    if (match) headings.push({ index, level: match[1].length, text: match[2].trim() });
  }
  return headings;
}

export function buildSourceManifest(root = REPO_ROOT) {
  const sources = [];
  for (const sourcePath of SOURCE_PATHS) {
    const normalized = normalizeLf(fs.readFileSync(path.join(root, sourcePath), 'utf8'));
    const hasFinalNewline = normalized.endsWith('\n');
    const lines = normalized.split('\n');
    if (hasFinalNewline) lines.pop();
    const bootstrap = parseBootstrap(normalized, sourcePath, lines);
    const headings = headingRanges(lines);
    const occurrences = new Map();
    const units = [...bootstrap.units];
    const firstHeading = headings[0]?.index ?? lines.length;
    if (firstHeading > 0) {
      units.push(sourceUnit({
        sourcePath,
        sourceKind: 'PREAMBLE',
        headingLevel: 0,
        headingText: 'PREAMBLE',
        occurrence: 1,
        startLine: 1,
        endLine: firstHeading,
        text: rangeText(lines, 0, firstHeading, hasFinalNewline)
      }));
    }
    for (const [headingIndex, heading] of headings.entries()) {
      const key = `${heading.level}:${heading.text}`;
      const occurrence = (occurrences.get(key) ?? 0) + 1;
      occurrences.set(key, occurrence);
      const next = headings.slice(headingIndex + 1).find(candidate => candidate.level <= heading.level);
      const endExclusive = next ? next.index : lines.length;
      units.push(sourceUnit({
        sourcePath,
        sourceKind: 'MARKDOWN_SECTION',
        headingLevel: heading.level,
        headingText: heading.text,
        occurrence,
        startLine: heading.index + 1,
        endLine: endExclusive,
        text: rangeText(lines, heading.index, endExclusive, hasFinalNewline)
      }));
    }
    units.sort((left, right) => left.start_line - right.start_line || left.heading_level - right.heading_level || left.source_id.localeCompare(right.source_id));
    sources.push({
      source_path: sourcePath,
      source_sha256: sha256(normalized),
      line_count: lines.length,
      units
    });
  }
  return {
    schema_version: '1.0.0',
    manifest_id: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-SOURCE-MANIFEST',
    line_ending: 'LF',
    source_paths: SOURCE_PATHS,
    required_bootstrap_keys: REQUIRED_BOOTSTRAP_KEYS,
    sources
  };
}

function classify(unit) {
  if (unit.source_kind === 'BOOTSTRAP_KEY') return 'STRUCTURED_FIELD';
  const heading = unit.heading_text.toLowerCase();
  if (heading.includes('historical') || heading.includes('closed phase') || heading.includes('ledger') || heading.includes('archive')) return 'HISTORICAL_LEDGER_CONTENT';
  if (unit.source_path === 'AGENT_HANDOFF.md') return 'DUPLICATED_CURRENT_STATE';
  if (heading.includes('current') || heading.includes('active') || heading.includes('workspace') || heading.includes('environment') || heading.includes('debt') || heading.includes('prohibition')) return 'STRUCTURED_FIELD';
  return 'NORMATIVE_OWNER_POINTER';
}

export function buildEquivalence(manifest) {
  const mappings = [];
  for (const source of manifest.sources) {
    for (const unit of source.units) {
      const classification = classify(unit);
      const destination = unit.source_kind === 'BOOTSTRAP_KEY'
        ? 'docs/governance/shadow/current-state.json'
        : unit.source_path === 'PROJECT_STATE.md'
          ? 'PROJECT_STATE.md'
          : 'AGENT_HANDOFF.md';
      mappings.push({
        source_id: unit.source_id,
        source_path: unit.source_path,
        source_sha256: unit.sha256,
        classification,
        destination,
        structured_field_or_owner: unit.source_kind === 'BOOTSTRAP_KEY' ? unit.heading_text : destination,
        semantic_status: 'preserved',
        notes: `${unit.source_kind} ${unit.heading_text} mapped by deterministic source manifest.`
      });
    }
  }
  return { schema_version: '1.0.0', manifest_id: manifest.manifest_id, mappings };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writeManifest(root = REPO_ROOT, writeEquivalence = false) {
  const manifest = buildSourceManifest(root);
  const manifestPath = path.join(root, 'docs', 'governance', 'shadow', 'current-state-source-manifest.json');
  writeJson(manifestPath, manifest);
  if (writeEquivalence) writeJson(path.join(root, 'docs', 'governance', 'shadow', 'current-state-equivalence.json'), buildEquivalence(manifest));
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    writeManifest(root, process.argv.includes('--write-equivalence'));
    console.log('CURRENT_STATE_SOURCE_MANIFEST: PASS');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
