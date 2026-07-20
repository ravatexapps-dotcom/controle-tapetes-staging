# C3C-B Database Compatibility Prerequisites — Material Phase Contract

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3C-B-DB-PREREQ
STATUS: PROPOSED / AWAITING SUPERVISOR ACCEPTANCE / IMPLEMENTATION NOT AUTHORIZED
<!-- MATERIAL_PHASE_CONTRACT:END -->

> **Role of this document.** This is a **material phase contract**, authored
> under `docs/governance/DOCUMENTATION_MODEL.md` §19 and
> `docs/governance/AGENT_INSTRUCTIONS.md` §3/§6, by order
> `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1`. It defines the exact
> **database** forward corrections required before `PHASE-C3C-B` (application
> compatibility/adaptation, `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`)
> can be authorized, per the two hard stops recorded in that contract's §25/§26
> (`C3C-B-MATERIAL-PHASE-CONTRACT-R1` forward correction, accepted
> `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
> AUTHORIZED` in this same pass). It creates **no new requirement ID** in the
> ratified registries, changes **no normative anchor**, and authorizes **no
> implementation, no migration, and no product-file change**. `PROJECT_STATE.md`
> remains the sole owner of `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`; both remain
> `NONE` after this document is committed. This contract becomes actionable
> only when the architect separately authorizes `PHASE-C3C-B-DB-PREREQ` and
> sets `ACTIVE_PHASE_CONTRACT` to this file's path.

## 1. Authorization source and entry checkpoint

- **Authorization source for this authoring pass:** architect order
  `C3C-B-DB-COMPATIBILITY-PREREQUISITES-CONTRACT-R1`, executed as a
  documentation-only pass under `docs/governance/AGENT_INSTRUCTIONS.md`. This
  order authorizes (a) recording supervisor acceptance of the corrected
  `C3C-B-MATERIAL-PHASE-CONTRACT-R1` with disposition
  `ACCEPTED_WITH_BLOCKING_DATABASE_PREREQUISITES / IMPLEMENTATION NOT
  AUTHORIZED`, and (b) authoring this new contract. It does **not** authorize
  `PHASE-C3C-B-DB-PREREQ` implementation, any migration, or any product-file
  change.
- **Entry checkpoint (Git):** branch `dev`, HEAD at authoring time
  `6585a6c6d1837a3e0044bac8c603ffe866b73e05`, parent
  `84e7b61fecd5c406793ccc1962cb77b97a6bd015`, index empty, preserved residue
  modified `.gitignore` only (pre-existing, unrelated).
- **Immediately preceding action:** `C3C-B-MATERIAL-PHASE-CONTRACT-R1` forward
  correction (commit `6585a6c6d1837a3e0044bac8c603ffe866b73e05`), which recorded
  supervisor verdict `CHANGES_REQUIRED` and two hard stops (§25 read-contract,
  §26 command-adapter) in
  `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`. This contract is the
  direct, exact response to those two hard stops.
- **Active product phase at authoring time:** `NONE`. **Active phase contract
  at authoring time:** `NONE`. This document does not change either value.

## 2. Dependencies (documents this contract reads and binds to)

- `docs/governance/AGENT_INSTRUCTIONS.md` — bootstrap/evidence/safety authority.
- `PROJECT_STATE.md` — `SPEC_CUSTODY_BOOTSTRAP` block; current-state owner.
- `docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` — the application
  compatibility/adaptation contract this phase unblocks; §§25–30 are the exact
  hard-stop findings this contract closes.
- `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.29 (unchanged)
  and §R.31 (governance metadata, unchanged).
- `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §13.15–13.17 (unchanged).
- `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` — active-track
  traceability (derived; updated by this pass per §11 below, no architecture
  created).
- `db/67_ordem_compra_refoundation_schema.sql` — origin of `ordem_compra`,
  `ordem_compra_item`, `ordem_compra_item_alocacao`, `necessidade_compra_fio`,
  `ordem_compra_item_compat_fio`, and the REFUND-A one-time compat-mapping seed
  (51 header-bearing legacy rows, verified reconciliation `64/51/51/51/51`).
- `db/68_ordem_compra_native_draft_admin.sql`,
  `db/69_ordem_compra_preprod_allocation.sql` — native admin read models
  (`listar_ordens_compra_admin`, `obter_ordem_compra_admin`,
  `obter_distribuicao_ordem_compra`) this contract's Component A is modeled
  after (same JSONB/relational idioms, same `is_admin()`/`SECURITY DEFINER`
  pattern), and the now-granted `alocar_necessidade_compra_fio` allocation
  writer.
- `db/70_ordem_compra_native_receipt_foundation.sql` — full read of the native
  receipt/reversal command bodies (`registrar_recebimento_ordem_compra`,
  `estornar_recebimento_ordem_compra`, both since renamed by `db/75` to
  `_c3c_registrar_recebimento_impl`/`_c3c_estornar_recebimento_impl`), the
  ledger triggers (`trg_native_lancamento_shape_guard`,
  `trg_native_lancamento_derive_state`), and `_resultado_comando_recebimento`.
  This is the exact mechanism Component B extends.
- `db/71_ordem_compra_c3a_cutover_foundation.sql` — the exact
  `ordem_compra_item.kg_recebido`/`ordem_compra.status_recebimento` derivation
  logic used at cutover-import time (source of Component A's cache-reuse
  design).
- `db/74_ordem_compra_hybrid_origin_forward_correction.sql`,
  `db/75_ordem_compra_c3c_inactive_cutover.sql` — read for the current ACL/state
  boundary; **not modified or reasoned about as pending** by this contract (§8).
- `js/screens/op-writes.js`, `js/screens/fornecedor.js`,
  `js/screens/pedido-detail-data.js`, `js/screens/op-nova.js` — the exact
  legacy reader/writer shapes Component A/B must reproduce/accept (already
  read field-by-field in the corrected `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`
  §25/§26; not re-read verbatim here — that analysis is incorporated by
  reference and is the direct basis for §5/§6 below).
- `tests/ordem-compra-native-receipt.smoke.js`,
  `tests/ordem-compra-c3c-inactive.smoke.js`,
  `tests/ordem-compra-c3c-inactive.integration.sql`,
  `tests/ordem-compra-c3c-inactive-concurrency.mjs` — precedent test shapes
  this contract's §13 test manifest follows.

## 3. Governing specifications and normative anchors

- **Governing spec (unchanged):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  §R.29 — specifically §R.29.1 (dependency matrix), §R.29.2 (normalized
  canonical read contract — the shape Component A must reproduce for the
  three legacy consumers), §R.25 (native receipt foundation, the command
  family Component B extends).
- **Technical contract (unchanged):** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  §13.15 (C3B executable contract), §13.16 (C3C-A closeout).
- **This contract creates no new requirement ID** in `§R.31`/`§13.17`. It
  proposes two draft identifiers for future ratification only (§14); neither
  registry file is edited by this pass.
- **This contract touches no `db/*.sql` file.** It specifies the exact content
  of one future migration, `db/76_ordem_compra_c3c_b_db_prerequisites.sql`
  (§9), which does not exist on disk and is not created by this pass.

## 4. Exact objective

