import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_VIEW_PATHS,
  assertCanonicalOutputPaths,
  assertSelectiveOutputPaths,
  renderCanonicalViews,
  renderSelectedCanonicalViews,
  validateRenderedViews,
  validateSelectedRenderedViews,
  writeCanonicalViews,
  writeSelectedCanonicalViews
} from '../scripts/governance/render-unit4-canonical-views.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readText = relativePath => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = relativePath => JSON.parse(readText(relativePath));
const normalizeLf = value => value.replace(/\r\n?/gu, '\n');
const state = readJson('docs/governance/current-state.json');
const catalog = readJson('docs/governance/catalog/documents.json');
const traceability = readJson('docs/governance/traceability/purchase-order-phase-c.json');
const expectedPaths = Object.values(CANONICAL_VIEW_PATHS);
const canonicalBefore = Object.fromEntries(expectedPaths.map(relativePath =>
  [relativePath, readText(relativePath)]));

function temporaryRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'governance-compact-bootstrap-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function existingOutputs(root) {
  return expectedPaths.filter(relativePath => fs.existsSync(path.join(root, relativePath)));
}

test('default rendering remains a strict deterministic four-output transaction with zero drift', () => {
  const first = renderCanonicalViews(state, catalog, traceability);
  const second = renderCanonicalViews(state, catalog, traceability);

  assert.deepEqual(Object.keys(first), expectedPaths);
  assert.deepEqual(first, second);
  assert.doesNotThrow(() => validateRenderedViews(first));
  for (const relativePath of expectedPaths) {
    assert.equal(normalizeLf(first[relativePath]), normalizeLf(canonicalBefore[relativePath]));
  }

  const partial = { [CANONICAL_VIEW_PATHS.handoff]: first[CANONICAL_VIEW_PATHS.handoff] };
  assert.throws(() => validateRenderedViews(partial), /canonical root transaction violation/u);
  assert.throws(() => assertCanonicalOutputPaths([
    CANONICAL_VIEW_PATHS.project,
    CANONICAL_VIEW_PATHS.handoff,
    CANONICAL_VIEW_PATHS.documentation,
    CANONICAL_VIEW_PATHS.documentation
  ]), /duplicate path/u);
});

test('default writing creates all four outputs and rejects a partial transaction', t => {
  const views = renderCanonicalViews(state, catalog, traceability);
  const root = temporaryRoot(t);
  const hashes = writeCanonicalViews(root, views);

  assert.deepEqual(existingOutputs(root), expectedPaths);
  assert.deepEqual(Object.keys(hashes), expectedPaths);

  const partialRoot = temporaryRoot(t);
  const partial = { [CANONICAL_VIEW_PATHS.handoff]: views[CANONICAL_VIEW_PATHS.handoff] };
  assert.throws(() => writeCanonicalViews(partialRoot, partial),
    /canonical root transaction violation/u);
  assert.deepEqual(existingOutputs(partialRoot), []);
});

test('handoff-only rendering requires only current state and is deterministic', () => {
  const selection = [CANONICAL_VIEW_PATHS.handoff];
  const first = renderSelectedCanonicalViews({ state }, selection);
  const second = renderSelectedCanonicalViews({ state }, selection);

  assert.deepEqual(Object.keys(first), selection);
  assert.deepEqual(first, second);
  assert.equal(normalizeLf(first[CANONICAL_VIEW_PATHS.handoff]),
    normalizeLf(canonicalBefore[CANONICAL_VIEW_PATHS.handoff]));
});

test('selected validation retains output-specific marker and forbidden-content checks', () => {
  const selection = [CANONICAL_VIEW_PATHS.handoff];
  const views = renderSelectedCanonicalViews({ state }, selection);
  const handoff = views[CANONICAL_VIEW_PATHS.handoff];

  assert.doesNotThrow(() => validateSelectedRenderedViews(views, selection));
  assert.throws(() => validateSelectedRenderedViews({
    [CANONICAL_VIEW_PATHS.handoff]: handoff.replace('GENERATED_COMPATIBILITY_VIEW', 'REMOVED_MARKER')
  }, selection), /invalid compact generated marker cardinality/u);
  assert.throws(() => validateSelectedRenderedViews({
    [CANONICAL_VIEW_PATHS.handoff]: `${handoff}\ncommit_sha: forbidden\n`
  }, selection), /forbidden generated content/u);
  assert.throws(() => validateSelectedRenderedViews({
    [CANONICAL_VIEW_PATHS.handoff]: `${handoff}\nhash chain\n`
  }, selection), /historical hash or ledger machinery/u);

  const traceSelection = [CANONICAL_VIEW_PATHS.traceability];
  const traceViews = renderSelectedCanonicalViews({ traceability }, traceSelection);
  assert.throws(() => validateSelectedRenderedViews({
    [CANONICAL_VIEW_PATHS.traceability]:
      traceViews[CANONICAL_VIEW_PATHS.traceability]
        .replace('GOVERNANCE_GENERATED_VIEW:BEGIN', 'REMOVED_TRACE_MARKER')
  }, traceSelection), /invalid historical traceability marker cardinality/u);
});

