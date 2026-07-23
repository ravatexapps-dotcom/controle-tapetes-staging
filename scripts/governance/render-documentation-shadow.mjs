import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const MARKER = 'GENERATED SHADOW VIEW — NON-CANONICAL — DO NOT EDIT';

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

export function renderDocumentationIndex(catalog) {
  const rows = catalog.artifacts.map(entry =>
    `| ${entry.artifact_id} | \`${entry.path}\` | ${entry.classification} | ${entry.authority} | ${entry.bootstrap_tier} | ${entry.disposition} |`
  );
  return [
    '# Documentation Index shadow view',
    `<!-- ${MARKER} -->`,
    '',
    'Canonical owner: `docs/DOCUMENTATION_INDEX.md`. This view owns no independent facts.',
    '',
    '| ID | Path | Classification | Authority | Bootstrap | Survival |',
    '|---|---|---|---|---|---|',
    ...rows,
    '',
    `Artifacts: ${catalog.artifacts.length}. Review status: all entries explicitly REVIEWED.`,
    ''
  ].join('\n');
}

export function renderTraceability(traceability) {
  const rows = traceability.requirements.map(entry => {
    const sources = entry.normative_sources.map(source => `\`${source.path}::${source.anchor}\``).join('; ');
    const evidence = entry.evidence_pointers.map(value => `\`${value}\``).join('; ') || '—';
    return `| ${entry.requirement_id} | ${sources} | ${entry.phase_owner} | ${entry.disposition} | ${entry.blocking_state} | ${evidence} |`;
  });
  return [
    '# Purchase Order Phase-C traceability shadow view',
    `<!-- ${MARKER} -->`,
    '',
    'Canonical owner: `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`. This view owns no independent facts.',
    '',
    '| Requirement | Normative pointers | Owner | Disposition | Blocking | Evidence pointers |',
    '|---|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

export function renderViews(catalog, traceability) {
  return {
    documentationIndex: renderDocumentationIndex(catalog),
    traceability: renderTraceability(traceability)
  };
}

export function writeViews(root = REPO_ROOT) {
  const catalog = readJson(root, 'docs/governance/catalog/documents.json');
  const traceability = readJson(root, 'docs/governance/traceability/purchase-order-phase-c.json');
  const views = renderViews(catalog, traceability);
  const dir = path.join(root, 'docs', 'governance', 'shadow', 'generated');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'DOCUMENTATION_INDEX.md'), views.documentationIndex, 'utf8');
  fs.writeFileSync(path.join(dir, 'ORDEM_COMPRA_C3_TRACEABILITY.md'), views.traceability, 'utf8');
  return views;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    writeViews(process.cwd());
    console.log('DOCUMENTATION_SHADOW_RENDER: PASS');
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
