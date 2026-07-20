# Purchase Order Phase-C Active Traceability

> **Role:** derived active-track traceability. Normative semantics remain in
> `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `PEDIDO_OP_SCHEMA_CONTRACT.md`. This matrix neither creates architecture nor
> authorizes a phase.

```text
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
LAST_ACCEPTED_PHASE: PHASE-C3C-A
ACTIVE_PHASE: NONE
CLOSED_MATERIAL_PHASES: PHASE-C3C-A
NEXT_AUTHORIZABLE_ACTION: C3C-B-MATERIAL-PHASE-CONTRACT-R1-SUPERVISOR-REVIEW
VALIDATION_ACCOUNTING_SUBJECT: fix: harden spec custody validation
VALIDATION_ACCOUNTING_SUBJECT_R2: fix: reject detached spec custody rows
VALIDATION_ACCOUNTING_SUBJECT_R3: fix: distinguish prose from detached tables
VALIDATION_ACCOUNTING_SUBJECT_R4: refactor: split spec custody validator
VALIDATION_ACCOUNTING_SUBJECT_R5: docs: accept state handoff compaction
VALIDATION_ACCOUNTING_SUBJECT_R6: docs: define C3C-B material phase contract
```

## Accepted foundation

`PHASE-C3C-A` is `CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED /
INACTIVE / NOT APPLIED TO STAGING` at technical checkpoint
`89123729b3529fff6e4a2336bfec2907c4b94b4c`. It supplies the inactive database
foundation: state/fence, canonical database reader and commands, frozen snapshot,
idempotent import, reconciliation, locks, ACL-closure command, and recovery
boundaries. Application adapters, inactive staging deployment/rehearsal, real
cutover, C4 UI, and C5 emission remain incomplete or deferred as shown below.

## Requirement matrix

Allowed dispositions: `SATISFIED`, `PARTIALLY_SATISFIED`, `PLANNED`, `DEFERRED`,
`BLOCKED`, `NOT_APPLICABLE`, `SUPERSEDED`.

| REQUIREMENT_ID | NORMATIVE_ANCHOR | OWNING_PHASE | DISPOSITION | IMPLEMENTATION_ARTIFACT | TEST_OR_EVIDENCE | ENVIRONMENT | ACCEPTED_CHECKPOINT | RESIDUAL_DEBT |
|---|---|---|---|---|---|---|---|---|
| OC-C3-READ-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.2 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.smoke.js and tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Application consumers in §R.29.1 are not migrated. |
| OC-C3-WRITE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Legacy application callers are not routed or state-disabled. |
| OC-C3-COMPAT-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1 | C3C-B | PLANNED | — | — | NOT_APPLIED | — | Exact C3C-B adapter scope requires a separately accepted phase contract. |
| OC-C3-NOUI-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C3C-B | PARTIALLY_SATISFIED | No UI artifact in C3C-A | Static manifest verification | LOCAL_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | The no-new-UI boundary remains binding through later C3 work. |
| OC-C3D-DEPLOY-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29 | C3D | PLANNED | — | — | STAGING_NOT_APPLIED | — | Inactive deployment manifest and rehearsal remain unauthorized. |
| OC-C3D-FENCE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3D | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Required staging admin and matching-supplier empirical proof is pending. |
| OC-C3D-ACL-001 | docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md::13.15.2 | C3D | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.smoke.js and tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Staging role matrix and non-invoking closure rehearsal are pending. |
| OC-C3D-LOCK-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | C3D | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive-concurrency.mjs | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Inactive staging rehearsal remains pending. |
| OC-CUTOVER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | REAL_CUTOVER | PLANNED | — | — | NOT_EXECUTED | — | Single-window cutover remains separately unauthorized. |
| OC-CUTOVER-PONR-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | REAL_CUTOVER | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Real pre-PONR rollback and post-PONR operation are not authorized. |
| OC-C4-ADMIN-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | PLANNED | — | — | NOT_IMPLEMENTED | — | Admin receipt UI requires its own later phase. |
| OC-C4-SUPPLIER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | DEFERRED | — | — | NOT_IMPLEMENTED | — | Supplier UI remains explicitly deferred. |
| OC-C5-EMISSION-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.24.10 | C5 | PLANNED | — | — | NOT_ACTIVATED | — | Native emission remains a separate post-C4 gate. |

## Authorization boundary

C3C-B is the next product lot but is unauthorized and has no phase contract.
C3D, staging application/validation, deployment, activation, real snapshot/import,
fence transition, read switch, final ACL-closure invocation, cutover, C4, C5,
production, `main`, remotes, and push remain unauthorized.

## Material phase contract reference

`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (authored by
`C3C-B-MATERIAL-PHASE-CONTRACT-R1`, docs-only) binds the four `OC-C3-*` rows
above to an exact repository scope, dependency inventory, implementation-file
manifest, and hard stops for a future `PHASE-C3C-B` implementation order. It is
`STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT
AUTHORIZED` and authorizes no implementation by itself. `ACTIVE_PHASE` and
`ACTIVE_PHASE_CONTRACT` remain `NONE` in `PROJECT_STATE.md`; no disposition in
the requirement matrix above was changed by this reference.