test('handoff-only writing creates no collateral output', t => {
  const selection = [CANONICAL_VIEW_PATHS.handoff];
  const views = renderSelectedCanonicalViews({ state }, selection);
  const root = temporaryRoot(t);
  const hashes = writeSelectedCanonicalViews(root, views, selection);

  assert.deepEqual(existingOutputs(root), selection);
  assert.deepEqual(Object.keys(hashes), selection);
  assert.equal(normalizeLf(fs.readFileSync(path.join(root, CANONICAL_VIEW_PATHS.handoff), 'utf8')),
    normalizeLf(canonicalBefore[CANONICAL_VIEW_PATHS.handoff]));

  const preservationRoot = temporaryRoot(t);
  const unselectedPaths = expectedPaths.filter(relativePath =>
    relativePath !== CANONICAL_VIEW_PATHS.handoff);
  for (const relativePath of unselectedPaths) {
    const target = path.join(preservationRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `preserve:${relativePath}\n`, 'utf8');
  }
  const unselectedBefore = Object.fromEntries(unselectedPaths.map(relativePath =>
    [relativePath, fs.readFileSync(path.join(preservationRoot, relativePath), 'utf8')]));
  writeSelectedCanonicalViews(preservationRoot, views, selection);
  for (const relativePath of unselectedPaths) {
    assert.equal(fs.readFileSync(path.join(preservationRoot, relativePath), 'utf8'),
      unselectedBefore[relativePath]);
  }
});

test('each allowlisted output is independently selectable without collateral output', t => {
  const cases = [
    [CANONICAL_VIEW_PATHS.project, {}],
    [CANONICAL_VIEW_PATHS.handoff, { state }],
    [CANONICAL_VIEW_PATHS.documentation, {}],
    [CANONICAL_VIEW_PATHS.traceability, { traceability }]
  ];

  for (const [relativePath, sources] of cases) {
    const selection = [relativePath];
    const views = renderSelectedCanonicalViews(sources, selection);
    const root = temporaryRoot(t);

    assert.deepEqual(Object.keys(views), selection);
    assert.doesNotThrow(() => validateSelectedRenderedViews(views, selection));
    writeSelectedCanonicalViews(root, views, selection);
    assert.deepEqual(existingOutputs(root), selection);
    assert.equal(normalizeLf(views[relativePath]), normalizeLf(canonicalBefore[relativePath]));
  }
});

test('invalid selections and rendered/requested mismatches fail closed', () => {
  assert.throws(() => assertSelectiveOutputPaths([]), /must not be empty/u);
  assert.throws(() => assertSelectiveOutputPaths([
    CANONICAL_VIEW_PATHS.handoff, CANONICAL_VIEW_PATHS.handoff
  ]), /duplicate path/u);
  assert.throws(() => assertSelectiveOutputPaths(['UNKNOWN.md']), /unknown path/u);
  assert.throws(() => assertSelectiveOutputPaths([42]), /non-string path/u);
  assert.throws(() => assertSelectiveOutputPaths(CANONICAL_VIEW_PATHS.handoff),
    /must be an array or set/u);
  assert.throws(() => assertCanonicalOutputPaths([CANONICAL_VIEW_PATHS.handoff]),
    /canonical root transaction violation/u);

  const handoffViews = renderSelectedCanonicalViews(
    { state }, [CANONICAL_VIEW_PATHS.handoff]);
  assert.throws(() => validateSelectedRenderedViews(
    handoffViews, [CANONICAL_VIEW_PATHS.project]), /do not match the requested paths/u);
  assert.throws(() => validateSelectedRenderedViews({
    ...handoffViews,
    [CANONICAL_VIEW_PATHS.project]: canonicalBefore[CANONICAL_VIEW_PATHS.project]
  }, [CANONICAL_VIEW_PATHS.handoff]), /do not match the requested paths/u);
});

test('selected outputs fail explicitly when their required source is missing', () => {
  assert.throws(() => renderSelectedCanonicalViews(
    {}, [CANONICAL_VIEW_PATHS.handoff]), /missing required state source/u);
  assert.throws(() => renderSelectedCanonicalViews(
    {}, [CANONICAL_VIEW_PATHS.traceability]), /missing required traceability source/u);
});

test('LF and CRLF representations have equivalent semantic validation', () => {
  const defaultViews = renderCanonicalViews(state, catalog, traceability);
  const defaultCrlf = Object.fromEntries(Object.entries(defaultViews).map(
    ([relativePath, text]) => [relativePath, text.replace(/\n/gu, '\r\n')]));
  assert.doesNotThrow(() => validateRenderedViews(defaultCrlf));
  for (const relativePath of expectedPaths) {
    assert.equal(normalizeLf(defaultCrlf[relativePath]), normalizeLf(defaultViews[relativePath]));
  }

  const selection = [CANONICAL_VIEW_PATHS.handoff];
  const handoff = renderSelectedCanonicalViews({ state }, selection);
  const handoffCrlf = {
    [CANONICAL_VIEW_PATHS.handoff]:
      handoff[CANONICAL_VIEW_PATHS.handoff].replace(/\n/gu, '\r\n')
  };
  assert.doesNotThrow(() => validateSelectedRenderedViews(handoffCrlf, selection));
  assert.equal(normalizeLf(handoffCrlf[CANONICAL_VIEW_PATHS.handoff]),
    normalizeLf(handoff[CANONICAL_VIEW_PATHS.handoff]));
});

test('focused tests do not mutate canonical generated outputs', () => {
  for (const relativePath of expectedPaths) {
    assert.equal(readText(relativePath), canonicalBefore[relativePath]);
  }
});
