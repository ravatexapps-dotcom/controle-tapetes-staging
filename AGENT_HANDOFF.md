# ACTIVE OPERATIONAL HANDOFF

> Derived, single active operational handoff. **Not** a second state owner:
> live current state belongs solely to `PROJECT_STATE.md`. The accumulated
> historical handoff stack that previously lived here was preserved verbatim in
> `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` by
> `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` (2026-07-20) and is superseded.

## Workspace and Git

- **Workspace:** `D:\Programação\controle-tapetes-g28`.
- **Standalone git directory:** `D:\Programação\controle-tapetes-g28\.git`
  (a normal repository, not a linked worktree).
- **Branch:** `dev`.
- **HEAD / worktree / index / staging / divergence:** live facts — derive from
  Git (`git rev-parse HEAD`, `git status --short --untracked-files=all`). Do not
  treat any copied HEAD as canonical. Compaction baseline HEAD (reference only):
  `17ff8adddaa9f2fd3bc61af7261d9ebaad275f08`.
- **Accepted checkpoint (stable, from the bootstrap):**
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (the accepted `PHASE-C3D` technical
  checkpoint; the `PHASE-C3D-F` documentation-only closeout commit is the
  closeout-documentation checkpoint, not a new technical evidence checkpoint).
- **Current Git residue:** modified `.gitignore` only (pre-existing, preserved,
  unstaged). No other tracked residue.

## Phase status

- **Last accepted product phase:** `PHASE-C3C-B` (application compatibility/
  adaptation) — `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`
  (2026-07-21), accepted checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36). No database,
  environment, or deployment action; the adapters' canonical branches remain
  unverified against a live `canonical_active` state (C3D/real cutover).
- **Prior accepted database-prerequisites phase:** `PHASE-C3C-B-DB-PREREQ` —
  `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING
  DATABASE` (2026-07-20), technical checkpoint
  `34d7d231d0875093bc2091f385c61cf35fa0b5cb` (contract §37). Validation occurred
  only in a disposable local PostgreSQL 18.4 cluster; `db/76` is not applied to
  any staging database.
- **Prior accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING` (2026-07-20),
  technical checkpoint `89123729b3529fff6e4a2336bfec2907c4b94b4c`.
- **Last accepted product phase:** `PHASE-C4` (admin receipt UI at
  `#/ordens-compra/:id`) — supervisor-accepted and architect-visual-validated
  2026-07-21 under `C4-CLOSEOUT-AND-C5-CONTRACT-R1` (contract §0d, `STATUS:
  CLOSED / ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`).
  `OC-C4-ADMIN-001` is `SATISFIED`. Accepted technical checkpoint
  `289b0cca66e9c057330a882f69da3476adf90469`. `ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` are `NONE` (moved back to `NONE` at this closeout).
  The implementation (`C4-ADMIN-RECEIPT-UI-IMPLEMENTATION-R1`, contract §0c)
  plus the visual-gate correction (`C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1`) —
  three new `ordem-compra-receipt-*.js` files + additive
  `ordem-compra.js`/`index.html`, native RPCs only, two independent
  idempotency trackers, four smoke suites (38/38 pass), empty
  added-failing-identity differential vs `bdd4c7d` (implementation) and
  `25cbdd6` (visual correction), validator PASS; local only (no
  migration/environment/staging/deployment/push) — are the accepted
  implementation evidence. The visual-gate pass aligned the render/events
  modules to the canonical `--rv-*` tokens (card 6px, neutral section chip,
  sticky total; correcting the contract §13.1 factual claim that tokens.css
  was not linked — it is, globally at `index.html:11`) and produced six
  deterministic Playwright screenshots + computed-style evidence
  (`%TEMP%\\ravatex-c4-visual-review\\`), which the supervisor reviewed and
  accepted at this closeout (`SUPERVISION_PROTOCOL.md` §4 satisfied). One
  nonblocking debt recorded at closeout:
  `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (shared `js/ui.js`
  `modal()`/input primitives still ≈8px, outside the C4 manifest, needs a
  separately authorized global UI pass). **`PHASE-C3D` (inactive deployment
  & rehearsal material phase)** is `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  LOCALLY VERIFIED`, accepted **technical** checkpoint
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (contract §Z). All five material
  sublots are `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED`: `PHASE-C3D-A`
  `096cd60325e4987010d328c856ee6a3a51ca66bf`; `PHASE-C3D-B`
  `5441321014883c4e8149dc8b20da9d053a193699` (both supervisor-accepted §R);
  `PHASE-C3D-C` `6fd63a56a123d6d006353c6ae629611cbc7c01e9` (§U); `PHASE-C3D-D`
  `5a2be05c19a62346b906f7b3cbb0b89d07b3a571` (§X); `PHASE-C3D-E`
  `429aa3980c7027b9d872a1902e2f31f1a4a85a2a` (§Z). `PHASE-C3D-F` (aggregate
  closeout & readiness disposition) is `CLOSED / ACCEPTED / DOCUMENTATION-ONLY`
  (§Z) — no real cutover. All four `PHASE-C3D` requirements are now `SATISFIED`:
  `OC-C3D-DEPLOY-001`, `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, and
  `OC-C3D-LOCK-001` (the last advanced by the supervisor acceptance of
  `PHASE-C3D-E`). The `PHASE-C3D-E` two-session blocking relationship is recorded
  accurately as confirmed by **independent observer connections** (the captured
  *observer* marker session is closed before the observations, which run through
  independent transient queries); `saldo_fios`'s excess branch was not
  empirically executed (`kg_alocado` 15.500 > max total 15.000) and
  `saldo_fios_op` is `NOT_APPLICABLE` — neither an `OC-C3D-LOCK-001` §M exit
  criterion. `PHASE-C4` is now closed (see above); `PHASE-C5`/`REAL_CUTOVER`
  remain unauthorized.
