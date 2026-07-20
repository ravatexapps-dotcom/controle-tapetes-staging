# C3C-B Database Compatibility Prerequisites — Material Phase Contract

<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: PHASE-C3C-B-DB-PREREQ
STATUS: IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE
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

## 0. Supervisor forward correction R1 (verdict: CHANGES_REQUIRED)

> **Forward correction (documentation-only, `FORWARD_CORRECTION` per
> `DOCUMENTATION_MODEL.md` §4).** A read-only supervisor review of this
> contract's R1 returned `CHANGES_REQUIRED`. Neither `PHASE-C3C-B-DB-PREREQ`
> nor `PHASE-C3C-B` implementation is authorized. §§1–21 above/below are
> preserved as authored (append-only correction, no history rewrite); §§22–28
> below record the correction. Where §§1–21 and §§22–28 conflict, **§§22–28
> govern**.

The review found the R1 design **not implementable as written**, for five
verified reasons, all confirmed against the real installed `db/67`–`db/75`
objects:

1. **Component B is blocked by `db/75`'s own `trg_c3c_command_state_guard`**
   (§22). That `BEFORE INSERT ON ordem_compra_recebimentos` trigger (`db/75`
   L193–222) rejects every `comando_tipo` other than `'import_saldo_inicial'`
   unless `status='canonical_active' AND read_authority='canonical'`. R1's
   Component B, inserting `comando_tipo='recebimento_compat'` headers, would
   be rejected by this trigger on every attempt during `legacy_active` — a
   design R1 itself prohibited from modifying (§8.3).
2. **Writing to the canonical ledger before a real cutover would create
   dual authority** (§22). Even if the trigger were bypassed, R1's design
   would let two divergent sources of truth exist simultaneously: the flat
   table (still authoritative per §R.29.1 through this entire track) and the
   canonical ledger. `db/75`'s own fence/snapshot logic
   (`ordem_compra_c3c_fence_and_snapshot`, L503–517) reads
   `ordens_compra_fio.kg_recebido` directly as the frozen source — it has no
   awareness of any pre-existing canonical lines a live Component B might
   have written. R1's claim that a `'legacy_compat_receipt_v1'`-namespaced
   receipt is "outside" `productive_receipt_started_at` tracking was
   incorrect in substance: a real receipt is productive in every way that
   matters (it mutates `saldo_fios` permanently) regardless of which
   namespace records it.
3. **The compat-mapping coverage gap cannot remain an open residual debt**
   (§23). R1's §5.4/§16 correctly identified the gap but left it as an
   undecided follow-up; that is insufficient — Component A's stated purpose
   ("every legacy-compat order") is not met while new orders can silently
   fall outside its coverage.
4. **The reversal policy does not account for imported opening balances**
   (§24). `db/75`'s import command (`_c3c_import_snapshot_row`... via the
   postgres-only import path, L855–934) inserts ledger lines with
   `tipo='import_saldo_inicial'`, not `tipo='recebimento'`. R1's §6.7 selects
   only `tipo='recebimento'` lines for reversal, so an item whose balance is
   entirely import-derived would have zero reversible balance under R1's
   rule — an unstated, silently-broken case for any post-cutover absolute
   decrease.
5. **The OP-attributable grain in Component A can duplicate rows for
   `op-nova.js`** (§25). Nothing structurally prevents two
   `ordem_compra_item_alocacao` rows from targeting the same `(item_id,
   op_id)` pair via different `necessidade_id`s (verified: the only relevant
   `UNIQUE` indexes constrain native-only `necessidade_compra_fio` rows,
   `db/67` L107–115, not `ordem_compra_item_alocacao`). R1's item×allocation
   OP-grain would then return two rows for what the unmodified `op-nova.js`
   renders as one form against one flat identity.

The corrected design (§§22–25) resolves all five by (a) making Component B
**install-inert-during-`legacy_active`**, live only in `canonical_active` —
the identical pattern `db/75` already uses for its own three RPCs, so no
dual-authority window ever opens and no PONR-tracking bypass exists; (b)
adding a live, mandatory bridge-writer trigger that closes the compat-mapping
gap going forward, not just at migration-apply time; (c) excluding
`tipo='import_saldo_inicial'` lines from the reversible balance, with a named
error code and an immutable-floor policy; and (d) changing the OP-attributable
grain to item×OP (allocations aggregated, full breakdown still available in
`alocacoes`).

> **A second read-only supervisor review (R2) returned `CHANGES_REQUIRED`
> again.** The R1-corrected design (§§0, 22–28) is still not implementable:
> Component A remained wrongly "live during `legacy_active`" (it reads a native
> cache that legacy flat writers never maintain), and the §23 live bridge
> trigger both breaks the legacy delete/reinsert flow and is fundamentally
> incompatible with `db/75`'s hard-coded fixed-51-mapping cutover. The R2
> forward correction is recorded in the appended §§29–33; it supersedes §5.5,
> §23 (withdrawn in full), §27.2 items 3–4, and §28.2's "gap CLOSED" claim.
> Where §§1–28 and §§29–33 conflict, **§§29–33 govern.**

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

## 21. Point of no return (historical — superseded by §22.4)

**NONE — LOCAL DATABASE-PREREQUISITE DESIGN ONLY.** No migration is applied
or authorized by this contract's authoring pass. Once `db/76` is eventually
authorized, applied, and verified, the schema/function changes themselves
remain locally reversible per §17 with no PONR; the real cutover's PONR
(§R.29.3) is a wholly separate, still-out-of-scope gate untouched by this
contract in any way.

> **Superseded note:** this section's claim that Component B is "entirely
> outside" `productive_receipt_started_at` tracking was incorrect in
> substance (§0 finding 2) and is corrected by §22.4: Component B's
> corrected, inert-until-`canonical_active` design **does** participate in
> the existing §R.29.3 PONR exactly as the native commands do, once live. No
> new or second PONR is created — this remains the same single PONR already
> governed by §R.29.3.

## 22. Component B — corrected activation state machine (closes §0 findings 1–2)

### 22.1 Root cause

R1's Component B (§6) was designed as an always-reachable parallel entry
point, gated only by its own business-rule check (§6.4) — never checking the
C3 cutover's own state. Two independent problems result, both confirmed
against the installed `db/75` objects (§0):

- `trg_c3c_command_state_guard` (`db/75` L193–222) is a table-level `BEFORE
  INSERT` trigger on `ordem_compra_recebimentos`, installed **before** this
  contract's authoring and explicitly **out of scope to modify** (§8.3). It
  rejects any `comando_tipo <> 'import_saldo_inicial'` unless
  `status='canonical_active' AND read_authority='canonical'`. R1's Component B
  would fail this trigger unconditionally during `legacy_active`.
- Even hypothetically bypassing the trigger, a live canonical write during
  `legacy_active` would diverge from the flat table, which
  `ordem_compra_c3c_fence_and_snapshot` (`db/75` L462–583) treats as the sole
  frozen source at fence time — creating exactly the "two divergent versions"
  problem the review identified.

### 22.2 Corrected design — install-inert-during-`legacy_active`

