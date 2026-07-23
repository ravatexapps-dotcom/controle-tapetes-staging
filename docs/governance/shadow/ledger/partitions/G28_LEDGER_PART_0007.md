<!-- GENERATED NON-CANONICAL SHADOW LEDGER PARTITION — DO NOT EDIT -->
<!-- partition_id: G28-LEDGER-PART-0007 -->
<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->
<!-- source_unit_interval: G28-LEDGER-UNIT-0139..G28-LEDGER-UNIT-0149 -->
<!-- canonical_byte_interval: 608383..673744 -->
<!-- canonical_line_interval: 4757..5691 -->
<!-- payload_sha256: e806f3a43ccff4e938beb938587c38b8868fe6aea659e84ddd935134cf9b0621 -->
<!-- oversized_single_unit: false -->
<!-- partition_status: CLOSED -->
<!-- G28_LEDGER_SHADOW_PAYLOAD_BEGIN_7b9d4e3a -->
## 2026-07-20 — C3C-B-MATERIAL-PHASE-CONTRACT-R1 — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW

- **Authorization:** the architect authorized
  `C3C-B-MATERIAL-PHASE-CONTRACT-R1`, a documentation-only pass to inspect the
  real repository and author an implementation-ready material phase contract for
  `PHASE-C3C-B`, following the acceptance of
  `GOVERNANCE-STATE-HANDOFF-COMPACTION-R1-CLOSEOUT` (entry directly above). This
  entry records no product implementation, no database or environment action,
  and no authorization of `PHASE-C3C-B` implementation.
- **Entry checkpoint reconciled:** branch `dev`, HEAD
  `6fcd139e8cdfd2e1539157388896ebc039a3af23`, parent
  `1157b9e71bc629903c5940ab50d4b370964e560e`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly.
- **Contract authored:** `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`,
  binding the four already-accepted `§R.31`/`13.17` requirement IDs
  (`OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`, `OC-C3-NOUI-001`) to:
  a verified 17-file dependency inventory (re-checked against the real `js/`
  tree — three files reclassified out of scope as native-only
  `ordem_compra`/RPC consumers with no legacy-table coupling, one file
  reclassified out of scope as a pre-receipt-only consumer, `op-nova.js`
  reclassified as also a write call-site); an exact 9-file product manifest
  (8 existing files plus one new shared adapter module
  `js/screens/ordem-compra-receipt-cutover.js`) and an exact 8-file test manifest
  (7 existing plus one new); reader/writer migration rules keyed to the three
  already-granted canonical RPCs installed by `db/75`
  (`registrar_recebimento_ordem_compra`, `estornar_recebimento_ordem_compra`,
  `listar_recebimentos_ordem_compra_normalizados`); a documented finding that no
  client-reachable cutover-state-check surface exists (`ordem_compra_cutover` is
  fully revoked), so detection must be response-shape-driven, not a new schema
  read; per-requirement acceptance criteria; residual debts; and hard stops.
- **No product implementation:** zero product or test files were created,
  modified, or deleted by this pass; the new contract document only describes
  files a **future**, separately authorized implementation order may touch.
  `db/75` and every other migration are unchanged; lifecycle §R.29 and schema
  §13.15/§13.16 are byte-unchanged; the four `OC-C3-*` traceability dispositions
  in `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` are unchanged (still
  `PARTIALLY_SATISFIED`/`PLANNED`, none `SATISFIED`).
- **No database or environment action:** no Supabase MCP call, no staging or
  production access, no migration, and no `.gitignore` change occurred.
- **Documentation-only manifest:** `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`
  (new), `docs/DOCUMENTATION_INDEX.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and this ledger.
  `PROJECT_STATE.md`'s `ACTIVE_PHASE` and `ACTIVE_PHASE_CONTRACT` remain `NONE`;
  only `NEXT_AUTHORIZABLE_ACTION` advanced to
  `C3C-B-MATERIAL-PHASE-CONTRACT-R1-SUPERVISOR-REVIEW`.
- **C3C-B remains UNAUTHORIZED** with no ACTIVE phase contract; the new contract
  is `STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT
  AUTHORIZED`; no product phase chains automatically from this pass.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` 47/47 PASS; `git diff --check`
  clean; `git diff --cached --check` clean; the committed manifest matches
  exactly the documentation-only paths above; lifecycle §R.29 and schema §13.15
  confirmed byte-identical; wrappers `CLAUDE.md`/`AGENTS.md` confirmed unchanged
  and byte-identical.
- **Exact accounting subject:** `docs: define C3C-B material phase contract`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-MATERIAL-PHASE-CONTRACT-R1-SUPERVISOR-REVIEW`
  — supervisor review and acceptance of the new contract. `PHASE-C3C-B`
  implementation remains a separate, later authorization; no phase chains
  automatically.

## 2026-07-20 — C3C-B-MATERIAL-PHASE-CONTRACT-R1 — FORWARD CORRECTION (verdict CHANGES_REQUIRED) — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW

- **Append-only forward correction.** This entry corrects, and does not rewrite,
  the immediately preceding `C3C-B-MATERIAL-PHASE-CONTRACT-R1` entry. A read-only
  supervisor review of that contract's R1 returned `CHANGES_REQUIRED`;
  `PHASE-C3C-B` product implementation remains unauthorized. Documentation-only
  (`FORWARD_CORRECTION` per `docs/governance/DOCUMENTATION_MODEL.md` §4). No
  product, database, Supabase, staging, production, deployment, activation,
  cutover, remote mutation, or push occurred by the authoring of this correction.
- **Entry checkpoint reconciled:** branch `dev`, HEAD
  `84e7b61fecd5c406793ccc1962cb77b97a6bd015`, parent
  `6fcd139e8cdfd2e1539157388896ebc039a3af23`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly.
- **Root cause.** The R1 contract's §§4–17 designed `PHASE-C3C-B` as a JS/HTML
  application-only compatibility phase that attempts the canonical surface and
  falls back to legacy while `legacy_active`. Reconciliation against the actually
  installed `db/75` surface and the three legacy consumers proved that design is
  **not buildable**: the canonical reader is a receipt-ledger reader that cannot
  reproduce the order-list shapes the screens require, and the canonical command
  is a native per-line receipt command with no client-authorized flat→native
  atomic adapter.
- **Reader shape matrix result (Defect 1, contract §25).** Field-by-field, the
  reader `listar_recebimentos_ordem_compra_normalizados` reproduces receipt-event
  fields (native order/item/allocation identity, `kg_recebido_atribuido`,
  `kg_excesso`, Pedido/supplier scoping, `ocorrido_em`) but **cannot** reproduce
  flat-row identity, `kg_pedido`, per-order administrative/acceptance status,
  zero-receipt/pending-order rows, or the supplier-facing OP label. Its INNER
  JOIN over receipts/lançamentos (`db/75` L343–344) drops every unreceived order.
  → **HARD STOP — C3C-B REQUIRES DATABASE READ-CONTRACT FORWARD CORRECTION.**
- **Writer payload matrix result (Defect 2, contract §26).** The legacy writer
  input (flat `ordens_compra_fio.id` + absolute cumulative `kg_recebido` + date +
  client-derived status) has no atomic path to the canonical command input
  (native `ordem_compra_id` + per-allocation signed-delta `p_linhas` + stable
  idempotency key). Identity is `SELECT`-readable (`ordem_compra_item_compat_fio`,
  `ordem_compra_item_alocacao`, `necessidade_compra_fio` — `db/67` L442/L292/L123),
  but no surface performs the flat→native fan-out decomposition, the absolute→delta
  conversion requires the canonical total that is unreadable while the reader is
  inactive, and no retry-stable idempotency contract exists (the R1 "order id +
  occurrence timestamp" proposal is withdrawn as insufficient/collision-prone).
  → **HARD STOP — C3C-B REQUIRES DATABASE COMMAND-ADAPTER FORWARD CORRECTION.**
- **Database forward correction required: YES (both read-contract and
  command-adapter).** Each is a separate `NORMATIVE_CHANGE` + migration
  authorization and is **not** granted here. No JS-only reconstruction was
  invented and no migration was authorized or written (order + contract §14/§19).
- **Error policy (Defect 3, contract §27).** The §9.2 "fallback on any error"
  vs §10/§14 "fail-closed" contradiction is replaced by one finite policy: fall
  back only on the exact inactive signal (`canonical_reader_inactive` /
  `recebimento_canonico_inativo`) and — only within the named bounded deployment
  interval where `db/75` is unapplied to the target environment (e.g. production
  `gqmpsxkxynrjvidfmojk`) — on `42883 undefined_function`; surface fail-closed on
  permission (`42501`), payload, contract, network, timeout, and unrecognized
  errors; never classify an unknown failure as inactive.
- **Supplier reader disposition (Defect 4, contract §28).** `js/screens/fornecedor.js`
  is recorded as a **third independent reader** and independent writer at highest
  scrutiny: supplier scoping (flat RLS today; server-side in the canonical reader),
  pending/unreceived-order visibility and supplier-facing OP label both **BLOCKED**
  by the read-contract forward correction, write side **BLOCKED** by the
  command-adapter forward correction, not routed/not state-disabled by this phase,
  with tests independent from the admin Pedido/OP readers.
- **Exact-manifest wording (Defect 5, contract §29).** Normalized to **ten
  authorized product paths total** = **nine JavaScript product paths** (including
  the new adapter `js/screens/ordem-compra-receipt-cutover.js`) **plus
  `index.html`**; and **eight authorized test paths**.
- **Contract sections corrected:** new §0 banner; in-place fixes to §9.2 and
  §10.1 (error policy); new §8.1 manifest-wording note; appended §§25–30 (reader
  matrix, writer matrix, unified error policy, supplier disposition, manifest
  wording, corrected status + database blockers). §§1–24 preserved as authored.
- **Contract status unchanged:** `STATUS: PROPOSED / AWAITING SUPERVISOR
  ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED`; no requirement marked `SATISFIED`.
  `PROJECT_STATE.md` `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE` and were
  not touched; the four `OC-C3-*` traceability dispositions are unchanged
  (recording them as `BLOCKED` is a supervisor-acceptance matter, not this pass).
- **Documentation-only manifest:** `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`
  and this ledger only. No other canonical document was modified; lifecycle §R.29,
  schema §13.15–13.17, the requirement registries, the traceability matrix, the
  spec-custody validator, and the byte-identical wrappers `CLAUDE.md`/`AGENTS.md`
  are unchanged.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff --check`
  clean; `git diff --cached --check` clean; the committed manifest matches exactly
  the two documentation-only paths above.
