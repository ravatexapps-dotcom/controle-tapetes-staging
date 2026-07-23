import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateRepository, validateWithReader } from '../scripts/governance/validate-documentation-shadow.mjs';
import { commitReader } from '../scripts/governance/git-content-reader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = commitReader(ROOT, 'fa986cf935abbf053172cfd549b0171bb9446f58');
const files = new Map(live.listFiles().filter(relativePath => live.exists(relativePath)).map(relativePath => [relativePath, live.readText(relativePath)]));
const manifest = JSON.parse(files.get('docs/governance/catalog/document-source-manifest.json'));
const baseObjects = new Map(manifest.documents.map(document => [document.path, document.git_object_id]));

function gitBlobId(text) {
  const bytes = Buffer.from(text, 'utf8');
  return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
function reader(changes = {}) {
  const content = new Map(files);
  for (const [relativePath, value] of Object.entries(changes)) value === null ? content.delete(relativePath) : content.set(relativePath, value);
  return {
    mode: 'memory',
    listFiles: () => [...content.keys()].sort(),
    exists: relativePath => content.has(relativePath),
    readText: relativePath => {
      if (!content.has(relativePath)) throw new Error(`missing ${relativePath}`);
      return content.get(relativePath);
    },
    objectId: relativePath => content.get(relativePath) === files.get(relativePath)
      ? (baseObjects.get(relativePath) ?? gitBlobId(content.get(relativePath)))
      : gitBlobId(content.get(relativePath) ?? '')
  };
}
function json(relativePath) { return JSON.parse(files.get(relativePath)); }
function changedJson(relativePath, mutate) {
  const value = json(relativePath);
  mutate(value);
  return JSON.stringify(value, null, 2) + '\n';
}
function changedCanonicalTrace(search, replacement) {
  const text = files.get('docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md');
  const start = text.indexOf('## Canonical requirement matrix');
  assert.notEqual(start, -1);
  return text.slice(0, start) + text.slice(start).replace(search, replacement);
}
function errors(changes = {}) { return validateWithReader(reader(changes)).errors.join('\n'); }
function expectFailure(name, changes, pattern) {
  test(name, () => assert.match(errors(changes), pattern));
}

test('valid complete repository fixture passes', () => assert.deepEqual(validateWithReader(reader()).errors, []));
expectFailure('governed document missing from catalog', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.artifacts.pop())
}, /governed document missing from catalog/);
expectFailure('extra catalog entry', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.artifacts.push({ ...value.artifacts[0], artifact_id: 'DOC-EXTRA', path: 'docs/extra.md' }))
}, /extra catalog entry/);
expectFailure('duplicate artifact ID', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[1].artifact_id = value.artifacts[0].artifact_id; })
}, /duplicate artifact ID/);
expectFailure('stale content hash', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[0].content_hash = '0'.repeat(64); })
}, /stale content metadata/);
expectFailure('UNREVIEWED classification', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[0].review_status = 'UNREVIEWED'; })
}, /UNREVIEWED/);
expectFailure('ambiguous survival disposition', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[0].review_basis = 'ambiguous disposition'; })
}, /ambiguous entry/);
expectFailure('invalid owner path', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[0].owner = 'docs/missing-owner.md'; })
}, /invalid owner path/);
expectFailure('invalid survival destination', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts[0].survival_destination = 'docs/missing-survival.md'; })
}, /invalid survival destination/);
expectFailure('generated view declared as normative authority', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.artifacts.find(entry => entry.generated_status === 'GENERATED').authority = 'NORMATIVE'; })
}, /generated view presented as an independent normative owner/);
expectFailure('missing inbound-reference source', {
  'docs/governance/catalog/document-source-manifest.json': changedJson('docs/governance/catalog/document-source-manifest.json', value => { value.documents[0].inbound_references.push({ source_path: 'docs/missing.md', source_line: 1, kind: 'ROOT_REFERENCE', anchor: null, line_suffix: null }); })
}, /stale inbound references/);
expectFailure('missing reference target', {
  'PROJECT_STATE.md': `${files.get('PROJECT_STATE.md')}\n[missing](docs/never-tracked.md)\n`
}, /missing debt for applicable broken reference/);
expectFailure('missing anchor', {
  'PROJECT_STATE.md': `${files.get('PROJECT_STATE.md')}\n[missing anchor](docs\/DOCUMENTATION_INDEX.md#never-present)\n`
}, /missing anchor/);
expectFailure('duplicate ambiguous anchor', {
  'PROJECT_STATE.md': `${files.get('PROJECT_STATE.md')}\n\`docs/DOCUMENTATION_INDEX.md::§ZZ.1\`\n`,
  'docs/DOCUMENTATION_INDEX.md': `${files.get('docs/DOCUMENTATION_INDEX.md')}\n## ZZ.1 One\n## ZZ.1 Two\n`
}, /ambiguous duplicate anchor/);
expectFailure('malformed :line reference', {
  'PROJECT_STATE.md': `${files.get('PROJECT_STATE.md')}\n\`docs/DOCUMENTATION_INDEX.md:line\`\n`
}, /malformed line suffix/);
expectFailure('path traversal', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers[0] = '../outside.md')
}, /path traversal/);
expectFailure('absolute path where root-relative is required', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers[0] = 'C:/outside.md')
}, /absolute path forbidden/);
expectFailure('unexpected unresolved broken reference', {
  'PROJECT_STATE.md': `${files.get('PROJECT_STATE.md')}\n[unexpected](docs/unexpected-broken.md)\n`
}, /missing debt for applicable broken reference/);
expectFailure('removal of explicit known-broken-reference disposition', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => { value.known_broken_references = value.known_broken_references.filter(debt => debt.debt_id !== 'DOC-REF-DEBT-001'); })
}, /explicit known-broken-reference disposition removed/);
expectFailure('duplicate requirement ID', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements.push({ ...value.requirements[0] }))
}, /duplicate requirement ID/);
expectFailure('missing structured requirement', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements.pop())
}, /missing structured requirement/);
expectFailure('extra structured requirement', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements.push({ ...value.requirements[0], requirement_id: 'OC-EXTRA-001' }))
}, /extra structured requirement/);
expectFailure('invalid normative source', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].normative_sources[0].path = 'docs/missing-normative.md')
}, /invalid normative source/);
expectFailure('invalid evidence pointer', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers[0] = 'docs/missing-evidence.md')
}, /invalid evidence pointer/);
expectFailure('invalid requirement anchor', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].normative_sources[0].anchor = '§NEVER')
}, /invalid requirement anchor/);
expectFailure('changed canonical traceability disposition', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].disposition = 'SATISFIED')
}, /changed canonical traceability disposition/);
expectFailure('structured blocking state differing from canonical', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].blocking_state = 'BLOCKED')
}, /blocking state differs from canonical/);
expectFailure('missing canonical blocking-state column', {
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md': files.get('docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md').replace(' | BLOCKING_STATE', '')
}, /malformed requirement table header/);
expectFailure('stale canonical row hash', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].canonical_row_sha256 = '0'.repeat(64))
}, /stale canonical row hash/);
expectFailure('reviewed row without matching hash fails', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].canonical_row_sha256 = '1'.repeat(64))
}, /reviewed row is not hash-bound/);
expectFailure('evidence pointer replaced by another existing file', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers[0] = 'docs/DOCUMENTATION_INDEX.md')
}, /evidence pointer parity mismatch/);
expectFailure('missing canonical evidence pointer', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers.shift())
}, /evidence pointer parity mismatch/);
expectFailure('extra structured evidence pointer', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers.push('docs/DOCUMENTATION_INDEX.md'))
}, /evidence pointer parity mismatch/);
expectFailure('structured evidence order differs from canonical', {
  'docs/governance/traceability/purchase-order-phase-c.json': changedJson('docs/governance/traceability/purchase-order-phase-c.json', value => value.requirements[0].evidence_pointers.reverse())
}, /evidence pointer parity mismatch/);
expectFailure('canonical evidence change without structured update', {
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md': changedCanonicalTrace('tests/ordem-compra-c3c-inactive.smoke.js', 'tests/ordem-compra-c3d-deploy.smoke.js')
}, /evidence pointer parity mismatch/);
expectFailure('broken-reference status other than DEFERRED', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[0].status = 'ACTIVE')
}, /broken-reference status must be DEFERRED/);
expectFailure('nonexistent debt owner', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[0].owner = 'docs/missing-owner.md')
}, /nonexistent debt owner/);
expectFailure('nonexistent debt source', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[0].source_path = 'docs/missing-source.md')
}, /nonexistent debt source/);
expectFailure('stale debt source line', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[0].source_line = 999999)
}, /stale source line/);
expectFailure('debt that matches no extracted reference', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[0].source_line = 1)
}, /debt matches no extracted reference/);
expectFailure('duplicate debt for the same reference', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references.push({ ...value.known_broken_references[0], debt_id: 'DOC-REF-DEBT-999' }))
}, /duplicate broken-reference debt/);
expectFailure('missing debt for an applicable broken reference', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references.splice(1, 1))
}, /missing debt for applicable broken reference/);
expectFailure('debt whose target now exists', {
  'docs/RETOMAR.md': '# restored target\n'
}, /deferred target now exists/);
expectFailure('duplicate debt ID', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references[1].debt_id = value.known_broken_references[0].debt_id)
}, /duplicate stable reference ID/);
expectFailure('ambiguous source-reference multiplicity', (() => {
  const source = files.get('PROJECT_STATE.md');
  const sourceLine = source.split(/\r?\n/).length;
  const changedSource = `${source}[first](docs/ambiguous-reference-target.md) [second](docs/ambiguous-reference-target.md)\n`;
  return {
    'PROJECT_STATE.md': changedSource,
    'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.known_broken_references.push({
      debt_id: 'DOC-REF-DEBT-AMBIGUOUS',
      source_path: 'PROJECT_STATE.md',
      source_line: sourceLine,
      target: 'docs/ambiguous-reference-target.md',
      status: 'DEFERRED',
      owner: 'docs/DOCUMENTATION_INDEX.md',
      reason: 'Fixture contains two distinct references on one source line.',
      future_resolution_unit: 'GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-3'
    }))
  };
})(), /ambiguous source-reference multiplicity/);
expectFailure('ambiguous canonical traceability row', {
  'docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md': changedCanonicalTrace('| OC-C3-READ-001 |', '| OC-C3-READ-001 | unexpected |')
}, /ambiguous canonical traceability row/);
expectFailure('generated DOCUMENTATION_INDEX drift', {
  'docs/governance/shadow/generated/DOCUMENTATION_INDEX.md': `${files.get('docs/governance/shadow/generated/DOCUMENTATION_INDEX.md')}drift\n`
}, /DOCUMENTATION_INDEX\.md: drift/);
expectFailure('generated traceability drift', {
  'docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md': `${files.get('docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md')}drift\n`
}, /ORDEM_COMPRA_C3_TRACEABILITY\.md: drift/);
expectFailure('non-deterministic input ordering is rejected through generated drift', {
  'docs/governance/catalog/documents.json': changedJson('docs/governance/catalog/documents.json', value => value.artifacts.reverse())
}, /generated:.*drift/);