- **Active phase contract:** `NONE`. The now-**closed** `PHASE-C4` material
  contract is `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C4`, `STATUS: CLOSED / ACCEPTED / LOCALLY VERIFIED /
  ARCHITECT VISUAL VALIDATION PASSED`, §0d). The now-**closed**
  `PHASE-C3D` material
  contract is `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C3D`; `ACCEPTED`, §0c; C3D-A evidence §O/§P; C3D-B evidence
  §Q; C3D-A/B acceptance + pre-PONR rollback correction §R; C3D-C evidence
  §S/§T + acceptance §U; C3D-D evidence §V, targeted correction §W, acceptance
  §X; C3D-E evidence §Y; C3D-E acceptance + aggregate `PHASE-C3D`/`PHASE-C3D-F`
  closeout §Z).
- **Active track:** `PURCHASE_ORDER_PHASE_C` (no active phase; next
  authorizable action is read-only diagnosis and documentation-only authoring
  of the `PHASE-C5` material contract, `OC-C5-EMISSION-001`).
- **Current governance status:** `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1`
  **ACCEPTED**; `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` **ACCEPTED** by the
  supervisor at commit `1157b9e71bc629903c5940ab50d4b370964e560e` (state/handoff
  compaction; historical content preserved in tracked archives + the append-only
  ledger; validator PASS; self-tests 47/47 PASS).
- **`PHASE-C3C-B-DB-PREREQ` (implementation + DB-backed validation +
  supervisor acceptance):** `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED
  / NOT APPLIED TO STAGING DATABASE` (2026-07-20, contract §37).
  `db/76_ordem_compra_c3c_b_db_prerequisites.sql` exists — Component A
  (`listar_ordens_compra_fio_compat`) and Component B
  (`registrar_recebimento_ordem_compra_fio_compat`), both inert until
  `canonical_active`, plus one additive `idempotency_namespace` `CHECK`; the
  corrected `§R.29.7`/`§13.18` deltas were applied; an installed-shape-guard
  finding was resolved by the architect ruling in contract §35 (reuse native
  command types, compat identity in `idempotency_namespace='legacy_compat_receipt_v1'`,
  no `recebimento_compat`, shape guard unchanged). A disposable, isolated local
  PostgreSQL 18.4 cluster (contract §36) then applied the full `db/01`…`db/76`
  sequence, reapplied `db/76` (idempotent), ran both DB-backed tests to PASS,
  rehearsed a real persisted rollback + reapply, and reran both tests to PASS
  again; one genuine `db/76` defect (a PL/pgSQL naming ambiguity in Component A)
  was found and corrected. The two C3C-A DB-backed regressions
  (`tests/ordem-compra-c3c-inactive.integration.sql`/`-concurrency.mjs`) remain
  genuinely unexecutable against any synthetic corpus (pre-existing, unrelated
  to `db/76`) — recorded as nonblocking C3C-A fixture debt. Static smoke
  suites PASS (49/49). `db/76` is **not applied to any staging database**.
  Supervisor acceptance does not mark any dependent requirement `SATISFIED`.
- **Development-DB application (`db/75`→`db/76`, 2026-07-20):** the separately
  authorized development/legacy-database application has been **executed and
  verified** against `ucrjtfswnfdlxwtmxnoo` — `db/75` (version `20260720234958`)
  and `db/76` (version `20260720235820`), both **inert** (`legacy_active`/`flat`;
  inactive-signal-only readers/writers; zero business-data mutation). Recorded in
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §39 as
  supervisor-**ACCEPTED**.
