# Manta Direct Route — PHASE-MANTA-B Phase Contract

STATUS: PHASE-MANTA-B1 IMPLEMENTED / LOCALLY AND CONCURRENTLY VERIFIED /
AWAITING ARCHITECT REVIEW. PHASE-MANTA-B1 remains open. PHASE-MANTA-B2 (route
activation) is NOT authorized and no phase chains automatically.

Order (B1): `PHASE-MANTA-B1-EXPEDITION-SOURCE-FOUNDATION-R1`.
Predecessor: `MANTA_PRODUCT_VARIANT_PHASE_CONTRACT.md` (PHASE-MANTA-A, CLOSED /
ACCEPTED — product identity + route homogeneity, db/78–db/80). This contract owns
the Manta **direct weaving→client route** semantics; PHASE-MANTA-A remains the
owner of Manta product identity.

## 1. Objective and boundary

PHASE-MANTA-B delivers the Manta direct weaving→client route. It is split:

- **PHASE-MANTA-B1 (this migration, db/81)** — the **dormant database
  foundation** for Manta-sourced expeditions: a second authoritative expedition
  source, cross-table source integrity, consumed-output immutability, an OP
  reopening restriction, and concurrency-safe invariants. B1 does **not** make the
  route operationally callable: no UI action, no RPC, and no writer creates a
  Manta expedition after db/81. `entregas.etapa='cima'` and
  `entregas_destino_cima_chk` are unchanged; `salvarEntregaCima` is unchanged; no
  new `entregas.etapa` value is created; Manta never calls `gerar_op_latex` /
  `gerar_op_latex_split`.
- **PHASE-MANTA-B2 (not authorized here)** — activates the route: the Manta
  expedition writer, the route-conditional `cima` destination relaxation, the
  balance-preserving reversal/correction writer, the dynamic Manta stepper, and
  any progress/read-model branch. Each requires a separate explicit order.

## 2. Binding business rulings (implemented in db/81)

**BR-1 — Weaving-output authority.** Manta expedition eligibility derives
**exclusively** from measured weaving output: `public.entregas` +
`public.entrega_itens` with non-defect `metros_entregues`. The OP plan is **not**
expedition authority.

**BR-2 — Delivery token.** `entregas.etapa='cima'` is reused unchanged as the
measured weaving output. `cima` is the output from weaving; a Tapete `cima`
requires a finishing destination, a Manta `cima` has none. **No** new
`entregas.etapa` value is created; Manta never enters finishing. The
route-conditional destination relaxation and the Manta expedition **writer** are
deferred to PHASE-MANTA-B2; B1 does **not** weaken the current Tapete
`entregas_destino_cima_chk`.

**BR-3 — Correction and reopening.** Before any positive expedition release an
authorized administrative correction may alter the measured weaving output, and a
Manta OP may be reopened if the existing state machine (`db/21 alterar_status_op`)
otherwise permits it. After any `expedicao_itens.metros_liberados > 0` through the
OP:

- the Manta weaving output is immutable through normal writes;
- the Manta OP cannot be reopened;
- correction requires an explicit atomic administrative reversal/correction flow;
- `app.retificacao_autorizada` is the only controlled technical escape (no UI
  enables it, no general authenticated writer receives it);
- until a balance-preserving reversal writer exists, the guards **fail closed**.
  B1 implements no reversal/correction writer.

## 3. Expedition-source architecture (accepted)

An expedition has exactly **one typed source**, never both and never neither:

- `expedicoes.op_latex_id` — the **Tapete finishing** source (`ops.tipo='latex'`),
  unchanged from db/23; now nullable, FK and `UNIQUE(op_latex_id)` preserved.
- `expedicoes.op_tecelagem_id` — the **Manta weaving** source (new in db/81),
  `BIGINT NULL REFERENCES public.ops(id) ON DELETE RESTRICT`.

Integrity:

- `expedicoes_exactly_one_source_chk`:
  `(op_latex_id IS NOT NULL) <> (op_tecelagem_id IS NOT NULL)`.
- Partial unique index `expedicoes_op_tecelagem_id_uk` on `op_tecelagem_id WHERE
  op_tecelagem_id IS NOT NULL` — **one expedition per Manta weaving OP** and the
  lookup access path (no separate index needed).