Close the two hard stops recorded in
`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §25/§26 by defining,
to migration-ready precision, exactly **two tightly coupled database
components**, treated as one material prerequisite phase (per the order's
design principle: no microphases, but each component gets its own complete
interface, tests, evidence, and acceptance criteria):

- **Component A** (§5): a canonical, client-authorized **order-catalog
  projection** that returns every legacy-compat purchase-order row — including
  pending/zero-receipt orders — in the shape the three legacy consumers
  (`fornecedor.js`, `pedido-detail-data.js`, `op-nova.js`) require.
- **Component B** (§6): a canonical, client-authorized **atomic legacy
  receipt-intent adapter** that accepts the legacy absolute-total interaction
  intent and atomically translates it into the native immutable
  receipt/reversal ledger, resolving flat→native identity server-side.

Both components are **independent of the C3 cutover state machine**
(`ordem_compra_cutover`/`read_authority`, `db/75`). They read/write the
**native four-layer model** (`ordem_compra`/`ordem_compra_item`/
`ordem_compra_item_alocacao`/`ordem_compra_fio_lancamentos`) directly, through
the **already-existing, already-populated** `ordem_compra_item_compat_fio`
compatibility bridge (`db/67`, REFUND-A). Neither component requires, waits
for, or is gated by the real C3 cutover (§R.29.5) — this is the exact property
that lets `PHASE-C3C-B`'s application adapters (once this DB phase is
authorized, implemented, and applied) operate correctly **today**, while
`legacy_active`, without a synchronized cutover window.

This contract does **not** flip cutover state, does not import data, does not
close ACLs, does not build UI, and does not touch `db/75`'s cutover objects.

## 5. Component A — canonical order-catalog projection

### 5.1 Exact RPC name and signature

```sql
public.listar_ordens_compra_fio_compat(
  p_pedido_id UUID    DEFAULT NULL,
  p_op_id     BIGINT  DEFAULT NULL
) RETURNS TABLE (
  ordens_compra_fio_id      BIGINT,
  ordem_compra_id           BIGINT,
  ordem_compra_item_id      BIGINT,
  pedido_id                 UUID,
  op_id                     BIGINT,
  op_ids_multiplos          BOOLEAN,
  op_numero                 INTEGER,
  op_ano                    INTEGER,
  op_label                  TEXT,
  fornecedor_id             BIGINT,
  fornecedor_nome           TEXT,
  tipo                      TEXT,
  material                  TEXT,
  cor_id                    BIGINT,
  cor_nome                  TEXT,
  cor_poliester             TEXT,
  kg_pedido                 NUMERIC,
  kg_recebido               NUMERIC,
  kg_recebido_atribuido     NUMERIC,
  kg_excesso                NUMERIC,
  status                    TEXT,
  status_administrativo     TEXT,
  status_aceite             TEXT,
  status_recebimento        TEXT,
  data_recebimento          DATE,
  alocacoes                 JSONB
)
```

`LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''`, `ALTER
FUNCTION ... OWNER TO postgres`, `REVOKE ALL ... FROM PUBLIC, anon,
service_role`, `GRANT EXECUTE ... TO authenticated` — same idiom as every
existing RPC in this file family (`db/68`/`db/69`/`db/75`).

### 5.2 Returned row shape and grain (closes §25 shape matrix)

Two output grains, selected by which scoping parameter is supplied — chosen
because the three real consumers use two genuinely different grains today
(re-verified against the exact call sites in
`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §7 rows 2/4/5):

- **Item grain** (`p_op_id IS NULL`) — one row per
  `ordem_compra_item_compat_fio` mapping (i.e., isomorphic 1:1 with a legacy
  flat row — closes gap #1, flat-row identity). `kg_pedido`/`kg_recebido` are
  the item's whole totals (`ordem_compra_item.kg_pedido`/`.kg_recebido`,
  already-maintained caches — closes gap #8/#9). This is what `fornecedor.js`
  (no filter, supplier-scoped) and `pedido-detail-data.js`
  (`p_pedido_id`-scoped, needs every order under the Pedido regardless of
  which OP) both actually consume.
- **OP-attributable grain** (`p_op_id IS NOT NULL`) — one row per
  (item × allocation belonging to that OP). `kg_pedido` becomes that
  allocation's `kg_alocado` (the OP's true committed share); `kg_recebido`
  becomes the ledger sum scoped to `ordem_compra_item_alocacao_id = <that
  allocation>` only. This satisfies §R.29.2's "OP-level consumers include only
  real OP-attributable quantities; they do not absorb Pedido-origin or excess
  quantities" and matches `op-nova.js`'s `fetchOrdensCompraFio(opId)`, which
  filters `.eq('op_id', opId)` and must never double-count a Pedido-shared item
  spanning multiple OPs.

Per-column closure of the §25 gap list:

| Gap (§25) | Closed by |
|---|---|
| #1 flat-row identity | `ordens_compra_fio_id` (item grain), always populated |
| #2/#3 native order/item/allocation identity | `ordem_compra_id`, `ordem_compra_item_id`, `alocacoes[].alocacao_id` |
| #4 Pedido | `pedido_id` (direct column on `ordem_compra`) |
| #5 OP | `op_id` — singular when every allocation of the item shares one non-null OP; `NULL` with `op_ids_multiplos=true` when allocations span multiple OPs or include a Pedido-shared/no-OP allocation, per §R.29.2's "no representative or fabricated OP" rule; `alocacoes` always carries the full per-allocation `op_id`/`op_numero`/`op_ano` breakdown (same shape as `obter_distribuicao_ordem_compra`'s existing `alocacoes` array, `db/69` L808–814) |
| #6 supplier scoping | `fornecedor_id`/`fornecedor_nome`; caller scoping is `is_admin()` OR the caller's own matching `usuarios.fornecedor_id = ordem.fornecedor_id`, identical block to `listar_recebimentos_ordem_compra_normalizados` (`db/75` L325–332) |
| #7 material/color | `tipo` (legacy-named passthrough of `material`, so existing `rotuloFio()`-style JS helpers need no change), `material`, `cor_id`, `cor_nome` (joined), `cor_poliester` |
| #8 `kg_pedido` | item grain: `ordem_compra_item.kg_pedido`; OP grain: allocation's `kg_alocado` |
| #9 `kg_recebido` | item grain: `ordem_compra_item.kg_recebido` (live-maintained cache, `db/70` trigger `trg_native_lancamento_derive_state` L334, `db/71` L114–116 at import time) — reproduces the legacy absolute-cumulative field exactly, no client aggregation needed |
| #10/#11 attributed/excess | `kg_recebido_atribuido` = `SUM(l.kg_recebido) WHERE ordem_compra_item_alocacao_id IS NOT NULL`; `kg_excesso` = `SUM(l.kg_recebido) WHERE ordem_compra_item_alocacao_id IS NULL`, both scoped to the row's grain; `kg_recebido = kg_recebido_atribuido + kg_excesso` always holds (no double counting, per §R.29.2) |
| #12 administrative/acceptance/receipt status | `status_administrativo`, `status_aceite`, `status_recebimento` — direct passthrough, same fields `listar_ordens_compra_admin` already projects for native orders |
| #12b legacy `status` | `status` — derived exactly as the legacy writers derive it today (`'pendente'` when `kg_recebido=0`; `'recebido_parcial'` when `0 < kg_recebido < kg_pedido`; `'recebido_total'` when `kg_recebido >= kg_pedido`), for byte-identical downstream `OCF_STATUS_LABEL`/render-branch compatibility |
| #13 receipt date | `data_recebimento` = `MAX(l.data_recebimento)` over the row's ledger scope — "effective/latest receipt date" (native ledger allows multiple discrete events per item, unlike the legacy single absolute date field; `NULL` when `kg_recebido=0`) |
| #14/#15 zero-receipt/pending rows | **Not dropped.** The `FROM` clause anchors on `ordem_compra_item_compat_fio` (item grain) or `ordem_compra_item_alocacao` (OP grain) — both populated independently of any receipt — `LEFT JOIN`ed to the ledger for aggregation. A pending order with zero lançamentos still produces exactly one row, `kg_recebido=0`, `status='pendente'`. This is the structural fix for the INNER-JOIN drop found in §25 against `listar_recebimentos_ordem_compra_normalizados`. |
| #16 supplier-facing label | `op_numero`, `op_ano`, `op_label` (formatted `'Nº ' || numero || '/' || ano`, byte-identical to `fornecedor.js`'s own `lote()` helper, L447) — `NULL` at item grain when `op_ids_multiplos`; always populated at OP grain |

