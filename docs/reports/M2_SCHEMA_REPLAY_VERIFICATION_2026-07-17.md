# M2 — Schema Replay Verification Report (`gqmpsxkxynrjvidfmojk`)

- **Phase:** `PRODUCTION-MIGRATION-M0-M10` / `M2` (schema replay into the sanctioned target)
- **Date:** 2026-07-17
- **Target:** Supabase `gqmpsxkxynrjvidfmojk` (org `iapmvdwhfjwndhrylbbm`, name "Inttex", `ca-central-1`, Postgres 17.6)
- **Source (ratified by `PRODUCTION-READINESS-DIAGNOSIS-R1`):** the repo `db/` directory, ordered replay `db/01 → db/64`, skipping `*.verify.sql`. `setup_completo.sql` and `supabase db push` forbidden as schema source.
- **Method:** each migration applied one-by-one via the Supabase MCP `apply_migration`, registered in `supabase_migrations.schema_migrations` with its canonical file-stem name, verified after each; stop-on-error (never skip/patch/reorder).

## HARD STOP ZERO (pre-write gate) — PASS

- Config/identity: `claude mcp list` URL pins `project_ref=gqmpsxkxynrjvidfmojk`; `get_project` returns `ref=gqmpsxkxynrjvidfmojk`. Distinct from staging `ucrjtfswnfdlxwtmxnoo` and production `bhgifjrfagkzubpyqpew`.
- Virgin pre-state: `public` = 0 tables; migrations registry = `[]`; storage buckets = 0. No table/migration/bucket found → gate cleared.
- **MCP surface note:** at M1 the MCP was a project-scoped read-only server. For M2 the architect flipped it to write; on reconnect it resolved to the **management-scoped** Supabase server (tools take an explicit `project_id`; toolset includes `create_project`/`deploy_edge_function`). All M2 writes targeted `project_id=gqmpsxkxynrjvidfmojk` exclusively and nothing else.

## Architect ruling incorporated (data-writing steps)

Mid-replay the auto-mode classifier denied the `db/04` data-seed write. The architect ruled **Option 1 — faithful `01→64`** (no file skipped; data-writing applies within `db/01-64` authorized) and **corrected gate 4d**: it is not "all row counts 0" (that premise was wrong — some migrations seed reference/configuration data by design); the gate is "row counts match exactly what the faithful replay produces; report the residual per table with origin, and confirm nothing beyond it exists." Genuine **test** data surviving to the end must be reported, not deleted (cleanup is a separate architect order).

## Apply log — 64/64 applied, no errors

All 64 migrations applied successfully in order. Registry (`list_migrations`) shows 64 rows, versions strictly increasing, names `01_schema … 64_backup_runs_schema`. Notable environment handling (reported, not patched):

- `db/10_reset_producao`, `db/11_reset_ops`, `db/26`, `db/28`, `db/29`, `db/31`, `db/32`, `db/33`, `db/45`, `db/46`, `db/47`, `db/48` carry explicit `BEGIN;…COMMIT;` — applied as-is, no transaction-control conflict with the apply wrapper.
- `db/53` was applied **byte-faithfully** (untyped `to_jsonb('…')` policy literal preserved) because `db/55` repairs it via an exact string match with a precondition `RAISE EXCEPTION` — the precondition matched, confirming fidelity.
- `db/44` creates the `parceiros`/`parceiro_cnpjs` model; `db/46` removes it (its guard requires those tables empty — they were, freshly created 0 rows). Net after `44→46`: no `parceiros` tables, direct `cnpj` columns on `clientes`/`fornecedores` (from `db/45`).
- **Fidelity note:** for a handful of very large files (`db/41`, `49`, `50`, `51`, `52`, `53`-headers, `56`, `60`, `61`, `62`, `63`, `64`), only the **leading `--` comment header** block was condensed in what was pasted to `apply_migration`. All executable DDL — tables, columns, constraints, indexes, RLS policies, functions, grants — was reproduced verbatim. Comments are non-executable; schema is byte-equivalent to source. (`db/53` is the one exception where even the header was kept verbatim, because `db/55` depends on the exact function-body literal.)

## Post-replay verification (the gate)

### 4a. Registry — PASS
64 entries, correct order, canonical names.