test('invalid --commit object fails', () => {
  assert.throws(() => validateRepository(ROOT, 'deadbeef'), /invalid --commit object/);
});

test('ledger records the exact real Unit 2 first checkpoint', () => {
  const ledger = files.get('docs/ledgers/G28_LEDGER.md');
  assert.match(ledger, /GOVERNANCE-EFFICIENCY-REFOUNDATION-CATALOG-TRACEABILITY-VALIDATOR-SHADOW-R1[\s\S]*?fd84685453e9cb9e913e63fca2bfb3fbd7d73099/);
  assert.doesNotMatch(ledger, /fd8468548af02c649a9077050b93ce6f992643be/);
});

test('immutable baseline with stale or absent generated artifacts fails without Git mutation', () => {
  const before = execFileSync('git', ['-C', ROOT, 'status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' });
  const refsBefore = execFileSync('git', ['-C', ROOT, 'show-ref'], { encoding: 'utf8' });
  const result = validateRepository(ROOT, '39abf42a7341b61fd4ac02a8e38d1e4f33471f0f');
  assert.notEqual(result.errors.length, 0);
  assert.equal(execFileSync('git', ['-C', ROOT, 'status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' }), before);
  assert.equal(execFileSync('git', ['-C', ROOT, 'show-ref'], { encoding: 'utf8' }), refsBefore);
});

