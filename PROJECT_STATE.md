# CANONICAL CURRENT STATE

This file is the single source of the **current** operational state: active phase,
next authorizable action, binding decisions in force, live debts, environment facts,
and an index of closed phases. It does **not** hold historical closeout narratives —
those were moved by `PROJECT-STATE-COMPACTION-A` (2026-07-16) and `-B` (2026-07-17) to
`docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`, verbatim; full per-phase closeouts
are in `docs/ledgers/G28_LEDGER.md`. HEAD/working tree/divergence: consult Git directly.

<!-- SPEC_CUSTODY_BOOTSTRAP:BEGIN -->
```text
LAST_ACCEPTED_PHASE: PHASE-C3C-A
ACTIVE_PHASE: NONE
ACTIVE_PHASE_CONTRACT: NONE
ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C
NEXT_AUTHORIZABLE_ACTION: GOVERNANCE-STATE-HANDOFF-COMPACTION-R1
GOVERNING_SPEC: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md
TECHNICAL_CONTRACT: docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md
SEQUENCE_AUTHORITY: docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
TRACEABILITY: docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md
LEDGER: docs/ledgers/G28_LEDGER.md
HANDOFF: AGENT_HANDOFF.md
ACCEPTED_CHECKPOINT: dd631299f410027ebb23b006aa5e380ad460aefa
```
<!-- SPEC_CUSTODY_BOOTSTRAP:END -->

## Active phase and next action

- **`GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1` — `IMPLEMENTED / LOCALLY
  VERIFIED / AWAITING INDEPENDENT SUPERVISOR REVIEW` (2026-07-20).** The
  repository now has one tracked shared agent-instruction source, byte-identical
  Claude Code/Codex wrappers, deterministic current-state bootstrap pointers,
  active Phase-C requirement IDs and traceability, proportional update rules,
  and a dependency-free validator. This governance-only foundation changes no
  product semantics or product acceptance. **NEXT_AUTHORIZABLE_ACTION:
  `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`.** That next action is a separately
  authorized governance phase; C3C-B remains the next product lot and remains
  unauthorized.

- **`PHASE-C3C-A-DOCUMENTARY-CLOSEOUT-R1` — `CLOSED / TECHNICALLY
  ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING`
  (2026-07-20).**
  `C3C_A_STATUS: CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING`
  `NEXT_AUTHORIZABLE_ACTION: READ-ONLY GOVERNANCE AND SPEC-CUSTODY AUDIT`
  The delegated technical supervisor accepts the local inactive C3C-A database
  implementation; this acceptance is not attributed to Kleber.
  Accepted technical chain: `d4dba671c07ec25f23e385e7786cbe90209816f3` →
  `4b7ee13fe35a830e9a3cb1cc182679c81034ce73` →
  `29913e40fa06eda009b5a2e8f058209cde90da11` →
  `89123729b3529fff6e4a2336bfec2907c4b94b4c`. Local PostgreSQL 18.4
  apply/reapply preserved `legacy_active / flat / not_started`. Accepted evidence
  covers the inactive database contract; complete 14-table `PUBLIC`-policy
  detection/closure; exact replay and stable `55000 / idempotencia_conflitante`;
  canonical source/inventory SHA-256 and live-drift rejection; 51 frozen mappings,
  39 headers, 44 scoped lines, 19,815.300 kg attributable, 405.980 kg excess,
  20,221.280 kg reconstructed, and zero import-attributable inventory movements;
  nullable Pedido-origin `op_id`, no fabricated OP, no double counting; session
  advisory-lock exclusion and deterministic eight-stage resource locking with
  release/reacquisition, zero deadlocks, and an idle final backend; and the
  pre-PONR rollback/post-PONR forward-only boundaries. Lifecycle §R.29 and schema
  §13.15 remain unchanged. This is local technical acceptance only—not staging
  validation/application, deployment, activation, cutover, or product acceptance.
  Unauthorized: C3C-B implementation, C3D, staging application/validation,
  activation, deployment, real snapshot/import, fence transition, read switch,
  final ACL-closure invocation, cutover, C4, C5, production, `main`, remotes, and
  push. **NEXT_AUTHORIZABLE_ACTION: `READ-ONLY GOVERNANCE AND SPEC-CUSTODY
  AUDIT`.** C3C-B remains the next product implementation lot but is not
  authorized; the audit precedes any C3C-B implementation order, and no product
  phase chains from this closeout.

- **`PHASE-C3B-EXECUTABLE-CONTRACT-CLOSURE-R1` — `CLOSED / ACCEPTED`
  (2026-07-19).** The exact Phase-C3 executable contract is closed in lifecycle
  §R.29 and schema contract §13.15. Acceptance is recorded by the technical
  supervisor acting as delegated project architect and is not attributed to
  Kleber. It records the single later cutover window, database-owned fence,
  deterministic frozen 51-mapping/inventory snapshot, exact 39-header/44-line
  import reconciliation, normalized shared-Pedido reader projection, explicit
  ACL/policy closure, and rollback/forward-recovery boundaries. This is
  documentation-only: no implementation, staging application, migration, import,
  fence, switch, ACL change, deployment, production, `main`, remote change, or
  push occurred. `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE` remains
  nonblocking debt. Its then-next C3C inactive implementation was subsequently
  authorized, implemented, corrected through R4, and locally accepted as recorded
  above; it created no environment or activation authority.

- **`PURCHASE-ORDER HYBRID ORIGIN — F3R1 STAGING DATABASE/API VALIDATION AND
  PHASE-C REVALIDATION` — `CLOSED / ACCEPTED_WITH_SCOPED_COMMITTED_CONCURRENCY_FIXTURE_WAIVER`
  (2026-07-19).** Staging Supabase
  `ucrjtfswnfdlxwtmxnoo` contains exactly one
  `20260719215401 / 74_ordem_compra_hybrid_origin_forward_correction`; its
  history, objects, guards, data preservation, and accepted ACL matrix were
  reverified against the checked-out migration. A rollback-only canonical-domain
  fixture passed the OP-origin, shared Pedido-origin, replay/conflict, absolute
  target, cleanup, post-emission freeze, receipt, reversal, and nullable-OP Phase C
  matrices. PRE-PROD hybrid-origin and targeted Phase C revalidation therefore
  pass on read-only and rollback evidence, with zero fixture residue. Committed
  multi-session staging concurrency remains unproved by a committed fixture: every
  successful command permanently records its actor/key in the immutable command
  journal, so a committed synthetic race cannot meet the mandatory zero-residue
  policy, and no canonical retained staging fixture exists. **Architect disposition
  (2026-07-19):** the isolated F1 eight-case distinct-session concurrency matrix
  plus the F3R1 staging runtime/rollback evidence are accepted as sufficient for
  this gate; the committed-staging-fixture requirement is **waived for F3R1 only**.
  Immutable journal integrity and zero synthetic residue remain mandatory and are
  not relaxed by this waiver, which authorizes no journal-residue policy and does
  not extend to any later gate. PRE-PROD hybrid-origin and focused Phase C
  revalidation are **accepted**. **Provenance correction (2026-07-19):** the prior
  ledger attribution of `"aceito, siga"` to Kleber was factually incorrect — he did
  not say it and did not provide that gate phrase; F3R1 acceptance is ratified by
  the technical supervisor acting as delegated project architect, following
  Kleber's actual directive `"cara, quem faz isso é você... você é o arquiteto..."`.
  This changes provenance only; the scoped waiver, accepted evidence, boundaries,
  and C3A `not accepted` status are unchanged. C3A remains `legacy_active / not_started`,
  implemented and verified but **not accepted**. Vercel, browser validation,
  production, `main`, remotes, push, the prohibited project, native emission
  activation, and C3A execution remain unauthorized and were untouched.

- **`PURCHASE-ORDER HYBRID ORIGIN — F2 PEDIDO/INSUMOS UI CUTOVER R1` —
  `CLOSED / ACCEPTED_LOCALLY_WITH_INTEGRATED_STAGING_VALIDATION_REQUIRED`
  (2026-07-19).**
  Technical commit `577921150ac5a478294f28b1c8c3501dad23dbbb` adds the dedicated
  admin route `#/pedidos/:pedidoId/insumos` and its Pedido-detail/OP contextual
  navigation. `js/screens/pedido-insumos-distribuicao.js` renders canonical native
  needs and allocation projections, calls only
  `definir_alocacao_necessidade_compra_fio(need, supplier, absoluteTarget, key)`,
  and retains one command key for a retry while issuing a new key for a later modal
  action. Purchase-order entity screens no longer originate orders, items, or
  allocations; OP no longer assigns a purchasing supplier. F2 adds no stage or
  migration. Focused F2/Pedido/OP/order/router tests pass 139/139. The architect
  accepted technical commit `577921150ac5a478294f28b1c8c3501dad23dbbb` and
  documentation closeout commit `911b7985297d3b33b4fbf4cf3575a39b8440ff42`.
  At F2 acceptance registration, browser validation and staging deployment were
  pending; the F3 checkpoint above supersedes that environment status. The 133 broader-suite
  failures remain pre-existing baseline debt; deterministic serial identity
  comparison is incomplete. `PURCHASE-ORDER HYBRID ORIGIN — F3 INTEGRATED STAGING
  DEPLOYMENT AND AUTHENTICATED VALIDATION R1` is authorized under the architect's
  staging-only execution order. `db/74` is now applied only as recorded by the F3
  checkpoint above. C3A remains implemented and verified but not accepted. Production, `main`,
  and the prohibited project remain forbidden.

- **`PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION IMPLEMENTATION R1` —
  `CLOSED / ACCEPTED_WITH_NONBLOCKING_BASELINE_TEST_DEBT` (2026-07-19).**
  Read-only reconciliation returned `READY_FOR_F1_IMPLEMENTATION`. Technical commits
  `463cafbdd4816ff1093b3086dd71d3d6e70b3479` and
  `680cff136a3294ae9a345fc8f91f02e246891eef` add the forward-only migration and
  preserve authenticated need synchronization while revoking only the accepted
  obsolete writers. Migration
  `db/74_ordem_compra_hybrid_origin_forward_correction.sql` contains the accepted
  need-first writer/journal, corrected allocation identity, derived quantity/cleanup guards,
  exact ACL disposition, and Phase C shared NULL-OP compatibility. Isolated
  PostgreSQL 18.4 apply/reapply, rollback-scoped functional proof, and eight distinct-
  session race cases passed. Focused purchase-order tests pass 62/62. The broader
  suite is baseline-identical after six added F1 passes: 3,896/3,764/132 before and
  3,902/3,770/132 after; normalized failure hash
  `5aca571de6057bfdf2080ef945112189e6f3f4cb7795ccd827a729131642e75f`.
   The accepted technical commits are `463cafbdd4816ff1093b3086dd71d3d6e70b3479`
   and `680cff136a3294ae9a345fc8f91f02e246891eef`; final technical closeout HEAD is
   `1ea4a509c069983732af86130d0092b6c1d96e2b`. At F1 closeout, migration `db/74`
   was implemented and verified locally only; the F3 checkpoint above supersedes
   its environment status. The normalized broader-suite
   failures are unchanged; the pre-existing admin-menu count failure remains
   nonblocking. C3A remains implemented and verified but not accepted. Production,
   `main`, remote changes, and push remain prohibited.

- **`PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT CLOSURE R1` —
  `CLOSED / ACCEPTED` (2026-07-19, accepted commit
  `00897f09267fc8304b329ce46ba985d03a57faff`).** The authorized
  read-only F1 readiness reconciliation returned `HARD_STOP — CONTRACT INCOMPLETE`:
  the accepted hybrid invariants did not define the exact need-first API,
  command/replay identity, cleanup state machine, or obsolete-writer ACL matrix.
  At the closure checkpoint, implementation remained unauthorized. Lifecycle
  specification §R.28 and schema contract §13 now close the exact executable
  contract: `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT)`;
  actor-scoped immutable command journal; one absolute target including zero;
  deletion of zero allocation, empty item, and empty never-emitted draft; unique
  `(item_id, necessidade_id)` identity; allocation-derived item quantity with a
  deferred database backstop; complete ACL disposition; shared Phase C allocated
  lines with real OP or NULL according to the locked need; stable errors; and exact
  lock order. The architect accepted this exact executable contract and separately
  authorized `F1 FORWARD CORRECTION IMPLEMENTATION R1`. F2 UI, C3A acceptance,
  staging application, production, `main`, and push remain unauthorized.

- **`PURCHASE-ORDER HYBRID ORIGIN — CANONICAL DOCUMENTATION CORRECTION R2` —
  `CLOSED / ACCEPTED` (2026-07-19, accepted commit
  `840dcb19b6bc6ffd8543a3f79bcae07516738bf6`).**
  The architect accepted the original purchase-order impact audit and the
  hybrid-origin addendum now governed by
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.27. Binding model:
  native cotton is OP-origin (`necessidade.op_id` = the real calculating OP);
  genuinely shared polyester is Pedido-origin (`necessidade.op_id IS NULL`);
  allocation provenance is derived from the locked need (`allocation.op_id` equals
  the need OP for OP-origin and remains NULL for Pedido-origin); callers cannot
  choose it. Shared allocation identity must be NULL-safe. Item ordered quantity is
  derived exclusively from allocation totals. Purchase orders belong to Pedido +
  supplier; distribution remains owned by Pedido → Insumos / `aguardando_fios`, not
  a new stage and not an OP-owned action. Phase C remains reusable, but its non-NULL
  OP receipt/ledger assumptions require localized forward correction and focused
  revalidation; valid excess remains allocation-free under `saldo_fios` and receives
  no artificial OP.
  **Accepted disposition:** the Impact Audit, Hybrid Need Origin Addendum, and
  Documentation Correction R2 are each `CLOSED / ACCEPTED`. Redo verdicts are
  REFUND-A **NO**, REFUND-B1 **NO**, PRE-PROD **NO**, and Phase C **NO**; the selected
  strategy is a forward corrective migration, with staging-data conversion **NO**.
  Supersession/restriction targets are
  independent `Nova ordem`, origination through `definir_item_ordem_compra`,
  item-first `alocar_necessidade_compra_fio`, caller-controlled `p_op_id`, manual
  authoritative item quantity, purchase-order-detail ownership of allocation,
  OP-surface ownership of supplier assignment, and every shared-receipt rule that
  requires an OP. No implementation, SQL, migration, test, grant, staging write,
  production, `main`, or push is authorized. **C3A remains implemented and verified
  in staging but not architecturally accepted.** The later F1 readiness gate failed
  closed and is now superseded operationally by the contract-closure entry above;
  F1 implementation was not authorized by this R2 acceptance itself and was later
  separately authorized and completed as recorded above. No later phase chains from
  this acceptance.

