<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0008 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0150..G28-LEDGER-UNIT-0158 -->
<!-- canonical_byte_interval: 673744..740608 -->
<!-- canonical_line_interval: 5692..6642 -->
<!-- payload_sha256: 2e0a30ae15203d7a689503fe97eeb0bf1730d3014a8a7616f67db3463d1e4d1c -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-20 — PHASE-C3C-B APPLICATION-ADAPTER IMPLEMENTATION — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** PHASE-C3C-B application-compatibility/adaptation local
  implementation, authorized in a single pass with the governing forward
  correction that activated it (§39 of
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`,
  supervisor acceptance of the applied `db/75`+`db/76` development-database
  stack; §32 of `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`,
  corrected application RPC targets/inactive signals/error matrix/idempotency
  lifecycle). Two commits: the authorization/forward-correction checkpoint,
  then this implementation.
- **Entry checkpoint:** branch `dev`, HEAD
  `6cd70d7503f7f020b5c948c96fef0b095b0f1211`, preserved residue modified
  `.gitignore` only (plus the untracked `.mcp.json`, never staged).
- **Authorization commit:** `07fb4903eda67ac5e570ca505e09185b688b5277`
  (`docs: authorize C3C-B application adaptation`) — appended §39/§32,
  activated `ACTIVE_PHASE: PHASE-C3C-B` in `PROJECT_STATE.md`. No product,
  test, or `db/*.sql` file touched by that commit.
- **Implementation (this commit):** new shared adapter
  `js/screens/ordem-compra-receipt-cutover.js` (pure, no DOM, no rendering;
  knows only `public.listar_ordens_compra_fio_compat` and
  `public.registrar_recebimento_ordem_compra_fio_compat`, their inactive
  signals `listar_compat_inativo`/`recebimento_compat_inativo`, the bounded
  `42883` interval, and the fail-closed code set). Call-sites adapted:
  `js/screens/op-writes.js` (`registrarRecebimentoOrdemFio` attempts the
  canonical writer first, falls back to the byte-identical flat `UPDATE`),
  `js/screens/fornecedor.js` (independent reader+writer, not routed through
  `op-writes.js`; `decremento_exige_admin` fails closed),
  `js/screens/pedido-detail-data.js` (reader scoped by `p_pedido_id`,
  `state.ordensFio` shape preserved), `js/screens/op-nova.js` (minimal
  wiring only, frozen-exception file, `fetchOrdensCompraFio` scoped by
  `p_op_id`), `js/screens/op-persistir.js` and `js/screens/op-recalculo.js`
  (defensive `legacy_receipt_fenced` clear-error handling only, no bridge/
  mapping/canonical write added). `js/screens/pedido-detail-events.js` and
  `js/delete-helpers.js` required no change (writer already reaches
  `op-writes.js`; label-only reference respectively) — verification-only, as
  contracted. `index.html` changed by exactly one added `<script>` line.
- **No-new-UI proof:** `js/router.js`/`js/boot.js` byte-unchanged; every
  adapted call-site keeps its exact existing inputs/outputs/rendering; the
  only new branch is an internal state-check-then-fallback that is
  unreachable in observable behavior while `legacy_active` (the permanent
  state through this entire phase).
- **Idempotency lifecycle:** `createReceiptAttempt()` mints one token per
  user-initiated submission; the returned attempt object is reused verbatim
  across retries of that same attempt; a genuinely new submission calls
  `createReceiptAttempt()` again; the token is never derived from date,
  timestamp, order id, or quantity — proved in
  `tests/ordem-compra-receipt-cutover.smoke.js` (same-attempt-retry reuse,
  new-attempt distinct token, same-date-distinct-submissions distinct token).
- **Tests:** eight authorized test files, one new
  (`tests/ordem-compra-receipt-cutover.smoke.js`, 29/29) plus additions to
  `tests/op-writes.smoke.js`, `tests/fornecedor-screens.smoke.js`,
  `tests/pedido-detail.smoke.js`, `tests/op-nova.smoke.js`,
  `tests/op-recalculo.smoke.js`, `tests/op-persistir.smoke.js`;
  `tests/controlled-delete.smoke.js` verification-only, unmodified. Every
  fail-closed code (`sem_permissao`, `estado_invalido`,
  `mapeamento_compat_ausente`, `decremento_exige_admin`,
  `reducao_abaixo_saldo_importado`, `excede_estornavel`,
  `kg_absoluto_invalido`, `idempotencia_conflitante`, `erro_interno`, every
  unrecognized response) proved never to fall back; canonical success proved
  to never issue the flat mutation; inactive/bounded-42883 fallback proved to
  perform exactly one byte-identical flat mutation.
- **Validation:** `node --check` clean on every touched/new file; full
  mandatory Node suite (`node --test "tests/**/*.js"`) — 3960 tests, 3836
  pass, 124 fail, and the failing-test-name set is byte-for-byte identical to
  the pre-phase baseline (`git stash` comparison) — zero regressions
  introduced; `node scripts/validate-spec-custody.mjs` PASS; `git diff
  --check` / `git diff --cached --check` clean. 124 baseline failures are
  pre-existing, unrelated debt (documented code-health gaps in
  `js/screens/op-nova.js`/`js/screens/painel.js` ADMIN_MENU counts, and
  `ECONNREFUSED 127.0.0.1:8765` in `write-guard.smoke.js`-family tests that
  require a running local static server) — not caused by, and not repaired
  by, this phase.
- **Findings:** `js/screens/fornecedor.js` was already 536 lines (over the
  `CODE_HEALTH_RULES.md` §7 500-line acceptable ceiling, already in the
  900-line exceptional tier) before this phase; this phase adds 47 lines
  (independent reader+writer adapter block), ending at 583 — no new tier
  boundary crossed by this phase, but flagged for transparency; splitting
  `fornecedor.js` is out of scope (would mix refactor with this
  compatibility-adaptation phase, `CODE_HEALTH_RULES.md` §14).
  `js/screens/op-nova.js` grew by 17 lines (1476→1493, minimal wiring only,
  frozen exception preserved). `js/screens/pedido-detail-events.js` did not
  grow (2691→2691, unchanged, per contract §7 row 6).
- **Residual debts (carried forward, unchanged):**
  `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`,
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, the adapters'
  canonical-branch code paths remain unverified against a live
  `canonical_active` state (C3D/real-cutover territory), and
  `op-recalculo.js`'s saldo-write path has no canonical RPC replacement
  (DB-fence-only disablement, per contract §7 row 10/§10.3).
- **Files materially changed (product + tests):** `index.html`;
  `js/screens/ordem-compra-receipt-cutover.js` (new);
  `js/screens/op-writes.js`; `js/screens/fornecedor.js`;
  `js/screens/pedido-detail-data.js`; `js/screens/op-nova.js`;
  `js/screens/op-persistir.js`; `js/screens/op-recalculo.js`;
  `tests/ordem-compra-receipt-cutover.smoke.js` (new);
  `tests/op-writes.smoke.js`; `tests/fornecedor-screens.smoke.js`;
  `tests/pedido-detail.smoke.js`; `tests/op-nova.smoke.js`;
  `tests/op-recalculo.smoke.js`; `tests/op-persistir.smoke.js`.
- **Files materially changed (documentation, this closeout):**
  `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (implementation
  closeout appended, top `STATUS` marker updated);
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`; this ledger. No
  `db/*.sql`, CSS, router, boot, package, CI, tooling, or MCP file modified;
  `.gitignore` and `.mcp.json` excluded from the commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ`
  (unchanged — this closeout records implementation, not supervisor
  acceptance, of `PHASE-C3C-B`). `ACTIVE_PHASE: NONE`.
  `ACTIVE_PHASE_CONTRACT: NONE`. `PHASE-C3C-B: IMPLEMENTED / LOCALLY
  VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`. No dependent `OC-C3-*`
  requirement is `SATISFIED`.
- **Exact accounting subject:** `feat: adapt legacy purchase-order receipts
  for cutover`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review/acceptance of this
  `PHASE-C3C-B` application-adapter implementation. Only after that
  acceptance does staging validation/application of `db/76`, C3D, cutover,
  C4, C5, production access, or any further push beyond the one authorized
  `staging/dev` fast-forward become authorizable.

## 2026-07-20 — PHASE-C3C-B SUPERVISOR-REVIEW CORRECTION — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** targeted correction of `PHASE-C3C-B` following supervisor
  verdict `CHANGES_REQUIRED` on the implementation and push at commit
  `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §34). Two
  blocking defects, both within the already-authorized `PHASE-C3C-B` scope;
  no new phase, no C3D, no database/environment action.
