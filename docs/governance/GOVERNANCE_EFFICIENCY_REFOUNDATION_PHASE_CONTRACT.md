# Governance Efficiency Refoundation — Phase Contract

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION
<!-- MATERIAL_PHASE_CONTRACT:END -->

STATUS: ACTIVE / SHADOW IMPLEMENTATION IN PROGRESS

UNIT 1 STATUS: CLOSED / ACCEPTED / DIRECTLY VERIFIED

GOVERNANCE-EFFICIENCY-REFOUNDATION: ACTIVE

UNIT 1: CLOSED / ACCEPTED / DIRECTLY VERIFIED

UNIT 1 ACCEPTED CHECKPOINT: 39abf42a7341b61fd4ac02a8e38d1e4f33471f0f

STRUCTURED SOURCES: NON-CANONICAL SHADOW MODE

CURRENT CANONICAL OWNERS: UNCHANGED

UNIT 2: IMPLEMENTED / SHADOW VALIDATED / AWAITING DIRECT SUPERVISOR REVIEW

DOCUMENTARY-AUTHORITY CUTOVER: NOT AUTHORIZED

The external supervisor ruling directly verified and accepted checkpoint
`39abf42a7341b61fd4ac02a8e38d1e4f33471f0f`; Unit 1 is closed and accepted.
This records external acceptance, not executor self-acceptance. Unit 2 adds the
reviewed document catalog, Phase-C traceability shadow, deterministic generated
views, reference validation, and immutable-commit validation. Structured sources
remain non-canonical and current canonical owners remain unchanged.

## Objective

Reduce governance bootstrap cost and duplicated current-state prose through a
reviewable, non-canonical shadow representation. Existing canonical documents
remain authoritative until each later authority cutover receives separate
supervisor acceptance.

## Material units

1. Structured current state plus state and handoff shadow views.
2. Structured document catalog, traceability generation, and validator refoundation.
3. Ledger partitioning plus a compatibility view.
4. Bootstrap and documentary-authority cutover.
5. Legacy deprecation, archival, and post-cutover audit.

## Unit 2 shadow implementation result

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
- Unit 2 is not accepted by this implementation. Unit 3, documentary-authority
  cutover, cleanup, compaction, partitioning, archival, deprecation, and deletion
  remain not authorized.

## Binding rules

- `PROJECT_STATE.md` remains the sole current-state authority during shadow mode.
- `AGENT_HANDOFF.md` remains the derived operational handoff during shadow mode.
- Authored normative specifications and contracts remain Markdown authority.
- Generated views own no independent facts and must be reproducible from structured sources.
- Source-manifest coverage must be exhaustive and non-overlapping; semantic
  mappings must remain explicitly reviewed and hash-bound to their source unit.
- `PROJECT_STATE.md` content not represented in structured state remains reported
  separately as retained canonical-owner content pending a later authorized unit.
- `AGENT_HANDOFF.md` is never a normative self-owner; every derived unit must
  resolve to an existing canonical owner or historical ledger/archive anchor.
- No cleanup, compaction, partitioning, archival, deletion, or deprecation occurs
  before unique-content and reference-survival proof.
- Every authority cutover requires a separate direct supervisor acceptance.
- This contract authorizes shadow implementation only; it does not authorize
  product changes, database access, deployment, production access, or real cutover.