- **`PHASE-C3A` — `CLOSED / TECHNICALLY ACCEPTED` (2026-07-19).** Contract `d23645f`, foundation `fca6ea7`,
  protected singleton correction `0908b77`, and owner-only import command
  `94e6068` are installed on `dev`. Staging migrations are
  `20260719172749 / 71`, `20260719174006 / 72`, and `20260719175732 / 73`.
  `db/73` supplies `importar_saldo_inicial_ordem_compra_c3a(jsonb)`: owner
  `postgres`, `SECURITY DEFINER`, fixed empty `search_path`, and no EXECUTE for
  PUBLIC, `anon`, `authenticated`, or `service_role`. The immutable identity is
  cutover + flat row + mapping + item in `legacy_initial_balance_v1`; canonical
  normalized JSONB plus SHA-256 fingerprint controls exact replay versus
  `idempotencia_conflitante`. Transaction-scoped source and full-identity advisory
  locks serialize duplicates without globally serializing unrelated sources.
  Rollback-only functional, concurrency, non-posting, non-reversibility, ACL, and
  no-CASCADE rollback matrices passed. Detached full-suite comparison is stable:
  baseline 3,864/3,731/133, current 3,872/3,739/133, zero baseline-only,
  current-only, or unstable failure identities; canonical normalized SHA-256
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`.
  Final staging remains inactive: singleton `id=1 / legacy_active / not_started`,
  NULL snapshot/productive markers, zero headers/ledger/movements/baselines, preview
  39/44 / 20,221.280 kg / 405.980 kg excess / zero movements, and `saldo_fios`
  5 rows / 2,685.020 kg with hash
  `79d5c1393193b67cd9f3a7b8cdc5037ce919bca87084d59f84a08949baafd566`.
  `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE` remains nonblocking debt. No real
  import, fence, reader/writer or flat ACL switch, native emission, production,
  push, or C3B/C3C/C3D/C4/C5 occurred. **Technical acceptance (2026-07-19):**
  recorded by the technical supervisor acting as delegated project architect;
  this wording is not attributed to Kleber. Acceptance is documentation-only and
  authorizes no real import, snapshot, fence, reader/writer switch, flat-ACL
  change, native emission, `C3B`/`C3C`/`C3D`/`C4`/`C5`, production, `main`,
  remote change, push, or deployment.

- **`G28-MIGRATION-TRACK` (`PRODUCTION-MIGRATION-M0-M10`) — `COMPLETE / CLOSED`
  (2026-07-18).** The system is **LIVE IN PRODUCTION** at
  `inttracker-jade.vercel.app`, served by Vercel from `inttexsystem/inttracker`,
  running against Supabase `gqmpsxkxynrjvidfmojk` with migrated data, deployed Edge
  Functions, repointed client config, and a repointed Ingestor. All eleven phases are
  recorded under "Migration governance": **`M0`-`M6`, `M8`, `M10` — `CLOSED /
  ACCEPTED`**; **`M7` (formal smoke phase) and `M9` (backup repoint + first real run)
  — `SUPERSEDED BY REALITY`** (the live-and-serving system is the de-facto smoke; the
  production backup mechanism was never stood up as scoped — folded into the
  `CAMADA3 BK5-BK8` post-launch debt). Phase order was not strictly numeric — `M8` ran
  ahead of `M4`-`M7` by direct order, and `M4`/`M5`/`M6`/`M10` were executed by the
  architect out-of-band and are recorded here as accomplished facts.
- **`BACKLOG FREEZE` — `LIFTED` (2026-07-18).** The freeze was scoped "until after
  cutover (`M10`)"; cutover is done. **New fronts are authorizable again**, each by
  its own individual order. The consolidated, ranked `POST-LAUNCH DEBT REGISTER`
  (below) supersedes the former "residual risk register (12 items)".
- **Next authorizable action:** `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`.
  C3C-B remains the next product implementation lot but is not authorized; the
  governance foundation and later compaction do not create a C3C-B phase
  contract or implementation authority. C3D, staging
  application/validation, activation, deployment, real snapshot/import, fence,
  read switch, final ACL closure, cutover, C4, C5, production, `main`, remotes,
  and push remain unauthorized. Separately, the
  highest-consequence open operational item remains
  `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`, an `ACTIVE PRODUCTION BLOCKER`. See the
  `POST-LAUNCH DEBT REGISTER`. **Standing reminder: flip the Supabase MCP back to
  read-only** (still management-scoped/write-capable from `M2`/`M3`).
- **`ORDEM-COMPRA REFOUNDATION` — Part R `RATIFIED / ACCEPTED` (2026-07-18).**
  The architect accepted the governing refounded specification against baseline
  `f2261ec` after the final read-only verification returned `RATIFIABLE`. Acceptance
  chain: legacy diagnosis `de62b16` (accepted evidence); initial proposed-spec
  commit `c49f369`; design-gate commit `c10e959`; final structural-contract commit
  and acceptance baseline `f2261ec`. The purchase-order model is refounded from
  the flat three-dimension `ordens_compra_fio` table into a **four-layer model**
  (`necessidade_compra_fio → ordem_compra → ordem_compra_item →
  ordem_compra_item_alocacao`) — governing **Part R** of
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, citing
  `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md`. **Ratified legacy
  conversion: 64 needs / 51 headers / 51 items / 51 allocations** — every
  header-bearing legacy row 1:1, **no auto-merge** (`(pedido,fornecedor)` proves
  future draft-accumulation, not historical order identity; NULL supplier is never
  a merge key), Class C → needs-only, Class D received-without-emission provenance
  preserved. The flat foundation shipped in Phase `A` (`db/65`) and `B1` (`db/66`)
  is **superseded on the persistence model** by the refoundation; **their
  historical acceptance is preserved, not erased** (the flat table stays writable
  through coexistence; both receipt writers operate until Phase C). Rephased track:
  `REFUND-A → REFUND-B1 → PRE-PROD → B2 → C → D → E`. **Part R is `RATIFIED /
  ACCEPTED`.** **Structural clarification recorded (2026-07-18, §R.20):** the
  architect ruled the REFUND-A migration boundaries — additive dual-reference
  event/ledger transition (no destructive re-point; §R.20.1/§R.20.2), REFUND-A as
  schema-and-seed only (§R.20.3), a complete byte/count-equivalent rollback
  (§R.20.4), and mandatory read-only MCP-capability (§R.20.5) and Pedido-ownership
  (§R.20.6) preflights, each a HARD STOP on failure.
  **`REFUND-A` — `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`
  (2026-07-19, architect acceptance closeout, executed under the REFUND-A
  EXECUTION ORDER, staging `ucrjtfswnfdlxwtmxnoo` only):** migration `db/67_ordem_compra_refoundation_schema.sql`
  (commit `eb84071`, staging migration-history identifier
  `20260719012036 / 67_ordem_compra_refoundation_schema`) created the four
  persistence layers + `ordem_compra_item_compat_fio`, applied the additive
  dual-reference transition to `ordem_compra_eventos`/`ordem_compra_fio_lancamentos`
  (legacy references relaxed to nullable, new references added nullable, exactly-one
  -parent `CHECK`s, no writer switched), and seeded the ratified conversion exactly
  **64 needs / 51 headers / 51 items / 51 allocations / 51 mappings** (Class
  A27/B12/C13/D12; OP36 → 4 distinct headers; OP1/OP2 → 11 null-Pedido needs/headers,
  source-row identity preserved). The ownership guard trigger, the
  `kg_alocado` sole-cache-maintainer trigger, and the canonical allocation RPC
  (`alocar_necessidade_compra_fio`, `SELECT … FOR UPDATE`) were built but granted to
  **no client role** — inactive until PRE-PROD. The ledger structural contract
  (append-only guard, estorno-relationship guard, sign `CHECK`s, `idempotency_key`)
  was built on the existing (still-empty) `ordem_compra_fio_lancamentos` table with
  no opening balance and no writer. **Concurrency-gate waiver (architect ruling,
  this order):** the live two-session T1/T2 interleave test was waived for REFUND-A
  because allocation is not activated as a business path; accepted instead were
  catalog proof of `SELECT … FOR UPDATE`, the `kg_alocado` `CHECK` backstop, direct
  -DML denial to `authenticated`/`anon`, and deterministic sequential tests (all
  passed). **Debt registered: `LIVE_ALLOCATION_T1_T2_TEST_PENDING`** — does **not**
  block this REFUND-A acceptance; it is a **HARD STOP** before: (1) PRE-PROD
  activates purchase distribution; (2) any authenticated business grant is added to
  the allocation RPCs; (3) any application begins calling the allocation writer;
  (4) any production promotion involving allocation. **Also preserved as a Phase-C
  activation obligation (architect ruling, this closeout):** the canonical receipt
  writer must enforce the remaining reversible quantity for partial/repeated
  `estorno` reversals before ledger authority is activated — the append-only and
  estorno-relationship guards built in REFUND-A do not yet enforce reversal
  **magnitude**, by design (§R.8 Ruling 8 assigns that to the canonical writer, not
  a REFUND-A schema `CHECK`); Phase C must close this before switching receipt
  reads/writes to the ledger. **Verification (staging, all rolled-back fixtures unless noted):**
  21/21 negative-constraint tests correctly rejected by their intended guard;
  reversal-via-delete never goes negative; `authenticated`/`anon` direct DML denied
  (`permission denied`) on both new tables tested; append-only guard rejects
  UPDATE/DELETE; estorno-relationship guard enforces same-parent/positive-source;
  over-reversal **magnitude** validation is an intentionally undeferred scope
  boundary (Phase C canonical-writer responsibility, not a REFUND-A schema `CHECK`
  — documented, not a defect). **Legacy-flow regression (all passed, live RPC calls
  against a real admin session, rolled back):** `emitir_ordem_compra_fio`/
  `cancelar_ordem_compra_fio` (db/66) still succeed unchanged, writing
  legacy-referenced events (`ordem_compra_id` stays `NULL`); the OP-screen
  extended-select reader pattern still resolves; the direct `kg_recebido` writer
  path (`registrarRecebimentoOrdemFio`/`screenFornecedorOrdens` pattern) still
  succeeds. **Before/after equality:** `ordens_compra_fio` stayed at 64 rows with an
  **identical row fingerprint** (`e11babdaf6cc98bd3b688839a790b64d`) before, during,
  and after every test. **Rollback rehearsal:** the complete rollback DDL (drop the
  four new tables + compat mapping + new functions; remove only the additive
  event/ledger columns/constraints/triggers; restore the original `NOT NULL`/`CHECK`
  contracts) was executed and verified to pass all 9 restoration checks, then the
  rehearsal itself was rolled back, leaving the real committed migration intact.
  **No application code, UI, reader/writer cutover, production access, or push** —
  staging-only; flat administrative and receipt authority remains entirely on
  `ordens_compra_fio` (unchanged, no reader/writer switched). **Acceptance
  (2026-07-19):** the architect accepted REFUND-A as `CLOSED /
  ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT` — the debt above does not block
  this acceptance, only the named future activations. **`REFUND-B1` is now the
  next authorizable phase but is NOT authorized by this closeout; `PRE-PROD` and
  every later phase remain `NOT AUTHORIZED`.** Full detail:
  `docs/ledgers/G28_LEDGER.md` REFUND-A entries (staging verification +
  acceptance closeout). **Binding precondition:** a contemporaneous read-only **production** `ordens_compra_fio`
  diagnosis is mandatory immediately before any production promotion/migration in
  this track — production is **UNKNOWN for migration** and was **not accessed**.
  Docs commits: `Add purchase-order legacy diagnosis` (`de62b16`), `Propose
  purchase-order refoundation specification` (`c49f369`), then **`Resolve
  purchase-order refoundation design gates`** — the latter patching Part R after a
  read-only ratification audit returned `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION`
  (accepted): Model A atomic need (no `_origem` child, no JSONB), NULL-safe
  partial-unique need identity, single locked-cache double-distribution design
  (T1/T2 write-skew proof), receipt-ledger idempotency + `estorno` compensation,
  Phase-C opening-balance import (no `kg_recebido_inicial`), and per-dimension
  coexistence authority (no split-brain). A **second (final) ratification audit**
  then returned `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION` (accepted), and the
  **structural patch** (`Complete purchase-order refoundation structural contract`)
  closed the remaining structural contracts: legacy source-row identity
  (`legado_origem_ordem_compra_fio_id`), exactly two native material/origin
  combinations + DB ownership guard, separate native/legacy uniqueness, allocation
  RPC/trigger split, receipt-ledger sign/reversal + append-only, explicit
  `ordem_compra_item_compat_fio` mapping, event-derived `saldo_fios`, cutover
  point-of-no-return, and the native receipt lifecycle gate. **Every
  migration-critical decision is CLOSED; no open alternatives remain.** The final
  verification found no migration-critical contradiction, omission, or unresolved
  choice. **`REFUND-A` is now `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`**
  (see the dated entry above). Non-blocking documentation follow-ups remain
  pending: `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and `DOCUMENTATION_INDEX.md`. A
  contemporaneous read-only production diagnosis remains mandatory before any
  production migration.
  Non-blocking documentation follow-ups remain pending: `PEDIDO_OP_SCHEMA_CONTRACT.md`
  §6.2 and `DOCUMENTATION_INDEX.md`. The historical acceptance of the old Phase `A`
  and `B1` remains preserved while their flat persistence foundation is superseded.
- **`REFUND-B1-CONTRACT-R1` — `NOT ACCEPTED AS WRITTEN` / `SUPERSEDED BY R2`
  (2026-07-19).** The architect rejected R1 for three material defects
  (emission-without-allocation; non-idempotent additive item writer; premature
  structurally-incomplete bridge) and issued `REFUND-B1-CONTRACT-R2` (see the next
  bullet). The R1 record below is retained for provenance; **§R.22 of the spec
  governs over the corrected parts of §R.21.**
