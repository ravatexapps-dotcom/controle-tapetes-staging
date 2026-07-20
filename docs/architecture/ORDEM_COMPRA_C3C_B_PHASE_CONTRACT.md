# PHASE-C3C-B Material Phase Contract — Application Compatibility/Adaptation

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3C-B
STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED
<!-- MATERIAL_PHASE_CONTRACT:END -->

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

## 30. Corrected contract status and database blockers

- `STATUS` (unchanged): **PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
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
- **Traceability note.** The `OC-C3-READ-001` / `OC-C3-WRITE-001` dispositions in
  `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` (currently
  `PARTIALLY_SATISFIED`, reflecting the installed `db/75` foundation) are **not**
  changed by this documentation-only correction; whether to record them as
  `BLOCKED` is a matter for supervisor acceptance of this contract, not for this
  pass (the contract remains `PROPOSED`).
- **Next step:** read-only supervisor review of this corrected contract. This
  correction authorizes no implementation and no database, staging, production,
  or environment action.