- `op_tecelagem_id` may reference only `ops.tipo='tecelagem'`, a non-empty
  route-homogeneous OP whose every `op_item` resolves to
  `modelos.tipo_produto='manta'`. A Tapete, mixed, empty, or deleted OP is
  rejected. Manta is derived from `modelos.tipo_produto` (db/78), **never** a
  name. Source identity is stable under db/78–db/80 (route homogeneity +
  model-reference immutability).

Existing rows (`op_latex_id` non-null, `op_tecelagem_id` null) remain valid and
unchanged.

## 4. Database (`db/81_manta_expedition_source_foundation.sql`)

Single forward-only, idempotent migration. Authoritative guards (all
`SECURITY DEFINER`, `SET search_path = public`, BEFORE triggers → no partial
write; trigger functions need no EXECUTE grant):

1. `expedicoes_source_validation_guard` (BEFORE INSERT / source-changing UPDATE) —
   serializes on the affected source OP row(s) `FOR UPDATE` (ascending `op_id`)
   before inspecting; validates the source type/route; rejects a source change
   that would orphan existing expedition items (except under the escape).
2. `expedicao_itens_membership_guard` (BEFORE INSERT / membership-changing UPDATE)
   — every `op_item_id` must belong to the expedition's selected source OP
   (`op_latex_id` for Latex, `op_tecelagem_id` for Manta); rejects cross-OP
   injection; locks the item's OP and the source OP `FOR UPDATE`, then the
   expedition, then validates. A `metros_entregues`-only UPDATE (delivery path) is
   untouched.
3. `op_itens_expedicao_reference_guard` (BEFORE UPDATE) — rejects relocating an
   `op_item` (changing `op_id`) while it is referenced by an expedition (except
   under the escape). Deletion is already blocked by
   `expedicao_itens.op_item_id → op_itens ON DELETE RESTRICT`.
4. `entrega_itens_manta_consumo_guard` (BEFORE UPDATE / DELETE) — after consumption
   (a Manta-sourced expedition with `metros_liberados > 0` references the
   `op_item`), rejects UPDATE of `op_id`/`op_item_id`/`metros_entregues`/`defeito`
   and DELETE (except under the escape). Composes with the db/24
   `entrega_itens_cima_latex_guard` (which covers only Latex-linked output; Manta
   `cima` output is never Latex-linked).
5. `entregas_manta_consumo_guard` (BEFORE UPDATE / DELETE) — rejects a header
   mutation of an `entregas` row that owns consumed Manta output (except under the
   escape).
6. `ops_manta_reopen_guard` (BEFORE UPDATE) — rejects a terminal→non-terminal
   `ops.status` transition of a consumed Manta weaving OP (except under the
   escape). Inert before positive release, so `db/21 alterar_status_op` behavior is
   preserved; Tapete/`op_latex_id` OPs never match.

**Global deterministic lock order** (reconciled with db/79/db/80 and the
db/31/db/32 expedition/delivery functions; no db/81 path takes these in reverse):

1. `pedidos` row (only when completion is involved — not in db/81);
2. affected `public.ops` rows, ascending `op_id` (`FOR UPDATE`);
3. affected `public.modelos` rows, ascending `modelo_id` (`FOR SHARE`, db/80 — not
   re-taken by db/81; a source OP's op_item models are immutable once referenced,
   so their `tipo_produto` is read unlocked);
4. `entregas` / `entrega_itens`;
5. `expedicoes`;
6. `expedicao_itens`.

The db/31/db/32 functions already lock the owning `ops` row before that op's
`op_itens`/`entrega_itens`/`expedicoes`, so the new `expedicoes`/`expedicao_itens`
triggers only re-enter locks the caller already holds.

## 5. Correction and reopening policy

`app.retificacao_autorizada = 'on'` (the established db/24/25/36/37 escape idiom,
NULL-safe `current_setting('app.retificacao_autorizada', true)`) is the single
controlled technical escape honored by all four consumption/reopening guards. It
is set only by an explicitly authorized flow (e.g. the db/37 controlled-delete
`remover_op`/`remover_pedido`, which delete consumed rows under the escape); no UI
enables it and no general authenticated writer receives it. A future
balance-preserving reversal/correction writer (PHASE-MANTA-B2) will be the auditable
consumer of the escape for live correction. Until it exists, B1 fails closed.

## 6. Route sequences and UI ruling (binding)

- **Tapete**: Insumos → Tecelagem → **Acabamento** → Expedição → Entrega
  (source `op_latex_id`).