### 5.3 Scoping and authorization (closes §25 gaps #6/#28 supplier disposition)

- Admin: unrestricted (`is_admin()` true) across `p_pedido_id`/`p_op_id`
  filters.
- Supplier: caller must resolve to an active `usuarios.fornecedor_id`; rows
  are filtered `WHERE oc.fornecedor_id = v_supplier_id`, identical mechanism
  to `listar_recebimentos_ordem_compra_normalizados`. Neither admin nor
  supplier bypasses base-table RLS by grant — the function is `SECURITY
  DEFINER` and performs its own authorization check before returning any row,
  same pattern already accepted for every C3 reader/writer in this codebase.
- Anonymous/unauthenticated: `sem_permissao`, no rows.

### 5.4 Ongoing compat-mapping coverage gap — named residual, not silently closed

`ordem_compra_item_compat_fio` was seeded **once**, by REFUND-A (`db/67`,
2026-07-18), for the **51 header-bearing legacy rows that existed at that
time**. No `native_bridge`-origin writer was ever built (`db/67` L428 comment;
confirmed absent in `db/68`–`db/75` by an exhaustive grep for
`native_bridge`). `js/screens/op-persistir.js`'s legacy branch (§7 row 3 of
the corrected `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`) is **still live** and
still creates new flat `ordens_compra_fio` rows whenever a Pedido resolves to
the legacy purchasing regime — every such row created **after** the REFUND-A
seed has **no** compat mapping and is **invisible** to Component A (zero rows
for that order, not an error).

This contract's migration (§9) closes the gap that exists **at
apply-time only**: an idempotent re-run of the REFUND-A backfill logic,
scoped to currently-unmapped header-bearing rows (`WHERE NOT EXISTS (SELECT 1
FROM ordem_compra_item_compat_fio WHERE ordens_compra_fio_id = f.id)`),
extending `necessidade_compra_fio`/`ordem_compra`/`ordem_compra_item`/
`ordem_compra_item_alocacao`/`ordem_compra_item_compat_fio` for every such row
present at migration-apply time.

