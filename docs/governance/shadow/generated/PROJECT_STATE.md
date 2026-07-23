# PROJECT_STATE shadow view
<!-- GENERATED SHADOW VIEW — NON-CANONICAL — DO NOT EDIT -->

MODE: shadow
AUTHORITY: non_canonical_until_supervisor_cutover
STATE_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-STATE-R1

## Repository
- Branch: dev
- Checkpoint remote: staging/dev

## Accepted checkpoints
- Product: 3405fdab8e05ec0f81cbfe07c63c489e551fee92
- Clean-slate readiness: 62bdcc75c335e3881adb1af6350de801675aa788
- Clean-slate execution: 770772548baf04c52e9ef020ff94f8bdabf77f03

## Active phase and next action
- Phase: GOVERNANCE-EFFICIENCY-REFOUNDATION
- Contract: docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_PHASE_CONTRACT.md
- Status: ACTIVE / UNIT 4 CONTRACT CORRECTED / AWAITING DIRECT SUPERVISOR REVIEW
- Last accepted phase: PHASE-C5
- Next action: DIRECT SUPERVISOR REVIEW OF GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4-CONTRACT-COMMIT-BINDING-AND-CANDIDATE-PATH-CORRECTION-R2
- Risk class: R0
- Gate: DIRECT SUPERVISOR REVIEW REQUIRED
- Track: PURCHASE_ORDER_PHASE_C

## Governing pointers
- governing_spec: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
- technical_contract: docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md
- sequence_authority: docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
- traceability: docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md
- ledger: docs/ledgers/G28_LEDGER.md
- handoff: AGENT_HANDOFF.md

## Environment boundaries
- Shared development: ucrjtfswnfdlxwtmxnoo
- Production: gqmpsxkxynrjvidfmojk
- Forbidden project: bhgifjrfagkzubpyqpew

## Protected residue
- .gitignore: pre-existing modified residue; preserve exactly
- .codex/config.toml: pre-existing untracked residue; preserve exactly
- .mcp.json: pre-existing untracked residue; preserve exactly

## Blocking debts
- INGESTOR-DOC-CYCLE-VERIFY-DEFERRED (PROJECT_STATE.md): active production blocker
- CAMADA3-BK5-BK8 (PROJECT_STATE.md): open
- DELETE-PROD-GUARD-A (PROJECT_STATE.md): open
- HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE (PROJECT_STATE.md): open
- NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED (PROJECT_STATE.md): open
- C3D-13-UNMAPPED-ROWS-COMPLETENESS-GATE (PROJECT_STATE.md): open

## Prohibitions
- NO DATABASE ACCESS, SQL, MIGRATIONS, OR PRODUCT IMPLEMENTATION
- NO PRODUCTION ACCESS OR FORBIDDEN-PROJECT ACCESS
- NO DOCUMENTARY-AUTHORITY CUTOVER OR REPLACEMENT OF ROOT STATE/HANDOFF
- NO CLEANUP, COMPACTION, PARTITIONING, ARCHIVAL, DEPRECATION, OR DELETION
- NO REAL_CUTOVER OR PHASE-C5B AUTHORIZATION
- NO PUSH OTHER THAN THE SINGLE EXPLICIT FAST-FORWARD STAGING PUSH

This is a generated compatibility view. It owns no independent facts; consult the canonical documents and Git directly.