- **Exact accounting subject:** `docs: forward-correct C3C-B material phase contract`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-MATERIAL-PHASE-CONTRACT-R1-SUPERVISOR-REVIEW`
  — read-only supervisor review of the **corrected** contract. `PHASE-C3C-B`
  implementation remains unauthorized and is additionally blocked pending the two
  database forward corrections above; no phase chains automatically.

## 2026-07-20 — C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1 — SUPERVISOR ACCEPTANCE + NEW MATERIAL CONTRACT AUTHORED

- **Authorization:** the architect authorized
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1`, a documentation-only pass
  to (a) record supervisor acceptance of the corrected
  `C3C-B-MATERIAL-PHASE-CONTRACT-R1` and (b) author a new material phase
  contract defining the two database prerequisites that contract's forward
  correction identified as hard stops. This entry records no product
  implementation, no migration, no database or environment action, and no
  authorization of `PHASE-C3C-B` or `PHASE-C3C-B-DB-PREREQ` implementation.
- **Entry checkpoint reconciled:** branch `dev`, HEAD
  `6585a6c6d1837a3e0044bac8c603ffe866b73e05`, parent
  `84e7b61fecd5c406793ccc1962cb77b97a6bd015`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly.

### Supervisor acceptance of `C3C-B-MATERIAL-PHASE-CONTRACT-R1`

- **Verdict:** `ACCEPTED — C3C-B-MATERIAL-PHASE-CONTRACT-R1`,
  `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
  AUTHORIZED`. Recorded by the delegated technical supervisor; not attributed
  to Kleber.
- **Basis:** the forward correction's reader shape matrix (§25) and writer
  payload matrix (§26) — verified field-by-field against the installed `db/75`
  surface and the three real legacy consumers — are accepted as correct; both
  hard stops (database read-contract, database command-adapter) are
  well-founded and not resolvable by an application-layer-only design. The
  unified error policy (§27), supplier reader disposition (§28), and
  exact-manifest wording (§29) corrections are accepted without further
  change. Recorded as §31 of
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (append-only; §30
  preserved verbatim as superseded history, not rewritten).
