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
  `3405fdab8e05ec0f81cbfe07c63c489e551fee92` (the accepted `PHASE-C5` technical
  checkpoint — the targeted-correction commit accepted at the `PHASE-C5`
  closeout; consult Git for live `HEAD`).
- **Current Git residue:** modified `.gitignore` plus untracked
  `.codex/config.toml` and `.mcp.json` (pre-existing, preserved, unstaged).
  Their contents must not be inspected or touched.

## Phase status

- **`GOVERNANCE-EFFICIENCY-REFOUNDATION` (current — Unit 4A readiness):**
  `ACTIVE / UNIT 4A CUTOVER READINESS IMPLEMENTED / AWAITING DIRECT SUPERVISOR
  REVIEW`. The structured current-state candidate, equivalence evidence,
  candidate views, bounded-ledger reader, readiness manifest, and bootstrap
  simulator are implemented, but remain `NON-CANONICAL UNTIL SUPERVISOR
  ACTIVATION`. `PROJECT_STATE.md` remains the
  current-state owner and this file remains the derived operational handoff.
  Status: `SHADOW IMPLEMENTATION AUTHORIZED / DOCUMENTARY-AUTHORITY CUTOVER NOT AUTHORIZED`.
  Unit 1 is `CLOSED / ACCEPTED / DIRECTLY VERIFIED` at
  `39abf42a7341b61fd4ac02a8e38d1e4f33471f0f` by external supervisor ruling.
  Unit 2 is `CLOSED / ACCEPTED / DIRECTLY VERIFIED` under the external supervisor
  ruling supplied for checkpoint `f7106977f4613de1830bef46002dbf0a4b8b3cbe`; this
  records supervisor acceptance and is not executor self-acceptance. Unit 3 is
  `CLOSED / ACCEPTED / DIRECTLY VERIFIED` under the external supervisor ruling
  supplied for checkpoint `53899e30b72cde3d1f5759ea59fb0a4d632c974d`; this
  records supervisor acceptance and is not executor self-acceptance. Its
  partitions, generated compatibility view, and indexes remain non-canonical.
  The accepted interval begins at
  `e3c8c15b368d20161df6e593debbdf0c68cb7e41` and ends at the final R3 commit
  `53899e30b72cde3d1f5759ea59fb0a4d632c974d`. The Unit 4 contract at checkpoint
  `76f52c842678b74e655ef9080f4fc67ccbd38e22` is `CLOSED / ACCEPTED / DIRECTLY
  VERIFIED` by external supervisor ruling, not executor self-acceptance. The accepted contract is at
  `docs/governance/GOVERNANCE_EFFICIENCY_REFOUNDATION_UNIT_4_AUTHORITY_CUTOVER_CONTRACT.md`.
  It binds the required parent and deterministic activation content before
  commit creation, treats the actual activation SHA as external Git evidence,
  confines Unit 4A candidate renders to
  `docs/governance/candidate/generated/`, and reserves atomic root replacement
  for Unit 4C.
  Unit 4A is `IMPLEMENTED / CUTOVER READINESS EVIDENCE COMPLETE / AWAITING
  DIRECT SUPERVISOR REVIEW` and is not self-accepted.
  **Next authorizable action:** direct supervisor review of
  `GOVERNANCE-EFFICIENCY-REFOUNDATION-UNIT-4A-CUTOVER-READINESS-IMPLEMENTATION-R1`.
  Unit 4B review is required. Unit 4C, documentary-authority cutover, Unit 4D,
  Unit 5, cleanup,
  compaction, archival, deprecation, deletion, product work, database access,
  and deployment remain unauthorized. Exact accepted governance checkpoints:
  Unit 1 `39abf42a7341b61fd4ac02a8e38d1e4f33471f0f`, Unit 2
  `f7106977f4613de1830bef46002dbf0a4b8b3cbe`, and Unit 3
  `53899e30b72cde3d1f5759ea59fb0a4d632c974d`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-EXECUTION-ACCEPTANCE-CLOSEOUT-R1` (current —
  direct supervisor acceptance of the executed shared-development clean-slate
  reset; documentation-only closeout):** the supervisor **ACCEPTED** executed
  reset checkpoint `770772548baf04c52e9ef020ff94f8bdabf77f03` —
  `ACCEPTED / DIRECTLY VERIFIED`. `SHARED-DEVELOPMENT RESET = EXECUTED /
  TRANSACTIONALLY VERIFIED / ACCEPTED`. Directly verified final database state of
  `ucrjtfswnfdlxwtmxnoo`: purged 64 legacy purchase-order rows, 64 purchase
  needs, 51 native purchase orders, 16 Pedidos, 20 OPs, 25 lotes, and the exact
  synthetic B6-VERIFY fixture; all 24 purge tables and all six B6 fixture tables
  are zero; preserved unchanged — master/reference records, `saldo_fios` (exact
  five rows/quantities), `saldo_fios_op` (0), `op_numeros` (latex/2026/18,
  tecelagem/2026/41), the documents front excluding B6 (39/1/24/30), the
  `legacy_active`/`flat`/`not_started` cutover with all markers NULL, migration
  history, sequence high-water states, all user triggers enabled, all C3C
  protected mutation guards enabled. The archive `20260722T183846Z` (aggregate
  SHA-256 `5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc`) and
  the execution evidence `…/clean-slate-reset/execution/20260722T202717Z/` remain
  authoritative and unchanged outside the repository. **`CLEAN-SLATE-TRANSACTIONAL-RESET`
  phase: `CLOSED / ACCEPTED / DIRECTLY VERIFIED`.** `ACTIVE_PHASE`/
  `ACTIVE_PHASE_CONTRACT` become `NONE`/`NONE`; `LAST_ACCEPTED_PHASE` stays
  `PHASE-C5`; the product `ACCEPTED_CHECKPOINT` stays
  `3405fdab8e05ec0f81cbfe07c63c489e551fee92` (never repurposed) —
  `ACCEPTED_CLEAN_SLATE_RESET_EXECUTION_CHECKPOINT =
  770772548baf04c52e9ef020ff94f8bdabf77f03` is recorded separately. **Next
  authorizable action:** `GOVERNANCE-EFFICIENCY-REFOUNDATION-DIAGNOSIS-R1` —
  `READ-ONLY DOCUMENT INVENTORY AND REFOUNDATION DIAGNOSIS AUTHORIZED /
  IMPLEMENTATION NOT YET AUTHORIZED`: a read-only inventory and classification
  of all current governance documents — line counts and file sizes, current
  authority and ownership, unique information held by each document,
  duplicated facts and duplicated narratives, documents required during normal
  bootstrap vs. only for historical audit, manual versus generated documents,
  consumers and inbound references, ledger partitioning and rollover options,
  archive and compaction candidates, safe deprecation candidates, documents
  that must remain normative, documents that may become generated views,
  information-loss risks, and link/reference migration requirements — the
  diagnosis must not delete, archive, split, compact, or generate replacement
  files. The prior `REAL-BUSINESS-FLOW-RECREATION-DIAGNOSIS-R1` framing of the
  next action is **SUPERSEDED**; real business-flow recreation stays a
  separate, still-unauthorized track, not the live next action. The previously
  emitted but unexecuted order
  `CLEAN-SLATE-CLOSEOUT-AND-GOVERNANCE-EFFICIENCY-REFOUNDATION-SHADOW-R1` is
  **SUPERSEDED** and must not be executed.
  `REAL_CUTOVER`, `PHASE-C5B-ACCEPTANCE-DECISION`, real business-flow
  recreation, production access, the forbidden project,
  deployment/activation, governance-efficiency refoundation implementation,
  and document cleanup/compaction remain unauthorized; no phase chains
  automatically. This pass performed **no database access**. Documentation-only: seven
  authorized canonical documents only; protected residue untouched. Full
  record: contract §26, `PROJECT_STATE.md`, and `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1` (prior —
  governed destructive execution of the accepted clean-slate reset):**
  `SHARED-DEVELOPMENT RESET = EXECUTED / TRANSACTIONALLY VERIFIED / AWAITING
  DIRECT SUPERVISOR REVIEW`. One serialized `SERIALIZABLE` DELETE transaction
  against the authorized non-production shared-development project
  `ucrjtfswnfdlxwtmxnoo` (canonical authorization checkpoint
  `9706ec75c10bf811abf67e4cfcabb19aa64cbeeb`; accepted readiness checkpoint
  `62bdcc75c335e3881adb1af6350de801675aa788`; authoritative archive
  `20260722T183846Z`, aggregate SHA-256 `5221cd47…`, `verify-archive` 395/395)
  purged 64 legacy orders + 64 needs + 51 native purchase orders + 16 Pedidos +
  20 OPs + 25 lotes + the exact synthetic B6-VERIFY fixture (affected-row
  sequences `0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` /
  `27,16,4,18,0,0,0,0,0,0,20,16,25`) and re-enabled the four temporarily-disabled
  guards before COMMIT. Post-state proven (read-only, repeatable-read): zero-state
  exact; master/reference data, `saldo_fios`, `saldo_fios_op` empty state,
  `op_numeros`, the documents front excluding B6, the `legacy_active` cutover,
  migration history, all 35 sequences (state hash `c210b65d…`), and all 35 user
  triggers (state hash `7060ba455…`; the four guards re-enabled with
  byte-identical definitions) unchanged. External SQL + all pre/post evidence are
  stored **outside the repository** at
  `…/clean-slate-reset/execution/20260722T202717Z/`. Documentation-only commit; no
  technical/product/test/script/migration change; the archive is unchanged. The
  reset is **not self-accepted**; the phase is **not CLOSED**; `LAST_ACCEPTED_PHASE`
  stays `PHASE-C5`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay
  `CLEAN-SLATE-TRANSACTIONAL-RESET` / the contract; the accepted product checkpoint
  stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92`; `REAL_CUTOVER`,
  `PHASE-C5B-ACCEPTANCE-DECISION`, and real business-flow recreation remain
  unauthorized; no phase chains automatically. Full record: contract §25,
  `PROJECT_STATE.md`, and `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-READINESS-ACCEPTANCE-CLOSEOUT-R1`
  (prior — direct supervisor acceptance of the validation-gate-closed
  clean-slate reset readiness; documentation-only):** the architect performed the
  direct supervisor review and **ACCEPTED** checkpoint
  `62bdcc75c335e3881adb1af6350de801675aa788` — the clean-slate contract, the reset
  tooling, the retained authoritative archive `20260722T183846Z` (aggregate SHA-256
  `5221cd47…`; `verify-archive` 395/395), the disposable restore/reset drill
  (96/96), the closed validation gates (`--self-test` 54/54; fixture suite 61/61),
  and the ratified §21.4 trigger-handling mechanism are all `ACCEPTED / DIRECTLY
  VERIFIED`. `f165302c1c542aa26e9ae78464d260c81eda6415` remains **NOT ACCEPTED**,
  its retained corrections incorporated into and superseded by `62bdcc75…`. The
  `SHARED-DEVELOPMENT RESET` is now `AUTHORIZED AS THE NEXT SEPARATE GOVERNED
  DESTRUCTIVE ORDER` (`CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1`) /
  **NOT EXECUTED**. `ACCEPTED_CLEAN_SLATE_READINESS_CHECKPOINT = 62bdcc75…` (the
  bootstrap product `ACCEPTED_CHECKPOINT` stays `3405fdab…`);
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay `CLEAN-SLATE-TRANSACTIONAL-RESET` /
  the contract; the phase is **not CLOSED**; `REAL_CUTOVER`,
  `PHASE-C5B-ACCEPTANCE-DECISION`, and real business-flow recreation remain
  unauthorized; no phase chains automatically. No database access or reset
  execution occurred (documentation-only). Full record: contract §24 and
  `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-FINAL-VALIDATION-GATES-CORRECTION-R1`
  (prior pass — direct supervisor review of `f165302c`; localized forward
  correction + existing-archive revalidation):**
  `f165302c1c542aa26e9ae78464d260c81eda6415` checkpoint is **NOT ACCEPTED** — the
  mandatory `node scripts/validate-spec-custody.mjs --self-test` failed there
  (uncaught crash, exit 1, zero PASS lines). The §22 archive-safety technical
  patch was reviewed and is **RETAINED**. Fixed **root cause A**
  (`scripts/spec-custody/self-tests.mjs`'s `createFixture()` never copied
  `ACTIVE_PHASE_CONTRACT` into its synthetic fixture, so the self-test baseline
  crashed as an uncaught R2 exception once this contract became the active
  phase) generically — reads the source bootstrap, copies/tracks whichever
  contract is currently active, never hardcoding a phase or path — plus 7 new
  test cases; `--self-test` now exits **0** with **54/54 PASS**. Fixed **root
  cause B** (`verifyPreservedBaseline`'s `op_numeros` check was a loose
  `tipo->value` map ignoring the year, silently collapsing duplicates, never
  checking row count) to an exact canonical two-row identity set (`latex`/2026/
  18, `tecelagem`/2026/41) rejecting missing/extra/duplicate/wrong-tipo/wrong-
  year/wrong-value/`NULL` rows, with 6 new archive-tooling tests; fixture suite
  **61/61**. The existing authoritative archive `20260722T183846Z` was
  **retained and revalidated, NOT regenerated** — aggregate SHA-256
  `5221cd47…` unchanged before/after; corrected `verify-archive` **395/395**;
  the full disposable restore/reset drill re-passed against this same archive
  (**96/96**); reset/restore SQL byte-identical throughout; the ratified §21.4
  trigger-handling mechanism unchanged. **No shared-development access of any
  kind occurred.** `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay
  `CLEAN-SLATE-TRANSACTIONAL-RESET` / the contract; the phase is **not
  CLOSED**; shared-development reset/`REAL_CUTOVER`/
  `PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized. Full record: contract
  §23 and `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-ARCHIVE-SAFETY-CORRECTION-R1` (prior pass —
  direct supervisor review of `6d1c647`; localized safety patch + read-only
  archive regeneration + full disposable revalidation):** **RATIFIED** the exact
  emitted-order trigger-handling mechanism as an accepted architectural mechanism
  (contract §21.4) — reset/restore SQL stay byte-identical, unchanged. Found and
  fixed 4 blocking archive-tooling safety gaps in
  `scripts/reset/clean-slate-transactional-{export,verify}.mjs` (contract §22.1):
  (A) the pre-write gate now covers the complete preserved baseline via one
  shared `verifyPreservedBaseline()`, completing entirely before any `mkdir`;
  (B) the repository-boundary guard is now file-location-derived
  (`import.meta.url`), never `process.cwd()`; (C) `verifyArchive` now
  recursively enumerates the whole archive and strictly parses
  `checksums.sha256`, rejecting unexpected content and malformed/duplicate/
  extra/missing entries; (D) `capture.identity.project_ref` is now cross-checked
  against the real `--target` (previously tautological). Added 16 tests (fixture
  suite 49/49, zero regressions). Regenerated the **replacement authoritative
  archive**, read-only, at
  `D:/Programação/controle-tapetes-g28-artifacts/clean-slate-reset/20260722T183846Z`
  (aggregate SHA-256 `5221cd47…`, `verify-archive` 395/395); all 30
  `tables/*.ndjson` hashes are **identical** to the prior (superseded, retained)
  archive `20260722T173607Z` — no corpus drift. Full disposable drill re-passed
  against the replacement archive (84/84); shared-development database
  re-confirmed **unmutated**. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay
  `CLEAN-SLATE-TRANSACTIONAL-RESET` / the contract; the phase is **not CLOSED**;
  shared-development reset/`REAL_CUTOVER`/`PHASE-C5B-ACCEPTANCE-DECISION` remain
  unauthorized. Full record: contract §22 and `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2` (tooling +
  read-only real archive + disposable restore/reset drill):** accepted the
  corrected clean-slate contract and implemented its five-file tooling
  (`scripts/reset/clean-slate-transactional-{export,verify}.mjs` +
  `clean-slate-transactional-{reset,restore}.sql` +
  `tests/clean-slate-transactional-reset.smoke.mjs`); generated a real
  deterministic archive **READ-ONLY** from `ucrjtfswnfdlxwtmxnoo` (one
  `REPEATABLE READ READ ONLY` transaction, rolled back — zero mutation) stored
  **outside the repository** at
  `D:/Programação/controle-tapetes-g28-artifacts/clean-slate-reset/20260722T173607Z`
  (aggregate SHA-256 `337d23cd…`, `verify-archive` 330/330, B6
  `document_link_revision_ops = 10` across OPs 55/57/61/63, 16/20/25 identities);
  and passed the disposable restore/reset drill on a fresh PostgreSQL 18.4 cluster
  (preamble + `db/01..77`, terminal `20260722055832`, restore→reset→restore→reset,
  cluster destroyed with proof; smoke + drill 56/56). The shared-development
  database was **not mutated** and its reset was **not executed or authorized**.
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `CLEAN-SLATE-TRANSACTIONAL-RESET` /
  `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`;
  `ACCEPTED_CHECKPOINT` stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92`. **Next
  authorizable action: DIRECT SUPERVISOR REVIEW of the tooling, real archive, and
  disposable restore-drill evidence.** The phase is not CLOSED; the
  shared-development reset, `REAL_CUTOVER`, and `PHASE-C5B-ACCEPTANCE-DECISION`
  remain unauthorized. Full record: contract §21 and `docs/ledgers/G28_LEDGER.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-B6-ROW-BASELINE-FORWARD-CORRECTION-R1`
  (documentation-only forward correction, this pass):** corrected the accepted
  clean-slate reset contract's B6 synthetic-fixture baseline —
  `document_link_revision_ops` was recorded as **4** rows; the proven database
  state (read-only, `ucrjtfswnfdlxwtmxnoo`) is **10** rows across the fixture's 6
  op-bearing revisions, spanning **4 distinct linked OPs** (`55, 57, 61, 63`). The
  prior value confused the distinct-OP count with the relation-row count. Corrected
  fixture deletion sequence: `document_technical_evidences 0, document_decisions 0,
  document_link_revision_ops 10, document_link_revisions 8, document_events 0,
  document_candidates 1` (was `0, 0, 4, 8, 0, 1`). No archive generated, no reset
  tooling implemented, no disposable drill executed, no shared-development
  mutation; the tooling-and-drill implementation remains `NOT IMPLEMENTED`. The
  prior `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R1` order is
  `HARD-STOPPED / SUPERSEDED AS WRITTEN` at this corpus gate. `LAST_ACCEPTED_PHASE`
  stays `PHASE-C5`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay `NONE`. **Next
  authorizable action: reissue `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL`
  against the corrected 10-row baseline.**
- **Last accepted phase (current):** `PHASE-C5` (native purchase-order emission
  UI at `#/ordens-compra/:id`) — `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (supervisor acceptance
  + closeout `C5-DOCUMENTATION-CLOSEOUT-R1`, 2026-07-22, contract §25). Accepted
  `PHASE-C5` technical checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`;
  `OC-C5-EMISSION-001` is `SATISFIED`. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
  are `NONE`. The blocking defect `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`
  is resolved (`PHASE-C5 FUNCTIONAL GATE = PASS`; `PHASE-C5 VISUAL REVIEW =
  PASS_WITH_NONBLOCKING_COSMETIC_DEBT`). `PHASE-C5B-ACCEPTANCE-DECISION`
  (`IDENTIFIED / NOT AUTHORIZED`) and `REAL_CUTOVER` (`NOT AUTHORIZED`) remain
  **separate, unauthorized** gates; no phase chains automatically. The
  per-pass bullets further below (governance status, C3C-B/C3D/C4/C5A/C5
  narratives) are **historical, point-in-time records** — the same history is
  preserved in `docs/ledgers/G28_LEDGER.md`; live current state is owned solely
  by `PROJECT_STATE.md`.
- **`CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1` (this pass, read-only diagnosis
  + documentation-only proposed-contract authoring):** the business owner ruled
  **`CLEAN_SLATE_OPERATIONAL_REBUILD` = APPROVED AS TARGET STRATEGY** — the current
  operational transaction corpus in the shared-development database need not survive
  as live business data; the ~2 real flows (Pedido → purchasing needs → purchase
  orders → OPs → operational updates) will be recreated through the new application.
  Authored `docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md`
  (`PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET`, `STATUS: PROPOSED / AWAITING
  SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED`) from a read-only
  diagnosis of `ucrjtfswnfdlxwtmxnoo` (PostgreSQL 17.6, terminal migration
  `20260722055832`, entry checkpoint `56f749812c693cea3c81518a139d174e958fbbbf`):
  the binding ruling, the full FK/dependency inventory, the exact row-count baseline
  (`ordens_compra_fio` 64 = 51 mapped + 13 unmapped ids 153–165; native layers 51
  each; ledgers/receipts/events/movements 0; cutover `legacy_active`/`flat`/
  `not_started`, all markers NULL), the per-table classification, the exact
  dependency-safe deletion order (Boundary A = 332-row yarn-purchasing corpus;
  Boundary B = `pedidos`/`ops`/`lotes` only if separately authorized), the mandatory
  out-of-repo archival plan, the destructive design (single transaction, `DELETE`
  not `TRUNCATE`, run only under `legacy_active`, no sequence reset by default), the
  recommended **Option C** cutover strategy (remain `legacy_active`; `db/75`'s
  51/39/44/20221.280/405.980 constants superseded, future `REAL_CUTOVER` needs a
  re-baselined migration), and the mutation mechanism (**one-time governed
  administrative operation, not a `db/NN` migration, not the dashboard**). Master/
  reference data is preserved by default. The prior legacy-data mapping strategy is
  **superseded as the target**, not deleted. The former 13-row `REAL_CUTOVER`
  completeness gate is `STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES` then
  `SUPERSEDED_BY_CLEAN_SLATE_RESET`. `PHASE-C5B` is corpus-independent (sequence
  after the reset + real-flow recreation). **Binding entanglement:** Boundary B
  deletion of `pedidos`/`ops` collides with the Controlled-Delete × document-history
  rule (1 Pedido + 4 OPs) and the separate documents front — `UNPROVEN`, needing an
  explicit business-owner disposition. **No deletion, database mutation, migration,
  cutover, activation, or environment change occurred; the 64/51/13 corpus physically
  exists; `REAL_CUTOVER` and `PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized;
  execution requires a separate explicit order.** Documentation-only, seven authorized
  owners; `LAST_ACCEPTED_PHASE` stays `PHASE-C5`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
  stay `NONE`; one commit + one authorized `staging/dev` fast-forward push. **Next
  authorizable action: direct supervisor review of the proposed
  `CLEAN-SLATE-TRANSACTIONAL-RESET` contract** — no deletion, reset execution, phase
  activation, or continuation is authorized.
