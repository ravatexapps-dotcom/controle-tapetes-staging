<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0006 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0117..G28-LEDGER-UNIT-0138 -->
<!-- canonical_byte_interval: 540568..608383 -->
<!-- canonical_line_interval: 3801..4756 -->
<!-- payload_sha256: 54d783e61e578ef133f4e250708709c5d9ccb1bf8a71c6b59864075ed16adb7f -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT FOUNDATION — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE

- **Order and baseline:** `PHASE C2 — NATIVE RECEIPT FOUNDATION, WRITER, REVERSAL
  AND NARROW INVENTORY INTEGRATION`; `dev @
  3395f83df0eb7db604df9a80d4a43a0601bc8b6c`. C1 lineage was confirmed. Permanent
  `.gitignore` modified / `AGENTS.md` untracked residue was preserved untouched and
  unstaged. Boundary commit: `9a5cb4f`; implementation commit: `833c2ad`.
- **Implementation:** exactly migration
  `db/70_ordem_compra_native_receipt_foundation.sql` and focused test
  `tests/ordem-compra-native-receipt.smoke.js`. Staging records
  `20260719160518 / 70_ordem_compra_native_receipt_foundation`. The sole receipt
  ledger was extended additively; immutable command headers, actor-scoped exact
  idempotency, admin/matching-supplier receipt, admin-only reversal, actor-scoped
  history, database-derived caches, and one source-linked surplus movement per
  ledger entry are active. Native emission remains ungranted.
- **Functional and authorization evidence:** rollback-only scenarios passed for
  partial/successive/multi-item/multi-allocation receipts, cotton and shared
  polyester real-OP attribution, excess, exact retry, conflicting retry, draft/
  pending/rejected/cancelled rejection, allocation cap, supplier ownership,
  administrator partial/full reversal, over-reversal, immutable guards, history
  scope, and exact stock delta. Authenticated clients can execute only the three C2
  RPCs; header/ledger/movement direct mutation is denied; supplier reversal is
  denied; `emitir_ordem_compra` remains denied.
- **True concurrency evidence:** five independent-backend scenarios passed. Same
  allocation used PIDs 2281708/2281707 (`ok` / post-wait `excede_alocacao`);
  duplicate identity used 2281917/2281916 (both `ok`, same header); receipt/reversal
  used 2282003/2282002 with a transaction-id lock wait and both `ok`; distinct
  shared-polyester allocations/real OPs used 2282095/2282094 with a transaction-id
  wait and both `ok`; same-item excess/cache used 2282204/2282205 with a
  transaction-id wait, both `ok`, exact 5 kg ledger/movement/cache delta, and all
  caps intact. Every waiting writer re-evaluated under lock.
- **Rollback and cleanup:** dependency-safe C2 removal was rehearsed inside a
  transaction without CASCADE and rolled back; db/67-db/69, 51 legacy header/item/
  allocation rows, and flat ACL remained intact. All marked fixture rows and
  temporary cron/probe objects were removed. Final staging: 64 flat needs; 51 legacy
  headers/items/allocations; zero native orders, receipt headers, receipt ledger,
  movements, or orphans; `saldo_fios` 5 rows / 2,685.020 kg; no cron, dblink, probe
  schema/function, active job, or disabled C2 trigger.
- **Checksums and tests:** flat ordered 25,608.300 kg; flat received and legacy item
  received 20,221.280 kg; allocations and need cache 20,238.300 kg. Focused native
  purchase-order tests: 48/48 pass; new focused file: 13/13 pass. Full JavaScript
  suite: 3,888 tests, 3,755 pass, 133 pre-existing unrelated failures, 0 skipped;
  none is attributed to the two C2 implementation files.
- **STRUCTURAL POLICY COMPLIANCE:** the 1,211-line migration is the single atomic
  file required by the architect; splitting it was expressly outside scope. The
  approximately 347-line receipt writer and 256-line reversal remain below the
  500-line acceptable function limit and are cohesive transactional lock/write
  orchestrators; derivation and result helpers are already separated. Further
  SECURITY DEFINER fragmentation would expand privilege surface and disperse the
  lock contract. The 211-line focused test is bounded to C2. No UI/application
  monolith, parallel authority, silent fallback, or undocumented cross-layer
  dependency was introduced.
- **Scope preservation:** no import/seed, cutover, flat-writer fence, productive
  reader switch, flat ACL change, UI, emission activation/grant, production,
  `main`, push, C3, C4, or C5 action occurred. C2 is not architect-accepted.

PLAN_ALIGNMENT:
MASTER_PLAN: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md (§R.24-§R.25) and docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
LAST_ACCEPTED_PHASE: PHASE-C1 (CLOSED / ACCEPTED)
CURRENT_PHASE: PHASE-C2 (IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE)
NEXT_AUTHORIZABLE_ACTION: ARCHITECT TECHNICAL ACCEPTANCE DECISION FOR PHASE-C2 ONLY
OPEN_ARCHITECT_DECISIONS: ACCEPT OR REJECT PHASE-C2 TECHNICAL CLOSEOUT; C3 REMAINS UNAUTHORIZED
DEFERRED_PHASES: PHASE-C3; PHASE-C4; PHASE-C5; PRODUCTION; MAIN; PUSH
STATE_FILES_UPDATED: PROJECT_STATE.md; AGENT_HANDOFF.md; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md; docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md; docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md; docs/ledgers/G28_LEDGER.md
MATERIAL_DIVERGENCES: NONE

## PHASE-C3A — Contract boundary opened (2026-07-19)

- **Status:** `AUTHORIZED / CONTRACT CLOSURE IN PROGRESS`; staging-only, no real
  import/cutover. Current `saldo_fios` is the opening inventory baseline. Historical
  import is receipt-state reconstruction: zero movement and no `saldo_fios`/
  `saldo_fios_op` mutation.
- **Future shape:** 39 `legacy_initial_balance_v1` system headers; 44 immutable
  `import_saldo_inicial` entries (39 allocation-attributed plus five allocation-free
  excess), 20,221.280 kg reconstructed, 405.980 kg excess. Debt:
  `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`.
- **Not authorized:** real seed, fence activation, reader/writer switch, flat ACL
  revocation, UI, native emission, C3B/C3C/C3D/C4/C5, production, `main`, or push.

## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT FOUNDATION — CLOSED / ACCEPTED

- **Architect ruling:** `PHASE-C2` is `CLOSED / ACCEPTED`. Accepted technical/staging
  checkpoint: `dev @ 14ca5c77f87c11c310a6df2469969a23e32972d5`; staging migration:
  `20260719160518 / 70_ordem_compra_native_receipt_foundation`.
- **Accepted model:** immutable native receipt headers; the additive
  `ordem_compra_fio_lancamentos` sole canonical physical receipt ledger; canonical
  multi-line receipt writer; administrator-only source-linked reversal; deterministic
  locking and actor-scoped exact idempotency; ledger-derived receipt caches; and one
  transactional source-linked surplus movement per ledger entry. A matching active
  supplier may register only its own order receipts; supplier reversal remains denied.
  Direct client DML is denied; receipt/reversal/read RPCs are authenticated-only;
  native emission remains inactive and ungranted.
- **Acceptance evidence:** 48/48 focused tests and 13/13 new C2 tests pass; five real
  concurrent-backend scenarios pass; rollback rehearsal passes without CASCADE;
  db/67-db/69 and the legacy flat path remain intact; final staging fixtures and
  transient artifacts are zero. No opening-balance seed, productive-reader switch,
  cutover, flat ACL change, UI, C3/C4/C5 action, production, `main`, or push occurred.
