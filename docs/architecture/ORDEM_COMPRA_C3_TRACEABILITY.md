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
NEXT_AUTHORIZABLE_ACTION: PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW
VALIDATION_ACCOUNTING_SUBJECT: fix: harden spec custody validation
VALIDATION_ACCOUNTING_SUBJECT_R2: fix: reject detached spec custody rows
VALIDATION_ACCOUNTING_SUBJECT_R3: fix: distinguish prose from detached tables
VALIDATION_ACCOUNTING_SUBJECT_R4: refactor: split spec custody validator
VALIDATION_ACCOUNTING_SUBJECT_R5: docs: accept state handoff compaction
VALIDATION_ACCOUNTING_SUBJECT_R6: docs: define C3C-B material phase contract
VALIDATION_ACCOUNTING_SUBJECT_R7: docs: forward-correct C3C-B material phase contract
VALIDATION_ACCOUNTING_SUBJECT_R8: docs: accept C3C-B contract, define DB prerequisites
VALIDATION_ACCOUNTING_SUBJECT_R9: docs: ratify C3C-B DB prerequisites architecture
VALIDATION_ACCOUNTING_SUBJECT_R10: feat: add C3C-B database prerequisites
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
| OC-C3-READ-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.2 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.smoke.js and tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | PHASE-C3C-B-DB-PREREQ Component A (canonical order-catalog projection listar_ordens_compra_fio_compat, db/76) is now IMPLEMENTED and LOCALLY VERIFIED by static smoke, AWAITING SUPERVISOR ACCEPTANCE (contract §35) and staging; DB-backed tests authored to §34.4 but not executed (local Postgres unstable). Not SATISFIED — the later PHASE-C3C-B application adapter that consumes it remains unauthorized. |
| OC-C3-WRITE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | PHASE-C3C-B-DB-PREREQ Component B (atomic legacy receipt-intent adapter registrar_recebimento_ordem_compra_fio_compat, db/76) is now IMPLEMENTED and LOCALLY VERIFIED by static smoke, AWAITING SUPERVISOR ACCEPTANCE (contract §35) and staging; DB-backed tests authored to §34.4 but not executed (local Postgres unstable). Not SATISFIED — the later PHASE-C3C-B application adapter that routes to it remains unauthorized. |
| OC-C3-COMPAT-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1 | C3C-B | BLOCKED | — | — | NOT_APPLIED | — | Exact C3C-B adapter scope is bound (docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md, ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES). The database prerequisites are now IMPLEMENTED and LOCALLY VERIFIED in db/76 (contract §35, IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE; §R.29.7/§13.18 applied); still BLOCKED pending PHASE-C3C-B-DB-PREREQ supervisor acceptance, staging validation, and then the C3C-B adapter implementation. |
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

C3C-B is the next product lot; its material phase contract is
`ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES`. The separate
`PHASE-C3C-B-DB-PREREQ` database-prerequisites contract is now **IMPLEMENTED and
LOCALLY VERIFIED** (`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
ACCEPTANCE`, `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
§35): migration `db/76` (Component A + Component B, both inert until
`canonical_active`, plus one additive `idempotency_namespace` `CHECK`), the three
contracted tests, and the applied `§R.29.7`/`§13.18` normative deltas. An
architect ruling (§35) resolved an installed shape-guard finding by reusing the
native command types and carrying compat identity in the idempotency namespace
(no `recebimento_compat`). `OC-C3-COMPAT-001` remains `BLOCKED`; no dependent
requirement is `SATISFIED`. The remaining sequence is:
`PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW`; supervisor acceptance; separately
authorized staging validation/application; and only then the later `PHASE-C3C-B`
application adaptation. C3D, staging application/validation, deployment,
activation, real snapshot/import, fence transition, read switch, final
ACL-closure invocation, cutover, C4, C5, production, Supabase writes, `main`,
remotes, and any push beyond the authorized `staging/dev` fast-forward remain
unauthorized.

## Material phase contract reference

`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (authored by
`C3C-B-MATERIAL-PHASE-CONTRACT-R1`, docs-only) binds the four `OC-C3-*` rows
above to an exact repository scope, dependency inventory, implementation-file
manifest, and hard stops for a future `PHASE-C3C-B` implementation order. A
read-only supervisor review returned `CHANGES_REQUIRED`; the resulting forward
correction (§§0, 25–30 of that file) was accepted by the supervisor as
`STATUS: ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
AUTHORIZED` (§31 of that file) — the contract's diagnosis is accepted, but
`PHASE-C3C-B` implementation remains unauthorized and is additionally blocked
pending the database prerequisites below. `ACTIVE_PHASE` and
`ACTIVE_PHASE_CONTRACT` remain `NONE` in `PROJECT_STATE.md`.

`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
(`PHASE_ID: PHASE-C3C-B-DB-PREREQ`, authored by
`C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1`, docs-only) defines the two
blocking database components (Component A — canonical order-catalog
projection; Component B — atomic legacy receipt-intent adapter) required to
close `OC-C3-READ-001`/`OC-C3-WRITE-001`/`OC-C3-COMPAT-001`'s residual debts
above, to migration-ready precision. Its R2 architecture was accepted in §34, and
`PHASE-C3C-B-DB-PREREQ` implementation is now
`STATUS: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`
(that file's §35): migration `db/76` (Component A + Component B, both
inert-until-`canonical_active`; two functions plus one additive
`idempotency_namespace` `CHECK`, no bridge/backfill/`db/67`/`db/75` change), the
three contracted tests, and the applied `§R.29.7`/`§13.18` deltas. §35 records the
architect ruling that legacy-compat receipts reuse the native command types and
carry compat identity solely in `idempotency_namespace='legacy_compat_receipt_v1'`
(no `recebimento_compat`; the shape guard unchanged). Corpus
completeness/freeze/re-baseline remain deferred to the real-cutover/C3D band. The
phase is not accepted; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`;
`PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW` is the next authorizable action.