- **`PHASE-C3C-B` (application compatibility/adaptation):** `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` — supervisor-accepted
  2026-07-21 at `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36, over §§33–35;
  activated by its §32 forward correction). New shared adapter
  `js/screens/ordem-compra-receipt-cutover.js` plus nine adapted call-sites
  (`js/screens/op-writes.js`, `js/screens/fornecedor.js`,
  `js/screens/pedido-detail-data.js`, `js/screens/op-nova.js`,
  `js/screens/op-persistir.js`, `js/screens/op-recalculo.js`, `index.html`).
  **§34 supervisor-review correction** (commit
  `fix: preserve C3C-B receipt idempotency attempts`): real receipt UI
  closures now own and retain their idempotency-attempt tracker across
  retries of unchanged intent (`js/screens/op-writes.js`,
  `js/screens/fornecedor.js`, `js/screens/op-nova.js`,
  `js/screens/pedido-detail-events.js`), and the missing-function classifier
  now checks the exact `42883` SQLSTATE only (message-text alternative
  removed). Full mandatory Node suite (3985 tests, +25 from this
  correction's own tests) has a 122-failure set — 2 fewer than the prior
  124-failure baseline (both incidental fixes of pre-existing CRLF-unaware
  regex assertions sharing a string this correction's test edit also
  touched); every other failure is the same pre-existing, unrelated set —
  zero regressions attributable to this correction; validator PASS. No
  dependent `OC-C3-*` requirement is `SATISFIED`.
  **§35 further correction** (commit `fix: complete C3C-B retry
  classification proof`, on top of `f9b1a54cc7b185a5e72f50209322d1473e93e8
  50`): the RPC-call-level error classifier's "any error except 42883 ⇒
  ambiguous" rule was replaced with a finite predicate (`status === 0` is
  the only genuine-transport-ambiguity signal, grounded in the real
  `@supabase/postgrest-js` response shape); a real DOM-click + stateful-mock
  runtime proof was added for `pedido-detail-events.js`'s receipt form
  (previously proven only statically). Only `js/screens/ordem-compra-
  receipt-cutover.js` and five test files changed. Full mandatory Node suite
  (3993 tests, +8) has the same 122-failure set as the `f9b1a54` baseline —
  byte-identical failing-name set, zero regressions; validator PASS. No
  dependent `OC-C3-*` requirement is `SATISFIED`.
- **`C4-MATERIAL-PHASE-CONTRACT-R1` (this pass, read-only reconciliation +
  documentation-only phase-contract authoring):** authored
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C4`,
  `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT
  AUTHORIZED`). Full canonical reread performed (governance, lifecycle spec,
  schema contract, traceability, backlog, C3D/C3C-B precedent contracts,
  ledger tail, and — for the visual contract specifically —
  `docs/architecture/UI_VISUAL_CONTRACT.md`, confirmed authoritative in place
  of the untracked `.claude/design-skill/`, verified absent from this
  worktree). Reversal ownership resolved as in-scope from explicit anchors
  (`§R.24.9`/`§R.24.10`/`§R.25.4`/`§R.29.6`/`§R.31`), not left `UNPROVEN`. No
  database prerequisite found necessary; a closed three-new-file product
  manifest and an explicit unchanged-file list were defined. No product,
  test, script, migration, or protected-residue change; no database,
  environment, or deployment action. `OC-C4-ADMIN-001` remains `PLANNED`;
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`.
- **`C4-CONTRACT-CORRECTION-R1` (documentation-only, this pass):** corrected
  a non-compliant supervisor review response and restated the C4 contract's
  file manifest in an unambiguous two-list form
  (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` §10/§11 —
  `js/screens/ordem-compra.js` is authorized for additive modification only).
  **RATIFIED**, no longer open: administrator reversal ownership (§2) and the
  row-level compact icon-only reversal-button pattern
  (`UI_VISUAL_CONTRACT.md` §8.1, §13.1). **Recorded** a pre-existing,
  out-of-scope defect,
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` — `createEvents()`
  captures a stale `state.ordem` snapshot before `loadOrdemDetail()` runs,
  so the cancel handler on `#/ordens-compra/:id` calls
  `cancelar_ordem_compra` with `p_ordem_id: undefined`; see
  `PROJECT_STATE.md` POST-LAUNCH DEBT REGISTER item 15 and contract §21.
  Not part of `PHASE-C4`; requires its own separate correction order.
- **`C4-CLOSEOUT-AND-C5-CONTRACT-R1` — supervisor acceptance + `PHASE-C4`
  closeout (this pass):** the supervisor performed the mandatory architect
  visual validation (`SUPERVISION_PROTOCOL.md` §4) of the six-PNG evidence
  packet from `C4-ADMIN-RECEIPT-UI-VISUAL-GATE-R1` and **ACCEPTED** `PHASE-C4`
  as final and binding — `CLOSED / ACCEPTED / LOCALLY VERIFIED / ARCHITECT
  VISUAL VALIDATION PASSED` (contract §0d). `OC-C4-ADMIN-001` is now
  `SATISFIED`. Accepted technical checkpoint
  `289b0cca66e9c057330a882f69da3476adf90469`. Two nonblocking debts recorded:
  `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (unchanged) and
  `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (new — shared `js/ui.js`
  primitives, ≈8px, outside the C4 manifest). `LAST_ACCEPTED_PHASE` becomes
  `PHASE-C4`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `NONE`.