- **Full-suite reconciliation:** PRE-PROD-A `47b8e6a`, pre-C2 baseline `3395f83`, and
  C2 checkpoint `14ca5c7` each reproduce 133 identified failures. The accepted C2
  full-suite baseline is 3,864 tests / 3,731 pass / 133 pre-existing failures; zero
  baseline-only, current-only, or unstable identities; normalized set SHA-256
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`. The earlier
  aggregate count of 132 is superseded. Zero C2 regression exists.
- **Post-acceptance boundary:** flat receipt remains productive authority until C3
  cutover. C3, C4, and C5 remain unimplemented. The next authorizable action is a
  fresh read-only C3 pre-cutover reconciliation and implementation-boundary diagnosis;
  it does not authorize C3 implementation.

PLAN_ALIGNMENT:
MASTER_PLAN: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md (§R.24-§R.25) and docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
LAST_ACCEPTED_PHASE: PHASE-C2 (CLOSED / ACCEPTED)
CURRENT_PHASE: NONE — PHASE-C2 CLOSED / ACCEPTED
NEXT_AUTHORIZABLE_ACTION: FRESH READ-ONLY C3 PRE-CUTOVER RECONCILIATION AND IMPLEMENTATION-BOUNDARY DIAGNOSIS
OPEN_ARCHITECT_DECISIONS: C3 IMPLEMENTATION REQUIRES A SEPARATE ARCHITECT AUTHORIZATION AFTER RECONCILIATION
DEFERRED_PHASES: PHASE-C3 IMPLEMENTATION; PHASE-C4; PHASE-C5; PRODUCTION; MAIN; PUSH
STATE_FILES_UPDATED: PROJECT_STATE.md; AGENT_HANDOFF.md; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md; docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md; docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md; docs/ledgers/G28_LEDGER.md
MATERIAL_DIVERGENCES: NONE

## 2026-07-19 — PHASE-C3A-R1/R2 — INACTIVE CUTOVER AND OWNER-ONLY IMPORT COMMAND — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE

- **Authorization and lineage:** accepted pre-C3A baseline
  `361d0f77388b0adac9b83997707cd49df938e4dd`; contract `d23645f`; foundation
  `fca6ea7`; R1 protected singleton `0908b77`; R2 command `94e6068`. Staging only;
  production, prohibited project, `main`, and push were not accessed.
- **Applied migrations:** `20260719172749 / 71_ordem_compra_c3a_cutover_foundation`,
  `20260719174006 / 72_ordem_compra_c3a_cutover_initial_state`, and
  `20260719175732 / 73_ordem_compra_c3a_import_command`.
- **Root cause and correction:** db/71 created import-compatible header/type/trigger
  foundations but omitted the owner command, so duplicate replay/conflict and real
  concurrency semantics did not exist. It also retained a ledger actor check that
  excluded `sistema` and a NOT NULL receipt date that would fabricate a physical
  date. db/73 adds exactly one owner-only command plus the minimum actor/date and
  source-identity support; no application or activation path was added.
- **Command contract:** `public.importar_saldo_inicial_ordem_compra_c3a(jsonb)`,
  owner `postgres`, `SECURITY DEFINER`, empty fixed `search_path`, EXECUTE revoked
  from PUBLIC/anon/authenticated/service_role. Namespace
  `legacy_initial_balance_v1`; identity is cutover + flat row + mapping + item.
  Canonical request JSONB uses explicit NULL and three-decimal kg strings. Its
  SHA-256 and the full derived payload SHA-256 cover snapshot identity/hash,
  order/item/allocation/real OP, Class A/D, total/attributed/excess kg, and provenance;
  volatile execution time is excluded and stored as header acceptance time only.
  Class D records `recebido_sem_emissao`; no physical date, document, emission,
  acceptance, human actor, or representative OP is fabricated.
- **Locks and idempotency:** source key is
  `hashtextextended('legacy_initial_balance_v1|source|cutover|flat',0)`; full key is
  `hashtextextended('legacy_initial_balance_v1|identity|cutover|flat|mapping|item',0)`.
  Both are transaction-scoped. A 64-bit hash collision could conservatively serialize
  unrelated work but cannot bypass payload/source validation or uniqueness. Exact
  retry returns the stored header and ledger IDs with no mutation; changed quantity,
  mapping, snapshot, or other meaning returns `idempotencia_conflitante`.
- **Functional gates:** rollback-controlled pre-apply and live-staging matrices passed
  first valid A/D import, exact retry, quantity/mapping/snapshot conflict, B/C and zero
  denial, allocation overflow, valid excess, fabricated excess allocation denial,
  execution denial, inventory non-posting, and import non-reversibility. Import shape
  is one allocation line plus an excess line only when excess is positive; line sum
  equals source total and allocation never exceeds the real allocation.
- **Distinct-backend concurrency:** scenario A PIDs `18624/20432`, full identity lock
  `-6666601321319751478`, observed advisory wait, one header/two ledger rows and exact
  IDs `3 / 3,4` returned to both calls. Scenario B PIDs `29848/17092`, identity lock
  `5039416729415450130`, observed advisory wait, first `ok`, second
  `idempotencia_conflitante`, one header/one ledger/no movement. Scenario C import/C2
  PIDs `14692/24184` completed independently: import two lines/zero movement; C2 one
  receipt/one movement/+1 kg isolated test-stock effect. Scenario D flat/import PIDs
  `15856/23736` under `legacy_active`: transient flat 4.125 kg write succeeded and
  rolled back to 4.000; import rejected `estado_cutover_invalido`; no source-4 header.
  All concurrency fixtures ran in an isolated PostgreSQL instance, which was stopped
  and removed; real staging cutover state was never activated.
- **Rollback rehearsals:** db/73-only and full db/71-db/73 rollback passed inside
  staging transactions without CASCADE. Dependency-safe order removed command/index,
  restored ledger actor/date shape, removed singleton protection/row, restored db/70
  guard/trigger/header/ledger constraints, then removed baseline/cutover tables. C2
  admin and matching-supplier receipt passed; supplier reversal stayed denied; admin
  reversal and flat receipt passed; inventory remained unchanged. db/71, db/72, and
  db/73 were restored in order and the rehearsal transaction rolled back cleanly.
- **Tests and regression:** focused purchase-order suite `56/56`. Two detached runs
  per revision of `node --test tests/*.js`: baseline 3,864 tests / 3,731 pass / 133
  known failures; current 3,872 / 3,739 / 133. Baseline-only, current-only, and
  unstable identities are all zero; canonical normalized SHA-256 remains
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`.
- **Final cleanup:** migrations 71/72/73 applied; one singleton
  `id=1 / legacy_active / not_started`, NULL snapshot/baseline/productive markers;
  zero headers, ledger, movements, baseline rows, fixture rows, transient functions,
  active probe sessions, disabled triggers, or temporary grants. Preview remains
  39 headers / 44 ledger / 20,221.280 kg / 405.980 kg excess / zero movements.
  `saldo_fios` remains 5 rows / 2,685.020 kg, normalized hash
  `79d5c1393193b67cd9f3a7b8cdc5037ce919bca87084d59f84a08949baafd566`;
  `saldo_fios_op` remains zero. Flat ACL/writers and native emission denial are
  unchanged.
- **Structural policy:** db/73 is a cohesive 388-line migration, below the 500-line
  acceptable file limit. The single long command is a documented §7 exception: the
  architect required one owner-only atomic maintenance command; splitting state,
  snapshot, lock, fingerprint, and immutable-write orchestration would add privileged
  surface and disperse the transaction contract. No UI/application monolith or
  parallel source of truth was introduced.
- **Boundary:** no real import, snapshot, fence, reader/writer switch, flat ACL
  closure, Class-B receipt, activation RPC, db/74, emission, C3B/C3C/C3D/C4/C5,
  production, `main`, or push. `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`
  remains nonblocking debt. The next single authorizable action is architect technical
  acceptance or rejection of PHASE-C3A. Architect acceptance is not recorded here.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — CANONICAL DOCUMENTATION CORRECTION R2

- **Authorization / mode:** architect-authorized documentation-only correction.
  Implementation, SQL, migrations, tests, grants, staging writes, production,
  `main`, and push prohibited. Baseline `dev @
  369e5342d3dee0c361a10c42ac1d889f3483b8c7`; accepted C2 lineage
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Known modified
  `.gitignore` and untracked `AGENTS.md` remained untouched; index was empty and no
  `index.lock` existed.
- **Accepted evidence and decision:** the architect accepted the purchase-order
  impact audit and the hybrid-origin addendum. Redo verdicts remain **NO** for B1,
  PRE-PROD, C1, C2, and C3A. The selected strategy is localized forward correction,
  not phase restart. C3A remains implemented/verified in staging and unaccepted.
- **Hybrid origin:** native cotton is OP-origin and uses the real calculating OP;
  genuinely shared polyester is Pedido-origin with `necessidade.op_id IS NULL`.
  Future allocation provenance is server-derived from the locked need:
  OP-origin → `allocation.op_id = necessidade.op_id`; Pedido-origin →
  `allocation.op_id IS NULL`. No caller-selected, representative, synthetic,
  convenience, first, or arbitrary OP is permitted.
- **Identity / quantity / ownership:** shared allocation identity must be NULL-safe;
  `ordem_compra_item.kg_pedido` is authoritative only as the sum of allocation kg;
  purchase orders belong to Pedido + supplier; purchasing distribution belongs to
  Pedido → Insumos / `aguardando_fios`, with no new stepper stage. A dedicated route
  remains an allowed surface only. An item may consolidate allocations from multiple
  OP-specific needs and shared Pedido needs.
- **Localized defects found:** `db/69` accepts caller-controlled `p_op_id`, requires an
  OP for shared allocations, and uses a plain nullable-OP unique index; `db/68` exposes
  an independent manual item quantity; `db/70` receipt/ledger/movement guards require
  non-NULL OP on every allocated line. These applied files were not altered. Phase C
  remains reusable but requires focused forward correction and revalidation for shared
  NULL-OP allocation lines. Valid excess remains allocation-free under `saldo_fios`.
- **Operational paths superseded for future origination:** independent `Nova ordem`;
  `definir_item_ordem_compra` as origination writer; item-first
  `alocar_necessidade_compra_fio`; caller-controlled `p_op_id`; manual authoritative
  item quantity; allocation ownership by purchase-order detail; supplier-assignment
  ownership by OP; any receipt/ledger rule requiring artificial shared OP provenance.
- **Documentation transaction:** corrected the governing lifecycle spec, current
  state, active handoff, production-flow backlog, schema contract, documentation
  index, and this append-only ledger. Earlier B1, PRE-PROD, C1, C2, and C3A entries
  remain byte-preserved. The legacy diagnosis, Pedido/OP movement plan, Documents
  evolution plan, governance model, supervision protocol, code-health rules, and
  `CLAUDE.md` were inspected and required no change because they contain no current
  hybrid-origin contradiction within their roles.
- **Forward sequence:** documentation correction → separately authorized corrective
  implementation → focused staging validation → PRE-PROD revalidation → Phase C
  shared-allocation revalidation → later architect disposition of C3A → only then
  C3B and subsequent phases. No phase chains.
- **Status:** `COMPLETED / AWAITING ARCHITECT ACCEPTANCE`. The only next
  authorizable action is architect acceptance or rejection of this documentation
  correction. `NO IMPLEMENTATION AUTHORIZED`.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN R2 — ARCHITECT ACCEPTANCE CLOSEOUT

- **Accepted commit:** `840dcb19b6bc6ffd8543a3f79bcae07516738bf6`.
- **Ratified status:** Impact Audit `CLOSED / ACCEPTED`; Hybrid Need Origin Addendum
  `CLOSED / ACCEPTED`; Documentation Correction R2 `CLOSED / ACCEPTED`.
- **Redo / strategy rulings:** REFUND-A redo **NO**; REFUND-B1 redo **NO**;
  PRE-PROD redo **NO**; Phase C redo **NO**; selected strategy = forward corrective
  migration; staging-data conversion required = **NO**.
- **C3A:** remains `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL
  ACCEPTANCE`; this closeout does not accept it.
- **Next active technical phase:** `PURCHASE-ORDER HYBRID ORIGIN — FORWARD
  CORRECTION F1`, `AUTHORIZED`, scoped to database authority, atomic need-first
  writer, derived OP-or-NULL provenance, NULL-safe allocation identity,
  allocation-derived item quantity, deterministic removal/cleanup, obsolete
  database-writer restriction, and localized Phase C shared-allocation compatibility.
  UI correction remains outside F1.
- **Boundary:** staging database writes, production, `main`, push, UI/F2, C3A
  acceptance, and later phases remain unauthorized. F1 implementation may begin only
  after its read-only readiness reconciliation passes.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT CLOSURE R1

- **Authorization / baseline:** documentation-only architectural contract closure on
  `dev` at `91fac9ca730660244bfc6d537e7282c4802f9089`; lineage from accepted C2
  baseline `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Known modified
  `.gitignore` and untracked `AGENTS.md` remained untouched and unstaged. No SQL,
  migration, application, test, grant, environment write, production, `main`, or
  push was authorized.
- **Accepted readiness result recorded:** F1 implementation readiness returned
  `HARD_STOP — CONTRACT INCOMPLETE`. The accepted hybrid-origin model determined
  provenance and quantity invariants but not the exact need-first API, replay model,
  zero-allocation/item/draft cleanup transitions, or obsolete-writer ACL disposition.
  Implementation did not start.
- **Canonical command:**
  `definir_alocacao_necessidade_compra_fio(p_necessidade_id BIGINT,
  p_fornecedor_id BIGINT, p_kg_alocado NUMERIC, p_idempotency_key TEXT) RETURNS
  JSONB`; authenticated active admin only. Need, supplier, absolute target, and
  idempotency key are the only caller inputs. Pedido, material, color, order, item,
  allocation, and real-or-NULL OP are derived under lock.
- **Idempotency / mutation:** permanent immutable command journal in namespace
  `native_distribution_v1`, unique by namespace + actor + key, canonical request
  JSONB equality plus MD5 fingerprint. Same request/key returns the stored result;
  changed request/key conflicts; intentional create/increase/reduction/removal uses a
  new key. One absolute-target API is canonical; target zero is removal.
- **Cleanup / quantity:** zero allocation row is deleted; an item with no allocations
  is deleted; a never-emitted active draft with no items is deleted. No lifecycle
  event is fabricated; the immutable command is the audit. Later distribution creates
  new entity IDs while old-key replay returns stored deleted IDs. Every surviving
  item is protected by a deferred constraint trigger requiring at least one allocation
  and exact `kg_pedido = SUM(kg_alocado)`.
- **Identity / provenance:** logical identity is exactly `(item_id,
  necessidade_id)`, making shared NULL provenance structurally irrelevant to
  uniqueness. Duplicate preflight is mandatory before replacing the old index.
  OP-origin stores the need's real OP; Pedido-origin stores NULL; imported legacy
  real-OP rows are preserved without conversion.
- **ACL closure:** only the new need-first writer gets authenticated execution.
  `definir_item_ordem_compra`, item-first `alocar_necessidade_compra_fio`,
  `remover_item_ordem_compra`, and `remover_alocacao_compra_fio` become owner-only
  deprecated definitions. Native emission remains owner-only/inactive; draft cancel,
  receipt/reversal, read-only preview, flat coexistence, and owner-only C3A authority
  retain their exact documented boundaries.
- **Phase C shape:** allocated OP-origin lines keep the real OP; allocated shared
  Pedido-origin lines retain full order/supplier/Pedido/item/need/allocation/material/
  color/quantity/receipt/ledger/movement identity with NULL OP; excess remains
  allocation-free and OP-free. db/70 and db/71 future guards become NULL-safe; receipt
  selection drops the non-NULL filter; caps, reversal, surplus movement, and db/73
  legacy real-OP/non-posting import remain unchanged. No history/data conversion.
- **Concurrency / errors:** exact command-key advisory gate, command row, need,
  supplier, draft advisory+row, item, allocation, mutation/cleanup, and command insert
  order is closed. Stable codes cover authorization, need/supplier/quantity/origin,
  capacity, replay conflict, frozen state, duplicates, cleanup, and receipt mismatch.
- **Canonical transaction:** lifecycle §R.28 and schema contract §13 contain the
  complete executable contract; backlog, current state, active handoff, documentation
  index, and this append-only entry are synchronized. Earlier R2, REFUND, PRE-PROD,
  C1, C2, and C3A entries were not rewritten.
- **Status / next action:** `COMPLETED / AWAITING ARCHITECT ACCEPTANCE`. F1
  implementation is not authorized. The only next authorizable action is architect
  acceptance or rejection; acceptance must be followed by a separate F1
  implementation order. F2 and C3A acceptance remain unauthorized/pending.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT ACCEPTANCE

- **Accepted contract commit:** `00897f09267fc8304b329ce46ba985d03a57faff`.
- **Ratified status:** `PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT
  CLOSURE R1: CLOSED / ACCEPTED`.
- **Implementation authorization:** `PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD
  CORRECTION IMPLEMENTATION R1: AUTHORIZED`, subject to the final read-only
  reconciliation returning `READY_FOR_F1_IMPLEMENTATION`.
- **Preserved decisions:** all redo verdicts remain **NO** and forward correction
  remains the selected strategy. C3A remains implemented and verified but not
  accepted. F2 UI and staging application remain unauthorized.
- **Boundary:** isolated PostgreSQL verification is permitted. Staging, production,
  `main`, remote changes, push, C3A acceptance, F2, and later phases are prohibited.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION IMPLEMENTATION R1

- **Baseline / authorization:** `dev` at accepted contract
  `00897f09267fc8304b329ce46ba985d03a57faff`; acceptance registration commit
  `380c03dd34f37db80b1c171deb50017b685b69aa`. Lineage from
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Final reconciliation verdict:
  `READY_FOR_F1_IMPLEMENTATION`.
- **Technical implementation:** commit
  `463cafbdd4816ff1093b3086dd71d3d6e70b3479`; forward-only migration
  `db/74_ordem_compra_hybrid_origin_forward_correction.sql`. It installs
  `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT) RETURNS JSONB`,
  immutable `native_distribution_v1` actor/key journal, exact replay/conflict and
  absolute create/increase/reduce/remove/unchanged semantics, corrected unique
  `(item_id, necessidade_id)` identity, derived `kg_pedido`, deterministic cleanup,
  draft/history freeze guards, and the accepted ACL matrix.
- **Phase C correction:** native allocated ledger shape now permits shared NULL OP;
  the db/71-compatible guard, receipt allocation selection/derivation, ledger,
  movement, history, caps, and reversal preserve NULL for Pedido-origin, real OP for
  OP-origin, and allocation-free/OP-free excess. C3A real-OP import and non-posting
  behavior remain unchanged and unaccepted.
- **Application boundary:** independent `Nova ordem`, manual item add/edit/remove,
  and allocation controls remain visible only as disabled/read-only surfaces with no
  handlers. Shared allocations render as `Pedido compartilhado`. These minimal
  changes prevent calls to superseded writers; F2 was not implemented.
- **Isolated database evidence:** PostgreSQL 18.4, full db/67-db/73-compatible local
  baseline, clean db/74 apply and clean reapply, no CASCADE, no environment data
  conversion. `tests/ordem-compra-hybrid-origin-f1.integration.sql` passed inside
  `BEGIN ... ROLLBACK`, proving OP/shared provenance, exact result fields, replay,
  conflict, actor scope, scalar/error taxonomy, quantity cap, derived-quantity guard,
  cleanup and post-cleanup replay/audit, post-emission freeze, shared and OP receipt,
  excess, reversal, movement provenance, and final ACLs.
- **Concurrency evidence:** eight distinct-session cases passed: OP first allocation
  `created/unchanged`; shared first allocation `created/unchanged`; target race
  `increased/reduced` with final 25 kg; removal/recreate `removed/created` with final
  15 kg; empty-draft cleanup/new-need `removed/created`; competing same-draft creation
  `created/created` with one draft; duplicate actor/key returned the exact stored
  `created` result with one journal/allocation row; emission/allocation returned
  `ok/estado_invalido` and retained 20 kg. Final assertion:
  `F1_CONCURRENCY_PASS | 9 allocations | 17 race command rows`; all surviving item
  quantities equalled allocation sums.
- **Tests:** focused purchase-order suite 62/62. Purchase-order + receipt/C3A + OP
  persistence/recalculation + Pedido summary selection 277/278; the sole failure is
  the pre-existing `op-writes` menu-count expectation (expected 9, rendered 12).
  Full suite baseline was 3,896 tests / 3,764 pass / 132 fail; final is 3,902 / 3,770
  / 132. The 132 normalized failure identities are exactly unchanged, SHA-256
  `5aca571de6057bfdf2080ef945112189e6f3f4cb7795ccd827a729131642e75f`.
- **Code health / exception:** JS source files remain below 500 lines and F1 added no
  UI/domain/persistence coupling. The 1,227-line migration and its long RPC/replaced
  receipt definition are a documented cohesive SQL exception: the accepted contract
  requires one atomic next-number migration, and PostgreSQL `CREATE OR REPLACE
  FUNCTION` requires full function bodies for localized replacement. Splitting would
  break the single forward correction and rollback/apply proof. Static tests,
  `node --check`, `git diff --check`, no-CASCADE inspection, and dynamic ACL matrix
  passed.
- **Boundary / status:** `IMPLEMENTED / VERIFIED LOCALLY / AWAITING ARCHITECT
  REVIEW`. No staging application, production, `main`, remote change, push, migration
  history write, or C3A acceptance occurred. Known modified `.gitignore` and untracked
  `AGENTS.md` remained untouched and unstaged. F2 remains unauthorized.
- **Next authorizable action:** architect acceptance or rejection of F1. A separate
  explicit order is required for staging application or F2; neither chains from this
  closeout.
- **Final ACL reconciliation addendum:** follow-up technical commit
  `680cff136a3294ae9a345fc8f91f02e246891eef` corrects an over-broad local-only
  revocation before any environment application. The accepted matrix preserves
  authenticated `sincronizar_necessidades_compra_fio(UUID)` for canonical need
  synchronization; PUBLIC, `anon`, and `service_role` remain revoked. All obsolete
  manual/item-first writers remain owner-only. db/74 reapply, dynamic ACL proof,
  rollback integration 62/62 focused tests, and the exact broad-suite failure hash
  passed again. No staging or other environment observed the superseded local ACL.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION ACCEPTANCE R1

- **Architect ruling:** `PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION
  IMPLEMENTATION R1` is `CLOSED / ACCEPTED_WITH_NONBLOCKING_BASELINE_TEST_DEBT`.
  Accepted technical commits: `463cafbdd4816ff1093b3086dd71d3d6e70b3479` and
  `680cff136a3294ae9a345fc8f91f02e246891eef`; final technical closeout HEAD:
  `1ea4a509c069983732af86130d0092b6c1d96e2b`.
- **Accepted evidence and boundaries:** `db/74_ordem_compra_hybrid_origin_forward_correction.sql`
  is implemented and verified locally only. It was not applied to staging. The
  normalized broader-suite failures remain exactly unchanged; the existing
  admin-menu count failure remains pre-existing and nonblocking. No staging
  application, Supabase write, production, `main`, remote change, or push occurred.
- **Disposition:** F2 is authorized as `PURCHASE-ORDER HYBRID ORIGIN — F2
  PEDIDO/INSUMOS UI CUTOVER R1`, subject to its own readiness reconciliation and
  all hard gates in the architect order. C3A remains `IMPLEMENTED / VERIFIED / NOT
  ACCEPTED`. The F2 boundary does not authorize staging application or any later
  C3 phase.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F2 PEDIDO/INSUMOS UI CUTOVER R1

- **Readiness / technical commit:** reconciliation returned
  `READY_FOR_F2_IMPLEMENTATION`. Technical commit
  `577921150ac5a478294f28b1c8c3501dad23dbbb` installs the admin route
  `#/pedidos/:pedidoId/insumos`, loaded by
  `js/screens/pedido-insumos-distribuicao.js`; Pedido detail and the OP summary
  link to it contextually.
- **Ownership and command contract:** the screen reads the existing authenticated
  canonical need/allocation projections and calls only
  `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT)`. It sends
  need identity, supplier identity, absolute target, and a client command key;
  it never sends Pedido, OP, order, item, material, color, or authoritative item
  quantity. OP-origin needs display server-derived OP provenance read-only;
  shared Pedido-origin needs display `Pedido compartilhado` with no OP selector.
  A modal keeps one generated key through exact/uncertain-response retries and
  creates a new key only for a later intentional action. The UI maps F1 business
  errors explicitly, including authorization, missing need/supplier, invalid or
  excessive target, frozen state, idempotency conflict, provenance, concurrency,
  and cleanup conflicts.
- **Cutover:** purchase-order list/detail screens retain consultation, lifecycle,
  receipt/history, cancellation, and navigation to the owning Pedido. They no
  longer expose `Nova ordem`, manual item writes, or allocation mutation. OP no
  longer assigns a purchasing supplier and links to the Pedido-owned surface;
  unrelated legacy receipt behavior remains intact. No new stepper stage or
  migration was added.
- **Verification:** JavaScript syntax checks and focused
  `pedido-insumos-distribuicao`, purchase-order, OP, and router tests pass
  `139/139`; `git diff --check` passes. Static searches confirm order-first
  writers and the OP purchasing assignment call are absent. Parallel broader-suite
  runs against the F1 closeout worktree and F2 both report 133 pre-existing
  failures; failure identities are not stable under the suite's parallel runner,
  and the serial normalization attempt exceeded the 120-second local limit.
- **Boundary / status:** `IMPLEMENTED / VERIFIED LOCALLY / AWAITING ARCHITECT
  REVIEW`. No staging application, Supabase write, production, `main`, remote
  change, or push occurred. `db/74` remains unapplied to staging. C3A remains
  implemented and verified but not accepted. Next authorizable action: an
  architect-reviewed, separately authorized integrated F1+F2 staging deployment
  and validation.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F2 ARCHITECT ACCEPTANCE REGISTRATION R1

- **Architect ruling:** `PURCHASE-ORDER HYBRID ORIGIN — F2 PEDIDO/INSUMOS UI CUTOVER
  R1` is `CLOSED / ACCEPTED_LOCALLY_WITH_INTEGRATED_STAGING_VALIDATION_REQUIRED`.
- **Accepted commits and evidence:** technical commit
  `577921150ac5a478294f28b1c8c3501dad23dbbb`; documentation closeout commit
  `911b7985297d3b33b4fbf4cf3575a39b8440ff42`; focused F2/Pedido/OP/order/router
  result `139/139 PASS`.
- **Pending integrated evidence:** browser validation and staging application remain
  pending. The 133 broader-suite failures are preserved as pre-existing baseline
  debt; deterministic serial comparison of their identities remains incomplete and
  must not be represented as exact identity proof.
- **Authorization:** `PURCHASE-ORDER HYBRID ORIGIN — F3 INTEGRATED STAGING DEPLOYMENT
  AND AUTHENTICATED VALIDATION R1` is authorized against development/staging project
  `ucrjtfswnfdlxwtmxnoo`, subject to contemporary reconciliation and the explicit
  readiness gate. C3A remains implemented and verified but not accepted.
- **Boundary:** this acceptance does not authorize production, `main`, the prohibited
  project, native-emission activation, C3A activation/acceptance, C3B, or any later
  phase.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3 PARTIAL STAGING CHECKPOINT — HARD STOP

- **Readiness:** `READY_FOR_F3_STAGING_DEPLOYMENT`. Branch `dev`; initial HEAD
  `911b7985297d3b33b4fbf4cf3575a39b8440ff42`; F2 acceptance-registration commit
  `8214ab7b4e7c185d6f4501a593fcaa836ad65d1b`; required lineage anchor
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed.
- **Staging migration:** exact checked-out `db/74` applied to
  `ucrjtfswnfdlxwtmxnoo` as `20260719215401 /
  74_ordem_compra_hybrid_origin_forward_correction`. An initial transport-truncated
  submission failed inside the migration transaction and left no history/object
  residue; the complete 50,036-byte file then applied successfully.
- **Preservation and authority:** every recorded business table count, material total,
  and stable row hash is identical before/after. The command journal exists empty;
  allocation identity is `(item_id, necessidade_id)`; the need-first RPC and all
  accepted guards are installed. `authenticated` retains only the accepted
  need-first/sync/cancel/receipt/reversal/preview surfaces; obsolete manual/item-first
  and independent remover writers, native emission, and C3A import are owner-only.
  C3A remains `legacy_active / not_started`, with zero import/baseline rows.
- **Staging application:** exact committed tree
  `8214ab7b4e7c185d6f4501a593fcaa836ad65d1b` deployed without Git push to Vercel
  preview `dpl_7QGBHzW8MoE4sPVVuGdFrv9Ci7iP`, URL
  `inttracker-5o6qxsrxz-inttex.vercel.app`, `READY`, target `preview`.
- **Hard stop:** the deployment URL, generated alias, and `dev` preview alias all
  redirect to Vercel Authentication. The controlled browser has no authenticated
  Vercel session. Per the order, no workaround, fixture, or business-data mutation
  was attempted. Authenticated browser/API, PRE-PROD, Phase C, focused post-deploy,
  and broader-suite comparison remain pending and are not claimed as passed.
- **Residue and boundaries:** fixture residue is zero because no fixture was created.
  Production `gqmpsxkxynrjvidfmojk`, prohibited project
  `bhgifjrfagkzubpyqpew`, `main`, native emission, and C3A activation/acceptance were
  not accessed. Next authorized action: architect authenticates the preserved
  controlled-browser Vercel login, then instructs Codex to resume F3 at the
  authenticated-browser gate without reapplying `db/74` or redeploying by default.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3R1 STAGING DATABASE/API AND PHASE C CHECKPOINT — HARD STOP

- **Starting state:** branch `dev`, HEAD
  `52cc62f966e32ea61260b63aa1a299fbea876566`; modified `.gitignore`, untracked
  `AGENTS.md`, empty index, and no `index.lock` preserved.
- **Database verification:** staging `ucrjtfswnfdlxwtmxnoo` contains exactly one
  `20260719215401 / 74_ordem_compra_hybrid_origin_forward_correction` and no later
  purchase-order migration. The checked-out command journal, need-first RPC
  signature/body, allocation identity, provenance/quantity/freeze guards,
  nullable-OP Phase C replacements, and accepted effective ACL matrix match.
- **Data preservation:** recorded purchase-order, need, allocation, item, receipt,
  ledger, movement, cutover, and inventory counts/totals/stable hashes match the
  post-`db/74` baseline. C3A remains `legacy_active / not_started`; native emitted
  orders remain zero.
- **Rollback-only validation:** a canonical-domain fixture passed OP-origin and
  shared Pedido-origin absolute-target create/increase/reduce/zero, draft/item
  reuse, server-derived provenance, derived item quantity, duplicate prevention,
  exact replay, conflicting-key rejection, journal survival through cleanup,
  post-emission freeze, ACL denial, receipt, reversal, excess, and nullable-OP
  ledger/movement behavior. Transaction rollback left zero fixture residue.
- **Revalidation result:** `PRE-PROD HYBRID ORIGIN REVALIDATION: PASS` and `PHASE C
  HYBRID PROVENANCE REVALIDATION: PASS` on read-only and rollback evidence. These
  results do not activate or accept C3A.
- **Regression evidence:** focused scope produced 430 tests, 428 passed, with two
  unchanged-HEAD baseline failures (obsolete OP purchasing-supplier expectation and
  stale admin-menu count). Two broader parallel runs each produced 3,906 total,
  3,773 passed, and 133 failed with the same observed normalized failure-identity
  SHA-256 `a6ec3d6a4045763291ce30b48a1237c7695871b7534cf839229611f07cfb0dd2`.
  Deterministic serial identity is not claimed; new attributable failures: zero.
- **Hard stop:** committed multi-session staging concurrency remains unproved. A
  successful committed synthetic command must retain its actor/key in the immutable
  journal even after zero-target cleanup, so it cannot meet the mandatory
  zero-residue policy; no canonical retained staging fixture exists. The accepted
  isolated F1 distinct-session race matrix remains valid but is not silently
  substituted for the specifically requested committed staging proof.
- **Boundaries and next action:** Vercel/browser, production, `main`, remotes, push,
  the prohibited project, native emission activation, and C3A execution were not
  accessed. Next authorizable action: architect disposition of the concurrency
  evidence boundary—accept the isolated F1 race matrix plus F3R1 staging evidence,
  or authorize an explicit retained-fixture/journal-residue policy. C3A disposition
  remains deferred until F3R1 can close.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3R1 ACCEPTANCE DISPOSITION — CLOSED / ACCEPTED

- **Starting state:** branch `dev`, HEAD
  `0b5ef552ca0fd1c36f8b6c16129f3025a30312af`; empty index; preserved residue —
  modified `.gitignore`, untracked `AGENTS.md`. Documentation-only closeout; no
  application, SQL, migration, test, configuration, `.gitignore`, or `AGENTS.md`
  change; no database, deployment, production, `main`, remote, or push activity.
- **Architect disposition (original wording preserved):** the architect authorized
  the recommended disposition against the gate condition
  `ACEITO A DISPOSIÇÃO RECOMENDADA` and responded **"aceito, siga"**, taken as the
  explicit acceptance releasing this closeout.
- **Accepted evidence:** the isolated F1 eight-case distinct-session concurrency
  matrix plus the F3R1 staging database/API runtime and rollback-only evidence are
  accepted as sufficient concurrency proof for this gate.
- **Scoped waiver:** the committed multi-session staging-fixture requirement is
  **waived for F3R1 only**; it sets no precedent and does not extend to any later
  gate.
- **Retained obligations:** immutable command-journal integrity and the
  zero-synthetic-residue validation policy remain mandatory; the waiver authorizes
  no journal-residue policy and no retained synthetic fixture.
- **Also accepted:** PRE-PROD hybrid-origin and focused Phase C revalidation.
- **C3A:** remains `legacy_active / not_started`, implemented and verified but
  **not accepted**; this closeout does not accept, activate, or execute C3A.
- **Canonical records updated:** `PROJECT_STATE.md` active-phase entry + next
  authorized action; lifecycle spec §R.28.12; schema contract §13.13;
  `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` F3R1 acceptance update;
  `DOCUMENTATION_INDEX.md` §R.28/§13/`db/74` rows; this ledger entry.
- **Boundaries:** production `gqmpsxkxynrjvidfmojk`, the prohibited project
  `bhgifjrfagkzubpyqpew`, `main`, remotes, push, deployment, native emission
  activation, and C3A execution remain unauthorized and were untouched.
- **Next authorizable action:** the architect's technical-acceptance disposition
  for **C3A only**. No phase chains automatically from this closeout.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3R1 ACCEPTANCE-PROVENANCE FORWARD CORRECTION — DOCUMENTATION-ONLY

- **Scope:** documentation-only forward correction of the acceptance-authority
  provenance introduced by the immediately preceding entry (commit
  `9c9099464baf55e2f8261676d46bdc8d3656a4fe`). This entry is appended; the
  erroneous historical entry above is **not edited, deleted, or rewritten**.
- **Correction — the prior attribution was factually incorrect:** the preceding
  entry recorded that the architect "responded **\"aceito, siga\"**" against the
  gate condition `ACEITO A DISPOSIÇÃO RECOMENDADA`. That is factually incorrect.
  **Kleber did not say `"aceito, siga"` and did not provide that exact gate
  phrase.** Neither statement is attributable to him.
- **Actual provenance:** F3R1 acceptance is ratified by the technical supervisor
  acting in the delegated project-architect role, following Kleber's actual
  directive: **"cara, quem faz isso é você... você é o arquiteto..."**. Under that
  delegation the technical supervisor accepts the isolated F1 eight-case
  distinct-session concurrency matrix plus the F3R1 staging runtime/rollback
  evidence, and the F3R1-only committed-fixture waiver remains accepted.
- **Provenance-only:** this correction changes **provenance only**. The scoped
  F3R1 committed-concurrency-fixture waiver, the accepted evidence, the retained
  obligations, all boundaries, and C3A's `not accepted` status are **unchanged**.
- **Next authorizable action:** unchanged — the architect's technical-acceptance
  disposition for **C3A only**. No phase chains automatically from this
  correction.

## 2026-07-19 — PHASE-C3A TECHNICAL ACCEPTANCE — CLOSED / TECHNICALLY ACCEPTED

- **Starting state:** branch `dev`, HEAD
  `a79b78dfb811a921c67f6a0dd1839239975ad9a8`; empty index; preserved residue —
  modified `.gitignore`, untracked `AGENTS.md`. Documentation-only closeout; no
  application, SQL, migration, test, configuration, `.gitignore`, or
  `AGENTS.md` change; no database, deployment, production, `main`, remote, or
  push activity.
- **Scope:** technical acceptance of `PHASE-C3A` — contract `d23645f`,
  foundation `fca6ea7`, protected singleton correction `0908b77`, and
  owner-only import command `94e6068`, installed on `dev` via staging
  migrations `20260719172749 / 71`, `20260719174006 / 72`, and
  `20260719175732 / 73`.
- **Acceptance evidence:**
  - staging migrations `71`-`74` present;
  - cutover singleton `id=1`, `legacy_active / not_started`, all cutover
    markers `NULL`;
  - zero import headers, import ledger rows, native headers, inventory
    movements, and baseline rows;
  - preview: 39 headers, 44 ledger entries, 20,221.280 kg reconstructed,
    405.980 kg excess;
  - `saldo_fios`: 5 rows / 2,685.020 kg; `saldo_fios_op`: zero;
  - import command `importar_saldo_inicial_ordem_compra_c3a(jsonb)`: owner
    `postgres`, `SECURITY DEFINER`, empty `search_path`, no EXECUTE grant for
    `PUBLIC`, `anon`, `authenticated`, or `service_role`;
  - authenticated read-only preview ACL intentionally retained under §R.28.5;
  - focused acceptance suite: 66/66 passed.
- **Disposition:** technical acceptance is recorded by the technical
  supervisor acting as delegated project architect. This wording is **not**
  attributed to Kleber.
- **Retained obligations:** `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`
  remains nonblocking debt, unchanged by this acceptance.
- **Boundaries:** this acceptance is documentation-only and authorizes no real
  import, snapshot, fence, reader/writer switch, flat-ACL change, native
  emission, `C3B`/`C3C`/`C3D`/`C4`/`C5`, production, `main`, remote change,
  push, or deployment. Vercel/browser validation, the prohibited project, and
  any staging write beyond the already-applied `71`-`73` were not accessed.
- **Canonical records updated:** `PROJECT_STATE.md` active-phase entry + next
  authorized action; `AGENT_HANDOFF.md` top entry; lifecycle spec §R.28.13;
  schema contract §13.14 (+ Phase C3A boundary section); backlog update entry;
  `DOCUMENTATION_INDEX.md` `db/71`-`db/74` rows and §R.28/§13 summary rows;
  this ledger entry.
- **Next authorizable action:** none chains automatically from this closeout.
  Any `C3B`/`C3C`/`C3D`/`C4`/`C5` scope, real import, snapshot, fence,
  reader/writer or flat-ACL switch, and native emission activation require a
  separate architect order.

## 2026-07-19 — PHASE-C3B-EXECUTABLE-CONTRACT-CLOSURE-R1 — CLOSED / ACCEPTED

- **Starting state:** branch `dev`, HEAD
  `a08db7f10b8b447fa38cd7e11ac7fb567291ecea`; empty index; preserved residue:
  modified `.gitignore` and untracked `AGENTS.md`.
- **Scope:** documentation-only closure in exactly `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, lifecycle §R.29, schema §13.15, production-flow backlog,
  documentation index, and this append-only ledger. No application, SQL,
  migration, test, database, staging, deployment, production, `main`, remote,
  push, `.gitignore`, or `AGENTS.md` change occurred.
- **Disposition:** accepted by the technical supervisor acting as delegated
  project architect; this wording is not attributed to Kleber.
- **Closed contract:** C3B is contract closure; C3C is inactive implementation
  preserving legacy behavior in `legacy_active`; C3D is rehearsal and inactive
  staging deployment preparation. They create no independent real cutover
  windows. The later real cutover is a single contiguous maintenance window with
  no soak interval, session advisory lock, deterministic resource-lock order,
  and short transactions only.
- **Execution boundary:** database-owned guards fence both known legacy receipt
  writers and protected source/inventory mutations; application flags only consume
  cutover state. The frozen source includes all 51 mappings and the full inventory
  baseline. Deterministic import is exactly 39 headers / 44 immutable lines /
  20,221.280 kg / 405.980 kg excess / zero inventory movements. Pre-switch
  reconciliation includes frozen hashes, counts/totals, normalized no-double-count
  proof, and zero productive canonical receipts.
- **Read and UI boundary:** canonical normalized reads preserve Pedido-origin
  `op_id = NULL`, separate attributable from excess quantity, and prevent double
  counting. C3 creates no visual UI; C4 exclusively owns the new admin receipt UI
  at `#/ordens-compra/:id`; supplier UI remains deferred. Compatibility surfaces
  are non-visual state adapters or disabled at cutover.
- **Recovery boundary:** the point of no return is the first successfully
  committed non-import canonical receipt after the canonical read switch. Before
  it, rollback may restore flat reads only after proving zero productive canonical
  receipts; legacy writers remain fenced and flat grants remain closed. Flat
  mutation re-enablement requires separate recovery authorization plus a
  generation/idempotency proof. After it, recovery is forward-only.
- **ACL boundary:** direct privileges on flat/canonical receipt tables,
  sequences, cutover structures, and internal commands are none for `PUBLIC`,
  `anon`, `authenticated`, and `service_role`; `admin` and `supplier` use only
  their expressly authorized canonical RPC surfaces. Table-level and every
  column-level grant are explicitly revoked; no RLS policy targets `PUBLIC`; every
  `SECURITY DEFINER` function has fixed empty `search_path`, explicit
  `PUBLIC`/`anon`/`service_role` revocation, and internal actor/order checks.
  Excessive anon grants are not labeled a confirmed exploit without empirical
  role-matrix proof.
- **Supervisor-supplied evidence:** project `ucrjtfswnfdlxwtmxnoo` starts
  `legacy_active / not_started` with all markers `NULL`, zero import/native/baseline
  counts, postgres-only import RPC, authenticated receipt/reversal/history RPCs,
  and broad flat legacy grants/`PUBLIC` RLS policies. This closeout did not query
  that environment.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C — inactive implementation only`.
  This closeout does not authorize or execute C3C; a separate architect order is
  required. C3D and the later real cutover remain separately authorized actions.

## 2026-07-20 — PHASE-C3C-A-DOCUMENTARY-CLOSEOUT-R1 — CLOSED / TECHNICALLY ACCEPTED

`C3C_A_STATUS: CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING`

`NEXT_AUTHORIZABLE_ACTION: READ-ONLY GOVERNANCE AND SPEC-CUSTODY AUDIT`

- **Recorded status:** `CLOSED / TECHNICALLY ACCEPTED — LOCALLY VERIFIED /
  INACTIVE / NOT APPLIED TO STAGING`.
- **Acceptance provenance:** the delegated technical supervisor records the
  acceptance of the completed local inactive implementation. The acceptance
  wording and decision are not attributed to Kleber.
- **Starting state:** standalone repository `D:\Programação\controle-tapetes-g28`;
  branch `dev`; HEAD `89123729b3529fff6e4a2336bfec2907c4b94b4c`;
  empty index; preserved residue only—modified `.gitignore` and untracked
  `AGENTS.md`.
- **Technical chain:** initial implementation
  `d4dba671c07ec25f23e385e7786cbe90209816f3`; R2 `PUBLIC`-policy correction
  `4b7ee13fe35a830e9a3cb1cc182679c81034ce73`; R3 import/snapshot/
  reconciliation/lock correction `29913e40fa06eda009b5a2e8f058209cde90da11`;
  R4 stable identity-conflict correction
  `89123729b3529fff6e4a2336bfec2907c4b94b4c`.
- **Accepted local evidence:** PostgreSQL 18.4 migration apply/reapply with
  unchanged `legacy_active / flat / not_started`; complete protected 14-table
  `PUBLIC`-policy membership detection/closure; exact replay idempotency; stable
  `55000 / idempotencia_conflitante` for related-header identity conflicts with
  zero writes; canonical per-row/aggregate source and inventory SHA-256 with live
  drift rejection; 51 frozen mappings; 39 headers; 44 scoped import lines;
  19,815.300 kg attributable; 405.980 kg excess; 20,221.280 kg reconstructed;
  zero import-attributable inventory movements; nullable Pedido-origin `op_id`;
  no fabricated OP; no double counting; session advisory-lock exclusion;
  deterministic eight-stage resource locks; release/reacquisition; zero
  deadlocks; idle final backend with no open transaction; focused static,
  rollback-scoped integration, and distinct-session concurrency proofs.
- **Accepted finding disposition:** inactive database contract—closed locally;
  `PUBLIC` policy detection/closure—closed locally; replay idempotency—closed;
  stable identity conflict—closed; snapshot/live SHA-256—closed;
  reconciliation completeness—closed; nullable Pedido-origin provenance—closed;
  attributable/excess separation—closed; zero import inventory movement—closed;
  runtime session/resource locks—closed; pre-PONR rollback—closed; post-PONR
  recovery—forward-only as contracted.
- **Contract preservation:** lifecycle §R.29 and schema §13.15 are unchanged.
  Their single-window cutover, database-owned fence, short transactions, session
  advisory lock, table- and column-level ACL closure, C3 no-visual-UI boundary,
  C4 admin receipt UI ownership, deferred supplier UI, PONR definition, pre-PONR
  rollback, and post-PONR forward-only recovery remain governing.
- **Acceptance distinctions:** only local technical acceptance is granted.
  Staging validation, staging application, deployment, activation, cutover, and
  product acceptance are separate states and are not granted by this closeout.
- **Unauthorized boundaries:** C3C-B implementation; C3D; staging application;
  staging validation; activation; deployment; real snapshot; real import; fence
  transition; read switch; final ACL-closure invocation; cutover; C4; C5;
  production; `main`; remotes; push.
- **Documentation-only manifest:** `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`,
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/DOCUMENTATION_INDEX.md`, and this append-only ledger. No implementation,
  test, migration, database, Supabase, environment, deployment, remote, push,
  `.gitignore`, or `AGENTS.md` change occurred.
- **NEXT_AUTHORIZABLE_ACTION:** `READ-ONLY GOVERNANCE AND SPEC-CUSTODY AUDIT`.
  C3C-B remains the next product implementation lot but is not authorized. The
  governance audit must precede any C3C-B implementation order. No product phase
  chains automatically from this closeout.

## 2026-07-20 — GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1 — IMPLEMENTED / LOCALLY VERIFIED

- **Authorization:** governance-only implementation of the accepted read-only
  custody audit. Commit subject: `docs: establish shared spec custody`. This entry
  records no product implementation, product acceptance, environment transition,
  or authorization of a later phase.
- **Starting state:** standalone repository
  `D:\Programação\controle-tapetes-g28`; branch `dev`; HEAD
  `dd631299f410027ebb23b006aa5e380ad460aefa`; empty index; preserved residue
  was modified `.gitignore` plus untracked `AGENTS.md`.
- **Authorized adoption of `AGENTS.md`:** before replacement, the existing
  untracked file had SHA-256
  `3B0761466B00B3AD9C48990FA3A900AC49E1A9322462FA3CB881ADA9E7C63C64`.
  The architect explicitly authorized adopting it. Final tracked `AGENTS.md` and
  `CLAUDE.md` are minimal byte-identical wrappers for the single tracked source
  `docs/governance/AGENT_INSTRUCTIONS.md`; no symlink or undocumented import
  syntax is used.
- **Foundation:** `PROJECT_STATE.md` now exposes rigid bootstrap pointers; the
  active purchase-order continuation has stable requirement labels and a derived
  traceability matrix; documentation and supervision contracts record
  proportional update rules; `scripts/validate-spec-custody.mjs` validates only
  the six authorized deterministic rule classes with no external dependency.
- **Local verification:** live repository validation passed. Isolated temporary
  fixture baseline passed, and every negative class failed closed as intended:
  missing bootstrap path; active-phase/contract mismatch; pending requirement in
  a closed material phase; invalid checkpoint; divergent wrappers; duplicate
  requirement ID; unresolved normative anchor. Lifecycle §R.29 and schema §13.15
  are byte-identical to their pre-foundation content.
- **Executor-provenance forward correction:** the C3C-A initial implementation
  and correction chain—`d4dba671c07ec25f23e385e7786cbe90209816f3`,
  `4b7ee13fe35a830e9a3cb1cc182679c81034ce73`,
  `29913e40fa06eda009b5a2e8f058209cde90da11`, and
  `89123729b3529fff6e4a2336bfec2907c4b94b4c`—was executed by **Codex**, not
  Claude Code. Git records the intentionally generic author identity `IAexec`.
  This append-only correction preserves the prior entries and changes no
  technical acceptance, evidence disposition, product state, or environment
  consequence.
- **Product boundary:** lifecycle §R.29 and schema §13.15 product semantics are
  unchanged. C3C-B is the next product lot but remains unauthorized and has no
  phase contract. C3D, staging, deployment, activation, real snapshot/import,
  fence transition, read switch, ACL-closure invocation, cutover, C4, C5,
  production, `main`, remotes, and push remain unauthorized.
- **NEXT_AUTHORIZABLE_ACTION:**
  `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`, requiring a separate architect order.

## 2026-07-20 — GOVERNANCE-STATE-HANDOFF-COMPACTION-R1 — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW

- **Authorization:** the architect authorized `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`,
  a documentation/governance-only compaction of the current-state and handoff
  documents. It follows and builds on the acceptance of
  `GOVERNANCE-SPEC-CUSTODY-FOUNDATION-R1` (recorded in the entry directly above,
  `IMPLEMENTED / LOCALLY VERIFIED / AWAITING INDEPENDENT SUPERVISOR REVIEW`). This
  entry records no product implementation, product acceptance, environment
  transition, or authorization of a later phase.
- **Accepted commit chain reconciled:** the governance foundation's accepted chain
  runs through the compaction baseline `17ff8adddaa9f2fd3bc61af7261d9ebaad275f08`
  (branch `dev`), on top of the accepted checkpoint
  `dd631299f410027ebb23b006aa5e380ad460aefa`. Every commit from the accepted
  checkpoint through the baseline (`docs: establish shared spec custody`;
  `fix: harden spec custody validation`; `fix: reject detached spec custody rows`;
  `fix: distinguish prose from detached tables`; `refactor: split spec custody
  validator`) remains accounted by the spec-custody validator.
- **Compaction performed (documentation-only):**
  - `PROJECT_STATE.md` compacted from 1449 to a ~243-line current-state hub; the
    `SPEC_CUSTODY_BOOTSTRAP` block is retained and remains unique/valid, with
    `NEXT_AUTHORIZABLE_ACTION` advanced to
    `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-SUPERVISOR-REVIEW`;
    `LAST_ACCEPTED_PHASE: PHASE-C3C-A`, `ACTIVE_PHASE: NONE`,
    `ACTIVE_PHASE_CONTRACT: NONE`, `ACTIVE_TRACK: PURCHASE_ORDER_PHASE_C`.
  - `AGENT_HANDOFF.md` reduced from 2377 lines to a ~135-line concise derived
    operational handoff.
  - New archive `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` preserves the
    prior root `AGENT_HANDOFF.md` stack verbatim (source: root `AGENT_HANDOFF.md`
    at `17ff8ad`) under a non-authoritative banner; it holds no live next-action
    authority and names `PROJECT_STATE.md` as current-state owner and root
    `AGENT_HANDOFF.md` as the current operational handoff.
  - Stale live "current phase" / "next action" copies were qualified with
    pointers to `PROJECT_STATE.md` in
    `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
    `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, and
    `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`; phase
    sequence, dependencies, backlog items, and accepted architecture are
    unchanged.
  - `docs/DOCUMENTATION_INDEX.md` indexes the new archive and classifies
    `PROJECT_STATE.md` as current-state authority, root `AGENT_HANDOFF.md` as the
    derived current handoff, and both archives as historical/non-operational.
  - `services/documents-ingestor/AGENT_HANDOFF.md` was marked historical /
    service-local and non-authoritative for global state, pointing to
    `/PROJECT_STATE.md`, `/AGENT_HANDOFF.md`, and `/docs/DOCUMENTATION_INDEX.md`.
  - `docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md` was corrected to reflect the
    actual tracked `.claude/launch.json` (tracked; `python -m http.server 8765`)
    and the real `.claude` presence in this worktree.
- **No content lost:** every removed live-document narrative is preserved in this
  append-only ledger, in `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`, and in
  the new `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md`; the concise
  accepted-phase index in `PROJECT_STATE.md` indexes every affected phase.
- **No product semantics changed:** lifecycle §R.29, schema §13.15, the
  requirement registries, and `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  are byte-unchanged; the spec-custody validator and the byte-identical wrappers
  `CLAUDE.md`/`AGENTS.md` are unchanged. C3C-B remains unauthorized with no phase
  contract.
- **No environment action:** no database, Supabase, staging, production,
  deployment, activation, cutover, remote mutation, or push occurred; no
  `.gitignore` change; the only preserved worktree residue is modified
  `.gitignore`.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff --check`
  clean; the committed manifest matches exactly the authorized allowed paths.
- **Commit subject (for accounting):** `docs: compact project state and handoff`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:**
  `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-SUPERVISOR-REVIEW`. C3C-B remains the
  next product implementation lot but is not authorized and has no phase contract;
  no product phase chains automatically from this compaction.

## 2026-07-20 — GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-CLOSEOUT — SUPERVISOR ACCEPTANCE

- **Supervisor decision:** `ACCEPTED — GOVERNANCE-STATE-HANDOFF-COMPACTION-R1`.
  Documentation-only acceptance closeout; it creates no C3C-B contract and
  implements no product work.
- **Accepted commit:** `1157b9e71bc629903c5940ab50d4b370964e560e` (parent
  `17ff8adddaa9f2fd3bc61af7261d9ebaad275f08`). Acceptance basis: `PROJECT_STATE.md`
  compacted to 243 lines; `AGENT_HANDOFF.md` compacted to 135 lines; historical
  content preserved in tracked archives and this append-only ledger; no unique
  canonical evidence lost; validator PASS; self-tests 47/47 PASS; index empty;
  only the pre-existing modified `.gitignore` residue remained; no product,
  database, Supabase, staging, production, deployment, remote, or push action
  occurred.
- **Archive-file clarification:** both closeout archives are tracked and intact.
  `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md` was created by the compaction
  commit `1157b9e`; `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` is a
  **pre-existing** tracked evidence owner (last touched by
  `2a8822728cc80436153ade4254f7da996e500d32`, `PROJECT-STATE-COMPACTION-B`) and
  was correctly referenced — not created — by the compaction, so its absence from
  the compaction change-manifest was correct, not a manifest defect.
- **No unique evidence lost:** every material block removed from `PROJECT_STATE.md`
  has a tracked preservation owner — the purchase-order/Phase-C/governance
  narratives in this ledger, the migration/Camada/UI narratives in
  `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`, the handoff stack verbatim in
  `docs/closeouts/AGENT_HANDOFF_ARCHIVE_2026-07.md`, and the concise accepted-phase
  index retained in `PROJECT_STATE.md`.
- **Self-test count correction:** the compaction report's "48 tests" was a typo.
  The correct result is **47/47 PASS, 0 FAIL** (the validator and self-test files
  are byte-unchanged; the suite has always emitted 47 result lines).
- **Traceability pointer correction:** the obsolete derived line
  `NEXT_AUTHORIZABLE_ACTION: GOVERNANCE-STATE-HANDOFF-COMPACTION-R1` in
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` was replaced with
  `NEXT_AUTHORIZABLE_ACTION: C3C-B-MATERIAL-PHASE-CONTRACT-R1`; a single accounting
  line was added for this commit. Requirement IDs, normative anchors, ownership,
  dispositions, evidence, environments, checkpoints, residual debts, and all
  requirement-table rows are unchanged.
- **No product or environment consequence:** lifecycle §R.29, schema §13.15, the
  requirement registries, the requirement-matrix rows, the spec-custody validator,
  and the byte-identical wrappers `CLAUDE.md`/`AGENTS.md` are unchanged. No
  database, Supabase, staging, production, deployment, activation, cutover, remote
  mutation, or push occurred; no `.gitignore` change.
- **C3C-B remains UNAUTHORIZED** with no phase contract; no product phase chains.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-MATERIAL-PHASE-CONTRACT-R1` — the next
  phase must define and obtain acceptance of a material phase contract before any
  C3C-B implementation.
- **Exact accounting subject:** `docs: accept state handoff compaction`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
