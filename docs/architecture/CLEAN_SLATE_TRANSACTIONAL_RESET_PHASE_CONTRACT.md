<!-- MATERIAL_PHASE_CONTRACT:BEGIN -->
PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET
<!-- MATERIAL_PHASE_CONTRACT:END -->

# Clean-Slate Transactional Reset — Proposed Material Phase Contract

```text
PHASE_ID: CLEAN-SLATE-TRANSACTIONAL-RESET
STATUS: PROPOSED / AWAITING SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED
AUTHORED_BY: CLEAN-SLATE-TRANSACTIONAL-RESET-CONTRACT-R1 (read-only diagnosis + documentation-only authoring)
ENTRY_CHECKPOINT: 56f749812c693cea3c81518a139d174e958fbbbf
DATABASE_DIAGNOSED: ucrjtfswnfdlxwtmxnoo (non-production shared development, PostgreSQL 17.6, terminal migration 20260722055832) — READ-ONLY
ACTIVE_PHASE: NONE
ACTIVE_PHASE_CONTRACT: NONE
```

> **Role.** This is a *proposed* material phase contract. It authorizes **no**
> deletion, **no** database mutation, **no** migration, **no** cutover, **no**
> activation, and **no** environment change. It records a binding business-owner
> ruling, a complete read-only diagnosis of the operational transaction domain in
> the authorized shared-development database, and a fully specified — but
> unexecuted — destructive-reset design for direct supervisor review. Normative
> product/technical semantics remain owned by
> `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` and
> `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`; current state remains owned by
> `PROJECT_STATE.md`. This contract creates **no** new requirement ID and changes
> **no** existing disposition.

---

## 1. Business-owner ruling (binding)

Recorded verbatim as binding for this front:

```text
CLEAN_SLATE_OPERATIONAL_REBUILD: APPROVED AS TARGET STRATEGY
CURRENT OPERATIONAL TRANSACTION DATA: DOES NOT NEED TO BE PRESERVED AS LIVE BUSINESS DATA
REAL BUSINESS FLOWS: WILL BE RECREATED THROUGH THE NEW APPLICATION
EXPECTED REAL FLOWS TO RECREATE: APPROXIMATELY TWO
RECREATION ORDER:
  1. create the real Pedidos;
  2. regenerate their purchasing needs;
  3. generate the purchase orders;
  4. regenerate the OPs;
  5. update subsequent operational states through the new application.
```

The current 13 unmapped legacy rows ids `153`–`165` require **no** mapping,
backfill, or re-baseline as business obligations. The current 51 mapped legacy
rows and their native projections likewise carry **no** automatic preservation
obligation as live operational transactions.

This ruling **does not** authorize deletion of master/reference data, and **does
not** by itself authorize any deletion at all. "Delete the operational
transaction corpus" is not "delete everything": master data is preserved by
default (§3). The prior legacy-data preservation/mapping strategy — including the
`ordem_compra_item_compat_fio` 51-row bridge and the deferred 13-row completeness
mapping/backfill options — is **SUPERSEDED as the target strategy**; it is not
retroactively deleted or rewritten, only superseded going forward.

---

## 2. Scope

**In scope (diagnosis only, this pass):** a complete read-only foreign-key and
logical-dependency inventory of the operational transaction domain in
`ucrjtfswnfdlxwtmxnoo`; an exact row-count baseline; a preserved master-data
boundary; the exact clean-slate deletion boundary and dependency-safe order; the
archival evidence requirement; the future destructive-execution design; the
clean-slate cutover strategy; the consequence for the former 13-row completeness
gate; and the `PHASE-C5B-ACCEPTANCE-DECISION` sequencing recommendation.

**Out of scope (explicitly not performed here):** any `INSERT`/`UPDATE`/
`DELETE`/`TRUNCATE`/DDL/`CALL`/`DO`/writer-RPC; any archive creation; any
migration authoring; any cutover, activation, or ACL closure; any product/test/
script/migration/configuration change; any staging, deployment, production,
branch, or push beyond the single authorized documentation-only commit and its
one fast-forward push to `staging/dev`. Master-data disposition beyond "preserve
by default" is out of scope. The `PHASE-C5B-ACCEPTANCE-DECISION` design is out of
scope beyond sequencing.

---

## 3. Preserved master-data boundary

Preserved by default (no clean-slate obligation touches these); each is FK-referenced
by the transactional layers and the running application depends on them as
reference/catalog data. Exact live counts in parentheses (read-only, this pass):

