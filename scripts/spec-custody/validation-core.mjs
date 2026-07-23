import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const WRAPPERS = ['CLAUDE.md', 'AGENTS.md'];
export const SHARED_INSTRUCTION = 'docs/governance/AGENT_INSTRUCTIONS.md';
export const CONTRACT_BEGIN = '<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->';
export const CONTRACT_END = '<!-- MATERIAL_PHASE_CONTRACT:END -->';

const REQUIRED_KEYS = [
  'LAST_ACCEPTED_PHASE', 'ACTIVE_PHASE', 'ACTIVE_PHASE_CONTRACT', 'ACTIVE_TRACK',
  'NEXT_AUTHORIZABLE_ACTION', 'GOVERNING_SPEC', 'TECHNICAL_CONTRACT',
  'SEQUENCE_AUTHORITY', 'TRACEABILITY', 'LEDGER', 'HANDOFF', 'ACCEPTED_CHECKPOINT',
];
const POINTER_KEYS = [
  'GOVERNING_SPEC', 'TECHNICAL_CONTRACT', 'SEQUENCE_AUTHORITY', 'TRACEABILITY',
  'LEDGER', 'HANDOFF',
];
const TRACE_HEADERS = [
  'REQUIREMENT_ID', 'NORMATIVE_ANCHOR', 'OWNING_PHASE', 'DISPOSITION',
  'IMPLEMENTATION_ARTIFACT', 'TEST_OR_EVIDENCE', 'ENVIRONMENT',
  'ACCEPTED_CHECKPOINT', 'RESIDUAL_DEBT',
];
const REGISTRY_HEADERS = ['REQUIREMENT_ID', 'NORMATIVE_ANCHORS', 'OWNING_PHASE', 'REQUIREMENT'];

export const REGISTRIES = [
  {
    path: 'docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md',
    heading: '## §R.31 Active Phase-C continuation requirement registry — governance metadata',
  },
  {
    path: 'docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md',
    heading: '### 13.17 Active Phase-C schema requirement registry — governance metadata',
  },
];

const ALLOWED_DISPOSITIONS = new Set([
  'SATISFIED', 'PARTIALLY_SATISFIED', 'PLANNED', 'DEFERRED', 'BLOCKED',
  'NOT_APPLICABLE', 'SUPERSEDED',
]);
const CLOSED_DISPOSITIONS = new Set(['SATISFIED', 'DEFERRED', 'NOT_APPLICABLE', 'SUPERSEDED']);
const EVIDENCE_OWNERS = ['PROJECT_STATE.md', 'LEDGER', 'TRACEABILITY'];
const BOOTSTRAP_BEGIN = '<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->';
const BOOTSTRAP_END = '<!-- SPEC_CUSTODY_BOOTSTRAP:END -->';

export function runGit(root, args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    const detail = error.stderr?.toString().trim() || error.message;
    throw new Error(`git ${args.join(' ')} failed: ${detail}`);
  }
}

function countLiteral(text, value) {
  return text.split(value).length - 1;
}

export function readText(root, path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function parseBootstrap(text, errors) {
  const beginCount = countLiteral(text, BOOTSTRAP_BEGIN);
  const endCount = countLiteral(text, BOOTSTRAP_END);
  if (beginCount !== 1 || endCount !== 1) {
    errors.push(`R1: bootstrap marker counts must be 1/1, got ${beginCount}/${endCount}.`);
    return null;
  }
  const escapedBegin = BOOTSTRAP_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedEnd = BOOTSTRAP_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockPattern = new RegExp(`${escapedBegin}\\r?\\n\`\`\`text\\r?\\n([\\s\\S]*?)\\r?\\n\`\`\`\\r?\\n${escapedEnd}`);
  const match = text.match(blockPattern);
  if (!match) {
    errors.push('R1: bootstrap block is malformed.');
    return null;
  }
  const values = {};
  const counts = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Z_]+):[ \t]+(.+?)\s*$/);
    if (!pair || !REQUIRED_KEYS.includes(pair[1])) {
      errors.push(`R1: malformed or unexpected bootstrap line: ${line || '<blank>'}`);
      continue;
    }
    counts.set(pair[1], (counts.get(pair[1]) || 0) + 1);
    values[pair[1]] = pair[2];
  }
  for (const key of REQUIRED_KEYS) {
    const count = counts.get(key) || 0;
    if (count !== 1) errors.push(`R1: bootstrap key ${key} occurs ${count} times, expected 1.`);
  }
  return values;
}

function escapesRoot(rel) {
  return !rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel);
}