- **Next authorizable action:** read-only diagnosis and documentation-only
  authoring of the `PHASE-C5` material contract (`OC-C5-EMISSION-001`,
  purchase-order emission) — `PHASE-C5` implementation remains unauthorized.
  `PHASE-C3D-A`/`PHASE-C3D-B` are supervisor-accepted (§R, checkpoints
  `096cd603…` / `5441321…`), `PHASE-C3D-C` (§U, `6fd63a56…`), `PHASE-C3D-D` (§X,
  `5a2be05…`), and `PHASE-C3D-E` (§Z, `429aa39…`) are all `CLOSED / TECHNICALLY
  ACCEPTED / LOCALLY VERIFIED`; `PHASE-C3D-F` is `CLOSED / ACCEPTED /
  DOCUMENTATION-ONLY` (§Z). All four `OC-C3D-*` requirements
  (`OC-C3D-DEPLOY-001`, `OC-C3D-FENCE-001`, `OC-C3D-ACL-001`, `OC-C3D-LOCK-001`)
  are now `SATISFIED`; `PHASE-C3D` aggregate is `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` at accepted technical
  checkpoint `429aa39…`.
  **`REAL_CUTOVER` is BLOCKED from authorization** until a separate read-only
  completeness diagnosis dispositions **every one** of the 13 unmapped
  `ordens_compra_fio` rows (exact ids `153`–`165`, all
  `rascunho`/`pendente`/`nao_recebido`, `kg_recebido` NULL) by exactly one of:
  (1) authorized mapping/backfill and re-baseline; (2) documented exclusion with
  business-owner approval; or (3) cancellation/removal through a separately
  authorized business-data action. `OC-CUTOVER-001` remains `PLANNED` (the
  13-row gate is a residual-debt authorization prerequisite, not a
  requirement-disposition change).
  The `PHASE-C3D` contract
  (two forward-corrected `PROPOSED` rounds — §0 R1: requirement disposition,
  the actor-path vs. structural eight-table fence proof split,
  disposable-cluster-only PONR semantics for the C3D-E concurrency proof, and
  the exact future manifest; §0b R2: a common documentary manifest so each
  C3D-A…E sublot can record its own canonical evidence, reclassification of
  the C3D-C fence proof as a **database-faithful authenticated actor-context**
  SQL proof, and a wildcard-wording correction) was **`ACCEPTED`** by the
  supervisor (§0c) at entry checkpoint
  `ab30c5115bb79c8952cc5575b68f8b976497699d`, with `PHASE-C3D-A` (environment
  & deployment-manifest qualification, §D Option 2 — disposable isolated
  local PostgreSQL + read-only shared-DB inspection) explicitly authorized.
  `PHASE-C3D-A` is now `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE` (§O): `scripts/c3d/bootstrap-disposable-cluster.mjs` +
  `tests/ordem-compra-c3d-deploy.smoke.js` only, no migration applied to any
  cluster or database, disposable-cluster process/directory proven removed
  after every run, read-only shared-DB inspection succeeded (not
  `UNPROVEN`). No `PHASE-C3D-B`/`C3D-C`/`C3D-D`/`C3D-E`/`C3D-F`
  implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, cutover, C4, C5, production
  access, Supabase write, or any further push beyond the one authorized
  `staging/dev` fast-forward for this pass is authorized. **`ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` are `PHASE-C3D-A` /
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`**, pending that
  review; no product phase chains automatically beyond `PHASE-C3D-A`.
  **Supervisor-review correction (contract §P), on top of commit
  `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb`:** `CHANGES_REQUIRED` for three
  findings, all corrected — canonical `ACTIVE_PHASE` identity is
  `PHASE-C3D-A` everywhere (bootstrap block and this contract's own
  `PHASE_ID` marker); the bootstrap script's shutdown now proves captured
  postmaster-PID absence, port closure, and directory removal in that order,
  fails closed on any unproven step, preserves both the original and any
  cleanup error on the bootstrap-failure path, and stays retry-safe without
  poisoning a failed attempt; and an exact worktree-based failing-identity
  differential against the `ab30c511` baseline replaced the prior count-only
  comparison (baseline 137, corrected 122, added = 0, 15 pre-existing
  identities absent and reported as non-determinism, not claimed as a fix).
  `PHASE-C3D-A` remains `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`.
  **`PHASE-C3D-B` (contract §Q):** the supervisor-accepted `PHASE-C3D-A`
  (checkpoint `096cd603…`) is now closed and the material-contract identity
  restored to `PHASE-C3D` (§Q.1). One authorized new file,
  `tests/ordem-compra-c3d-deploy.integration.sql`, was validated across two
  fresh disposable local PostgreSQL 18.4 clusters that each applied the exact
  ordered `db/01`…`db/76` (a classification-shape-only synthetic 64-row corpus
  loaded before `db/67`; reconciliation `64/51/51/51/51`; no real/copied data),
  proved `db/75`/`db/76` terminal, the cutover singleton
  `legacy_active`/`flat`/`not_started`/all-null, Component A →
  `listar_compat_inativo`/`55000`, Component B → `recebimento_compat_inativo`,
  zero mutation / PONR NULL / no advisory-lock leak, `db/76` idempotent reapply
  (no drift/duplicate) and `db/75` single-application (object convergence, not
  full reapply — a full reapply would revert `db/76`'s additive `c3c_hash_check`
  extension), and proven process/port/temp-directory destruction after each
  run. Application fallback proven by the unmodified accepted adapter (`22bfb192`)
  + existing tests; `ucrjtfswnfdlxwtmxnoo` re-confirmed inert read-only.
  **Supervisor-accepted (§R, 2026-07-21)** at checkpoint `5441321…`; the
  combined C3D-A + C3D-B evidence advanced `OC-C3D-DEPLOY-001` to `SATISFIED`,
  and the §G item 9 pre-PONR rollback wording was corrected (§R.2: restores
  `flat` reads only, keeps `maintenance_fenced`, does not restore
  `legacy_active` or flat grants). `PHASE-C3D-C` was then `AUTHORIZED / NOT
  STARTED` (fresh session required).
  **`PHASE-C3D-C` (contract §S):** implemented from a fresh session at entry
  checkpoint `7f73b4d8210da249ddd5b085c7c3b59244afd72b`. One authorized new
  file, `tests/ordem-compra-c3d-fence.integration.sql`, was validated across
  two fresh disposable local PostgreSQL 18.4 clusters: pre-fence admin/
  matching-supplier authorization controls (rolled back, byte-identical
  target row after); fence entry to `maintenance_fenced/flat/previewed`
  (`cutover_generation=930003001`, `source_snapshot_count=51`); Evidence 5A
  (database-faithful authenticated admin + matching-supplier actor-context
  UPDATE probes, exact `legacy_receipt_fenced`/`55000`, no `42501`, zero
  mutation, `auth.uid()` still resolving); Evidence 5B (8-table × 3-operation
  = 24 owner-level structural probes, all exact `legacy_receipt_fenced`/
  `55000`, zero mutation; the `saldo_fios`/`saldo_fios_op` internal
  trigger-depth exception's nested-path runtime deferred, not fabricated, to
  `PHASE-C3D-E`); and a pre-PONR rollback rehearsal (test-only fixture,
  `ordem_compra_c3c_pre_ponr_rollback` restoring `flat` reads while `status`
  stays `maintenance_fenced`, byte-identical grants/policies, no
  `legacy_active` regression, clean advisory-lock release). Both runs proved
  full process/port/directory cleanup; `ucrjtfswnfdlxwtmxnoo` read-only
  inspection was byte-identical before/after. Full-suite differential
  (detached temporary worktree at the entry checkpoint): baseline 141 /
  workspace 122 failing identities, **added = 0**. Validator self-test:
  identical pre-existing active-contract fixture-harness failure both sides,
  no new failure.
  **Targeted correction (contract §T):** closed four incomplete-evidence
  findings without redesigning the already-passing behavior — four
  `ordem_compra_c3c_assert_snapshot_and_live` invocations plus a
  byte-compared snapshot/inventory evidence anchor (exact live-versus-frozen
  hash proof); an empirical `pg_get_functiondef` catalog proof that the
  installed `saldo_fios`/`saldo_fios_op` trigger-depth exception is exactly
  one `pg_trigger_depth()>1 AND v_state='canonical_active'` gate with no
  broader pass-through (nested-path runtime still deferred, not fabricated,
  to `PHASE-C3D-E`); replaced the overstated in-session "idle" claim with a
  captured test-backend PID proven absent from `pg_stat_activity` via a
  separate connection after `psql` exit; and corrected the
  `OC-C3D-FENCE-001` traceability language (Option 2 — disposable-local-only
  — is the selected and sole environment strategy; no real/staging fence
  rehearsal required or authorized by C3D-C). Re-validated across two fresh
  disposable clusters, full-suite differential still empty, validator
  self-test still identical pre-existing failure only. `PHASE-C3D-C` was then
  **supervisor-accepted (contract §U, checkpoint `6fd63a56…`)** — `CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED`, advancing `OC-C3D-FENCE-001` to
  `SATISFIED`.
  **`PHASE-C3D-D` (contract §V, corrected §W,
  `tests/ordem-compra-c3d-acl.integration.sql`):** rehearsed the effective
  post-closure ACL matrix (14-table / 11-column / 7-sequence / policy / function)
  and the eight-actor Component A/B runtime matrix across two fresh disposable
  local PostgreSQL 18.4 clusters WITHOUT invoking
  `ordem_compra_c3c_close_final_acl` (`final_acl_closed_at` NULL throughout the
  simulation; a reported DOCUMENTARY deviation covers the TEST-ONLY
  canonical_active fixture's synthetic markers, §V.3); byte-identical
  catalog/business rollback; separate-connection backend absence; read-only
  `ucrjtfswnfdlxwtmxnoo` byte-identical before/after. **§W targeted correction:**
  a read-only review returned `CHANGES_REQUIRED` because the catalog matrix and
  the runtime role matrix ran in separate transactions (runtime executed after
  the closure was already rolled back); the correction rebinds them into one
  outer closure-simulation transaction with the fixture + runtime matrix in a
  nested savepoint (`c3dd_runtime_fixture`), so the matrix runs under the active
  simulated closure (new pre-runtime / mid-runtime / no-drift / post-savepoint /
  post-outer-rollback proofs), re-verified across two fresh clusters; db/75/db/76
  and every other file byte-unchanged. `PHASE-C3D-D` is `IMPLEMENTED / LOCALLY
  VERIFIED / CHANGES_REQUIRED RESOLVED / AWAITING SUPERVISOR ACCEPTANCE` — not
  self-accepted; `OC-C3D-ACL-001` remains `PARTIALLY_SATISFIED`,
  `OC-C3D-LOCK-001` unchanged.

## Governing specifications and contracts

- **Governing spec:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  — §R.29 core is the unchanged accepted Phase-C3 product contract (§R.30 records
  C3C-A local technical acceptance; §R.31 is governance metadata only); `§R.29.7`
  (legacy-compat DB prerequisites) applied 2026-07-20 for `PHASE-C3C-B-DB-PREREQ`.
- **Technical contract:** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` —
  §13.15 is the unchanged C3B executable contract (§13.16 records C3C-A local
  technical acceptance; §13.17 is governance metadata only); `§13.18`
  (legacy-compat receipt-adapter schema) applied 2026-07-20.
