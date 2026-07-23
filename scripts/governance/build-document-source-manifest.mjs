import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { worktreeReader } from './git-content-reader.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');
export const MANIFEST_PATH = 'docs/governance/catalog/document-source-manifest.json';
export const ROOT_DOCUMENTS = new Set(['PROJECT_STATE.md', 'AGENT_HANDOFF.md', 'AGENTS.md', 'CLAUDE.md']);

export function normalizeLf(value) { return value.replace(/\r\n?/g, '\n'); }
export function sha256(value) { return crypto.createHash('sha256').update(value, 'utf8').digest('hex'); }

export function isGovernedDocument(relativePath) {
  return ROOT_DOCUMENTS.has(relativePath)
    || (relativePath.startsWith('docs/') && relativePath.endsWith('.md'));
}

export function isGeneratedDocument(relativePath) {
  return relativePath.startsWith('docs/governance/shadow/generated/')
    || relativePath.startsWith('docs/governance/shadow/ledger/partitions/');
}

function githubSlug(text) {
  return text.toLowerCase().trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

export function headingInventory(text) {
  const headings = [];
  const counts = new Map();
  let fenced = false;
  for (const [index, line] of normalizeLf(text).split('\n').entries()) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!match) continue;
    const base = githubSlug(match[2]);
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    headings.push({
      level: match[1].length,
      text: match[2],
      anchor: occurrence === 0 ? base : `${base}-${occurrence}`,
      line: index + 1
    });
  }
  return headings;
}

function cleanTarget(value) {
  const target = value.trim().replace(/^<|>$/g, '');
  const lineMatch = target.match(/^(.*\.md):(\d+(?:-\d+)?)$/);
  if (lineMatch) return {
    raw: target,
    path: lineMatch[1],
    line_suffix: lineMatch[2].includes('-') ? lineMatch[2] : Number(lineMatch[2]),
    anchor: null
  };
  const malformedLine = target.match(/^(.*\.md):([^:][^#]*)$/);
  if (malformedLine) return { raw: target, path: malformedLine[1], line_suffix: malformedLine[2], anchor: null };
  const sectionMatch = target.match(/^(.*\.md)::(§[^#\s`,;)]+)/);
  if (sectionMatch) return { raw: target, path: sectionMatch[1], line_suffix: null, anchor: sectionMatch[2] };
  const hash = target.indexOf('#');
  return {
    raw: target,
    path: hash >= 0 ? target.slice(0, hash) : target,
    line_suffix: null,
    anchor: hash >= 0 ? target.slice(hash + 1) : null
  };
}

function resolveMarkdownTarget(sourcePath, target) {
  if (/^(?:https?:|mailto:|#)/i.test(target.path)) return null;
  const resolved = target.path.startsWith('/')
    ? target.path.slice(1)
    : path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath), target.path));
  return { ...target, path: resolved };
}

export function extractReferences(text, sourcePath) {
  const normalized = normalizeLf(text);
  const references = [];
  const seen = new Set();
  function add(kind, raw, target, offset) {
    const resolved = kind === 'MARKDOWN_LINK'
      ? resolveMarkdownTarget(sourcePath, cleanTarget(target))
      : cleanTarget(target);
    if (!resolved || !resolved.path.endsWith('.md')) return;
    const line = normalized.slice(0, offset).split('\n').length;
    const key = `${kind}\0${raw}\0${line}\0${resolved.path}\0${resolved.anchor ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    references.push({ kind, raw, target_path: resolved.path, anchor: resolved.anchor, line_suffix: resolved.line_suffix, source_line: line });
  }
  const link = /!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of normalized.matchAll(link)) add('MARKDOWN_LINK', match[0], match[1], match.index);
  const explicit = /`((?:PROJECT_STATE|AGENT_HANDOFF|AGENTS|CLAUDE)\.md|docs\/[A-Za-z0-9_./ -]+\.md(?:(?:::\S+)|(?:#[A-Za-z0-9_-]+)|(?::[^`\s,;)]+))?)(?:`|(?=[,;)]))/g;
  for (const match of normalized.matchAll(explicit)) add('ROOT_REFERENCE', match[0], match[1], match.index);
  return references.sort((a, b) => a.source_line - b.source_line || a.raw.localeCompare(b.raw));
}

export function buildDocumentManifest(reader) {
  const governedPaths = reader.listFiles().filter(isGovernedDocument).sort();
  const documents = governedPaths.map(relativePath => {
    const raw = reader.readText(relativePath);
    const text = normalizeLf(raw);
    const bytes = Buffer.byteLength(text, 'utf8');
    const references = extractReferences(text, relativePath);
    return {
      path: relativePath,
      git_object_id: reader.objectId(relativePath),
      sha256: sha256(text),
      line_count: text === '' ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0),
      byte_count: bytes,
      generated_status: isGeneratedDocument(relativePath) ? 'GENERATED' : 'MANUAL',
      outbound_references: references,
      inbound_references: [],
      headings: headingInventory(text)
    };
  });
  const byPath = new Map(documents.map(document => [document.path, document]));
  for (const source of documents) {
    for (const reference of source.outbound_references) {
      const target = byPath.get(reference.target_path);
      if (target) target.inbound_references.push({
        source_path: source.path,
        source_line: reference.source_line,
        kind: reference.kind,
        anchor: reference.anchor,
        line_suffix: reference.line_suffix
      });
    }
  }
  for (const document of documents) {
    document.inbound_references.sort((a, b) => a.source_path.localeCompare(b.source_path) || a.source_line - b.source_line);
  }
  return {
    schema_version: '1.0.0',
    scope_id: 'TRACKED_REPOSITORY_GOVERNANCE_MARKDOWN',
    discovery_rule: 'All Git-indexed or worktree-candidate *.md paths under docs/, plus PROJECT_STATE.md, AGENT_HANDOFF.md, AGENTS.md, and CLAUDE.md; excludes component, product, Supabase, and other root README/report trees.',
    exclusions: [
      { rule: 'services/**', reason: 'Component-owned documentation outside root repository-governance custody.' },
      { rule: 'supabase/**', reason: 'Product/deployment README material outside root repository-governance custody.' },
      { rule: 'root *.md except the four named entrypoints', reason: 'General product/report documentation outside the governed bootstrap and documentary-authority set.' },
      { rule: 'non-Markdown artifacts', reason: 'Unit 2 contracts Markdown documentary authority only; schemas, scripts, and product artifacts are validated through structured pointers.' }
    ],
    ordering: 'UTF-16 code-unit lexical order after root-relative POSIX normalization',
    documents
  };
}

export function writeDocumentManifest(root = REPO_ROOT) {
  const manifest = buildDocumentManifest(worktreeReader(root));
  const output = path.join(root, MANIFEST_PATH);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    const rootIndex = process.argv.indexOf('--root');
    const root = path.resolve(rootIndex >= 0 ? process.argv[rootIndex + 1] : process.cwd());
    const manifest = writeDocumentManifest(root);
    console.log(`DOCUMENT_SOURCE_MANIFEST: PASS (${manifest.documents.length} documents)`);
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
