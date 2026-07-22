# PHASE-C5 Material Phase Contract — Purchase-Order Emission

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C5
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED (closeout recorded in §25; C5-DOCUMENTATION-CLOSEOUT-R1, 2026-07-22 — supersedes the §23/§24 in-review dispositions; PROJECT_STATE.md is the sole current-state owner)

> **Role of this document.** This is a **material phase contract**, authored under
> `C4-CLOSEOUT-AND-C5-CONTRACT-R1` (Part 2) as **read-only repository
> reconciliation + documentation-only phase-contract authoring**. It does
> **not** authorize product implementation, database migration, environment
> mutation, staging application, deployment, activation, or push. It binds
> `OC-C5-EMISSION-001` to an exact functional scope, actor/state/action
> matrix, API ownership matrix, database-prerequisite boundary, file
> manifest, test manifest, visual contract, and hard stops, so a **future,
> separately authorized** implementation order has nothing left to infer.
> Per `docs/governance/DOCUMENTATION_MODEL.md` §19, authoring a `PROPOSED`
> contract of this kind is `READ_ONLY_RECONCILIATION` — no canonical
> mutation beyond this new file and its proportional index/traceability
> registration (§20).

---

## 0. Order authorization, entry checkpoint, and scope of this pass

- **Order:** `C4-CLOSEOUT-AND-C5-CONTRACT-R1`, Part 2 — read-only diagnosis +
  documentation-only `PHASE-C5` material-contract authoring, continuing
  immediately (same execution, no stop) after Part 1's `PHASE-C4` closeout
  commit. Explicitly does **not** authorize implementation.
- **Entry checkpoint (post-closeout baseline, this pass):**
  - Workspace: `D:\Programação\controle-tapetes-g28`; Git dir `.git` (normal
    repository).
  - Branch: `dev`. `HEAD`: `e657ec7b7ca98be522084474257c45d065f3a0f0` (the
    `docs: close C4 admin receipt UI` commit). `HEAD^`:
    `289b0cca66e9c057330a882f69da3476adf90469`.
  - `git status --short --untracked-files=all`: `M .gitignore`, `??
    .codex/config.toml`, `?? .mcp.json` — unchanged protected residue; none
    of the three paths opened, displayed, copied, modified, or staged.
  - `git diff --stat HEAD^..HEAD`: exactly the six files authorized for the
    C4 closeout (`AGENT_HANDOFF.md`, `PROJECT_STATE.md`,
    `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
    `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`,
    `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
    `docs/ledgers/G28_LEDGER.md`).
- **This pass's authorized output:** exactly one new file (this document)
  plus proportional updates to the documents enumerated in §20, and one
  local documentation-only commit. No push.

---

## 1. Dependencies read this pass

Per `docs/governance/AGENT_INSTRUCTIONS.md` §2 and the order's mandatory
canonical-reading list:

1. `docs/governance/AGENT_INSTRUCTIONS.md`, `PROJECT_STATE.md`,
   `AGENT_HANDOFF.md`, `CLAUDE.md`, `docs/DOCUMENTATION_INDEX.md`,
   `docs/governance/DOCUMENTATION_MODEL.md`,
   `docs/governance/SUPERVISION_PROTOCOL.md`,
   `docs/governance/CODE_HEALTH_RULES.md` (full, or all materially
   applicable sections — §7 size rule, §9 Supabase-write rule, §6
   screen-separation rule, cited below).
2. `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (full) —
   §R.7, §R.8, §R.16, §R.21.8/§R.21.9/§R.21.12/§R.21.13 (superseded, read
   for provenance), §R.22.5/§R.22.6/§R.22.7/§R.22.11/§R.22.12,
   §R.23.0/§R.23.8/§R.23.9, §R.24.10, §R.25.3/§R.25.8/§R.25.9/§R.25.10,
   §R.29.6/§R.29.7, §R.30, §R.31 registry.
3. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (full) — §6.2 update
   blocks referencing C5.
4. `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
   `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
   `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` (structural
   precedent — closest analog: an application/UI-adjacent material phase
   contract with an inert-writer risk), `docs/ledgers/G28_LEDGER.md` (tail).
5. `docs/architecture/UI_VISUAL_CONTRACT.md` (full) — confirmed no
   emission-specific clause exists (§10 below).
6. Product files: `js/screens/ordem-compra.js`,
   `js/screens/ordem-compra-data.js`, `js/screens/ordem-compra-render.js`,
   `js/screens/ordem-compra-events.js`,
   `js/screens/ordem-compra-receipt-data.js`,
   `js/screens/ordem-compra-receipt-render.js`,
   `js/screens/ordem-compra-receipt-events.js`,
   `js/screens/ordem-compra-distribuicao.js`,
   `js/screens/ordem-compra-receipt-cutover.js`,
   `js/screens/op-writes.js`, `js/router.js`, `js/boot.js`,
   `js/screens/common.js`, `index.html`; `js/screens/op-nova.js` (boundary
   check only, per the order).
7. Database: `db/65` through `db/76` (full sequential chain), specifically
   `db/66_ordem_compra_emitir_cancelar.sql`,
   `db/67_ordem_compra_refoundation_schema.sql`,
   `db/68_ordem_compra_native_draft_admin.sql`,
   `db/69_ordem_compra_preprod_allocation.sql`,
   `db/74_ordem_compra_hybrid_origin_forward_correction.sql` (§6 "Exact
   final execution ACL matrix" — the terminal grant statement),
   `db/75`/`db/76` (checked for absence of any further mutation).
8. Tests: `tests/ordem-compra.smoke.js`, `tests/ordem-compra-emitir-cancelar.smoke.js`,
   `tests/op-nova.smoke.js` (boundary — asserts the OP screen carries no
   inline emit/cancel actions).

---

## 2. Governing normative anchors — exact citations

| Anchor | Exact clause (verbatim or near-verbatim excerpt) |
|---|---|
| §R.22.5 (governing; replaces superseded §R.21.8) | `public.emitir_ordem_compra(p_ordem_id BIGINT) RETURNS JSONB` — "created by the migration but granted to no client role... rejects emission unless ALL hold: the order is native (`legado=FALSE`); `status_administrativo='rascunho'`; `fornecedor_id` present; ≥1 item; every item has ≥1 allocation; for every item `SUM(active allocation kg) = item.kg_pedido`; every allocation belongs to a need with matching Pedido ownership; every allocation satisfies the immutable material/color identity... On success it freezes issuance fields, sets lifecycle states atomically, inserts one `ordem_compra_eventos` row using `ordem_compra_id`... Post-emission immutability of items/allocations is enforced by construction... Because allocation is inactive in REFUND-B1, no ordinary UI-created draft can satisfy this precondition — intentional." |
| §R.22.6 | "The dedicated screen must not expose a working emit action in REFUND-B1. The read model returns, for ordinary native drafts, `pode_emitir=false` and `bloqueio_emissao='distribuicao_necessidades_pendente'`. The screen may render a disabled action showing that reason, but must never call `emitir_ordem_compra`; no `authenticated` EXECUTE grant exists on it." |
| §R.23.0 | "Phase C must establish native receipt authority before any client-facing native emission may be activated. The former PRE-PROD-B emission step becomes a post-Phase-C activation gate, not the immediate successor of PRE-PROD-A." |
| §R.23.8 | `obter_ordem_compra_admin` exposes `distribuicao_completa`, `pronta_para_emissao`, `pode_emitir=false`, `bloqueio_emissao` — `'recebimento_nativo_ainda_inativo'` when distribution is complete (block is Phase-C receipt), `'distribuicao_necessidades_pendente'` when distribution is incomplete. "The server computes readiness; it does not authorize emission." |
| §R.23.9 | "`db/69` does not grant `emitir_ordem_compra`... does not wire the emit button, does not call the emission RPC from application code... The UI renders Emitir as disabled; when distribution is complete its explanation states that emission awaits native receipt activation (Phase C), not that distribution is incomplete." |
| §R.24.10 | Binding delivery sequence: "C4: admin receipt UI... C5: separate native emission activation gate. Native emission stays inactive and ungranted until C1 through C4 are each accepted. No phase chains automatically." |
| §R.25.9 | "C3 owns cutover/import/readers/ACL; C4 owns admin UI and any later supplier UI; C5 is the separate emission gate. No phase chains." |
| §R.31 registry | `OC-C5-EMISSION-001` → anchor `§R.24.10`, owning phase `C5`, requirement text "Keep native emission behind the separate post-C4 gate." |
| §R.7 | Acceptance lifecycle: "config-gated at emission (`nao_aplicavel` when `exige_aceite=false`; `pendente` when true), then `aceita`/`rejeitada` by explicit decision... receipt blocked until `status_aceite IN ('nao_aplicavel','aceita')`." |
| §R.8 | "Canonical native receipt is permitted only when `status_administrativo='emitida'`... and `status_aceite IN ('nao_aplicavel','aceita')`... Receipt before issuance is prohibited." |
| §R.25.3 | Native receipt RPC eligibility: "native/non-legacy, `status_administrativo='emitida'`, not cancelled, and `status_aceite IN ('nao_aplicavel','aceita')`; draft, acceptance-pending, rejected, cancelled, legacy... reject." |
| §R.16 | "Transition modals contain actions only... Every entity lives on its own dedicated screen — the purchase order's home is its detail screen (route `#/ordens-compra/:id`)." |
| §R.22.11 | "Routes `#/ordens-compra/:id` (detail) and `#/ordens-compra` (list). The full entity must not reside in `op-nova.js`... removal of the inline emit/cancel entity actions... Transition modals hold actions only; the entity + its item collection live on the dedicated screen." |
| Schema contract §6.2 | "Cutover/import/readers/flat ACL are C3; UI is C4; emission remains inactive until the later C5 gate." |

