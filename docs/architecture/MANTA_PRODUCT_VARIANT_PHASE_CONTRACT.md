# Manta Product Variant — PHASE-MANTA-A Phase Contract

STATUS: CLOSED / ACCEPTED / APPLIED TO SHARED DEVELOPMENT / LIVE VALIDATED

Order: `PHASE-MANTA-A-PRODUCT-IDENTITY-AND-ROUTE-FOUNDATION-R1`.
Diagnosis: `PRODUCT-VARIANT-MANTA-WEAVING-ONLY-DIAGNOSIS-R1`.

## 1. Objective and boundary

PHASE-MANTA-A establishes the canonical **product identity** for a second product
variation, **Manta**, and the **route-homogeneity** invariants required before (and
independently of) any direct-delivery route. It does **not** make Manta
operationally deliverable — the weaving→client direct route is deferred to
**PHASE-MANTA-B**; its backend persistence mechanism is **unresolved** (the
previously assumed `entregas.etapa = 'tecelagem_direto'` is **superseded** and is
no longer a selected solution — see §9).

## 2. Architect rulings (binding, implemented)

1. **Product identity owner** — `modelos.tipo_produto` (`tapete` | `manta`) is the
   sole canonical owner. No redundant product-type column is added to
   `pedido_itens`, `op_itens`, `ops`, `lotes` or deliveries; those derive the type
   through `modelo_id`.
2. **Width & composition** — every Manta model is `largura = 1.40`; yarn stays the
   canonical width-keyed calculation (`parametros_largura[1.40]`). No yarn factor is
   duplicated anywhere. A conflicting non-null `pedido_itens.largura` override for a
   Manta item is rejected authoritatively.
3. **Mixed Pedido** — a Pedido may contain both Tapete and Manta items.
4. **Route-homogeneous weaving OP** — one weaving OP contains only Tapete or only
   Manta; a mixed Pedido creates separate OPs by type. Enforced at the database
   (`op_itens` trigger) and in the writer, not only in the UI.
5. **Finishing exclusion** — a Manta OP never creates or enters finishing; direct
   invocation of `gerar_op_latex` / `gerar_op_latex_split` rejects a Manta origin,
   by `tipo_produto` (never by model-name comparison).
6. **Informal existing Manta** — the semantic row (name `MANTA ARABESCO`, width
   `1.40`) is migrated to `nome = 'ARABESCO'`, `tipo_produto = 'manta'`, identified
   by guarded semantic attributes (not a hardcoded id), fail-closed on ambiguity,
   with an explicit diagnostic when absent. All other rows backfill as `tapete`.
7. **Future direct route (selection superseded)** — the direct weaving→client route
   for Manta is deferred to PHASE-MANTA-B and its backend persistence mechanism is
   **unresolved**. The earlier statement that `entregas.etapa = 'tecelagem_direto'`
   is the selected mechanism is **superseded** and must not be treated as a chosen
   solution (§9). PHASE-MANTA-B must first reconcile the existing expedition,
   delivery and progress mechanisms before selecting the minimum backend change; no
   new `entregas.etapa` value is assumed or canonized here. `cima` is not overloaded.

## 3. Database (`db/78_manta_product_identity_and_route_foundation.sql`)

Single forward-only, idempotent migration:

- `modelos.tipo_produto TEXT NOT NULL DEFAULT 'tapete'` + CHECK `('tapete','manta')`.
- CHECK `modelos_manta_largura_chk`: `tipo_produto <> 'manta' OR largura = 1.40`.
- Uniqueness replaced with `(nome, cor_1_id, cor_2_id, largura, tipo_produto)`.
- Deterministic, id-free, fail-closed informal-Manta backfill (§2.6).
- `pedido_itens_manta_largura_guard` trigger (BEFORE INSERT/UPDATE).
- `op_itens_route_homogeneity_guard` trigger (BEFORE INSERT/UPDATE) — no partial
  write, no UI dependence.