- **Manta**: Insumos → Tecelagem → Expedição → Entrega (source `op_tecelagem_id`;
  no Acabamento).

UI route ruling (as accepted in PHASE-MANTA-A §9, unchanged and not implemented in
B1): the Manta stepper omits Acabamento entirely; Tapete retains it; a mixed Pedido
represents its two applicable routes separately; a single fixed linear stepper must
not falsely represent a mixed Pedido. The dynamic Manta stepper and any
route-aware progress are **PHASE-MANTA-B2 UI items** — B1 changes no product UI,
stepper, or progress behavior.

## 7. Implementation and activation boundaries (B1 / B2 separation)

After db/81 (dormant foundation requirement):

- no current UI action can create a Manta expedition;
- no existing RPC silently starts accepting Manta (`liberar_expedicao`,
  `liberar_expedicao_latex_parcial`, `registrar_entrega_expedicao` remain
  Latex-only and are unchanged);
- current Tapete expedition behavior is unchanged;
- `entregas_destino_cima_chk` is unchanged; `salvarEntregaCima` is unchanged;
- no direct-route RPC is created; no progress or stepper behavior changes.

PHASE-MANTA-B2 activates the route separately.

## 8. Tests (disposable PostgreSQL 18.4 only)

- `tests/manta-expedition-source.integration.sql` — one-transaction, rolled-back
  proof of every db/81 guard: exactly-one-source (both/neither rejected); valid
  Latex accepted; valid homogeneous Manta accepted; Tapete/empty/mixed weaving
  source rejected; duplicate Manta source rejected; membership accept + cross-OP
  reject (Manta and Latex); orphaning source change rejected; referenced op_item
  move rejected + delete rejected (FK); unconsumed output correctable; consumed
  output UPDATE/DELETE + header mutation rejected; the `app.retificacao_autorizada`
  escape proven inside the rolled-back transaction; Manta reopen after release
  rejected; reopen before release inert; Tapete reopen unaffected.
- `tests/manta-expedition-source-invariant.mjs` — disposable-cluster harness: full
  db/01..81 apply; db/81 idempotent re-apply with zero schema/constraint/trigger/
  function/grant drift; the integration test above; regression (db/78–80 identity
  integration, Manta finishing rejection intact in `gerar_op_latex`/`_split`, C5A
  emission on the reconciled 64/51/51 corpus); and distinct-session concurrency —
  E1 two creations for one Manta OP → one commit + one controlled rejection (loser
  blocks on the source-OP lock), E2 a cross-OP item writer blocks on the source-OP
  lock then is rejected against the committed source (item writes cannot cross
  sources or overtake a source change), E3 different Manta OPs do not serialize and
  no deadlock (`40P01`) — cluster then destroyed with PID/port/dir proof.
- `tests/ordem-compra-c3d-deploy.smoke.js` — migration terminal advanced 80 → 81
  (terminal two `db/80`/`db/81`; db/81 checkpoint-hash + byte-stability added).

The frozen phase `.mjs` harnesses of earlier phases
(`tests/manta-product-identity-invariant.mjs` at terminal 80,
`tests/ordem-compra-c3d-lock-concurrency.mjs` at 76,
`tests/clean-slate-transactional-reset.smoke.mjs` at 77) are intentionally left at
their authoring terminal (the established pattern: db/77–80 did not re-pin older
frozen harnesses); B1 validation is carried by the new harness above.

## 9. Hard stops (honored)

No hard stop was hit: db/78–db/80 were not modified; the established lock order is
compatible (ops→modelos→entregas→expedicoes→expedicao_itens, ascending); no Manta
writer was activated; `entregas_destino_cima_chk` was not relaxed; exactly one
migration was created; source-item membership, consumed-output immutability, and
distinct-session concurrency are all authoritatively proven; no shared-development
access was used; the baseline matched.

## 10. Status and next authorizable action

PHASE-MANTA-B1 is IMPLEMENTED / LOCALLY AND CONCURRENTLY VERIFIED / AWAITING
ARCHITECT REVIEW; it remains open. db/81 is versioned in the repository and applied
only to disposable local clusters — **no shared-development, staging, or production
apply** is authorized by this order. The next authorizable action is architect
review of PHASE-MANTA-B1; PHASE-MANTA-B2 (route activation) requires a new explicit
order and does not chain automatically.