**Correction of a premise in the order.** The order's "OUT OF SCOPE" framing
implies a "supplier UI may reuse the same [emission] RPC" clause attached to
C5. Direct re-reading of §R.24.10's five-item list (this pass) shows that
clause is attached to **item 4 (C4)** — "a later separately authorized
supplier UI may reuse the same RPC" refers to the **receipt** RPC, not
emission. §R.24.10's C5 line is the single sentence "C5: separate native
emission activation gate," with no supplier-reuse clause of its own. This
contract does not carry forward the mistaken attribution.

---

## 3. Current product-code inventory (facts, this pass)

Read in full; every claim below is a direct citation, not inference.

- **`js/screens/ordem-compra-render.js:165-177`** already renders a
  disabled "Emitir" button (`id: 'oc-emitir'`) with a static
  `disabled: true` literal and a `title` sourced from
  `BLOQUEIO_LABEL[o.bloqueio_emissao]`. It has **no `onclick` handler**.
  `var acoes = o.acoes || {};` (line 136) is read for `acoes.cancelar` only
  (line 152) — `acoes.emitir` is present on the server object (§4 below)
  but is **never read** by this file.
- **`js/screens/ordem-compra-data.js:83-101`**'s `loadOrdemDetail` calls
  `obter_ordem_compra_admin` (line 87) and stores the response envelope
  verbatim (`state.ordem = res.data.ordem || null;`, line 98) with no
  emission-specific handling.
- **`js/screens/ordem-compra-events.js`** (45 lines) exposes only a
  `cancelar` handler (line 32); it has no `emitir` handler.
- **`js/screens/ordem-compra.js:6-9`** carries a header comment stating
  emission is "installed-but-inactive (§R.22.5/§R.22.6) — the Emitir
  control is always disabled and never wired," consistent with the render
  module.
- **No file under `js/` calls `.rpc('emitir_ordem_compra'` or any
  emission-named RPC** (repo-wide grep, zero matches) — the feature has
  never been wired client-side.
- **`js/screens/ordem-compra-distribuicao.js:148-153`** already renders the
  `bloqueio_emissao` reason as a **downstream, read-only consequence** of
  distribution completeness (`obter_distribuicao_ordem_compra`), and
  explicitly documents (header, lines 12-13) that it "never authorizes
  emission." This existing view is the natural cross-link target for §11
  below — it must not be duplicated.
- **`status_aceite` is never read or rendered anywhere in
  `ordem-compra-render.js`/`ordem-compra-data.js`**, even though
  `obter_ordem_compra_admin` already returns it
  (`db/68_ordem_compra_native_draft_admin.sql:505`). The only UI surfaces
  that reference `status_aceite` today are the unrelated legacy OP-screen
  reader (`js/screens/op-nova.js:1116`) and the C4 receipt-rejection
  messages (`js/screens/ordem-compra-receipt-events.js:42-43`, which block
  *receipt*, not emission).
- **`js/screens/common.js`** (302 lines) is pure UI chrome — it contains
  **no** RPC-idempotency, error-classification, or transport-ambiguity
  helper of any kind. The only existing implementations of that pattern in
  this codebase are two independent, deliberately non-shared copies:
  `js/screens/ordem-compra-receipt-cutover.js` (`createAttemptTracker`,
  `isTransportAmbiguous`, lines 111-170) and
  `js/screens/ordem-compra-receipt-data.js` (`createReceiptAttemptTracker`,
  `isReceiptTransportAmbiguous`, lines 58-93), the latter's own header
  (lines 16-19) stating it is "a structurally INDEPENDENT re-implementation"
  that "NEVER imports, calls, or extends" the former. A C5 writer follows
  the same established precedent — a small local copy, not a new shared
  `common.js` helper (introducing a shared helper now would be an
  unauthorized refactor of `common.js`, outside this contract's scope).
- **Tests already assert the current inert state and must not silently
  regress:** `tests/ordem-compra.smoke.js` (tests 4-5, lines 204-231)
  assert the `oc-emitir` button exists, is `disabled === true`, has no
  click listener, and is disabled in the legacy case too; a future
  implementation order that wires the button must update these exact
  assertions, not delete or silently bypass them.
  `tests/op-nova.smoke.js` (tests 72, 76, lines 1595-1637) assert **zero**
  `/Emitir ordem|Cancelar ordem/i` buttons exist on the OP screen — this
  boundary must remain intact; C5 does not touch `op-nova.js`.
- **`index.html`** already wires all ten requested `ordem-compra*` files
  plus `op-writes.js`; no script tag is missing. (An unrelated, pre-existing
  load-order note — `ordem-compra-distribuicao.js` loads before
  `op-compra-regime.js`, contradicting that file's own header comment — is
  cosmetic, out of scope, and not touched here.)

---

## 4. Effective database contract (terminal, evidence-cited)

**Two distinct emission functions exist; they must not be conflated.**

| | `emitir_ordem_compra_fio(BIGINT)` | `emitir_ordem_compra(BIGINT)` |
|---|---|---|
| Defined | `db/66_ordem_compra_emitir_cancelar.sql:82-150` | `db/68_ordem_compra_native_draft_admin.sql:247-342` |
| Target | legacy flat `ordens_compra_fio` | native `ordem_compra`/`ordem_compra_item` |
| Redefined later? | No (never `CREATE OR REPLACE`d again through db/76) | No (never `CREATE OR REPLACE`d again through db/76) |
| Terminal grant | `authenticated` (from `db/66:152-155`, never revisited) | **nobody** — see below |

**`emitir_ordem_compra`'s terminal grant state.** `db/68:347-350` installs
it `REVOKE ALL FROM PUBLIC, anon, authenticated, service_role` with the
comment "INSTALLED BUT INACTIVE (§R.22.5): no client grant... PRE-PROD
grants EXECUTE after the allocation path and
`LIVE_ALLOCATION_T1_T2_TEST_PENDING` are resolved." `db/70:1202-1206`
restates the identical revoke. **`db/74_ordem_compra_hybrid_origin_forward_correction.sql:1171-1207`**,
under its own heading "6. Exact final execution ACL matrix" — the
migration chain's own stated terminal-ACL reconciliation for this function
family — restates `REVOKE ALL ... FROM PUBLIC, anon, authenticated,
service_role;` (lines 1192-1193) for `emitir_ordem_compra` with **no
accompanying `GRANT`**, in direct contrast to every sibling entry in the
same block (`cancelar_ordem_compra`, `registrar_recebimento_ordem_compra`,
`estornar_recebimento_ordem_compra`, `definir_alocacao_necessidade_compra_fio`,
`sincronizar_necessidades_compra_fio` — each gets a `GRANT EXECUTE ...
TO authenticated` immediately after its `REVOKE`). `db/75` and `db/76`
contain **zero** references to `emitir_ordem_compra`. **Terminal state:
EXECUTE is revoked from every role including `service_role`; the function
is unreachable from any PostgREST/RPC client surface**, independent of the
cutover singleton's state (the function body itself never references
`ordem_compra_cutover`/`canonical_active`/`legacy_active` — confirmed absent
by grep; the table postdates this function by three migrations and the
function is never amended afterward to add such a check).