- **`REFUND-B1-CONTRACT-R1` (original record) —
  (2026-07-19, documentation-only design closure, branch `dev`, baseline
  `6a1066e`, staging read-only only).** The architect ordered a native-admin
  authority design closure to settle the gaps the accepted REFUND-B1 pre-order
  reconciliation surfaced, **before** any `db/68` or application change is
  authorized. Written to `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` **§R.21** (new
  section) + banner pointer. **Binding determinations:** REFUND-B1 changes
  **administrative authority only** (native → `ordem_compra`; imported legacy →
  flat path; receipt stays flat until Phase C; allocation inactive/no grant/no
  call). ONE origination writer `adicionar_item_ordem_compra` (Option B:
  header + item, **no allocation, no needs, no event**); native item identity =
  `(ordem_id, material, color)`, OP-free/need-free; native
  `emitir_ordem_compra`/`cancelar_ordem_compra` on `ordem_compra.id`, reject
  `legado=TRUE`, write `ordem_compra_id` events; the compatibility bridge
  `criar_ponte_compat_ordem_compra_item` is **DEFINED but deferred to PRE-PROD**
  (the flat `ordens_compra_fio.op_id` is `NOT NULL`, verified live — so
  multi-OP and Pedido-origin-polyester native items are **not flat-representable**
  → **HARD STOP, never fabricate an OP; Phase-C native ledger only** — a standing
  PRE-PROD hard stop, not a REFUND-B1 blocker); `SECURITY DEFINER` read-model RPC
  pair `listar_ordens_compra_admin`/`obter_ordem_compra_admin`; a **dedicated
  `#/ordens-compra/:id` entity screen** (new `js/router.js` regex branch — the app
  has no generic `:id` support) with emit/cancel as actions on the screen and
  `buildOrdensReaderSection` demoted to summary + link (**this pulls the former
  "B2" dedicated screen into REFUND-B1**); a **non-destructive routing/authority
  rollback**; ACL with **no** anon grant (holding REFUND-A's bar, not the stale
  `ordens_compra_fio` anon gap), no allocation grant, no receipt change; and an
  exact `db/68_ordem_compra_native_admin.sql` + application manifest + test
  matrix. **`PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 corrected** this phase
  (`ordens_compra_fio` reclassified as a per-dimension authority) — that half of
  the standing documentation debt is now **closed**; **`DOCUMENTATION_INDEX.md`
  remains the only pending REFUND-A documentation follow-up.** Naming drift
  resolved: the installed `alocar_necessidade_compra_fio(p_item_id,
  p_necessidade_id, p_op_id, p_kg)` is canonical for future PRE-PROD; §R.4 prose
  corrected-on-naming; no alias created. **No DB write, no migration, no
  application code, no test, no push, no `main`, no production, prohibited project
  not accessed; `.gitignore`/`AGENTS.md` untouched.** Full detail:
  `docs/ledgers/G28_LEDGER.md` REFUND-B1-CONTRACT-R1 entry. **REFUND-B1
  implementation remains `NOT AUTHORIZED`.** **Next authorizable action:**
  architect acceptance of this contract, then a separate `REFUND-B1` order.
- **`REFUND-B1-CONTRACT-R2` — `AUTHORIZED` + `REFUND-B1` implementation
  `AUTHORIZED ONLY AFTER THE R2 DOCUMENTATION GATE PASSES EXACTLY` (2026-07-19,
  branch `dev`, baseline `39d35f7`, staging `ucrjtfswnfdlxwtmxnoo`).** The
  architect corrected R1's three defects and set the binding REFUND-B1 boundary:
  **native DRAFT administrative authority only, not native emission authority.**
  Spec **§R.22** (new correction section) records it. **ACTIVE** (client): create/
  obtain a native draft, **absolute/idempotent** `definir_item_ordem_compra`,
  `remover_item_ordem_compra`, **active** draft `cancelar_ordem_compra`, list,
  dedicated entity screen. **INSTALLED BUT INACTIVE:** `emitir_ordem_compra`
  (granted to **no client role**; full-allocation precondition; owner-only for
  rollback-safe tests) + a disabled emit UI action
  (`bloqueio_emissao='distribuicao_necessidades_pendente'`). **NOT CREATED:** the
  compatibility bridge (no `native_bridge` rows, no flat shadow, no synthetic
  `op_id`) — debt **`NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`**
  registered. **INACTIVE (unchanged):** allocation writer, receipt ledger, native
  receipt path. Read model `listar_ordens_compra_admin`/`obter_ordem_compra_admin`
  (server-composed, native/legacy once, server-derived actions
  `editar_itens/remover_itens/cancelar=true`, `emitir/receber=false`). Mandatory
  **five-file** dedicated `#/ordens-compra/:id` + `#/ordens-compra` screen split;
  `op-nova.js` reduced to compact summary + "Ver ordem" link (inline emit/cancel
  removed). Migration `db/68_ordem_compra_native_draft_admin.sql`. Native emission +
  bridge/receipt decisions are **PRE-PROD** (gated on
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING` + full allocation). **PRE-PROD remains
  `NOT AUTHORIZED`.**
- **`REFUND-B1` — `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES` (2026-07-19,
  architect acceptance closeout, branch `dev`, docs-only, no DB access).** The
  architect accepted the REFUND-B1 implementation recorded in the entry directly
  below (technical commits `231f17a`/`82f6247`/`d4d7533`/`7a2c04c`, staging
  migration `20260719025055 / 68_ordem_compra_native_draft_admin`). **Visual
  qualification `ACCEPTED`** — the architect reviewed the supplied contact
  sheet: dedicated purchase-order list/entity screens; native/legacy
  distinction; item editing confined to the dedicated entity; action-only
  cancellation modal; native emission visibly disabled with the PRE-PROD
  explanation; OP screen reduced to contextual summary + navigation; no
  duplicate native/flat-shadow representation; desktop and tablet layouts
  acceptable. **Out-of-manifest test fixture synchronization `QUALIFIED /
  ACCEPTABLE`** — the changes in `tests/boot.smoke.js`,
  `tests/screens-common.smoke.js`, `tests/cadastros-screens.smoke.js`,
  `tests/documentos-recebidos.smoke.js` are accepted as mechanical,
  coverage-preserving synchronization caused by the new route/menu
  entry/screen registration; no assertion weakening or unrelated behavioral
  change identified. **Non-blocking UI debt registered:
  `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`** — the 390px evidence shows severe
  content compression from the pre-existing fixed-width administrative
  sidebar; app-wide, not introduced by REFUND-B1, non-blocking for this
  acceptance, **not authorized for correction in this closeout** — a separate
  global UI phase, not an ordem-compra-specific patch. **Future blocking gates
  (binding, restated):** (1) `LIVE_ALLOCATION_T1_T2_TEST_PENDING` — blocks
  allocation business activation, authenticated allocation grants, application
  allocation calls, production promotion involving allocation; (2)
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` — blocks fabricated
  -`op_id` flat shadows and native receipt routing through legacy writers for
  shared-polyester/multi-OP items; (3) native emission remains inactive/
  ungranted, PRE-PROD-only activation after allocation activation is valid +
  live concurrency evidence + full item-allocation reconciliation + emission
  preconditions pass; (4) native receipt authority deferred to Phase C; (5) a
  contemporaneous read-only production diagnosis remains mandatory before any
  production migration/promotion. **B2 residual scope** (supplier-assignment
  relocation off the OP screen; Phase-C receipt UI) remains governed by this
  updated canonical plan. **No database access, no `db/68` change, no
  application code, no test change, no push, no `main` touch, `.gitignore`/
  `AGENTS.md` untouched this closeout.** **`PRE-PROD` is now the next
  authorizable track but is NOT authorized by this closeout.**
- **`PRE-PROD-A-R1` — `CLOSED / ACCEPTED_WITH_NONBLOCKING_ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`
  (2026-07-19, architect acceptance, branch `dev`, baseline `51f31dd`).** The architect
  authorized `PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY`. The
  binding contract is closed in `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  **§R.23** (governs PRE-PROD-A over §R.17/§R.22.12). **PRE-PROD-A owns:** explicit
  Pedido purchasing regime (`pedido_compra_fio_regime`, immutable, seeded `legacy`
  on any legacy purchasing evidence else `native`); server-side native need
  assessment/synchronization from canonical production demand (`op_itens → modelos
  → parametros_largura`, eligible OP states `aberta`/`em_producao`, `tecelagem`
  only, latex excluded); absolute/idempotent draft allocation + removal; the
  dedicated distribution UI on route `#/ordens-compra/:id`; and the real
  authenticated **T1/T2** live-concurrency test that closes
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`. **PRE-PROD-A does NOT own** native emission
  activation, an `emitir_ordem_compra` grant, native receipt, flat shadows,
  receipt-ledger activation, emitted-order cancellation, B2 supplier relocation,
  or production. **Sequence ruling:** native emission stays inactive; **Phase C
  must establish native receipt authority before emission may be activated** — the
  former PRE-PROD-B emission step is now a post-Phase-C gate. **§8 need formula
  PROVEN** against staging: SQL replica of `calcularFiosOP`/`montarOrdensCompraFio`
  reproduces the 64-row flat corpus exactly (0 unmatched keys, **0.000 kg drift**).
  Migration slot **`db/69`** authorized (regime + resolver + assess/sync RPCs +
  hardened absolute `alocar_necessidade_compra_fio` + `remover_alocacao_compra_fio`
  + allocation-identity uniqueness + post-emission mutation guards + distribution
  read model; **no** emission grant, bridge, flat shadow, or receipt work).
  **Completion evidence (2026-07-19):** `db/69` remains **APPLIED to staging
  `ucrjtfswnfdlxwtmxnoo`** (`20260719120036 / 69_ordem_compra_preprod_allocation`).
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING` is **RESOLVED** by the authenticated live
  test: T1 PID `2272591` locked first at `2026-07-19T14:07:12.423433+00:00`, became
  ready at `...12.423614`, committed the absolute 60 kg allocation, and completed at
  `...14.959616`; T2 PID `2272590` started at `...13.362084`, waited, locked at
  `...14.962558`, then rejected its absolute 60 kg request with `excede_saldo` against
  the re-evaluated 40 kg remainder. Final allocation/cache were 60 kg; no
  over-allocation occurred. The current catalog confirms all eight authorized native
  admin RPCs are `SECURITY DEFINER`, `authenticated`-only, with `anon`/`PUBLIC`
  denied; retained authenticated-matrix evidence plus the live admin UI writes prove
  the authorized path. `emitir_ordem_compra` remains ungranted/inactive.
  **Activation and validation:** `ALLOCATION_ENABLED=true`; the dedicated native
  distribution UI performed create, absolute update (60→80), and remove under the
  authenticated staging admin session. Native draft controls are available; legacy
  orders remain reader-only; incomplete allocation blocks emission; complete allocation
  still blocks it with `recebimento_nativo_ainda_inativo`. Desktop/tablet/mobile and
  OP-reader evidence is in the out-of-Git PRE-PROD-A-R1 contact sheet. The 390px
  result reproduces the existing app-wide `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
  **Rollback rehearsal passed:** UI disabled; the three PRE-PROD-A writer grants were
  revoked; the native `persistirOP` permission-denial path returned `necessidades_sync`
  with no flat fallback; UI and grants were restored. All probes, run-key locks,
  fixture ranges, and active probe activity are zero. Focused tests passed 129/129;
  full suite: 3,743 pass / 132 known failures (the prior baseline recorded 133), with
  no new failure attributed to this closeout. **Architect ruling (2026-07-19):**
  `PRE-PROD-A-R1` is closed and accepted. The desktop/tablet visual package and
  staging technical evidence are accepted; the 390px result remains only the
  pre-existing, non-blocking `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, native emission inactive
  and ungranted, Phase C receipt authority, and the mandatory contemporaneous
  production diagnosis remain open. Production, `main`, push, `PRE-PROD-B`, and
  Phase C remain prohibited/not authorized. UI provenance / modern-visual-language
  audit is deferred as a separate post-stabilization, non-blocking activity. The
  next authorizable action requires a separate architect order; this acceptance
  authorizes neither PRE-PROD-B nor Phase C implementation.
- **`PHASE-C2` — `CLOSED / ACCEPTED`
  (2026-07-19, branch `dev`, baseline
  `3395f83df0eb7db604df9a80d4a43a0601bc8b6c`).** The architect authorized the
  C2 native receipt foundation under the exact contract in lifecycle spec
  **§R.25**. The implementation is limited to migration
  `db/70_ordem_compra_native_receipt_foundation.sql`, one focused test file if
  required, staging application, verification, cleanup, and closeout.
  **Concrete boundary:** immutable `ordem_compra_recebimentos` command headers;
  additive native columns on `ordem_compra_fio_lancamentos`; canonical RPCs
  `registrar_recebimento_ordem_compra` and
  `estornar_recebimento_ordem_compra`; read model
  `obter_historico_recebimento_ordem_compra`; ledger-derived item/header/
  allocation/excess projections; and the source-linked
  `ordem_compra_fio_movimentos_estoque` surplus movement authority with
  `saldo_fios` retained only as the existing aggregate cache.
  **Actors:** authenticated admin or matching active supplier may register through
  the same receipt RPC; only admin may reverse; suppliers receive no reversal or
  direct table DML. **Idempotency:** namespace `native_receipt_v1`, scoped by actor
  type + actor UUID + key; canonical JSONB payload equality controls exact replay
  versus conflict. **Locks:** order header; affected items ascending; allocations
  ascending; command identity; ledger rows ascending; inventory identities in
  deterministic material/color order; all balances are re-evaluated under lock.
  **Implemented:** documentation boundary commit `9a5cb4f`; migration and focused
  test commit `833c2ad`; technical/staging checkpoint `14ca5c7`; staging migration
  `20260719160518 / 70`; 48/48 focused
  native purchase-order tests pass. Receipt, reversal, read-model, ACL, immutable
  guard, allocation/excess, derived-cache, inventory-delta, idempotency, and
  true-concurrency matrices passed. The dependency-safe rollback rehearsal passed
  inside a rolled-back transaction. All marked fixtures, cron/probe objects, and
  transient rows were removed; staging returned to zero native receipts/ledger/
  movements and `saldo_fios` returned to 5 rows / 2,685.020 kg. The reproducible
  full JavaScript baseline is 3,864 tests / 3,731 pass / 133 identified
  pre-existing failures. PRE-PROD-A `47b8e6a`, pre-C2 baseline `3395f83`, and C2
  checkpoint `14ca5c7` produce the same normalized failure set
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`; zero
  baseline-only/current-only or unstable identities exist. The former aggregate 132
  count is superseded; no C2 regression is attributable to either implementation file.
  **Explicit exclusions:** no legacy seed/import, cutover, flat-writer fence,
  productive-reader switch, flat grant revocation, UI, native emission activation,
  `emitir_ordem_compra` grant, production, `main`, or push. C3/C4/C5 remain separate
  and unauthorized. **Architect ruling:** C2 is `CLOSED / ACCEPTED`. Flat receipt
  remains productive authority until a separately authorized C3 cutover; no opening-
  balance seed or productive-reader switch occurred. The next authorizable action is
  a fresh read-only C3 pre-cutover reconciliation and implementation-boundary
  diagnosis; it does not authorize C3 implementation or any phase chain.
- **`PHASE-C1` — `CLOSED / ACCEPTED` (2026-07-19, documentation-only contract,
  branch `dev`, baseline `47b8e6a6bc8dea0cd0fe053fef2ef9f2f16f14fa`).** The
  architect accepted the native receipt authority contract recorded in
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` **§R.24**.
  `ordem_compra_fio_lancamentos` evolves into the **sole canonical physical
  receipt ledger**; no competing receipt ledger is permitted. A future immutable
  receipt header owns document/receipt identity, origin, date, actor, a stable
  submission idempotency key, and immutable command metadata. Receipt lines bind
  that header to the item, optional need allocation, the allocation's derived
  real-or-NULL OP provenance, and the canonical ledger entry. Cotton follows its
  concrete real-OP allocation; shared Pedido-origin allocation retains NULL OP;
  shared polyester needs remain `op_id IS NULL` until allocated, and each receipt
  follows the actual allocation OP without representative or synthetic OPs.
  Excess stays on the same receipt/item with a narrowly scoped transactional
  inventory movement, never a fake need/allocation.
  **Writer/reversal contract:** only emitted, non-cancelled, acceptance-eligible
  native orders may receive; deterministic order/item/allocation locks and stable
  idempotency are mandatory; allocation receipts cannot exceed `kg_alocado`;
  history is immutable. Reversal is a negative ledger entry referencing the
  positive source and is capped by the remaining reversible amount under locks.
  Item received totals, header status, and projections are database-derived;
  events are audit evidence, not physical authority; clients receive no direct
  table-write authority.
  **Actors/ACL:** admin and future matching-supplier flows must use the same RPC.
  Supplier access is restricted to its matching order and never gains table DML;
  supplier reversal permission must be decided explicitly before implementation.
  Supplier UI is deferred. The future admin receipt surface belongs only in the
  `#/ordens-compra/:id` **Recebimentos** section/modal, not in OP, Pedido,
  transition, or supplier-assignment modals.
  **Legacy/cutover:** classes A/D import one `import_saldo_inicial` receipt per
  mapped item (D preserves received-without-emission without fake events); B seeds
  none; C has no rows. Cutover must fence both flat writers, prove denial, snapshot
  all 51 mappings, import/reconcile, migrate both consumers, switch readers, revoke
  flat updates, close the ACL gap, and remove anonymous update. Rollback is allowed
  only before the first post-switch canonical receipt and only with zero canonical
  writes; afterwards recovery is forward-only.
  **Sequence:** C1 contract only; C2 foundation/writer/reversal/narrow inventory;
  C3 cutover/import/readers/ACL; C4 admin UI and later supplier UI; C5 is the
  separate emission gate. Native emission remains inactive until C1-C4 are
  accepted. **No implementation, migration, staging write, grant, UI, test, push,
  `main`, production, or C2 work was authorized or performed.** Next authorizable
  action: a separate architect order for C2 after resolving its recorded open
  design questions.
- **`REFUND-B1` (original implementation record) — 2026-07-19, branch `dev`,
  staging `ucrjtfswnfdlxwtmxnoo` only; superseded on status by the acceptance
  closeout directly above, retained verbatim for the technical detail.** The
  R2 documentation gate passed exactly
  (commit `231f17a`), so implementation proceeded under the same order.
  **Migration `db/68_ordem_compra_native_draft_admin.sql`** (commit `82f6247`,
  staging migration-history identifier `20260719025055 /
  68_ordem_compra_native_draft_admin`): six functions —
  `definir_item_ordem_compra` (absolute/idempotent), `remover_item_ordem_compra`,
  `cancelar_ordem_compra` (draft), `listar_ordens_compra_admin`,
  `obter_ordem_compra_admin` (all `SECURITY DEFINER`, `is_admin()`, EXECUTE
  `authenticated` only), and `emitir_ordem_compra` **installed but granted to no
  client role** (full-allocation precondition; owner-only) — plus two partial
  unique indexes backing the idempotent item writer. **No bridge, no allocation
  grant, no receipt change** (verified live: `alocar_necessidade_compra_fio`
  ungranted, zero `native_bridge` rows, no bridge function). **Application**
  (commit `d4d7533`): dedicated `#/ordens-compra` list + `#/ordens-compra/:id`
  detail screens (five files) with native draft item edit/remove, draft cancel,
  server-derived allowed actions, and a **disabled** Emitir showing
  `bloqueio_emissao='distribuicao_necessidades_pendente'`; `op-nova.js` reduced to
  a compact summary + "Ver ordens de compra" link (inline emit/cancel removed,
  1548→1503 lines). **DB test matrix (rolled back):** first-draft, reuse,
  absolute-idempotency (no increment), quantity replacement, item reuse/create,
  cancelled/emitted not reused, invalid pedido/supplier/material/color, zero/neg
  qty, legacy-mutation rejection, item removal (+ allocation-block), draft cancel
  (+ repeat-reject), events with `ordem_compra_id` only, **emission rejected with
  no/partial allocations and succeeding only in an owner-only fully-allocated
  fixture**, post-emission immutability, and full ACL (authenticated cannot emit;
  anon/service_role cannot execute; no direct table DML; allocation ungranted; no
  bridge) — all passed. **Legacy regression (rolled back):** flat
  `emitir/cancelar_ordem_compra_fio` unchanged, direct `kg_recebido` write path
  unchanged, OP reader resolves, **`ordens_compra_fio` fingerprint
  `eb26d39316e7fb4a5f4b46c8a99631b3` byte-identical before/after**. **UI validation
  (staging-served app, stubbed data):** list renders native + legacy each once;
  native detail shows items with edit/remove, add-item, cancel, and a disabled
  Emitir with the PRE-PROD reason; legacy detail is read-only (no actions); no
  console errors. **Rollback rehearsal (rolled back):** revoking the new client
  grants makes them inert while retaining all native data; db/68 objects drop
  without altering db/67 (tables + `alocar_necessidade_compra_fio` intact).
  **Test suite:** full `node --test tests/*.js` = 132 pre-existing failures
  unchanged, **zero new failures** (10 new `ordem-compra.smoke.js` + updated
  `op-nova.smoke.js`; menu/route-count fixtures synced in
  `boot`/`screens-common`/`cadastros-screens`/`documentos-recebidos` smokes for
  the required nav entry — a forced coupling beyond the two named test files,
  recorded here). **No production access, no push, no `main`, prohibited project
  not accessed; `.gitignore`/`AGENTS.md` untouched.** **Open future debts:**
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`;
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`; active native emission
  deferred to PRE-PROD; native receipt authority deferred to Phase C; a
  contemporaneous read-only production diagnosis before any production migration.
  **PRE-PROD remains `NOT AUTHORIZED`. Next authorizable action:** architect visual
  validation + acceptance of REFUND-B1, then a separate PRE-PROD order.
- **`ORDEM-COMPRA-LIFECYCLE` track (flat-model history, superseded on persistence
  by the refoundation above) — spec `RATIFIED` (`ORDEM-COMPRA-LIFECYCLE-
  SPEC-RATIFICATION-R1`, 2026-07-18); Phase `A` (schema + config) `CLOSED /
  ACCEPTED` (2026-07-18).** `db/65_ordem_compra_lifecycle_schema.sql`
  applied and verified in staging (`ucrjtfswnfdlxwtmxnoo`): the three
  orthogonal dimension columns (`status_administrativo`/`status_aceite`/
  `status_recebimento`) + audit columns on `ordens_compra_fio`, the new
  `ordem_compra_fio_lancamentos` ledger (empty, no trigger yet — Phase C),
  `ordem_compra_eventos` transition audit, and the `ordem_compra_config`
  singleton (`exige_aceite=false`), all admin-only-read/no-client-write
  (db/57/63 grants standard). `ALTER TABLE` + the one-time legacy-marking
  backfill ran in one transaction (binding gap 1). 14/14 verification-matrix
  checks passed (`BEGIN…ROLLBACK`, synthetic, cleanup confirmed zero);
  12/12 static smoke tests; full-suite regression unchanged (`+12` new
  tests, `140` pre-existing failures byte-identical before/after). No RPC,
  no UI, no JS change — zero behavior change for existing readers. Full
  detail: `docs/ledgers/G28_LEDGER.md` Phase `A` entry,
  `docs/reports/ORDEM_COMPRA_PHASE_A_2026-07-18.md`. **New branch discipline
  (binding going forward):** implementation work lands on branch `dev`
  (created from this track's HEAD); `git push production dev` is a
  standing remote-backup authorization — push to `main` remains forbidden.
  **Spec AMENDED 2026-07-18 (`ORDEM-COMPRA SPEC AMENDMENT`): §6 (UI surface) +
  §8 (phasing) record the architect's separation-of-responsibilities ruling —
  receipt registration moves to the purchase order's own detail screen, the
  OP-screen section becomes a READER (registers nothing), and Phase B is split
  into `B1` (OP reader section + `emitir`/`cancelar` RPCs + RLS revoke `db/66`),
  `B2` (order detail screen, route `#/ordens-compra/:id`), `B3` (orders list
  screen).
  **Phase `B1` — `CLOSED / ACCEPTED` (2026-07-18).** UI reader
  (`buildOrdensReaderSection` in `js/screens/op-nova.js`, commit `b0c3f27`):
  one row per linked order, material—cor · fornecedor · qtd · three dimension
  badges · Emitir/Cancelar admin actions per state, config chip,
  frozen-at-emission note, no receipt inputs, defensive
  extended-select-with-fallback so a pre-`db/65` database never regresses.
  DB half (`db/66_ordem_compra_emitir_cancelar.sql`, commit `5a2cde7`):
  `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio` RPCs (admin-only,
  fornecedor-assigned precondition on emit, `rascunho`/`emitida` precondition
  on cancel, one `ordem_compra_eventos` row per transition) + partial ACL
  hardening (`REVOKE UPDATE` on `ordens_compra_fio` from `authenticated`,
  restored column-by-column except the three dimension columns — see the
  `KG-RECEBIDO-ACL-GAP` debt below). Verified live in staging
  (`ucrjtfswnfdlxwtmxnoo`): a scoped `BEGIN…ROLLBACK` matrix re-confirmed both
  RPC branches (null-fornecedor emit → `{ok:false,erro:...}`, row unchanged;
  fornecedor-assigned emit → `{ok:true,...}`, row transitions +
  1 `ordem_compra_eventos` row), then the architect walked both paths live in
  the UI (error path: Emitir on a "— não atribuído" order now shows the error
  toast, row stays Rascunho; success path: Emitir on a fornecedor-seeded order
  succeeds, badge flips to Emitida) — **both confirmed**.
  **`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH` is RESOLVED** (the `supabase-legacy`
  MCP authenticated this session) — the live-blocker entry below is retired.
  **`ORDEM-COMPRA-B1-UI-RESULT-CHECK` bug found + fixed in this closeout,
  commit `275ede2`:** `emitirOrdemCompra`/`cancelarOrdemCompra`
  (`js/screens/op-nova.js`) checked only `res.error` (transport-level); the
  RPCs return HTTP 200 with `{ok:false,erro:...}` on business-logic rejection,
  so a rejected emit/cancel showed a **false success toast** while the row
  silently stayed unchanged — reproduced live (Emitir on a null-fornecedor
  order showed "success" with no actual DB transition; confirmed via a full
  non-legacy-row scan, 0 rows had ever reached `emitida` with a real
  `emitida_em`/event before the fix) and fixed to also check `res.data.ok`,
  surfacing `res.data.erro` on rejection. **Sweep finding (no systemic
  debt):** every other `supa.rpc(...)` call site in the app either already
  checks `res.data.ok === false` correctly, or calls an RPC with no
  `{ok,erro}` envelope (raises a Postgres exception or returns a scalar), so
  an error-only check is correct there — this was an isolated defect in the
  two new B1 handlers, not a pattern. 2 new render-harness smokes assert the
  error path (rejected emit/cancel → error toast, not the false success
  toast); full suite `132` pre-existing failures unchanged, zero regression.
  **Ratified supplier-assignment decision (2026-07-18, this closeout):**
  fornecedor assignment is a **per-order** property of `ordens_compra_fio`
  (schema already supports it — nullable `fornecedor_id` FK, one row per
  material+color, already the row-level RLS ownership key for
  `ocf_fornecedor_read`/`update` and the `emitir` RPC's own precondition — no
  schema change needed). Assignment **moves to the future `B2` order-detail
  screen**; the OP-screen's legacy fornecedor selects (`buildAtrib` in
  `op-nova.js`, which bulk-assigns one fornecedor per material across an
  entire OP via `atribuirFornecedorFioOp`) are **removed only after `B2` is
  functional** (no assignment-capability gap in between). `op_fornecedores` is
  **kept synchronized as a compatibility projection** — it is not cosmetic:
  `ops_fornecedor_read`/`op_itens_fornecedor_read` RLS key on it for supplier
  visibility, and `screenFornecedorOrdens`'s embedded `ops(numero,ano)` join
  degrades silently without it. **Reassignment after `emitida` is BLOCKED**
  (the correction path is cancel + open a new draft order, not an in-place
  fornecedor swap on an emitted order — keeps the `ordem_compra_eventos` audit
  trail honest). The empty-dropdown bug (`fornecedores.tipo` domain
  `fio_algodao`/`fio_poliester`/`tecelagem`/`latex` vs `ordens_compra_fio.tipo`
  domain `algodao`/`poliester`, collided under the shared variable name `tipo`
  in `buildAtrib`, `op-nova.js:1185-1188`) is **recorded as noted-not-fixed** —
  the selects it affects are slated for removal at `B2`, so patching a
  soon-to-be-deleted code path is not worthwhile.
  **Registered debts (canonical, verbatim):**
  - `ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP` — `kg_recebido` remains directly
    writable by `authenticated` after `db/66` (both
    `registrarRecebimentoOrdemFio`, `op-writes.js:29-43`, and
    `screenFornecedorOrdens`, `fornecedor.js:461-463`, keep writing it
    directly); PostgreSQL column-level `REVOKE` cannot narrow an
    already-existing table-level grant without breaking both live consumers
    with no replacement RPC. **Closes only when Phase C ships the
    ledger-based `registrar_recebimento_ordem_compra_fio` RPC in the same
    migration that revokes `kg_recebido` from `authenticated`.**
  - `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED` — `js/screens/fornecedor.js:461`
    (`screenFornecedorOrdens`) is a live, independent supplier-facing direct
    `UPDATE` of `kg_recebido`/`data_recebimento`/`status` on
    `ordens_compra_fio`, gated by `ocf_fornecedor_update` RLS
    (`fornecedor_id = meu_fornecedor_id()`); not mentioned in the spec's §0
    evidenced-inventory (which asserted suppliers have no existing write
    path). Flagged in the spec's provenance trail — **§0 itself is NOT
    rewritten** (the discovery is recorded here and in the ledger, not folded
    into the ratified inventory text).
  - **Phase C scope AMENDED:** the ledger-based
    `registrar_recebimento_ordem_compra_fio` RPC and rewrite must serve
    **both** live consumers — `op-writes.js`'s `registrarRecebimentoOrdemFio`
    **and** `fornecedor.js`'s `screenFornecedorOrdens` (previously scoped only
    around the admin writer) — `screenFornecedorOrdens` must be rewritten to
    call the ledger RPC instead of updating `ordens_compra_fio` directly.
  Phases `B2`/`B3`/`C`/`D`/`E` remain `NOT AUTHORIZED`, each pending its own
  order.**
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (three-dimension model: administrative cycle rascunho/emitida/cancelada,
  acceptance nao_aplicavel/pendente/aceita/rejeitada, receipt derived from a
  new physical-registration ledger; global config `ordem_compra_exige_aceite`
  with a freeze-at-emission rule; production-gate query definition for
  "Iniciar produção") was ratified following an independent read-only
  architecture review that found **one confirmed defect (Finding 1,
  corrected)** — the receipt precondition admitted a `rejeitada` order,
  contradicting the ratified "blocked until `aceita`" rule; corrected to
  `status_aceite IN ('nao_aplicavel','aceita')` in the spec's §4/§6/§7(e).
  **All 7 open decisions (a)-(g) ratified** (full detail in the spec's §11):
  notably (b) admin-accepts-on-supplier's-behalf ratified unconditionally
  (hard dependency until supplier self-service ships), and (f)
  emission-locks-quantities ratified now rather than deferred (changing it
  after Phase B would break the `emitir` RPC contract). **Two new
  implementation gaps accepted and folded into the phasing as binding
  requirements:** Phase A's migration must apply schema + legacy backfill in
  one transaction; Phase B/C must revoke direct `UPDATE` on the four
  dimension-bearing columns from `authenticated` so the `SECURITY DEFINER`
  RPCs are the sole writers (enforced invariant, not convention — the
  `ANON-GRANT-DEFENSE-IN-DEPTH` lesson). **No implementation authorized by
  ratification itself.** Phasing (A schema+config → B panel visibility → C
  receipt rework via the single shared writer → D gate activation → E
  dormant acceptance checkpoint) remains each independently authorizable —
  all phases were `NOT AUTHORIZED` at ratification, pending a separate order
  per phase (**superseded by the `ORDEM-COMPRA SPEC AMENDMENT` above: Phase B
  is now B1/B2/B3 and `B1` is authorized**).
  **Open governance item, unresolved:** no `PURCHASE-ORDER-FOUNDATION-AUDIT`
  document exists anywhere in this repo or its git history (confirmed by
  exhaustive search); the architect is retrieving the original source for
  verbatim persistence as
  `docs/reports/PURCHASE_ORDER_FOUNDATION_AUDIT_R1_2026-07-18.md`, or, if
  unrecoverable, the citation will be corrected to name the architect's
  in-chat authorization directly. Tracked separately from the ratified
  decisions above.
- **`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH` — `RESOLVED` (2026-07-18).** The
  `supabase-legacy` MCP authenticated this session; the DB half (`db/66`
  RPCs + partial ACL hardening) was already applied to staging in an earlier
  session (commit `5a2cde7`) and is now verified live (matrix re-run +
  architect visual walk — see Phase `B1` closeout above). No longer a live
  blocker.
- **Open architect decisions:** `NONE` blocking. **One non-blocking product
  decision registered (`YARN-MANTER-PEDIDO-REDUNDANCY`, 2026-07-18):** now that
  `Salvar distribuição` exists (save-only), the `Manter pedido` button — also
  save-only, seeding the pedido metrage — may be redundant; **architect to decide
  keep-or-remove.** Not a defect; if removed, foldable into a future
  `YARN-BUTTONS Phase B`. `G28-CAMADA-2` remains `TRACK
  COMPLETE / CLOSED / ACCEPTED` (full `A1-A7` + password policy). Binding launch
  constraints (key regime, launch user model, standing pre-launch items) recorded
  under "Binding decisions in force".
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`.
  **Branch:** `dev` (created 2026-07-18 from `work/g28-document-qualification`'s
  HEAD `84e2a07`, per `ORDEM-COMPRA-PHASE-A`'s branch discipline — all
  implementation work lands here going forward). **Allowed remote:**
  `production`, `dev` branch only (remote-backup push authorized by
  `ORDEM-COMPRA-PHASE-A`) — `main` remains forbidden; no push to
  `origin`/`staging` without separate express authorization.

## Binding decisions in force

Condensed statements of the rulings that constrain future work. Full recorded
decisions (verbatim) are in `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
(Architect Decision + `PROJECT-STATE-COMPACTION-B` sections) and in
`docs/archive/pt-BR/PROJECT_STATE.md`.

### Pre-migration decisions (`PROJECT-STATE-COMPACTION-B` order, 2026-07-17)

- **Key regime — new format (binding):** the new project standardizes on the
  **new-format keys** (`sb_publishable_…` + a matching secret key). No legacy
  `anon`/`service_role` JWTs. The regime is applied consistently across
  `js/config.js`, `scripts/backup/*`, `scripts/staging/*`, the Ingestor (both the
  in-repo `services/documents-ingestor/` copy and the standalone twin at
  `D:\OneDrive\Programação\Ravatex\documents-ingestor\`), and the asserting tests.
  **The secret key never appears in chat or the repo** — `supabase secrets` /
  Vercel env / GitHub Actions secrets only.
- **Launch user model — full-trust admins only (binding):** **no `somente_leitura`
  admin may be created in production** until `A2-SERVER-SIDE-ENFORCEMENT` closes.
  The constraint **is** the mitigation — the underlying risk is unchanged; exposure
  is zero **only while the constraint holds**. Consequently
  `A2-SERVER-SIDE-ENFORCEMENT` and `A2-CREATE-NIVEL-ACESSO-WIRING` rank **FIRST-WEEK**
  (not before-first-user) in the residual risk register.
- **Standing PRE-LAUNCH items (ratified from the diagnosis):** `DELETE-PROD-GUARD-A`;
  the backup trigger via **GitHub Actions** + the **`BK7` restore runbook**; and the
  **auth-restore rehearsal into a throwaway Supabase project before `M3`**. These are
  the before-first-user set the architect holds standing; the register's other
  before-first-user framings are advisory.

### Migration governance

- **`PRODUCTION-READINESS-DIAGNOSIS-R1` — `ACCEPTED` / ratified reference report
  (2026-07-17):** `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`. Its
  residual risk register (12 items) is canonical; its `M0`-`M10` plan is the active
  track. Read-only — authorizes no implementation by itself.
- **Amended publication criterion (2026-07-17 — supersedes
  `G28-GOVERNANCE-CONSOLIDATION-A`):** publication **proceeds with Camada 3 at
  `BK4.2`** (exporter proven + restore-smoke passed); remaining Camada-3 scope + the
  two ex-asterisks (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`)
  become `POST-LAUNCH DEBT` with production consequences. The reviewer objection
  (minimum pre-launch set) is **recorded and overruled** — the architect decides which
  items close before cutover. The superseded original (`both` Camada-2 and full
  Camada-3 CLOSED in staging) is preserved verbatim in the archive
  (`PROJECT-STATE-COMPACTION-B` batch); in any wording divergence, the archive wins.
- **`BACKLOG FREEZE` (2026-07-17) — `LIFTED` at `M10` (2026-07-18):** while in force,
  no NEW fronts were authorizable until after cutover; only the `M0`-`M10` plan and the
  residual register survived. Cutover (`M10`) is done, so the freeze is **lifted** and
  new fronts are authorizable again, each by its own order — see "Active phase" and the
  `POST-LAUNCH DEBT REGISTER`.
- **Canon correction (2026-07-17):** branch `work/g28-document-qualification` commit
  count was **749** at diagnosis time (not "~555"); **753** at the `M0` push
  (2026-07-17, 4 subsequent docs commits) — see `M0` record below.
- **`M0` (new repo landing) — `CLOSED / ACCEPTED` (2026-07-17, single-use push
  authorization):** full-history push, no force/tags, HEAD `7b2ab7d7aaca44edf27
  81b24eb5aeecf8ba63c50` (**753** commits) → `inttexsystem/inttracker`, branch
  mapping `work/g28-document-qualification:main`. Pre-flight: clean tree; sensitive
  paths ignored (`supabase/.temp`, `.ravatex-local`, `backups`; `.mcp.json` absent
  from the tree entirely — not a gap); tracked-file secrets sweep clean (`sb_secret`/
  `service_role`/connection-string patterns — one doc hit was a `[SENHA]` placeholder;
  the only `eyJ` hits are the pre-existing public `anon`-role keys in `js/config.js`,
  by design RLS-gated, not a secret). Destination confirmed empty before push
  (`git fetch`/`ls-remote` → no branches). Post-push: `git rev-list --left-right
  --count production/main...HEAD` = **`0 0`** (exact match). New remote `production`
  = `https://github.com/inttexsystem/inttracker.git` (fetch+push). `origin`
  (`grupoterrabranca/controle-tapetes`) and `staging`
  (`ravatexapps-dotcom/controle-tapetes-staging`) **retained, unchanged** — `staging`
  is now historical backup only, no longer a push target.
- **`M1` (new Supabase project verification + sanction) — `CLOSED / ACCEPTED`
  (2026-07-17, read-only verification + docs record):** confirmed, via the
  read-only Supabase MCP pinned to `gqmpsxkxynrjvidfmojk`, the project is virgin:
  **0 tables in `public`**, **0 rows in the migrations registry**
  (`list_migrations`), **0 storage buckets** (`storage.buckets` count and row
  listing both `0`); `auth` scaffolding present and unmodified (**23 base tables**,
  all `0` rows except `auth.schema_migrations`'s stock seed rows); `storage`
  schema carries only its own stock scaffolding (8 tables, no buckets/objects).
  **Identification evidence:** `claude mcp list` shows the configured connection
  URL as `https://mcp.supabase.com/mcp?project_ref=gqmpsxkxynrjvidfmojk&features=
  database&read_only=true` — this **directly pins both the project ref and the
  `read_only=true` flag in the MCP's own connection string**, a stronger
  confirmation than the order anticipated (the order allowed for config-plus-
  empty-profile as the only available evidence; the ref is in fact directly
  readable from the MCP configuration, not just inferred). No write attempted;
  no table/migration/bucket found — no HARD STOP triggered. **Boundary amendment
  (this order, binding):** the staging-only boundary below is **amended** —
  writes to `gqmpsxkxynrjvidfmojk` are authorized **only within explicitly
  ordered `M`-track phases** (`M2`, `M3`, `M4`, `M9`); `ucrjtfswnfdlxwtmxnoo`
  becomes **read-only legacy** (the `M3` exporter/export-read path is the
  named exception); production `bhgifjrfagkzubpyqpew` **remains PROHIBITED**,
  untouched. **Next authorizable action:** `M2`, own order.
- **`M2` (schema replay into the sanctioned target) — `CLOSED / ACCEPTED`
  (2026-07-17):** the ratified authoritative source (repo `db/`, ordered
  `db/01→db/64`, skip `*.verify.sql`; `setup_completo.sql`/`supabase db push`
  forbidden) was replayed into `gqmpsxkxynrjvidfmojk` one migration at a time via
  MCP `apply_migration`, each registered under its canonical file-stem name, verified
  after each — **64/64 applied, zero errors, no skip/patch/reorder.** **HARD STOP ZERO
  passed** (ref pinned + virgin 0/0/0 pre-state). **Post-replay gate:** (4a) registry
  = **64 entries, order `01→64`, canonical names**; (4c) ACL spot-checks faithful —
  `is_admin_full`/backup-writer RPCs (`db/64`)/evidence-writer (`db/49`) = service_role
  only, document-scan RPCs (`db/38`) = authenticated (admin-gated internally), and
  `is_admin()` broad (PUBLIC/anon/authenticated/service_role) is the **pre-existing
  `IS-ADMIN-ACL-REVIEW` debt reproduced faithfully**, not a new defect; (4d, corrected
  gate) sole residual = **`parametros_largura`=2** (width-calc **configuration** from
  `db/04`, kept by `db/10`/`db/11`) — every `db/04` **test** cadastro wiped by `db/10`
  (confirmed 0), no genuine test data survived, nothing deleted; (4e) storage buckets
  = 0. **New-project profile:** 40 public tables, 0 views, 53 functions, 67 RLS
  policies, 9 triggers. **Data-writing ruling (architect):** faithful `01→64`
  authorized, gate 4d corrected from "all 0" to "residual matches the faithful replay,
  reported per table with origin" (the classifier initially blocked the `db/04` seed;
  the architect ruled Option 1). **`M2` verification report:**
  `docs/reports/M2_SCHEMA_REPLAY_VERIFICATION_2026-07-17.md`. **Open item (4b, parity
  vs staging): NOT EXECUTABLE** — the reconnected management-scoped MCP credential is
  permission-denied on `ucrjtfswnfdlxwtmxnoo`; the parity diff must be run out-of-band
  or the token re-scoped (advisory, non-blocking). **No production access; staging
  only read-attempted for parity (denied), never written.** Next: `M3`.
- **`M3` (production data migration) — `CLOSED / ACCEPTED` (2026-07-17):** production
  data copied from legacy `ucrjtfswnfdlxwtmxnoo` into `gqmpsxkxynrjvidfmojk`.
  **Verification (re-confirmed live at closeout):** auth remap — 24 rows, single
  column (`document_scan_requests.requested_by_user_id`), all remapped to the single
  surviving admin account; FK integrity — dynamic per-constraint orphan scan, **76
  relationships checked, 0 orphans** (13 reference `auth.users` directly, all clean);
  sequence resync — **10/10** populated sequences match `MAX(id)` of their owning
  table exactly. **Exclusion set (test/synthetic data, by design):** `clientes`(2),
  `fornecedores`(1), `lotes`(8), `op_fornecedores`(2), `op_itens`(2), `ops`(6),
  `ordens_compra_fio`(8), `precos_terceirizada`(1), `usuarios`/`auth.users`(9),
  `pedidos`(3), `pedido_itens`(2), `op_eventos`(1), `document_candidates`(3) — not
  carried over; the new database is intentionally smaller than legacy, not
  incompletely migrated. **Architect ruling (a) — `usuarios_eventos` excluded
  entirely (binding):** remapping `ator_id` would fabricate audit history (actors
  who never performed those actions in the new project); legacy retains the
  original 9-row trail as the historical record, the new project's audit trail
  starts empty and truthful from cutover. Same reasoning extends to
  `document_link_revisions`/`document_link_revision_ops` (8/10 rows, also
  actor-keyed canonical history) — excluded for the identical reason. **Architect
  ruling (b) — `parametros_largura` overwritten from legacy (binding):** the `db/04`
  seed (`peso_linear` 1.5000/2.2500, `valor_x` 1.0000) is a bootstrap default; the
  legacy live-tuned configuration (`largura=1.40`→`peso_linear=0.3360`,
  `algodao_por_ml=0.226000`, `poliester_por_ml=0.110000`, `valor_x=0.5000`;
  `largura=2.10`→`peso_linear=0.5370`, `algodao_por_ml=0.366000`,
  `poliester_por_ml=0.171000`, `valor_x=0.5000`) is real operationally-tuned data by
  the same standard as `clientes`/`modelos` and supersedes the seed — applied via
  `UPDATE` against `gqmpsxkxynrjvidfmojk`, matched by `largura`, this closeout.
  **Legacy retention (binding):** `ucrjtfswnfdlxwtmxnoo` retains the original audit
  trail (`usuarios_eventos`/`document_link_revisions`/`document_link_revision_ops`)
  and the excluded test/synthetic rows above — it is the historical record for both
  and **must not be deleted or pruned without a separate, explicit architect
  decision.** Full detail: `docs/ledgers/G28_LEDGER.md` `M3-DATA` entry. **No
  production access; legacy read-only, no writes.** Next: `M4`.
- **`M8` (Documents Ingestor repoint) — `CLOSED / ACCEPTED` (2026-07-18, executed out
  of numeric sequence by direct architect order):** configuration phase — the two
  Ingestor installations (in-repo `services/documents-ingestor/` + standalone
  operational twin at `D:\OneDrive\Programação\Ravatex\documents-ingestor\`, the copy
  the `Ravatex-DocumentScanWatcher-Staging` scheduled task runs) were repointed from
  legacy `ucrjtfswnfdlxwtmxnoo` to `gqmpsxkxynrjvidfmojk`. **Surfaces changed:** both
  `.env` (URL + `PROJECT_REF` → new; `SERVICE_ROLE_KEY` → new-format `sb_secret_` key
  pasted by the architect, never seen/logged/committed by Claude; twin's Google creds
  preserved), both `Start-DocumentScanWatcher.ps1` guards (`$ExpectedProjectRef` → new,
  else the watcher self-refuses to start), both `SUPABASE_WRITER_RUNBOOK.md` (reworded
  to "Sanctioned Target Project Only", cutover-durable). Hermetic tests referencing the
  legacy ref left untouched (fixtures, `§20`). **Schema compatibility verified live**
  (read-only): every table/RPC the Ingestor writes exists in the new project with the
  right `service_role` grants. **Repoint verified by a real watcher cycle:** the
  Ingestor authenticated to the new project with the new key and all five writes landed
  (request `f3c3647e` + scan run `e9287e0e`), zero schema-cache/missing-RPC errors — but
  the Gmail scan failed at `invalid_grant` (expired Google OAuth token, 0 documents), so
  the full Gmail→Drive→DB document demonstration is **deferred**
  (`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`, gated on token refresh, tied to
  `CAMADA3-OAUTH-GRANT-COUPLING`). **Two order claims corrected against live evidence,
  both architect-withdrawn:** the named CI file `.github/workflows/ingestor-ci.yml` does
  not exist (nothing deleted); the `document_scan_runs` anon-INSERT hole
  (`PRODUCTION-SECURITY-01`) was disproven live and not registered — the real finding is
  `ANON-GRANT-DEFENSE-IN-DEPTH` (27 non-document tables, registered). **Drive/OAuth
  unchanged** (ruling #4). **No Supabase writes issued by Claude** (the watcher wrote via
  the Ingestor's own service_role key; all Claude MCP calls read-only); **no production
  access; no push.** Full detail: `docs/ledgers/G28_LEDGER.md` `M8` entry. Next: `M4`
  (or any `M5`-`M10`), plus the deferred doc-cycle verification.
- **`M4` (Edge Functions + secrets) — `CLOSED / ACCEPTED` (2026-07-18, recorded at
  `M10` closeout as an accomplished fact):** the five admin Edge Functions were
  **deployed to `gqmpsxkxynrjvidfmojk` by the architect**, with the per-function
  secrets set (new-format key regime). Deploy performed out-of-band (Supabase
  dashboard / CLI); no repo commit is the deploy artifact. Confirmed working in
  production reality (the live app exercises them). Not executed by Claude.
- **`M5` (client config repoint) — `CLOSED / ACCEPTED` (2026-07-18):** `js/config.js`
  repointed to the new project — commit `75c4ab6` ("Repoint config to new Supabase
  project"), then the **environment split restored** (commit `1e17087`, "Restore
  environment split in config") so host detection routes production vs. development
  correctly, and the environment banner fixed (commit `f369964`). New-format
  publishable key in committed config (RLS-gated, public by design). On `production/main`.
- **`M6` (Vercel wiring) — `CLOSED / ACCEPTED` (2026-07-18):** repo linked to Vercel,
  static deployment configured (commits `5416128` "Trigger first Vercel deploy",
  `aa77612` "Configure Vercel static deployment"); the app is **live and serving** at
  `inttracker-jade.vercel.app`. A **Root Directory defect** was found during wiring and
  **cleared** (the deploy now serves the repo root correctly). Executed by the architect.
- **`M7` (smoke verification) — `SUPERSEDED BY REALITY` (2026-07-18):** no separate
  scoped smoke phase was executed. It is superseded by the fact that the system is
  **live and serving in production** (`inttracker-jade.vercel.app`) — login, pedido
  load, and the admin surfaces are exercised by real use. Recorded honestly as
  not-run-as-scoped, replaced by the live-serving reality; **not** a fabricated smoke
  closeout.
- **`M9` (backup repoint + first real run) — `SUPERSEDED BY REALITY` /
  `NOT EXECUTED AS SCOPED` (2026-07-18):** the production backup mechanism (repoint
  `PG*`/`SUPABASE_*` to the new project + a first real scheduled run) was **never
  stood up**. The exporter was proven once, manually, against staging at `BK4.2`; no
  production repoint, no automated trigger, no first production run. Folded into the
  `CAMADA3 BK5-BK8` post-launch debt — see the debt register (**no proven production
  backup exists**). Recorded honestly; no fabricated run.
- **`M10` (cutover) — `CLOSED / ACCEPTED` (2026-07-18):** the primary URL is Vercel
  (`inttracker-jade.vercel.app`), the system is live against `gqmpsxkxynrjvidfmojk`
  with real use. This closeout order records the accomplished cutover, marks the
  `G28-MIGRATION-TRACK` `COMPLETE / CLOSED`, and **lifts the backlog freeze**.
  Docs-only; the cutover itself was performed by the architect.
- **Staging-only execution boundary (`STAGING-ONLY-EXECUTION-BOUNDARY-A`,
  2026-07-15, partially superseded):** operational environment is staging
  `ucrjtfswnfdlxwtmxnoo`; the protected project `bhgifjrfagkzubpyqpew` is `OUT OF
  SCOPE`, **never accessed** — this don't-touch rule stays fully in force. Its
  "Vercel not selected" / production-postponement items are **superseded** by the
  amended criterion + active `M0`-`M10` track (target = the new
  `gqmpsxkxynrjvidfmojk`, not the protected project). **Further amended by `M1`
  (2026-07-17):** `ucrjtfswnfdlxwtmxnoo` is now **read-only legacy** (writes
  authorized only for the named `M`-track phases against `gqmpsxkxynrjvidfmojk`);
  the `bhgifjrfagkzubpyqpew` don't-touch rule is unaffected. Full original in the
  archive.

### Standing product / process rulings

- **`G28-CAMADA-3` status:** at `BK4.2` — `BK4.1` (`backup_runs` schema, `d39a848`)
  and `BK4.2` (exporter, `4831ca3` + fixes; real staging run
  `ae55e714-…`, bundle `83378` bytes, restore-smoke 63/63 tables incl.
  `auth.identities=8`) both `CLOSED / ACCEPTED` in staging. Remaining subphases +
  trigger are `POST-LAUNCH DEBT`. A live `CAMADA3-OAUTH-GRANT-COUPLING` debt is
  registered (see below). Full BK narrative archived; contract at
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`G28-CAMADA-2` classification — `CLOSED / ACCEPTED`, track `COMPLETE`
  (2026-07-17):** entered classified `PRE-EXISTING PARTIAL CAPABILITY + FULL SCOPE
  A1-A7 DEFERRED` (`G28-RECONCILIATION-DECISIONS-A`); exits `CLOSED / ACCEPTED` with
  full `A1-A7` + password policy delivered. Functional reference during the build:
  `D:\OneDrive\Programação\SGAA_clean_baseline`. Full narrative archived.
- **`G28-C`:** `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING`;
  `G28-B8` `SUBSUMED BY G28-C`.
- **`PROJECT-CONTROL-BASELINE-R1` (ChatGPT):** `REJECTED / NOT RATIFIED`, superseded by
  `BACKLOG-RECONCILIATION-READONLY-R1` (the adopted reference baseline).
- **Supervision governance:** state/authorizations/phases held by Claude (chat) +
  Claude Code (resident); ChatGPT is a process consultant **without state custody or
  authority to issue orders**. `docs/governance/SUPERVISION_PROTOCOL.md` requires a
  `STRUCTURAL POLICY COMPLIANCE` section in every implementation phase report.
- **Admin password auto-reset BLOCKED (`A5.1-A5.2`):** an admin cannot reset their own
  password (`SELF_RESET_FORBIDDEN`) — they use the self-service change flow (`A4.2`).
- **User audit trail design (`A6.1`/`A6.1-B`/`A6.2`, canonical):**
  `public.usuarios_eventos` has two mutually-exclusive write paths keyed on
  `auth.uid()` — `trg_usuario_evento` (`db/60`, authenticated-admin `UPDATE`s) and the
  five admin Edge Functions (`service_role`, explicit). Both fill the `db/61` identity
  snapshot; `usuario_id` is `ON DELETE SET NULL` so events survive delete. Detail:
  `docs/DOCUMENTATION_INDEX.md` §4.
- **`UI-EL-BOOLEAN-ATTR-FIX` — OPEN active regression (register #9):** `js/ui.js`'s
  `el()` sets boolean attrs unconditionally, so `disabled`/`checked` `false` still
  render true; `admin-usuarios.js`'s Excluir button still carries the pattern
  (suspect). Not yet fixed. Full narrative archived.
- **`UI-SURFACE-DUPLICATION` — standing LESSON (registered 2026-07-18, from the
  `YARN-BUTTONS` regression saga):** UI position in an order must be specified by
  **named block/screen**, never by relative reference ("the primary button", "the
  footer"); and every UI order must require verifying **ALL surfaces that render the
  component**. This app has documented modal duplication — the Tecelagem
  distribution/acceptance UI renders on the **OP screen** (`op-nova.js`) and the
  **Pedido hub** (`pedido-detail-events.js`); before the shared-builder
  consolidation, a single-surface edit silently left the twin stale (a removed
  button kept "reappearing"). The consolidation into
  `js/screens/op-distribuicao-ui.js` (`buildDistribuicaoBlock` +
  `buildIniciarProducaoButton`, consumed by both) removed that specific
  duplication; the lesson stands for any future shared UI component.
- **`TEST-MOCK-FIDELITY-AUDIT` — `CLOSED / ACCEPTED` (2026-07-17):** zero confirmed (c)
  blind doubles; `tests/_doubles.js` `APPROVED`, `§20` added to `CODE_HEALTH_RULES.md`,
  lots `L1`/`L2` `CLOSED / ACCEPTED`. Report
  `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md`; full narrative archived.
- **Controlled Delete × document history:** physical deletion of Pedido/OP is blocked
  when canonical document history exists (`document_link_revisions`/
  `document_link_revision_ops`, append-only); permanent contract in
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`.
- **Language policy:** English for canonical docs/reports/new code + commit messages;
  pt-BR for UI text; architect orders may be issued in Portuguese, recorded in English
  (original preserved in ledger/archive); phase IDs never translated. Homes:
  `DOCUMENTATION_MODEL.md` §18, `CODE_HEALTH_RULES.md` §19, `SUPERVISION_PROTOCOL.md`
  §3; `CLAUDE.md` pointer-summary.

## POST-LAUNCH DEBT REGISTER (consolidated + ranked at `M10`, 2026-07-18)

The system is live; every item below is `POST-LAUNCH DEBT`, `NOT AUTHORIZED` until its
own order. Ranked by **production consequence** (1 = most consequential). This single
list supersedes the former "residual risk register (12 items)" and the scattered
per-entry debts; the detailed narratives for each remain in their own bullets further
down this section and in the ledger/archive.

1. **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `ACTIVE PRODUCTION BLOCKER`.** The
   Ingestor's Google OAuth token is expired (`invalid_grant`); **no documents are
   entering the live system.** Fix: refresh the token (interactive Google login —
   architect action), seed a fresh scan request, run one watcher cycle, confirm a real
   document lands with its Drive file resolving. Coupled to #7 (same OAuth client).
2. **`CAMADA3 BK5-BK8` — no proven production backup.** The exporter is manual and was
   proven only once, in staging (`BK4.2`); `M9` (production backup repoint + first real
   run) was never executed. No automated trigger, no retention, no restore runbook/drill
   against production. **A live system with no backup safety net.** Includes the former
   `CAMADA3-TRIGGER-SELECTION` (mechanism resolved: GitHub Actions).
3. **`DELETE-PROD-GUARD-A` — destructive-delete guard not deployed to production.**
   Data-loss exposure: the delete-guard for Pedido/OP was not repointed/installed on the
   live project.
4. **`A2-SERVER-SIDE-ENFORCEMENT` — privilege escalation, mitigated by a binding
   constraint.** RLS/Edge Functions key on `usuarios.tipo` only;
   `nivel_acesso='somente_leitura'` is client-side, bypassable from a `tipo='admin'`
   JWT. **Binding mitigation in force: no `somente_leitura` admin may exist in
   production until this closes** — the constraint IS the mitigation; exposure is zero
   only while it holds.
5. **`A2-CREATE-NIVEL-ACESSO-WIRING` — companion to #4.** `admin-create-user`'s fixed
   column list drops `nivel_acesso` (new admins land `completo`); needs an Edge Function
   change. Moot at launch only under #4's constraint.
6. **`ANON-GRANT-DEFENSE-IN-DEPTH` — grants/policies disagree (not a live hole).** 27
   non-document tables carry raw `anon INSERT/UPDATE/DELETE` grants, inert only because
   RLS policies evaluate false for anon. No second line of defence. Distinct from #8
   (table-grant scope vs anchor-function ACL) — not merged.
7. **`CAMADA3-OAUTH-GRANT-COUPLING` — cross-subsystem SPOF (latent).** The backup
   exporter reuses the Ingestor's OAuth client; rotating/revoking it silently breaks
   backups. Interacts directly with #1 (refreshing the token to unblock ingestion
   touches the shared grant). Decide: formalize the reuse or build a separate client.
8. **`IS-ADMIN-ACL-REVIEW` — over-broad `EXECUTE` on `public.is_admin()`** (granted to
   `PUBLIC`/`anon`/`authenticated`/`service_role`). Not a live exposure (`is_admin()` is
   false for anon); tightening touches every RLS policy that calls it. Needs its own
   read-only diagnosis.
9. **`CODE-HEALTH-AUDIT-§18-R1` — accumulated small code-health debts** (dead
   `cadastrosModalGrid` helper; `tests/auth.smoke.js` stale `<script>` regex;
   `admin-usuarios-modal.js` at 576 lines; `tec-to-acabamento-flow` 2 stale static-slice
   assertions; legacy `docs/AI_AGENT_RULES.md` review). Also tracks `UI-EL-BOOLEAN-ATTR-FIX`
   (active regression in `js/ui.js` `el()`).
10. **`TEST-MOCK-FIDELITY` — remaining lots** beyond `L1`/`L2` (audit `CLOSED`, `§20`
    added; residual lots not yet done).
11. **`UI-FIXED-FORMAT-COLUMN-WIDTHS`** — CNPJ/date/phone column wrap (cosmetic).
12. **`UI-ACTION-BUTTON` lot 3** — `cadastros.js` action-button pass (cosmetic, frozen).
13. **`MODAL-BUTTON-CSS-CHECK`** — modal button CSS review (cosmetic, frozen candidate).
14. **Two stale git-worktree registrations** (`tapetes-baseline-check`,
    `baseline-check-a34`) — prunable, auto-prune blocked by an OneDrive/AV lock;
    housekeeping only, no commit impact. Await one authorized `git worktree prune`.

**Registered for review (`M10`, read-only — do not delete):** an unaccounted branch
`v0/administrativointtex-9166-cf89b1d8` exists on the `production` remote. **Investigated
read-only:** it points at our own commit `75c4ab6` ("Repoint config to new Supabase
project"), has **zero commits not already in `production/main`** (`git rev-list
--left-right --count production/main...` = `5 0`), and is a **strict ancestor of
`main`** — i.e. an older snapshot of this same branch's history, not foreign content.
Consistent with a Vercel/v0 import artifact (a branch auto-created at the commit that was
HEAD when the repo was connected). No code review concern; safe to leave or delete at the
architect's discretion.
- **`NOT AUTHORIZED` candidate fronts (freeze `LIFTED` at `M10` — now authorizable by
  their own orders, still `NOT AUTHORIZED` until ordered):** `CODE-HEALTH-AUDIT-§18-R1`;
  `PUBLICATION-TRACK-REVIEW`; `UI-EL-BOOLEAN-ATTR-FIX` (`ACTIVE REGRESSION`, not fixed);
  `G28-D` publication (largely realized by the `M0`-`M10` cutover);
  `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` (superseded by `M0`-`M10`);
  `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-4`; `A4.3` (email/SMTP
  invites); `ORDEM-COMPRA-LIFECYCLE` Phases `B2`-`E` (spec `RATIFIED` + `AMENDED`
  2026-07-18, Phases `A` and `B1` `CLOSED / ACCEPTED`; Phases
  `B2`-`E` still `NOT AUTHORIZED` — see
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`).
  Ranked items also appear in the `POST-LAUNCH DEBT REGISTER` above.
- **`CAMADA3-TRIGGER-SELECTION` — `NOT AUTHORIZED` (`BK3`; register #3):** the
  automated-backup scheduler; mechanism resolved — **GitHub Actions, not Vercel cron**
  (the exporter shells out to `pg_dump`/`psql`). Contract:
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`CAMADA3-OAUTH-GRANT-COUPLING` — `NOT AUTHORIZED`, live debt (`BK4.2`,
  2026-07-17; register #4):** the exporter's first real run used the **Documents
  Ingestor's own OAuth client** (confirmed via Google's `tokeninfo`), not a dedicated
  grant; rotating/revoking that grant would also break backups. Decision: formalize
  the reuse (contract §4) or build a separate client. Detail:
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md` §4 amendment.
- **`CAMADA3-DRIVE-ACTIVATION` — partially exercised, `NOT AUTHORIZED` as a standing
  capability (`BK4.2`):** one real manual `google_drive` upload succeeded in staging
  (`ae55e714-…`); not yet repeated/scheduled/production-standing.
- **`A2-SERVER-SIDE-ENFORCEMENT` (#1) + `A2-CREATE-NIVEL-ACESSO-WIRING` (#5) —
  `NOT AUTHORIZED`, `POST-LAUNCH DEBT` / FIRST-WEEK:** RLS and the admin Edge
  Functions key exclusively on `usuarios.tipo`; `nivel_acesso='somente_leitura'` is
  client-side only, bypassable via direct API from a `tipo='admin'` JWT;
  `is_admin_full()` (`db/62`) exists and is unused; `admin-create-user`'s fixed
  column list drops `nivel_acesso` (new admins land `completo`; wiring needs an Edge
  Function change). **Both moot at launch** under the full-trust-admins-only
  constraint (no `somente_leitura` admin in production until #1 closes).
- **`IS-ADMIN-ACL-REVIEW` — `NOT AUTHORIZED` (registered `A2.1-B`, 2026-07-17;
  register #6):** `public.is_admin()` grants `EXECUTE` to
  `PUBLIC`/`anon`/`authenticated`/`service_role` — broader than the db/54/57
  least-privilege standard; tightening touches every RLS policy that calls it, so it
  needs its own read-only diagnosis. Not a current exposure (`is_admin()` is `false`
  for anon via `auth.uid()`).
- **`ANON-GRANT-DEFENSE-IN-DEPTH` — `NOT AUTHORIZED`, first-week debt (registered
  `M8`, 2026-07-18):** in `gqmpsxkxynrjvidfmojk` (verified live, read-only), **27
  non-document `public` tables** carry raw table-level `anon`
  `INSERT`/`UPDATE`/`DELETE` grants (`clientes`, `cores`, `entregas`, `entrega_itens`,
  `expedicoes`, `expedicao_itens`, `expedicao_movimentos`, `expedicao_movimento_itens`,
  `fornecedores`, `lotes`, `modelos`, `op_eventos`, `op_fornecedores`, `op_itens`,
  `op_latex_entregas`, `op_numeros`, `ops`, `ordens_compra_fio`, `parametros_largura`,
  `pedidos`, `pedido_itens`, `pedido_cliente_eventos`, `pedido_eventos`,
  `pedido_parciais`, `pedido_parcial_itens`, `precos_terceirizada`, `saldo_fios`,
  `saldo_fios_op`, `usuarios` — RLS enabled on all). **Not a live hole:** every write
  is blocked today because the effective policies gate on
  `is_admin()`/`meu_fornecedor_id()`/`meu_cliente_id()`, all of which evaluate
  false/null for an unauthenticated `anon` session. The defect is that grants and
  policies disagree: a table whose safety rests entirely on policy correctness has no
  second line of defence — a future policy edit that widens a `USING`/`WITH CHECK`
  clause would immediately become an anon write path. **Pre-existing, faithfully
  migrated** from the `db/*` grant statements (same origin as the schema replay), not
  introduced by any `M`-track phase. Fix (its own future order): revoke the anon DML
  grants so grants agree with policies; verify the admin/cliente/fornecedor RLS paths
  still function. **Related to but distinct from `IS-ADMIN-ACL-REVIEW`** (that concerns
  the `is_admin()` anchor function's own `EXECUTE` ACL; this concerns table-level DML
  grants) — cross-referenced, **not merged**. The `document_*` family does **not**
  share this shape (checked: RLS on, `is_admin()`-gated, zero anon grants), so there is
  no document-side sibling. Discovered during the `M8` sibling sweep after the
  originally-suspected `document_scan_runs` anon-INSERT premise was disproven live
  (that premise was withdrawn; `PRODUCTION-SECURITY-01` was not registered).
- **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — `NOT AUTHORIZED`, follow-up (registered
  `M8`, 2026-07-18):** `M8` proved the Ingestor repoint at the Supabase layer (new
  `sb_secret_` key auth + schema compatibility + five real writes landed in
  `gqmpsxkxynrjvidfmojk` — request `f3c3647e` + scan run `e9287e0e`, both finalized
  `failed`), but the full Gmail→Drive→DB document cycle did **not** complete: the real
  scan failed at `invalid_grant` (expired Google OAuth token, 0 documents). Deferred
  by architect decision (M8 close, 2026-07-18). To close: refresh the Google OAuth
  token (interactive login — architect action, coupled to
  `CAMADA3-OAUTH-GRANT-COUPLING`, same client the backup exporter reuses), seed one
  fresh `document_scan_requests` row (the migrated one was consumed as `failed` during
  verification), run the watcher once, and confirm a real document lands with its Drive
  file resolving. Tie to `CAMADA3-OAUTH-GRANT-COUPLING`.
- **Small code-health debts (frozen, folded into `CODE-HEALTH-AUDIT-§18-R1`):**
  `cadastrosModalGrid` dead helper; `tests/auth.smoke.js` outdated `<script>` regex
  (6 tests); `admin-usuarios-modal.js` at 576 lines; `tec-to-acabamento-flow`'s 2
  stale static-slice assertions; legacy `docs/AI_AGENT_RULES.md` review.
- **Stale git-worktree registrations (2, `NOT AUTHORIZED` cleanup):**
  `tapetes-baseline-check` + `baseline-check-a34` (missing `gitdir`, prunable;
  auto-prune blocked by an OneDrive/AV `Permission denied` lock — harmless, no commit
  impact). Await one authorized `git worktree prune`.
- **Open non-blocking debts:** `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`/`…_BLOCKED_BY_TOOLING`;
  `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` (applied+verified in staging, no
  drift); production application of the staging-only stack (`db/12`/`21`/`30`/`49`–`57`).
- **UI tracks — `CLOSED / ACCEPTED` in their authorized scope, full narratives
  archived:** `UI-ACTION-BUTTON` (phases i/ii, lots 1/2 + `UI-USERS-GRID-TEXT-
  OVERFLOW`; lot 3 `cadastros.js` frozen; frozen candidates `MODAL-BUTTON-CSS-CHECK`,
  `fornecedor.js` redesign) and `UI-GRID-TEXT-OVERFLOW` (contract + helper + Lots
  A/B/C; frozen candidate `UI-FIXED-FORMAT-COLUMN-WIDTHS` — §7 CNPJ/date/phone column
  wrap; `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` already `CLOSED / ACCEPTED`, `90726dd`).
- **Test baseline (RESOLVED, historical):** the "~87 / 11 failures" figures were
  stale artifacts (fixed-port `:8765` + removed inline `<script>` assertions), fixed
  by `L2` (`2c9a4c2`). Full note archived.

## Environment and worktree standing facts

- **PRODUCTION (live since `M10`, 2026-07-18):** Supabase `gqmpsxkxynrjvidfmojk`
  ("Inttex"), served by **Vercel at `inttracker-jade.vercel.app`** from
  `inttexsystem/inttracker` (`main`). Schema (`db/01→64`), migrated data, deployed Edge
  Functions, repointed `js/config.js`, and the repointed Ingestor are all in place.
- **DEVELOPMENT / legacy:** `ucrjtfswnfdlxwtmxnoo` — **retained, now the development
  database** (formerly "staging"; the historical record for the excluded audit
  trails/test rows per `M3`). **Protected/other:** `bhgifjrfagkzubpyqpew` remains
  `PROHIBITED` and **unused — never accessed** in this entire chain.
- **Migration path (all phases recorded under "Migration governance"):** `M0` full-history
  push; `M2` schema replay (64 registry entries, 40 public tables / 53 functions / 67
  policies / 9 triggers / 0 views / 0 buckets); `M3` data migration (auth remap 24
  rows/1 column, FK 76/76 clean, sequences 10/10, `parametros_largura` from legacy);
  `M4` Edge Functions deployed; `M5` `js/config.js` repointed + environment split
  restored (`75c4ab6`/`1e17087`/`f369964`); `M6` Vercel static deploy live
  (`5416128`/`aa77612`, Root Directory defect cleared); `M8` Ingestor repointed;
  `M10` cutover. `M7`/`M9` `SUPERSEDED BY REALITY`. **Supabase MCP:** still
  management-scoped/write-capable from `M2`/`M3` — **standing reminder: flip back to
  read-only.**
- **Remotes:** `production` = `https://github.com/inttexsystem/inttracker.git`
  (fetch+push, added at `M0`); `origin` = `grupoterrabranca/controle-tapetes`;
  `staging` = `ravatexapps-dotcom/controle-tapetes-staging` (historical backup only,
  no longer a push target). All three present on the local repo; no branch other than
  `main` pushed to `production`.
- **MCP (new project):** Supabase MCP is configured and verified against
  `gqmpsxkxynrjvidfmojk`, **read-only**, its token held **outside the repo**
  (`PROJECT-STATE-COMPACTION-B`, 2026-07-17). **`M1` confirmed directly** (not just
  by profile inference): `claude mcp list` reports the connection URL
  `https://mcp.supabase.com/mcp?project_ref=gqmpsxkxynrjvidfmojk&features=database&
  read_only=true`, pinning both the ref and the read-only flag in the MCP's own
  configuration string. Read-only introspection of the new project is available;
  no write path is authorized outside a specific `M2`-`M10` order.
- **Publication provider:** **Vercel — LIVE** (`inttracker-jade.vercel.app`) since the
  `M10` cutover (2026-07-18). GitHub Pages is no longer the production provider.
- **Branch commit count:** `work/g28-document-qualification` = **753** commits
  (749 at diagnosis time + 4 docs commits; pushed to `production/main` at `M0`).
- **Migrations 49 and 50 (and the staging-only stack):** applied and verified in
  staging; not applied in production by this chain.
- **Worktree topology:** `controle-tapetes-g28` is a linked worktree of
  `controle-tapetes/.git` (alongside `-g27`, `-controlled-delete-gate`, and main
  `work/app-next` — divergent from `staging/work/app-next` and dirty). Two stale
  registrations remain (see "Live debts").
- **Push:** the `M0` push to `production` (2026-07-17) was a single-use explicit
  authorization for that order only; no further push is authorized by it. Push to
  `origin`/`staging` remains not authorized in this chain. **Production Supabase
  `bhgifjrfagkzubpyqpew`:** never accessed.
- **`supabase/.temp/`:** local Supabase CLI cache, **gitignored** since commit
  `be6f081` (was leaking the project ref + pooler URL).

## Closed phases

Full closeout narratives are archived, verbatim, in
`docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (compaction A + B batches, same
order as below) and in `docs/ledgers/G28_LEDGER.md`. Commit SHAs are the accepted
technical commits; documentation-only phases show `(docs)`. Consult HEAD with
`git rev-parse HEAD`.

| Phase | Status | Date | Commit(s) |
|---|---|---|---|
| Purchase Order Lifecycle — `ORDEM-COMPRA-LIFECYCLE` Phase `B1` (OP reader + `emitir`/`cancelar` RPCs + partial ACL, `db/66`; UI-result-check fix for both handlers; supplier-assignment decision ratified: per-order, moves to `B2`, `op_fornecedores` kept as compatibility projection, reassignment-after-`emitida` blocked; debts registered: `KG-RECEBIDO-ACL-GAP`, `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED`, Phase C scope amended) | `CLOSED / ACCEPTED` | 2026-07-18 | `5a2cde7` (RPCs), `b0c3f27` (UI reader), `275ede2` (UI-result-check fix) — branch `dev` — + docs record |
| Yarn Buttons — `YARN-BUTTONS-PHASE-1` (+ corrections) — shared distribution builder (`op-distribuicao-ui.js`) consumed by OP screen + Pedido hub; footer = `[Manter pedido, Salvar distribuição]` save-only, `Iniciar produção` = only production-start; `Aceitar proposta` + dead `aplicarRecalculo` removed | `CLOSED / ACCEPTED` | 2026-07-18 | `02679f9`, `2388d39` (technical, branch `dev`) + docs record |
| Purchase Order Spec Amendment — `ORDEM-COMPRA SPEC AMENDMENT` (docs-only Part 1: §6 UI surface → three surfaces + reader/writer separation; §8 Phase B → B1/B2/B3; receipt entry point = order detail screen) | `CLOSED / ACCEPTED` | 2026-07-18 | (docs: "Amend purchase order spec: receipt lives on the order", branch `dev`) |
| Purchase Order Lifecycle — `ORDEM-COMPRA-LIFECYCLE` Phase `A` (schema + config: dimension columns, ledger/events/config tables, legacy backfill, 14/14 verification matrix) | `CLOSED / ACCEPTED` | 2026-07-18 | `fb0e6cb` (technical, branch `dev`) + docs record |
| Purchase Order Lifecycle Spec Ratification — `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1` (Finding 1 corrected, decisions a-g ratified, phases `A`-`E` still `NOT AUTHORIZED`) | `RATIFIED` | 2026-07-18 | (docs: "Ratify purchase order lifecycle spec") |
| Purchase Order Lifecycle Spec — `ORDEM-COMPRA-SPEC` (docs-only, spec delivered `PROPOSED`) | `SPEC DELIVERED` | 2026-07-18 | (docs: "Add purchase order lifecycle spec") |
| Migration Track Closeout — `M10` cutover; `G28-MIGRATION-TRACK` COMPLETE, backlog freeze LIFTED | `CLOSED / ACCEPTED` | 2026-07-18 | (docs: "Close migration track and lift backlog freeze") |
| Cutover — `M10` (live at `inttracker-jade.vercel.app` against `gqmpsxkxynrjvidfmojk`) | `CLOSED / ACCEPTED` | 2026-07-18 | (architect out-of-band; recorded at closeout) |
| Vercel Wiring — `M6` (static deploy live; Root Directory defect cleared) | `CLOSED / ACCEPTED` | 2026-07-18 | `5416128`, `aa77612` |
| Client Config Repoint — `M5` (`js/config.js` → new project + env split restored) | `CLOSED / ACCEPTED` | 2026-07-18 | `75c4ab6`, `1e17087`, `f369964` |
| Edge Functions + Secrets — `M4` (five admin functions deployed by architect) | `CLOSED / ACCEPTED` | 2026-07-18 | (architect out-of-band deploy; no repo artifact) |
| Smoke Verification — `M7` | `SUPERSEDED BY REALITY` | 2026-07-18 | (live-serving = de-facto smoke; no scoped phase run) |
| Backup Repoint + First Real Run — `M9` | `SUPERSEDED BY REALITY` | 2026-07-18 | (not stood up; folded into `CAMADA3 BK5-BK8` debt) |
| Documents Ingestor Repoint — `M8` (legacy `ucrjtfswnfdlxwtmxnoo` → `gqmpsxkxynrjvidfmojk`; config only, out of sequence) | `CLOSED / ACCEPTED` | 2026-07-18 | (config: 2×`.env` gitignored + 2×`.ps1` + 2×runbook; docs record) |
| Production Data Migration — `M3` (legacy `ucrjtfswnfdlxwtmxnoo` → `gqmpsxkxynrjvidfmojk` + `parametros_largura` overwrite) | `CLOSED / ACCEPTED` | 2026-07-17 | (Supabase writes: data migration + `parametros_largura` UPDATE + docs record) |
| Schema Replay into Sanctioned Target — `M2` (`db/01→64` → `gqmpsxkxynrjvidfmojk`) | `CLOSED / ACCEPTED` | 2026-07-17 | (Supabase writes: 64 migrations + docs record) |
| Supabase Target Verification + Sanction — `M1` (`gqmpsxkxynrjvidfmojk`) | `CLOSED / ACCEPTED` | 2026-07-17 | (docs, read-only verification) |
| Repository Migration — `M0` (push to `inttexsystem/inttracker`) | `CLOSED / ACCEPTED` | 2026-07-17 | `7b2ab7d` pushed (git-only) + record commit |
| Ratify Production Readiness Diagnosis + Backlog Freeze — `PRODUCTION-READINESS-DIAGNOSIS-R1` (ratification) | `CLOSED / ACCEPTED` | 2026-07-17 | `be6f081`, `9566837` (docs) |
| Production Readiness Diagnosis (read-only) — `PRODUCTION-READINESS-DIAGNOSIS-R1` | `ACCEPTED` | 2026-07-17 | (report) |
| Camada 3 — Exporter First Real Run + Restore-Smoke — `BK4.2` | `CLOSED / ACCEPTED` | 2026-07-17 | `4831ca3`, `75f8ff9`, `153b2a2`, `51c4633`, `e11d05e` |
| Camada 3 — Backup Runs Schema — `BK4.1` | `CLOSED / ACCEPTED` | 2026-07-17 | `d39a848` |
| Camada 3 — Backup Diagnosis (read-only) + Backup Contract — `G28-CAMADA-3-DIAGNOSIS-R1` + `BK3` | `CLOSED / ACCEPTED` | 2026-07-17 | (docs) |
| Camada 2 — Legacy User Screen Removal — `A3.4` (closes `G28-CAMADA-2` track) | `CLOSED / ACCEPTED` | 2026-07-17 | `32e466a` |
| Camada 2 — Admin Access Level Modal Wiring + Pilot Enforcement — `A2.2` + `A2.3` | `CLOSED / ACCEPTED` | 2026-07-17 | `09eb2a0` |
| Camada 2 — Admin Access Level Schema + ACL Correction — `A2.1` + `A2.1-B` | `CLOSED / ACCEPTED` | 2026-07-17 | `f108c45` |
| Test-Double Shared Module + Stale-Assertion Cleanup — `L1` + `L2` | `CLOSED / ACCEPTED` | 2026-07-17 | `54ee8aa`,`4d2f304`,`520c9a6`,`2c9a4c2` |
| Test Mock Fidelity Audit (read-only) — `TEST-MOCK-FIDELITY-AUDIT` | `CLOSED / ACCEPTED` | 2026-07-17 | (docs) |
| Admin Edge Function Response Envelope Fix — `UI-INVOKE-ENVELOPE-FIX` | `CLOSED / ACCEPTED` | 2026-07-17 | `7b37e8e` |
| Camada 2 — User Audit Panel (read-only) — `A6.3` | `CLOSED / ACCEPTED` | 2026-07-17 | `e31f269` |
| Camada 2 — Audit Trail Wiring (Edge Functions) — `A6.2` | `CLOSED / ACCEPTED` | 2026-07-17 | `b67b126`, `7309349` |
| **2026-07-16 phases (16, collapsed) — see ledger/archive:** `A6.1`/`A6.1-B`, `A4.1`/`A4.2`, `A5.1-A5.2`/`A5.3-A5.4`, `CAMADA2-LAST-ACCESS-UI`, `UI-ACTION-BUTTON` i/ii + lots 1/2 + `UI-USERS-GRID-TEXT-OVERFLOW`, `UI-GRID-TEXT-OVERFLOW`, `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX`, `DOC-LANGUAGE-MIGRATION-L1` | `CLOSED / ACCEPTED` | 2026-07-16 | `ee0e77b`,`fa8e1b9`,`bf0d522`,`c6289f8`,`6c624ef`,`0aff22f`,`b726717`,`f886e26`,`bbfd58c`,`31b66af`,`abfb95e`,`3e95e86`,`0a1457b`,`cfa8b4b`,`90726dd`,`cab741c`,`ce4b693` |
| **2026-07-15 & earlier phases (13, collapsed) — see ledger/archive:** `CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1` (`PROPOSED`), `A3.1`/`A3.2`, governance decisions `G28-GOVERNANCE-CONSOLIDATION-A` (superseded 2026-07-17) / `STAGING-ONLY-EXECUTION-BOUNDARY-A` (amended) / `G28-RECONCILIATION-DECISIONS-A`, `G28-C` (`TECHNICALLY ACCEPTED`), Controlled Delete × Document History, Static Residue Expedição, Client Portal read-model + ACL grants, docs consistency (`DOCS-CANONICAL-CONSISTENCY-BACKFILL-A`, `DOCS-PEDIDO-OP-LEGACY-PLAN-STATUS-CONSISTENCY-R1`) | mixed `CLOSED / ACCEPTED` | 2026-07-15 / 2026-07 | `4f01101`,`b4a6238`,`3198570`,`271761c`,`edaf0b4`,`707a37b`,`7978e0a`,`82f5ba7` (+ docs/verification-only) |

> `DOC-LANGUAGE-MIGRATION-L2` (`632f103`), `PROJECT-STATE-COMPACTION-A` and
> `PROJECT-STATE-COMPACTION-B` (this phase) are recorded in
> `docs/ledgers/G28_LEDGER.md`, not as blocks here.

## Relevant standing debts (Documents front)

- Migrations 49 and 50 — applied and verified in staging; not applied in production
  by this chain.
- Later UI/runtime evolutions, the destination of the legacy RPC and any linking/
  revocation require a new architectural decision.
- Push — not authorized in this chain.

## Mandatory links

- Purchase order lifecycle spec (`RATIFIED`, phases `NOT AUTHORIZED`):
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
- Documentation governance model: `docs/governance/DOCUMENTATION_MODEL.md`
- Documentation authority arbiter: `docs/DOCUMENTATION_INDEX.md`
- Migration diagnosis (active track): `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`
- Backup contract: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`
- G28 master plan: `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Pedido/OP/Movimentação/Documentos plan: `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Ingestor local state (technical context): `services/documents-ingestor/PROJECT_STATE.md`
- Closed-phase closeouts (archive): `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`

## Historical reference

- Pre-model preservation: `docs/legacy/pre-model/MANIFEST.md`
- G28 front ledger: `docs/ledgers/G28_LEDGER.md`
- Archived PROJECT_STATE closeouts (2026-07): `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`
- pt-BR pre-translation original: `docs/archive/pt-BR/PROJECT_STATE.md`

The complete historical content that existed in this file before the first
compaction was preserved, byte for byte, in
`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md` (integrity manifest
`docs/legacy/pre-model/MANIFEST.md`; snapshot origin commit
`08b9af5e251de48e938600e5e4b4214e4d1e824e`; SHA-256
`7cacddd59c5b2fe9bae1add1a54a3433c370ccdad713bbd4010a1d11f1b39a98`). That snapshot
is not a source of current state and must not be edited nor receive new closeouts.