| Preserved table | Rows | Role |
|---|---|---|
| `auth.users` | (Supabase auth) | authentication identities; every actor FK (`emitida_por`, `cancelada_por`, `aceite_decidida_por`, `criado_por`, `ator_id`) targets it with `ON DELETE SET NULL`/`RESTRICT` |
| `public.usuarios` | 10 | application users/roles (`tipo`, `nivel_acesso`, `fornecedor_id`) |
| `public.usuarios_eventos` | 9 | user-administration audit (master-adjacent; not an OC transaction) |
| `public.clientes` | 6 | customers |
| `public.fornecedores` | 6 | suppliers (`tipo` gates material compatibility) |
| `public.cores` | 6 | yarn/color catalog |
| `public.modelos` | 12 | rug models (width + colors) |
| `public.parametros_largura` | 2 | per-width yarn coefficients (SQL image of `js/calculo-op.js`) |
| `public.precos_terceirizada` | 0 | supplier pricing reference |
| `public.ordem_compra_config` | 1 | emission-policy singleton (`exige_aceite`, `DEFAULT FALSE`, no client write path) — **preserve as-is** (see §11 sequence/policy note) |
| `db/*` migration history | 27 rows (`…65`→`…77`) | schema/migration history — immutable, never reset |

Master data **must not** be inferred into the deletion set. Backup infrastructure
tables `backup_runs` (2) / `backup_run_destinations` (4) are also preserved (not
operational transactions).

---

## 4. Exact operational-table inventory (read-only, terminal migration `20260722055832`)

Every materially related table classified as exactly one of `PRESERVE_MASTER_DATA`,
`PURGE_OPERATIONAL_SOURCE`, `PURGE_OPERATIONAL_DERIVED`, `RESET_CUTOVER_METADATA`,
`PRESERVE_AUDIT_ARCHIVE`, or `UNPROVEN`. FK notation: `→` outbound FK (child→parent),
`ON DELETE` behavior noted where it governs order.

### 4.1 Yarn-purchasing operational corpus — the unambiguous clean-slate core (Boundary A)

| Table | Rows | PK | Key inbound FKs | Key outbound FKs | Class | Reason |
|---|---|---|---|---|---|---|
| `ordens_compra_fio` | 64 | `id` BIGSERIAL | `necessidade_compra_fio.legado_origem_ordem_compra_fio_id` (NO ACTION), `ordem_compra_item_compat_fio.ordens_compra_fio_id` (NO ACTION), `ordem_compra_eventos.ordem_compra_fio_id` (CASCADE), `ordem_compra_fio_lancamentos.ordem_compra_fio_id` (CASCADE) | `op_id`→ops (CASCADE), `cor_id`→cores, `fornecedor_id`→fornecedores, actor→auth.users | PURGE_OPERATIONAL_SOURCE | legacy flat purchase orders; 51 mapped + 13 unmapped ids 153–165; disposable per ruling |
| `necessidade_compra_fio` | 64 | `id` BIGSERIAL | `ordem_compra_item_alocacao.necessidade_id` (RESTRICT) | `pedido_id`→pedidos (CASCADE), `op_id`→ops (RESTRICT), `cor_id`→cores, `legado_origem_ordem_compra_fio_id`→ordens_compra_fio (NO ACTION) | PURGE_OPERATIONAL_SOURCE | Layer-1 needs; all 64 are legacy-origin (0 native) |
| `ordem_compra` | 51 | `id` BIGSERIAL | item/eventos/recebimentos/lancamentos/movimentos | `pedido_id`→pedidos (CASCADE), `fornecedor_id`→fornecedores, actor→auth.users | PURGE_OPERATIONAL_DERIVED | Layer-2 native headers (all 51 `legado`-imported) |
| `ordem_compra_item` | 51 | `id` BIGSERIAL | alocacao/compat_fio/lancamentos/movimentos | `ordem_id`→ordem_compra (CASCADE), `cor_id`→cores | PURGE_OPERATIONAL_DERIVED | Layer-3 item lines |
| `ordem_compra_item_alocacao` | 51 | `id` BIGSERIAL | lancamentos/movimentos (RESTRICT) | `item_id`→ordem_compra_item (CASCADE), `necessidade_id`→necessidade_compra_fio (RESTRICT), `op_id`→ops (RESTRICT) | PURGE_OPERATIONAL_DERIVED | Layer-4 allocations |
| `ordem_compra_item_compat_fio` | 51 | `id` BIGSERIAL | (none) | `ordem_compra_item_id`→ordem_compra_item (NO ACTION), `ordens_compra_fio_id`→ordens_compra_fio (NO ACTION), actor→auth.users | PURGE_OPERATIONAL_DERIVED | legacy↔native compat bridge (the frozen REFUND-A mapping being superseded) |
| `ordem_compra_recebimentos` | 0 | `id` BIGSERIAL | lancamentos (RESTRICT) | `ordem_compra_id`→ordem_compra (RESTRICT), actor→auth.users | PURGE_OPERATIONAL_DERIVED | receipt command headers (empty) |
| `ordem_compra_fio_lancamentos` | 0 | `id` BIGSERIAL | movimentos, self `estorno_de_id` | ordem_compra/item/alocacao/recebimentos/ordens_compra_fio/ops/cores/auth.users | PURGE_OPERATIONAL_DERIVED | append-only receipt ledger (empty; `trg_lancamento_append_only_guard`) |
| `ordem_compra_fio_movimentos_estoque` | 0 | `id` BIGSERIAL | (none) | lancamento/item/alocacao/ordem_compra/ops/cores/auth.users (RESTRICT) | PURGE_OPERATIONAL_DERIVED | inventory movements (empty) |
| `ordem_compra_eventos` | 0 | `id` BIGSERIAL | (none) | `ordem_compra_id`→ordem_compra (CASCADE), `ordens_compra_fio_id`→ordens_compra_fio (CASCADE), actor→auth.users | PURGE_OPERATIONAL_DERIVED | append-only transition audit (empty) |
| `ordem_compra_distribuicao_comandos` | 0 | `id` BIGSERIAL | (none) | `ator_id`→auth.users (RESTRICT) | PURGE_OPERATIONAL_DERIVED | allocation-writer idempotency journal (empty) |