- `gerar_op_latex` / `gerar_op_latex_split` hardened to reject a Manta or
  non-homogeneous origin before reserving an OP number; all other db/33 behavior,
  signatures, grants, security mode, search_path, locking, events and generated
  rows preserved.

The PHASE-MANTA-A implementation order authorized no shared-development apply. A
subsequent order (`PHASE-MANTA-A-SHARED-DEV-APPLY-LIVE-VALIDATION-AND-CLOSEOUT-R1`)
authorized and applied db/78, db/79 and db/80 to shared development
`ucrjtfswnfdlxwtmxnoo`, then live-validated the result — see §9.

## 4. Application

- Model maintenance (`js/screens/cadastros.js`): explicit "Tipo de produto"
  selector; Manta fixes width to 1,40 m and locks it; invalid Manta width rejected
  before submit; DB remains authoritative; type preserved on edit; no name
  inference. Optional-column detection keeps the screen working before the migration
  is applied.
- Shared label contract (`js/op-display.js`, consumed via
  `js/screens/op-form-helpers.js::rotuloModelo`): `Manta · Arabesco · 1,40 m ·
  KRAFT/CRU` / `Tapete · Barcelona · 2,10 m · KRAFT/CRU`.
- Pedido create/edit (`js/screens/pedido-itens-edit.js`) and detail
  (`js/screens/pedido-detail-*.js`): product type shown explicitly; graceful
  `tipo_produto` augmentation; no independent type written to `pedido_itens`.
- OP creation (`js/screens/op-nova.js`, `js/screens/op-persistir.js`): a mixed
  Pedido requires an explicit product-type choice; only that type is included;
  homogeneity is guarded before OP-number consumption; the DB trigger is the
  ultimate authority. OP list (`js/screens/ops-list.js`) and detail show the OP's
  product type.
- Finishing surface (`js/screens/op-tecelagem-producao-admin.js`): a Manta OP offers
  no finishing action and is shown as `TECELAGEM-ONLY ROUTE — DIRECT DELIVERY NOT
  YET ACTIVE (PHASE-MANTA-B)`.

## 5. Tests

- `tests/manta-product-identity-schema.smoke.js` — static migration structure.
- `tests/manta-yarn-parity.test.js` — Manta 1.40 == Tapete 1.40 from the same row;
  no Manta yarn constant.
- `tests/manta-product-label.smoke.js` — shared label contract.
- `tests/manta-op-homogeneity.test.js` — writer rejects a mixed OP before numbering.
- `tests/manta-ui-surfaces.smoke.js` — Manta wiring on every affected surface.
- `tests/manta-product-identity.integration.sql` — disposable-cluster proof of the
  width, uniqueness, pedido-override and OP-homogeneity guards (external runner).
- `tests/manta-product-identity-invariant.mjs` — disposable-cluster invariant +
  distinct-session concurrency harness for the db/79 (§7) and db/80 (§8)
  corrections: full db/01..80 apply, db/78+db/79+db/80 idempotent re-apply with
  zero drift, the db/78 integration test, model immutability, real two-session
  route-homogeneity concurrency, deterministic ascending lock order, no deadlock,
  model-reference concurrency (OP/pedido first-reference vs model update, both
  directions; non-contention; no deadlock), finishing regression, and C5 emission
  regression; cluster destroyed with proof.
- `tests/ordem-compra-c3d-deploy.smoke.js` — migration terminal advanced 77 → 78
  (db/78), then 78 → 79 (db/79 correction, §7), then 79 → 80 (db/80 correction, §8).

## 6. Deferred to PHASE-MANTA-B (not authorized here)

Direct weaving→client delivery for Manta: a generalized expedition source,
`cliente_pedido_summary` / chain-state weaving-only branch, and Manta-only / mixed
Pedido completion. The backend persistence mechanism is **unresolved**; the
previously assumed `entregas.etapa = 'tecelagem_direto'` is **superseded** (§9) and
is not a selected solution. None implemented in PHASE-MANTA-A.