- **Entry checkpoint:** branch `dev`, HEAD `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`,
  remote `staging/dev` equal, preserved residue modified `.gitignore` only
  (plus untracked `.mcp.json`, never staged).
- **Blocking defect 1 (idempotency retention):** real receipt UI closures
  (`op-writes.js`, `fornecedor.js`, `op-nova.js`, `pedido-detail-events.js`)
  created a new idempotency attempt on every invocation instead of a real UI
  closure owning and retaining one across a retry of unchanged intent.
  Corrected via a new `createAttemptTracker()` in
  `js/screens/ordem-compra-receipt-cutover.js` (intent-aware retention: same
  intent + a prior ambiguous transport failure reuses the token; a changed
  field or any deterministic outcome mints a new one; token remains random,
  intent is used only to decide reuse); `registrarRecebimentoOrdemFio` now
  accepts a caller-owned `attempt` and reports `ambiguous` in its return
  shape; all four real call-sites now own and pass their tracker.
- **Blocking defect 2 (exact 42883):** `isMissingCompatFunction` accepted a
  message-text alternative beyond the contracted exact `42883` SQLSTATE.
  Corrected to `error.code === '42883'` only.
- **Files changed (product):** `js/screens/ordem-compra-receipt-cutover.js`
  (179→257), `js/screens/op-writes.js` (133→155), `js/screens/fornecedor.js`
  (583→599), `js/screens/op-nova.js` (1493→1511),
  `js/screens/pedido-detail-events.js` (2691→2709 — this file's first growth
  under `PHASE-C3C-B`, explicitly authorized by the correction order for
  this narrow purpose only). No other product path touched.