- **Sequence authority:** `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`.
- **Active-track traceability:** `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`.
- **Ledger (append-only):** `docs/ledgers/G28_LEDGER.md`.

## Active requirement IDs and dispositions

Full matrix and normative anchors: `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
(section "Requirement matrix"). Summary of active Phase-C continuation requirements:

- `OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`, `OC-C3-NOUI-001` —
  `PARTIALLY_SATISFIED` (owning phase C3C-B). The database prerequisites
  (`db/76`) are `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED`, applied
  and supervisor-accepted inert in the development database (contract §§35–39);
  the `PHASE-C3C-B` application-adapter layer that consumes them is now
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, supervisor-
  accepted 2026-07-21 at `22bfb192`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §36). Not
  `SATISFIED` — real `canonical_active` verification is C3D/real-cutover
  territory; `db/76` remains unapplied to staging.
- `OC-C3D-DEPLOY-001`, `OC-C3D-FENCE-001`, `OC-C3D-ACL-001` and
  `OC-C3D-LOCK-001` — all `SATISFIED` (accepted C3D-A/B, C3D-C, C3D-D and C3D-E
  evidence respectively; `OC-C3D-LOCK-001` advanced by the supervisor acceptance
  of `PHASE-C3D-E` at `429aa39…`, §Z). The `PHASE-C3D` material phase contract
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`) is now **closed**
  (`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, §Z).
- `OC-CUTOVER-001` — `PLANNED` (additionally hard-gated behind the mandatory
  read-only completeness disposition of the 13 unmapped `ordens_compra_fio` rows
  ids 153–165 — see Blockers and debts below); `OC-CUTOVER-PONR-001` —
  `PARTIALLY_SATISFIED` (real cutover unauthorized).
- `OC-C4-ADMIN-001` — `SATISFIED` (owning phase C4; `CLOSED / ACCEPTED /
  LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` under
  `C4-CLOSEOUT-AND-C5-CONTRACT-R1`, contract §0d; accepted checkpoint
  `289b0cca66e9c057330a882f69da3476adf90469` — was previously (superseded)
  pending supervisor acceptance + architect visual validation);
  `OC-C4-SUPPLIER-001` — `DEFERRED`; `OC-C5-EMISSION-001` — `PLANNED`
  (post-C4 emission gate).

## Blockers and debts (live)

- **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `ACTIVE PRODUCTION BLOCKER`:** the
  Documents Ingestor's Google OAuth token is expired (`invalid_grant`); no
  documents are entering the live system. Fix needs an interactive Google login
  (architect action); coupled to `CAMADA3-OAUTH-GRANT-COUPLING`.
- **`C3D-13-UNMAPPED-ROWS-COMPLETENESS-GATE` — binding `REAL_CUTOVER`
  authorization gate (supervisor decision, `PHASE-C3D` closeout):** the
  development database's `ordens_compra_fio` holds 64 rows = 51 mapped (frozen
  REFUND-A corpus) + **13 unmapped, exact ids `153`–`165`**, all
  `rascunho`/`pendente`/`nao_recebido`, `kg_recebido` NULL. Component A cannot
  project them; Component B must fail `mapeamento_compat_ausente` if invoked;
  `PHASE-C3D` created no mapping/bridge/migration/backfill/exclusion record for
  them. They are **DEFERRED to the `REAL_CUTOVER` readiness gate** and did not
  block `PHASE-C3D` closeout. Before `REAL_CUTOVER` may be authorized, a separate
  read-only completeness diagnosis must disposition **every one** of the 13 by
  exactly one of: (1) authorized mapping/backfill and re-baseline; (2) documented
  exclusion with business-owner approval; or (3) cancellation/removal through a
  separately authorized business-data action. `REAL_CUTOVER` stays **BLOCKED from
  authorization** until that disposition is recorded.
- **`HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`** — nonblocking Phase-C debt.
- **No proven production backup** (`CAMADA3 BK5-BK8`), destructive-delete guard
  not on production (`DELETE-PROD-GUARD-A`), privilege-escalation debts
  (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`, mitigated by
  the full-trust-admins-only constraint), and the remaining ranked items live in
  the `POST-LAUNCH DEBT REGISTER` in `PROJECT_STATE.md`.
