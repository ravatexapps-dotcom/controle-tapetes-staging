# Manta Product Variant — PHASE-MANTA-A Phase Contract

STATUS: IMPLEMENTED / LOCALLY VERIFIED / AWAITING ARCHITECT REVIEW

Order: `PHASE-MANTA-A-PRODUCT-IDENTITY-AND-ROUTE-FOUNDATION-R1`.
Diagnosis: `PRODUCT-VARIANT-MANTA-WEAVING-ONLY-DIAGNOSIS-R1`.

## 1. Objective and boundary

PHASE-MANTA-A establishes the canonical **product identity** for a second product
variation, **Manta**, and the **route-homogeneity** invariants required before (and
independently of) any direct-delivery route. It does **not** make Manta
operationally deliverable — the weaving→client direct route is deferred to
**PHASE-MANTA-B** (`entregas.etapa = 'tecelagem_direto'`, not implemented here).

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
7. **Future direct route** — `entregas.etapa = 'tecelagem_direto'` is the selected
   PHASE-MANTA-B mechanism; NOT implemented in PHASE-MANTA-A; `cima` is not
   overloaded.

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

No shared-development apply is authorized by this phase. The migration is not
applied to `ucrjtfswnfdlxwtmxnoo`.

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
- `tests/ordem-compra-c3d-deploy.smoke.js` — migration terminal advanced 77 → 78.

## 6. Deferred to PHASE-MANTA-B (not authorized here)

Direct weaving→client delivery for Manta: `entregas.etapa = 'tecelagem_direto'`,
generalized expedition source, `cliente_pedido_summary` / chain-state weaving-only
branch, and Manta-only / mixed Pedido completion. None implemented in PHASE-MANTA-A.