**The allocation-writing precondition is separately, and just as
terminally, blocked.** `db/74:1182-1183`, in the same "exact final
execution ACL matrix," revokes `alocar_necessidade_compra_fio` with **no**
re-grant — superseding `db/69:626-629`'s earlier (now-superseded) grant to
`authenticated`. `definir_item_ordem_compra`, `remover_item_ordem_compra`,
and `remover_alocacao_compra_fio` are likewise revoked-with-no-regrant in
the same block (`db/74:1180-1187`). Only
`definir_alocacao_necessidade_compra_fio` and
`sincronizar_necessidades_compra_fio` retain a live grant among this
cluster. **Consequence: even if `emitir_ordem_compra` were granted today, no
UI-created draft could ever satisfy §R.22.5's allocation-completeness
precondition, because the writer that creates real allocations
(`alocar_necessidade_compra_fio`) is itself ungranted** — exactly the
outcome §R.22.5 itself predicts ("no ordinary UI-created draft can satisfy
this precondition — intentional").

**Preconditions enforced by the live function body** (`db/68:260-338`, in
order): admin-only (`is_admin()`, `codigo:'sem_permissao'`); row exists
(`codigo:'nao_encontrada'`); `legado=FALSE` (`codigo:'ordem_legado'`);
`status_administrativo='rascunho'` (`codigo:'estado_invalido'`);
`fornecedor_id IS NOT NULL` (`codigo:'sem_fornecedor'`); `≥1` item
(`codigo:'sem_itens'`); every item's active-allocation sum equals its
`kg_pedido` (`codigo:'alocacao_incompleta'`); every allocation's need
matches the order's `pedido_id` and the item's material/color identity
(`codigo:'alocacao_incoerente'`).

**Idempotency.** Neither emission function takes an idempotency-key
parameter or performs `ON CONFLICT` handling on the transition itself.
The `status_administrativo <> 'rascunho'` check is a *natural* guard (a
retry against an already-`emitida` order falls into `estado_invalido`), not
a designed idempotency contract — unlike the C2/C3/C4 receipt RPCs, which
carry an explicit `p_idempotency_key` parameter (e.g. `db/70:661-680`).

**Audit.** One `ordem_compra_eventos` row per successful emission
(`dimensao='administrativo'`, `tipo_evento='emitida'`, `db/68:330-334`),
consistent with the exactly-one-parent `CHECK` added at `db/67:461-469`.

**No legacy-compat emission adapter exists.** Unlike C4's receipt path,
there is no `emitir_ordem_compra_fio_compat`-shaped function anywhere in
`db/65`-`db/76`; `emitir_ordem_compra` itself explicitly refuses
`legado=TRUE` orders (`codigo:'ordem_legado'`, `db/68:268-270`), and the
`db/76` compat components (Component A/B) are scoped only to listing and
receiving, never emission (`db/76:9-32`).

**A separate, pre-existing normative/product gap, discovered by this
diagnosis (not introduced by C4 or this pass): no migration in `db/01`
through `db/76` ever creates an RPC that transitions `status_aceite` from
`pendente` to `aceita` or `rejeitada`.** A repo-wide grep for
`CREATE (OR REPLACE)? FUNCTION public\.\w*aceite\w*` returns zero matches;
the only occurrence of an acceptance-decision RPC name
(`decidir_aceite`) anywhere in `db/` is a forward-looking comment at
`db/65:139` describing a vocabulary that was never implemented. `status_aceite`
also has no `UPDATE` grant path — `ordem_compra` grants only `SELECT` to
`authenticated` (`db/67:220-224`). **Consequence: any order emitted while
`ordem_compra_config.exige_aceite=TRUE` becomes permanently unreceivable**
(§R.8/§R.25.3 require `status_aceite IN ('nao_aplicavel','aceita')` for
receipt, and nothing can ever move it out of `pendente`). This gap is
**not** part of `OC-C5-EMISSION-001`'s scope (which governs the emission
transition itself, not the acceptance decision) and is **not** dispositioned
by this contract — see §5(c) and §18.

---

## 5. Database-prerequisite classification

**Classification: `BLOCKING_DATABASE_PREREQUISITE`.**

This pass does not propose, draft, or bundle any migration. The following
prerequisites are named exactly, and are assigned to a **separate,
later-authorized prerequisite phase** (name and exact scope a supervisor
decision — see §18.2), analogous in structure to how
`ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` preceded and gated
`PHASE-C3C-B`:

**(a) `emitir_ordem_compra(BIGINT)` grant.** Currently `REVOKE ALL` from
every role including `service_role` (§4, terminal at `db/74:1192-1193`,
reaffirmed absent through `db/76`). A future prerequisite migration would
need to `GRANT EXECUTE ... TO authenticated` (subject to whatever
actor/role review that future order performs — this contract does not
pre-decide the exact role).

**(b) `alocar_necessidade_compra_fio(...)` grant (or an equivalent activated
allocation-writing path).** Currently `REVOKE ALL` with no re-grant,
terminal at `db/74:1182-1183`. Without this, granting (a) alone cannot ever
be exercised by a real UI-created draft (§4). A future prerequisite phase
must resolve this jointly with (a), or explicitly document why it is safe
to grant (a) alone (e.g., a distinct import-based allocation path that does
not depend on this specific RPC) — not assumed here.

