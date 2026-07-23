# Governance Efficiency Refoundation — Phase Contract

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION
<!-- MATERIAL_PHASE_CONTRACT:END -->

STATUS: ACTIVE / UNIT 4 CLOSED / UNIT 5 DIAGNOSIS NEXT AUTHORIZABLE

UNIT 1 STATUS: CLOSED / ACCEPTED / DIRECTLY VERIFIED

GOVERNANCE-EFFICIENCY-REFOUNDATION: ACTIVE

UNIT 1: CLOSED / ACCEPTED / DIRECTLY VERIFIED

UNIT 1 ACCEPTED CHECKPOINT: 39abf42a7341b61fd4ac02a8e38d1e4f33471f0f

STRUCTURED SOURCES: CANONICAL / AUTHORITY EPOCH 1

CURRENT CANONICAL OWNERS: STRUCTURED AUTHORITY ACTIVE

UNIT 2: CLOSED / ACCEPTED / DIRECTLY VERIFIED

UNIT 2 ACCEPTED CHECKPOINT: f7106977f4613de1830bef46002dbf0a4b8b3cbe

UNIT 3: CLOSED / ACCEPTED / DIRECTLY VERIFIED

UNIT 3 REVIEWED INTERVAL START: e3c8c15b368d20161df6e593debbdf0c68cb7e41

UNIT 3 ACCEPTED CHECKPOINT: 53899e30b72cde3d1f5759ea59fb0a4d632c974d

UNIT 3 ACCEPTED INTERVAL END: 53899e30b72cde3d1f5759ea59fb0a4d632c974d

CANONICAL LEDGER: docs/ledgers/G28_LEDGER.md / AUTHORITY UNCHANGED

UNIT 4: CONTRACT CLOSED / ACCEPTED / DIRECTLY VERIFIED

UNIT 4 CONTRACT: docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md

UNIT 4 CONTRACT ACCEPTED CHECKPOINT: 76f52c842678b74e655ef9080f4fc67ccbd38e22

UNIT 4 CONTRACT CORRECTION: COMMIT SELF-REFERENCE REMOVED / CANDIDATE ROOT-PATH BOUNDARY DEFINED

UNIT 4A IMPLEMENTATION: CLOSED / ACCEPTED / DIRECTLY VERIFIED AT fa986cf935abbf053172cfd549b0171bb9446f58
UNIT 4B REVIEW: DIRECT REVIEW COMPLETED / ACCEPTED AT fa986cf935abbf053172cfd549b0171bb9446f58
UNIT 4C: CLOSED / ACCEPTED / DIRECTLY VERIFIED
UNIT 4C REQUIRED PARENT: fa986cf935abbf053172cfd549b0171bb9446f58
UNIT 4C CUTOVER ID: GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1
AUTHORITY EPOCH: 1
UNIT 4D ACCEPTANCE: CLOSED / ACCEPTED / DIRECTLY VERIFIED
UNIT 5: NOT AUTHORIZED / DIAGNOSIS NEXT AUTHORIZABLE

DOCUMENTARY-AUTHORITY CUTOVER: CLOSED / ACCEPTED / DIRECTLY VERIFIED

The external supervisor ruling directly verified and accepted checkpoint
`39abf42a7341b61fd4ac02a8e38d1e4f33471f0f`; Unit 1 is closed and accepted.
This records external acceptance, not executor self-acceptance. Unit 2 adds the
reviewed document catalog, Phase-C traceability shadow, deterministic generated
views, reference validation, and immutable-commit validation. Unit 3 adds the
lossless raw-byte ledger source manifest, deterministic whole-entry partitions,
survival mappings, generated compatibility view, and append-stability proof.
Those structured sources were non-canonical during the historical shadow phase.
The external supervisor directly accepted Unit 3 checkpoint
`53899e30b72cde3d1f5759ea59fb0a4d632c974d`; Unit 3 is closed and accepted.
This records external acceptance, not executor self-acceptance. The Unit 4
authority-cutover contract published at `c7f4bb38076d865549221133ce33d8323e19f4eb`
was directly reviewed as `CHANGES_REQUIRED`. It is corrected so the activation
commit SHA is external immutable evidence, pre-commit content binds the required
parent and deterministic activation manifest, Unit 4A candidate renders are
confined to non-canonical candidate paths, and root replacement is Unit 4C-only.
The external supervisor accepted Unit 4A and Unit 4B readiness at
`fa986cf935abbf053172cfd549b0171bb9446f58` and authorized Unit 4C. Structured
authority remains active at epoch `1`. Direct post-cutover review accepted Unit
4C, Unit 4D, and the documentary-authority cutover. Unit 5 diagnosis is next
authorizable but remains unauthorized by this closeout.

## Objective

Reduce governance bootstrap cost and duplicated current-state prose through a
canonical structured representation with deterministic compatibility views.
Structured current state, document classification, and Phase-C traceability are
active at authority epoch `1`; authored normative documents and the canonical
ledger retain their established authority.

## Material units

1. Structured current state plus state and handoff shadow views.
2. Structured document catalog, traceability generation, and validator refoundation.
3. Ledger partitioning plus a compatibility view.
4. Bootstrap and documentary-authority cutover.
5. Legacy deprecation, archival, and post-cutover audit.

## HISTORICAL PRE-CUTOVER STATE — Unit 2 shadow implementation result