Boundary-A physical row total: **332** (64+64+51+51+51+51 + five empty tables).

### 4.2 Commercial/production source corpus — required IF the ruling's "create the real Pedidos / regenerate the OPs" is taken literally (Boundary B)

| Table | Rows | Class | Reason / entanglement |
|---|---|---|---|
| `pedidos` | 16 | PURGE_OPERATIONAL_SOURCE | recreation step 1; **RESTRICT-blocked** by `document_link_revisions.pedido_id` for 1 Pedido, and `expedicoes.pedido_id` (RESTRICT; expedicoes empty). `lotes.pedido_id`, `document_candidates.pedido_id`, `document_events.pedido_id` are `SET NULL` |
| `pedido_itens` | 18 | PURGE_OPERATIONAL_SOURCE | `pedido_id` CASCADE; `op_itens.pedido_item_id`, `expedicao_itens.pedido_item_id` SET NULL |
| `pedido_eventos` | 0 | PURGE_OPERATIONAL_SOURCE | pedido audit (empty) |
| `pedido_cliente_eventos` | 0 | PURGE_OPERATIONAL_SOURCE | pedido↔client audit (empty) |
| `pedido_parciais` / `pedido_parcial_itens` | 0 / 0 | PURGE_OPERATIONAL_SOURCE | partial-delivery detail (empty) |
| `pedido_compra_fio_regime` | 0 | UNPROVEN | per-Pedido `legacy`/`native` regime; immutable-by-trigger; vestigial after a clean rebuild (see §4.4) |
| `ops` | 20 | PURGE_OPERATIONAL_SOURCE | recreation step 4; **RESTRICT-blocked** by `document_link_revision_ops.op_id` for 4 OPs, and by `necessidade_compra_fio.op_id`/`ordem_compra_item_alocacao.op_id` (resolved by Boundary A first) |
| `op_itens` | 27 | PURGE_OPERATIONAL_SOURCE | `op_id` CASCADE; `entrega_itens.op_item_id`, `expedicao_itens.op_item_id` RESTRICT (both empty) |
| `op_fornecedores` | 16 | UNPROVEN | OP↔supplier stage assignment; belongs to tecelagem flow, not the fio purchase-order chain |
| `op_eventos` | 4 | PURGE_OPERATIONAL_SOURCE | OP status audit (`op_id` CASCADE) |
| `op_numeros` | 2 | RESET_CUTOVER_METADATA | OP-number counter (`tipo`/`ano`/`ultimo_numero`); reset only if OP numbering must restart from the rebuilt corpus |
| `op_latex_entregas` | 0 | UNPROVEN | latex delivery bridge (empty) |
| `lotes` | 25 | UNPROVEN | production batch bridging Pedido→OP (`ops.lote_id → lotes.pedido_id`); 15 reference a Pedido (`SET NULL`); non-empty and shared with the commercial/shipping subsystem |

### 4.3 Cutover metadata — reset target (but see §11 mechanism)

| Table | Rows | State | Class | Reason |
|---|---|---|---|---|
| `ordem_compra_cutover` | 1 | `legacy_active` / `flat` / `not_started`, **all** snapshot/import/PONR/ACL/activation markers NULL | RESET_CUTOVER_METADATA | singleton; already at the pristine pre-cutover baseline — no marker needs clearing |
| `ordem_compra_cutover_source_snapshot` | 0 | — | RESET_CUTOVER_METADATA | frozen source snapshot (never captured) |
| `ordem_compra_cutover_inventory_baseline` | 0 | — | RESET_CUTOVER_METADATA | frozen inventory baseline (never captured) |

