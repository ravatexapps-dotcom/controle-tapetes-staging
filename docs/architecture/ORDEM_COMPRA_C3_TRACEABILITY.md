# Purchase Order Phase-C Active Traceability

> **Role:** derived active-track traceability. Normative semantics remain in
> `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `PEDIDO_OP_SCHEMA_CONTRACT.md`. This matrix neither creates architecture nor
> authorizes a phase.

```text
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
LAST_ACCEPTED_PHASE: PHASE-C3C-B
ACTIVE_PHASE: PHASE-C3D
ACTIVE_PHASE_CONTRACT: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md
CLOSED_MATERIAL_PHASES: PHASE-C3C-A, PHASE-C3C-B-DB-PREREQ, PHASE-C3C-B
ACCEPTED_C3D_SUBLOTS: PHASE-C3D-A (096cd60325e4987010d328c856ee6a3a51ca66bf), PHASE-C3D-B (5441321014883c4e8149dc8b20da9d053a193699), PHASE-C3D-C (6fd63a56a123d6d006353c6ae629611cbc7c01e9) — CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED accepted sublots inside the active PHASE-C3D material contract; PHASE-C3D-D is IMPLEMENTED / LOCALLY VERIFIED / CHANGES_REQUIRED RESOLVED / AWAITING SUPERVISOR ACCEPTANCE (contract §V corrected §W — runtime role matrix now bound to the simulated ACL closure in one outer transaction + nested savepoint); PHASE-C3D itself is NOT closed
NEXT_AUTHORIZABLE_ACTION: read-only supervisor review of the corrected PHASE-C3D-D effective-ACL and role-matrix rehearsal evidence (ORDEM_COMPRA_C3D_PHASE_CONTRACT.md §V, corrected §W); PHASE-C3D-E and every later sublot remain unauthorized
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
VALIDATION_ACCOUNTING_SUBJECT_R16: fix: preserve C3C-B receipt idempotency attempts
VALIDATION_ACCOUNTING_SUBJECT_R17: docs: accept C3C-B and define C3D contract
VALIDATION_ACCOUNTING_SUBJECT_R18: docs: correct C3D contract boundaries
VALIDATION_ACCOUNTING_SUBJECT_R19: docs: finalize C3D contract execution boundaries
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
| OC-C3-READ-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.2 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; js/screens/ordem-compra-receipt-cutover.js, js/screens/pedido-detail-data.js, js/screens/op-nova.js, js/screens/fornecedor.js (PHASE-C3C-B §32 canonical-first reader adaptation) | tests/ordem-compra-c3c-inactive.smoke.js and tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-receipt-cutover.smoke.js, tests/pedido-detail.smoke.js, tests/op-nova.smoke.js, tests/fornecedor-screens.smoke.js | LOCAL_POSTGRES_18_4_ONLY (db/76) plus LOCAL_ONLY (application adapter, faithful Node test doubles) | 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f | PHASE-C3C-B application adaptation is CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED (supervisor-accepted 2026-07-21, contract §36): both independent readers attempt the canonical projection first and fall back byte-identically on `listar_compat_inativo` or the bounded 42883 interval; canonical branch verified only under mocked RPC responses. Not SATISFIED — real `canonical_active` verification is C3D/real-cutover territory (owned by PHASE-C3D), out of this phase's scope; db/76 remains unapplied to any staging database. |
| OC-C3-WRITE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3C-B | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; js/screens/ordem-compra-receipt-cutover.js, js/screens/op-writes.js, js/screens/fornecedor.js, js/screens/op-persistir.js, js/screens/op-recalculo.js (PHASE-C3C-B §32 canonical-first writer adaptation + legacy_receipt_fenced defensive handling) | tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-receipt-cutover.smoke.js, tests/op-writes.smoke.js, tests/fornecedor-screens.smoke.js, tests/op-persistir.smoke.js, tests/op-recalculo.smoke.js | LOCAL_POSTGRES_18_4_ONLY (db/76) plus LOCAL_ONLY (application adapter, faithful Node test doubles) | 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f | PHASE-C3C-B application adaptation is CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED (supervisor-accepted 2026-07-21, contract §36): all three independent writer call-sites (op-writes.js, fornecedor.js, op-persistir.js source rows) route through the state-aware pattern or carry an explicit DB-fence-only disablement (op-recalculo.js saldo write); every fail-closed code (`sem_permissao`, `estado_invalido`, `mapeamento_compat_ausente`, `decremento_exige_admin`, `reducao_abaixo_saldo_importado`, `idempotencia_conflitante`, etc.) never falls back. Not SATISFIED — real `canonical_active` verification is C3D/real-cutover territory (owned by PHASE-C3D); db/76 remains unapplied to any staging database. |
| OC-C3-COMPAT-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.1 | C3C-B | PARTIALLY_SATISFIED | docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md §§32/34/35/36 (activation + supervisor-review corrections + acceptance) + the ten authorized product paths | Full mandatory Node suite: 122-failure set, byte-identical failing-name differential before/after the final correction (zero regressions); node scripts/validate-spec-custody.mjs PASS | LOCAL_ONLY | 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f | The two database prerequisites (db/76 Component A/B) are CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED and applied+accepted inert in the development database (contract §§35–39); §32 activated and this pass's implementation (contract §33), corrected by §34/§35, was supervisor-accepted by §36 (CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED, 2026-07-21). Every discovered dependency carries an explicit disposition (adapter, verification-only, or out-of-scope); no undisposed direct legacy caller remains. Not SATISFIED — mapping completeness/freeze/re-baseline remain C3D/real-cutover scope; db/76 remains unapplied to any staging database. |
| OC-C3-NOUI-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C3C-B | PARTIALLY_SATISFIED | No UI artifact in C3C-A; PHASE-C3C-B added no route, screen, modal, or interaction — js/router.js and js/boot.js are byte-unchanged | Static manifest verification; index.html diff is exactly one added `<script>` line, no other line changed; UI-inertness accepted at contract §36.3 | LOCAL_ONLY | 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f | The no-new-UI boundary remains binding through later C3 work; PHASE-C3C-B preserved it (supervisor-accepted 2026-07-21, contract §36) — verified by diff, not screenshot, since no pixel was expected to change. Not SATISFIED — later C3D/C4 UI boundaries remain owned by their phases. |
| OC-C3D-DEPLOY-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29 | C3D | SATISFIED | scripts/c3d/bootstrap-disposable-cluster.mjs; tests/ordem-compra-c3d-deploy.smoke.js; tests/ordem-compra-c3d-deploy.integration.sql; db/75_ordem_compra_c3c_inactive_cutover.sql; db/76_ordem_compra_c3c_b_db_prerequisites.sql; accepted application artifact 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f | C3D-A checkpoint 096cd60325e4987010d328c856ee6a3a51ca66bf; C3D-B checkpoint 5441321014883c4e8149dc8b20da9d053a193699; two fresh PostgreSQL 18.4 disposable-cluster rehearsals; complete ordered db/01…db/76 application; inactive Component A/B evidence; db/76 reapplication evidence; db/75 ordered-single-application classification; application fallback evidence; shared-development read-only evidence; exact full-suite added-failure set = empty | DISPOSABLE_LOCAL_POSTGRES_18_4 + DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY | 5441321014883c4e8149dc8b20da9d053a193699 | no state-changing rehearsal against a shared or production database; the validator self-test active-contract fixture limitation remains a pre-existing governance-harness debt; real cutover remains separately unauthorized |
| OC-C3D-FENCE-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.3 | C3D | SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-c3d-fence.integration.sql | implementation checkpoint a4b2e13bf0d9fb19b0ee69196f21d86f4904961e; targeted evidence-correction checkpoint 6fd63a56a123d6d006353c6ae629611cbc7c01e9; database-faithful authenticated admin and matching-supplier exact fence denial (SQLSTATE 55000 / legacy_receipt_fenced, no 42501, zero mutation); 8 protected tables × INSERT/UPDATE/DELETE = 24/24 structural probes; four ordem_compra_c3c_assert_snapshot_and_live checkpoints; byte-identical frozen snapshot/inventory evidence anchor; full-content business fingerprints for all eleven business/receipt/ledger/movement tables; installed trigger-depth-exception catalog proof; pre-PONR rollback to maintenance_fenced/flat (no return to legacy_active, unchanged grants/policies); captured test-backend termination proof; two fresh disposable-cluster runs; read-only shared-development invariance | DISPOSABLE_LOCAL_POSTGRES_18_4 + DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY | 6fd63a56a123d6d006353c6ae629611cbc7c01e9 | legitimate nested canonical-active saldo_fios/saldo_fios_op runtime remains owned by PHASE-C3D-E; real cutover remains separately unauthorized; the 13 unmapped rows remain a real-cutover completeness item; the validator self-test active-contract fixture limitation remains a governance-harness debt |
| OC-C3D-ACL-001 | docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md::13.15.2 | C3D | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; tests/ordem-compra-c3d-acl.integration.sql (PHASE-C3D-D, contract §V) | tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-c3d-acl.integration.sql — effective post-closure ACL matrix rehearsed WITHOUT invoking ordem_compra_c3c_close_final_acl (final_acl_closed_at proven NULL throughout the simulation): empirical pg_get_functiondef close_final_acl catalog proof; exact simulated table/column/sequence revokes + 11 PUBLIC-policy drops in one rolled-back transaction; post-simulation table (7 grant-revoked → zero to public/anon/authenticated/service_role), 11-column, 7-sequence, policy (zero PUBLIC / non-PUBLIC byte-identical), and function (owner-only no-EXECUTE vs Component A/B authenticated-only) matrices; retained-canonical-table grants byte-identical; four-actor direct-table 42501 probes; Component A/B eight-actor runtime matrix run WHILE the simulated closure remains active — inside a nested savepoint (c3dd_runtime_fixture) of the SAME outer closure-simulation transaction (contract §W correction), under a TEST-ONLY canonical_active fixture with productive_receipt_started_at NULL, plus pre-runtime/mid-runtime/no-drift/post-savepoint-rollback closure-active proofs; byte-identical catalog/business rollback; two fresh disposable-cluster runs; read-only shared-development invariance | DISPOSABLE_LOCAL_POSTGRES_18_4 + DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | PHASE-C3D-D (contract §V, corrected §W) is IMPLEMENTED / LOCALLY VERIFIED / CHANGES_REQUIRED RESOLVED / AWAITING SUPERVISOR ACCEPTANCE — not self-accepted, disposition/checkpoint held pending review. §W resolved one BLOCKING review finding: the catalog post-closure matrix and the Component A/B runtime role matrix had run in separate transactions, so the runtime matrix executed after the simulated ACL closure was already rolled back; the correction binds them into one outer closure-simulation transaction with the runtime fixture/matrix in a nested savepoint, re-verified across two fresh disposable clusters (db/75/db/76 byte-unchanged). Option 2 (disposable local PostgreSQL + read-only shared-DB inspection) is the selected and sole environment strategy; no state-changing ACL simulation ran against any shared or production database. Reported DOCUMENTARY deviation: the db/75 canonical_active CHECK requires final_acl_closed_at NOT NULL, so the TEST-ONLY runtime fixture sets synthetic markers (rolled back) while the closure simulation keeps final_acl_closed_at NULL and never invokes close_final_acl. Real staging/real-cutover role matrix and the real closure remain separately unauthorized. |
| OC-C3D-LOCK-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | C3D | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive-concurrency.mjs | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Inactive staging rehearsal remains pending. |
| OC-CUTOVER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | REAL_CUTOVER | PLANNED | — | — | NOT_EXECUTED | — | Single-window cutover remains separately unauthorized. |
| OC-CUTOVER-PONR-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | REAL_CUTOVER | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Real pre-PONR rollback and post-PONR operation are not authorized. |
| OC-C4-ADMIN-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | PLANNED | — | — | NOT_IMPLEMENTED | — | Admin receipt UI requires its own later phase. |
| OC-C4-SUPPLIER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | DEFERRED | — | — | NOT_IMPLEMENTED | — | Supplier UI remains explicitly deferred. |
| OC-C5-EMISSION-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.24.10 | C5 | PLANNED | — | — | NOT_ACTIVATED | — | Native emission remains a separate post-C4 gate. |

