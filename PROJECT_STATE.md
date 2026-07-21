# CANONICAL CURRENT STATE

This file is the **single owner of the current operational state**: active phase,
next authorizable action, binding decisions in force, live debts, environment
facts, and a concise index of closed phases. It does **not** hold historical
closeout narratives. Those are preserved, verbatim, in:

- the append-only ledger `docs/ledgers/G28_LEDGER.md` (full per-phase closeouts);
- `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (state closeouts moved by
  `PROJECT-STATE-COMPACTION-A`/`-B`, 2026-07-16/17);
- `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` (the operational-handoff
  stack moved by `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`, 2026-07-20).

HEAD / working tree / index / staging / divergence are live facts — consult Git
directly (`git rev-parse HEAD`, `git status --short --untracked-files=all`).

<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->
```text
LAST_ACCEPTED_PHASE: PHASE-C3D
ACTIVE_PHASE: NONE
ACTIVE_PHASE_CONTRACT: NONE
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
NEXT_AUTHORIZABLE_ACTION: architect authorization decision for PHASE-C4 — ADMIN RECEIPT UI (OC-C4-ADMIN-001); PHASE-C4, PHASE-C5, the REAL_CUTOVER window (OC-CUTOVER-001/OC-CUTOVER-PONR-001 — hard-gated behind the mandatory separate read-only completeness disposition of the 13 unmapped ordens_compra_fio rows ids 153–165), real close_final_acl invocation, real activation, the real read-authority switch, staging validation/application of db/76, and any productive receipt on a shared or real environment all remain unauthorized; the next chat must re-read the canonical repository before authoring or executing any PHASE-C4 order
GOVERNING_SPEC: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
TECHNICAL_CONTRACT: docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md
SEQUENCE_AUTHORITY: docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
TRACEABILITY: docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md
LEDGER: docs/ledgers/G28_LEDGER.md
HANDOFF: AGENT_HANDOFF.md
ACCEPTED_CHECKPOINT: 429aa3980c7027b9d872a1902e2f31f1a4a85a2a
```
<!-- SPEC_CUSTODY_BOOTSTRAP:END -->

## Active phase and next action

- **Last accepted material phase:** `PHASE-C3D` (inactive deployment &
  rehearsal) — `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`
  (2026-07-21), accepted **technical** checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §Z, the `PHASE-C3D-F`
  aggregate closeout). `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are now `NONE`.
  **`PHASE-C3D-F` (aggregate closeout & readiness disposition):** `CLOSED /
  ACCEPTED / DOCUMENTATION-ONLY` — the final `PHASE-C3D` documentation commit is
  the closeout-documentation checkpoint, **not** a new technical evidence
  checkpoint; `PHASE-C3D` performed **no real cutover**. All five material
  sublots are `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` at their accepted
  checkpoints: `PHASE-C3D-A` `096cd60325e4987010d328c856ee6a3a51ca66bf`;
  `PHASE-C3D-B` `5441321014883c4e8149dc8b20da9d053a193699`; `PHASE-C3D-C`
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`; `PHASE-C3D-D`
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`; `PHASE-C3D-E`
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`. All four `PHASE-C3D` requirements
  are now `SATISFIED` — `OC-C3D-DEPLOY-001`, `OC-C3D-FENCE-001`,
  `OC-C3D-ACL-001`, and `OC-C3D-LOCK-001` (the last advanced by the supervisor
  acceptance of `PHASE-C3D-E` recorded this pass). No separately governed
  real-cutover / C4 / C5 requirement was advanced: `OC-CUTOVER-001` remains
  `PLANNED`, `OC-CUTOVER-PONR-001` `PARTIALLY_SATISFIED`, `OC-C4-ADMIN-001`
  `PLANNED`, `OC-C4-SUPPLIER-001` `DEFERRED`, `OC-C5-EMISSION-001` `PLANNED`.
- **`PHASE-C3D-E` supervisor acceptance (this pass):** the supervisor accepted
  `PHASE-C3D-E` (session advisory lock, deterministic resource-lock order,
  Component B concurrency, idempotency, deterministic LIFO reversal, imported-
  balance immutable floor, with exactly one synthetic PONR crossing per disposable
  cluster followed by mandatory destruction) as `CLOSED / TECHNICALLY ACCEPTED /
  LOCALLY VERIFIED` at accepted checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (contract §Y evidence, §Z
  acceptance), advancing `OC-C3D-LOCK-001` from `PARTIALLY_SATISFIED` to
  `SATISFIED`. Accepted evidence: two independently bootstrapped fresh disposable
  PostgreSQL 18.4 clusters; exact ordered `db/01`…`db/76`; the
  classification-faithful 64-row synthetic corpus; deterministic session
  advisory-lock key; same-generation exclusion; different-generation independence;
  release and reacquisition; automatic advisory-lock release on backend
  disconnect; owner-only lock-command boundary; zero advisory-lock leakage; the
  installed Component B resource-lock order; a real staged blocker and
  `pg_blocking_pids` evidence; two real T1/T2 sessions with a real PostgreSQL lock
  wait; T2's fresh post-commit absolute-total delta re-evaluation (no stale
  delta); unchanged deadlock counter; exactly one synthetic PONR crossing per
  disposable cluster; idempotent replay and `idempotencia_conflitante`;
  deterministic LIFO reversal; the immutable imported-balance floor; direct
  depth-1 fence denial `55000`; the legitimate nested `ordem_compra_item`/movement
  runtime; mandatory destruction of both post-PONR clusters; read-only
  shared-development invariance; zero persistent database mutation.
  - **Documentary precision correction (non-blocking).** The `PHASE-C3D-E`
    two-session blocking evidence was **not** produced by one fixed observer
    backend running every blocking query. The test creates and captures a backend
    PID labelled *observer*, then **closes that marker session**, and performs the
    actual `pg_blocking_pids` / `pg_stat_activity` observations through independent
    transient observer queries. Recorded accurately: **independent observer
    connections confirmed the T1/T2 blocking relationship.** The accepted
    technical artifact is unchanged.
  - **`saldo_fios` / `saldo_fios_op` disposition.** `ordem_compra_item` and
    inventory-movement runtime were empirically exercised; direct depth-1
    `saldo_fios` mutation was denied `55000`; the installed
    `saldo_fios`/`saldo_fios_op` exception was structurally proven to require
    `pg_trigger_depth() > 1 AND canonical_active`. In the fixed target scenario
    `kg_alocado` 15.500 exceeded the maximum tested total 15.000, so **no excess
    line was produced and `saldo_fios`'s excess branch was not empirically
    executed** — proven structurally and by the direct depth-1 denial, not claimed
    as a mutation that did not occur. `saldo_fios_op` is `NOT_APPLICABLE` to the
    installed receipt/reversal/import write topology. Neither is an
    `OC-C3D-LOCK-001` §M exit criterion (session exclusion, deterministic locking,
    short transactions, release/reacquisition, authorized concurrency, synthetic
    PONR crossing, and cluster destruction), so neither blocks the requirement.
- **`PHASE-C3D` aggregate status:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  LOCALLY VERIFIED`; accepted technical checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`. **`REAL_CUTOVER` remains BLOCKED
  from authorization** until the 13-row completeness disposition (below) is
  recorded; the eleven recorded non-blocking `PHASE-C3D` debts and the binding
  gate live in the "POST-LAUNCH DEBT REGISTER" / Phase-C open items and the
  residual-debt register.
- **13 unmapped legacy rows — binding REAL_CUTOVER completeness gate (supervisor
  decision).** The development database's `ordens_compra_fio` holds 64 rows: 51
  carry the frozen REFUND-A `ordem_compra_item_compat_fio` mapping; **13 are
  unmapped, exact ids `153`–`165`**, all `rascunho`/`pendente`/`nao_recebido`
  with `kg_recebido` NULL. They remained outside the 51-row mapped/frozen
  canonical corpus; Component A cannot project them; Component B must fail
  `mapeamento_compat_ausente` if invoked for them; `PHASE-C3D` created no mapping,
  bridge, migration, backfill, or exclusion record for them. **Supervisor
  decision: the 13 rows are DEFERRED to the REAL_CUTOVER readiness gate and do
  not block `PHASE-C3D` closeout.** Before `REAL_CUTOVER` may be authorized, a
  separate read-only completeness diagnosis must disposition **every one** of the
  13 rows by exactly one of: (1) authorized mapping/backfill and re-baseline; (2)
  documented exclusion from the cutover corpus with business-owner approval; or
  (3) cancellation/removal through a separately authorized business-data action.
  `REAL_CUTOVER` stays BLOCKED from authorization until that disposition is
  recorded.
- **Next authorizable action:** **architect authorization decision for `PHASE-C4`
  — ADMIN RECEIPT UI** (`OC-C4-ADMIN-001`). `PHASE-C4` is **not** authorized by
  this pass; `PHASE-C5` is not authorized; `REAL_CUTOVER` is not authorized. The
  next chat must re-read the canonical repository before authoring or executing
  any `PHASE-C4` order.
- **Prior accepted product phase:** `PHASE-C3C-B` (application compatibility/
  adaptation) — `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`
  (2026-07-21), accepted checkpoint
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36). The supervisor
  accepted the application-adapter implementation (initial `ee5e87c`, corrections
  `f9b1a54` then `22bfb192`): the exact finite RPC-error classifier, real
  call-site idempotency retention, the `pedido-detail-events.js` runtime proof,
  UI-inertness (`js/router.js`/`js/boot.js` byte-unchanged; `index.html` one
  added line), and the empty full-suite failing-name differential (122 = 122,
  zero regressions). No database, environment, or deployment action was taken;
  the adapters' canonical branches remain unverified against a live
  `canonical_active` state (C3D/real cutover). No dependent `OC-C3-*` requirement
  is `SATISFIED`.
- **Prior accepted database-prerequisites phase:** `PHASE-C3C-B-DB-PREREQ` —
  `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING
  DATABASE` (2026-07-20), technical checkpoint
  `34d7d231d0875093bc2091f385c61cf35fa0b5cb`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  §37). It supplies the two legacy-compat database prerequisites — Component A
  (`listar_ordens_compra_fio_compat`) and Component B
  (`registrar_recebimento_ordem_compra_fio_compat`), both installed inert and
  active only under `canonical_active` — validated only in a disposable,
  isolated local PostgreSQL 18.4 cluster; **not applied to any staging
  database**. `tests/ordem-compra-c3c-inactive.integration.sql`/
  `-concurrency.mjs` remain nonblocking C3C-A fixture debt (pre-existing,
  unrelated to `db/76`). No dependent `OC-C3-*` requirement is `SATISFIED`.
  Local technical acceptance only — no staging validation/application,
  deployment, activation, cutover, or product acceptance.
- **Prior accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` (2026-07-20),
  technical checkpoint `89123729b3529fff6e4a2336bfec2907c4b94b4c`. It supplies
  the inactive C3C database contract (state/fence, canonical snapshot/import/
  reconciliation, nullable normalized reader, receipt/reversal gates, session/
  resource locks, ACL-closure command, recovery boundaries). Lifecycle §R.29 and
  schema §13.15 are unchanged. Local technical acceptance only — no staging
  validation/application, deployment, activation, cutover, or product acceptance.
