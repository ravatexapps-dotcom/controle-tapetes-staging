<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET
<!-- MATERIAL_PHASE_CONTRACT:END -->

# Clean-Slate Transactional Reset — Corrected Material Phase Contract

```text
PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET
STATUS: CONTRACT ACCEPTED / TOOLING IMPLEMENTED / REAL ARCHIVE GENERATED READ-ONLY / DISPOSABLE RESTORE DRILL PASSED / VALIDATION GATES CLOSED / READINESS ACCEPTED / DIRECTLY VERIFIED AT 62bdcc75c335e3881adb1af6350de801675aa788 / SHARED-DEVELOPMENT RESET AUTHORIZED AS THE NEXT SEPARATE GOVERNED DESTRUCTIVE ORDER / NOT EXECUTED
AUTHORED_BY: CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1 (read-only diagnosis + documentation-only authoring)
CORRECTED_BY: CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-CORRECTION-R1 (documentation-only, over the accepted CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1)
CONTRACT BASELINE CORRECTION: ACCEPTED ARCHITECT RULING — CLEAN-SLATE-TRANSACTIONAL-RESET-B6-ROW-BASELINE-FORWARD-CORRECTION-R1 (documentation-only): document_link_revision_ops corrected from 4 to 10 rows; 4 distinct OPs remain 55, 57, 61, 63
IMPLEMENTED_BY: CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2 (§21) — tooling + read-only real archive + disposable restore/reset drill; no shared-development mutation
HARDENED_BY: CLEAN-SLATE-TRANSACTIONAL-RESET-ARCHIVE-SAFETY-CORRECTION-R1 (§22) — trigger-handling ratified, 4 blocking archive-tooling gaps fixed, replacement archive generated
CORRECTED_BY_R1: CLEAN-SLATE-TRANSACTIONAL-RESET-FINAL-VALIDATION-GATES-CORRECTION-R1 (§23) — checkpoint f165302c1c542aa26e9ae78464d260c81eda6415 NOT ACCEPTED (mandatory spec-custody self-test failed); 2 blocking validation-gate defects fixed; archive-safety technical patch reviewed and RETAINED; authoritative archive 20260722T183846Z revalidated, not regenerated
CONTRACT_ACCEPTANCE: ACCEPTED / DIRECTLY VERIFIED AT 21fe32bc4b37773d93cabeac3e7e09aca9079037
ENTRY_CHECKPOINT: 9eeff7d5a97e25cf676d54afcd4510816a8648fb
DATABASE_DIAGNOSED: ucrjtfswnfdlxwtmxnoo (non-production shared development, PostgreSQL 17.6, terminal migration 20260722055832) — READ-ONLY
ACTIVE_PHASE: CLEAN-SLATE-TRANSACTIONAL-RESET
ACTIVE_PHASE_CONTRACT: docs/architecture/CLEAN_SLATE_TRANSACTIONAL_RESET_PHASE_CONTRACT.md
```

> **Role.** This was, at the R1/correction-pass point in time, a *corrected
> proposed* material phase contract authorizing **no** deletion, **no** database
> mutation, **no** archive creation, **no** reset-script implementation, **no**
> migration, **no** cutover, **no** activation, and **no** environment change.
> **Superseded for archive creation and reset-script implementation by R2 (§21,
> RATIFIED BY DIRECT SUPERVISOR REVIEW):** the tooling is now implemented, a real
> archive has been generated read-only, and the disposable restore/reset drill has
> passed. **Still authorizes no shared-development deletion, mutation, migration,
> cutover, activation, or environment change** — those remain a separate,
> unauthorized future order. Every reset-boundary decision that was previously
> optional, ambiguous, or `UNPROVEN` is now **binding** per the supervisor rulings
> in §1, grounded in the accepted evidence of
> `CLEAN-SLATE-DOCUMENT-HISTORY-AND-RESIDUAL-BOUNDARY-DIAGNOSIS-R1`. Normative
> product/technical semantics remain owned by
> `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`; current state remains owned by
> `PROJECT_STATE.md`. This contract creates **no** new requirement ID and changes
> **no** existing disposition.

---

## 1. Binding supervisor rulings

```text
CLEAN_SLATE_OPERATIONAL_REBUILD: APPROVED AS TARGET STRATEGY
CURRENT OPERATIONAL TRANSACTION CORPUS: DISPOSABLE AS LIVE BUSINESS DATA
REAL BUSINESS FLOWS: WILL BE RECREATED THROUGH THE NEW APPLICATION
RECREATION ORDER: 1 Pedido; 2 purchasing needs; 3 purchase orders; 4 OPs; 5 subsequent operational updates.
```

No current Pedido or OP is preserved because it may correspond to a genuine
business flow. The genuine flows will be recreated with **new canonical
identities**. These rulings are binding and supersede every prior "option",
"recommendation", "Boundary A vs Boundary A+B", or `UNPROVEN` framing in earlier
revisions of this contract.

### 1.1 Final purge scope (binding)

- **All current Pedidos — 16 of 16.**
- **All current OPs — 20 of 20.**
- **All current lotes — 25 of 25**, including the orphan lote ids `3, 4, 5, 6, 7, 8, 13`.
- **All OP supplier assignments — `public.op_fornecedores`, 16 rows.**
- **The complete yarn-purchasing transaction corpus:** `public.ordens_compra_fio`,
  `public.necessidade_compra_fio`, `public.ordem_compra`, `public.ordem_compra_item`,
  `public.ordem_compra_item_alocacao`, `public.ordem_compra_item_compat_fio`,
  `public.ordem_compra_recebimentos`, `public.ordem_compra_eventos`,
  `public.ordem_compra_fio_lancamentos`, `public.ordem_compra_fio_movimentos_estoque`,
  `public.ordem_compra_distribuicao_comandos`.

### 1.2 Document-history disposition (binding) — Option **D3**

**D3 — external metadata archive, then remove the synthetic document-history
fixture.** The only transaction-linked document in the entire database is proven
synthetic:

```text
G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT
```

It has no Google Drive object, no SHA-256, no fiscal metadata, no sender metadata,
no document event, no technical evidence, no decision, and no operational
descendant. Its Pedido (`#34`, `7fa51e02-e15b-4a1b-a0f3-8ca39ceee247`), its OPs
(`55, 57, 61, 63`), and its lotes (`33, 37`) are the matching synthetic fixtures
with zero operational descendants.

The future reset may remove **only** this synthetic fixture's rows: **10**
`public.document_link_revision_ops` rows (spanning the 6 op-bearing revisions of
8; 4 distinct linked OPs — `55, 57, 61, 63`), **8** `public.document_link_revisions`
rows, **1** `public.document_candidates` row, and its **0**
`document_events`/`document_technical_evidences`/`document_decisions`. Before
deletion, these rows and the linked synthetic Pedido/OP/lote metadata must be
exported into the reset archive (§8). **No archival Pedido or OP shell is
required.**

**Preserve the remaining documents front (binding):** the 39 unlinked
`public.document_candidates` rows, the 1 unlinked `public.document_events` row,
the 24 `public.document_scan_requests` rows, the 30 `public.document_scan_runs`
rows, and all unrelated document metadata, files, and history. **Broad deletion
of the documents front is prohibited.** The reset must target the exact synthetic
fixture identifier above — never a broad text pattern or partial token.

### 1.3 Inventory disposition (binding)