## 7. Forward correction — db/79 (route-invariant hardening)

`db/79_manta_product_identity_invariant_correction.sql` (order
`PHASE-MANTA-A-DB-VALIDATION-AND-INVARIANT-CORRECTION-R1`) forward-corrects two
invariant defects in db/78 without editing the published, byte-stable db/78
(forward-only migration policy; `PEDIDO_OP_SCHEMA_CONTRACT.md` §12):

1. **Concurrency-safe route homogeneity.** db/78's `op_itens_route_homogeneity_guard`
   inspected the OP's existing items without serializing concurrent inserts, so two
   concurrent *first* inserts of different product types into the same empty OP could
   each observe an empty OP and both commit — a committed mixed-route OP. The
   corrected guard serializes writers on the owning `public.ops` row(s) with
   `FOR UPDATE` **before** inspecting `op_itens`, locking every affected OP identity
   (destination, plus the source when an UPDATE moves an item) in deterministic
   ascending id order. Under the canonical READ COMMITTED isolation the second writer
   blocks, then re-reads the now-committed rows under a fresh statement snapshot and
   is rejected. Different OPs never block each other; opposing moves cannot deadlock;
   it stays a BEFORE trigger, so an aborted statement leaves no partial write. No
   denormalized product-type column is introduced (§2.1 preserved).

2. **Model route/composition immutability once used.** Because product type and
   composition are derived live through `modelos`, an in-place change to
   `modelos.tipo_produto` or `modelos.largura` would silently rewrite the product
   identity of every historical Pedido/OP that already references the model. The new
   `modelos_route_identity_immutability_guard` (BEFORE UPDATE) rejects a change to
   `tipo_produto` or `largura` once the model is referenced by `pedido_itens` or
   `op_itens` (direct SQL and stale UI alike). An unreferenced model may still change
   them, subject to the db/78 CHECK constraints; non-routing metadata (`nome`) stays
   editable. The preferred operational path for a post-use type/width change is a new
   model SKU. The db/78 informal-Manta backfill is unaffected (it runs before this
   guard exists and, on re-apply, no longer matches its source row).

Verified on a disposable PostgreSQL 18.4 cluster (`tests/manta-product-identity-invariant.mjs`):
full db/01..79 apply; db/78+db/79 idempotent re-apply with zero schema/grant/trigger/
function drift; the db/78 integration test; the informal-Manta backfill
(`MANTA ARABESCO` → `ARABESCO`/manta, ordinary models stay tapete); model
immutability; real two-session concurrency (exactly one commit + one controlled
rejection with the OP left homogeneous, same-type inserts both succeed, different OPs
independent, deterministic ascending lock order in both move directions, no deadlock);
finishing-RPC regression (Manta origin rejected, Tapete origin still finishes); and
the C5 emission integration test — cluster then destroyed with proof.

Migration terminal advanced 78 → 79 (`tests/ordem-compra-c3d-deploy.smoke.js`). No
shared-development apply is authorized: db/78 and db/79 are applied only to disposable
local clusters.

## 8. Forward correction — db/80 (model-reference concurrency)

`db/80_manta_model_reference_concurrency_correction.sql` (order
`PHASE-MANTA-A-MODEL-REFERENCE-CONCURRENCY-CORRECTION-R1`) closes the last
concurrency gap left by db/79, again without editing db/78 or db/79. db/79
serializes competing writes to one OP and makes a model's routing identity immutable
once referenced, but because product identity is still derived live through
`modelo_id`, the item-side guards read `modelos.tipo_produto`/`largura` **without
locking the model row**. So the FIRST Pedido/OP reference to a model did not
serialize against a concurrent change of that model's `tipo_produto`/`largura`: an
item writer could validate against one committed identity while a racing model
UPDATE (whose immutability guard did not yet see the still-uncommitted reference)
committed a different one — a committed route/identity inconsistency.