- **`CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1` (read-only
  continuation diagnosis; no doc mutation, no commit, no push) + `CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1`
  (documentation-only correction, commit `docs: correct clean-slate reset
  contract`):** the residual-boundary diagnosis proved (read-only against
  `ucrjtfswnfdlxwtmxnoo`) that the only transaction-linked document is the **synthetic
  `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT`** fixture (Pedido #34
  `7fa51e02`, OPs 55/57/61/63, lotes 33/37; 8 link revisions + 10 revision-ops
  across 4 distinct linked OPs 55/57/61/63 + 1 candidate; no Drive object/SHA/fiscal
  metadata; 0 operational descendants), while
  the other 39 of 40 ingestor `document_candidates` are an unrelated front to
  preserve; the Controlled-Delete rule is RESTRICT-FK + `db/53` app guard with no
  immutability trigger. The correction then set the reset contract to `CORRECTED /
  AWAITING DIRECT SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED` with
  every decision now **binding**: purge all 16 Pedidos + 20 OPs + 25 lotes (incl.
  orphan lotes 3–8,13) + `op_fornecedores` + the full yarn-purchasing corpus; remove
  **only** the exact B6 synthetic fixture (Option D3) and preserve the rest of the
  documents front; preserve `saldo_fios` (physical inventory) and `op_numeros`
  (no restart); preserve master data; cutover Option C (stay `legacy_active`); a
  **mandatory archive + restore runbook + disposable restore drill** HARD STOP before
  any execution; and a one-time governed administrative DELETE transaction (not a
  `db/NN` migration, not the dashboard, not an RPC/UI writer). Added the exact
  Boundary-A/document-fixture/Boundary-B deletion orders + affected-row counts, the
  exact 16 Pedido / 20 OP / 25 lote ids, and a proposed (not created) implementation
  manifest (`scripts/reset/*` + `tests/clean-slate-transactional-reset.smoke.mjs`).
  **No deletion, database mutation, archive, reset implementation, migration,
  cutover, activation, or environment change occurred**; `OC-CUTOVER-001` stays
  `PLANNED`; the 13-row gate stays `STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`;
  `REAL_CUTOVER` and `PHASE-C5B` remain unauthorized; `LAST_ACCEPTED_PHASE` stays
  `PHASE-C5`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` stay `NONE`. Documentation-only,
  seven authorized owners; one commit + one authorized `staging/dev` fast-forward
  push. **Next authorizable action: direct supervisor review of the corrected
  `CLEAN-SLATE-TRANSACTIONAL-RESET` contract.**
- **Prior accepted product phase:** `PHASE-C3C-B` (application compatibility/
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
- **Prior accepted material phase (historical detail):** `PHASE-C4` (admin
  receipt UI at
  `#/ordens-compra/:id`) — supervisor-accepted and architect-visual-validated
  2026-07-21 under `C4-CLOSEOUT-AND-C5-CONTRACT-R1` (contract §0d; disposition
  restated per the direct-review ruling of
  `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1`, 2026-07-22, to `CLOSED
  / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL
  VALIDATION PASSED`).
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
  criterion. `PHASE-C4` is now closed; `PHASE-C5` is now closed and accepted
  (`OC-C5-EMISSION-001` `SATISFIED` — see the current lead at the top of this
  section); `PHASE-C5B-ACCEPTANCE-DECISION` and `REAL_CUTOVER` remain separate,
  unauthorized gates.