## Authorization boundary

`PHASE-C3C-B` (application compatibility/adaptation) is now **CLOSED /
ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED**, supervisor-accepted
2026-07-21 at checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
(`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36, over the §33
implementation and the §34/§35 corrections). Its database prerequisites remain
accepted: `PHASE-C3C-B-DB-PREREQ` is **CLOSED / TECHNICALLY ACCEPTED / LOCAL DB
VERIFIED / NOT APPLIED TO STAGING DATABASE**
(`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
§§35–37), and `db/75`+`db/76` are applied **inert** and supervisor-accepted in
the development/legacy database `ucrjtfswnfdlxwtmxnoo` (that contract §§38–39;
Supabase versions `20260720234958`/`20260720235820`, `legacy_active`/`flat`, both
`db/76` functions inert, zero business-data mutation — empirically re-confirmed
read-only this pass: 51 mapped + 13 unmapped flat rows ids 153–165, 0 receipt
rows). No dependent `OC-C3-*` requirement is `SATISFIED` — the four C3C-B rows
above remain `PARTIALLY_SATISFIED`, because real `canonical_active` read/write
proof and the real cutover boundary are owned by `PHASE-C3D` / real cutover and
`db/76` remains unapplied to any staging database.

The `PHASE-C3D` material phase contract
(`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`) is **ACCEPTED** and
active. Its sublots `PHASE-C3D-A` (checkpoint
`096cd60325e4987010d328c856ee6a3a51ca66bf`), `PHASE-C3D-B` (checkpoint
`5441321014883c4e8149dc8b20da9d053a193699`), and `PHASE-C3D-C` (checkpoint
`6fd63a56a123d6d006353c6ae629611cbc7c01e9`) are all **CLOSED / TECHNICALLY
ACCEPTED / LOCALLY VERIFIED** (contract §R accepts C3D-A/C3D-B; §U accepts
C3D-C). The accepted C3D-A + C3D-B evidence advanced `OC-C3D-DEPLOY-001` to
**`SATISFIED`**, and the accepted C3D-C fence/rollback evidence advanced
`OC-C3D-FENCE-001` to **`SATISFIED`** (rows above). `PHASE-C3D-D` (effective ACL
and role-matrix rehearsal, contract §V, `tests/ordem-compra-c3d-acl.integration.sql`)
is **`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`** — not
self-accepted; `OC-C3D-ACL-001` remains `PARTIALLY_SATISFIED` pending that
review. `PHASE-C3D` itself is **not** closed — `OC-C3D-ACL-001`/`OC-C3D-LOCK-001`
remain `PARTIALLY_SATISFIED`. The next authorizable action is the **read-only
supervisor review of the `PHASE-C3D-D` evidence** (contract §V). `PHASE-C3D-E`
and `PHASE-C3D-F`, staging validation/application of `db/76`, activation,
deployment, real snapshot/import, fence transition, read switch, final
ACL-closure invocation, cutover, branch creation, C4, C5, production access,
Supabase writes to any target, `main`, other remotes, and any push beyond the
authorized `staging/dev` fast-forward for this pass remain **unauthorized**.

