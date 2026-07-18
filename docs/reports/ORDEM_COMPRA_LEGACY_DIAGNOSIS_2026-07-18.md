# Purchase-Order Legacy Diagnosis — Refoundation PART 2

> **Status:** Diagnosis of record (read-only, legacy `ucrjtfswnfdlxwtmxnoo`).
> The **conversion counts and per-class conversion policy in §3–§4 are
> architect-RATIFIED** (ruling *RATIFY 51-HEADER LEGACY MODEL*, 2026-07-18).
> This document does **not** authorize implementation. It feeds PART 1
> (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`).
>
> **Access / integrity:** `supabase-legacy` MCP, URL-pinned `read_only=true`.
> **HARD STOP ZERO — PASSED:** fingerprint `usuarios_eventos=9`,
> `document_link_revisions=8` (exact M3 legacy counts; production is `0/0`).
> Production `gqmpsxkxynrjvidfmojk` and prohibited `bhgifjrfagkzubpyqpew` were
> **not accessed**. No writes (read-only transactions only). Corpus re-verified
> unchanged at 64 rows.
>
> **This report deliberately separates four things** — read them as distinct:
> **§1 observed staging facts** · **§2 rejected conversion models** ·
> **§3 architect-ratified conversion policy** · **§6 production facts NOT
> established**.

---

## 1. Observed staging facts (read-only; not policy)

The `ordens_compra_fio` rows here are the **staging/development corpus** (64 rows).

- **64 rows total.** Both `ordem_compra_eventos` and `ordem_compra_fio_lancamentos`
  are **empty (0 rows)**; `ordem_compra_config.exige_aceite = false`.
- **No row was ever emitted or received through a real RPC.** Every `emitida`
  value came from the Phase-A backfill; every non-zero `kg_recebido` came from the
  legacy direct-write path (`op-writes.js registrarRecebimentoOrdemFio` /
  `fornecedor.js screenFornecedorOrdens`, the `KG-RECEBIDO-ACL-GAP` /
  `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED` debts).
- **60 of 64 rows have `fornecedor_id IS NULL`** (supplier never recorded). Only
  OP36 (pedido `c0331a65`, OP94) carries suppliers, split across **three** of them
  (4, 5, 22).
- **0 cancelled rows. 0 partial receipts.** Receipt/legacy status is only ever
  `nao_recebido`/`pendente` or fully `recebido`/`recebido_total`.
- **Over-receipt observed:** total received exceeds total ordered by **+405.980 kg**
  (e.g. row 4: 171.5 vs 146.4; row 7: 1014.55 vs 915.0; row 11: 955 vs 855).
- **Administrative/physical divergence (12 rows):** rows that are administratively
  `rascunho` yet carry legacy `status='recebido_total'` with `kg_recebido=kg_pedido`
  — *received-without-emission* (Class D below).

**Class composition (observed):**

| Class | Definition | Rows |
|---|---|---:|
| A | `legado`, `emitida`, `recebido` | 27 |
| B | `legado`, `emitida`, `nao_recebido` | 12 |
| C | `rascunho`, legacy `status='pendente'`, no receipt | 13 |
| D | `rascunho`, legacy `status='recebido_total'`, `kg_recebido=kg_pedido` (anomaly) | 12 |
| **Total** | | **64** |

**Events (Task 3):** the events and receipt-ledger tables are empty → the
refoundation's event design is **unconstrained by history** (nothing to preserve or
re-point).

---

## 2. Rejected conversion models

Two models were derived and **rejected**. Recorded here so the rejection is durable.

### 2.1 The 14-header model — REJECTED
Grouping key: `( COALESCE(pedido_id,'op:'||op_id) , fornecedor_id )` with
**`fornecedor_id IS NULL` collapsed into the pedido/OP bucket**. This merged all of a
pedido's supplier-less rows into a single header (e.g. cotton-cor1 + cotton-cor2 +
polyester-PRETO + polyester-BRANCO → one header).
**Rejected:** `fornecedor_id IS NULL` means *supplier unrecorded*, not *same
supplier*. Collapsing on NULL **fabricates a shared commercial purchase-order
identity the source data does not prove**. NULL is never a merge key.

### 2.2 The 50-header model — REJECTED
Grouping key: merge only when `(pedido_id, fornecedor_id)` are both non-NULL and
equal (which merged OP36 rows 139+140 into one supplier-22 header); everything else
1:1.
**Rejected:** a shared `(pedido_id, fornecedor_id)` proves only that the two rows
**would accumulate into the same active draft if created under the future native
model** — a *draft-accumulation* property. It does **not** prove they were **one
historical commercial purchase order**. The legacy model treated each material/color
row as a whole order; there is **no shared legacy order id, issuance event, receipt
event, or document** linking rows 139 and 140. `(pedido_id, fornecedor_id)` is not a
historical identity key, and after issuance multiple orders may legitimately exist for
the same pedido + supplier.

---

## 3. Architect-ratified conversion policy

**Ratified rule (2026-07-18):**
> **Every header-bearing legacy source row converts 1:1 into its own legacy
> purchase-order header. No legacy rows are ever automatically merged. Class C clean
> drafts convert to `necessidade_compra_fio` only and create no header.**

### 3.1 Per-class rules
- **Class A (27):** one legacy header **per source row**. `fornecedor_id` stays NULL
  when absent. Emission + receipt facts preserved; imported receipt quantities remain
  auditable.
- **Class B (12):** one legacy header **per source row**. `fornecedor_id` stays NULL.
  Emitted/unreceived state preserved. Native emission rules (supplier-required at
  emission) are **not** applied retroactively to invalidate these grandfathered rows.
- **Class C (13):** convert to **`necessidade_compra_fio` only — no header, no item,
  no allocation.** These are undistributed requirements, not established purchase
  orders.
- **Class D (12):** one legacy header **per source row, including rows 139 and 140**.
  Preserve the **physical receipt**; preserve the original **`rascunho` administrative
  state as source provenance** (*received-without-emission*). Do **not** normalize into
  a clean native draft; do **not** fabricate an emission or acceptance event. Converted
  Class-D records **must not** be eligible for native draft accumulation, editing or
  emission as if they were ordinary active drafts. (PART 1 defines the concrete
  persistence mechanism for this invariant and how the imported physical receipt
  participates in the future ledger-derived `kg_recebido`.)

### 3.2 OP36 — legacy conversion vs future native behavior (kept distinct)
| | Result | Why |
|---|---|---|
| **LEGACY CONVERSION** (this migration) | **4 headers** — supplier 4 (row 137), supplier 5 (row 138), supplier 22 (row 139), supplier 22 (row 140) | Each source row was a complete purchase order in the old model; no shared historical order identity exists — so even the two supplier-22 rows convert separately. |
| **FUTURE NATIVE** (if created new) | **3 headers** — supplier 4 (1 item), supplier 5 (1 item), supplier 22 (**1 header, 2 items**) | Native creation follows the draft-accumulator model: one active draft per pedido + supplier. |

Migration preserves historical identity; native creation follows the accumulator
model. **The two must never be conflated.**

### 3.3 Supplier nullability
`fornecedor_id` may be NULL **only** for grandfathered converted legacy headers whose
source lacks a supplier. Native drafts and native purchase orders **require** a
supplier. NULL-supplier legacy headers **do not** participate in the native unique
active-draft rule. **NULL is never a legacy merge key.**

### 3.4 Origin cardinality
Pedido is **header-level** ownership. **OP origin is preserved at the
`necessidade_compra_fio` / `ordem_compra_item_alocacao` (allocation) level**, never at
header level — a native order may eventually contain allocations from multiple OPs of
the same pedido. Legacy conversion is 1:1 regardless of this future capability. (In
this corpus every header maps to a single OP, so it does not bite here, but the rule
holds generally.)

### 3.5 Over-receipt
Ratified: an item may physically receive more than `kg_pedido`. Allocation against
purchase needs **must not double-count** the surplus; quantity beyond the attributable
need routes to **`saldo_fios`** as general stock. The observed **+405.980 kg** proves
this path is required.

---

## 4. Ratified reconciliation counts

| Class | Needs | Headers | Items | Allocations |
|---|---:|---:|---:|---:|
| A | 27 | 27 | 27 | 27 |
| B | 12 | 12 | 12 | 12 |
| C | 13 | 0 | 0 | 0 |
| D | 12 | 12 | 12 | 12 |
| **Total** | **64** | **51** | **51** | **51** |

Every physical row yields exactly one need. Every header-bearing row (all except the
13 Class-C rows) yields exactly one header, one item, one allocation. **No row is
merged.**

---

## 5. Merge-safety (Task 5)

No merge is performed, so no merge can combine rows of different pedido, supplier,
administrative state, acceptance state, cancellation state, receipt state, legacy
provenance, or commercial identity. The classic hazards are also absent in the data:
**0 cancelled rows, 0 partial receipts, 0 administratively-divergent
`(pedido,fornecedor)` groups.** The only real integrity concern — Class D's
received-without-emission divergence — is handled by preserving both facts (§3.1),
not by merging.

---

## 6. Production facts NOT established (binding precondition)

Production's current `ordens_compra_fio` row-set was **not** revalidated in this
session and is **UNKNOWN for migration purposes**. Historical evidence that production
originally started empty (M3 exclusion set) **does not replace a contemporaneous
diagnosis**. **A complete read-only production diagnosis is mandatory immediately
before any production promotion or migration involving this track.** Production access
remains prohibited in the current phase.

---

## Appendix — full per-row listing (64 rows, no sampling)

`pedido` = first 8 chars; `—` = NULL. `adm`=administrativo, `rec`=recebimento
(derived), `leg`=legacy `status`. Legacy conversion = **1 header per row** for classes
A/B/D; class C rows produce **needs only**.

| id | op | pedido | forn | tipo | cor | adm | rec | leg | kg_ped | kg_rec | class |
|--:|--:|--|--:|--|--|--|--|--|--:|--:|--|
| 1 | 1 | — | — | algodao | cor1 | emitida | recebido | recebido_total | 860.100 | 860.100 | A |
| 2 | 1 | — | — | algodao | cor2 | emitida | recebido | recebido_total | 1738.500 | 1738.500 | A |
| 3 | 1 | — | — | algodao | cor3 | emitida | recebido | recebido_total | 1024.800 | 1024.800 | A |
| 4 | 1 | — | — | algodao | cor6 | emitida | recebido | recebido_total | 146.400 | 171.500 | A |
| 6 | 1 | — | — | poliester | BRANCO | emitida | recebido | recebido_total | 880.650 | 880.650 | A |
| 5 | 1 | — | — | poliester | PRETO | emitida | recebido | recebido_total | 880.650 | 880.650 | A |
| 7 | 2 | — | — | algodao | cor1 | emitida | recebido | recebido_total | 915.000 | 1014.550 | A |
| 8 | 2 | — | — | algodao | cor2 | emitida | recebido | recebido_total | 1830.000 | 1911.330 | A |
| 9 | 2 | — | — | algodao | cor3 | emitida | recebido | recebido_total | 915.000 | 915.000 | A |
| 11 | 2 | — | — | poliester | BRANCO | emitida | recebido | recebido_total | 855.000 | 955.000 | A |
| 10 | 2 | — | — | poliester | PRETO | emitida | recebido | recebido_total | 855.000 | 955.000 | A |
| 123 | 91 | 35c5bcfd | — | algodao | cor1 | emitida | recebido | recebido_total | 549.000 | 549.000 | A |
| 124 | 91 | 35c5bcfd | — | algodao | cor2 | emitida | recebido | recebido_total | 549.000 | 549.000 | A |
| 126 | 91 | 35c5bcfd | — | poliester | BRANCO | emitida | recebido | recebido_total | 256.500 | 256.500 | A |
| 125 | 91 | 35c5bcfd | — | poliester | PRETO | emitida | recebido | recebido_total | 256.500 | 256.500 | A |
| 131 | 93 | 60ff0642 | — | algodao | cor1 | emitida | recebido | recebido_total | 549.000 | 549.000 | A |
| 132 | 93 | 60ff0642 | — | algodao | cor2 | emitida | recebido | recebido_total | 549.000 | 549.000 | A |
| 134 | 93 | 60ff0642 | — | poliester | BRANCO | emitida | recebido | recebido_total | 256.500 | 256.500 | A |
| 133 | 93 | 60ff0642 | — | poliester | PRETO | emitida | recebido | recebido_total | 256.500 | 256.500 | A |
| 107 | 53 | 7cc6a074 | — | algodao | cor1 | emitida | recebido | recebido_total | 183.000 | 183.000 | A |
| 108 | 53 | 7cc6a074 | — | algodao | cor2 | emitida | recebido | recebido_total | 183.000 | 183.000 | A |
| 110 | 53 | 7cc6a074 | — | poliester | BRANCO | emitida | recebido | recebido_total | 85.500 | 85.500 | A |
| 109 | 53 | 7cc6a074 | — | poliester | PRETO | emitida | recebido | recebido_total | 85.500 | 85.500 | A |
| 127 | 92 | b5cbf9e1 | — | algodao | cor1 | emitida | recebido | recebido_total | 603.900 | 603.900 | A |
| 128 | 92 | b5cbf9e1 | — | algodao | cor2 | emitida | recebido | recebido_total | 603.900 | 603.900 | A |
| 130 | 92 | b5cbf9e1 | — | poliester | BRANCO | emitida | recebido | recebido_total | 282.150 | 282.150 | A |
| 129 | 92 | b5cbf9e1 | — | poliester | PRETO | emitida | recebido | recebido_total | 282.150 | 282.150 | A |
| 111 | 87 | 5fdb4d9a | — | algodao | cor1 | emitida | nao_recebido | pendente | 33.900 | 0 | B |
| 112 | 87 | 5fdb4d9a | — | algodao | cor2 | emitida | nao_recebido | pendente | 33.900 | 0 | B |
| 114 | 87 | 5fdb4d9a | — | poliester | BRANCO | emitida | nao_recebido | pendente | 16.500 | 0 | B |
| 113 | 87 | 5fdb4d9a | — | poliester | PRETO | emitida | nao_recebido | pendente | 16.500 | 0 | B |
| 115 | 88 | be2edf28 | — | algodao | cor2 | emitida | nao_recebido | pendente | 54.900 | 0 | B |
| 116 | 88 | be2edf28 | — | algodao | cor3 | emitida | nao_recebido | pendente | 54.900 | 0 | B |
| 118 | 88 | be2edf28 | — | poliester | BRANCO | emitida | nao_recebido | pendente | 25.650 | 0 | B |
| 117 | 88 | be2edf28 | — | poliester | PRETO | emitida | nao_recebido | pendente | 25.650 | 0 | B |
| 119 | 89 | fe6a22dc | — | algodao | cor1 | emitida | nao_recebido | pendente | 54.900 | 0 | B |
| 120 | 89 | fe6a22dc | — | algodao | cor2 | emitida | nao_recebido | pendente | 54.900 | 0 | B |
| 122 | 89 | fe6a22dc | — | poliester | BRANCO | emitida | nao_recebido | pendente | 25.650 | 0 | B |
| 121 | 89 | fe6a22dc | — | poliester | PRETO | emitida | nao_recebido | pendente | 25.650 | 0 | B |
| 161 | 99 | 5f0cbaef | — | algodao | cor1 | rascunho | nao_recebido | pendente | 366.000 | 0 | C |
| 162 | 99 | 5f0cbaef | — | algodao | cor2 | rascunho | nao_recebido | pendente | 915.000 | 0 | C |
| 163 | 99 | 5f0cbaef | — | algodao | cor3 | rascunho | nao_recebido | pendente | 549.000 | 0 | C |
| 165 | 99 | 5f0cbaef | — | poliester | BRANCO | rascunho | nao_recebido | pendente | 427.500 | 0 | C |
| 164 | 99 | 5f0cbaef | — | poliester | PRETO | rascunho | nao_recebido | pendente | 427.500 | 0 | C |
| 153 | 97 | b06df8ce | — | algodao | cor1 | rascunho | nao_recebido | pendente | 457.500 | 0 | C |
| 154 | 97 | b06df8ce | — | algodao | cor2 | rascunho | nao_recebido | pendente | 457.500 | 0 | C |
| 156 | 97 | b06df8ce | — | poliester | BRANCO | rascunho | nao_recebido | pendente | 213.750 | 0 | C |
| 155 | 97 | b06df8ce | — | poliester | PRETO | rascunho | nao_recebido | pendente | 213.750 | 0 | C |
| 157 | 98 | c801a798 | — | algodao | cor1 | rascunho | nao_recebido | pendente | 457.500 | 0 | C |
| 158 | 98 | c801a798 | — | algodao | cor2 | rascunho | nao_recebido | pendente | 457.500 | 0 | C |
| 160 | 98 | c801a798 | — | poliester | BRANCO | rascunho | nao_recebido | pendente | 213.750 | 0 | C |
| 159 | 98 | c801a798 | — | poliester | PRETO | rascunho | nao_recebido | pendente | 213.750 | 0 | C |
| 145 | 96 | 478825cb | — | algodao | cor1 | rascunho | nao_recebido | recebido_total | 54.900 | 54.900 | D |
| 146 | 96 | 478825cb | — | algodao | cor2 | rascunho | nao_recebido | recebido_total | 54.900 | 54.900 | D |
| 148 | 96 | 478825cb | — | poliester | BRANCO | rascunho | nao_recebido | recebido_total | 25.650 | 25.650 | D |
| 147 | 96 | 478825cb | — | poliester | PRETO | rascunho | nao_recebido | recebido_total | 25.650 | 25.650 | D |
| 141 | 95 | 9d71d295 | — | algodao | cor2 | rascunho | nao_recebido | recebido_total | 549.000 | 549.000 | D |
| 142 | 95 | 9d71d295 | — | algodao | cor3 | rascunho | nao_recebido | recebido_total | 549.000 | 549.000 | D |
| 144 | 95 | 9d71d295 | — | poliester | BRANCO | rascunho | nao_recebido | recebido_total | 256.500 | 256.500 | D |
| 143 | 95 | 9d71d295 | — | poliester | PRETO | rascunho | nao_recebido | recebido_total | 256.500 | 256.500 | D |
| 137 | 94 | c0331a65 | 4 | algodao | cor2 | rascunho | nao_recebido | recebido_total | 549.000 | 549.000 | D |
| 138 | 94 | c0331a65 | 5 | algodao | cor3 | rascunho | nao_recebido | recebido_total | 549.000 | 549.000 | D |
| 140 | 94 | c0331a65 | 22 | poliester | BRANCO | rascunho | nao_recebido | recebido_total | 256.500 | 256.500 | D |
| 139 | 94 | c0331a65 | 22 | poliester | PRETO | rascunho | nao_recebido | recebido_total | 256.500 | 256.500 | D |

*(OP36 = rows 137/138/139/140 → **4 legacy headers**; the equivalent future native
distribution would be **3** — see §3.2.)*
