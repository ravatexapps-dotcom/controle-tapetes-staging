# Ordem de Compra Lifecycle — Phase A (schema + config) Report

- **Phase:** `ORDEM-COMPRA-LIFECYCLE` / Phase `A` (schema + config)
- **Date:** 2026-07-18
- **Order:** "ARCHITECT AUTHORIZATION — ORDEM-COMPRA-PHASE-A (schema + config)" — Sonnet 5 / medium effort, scoped to Phase A exclusively per `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §11 (`RATIFIED`, `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1`). Phases B-E each require their own order.
- **Target:** Supabase `ucrjtfswnfdlxwtmxnoo` (staging/development — the sanctioned target for this order). Production `gqmpsxkxynrjvidfmojk` **not touched**.
- **Branch:** `dev`, created from `work/g28-document-qualification`'s HEAD (`84e2a07`).

## Scope resolution (before implementation)

The order's own bullet enumeration named three schema elements (dimension columns, `ordem_compra_eventos`, config storage) but its SCOPE header cited spec §8's Phase A row as authoritative — and that row explicitly lists a fourth element, `ordem_compra_fio_lancamentos` (the physical-receipt ledger table, shipped empty with no trigger — trigger wiring is Phase C's job). Rather than silently pick a reading, this was surfaced to the architect via a direct question before any SQL was written. **Architect selected: include the ledger table**, matching spec §8's Phase A row. Reasoning for the recommended option: it avoids Phase C also having to create the base table while wiring its trigger, and shipping it now is zero-behavior-change (no trigger, no RPC, "safe to ship and sit unused" per the spec's own framing).

## HARD STOP ZERO (pre-write MCP ref gate) — PASS

The order required confirming the MCP ref before any write. Two Supabase MCP connections are live in this session: a management-scoped one (already connected, pinned to `gqmpsxkxynrjvidfmojk`, read-only per `PROJECT_STATE.md`'s standing record) and a project-scoped `supabase-legacy` server (no `project_id` parameter — pinned via its own connection string, identity not directly introspectable via `list_projects`/`get_project`).

`supabase-legacy` was fingerprinted using row counts unique to the legacy/development database per the `M3` migration closeout record (which excluded these exact rows from the new production project):

| Table | `supabase-legacy` observed | `M3` record for legacy (`ucrjtfswnfdlxwtmxnoo`) | Match |
|---|---|---|---|
| `public.usuarios_eventos` | 9 | 9 (0 in new/production project) | ✅ |
| `public.document_link_revisions` | 8 | 8 (excluded from new/production project) | ✅ |

Both matched exactly — `supabase-legacy` is confirmed pinned to `ucrjtfswnfdlxwtmxnoo` (development/staging), not `gqmpsxkxynrjvidfmojk` (production). No write was issued before this confirmation.

## Migration — `db/65_ordem_compra_lifecycle_schema.sql`

Additive, forward-only, idempotent (`ADD COLUMN IF NOT EXISTS` / `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` / `DROP POLICY IF EXISTS` throughout).

### 1. `public.ordens_compra_fio` — 12 new columns (spec §3.1)

| Column | Type | Default | Purpose |
|---|---|---|---|
| `status_administrativo` | TEXT, `CHECK IN (rascunho, emitida, cancelada)` | `'rascunho'` | Administrative-cycle dimension |
| `status_aceite` | TEXT, `CHECK IN (nao_aplicavel, pendente, aceita, rejeitada)` | `'nao_aplicavel'` | Acceptance dimension |
| `status_recebimento` | TEXT, `CHECK IN (nao_recebido, parcial, recebido)` | `'nao_recebido'` | Receipt dimension (replacement vocabulary for legacy `status`) |
| `aceite_exigido_na_emissao` | BOOLEAN | `NULL` | Freeze snapshot of `ordem_compra_config.exige_aceite` at emission (§2.3) |
| `emitida_em` / `emitida_por` | TIMESTAMPTZ / UUID→`auth.users` | `NULL` | Emission audit |
| `cancelada_em` / `cancelada_por` | TIMESTAMPTZ / UUID→`auth.users` | `NULL` | Cancellation audit |
| `aceite_decidida_em` / `aceite_decidida_por` | TIMESTAMPTZ / UUID→`auth.users` | `NULL` | Acceptance-decision audit |
| `aceite_motivo` | TEXT | `NULL` | Rejection reason / override justification |
| `legado_recebimento_automatico` | BOOLEAN | `FALSE` | Marks every pre-existing row (§3.6 backfill) |

No existing column (`status`, `kg_recebido`, or any other) was dropped, renamed, or type-changed — confirmed by static test.

### 2. `public.ordem_compra_fio_lancamentos` (new, §3.2)

Physical receipt ledger. `kg_recebido NUMERIC(10,3) CHECK (> 0)`, `data_recebimento DATE DEFAULT CURRENT_DATE`, indexed on `ordem_compra_fio_id`. **Shipped empty/unused in this phase** — no trigger (Phase C wires the `AFTER INSERT` recompute trigger), no writer RPC.

### 3. `public.ordem_compra_eventos` (new, §3.4)

Transition audit, `op_eventos` (`db/21`) / `usuarios_eventos` (`db/60`) pattern. `dimensao CHECK IN (administrativo, aceite, recebimento)`, `tipo_evento`, `valor_anterior`/`valor_novo`, `payload JSONB`. No writer exists yet — every write path in spec §4 belongs to Phase B/C.

### 4. `public.ordem_compra_config` (new, §3.5)

Singleton (`id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)`), `exige_aceite BOOLEAN NOT NULL DEFAULT FALSE`, seeded via `INSERT ... ON CONFLICT (id) DO NOTHING`. Dedicated one-row table, not a generic key-value store (Rule 7 of the ratified model).

### RLS/ACL — db/57/63 standard, stated complete (not a delta)

All three new tables: `ENABLE ROW LEVEL SECURITY`; `REVOKE ALL FROM PUBLIC, anon, authenticated`; `GRANT SELECT TO authenticated`; single `FOR SELECT USING (is_admin())` policy; **no** `INSERT`/`UPDATE`/`DELETE` policy for any client role. Every future writer (Phase B/C's `SECURITY DEFINER` RPCs) writes as table owner, bypassing RLS by ownership, never by a permissive policy.

### Binding requirements honored

- **Gap 1 (single transaction):** the `ALTER TABLE` and the §3.6 legacy backfill `UPDATE` execute inside one explicit `BEGIN`/`COMMIT` block — no window exists for a live draft row to be mislabeled by the backfill's `WHERE status_administrativo = 'rascunho'` clause.
- **Gap 2 (revoke direct `UPDATE` on the four dimension columns from `authenticated`)** is explicitly Phase B/C scope per the spec — **not** applied in this migration. Confirmed absent by static test.

### Legacy backfill (§3.6)

Every pre-existing row (39 total, all at the column default `status_administrativo='rascunho'` immediately after `ALTER TABLE`) is marked `status_administrativo='emitida'`, `status_aceite='nao_aplicavel'`, `legado_recebimento_automatico=TRUE`; `status_recebimento` derived from the legacy `status` column (`pendente→nao_recebido`, `recebido_parcial→parcial`, `recebido_total→recebido`). **No `kg_recebido` value rewritten.**

## Registry — before / after

| | Highest migration | Version |
|---|---|---|
| Before | `64_backup_runs_schema` | `20260717125153` |
| After | `65_ordem_compra_lifecycle_schema` | `20260718110246` |

Immediately following `64` with no gap.

## Data state — before / after

| | `ordens_compra_fio` total | `pendente` | `recebido_parcial` | `recebido_total` | New tables |
|---|---|---|---|---|---|
| Before | 39 | 12 | 0 | 27 | None exist |
| After | 39 (unchanged) | — | — | — | `ordem_compra_fio_lancamentos`=0, `ordem_compra_eventos`=0, `ordem_compra_config`=1 |

Post-backfill grouping confirmed live: 27 rows `status_administrativo=emitida / status_aceite=nao_aplicavel / status_recebimento=recebido / legado=true`; 12 rows identical except `status_recebimento=nao_recebido`. Zero bad-mapping rows in either group; zero `NULL kg_recebido` on a `recebido_total` row.

## Verification matrix (`BEGIN…ROLLBACK`, synthetic, cleanup confirmed zero) — 14/14 `OK`

| # | Check | Result |
|---|---|---|
| A1 | Legacy marking: both groups map correctly, 0 bad-mapping rows | OK |
| A2 | New order defaults: `rascunho`/`nao_aplicavel`/`nao_recebido`/`NULL`/`false` | OK |
| A2b | Synthetic event row inserted (owner-level, for role-matrix use) | OK |
| A3 | `ordem_compra_config`: exactly 1 row, `exige_aceite=false` | OK |
| A4a | `ordem_compra_eventos` SELECT as `anon` → `42501` | OK |
| A4b | SELECT as non-admin `authenticated` (random `auth.uid()`) → `0` rows | OK |
| A4c | SELECT as admin `authenticated` → `1` row (sees synthetic event) | OK |
| A5a | `status_administrativo` invalid value → `23514 check_violation` | OK |
| A5b | `status_aceite` invalid value → `23514 check_violation` | OK |
| A5c | `status_recebimento` invalid value → `23514 check_violation` | OK |
| A5d | `ordem_compra_eventos.dimensao` invalid value → `23514 check_violation` | OK |
| A5e | `ordem_compra_config` second row (`id=2`) → `23514 check_violation` | OK |

**Cleanup verified zero** (post-`ROLLBACK` live counts): `ordens_compra_fio=39` (unchanged), `ordem_compra_fio_lancamentos=0`, `ordem_compra_eventos=0`, `ordem_compra_config=1` (the real seed row only).

## Tests

- **Migration smoke:** `tests/ordem-compra-lifecycle-schema.smoke.js`, 12/12 — static assertions covering every new column/default/`CHECK`, all three new tables' shape/index/RLS/grants, the single-transaction wrapper, the backfill mapping, a scope guard (no RPC/trigger/dimension-column `REVOKE`), absence of destructive commands/secrets, and non-regression of `db/63`/`db/64`.
- **Full-suite regression (file-swap method):** purely additive change (one new SQL file, one new test file, zero existing files modified) — regression guaranteed by construction, verified anyway. New test file moved aside → `before`: 3830 tests / 3690 pass / 140 fail. File restored → `after`: 3842 / 3702 pass / 140 fail — exactly `+12` new tests, all passing; the 140 failing test names confirmed byte-identical between runs (`comm -13`/`comm -23` both empty). Pre-existing, unrelated flakiness class (e.g. `write-guard.smoke.js` `ECONNREFUSED 127.0.0.1:8765` against a local `http.server` not running in this session).

## Forbidden scope honored

No RPC (`emitir`/`cancelar`/`decidir_aceite`/`registrar_recebimento_ordem_compra_fio` — all Phase B); no UI; no `.js` file touched; no trigger on `ordem_compra_fio_lancamentos` (Phase C); no `REVOKE` of the dimension columns' `authenticated` write access (Phase B/C, binding gap 2); no production access; no push to `main`.

## Git

- **Technical commit:** `fb0e6cb` — "Add ordem de compra lifecycle schema (Phase A)" (`db/65_ordem_compra_lifecycle_schema.sql`, `tests/ordem-compra-lifecycle-schema.smoke.js`), on `dev`.
- **Pre-existing uncommitted changes** on this worktree (`op-nova.js`, `op-recalculo.js`, `tests/op-nova.smoke.js`, `tests/op-recalculo.smoke.js`, `.gitignore`) predate this phase and were never staged or touched — selective staging by literal path throughout.
- **Docs closeout commit:** this report + `PROJECT_STATE.md` + `AGENT_HANDOFF.md` + `docs/ledgers/G28_LEDGER.md` + `docs/DOCUMENTATION_INDEX.md`, on `dev`.
- **Push:** `git push production dev` authorized by this order (remote backup — `dev` branch only, never `main`).

## STRUCTURAL POLICY COMPLIANCE

- `§7` (size) — both new files well under the acceptable ceiling.
- `§9` (Supabase writes) — no JS write module touched (schema-only phase).
- `§13` (tests) — migration smoke proportional to risk, static allow-list-style assertions, full staging role-matrix via `BEGIN…ROLLBACK` as the real gate.
- `§14` (single scope) — schema/config only, no RPC/UI/trigger/gate mixed in.
- `§15` (Git) — selective staging by literal path, technical commit then a separate docs commit, both on `dev`, no `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/`amend`.
- `§19` — English throughout new code/comments/commit messages.
- No production access (`gqmpsxkxynrjvidfmojk` not accessed, confirmed by the MCP fingerprint above); push to `main` never attempted.

## Next authorizable action

Phase `B` (panel visibility + administrative writes — `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio` RPCs, a precondition-guarded `registrar_recebimento_ordem_compra_fio`, UI badges, and binding gap 2's `REVOKE`), pending its own architect order per spec §8. Phases `C` (receipt rework via the ledger trigger), `D` (gate activation), and `E` (dormant-acceptance checkpoint) remain `NOT AUTHORIZED`, each pending its own order.