- **`public.saldo_fios` = `PRESERVE_OPERATIONAL_BASELINE`.** Preserve all five
  current rows and quantities (algodão cor 1 = 732.010 kg; cor 2 = 549.010 kg;
  cor 3 = 549.000 kg; poliéster PRETO = 427.500 kg; poliéster BRANCO = 427.500 kg).
  They represent physical yarn inventory predating the purchase-order refoundation
  (`db/67`) and were not created by the native receipt path (0 receipts). Recreating
  Pedidos and OPs must not erase physical stock.
- **`public.saldo_fios_op` = preserve current empty state.** Do not create,
  delete, reset, or seed rows.

### 1.4 Numbering disposition (binding)

- **`public.op_numeros` = `PRESERVE_CURRENT_HIGH_WATER_VALUES`** (latex
  `ultimo_numero = 18`, tecelagem `ultimo_numero = 41`). Do not restart numbering;
  do not reuse historical OP numbers; do not `ALTER SEQUENCE`/`setval` for OP
  numbering.

### 1.5 Empty auxiliary tables (binding)

`public.pedido_compra_fio_regime`, `public.op_latex_entregas`, `public.expedicoes`,
`public.expedicao_itens`, `public.expedicao_movimentos`,
`public.expedicao_movimento_itens`, `public.entregas`, `public.entrega_itens`, and
`public.saldo_fios_op` currently contain **zero rows** and require **no** deletion
statement merely to preserve their empty state; their schemas remain intact. **If
any of these tables becomes non-empty before execution, the future reset must HARD
STOP and require a new diagnosis.**

### 1.6 Master/reference data disposition (binding)

Preserve: `auth.users`, `public.usuarios`, `public.usuarios_eventos`,
`public.clientes`, `public.fornecedores`, `public.cores`, `public.modelos`,
`public.parametros_largura`, `public.precos_terceirizada`,
`public.ordem_compra_config`, `public.op_numeros`, `public.saldo_fios`, migration
history, backup infrastructure (`public.backup_runs`,
`public.backup_run_destinations`), and all other reference/catalog/configuration
tables not explicitly in the §7 purge manifest. **Master data must never be
inferred into the destructive scope.**

### 1.7 Cutover disposition (binding) — Option **C**

After the reset, `public.ordem_compra_cutover` must remain `status = legacy_active`,
`read_authority = flat`, `reconciliation_status = not_started`, with all
snapshot/import/final-ACL/activation/PONR markers NULL. The reset does **not**
execute fence, snapshot, import, reconciliation, read switch, final ACL closure, or
canonical activation. **`REAL_CUTOVER` remains NOT AUTHORIZED.** The old `db/75`
corpus constants (source snapshot count 51; import 39 headers / 44 ledger lines /
20,221.280 kg / 405.980 kg excess / 0 movements) become **superseded only after the
clean-slate reset physically completes**; any later `REAL_CUTOVER` requires a
separately governed re-baselined terminal migration or equivalent canonical-cutover
redesign. Options A and B (evaluated in the prior revision) are rejected and closed;
Option C is the binding selection.

### 1.8 `PHASE-C5B` disposition (binding)

`PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT AUTHORIZED`. It is **not
required** for the reset because `public.ordem_compra_config.exige_aceite = FALSE`
(structurally frozen, no client write path). Recommended sequence: (1) correct and
accept this reset contract; (2) execute the clean-slate reset under a separate
order; (3) recreate the genuine flows; (4) consider `PHASE-C5B` only if the
business later enables `exige_aceite = TRUE`.

---

## 2. Scope

**In scope (documentation only, this correction):** binding the reset boundary to
one exact target and removing every optional/ambiguous/`UNPROVEN` decision.

**Out of scope (not performed, not authorized):** any deletion or DB mutation;
archive creation; reset-script implementation; migration authoring; cutover,
activation, or ACL closure; `REAL_CUTOVER`; `PHASE-C5B` design/implementation;
master-data disposition beyond "preserve"; staging, deployment, production,
branch, or any push beyond this pass's single documentation-only commit and its
one fast-forward push to `staging/dev`.

---

## 3. Preserved master-data boundary

Preserved by default (each FK-referenced by the transactional layers; the
application depends on them as reference/catalog data). Exact live counts:

| Preserved table | Rows | Role |
|---|---|---|
| `auth.users` | (Supabase auth) | authentication identities; every actor FK targets it (`SET NULL`/`RESTRICT`) |
| `public.usuarios` | 10 | application users/roles |
| `public.usuarios_eventos` | 9 | user-administration audit |
| `public.clientes` | 6 | customers |
| `public.fornecedores` | 6 | suppliers |
| `public.cores` | 6 | yarn/color catalog |
| `public.modelos` | 12 | rug models |
| `public.parametros_largura` | 2 | per-width yarn coefficients |
| `public.precos_terceirizada` | 0 | supplier pricing reference |
| `public.ordem_compra_config` | 1 | emission-policy singleton (`exige_aceite=FALSE`) — preserve as-is |
| `public.op_numeros` | 2 | OP numbering high-water — preserve, no restart (§1.4) |
| `public.saldo_fios` | 5 | physical yarn inventory baseline — preserve (§1.3) |
| `public.saldo_fios_op` | 0 | per-OP leftover yarn — preserve empty state (§1.3) |
| `public.backup_runs` / `public.backup_run_destinations` | 2 / 4 | backup infrastructure |
| documents front (unlinked) | 39 candidates / 1 event / 24 scan-req / 30 scan-run | separate front — preserve (§1.2) |
| `db/*` migration history | 27 rows (`…65`→`…77`) | immutable, never reset |
| `public.ordem_compra_cutover` (+ snapshot/baseline) | 1 / 0 / 0 | cutover singleton — preserve `legacy_active` (§1.7) |

---

## 4. Exact operational-table inventory (read-only baseline, terminal migration `20260722055832`)

Classification is now final (no `UNPROVEN` remains): `PRESERVE_MASTER_DATA`,
`PURGE_OPERATIONAL_SOURCE`, `PURGE_OPERATIONAL_DERIVED`, `RESET_CUTOVER_METADATA`
(none require a delete — the singleton is preserved as-is), `PRESERVE_OPERATIONAL_BASELINE`,
or `PRESERVE_EMPTY_STATE`.

### 4.1 Yarn-purchasing operational corpus — full purge (Boundary A)

| Table | Rows | Class | Reason |
|---|---|---|---|
| `ordens_compra_fio` | 64 | PURGE_OPERATIONAL_SOURCE | legacy flat purchase orders (51 mapped + 13 unmapped ids 153–165) |
| `necessidade_compra_fio` | 64 | PURGE_OPERATIONAL_SOURCE | Layer-1 needs (all legacy-origin) |
| `ordem_compra` | 51 | PURGE_OPERATIONAL_DERIVED | Layer-2 native headers |
| `ordem_compra_item` | 51 | PURGE_OPERATIONAL_DERIVED | Layer-3 items |
| `ordem_compra_item_alocacao` | 51 | PURGE_OPERATIONAL_DERIVED | Layer-4 allocations |
| `ordem_compra_item_compat_fio` | 51 | PURGE_OPERATIONAL_DERIVED | legacy↔native compat bridge (superseded) |
| `ordem_compra_recebimentos` | 0 | PURGE_OPERATIONAL_DERIVED | receipt command headers |
| `ordem_compra_eventos` | 0 | PURGE_OPERATIONAL_DERIVED | transition audit |
| `ordem_compra_fio_lancamentos` | 0 | PURGE_OPERATIONAL_DERIVED | receipt ledger (append-only) |
| `ordem_compra_fio_movimentos_estoque` | 0 | PURGE_OPERATIONAL_DERIVED | inventory movements |
| `ordem_compra_distribuicao_comandos` | 0 | PURGE_OPERATIONAL_DERIVED | allocation idempotency journal |