Component B adopts the **identical pattern already used by `db/75`'s own
three RPCs** (`registrar_recebimento_ordem_compra`'s wrapper, L242–270): the
function checks cutover state **first**, before any lock or mutation, and
returns a clean inactive response while `legacy_active` or
`maintenance_fenced` — never attempting an insert the trigger would reject
anyway (defense-in-depth: the trigger remains the authoritative backstop,
unmodified).

```sql
SELECT * INTO v_cutover FROM public.ordem_compra_cutover WHERE id = 1;
IF NOT FOUND OR v_cutover.status <> 'canonical_active'
   OR v_cutover.read_authority <> 'canonical' THEN
  RETURN jsonb_build_object('ok', false, 'codigo', 'recebimento_compat_inativo',
    'erro', 'Legacy-compat receipt adapter is inactive');
END IF;
-- only past this point: §6.4's resolve/gate, §6.5's delta, §6.6's branches
```

`ordem_compra_cutover` is fully revoked from every role including
`service_role` (`db/75` L118) — Component B, as `SECURITY DEFINER OWNER TO
postgres`, reads it internally exactly as `trg_c3c_command_state_guard` and
the existing wrapper already do; no new grant is required.

A new, distinct response code — `recebimento_compat_inativo` — is used rather
than reusing `recebimento_canonico_inativo`, keeping the two RPC families'
codes independently distinguishable while remaining functionally analogous.
**This is the exact signal the future `PHASE-C3C-B` application adapter's
fallback branch already expects to detect** (mirroring
`ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §27's unified error policy — that
future contract, when authored, names this code alongside
`recebimento_canonico_inativo` in its own bounded fallback list; this
contract does not edit that already-committed file).

### 22.3 Consequence — resolves both findings

- **Finding 1 resolved:** Component B never attempts an insert while
  `legacy_active`; when it eventually is authorized to run past this gate
  (only in `canonical_active`), `trg_c3c_command_state_guard`'s
  `import_saldo_inicial`-vs-other-branch passes normally for
  `comando_tipo='recebimento_compat'` under `canonical_active`, exactly as it
  already does for the native `'recebimento'`/`'estorno'` types.
- **Finding 2 resolved:** no productive canonical write can ever occur during
  `legacy_active` — the dual-authority window this contract's R1 design
  opened is closed by construction, not by policy. `db/75`'s
  fence/snapshot/import machinery remains the sole path by which pre-cutover
  history enters the canonical ledger, unchanged and unchallenged.
- **Zero observable behavior change while `legacy_active`** (the same
  invariant `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md` §4/§12 already requires of
  the future application layer) now holds for the **database** layer too:
  Component B is provably inert-by-construction throughout the entire
  `PHASE-C3C-B` window, before any application code even calls it.

### 22.4 PONR participation (corrects §21's superseded claim)

Once Component B is reachable (`canonical_active`), a successful **increase**
call is a genuine productive canonical receipt. It **must** atomically set
`ordem_compra_cutover.productive_receipt_started_at := COALESCE(productive_receipt_started_at,
clock_timestamp())` after a successful insert — identical to
`registrar_recebimento_ordem_compra`'s own wrapper behavior (`db/75`
L263–267). This is not a new or second PONR: it is Component B correctly
participating in the **single**, already-governed §R.29.3 PONR ("the first
successfully committed non-import canonical receipt after the canonical read
switch"), exactly as the native commands do. R1's §6.11 claim that Component
B was "entirely outside" this tracking is withdrawn.

## 23. Component A — live compat-mapping bridge (closes §0 finding 3, supersedes §5.4's residual framing)

### 23.1 Corrected disposition

The compat-mapping coverage gap is **closed, not left as a residual debt**.
`db/76`'s manifest (§27.2) adds a new trigger,
`trg_ordens_compra_fio_bridge_compat`, `AFTER INSERT ON public.ordens_compra_fio`,
`SECURITY DEFINER`, that creates the equivalent
`necessidade_compra_fio`/`ordem_compra`/`ordem_compra_item`/
`ordem_compra_item_alocacao`/`ordem_compra_item_compat_fio` rows for **every**
new flat row, at the moment it is inserted — by any current or future
caller, including `op-persistir.js`'s still-live legacy branch (verified: a
plain `.insert(ordens)` with no product-file change required, `js/screens/op-persistir.js`
L255) — with **no application change**, since this is a table-level trigger,
not a client call site.

### 23.2 Exact trigger logic

Reuses the identical classification expression already proven twice in this
codebase (REFUND-A's seed, `db/67` L655–659; the cutover snapshot,
`db/75` L507–509):

```sql
v_class := CASE
  WHEN NEW.status_administrativo = 'rascunho' AND NEW.status = 'recebido_total' THEN 'D'
  WHEN NEW.status_administrativo = 'emitida'  AND NEW.status = 'recebido_total' THEN 'A'
  ELSE 'B'
END;
```

Resolves `pedido_id` via `NEW.op_id → ops.lote_id → lotes.pedido_id`, the
identical join `trg_necessidade_ownership_guard` already performs (`db/67`
L149–153). Inserts exactly one row into each of the five tables per new flat
row — `necessidade_compra_fio` (`origem_tipo='op'`, `legado=TRUE`,
`legado_origem_ordem_compra_fio_id=NEW.id`), `ordem_compra` (`legado=TRUE`,
`legado_provenance` from the class map), `ordem_compra_item`
(`kg_pedido=NEW.kg_pedido`, `kg_recebido=COALESCE(NEW.kg_recebido,0)`),
`ordem_compra_item_alocacao` (`kg_alocado=NEW.kg_pedido`, fully
self-allocating, identical to REFUND-A), `ordem_compra_item_compat_fio`
(`origem='native_bridge'` — the value already reserved for exactly this
purpose by `db/67`'s original `CHECK (origem IN ('imported_legacy',
'native_bridge'))`, L428, never previously used since no bridge writer had
been built until now).

### 23.3 Idempotency and safety

Guarded by `NOT EXISTS (SELECT 1 FROM ordem_compra_item_compat_fio WHERE
ordens_compra_fio_id = NEW.id)` (defensive; an `AFTER INSERT` trigger fires
once per row by construction, but this makes the trigger itself safely
re-invocable if ever attached via a backfill replay). Runs inside the same
transaction as the flat-row insert — if the bridge insert fails, the whole
flat-row insert rolls back (all-or-nothing), surfacing a clear error rather
than silently leaving an unmapped row. `db/76`'s own backfill (§9.2 item 3,
unchanged from R1) closes the gap for rows that already existed before
`db/76`'s apply; this trigger closes it for every row from that point
forward — **together, zero unmapped header-bearing legacy row can exist
after `db/76` is applied**, at any point in time.

### 23.4 Interaction with the C3 fence

Verified against `trg_c3c_protected_mutation_guard` (`db/75` L121–191): while
`status IS NULL OR status = 'legacy_active'` (the entire `PHASE-C3C-B`
window), the guard's own early-return (L131–133) passes every mutation to
the five target tables through unrestricted — the bridge trigger's inserts
are unaffected by that guard for the whole of this contract's operative
window. No conflict exists.

### 23.5 Defensive classification failure

If `NEW.status`/`NEW.status_administrativo` ever fall outside the three
recognized class combinations (should not occur given the existing `CHECK`
constraints on `ordens_compra_fio`, but not proven impossible by this
contract), the trigger `RAISE EXCEPTION` rather than silently guessing a
class — matching REFUND-A's own defensive-reconciliation philosophy
(`db/67` L602–616).

## 24. Reversal floor policy for imported opening balances (closes §0 finding 4, refines §6.7)

### 24.1 The gap

`db/75`'s import command inserts ledger lines with `tipo='import_saldo_inicial'`
(`db/75` L910–934), not `tipo='recebimento'`. R1's §6.7 reversal-selection
scope (`tipo='recebimento'` only) silently excludes these lines — an item
whose balance derives entirely from the import would have zero reversible
balance under R1's rule, failing any decrease request with
`excede_estornavel` without ever disclosing why.

### 24.2 Corrected policy — imported balance is an immutable floor

**Adopted (of the three options the review offered): the imported opening
balance is an immutable floor.** A decrease request may reverse only
`tipo='recebimento'` lines created by Component B itself (or, in principle,
by the native command family, though that never applies to `legado=TRUE`
orders); it may **never** reduce the portion of `kg_recebido` attributable to
`tipo='import_saldo_inicial'` lines.

**Why this option, not the other two:** correcting an import line would
require inventing a new ledger-mutation type with its own idempotency, audit,
and — critically — **hash-reconciliation** implications, since `db/75`'s
import is verified against a frozen, SHA-256-hashed snapshot
(`ordem_compra_c3c_assert_snapshot_and_live`, `db/75` L630–732); silently
"correcting" post-import history would invalidate that hash chain's meaning.
Ending support for the absolute-intent interaction after cutover (the
review's third option) contradicts the whole purpose of `PHASE-C3C-B`
(`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.29's own framing: "prepares the
JS layer so that a later... real cutover window can flip `read_authority` to
`canonical` without a synchronized application deployment") — the legacy
screens must keep working, in their existing absolute-total shape, after a
real cutover, until a separate future phase (C4) replaces them. The
immutable-floor option requires no new ledger semantics and is the
conservative, reversible choice.

### 24.3 Exact behavior

- Reversible balance for an item = `SUM(kg_recebido)` over that item's
  `tipo='recebimento'` lines, minus `SUM(kg_recebido)` over reversals already
  applied against them (`db/70`'s existing per-line formula, reused
  unchanged) — **`tipo='import_saldo_inicial'` lines are never included in
  this sum, in either direction.**
- If the requested decrease, after exhausting the item's genuine
  `tipo='recebimento'` reversible balance (LIFO, §6.7, unchanged), still
  requires going below the import-derived floor: `{ok:false,
  codigo:'reducao_abaixo_saldo_importado', erro:'...', 'saldo_importado',
  <the floor amount>}` — a new, distinct, self-explanatory error code (not
  `excede_estornavel`, so the caller can distinguish "nothing left to
  reverse" from "you are asking to go below a value this system will never
  let you reverse").
- This policy applies **only** to legacy-compat orders reachable through
  Component B; native-regime orders' own reversal semantics
  (`estornar_recebimento_ordem_compra`) are entirely unaffected and out of
  this contract's scope.

## 25. OP-attributable grain correction (closes §0 finding 5, supersedes §5.2's OP-grain definition)

### 25.1 The problem

R1's OP-attributable grain returned one row per (item × allocation within
that OP). `op-nova.js`'s unmodified `fetchOrdensCompraFio(opId)`/
`buildOrdemPendenteRow` (§7 row 5 of `ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md`)
renders exactly one "Registrar" form per returned row, against the row's flat
identity. Nothing in the schema prevents two allocations from targeting the
same `(item_id, op_id)` pair via different `necessidade_id`s (verified:
`db/67`'s only relevant `UNIQUE` indexes, L107–115, constrain
`necessidade_compra_fio` for native rows only, not
`ordem_compra_item_alocacao`). Under R1's grain, that case would render two
forms for one legacy order, both able to submit an absolute total against the
same underlying `ordens_compra_fio_id` — an undocumented, unhandled
duplicate-write risk.

### 25.2 Corrected grain — item × OP, allocations aggregated

The OP-attributable grain (`p_op_id IS NOT NULL`) now returns **exactly one
row per compat-mapped item that has at least one allocation in the requested
OP** — matching the flat-row grain `op-nova.js`'s unmodified code already
expects:

- `kg_pedido` := `SUM(a.kg_alocado)` over the item's allocations **within
  that OP only**.
- `kg_recebido`/`kg_recebido_atribuido` := `SUM(l.kg_recebido)` over ledger
  lines whose `ordem_compra_item_alocacao_id` belongs to one of the item's
  allocations **within that OP only** (never lines belonging to a different
  OP's allocation of the same shared item — preserves §R.29.2's
  no-double-counting rule).
- `alocacoes` (unchanged shape, `db/69`'s existing convention) still carries
  the full per-allocation breakdown **restricted to this OP's allocations**,
  so any future consumer needing finer detail than the aggregated row has it
  without a second query.
- `op_id`/`op_numero`/`op_ano`/`op_label` are always singular and populated
  at this grain (the grain is defined by the OP filter itself).

This is now structurally impossible to duplicate: one compat-mapped item, one
row, regardless of how many allocations it has within the requested OP.

### 25.3 Item grain unaffected

§5.2's item grain (`p_op_id IS NULL`) is unchanged — it already returns one
row per `ordem_compra_item_compat_fio` mapping regardless of allocation
count, which was never the source of this finding.

## 26. Missing-RPC / deployment-order model — refinement

§7's Model A (database-first) conclusion is **unchanged and now further
reinforced** for Component B: since it is inert-by-construction until
`canonical_active` (§22), the question of a transitional `42883` fallback is
moot for its entire `PHASE-C3C-B`-relevant lifetime — it behaves exactly like
`db/75`'s three existing RPCs, which already have the single, already-ratified
bounded-interval exception. Component A's Model-A reasoning (§7) is
unaffected — it remains a genuinely live, independent reader with no PONR
risk, unchanged by this correction.

## 27. Corrected exact future implementation manifest (supersedes §9 where noted)

### 27.1 Migration file

Unchanged: exactly one new file, `db/76_ordem_compra_c3c_b_db_prerequisites.sql`.

### 27.2 Database objects created (supersedes §9.2)

1. `public.listar_ordens_compra_fio_compat(UUID, BIGINT)` — Component A
   (§5.1), with the OP-grain correction (§25.2).
2. `public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC,
   DATE, TEXT, TEXT, TEXT)` — Component B (§6.2), with the corrected
   activation gate (§22.2) and the import-floor reversal policy (§24.2)
   composed in.
3. `public.trg_ordens_compra_fio_bridge_compat()` + trigger
   `trg_ordens_compra_fio_bridge_compat AFTER INSERT ON public.ordens_compra_fio` —
   **new**, closes the compat-mapping gap going forward (§23).
4. The idempotent one-time backfill `DO $$ ... $$` block (§9.2 item 3,
   unchanged) — closes the gap for rows that predate `db/76`.
5. `ALTER TABLE public.ordem_compra_recebimentos DROP/ADD CONSTRAINT` —
   unchanged from §9.2 item 4 (namespace/type additive extension).

### 27.3 Grants/revocations (supersedes §9.4)

Unchanged pattern for the two functions (§9.4); the new trigger function
follows the same `SECURITY DEFINER`/fixed-empty-`search_path`/`REVOKE ALL ...
FROM PUBLIC, anon, authenticated, service_role` idiom as every other trigger
function in this codebase (e.g. `trg_necessidade_ownership_guard`,
`trg_alocacao_kg_alocado_cache`) — a trigger function is never directly
callable by a client role regardless of grants, but the explicit `REVOKE` is
kept for consistency and defense-in-depth.

### 27.4 Test files (supersedes §9.6 coverage, same three file names)

No new file added to the manifest — the three files named in §9.6 now also
cover: Component B returns `recebimento_compat_inativo` and performs zero
mutation while `legacy_active`/`maintenance_fenced` (integration SQL); the
bridge trigger fires on every new flat-row insert and produces exactly one
compat mapping, including a rollback-if-bridge-fails proof (integration SQL);
reversal below the imported floor returns `reducao_abaixo_saldo_importado`
(integration SQL); the OP-grain returns exactly one row per item per OP even
with two allocations in the same OP (integration SQL + smoke shape
assertion).

## 28. Corrected hard-stop evaluation, residual debts, and status

### 28.1 Hard-stop re-evaluation (supersedes §15 where noted)

- *A flat row maps to multiple incompatible native items* — **still does not
  occur** (§15, unaffected by this correction).
- **New consideration:** did §0's findings 1–2 constitute an unresolvable
  stop ("the existing database structure makes the design impossible")?
  **No** — a concrete, precedented fix exists (§22, the identical pattern
  `db/75` already uses for its own objects) and was applied; this is the
  category of correction the order's hard-stop clause exists to route
  through a revised design, not to block outright.
- Every other hard-stop condition (§15) remains evaluated as **not
  triggered**, unaffected by this correction.

### 28.2 Residual debts (supersedes §16)

- **§5.4's ongoing compat-mapping coverage gap — CLOSED**, not residual.
  §23's live bridge trigger closes it permanently, going forward, for every
  future flat-row insert regardless of caller.
- **§6.7's decrease-admin-only tightening** — unchanged, still disclosed
  (§16, preserved).
- **New: §24's immutable-floor policy** — a named, deliberate product
  decision (not a debt): imported balances can never be reduced through
  Component B. If the architect later wants a correction path for imported
  balances, that is a separate, explicitly authorized future decision, not
  implied by this contract.
- **§6.10's `obter_historico_recebimento_ordem_compra` compatibility** —
  unchanged, still flagged for implementation-time verification.
- **§13's normative amendments** — unchanged as preconditions; §24.2's
  import-floor policy and §22's activation gate are folded into the same
  proposed `§R.29.7`/`§13.18` text (§14 updated below).

### 28.3 §14 ratification-pending list — additions

5. §22.2's activation gate (inert during `legacy_active`/`maintenance_fenced`,
   live only in `canonical_active`) and §22.4's `productive_receipt_started_at`
   participation.
6. §24.2's immutable-floor reversal policy for imported balances.
7. §25.2's item×OP aggregated grain (or an alternative the architect prefers,
   provided it does not reintroduce the duplicate-row risk of §0 finding 5).

### 28.4 Contract status

`STATUS` (unchanged): **PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
IMPLEMENTATION NOT AUTHORIZED**. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
remain `NONE` in `PROJECT_STATE.md`. No requirement is marked `SATISFIED`.
Neither `PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation, nor any
migration, is authorized by this correction.

**Next step:** read-only supervisor review of this corrected contract. This
correction authorizes no implementation and no database, staging, production,
or environment action.

## 29. Supervisor forward correction R2 (verdict: CHANGES_REQUIRED)

A second read-only supervisor review returned `CHANGES_REQUIRED`. Three
findings, all verified against the actually-installed `db/67`–`db/75` objects
and the live `js/screens/*` writers before acceptance. Neither
`PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation, nor any migration,
is authorized. §§1–28 are preserved as authored (append-only); §§29–33 record
the correction and govern on any conflict.

### 29.1 Finding 1 — Component A is stale during `legacy_active` (VALID)

- **Evidence.** During `legacy_active`, receipts are recorded by the legacy
  writers as a flat `UPDATE`: `op-writes.js` `registrarRecebimentoOrdemFio`
  (`.from('ordens_compra_fio').update({kg_recebido, data_recebimento,
  status}).eq('id', ordemId)`, L35–42) and `fornecedor.js`'s inline
  `.update(...)` (L461–463). Neither touches `ordem_compra_item` or the native
  ledger. `ordem_compra_item.kg_recebido` is maintained **only** by
  `trg_native_lancamento_derive_state` (`db/70` L333–335), which fires **only
  `AFTER INSERT ON ordem_compra_fio_lancamentos`** — never on a legacy flat
  `UPDATE`. R1's §23 bridge fires only `AFTER INSERT ON ordens_compra_fio`,
  setting the initial value once at flat-row creation; it does **not** sync
  any later flat receipt. Therefore, after the first legacy receipt against a
  bridged order, Component A (which reads `ordem_compra_item.kg_recebido`,
  §5.2) returns a **stale** `kg_recebido`. R1 §5.5's "fully reachable and
  correct" in `legacy_active` is false.
- **Fix:** §30 — Component A becomes inert until `canonical_active`, exactly
  symmetric with Component B (§22).

### 29.2 Finding 2 — the live bridge trigger breaks the legacy delete/reinsert flow (VALID)

- **Evidence.** `ordem_compra_item_compat_fio.ordens_compra_fio_id` is
  `NOT NULL UNIQUE REFERENCES public.ordens_compra_fio(id)` with **no
  `ON DELETE` clause** (`db/67` L427) → default `NO ACTION` → a `DELETE` of a
  referenced flat row is **blocked**; the mapping is declared immutable, never
  removed (`db/67` L433). `op-persistir.js`'s legacy branch **deletes then
  reinserts**: `.from('ordens_compra_fio').delete().eq('op_id', opIdSalvo)`
  (L250) followed by `.from('ordens_compra_fio').insert(ordens)` (L255), on
  every `status==='aberta'` save. Once R1's §23 bridge maps a newly-inserted
  flat row, the **next** re-save of that OP's delete step is blocked by the FK.
  Applying `db/76` alone — with no application change — would break the
  existing legacy re-save flow, directly contradicting the "zero observable
  behavior change while `legacy_active`" guarantee.
- **Fix:** resolved by withdrawing the bridge entirely (§31).

### 29.3 Finding 3 — the bridge/backfill make `db/75`'s cutover impossible (VALID, decisive)

- **Evidence.** `db/75`'s snapshot hard-codes `IF v_source_count <> 51 THEN
  RAISE EXCEPTION 'snapshot_mapping_count_mismatch'` (L566), where
  `v_source_count` counts **only compat-mapped** flat rows (the snapshot
  `FROM public.ordens_compra_fio f JOIN public.ordem_compra_item_compat_fio c
  ...`, L514–517). The normative anchors fix the same corpus: §R.29.4 ("all
  **51 mappings**", "**39 headers**", "**44 immutable ledger lines**",
  "**20,221.280 kg**", "**405.980 kg** excess") and schema §13.15.3 (identical
  counts). R1's §23 bridge **and** its §9.2-item-3 / §27.2-item-4 one-time
  backfill both grow the mapping count **beyond 51**, so the future cutover
  fails the count check and the fixed reconciliation totals. R1's own boundary
  (§8.3) forbids `db/76` from modifying any `db/75` object — so there is **no
  executable path**: dynamic corpus in the bridge/backfill versus fixed corpus
  in the cutover is a genuine contradiction.
- **Fix:** §31 (withdraw bridge and backfill) + §32 (bind to FIXED corpus).

## 30. Component A — corrected activation regime (supersedes §5.5; refines §5.2)

Component A adopts the identical install-inert-during-`legacy_active` regime
Component B already has (§22), for the identical reason: the native cache it
reads (`ordem_compra_item.kg_recebido`) is authoritative and live **only** in
`canonical_active`.

- **State check first.** Before any projection, Component A checks the cutover
  singleton and, while `status <> 'canonical_active' OR read_authority <>
  'canonical'`, `RAISE EXCEPTION 'listar_compat_inativo' USING ERRCODE =
  '55000'` — structurally identical to how the installed canonical reader
  `listar_recebimentos_ordem_compra_normalizados` already signals inactivity
  (`RAISE ... 'canonical_reader_inactive'` `55000`, `db/75` L319–324). A
  `RETURNS TABLE` function signals inactivity by raising, not by an envelope;
  this matches the existing reader exactly.
- **Fallback is unchanged.** The future `PHASE-C3C-B` application read adapter
  catches `listar_compat_inativo` exactly as it already catches
  `canonical_reader_inactive` (parent contract §9/§27's bounded fallback
  list, which that future application contract names — this contract does not
  edit that already-committed file), and reads the flat table. During
  `legacy_active`/`maintenance_fenced`, behavior is byte-identical to today.
- **Correctness after cutover.** Only in `canonical_active` — where the native
  triggers maintain `ordem_compra_item.kg_recebido` from the ledger, and no
  legacy flat `UPDATE` can occur (the fence `trg_c3c_protected_mutation_guard`
  blocks flat mutation, `db/75` L170) — does Component A return live data.
  This resolves Finding 1 and makes both components provably inert-by-
  construction throughout the entire `PHASE-C3C-B` window, before any
  application code calls them.

§5.2's per-column mapping is otherwise unchanged; the correction is solely
**when** Component A answers (only `canonical_active`), not **what** it
projects.

## 31. Bridge trigger and one-time backfill withdrawn (supersedes §23, §27.2 items 3–4; resolves Findings 2 & 3)

The R1 live bridge trigger (`trg_ordens_compra_fio_bridge_compat`, §23) is
**withdrawn in full**, and the R1 one-time compat-mapping backfill (§9.2 item
3 / §27.2 item 4) is **withdrawn in full**. `db/76` installs **no trigger on
`ordens_compra_fio`**, creates or modifies **no `ordem_compra_item_compat_fio`
row**, and touches **no `db/75` or `db/67` object** — fully consistent with
§8.3.

Both were withdrawn for Finding 3's decisive reason: either mechanism grows
the compat-mapping count beyond the exactly-51 the cutover requires. The
bridge additionally breaks the legacy delete/reinsert flow (Finding 2); with
the bridge gone, no FK blocks that flow, so the legacy path is byte-unchanged
by `db/76`.

**Why this does not reopen the coverage gap for Component A's actual
purpose:**

- Component A is now inert until `canonical_active` (§30). **Before** cutover,
  the app reads the flat table via fallback, seeing **every** flat row —
  including any created after REFUND-A — so no order is invisible to the user
  during the entire `PHASE-C3C-B` window.
- **After** cutover, the fence blocks all new flat-row inserts
  (`trg_c3c_protected_mutation_guard`'s catch-all `RAISE ...
  'legacy_receipt_fenced'`, `db/75` L170, reached for `ordens_compra_fio` in
  any non-`legacy_active` state) — so no new legacy flat row can appear, and
  Component A's post-cutover corpus is exactly the migrated set.
- The only residue is a **cutover-completeness** question (are all legacy flat
  rows present at fence time migrated?), which is not a Component A/B
  correctness problem and is addressed as a cutover precondition in §32.

**Pre-existing condition (not introduced by `db/76`).** The FK between the 51
REFUND-A `imported_legacy` mappings and their historical flat rows already
exists (since 2026-07-18) and is unchanged here. Whether one of those 51
historical OPs could still be re-saved through `op-persistir.js`'s legacy
branch and hit that FK is a **pre-existing** latent condition, neither created
nor resolved by this contract.

## 32. Binding corpus decision — FIXED corpus (resolves Finding 3)

The contract binds, definitively, to **FIXED corpus**.

- **Rationale.** `db/75`'s snapshot/import/reconciliation and the normative
  anchors §R.29.4 / §13.15.3 hard-code exactly **51 mappings / 39 headers / 44
  ledger lines / 20,221.280 kg / 405.980 kg excess**. The dynamic-corpus
  alternative would require re-opening `db/75` **and** those normative anchors
  — a `NORMATIVE_CHANGE` plus a `db/75`-superseding migration — which is far
  outside this DB-prerequisites contract's boundary (§8.3/§8.4) and which
  `db/76` explicitly will not do. Fixed corpus is therefore the **only**
  executable choice that keeps `db/76` from touching `db/75`.
- **What fixed corpus means here.** The legacy flat corpus eligible for
  cutover is frozen at the REFUND-A set (51 header-bearing mappings). `db/76`
  adds nothing to it (no bridge, no backfill, §31). Component A's coverage,
  post-cutover, is precisely that migrated corpus.
- **New legacy flat rows created after REFUND-A** (still possible via
  `op-persistir.js`'s legacy branch on Pedidos pinned `'legacy'` by the
  immutable resolver `resolver_regime_compra_fio_pedido`, `db/69` L127–196 —
  new Pedidos always resolve `'native'`, but a pre-existing `'legacy'` Pedido
  can still receive new OPs) are **out of the cutover corpus**. They live in
  the flat table and are read via the app's flat fallback during
  `legacy_active`.
- **Enforcing the freeze is a REAL-CUTOVER / C3D precondition, not this
  contract's scope.** Before the real cutover, the architect must resolve any
  stranded post-REFUND-A legacy flat rows by one of — each a **separate,
  explicitly-authorized** action, neither granted here:
  1. a freeze that blocks further legacy flat-row creation (a product and/or
     DB change with its own review — e.g. gating `op-persistir.js`'s legacy
     branch, or a DB guard), **or**
  2. a re-baseline of the cutover corpus/counts (a `NORMATIVE_CHANGE` to
     §R.29.4 / §13.15.3 plus a `db/75`-superseding migration).
  This contract **names** the precondition so the decision is not lost, and
  binds the near-term choice (`db/76`) to option-preserving fixed corpus.
- **Correction to R1 §28.2.** R1 claimed the coverage gap was "CLOSED" by the
  bridge. It was not: the bridge was incompatible with the cutover. The gap is
  **re-scoped**, not closed — it is a cutover-completeness precondition under
  the fixed-corpus decision, owned by the real-cutover/C3D phase.

## 33. Corrected manifest, hard stops, residual debts, and status (supersedes §27.2, §28.2, §28.4 where noted)

### 33.1 Corrected `db/76` objects (supersedes §27.2)

1. `public.listar_ordens_compra_fio_compat(UUID, BIGINT)` — Component A,
   inert until `canonical_active` (§30), item×OP grain (§25).
2. `public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC,
   DATE, TEXT, TEXT, TEXT)` — Component B, inert until `canonical_active`
   (§22), import-floor reversal policy (§24).
3. `ALTER TABLE public.ordem_compra_recebimentos DROP/ADD CONSTRAINT` — the
   additive `idempotency_namespace`/`comando_tipo` `CHECK` extension (§6.9),
   unchanged.
4. **No bridge trigger** (withdrawn, §31).
5. **No one-time backfill** (withdrawn, §31).

`db/76` therefore creates **exactly two functions and one additive
`CHECK`-constraint change**; it creates or modifies **zero** rows, **zero**
triggers, and **zero** existing `db/*.sql` objects. This is strictly smaller
than R1's manifest and removes every object that touched
`ordem_compra_item_compat_fio` or `ordens_compra_fio`.

### 33.2 Corrected test manifest note (refines §27.4)

The three test files (§9.6) drop the withdrawn bridge/backfill cases and add:
Component A raises `listar_compat_inativo` and returns no rows while
`legacy_active`/`maintenance_fenced` (integration SQL); the legacy
delete/reinsert flow is proven **unbroken** by `db/76` (no FK introduced —
integration SQL); and a `canonical_active` fixture proves Component A returns
the migrated-corpus rows correctly. No new test file is added.

### 33.3 Corrected residual debts (supersedes §28.2)

- The compat-mapping coverage gap is **NOT closed** by this contract
  (correcting R1 §28.2's "CLOSED"). It is re-scoped as a fixed-corpus cutover
  precondition (§32), owned by the real-cutover/C3D phase.
- Component A/B inert-until-`canonical_active`: not a debt — the corrected
  design.
- Import-floor policy (§24), decrease-admin-only (§6.7/§16),
  `obter_historico_recebimento_ordem_compra` verification (§6.10): unchanged.

### 33.4 Ratification-pending additions (extends §14/§28.3)

8. §30's Component A activation regime (inert until `canonical_active`).
9. §32's binding fixed-corpus decision, and the two named cutover-freeze
   options as the deferred C3D-scope precondition.

### 33.5 Hard-stop re-evaluation

No hard stop is newly triggered. Finding 3 was resolvable by a binding
architectural decision (§32 fixed corpus), which is precisely the category the
order's own hard-stop clause routes through a revised design rather than an
outright block. Findings 1 and 2 were resolvable by precedented design changes
(inert-until-`canonical_active`; withdraw the bridge).

### 33.6 Status

`STATUS` (unchanged): **PROPOSED / AWAITING SUPERVISOR ACCEPTANCE /
IMPLEMENTATION NOT AUTHORIZED**. `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain
`NONE` in `PROJECT_STATE.md`. No requirement is marked `SATISFIED`. Neither
`PHASE-C3C-B-DB-PREREQ` nor `PHASE-C3C-B` implementation, nor any migration,
nor any environment action, is authorized by this correction.

**Next step:** read-only supervisor review of this R2-corrected contract.

## 34. Supervisor acceptance and R3 documentary forward correction (governs on conflict)

> **Append-only forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under architect
> order `C3C-B-DB-PREREQ CONTRACT RATIFICATION CLOSEOUT`, documentation-only.
> This disposition is recorded by the delegated technical supervisor; it is not
> attributed to Kleber. §§0–33 are preserved verbatim as authored (no history
> rewrite). **Where §§1–33 and this §34 conflict, §34 governs.** This section
> records supervisor acceptance of the R2 architecture and reconciles the
> proposed-wording items that R2 (§§29–33) left stale in the append-only earlier
> sections. It authorizes **no** SQL, migration, implementation, or environment
> action; `db/76` still does not exist and is not created here.

### 34.1 Verdict

**`ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET
AUTHORIZED`.**

The corrected R2 architecture (§§29–33) is **accepted in principle**:

- Component A is installed inert and becomes active only under `canonical_active`
  (§30); Component B is installed inert and becomes active only under
  `canonical_active` (§22).
- `db/76` remains exactly **two new functions plus one additive
  `CHECK`-constraint extension** (§33.1); no bridge trigger, no one-time
  compat-mapping backfill, no `db/67`/`db/75` object modification.
- The current **fixed corpus** (§32) remains binding for the existing `db/75`
  cutover model.
- Corpus completeness, freeze, stranded-row diagnosis, and re-baselining belong
  to the later **real-cutover/C3D** band (§32/§33.3), not to this contract.
- The existence and quantity of post-REFUND-A stranded rows are an **empirical
  environment question** (a future read-only diagnosis), not a blocker to this
  contract's architecture.

An independent read-only premise audit verified these premises against the
installed `db/67`–`db/75` objects and the live `js/screens/*` writers and found
no premise requiring redesign. The remaining issues are **documentary only**
(stale proposed-delta, rollback, and requirement wording, superseded by R2 but
preserved append-only) and are reconciled in §§34.2–34.6. No hard stop is
triggered and no new blocking gate is introduced.

### 34.2 Corrected proposed `§R.29.7` (supersedes the §13.1 draft)

The §13.1 draft's claim that the two RPCs are "independent of the §R.29.3
cutover state machine" is **withdrawn** — R2 (§§30/22) makes both inert unless
`canonical_active`. The corrected text below remains a **proposed** normative
delta only; it is **not** applied to `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
in this pass (that application is itself a separate `NORMATIVE_CHANGE`, a
prerequisite to `db/76` authorization — §34.7):

```text
### §R.29.7 Legacy-compat database prerequisites (proposed)

A canonical order-catalog projection (listar_ordens_compra_fio_compat) and an
atomic legacy receipt-intent adapter (registrar_recebimento_ordem_compra_fio_compat)
operate on legacy-compat orders (ordem_compra.legado = TRUE). Both are installed
before the real cutover and are inactive unless the cutover singleton is
status='canonical_active' AND read_authority='canonical'. Before canonical
activation the projection raises the defined inactive-reader signal
(listar_compat_inativo, SQLSTATE 55000) and the adapter returns its defined
inactive-writer response ({ok:false, codigo:'recebimento_compat_inativo'}); the
future application read/write adapters fall back to the flat table during
legacy_active/maintenance_fenced, byte-identical to today. After canonical
activation, the adapter's first successful non-import receipt participates in
the existing §R.29.3 productive_receipt_started_at point of no return; no second
PONR is created. Legacy-compat receipt decrease is admin-only; reversal source
selection is deterministic LIFO over eligible tipo='recebimento' lançamentos,
capped at each line's remaining reversible balance; the imported opening balance
(tipo='import_saldo_inicial') is an immutable floor that no decrease may reduce.
Legacy-compat receipt eligibility is status_administrativo <> 'cancelada' (not
the native-only 'emitida' requirement) and status_aceite IN ('nao_aplicavel',
'aceita'). The projection's OP-attributable grain is item × OP, allocations
aggregated within the requested OP. The implementation binds to the
compat-mapped fixed corpus supported by the existing db/75 cutover; corpus
completeness, freeze, and any re-baseline are a later real-cutover/C3D
precondition, outside these RPCs' scope.
```

### 34.3 Corrected proposed `§13.18` (supersedes the §13.2 draft)

The reduced `db/76` schema surface (§33.1). Remains **proposed** text only, not
applied to `PEDIDO_OP_SCHEMA_CONTRACT.md` in this pass:

```text
#### 13.18 Legacy-compat receipt adapter schema requirements (proposed)

ordem_compra_recebimentos.idempotency_namespace and .comando_tipo CHECK
constraints are additively extended to admit 'legacy_compat_receipt_v1' and
'recebimento_compat' respectively, alongside the existing native values; no
existing row's namespace or type changes. db/76 introduces no trigger on
ordens_compra_fio, no one-time compat-mapping backfill, no
ordem_compra_item_compat_fio row, and no modification to any db/67 or db/75
object. The migration is exactly two SECURITY DEFINER functions plus this one
additive constraint change.
```

### 34.4 Rollback and test-contract reconciliation (supersedes §17 and §10 where they reference the withdrawn bridge/backfill)

Under the R2 manifest (§33.1), rollback of an applied `db/76` consists **only**
of dropping the two new functions and restoring the two prior `CHECK`-constraint
definitions. **No backfill rows exist to preserve or remove; no bridge trigger
exists to remove; `db/76` creates no `ordem_compra_item_compat_fio` row.** §17's
references to "the idempotent backfill's inserted rows" are superseded and inert.

The test contract (§10/§9.6, as corrected by §33.2) **must not** require the
withdrawn bridge/backfill tests. It retains or adds coverage for: Component A
inactive in `legacy_active` and `maintenance_fenced`; Component B inactive in
`legacy_active` and `maintenance_fenced`; both active only in `canonical_active`;
zero mutation while inactive; Component A item grain and item × OP grain;
pending/zero-receipt representation after canonical activation; supplier/admin
authorization; absolute increase/equal/decrease; imported-balance floor;
idempotency; concurrency; PONR participation; additive-constraint behavior; and
a reduced-manifest rollback rehearsal (drop two functions, restore the two
constraints) proving `db/76` introduces no FK on the legacy delete/reinsert flow.

### 34.5 Component A required-population wording (bounds the "every legacy-compat order" phrasing of §4)

Component A's required population is **every compat-mapped legacy order in the
qualified/migrated cutover corpus** — i.e. every `ordem_compra.legado = TRUE`
order that has an `ordem_compra_item_compat_fio` mapping, which under the §32
fixed-corpus decision equals the frozen REFUND-A set the `db/75` cutover
migrates. Component A does **not** claim coverage of unmapped post-REFUND-A flat
rows; those are read via the application's flat fallback during `legacy_active`
and are out of the cutover corpus (§31/§32). Any earlier aspirational phrasing
of "every legacy-compat order" (e.g. §4, §0 finding 3) is read subject to this
bound.

### 34.6 Completeness ownership (confirms §32/§33.3; introduces no `db/76` gate)

Stopping new legacy flat-row creation, diagnosing stranded rows, proving final
corpus completeness, disposing of already-stranded rows, freeze or re-baseline,
and the real fence/snapshot/import all belong to the later **real-cutover/C3D
preparation band** (§32/§33.3; consistent with the traceability matrix's
`OC-C3D-*`/`OC-CUTOVER-*` owners and `§R.29.4`/`§R.29.5`). This pass:

- adds **no** mandatory `UNMAPPED_HEADER_BEARING_LEGACY_ROWS = 0` gate to
  `db/76`;
- does **not** claim that a freeze alone resolves already-existing stranded
  rows — a freeze blocks only further creation, whereas already-stranded rows
  require an authorized backfill/re-baseline or a documented exclusion;
- records that the later cutover owner must **choose and prove an authorized
  completeness disposition** (freeze plus re-baseline/backfill, or a documented
  exclusion) based on the future read-only environment `ordens_compra_fio`
  diagnosis (`PROJECT_STATE.md` Phase-C open items). The quantity of stranded
  rows is empirical and unproven until that diagnosis runs; its absence does not
  block this contract.

### 34.7 What this acceptance does and does not authorize

- **Accepts** the R2 architecture (§§29–33) as the governing design of this
  contract going forward, with the documentary reconciliations in §§34.2–34.6.
- Does **not** authorize `PHASE-C3C-B-DB-PREREQ` implementation, `db/76`
  authoring, any migration, or any database/staging/production/environment
  action.
- Does **not** apply the corrected `§R.29.7`/`§13.18` deltas to the normative
  files. **Formal normative application of §34.2/§34.3 (a separate
  `NORMATIVE_CHANGE`) remains a prerequisite to `PHASE-C3C-B-DB-PREREQ`
  implementation authorization**, to be obtained as part of that authorization.
- **Ratifies and freezes** the design decisions listed in §14/§28.3/§33.4 —
  the LIFO reversal rule (§6.7/§34.2), the legacy eligibility gate
  (§6.4.3/§34.2), the item×OP grain (§25/§34.2), the activation regime
  (§§22/30/34.2), the fixed corpus (§32/§34.2), and real-cutover/C3D
  ownership of freeze and re-baseline (§32/§34.6) — as the accepted
  architecture for implementation. None of these six items requires a
  further architectural ratification pass; each is **frozen** unless new
  material evidence (e.g. a contradicted premise, a changed installed
  `db/67`–`db/75` object, or an architect-directed redesign) requires
  reopening it. This §34.7 bullet corrects the R3 pass's earlier
  "ratification-pending" framing of the same six items, which is
  superseded.
- Only two items remain pending before `PHASE-C3C-B-DB-PREREQ`
  implementation: (a) formal normative application of the corrected
  `§R.29.7`/`§13.18` deltas (§34.2/§34.3), and (b) explicit architect
  implementation authorization.
- Does **not** change `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` (`PROJECT_STATE.md`
  keeps both `NONE`); marks **no** requirement `SATISFIED`.

### 34.8 Status and next authorizable action

`STATUS` (machine-readable marker updated at the head of this file):
**`ACCEPTED_WITH_NONBLOCKING_DOCUMENTARY_DEBT / IMPLEMENTATION NOT YET
AUTHORIZED`.**

`NEXT_AUTHORIZABLE_ACTION`: **`PHASE-C3C-B-DB-PREREQ-IMPLEMENTATION-AUTHORIZATION`**
— an architect decision to authorize `PHASE-C3C-B-DB-PREREQ` implementation
(which must, as its own precondition, obtain the §34.2/§34.3 normative
application). No phase chains automatically; `db/76` authoring, implementation,
migration, and every environment action remain unauthorized.

## 35. Implementation closeout — R3 shape-guard correction (governs on conflict)

> **Append-only forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under the architect
> order authorizing `PHASE-C3C-B-DB-PREREQ` implementation. §§0–34 are preserved
> verbatim (no history rewrite). **Where §§1–34 and this §35 conflict, §35
> governs.** This section records that `PHASE-C3C-B-DB-PREREQ` was implemented and
> locally verified, and the single within-phase correction that implementation
> forced on the narrow §34.3/§13.18 premise. It records `IMPLEMENTED / LOCALLY
> VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`; it does **not** mark the phase
> accepted, does **not** mark any dependent C3C-B requirement `SATISFIED`, and
> keeps `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` `NONE`.

### 35.1 Authorization and entry

The architect order authorized `PHASE-C3C-B-DB-PREREQ` implementation, the
required normative application of §34.2 → `§R.29.7` and §34.3 → `§13.18`
(removing the "proposed" designation), the migration `db/76`, the three
contracted test files, the closeout documents, and a single fast-forward push to
`staging/dev`. Environment is `LOCAL_ONLY`: no Supabase write, staging
application, deployment, activation, cutover, snapshot/import, ACL-closure
invocation, `main`, `origin`, or `production` remote.

### 35.2 Shape-guard finding (new material evidence)

Mapping Component B against the actually-installed objects surfaced that the
native ledger shape guard `trg_native_lancamento_shape_guard` (db/71 L95–98,
latest db/74 L802–808) cross-checks the header's `comando_tipo` against each
ledger line's `tipo` (`tipo='recebimento'` requires `comando_tipo='recebimento'`;
`tipo='estorno'` requires `comando_tipo='estorno'`). R1 §6.6/§6.9's
`comando_tipo='recebimento_compat'` header — which §34.3/§13.18 carried into the
proposed schema delta as a `comando_tipo` `CHECK` extension — is therefore
rejected on every receipt/reversal line. The frozen manifest (§33.1) forbids
`db/76` from modifying that guard, so the only manifest-preserving path is to
reuse the native command types.

### 35.3 Architect ruling (governs)

- Increase and equal/no-op requests write `comando_tipo='recebimento'`.
- Decrease requests write `comando_tipo='estorno'`.
- Compatibility identity is carried **exclusively** by
  `idempotency_namespace='legacy_compat_receipt_v1'`.
- No `comando_tipo='recebimento_compat'` is introduced or admitted; the
  `comando_tipo` `CHECK` is left unchanged; `trg_native_lancamento_shape_guard`
  is left unchanged.
- `db/76` is therefore **exactly two new functions plus one additive `CHECK`
  change — idempotency_namespace only**. This corrects the narrow §34.3/§13.18
  premise within this authorized phase. No other architectural decision is
  reopened.

Consequently the applied `§13.18` (schema contract) is the corrected text
(idempotency_namespace-only extension of both
`ordem_compra_recebimentos_c3a_namespace_check` and
`ordem_compra_recebimentos_c3c_hash_check`, `comando_tipo` unchanged); the
applied `§R.29.7` (lifecycle spec) is §34.2 verbatim plus one clarifying sentence
recording the native-command-type reuse. The inactive-writer response code
`recebimento_compat_inativo` and the inactive-reader signal `listar_compat_inativo`
are unaffected.

### 35.4 Manifest as built

- `db/76_ordem_compra_c3c_b_db_prerequisites.sql`: `listar_ordens_compra_fio_compat(UUID, BIGINT)`
  (Component A, inert until `canonical_active`, item and item × OP grains) and
  `registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT)`
  (Component B, inert until `canonical_active`, LIFO reversal, admin-only
  decrease, imported-balance floor, PONR participation on increase), plus the
  additive extension of `ordem_compra_recebimentos_c3a_namespace_check` and
  `ordem_compra_recebimentos_c3c_hash_check` to admit `'legacy_compat_receipt_v1'`.
  No bridge trigger, no backfill, no `ordem_compra_item_compat_fio` row, no
  `db/67`/`db/75` object modification, no product/UI/JS/HTML/CSS change.
- Tests: `tests/ordem-compra-c3c-b-db-prerequisites.smoke.js`,
  `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql`,
  `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs`.
- Normative: `§R.29.7` applied to `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`;
  `§13.18` applied to `PEDIDO_OP_SCHEMA_CONTRACT.md`.

### 35.5 Verification scope (honest)

- **Executed (local, no database):** the smoke suite
  (`…smoke.js`, 14 assertions) PASS; the directly dependent static-smoke
  regressions `ordem-compra-c3c-inactive.smoke.js`,
  `ordem-compra-native-receipt.smoke.js`, and `ordem-compra.smoke.js` PASS
  (49/49 combined); the concurrency file parses under `node --check`;
  `node scripts/validate-spec-custody.mjs` PASS; `git diff --check` /
  `git diff --cached --check` clean.
- **Authored to §34.4 but NOT executed:** the two DB-backed files
  (`…integration.sql`, `…concurrency.mjs`) and the DB-backed C3C-A regressions
  (`ordem-compra-c3c-inactive.integration.sql`,
  `ordem-compra-c3c-inactive-concurrency.mjs`). The local PostgreSQL 18.4
  cluster crash-loops on startup (Windows shared-memory reservation failure,
  `could not reserve shared memory region … error code 487`), so no backend
  connection survives. Supabase execution is out of this phase's `LOCAL_ONLY`
  authorization and was not used. These files are ready to run against a stable
  local Postgres with the full applied `db/01…db/76` schema; their execution is
  a supervisor-acceptance / staging-validation item, not a completed local
  proof, and is reported as **unavailable** rather than inferred.

### 35.6 Status and next authorizable action

`STATUS` (superseded by §36): **`IMPLEMENTED / LOCALLY VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`**.
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; no dependent C3C-B
requirement is `SATISFIED`. `NEXT_AUTHORIZABLE_ACTION`:
**`PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW`**. Staging application/validation,
deployment, activation, real snapshot/import, fence transition, read switch,
final ACL-closure invocation, cutover, C3D, C4, C5, production access, `main`,
`origin`/`production` remote mutation, and any further push remain unauthorized.
Accounting subject: `feat: add C3C-B database prerequisites`.

## 36. DB-backed validation completion — isolated local Postgres (governs on conflict)

> **Append-only forward correction (`FORWARD_CORRECTION` per
> `docs/governance/DOCUMENTATION_MODEL.md` §19).** Recorded under the architect
> order authorizing `VALIDATION CONTINUATION — ISOLATED LOCAL POSTGRES`. §§0–35
> are preserved verbatim (no history rewrite). **Where §§1–35 and this §36
> conflict, §36 governs.** This section replaces §35.5's "not executed" finding
> for the two C3C-B DB-backed test files, which have since been executed
> successfully against a disposable local PostgreSQL 18.4 cluster, and records
> two in-scope defect corrections (one in `db/76` itself, several in the test
> files) discovered in the process. No architecture is reopened; no Supabase or
> staging access occurred; `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`.

### 36.1 Runtime used

The host's scoop-installed PostgreSQL 18.4 cluster (§35.5) remained unusable
(same Windows shared-memory reservation crash). Docker, Podman, and WSL were
absent from this host. A **disposable, isolated local PostgreSQL 18.4 cluster**
was initialized via `initdb`/`pg_ctl` into a fresh data directory under the
system temp path (outside the repository and outside the host's broken
`PGDATA`), on a distinct port, with `autovacuum = off` and reduced parallel
workers as mitigation. It ran stably for the full validation session. A
Supabase-compatibility shim (schema `auth` with `uid()`/`role()`/`users`, roles
`anon`/`authenticated`/`service_role`, `extensions` schema with `pgcrypto`) was
bootstrapped in the disposable database only — these objects exist solely in
that throwaway cluster, are not part of the repository's migration history, and
are not referenced by any tracked file.

### 36.2 Schema apply and `db/76` reapply

The full `db/01`…`db/76` sequence applied cleanly, in order, against the
disposable cluster. `db/67`'s own migration-time self-check requires the exact
historical 64-row legacy `ordens_compra_fio` corpus (27/12/13/12 classification,
per the ratified diagnosis) to already exist at apply time; that corpus is real
historical production data, not reproduced by any repository seed script. A
synthetic fixture batch matching only that classification shape (not the deeper
historical aggregate values, §36.5) was inserted immediately before `db/67`,
external to any tracked migration file, solely to let the unmodified `db/67`
apply and self-verify. `db/76` was then reapplied alone afterward: it converged
with no error and no duplicate constraint, proving the additive
`idempotency_namespace` `CHECK` extension (`DROP CONSTRAINT IF EXISTS` +
`ADD CONSTRAINT`) is safely re-runnable.

### 36.3 DB-backed test results

- `tests/ordem-compra-c3c-b-db-prerequisites.integration.sql` — **PASS**
  (`C3C_B_INTEGRATION_PASS`). Covers: inactive behavior in `legacy_active` and
  `maintenance_fenced` (Component A raises `listar_compat_inativo`; Component B
  returns `recebimento_compat_inativo`; zero mutation while inactive); both
  active only in `canonical_active`; Component A item grain and item × OP
  grain; pending/zero-receipt representation; admin/matching-supplier/
  non-matching-supplier/anonymous role matrix; absolute increase (with PONR
  participation) / equal-no-op / admin-only decrease; deterministic LIFO
  reversal; the imported-balance immutable floor
  (`reducao_abaixo_saldo_importado`); supplier-decrease denial
  (`decremento_exige_admin`); exact-replay and conflicting-payload idempotency;
  unmapped-flat-row denial (`mapeamento_compat_ausente`); the additive
  `CHECK` admitting `legacy_compat_receipt_v1` while `legacy_initial_balance_v1`
  remains valid and no `comando_tipo='recebimento_compat'` is ever written; and
  a reduced-manifest rollback rehearsal proving the legacy delete/reinsert flow
  on `ordens_compra_fio` is unbroken (no trigger/FK introduced).
- `tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs` — **PASS**
  (`C3C_B_CONCURRENCY_PASS`). Proves the item `FOR UPDATE` lock genuinely
  serializes two concurrent Component B calls against the same legacy-compat
  item, confirmed via `pg_catalog.pg_blocking_pids`, and that the second caller
  re-evaluates the current total fresh after its lock is granted rather than
  applying a stale delta (holder moves the absolute total 40→55 kg; subject,
  unblocked, targets 80 kg; final cache is exactly 80 kg — a stale read would
  have produced 95 kg). `pg_stat_database.deadlocks` unchanged across the run
  (no new deadlock).
- Both tests were then **rerun after the standalone rollback-and-reapply cycle**
  (§36.4) and **passed again**, confirming `db/76`'s objects are correct and
  usable both before and after a real (not test-transaction-nested) rollback.

### 36.4 Rollback rehearsal (standalone, persisted — supersedes the transaction-nested proof in the integration test alone)

Before rollback: direct queries confirmed zero `trg_ordens_compra_fio_bridge_compat`
triggers, zero `ordem_compra_item_compat_fio` rows with `origem='native_bridge'`,
and zero `ordem_compra_recebimentos` rows with
`idempotency_namespace='legacy_compat_receipt_v1'` — nothing required reversal,
confirming §17/§34.4's "no backfill rows, no bridge trigger" claim empirically,
not just by migration-text inspection. Rollback executed and committed: both new
functions dropped; both prior `idempotency_namespace`/hash-shape `CHECK`
definitions restored byte-for-byte (verified via `pg_get_constraintdef`). `db/76`
was then reapplied (§36.2) and both DB-backed tests rerun and passed (§36.3).

### 36.5 Defects found and corrected (in-scope: `db/76` and the three test files only)

**One defect in `db/76` itself**, corrected:

- Component A (`listar_ordens_compra_fio_compat`) checked cutover activation
  with a bare `SELECT 1 FROM ordem_compra_cutover WHERE id = 1 AND status =
  'canonical_active' AND read_authority = 'canonical'`. Because this function's
  own `RETURNS TABLE` declares an OUT column literally named `status`,
  PL/pgSQL's variable/column conflict resolution made the bare `status`
  reference ambiguous, raising `42702` on every call. **Fix:** replaced with a
  `v_cutover public.ordem_compra_cutover%ROWTYPE` variable and
  `v_cutover.status`/`v_cutover.read_authority` field access — the identical
  pattern Component B and `db/75`'s own wrappers already use, and now the only
  form used in this file. No other object, grant, or semantic changed.

**Several defects in the C3C-B test files**, corrected (none in `db/67`,
`db/75`, or any product/UI/JS/HTML/CSS file):

- `…integration.sql`: the synthetic imported-balance ledger line
  (`tipo='import_saldo_inicial'`) was fixture-seeded with a non-`NULL`
  `data_recebimento` and a `NULL` `ator_tipo`, violating the `db/73`
  constraints (`…_c3a_receipt_date_check`, `…_c3a_actor_check`) that require
  `NULL` date and `ator_tipo='sistema'` for import rows. Fixed in both
  `…integration.sql` and `…concurrency.mjs` (identical fixture shape).
- `…integration.sql`: the rollback-rehearsal section originally ran *after* the
  productive Component B tests had already written `legacy_compat_receipt_v1`
  headers, so restoring the narrower two-value `CHECK` necessarily failed
  against those existing non-conforming rows — not a `db/76` defect, but a test
  sequencing error: the contract's rollback scenario (§17/§34.4) is inherently
  pre-activation (before Component B is ever productively used). Fixed with a
  `SAVEPOINT`/`ROLLBACK TO` pair that discards the productive-write side
  effects (already asserted) immediately before the rehearsal, reproducing the
  real near-term rollback precondition.
- `…integration.sql`: a post-increase assertion read
  `ordem_compra_cutover.productive_receipt_started_at` directly while still
  `SET LOCAL ROLE authenticated` — that table is fully revoked from every
  client role (`db/75`). Fixed by `RESET ROLE` around that one check.
  `ordem_compra_item`/other tables the surrounding assertions read do carry a
  direct `authenticated` grant and were unaffected.
- `…concurrency.mjs`: the holder session tried a raw
  `SELECT … FOR UPDATE` on `ordem_compra_item` while `SET ROLE authenticated`
  (only a plain `SELECT` grant exists for that role; direct mutation/locking is
  by design reserved to the owning `SECURITY DEFINER` functions). Fixed by
  running that raw lock as the cluster owner and reserving the `authenticated`
  role switch for the actual RPC calls, whose internal locking runs as the
  function owner regardless of caller.
- `…concurrency.mjs`: `set_config('request.jwt.claim.sub', …, TRUE)` sets a
  **transaction-local** GUC; each statement sent to the interactive `psql`
  session (no wrapping `BEGIN`) executes as its own separate implicit
  transaction, so the claim silently reverted before the next statement and
  `auth.uid()` read back `NULL`, failing every RPC call closed with
  `sem_permissao`. Fixed by using session-scoped persistence (`FALSE`) instead.
- `…concurrency.mjs`: after that auth fix, the holder locked only the item row
  directly, while Component B locks the order header **then** the item
  internally (§6.4.2/§6.10). This produced a genuine deadlock once the holder
  later issued its own RPC call needing the header (already held hostage by
  the blocked subject, which held the header while waiting on the item). Fixed
  by having the holder lock the header **and** the item upfront, in the same
  order Component B uses — the same discipline the function itself relies on
  to stay deadlock-free.

None of these corrections touched the frozen architecture (§34.7's six ratified
decisions), the manifest (§33.1 — still exactly two functions plus one additive
`CHECK`), `db/67`, `db/75`, or any product/UI/JS/HTML/CSS file.

### 36.6 C3C-A DB-backed regressions — genuine, pre-existing environment/data limitation (not `db/76`-related)

`tests/ordem-compra-c3c-inactive.integration.sql` and
`tests/ordem-compra-c3c-inactive-concurrency.mjs` could **not** be executed
against the disposable cluster (or any synthetic corpus). Both assert exact
ratified historical aggregate values tied to the real
`ucrjtfswnfdlxwtmxnoo` corpus — `…integration.sql` checks header count `= 39`,
ledger-line count `= 44`, total `= 20221.280` kg, and excess `= 405.980` kg
(lines 215–224, 434–445); `…concurrency.mjs` asserts the import result JSON
contains `"headers": 39` (line 179). These are the specific real-data numbers
from `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_2026-07-18.md`, not a function
of any classification-count-only synthetic fixture (the kind built for `db/67`,
§36.2) — reproducing them would require a byte-for-byte synthetic clone of the
real historical corpus's exact per-row `kg_pedido`/`kg_recebido` values, which
this `LOCAL_ONLY`, no-Supabase phase has no authorized way to construct or
verify against the genuine source of truth. This is a **pre-existing
characteristic of the C3C-A test files** (fixed at `PHASE-C3C-A`'s own
authoring, unrelated to and unmodified by this phase), not a defect discovered
in or introduced by `db/76`. The two C3C-A **static** smoke regressions already
required by this phase (`ordem-compra-c3c-inactive.smoke.js`, which is
data-independent) ran and passed (§35.5/§36.3's combined 49/49). Reported here
as **unavailable**, not inferred, consistent with the order's evidence
discipline.

### 36.7 Validation and status

`node scripts/validate-spec-custody.mjs` PASS; `git diff --check` and
`git diff --cached --check` clean (checked again after this pass's edits,
§36.8). `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` remain `NONE`; no dependent
C3C-B requirement is marked `SATISFIED`.

`STATUS`: **`IMPLEMENTED / LOCAL DB VERIFIED / AWAITING SUPERVISOR ACCEPTANCE`**.
`NEXT_AUTHORIZABLE_ACTION`: **`PHASE-C3C-B-DB-PREREQ-SUPERVISOR-REVIEW`**
(unchanged). Staging application/validation, deployment, activation, real
snapshot/import, fence transition, read switch, final ACL-closure invocation,
cutover, C3D, C4, C5, production access, Supabase writes, `main`,
`origin`/`production` remote mutation, and any push beyond the authorized
`staging/dev` fast-forward remain unauthorized. Accounting subject:
`test: complete C3C-B DB prerequisites validation`.