### 4.4 Inventory, documents front, and shipping — UNPROVEN / explicit-decision-required

| Table | Rows | Class | Reason |
|---|---|---|---|
| `saldo_fios` | 5 | UNPROVEN | yarn inventory balance cache (fenced by the cutover guard; mutated only by the native receipt trigger — 0 receipts). Pre-existing baseline inventory; reset-vs-preserve is a business decision |
| `saldo_fios_op` | 0 | UNPROVEN | per-OP leftover yarn (empty; never written by any native/cutover path in db/67–77) |
| `document_candidates` | 40 | UNPROVEN | documents front (separate front; `pedido_id`/`fornecedor_id` SET NULL) |
| `document_events` | 1 | UNPROVEN | documents front (`pedido_id` SET NULL) |
| `document_link_revisions` | 8 | UNPROVEN / **binding block** | `pedido_id`→pedidos **RESTRICT** (1 Pedido); canonical document history — the **Controlled-Delete × document-history** rule (`PEDIDO_OP_SCHEMA_CONTRACT.md`) blocks physical Pedido/OP deletion while it exists |
| `document_link_revision_ops` | 10 | UNPROVEN / **binding block** | `op_id`→ops **RESTRICT** (4 OPs); same binding rule |
| `document_technical_evidences` | 0 | UNPROVEN | documents front (empty) |
| `document_decisions` | 0 | UNPROVEN | documents front (empty) |
| `document_scan_requests` / `document_scan_runs` | 24 / 30 | UNPROVEN | ingestor scan history (documents front) |
| `lotes` | 25 | UNPROVEN | see §4.2 |
| `expedicoes` / `expedicao_itens` / `expedicao_movimentos` / `expedicao_movimento_itens` | 0 / 0 / 0 / 0 | UNPROVEN | shipping subsystem (all empty; `expedicoes.pedido_id`/`op_latex_id` RESTRICT) |
| `entregas` / `entrega_itens` | 0 / 0 | UNPROVEN | production-movement subsystem (empty) |

---

## 5. Row-count baseline (exact, read-only, `ucrjtfswnfdlxwtmxnoo`, this pass)

The following are the exact `count(*)` values captured read-only and are the
required pre-deletion invariant baseline (see §16 validation matrix):

```text
ordens_compra_fio ................. 64  (51 mapped + 13 unmapped ids 153–165)
necessidade_compra_fio ........... 64  (64 legacy-origin, 0 native-origin)
ordem_compra ..................... 51
ordem_compra_item ................ 51
ordem_compra_item_alocacao ....... 51
ordem_compra_item_compat_fio ..... 51
ordem_compra_recebimentos ........  0
ordem_compra_eventos .............  0
ordem_compra_fio_lancamentos .....  0
ordem_compra_fio_movimentos_estoque 0
ordem_compra_distribuicao_comandos  0
ordem_compra_cutover .............  1  (legacy_active / flat / not_started; all markers NULL)
ordem_compra_cutover_source_snapshot 0
ordem_compra_cutover_inventory_baseline 0
pedidos .......................... 16     pedido_itens ....... 18
ops .............................. 20     op_itens ........... 27     op_fornecedores 16     op_eventos 4     op_numeros 2
lotes ............................ 25
saldo_fios ........................ 5     saldo_fios_op ....... 0
document_candidates .............. 40     document_events ..... 1     document_link_revisions 8 (1 pedido)     document_link_revision_ops 10 (4 ops)
document_scan_requests ........... 24     document_scan_runs .. 30
clientes 6 · fornecedores 6 · cores 6 · modelos 12 · usuarios 10 · parametros_largura 2   (PRESERVED master data)
```

No real receipt, ledger, movement, event, or distribution-command row exists —
the yarn-purchasing corpus carries **zero** productive receipt/stock/audit
consequence. The cutover has never been exercised (§4.3), so there is no PONR to
unwind. This materially lowers the reset's risk versus a corpus with real
receipts.

---

## 6. Dependency graph and the exact dependency-safe order

Every ON-DELETE behavior above was read from `pg_constraint`. Under the current
`legacy_active` state the `trg_c3c_protected_mutation_guard` fence is a
pass-through (it raises `55000` only when the cutover state is *not*
`legacy_active`), so the reset **must** run while `legacy_active` (§8). The
`NO ACTION`/`RESTRICT` edges dictate that children be removed before parents.

**Boundary-A dependency-safe deletion order (children first):**