### 4.2 Commercial/production corpus — full purge (Boundary B)

| Table | Rows | Class | Reason |
|---|---|---|---|
| `pedidos` | 16 | PURGE_OPERATIONAL_SOURCE | all 16 disposable; recreated fresh |
| `pedido_itens` | 18 | PURGE_OPERATIONAL_SOURCE | pedido lines |
| `pedido_eventos` / `pedido_cliente_eventos` / `pedido_parciais` / `pedido_parcial_itens` / `pedido_compra_fio_regime` | 0 / 0 / 0 / 0 / 0 | PURGE_OPERATIONAL_SOURCE | empty pedido children |
| `ops` | 20 | PURGE_OPERATIONAL_SOURCE | all 20 disposable (incl. synthetic 55/57/61/63) |
| `op_itens` | 27 | PURGE_OPERATIONAL_SOURCE | OP lines |
| `op_fornecedores` | 16 | PURGE_OPERATIONAL_SOURCE | OP supplier assignments (0 orphans; all belong to current OPs) |
| `op_eventos` | 4 | PURGE_OPERATIONAL_SOURCE | OP status audit |
| `op_latex_entregas` | 0 | PRESERVE_EMPTY_STATE | empty (no delete needed) |
| `lotes` | 25 | PURGE_OPERATIONAL_SOURCE | all 25 disposable (15 Pedido-linked, 3 OP-only, 7 orphan legacy) |

### 4.3 Synthetic document-history fixture — targeted removal (§1.2)

| Table | Rows | Class | Reason |
|---|---|---|---|
| `document_link_revision_ops` (B6 fixture) | 10 | PURGE (synthetic) | OP-link rows for the B6-VERIFY fixture, spanning its 6 op-bearing revisions (4 distinct OPs 55/57/61/63) |
| `document_link_revisions` (B6 fixture) | 8 | PURGE (synthetic) | 8 revisions (v1–v8; v8 active) of the B6-VERIFY document |
| `document_candidates` (B6 fixture) | 1 | PURGE (synthetic) | the single B6-VERIFY candidate row |
| `document_events`/`document_technical_evidences`/`document_decisions` (B6) | 0 / 0 / 0 | PURGE (synthetic, empty) | none exist for this document |

### 4.4 Preserved inventory / cutover / documents front

| Table | Rows | Class |
|---|---|---|
| `saldo_fios` | 5 | PRESERVE_OPERATIONAL_BASELINE |
| `saldo_fios_op` | 0 | PRESERVE_EMPTY_STATE |
| `op_numeros` | 2 | PRESERVE_MASTER_OR_REFERENCE (no restart) |
| `ordem_compra_cutover` (+ snapshot/baseline) | 1 / 0 / 0 | preserve `legacy_active`/`flat`/`not_started` (§1.7) |
| documents front (unlinked): `document_candidates` 39, `document_events` 1, `document_scan_requests` 24, `document_scan_runs` 30 | — | PRESERVE (separate front, §1.2) |
| `expedicoes`/`expedicao_itens`/`expedicao_movimentos`/`expedicao_movimento_itens`/`entregas`/`entrega_itens` | 0 each | PRESERVE_EMPTY_STATE |

---

## 5. Row-count baseline (exact, read-only, `ucrjtfswnfdlxwtmxnoo`)

```text
-- Boundary A (yarn-purchasing corpus)
ordem_compra_fio_movimentos_estoque 0   ordem_compra_fio_lancamentos 0   ordem_compra_recebimentos 0
ordem_compra_eventos 0                   ordem_compra_distribuicao_comandos 0
ordem_compra_item_compat_fio 51          ordem_compra_item_alocacao 51    ordem_compra_item 51
necessidade_compra_fio 64                ordem_compra 51                  ordens_compra_fio 64
-- Synthetic document fixture (id G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT)
document_technical_evidences 0  document_decisions 0  document_link_revision_ops 10
document_link_revisions 8       document_events 0     document_candidates 1  (4 distinct linked OPs: 55, 57, 61, 63)
-- Boundary B (commercial/production corpus)
op_itens 27  op_fornecedores 16  op_eventos 4  pedido_itens 18
pedido_eventos 0  pedido_cliente_eventos 0  pedido_parcial_itens 0  pedido_parciais 0
pedido_compra_fio_regime 0  op_latex_entregas 0  ops 20  pedidos 16  lotes 25
-- Preserved (must be unchanged pre/post)
saldo_fios 5  saldo_fios_op 0  op_numeros 2  ordem_compra_cutover 1 (legacy_active/flat/not_started, markers NULL)
documents front unlinked: document_candidates 39  document_events 1  document_scan_requests 24  document_scan_runs 30
clientes 6  fornecedores 6  cores 6  modelos 12  usuarios 10  parametros_largura 2  ordem_compra_config 1
```

The yarn-purchasing corpus carries **zero** productive receipt/stock/audit
consequence; the cutover has never been exercised (no PONR to unwind).

---

## 6. Exact target Pedido / OP / lote identities

