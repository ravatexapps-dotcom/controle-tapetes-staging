# ACTIVE OPERATIONAL HANDOFF

- **`REFUND-A` — `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`
  (2026-07-19, architect acceptance closeout, branch `dev`, docs-only, no DB
  access):** the architect accepted the REFUND-A staging implementation below
  (technical commit `eb84071`, documentation commit `e1ae04e`, staging
  migration-history identifier `20260719012036 /
  67_ordem_compra_refoundation_schema`, exact conversion **64 needs / 51
  headers / 51 items / 51 allocations / 51 compatibility mappings**). **Flat
  administrative and receipt authority remains entirely on
  `ordens_compra_fio`** — no reader or writer was switched by REFUND-A or by
  this acceptance. **No production access; no push.**
  **The `LIVE_ALLOCATION_T1_T2_TEST_PENDING` debt does NOT block this
  acceptance.** It blocks, specifically: (1) PRE-PROD activating purchase
  distribution; (2) any authenticated business grant added to the allocation
  RPCs; (3) any application beginning to call the allocation writer; (4) any
  production promotion involving allocation. The live T1/T2 interleave test
  was **not executed** in REFUND-A (waived by architect ruling); the accepted
  substitute was structural + sequential allocation evidence (catalog-proven
  `SELECT … FOR UPDATE`, sole-cache-maintainer trigger, `CHECK` backstop,
  direct-DML denial, valid/over-allocation/reversal sequential tests) — all of
  which passed.
  **New Phase-C activation obligation recorded (this closeout):** the
  canonical receipt writer must enforce the **remaining reversible quantity**
  for partial/repeated `estorno` reversals (§R.8 Ruling 8) before ledger
  authority is activated — REFUND-A's append-only and estorno-relationship
  guards do not yet enforce reversal magnitude (documented scope boundary,
  not a defect); Phase C closes this as part of switching receipt authority
  to the ledger.
  **`REFUND-B1` is now the next authorizable phase but is NOT authorized by
  this closeout.** `PRE-PROD` and every later phase remain `NOT AUTHORIZED`.
  **Pending non-blocking documentation debts, unchanged:**
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and `DOCUMENTATION_INDEX.md`. A
  contemporaneous read-only production diagnosis remains mandatory before any
  production migration in this track.
  **Files changed by this closeout:** `PROJECT_STATE.md`, this handoff entry,
  `docs/ledgers/G28_LEDGER.md`, `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (factual implementation-result annotation only — the ratified Part R
  contract itself is unchanged). No database access, no migration alteration,
  no application code, no `.gitignore`/`AGENTS.md` change, no push, no `main`
  touch, `REFUND-B1` not begun.

- **`REFUND-A` — `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT
  ACCEPTANCE` (2026-07-19, branch `dev`, staging `ucrjtfswnfdlxwtmxnoo` only) —
  superseded by the acceptance closeout entry directly above; retained
  verbatim as the technical implementation record:** executed under the
  `REFUND-A — EXECUTION ORDER` plus a follow-up
  `ARCHITECT RULING — CLEAR REFUND-A CONCURRENCY HARD STOP` (waiving the live
  two-session T1/T2 test for this phase; see below).
  **Preflights (all passed before any write):** canonical reconciliation (Part R
  `RATIFIED`, §R.20 present, HEAD == baseline `5fd94d8`, no intervening
  purchase-order-contract commit); git preflight (branch `dev`, clean of
  unrelated changes, next migration slot `db/67`, `.gitignore`/`AGENTS.md`
  residue untouched); database target + capability preflight (fingerprinted
  `ucrjtfswnfdlxwtmxnoo` via the established markers — `usuarios_eventos=9`,
  `document_link_revisions=8`, matching M3's legacy-only counts — confirmed
  write-capable: `current_user=postgres`, `transaction_read_only=off`,
  `CREATE` on `public` = true); legacy-corpus preflight (64 rows, Class
  A27/B12/C13/D12, matching the ratified diagnosis exactly; both
  `ordem_compra_eventos`/`ordem_compra_fio_lancamentos` confirmed empty — no
  unhandled history); Pedido-ownership preflight (`lotes.pedido_id` exists;
  11 NULL-pedido rows all resolve to OP1/OP2 with `op_id∈{1,2}`; every other
  header-bearing row's `op→lote→pedido` chain resolves consistently; OP36 =
  rows 137/138/139/140, 4 distinct headers, no merge).
  **Migration:** `db/67_ordem_compra_refoundation_schema.sql` (705 lines,
  commit `eb84071` "Create purchase-order refoundation foundation"; staging
  migration-history identifier `20260719012036 /
  67_ordem_compra_refoundation_schema`). Dry-run rehearsed inside a rolled-back
  transaction before the real apply; zero residue confirmed both before and
  after the dry run.
  **What it built (schema-and-seed only, §R.20.3 — no reader/writer cutover,
  no application-code change):** the four Part R persistence layers
  (`necessidade_compra_fio`, `ordem_compra`, `ordem_compra_item`,
  `ordem_compra_item_alocacao`) with every ratified column/CHECK/unique-index/
  RLS/grant; `ordem_compra_item_compat_fio`, the explicit one-to-one
  compatibility mapping; the additive dual-reference transition on
  `ordem_compra_eventos` (legacy `ordem_compra_fio_id` relaxed to nullable,
  new `ordem_compra_id` added nullable, exactly-one-parent `CHECK`) and on
  `ordem_compra_fio_lancamentos` (same pattern plus the full ratified ledger
  structural contract — `tipo`/`estorno_de_id`/`idempotency_key`/
  `origem_tipo`/`origem_ref`, sign `CHECK`, append-only guard trigger,
  estorno-relationship guard trigger — table stays empty, no opening balance,
  no writer); the `op→lote→pedido` ownership guard trigger on
  `necessidade_compra_fio` (fires regardless of caller, including the
  migration's own seed inserts); the `kg_alocado` sole-cache-maintainer
  trigger on `ordem_compra_item_alocacao`; and the canonical allocation RPC
  `alocar_necessidade_compra_fio` (`SELECT … FOR UPDATE` on the need row,
  validates against the live balance, inserts one allocation) — **granted to
  no client role**, inactive until PRE-PROD. Every new table: RLS enabled,
  admin-only `SELECT` policy, **zero** `authenticated`/`anon` DML grant
  (confirmed live in the default-ACL check — `public` schema auto-grants full
  DML to `anon`/`authenticated`/`service_role` on new objects, so every
  `REVOKE ALL` in this migration is load-bearing, not defensive boilerplate).
  **Seed result — exact ratified conversion:** **64 needs / 51 headers / 51
  items / 51 allocations / 51 mappings**, Class A27/B12/C13/D12, all 51
  header-bearing needs fully self-allocated (`kg_alocado = kg_necessario`),
  13 Class-C needs unallocated, OP36 → 4 distinct headers (rows 139/140 NOT
  merged), OP1/OP2 → 11 null-Pedido needs/headers keyed by source-row
  identity. `ordens_compra_fio` untouched throughout — still 64 rows,
  **identical row fingerprint** (`e11babdaf6cc98bd3b688839a790b64d`) before,
  during, and after every verification step.
  **Concurrency-gate waiver (2nd architect order this session):** the
  originally-attempted live two-session T1/T2 write-skew test HARD-STOPPED —
  `dblink` (the only available concurrency-capable extension) cannot
  self-connect without a password (`password or GSSAPI delegated credentials
  required`), and MCP `execute_sql` cannot hold a transaction open across
  calls to interleave two backends. The architect supplied credentials in
  chat to unblock this; **declined on policy grounds** (entering passwords to
  authenticate is a standing prohibited action, non-overridable by request)
  and reported the stop instead of using them. The architect then issued a
  **formal waiver**: the live T1/T2 test is **not required** for REFUND-A
  because allocation is not activated as a business path in this phase.
  Accepted substitute evidence (all delivered): catalog proof the RPC uses
  `SELECT … FOR UPDATE`; proof the trigger is the sole `kg_alocado`
  maintainer; the `kg_alocado>=0`/`kg_alocado<=kg_necessario` CHECKs;
  direct-DML denial to `authenticated`/`anon`; deterministic sequential tests
  (valid allocation, over-allocation rejection via a genuinely full need,
  reversal-via-delete never going negative). **Debt registered:
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`** — non-blocking for REFUND-A; a
  **HARD STOP** before PRE-PROD activates purchase distribution, before any
  authenticated grant is added to allocation RPCs, before any application
  calls the allocation writer, and before any production promotion involving
  allocation. At that later gate a real two-session test must run through a
  tooling channel that supports concurrent sessions (e.g. a pre-provisioned
  `dblink` foreign-server/user-mapping the architect sets up out-of-band, or
  an out-of-band `psql` two-terminal test whose result is reported back).
  **Full verification matrix (staging, rolled-back fixtures unless noted):**
  catalog verification confirmed every table/column/constraint/index/
  trigger/function/RLS/grant matches the design exactly; **21/21 negative
  -constraint tests** correctly rejected by their intended guard (native
  cotton/Pedido-origin, native polyester/OP-origin, native NULL-Pedido,
  mismatched OP/Pedido via the ownership guard, duplicate native cotton/
  polyester needs, duplicate legacy source-row identity, legacy row without
  source ref, invalid Class-D provenance on a native row, second native
  active draft same Pedido+supplier, allocation over a genuinely full need,
  direct `authenticated` DML on both `necessidade_compra_fio` and
  `ordem_compra_item_alocacao` — `permission denied`, event/ledger rows with
  both or neither parent, invalid ledger sign, append-only UPDATE/DELETE
  rejection); reversal-via-delete confirmed to return the cache to exactly
  `0`, never negative; **over-reversal magnitude** is a documented,
  intentional REFUND-A scope boundary (Phase C's canonical writer owns that
  validation per Ruling 8 — not a schema `CHECK` here — not a defect).
  **Legacy-flow regression, live RPC calls under a simulated real admin
  session (rolled back):** `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio`
  (db/66) still succeed unchanged end-to-end (emit → 1 event
  `ordem_compra_fio_id`-referenced/`ordem_compra_id` NULL → cancel → 2 events
  total); the OP-screen extended-select reader pattern still resolves all 64
  rows; the direct `kg_recebido` writer pattern
  (`registrarRecebimentoOrdemFio`/`screenFornecedorOrdens`) still succeeds.
  **Rollback rehearsal:** the complete rollback DDL — drop the four new
  tables + compat mapping + all 5 new functions; remove only the additive
  event/ledger columns/constraints/triggers; restore the original `NOT
  NULL`/`CHECK` contracts — was executed for real inside a transaction and
  verified against all **9** restoration checks (new objects absent,
  original column sets byte-identical, original `NOT NULL` restored on both
  legacy references, `ordens_compra_fio` byte/count-equivalent, event/ledger
  tables still empty, db/66 RPCs survive); the **rehearsal itself** was then
  rolled back, leaving the real committed migration intact — confirmed by a
  final post-rehearsal state check (all 5 tables present, exact seed counts,
  unchanged `ordens_compra_fio` fingerprint).
  **Structural policy compliance (`CODE_HEALTH_RULES.md`):** SQL migration,
  not a JS screen — §7's line-count guidance targets app screens; this
  705-line single migration is justified as one cohesive, transaction-scoped
  unit (§14 "each phase must have a single scope" — splitting it across
  files would fragment one atomic seed transaction, which is a correctness
  risk, not a health improvement). §9 (write-module discipline), §15 (git:
  selective staging, no `add -A`/`reset`/`rebase`), §16 (docs updated at
  phase closeout), §19 (English) all followed. No JS/UI/Edge Function
  touched. No duplicated writer logic (the one new RPC has no existing
  equivalent). Rollback and idempotency evidence: see above.
  **Files changed:** `db/67_ordem_compra_refoundation_schema.sql` (new,
  technical commit `eb84071`); `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/ledgers/G28_LEDGER.md` (this closeout, documentation commit
  separate). No other file touched — `.gitignore`/`AGENTS.md` residue
  untouched throughout.
  **No production access; no push; no `main` change.** `REFUND-B1` and every
  later phase remain `NOT AUTHORIZED`. Pending non-blocking documentation
  debts carried over unchanged: `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2,
  `DOCUMENTATION_INDEX.md`. **Next authorizable action:** architect
  acceptance of this REFUND-A implementation, then `REFUND-B1` by its own
  order (remains `NOT AUTHORIZED` until then).

- **`REFUND-A PRE-ORDER STRUCTURAL CLARIFICATION` — `CLOSED / ACCEPTED`
  (2026-07-18, docs-only, branch `dev`):** a REFUND-A pre-order reconciliation
  found canonical contradictions between Part R's earlier "clean re-point of empty
  event/ledger tables" language and the live flat writers that still depend on
  those tables. The architect ruled the REFUND-A migration boundaries and this pass
  recorded them (no implementation, no DB, no push, no `main`, no unrelated file
  changes). **Files changed:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (header clarification banner; §R.3 event/ledger paragraph rewritten to additive
  dual-reference; §R.8 ledger contract parenthetical; §R.12 immutable-events
  reworded; §R.15 rollback boundary replaced by the complete rollback contract;
  §R.17 REFUND-A phase entry; §R.18 Flaw-4 verification; **new §R.20** consolidating
  Rulings 1–7), `PROJECT_STATE.md` (current-state correction), this handoff entry,
  `docs/ledgers/G28_LEDGER.md`. **Final event transition contract (§R.20.1):**
  REFUND-A does NOT re-point `ordem_compra_eventos`; it **retains** the legacy
  `ordens_compra_fio` reference (live `emitir`/`cancelar` writers keep writing
  legacy-referenced events), **adds** a nullable `ordem_compra` reference, and
  enforces **exactly one** purchase-order model per event; REFUND-B1 switches admin
  writers to new-order events; the legacy reference is removed only in a later
  authorized cleanup after reconciliation — no historical event rewritten or
  silently re-pointed. **Final ledger transition contract (§R.20.2):** REFUND-A does
  NOT re-point `ordem_compra_fio_lancamentos`; it **retains** the legacy item/order
  reference, **adds** nullable `ordem_compra_item_id`, enforces exactly one
  applicable parent, creates **no** opening-balance entry; Phase C performs the
  final receipt snapshot import, switches both receipt writers, and makes the item
  ledger authoritative; the legacy reference is removed only after Phase-C
  reconciliation + a separate cleanup. **Complete rollback contract (§R.20.4):** a
  REFUND-A rollback restores the exact pre-migration state — drop the four new
  four-layer tables + the compatibility mapping table; remove **only** the additive
  event/ledger columns/constraints/indexes/triggers/functions; preserve every
  original event/ledger column and the legacy writer contract; prove
  `ordens_compra_fio` and all flat data byte/count equivalent to the pre-migration
  snapshot; no destructive transformation in REFUND-A. **MCP + Pedido preflight
  (§R.20.5/§R.20.6):** canonical docs must not assert the configured MCP is both
  read-only and write-ready — effective write capability is **UNKNOWN until runtime
  preflight**; the future REFUND-A order must fingerprint the target as
  `ucrjtfswnfdlxwtmxnoo`, verify actual tool capability + DB role before any write
  (read-only MCP or ambiguous target = **HARD STOP**), and run a read-only
  Pedido-ownership preflight (column existence/constraints, population/null counts,
  OP → lote → Pedido consistency, whether OP1/OP2 remain unresolved legacy
  exceptions) — any inconsistency with the ratified conversion = **HARD STOP**;
  production and `bhgifjrfagkzubpyqpew` remain prohibited. **Canonical state
  correction (§R.20.7):** Part R is `RATIFIED / ACCEPTED` (no longer "awaiting
  ratification"); REFUND-A is blocked pending this clarification and its explicit
  migration order; no implementation has begun. **Part R historical acceptance
  preserved.** **No DB access, no implementation, no push, no unrelated file
  changes.** **Next authorizable action:** architect review of this clarification,
  then a separate REFUND-A migration order — `REFUND-A` remains `NOT AUTHORIZED`.

- **`ORDEM-COMPRA REFOUNDATION` — Part R `RATIFIED / ACCEPTED` (2026-07-18,
  branch `dev`):** The architect accepted the governing refounded specification
  against baseline `f2261ec` after the final read-only verification returned
  `RATIFIABLE`. The acceptance chain began with diagnosis correction → PART 1.
  **(1)
  Diagnosis** `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md` corrected
  to the architect-ratified **51-header 1:1 legacy conversion** (64 needs / 51
  headers / 51 items / 51 allocations) — committed **alone** as `de62b16` ("Add
  purchase-order legacy diagnosis"). The 14-header (NULL-supplier merge) and
  50-header (`(pedido,fornecedor)` merge) models were reviewed and **rejected**;
  every header-bearing legacy row converts 1:1, Class C → needs-only, Class D
  received-without-emission preserved, OP36 = 4 legacy headers (vs 3 native). **(2)
  PART 1** amends `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` with
  **Part R** — the four-layer model (`necessidade_compra_fio → ordem_compra →
  ordem_compra_item → ordem_compra_item_alocacao`), allocation invariants
  (double-distribution structurally impossible), native accumulator (Rule 1),
  kg_recebido snapshot→ledger transition (Rule 2), coexistence with
  `ordens_compra_fio` (both receipt writers live until Phase C), immutable events,
  legacy 1:1 conversion, over-receipt→`saldo_fios`, UI governance, and the rephased
  track `REFUND-A → REFUND-B1 → PRE-PROD → B2 → C → D → E`. Part R explicitly
  verifies against the four structural flaws (CONTEXT SUPPLEMENT) and the two
  additional rules (§R.18/§R.19). The **CONTEXT SUPPLEMENT blocker** (four flaws
  absent from session/repo) was hard-stopped twice, then supplied by the architect
  and resolved. **Canonical reconciliation** (11 docs, §8) found **no material
  contradiction**; one **follow-up flagged**: `PEDIDO_OP_SCHEMA_CONTRACT.md §6.2`
  (Insumos source = `ordens_compra_fio`) and `DOCUMENTATION_INDEX.md` (register the
  new diagnosis report + refounded spec) need updating in a **separate doc phase**
  (outside this pass's allowed files). **Phase `A`/`B1` historical acceptance
  preserved, not erased**; their flat foundation superseded on the persistence
  model. **`REFUND-A` and every phase remain `NOT AUTHORIZED`** pending their own
  architect orders. **No implementation / no DB write / no production access / no push / no
  `main`** this phase; `.gitignore` left untouched/unstaged. **Binding
  precondition:** a contemporaneous read-only **production** diagnosis is mandatory
  before any production migration (production UNKNOWN, not accessed). **Record (2nd
  commit):** `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`, this
  handoff entry, `docs/ledgers/G28_LEDGER.md` — commit `Propose purchase-order
  refoundation specification`. **DESIGN-GATE PATCH (3rd commit, `Resolve
  purchase-order refoundation design gates`):** a read-only Part R ratification
  audit returned `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION` (accepted); the architect
  supplied rulings 1–7 and Part R was patched to close every gap — Model A atomic
  need (dropped `_origem` child + JSONB), NULL-safe partial-unique need identity,
  single locked-cache allocation design with the T1/T2 write-skew proof,
  receipt-ledger `idempotency_key` + `estorno` compensation, Phase-C opening-balance
  import entry (no `kg_recebido_inicial`), per-dimension coexistence authority
  matrix + one-to-one compatibility mapping (no split-brain), Class-D constrained
  provenance + native-anomaly CHECK, and per-phase gates. Null-Pedido legacy edge
  (OP1/OP2) resolved via `pedido_id` nullable-for-legacy (CHECK), analogous to the
  ratified supplier-null exception. **Validation gates all pass; no open-alternative
  language remains in Part R** (residual `recommend`/`option` matches are all in the
  superseded §0–§11). Conversion unchanged 64/51/51/51; A/B1 history preserved. Spec
  remained `PROPOSED / AWAITING ARCHITECT RATIFICATION` at that checkpoint.
  **FINAL STRUCTURAL PATCH (4th commit, `Complete purchase-order refoundation
  structural contract`):** a second (final) read-only ratification audit returned
  `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION` (accepted); the architect supplied
  structural rulings and Part R was patched to close the remaining contracts —
  legacy source-row identity (`legado_origem_ordem_compra_fio_id` + separate legacy
  uniqueness), **exactly two native material/origin combinations** (cotton=OP-origin,
  polyester=Pedido-origin; OP-origin polyester legacy-only; Pedido-origin cotton
  forbidden) with a DB `op→lote→pedido` ownership guard, direct-DML revoke on the
  need table, allocation RPC/trigger responsibility split (sole `kg_alocado`
  maintainer), receipt-ledger sign CHECKs + partial/repeated `estorno` (no
  over-reversal, no negative cumulative) + two-way append-only enforcement, native
  receipt lifecycle gate (`emitida`+accepted; receipt-before-issuance prohibited),
  explicit `ordem_compra_item_compat_fio` one-to-one mapping table, event-derived
  idempotent `saldo_fios` reconciliation, and the Phase-C maintenance-window +
  **point-of-no-return**. Validation gates pass; conversion unchanged 64/51/51/51.
  **RATIFICATION CLOSEOUT:** acceptance baseline `f2261ec`; diagnosis commit
  `de62b16`; initial proposed-spec commit `c49f369`; design-gate commit `c10e959`;
  final structural-contract commit `f2261ec`; final verification verdict
  `RATIFIABLE`; conversion confirmed at 64 needs / 51 headers / 51 items / 51
  allocations. Part R is now `RATIFIED / ACCEPTED`. The historical acceptance of
  old Phase `A`/`B1` is preserved while their flat persistence foundation remains
  superseded. No implementation has begun. The contemporaneous read-only production
  diagnosis remains a binding precondition before any production migration. Pending
  non-blocking documentation follow-ups: `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and
  `DOCUMENTATION_INDEX.md`. **Next authorizable action:** `REFUND-A`, only by its own
  architect order. `REFUND-A` remains `NOT AUTHORIZED`.