```text
1.  ordem_compra_fio_movimentos_estoque   (0)
2.  ordem_compra_fio_lancamentos          (0)   -- append-only guard permits nothing; empty, so no conflict
3.  ordem_compra_recebimentos             (0)
4.  ordem_compra_eventos                   (0)
5.  ordem_compra_distribuicao_comandos     (0)
6.  ordem_compra_item_compat_fio          (51)  -- NO ACTION FKs to both ordem_compra_item and ordens_compra_fio: must precede both
7.  ordem_compra_item_alocacao            (51)  -- RESTRICT to necessidade_compra_fio: must precede it
8.  ordem_compra_item                     (51)
9.  necessidade_compra_fio                (64)  -- NO ACTION from legado_origem to ordens_compra_fio: must precede it
10. ordem_compra                          (51)
11. ordens_compra_fio                     (64)
```

This clears Layers 1–4, the legacy flat corpus, the compat bridge, and all
(empty) ledgers/events/movements/commands, leaving every master-data parent
(`cores`, `fornecedores`, `ops`, `pedidos`, `auth.users`, `ordem_compra_config`)
untouched.

**Boundary-B (only if authorized — see §18):** after Boundary A, the
`necessidade`/`alocacao`→`ops` (RESTRICT) and `necessidade`/`ordem_compra`→
`pedidos` (CASCADE) edges are already satisfied, so `op_eventos`, `op_itens`,
`op_fornecedores`, `ops`, `pedido_*`, `pedidos`, `lotes` could then be removed —
**but** deletion of the 1 Pedido and 4 OPs carrying `document_link_revisions`/
`document_link_revision_ops` is **RESTRICT-blocked and additionally forbidden by
the binding Controlled-Delete × document-history rule**, and the documents-front
rows are a separate front. Boundary B therefore requires an explicit
business-owner disposition of the documents-front data first (§18).

---

## 7. Archival evidence plan (mandatory before any mutation)

The future destructive-execution contract **must** produce, before touching any
row, a complete archival evidence package. It is recovery/evidence material, not
a new canonical state owner, and must live **outside the repository** (e.g. an
operator-controlled encrypted archive directory), never committed.

For **every** purged table the archive must record: schema-qualified table name;
exact row export in a deterministic order (`ORDER BY id`, or the table's natural
key); the pre-deletion row count; a per-table content checksum (e.g. SHA-256 over
the deterministically serialized rows); the export timestamp; the database
identity fingerprint (project ref `ucrjtfswnfdlxwtmxnoo`, `current_database`,
`server_version`, terminal migration `20260722055832`); the cutover-state
snapshot (`ordem_compra_cutover` full row); and the list of preserved master
tables with their counts. The archive **must exclude** secrets, connection
credentials, and any personal data not required for recovery (actor UUIDs may be
retained as opaque identifiers; no `auth.users` PII is exported).

The archive is **not** created by this contract. Its existence, checksum, and
storage location must be proven as an entry gate of the future execution (§16).

---

## 8. Destructive-execution design (specified, NOT executed)

- **Exact tables & order:** §6 Boundary A (mandatory core); Boundary B only if
  §18 authorizes it and the documents-front disposition is resolved.
- **Exact predicates:** unconditional per-table `DELETE FROM <table>` in the §6
  order (the whole corpus is disposable); no `WHERE` filter is needed for
  Boundary A because every row is in scope. (If the supervisor instead scopes the
  reset to "purge all but the ~2 real flows," the predicates become explicit
  id-lists supplied by the business owner — recorded as an open decision, §18.)
- **Transactional boundary:** one single serialized transaction; either the whole
  reset commits or it rolls back — no partial reset.
- **DELETE vs TRUNCATE:** use `DELETE` (not `TRUNCATE`). `TRUNCATE` bypasses
  per-row triggers/FK checks and cannot be safely ordered against `NO ACTION`
  edges; `DELETE` honors the append-only/immutable guards and FK order and is
  auditable. `TRUNCATE` is prohibited.
- **Guard/fence interaction:** the reset must run while `ordem_compra_cutover.status
  = 'legacy_active'` so `trg_c3c_protected_mutation_guard` passes through; a HARD
  STOP applies if the state is not `legacy_active` at execution time.
- **Sequence handling:** **do not reset sequences** by default (leave
  `ordens_compra_fio_id_seq`, `ordem_compra_id_seq`, `necessidade_compra_fio_id_seq`,
  `ordem_compra_item_id_seq`, `ordem_compra_item_alocacao_id_seq`,
  `ordem_compra_item_compat_fio_id_seq`, and the empty-table sequences advanced).
  Recreated flows take fresh higher ids; this avoids PK reuse/collision with any
  archived reference. Any `ALTER SEQUENCE … RESTART`/`setval` is an **optional,
  separately authorized** cosmetic step, permitted only after a proven zero-row
  state (§18).
- **Expected counts before deletion:** exactly the §5 baseline (HARD STOP on any
  mismatch — proves the corpus has not drifted since diagnosis).