- **Active phase contract:** `NONE`. The `PHASE-C5` material contract
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C5`)
  is now **closed** — `STATUS: CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (§25, supervisor
  acceptance + closeout `C5-DOCUMENTATION-CLOSEOUT-R1`, 2026-07-22; accepted
  technical checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`;
  `OC-C5-EMISSION-001` `SATISFIED`). The other material phase contracts are
  likewise closed and **not active**:
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (`STATUS: CLOSED / ACCEPTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT
  VERIFIED`, §25; disposition restated `CLOSED / ACCEPTED / DIRECTLY VERIFIED /
  SHARED-DEVELOPMENT STATE VERIFIED` at the C5 direct review);
  `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C4`,
  §0d — disposition restated `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`); and
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (`PHASE_ID: PHASE-C3D`,
  §Z aggregate closeout).
- **Active track:** `PURCHASE_ORDER_PHASE_C`. **Active phase `NONE`; active
  phase contract `NONE`.** `PHASE-C5` (native purchase-order emission UI) is
  **closed and accepted** — supervisor acceptance + closeout
  `C5-DOCUMENTATION-CLOSEOUT-R1` (2026-07-22, contract §25) of the targeted
  correction commit `3405fdab8e05ec0f81cbfe07c63c489e551fee92`; the blocking
  defect `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION` is resolved
  (`PHASE-C5 FUNCTIONAL GATE = PASS`, `PHASE-C5 VISUAL REVIEW =
  PASS_WITH_NONBLOCKING_COSMETIC_DEBT`), `OC-C5-EMISSION-001` is `SATISFIED`.
  The predecessor contracts are likewise closed: `PHASE-C5A-DB-EMISSION-READINESS`
  = `CLOSED / ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED`
  (contract §25, `C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1`, 2026-07-22; `db/77`
  applied byte-identical + §14-validated on the shared development database
  `ucrjtfswnfdlxwtmxnoo`, PostgreSQL 17.6, terminal migration `20260722055832`);
  `PHASE-C4` = `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED /
  ARCHITECT VISUAL VALIDATION PASSED` (`OC-C4-ADMIN-001` `SATISFIED`). The next
  authorizable action is a **supervisor read-only sequencing decision** between
  the two remaining separately governed continuations —
  `PHASE-C5B-ACCEPTANCE-DECISION` (`IDENTIFIED / NOT AUTHORIZED`) and the
  `REAL_CUTOVER` completeness disposition for the 13 unmapped
  `ordens_compra_fio` rows ids 153–165 — not automatic execution; no phase
  chains automatically. `PHASE-C5B-ACCEPTANCE-DECISION`, any shared-database
  apply beyond `db/77`, staging application of `db/76`/`db/77`, deployment,
  activation, `REAL_CUTOVER`, production access, and push remain unauthorized.
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
- **`C4-CLOSEOUT-AND-C5-CONTRACT-R1` — PHASE-C5 material contract authored
  (this pass):** authored `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C5`, `STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW /
  IMPLEMENTATION NOT AUTHORIZED`). Database-prerequisite classification:
  `BLOCKING_DATABASE_PREREQUISITE` — `emitir_ordem_compra` and
  `alocar_necessidade_compra_fio` are both terminally `REVOKE ALL` from
  every role (`db/74`'s "exact final execution ACL matrix", reaffirmed
  absent through `db/76`); no migration is bundled. A separate,
  pre-existing gap was found: no RPC anywhere transitions `status_aceite`
  from `pendente` to `aceita`/`rejeitada`, so any `exige_aceite=TRUE` order
  becomes permanently unreceivable once emitted — recorded as an open
  supervisor decision, not dispositioned here. Purely-additive three-file
  manifest proposed (`ordem-compra-data.js`/`-render.js`/`-events.js`, no
  new product file), wiring the already-existing disabled `oc-emitir`
  button. Four supervisor decisions recorded as required (contract §18).
  `OC-C5-EMISSION-001` remains `PLANNED`.
- **`C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1` — supervisor acceptance of the
  `PHASE-C5` material contract (this pass):** the supervisor **ACCEPTED**
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (`STATUS: ACCEPTED /
  IMPLEMENTATION BLOCKED BY DATABASE PREREQUISITE`, contract §21) —
  acceptance does **not** authorize implementation. Ratified: the
  `BLOCKING_DATABASE_PREREQUISITE` classification, assigned to a new,
  separately authorized **`PHASE-C5A-DB-EMISSION-READINESS`** (not authored
  by this closeout); the missing acceptance-decision RPC gap as
  **`PHASE-C5B-ACCEPTANCE-DECISION`** (`IDENTIFIED / NOT AUTHORIZED` — owns
  accept/reject RPCs, actor ownership, state-transition rules, audit,
  UI, supplier-vs-admin split; `PHASE-C5A` must not implement acceptance
  decisions; `exige_aceite=TRUE` orders are not lifecycle-complete until
  `PHASE-C5B` ships); emission confirmation UX as
  **`CONTROLLED_IRREVERSIBLE_TRANSITION`** (explicit confirmation, no
  single-click, primary/neutral not destructive-red styling, authoritative
  reload). `OC-C5-EMISSION-001` becomes
  `PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`.
- **`C5A-DB-EMISSION-READINESS-CONTRACT-R1` (this pass, read-only database
  reconciliation + documentation-only phase-contract authoring):** authored
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C5A-DB-EMISSION-READINESS`, `STATUS: PROPOSED / AWAITING
  SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED`). Overall classification
  `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`: one future migration grants
  `EXECUTE ON emitir_ordem_compra(BIGINT)` to `authenticated` (terminally
  `REVOKE ALL`, no grant anywhere, `db/74:1192-1193`) and corrects the terminal
  read models `obter_ordem_compra_admin` (`db/69:987`) / `listar_ordens_compra_admin`
  (`db/69:913`) — which hard-code `pode_emitir=false`/`acoes.emitir=false` — so
  they derive true for a fully-distributed native rascunho with
  `exige_aceite=FALSE`. The allocation path is `ALLOCATION_PATH_READY_AFTER_GRANT`
  via the already-granted, wired `definir_alocacao_necessidade_compra_fio`
  (`db/74:330`/`:1177`; `pedido-insumos-distribuicao.js:135`); the older
  `alocar_necessidade_compra_fio` is `SUPERSEDED`. Actor:
  `emitir_ordem_compra = AUTHENTICATED_ADMIN_ONLY`. Acceptance disposition
  `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE` (config structurally frozen
  FALSE; no `pendente→aceita/rejeitada` RPC — `PHASE-C5B`). No product, test,
  script, migration, database, environment, or protected-residue change; no
  database access. `OC-C5-EMISSION-001` stays
  `PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
  remain `NONE`.
- **`C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1` (Part 1) — supervisor
  acceptance + local implementation authorization (this pass, docs-only
  acceptance commit):** the supervisor **ACCEPTED**
  `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
  (`STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT
  AUTHORIZED` → `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY`,
  contract §22) and authorized **local** `PHASE-C5A` implementation, entry
  checkpoint `HEAD` `a476df3191b914d62acd6718c06771cd1753ac6b`. Ratified §19
  decisions: classification `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE`
  (grant `emitir_ordem_compra(BIGINT)` to `authenticated` keeping the internal
  `is_admin()` gate, correct the two terminal read models, no writer-body
  change, no allocation migration); `definir_alocacao_necessidade_compra_fio`
  is the active canonical allocation writer and
  `alocar_necessidade_compra_fio` is `SUPERSEDED / REVOKED` (stays ungranted);
  `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`; the C3C protected-mutation
  guard is not modified (C5A local readiness ≠ `REAL_CUTOVER` readiness).
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` become `PHASE-C5A-DB-EMISSION-READINESS`
  / the contract file. Docs-only: only the contract, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and
  `docs/ledgers/G28_LEDGER.md` change; no product/test/script/migration/
  configuration/database/environment/protected-residue change; no push.
  `PHASE-C5A IMPLEMENTATION = NOT YET IMPLEMENTED`.
- **`C5A-DB-EMISSION-READINESS-IMPLEMENTATION-R1` (Part 2) — PHASE-C5A local DB
  implementation (this pass):** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`. `db/77_ordem_compra_c5a_emission_readiness.sql` grants
  `EXECUTE` on `emitir_ordem_compra(BIGINT)` to `authenticated` (writer body
  unchanged, `is_admin()` gate authoritative) and `CREATE OR REPLACE`s the two
  terminal read models so `pode_emitir`/`acoes.emitir`/`bloqueio_emissao` derive
  from `_distribuicao_completa_ordem` + `exige_aceite=FALSE`;
  `definir_alocacao_necessidade_compra_fio` stays granted,
  `alocar_necessidade_compra_fio` stays revoked, the cutover guard untouched.
  `tests/ordem-compra-c5a-emission-readiness.integration.sql` proves the 35 order
  points on a disposable local PostgreSQL 18.4 cluster (`db/01…db/77` + 64-row
  corpus, `64/51/51/51/51`; `db/77` clean apply + idempotent reapply). A forced,
  non-weakening migration-manifest fixture update to
  `tests/ordem-compra-c3d-deploy.smoke.js` (terminal 76→77) was required by the
  new migration — one file beyond the literal Part 2 manifest, flagged for
  supervisor review. No shared/remote host, no staging/production, no
  `REAL_CUTOVER`, no push. `OC-C5-EMISSION-001` stays `PLANNED /
  BLOCKED_BY_C5A_DB_PREREQUISITE`; not self-accepted / not closed.