## Material phase contract reference

`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (authored by
`C3C-B-MATERIAL-PHASE-CONTRACT-R1`, docs-only) binds the four `OC-C3-*` rows
above to an exact repository scope, dependency inventory, implementation-file
manifest, and hard stops for a future `PHASE-C3C-B` implementation order. A
read-only supervisor review returned `CHANGES_REQUIRED`; the resulting forward
correction (§§0, 25–30 of that file) was accepted by the supervisor as
`STATUS: ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
AUTHORIZED` (§31 of that file); §32 later activated the phase once the database
prerequisites were applied and accepted, §33 implemented it, §34/§35 corrected
it, and **§36 records supervisor acceptance** — the contract is now `CLOSED /
ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` at checkpoint
`22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` (2026-07-21). `ACTIVE_PHASE` and
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

`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C3D`,
authored 2026-07-21 by `docs: accept C3C-B and define C3D contract`, docs-only +
read-only diagnosis) binds the four `OC-C3D-*` rows above
(`OC-C3D-DEPLOY-001`/`OC-C3D-FENCE-001`/`OC-C3D-ACL-001`/`OC-C3D-LOCK-001`) to an
isolated-rehearsal scope (six proposed sublots C3D-A…C3D-F), an environment
strategy (disposable local PostgreSQL + read-only shared-DB inspection
recommended; an isolated Supabase branch is `UNPROVEN` and not created),
entry/exit gates, a test matrix, the recovery/PONR model, exact future manifests,
and the mandatory supervisor decisions. It creates no requirement, changes no
anchor, and authorizes no implementation or environment action; every `OC-C3D-*`
disposition above is unchanged.

A read-only supervisor review of that proposal returned **`CHANGES_REQUIRED`**
for four material contradictions, forward-corrected the same day
(`docs: correct C3D contract boundaries`, contract §0): (1) the proposal
incorrectly implied no `OC-C3D-*` requirement could become `SATISFIED` before
real cutover — corrected so each is owned by `PHASE-C3D` and may become
`SATISFIED` by its own isolated-rehearsal evidence (§M); (2) the fence proof
conflated the real admin/supplier application paths (which write only
`ordens_compra_fio`, verified read-only against `js/screens/op-writes.js` and
`js/screens/fornecedor.js`) with direct client authority over all eight
protected tables — corrected into two evidence classes, a real actor-path
proof and an owner-level structural eight-table probe (§G.5A/§G.5B); (3) a
required concurrent-Component-B proof contradicted an unqualified "PONR = NONE
in C3D" — corrected: C3D may cross the receipt PONR only inside a disposable,
isolated rehearsal cluster, exclusively for the C3D-E concurrency proof,
followed by mandatory full cluster destruction, forbidden on any shared or
real environment (§H/§L); (4) the exact-manifest section authorized the open
directory `scripts/c3d/` — corrected to the exact file
`scripts/c3d/bootstrap-disposable-cluster.mjs` (§I). A **second** read-only
supervisor review of the R1-corrected contract (commit `6b7d48a`) returned
`CHANGES_REQUIRED` again, forward-corrected the same day
(`docs: finalize C3D contract execution boundaries`, contract §0b): (5) added
an exact **common documentary manifest** applicable to each of C3D-A…E so a
completed sublot may record its technical checkpoint, evidence, affected
requirement rows, current/next state, and handoff without waiting for C3D-F —
without self-accepting or authorizing the next sublot (§C, §I); (6) reclassified
the C3D-C fence proof from an application/browser end-to-end proof to a
**`DATABASE-FAITHFUL AUTHENTICATED ACTOR-CONTEXT PROOF`** — a SQL-only test in
the disposable cluster reproducing the exact application flat-`UPDATE` shape on
`ordens_compra_fio` (admin `js/screens/op-writes.js` L92–99; matching-supplier
`js/screens/fornecedor.js` L523–525) under synthetic authenticated admin and
supplier contexts, denied `legacy_receipt_fenced`/`55000`, with no browser/app
execution and no client-grant widening (§C, §E, §G.5A, §I, §M); plus a
wildcard-wording correction (wildcards appear only in read-only/prohibited
patterns — `NO WILDCARD OR DIRECTORY-LEVEL WRITE AUTHORIZATION EXISTS`). No
`OC-C3D-*` disposition changed by the authoring or either correction pass.
The contract was subsequently **accepted** (§0c) and executed sublot by sublot:
`PHASE-C3D-A` (environment & deployment-manifest qualification, §O/§P) and
`PHASE-C3D-B` (inactive migration & application-presence validation, §Q) are
both `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` (supervisor acceptance
recorded at §R, checkpoints `096cd603…` and `5441321…`); `OC-C3D-DEPLOY-001` is
now `SATISFIED`; the §G item 9 pre-PONR rollback semantics were corrected (§R.2:
rollback restores `flat` read authority only, keeps `status=maintenance_fenced`,
does not return to `legacy_active`, and does not restore flat grants/policies).
`PHASE-C3D-C` (fence and pre-PONR rollback rehearsal, §S corrected §T,
`tests/ordem-compra-c3d-fence.integration.sql`) is now `CLOSED / TECHNICALLY
ACCEPTED / LOCALLY VERIFIED` (supervisor acceptance recorded at §U, checkpoint
`6fd63a56…`), advancing `OC-C3D-FENCE-001` to `SATISFIED`. `PHASE-C3D-D`
(effective ACL and role-matrix rehearsal, §V,
`tests/ordem-compra-c3d-acl.integration.sql`) is `IMPLEMENTED / LOCALLY VERIFIED
/ AWAITING SUPERVISOR ACCEPTANCE` — not self-accepted; `OC-C3D-ACL-001` remains
`PARTIALLY_SATISFIED`. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `PHASE-C3D` /
this contract's path in `PROJECT_STATE.md`. The read-only supervisor review of
the `PHASE-C3D-D` evidence is the next authorizable action; `PHASE-C3D-E` and
every later sublot remain unauthorized.
