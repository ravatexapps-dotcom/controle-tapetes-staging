# PHASE-C4 Material Phase Contract — Admin Receipt UI

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C4
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT AUTHORIZED

> **Role of this document.** This is a **material phase contract**, authored under
> `C4-MATERIAL-PHASE-CONTRACT-R1` as **read-only repository reconciliation +
> documentation-only phase-contract authoring**. It does **not** authorize
> product implementation, database migration, environment mutation, staging
> application, deployment, activation, cutover, or push. It binds the primary
> requirement `OC-C4-ADMIN-001` to an exact functional scope, actor/state/action
> matrix, API ownership matrix, file manifest, test manifest, visual contract,
> and evidence contract, so that a **future, separately authorized**
> implementation order has nothing left to infer. Per
> `docs/governance/DOCUMENTATION_MODEL.md` §19, authoring a `PROPOSED` contract
> of this kind is `READ_ONLY_RECONCILIATION` — no canonical mutation beyond
> this new file and its proportional index/traceability registration (§20).

---

## 0. Order authorization, entry checkpoint, and scope of this pass

- **Order:** `C4-MATERIAL-PHASE-CONTRACT-R1` — read-only reconciliation +
  documentation-only PHASE-C4 material contract authoring. Explicitly does
  **not** authorize implementation.
- **Entry checkpoint (git preflight, this pass):**
  - Workspace: `D:\Programação\controle-tapetes-g28` (canonical; the former
    OneDrive workspace was not used).
  - Git dir: `.git` (normal repository, not a linked worktree).
  - Branch: `dev`.
  - `HEAD`: `0df4228f903ae68c7e8b240e69ff3b37df9ebd86`.
  - `HEAD^`: `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.
  - `git status --short --untracked-files=all`: `M .gitignore`, `?? .codex/`,
    `?? .mcp.json` — matches the expected protected residue exactly. None of
    the three paths were opened, displayed, copied, modified, or staged by
    this pass.
  - `staging/dev` after `git fetch staging`:
    `0df4228f903ae68c7e8b240e69ff3b37df9ebd86` — identical to `HEAD`;
    `git rev-list --left-right --count staging/dev...HEAD` = `0	0`.
  - `git worktree list --porcelain`: exactly one worktree, this one.
  - All entry-baseline facts match the order's expected values exactly. No
    `HARD STOP` triggered by baseline divergence.
- **This pass's authorized output:** exactly one new file
  (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`, this document) plus
  proportional updates to the documents enumerated in §20, and one local
  documentation-only commit. No push.

---

## 1. Dependencies (documents this contract reads and binds to)

Read in full for this pass, per `docs/governance/AGENT_INSTRUCTIONS.md` §2 and
the order's mandatory canonical reading list:

1. `docs/governance/AGENT_INSTRUCTIONS.md` — bootstrap, sources of truth,
   authorization/architecture rules, proportional documentation model, git
   safety, hard stops, mandatory evidence.
2. `PROJECT_STATE.md` (full, both halves) — `SPEC_CUSTODY_BOOTSTRAP` block,
   `PHASE-C3D` closeout, `NEXT_AUTHORIZABLE_ACTION` (architect authorization
   decision for `PHASE-C4`), POST-LAUNCH DEBT REGISTER, environment state.
3. `AGENT_HANDOFF.md` (full) — derived operational handoff, roadmap/UI
   governance retransmission, push/remote limits.
4. `CLAUDE.md` — entrypoint pointer to `docs/governance/AGENT_INSTRUCTIONS.md`.
5. `docs/DOCUMENTATION_INDEX.md` — classificatory inventory and index-update
   policy (§6).
6. `docs/governance/DOCUMENTATION_MODEL.md` — proportional-update classes
   (§19), material-phase-contract marker convention (§ "MATERIAL_PHASE_CONTRACT"
   block, verified at lines 605-609).
7. `docs/governance/SUPERVISION_PROTOCOL.md` — roles, authorization format,
   mandatory architect visual-validation gate for new/altered UI (§4).
8. `docs/architecture/CODE_HEALTH_RULES.md` — file-size rule (§7: ideal ≤250,
   acceptable ≤500, exceptional ≤900-with-justification), screen-module
   separation rule (§6), write-module isolation rule (§9).
9. `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (full, 3,750
   lines) — governing spec; §R.16, §R.24.6, §R.24.9, §R.24.10, §R.25 (all
   subclauses), §R.28.6, §R.29 (all subclauses), §R.31 registry.
10. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (full, 1,318 lines) —
    technical contract; §6.2 (PHASE-C1/C2 update blocks), §12, §13.1-§13.18.
11. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` — sequence
    authority; C4 forward references.
12. `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` — requirement matrix;
    `OC-C4-ADMIN-001` row.
13. `docs/architecture/ORDEM_COMPRA_C3D_PHASE_CONTRACT.md` — immediately
    preceding closed material phase contract; structural precedent.
14. `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` — structural
    precedent for an **application/UI-adjacent** material phase contract
    (closer analog to C4 than the DB-only C3D contract).
15. `docs/ledgers/G28_LEDGER.md` (tail) — entry-format convention.
16. `docs/architecture/UI_VISUAL_CONTRACT.md` (full, 354 lines) — **the
    tracked, versioned visual/UI contract for this application**, read in
    response to an explicit mid-task instruction to locate and read the
    applicable visual/UI governance before defining C4's visual contract
    (§13 below). This document's own header states it is "consolidation of
    the `.claude/design-skill/` skill (`inttex-ui`: `SKILL.md` + `README.md`)
    ... because permanent UI rules cannot exist only in `.claude` (which is
    untracked and absent from new worktrees)." Confirmed empirically this
    pass: `.claude/design-skill/` and `.claude/preview/` are **absent** from
    this worktree (`find .claude -iname "*design*" -o -iname "*skill*"` and
    `find .claude -iname preview` both returned nothing) — exactly the
    condition `UI_VISUAL_CONTRACT.md` anticipates. This contract is therefore
    read as authoritative in place of the (absent) skill, per its own stated
    precedence: "this contract **prevails over the skill**."
17. `js/ui.js` (full, 310 lines) — the shared UI-primitive kit
    (`el`, `modal`, `confirmDialog`, `formField`, `textInput`, `selectInput`,
    `dataTable`, `actionButton`, `pageHeader`, `toast`) that
    `UI_VISUAL_CONTRACT.md` requires every screen to reuse rather than
    reinvent (§17).
18. `css/tokens.css` (`--rv-*` tokens) — read to confirm scope: its own header
    states "Não aplicar globalmente; consumo é feito pela tela piloto OP
    Acabamento/Látex nesta fase" (do not apply globally; consumption is by
    the OP Acabamento/Látex pilot screen in this phase) — i.e. the token
    file is **not yet wired into `ordem-compra*.js`** and `index.html` links
    only `css/tokens.css` and the Tabler icon font (no other global
    stylesheet); the `ordem-compra*.js` render family currently builds every
    element via `js/ui.js`'s `el()` with inline Tailwind-style utility
    classes, not `--rv-*` custom properties or a dedicated stylesheet.
19. All targeted product, database, and test files enumerated in the order
    and inventoried in §4 below.