- **Standing reminder:** flip the Supabase MCP back to read-only (still
  management-scoped/write-capable from `M2`/`M3`).

## Environment state

- **PRODUCTION (live since `M10`, 2026-07-18):** Supabase `gqmpsxkxynrjvidfmojk`
  ("Inttex"), served by Vercel at `inttracker-jade.vercel.app` from
  `inttexsystem/inttracker` (`main`).
- **DEVELOPMENT / legacy (formerly "staging"):** `ucrjtfswnfdlxwtmxnoo` —
  retained development database and historical record for the excluded audit
  trails/test rows per `M3`. Purchase-order phases through F3R1 were validated
  here; **`db/75` (C3C-A) and `db/76` (C3C-B DB prerequisites) are now applied
  (2026-07-20; versions `20260720234958`/`20260720235820`), installed inert —
  `legacy_active`/`flat`, both `db/76` functions returning only their inactive
  signals, zero business-data mutation** (contract §38; supervisor-**ACCEPTED**
  at §39). The `PHASE-C3C-B` JS application-adapter layer consuming these two
  functions is now implemented (see Phase status above) but remains
  unauthorized to route to `canonical_active`.
- **PROHIBITED / never accessed:** production `bhgifjrfagkzubpyqpew`.

## Push, remote, main and deployment limits