function containedTrackedFile(root, value, label, errors) {
  if (!value) return null;
  const target = resolve(root, value);
  const rel = relative(root, target);
  if (escapesRoot(rel)) {
    errors.push(`R1: ${label} escapes the repository root: ${value}`);
    return null;
  }
  const gitPath = rel.replaceAll('\\', '/');
  if (!existsSync(target) || !statSync(target).isFile()) {
    errors.push(`R1: ${label} is not an existing file: ${value}`);
    return null;
  }
  const realRel = relative(realpathSync(root), realpathSync(target));
  if (escapesRoot(realRel)) {
    errors.push(`R1: ${label} resolves outside the repository root: ${value}`);
    return null;
  }
  if (!runGit(root, ['ls-files', '--error-unmatch', '--', gitPath], { allowFailure: true })) {
    errors.push(`R1: ${label} is not tracked: ${value}`);
    return null;
  }
  return gitPath;
}

function validateActiveContract(root, bootstrap, errors) {
  if (bootstrap.ACTIVE_PHASE === 'NONE') {
    if (bootstrap.ACTIVE_PHASE_CONTRACT !== 'NONE') {
      errors.push('R2: ACTIVE_PHASE NONE requires ACTIVE_PHASE_CONTRACT NONE.');
    }
    return;
  }
  if (bootstrap.ACTIVE_PHASE_CONTRACT === 'NONE') {
    errors.push('R2: active phase has no contract.');
    return;
  }
  const path = containedTrackedFile(root, bootstrap.ACTIVE_PHASE_CONTRACT, 'ACTIVE_PHASE_CONTRACT', errors);
  if (!path) return;
  const text = readText(root, path);
  const begins = countLiteral(text, CONTRACT_BEGIN);
  const ends = countLiteral(text, CONTRACT_END);
  const marker = text.match(/<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->\r?\nPHASE_ID: ([A-Z0-9-]+)\r?\n<!-- MATERIAL_PHASE_CONTRACT:END -->/g) || [];
  if (begins !== 1 || ends !== 1 || marker.length !== 1) {
    errors.push('R2: active contract must contain exactly one well-formed material-phase marker.');
    return;
  }
  const phase = marker[0].match(/PHASE_ID: ([A-Z0-9-]+)/)[1];
  if (phase !== bootstrap.ACTIVE_PHASE) {
    errors.push(`R2: contract PHASE_ID ${phase} does not equal ${bootstrap.ACTIVE_PHASE}.`);
  }
}