- **`ORDEM-COMPRA-LIFECYCLE` Phase `B1` — `CLOSED / ACCEPTED` (2026-07-18,
  closeout order "CLOSEOUT ORDEM-COMPRA-B1", docs-only, branch `dev`):**
  supersedes the entry below (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH` is
  `RESOLVED` — the `supabase-legacy` MCP authenticated this session). **B1 is
  now fully closed, both halves:** the UI reader (`buildOrdensReaderSection`,
  `js/screens/op-nova.js`, commit `b0c3f27`) and the DB half (`db/66_ordem_
  compra_emitir_cancelar.sql` — `emitir_ordem_compra_fio`/`cancelar_ordem_
  compra_fio` RPCs + partial ACL hardening, commit `5a2cde7`, already applied
  to staging `ucrjtfswnfdlxwtmxnoo` in an earlier session). **Verification
  this session:** a scoped `BEGIN…ROLLBACK` matrix re-confirmed both RPC
  branches live (null-fornecedor emit → `{ok:false,erro:'Ordem sem
  fornecedor atribuido nao pode ser emitida'}`, row unchanged;
  fornecedor-assigned emit → `{ok:true,...}`, row transitions + 1
  `ordem_compra_eventos` row) — the first CTE-based test attempt gave a
  false "no effect" reading (Postgres does not guarantee execution order
  across CTEs joined only by a constant; corrected with a PL/pgSQL `DO`
  block for guaranteed sequential statements). The architect then walked
  both paths live in staging: **error path** (Emitir on a "— não atribuído"
  order → error toast, row stays Rascunho) and **success path** (Emitir on a
  fornecedor-seeded order → success toast, badge flips to Emitida) — **both
  confirmed OK**.
  **Bug found + fixed in this closeout (commit `275ede2`,
  `ORDEM-COMPRA-B1-UI-RESULT-CHECK`):** `emitirOrdemCompra`/
  `cancelarOrdemCompra` (`js/screens/op-nova.js:1073-1091`) checked only
  `res.error` (transport-level) — the RPCs return HTTP 200 with
  `{ok:false,erro:...}` on business-logic rejection, so a rejected
  emit/cancel showed a **false success toast** while the row silently stayed
  unchanged. Reproduced live: the architect had observed exactly this ("it
  emitted, success toast, order moved to emitida" on a null-fornecedor
  order); a full scan of every non-legacy `ordens_compra_fio` row confirmed
  100% still `status_administrativo='rascunho'` with zero real
  `emitida_em`/`ordem_compra_eventos` rows before the fix — the RPC and its
  db/66 matrix were correct throughout, the defect was entirely client-side.
  Fixed to also check `res.data.ok !== true`, surfacing `res.data.erro` on
  rejection; identical fix applied to `cancelarOrdemCompra` (same latent
  defect, not yet observed live). **Sweep (no systemic debt):** every other
  `supa.rpc(...)` call site in the app either already checks
  `res.data.ok === false` correctly, or calls an RPC with no `{ok,erro}`
  envelope (raises a Postgres exception, e.g. `gerar_op_latex`, or returns a
  plain scalar, e.g. `proximo_numero_op`) — an error-only check is correct
  there. This was an isolated defect in the two new B1 handlers. 2 new
  render-harness smokes added (`tests/op-nova.smoke.js` #77-78) asserting the
  error path (rejected emit/cancel → error toast, not the false success
  toast); the harness's `buildFakeSupa`/`makeRenderSandbox`/
  `renderNovaOpForTest` gained an optional `rpcImpl` hook (defaults to the
  old no-op behavior, zero impact on existing tests) plus an exposed
  `sandbox.__toastsNode` for toast assertions. Full suite: `132`
  pre-existing failures unchanged, zero regression (`tests/op-nova.smoke.js`
  83/83 pass).
  **Ratified supplier-assignment decision (this closeout, binding):**
  fornecedor assignment is a **per-order** property of `ordens_compra_fio` —
  the schema already supports it fully (nullable `fornecedor_id` FK, one row
  per material+color already generated at Abrir OP via
  `montarOrdensCompraFio`, already the row-level RLS ownership key for
  `ocf_fornecedor_read`/`ocf_fornecedor_update` and already the `emitir` RPC's
  own precondition) — **no schema change needed**, this is UI-relocation
  work. Assignment **moves to the future `B2` order-detail screen**. The
  OP-screen's legacy fornecedor selects (`buildAtrib` in `op-nova.js`, which
  bulk-assigns one fornecedor per material type across an entire OP via
  `atribuirFornecedorFioOp` — collapsing what the schema already models as
  independent per-color orders) are **removed only after `B2` is
  functional**, so there is no gap where assignment is impossible in the UI.
  `op_fornecedores` (the OP-level `etapa`-keyed bookkeeping table) is **kept
  synchronized as a compatibility projection, not cosmetic** —
  `ops_fornecedor_read`/`op_itens_fornecedor_read` RLS key on it for supplier
  visibility into the OP, and `screenFornecedorOrdens`'s embedded
  `ops(numero,ano)` join silently degrades to `—` without it; whatever writes
  fornecedor assignment in `B2` must also upsert the matching
  `op_fornecedores` row. **Reassignment after `emitida` is BLOCKED** — the
  correction path is cancel + open a new draft order, not an in-place
  fornecedor swap on an already-emitted order (keeps the
  `ordem_compra_eventos` audit trail honest, consistent with the ratified
  "emission locks quantities" precedent). The empty-dropdown bug
  (`fornecedores.tipo` domain `fio_algodao`/`fio_poliester`/`tecelagem`/
  `latex` vs `ordens_compra_fio.tipo` domain `algodao`/`poliester`, collided
  under the shared variable name `tipo` in `buildAtrib`,
  `op-nova.js:1185-1188`) is **recorded as noted-not-fixed** — those selects
  are slated for removal at `B2`, so patching a soon-to-be-deleted path is
  not worthwhile.
  **Debts registered (canonical, verbatim):**
  - `ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP` — `kg_recebido` remains directly
    writable by `authenticated` after `db/66` (both
    `registrarRecebimentoOrdemFio`, `op-writes.js:29-43`, and
    `screenFornecedorOrdens`, `fornecedor.js:461-463`, keep writing it
    directly, the latter gated by the pre-existing `ocf_fornecedor_update`
    RLS policy); PostgreSQL column-level `REVOKE` cannot narrow an
    already-existing table-level grant without breaking both live consumers
    immediately, with no replacement RPC. **Closes only when Phase C ships
    the ledger-based `registrar_recebimento_ordem_compra_fio` RPC in the
    same migration that revokes `kg_recebido` from `authenticated`.**
  - `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED` — `js/screens/fornecedor.js:461`
    (`screenFornecedorOrdens`) is a live, independent supplier-facing direct
    `UPDATE` of `kg_recebido`/`data_recebimento`/`status` on
    `ordens_compra_fio`; not mentioned in the spec's §0 evidenced-inventory
    (which asserted suppliers have no existing write path on this table).
    Flagged here and in the ledger's provenance trail — **§0 of
    `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` is
    deliberately NOT rewritten**; the discovery is recorded as a correction
    trail, not folded silently into the ratified inventory text.
  - **Phase C scope AMENDED (binding):** the ledger-based
    `registrar_recebimento_ordem_compra_fio` RPC and rewrite must serve
    **both** live consumers — `op-writes.js`'s `registrarRecebimentoOrdemFio`
    **and** `fornecedor.js`'s `screenFornecedorOrdens` (previously scoped
    only around the admin writer) — `screenFornecedorOrdens` must be
    rewritten to call the ledger RPC instead of updating `ordens_compra_fio`
    directly.
  **Record (this commit):** `PROJECT_STATE.md` (Phase `B1` marked `CLOSED /
  ACCEPTED`, the `BLOCKED-BY-MCP-AUTH` entry marked `RESOLVED`, the three
  debts registered, the supplier-assignment decision recorded, Closed-phases
  row added); this handoff entry; `docs/ledgers/G28_LEDGER.md` (closeout
  entry). **No DB/schema/production action this commit — docs-only.** No
  push to `main`. **Next authorizable action:** Phase `B2` (order detail
  screen, route `#/ordens-compra/:id`), its own order — scope must include
  the per-order fornecedor-assignment UI per the ratified decision above.