- **Traceability disposition applied** (in
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`, same commit):
  `OC-C3-READ-001` remains `PARTIALLY_SATISFIED`, residual debt now names the
  Component A prerequisite; `OC-C3-WRITE-001` remains `PARTIALLY_SATISFIED`,
  residual debt now names the Component B prerequisite; `OC-C3-COMPAT-001`
  changed `PLANNED` → `BLOCKED`, residual debt names both prerequisites;
  `OC-C3-NOUI-001` remains `PARTIALLY_SATISFIED`, unchanged. No requirement
  marked `SATISFIED`. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE` in
  `PROJECT_STATE.md`.

### New material contract authored: `PHASE-C3C-B-DB-PREREQ`

- **Contract authored:** `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`,
  `STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT
  AUTHORIZED`. Defines exactly two tightly coupled components, treated as one
  material prerequisite phase per the order's no-microphase design principle:
  - **Component A** — `public.listar_ordens_compra_fio_compat(p_pedido_id,
    p_op_id)`, a canonical order-catalog projection over the
    already-populated `ordem_compra_item_compat_fio` bridge (REFUND-A,
    `db/67`), returning item-grain or OP-attributable-grain rows including
    pending/zero-receipt orders — closing every gap in the corrected
    contract's §25 reader shape matrix.
  - **Component B** — `public.registrar_recebimento_ordem_compra_fio_compat(...)`,
    an atomic legacy receipt-intent adapter accepting the flat absolute-total
    intent, resolving flat→native identity server-side under lock, and
    converting it into the immutable native ledger (`ordem_compra_fio_lancamentos`/
    `ordem_compra_recebimentos`) via a deterministic per-allocation fan-out
    (increase) or a proposed LIFO reversal-selection rule (decrease,
    admin-only) — closing the corrected contract's §26 writer payload matrix.
- **Critical finding recorded:** the existing native receipt commands
  (`_c3c_registrar_recebimento_impl`/`_c3c_estornar_recebimento_impl`, `db/70`
  as renamed by `db/75`) unconditionally reject every legacy-compat order
  (`ordem_compra.legado = TRUE`) by explicit design. Component B is therefore
  a new, parallel entry point reusing the same immutable ledger tables and
  the same `legado`-agnostic triggers, with its own legacy-appropriate
  eligibility gate — not a thin wrapper around the existing commands.
- **Ongoing compat-mapping coverage gap recorded (not silently closed):**
  `ordem_compra_item_compat_fio` was seeded once by REFUND-A
  (2026-07-18, 51 rows); no live bridge writer was ever built (confirmed
  absent by exhaustive grep across `db/68`–`db/75`); `op-persistir.js`'s
  still-live legacy branch creates new unmapped flat rows going forward. The
  contract's migration backfills every currently-unmapped row at apply-time
  only; the forward-going gap is an explicit named residual debt with two
  undecided follow-up options, not a solved problem.
- **Missing-RPC/deployment model:** Model A (database-first) adopted and
  justified — `db/76` (specified, not created) must be applied before any
  consuming application code ships to the same environment; no long-lived
  `42883` fallback is required; the existing bounded-interval exception
  (`ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §27) extends to the two new RPC
  names rather than a second independent tolerance.
- **Normative amendments identified as preconditions, not applied:** two
  proposed deltas (a new `§R.29.7` in the lifecycle spec; a new `§13.18` in
  the schema contract) are quoted verbatim in the new contract's §13 as
  proposed text only — neither normative file is edited by this pass. Two
  draft requirement IDs (`OC-C3-DBPREREQ-READ-001`, `OC-C3-DBPREREQ-WRITE-001`)
  are proposed for future registry ratification, not added to either registry
  in this pass.
- **Hard-stop evaluation:** all nine hard-stop conditions from the order were
  evaluated against the actual repository evidence; none triggers. The two
  reversal/eligibility design questions that could have been hard stops are
  instead closed with concrete, deterministic proposed rules, explicitly
  flagged as requiring architect ratification before implementation — per the
  order's own allowance to describe proposed amendments rather than declare
  an unresolvable stop.
- **Exact future manifest:** one migration file
  (`db/76_ordem_compra_c3c_b_db_prerequisites.sql`, not created); two new
  database functions plus one idempotent backfill block plus one additive
  `CHECK`-constraint extension; zero product files; three new test files
  (`tests/ordem-compra-c3c-b-db-prerequisites.smoke.js`,
  `.integration.sql`, `-concurrency.mjs`, none created).
- **Named behavior-change disclosure:** the future canonical decrease path is
  admin-only, narrowing `fornecedor.js`'s current unrestricted-decrease inline
  `.update()` — disclosed now as a residual debt (§16 of the new contract),
  not deferred to discovery at implementation time.
- **Documentation-only manifest this pass:**
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` (§31 appended, §30
  marked superseded, STATUS marker updated),
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  (new), `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/DOCUMENTATION_INDEX.md`, and this ledger. `PROJECT_STATE.md`'s
  `ACTIVE_PHASE` and `ACTIVE_PHASE_CONTRACT` remain `NONE`; only
  `NEXT_AUTHORIZABLE_ACTION` advanced to
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1-SUPERVISOR-REVIEW`.
- **No product implementation, no migration, no database or environment
  action:** zero product, test, or `db/*.sql` files were created, modified, or
  deleted by this pass. Lifecycle §R.29 and schema §13.15–13.17 remain
  byte-unchanged; the two proposed normative deltas (§13 of the new contract)
  are quoted text only, not applied.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff
  --check` clean; `git diff --cached --check` clean; the committed manifest
  matches exactly the documentation-only paths above; lifecycle §R.29 and
  schema §13.15–13.17 confirmed byte-identical; wrappers
  `CLAUDE.md`/`AGENTS.md` confirmed unchanged and byte-identical.
- **Exact accounting subject:** `docs: accept C3C-B contract, define DB prerequisites`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1-SUPERVISOR-REVIEW`
  — read-only supervisor review of the new database-prerequisites contract.
  `PHASE-C3C-B` implementation remains unauthorized and is additionally
  blocked pending that contract's acceptance and its own future
  implementation authorization; no phase chains automatically.

## 2026-07-20 — C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1 — FORWARD CORRECTION (verdict CHANGES_REQUIRED) — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW

- **Append-only forward correction.** This entry corrects, and does not
  rewrite, the immediately preceding
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1` entry. A read-only
  supervisor review of that contract's R1 returned `CHANGES_REQUIRED`;
  neither `PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation is
  authorized. Documentation-only (`FORWARD_CORRECTION` per
  `docs/governance/DOCUMENTATION_MODEL.md` §4). No product, database,
  Supabase, staging, production, deployment, activation, cutover, remote
  mutation, or push occurred.
- **Entry checkpoint reconciled:** branch `dev`, HEAD
  `a0a0b7597c4cdc46333973b4e715f78c8c34ab2d`, parent
  `6585a6c6d1837a3e0044bac8c603ffe866b73e05`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly.
- **Root cause.** R1's Component B was designed as an always-reachable
  parallel entry point, gated only by its own business-rule check, never
  checking the C3 cutover's own state. Two independent findings resulted from
  this, plus three further independent findings against Component A's design
  and the reversal/grain details — all five verified against the actually
  installed `db/67`–`db/75` objects before correction.
- **Finding 1 — Component B blocked by `db/75`'s own trigger.**
  `trg_c3c_command_state_guard` (`db/75` L193–222, out of this contract's
  scope to modify) rejects any `ordem_compra_recebimentos.comando_tipo <>
  'import_saldo_inicial'` insert unless `status='canonical_active' AND
  read_authority='canonical'`. R1's `comando_tipo='recebimento_compat'`
  insert would fail unconditionally during `legacy_active`.
- **Finding 2 — dual authority.** Even bypassing the trigger, a live
  canonical write during `legacy_active` would diverge from the flat table,
  which `db/75`'s fence/snapshot logic treats as the sole frozen source at
  fence time. R1's claim that a `legacy_compat_receipt_v1`-namespaced receipt
  was "outside" `productive_receipt_started_at` tracking was incorrect in
  substance.
- **Corrected design (new §22):** Component B adopts the identical
  install-inert-during-`legacy_active` pattern `db/75` already uses for its
  own three RPCs — checks cutover state first, returns
  `{ok:false,codigo:'recebimento_compat_inativo'}` while
  `legacy_active`/`maintenance_fenced`, proceeds only in `canonical_active`.
  A successful increase now correctly participates in the single, existing
  §R.29.3 PONR by setting `productive_receipt_started_at`, exactly as the
  native command already does — no new or second PONR is created.
- **Finding 3 — compat-mapping gap could not remain a residual debt.** R1's
  §5.4/§16 left the ongoing coverage gap as an undecided follow-up, which is
  insufficient given Component A's stated purpose. **Corrected (new §23):** a
  new mandatory live bridge trigger,
  `trg_ordens_compra_fio_bridge_compat AFTER INSERT ON
  public.ordens_compra_fio`, reuses the identical class-determination logic
  already proven twice in this codebase (REFUND-A's seed, `db/67`
  L655–659; the cutover snapshot, `db/75` L507–509) to create the compat
  mapping the moment any new flat row is inserted, by any caller including
  `op-persistir.js`'s still-live legacy branch, with zero application change.
  Together with the unchanged one-time backfill, zero unmapped
  header-bearing legacy row can exist after `db/76` is applied, at any point
  in time, going forward. Verified compatible with
  `trg_c3c_protected_mutation_guard`'s own early-return during
  `legacy_active` (`db/75` L131–133) — no conflict.
- **Finding 4 — reversal policy silently excluded imported balances.**
  `db/75`'s import command inserts ledger lines with
  `tipo='import_saldo_inicial'` (`db/75` L910–934), not `tipo='recebimento'`;
  R1's §6.7 reversal scope excluded them, so an item whose balance is entirely
  import-derived would have zero reversible balance under R1's rule.
  **Corrected (new §24):** the imported opening balance is adopted as an
  **immutable floor** — decreases may reverse only genuine
  `tipo='recebimento'` lines; a decrease that would go below the
  import-derived floor returns a new, distinct code
  `reducao_abaixo_saldo_importado`, naming the floor amount. Chosen over
  correcting import lines (would invalidate `db/75`'s SHA-256 hash-chain
  verification) or ending absolute-intent support post-cutover (contradicts
  §R.29's own stated purpose for `PHASE-C3C-B`).
- **Finding 5 — OP-attributable grain could duplicate rows.** Nothing
  structurally prevents two `ordem_compra_item_alocacao` rows from targeting
  the same `(item_id, op_id)` pair via different `necessidade_id`s (verified:
  `db/67`'s only relevant `UNIQUE` indexes constrain native-only
  `necessidade_compra_fio`, not the allocation table). R1's item×allocation
  OP-grain could render two "Registrar" forms for one unmodified `op-nova.js`
  order. **Corrected (new §25):** the OP-attributable grain becomes item×OP —
  exactly one row per compat-mapped item per requested OP, allocations
  aggregated (`kg_pedido`/`kg_recebido` summed across that OP's allocations
  only), full per-allocation detail still available in the unchanged
  `alocacoes` sub-array. Structurally impossible to duplicate.
- **Contract sections corrected:** new §0 banner; §21 marked superseded by
  §22.4; appended §§22–28 (Component B activation state machine, Component A
  bridge trigger, reversal floor policy, OP-grain correction, deployment-model
  refinement, corrected exact manifest, corrected hard-stop
  evaluation/residual debts/status). §§1–21 preserved as authored.
- **Contract status unchanged:** `STATUS: PROPOSED / AWAITING SUPERVISOR
  ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED`; no requirement marked
  `SATISFIED`. `PROJECT_STATE.md` `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
  remain `NONE`; `NEXT_AUTHORIZABLE_ACTION` value is factually unchanged
  (still supervisor review of this contract, now its corrected form), so
  `PROJECT_STATE.md`/`AGENT_HANDOFF.md`/the traceability matrix were **not**
  touched by this pass, per the proportional update rule — nothing owned
  there changed.
- **Documentation-only manifest:**
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  and this ledger only. No other canonical document was modified; lifecycle
  §R.29, schema §13.15–13.17, the requirement registries, the traceability
  matrix, the spec-custody validator, and the byte-identical wrappers
  `CLAUDE.md`/`AGENTS.md` are unchanged.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff
  --check` clean; `git diff --cached --check` clean; the committed manifest
  matches exactly the two documentation-only paths above.
- **Exact accounting subject:** `docs: forward-correct C3C-B DB prerequisites contract`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1-SUPERVISOR-REVIEW`
  — read-only supervisor review of the **corrected** database-prerequisites
  contract. Neither `PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation
  is authorized; no phase chains automatically.

## 2026-07-20 — C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1 — FORWARD CORRECTION R2 (verdict CHANGES_REQUIRED) — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR REVIEW

- **Append-only forward correction (second on this contract).** Corrects, and
  does not rewrite, the two preceding
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1` entries. A second
  read-only supervisor review returned `CHANGES_REQUIRED`; neither
  `PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation is authorized.
  Documentation-only (`FORWARD_CORRECTION` per
  `docs/governance/DOCUMENTATION_MODEL.md` §4). No product, database, Supabase,
  staging, production, deployment, activation, cutover, remote mutation, or
  push occurred.
- **Entry checkpoint reconciled:** branch `dev`, HEAD
  `971ec1256488755b99c6c5e53e3a601c07677713`, parent
  `a0a0b7597c4cdc46333973b4e715f78c8c34ab2d`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly.
- **All three review findings verified against the installed
  `db/67`–`db/75` objects and the live `js/screens/*` writers before
  acceptance; all three are valid.**
- **Finding 1 — Component A stale during `legacy_active`.** The legacy writers
  record receipts as a flat `UPDATE` on `ordens_compra_fio.{kg_recebido,
  data_recebimento, status}` (`op-writes.js` L35–42; `fornecedor.js`
  L461–463); they never touch `ordem_compra_item` or the native ledger.
  `ordem_compra_item.kg_recebido` is maintained only by
  `trg_native_lancamento_derive_state` (`db/70` L333–335), which fires only
  `AFTER INSERT ON ordem_compra_fio_lancamentos`. R1's §23 bridge fires only
  `AFTER INSERT ON ordens_compra_fio` (initial value once); it never syncs
  later flat receipts. So Component A, reading the native cache (R1 §5.2),
  returns a stale `kg_recebido` after the first legacy receipt — R1 §5.5's
  "fully reachable and correct" claim was false. **Corrected (new §30):**
  Component A becomes inert until `canonical_active` (raises
  `listar_compat_inativo`/55000, mirroring the installed canonical reader),
  symmetric with Component B; the app falls back to the flat reader during
  `legacy_active`, byte-identical to today.
- **Finding 2 — the live bridge breaks the legacy delete/reinsert flow.**
  `ordem_compra_item_compat_fio.ordens_compra_fio_id` FK has no `ON DELETE`
  clause (`db/67` L427) and the mapping is immutable (L433). `op-persistir.js`'s
  legacy branch deletes-then-reinserts flat rows by `op_id` (L250 delete, L255
  insert) on every `aberta` save. After the R1 bridge maps a new row, the next
  re-save's delete is FK-blocked — applying `db/76` alone would break an
  existing legacy flow. **Corrected:** the bridge is withdrawn in full (§31);
  without it, no FK blocks the flow and the legacy path is byte-unchanged.
- **Finding 3 — the bridge/backfill make `db/75`'s cutover impossible
  (decisive).** `db/75`'s snapshot hard-codes `IF v_source_count <> 51 THEN
  RAISE EXCEPTION 'snapshot_mapping_count_mismatch'` (L566), counting only
  compat-mapped rows (join L514–517); §R.29.4 and schema §13.15.3 fix
  51 mappings / 39 headers / 44 ledger lines / 20,221.280 kg / 405.980 kg
  excess. R1's bridge and one-time backfill both grow the mapping count beyond
  51, breaking the cutover — while R1 §8.3 forbids `db/76` from touching
  `db/75`. A genuine dynamic-vs-fixed-corpus contradiction. **Corrected (new
  §31/§32):** the bridge and the backfill are both withdrawn; the contract
  binds definitively to **FIXED corpus** (the only executable choice that keeps
  `db/76` off `db/75`), and re-scopes the compat-mapping gap — correcting R1
  §28.2's "CLOSED" claim — as a real-cutover/C3D completeness precondition with
  two named, separately-authorized freeze options (block new legacy flat rows;
  or re-baseline the cutover corpus/counts), neither authorized here.
- **Corrected `db/76` manifest (new §33.1):** exactly two new functions
  (Component A inert-until-`canonical_active`, item×OP grain; Component B
  inert-until-`canonical_active`, import-floor reversal) plus one additive
  `CHECK`-constraint extension. **No bridge trigger, no backfill, no
  `ordem_compra_item_compat_fio` row, no `db/75`/`db/67` object touched** —
  strictly smaller than R1's manifest.
- **Contract sections corrected:** R2 banner after §0; appended §§29–33
  (three-finding evaluation; Component A activation regime; bridge+backfill
  withdrawal; binding fixed-corpus decision; corrected manifest/residual
  debts/status). §§1–28 preserved as authored; §5.5, §23, §27.2 items 3–4, and
  §28.2's "gap CLOSED" claim explicitly superseded.
- **Contract status unchanged:** `STATUS: PROPOSED / AWAITING SUPERVISOR
  ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED`; no requirement `SATISFIED`.
  `PROJECT_STATE.md` `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; the
  `NEXT_AUTHORIZABLE_ACTION` value is factually unchanged (still supervisor
  review of this contract, now its R2-corrected form), so
  `PROJECT_STATE.md`/`AGENT_HANDOFF.md`/the traceability matrix were **not**
  touched — nothing owned there changed.
- **Documentation-only manifest:**
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  and this ledger only. Lifecycle §R.29, schema §13.15–13.17, the requirement
  registries, the traceability matrix, the spec-custody validator, and the
  byte-identical wrappers `CLAUDE.md`/`AGENTS.md` are unchanged.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff
  --check` clean; `git diff --cached --check` clean; the committed manifest
  matches exactly the two documentation-only paths above.
- **Exact accounting subject:** `docs: forward-correct C3C-B DB prerequisites R2`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR REVIEW`.
- **NEXT_AUTHORIZABLE_ACTION:** `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1-SUPERVISOR-REVIEW`
  — read-only supervisor review of the **R2-corrected** database-prerequisites
  contract. Neither `PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation is
  authorized; no phase chains automatically.

## 2026-07-20 — C3C-B-DB-PREREQ CONTRACT RATIFICATION CLOSEOUT — R3 DOCUMENTARY FORWARD CORRECTION + SUPERVISOR ACCEPTANCE — DONE / LOCALLY VERIFIED

- **Append-only forward correction + acceptance (`FORWARD_CORRECTION` per
  `docs/governance/DOCUMENTATION_MODEL.md` §19).** Records supervisor acceptance
  of the R2 architecture of
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` and
  reconciles the stale proposed-delta/rollback/requirement wording that R2 left
  in the append-only earlier sections. History is not rewritten; the new §34
  governs on conflict. Documentation-only — no product, SQL, database, Supabase,
  staging, production, deployment, activation, cutover, remote, or push action.
- **Entry checkpoint:** branch `dev`, HEAD
  `5971ed50d1a587fc042bdea26a4ee04de6cd323b`, parent
  `971ec1256488755b99c6c5e53e3a601c07677713`, empty index, preserved residue
  modified `.gitignore` only — matched the expected baseline exactly. Local
  `staging/dev` tracking ref equalled HEAD (no fetch performed; none authorized).
- **Independent premise audit (recorded).** A strict read-only architectural
  premise audit verified the R2 premises against the installed `db/67`–`db/75`
  objects and the live `js/screens/*` writers: FIXED corpus is a
  historical-snapshot binding whose re-baseline is a deferred,
  explicitly-authorized option (§32.2); both components are
  inert-until-`canonical_active` (§§30/22); Component A's population is the
  compat-mapped migrated corpus (not every flat legacy order); and corpus
  completeness/freeze/stranded-row diagnosis is owned by the real-cutover/C3D
  band (§32/§33.3). No premise required redesign.
- **Broad blocking interpretation withdrawn.** The proposed mandatory
  `UNMAPPED_HEADER_BEARING_LEGACY_ROWS = 0` gate on `db/76` is **not adopted** —
  it is out of this contract's scope (a real-cutover/C3D completeness
  precondition, satisfiable by freeze plus re-baseline/backfill or a documented
  exclusion, not a `db/76` gate). Remaining review items are classified
  **documentary** (stale §13.1/§13.2 proposed deltas, §17 rollback text, §4/§0
  population phrasing — all superseded by R2 and reconciled in §34) or
  **later-cutover scope** (stranded-row diagnosis, freeze, re-baseline). None
  blocks the contract architecture.
- **Contract correction (new §34; machine STATUS marker updated).** §34.1
  verdict `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET
  AUTHORIZED`; §34.2 corrected proposed `§R.29.7`
  (inert-unless-`canonical_active`; `listar_compat_inativo`/55000;
  `recebimento_compat_inativo`; PONR participation; admin-only LIFO decrease;
  imported-balance floor; item×OP grain; fixed-corpus bind; completeness
  deferred) — proposed text only, not applied; §34.3 corrected proposed
  `§13.18` (additive `idempotency_namespace`/`comando_tipo`; no
  bridge/backfill/row/`db/67`/`db/75` change) — proposed text only; §34.4
  rollback = drop two functions + restore two `CHECK`s, no backfill rows,
  corrected test contract; §34.5 Component A population = every compat-mapped
  legacy order in the qualified/migrated cutover corpus; §34.6 completeness
  ownership = real-cutover/C3D, no `db/76` `UNMAPPED=0` gate, freeze alone does
  not remediate already-stranded rows; §34.7/§34.8 authorization boundary and
  next action. §§0–33 preserved verbatim.
- **Normative files unchanged.** `§R.29.7`/`§13.18` remain **proposed** text
  inside the contract; formal application to
  `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.29 and
  `PEDIDO_OP_SCHEMA_CONTRACT.md` (a separate `NORMATIVE_CHANGE`) remains a
  prerequisite to `PHASE-C3C-B-DB-PREREQ` implementation authorization. Lifecycle
  §R.29, schema §13.15–13.17, the requirement registries, the spec-custody
  validator, and the byte-identical `CLAUDE.md`/`AGENTS.md` are unchanged.
- **Files materially changed (this pass):**
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  (new §34 + STATUS marker); `PROJECT_STATE.md` (next action, governance status,
  accepted-phase index); this ledger; `AGENT_HANDOFF.md` (next-action /
  continuity); `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (contract-reference, `OC-C3-COMPAT-001` residual, accounting subject);
  `docs/DOCUMENTATION_INDEX.md` (contract status). `PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  intentionally untouched (append-only historical log; live state owned by
  `PROJECT_STATE.md`; the C3C-B→DB-PREREQ→C3D→real-cutover sequence is unchanged).
- **State transition:** `NEXT_AUTHORIZABLE_ACTION`
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1-SUPERVISOR-REVIEW` →
  `PHASE-C3C-B-DB-PREREQ-IMPLEMENTATION-AUTHORIZATION`.
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; no requirement marked
  `SATISFIED`; `db/76` does not exist.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `node scripts/validate-spec-custody.mjs --self-test` all PASS; `git diff
  --check` clean; `git diff --cached --check` clean; the committed manifest
  matches exactly the six documentation-only paths above.
- **Exact accounting subject:** `docs: ratify C3C-B DB prerequisites architecture`.
- **Status after this commit:** `DONE / LOCALLY VERIFIED — DOCUMENTATION-ONLY
  RATIFICATION`.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C-B-DB-PREREQ-IMPLEMENTATION-AUTHORIZATION`
  — architect decision to authorize `PHASE-C3C-B-DB-PREREQ` implementation
  (which must first obtain the §34.2/§34.3 normative application). Neither
  `db/76`, `PHASE-C3C-B-DB-PREREQ`, nor `PHASE-C3C-B` implementation is
  authorized; no phase chains automatically; no push authorized.

## 2026-07-20 — C3C-B-DB-PREREQ RATIFICATION FINALIZATION — DOCUMENTARY FORWARD CORRECTION — DONE / LOCALLY VERIFIED

- **Append-only forward correction (`FORWARD_CORRECTION` per
  `docs/governance/DOCUMENTATION_MODEL.md` §19).** Corrects three residual
  documentary inconsistencies left by the `c68f89dd79e565cec09673fa10254bdaec606e77`
  ratification closeout. The R2 architecture accepted by that closeout is
  **unchanged and remains accepted** — this pass does not reopen or reassess it.
  Documentation-only — no product, SQL, database, migration, test, environment,
  or normative-file change.
- **Entry checkpoint:** branch `dev`, HEAD
  `c68f89dd79e565cec09673fa10254bdaec606e77`, local `staging/dev` tracking ref
  equal to HEAD, preserved residue modified `.gitignore` only — matched the
  expected baseline exactly.
- **Correction 1 (contract §34.7):** the LIFO reversal rule, legacy eligibility
  gate, item×OP grain, activation regime, fixed corpus, and real-cutover/C3D
  ownership of freeze/re-baseline are now recorded as **ratified and frozen**
  by §34, not as items requiring a further architectural ratification pass.
  Only two items remain pending: formal normative application of the
  corrected `§R.29.7`/`§13.18` deltas, and explicit implementation
  authorization.
- **Correction 2 (traceability `Authorization boundary`):** the stale
  `PROPOSED` characterization of the database-prerequisites contract is
  removed; it now records the contract as **ACCEPTED**
  (`ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT`), `OC-C3-COMPAT-001` remaining
  `BLOCKED`, and the remaining sequence (normative application →
  implementation authorization → `PHASE-C3C-B-DB-PREREQ` implementation →
  later `PHASE-C3C-B` application adaptation). Requirement ownership and
  normative anchors in the matrix table are unchanged.
- **Correction 3 (`AGENT_HANDOFF.md`):** `OC-C3-COMPAT-001` changed from
  `PLANNED` to `BLOCKED`, recording that the database-prerequisites contract
  is already accepted and the requirement remains blocked pending normative
  application, authorization, and implementation.
- **Files materially changed (this pass):**
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`;
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`; `AGENT_HANDOFF.md`; this
  ledger. No other file modified or committed.
- **State unchanged:** `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; no
  requirement marked `SATISFIED`; `db/76` does not exist.
- **Local verification:** `node scripts/validate-spec-custody.mjs` PASS;
  `git diff --check` clean; `git diff --cached --check` clean; the committed
  manifest matches exactly the four documentation-only paths above.
- **Exact accounting subject:** `docs: finalize C3C-B DB prerequisites ratification`.
- **Status after this commit:** `DONE / LOCALLY VERIFIED — DOCUMENTARY
  FINALIZATION`.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C-B-DB-PREREQ-IMPLEMENTATION-AUTHORIZATION`
  — unchanged. Neither `db/76`, `PHASE-C3C-B-DB-PREREQ`, nor `PHASE-C3C-B`
  implementation is authorized; no phase chains automatically; no push
  authorized by this entry.

## 2026-07-20 — PHASE-C3C-B-DB-PREREQ IMPLEMENTATION — IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** architect authorization of `PHASE-C3C-B-DB-PREREQ` implementation
  (medium risk, `LOCAL_ONLY`). Also authorized the normative application of
  contract §34.2 → lifecycle `§R.29.7` and §34.3 → schema `§13.18` (removing the
  "proposed" designation).
- **Entry checkpoint:** branch `dev`, HEAD
  `f18346f9fb5bf181945c75896e32535a96ddd92e`, local `staging/dev` tracking ref
  equal to HEAD, preserved residue modified `.gitignore` only — matched the
  expected baseline exactly.
- **Migration created (exactly one):** `db/76_ordem_compra_c3c_b_db_prerequisites.sql` —
  (1) `public.listar_ordens_compra_fio_compat(UUID, BIGINT)` (Component A: canonical
  order-catalog projection, inert until `canonical_active` via
  `RAISE 'listar_compat_inativo' 55000`, item grain and aggregated item × OP grain,
  admin/supplier scoping, pending/zero-receipt survival); (2)
  `public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT)`
  (Component B: atomic legacy receipt-intent adapter, inert until `canonical_active`
  via `recebimento_compat_inativo`, absolute-delta under lock, increase fan-out +
  explicit excess, deterministic LIFO admin-only decrease, imported-balance
  immutable floor, PONR participation on increase); (3) additive extension of the
  `idempotency_namespace` `CHECK` constraints
  (`ordem_compra_recebimentos_c3a_namespace_check` and
  `ordem_compra_recebimentos_c3c_hash_check`) to admit
  `'legacy_compat_receipt_v1'`. No bridge trigger, no backfill, no
  `ordem_compra_item_compat_fio` row, no `db/67`/`db/75` object modification, no
  product/UI/JS/HTML/CSS change.
- **R3 shape-guard correction (architect ruling, contract §35):** implementation
  surfaced that the installed `trg_native_lancamento_shape_guard` (db/71 L95–98,
  db/74 L802–808) couples the header's `comando_tipo` to each ledger line's `tipo`,
  which makes R1 §6.9/§34.3's `comando_tipo='recebimento_compat'` header
  unimplementable without modifying that guard (forbidden by the frozen manifest).
  The architect ruled: reuse the native command types (`recebimento` for
  increase/no-op, `estorno` for decrease); carry compat identity solely in
  `idempotency_namespace='legacy_compat_receipt_v1'`; introduce/admit no
  `recebimento_compat`; leave the `comando_tipo` `CHECK` and the shape guard
  unchanged; `db/76` therefore extends the `idempotency_namespace` `CHECK` only.
  Applied within this authorized phase; the corrected `§13.18` reflects it, and
  `§R.29.7` records the native-command-type reuse.
- **Normative application:** `§R.29.7` added to
  `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (from §34.2, "proposed" removed, plus
  one clarifying sentence per §35); `§13.18` added to
  `PEDIDO_OP_SCHEMA_CONTRACT.md` (from §34.3, "proposed" removed, corrected to the
  idempotency_namespace-only extension per §35). Neither registry gained a new
  requirement ID; no requirement marked `SATISFIED`.
- **Tests created (exactly three):**
  `tests/ordem-compra-c3c-b-db-prerequisites.smoke.js` (static structural, 14
  assertions — **PASS**);
  `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql` and
  `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs` (authored to the
  §34.4 test contract; **not executed** — see verification scope).
- **Verification (honest, `LOCAL_ONLY`):** static smoke suites PASS 49/49 (the new
  suite + the required static-smoke regressions
  `ordem-compra-c3c-inactive.smoke.js`, `ordem-compra-native-receipt.smoke.js`,
  `ordem-compra.smoke.js`); the concurrency file parses under `node --check`. The
  DB-backed files (the new `…integration.sql`/`…concurrency.mjs` and the C3C-A
  `…integration.sql`/`…concurrency.mjs` regressions) were **not executed**: the
  local PostgreSQL 18.4 cluster crash-loops on startup with a Windows
  shared-memory reservation failure (`could not reserve shared memory region …
  error code 487`), so no backend connection survives. Supabase execution is
  outside this phase's `LOCAL_ONLY` authorization and was not used. Reported as
  unavailable, not inferred. `node scripts/validate-spec-custody.mjs` PASS;
  `git diff --check` and `git diff --cached --check` clean.
- **State:** `LAST_ACCEPTED_PHASE` remains `PHASE-C3C-A`;
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; `ACCEPTED_CHECKPOINT`
  unchanged (`dd631299f410027ebb23b006aa5e380ad460aefa`). The phase is **not
  accepted**; no dependent C3C-B requirement is `SATISFIED`.
- **Environment boundary held:** no Supabase write, staging application,
  deployment, activation, cutover, snapshot/import, ACL-closure invocation, `main`,
  `origin`, or `production` remote. One authorized fast-forward push to
  `staging/dev` only.
- **Exact accounting subject:** `feat: add C3C-B database prerequisites`.
- **Status after this commit:** `IMPLEMENTED / LOCALLY VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW` — a
  read-only supervisor review of this implementation. Supervisor acceptance,
  staging validation/application, C3C-B application adaptation, C3D, activation,
  cutover, and any further push remain unauthorized; no phase chains automatically.

## 2026-07-20 — PHASE-C3C-B-DB-PREREQ DB-BACKED VALIDATION COMPLETION — IMPLEMENTED / LOCAL DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** architect authorization of `VALIDATION CONTINUATION — ISOLATED
  LOCAL POSTGRES` (medium risk, `LOCAL_ONLY`), to complete the DB-backed
  validation the prior entry reported unavailable. No architecture reopened; no
  Supabase or staging access; no push beyond the authorized `staging/dev`
  fast-forward.
- **Entry checkpoint:** branch `dev`, HEAD
  `a0038db3c2edc4954829a6fb4b1b33ae494c4f41`, local `staging/dev` tracking ref
  equal to HEAD, preserved residue modified `.gitignore` only — matched exactly.
- **Runtime:** the host's scoop PostgreSQL 18.4 cluster remained unusable (same
  Windows shared-memory crash). Docker, Podman, and WSL were absent. A
  disposable, isolated local PostgreSQL 18.4 cluster was initialized via
  `initdb`/`pg_ctl` under the system temp path (outside the repository and
  outside the host's broken `PGDATA`), on a distinct port, with `autovacuum =
  off` and reduced parallel workers; it ran stably for the session. A
  Supabase-compatibility shim (`auth` schema/`uid()`/`role()`/`users`, roles
  `anon`/`authenticated`/`service_role`, `extensions`/`pgcrypto`) was bootstrapped
  in the disposable database only — not part of the repository's migration
  history, not referenced by any tracked file.
- **Schema apply:** the full `db/01`…`db/76` sequence applied cleanly, in order.
  `db/67`'s own self-check requires the exact historical 64-row legacy
  `ordens_compra_fio` corpus (27/12/13/12 classification) to already exist; a
  synthetic fixture matching only that classification shape (not the deeper
  historical aggregate values) was inserted immediately before `db/67`, external
  to any tracked migration file, solely to let the unmodified `db/67` apply and
  self-verify. `db/76` reapplied alone afterward with no error and no duplicate
  constraint (idempotency proven).
- **DB-backed test results:** `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql`
  — **PASS** (`C3C_B_INTEGRATION_PASS`), covering inactive/active-only behavior
  for both components, item and item×OP grains, the full admin/supplier/anon
  role matrix, absolute increase/equal/decrease with PONR participation,
  deterministic LIFO reversal, the imported-balance immutable floor, exact and
  conflicting idempotency, unmapped-row denial, the additive-constraint proof,
  and a reduced-manifest rollback rehearsal proving the legacy delete/reinsert
  flow unbroken.
  `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs` — **PASS**
  (`C3C_B_CONCURRENCY_PASS`), proving genuine `FOR UPDATE` serialization via
  `pg_blocking_pids` and fresh-total re-evaluation after lock grant (holder
  40→55 kg, subject unblocks and targets 80 kg absolute, final cache exactly 80
  kg — a stale read would have produced 95 kg); `pg_stat_database.deadlocks`
  unchanged across the run.
- **Rollback rehearsal (standalone, persisted):** confirmed via direct query
  zero bridge triggers, zero `native_bridge`-origin compat rows, and zero
  `legacy_compat_receipt_v1` headers existed pre-rollback (nothing required
  reversal); executed and committed the rollback (both functions dropped, both
  prior `idempotency_namespace`/hash-shape `CHECK` definitions restored
  byte-for-byte, verified via `pg_get_constraintdef`); reapplied `db/76`; reran
  both DB-backed tests — **both PASS again**.
- **Defect found and corrected in `db/76` (one, in-scope):** Component A
  (`listar_ordens_compra_fio_compat`) used a bare `status` column reference in
  its activation check, ambiguous with its own `RETURNS TABLE` OUT column of the
  same name (PL/pgSQL `42702` on every call). Fixed with a
  `v_cutover public.ordem_compra_cutover%ROWTYPE` variable and
  `v_cutover.status`/`v_cutover.read_authority` field access — the identical
  pattern Component B and `db/75`'s own wrappers already use. No other object,
  grant, or semantic changed; the frozen architecture and manifest (exactly two
  functions plus one additive `CHECK`) are unaffected.
- **Defects found and corrected in the three C3C-B test files (several,
  in-scope, no product/`db/67`/`db/75` change):** an import-line fixture
  violating `db/73`'s date/actor constraints (both `…integration.sql` and
  `…concurrency.mjs`); a rollback rehearsal originally sequenced after
  productive Component B writes, fixed with a `SAVEPOINT`/`ROLLBACK TO` pair
  reproducing the contract's actual pre-activation rollback scenario
  (`…integration.sql`); a PONR check reading a fully-revoked table under the
  wrong role, fixed with `RESET ROLE` (`…integration.sql`); a raw row lock
  attempted under a role with only `SELECT` grant, fixed by running it as the
  cluster owner (`…concurrency.mjs`); a transaction-local (`TRUE`) `set_config`
  silently reverting between separately-transacted interactive-`psql`
  statements, fixed with session-scoped (`FALSE`) persistence
  (`…concurrency.mjs`); and a genuine deadlock from an incomplete pre-lock order,
  fixed by matching Component B's own header-then-item lock order
  (`…concurrency.mjs`).
- **C3C-A DB-backed regressions — genuine, pre-existing, unrelated limitation:**
  `tests/ordem-compra-c3c-inactive.integration.sql` and
  `-concurrency.mjs` could not be executed against any synthetic corpus — both
  assert exact real historical aggregate values (39 headers, 44 lines, 20,221.280
  kg, 405.980 kg) tied to the actual `ucrjtfswnfdlxwtmxnoo` corpus, fixed at
  `PHASE-C3C-A`'s own authoring and unrelated to `db/76`. Reported as
  unavailable, not inferred. The C3C-A **static** smoke regression (data
  independent) ran and passed as part of the combined 49/49 static suite.
- **Verification:** `node scripts/validate-spec-custody.mjs` PASS; `git diff
  --check` clean; `git diff --cached --check` clean; the committed manifest
  matches exactly the changed-file list for this pass.
- **State:** `LAST_ACCEPTED_PHASE` remains `PHASE-C3C-A`;
  `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; `ACCEPTED_CHECKPOINT`
  unchanged (`dd631299f410027ebb23b006aa5e380ad460aefa`). The phase is **not
  accepted**; no dependent C3C-B requirement is `SATISFIED`.
- **Environment boundary held:** no Supabase write, staging application,
  deployment, activation, cutover, snapshot/import, ACL-closure invocation,
  `main`, `origin`, or `production` remote. One authorized fast-forward push to
  `staging/dev` only.
- **Exact accounting subject:** `test: complete C3C-B DB prerequisites validation`.
- **Status after this commit:** `IMPLEMENTED / LOCAL DB VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`.
- **NEXT_AUTHORIZABLE_ACTION:** `PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW` —
  unchanged. Supervisor acceptance, staging validation/application, C3C-B
  application adaptation, C3D, activation, cutover, and any further push remain
  unauthorized; no phase chains automatically.

## 2026-07-20 — PHASE-C3C-B-DB-PREREQ SUPERVISOR ACCEPTANCE — CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING DATABASE

- **Order:** documentation-only supervisor-acceptance closeout. Persists the
  supervisor's acceptance of `PHASE-C3C-B-DB-PREREQ` as recorded in
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  §§35–36 (implementation + DB-backed validation completion). No technical
  validation is repeated by this pass; no `db/76`, test, environment,
  runtime, product, or configuration file is touched.
- **Entry checkpoint:** branch `dev`, HEAD
  `34d7d231d0875093bc2091f385c61cf35fa0b5cb`, parent
  `a0038db3c2edc4954829a6fb4b1b33ae494c4f41`, local `staging/dev` tracking ref
  equal to HEAD, preserved residue modified `.gitignore` only — matched the
  expected baseline exactly.
- **Disposition recorded:** `PHASE-C3C-B-DB-PREREQ` is
  `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB VERIFIED / NOT APPLIED TO STAGING
  DATABASE`. Validation occurred only in a disposable, isolated local
  PostgreSQL 18.4 cluster (§36.1); `db/76_ordem_compra_c3c_b_db_prerequisites.sql`
  has **not** been applied to any staging database. `tests/ordem-compra-c3c-inactive.integration.sql`
  and `tests/ordem-compra-c3c-inactive-concurrency.mjs` remain **nonblocking
  C3C-A fixture debt** (§36.6) — a pre-existing, unrelated limitation, not a
  `db/76` defect, and not repaired by this acceptance.
- **What this acceptance does NOT do:** it does not mark `OC-C3-READ-001`,
  `OC-C3-WRITE-001`, or `OC-C3-COMPAT-001` `SATISFIED`; it does not authorize
  staging validation/application of `db/76`, deployment, activation, real
  snapshot/import, fence transition, read switch, final ACL-closure
  invocation, cutover, C3D, C4, C5, production access, Supabase writes,
  `main`, or `origin`/`production` remote mutation; it does not chain
  `PHASE-C3C-B` application-adaptation implementation, which remains a
  separate, unauthorized authorization.
- **Files materially changed (this pass, documentation-only):**
  `PROJECT_STATE.md`; `AGENT_HANDOFF.md`; `docs/DOCUMENTATION_INDEX.md`;
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  (§37 appended, top `STATUS` marker updated); `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`;
  this ledger. No `db/*.sql`, test, product, runtime, or configuration file
  modified. The pre-existing unstaged `.gitignore` residue is preserved
  byte-for-byte and excluded from this commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ`.
  `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. No phase chains
  automatically.
- **Validation (documentation-proportional only):** `git diff --check` clean;
  `node scripts/validate-spec-custody.mjs` PASS. No technical, database,
  environment, or runtime test suite was rerun.
- **Exact accounting subject:** `docs: accept C3C-B DB prerequisites`.
- **Status after this commit:** `CLOSED / TECHNICALLY ACCEPTED / LOCAL DB
  VERIFIED / NOT APPLIED TO STAGING DATABASE`.
- **NEXT_AUTHORIZABLE_ACTION:** a separately authorized staging
  validation/application of `db/76_ordem_compra_c3c_b_db_prerequisites.sql`
  (no existing canonical phase/action ID names this step in the repository;
  recorded descriptively, per architect instruction, without creating
  architecture or authorizing execution). Only after that separate
  authorization does the later `PHASE-C3C-B` application-adaptation lot
  become authorizable. No push beyond the authorized `staging/dev`
  fast-forward is authorized by this entry.

## 2026-07-20 — DEVELOPMENT-DATABASE APPLICATION (db/75→db/76) — APPLIED / DEVELOPMENT DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE

- **Order:** controlled development/legacy-database application and validation of
  the accepted inactive C3C stack (`db/75_ordem_compra_c3c_inactive_cutover.sql`
  then `db/76_ordem_compra_c3c_b_db_prerequisites.sql`). Descriptive environment
  action — no existing canonical phase ID, none invented. **This entry records
  execution and verification, NOT supervisor acceptance (none has been issued).**
- **Entry checkpoint:** branch `dev`, HEAD
  `11cee2224b8c7c39ab939881b151a96281f2a85e`, local + remote `staging/dev` equal
  to HEAD, preserved residue modified `.gitignore` only (plus the untracked
  `.mcp.json` auth-setup artifact created at the user's request to point the
  Supabase MCP at `ucrjtfswnfdlxwtmxnoo`; never staged). Matched the expected
  baseline.
- **Target:** `ucrjtfswnfdlxwtmxnoo` (DEVELOPMENT / LEGACY DATABASE, formerly
  "staging") only. Production `bhgifjrfagkzubpyqpew` / `gqmpsxkxynrjvidfmojk`,
  `main`, `origin`, the production remote, Vercel, deployment, activation, and
  cutover were neither accessed nor executed.
- **Applied (byte-exact, via Supabase MCP `apply_migration`, no `execute_sql`
  for DDL):** `db/75` (SHA-256 `707012a5…1fd5b171`) as version `20260720234958`;
  `db/76` (SHA-256 `8ab2a80e…363c1d2d4`) as version `20260720235820`.
  Reproductions were hash-verified byte-identical to the repository files before
  application. Migration history now ends `74 → 75 → 76`, exactly one entry each.
- **Verified inert (development DB):** cutover singleton `legacy_active`/`flat`,
  `cutover_generation` null, every snapshot/import/final-ACL/activation/
  `productive_receipt_started_at` field null; `db/75` full inactive foundation
  installed (guard triggers on 8 tables + command-state guard, renamed
  `_c3c_*_impl`, inactive wrappers returning `recebimento_canonico_inativo`,
  normalized reader raising `canonical_reader_inactive`, owner-only cutover
  commands `postgres`-only, legacy `ordens_compra_fio` grants byte-identical to
  pre-application); `db/76` two functions installed
  (`listar_ordens_compra_fio_compat` STABLE raising `listar_compat_inativo`,
  `registrar_recebimento_ordem_compra_fio_compat` VOLATILE returning
  `recebimento_compat_inativo`, both SECURITY DEFINER / `search_path=''` / owner
  `postgres` / `authenticated` EXECUTE) plus the additive
  `idempotency_namespace` extension of both `…_c3a_namespace_check` and
  `…_c3c_hash_check`; `comando_tipo` unchanged (no `recebimento_compat`); no
  bridge trigger, no backfill, no `native_bridge` mapping
  (`ordem_compra_item_compat_fio` = 51). Seven business-table fingerprints
  byte-for-byte unchanged pre/post; receipt/ledger/movement tables remain empty.
- **Validation run (PASS):** `node scripts/validate-spec-custody.mjs` PASS;
  `git diff --check` / `git diff --cached --check` clean; static smoke suite
  49/49 PASS; both concurrency files parse (`node --check`); inert behavior of
  all four functions validated directly on the real corpus.
- **Validation NOT RUN:** the four DB-backed tests
  (`…c3c-b-db-prerequisites.integration.sql`/`-concurrency.mjs`,
  `…c3c-inactive.integration.sql`/`-concurrency.mjs`) — each exercises the
  explicitly prohibited fence/snapshot/import/activation/read-switch/productive-
  receipt machinery (C3C-A calls `fence_and_snapshot` + `import_and_reconcile`;
  C3C-B flips to `canonical_active` and performs productive writes) and/or needs
  a direct multi-session connection the MCP path lacks; accepted local PASS
  (contract §36.3) stands and was not destructively duplicated.
- **Findings:** 13 unmapped post-REFUND-A legacy flat rows (`ordens_compra_fio`
  ids 153–165, all `rascunho`/`pendente`/`nao_recebido`, `kg_recebido` null,
  OPs 97/98/99) — DOCUMENTARY real-cutover/C3D completeness finding, violating no
  migration precondition. C3C-A DB-backed fixture debt: the real corpus is now
  present but the tests still require the prohibited activation/import path, so
  they remain NOT RUN, nonblocking, deferred to a future authorized cutover
  rehearsal.
- **Files materially changed (this pass, documentation-only):**
  `PROJECT_STATE.md`; `AGENT_HANDOFF.md`;
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  (§38 appended, top `STATUS` marker updated);
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`;
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`; this ledger. No
  `db/*.sql`, test, product, runtime, or configuration file modified;
  `.gitignore` and `.mcp.json` are excluded from the commit.
- **State after this pass:** `LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ`.
  `ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. No dependent `OC-C3-*`
  requirement is `SATISFIED`. No phase chains automatically.
- **Validation (documentation-proportional):** `git diff --check` /
  `git diff --cached --check` clean; `node scripts/validate-spec-custody.mjs`
  PASS.
- **Exact accounting subject:** `docs: record C3C database development application`.
- **Status after this commit:** `APPLIED / DEVELOPMENT DB VERIFIED / AWAITING
  SUPERVISOR ACCEPTANCE`.
- **NEXT_AUTHORIZABLE_ACTION:** supervisor review/acceptance of this
  development-database application. Only after that acceptance does the later
  `PHASE-C3C-B` application adaptation become authorizable. Deployment,
  activation, real snapshot/import, fence transition, read switch, final
  ACL-closure invocation, cutover, C3D, C4, C5, production access, `main`, and
  `origin`/`production` remote mutation remain unauthorized; one fast-forward
  push to `staging/dev` records this closeout.


<!-- G28_LEDGER_SHADOW_PAYLOAD_END_7b9d4e3a -->
