# Current State
<!-- GOVERNANCE_GENERATED_VIEW:BEGIN -->

STATUS: ACTIVE_GENERATED_COMPATIBILITY_VIEW
STRUCTURED_SOURCE: docs/governance/current-state.json
RENDERER: scripts/governance/render-unit4-canonical-views.mjs
SCHEMA_VERSION: 2.0.0
AUTHORITY_EPOCH: 1
CUTOVER_ID: GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1
SOURCE_PAYLOAD_SHA256: bc1e35f24df7301ee97ce4e75da411e2fb89d6204843e98ed7f875c8168f21eb

<!-- GOVERNANCE_GENERATED_VIEW:END -->

This compatibility view owns no facts. `docs/governance/current-state.json` is canonical.

## Activation

- Status: `active`
- Authority epoch: `1`
- Cutover ID: `GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4C-AUTHORITY-CUTOVER-R1`
- Active phase: `UNIT 4 CLOSED / UNIT 5 DIAGNOSIS PRECONDITION CORRECTED / R2 NEXT AUTHORIZABLE`

## Accepted checkpoints

- clean_slate_execution: `770772548baf04c52e9ef020ff94f8bdabf77f03`
- clean_slate_readiness: `62bdcc75c335e3881adb1af6350de801675aa788`
- governance_unit_1: `39abf42a7341b61fd4ac02a8e38d1e4f33471f0f`
- governance_unit_2: `f7106977f4613de1830bef46002dbf0a4b8b3cbe`
- governance_unit_3: `53899e30b72cde3d1f5759ea59fb0a4d632c974d`
- product: `3405fdab8e05ec0f81cbfe07c63c489e551fee92`
- unit_4_contract: `76f52c842678b74e655ef9080f4fc67ccbd38e22`
- unit_4a_readiness: `fa986cf935abbf053172cfd549b0171bb9446f58`
- unit_4b_readiness: `fa986cf935abbf053172cfd549b0171bb9446f58`
- unit_4c_activation: `51a61ddfdbf058887ead64f9b018c30ebc371b48`
- unit_4c_canonical_correction: `7abaff26559c71b62337356eccd0baaf36b5f214`
- unit_4d_acceptance: `7abaff26559c71b62337356eccd0baaf36b5f214`

## Next authorized action

- `GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-5-LEGACY-DEPRECATION-AND-POST-CUTOVER-AUDIT-DIAGNOSIS-R2`
- Mode: `READ_ONLY_DIAGNOSIS`
- Status: `AUTHORIZABLE AFTER DIRECT REVIEW / UNIT 5 IMPLEMENTATION NOT AUTHORIZED`

## Governing pointers

- canonical_ledger: `docs/ledgers/G28_LEDGER.md`
- current_state: `docs/governance/current-state.json`
- document_classification: `docs/governance/catalog/documents.json`
- governing_spec: `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
- handoff: `AGENT_HANDOFF.md`
- handoff_policy: `docs/governance/SUPERVISION_PROTOCOL.md`
- ledger: `docs/ledgers/G28_LEDGER.md`
- sequence_authority: `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
- technical_contract: `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
- traceability: `docs/governance/traceability/purchase-order-phase-c.json`
- traceability_authority: `docs/governance/traceability/purchase-order-phase-c.json`
- unit_4_contract: `docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md`

## Blockers and debts

- `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`: active production blocker; blocking=true; owner=`docs/governance/current-state.json`.
- `CAMADA3-BK5-BK8`: open; blocking=true; owner=`docs/governance/current-state.json`.
- `DELETE-PROD-GUARD-A`: open; blocking=true; owner=`docs/governance/current-state.json`.
- `CODE-HEALTH-AUDIT-18-R1`: open; blocking=false; owner=`docs/governance/current-state.json`.
- `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`: open; blocking=true; owner=`docs/governance/current-state.json`.
- `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`: open; blocking=true; owner=`docs/governance/current-state.json`.
- `C3D-13-UNMAPPED-ROWS-COMPLETENESS-GATE`: open; blocking=true; owner=`docs/governance/current-state.json`.

## Prohibitions

- `NO DATABASE ACCESS, SQL, MIGRATIONS, OR PRODUCT IMPLEMENTATION`
- `NO PRODUCTION ACCESS OR FORBIDDEN-PROJECT ACCESS`
- `NO CLEANUP, COMPACTION, PARTITIONING, ARCHIVAL, DEPRECATION, OR DELETION`
- `NO REAL_CUTOVER OR PHASE-C5B AUTHORIZATION`
- `NO PUSH OTHER THAN THE SINGLE EXPLICIT FAST-FORWARD STAGING PUSH`
- `UNIT_5`
- `SILENT_FALLBACK`
- `MANUAL_GENERATED_ROOT_EDIT`
- `UNIT_5_IMPLEMENTATION`

## Authority matrix

- `PROJECT_STATE.md`: GENERATED_CURRENT_STATE_COMPATIBILITY; generated=GENERATED; authoritative=false.
- `AGENT_HANDOFF.md`: GENERATED_OPERATIONAL_HANDOFF; generated=GENERATED; authoritative=false.
- `docs/DOCUMENTATION_INDEX.md`: GENERATED_CLASSIFICATION_COMPATIBILITY; generated=GENERATED; authoritative=false.
- `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`: GENERATED_TRACEABILITY_COMPATIBILITY; generated=GENERATED; authoritative=false.

## Bounded ledger references

- `G28-LEDGER-UNIT-0205` / `G28-LEDGER-PART-0012`: Unit 4A accepted readiness
- `G28-LEDGER-UNIT-0206` / `G28-LEDGER-PART-0012`: Unit 4C activation
- `G28-LEDGER-UNIT-0207` / `G28-LEDGER-PART-0012`: Unit 4C consistency correction
- `G28-LEDGER-UNIT-0208` / `G28-LEDGER-PART-0012`: Unit 4D acceptance
- `G28-LEDGER-UNIT-0209` / `G28-LEDGER-PART-0012`: Unit 5 diagnosis precondition authority-consumer correction
