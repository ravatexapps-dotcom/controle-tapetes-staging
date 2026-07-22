# Purchase Order Phase-C Active Traceability

> **Role:** derived active-track traceability. Normative semantics remain in
> `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `PEDIDO_OP_SCHEMA_CONTRACT.md`. This matrix neither creates architecture nor
> authorizes a phase.

```text
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
LAST_ACCEPTED_PHASE: PHASE-C5
ACTIVE_PHASE: NONE
ACTIVE_PHASE_CONTRACT: NONE
CLOSED_MATERIAL_PHASES: PHASE-C3C-A, PHASE-C3C-B-DB-PREREQ, PHASE-C3C-B, PHASE-C3D, PHASE-C4, PHASE-C5A-DB-EMISSION-READINESS, PHASE-C5
ACCEPTED_C3D_SUBLOTS: PHASE-C3D-A (096cd60325e4987010d328c856ee6a3a51ca66bf), PHASE-C3D-B (5441321014883c4e8149dc8b20da9d053a193699), PHASE-C3D-C (6fd63a56a123d6d006353c6ae629611cbc7c01e9), PHASE-C3D-D (5a2be05c19a62346b906f7b3cbb0b89d07b3a571), PHASE-C3D-E (429aa3980c7027b9d872a1902e2f31f1a4a85a2a) — all CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED (C3D-D supervisor-accepted contract §X advancing OC-C3D-ACL-001 to SATISFIED; C3D-E supervisor-accepted contract §Z advancing OC-C3D-LOCK-001 to SATISFIED). PHASE-C3D-F (aggregate closeout, contract §Z) is CLOSED / ACCEPTED / DOCUMENTATION-ONLY; the aggregate PHASE-C3D material phase is CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED at accepted technical checkpoint 429aa3980c7027b9d872a1902e2f31f1a4a85a2a, all four OC-C3D-* SATISFIED
ACCEPTED_C4: PHASE-C4 (289b0cca66e9c057330a882f69da3476adf90469) — CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED (supervisor acceptance + mandatory architect visual validation, C4-CLOSEOUT-AND-C5-CONTRACT-R1 contract §0d, 2026-07-21; disposition restated per the direct-review ruling of C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1, 2026-07-22, which additionally recorded the nonblocking ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE debt, not corrected), advancing OC-C4-ADMIN-001 to SATISFIED
ACCEPTED_C5A: PHASE-C5A-DB-EMISSION-READINESS (implementation e7a8b76152f986c83e4ecfe9827346a4efa5ef08, shared-development validation d17b353ed3eca04225a7decb55f84ccd5817d085) — CLOSED / ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED (supervisor closeout, C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1, contract §25, 2026-07-22; disposition restated per the direct-review ruling of C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1, 2026-07-22); db/77 grants EXECUTE on emitir_ordem_compra(BIGINT) to authenticated (is_admin() gate unchanged, writer body byte-unchanged) and corrects obter_ordem_compra_admin/listar_ordens_compra_admin readiness derivation; applied byte-identical to ucrjtfswnfdlxwtmxnoo with the full contract §14 shared-environment evidence; resolved the PHASE-C5 §5/§18.2 BLOCKING_DATABASE_PREREQUISITE
ACCEPTED_C5: PHASE-C5 (3405fdab8e05ec0f81cbfe07c63c489e551fee92) — CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED (supervisor acceptance of the targeted-correction commit, C5-DOCUMENTATION-CLOSEOUT-R1, contract §25, 2026-07-22; over the C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1 implementation and the C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1 targeted correction). PHASE-C5 FUNCTIONAL GATE = PASS (the blocking defect C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION is resolved); PHASE-C5 VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT; advancing OC-C5-EMISSION-001 to SATISFIED
NEXT_AUTHORIZABLE_ACTION: direct supervisor review of the CLEAN-SLATE-TRANSACTIONAL-RESET tooling, real read-only archive, and disposable restore-drill evidence implemented by CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2 (docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md §21, entry checkpoint 21fe32bc4b37773d93cabeac3e7e09aca9079037): the five §10 tooling files are TOOLING_IMPLEMENTED; a real deterministic archive was generated READ-ONLY from ucrjtfswnfdlxwtmxnoo (rolled-back REPEATABLE READ READ ONLY transaction, zero mutation; aggregate SHA-256 337d23cd6426287053dcffe02512253c0e9e96874c6362d2823186b52094f593; verify-archive 330/330; B6 document_link_revision_ops = 10 across 4 distinct OPs 55/57/61/63; 16/20/25 identities) stored outside the repository; and the disposable restore/reset drill PASSED on a fresh PostgreSQL 18.4 cluster (preamble + db/01..77, terminal migration 20260722055832, restore-reset-restore-reset, cluster destroyed with proof; smoke+drill 56/56). The shared-development database was NOT mutated and its reset was NOT executed or authorized; OC-CUTOVER-001 stays PLANNED and REAL_CUTOVER stays NOT AUTHORIZED (this pass changes no requirement disposition). The clean-slate reset execution/shared-development deletion, PHASE-C5B-ACCEPTANCE-DECISION, any shared-database apply beyond db/77, staging validation/application, deployment, activation, production access, branch creation, and the REAL_CUTOVER window remain unauthorized; no push beyond the one authorized staging/dev fast-forward for this pass single commit; the phase is not CLOSED and no phase chains automatically
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
VALIDATION_ACCOUNTING_SUBJECT_R20: test: rehearse C3D purchase-order concurrency
VALIDATION_ACCOUNTING_SUBJECT_R21: docs: close C3D purchase-order rehearsal
VALIDATION_ACCOUNTING_SUBJECT_R22: docs: close C4 admin receipt UI
VALIDATION_ACCOUNTING_SUBJECT_R23: docs: define C5 purchase-order emission contract
VALIDATION_ACCOUNTING_SUBJECT_R24: docs: accept C5 emission contract
VALIDATION_ACCOUNTING_SUBJECT_R25: docs: define C5A emission database readiness contract
VALIDATION_ACCOUNTING_SUBJECT_R26: docs: accept C5A emission database readiness contract
VALIDATION_ACCOUNTING_SUBJECT_R27: db: add C5A emission readiness
VALIDATION_ACCOUNTING_SUBJECT_R28: docs: record C5A shared development validation
VALIDATION_ACCOUNTING_SUBJECT_R29: docs: close C5A and authorize C5 implementation
VALIDATION_ACCOUNTING_SUBJECT_R30: docs: define clean-slate transactional reset contract
VALIDATION_ACCOUNTING_SUBJECT_R31: docs: correct clean-slate reset contract
VALIDATION_ACCOUNTING_SUBJECT_R32: feat: add clean-slate reset tooling and restore drill
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
| OC-C3D-ACL-001 | docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md::13.15.2 | C3D | SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; tests/ordem-compra-c3d-acl.integration.sql (PHASE-C3D-D, §V corrected §W, supervisor-accepted §X) | tests/ordem-compra-c3c-inactive.integration.sql; tests/ordem-compra-c3d-acl.integration.sql — effective post-closure ACL matrix rehearsed WITHOUT invoking ordem_compra_c3c_close_final_acl (final_acl_closed_at proven NULL throughout the simulation): empirical pg_get_functiondef close_final_acl catalog proof; exact simulated table/column/sequence revokes + 11 PUBLIC-policy drops in one rolled-back transaction; post-simulation table (7 grant-revoked → zero to public/anon/authenticated/service_role), 11-column, 7-sequence, policy (zero PUBLIC / non-PUBLIC byte-identical), and function (owner-only no-EXECUTE vs Component A/B authenticated-only) matrices; retained-canonical-table grants byte-identical; four-actor direct-table 42501 probes; Component A/B eight-actor runtime matrix run WHILE the simulated closure remains active — inside a nested savepoint (c3dd_runtime_fixture) of the SAME outer closure-simulation transaction (contract §W correction), under a TEST-ONLY canonical_active fixture with productive_receipt_started_at NULL, plus pre-runtime/mid-runtime/no-drift/post-savepoint-rollback closure-active proofs; byte-identical catalog/business rollback; two fresh disposable-cluster runs; read-only shared-development invariance | DISPOSABLE_LOCAL_POSTGRES_18_4 + DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY | 5a2be05c19a62346b906f7b3cbb0b89d07b3a571 | PHASE-C3D-D (contract §V corrected §W) is CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED — supervisor-accepted at contract §X (accepted checkpoint 5a2be05c19a62346b906f7b3cbb0b89d07b3a571), advancing OC-C3D-ACL-001 to SATISFIED; concurrency, session/resource locking, legitimate nested saldo_fios/saldo_fios_op runtime, LIFO reversal and the imported-balance floor are owned by PHASE-C3D-E (contract §Y), not by C3D-D. §W resolved one BLOCKING review finding: the catalog post-closure matrix and the Component A/B runtime role matrix had run in separate transactions, so the runtime matrix executed after the simulated ACL closure was already rolled back; the correction binds them into one outer closure-simulation transaction with the runtime fixture/matrix in a nested savepoint, re-verified across two fresh disposable clusters (db/75/db/76 byte-unchanged). Option 2 (disposable local PostgreSQL + read-only shared-DB inspection) is the selected and sole environment strategy; no state-changing ACL simulation ran against any shared or production database. Reported DOCUMENTARY deviation: the db/75 canonical_active CHECK requires final_acl_closed_at NOT NULL, so the TEST-ONLY runtime fixture sets synthetic markers (rolled back) while the closure simulation keeps final_acl_closed_at NULL and never invokes close_final_acl. Real staging/real-cutover role matrix and the real closure remain separately unauthorized. |
| OC-C3D-LOCK-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | C3D | SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql; tests/ordem-compra-c3d-lock-concurrency.mjs (PHASE-C3D-E, contract §Y evidence, §Z acceptance) | tests/ordem-compra-c3c-inactive-concurrency.mjs; tests/ordem-compra-c3d-lock-concurrency.mjs — two fresh disposable local PostgreSQL 18.4 clusters: session advisory-lock deterministic key / same-generation exclusion / different-generation independence / release+reacquire / backend-disconnect auto-release / owner-only boundary / no-leak; the installed Component B resource-lock order (order → item → idempotency advisory → header lookup → allocations asc → ledger asc → inventory advisory) proven by empirical pg_get_functiondef and a real staged blocker (pg_blocking_pids, wait_event Lock/transactionid, rolled back pre-PONR, zero mutation); real session lock + real fence_and_snapshot + the accepted synthetic equivalent of import_and_reconcile (per-row import_snapshot_row + assert_snapshot_and_live) establishing a 5.000 kg immutable imported opening balance under a manual TEST-ONLY canonical_active state (close_final_acl/activate never invoked); a two-session Component B sequence crossing exactly one synthetic PONR per cluster with independent observer connections confirming the T1/T2 blocking relationship (T1 commits to 10.000; T2 waits then re-evaluates a fresh +5.000 to 15.000 — no stale 20.000, no deadlock); same-key idempotency replay + idempotencia_conflitante; the legitimate nested canonical-active ordem_compra_item/movement path at pg_trigger_depth()>1 with depth-1 denial 55000 (saldo_fios exception proven structurally — this fixture produces no excess; saldo_fios_op NOT_APPLICABLE — never written by the receipt path); deterministic LIFO reversal 15.000 → 8.000 (T2 5.000 then T1 2.000; T1 3.000 remaining; imported line untouched); imported-balance floor rejection at 4.000 (reducao_abaixo_saldo_importado, zero mutation); post-PONR prohibition compliance; mandatory full cluster destruction; read-only shared-development invariance | DISPOSABLE_LOCAL_POSTGRES_18_4 + DEVELOPMENT_DB_UCRJTFSWNFDLXWTMXNOO_READ_ONLY | 429aa3980c7027b9d872a1902e2f31f1a4a85a2a | PHASE-C3D-E (contract §Y evidence, §Z acceptance) is CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED at accepted checkpoint 429aa3980c7027b9d872a1902e2f31f1a4a85a2a — supervisor-accepted §Z, advancing OC-C3D-LOCK-001 to SATISFIED (its §M item 4 exit criteria met). Documentary precision: independent observer connections confirmed the T1/T2 blocking relationship — the captured observer marker session is closed before the pg_blocking_pids/pg_stat_activity observations, which run through independent transient queries. saldo_fios's excess branch was not empirically executed (kg_alocado 15.500 > maximum tested total 15.000, so no excess line was produced; the exception proven structurally and by the direct depth-1 denial) and saldo_fios_op is NOT_APPLICABLE to the installed receipt/reversal/import write topology — neither an OC-C3D-LOCK-001 §M exit criterion. Option 2 (disposable local PostgreSQL + read-only shared-DB inspection) is the selected and sole environment strategy. Real cutover, real close_final_acl/activate invocation, staging rehearsal, and shared-database state change remain separately unauthorized. |
| OC-CUTOVER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.5 | REAL_CUTOVER | PLANNED | — | — | NOT_EXECUTED | — | Single-window cutover remains separately unauthorized. Additionally BLOCKED from authorization until a separate read-only completeness diagnosis dispositions every one of the 13 unmapped ordens_compra_fio rows (exact ids 153–165, all rascunho/pendente/nao_recebido, kg_recebido NULL, outside the 51-row mapped/frozen corpus; Component A cannot project them and Component B fails mapeamento_compat_ausente) by exactly one of (1) authorized mapping/backfill and re-baseline, (2) documented exclusion with business-owner approval, or (3) cancellation/removal via a separately authorized business-data action — a residual-debt authorization prerequisite recorded at the PHASE-C3D-F closeout (contract §Z.3, 2026-07-21), not a requirement-disposition change (stays PLANNED). |
| OC-CUTOVER-PONR-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | REAL_CUTOVER | PARTIALLY_SATISFIED | db/75_ordem_compra_c3c_inactive_cutover.sql | tests/ordem-compra-c3c-inactive.integration.sql | LOCAL_POSTGRES_18_4_ONLY | 89123729b3529fff6e4a2336bfec2907c4b94b4c | Real pre-PONR rollback and post-PONR operation are not authorized. |
| OC-C4-ADMIN-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | SATISFIED | js/screens/ordem-compra-receipt-data.js, js/screens/ordem-compra-receipt-render.js, js/screens/ordem-compra-receipt-events.js (new); additive js/screens/ordem-compra.js + index.html (C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1, contract §0c) | tests/ordem-compra-receipt-data.smoke.js, tests/ordem-compra-receipt-render.smoke.js, tests/ordem-compra-receipt-events.smoke.js, tests/ordem-compra-receipt-routing.smoke.js (38/38 pass, incl. VISUAL-GATE-R1 --rv-* token + sticky-total assertions); full-suite added-failing-identity differential vs bdd4c7d2bc43bd054d7cbb2b0bd70e6234160c24 (implementation) and vs 25cbdd6f6128744a8668b034c192c7d012e58171 (visual correction) both = empty; deterministic six-PNG Playwright screenshots + computed-style evidence (ledger C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1); node scripts/validate-spec-custody.mjs PASS | LOCAL_ONLY | 289b0cca66e9c057330a882f69da3476adf90469 | CLOSED / ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED (C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1 implementation + C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1 visual-contract correction + C4-CLOSEOUT-AND-C5-CONTRACT-R1 supervisor acceptance, 2026-07-21; UI aligned to canonical --rv-* tokens — card 6px, neutral section chip, tabular right-aligned numerics, sticky total). Native RPCs only (obter_historico/registrar/estornar); no legacy compat RPC in the C4 call graph; two independent idempotency trackers. The mandatory architect visual validation (SUPERVISION_PROTOCOL §4) and supervisor acceptance are both satisfied (contract §0d); writer RPCs remain inert under legacy_active (fixture-level DOM/mocked-RPC evidence) — a residual environment-activation gap owned by OC-C5-EMISSION-001, not a C4 defect; the pre-existing pedido-modal/fornecedor legacy receipt UI is left in place (no decommission decision); the ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE debt is out of scope and untouched; new nonblocking debt SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT recorded (shared js/ui.js primitives ≈8px, outside the C4 manifest). |
| OC-C4-SUPPLIER-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.29.6 | C4 | DEFERRED | — | — | NOT_IMPLEMENTED | — | Supplier UI remains explicitly deferred. |
| OC-C5-EMISSION-001 | docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md::§R.24.10 | C5 | SATISFIED | js/screens/ordem-compra-data.js, js/screens/ordem-compra-render.js, js/screens/ordem-compra-events.js (additive only, C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1 + the C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1 targeted correction to js/screens/ordem-compra-events.js, contract §12/§24; no new product file; index.html/router.js/boot.js/common.js/ui.js and all db/*.sql byte-unchanged) | tests/ordem-compra-emitir.smoke.js (new faithful DOM/VM behavioral suite, §14 points 1–25, extended with the reload-failure/mismatched-identity/non-draft-non-emitted correction cases, 41/41 pass) + updated tests/ordem-compra.smoke.js tests 4–5; emitir + ordem-compra and the four C4 receipt suites green; full Node-suite added-failing-identity differential vs detached baseline worktrees at 538f4ba7b7aae5d6e9e0efbe29a57e1ef7bbc776 and e25361be80eed0c33f2544c58d2273572d0bd588 = empty; node scripts/validate-spec-custody.mjs PASS (--self-test fails only on the pre-existing active-contract fixture-harness limitation); deterministic offline Playwright visual evidence + computed styles, console/page errors empty | LOCAL_ONLY | 3405fdab8e05ec0f81cbfe07c63c489e551fee92 | CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED (C5-DOCUMENTATION-CLOSEOUT-R1 supervisor acceptance of the targeted-correction commit 3405fda, 2026-07-22, contract §25; over the C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1 implementation, commit feat: implement C5 purchase-order emission UI, and the C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1 targeted correction). PHASE-C5 FUNCTIONAL GATE = PASS (the blocking defect C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION is resolved); PHASE-C5 VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT. SATISFIED is the fixed-enum DISPOSITION-column value (ALLOWED_DISPOSITIONS, scripts/spec-custody/validation-core.mjs); the exact closeout compound label CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED is preserved verbatim in PROJECT_STATE.md, AGENT_HANDOFF.md, docs/ledgers/G28_LEDGER.md, and contract §25. Emission is driven exclusively by the server acoes.emitir signal via public.emitir_ordem_compra(BIGINT); the ratified CONTROLLED_IRREVERSIBLE_TRANSITION confirmation is primary/neutral (not destructive-red); status_aceite is surfaced with no acceptance/rejection control (PHASE-C5B). Native emission remains a separate post-C4 gate. At the §22 authorization point, docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md became ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY (§22, supervisor-authorized under C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1, 2026-07-22) — binding this requirement to an exact functional scope, state/action matrix, and purely-additive three-file manifest; it was subsequently implemented, targeted-corrected, directly accepted and closed under §25 (current disposition above). At §22 the former BLOCKING_DATABASE_PREREQUISITE classification was resolved because docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md is now CLOSED / ACCEPTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT VERIFIED (its own §25, supervisor closeout under the same order): db/77 grants EXECUTE on emitir_ordem_compra(BIGINT) to authenticated (terminally REVOKE ALL, db/74:1192-1193; is_admin() gate unchanged, writer body byte-unchanged) and corrects the terminal read models obter_ordem_compra_admin (db/69:987) / listar_ordens_compra_admin (db/69:913), which hard-coded pode_emitir/acoes.emitir=false, so they derive true for an eligible exige_aceite=FALSE native draft; allocation stays ALLOCATION_PATH_READY_AFTER_GRANT via the already-granted definir_alocacao_necessidade_compra_fio (db/74:1177); the superseded alocar_necessidade_compra_fio stays ungranted; acceptance disposition EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE unchanged; emission confirmation UX remains ratified CONTROLLED_IRREVERSIBLE_TRANSITION. db/77 was applied byte-identical to the authorized shared development database ucrjtfswnfdlxwtmxnoo (PostgreSQL 17.6, terminal migration 20260722055832, SHA-256 9628a947...) with the complete contract §14 shared-environment behavioral evidence (allocation writer; authorized authenticated emission; non-admin/anon denials; wrong-state/incomplete/missing-supplier/zero-item/over-allocation denials; duplicate allocation/emission idempotency; one audit event; nao_aplicavel acceptance with no fabricated decision; detail+list read-model readiness; exige_aceite gate; inert states; atomic invariance; cutover fence proved non-persistently); zero validation-fixture residue; cutover unchanged legacy_active; REAL_CUTOVER not activated; production not accessed. The forced non-weakening tests/ordem-compra-c3d-deploy.smoke.js migration-manifest fixture update (terminal 76->77) was reviewed and accepted as part of this closeout. Direct-review lineage (now resolved): under C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1 (2026-07-22) the PHASE-C5 UI was IMPLEMENTED / LOCALLY VERIFIED within the closed three-file manifest and underwent direct supervisor functional review + mandatory architect visual validation (SUPERVISION_PROTOCOL §4): PHASE-C5 VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT; PHASE-C5 FUNCTIONAL REVIEW = CHANGES_REQUIRED on exactly one blocking defect, C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION (an authoritative post-ambiguous-transport reload that itself failed, returned null, returned a different order, or an unresolved state was incorrectly asserted as the order remaining a draft). Corrected under C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1 (2026-07-22, js/screens/ordem-compra-events.js only, contract §24), then supervisor-accepted as final and binding under C5-DOCUMENTATION-CLOSEOUT-R1 (2026-07-22, contract §25): PHASE-C5 FUNCTIONAL GATE = PASS, VISUAL REVIEW = PASS_WITH_NONBLOCKING_COSMETIC_DEBT, PHASE-C5 CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED at accepted technical checkpoint 3405fdab8e05ec0f81cbfe07c63c489e551fee92, and this requirement advanced to SATISFIED. Local only — no migration, database, environment, staging, deployment, activation, or push beyond the one authorized staging/dev fast-forward for the closeout's single documentation-only commit; the writer cannot be exercised end-to-end in a browser here (fixture-level DOM/mocked-RPC evidence, contract §10). PHASE-C5B-ACCEPTANCE-DECISION remains IDENTIFIED / NOT AUTHORIZED; REAL_CUTOVER remains NOT AUTHORIZED. |

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
(`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`) is now **closed**
(`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, contract §Z,
accepted technical checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`;
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`). Its sublots `PHASE-C3D-A`
(checkpoint
`096cd60325e4987010d328c856ee6a3a51ca66bf`), `PHASE-C3D-B` (checkpoint
`5441321014883c4e8149dc8b20da9d053a193699`), and `PHASE-C3D-C` (checkpoint
`6fd63a56a123d6d006353c6ae629611cbc7c01e9`) are all **CLOSED / TECHNICALLY
ACCEPTED / LOCALLY VERIFIED** (contract §R accepts C3D-A/C3D-B; §U accepts
C3D-C). The accepted C3D-A + C3D-B evidence advanced `OC-C3D-DEPLOY-001` to
**`SATISFIED`**, and the accepted C3D-C fence/rollback evidence advanced
`OC-C3D-FENCE-001` to **`SATISFIED`** (rows above). `PHASE-C3D-D` (effective ACL
and role-matrix rehearsal, contract §V corrected §W,
`tests/ordem-compra-c3d-acl.integration.sql`) is now **`CLOSED / TECHNICALLY
ACCEPTED / LOCALLY VERIFIED`** (supervisor-accepted contract §X at accepted
checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`), advancing
`OC-C3D-ACL-001` to **`SATISFIED`** (row above). `PHASE-C3D-E` (session advisory
lock, deterministic resource-lock order, Component B concurrency, idempotency,
LIFO reversal, imported-balance floor, and exactly one synthetic PONR crossing
per disposable cluster followed by mandatory destruction, contract §Y,
`tests/ordem-compra-c3d-lock-concurrency.mjs`) is now **`CLOSED / TECHNICALLY
ACCEPTED / LOCALLY VERIFIED`** (supervisor-accepted contract §Z at accepted
checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`), advancing
`OC-C3D-LOCK-001` to **`SATISFIED`** (row above). `PHASE-C3D-F` (aggregate
closeout, contract §Z) is **`CLOSED / ACCEPTED / DOCUMENTATION-ONLY`**, and the
aggregate `PHASE-C3D` material phase is **`CLOSED /
ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`** — all four `OC-C3D-*`
requirements `SATISFIED`. `C4-MATERIAL-PHASE-CONTRACT-R1` (docs-only,
2026-07-21) authored
`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C4`),
which the supervisor **ACCEPTED** on 2026-07-21 under
`C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1` (`STATUS: ACCEPTED / IMPLEMENTATION
AUTHORIZED`, contract §0b), authorizing local implementation
(`C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1`, contract §0c) and a visual-contract
correction (`C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1`). The supervisor then
performed the mandatory architect visual validation
(`SUPERVISION_PROTOCOL.md` §4) of the six-PNG evidence packet and **ACCEPTED**
`PHASE-C4` as final and binding under `C4-CLOSEOUT-AND-C5-CONTRACT-R1`
(`STATUS: CLOSED / ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION
PASSED`, contract §0d) — see "Material phase contract reference" below.
`OC-C4-ADMIN-001` is now `SATISFIED`. `LAST_ACCEPTED_PHASE` is `PHASE-C4`;
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`. A subsequent pass then
authored `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
(`PHASE_ID: PHASE-C5`), which the supervisor then **ACCEPTED** under
`C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1` (`STATUS: ACCEPTED / IMPLEMENTATION
BLOCKED BY DATABASE PREREQUISITE`, contract §21) — see "Material phase
contract reference" below. The next authorizable
action is a **fresh Claude Code session performing read-only diagnosis and
documentation-only material-contract authoring of
`PHASE-C5A-DB-EMISSION-READINESS`** (not issued or executed by this
closeout) — no implementation. `PHASE-C5` implementation, `PHASE-C5B-ACCEPTANCE-DECISION`, staging
validation/application of
`db/76`, activation,
deployment, real snapshot/import, fence transition, read switch, real final
ACL-closure invocation, real activation, the real cutover
(`OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`, additionally hard-gated behind the
mandatory read-only completeness disposition of the 13 unmapped
`ordens_compra_fio` rows ids 153–165), branch creation, production access,
Supabase writes to any target, `main`, other remotes, and any push remain
**unauthorized**.

## Material phase contract reference

`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C4`,
authored by `C4-MATERIAL-PHASE-CONTRACT-R1`, docs-only read-only
reconciliation, 2026-07-21) binds the `OC-C4-ADMIN-001` row above to an exact
functional scope, actor/state/action matrix, API ownership matrix (native
`registrar_recebimento_ordem_compra`/`estornar_recebimento_ordem_compra`/
`obter_historico_recebimento_ordem_compra`, excluding the PHASE-C3C-B
legacy-compat adapter from C4's call graph), a closed three-new-file product
manifest, an explicit unchanged-file list, an idempotency/error contract,
and a visual contract authored against `docs/architecture/UI_VISUAL_CONTRACT.md`.
Reversal ownership was resolved as in-scope from explicit lifecycle-spec
anchors (`§R.24.9`/`§R.24.10`/`§R.25.4`/`§R.29.6`/`§R.31`), not left
`UNPROVEN`. The supervisor **ACCEPTED** the contract and authorized local
`PHASE-C4` implementation on 2026-07-21 under
`C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1` (contract §0b). The implementation
(`C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1`, contract §0c) — the three
new `ordem-compra-receipt-*.js` files plus additive `ordem-compra.js`/
`index.html` touches and four new smoke suites (37/37 pass, empty
added-failing-identity differential vs `bdd4c7d…`, validator PASS) — and the
visual-contract correction (`C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1`) were then
reviewed by the supervisor, who performed the mandatory architect visual
validation (`SUPERVISION_PROTOCOL.md` §4) and **ACCEPTED** `PHASE-C4` as final
and binding under `C4-CLOSEOUT-AND-C5-CONTRACT-R1` (contract §0d): `STATUS:
CLOSED / ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`,
accepted technical checkpoint `289b0cca66e9c057330a882f69da3476adf90469`.
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE` in `PROJECT_STATE.md`.
`OC-C4-ADMIN-001` advances `PARTIALLY_SATISFIED` → `SATISFIED` (row above).

`docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (authored by
`C4-CLOSEOUT-AND-C5-CONTRACT-R1`, Part 2, docs-only read-only reconciliation,
2026-07-21) binds the `OC-C5-EMISSION-001` row above to an exact functional
scope (wire the existing disabled `oc-emitir` button to native
`emitir_ordem_compra` + a confirmation modal + `status_aceite` display),
actor/state/action matrix, API ownership matrix (native `emitir_ordem_compra`
only, excluding the superseded legacy flat `emitir_ordem_compra_fio`), a
closed purely-additive three-file manifest
(`ordem-compra-data.js`/`-render.js`/`-events.js`, no new product file), an
idempotency/error contract, and a visual contract. Database-prerequisite
classification: `BLOCKING_DATABASE_PREREQUISITE` — `emitir_ordem_compra` and
`alocar_necessidade_compra_fio` are both terminally `REVOKE ALL` from every
role per `db/74`'s "exact final execution ACL matrix" (`db/74:1171-1207`),
reaffirmed absent through `db/76`; no migration is bundled into this
contract. A separate, pre-existing gap was recorded (no RPC anywhere
transitions `status_aceite` from `pendente` to `aceita`/`rejeitada`) as an
open supervisor decision at authoring time. The supervisor then **ACCEPTED**
this contract under `C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1` (§21): `STATUS:
ACCEPTED / IMPLEMENTATION BLOCKED BY DATABASE PREREQUISITE`. The
`BLOCKING_DATABASE_PREREQUISITE` classification is ratified and assigned to
a new, separately authorized `PHASE-C5A-DB-EMISSION-READINESS` (not yet
authored); the acceptance-decision-RPC gap is ratified as a new,
separately identified `PHASE-C5B-ACCEPTANCE-DECISION`
(`IDENTIFIED / NOT AUTHORIZED`); emission's confirmation UX is ratified
`CONTROLLED_IRREVERSIBLE_TRANSITION`. `OC-C5-EMISSION-001` becomes
`PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`; `PHASE-C5` implementation
remains unauthorized; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`.

`docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
(`PHASE_ID: PHASE-C5A-DB-EMISSION-READINESS`, authored by
`C5A-DB-EMISSION-READINESS-CONTRACT-R1`, docs-only read-only database
reconciliation — no database access, 2026-07-21) specifies the database
prerequisite of the `OC-C5-EMISSION-001` row above to migration-ready
precision, resolving the accepted C5 contract's §5(b)/§21 open question. It
introduces **no new requirement ID**. Overall classification
`READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`: one future migration (`db/77`,
not created) grants `EXECUTE ON emitir_ordem_compra(BIGINT)` to `authenticated`
(terminally `REVOKE ALL` from every role, no grant anywhere — `db/68:347-350`,
`db/70:1203-1206`, terminal `db/74:1192-1193`; body complete and
byte-equivalent) and corrects the terminal read models `obter_ordem_compra_admin`
(`db/69:987`) / `listar_ordens_compra_admin` (`db/69:913`), which hard-code
`pode_emitir=false`/`acoes.emitir=false` ("pode_emitir stays false; emission
awaits Phase C native receipt," `db/69:1073-1075`), so they derive true for a
fully-distributed native rascunho with `exige_aceite=FALSE`. The allocation path
is `ALLOCATION_PATH_READY_AFTER_GRANT` via the already-granted, wired
`definir_alocacao_necessidade_compra_fio` (`db/74:330`/`:1177`;
`js/screens/pedido-insumos-distribuicao.js:135`), so the superseded
`alocar_necessidade_compra_fio` (`db/74:1182`) is `INTERNAL_FUNCTION_ONLY` and
needs no grant. Actor `emitir_ordem_compra = AUTHENTICATED_ADMIN_ONLY`;
acceptance-required-order disposition `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`
(config structurally frozen FALSE, `db/65:174,182,192`; no
`pendente→aceita/rejeitada` RPC — `PHASE-C5B`). Cutover: both writer bodies
never check cutover; the `db/75` table fence permits their DML under
`legacy_active` and denies it under `maintenance_fenced`/`canonical_active`
(a `REAL_CUTOVER` concern, out of C5A scope). The supervisor **ACCEPTED** this
contract under `C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1` (Part 1, contract
§22): `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY`, ratifying the
`READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE` classification, the
`ALLOCATION_PATH_READY_AFTER_GRANT` ruling (with
`alocar_necessidade_compra_fio` confirmed `SUPERSEDED / REVOKED`, staying
ungranted), the `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE` disposition, and
the cutover boundary (the C3C protected-mutation guard is not modified; C5A local
readiness ≠ `REAL_CUTOVER` readiness). It creates no requirement, changes no
anchor, and does not modify the accepted C5/lifecycle/schema/visual contracts.
`OC-C5-EMISSION-001` is unchanged (`BLOCKED`,
`PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`);
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `PHASE-C5A-DB-EMISSION-READINESS` /
`docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`.
Under Part 2 of the same order the implementation is now `IMPLEMENTED / LOCALLY
VERIFIED / AWAITING SUPERVISOR REVIEW` (contract §23): `db/77_ordem_compra_c5a_emission_readiness.sql`
(grant + read-model correction, writer body byte-unchanged) and
`tests/ordem-compra-c5a-emission-readiness.integration.sql`, verified on a
disposable local PostgreSQL 18.4 cluster (ordered `db/01..db/77` + 64-row corpus,
`64/51/51/51/51`; clean apply + idempotent reapply; test PASS). The authorized new
migration forced a minimal, non-weakening migration-manifest fixture update to the
frozen `PHASE-C3D-A` guard `tests/ordem-compra-c3d-deploy.smoke.js` (terminal
76→77) — one file beyond the order's literal Part 2 manifest, flagged for
supervisor review. Disposable local PostgreSQL only; no shared-database apply,
staging, deployment, activation, `REAL_CUTOVER`, `PHASE-C5` UI, `PHASE-C5B`, or
push. Not self-accepted / not closed.

Under `C5A-DB77-SHARED-DEV-VALIDATION-R1` (2026-07-22) `db/77` was then applied to
the authorized non-production shared development database `ucrjtfswnfdlxwtmxnoo`
(PostgreSQL 17.6; terminal migration `20260722055832`; byte-identical to
`e7a8b761`, SHA-256 `9628a947…`) with the complete contract §14/§24
shared-environment evidence — clean apply + idempotent reapply, `emitir` body
byte-unchanged (grant-only, `is_admin()` gate intact), read-model readiness
corrected, exact grant matrix (`emitir`→`authenticated` only), C3C guard untouched,
and the full behavioral matrix (allocation writer, authorized authenticated
emission, non-admin/anon denials, wrong-state/incomplete/missing-supplier/zero-item
denials, over-allocation, duplicate allocation/emission idempotency, one audit
event, `nao_aplicavel` acceptance with no fabricated decision, detail+list
read-model readiness, `exige_aceite` gate, inert states, atomic invariance, and the
`legacy_active`-permit / `maintenance_fenced`+`canonical_active`-deny cutover fence
proved non-persistently). Zero validation-fixture residue; cutover unchanged
`legacy_active`; production not accessed; `REAL_CUTOVER` not activated. The
implementation is now `IMPLEMENTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT VERIFIED
/ AWAITING SUPERVISOR CLOSEOUT`; `OC-C5-EMISSION-001` stays `PLANNED /
BLOCKED_BY_C5A_DB_PREREQUISITE`; `PHASE-C5` UI, `PHASE-C5B`, and `REAL_CUTOVER`
remain unauthorized; not self-accepted / not closed.

Under `C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1` (2026-07-22, documentation-only) the
supervisor **CLOSED** `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
as final and binding: `STATUS: CLOSED / ACCEPTED / LOCALLY VERIFIED /
SHARED-DEVELOPMENT VERIFIED` (contract §25), ratifying every disposition already
recorded at §22/§23/§24 — the terminal grant matrix, the read-model readiness
derivation, the unchanged `emitir_ordem_compra`/allocation-writer bodies, the
`EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE` disposition, and the unmodified
C3C protected-mutation guard — as final. The accepted commits are
`a476df3191b914d62acd6718c06771cd1753ac6b` (proposed contract),
`27464520af2afa3c46d547ffaf76328df70b1889` (contract acceptance),
`e7a8b76152f986c83e4ecfe9827346a4efa5ef08` (`db/77` local implementation), and
`d17b353ed3eca04225a7decb55f84ccd5817d085` (shared-development validation
evidence). The §14 shared-development transport adaptation (`SET ROLE` +
custom-GUC capture in place of unavailable `psql` meta-commands/
`session_replication_role`) is ratified as sufficient, non-blocking evidence —
every required assertion was preserved, real authenticated/anonymous paths were
exercised, every transaction was rolled back, and zero persistent residue was
proven. Post-C5A debts (the `PHASE-C5B` gap, the `REAL_CUTOVER` mutation-fence
question, the active-contract self-test fixture limitation, the 13 unmapped
legacy rows, the shared UI-radius debt, and the cancel-handler stale-capture
debt) are recorded as nonblocking and separately owned — not scheduled by this
closeout. `LAST_ACCEPTED_PHASE` becomes `PHASE-C5A-DB-EMISSION-READINESS`;
`PHASE-C5A-DB-EMISSION-READINESS` is added to `CLOSED_MATERIAL_PHASES` above.

This same closeout **authorized** `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
for local implementation: `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY`
(contract §22) — the former `BLOCKING_DATABASE_PREREQUISITE` is resolved by the
C5A closeout above; every ratified §21 decision (functional scope, actor/state/
action matrix, API ownership, the `CONTROLLED_IRREVERSIBLE_TRANSITION`
confirmation classification, the closed purely-additive three-file manifest,
idempotency/error contract, test/evidence contract, and hard stops) remains
binding and unchanged; `PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT
AUTHORIZED`. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `PHASE-C5` /
`docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`. `OC-C5-EMISSION-001`
becomes `PLANNED / AUTHORIZED_FOR_IMPLEMENTATION` (row above) — not `SATISFIED`,
not `ACTIVE`, not `IMPLEMENTED`; `PHASE-C5` UI implementation itself remains **NOT
YET IMPLEMENTED**, requiring a fresh Claude Code session that re-verifies the Git
baseline first (`docs/governance/AGENT_INSTRUCTIONS.md` §2/§3) and stays within
the contract's §12 manifest, §15 entry/exit gates, and §16 hard stops.
`PHASE-C5B`, `REAL_CUTOVER`, any shared-database apply beyond `db/77`, staging
validation/application, deployment, activation, production access, and any push
remain unauthorized. Documentation-only commit `docs: close C5A and authorize C5
implementation`; no push.

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
(effective ACL and role-matrix rehearsal, §V corrected §W,
`tests/ordem-compra-c3d-acl.integration.sql`) is `CLOSED / TECHNICALLY ACCEPTED /
LOCALLY VERIFIED` (supervisor acceptance §X, checkpoint `5a2be05…`), advancing
`OC-C3D-ACL-001` to `SATISFIED`. `PHASE-C3D-E`
(session/resource lock + Component B concurrency, §Y,
`tests/ordem-compra-c3d-lock-concurrency.mjs`) is `CLOSED / TECHNICALLY ACCEPTED
/ LOCALLY VERIFIED` (supervisor acceptance §Z, checkpoint `429aa39…`), advancing
`OC-C3D-LOCK-001` to `SATISFIED`; `PHASE-C3D-F` (aggregate closeout, §Z) is
`CLOSED / ACCEPTED / DOCUMENTATION-ONLY`, and the aggregate `PHASE-C3D` material
phase is `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` at accepted
technical checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, all four
`OC-C3D-*` `SATISFIED`. The 13 unmapped `ordens_compra_fio` rows (ids 153–165)
are DEFERRED to the `REAL_CUTOVER` readiness gate — a binding authorization
prerequisite recorded in the `OC-CUTOVER-001` residual debt.
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE` in `PROJECT_STATE.md`.
`C4-MATERIAL-PHASE-CONTRACT-R1` (docs-only, 2026-07-21) authored
`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PROPOSED / AWAITING
SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED`); supervisor review and
acceptance/rejection of that contract is the next authorizable action;
`PHASE-C4` implementation, `PHASE-C5`, and `REAL_CUTOVER` remain
unauthorized.

`docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`
(`PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET`, authored by
`CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1`, docs-only read-only diagnosis of
`ucrjtfswnfdlxwtmxnoo`, 2026-07-22) is a **proposed** contract (`STATUS: PROPOSED
/ AWAITING SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED`). It records
the binding `CLEAN_SLATE_OPERATIONAL_REBUILD` business-owner ruling, a complete
read-only FK/dependency inventory and exact row-count baseline of the operational
transaction domain, a per-table classification, the exact dependency-safe deletion
order (Boundary A = the 332-row yarn-purchasing corpus; Boundary B =
`pedidos`/`ops`/`lotes`, only if separately authorized), a mandatory out-of-repo
archival evidence plan, the destructive-execution design (single transaction,
`DELETE` not `TRUNCATE`, run only under `legacy_active`, no default sequence reset,
a one-time governed administrative operation — not a `db/NN` migration, not the
dashboard), the recommended Option C cutover strategy, the `PHASE-C5B` sequencing,
hard stops, and validation/evidence matrices. It **introduces no requirement ID
and changes no disposition in the matrix above**: the former 13-row completeness
gate is dispositioned `STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES` then
`SUPERSEDED_BY_CLEAN_SLATE_RESET`, so `OC-CUTOVER-001` stays `PLANNED` and
`REAL_CUTOVER` stays `NOT AUTHORIZED` (the reset would be `§Z.3` disposition
option 3 applied to all 64 rows, executed only under a separate order). No
deletion, database mutation, migration, cutover, activation, or environment change
occurred; the 64/51/13 corpus physically exists. Boundary B collides with the
binding Controlled-Delete × document-history rule (1 Pedido + 4 OPs) and the
separate documents front — recorded `UNPROVEN`, requiring an explicit
business-owner disposition. `PROJECT_STATE.md` remains the sole owner of
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` (both `NONE`); this contract is **not
active** and authorizes no implementation.

`CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1` (read-only
continuation diagnosis, 2026-07-22; no documentation mutation) then closed the
remaining reset-boundary evidence gaps, proving that the only transaction-linked
document is the synthetic `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT`
fixture (Pedido #34, OPs 55/57/61/63, lotes 33/37; no Drive object/SHA/fiscal
metadata; 0 operational descendants), that the Controlled-Delete rule is
RESTRICT-FK + `db/53` application guard with no immutability trigger, and that
`saldo_fios`/`op_numeros`/master data are preserved — returning
`READY_FOR_CONTRACT_CORRECTION`. `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1`
(documentation-only, 2026-07-22) then set the contract to `STATUS: CORRECTED /
AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED`, binding
every reset-boundary decision (purge all 16 Pedidos / 20 OPs / 25 lotes +
`op_fornecedores` + the full yarn-purchasing corpus; Option D3 removal of only the
synthetic B6-VERIFY fixture with the rest of the documents front preserved;
`saldo_fios`/`op_numeros`/master preserved; cutover Option C; a mandatory archive +
restore-drill HARD STOP; a one-time governed administrative DELETE transaction) and
adding the exact Boundary-A/document-fixture/Boundary-B deletion orders, affected-row
counts, the exact 16 Pedido / 20 OP / 25 lote ids, and a proposed (not created)
implementation manifest. It **introduces no requirement ID and changes no
disposition**: `OC-CUTOVER-001` stays `PLANNED`, the 13-row gate stays
`STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`, and `REAL_CUTOVER` stays `NOT
AUTHORIZED`. No deletion, database mutation, archive creation, reset implementation,
migration, cutover, activation, or environment change occurred; `PROJECT_STATE.md`
remains the sole owner of `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` (both `NONE`); the
contract is **not active** and authorizes no implementation.