- **16 Pedidos:** `e888f2b5-49a5-4d76-ab12-2421f86fa1f4`(#1),
  `7cc6a074-c163-4926-829a-afaf23835da7`(#33),
  `7fa51e02-e15b-4a1b-a0f3-8ca39ceee247`(#34, B6-VERIFY),
  `5fdb4d9a-961a-4b6a-b964-117b99cb3ee9`(#46),
  `be2edf28-a2d8-4883-a036-ef494300a69a`(#47),
  `fe6a22dc-5304-4628-93a1-70c8c78823f1`(#48),
  `85095adf-ed97-46f6-b250-97fb6e2fe1e6`(#49),
  `35c5bcfd-2ed8-4ed7-a116-3b5faf6ebcbf`(#50),
  `b5cbf9e1-2dfb-432f-9e6a-62c631eee6ce`(#51),
  `60ff0642-b477-44cc-a7ef-aa2008faf80b`(#52),
  `c0331a65-a2e4-4d60-aa61-d95d4f5a87e6`(#53),
  `9d71d295-6032-480f-9659-f2d1defe9a9b`(#54),
  `478825cb-5ee9-4ec8-bf6c-94f604ffb29a`(#55),
  `b06df8ce-e5a7-4bf0-b3ac-80d84aaf4333`(#56),
  `c801a798-b508-4ede-a7ce-27053dc15a24`(#57),
  `5f0cbaef-3525-440c-96dd-192d224f3f8d`(#58).
- **20 OPs:** `1, 2, 53, 55, 57, 61, 63, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99`
  (OPs `55, 57, 61, 63` are the B6-VERIFY fixtures).
- **25 lotes:** `1, 2, 3, 4, 5, 6, 7, 8, 13, 31, 33, 37, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68`
  (orphan legacy `3, 4, 5, 6, 7, 8, 13`; B6-VERIFY `33, 37`).

---

## 7. Final exact reset manifest (future deletion — NOT executed)

The reset runs as **one serialized transaction**, `DELETE` only (never
`TRUNCATE`), under `legacy_active` (fence pass-through), children before parents.
CASCADE edges make some deletes redundant; each is issued explicitly for
auditability.

### 7.1 Boundary A — yarn-purchasing corpus

```text
1  ordem_compra_fio_movimentos_estoque   -> 0
2  ordem_compra_fio_lancamentos          -> 0
3  ordem_compra_recebimentos             -> 0
4  ordem_compra_eventos                  -> 0
5  ordem_compra_distribuicao_comandos    -> 0
6  ordem_compra_item_compat_fio          -> 51   (NO ACTION to item & ordens_compra_fio: precede both)
7  ordem_compra_item_alocacao            -> 51   (RESTRICT to necessidade: precede it)
8  ordem_compra_item                     -> 51
9  necessidade_compra_fio                -> 64   (NO ACTION from legado_origem to ordens_compra_fio: precede it)
10 ordem_compra                          -> 51
11 ordens_compra_fio                     -> 64
Expected affected rows: 0, 0, 0, 0, 0, 51, 51, 51, 64, 51, 64
```

### 7.2 Synthetic document fixture — id `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT`

```text
1  document_technical_evidences  WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT'  -> 0
2  document_decisions            WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT'  -> 0
3  document_link_revision_ops    WHERE revision_id IN (the 8 B6 fixture revision ids)                          -> 10 (4 distinct OPs 55/57/61/63; RESTRICT to revisions & ops: precede both link_revisions and OP delete)
4  document_link_revisions       WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT'  -> 8  (RESTRICT to pedidos & candidate: precede pedidos delete and candidate delete)
5  document_events               WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT'  -> 0
6  document_candidates           WHERE document_id = 'G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236-DOCUMENT'  -> 1
Expected affected rows: 0, 0, 10, 8, 0, 1
```

The reset must use the exact fixture identifier above — never a broad text
pattern or partial token. The remaining documents front is untouched.

### 7.3 Boundary B — Pedido/OP/lote corpus

```text
1  op_itens                    -> 27
2  op_fornecedores             -> 16
3  op_eventos                  -> 4
4  pedido_itens                -> 18
5  pedido_eventos              -> 0
6  pedido_cliente_eventos      -> 0
7  pedido_parcial_itens        -> 0
8  pedido_parciais             -> 0
9  pedido_compra_fio_regime    -> 0
10 op_latex_entregas           -> 0
11 ops                         -> 20   (needs/alloc/ocf gone via 7.1; doc revision-ops gone via 7.2; lotes.op_id SET NULL)
12 pedidos                     -> 16   (itens/needs/oc gone; doc link-revisions gone via 7.2; document_candidates/events pedido_id SET NULL; lotes.pedido_id SET NULL)
13 lotes                       -> 25   (ops.lote_id/pedidos already gone; lotes.cliente_id RESTRICT -> clientes preserved)
Expected affected rows: 27, 16, 4, 18, 0, 0, 0, 0, 0, 0, 20, 16, 25
```

Every current Pedido, OP, and lote is in scope. No ambiguous phrasing ("related
rows", "applicable rows", "current operational data", "etc.") is used or
permitted.

### 7.4 Post-delete invariants

Boundary A + synthetic fixture + Boundary B tables all `count(*) = 0`;
`saldo_fios` unchanged (5 rows, same quantities); `saldo_fios_op` empty;
`op_numeros` unchanged (latex 18 / tecelagem 41); `ordem_compra_cutover` unchanged
(`legacy_active`/`flat`/`not_started`, markers NULL); documents front minus the B6
fixture = 39 candidates / 1 event / 24 scan-req / 30 scan-run intact; all
master/reference counts unchanged.

---

## 8. Archive and verified-restore requirement (mandatory before any destructive execution)

A backup file existing on disk is **not** sufficient. The future execution order
must require all of the following.

### 8.1 Archive package

Before the first `DELETE`: export every purged table (§7.1/§7.2/§7.3), including
the synthetic document fixture and the exact Pedido/OP/lote rows, in deterministic
order; record per-table row counts; compute a per-table SHA-256 over a
deterministic canonical serialization; record a total archive checksum; record the
export timestamp, database identity (`ucrjtfswnfdlxwtmxnoo`, `current_database`,
`server_version`, terminal migration `20260722055832`), the full
`ordem_compra_cutover` singleton row, the preserved-master counts, the exact
`saldo_fios` values, and the exact `op_numeros` values; exclude credentials and
unnecessary PII (actor UUIDs may be retained as opaque identifiers; no
`auth.users` PII is exported); store the archive **outside the repository**.

### 8.2 Restore runbook

The future implementation must include an exact restore procedure specifying:
archive format; deserialization rules; child/parent reinsertion order (parents
before children — the reverse of §7); handling of explicit primary keys;
handling of identity/`BIGSERIAL` sequences; handling of actor UUIDs; handling of
immutable/append-only triggers (`trg_lancamento_append_only_guard`,
`trg_regime_immutable_guard`); handling of `RESTRICT` and `NO ACTION` foreign
keys; preservation of original timestamps; restoration of the synthetic document
fixture (candidate → link_revisions → revision_ops); restoration of Pedidos, OPs,
lotes, needs, purchase orders, items, allocations, and compat mappings; post-restore
sequence reconciliation that **never decreases any sequence below its existing
high-water mark** (especially `op_numeros` and every `*_id_seq`); verification of
per-table counts; verification of per-table SHA-256-equivalent canonical
serialization; and verification that the cutover singleton remains unchanged.

### 8.3 Mandatory disposable restore drill (HARD STOP gate)

Before destructive execution against `ucrjtfswnfdlxwtmxnoo`: (1) bootstrap a
disposable environment from the accepted schema/migration chain; (2) load the
generated archive using the restore runbook; (3) prove every archived row can be
restored; (4) prove every per-table count matches; (5) prove every deterministic
checksum matches; (6) prove all foreign keys and constraints are valid; (7) prove
preserved master/reference rows remain untouched; (8) prove the restored state can
be deleted again by the exact reset operation; (9) destroy the disposable
environment. **A failed or incomplete restore drill is a HARD STOP.** The future
executor **may not** waive this gate.

---

## 9. Future mutation mechanism (ratified)

**One-time governed administrative transaction.** The future reset must run exactly
once; target only `ucrjtfswnfdlxwtmxnoo`; use one serialized transaction; use
`DELETE` (not `TRUNCATE`); execute under `legacy_active`; verify exact pre-counts
(§5); verify exact post-zero-state (§7.4); preserve master data, `saldo_fios`,
`op_numeros`, and the cutover state; and roll back on any mismatch.

It must **not** be: a `db/NN` migration; a Supabase dashboard manual deletion; an
application RPC; a writer executed through the normal UI; or anything replayable
automatically in another environment. The governed SQL/runbook may be
repository-tracked under a separately authorized implementation order; **no such
script is authorized by this correction.** Migrations `db/01`–`db/77` are
immutable and are not edited.

---

## 10. Future proposed implementation manifest (IMPLEMENTED by R2 — see §21)

Recommended future files (a different path is permitted only if the repository's
established script/test organization requires it, but must still produce one
explicit export tool, reset operation, restore operation, verification tool, and
disposable-environment test):

- `scripts/reset/clean-slate-transactional-export.mjs` — archive export + checksums (§8.1)
- `scripts/reset/clean-slate-transactional-reset.sql` — the one-time governed DELETE transaction (§7, §9)
- `scripts/reset/clean-slate-transactional-restore.sql` — restore operation (§8.2)
- `scripts/reset/clean-slate-transactional-verify.mjs` — pre/post + restore-drill verification (§8.3, §16)
- `tests/clean-slate-transactional-reset.smoke.mjs` — disposable-environment reset+restore drill

No product application file is expected. No `db/NN` migration is expected.

---

## 11. Point of no return (PONR)

For this reset the PONR is the **commit of the single reset transaction** —
recoverable thereafter only from the §8 archive via the verified restore runbook.
It is unrelated to `OC-CUTOVER-PONR-001` (`§R.29.6`), which is not crossed (Option
C keeps `legacy_active`, never sets `productive_receipt_started_at`).

---

## 12. Hard stops

The future execution must hard-stop (abort, no mutation) if any of:

- the selected project is not exactly `ucrjtfswnfdlxwtmxnoo`, or is production, or is the legacy project;
- `ordem_compra_cutover.status` ≠ `legacy_active`, `read_authority` ≠ `flat`, or any snapshot/import/PONR/ACL/activation marker is non-NULL;
- any §5 pre-count does not match (corpus drift);
- the §8.1 archive (export + per-table checksum + identity fingerprint) is not proven present before the first `DELETE`;
- the §8.3 disposable restore drill has not passed completely;
- any of the §1.5 empty auxiliary tables is non-empty at execution time;
- any master-data / `saldo_fios` / `op_numeros` / cutover count or value changes;
- the reset is proposed as a `db/NN` migration or executed via the dashboard/RPC/UI;
- a broad document-front deletion (beyond the exact B6 fixture id) is attempted;
- a writer RPC or `TRUNCATE` is used in place of the specified `DELETE` order.

---

## 13. Validation matrix (future execution)

| Gate | Check | When |
|---|---|---|
| Identity | project `ucrjtfswnfdlxwtmxnoo`, `server_version`, `current_database`, terminal migration `20260722055832` | entry |
| Pre-state | cutover `legacy_active`/`flat`/`not_started`, markers NULL | entry |
| Baseline | every §5 count matches exactly | entry |
| Empty-aux guard | §1.5 tables still empty | entry |
| Archive | §8.1 export + per-table checksum + identity fingerprint present | entry (before first DELETE) |
| Restore drill | §8.3 drill passed (restore + counts + checksums + FK validity + re-delete) | entry (before first DELETE) |
| Order | §7.1 → §7.2 → §7.3 deletes succeed in one transaction | execution |
| Zero-state | every purged table `count(*) = 0` | exit |
| Preserve invariance | `saldo_fios`(5)/`op_numeros`(2)/master/documents-front-39 unchanged | exit |
| Cutover invariance | `ordem_compra_cutover` unchanged | exit |
| No PONR | `productive_receipt_started_at` still NULL | exit |

---

## 14. Evidence packet (future execution)

Entry identity proof; the archive manifest (per-table count + checksum + location,
outside the repo); the passed restore-drill report; the pre-count baseline vs §5;
the single-transaction DELETE log in §7 order; the exit zero-state proof; preserve
invariance (`saldo_fios`, `op_numeros`, master, documents-front-39);
cutover-singleton invariance; the proven-absent PONR; and a statement that no
migration, no dashboard action, no RPC/UI writer, no `TRUNCATE`, and no broad
document-front deletion was used.

---

## 15. `PHASE-C5B` boundary and sequencing

Per §1.8: `PHASE-C5B-ACCEPTANCE-DECISION` remains `IDENTIFIED / NOT AUTHORIZED`,
is corpus-independent, is not required for the reset (`exige_aceite=FALSE`), and is
sequenced after the reset and real-flow recreation — only relevant if the business
later enables `exige_aceite=TRUE`.

---

## 16. Consequence for the former 13-row completeness gate

The former binding `REAL_CUTOVER` completeness gate for the 13 unmapped
`ordens_compra_fio` rows ids `153`–`165` is
`STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`, then
`SUPERSEDED_BY_CLEAN_SLATE_RESET`. At reset execution the 13 rows are removed as
part of the `ordens_compra_fio` purge (§7.1) — disposition option (3) of the C3D
§Z.3 gate, applied to all 64 rows. `OC-CUTOVER-001` stays `PLANNED` and
`REAL_CUTOVER` stays **NOT AUTHORIZED** throughout; this contract does not mark
`REAL_CUTOVER` authorized.

---

## 17. Explicit exclusions

**Archive creation and reset-script implementation are no longer excluded** —
both are IMPLEMENTED and evidenced at §21 (RATIFIED BY DIRECT SUPERVISOR REVIEW),
using a real, read-only-generated archive; no shared-development mutation
occurred. Not performed and not authorized: any shared-development deletion or DB
mutation; migration authoring; cutover/fence/snapshot/import/
read-switch/ACL-closure/activation; `REAL_CUTOVER`; `PHASE-C5B` design/
implementation; master-data disposition beyond "preserve"; broad documents-front
deletion; staging, deployment, production, branch, or any push beyond this pass's
single documentation-only commit and its one fast-forward push to `staging/dev`.

---

## 18. Production and forbidden-project prohibition

**Corrected (R1 archive-safety-correction): `bhgifjrfagkzubpyqpew` is the
forbidden project, not production** — the two must never be conflated. Three
distinct projects govern this front:

```text
shared development (authorized, this front): ucrjtfswnfdlxwtmxnoo
production (prohibited): gqmpsxkxynrjvidfmojk
forbidden project (prohibited, NOT production): bhgifjrfagkzubpyqpew
```

Neither production `gqmpsxkxynrjvidfmojk` nor the forbidden project
`bhgifjrfagkzubpyqpew` must be accessed or mutated by this front. The clean-slate
reset is authorized (when it is authorized) **only** against the non-production
shared development database `ucrjtfswnfdlxwtmxnoo`. A separate contemporaneous
read-only production diagnosis remains mandatory before any production promotion
of the purchase-order front (unchanged, unrelated to this reset).

---

## 19. Supervisor decisions — status

All prior open decisions are now **RATIFIED / BINDING** in §1 (final purge scope;
document-history option D3 with the exact fixture id; `saldo_fios` preserve;
`op_numeros` preserve, no restart; `op_fornecedores` purge; `pedido_compra_fio_regime`
empty; lotes full purge incl. orphans; master-data preserve; mutation mechanism;
cutover Option C). No open reset-boundary decision remains. The only remaining
supervisor action is **acceptance of this corrected contract**, after which a
**separate** order may authorize the archive-and-restore-drill-gated destructive
execution.

---

## 20. Status

`CONTRACT ACCEPTED / TOOLING IMPLEMENTED / REAL ARCHIVE GENERATED READ-ONLY /
DISPOSABLE RESTORE DRILL PASSED / VALIDATION GATES CLOSED / READINESS ACCEPTED /
DIRECTLY VERIFIED / SHARED-DEVELOPMENT RESET AUTHORIZED AS THE NEXT SEPARATE
GOVERNED DESTRUCTIVE ORDER / NOT EXECUTED` (updated by R2 §21; readiness accepted
by §24). **No deletion or database mutation of the shared-development database has
occurred**; the 64/51/13 corpus, the 16 Pedidos, the 20 OPs, the 25 lotes, and the
synthetic B6-VERIFY fixture all physically exist unchanged in
`ucrjtfswnfdlxwtmxnoo`. `REAL_CUTOVER` and `PHASE-C5B-ACCEPTANCE-DECISION` remain
unauthorized. The destructive shared-development reset is now **authorized as the
next separate governed destructive order**
(`CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1`, §24) and has **not**
been executed; the §8 archive-and-restore drill HARD STOP is satisfied by proven
tooling (§21). `PROJECT_STATE.md` remains the sole owner of
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` (now `CLEAN-SLATE-TRANSACTIONAL-RESET` /
this contract).

---

## 21. Tooling implementation, real archive & disposable-drill evidence (R2)

Authored by `CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-DRILL-R2` (entry checkpoint
`21fe32bc4b37773d93cabeac3e7e09aca9079037`). This pass implemented the §10 tooling,
generated the real archive **read-only**, and proved the §8.3 restore/reset drill in
a disposable PostgreSQL environment. It authorizes **no** shared-development deletion.

```text
CONTRACT_ACCEPTANCE: ACCEPTED / DIRECTLY VERIFIED AT 21fe32bc4b37773d93cabeac3e7e09aca9079037
IMPLEMENTATION_STATUS: TOOLING_IMPLEMENTED / REAL_ARCHIVE_GENERATED_READ_ONLY / DISPOSABLE_RESTORE_DRILL_PASSED / AWAITING DIRECT SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED
```

### 21.1 Technical files (5)

- `scripts/reset/clean-slate-transactional-export.mjs` — read-only export + corpus gate + deterministic archive/checksums (§8.1).
- `scripts/reset/clean-slate-transactional-reset.sql` — the governed one-transaction `DELETE` (§7), disposable-drill sentinel only.
- `scripts/reset/clean-slate-transactional-restore.sql` — FK-safe restore + FK/identity proof (§8.2), disposable-drill sentinel only.
- `scripts/reset/clean-slate-transactional-verify.mjs` — archive & restore-drill verification (§8.3/§16).
- `tests/clean-slate-transactional-reset.smoke.mjs` — fixture smoke + full disposable restore/reset drill.

### 21.2 Real archive (read-only, outside the repository)

Generated from `ucrjtfswnfdlxwtmxnoo` inside one `REPEATABLE READ READ ONLY`
transaction (rolled back — zero mutation). Path
`D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\20260722T173607Z`;
aggregate SHA-256 `337d23cd6426287053dcffe02512253c0e9e96874c6362d2823186b52094f593`;
`verify-archive` = 330/330 checks passed. Terminal migration `20260722055832`,
cutover `legacy_active/flat/not_started` (markers NULL); B6
`document_link_revision_ops = 10` across 4 distinct OPs `55, 57, 61, 63`;
`document_link_revisions = 8`; `document_candidates = 1`; targets 16 Pedidos / 20 OPs
/ 25 lotes.

### 21.3 Disposable restore/reset drill

Fresh disposable PostgreSQL 18.4 cluster; Supabase preamble + ordered `db/01..77`;
terminal migration `20260722055832` proven; disposable opaque stubs
(`auth.users`/`clientes`/`fornecedores`/`cores`/`modelos`) + preserved baselines
seeded; the real archive restored (prepare), reset #1 (exact affected-row sequences
`0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` / `27,16,4,18,0,0,0,0,0,0,20,16,25`),
zero-state + preserve invariance proven, real archive restored, all counts /
identities (16/20/25) / B6 (8 revisions, 10 revision-op rows across 55/57/61/63) /
FK validity proven, reset #2 proved re-deletability, cluster destroyed with PID/port/
directory-absence proof. Smoke + drill = 56/56 checks passed.

### 21.4 Emitted-order trigger-handling mechanism — RATIFIED BY DIRECT SUPERVISOR REVIEW

`CLEAN-SLATE-TRANSACTIONAL-RESET-ARCHIVE-SAFETY-CORRECTION-R1` (§2) **RATIFIED**
the exact emitted-order trigger-handling mechanism implemented in
`clean-slate-transactional-reset.sql` as an **ACCEPTED ARCHITECTURAL MECHANISM**.
This is now binding, not merely proposed:

```text
ACCEPTED ARCHITECTURAL MECHANISM

public.ordem_compra_item:
  item_quantidade_rascunho_guard

public.ordem_compra_item_alocacao:
  alocacao_rascunho_guard
  trg_alocacao_kg_alocado_cache

public.pedido_itens:
  pedido_itens_sync_parciais_after_change_trigger
```

Binding conditions (all satisfied by the implemented reset SQL, unchanged, byte-
identical since the tooling-and-drill pass): same transaction as the `DELETE`
operation; FK enforcement remains active; `trg_c3c_protected_mutation_guard`
remains active; cutover remains `legacy_active`; `SET CONSTRAINTS ALL IMMEDIATE`
occurs before re-enabling; all disabled triggers are re-enabled before `COMMIT`;
any error rolls back trigger state and data changes together. **The future
real-reset order must revalidate the existence, table ownership, enabled state,
and definitions of these exact triggers before executing** — no additional
trigger may be disabled without a new HARD STOP and architect decision.

### 21.5 Recorded implementation notes (for the future real-reset order)

- **Emitted-order guard handling — RATIFIED BY DIRECT SUPERVISOR REVIEW (§21.4).**
  39 of 51 orders are `status_administrativo = emitida`; the per-row
  `item_quantidade_rascunho_guard` / `alocacao_rascunho_guard` reject deleting an
  emitted order's items/allocations. The reset therefore temporarily disables
  exactly those blocking business guards (plus the allocation cache and the
  pedido-parciais sync side-effect triggers) via table-owner `DISABLE TRIGGER`,
  keeps FK enforcement and the C3C cutover fence ACTIVE, and re-enables them
  before COMMIT (`SET CONSTRAINTS ALL IMMEDIATE` flushes the deferred `kg_pedido`
  guard first). The contract §7 "plain DELETE" prose does not mention this
  mechanism; §21.4 above is now the binding, ratified disposition — the future
  real-reset order must revalidate (not re-decide) it per §21.4.
- **Restore mechanism** loads the consistent snapshot under transaction-scoped
  `session_replication_role = replica` and proves FK validity afterwards with
  triggers back on; it never permanently disables triggers/RLS and leaves no
  session setting changed.
- **Disposable-only scaffolding** (opaque master/`auth.users` stubs; a seeded
  `supabase_migrations.schema_migrations` mirroring shared-dev to prove the
  terminal migration; the classification 64-row corpus needed only so `db/67`'s
  migration self-check applies) is confined to the destroyed cluster and excluded
  from every archive identity claim.

---

## 22. Archive safety hardening & replacement authoritative archive (R1 correction)

Authored by `CLEAN-SLATE-TRANSACTIONAL-RESET-ARCHIVE-SAFETY-CORRECTION-R1`
(entry checkpoint `6d1c647de9b43088feced6a0632df8123afb1e07`), a direct supervisor
review of the R2 tooling. §21.4 ratifies the trigger-handling mechanism unchanged.
Four blocking gaps in the export/verify tooling were found and fixed
— `clean-slate-transactional-reset.sql` and `clean-slate-transactional-restore.sql`
are **byte-identical**, unchanged.

### 22.1 Blocking corrections applied

- **A — complete pre-write gate.** `buildArchive` previously validated identity/
  cutover/gate/corpus-identities before writing, but validated per-table row
  counts and never validated `saldo_fios`/`op_numeros`/master/documents-front
  counts until *after* `mkdirSync` had already run — a failing capture could leave
  a partial directory on disk. Fixed: a new shared `verifyPreservedBaseline()`
  (the single source of truth for `EXPECTED_SALDO_FIOS`/`EXPECTED_OP_NUMEROS`/
  `EXPECTED_MASTER_COUNTS`/`EXPECTED_DOCUMENTS_FRONT`, imported by both the
  exporter and the verifier — no divergent copy) and a pure, side-effect-free
  `validateCaptureTables()` now run to completion, with zero filesystem writes,
  before any `mkdirSync`/`writeFileSync`.
- **B — repository-boundary enforcement.** The guard previously compared
  `--out-root` against `process.cwd()`, which is wrong by construction (cwd is
  caller-controlled, not a stable authority). Fixed: `getRepoRoot()` derives the
  repository root from this module's own `import.meta.url`, and
  `verifyRepoBoundary()` rejects an out-root (and the computed archive directory)
  equal to or under that root — correct regardless of the caller's working
  directory, proven by tests launched with `cwd` at the repo root, at
  `scripts/reset/`, and (via the actual CLI subprocess) an unrelated external
  directory.
- **C — exact archive inventory.** `verifyArchive` previously only checked that
  the *expected* files existed and that `tables/` held no extra `.ndjson`; it
  never recursively walked the archive, so an unexpected root file, an extra
  `evidence/` file, a nested subdirectory, or a symlink would verify clean.
  `checksums.sha256` was parsed line-by-line but a non-matching line was silently
  skipped rather than rejected, and extra/duplicate entries were never detected.
  Fixed: a recursive `walkArchive()` enumerates every entry and rejects symlinks
  and any entry outside the exact permitted set; a strict `parseChecksumsFile()`
  rejects malformed lines, duplicate paths, unsafe paths (backslash/`..`/leading
  `/`/drive-letter), and now also rejects extra or missing entries via set
  equality against the recomputed file list.
- **D — project-ref custody.** `capture.identity.project_ref` was a hardcoded
  literal (`AUTHORIZED_DEV_REF`) baked into `CAPTURE_SQL`, so comparing it to
  `--target` was tautological, not a real cross-check. Fixed: `buildCaptureSQL`
  and `captureViaPsql` are now parametrized by the actual `target` argument, and
  a new `verifyProjectRefCustody()` explicitly rejects a mismatch between
  `capture.identity.project_ref` and `--target` before any write; `verifyArchive`
  independently cross-checks `manifest.database.project_ref`,
  `evidence/database-identity.json`'s `project_ref`, and the authorized
  `ucrjtfswnfdlxwtmxnoo` all agree. For the (unused in this session)
  `--database-url` path, a best-effort, non-blocking endpoint-ref hint is logged
  to stderr (never the URL/credentials) when the target ref is not visibly
  encoded in the endpoint — no independent endpoint-derived proof is claimed;
  the strict capture/manifest/evidence equality checks remain authoritative.

### 22.2 Tests added

16 new fixture-suite cases (all passing, zero regressions in the 21 pre-existing
cases): pre-write rejection of a wrong `saldo_fios` quantity / row count / wrong
`op_numeros` / wrong documents-front count / wrong master count / capture
`project_ref` mismatch (each proving no filesystem residue); repository-boundary
rejection with `cwd` at the repo root and at `scripts/reset/`, a positive
external-out-root-still-accepted complement, and a CLI-subprocess rejection
launched from an unrelated external working directory; `verifyArchive` rejection
of a manifest `project_ref` mismatch, an unexpected root file, an unexpected
evidence file, an unexpected nested file, an extra checksums entry, a duplicate
checksums entry, a malformed checksums line, and a missing checksums entry; and a
final re-verification that the untouched valid archive still passes after every
negative-case clone. Fixture suite: 49/49.

### 22.3 Replacement authoritative archive

The prior archive (`20260722T173607Z`, aggregate SHA-256 `337d23cd…`) is
**superseded, not deleted** — retained on disk. The **new, replacement
authoritative archive** was regenerated read-only with the corrected tooling:

```text
path: D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\20260722T183846Z
aggregate SHA-256: 5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc
verify-archive: 395/395 checks passed
```

All 30 `tables/*.ndjson` SHA-256 hashes are **identical** to the prior archive
(the shared-development corpus is unchanged; only `evidence/database-identity.json`'s
`captured_at` and the manifest/aggregate hashes differ, as expected). No corpus
drift; no HARD STOP triggered.

### 22.4 Disposable revalidation against the replacement archive

Full drill re-run against `20260722T183846Z`: preamble + `db/01..77`; terminal
migration `20260722055832` proven; restore (prepare) → reset #1 (exact sequences
`0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` /
`27,16,4,18,0,0,0,0,0,0,20,16,25`) → zero + preserved intact → restore →
counts/identities (16 Pedidos / 20 OPs / 25 lotes) / B6 (8 revisions, 10
revision-op rows, OPs 55/57/61/63) / FK validity proven → reset #2 (re-deletable)
→ zero → execution-mode-guard and incorrect-delete-count negatives proven →
cluster destroyed with PID/port/directory-absence proof. Smoke + drill: 84/84.
The ratified §21.4 trigger-handling mechanism ran unchanged (reset SQL
byte-identical). Shared-development database re-confirmed unmutated post-drill.

---

## 23. Final validation-gates correction (R1) — checkpoint `f165302c` NOT ACCEPTED

Authored by `CLEAN-SLATE-TRANSACTIONAL-RESET-FINAL-VALIDATION-GATES-CORRECTION-R1`
(entry checkpoint `f165302c1c542aa26e9ae78464d260c81eda6415`), a direct supervisor
review that found the §22 archive-safety technical patch itself sound (reviewed
and **RETAINED** — no change required to it) but identified two remaining
blocking validation-gate defects that made the mandatory `--self-test` fail.
**`f165302c1c542aa26e9ae78464d260c81eda6415` is NOT ACCEPTED** as a checkpoint —
the mandatory spec-custody self-test did not pass at that commit.

### 23.1 Root cause A — active contract omitted from the self-test fixture

`scripts/spec-custody/self-tests.mjs`'s `createFixture()` never copied
`ACTIVE_PHASE_CONTRACT` into its synthetic temporary repository. While
`ACTIVE_PHASE` was `NONE` (pre-clean-slate era) this was invisible; once this
contract became the active phase (`CLEAN-SLATE-TRANSACTIONAL-RESET-TOOLING-AND-
DRILL-R2`), the self-test's own **baseline** fixture started failing R2
(`ACTIVE_PHASE_CONTRACT is not an existing file: ...`) as an **uncaught**
exception — the harness crashed (exit 1, zero PASS lines printed) rather than
reporting a graceful per-case failure. **Fixed:** `createFixture()` now reads the
source `PROJECT_STATE.md` bootstrap directly (via a local, minimal, non-
duplicated field extraction — `validation-core.mjs` is untouched), and:
generically copies and tracks whatever file `ACTIVE_PHASE_CONTRACT` currently
points to when `ACTIVE_PHASE != NONE` (never hardcoding a specific phase or
contract path); requires the `NONE`/`NONE` combination otherwise; and throws
before building a fixture at all if the source's own bootstrap combination is
internally invalid (one `NONE`, the other not) — the fixture never makes invalid
source state look valid. Two **pre-existing** tests
(`UNRELATED_CONTRACT_SUBSTRING`, `DUPLICATE_CONTRACT_MARKERS`) also silently
no-op'd their intended mutation once the baseline stopped being `NONE`/`NONE`
(they hardcoded a literal `'ACTIVE_PHASE: NONE'` string replace) — corrected to
use the same generic line-setting helper.

### 23.2 Self-test coverage added

7 new cases (54 total, up from 47 — the increase reflects genuine new coverage,
not a forced count): `POSITIVE_ACTIVE_CONTRACT_BASELINE` (renamed from the now-
inaccurate `POSITIVE_NONE_CONTRACT`, since the baseline now represents an
active-phase state, not `NONE`/`NONE`), `POSITIVE_ACTIVE_CONTRACT_TRACKED`,
`POSITIVE_NONE_NONE_STATE`, `MISSING_ACTIVE_CONTRACT_FILE` (R1),
`UNTRACKED_ACTIVE_CONTRACT_FILE` (R1), `ACTIVE_CONTRACT_PHASE_ID_MISMATCH` (R2),
`ACTIVE_PHASE_WITHOUT_CONTRACT` (R2), `NONE_PHASE_WITH_CONTRACT` (R2).
`node scripts/validate-spec-custody.mjs --self-test` now exits **0** with all
**54/54** lines `=PASS` and no uncaught baseline-fixture error.

### 23.3 Root cause B — op_numeros preserved-gate was a loose map, not an exact set

`verifyPreservedBaseline()`'s `op_numeros` check built a `tipo -> ultimo_numero`
map and only compared the two known keys — it silently ignored `ano` (year)
entirely, silently collapsed a duplicate `tipo` to whichever row appeared last,
and never checked the row count, so an extra third row or a wrong year passed
undetected. **Fixed:** `EXPECTED_OP_NUMEROS` is now the exact canonical two-row
set `{tipo: 'latex', ano: 2026, ultimo_numero: 18}` /
`{tipo: 'tecelagem', ano: 2026, ultimo_numero: 41}`, and the check requires an
exact row count of 2, rejects any `NULL` field, rejects a duplicate `(tipo, ano)`
identity, rejects any row whose `(tipo, ano)` is not in the expected set (wrong
tipo or wrong year), and requires an exact `ultimo_numero` match for each
expected row. This remains the single shared source imported by the archive
verifier (`clean-slate-transactional-verify.mjs` required no change — it already
delegates entirely to `verifyPreservedBaseline()`).

### 23.4 Archive-tooling tests added

Pre-write (each proving no output directory was created): extra op_numeros row,
missing op_numeros row, duplicate op_numeros identity, wrong op_numeros year
(the pre-existing wrong-value case was retitled for clarity, not re-authored).
Archive-verifier negatives (each followed by re-confirming the untouched valid
archive still passes): extra op_numeros row in preserved-baseline evidence,
wrong op_numeros year in preserved-baseline evidence. Fixture suite: **61/61**.

### 23.5 Existing authoritative archive — retained, revalidated, not regenerated

Per this order's explicit instruction, the existing archive was **not**
modified, rewritten, regenerated, or deleted:

```text
path: D:\Programação\controle-tapetes-g28-artifacts\clean-slate-reset\20260722T183846Z
aggregate SHA-256 before this pass: 5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc
aggregate SHA-256 after this pass:  5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc  (UNCHANGED)
corrected verify-archive result: 395/395 checks passed (exact op_numeros two-row identity PASS, exact archive inventory PASS, project-ref custody PASS, all table/count/B6/preserved checks PASS)
```

The full disposable restore/reset drill was re-run against this **same**
archive (no regeneration): preamble + `db/01..77`; terminal migration
`20260722055832` proven; restore → reset #1 (exact sequences
`0,0,0,0,0,51,51,51,64,51,64` / `0,0,10,8,0,1` /
`27,16,4,18,0,0,0,0,0,0,20,16,25`) → zero + preserved state (including the exact
two `op_numeros` rows with year) intact → restore → counts/identities/B6/FK
proven → reset #2 → zero → negatives proven → cluster destroyed with proof.
Smoke + drill: **96/96**. `clean-slate-transactional-reset.sql` and
`-restore.sql` remained **byte-identical** throughout (confirmed via `git diff
--stat`, empty). The ratified §21.4 trigger-handling mechanism is unchanged. No
shared-development access of any kind occurred in this pass.

### 23.6 Status

`CONTRACT ACCEPTED / TOOLING IMPLEMENTED / REAL ARCHIVE GENERATED READ-ONLY /
DISPOSABLE RESTORE DRILL PASSED / VALIDATION GATES CLOSED / AWAITING DIRECT
SUPERVISOR REVIEW / SHARED-DEVELOPMENT RESET NOT AUTHORIZED`. Checkpoint
`f165302c1c542aa26e9ae78464d260c81eda6415` is **NOT ACCEPTED**; the §22 archive-
safety technical patch is **reviewed and retained**. `ACTIVE_PHASE`/
`ACTIVE_PHASE_CONTRACT` stay `CLEAN-SLATE-TRANSACTIONAL-RESET` / this contract;
the phase is **not CLOSED**; shared-development reset, `REAL_CUTOVER`, and
`PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized.

---

## 24. Direct supervisor acceptance of clean-slate reset readiness (R1) — checkpoint `62bdcc75` ACCEPTED

Authored by `CLEAN-SLATE-TRANSACTIONAL-RESET-READINESS-ACCEPTANCE-CLOSEOUT-R1`
(entry checkpoint `62bdcc75c335e3881adb1af6350de801675aa788`), a **documentation-only**
supervisor-acceptance pass. **No shared-development access, SQL, reset execution,
archive regeneration, or environment change occurred.** This section supersedes the
"awaiting direct supervisor review / shared-development reset not authorized"
disposition previously recorded in the top STATUS line, §20, and §23.6.

### 24.1 Binding supervisor acceptance

```text
CHECKPOINT:                       62bdcc75c335e3881adb1af6350de801675aa788
SUPERVISOR DISPOSITION:           ACCEPTED / DIRECTLY VERIFIED
CLEAN-SLATE RESET READINESS:      ACCEPTED
CONTRACT:                         ACCEPTED
TOOLING:                          ACCEPTED
ARCHIVE:                          ACCEPTED (20260722T183846Z, aggregate SHA-256
                                  5221cd4753157ba426cee978b43d8b0107a42a5f08f6e23c96503ee92d7399dc)
DISPOSABLE RESTORE/RESET DRILL:   ACCEPTED (96/96)
VALIDATION GATES:                 CLOSED (--self-test 54/54; fixture suite 61/61; verify-archive 395/395)
TRIGGER-HANDLING MECHANISM:       RATIFIED / ACCEPTED (§21.4, reset/restore SQL byte-identical)
SHARED-DEVELOPMENT RESET:         AUTHORIZED AS THE NEXT SEPARATE GOVERNED DESTRUCTIVE ORDER
                                  (CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1) / NOT EXECUTED BY THIS ORDER
```

### 24.2 Superseded-checkpoint disposition

Checkpoint `f165302c1c542aa26e9ae78464d260c81eda6415` **remains NOT ACCEPTED** (its
mandatory `--self-test` failed there, §23). Its retained technical corrections (the
§22 archive-safety patch and the §23 validation-gate fixes) are **incorporated into
and superseded by** the accepted checkpoint
`62bdcc75c335e3881adb1af6350de801675aa788`.

### 24.3 What remains unauthorized

This acceptance authorizes only the **existence** of a separate governed execution
order; it does **not** execute anything. The following remain unauthorized and
unchanged: the destructive reset execution itself (until it runs under
`CLEAN-SLATE-TRANSACTIONAL-RESET-SHARED-DEV-EXECUTION-R1` with every §12/§13 gate
satisfied); `REAL_CUTOVER` (`NOT AUTHORIZED`); `PHASE-C5B-ACCEPTANCE-DECISION`
(`IDENTIFIED / NOT AUTHORIZED`); real business-flow recreation (`NOT AUTHORIZED
UNTIL RESET EXECUTION IS ACCEPTED`); any shared-database apply beyond `db/77`;
staging validation/application; deployment; activation; production access; and
branch creation. The phase is **not CLOSED** and the accepted product checkpoint
stays `3405fdab8e05ec0f81cbfe07c63c489e551fee92`. No phase chains automatically.

### 24.4 Status

`CONTRACT ACCEPTED / TOOLING IMPLEMENTED / REAL ARCHIVE GENERATED READ-ONLY /
DISPOSABLE RESTORE DRILL PASSED / VALIDATION GATES CLOSED / READINESS ACCEPTED /
DIRECTLY VERIFIED AT 62bdcc75c335e3881adb1af6350de801675aa788 / SHARED-DEVELOPMENT
RESET AUTHORIZED AS THE NEXT SEPARATE GOVERNED DESTRUCTIVE ORDER / NOT EXECUTED`.
`PROJECT_STATE.md` remains the sole owner of `ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT`
(`CLEAN-SLATE-TRANSACTIONAL-RESET` / this contract).