- **Expected zero-state after deletion:** every Boundary-A table `count(*) = 0`;
  master-data counts unchanged; `ordem_compra_cutover` still
  `legacy_active`/`flat`/`not_started` with all markers NULL.
- **Rollback behavior:** any failed invariant, any unexpected count, any
  non-`legacy_active` state, or any FK/guard error aborts the whole transaction
  with no committed change.
- **Mutation mechanism (decision):** the reset **must** be a **one-time, governed,
  tracked administrative transactional operation** executed exactly once against
  `ucrjtfswnfdlxwtmxnoo` **only**, under a separate explicit authorization. It
  **must not** be a new `db/NN` forward migration: a forward migration replays on
  every environment and every fresh disposable cluster, would delete the 64-row
  corpus that the C3D/C5A integration tests and the `tests/ordem-compra-c3d-deploy.smoke.js`
  deployment-manifest guard depend on, and would risk replaying against
  production — all violations of the forward-only, environment-agnostic migration
  model. Migrations `db/01`–`db/77` are immutable and are **not** edited. Ad-hoc
  manual deletion through the Supabase dashboard is **prohibited**. If (and only
  if) a future canonical activation on the rebuilt corpus needs schema-level
  change, that is a separate migration decision, not part of this data reset.

---

## 9. Sequence policy

Owned sequences in the operational domain (all `BIGSERIAL`): `ordens_compra_fio_id_seq`,
`necessidade_compra_fio_id_seq`, `ordem_compra_id_seq`, `ordem_compra_item_id_seq`,
`ordem_compra_item_alocacao_id_seq`, `ordem_compra_item_compat_fio_id_seq`,
`ordem_compra_eventos_id_seq`, `ordem_compra_fio_lancamentos_id_seq`,
`ordem_compra_recebimentos_id_seq`, `ordem_compra_fio_movimentos_estoque_id_seq`,
`ordem_compra_distribuicao_comandos_id_seq`, and the cutover sequences. `saldo_fios`
(composite unique, no serial), `pedido_compra_fio_regime` (UUID PK), and
`ordem_compra_config` (constant `id=1`) own no operational sequence.

**Default policy: no sequence reset.** Recreated flows use fresh higher ids.
Sequence restart is optional, cosmetic, separately authorizable, and only after a
proven zero-row state.

---

## 10. Cutover-state strategy

Current state is pristine pre-cutover (`legacy_active`/`flat`/`not_started`, all
markers NULL, snapshot/baseline rows 0, PONR never crossed). Options evaluated:

- **Option A — two-phase reset then empty-corpus cutover.** Rejected. The `db/75`
  cutover functions hard-code the disposed corpus's constants —
  `ordem_compra_c3c_fence_and_snapshot` asserts **source snapshot count = 51**;
  `ordem_compra_c3c_assert_import_reconciled` asserts **39 headers / 44 ledger
  lines / 20,221.280 kg / 405.980 kg excess / 0 movements**. An empty or rebuilt
  corpus fails every assert; a canonical activation is impossible without a
  superseding, re-baselined migration.
- **Option B — atomic reset + canonical activation.** Rejected for the same
  hard-coded-constant reason, plus it needlessly crosses toward the irreversible
  PONR for a corpus that is being rebuilt through the flat application path.
- **Option C — remain `legacy_active` after reset. RECOMMENDED.** The application
  is `legacy_active`/`flat`; the two real flows are recreated through the live
  flat path (Pedido → needs → purchase orders → OPs). No fence, snapshot, import,
  read switch, ACL closure, or activation is performed by the reset. The cutover
  singleton stays at its pristine baseline.

**Recommendation: Option C.** Consequence recorded: the `db/75` import/reconcile
constants (51/39/44/20,221.280/405.980) and the `ordem_compra_item_compat_fio`
51-row snapshot premise become **SUPERSEDED** once the corpus is reset; any future
`REAL_CUTOVER` on the rebuilt corpus requires a **new terminal migration
re-baselined to the rebuilt corpus's real counts**, authored under a separate
order. This contract neither authors nor authorizes that migration.

---

## 11. Rollback and recovery; and the `ordem_compra_config` note

- **Pre-execution:** the archive (§7) is the recovery source of record; the reset
  transaction is all-or-nothing (§8), so a failed reset leaves the corpus intact.
- **Post-execution recovery:** because the reset stays `legacy_active` and the
  cutover was never crossed, there is no PONR/forward-only constraint; recovery,
  if ever required, is a restore from the §7 archive under a separate
  authorization — not a canonical forward repair.
