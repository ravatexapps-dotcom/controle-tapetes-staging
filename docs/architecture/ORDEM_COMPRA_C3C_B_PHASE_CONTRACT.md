# PHASE-C3C-B Material Phase Contract — Application Compatibility/Adaptation

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3C-B
<!-- MATERIAL_PHASE_CONTRACT:END -->
STATUS: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE (§35, corrected)

> **Role of this document.** This is a **material phase contract**, authored under
> `docs/governance/DOCUMENTATION_MODEL.md` §19 and
> `docs/governance/AGENT_INSTRUCTIONS.md` §3/§6. It binds the four already-accepted
> C3C-B requirement IDs (`OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`,
> `OC-C3-NOUI-001`) to an exact repository scope, sequence, tests, evidence, and
> hard stops. It creates **no new requirement**, changes **no normative anchor**,
> and authorizes **no implementation**. `PROJECT_STATE.md` remains the sole owner
> of `ACTIVE_PHASE` / `ACTIVE_PHASE_CONTRACT`; both remain `NONE` after this
> document is committed. This contract becomes actionable only when the architect
> separately authorizes `PHASE-C3C-B` and sets `ACTIVE_PHASE_CONTRACT` to this
> file's path.

## 0. Supervisor forward correction R1 (verdict: CHANGES_REQUIRED)

> **Forward correction, authored under `C3C-B-MATERIAL-PHASE-CONTRACT-R1`
> (documentation-only, `FORWARD_CORRECTION` per `DOCUMENTATION_MODEL.md` §4).**
> A read-only supervisor review of this contract's R1 returned
> `CHANGES_REQUIRED`. `PHASE-C3C-B` product implementation remains unauthorized.
> This section and the appended §§25–30 record the correction; §§1–24 above are
> preserved as authored (append-only correction, no history rewrite). Where §§1–24
> and §§25–30 conflict, **§§25–30 govern**.

The review found that §§6–17's application-only compatibility design cannot be
built against the database surface installed by `db/75`, because that surface
does not reproduce the shapes the three legacy consumers require. Two blocking
findings result — both **hard stops**, both requiring a **database** forward
correction that is a separate `NORMATIVE_CHANGE` + migration authorization and is
**not granted here**:

1. **HARD STOP — C3C-B REQUIRES DATABASE READ-CONTRACT FORWARD CORRECTION**
   (§25). The canonical reader `listar_recebimentos_ordem_compra_normalizados`
   is a receipt-event/ledger reader (§R.29.2). It cannot represent
   pending/unreceived (zero-receipt) orders, does not project `kg_pedido`, does
   not project per-order administrative/acceptance status, and does not project a
   supplier-facing order label — all of which the three legacy order-list readers
   (#2 `fornecedor.js`, #4 `pedido-detail-data.js`, #5 `op-nova.js`) consume. No
   authorized canonical-active composition of the installed surface reproduces
   those consumer shapes.
2. **HARD STOP — C3C-B REQUIRES DATABASE COMMAND-ADAPTER FORWARD CORRECTION**
   (§26). The canonical command `registrar_recebimento_ordem_compra` is a
   **native** per-line receipt command (native `ordem_compra_id` + per-allocation
   signed-delta lines + a stable idempotency key). No client-authorized surface
   atomically converts the legacy flat write (flat `ordens_compra_fio.id` +
   absolute cumulative `kg_recebido` + date + client-derived status) into that
   command; the delta requires the current canonical total, which is unreadable
   while the reader is inactive; and no retry-stable idempotency contract exists.

The contract is **not** amended to invent a JS-only reconstruction and does **not**
authorize any migration (§14/§19 hard stops preserved and reinforced). It also
corrects the error-policy contradiction (§27, Defect 3), the supplier reader
disposition (§28, Defect 4), and the exact-manifest wording (§29, Defect 5). The
`STATUS` marker is unchanged: `PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
IMPLEMENTATION NOT AUTHORIZED`; §30 records the additional database blockers.

## 1. Authorization source and entry checkpoint

- **Authorization source for this authoring pass:** architect order
  `C3C-B-MATERIAL-PHASE-CONTRACT-R1`, executed as a documentation-only pass under
  `docs/governance/AGENT_INSTRUCTIONS.md`. This order authorizes writing this
  contract; it does **not** authorize `PHASE-C3C-B` implementation.
- **Entry checkpoint (Git):** branch `dev`, HEAD at authoring time
  `6fcd139e8cdfd2e1539157388896ebc039a3af23`, parent
  `1157b9e71bc629903c5940ab50d4b370964e560e`, index empty, preserved residue
  modified `.gitignore` only (pre-existing, unrelated).
- **Last accepted product phase:** `PHASE-C3C-A` — `CLOSED / TECHNICALLY ACCEPTED
  — LOCALLY VERIFIED / INACTIVE / NOT APPLIED TO STAGING`, technical checkpoint
  `89123729b3529fff6e4a2336bfec2907c4b94b4c`.
- **Active product phase at authoring time:** `NONE`. **Active phase contract at
  authoring time:** `NONE`. This document does not change either value.

## 2. Dependencies (documents this contract reads and binds to)

- `docs/governance/AGENT_INSTRUCTIONS.md` — bootstrap/evidence/safety authority.
- `PROJECT_STATE.md` — `SPEC_CUSTODY_BOOTSTRAP` block; current-state owner.
- `docs/DOCUMENTATION_INDEX.md`, `docs/governance/DOCUMENTATION_MODEL.md`,
  `docs/governance/SUPERVISION_PROTOCOL.md` — documentary/supervision authority.
- `docs/architecture/CODE_HEALTH_RULES.md` — architectural health rules (§§1–13,
  19, 20 apply directly to the manifest in §8).
- `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` — sequence authority
  (non-authoritative for current state per its own banner).
- `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` — active-track traceability
  (derived; does not create architecture).

## 3. Governing specifications and normative anchors

- **Governing spec:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  §R.29 (unchanged), specifically:
  - §R.29.1 — authority and dependency matrix (the base inventory this contract
    verifies against the real repository in §7).
  - §R.29.2 — normalized canonical read contract.
  - §R.29.3 — cutover state machine and database-owned fence.
  - §R.29.6 — rollback/recovery/UI boundary ("C3 creates no visual UI").
  - §R.31 — stable requirement-ID registry (`OC-C3-READ-001`, `OC-C3-WRITE-001`,
    `OC-C3-COMPAT-001`, `OC-C3-NOUI-001`, all owned by `C3C-B`).
- **Technical contract:** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §13.15
  (unchanged) and §13.16 (C3C-A closeout — the accepted database foundation this
  contract's application layer must remain compatible with, without reopening it).
- **Accepted database foundation (read-only reference, not reauthorized here):**
  `db/75_ordem_compra_c3c_inactive_cutover.sql`, applied and locally verified only
  (chain `d4dba671` → `4b7ee13f` → `29913e40` → `89123729`). This contract treats
  `db/75` as **complete and unchanged**; no migration is authorized or required by
  `PHASE-C3C-B` (see §11).

This contract covers **exactly** four requirement IDs and creates none:
`OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001`, `OC-C3-NOUI-001`.

## 4. Exact objective

Make every in-scope application consumer of purchase-order receipt data
(`ordens_compra_fio.kg_recebido` / `data_recebimento` / `status`) **state-aware**
of the C3 cutover, by adding a compatibility layer that:

1. attempts the canonical database surface (already installed, inactive, by
   `db/75`) for reads and writes;
2. **falls back to today's exact legacy behavior** whenever the canonical surface
   reports itself inactive (which is the only possible outcome while
   `read_authority = 'flat'` / `status = 'legacy_active'`, the permanent state
   through this entire phase); and
3. introduces **zero observable behavior change** for any user, in any role,
   while the cutover state remains `legacy_active` — proved by regression tests,
   not by inspection alone.

`PHASE-C3C-B` does not flip cutover state, does not import data, does not close
ACLs, and does not build new UI. It prepares the JS layer so that a **later**,
separately authorized real cutover window (§R.29.5) can flip `read_authority` to
`canonical` without a synchronized application deployment.

## 5. Architectural invariants (carried forward, not reinterpreted)

1. Application consumers must use the normalized canonical purchase-order reader
   (`public.listar_recebimentos_ordem_compra_normalizados`) once the cutover
   activates; until then they must continue reading the flat table unchanged.
2. Legacy receipt writers must be routed through canonical commands
   (`public.registrar_recebimento_ordem_compra` /
   `public.estornar_recebimento_ordem_compra`) once active, or be disabled by
   state; until then they must continue writing the flat table unchanged.
3. Every discovered dependency (§7) receives an explicit adapter, disablement, or
   out-of-scope disposition — none may disappear from this contract undisposed.
4. `PHASE-C3C-B` introduces no new visual UI: no new route, screen, modal, or
   interaction. Existing surfaces receive only internal, non-visual adaptation.
5. `PHASE-C3C-B` is an application compatibility/adaptation phase only.
6. `PHASE-C3C-B` performs no staging deployment, activation, import, authority
   switching, ACL closure, or cutover. It touches no `db/*.sql` file (§11).
7. `PHASE-C3C-B` does not redesign lifecycle §R.29 or schema §13.15.
8. Existing state-dependent legacy compatibility remains deterministic: because
   `read_authority` is permanently `'flat'` through this phase, every adapter's
   observed behavior is deterministic and singular (the fallback branch), and
   every other branch is unreachable-but-present code, provable only by unit
   tests that mock the canonical RPC responses (§10).

## 6. Canonical surface this contract binds application code to

Installed by `db/75`, granted to `authenticated`, currently always inert because
`ordem_compra_cutover.status = 'legacy_active'` / `read_authority = 'flat'`:

| Canonical surface | Signature | Behavior while `legacy_active` |
|---|---|---|
| Canonical reader | `public.listar_recebimentos_ordem_compra_normalizados(p_pedido_id UUID, p_op_id BIGINT)` | Raises `canonical_reader_inactive` (`ERRCODE 55000`) — no rows are ever returned. |
| Canonical receipt command | `public.registrar_recebimento_ordem_compra(p_ordem_id, p_idempotency_key, p_ocorrido_em, p_documento_ref, p_origem_tipo, p_origem_ref, p_linhas)` | Returns `{"ok": false, "codigo": "recebimento_canonico_inativo", ...}` — never mutates. |
| Canonical reversal command | `public.estornar_recebimento_ordem_compra(p_ordem_id, p_idempotency_key, p_ocorrido_em, p_motivo, p_linhas)` | Returns `{"ok": false, "codigo": "recebimento_canonico_inativo", ...}` — never mutates. |

**No client-reachable state-check surface exists.** `public.ordem_compra_cutover`
has `REVOKE ALL … FROM PUBLIC, anon, authenticated, service_role` (`db/75` line
118); no RPC exposing `read_authority`/`status` is granted to `authenticated`.
Therefore **the only lawful state-detection mechanism for JS is the response/error
shape of the three RPCs above** (§9, §10). Introducing a new state-check RPC or
granting `SELECT` on `ordem_compra_cutover` is a schema/ACL change — a
`NORMATIVE_CHANGE` outside this contract's authorized scope (§14 hard stop).

## 7. Dependency inventory (verified against the real repository)

Base inventory: §R.29.1. Verified against current `dev` HEAD by direct file
inspection (all 17 originally-listed files read in full, plus an exhaustive
whole-tree grep for `ordens_compra_fio`, `kg_recebido`, `data_recebimento`,
`status_administrativo` across `js/`, confirming **no undiscovered dependency
exists** — the token-level surface is closed at exactly these files). Three
corrections to §R.29.1's classification are recorded below (marked
**correction**); §R.29.1's own normative text is not altered by this contract.

| # | Path | Current behavior | Requirement ID(s) | C3C-B disposition | Implementation change | Test |
|---|---|---|---|---|---|---|
| 1 | `js/screens/op-writes.js` | `registrarRecebimentoOrdemFio` (L29–43) writes `ordens_compra_fio.{kg_recebido,data_recebimento,status}` via `.update().eq('id', ordemId)`. `atribuirFornecedorFioOp` (L50–86) writes `.fornecedor_id` by `op_id`+`tipo`; **zero live call-sites** (dead code). | `OC-C3-WRITE-001`, `OC-C3-COMPAT-001` | IN SCOPE (writer). `atribuirFornecedorFioOp`: OUT_OF_SCOPE — dead code, DB fence already covers it if ever called. | Wrap `registrarRecebimentoOrdemFio` in the state-aware command adapter (§9); attempt canonical, fall back to identical legacy update on `recebimento_canonico_inativo`. | `tests/op-writes.smoke.js` |
| 2 | `js/screens/fornecedor.js` | `screenFornecedorOrdens` (L428–517): reads `ordens_compra_fio` (L440–442) and writes `kg_recebido`/`data_recebimento`/`status` (L461–463) via an **independent, duplicated** inline path (not `op-writes.js`). Supplier-only screen, route `#/fornecedor/ordens`. | `OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001` | IN SCOPE (independent reader+writer; highest scrutiny — non-admin role). | Independent state-aware read+write adapter wrapping the same two RPCs as #1, applied at this call-site directly (do not silently unify with `op-writes.js`; that would be an undocumented behavior change). | `tests/fornecedor-screens.smoke.js` |
| 3 | `js/screens/op-persistir.js` (284 lines) | `persistirOP`: `native` regime branch (L231–240) never touches the flat table. `legacy` branch (L242–260) only when `status==='aberta'`: `.from('ordens_compra_fio').delete().eq('op_id',...)` (L250) then `.insert(ordens)` (L255) — **pre-receipt order rows only** (`kg_pedido`, `status:'pendente'`); never `kg_recebido`/`data_recebimento`. | `OC-C3-COMPAT-001` (source-writer boundary only) | IN SCOPE for compatibility verification; **not** an `OC-C3-READ/WRITE-001` target (source rows, not receipt rows). Per §R.29.1 this path "remains legacy-only and is fenced from receipt/source mutation during cutover" — this contract adds no new write path here; it only adds a pre-flight state check that surfaces the DB's `legacy_receipt_fenced` error cleanly if ever hit (defense-in-depth; DB fence trigger `trg_c3c_protected_mutation_guard` already covers `ordens_compra_fio`). | `tests/op-persistir.smoke.js` |
| 4 | `js/screens/pedido-detail-data.js` | `loadPedidoDetailData` (L327–337): `.from('ordens_compra_fio').select('id, op_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido, status, cores:cor_id(...)').in('op_id', opIds)` → `state.ordensFio`. Admin route `#/pedidos/:id`. | `OC-C3-READ-001`, `OC-C3-COMPAT-001` | IN SCOPE (reader — Pedido-detail implementation). | State-aware read adapter (§9): attempt canonical reader scoped by `p_pedido_id`; on `canonical_reader_inactive`, run the exact existing `.select(...)` unchanged and populate `state.ordensFio` with byte-identical shape/field names for every downstream consumer (#6–#10). | `tests/pedido-detail.smoke.js` |
| 5 | `js/screens/op-nova.js` (1476 lines) | `fetchOrdensCompraFio` (L984–1000): **second, independent** reader (own two-tier select, dimension columns + legacy fallback). Line 1024: "Registrar" button calls `window.registrarRecebimentoOrdemFio(...)` — a **third writer call-site**, distinct from #1's own internal write and from #2's independent write. Reads `o.kg_recebido`/`o.status_administrativo` at render (L1080, 1176, 1197). Admin routes `#/ops/:id`, `#/ops/nova`. **Correction to §R.29.1:** classified there only as "Direct flat reader"; it is also a receipt-command caller. | `OC-C3-READ-001`, `OC-C3-WRITE-001`, `OC-C3-COMPAT-001` | IN SCOPE (reader + write call-site). Frozen-exception file (`CODE_HEALTH_RULES.md` §7) — no further growth without justification; prefer moving new logic into the new adapter module (§8) and calling it, not inlining. | State-aware read adapter for `fetchOrdensCompraFio` (OP-scoped, `p_op_id`); the write call-site is already covered once `op-writes.js`'s adapter (#1) lands, since it calls the same `window.registrarRecebimentoOrdemFio`. | `tests/op-nova.smoke.js` |
| 6 | `js/screens/pedido-detail-events.js` (2691 lines) | L1330–1354: "Registrar recebimento" form calls `window.registrarRecebimentoOrdemFio(...)` (fourth call-site of the same shared writer). Never queries `ordens_compra_fio` directly; reads `ordem.kg_recebido`/`kg_pedido` off `state.ordensFio` (populated by #4) at 7 render sites. Admin route `#/pedidos/:id`. **Not** a frozen exception under `CODE_HEALTH_RULES.md` §7 despite exceeding `op-nova.js` in size — pre-existing governance gap, not introduced or resolved by this contract. | `OC-C3-WRITE-001` (call-site), `OC-C3-COMPAT-001` | IN SCOPE (write call-site + derived reads). Write side already covered by #1's adapter. Derived reads require no change (consume `state.ordensFio`, shape-preserved by #4). | No new Supabase call added to this file. Verify (test only) that its 7 `kg_recebido`/`kg_pedido` render sites remain correct against the shape-preserved `state.ordensFio`. Do not let this phase grow this file further; extract only if a future order requires it. | `tests/pedido-detail.smoke.js` |
| 7 | `js/screens/pedido-detail-progress.js` (988 lines) | L358: `acc + toFiniteNumber(ordem.kg_recebido)` over `state.ordensFio` (parameter, not fetched here). No direct Supabase call. | `OC-C3-COMPAT-001` (shape dependency only) | IN SCOPE for verification; NO CODE CHANGE required — depends only on #4's shape-preserved output. | None. Regression test only. | `tests/pedido-detail.smoke.js` |
| 8 | `js/screens/pedido-chain-state.js` (394 lines) | `derivePedidoChainState`: pure function, `sum(input.ordensFio, 'kg_recebido')` (L203). No DOM, no Supabase. Confirmed **absent** from the client-facing `js/screens/cliente-pedido-tracking.js` (independent derivation, no `kg_recebido`) — admin-only reachability confirmed by `tests/cliente-pedido-detail.smoke.js` negative assertion. | `OC-C3-COMPAT-001` (shape dependency only) | IN SCOPE for verification; NO CODE CHANGE required — pure function of #4's output. | None. Regression test only. | `tests/pedido-detail.smoke.js` |
| 9 | `js/calculo-op.js` (187 lines) | `recalcularOP`/`consumoPorOrdem` (L76, 89, 118) read `kg_recebido` (post-receipt) — receipt-authority relevant. `montarOrdensCompraFio`/`agruparOrdensCompraFio` read/build `kg_pedido` only (pre-receipt) — **not** receipt-authority relevant. Pure, Node-testable, no Supabase. | `OC-C3-COMPAT-001` (partial — only `recalcularOP`/`consumoPorOrdem`) | IN SCOPE for `recalcularOP`/`consumoPorOrdem` verification, NO CODE CHANGE (pure function of caller-supplied data, shape-preserved by #4/#5). `montarOrdensCompraFio`/`agruparOrdensCompraFio`: OUT_OF_SCOPE — pre-receipt source data, untouched by this cutover per §R.29.1's own source-writer boundary. | None. Regression test only. | `tests/calculo-op.test.js` |
| 10 | `js/screens/op-recalculo.js` (214 lines) | `maxMetrosItem` reads `kg_recebido` (derived, read-only). `aplicarRecalculoOP`/`snapshotSaldoEIniciarProducao` (L88–169) compute per-order `kgSobra = kg_recebido − kg_pedido` and **directly write** `saldo_fios_op` (insert) and `saldo_fios` (select/update/insert) client-side, then flip `ops.status`. Confirmed scoped per-order (not a global credit), satisfying the existing spec invariant. | `OC-C3-READ-001` (derived read), `OC-C3-WRITE-001` / `OC-C3-COMPAT-001` (saldo write — **highest-risk item**) | IN SCOPE. **`saldo_fios`/`saldo_fios_op` are themselves in the DB fence's protected-table list** (`trg_c3c_protected_mutation_guard`, `db/75` L163–168) — the database already fences this write once cutover state leaves `legacy_active`; it permits mutation only from `pg_trigger_depth() > 1 AND state='canonical_active'` (i.e., only from inside an already-authorized `SECURITY DEFINER` function, never from a direct client call). No canonical replacement RPC exists today for this specific write, and creating one is a schema/RPC change outside this contract (§14 hard stop if attempted). | Read side: adapt `maxMetrosItem`'s consumption to the shape-preserved `ordens` parameter (no source change needed, verify only). Write side: **no new backend surface** — add a client-side catch for the DB's `legacy_receipt_fenced` error code that surfaces a clear, non-crashing message; this is defense-in-depth only, inert while `legacy_active`, and satisfies `OC-C3-WRITE-001`'s "disable them by state" clause via the DB's own pre-existing fence rather than a new JS write path. | `tests/op-recalculo.smoke.js` |
| 11 | `js/screens/op-distribuicao-ui.js` (369 lines) | Shared builder consumed by `op-nova.js` and `pedido-detail-events.js`. L202: `ordens.some(o => Number(o.kg_recebido) <= 0)`; L310: displays `c.kg_recebido`. Parameter-driven only; no Supabase call in this file (confirmed by its own tests asserting it never writes `saldo_fios_op`/`ops`). | `OC-C3-COMPAT-001` (shape dependency only) | IN SCOPE for verification; NO CODE CHANGE required — depends only on #4/#5's shape-preserved output. | None. Regression test only. | `tests/op-nova.smoke.js`, `tests/op-recalculo.smoke.js` |
| 12 | `js/screens/op-tecelagem-producao-admin.js` (630 lines) | L345: `ordemRef.kg_recebido` where `ordemRef` comes from `ctx.ordens` (caller-supplied, from `op-nova.js`). No Supabase call in this file. | `OC-C3-COMPAT-001` (shape dependency only) | IN SCOPE for verification; NO CODE CHANGE required. | None. Regression test only. | `tests/op-nova.smoke.js`, `tests/production-flow-invariants.smoke.js`, `tests/tec-to-acabamento-flow.smoke.js` |
| 13 | `js/delete-helpers.js` (255 lines) | `ordens_compra_fio` appears once (L82) as a display-name string in `buildImpactSummary`, rendering a **server-computed** count from `diagnosticar_impacto_pedido`/`diagnosticar_impacto_op` RPCs. All mutation is server-side (`remover_pedido`/`remover_op` RPCs); this file only calls `.rpc(...)`, never `.from(...)`. | `OC-C3-COMPAT-001` (label/passthrough only) | IN SCOPE for verification, NO CODE CHANGE expected — server-side RPCs already own the count/policy; the DB fence covers the underlying table independently of this file. | None expected; if the diagnostic RPCs' return shape is ever found to assume `legacy_active`, that is a separate DB-layer finding outside this contract (report, do not patch here). | `tests/controlled-delete.smoke.js` |

### Files reclassified out of scope (corrections to §R.29.1's blanket framing)

| Path | Why out of scope | Disposition |
|---|---|---|
| `js/screens/ordem-compra-data.js` | Exclusively consumes the **native** `ordem_compra` RPC surface (`listar_ordens_compra_admin`/`obter_ordem_compra_admin`, `db/68`). Zero client-side `.from('ordens_compra_fio')` or `kg_recebido`/`data_recebimento` reference. Any legacy-row unification happens server-side inside the RPC. | OUT_OF_SCOPE — no legacy-receipt client dependency exists to migrate. |
| `js/screens/ordem-compra-render.js` | Pure render of the RPC-projected `state.ordens`/`state.ordem` from `ordem-compra-data.js`. `status_administrativo` displayed here is whatever the native RPC projects for a `modelo:'legado'` row; this file never disambiguates or fetches it. | OUT_OF_SCOPE — same reasoning; display-only consumer of a server-side unification, not a receipt-authority dependency. |
| `js/screens/pedido-insumos-distribuicao.js` | Exclusively a **native** F2 purchasing-distribution surface (`necessidade_compra_fio`, `definir_alocacao_necessidade_compra_fio` RPC). File header self-documents as owning only the native regime. Zero coupling to `ordens_compra_fio`. | OUT_OF_SCOPE — belongs to the parallel native purchase-order system, not the legacy receipt-authority migration. |
| `js/screens/op-pdf.js` | Reads only **pre-receipt** `kg_pedido` via `calculo-op.js:agruparOrdensCompraFio`; never reads `kg_recebido`/`data_recebimento`/`status`. §R.29.1's "reads derived … receipt … state" framing does not hold for this file's actual code. | OUT_OF_SCOPE for `OC-C3-READ-001`/`OC-C3-WRITE-001`. Recorded here (not silently dropped) to satisfy `OC-C3-COMPAT-001`'s "every discovered dependency receives an explicit disposition." |

### Explicit "no undiscovered dependency" statement

An exhaustive grep across the entire `js/` tree for the four legacy-identifying
tokens (`ordens_compra_fio`, `kg_recebido`, `data_recebimento`,
`status_administrativo`) returns matches in **exactly** the 17 files already
named in §R.29.1 and re-verified above — no sixteenth+first file exists. No
shared reader/writer adapter module exists today; there are **two independent
reader implementations** (#4, #5) and **three independent writer
implementations** (#1, #2, #3's legacy branch) — each requires its own adapter
call-site (§9); there is no single choke point.

## 8. Exact authorized implementation scope and file manifest

### 8.1 Product files a future C3C-B implementation order may modify

> **Exact-manifest wording (Defect 5, §29).** This manifest is **ten authorized
> product paths total**: **nine JavaScript product paths** (items 1–9 below,
> including the new adapter module `js/screens/ordem-compra-receipt-cutover.js`)
> **plus `index.html`** (item 10, an authorized modified path — one line added).
> §8.2 authorizes **eight test paths**. Do not describe the scope as "nine
> product files"; `index.html` is a tenth authorized product path.

Exactly these paths — no directory or wildcard scope:

1. `js/screens/op-writes.js`
2. `js/screens/fornecedor.js`
3. `js/screens/op-persistir.js`
4. `js/screens/pedido-detail-data.js`
5. `js/screens/op-nova.js`
6. `js/screens/pedido-detail-events.js`
7. `js/screens/op-recalculo.js`
8. `js/delete-helpers.js` (verification only; code change not expected — see §7 row 13)
9. `js/screens/ordem-compra-receipt-cutover.js` — **new file**, the single shared
   state-detection/adapter module (§9). Must be a pure-parameter-in,
   Supabase-RPC-out module per `CODE_HEALTH_RULES.md` §9 ("explicit write
   modules"); must not access DOM.
10. `index.html` — **exactly one line added**: a single cache-busted
    `<script src="js/screens/ordem-compra-receipt-cutover.js?v=<date>-c3cb1">`
    tag inserted immediately after line 18
    (`<script src="js/screens/supabase-client.js?...">` — actually
    `js/supabase-client.js`) and before line 19 (`js/delete-helpers.js`), so it
    loads before every consumer in §7. No other line of `index.html` may change.

Files listed only for **verification/regression** (§7 rows 7, 8, 9 partial, 11,
12) are **not** authorized for modification; if verification reveals they need a
code change, that is a hard stop (§14) requiring contract amendment, not a silent
scope expansion.

### 8.2 Test files a future C3C-B implementation order may modify or create

1. `tests/op-writes.smoke.js`
2. `tests/fornecedor-screens.smoke.js`
3. `tests/op-persistir.smoke.js`
4. `tests/pedido-detail.smoke.js`
5. `tests/op-nova.smoke.js`
6. `tests/op-recalculo.smoke.js`
7. `tests/controlled-delete.smoke.js`
8. `tests/ordem-compra-receipt-cutover.smoke.js` — **new file**, dedicated unit
   coverage for the new adapter module.

No other test file may be modified. `tests/calculo-op.test.js`,
`tests/production-flow-invariants.smoke.js`, `tests/tec-to-acabamento-flow.smoke.js`,
`tests/expedicao-partial-flow.smoke.js`, `tests/expedicao-flow.smoke.js`,
`tests/op-latex-admin.smoke.js`, `tests/ordem-compra.smoke.js`,
`tests/pedido-insumos-distribuicao.smoke.js`, `tests/cliente-pedido-detail.smoke.js`,
`tests/ordem-compra-c3c-inactive.smoke.js`,
`tests/ordem-compra-c3c-inactive-concurrency.mjs`,
`tests/ordem-compra-c3c-inactive.integration.sql` are **regression-only** (§12) —
they must stay green unmodified.

### 8.3 Files explicitly prohibited from modification

- Every file under `db/` (all `db/*.sql`) — `PHASE-C3C-B` touches no migration;
  `db/75` is treated as complete and unchanged (§3, §11).
- `js/router.js`, `js/boot.js` — no new route, no role-table change (§8.5).
- `js/screens/ordem-compra-data.js`, `js/screens/ordem-compra-render.js`,
  `js/screens/pedido-insumos-distribuicao.js`, `js/screens/op-pdf.js`,
  `js/screens/pedido-detail-progress.js`, `js/screens/pedido-chain-state.js`,
  `js/screens/op-distribuicao-ui.js`, `js/screens/op-tecelagem-producao-admin.js`
  — per §7, either out of scope or verification-only.
- Any file under `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`,
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` — normative anchors are not
  reopened by an implementation phase (only a `NORMATIVE_CHANGE` phase may touch
  them).
- `scripts/validate-spec-custody.mjs`, `scripts/spec-custody/*` — validator is not
  a target of a product phase.
- `.claude/*`, `package.json` (if present), any CI/tooling config.
- `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  — updated only at phase closeout, by the closeout report, under the
  proportional matrix in `docs/governance/DOCUMENTATION_MODEL.md` §19, not as
  arbitrary implementation-time edits.

### 8.4 Out-of-scope work (explicit)

- Any change to cutover state, snapshot, import, reconciliation, ACL closure, or
  activation (C3D / real cutover territory, §R.29.5).
- Any new admin or supplier UI, route, or modal (C4 territory, §R.29.6).
- Any change to native emission (C5 territory).
- Any change to the parallel native purchase-order system
  (`ordem_compra`/`ordem_compra_item`/`ordem_compra_item_alocacao` screens listed
  as out of scope in §7).
- Any new database object, RPC, column, or grant.
- Any staging or production access, Supabase MCP write, or environment change.

### 8.5 No-new-UI rule (binding, `OC-C3-NOUI-001`)

`PHASE-C3C-B` adds no route (`js/router.js`/`js/boot.js` unchanged), no modal, no
new DOM node type, no new button, and no new user-visible copy. Every adapted
call-site (§7, §9) keeps its exact current inputs/outputs/rendering; only the
internal data-fetch/write mechanism gains a state-check-then-fallback branch that
is unreachable in observable behavior while `legacy_active`. Evidence required at
closeout: a diff-based UI-inertness proof (§13) — not a screenshot, since no
pixel is expected to change.

## 9. Reader migration rules (`OC-C3-READ-001`)

For each of the two independent readers (#4 `pedido-detail-data.js`, #5
`op-nova.js`'s `fetchOrdensCompraFio`):

1. Call `public.listar_recebimentos_ordem_compra_normalizados` scoped by the
   same identity the legacy select already scopes by (`p_pedido_id` for #4,
   `p_op_id` for #5).
2. If the RPC call errors with **exactly** the documented inactive code
   `canonical_reader_inactive` (`SQLSTATE 55000`) — or, only within the bounded
   deployment interval named in §27, `42883 undefined_function` — run the
   **existing, unmodified** `.from('ordens_compra_fio').select(...)` query and
   populate the exact existing shape/field names consumed downstream. Any other
   error (permission `42501`, payload, contract/shape, network, timeout, or
   unrecognized) is surfaced fail-closed, never classified as inactive. This
   supersedes the earlier "(or any error — fail-safe, not fail-open)" wording;
   the single finite error policy is §27 (Defect 3). **Note (Defect 1 / §25):**
   the success branch's mapping of the canonical projection into the legacy shape
   is **not buildable** against the installed reader, because the reader omits
   `kg_pedido`, per-order status, pending/zero-receipt rows, and the
   supplier-facing label; that composition is blocked pending the read-contract
   forward correction (§25/§30).
3. If the RPC call succeeds (only possible after a real, separately authorized
   cutover): map the canonical projection's `kg_recebido_atribuido`/`kg_excesso`
   into the legacy `kg_recebido` field name expected by unmodified downstream
   consumers (#6–#12), so that no other file needs to change when cutover
   activates. This mapping code may be written and unit-tested now (with a mocked
   RPC response) but is unreachable in production while `legacy_active`.
4. Never read `public.ordem_compra_cutover` directly (no grant exists) and never
   introduce a new state-check RPC (§14).

## 10. Writer migration or disablement rules (`OC-C3-WRITE-001`)

For each of the three independent writer call-sites (#1 `op-writes.js`, #2
`fornecedor.js` inline, #3 `op-persistir.js` legacy branch — source rows only,
not receipt rows):

1. `op-writes.js` / `fornecedor.js` (receipt writes): attempt
   `public.registrar_recebimento_ordem_compra` with a deterministic idempotency
   key derived from the call's natural key (order id + occurrence timestamp,
   consistent with the header shape already accepted by `db/75`'s import path).
   On **exactly** `{ok:false, codigo:'recebimento_canonico_inativo'}` (or, within
   §27's bounded deployment interval, a `42883 undefined_function` transport
   error), run the **existing, unmodified** `.update(...)` exactly as today. On
   any other error shape, surface it fail-closed as a genuine failure — do not
   mask a real canonical error as "inactive" (single finite policy: §27).
   **Note (Defect 2 / §26):** the canonical-attempt branch itself is **not
   buildable** against the installed command, because no client-authorized
   surface converts the flat absolute write into the native per-allocation
   signed-delta command with a retry-stable idempotency key; that adapter is
   blocked pending the command-adapter forward correction (§26/§30). The
   deterministic-idempotency-key proposal ("order id + occurrence timestamp") in
   this clause is withdrawn as insufficient (§26.6).
2. `op-persistir.js` (source rows): no canonical replacement exists or is
   authorized for source-row writes (§7 row 3); add only a defensive catch for
   `legacy_receipt_fenced` (the DB fence's own error code) so a future real fence
   activation surfaces cleanly instead of an unhandled Postgres error.
3. `op-recalculo.js` (`saldo_fios`/`saldo_fios_op`): no canonical replacement RPC
   exists or is authorized (§7 row 10); add only the same defensive
   `legacy_receipt_fenced` catch. Do not attempt to route this through
   `registrar_recebimento_ordem_compra` — that command's contract is
   receipt-header registration, not inventory-balance credit; conflating them
   would be an undocumented behavior change and a normative overreach.
4. Never write directly to `public.ordem_compra_cutover` or any `ordem_compra_c3c_*`
   internal function — all are `postgres`-owner-only or fully revoked (§6).

## 11. Compatibility/adaptation rules (`OC-C3-COMPAT-001`)

- One new shared module, `js/screens/ordem-compra-receipt-cutover.js`, is the
  **single** place that knows the three RPC names and their inactive-response
  shapes. It exports thin helpers (e.g. a canonical-read attempt, a canonical-write
  attempt) that each of #1/#2/#4/#5 call; it does not itself decide fallback
  content — each call-site keeps owning its own existing legacy query/mutation
  as the fallback body, per `CODE_HEALTH_RULES.md` §9/§10 (writes stay in
  explicit write modules; the new module is an adapter, not a new business-logic
  owner).
- Every adapter is **inert-by-construction**: given the guaranteed
  `legacy_active` state through this entire phase, 100% of real traffic take the
  fallback branch. The canonical branch is exercised only under mocked RPC
  responses in tests (§12).
- No migration, RPC, grant, or schema object is created, altered, or reasoned
  about as pending — `db/75` is the complete, unchanged database foundation for
  this contract (§3).
- Every discovered dependency (§7) carries one of: IN_SCOPE (adapter),
  IN_SCOPE (verification-only, no code change), or OUT_OF_SCOPE (with reason).
  None is undisposed.

## 12. Lifecycle-state behavior

| State | In this phase | Adapter behavior |
|---|---|---|
| `legacy_active` | The only real, reachable state throughout `PHASE-C3C-B` and until a separate real cutover. | Every adapter takes the fallback branch; behavior is byte-identical to pre-phase code, proved by regression tests (§13). |
| `maintenance_fenced` | Not reachable; not simulated against real data. | Adapter code paths for the DB fence's `legacy_receipt_fenced` error exist and are unit-tested with a mocked error, never exercised live. |
| `canonical_active` | Not reachable; not authorized; not simulated against real data. | Adapter code paths for a successful canonical response exist and are unit-tested with a mocked success payload, never exercised live. |

`PHASE-C3C-B` never calls any of the owner-only cutover commands
(`ordem_compra_c3c_*`) and never asserts or depends on a specific value of
`ordem_compra_cutover` beyond the RPC-response-driven detection in §9/§10.

## 13. Required tests

Per file (§7/§8.2), the implementation order must run and report:

- `node --check` on every touched/new product file.
- `node --test` on every test file in §8.2, green.
- For each of #1–#5, #10 (op-recalculo.js): a positive test proving the fallback
  branch reproduces **today's exact** Supabase call (`.from()`/`.update()`/`.select()`
  arguments unchanged) when the canonical RPC mock returns the documented
  inactive shape.
- For the new module (`ordem-compra-receipt-cutover.js`): unit tests for both
  branches (inactive → signal fallback; a mocked "active" response → correct
  field mapping), using the shared faithful double (`tests/_doubles.js`) per
  `CODE_HEALTH_RULES.md` §20 — not a hand-rolled simplified mock, since the axis
  under test (the RPC's exact envelope) is precisely the kind of divergence §20
  warns about.

## 14. Required negative tests

- Canonical reader returns `canonical_reader_inactive` → reader falls back
  correctly; UI renders identically to pre-phase output (same fixture, same
  assertions as the pre-phase test, now routed through the adapter).
- Canonical receipt/reversal command returns `recebimento_canonico_inativo` →
  writer falls back correctly; no partial write, no duplicate write, no silently
  swallowed distinct error code.
- Canonical RPC returns an **unrecognized** error shape (neither the documented
  inactive code nor a success) → adapter fails **closed** (surfaces the error,
  does not guess a fallback) — proves the detection is not fail-open.
- Simulated `legacy_receipt_fenced` on `op-persistir.js`'s source write and
  `op-recalculo.js`'s saldo write → surfaced as a clear, non-crashing error;
  no partial state (multi-step writes must not leave a half-completed sequence).
- `fornecedor.js`'s independent write path is tested **separately** from
  `op-writes.js`'s — proving the two adapters do not silently converge or
  cross-call each other in a way that changes either's existing behavior.

## 15. Required regression tests (must stay green, unmodified)

`tests/calculo-op.test.js`, `tests/production-flow-invariants.smoke.js`,
`tests/tec-to-acabamento-flow.smoke.js`, `tests/expedicao-partial-flow.smoke.js`,
`tests/expedicao-flow.smoke.js`, `tests/op-latex-admin.smoke.js`,
`tests/ordem-compra.smoke.js`, `tests/pedido-insumos-distribuicao.smoke.js`,
`tests/cliente-pedido-detail.smoke.js`,
`tests/ordem-compra-c3c-inactive.smoke.js`,
`tests/ordem-compra-c3c-inactive-concurrency.mjs`,
`tests/ordem-compra-c3c-inactive.integration.sql`, and the full mandatory suite
referenced in `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`'s closeout
history (whatever the then-current mandatory count is — re-baseline against the
real suite at implementation time, not against a number copied from this
contract).

## 16. Required evidence at implementation closeout

- `git status --short --untracked-files=all` showing exactly the manifest in
  §8.1/§8.2 changed (plus preserved pre-existing residue).
- `node --check` output for every touched file.
- Full `node --test` output for every file in §8.2 plus every file in §15.
- Per-file line counts for any file in §8.1 that changed size, with an explicit
  `CODE_HEALTH_RULES.md` §7 justification if a tier boundary (250/500/900 lines)
  is crossed — `op-nova.js` is already a frozen exception and must not grow
  further without justification; `pedido-detail-events.js` (2691 lines) must not
  grow at all under this contract (§7 row 6) — any new logic belongs in the new
  adapter module.
- A UI-inertness proof for `OC-C3-NOUI-001`: either a snapshot diff of every
  touched screen's rendered output before/after (proving zero change) or an
  explicit statement, verified by test, that no rendering code path changed —
  only data-fetch/write internals did.
- `git diff --check` clean.

## 17. Acceptance criteria per requirement ID

### `OC-C3-READ-001`

- Both independent readers (#4, #5) attempt the canonical projection first and
  fall back deterministically while `legacy_active`.
- No undisposed direct legacy read remains (§7's closed inventory; the four
  reclassified files in §7 carry an explicit OUT_OF_SCOPE reason, not silence).
- Reader behavior is regression-tested per §13/§15 with zero observed change.

### `OC-C3-WRITE-001`

- All three independent writer call-sites (#1/#2 receipt, #3 source) route
  through the state-aware pattern in §10, or carry an explicit
  disablement-by-DB-fence disposition (op-recalculo.js's saldo write, §7 row 10).
- No undisposed direct legacy writer remains.
- Denial/fallback behavior is tested per §14 (negative tests).

### `OC-C3-COMPAT-001`

- Every one of the 17 originally-listed dependencies plus every file found by
  the exhaustive grep (§7) has an explicit disposition: adapter, verification-only,
  or out-of-scope-with-reason.
- Compatibility behavior is deterministic by lifecycle state (§12).
- No hidden caller remains unclassified (§7's closing statement).

### `OC-C3-NOUI-001`

- No new route/screen/modal/interaction exists after implementation
  (`js/router.js`/`js/boot.js` byte-unchanged).
- Existing surfaces receive only internal adaptation (§8.5).
- The UI-inertness proof in §16 is produced and reviewed.

## 18. Residual debts permitted at closeout

- `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE` — pre-existing, unrelated,
  carried forward unchanged.
- `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` — pre-existing,
  unrelated, carried forward unchanged.
- The adapters' canonical-branch code paths remain **unverified against a live
  `canonical_active` state** — that verification is C3D/real-cutover territory,
  explicitly out of scope here (§8.4); closeout must record this as a residual
  debt, not claim it proven.
- `op-recalculo.js`'s saldo-write path has no canonical RPC replacement; the
  disposition in §7 row 10/§10.3 (DB-fence-only disablement) is accepted as
  sufficient for `PHASE-C3C-B`, but a future phase (C3D or later) must confirm
  the fence's actual denial behavior empirically against a rehearsal environment
  (that empirical proof is `OC-C3D-FENCE-001`, already owned by `C3D`).
- `pedido-detail-events.js` exceeding `op-nova.js` in size without a frozen-exception
  label (`CODE_HEALTH_RULES.md` §7) is a pre-existing governance gap this contract
  does not resolve; it may be flagged for a separate docs-only correction.

## 19. Hard stops

Implementation must stop and report, not decide alone, if:

- the real repository's Git baseline (branch, HEAD, index, residue) differs
  materially from §1's entry checkpoint;
- any file in §7 is found, at implementation time, to have changed shape or
  added a new legacy-table dependency since this contract's authoring — the
  manifest in §8 must be re-verified, not assumed still accurate;
- a canonical RPC's error/response shape differs from §6's documented shape;
- `op-persistir.js`'s or `op-recalculo.js`'s protected writes are found to need
  an actual canonical replacement RPC (not just a defensive error catch) to
  satisfy `OC-C3-WRITE-001` — that would be a schema/RPC change requiring a
  separate `NORMATIVE_CHANGE` contract, not an application-adapter change;
- any verification-only file (§7 rows 7, 8, 9-partial, 11, 12) is found to
  require an actual code change — the manifest must be amended, not silently
  expanded;
- implementing the adapter would require reading `public.ordem_compra_cutover`
  directly or a new state-check RPC (§6, §9.4) — that is a schema/ACL change
  outside this contract;
- implementation would require any new visual UI, route, or interaction;
- implementation would require any staging, database, or production change;
- `db/75`'s installed contract is found to differ from §3's description at
  implementation time;
- any change outside the exact manifest in §8.1/§8.2 is required.

## 20. Rollback or recovery model

Purely local and reversible: every change is additive JS/HTML/test content with
no database, staging, or production effect. Reverting the commit(s) that
implement `PHASE-C3C-B` fully restores prior behavior — there is no data
migration, no state flip, and no external system to reconcile. No rollback
procedure beyond standard Git revert is required or authorized to be more
elaborate than that.

## 21. Environment boundary

`LOCAL_ONLY`. All testing uses local Node test doubles
(`tests/_doubles.js`/`FaithfulNode`) per `CODE_HEALTH_RULES.md` §20 — never a
live Supabase call against `ucrjtfswnfdlxwtmxnoo` or `gqmpsxkxynrjvidfmojk`, and
never production `bhgifjrfagkzubpyqpew` (prohibited under any authorization).
Supabase MCP access is not authorized by this contract in any mode.

## 22. Git and commit boundaries

- Branch `dev` only; `main` forbidden.
- Selective staging only (`git add <exact path>`, never `git add .`/`-A`).
- No push authorized by this contract (implementation-time authorization is a
  separate gate per `PROJECT_STATE.md`).
- No `--amend`, no `--no-verify`, no history rewrite.
- One phase, one scope: application compatibility adaptation only — do not mix
  with any feature, refactor, or docs-only change unrelated to §4's objective,
  per `CODE_HEALTH_RULES.md` §14.

## 23. Documentation closeout requirements (for the future implementation phase, not this contract)

At `PHASE-C3C-B` implementation closeout, the executor updates, per
`docs/governance/DOCUMENTATION_MODEL.md` §19's proportional matrix:

- `PROJECT_STATE.md` — `LAST_ACCEPTED_PHASE`/`ACTIVE_PHASE`/`NEXT_AUTHORIZABLE_ACTION`
  and the accepted-phase index.
- `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` — disposition updates for
  `OC-C3-READ-001`/`OC-C3-WRITE-001`/`OC-C3-COMPAT-001`/`OC-C3-NOUI-001` (never to
  `SATISFIED` while `C3C-B` remains the owning phase and cutover is inactive,
  per the validator's own `R3` rule).
- `docs/ledgers/G28_LEDGER.md` — append-only closeout entry.
- `AGENT_HANDOFF.md` — only if operational continuity changes.
- This contract file — its `STATUS` marker updated only by an explicit supervisor
  acceptance record, never rewritten in place to claim an acceptance that did not
  occur.

Unaffected documents (this list, per the governing rule, is illustrative, not
exhaustive) are not touched at that closeout either.

## 24. Point of no return

**NONE — LOCAL APPLICATION ADAPTER IMPLEMENTATION ONLY.**

No staging or production mutation is permitted or possible under this contract's
authorized scope. There is no committed state, no data conversion, and no
irreversible step anywhere in §8–§17; the only "point of no return" defined
anywhere in the governing spec is §R.29.3's real-cutover PONR, which remains
explicitly out of scope (§8.4) and unauthorized by this contract.

## 25. Canonical reader shape matrix (Defect 1) — HARD STOP

Field-by-field reconciliation of **(A)** every legacy reader output consumed by
the three order-list screens against **(B)** the actual output of
`public.listar_recebimentos_ordem_compra_normalizados(p_pedido_id UUID,
p_op_id BIGINT)` as installed by `db/75` (lines 301–356). Legacy sources:

- **#4** `js/screens/pedido-detail-data.js` L327–330 — admin, by `op_id IN opIds`:
  `select('id, op_id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido,
  status, cores:cor_id(id, nome)')` → `state.ordensFio` (all order rows).
- **#5** `js/screens/op-nova.js` `fetchOrdensCompraFio` L993–1001 — admin, by
  `op_id`; renders pending rows via `buildOrdemPendenteRow` L1011–1034 (needs
  `kg_pedido`, `status`, `rotuloFio`).
- **#2** `js/screens/fornecedor.js` `screenFornecedorOrdens` L440–442 — supplier
  (RLS-scoped), `select('id, tipo, cor_poliester, kg_pedido, kg_recebido,
  data_recebimento, status, ops(numero, ano), cores:cor_id(id, nome)')`; splits
  `pendentes` vs `recebidas` L483–484.

Canonical `RETURNS TABLE`: `recebimento_id, lancamento_id, ordem_compra_id,
ordem_compra_item_id, allocation_id, pedido_id, fornecedor_id, op_id,
origem_tipo, material, cor_id, cor_poliester, kg_recebido_atribuido, kg_excesso,
tipo, estorno_de_id, ocorrido_em`, produced by an **INNER JOIN** of
`ordem_compra_recebimentos` ⋈ `ordem_compra_fio_lancamentos` (L343–344): a row
exists **only** where a receipt lançamento exists.

| # | Required consumer shape | (A) Legacy reader output | (B) Canonical reader output | Reproducible? |
|---|---|---|---|---|
| 1 | flat row identity | `id` (`ordens_compra_fio.id`) — #2/#4/#5; writers key on it | not projected (only `recebimento_id`, `lancamento_id`) | **NO** |
| 2 | native order identity | none | `ordem_compra_id` | yes (added) |
| 3 | native item/allocation identity | none | `ordem_compra_item_id`, `allocation_id` | yes (added) |
| 4 | Pedido | indirect via `op_id`→OP→Pedido | `pedido_id` (direct) | yes |
| 5 | OP | `op_id` always set (#4/#5); `ops(numero,ano)` (#2) | `op_id` **nullable** (Pedido-origin/excess rows are `NULL`) | partial (divergent for Pedido-origin/excess) |
| 6 | supplier scoping | #2 relies on flat-table RLS | `fornecedor_id` + server-side `is_admin()`/supplier filter (L325–332, L350) | yes |
| 7 | material/color | `tipo` + `cor_id`/`cor_poliester` + `cores` join | `material` + `cor_id`/`cor_poliester` (no color-name join) | partial (`tipo`→`material` rename; color name re-join needed) |
| 8 | `kg_pedido` (ordered qty) | **primary column**, #2/#4/#5; default input value | **not projected** | **NO — critical** |
| 9 | `kg_recebido` | absolute cumulative per order (#2/#4/#5) | `kg_recebido_atribuido` + `kg_excesso` **per receipt event** (sum across events; excess separated) | **NO** (needs aggregation; absent for zero-receipt orders) |
| 10 | attributable quantity | derived | `kg_recebido_atribuido` | yes |
| 11 | excess | derived | `kg_excesso` | yes |
| 12 | administrative/acceptance/receipt status | `status` (`pendente`/`recebido_parcial`/`recebido_total`) #2/#4; `status_administrativo` #5 | none (only lançamento `tipo` recebimento/estorno + `estorno_de_id`) | **NO — gap** |
| 13 | receipt date | `data_recebimento` (one date per order) #2 | `ocorrido_em` (per receipt event) | partial (per-event ≠ per-order) |
| 14 | rows with zero receipts | **YES** — pending orders returned (`kg_recebido` NULL/0) | **NO** — INNER JOIN drops zero-receipt orders | **NO — critical** |
| 15 | pending-order visibility | **YES** — #5 renders `buildOrdemPendenteRow`; #2 lists `pendentes` | **NO** — pending orders produce no rows | **NO — critical** |
| 16 | supplier-facing order labels | #2 `Nº {ops.numero}/{ops.ano}` | only raw `op_id`/`fornecedor_id`; no OP number/year | **NO — gap** |

**Result.** The canonical reader reproduces the receipt-event fields (native
identities, attributed/excess, Pedido/supplier scoping, `ocorrido_em`) but
**cannot** reproduce flat-row identity (#1), `kg_pedido` (#8), per-order
administrative/acceptance status (#12), zero-receipt/pending-order rows
(#14/#15), or the supplier-facing OP label (#16). Because it **cannot represent
pending/unreceived orders** and omits the ordered quantity and per-order status,
no authorized canonical-active composition of the installed surface reproduces
the three consumer shapes. §R.29.2 confirms the reader is "the sole post-switch
source for all **receipt state**" — a receipt-ledger reader, not an order-list
reader.

> **HARD STOP — C3C-B REQUIRES DATABASE READ-CONTRACT FORWARD CORRECTION.**
> The read-contract forward correction (a separate `NORMATIVE_CHANGE` on
> §R.29.2 + a new migration, **not authorized here**) must add an
> order-catalog canonical projection that returns **every** order row —
> including pending/zero-receipt — carrying, at minimum: a stable order/flat
> identity, `kg_pedido`, per-order administrative/acceptance/receipt status, a
> supplier-facing OP label, and the already-present attributed/excess receipt
> fields. Per §14/§19 and the `C3C-B-MATERIAL-PHASE-CONTRACT-R1` order, this
> contract does **not** invent a JS-only reconstruction of the missing rows/fields
> and does **not** authorize the migration.

## 26. Canonical writer payload matrix (Defect 2) — HARD STOP

Reconciliation of the legacy writer input against the canonical command input.

**Legacy writer input** (#1 `op-writes.js` `registrarRecebimentoOrdemFio`
L29–43; #2 `fornecedor.js` inline `.update` L461–463):

- flat `ordens_compra_fio.id` (`ordemId` / `ordem.id`);
- absolute/cumulative `kg_recebido` (`Number(kgInput.value)`);
- `data_recebimento` (date, **day** granularity);
- client-derived `status` (`kg < kg_pedido ? 'recebido_parcial' : 'recebido_total'`).

**Canonical command input** (`registrar_recebimento_ordem_compra`, `db/75`
L242–244):

- native `ordem_compra_id` (BIGINT);
- `p_idempotency_key` (stable idempotency identity);
- `p_ocorrido_em` (TIMESTAMPTZ command timestamp);
- `p_documento_ref`, `p_origem_tipo`, `p_origem_ref` (origin metadata);
- `p_linhas` JSONB (per-line item/allocation identity, receipt delta, attributed
  vs excess).

The nine required specifications from the order:

1. **Flat row → native order/item/need/allocation.** Available for *read* via
   `ordem_compra_item_compat_fio` (`ordens_compra_fio_id → ordem_compra_item_id`)
   and `ordem_compra_item_alocacao` (`item_id → allocation_id`, `kg_alocado`,
   `necessidade_id`, `op_id`). But a single flat row **fans out to N allocations**
   (`db/75` snapshot L514–517 joins item⋈alocacao), so one absolute write must be
   **decomposed** per allocation. No surface performs that decomposition.
2. **Client-authorized surface that supplies the mapping.** `GRANT SELECT` to
   `authenticated` exists on `ordem_compra_item_compat_fio` (`db/67` L442),
   `ordem_compra_item_alocacao` (`db/67` L292), `necessidade_compra_fio`
   (`db/67` L123) — these supply **identity (read)** only. **No** surface supplies
   the atomic conversion. (No JS file references any of them today.)
3. **Absolute → immutable receipt delta.** The canonical model records signed
   lançamento **deltas**, not an absolute. Computing the delta needs the current
   canonical received total per allocation, obtainable only from the canonical
   reader — which is **inactive** (`canonical_reader_inactive`). Reconstructing it
   from the flat absolute would be a JS-only reconstruction (forbidden).
4. **Requested absolute below / equal / above current canonical total.** Legacy
   overwrites the absolute unconditionally. Canonical needs: below → an **estorno**
   (reversal) delta via `estornar_recebimento_ordem_compra`; equal → no-op; above
   → a positive receipt delta. The flat writer has no delta concept and no surface
   maps absolute→signed-delta.
5. **Excess handling.** Attributed vs excess is `LEAST(kg_recebido, kg_alocado)` /
   `GREATEST(kg_recebido − kg_alocado, 0)` **per allocation** (`db/75` L512–513),
   computed server-side in the snapshot/import path; it is not exposed as a client
   command input the flat writer can populate.
6. **Retry-stable idempotency-key lifecycle.** Legacy has **none**. §10.1's
   withdrawn proposal ("order id + occurrence timestamp") is **insufficient**: at
   day granularity it is not per-event stable and collides.
7. **Multiple legitimate receipts on the same date.** A day-granular key makes two
   same-date receipts collide — one is dropped as a false duplicate or raises a
   spurious `idempotencia_conflitante`. A per-event stable key is required.
8. **Ambiguous network response.** Legacy `.update()` re-sets the same absolute on
   retry (benign). The canonical **delta** command double-posts on retry unless
   the client supplies a retry-stable key the server can dedupe — a key the client
   cannot currently derive.
9. **Supplier authorization / matching-order constraints.** The command enforces
   actor/order server-side (`SECURITY DEFINER`); the client must still pass the
   correct native `ordem_compra_id`, which requires the resolution in (1).

**Result.** Identity is SELECT-readable, but (a) no client-authorized surface
atomically converts a flat absolute receipt into the native per-allocation
signed-delta command, (b) the delta requires the canonical total that is
unreadable while the reader is inactive, and (c) no retry-stable idempotency
contract exists.

> **HARD STOP — C3C-B REQUIRES DATABASE COMMAND-ADAPTER FORWARD CORRECTION.**
> The command-adapter forward correction (a separate `NORMATIVE_CHANGE` +
> migration, **not authorized here**) must add a client-authorized RPC that
> accepts the flat receipt intent (flat row / native order id + the requested
> quantity + date + document metadata) and **atomically** resolves the
> flat→native order/item/need/allocation fan-out, converts the requested total
> into an immutable signed delta (receipt or estorno) against the canonical
> total, classifies attributed vs excess per allocation, and registers
> idempotently under a retry-stable key. Per the order, this contract does **not**
> fabricate identifiers, infer allocations client-side, or reuse a timestamp as
> the idempotency contract, and does **not** authorize the migration.

## 27. Unified error policy (Defect 3)

Replaces the contradiction between §9.2's former "fallback on any error" and
§10/§14's "fail-closed on unrecognized errors." **One finite policy** governs
every adapter call-site (#1/#2/#4/#5):

- **Fall back to the exact existing legacy read/write** on, and only on:
  - the reader's documented inactive signal `canonical_reader_inactive`
    (`SQLSTATE 55000`); or the writer's documented inactive envelope
    `{ok:false, codigo:'recebimento_canonico_inativo'}`; **and**
  - **only within the bounded deployment interval** where `db/75` is not yet
    applied to the target environment: `42883 undefined_function` (the canonical
    RPC does not exist). This interval **begins** when the C3C-B application is
    deployed to an environment and **ends** the moment `db/75` is confirmed
    applied there (e.g. production `gqmpsxkxynrjvidfmojk`, where `db/75` is not
    applied, is inside this interval; local/staging with `db/75` applied is
    outside it). This is the exact missing-RPC compatibility condition — named by
    code and interval, never "any error." It mirrors #5's existing
    `42703 undefined_column` deployment-sequencing precedent (`op-nova.js`
    L996–1000).
- **Surface fail-closed** (do not fall back, do not classify as inactive): the
  permission error `sem_permissao` (`42501`), payload/validation errors,
  contract/shape mismatches, network errors, timeouts, and **any unrecognized
  error**. An unknown failure is never treated as inactive.

This policy governs **detection only**; it does not, by itself, make either
adapter buildable — the canonical branches remain blocked by §25/§26 until the
database forward corrections land.

## 28. Supplier reader disposition (Defect 4) — `js/screens/fornecedor.js`

`fornecedor.js` is treated as a **third independent reader** as well as an
independent writer, at the **highest scrutiny** (non-admin supplier role).

- **Supplier scoping.** Today: `screenFornecedorOrdens` selects the flat table
  with **no** explicit `fornecedor_id` filter and relies on flat-table **RLS** to
  scope rows (L440–442). The canonical reader scopes supplier rows **server-side**
  (`db/75` L325–332, L350: non-admin resolves `usuarios.fornecedor_id` and filters
  `o.fornecedor_id = v_supplier_id`) — so canonical-active scoping is available and
  does not need a client filter.
- **Pending/unreceived-order visibility.** Required: the screen splits
  `pendentes` (`status === 'pendente'`) from `recebidas` (L483–484) and renders a
  "Registrar" input for each pending order. The canonical reader returns **no**
  pending rows (§25 #14/#15) → **BLOCKED** by the read-contract forward correction
  (§25/§30). This is the sharpest instance of Defect 1: a supplier would lose all
  pending orders at cutover.
- **Shape mapping.** Also needs `kg_pedido`, `data_recebimento`, and the
  supplier-facing label `Nº {ops.numero}/{ops.ano}` (L447, L451, L474, L503–505),
  none of which the canonical reader projects (§25 #8/#13/#16).
- **Read + write disposition.** Independent state-aware read+write adapter applied
  at this call-site directly; it must **not** be silently unified with
  `op-writes.js` (#1) — that would be an undocumented behavior change (§7 row 2).
  The write side (inline `.update` L461–463) is a **third independent writer** and
  is **BLOCKED** by the command-adapter forward correction (§26/§30).
- **Routed vs state-disabled.** While `legacy_active`, it stays on the exact
  legacy path (fallback branch, §27). It is **not** routed to canonical and **not**
  state-disabled by this phase; canonical routing is blocked pending §25/§26.
- **Tests.** `tests/fornecedor-screens.smoke.js`, **independent** from the admin
  Pedido/OP reader tests — proving the supplier read+write adapters do not
  converge with or cross-call `op-writes.js`'s (§14 last bullet).

## 29. Exact-manifest wording (Defect 5)

Normalized numeric wording, authoritative over any looser phrasing elsewhere:

- **Nine JavaScript product paths** (§8.1 items 1–9), **including** the new
  adapter `js/screens/ordem-compra-receipt-cutover.js`.
- **Plus `index.html`** (§8.1 item 10) — one `<script>` line added.
- **Ten authorized product paths total.**
- **Eight authorized test paths** (§8.2 items 1–8), including the new
  `tests/ordem-compra-receipt-cutover.smoke.js`.

The scope is never "nine product files": `index.html` is the tenth authorized
product path.

## 30. Corrected contract status and database blockers (historical — superseded by §31)

> This section records the state at the moment the forward correction (§0/§25–29)
> was authored, before supervisor review. It is preserved verbatim
> (append-only); §31 records the subsequent acceptance. Where this section and
> §31 conflict, **§31 governs**.

- `STATUS` (at authoring time): **PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
  IMPLEMENTATION NOT AUTHORIZED**. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain
  `NONE` in `PROJECT_STATE.md`. No requirement is marked `SATISFIED`.
- **Additional blockers beyond supervisor acceptance.** Even if the supervisor
  accepts this corrected contract, `PHASE-C3C-B` as scoped in §§4–17 (a JS/HTML
  application-only compatibility phase) is **not implementable** against the
  installed `db/75` surface. Two **database** forward corrections are prerequisites
  and are each a separate `NORMATIVE_CHANGE` + migration authorization **not
  granted here**:
  1. **Read-contract forward correction** (§25) — an order-catalog canonical
     projection including pending/zero-receipt orders, `kg_pedido`, per-order
     status, and a supplier-facing label.
  2. **Command-adapter forward correction** (§26) — a client-authorized RPC that
     atomically resolves flat→native identity, converts absolute→signed delta,
     classifies attributed/excess, and registers idempotently under a retry-stable
     key.
- **Traceability note (superseded by §31.3).** The `OC-C3-READ-001` /
  `OC-C3-WRITE-001` dispositions in `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`
  (at that time `PARTIALLY_SATISFIED`, reflecting the installed `db/75`
  foundation) were **not** changed by the forward-correction pass itself;
  whether to record them as `BLOCKED` was left to supervisor acceptance.
- **Next step (superseded by §31):** read-only supervisor review of this
  corrected contract.

## 31. Supervisor acceptance record (`C3C-B-MATERIAL-PHASE-CONTRACT-R1`)

> Recorded under order `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1`,
> documentation-only. This disposition is recorded by the delegated technical
> supervisor; it is not attributed to Kleber.

### 31.1 Verdict

**`ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
AUTHORIZED`.**

The diagnosis in §0/§25–29 (both hard stops, the unified error policy, the
supplier reader disposition, and the exact-manifest wording) is **accepted as
correct**. `PHASE-C3C-B` implementation remains **unauthorized**, now for two
independent reasons: (a) no architect authorization of the phase itself has
been granted (unchanged, per §1/§21 throughout this document's history), and
(b) the two named database forward corrections (§25/§26) are themselves
**blocking prerequisites** that must be authorized, implemented, and applied
before `PHASE-C3C-B`'s application-only design (§§4–17) is buildable at all.

### 31.2 Basis for acceptance

- The reader shape matrix (§25) and writer payload matrix (§26) are verified
  field-by-field against the actually-installed `db/75` surface and the three
  real legacy consumers; both hard stops are well-founded and not resolvable
  by an application-layer-only design.
- The unified error policy (§27), supplier reader disposition (§28), and
  exact-manifest wording (§29) corrections are accepted without further
  change.
- The two database prerequisites are now bound to an exact, implementation-ready
  design in a companion contract:
  `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
  (`PHASE_ID: PHASE-C3C-B-DB-PREREQ`, authored the same pass as this
  acceptance, `STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
  IMPLEMENTATION NOT AUTHORIZED` — itself not yet accepted, and not
  authorizing any implementation).

### 31.3 Traceability disposition (resolves §30's superseded note)

Recorded in `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` in the same
commit as this acceptance:

- `OC-C3-READ-001` — remains `PARTIALLY_SATISFIED`; `RESIDUAL_DEBT` now names
  the read-contract prerequisite (Component A of the companion DB contract) as
  the blocker.
- `OC-C3-WRITE-001` — remains `PARTIALLY_SATISFIED`; `RESIDUAL_DEBT` now names
  the command-adapter prerequisite (Component B of the companion DB contract)
  as the blocker.
- `OC-C3-COMPAT-001` — changes `PLANNED` → `BLOCKED`; `RESIDUAL_DEBT` names
  both database prerequisites as the exact blocker.
- `OC-C3-NOUI-001` — remains `PARTIALLY_SATISFIED`, unchanged reasoning.

No requirement is marked `SATISFIED`.

### 31.4 What this acceptance does and does not authorize

- Accepts the R1 forward correction's diagnosis as the governing analysis of
  this contract going forward.
- Does **not** authorize `PHASE-C3C-B` implementation.
- Does **not** authorize `PHASE-C3C-B-DB-PREREQ` implementation, any
  migration, or any database/staging/production/environment action — that
  contract remains separately `PROPOSED`, requiring its own supervisor review
  and its own explicit architect authorization.
- Does **not** change `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` in
  `PROJECT_STATE.md` (both remain `NONE`).
- Does **not** ratify the two normative-amendment proposals in the companion
  DB contract's §13 (the LIFO reversal rule and the legacy eligibility gate).

### 31.5 Next authorizable action

**`READ-ONLY SUPERVISOR REVIEW OF PHASE-C3C-B-DB-PREREQ`** — supervisor review
and acceptance of `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`.
`PHASE-C3C-B` implementation remains unauthorized and now additionally blocked
pending that separate contract's acceptance and its own future implementation
authorization.

## 32. Governing contract forward correction — database prerequisites closed, application targets corrected

> **Forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19), authored in the same pass as
> `docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md`
> §39, under architect order `docs: authorize C3C-B application adaptation`.**
> §§0–31 are preserved verbatim (no history rewrite). **Where §§1–31 and this
> §32 conflict, §32 governs.** This section activates `PHASE-C3C-B`
> implementation; it does not itself implement anything.

### 32.1 Database blockers closed

The two hard stops recorded in §25 (read-contract) and §26 (command-adapter)
are **CLOSED**. `db/76_ordem_compra_c3c_b_db_prerequisites.sql` — accepted in
`docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md` §37,
applied and verified inert in the development database
`ucrjtfswnfdlxwtmxnoo` per that contract's §38, and that environment
application supervisor-accepted in that contract's §39 — installs the two
components this section binds application code to. `db/75` remains complete
and unchanged (§3, §11, unaffected by this section).

### 32.2 Corrected application targets

§§6, 9, 10, 25, 26 above named `listar_recebimentos_ordem_compra_normalizados`,
`registrar_recebimento_ordem_compra`, and `estornar_recebimento_ordem_compra`
as the (blocked, unbuildable) canonical targets. **These are superseded.**
`PHASE-C3C-B` implementation must **not** call them. The two authorized
targets are:

- **Reader:** `public.listar_ordens_compra_fio_compat(p_pedido_id UUID
  DEFAULT NULL, p_op_id BIGINT DEFAULT NULL)` — item grain when `p_op_id IS
  NULL`, OP-attributable grain otherwise (companion contract §5.2, corrected
  by its §30).
- **Writer:** `public.registrar_recebimento_ordem_compra_fio_compat(
  p_ordens_compra_fio_id BIGINT, p_kg_total_absoluto NUMERIC,
  p_data_recebimento DATE, p_idempotency_key TEXT, p_documento_ref TEXT
  DEFAULT NULL, p_origem_ref TEXT DEFAULT NULL) RETURNS JSONB` (companion
  contract §6.2, corrected by its §35 shape-guard ruling).

### 32.3 Corrected inactive signals

§9/§10/§27's error-policy text named the C3C-A reader/writer's inactive
signals (`canonical_reader_inactive` / `recebimento_canonico_inativo`). The
two `db/76` components have their **own**, distinct inactive signals, and the
application adapter must detect exactly these:

- **Reader inactive:** Postgres exception `listar_compat_inativo`,
  `SQLSTATE 55000`.
- **Writer inactive:** success-shaped JSONB envelope `{ok:false,
  codigo:'recebimento_compat_inativo', ...}` (not an exception).

### 32.4 Bounded missing-RPC compatibility — narrowed, not the development-database condition

§27's bounded `42883 undefined_function` tolerance is preserved **only** for
the interval defined in the companion contract §7: it begins when C3C-B
application code calling either new RPC is deployed to a given environment,
and ends the moment `db/76` is confirmed applied there. This interval governs
only environments where `db/76` is **not yet installed**. It is **not** the
development-database condition: `db/76` is already installed and confirmed
present in `ucrjtfswnfdlxwtmxnoo` (companion contract §38), so `42883` is not
an expected or tolerated response there — if it occurs there, it is an
unrecognized error and fails closed under §32.5, not a signal of legitimate
absence.

### 32.5 Fail-closed error matrix (unchanged in kind, restated for the corrected targets)

Every other response from either RPC is a genuine failure, surfaced to the
caller without a legacy fallback and without masking it as inactivity:

- `sem_permissao` (`42501`)
- `estado_invalido`
- `mapeamento_compat_ausente`
- `decremento_exige_admin`
- `reducao_abaixo_saldo_importado`
- `excede_estornavel`
- `kg_absoluto_invalido`
- `idempotencia_conflitante`
- `erro_interno`
- any payload/shape error (a response that does not match the documented
  envelope)
- network errors and timeouts with no classified ambiguous-retry handling
  (i.e. no code path may guess these mean "inactive")
- every unrecognized response

This supersedes and narrows §27's more general formulation to the exact code
set the `db/76` components actually return (companion contract §6.11), while
preserving §27's governing principle unchanged: fall back only on a
documented inactive signal (or the bounded §32.4 interval); fail closed on
everything else.

### 32.6 Component A projected shape — no client-side reconstruction

Component A (`listar_ordens_compra_fio_compat`) already projects the full
legacy-compatible order shape application code needs, closing every gap §25
identified as unbuildable: `ordens_compra_fio_id`, `ordem_compra_id`,
`ordem_compra_item_id`, `pedido_id`, `op_id` (+ `op_ids_multiplos`),
`op_numero`/`op_ano`/`op_label`, `fornecedor_id`/`fornecedor_nome`,
`tipo`/`material`, `cor_id`/`cor_nome`/`cor_poliester`, `kg_pedido`,
`kg_recebido`, `kg_recebido_atribuido`, `kg_excesso`, `status`,
`status_administrativo`, `status_aceite`, `status_recebimento`,
`data_recebimento`, `alocacoes` (JSONB per-allocation breakdown).

`PHASE-C3C-B` application code must consume this projection as-is. It must
not reconstruct missing canonical fields, aggregate receipt events
client-side, or derive any value the RPC does not already return — every
field the three legacy consumers (§7 rows 2, 4, 5) require is already
present.

### 32.7 Idempotency lifecycle (binding on the new adapter module, §8.1 item 9)

- The caller generates **one** client-side idempotency token per
  user-initiated submission attempt.
- That token is retained in the in-flight request's local state for the
  duration of that attempt.
- A retry of the **same** attempt (timeout, connection drop, ambiguous
  response) reuses the token **verbatim**.
- A genuinely **new** user-initiated submission (e.g. the user changes the
  entered value and clicks "Registrar" again) generates a **new** token.
- The token is never derived from date, timestamp, order id, quantity, or any
  other collision-prone natural key (companion contract §6.8, explicitly
  superseding and withdrawing the earlier §10.1 "order id + occurrence
  timestamp" proposal already marked withdrawn in this file).

### 32.8 Fixed-corpus boundary — unchanged, restated

- The 13 unmapped flat rows (companion contract §38.5) remain visible through
  the flat fallback while `legacy_active` — Component A never returns them
  (they lack a compat mapping) and this phase creates no mapping for them.
- `mapeamento_compat_ausente`, if ever reached on a canonical branch, is
  fail-closed per §32.5 — it is not treated as equivalent to "inactive."
- Mapping completeness, freeze, and re-baseline remain C3D scope; this phase
  creates no bridge, backfill, or mapping row (companion contract §32,
  "binding corpus decision — FIXED corpus").

### 32.9 Manifest preserved

The exact-manifest wording in §29 is unchanged and binding: ten authorized
product paths (§8.1 items 1–9 plus `index.html`), eight authorized test paths
(§8.2), no new UI (§8.5), no database or environment action (§8.4, §11, §22).
This section authorizes `PHASE-C3C-B` to proceed within that unchanged scope,
corrected only for the application targets, inactive signals, error matrix,
and idempotency lifecycle in §§32.2–32.7 above.

### 32.10 Authorization

`PHASE-C3C-B` implementation is **AUTHORIZED**, effective this commit.
`PROJECT_STATE.md`'s `ACTIVE_PHASE` is set to `PHASE-C3C-B` and
`ACTIVE_PHASE_CONTRACT` to this file's path in the same commit that appends
this section (companion contract §39.4).

## 33. Implementation closeout (governs on conflict)

> **Append-only forward correction (`PHASE_CLOSEOUT` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under the same
> order that authorized §32, implementation commit
> `feat: adapt legacy purchase-order receipts for cutover`. §§0–32 are
> preserved verbatim (no history rewrite). **Where §§1–32 and this §33
> conflict, §33 governs.**

### 33.1 Disposition

**`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`.** All
ten authorized product paths (§8.1) and all eight authorized test paths
(§8.2) were exercised exactly as scoped; no file outside the manifest was
touched; no `db/*.sql`, CSS, router, boot, package, CI, tooling, or MCP file
changed.

### 33.2 Implementation summary

- **New adapter (§8.1 item 9):** `js/screens/ordem-compra-receipt-cutover.js`
  — pure, no DOM access, no rendering, no route logic. Knows only the two
  `db/76` RPC names, their parameter contracts, success shapes, inactive
  signals (`listar_compat_inativo` SQLSTATE 55000;
  `{ok:false,codigo:'recebimento_compat_inativo'}`), the bounded `42883`
  interval (§32.4), and the fail-closed code set (§32.5). Exports
  `attemptCanonicalRead`, `attemptCanonicalReceipt`,
  `createReceiptAttempt`/`newIdempotencyToken`, `isLegacyReceiptFenced`, and
  the shared canonical-row-to-legacy-shape mapper (§32.6). Every function
  returns an explicit `{ outcome: 'canonical_success' | 'legacy_fallback' |
  'hard_failure' }` the caller branches on; the adapter never owns fallback
  content.
- **§9 readers (`op-writes.js` §10.1 n/a — readers are #4/#5):**
  `pedido-detail-data.js` (`loadPedidoDetailData`) attempts
  `listar_ordens_compra_fio_compat({p_pedido_id})`; on `legacy_fallback` runs
  the exact pre-phase `.select(...)` unchanged; `state.ordensFio` populated
  either way with the same field names. `op-nova.js`
  (`fetchOrdensCompraFio`) attempts the same RPC scoped by `p_op_id`; minimal
  wiring only (frozen-exception file, +17 lines), falls back to the exact
  pre-phase dim/legacy select unchanged.
- **§10 writers:** `op-writes.js` (`registrarRecebimentoOrdemFio`) attempts
  `registrar_recebimento_ordem_compra_fio_compat` first, falls back to the
  exact pre-phase flat `UPDATE` on inactive/bounded-42883, never issues both
  writes. `fornecedor.js` (`screenFornecedorOrdens`) has its own independent
  reader and writer, not routed through `op-writes.js`; a canonical
  `decremento_exige_admin` (or any other recognized code) fails closed,
  never falls back to a flat decrease. `op-persistir.js`'s legacy source-row
  branch and `op-recalculo.js`'s saldo writes are unchanged except for a new
  `clearFenceError()` helper that replaces a raw `legacy_receipt_fenced`
  Postgres error with a clear message through the exact same
  `{ error, step, partial }` return shape — no bridge, mapping, canonical
  order creation, or `db/76` RPC call added to either file.
- **Verification-only (no code change):** `pedido-detail-events.js` (its
  writer already reaches `op-writes.js`'s adapted
  `registrarRecebimentoOrdemFio`; confirmed statically — this file does not
  grow) and `js/delete-helpers.js` (its one `ordens_compra_fio` reference is
  a display-name string, not a live query).
- **`index.html`:** exactly one line added — the cache-busted adapter
  `<script>` tag, immediately after `js/supabase-client.js` and before every
  consumer.

### 33.3 UI-inertness proof (`OC-C3-NOUI-001`)

`js/router.js` and `js/boot.js` are byte-unchanged (not in the manifest, not
touched). Every adapted call-site's rendering, inputs, and outputs are
unchanged; the only new code path is an internal state-check-then-fallback
branch, unreachable in observable behavior while `legacy_active` (the
permanent state through this phase). `index.html`'s diff is exactly one
added line (verified by `git diff -- index.html`); loaded in the browser
preview with zero new console errors and a `200 OK` network response for the
new script.

### 33.4 Idempotency lifecycle proof

`tests/ordem-compra-receipt-cutover.smoke.js` proves: (a) `createReceiptAttempt()`
mints a non-empty token; (b) reusing the same returned attempt object across
two calls to `attemptCanonicalReceipt` sends the identical
`p_idempotency_key` both times (retry of the same attempt); (c) two separate
`createReceiptAttempt()` calls yield different tokens (new submission); (d)
two distinct submissions dated the same day never share a token (identity is
the attempt, not the date) — directly proving §32.7.

### 33.5 Fallback and fail-closed matrix — tested

- `listar_compat_inativo` / `recebimento_compat_inativo` → `legacy_fallback`,
  exactly one byte-identical flat query/mutation follows.
- Bounded `42883 undefined_function` → `legacy_fallback`, identically.
- `sem_permissao`, `estado_invalido`, `mapeamento_compat_ausente`,
  `decremento_exige_admin`, `reducao_abaixo_saldo_importado`,
  `excede_estornavel`, `kg_absoluto_invalido`, `idempotencia_conflitante`,
  `erro_interno`, and every unrecognized transport error → `hard_failure`,
  no flat mutation follows, error surfaced to the caller.
- Canonical success → `canonical_success`, the flat mutation is never
  issued (proved directly by call-count assertions in
  `tests/op-writes.smoke.js` and `tests/fornecedor-screens.smoke.js`).
- `legacy_receipt_fenced` on `op-persistir.js`'s source write and
  `op-recalculo.js`'s saldo write → clear, non-crashing error through the
  existing `{ error, step, partial }` shape; a different `55000` message is
  never rewritten (proved by dedicated negative tests in both files' smoke
  suites).

### 33.6 Line-count and code-health report

| File | Before | After | Δ | Tier | Note |
|---|---|---|---|---|---|
| `js/screens/ordem-compra-receipt-cutover.js` (new) | 0 | 179 | +179 | ideal (≤250) | — |
| `js/screens/op-writes.js` | 97 | 133 | +36 | ideal (≤250) | — |
| `js/screens/fornecedor.js` | 536 | 583 | +47 | exceptional (≤900) | Already over the 500-line acceptable ceiling before this phase; no new tier boundary crossed by this phase. Splitting is out of scope (would mix refactor with this compatibility-adaptation phase, `CODE_HEALTH_RULES.md` §14). |
| `js/screens/op-persistir.js` | 284 | 306 | +22 | acceptable (≤500) | Already over the 250-line ideal ceiling before this phase; no new tier crossed. |
| `js/screens/pedido-detail-data.js` | 371 | 387 | +16 | acceptable (≤500) | No new tier crossed. |
| `js/screens/op-nova.js` | 1476 | 1493 | +17 | frozen exception (already >900) | Minimal wiring only, per §7 item 5; not used as precedent for new large screens. |
| `js/screens/op-recalculo.js` | 214 | 232 | +18 | ideal (≤250) | — |
| `js/screens/pedido-detail-events.js` | 2691 | 2691 | 0 | (pre-existing, ungoverned by a frozen-exception label — §18 residual debt, unresolved by this phase) | **Did not grow**, per contract §7 row 6 requirement. |
| `js/delete-helpers.js` | 255 | 255 | 0 | ideal (≤250) | Verification-only, no code change, as expected. |
| `index.html` | 110 | 111 | +1 | n/a | Exactly one line, as authorized. |

No new function exceeds 150 lines. No file outside this table changed.

### 33.7 Test evidence

- `node --check`: clean on all ten touched/new product files and all eight
  authorized test files.
- `node --test` on the eight authorized test files: all pass except two
  pre-existing, unrelated failures already present in the pre-phase baseline
  (`tests/op-writes.smoke.js` test 9 and test 24 — confirmed via `git stash`
  comparison, both about `atribuirFornecedorFioOp`/`ADMIN_MENU` counts,
  unrelated to receipts) and 39 pre-existing failures in
  `tests/pedido-detail.smoke.js` (confirmed identical via the same `git
  stash` comparison).
- Full mandatory Node suite (`node --test "tests/**/*.js"`): 3960 tests,
  3836 pass, 124 fail; the set of 124 failing test names is byte-for-byte
  identical to the pre-phase baseline (`git stash` + rerun + diff of sorted
  failing-test-name lists, `diff` exit code 0) — zero regressions
  introduced anywhere in the repository by this phase. The 124 baseline
  failures are pre-existing debt: known code-health gaps (stale `ADMIN_MENU`
  counts, `atribuirFornecedorFioOp` dead-code assertions) and
  `ECONNREFUSED 127.0.0.1:8765` in tests that require a running local static
  server not started for this run.
- `node scripts/validate-spec-custody.mjs`: **PASS**. (`--self-test` mode
  fails for an unrelated, pre-existing reason — its fixture harness does not
  copy an active `ACTIVE_PHASE_CONTRACT` target file into its synthetic
  repository, a limitation of `scripts/spec-custody/self-tests.mjs` predating
  this phase; `--self-test` is not part of this contract's required test
  contract and the validator scripts are explicitly prohibited from
  modification, §8.3.)
- `git diff --check` / `git diff --cached --check`: clean throughout.

### 33.8 Residual debts (unchanged from §18)

`HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`,
`NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, the adapters'
canonical-branch code paths remain unverified against a live
`canonical_active` state (explicitly C3D/real-cutover territory, out of
scope here), `op-recalculo.js`'s saldo-write path has no canonical RPC
replacement (DB-fence-only disablement accepted as sufficient, §7 row
10/§10.3), and `pedido-detail-events.js` exceeding `op-nova.js` in size
without a frozen-exception label remains a pre-existing governance gap this
contract does not resolve.

### 33.9 Final state and next authorizable action

`LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ` (unchanged — this closeout
records implementation, not supervisor acceptance, of `PHASE-C3C-B`).
`ACTIVE_PHASE: NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. `PHASE-C3C-B:
IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`. No
dependent `OC-C3-*` requirement is `SATISFIED`. The next authorizable
action is supervisor review/acceptance of this implementation; only after
that acceptance may staging validation/application of `db/76`, C3D, cutover,
C4, C5, production access, or any further push beyond the one authorized
`staging/dev` fast-forward be authorized.

## 34. Supervisor-review correction — idempotency attempt retention + exact 42883 (governs on conflict)

> **Append-only forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under the
> targeted-correction order following the supervisor verdict
> `PHASE-C3C-B: CHANGES_REQUIRED` on the implementation at commit
> `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`. §§0–33 are preserved verbatim
> (no history rewrite). **Where §§1–33 and this §34 conflict, §34 governs.**
> Correction commit: `fix: preserve C3C-B receipt idempotency attempts`.
> This section does **not** record supervisor acceptance — status remains
> `IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`.

### 34.1 Supervisor finding

The implementation and push at `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`
were **not accepted**. Two blocking defects, both within the existing
`PHASE-C3C-B` scope:

1. **Real call-sites did not retain retry attempts.** §32.7/§33.4 already
   specified the idempotency lifecycle correctly in the abstract, and the
   adapter's `createReceiptAttempt()`/`attemptCanonicalReceipt(...)`
   mechanics were correct and tested — but every real receipt UI closure
   (`op-writes.js`'s own internal fallback, `fornecedor.js`'s writer,
   `op-nova.js`'s `buildOrdemPendenteRow`, `pedido-detail-events.js`'s
   `buildInsumosTransferForm`) created a **new** attempt on every function
   invocation or click, rather than a real UI closure owning and retaining
   one attempt object across a retry of unchanged intent. A retry after an
   ambiguous transport failure therefore received a different idempotency
   key than the original attempt, defeating the purpose of the idempotency
   contract.
2. **The missing-function classifier exceeded the exact 42883 contract.**
   `isMissingCompatFunction` accepted `error.code === '42883'` **or** a
   message-text match (`/function .* does not exist/i`), so a differently-
   coded error carrying similar wording could be misclassified as the
   bounded deployment-sequencing condition (§32.4) and incorrectly permitted
   to fall back, rather than failing closed.

### 34.2 Root cause

Both defects trace to the same gap: §32/§33 fully specified the **adapter's**
contract (token mechanics, the bounded interval, the fail-closed set) but the
**call-site wiring** implemented in §33 treated `attemptCanonicalReceipt` as
a one-shot, stateless call — creating a fresh attempt inline on every
invocation instead of threading a caller-owned, intent-aware attempt object
through the real UI closure's own persistent scope. Because no real UI
closure ever retried (no automatic retry loop existed at the time §33 was
verified), the gap was invisible to §33's tests, which exercised the
adapter's token-passthrough mechanics directly rather than the real
call-site's retention behavior end-to-end. `isMissingCompatFunction`'s
message-text alternative was carried over unreviewed from the earlier §27
bounded-`42883`-precedent wording, which itself never specified a message-
only path — an unauthorized broadening introduced during §33's
implementation, not specified by §32.4.

### 34.3 Correction — files and behavior

- **`js/screens/ordem-compra-receipt-cutover.js`** (179→257 lines):
  - Added `createAttemptTracker()` — the real UI closure that owns a single
    "Registrar" control instantiates exactly one tracker, alive for that
    control's lifetime (never recreated per click/submit). `resolveAttempt(intent)`
    returns the retained attempt when `intent` (flat order id, requested
    absolute kg, receipt date) is unchanged from the last unresolved attempt;
    otherwise mints a fresh one via `createReceiptAttempt()`. `complete()`
    closes the attempt after any deterministic outcome, so the next
    `resolveAttempt()` call — even with byte-identical intent — mints a new
    token (the "previous request received a deterministic server rejection ⇒
    new attempt" rule). The token itself remains random; intent is used only
    to decide reuse, never as the token. No global persistence: state lives
    only inside the tracker closure the caller owns.
  - `attemptCanonicalReceipt` now distinguishes, on an RPC-call-level error
    (`res.error`): the bounded `42883` case (`legacy_fallback`, unchanged)
    versus every other transport-level error, now classified
    `'ambiguous_failure'` (server commit status unknown — fail closed, no
    flat fallback, caller must retain its attempt) versus a received JSONB
    envelope with `ok:false` (`'hard_failure'`, deterministic — db/76's own
    outer `EXCEPTION WHEN OTHERS` guarantees this envelope for every
    business-logic condition, never a raised error).
  - `isMissingCompatFunction` now checks `error.code === '42883'` only; the
    message-text alternative was removed.
- **`js/screens/op-writes.js`** (133→155 lines): `registrarRecebimentoOrdemFio`
  now accepts an optional caller-owned `attempt`; uses it verbatim when
  supplied, else creates one internally (backward compatible with any caller
  not yet updated — none remain live). Its return shape gains `ambiguous`
  (boolean) alongside the existing `{ data, error }` contract every caller
  already checks, so the caller can decide whether to retain (`ambiguous:
  true`) or close (`ambiguous: false`) its tracker.
- **`js/screens/fornecedor.js`** (583→599 lines): `linhaPendente` now
  instantiates its own `attemptTracker` (independent from `op-writes.js` —
  still never routed through `registrarRecebimentoOrdemFio`), resolves it by
  intent before each attempt, retains it on `'ambiguous_failure'`, and calls
  `.complete()` on `'canonical_success'`/`'hard_failure'`/successful flat
  fallback.
- **`js/screens/op-nova.js`** (1493→1511 lines, still the frozen-exception
  file — minimal wiring only): `buildOrdemPendenteRow` instantiates its own
  `attemptTracker` at row scope and passes the resolved `attempt` into
  `registrarRecebimentoOrdemFio`, retaining/completing per the same rule.
- **`js/screens/pedido-detail-events.js`** (2691→2709 lines — this file's
  first growth under `PHASE-C3C-B`; explicitly authorized by this correction
  order, superseding §7 row 6's general "must not grow" default for this
  narrow, contracted purpose): `buildInsumosTransferForm`'s `linhas` array
  now carries one `attemptTracker` per line (created alongside `linhas`,
  outside `registrarRecebimentoOrdemFio`, persisted across multiple `onSave`
  invocations within the same modal session); `onSave`'s loop resolves each
  line's attempt by `{ordemId, kg: total, dataRec}` before calling
  `registrarRecebimentoOrdemFio`, and retains/completes per line
  independently, so one line's ambiguous failure does not affect another
  line's already-closed attempt.
- **No other product path was touched** (`js/screens/pedido-detail-data.js`,
  `op-persistir.js`, `op-recalculo.js`, `index.html`, `delete-helpers.js`
  required no change for either defect).

### 34.4 Transport ambiguity behavior — final policy

- **Ambiguous** (ANY RPC-call-level error except the exact `42883` case —
  network failure, timeout, aborted response, connection drop): fail closed,
  no flat fallback, error surfaced, the caller's tracker retains the current
  attempt so a retry of unchanged intent reuses the same token.
- **Deterministic** (a JSONB envelope was received — success or any
  `{ok:false,codigo:...}` — or the bounded `42883`/documented-inactive
  fallback occurred): the caller's tracker closes the attempt; the next
  submission, even with byte-identical intent, mints a new token.

### 34.5 Corrected evidence

- `node --check`: clean on all five corrected files and all five corrected/
  new test files.
- Per-file `node --test`: all pass except the same pre-existing, unrelated
  failures already documented in §33.7 (`tests/op-writes.smoke.js` tests 9/24;
  `tests/pedido-detail.smoke.js`'s pre-existing set) — with **two fewer**
  pre-existing failures than §33.7 recorded, both incidental: this
  correction's own edit to a shared regex-boundary string (used by three
  pre-existing, unrelated `tests/pedido-detail.smoke.js` tests to slice
  `buildInsumosTransferForm`'s source) also fixed that string's missing
  `\r?` (the file uses CRLF line endings), which had made those assertions
  never find their slice. Not an intentional scope change; disclosed, not
  hidden.
- Full mandatory Node suite (`node --test "tests/**/*.js"`): 3985 tests
  (+25 from this correction's own new/extended tests), 3863 pass, 122 fail.
  The 122 failing test names are a **subset** of the prior 124-name
  baseline (`diff` of sorted failing-name lists shows exactly the same two
  removed lines, zero added lines) — zero regressions attributable to this
  correction anywhere in the repository.
- `node scripts/validate-spec-custody.mjs`: **PASS**.
- `git diff --check` / `git diff --cached --check`: clean.

### 34.6 Idempotency lifecycle proof (corrected)

`tests/ordem-compra-receipt-cutover.smoke.js` (`createAttemptTracker` unit
tests) plus real-call-site integration tests with a real DOM click and a
stateful mocked RPC in `tests/op-nova.smoke.js` (tests 80–83) and
`tests/fornecedor-screens.smoke.js` (tests 43–46) together prove: (a) a
retry of unchanged intent after an ambiguous transport failure resends the
identical idempotency key; (b) changing kg or the date mints a new key; (c)
after a deterministic outcome (success or a recognized rejection), the next
submission — even with unchanged intent — mints a new key; (d) canonical
success never issues the flat fallback. `tests/op-writes.smoke.js` (tests
56–61) proves the shared helper's half of the contract directly: a
caller-supplied attempt is used verbatim, a retry with the same attempt
object sends the identical key twice, an ambiguous outcome is flagged
(`ambiguous:true`) and never triggers the flat fallback, and a deterministic
outcome is flagged `ambiguous:false`.
`tests/pedido-detail.smoke.js` proves, statically (§34.7 below), that the
same ownership/passing/retention pattern is wired at that call-site too; the
underlying mechanism it delegates to is the same one runtime-proven above.

### 34.7 Test corrections and additions

- `tests/ordem-compra-receipt-cutover.smoke.js`: fixed test 22 (a transport-
  level unrecognized error is now `'ambiguous_failure'`, not `'hard_failure'`);
  added tests 7b/7c/22b (exact-42883-only classification, both for the reader
  and the writer, message-text-alone no longer triggers fallback) and
  22c–22g (`createAttemptTracker` unit tests: reuse on unchanged intent, new
  token on changed kg/date, `complete()` closes the attempt, fresh token with
  no prior attempt).
- `tests/op-writes.smoke.js`: added tests 56–61 (caller-supplied attempt used
  verbatim; retry with the same attempt reuses the key; ambiguous failure
  flagged and never falls back; deterministic outcomes flagged
  `ambiguous:false`; backward-compatible internal attempt creation).
- `tests/op-nova.smoke.js`: added a `withReceiptAdapter` opt-in flag to
  `makeRenderSandbox`/`renderNovaOpForTest` (loading the adapter and
  `op-writes.js` unconditionally would have broken unrelated pre-existing
  tests whose default mocked RPC response is `{data:null,error:null}` — read
  by the adapter as a canonical success with zero rows instead of falling
  through to fixture data); opted tests 77–79 into it (fixing a latent gap:
  those tests previously exercised the flat-fallback path unconditionally,
  since the adapter was never loaded, so their "canonical" assertions were
  vacuous); added tests 80–83, each simulating a real DOM click on
  `buildOrdemPendenteRow`'s "Registrar" button against a stateful mocked RPC.
- `tests/fornecedor-screens.smoke.js`: extended `makeFornCutoverSandbox`'s
  `writeRpcResult` to accept a function (stateful per-call responses);
  added tests 43–46 (retry reuse, intent-change new token, deterministic-
  rejection new token, independence from `op-writes.js`).
- `tests/pedido-detail.smoke.js`: added three static tests verifying
  `buildInsumosTransferForm`'s tracker construction, per-call `resolveAttempt`
  invocation with the correct intent shape, and the retain-on-ambiguous /
  complete-on-deterministic branching — static and proportional, per §34.5's
  disclosed scope decision (no existing runtime-test harness exists for this
  file's bespoke `openMovementModal` overlay; every other reference to it in
  this suite is itself a static source-pattern assertion, the file's
  dominant convention).
- No other test file required a change for these two defects (`tests/op-persistir.smoke.js`,
  `tests/op-recalculo.smoke.js`, `tests/controlled-delete.smoke.js` remain
  unmodified, verified green).

### 34.8 Line-count and code-health report (corrected)

| File | §33 | §34 | Δ | Tier | Note |
|---|---|---|---|---|---|
| `js/screens/ordem-compra-receipt-cutover.js` | 179 | 257 | +78 | acceptable (≤500) | Crosses the 250-line ideal ceiling into acceptable; still well under 500. |
| `js/screens/op-writes.js` | 133 | 155 | +22 | ideal (≤250) | — |
| `js/screens/fornecedor.js` | 583 | 599 | +16 | exceptional (≤900) | Already over 500 before `PHASE-C3C-B`; no new tier crossed. |
| `js/screens/op-nova.js` | 1493 | 1511 | +18 | frozen exception (already >900) | Minimal wiring only; not precedent for new large screens. |
| `js/screens/pedido-detail-events.js` | 2691 | 2709 | +18 | (pre-existing, ungoverned — §18 residual debt) | First growth under this phase; explicitly authorized by this correction order (§ AUTHORIZED PRODUCT SCOPE), superseding §7 row 6's default for this narrow purpose only. |

No new function exceeds 150 lines. No file outside this table changed in
this correction.

### 34.9 Residual debts (unchanged from §33.8)

Unchanged: `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`,
`NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, the adapters'
canonical-branch code paths remain unverified against a live
`canonical_active` state, `op-recalculo.js`'s saldo-write path has no
canonical RPC replacement, and `pedido-detail-events.js` exceeding
`op-nova.js` in size without a frozen-exception label remains a pre-existing
governance gap. **New, disclosed (non-blocking):** `pedido-detail-events.js`'s
`onSave` retry-of-unchanged-intent behavior is proven statically, not by a
real DOM/runtime click simulation (§34.7) — a future phase may add a runtime
harness for `openMovementModal` if warranted; the underlying mechanism it
delegates to is fully runtime-proven at the other two call-sites and at the
adapter level.

### 34.10 Final state and next authorizable action

`LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ` (unchanged). `ACTIVE_PHASE:
NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. `PHASE-C3C-B: IMPLEMENTED / LOCALLY
VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` — unchanged; this correction does
**not** record supervisor acceptance. No dependent `OC-C3-*` requirement is
`SATISFIED`. The next authorizable action is supervisor review/acceptance of
this corrected implementation.

## 35. Supervisor-review correction — finite RPC-error classification + runtime idempotency proof (governs on conflict)

> **Append-only forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under the
> "FINAL TARGETED PHASE-C3C-B CORRECTION" order, issued against local commit
> `f9b1a54cc7b185a5e72f50209322d1473e93e850` (not yet pushed at order time;
> expected remote `staging/dev` at `ee5e87cd90f9e418925a99d6d51ad43cd38bedf0`).
> §§0–34 are preserved verbatim (no history rewrite). **Where §§1–34 and this
> §35 conflict, §35 governs.** Correction commit:
> `fix: complete C3C-B retry classification proof`, committed directly on top
> of `f9b1a54` without amending it. This section does **not** record
> supervisor acceptance — status remains `IMPLEMENTED / LOCALLY VERIFIED /
> AWAITING SUPERVISOR ACCEPTANCE`.

### 35.1 Supervisor finding

The correction at `f9b1a54` was still not accepted as final. Two further
gates, both within the existing `PHASE-C3C-B` scope:

1. **Gate 1 — RPC error classification was still too broad.** §34.4's policy
   classified every RPC-call-level error except the exact `42883` case as
   `'ambiguous_failure'` (retain-and-retry). The order identified this as
   incorrect: only a genuine transport ambiguity (no deterministic server
   response received at all) may be treated as retry-safe/attempt-retaining.
   Every other server-originated error — including permission errors
   (`42501`), data errors (`22P02`), PostgREST/schema errors, and any other
   recognized or unrecognized *received* response — is a **deterministic**
   outcome and must close the attempt, never silently retain it under the
   `'ambiguous_failure'` umbrella. The order required a finite,
   client-library-grounded predicate, not a "not-42883" catch-all.
2. **Gate 2 — no runtime proof for `pedido-detail-events.js`.** §34.7/§34.9
   disclosed that `buildInsumosTransferForm`'s idempotency wiring was proven
   only by static source-pattern assertions (regex-sliced text), unlike the
   other two real call-sites (`op-nova.js`, `fornecedor.js`), which already
   had real DOM-click + stateful-mock runtime tests. The order required an
   actual executed proof through the real save path — "static inspection is
   insufficient" — covering token retention/renewal, zero-flat-write on
   ambiguous/deterministic outcomes, and exactly-one-flat-write on the
   documented inactive signal.

### 35.2 Root cause

**Gate 1.** §34's classification was designed around the single fact pattern
it had evidence for at the time (the exact `42883` bounded-deployment
signal) and defaulted every other error to the retry-safe branch out of
caution, without grounding that default in the actual transport-level
semantics of the client library in use. This produced a policy that was
*safe* (never silently drops a write) but *incorrect* (treats deterministic
server rejections — e.g. a real permission denial — as if the server's
commit status were unknown, which both misinforms the caller and keeps a
stale attempt token alive indefinitely for an error that will never resolve
differently on retry).

**Gate 2.** §34.7 explicitly disclosed the static-only scope decision for
`pedido-detail-events.js`, reasoning that no runtime-test harness existed for
its bespoke `openMovementModal` overlay. This was true when §34 was written,
but a full runtime harness (`makeHubRuntime()`, already used by ~30
pre-existing `tests/pedido-detail.smoke.js` tests for this exact file's
other modals) already existed in the same test file and had simply not yet
been extended to load the receipt-cutover adapter and `op-writes.js`, nor to
drive `openMovementModal`'s Insumos→Tecelagem transfer form specifically.

### 35.3 Correction — files and behavior

- **`js/screens/ordem-compra-receipt-cutover.js`** (257→298 lines): replaced
  the "any error except 42883 ⇒ ambiguous" rule with a finite three-way
  classification, grounded in the real `@supabase/postgrest-js` response
  shape (verified directly against the vendored copy at
  `services/documents-ingestor/node_modules/@supabase/postgrest-js/dist/cjs/PostgrestBuilder.js`,
  the same client library `window.supa` wraps per `js/supabase-client.js`):
  `PostgrestBuilder.then()` performs `fetch()`; every deterministic HTTP
  response — success or error, since the server actually replied — resolves
  with the real HTTP `status` from the `Response` object. Only when the
  `fetch()` promise itself **rejects** (network failure, DNS failure,
  timeout, abort, CORS) does the builder's own
  `.catch((fetchError) => ({ error: {...}, data: null, count: null, status: 0,
  statusText: '' }))` handler fire — the **only** code path that produces
  `status: 0`. `isTransportAmbiguous(res)` therefore checks `!!res.error &&
  res.status === 0` — exact and finite, never inferred from `error.message`
  text. Every other `res.error` (any status other than exactly `0`, or the
  bounded exact-`42883` missing-function signal, or the documented inactive
  envelope) is `'hard_failure'` or `'legacy_fallback'` per §35.4, never
  `'ambiguous_failure'`.
- **`tests/ordem-compra-receipt-cutover.smoke.js`** (366→475 lines): renamed/
  rewrote the transport-ambiguity tests to simulate an actual `status: 0`
  fetch-rejection shape instead of a bare `{code, message}` object; added
  dedicated tests for a timeout/abort (`AbortError`, `status: 0`), for a
  non-`42883` code carrying missing-function-like message text but a real
  HTTP status (`hard_failure`, proving message-text is never sufficient),
  for `isTransportAmbiguous`'s own exact truth table (error+status:0 only —
  a missing `status` must never default to ambiguous), and for four
  representative deterministic server rejections (`42501`, `22P02`, a
  PGRST-prefixed schema error, and a bodyless-but-real HTTP rejection) all
  asserting `'hard_failure'`.
- **`tests/op-writes.smoke.js`**, **`tests/fornecedor-screens.smoke.js`**,
  **`tests/op-nova.smoke.js`**: the existing ambiguous-transport-failure test
  fixtures (previously a bare `{code:'08006', message:'connection timeout'}`
  object with no `status` field) were updated to the real fetch-rejection
  shape (`status: 0, statusText: ''`), since under the corrected, stricter
  predicate a `res` without `status: 0` is no longer classified ambiguous —
  these fixtures needed to match the real transport-level shape they are
  meant to simulate, not just any error object.
- **`tests/pedido-detail.smoke.js`** (3034→3279 lines): extended
  `makeHubRuntime()` to also load the real adapter
  (`js/screens/ordem-compra-receipt-cutover.js`) and the real
  `js/screens/op-writes.js` into the same `vm.createContext` sandbox
  (previously it loaded only the detail-screen bundle and the shared
  distribution-UI builder), plus a deterministic `window.crypto.randomUUID`
  stub so generated idempotency tokens are observable/assertable. Added two
  new runtime tests (§35.6) that call `handlers.openMovementModal(...)` for
  real and drive `window.registrarRecebimentoOrdemFio` end-to-end through
  the real adapter — no stubbed helper, only `window.supa` mocked at the
  `rpc`/`from` boundary — satisfying Gate 2 without any product-code
  extraction (the order's fallback-of-last-resort was not needed).
- **No product path other than the adapter was touched** (`op-writes.js`,
  `fornecedor.js`, `op-nova.js`, `pedido-detail-events.js`, `index.html`
  required no change for either gate — both gates were satisfiable entirely
  within the adapter's classification logic and the test suite).

### 35.4 Finite RPC-error classification — final policy

- **`legacy_fallback`** — exactly one of: `error.code === '42883'` (the
  bounded missing-function deployment-sequencing signal, unchanged from
  §32.4/§34); the documented canonical-reader-inactive signal
  (`error.code === '55000'` with the `listar_compat_inativo` message,
  unchanged); the documented canonical-writer-inactive result envelope
  (`{ok:false, codigo:'recebimento_compat_inativo'}`, unchanged). The caller
  runs its exact existing legacy fallback.
- **`ambiguous_failure`** — exactly `!!res.error && res.status === 0`: the
  `fetch()` call itself never received an HTTP response (connection refused,
  DNS failure, timeout, aborted request, CORS failure). Server commit status
  is genuinely unknown. The caller fails closed (no flat fallback) and its
  tracker **retains** the current attempt so a retry of unchanged intent
  reuses the same idempotency token.
- **`hard_failure`** — every other `res.error`: any received JSONB envelope
  with `{ok:false, codigo:...}` other than the documented inactive code
  (`db/76`'s outer `EXCEPTION WHEN OTHERS` guarantees this instead of a
  raised error for every business-logic condition), or any RPC-call-level
  error that **did** receive a real HTTP status (permission errors such as
  `42501`, data errors such as `22P02`, PGRST-prefixed API/schema errors,
  RPC signature/payload errors, or any other recognized or unrecognized
  server-originated response with a non-zero status). The request completed
  deterministically. The caller surfaces it and its tracker **closes** the
  attempt — a further submission, even of byte-identical intent, is a new
  attempt with a new token. Ambiguity is never inferred from `error.message`
  text alone, in either direction.

This supersedes §34.4's "any error except 42883 ⇒ ambiguous" wording; §34.4
is preserved above as authored (append-only), superseded by this §35.4 per
the governs-on-conflict rule.

### 35.5 Corrected evidence

- `node --check`: clean on all six changed files (one product file, five
  test files).
- Per-file `node --test`: all pass except the same pre-existing, unrelated
  failures already documented in §33.7/§34.5 — no new per-file failure
  introduced by this correction. `tests/pedido-detail.smoke.js` run in
  isolation: 189 tests, 152 pass, 37 fail (the exact same 37 pre-existing,
  unrelated failures present before this correction, confirmed by a
  `git stash`/`stash pop` differential run against the unmodified file at
  `f9b1a54` — 187 tests, 150 pass, 37 fail, byte-identical failing-name set).
- Full mandatory Node suite (`node --test "tests/**/*.js"`): **before**
  (`f9b1a54`, via `git stash` of only the six changed tracked files, `.gitignore`
  and `.mcp.json` residue untouched): 3985 tests, 3863 pass, 122 fail.
  **After** (this correction, stash popped): 3993 tests, 3871 pass, 122 fail.
  `diff` of the sorted failing-test-name lists between the two runs is
  **empty** — the 122 failing names are byte-identical before and after;
  zero regressions anywhere in the repository; the 8 additional passing
  tests are exactly this correction's own new/extended tests.
- `node scripts/validate-spec-custody.mjs`: **PASS**.
- `git diff --check` / `git diff --cached --check`: clean.

### 35.6 Runtime idempotency proof for `pedido-detail-events.js` (Gate 2, corrected)

Two new tests in `tests/pedido-detail.smoke.js`, both calling the real
`handlers.openMovementModal(view.stepper[0].transfer)` against a real
Insumos→Tecelagem receipt form, clicking the real "Registrar recebimento"
button (`_listeners.click`), and reading/writing the real kg/date `<input>`
nodes found in the rendered DOM tree — `window.supa` is mocked only at the
`rpc`/`from` boundary, never the helper itself:

1. **"...retem/renova o token de idempotencia..."** — a sequence of seven
   real clicks against one ordem-fio line proves, in order: (a) the first
   submission mints a token; (b) an ambiguous transport failure
   (`status: 0`) causes zero flat writes and a retry with unchanged kg/date
   resends the identical token — this is only possible because the tracker
   lives in `buildInsumosTransferForm`'s closure, outside `onSave`, and is
   never recreated per click; (c) changing only the kg value mints a new
   token; (d) changing only the date (kg unchanged) mints another new token;
   (e) a retry of that same intent still reuses that token, but this time a
   **deterministic** rejection (`42501`, real HTTP status) closes the
   attempt; (f) the next submission, even with byte-identical intent, mints
   a fresh token — proving the deterministic failure actually closed the
   prior attempt rather than merely coincidentally differing — and this
   time a canonical success is returned, which reloads/re-renders the whole
   modal (`refreshPedidoTransitionModal`); (g) a further submission after
   that success/remount (against the freshly rebuilt tracker, saldo now
   reduced) mints yet another new token, proving a submission after
   completion never reuses a closed attempt. Zero flat (`window.supa.from`)
   writes occur across all seven submissions.
2. **"...sinal de escritor inativo aciona exatamente um fallback plano..."**
   — a single real click, with the mocked RPC returning the documented
   `{ok:false, codigo:'recebimento_compat_inativo'}` envelope, proves the
   canonical RPC is attempted first (exactly one call) and the flat fallback
   (`window.supa.from('ordens_compra_fio').update(...).eq('id', ...)`) fires
   **exactly once**, with the correct absolute kg/date/status payload.

This closes §34.9's disclosed non-blocking debt
("`pedido-detail-events.js`'s ... retry-of-unchanged-intent behavior is
proven statically, not by a real DOM/runtime click simulation") for this
specific call-site: all three real receipt-writing call-sites
(`op-nova.js`, `fornecedor.js`, `pedido-detail-events.js`) now have real
DOM-click + stateful-mock runtime proof, none relies on static/regex
assertion alone for its idempotency retention behavior. The three
pre-existing static §34.7 tests in `tests/pedido-detail.smoke.js` (tracker
construction, `resolveAttempt` call shape, retain/complete branching by
source pattern) are left in place, unmodified — they are still true and
proportionate as a fast structural check, now supplemented (not replaced)
by the runtime proof above, per the order's own "supplemented, not
necessarily replaced" framing was not required verbatim but is the natural
reading of "static inspection is insufficient" alongside an already-passing
static suite.

### 35.7 Test corrections and additions

- `tests/ordem-compra-receipt-cutover.smoke.js`: see §35.3's bullet above —
  net effect is the writer's ambiguous-failure test now simulates a real
  `status: 0` fetch-rejection; a sibling test added for the timeout/abort
  variant; a test added proving a non-`42883` code with missing-function-like
  message text but a real HTTP status is `hard_failure`; a dedicated
  `isTransportAmbiguous` truth-table test; four new deterministic-rejection
  tests (`42501`, `22P02`, PGRST-prefixed, bodyless real HTTP rejection).
- `tests/op-writes.smoke.js`, `tests/fornecedor-screens.smoke.js`,
  `tests/op-nova.smoke.js`: existing ambiguous-transport-failure fixtures
  updated to the real `status: 0` shape (no test behavior/assertion added or
  removed, only the simulated transport shape corrected to match what it
  claims to simulate).
- `tests/pedido-detail.smoke.js`: `makeHubRuntime()` extended to load the
  real adapter and `op-writes.js` plus a deterministic `crypto.randomUUID`
  stub; two new runtime tests added (§35.6). No pre-existing test in this
  file was removed or weakened.
- No other test file required a change for either gate
  (`tests/op-persistir.smoke.js`, `tests/op-recalculo.smoke.js`,
  `tests/controlled-delete.smoke.js` remain unmodified, verified green).

### 35.8 Line-count and code-health report (corrected)

| File | §34 | §35 | Δ | Tier | Note |
|---|---|---|---|---|---|
| `js/screens/ordem-compra-receipt-cutover.js` | 257 | 298 | +41 | acceptable (≤500) | Still well under 500; no new tier crossed. |
| `tests/ordem-compra-receipt-cutover.smoke.js` | 366 | 475 | +109 | test file, no product tier | New classification/tracker tests. |
| `tests/op-writes.smoke.js` | 1194 | 1196 | +2 | test file, no product tier | Fixture shape correction only. |
| `tests/fornecedor-screens.smoke.js` | 1296 | 1296 | 0 | test file, no product tier | Fixture shape correction only (net-zero). |
| `tests/op-nova.smoke.js` | 1878 | 1878 | 0 | test file, no product tier | Fixture shape correction only (net-zero). |
| `tests/pedido-detail.smoke.js` | 3034 | 3279 | +245 | test file, no product tier | Runtime-harness extension + two new runtime tests. |

No product file other than the adapter changed in this correction. No new
function exceeds 150 lines.

### 35.9 Residual debts (updated from §34.9)

Unchanged: `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`,
`NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, the adapters'
canonical-branch code paths remain unverified against a live
`canonical_active` state, `op-recalculo.js`'s saldo-write path has no
canonical RPC replacement, and `pedido-detail-events.js` exceeding
`op-nova.js` in size without a frozen-exception label remains a pre-existing
governance gap. **Resolved by this correction:** §34.9's disclosed debt
("`pedido-detail-events.js`'s `onSave` retry-of-unchanged-intent behavior is
proven statically, not by a real DOM/runtime click simulation") — §35.6 now
provides that runtime proof; the debt entry is removed, not carried forward.

### 35.10 Final state and next authorizable action

`LAST_ACCEPTED_PHASE: PHASE-C3C-B-DB-PREREQ` (unchanged). `ACTIVE_PHASE:
NONE`. `ACTIVE_PHASE_CONTRACT: NONE`. `PHASE-C3C-B: IMPLEMENTED / LOCALLY
VERIFIED / AWAITING SUPERVISOR ACCEPTANCE` — unchanged; this correction does
**not** record supervisor acceptance. No dependent `OC-C3-*` requirement is
`SATISFIED`. Per the issuing order, a fast-forward push of both `f9b1a54`
and this correction's commit to `staging/dev` is authorized once all gates
pass (§35.5); this authorization is explicit and does not itself constitute
supervisor acceptance of the implementation. The next authorizable action
after the push is supervisor review/acceptance of this corrected
implementation. **HARD STOP** — `PHASE-C3D` is not started by this
correction.