- **Active product phase:** `NONE` (`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` moved
  to `NONE` at the `PHASE-C3D` closeout). The `PHASE-C3D` material phase contract
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C3D`)
  is now a **closed** contract: `PHASE-C3D-A`
  (`096cd60325e4987010d328c856ee6a3a51ca66bf`), `PHASE-C3D-B`
  (`5441321014883c4e8149dc8b20da9d053a193699`, supervisor-accepted §R),
  `PHASE-C3D-C` (`6fd63a56a123d6d006353c6ae629611cbc7c01e9`, supervisor-accepted
  §U), `PHASE-C3D-D` (`5a2be05c19a62346b906f7b3cbb0b89d07b3a571`,
  supervisor-accepted §X), and `PHASE-C3D-E`
  (`429aa3980c7027b9d872a1902e2f31f1a4a85a2a`, supervisor-accepted §Z) are all
  `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED`, and `PHASE-C3D-F` is
  `CLOSED / ACCEPTED / DOCUMENTATION-ONLY` (§Z). The four `OC-C3D-*` requirements
  are all `SATISFIED` (`OC-C3D-DEPLOY-001` via C3D-A+B, `OC-C3D-FENCE-001` via
  C3D-C, `OC-C3D-ACL-001` via C3D-D, `OC-C3D-LOCK-001` via C3D-E). No `PHASE-C4`
  phase is authorized; a fresh session and a separate architect order are
  required to open it.
- **`PHASE-C3C-B` (application compatibility/adaptation):** `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` — supervisor-accepted
  2026-07-21 at checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36; supersedes the
  prior `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`).
  Authorized by
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §32 (forward
  correction, commit `07fb4903eda67ac5e570ca505e09185b688b5277`,
  `docs: authorize C3C-B application adaptation`) and
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  §39 (supervisor acceptance of the applied `db/75`+`db/76`
  development-database stack), both 2026-07-20. Implemented the shared
  adapter `js/screens/ordem-compra-receipt-cutover.js` and adapted the nine
  other authorized product paths (`js/screens/op-writes.js`,
  `js/screens/fornecedor.js`, `js/screens/pedido-detail-data.js`,
  `js/screens/op-nova.js`, `js/screens/op-persistir.js`,
  `js/screens/op-recalculo.js`, `index.html`;
  `js/screens/pedido-detail-events.js` and `js/delete-helpers.js` required
  no change at that time — §34 below records a later correction that did
  touch `js/screens/pedido-detail-events.js`).
  **Supervisor-review correction (§34, commit
  `fix: preserve C3C-B receipt idempotency attempts`):** two blocking
  defects — real receipt call-sites did not retain retry attempts across
  ambiguous transport failures, and the missing-function classifier
  accepted a message-text alternative beyond the exact `42883` contract —
  were corrected in `js/screens/ordem-compra-receipt-cutover.js`,
  `js/screens/op-writes.js`, `js/screens/fornecedor.js`,
  `js/screens/op-nova.js`, and `js/screens/pedido-detail-events.js`. Full
  mandatory Node suite (3985 tests, +25 from the correction's own tests) has
  a 122-failure set — 2 fewer than the prior 124-failure baseline, both
  incidental fixes of pre-existing CRLF-unaware regex assertions in
  `tests/pedido-detail.smoke.js` sharing a string this correction's own
  test edit also touched (not an intentional scope change); every other
  failure is byte-for-byte the same pre-existing, unrelated set — zero
  regressions attributable to this correction;
  `node scripts/validate-spec-custody.mjs` PASS. No dependent `OC-C3-*`
  requirement is `SATISFIED`. See
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §§33–34 and
  `docs/ledgers/G28_LEDGER.md` (2026-07-20, `PHASE-C3C-B
  APPLICATION-ADAPTER IMPLEMENTATION`) for the full closeout.
  **Further supervisor-review correction (§35, commit
  `fix: complete C3C-B retry classification proof`, on top of `f9b1a54cc7b18
  5a5e72f50209322d1473e93e850`):** two further gates — the RPC-call-level
  error classifier's "any error except 42883 ⇒ ambiguous" rule was replaced
  with a finite predicate grounded in the real `@supabase/postgrest-js`
  response shape (`status === 0` is the only signal for a genuine transport
  ambiguity; every other error, including permission/data/schema errors with
  a real HTTP status, is now `hard_failure`), and a real DOM-click +
  stateful-mock runtime proof was added for `pedido-detail-events.js`'s
  `buildInsumosTransferForm` (previously proven only statically) — was
  corrected in `js/screens/ordem-compra-receipt-cutover.js` and five test
  files (no other product path required a change). Full mandatory Node suite
  (3993 tests, +8 from this correction's own tests) has the same 122-failure
  set as the `f9b1a54` baseline — `diff` of sorted failing-name lists is
  empty, zero regressions; `node scripts/validate-spec-custody.mjs` PASS. No
  dependent `OC-C3-*` requirement is `SATISFIED`. See
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §35 for the full
  closeout.
- **Governance status:**
  - `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1`: **ACCEPTED**.
  - `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`: **ACCEPTED** by the supervisor at
    commit `1157b9e71bc629903c5940ab50d4b370964e560e` (`PROJECT_STATE.md`
    compacted to a current-state hub, `AGENT_HANDOFF.md` to a concise derived
    handoff, historical content preserved in tracked archives and the append-only
    ledger, no unique canonical evidence lost, validator PASS, self-tests 47/47
    PASS). Documentation-only: no product semantics, database, environment,
    deployment, remote, or push change.
  - `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-CLOSEOUT`: this closeout records that
    acceptance and advances the next authorizable action.
  - `C3C-B-MATERIAL-PHASE-CONTRACT-R1`: a read-only supervisor review returned
    `CHANGES_REQUIRED`; the resulting forward correction (two database hard
    stops, a unified error policy, a supplier-reader disposition, and
    exact-manifest wording — recorded in
    `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §§0, 25–30) was
    **ACCEPTED** by the supervisor as `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES
    / IMPLEMENTATION NOT AUTHORIZED` (§31 of that file). `PHASE-C3C-B`
    implementation remains unauthorized and is now additionally blocked pending
    a separate database-prerequisites contract.
  - `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT` (ratification closeout / R3
    documentary forward correction): an independent read-only premise audit
    confirmed the R2 architecture against the installed `db/67`–`db/75` objects
    and the live `js/screens/*` writers; the supervisor **ACCEPTED** it as
    `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET
    AUTHORIZED` (§34 of
    `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`).
    Stale proposed-delta/rollback/requirement wording (authored in R1,
    superseded by R2) was reconciled append-only; the proposed
    mandatory-`UNMAPPED=0`-gate interpretation was **not** adopted (out of this
    contract's scope — a real-cutover/C3D completeness precondition). No SQL,
    implementation, migration, environment action, or normative-file change was
    made. `PHASE-C3C-B-DB-PREREQ` implementation remains a separate
    authorization.
  - `PHASE-C3C-B-DB-PREREQ` (implementation): **CLOSED / TECHNICALLY ACCEPTED /
    LOCAL DB VERIFIED / NOT APPLIED TO STAGING DATABASE** (2026-07-20,
    supervisor acceptance recorded in
    `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
    §37, technical checkpoint `34d7d231d0875093bc2091f385c61cf35fa0b5cb`). The
    architect authorized
    implementation; `db/76_ordem_compra_c3c_b_db_prerequisites.sql` now exists —
    Component A (`listar_ordens_compra_fio_compat`) and Component B
    (`registrar_recebimento_ordem_compra_fio_compat`), both **installed inert and
    active only under `canonical_active`**, plus one additive
    `idempotency_namespace` `CHECK` extension (no bridge, no backfill, no
    `db/67`/`db/75` change). The corrected `§R.29.7`/`§13.18` normative deltas
    (contract §34.2/§34.3) were applied. An implementation-time material finding —
    the installed `trg_native_lancamento_shape_guard` couples `comando_tipo` to
    each ledger line's `tipo` — was resolved by an **architect ruling (contract
    §35)**: legacy-compat receipts reuse the native command types
    (`recebimento`/`estorno`), carry compat identity solely in
    `idempotency_namespace='legacy_compat_receipt_v1'`, introduce no
    `recebimento_compat`, and leave the `comando_tipo` `CHECK` and the shape guard
    unchanged.
    **DB-backed validation completion (contract §36):** a disposable, isolated
    local PostgreSQL 18.4 cluster (initdb/pg_ctl, distinct port, outside the
    host's broken cluster and outside the repository) was used to apply the full
    `db/01`…`db/76` sequence, reapply `db/76` alone (idempotent), run both new
    DB-backed tests (`…integration.sql`, `…concurrency.mjs` — both **PASS**),
    rehearse a real persisted rollback (drop both functions, restore both prior
    constraints byte-for-byte, confirm zero bridge/backfill/compat rows required
    reversal) and reapply, then rerun both tests again (**PASS**). One genuine
    `db/76` defect was found and corrected in-scope: Component A's activation
    check used a bare `status` column reference ambiguous with its own
    `RETURNS TABLE` OUT column of the same name (PL/pgSQL `42702`); fixed with a
    `%ROWTYPE` variable matching Component B's/`db/75`'s own pattern. Several
    test-file-only defects (fixture shape, role/grant scoping, a transaction-local
    vs. session-scoped GUC mistake, and a lock-order deadlock) were also
    corrected, confined to the three C3C-B test files. The two C3C-A DB-backed
    regressions (`…c3c-inactive.integration.sql`/`-concurrency.mjs`) remain
    genuinely unexecutable against any synthetic local corpus — they assert
    exact real historical aggregate values (39 headers/44 lines/20,221.280 kg/
    405.980 kg) tied to the actual `ucrjtfswnfdlxwtmxnoo` corpus, a pre-existing
    characteristic of those C3C-A files, not a `db/76` defect; reported as
    unavailable, not inferred. Supabase was not used (out of this phase's
    `LOCAL_ONLY` scope). Local verification: static smoke suite PASS (49/49);
    validator and `git diff --check`s clean.
    **Supervisor acceptance (2026-07-20, contract §37):** the phase is
    **CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO
    STAGING DATABASE**. Validation occurred only in a disposable local
    PostgreSQL cluster; `db/76` has **not** been applied to any staging
    database; `tests/ordem-compra-c3c-inactive.integration.sql`/
    `-concurrency.mjs` remain nonblocking C3C-A fixture debt. No dependent
    C3C-B requirement is `SATISFIED`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
    remain `NONE`.
- **`DEVELOPMENT-DB APPLICATION` (`db/75`→`db/76`, 2026-07-20):** the separately
  authorized development/legacy-database application has been **executed and
  verified** against `ucrjtfswnfdlxwtmxnoo` — `db/75` applied as version
  `20260720234958`, `db/76` as version `20260720235820`, both **inert**; the
  database remains `legacy_active`/`flat`; migration history now ends at `76`
  after `75` after `74`; zero business-data mutation; no fence/import/ACL
  closure/activation/read switch/cutover/productive receipt/deployment/product
  adaptation. Static validation clean (`validate-spec-custody` PASS, static
  smoke 49/49, `git diff --check` clean); DB-backed integration/concurrency
  tests **NOT RUN** against the shared dev DB (they exercise the prohibited
  fence/import/activation machinery; accepted local PASS in contract §36
  stands). Recorded in contract §38 as `APPLIED / DEVELOPMENT DB VERIFIED /
  AWAITING SUPERVISOR ACCEPTANCE`. **No dependent `OC-C3-*` requirement is
  `SATISFIED`.**
- **`PHASE-C3D` (inactive deployment & rehearsal):** contract `ACCEPTED`
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §0c, supervisor
  ruling under the "PHASE-C3D-A — ENVIRONMENT AND DEPLOYMENT-MANIFEST
  QUALIFICATION" order, entry checkpoint
  `ab30c5115bb79c8952cc5575b68f8b976497699d`, execution strategy §D Option 2 —
  disposable isolated local PostgreSQL plus a separately-scoped read-only
  proof against `ucrjtfswnfdlxwtmxnoo`). It binds the four already-ratified
  `OC-C3D-*` requirements to an isolated-rehearsal scope (six sublots
  C3D-A…C3D-F), the same environment strategy, entry/exit gates, test matrix,
  recovery/PONR model, exact future manifests, and mandatory supervisor
  decisions recorded in §§A–M (unchanged by acceptance). **`PHASE-C3D-A`
  (environment & deployment-manifest qualification) is now `IMPLEMENTED /
  LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`** (contract §O):
  `scripts/c3d/bootstrap-disposable-cluster.mjs` (disposable local PostgreSQL
  18.4 cluster — fresh temp directory outside the repository, distinct
  non-default port, initdb/pg_ctl lifecycle, readiness + real connection
  proof, bounded-retry cleanup that fails closed) and
  `tests/ordem-compra-c3d-deploy.smoke.js` (19/19 passing across three
  consecutive runs, zero leftover process or directory after each; deployment
  manifest resolves exactly `db/01`…`db/76`, terminal `db/75`/`db/76` hash-
  matched to the HEAD checkpoint and byte-stable for the run, application
  artifact `22bfb192` proven an ancestor, fail-closed unit coverage for every
  malformed-manifest condition). Read-only inspection of
  `ucrjtfswnfdlxwtmxnoo` succeeded (not `UNPROVEN`): migration history ends
  `75`/`76` at the recorded versions, cutover singleton
  `legacy_active`/`flat`/`not_started` with every marker `NULL`, business
  fingerprint `64`/`51`/`51`/`51`/`51`/`64`/`5` — zero DDL/DML/mutating RPC
  attempted. `PHASE-C3D-A` alone provides only the environment and
  deployment-manifest portion of `OC-C3D-DEPLOY-001`; it does **not** mark
  that or any other `OC-C3D-*` requirement `SATISFIED`, and is not
  self-accepted by this pass. `PHASE-C3D-B` (inactive migration/application
  presence validation) and every later sublot remain separately unauthorized.
  **Supervisor-review correction (contract §P):** a read-only review of the
  `PHASE-C3D-A` evidence at commit `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb`
  returned `CHANGES_REQUIRED` for three findings, all corrected in this pass
  — (1) the canonical `ACTIVE_PHASE` identity is now `PHASE-C3D-A` (not the
  overall `PHASE-C3D` contract label) everywhere it is tracked, including
  this file's `SPEC_CUSTODY_BOOTSTRAP` block and this contract's own
  `PHASE_ID` marker; (2) `scripts/c3d/bootstrap-disposable-cluster.mjs`'s
  shutdown now proves — never infers — captured-postmaster-PID absence, port
  closure, and directory removal, in that order, fails closed with a stable
  `C3D_BOOTSTRAP_*` error on any unproven step, preserves both the original
  and any cleanup failure on the bootstrap-failure path, and remains
  retry-safe without ever poisoning a failed attempt; (3) an exact,
  worktree-based, byte-for-byte failing-test-identity differential against
  the `ab30c5115bb79c8952cc5575b68f8b976497699d` baseline replaced the prior
  count-only comparison — baseline 137 failing identities, corrected
  workspace 122, **added = 0** (empty, the required result), 15 pre-existing
  identities absent now (unrelated to any file this pass or the prior one
  touched; reported as pre-existing test-suite non-determinism, not claimed
  as a fix). `PHASE-C3D-A` remains `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE` — the `CHANGES_REQUIRED` verdict is resolved, not a
  new self-acceptance. Full evidence: contract §P;
  `docs/ledgers/G28_LEDGER.md` (2026-07-21, this correction's own entry).
  **`PHASE-C3D-B` (inactive migration & application-presence validation)** is
  `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` — supervisor-accepted
  (contract §R) at checkpoint `5441321014883c4e8149dc8b20da9d053a193699`;
  implemented at contract §Q. The material-contract identity was restored from
  the documentary-error `PHASE-C3D-A` to `PHASE-C3D` (§Q.1); `PHASE-C3D-A` is
  recorded `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` at accepted
  checkpoint `096cd60325e4987010d328c856ee6a3a51ca66bf`. One authorized new
  file — `tests/ordem-compra-c3d-deploy.integration.sql` — proves, across
  **two** fresh disposable local PostgreSQL 18.4 clusters, that the exact
  ordered `db/01`…`db/76` sequence applies cleanly (a classification-shape-only
  synthetic 64-row corpus loaded before `db/67`'s REFUND-A self-check; `db/67`
  reconciliation `64/51/51/51/51`; no real/copied business data), that `db/75`
  and `db/76` are terminal, that the cutover singleton is
  `legacy_active`/`flat`/`not_started`/all-null, that Component A raises
  `listar_compat_inativo`/`55000` and Component B returns
  `recebimento_compat_inativo` with zero mutation / PONR NULL / no leaked
  advisory lock, that `db/76` reapplies idempotently (no drift, no duplicate
  constraint) while `db/75` is a single-application ordered migration (a full
  reapply would revert `db/76`'s additive `c3c_hash_check` extension — proven
  from the SQL — so object convergence, not full reapply, is its valid proof),
  and that each disposable cluster's process/port/temp-directory were proven
  removed. The accepted application adapter (`22bfb192`,
  `js/screens/ordem-compra-receipt-cutover.js`, byte-unchanged) routes the
  inactive signals and exact `42883` to the flat reader/one flat writer and
  never falls back on deterministic/transport-ambiguous failures — proven by
  the unmodified existing tests. A separately-scoped read-only inspection of
  `ucrjtfswnfdlxwtmxnoo` re-confirmed migrations `75`/`76` present, the cutover
  singleton `legacy_active`/`flat`/`not_started`/all-null, and the
  `64/51/51/51/51/64/5/0/0` fingerprint unchanged (no DDL/DML/mutating RPC). See
  contract §Q and `docs/ledgers/G28_LEDGER.md` (2026-07-21, this pass's own
  entry).
- **Supervisor acceptance (contract §R, 2026-07-21):** `PHASE-C3D-A`
  (`096cd603…`) and `PHASE-C3D-B` (`5441321…`) are both `CLOSED / TECHNICALLY
  ACCEPTED / LOCALLY VERIFIED`; the combined evidence advanced
  `OC-C3D-DEPLOY-001` to `SATISFIED` (traceability updated). The §G item 9
  pre-PONR rollback semantics were corrected (§R.2): pre-PONR rollback restores
  `flat` read authority only and keeps `status=maintenance_fenced` (it does
  **not** return to `legacy_active` and does **not** restore flat
  grants/policies). `PHASE-C3D-C` is `AUTHORIZED / NOT STARTED` (a fresh Claude
  session is required); `PHASE-C3D-D`…`C3D-F` remain unauthorized.
- **`PHASE-C3D-C` (fence and pre-PONR rollback rehearsal):** `CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED` (contract §S, corrected §T,
  supervisor-accepted §U at accepted checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`), entry checkpoint
  `7f73b4d8210da249ddd5b085c7c3b59244afd72b`. One authorized file,
  `tests/ordem-compra-c3d-fence.integration.sql`, was validated across two
  fresh disposable local PostgreSQL 18.4 clusters: pre-fence admin/
  matching-supplier authorization controls; the fence transition to
  `maintenance_fenced/flat/previewed`; the database-faithful authenticated
  actor-context fence-denial proof (Evidence 5A — exact
  `legacy_receipt_fenced`/`55000`, no `42501`, zero mutation, `auth.uid()`
  still resolving) for both actors; the eight-table × three-operation
  structural fence matrix (Evidence 5B — 24/24 probes, exact
  `legacy_receipt_fenced`/`55000`, zero mutation); and the pre-PONR
  rollback rehearsal (test-only fixture, `pre_ponr_rollback` restoring
  `flat` reads while `status` stays `maintenance_fenced`, byte-identical
  grants/policies, no `legacy_active` regression, clean lock release). A
  targeted correction (§T) then closed four incomplete-evidence findings:
  exact live-versus-frozen hash evidence via four
  `ordem_compra_c3c_assert_snapshot_and_live` invocations plus a
  byte-compared snapshot/inventory evidence anchor; an empirical catalog
  proof (via `pg_get_functiondef`) that the installed
  `saldo_fios`/`saldo_fios_op` trigger-depth exception is exactly one
  `pg_trigger_depth()>1 AND v_state='canonical_active'` gate with no
  broader pass-through (nested-path runtime still correctly deferred, not
  fabricated, to `PHASE-C3D-E`); replacement of the overstated in-session
  "idle" claim with a captured test-backend PID proven absent from
  `pg_stat_activity` via a separate connection after `psql` exit; and
  corrected `OC-C3D-FENCE-001` traceability language (Option 2 —
  disposable-local-only — is the selected and sole environment strategy;
  no real/staging fence rehearsal is required or authorized by C3D-C). Both
  corrected runs proved full process/port/directory cleanup and passed
  every new gate. A read-only `ucrjtfswnfdlxwtmxnoo` inspection before/
  after remained byte-identical (zero DDL/DML/mutating RPC). Full-suite
  differential (detached temporary worktree vs. this pass's entry
  checkpoint): final minus baseline = empty. Validator self-test: identical
  pre-existing active-contract fixture-harness failure on both sides, no
  new failure. See contract §S/§T and `docs/ledgers/G28_LEDGER.md` for the full
  closeout. **Supervisor acceptance (contract §U, 2026-07-21):** `PHASE-C3D-C`
  is `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` at accepted checkpoint
  `6fd63a56a123d6d006353c6ae629611cbc7c01e9`; the accepted fence/rollback
  evidence advanced `OC-C3D-FENCE-001` to `SATISFIED` (traceability updated);
  `OC-C3D-ACL-001`/`OC-C3D-LOCK-001` unchanged.
- **`PHASE-C3D-D` (effective ACL and role-matrix rehearsal):** `CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED` — supervisor-accepted (contract §X) at
  accepted checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`, advancing
  `OC-C3D-ACL-001` to `SATISFIED` (contract §V, corrected §W; original evidence
  checkpoint `b808a5ea832b5038495afe80e492de724835cae6`). One authorized file,
  `tests/ordem-compra-c3d-acl.integration.sql`, was validated across two fresh
  disposable local PostgreSQL 18.4 clusters: the exact 14-table / 7-sequence /
  11-column / function inventories; an empirical `pg_get_functiondef` proof that
  the installed `ordem_compra_c3c_close_final_acl(bigint)` embeds the exact db/75
  table/column/sequence revokes and PUBLIC-policy loop; a simulated closure that
  reproduces those ACL effects in one rolled-back transaction WITHOUT invoking
  `close_final_acl` and with `final_acl_closed_at` proven NULL throughout; the
  post-simulation table (7 grant-revoked → zero for
  public/anon/authenticated/service_role; 7 retained canonical tables' grants
  byte-identical), 11-column, 7-sequence, RLS-policy (zero PUBLIC / non-PUBLIC
  byte-identical), and function (owner-only no-EXECUTE vs Component A/B
  authenticated-only) matrices; four-actor direct-table `42501` probes; a
  Component A/B eight-actor runtime matrix under a TEST-ONLY canonical_active
  fixture (`productive_receipt_started_at` NULL; no productive receipt
  committed); and byte-identical catalog/business rollback. A reported
  DOCUMENTARY deviation (§V.3): the db/75 `canonical_active` CHECK requires
  `final_acl_closed_at IS NOT NULL`, so the TEST-ONLY runtime fixture sets
  synthetic `final_acl_closed_at`/`canonical_activated_at` markers (rolled back)
  while the closure simulation keeps `final_acl_closed_at` NULL and never invokes
  the real closure. Both runs proved full process/port/directory cleanup and
  separate-connection backend absence; the read-only `ucrjtfswnfdlxwtmxnoo`
  inspection was byte-identical before/after (ACL/policy/function fingerprint
  `a73a5c2a1f8389e3b3227b741fe6d5e3`, business `64/51/51/51/51/64/5/0/0/0`, zero
  advisory locks). Full-suite differential (detached worktree vs. entry
  checkpoint): final minus baseline = empty. `OC-C3D-ACL-001` remains
  `PARTIALLY_SATISFIED` — not self-accepted; `OC-C3D-FENCE-001` is `SATISFIED`
  (via §U); `OC-C3D-LOCK-001` unchanged. **Targeted correction (contract §W,
  entry checkpoint `b808a5e`):** a read-only supervisor review of the §V evidence
  returned `CHANGES_REQUIRED` on one blocking evidence defect — the catalog
  post-closure matrix and the Component A/B runtime role matrix were each proven
  but ran in **separate transactions**, so the runtime matrix executed *after*
  the simulated ACL closure had already been rolled back. The correction rebuilds
  `tests/ordem-compra-c3d-acl.integration.sql` as **one outer closure-simulation
  transaction** carrying the manual db/75 ACL revokes + PUBLIC-policy drops, with
  the TEST-ONLY `canonical_active` fixture and the complete Component A/B runtime
  matrix now inside **one nested savepoint (`c3dd_runtime_fixture`)** of that same
  transaction, so the runtime matrix executes while the simulated closure remains
  active (new pre-runtime, mid-runtime, no-drift, post-savepoint, and
  post-outer-rollback proofs). `ROLLBACK TO SAVEPOINT` restores the synthetic
  markers (proven NULL again) while the simulated ACL stays active; the outer
  `ROLLBACK` restores the original catalog byte-for-byte. No `db/*.sql` (db/75/76
  unchanged), script, other test, or product file was touched; `close_final_acl`
  and `activate` are still never invoked. Re-validated across two fresh disposable
  PostgreSQL 18.4 clusters; full-suite failing-identity differential vs. `b808a5e`
  = empty added. `OC-C3D-ACL-001` was subsequently advanced to `SATISFIED` by the
  supervisor acceptance of C3D-D (contract §X). See contract §V/§W/§X and
  `docs/ledgers/G28_LEDGER.md` for the full closeout.
- **`PHASE-C3D-E` (session lock, resource lock, and Component B concurrency
  rehearsal):** `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED`
  (contract §X authorizes it; §Y records the evidence; §Z records supervisor
  acceptance), accepted checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`,
  entry checkpoint `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`. One authorized new file,
  `tests/ordem-compra-c3d-lock-concurrency.mjs`, was validated across two fresh
  disposable local PostgreSQL 18.4 clusters (`C3D_E_LOCK_CONCURRENCY_PASS` both):
  the full session advisory-lock matrix (deterministic key, same-generation
  exclusion, different-generation independence, release/reacquire,
  backend-disconnect auto-release, owner-only boundary, no leak); the installed
  Component B resource-lock order (order → item → idempotency advisory → header
  lookup → allocations asc → ledger asc → inventory advisory) proven by empirical
  `pg_get_functiondef` and a real staged blocker (rolled back pre-PONR, zero
  mutation); real session lock + real `fence_and_snapshot` + the accepted
  synthetic equivalent of `import_and_reconcile` (per-row `import_snapshot_row` +
  `assert_snapshot_and_live`) establishing a 5.000 kg immutable imported opening
  balance under a manual TEST-ONLY `canonical_active` state
  (`close_final_acl`/`activate` never invoked); a two-session Component B sequence
  crossing exactly one synthetic PONR per cluster (T1 → 10.000; T2 waits then
  re-evaluates a fresh +5.000 to 15.000 — no stale 20.000, no deadlock);
  same-key idempotency replay + `idempotencia_conflitante`; the legitimate nested
  canonical-active `ordem_compra_item`/movement path at `pg_trigger_depth()>1`
  with depth-1 denial `55000` (`saldo_fios` exception structural-only — this
  fixture produces no excess; `saldo_fios_op` `NOT_APPLICABLE` — never written by
  the receipt path); deterministic LIFO reversal 15.000 → 8.000 (T2 5.000 then T1
  2.000, T1 3.000 remaining, imported line untouched); imported-balance floor
  rejection at 4.000 (`reducao_abaixo_saldo_importado`, zero mutation); post-PONR
  prohibition compliance; and mandatory full cluster destruction. Read-only
  `ucrjtfswnfdlxwtmxnoo` inspection byte-identical before/after; full-suite
  failing-identity differential (detached worktree at
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571`) added = empty. `PHASE-C3D-E` was
  supervisor-accepted at checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`
  (contract §Z), advancing `OC-C3D-LOCK-001` to `SATISFIED` (its §M item 4 exit
  criteria met). Documentary precision: the two-session blocking relationship is
  recorded accurately as confirmed by **independent observer connections** — the
  captured *observer* marker session is closed before the
  `pg_blocking_pids`/`pg_stat_activity` observations, which run through
  independent transient queries — and `saldo_fios`'s excess branch was not
  empirically executed in the fixed scenario (`kg_alocado` 15.500 > max total
  15.000, no excess line; the exception proven structurally and by the depth-1
  denial) while `saldo_fios_op` is `NOT_APPLICABLE` to the installed
  receipt/reversal/import topology — neither an `OC-C3D-LOCK-001` §M exit
  criterion. See contract §Y/§Z and `docs/ledgers/G28_LEDGER.md` for the full
  closeout.
- **NEXT_AUTHORIZABLE_ACTION:** **architect authorization decision for
  `PHASE-C4` — ADMIN RECEIPT UI** (`OC-C4-ADMIN-001`). `PHASE-C3D` is closed;
  `PHASE-C4`, `PHASE-C5`, environment mutation, branch creation, staging
  validation/application of `db/76`, deployment, real snapshot/import, fence
  transition, read switch, real final ACL-closure invocation, real activation,
  the real cutover (`OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`, additionally
  hard-gated behind the mandatory read-only completeness disposition of the 13
  unmapped `ordens_compra_fio` rows ids 153–165), production access, Supabase
  write, and any further push all remain unauthorized. No product phase chains
  automatically; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`. The next chat
  must re-read the canonical repository before authoring or executing any
  `PHASE-C4` order.

## Workspace and Git boundaries

- **Workspace:** `D:\Programação\controle-tapetes-g28`.
- **Standalone git directory:** `D:\Programação\controle-tapetes-g28\.git`
  (a normal repository — not a linked worktree; the earlier "linked worktree of
  controle-tapetes/.git" and `D:\OneDrive\...` topology facts are superseded).
- **Branch:** `dev`. **Allowed remote:** `production`, `dev` branch push is a
  standing remote-backup authorization from `ORDEM-COMPRA-PHASE-A`; `main`
  remains forbidden; no push to `origin`/`staging` without separate express
  authorization. **No push is authorized by the current action.**
- **Current Git residue:** modified `.gitignore` only (pre-existing, preserved,
  unstaged).

## Environment and production/staging state

- **PRODUCTION (live since `M10`, 2026-07-18):** Supabase `gqmpsxkxynrjvidfmojk`
  ("Inttex"), served by Vercel at `inttracker-jade.vercel.app` from
  `inttexsystem/inttracker` (`main`). Schema (`db/01→64`), migrated data,
  deployed Edge Functions, repointed `js/config.js`, and repointed Ingestor are
  in place.
- **DEVELOPMENT / legacy (formerly "staging"):** `ucrjtfswnfdlxwtmxnoo` —
  retained development database; historical record for the audit trails/test
  rows excluded at `M3` (must not be pruned without a separate architect
  decision). Purchase-order phases through F3R1 were validated here.
- **PROHIBITED / never accessed:** production `bhgifjrfagkzubpyqpew`.
- **Migrations `db/71`–`db/74`** applied and verified in `ucrjtfswnfdlxwtmxnoo`.
  **`db/75` (C3C-A inactive cutover) and `db/76` (C3C-B DB prerequisites) are now
  applied to `ucrjtfswnfdlxwtmxnoo`** (2026-07-20; Supabase migration versions
  `20260720234958` and `20260720235820`), installed **inert**: the database
  remains `legacy_active` with `flat` read authority, both `db/76` functions
  return only their inactive signals (`listar_compat_inativo` /
  `recebimento_compat_inativo`), and no fence, snapshot, import, ACL closure,
  activation, read switch, cutover, productive receipt, deployment, or product
  adaptation occurred. All business tables are byte-for-byte unchanged (seven
  table fingerprints identical pre/post; `ordem_compra_item_compat_fio` = 51
  mappings intact). Status `APPLIED / DEVELOPMENT DB VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  §38). The staging-only stack (`db/12`/`21`/`30`/`49`–`57`) is not applied in
  production by this chain.
- **Supabase MCP:** verified read-only against `gqmpsxkxynrjvidfmojk`; the
  legacy management-scoped credential is still write-capable from `M2`/`M3` —
  **standing reminder: flip back to read-only.**
- **Remotes:** `production` = `inttexsystem/inttracker` (fetch+push, `main`
  only); `origin` = `grupoterrabranca/controle-tapetes`; `staging` =
  `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only).

## POST-LAUNCH DEBT REGISTER (ranked; each `NOT AUTHORIZED` until its own order)

The system is live; every item is `POST-LAUNCH DEBT`. Ranked by production
consequence (1 = most consequential). Full narratives: ledger and archives.

1. **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `ACTIVE PRODUCTION BLOCKER`.**
   Ingestor Google OAuth token expired (`invalid_grant`); no documents enter the
   live system. Fix = interactive Google login (architect action); coupled to #7.
2. **`CAMADA3 BK5-BK8` — no proven production backup.** Exporter manual, proven
   once in staging (`BK4.2`); `M9` never executed; no trigger/retention/restore
   drill. Includes `CAMADA3-TRIGGER-SELECTION` (mechanism: GitHub Actions).
3. **`DELETE-PROD-GUARD-A`** — destructive-delete guard not deployed to production.
4. **`A2-SERVER-SIDE-ENFORCEMENT`** — `nivel_acesso` is client-side only.
   **Binding mitigation:** no `somente_leitura` admin may exist in production
   until this closes.
5. **`A2-CREATE-NIVEL-ACESSO-WIRING`** — `admin-create-user` drops `nivel_acesso`
   (companion to #4; moot only under #4's constraint).
6. **`ANON-GRANT-DEFENSE-IN-DEPTH`** — 27 non-document tables carry raw anon DML
   grants, inert only because RLS evaluates false for anon. Distinct from #8.
7. **`CAMADA3-OAUTH-GRANT-COUPLING`** — backup exporter reuses the Ingestor OAuth
   client; interacts with #1.
8. **`IS-ADMIN-ACL-REVIEW`** — over-broad `EXECUTE` on `public.is_admin()`; not a
   live exposure; needs its own read-only diagnosis.
9. **`CODE-HEALTH-AUDIT-§18-R1`** — accumulated small code-health debts; also
   tracks `UI-EL-BOOLEAN-ATTR-FIX` (active `js/ui.js` `el()` boolean-attr regression).
10. **`TEST-MOCK-FIDELITY`** — residual lots beyond `L1`/`L2` (audit `CLOSED`).
11-13. Cosmetic/frozen UI items: `UI-FIXED-FORMAT-COLUMN-WIDTHS`,
    `UI-ACTION-BUTTON` lot 3, `MODAL-BUTTON-CSS-CHECK`.
14. **Two stale git-worktree registrations** (`tapetes-baseline-check`,
    `baseline-check-a34`) — prunable; auto-prune blocked by an OneDrive/AV lock;
    await one authorized `git worktree prune`.

- **Purchase-order Phase-C open items:** `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`
  (nonblocking); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`; native
  emission inactive/ungranted; a contemporaneous read-only production
  `ordens_compra_fio` diagnosis is mandatory before any production promotion.
- **`C3D-13-UNMAPPED-ROWS-COMPLETENESS-GATE` — binding `REAL_CUTOVER`
  authorization gate (supervisor decision, `PHASE-C3D` closeout).** The
  development database's `ordens_compra_fio` holds 64 rows: 51 mapped (frozen
  REFUND-A corpus) + **13 unmapped, exact ids `153`–`165`**, all
  `rascunho`/`pendente`/`nao_recebido`, `kg_recebido` NULL. Component A cannot
  project them; Component B must fail `mapeamento_compat_ausente` if invoked for
  them; `PHASE-C3D` created no mapping/bridge/migration/backfill/exclusion record
  for them. They are **DEFERRED to the `REAL_CUTOVER` readiness gate** and did
  **not** block `PHASE-C3D` closeout. Before `REAL_CUTOVER` may be authorized, a
  separate read-only completeness diagnosis must disposition **every one** of the
  13 by exactly one of: (1) authorized mapping/backfill and re-baseline; (2)
  documented exclusion from the cutover corpus with business-owner approval; or
  (3) cancellation/removal through a separately authorized business-data action.
  `REAL_CUTOVER` stays **BLOCKED from authorization** until that disposition is
  recorded (`OC-CUTOVER-001` remains `PLANNED` — the gate is a residual-debt
  authorization prerequisite, not a requirement-disposition change).
- **`PHASE-C3D` residual debt register (non-blocking; full register in
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §Z and the ledger):**
  (1) the 13-row completeness gate above is a binding `REAL_CUTOVER` prerequisite;
  (2) the exact real historical reconciliation totals — 39 headers, 44 entries,
  20,221.280 kg, 405.980 kg excess — remain real-cutover evidence; (3) the
  synthetic corpus does not substitute for the real-cutover totals proof; (4)
  real `close_final_acl` invocation, (5) real activation, (6) the real
  read-authority switch, and (7) any productive receipt on a shared or real
  environment all remain unauthorized; (8) the validator active-contract
  self-test fixture limitation remains governance-harness debt; (9) the mandatory
  Node suite retains pre-existing non-determinism — no accepted C3D pass
  introduced a new failing identity; (10) the C3D-E fixed scenario did not
  produce an excess line and therefore did not empirically mutate `saldo_fios`
  (the installed exception and the direct depth-1 denial were proven; not an
  `OC-C3D-LOCK-001` exit criterion); (11) `saldo_fios_op` is `NOT_APPLICABLE` to
  the installed receipt/reversal/import write topology.
- **Registered for review (read-only):** `production` remote branch
  `v0/administrativointtex-9166-cf89b1d8` — a strict ancestor of `main` with zero
  unique commits (Vercel/v0 import artifact); safe to leave or delete.

## Binding decisions in force (condensed; verbatim in archive/ledger)

Full recorded rulings are verbatim in `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
and `docs/ledgers/G28_LEDGER.md`; in any wording divergence the archive/ledger win.

- **Key regime:** new-format keys only (`sb_publishable_…` + matching secret);
  the secret key never appears in chat or the repo.
- **Launch user model:** full-trust admins only — no `somente_leitura` admin in
  production until `A2-SERVER-SIDE-ENFORCEMENT` closes (the constraint IS the
  mitigation).
- **`PRODUCTION-READINESS-DIAGNOSIS-R1`** accepted (2026-07-17); its `M0`-`M10`
  plan was executed and the migration track is `COMPLETE / CLOSED` (2026-07-18);
  the backlog freeze is `LIFTED` — new fronts are authorizable, each by its own order.
- **Supervision governance:** state/authorizations held by Claude (chat) + Claude
  Code (resident); reviewers hold no state custody. Every implementation-phase
  report includes `STRUCTURAL POLICY COMPLIANCE` (`SUPERVISION_PROTOCOL.md`).
- **Controlled Delete × document history:** physical Pedido/OP deletion is blocked
  when canonical document history exists (`PEDIDO_OP_SCHEMA_CONTRACT.md`).
- **Language policy:** English for canonical docs/reports/new code + commit
  messages; pt-BR for UI text; architect orders may be issued in Portuguese and
  recorded in English (original preserved in ledger/archive); phase IDs never
  translated. Homes: `DOCUMENTATION_MODEL.md` §18, `CODE_HEALTH_RULES.md` §19,
  `SUPERVISION_PROTOCOL.md` §3.
- **Standing product decision (open):** `YARN-MANTER-PEDIDO-REDUNDANCY` — architect
  to decide keep-or-remove of the `Manter pedido` button; non-blocking.

## Product and environment prohibitions

`PHASE-C3C-B-DB-PREREQ` implementation (migration `db/76`, three tests, applied
`§R.29.7`/`§13.18`, contract §§35–37) is `CLOSED / TECHNICALLY ACCEPTED / LOCAL
DB VERIFIED`, and `db/75`+`db/76` are now **applied to the development/legacy
database `ucrjtfswnfdlxwtmxnoo`, inert and supervisor-accepted**
(`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
§39). `PHASE-C3C-B` application compatibility/adaptation is
**`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`**
(`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36, supervisor-accepted
2026-07-21 at checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`). The
`PHASE-C3D` material phase contract
(`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`) is now
**`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`** — all five
material sublots (C3D-A…C3D-E) and the `PHASE-C3D-F` documentation-only closeout
accepted, all four `OC-C3D-*` requirements `SATISFIED`, accepted technical
checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (§Z). This `PHASE-C3D-F`
pass is **documentation-only**: it changes only the seven authorized canonical
owners (state, handoff, documentation index, C3D contract, traceability,
backlog, ledger) and records one authorized fast-forward push to `staging/dev`.
`PHASE-C3D` performed **no real cutover**. Beyond this closeout, `PHASE-C4` and
`PHASE-C5`, staging application/validation of `db/76`, activation, deployment,
real snapshot/import, fence transition, read switch, real final ACL-closure
invocation, real activation, the real cutover
(`OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`, additionally hard-gated behind the
mandatory read-only completeness disposition of the 13 unmapped
`ordens_compra_fio` rows ids 153–165), branch creation, production access,
Supabase writes, `main`, `origin`/`production` remote mutation, and any further
push all remain **UNAUTHORIZED**. Production `bhgifjrfagkzubpyqpew` must not be
accessed.

**Supervisor acceptance of the `PHASE-C3D` contract and `PHASE-C3D-A`
authorization/implementation (this pass):** the "PHASE-C3D-A — ENVIRONMENT
AND DEPLOYMENT-MANIFEST QUALIFICATION" order recorded the supervisor's
acceptance of `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` at
entry checkpoint `ab30c5115bb79c8952cc5575b68f8b976497699d` (§0c) and
explicitly authorized `PHASE-C3D-A` alone (§D Option 2 — disposable isolated
local PostgreSQL plus read-only shared-DB inspection). `PHASE-C3D-A` is now
`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` (contract
§O): `scripts/c3d/bootstrap-disposable-cluster.mjs` and
`tests/ordem-compra-c3d-deploy.smoke.js` only; `db/01`…`db/76` were **not**
applied to any cluster or database by this pass; the disposable local
PostgreSQL cluster and its temp directory were destroyed after every run
(verified across three consecutive smoke-test runs); the shared development
database `ucrjtfswnfdlxwtmxnoo` received only read-only inspection (zero
DDL/DML/mutating RPC). This pass changes only the affected canonical
current-state, traceability (untouched — no `OC-C3D-*` disposition changes),
ledger, and phase-contract owners, and records one authorized fast-forward
push to `staging/dev`. `PHASE-C3D-B` and every later sublot, staging
application/validation of `db/76`, activation, deployment, real
snapshot/import, fence transition, read switch, final ACL-closure
invocation, cutover, branch creation, C4, C5, production access, Supabase
writes, `main`, `origin`/`production` remote mutation, and any further push
all remain **UNAUTHORIZED**.

## Accepted-phase index (concise)

Full closeout narratives are in `docs/ledgers/G28_LEDGER.md` and the archives.
Commit SHAs there are the accepted technical commits; consult HEAD via Git.

### Purchase-order refoundation + Phase-C + governance track

| Phase | Status | Date |
|---|---|---|
| `PHASE-C3D` (inactive deployment & rehearsal material phase; sublots C3D-A…C3D-E `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` at `096cd60`/`5441321`/`6fd63a5`/`5a2be05`/`429aa39`; C3D-F documentation-only closeout §Z; all four `OC-C3D-*` `SATISFIED`; accepted technical checkpoint `429aa39`) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` | 2026-07-21 |
| `PHASE-C3C-B` (application compatibility/adaptation; adapter + 9 call-sites + corrections §34/§35, contract §36 supervisor acceptance, checkpoint `22bfb192`) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` | 2026-07-21 |
| `PHASE-C3C-B-DB-PREREQ` (implementation + DB-backed validation, `db/76` + 3 tests + `§R.29.7`/`§13.18` + contract §35/§36/§37) | `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING DATABASE` | 2026-07-20 |
| `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT` (ratification closeout / R3 documentary forward correction, §34) | `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET AUTHORIZED` | 2026-07-20 |
| `C3C-B-MATERIAL-PHASE-CONTRACT-R1` (forward correction, commit `6585a6c`) | `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT AUTHORIZED` | 2026-07-20 |
| `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` (accepted commit `1157b9e`) | `CLOSED / ACCEPTED` | 2026-07-20 |
| `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1` | `CLOSED / ACCEPTED` | 2026-07-20 |
| `PHASE-C3C-A` (inactive impl. documentary closeout R1, `db/75`, R2-R4) | `CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` | 2026-07-20 |
| `PHASE-C3B` executable contract closure R1 (§R.29 / §13.15) | `CLOSED / ACCEPTED` | 2026-07-19 |
| Hybrid Origin — `F3R1` staging DB/API validation + Phase-C revalidation (`db/74`) | `CLOSED / ACCEPTED_WITH_SCOPED_COMMITTED_CONCURRENCY_FIXTURE_WAIVER` | 2026-07-19 |
| Hybrid Origin — `F2` Pedido/Insumos UI cutover R1 | `CLOSED / ACCEPTED_LOCALLY_WITH_INTEGRATED_STAGING_VALIDATION_REQUIRED` | 2026-07-19 |
| Hybrid Origin — `F1` forward correction implementation R1 (`db/74`) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_BASELINE_TEST_DEBT` | 2026-07-19 |
| Hybrid Origin — `F1` executable contract closure R1 (§R.28 / §13) | `CLOSED / ACCEPTED` | 2026-07-19 |
| Hybrid Origin — Canonical Documentation Correction R2 (§R.27) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PHASE-C3A` (inactive cutover foundation + import, `db/71`-`db/73`) | `CLOSED / TECHNICALLY ACCEPTED` | 2026-07-19 |
| `PHASE-C2` native receipt foundation (`db/70`, §R.25) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PHASE-C1` native receipt authority contract (§R.24) | `CLOSED / ACCEPTED` | 2026-07-19 |
| `PRE-PROD-A-R1` native needs/allocation + live concurrency (`db/69`, §R.23) | `CLOSED / ACCEPTED_WITH_NONBLOCKING_ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT` | 2026-07-19 |
| `REFUND-B1` native draft admin (`db/68`, §R.22) | `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES` | 2026-07-19 |
| `REFUND-B1-CONTRACT-R2` (authorized) / `-R1` (not accepted, superseded) | `AUTHORIZED` / `SUPERSEDED` | 2026-07-19 |
| `REFUND-A` four-layer refoundation schema + conversion (`db/67`) | `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT` | 2026-07-19 |
| `ORDEM-COMPRA REFOUNDATION` — Part R (four-layer model) | `RATIFIED / ACCEPTED` | 2026-07-18 |

### Earlier tracks (indexed; full detail in ledger/archives)

| Track | Status | Date |
|---|---|---|
| Purchase Order Lifecycle (flat) — Phases `A` (`db/65`) + `B1` (`db/66`) + Spec Amendment | `CLOSED / ACCEPTED` (persistence superseded by REFUND-A) | 2026-07-18 |
| `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1` | `RATIFIED` | 2026-07-18 |
| `YARN-BUTTONS-PHASE-1` (+ corrections) | `CLOSED / ACCEPTED` | 2026-07-18 |
| `G28-MIGRATION-TRACK` `M0`-`M10` (live at Vercel/`gqmpsxkxynrjvidfmojk`) | `COMPLETE / CLOSED`; `M7`/`M9` `SUPERSEDED BY REALITY` | 2026-07-17/18 |
| `PRODUCTION-READINESS-DIAGNOSIS-R1` (ratified reference report) | `ACCEPTED` | 2026-07-17 |
| `G28-CAMADA-3` (`BK1`-`BK4.2`; `BK5`-`BK8` = post-launch debt) | `CLOSED / ACCEPTED` at `BK4.2` | 2026-07-17 |
| `G28-CAMADA-2` (`A1`-`A7` + password policy) | `TRACK COMPLETE / CLOSED / ACCEPTED` | 2026-07-17 |
| `TEST-MOCK-FIDELITY-AUDIT`, `L1`/`L2` | `CLOSED / ACCEPTED` | 2026-07-17 |
| `DOC-LANGUAGE-MIGRATION-L1`/`L2`/`L3`, `PROJECT-STATE-COMPACTION-A`/`B` | `CLOSED / ACCEPTED` | 2026-07-16/17 |
| `G28-C` (documents front) | `CLOSED / TECHNICALLY ACCEPTED — PRODUCT VALIDATION PENDING` | 2026-07-15 |
| Client Portal read-model + ACL grants (`db/30`/`db/57`), Controlled Delete guard (`db/53`-`db/56`) | `CLOSED / ACCEPTED` | 2026-07-15 |
| `PROJECT-CONTROL-BASELINE-R1` (ChatGPT) | `REJECTED / NOT RATIFIED` | 2026-07-15 |
| 2026-07-16 and earlier phases (Camada-2 subphases, UI tracks, docs) | mixed `CLOSED / ACCEPTED` — see ledger/archives | 2026-07 |

## Governing specifications and canonical paths

- Governing spec (Phase-C3 §R.29 core unchanged; `§R.29.7` legacy-compat DB prerequisites applied 2026-07-20): `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
- Technical contract (§13.15 unchanged; `§13.18` legacy-compat receipt-adapter schema applied 2026-07-20): `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
- Sequence authority: `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
- Active-track traceability: `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
- C3C-B material phase contract (`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  LOCALLY VERIFIED` — application adaptation supervisor-accepted at §36, not
  active): `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`
- C3D material phase contract (`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  LOCALLY VERIFIED` — inactive deployment & rehearsal; sublots C3D-A…C3D-E
  `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` (§R/§U/§X/§Z), C3D-F
  documentation-only closeout (§Z), all four `OC-C3D-*` `SATISFIED`, accepted
  technical checkpoint `429aa39`; **not active** — `ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` are `NONE`):
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
- C3C-B database prerequisites contract (closed / technically accepted / local DB verified / not applied to staging database; §35 records the implementation closeout, §36 records DB-backed validation completion, §37 records supervisor acceptance, not active): `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
- Append-only ledger: `docs/ledgers/G28_LEDGER.md`
- Derived operational handoff: `AGENT_HANDOFF.md`
- Documentation authority arbiter: `docs/DOCUMENTATION_INDEX.md`
- Documentation governance model: `docs/governance/DOCUMENTATION_MODEL.md`
- Supervision protocol: `docs/governance/SUPERVISION_PROTOCOL.md`
- Shared agent instructions: `docs/governance/AGENT_INSTRUCTIONS.md`
- Master plan (documents front): `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Pedido/OP/Movimentação/Documentos plan: `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Migration diagnosis (accepted reference): `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`
- Backup contract: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`
- Ingestor local state (technical context): `services/documents-ingestor/PROJECT_STATE.md`

## Historical reference (not sources of current state)

- Handoff stack archive: `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md`
- State closeout archive: `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
- Pre-model preservation: `docs/legacy/pre-model/MANIFEST.md`
- pt-BR pre-translation original: `docs/archive/pt-BR/PROJECT_STATE.md`

The complete pre-first-compaction content is preserved byte-for-byte in
`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md` (manifest
`docs/legacy/pre-model/MANIFEST.md`; origin commit
`08b9af5e251de48e938600e5e4b4214e4d1e824e`; SHA-256
`7cacddd59c5b2fe9bae1add1a54a3433c370ccdad713bbd4010a1d11f1b39a98`). That
snapshot is not a source of current state and must not be edited.