function splitTableRow(line) {
  if (!line.startsWith('|') || !line.endsWith('|')) return null;
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function isGovernedRowOutsideTable(line, columnCount) {
  const value = line.trim();
  if (!value) return false;
  if (/\bOC-/i.test(value)) return true;
  if (!value.includes('|')) return false;
  const cells = value.split('|').map((cell) => cell.trim());
  if (value.startsWith('|') || value.endsWith('|')) return true;
  if (cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return true;
  if (/^(?:#{1,6}|[-*+]|>)\s/.test(value)) return false;
  if (cells.length === columnCount && cells.every(Boolean)) return true;
  return cells.length >= 3 && cells.every((cell) => cell && cell.split(/\s+/).length <= 4 && !/[.!?;]/.test(cell));
}

function extractSection(text, heading, errors, code) {
  const lines = text.split(/\r?\n/);
  const indexes = lines.flatMap((line, index) => line === heading ? [index] : []);
  if (indexes.length !== 1) {
    errors.push(`${code}: section heading occurs ${indexes.length} times: ${heading}`);
    return '';
  }
  const level = heading.match(/^#+/)[0].length;
  let end = lines.length;
  for (let index = indexes[0] + 1; index < lines.length; index += 1) {
    const found = lines[index].match(/^(#+)\s/);
    if (found && found[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(indexes[0] + 1, end).join('\n');
}

function parseTable(section, headers, errors, code) {
  const lines = section.split(/\r?\n/);
  const header = `| ${headers.join(' | ')} |`;
  const indexes = lines.flatMap((line, index) => line === header ? [index] : []);
  if (indexes.length !== 1) {
    errors.push(`${code}: table header occurs ${indexes.length} times.`);
    return [];
  }
  const start = indexes[0];
  const divider = splitTableRow(lines[start + 1] || '');
  if (!divider || divider.length !== headers.length || divider.some((cell) => !/^:?-{3,}:?$/.test(cell))) {
    errors.push(`${code}: table divider is malformed.`);
    return [];
  }
  const rows = [];
  let end = start + 2;
  for (; end < lines.length && lines[end].startsWith('|'); end += 1) {
    const cells = splitTableRow(lines[end]);
    if (!cells || cells.length !== headers.length) {
      errors.push(`${code}: malformed ${headers.length}-cell row: ${lines[end]}`);
      continue;
    }
    if (cells.some((cell) => !cell)) {
      errors.push(`${code}: row contains a blank required cell: ${lines[end]}`);
    }
    rows.push(cells);
  }
  for (let index = 0; index < lines.length; index += 1) {
    if (index >= start && index < end) continue;
    if (isGovernedRowOutsideTable(lines[index], headers.length)) {
      errors.push(`${code}: governed row exists outside the canonical table: ${lines[index].trim()}`);
    }
  }
  return rows;
}

function parseRegistry(root, errors) {
  const entries = new Map();
  for (const config of REGISTRIES) {
    const text = readText(root, config.path);
    const section = extractSection(text, config.heading, errors, 'R6');
    const rows = parseTable(section, REGISTRY_HEADERS, errors, 'R6');
    for (const cells of rows) {
      const idMatch = cells[0].match(/^`(OC-[A-Z0-9-]+)`$/);
      const ownerMatch = cells[2].match(/^`([A-Z0-9_-]+)`$/);
      const parts = cells[1].split(';').map((value) => value.trim());
      const anchors = parts.map((part) => part.match(/^`([^`]+)`$/)?.[1]).filter(Boolean);
      const anchorsWellFormed = anchors.length === parts.length && new Set(anchors).size === anchors.length;
      if (!idMatch || !ownerMatch || !anchorsWellFormed) {
        errors.push(`R6: malformed registry row: ${cells.join(' | ')}`);
        continue;
      }
      const id = idMatch[1];
      if (entries.has(id)) errors.push(`R6: duplicate registry requirement ID: ${id}`);
      entries.set(id, { id, owner: ownerMatch[1], anchors, path: config.path });
    }
    for (const entry of entries.values()) {
      if (entry.path !== config.path) continue;
      const count = [...text.matchAll(new RegExp(entry.id, 'g'))].length;
      if (count !== 1) errors.push(`R6: registry occurrence count for ${entry.id} is ${count}, expected 1.`);
    }
  }
  if (!entries.size) errors.push('R6: normative requirement registries are empty.');
  return entries;
}

function parseTraceabilityRows(cellsRows, errors) {
  const rows = new Map();
  for (const cells of cellsRows) {
    const id = cells[0];
    if (!/^OC-[A-Z0-9-]+$/.test(id)) {
      errors.push(`R6: malformed traceability ID: ${id}`);
      continue;
    }
    if (rows.has(id)) errors.push(`R6: duplicate traceability requirement ID: ${id}`);
    rows.set(id, {
      id,
      anchors: cells[1].split(';').map((value) => value.trim()),
      phase: cells[2],
      disposition: cells[3],
      cells,
    });
  }
  return rows;
}

function crossCheckTraceabilityRow(row, registry, closed, errors) {
  const registered = registry.get(row.id);
  if (!registered) return;
  const expected = registered.anchors.map((anchor) => `${registered.path}::${anchor}`);
  if (row.phase !== registered.owner) {
    errors.push(`R6: owner mismatch for ${row.id}: ${row.phase} != ${registered.owner}`);
  }
  const anchorsMatch = row.anchors.length === expected.length
    && [...row.anchors].sort().join('\n') === [...expected].sort().join('\n');
  if (!anchorsMatch) errors.push(`R6: registry/matrix anchor mismatch for ${row.id}.`);
  if (!ALLOWED_DISPOSITIONS.has(row.disposition)) {
    errors.push(`R3: invalid disposition ${row.disposition} for ${row.id}`);
  }
  if (closed.has(row.phase) && !CLOSED_DISPOSITIONS.has(row.disposition)) {
    errors.push(`R3: closed phase ${row.phase} has nonterminal disposition ${row.disposition} for ${row.id}`);
  }
  if (row.phase === 'C3C-B' && row.disposition === 'SATISFIED') {
    errors.push(`R3: unauthorized C3C-B satisfaction for ${row.id}`);
  }
  if (row.disposition === 'PARTIALLY_SATISFIED'
    && [row.cells[4], row.cells[5], row.cells[8]].some((cell) => !cell || cell === '—')) {
    errors.push(`R3: partial disposition lacks implementation, evidence, or residual debt for ${row.id}`);
  }
}

function parseTraceability(root, path, registry, errors) {
  const text = readText(root, path);
  const section = extractSection(text, '## Requirement matrix', errors, 'R6');
  const cellsRows = parseTable(section, TRACE_HEADERS, errors, 'R6');
  const rows = parseTraceabilityRows(cellsRows, errors);
  for (const id of registry.keys()) if (!rows.has(id)) errors.push(`R6: missing traceability row: ${id}`);
  for (const id of rows.keys()) if (!registry.has(id)) errors.push(`R6: unexpected traceability row: ${id}`);
  const closedLines = [...text.matchAll(/^CLOSED_MATERIAL_PHASES:\s*(.+)$/gm)];
  if (closedLines.length !== 1) errors.push(`R3: CLOSED_MATERIAL_PHASES occurs ${closedLines.length} times.`);
  const closed = new Set(
    (closedLines[0]?.[1] || '').split(',').map((value) => value.trim()).filter((value) => value && value !== 'NONE'),
  );
  for (const row of rows.values()) crossCheckTraceabilityRow(row, registry, closed, errors);
  return { text, rows };
}

function validateAnchors(root, registry, errors) {
  for (const entry of registry.values()) {
    const text = readText(root, entry.path);
    for (const anchor of entry.anchors) {
      const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = [...text.matchAll(new RegExp(`^#{1,6}\\s+${escaped}(?:\\s|$)`, 'gm'))];
      if (matches.length !== 1) errors.push(`R6: exact heading ${entry.path}::${anchor} occurs ${matches.length} times.`);
    }
  }
}

function laterCommitAccountedFor(root, sha, subject, currentEvidence, paths, errors) {
  if (currentEvidence.includes(sha)) return;
  const parentEvidence = paths
    .map((path) => runGit(root, ['show', `${sha}^:${path}`], { allowFailure: true }) || '')
    .join('\n');
  if (parentEvidence.includes(subject)) {
    errors.push(`R4: repeated subject cannot account for ${sha}: ${subject}`);
    return;
  }
  const changed = new Set((runGit(root, ['diff-tree', '--no-commit-id', '--name-only', '-r', sha]) || '').split(/\r?\n/));
  const owners = paths.filter((path) => changed.has(path));
  const addedSubject = owners.some((path) => {
    const diff = runGit(root, ['diff', `${sha}^`, sha, '--unified=0', '--', path], { allowFailure: true }) || '';
    return diff.split(/\r?\n/).some((added) => added.startsWith('+') && !added.startsWith('+++') && added.includes(subject));
  });
  if (!addedSubject) errors.push(`R4: later commit is not accounted for by its own evidence diff: ${sha} ${subject}`);
}

function validateCheckpoint(root, bootstrap, traceText, errors, stateOwner = 'PROJECT_STATE.md') {
  const checkpoint = bootstrap.ACCEPTED_CHECKPOINT;
  if (!/^[0-9a-f]{40}$/.test(checkpoint || '')) {
    errors.push('R4: accepted checkpoint must be a full lowercase SHA.');
    return;
  }
  if (!runGit(root, ['rev-parse', '--verify', `${checkpoint}^{commit}`], { allowFailure: true })) {
    errors.push(`R4: accepted checkpoint does not exist: ${checkpoint}`);
    return;
  }
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', checkpoint, 'HEAD'], { cwd: root, stdio: 'ignore' });
  } catch {
    errors.push(`R4: accepted checkpoint is not an ancestor of HEAD: ${checkpoint}`);
    return;
  }
  const paths = EVIDENCE_OWNERS.map((key) => key === 'PROJECT_STATE.md' ? stateOwner : bootstrap[key]);
  const currentEvidence = [readText(root, paths[0]), readText(root, paths[1]), traceText].join('\n');
  const later = runGit(root, ['log', '--reverse', '--format=%H%x09%s', `${checkpoint}..HEAD`]);
  for (const line of later ? later.split(/\r?\n/) : []) {
    const tab = line.indexOf('\t');
    const sha = line.slice(0, tab);
    const subject = line.slice(tab + 1);
    laterCommitAccountedFor(root, sha, subject, currentEvidence, paths, errors);
  }
}

function validateWrappers(root, errors) {
  for (const path of [...WRAPPERS, SHARED_INSTRUCTION]) containedTrackedFile(root, path, path, errors);
  if (!WRAPPERS.every((path) => existsSync(resolve(root, path)))) return;
  const first = readFileSync(resolve(root, WRAPPERS[0]));
  const second = readFileSync(resolve(root, WRAPPERS[1]));
  if (!first.equals(second)) errors.push('R5: wrappers are not byte-identical.');
  if (!first.toString('utf8').includes(SHARED_INSTRUCTION)) errors.push('R5: wrappers do not share the instruction pointer.');
}

function validateStructuredRepository(root, errors) {
  const stateOwner = 'docs/governance/current-state.json';
  containedTrackedFile(root, stateOwner, stateOwner, errors);
  let state;
  try { state = JSON.parse(readText(root, stateOwner)); }
  catch (error) {
    errors.push(`R1: structured current state is invalid JSON: ${error.message}`);
    return errors;
  }
  if (state.mode !== 'canonical' || state.authority !== 'canonical_current_state'
      || state.authority_epoch !== 1 || state.activation?.status !== 'active') {
    errors.push('R1: structured current-state authority is not actively canonical.');
    return errors;
  }
  const pointers = state.governing_pointers ?? {};
  const bootstrap = {
    GOVERNING_SPEC: pointers.governing_spec,
    TECHNICAL_CONTRACT: pointers.technical_contract,
    SEQUENCE_AUTHORITY: pointers.sequence_authority,
    TRACEABILITY: pointers.traceability,
    LEDGER: pointers.ledger,
    HANDOFF: pointers.handoff,
    ACTIVE_PHASE: state.active_phase?.id,
    ACTIVE_PHASE_CONTRACT: state.active_phase?.contract,
    ACCEPTED_CHECKPOINT: state.accepted_checkpoints?.unit_4b_readiness
  };
  for (const key of POINTER_KEYS) containedTrackedFile(root, bootstrap[key], key, errors);
  if (bootstrap.GOVERNING_SPEC !== REGISTRIES[0].path) {
    errors.push('R1: GOVERNING_SPEC is not the active lifecycle registry owner.');
  }
  if (bootstrap.TECHNICAL_CONTRACT !== REGISTRIES[1].path) {
    errors.push('R1: TECHNICAL_CONTRACT is not the active schema registry owner.');
  }
  validateActiveContract(root, bootstrap, errors);
  const registry = parseRegistry(root, errors);
  validateAnchors(root, registry, errors);
  let traceText = '';
  try {
    const trace = JSON.parse(readText(root, bootstrap.TRACEABILITY));
    traceText = JSON.stringify(trace);
    if (trace.authority !== 'CANONICAL_PHASE_C_TRACEABILITY_OWNER'
        || trace.activation_status !== 'ACTIVE' || trace.requirements?.length !== 13) {
      errors.push('R3: structured traceability authority or row cardinality is invalid.');
    }
  } catch (error) {
    errors.push(`R3: structured traceability is invalid JSON: ${error.message}`);
  }
  if (bootstrap.LEDGER && bootstrap.TRACEABILITY) {
    validateCheckpoint(root, bootstrap, traceText, errors, stateOwner);
  }
  validateWrappers(root, errors);
  return errors;
}

export function validateRepository(inputRoot) {
  const errors = [];
  const top = runGit(inputRoot, ['rev-parse', '--show-toplevel'], { allowFailure: true });
  if (!top) return ['R1: root is not a Git repository.'];
  const root = resolve(top);
  const structuredPath = resolve(root, 'docs/governance/current-state.json');
  if (existsSync(structuredPath)) {
    try {
      const structured = JSON.parse(readFileSync(structuredPath, 'utf8'));
      if (structured.mode === 'canonical') return validateStructuredRepository(root, errors);
    } catch {
      return ['R1: structured current state is invalid JSON.'];
    }
  }
  const statePath = resolve(root, 'PROJECT_STATE.md');
  if (!existsSync(statePath)) return ['R1: PROJECT_STATE.md is missing.'];
  containedTrackedFile(root, 'PROJECT_STATE.md', 'PROJECT_STATE.md', errors);
  const bootstrap = parseBootstrap(readText(root, 'PROJECT_STATE.md'), errors);
  if (!bootstrap) return errors;
  const resolved = {};
  for (const key of POINTER_KEYS) resolved[key] = containedTrackedFile(root, bootstrap[key], key, errors);
  if (bootstrap.GOVERNING_SPEC !== REGISTRIES[0].path) errors.push('R1: GOVERNING_SPEC is not the active lifecycle registry owner.');
  if (bootstrap.TECHNICAL_CONTRACT !== REGISTRIES[1].path) errors.push('R1: TECHNICAL_CONTRACT is not the active schema registry owner.');
  validateActiveContract(root, bootstrap, errors);
  const registry = parseRegistry(root, errors);
  let traceText = '';
  if (resolved.TRACEABILITY) ({ text: traceText } = parseTraceability(root, resolved.TRACEABILITY, registry, errors));
  validateAnchors(root, registry, errors);
  if (resolved.LEDGER && resolved.TRACEABILITY) validateCheckpoint(root, bootstrap, traceText, errors);
  validateWrappers(root, errors);
  return errors;
}