- **No push** is authorized by this handoff by default. The `M0` full-history
  push to `production` was single-use; each prior C3D order (including the
  `PHASE-C3D-C` implementation order, `test: rehearse C3D purchase-order
  fence`) separately authorized exactly one clean fast-forward push to
  `staging/dev` for that pass's own single commit — none of those
  authorizations extend to any future push. The "PHASE-C3D-E — SESSION LOCK,
  RESOURCE LOCK AND CONCURRENCY REHEARSAL" order separately authorized exactly
  one clean fast-forward push to `staging/dev` for this pass's single commit
  (`test: rehearse C3D purchase-order concurrency`) — that authorization does
  not extend to any future push. The "PHASE-C3D-F — AGGREGATE CLOSEOUT AND
  READINESS DISPOSITION" order (this documentation-only closeout) separately
  authorized exactly one clean fast-forward push to `staging/dev` for its single
  commit (`docs: close C3D purchase-order rehearsal`) — that authorization does
  not extend to any future push.
- **Remotes:** `production` = `inttexsystem/inttracker` (fetch+push, `main`
  only); `origin` = `grupoterrabranca/controle-tapetes`; `staging` =
  `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only). No
  branch other than `main` is pushed to `production`.
- **`main` is forbidden** as a working/target branch here; no push to
  `origin`/`staging` without separate express authorization.
- **`PHASE-C4` admin receipt UI is `CLOSED / ACCEPTED / LOCALLY VERIFIED /
  ARCHITECT VISUAL VALIDATION PASSED`** (`C4-CLOSEOUT-AND-C5-CONTRACT-R1`,
  contract §0d) — local-only, native RPCs, no
  migration/environment/staging/deployment/push; `OC-C4-ADMIN-001` is
  `SATISFIED`. **Still unauthorized (each a separate gate):**
  `PHASE-C5`, staging application/validation of `db/76`, activation, deployment,
  real snapshot/import, fence transition, read switch, final ACL-closure
  invocation, cutover (`OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`, additionally
  hard-gated behind the 13-row completeness disposition), branch creation,
  production access, remote mutation, and any push. `PHASE-C3D` is closed
  (`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, §Z); all four
  `OC-C3D-*` requirements are `SATISFIED`.