The correction makes both item-side guards
(`op_itens_route_homogeneity_guard_fn`, `pedido_itens_manta_largura_guard_fn`) lock
every affected `modelos` row with **FOR SHARE**, in ascending `modelo_id` order,
BEFORE reading the type/width — for an INSERT the new model, for an UPDATE the OLD
and NEW models when distinct. FOR SHARE conflicts with the row lock a `modelos`
UPDATE takes (a BEFORE UPDATE row trigger locks its target row FOR UPDATE-equivalently,
via `GetTupleForTrigger`, before the immutability guard fires), so:

- if the reference commits first, the model UPDATE waits and its immutability guard
  then observes the committed reference and rejects; and
- if the model UPDATE commits first, the item writer waits and validates against the
  new committed identity (homogeneity, or the Manta width override).

No transaction validates against one identity and commits against another. FOR SHARE
is compatible with FOR SHARE, so concurrent references to the same or different models
never block each other. The `modelos_route_identity_immutability_guard` is preserved
unchanged; no product-type column is denormalized onto `pedido_itens`, `op_itens` or
`ops`.

**Global deterministic lock order** (no db/80 path takes these in reverse; verified
compatible with db/79 movement locks and the db/31/db/32 finishing functions, which
lock the owning `ops` row before that op's `op_itens` and take no `modelos` lock):
1. affected `ops` rows, ascending `op_id` (FOR UPDATE, db/79);
2. affected `modelos` rows, ascending `modelo_id` (FOR SHARE, db/80);
3. inspect `op_itens`/`pedido_itens` and continue.

Verified on a disposable PostgreSQL 18.4 cluster (`tests/manta-product-identity-invariant.mjs`,
Part G): full db/01..80 apply; db/78+db/79+db/80 idempotent re-apply with zero drift;
real distinct-session proofs, each with `pg_blocking_pids` blocking evidence — (A) OP
first-reference wins → racing model→Manta rejected by immutability, OP homogeneous;
(B) model update wins → the op_item rejected by homogeneity against the committed
Manta identity; (C) Pedido first-reference wins → racing model change rejected,
identity stable; (D) model update first → invalid Manta width override rejected
against the new committed type; (E) non-contention (same-model references do not
serialize; `nome` and same-value routing updates permitted); (F) opposing item
`modelo_id` moves lock model rows ascending, both commit, no deadlock, both route and
identity invariants hold — plus the db/78/db/79 regressions, finishing regression and
C5 emission regression; cluster then destroyed with proof.

Migration terminal advanced 79 → 80 (`tests/ordem-compra-c3d-deploy.smoke.js`). That
implementation order authorized no shared-development apply: at the time, db/78, db/79
and db/80 were applied only to disposable local clusters. The shared-development apply
described in §9 was authorized later, by a separate order.

## 9. Shared-development application, live validation and closeout (PHASE-MANTA-A)

Order `PHASE-MANTA-A-SHARED-DEV-APPLY-LIVE-VALIDATION-AND-CLOSEOUT-R1` authorized the
first (and only) shared-development apply of this phase. db/78, db/79 and db/80 were
applied once, in order, to shared development `ucrjtfswnfdlxwtmxnoo` (PostgreSQL 17.6,
role `postgres`) through the dedicated project-scoped migration mechanism. Production
(`gqmpsxkxynrjvidfmojk`) and the forbidden project (`bhgifjrfagkzubpyqpew`) were not
touched; no Vercel deployment occurred.

**Migration history (recorded once, in order).**
- `78_manta_product_identity_and_route_foundation` — version `20260724124419`.
- `79_manta_product_identity_invariant_correction` — version `20260724124522`.
- `80_manta_model_reference_concurrency_correction` — version `20260724124616`.

Terminal advanced 77 → 80 on shared development.

**Live schema/backfill evidence (read-only).**
- `modelos.tipo_produto` is `NOT NULL DEFAULT 'tapete'`; CHECK `('tapete','manta')`;
  CHECK `tipo_produto <> 'manta' OR largura = 1.40`; uniqueness
  `(nome, cor_1_id, cor_2_id, largura, tipo_produto)` (the base 4-column key dropped).
- The single informal row (`id=13`, `MANTA ARABESCO`, `1.40`) became `nome='ARABESCO'`,
  `tipo_produto='manta'`, `largura=1.40`; the 11 other models are `tapete`; no
  `MANTA ARABESCO` source row remains.
- The three guards are live with the db/80 bodies: the `op_itens` route-homogeneity
  guard locks the OP row `FOR UPDATE` then the model row `FOR SHARE` (ascending id)
  before inspecting; the `pedido_itens` Manta-width guard locks the model row
  `FOR SHARE`; the `modelos` route-identity immutability guard (BEFORE UPDATE) is
  present. `gerar_op_latex` and `gerar_op_latex_split` reject a Manta / non-homogeneous
  origin. Signatures, `SECURITY DEFINER`, `search_path=public` and grants match the
  migrations.

**Zero-business-data evidence.** The entire operational corpus (pedidos, ops, op_itens,
entregas, expedições, ordem_compra*, lotes and every related event table) remained at
zero rows; `parametros_largura` (including the canonical 1.40 row) and the purchase-order
cutover/config state were unmodified. No Pedido, OP, purchase order, delivery, expedition
or business event was created. No persistent fixture was planted.

**Live UI evidence.** The accepted repository checkpoint was run locally against shared
development (`js/config.js` resolves localhost to the STAGING profile
`https://ucrjtfswnfdlxwtmxnoo.supabase.co`; environment banner "AMBIENTE STAGING"). Through
the app's own client and `js/op-display.js` helpers on live shared-development data, the
migrated model renders `Manta · ARABESCO · 1,40 m · PRETO/CRU` (`productTypeLabel` =
`Manta`); a Tapete row renders `Tapete · … · 2,10 m · …`; a Tapete also named "Arabesco"
(`id=5`) stays `Tapete`, confirming the type is derived, never name-inferred. Model
maintenance (`cadastros.js`) shows the product-type badge and, in the model form, locks
Manta width to 1,40 m and rejects any other value; the Pedido item picker
(`pedido-itens-edit.js`) shows each choice's type. Authenticated interactive click-through
was not driven (login requires a password, which was not entered; the local write-guard is
inactive against STAGING, so no screen that could write was navigated); the mixed-Pedido
operational UI is deferred to the first controlled real flow. No operational record was
written.

**Superseded future-route ruling (binding).** The prior statement selecting
`entregas.etapa = 'tecelagem_direto'` is superseded. The binding current product routes are:
- **Tapete**: Insumos → Tecelagem → Acabamento → Expedição → Entrega.
- **Manta**: Insumos → Tecelagem → Expedição → Entrega.

UI: the Manta stepper omits Acabamento entirely (never shown as pending or disabled);
Tapete retains the Acabamento step; a mixed Pedido represents its two applicable routes
separately (preferably by homogeneous OP or route-specific progress); a single fixed linear
stepper must not falsely represent a mixed Pedido. The dynamic Manta stepper is a
PHASE-MANTA-B UI item and is not implemented at this checkpoint. Backend: Manta never enters
finishing (DB-enforced here); the exact weaving→expedition persistence mechanism is **not
selected**, no new `entregas.etapa` value is canonized, and PHASE-MANTA-B must begin with a
bounded reconciliation of the existing expedition, delivery and progress mechanisms before
choosing the minimum backend change.

**Status.** PHASE-MANTA-A is CLOSED / ACCEPTED / APPLIED TO SHARED DEVELOPMENT / LIVE
VALIDATED. Business-flow recreation remains paused. The next authorizable action is
`PHASE-MANTA-B-DIRECT-ROUTE-RECONCILIATION-R1`; PHASE-MANTA-B implementation remains
unauthorized and no phase chains automatically.
