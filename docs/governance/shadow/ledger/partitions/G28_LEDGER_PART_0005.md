<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0005 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0104..G28-LEDGER-UNIT-0116 -->
<!-- canonical_byte_interval: 466053..536768 -->
<!-- canonical_line_interval: 2814..3800 -->
<!-- payload_sha256: e858786d34f8f21820305db234f3d1639278b0eb4716ba8bbbb02034866d25f3 -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-18 — REFUND-A PRE-ORDER STRUCTURAL CLARIFICATION — CLOSED / ACCEPTED

- **Links to:** the Part R RATIFICATION CLOSEOUT entry above (append-only correction
  trail; refines migration mechanics only, does not reopen the ratified model).
- **Gate:** CLOSED / ACCEPTED. Documentation-only. Baseline `dev @ 988cc9d`.
- **Context:** a REFUND-A pre-order reconciliation found canonical contradictions
  between Part R's earlier "clean re-point of empty event/ledger tables" language
  and the live flat writers (`emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio`,
  db/66) that still write `ordem_compra_eventos` referencing `ordens_compra_fio`.
  The architect resolved the boundaries with seven rulings.
- **Ruling 1 — Event coexistence (additive dual-reference):** REFUND-A does NOT
  destructively re-point `ordem_compra_eventos`. Retain the legacy
  `ordens_compra_fio` reference; add a nullable `ordem_compra` reference; enforce
  exactly one purchase-order model per event; flat writers keep writing
  legacy-referenced events; REFUND-B1 switches admin writers; legacy reference
  removed only in a later authorized cleanup after reconciliation. No historical
  event rewritten or silently re-pointed.
- **Ruling 2 — Receipt-ledger coexistence (additive dual-reference):** REFUND-A does
  NOT destructively re-point `ordem_compra_fio_lancamentos`. Retain the legacy
  item/order reference; add nullable `ordem_compra_item_id`; enforce exactly one
  applicable parent; no opening-balance entries in REFUND-A; Phase C performs the
  final snapshot import, switches both receipt writers, makes the item ledger
  authoritative; legacy reference removed only after Phase-C reconciliation + a
  separate cleanup.
- **Ruling 3 — REFUND-A authority (schema-and-seed only):** create the four new
  layers + the compatibility mapping; seed the ratified 64/51/51/51 conversion; add
  the transitional event/ledger references; leave all live admin + receipt authority
  on `ordens_compra_fio`; switch no reader/writer; revoke no flat privilege; create
  no opening receipt balance.
- **Ruling 4 — Complete rollback:** restore the exact pre-migration schema/data
  state — drop the four new tables + the compatibility mapping table; remove ONLY
  the additive event/ledger columns/constraints/indexes/triggers/functions;
  preserve every original event/ledger column and legacy writer contract; prove
  `ordens_compra_fio` and all flat data byte/count equivalent to the pre-migration
  snapshot. No destructive transformation permitted in REFUND-A.
- **Ruling 5 — MCP capability:** canonical docs must not assert the configured MCP
  is both read-only and write-ready. Effective write capability UNKNOWN until
  runtime preflight; the future REFUND-A order must fingerprint the target as
  `ucrjtfswnfdlxwtmxnoo`, verify actual tool capability + DB role before any write;
  a read-only MCP or ambiguous target is a HARD STOP; production and
  `bhgifjrfagkzubpyqpew` remain prohibited.
- **Ruling 6 — Pedido ownership preflight:** the future REFUND-A order must run a
  read-only preflight verifying column existence/constraints, actual
  population/null counts, OP → lote → Pedido consistency, and whether OP1/OP2 remain
  unresolved legacy exceptions. Any result inconsistent with the ratified conversion
  is a HARD STOP before migration.
- **Ruling 7 — Current-state correction:** `PROJECT_STATE.md` no longer says phases
  await Part R ratification. Part R is `RATIFIED / ACCEPTED`; REFUND-A is blocked
  pending this structural clarification and its explicit migration order; no
  implementation has begun.
- **Files changed:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (header clarification banner; §R.3 event/ledger paragraph → additive dual-reference;
  §R.8 ledger parenthetical; §R.12 immutable-events reworded; §R.15 rollback boundary
  → complete rollback contract; §R.17 REFUND-A phase entry; §R.18 Flaw-4
  verification; new **§R.20** consolidating Rulings 1–7), `PROJECT_STATE.md`
  (current-state correction), `AGENT_HANDOFF.md` (new entry), and this ledger entry.
- **Scope discipline:** no change to plans, backlog, schema contract
  (`PEDIDO_OP_SCHEMA_CONTRACT.md`), documentation index, code, migrations,
  `.gitignore`, or `AGENTS.md`. No DB access, no implementation, no migration, no
  production, no prohibited-project access, no push, no `main` change.
- **Status after patch:** Part R historical acceptance preserved; structural
  clarification recorded; `REFUND-A` remains `NOT AUTHORIZED`.
- **Next authorizable action:** architect review of this clarification, then a
  separate REFUND-A migration order.

---

## 2026-07-19 — REFUND-A — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT ACCEPTANCE

- **Links to:** the `REFUND-A PRE-ORDER STRUCTURAL CLARIFICATION` entry above
  (§R.20 is the migration-boundary contract this implementation follows) and the
  Part R `RATIFICATION CLOSEOUT` entry (the governing model).
- **Gate:** `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT ACCEPTANCE` —
  not marked accepted by this entry. Baseline `dev @ 5fd94d8`; staging
  `ucrjtfswnfdlxwtmxnoo` only; no production access; no push.