test('--commit validation never changes worktree, index, branch, or refs', () => {
  const before = {
    status: execFileSync('git', ['-C', ROOT, 'status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' }),
    branch: execFileSync('git', ['-C', ROOT, 'branch', '--show-current'], { encoding: 'utf8' }),
    refs: execFileSync('git', ['-C', ROOT, 'show-ref'], { encoding: 'utf8' })
  };
  validateRepository(ROOT, '39abf42a7341b61fd4ac02a8e38d1e4f33471f0f');
  assert.equal(execFileSync('git', ['-C', ROOT, 'status', '--porcelain=v1', '--untracked-files=all'], { encoding: 'utf8' }), before.status);
  assert.equal(execFileSync('git', ['-C', ROOT, 'branch', '--show-current'], { encoding: 'utf8' }), before.branch);
  assert.equal(execFileSync('git', ['-C', ROOT, 'show-ref'], { encoding: 'utf8' }), before.refs);
});

test('Unit 1 source mechanical regeneration without explicit re-review remains covered', () => {
  const source = files.get('tests/governance-current-state-shadow.test.mjs');
  assert.match(source, /source change plus mechanical manifest and equivalence regeneration cannot preserve prior review/);
});

test('deterministic renderer produces byte-identical output twice', async () => {
  const { renderViews } = await import('../scripts/governance/render-documentation-shadow.mjs');
  const catalog = json('docs/governance/catalog/documents.json');
  const traceability = json('docs/governance/traceability/purchase-order-phase-c.json');
  assert.deepEqual(renderViews(catalog, traceability), renderViews(structuredClone(catalog), structuredClone(traceability)));
});

test('epoch-1 generated roots resolve only to structured catalog owners', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/governance/catalog/documents.json'), 'utf8'));
  const roots = catalog.artifacts.filter(item => item.classification === 'GENERATED_COMPATIBILITY_VIEW');
  assert.equal(roots.length, 4);
  assert.ok(roots.every(item => item.authority === 'NONE / STRUCTURED_SOURCE_OWNED'));
  assert.ok(roots.every(item => !['PROJECT_STATE.md', 'AGENT_HANDOFF.md'].includes(item.owner)));
});