- **`ORDEM-COMPRA SPEC AMENDMENT` (Part 1) — `CLOSED / ACCEPTED`; Phase `B1`
  AUTHORIZED but DB-execution `HARD-STOPPED` (2026-07-18):** docs-only Part 1
  of the order "ORDEM-COMPRA SPEC AMENDMENT + PHASE B1", branch `dev`. **Part 1
  done:** amended `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  §6 (UI surface) + §8 (phasing) to record the architect's
  separation-of-responsibilities ruling — receipt registration lives on the
  purchase order's own **detail screen**; the OP-screen section becomes a
  **reader** (badges + available yarn per color, registers nothing);
  distribution sliders + `Salvar distribuição` + `Iniciar produção` stay on the
  OP screen. Phase `B` split into **`B1`** (OP reader section + `emitir`/
  `cancelar` RPCs + RLS revoke `db/66`), **`B2`** (order detail screen, route
  `#/ordens-compra/:id`), **`B3`** (orders list screen); Phase `C` receipt
  entry point = the order detail screen. **Ratified §1/§4/§5/§2.3 untouched**
  (amendment confined to §6/§8; escalate-on-conflict did not trigger).
  **Part 2 (`B1`) — architect ruling: leave the DB as a debt, proceed with UI
  only.** **UI half DONE:** the OP-screen reader section
  (`buildOrdensReaderSection` in `js/screens/op-nova.js`) — one row per linked
  order (material—cor · fornecedor/"— não atribuído" · qtd received/ordered ·
  three dimension badges administrativo/aceite/recebimento · Emitir on
  `rascunho` + Cancelar on `rascunho`/`emitida`, none on `cancelada`/legacy,
  30×30 `actionButton`, confirm on Cancelar), header config chip
  (Aceite dispensado/exigido), frozen-at-emission footer note, cotton/poliéster
  only (no Elastano), **no receipt inputs** (receipt is Phase C on the order
  screen). Data via a defensive extended-select-with-fallback
  (`fetchOrdensCompraFio`): on a pre-`db/65` database the dimension select
  errors `42703` → legacy fallback → rows render legacy read-only, **so the OP
  screen never regresses**. 7 new render-harness smokes (composition, badges,
  actions-per-state, no receipt inputs, no Elastano, config chip, degraded
  mode); full suite `+7` passing / `137` pre-existing failures byte-identical
  (file-swap verified — zero regression). **DB half BLOCKED
  (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`):** the `supabase-legacy` MCP is
  unauthenticated / non-interactive (tools absent from the registry, verified
  via ToolSearch), so the ref-confirm, `emitir`/`cancelar` RPCs, `db/66` RLS
  revoke, RPC role-matrix, and ACL catalog verification cannot run; Emitir/
  Cancelar call the not-yet-existing RPCs defensively (inert until they land).
  **Gate:** `IMPLEMENTAÇÃO VALIDADA (código) / AGUARDANDO VALIDAÇÃO VISUAL DO
  ARQUITETO` — the full visual walk (draft→assign→Emitir→badges) is itself gated
  on the DB half being applied to staging. **To unblock:** authorize the
  `supabase-legacy` MCP interactively, apply RPCs + `db/66`, run the role matrix
  + ACL check, then the architect walks the OP screen. **Record:** Part-1 docs
  commit (spec + `PROJECT_STATE` + `G28_LEDGER` + this handoff); B1-UI technical
  commit (`op-nova.js` + `op-nova.smoke.js` + `PROJECT_STATE`/handoff status).
  **No staging/production access; no push authorized by this order.** **Next
  authorizable action:** the `B1` DB half once the MCP is available (then
  architect visual validation), or Phase `B2` by its own order.
- **`YARN-BUTTONS-PHASE-1` (+ corrections) — Shared Distribution Builder —
  `CLOSED / ACCEPTED` (2026-07-18):** UI-only, branch `dev`. Architect
  visually validated on staging local — BOTH surfaces (OP screen Preparação
  block + Pedido hub transition modal). **Final contract (binding):** the
  proposal/distribution modal footer is EXACTLY `[Manter pedido, Salvar
  distribuição]`, both **save-only** (persist `op_itens.metros_ajustados` via
  `salvarDistribuicaoOP`; never start production / change status / snapshot
  saldo). **`Iniciar produção`** is the ONLY production-start (`saldo` snapshot
  + `status → em_producao` via `iniciarProducaoOP`), present on BOTH surfaces,
  enabled only with a saved distribution + received yarn covering it (else
  disabled with a `title`). `Aceitar proposta` removed everywhere; the dead
  `aplicarRecalculo` wrapper removed. **ROOT CAUSE of the regression saga:**
  two parallel modal builders existed — `op-nova.js` (`buildProposta`) and
  `pedido-detail-events.js` (`buildTecAcceptanceProposalBlock` /
  `openTecAcceptanceModal`); the earlier corrections edited only the OP screen,
  so the removed button kept returning from the Pedido-side twin (a live,
  separately-tested implementation, not dead code). **Resolution:** shared
  module `js/screens/op-distribuicao-ui.js` (`buildDistribuicaoBlock` +
  `buildIniciarProducaoButton`) consumed by BOTH surfaces; the two duplicated
  implementations deleted — duplication eliminated. In the Pedido hub, `Aceitar
  OP` became `Distribuição` (opens the save-only modal) + `Iniciar produção`.
  **Verified in-browser against real production code:** footer exactly two
  buttons; `Salvar` → only `salvarDistribuicaoOP` (never production); `Iniciar`
  disabled→enabled→`iniciarProducaoOP`; full suite `3710` pass / `132` fail —
  **zero new failures vs baseline** (`134`), all remaining pre-existing.
  **Technical commits (`dev`):** `02679f9` (button placement — 1st correction),
  `2388d39` (shared-builder unification). Docs closeout in a separate commit.
  **Open PRODUCT DECISION (registered, not a defect):** `Manter pedido` may now
  be redundant with `Salvar distribuição` — architect to decide keep/remove
  (foldable into a future YARN-BUTTONS Phase B if removed). **Standing LESSON:**
  UI position specified by NAMED block/screen, never relative reference; UI
  orders must verify ALL surfaces that render the component (this app has
  documented OP↔Pedido modal duplication). **No production access; no push to
  `main`.** Full detail: `docs/ledgers/G28_LEDGER.md` (this-date entry). **Next:**
  architect'\''s keep/remove ruling on `Manter pedido`; no other YARN-BUTTONS work
  authorized.
- **`ORDEM-COMPRA-LIFECYCLE` Phase `A` (schema + config) — `CLOSED /
  ACCEPTED` (2026-07-18):** additive migration `db/65_ordem_compra_
  lifecycle_schema.sql` applied and verified in staging
  (`ucrjtfswnfdlxwtmxnoo`) — the three orthogonal dimension columns
  (`status_administrativo`/`status_aceite`/`status_recebimento`) + audit
  columns on `ordens_compra_fio`; new tables `ordem_compra_fio_lancamentos`
  (receipt ledger, empty/no trigger — Phase C), `ordem_compra_eventos`
  (transition audit, `op_eventos`/`usuarios_eventos` pattern),
  `ordem_compra_config` (singleton, `exige_aceite=false`); admin-only RLS
  read/no client writes on all three new tables (db/57/63 grants standard);
  `ALTER TABLE` + the one-time legacy-marking backfill in one transaction
  (binding gap 1, ratified). **Scope ambiguity surfaced and resolved before
  implementation:** the order's bullet list omitted the
  `ordem_compra_fio_lancamentos` ledger table even though its own scope
  citation (spec §8's Phase A row) required it — asked the architect, who
  selected "include it." **HARD STOP ZERO passed:** the project-scoped
  `supabase-legacy` MCP was fingerprinted (`usuarios_eventos=9`,
  `document_link_revisions=8` — matching the `M3` closeout's legacy-only
  row counts exactly) confirming it is pinned to `ucrjtfswnfdlxwtmxnoo`
  (development), not `gqmpsxkxynrjvidfmojk` (production), before any write.
  **Verification:** 14/14 checks in a `BEGIN…ROLLBACK` synthetic matrix
  (legacy backfill mapping, new-order defaults, config default, events-
  table role matrix — anon `42501` / non-admin `0` rows / admin reads —
  and all five dimension `CHECK` constraints), cleanup confirmed zero.
  **Tests:** `tests/ordem-compra-lifecycle-schema.smoke.js` 12/12; full-
  suite regression via file-swap (new test file moved aside, then
  restored) — before `3830`/`3690` pass/`140` fail, after `3842`/`3702`
  pass/`140` fail, exactly `+12` new passing tests, the 140 pre-existing
  failures byte-identical. **New branch discipline (binding going
  forward):** branch `dev` created from `work/g28-document-qualification`'s
  HEAD (`84e2a07`) — all implementation commits land here; `git push
  production dev` is a standing remote-backup authorization (never
  `main`). **Technical commit:** `fb0e6cb` ("Add ordem de compra lifecycle
  schema (Phase A)", `db/65_ordem_compra_lifecycle_schema.sql` +
  `tests/ordem-compra-lifecycle-schema.smoke.js`), on `dev`. **No RPC, no
  UI, no JS change** — Phases `B`-`E` remain `NOT AUTHORIZED`, each pending
  its own order. **No production access** (`gqmpsxkxynrjvidfmojk` not
  touched, confirmed by the MCP fingerprint above). Full detail:
  `docs/ledgers/G28_LEDGER.md` Phase `A` entry,
  `docs/reports/ORDEM_COMPRA_PHASE_A_2026-07-18.md`. **Next authorizable
  action:** Phase `B` (panel visibility + administrative writes), its own
  order per spec §8.
- **`M10` CUTOVER CLOSEOUT — `G28-MIGRATION-TRACK` (M0-M10) `COMPLETE / CLOSED`,
  backlog freeze `LIFTED` (2026-07-18):** docs-only closeout recording an
  already-accomplished cutover. **The system is LIVE IN PRODUCTION** at
  `inttracker-jade.vercel.app` (Vercel, from `inttexsystem/inttracker`) against
  Supabase `gqmpsxkxynrjvidfmojk` with migrated data, deployed Edge Functions,
  repointed client config, and a repointed Ingestor. **Phases recorded:** `M4` (Edge
  Functions deployed by the architect), `M5` (`js/config.js` repoint + environment
  split restored, commits `75c4ab6`/`1e17087`/`f369964`), `M6` (Vercel static deploy
  live, `5416128`/`aa77612`, Root Directory defect cleared), `M10` (cutover) — all
  `CLOSED / ACCEPTED`; **`M7` (formal smoke) and `M9` (backup repoint + first real
  run) — `SUPERSEDED BY REALITY`** (live-serving is the de-facto smoke; the production
  backup was never stood up — folded into `CAMADA3 BK5-BK8`, **no proven production
  backup exists**). Recorded honestly, no fabricated closeouts. **Final environment:**
  production = `gqmpsxkxynrjvidfmojk` on `inttexsystem/inttracker` via Vercel;
  development/legacy = `ucrjtfswnfdlxwtmxnoo` (retained, now the development database +
  historical record for the `M3`-excluded audit trails/test rows);
  `bhgifjrfagkzubpyqpew` remains `PROHIBITED` and **never accessed**. **Backlog freeze
  LIFTED** (was scoped "until after cutover (`M10`)") — new fronts authorizable again,
  each by its own order. **`POST-LAUNCH DEBT REGISTER` consolidated into a single
  ranked list** in `PROJECT_STATE.md`; #1 = **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`, an
  ACTIVE PRODUCTION BLOCKER** (expired Google OAuth token → no documents entering the
  live system; fix = interactive token refresh, coupled to
  `CAMADA3-OAUTH-GRANT-COUPLING`). **Mystery branch resolved (read-only, not deleted):**
  `v0/administrativointtex-9166-cf89b1d8` on the `production` remote points at our own
  commit `75c4ab6`, has zero unique commits (`5 0` vs `main`), is a strict ancestor of
  `main` — a Vercel/v0 import artifact, not foreign content. **Record (this commit):**
  `PROJECT_STATE.md` + this handoff entry + `docs/ledgers/G28_LEDGER.md` `M10` entry.
  **Docs-only; no code/schema/Supabase/Vercel action by Claude; no production access.
  Push:** authorized + executed to `production/main` ("Close migration track and lift
  backlog freeze"). **Standing reminder:** flip the Supabase MCP back to read-only.
  **Next authorizable action:** any new front by its own order — highest-priority
  standing item is the active ingestion blocker (#1).
- **`M8` (Documents Ingestor repoint → `gqmpsxkxynrjvidfmojk`) — `CLOSED /
  ACCEPTED` (2026-07-18, out of numeric sequence by direct architect order):**
  the Documents Ingestor was still writing to legacy `ucrjtfswnfdlxwtmxnoo` while
  the live production project received no documents. Configuration phase — no
  schema changes, no Supabase writes issued by Claude, no production access.
  **Two installations repointed** (both `.env` gitignored): the in-repo
  `services/documents-ingestor/` copy and the standalone operational twin at
  `D:\OneDrive\Programação\Ravatex\documents-ingestor\` (the copy the
  `Ravatex-DocumentScanWatcher-Staging` Task Scheduler entry runs). **Surfaces
  changed:** both `.env` (`SUPABASE_URL` + `SUPABASE_PROJECT_REF` → new project;
  `SUPABASE_SERVICE_ROLE_KEY` → the new-format `sb_secret_` key **pasted by the
  architect directly**, never seen/logged/committed by Claude — even a 3-char
  key-prefix print was blocked by the auto-mode classifier and abandoned; the
  twin's Google OAuth creds + `RAVATEX_CNPJS` preserved untouched via in-place
  `.*`-pattern substitution that never echoed the old legacy or Google secrets);
  both `Start-DocumentScanWatcher.ps1` guards (`$ExpectedProjectRef` → new project,
  message "staging"→"target" — the guard self-refuses to start on mismatch, so
  repointing `.env` alone would have bricked the scheduled watcher); both
  `SUPABASE_WRITER_RUNBOOK.md` (reworded "Staging Only / `ucrjtfswnfdlxwtmxnoo`" →
  "Sanctioned Target Project Only / `gqmpsxkxynrjvidfmojk`", cutover-durable).
  Hermetic tests referencing the legacy ref left untouched (fixtures, `§20`).
  **Schema compatibility verified live** (read-only): every table/RPC the Ingestor
  writes exists in the new project with correct `service_role` grants — nothing
  missing. **Repoint verified by a real watcher cycle** (`--once
  --confirm-real-google --confirm-supabase-write`): the Ingestor authenticated to
  the new project with the new key and **all five writes landed** (request
  `f3c3647e` requested→claimed→running→failed, linked to scan run `e9287e0e`
  `triggered_by=service_role_cli`), zero `migration_XX_required`/schema-cache
  errors — Supabase-layer repoint **proven**. But the Gmail scan failed at
  `invalid_grant` (expired Google OAuth token, 0 documents), so the full
  Gmail→Drive→DB document demonstration is **deferred by architect decision**
  (`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`, gated on the interactive Google token
  refresh — architect's action, coupled to `CAMADA3-OAUTH-GRANT-COUPLING`, the same
  OAuth client the backup exporter reuses; a fresh scan request must be seeded since
  the migrated one was consumed as `failed`). **Two order claims corrected against
  live evidence, both architect-withdrawn:** the named CI file
  `.github/workflows/ingestor-ci.yml` does **not exist** in either repo (nothing
  deleted); the `document_scan_runs` RLS-off/anon-INSERT hole (`PRODUCTION-SECURITY-01`)
  was **disproven live** (RLS enabled, `is_admin()`-gated, zero anon grants; all
  `document_*` siblings share the safe shape) and **not registered** (refused to
  record a canonical entry on a false premise; the architect affirmed the refusal as
  the standard). **The real finding, registered:** `ANON-GRANT-DEFENSE-IN-DEPTH` —
  27 non-document `public` tables carry raw table-level `anon INSERT/UPDATE/DELETE`
  grants, inert today only because RLS policies evaluate false for unauthenticated
  sessions (grants and policies disagree — no second line of defence); pre-existing,
  faithfully migrated; separate `NOT AUTHORIZED` first-week candidate cross-referenced
  to `IS-ADMIN-ACL-REVIEW`, **not merged**. **Drive/OAuth unchanged** (ruling #4);
  `CAMADA3-OAUTH-GRANT-COUPLING` stands. **Record (this commit):** `PROJECT_STATE.md`
  (`M8` `CLOSED / ACCEPTED` in Active phase + Migration governance + environment facts
  + Closed-phases row; `ANON-GRANT-DEFENSE-IN-DEPTH` + `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED`
  registered); this handoff entry; `docs/ledgers/G28_LEDGER.md` `M8` entry (full
  detail). The two `.env` edits are gitignored (not committed); the standalone twin's
  `.ps1`/runbook edits live in that separate repo. **No Supabase writes by Claude**
  (the watcher wrote via the Ingestor's own service_role key; all Claude MCP calls
  read-only); **no production access** (`bhgifjrfagkzubpyqpew` untouched); **no push**
  (not authorized by this order — the standing MCP-write→read-only flip reminder also
  persists). **Next authorizable action:** an individual order for `M4` (Edge Functions
  + secrets) or any `M5`-`M10` phase; plus `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` once the
  Google token is refreshed.
- **`M3` (production data migration into `gqmpsxkxynrjvidfmojk`) — `CLOSED /
  ACCEPTED` (2026-07-17):** production data copied from legacy
  `ucrjtfswnfdlxwtmxnoo` into `gqmpsxkxynrjvidfmojk` (executed earlier in this
  working session); this closeout re-verified everything live and applied one
  architect-ordered data correction. **Re-verified at closeout:** auth remap —
  **24 rows, single column** (`document_scan_requests.requested_by_user_id`,
  all remapped to the single surviving admin `auth.users` row); FK integrity —
  dynamic per-constraint orphan scan across every single-column FK in `public`,
  **76 relationships checked, 0 orphans** (13 reference `auth.users` directly,
  all clean); sequence resync — **10/10** populated sequences' `last_value`
  matches `MAX(id)` of their owning table exactly. **Exclusion set (test/
  synthetic data, by row-count diff legacy vs new):** `clientes`(2),
  `fornecedores`(1), `lotes`(8), `op_fornecedores`(2), `op_itens`(2), `ops`(6),
  `ordens_compra_fio`(8), `precos_terceirizada`(1), `usuarios`/`auth.users`(9),
  `pedidos`(3), `pedido_itens`(2), `op_eventos`(1), `document_candidates`(3) —
  not carried over; the new database is intentionally smaller than legacy, not
  incompletely migrated. **Architect ruling (a), binding:**
  `usuarios_eventos` excluded entirely (0 rows in the new project vs 9 in
  legacy) — remapping `ator_id` would fabricate audit history, attributing
  actions to an actor who never performed them in the new project; legacy
  retains the original trail as the historical record, the new project's
  audit trail starts empty and truthful from cutover. Same reasoning extends
  to `document_link_revisions`/`document_link_revision_ops` (8/10 rows,
  actor-keyed canonical history) — excluded for the identical reason.
  **Architect ruling (b), binding:** `parametros_largura` overwritten from
  legacy — the `db/04` seed (`peso_linear` 1.5000/2.2500, `valor_x` 1.0000)
  is a bootstrap default, not real data; the legacy project's live-tuned
  configuration is real operational data by the same standard as
  `clientes`/`modelos` and supersedes the seed. **Applied this closeout**
  via `UPDATE public.parametros_largura` against `gqmpsxkxynrjvidfmojk`,
  matched by `largura`: `1.40`→`peso_linear=0.3360`,
  `algodao_por_ml=0.226000`, `poliester_por_ml=0.110000`, `valor_x=0.5000`;
  `2.10`→`peso_linear=0.5370`, `algodao_por_ml=0.366000`,
  `poliester_por_ml=0.171000`, `valor_x=0.5000` (both previously the `db/04`
  seed values). **Legacy retention (binding, registered this closeout):**
  `ucrjtfswnfdlxwtmxnoo` retains the original audit trail
  (`usuarios_eventos`/`document_link_revisions`/`document_link_revision_ops`)
  and the excluded test/synthetic rows — it is the historical record for both
  and **must not be deleted or pruned without a separate, explicit architect
  decision.** **`backup_runs`/`backup_run_destinations` observation:** the new
  project carries 2/4 rows in these tables even though legacy's (older)
  schema never had them — this data originates from post-`M2` activity
  against `gqmpsxkxynrjvidfmojk` itself, not a legacy migration; flagged for
  completeness, no action taken. **Record (this commit):**
  `PROJECT_STATE.md` (`M3` `CLOSED/ACCEPTED` in Active phase + Migration
  governance entry + environment facts + Closed-phases row; next action →
  `M4`); this handoff entry; `docs/ledgers/G28_LEDGER.md` `M3-DATA` entry
  (full detail). **No production access; legacy read-only, no writes beyond
  the ordered `parametros_largura` correction on the new project.** **Next
  authorizable action:** an individual order for `M4` (or any `M5`-`M10`
  phase).
- **`M2` (schema replay `db/01→db/64` into `gqmpsxkxynrjvidfmojk`) —
  `CLOSED / ACCEPTED` (2026-07-17):** the ratified authoritative source (repo
  `db/`, ordered `db/01→db/64`, skipping `*.verify.sql`; `setup_completo.sql`
  and `supabase db push` forbidden) was replayed into the sanctioned target one
  migration at a time via the Supabase MCP `apply_migration`, each registered in
  the migrations registry under its canonical file-stem name and verified after
  each — **64/64 applied, zero errors, nothing skipped/patched/reordered.**
  **HARD STOP ZERO passed** before any write: `get_project` returned
  `ref=gqmpsxkxynrjvidfmojk` (name "Inttex"), virgin pre-state `public`=0 tables /
  registry=`[]` / buckets=0. **MCP surface change:** at `M1` the MCP was a
  project-scoped read-only server; for `M2` the architect flipped it to write and,
  on reconnect, it resolved to the **management-scoped** Supabase server (tools
  now take an explicit `project_id`; toolset includes `create_project`/
  `deploy_edge_function`) — every `M2` write targeted `project_id=
  gqmpsxkxynrjvidfmojk` and nothing else. **Data-writing ruling:** mid-replay the
  auto-mode classifier denied the `db/04` data-seed write; the architect ruled
  **Option 1 (faithful `01→64`, no file skipped, data-writing applies within
  `db/01-64` authorized)** and **corrected gate 4d** from "all row counts 0" (a
  wrong premise — some migrations seed reference/configuration data by design) to
  "row counts match exactly what the faithful replay produces; report the residual
  per table with origin; genuine test data that survives is reported, not deleted."
  **Post-replay gate:** (4a) registry = **64 entries, order `01→64`, canonical
  names**; (4b) parity vs staging **NOT EXECUTABLE** — the reconnected
  management-MCP credential is permission-denied on `ucrjtfswnfdlxwtmxnoo`
  (`execute_sql` → "You do not have permission"); reported as a tooling limitation,
  the new project's absolute profile (40 public tables / 0 views / 53 functions /
  67 RLS policies / 9 triggers / 0 buckets) stands, consistent with the R1
  diagnosis's ~40-public-tables staging finding; (4c) ACL spot-checks **faithful** —
  `is_admin_full` + backup-writer RPCs (`db/64`) + evidence-writer (`db/49`) =
  service_role/postgres only (their `REVOKE service_role`/`authenticated` intents
  landed), document-scan RPCs + `decidir_documento` (`db/38`) = authenticated
  (admin-gated internally), and `is_admin()` broad
  (PUBLIC/anon/authenticated/service_role) is the **pre-existing
  `IS-ADMIN-ACL-REVIEW` debt reproduced faithfully from `db/02`/`db/05`**, not a
  replay defect; (4d, corrected) **sole residual `parametros_largura`=2** —
  width-calc **configuration** seeded by `db/04`, kept by `db/10`/`db/11`; every
  `db/04` **test** cadastro (cores/fornecedores/modelos/precos) was inserted then
  **wiped by `db/10`** (confirmed 0), `op_numeros`=0 (backfill from empty `ops`),
  all else 0 — **no genuine test data survived; nothing deleted**; (4e) storage
  buckets = 0. **Fidelity note:** a handful of very large files had only their
  leading `--` comment header condensed in the pasted `apply_migration` query; all
  executable DDL (tables/columns/constraints/indexes/RLS/functions/grants) was
  byte-faithful — `db/53` kept verbatim because `db/55` repairs it via an exact
  function-body string match (its precondition matched, proving fidelity).
  **Report:** `docs/reports/M2_SCHEMA_REPLAY_VERIFICATION_2026-07-17.md`. **No
  production access** (`bhgifjrfagkzubpyqpew` never touched); staging only
  read-attempted for parity (denied), never written. Docs record commit pushed to
  `production/main` under this order's `M`-track authorization. **Standing
  reminder for the architect: flip the Supabase MCP back to read-only** now that
  `M2`'s write window is closed. **Next authorizable action:** an individual order
  for `M3` (or any `M4`-`M10`).
- **`M1` (new Supabase project verification + sanction —
  `gqmpsxkxynrjvidfmojk`) — `CLOSED / ACCEPTED` (2026-07-17):** read-only
  verification phase (Sonnet 5 / low effort), no writes attempted, one docs
  commit. **Verified via the Supabase MCP:** `list_tables` across
  `public`/`auth`/`storage` returned **zero `public` tables**; `auth` carries
  its stock scaffolding, **23 base tables**, all `0` rows except
  `auth.schema_migrations` (77 stock seed rows); `storage` carries its own
  stock scaffolding (8 tables — `migrations`, `buckets`, `objects`,
  `s3_multipart_uploads(_parts)`, `buckets_analytics`, `buckets_vectors`,
  `vector_indexes`), `buckets`/`objects` both `0` rows. `list_migrations` →
  `[]` (0 rows in the migrations registry). `execute_sql
  select count(*) from storage.buckets` → `0`, cross-checking `list_tables`'s
  row count. **No table/migration/bucket found → no HARD STOP.**
  **Identification evidence — stronger than the order anticipated:** the
  order expected only "config URL pins the ref, profile is consistent" as
  available evidence, with an honest caveat that the toolset "cannot read
  the ref directly." That caveat does **not** hold: `claude mcp list` prints
  the live connection URL, `https://mcp.supabase.com/mcp?
  project_ref=gqmpsxkxynrjvidfmojk&features=database&read_only=true` —
  the project ref and the `read_only=true` flag are **both directly visible**
  in the MCP's own configuration string, not merely inferred from an empty
  profile. This is recorded as a correction to the order's assumed tooling
  limit, not a deviation from it. **Record (this commit, per the order):**
  `PROJECT_STATE.md` — `M1` marked `CLOSED / ACCEPTED` in "Active phase" and
  given its own entry under "Migration governance"; the staging-only boundary
  amended (writes to `gqmpsxkxynrjvidfmojk` authorized only within
  explicitly ordered `M`-track phases — `M2`, `M3`, `M4`, `M9`;
  `ucrjtfswnfdlxwtmxnoo` becomes read-only legacy, `M3`'s exporter/export-read
  path excepted; `bhgifjrfagkzubpyqpew` remains PROHIBITED, untouched);
  environment facts updated (Supabase target line, MCP evidence line); "Closed
  phases" index gained the `M1` row; next authorizable action advanced to
  `M2`. This handoff entry. Ledger entry. **No Supabase write; no production
  access; no push beyond this docs commit to `production/main` (single-track
  scope authorized by this order).** **Next authorizable action:** an
  individual order for `M2` or any other `M3`-`M10` phase.
- **`M0` (repository migration — push to `inttexsystem/inttracker`) — `CLOSED /
  ACCEPTED` (2026-07-17):** single-use explicit push authorization, git-only phase.
  Pre-flight clean (tree clean; HEAD = the Compaction-B commit `7b2ab7d`; sensitive
  paths ignored; tracked-file secrets sweep clean — the only `eyJ` hits are the
  pre-existing public `anon` keys in `js/config.js`, confirmed via isolated
  `role`-claim decode, not `service_role`/`sb_secret`). Added remote `production` =
  `inttexsystem/inttracker`; `git fetch`/`ls-remote` confirmed it empty before push.
  Pushed `work/g28-document-qualification:main`, no force/tags/other branches.
  Post-push `git rev-list --left-right --count production/main...HEAD` = **`0 0`**.
  **753 commits** pushed (749 at diagnosis time + 4 subsequent docs commits — canon
  corrected). `origin`/`staging` remotes untouched; `staging` now historical backup
  only. Recorded in `PROJECT_STATE.md` ("Migration governance" `M0` entry + updated
  environment facts) and the ledger. **Next authorizable action: `M1`** (new Supabase
  project provisioning), its own order.
- **`PROJECT-STATE-COMPACTION-B` + pre-migration decisions — `CLOSED / ACCEPTED`
  (2026-07-17):** `PROJECT_STATE.md` recompacted to current-state-only
  (**803→301 lines**); the 2026-07-17 Camada-2/Camada-3 subphase closeout narratives,
  the superseded Publication Criterion (`G28-GOVERNANCE-CONSOLIDATION-A`), the
  `UI-ACTION-BUTTON`/`UI-GRID-TEXT-OVERFLOW` track narratives, and the resolved
  test-baseline note were moved **verbatim** to
  `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (new `PROJECT-STATE-COMPACTION-B`
  batch divider); condensed rulings + one-line pointers remain in `PROJECT_STATE.md`,
  and the "Closed phases" index collapses the 2026-07-16 / 2026-07-15-and-earlier eras
  into two pointer rows (all SHAs retained). This handoff was **not** compacted.
  **Four architect decisions recorded** in `PROJECT_STATE.md` "Binding decisions in
  force" (a-c) and "Environment standing facts" (d): (a) **key regime = new format**
  (`sb_publishable_` + matching secret key, standardized across config/scripts/
  Ingestor/tests; secret key never in chat/repo); (b) **launch user model =
  full-trust admins only** (no `somente_leitura` admin in production until
  `A2-SERVER-SIDE-ENFORCEMENT` closes — the constraint IS the mitigation; A2 items
  rank FIRST-WEEK); (c) **standing pre-launch items** = `DELETE-PROD-GUARD-A`, backup
  trigger via GitHub Actions + `BK7` runbook, and the auth-restore rehearsal into a
  throwaway Supabase project before `M3`; (d) **MCP configured + verified against
  `gqmpsxkxynrjvidfmojk`, read-only, token outside the repo** (environment fact).
  Docs-only, single commit, no push.
- **`PRODUCTION-READINESS-DIAGNOSIS-R1` ratified + `BACKLOG FREEZE` —
  `CLOSED / ACCEPTED` (2026-07-17):** the architect authorized a read-only
  whole-system migration diagnosis (move to a new repo + new Supabase project +
  Vercel, then deploy) and, on delivery, ratified it. **Docs-only closeout** —
  no code, no push, no production access. Outcomes recorded in canon:
  (1) the diagnosis is a **ratified reference report**
  (`docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`, precedent
  `BACKLOG_RECONCILIATION_R1`); (2) the **publication criterion is amended** —
  publication proceeds with Camada 3 at `BK4.2`, remaining Camada-3 scope +
  the two `PRE-PUBLICATION` asterisks become `POST-LAUNCH DEBT` with production
  consequences, the reviewer objection (minimum pre-launch set) recorded and
  **overruled**; (3) a **`BACKLOG FREEZE`** is in force — no new fronts until
  after cutover (`M10`); only the `M0`-`M10` plan and the canonical residual
  risk register are authorizable; (4) the **residual risk register (12 items,
  ranked)** is now canonical (report §4, mirrored in `PROJECT_STATE.md`);
  (5) the **`M0`-`M10` migration plan** is the active track, every phase
  `NOT AUTHORIZED` pending its own order; (6) canon corrected: branch commit
  count is **749**, not "~555". **Target coordinates (all new, empty):** GitHub
  `inttexsystem/inttracker`, Supabase `gqmpsxkxynrjvidfmojk` (new-format
  `sb_publishable_…` key supplied), Vercel `vercel.com/inttex`. A separate tiny
  technical commit first added `supabase/.temp/` to `.gitignore` (the 8 untracked
  CLI-cache files leaked the project ref + pooler URL, and `M0` will push 749
  commits). **Next authorizable action:** an individual order for `M0` (new repo
  landing — full-history push) or any `M0`-`M10` phase. Full detail:
  `docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`.
- **`BK4.2` (the exporter — first real execution + restore-smoke) —
  `CLOSED / ACCEPTED` (2026-07-17):** the exporter's code
  (`scripts/backup/export-db.mjs` + `scripts/backup/lib/*`, commits
  `4831ca3`/`75f8ff9`/`153b2a2`/`51c4633`/`e11d05e`) was already
  committed to this branch prior to this closeout. This entry records
  the architect-authorized order to (1) determine which OAuth client
  the successful real run actually used, read-only, before closing,
  and (2) close `BK4.2` with the resolved answer, the restore-smoke
  evidence, a contract note on bundle secrecy, and the state of
  `CAMADA3-DRIVE-ACTIVATION`/`CAMADA3-TRIGGER-SELECTION`. **No new code
  was written in this closeout** — verification-only, followed by a
  docs-only commit.
  **Claim verification (a third-party relay via ChatGPT reported
  success — verified independently before trusting it, per this
  project's own supervision rule that ChatGPT has no state custody):**
  bundle `backups/ravatex-backup-20260717T171339Z.tar.gz` on disk, its
  independently recomputed SHA-256
  (`dab5bb03422e3662af471d30d77091f98afb7199199897e7f6f1c22a13977c2`),
  and the live `backup_runs`/`backup_run_destinations` rows in staging
  (`ucrjtfswnfdlxwtmxnoo`) all matched exactly — `backup_runs.id =
  ae55e714-3f58-49b0-957d-7b959de7b630`, `status=completed`,
  `bytes=83378`, `google_drive=ok` (`uploaded_at` recorded),
  `onedrive=skipped`. The `row_count_manifest` matched the reported
  highlights exactly (`auth.users=10`, `auth.identities=8`,
  `public.usuarios=10`, `public.ops=8`, `public.pedidos=4`,
  `storage_buckets_count=0`). A prior attempt (`backup_runs.id =
  0ab0c04b-...`) failed with `invalid_grant: Token has been expired or
  revoked` — a stale previously-copied token, not a client/credential
  mismatch — retained as legitimate history, not remediated.
  **Restore-smoke drill performed and passed (mechanism proof; not yet
  `BK8`'s formalized/repeatable cadence):** a permission check correctly
  blocked a first attempt to `head` the extracted `auth_full.sql` (which
  would have printed real password hashes/session data from staging
  into this transcript) — every subsequent check used structural greps
  or `count(*)`/boolean queries only, never row content. Spun up an
  isolated local scratch PostgreSQL 18.4 cluster (ephemeral port, temp
  data dir, never staging/production); restored `auth_full.sql` →
  `schema_public.sql` → `data_public.sql`, **zero errors** across all
  three (no extension/role dependencies — the `--no-owner
  --no-privileges` dumps are self-contained). Compared **all 63
  restored tables** (40 `public` + 23 `auth`) against the bundle's own
  manifest: **63/63 match, 0 mismatches**, `auth.identities=8`
  explicitly confirmed — this is the concrete resolution, in mechanism,
  of the `auth.identities` restore-fidelity gap the original diagnosis
  (`G28-CAMADA-3-DIAGNOSIS-R1`) flagged against the pre-existing
  `auth.users`-only runbook. Referential integrity: `0` orphaned
  `auth.identities`, `0` orphaned `public.usuarios`→`auth.users` FK
  rows (`CODE_HEALTH_RULES.md` §11's invariant, cross-schema);
  all 10 users carry a non-empty password hash (structural proof a real
  login is possible — no actual login attempted, since that needs a
  real password not handled in this pass); canonical history intact
  (`document_link_revisions=8`, `usuarios_eventos=9`). Scratch cluster
  stopped and every extracted/temp file (real staging credentials)
  removed immediately after verification — nothing persisted.
  **OAuth client — resolved via Google's own infrastructure, not
  inferred:** two different OAuth client JSON files existed locally in
  `.ravatex-local/` (the Documents Ingestor's own client,
  `...eh26scjc...`, and an apparently-unused second one,
  `...9v4j8gv9...`, dated 2026-07-11, predating today's reuse decision
  — likely a leftover from `BK4.2`'s originally-designed dedicated
  grant). The one logged manual `login` attempt used the Ingestor's
  client but failed ("No code received"); no log captured the
  successful token's origin. Resolved definitively by calling Google's
  own `https://oauth2.googleapis.com/tokeninfo` endpoint against the
  successful run's still-valid access token (a read-only introspection
  needing only the access token, never a client secret): both `aud` and
  `azp` resolved to `334691504707-eh26scjcmgetfrmfsc2ndgi8de6kdb07
  .apps.googleusercontent.com` — confirmed against the Documents
  Ingestor's own `.env` at the separate, standalone repo
  `D:\OneDrive\Programação\Ravatex\documents-ingestor\` (unrelated to
  this repo's `services/documents-ingestor/` copy). **The successful
  run reused the Ingestor's OAuth client, not a dedicated grant** —
  contradicting `CAMADA3_BACKUP_CONTRACT.md` §4's original premise.
  **Registered live debt, `CAMADA3-OAUTH-GRANT-COUPLING`, `NOT
  AUTHORIZED`:** rotating/revoking the Ingestor's OAuth grant would also
  break backups; architect must decide to formalize the reuse (rewriting
  §4) or build a genuinely separate client. **Contract amended**
  (`docs/architecture/CAMADA3_BACKUP_CONTRACT.md`): §4 now carries a
  dated amendment recording this finding in full; §6 gained a binding
  "bundle contents are secrets" rule (drills inspect structure/counts
  only, never row content; bundles gitignored, never committed); the BK
  sequence table and status banners updated to `BK4.1`/`BK4.2 = CLOSED /
  ACCEPTED`; a full "Amendment 2026-07-17" section added before
  `STRUCTURAL POLICY COMPLIANCE`. **Registered:**
  `CAMADA3-DRIVE-ACTIVATION` — partially exercised (one real upload
  succeeded) but `NOT AUTHORIZED` as a standing/repeated capability
  (`BK5`/`BK6`/trigger/OAuth-coupling all still pending);
  `CAMADA3-TRIGGER-SELECTION` — still deferred, unchanged. **No
  Supabase writes beyond the two already-recorded runs; no push; no
  production access.** Documentation commit only, per the order.
  **Next authorizable action:** `BK5` (read-only UI panel +
  manual-trigger write), own order, mockup gate first — or resolution of
  the OAuth-coupling decision, which several later subphases may want
  settled first. Full detail: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`BK4.1` (`backup_runs` schema) — `CLOSED / ACCEPTED` (2026-07-17):**
  per `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`. Technical commit
  `d39a848` — `Add backup runs schema` (`db/64_backup_runs_schema.sql`,
  `tests/backup-runs-schema.smoke.js`). **Two new tables:**
  `public.backup_runs` (append-only run record — `started_at`,
  `finished_at`, `status` `running|completed|failed`, `scope` locked to
  the single ratified value `'public+auth'` via CHECK, `bytes`, `sha256`
  format-checked, `row_count_manifest` JSONB object-checked,
  `triggered_by` `scheduled|manual`, `retention_class` `gfs|manual` —
  kept as a field distinct from `triggered_by` since a scheduled run can
  still be pinned `manual` retention by operator decision) and
  `public.backup_run_destinations` (child table, one row per
  `(run_id, destination)`, `ON DELETE CASCADE`; `status`
  `pending|ok|failed|skipped`; `ok` requires `uploaded_at`, `failed`
  requires `error`). **Destination-model decision (per the order's
  request for justification): child table, not a JSONB column** — makes
  "Drive OK / OneDrive skipped" a first-class row rather than a parsed
  blob, matches the contract's per-destination status/last-error
  requirement directly. **`destination` is deliberately an open `TEXT`
  field with only a non-empty/lowercase format check, no `CHECK` enum**
  (contract §4 explicitly demands N-destination extensibility without
  schema rework — adding OneDrive must never require a migration) — this
  is the one deliberate asymmetry against `scope`, which IS `CHECK`-locked
  to the single value `'public+auth'` (the contract treats any scope
  change as its own gated revision event, unlike destinations). **Writer
  path:** two `service_role`-only RPCs, `iniciar_backup_run`/
  `finalizar_backup_run`, mirroring `db/38`'s
  `iniciar_document_scan_run`/`finalizar_document_scan_run` two-phase
  shape and `db/49`'s internal `auth.role() = 'service_role'` gate (not
  relied upon via `GRANT` alone — the exporter has no JWT, same
  authorization path as the admin Edge Functions).
  `finalizar_backup_run` writes the terminal run row **and** every
  `backup_run_destinations` row for that run in one call/transaction — a
  malformed destination element aborts the whole call (intentional
  fail-loud behavior; this writer is internal-only, its sole caller is
  the future exporter). **RLS/ACL:** admin-only `SELECT` on both tables,
  **no `INSERT`/`UPDATE`/`DELETE` policy for any client role on either
  table** (append-only intent enforced structurally, stricter than
  `db/38`'s admin-`FOR ALL` precedent — even an admin session cannot
  write directly; only the `SECURITY DEFINER` RPCs, which write as table
  owner and bypass RLS by ownership, not by a permissive policy). Full,
  explicit ACL stated in the migration itself (`db/57`/`db/63` standard):
  `REVOKE ALL` from `PUBLIC`/`anon`/`authenticated`/`service_role` on
  both tables, `GRANT SELECT` to `authenticated` only (admin-gated by
  RLS); `REVOKE ALL` from `PUBLIC`/`anon`/`authenticated` on both RPCs,
  `GRANT EXECUTE` to `service_role` only. **Staging (`ucrjtfswnfdlxwtmxnoo`,
  confirmed via `usuarios.nivel_acesso`/`db/62` fingerprint): applied and
  verified.** Registry `20260717125153 / 64_backup_runs_schema`
  (pre-state clean — neither table existed). **Role-matrix verification
  (`BEGIN…ROLLBACK`, synthetic, cleanup zero — confirmed `0` rows in both
  tables post-rollback):** anon `SELECT` → `42501`; non-admin
  authenticated `SELECT` → `0` rows (RLS); admin authenticated `SELECT` →
  reads correctly; anon/admin-authenticated calling either RPC directly →
  `42501` (only `service_role` has `EXECUTE`); `service_role` DB role with
  a **mismatched** JWT `role` claim → internal gate still fires
  (`writer_required`) — proves the internal check is not redundant
  dead code layered under the `GRANT`; `service_role` (DB role + aligned
  JWT claim) opens a run, finalizes it `completed` with **two destination
  rows in one call (`google_drive:ok` + `onedrive:skipped`)** — read back
  correctly by an admin session, exact match; a second run finalized
  `failed` with one `failed` destination — also correct; double-finalize
  of an already-`completed` run → graceful `run_not_running_or_not_found`,
  not a crash; `finalizar_backup_run`'s three graceful-error branches
  (`error_required_when_failed`, `row_count_manifest_invalid`,
  `destinations_invalid`) all fire correctly on malformed input;
  `service_role` attempting a **raw** table write (bypassing the RPC) →
  `42501` (service_role has zero direct table grant); admin authenticated
  attempting `UPDATE`/`DELETE` on either table → `42501` (append-only
  intent holds even for an admin session). **17/17 checks passed.**
  **Tests:** `tests/backup-runs-schema.smoke.js`, 17/17 (static
  assertions — columns/defaults, all `CHECK` constraints, the
  `scope`-locked-vs-`destination`-open asymmetry, RLS/grants completeness,
  both RPC signatures/gates/validation branches, no destructive DDL/no
  secrets, `db/62`/`db/63` non-regression). Purely additive change (two
  new files, zero existing files modified) — **134 pre-existing failures
  unchanged by construction** (documented flakiness class, unrelated to
  this phase), `+17` new tests all passing, full suite `3792` tests /
  `3658` pass. **Forbidden and honored:** no exporter (`BK4.2`), no UI
  (`BK5`), no retention pruning (`BK6`), no CI config, no production, no
  push. **Next authorizable action:** `BK4.2` (the exporter), own order —
  its own risk gate per the contract (DB credential + `auth`-schema
  handling). Full detail: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`G28-CAMADA-3-DIAGNOSIS-R1` (read-only diagnosis) + `BK3` (backup
  contract) — `CLOSED / ACCEPTED` (2026-07-17):** the architect authorized
  a read-only diagnosis of `G28-CAMADA-3` (automated backup — the second
  half of the publication criterion, `G28-GOVERNANCE-CONSOLIDATION-A`),
  mirroring the `G28-CAMADA-2` diagnosis approach. Sources: the master
  plan's CAMADA 3 section (`BK1-BK8`), the existing manual runbook
  (`docs/BACKUP_AND_RESTORE.md`), the live repo/schema state, and
  `SGAA_clean_baseline`'s backup subsystem (read-only, functional/UX
  reference only — same caveat discipline as Camada 2: stack-specific
  engine/scheduler/restore assumptions rejected, only information
  architecture borrowed). Findings, verified against live staging
  (`ucrjtfswnfdlxwtmxnoo`, confirmed by the presence of `usuarios.
  nivel_acesso`/`db/62`): 0 Supabase Storage buckets/objects (document
  bytes are Drive-first, Postgres holds only pointers); `public` schema
  now ≈40 tables (38 confirmed live base tables), `auth` schema has 23
  base tables (not just `auth.users`); `pg_cron`/`pg_net`/`http` are
  available but not enabled; only 14 of 63 migrations are recorded in
  `supabase_migrations.schema_migrations` (partial/unreliable — the repo's
  `db/*.sql` remains the authoritative schema source); append-only
  canonical history confirmed present (`document_link_revisions`=8,
  `document_link_revision_ops`=10, `usuarios_eventos`=9). **Architect
  ratified the diagnosis "as reported"** and issued three scope/trigger/
  destination decisions (see `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`,
  "Architect decisions incorporated"): (1) scope = `public` data + the
  **full `auth` schema** (not just `auth.users` — a restore without
  `auth.identities` cannot log in), document bytes explicitly out of
  scope by design (Drive-first), Storage re-verified as 0 buckets every
  cycle; (2) the automated **trigger is deferred** (GH Actions vs. Vercel
  cron, decided with hosting) — the exporter must be trigger-agnostic,
  self-contained, idempotent, parameterized, invokable by any future
  scheduler or by hand, with zero scheduling logic inside the exporter
  itself (registered `CAMADA3-TRIGGER-SELECTION`, `NOT AUTHORIZED`, blocks
  the "automated" half of the publication criterion); (3) **multi-
  destination by design** (SGAA's per-provider pattern) — Google Drive
  primary, implemented now (reuses the Ingestor's OAuth pattern); OneDrive
  interface-ready, not configured, ships disabled with its wiring in
  place; `backup_runs` and the exporter must never hardcode a single-
  destination assumption. **Order `BK3` (docs-only)** then produced
  `docs/architecture/CAMADA3_BACKUP_CONTRACT.md` (`PROPOSED`, ratified as
  the binding premise for all later subphases): scope (§1), cadence/
  retention — GFS 4-window model, manual backups never expire (§2);
  integrity — SHA-256 + per-table row-count manifest as the restore
  assertion baseline (§3); N-destination contract (§4); the
  trigger-agnostic exporter contract — inputs/outputs/exit codes/
  idempotency/secrets-never-in-repo/`backup_runs` recording (§5); the
  restore SLO + drill contract — monthly + after every migration, scratch
  target only, proof = row counts match + a real login succeeds (proves
  `auth.identities` restored) + append-only history intact (§6); explicit
  limits — production restore never rehearsed against production, account/
  vendor loss out of scope, trigger deferred (§7); and the stale-docs
  finding (`docs/BACKUP_AND_RESTORE.md`/`STAGING_BASELINE.md` describe a
  pre-Documents world — refresh registered as part of `BK7`, not fixed
  here) (§8). **BK1/BK2 closed by the diagnosis; BK3 closed by this
  contract; `BK4.1`-`BK8` and `CAMADA3-TRIGGER-SELECTION` remain `NOT
  AUTHORIZED`, each pending its own order — phases do not chain
  automatically.** No file changed outside this docs-only commit; no
  Supabase write; no production access; no push. **Next authorizable
  action:** `BK4.1` (`backup_runs` schema + service_role writer RPC), own
  order — or `CAMADA3-TRIGGER-SELECTION` if the architect resolves hosting
  first. Full detail: `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **`A3.4` (legacy user screen removal) — `CLOSED / ACCEPTED` (2026-07-17):**
  technical commit `32e466a` — `Remove legacy user screen`; architect
  ratification "ARCHITECT RATIFICATION — A3.4: ACCEPTED". **This closes
  `G28-CAMADA-2` — TRACK `COMPLETE` / `CLOSED / ACCEPTED` in staging**, full
  scope `A1-A7` + password policy (`A1`/`A7` satisfied by the pre-existing
  architecture; `A2.1`/`A2.1-B`/`A2.2`/`A2.3`, `A3.1`/`A3.2`/`A3.4`,
  `A4.1`/`A4.2`, `A5.1-A5.2`/`A5.3-A5.4`, `A6.1`/`A6.1-B`/`A6.2`/`A6.3` all
  `CLOSED / ACCEPTED`). **Reclassification history:** entered this work
  cycle as `PRE-EXISTING PARTIAL CAPABILITY + FULL SCOPE A1-A7 DEFERRED`
  (`G28-RECONCILIATION-DECISIONS-A`, 2026-07-15); exits `CLOSED / ACCEPTED`.
  `screenCadastrosUsuarios` (proven unreachable — zero production call
  sites repo-wide, route already cut over to `window.screenAdminUsuarios`
  since `A3.1`) and its 3 orphaned-only private helpers
  (`friendlyDisableMessage`, `friendlyDeleteMessage`,
  `setCadastrosModalFieldVisibility`) removed from
  `js/screens/cadastros.js` (2742→2184 lines); every helper shared with the
  file's other 6 screens kept untouched.
  `tests/cadastros-usuarios-auth-ui.smoke.js` deleted entirely (38 tests);
  3 sibling tests removed from `tests/admin-delete-user.smoke.js`, 4 from
  `tests/cadastros-screens.smoke.js` (7→6 telas counts corrected
  throughout); `tests/admin-usuarios.smoke.js` test 15 rewritten to assert
  the removal. Verification (isolated per-file, since full-suite parallel
  runs carry unrelated pre-existing flakiness here): exactly -45 tests (all
  intentional), -1 pre-existing failure eliminated (baked into the deleted
  file), zero new failures. **Resolved by deletion:** the `admin-create-user`
  invoke-envelope bug at the legacy `cadastros.js:2659` (identical to the
  already-fixed `UI-INVOKE-ENVELOPE-FIX`), the `checked: mostrarInativos`
  boolean-attribute bug at the legacy `:2348` (same class as
  `UI-EL-BOOLEAN-ATTR-FIX`), and the `TEST-MOCK-FIDELITY-AUDIT` `R3`
  legacy-dead-code coverage gap. **Registered candidates (`NOT
  AUTHORIZED`):** `cadastrosModalGrid` (pre-existing dead helper, unrelated
  to this phase, folded into `CODE-HEALTH-AUDIT-§18-R1`); a second stale
  git-worktree metadata entry (`baseline-check-a34`, same OneDrive-lock
  class as `tapetes-baseline-check`). **Publication criterion status:**
  first half satisfied (`G28-CAMADA-2` `CLOSED / ACCEPTED` in staging) with
  two `PRE-PUBLICATION` asterisks that must close before production
  (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`); second
  half (`G28-CAMADA-3`, automated backup) remains `NOT STARTED`, no spec.
  **Next authorizable action: `ARCHITECT DECISION`** — `G28-CAMADA-3`
  diagnosis (spec `BK1-BK8`), the two pre-publication asterisks, or
  `A6-GLOBAL-AUDIT-VIEW`/`AUDIT-ACTOR-SNAPSHOT`; no single unambiguous next
  technical phase.
- **`A2.2` (modal wiring) + `A2.3` (pilot route enforcement) — `CLOSED /
  ACCEPTED` (2026-07-17):** technical commit `09eb2a0` — `Wire admin access
  level into user admin`; architect visual gate `CONFIRMED`. Closes the
  `G28-CAMADA-2 / A2` track (`A2.1` + `A2.1-B` + `A2.2` + `A2.3`) as
  `COMPLETE`. `js/screens/admin-usuarios-modal.js` — "Nível de acesso" select,
  edit-only (hidden via `display:none` for fornecedor/cliente, same
  convention as `wrapperForn`/`wrapperCli`). **HARD STOP honored:**
  `admin-create-user`'s fixed-column `INSERT` never carried `nivel_acesso`,
  so the field is not rendered on create and never sent in the create
  payload — a new admin lands at the schema default (`completo`) and its
  level is set via a follow-up edit (`updateUsuario` is a raw PostgREST
  update, allowed by `is_admin()`-based RLS). Grid badge
  (`js/screens/admin-usuarios.js`): quiet `"Admin · leitura"` suffix for
  `somente_leitura`, plain `"Admin"` for `completo`. **A2.3 pilot = the
  users screen itself:** "Novo usuário" + all 4 row `actionButton()`s
  disabled with an explanatory title for an acting `somente_leitura` admin
  (derived from the already-fetched user list, no new query); every helper
  in `js/admin-usuarios-writes.js` also takes a trailing `readOnly` and
  refuses with `CLIENT_READONLY_FORBIDDEN` before touching `window.supa`.
  **Client-side only** — RLS/Edge Functions still key on `tipo='admin'`
  alone; a `somente_leitura` admin can bypass via direct API. Tests: +6 in
  `tests/admin-usuarios.smoke.js` (56/56), plus a `FakeNode` fidelity fix
  (`<select>.value` now follows a selected `<option>`, `.style` mirrored) in
  the same suite per `§20`. Full regression unchanged (138 pre-existing
  failures, identical before/after, zero new failures, +6 passing).
  **Registered candidates (`NOT AUTHORIZED`, both `PRE-PUBLICATION`):**
  `A2-SERVER-SIDE-ENFORCEMENT` (RLS/Edge Functions don't check
  `nivel_acesso`; `is_admin_full()` from `db/62` exists and is unused —
  required before trusting any real read-only admin in production);
  `A2-CREATE-NIVEL-ACESSO-WIRING` (admin-create-user's fixed column list
  drops the field; requires an Edge Function change). **Next authorizable
  action: `A3.4`** (legacy screen removal in `cadastros.js`), own order.
- **`A2.1` (nivel_acesso schema) + `A2.1-B` (ACL correction) — `CLOSED /
  ACCEPTED` (2026-07-17):** technical commit `f108c45`. `db/62` adds
  `public.usuarios.nivel_acesso` (`TEXT NOT NULL DEFAULT 'completo'`, CHECK
  `completo`/`somente_leitura`; 10 existing users defaulted `completo`) and the
  `is_admin_full()` helper (`SECURITY DEFINER STABLE`; `ativo AND tipo='admin'
  AND nivel_acesso='completo'`). `usuarios.tipo` and `is_admin()` untouched.
  Applied+verified in staging (`ucrjtfswnfdlxwtmxnoo`, registry
  `20260717093122 / 62_admin_nivel_acesso_schema`); role matrix all green
  including the critical regression (**`is_admin()` stays true for a
  `somente_leitura` admin**) and the `db/60` trigger recording a `nivel_acesso`
  change with correct payload. **Hard stop:** `db/62` left `service_role` with
  `EXECUTE` (Supabase default), diverging from the db/57 authenticated-only
  standard; architect ruled **Option 3** → grants-only `db/63` (registry
  `20260717101401 / 63_is_admin_full_grants`, precedent db/57), stating the
  complete intended ACL. **Final ACL verified: `EXECUTE` for `authenticated`
  only; PUBLIC/anon/service_role denied** (service_role runtime call → `42501`).
  **Next authorizable action: `A2.2` (modal wiring), own order** (`A2.3` route
  enforcement, `A3.4` legacy removal also own orders). Registered candidates
  (`NOT AUTHORIZED`): `IS-ADMIN-ACL-REVIEW` (the anchor `is_admin()` grants
  `EXECUTE` to PUBLIC/anon/authenticated/service_role — more permissive than the
  db/57 standard; tightening it touches every RLS policy → needs its own
  diagnosis) and the `tec-to-acabamento-flow` 2 stale static-slice assertions
  (same class as `L2`, trivial regex-anchor fix). Ledger closeout below.
- **`TEST-MOCK-FIDELITY-AUDIT` — `CLOSED / ACCEPTED` (read-only, architect
  ratification 2026-07-17):** all 124 `tests/` suites audited; **zero confirmed
  (c) structurally-blind doubles that mask a live bug** — the three triggering
  defects are fixed and their doubles corrected into the faithful seed. Report:
  `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md`. Substantive finding is
  structural (residual classes `R1`/`R2`/`R3`, see the report and
  `PROJECT_STATE.md`). Ratified: shared-double `tests/_doubles.js` APPROVED
  (additive, opt-in, phased, mandatory meta-tests); `§20` (test-double fidelity)
  added to `CODE_HEALTH_RULES.md`; the test-baseline "~87/11 failures" figures
  re-grounded and then RESOLVED. **`TEST-DOUBLE-SHARED-MODULE` Lot `L1` —
  `CLOSED / ACCEPTED`:** `tests/_doubles.js` + 16 meta-tests (`54ee8aa`);
  shared double adopted in **all 5** `R1` suites — 4 in `4d2f304`,
  `tec-to-acabamento-flow` in `520c9a6` — each +1 demonstration test; `R2` drift
  fixed (`fornecedor-screens`/`painel-screen`); `FaithfulNode` select→value
  reflection. No assertion weakened; `tec-to-acabamento-flow`'s 2 pre-existing
  static-slice failures preserved. **`TEST-DOUBLE-STALE-ASSERTION-CLEANUP`
  Lot `L2` — `CLOSED / ACCEPTED`** (`2c9a4c2`): stale inline-`<script>`
  assertions in `index-inline`/`config`/`supabase-client` rewritten to the
  post-modularization structure (no inline script; module-content asserted; `?v=`
  tolerated; `js/boot.js` ordering boundary); `index-inline` fixed `:8765` →
  ephemeral `listen(0)`; `fornecedor-screens` menu-count made dynamic. All four
  green; the "~87/11 failures" baseline debt resolved. **`L3` `NO ACTION`**
  (subsumed by `A3.4`). **Read-only finding:** a stale git worktree registration
  `tapetes-baseline-check` (target missing on disk, `Permission denied` on
  auto-prune — likely OneDrive lock) — reported for authorized cleanup, NOT
  pruned. **Next authorizable action: `A2.1` (own order).** Registered follow-up
  (`NOT AUTHORIZED`): `tec-to-acabamento-flow`'s 2 false-red static-slice
  regexes. See the audit's dedicated section below.
- **PROJECT_STATE compaction (`PROJECT-STATE-COMPACTION-A`, 2026-07-16):** `PROJECT_STATE.md` is now current-state-only (active phase, binding decisions in force, live debts, environment, and a "Closed phases" index). Historical phase-closeout narratives were moved verbatim to `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`. The "Full detail" pointers in this handoff now target that archive. This handoff itself was not compacted in that phase.
- **Staging-only execution boundary in force (`STAGING-ONLY-EXECUTION-BOUNDARY-A`, 2026-07-15):** explicit architect decision — the current operational environment is exclusively staging `ucrjtfswnfdlxwtmxnoo`; the protected/other Supabase project is out of scope; schema migration/promotion in production is postponed until the complete canonical backlog is finished; `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` is no longer a current material blocker, it is `DEFERRED UNTIL GLOBAL BACKLOG COMPLETION / NOT A CURRENT STAGING BLOCKER`; G28-D publication is `DEFERRED / NOT AUTHORIZED / NOT A CURRENT BLOCKER`; Vercel is a future candidate only, with no decision and no authorization. See `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` ("Architect Decision — Staging-Only Execution Boundary") and its own section below.
- **No active functional phase.** G28-C is reclassified (2026-07-15, `G28-RECONCILIATION-DECISIONS-A`) as `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING` — see `PROJECT_STATE.md`. G28-D discovery remains `RELEASE CONTRACT DISCOVERY COMPLETE` (evidence preserved); its publication is `DEFERRED BY ARCHITECT / NOT A CURRENT BLOCKER / NOT AUTHORIZED` and does not constitute an active phase. The canonical definition of the publication mapping and of the authorized procedure for migrations 51/52 remains absent from the repository, but this is no longer a current blocker by explicit decision; see `docs/releases/G28_D_RELEASE_CANDIDATE.md`.
- **Last accepted phase:** `UI-INVOKE-ENVELOPE-FIX` — `Fix admin Edge Function response envelope unwrap — CLOSED / ACCEPTED` (2026-07-17; technical commit `7b37e8e`; architect-confirmed: reset shows the generated password, create-with-observações saves correctly — see its own section below). Surfaced by the `A6.3` visual gate; root cause pre-existing since `A5.1-A5.2`, not caused by `A6.2`. **`G28-CAMADA-2 / A6` track is now `COMPLETE`** (`A6.1` + `A6.1-B` + `A6.2` + `A6.3`, all `CLOSED / ACCEPTED`). `A6.3` — `Add user audit panel — CLOSED / ACCEPTED` (2026-07-17; technical commit `e31f269`; architect visual gate passed — see its own section below). `A6.2` — `Add audit trail writes to admin Edge Functions — CLOSED / ACCEPTED` (2026-07-17; technical commits `b67b126` + `7309349`; real E2E in staging `result: PASS`, `15/15` steps, `scripts/staging/usuarios-audit-e2e.mjs`, executed by the architect against the five functions the architect deployed — see its own section below). Standing on `A6.1-B` — `Preserve user audit events on profile deletion — CLOSED / ACCEPTED` (2026-07-16; technical commit `fa8e1b9`; corrective migration over `db/60`, staging-verified — see its own section below), which resolved the FK HARD STOP discovered while first authorizing `A6.2`: `usuarios_eventos.usuario_id`'s `ON DELETE CASCADE` would have destroyed a delete's own audit event; now `ON DELETE SET NULL` + identity snapshot. Standing on `A6.1` — `Add user audit trail schema — CLOSED / ACCEPTED` (2026-07-16; technical commit `ee0e77b`; schema/migration only, staging-verified role matrix, see its own section below). Prior to this: `UI-USERS-GRID-TEXT-OVERFLOW` — `Add text overflow ellipsis to users grid — CLOSED / ACCEPTED` (2026-07-16; technical commit `3e95e86`; presentation-only, users grid only — see its own section below). Standing on `UI-ACTION-BUTTON-MIGRATION-2` (phase `iii`, lot `2` of the `UI-ACTION-BUTTON` track) — `Migrate users and ops screens to actionButton — CLOSED / ACCEPTED` (2026-07-16; technical commit `abfb95e`; architect visual validation confirmed the users screen against the Clients reference — the original complaint's own test — plus a spot-check of `#/ops`). Includes the `ops-list.js` sr-only `display:none` a11y fix (now correct clip-rect) and the users-screen ACOES column-width fix (`102px`→`138px`, one grid-template value, per the architect's addendum). Phase `iii` lot `1` (`Migrate order lists to actionButton`, commit `31b66af`), phase `ii` (`Add actionButton primitive per visual contract`, commit `bbfd58c`) and phase `i` (contract amendment, §8.1 carve-out, commit `f30aa0d`) also `CLOSED / ACCEPTED`. **Lot `3` (`cadastros.js`) remains `NOT AUTHORIZED`, pending its own order.** `UI-EL-BOOLEAN-ATTR-FIX` (technical commit `8082428`) remains gated at `AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO` — no explicit closeout order was issued for that fix specifically; not assumed closed. `G28-CAMADA-2 / A5.3-A5.4 — User Reactivation — CLOSED / ACCEPTED` (2026-07-16; real e2e in staging `result: PASS`, 13/13 steps, executed by the architect via `scripts/staging/admin-reactivate-e2e.mjs`; architect visual validation confirmed the Desativar button works on an active user; see its own section below and `PROJECT_STATE.md`). The `A5` track (reset `A5.1-A5.2` + reactivation `A5.3-A5.4`) is now `COMPLETE`. `A5.1-A5.2` (administrative password reset), `A4.2` (mandatory password change guard) and `CAMADA2-LAST-ACCESS-UI` (consumption of RPC `db/59` in the UI, commit `0aff22f`) also `CLOSED / ACCEPTED` (2026-07-16). **No pending documentation closeout debt among these phases.** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` remains `CLOSED / ACCEPTED` (2026-07-15). `G28-C` remains the last functional phase of G28 proper, now `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING` (reclassification `G28-RECONCILIATION-DECISIONS-A`, 2026-07-15; staging/projections matrix 16/16 technical PASS; historical closeout `a7d7caa`/acceptance `d5ec09f` not rewritten; explicit debt `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`). G28-B8 is `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C`.
- **R1 commits completed:** `271761c3de20427b2cc9059d5ff7cc3727545e6d` — `G28: reconcile canonical phase state` (initial R1 documentation closeout); `edaf0b4d36f24aa7b9490e51a42624cc70d45963` — `G28: correct canonical reconciliation state` (correction of R1 textual defects). The current HEAD must be consulted directly with `git rev-parse HEAD`.
- **Publication criterion (`G28-GOVERNANCE-CONSOLIDATION-A`, 2026-07-15):** binding architect decision — the system only enters production after `G28-CAMADA-2` (full scope `A1-A7`) and `G28-CAMADA-3` (automatic backup) are both `CLOSED / ACCEPTED` in staging. `PUBLICATION-TRACK-REVIEW` is a front conditioned on that criterion, not a current candidate. `G28-CAMADA-3` moves from deferred to `PUBLICATION CRITICAL PATH` (after Camada 2), pending its own spec (the `BK1-BK8` diagnosis is a future phase, `NOT AUTHORIZED`). Candidate front `CODE-HEALTH-AUDIT-§18-R1` (read-only §18 audit, input for decomposition of `cadastros.js`) also recorded `NOT AUTHORIZED`. See `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (its own section) and the section below.
- **Next action:** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` was implemented, applied and verified in staging — **it must not be routed again** as the next action; it is `CLOSED / ACCEPTED`. The read-only reconciliation of the general backlog (`BACKLOG-RECONCILIATION-READONLY-R1`), the documentation backfill `DOCS-CANONICAL-CONSISTENCY-BACKFILL-A` and the recording of the boundary `STAGING-ONLY-EXECUTION-BOUNDARY-A` have also already been completed. **Next front selected:** `G28-CAMADA-2`. The proposed spec was materialized in `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (`CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1`). `A3.1` (1:1 extraction of the users screen), `A3.2` (summary cards + toolbar), `A4.1` + `CAMADA2-LAST-ACCESS-RPC`, `CAMADA2-LAST-ACCESS-UI`, `A4.2` (mandatory password change guard), `A5.1-A5.2` (administrative password reset) and `A5.3-A5.4` (user reactivation) are all `CLOSED / ACCEPTED` — see their own sections below. **None of these must be routed again as the next action.** The full `A5` track (reset + reactivation) is now `COMPLETE`. **Next authorizable action (2026-07-17, updated at the consolidated `A6`/`UI-INVOKE-ENVELOPE-FIX` closeout): `ARCHITECT DECISION` on a read-only front.** `TEST-MOCK-FIDELITY-AUDIT` is **promoted to priority candidate**: three defects from the same root class surfaced in one day — `UI-EL-BOOLEAN-ATTR-FIX` (severity **CONFIRMED — ACTIVE REGRESSION** since the `A5.3-A5.4` closeout — `el()`'s unconditional `setAttribute`, real DOM behavior not modeled by test `FakeNode`s; the Excluir button in `admin-usuarios.js` carries the identical vulnerable `disabled: <boolean>` pattern and is unconfirmed but suspect), hand-mocked `js/ui.js` primitives in suites that build their own DOM stand-ins, and `UI-INVOKE-ENVELOPE-FIX`'s fake-`invoke()` mock (flat payload, one level shallower than the real client) — each a test double diverging from the real behavior it imitates, letting a live bug through. Scope: inventory every such test double in `tests/`, read-only, no code fix bundled. `A2.1` (schema `nivel_acesso`) and `A3.4` (legacy code removal in `cadastros.js`, unlocks once `A2`/`A6` subphases close — now `A6` is fully closed) are the next authorizable **technical** candidates after that audit. No subphase authorized by this record. The project's supervision protocol is formalized in `docs/governance/SUPERVISION_PROTOCOL.md` (Architect/Reviewer/Resident Executor roles). Hygiene of the `work/app-next` worktree (divergent/dirty) remains authorized as a parallel read-only task in a separate order. `OPEN_ARCHITECT_DECISIONS: NONE` for the current staging cycle. Remaining Client Portal debts are made explicit: `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` and `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`. Recorded baseline/decomposition debts: 6 tests in `tests/auth.smoke.js` with outdated regex (`A4.2`) and `js/screens/admin-usuarios-modal.js` at 604 lines (grew from 576 at `A5.1-A5.2`, unchanged candidate for `CODE-HEALTH-AUDIT-§18-R1`, no action taken). Publication is not the next action and no automatic implementation follows.
- **Workspace / branch / previous HEAD:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28` / `work/g28-document-qualification`. Previous technical/documentation HEAD: `b27e79fdba1ed8fb8a6232d8e0b8ca4b37ac3a2c` (historical G28-D discovery baseline; this documentation record succeeds it).
- **Mandatory reading before routing any order:** `PROJECT_STATE.md`, this handoff, G28 master plan (`docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, G28 ledger (`docs/ledgers/G28_LEDGER.md`) and applicable contracts/runtime.
- **Documentation continuity — mandatory paths:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future handoff must relay these paths and expressly instruct the next chat to relay them again in any subsequent handoff. The continuity chain of the plan and of the backlog cannot be interrupted.
- **Runtime boundaries:** Document→Pedido 0..1 and Document→OP 0..N contract; dedicated revision tables; Ingestor retains candidate/event fields; B5 preserved; no `statusOverrides`, dual write, backfill or production.
- **Non-blocking debt:** `AUTHENTICATED_BROWSER_SMOKE_BLOCKED_BY_TOOLING` (the browser has no staging admin application/session).

## Test Mock Fidelity Audit — TEST-MOCK-FIDELITY-AUDIT — CLOSED / ACCEPTED

- **Phase:** `TEST-MOCK-FIDELITY-AUDIT` (read-only). **Documentation commit:**
  this closeout (`Record test mock fidelity audit`; docs-only — no code, test,
  SQL, migration, Supabase, staging, production or Vercel accessed/changed). The
  current HEAD must be consulted with `git rev-parse HEAD`.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION —
  TEST-MOCK-FIDELITY-AUDIT (read-only)"), session model / high effort; ratified
  by the architect on 2026-07-17.
- **Result:** all 124 `tests/` suites inventoried and classified against the
  real behavior each double imitates (`js/ui.js` `el()` boolean coercion,
  `functions.invoke()` double envelope, `.rpc()`/PostgREST `{data,error}`, real
  ui.js primitives). **Zero confirmed (c) structurally-blind doubles that mask a
  live bug.** The three triggering defects were genuine (c) at the time and are
  fixed with their doubles corrected into the faithful seed; only
  `admin-usuarios.smoke.js` runtime-fakes `functions.invoke` and it is faithful.
- **Substantive finding (structural):** fidelity is accidental/per-suite — `R1`
  quarantined boolean-blind hand-mock `el()` (`direct-cnpj-screens`,
  `pedido-form`, `cliente-pedido-tracking`, `pedido-detail-linked-documents`,
  `tec-to-acabamento-flow`), `R2` fail-unsafe raw-store `FakeNode` copy-drift
  (`fornecedor-screens`, `painel-screen`), `R3` legacy-dead-code invoke coverage
  gap (resolved by `A3.4`).
- **Ratified rulings:** shared-double `tests/_doubles.js` `APPROVED as proposed`
  (additive, opt-in, phased, mandatory meta-tests, seeded from the three
  corrected doubles); `§20` (test-double fidelity) added to
  `CODE_HEALTH_RULES.md`; lots `L1` (shared module + `R1` adoption + `R2` fix)
  and `L2` (stale inline-`<script>` cleanup) `AUTHORIZED`; `L3` `NO ACTION`.
- **Report:** `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md` (full
  per-suite verdicts, evidence, shared-double assessment, prioritized lots,
  known-debt classification).
- **Accesses:** no Supabase/MCP/staging/production/Vercel; `bhgifjrfagkzubpyqpew`
  not accessed; no push.
- **Next authorizable action:** Lot `L1` (`TEST-DOUBLE-SHARED-MODULE`), then
  `L2`, then `A2.1`/`A3.4`.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Controlled Delete × Document History (Pedido/OP) — CLOSED / ACCEPTED

- **Technical commit:** `707a37bd1d2c4728ab2a17433b6441049bd88062` — `Guard controlled delete against document link history` (`js/delete-helpers.js`, `tests/controlled-delete.smoke.js`, `db/53`–`db/56`).
- **Documentation commit:** this closeout (`Close controlled delete document history guard`). The current HEAD must be consulted directly with `git rev-parse HEAD`.
- **Original problem:** controlled physical deletion of Pedido/OP (`db/34`–`db/37`) violated the FK `document_link_revision_ops_op_id_fkey` when attempting to remove an OP still referenced by canonical append-only document history.
- **Root cause and fixes:** `db/53` adds a documentation guard via `SECURITY DEFINER` wrappers that block physical deletion when there is canonical history (`document_link_revisions`/`document_link_revision_ops`), renaming the legacy destructive logic to `*_pre53` (externally inaccessible); `db/54` fixes an emergency security finding (`anon_execute = true` on the public RPCs), restricting `EXECUTE` to `authenticated`; `db/55` fixes `to_jsonb(<literal>)` without an explicit cast (`could not determine polymorphic type`) via a forward-only patch; `db/56` fixes a `jsonb_set` `STRICT` regression that collapsed the diagnosis to `NULL` on eligible targets, using `COALESCE(to_jsonb(v_reason), 'null'::jsonb)`.
- **Local tests:** `node --check js/delete-helpers.js` PASS; `tests/controlled-delete.smoke.js` **53/53**; `tests/document-canonical-links-contract.test.js` **21/21**; `git diff --check` PASS.
- **Staging smokes (`ucrjtfswnfdlxwtmxnoo`, synthetic fixtures, zero cleanup):** Case A1 (eligible OP with dependency, no history) — non-null diagnosis, removal completed; Case A2 (eligible Pedido with dependency, no history) — non-null diagnosis, removal completed; Case B (with document history) — diagnosis blocked, `remover_op`/`remover_pedido` blocked in a controlled manner, all document history preserved without change. `op_numeros` preserved in all cases.
- **Final ACL (verified against the live catalog):** the 4 public RPCs — `authenticated`-only (`PUBLIC`/`anon` without `EXECUTE`); the 4 `*_pre53` functions — `postgres`-only (`PUBLIC`/`anon`/`authenticated` without `EXECUTE`).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action (per `PROJECT_STATE.md`):** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION`.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Controlled Delete × Document History") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Admin/Pedido — Static Residue of the Completion Button (Expedição) — CLOSED / ACCEPTED

- **Technical commit:** `7978e0a4fe021467cc23e0aeed63ac87ba738f1b` — `Fix admin order completion button state` (`js/screens/expedicao-admin.js`, `tests/expedicao-flow.smoke.js`).
- **Documentation commit:** this closeout (`Close admin order completion button residue`). The current HEAD must be consulted directly with `git rev-parse HEAD`.
- **Original problem:** `js/screens/expedicao-admin.js:405` built `disabled: ready ? null : 'disabled'`; the shared helper `js/ui.js` `el()` calls `setAttribute(k, v)` for every attribute without omitting `null`, materializing `disabled="null"` in the real DOM — a boolean attribute present, disabling the "Concluir pedido" button even when `ready === true`.
- **Root cause and fix:** single occurrence in the repository; fix localized entirely at the call site (`buildConclusao`), without altering `js/ui.js`. `buttonAttrs` built as a variable before the `return`; `disabled` only enters the object when `!ready`. `onclick`, text, styles and structure preserved without semantic change.
- **Local tests:** `node --check js/screens/expedicao-admin.js` PASS; `tests/expedicao-flow.smoke.js` **9/9**; `tests/expedicao-partial-flow.smoke.js` **12/12**; `git diff --check` PASS.
- **Accesses:** no staging; no production (`bhgifjrfagkzubpyqpew` not accessed); no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action:** `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A` — `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` / `NOT STARTED`. This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Admin/Pedido — Static Residue of the Completion Button") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Client Portal — Order Detail Read Model — CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBTS

- **Phase:** `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A`. **Documentation commit:** this closeout (`Close client order summary read model staging validation`). No technical commit — the phase changed no files (verification-only). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Result:** `db/30_cliente_pedido_summary_readmodel.sql` **was already applied** in staging (`ucrjtfswnfdlxwtmxnoo`); the function `public.cliente_pedido_summary(uuid)` exists with a body byte-for-byte equivalent to `db/30` (**no drift**), signature/`SECURITY DEFINER`/`STABLE`/`search_path=public`/owner `postgres` per contract; the 16 dependency tables exist.
- **Contract validated:** real RPC called per role — owner client `ok=true` (full DTO), `anon` `ok=false` **fail-closed** (executes, no data), cross-tenant `ok=false`, admin `ok=true`. All fields consumed by `js/screens/cliente-pedido-detail.js` present and typed; empty collections `[]`; nulls handled; no dependence on silent fallback.
- **Divergences recorded (not normalized):** the live ACL grants `EXECUTE` to `PUBLIC`/`anon`/`authenticated`/`service_role` (`db/30` intends only `authenticated`); `db/30` not recorded in `supabase_migrations.schema_migrations`.
- **Non-blocking debts:** `ACL_GRANTS_BROADER_THAN_CANONICAL_CONTRACT` (anon fail-closed, no confirmed exposure); `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED` (no test client password).
- **Remediation candidate (not authorized, not started):** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` — `ARCHITECT DECISION REQUIRED`; intended scope = grants-only migration analogous to `db/54` (`REVOKE EXECUTE … FROM PUBLIC, anon`, preserving `authenticated`).
- **Accesses:** Supabase MCP not exposed in the session; the authorized direct PostgreSQL fallback used only for verification (read-only, `BEGIN … ROLLBACK`, zero mutation); temporary tooling outside the repo removed; no secret echoed. Production (`bhgifjrfagkzubpyqpew`) not accessed; no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION` — no single unambiguous next action; the ACL remediation candidate must not be self-selected.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Client Portal — Order Detail Read Model") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Canonical Documentation — Consistency Backfill — DOCS-CANONICAL-CONSISTENCY-BACKFILL-A — CLOSED / ACCEPTED

- **Phase:** `DOCS-CANONICAL-CONSISTENCY-BACKFILL-A`. **Documentation commit:** this closeout (`Backfill canonical migration documentation`). Docs-only — no code, test, SQL, migration, staging or production changed. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Gaps closed:** (1) `db/37_controlled_delete_expedicao_cascade.sql` without its own `D-DEL` entry — added `D-DEL14` in `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §10; (2) `db/34`–`db/37` and `db/53`–`db/56` absent from `docs/DOCUMENTATION_INDEX.md` §4 — 8 lines added; (3) status of `db/30` in the index, corrected from "not yet applied" to applied/verified in staging with a broader ACL than the canonical contract retained as an explicit debt.
- **Debts preserved as open (not closed by this backfill):** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1`; `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; authenticated smoke debts (G28-C/D/B7/Client Portal); `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`; `G28-D`; production application of the staging-only stack; `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-2/3/4`.
- **Accesses:** no staging; no production (`bhgifjrfagkzubpyqpew` not accessed); no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED` — `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`. This backfill does not authorize any technical phase.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Canonical Documentation — Consistency Backfill") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Architect Decision — Staging-Only Execution Boundary — STAGING-ONLY-EXECUTION-BOUNDARY-A

*(translated from the architect's original Portuguese; original in docs/archive/pt-BR/)*

- **Phase:** `STAGING-ONLY-EXECUTION-BOUNDARY-A`. **Documentation commit:** this record (`Record staging-only execution boundary`). Docs-only — no code, test, SQL, migration, Supabase, staging, production or Vercel accessed/changed. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Binding decision recorded:** the current operational environment is exclusively staging `ucrjtfswnfdlxwtmxnoo`; the protected/other Supabase project is out of scope; schema migration/promotion in production postponed until the complete canonical backlog is finished; a production publication mapping is not required for the current work in staging; publication of G28-D remains postponed, not authorized and does not constitute a current blocker; the publication provider (incl. Vercel) is not selected — a future candidate only.
- **Reclassification:** `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` is no longer recorded as a current material blocker or a required next architect decision; it becomes `DEFERRED BY ARCHITECT UNTIL GLOBAL BACKLOG COMPLETION / NOT A CURRENT STAGING BLOCKER / NOT STARTED`. It was not discovered, defined, tested or finished — only intentionally postponed. Discovery evidence preserved, not rewritten, in `docs/releases/G28_D_RELEASE_CANDIDATE.md`.
- **Next technical candidate:** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` was authorized, implemented, applied and verified in staging on 2026-07-15 (`CLOSED / ACCEPTED` — see its own section below). There is no single subsequent technical candidate; `NEXT_AUTHORIZABLE_ACTION: NONE`.
- **Accesses:** no Supabase/MCP/staging/production/Vercel access in this phase; no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Architect Decision — Staging-Only Execution Boundary") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Architect Decision — Backlog Reconciliation and Supervision Governance — G28-RECONCILIATION-DECISIONS-A

*(translated from the architect's original Portuguese; original in docs/archive/pt-BR/)*

- **Phase:** `G28-RECONCILIATION-DECISIONS-A`. **Documentation commit:** this record (`Record architect reconciliation decisions`). Docs-only — no code, test, SQL, migration, Supabase, staging, production or Vercel accessed/changed. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Read-only baseline underpinning this decision:** `BACKLOG-RECONCILIATION-READONLY-R1` (`docs/reports/BACKLOG_RECONCILIATION_R1_2026-07-15.md`), executed after reading the 9 canonical paths + the ChatGPT closeout (`docs/handoffs/CHATGPT_CLOSEOUT_2026-07-15.md`).
- **`PROJECT-CONTROL-BASELINE-R1` (ChatGPT):** `REJECTED / NOT RATIFIED` — materially incorrect classification of Camada 2 (treated partial capability as accepted implementation). External artifact, never canonical. Its proposed correction (`PROJECT-CONTROL-BASELINE-R1-CORRECTION`) is `CANCELLED / ABSORBED / SUPERSEDED` by the diagnosis `BACKLOG-RECONCILIATION-READONLY-R1`, adopted as the current reference baseline.
- **G28-CAMADA-2 reclassified:** `PRE-EXISTING PARTIAL CAPABILITY` (user CRUD, deactivation/ban via Edge Functions, single role `usuarios.tipo`, client/supplier link — a byproduct of `AUTH-DISABLE-USER` and of the Client Portal) `+ FULL SCOPE A1-A7 DEFERRED` (password reset/recovery, invitations, roles/permissions matrix, full audit, full password policy, reactivation — none of these found in the real code). Not accepted as a dedicated phase; no implementation authorized by this record. Functional/visual reference for the full scope, when authorized: `D:\OneDrive\Programação\SGAA_clean_baseline`.
- **G28-C reclassified in the current state:** `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING`, separating technical/staging acceptance (16/16 matrix, migrations applied/verified) from the architect's functional/personal validation (not recorded) and from the authenticated browser smoke (`AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`, never executed). The historical closeout (`a7d7caa`/acceptance `d5ec09f`) **is not rewritten**; this is a new and linked entry in the G28 ledger.
- **Supervision governance:** tracking of progress, continuity, scope, authorizations, phases and documentation passes to Claude (chat) and Claude Code (resident). ChatGPT remains available as a process consultant, **with no custody of state and no authority to issue orders**.
- **Next front selected:** `G28-CAMADA-2`, starting with a comparative read-only diagnosis in a subsequent order of its own — **not authorized by this record**.
- **Authorized parallel task:** hygiene of the `work/app-next` worktree (11 commits behind `staging/work/app-next`, dirty worktree) — **read-only**, separate order.
- **Accesses:** no Supabase/MCP/staging/production/Vercel access in this phase; no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Architect Decision — Backlog Reconciliation and Supervision Governance") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Camada 2 — User Administration — Proposed Spec — CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1

- **Phase:** `CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1`. **Documentation commit:** this record (`Add Camada 2 user administration spec`). Docs-only — no code, test, SQL, migration, Supabase, staging, production or Vercel accessed/changed. **Status: `PROPOSED`.** The current HEAD must be consulted with `git rev-parse HEAD`.
- **Document created:** `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`. Mandatory reading before routing any order on `G28-CAMADA-2`.
- **Content:** `A1-A7` + password policy, each item with file:line evidence of what SGAA_clean_baseline does (external read-only reference), what already exists in Tapetes, what is missing, an adapted proposal, foreseen modules/files, Auth risk and subphase/gate. Includes a consolidated module plan, an Auth risk table and the order of subphases.
- **Architect decisions already incorporated (do not reopen without a new decision):** `nivel_acesso` 2 levels (`completo`/`somente_leitura`); permissions override table not built; A4 = temporary-password-with-forced-change only, email/SMTP `NOT AUTHORIZED`; bulk actions (A3.3) `DEFERRED`; explicit session revocation out of scope.
- **Next authorizable action:** `A3.1` was authorized, executed and accepted — see the section "Camada 2 — User Screen Extraction" below. The next subphase is `A3.2`, under a mockup gate.
- **Accesses:** no Supabase/MCP/staging/production/Vercel access; strictly read-only reading of `D:\OneDrive\Programação\SGAA_clean_baseline` (unrelated external project, no file touched); no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — User Administration — Proposed Spec") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted. For work on `G28-CAMADA-2` specifically, add `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` as the tenth mandatory path.

## Camada 2 — User Screen Extraction — CAMADA2-USUARIOS-A3-1 — CLOSED / ACCEPTED

- **Technical commit:** `4f01101143a512c8018d58ce9e523064c38a145f` — `Extract user administration screen modules` (`js/admin-usuarios-writes.js`, `js/screens/admin-usuarios-modal.js`, `js/screens/admin-usuarios.js`, `index.html`, `js/boot.js`, `tests/admin-usuarios.smoke.js`, `tests/boot.smoke.js`, `tests/cadastros-screens.smoke.js`).
- **Documentation commit:** this closeout (`Close Camada 2 user administration screen extraction`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Scope:** pure refactor — 1:1 extraction of `screenCadastrosUsuarios` (`js/screens/cadastros.js:2226-2713`) into 3 own modules, no new feature, no behavior change. Route cutover brought forward (spec revision adjustment): `js/boot.js` rewired to `window.screenAdminUsuarios`; `index.html` with the 3 new scripts.
- **Coupling resolved:** form helpers from `cadastros.js` (IIFE, not exposed on `window.*`) duplicated locally in `admin-usuarios-modal.js` — identical behavior, without touching `cadastros.js`.
- **Scope decision:** the original `render()` function (dead code, never called) not ported — no observable impact.
- **Not changed:** `cadastros.js`, `js/ui.js`, `js/auth.js` untouched. `screenCadastrosUsuarios` remains in `cadastros.js` until isolated removal in `A3.4`.
- **Tests:** `admin-usuarios.smoke.js` (new) 13/13; `boot.smoke.js` 32/32; `cadastros-screens.smoke.js` 32/32; broad regression of 28 suites: 1207/1296, identical to the baseline (`git stash` compared). `git diff --check` clean.
- **Visual validation:** confirmed by the architect on the route `#/cadastros/usuarios`, local app (`http://localhost:8765`) pointing to staging `ucrjtfswnfdlxwtmxnoo` — 1:1 parity accepted.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action:** `A3.2` was authorized and completed — see its own section below.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — User Screen Extraction"), `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` (§4/§6) and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  10. `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (work on `G28-CAMADA-2`)
  Every future chat or agent must relay these ten paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Camada 2 — Summary Cards and Toolbar — CAMADA2-USUARIOS-A3-2 — CLOSED / ACCEPTED

- **Technical commits:** `b4a6238c34afb683ec7a973d230330b7266c99f2` — `Add user admin summary cards and toolbar`; `3198570c04b08bef83605f64bc9ae1c5ece8b873` — `Align summary card background with dashboard`.
- **Documentation commit:** this closeout (`Close user admin summary cards phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Scope:** additive UI feature over `js/screens/admin-usuarios.js` (extracted in `A3.1`) — summary cards (4, KPI), toolbar (search+sort+type filter+toggle), colored role badge, inactive-row opacity. Mockup gate satisfied (approved by the architect on 2026-07-15); final values in `docs/design/CAMADA2_A32_MOCKUP_APPROVED.md`.
- **Item 4 blocked (HARD STOP confirmed, not implemented):** the "Último acesso" column requires reading `auth.users.last_sign_in_at`, nonexistent today (no RPC/view exposes it). **Architect decision: admin-only `SECURITY DEFINER` RPC, `is_admin()` pattern.** Recorded `CAMADA2-LAST-ACCESS-RPC` — `NOT AUTHORIZED`, candidate to group with the `A4.1` migration.
- **Post-validation adjustment:** card background standard `#f4f6f9` → `#fff` (same tone as `.rv-adm-card` in `js/screens/painel.js`); Inactive card keeps `#fff8f8`.
- **Not changed:** `index.html` (no new script); `js/admin-usuarios-writes.js`; `js/screens/admin-usuarios-modal.js`; `cadastros.js`; `js/ui.js`; `js/auth.js`. `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` received no entry (no new module/route change).
- **Tests:** `admin-usuarios.smoke.js` 20/20 (7 new); `boot.smoke.js` + `cadastros-screens.smoke.js` 64/64 (no regression); `git diff --check` clean.
- **Visual validation:** confirmed by the architect on the route `#/cadastros/usuarios`, local app (`http://localhost:8765`) pointing to staging `ucrjtfswnfdlxwtmxnoo`, including the background adjustment.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Governance:** supervision protocol formalized in `docs/governance/SUPERVISION_PROTOCOL.md` in this phase (Architect/Reviewer/Resident Executor roles, onboarding, order format, gates).
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED` among `A4.1`, `A2.1`, `A6.1` (see the section above). `A3.3` `DEFERRED`. `A3.4` depends on the other A3.x subphases. This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — Summary Cards and Toolbar") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  10. `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (work on `G28-CAMADA-2`)
  Every future chat or agent must relay these ten paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Client Portal — ACL Grants Hardening — CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1 — CLOSED / ACCEPTED

- **Technical commit:** `82f5ba70ace2e74c51b7c0295d1ecf8e319954be` — `Restrict client order summary RPC grants` (`db/57_cliente_pedido_summary_acl_grants.sql`, `tests/cliente-pedido-summary-acl-grants.smoke.js`). **Documentation commit:** this closeout (`Close client order summary RPC grant hardening`). The current HEAD must be consulted directly with `git rev-parse HEAD`.
- **Original problem:** the live ACL of `public.cliente_pedido_summary(uuid)` in staging granted `EXECUTE` also to `PUBLIC`, `anon` and `service_role`, besides `authenticated`, diverging from the canonical contract `D-COS02` (`authenticated`-only).
- **Fix:** `db/57` grants-only, forward-only, idempotent, restricted to the exact signature of the function — `REVOKE EXECUTE ... FROM PUBLIC, anon, service_role; GRANT EXECUTE ... TO authenticated`. Applied exactly once via Supabase MCP (tracked migration operation) in staging `ucrjtfswnfdlxwtmxnoo`; record `20260715190627 / 57_cliente_pedido_summary_acl_grants` confirmed.
- **Final ACL:** `PUBLIC` without `EXECUTE`; `anon` without `EXECUTE`; `authenticated` with `EXECUTE`; `service_role` without explicit `EXECUTE`. Owner `postgres` retains inherent privilege.
- **Function contract unchanged:** signature, return `jsonb`, `SECURITY DEFINER`, `STABLE`, `search_path=public`, owner `postgres`, body — definition hash identical before/after.
- **Empirical matrix (staging, read-only, `BEGIN … ROLLBACK`, no fixtures):** `anon` → `ERROR 42501: permission denied` at the ACL boundary before execution; `authenticated` owner → `ok=true` full DTO; `authenticated` cross-tenant → `ok=false` fail-closed with no third-party data; `authenticated` admin → `ok=true` full DTO; `service_role` via direct `SET ROLE` → `ERROR 42501` (object grant successfully revoked; `rolbypassrls` is a distinct RLS mechanism, it does not restore `EXECUTE`).
- **Frontend:** `js/screens/cliente-pedido-detail.js` remains the only real consumer (standard authenticated path); no change needed.
- **Local tests:** `tests/cliente-pedido-summary-acl-grants.smoke.js` (new) + `tests/cliente-pedido-summary-readmodel.smoke.js` (existing) — **21/21 PASS**; `git diff --check` clean.
- **Debt closed:** `ACL_GRANTS_BROADER_THAN_CANONICAL_CONTRACT` — `RESOLVED IN STAGING`.
- **Debts preserved as open:** `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` (no history record fabricated for `db/30`); `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`; production application of the staging-only stack (incl. `db/57`) remains postponed by `STAGING-ONLY-EXECUTION-BOUNDARY-A`.
- **Accesses:** Supabase MCP connected and used only for catalog reading and the tracked application of the migration in staging `ucrjtfswnfdlxwtmxnoo`; production (`bhgifjrfagkzubpyqpew`) not accessed; Vercel not accessed; no push.
- **Final worktree state:** clean; staging empty; zero untracked.
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION` — `NEXT_AUTHORIZABLE_ACTION: NONE` until a new reconciliation of the remaining general backlog.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Client Portal — ACL Grants Hardening") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Canonical Documentation — Status Consistency of the Legacy Pedido↔OP Plans — DOCS-PEDIDO-OP-LEGACY-PLAN-STATUS-CONSISTENCY-R1 — CLOSED / ACCEPTED

- **Phase:** `DOCS-PEDIDO-OP-LEGACY-PLAN-STATUS-CONSISTENCY-R1`. **Documentation commit:** this closeout (`Reconcile legacy Pedido OP plan phase statuses`). Docs-only — no code, runtime, test, SQL, migration, Supabase, MCP, staging, production or Vercel accessed/changed. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Fix:** the current status lines of legacy Phases D–J were reconciled in `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §9 and `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` §5.
- **Mandatory routing for the next agent:** legacy Phases **D, E, F** were **delivered** through the accepted production-flow work and must **not** be routed as open implementation phases. Legacy Phases **G, H, I** were **superseded** by the canonical G28 documentation pipeline (`document_link_revisions`/`document_link_revision_ops`; `documentos_operacionais` never created) and also must **not** be routed as open phases. **Phase J** remains exclusively as `FUTURE / UNSEQUENCED / NOT STARTED / NOT AUTHORIZED`.
- **State unchanged:** `ACTIVE_PHASE: NONE`; `NEXT_AUTHORIZABLE_ACTION: NONE` pending explicit architect selection. All open debts and deferred fronts remain unchanged (`DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`, `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`, production application of the staging-only stack, `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`, G28-D/Vercel, `DELETE-PROD-GUARD-A`, `DELETE-AUDIT-LOG-A`, `G28-CAMADA-2/3/4`).
- **Accesses:** no staging; no production (`bhgifjrfagkzubpyqpew` not accessed); no Supabase/MCP; no Vercel; no push.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Canonical Documentation — Status Consistency of the Legacy Pedido↔OP Plans") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Every future chat or agent must relay these nine paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Architect Decision — Publication Criterion and Candidate Fronts — G28-GOVERNANCE-CONSOLIDATION-A — CLOSED / ACCEPTED

*(translated from the architect's original Portuguese; original in docs/archive/pt-BR/)*

- **Phase:** `G28-GOVERNANCE-CONSOLIDATION-A`. **Documentation commit:** this record (`Consolidate supervision protocol and register publication criteria`). Docs-only — no code, test, SQL, migration, Supabase, staging, production or Vercel accessed/changed. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Supervision protocol:** `docs/governance/SUPERVISION_PROTOCOL.md` received an appendix "Supervision handoff — standard block" (verbatim text from the architect, to open any new reviewer/supervisor session) and now requires a `STRUCTURAL POLICY COMPLIANCE` section in the report format of every implementation phase (applicable rules of `docs/architecture/CODE_HEALTH_RULES.md` cited + evidence + line size of the touched files).
- **Candidate fronts recorded in `PROJECT_STATE.md`:** `CODE-HEALTH-AUDIT-§18-R1` (read-only post-Camada 2 audit, §18 of `CODE_HEALTH_RULES.md`, input for the incremental decomposition of `cadastros.js` and triage of test debts) — `NOT AUTHORIZED`; `PUBLICATION-TRACK-REVIEW` (staging-only boundary + `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` + G28-D + production application of the staging-only migrations + `DELETE-PROD-GUARD-A`) — `NOT AUTHORIZED / CONDITIONED`.
- **Binding architect decision — publication criterion (2026-07-15):** the system only enters production after `G28-CAMADA-2` (full scope `A1-A7`) and `G28-CAMADA-3` (automatic backup) are both `CLOSED / ACCEPTED` in staging. `PUBLICATION-TRACK-REVIEW` is conditioned on that criterion, is not a current candidate even after reconciliation of the general backlog. The `STAGING-ONLY-EXECUTION-BOUNDARY-A` boundary remains in force unchanged.
- **Recorded consequence:** `G28-CAMADA-3` moves from a deferred front to `PUBLICATION CRITICAL PATH` (after `G28-CAMADA-2`), pending its own spec; the `BK1-BK8` diagnosis is a future phase, `NOT AUTHORIZED` by this record.
- **Not changed:** no code, test, SQL, migration, runtime touched; no subphase of `G28-CAMADA-2`/`G28-CAMADA-3` authorized; `STAGING-ONLY-EXECUTION-BOUNDARY-A` not rewritten, only referenced as unchanged.
- **Accesses:** no staging; no production (`bhgifjrfagkzubpyqpew` not accessed); no Supabase/MCP; no Vercel; no push.
- **Final worktree state:** clean; selective staging by literal path; zero untracked after the commit.
- **Next authorizable action:** unchanged — `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION` among `A4.1`, `A2.1`, `A6.1` of `G28-CAMADA-2` (see their own sections above). This record does not authorize any subphase.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Architect Decision — Publication Criterion and Candidate Fronts") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  10. `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (work on `G28-CAMADA-2`)
  11. `docs/governance/SUPERVISION_PROTOCOL.md` (order format, gates, standard supervision handoff block)
  Every future chat or agent must relay these eleven paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Camada 2 — Temporary Password and Last Access Read Model — A4.1 + CAMADA2-LAST-ACCESS-RPC — CLOSED / ACCEPTED

- **Technical commits:** `bf0d522` — `Add temporary password schema and last sign-in read model` (`db/58_admin_usuarios_senha_temporaria.sql`, `db/59_admin_last_sign_in_readmodel.sql`, `supabase/functions/admin-create-user/index.ts`, `supabase/functions/admin-create-user/README.md`, 4 new/extended smoke tests); `c6289f8` — `Add password-policy E2E verification runner for admin-create-user` (`scripts/staging/admin-create-user-password-policy-e2e.mjs`, `docs/DOCUMENTATION_INDEX.md`).
- **Documentation commit:** this closeout (`Close temporary password schema phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Schema/RPC applied and verified in staging (`ucrjtfswnfdlxwtmxnoo`), via Supabase MCP:** `db/58` (record `20260716014338`) adds `usuarios.senha_temporaria`/`usuarios.senha_gerada_em`, with no retroactive effect on the 10 existing users; `db/59` (record `20260716014358`) creates `public.admin_usuarios_last_sign_in()` — `SECURITY DEFINER`/`STABLE`, `is_admin()` guard, exposes only `id`+`last_sign_in_at`, `authenticated`-only grants. Empirical role matrix confirmed: `anon` → `42501` (ACL); non-admin `authenticated` → `42501` (business, `RAISE EXCEPTION`); admin → `ok`.
- **Edge Function `admin-create-user`:** password policy 6→8 characters + ≥1 digit; the insert now sets `senha_temporaria=true`/`senha_gerada_em=now()`.
- **Staging deploy executed by the architect** (outside the credential reach of this session — the AI agent does not enter password/token/API key into any field, a permanent rule that cannot be bypassed by authorization).
- **Post-deploy verification — real E2E in staging, `result: PASS` (9/9), executed by the architect** via `scripts/staging/admin-create-user-password-policy-e2e.mjs`: 7 chars rejected (length); 8 chars without a digit rejected (digit); valid password accepted with `senha_temporaria=true`/`senha_gerada_em` filled, confirmed via REST; cleanup via `admin-delete-user` with zero cleanup confirmed.
- **Local tests:** 4 new/extended smoke suites totaling 71/71 (schema db/58, RPC db/59, `admin-create-user` password policy, extended `db/` allow-list); regression `tests/admin-*.smoke.js` + `boot.smoke.js` 263/263 with no regression. `git diff --check` clean.
- **Documentation corrected:** `docs/operations/AUTH_USER_PROVISIONING_RUNBOOK.md` (outdated password policy → 8+digit, note on `senha_temporaria`/mandatory future change in `A4.2`); `docs/DOCUMENTATION_INDEX.md` (entries for `db/58`/`db/59` + classification of the E2E runner as verification tooling, same treatment as `admin-disable-user-e2e.mjs`).
- **Not implemented (out of scope):** consumption of the RPC in the UI (the "Último acesso" column); `A4.2` (boot guard + mandatory change screen); `A4.3` (`NOT AUTHORIZED`).
- **Accesses:** Supabase MCP used to apply/verify the two migrations in staging; production (`bhgifjrfagkzubpyqpew`) not accessed; no push.
- **Final worktree state:** clean; staging empty; zero untracked (`supabase/.temp/` is a local untracked cache of the Supabase CLI, generated by the architect's action).
- **Next authorizable action:** `ARCHITECT DECISION` — candidates: micro-phase to consume the `db/59` RPC in the UI (the "Último acesso" column in `js/screens/admin-usuarios.js`, under a mockup gate if it involves a new visual element); `A4.2` (boot guard + mandatory change screen, visual gate); `A2.1`/`A6.1` of `G28-CAMADA-2` remain candidates with no unambiguous priority. This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — Temporary Password and Last Access Read Model") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  10. `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (work on `G28-CAMADA-2`)
  11. `docs/governance/SUPERVISION_PROTOCOL.md` (order format, gates, standard supervision handoff block)
  Every future chat or agent must relay these eleven paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Camada 2 — Mandatory Password Change Guard — A4.2 — CLOSED / ACCEPTED

- **Technical commit:** `6c624ef` — `Add mandatory password change gate` (`js/auth.js`, `js/boot.js`, `js/trocar-senha-writes.js` (new), `js/screens/trocar-senha-obrigatoria.js` (new), `scripts/staging/trocar-senha-obrigatoria-e2e.mjs` (new, tooling), `index.html`, `tests/auth.smoke.js`, `tests/boot.smoke.js`, `tests/trocar-senha-obrigatoria.smoke.js` (new)). **Documentation commit:** this closeout (`Close mandatory password change phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Hard stop resolved (Option A, explicit architect decision):** `js/auth.js` extends only the `select` of `loadCurrentUser()` (`+senha_temporaria, +senha_gerada_em`) — no other line touched, §11 preserved. The guard lives entirely in `js/boot.js` (`isSenhaTemporariaExpirada`, `guardedHandleRoute`) without touching `js/router.js`.
- **RLS/grants verified in staging before coding:** `usuarios_self_update` + `authenticated` with `UPDATE` on `senha_temporaria`/`senha_gerada_em` — self-update works without a new policy.
- **Self-service write (`js/trocar-senha-writes.js`):** `trocarSenhaObrigatoria(userId, novaSenha)` — `auth.updateUser({password})` + `UPDATE usuarios SET senha_temporaria=false`; `{ok:false, stage:'auth'|'flag'}` reports partial state explicitly.
- **Screen (`js/screens/trocar-senha-obrigatoria.js`, 243 lines):** shell-less card, live checklist (8+ characters / 1 digit / passwords match), button enabled only with the 3 criteria, eye toggle, "Sair da conta"; `expired` mode (>7 days) without fields. Mockup approved by the architect on 2026-07-16.
- **Tests:** `tests/trocar-senha-obrigatoria.smoke.js` (new) 14/14; `tests/boot.smoke.js` extended 44/44 (13 new, incl. integration via real `main()`); `tests/auth.smoke.js` extended 37/43 (3 new + 1 corrected; the 6 that fail are pre-existing debt confirmed via `git stash`, not from this phase). `git diff --check` clean.
- **Verification without credentials (local preview):** the real screen rendered via a diagnostic overlay — the checklist reacts to keystrokes with correct computed colors, the button disables/enables, the eye toggle confirmed, `expired` mode without fields. Console without errors.
- **Authenticated leg validation — CONFIRMED BY THE ARCHITECT (manual validation in staging `ucrjtfswnfdlxwtmxnoo`):** synthetic user created through the new flow, gate shown at first login, checklist reacted, change performed, `senha_temporaria` zeroed, second login entered directly without a gate. Test user removed. Equivalent automated runner (`scripts/staging/trocar-senha-obrigatoria-e2e.mjs`) created for future re-execution — not executed in this phase (login with a real password is an exclusively human action, never the AI agent's, a permanent rule).
- **Debt recorded (candidate for `CODE-HEALTH-AUDIT-§18-R1`):** the 6 pre-existing tests in `tests/auth.smoke.js` with an outdated `<script src="js/auth.js">` regex (not accounting for `?v=`) — not fixed here, out of scope.
- **Documentation continuity debt — RESOLVED on 2026-07-16:** the micro-phase `CAMADA2-LAST-ACCESS-UI` (technical commit `0aff22f` — `Add last sign-in column to user admin`) had its implementation report delivered (`AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`) but the session proceeded directly to `A4.2` without an explicit `OK` or a closeout order for that micro-phase specifically. The architect confirmed the visual validation and authorized the formal closeout together with the authorization of `A5.1-A5.2` — see the section "Camada 2 — Last Access RPC Consumption in the UI — CAMADA2-LAST-ACCESS-UI" below.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked (`supabase/.temp/` pre-existing, not from this session).
- **Next authorizable action:** `ARCHITECT DECISION` among `A2.1` (schema `nivel_acesso`), `A6.1` (audit schema/trigger) and `A5.1-A5.2` (admin password reset). This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — Mandatory Password Change Guard — A4.2") and `docs/ledgers/G28_LEDGER.md` (append-only entry).
- **Mandatory documentation continuity — relay in every future handoff:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  10. `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (work on `G28-CAMADA-2`)
  11. `docs/governance/SUPERVISION_PROTOCOL.md` (order format, gates, standard supervision handoff block)
  Every future chat or agent must relay these eleven paths and expressly instruct the next continuity to relay them again. The continuity chain of the plan and of the backlog cannot be interrupted.

## Camada 2 — Last Access RPC Consumption in the UI — CAMADA2-LAST-ACCESS-UI — CLOSED / ACCEPTED

- **Technical commit:** `0aff22f` — `Add last sign-in column to user admin` (`js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `tests/admin-usuarios.smoke.js`). **Documentation commit:** this closeout (`Close last sign-in column phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Scope:** `fetchLastSignIn()` (one call per `reload()`, client-side merge by `id`) + "ULTIMO ACESSO" column in the grid (`dd/mm/aaaa hh:mm`; `"—"` for null) + "Último acesso" sorting (most recent first, nulls last) + fail-closed in case of RPC failure (entire column `"—"` + `console.warn`, the list stays visible).
- **Tests:** `tests/admin-usuarios.smoke.js` extended 23/23; regression `boot`+`cadastros-screens`+`admin-*` 298/298. `git diff --check` clean.
- **Visual validation — CONFIRMED BY THE ARCHITECT on 2026-07-16 (local preview, staging `ucrjtfswnfdlxwtmxnoo`):** column populated with real data, correct format, `"—"` for the never-logged-in, sorting with nulls last.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked (`supabase/.temp/` pre-existing, not from this session).
- **Next authorizable action:** already superseded — `A5.1-A5.2` authorized and in progress; see its own section.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — Last Access RPC Consumption in the UI") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Camada 2 — Administrative Password Reset — A5.1-A5.2 — CLOSED / ACCEPTED

- **Technical commit:** `b726717` — `Add admin password reset` (`supabase/functions/admin-reset-user-password/index.ts` (new), `supabase/functions/admin-reset-user-password/README.md` (new), `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `js/screens/admin-usuarios-modal.js`, `scripts/staging/admin-reset-password-e2e.mjs` (new), `tests/admin-reset-user-password.smoke.js` (new), `tests/admin-usuarios.smoke.js`). **Documentation commit:** this closeout (`Close admin password reset phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Architect decision — self-reset BLOCKED:** an admin cannot reset their own password (`SELF_RESET_FORBIDDEN`) — they use the normal change flow (self-service, `A4.2`). No "last admin" guard (resetting a password deactivates no one).
- **Edge Function `admin-reset-user-password`:** mirror of `admin-disable-user`; temporary password via `crypto.getRandomValues` (12 chars, no visual ambiguity, ≥1 digit guaranteed); `auth.admin.updateUserById(target, {password})`; marks `senha_temporaria=true`/`senha_gerada_em=now()`; never logs the password; returns the password a single time. A post-reset failure in the profile update (with no safe compensation possible) returns an explicit error (`PROFILE_UPDATE_FAILED`).
- **UI:** key-icon button → `confirmDialog` (never `window.confirm`) → success: "Senha gerada" modal (password shown once, copy button, non-re-display warning). Error → toast, no ambiguous state.
- **Staging deploy executed by the architect** (outside the credential reach of this session, a permanent rule).
- **Post-deploy verification — real E2E in staging, `result: PASS` (15/15), executed by the architect** via `scripts/staging/admin-reset-password-e2e.mjs` (`test_user_id 170f8479-e2da-4a6d-b597-080716be9c20`): guards `SELF_RESET_FORBIDDEN`/`NOT_FOUND`; real reset with flag+timestamp updated; old password invalidated; login with the new temporary one confirms `senha_temporaria=true`; `A4.2` self-service chained (new change + flag zeroed); relogin without a gate; zero cleanup.
- **Tests:** `tests/admin-reset-user-password.smoke.js` (new) 23/23; `tests/admin-usuarios.smoke.js` extended 29/29 (6 new); consolidated regression 268/275 (7 = pre-existing debt confirmed, none new). `git diff --check` clean.
- **Architect visual validation — WAIVED BY EXPLICIT DECISION**, covered by the combination of e2e `PASS` + flow verification in a real browser by the executor (button → `confirmDialog` → password modal with single display/copy/warning; self-reset guard confirmed with real `.disabled` values in the DOM).
- **Finding recorded — candidate `UI-EL-BOOLEAN-ATTR-FIX` (`NOT AUTHORIZED`, severity `NOT CONFIRMED`):** `js/ui.js`'s `el()` does not handle a boolean in `setAttribute` — potentially affects the Deactivate/Delete buttons in `admin-usuarios.js` (same root cause as the residue already fixed in `expedicao-admin.js`). Treat as a potential active regression until the architect verifies it directly in staging. Not fixed (outside the `A5.1-A5.2` manifest).
- **Finding recorded — decomposition candidate (`CODE-HEALTH-AUDIT-§18-R1`):** `js/screens/admin-usuarios-modal.js` at 576 lines (above the acceptable 500) after accommodating the 4th modal.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked (`supabase/.temp/` pre-existing, not from this session).
- **Next authorizable action:** `ARCHITECT DECISION` among `A5.3-A5.4` (reactivation), `UI-EL-BOOLEAN-ATTR-FIX`, `A2.1` (access level) and `A6.1` (audit). This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — Administrative Password Reset — A5.1-A5.2") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Camada 2 — User Reactivation — A5.3-A5.4 — CLOSED / ACCEPTED

- **Technical commit:** `f886e26` — `Add admin user reactivation` (`supabase/functions/admin-reactivate-user/index.ts` (new), `supabase/functions/admin-reactivate-user/README.md` (new), `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `js/screens/admin-usuarios-modal.js`, `scripts/staging/admin-reactivate-e2e.mjs` (new), `tests/admin-reactivate-user.smoke.js` (new), `tests/admin-usuarios.smoke.js`). **Documentation commit:** this closeout (`Close admin user reactivation phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Edge Function `admin-reactivate-user`:** symmetric counterpart of `admin-disable-user` — `ativo=true`, clears `desativado_em`/`desativado_por`/`motivo_desativacao`, `auth.admin.updateUserById(target, {ban_duration:'none'})`. Guards: target must exist (`NOT_FOUND`) and be inactive (`REACTIVATE_NOT_INACTIVE` otherwise — deliberately **not** idempotent, unlike `admin-disable-user`'s `already_disabled`: reactivating an already-active user is a caller error, there is no ambiguous "already reactivated" state to collapse into); self-reactivation guarded (`SELF_REACTIVATE_FORBIDDEN`) though practically unreachable (an inactive target is banned and cannot hold a session). **Compensation-on-partial-failure design:** if the Auth unban call fails after the profile has already been marked `ativo=true`, the function reverts to the *exact* previous inactive state — `desativado_em`/`desativado_por`/`motivo_desativacao` are read and preserved **before** the update, not re-stamped with new values — returning `AUTH_UNBAN_FAILED`; if the reversion itself fails, `COMPENSATION_FAILED` (manual action required), same pattern as `admin-disable-user`.
- **UI:** inactive rows swap the ban icon for a refresh icon in the same action slot, wired to a new `confirmDialog` (non-destructive blue button) → `reativarUsuario(userId)` → success/error toast. Active rows unchanged.
- **Staging deploy executed by the architect** (outside the credential reach of this session, a permanent rule).
- **Post-deploy verification — real E2E in staging, `result: PASS` (13/13 steps), executed by the architect** via `scripts/staging/admin-reactivate-e2e.mjs` (`test_user_id 860b6fea-ac9e-45b1-8b85-9cfa255020e4`): synthetic user created → login confirmed → disabled via the existing `admin-disable-user` flow → login blocked (banned) → reactivated via the new Edge Function (`ativo=true`, `auth_banned=false`) → flags confirmed cleared in `public.usuarios` → login restored → guard `REACTIVATE_NOT_INACTIVE` confirmed on the now-active target → cleanup via `admin-delete-user` with zero cleanup confirmed.
- **Tests:** `tests/admin-reactivate-user.smoke.js` (new) 22/22; `tests/admin-usuarios.smoke.js` extended 35/35 (6 new); consolidated regression across the touched suites (`admin-usuarios`/`admin-reactivate-user`/`admin-disable-user`/`admin-reset-user-password`/`boot`/`cadastros-screens`) 195/195, no regressions. `git diff --check` clean.
- **Architect visual validation:** Desativar button on an active user **CONFIRMED WORKING** in staging — this also resolves, for this one control, the risk flagged in the `A5.1-A5.2` finding below (the `A5.3-A5.4` rewrite dropped the vulnerable `disabled: <boolean>` key from the Desativar/Reativar button entirely, as a side effect of the icon-swap logic, not a deliberate fix of `js/ui.js`). Icon-swap + Reativar flow: **issue found and diagnosed** (see next bullet) — not itself a defect in the Reativar code delivered this phase.
- **`UI-EL-BOOLEAN-ATTR-FIX` — severity updated from `NOT CONFIRMED` to `CONFIRMED — ACTIVE REGRESSION`:** while validating the Reativar flow, the architect found that a disabled user disappears from the Usuários screen and stays gone even with "Mostrar inativos" checked — the checkbox "persists marked when clicking" (does not visually reflect its real state). Root cause diagnosed: `js/screens/admin-usuarios.js`'s toggle passes `checked: mostrarInativos` straight into `window.el()`, which calls `node.setAttribute('checked', mostrarInativos)` unconditionally; since `renderStandalone()` creates a brand-new `<input>` on every re-render, the `checked` attribute is always present (`"true"` or `"false"` as a string), and HTML boolean attributes are true-by-presence regardless of value — so the fresh checkbox always renders checked, independent of the actual `mostrarInativos` state. Exact same root cause as the `disabled="null"` residue already fixed once in `expedicao-admin.js`, now empirically reproduced via a second control. The Excluir button in the same file (`disabled: !!(meId && user.id === meId)`) carries the identical pattern and is unconfirmed but suspect by the same evidence. **Not fixed in this phase** — outside the `A5.3-A5.4` manifest, and mixing this diagnosis with a patch here would violate `CODE_HEALTH_RULES.md` §14. Recorded as the priority `ARCHITECT DECISION` candidate (see `PROJECT_STATE.md`).
- **Finding unchanged — decomposition candidate (`CODE-HEALTH-AUDIT-§18-R1`):** `js/screens/admin-usuarios-modal.js` grew from 576 to 604 lines accommodating the 5th modal (`openReativarModal`); already a recorded candidate, no action taken.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging empty; zero untracked (`supabase/.temp/` pre-existing, not from this session).
- **Next authorizable action:** `ARCHITECT DECISION` among `UI-EL-BOOLEAN-ATTR-FIX` (now `CONFIRMED — ACTIVE REGRESSION`, recommended priority), `A2.1` (access level) and `A6.1` (audit). `A3.4` unlocks once the remaining `A2`/`A6` subphases close. This entry does not authorize its execution.
- **Full detail:** `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (section "Camada 2 — User Reactivation — A5.3-A5.4") and `docs/ledgers/G28_LEDGER.md` (append-only entry).

## UI-ACTION-BUTTON — Helper Primitive — phase ii — CLOSED / ACCEPTED

- **Technical commit:** `bbfd58c` — `Add actionButton primitive per visual contract` (`js/ui.js`, `tests/ui-action-button.smoke.js` (new)). **Documentation commit:** this closeout (`Close actionButton primitive phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `UI-ACTION-BUTTON` track, phase `ii`, follow-up to phase `i` (`docs/architecture/UI_VISUAL_CONTRACT.md` §8.1 carve-out, commit `f30aa0d`, `CLOSED / ACCEPTED`).
- **`actionButton({ title, icon, danger, disabled, onclick, srLabel })` added to `js/ui.js`:** implements §8.1 verbatim — 30×30px, radius 4px, border `#eceef1`/background `#fff` rest, color `#8a93a3` neutral / `#d6403a` danger, 14px icon slot (caller-supplied Node), hover via `mouseenter`/`mouseleave` matching the Clientes reference (neutral `border-color:#d0d5de;color:#3f4757`; danger `border-color:#fca5a5;background:#fff1f1;color:#c53030`), safe boolean `disabled` pattern (key present only when `true`, per `UI-EL-BOOLEAN-ATTR-FIX`), mandatory sr-only label via the clip-rect pattern (never `display:none`). `confirmDialog` gating on destructive actions remains the caller's responsibility, noted in the header comment.
- **Purely additive — zero call sites migrated**, as scoped; no other `js/ui.js` change; `el()` untouched.
- **Tests:** `node --check` PASS; `tests/ui-action-button.smoke.js` (new) **14/14** — dimensions/rest-state attrs, sr-only-not-`display:none`, disabled-key-only-when-`true` (via the DOM-coercion-aware double introduced for `UI-EL-BOOLEAN-ATTR-FIX`), both hover variants restored on `mouseleave`, onclick wiring and its absence when disabled. Full regression, in-place stash-verified (not worktree, to avoid the CRLF artifact found during the `UI-EL-BOOLEAN-ATTR-FIX` phase): before 3634/3473/161 fail, after 3648/3487/161 fail — exactly the 14 new tests, all passing, byte-identical failing-test-name sets before/after. (161 vs. an earlier session's 156 is pre-existing `write-guard.smoke.js` `ECONNREFUSED 127.0.0.1:8765` noise — no local static server running, reproduced identically with `js/ui.js` reverted — unrelated to this change.)
- **Architect acceptance:** confirmed; no visual gate required for this phase (no screen consumes the helper yet).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** already superseded — `UI-ACTION-BUTTON-MIGRATION-1` was authorized and closed; see its own section below for the current state of "next action".
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry). No `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` section added — out of this closeout's explicit scope (`PROJECT_STATE`/`HANDOFF`/ledger only).

## UI-ACTION-BUTTON — Order Lists Migration — phase iii, lot 1 — CLOSED / ACCEPTED

- **Technical commit:** `31b66af` — `Migrate order lists to actionButton` (`js/screens/pedidos-list.js`, `js/screens/cliente-pedidos-list.js`, `tests/pedidos-list.smoke.js`, `tests/cliente-pedidos-list.smoke.js`). **Documentation commit:** this closeout (`Close order lists migration phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `UI-ACTION-BUTTON` track, phase `iii`, lot `1` (worst-offender screens, as ratified), follow-up to phase `ii` (`actionButton()` primitive, commit `bbfd58c`, `CLOSED / ACCEPTED`).
- **Migrated:** `pedidos-list.js`'s `rowActions()` (eyeBtn "Visualizar", deleteBtn "Excluir Pedido") and `navBtn()` (pagination ◀/▶); `cliente-pedidos-list.js`'s row `eyeBtn` ("Ver pedido") and `navBtn()`. All now build via `window.actionButton()` per §8.1: 30×30px, radius 4px, border `#eceef1`/bg `#fff`, 14px icons (shrunk from 17px), hover, safe boolean `disabled`, mandatory sr-only label. Row-actions gap tightened 8px→6px per the ratified spec.
- **Same handlers preserved:** `pedidos-list.js`'s Excluir still calls `excluirPedido()` → `window.RAVATEX_DELETE.excluirPedidoComFluxo()`, which already gates the destructive action via its own confirmation flow (`showDeleteConfirmation` in `js/delete-helpers.js`) — no redundant `confirmDialog` wrapper added.
- **A11y conformance gain, not a feature:** both screens' pagination nav buttons previously had **no accessible name at all**; migrating to `actionButton()` gave them `title`="Página anterior"/"Próxima página" (and the mandatory sr-only label) for free.
- **Two judgments ratified by the architect at this closeout, standing for all remaining lots:** (1) existing domain-specific confirmation flows satisfy the §8.1 destructive guard without a redundant `confirmDialog` wrapper; (2) §8.1 dimension/sr-only/disabled correctness is proven once at the `actionButton()` primitive level (`tests/ui-action-button.smoke.js`) — screen-level smokes assert call-site routing only (which `actionButton()` args each call site passes), not re-proving the primitive's internals.
- **Tests:** `node --check` PASS on all 4 touched files; both smokes extended with static conformance checks (matching their existing 100%-static testing style — neither had runtime DOM rendering, so there were no "old style" assertions to replace; new assertions added instead): call sites route through `actionButton()` with correct `title`/`danger`/`disabled`/`onclick`; old 3px-radius/17px-icon/imperative-override patterns confirmed gone; destructive handler confirmed unchanged. Full regression, in-place stash-verified: before `3648`/`3492`/`156` fail → after `3660`/`3504`/`156` fail — exactly the 12 new tests, all passing, byte-identical failing-test-name sets before/after.
- **Architect visual validation — CONFIRMED:** both `#/pedidos` and `#/cliente/pedidos` validated against the Clients screen reference.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** already superseded — `UI-ACTION-BUTTON-MIGRATION-2` was authorized and closed; see its own section below for the current state of "next action".
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry). No `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` section added — out of this closeout's explicit scope (`PROJECT_STATE`/`HANDOFF`/ledger only).

## UI-ACTION-BUTTON — Users and Ops Screens Migration — phase iii, lot 2 — CLOSED / ACCEPTED

- **Technical commit:** `abfb95e` — `Migrate users and ops screens to actionButton` (`js/screens/admin-usuarios.js`, `js/screens/ops-list.js`, `tests/admin-usuarios.smoke.js`, `tests/ops-list-screen.smoke.js`). **Documentation commit:** this closeout (`Close users and ops screens migration phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `UI-ACTION-BUTTON` track, phase `iii`, lot `2`, follow-up to lot `1` (`UI-ACTION-BUTTON-MIGRATION-1`, commit `31b66af`, `CLOSED / ACCEPTED`).
- **Migrated:** `admin-usuarios.js`'s 4 row actions (Editar, Resetar senha, Desativar/Reativar swap, Excluir) and `ops-list.js`'s row actions (Editar/Ver, Excluir OP) plus its pagination `navBtn()`. All rebuilt via `window.actionButton()` per §8.1 — same handlers, same modal/`confirmDialog` gating, same disabled self-guards, same icon-swap logic; only the button rendering changed. The 0.6 inactive-row opacity and approved-mockup behavior untouched.
- **`ops-list.js` a11y fix:** the row-action sr-only label previously used `display:none` (hides it from assistive tech too, defeating the purpose — the exact defect recorded during the conformance diagnosis); `actionButton()` provides the correct clip-rect pattern natively, no extra code needed at the call site.
- **`ops-list.js` Excluir OP gains `danger` styling:** was neutral gray (same as Editar/Ver) before this migration; now red, matching every other Excluir action already migrated in the app.
- **Users-screen ACOES column-width fix (architect's addendum, honored though not repeated in the formal order text):** the column was hardcoded `102px`, but 4 `actionButton()`s need `30×4 + 6×3 = 138px` — widened via the single `gridTemplate` variable (shared by the header row and every data row), no other layout change.
- **A11y conformance gain, not a feature:** `ops-list.js`'s pagination nav buttons previously had no accessible name; migration gave them `title`="Página anterior"/"Próxima página" for free.
- **Tests:** `node --check` PASS on all 4 touched files. `admin-usuarios.smoke.js`: 3 new tests (sr-only clip-rect on all 4 row buttons; danger confirmed on Excluir, neutral confirmed unchanged on Desativar/Reativar; ACOES grid-template confirmed `138px`, old `102px` confirmed gone) — all 39 pre-existing tests kept passing unmodified. `ops-list-screen.smoke.js`: FakeNode gained `removeAttribute`/`hasAttribute` (defense-in-depth, matching the established fix pattern); 5 new tests (sr-only clip-rect never `display:none`; danger color on Excluir OP; handler/gating unchanged — `excluirOPComFluxo`, no `window.confirm`; pagination titles present; icons confirmed 14px) — all 19 pre-existing-passing tests kept passing, the 11 pre-existing failures (index-inline-related, confirmed via stash-diff to predate this change) unchanged. Full regression, in-place stash-verified: before `3660`/`3499`/`161` fail → after `3668`/`3507`/`161` fail — exactly the 8 new tests, all passing, byte-identical failing-test-name sets.
- **Architect visual validation — CONFIRMED:** users screen validated against the Clients reference (the original complaint's own test); `#/ops` spot-checked.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** already superseded — `UI-USERS-GRID-TEXT-OVERFLOW` (small follow-up, own order) was authorized and closed; see its own section below. Lot `3` (`cadastros.js`) of `UI-ACTION-BUTTON` remains `NOT AUTHORIZED`, pending its own order. Registered candidates unchanged: `MODAL-BUTTON-CSS-CHECK` (read-only), `fornecedor.js` visual redesign (separate track) — see `PROJECT_STATE.md`.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry). No `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` section added — out of this closeout's explicit scope (`PROJECT_STATE`/`HANDOFF`/ledger only).

## Users Grid — Text Overflow Ellipsis — UI-USERS-GRID-TEXT-OVERFLOW — CLOSED / ACCEPTED

- **Technical commit:** `3e95e86` — `Add text overflow ellipsis to users grid` (`js/screens/admin-usuarios.js`, `tests/admin-usuarios.smoke.js`). **Documentation commit:** this closeout, folded into the same phase per the architect's order (low-effort, mechanical). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** presentation-only follow-up to `UI-ACTION-BUTTON-MIGRATION-2` (users screen only, no relation to the `UI-ACTION-BUTTON` contract track otherwise).
- **Fix:** E-MAIL/NOME/FORNECEDOR/CLIENTE grid cells now truncate to a single line with an ellipsis (`white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0` — the last required for ellipsis inside a CSS grid track), applied consistently to header and data cells. Each truncated cell carries a `title` attribute with the full value (omitted when the displayed value is the "—" fallback, to avoid a useless tooltip). New local pure helper `truncatedCell(displayText, rawValue, colorStyle)` in `js/screens/admin-usuarios.js`, reused across the 4 cells.
- **Resulting grid template:** `2fr 1fr 110px 1fr 1fr 90px 130px 138px` (E-MAIL / NOME / TIPO / FORNECEDOR / CLIENTE / STATUS / ULTIMO ACESSO / ACOES) — E-MAIL widened from `1.3fr` to `2fr`; NOME/FORNECEDOR/CLIENTE unchanged at `1fr`; TIPO/STATUS/ULTIMO ACESSO/ACOES (`138px`, from `UI-ACTION-BUTTON-MIGRATION-2`) unchanged.
- **No data/handler/button change** — pure CSS + a `title` attribute; TIPO/STATUS badges and ULTIMO ACESSO untouched.
- **Tests:** `node --check` PASS. `tests/admin-usuarios.smoke.js` extended with 4 new tests (grid-template report exact match; E-MAIL cell nowrap/overflow/ellipsis/min-width + full-value title with a long synthetic address, full text confirmed still in the DOM — the cut is CSS-only; NOME/FORNECEDOR/CLIENTE same treatment, title absent on "—" cells; header cells carry the same truncation treatment, TIPO/STATUS confirmed without ellipsis) — all 42 pre-existing tests kept passing (one existing test's grid-template filter regex updated from `1\.3fr` to `2fr` to match the new leading fraction; no assertion semantics changed). Full regression, in-place stash-verified: before `3668`/`3512`/`156` fail → after `3672`/`3516`/`156` fail — exactly the 4 new tests, all passing, byte-identical failing-test-name sets.
- **Architect visual gate — NOT independently verified by the agent:** no live/staging browser session available in this environment (same standing limitation as prior UI phases). The architect's own quick check (long synthetic email truncates with "…", hover shows the full address, no row-height jump, no horizontal scroll) is the operative verification for this phase; not separately re-confirmed here beyond the automated DOM-structure tests above.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `ARCHITECT DECISION` — no single unambiguous candidate; `UI-ACTION-BUTTON` lot `3` (`cadastros.js`), `A2.1`, `A6.1` remain on the table, none authorized by this record.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Camada 2 — User Audit Trail Schema + Trigger — A6.1 — CLOSED / ACCEPTED

- **Technical commit:** `ee0e77b` — `Add user audit trail schema` (`db/60_usuarios_auditoria_schema.sql` new, `tests/document-decision-command-contract.test.js`). **Documentation commit:** this closeout. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `G28-CAMADA-2`, subphase `A6.1` (schema + trigger, first of `A6.1 → A6.2 → A6.3`), per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` §A6. Scope was schema/migration in staging only — no UI, no Edge Function, no boot, no production, per the architect's explicit order.
- **Schema:** `public.usuarios_eventos` (append-only) + `trg_usuario_evento` trigger (`AFTER UPDATE ON public.usuarios`), mirroring `public.op_eventos`/`trg_op_evento` (db/21) and `public.document_link_revisions` (db/51). Trigger diffs `to_jsonb(OLD)`/`to_jsonb(NEW)` over the watched fields `ativo`, `tipo`, `nivel_acesso` (column not yet added by `A2.1` — silently skipped via the `to_jsonb` existence check, no follow-up migration needed when it lands), `senha_temporaria`; records one `perfil_alterado` row per UPDATE with only the changed keys.
- **Actor-resolution / no-double-recording design decision:** the trigger records only when `auth.uid() IS NOT NULL` — the direct-PostgREST-UPDATE admin path (`js/admin-usuarios-writes.js` `updateUsuario`). When `auth.uid() IS NULL` (the five Edge Functions, `service_role`, no JWT in that DB connection), the trigger is a no-op; `A6.2` will insert those events explicitly with the actor id it already resolved from its own caller's JWT, avoiding a double entry once wired.
- **RLS + grants:** admin-only `SELECT` (`is_admin()`); `REVOKE ALL FROM PUBLIC/anon/authenticated`, `GRANT SELECT TO authenticated`; no client `INSERT`/`UPDATE`/`DELETE` policy — writes only via the `SECURITY DEFINER` trigger function, matching the `document_link_revisions` model.
- **Staging verify (`ucrjtfswnfdlxwtmxnoo`, transactional `BEGIN…ROLLBACK`, synthetic-value fixtures on two real staging users, zero permanent mutation):** trigger fires on `ativo`/`senha_temporaria` changes with correct payload shape (`{"<campo>":{"de":...,"para":...}}`) and correct `ator_id`; same-value no-op UPDATE does not record; simulated `auth.uid() IS NULL` (service_role) context does not double-record; `anon` denied `42501` (no grant at all); authenticated non-admin denied by RLS (0 rows, despite a seeded row existing); authenticated admin reads the seeded row. Full role matrix in `docs/ledgers/G28_LEDGER.md`.
- **Migrations registry:** before — highest recorded `59_admin_last_sign_in_readmodel`; after — `60_usuarios_auditoria_schema` recorded immediately following, no gap.
- **Tests:** `tests/document-decision-command-contract.test.js` **23/23** (allow-list extended for `db/60` per the `db/51/52/58/59` precedent). Full-suite file-swap-against-HEAD comparison: before `3704`/`3547`/`157` fail → after `3704`/`3548`/`156` fail — exactly the one intended assertion flipped from fail to pass, zero new failures.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `ARCHITECT DECISION` — `A6.2` (Edge Function wiring of `usuarios_eventos`, explicit insert in each of the 5 existing/new Edge Functions) is the natural next subphase of this track, but is not authorized by this record; `A6.3` (read-only UI panel) remains blocked on `A6.2`. Standing candidates unchanged otherwise: `UI-EL-BOOLEAN-ATTR-FIX`, `A2.1`.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry, includes the full role matrix).

## Camada 2 — Preserve User Audit Events on Profile Deletion — A6.1-B — CLOSED / ACCEPTED

- **Technical commit:** `fa8e1b9` — `Preserve user audit events on profile deletion` (`db/61_usuarios_eventos_preserve_on_delete.sql` new, `tests/document-decision-command-contract.test.js`). **Documentation commit:** this closeout. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `G28-CAMADA-2`, corrective migration discovered mid-`A6.2` authorization. `A6.2`'s order required confirming that `admin-delete-user`'s hard-delete of `public.usuarios` wouldn't destroy its own audit event; it does under `db/60`'s original `ON DELETE CASCADE` on `usuarios_eventos.usuario_id`, so `A6.2` was correctly HARD-STOPPED and reported instead of implemented with a workaround. `db/60` itself was not edited (applied, immutable) — this is a separate, additive corrective migration.
- **Root cause:** `admin-delete-user` (`supabase/functions/admin-delete-user/index.ts:238-241`) does `adminClient.from("usuarios").delete().eq("id", targetId)` directly. Under `ON DELETE CASCADE`, any `usuarios_eventos` row for that `usuario_id` — inserted before or after — is either destroyed in the same statement or impossible to insert (FK violation, parent already gone). No ordering of an explicit audit insert around the existing delete flow could produce a surviving event.
- **Architect ruling:** `CASCADE` rejected (destroys the trail); dropping the FK entirely rejected (loses integrity while the subject lives). Adopted: `usuario_id` FK → `ON DELETE SET NULL`, plus a denormalized identity snapshot (`usuario_email`, `usuario_nome`, `usuario_tipo`, all nullable) captured by the trigger at insert time from `NEW` — no extra query, no sensitive data (no password/token, no `fornecedor_id`/`cliente_id`; the event's own `payload` already carries the specific changed fields for `perfil_alterado`).
- **Schema:** `usuario_id` — `NOT NULL` dropped, FK dropped/recreated (dynamic discovery via a `pg_constraint` `DO` block, `db/21`-style) as `ON DELETE SET NULL`. `trigger_usuario_evento()` updated in place (`CREATE OR REPLACE`, same trigger binding — no re-`CREATE TRIGGER`) to populate the snapshot. Backfill statement included for correctness (0 rows affected at apply time — staging `usuarios_eventos` was empty). ACL/RLS re-asserted verbatim from `db/60`, verified in the live catalog post-apply.
- **Staging verify (`ucrjtfswnfdlxwtmxnoo`, transactional `BEGIN…ROLLBACK`, synthetic fixtures, zero permanent mutation):** the full `db/60` role matrix re-run and green under the new schema (no regression), **plus the new survival case**: a fully synthetic `auth.users`/`public.usuarios` fixture generated one event, its profile was then `DELETE`d directly (mirroring `admin-delete-user`), and the event row **survived** with `usuario_id` NULL, identity snapshot intact and matching the fixture, `payload`/`tipo_evento` unchanged, still readable by an admin under RLS. Zero residue confirmed afterward. Full role matrix and survival-case detail in `docs/ledgers/G28_LEDGER.md`.
- **Migrations registry:** before — highest recorded `60_usuarios_auditoria_schema`; after — `61_usuarios_eventos_preserve_on_delete` recorded immediately following, no gap.
- **Tests:** `tests/document-decision-command-contract.test.js` **23/23** (allow-list extended for `db/61`). Full-suite file-swap-against-HEAD comparison: before `3704`/`3547`/`157` fail → after `3704`/`3548`/`156` fail — exactly the one intended assertion flipped from fail to pass, zero new failures.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `A6.2` (Edge Function audit wiring) resumes — the schema now supports a surviving `admin-delete-user` audit event. Not authorized by this record; requires the architect to explicitly resume/re-authorize `A6.2` (it was previously authorized once, then paused by the HARD STOP this phase resolves — this closeout does not itself re-open or re-authorize that order).
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Camada 2 — Audit Trail Wiring (Edge Functions) — A6.2 — CLOSED / ACCEPTED

- **Technical commits:** `b67b126` — `Add audit trail writes to admin Edge Functions` (the five Edge Functions + their smoke tests) and `7309349` — `Add A6.2 usuarios_eventos audit trail e2e runner` (`scripts/staging/usuarios-audit-e2e.mjs`). **Documentation commit:** this closeout. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `G28-CAMADA-2`, subphase `A6.2` (Edge Function audit wiring), resumed after `A6.1-B` resolved the FK HARD STOP that had paused it.
- **Per-function table:**

  | Function | tipo_evento | payload shape | insert placement | failure rule |
  |---|---|---|---|---|
  | `admin-create-user` | `usuario_criado` | `{tipo, fornecedor_id, cliente_id}` | last step, after profile insert succeeds | log + `audit_recorded:false`, action stands |
  | `admin-disable-user` | `usuario_desativado` | `{ativo:{de:true,para:false}, motivo}` | last step, after profile update + Auth ban succeed | log + flag, action stands |
  | `admin-reactivate-user` | `usuario_reativado` | `{ativo:{de:false,para:true}}` | last step, after profile update + Auth unban succeed | log + flag, action stands |
  | `admin-reset-user-password` | `senha_resetada` | `{}` (always empty — password never touches audit) | last step, after Auth reset + profile flag succeed | log + flag, action stands |
  | `admin-delete-user` | `usuario_excluido` | `{}` | **before** the profile delete (architect ruling — FK satisfiable only while the row exists; `db/61`'s `ON DELETE SET NULL` lets it survive) | log + flag on insert failure, action stands; **no compensation invented** on the delete's own failure/compensation paths — the event remains as a recorded but not literally accurate "attempted" entry, a documented, accepted trade-off |

- **Common design (all five):** `ator_id` is the caller resolved from the validated JWT (never `auth.uid()`, `NULL` under `service_role`). Identity snapshot (`usuario_email`/`usuario_nome`/`usuario_tipo`) populated explicitly in every insert, since `trigger_usuario_evento()` (`db/60`) excludes itself under `service_role` by design — this is the canonical two-write-paths design now recorded in `PROJECT_STATE.md` ("Binding decisions in force") and `docs/DOCUMENTATION_INDEX.md` §4.
- **Delete-ordering trade-off (recorded, accepted):** `admin-delete-user`'s audit insert precedes the profile delete by architect ruling. If the delete subsequently fails (`USER_HAS_REFERENCES`) or is compensated (`AUTH_DELETE_FAILED`, profile reinserted), the `usuario_excluido` event remains — it records an attempted deletion of a profile that, in the end, was not deleted. No compensation was invented for the audit row on those paths; this is a deliberate, documented scope boundary, not a silent bug.
- **Tests:** 5 smoke files extended (+37 tests: event insert present, `tipo_evento`/`ator_id`/payload shape, no-password assertion, insert-ordering, failure-flag behavior, no audit-table compensation on delete). File-swap regression: `3548`/`156 fail` → `3585`/`156 fail` — zero regressions.
- **Staging E2E (`scripts/staging/usuarios-audit-e2e.mjs`, run by the architect):** `result: PASS`, `15/15` steps, `2026-07-17`, synthetic user `c0d5da9c-471c-459f-b0c4-02110fa81709`. Confirmed: exactly one event per action across all five functions (no double-entry from the trigger under `service_role`); correct `tipo_evento`/`ator_id`/payload/snapshot per action; password absent from the `senha_resetada` payload in any form; all 5 accumulated events survive `admin-delete-user` with `usuario_id` NULL and identity snapshot intact; `public.usuarios`/`auth.users` cleanup zero (the 5 orphaned `usuarios_eventos` rows are the intended, permanent audit-trail artifact, not residue — the table is append-only by design, no `DELETE` policy for any client role).
- **Deploy:** the five Edge Functions deployed to staging (`ucrjtfswnfdlxwtmxnoo`) by the architect — outside this session's credential reach.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `A6.3` (read-only audit panel) — mockup gate is the only prerequisite per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`; closes the `A6` track. Not authorized by this record.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry), `docs/DOCUMENTATION_INDEX.md` §4 (`db/60`/`db/61` rows + narrative entry).

## Camada 2 — User Audit Panel (read-only) — A6.3 — CLOSED / ACCEPTED

- **Technical commit:** `e31f269` — `Add user audit panel` (`js/admin-usuarios-audit-read-model.js` new, `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios-audit-panel.js` new, `js/screens/admin-usuarios-modal.js`, `index.html`, `tests/admin-usuarios-audit-panel.smoke.js` new, `tests/admin-usuarios-audit-read-model.test.js` new, `tests/admin-usuarios.smoke.js`, `tests/boot.smoke.js`). **Documentation commit:** this closeout. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** `G28-CAMADA-2`, subphase `A6.3` (read-only audit panel), closes the `A6` track. Mockup gate satisfied by the architect (2026-07-17) before authorization: panel inside the edit modal below a divider; one row per event (icon, action, actor + detail, timestamp); read-only label; §7.1 truncation on the detail line.
- **Read model (`js/admin-usuarios-audit-read-model.js`, pure, mirrors `document-link-audit-read-model.js`):** maps `usuarios_eventos` rows to a display shape for all 6 possible `tipo_evento` values (the 5 `A6.2` Edge-Function-recorded types plus the trigger's own `perfil_alterado`) — pt-BR action label, human-readable payload phrase, `dd/MM HH:mm` timestamp, defensive fallback for an unrecognized `tipo_evento`, and explicit handling of `usuario_id IS NULL` (`db/61` delete-survival) via a `subjectOrphaned` flag. Never throws.
- **Read helper (`js/admin-usuarios-writes.js` `fetchUsuarioEventos`):** plain RLS-filtered select on `usuarios_eventos` (admin-only, `db/60`) plus a second plain select on `usuarios` to resolve actor email/nome — no RPC, no migration (the order's escalation condition was never triggered).
- **Panel (`js/screens/admin-usuarios-audit-panel.js`, render-only):** divider, "Histórico" header with count badge and "somente leitura" label, one row per event (16px icon, action label, actor+detail via `window.truncatedCell` — §7.1 bundle — timestamp), 5 most recent visible with a "ver todos" toggle for the rest (max-height ~280px scrollable, no pagination). Icon vocabulary: 4 of 6 named explicitly by the mockup (user-plus green for created, ban red for disabled, refresh/key neutral for reactivated/reset); the remaining two (`usuario_excluido`, `perfil_alterado`) reuse this screen's own already-established trash/pencil icons — flagged as an assumption at the visual gate, confirmed acceptable.
- **Wiring:** `js/screens/admin-usuarios-modal.js` `openUsuarioModal`, edit branch only (`isEdit && usr && usr.id`) — no history exists yet on create. Panel load failure never breaks the modal: fail-closed to a discreet "Histórico indisponível", logged, form stays fully usable.
- **Tests:** +37 (22 pure read-model, 14 panel, 1 boot/script-order). File-swap regression: `3585`/`156 fail` → `3622`/`156 fail` — zero regressions.
- **Architect visual gate:** `CONFIRMED` (passed prior to the `UI-INVOKE-ENVELOPE-FIX` HARD STOP that interrupted this closeout).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `G28-CAMADA-2 / A6` track is now `COMPLETE`. See the consolidated closeout note in `PROJECT_STATE.md` for the next front (`TEST-MOCK-FIDELITY-AUDIT`, read-only, promoted to priority).
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry).

## Admin Edge Function Response Envelope Fix — UI-INVOKE-ENVELOPE-FIX — CLOSED / ACCEPTED

- **Technical commit:** `7b37e8e` — `Fix admin Edge Function response envelope unwrap` (`js/admin-usuarios-writes.js`, `tests/admin-usuarios.smoke.js`). **Documentation commit:** this closeout. The current HEAD must be consulted with `git rev-parse HEAD`.
- **Front:** live defect surfaced by the `A6.3` architect visual gate — password reset succeeded in staging but the UI reported the generated password was not found (both a green "Senha resetada" and a red "…valor não foi encontrado" toast fired on the same action).
- **Root cause (confirmed against the real `@supabase/supabase-js` `FunctionsClient.invoke()` source):** `functions.invoke()` returns the raw parsed HTTP JSON body verbatim as `data` — it does not unwrap anything. Every admin-* Edge Function already wraps its payload in `{data: <payload>}` via `jsonResponse()` (`supabase/functions/_shared/response.ts`). Client-side call sites (`js/screens/admin-usuarios-modal.js`: `data.password`, `createData.user_id`, `data.ativo`) read one level too shallow — the real value lived at `data.data.*`. **Pre-existing since `A5.1-A5.2` (`resetarSenha`), not caused by `A6.2`** — `A6.2` only added `audit_recorded` inside the same already-mis-consumed envelope.
- **Fix:** `js/admin-usuarios-writes.js` — new `invokeAdminFunction(name, body)` is the single unwrap point for all five `functions.invoke()`-based writes (`createUsuario`, `disableUsuario`, `deleteUsuario`, `resetarSenha`, `reativarUsuario`). Existing call sites in `admin-usuarios-modal.js` needed no changes.
- **Why tests never caught it:** `tests/admin-usuarios.smoke.js`'s fake `functions.invoke()` mock returned the inner payload flat — one level shallower than the real client, so both sides of the bug were wrong in the same way and cancelled out. Corrected the mock to double-wrap like production.
- **Regression proof:** added 4 direct unwrap tests (one per write beyond the existing full-flow reset-password test) and verified against the pre-fix code with the corrected mock: **5 tests fail without the fix** (the 4 new + the existing full click-through reset-password test), confirming they are real regression guards. File-swap regression: `3622`/`156 fail` → `3626`/`156 fail` — zero collateral regressions.
- **Collateral finding, reported not fixed:** `js/screens/cadastros.js`'s frozen legacy `screenCadastrosUsuarios` has the identical `createUsuario` bug (`createData.user_id` silently `undefined`, observações-save step no-ops) — out of scope, untouched until `A3.4`. Recorded as one more `A3.4` justification.
- **Architect validation:** `OK` — reset shows the generated password, no red toast; create with observações saves correctly.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` pre-existing, not from this session.
- **Next authorizable action:** `TEST-MOCK-FIDELITY-AUDIT` (read-only, promoted to priority — see `PROJECT_STATE.md`), then `A2.1`/`A3.4`.
- **Full detail:** `docs/ledgers/G28_LEDGER.md` (append-only entry).

# HANDOFF HISTORY — ARCHIVED

The complete historical content of the previous handoffs was preserved,
byte for byte, in:

`docs/legacy/pre-model/AGENT_HANDOFF_FULL_SNAPSHOT.md`

Integrity manifest:

`docs/legacy/pre-model/MANIFEST.md`

Snapshot origin commit:

`08b9af5e251de48e938600e5e4b4214e4d1e824e`

SHA-256 of the complete snapshot:

`386810890675714527fc349fa29ddab3fe977dd80c0b270899a7b1a2b3a24b4d`

The snapshot is exclusively historical. It does not represent the active handoff,
must not be edited and must not receive new closeouts.

This section must not accumulate new historical content.
