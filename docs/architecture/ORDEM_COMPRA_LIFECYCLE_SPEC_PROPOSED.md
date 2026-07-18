# Purchase Order (Ordem de Compra de Fio) Lifecycle — Proposed Spec

> **Status:** `RATIFIED` (2026-07-18, `ORDEM-COMPRA-LIFECYCLE-SPEC-
> RATIFICATION-R1`) — the model, Finding 1's correction (§4/§6/§7(e)), and
> decisions (a)-(g) (§7) are ratified per the architect's ruling recorded in
> §11. Ratification of the model authorizes **no implementation**: no
> schema application, no staging/production action. Phase: `ORDEM-COMPRA-
> SPEC` (docs-only). **Phase A remains `NOT AUTHORIZED`, pending its own
> order.**
> **Precedent:** ratified per the accepted `PURCHASE-ORDER-FOUNDATION-AUDIT`
> and the consolidated architect decisions carried in this track's order.
> **Open governance item (not yet resolved by this ratification):** an
> exhaustive repository/git-history search found no document named
> `PURCHASE-ORDER-FOUNDATION-AUDIT` anywhere in this repo
> (`ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1` review, 2026-07-18). The
> architect is retrieving the original source for verbatim persistence as
> `docs/reports/PURCHASE_ORDER_FOUNDATION_AUDIT_R1_2026-07-18.md`; if
> reported unrecoverable, this banner's "Precedent" line is corrected
> instead to cite the architect's in-chat authorization directly. See §11.
> **Scope of this document:** schema, semantics, gate definition, event
> vocabulary, legacy marking, UI-surface description (conceptual, no mockup —
> mockup gate is the architect's reviewer, now that the model is ratified),
> and phasing for the purchase-order (`ordens_compra_fio`) lifecycle.
> Production gate activation (Phase D) is **specified, not implemented**
> here.
> **Classification:** Contract (design, ratified) — same category as
> `docs/architecture/CAMADA3_BACKUP_CONTRACT.md` and
> `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`. Subject to
> `docs/DOCUMENTATION_INDEX.md` §1/§1d classification once registered.
>
> **AMENDED 2026-07-18 (`ORDEM-COMPRA SPEC AMENDMENT`, architect decision):**
> §6 (UI surface) and §8 (phasing) carry an architect amendment — receipt
> registration moves to the purchase order's own detail screen and the
> OP-screen section becomes a **reader**; Phase B is split into **B1** (OP
> reader section + `emitir`/`cancelar` RPCs + RLS revoke), **B2** (order detail
> screen), and **B3** (orders list screen). See the dated amendment blocks in
> §6 and §8. The ratified model (§1), the write-path contracts (§4), the gate
> definition (§5), and the freeze rule (§2.3) are **unchanged** by this
> amendment.

---

## 0. Current state (evidenced, read-only inventory)

This section grounds the proposal in what exists today, so the schema in §3
is additive against a known baseline, not a guess.

- **Table `public.ordens_compra_fio`** (`db/01_schema.sql:119-138`): one row
  per fio type/color per OP (`tipo IN ('algodao','poliester')`, `cor_id` for
  cotton, `cor_poliester IN ('PRETO','BRANCO')` for polyester — mutually
  exclusive by CHECK). Today's `status` column conflates what this spec
  treats as the **receipt** dimension only: `pendente` /
  `recebido_parcial` / `recebido_total`. There is **no administrative
  dimension** (no draft/emitted/cancelled distinction — a row is
  immediately actionable the instant it is inserted) and **no acceptance
  dimension** at all.
- **Generation site:** `js/screens/op-persistir.js:218-236` —
  `persistirOP` generates one `ordens_compra_fio` row per fio requirement
  (via `window.calcularFiosOP`/`window.montarOrdensCompraFio`,
  `js/calculo-op.js`) at **Abrir OP** (`status === 'aberta'`), with
  `fornecedor_id: null` and `status: 'pendente'`. This is the flow the
  [[yarn-po-generation-open-decision]] memory flags as deferred — this
  spec's Phase A/B answer that question: rows are still generated at Abrir
  OP, but now born `rascunho` (ratified point 5), not implicitly active.
- **Fornecedor assignment:** `atribuirFornecedorFioOp`
  (`js/screens/op-writes.js:50-86`) sets `fornecedor_id` on all rows of a
  given `tipo` for an OP, and upserts the matching `op_fornecedores` row.
  Unaffected by this spec.
- **The single shared receipt writer:** `registrarRecebimentoOrdemFio`
  (`js/screens/op-writes.js:29-43`) — a direct
  `.update({ kg_recebido, data_recebimento, status })` on
  `ordens_compra_fio`, called from two surfaces:
  - `js/screens/op-nova.js:937-960` (`buildOrdemPendenteRow`, inside
    `buildBlocoFios`, the "Insumos — recebimento de fios" card shown on the
    OP screen itself when `op.status === 'aberta'` or `'em_producao'`);
  - `js/screens/pedido-detail-events.js:1587-1676`
    (`buildInsumosTransferForm`), the form rendered **inside the Pedido
    hub's transition modal for the `insumos` stepper stage**
    (`js/screens/pedido-chain-state.js:14,25` — stage key `insumos`, the
    stage this order calls "`aguardando_fios`"). This is the existing
    sub-panel host named in ratified point 9 — it already renders as a
    stacked form (`node`/`saveLabel`/`onSave`) inside the generic
    transition-modal machinery in `pedido-detail-events.js`, not a
    dedicated screen. Both call sites pass the *current* aggregate
    (`kg_pedido`/`kg_recebido`) and both write straight to the mutable
    `status`/`kg_recebido` columns — there is **no ledger of individual
    physical receipts today**, only a running total.
- **No purchase-order event table exists.** `public.op_eventos`
  (`db/21_op_lifecycle_status_eventos.sql:71-81`) and
  `public.usuarios_eventos` (`db/60`/`db/61`) are the two precedent
  append-only audit tables this spec's `ordem_compra_eventos` (§3.4)
  mirrors — same shape (`tipo_evento`, before/after, `payload jsonb`,
  `criado_por`/`criado_em`).
- **No global boolean-config table exists.** The closest precedent is
  `public.parametros_largura` (per-`largura` row config, `db/04`/`db/10`/
  `db/11`), which is not a singleton pattern. §3.5 proposes a dedicated,
  narrowly-scoped singleton table — not a generic config/feature-flag
  engine (Rule 7 of the ratified model explicitly forbids that).
- **Production gate today: none.** "Iniciar produção" is
  `iniciarProducaoOP` / `snapshotSaldoEIniciarProducao`
  (`js/screens/op-recalculo.js:108-163`), which ends in a **direct
  client-side** `supa.from('ops').update({ status: 'em_producao' })`
  (line 163) — no RPC, no server-side check against yarn receipt. Phase D
  (§6) specifies where the gate attaches; it does not change this code.
- **Pedido linkage for the polyester-per-pedido gate:** an OP does not
  carry `pedido_id` directly. The chain is
  `ordens_compra_fio.op_id → ops.lote_id → lotes.pedido_id`
  (`lotes.pedido_id`, set in `montarPayloadLote`,
  `js/screens/op-persistir.js:72-77`). §5.2 uses this join.
- **Supplier write access:** `public.usuarios.fornecedor_id` and
  `meu_fornecedor_id()` already exist (`db/01_schema.sql:60-70`, RLS
  helper per `docs/architecture/CODE_HEALTH_RULES.md` precedent) — this
  spec does **not** grant suppliers any new write (ratified point 10); it
  only avoids schema choices that would preclude wiring that RLS path
  later (open decision (a), §7).

---

## 1. The ratified model — three orthogonal dimensions

A purchase order's state is **not** a single linear status. It is three
independent axes, each with its own vocabulary and its own write path:

| Dimension | Values | Who/what sets it |
|---|---|---|
| **Administrative cycle** | `rascunho` / `emitida` / `cancelada` | Explicit admin action (`emitir`, `cancelar`) |
| **Acceptance** | `nao_aplicavel` / `pendente` / `aceita` / `rejeitada` | Config-gated at emission; then supplier/admin decision |
| **Receipt** | `nao_recebido` / `parcial` / `recebido` | **Derived**, never written directly — computed from the sum of physical registration entries (`ordem_compra_fio_lancamentos`, §3.2) against `kg_pedido` |

These three axes are independently queryable and independently
transition-audited (§3.4). A row's overall "is this actionable" question is
always answered by combining axes, never by a fourth composite status
column — this avoids reintroducing the linear-state-machine shape the
audit rejected.

---

## 2. Dimension semantics

### 2.1 Administrative cycle

- **`rascunho`** — the order's birth state. Created by `persistirOP` at
  Abrir OP (unchanged trigger point), inheriting the calculated
  `kg_pedido`/`tipo`/`cor_*` exactly as today. A `rascunho` order is not
  receivable and not visible to any supplier-facing surface (none exists
  today, but the rule holds for future Phase E). It has no acceptance
  requirement yet (`status_aceite = 'nao_aplicavel'` until emitted) and no
  receipt activity is possible against it.
- **`emitida`** — set by an explicit `emitir` action (admin-only, no
  supplier self-service in this track). Emission is the **single point**
  where the acceptance-config snapshot is taken (§2.2) and is the
  precondition for any registration under §2.3. Irreversible other than
  via `cancelada`.
- **`cancelada`** — set by an explicit `cancelar` action. A cancelled
  order is terminal: no further emission, no further receipt registration.
  §7g covers cancellation with partial receipts already on file.

Transitions: `rascunho → emitida`, `rascunho → cancelada`,
`emitida → cancelada`. No transition returns to `rascunho`.

### 2.2 Acceptance

- **`nao_aplicavel`** — the default, and the permanent value for any order
  whose `aceite_exigido_na_emissao` snapshot (§2.3) was `false`. Never
  transitions away from `nao_aplicavel`.
- **`pendente`** — set automatically the moment an order transitions
  `rascunho → emitida` **if** the config was `true` at that instant
  (§2.3's freeze rule). Blocks receipt registration (Rule 2: an order
  cannot receive while acceptance is outstanding).
- **`aceita`** — reached via an explicit acceptance decision. Unblocks
  receipt registration.
- **`rejeitada`** — reached via an explicit rejection decision. Does
  **not** by itself cancel the administrative cycle (`emitida` stands);
  §7c covers whether an admin override can move a rejected order forward
  without a fresh acceptance.

Transitions: `pendente → aceita`, `pendente → rejeitada`. Whether
`rejeitada → aceita` is reachable (an override) is an open decision
(§7c), not ratified.

### 2.3 Config semantics and the freeze rule

`public.ordem_compra_config` (§3.5) holds exactly one row, `exige_aceite
BOOLEAN NOT NULL DEFAULT FALSE`, surfaced in the admin UI with the label
**"Exigir aceite antes do recebimento da ordem de compra"**.

- **OFF (default):** emission sets `status_aceite = 'nao_aplicavel'`;
  every emitted order can receive immediately.
- **ON:** emission sets `status_aceite = 'pendente'`; receipt is blocked
  until an explicit acceptance.
- **Freeze rule (Rule 4, binding):** the `emitir` action reads
  `ordem_compra_config.exige_aceite` **at the instant of emission** and
  writes it verbatim into `ordens_compra_fio.aceite_exigido_na_emissao`
  (§3.1). That column, not the live config row, governs the order's
  acceptance requirement for its entire remaining lifecycle. Toggling the
  global config **never** retroactively blocks or unblocks an
  already-emitted order — it only changes the snapshot taken by future
  `emitir` calls. A `rascunho` order is unaffected by any config value
  until the moment it is actually emitted (not at draft-creation time).

### 2.4 Receipt (derived)

- **`nao_recebido`** — no `ordem_compra_fio_lancamentos` row exists yet
  for this order (`SUM(kg_recebido) = 0` or no rows).
- **`parcial`** — `0 < SUM(kg_recebido) < kg_pedido`.
- **`recebido`** — `SUM(kg_recebido) >= kg_pedido`.
- Receipt is **never** set by any write path directly — it is maintained
  by a trigger on `ordem_compra_fio_lancamentos` (§3.2) that recomputes
  the parent row's `kg_recebido` (cache) and `status_recebimento`
  (derived enum) after every insert. No configuration, migration, or
  admin action auto-receives an order (Rule 2) — the only way a receipt
  entry is created is the explicit physical-registration writer (§4,
  Phase C).

---

## 3. Schema (PROPOSED)

All changes below are additive/forward-only. Nothing in this section
alters an existing column's type, drops a column, or rewrites existing
row data beyond the one-time legacy-marking backfill in §3.6. Every
column is nullable or defaulted so existing readers keep working
unmodified through Phase A (§6).

### 3.1 `public.ordens_compra_fio` — new columns

```sql
ALTER TABLE public.ordens_compra_fio
  ADD COLUMN status_administrativo TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status_administrativo IN ('rascunho', 'emitida', 'cancelada')),
  ADD COLUMN status_aceite TEXT NOT NULL DEFAULT 'nao_aplicavel'
    CHECK (status_aceite IN ('nao_aplicavel', 'pendente', 'aceita', 'rejeitada')),
  ADD COLUMN aceite_exigido_na_emissao BOOLEAN,           -- NULL until emitted; frozen snapshot
  ADD COLUMN emitida_em TIMESTAMPTZ,
  ADD COLUMN emitida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN cancelada_em TIMESTAMPTZ,
  ADD COLUMN cancelada_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN aceite_decidida_em TIMESTAMPTZ,
  ADD COLUMN aceite_decidida_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN aceite_motivo TEXT,                          -- rejection reason / override justification
  ADD COLUMN status_recebimento TEXT NOT NULL DEFAULT 'nao_recebido'
    CHECK (status_recebimento IN ('nao_recebido', 'parcial', 'recebido')),
  ADD COLUMN legado_recebimento_automatico BOOLEAN NOT NULL DEFAULT FALSE;
```

- `status_recebimento` is the **replacement vocabulary** for today's
  `status` column (`pendente`/`recebido_parcial`/`recebido_total`). The
  existing `status` column is **not dropped** in Phase A — it is frozen
  read-only compatibility surface until Phase C's writer swap, at which
  point new writes stop touching it (dead-column removal, if ever, is its
  own future decision, out of this track's scope).
- `kg_recebido` (existing column) becomes a trigger-maintained cache,
  authoritative source moves to `ordem_compra_fio_lancamentos` (§3.2).

### 3.2 `public.ordem_compra_fio_lancamentos` (new — physical receipt ledger)

```sql
CREATE TABLE public.ordem_compra_fio_lancamentos (
  id                   BIGSERIAL PRIMARY KEY,
  ordem_compra_fio_id  BIGINT NOT NULL REFERENCES public.ordens_compra_fio(id) ON DELETE CASCADE,
  kg_recebido          NUMERIC(10,3) NOT NULL CHECK (kg_recebido > 0),
  data_recebimento     DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao           TEXT,
  criado_por           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ordem_compra_fio_lancamentos_ordem_idx
  ON public.ordem_compra_fio_lancamentos(ordem_compra_fio_id);
```

Append-only by convention (same posture as `document_link_revisions`): no
`UPDATE`/`DELETE` RPC is specified for this table in this track. A
mis-registered receipt is corrected by a compensating future decision,
not by mutating history — out of scope here, flagged for §7 if it
recurs as a real operational need.

A trigger (`AFTER INSERT`) recomputes on the parent row:

```sql
kg_recebido       := (SELECT COALESCE(SUM(kg_recebido), 0)
                      FROM ordem_compra_fio_lancamentos
                      WHERE ordem_compra_fio_id = NEW.ordem_compra_fio_id);
status_recebimento := CASE
  WHEN kg_recebido <= 0            THEN 'nao_recebido'
  WHEN kg_recebido <  kg_pedido    THEN 'parcial'
  ELSE                                  'recebido'
END;
```

### 3.3 `legado_recebimento_automatico` interaction with the ledger

Rows flagged `legado_recebimento_automatico = TRUE` (§3.6) keep their
pre-existing `kg_recebido`/`status_recebimento` values **as a frozen
snapshot** — no retroactive `ordem_compra_fio_lancamentos` rows are
fabricated for them (no invented ledger entries, no rewritten history).
If a legacy order later receives a *new* physical entry (e.g. a
previously-partial legacy order gets a further delivery), that new entry
goes through the same trigger as any other row and the aggregate becomes
ledger-derived **from that point forward**, additively on top of the
frozen legacy baseline (the trigger's `SUM` naturally includes both the
legacy baseline — carried as an implicit opening balance, not a fabricated
row — and any new entries; the exact backfill mechanics are a Phase A
migration-authoring detail, not a semantic change).

### 3.4 `public.ordem_compra_eventos` (new — transition audit, `op_eventos`/`usuarios_eventos` pattern)

```sql
CREATE TABLE public.ordem_compra_eventos (
  id                   BIGSERIAL PRIMARY KEY,
  ordem_compra_fio_id  BIGINT NOT NULL REFERENCES public.ordens_compra_fio(id) ON DELETE CASCADE,
  dimensao             TEXT NOT NULL CHECK (dimensao IN ('administrativo', 'aceite', 'recebimento')),
  tipo_evento          TEXT NOT NULL,   -- e.g. 'emitida', 'cancelada', 'aceite_solicitado',
                                         -- 'aceite_aceito', 'aceite_rejeitado',
                                         -- 'aceite_override_admin', 'recebimento_registrado'
  valor_anterior       TEXT,
  valor_novo           TEXT,
  payload              JSONB NOT NULL DEFAULT '{}'::jsonb,  -- incl. policy-in-force snapshot at emission
  criado_por           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ordem_compra_eventos_ordem_idx
  ON public.ordem_compra_eventos(ordem_compra_fio_id);
```

Every write path in §4 inserts exactly one row here (or one per
`ordem_compra_fio_lancamentos` insert, for the `recebimento` dimension).
Implementation is **specific to purchase orders** — no shared/generic
gate or event engine is introduced (Rule 7); the shape is copied, not
abstracted into a reusable module, so it does not block or complicate
future reuse for an unrelated domain.

### 3.5 `public.ordem_compra_config` (new — singleton config)

```sql
CREATE TABLE public.ordem_compra_config (
  id             SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
  exige_aceite   BOOLEAN NOT NULL DEFAULT FALSE,
  atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.ordem_compra_config (id, exige_aceite) VALUES (1, FALSE);
```

Deliberately a dedicated one-row table, not a generic key-value
config/feature-flag store — consistent with Rule 7 ("build no generic
gate engine") and with this project's existing preference for typed,
purpose-built tables over generic engines (`parametros_largura` is the
nearest precedent, itself not generic).

### 3.6 Legacy marking (backfill, Phase A, one-time)

```sql
UPDATE public.ordens_compra_fio
SET status_administrativo         = 'emitida',
    status_aceite                 = 'nao_aplicavel',
    status_recebimento            = CASE status
                                       WHEN 'pendente'         THEN 'nao_recebido'
                                       WHEN 'recebido_parcial' THEN 'parcial'
                                       WHEN 'recebido_total'   THEN 'recebido'
                                     END,
    legado_recebimento_automatico  = TRUE
WHERE status_administrativo = 'rascunho';  -- i.e. every pre-existing row, run once
```

Every row that existed before this migration is recognized as already
`emitida`/`nao_aplicavel` (the historical flow had no draft/acceptance
concept — every row was born immediately actionable, which is the closest
honest equivalent of "already emitted"). **No row's `kg_recebido` value is
rewritten** — only the new `status_recebimento` vocabulary is derived
from the old `status` value, once, and the legacy flag is set. No
retroactive rewriting of history beyond this one vocabulary mapping.

---

## 4. Write paths (specified; Phase B/C implement)

| Action | Dimension | Precondition | Effect |
|---|---|---|---|
| `emitir_ordem_compra_fio(id)` | administrativo | `status_administrativo = 'rascunho'` | reads `ordem_compra_config.exige_aceite`, snapshots it into `aceite_exigido_na_emissao`, sets `status_administrativo = 'emitida'`, `status_aceite` per §2.3, `emitida_em`/`emitida_por`; inserts `ordem_compra_eventos` |
| `cancelar_ordem_compra_fio(id)` | administrativo | `status_administrativo IN ('rascunho','emitida')` | sets `status_administrativo = 'cancelada'`, `cancelada_em`/`cancelada_por`; inserts `ordem_compra_eventos`; §7g governs partial-receipt interaction |
| `decidir_aceite_ordem_compra_fio(id, decisao, motivo?)` | aceite | `status_aceite = 'pendente'` | sets `aceita`/`rejeitada`, `aceite_decidida_em`/`_por`, `aceite_motivo`; inserts `ordem_compra_eventos` |
| `registrar_recebimento_ordem_compra_fio(id, kg, data, obs?)` | recebimento | `status_administrativo = 'emitida'` **and** `status_aceite IN ('nao_aplicavel', 'aceita')` | inserts `ordem_compra_fio_lancamentos` row (trigger derives §2.4); inserts `ordem_compra_eventos` |

**Corrected 2026-07-18 (Finding 1, `ORDEM-COMPRA-LIFECYCLE-SPEC-
RATIFICATION-R1`):** the receipt precondition originally read
`status_aceite != 'pendente'`, which is also true for `rejeitada` —
a rejected order would have passed the precondition and been able to
receive yarn, directly contradicting ratified point 3 ("receipt blocked
until `aceita`"). Corrected to the explicit allow-list
`status_aceite IN ('nao_aplicavel', 'aceita')` above. The identical wording
in §6's UI-disablement rule is corrected to match (see §6).

All four are the **specific, non-generic** writers this track builds.
`registrar_recebimento_ordem_compra_fio` is the single shared writer
referenced throughout this spec — Phase B introduces it with the
precondition check (still writing the old aggregate columns directly
internally); Phase C swaps its internal implementation to the ledger +
trigger of §3.2/§3.3 without changing its external signature, so nothing
that calls it needs to change between B and C.

---

## 5. Gate query definition (Phase D specifies; does not activate)

"Iniciar produção" (`iniciarProducaoOP`/`snapshotSaldoEIniciarProducao`,
`js/screens/op-recalculo.js:108-163`) is the single attach point. Two
independent sub-gates, both must pass:

### 5.1 Cotton — per-OP

For the OP attempting the transition, for every `cor_id` required by its
saved item distribution:

```sql
SELECT cor_id, SUM(kg_recebido) AS recebido_kg
FROM public.ordens_compra_fio
WHERE op_id = :op_id
  AND tipo = 'algodao'
  AND status_administrativo != 'cancelada'
GROUP BY cor_id;
-- gate passes for a color when recebido_kg >= required_kg_for_that_color
```

`required_kg_for_that_color` is the OP's own saved distribution
requirement (the same figure `calcularFiosOP`/the recalculo snapshot
already compute today) — this spec does not change that calculation, only
gates on its comparison against the derived receipt aggregate above.

### 5.2 Polyester — per-Pedido (shared PRETO/BRANCO orders gate all the pedido's OPs together)

```sql
SELECT ocf.cor_poliester, SUM(ocf.kg_recebido) AS recebido_kg
FROM public.ordens_compra_fio ocf
JOIN public.ops   ON ops.id = ocf.op_id
JOIN public.lotes ON lotes.id = ops.lote_id
WHERE lotes.pedido_id = :pedido_id
  AND ocf.tipo = 'poliester'
  AND ocf.status_administrativo != 'cancelada'
GROUP BY ocf.cor_poliester;
-- gate passes for a color when recebido_kg >= SUM of required_kg for that
-- color across every tecelagem OP under this pedido (architect decision:
-- option (a) — shared PRETO/BRANCO orders gate all the pedido's OPs together)
```

Because this is a shared, pedido-wide pool, a single OP's "Iniciar
produção" for polyester can be blocked by another OP under the same
pedido still awaiting its share of a shared PRETO/BRANCO order — this is
the ratified behavior (option (a)), not a bug to fix later.

**Enforcement note (flagged, not resolved by this spec):** the current
`iniciarProducaoOP` call site is a direct client-side
`supa.from('ops').update(...)` with no RPC in front of it. Wiring the gate
only in the UI (disabling the button) would repeat the shape of the
already-registered `A2-SERVER-SIDE-ENFORCEMENT` debt (client-side-only
enforcement, bypassable from a direct API call). Phase D should wire the
gate behind a `SECURITY DEFINER` RPC (or extend `alterar_status_op`'s
existing transition-validation path) rather than only disabling the
button — this is a Phase D implementation decision, recorded here so it
is not silently dropped when D is authorized.

---

## 6. UI surface (conceptual — mockup gate is the architect's reviewer, after ratification)

> **AMENDED 2026-07-18 (`ORDEM-COMPRA SPEC AMENDMENT`, architect decision).**
> The single-section UI-surface description below is **superseded** on the
> question of *where receipt registration lives and what the OP screen shows*.
> The ratified three-dimension model (§1), the write-path contracts (§4), the
> gate definition (§5), and the freeze rule (§2.3) are **unchanged**. The
> original bullets are retained below for provenance; where they conflict with
> this block, **this block governs**.
>
> **Separation of responsibilities (the ruling).**
> - **Receipt registration (`lançamentos`: quantity, date, partial deliveries)
>   lives on the purchase order's own detail screen** — receipt is a fact about
>   the *purchase*, not the production. This also future-proofs supplier
>   acceptance (their own surface) and multi-OP / `saldo` sharing (received
>   quantity on a shared PRETO/BRANCO order is not owned by any single OP).
> - **The OP screen's section becomes a reader.** It shows the linked orders
>   with their administrative/dimension badges and the available yarn per color
>   (sum of received across the linked orders + `saldo`). **It registers
>   nothing.**
> - **Distribution sliders, `Salvar distribuição`, and `Iniciar produção` stay
>   on the OP screen** (production decisions). The production gate (Phase D)
>   reads availability from the orders' received totals (§5), not from any input
>   on the OP screen.
>
> **Three surfaces (replacing the single-section description below).**
> - **(a) OP detail screen section (reader + admin-cycle actions)** — Phase
>   **B1**. One row per linked order: material—cor, fornecedor (`— não
>   atribuído` when unset), quantity (received/ordered when partial), the three
>   dimension badges, and the administrative actions (Emitir on `rascunho`,
>   Cancelar on `rascunho`/`emitida`; `cancelada`/legacy rows carry no action).
>   **No receipt registration in this section.** Materials are cotton and
>   polyester only.
> - **(b) Purchase order detail screen** (route `#/ordens-compra/:id`) — the
>   entity's home: full dimensions, emitir/cancelar, receipt registration +
>   `lançamento` history, event history; future home of supplier acceptance.
>   Phase **B2** builds the screen (emitir/cancelar actions live there too; the
>   receipt-registration UI is present but wired in Phase C).
> - **(c) Purchase orders list screen** (sidebar menu, all orders, filterable)
>   — Phase **B3**, later.
>
> **The single shared writer is unchanged in kind** — receipt registration is
> still one writer (§4's `registrar_recebimento_ordem_compra_fio`); the
> amendment only moves its *entry point* from the `insumos` sub-panel to the
> purchase order detail screen (Phase C). Until Phase C swaps it, the existing
> `insumos` receipt inputs (`buildOrdemPendenteRow` / `buildInsumosTransferForm`)
> remain as-is.

No mockup is produced here (Supervision Protocol gate: approved mockup
precedes new visual elements). This section states *where* and *what*,
not final visuals.

- **Host:** the existing `insumos` transition-modal sub-panel
  (`buildInsumosTransferForm`, `pedido-detail-events.js:1587-1676`) and
  the OP-screen twin (`buildBlocoFios`, `op-nova.js:975-...`,
  `buildOrdemPendenteRow`, `op-nova.js:937-960`). **Not** a new pedido
  stage — the `insumos` stepper stage (`pedido-chain-state.js:14,25`)
  is unchanged; **not** a detached CRUD screen.
- **New affordances, control-panel language** (reusing the existing pill/
  badge tokens already in use elsewhere — `PILL_BASE`,
  `--rv-status-*`/`--rv-stage-*` tokens seen in
  `op-tecelagem-producao-admin.js` — rather than inventing new visual
  language, per the Future Requirements section's standing instruction):
  - an administrative-cycle badge (`Rascunho`/`Emitida`/`Cancelada`) per
    order row;
  - an "Emitir" action on `rascunho` rows, a "Cancelar" action on
    `rascunho`/`emitida` rows;
  - when `aceite_exigido_na_emissao = true`, an acceptance badge
    (`Aguardando aceite`/`Aceita`/`Rejeitada`) and the accept/reject
    affordance (admin-on-behalf per open decision (b), §7);
  - the existing receipt-registration inputs
    (`buildOrdemPendenteRow`/`buildInsumosTransferForm`'s per-row kg
    input) become disabled with an explanatory label whenever
    `status_administrativo != 'emitida'` or
    `status_aceite NOT IN ('nao_aplicavel', 'aceita')` (corrected 2026-07-18,
    Finding 1 — the original `status_aceite = 'pendente'` wording left a
    `rejeitada` order's input enabled), instead of silently accepting the
    write as today.
- **Client Portal (`cliente_pedido_summary`) unaffected** — purchase-order
  detail is an internal/admin concern; the ratified model does not add
  any new field to the client-facing DTO. Stage list the client sees is
  unchanged.

---

## 7. Open architect decisions (for ratification — each with a recommendation)

**(a) Fornecedor accepts own order (future) — precedence rules.**
Recommendation: out of scope for this track (Rule 10 — no supplier write
access here). When authorized, precedence should be "supplier decision is
authoritative unless overridden by admin" (mirrors (b)/(c) below), decided
in its own future track once `meu_fornecedor_id()`-gated RLS is designed
for `ordens_compra_fio`.
**Ratified 2026-07-18 — deferral confirmed;** the future precedent as
specced (supplier authoritative unless admin overrides) is recorded as
guidance for that future track, not a binding rule of this one.

**(b) Admin accepts on supplier's behalf — always allowed?**
Recommendation: yes, always allowed in this track, since no supplier
self-service path exists yet — admin-on-behalf is the *only* acceptance
path until (a) is built. This is not really open under current scope; it
becomes a real question only once (a) exists.
**Ratified YES, 2026-07-18 — unconditionally.** Hard dependency
acknowledged: until (a) ships, 100% of acceptance events are
admin-authored, and the audit trail showing that is **correct, not a
smell.**

**(c) Admin overriding a rejection — allowed? audited how?**
Recommendation: allow via a distinct `aceite_override_admin` event type
(already in §3.4's vocabulary) rather than silently re-running
`decidir_aceite_ordem_compra_fio` — the override must record
`aceite_motivo` as mandatory (not optional) when overriding a prior
`rejeitada`, so the audit trail distinguishes "first decision" from
"admin overrode a rejection."
**Ratified as recommended, 2026-07-18.** A wrongly-rejected order needs a
recovery path; the distinct event keeps first-decision and override
distinguishable forever.

**(d) Who can undo an acceptance, and until when.**
Recommendation: no undo path in this track. An accepted order that turns
out wrong should be handled via cancellation (§2.1) plus a new
replacement order, not a reversible acceptance — mirrors this project's
existing preference for append-only correction over in-place rewrite
(`document_link_revisions`, `ordem_compra_fio_lancamentos` itself).
**Ratified as recommended, 2026-07-18** — no undo path; cancel + new
draft.

**(e) Acceptance after partial receipt — permitted?**
Recommendation: cannot arise under this spec's own gate
(`registrar_recebimento_ordem_compra_fio` requires
`status_aceite IN ('nao_aplicavel', 'aceita')` before any receipt
registration, §4 — corrected 2026-07-18, Finding 1), so a partial receipt
implies acceptance already happened (or was never required). No separate
rule needed unless a future track changes the precondition ordering.
**Ratified as recommended, 2026-07-18, contingent on Finding 1's
correction being applied** (it is, as of this ratification).

**(f) Order modification after emission — invalidates acceptance?
invalidates receipts? or emission locks quantities?**
Recommendation: **emission locks quantities** (`kg_pedido` becomes
immutable once `status_administrativo != 'rascunho'`) — no in-place
modification of an emitted order. A quantity change after emission is a
cancellation + new draft, not an edit. This keeps the freeze rule (§2.3)
and the receipt gate (§5) simple: an emitted order's `kg_pedido` is a
fixed target for the remainder of its life.
**Ratified as recommended, 2026-07-18 — ruled now, not deferred:**
changing this after Phase B ships would break the `emitir` RPC's contract,
so it is decided as part of this ratification rather than left open.

**(g) Cancellation with partial receipts — what happens to the received
quantity in `saldo_fios`?**
Recommendation: cancellation does not reverse or delete already-recorded
`ordem_compra_fio_lancamentos` rows (append-only, §3.2) — physically
received yarn already exists in the warehouse regardless of the
paperwork's administrative state. `saldo_fios`/`saldo_fios_op` (existing
tables, out of this schema's direct scope) should continue to reflect the
received kg as-is; cancellation only stops *further* registration
(`registrar_recebimento_ordem_compra_fio`'s precondition already blocks
`cancelada` rows via `status_administrativo = 'emitida'` in §4). This
needs explicit confirmation from whoever owns the `saldo_fios` write path
before Phase C ships, since this spec does not audit that table's own
triggers.
**Ratified as recommended, 2026-07-18** — ledger entries never reverse;
`saldo_fios` reflects physically received kg regardless of administrative
state (the physical world does not un-happen because paperwork changed).
The still-open `saldo_fios` write-path confirmation is folded into the
Phase C order as an explicit verification step; the architect pre-confirms
the principle here and retains the ruling on that confirmation's outcome.

---

## 8. Phasing — each phase shippable to production alone

| Phase | Content | Blast radius |
|---|---|---|
| **A — Schema + config** | §3.1-§3.6: additive columns (all defaulted/nullable), two new tables (`ordem_compra_fio_lancamentos`, `ordem_compra_eventos`), one new singleton (`ordem_compra_config`, seeded `exige_aceite=false`), one-time legacy-marking backfill (§3.6). No trigger wired yet (§3.2's trigger ships in Phase C, not A — see below), no RPC, no UI, no JS change. **Binding requirement (ratified 2026-07-18, gap 1):** the `ALTER TABLE` and the §3.6 legacy backfill `UPDATE` MUST execute in one migration file, one transaction — no window may exist for a live draft row (created between the two statements) to be mislabeled `emitida`/legacy by the backfill's `WHERE status_administrativo = 'rascunho'` clause. | Schema-only. Zero behavior change: `registrarRecebimentoOrdemFio` keeps writing the old `status`/`kg_recebido` columns exactly as today; every existing reader is unaffected. Safe to ship and sit unused. |
| **B — Panel visibility + administrative writes** | `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio` RPCs (§4); `op-persistir.js` continues generating rows unchanged (they land `rascunho` by Phase A's column default — no code change needed there); a minimal precondition guard added to `registrar_recebimento_ordem_compra_fio` (new RPC, still writing the old aggregate columns internally, not yet ledger-based) so an unemitted order cannot receive; UI badges + Emitir/Cancelar actions in the `insumos` sub-panel (§6). **Binding requirement (ratified 2026-07-18, gap 2):** this order MUST also revoke direct `UPDATE` on `kg_recebido`/`status_recebimento`/`status_administrativo`/`status_aceite` from `authenticated` — the four RPCs in §4 (`SECURITY DEFINER`) become the only writers of these columns. "Single shared writer" must be an **enforced invariant**, not a convention, per the `ANON-GRANT-DEFENSE-IN-DEPTH` lesson. | **Behavior change, contained:** newly opened OPs' yarn orders now require an explicit "Emitir" before they are receivable — this is the ratified behavior (Rule 5), but it is a real workflow change for whoever registers receipts today, and must be called out to the architect/operations before shipping, not just to code review. No change to already-emitted legacy rows (§3.6 marks them `emitida` already). |
| **C — Receipt rework via the single shared writer** | `ordem_compra_fio_lancamentos` trigger (§3.2) goes live; `registrar_recebimento_ordem_compra_fio`'s internal implementation swaps from direct aggregate-column writes to ledger inserts (external signature unchanged from Phase B — callers do not change); `js/screens/op-writes.js`'s `registrarRecebimentoOrdemFio` becomes a thin client-side wrapper calling the RPC instead of `.update()` directly. Carries forward Phase B's gap-2 RLS-revoke requirement if not already applied. **Includes, per decision (g)'s ratification:** an explicit verification step confirming the `saldo_fios`/`saldo_fios_op` write path's behavior on cancellation-with-partial-receipts matches the ratified principle (ledger entries never reverse). | Additive schema (new table + trigger) + one internal JS rewrite behind an unchanged call signature. No caller (`op-nova.js`, `pedido-detail-events.js`) needs to change. Legacy rows (§3.3) are unaffected until/unless a new entry is registered against one. |
| **D — Gate activation** | Wires §5's two gate queries into the "Iniciar produção" path (`op-recalculo.js:108-163`), per the server-side-enforcement note in §5. | **Behavior change:** OPs/pedidos with insufficient received yarn can no longer start production, where today the client-side flow does not check this at all. Requires explicit before/after operational confirmation (production-flow-affecting) — recommended as its own authorization, not bundled with C. |
| **E — Dormant acceptance structure** | No new code shipped. This phase is a checkpoint: confirms `status_aceite`/`aceite_exigido_na_emissao`/`ordem_compra_eventos` are exercised end-to-end with `exige_aceite=false` (the default), so the acceptance dimension is proven dormant-but-correct before any future track turns the config on or builds supplier-side acceptance (open decision (a)). | None — verification-only, read-only against Phases A-D's already-shipped state. |

Each phase is independently authorizable, per this project's standing rule
that phases do not chain automatically
(`docs/governance/SUPERVISION_PROTOCOL.md` §3). Ratification of this
document authorizes none of them by itself.

### Amendment 2026-07-18 (`ORDEM-COMPRA SPEC AMENDMENT`) — Phase B split into B1/B2/B3; receipt entry point relocated

Per the §6 ruling above, the single **Phase B** row of the table is
**superseded** by the following breakdown. The ratified per-phase blast-radius
reasoning is unchanged; only the surface allocation and the receipt entry point
move. Phases **D** and **E** are **unchanged** from the table above.

| Phase | Content | Notes |
|---|---|---|
| **B1 — OP section (reader) + administrative RPCs + RLS revoke** | `emitir_ordem_compra_fio` / `cancelar_ordem_compra_fio` RPCs (§4): `emitir` snapshots `ordem_compra_config.exige_aceite` into `aceite_exigido_na_emissao`, sets `emitida`, writes an `ordem_compra_eventos` row, and carries a **fornecedor-assigned precondition** (an order with no supplier assigned cannot be emitted — additive to §4's `status_administrativo = 'rascunho'` precondition, not a change to it); `cancelar` writes an event row. The OP detail screen section becomes the **reader** described in §6 (badges + Emitir/Cancelar admin actions, no receipt registration). The gap-2 RLS **REVOKE** of direct `UPDATE` on `kg_recebido` / `status_recebimento` / `status_administrativo` / `status_aceite` from `authenticated` (migration `db/66`). The existing `insumos` receipt inputs remain untouched (removed in Phase C). | Carries §8's gap-2 binding requirement (RLS revoke). The receipt precondition guard formerly bundled into "Phase B" moves to the receipt RPC in Phase C. Receipt wording anywhere is `status_aceite IN ('nao_aplicavel','aceita')` (Finding 1). |
| **B2 — Purchase order detail screen** (route `#/ordens-compra/:id`) | Builds the entity's home screen: full dimensions, emitir/cancelar actions (also available here), the receipt-registration UI **present but wired in Phase C**, and event history; future home of supplier acceptance. | The OP section's "ver ordem" affordance (B1) may navigate here; until B2 the route may 404-stub or be omitted. |
| **B3 — Purchase orders list screen** | Sidebar-menu screen listing all orders, filterable. | Later; no receipt logic. |
| **C — Receipt `lançamentos` via the single shared writer** | Unchanged from the table's Phase C, with one clarification: the **entry point** for `registrar_recebimento_ordem_compra_fio` is the **purchase order detail screen** (B2's receipt UI), and the OP section (B1) reflects received totals automatically. The receipt precondition guard (`status_administrativo = 'emitida'` **and** `status_aceite IN ('nao_aplicavel','aceita')`) lives on this RPC. | Also swaps `registrarRecebimentoOrdemFio` to call the RPC and lands the §3.2 trigger, per the table above. |

Phases **D** (gate activation) and **E** (dormant acceptance checkpoint)
remain exactly as in the table above.

---

## 9. Future-requirements alignment (design-shaping constraints honored)

- **Supplier acceptance across OP transitions (tecelagem/acabamento) with
  admin override:** nothing in §3/§4 assumes a single acceptance actor —
  `criado_por`/`aceite_decidida_por` on every event row already
  distinguishes admin-on-behalf from a future supplier-originated
  decision without a schema change; only RLS/UI need to grow later.
- **Identification labels at tecelagem/acabamento exits (future
  transition points):** this track does not touch the stepper
  (`pedido-chain-state.js`) or add a new stage — the `insumos` stage stays
  the sub-panel host, so a future exit-labeling feature is unaffected by
  this spec's schema or UI choices.
- **Control-panel language:** §6 explicitly reuses existing visual tokens
  rather than introducing a new component language.

---

## 10. What this document does not do

- Does not create any table, column, RPC, trigger, or RLS policy.
- Does not touch staging or production Supabase.
- Does not modify any `.js` file.
- Does not authorize Phase A (or any phase). Ratification of the model
  (§11) is a separate act from authorizing implementation — **Phase A
  remains `NOT AUTHORIZED`, pending its own order.**

---

## 11. Ratification record

**`ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1` — 2026-07-18.** The
architect ratified this spec following an independent read-only
architecture review (same date) that validated it against the ratified
model and flagged one confirmed defect and two implementation gaps.

- **Finding 1 (confirmed defect) — corrected.** The receipt precondition
  in §4 and §6 read `status_aceite != 'pendente'`, which also admits
  `rejeitada` — a rejected order could have registered a receipt,
  contradicting the ratified rule that receipt is blocked until `aceita`.
  Corrected in both places to `status_aceite IN ('nao_aplicavel',
  'aceita')`; §7(e)'s citation corrected to match.
- **Decisions (a)-(g) — all ratified**, per the annotations inline in §7:
  (a) deferral confirmed; (b) ratified YES, unconditionally (acknowledged
  hard dependency: 100% admin-authored acceptance until (a) ships is
  correct, not a smell); (c) ratified as recommended (`aceite_override_admin`
  event, mandatory `aceite_motivo`); (d) ratified as recommended (no undo
  path); (e) ratified as recommended, contingent on Finding 1 (satisfied);
  (f) ratified as recommended, **ruled now rather than deferred** — emission
  locking quantities cannot change after Phase B ships without breaking the
  `emitir` RPC contract; (g) ratified as recommended — ledger entries never
  reverse, with the `saldo_fios` write-path confirmation folded into the
  Phase C order as an explicit verification step.
- **Two new gaps, both accepted and folded forward as binding requirements**
  (§8's Phase A and Phase B rows amended accordingly):
  1. Phase A's migration must apply the `ALTER TABLE` and the legacy
     backfill in one transaction, closing the window for a live draft to
     be mislabeled.
  2. Phase B/C's migration must revoke direct `UPDATE` on the four
     dimension-bearing columns from `authenticated`, making the
     `SECURITY DEFINER` RPCs the sole writers — "single shared writer" as
     an enforced invariant, not a convention.
- **Phantom-audit governance item — not resolved by this ratification.**
  The architect's hard stop on reconstructing `PURCHASE-ORDER-FOUNDATION-
  AUDIT` without source was confirmed correct. The architect is retrieving
  the original source for verbatim persistence as
  `docs/reports/PURCHASE_ORDER_FOUNDATION_AUDIT_R1_2026-07-18.md`; if
  reported unrecoverable, the fallback is an honest citation correction
  (spec banner + `PROJECT_STATE.md` cite the architect's in-chat
  authorization directly, no separate artifact claimed). **Neither branch
  has executed yet — this remains open,** tracked in `PROJECT_STATE.md`
  and the ledger, separate from the decisions ratified above.
- **What ratification does and does not authorize:** the model, Finding 1's
  correction, and decisions (a)-(g) are now `RATIFIED` — this is the
  authoritative reference for any future phase order. It does **not**
  authorize Phase A or any other phase; each remains `NOT AUTHORIZED`
  pending its own order, per this project's standing rule that phases do
  not chain automatically.