## Roadmap and product-model continuity (retransmit — do not shorten)

These material continuity rules survive the `PHASE-C3D` closeout and bind the
next authorizable work; do not reconstruct or shorten them into an ambiguous
summary.

- **C4/C5 roadmap.** `PHASE-C4` — **ADMIN RECEIPT UI** (`OC-C4-ADMIN-001`,
  admin receipt UI `#/ordens-compra/:id`) is `CLOSED / ACCEPTED / LOCALLY
  VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (`C4-CLOSEOUT-AND-C5-CONTRACT-R1`,
  contract §0d). `OC-C4-SUPPLIER-001` (supplier UI) is `DEFERRED`; **`PHASE-C5`** native
  emission (`OC-C5-EMISSION-001`) is a separate post-C4 gate. Each requires its
  own explicit architect order and a fresh session.
- **Real-cutover separation.** The `REAL_CUTOVER` window
  (`OC-CUTOVER-001`/`OC-CUTOVER-PONR-001`) is governed **separately** from
  `PHASE-C3D` and from C4/C5. `PHASE-C3D` rehearsed the inactive stack only and
  performed no real cutover; real snapshot/import/reconciliation, real
  `set_canonical_read`, `ordem_compra_c3c_close_final_acl` invocation, real
  activation, and any productive receipt on a shared or real environment all
  remain unauthorized. `REAL_CUTOVER` is additionally **BLOCKED from
  authorization** until the 13 unmapped `ordens_compra_fio` rows (ids 153–165)
  are dispositioned by the separate read-only completeness diagnosis
  (see Blockers and debts).
- **UI governance.** Transition modals contain **actions only**; entities reside
  on **dedicated screens**. `PHASE-C3D` added no UI (`OC-C3-NOUI-001` boundary
  preserved).
- **Purchase-order source model.** Needs originate **first**; distribution
  occurs on the **Pedido** surface; assignment selects **need, supplier, and
  quantity**; the system **atomically creates or reuses the active draft order
  by Pedido + supplier, its item, and its allocation**.

## Canonical paths — RETRANSMIT ALL OF THESE IN EVERY FUTURE HANDOFF

1. `PROJECT_STATE.md`
2. `AGENT_HANDOFF.md`
3. `CLAUDE.md`
4. `docs/governance/AGENT_INSTRUCTIONS.md`
5. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
6. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
7. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
8. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
9. `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
10. `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
11. `docs/ledgers/G28_LEDGER.md`
12. `docs/DOCUMENTATION_INDEX.md`
13. `docs/governance/DOCUMENTATION_MODEL.md`
14. `docs/governance/SUPERVISION_PROTOCOL.md`
15. `docs/architecture/CODE_HEALTH_RULES.md`
16. `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md`
17. `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` (historical handoff stack)
18. `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (historical state closeouts)
19. `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (C3C-B material
    phase contract; application adaptation `CLOSED /
    ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` at §36 — not active)
20. `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
    (C3C-B database prerequisites contract; `PHASE-C3C-B-DB-PREREQ` closed /
    technically accepted / local DB verified / not applied to staging
    database — §§35–37; `db/76` exists, DB-backed tests pass against an
    isolated disposable local cluster; not active)
21. `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (C3D material phase
    contract — inactive deployment & rehearsal; **closed**: `CLOSED /
    ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED` (§Z);
    `PHASE-C3D-A`/`PHASE-C3D-B`/`PHASE-C3D-C`/`PHASE-C3D-D`/`PHASE-C3D-E` all
    `CLOSED / TECHNICALLY ACCEPTED / LOCALLY VERIFIED` (§R/§U/§X/§Z, checkpoints
    `096cd60`/`5441321`/`6fd63a5`/`5a2be05`/`429aa39`); `PHASE-C3D-F` `CLOSED /
    ACCEPTED / DOCUMENTATION-ONLY` (§Z); all four `OC-C3D-*` `SATISFIED`; not
    active — `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`)
22. `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (C4 material phase
    contract — admin receipt UI at `#/ordens-compra/:id`; **closed**: `CLOSED /
    ACCEPTED / LOCALLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (§0d);
    `OC-C4-ADMIN-001` `SATISFIED`; accepted checkpoint `289b0cca66e9c057330a882f69da3476adf90469`;
    not active — `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`)

> Bootstrap first through `docs/governance/AGENT_INSTRUCTIONS.md` and the
> `SPEC_CUSTODY_BOOTSTRAP` block in `PROJECT_STATE.md`. Private conversation,
> memory, and tool caches do not establish state or authorization.
