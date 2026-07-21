# Purchase Order Phase-C Active Traceability

> **Role:** derived active-track traceability. Normative semantics remain in
> `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `PEDIDO_OP_SCHEMA_CONTRACT.md`. This matrix neither creates architecture nor
> authorizes a phase.

```text
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ
ACTIVE_PHASE: NONE
CLOSED_MATERIAL_PHASES: PHASE-C3C-A, PHASE-C3C-B-DB-PREREQ
NEXT_AUTHORIZABLE_ACTION: supervisor review/acceptance of the PHASE-C3C-B application-adapter implementation (docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md, IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE); only after that acceptance may C3D/staging validation of db/76 be authorized
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
VALIDATION_ACCOUNTING_SUBJECT_R11: test: complete C3C-B DB prerequisites validation
VALIDATION_ACCOUNTING_SUBJECT_R12: docs: accept C3C-B DB prerequisites
VALIDATION_ACCOUNTING_SUBJECT_R13: docs: record C3C database development application
VALIDATION_ACCOUNTING_SUBJECT_R14: docs: authorize C3C-B application adaptation
VALIDATION_ACCOUNTING_SUBJECT_R15: feat: adapt legacy purchase-order receipts for cutover
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
| OC-C3-READ-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.2 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; js/screens/ordem-compra-receipt-cutover.js, js/screens/pedido-detail-data.js, js/screens/op-nova.js, js/screens/fornecedor.js (PHASE-C3C-B §32 canonical-first reader adaptation) | tests/ordem-compra-c3c-inactive.smoke.js and tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-receipt-cutover.smoke.js, tests/pedido-detail.smoke.js, tests/op-nova.smoke.js, tests/fornecedor-screens.smoke.js | LOCAL_POSTGRES_18_4_ONLY (db/76) plus LOCAL_ONLY (application adapter, faithful Node test doubles) | 34d7d231d0875093bc2091f385c61cf35fa0b5cb | PHASE-C3C-B application-adapter implementation (this pass) is `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`: both independent readers attempt the canonical projection first and fall back byte-identically on `listar_compat_inativo` or the bounded 42883 interval; canonical branch verified only under mocked RPC responses. Not SATISFIED — real `canonical_active` verification is C3D/real-cutover territory, out of this phase's scope, and this implementation itself awaits supervisor acceptance; db/76 remains unapplied to staging. |
| OC-C3-WRITE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; js/screens/ordem-compra-receipt-cutover.js, js/screens/op-writes.js, js/screens/fornecedor.js, js/screens/op-persistir.js, js/screens/op-recalculo.js (PHASE-C3C-B §32 canonical-first writer adaptation + legacy_receipt_fenced defensive handling) | tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-receipt-cutover.smoke.js, tests/op-writes.smoke.js, tests/fornecedor-screens.smoke.js, tests/op-persistir.smoke.js, tests/op-recalculo.smoke.js | LOCAL_POSTGRES_18_4_ONLY (db/76) plus LOCAL_ONLY (application adapter, faithful Node test doubles) | 34d7d231d0875093bc2091f385c61cf35fa0b5cb | PHASE-C3C-B application-adapter implementation (this pass) is `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`: all three independent writer call-sites (op-writes.js, fornecedor.js, op-persistir.js source rows) route through the state-aware pattern or carry an explicit DB-fence-only disablement (op-recalculo.js saldo write); every fail-closed code (`sem_permissao`, `estado_invalido`, `mapeamento_compat_ausente`, `decremento_exige_admin`, `reducao_abaixo_saldo_importado`, `idempotencia_conflitante`, etc.) never falls back. Not SATISFIED — real `canonical_active` verification is C3D/real-cutover territory; this implementation awaits supervisor acceptance; db/76 remains unapplied to staging. |
| OC-C3-COMPAT-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1 | C3C-B | PARTIALLY_SATISFIED | docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md §32 (activation) + the ten authorized product paths | Full mandatory Node suite: identical 124-failure set vs the pre-phase baseline (byte-for-byte diff of failing-test names), zero regressions; node scripts/validate-spec-custody.mjs PASS | LOCAL_ONLY | 07fb4903eda67ac5e570ca505e09185b688b5277 | The two database prerequisites (db/76 Component A/B) are CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED and applied+accepted inert in the development database (contract §§35–39); §32 of docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md then activated and this pass implemented the application-adapter layer (`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`). Every discovered dependency carries an explicit disposition (adapter, verification-only, or out-of-scope); no undisposed direct legacy caller remains. Not SATISFIED — mapping completeness/freeze/re-baseline remain C3D scope, db/76 remains unapplied to staging, and this implementation awaits supervisor acceptance. |
| OC-C3-NOUI-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C3C-B | PARTIALLY_SATISFIED | No UI artifact in C3C-A; PHASE-C3C-B (this pass) added no route, screen, modal, or interaction — js/router.js and js/boot.js are byte-unchanged | Static manifest verification; index.html diff is exactly one added `<script>` line, no other line changed | LOCAL_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | The no-new-UI boundary remains binding through later C3 work; PHASE-C3C-B (this pass) preserved it — verified by diff, not screenshot, since no pixel was expected to change. |
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
`PHASE-C3C-B-DB-PREREQ` database-prerequisites contract is now **CLOSED /
TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING DATABASE**
(`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
§§35–37): migration `db/76` (Component A + Component B, both inert until
`canonical_active`, plus one additive `idempotency_namespace` `CHECK`), the three
contracted tests — the two DB-backed ones executed and PASSING against an
isolated disposable local PostgreSQL 18.4 cluster, including a real persisted
rollback rehearsal and reapply — and the applied `§R.29.7`/`§13.18` normative
deltas. An architect ruling (§35) resolved an installed shape-guard finding by
reusing the native command types and carrying compat identity in the
idempotency namespace (no `recebimento_compat`); one genuine `db/76` defect
(a PL/pgSQL column/OUT-parameter naming ambiguity in Component A) was found and
corrected during DB-backed validation (§36). The two C3C-A DB-backed
regressions remain genuinely unexecutable against any synthetic corpus — they
assert exact real historical aggregate values, a pre-existing characteristic
of those files, not a `db/76` defect (§36.6) — recorded as nonblocking C3C-A
fixture debt. Supervisor acceptance (§37) does not mark `OC-C3-COMPAT-001`
`SATISFIED`; it remains `BLOCKED`; no dependent requirement is `SATISFIED`.
The remaining sequence is: **supervisor review/acceptance of the applied
`db/75`+`db/76` development-database stack** — the separately authorized
development/legacy-database (`ucrjtfswnfdlxwtmxnoo`) application of
`db/75`→`db/76` was executed and verified inert on 2026-07-20 (`APPLIED /
DEVELOPMENT DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`, contract §38:
Supabase versions `20260720234958`/`20260720235820`, `legacy_active`/`flat`,
both `db/76` functions inert, zero business-data mutation, 13 unmapped
post-REFUND-A legacy flat rows recorded as a DOCUMENTARY C3D completeness
finding, no dependent requirement `SATISFIED`); and only after that acceptance
the later `PHASE-C3C-B` application adaptation. C3D, further
staging/deployment, activation, real snapshot/import, fence transition, read
switch, final ACL-closure invocation, cutover, C4, C5, production, Supabase
writes to any other target, `main`, remotes, and any push beyond the authorized
`staging/dev` fast-forward remain unauthorized.

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
`PHASE-C3C-B-DB-PREREQ` is now
`STATUS: CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO
STAGING DATABASE`
(that file's §§35–37): migration `db/76` (Component A + Component B, both
inert-until-`canonical_active`; two functions plus one additive
`idempotency_namespace` `CHECK`, no bridge/backfill/`db/67`/`db/75` change), the
three contracted tests — the two DB-backed tests executed and passing against an
isolated disposable local Postgres cluster, including a persisted rollback
rehearsal and reapply (§36) — and the applied `§R.29.7`/`§13.18` deltas. §35
records the architect ruling that legacy-compat receipts reuse the native
command types and carry compat identity solely in
`idempotency_namespace='legacy_compat_receipt_v1'` (no `recebimento_compat`; the
shape guard unchanged); §36 records one genuine `db/76` defect found and fixed
during DB-backed validation (a PL/pgSQL naming ambiguity in Component A) and the
pre-existing, unrelated limitation that the C3C-A DB-backed regressions cannot
run against any synthetic corpus, recorded as nonblocking C3C-A fixture debt;
§37 records supervisor acceptance — `db/76` is **not applied to any staging
database**. Corpus completeness/freeze/re-baseline remain deferred to the
real-cutover/C3D band. No dependent `OC-C3-*` requirement is `SATISFIED`;
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; a separately authorized
staging validation/application of `db/76` is the next authorizable action (no
existing canonical ID names this step; recorded descriptively, contract
§37.3).