Also considered, per the frontend-design plugin skill located under
`.claude`-adjacent tooling (`~/.claude/plugins/marketplaces/claude-plugins-official/plugins/frontend-design/skills/frontend-design/SKILL.md`):
its guidance is written for **greenfield, brand-defining marketing/product
surfaces** ("take one real aesthetic risk," "the hero is a thesis," a fresh
4-6-hex palette per brief). `UI_VISUAL_CONTRACT.md`'s own precedence rule
("a skill can teach how to apply the pattern, but it cannot contradict the
architecture nor this contract") and the fact that C4 is an **internal
back-office admin screen inside an already-branded, already-tokenized
application** mean that skill's brand-identity/aesthetic-risk guidance does
**not** apply here. The parts of it that remain generically valid regardless
of brief — a firm accessibility floor (responsive down to mobile, visible
keyboard focus, reduced motion respected) and interface-copy discipline
(active voice, name things by what the user controls, errors state what
happened without apologizing, one job per element) — are compatible with,
and already implied by, `UI_VISUAL_CONTRACT.md` §15/§16 and are folded into
§13-§14 below without contradiction.

---

## 2. Governing specifications and exact normative anchors

| Anchor | Exact clause (verbatim excerpt) |
|---|---|
| §R.16 | "Transition modals contain actions only... Every entity lives on its own dedicated screen — the purchase order's home is its detail screen (route `#/ordens-compra/:id`, Phase B2); receipt registration and event history live there, not in a transition modal." |
| §R.24.6 | "Supplier reversal permission is deliberately unresolved and must be decided explicitly before implementation; it cannot be inferred from receipt permission. Supplier UI is deferred and is not part of the first admin receipt UI." |
| §R.24.9 | "The first receipt UI is admin-only and belongs on `#/ordens-compra/:id`, in a persistent **Recebimentos** section. Creation/reversal actions open a dedicated modal and call the canonical RPC. Receipt input must not appear in the OP screen, Pedido screen, production transition modal, or supplier-assignment modal. Supplier receipt UI remains deferred." |
| §R.24.10 | "**C4:** admin receipt UI; a later separately authorized supplier UI may reuse the same RPC subject to its actor/permission contract." |
| §R.25.3-§R.25.4 | Canonical receipt RPC (`registrar_recebimento_ordem_compra`) and admin-only reversal RPC (`estornar_recebimento_ordem_compra`) — see §4.2/§4.3 below for exact signatures. |
| §R.25.6 | Read-model RPC `obter_historico_recebimento_ordem_compra` — "exposes immutable headers, positive/negative entries, allocation and derived real-or-NULL OP attribution, item totals, excess, remaining reversible quantity, inventory movement linkage, and actor-specific allowed actions." |
| §R.25.9 | "C3 owns cutover/import/readers/ACL; C4 owns admin UI and any later supplier UI; C5 is the separate emission gate." |
| §R.28.6 | Phase-C shared-allocation shape table — OP-origin (`op_id` real), Pedido-origin shared (`op_id NULL`, "deliberately absent, never fabricated"), excess (no allocation, no OP). |
| §R.29.1 | Authority/dependency matrix — `js/screens/op-writes.js`, `fornecedor.js`, `pedido-detail-events.js` are named legacy flat writers/compat surfaces, explicitly distinguished from "canonical authority" RPCs. |
| §R.29.2 | Normalized canonical read contract — `op_id`, `origem_tipo`, `kg_recebido_atribuido`, `kg_excesso`; "Pedido-origin rows preserve `op_id = NULL`; no representative or fabricated OP is introduced." |
| §R.29.6 | "C3 creates no visual UI. **C4 exclusively owns the new admin receipt UI at `#/ordens-compra/:id`; supplier UI is deferred.** Existing compatibility surfaces may receive non-visual state-driven adapters or be disabled at cutover, but may not become new UX." |
| §R.29.7 | Legacy-compat DB prerequisites (`listar_ordens_compra_fio_compat`, `registrar_recebimento_ordem_compra_fio_compat`) — inactive unless `canonical_active`; out of C4's call graph (§8 below). |
| §R.31 registry | `OC-C4-ADMIN-001` → anchor `§R.29.6`, owning phase `C4`, requirement text "Own the admin receipt UI at `#/ordens-compra/:id`." `OC-C4-SUPPLIER-001` → `§R.29.6`, `DEFERRED`. `OC-C5-EMISSION-001` → `§R.24.10`, separate post-C4 gate. |
| §6.2 (schema contract, PHASE-C1/C2) | "Cutover/import/readers/flat ACL are C3; **UI is C4**; emission remains inactive until the later C5 gate." "Admin or active matching supplier may register; **only admin may reverse**; no direct client DML." |
| §13.6 | ACL disposition table — `registrar_recebimento_ordem_compra`/`estornar_recebimento_ordem_compra`: `authenticated` = "yes, existing actor checks" / "yes, internal admin"; `PUBLIC`/`anon`/`service_role` = no. |
| §13.15.1/§13.15.2 | Prospective (not-yet-applied) canonical reader shape and post-window ACL closure table — informative only; not the currently-live ACL (§4.3 below is the live ACL). |
| §13.16 | Names PHASE-C4 directly in its unauthorized list: "Unauthorized: C3C-B implementation, C3D, staging application/validation, activation, deployment, real snapshot/import, fence transition, read switch, final ACL-closure invocation, cutover, **C4**, C5, production, `main`, remotes, and push." |

**Reversal-ownership determination (resolves the order's conditional
`UNPROVEN` clause).** The order requires explicit textual proof before
including administrator reversal in scope, and forbids inferring it. Five
independent, mutually reinforcing citations establish it without inference:
§R.24.9 (creation **and** reversal open "a dedicated modal" as one bundled
admin receipt UI), §R.24.10 ("C4: admin receipt UI" — undifferentiated),
§R.25.4 (`estornar_recebimento_ordem_compra` is a real, shipped, admin-gated
RPC — not a future-TBD function), §R.29.6 ("C4 exclusively owns the new admin
receipt UI... supplier UI is deferred" — the only carve-out named is
supplier, not admin reversal), and §R.31's registry row for
`OC-C4-ADMIN-001` (undifferentiated "own the admin receipt UI"). The only
genuinely unresolved reversal question in the canon is **supplier** reversal
(§R.24.6: "deliberately unresolved... cannot be inferred from receipt
permission... not part of the first admin receipt UI") — which is out of
scope for C4 by the same clause. **Disposition: administrator reversal IS
in scope for PHASE-C4. This is not `UNPROVEN`.**

---

## 3. Baseline

- Last accepted material phase: `PHASE-C3D` — `CLOSED /
  ACCEPTED_WITH_NONBLOCKING_DEBT / LOCALLY VERIFIED`, accepted technical
  checkpoint `429aa3980c7027b9d872a1902e2f31f1a4a85a2a`.
- `ACTIVE_PHASE` / `ACTIVE_PHASE_CONTRACT`: `NONE` / `NONE` (confirmed in
  `PROJECT_STATE.md`'s `SPEC_CUSTODY_BOOTSTRAP` block).
- `NEXT_AUTHORIZABLE_ACTION` (as recorded before this pass): "architect
  authorization decision for PHASE-C4 — ADMIN RECEIPT UI (OC-C4-ADMIN-001)...
  the next chat must re-read the canonical repository before authoring or
  executing any PHASE-C4 order." This pass satisfies that precondition (full
  canonical reread, §1 above) and produces the material contract the
  architect's authorization decision requires — it does **not** itself
  constitute that decision.
- `OC-C4-ADMIN-001`: `PLANNED` (traceability matrix, unchanged by this pass —
  see §20).
- Development database (`ucrjtfswnfdlxwtmxnoo`): migration history ends at
  `db/76`; cutover singleton `id=1` is `status='legacy_active'`,
  `read_authority='flat'` (per `PROJECT_STATE.md`'s recorded fingerprint and
  independently confirmed by the DB migration inventory in §4.3 — no
  migration file flips this; only a separate, owner-only, multi-step runbook
  can). This is a **read-only** fact restated for context; this pass performs
  no database access.

---

## 4. Verified current-state inventory

### 4.1 Documentation/governance layer

- `docs/governance/DOCUMENTATION_MODEL.md` §19 classifies a `PROPOSED`,
  not-yet-implemented material phase contract as `READ_ONLY_RECONCILIATION`
  — "no canonical mutation" beyond the new contract file and its index
  registration.
- The `MATERIAL_PHASE_CONTRACT` marker convention (verified at
  `docs/governance/DOCUMENTATION_MODEL.md:605-609`):
  ```text
  <!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
  PHASE_ID: <exact ACTIVE_PHASE value>
  <!-- MATERIAL_PHASE_CONTRACT:END -->
  ```
  This document carries `PHASE_ID: PHASE-C4`, matching the convention used by
  every prior contract (`ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`,
  `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`,
  `ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`). Because
  `ACTIVE_PHASE` remains `NONE` (this pass authorizes no implementation), the
  validator's "exactly one marker, `PHASE_ID` matches `ACTIVE_PHASE` when a
  phase is active" rule is satisfied vacuously (no phase is active) —
  identical to how `ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  existed as a `PROPOSED` marker-bearing document before its own phase became
  active.
- `docs/DOCUMENTATION_INDEX.md` §1 classificatory inventory: the canonical
  path for a material phase contract of this kind is
  `docs/architecture/*_PHASE_CONTRACT.md`, matching every sibling. This
  document's path (`docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md`)
  conforms; §20 below registers it.

### 4.2 Normative layer — lifecycle spec (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`)

Exact clauses are quoted in §2 above and are not repeated here. Key
structural facts not already in §2:

- The spec uses **two independent state vocabularies** that must not be
  conflated: (a) order-level `status_administrativo ∈
  {rascunho,emitida,cancelada}`, `status_aceite ∈
  {nao_aplicavel,pendente,aceita,rejeitada}`, `status_recebimento` (derived),
  `legado` (boolean); (b) a separate cutover **singleton**
  `status ∈ {legacy_active,maintenance_fenced,canonical_active}` with
  `read_authority ∈ {flat,canonical}`. The order's candidate state names
  ("native emitted and receivable," "emitted acceptance-pending," etc.) do
  not exist as literal spec vocabulary; §7 below maps them onto the real
  enums.
- Native receipt eligibility (§R.8, restated §R.25.3): `status_administrativo
  = 'emitida'` (not `rascunho`, not `cancelada`) **and** `status_aceite IN
  ('nao_aplicavel','aceita')`. "Receipt before issuance is prohibited."
- §R.29.6's rollback/recovery clause is the direct textual source for "C4
  exclusively owns the new admin receipt UI... existing compatibility
  surfaces may receive non-visual state-driven adapters or be disabled at
  cutover, but may not become new UX" — the normative basis for §11's
  unchanged-file list and §18's legacy-surface risk.

### 4.3 Normative layer / database layer — effective function definitions

The migration sequence ends at `db/76_ordem_compra_c3c_b_db_prerequisites.sql`
(confirmed — no `db/77` or higher exists). Effective, cumulative (final)
definitions as of `db/76`:

| Function | Owning migration (final def.) | `EXECUTE` grant |
|---|---|---|
| `registrar_recebimento_ordem_compra(p_ordem_id BIGINT, p_idempotency_key TEXT, p_ocorrido_em TIMESTAMPTZ, p_documento_ref TEXT, p_origem_tipo TEXT, p_origem_ref TEXT, p_linhas JSONB) RETURNS JSONB` | `db/75` (thin cutover-gate wrapper around the `db/74`-corrected body, renamed `_c3c_registrar_recebimento_impl`) | `authenticated` only |
| `estornar_recebimento_ordem_compra(p_ordem_id BIGINT, p_idempotency_key TEXT, p_ocorrido_em TIMESTAMPTZ, p_motivo TEXT, p_linhas JSONB) RETURNS JSONB` | `db/75` (thin cutover-gate wrapper around the `db/70` body, renamed `_c3c_estornar_recebimento_impl`) | `authenticated` only |
| `obter_historico_recebimento_ordem_compra(p_ordem_id BIGINT) RETURNS JSONB` | `db/70` (never replaced; `db/74` updated only its `COMMENT`) | `authenticated` only |
| `obter_ordem_compra_admin(p_ordem_id BIGINT) RETURNS JSONB` | `db/69` (never replaced after) | `authenticated` only |
| `registrar_recebimento_ordem_compra_fio_compat(p_ordens_compra_fio_id BIGINT, p_kg_total_absoluto NUMERIC, p_data_recebimento DATE, p_idempotency_key TEXT, p_documento_ref TEXT DEFAULT NULL, p_origem_ref TEXT DEFAULT NULL) RETURNS JSONB` | `db/76` (single definition; legacy-compat adapter, out of C4's call graph — §8) | `authenticated` only |

No function above is ever granted to `PUBLIC`, `anon`, or `service_role`.
Authority is narrowed **inside** each function body (`is_admin()` / supplier
`fornecedor_id` match), not by GRANT scoping.

**Exact return shape of `obter_historico_recebimento_ordem_compra`** (the
UI-critical history/read-model RPC — verified against the `db/70` function
body):

```json
{
  "ok": true, "codigo": "ok",
  "ordem_compra_id": 0,
  "status_administrativo": "", "status_aceite": "", "status_recebimento": "",
  "ator_tipo": "admin | fornecedor",
  "acoes": { "receber": false, "estornar": false },
  "itens": [
    { "item_id": 0, "material": "", "cor_id": 0, "cor_poliester": "",
      "kg_pedido": 0, "kg_recebido": 0, "kg_restante": 0, "kg_excesso": 0,
      "alocacoes": [ { "alocacao_id": 0, "op_id": null, "kg_alocado": 0,
                        "kg_recebido": 0, "kg_restante": 0 } ] }
  ],
  "comandos": [
    { "id": 0, "comando_tipo": "recebimento | estorno", "ator_tipo": "",
      "ocorrido_em": "", "documento_ref": null, "origem_tipo": "",
      "origem_ref": null,
      "lancamentos": [
        { "id": 0, "linha_indice": 0, "item_id": 0, "alocacao_id": null,
          "op_id": null, "material": "", "cor_id": 0, "cor_poliester": "",
          "kg": 0, "kg_excesso": 0, "estorno_de_id": null,
          "kg_reversivel": 0,
          "movimento_estoque": { "id": 0, "kg_excedente_delta": 0,
                                  "excesso_antes": 0, "excesso_depois": 0 } }
      ] }
  ]
}
```

Failure shape: `{"ok": false, "codigo": "sem_permissao" | "ordem_nao_encontrada"}`.

**Server-derived action-availability logic (verified from the installed
function body — this is the exact rule the UI must trust, never
reimplement):**

- `acoes.receber = NOT legado AND status_administrativo = 'emitida' AND
  status_aceite IN ('nao_aplicavel','aceita')`.
- `acoes.estornar = is_admin() AND EXISTS(a positive receipt line with
  remaining reversible kg > 0)`. This flag does **not** re-check
  `status_administrativo`/`status_aceite`/`legado` — it is evaluated purely
  from actor identity and existing reversible ledger lines. A cancelled or
  acceptance-rejected order that already has prior positive receipts will
  still surface `acoes.estornar: true` if a reversible balance remains.
- `obter_historico_recebimento_ordem_compra` and `obter_ordem_compra_admin`
  carry **no cutover-state gate** — both readers are always callable
  regardless of `legacy_active`/`maintenance_fenced`/`canonical_active`.
  Only the two **writer** RPCs (`registrar_recebimento_ordem_compra`,
  `estornar_recebimento_ordem_compra`) carry the cutover gate, returning
  `{"ok":false,"codigo":"recebimento_canonico_inativo"}` when
  `status <> 'canonical_active' OR read_authority <> 'canonical'` — which is
  the case for every call today (§18 risk). **This means `acoes.receber`
  can be `true` while a receipt attempt still deterministically rejects with
  `recebimento_canonico_inativo`; the UI must treat that rejection as a
  normal, expected, non-fatal business outcome (toast), never as a bug to
  route around.**

Full per-function business-rule, error-code, and grant detail (validation
order, idempotency namespace, allocation-shape checks, reversal LIFO/floor
rules, catch-all `erro_interno`) is recorded in the implementation-time
diagnosis this contract's future implementation order must re-verify against
the then-current `HEAD`; it is not reproduced exhaustively here to keep this
document's own size within `CODE_HEALTH_RULES.md` §7 guidance, and because
none of it requires a new migration (§9).

### 4.4 Application layer — existing product files

Verified by direct read of all fourteen files named in the order:

- **`#/ordens-compra/:id` already exists and is live**: `js/router.js:136-142`
  registers the dynamic route
  `^#\/ordens-compra\/(\d+)$` → `window.screenOrdemCompra(Number(id))`,
  `roles: ['admin']`. No `js/boot.js` change is needed for the route itself
  (`boot.js` only registers **exact-match** routes; the dynamic `:id` pattern
  is handled entirely inside `router.js`'s `matchRoute()` fallback).
- The current detail screen (`js/screens/ordem-compra.js` 54 lines +
  `-data.js` 115 + `-render.js` 230 + `-events.js` 45 + `-distribuicao.js`
  171) supports only: view header/items/admin-event-history
  (`obter_ordem_compra_admin`), cancel order (`cancelar_ordem_compra`),
  link to parent Pedido, and a read-only, always-disabled Emitir button and
  disabled distribution controls. **No receipt-registration, receipt-history,
  or reversal UI exists anywhere in this file family** — confirmed by full
  reads and an empty grep for `estorno`/any receipt RPC call across all five
  files.
- `js/screens/common.js` (302 lines) contains **only** `shellLayout()` and
  `ADMIN_MENU` — despite its name, it holds no modal/RPC/idempotency helpers.
  Reusable primitives instead live in `js/ui.js` (§1 item 17) and, for the
  idempotency/transport-classification **pattern** specifically (not the
  legacy RPC calls themselves), in
  `js/screens/ordem-compra-receipt-cutover.js`.
- **`js/screens/ordem-compra-receipt-cutover.js` (298 lines) is the shared
  PHASE-C3C-B legacy-compat adapter.** It exports
  `attemptCanonicalRead`/`attemptCanonicalReceipt`, which call
  `listar_ordens_compra_fio_compat`/`registrar_recebimento_ordem_compra_fio_compat`
  — the **absolute-total, legacy `ordens_compra_fio`-row-grain** RPC pair,
  not the native purchase-order entity. Its current callers are exclusively
  legacy/compat surfaces: `js/screens/op-writes.js`
  (`registrarRecebimentoOrdemFio`), `js/screens/fornecedor.js`
  (`screenFornecedorOrdens`), `js/screens/pedido-detail-data.js`
  (`loadPedidoDetailData`), and `js/screens/pedido-detail-events.js`
  (`buildInsumosTransferForm`, via the `op-writes.js` wrapper). None of the
  `ordem-compra*.js` files import it today. **This concretely confirms the
  order's named risk**: the only currently-wired "native-looking" receipt
  writer path in the codebase is in fact the legacy absolute-total adapter —
  C4 must not wire its native writer through it (§8, §11).
- **A receipt-registration UI already exists — but entirely outside the
  `ordem-compra*.js` family.** It lives inside
  `js/screens/pedido-detail-events.js`'s generic stage-transition modal
  (`buildInsumosTransferForm`, wired to the `Insumos>Tecelagem` transition,
  ~line 1274-1379), plus an independent copy in
  `js/screens/fornecedor.js`'s `screenFornecedorOrdens()`. Both write through
  the legacy compat adapter above, at the legacy `ordens_compra_fio` row
  grain (not the native `ordem_compra` entity). **This concretely confirms
  the order's second named risk**: a purchase-order/receipt entity UI already
  exists, duplicated inside a Pedido transition modal — C4 must not create a
  second, competing copy inside `ordem-compra*.js` (§11), and this contract
  makes no decision to decommission the existing one (§18).
- `index.html` loads all screen scripts as plain, sequential, non-module
  `<script>` tags (no dynamic loader). `ordem-compra-receipt-cutover.js` is
  loaded very early (right after `js/supabase-client.js`, before
  `router.js`/`common.js`/any screen); the `ordem-compra-*` family loads
  later, in the order data → render → events → distribuicao → list →
  `ordem-compra.js`; `boot.js` is the last script tag. **Any new file
  requires an explicit new `<script src="...">` line in `index.html`** — no
  glob/dynamic loader exists.

### 4.5 Test layer

Twenty existing files match `tests/*ordem*compra*`. Coverage relevant to C4,
verified by grep (not inferred from filenames):

| Area | Status | Evidence |
|---|---|---|
| Detail screen rendering (current states) | PRESENT | `tests/ordem-compra.smoke.js` (VM/DOM render harness driving the real `screenOrdemCompra`) |
| Receipt/reversal rendering | **ABSENT** | No button/handler/`acoes.receber`/`acoes.estornar` consumption anywhere in `js/` or `tests/` |
| Native receipt writer (`registrar_recebimento_ordem_compra`) | PRESENT at SQL-integration layer only | `tests/ordem-compra-hybrid-origin-f1.integration.sql`; no JS-level test exists |
| Native reversal (`estornar_recebimento_ordem_compra`) | PRESENT | `tests/ordem-compra-hybrid-origin-f1.integration.sql:224-239` (live, successful); `tests/ordem-compra-c3c-inactive.integration.sql:112-117` |
| History read model (`obter_historico_recebimento_ordem_compra`) | PARTIAL — static contract only | `tests/ordem-compra-native-receipt.smoke.js:158-186`; **never actually invoked by any test** |
| Idempotency / ambiguous-transport retry | PRESENT for compat adapter + supplier screen; **ABSENT for the native RPCs/admin UI** | `tests/ordem-compra-receipt-cutover.smoke.js`; `tests/fornecedor-screens.smoke.js:1201` |
| Legacy-compat adapter | PRESENT, extensive | `tests/ordem-compra-receipt-cutover.smoke.js` (29 tests); `tests/ordem-compra-c3c-b-db-prerequisites.*` |
| Shared Pedido-origin NULL-`op_id` | PRESENT, static + live | `tests/ordem-compra-hybrid-origin-f1.integration.sql:196-259` |
| Server-derived action availability (`acoes.receber`/`acoes.estornar`) | **ABSENT** | Zero repo-wide hits for `can_receive`/`can_reverse`/`acoes.receber`/`acoes.estornar` outside the DB function body itself |
| UI error handling on the ordem-compra screen | PARTIAL — load path + generic `rpcWrite()` only | `tests/ordem-compra.smoke.js:163-267` |
| Route resolution for `#/ordens-compra/:id` | **ABSENT** | Zero matches in `tests/boot.smoke.js`/`tests/router.smoke.js`; `tests/ordem-compra.smoke.js` calls `screenOrdemCompra(100)` directly, bypassing `router.js` entirely |

### 4.6 Visual/UI governance layer

`docs/architecture/UI_VISUAL_CONTRACT.md` (354 lines, read in full) is the
ratified, versioned source. Its rule taxonomy (§0.1-§0.2) classifies rules as
`GLOBAL` (apply everywhere: `--rv-*` tokens when in use, low curvature, flat
cards, pt-BR, honest empty states, table golden rule, component reuse,
functional iconography), `SCREEN-FAMILY` (two-column cockpit/rail — for
administrative **detail** screens, "when compatible"), `COMPONENT-SPECIFIC`
(badge, modal, table, destructive button, row-level icon button §8.1), and
`OBSERVED-PATTERN`/`OPEN` (pilot-only values not yet promoted to norms, e.g.
exact modal dimensions, formal breakpoints, WCAG conformance level). §13
below applies this taxonomy concretely to C4.

Also verified this pass: `css/tokens.css` (`--rv-*`) is explicitly scoped by
its own header to the OP Acabamento/Látex pilot only and is **not yet linked
to or consumed by** the `ordem-compra*.js` family; `index.html` links no
other global stylesheet. The `ordem-compra*.js` render family instead builds
every element through `js/ui.js`'s `el()` with inline utility classes
(Tailwind-style strings), matching the pattern in `js/ui.js` itself
(`modal()`, `formField()`, `dataTable()`, `actionButton()`).

---

## 5. Root gap

The admin receipt UI required by `OC-C4-ADMIN-001` (§R.29.6, §R.31) does not
exist. The purchase order's own detail screen (`#/ordens-compra/:id`) is
live but receipt-inert. The only receipt-registration UI that exists today
lives outside the purchase-order entity, embedded in a Pedido transition
modal and a supplier screen, and both write through the legacy
absolute-total compat adapter — not the native, item/allocation-shaped
receipt RPCs (§R.25.3-§R.25.4) that already exist, are already fully
signed, ACL'd, and idempotency-contracted, and are already exposed by a
complete read model (`obter_historico_recebimento_ordem_compra`) with
server-derived action-availability flags. **The gap is purely an
application/UI gap, not a database gap** (§9).

---

## 6. Exact functional scope (reconciliation Q1)

In scope for `PHASE-C4` / `OC-C4-ADMIN-001`:

1. **Registering an administrative native receipt** via
   `registrar_recebimento_ordem_compra`, for `modelo === 'nativo'` orders
   only (§7).
2. **Rendering item/allocation remaining quantities** — sourced from
   `obter_historico_recebimento_ordem_compra`'s `itens[]`/`alocacoes[]`
   (`kg_restante` fields), never recomputed client-side.
3. **Explicit excess entry** — a receipt line with `destino='excesso'`
   (no allocation, no fabricated OP), per §R.28.6/§R.29.2, rendered and
   submitted distinctly from allocation lines.
4. **Receipt command history** — the persistent **Recebimentos** section
   named by §R.24.9, rendering `comandos[]` (both `recebimento` and
   `estorno` entries) with actor, timestamp, document/origin metadata, and
   per-line allocation/excess/`op_id` attribution (rendering `op_id: null`
   as a valid, first-class state for shared Pedido-origin and excess lines
   — never as an error or a fabricated OP).
5. **Administrator reversal** via `estornar_recebimento_ordem_compra` — IN
   SCOPE, per the resolved determination in §2 (not `UNPROVEN`).
6. **Document and origin metadata** — `documento_ref`, `origem_tipo`,
   `origem_ref` on submission; rendered back from `comandos[]`.
7. **Replay/ambiguous-transport behavior** — one idempotency-token attempt
   per open form/action, reused only on a genuine transport-ambiguous
   failure, per §12.

Explicitly **out of scope** (do not include, do not infer):

- Supplier receipt UI (`OC-C4-SUPPLIER-001`, `DEFERRED`).
- Native emission activation (`OC-C5-EMISSION-001`, separate post-C4 gate;
  `pode_emitir` is hard-coded `false` in `obter_ordem_compra_admin` and
  `emitir_ordem_compra` is granted to no role — confirmed, §4.3/§18).
- Any receipt/reversal UI for `modelo === 'legado'` orders (stays exactly as
  today — read-only detail; legacy receipt remains the existing
  `fornecedor.js`/`pedido-detail-events.js`/`op-writes.js` compat surfaces,
  §11).
- Any change to distribution ownership, Pedido/Insumos surfaces, or the
  existing (disabled) Emitir/distribute controls.
- REAL_CUTOVER, the 13 unmapped legacy-row disposition, `close_final_acl`,
  canonical activation, the read-authority switch, migrations, database
  writes, staging/production/deployment/push.

---

## 7. Exact actor/state/action matrix (reconciliation Q2)

Action availability is **entirely server-derived** from
`obter_historico_recebimento_ordem_compra`'s `acoes` object (§4.3). The
browser must render, never reconstruct, this authority. The table below maps
the order's requested state classes onto the real vocabulary and the
resulting render behavior:

| Order class | Real vocabulary | `acoes.receber` | `acoes.estornar` | C4 render behavior |
|---|---|---|---|---|
| Native draft | `legado=false`, `status_administrativo='rascunho'` | `false` | reflects existing reversible lines (rare/none for a draft) | Recebimentos section **not rendered** (no receipt has ever been possible pre-emission); unchanged from today |
| Native emitted and receivable | `legado=false`, `status_administrativo='emitida'`, `status_aceite ∈ {nao_aplicavel,aceita}` | `true` | reflects existing reversible lines | Recebimentos section renders; "Registrar recebimento" enabled; per-line reversal buttons render only where `kg_reversivel > 0` |
| Native emitted, acceptance pending | `status_aceite='pendente'` | `false` | reflects existing reversible lines (independent of `status_aceite` — verified from the installed function body, §4.3) | Recebimentos section renders (read-only history); "Registrar recebimento" hidden/disabled; existing reversible entries, if any, remain reversible |
| Native emitted, rejected | `status_aceite='rejeitada'` | `false` (distinct writer code `aceite_rejeitada`) | reflects existing reversible lines | Same as acceptance-pending |
| Native cancelled | `status_administrativo='cancelada'` | `false` | reflects existing reversible lines (the installed reversal RPC's own gate does not exclude cancelled orders — verified fact, not an assumption; flagged as a risk in §18, not something C4 client code can or should override) | Recebimentos section renders (read-only history); reversal only where server flag allows |
| Imported legacy | `legado=true` (any `status_administrativo`) | `false` (native writer explicitly rejects `legado` orders) | `false` in practice for C4's screen — **C4 renders no Recebimentos section at all for `modelo==='legado'` orders**; legacy receipt/reversal stays on the existing compat surfaces (§11), unchanged |
| Missing/inactive canonical functions | N/A — not a PO state; see cutover row below | — | — | — |
| Pre-cutover (`legacy_active`) | Cutover singleton `status='legacy_active'`, `read_authority='flat'` — **the current, live state** | Order-derived flag may still be `true` | Order-derived flag may still be `true` | Buttons render per the order-derived flags (unchanged); a receipt/reversal **attempt** deterministically rejects with `recebimento_canonico_inativo`, rendered as a normal business-rejection toast, never a client-side pre-check bypass (§4.3, §12) |
| `maintenance_fenced` | Cutover singleton `status='maintenance_fenced'` | Same as above | Same as above | Same as above (writer still rejects; readers unaffected — no cutover gate on reads, §4.3) |
| `canonical_active` | Cutover singleton `status='canonical_active'`, `read_authority='canonical'` | Order-derived flag governs | Order-derived flag governs | First state in which a receipt/reversal attempt can actually succeed, subject to the order-level gates above — out of reach without a separately authorized REAL_CUTOVER (§9, §18) |

---

## 8. Exact API ownership matrix (reconciliation Q3)

| UI operation | Owning RPC | Caller |
|---|---|---|
| Native detail-screen receipt registration | `registrar_recebimento_ordem_compra` | New `js/screens/ordem-compra-receipt-data.js` (§10) — direct `window.supa.rpc(...)` call, no intermediary adapter |
| Native administrator reversal | `estornar_recebimento_ordem_compra` | Same module |
| Native receipt/history projection | `obter_historico_recebimento_ordem_compra` | Same module |
| Base order header/items/events (unchanged) | `obter_ordem_compra_admin` | Existing `js/screens/ordem-compra-data.js` (unchanged, §11) |
| Legacy compatibility adapter | `registrar_recebimento_ordem_compra_fio_compat` (and its JS wrapper `js/screens/ordem-compra-receipt-cutover.js`) | **Out of C4's call graph entirely.** C4 must not import, call, or extend `ordem-compra-receipt-cutover.js`. |
| Legacy compatibility surfaces (non-visual C3C-B adapters) | `op-writes.js`, `fornecedor.js`, `pedido-detail-data.js`, `pedido-detail-events.js` | Unchanged; continue serving legacy (`modelo==='legado'`) flows independently; C4 makes no consolidation or decommission decision |

**Binding scoping rule (explicit, not left to implementer inference):**
`js/screens/ordem-compra-receipt-cutover.js` is the PHASE-C3C-B **legacy**
adapter by name, scope, and every existing caller (§4.4). Even though its
generic idempotency-token/transport-classification primitives
(`newIdempotencyToken`, `createAttemptTracker`, `isTransportAmbiguous`) are
RPC-agnostic in shape, C4 must implement its **own**, structurally
independent copies of that pattern inside `ordem-compra-receipt-data.js`
rather than import from the legacy module. Rationale: (a) it eliminates any
risk of a future legacy-module change silently affecting the native path or
vice versa; (b) it matches this project's own repeated emphasis on
native/legacy path isolation (e.g. the C3C-B §28 supplier-reader-disposition
correction); (c) it satisfies the order's explicit prohibition on the native
screen "accidentally using a legacy absolute-total adapter as its native
writer" by construction, not by convention. This is a deliberate, evidenced
design ruling for the future implementation order, not an open question.

**No native failure may silently fall back to direct flat mutation.** A
`registrar_recebimento_ordem_compra`/`estornar_recebimento_ordem_compra`
hard failure (any non-ambiguous rejection) must render as a deterministic
business error (toast), exactly like the existing `rpcWrite()` pattern in
`js/screens/ordem-compra-events.js` — never as a trigger to write to
`ordens_compra_fio` or any other flat table.

---

## 9. Database prerequisite disposition (reconciliation Q4)

**No database prerequisite is required.** First preference — UI-only reuse
of the existing, accepted RPCs and read model — is fully satisfiable:
`registrar_recebimento_ordem_compra`, `estornar_recebimento_ordem_compra`,
and `obter_historico_recebimento_ordem_compra` are complete, stable,
correctly-signed, ACL'd (§4.3), and the read model already returns every
field a correct UI needs (item/allocation remaining quantities, excess,
`op_id`-nullable attribution, command history with document/origin metadata,
and server-derived `acoes.receber`/`acoes.estornar`). No migration is
proposed by this contract, and none is authorized.

This is distinct from — and does not require resolving — the fact that the
writer RPCs are currently **inert** under the live `legacy_active` cutover
state and that no native order can currently reach `status_administrativo=
'emitida'` (§18). That is an **activation-state** fact, separately and
explicitly gated behind `REAL_CUTOVER`/`PHASE-C5`, not a missing database
capability. A correct C4 UI must render and behave correctly in exactly this
inert state today (§7's `legacy_active` row) — it does not need the
database to change to be correctly built, wired, and tested at the fixture
level.

---

## 10. Exact projected product-file manifest (reconciliation Q5)

No wildcard or directory-level authorization exists; the list below is
closed and exact.

**New files (three), justified by `CODE_HEALTH_RULES.md` §6 (screens must
not become a dump of writes/helpers/functions from other screens) and §9
(Supabase writes must stay in explicit write modules; render functions must
not perform DML):**

1. `js/screens/ordem-compra-receipt-data.js` — `obter_historico_recebimento_ordem_compra`
   loader; `registrar_recebimento_ordem_compra` writer;
   `estornar_recebimento_ordem_compra` writer; independent
   idempotency-token/attempt-tracker/transport-ambiguity-classifier
   primitives (§8's binding scoping rule). No DOM code.
2. `js/screens/ordem-compra-receipt-render.js` — renders the persistent
   **Recebimentos** section (§R.24.9): item/allocation remaining-quantity
   table, receipt command history (`comandos[]`), receive/reverse buttons
   gated strictly by `acoes.receber`/`acoes.estornar` per row/entry. No RPC
   calls, no DML (pure render, per CODE_HEALTH §9).
3. `js/screens/ordem-compra-receipt-events.js` — wires the receive button to
   a dedicated registration modal (allocation-line inputs + one explicit
   excess line, built from `js/ui.js` primitives) and each reversal button
   to a dedicated reversal modal (per-`lancamento_id` kg + `motivo`);
   submits through `ordem-compra-receipt-data.js`; owns the two independent
   attempt trackers (§12).

**Modified files (one product file + one manifest file):**

4. `js/screens/ordem-compra.js` — additive orchestration only: load receipt
   history alongside the existing `loadOrdemDetail`/`loadDistribuicao`
   calls, render the new Recebimentos section into the existing detail
   container (only when `modelo==='nativo'`), and merge the new module's
   handlers into the existing `handlers` object alongside the unchanged
   `cancelar` handler.
5. `index.html` — three new `<script src="js/screens/ordem-compra-receipt-*.js?v=...">`
   tags, added among the existing `ordem-compra-*` entries, loaded before
   `js/screens/ordem-compra.js` (matching the existing file family's own
   load-order convention). No other line changes.

No other product file is authorized for modification by a future C4
implementation order. §11 makes the negative list explicit.

---

## 11. Explicit unchanged-file list (reconciliation Q6)

**Confirmed unchanged, with evidence (not merely presumed):**

- `js/router.js` — the dynamic `#/ordens-compra/:id` route already exists
  (§4.4); no change needed.
- `js/boot.js` — only registers exact-match routes; the dynamic `:id` route
  is handled entirely by `router.js`; no change needed.
- `js/screens/common.js` — holds only `shellLayout`/`ADMIN_MENU`; nothing
  C4 needs to add or change here.

**Explicitly prohibited from modification by a future C4 implementation
order** (per the order's list, confirmed applicable):

- `js/screens/fornecedor.js` (supplier UI — deferred, `OC-C4-SUPPLIER-001`).
- `js/screens/op-writes.js` (OP receipt UI / legacy flat writer).
- `js/screens/pedido-detail-events.js`,
  `js/screens/pedido-detail-data.js` (Pedido transition modals / C3C-B
  compatibility surfaces — the existing modal-embedded receipt UI stays
  exactly as-is; no decommission decision is made here, §18).
- `js/screens/ordem-compra-receipt-cutover.js` (C3C-B compatibility
  adapter — out of C4's call graph, §8).
- `js/screens/ordem-compra-distribuicao.js` (distribution ownership).
- `js/screens/ordem-compra-render.js`, `js/screens/ordem-compra-data.js`,
  `js/screens/ordem-compra-events.js` (existing detail-screen modules —
  left byte-unchanged; all new logic lives in the three new receipt-\*
  modules, per §10's manifest, so the existing files need no edits at all,
  not even additive ones).
- Emission controls (the disabled Emitir button in
  `js/screens/ordem-compra-render.js`, already covered above).
- All `db/*.sql` migrations.
- All `scripts/c3d/*` cutover-rehearsal scripts.
- Any test file not newly authored for C4 (existing tests remain green,
  unmodified, except where an existing test's own fixture must gain new
  `acoes` fields it does not yet exercise — to be scoped precisely by the
  future implementation order, not this contract).

If any prohibited file is later found to be genuinely required, the
implementation order must stop and report the exact architectural reason
before proceeding — this contract does not pre-authorize that exception.

---

## 12. Error and idempotency contract (reconciliation Q7)

- **Two independent attempt trackers**, not one: one for the receipt-
  registration form/action, one for the reversal form/action — matching the
  order's "independent attempt identities for receipt and reversal"
  requirement and mirroring §R.25.1's namespace-per-command-type design.
- **Token minting**: a fresh idempotency token is minted when a
  registration/reversal modal opens (one attempt tracker instance per open
  modal), scoped to `ordem-compra-receipt-data.js` (§8's binding scoping
  rule — not shared with `ordem-compra-receipt-cutover.js`).
- **Stable token reuse**: the same token is resubmitted **only** after a
  genuinely ambiguous transport failure — classified identically in spirit
  to the existing, proven pattern (`res.status === 0` and an error present;
  every other HTTP status, including permission/data/schema errors with a
  real status, is a deterministic `hard_failure`), but implemented as an
  independent function inside the new module, not imported from the legacy
  adapter.
- **New token after any deterministic outcome**: both success and every
  deterministic rejection (`recebimento_canonico_inativo`,
  `aceite_pendente`, `aceite_rejeitada`, `excede_alocacao`, `excede_item`,
  `excede_estornavel`, `idempotencia_conflitante`, `sem_permissao`,
  `fornecedor_incorreto`, `erro_interno`, etc.) invalidate the current
  attempt and mint a new token on the next submission — never silently
  reused across a changed intent.
- **No persistence outside the in-memory closure**: no `localStorage`,
  `sessionStorage`, URL parameter, or database-side token store. The token
  lives only for the lifetime of the open modal's closure, exactly as
  `createAttemptTracker()`'s existing proven shape already does — C4
  reimplements the shape, not the module (§8).
- **No fallback write after ambiguity**: an ambiguous outcome never
  triggers a flat-table write, a call to the legacy compat adapter, or any
  other alternate mutation path. The only recovery is a same-token retry of
  the same native RPC.
- **Deterministic business rejections render as toasts**, using the
  existing `rpcWrite()`-style pattern (`js/screens/ordem-compra-events.js`)
  as the house convention — red toast, form stays open with the entered
  values intact, no page reload.
- **Success is followed by an authoritative reload**: after a deterministic
  success, both `obter_historico_recebimento_ordem_compra` and (if item
  totals are shown from it) `obter_ordem_compra_admin` are re-fetched — the
  UI never locally mutates its own state to simulate the new balance.

---

## 13. Visual contract, component structure, interaction pattern, and responsive behavior

Authored against `docs/architecture/UI_VISUAL_CONTRACT.md` (§1 item 16,
§4.6), the tracked, versioned, and — per its own stated precedence — binding
visual governance for this application. Rule-taxonomy tags (`GLOBAL`,
`SCREEN-FAMILY`, `COMPONENT-SPECIFIC`, `OBSERVED-PATTERN`, `OPEN`) are
carried over from that document's §0.1-§0.2 so a future implementer can tell
at a glance which rules are non-negotiable and which are still open
decisions.

### 13.1 Component structure

- **Section container** (`SCREEN-FAMILY`, §6 of the visual contract): the
  new Recebimentos section opens with an icon chip (20-22px, radius 4px,
  `--rv-color-chip-bg`, 13px glyph, `--rv-color-chip-glyph`) + an 11px
  uppercase section label ("RECEBIMENTOS"), distinct from the existing
  header/items/event-history chips already on the screen. **Forbidden**
  (§6, `GLOBAL`): a vertical blue bar, solid strip, border-pseudo-icon, or a
  numbered header ("1. Itens", "2. Recebimentos").
- **Item/allocation remaining-quantity table**: reuses `js/ui.js`'s
  `dataTable()` unmodified. Per the table golden rule (§7, `GLOBAL`):
  numeric columns (`kg_pedido`, `kg_recebido`, `kg_restante`, `kg_excesso`)
  are `text-right` in both header and values, every number carries
  `.tnum`/tabular-nums, decimal comma with unit (e.g. `183,000 kg`), and
  header/value column widths stay identical (fixed `table-layout` or a
  shared `grid-template-columns`).
- **Receipt command history**: a `dataTable()`-based list of `comandos[]`,
  one row per command (`recebimento`/`estorno`), with a nested/expandable
  presentation of each command's `lancamentos[]`. Free-form fields with
  variable length (`documento_ref`, `origem_ref`, `motivo`) that share a row
  with fixed-width siblings follow §7.1 (`GLOBAL`): single-line ellipsis +
  `title` tooltip carrying the untruncated value, omitted when the field is
  a fallback placeholder (`—`).
- **Registration modal and reversal modal**: both built from `js/ui.js`'s
  `modal()` + `formField()` + `textInput()`/`selectInput()` unmodified —
  same header/content/footer structure, same `Cancelar`/`Salvar` footer
  pattern, same `--rv-radius-card`(6px)/border(`#eceef1`) card shape already
  used by every other modal in the app (`COMPONENT-SPECIFIC`, §12 of the
  visual contract). The registration modal renders one input row per
  eligible allocation (kg input, capped client-side for UX only — the real
  cap is server-enforced by `excede_alocacao`/`excede_item`) plus exactly
  one explicit "Excesso" row (no allocation picker). The reversal modal
  renders one row per reversible `lancamento` (kg input, capped at
  `kg_reversivel`) plus a required `motivo` field.
- **Receive/reverse buttons**: the section-level "Registrar recebimento"
  action is the section's one dominant action (§8 `GLOBAL`: "one dominant
  action per decision scope," filled `bg-accent text-white`, radius 4px,
  ~38px), placed next to the Recebimentos section header, not competing
  with the screen's existing "Cancelar ordem" action (a different decision
  scope). Per-entry reversal actions are **row-level** actions inside the
  command-history table — per §8.1 (`COMPONENT-SPECIFIC`), a row-level
  reversal button MAY be icon-only (exempt from the "destructive always
  icon+text" rule) **only if all three §8.1 guards hold**: (1) `title` +
  matching `aria-label` stating the action in full (e.g. `"Estornar
  recebimento"`), (2) a visually-hidden clip-rect sr-only label (never
  `display:none`), (3) `confirmDialog` (`js/ui.js`) gates the action before
  it fires — reversal is destructive and must never execute on a single
  click. If those three guards are not all implemented, the button must
  instead follow the entity-level icon+text destructive rule (§8), not the
  row-level exemption. This choice is left to the implementation order,
  which must record which pattern it used and why. Both patterns reuse
  `js/ui.js`'s `actionButton()`/`confirmDialog()` unmodified.
- **`--rv-*` tokens are not used** for this section: `css/tokens.css` is
  explicitly scoped to the OP Acabamento/Látex pilot and is not linked into
  the `ordem-compra*` render path (§4.6). C4 follows the **same** visual
  contract (colors, radii, typography) via the literal utility-class/inline
  values already used throughout `js/ui.js` and `ordem-compra-render.js`
  (e.g. `#2563eb` accent, `#eceef1` border, `rounded-lg`), not by newly
  wiring the token stylesheet into this screen family — that wiring, if ever
  desired, is a separate, explicitly authorized design-system-rollout
  decision, out of scope for C4.

### 13.2 Interaction pattern

- Action availability is rendered, never computed client-side (§7 above) —
  a hidden/disabled control is never re-enabled by client logic.
- Opening the registration or reversal modal mints a fresh idempotency
  attempt (§12); closing without saving discards it; a second open mints a
  new one.
- Save is disabled/spinning ("Salvando...") during the in-flight request,
  matching `js/ui.js`'s existing `modal()` `onSave` pattern exactly (no new
  loading-state component).
- Success closes the modal and triggers the authoritative reload (§12);
  deterministic rejection keeps the modal open with a red toast and the
  entered values intact; ambiguous failure keeps the modal open, offers a
  same-token retry, and never silently falls back.
- Copy follows the house register (`UI_VISUAL_CONTRACT.md` §16, `GLOBAL`):
  pt-BR, short neutral labels in Title Case, active voice on controls
  ("Registrar recebimento," not "Enviar" or "Submeter"), and error/empty
  states stated plainly without apology (e.g. "Nenhum recebimento
  registrado ainda." for an order with no `comandos[]`, never a fabricated
  placeholder row).

### 13.3 Responsive behavior

`UI_VISUAL_CONTRACT.md` §5/§14 marks the two-column cockpit/rail as
`SCREEN-FAMILY` ("administrative detail screens, **when compatible**") and
formal breakpoints/narrow-screen stacking as explicitly `OPEN — REQUIRES
IALEAD DECISION`. This contract does **not** resolve that open point — the
existing `ordem-compra` detail screen does not currently use the cockpit/
rail layout (§4.4: single-column detail with cards), so the Recebimentos
section is specified to extend that same single-column layout (full content
width up to 1600px, §5 `GLOBAL`), not to introduce a new cockpit/rail split
as part of C4. If the architect later decides the order detail screen should
adopt the cockpit/rail pattern, that is a separate, explicitly authorized
visual-system decision applying to the whole screen, not something C4
should introduce unilaterally for the Recebimentos section alone. Tables use
`overflow-x:auto` wrappers so fixed-width columns never disappear off-screen
(§7 `GLOBAL`), which is the only responsive behavior this contract commits
to as binding.

### 13.4 Visual-validation procedure

`UI_VISUAL_CONTRACT.md` §18 requires real rendering in an authorized
harness, with an explicit fallback: "when [`​.claude/preview`] is not
available in the worktree, use a versioned harness or an explicitly
authorized equivalent, and record the evidence." This pass confirmed
`.claude/preview/*.html` is **absent** from this worktree (§1 item 16). No
tracked HTML preview harness exists in the repository either (`find . -iname
"preview*.html"` returned nothing). The versioned-harness equivalent that
**does** exist and is already proven for this exact screen family is
`tests/ordem-compra.smoke.js`'s VM/DOM render harness — it loads the real
screen JS into a Node VM against a real (jsdom-less, hand-built) `document`
and asserts on the resulting DOM tree, the same technique already used to
verify `#oc-cancelar` rendering, disabled-Emitir rendering, and legacy
read-only rendering (§4.5). The C4 implementation order must:

1. Extend `tests/ordem-compra.smoke.js` (or a new sibling smoke test scoped
   to the three new receipt-\* files) with the same VM/DOM technique,
   asserting the Recebimentos section's structure, the golden-rule table
   alignment, the gated receive/reverse buttons per the §7 matrix, and the
   modal contents — this is the mandatory automated visual-structure proof.
2. In addition — not instead — perform a real-browser visual check (a local
   static server serving `index.html`, since no `.claude/preview` exists)
   and capture the result for architect review, per
   `docs/governance/SUPERVISION_PROTOCOL.md` §4: "Architect visual
   validation is mandatory for any new or altered UI — the executor's report
   stops at `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO
   ARQUITETO` and only closes after the explicit OK." This gate applies at
   **implementation** time, not to this documentation-only contract.

### 13.5 Accessibility

`UI_VISUAL_CONTRACT.md` §15 lists a mandatory minimum, already binding
across the whole UI, that C4 inherits without modification: keyboard
operation on the main actions, visible focus, programmatic labels on
controls, status never communicated by color alone, sufficient contrast for
status text, dark title color for legibility, control targets 34-38px, and
modal focus management (§15 marks the exact modal-focus-management design as
`OPEN`, deferred to a separate `G28-B6` decision — C4 reuses whatever
`js/ui.js`'s `modal()` already does today, unmodified, and does not attempt
to resolve that open point). The `frontend-design` skill's generic
accessibility floor (responsive to mobile, visible keyboard focus, reduced
motion respected) is consistent with and subsumed by this list; nothing
from that skill is added beyond what `UI_VISUAL_CONTRACT.md` already
requires. The formal WCAG conformance target itself remains `OPEN — REQUIRES
IALEAD DECISION` per the visual contract's own §15 — this document does not
close that open point.

---

## 14. Entry and exit gates

**Entry gates for a future implementation order:**

1. This contract is supervisor-**ACCEPTED** (not merely proposed).
2. Git baseline re-verified at the fresh session's own entry checkpoint
   (workspace/branch/HEAD/parent/status/staging-parity), per
   `docs/governance/AGENT_INSTRUCTIONS.md` §2.
3. The four RPC signatures/return shapes in §4.3 are re-verified against the
   then-current `HEAD` (schema drift check) before writing any product code.
4. No REAL_CUTOVER, no `PHASE-C5`, no migration, no environment mutation is
   bundled into the same order.

**Exit gates (implementation closeout, for the future order to satisfy —
not evaluated by this pass):**

1. The exact manifest in §10 is respected — no undeclared file touched.
2. The unchanged-file list in §11 is respected — verified by `git diff
   --stat` against the exact manifest.
3. Full mandatory Node suite run with a byte-for-byte failing-identity
   differential against the entry checkpoint — added failures = empty.
4. `node scripts/validate-spec-custody.mjs` PASS.
5. The evidence enumerated in §15 is produced.
6. `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`
   reported and the architect's explicit visual-validation OK received
   before any closeout claim (`SUPERVISION_PROTOCOL.md` §4).
7. `OC-C4-ADMIN-001` disposition is proposed as `SATISFIED` (or
   `PARTIALLY_SATISFIED` with named residual debt) only after supervisor
   acceptance — never self-accepted.

---

## 15. Exact test manifest and required implementation evidence (reconciliation Q8)

**New/extended test files (exact, closed list — no wildcard):**

- `tests/ordem-compra-receipt-render.smoke.js` (or equivalent extension of
  `tests/ordem-compra.smoke.js`) — faithful DOM interaction tests (real
  `click`/`input` events via the VM/DOM harness, not static string
  assertions): Recebimentos section presence/absence per the §7 matrix for
  every order class; golden-rule table alignment; row-level reversal
  button's three §8.1 guards when that pattern is chosen.
- `tests/ordem-compra-receipt-data.smoke.js` — `obter_historico_recebimento_ordem_compra`
  loader shape handling; `registrar_recebimento_ordem_compra`/
  `estornar_recebimento_ordem_compra` writer wrappers; independent
  idempotency-token lifecycle (mint-on-open, reuse-only-on-ambiguous,
  new-token-on-any-deterministic-outcome) for **both** trackers
  independently; exact payload construction for allocation and excess
  lines; `recebimento_canonico_inativo` handled as a deterministic
  rejection, not a crash.
- `tests/ordem-compra-receipt-events.smoke.js` — modal open/submit/cancel
  flows; receipt success followed by the authoritative reload; deterministic
  business-rejection handling (toast, form retains values); transport
  ambiguity + same-token retry; idempotency-conflict handling
  (`idempotencia_conflitante`); legacy (`modelo==='legado'`) order renders
  no Recebimentos section at all; acceptance-pending/rejected/cancelled
  denial per the §7 matrix; shared Pedido-origin allocation with `op_id`
  NULL rendered correctly; excess entry submitted with no allocation and no
  fabricated OP; reversal remaining-balance (`kg_reversivel`) enforcement
  reflected in the UI (button hidden once exhausted).
- Extension of `tests/boot.smoke.js` and/or `tests/router.smoke.js` — proves
  `#/ordens-compra/:id` resolves through `router.js`'s actual `matchRoute()`
  (closing the gap noted in §4.5 — today only `ordem-compra.smoke.js` calls
  `screenOrdemCompra` directly, bypassing the router), and that the three
  new script tags are present in `index.html` in the documented order.
- Full mandatory Node suite before/after failing-identity differential
  (§14 exit gate 3).
- Visual validation per §13.4.

No wildcard test authorization exists; a future implementation order must
name its exact test files, matching this list or explaining any deviation.

---

## 16. Rollback strategy

Documentation-only; this pass makes no product, database, or environment
change to roll back. For the **future implementation order**: rollback is a
plain `git revert`/checkout of the exact five-file manifest in §10 (three
new files deleted, `ordem-compra.js`'s additive hooks and `index.html`'s
three script tags reverted) — no database rollback is needed because no
migration is authorized (§9), and no cutover-state change is made because
the writer RPCs remain inert throughout (§18). There is no point-of-no-return
inside C4 itself; the only PONR in this program is the separately-governed
`REAL_CUTOVER` window (§R.29.5), which C4 does not touch.

---

## 17. Risks

1. **The writer RPCs are inert in the current environment.**
   `registrar_recebimento_ordem_compra`, `estornar_recebimento_ordem_compra`,
   and `registrar_recebimento_ordem_compra_fio_compat` all gate on
   `ordem_compra_cutover.status='canonical_active' AND
   read_authority='canonical'`, and the singleton is `legacy_active` as of
   `db/76` (§4.3, §9). No migration flips this; only a separate, owner-only,
   multi-step runbook (`ordem_compra_c3c_fence_and_snapshot` →
   ... → `..._activate`) does, and that is REAL_CUTOVER territory,
   explicitly out of C4's scope. **Effect: C4's registration/reversal
   actions cannot be exercised end-to-end against a real productive receipt
   in the current environment; implementation evidence must rely on
   fixture-level DOM/mocked-RPC proof (§15), exactly like the existing
   `ordem-compra.smoke.js` pattern, not a live database round-trip.**
2. **No native order can currently reach `status_administrativo='emitida'`.**
   `emitir_ordem_compra` is granted to no client role at all (`REVOKE ALL`
   from `PUBLIC`/`anon`/`authenticated`/`service_role`, `db/74`). **Effect:
   `acoes.receber` will be `false` for every real order in the current
   environment regardless of C4's implementation correctness — this is an
   emission-activation gap (`OC-C5-EMISSION-001`), not a C4 defect, and must
   not be treated as one during implementation review.**
3. **An existing, competing receipt-registration UI already lives inside
   `pedido-detail-events.js`'s transition modal and `fornecedor.js`,
   writing through the legacy compat adapter (§4.4).** This contract makes
   no decision to decommission, hide, or redirect that surface. Two UIs
   will coexist post-implementation, potentially registering receipts for
   the same underlying order through two different RPC families
   (native vs. legacy-compat) if the order is ever dual-eligible — in
   practice this cannot happen for a single order today because the native
   writer explicitly rejects `legado` orders and the compat writer
   explicitly requires them, but the coexistence itself is a product-clarity
   risk worth flagging for a future, separately authorized decommission
   decision.
4. **`estornar_recebimento_ordem_compra`'s own gate does not exclude
   cancelled orders or re-check `status_aceite`** (§4.3, §7) — an admin
   could technically reverse a receipt on a cancelled order through C4's
   UI, exactly as the installed database function already permits. This is
   existing database behavior, not something C4 introduces or can safely
   override client-side; flagged for architect awareness, not as a blocking
   defect.
5. **Zero existing route-resolution test coverage for
   `#/ordens-compra/:id`** (§4.5) — a latent gap predating C4 that C4's own
   test manifest (§15) is positioned to close as a byproduct, but that is
   worth calling out explicitly rather than silently fixing without
   attribution.

---

## 18. Hard stops

None triggered during this pass. For completeness, the conditions checked
and found **not** present:

- Baseline did not differ from the expected entry values (§0).
- No canonical document contradicted another on any point material to this
  contract; the one apparent tension found (schema contract §6.2/C1's
  "supplier reversal remains an explicit pre-implementation decision"
  language vs. §6.2/C2's shipped "only admin may reverse") concerns
  **supplier** reversal only, which is out of scope for C4 either way
  (§R.24.6, `OC-C4-SUPPLIER-001` `DEFERRED`) — it does not create ambiguity
  about **admin** reversal, which is unambiguous across every source (§2).
- C4's scope was established from explicit textual anchors, not inference
  (§2, §6).
- Reversal ownership is not materially ambiguous (§2) — the order's
  conditional `UNPROVEN` clause does not apply.
- The effective receipt/history RPC definitions were fully identified
  (§4.3).
- The existing read model is sufficient for a correct UI; no migration is
  needed (§9).
- Supplier UI does not enter scope (§6).
- Emission activation does not enter scope (§6, confirmed inert by grant
  state, §17 item 2).
- No legacy UI surface is turned into new C4 UX (§6, §11) — the existing
  Pedido-modal/`fornecedor.js` receipt UI is left untouched, not extended.
- No direct flat fallback is proposed for native receipt (§8, §12).
- No router/menu change is proposed — the route already exists (§4.4, §11).
- No database, environment, deployment, product-code, test-code, or
  migration mutation occurred during this pass (verified in §19).
- No protected residue path (`.gitignore`, `.codex/config.toml`,
  `.mcp.json`) was opened, displayed, copied, modified, or staged (§0, §19).
- No push was attempted or is authorized (§21).

---

## 19. Documentation-closeout rules

Per `docs/governance/DOCUMENTATION_MODEL.md` §19,
`READ_ONLY_RECONCILIATION` mandates no canonical mutation beyond the new
contract file itself. This pass proportionally also updates (§20):
`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/DOCUMENTATION_INDEX.md`,
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and
`docs/ledgers/G28_LEDGER.md` — the exact set the order's own "Documentary
manifest" section pre-authorizes, and no other document. The governing
specification (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`) and technical
contract (`PEDIDO_OP_SCHEMA_CONTRACT.md`) are **not** modified — every
citation from them in this contract is read-only reference to already-
ratified clauses; nothing in this pass requires a normative change, so
touching them would violate the order's explicit "do not modify the
lifecycle spec or schema contract merely to duplicate the phase contract"
instruction.

After this contract is authored:

- `OC-C4-ADMIN-001` remains `PLANNED`. No requirement becomes `SATISFIED`
  or `PARTIALLY_SATISFIED` by this pass.
- `PHASE-C4` implementation remains unauthorized.
- `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`.
- `NEXT_AUTHORIZABLE_ACTION` becomes: supervisor review and
  acceptance/rejection of this proposed `PHASE-C4` material contract.
- This pass does not self-accept the contract, does not authorize
  implementation, and does not chain another order.

---

## 20. Supervisor decisions still required

1. **Accept, reject, or request changes** to this proposed `PHASE-C4`
   material contract as a whole.
2. **Confirm or override** the reversal-ownership determination in §2 (this
   contract finds it textually unambiguous — admin reversal in scope,
   supplier reversal deferred — but it is the architect's call to ratify).
3. **Confirm or override** the row-level reversal button pattern choice
   left open in §13.1 (icon-only with the three §8.1 guards, vs. entity-
   level icon+text) — this contract does not mandate one over the other.
4. **Confirm or override** the decision in §17 item 3 to leave the existing
   Pedido-modal/`fornecedor.js` receipt UI untouched rather than bundling a
   decommission/redirect decision into C4.
5. **Decide** whether the exact projected manifest (§10) and unchanged-file
   list (§11) are correctly scoped, or whether any named file needs to move
   between the two lists before implementation is authorized.
6. Once accepted, issue a **separate, explicit implementation order** for
   `PHASE-C4` in a fresh session that re-reads the canonical repository
   first, per `docs/governance/AGENT_INSTRUCTIONS.md` §2/§3 (phases do not
   chain automatically).

---

## 21. Status and next authorizable action

**STATUS: `PROPOSED / AWAITING SUPERVISOR REVIEW / IMPLEMENTATION NOT
AUTHORIZED`.**

`NEXT_AUTHORIZABLE_ACTION`: supervisor review and acceptance/rejection of
this proposed `PHASE-C4` material contract (§20). `PHASE-C4` implementation,
`PHASE-C5`, `REAL_CUTOVER`, any database migration, any environment
mutation, any staging/production/deployment action, branch creation, and any
push remain unauthorized by this pass.