- **Files changed (tests):** `tests/ordem-compra-receipt-cutover.smoke.js`,
  `tests/op-writes.smoke.js`, `tests/op-nova.smoke.js`,
  `tests/fornecedor-screens.smoke.js`, `tests/pedido-detail.smoke.js` (the
  last one statically only — no runtime harness exists for
  `openMovementModal`'s bespoke overlay in this suite). No other test file
  touched.
- **Validation:** `node --check` clean on all corrected files;
  `node --test` on each corrected/new test file passes except the same
  pre-existing, unrelated failures already on record; full mandatory Node
  suite (`node --test "tests/**/*.js"`) — 3985 tests (+25 from this
  correction's own tests), 3863 pass, 122 fail — the 122 failing names are a
  strict **subset** of the prior 124-name baseline (two incidental fixes of
  pre-existing CRLF-unaware regex assertions in
  `tests/pedido-detail.smoke.js` that shared a string this correction's own
  test edit also touched — disclosed, not hidden, not an intentional scope
  change) — **zero regressions attributable to this correction**;
  `node scripts/validate-spec-custody.mjs` PASS; `git diff --check` /
  `git diff --cached --check` clean.
- **Findings:** none new; residual debts carried forward unchanged from the
  prior closeout, plus one new disclosed item — `pedido-detail-events.js`'s
  retry behavior is proven statically, not via a real runtime click (no
  existing harness for its bespoke modal), while the identical underlying
  mechanism is fully runtime-proven at the other two real call-sites and at
  the adapter level.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ`
  (unchanged). `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`.
  `PHASE-C3C-B: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE` — unchanged; this correction does **not** record supervisor
  acceptance. No dependent `OC-C3-*` requirement is `SATISFIED`.
- **Exact accounting subject:** `fix: preserve C3C-B receipt idempotency
  attempts`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review/acceptance of this
  corrected `PHASE-C3C-B` application-adapter implementation. Deployment,
  activation, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C3D, C4, C5, production access, `main`,
  and `origin`/`production` remote mutation remain unauthorized; one
  fast-forward push to `staging/dev` records this closeout.

## 2026-07-20 — PHASE-C3C-B FINAL TARGETED CORRECTION — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** "FINAL TARGETED PHASE-C3C-B CORRECTION", issued against local
  commit `f9b1a54cc7b185a5e72f50209322d1473e93e850` (not yet pushed at order
  time; expected remote `staging/dev`
  `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`). Two gates, both within the
  already-authorized `PHASE-C3C-B` scope; no new phase, no C3D, no
  database/environment action.
  (`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §35.)
- **Entry checkpoint:** branch `dev`, HEAD `f9b1a54cc7b185a5e72f50209322d147
  3e93e850`, preserved residue modified `.gitignore` only (plus untracked
  `.mcp.json`, never staged).
- **Gate 1 (finite RPC-error classification):** §34's "any RPC-call-level
  error except exact `42883` ⇒ `ambiguous_failure`" rule was overbroad.
  Replaced with a finite predicate grounded in the real
  `@supabase/postgrest-js` response shape (verified against the vendored
  copy in `services/documents-ingestor/node_modules/`): `status === 0` is
  the only signal produced by `PostgrestBuilder.then()`'s own fetch-rejection
  `.catch()` handler (network failure, DNS failure, timeout, abort, CORS) —
  every deterministic server response, success or error, carries a real HTTP
  status. `isTransportAmbiguous(res)` now checks `!!res.error && res.status
  === 0` exactly; every other error (permission `42501`, data `22P02`,
  PGRST-prefixed, or any other received response) is `hard_failure`.
- **Gate 2 (runtime proof for `pedido-detail-events.js`):** the prior
  static-only proof (§34.7/§34.9's disclosed debt) was supplemented with a
  real DOM-click + stateful-mock runtime proof: `makeHubRuntime()` in
  `tests/pedido-detail.smoke.js` now also loads the real adapter and the
  real `js/screens/op-writes.js`, and two new tests drive
  `handlers.openMovementModal(...)`'s real "Registrar recebimento" button
  through seven real clicks (token retention/renewal across ambiguous/
  deterministic outcomes, zero flat writes) plus one dedicated inactive-
  signal test (exactly one flat write). No product-code extraction was
  needed; the order's fallback-of-last-resort was not used.
- **Files changed (product):** `js/screens/ordem-compra-receipt-cutover.js`
  (257→298 lines) only. No other product path required a change for either
  gate.
- **Files changed (tests):** `tests/ordem-compra-receipt-cutover.smoke.js`
  (366→475), `tests/op-writes.smoke.js` (1194→1196),
  `tests/fornecedor-screens.smoke.js` (1296→1296, net-zero fixture-shape
  correction), `tests/op-nova.smoke.js` (1878→1878, net-zero fixture-shape
  correction), `tests/pedido-detail.smoke.js` (3034→3279, runtime-harness
  extension + two new runtime tests). No other test file touched.
- **Validation:** `node --check` clean on all six changed files;
  `node --test` on each corrected/new test file passes except the same
  pre-existing, unrelated failures already on record (`tests/pedido-detail.
  smoke.js` in isolation: 189 tests, 152 pass, 37 fail — the identical 37
  pre-existing failures confirmed via `git stash`/`stash pop` against the
  unmodified file at `f9b1a54`); full mandatory Node suite (`node --test
  "tests/**/*.js"`) — 3993 tests (+8 from this correction's own tests), 3871
  pass, 122 fail — the failing-test-name set is byte-for-byte identical to
  the `f9b1a54` baseline (empty `diff` of sorted failing-name lists) — zero
  regressions attributable to this correction; `node
  scripts/validate-spec-custody.mjs` PASS; `git diff --check` / `git diff
  --cached --check` clean.
- **Findings:** none new. §34.9's disclosed debt ("`pedido-detail-events.js`'s
  retry behavior is proven statically, not via a real runtime click") is
  resolved by this correction's Gate-2 proof and removed from the residual
  list; all other residual debts carried forward unchanged.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ`
  (unchanged). `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`.
  `PHASE-C3C-B: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE` — unchanged; this correction does **not** record supervisor
  acceptance. No dependent `OC-C3-*` requirement is `SATISFIED`.
- **Exact accounting subject:** `fix: complete C3C-B retry classification
  proof`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review/acceptance of this
  corrected `PHASE-C3C-B` application-adapter implementation. Deployment,
  activation, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C3D, C4, C5, production access, `main`,
  and `origin`/`production` remote mutation remain unauthorized; the one
  fast-forward push to `staging/dev` authorized by this correction's order
  (carrying both `f9b1a54` and this correction's own commit) records this
  closeout.

## 2026-07-21 — PHASE-C3C-B SUPERVISOR ACCEPTANCE + PHASE-C3D CONTRACT AUTHORED — CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED

- **Order:** `docs: accept C3C-B and define C3D contract` — documentation-only
  supervisor-acceptance closeout of `PHASE-C3C-B` (application compatibility/
  adaptation) plus read-only-diagnosis authoring of the `PHASE-C3D` material
  phase contract. No product, test, `db/*.sql`, migration, Supabase config, MCP
  config, or environment file is touched; no database, deployment, activation,
  or cutover action is taken.
- **Entry checkpoint:** branch `dev`, HEAD
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`, `staging/dev` equal to HEAD,
  preserved residue exactly: modified `.gitignore` (unstaged), untracked
  `.mcp.json`, untracked `.codex/config.toml` — none staged, restored, cleaned,
  or otherwise touched. Matched the expected baseline exactly.
- **C3C-B acceptance recorded (contract §36):** the supervisor **ACCEPTS**
  `PHASE-C3C-B` as `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`
  at accepted checkpoint `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`. Accepted
  commit chain: initial implementation `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`
  (`feat: adapt legacy purchase-order receipts for cutover`, §33), first
  correction `f9b1a54cc7b185a5e72f50209322d1473e93e850` (`fix: preserve C3C-B
  receipt idempotency attempts`, §34), final correction
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` (`fix: complete C3C-B retry
  classification proof`, §35). Basis: the exact finite RPC-error policy
  (`legacy_fallback` on documented inactive/bounded-`42883`;
  `ambiguous_failure` only on `!!res.error && res.status===0`; `hard_failure`
  otherwise — grounded in the real `@supabase/postgrest-js` shape), real
  call-site idempotency-attempt retention, the `pedido-detail-events.js` runtime
  DOM-click proof, UI-inertness (`js/router.js`/`js/boot.js` byte-unchanged,
  `index.html` one added line), and the empty full-suite failing-name
  differential (3985→3993 tests, 122 fail both before and after, `diff` empty).
- **Requirement disposition (no inflation):** the four `OC-C3-*` requirements
  (`OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`, `OC-C3-NOUI-001`)
  remain `PARTIALLY_SATISFIED`, not `SATISFIED` — real `canonical_active`
  read/write proof and the real cutover boundary are owned by `PHASE-C3D` / real
  cutover; `db/76` remains unapplied to any staging database.
- **PHASE-C3D contract authored:**
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C3D`, `STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
  IMPLEMENTATION NOT AUTHORIZED`). Binds the four already-ratified `OC-C3D-*`
  requirements (`OC-C3D-DEPLOY-001` §R.29, `OC-C3D-FENCE-001` §R.29.3,
  `OC-C3D-ACL-001` §13.15.2, `OC-C3D-LOCK-001` §R.29.5) to an isolated-rehearsal
  scope: six proposed sublots (C3D-A…C3D-F), an environment strategy (disposable
  local PostgreSQL + read-only shared-DB inspection recommended; isolated
  Supabase branch UNPROVEN and not created; no state-changing rehearsal against
  the shared `ucrjtfswnfdlxwtmxnoo`), entry/exit gates, a test matrix, the
  recovery/PONR model, exact future manifests, and the mandatory supervisor
  decisions. Creates no requirement, changes no anchor, authorizes no
  implementation/environment action; no `OC-C3D-*` disposition changes.
- **Read-only Supabase premise audit (`ucrjtfswnfdlxwtmxnoo` only, SELECT/list
  only):** cutover singleton `legacy_active`/`flat`/`not_started`, all markers
  null; migration history `74 → 75 → 76` (versions
  `20260720234958`/`20260720235820`); 64 flat rows = 51 mapped + 13 unmapped
  (`ordens_compra_fio` ids 153–165); 0 `ordem_compra_recebimentos` rows; both
  `db/76` functions present; `idempotency_namespace` CHECK admits
  `legacy_compat_receipt_v1`. **Branch availability UNPROVEN** — neither
  authorized read-only MCP path could enumerate branches; none assumed or
  created. No production or prohibited project accessed; no mutation.
- **13 unmapped rows:** DOCUMENTARY real-cutover/C3D completeness finding (bound
  explicitly by C3D contract §F; not blocking inactive deployment or fence
  rehearsal; a real-cutover completeness precondition).
- **Files materially changed (documentation-only):** `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; `docs/DOCUMENTATION_INDEX.md`;
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (§36 appended, head
  `STATUS` marker updated);
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (new);
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`;
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`; this ledger. No
  `db/*.sql`, test, product, runtime, or configuration file modified; the three
  preserved residue paths are excluded from the commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B`.
  `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. `ACCEPTED_CHECKPOINT:
  22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`. No dependent `OC-C3-*`/`OC-C3D-*`
  requirement is `SATISFIED`; no phase chains automatically.
- **Validation (documentation-proportional):** `node
  scripts/validate-spec-custody.mjs` PASS; `git diff --check` /
  `git diff --cached --check` clean. No technical, database, environment, or
  runtime test suite was rerun.
- **Exact accounting subject:** `docs: accept C3C-B and define C3D contract`.
- **Status after this commit:** `PHASE-C3C-B` = `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`; `PHASE-C3D` = `PROPOSED /
  AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the `PHASE-C3D`
  material phase contract. No `PHASE-C3D` implementation, environment mutation,
  branch creation, staging validation/application of `db/76`, deployment,
  activation, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C4, C5, production access, Supabase write,
  `main`, or `origin`/`production` remote mutation is authorized; one
  fast-forward push to `staging/dev` records this closeout.

## 2026-07-21 — PHASE-C3D MATERIAL CONTRACT FORWARD CORRECTION — CHANGES_REQUIRED RESOLVED / PROPOSED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** `docs: correct C3D contract boundaries` — documentation-only
  forward correction of the `PHASE-C3D` material phase contract following a
  read-only supervisor review that returned `CHANGES_REQUIRED` for four
  material contradictions. No product, test, script, migration, database,
  Supabase, branch, deployment, activation, fence, receipt, or cutover action
  is taken. `PHASE-C3C-B`'s accepted §36 closeout is not reopened.
- **Entry checkpoint:** branch `dev`, HEAD
  `fc53f9d43bbd28e47c3e84e3893082cc41c41fcf`, `staging/dev` equal to HEAD (`0`
  ahead / `0` behind), preserved residue exactly: modified `.gitignore`
  (unstaged), untracked `.mcp.json`, untracked `.codex/config.toml` — none
  staged, restored, cleaned, or otherwise touched. Matched the expected
  baseline exactly.
- **Supervisor verdict on the R1 proposal:** the `PHASE-C3D` contract as
  proposed and committed at `fc53f9d` received **`CHANGES_REQUIRED`** for four
  findings, all corrected in place this pass (new `§0` in
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`, append-only —
  §§A–N corrected directly, no numbered historical section existed yet to
  preserve verbatim):
  1. **Requirement disposition (§C, §M).** Corrected the incorrect implication
     that no `OC-C3D-*` requirement could become `SATISFIED` before real
     cutover: each of `OC-C3D-DEPLOY-001` (C3D-A/B), `OC-C3D-FENCE-001`
     (C3D-C), `OC-C3D-ACL-001` (C3D-D), `OC-C3D-LOCK-001` (C3D-E) may become
     `SATISFIED` by its own isolated-rehearsal evidence; C3D-F aggregates and
     closes without requiring real cutover to record an already-proven
     requirement; C3D acceptance never satisfies `OC-CUTOVER-001`/
     `OC-CUTOVER-PONR-001`. No disposition changed by this correction.
  2. **Real actor-path vs. structural eight-table fence proof (§C, §E, §G,
     §I).** Verified read-only against `js/screens/op-writes.js`
     (`registrarRecebimentoOrdemFio`, L92–99) and `js/screens/fornecedor.js`
     (writer, L523–524): both real application actor paths write only
     `ordens_compra_fio`, never the other seven protected tables directly.
     Split the fence proof into 5A (real admin-path + matching-supplier-path
     receipt attempts against the real flat surface, denied
     `legacy_receipt_fenced`, no client-grant widening, no fabricated actor
     path) and 5B (owner-level structural probes of all eight protected
     tables in the disposable cluster only).
  3. **Disposable-cluster-only PONR semantics (§A, §B, §H, §L).** Resolved the
     contradiction between requiring a concurrent Component B proof (whose
     successful commit sets `productive_receipt_started_at`, the PONR) and an
     unqualified "PONR = NONE" everywhere in C3D. Architect decision recorded
     as resolved (§J item 8): C3D may cross the receipt PONR only inside a
     disposable, isolated rehearsal cluster, exclusively for the C3D-E
     concurrency proof (an exact 11-step sequence: fresh cluster from
     `db/01…db/76`, synthetic fixture only, entry fingerprints, canonical-active
     test state, two real sessions, T1 commits, T2 re-evaluates under lock,
     required proofs, no pre-PONR rollback after the crossing, mandatory full
     cluster destruction, proof of destruction) — forbidden on
     `ucrjtfswnfdlxwtmxnoo`, `gqmpsxkxynrjvidfmojk`, `bhgifjrfagkzubpyqpew`, and
     any other persistent/shared environment. No claim is made anywhere in the
     contract that C3D crosses the PONR on any shared or real environment.
  4. **Exact future manifests (§I).** The open directory authorization
     `scripts/c3d/` (violating the no-wildcard rule) was replaced with the
     exact file `scripts/c3d/bootstrap-disposable-cluster.mjs`; the full §I
     manifest is now an exact-file list per sublot with no directory-level or
     wildcard authorization anywhere.
- **Files materially changed (documentation-only):**
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§0 appended; §A, §B,
  §C, §D, §E, §G, §H, §I, §J, §L, §M, §N corrected in place; `STATUS` marker
  unchanged, still `PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION
  NOT AUTHORIZED`); `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/DOCUMENTATION_INDEX.md`;
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`;
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`; this ledger — all
  light-touch updates recording the correction and the exact
  `NEXT_AUTHORIZABLE_ACTION` wording the order specified (`read-only
  supervisor review of the corrected PHASE-C3D material phase contract`). No
  `db/*.sql`, test, script, product, CSS/HTML/JS, migration, Supabase config,
  MCP config, CI, or package file modified; the three preserved residue paths
  are excluded from the commit.
- **State after this pass (unchanged from before this correction, per the
  order's explicit "Keep"):** `LAST_ACCEPTED_PHASE: PHASE-C3C-B`.
  `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. `ACCEPTED_CHECKPOINT:
  22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`. No `OC-C3D-*`/`OC-C3-*`
  requirement disposition changed by this pass; no phase chains automatically.
- **Validation (documentation-proportional):** `node
  scripts/validate-spec-custody.mjs` PASS; `node
  scripts/validate-spec-custody.mjs --self-test` 47/47 PASS; `git diff --check`
  / `git diff --cached --check` clean. No technical, database, environment, or
  runtime test suite was run (none required or authorized).
- **Exact accounting subject:** `docs: correct C3D contract boundaries`.
- **Status after this commit:** `PHASE-C3D` = `PROPOSED / AWAITING SUPERVISOR
  ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED` (unchanged marker; corrected
  content). `PHASE-C3C-B` = `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY
  VERIFIED` (unchanged, not reopened).
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the corrected
  `PHASE-C3D` material phase contract. No `PHASE-C3D` implementation,
  environment mutation, branch creation, staging validation/application of
  `db/76`, deployment, activation, real snapshot/import, fence transition, read
  switch, final ACL-closure invocation, cutover, C4, C5, production access,
  Supabase write, `main`, or `origin`/`production` remote mutation is
  authorized; one fast-forward push to `staging/dev` records this correction.

## 2026-07-21 — PHASE-C3D MATERIAL CONTRACT FINAL FORWARD CORRECTION (R2) — CHANGES_REQUIRED RESOLVED / PROPOSED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** `docs: finalize C3D contract execution boundaries` —
  documentation-only second forward correction of the `PHASE-C3D` material
  phase contract after a second read-only supervisor review returned
  `CHANGES_REQUIRED`. No product, test, script, migration, database, Supabase,
  branch, deployment, activation, fence, receipt, or cutover action is taken.
  `PHASE-C3C-B`'s accepted §36 closeout is not reopened.
- **Entry checkpoint:** branch `dev`, HEAD
  `6b7d48a238a5008e02168557b27bc27def3946d1`, `staging/dev` equal to HEAD (`0`
  ahead / `0` behind), preserved residue exactly: modified `.gitignore`
  (unstaged), untracked `.mcp.json`, untracked `.codex/config.toml` — none
  staged, restored, cleaned, or otherwise touched. Matched the expected
  baseline exactly.
- **Supervisor verdict on the R1 correction:** the contract at `6b7d48a`
  correctly resolved the four §0 (R1) findings but received a second
  **`CHANGES_REQUIRED`** for two remaining operational contradictions plus one
  wording correction, all corrected in place (new `§0b`):
  1. **Common documentary manifest for C3D-A…E (Finding 5, §C/§I).** R1
     allowed canonical documentation writes only in C3D-F. Corrected: §I now
     defines an exact common documentary manifest (`PROJECT_STATE.md`,
     `AGENT_HANDOFF.md`, `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`,
     `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
     `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
     `docs/ledgers/G28_LEDGER.md`, and `docs/DOCUMENTATION_INDEX.md` only if an
     indexed path/status materially changes) applicable to each of C3D-A, C3D-B,
     C3D-C, C3D-D, C3D-E. Each sublot's future authorization comprises its exact
     technical artifact manifest plus that common documentary manifest; a
     completed sublot records its technical checkpoint, evidence, materially
     affected requirement rows, current/next state, handoff, and hard stop, and
     never self-accepts or authorizes the next sublot. C3D-F remains the final
     aggregate closeout but is no longer the first time canonical evidence may be
     recorded. No wildcard/directory-level/"related documents" path added.
  2. **C3D-C reclassified as a database-faithful authenticated actor-context
     proof (Finding 6, §C/§E/§G.5A/§I/§M).** §G.5A had labeled the C3D-C fence
     proof application/browser end-to-end while the exact C3D-C manifest
     authorizes only `tests/ordem-compra-c3d-fence.integration.sql` (no
     JavaScript/browser/PostgREST harness). Architect decision: C3D-C is a
     SQL-only `DATABASE-FAITHFUL AUTHENTICATED ACTOR-CONTEXT PROOF` in the
     disposable cluster — synthetic authenticated admin and matching-supplier
     contexts (same role + `auth.uid()` claim mechanism as the repo's DB-backed
     authorization tests) reproducing the exact application flat-`UPDATE
     public.ordens_compra_fio SET kg_recebido=…, data_recebimento=…, status=…
     WHERE id=…` shapes (admin `js/screens/op-writes.js` L92–99;
     matching-supplier `js/screens/fornecedor.js` L523–525), both denied
     `legacy_receipt_fenced`/`SQLSTATE 55000`, zero flat/canonical/inventory
     mutation, fingerprints unchanged, RLS/grants preserved exactly, no
     client-grant widening, no fabricated actor path. The JS files remain
     read-only evidence of the mutation shape; no browser/application/PostgREST/
     real-UI execution is claimed. §G.5B remains the separate owner-level
     structural eight-table probe; the C3D-C technical manifest is unchanged
     (`tests/ordem-compra-c3d-fence.integration.sql`, no additional harness).
  3. **Wildcard-wording correction.** Every absolute "no wildcard anywhere"
     claim replaced by `NO WILDCARD OR DIRECTORY-LEVEL WRITE AUTHORIZATION
     EXISTS`; wildcard notation is retained only in read-only/reference and
     prohibited-path descriptions (`any db/*.sql`, `any js/**`, `.codex/*`),
     which are prohibition/reference patterns, not authorized write manifests
     (§I heading, §I intro, §0 Finding 4).
- **Read-only evidence verified this pass:** `js/screens/op-writes.js`
  (`registrarRecebimentoOrdemFio`, L92–99) and `js/screens/fornecedor.js`
  (writer, L523–525) both issue the identical flat-table
  `UPDATE public.ordens_compra_fio SET kg_recebido, data_recebimento, status
  WHERE id` shape and neither has direct client DML on any other protected
  table — confirming the actor-context proof premise. No file modified.
- **Files materially changed (documentation-only):**
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§0b appended; §0
  Finding 4 wording, §C, §E, §G items 4/5A, §I, §M, §N corrected in place;
  `STATUS` marker unchanged); `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/DOCUMENTATION_INDEX.md`;
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`;
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`; this ledger. No
  `db/*.sql`, test, script, product, CSS/HTML/JS, migration, Supabase config,
  MCP config, CI, or package file modified; the three preserved residue paths
  are excluded from the commit.
- **State after this pass (unchanged, per the order's explicit "Keep"):**
  `LAST_ACCEPTED_PHASE: PHASE-C3C-B`. `ACTIVE_PHASE: NONE`.
  `ACTIVE_PHASE_CONTRACT: NONE`. `ACCEPTED_CHECKPOINT:
  22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`. No `OC-C3D-*`/`OC-C3-*`
  requirement disposition changed; no phase chains automatically.
- **Validation (documentation-proportional):** `node
  scripts/validate-spec-custody.mjs` PASS; `node
  scripts/validate-spec-custody.mjs --self-test` 47/47 PASS; `git diff --check`
  / `git diff --cached --check` clean. No technical, database, environment, or
  runtime test suite was run (none required or authorized).
- **Exact accounting subject:** `docs: finalize C3D contract execution boundaries`.
- **Status after this commit:** `PHASE-C3D` = `PROPOSED / AWAITING SUPERVISOR
  ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED` (unchanged marker; corrected
  content). `PHASE-C3C-B` = `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY
  VERIFIED` (unchanged, not reopened).
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the final
  corrected `PHASE-C3D` material phase contract. No `PHASE-C3D` implementation,
  environment mutation, branch creation, staging validation/application of
  `db/76`, deployment, activation, real snapshot/import, fence transition, read
  switch, final ACL-closure invocation, cutover, C4, C5, production access,
  Supabase write, `main`, or `origin`/`production` remote mutation is
  authorized; one fast-forward push to `staging/dev` records this correction.

## 2026-07-21 — PHASE-C3D-A ENVIRONMENT AND DEPLOYMENT-MANIFEST QUALIFICATION — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** "PHASE-C3D-A — ENVIRONMENT AND DEPLOYMENT-MANIFEST
  QUALIFICATION". Entry checkpoint: branch `dev`, HEAD
  `ab30c5115bb79c8952cc5575b68f8b976497699d`, `staging/dev` equal to HEAD,
  index empty, preserved residue exactly modified `.gitignore` (unstaged),
  untracked `.mcp.json`, untracked `.codex/config.toml` — none touched.
- **Supervisor ruling recorded (contract §0c):** the R2-corrected
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (committed at
  `ab30c511`) is **ACCEPTED**; execution strategy §D Option 2 (disposable
  isolated local PostgreSQL + separately-scoped read-only inspection of
  `ucrjtfswnfdlxwtmxnoo`) is selected; `PHASE-C3D-A` is explicitly
  authorized. No later C3D sublot chains automatically.
- **Implemented (contract §O):** exactly two files —
  `scripts/c3d/bootstrap-disposable-cluster.mjs` (resolves local PostgreSQL
  18.4 binaries; allocates a fresh `fs.mkdtemp` temp data directory outside
  the repository and a distinct non-default TCP port; `initdb`/`pg_ctl
  start` with a reduced-shared-memory option set; proves readiness via
  `pg_isready` + a real `psql SELECT 1`; `stop()` runs `pg_ctl stop -m fast`,
  waits for the port to close, and removes the temp directory with a bounded
  retry, failing closed if removal cannot be proven; never applies a
  migration, never loads a fixture, never connects to Supabase or any
  shared/remote host, never writes a repository file, never registers a
  Windows service) and `tests/ordem-compra-c3d-deploy.smoke.js` (19/19
  `node --test`, run three consecutive times with zero leftover
  `postgres.exe` process or `c3d-disposable-pg-*` temp directory after each
  run; proves the deployment manifest resolves exactly `db/01`…`db/76`
  contiguous/unique with `db/75`/`db/76` as the terminal two, hash-matched to
  the HEAD checkpoint and byte-stable for the run; proves application
  artifact `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` is a branch ancestor;
  fails closed on synthetic duplicate/gap/missing-start/unexpected-trailing/
  hash-mismatch/non-ancestor/identity-mismatch fixtures, never against the
  real `db/*.sql` files; exercises the disposable-cluster lifecycle including
  an explicit `simulateReadinessFailure` fault-injection hook proving cleanup
  still removes a real process/directory after a forced readiness failure).
  `tests/ordem-compra-c3d-deploy.integration.sql` was **not** created — it is
  `PHASE-C3D-B` territory, not authorized by this order.
- **Implementation-time finding (in-scope, corrected):** the first cleanup
  implementation removed the temp directory immediately after `pg_ctl stop`
  reported success and the listening port closed; empirically (three full
  smoke-test runs) this occasionally left a `postgres.exe` auxiliary worker
  process alive and its directory undeleted for longer than the test run
  itself — a Windows-specific race where `pg_ctl stop -w` success does not
  guarantee every auxiliary process has released its open handles yet.
  Corrected with a 500 ms grace delay plus a bounded retry
  (`removeWithRetry`, up to 10 attempts) around the removal, failing closed
  if it still cannot be proven. Re-verified clean across three consecutive
  full smoke-test runs after the fix.
- **Read-only shared-development-database evidence (`ucrjtfswnfdlxwtmxnoo`,
  scoped read-only Supabase MCP connection; not `UNPROVEN`):** migration
  history confirmed ending at `75`/`76` with the exact recorded versions
  `20260720234958`/`20260720235820`; cutover singleton `id=1`:
  `status='legacy_active'`, `read_authority='flat'`,
  `reconciliation_status='not_started'`, every
  activation/snapshot/import/final-ACL/productive-receipt marker `NULL`;
  business fingerprint `ordens_compra_fio=64`, `ordem_compra=51`,
  `ordem_compra_item=51`, `ordem_compra_item_alocacao=51`,
  `ordem_compra_item_compat_fio=51`, `necessidade_compra_fio=64`,
  `saldo_fios=5`. Zero DDL, DML, or state-mutating RPC invoked.
- **Files materially changed:** `scripts/c3d/bootstrap-disposable-cluster.mjs`
  (new); `tests/ordem-compra-c3d-deploy.smoke.js` (new);
  `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§0c and §O
  appended; `STATUS` marker updated; §N updated in place); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; this ledger. `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  and `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` intentionally
  **not** touched — no `OC-C3D-*` disposition changed and no sequence fact
  changed. No `db/*.sql`, existing test, product `js/*`, `index.html`, CSS,
  package/lockfile, CI, deployment config, Supabase config, MCP config,
  `.gitignore`, normative specification, or validator modified; the three
  preserved residue paths are excluded from the commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged —
  `PHASE-C3D-A` is implemented, not yet accepted). `ACTIVE_PHASE: PHASE-C3D`.
  `ACTIVE_PHASE_CONTRACT: docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`.
  `ACCEPTED_CHECKPOINT: 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` (unchanged).
  No `OC-C3D-*`/`OC-C3-*` requirement disposition changed;
  `OC-C3D-DEPLOY-001` remains `PLANNED` (contract §M unchanged — C3D-A alone
  does not satisfy it, only C3D-A **and** C3D-B together may).
- **Validation:** `node --check` on both new files; `node --test
  tests/ordem-compra-c3d-deploy.smoke.js` 19/19, three consecutive clean
  runs; `node scripts/validate-spec-custody.mjs` PASS (against the final
  edited state); `node scripts/validate-spec-custody.mjs --self-test` 47/47
  PASS (run against the tool's own quiescent `ACTIVE_PHASE_CONTRACT: NONE`
  baseline precondition, by design — verified by temporarily stashing the
  `PROJECT_STATE.md` edit, running self-test, then restoring it; the
  validator itself was not modified); `git diff --check` / `git diff
  --cached --check` clean; full mandatory Node suite 4012 tests (3993
  baseline + 19 new), 122 failures — same count as the documented baseline,
  zero among them C3D-related (no stored exact prior failing-name list exists
  in canonical docs to diff byte-for-byte, only the count).
- **Exact accounting subject:** `test: qualify C3D disposable rehearsal
  environment`.
- **Status after this commit:** `PHASE-C3D` contract = `ACCEPTED`;
  `PHASE-C3D-A` = `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
  ACCEPTANCE`. `PHASE-C3D-B` through `C3D-F` remain unauthorized. No
  self-acceptance of `PHASE-C3D-A` or the phase occurred.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-A` evidence (contract §O). No `PHASE-C3D-B` implementation,
  environment mutation, branch creation, staging validation/application of
  `db/76`, activation, real snapshot/import, fence transition, read switch,
  final ACL-closure invocation, cutover, production access, Supabase write,
  `main`, `origin`/`production` remote mutation, or any further push is
  authorized; one fast-forward push to `staging/dev` records this pass.

## 2026-07-21 — PHASE-C3D-A TARGETED CORRECTION — CLEANUP PROOF, CANONICAL STATE, AND EXACT SUITE DIFFERENTIAL — CHANGES_REQUIRED RESOLVED / IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** "PHASE-C3D-A TARGETED CORRECTION — CLEANUP PROOF, CANONICAL
  STATE, AND EXACT SUITE DIFFERENTIAL". Entry checkpoint: branch `dev`, HEAD
  `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb`, `staging/dev` equal to HEAD,
  index empty, preserved residue exactly modified `.gitignore` (unstaged),
  untracked `.mcp.json`, untracked `.codex/config.toml` — none touched.
- **Supervisor verdict:** read-only review of the `PHASE-C3D-A` evidence
  recorded at commit `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb` returned
  `CHANGES_REQUIRED` for three findings. `PHASE-C3D-A` remained `IMPLEMENTED
  / LOCALLY VERIFIED / CHANGES_REQUIRED / AWAITING SUPERVISOR ACCEPTANCE`
  pending this correction; `PHASE-C3D-B` was not begun.

**Finding 1 — canonical `ACTIVE_PHASE` identity (corrected).** The
authorization required `ACTIVE_PHASE: PHASE-C3D-A`; `PROJECT_STATE.md` and
`AGENT_HANDOFF.md` incorrectly recorded `ACTIVE_PHASE: PHASE-C3D` after the
prior commit. Corrected in both files, every occurrence representing the
active operational phase. `ACTIVE_PHASE_CONTRACT` unchanged
(`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`). Because
`scripts/validate-spec-custody.mjs` requires the active contract's own
`PHASE_ID` marker to equal `ACTIVE_PHASE` exactly (`R2`), the contract's
`PHASE_ID` marker (head of file) was also corrected from `PHASE-C3D` to
`PHASE-C3D-A`; the document's title and prose continue to describe the full
`PHASE-C3D` sublot family (A…F) — only the machine-tracked "currently
active" identity changed. Re-running `node scripts/validate-spec-custody.mjs`
after the correction: `PASS`.

**Finding 2 — fail-closed PostgreSQL shutdown proof (corrected).**
`scripts/c3d/bootstrap-disposable-cluster.mjs`'s cleanup previously discarded
the boolean results of `runPgCtlStop()`/`waitForPortClosed()` and inferred
process death from directory removal succeeding, never from proving the
process itself was gone. Corrected: `readPostmasterPid(dataDir)` captures
the disposable cluster's own postmaster PID from its `postmaster.pid` file
immediately after `pg_ctl start -w` returns (never from process-name
enumeration); `runPgCtlStop()` now returns a captured
`{ ok, status, diagnostic }` result instead of a discarded boolean, and a
non-`ok` result throws `C3D_BOOTSTRAP_STOP_FAILED`; `waitForPortClosed()`
returning `false` is now a hard `C3D_BOOTSTRAP_PORT_STILL_OPEN` failure
instead of a swallowed rejection; `isPidAlive(pid)` (`process.kill(pid, 0)`,
cross-platform) plus a bounded `waitForPidExit()` poll proves the captured
PID is gone, throwing `C3D_BOOTSTRAP_PROCESS_STILL_ALIVE` if not; directory
removal now runs only after shutdown/port/process are all independently
proven; a successful `stop()` requires all four proofs
(`stopResult.ok`, `portClosed`, `pidAbsent`, `dirAbsent`) and rejects with a
stable `C3D_BOOTSTRAP_*` error otherwise; the bootstrap-failure (`init`/
`start`/`readiness`) catch path wraps its own cleanup attempt so a cleanup
failure never discards the original error (both are preserved, via
`.cleanupError`); `started`/`postmasterPid` are only cleared once genuinely
proven, so a failed `stop()` attempt never poisons a later real retry, while
a second call after genuine success returns the cached proof as a no-op.
Narrowly-scoped fault-injection options
(`stop({ forceStopFailure })`/`stop({ forcePortStillOpen })`/
`stop({ forceProcessStillAlive })`) were added to the existing `stop()` for
deterministic coverage — no new file was created.
`tests/ordem-compra-c3d-deploy.smoke.js` gained 5 new tests (24 total, up
from 19) proving: normal stop verifies PID/port/directory; readiness-failure
cleanup verifies the same three; each of the three controlled failures
causes `stop()` to reject with the matching stable error and an attached
partial proof, while the *other* two proofs plus a real underlying
shutdown/removal are genuinely completed by a subsequent real retry; a
second call after genuine success is a no-op; and a structural test proves
the script identifies the process only via its own captured PID
(`process.kill(pid, 0)` + `readPostmasterPid`), never via `tasklist`/
`taskkill`/`pkill`-style process-name enumeration that could touch an
unrelated PostgreSQL installation.

**Finding 3 — exact full-suite failure-name differential (corrected).** The
prior pass compared only failure *counts* (122 vs. 122) inherited from an
earlier commit's (`22bfb192`) historical record, never verified directly
against the `ab30c511` entry checkpoint, and never disambiguated same-named
tests in different files. Corrected: a detached Git worktree was created
outside the repository (`%TEMP%\c3d-baseline-ab30c511-<random>`) at
`ab30c5115bb79c8952cc5575b68f8b976497699d`; a scratch differential-capture
script (also outside the repository, not part of any commit) ran the
identical mandatory suite command (`node --test tests/**/*.js`) in that
worktree and in the corrected current workspace, capturing every failing
test's identity as `<repo-relative file path>:<line>:<col><TAB><full test
name>` from each TAP record's own `location:` field (disambiguates
identically-named tests across files); both lists were sorted and diffed
byte-for-byte. Both sides were run twice to confirm stability before
recording: baseline **137** failing identities (byte-identical both runs),
corrected workspace **122** failing identities (byte-identical both runs).
**Added (corrected − baseline) = 0** — the required result, no new failing
identity. **Removed (baseline − corrected) = 15**, reported separately, not
claimed as a fix (this pass's technical manifest touched only
`scripts/c3d/bootstrap-disposable-cluster.mjs` and
`tests/ordem-compra-c3d-deploy.smoke.js`; none of the files below, or any
product file they depend on, was modified by this pass or the prior one):
  - `tests/documents-ingestor-ui-smoke.test.js:237:1` — `ingestor-ui-source: botao Ver com window.open seguro`
  - `tests/documents-ingestor-ui-smoke.test.js:670:1` — `ingestor-ui-source: SVG_FILE icone presente na linha do documento`
  - `tests/pedido-detail-linked-ops.smoke.js:213:1` — `Render: fallback global "Nao foi possivel consolidar" só ocorre sob opsLoadError`
  - `tests/pedido-detail-linked-ops.smoke.js:225:1` — `Render: opsEnrichError mostra aviso restrito e NÃO esconde os cards de OP`
  - `tests/pedido-detail.smoke.js:1210:1` — `FIRST-OP-CTA: CTA destacado fica no cabecalho do bloco OPs vinculadas`
  - `tests/pedido-detail.smoke.js:1231:1` — `pedido-detail.js: se OP já existir não sugere gerar duplicada; mostra OP existente`
  - `tests/pedido-detail.smoke.js:354:1` — `pedido-detail: conectores do progresso usam labels visuais curtos`
  - `tests/pedido-detail.smoke.js:376:1` — `pedido-detail: pipeline nao renderiza textos longos da matriz nos conectores`
  - `tests/pedido-detail.smoke.js:389:1` — `pedido-detail: conectores continuam como setas integradas, nao badges soltos`
  - `tests/pedido-detail.smoke.js:411:1` — `pedido-detail: setas de transicao abrem modal de movimento; bolinhas mantem hub`
  - `tests/tec-to-acabamento-flow.smoke.js:300:1` — `D-B caso 1 (estático): buildEntregaHistorico aplica gate latexOpPorEntrega`
  - `tests/tec-to-acabamento-flow.smoke.js:335:1` — `TEC-STAGE-FINALIZATION-A-B: OP Tecelagem finaliza via RPC canonica`
  - `tests/tec-to-acabamento-flow.smoke.js:348:1` — `ADMIN-TEC-FINALIZE-CTA-R1: CTA destacado exige saldo zerado`
  - `tests/tec-to-acabamento-flow.smoke.js:589:1` — `split-UI-B caso 10: estático — op-tecelagem-producao-admin.js buildBlocoTecelagem passa comOpcaoSplit:true`
  - `tests/tec-to-acabamento-flow.smoke.js:600:1` — `split-UI-B caso 11: estático — abrirEdicaoAdmin NÃO passa comOpcaoSplit (edição não troca split)`

  Most plausible explanation: the corrected workspace's invocation includes
  one additional resource-heavy DB-backed test file
  (`tests/ordem-compra-c3d-deploy.smoke.js`, real PostgreSQL clusters across
  24 tests) absent from the baseline, changing `node --test`'s per-invocation
  concurrency/timing profile enough to shift a handful of pre-existing
  timing-sensitive tests — consistent with this repository's already-recorded
  test-suite non-determinism debt (`TEST-MOCK-FIDELITY-AUDIT`, the
  documented fixed-`:8765`-port class). Not investigated further or fixed;
  out of this pass's scope.
- **Temporary-worktree removal proof:** the detached baseline worktree and
  the scratch differential-capture script (both outside the repository) are
  removed before commit; `git worktree list` shows only the main working
  tree, the worktree directory no longer exists, and `git worktree prune`
  (dry run) reports nothing to prune — see the validation section of this
  pass's final report for the exact commands and output.
- **Files materially changed:** `scripts/c3d/bootstrap-disposable-cluster.mjs`
  (Finding 2 rewrite); `tests/ordem-compra-c3d-deploy.smoke.js` (Finding 2
  test coverage, +5 tests); `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
  (§P appended; `STATUS` and `PHASE_ID` markers corrected); `PROJECT_STATE.md`;
  `AGENT_HANDOFF.md`; this ledger.
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` and
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` intentionally **not**
  touched — no `OC-C3D-*` disposition or sequence fact changed by this
  correction. No `db/*.sql`, other existing test, product `js/*`,
  `index.html`, CSS, package/lockfile, CI, deployment config, Supabase
  config, MCP config, `.gitignore`, normative specification, or validator
  modified; `tests/ordem-compra-c3d-deploy.integration.sql` was **not**
  created; the three preserved residue paths are excluded from the commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B` (unchanged).
  `ACTIVE_PHASE: PHASE-C3D-A` (corrected). `ACTIVE_PHASE_CONTRACT:
  docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (unchanged).
  `ACCEPTED_CHECKPOINT: 22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f` (unchanged).
  Requirement disposition unchanged: `OC-C3D-DEPLOY-001` = `PLANNED`;
  `OC-C3D-FENCE-001`/`OC-C3D-ACL-001`/`OC-C3D-LOCK-001` = `PARTIALLY_SATISFIED`.
- **Validation:** `node --check` on both changed technical files; `node --test
  tests/ordem-compra-c3d-deploy.smoke.js` 24/24, three consecutive clean runs
  (zero leftover captured-PID-alive process, zero open disposable port, zero
  `c3d-disposable-pg-*` directory after each, proven via `process.kill(pid,0)`,
  a port probe, and `fs.access` respectively); `node
  scripts/validate-spec-custody.mjs` PASS (both `R2` PHASE_ID-identity and
  `R4` later-commit-accounted-for findings resolved); `node
  scripts/validate-spec-custody.mjs --self-test` 47/47 PASS (run against the
  tool's own quiescent `ACTIVE_PHASE_CONTRACT: NONE` baseline precondition by
  temporarily stashing the `PROJECT_STATE.md` edit, as in the prior pass; the
  validator itself was not modified); `git diff --check` / `git diff
  --cached --check` clean; the exact full-suite differential above
  (baseline 137, corrected 122, added 0, removed 15, both sides confirmed
  stable across two runs each).
- **Exact accounting subject:** `fix: prove C3D disposable cluster cleanup`.
- **Status after this commit:** `PHASE-C3D-A` = `IMPLEMENTED / LOCALLY
  VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` (the `CHANGES_REQUIRED` verdict
  recorded against `dd7f6739082d32dc5df849a9e69eaf1ee651f4cb` is resolved by
  this correction; no self-acceptance occurred). `PHASE-C3D-B` through
  `C3D-F` remain unauthorized.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the corrected
  `PHASE-C3D-A` evidence (contract §P). No `PHASE-C3D-B` implementation,
  environment mutation, branch creation, staging validation/application of
  `db/76`, activation, real snapshot/import, fence transition, read switch,
  final ACL-closure invocation, cutover, production access, Supabase write,
  `main`, `origin`/`production` remote mutation, or any further push is
  authorized; one fast-forward push to `staging/dev` records this pass.

## 2026-07-21 — PHASE-C3D-B — Inactive migration and application-presence validation

- **Phase:** `PHASE-C3D-B` (inactive migration/application-presence validation),
  the second sublot of the `PHASE-C3D` material phase contract
  (`docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` §C). Combined in one
  pass with a material-contract identity correction (STEP 1).
- **Authorization:** the "PHASE-C3D-B — INACTIVE MIGRATION AND
  APPLICATION-PRESENCE VALIDATION" order. Entry checkpoint
  `096cd60325e4987010d328c856ee6a3a51ca66bf` (the supervisor-accepted
  `PHASE-C3D-A` technical checkpoint), branch `dev`, `staging/dev` equal to
  HEAD, preserved residue exactly `.gitignore` (modified, unstaged),
  `.codex/config.toml` (untracked), `.mcp.json` (untracked).
- **STEP 1 — material-contract identity restored.** The contract's
  machine-readable `PHASE_ID` marker and the canonical `ACTIVE_PHASE` were
  restored to `PHASE-C3D` (the §P change to `PHASE-C3D-A` was a documentary
  identity error; the active sublot is tracked through the STATUS marker,
  append-only sections, `PROJECT_STATE.md`/`AGENT_HANDOFF.md` prose, and
  `NEXT_AUTHORIZABLE_ACTION`, not through `PHASE_ID`). No technical C3D-A
  evidence is invalidated. `PHASE-C3D-A` recorded `CLOSED / TECHNICALLY
  ACCEPTED / LOCALLY VERIFIED` at `096cd603…`. `scripts/validate-spec-custody.mjs`
  PASS with `PHASE_ID: PHASE-C3D` / `ACTIVE_PHASE: PHASE-C3D`.
- **STEP 2 — implementation.** One authorized new file:
  `tests/ordem-compra-c3d-deploy.integration.sql` (deterministic, rerunnable
  against a freshly migrated disposable cluster). No `db/*.sql`, product,
  validator, or accepted C3D-A technical file modified.
- **Isolated environment:** two fresh, disposable, isolated local PostgreSQL
  18.4 clusters via `scripts/c3d/bootstrap-disposable-cluster.mjs` — each in a
  temp directory outside the repository, distinct non-default port (64228,
  60491), zero public application tables before migration; no real/copied
  business data; no Supabase branch; no shared/persistent DB mutated. The
  platform preamble the migrations assume (roles
  `anon`/`authenticated`/`service_role`; `auth` schema with
  `auth.uid()`/`auth.role()`/`auth.users`; `extensions` schema with `pgcrypto`)
  was supplied by an ephemeral, outside-repository rehearsal shim — same class
  of preamble as the accepted `PHASE-C3C-B-DB-PREREQ` §36 run; it modifies no
  `db/*.sql` and is not committed.
- **Full ordered migration application:** the exact `db/01`…`db/76` (76 primary
  numbered migrations; `db/75`/`db/76` terminal) applied cleanly; all 76
  completed. A classification-shape-only synthetic 64-row `ordens_compra_fio`
  corpus (27 A / 12 B / 13 C / 12 D — synthetic values; §D known-limitation: no
  exact-total/51-mapping proof attempted) was loaded before `db/67` so its
  REFUND-A self-check (64/27/12/13/12/0) passed; `db/67` reconciliation
  `needs=64 headers=51 items=51 mappings=51`.
- **Object inventory + initial state:** Component A
  `listar_ordens_compra_fio_compat(uuid,bigint)` and Component B
  `registrar_recebimento_ordem_compra_fio_compat(bigint,numeric,date,text,text,text)`
  present (SECURITY DEFINER, owner postgres); both `c3a_namespace_check` and
  `c3c_hash_check` admit `legacy_compat_receipt_v1`; 17 `ordem_compra_c3c_*`
  functions; `trg_c3c_protected_mutation_guard` on all 8 protected tables +
  `trg_c3c_command_state_guard`. Cutover singleton
  `legacy_active`/`flat`/`not_started`, every marker NULL.
- **Inactive behavior + zero mutation:** Component A raised
  `listar_compat_inativo` / SQLSTATE `55000`; Component B returned
  `{ok:false, codigo:"recebimento_compat_inativo"}`; explicit before/after
  fingerprint identical (zero mutation); `productive_receipt_started_at` NULL;
  zero advisory locks; no open transaction. The integration SQL emitted
  `PASS[1..5]` and `C3D_B_DEPLOY_INTEGRATION_PASS` in both runs.
- **Idempotency:** `db/76` reapplied against the migrated cluster with no error,
  no drift (Component A/B function defs + both CHECK defs byte-identical), no
  duplicate constraint; integration SQL still PASS. `db/75` classified
  single-application (ordered): it re-ADDs `c3c_hash_check` with the two-branch
  definition, which a full reapply after `db/76` would use to revert `db/76`'s
  additive `legacy_compat_receipt_v1` extension (proven from the SQL); object
  convergence (17 objects present/stable), not full reapply, is its valid proof
  — no fabricated idempotency.
- **Cleanup (both runs):** the audited `stop()` proved (not inferred) captured
  postmaster PID absent, port closed, temp directory removed; independently
  re-confirmed (`process.kill(pid,0)` false, port probe closed, `fs.access`
  ENOENT). Zero leftover disposable process or `c3d-disposable-pg-*` directory
  afterward.
- **Application fallback (existing tests + static/hash):** accepted artifact
  `22bfb192c6c2ad10ccd2b2883d54c3a17e40cc9f`. `git diff --stat 22bfb192 HEAD --
  js/ index.html` and `-- '*.css'` empty (adapter
  `js/screens/ordem-compra-receipt-cutover.js` byte-unchanged; flat query shapes
  byte-identical). Inactive Component A signal + exact `42883` → flat reader;
  inactive Component B envelope → exactly one flat writer; only exact `42883`
  falls back; deterministic (real HTTP status) and transport-ambiguous
  (`status===0`) failures do not; canonical success writes zero flat rows —
  proven by unmodified `tests/ordem-compra-receipt-cutover.smoke.js` (43/43) and
  the call-site routers (`tests/op-writes.smoke.js`,
  `tests/fornecedor-screens.smoke.js`, `tests/op-nova.smoke.js`,
  `tests/pedido-detail.smoke.js`). No new JS harness; no existing app/C3C-B test
  modified.
- **Shared development database (`ucrjtfswnfdlxwtmxnoo`) read-only (not
  UNPROVEN):** `list_migrations` ends `75` (`20260720234958`)/`76`
  (`20260720235820`); cutover singleton `legacy_active`/`flat`/`not_started`,
  all markers NULL; fingerprint `ordens_compra_fio=64`, `ordem_compra=51`,
  `ordem_compra_item=51`, `ordem_compra_item_alocacao=51`,
  `ordem_compra_item_compat_fio=51`, `necessidade_compra_fio=64`,
  `saldo_fios=5`, `ordem_compra_recebimentos=0`, `ordem_compra_fio_lancamentos=0`
  — identical to the C3D-A §O reading. No DDL/DML/mutating RPC; single read-only
  pass.
- **Files materially changed:** `tests/ordem-compra-c3d-deploy.integration.sql`
  (new); `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` (§Q appended;
  `PHASE_ID`/`STATUS` markers corrected); `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/DOCUMENTATION_INDEX.md` (C3D contract row status); this ledger.
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` and
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` — the traceability matrix
  is intentionally not touched (no `OC-C3D-*` disposition materially changed;
  supervisor advances `OC-C3D-DEPLOY-001` after accepting combined C3D-A + C3D-B
  evidence); the backlog receives one dated closeout note only. No `db/*.sql`,
  product `js/*`/`index.html`/CSS, existing test, validator, package/lockfile,
  CI, deployment/Supabase/MCP config, or `.gitignore` modified; the three
  preserved residue paths are excluded from the commit.
- **Validation:** `node --check` on `scripts/c3d/bootstrap-disposable-cluster.mjs`
  and `tests/ordem-compra-c3d-deploy.smoke.js`; `node --test
  tests/ordem-compra-c3d-deploy.smoke.js`; `node --test
  tests/ordem-compra-receipt-cutover.smoke.js` (adapter fallback);
  `node scripts/validate-spec-custody.mjs` PASS; the disposable-cluster
  migration/application proof executed twice from fresh clusters (both green);
  `git diff --check` / `git diff --cached --check` clean; the full mandatory
  Node suite differential against the accepted checkpoint
  `096cd60325e4987010d328c856ee6a3a51ca66bf` in a temporary detached worktree
  outside the canonical workspace — final failing identities minus
  accepted-checkpoint identities = empty (added = 0). `node
  scripts/validate-spec-custody.mjs --self-test` fails identically at `096cd60`
  and here (its `createFixture` provisions no active phase contract, so any
  non-`NONE` `ACTIVE_PHASE` — true since C3D-A — makes the fixture baseline fail
  on the missing contract file); this is a pre-existing self-test-harness
  limitation, not a C3D-B regression, and the validator was not modified to
  accommodate the phase state.
- **State after this pass:** `PHASE_ID: PHASE-C3D`; `LAST_ACCEPTED_PHASE:
  PHASE-C3C-B` (unchanged); `ACTIVE_PHASE: PHASE-C3D`; `ACTIVE_PHASE_CONTRACT:
  docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`; `ACCEPTED_CHECKPOINT:
  096cd60325e4987010d328c856ee6a3a51ca66bf`. `PHASE-C3D-A` = CLOSED /
  TECHNICALLY ACCEPTED / LOCALLY VERIFIED. `PHASE-C3D-B` = IMPLEMENTED /
  LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE. `OC-C3D-DEPLOY-001` =
  `PLANNED`; `OC-C3D-FENCE-001`/`OC-C3D-ACL-001`/`OC-C3D-LOCK-001` =
  `PARTIALLY_SATISFIED` — unchanged. `OC-C3D-DEPLOY-001` is not marked
  `SATISFIED`.
- **Exact accounting subject:** `test: validate C3D inactive deployment stack`.
- **NEXT_AUTHORIZABLE_ACTION:** read-only supervisor review of the
  `PHASE-C3D-B` evidence (contract §Q). No `PHASE-C3D-C`/`C3D-D`/`C3D-E`/`C3D-F`
  implementation, environment mutation, branch creation, staging
  validation/application of `db/76`, activation, real snapshot/import, fence
  transition, read switch, final ACL-closure invocation, cutover, production
  access, Supabase write, `main`, `origin`/`production` remote mutation, or any
  further push is authorized; one fast-forward push to `staging/dev` records
  this pass.


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