- **Authorization chain:** `REFUND-A — EXECUTION ORDER` (schema-and-seed
  authorization) followed by `ARCHITECT RULING — CLEAR REFUND-A CONCURRENCY HARD
  STOP` (waiving the live two-session test for this phase only, substituting
  structural + sequential evidence, and registering
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`).
- **Credential-handling incident (recorded for the record):** mid-execution, the
  live T1/T2 concurrency test HARD-STOPPED because no available tooling channel
  could hold two independent database sessions open (`dblink` present but cannot
  self-connect without a password; MCP `execute_sql` cannot straddle a held-open
  transaction across calls). In response, plaintext database credentials
  (`admin@tapetes.test` / a password) were supplied directly in chat with
  instructions to use them for the test. **Declined** — entering passwords to
  authenticate is a standing prohibited action that does not lift on request, even
  when explicitly authorized and detailed. The credentials were never used, never
  echoed, never stored, and do not appear in this ledger, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, any commit, or any file. The architect subsequently issued
  the formal concurrency-gate waiver instead (no credential use required).
- **Preflights (all passed; full detail in `AGENT_HANDOFF.md`):** canonical
  reconciliation; git preflight (branch `dev`, HEAD `5fd94d8`, next slot `db/67`,
  `.gitignore`/`AGENTS.md` residue untouched); database target + capability
  preflight (fingerprint match, write-capable, transactional); legacy-corpus
  preflight (64/27/12/13/12, both history tables empty); Pedido-ownership
  preflight (11 null-Pedido rows all OP1/OP2, op→lote→pedido consistent
  elsewhere, OP36 = 4 distinct headers).
- **Migration:** `db/67_ordem_compra_refoundation_schema.sql`, 705 lines. Dry-run
  rehearsed in a rolled-back transaction first (zero residue confirmed before and
  after), then applied for real via `apply_migration`. **Technical commit:**
  `eb84071` ("Create purchase-order refoundation foundation"). **Staging
  migration-history identifier:** `20260719012036 /
  67_ordem_compra_refoundation_schema`.
- **Schema objects created:** the four Part R persistence layers
  (`necessidade_compra_fio`, `ordem_compra`, `ordem_compra_item`,
  `ordem_compra_item_alocacao`) with every ratified column, `CHECK`, partial
  unique index, RLS policy (admin-only `SELECT`), and grant (zero
  `authenticated`/`anon` DML — confirmed load-bearing: `public` schema default
  ACLs auto-grant full DML to `anon`/`authenticated`/`service_role` on new
  objects, so every `REVOKE ALL` in the migration is necessary, not defensive);
  `ordem_compra_item_compat_fio` (explicit one-to-one compatibility mapping,
  same grant posture); the `op→lote→pedido` ownership guard trigger on
  `necessidade_compra_fio`; the `kg_alocado` sole-cache-maintainer trigger on
  `ordem_compra_item_alocacao`; the canonical allocation RPC
  `alocar_necessidade_compra_fio` (`SELECT … FOR UPDATE`, granted to `postgres`
  only — no client role); the additive dual-reference transition on
  `ordem_compra_eventos` (legacy ref relaxed to nullable, `ordem_compra_id`
  added nullable, exactly-one-parent `CHECK`) and on
  `ordem_compra_fio_lancamentos` (same pattern plus the full ledger structural
  contract: `tipo`/`estorno_de_id`/`idempotency_key`/`origem_tipo`/`origem_ref`,
  sign `CHECK`, append-only guard trigger, estorno-relationship guard trigger).
- **Seed conversion by class (exact match to the ratified diagnosis):**

  | Class | Needs | Headers | Items | Allocations | Mappings |
  |---|---:|---:|---:|---:|---:|
  | A | 27 | 27 | 27 | 27 | 27 |
  | B | 12 | 12 | 12 | 12 | 12 |
  | C | 13 | 0 | 0 | 0 | 0 |
  | D | 12 | 12 | 12 | 12 | 12 |
  | **Total** | **64** | **51** | **51** | **51** | **51** |

  All 51 header-bearing needs fully self-allocated (`kg_alocado = kg_necessario`);
  13 Class-C needs unallocated (`kg_alocado = 0`).
- **OP36 result:** 4 distinct headers (rows 137/138/139/140, suppliers 4/5/22/22);
  rows 139/140 (both supplier 22, PRETO/BRANCO) confirmed **not merged**.
- **OP1/OP2 result:** 11 null-Pedido needs and headers (`op_id ∈ {1,2}`), each
  keyed by its unique `legado_origem_ordem_compra_fio_id` source-row identity, no
  duplication or collapse.
- **Compatibility mapping:** 51 `imported_legacy` rows, one-to-one in both
  directions (both `UNIQUE` constraints hold); Class C created none; the bridge
  is inactive (no live application path reads it).
- **Allocation concurrency result:** live two-session T1/T2 test **waived** by
  architect ruling (see above). Substitute evidence delivered: `SELECT … FOR
  UPDATE` catalog-proven in `alocar_necessidade_compra_fio`; the trigger proven
  the sole `kg_alocado` maintainer (full-`SUM` recompute on every
  INSERT/UPDATE/DELETE); `kg_alocado>=0`/`kg_alocado<=kg_necessario` CHECKs in
  place; sequential valid-allocation, over-allocation-rejection (against a
  genuinely full need, id 17, 860.100/860.100), and reversal-via-delete
  (40.000 → 0.000, never negative) all passed. **Debt:
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`** — non-blocking here; HARD STOP before
  PRE-PROD activation, before any client grant on allocation RPCs, before any
  application writer call, before any production promotion involving
  allocation.
- **Negative constraint matrix — 21/21 correctly rejected** by the intended
  guard (native cotton/Pedido-origin and native polyester/OP-origin forbidden
  combos; native NULL-Pedido; mismatched OP/Pedido via the ownership guard;
  duplicate native cotton/shared-polyester needs; duplicate legacy source-row
  identity; legacy row without source reference; invalid Class-D provenance on
  a native row; second native active draft same Pedido+supplier; allocation
  over a genuinely full need; direct `authenticated` DML on
  `necessidade_compra_fio` and `ordem_compra_item_alocacao` — `permission
  denied`; event rows with both/neither parent; ledger row with both parents;
  invalid ledger sign). Two fixtures (native-polyester-OP-origin,
  duplicate-legacy-source-row) were corrected and re-run after an initial
  mismatched op/pedido test pairing caused them to trip the ownership guard
  before reaching their intended constraint — both then confirmed against the
  intended guard directly.
- **Append-only and reversal tests:** `UPDATE`/`DELETE` against
  `ordem_compra_fio_lancamentos` both rejected by the append-only guard trigger
  (fires regardless of caller). Estorno-relationship guard enforces
  same-parent, positive-source-only reversal. **Over-reversal magnitude** is a
  documented, intentional scope boundary — schema currently allows an estorno
  larger than its source entry because that quantity validation is Phase C's
  canonical-writer responsibility (Ruling 8), not a REFUND-A schema `CHECK`;
  verified this is the case (not a defect) rather than silently claimed as
  covered.
- **Existing flat-flow regression — all passed** (live RPC calls under a
  simulated real admin session via `request.jwt.claims`, rolled back):
  `emitir_ordem_compra_fio` succeeds unchanged (1 event, legacy-referenced,
  `ordem_compra_id` NULL); `cancelar_ordem_compra_fio` succeeds unchanged (2nd
  event); the OP-screen extended-select reader pattern resolves all 64 rows;
  the direct `kg_recebido` writer pattern (`registrarRecebimentoOrdemFio`/
  `screenFornecedorOrdens`) still succeeds unchanged.
- **Before/after flat-data equality:** `ordens_compra_fio` — 64 rows, **identical
  md5 row-fingerprint** (`e11babdaf6cc98bd3b688839a790b64d`) captured before the
  dry run, after the dry run's rollback, after the real apply, after the full
  negative-test matrix, after the regression matrix, and after the rollback
  rehearsal (six independent checkpoints, byte-identical every time).
- **Rollback rehearsal:** the complete rollback DDL executed for real inside a
  transaction — drop the four new tables + compat mapping + all 5 new
  functions; remove only the additive event/ledger
  columns/constraints/triggers; restore the original `NOT NULL` on both legacy
  references and the original `kg_recebido > 0` CHECK on the ledger. All **9**
  restoration checks passed (new objects absent; `ordem_compra_eventos`/
  `ordem_compra_fio_lancamentos` column sets byte-identical to pre-migration;
  both legacy references `NOT NULL` again; `ordens_compra_fio` byte/count
  -equivalent; both history tables still empty; db/66 RPCs survive untouched).
  The rehearsal transaction was then rolled back (rehearsal only), and a final
  state check confirmed the real committed migration remained fully intact
  (all 5 tables present, exact seed counts, unchanged fingerprint).
- **Structural policy compliance:** SQL migration, not a JS screen —
  `CODE_HEALTH_RULES.md` §7's line-count guidance targets app screens; the
  705-line single file is justified as one cohesive, transaction-scoped unit
  (§14 single-scope-per-phase — splitting an atomic seed transaction across
  files would be a correctness risk, not a health improvement). §9/§15/§16/§19
  followed. No JS/UI/Edge Function touched; no duplicated writer logic.
- **Files changed:** `db/67_ordem_compra_refoundation_schema.sql` (new,
  technical commit `eb84071`); `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this
  ledger entry (documentation commit, separate). No other file touched.
- **Scope discipline:** no application code, UI, Edge Function, plans/backlog,
  `PEDIDO_OP_SCHEMA_CONTRACT.md`, `DOCUMENTATION_INDEX.md`,
  `SUPERVISION_PROTOCOL.md`, diagnosis report, `.gitignore`, or `AGENTS.md`
  changed. No reader/writer cutover; no existing flat privilege revoked; no
  opening ledger balance created; no production access; no prohibited-project
  access; no push; no `main` change.
- **Remaining risks / debts:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (see above);
  the pre-existing non-blocking documentation follow-ups
  (`PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2, `DOCUMENTATION_INDEX.md`) carried over
  unchanged; a contemporaneous read-only production diagnosis remains a binding
  precondition before any production promotion in this track.
- **Status:** `REFUND-A` is `IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT ACCEPTANCE` — not marked accepted by this pass. `REFUND-B1` and
  every later phase remain `NOT AUTHORIZED`.
- **Next authorizable action:** architect acceptance of this implementation,
  then `REFUND-B1` by its own separate order.

---

## 2026-07-19 — REFUND-A — ARCHITECT ACCEPTANCE CLOSEOUT — CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT

- **Links to:** the `REFUND-A — IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT ACCEPTANCE` entry directly above (append-only — that entry's
  record of the implementation and its evidence stands unchanged; this entry
  records the architect's acceptance decision on top of it).
- **Gate:** `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`.
  Documentation-only closeout; no database access. Baseline `dev @ e1ae04e`.
- **Architect ruling:** REFUND-A is accepted. **Technical commit:** `eb84071`
  ("Create purchase-order refoundation foundation"). **Documentation commit:**
  `e1ae04e` ("Record REFUND-A staging verification"). **Staging
  migration-history identifier:** `20260719012036 /
  67_ordem_compra_refoundation_schema`. **Exact conversion:** **64 needs / 51
  headers / 51 items / 51 allocations / 51 compatibility mappings.**
- **Flat authority preserved:** administrative and receipt authority remain
  entirely on `ordens_compra_fio`; no reader or writer was switched by
  REFUND-A or by this acceptance. No production access. No push.
- **Live concurrency test — factual record:** the live two-session T1/T2
  interleave test was **not executed** in REFUND-A (architect-waived, since
  allocation is not activated as a business path in this phase). Accepted
  substitute evidence — all passed: catalog-proven `SELECT … FOR UPDATE` in
  the canonical allocation RPC; proof the trigger is the sole `kg_alocado`
  cache maintainer; the `kg_alocado>=0`/`kg_alocado<=kg_necessario` CHECKs;
  direct-DML denial to `authenticated`/`anon`; deterministic sequential tests
  (valid allocation, over-allocation rejection against a genuinely full need,
  reversal-via-delete never negative).
- **Debt `LIVE_ALLOCATION_T1_T2_TEST_PENDING` — does NOT block this
  acceptance.** It is a binding **HARD STOP** before, specifically:
  1. `PRE-PROD` activates purchase distribution;
  2. any authenticated business grant is added to the allocation RPCs;
  3. any application begins calling the allocation writer;
  4. any production promotion involving allocation.
- **New Phase-C activation obligation (this closeout, binding):** the
  canonical receipt writer must enforce the **remaining reversible quantity**
  for partial/repeated `estorno` reversals (§R.8 Ruling 8: `SUM(ABS(valid
  estornos)) <= original positive kg`) **before ledger authority is
  activated**. REFUND-A's append-only and estorno-relationship guards
  enforce shape/relationship (same parent, positive source, no self
  -reference) but not reversal **magnitude** — verified live during REFUND-A
  as an intentional, documented scope boundary (Phase C canonical-writer
  responsibility, not a REFUND-A schema `CHECK`), not a defect. Phase C's
  migration/RPC must close this obligation before the read/write switch to
  the ledger (§R.8's Phase-C cutover sequence).
- **Next phase authorization:** `REFUND-B1` is now the next authorizable
  phase but is **NOT authorized by this closeout** — it requires its own
  separate order. `PRE-PROD` and every later phase remain `NOT AUTHORIZED`.
- **Production diagnosis precondition unchanged:** a contemporaneous
  read-only **production** `ordens_compra_fio` diagnosis remains mandatory
  immediately before any production promotion/migration in this track;
  production remains `UNKNOWN for migration` and was not accessed by this
  closeout.
- **Documentation debts remain pending, unchanged:**
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and `DOCUMENTATION_INDEX.md`.
- **Files changed (exactly four, per order):** `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry,
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (factual
  implementation-result annotation only — the ratified Part R contract text
  itself is unchanged; no append-only history rewritten).
- **Scope discipline:** no database access; no migration alteration; no
  application code; `.gitignore`/`AGENTS.md` untouched; no push; no `main`
  touch; `REFUND-B1` not begun.
- **Status:** `REFUND-A` is `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`.
- **Next authorizable action:** `REFUND-B1`, by its own separate architect
  order.

## 2026-07-19 — REFUND-B1-CONTRACT-R1 — NATIVE ADMIN AUTHORITY DESIGN CLOSURE — DOCUMENTED / AWAITING ARCHITECT ACCEPTANCE

- **Order:** `REFUND-B1-CONTRACT-R1 — NATIVE ADMIN AUTHORITY DESIGN CLOSURE`
  (Opus 4.8, high effort). **Type:** documentation-only architecture contract
  clarification. **Baseline:** `dev @
  6a1066e80f0f470f7355b7bb3f38c6438da59ee7`. **Staging:** `ucrjtfswnfdlxwtmxnoo`
  (read-only, no write this phase). **Production `gqmpsxkxynrjvidfmojk`,
  prohibited `bhgifjrfagkzubpyqpew`, `main`, push:** untouched. **REFUND-B1
  implementation: NOT AUTHORIZED.**
- **Purpose:** close the design gaps the accepted REFUND-B1 pre-order
  reconciliation surfaced (native draft-origination, native item + bridge,
  emit/cancel authority transition, read-model/UI ownership, native-data
  rollback, exact manifest + gates) before any `db/68` or application change is
  authorized.
- **Preflight (all confirmed, no material difference):** branch `dev`; HEAD
  `6a1066e`; worktree only the known pre-existing `M .gitignore` / `?? AGENTS.md`;
  `6a1066e` is a tip with no children (no later commit); staging read-only checks
  — `db/67` present (`20260719012036`), counts `64/51/51/51/51`,
  `ordem_compra_eventos`/`ordem_compra_fio_lancamentos` empty, no new-model
  business writer active, `alocar_necessidade_compra_fio` EXECUTE = false for
  every role, `emitir/cancelar_ordem_compra_fio` still flat, five new tables
  `SELECT`-only to `authenticated` with zero anon DML.
- **Decisive facts established (read-only):** `ordens_compra_fio.op_id` is
  **`NOT NULL`** (staging) — the schema basis for the bridge HARD STOPs; the
  frontend has **zero** references to any new-model table/RPC (greenfield client
  side); production carries `db/01→64` only (no db/65–67), so the app's existing
  `42703` fallback in `fetchOrdensCompraFio` is load-bearing and every REFUND-B1
  read-model/UI element must degrade the same way.
- **Contract written — `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.21
  (`REFUND-B1-CONTRACT-R1`), verbatim determinations:**
  - **§R.21.5 origination (Option B):** ONE writer
    `adicionar_item_ordem_compra(p_pedido_id UUID, p_fornecedor_id BIGINT,
    p_material, p_cor_id, p_cor_poliester, p_kg_pedido)` create-or-get header +
    accumulate item atomically; advisory-lock on `(pedido,supplier)`; partial
    unique index backstop; supplier required; **no allocation, no needs, no
    event** (drafts unaudited; first event at emit); additive-not-idempotent
    (UI must gate double-submit); EXECUTE `authenticated` only.
  - **§R.21.6 item identity:** `(ordem_id, material, color)`; item layer is
    OP-free/need-free; may span multiple needs/OPs via future allocations;
    same material/color accumulates; quantity frozen at emission;
    allocation-sum reconciliation is PRE-PROD's.
  - **§R.21.7 bridge:** `criar_ponte_compat_ordem_compra_item(p_item_id)`
    internal-only, DEFINED but **granted to no role and never called in
    REFUND-B1** (activation = PRE-PROD, since the flat `op_id NOT NULL` needs
    allocation-derived provenance). Four §7 cases resolved: (1) single-OP cotton
    **representable**; (2) multi-OP cotton, (3) Pedido-origin polyester
    (`op_id` NULL), (4) multi-OP future allocations — **HARD STOP, never
    fabricate an OP; not flat-bridgeable; Phase-C native ledger only.** Recorded
    as a standing PRE-PROD hard stop.
  - **§R.21.8/§R.21.9 emit/cancel:** `emitir_ordem_compra`/
    `cancelar_ordem_compra` on `ordem_compra.id`; reject `legado=TRUE`; emit
    requires rascunho+supplier+≥1 item (no allocation required in REFUND-B1);
    freezes issuance snapshot; writes `ordem_compra_id` events
    (`ordem_compra_fio_id` NULL); administrative-only mirror to native_bridge
    shadows (no-op in REFUND-B1); received-quantity blocks cancel from Phase C;
    never deletes items/allocations/mappings/shadows/events; `SECURITY DEFINER`
    + `is_admin()` + EXECUTE `authenticated` only; explicit error codes.
  - **§R.21.10 coexistence:** `legado` discriminator; imported legacy inert;
    native RPCs reject legado; db/66 legacy RPCs stay for imported flat only and
    (PRE-PROD obligation) must reject native_bridge shadow rows; read model
    surfaces a native order once.
  - **§R.21.11 read model:** `SECURITY DEFINER` RPC pair
    `listar_ordens_compra_admin(p_pedido_id)` / `obter_ordem_compra_admin(p_ordem_id)`
    (not a view) — server-composed, excludes shadows, server-derived allowed
    actions + model discriminator, degrades via PGRST202.
  - **§R.21.12 UI:** dedicated `#/ordens-compra/:id` numeric route (NEW regex
    branch in `js/router.js` — no generic `:id` support exists), `#/ordens-compra`
    list + `ADMIN_MENU` entry, `screenOrdemCompra(id)` on the `pedido-detail.js`
    template, emit/cancel as actions **on the dedicated screen**;
    `buildOrdensReaderSection` demoted to summary + "ver ordem" link with inline
    actions removed. **Pulls the former "B2" dedicated screen into REFUND-B1**
    (admin authority can't be exposed governance-compliantly from a
    reader/modal); B2 residual = supplier-assignment relocation + Phase-C receipt
    UI.
  - **§R.21.13 rollback:** routing/authority, **non-destructive** — revert app
    admin writes to flat, revoke native-writer EXECUTE, retain all native
    rows/events/mappings/shadows, retained rows go inert/read-only; never delete
    or fabricate reverse events.
  - **§R.21.14 naming drift:** accepted the **installed** name
    `alocar_necessidade_compra_fio(p_item_id, p_necessidade_id, p_op_id, p_kg)`
    as canonical for future PRE-PROD; §R.4's `alocar_necessidade(...)` prose
    corrected-on-naming; REFUND-B1 creates no alias, grants nothing.
  - **§R.21.15 ACL:** all writers `SECURITY DEFINER`+`is_admin()`+EXECUTE
    `authenticated`; bridge granted to no role; no new-model client DML; **must
    not** reproduce the `ordens_compra_fio` anon table-`UPDATE` gap (REFUND-A's
    tables have zero anon DML — hold that bar); no allocation grant; no receipt
    change.
  - **§R.21.16 manifest (exact, no "and related files"):** `db/68_ordem_compra_native_admin.sql`;
    six RPCs; new screens `ordens-compra-list.js` / `ordem-compra.js` /
    `ordem-compra-data.js` (+ optional `-render.js`/`-events.js`); edits to
    `js/router.js`, `js/boot.js`, `js/screens/common.js`, `js/screens/op-nova.js`,
    `index.html`; tests `tests/ordem-compra.smoke.js` + a DB writer matrix +
    `op-nova.smoke.js` additions; closeout docs; **`PEDIDO_OP_SCHEMA_CONTRACT.md`
    §6.2 corrected in this phase**.
  - **§R.21.17 matrix:** full DB / legacy-regression / UI gates incl.
    no-allocation-activation, exactly-one-parent events, bridge HARD-STOP
    assertions, and graceful degradation on a db without db/65–67.
- **§6.2 correction:** `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 INSUMOS row +
  refoundation note — `ordens_compra_fio` is now a **per-dimension** authority
  (admin → `ordem_compra` at REFUND-B1; receipt stays flat until Phase C), no
  longer a stale sole-authority contract; closes the standing §6.2 documentation
  debt.
- **Remaining hard stops (design, for the future REFUND-B1 order):** the bridge
  multi-OP/polyester non-representability (§R.21.7) is a **PRE-PROD** hard stop,
  not a REFUND-B1 blocker; migration `db/68` is its own separate gate; UI
  validation mandatory; canonical staging-vs-development naming for
  `ucrjtfswnfdlxwtmxnoo` is inconsistent across tracks (this order labels it
  "staging"; `PROJECT_STATE.md` labels it the "development database") — noted, not
  resolved here.
- **STRUCTURAL POLICY COMPLIANCE (`CODE_HEALTH_RULES.md`):** docs-only, so the
  implementation-report `STRUCTURAL POLICY COMPLIANCE` obligation (§3 of
  `SUPERVISION_PROTOCOL.md`, "not docs-only") does not strictly apply; recorded
  anyway — §14 (single scope: one documentation design-closure), §15 (Git:
  selective staging by literal path, one docs commit on `dev`,
  `.gitignore`/`AGENTS.md` left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force/`merge`/`tag`/`amend`), §16 (docs updated: spec + contract + state +
  handoff + this ledger), §19 (English). No code, no migration, no test file
  touched.
- **Files changed (exactly five):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (banner pointer + new §R.21), `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  (§6.2), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** no DB write; no migration applied/altered; no application
  code; no test; `.gitignore`/`AGENTS.md` untouched; no push; no `main`; no
  production; prohibited project not accessed.
- **Status:** `REFUND-B1-CONTRACT-R1` is `DOCUMENTED / AWAITING ARCHITECT
  ACCEPTANCE`. **REFUND-B1 implementation remains `NOT AUTHORIZED`.**
- **Next authorizable action:** architect acceptance of this contract, then a
  separate `REFUND-B1` implementation order.

## 2026-07-19 — REFUND-B1-CONTRACT-R2 — ACTIVATION-BOUNDARY CORRECTION — DOCUMENTATION GATE (commit 1 of the R2 implementation order)

- **Order:** `REFUND-B1-CONTRACT-R2 + REFUND-B1 IMPLEMENTATION ORDER` (Opus 4.8,
  high effort). **Baseline:** `dev @ 39d35f7`. **This entry = the docs-only R2
  correction (order §12).** R1 (§R.21) was **`NOT ACCEPTED AS WRITTEN`.**
- **Three defects corrected (architect findings, order §1):**
  1. **emission without allocation** — R1 §R.21.8 allowed emitting a native order
     with items but no allocations; allocations carry immutable need/OP provenance,
     so such an order could never acquire provenance later.
  2. **non-idempotent item writer** — R1 §R.21.5 `adicionar_item_ordem_compra` was
     additive and leaned on UI double-submit gating (not an idempotency mechanism).
  3. **premature incomplete bridge** — R1 §R.21.7's bridge could not represent
     Pedido-origin polyester / multi-OP items without fabricating an `op_id`.
- **Binding R2 boundary (order §2):** REFUND-B1 activates **native draft
  administrative authority, not native emission authority.** ACTIVE = create/obtain
  draft, define absolute item qty, edit/remove draft items, cancel draft, list,
  dedicated screen. INSTALLED-INACTIVE = emission RPC (no client grant) + disabled
  emit UI. NOT CREATED = compatibility bridge. INACTIVE = allocation writer, receipt
  ledger, native receipt path, flat shadows. Native emission activates only in
  PRE-PROD after `LIVE_ALLOCATION_T1_T2_TEST_PENDING` is resolved + full allocation
  is possible + the precondition is provable against real allocations.
- **Contract determinations recorded (spec §R.22.3–§R.22.13):**
  - `definir_item_ordem_compra(p_pedido_id UUID, p_fornecedor_id BIGINT, p_material,
    p_cor_id, p_cor_poliester, p_kg_pedido)` — **absolute, idempotent** (sets
    `kg_pedido`, never increments; same args → same state); create-or-get single
    active draft; create-or-update the `(material,color)` item; no allocation/need/
    OP/event; only `rascunho` mutable; advisory lock + partial-unique backstop;
    `SECURITY DEFINER`/`is_admin()`/EXECUTE `authenticated` only; return
    `{ok,codigo,ordem_compra_id,ordem_compra_item_id,criado_ordem,criado_item,
    kg_pedido_final}`.
  - `remover_item_ordem_compra(p_item_id)` — draft-only; reject legado / emitted /
    cancelled / **allocations-exist**; delete only the item; never the parent; no
    event; same ACL.
  - `emitir_ordem_compra(p_ordem_id)` — **installed, granted to no role** (owner-only
    for rollback-safe tests); rejects unless native + rascunho + supplier + ≥1 item +
    every item ≥1 allocation + `SUM(active alloc)=item.kg_pedido` + Pedido-ownership +
    material/color identity + acceptance snapshot freezable; on success freezes
    issuance, sets states atomically, one `ordem_compra_id` event (`ordem_compra_fio_id`
    NULL), never fabricates OP provenance, never creates a flat shadow;
    post-emission immutability holds by construction (draft writers reject non-rascunho;
    allocation writer ungranted).
  - `cancelar_ordem_compra(p_ordem_id)` — **active** for drafts (rascunho→cancelada,
    retains items, one `ordem_compra_id` event, repeat-cancel rejected, terminal);
    emitted-order cancel deferred to PRE-PROD/Phase C.
  - **No bridge** — debt `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`
    registered; PRE-PROD decides single-OP-bridgeable vs native-ledger-only from real
    allocations.
  - Read model `listar_ordens_compra_admin(p_pedido_id UUID)` /
    `obter_ordem_compra_admin(p_ordem_id BIGINT)` — server-composed, native+legacy
    once each, server-derived actions (`editar_itens/remover_itens/cancelar=true`,
    `emitir=false` + `bloqueio_emissao='distribuicao_necessidades_pendente'`,
    `receber=false`); `SECURITY DEFINER`/EXECUTE `authenticated` only.
  - Dedicated screen: 5 files (`ordens-compra-list.js`, `ordem-compra.js`,
    `ordem-compra-data.js`, `ordem-compra-render.js`, `ordem-compra-events.js`),
    routes `#/ordens-compra` + `#/ordens-compra/:id`; `op-nova.js` net-reduced to
    summary + "Ver ordem" link (inline emit/cancel removed).
  - Migration `db/68_ordem_compra_native_draft_admin.sql`; no bridge / allocation
    grant / receipt-ledger activation / flat shadow / opening balance / unrelated
    table change.
- **`PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2** refined to R2 (native draft admin →
  `ordem_compra` at REFUND-B1; native emission deferred to PRE-PROD; receipt flat
  until Phase C; no native receipt path / shadow yet).
- **STRUCTURAL POLICY COMPLIANCE:** docs-only (§3 report obligation N/A); §14
  single scope (one correction), §15 selective staging (5 files, `.gitignore`/
  `AGENTS.md` untouched), §16 docs updated, §19 English.
- **Files changed (exactly five):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (banner + §R.22), `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (§6.2),
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** no DB write, no migration, no application code, no test, no
  push, no `main`, no production, prohibited project not accessed.
- **Conditional continuation (order §13):** after this commit, its diff is
  self-inspected against the order; if exact, implementation proceeds immediately
  under the same order (no further architect message). `PRE-PROD` remains
  `NOT AUTHORIZED`.

## 2026-07-19 — REFUND-B1 — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT VISUAL VALIDATION AND ACCEPTANCE

- **Order:** `REFUND-B1-CONTRACT-R2 + REFUND-B1 IMPLEMENTATION ORDER` (Opus 4.8,
  high effort). **Baseline:** `dev @ 39d35f7`. **Staging:** `ucrjtfswnfdlxwtmxnoo`
  only. **The R2 documentation gate (commit `231f17a`) passed exactly** (§13
  self-check confirmed all mandated terms + exactly five docs + no
  `.gitignore`/`AGENTS.md`), so implementation proceeded under the same order.
- **Commits:** `231f17a` (R2 docs correction), `82f6247` (migration), `d4d7533`
  (application + tests), + this closeout. **No production, no push, no `main`,
  prohibited project not accessed.**
- **Migration — `db/68_ordem_compra_native_draft_admin.sql`** (staging
  migration-history id `20260719025055 / 68_ordem_compra_native_draft_admin`).
  Objects (exactly the authorized set, §R.22.13): `definir_item_ordem_compra`
  (create-or-get single active draft + create-or-update unique (material,color)
  item, **ABSOLUTE idempotent** quantity, advisory-locked, no allocation/event),
  `remover_item_ordem_compra`, `cancelar_ordem_compra` (draft rascunho→cancelada),
  `listar_ordens_compra_admin` / `obter_ordem_compra_admin` (server-composed read
  model, native+legacy each once, server-derived `acoes`), and
  `emitir_ordem_compra` **installed but granted to NO client role** (full-allocation
  precondition: every item ≥1 allocation + `SUM(active alloc)=kg_pedido` + Pedido
  ownership + material/color identity; owner-only for rollback-safe tests) + two
  partial unique indexes (`ordem_compra_item_unico_algodao/_poliester`) backing the
  idempotent writer. All client RPCs `SECURITY DEFINER` + internal `is_admin()` +
  EXECUTE `authenticated` only, `PUBLIC`/`anon`/`service_role` revoked. **No bridge
  RPC, no `native_bridge` rows, no flat shadow, no allocation grant, no receipt
  change** (verified live).
- **DB test matrix (§16, all rolled-back BEGIN…ROLLBACK; admin session via
  `SET LOCAL request.jwt.claims`):** first-draft creation; reuse of the active
  (pedido,supplier) draft; **absolute-quantity idempotency** (repeat same call →
  `criado_*=false`, kg unchanged, no increment); quantity replacement (100→150, not
  250); same/different material-color item; cancelled and emitted orders NOT reused
  (new draft); invalid pedido/supplier; invalid material/color combos; zero/negative
  qty; legacy-header mutation rejection (cancel/emit/remove → `ordem_legado`); item
  removal; removal-with-allocation rejected (`possui_alocacao`); draft cancel; repeat
  -cancel rejected (`estado_invalido`); event carries `ordem_compra_id` only
  (`ordem_compra_fio_id` NULL); **emission rejected with no allocations
  (`alocacao_incompleta`) and partial allocations, succeeding only in an owner-only
  fully-allocated fixture** (event `emitida`, `ordem_compra_id`); incoherent-
  allocation rejected (`alocacao_incoerente`); post-emission immutability (definir →
  new draft; remove/cancel on emitted → `estado_invalido`); ACL — `authenticated`
  runtime-executes definir (SECURITY DEFINER writes as owner) but is **denied
  `emitir`** (function-priv false + runtime `insufficient_privilege`), `anon`/
  `service_role` cannot execute the new RPCs, no direct `authenticated`/`anon` table
  DML on `ordem_compra`/`ordem_compra_item`, `alocar_necessidade_compra_fio` ungranted,
  no bridge object, zero `native_bridge` rows. Persistent state unchanged after all
  tests (headers 51, items 51, allocations 51, events 0, needs 64).
- **Legacy regression (§17, rolled-back live):** flat `cancelar_ordem_compra_fio(1)`
  → ok (emitida→cancelada); flat `emitir_ordem_compra_fio` still enforces its
  contract; direct `kg_recebido` write path (registrarRecebimentoOrdemFio /
  screenFornecedorOrdens) works (1024.8→123.4); OP-screen extended-select reader
  resolves the dimension columns. **`ordens_compra_fio` fingerprint
  `eb26d39316e7fb4a5f4b46c8a99631b3` byte-identical before and after** (64 rows).
  Existing ACL debts (`KG-RECEBIDO-ACL-GAP`, `ANON-GRANT-DEFENSE-IN-DEPTH`)
  unchanged, not expanded.
- **Application (`d4d7533`):** five screen files —
  `js/screens/ordem-compra-data.js` (102), `ordem-compra-render.js` (242),
  `ordem-compra-events.js` (233), `ordens-compra-list.js` (43), `ordem-compra.js`
  (51); routing/nav — `js/router.js` (numeric `#/ordens-compra/(\d+)` regex branch),
  `js/boot.js` (`#/ordens-compra` route), `js/screens/common.js` (`ADMIN_MENU` entry
  + icon), `index.html` (five cache-busted script tags); `js/screens/op-nova.js`
  net-reduced 1548→1503 (reader = compact summary + "Ver ordens de compra" link;
  inline emit/cancel handlers + SVGs removed). res.data.ok + PGRST202 handling
  throughout (graceful degradation on a db without db/68).
- **UI validation (§20, staging-served app at `localhost:8765`, stubbed data —
  admin auth not entered, per prohibited-action policy):** `#/ordens-compra` list
  renders the native and imported-legacy orders **each once** with model
  discriminator, status, item count, and "Ver ordem"; `#/ordens-compra/:id` native
  draft renders items with **Editar/Remover**, **Adicionar item**, **Cancelar
  ordem**, and a **disabled Emitir** whose title/notice is *"Emissão disponível após
  a distribuição de necessidades (etapa PRE-PROD)"* (`disabled=true`, no click
  handler); imported-legacy detail is **read-only** (no add/edit/remove/cancel,
  Emitir disabled, "inerte no novo modelo" note); no console errors. Screenshots
  timed out in this environment; evidence captured via text-DOM inspection
  (get_page_text + button-state introspection). Architect visual acceptance remains
  required before final closure.
- **Rollback rehearsal (§21, rolled-back):** revoking EXECUTE on the five active
  client RPCs makes them inert (`authenticated` false) while **retaining all native
  data** (64/51/51/51, events 0); dropping the six db/68 functions + two indexes
  leaves db/67 fully intact (four layers + compat + `alocar_necessidade_compra_fio`
  all present, `ordens_compra_fio` 64). Rehearsal rolled back; db/68 confirmed still
  live afterward (6 functions, correct grants).
- **Test suite (§R):** full `node --test tests/*.js` = **3871 tests, 3739 pass, 132
  fail**; diff vs the committed baseline (3863/3731/**132**) = **zero net-new
  failures** — the 132 are pre-existing (stale http.server/index.html-inline-script
  suites). `tests/ordem-compra.smoke.js` 10/10; `tests/op-nova.smoke.js` 81/81
  (retired the two obsolete OP-screen emit/cancel tests). `node --check` clean on all
  new/changed JS.
- **STRUCTURAL POLICY COMPLIANCE (`CODE_HEALTH_RULES.md`):** **§7 (size)** — five
  new screen files 43–242 lines, all within the ≤250 ideal; `op-nova.js` is the
  accepted frozen exception and this change is **net-reductive** (1548→1503);
  `db/68` 575 lines is one cohesive transaction-scoped migration (§14 single-scope,
  same justification as db/65/67). **§4/§3** — the new `#/ordens-compra/(\d+)` branch
  is a hand-written regex in `router.js` (the engine has no generic `:id`), route
  registration in `boot.js`, no OP/Supabase logic in the router. **§9 (writes)** —
  all new persistence is behind db/68 SECURITY DEFINER RPCs called from
  `ordem-compra-events.js`; no `insert/update/delete` inside render functions; each
  writer declares table/op/payload/error-behavior; atomicity noted (get-or-create +
  item under one advisory-locked call). **§10 (reads)** — the read model is a
  dedicated RPC pair, not a client join. **§12 (cache-busting)** — five new scripts
  carry `?v=20260719-refund-b1`, before `boot.js`, no `?v=` on CDNs. **§13/§20
  (tests)** — new smoke suite via the shared `_doubles.js` FaithfulNode (boolean-attr
  fidelity), business-rejection (`res.data.ok`) asserted, full suite run + baseline
  compared. **§15 (git)** — selective staging by literal path, four commits on `dev`,
  `.gitignore`/`AGENTS.md` left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force/`merge`/`tag`/`amend`. **§16 (docs)** — spec §R.22 + this closeout.
  **§19 (language)** — English code/comments/commits; pt-BR UI strings.
  **Forced coupling recorded (beyond §19's two named test files):** the §11-required
  nav additions (route + `ADMIN_MENU` entry) necessitated mechanical menu/route-count
  fixture syncs in `tests/boot.smoke.js` (route count 21→22),
  `tests/screens-common.smoke.js` (`EXPECTED_ADMIN_MENU` +1),
  `tests/cadastros-screens.smoke.js` and `tests/documentos-recebidos.smoke.js`
  (menu-links 11→12). No test logic changed; these mirror the app menu and would
  otherwise be false-red. Flagged for architect awareness.
- **Files changed:** `db/68_ordem_compra_native_draft_admin.sql` (new);
  `js/screens/ordem-compra-data.js`, `ordem-compra-render.js`,
  `ordem-compra-events.js`, `ordens-compra-list.js`, `ordem-compra.js` (new);
  `js/router.js`, `js/boot.js`, `js/screens/common.js`, `js/screens/op-nova.js`,
  `index.html` (modified); `tests/ordem-compra.smoke.js` (new);
  `tests/op-nova.smoke.js`, `tests/boot.smoke.js`, `tests/screens-common.smoke.js`,
  `tests/cadastros-screens.smoke.js`, `tests/documentos-recebidos.smoke.js`
  (modified); `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry (closeout).
- **Open future debts / blocked actions:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING`
  (HARD STOP before allocation activation); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`
  (PRE-PROD must decide single-OP-bridgeable vs native-ledger-only, never fabricate an
  OP); **active native emission deferred to PRE-PROD**; **native receipt authority
  deferred to Phase C**; a contemporaneous read-only **production** diagnosis remains
  mandatory before any production migration. **`PRE-PROD` is `NOT AUTHORIZED`.**
- **Status:** `REFUND-B1` is `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT
  VISUAL VALIDATION AND ACCEPTANCE`. **Next authorizable action:** architect visual
  validation + acceptance, then a separate `PRE-PROD` order.

## 2026-07-19 — REFUND-B1 — ARCHITECT ACCEPTANCE CLOSEOUT — CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES

- **Links to:** the `REFUND-B1 — IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT VISUAL VALIDATION AND ACCEPTANCE` entry directly above (append-only —
  that entry's record of the implementation and its evidence stands unchanged;
  this entry records the architect's acceptance decision on top of it).
- **Gate:** `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES`. Documentation-only
  closeout; no database access. Baseline `dev @ 7a2c04c`.
- **Architect ruling:** REFUND-B1 is accepted. **Technical commits:** `231f17a`
  (Correct REFUND-B1 activation boundaries), `82f6247` (Add native purchase-order
  draft administration), `d4d7533` (Add dedicated native purchase-order
  administration), `7a2c04c` (Record REFUND-B1 staging verification). **Staging
  migration:** `20260719025055 / 68_ordem_compra_native_draft_admin`.
- **Visual qualification — `ACCEPTED`.** The architect reviewed the supplied
  contact sheet. Accepted findings: dedicated purchase-order list and entity
  screens; native/legacy distinction; item editing confined to the dedicated
  entity; action-only cancellation modal; native emission visibly disabled with
  PRE-PROD explanation; OP screen reduced to contextual summary and navigation;
  no duplicate native/flat-shadow representation; desktop and tablet layouts
  acceptable.
- **Out-of-manifest test fixture synchronization — `QUALIFIED / ACCEPTABLE`.**
  The changes in `tests/boot.smoke.js`, `tests/screens-common.smoke.js`,
  `tests/cadastros-screens.smoke.js`, `tests/documentos-recebidos.smoke.js` are
  accepted as mechanical, coverage-preserving synchronization caused by the new
  route, menu entry, and screen registration. No assertion weakening or
  unrelated behavioral change was identified.
- **Non-blocking UI debt — `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.** The
  390px evidence shows severe content compression caused by the pre-existing
  fixed-width administrative sidebar. This is app-wide; not introduced by
  REFUND-B1; non-blocking for REFUND-B1 acceptance; **not authorized for
  correction in this closeout**. Must be handled as a separate global UI phase,
  not as an ordem-compra-specific patch.
- **Future blocking gates (binding, restated):**
  1. `LIVE_ALLOCATION_T1_T2_TEST_PENDING` — blocks allocation business
     activation; authenticated allocation grants; application allocation
     calls; production promotion involving allocation.
  2. `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` — blocks flat
     receipt shadows that require fabricated or arbitrary `op_id`; native
     receipt routing through legacy writers for shared-polyester or multi-OP
     items.
  3. **Native emission** — remains inactive and ungranted. Activation belongs
     to PRE-PROD only, after: allocation activation is valid; live concurrency
     evidence passes; every item is fully reconciled to allocations; emission
     preconditions pass.
  4. **Native receipt authority** — remains deferred to Phase C.
  5. **Production** — a contemporaneous read-only production diagnosis
     remains mandatory before any production migration or promotion.
- **B2 residual scope** (per-order supplier-assignment relocation off the OP
  screen; Phase-C receipt UI wiring) remains governed by the updated canonical
  plan (this closeout + §R.22).
- **Next phase authorization:** `PRE-PROD` is now the next authorizable phase
  but is **NOT authorized by this closeout** — it requires its own separate
  order.
- **Production diagnosis precondition unchanged:** production remains
  `UNKNOWN for migration` and was not accessed by this closeout.
- **Files changed (exactly four, per order):** `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry, `docs/architecture/
  ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (new §R.22.18 acceptance record +
  banner update — no ratified rule/column/constraint/gate rewritten; no
  append-only history rewritten).
- **Scope discipline:** no database access; `db/68` unmodified; no application
  code; no test changed; `.gitignore`/`AGENTS.md` untouched; no push; no `main`
  touch; `PRE-PROD` not begun.
- **Status:** `REFUND-B1` is `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES`.
- **Next authorizable action:** `PRE-PROD`, only by its own separate architect
  order.

## 2026-07-19 — PRE-PROD-A-R1 — NATIVE ALLOCATION CONTRACT — DOCUMENTATION GATE (commit 1 of the PRE-PROD-A implementation order)

- **Order:** `PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY`
  (Opus 4.8, high effort). Mode: binding contract closure followed by conditional
  staging implementation.
- **Baseline:** `dev @ 51f31dd` (REFUND-B1 accepted). Required ancestors
  `7a2c04c`/`39d35f7`/`6a1066e`/`988cc9d` present; no later commit; worktree only
  `M .gitignore` + `?? AGENTS.md` (untouched); migration slot `db/69` free.
- **Gate:** documentation-only contract closure (order §5). No `db/69`, no
  application code, no test change in this commit.
- **Staging preflight (read-only):** reached via the pre-configured
  `supabase-legacy` MCP connection; fingerprint matched the declared staging state
  exactly — `ordens_compra_fio`=64, native `64/51/51/51/51`, receipt ledger +
  `ordem_compra_eventos` empty, `alocar_necessidade_compra_fio` present. (Project
  ref is not SQL-exposable; identity rests on the pre-configured connection + exact
  fingerprint.)
- **§8 authoritative need formula — PROVEN:** an in-SQL replica of
  `js/calculo-op.js` (`calcularFiosOP` + `montarOrdensCompraFio`) — cotton
  `algodao_por_ml·valor_x·Σ metros_pedidos` dual-added to `cor_1_id`/`cor_2_id`
  (incl. double-add when equal), polyester `poliester_por_ml·valor_x·Σ metros`,
  `round3`, `>0`, restricted to eligible OP states `aberta`/`em_producao`
  (`tecelagem`; latex excluded) — reproduced the live 64-row flat corpus with **0
  unmatched keys and 0.000 kg drift**. The §8 hard stop is cleared; full fixture
  parity re-runs at db/69 authoring.
- **Contract recorded:** `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` **§R.23**
  (phase split + emission-after-Phase-C sequence; Pedido regime
  `pedido_compra_fio_regime` + `resolver_regime_compra_fio_pedido`; persistirOP
  cutover; authoritative need source; `avaliar`/`sincronizar` need RPCs; absolute
  idempotent allocation + uniqueness; `remover_alocacao_compra_fio`; post-emission
  DB backstop; `obter_distribuicao_ordem_compra` + block reasons; emission stays
  inactive; dedicated UI + no new route; `db/69` manifest + ACL; T1/T2 mechanism +
  grant-activation order; rollback; debts). Cross-recorded in `PROJECT_STATE.md`
  (active-phase bullet), `AGENT_HANDOFF.md` (top continuity bullet),
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 note, and
  `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (update log).
- **Files changed:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** documentation-only; no `db/69` yet; no application code; no
  test change; `.gitignore`/`AGENTS.md` untouched; no push; no `main` touch;
  production (`gqmpsxkxynrjvidfmojk`) and prohibited (`bhgifjrfagkzubpyqpew`) not
  accessed.
- **Open future debts / blocked actions:**
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (closed only by the real authenticated
  two-session test, still pending); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`;
  native emission inactive/ungranted; native receipt deferred to Phase C;
  production diagnosis precondition; `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
- **Status:** `PRE-PROD-A-R1` contract is `CLOSED`; implementation is
  `AUTHORIZED (CONDITIONAL) / STAGING PENDING`.
- **Next authorizable action:** the PRE-PROD-A implementation half under the same
  order — author + apply `db/69` to staging, owner + authenticated negative tests,
  the live T1/T2 concurrency test (needs a Kleber-logged-in staging admin browser
  session), the dedicated distribution UI, visual evidence, and closeout. Native
  emission, native receipt, `PRE-PROD-B`, and `Phase C` remain `NOT AUTHORIZED`.

## 2026-07-19 — PRE-PROD-A-R1 — DB FOUNDATION APPLIED + OWNER-TESTED / APP AUTHORED — SESSION CHECKPOINT (commits 2-3 of the implementation order)

- **Order:** `PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY` (Opus 4.8).
  This is a mid-phase session checkpoint, not an acceptance; recorded because the next
  atomic block (live T1/T2) needs a browser session unavailable this session.
- **Commits:** `4ffd674` (Add native need and allocation foundation), `2bcacac` (Add
  native purchase-order distribution UI). Baseline `dev @ 51f31dd`; HEAD `2bcacac`.
- **Migration:** `db/69_ordem_compra_preprod_allocation.sql` **APPLIED to staging
  `ucrjtfswnfdlxwtmxnoo`** (Supabase migration history `69_ordem_compra_preprod_allocation`).
  Complete/self-consistent; safe to leave applied. Objects: `pedido_compra_fio_regime` +
  immutability guard + `resolver_regime_compra_fio_pedido`; `avaliar`/`sincronizar_necessidades_compra_fio`;
  hardened absolute `alocar_necessidade_compra_fio` + identity uniqueness index;
  `remover_alocacao_compra_fio`; post-emission item/allocation mutation guards;
  `obter_distribuicao_ordem_compra` + read-model block-reason replacements. ACL: all 8
  client RPCs SECURITY DEFINER + is_admin(), EXECUTE authenticated only; `emitir_ordem_compra`
  ungranted (emission inactive); no bridge, no flat shadow, no receipt/ledger activation.
- **§8 need formula:** proven — SQL replica of `calcularFiosOP`/`montarOrdensCompraFio`
  reproduced the 64-row flat corpus with 0 unmatched keys and **0.000 kg drift** (eligible
  aberta/em_producao tecelagem OPs).
- **DB test matrix (§23):** all pass (regime; need assessment incl. idempotent/absolute-update/
  obsolete-delete/parity; allocation incl. absolute/idempotent/over-allocation/coherence/
  cache=SUM/removal; read model incl. block reasons + poly OP attribution; ACL; sync-conflicts
  incl. decrease-below-alloc atomic + non-draft block + legacy-regime rejection), run as
  rolled-back admin-context transactions. **Legacy regression (§24):** clean —
  64/51/51/51/51, `ordens_compra_fio` kg checksum 25608.300, zero fixture residue.
- **3 db/69 bugs found + fixed during testing:** Cyrillic typo in the item-quantity guard;
  `sincronizar` temp-table re-entrancy (added `DROP TABLE IF EXISTS _sync_plan`);
  `obter_distribuicao` record→json ORDER BY (`to_jsonb(x) ORDER BY x.item_id`). File and
  staging kept in sync.
- **Application:** `op-persistir.js` regime cutover (§R.23.2; native skips flat + syncs needs,
  no silent fallback); new `js/screens/op-compra-regime.js` (regime/need RPC wrappers) and
  `js/screens/ordem-compra-distribuicao.js` (distribution read view; allocation write controls
  **disabled** behind `ALLOCATION_ENABLED=false`, §22); wiring in `ordem-compra{,-data,-render}.js`
  + `index.html`; no router/boot/common change (§17).
- **STRUCTURAL POLICY COMPLIANCE (§26):** new files well within CODE_HEALTH §7 caps
  (op-compra-regime.js ~85 lines; ordem-compra-distribuicao.js ~190 lines; db/69 ~1080 lines SQL);
  no Supabase writes in render (§9); no client-side authority reconstruction (server RPCs);
  cache trigger remains sole `kg_alocado` maintainer; no new responsibility on op-nova.js; no
  transient concurrency probe present.
- **Tests:** `op-persistir.smoke.js` amended under explicit architect authorization (outside the
  §25 manifest) for the regime-gated behavior + native no-flat-row proof; `node --check` clean on
  all touched JS; full suite **133 failures = clean-HEAD baseline, zero new**.
- **Scope discipline:** staging only; production (`gqmpsxkxynrjvidfmojk`) and prohibited
  (`bhgifjrfagkzubpyqpew`) not accessed; no push; no `main`; `.gitignore`/`AGENTS.md` untouched.
- **Open / pending (next session, needs Kleber's staging browser login):** live authenticated
  **T1/T2 concurrency test** closing `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (transient probe
  `preprod_a_allocation_concurrency_probe` to be created for the test and dropped immediately —
  none exists now); then enable `ALLOCATION_ENABLED`; browser visual evidence (§27); rollback
  rehearsal (§28); §30 closeout. `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, native
  emission/receipt, `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`, and production diagnosis remain open.
- **Status:** `PRE-PROD-A-R1` DB foundation applied + owner-tested; application authored with
  allocation UI disabled; **live concurrency, visual evidence, and closeout PENDING**. Not accepted.
- **Next authorizable action:** resume PRE-PROD-A with the live T1/T2 test against the applied
  db/69. `PRE-PROD-B` and `Phase C` remain `NOT AUTHORIZED`.

## 2026-07-19 — PRE-PROD-A-R1 — POST-CONCURRENCY ACTIVATION, VISUAL PACKAGE, ROLLBACK, AND CLOSEOUT (awaiting architect acceptance)

- **Scope and environment:** staging `ucrjtfswnfdlxwtmxnoo` only. Production
  `gqmpsxkxynrjvidfmojk`, prohibited project `bhgifjrfagkzubpyqpew`, `main`, and push
  were not accessed. `db/69` remains applied (`20260719120036 /
  69_ordem_compra_preprod_allocation`); no migration was changed.
- **Live concurrency PASS / debt resolved:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING`
  is closed. T1 PID `2272591` locked the real need first at
  `2026-07-19T14:07:12.423433+00:00`, readiness was visible at `...12.423614`, then
  committed absolute 60 kg at `...14.959616`. T2 PID `2272590` began at
  `...14:07:13.362084+00`, waited, locked at `...14.962558`, and rejected its
  absolute 60 kg request with `excede_saldo` after re-evaluating the 40 kg remainder.
  Final allocation/cache were 60 kg; no over-allocation.
- **ACL:** retained executed authenticated ACL evidence was not unnecessarily
  repeated. Current catalog: the eight authorized native admin RPCs are `SECURITY
  DEFINER`, `authenticated`-only, `anon`/`PUBLIC` denied. Authenticated admin UI
  writes succeeded. `emitir_ordem_compra(bigint)` is ungranted to `authenticated`,
  `anon`, and `PUBLIC`, and remains inactive.
- **Activation/UI evidence:** enabled `ALLOCATION_ENABLED=true`; added the missing
  event handlers and allocation modal for explicit create/absolute update/remove plus
  need synchronization. Authenticated browser evidence: native draft controls;
  create 60 kg, absolute update 60→80 kg, remove; native/legacy list; incomplete
  block; complete block `recebimento_nativo_ainda_inativo`; desktop/tablet/mobile;
  and OP purchase-order summary/navigation. The out-of-Git contact sheet is
  `C:/Users/klebe/.codex/visualizations/2026/07/19/preprod-a-r1/PRE-PROD-A-R1-contact-sheet.png`.
  The 390px capture reproduces the existing `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
- **Rollback rehearsal:** temporarily disabled UI and revoked EXECUTE from
  `authenticated` for `sincronizar_necessidades_compra_fio(uuid)`,
  `alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)`, and
  `remover_alocacao_compra_fio(bigint)`. Native `persistirOP` under a simulated actual
  `42501` writer denial returns `necessidades_sync`, `partial=true`, and performs no
  flat writer/calc call. UI and grants were restored.
- **Tests:** `node --check` passed for the touched screens; focused
  `ordem-compra`/`op-persistir`/`boot` smoke: **129/129 pass**. Full `node --test`
  suite: **3,743 pass / 132 fail / 3,875 tests**; historical full-suite baseline was
  133 failures, with no new failure attributed to this closeout.
- **Zero residue:** probe functions=0; fixture needs `128..135`=0; fixture orders
  `76..82`=0; fixture items `70..79`=0; fixture allocations=0; run-key advisory
  locks=0; active probe activity=0. No runner or credential material was created or
  persisted; the external screenshots/contact sheet are intended visual deliverables.
- **Status / debts:** PRE-PROD-A is **IMPLEMENTED / VERIFIED IN STAGING / LIVE
  CONCURRENCY PASS / AWAITING ARCHITECT VISUAL VALIDATION AND ACCEPTANCE**. Do not
  record architect acceptance yet. Native emission remains inactive/ungranted;
  receipt and Phase C remain pending; PRE-PROD-B, Phase C, production, `main`, and
  push remain prohibited. Next authorizable action: architect visual validation and
  acceptance only.

## 2026-07-19 — PRE-PROD-A-R1 — ARCHITECT ACCEPTANCE — CLOSED / ACCEPTED_WITH_NONBLOCKING_ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT

- **Architect ruling:** `PRE-PROD-A-R1` is closed and accepted. The accepted record
  includes staging migration `20260719120036 / 69_ordem_compra_preprod_allocation`,
  implementation commit `56868fea1b65c3d627827a0bba47997cb1de0511`, authenticated
  ACL PASS, rollback rehearsal PASS, focused tests 129/129 PASS, full suite 3,743
  pass / 132 historical failures, zero transient residue, and accepted desktop/tablet
  visual evidence.
- **Concurrency gate resolved:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING` is resolved.
  T1 PID `2272591` acquired the real lock first and committed absolute 60 kg; T2 PID
  `2272590` waited, re-evaluated 40 kg remaining, and rejected absolute 60 kg with
  `excede_saldo`. Final allocation/cache=60 kg; no over-allocation.
- **Accepted operating state:** allocation controls are active in staging for eligible
  native drafts; legacy remains read-only. Native emission remains inactive and
  `emitir_ordem_compra` remains ungranted. Native receipt and Phase C remain pending;
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` remains open.
- **Non-blocking/deferred work:** `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT` remains open
  and non-blocking. UI provenance / modern-visual-language audit is deferred as a
  separate post-stabilization activity and does not block this acceptance.
- **Boundaries:** a contemporaneous read-only production diagnosis remains mandatory
  before any production work. Production, `main`, push, PRE-PROD-B, and Phase C
  implementation remain prohibited unless separately authorized. The next
  authorizable action is a separate architect order selecting a reconciled backlog
  front.

## 2026-07-19 — PHASE-C1 — NATIVE RECEIPT AUTHORITY CONTRACT — CLOSED / ACCEPTED

- **Order:** `PHASE C1 — NATIVE RECEIPT AUTHORITY CONTRACT`.
- **Baseline / Git:** branch `dev`, HEAD
  `47b8e6a6bc8dea0cd0fe053fef2ef9f2f16f14fa`; required lineage confirmed. Known
  pre-existing residue `.gitignore` modified and `AGENTS.md` untracked was preserved
  untouched and unstaged.
- **Scope executed:** documentation-only canonical reconciliation and contract closure.
  No implementation, SQL/migration, staging/production write, ACL/grant, UI, test,
  push, `main`, or C2 action was performed.
- **Canonical authority:** `ordem_compra_fio_lancamentos` evolves as the sole physical
  receipt ledger. No competing ledger or flat received-total authority survives the
  cutover. Events are audit-only; item totals, order receipt status, and projections
  are database-derived; clients receive no receipt-table DML.
- **Receipt shape:** immutable header with receipt/document identity, origin, date,
  actor, stable submission idempotency key, and immutable command metadata. Each line
  binds header, native item, optional allocation, allocation's real OP, and canonical
  ledger entry. A single receipt may span multiple items, allocations, and real OPs.
- **Material semantics:** cotton follows its concrete real-OP allocation. Shared
  polyester needs keep `op_id IS NULL`; physical lines follow the selected
  allocation's actual OP, allowing multiple real OPs without representative or fake
  OPs. Excess stays on the same receipt/item, creates no fake need/allocation, and may
  produce only the narrow atomic inventory movement.
- **Writer and reversal:** receive only emitted, non-cancelled, acceptance-eligible
  native orders; lock order/item and allocations deterministically (allocation IDs
  ascending); re-evaluate under lock; stable exact-repeat idempotency returns the
  original result; conflicting reuse rejects; cumulative allocation receipts cannot
  exceed `kg_alocado`; invalid states reject; history is immutable. Reversal appends
  an idempotent negative entry referencing its positive source, locks source and
  reversals, caps at the remaining reversible quantity, and cannot make derived totals
  negative.
- **Actors / ACL:** admin and future matching supplier use the same RPC. Supplier scope
  is limited to its matching order; no table DML. Supplier reversal authority remains
  an explicit C2 decision and must not be inferred. Supplier UI is deferred.
- **Legacy classes:** A and D import one `import_saldo_inicial` receipt per mapped item
  for non-zero balance; D preserves received-without-emission without fake events. B
  seeds none; C has no rows. Fake needs, allocations, OPs, or events are forbidden.
- **Cutover / rollback:** fence both flat writers and prove denial; snapshot all 51
  mappings; import and reconcile; migrate both consumers; switch readers; revoke flat
  updates; close the ACL gap; remove anonymous update. Rollback is allowed only before
  the first post-switch canonical receipt and only with zero canonical writes; after
  that point recovery is forward-only.
- **UI placement:** future admin UI only at `#/ordens-compra/:id`, persistent
  **Recebimentos** section with dedicated modal action. No receipt UI in OP, Pedido,
  production-transition, or supplier-assignment modals. Supplier UI remains later.
- **Binding sequence:** C1 contract; C2 inactive foundation/writer/reversal/narrow
  inventory; C3 cutover/import/readers/ACL; C4 admin UI and later supplier UI; C5
  separate emission activation. Native emission stays inactive/ungranted until C1-C4
  are accepted. Phases do not chain automatically.
- **Open before C2:** exact header schema and idempotency namespace; supplier reversal
  permission; inventory-movement object/reconciliation; multi-line RPC signature/result
  plus complete lock order; migration split between inactive foundation and cutover.
- **Documentation index ruling:** no update required under the documentation model;
  C1 creates no new canonical path, authority class, document class, or migration.
- **Status / next authorization:** `PHASE-C1` is `CLOSED / ACCEPTED`. C2 is **not
  authorized**. The next possible action is a separate architect C2 order after the
  open contract decisions are settled.

## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT IMPLEMENTATION BOUNDARY — DOCUMENTATION GATE

- **Order:** `PHASE C2 — NATIVE RECEIPT FOUNDATION, WRITER, REVERSAL AND NARROW
  INVENTORY INTEGRATION`.
- **Baseline:** `dev @ 3395f83df0eb7db604df9a80d4a43a0601bc8b6c`; C1 is
  closed/accepted and is the direct ancestor. Known `.gitignore` modified and
  `AGENTS.md` untracked residue preserved out of scope.
- **Local/staging preflight:** local latest migration is `db/69`; slot 70 is free.
  Staging `ucrjtfswnfdlxwtmxnoo` is healthy on PostgreSQL 17.6 and its last recorded
  migration is `20260719120036 / 69_ordem_compra_preprod_allocation`. Corpus remains
  64 flat/needs, 51 native legacy headers/items/allocations/mappings, receipt ledger
  and events zero, native orders zero, transient objects zero. Flat checksum remains
  25,608.300 kg ordered / 20,221.280 kg received; native item checksum matches.
  `emitir_ordem_compra` has no EXECUTE for PUBLIC/anon/authenticated/service_role.
- **Inventory inspection:** `saldo_fios` has 5 rows / 2,685.020 kg and no duplicate
  material/color identity; `saldo_fios_op` is empty. Its current client writer is the
  OP recalculation path and no source-linked receipt movement authority exists.
  Therefore C2 may create only a receipt-source surplus movement object; it may not
  refactor general inventory.
- **Concrete contract:** lifecycle spec §R.25 closes the five C2 decisions left by
  C1. Header = immutable `ordem_compra_recebimentos`; idempotency namespace
  `native_receipt_v1`, scoped by actor type + actor UUID + key, with canonical JSONB
  equality. Ledger gains native command/order/allocation/real-OP/material/excess/
  actor/line identity while preserving legacy coexistence columns.
- **RPCs:** `registrar_recebimento_ordem_compra` accepts a non-empty multi-line
  absolute command with lines explicitly `alocacao` or `excesso`; only active admin
  or the order's active matching supplier. `estornar_recebimento_ordem_compra` is
  administrator-only and refuses imported opening balances. The actor-scoped read
  model is `obter_historico_recebimento_ordem_compra`.
- **Locks:** native order; items ascending; allocations ascending; scoped command
  identity; relevant ledger rows ascending; deterministic material/color inventory
  identities. All caps are re-evaluated after waits.
- **Ownership:** `ordem_compra_fio_lancamentos` is physical authority; item/header
  caches derive in the database; allocation/excess/reversible quantities are
  projections. `ordem_compra_fio_movimentos_estoque` is immutable and unique by
  ledger source entry; only surplus delta affects `saldo_fios`, preserving §R.9 and
  preventing allocated kg from becoming general stock.
- **ACL:** new tables expose no client mutation. Receipt/reversal/read RPCs are
  authenticated-only after PUBLIC/anon/service_role revoke; matching supplier has
  receipt only, never reversal. Native emission and flat UPDATE ACL remain unchanged.
- **Rollback/exclusions:** revoke C2 grants and rehearse dependency-safe C2 object
  removal only while zero real canonical receipts exist. No import/seed, cutover,
  flat-writer fence, productive-reader switch, UI, emission activation, production,
  `main`, or push. C3/C4/C5 remain unauthorized.
- **Status / next action:** documentation boundary is closed. Continue under the same
  architect order only with `db/70`, focused tests, staging verification/cleanup,
  rollback rehearsal, and canonical closeout. Do not record architect acceptance or
  begin C3.


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