**(c) The acceptance-decision RPC gap** (§4, last paragraph) is a related
but **distinct** gap: it does not block emission itself (an order can be
emitted with `exige_aceite=FALSE`/`status_aceite='nao_aplicavel'` and
proceed normally), but it blocks full end-to-end usability of any emitted
order that does require acceptance. This contract does **not** assign it to
the same prerequisite phase as (a)/(b) — its ownership (a new requirement
ID, folding into a later phase, or explicit deferred debt) is an open
supervisor decision (§18.3), not resolved here, per
`docs/governance/AGENT_INSTRUCTIONS.md` §6 ("an active requirement has no
disposition... requires a hard stop and an architect decision").

No migration file is included in this contract's manifest (§12). No grant,
activation, or environment mutation is authorized by this pass.

---

## 6. Functional scope of `PHASE-C5` (bounded by this diagnosis)

**In scope for a future, separately authorized implementation order:**

1. Wire the existing disabled `oc-emitir` button
   (`ordem-compra-render.js:165-177`) so its `disabled` state derives from
   the server `acoes.emitir` flag (already present in the read model,
   `db/68:528-532`, currently unread client-side) instead of the current
   hard-coded `disabled: true` literal.
2. Continue rendering `bloqueio_emissao`/`pode_emitir` as the authoritative
   disabled-reason (already partially rendered, `ordem-compra-render.js:174-176`)
   — do not recompute readiness client-side (§7).
3. Add a confirmation modal (opened by a new `emitir` handler in
   `ordem-compra-events.js`) that calls `emitir_ordem_compra` and performs
   an authoritative reload (`loadOrdemDetail`) on success, following the
   `registrar`/`estornar` reload precedent already established by C4.
4. Surface `status_aceite` on the order-detail screen — **currently
   unrendered there at all** (§3) — so acceptance-pending/rejected state is
   visible both before an emission attempt (for orders already `emitida`
   with a prior emission) and immediately after a successful one.
5. Deterministic client-side handling of the eight `codigo` values
   empirically present in the live function body (§4) — the governing spec
   text (§R.22.5) describes the preconditions in prose but does not restate
   a code table for the newer allocation-related preconditions (only the
   superseded §R.21.8 restates a code table, and it predates the
   allocation-completeness/coherence checks). Per
   `docs/governance/AGENT_INSTRUCTIONS.md` §1 ("verify against repository
   evidence" before promoting private/derived claims into canon), this
   contract binds to the **empirically verified live function body**
   (`db/68:260-338`) as the authoritative error vocabulary, not the stale
   superseded-section table.
6. Client-side duplicate-submission guard (disable-while-in-flight) — since
   the RPC itself has no idempotency-key parameter (§4), natural
   idempotency is the `estado_invalido` re-check on the server; the client
   only needs to prevent an accidental double-click from firing two
   in-flight requests, not reconcile a replayed token.
7. A small, locally-scoped transport-ambiguity classifier
   (`status === 0` pattern), following the established
   structurally-independent-copy precedent (§3) — not a new `common.js`
   shared helper.

**Out of scope, explicitly:**

- Any acceptance-decision (`aceita`/`rejeitada`) UI or RPC — no RPC exists
  anywhere in the schema; ownership is unassigned (§5c, §18.3); not built
  by this contract.
- Supplier receipt UI, supplier-assignment redesign, Pedido distribution
  redesign, OP receipt UI, legacy receipt-surface redesign — per the order.
- Any database migration, `GRANT`, or cutover/activation action (§5).
- `REAL_CUTOVER`, shared-database writes, production, deployment, `main`,
  push.
- `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` correction — separate,
  already-recorded debt (`PROJECT_STATE.md` POST-LAUNCH DEBT REGISTER item
  15).
- `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (recorded at the
  `PHASE-C4` closeout, item 16) — separate, already-recorded debt.
- Any change to `js/router.js`, `js/boot.js`, `js/screens/common.js`,
  `js/screens/op-nova.js`, or any `db/*.sql` file (§12).

---

## 7. Actor/state/action matrix

Action availability (the "Emitir" control's enabled/disabled state and its
displayed reason) **must be rendered from the server `acoes`/`pode_emitir`/
`bloqueio_emissao` model, never recomputed client-side** — the same binding
rule C4 followed for `acoes.receber`/`acoes.estornar`.

| State | `pode_emitir` | `bloqueio_emissao` | UI behavior |
|---|---|---|---|
| Native draft, distribution incomplete | `false` | `distribuicao_necessidades_pendente` | Disabled; reason links to the existing `ordem-compra-distribuicao.js` view (§11) — not duplicated. |
| Native draft, distribution complete (current terminal DB state, §4/§5) | `false` | `recebimento_nativo_ainda_inativo` | Disabled; reason states emission awaits the DB-prerequisite/activation gate (§5), per §R.23.8/§R.23.9 — never implies a client-side defect. |
| Native draft, all preconditions satisfiable (future, post-DB-prerequisite state) | `true` | — | Emitir enabled; opens confirmation modal. |
| `emitida` (already emitted) | `false` | — | No emit action; screen shows `status_aceite` (§6.4) and the existing Recebimentos section (C4). |
| Acceptance pending (`status_aceite='pendente'`, order already `emitida`) | `false` | — | No emit action (already emitted); `status_aceite` displayed; receipt blocked per §R.8 (existing C4 behavior, unchanged). |
| Acceptance rejected (`status_aceite='rejeitada'`) | `false` | — | No emit action; `status_aceite` displayed; receipt blocked (existing C4 behavior, unchanged); no override UI (§5c, out of scope). |
| Cancelled (`status_administrativo='cancelada'`) | `false` | — | No emit action (irreversible per `status_administrativo<>'rascunho'` gate). |
| Legacy order (`legado=TRUE`) | `false` (server) | — | No emit action; native emission explicitly refuses `legado` orders (`codigo:'ordem_legado'`); no legacy-compat emission path exists (§4). |
| `maintenance_fenced`/`legacy_active`/`canonical_active` (cutover singleton) | unaffected | — | **Cutover state is factually irrelevant to emission** — `emitir_ordem_compra`'s body never references it (§4); do not gate the UI on cutover state for this action. |
| Function ungranted (current live state) | `false` | `recebimento_nativo_ainda_inativo` (server-computed) | Deterministic, server-driven disablement — not a client-guessed state; matches current, already-shipped behavior. |
| Missing grant discovered only at call time (defensive case, e.g. a future partial-grant rollout) | n/a | n/a | A `42501`/permission-denied response must be treated as a **deterministic denial**, surfaced with a fixed message, never retried and never silently reinterpreted as ambiguous. |
| Ambiguous transport (`status === 0`) | n/a | n/a | Same-token retry once (§13), consistent with the C4 precedent; no fallback writer. |

---

## 8. Preconditions (exact)

Restated from §4/§R.22.5, binding: native (`legado=FALSE`);
`status_administrativo='rascunho'`; `fornecedor_id` present; ≥1 item; every
item's active-allocation sum equals `kg_pedido`; every allocation's need
matches the order's Pedido and the item's material/color identity. This
contract invents no additional precondition beyond what §R.22.5 states and
the live function body enforces (`db/68:260-338`).

---

## 9. API ownership

- **RPC:** `public.emitir_ordem_compra(p_ordem_id BIGINT) RETURNS JSONB`
  (native only). No `p_idempotency_key` parameter exists (§4) — do not
  invent one client-side; rely on the server's natural
  `status_administrativo` re-check plus the client-side in-flight guard
  (§6.6).
- **Return shape:** `jsonb` envelope (`{ok, codigo?, erro?}` on failure;
  `{ok:true, ...}` on success, per the pattern shared with
  `cancelar_ordem_compra`/`registrar_recebimento_ordem_compra`).
- **Authoritative reload:** `obter_ordem_compra_admin` via the existing
  `loadOrdemDetail` (`ordem-compra-data.js:83-101`) — no separate emission
  read-model RPC is introduced.
- **Deterministic errors:** the eight `codigo` values in §4/§8, mapped to
  fixed pt-BR user-facing messages; never retried.
- **Ambiguous-transport retry:** `status === 0` only, same idempotency
  posture as the C4 receipt writers (mint-on-open, no persisted token,
  reused only across a genuine transport ambiguity, new token after any
  deterministic outcome) — a small local copy of the pattern, not a shared
  helper (§3, §6.7).
- **Forbidden:** no direct table write; no call to
  `emitir_ordem_compra_fio` (the legacy flat function — operates on a
  different, superseded table and is excluded from this call graph exactly
  as C4 excluded the legacy-compat receipt RPC from its own); no fallback to
  a different writer after an ambiguous or deterministic failure.

---

## 10. Visual contract

- **Placement:** the dominant emission action stays where it already is —
  a header-level action button on the dedicated `#/ordens-compra/:id`
  screen (`oc-emitir`), not inside a transition modal, per §R.16/§R.22.11
  and matching the existing (currently-disabled) placement. The
  confirmation modal that opens on click contains **only** the confirmation
  and the action — no entity data, per the permanent "transition modals
  contain actions only" rule.
- **Readiness presentation:** reuse the existing disabled-button +
  `title`/inline-reason pattern (`ordem-compra-render.js:169,174-176`);
  cross-link to the existing distribution-completeness view
  (`ordem-compra-distribuicao.js`) rather than duplicating an allocation
  summary inside the emission modal (§11).
- **Destructive/irreversible-confirmation classification — an open
  decision, not silently inferred.** `docs/architecture/UI_VISUAL_CONTRACT.md`
  contains **zero** references to "emitir"/"emissão" (confirmed by full-text
  search) and does not extend its §8.1 `confirmDialog`-mandatory rule
  (currently scoped to "Excluir, Rejeitar, etc.") to emission. Separately,
  the lifecycle spec's historical (superseded) §2.1 describes emission as
  "Irreversible other than via `cancelada`," and §R.22.5 (governing)
  confirms items/allocations are frozen and immutable post-emission by
  construction. **This contract proposes that emission require
  `confirmDialog`-style confirmation** (irreversibility + freezing effects
  mirror the rationale the visual contract already applies to destructive
  actions), but flags this as a **supervisor decision** (§18.4), since
  `UI_VISUAL_CONTRACT.md` does not itself make this classification and a
  future implementation must not silently assume it.
- **Tokens:** reuse the canonical `--rv-*` tokens already confirmed
  available application-wide on this screen (ratified at the `PHASE-C4`
  closeout, `docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md` §0d) for
  the modal and the (now-enabled) button — no literal Tailwind-gray values.
- **Copy/accessibility:** pt-BR, active voice, one job per element,
  visible keyboard focus, per `UI_VISUAL_CONTRACT.md` §15/§16 (unchanged
  general obligations, not restated here).
- **Evidence posture.** Exactly like C4's writer RPCs, `emitir_ordem_compra`
  cannot currently be exercised end-to-end (§4/§5) — implementation evidence
  must be fixture-level DOM/mocked-RPC proof, not a live database
  round-trip, mirroring `ORDEM_COMPRA_C4_PHASE_CONTRACT.md` §17 item 1's
  same acknowledged risk.

---

## 11. Precondition visibility before emission

Before attempting emission, the screen must make visible: the assigned
supplier; the item list with `kg_pedido`; and allocation completeness per
item. The last of these **already has a dedicated, existing view**
(`ordem-compra-distribuicao.js`, driven by `obter_distribuicao_ordem_compra`)
— a future implementation must **link to or reuse that view**, not build a
second, duplicate allocation summary inside the emission flow. `status_aceite`
is **not** previewable before emission (`exige_aceite` is read from config
and frozen only *at* the instant of emission, §R.7's freeze rule) — this is
a documented fact about the existing semantics, not a proposed addition.

---

## 12. Closed implementation manifest

Given the feature's small scope (wiring one existing button + one
confirmation modal + reading already-returned fields — no new list, no
history view, no reversal flow, unlike C4's receipt UI), and per the
order's instruction to "prefer localized additive modules if emission logic
would materially enlarge existing files," this contract proposes **purely
additive changes to existing files, with no new product files**. All three
target files are currently well under the `docs/architecture/CODE_HEALTH_RULES.md`
§7 "acceptable" 500-line threshold (`ordem-compra-data.js` 115 lines,
`ordem-compra-render.js` 230 lines, `ordem-compra-events.js` 45 lines); the
estimated additive growth (an RPC wrapper + local idempotency/ambiguity
primitives in `-data.js`; wiring + `status_aceite` display in `-render.js`;
one modal handler in `-events.js`) is not expected to push any of them past
"acceptable." If a future implementation order finds this estimate wrong at
execution time, splitting into a new file is a decision for that order, not
pre-authorized here.

**Authorized modified files (additive only):**

- `js/screens/ordem-compra-data.js` — add the `emitir_ordem_compra` writer
  wrapper, local idempotency/attempt-tracker/transport-ambiguity primitives
  (§9, §13), and `status_aceite` pass-through (already present in the
  response envelope; currently just unused).
- `js/screens/ordem-compra-render.js` — replace the hard-coded
  `disabled: true` (line 170) with a value derived from `acoes.emitir`;
  wire the confirmation-modal open call; add a `status_aceite` display
  element.
- `js/screens/ordem-compra-events.js` — add an `emitir` handler (opens the
  confirmation modal, calls the writer, performs the authoritative reload).

**Authorized new files:** none for product code. Test files per §14.

**Explicitly unchanged/prohibited:** `js/router.js`, `js/boot.js`,
`js/screens/common.js`, `js/screens/op-nova.js`,
`js/screens/ordem-compra-distribuicao.js` (read/linked from, not modified),
`js/screens/ordem-compra-receipt-*.js` (all three, C4's manifest),
`js/screens/ordem-compra-receipt-cutover.js`, `js/screens/op-writes.js`,
`index.html` (no new script tag needed — no new file), all `db/*.sql`.

**Documentation files:** none beyond this contract and its proportional
manifest (§20) — no change to the lifecycle spec or schema contract is
required, since this contract proposes no new semantics beyond what
§R.22.5/§R.22.6 already state.

---

## 13. Idempotency/error contract

- Mint a local, in-memory attempt token on modal open (no persistence,
  no sharing — mirrors the C4 pattern's per-tracker independence, §3).
- Reuse the same token **only** across a `status === 0` transport-ambiguous
  retry of the *same* attempt.
- Mint a **new** token after any deterministic outcome (success or any of
  the eight `codigo` values, §4/§8) — never reuse across a genuinely new
  user-initiated attempt.
- Disable the confirm control while a request is in flight (client-side
  duplicate-submit guard, §6.6) — this is UX hygiene, not a substitute for
  the server's own `status_administrativo` re-check, which remains the
  authoritative idempotency backstop.
- Every deterministic `codigo` maps to a fixed, non-retried pt-BR message;
  no code is ever treated as ambiguous.

---

## 14. Test and evidence contract

**New/extended test files (exact, closed list):**

- Extension of `tests/ordem-compra.smoke.js` — the existing disabled-button
  assertions (tests 4-5) must be updated to reflect server-driven
  `acoes.emitir`-derived state instead of the static literal, without
  silently deleting the "never calls `emitir_ordem_compra` while disabled"
  guarantee.
- `tests/ordem-compra-emitir.smoke.js` (new) — faithful DOM/VM tests: button
  enabled/disabled per every row of the §7 matrix; confirmation-modal
  open/submit/cancel; all eight deterministic `codigo` paths (no retry);
  transport-ambiguity same-token retry; new-token-after-deterministic-outcome;
  duplicate-submit prevention; authoritative reload on success;
  `status_aceite` display for every value (`nao_aplicavel`/`pendente`/
  `aceita`/`rejeitada`).
- Full mandatory Node suite before/after failing-identity differential
  (exit gate, §15).
- Visual validation per §10's evidence posture (fixture-level, no live
  round-trip).

No wildcard test authorization; a future implementation order must name its
exact test files, matching this list or explaining any deviation.

---

## 15. Entry and exit gates (for a future implementation order — not evaluated by this pass)

**Entry gates:**
1. This contract is supervisor-**ACCEPTED** (not merely proposed).
2. The §5 database-prerequisite phase's disposition is explicitly recorded
   — either applied and accepted, or the implementation order explicitly
   scopes itself to fixture-level evidence only (mirroring C4's own
   accepted inert-writer posture) without claiming a live round-trip.
3. §18's open supervisor decisions (visual-confirmation classification,
   acceptance-decision-gap ownership) are resolved or explicitly deferred
   by name.
4. Git baseline re-verified at the fresh session's own entry checkpoint,
   per `docs/governance/AGENT_INSTRUCTIONS.md` §2.
5. No `REAL_CUTOVER`, migration, or environment mutation bundled into the
   same order.

**Exit gates:**
1. The §12 manifest is respected exactly — no undeclared file touched.
2. Full mandatory Node suite, byte-for-byte failing-identity differential
   against entry checkpoint — added failures = empty.
3. `node scripts/validate-spec-custody.mjs` PASS.
4. The §14 evidence is produced.
5. `IMPLEMENTADO / LOCALMENTE VERIFICADO / AGUARDANDO VALIDAÇÃO VISUAL DO
   ARQUITETO` reported; architect visual-validation OK received before any
   closeout claim (`SUPERVISION_PROTOCOL.md` §4).
6. `OC-C5-EMISSION-001` disposition proposed only after supervisor
   acceptance — never self-accepted.

---

## 16. Hard stops

Checked and **not** triggered by this diagnosis pass itself (documentation-only):
baseline matched the order's expectations; no canonical document
contradicted another on a point material to this contract (the one
discrepancy found — the order's C5/supplier-reuse misattribution, §2 — was
corrected by re-reading the primary source, not left as an unresolved
contradiction); no protected-residue path was touched; no push occurred.

**Recorded as hard stops for any future implementation order** (must stop
and report, not proceed past, unless separately resolved first):

1. The §5 `BLOCKING_DATABASE_PREREQUISITE` — no implementation order may
   assume `emitir_ordem_compra` or `alocar_necessidade_compra_fio` are
   grantable within its own scope; a migration remains a separate
   authorization.
2. The §5(c)/§18.3 acceptance-decision RPC ownership gap — an
   implementation order must not silently build an acceptance-decision UI
   or RPC to "complete" the feature; that ownership is unresolved.
3. The §10 visual-confirmation classification — an implementation order
   must not silently assume `confirmDialog` treatment (or its absence)
   without the supervisor decision this contract requests.
4. Any discovery that the live `emitir_ordem_compra`/
   `alocar_necessidade_compra_fio` grant state has changed from what §4
   documents (schema drift) — must be re-verified against the
   then-current `HEAD` before writing product code, per the C4 precedent
   (§14 entry gate 3 of that contract).
5. Any need to touch `js/router.js`, `js/boot.js`, `js/screens/common.js`,
   or `js/screens/op-nova.js` beyond what §12 authorizes.

---

## 17. Risks

1. **The feature will be entirely unexercisable end-to-end in the current
   environment** (§4/§5, §10 evidence posture) — implementation evidence
   must rely on fixture-level DOM/mocked-RPC proof, exactly like C4's
   receipt writers.
2. **Granting `emitir_ordem_compra` alone would still leave the feature
   practically unusable** for any UI-created draft, because
   `alocar_necessidade_compra_fio` is independently ungranted (§4/§5) — any
   future DB-prerequisite phase must address both, or explicitly document a
   different path (e.g., an import-based allocation route) that does not
   depend on this specific RPC.
3. **The visual "destructive-confirmation" classification (§10) is a
   genuine open design decision**, not resolvable from existing canon
   alone.
4. **The acceptance-decision RPC gap (§4/§5c) is a latent, pre-existing
   product defect** independent of C5; C5's own emission action is simply
   the first UI surface that would make an already-`emitida`,
   forever-`pendente` order visible, since `status_aceite` is currently
   unrendered anywhere on this screen.
5. A cosmetic, pre-existing script-load-order inconsistency between
   `ordem-compra-distribuicao.js`'s own header comment and its actual
   position in `index.html` relative to `op-compra-regime.js` (§3) is
   unrelated, out of scope, and not addressed here.

---

## 18. Supervisor decisions required

1. **Accept, reject, or request changes** to this proposed `PHASE-C5`
   material contract as a whole.
2. **Name and scope the separate database-prerequisite phase** (§5(a)/(b))
   — one combined prerequisite phase covering both `emitir_ordem_compra`
   and `alocar_necessidade_compra_fio`, or two separately gated phases.
3. **Decide ownership of the acceptance-decision (`aceita`/`rejeitada`) RPC
   gap** (§4/§5c) — a new requirement ID, folding into a later phase, or an
   explicit deferred-debt disposition.
4. **Decide whether emission requires `confirmDialog`-style destructive
   confirmation** (§10) — this contract proposes yes but does not
   self-ratify the decision.
5. Once accepted, issue a **separate, explicit implementation order** for
   `PHASE-C5` in a fresh session that re-reads the canonical repository
   first, per `docs/governance/AGENT_INSTRUCTIONS.md` §2/§3 (phases do not
   chain automatically) — implementation is **not** authorized by this
   contract's acceptance alone; the entry gates in §15 must also be
   satisfied.

---

## 19. Documentation-closeout rules

Per `docs/governance/DOCUMENTATION_MODEL.md` §19,
`READ_ONLY_RECONCILIATION` mandates no canonical mutation beyond this new
contract file. This pass proportionally also updates (§20): `PROJECT_STATE.md`,
`AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and
`docs/ledgers/G28_LEDGER.md` — the exact set the order's own "Required C5
documentation manifest" pre-authorizes, and no other document. The governing
specification and schema contract are **not** modified — every citation
from them in this contract is read-only reference to already-ratified
clauses.

After this contract is authored:

- `OC-C5-EMISSION-001` remains `PLANNED`. No requirement becomes `SATISFIED`
  or `PARTIALLY_SATISFIED` by this pass.
- `PHASE-C5` implementation remains unauthorized.
- `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`.
- `NEXT_AUTHORIZABLE_ACTION` becomes: supervisor review and
  acceptance/rejection of this proposed `PHASE-C5` material contract, plus
  the §18 decisions.
- This pass does not self-accept the contract, does not authorize
  implementation, and does not chain another order.

---

## 20. Status and next authorizable action (superseded by §21 — retained for provenance)

*(Historical: at authoring time this section read `STATUS: PROPOSED /
AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED`, with
`NEXT_AUTHORIZABLE_ACTION` pointing to supervisor review of this contract
and the §18 decisions. §21 records the supervisor's subsequent ruling and is
now the current disposition.)*

---

## 21. Supervisor acceptance — `C5-CONTRACT-ACCEPTANCE-CLOSEOUT-R1`

On 2026-07-21 the supervisor **ACCEPTED** this material phase contract as
final and binding, resolving the four §18 decisions as follows. This
acceptance does **not** authorize `PHASE-C5` implementation.

**Contract disposition:** `STATUS: ACCEPTED / IMPLEMENTATION BLOCKED BY
DATABASE PREREQUISITE`. Accepted contract commit
`f9fa97703d2724d62a0d916cca7b9637d54a1e08`.

**`OC-C5-EMISSION-001` disposition:** `PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE`
— not `SATISFIED`, not `ACTIVE`, not `IMPLEMENTED`, not `CLOSED`.

**§18.2 (database-prerequisite scoping) — ratified.** The §5 classification
`BLOCKING_DATABASE_PREREQUISITE` is ratified. The `PHASE-C5` UI must **not**
be implemented as an operationally complete emission flow while (i)
`emitir_ordem_compra` has no executable application-role grant, (ii)
`alocar_necessidade_compra_fio` has no executable application-role grant,
and (iii) the canonical UI-created draft path cannot satisfy allocation
completeness (all three proven at §4/§5 of this contract). A **separate
`PHASE-C5A` database-readiness contract is required** to resolve (i)-(iii).
That contract is **not authored by this closeout** — it requires its own
read-only diagnosis and documentation-only authoring pass, in a fresh
session (`NEXT_AUTHORIZABLE_ACTION` below).

**§18.4 (destructive-confirmation classification) — ratified, as
`CONTROLLED_IRREVERSIBLE_TRANSITION`** (not the `confirmDialog`/destructive-red
treatment this contract had proposed as one option in §10). A future
`PHASE-C5A`/`PHASE-C5` implementation order must design the emission
confirmation UX to this classification, not the destructive pattern:

- explicit confirmation is required (no single-click emission);
- the confirmation must clearly explain the resulting state (irreversible
  freeze of items/allocations per §R.22.5/§R.6, and — if `exige_aceite` is
  active — that the order then awaits acceptance per §18.3 below);
- confirmation control styling is **primary or neutral** — **not** the
  destructive-red pattern (`UI_VISUAL_CONTRACT.md` §8's "Destructive
  (Excluir)" treatment does not apply here merely because the transition is
  irreversible; emission is not classified as destructive by this ruling);
- an authoritative reload (`obter_ordem_compra_admin` via `loadOrdemDetail`,
  §9 unchanged) is required after a deterministic success.

This resolves §10's open question in favor of a distinct, named UX
classification rather than either of §10's two named alternatives.

**§18.3 (acceptance-decision-RPC gap ownership) — ratified as a new,
separately identified phase: `PHASE-C5B-ACCEPTANCE-DECISION`.**

- **Status:** `IDENTIFIED / NOT AUTHORIZED`.
- **Owns:** actor ownership for acceptance decisions; the canonical
  acceptance and rejection RPCs (none currently exist, §4); state-transition
  rules for `status_aceite` (`pendente` → `aceita`/`rejeitada`); audit/history
  for acceptance decisions; UI ownership for the decision surface; the
  supplier-versus-administrator permission split (currently entirely
  undecided — no canon anywhere assigns this); rejection and
  administrative-override semantics (the historical, superseded §7c "is
  `rejeitada → aceita` reachable" question, never ratified, remains open
  under `PHASE-C5B`, not resolved here).
- **`PHASE-C5A` must not implement or invent any acceptance-decision
  capability** — `PHASE-C5A`'s scope is strictly the database-grant
  prerequisite (§5), not `status_aceite` transition RPCs.
- **Binding usability rule:** orders with `exige_aceite=TRUE` must **not**
  be treated as lifecycle-complete, nor presented in any UI or documentation
  as a fully closed workflow, until `PHASE-C5B` is implemented and accepted.
  Any `PHASE-C5`/`PHASE-C5A` implementation order must surface this
  limitation to the user (e.g., in the emission confirmation copy required
  above) rather than silently omitting it.

**Canonical state after this closeout:**

```text
LAST_ACCEPTED_PHASE = PHASE-C4
ACTIVE_PHASE = NONE
ACTIVE_PHASE_CONTRACT = NONE

PHASE-C5 CONTRACT = ACCEPTED
PHASE-C5 IMPLEMENTATION = NOT AUTHORIZED
OC-C5-EMISSION-001 = PLANNED / BLOCKED_BY_C5A_DB_PREREQUISITE

PHASE-C5A-DB-EMISSION-READINESS = NEXT AUTHORIZABLE CONTRACT PHASE
PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED

REAL_CUTOVER = NOT AUTHORIZED
```

`NEXT_AUTHORIZABLE_ACTION`: a fresh Claude Code session performs read-only
diagnosis and documentation-only material-contract authoring of
`PHASE-C5A-DB-EMISSION-READINESS` (the database-grant prerequisite named at
§5 of this contract). That phase is **not** issued or executed by this
closeout. `PHASE-C5` implementation, `PHASE-C5B`, `REAL_CUTOVER`, any
database migration, any environment mutation, and any push remain
unauthorized.

---

## 22. Database prerequisite resolved — implementation authorized locally (`C5A-CLOSEOUT-AND-C5-AUTHORIZATION-R1`)

On 2026-07-22 the supervisor **CLOSED** `PHASE-C5A-DB-EMISSION-READINESS` as
`CLOSED / ACCEPTED / LOCALLY VERIFIED / SHARED-DEVELOPMENT VERIFIED`
(`docs/architecture/ORDEM_COMPRA_C5A_DB_EMISSION_READINESS_PHASE_CONTRACT.md`
§25): `db/77` grants `EXECUTE ON emitir_ordem_compra(BIGINT) TO authenticated`
(internal `is_admin()` gate unchanged, writer body byte-unchanged) and
corrects the terminal read models `obter_ordem_compra_admin`/
`listar_ordens_compra_admin` so `pode_emitir`/`acoes.emitir` derive true for
an eligible native draft with `exige_aceite=FALSE`, applied byte-identical to
the authorized shared development database `ucrjtfswnfdlxwtmxnoo` with the
full §14 behavioral evidence. **The §5/§18.2 `BLOCKING_DATABASE_PREREQUISITE`
is resolved.**

**Contract disposition:** `STATUS: ACCEPTED / IMPLEMENTATION AUTHORIZED
LOCALLY`. This does not reopen or change any ratified §21 decision: the
functional scope (§6), actor/state/action matrix (§7), API ownership (§9),
visual contract including the `CONTROLLED_IRREVERSIBLE_TRANSITION`
confirmation classification (§10, §21), closed implementation manifest
(§12), idempotency/error contract (§13), test/evidence contract (§14), and
hard stops (§16) all remain binding and unchanged. `PHASE-C5B-ACCEPTANCE-DECISION`
remains `IDENTIFIED / NOT AUTHORIZED` — no implementation order may build any
acceptance-decision capability, and any order with `exige_aceite=TRUE` must
still be presented as not lifecycle-complete (§21).

**`OC-C5-EMISSION-001` disposition:** `PLANNED / AUTHORIZED_FOR_IMPLEMENTATION`
— not `SATISFIED`, not `ACTIVE`, not `IMPLEMENTED`.

**Authorization boundary (unchanged from the §15 entry gates).** A **fresh
Claude Code session** must re-verify the Git baseline and canonical
repository state (`docs/governance/AGENT_INSTRUCTIONS.md` §2) before
implementing. That implementation is bounded to exactly this contract's §12
manifest (additive changes to `ordem-compra-data.js`/`-render.js`/
`-events.js` only), must use `public.emitir_ordem_compra(BIGINT)` and the
server-derived `acoes.emitir` signal, must not compute readiness
client-side, must not bypass `exige_aceite=TRUE`, must not use any direct
table write or a legacy fallback, must not implement `PHASE-C5B`, must not
modify `db/77` or apply any migration, must not begin `REAL_CUTOVER`, must
not access production, and must not push.

**Canonical state after this authorization:**

```text
LAST_ACCEPTED_PHASE = PHASE-C5A-DB-EMISSION-READINESS
ACTIVE_PHASE = PHASE-C5
ACTIVE_PHASE_CONTRACT = docs/architecture/ORDEM_COMPRA_C5_PHASE_CONTRACT.md

PHASE-C5 CONTRACT = ACCEPTED / IMPLEMENTATION AUTHORIZED LOCALLY
PHASE-C5 IMPLEMENTATION = NOT YET IMPLEMENTED
OC-C5-EMISSION-001 = PLANNED / AUTHORIZED_FOR_IMPLEMENTATION
PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
REAL_CUTOVER = NOT AUTHORIZED
```

`NEXT_AUTHORIZABLE_ACTION`: a fresh Claude Code session performs `PHASE-C5` /
`OC-C5-EMISSION-001` local UI implementation per this contract's §6/§12/§14/§15.
`PHASE-C5B`, `REAL_CUTOVER`, staging validation/application of `db/76`/
`db/77`, deployment, activation, production access, and any push remain
unauthorized.

---

## 23. Local implementation — `C5-PURCHASE-ORDER-EMISSION-UI-IMPLEMENTATION-R1`

On 2026-07-22 a fresh Claude Code session implemented this contract's §6/§12
scope locally. **STATUS: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR
FUNCTIONAL AND VISUAL REVIEW.** This does **not** self-accept or close
`PHASE-C5` and does **not** advance `OC-C5-EMISSION-001` to `SATISFIED` (it
moves to `PARTIALLY_SATISFIED`). No ratified §21 decision is reopened; the
functional scope (§6), matrix (§7), API ownership (§9), the
`CONTROLLED_IRREVERSIBLE_TRANSITION` classification (§10/§21), the manifest
(§12), the idempotency/error contract (§13), and the hard stops (§16) were all
honoured exactly.

**Entry checkpoint:** `HEAD` `538f4ba7b7aae5d6e9e0efbe29a57e1ef7bbc776`, parent
`d17b353ed3eca04225a7decb55f84ccd5817d085`, branch `dev`; protected residue
(`M .gitignore`, `?? .codex/config.toml`, `?? .mcp.json`) preserved untouched.

**Product manifest (additive only, exactly §12):**
- `js/screens/ordem-compra-data.js` — `ns.emitirOrdem(ordemId)` wrapper on
  `public.emitir_ordem_compra(BIGINT)` (sends only `p_ordem_id`); local
  transport-ambiguity classifier (`isEmissionTransportAmbiguous`, `status === 0`
  only); result classifier (`classifyEmissionResult`); and a structurally
  independent attempt tracker (`createEmissionAttemptTracker`; local-only token,
  never transmitted — the RPC has no idempotency parameter, §9).
- `js/screens/ordem-compra-render.js` — the emit control's enabled state now
  derives from the server `acoes.emitir` flag (enabled → opens the confirmation
  modal; disabled → honest disabled state + server `bloqueio_emissao` reason);
  the `status_aceite` badge and the readiness / pending-acceptance notices.
- `js/screens/ordem-compra-events.js` — the `emitir(o)` handler: the
  `CONTROLLED_IRREVERSIBLE_TRANSITION` confirmation modal (`js/ui.js` `modal()`,
  primary/neutral — not the destructive-red `confirmDialog`), the in-flight
  duplicate-submit guard, the fixed pt-BR message per deterministic writer
  `codigo`, the authoritative reload after a deterministic success, and
  reload-first resolution of an ambiguous transport.

No new product file; `index.html`, `js/router.js`, `js/boot.js`,
`js/screens/common.js`, `js/ui.js`, the receipt/distribuicao/cutover/op-nova
surfaces and all `db/*.sql` are byte-unchanged; the
`ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` debt is untouched (the new
`emitir(o)` handler reads the current order from the render layer at click time,
not a stale closure snapshot, so it does not replicate that debt).

**Tests (exactly §14):** new `tests/ordem-compra-emitir.smoke.js` (faithful
DOM/VM behavioral suite covering the §14 / order manifest points 1–25); updated
`tests/ordem-compra.smoke.js` tests 4–5 to the server-derived state (retaining
the "never calls `emitir_ordem_compra` while disabled" guarantee).

**§8/§9/§13 reconciliation (recorded).** `emitir_ordem_compra` takes no
`p_idempotency_key`, so the §13 attempt token is a local, never-transmitted
bookkeeping marker; the server's natural `status_administrativo` re-check plus
the in-flight confirm-button guard are the idempotency backstop. On an ambiguous
transport the client follows §8 (reload-first, no auto-retry, no fallback writer;
if the reload shows `emitida` the server state is authoritative, otherwise the
reloaded eligible-draft Emitir button is the controlled deliberate retry) — the
token is retained across the transport ambiguity and released once the reload
resolves it, with no server-observable difference from §13.

**Evidence.** Targeted suites green (emitir + ordem-compra 48/48; the four C4
receipt suites 38/38). Full Node-suite differential vs a detached baseline
worktree at `538f4ba`: baseline 142 / worktree 122 failing identities,
**added failing identities = empty**. `node scripts/validate-spec-custody.mjs`
PASS; `--self-test` fails only on the pre-existing active-contract fixture-harness
limitation (`R1: ACTIVE_PHASE_CONTRACT is not an existing file`), byte-identical
on the `538f4ba` baseline. `git diff --check` / `--cached --check` clean.
Deterministic offline visual evidence (`%TEMP%\ravatex-c5-visual-review\`;
vendored Tailwind + local `playwright-core`, no Supabase/auth/network/DB/
production) rendered the real product DOM into seven PNGs + a contact sheet with
an **empty** browser console and no page errors; computed styles: emission
primary button radius 4px, background `rgb(37,99,235)`/white (primary, not
destructive-red); confirmation confirm button `rgb(37,99,235)`
(`is_destructive_red=false`); confirmation card radius 8px + shadow (shared
`js/ui.js` modal primitive — the `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`
item-16 debt, frozen by this phase); status badge 999px pill; disabled emit
button opacity 0.6 / cursor `not-allowed` / chip background; narrow 1024 no
horizontal overflow.

**Risks / debts unchanged.** The writer is not exercisable end-to-end in a
browser here (fixture-level DOM/mocked-RPC evidence, §10). `index.html`
cache-bust `?v=` was not bumped because `index.html` is frozen by §12 — a future
deploy pass must refresh it. `SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`
(item 16) and `ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (item 15) remain.
Orders with `exige_aceite=TRUE` are surfaced honestly as not lifecycle-complete
until `PHASE-C5B`.

**Disposition:** `OC-C5-EMISSION-001` = `PARTIALLY_SATISFIED`; `PHASE-C5B` =
`IDENTIFIED / NOT AUTHORIZED`; `REAL_CUTOVER` = `NOT AUTHORIZED`. Local commit
`feat: implement C5 purchase-order emission UI`; no push.
`NEXT_AUTHORIZABLE_ACTION`: supervisor functional review + mandatory architect
visual validation (`SUPERVISION_PROTOCOL.md` §4) of this implementation before
any closeout.

---

## 24. Supervisor functional/visual review + targeted correction — `C5-AMBIGUOUS-RELOAD-AND-CANONICAL-STATE-CORRECTION-R1`

On 2026-07-22 the supervisor performed direct functional and visual review of
the `§23` implementation and ruled:

- **`PHASE-C5 VISUAL REVIEW` = `PASS_WITH_NONBLOCKING_COSMETIC_DEBT`.** The
  visual debt recorded at `§23` (`SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT`,
  `PROJECT_STATE.md` POST-LAUNCH DEBT REGISTER item 16) does not block this
  phase and must not be expanded into a global UI redesign.
- **`PHASE-C5 FUNCTIONAL REVIEW` = `CHANGES_REQUIRED`** on exactly one
  blocking defect: **`C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`.**
  After an ambiguous `emitir_ordem_compra` transport result, the `§23`
  implementation performed the required single authoritative reload but, if
  that reload itself failed, returned `null`, returned a different order, or
  returned an unresolved state, the `emitir(o)` handler in
  `js/screens/ordem-compra-events.js` fell through to asserting "a ordem
  continua em rascunho" (the order remains a draft) — an unproven and
  potentially false claim. Honest uncertainty must be preserved until an
  authoritative reload actually resolves the state.

**Correction (this pass, product + tests + docs, commit `fix: preserve
uncertainty after unresolved emission reload`).**
`js/screens/ordem-compra-events.js` `emitir(o)`'s ambiguous-transport branch
now, after the single authoritative reload:

- resolves **success** only when `state.ordem` exists, its `ordem_id` equals
  the attempted order id, and `status_administrativo === 'emitida'`;
- resolves **"still a draft"** only when `state.ordem` exists, its `ordem_id`
  equals the attempted order id, and `status_administrativo === 'rascunho'` —
  and offers the reloaded `Emitir` action as a deliberate retry in that
  message only when the reloaded order's own `acoes.emitir === true` (the
  render layer already gates the actual control on this same server-derived
  flag; the message now agrees with it instead of assuming it);
- otherwise (reload failed, returned `null`, returned a different order, or an
  unrecognized/unresolved state) shows the fixed pt-BR message "Não foi
  possível confirmar o resultado da emissão. Recarregue a ordem antes de
  tentar novamente." — never claiming draft or emitted, with no automatic
  retry and no fallback writer.

No other product file changed; the RPC and payload
(`window.supa.rpc('emitir_ordem_compra', { p_ordem_id: ordemId })`) are
unchanged; the existing deterministic-success and deterministic-rejection
branches are unchanged; `js/screens/ordem-compra-data.js`, `-render.js`,
`js/screens/ordem-compra.js`, all receipt modules, `js/ui.js`, `index.html`,
`router.js`, `boot.js`, and `common.js` are byte-unchanged.

**Tests.** `tests/ordem-compra-emitir.smoke.js` gained faithful behavioral
coverage proving: an authoritative reload that itself fails after an
ambiguous transport shows the fixed unresolved-result message and never
"continua em rascunho"; `emitir_ordem_compra` is called exactly once and
`obter_ordem_compra_admin` exactly twice; no fallback/legacy writer is
called; no automatic retry occurs; no enabled `Emitir` control is
reconstructed from stale pre-reload state; and an authoritative
non-draft/non-emitted result (and a mismatched order identity) is never
described as a draft. Every existing `PHASE-C5` test is retained unchanged
(41/41 pass).

**Ancillary rulings recorded (binding, not reopened here).** `PHASE-C4` =
`CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT
VISUAL VALIDATION PASSED`; `OC-C4-ADMIN-001` = `SATISFIED`; a nonblocking C4
debt was additionally found by this direct review —
`ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (the receipt action
layer may expose `res.error.message` for an unmapped `hard_failure`),
recorded only, **not corrected in this pass** (out of this contract's C4
scope and manifest). `PHASE-C5A-DB-EMISSION-READINESS` = `CLOSED / ACCEPTED /
DIRECTLY VERIFIED / SHARED-DEVELOPMENT STATE VERIFIED`. Full current-state
record: `PROJECT_STATE.md` and `docs/ledgers/G28_LEDGER.md`.

**Evidence.** Targeted suites green (emitir 41/41; ordem-compra 11/11; the
four C4 receipt suites 38/38). Full Node-suite differential vs a detached
baseline worktree at `e25361b`: baseline 142 / worktree 122 failing
identities, **added failing identities = empty**. `node
scripts/validate-spec-custody.mjs` PASS; `--self-test` fails only on the
pre-existing active-contract fixture-harness limitation (`R1:
ACTIVE_PHASE_CONTRACT is not an existing file`), byte-identical to the
`e25361b` baseline. `git diff --check` / `--cached --check` clean.

**Disposition.** `PHASE-C5` = `IMPLEMENTED / TARGETED CORRECTION IMPLEMENTED /
LOCALLY VERIFIED / AWAITING SUPERVISOR RE-REVIEW` — not self-accepted, not
closed. `OC-C5-EMISSION-001` stays `PARTIALLY_SATISFIED` (not `SATISFIED`).
`PHASE-C5B-ACCEPTANCE-DECISION` stays `IDENTIFIED / NOT AUTHORIZED`.
`REAL_CUTOVER` stays `NOT AUTHORIZED`. Nonblocking debts unchanged/recorded:
`SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (item 16),
`ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (item 15),
`ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (new, item 17,
`PHASE-C4` receipt layer, out of this contract's manifest, not corrected
here), `C5_ORDEM_COMPRA_JS_STALE_EMISSION_COMMENT` (new, item 18 — the
`js/screens/ordem-compra.js` header comment still says emission is
installed-but-inactive/never wired, stale since `§23`, out of this
correction's manifest), `C5_INDEX_HTML_CACHE_BUST_PENDING_DEPLOY` (item 19),
`C5_COSMETIC_UI_CONSOLIDATION` (item 20) — full narratives in
`PROJECT_STATE.md`'s POST-LAUNCH DEBT REGISTER.
`NEXT_AUTHORIZABLE_ACTION`: direct supervisor re-review of this single
correction commit. Local only — no migration, database, environment,
staging, deployment, activation, cutover, branch, or push beyond the one
authorized `staging/dev` fast-forward for this pass's single commit.

---

## 25. Supervisor acceptance and PHASE-C5 closeout — `C5-DOCUMENTATION-CLOSEOUT-R1`

**Precedence.** This section is the current, binding disposition of `PHASE-C5`.
It supersedes the in-review dispositions recorded at §20 (proposal), §21
(contract acceptance, database-prerequisite blocked), §22 (implementation
authorized locally), §23 (implemented / awaiting functional & visual review),
and §24 (targeted correction / awaiting re-review). §§20–24 are retained
verbatim as historical, point-in-time evidence and are **not** rewritten. Where
any earlier section reads as current state, this §25 governs. `PROJECT_STATE.md`
remains the sole owner of live current state.

On 2026-07-22 the supervisor performed direct re-review of the targeted
correction commit `3405fdab8e05ec0f81cbfe07c63c489e551fee92`
(`fix: preserve uncertainty after unresolved emission reload`, parent
`e25361be80eed0c33f2544c58d2273572d0bd588`) and **ACCEPTED** it as final and
binding.

**Commit disposition:** `ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT`.

**Blocking defect resolved.** `C5_AMBIGUOUS_EMISSION_RELOAD_FALSE_DRAFT_ASSERTION`
(§24) is resolved. Direct review confirmed that the corrected
ambiguous-transport branch (`js/screens/ordem-compra-events.js`):

- performs exactly one authoritative reload;
- resolves **emitted** only for the same order with
  `status_administrativo='emitida'`;
- resolves **draft** only for the same order with
  `status_administrativo='rascunho'`;
- offers a deliberate retry only when the reloaded server object exposes
  `acoes.emitir=true`;
- preserves honest uncertainty for reload failure, `null` state, a mismatched
  order, or an unresolved state;
- performs no automatic retry;
- performs no fallback or legacy writer call;
- preserves the existing canonical RPC and payload
  (`emitir_ordem_compra(BIGINT)` / `{ p_ordem_id }`).

**Gate dispositions (binding).**

- `PHASE-C5 FUNCTIONAL GATE` = `PASS`.
- `PHASE-C5 VISUAL REVIEW` = `PASS_WITH_NONBLOCKING_COSMETIC_DEBT`.

**Final PHASE-C5 disposition:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT /
DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED`. Accepted PHASE-C5
technical checkpoint `3405fdab8e05ec0f81cbfe07c63c489e551fee92`.

**Requirement disposition:** `OC-C5-EMISSION-001` advances to **`SATISFIED`**
(from `PARTIALLY_SATISFIED`).

**Phase-state transition.** `ACTIVE_PHASE` returns to `NONE`;
`ACTIVE_PHASE_CONTRACT` returns to `NONE`; `LAST_ACCEPTED_PHASE` becomes
`PHASE-C5`. This contract is no longer the active phase contract; it is a
closed material phase contract.

**Boundaries preserved (each a separate, still-unauthorized gate).**
`PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT AUTHORIZED` — no order
may build any acceptance-decision capability, and an order with
`exige_aceite=TRUE` must still be presented as not lifecycle-complete (§21).
`REAL_CUTOVER` remains `NOT AUTHORIZED` (and is additionally hard-gated behind
the mandatory read-only completeness disposition of the 13 unmapped
`ordens_compra_fio` rows ids 153–165). No architecture is reopened by this
closeout.

**Nonblocking debts preserved (recorded, not implemented; full narratives in
`PROJECT_STATE.md`'s POST-LAUNCH DEBT REGISTER).**
`ORDEM_COMPRA_CANCEL_HANDLER_STALE_ORDER_CAPTURE` (item 15);
`SHARED_UI_MODAL_CONTROL_RADIUS_TOKEN_ALIGNMENT` (item 16);
`ORDEM_COMPRA_RECEIPT_HARD_FAILURE_RAW_MESSAGE_EXPOSURE` (item 17);
`C5_ORDEM_COMPRA_JS_STALE_EMISSION_COMMENT` (item 18);
`C5_INDEX_HTML_CACHE_BUST_PENDING_DEPLOY` (item 19);
`C5_COSMETIC_UI_CONSOLIDATION` (item 20).

**Documentation-only closeout.** No product, test, database, migration,
environment, deployment, production, `main`, or `origin` action occurred in this
closeout. It changed only the seven authorized documentation owners
(`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, this contract, and
`docs/ledgers/G28_LEDGER.md`) and published exactly one documentation-only
commit through one authorized fast-forward push to `staging/dev`.

**Canonical state after this closeout:**

```text
LAST_ACCEPTED_PHASE = PHASE-C5
ACTIVE_PHASE = NONE
ACTIVE_PHASE_CONTRACT = NONE
ACTIVE_TRACK = PURCHASE_ORDER_PHASE_C
ACCEPTED_CHECKPOINT = 3405fdab8e05ec0f81cbfe07c63c489e551fee92

PHASE-C5 = CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBT / DIRECTLY VERIFIED / ARCHITECT VISUAL VALIDATION PASSED
OC-C5-EMISSION-001 = SATISFIED
PHASE-C5B-ACCEPTANCE-DECISION = IDENTIFIED / NOT AUTHORIZED
REAL_CUTOVER = NOT AUTHORIZED
```

`NEXT_AUTHORIZABLE_ACTION`: a supervisor read-only sequencing decision between
the remaining separately governed continuations — `PHASE-C5B-ACCEPTANCE-DECISION`
and the `REAL_CUTOVER` completeness disposition for the 13 unmapped
`ordens_compra_fio` rows ids 153–165. This closeout authorizes neither
implementation; no phase chains automatically.