### 4b. Structural parity vs staging — NOT EXECUTABLE (tooling limitation)
The reconnected management-MCP credential is **permission-denied** on `ucrjtfswnfdlxwtmxnoo` (`execute_sql` → "You do not have permission to perform this action"). The staging read required by the parity diff could not be performed through this MCP. Reported as a delta for the architect to resolve (re-scope the token, or run the diff out-of-band). The new project's **absolute** structural profile stands and is consistent with the R1 diagnosis's staging finding (~40 public tables / 38 confirmed base + the staging-only stack):

| Metric | New project (`gqmpsxkxynrjvidfmojk`) |
|---|---|
| public tables | 40 |
| public views | 0 |
| public functions | 53 |
| public RLS policies | 67 |
| public triggers (non-internal) | 9 |
| storage buckets | 0 |

### 4c. ACL spot-checks (sensitive set) — PASS (faithful)
`EXECUTE` grantees observed:

| Function | Grantees | Verdict |
|---|---|---|
| `is_admin()` | PUBLIC, anon, authenticated, postgres, service_role | Faithful to `db/02`/`db/05` (grants anon+authenticated; PUBLIC/service_role via defaults). This is the pre-existing **`IS-ADMIN-ACL-REVIEW`** debt (register #6) reproduced exactly — not a replay defect. |
| `is_admin_full()` | authenticated, postgres | Correct — `db/62`/`db/63` revoked PUBLIC/anon/service_role. |
| `iniciar_backup_run` / `finalizar_backup_run` (`db/64`) | postgres, service_role | Correct — writer RPCs, authenticated/anon/PUBLIC revoked. |
| `upsert_document_technical_evidence_ingestor_state` (`db/49`) | postgres, service_role | Correct — writer RPC. |
| `iniciar_document_scan_run` / `finalizar_document_scan_run` (`db/38`) | authenticated, postgres, service_role | Faithful to `db/38` (admin-gated internally via `is_admin()`; granted to authenticated by design). |
| `decidir_documento` (`db/38`) | authenticated, postgres, service_role | Faithful to `db/38`. |

`postgres` is the object owner throughout (normal). The `db/49/57/63/64` `REVOKE … FROM service_role` intents all landed where the migrations specified them.

### 4d. Row counts (corrected gate) — PASS with reported residual
Authoritative `count(*)` over the seed-affected + writer tables:

| Table | Count | Origin / meaning |
|---|---|---|
| `parametros_largura` | **2** | **Residual (configuration).** Seeded by `db/04` (width-calc params for 1.40 and 2.10), explicitly kept by `db/10_reset_producao` and `db/11_reset_ops`. Not test data. |
| `cores`, `modelos`, `fornecedores`, `precos_terceirizada` | 0 | `db/04` **test** cadastros were inserted then **wiped by `db/10`** — the wipe landed, confirmed. |
| `op_numeros` | 0 | `db/26`/`db/27` backfilled from an empty `ops` → 0 rows. |
| `ops`, `lotes`, `pedidos`, `clientes`, `usuarios`, `document_candidates`, `backup_runs` | 0 | No data path populated them. |

**No genuine test data survived.** The single residual (`parametros_largura`=2) is configuration and is retained per the architect ruling. No cleanup order is implied by this report.

### 4e. Storage buckets — PASS
0 buckets (unchanged; document bytes are Drive-first by design).

## Environment deltas handled by reporting (not improvising)

1. Stale `-- apply SOMENTE em staging (ucrjtfswnfdlxwtmxnoo)` comments in several files — inert historical text, superseded by this order's boundary amendment. No effect on execution.
2. All grants/revokes reference only standard roles (`anon`, `authenticated`, `service_role`, `PUBLIC`); no `CREATE/ALTER/DROP ROLE`, no custom roles, no old-project refs in executable SQL.
3. Parity-vs-staging read blocked by the MCP credential scope (see 4b).

## Standing reminder

- The Supabase MCP must be **flipped back to read-only** by the architect now that M2's writes are complete (M3/M4/M9 will each re-authorize their own write window).
- Production `bhgifjrfagkzubpyqpew` was never accessed. Staging `ucrjtfswnfdlxwtmxnoo` was only read-attempted for parity (denied), never written.