- **`ordem_compra_config` (singleton, `exige_aceite=FALSE`):** preserve as-is. It
  is a policy switch, not transactional data; re-seeding it is unnecessary and
  would be a policy change. Preserving `exige_aceite=FALSE` keeps recreated
  emissions on the already-validated `EMISSION_ALLOWED_ONLY_WHEN_EXIGE_ACEITE_FALSE`
  path (C5A), avoiding the `PHASE-C5B` acceptance-decision gap (§14).

---

## 12. Point of no return (PONR)

For this reset the PONR is the **commit of the single reset transaction** — the
first and only irreversible moment, recoverable thereafter only from the §7
archive. It is unrelated to the `OC-CUTOVER-PONR-001` cutover PONR ("the first
successfully committed non-import canonical receipt after the canonical read
switch," `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.29.6), which is **not**
crossed by this reset (Option C keeps `legacy_active`, never sets
`productive_receipt_started_at`).

---

## 13. Hard stops

The future execution **must** hard-stop (abort, no mutation) if any of:

- the selected project is not exactly `ucrjtfswnfdlxwtmxnoo`, or is production, or
  is the legacy project;
- `ordem_compra_cutover.status` ≠ `legacy_active`, or `read_authority` ≠ `flat`,
  or any snapshot/import/PONR/ACL/activation marker is non-NULL;
- any Boundary-A pre-count ≠ §5 baseline (corpus drift);
- the §7 archive (export + checksum + identity fingerprint) is not proven present
  before the first `DELETE`;
- any Boundary-A row cannot be deleted in the §6 order (unexpected FK/guard);
- any master-data count changes;
- the reset is proposed as a `db/NN` migration or executed via the dashboard;
- Boundary B is attempted without an explicit documents-front disposition and the
  Controlled-Delete rule cleared for the 1 Pedido + 4 OPs;
- a writer RPC or `TRUNCATE` is used in place of the specified `DELETE` order.

---

## 14. `PHASE-C5B-ACCEPTANCE-DECISION` boundary and sequencing

`PHASE-C5B-ACCEPTANCE-DECISION` (`IDENTIFIED / NOT AUTHORIZED`) owns the missing
`status_aceite` `pendente → aceita/rejeitada` acceptance-decision RPC, actor
ownership, state-transition rules, audit/history, UI, and the supplier-vs-admin
permission split. It is **corpus-independent**: the acceptance-decision gap is
structural, unaffected by resetting or rebuilding the transaction corpus.

**Sequencing recommendation:** `PHASE-C5B` is **not** a prerequisite of, and is
**not** blocked by, the clean-slate reset. Because `ordem_compra_config.exige_aceite`
is preserved `FALSE` (§11), the recreated flows will not require an acceptance
decision, so `PHASE-C5B` is best sequenced **after** the reset and **after** the
two real flows are recreated — and only becomes necessary if/when the business
later enables `exige_aceite=TRUE`. This contract neither authorizes nor designs
`PHASE-C5B` beyond this sequencing.

---

## 15. Consequence for the former 13-row completeness gate

The former binding `REAL_CUTOVER` completeness gate for the 13 unmapped
`ordens_compra_fio` rows ids `153`–`165` (`ORDEM_COMPRA_C3D_PHASE_CONTRACT.md`
§Z.3; `OC-CUTOVER-001` residual debt) is dispositioned as:

**`STILL_APPLICABLE_UNTIL_RESET_EXECUTION_COMPLETES`, then
`SUPERSEDED_BY_CLEAN_SLATE_RESET`.**

Distinguished exactly as the diagnosis requires:

- **Business decision:** no current transaction (including the 13 rows) needs
  preservation as live data.
- **Technical fact:** the 13 rows (and the full 64/51 corpus) **physically still
  exist** — no deletion has occurred; the gate remains applicable until the reset
  is executed under a separate authorization.
- **Future retirement point:** at reset execution, the 13 rows are removed as part
  of the `ordens_compra_fio` purge — this **is** disposition option (3)
  ("cancellation/removal through a separately authorized business-data action") of
  the §Z.3 gate, applied to all 64 rows, not only 153–165. At that moment the
  64/51/13 corpus ceases to be a cutover gate.
- **Replacement gate:** the old completeness gate is replaced by the new
  clean-slate readiness gates — proven zero-state, archive proven, master-data
  intact, `legacy_active` preserved, and (for any future cutover) a re-baselined
  migration (§10). `OC-CUTOVER-001` stays `PLANNED` and `REAL_CUTOVER` stays
  **NOT AUTHORIZED** throughout; this contract does not mark `REAL_CUTOVER`
  authorized.

---

## 16. Validation matrix (for the future execution)

| Gate | Check | When |
|---|---|---|
| Identity | project ref `ucrjtfswnfdlxwtmxnoo`, `server_version`, `current_database`, terminal migration `20260722055832` | entry |
| Pre-state | cutover `legacy_active`/`flat`/`not_started`, all markers NULL | entry |
| Baseline | every §5 count matches exactly | entry |
| Archive | §7 export + per-table checksum + identity fingerprint proven present | entry (before first DELETE) |
| Master-data guard | preserved-table counts snapshot | entry + exit |
| Order | Boundary-A deletes succeed in §6 order inside one transaction | execution |
| Zero-state | every Boundary-A table `count(*) = 0` | exit |
| Cutover invariance | `ordem_compra_cutover` unchanged (`legacy_active`/`flat`/`not_started`, markers NULL) | exit |
| Master-data invariance | preserved counts unchanged vs entry | exit |
| No PONR | `productive_receipt_started_at` still NULL | exit |

---

## 17. Evidence packet (for the future execution)

The future execution report must provide: entry identity proof; the archive
manifest (per-table count + checksum + location, outside the repo); the pre-count
baseline vs §5; the single-transaction DELETE log in §6 order; the exit
zero-state proof; master-data invariance; cutover-singleton invariance; the
proven-absent PONR; and a statement that no migration, no dashboard action, no
`TRUNCATE`, and no writer RPC was used.

---

## 18. Exact proposed future file/migration manifest

- **Mechanism:** one tracked, reviewed, single-transaction administrative SQL
  operation (e.g. `scripts/reset/clean-slate-transactional-reset.sql` or an
  equivalent governed runbook), **not** a `db/NN` migration, executed once against
  `ucrjtfswnfdlxwtmxnoo`. Exact path/name to be fixed by the future execution
  order.
- **No migration file** is created (`db/01`–`db/77` immutable; a future cutover
  re-baseline migration, if ever, is a separate order — §10).
- **No product/test/config change.**
- **Archive tooling** (export + checksum) may be a separate one-time script,
  authored under the future execution order, writing outside the repository.

---

## 19. Explicit exclusions

Not performed and not authorized by this contract: any deletion or DB mutation;
archive creation; migration authoring; cutover/fence/snapshot/import/read-switch/
ACL-closure/activation; `REAL_CUTOVER`; `PHASE-C5B` design/implementation;
master-data disposition beyond "preserve by default"; documents-front / `lotes` /
`saldo_fios` disposition (all UNPROVEN, §18/§20); staging, deployment, production,
branch, or any push beyond this pass's single documentation-only commit and its
one fast-forward push to `staging/dev`.

---

## 20. Supervisor decisions still required

1. **Accept or reject** this proposed contract and its recommended Option C
   cutover strategy.
2. **Boundary scope:** Boundary A only (yarn-purchasing corpus) versus Boundary A
   + Boundary B (also purge `pedidos`/`ops`/`lotes`) — and, if Boundary B, whether
   to purge the *entire* corpus or only "all but the ~2 real flows" via explicit
   id-lists.
3. **Documents-front disposition** (`document_candidates`/`_events`/
   `_link_revisions`/`_link_revision_ops`/`_technical_evidences`/`_decisions`/
   `_scan_requests`/`_scan_runs`) and the **binding Controlled-Delete × document-history
   rule** for the 1 Pedido + 4 OPs that carry canonical document history — a
   business-owner decision, since these block Boundary B and are a separate front.
4. **`saldo_fios`/`saldo_fios_op` inventory** — reset or preserve.
5. **`pedido_compra_fio_regime`, `op_fornecedores`, `op_numeros`, `lotes`,
   `expedicoes`/`entregas`** — confirm disposition (UNPROVEN).
6. **Sequence reset** — keep advanced (recommended) or restart after zero-state.
7. **Mutation mechanism** — ratify "one-time governed administrative operation,
   not a migration, not dashboard."
8. **Master data** — confirm no master/reference table is in scope.

---

## 21. Production prohibition

Production `bhgifjrfagkzubpyqpew` and the production project `gqmpsxkxynrjvidfmojk`
**must not** be accessed or mutated by this front. The clean-slate reset is
authorized (when it is authorized) **only** against the non-production shared
development database `ucrjtfswnfdlxwtmxnoo`. No production data is in scope. A
separate contemporaneous read-only production diagnosis remains mandatory before
any production promotion of the purchase-order front (unchanged, unrelated to this
reset).

---

## 22. Status

`PROPOSED / AWAITING SUPERVISOR REVIEW / DESTRUCTIVE EXECUTION NOT AUTHORIZED`.
No deletion, database mutation, migration, cutover, activation, or environment
change has occurred. The 64/51/13 corpus physically exists. `REAL_CUTOVER` and
`PHASE-C5B-ACCEPTANCE-DECISION` remain unauthorized. Execution requires a separate
explicit order. `PROJECT_STATE.md` remains the sole owner of
`ACTIVE_PHASE`/`ACTIVE_PHASE_CONTRACT` (both `NONE`).