- **(Historical, at the `PHASE-C5A` Part 2 point-in-time — superseded by the
  "Active track" section above and by the "Push, remote, main and deployment
  limits" section below, which are current.)** Next authorizable action at
  that point: supervisor review/closeout of the then
  `SHARED-DEVELOPMENT VERIFIED` `PHASE-C5A` implementation (contract §23/§24 —
  `db/77` applied + §14-validated on `ucrjtfswnfdlxwtmxnoo`, incl. the forced C3D
  deploy-manifest fixture update). `PHASE-C5A` was subsequently closed and
  `PHASE-C5` was subsequently implemented, functionally/visually reviewed, and
  targeted-corrected (see above); `PHASE-C5B-ACCEPTANCE-DECISION`, staging
  validation/application of `db/76`/`db/77`, activation, deployment,
  `REAL_CUTOVER`, branch creation, production access, and any push remain
  unauthorized.
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
  `OC-C4-SUPPLIER-001` — `DEFERRED`; `OC-C5-EMISSION-001` — `SATISFIED`
  (owning phase C5; `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED
  / ARCHITECT VISUAL VALIDATION PASSED` under `C5-DOCUMENTATION-CLOSEOUT-R1`,
  `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` §25; accepted technical
  checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`).

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
- **`PHASE-C4` admin receipt UI is `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
  DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`** (`C4-CLOSEOUT-AND-C5-CONTRACT-R1`,
  contract §0d; disposition restated per the direct-review ruling of
  `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1`, 2026-07-22) —
  local-only, native RPCs, no migration/environment/staging/deployment/push;
  `OC-C4-ADMIN-001` is `SATISFIED`. A nonblocking C4 debt was additionally
  found and recorded (not corrected) by that same direct review:
  `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (POST-LAUNCH DEBT
  REGISTER item 17). **`PHASE-C5A-DB-EMISSION-READINESS` is now `CLOSED /
  ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED`**
  (`C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1`, contract §25), and `PHASE-C5` is now
  **`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT
  VISUAL VALIDATION PASSED`** (supervisor acceptance + closeout
  `C5-DOCUMENTATION-CLOSEOUT-R1`, 2026-07-22, contract §25; accepted technical
  checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`; `OC-C5-EMISSION-001`
  `SATISFIED`; `PHASE-C5 FUNCTIONAL GATE = PASS`, `PHASE-C5 VISUAL REVIEW =
  PASS_WITH_NONBLOCKING_COSMETIC_DEBT`) — local UI implementation landed under
  `C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1`, was
  functionally/visually reviewed and targeted-corrected under
  `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1` (2026-07-22), then
  accepted and closed. **Still unauthorized (each a separate gate):**
  `PHASE-C5B-ACCEPTANCE-DECISION`, any shared-database apply beyond `db/77`,
  staging application/validation of `db/76`/`db/77`, activation, deployment,
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
  admin receipt UI `#/ordens-compra/:id`) is `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT
  / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED` (`C4-CLOSEOUT-AND-C5-CONTRACT-R1`,
  contract §0d; disposition restated per the direct-review ruling of
  `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1`, 2026-07-22, which
  additionally recorded the nonblocking
  `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` debt without
  correcting it). `OC-C4-SUPPLIER-001` (supplier UI) is `DEFERRED`. The
  **`PHASE-C5A-DB-EMISSION-READINESS`** database-prerequisite contract is now
  `CLOSED / ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED`
  (contract §25, `C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1`, 2026-07-22): `db/77`
  grants `EXECUTE` on `emitir_ordem_compra(BIGINT)` to `authenticated` and
  corrects the terminal read models, applied byte-identical and §14-validated
  on the authorized shared development database `ucrjtfswnfdlxwtmxnoo`. With
  that prerequisite resolved, **`PHASE-C5`** native emission
  (`OC-C5-EMISSION-001`, `SATISFIED`) material contract is now
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT
  VISUAL VALIDATION PASSED` (`docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md`
  §25, accepted technical checkpoint
  `3405fdab8e05ec0f81cbfe07c63c489e551fee92`) and **not active** — local UI
  implementation landed under `C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1`,
  underwent direct supervisor functional/visual review (`PHASE-C5 VISUAL REVIEW =
  PASS_WITH_NONBLOCKING_COSMETIC_DEBT`; `PHASE-C5 FUNCTIONAL REVIEW =
  CHANGES_REQUIRED` on `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`),
  was targeted-corrected under
  `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1` (2026-07-22, within
  the same closed three-file manifest), then **accepted and closed** under
  `C5-DOCUMENTATION-CLOSEOUT-R1` (2026-07-22): the defect is resolved and
  `PHASE-C5 FUNCTIONAL GATE = PASS`. Full acceptance-workflow usability is
  additionally gated behind
  **`PHASE-C5B-ACCEPTANCE-DECISION`** (`IDENTIFIED / NOT AUTHORIZED`), which
  still requires its own explicit architect order and a fresh session; no
  `PHASE-C5` implementation order may build any acceptance-decision
  capability.
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
    ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL
    VALIDATION PASSED` (§0d; disposition restated per the direct-review ruling
    of `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1`, 2026-07-22);
    `OC-C4-ADMIN-001` `SATISFIED`; accepted checkpoint `289b0cca66e9c057330a882f69da3476adf90469`;
    a nonblocking debt was found by that direct review,
    `ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (recorded, not
    corrected); not active — `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` are `NONE`)
23. `docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md` (C5 material phase
    contract — purchase-order emission; **not active**, `CLOSED /
    ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL
    VALIDATION PASSED` (§25, supervisor acceptance + closeout
    `C5-DOCUMENTATION-CLOSEOUT-R1`, 2026-07-22; accepted technical checkpoint
    `3405fdab8e05ec0f81cbfe07c63c489e551fee92`); `OC-C5-EMISSION-001`
    `SATISFIED`; `PHASE-C5B-ACCEPTANCE-DECISION` (`IDENTIFIED / NOT AUTHORIZED`);
    emission confirmation UX ratified `CONTROLLED_IRREVERSIBLE_TRANSITION`;
    local UI implementation landed under
    `C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1` within the closed
    three-file manifest (§12), targeted-corrected under
    `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1` (2026-07-22, §24) on
    the blocking defect `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`
    (`PHASE-C5 FUNCTIONAL GATE = PASS`; `PHASE-C5 VISUAL REVIEW =
    PASS_WITH_NONBLOCKING_COSMETIC_DEBT`), then supervisor-accepted and closed
    (§25))
24. `docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
    (C5A material phase contract — database emission readiness; **not
    active**, `CLOSED / ACCEPTED / DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE
    VERIFIED` (§25, supervisor closeout under `C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1`,
    2026-07-22, over the §23 local implementation and the §24
    shared-development validation); classification
    `READ_MODEL_FUNCTION_AND_GRANT_PREREQUISITE` — grant `emitir_ordem_compra`
    to `authenticated` + correct the terminal read models
    `obter_ordem_compra_admin` (`db/69:987`) / `listar_ordens_compra_admin`
    (`db/69:913`); allocation `ALLOCATION_PATH_READY_AFTER_GRANT` via the
    already-granted `definir_alocacao_necessidade_compra_fio`;
    `alocar_necessidade_compra_fio` `SUPERSEDED / REVOKED`; acceptance disposition
    `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`; `db/77` applied
    byte-identical to the authorized shared development database
    `ucrjtfswnfdlxwtmxnoo` with the full §14 evidence; resolves the C5
    `BLOCKING_DATABASE_PREREQUISITE`, does not modify the accepted C5
    contract's ratified decisions)

> Bootstrap first through `docs/governance/AGENT_INSTRUCTIONS.md` and the
> `SPEC_CUSTODY_BOOTSTRAP` block in `PROJECT_STATE.md`. Private conversation,
> memory, and tool caches do not establish state or authorization.