**It does not close the gap going forward.** Any flat row created by
`op-persistir.js`'s legacy branch **after** this migration is applied remains
unmapped and invisible to Component A until either (a) a future,
separately-authorized live bridge-writer phase creates the mapping at
flat-row-creation time (would require modifying `op-persistir.js`, a product
file explicitly out of this contract's scope — §8), or (b) the backfill is
re-run periodically as an operational procedure. **This is recorded as an
explicit residual debt (§16), not a solved problem** — the future
`PHASE-C3C-B` implementation order and/or its own closeout must re-affirm
this boundary, and the architect should decide the follow-up disposition
(recurring backfill job vs. live bridge writer) as its own separate,
explicitly authorized action.

### 5.5 State-machine behavior (closes §12-style requirement for Component A)

| Cutover state | Component A behavior |
|---|---|
| `legacy_active` (current, permanent through this and the `PHASE-C3C-B` window) | **Fully reachable and correct** for every compat-mapped row. Not gated by `read_authority` — reads `ordem_compra_item`/`ordem_compra_item_alocacao`/`ordem_compra_fio_lancamentos` directly, independent of the C3 cutover singleton. |
| `maintenance_fenced` | Unaffected — Component A performs no write and touches no table in the C3C-A protected-mutation-guard list (`trg_c3c_protected_mutation_guard`, `db/75` L179–182) except through `SELECT`; a concurrent fence does not block reads. |
| `canonical_active` | Unaffected — remains correct; native-origin orders it may also encounter (`legado=false`, out of this contract's consumer scope per §8.3) are simply not returned (`WHERE oc.legado = TRUE` in the item-grain `FROM` clause), since this projection is exclusively for legacy-compat rows — pure-native orders remain `listar_ordens_compra_admin`'s exclusive domain. |

### 5.6 Deterministic ordering

Item grain: `ORDER BY ordens_compra_fio_id`. OP grain: `ORDER BY
ordem_compra_item_id, alocacao_id`. No pagination — matches every existing
unpaginated admin/supplier RPC in this codebase (`listar_ordens_compra_admin`,
`listar_recebimentos_ordem_compra_normalizados`).

## 6. Component B — atomic legacy receipt-intent adapter

### 6.1 Critical prerequisite finding — the native command excludes `legado=TRUE`

`_c3c_registrar_recebimento_impl` (the renamed `db/70` implementation,
`db/75` L226–229) contains, unconditionally:

```sql
IF v_order.legado OR v_order.status_administrativo <> 'emitida' THEN
  RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido', ...);
END IF;
```

Every legacy-compat order has `ordem_compra.legado = TRUE` (REFUND-A seed,
`db/67` L654–659). **Delegating Component B to the existing native
receipt/reversal implementation functions is not possible** — they refuse
every legacy-compat order by explicit, deliberate design (the native command
family was built exclusively for native-regime orders, `PHASE-C2`/§R.25).
Component B is therefore **not a thin wrapper around the existing commands**;
it is a **new, parallel entry point** that reuses the same immutable ledger
tables and the same table-level triggers (which carry no `legado` check at
all — verified: neither `trg_native_lancamento_shape_guard` nor
`trg_native_lancamento_derive_state`, `db/70` L200–407, references
`ordem_compra.legado` anywhere), with its **own** legacy-appropriate
eligibility gate (§6.4). This satisfies "must not create a second receipt
ledger" literally — same tables, same triggers, same caches, same immutable
history — while providing the different business-rule gate legacy orders
require.

### 6.2 Exact RPC name and signature

```sql
public.registrar_recebimento_ordem_compra_fio_compat(
  p_ordens_compra_fio_id BIGINT,
  p_kg_total_absoluto    NUMERIC,
  p_data_recebimento     DATE,
  p_idempotency_key      TEXT,
  p_documento_ref        TEXT DEFAULT NULL,
  p_origem_ref           TEXT DEFAULT NULL
) RETURNS JSONB
```

`LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''`, owner `postgres`,
`REVOKE ALL ... FROM PUBLIC, anon, service_role`, `GRANT EXECUTE ... TO
authenticated`.

### 6.3 External identity (point 2)

`p_ordens_compra_fio_id` — the **flat-row id**, exactly what `op-writes.js`
(`ordemId`) and `fornecedor.js` (`ordem.id`) already hold in memory today; no
client-side change to how the caller identifies the order. This is the
**stable compatibility identity**, deliberately not the native `item_id` or
`lancamento_id` (which the client does not and should not need to know).

### 6.4 Server-side flat→native resolution and eligibility gate (points 3, closes §26 items 1–2)

1. Resolve `ordem_compra_item_compat_fio` by `ordens_compra_fio_id =
   p_ordens_compra_fio_id`. Not found → `{ok:false, codigo:
   'mapeamento_compat_ausente', erro: '...'}` — the exact, named
   missing-RPC-adjacent condition from §5.4 (a genuinely unmapped row, not a
   transient error; fail-closed, never silently treated as "nothing to do").
2. Lock `ordem_compra` (`FOR UPDATE`), then the resolved `ordem_compra_item`
   (`FOR UPDATE`) — same two-step lock order as the native command
   (`db/70` L574–586).
3. **Eligibility gate (new, legacy-appropriate — replaces the native
   `legado`-exclusion check, §6.1):**
   - `ordem_compra.legado = TRUE` (structurally guaranteed by resolving
     through the compat mapping — defensive check kept for clarity).
   - `ordem_compra.status_administrativo <> 'cancelada'` — permits both
     `'emitida'` (Class A/B legacy import) and `'rascunho'` (Class D legacy
     import, `db/67` L655 `CASE r.class WHEN 'D' THEN 'rascunho' ELSE
     'emitida' END`) — a **different** range than the native gate's
     `status_administrativo = 'emitida'`-only requirement, because legacy
     Class D orders were imported already-received without ever having been
     formally "emitida" in the native sense.
   - `ordem_compra.status_aceite IN ('nao_aplicavel', 'aceita')` — identical
     range to the native gate (legacy rows are always seeded
     `'nao_aplicavel'`, `db/67` L656; kept permissive for forward
     compatibility with any future legacy-facing acceptance flow).
   - Violation of any of the above → `{ok:false, codigo: 'estado_invalido',
     ...}`, same code the native command uses for its own gate, for
     consistent client-side handling.

### 6.5 Absolute requested total semantics and current-total calculation under lock (points 5–6, closes §26 items 3–4)

Under the item lock (step 6.4.2), read `v_current_total := ordem_compra_item.kg_recebido`
(the live, trigger-maintained cache — always exactly `SUM(l.kg_recebido)` over
that item's ledger, `db/70` L313–334). Compute:

```
v_delta := p_kg_total_absoluto - v_current_total
```

This is the **immutable receipt delta** the order's Defect 2 §3 required —
computed **inside the same locked transaction** that will apply it, so no
TOCTOU window exists between reading the current total and committing the
delta.

### 6.6 Equal / increase / decrease branches (points 7–11, closes §26 items 4–5)

- **`v_delta = 0` (equal) — deterministic no-op.** No ledger row is inserted.
  The adapter still records/checks its own idempotency header (§6.8) so a
  retry returns the identical cached `{ok:true, codigo:'sem_alteracao', ...}`
  result rather than silently recomputing against possibly-changed state.
- **`v_delta > 0` (increase).** Deterministic fan-out across the item's
  allocations, **ascending `ordem_compra_item_alocacao.id` order** (proposed
  deterministic rule, §14 — the current REFUND-A-seeded corpus has exactly one
  allocation per legacy item, `db/67` L689 reconciliation `alocacoes=51 =
  items=51`, so this rule is inert on today's data and only activates if a
  legacy item ever receives a second allocation via the now-granted
  `alocar_necessidade_compra_fio`, `db/69` L629):
  1. For each allocation in order, compute `capacity := kg_alocado -
     COALESCE(SUM(l.kg_recebido) WHERE ordem_compra_item_alocacao_id =
     <this allocation>), 0)`; take `min(remaining_delta, capacity)` as an
     `alocacao`-destined line (mirrors the native command's own per-allocation
     cap check, `db/70` L712–719).
  2. Any `remaining_delta` left after every allocation is exhausted becomes
     one `excesso`-destined line (mirrors `db/70` L723–738's item-level
     over-allocation classification, generalized to the compat entry point).
  3. Insert one `ordem_compra_recebimentos` header
     (`comando_tipo='recebimento_compat'`, §6.9) and one
     `ordem_compra_fio_lancamentos` row per computed line, populated with the
     exact shape `trg_native_lancamento_shape_guard` requires
     (`ordem_compra_item_id`, `ordem_compra_id`, `material`, `cor_id`/
     `cor_poliester`, `ordem_compra_item_alocacao_id` + `op_id` for
     `alocacao` lines / both `NULL` with `kg_excesso = kg_recebido` for
     `excesso` lines, `ator_tipo`, `linha_indice` 1..N, `tipo='recebimento'`,
     `estorno_de_id=NULL`) — the same shape the native writer already
     produces, so the same `AFTER INSERT` trigger
     (`trg_native_lancamento_derive_state`) fires unchanged, maintaining
     `ordem_compra_item.kg_recebido`, `ordem_compra.status_recebimento`,
     `saldo_fios`, and `ordem_compra_fio_movimentos_estoque` exactly as it
     already does for native receipts.
- **`v_delta < 0` (decrease) — admin-only, §6.7.**

### 6.7 Decrease / reversal selection policy — proposed, requires ratification (points 9–11, closes §26 item 4/§25's HARD STOP text on ambiguity)

Decrease is **admin-only**, mirroring `estornar_recebimento_ordem_compra`'s
own `IF auth.uid() IS NULL OR NOT public.is_admin()` gate (`db/70` L827). A
supplier-context call that resolves to `v_delta < 0` is rejected fail-closed
with a new code `{ok:false, codigo:'decremento_exige_admin', ...}` — **never**
silently allowed (unlike today's legacy `fornecedor.js` inline `.update()`,
which currently lets a supplier freely lower their own `kg_recebido`; this is
an intentional, named tightening, not an oversight — flagged in §16).

For admin decreases, source-line selection is genuinely ambiguous without an
explicit rule (the order's own hard-stop condition). This contract proposes
one deterministic policy rather than declaring an unresolvable stop, because a
concrete, implementable rule exists and is common practice for this kind of
ledger:

> **Proposed rule (LIFO): select existing positive (`tipo='recebimento'`,
> `recebimento_id IS NOT NULL`) lançamentos for the item, most recent
> (`id DESC`) first. For each, the reversible remainder is `source.kg_recebido
> + SUM(kg_recebido of existing reversals referencing it)` (identical formula
> to the native command, `db/70` L981–984). Reverse greedily from most recent
> backward — full reversal of a line if its remainder is ≤ the still-needed
> amount, partial reversal (capped at the remainder) on the last line touched
> — until the requested decrease is fully covered.**

If the total reversible balance across all the item's positive lines is
**less** than the requested decrease, the whole command fails
(`{ok:false, codigo:'excede_estornavel', ...}`) — **no partial decrease is
ever applied that doesn't exactly match the caller's requested absolute
target** (all-or-nothing, point 21).

**This LIFO policy is a proposed normative amendment, not yet architect-
ratified** (§14). It is not silently written into `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
by this pass. If a different deterministic rule (e.g. FIFO, or
proportional-across-lines) is preferred, only the rule text in this section
and §14 changes before implementation — no other part of Component B's
design depends on which deterministic rule is chosen, only that one is fixed
before the migration is authorized.

Reversal lines are inserted with `tipo='estorno'`, `kg_recebido` negative,
`estorno_de_id` set to the specific source line, `kg_excesso` mirroring the
source line's excess-ness with the same sign convention the native command
uses (`db/70` L1029) — identical shape to what
`trg_native_lancamento_shape_guard`'s `estorno` branch already validates
(`db/70` L251–271), so the same triggers fire unchanged.

### 6.8 Idempotency lifecycle (points 14–17, closes §26 items 6–8)

- **Client lifecycle:** the caller (a future `js/screens/ordem-compra-receipt-cutover.js`-family
  adapter, out of this contract's scope — product files are none, §8) generates
  one client-side idempotency token (e.g. a UUID) **per user-initiated
  submission attempt**, persists it in the in-flight request's local state, and
  **reuses it verbatim** on any network retry of that same attempt (timeout,
  connection drop, ambiguous response). A **new** user-initiated submission
  (e.g. clicking "Registrar" again after changing the entered kg value)
  generates a **new** token. This exactly answers point 14/17: retry-stable
  per attempt, distinct per genuine new intent.
- **Server storage:** reuses `ordem_compra_recebimentos` (no second ledger
  table) under a **new** `idempotency_namespace` value, `'legacy_compat_receipt_v1'`
  (§9 migration adds this to the existing `CHECK` constraint alongside
  `'native_receipt_v1'`), keyed `(idempotency_namespace, ator_tipo, ator_id,
  idempotency_key)` — the identical unique-constraint shape already proven for
  the native command (`db/70` L33–34).
- **Exact retry / ambiguous response (points 15–16):** before any mutation,
  the adapter takes `pg_advisory_xact_lock` on the actor-scoped idempotency
  identity (mirrors `db/70` L661–663), then looks up an existing header with
  that exact `(namespace, ator_tipo, ator_id, idempotency_key)`. If found with
  **matching** payload (same flat-row id, same absolute total, same date) →
  return the cached `_resultado_comando_recebimento(header.id)` (reused
  as-is — namespace-agnostic, keys only off `recebimento_id`) with **zero**
  new mutation — safe on any number of retries. If found with a
  **different** payload → `{ok:false, codigo:'idempotencia_conflitante',
  ...}` (point 17, payload conflict) — never silently overwritten, never
  silently re-executed.
- **Same-date distinct receipts (point 15):** two genuinely different
  legitimate submissions on the same `p_data_recebimento` use two different
  client-generated tokens; the idempotency identity is the token, not the
  date, so no collision — this explicitly supersedes and withdraws the
  original R1 contract's rejected "order id + occurrence timestamp" proposal
  (`ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §10.1, marked withdrawn in the
  forward correction).

### 6.9 Schema delta required for idempotency/command-type reuse

`ordem_compra_recebimentos.idempotency_namespace` currently has
`CHECK (idempotency_namespace = 'native_receipt_v1')` (`db/70` L21) —
narrowed further by `db/75`'s `ordem_compra_recebimentos_c3c_hash_check`
(L30–34) to two namespaces (`native_receipt_v1` 32-hex, `legacy_initial_balance_v1`
64-hex). `ordem_compra_recebimentos.comando_tipo` currently allows only
`('recebimento', 'estorno')` (`db/70` L20). §9's migration extends both
`CHECK` constraints additively (`DROP CONSTRAINT` + `ADD CONSTRAINT` with the
existing values plus `'legacy_compat_receipt_v1'` / `'recebimento_compat'`) —
the same forward-only pattern `db/75` itself used to extend the hash-shape
`CHECK` (L27–34). No existing row's namespace/type changes; no data migration.

### 6.10 Document/origin metadata, admin/supplier permission, lock order, audit output (points 12–13, 18–19, 23)

- `p_documento_ref` passed through unchanged; `origem_tipo := 'legacy_compat_intent_v1'`
  (fixed, not client-supplied — prevents spoofing a different origin
  taxonomy); `p_origem_ref` passed through, defaulting to
  `p_ordens_compra_fio_id::TEXT` when the caller supplies none, preserving
  flat-row provenance in the immutable header even if the caller omits it.
- Admin/supplier permission for the **increase** path mirrors the native
  command exactly: admin unrestricted; supplier requires
  `usuarios.fornecedor_id = ordem_compra.fornecedor_id` for the caller's own
  `auth.uid()` (`db/70` L691–697). Decrease is admin-only (§6.7).
- **Lock order (point 19), identical sequence to the native command:**
  1. `ordem_compra` row, `FOR UPDATE` (§6.4.2).
  2. `ordem_compra_item` row, `FOR UPDATE` (§6.4.2/§6.5).
  3. `ordem_compra_item_alocacao` rows for the item, `FOR UPDATE`, ascending
     `id` (§6.6, increase path only).
  4. `ordem_compra_fio_lancamentos` rows for the item, `FOR UPDATE`, ascending
     `id` (mirrors `db/70` L699–703/L964–968 — re-read under lock immediately
     before insertion, after the idempotency check, to catch any concurrent
     line inserted between the initial total read and the write).
  5. Advisory idempotency lock (§6.8) — taken **before** the idempotency
     lookup, consistent with the native command's own ordering (`db/70`
     L661–671), not after.
  6. Advisory inventory lock, ordered by `(material, cor_id, cor_poliester)`
     (mirrors `db/70` L740–747/L990–997) — increase path only (a pure
     decrease/reversal below an item's excess never needs the inventory
     lock unless it reverses an excess line touching `saldo_fios`, in which
     case the same ordered advisory lock applies).
- **Concurrency behavior after lock waits (point 20):** identical to the
  native command — `FOR UPDATE` blocks concurrently until the holder commits
  or rolls back; no `NOWAIT`/`SKIP LOCKED`; a second concurrent call for the
  same item re-evaluates `v_current_total` fresh after acquiring its own lock,
  so two legitimate sequential submissions (e.g. two different suppliers'
  distinct receipts against the same shared item, if that were ever possible)
  each see the other's committed effect, never a stale total.
- **Audit/history output (point 23):** `_resultado_comando_recebimento`
  (`db/70` L413–447) is reused verbatim — it is namespace-agnostic, joining
  only on `recebimento_id`. `obter_historico_recebimento_ordem_compra`
  (`db/70` L1061+, admin-only) is **expected** to surface
  `recebimento_compat`-typed headers automatically once this migration lands,
  since it reads the same tables by `ordem_compra_id`; this contract does
  **not** assert that function's exact body compatibility (not re-read in
  full in this pass) and flags it as an implementation-time verification
  item, not an assumed-closed point (§13).

### 6.11 Transactional guarantees, error taxonomy, PONR interaction, recovery (points 21–22, 24–25)

- **All-or-nothing (point 21):** the entire resolve→lock→compute→branch→insert
  sequence executes in the single transaction PostgREST/Supabase already
  wraps each RPC call in; an `EXCEPTION WHEN OTHERS` at the function's outer
  block (mirroring `db/70` L787–789/L1043–1045) catches any unexpected error
  and returns `{ok:false, codigo:'erro_interno', erro:...}` **without**
  committing partial state (any statement after the exception point rolls
  back to the function's entry).
- **Error taxonomy (point 22):** reuses native codes verbatim where the
  underlying condition is identical (`sem_permissao`, `idempotencia_conflitante`,
  `excede_alocacao`, `excede_item`, `excede_estornavel`, `erro_interno`) plus
  four new adapter-specific codes: `mapeamento_compat_ausente` (§6.4.1),
  `estado_invalido` (§6.4.3, different eligibility range than native but same
  code name for uniform client handling), `decremento_exige_admin` (§6.7),
  `kg_absoluto_invalido` (`p_kg_total_absoluto` null/negative, or
  `p_data_recebimento`/`p_idempotency_key` missing — validated before any
  lock is taken, mirroring the native command's up-front validation order,
  `db/70` L485–496).
- **Interaction with `productive_receipt_started_at` (point 24):** Component B
  does not read or write `ordem_compra_cutover` at all — it is entirely
  outside the C3 cutover state machine (§5.5's reasoning applies identically
  to Component B, since it targets `legado=TRUE` orders exclusively, which
  the cutover's `productive_receipt_started_at` marker — defined only in
  terms of the **canonical, native-regime** receipt commands, `db/75`
  L263–267 — does not track). This is an explicit, deliberate scope boundary:
  Component B's own productive-use marker (if the architect wants one) would
  be a **separate** future decision, not fabricated by this contract.
- **Pre-/post-PONR recovery (point 25):** not applicable — Component B never
  touches the C3 cutover's PONR-tracked state. Reverting a
  `PHASE-C3C-B-DB-PREREQ` migration is a standalone, ordinary schema rollback
  (§17), unrelated to §R.29.3/§R.29.6's real-cutover PONR.

## 7. Missing-RPC / deployment-order model — Model A (database-first), chosen and justified

**Model A — database-first installation** is adopted: `db/76` (§9) must be
authorized, applied, and verified in a target environment **before** any
application code referencing `listar_ordens_compra_fio_compat` or
`registrar_recebimento_ordem_compra_fio_compat` is deployed to that same
environment. No long-lived `42883 undefined_function` fallback is required
under this model.

**Justification:**

1. **Matches the project's own established sequencing precedent everywhere
   else in this repository** — every prior phase in this track (`db/65`
   through `db/75`) was authored, applied, and verified before any consuming
   application code shipped against it; the one documented exception
   (`op-nova.js`'s `42703 undefined_column` handling for `db/65`'s dimension
   columns, and the corrected `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §27's
   `42883` clause for `db/75`) exists specifically because those migrations
   were applied to some environments (staging) before others (production),
   not because database-first was abandoned as the default model.
2. **Avoids adding a second, open-ended fallback path.** The corrected
   `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §27 already ratifies exactly one
   bounded exception (the three C3C-A RPC names, bounded to environments
   where `db/75` is not yet applied — currently only production
   `gqmpsxkxynrjvidfmojk`). Extending that **same** bounded-interval mechanism
   to cover the two new RPC names from this contract (rather than inventing a
   second, independently-scoped tolerance) keeps the error policy singular,
   as already ratified — no new "any error" ambiguity is introduced.
3. **A permanent unconditional `42883` fallback is explicitly prohibited by
   the order and by the already-ratified §27 policy** ("never classify an
   unknown failure as inactive" / "unrecognized error → fail-closed").

**Exact bounded interval (extends §27, to be folded into the future
`PHASE-C3C-B` application contract's own error-policy section, not silently
rewritten into the already-committed `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` by
this pass):** the interval begins when C3C-B application code that calls
either new RPC is deployed to a given environment and **ends** the moment
`db/76` is confirmed applied in that same environment. Today, `db/76` is
applied **nowhere** (does not exist), so the interval is simply "not yet
opened" — Model A means it should never need to open in the normal sequencing
case (migration ships first). Activation determination for the application
layer (when it is later authored) is identical to the existing precedent:
attempt the RPC call; treat `42883 undefined_function` as inactive **only**
inside this named interval; treat every other error, and `42883` outside the
interval, as fail-closed per §27.

## 8. Boundary — what this contract does not do

### 8.1 No product files

**None.** This is a database-only prerequisites contract. The future
`PHASE-C3C-B` application-adaptation phase (already contracted in
`docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`) is the sole owner of
wiring `js/screens/op-writes.js`, `js/screens/fornecedor.js`,
`js/screens/pedido-detail-data.js`, and `js/screens/op-nova.js` to the two new
RPCs this contract defines. No JS, HTML, or CSS file is authorized for
modification by `PHASE-C3C-B-DB-PREREQ`.

### 8.2 No UI, no C3D, no cutover, no C4/C5

Identical prohibitions to `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §8.4: no new
route, screen, modal, or interaction; no cutover state/snapshot/import/
reconciliation/ACL-closure/activation; no native emission change; no staging
or production access, Supabase MCP write, or environment change is authorized
by this contract-authoring pass.

### 8.3 No change to `db/75`'s cutover objects or the C3 state machine

`ordem_compra_cutover`, `trg_c3c_protected_mutation_guard`,
`trg_c3c_command_state_guard`, `_c3c_registrar_recebimento_impl`,
`_c3c_estornar_recebimento_impl`, `listar_recebimentos_ordem_compra_normalizados`,
and the C3C-A snapshot/import/reconciliation functions are **read-only
reference** for this contract (§6.1's finding about the `legado` exclusion is
a *finding*, not a proposed edit to that function). `db/76` (§9) does not
modify, replace, or `ALTER` any C3C-A object.

### 8.4 No normative rewrite in this pass

§6.7's LIFO reversal-selection rule and §6.4.3's legacy eligibility gate are
**proposed** semantics requiring explicit architect ratification (§14) before
`db/76` can be authorized for implementation. Neither
`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` nor `PEDIDO_OP_SCHEMA_CONTRACT.md`
is edited by this pass.

## 9. Exact future implementation manifest

### 9.1 Migration file

Exactly one new file: `db/76_ordem_compra_c3c_b_db_prerequisites.sql`. No
existing `db/*.sql` file is modified.

### 9.2 Database objects created

1. `public.listar_ordens_compra_fio_compat(UUID, BIGINT)` — new function
   (§5.1).
2. `public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC,
   DATE, TEXT, TEXT, TEXT)` — new function (§6.2).
3. One idempotent backfill `DO $$ ... $$` block extending
   `necessidade_compra_fio`/`ordem_compra`/`ordem_compra_item`/
   `ordem_compra_item_alocacao`/`ordem_compra_item_compat_fio` for any
   currently-unmapped header-bearing legacy row (§5.4) — **not** a new table,
   an `INSERT ... WHERE NOT EXISTS` extension of the existing REFUND-A seed
   logic, re-verified by the same class of reconciliation `RAISE EXCEPTION`
   self-checks REFUND-A used (`db/67` L682–697).
4. `ALTER TABLE public.ordem_compra_recebimentos DROP/ADD CONSTRAINT` — extend
   `idempotency_namespace` and `comando_tipo` `CHECK`s additively (§6.9).

### 9.3 Objects replaced

None (`CREATE OR REPLACE` is not used against any existing function; both new
functions are net-new names, avoiding any risk to the already-accepted C3C-A
surface).

### 9.4 Grants/revocations

- `ALTER FUNCTION ... OWNER TO postgres` on both new functions.
- `REVOKE ALL ON FUNCTION listar_ordens_compra_fio_compat(UUID, BIGINT) FROM
  PUBLIC, anon, service_role; GRANT EXECUTE ... TO authenticated`.
- `REVOKE ALL ON FUNCTION registrar_recebimento_ordem_compra_fio_compat(BIGINT,
  NUMERIC, DATE, TEXT, TEXT, TEXT) FROM PUBLIC, anon, service_role; GRANT
  EXECUTE ... TO authenticated`.
- No grant change on any existing object.

### 9.5 Product files

None (§8.1).

### 9.6 Test files (exact manifest, no wildcards)

1. `tests/ordem-compra-c3c-b-db-prerequisites.smoke.js` — new. Static
   structural validation of `db/76` (function signatures present, `SECURITY
   DEFINER`, fixed empty `search_path`, exact `REVOKE`/`GRANT` shape, no
   destructive `DROP TABLE`/`DELETE` outside the documented idempotent
   backfill, `CHECK` constraint deltas additive-only) — same idiom as
   `tests/ordem-compra-c3c-inactive.smoke.js`.
2. `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql` — new.
   Functional role-matrix and business-logic proof against a real local
   Postgres (`BEGIN...ROLLBACK`) — same idiom as
   `tests/ordem-compra-c3c-inactive.integration.sql` — covering §13's test
   contract.
3. `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs` — new.
   Multi-session lock-order/re-evaluation proof — same idiom as
   `tests/ordem-compra-c3c-inactive-concurrency.mjs`.

No other test file is authorized for modification. Every existing test file
(§15 of `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`'s regression list, plus
`tests/ordem-compra-native-receipt.smoke.js`, `tests/ordem-compra.smoke.js`,
`tests/ordem-compra-c3c-inactive.smoke.js`,
`tests/ordem-compra-c3c-inactive.integration.sql`,
`tests/ordem-compra-c3c-inactive-concurrency.mjs`) is **regression-only** —
must stay green, unmodified.

### 9.7 Documentation closeout files (for the future implementation phase, not this authoring pass)

Same proportional matrix as `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §23:
`PROJECT_STATE.md`, `docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`,
`docs/ledgers/G28_LEDGER.md`, `AGENT_HANDOFF.md` (only if continuity changes),
this contract file's `STATUS` marker (updated only by an explicit supervisor
acceptance record).

## 10. Required test contract

Per §9.6's three files, the future implementation order must run and report:

- Isolated migration apply and reapply (`db/76` run twice against a clean
  schema — the backfill's `WHERE NOT EXISTS` and `CHECK`-constraint
  `DROP/ADD` idiom must both be safely re-runnable, no error, no duplicate
  row, no duplicate constraint).
- Dependency-safe rollback rehearsal without `CASCADE` (drop both new
  functions, revert the two `CHECK` constraints to their pre-`db/76` shape,
  leave every REFUND-A-seeded and backfilled row untouched — the backfill is
  additive data, not reverted by a function-only rollback; this asymmetry is
  recorded explicitly, not silently assumed symmetric).
- Reader shape tests for all three real consumers (`fornecedor.js`-equivalent
  supplier-scoped call with no filter; `pedido-detail-data.js`-equivalent
  `p_pedido_id`-scoped call; `op-nova.js`-equivalent `p_op_id`-scoped call),
  each asserting the exact column set closes every §25 gap (§5.2's table).
- Zero-receipt and pending-order coverage (at least one synthetic
  compat-mapped item with `kg_recebido=0` must appear in Component A's output
  — the structural proof that the `FROM`-clause anchor prevents the INNER-JOIN
  drop found in §25).
- Admin and matching-supplier role matrix for both components (admin full
  access; matching supplier scoped correctly; non-matching supplier sees
  zero rows / is denied; anon/unauthenticated denied).
- Absolute increase / equal / decrease cases for Component B, each proving
  the exact delta computed and the exact ledger lines inserted.
- Multiple allocations (synthetic: allocate a second allocation to a
  REFUND-A-seeded legacy item via `alocar_necessidade_compra_fio`, then prove
  Component B's increase fan-out fills the first allocation to its cap before
  spilling to the second, then to `excesso`).
- Shared NULL-OP polyester and excess representation at both grains (§5.2's
  `op_ids_multiplos`/`NULL op_id` behavior, and `kg_excesso` correctness).
- Partial and repeated reversals (Component B decrease covering less than a
  single source line's full amount; a second decrease later reversing more of
  the same or a different line; the cumulative-reversible-balance cap
  enforced, §6.7).
- Exact retry and conflicting retry (same idempotency key, identical payload
  → cached result, zero new mutation; same key, different payload →
  `idempotencia_conflitante`).
- Ambiguous-response retry (simulate a client that never received the first
  response; the retry with the same key must produce the identical result as
  the original, not a second effect).
- Same-date distinct receipts (two different idempotency keys, same
  `p_data_recebimento`, both succeed independently).
- Concurrency and lock-wait re-evaluation (two sessions targeting the same
  item; the second must see the first's committed total after its lock is
  granted, never a stale read).
- Permission and negative tests (supplier attempting a decrease →
  `decremento_exige_admin`; non-matching supplier increase → `sem_permissao`;
  unmapped flat row → `mapeamento_compat_ausente`; cancelled-equivalent order
  state → `estado_invalido`).
- Unchanged legacy behavior while `legacy_active` (the existing three legacy
  reader/writer call sites, **unmodified by this contract**, continue to
  produce byte-identical output/effect against the flat table — a regression
  proof that `db/76` alone, with no application change, causes zero observable
  behavior difference anywhere).
- No activation, import, snapshot, ACL closure, or real cutover is exercised,
  invoked, or simulated against live data by any test in this manifest.

## 11. Traceability disposition (this pass)

Per the order's required disposition, applied to
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md`'s "Requirement matrix" in
this same commit:

- `OC-C3-READ-001` — remains `PARTIALLY_SATISFIED`; `RESIDUAL_DEBT` updated to
  name this contract's Component A (§5) as the blocking read-contract
  prerequisite.
- `OC-C3-WRITE-001` — remains `PARTIALLY_SATISFIED`; `RESIDUAL_DEBT` updated to
  name this contract's Component B (§6) as the blocking command-adapter
  prerequisite.
- `OC-C3-COMPAT-001` — changes `PLANNED` → `BLOCKED`; `RESIDUAL_DEBT` updated
  to name both components and this contract as the exact blocker.
- `OC-C3-NOUI-001` — remains `PARTIALLY_SATISFIED`, unchanged reasoning (no UI
  exists or is authorized by any document in this chain).

No disposition is set to `SATISFIED`. `BLOCKED` is an allowed disposition
value under the spec-custody validator (`scripts/spec-custody/validation-core.mjs`
`ALLOWED_DISPOSITIONS`).

## 12. Proposed draft requirement IDs — not ratified in this pass

For future registry ratification only (`§R.31`, `§13.17`) — **not added to
either registry file by this pass**, since that would be a `NORMATIVE_CHANGE`
this docs-only authoring order does not grant:

| Draft ID | Would anchor to | Owning phase (proposed) | Requirement |
|---|---|---|---|
| `OC-C3-DBPREREQ-READ-001` | new `§R.29.7` (proposed, §14) | `PHASE-C3C-B-DB-PREREQ` | Provide the canonical order-catalog projection (Component A) covering every legacy-compat order including pending/zero-receipt rows. |
| `OC-C3-DBPREREQ-WRITE-001` | new `§R.29.7` (proposed, §14) | `PHASE-C3C-B-DB-PREREQ` | Provide the atomic legacy receipt-intent adapter (Component B) with server-side flat→native resolution and immutable delta conversion. |

## 13. Normative amendments this contract depends on — exact proposed deltas, not applied

Per the order: "If normative text must be changed before the material
contract can be accepted, include the exact proposed delta in the contract
and report that dependency." Two amendments are required before `db/76` can
be authorized for implementation:

### 13.1 Proposed new `§R.29.7` in `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`

```text
### §R.29.7 Legacy-compat database prerequisites (proposed)

A canonical order-catalog projection and an atomic legacy receipt-intent
adapter operate on legacy-compat orders (ordem_compra.legado = TRUE),
independent of the §R.29.3 cutover state machine. The adapter's decrease path
is admin-only and selects reversal source lines by descending lançamento id
(LIFO), capped at each line's remaining reversible balance; a request
exceeding the total reversible balance fails atomically. Legacy-compat order
eligibility for receipt is status_administrativo <> 'cancelada' (not the
native-only 'emitida' requirement) and status_aceite IN ('nao_aplicavel',
'aceita').
```

### 13.2 Proposed new subsection in `PEDIDO_OP_SCHEMA_CONTRACT.md` (after §13.17)

```text
#### 13.18 Legacy-compat receipt adapter schema requirements (proposed)

ordem_compra_recebimentos.idempotency_namespace and .comando_tipo CHECK
constraints admit 'legacy_compat_receipt_v1' and 'recebimento_compat'
respectively, additive to the existing native_receipt_v1/legacy_initial_balance_v1
and recebimento/estorno values. No existing row's namespace or type changes.
```

Both are **quoted verbatim as proposed text only** — neither file is edited by
this pass (§8.4). Ratifying them is a precondition the future `PHASE-C3C-B-DB-PREREQ`
implementation order must obtain (a `NORMATIVE_CHANGE` event under
`docs/governance/DOCUMENTATION_MODEL.md` §19) before `db/76` may be authored
as an actual SQL file.

## 14. Ratification-pending design decisions — explicit list

1. §6.7's LIFO reversal-selection rule (or an alternative the architect
   prefers).
2. §6.4.3's legacy eligibility gate (`status_administrativo <> 'cancelada'`
   vs. some narrower/wider range).
3. §6.7's admin-only decrease policy, including the explicit behavior change
   from `fornecedor.js`'s current unrestricted-decrease inline `.update()`
   (§16).
4. §5.4's residual compat-mapping coverage-gap follow-up (recurring backfill
   job vs. a future live bridge writer) — recommended but not authorized by
   this contract.

## 15. Hard-stop evaluation (per the order's exact list)

- *Existing canonical ledger cannot support deterministic absolute-decrease
  semantics without a new normative reversal policy* — **not a stop**: a
  concrete rule is proposed (§6.7/§13.1), pending ratification (§14), not
  unsupportable.
- *Source-line selection for reversal is ambiguous and no architect-approved
  rule exists* — **not a stop**: same proposed rule; "no rule exists yet" is
  addressed by proposing one for ratification, per the order's own
  "may describe proposed amendments" allowance.
- *A flat row maps to multiple incompatible native items rather than a
  deterministic item/allocation set* — **does not occur**: `ordem_compra_item_compat_fio`
  is a verified 1:1 mapping in both directions (`db/67` L426–427, both columns
  `UNIQUE`); the 1:N item→allocation fan-out is deterministic by construction
  (§6.6).
- *Supplier authority cannot be enforced server-side* — **does not occur**:
  both components enforce supplier/order matching server-side, identical
  mechanism to the already-accepted `listar_recebimentos_ordem_compra_normalizados`/
  native receipt command.
- *Pending orders cannot be represented without reconstructing authority in
  JS* — **does not occur**: Component A represents them server-side (§5.2's
  `FROM`-clause anchor fix); no client-side reconstruction is proposed
  anywhere in this contract.
- *The proposal requires new UI* — **does not occur** (§8.2).
- *Implementation would require invoking cutover state, import, final ACL
  closure, or activation* — **does not occur** (§5.5/§6.11, both components
  are outside the C3 cutover state machine entirely).
- *Any production or environment action is required* — **does not occur**;
  this is a docs-only authoring pass (§1).
- *Any implementation or migration file is modified in this pass* — **does
  not occur**; `db/76` is specified but not created (§9.1).

No hard stop triggers. Two normative amendments are named as preconditions
(§13), not as stops — they are ratification items for the architect, exactly
the category the order explicitly permits this contract to describe rather
than silently apply.

## 16. Residual debts and named behavior changes

- **§5.4 ongoing compat-mapping coverage gap** — not closed going forward;
  named follow-up options recorded, no default chosen.
- **§6.7 decrease-admin-only tightening** — `fornecedor.js`'s current
  behavior (a supplier can freely lower their own `kg_recebido` via the
  unrestricted flat `.update()`) becomes, once `PHASE-C3C-B` wires the
  adapter, admin-only for the canonical path. This is a **deliberate,
  named** behavior narrowing inherited from the native reversal gate
  (`estornar_recebimento_ordem_compra` is already admin-only, `db/70` L827),
  not an oversight — flagged for explicit architect acknowledgment before
  `PHASE-C3C-B` implementation, since `OC-C3-NOUI-001`/the general "zero
  observable behavior change while legacy_active" invariant applies only to
  the fallback branch; the canonical branch (unreachable while `legacy_active`,
  §12 of `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`) is precisely where this
  narrowing would first become observable, after a real cutover — out of
  scope for `PHASE-C3C-B` itself but must be disclosed now, not discovered
  later.
- **§6.10's `obter_historico_recebimento_ordem_compra` compatibility** — not
  verified in full body in this pass; flagged for implementation-time
  confirmation.
- **§13's two normative amendments** — precondition, not yet ratified.

## 17. Rollback or recovery model

Purely local and reversible, once `db/76` exists and is applied: dropping the
two new functions and reverting the two `CHECK` constraints (§9.2 item 4)
fully removes the new write/read surface. The idempotent backfill's
**inserted rows** (§5.4) are ordinary data, not schema — a rollback that only
reverses the function/constraint DDL leaves them in place (harmless: they are
additional `ordem_compra`/`ordem_compra_item`/`ordem_compra_item_alocacao`/
`ordem_compra_item_compat_fio` rows for legacy orders, structurally identical
to REFUND-A's original seed, readable by `listar_ordens_compra_admin` like any
other row). No PONR is created anywhere in this contract's scope (§6.11).

## 18. Environment boundary

`LOCAL_ONLY`. All testing (§10) uses a local Postgres instance and
`BEGIN...ROLLBACK` role-matrix proofs, same discipline as
`tests/ordem-compra-c3c-inactive.integration.sql`. No live Supabase call
against `ucrjtfswnfdlxwtmxnoo` or `gqmpsxkxynrjvidfmojk`, and never production
`bhgifjrfagkzubpyqpew`, is authorized by this contract in any mode.

## 19. Git and commit boundaries

- Branch `dev` only; `main` forbidden.
- Selective staging only (`git add <exact path>`, never `git add .`/`-A`).
- No push authorized by this contract (implementation-time authorization is a
  separate gate per `PROJECT_STATE.md`).
- No `--amend`, no `--no-verify`, no history rewrite.
- One phase, one scope: the two coupled database prerequisites only — do not
  mix with any feature, refactor, or unrelated docs-only change, per
  `docs/architecture/CODE_HEALTH_RULES.md` §14.

## 20. Documentation closeout requirements (for the future implementation phase, not this contract)

Same proportional matrix as §9.7 — at `PHASE-C3C-B-DB-PREREQ` implementation
closeout, the executor updates `PROJECT_STATE.md`
(`LAST_ACCEPTED_PHASE`/`ACTIVE_PHASE`/`NEXT_AUTHORIZABLE_ACTION`),
`docs/architecture/ORDEM_COMPRA_C3_TRACEABILITY.md` (the two draft
requirement IDs, once ratified and registered, move from `PLANNED` toward
`PARTIALLY_SATISFIED`/`SATISFIED` as evidence accrues; `OC-C3-READ-001`/
`OC-C3-WRITE-001`/`OC-C3-COMPAT-001` residual debts updated to reflect the
closed prerequisite), `docs/ledgers/G28_LEDGER.md` (append-only closeout
entry), `AGENT_HANDOFF.md` (only if continuity changes), and this contract
file's `STATUS` marker (updated only by an explicit supervisor acceptance
record, never rewritten in place to claim an acceptance that did not occur).

## 21. Point of no return

**NONE — LOCAL DATABASE-PREREQUISITE DESIGN ONLY.** No migration is applied
or authorized by this contract's authoring pass. Once `db/76` is eventually
authorized, applied, and verified, the schema/function changes themselves
remain locally reversible per §17 with no PONR; the real cutover's PONR
(§R.29.3) is a wholly separate, still-out-of-scope gate untouched by this
contract in any way.