- Document scope: all Git-indexed or worktree-candidate Markdown under `docs/`
  plus `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `AGENTS.md`, and `CLAUDE.md`.
- Structured catalog and source manifest:
  `docs/governance/catalog/documents.json` and
  `docs/governance/catalog/document-source-manifest.json`.
- Structured Phase-C traceability:
  `docs/governance/traceability/purchase-order-phase-c.json`.
- Generated views:
  `docs/governance/shadow/generated/DOCUMENTATION_INDEX.md` and
  `docs/governance/shadow/generated/ORDEM_COMPRA_C3_TRACEABILITY.md`.
- Validator: `scripts/governance/validate-documentation-shadow.mjs`, including
  immutable `--commit <sha>` reads without checkout or Git mutation.
- Canonical trace rows bind `BLOCKING_STATE`, the exact LF-normalized row
  SHA-256 (including its terminating LF), explicit review basis, and exact
  evidence-pointer parity. Evidence pointers are extracted only as bounded
  root-relative `docs/`, `scripts/`, `tests/`, `db/`, or `js/` paths ending in
  `.md`, `.mjs`, `.js`, or `.sql`, plus `index.html`; extraction scans
  `IMPLEMENTATION_ARTIFACT` before `TEST_OR_EVIDENCE`, preserves first-occurrence
  order, and removes exact duplicates.
- Known broken-reference debt is fail-closed and reconciled one-to-one against
  the source path, exact line, extracted missing target, cataloged owner, and
  deferred resolution unit; duplicate, unused, stale, newly resolved, or
  multiply matched debt entries fail validation. A legacy inline-code token
  nested inside the same Markdown-link raw syntax is treated as one parser
  representation; distinct source references remain cardinality errors.
- Unit 2 is externally accepted at checkpoint `f7106977f4613de1830bef46002dbf0a4b8b3cbe`.
  At that checkpoint, the later Unit 3 closeout and documentary-authority
  activation had not yet occurred.

## HISTORICAL PRE-CUTOVER STATE — Unit 3 R2 governance-gate hardening

- The published Unit 3 interval changed 39 paths. The exact path
  `scripts/governance/build-document-source-manifest.mjs` was outside the R1
  path ceiling and therefore was not authorized in R1. Its change was required
  to classify `docs/governance/shadow/ledger/partitions/` as generated
  documentation. R2 authorizes retention of that necessary non-weakening
  integration as a forward correction; no broader Unit 2 builder change is
  authorized.
- Both Unit 3 schemas are required, parsed, and enforced by the dependency-free
  validator, including nested shape, local-reference, type, const, enum,
  pattern, minimum, and array-cardinality failures.
- Immutable validation explicitly covers published checkpoint
  `52533cc1a7658cc23f055b782b98f2167b63893f` with before/after Git-state
  equality.
- Append stability compares old and appended source buffers independently and
  preserves every closed partition interval, payload, and payload hash.
- Entry derivation permits the dated grammar plus exactly the two reviewed
  legacy non-dated headings; mutation, removal, demotion, duplication, or a new
  non-dated boundary fails during derivation.
- At the R2 checkpoint, Unit 3 remained unaccepted and proceeded to the R3
  identity-binding correction recorded below.

## HISTORICAL PRE-CUTOVER STATE — Unit 3 R3 partition-index identity binding

- The validator independently rebuilds the expected partition index and requires
  full deterministic parity with the recorded index.
- The recorded canonical Git object, canonical SHA-256, byte count, line count,
  compatibility payload SHA-256, and complete reassembly SHA-256 are bound to
  the source manifest, actual canonical bytes and lines, compatibility payload,
  ordered partition reassembly, and rebuilt expected index as applicable.
- One positive identity-parity test and seven independent negative tests cover
  every required dynamic field, including a coordinated false canonical-source
  and compatibility-payload SHA-256 mutation.
- The R2 schema, immutable-reader, append-stability, legacy-heading,
  decomposition, partition, compatibility, and reference-survival mechanisms
  remain in force.
- Unit 3 is `CLOSED / ACCEPTED / DIRECTLY VERIFIED` at
  `53899e30b72cde3d1f5759ea59fb0a4d632c974d`.
- The historical next action was direct supervisor review of the Unit 4
  contract correction.

## Binding rules

- `docs/governance/current-state.json` is the sole current-state authority.
- `PROJECT_STATE.md` and `AGENT_HANDOFF.md` are generated compatibility views
  and own no independent current facts.
- Authored normative specifications and contracts remain Markdown authority.
- Generated views own no independent facts and must be reproducible from structured sources.
- Source-manifest coverage must be exhaustive and non-overlapping; semantic
  mappings must remain explicitly reviewed and hash-bound to their source unit.
- Historical equivalence evidence is retained as structured, non-authoritative
  provenance and is not part of normal bootstrap.
- `AGENT_HANDOFF.md` is never a normative self-owner; every derived unit must
  resolve to an existing canonical owner or historical ledger/archive anchor.
- No cleanup, compaction, partitioning, archival, deletion, or deprecation occurs
  before unique-content and reference-survival proof.
- Every authority cutover requires a separate direct supervisor acceptance.
- This contract records the active authority-epoch-`1` model and the accepted Unit 4
  closeout. It does not authorize Unit 5,
  product changes, database access, deployment, production access, or real
  cutover.

## Unit 4 post-cutover acceptance closeout

External direct review accepted activation checkpoint `51a61ddfdbf058887ead64f9b018c30ebc371b48` and corrected
canonical checkpoint `7abaff26559c71b62337356eccd0baaf36b5f214`. Unit 4A, Unit 4B, Unit 4C, Unit 4D,
and the documentary-authority cutover are accepted. Authority epoch `1`, the
cutover ID `GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1`, and the original PONR remain unchanged. No second
activation or rollback occurred. Recovery remains forward-only. Unit 5 requires
its own order; only read-only diagnosis `GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-5-LEGACY-DEPRECATION-AND-POST-CUTOVER-AUDIT-DIAGNOSIS-R1` is next authorizable.
