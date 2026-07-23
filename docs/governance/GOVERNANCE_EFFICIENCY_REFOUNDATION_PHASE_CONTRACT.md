# Governance Efficiency Refoundation — Phase Contract

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION
<!-- MATERIAL_PHASE_CONTRACT:END -->

STATUS: ACTIVE / SHADOW IMPLEMENTATION IN PROGRESS

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

## Binding rules

- `PROJECT_STATE.md` remains the sole current-state authority during shadow mode.
- `AGENT_HANDOFF.md` remains the derived operational handoff during shadow mode.
- Authored normative specifications and contracts remain Markdown authority.
- Generated views own no independent facts and must be reproducible from structured sources.
- No cleanup, compaction, partitioning, archival, deletion, or deprecation occurs
  before unique-content and reference-survival proof.
- Every authority cutover requires a separate direct supervisor acceptance.
- This contract authorizes shadow implementation only; it does not authorize
  product changes, database access, deployment, production access, or real cutover.
