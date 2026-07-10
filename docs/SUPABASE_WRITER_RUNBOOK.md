# Supabase Writer Runbook

This runbook is for the server-side Documents Ingestor CLI only. It never belongs in the Controle de Tapetes frontend.

## Staging Only

Use only the staging project `ucrjtfswnfdlxwtmxnoo`. Before a confirmed write, the local ignored `.env` must contain the staging URL, matching project ref, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_WRITER_ENABLED=true`.

Never use the production project, an anon key, a PostgreSQL password, or a frontend module as the writer credential. Never commit `.env`.

## Generate Local Exports

```bash
npm run export:mapped
npm run write:latest
npm run export:ingestion-events
```

The writer consumes `data/exports/documentos-mapeados.jsonl` and `data/exports/ingestion-events.jsonl`. The canonical events file is generated from SQLite `ingestion_events`; it preserves `ingestion_events.id` as `ingestion_event_id`.

Do not pass `data/outbox/document-events.jsonl` to `sync:supabase`. It is a legacy transport and can lack canonical event IDs.

## Dry Run

```bash
npm run sync:supabase -- --mapped data/exports/documentos-mapeados.jsonl --events data/exports/ingestion-events.jsonl
```

The dry-run validates both JSONLs and reports planned candidates/events without creating a Supabase client or scan run.

## Confirmed Staging Write

```bash
npm run sync:supabase -- --mapped data/exports/documentos-mapeados.jsonl --events data/exports/ingestion-events.jsonl --confirm-supabase-write
```

Verify `scan_run.status=completed`, canonical status values, preserved `document_id` and `ingestion_event_id`, and no residual `running` scan. Re-running the same inputs must not duplicate events.

The writer leaves `pedido_id` and `fornecedor_id` null in this version and never writes `document_decisions`.

## Recovering an Abandoned Scan Lock

The writer creates one `document_scan_runs` row with `status='running'` per source and relies on the partial unique index `document_scan_runs_running_source_uidx` to block concurrent runs. If a run crashes between the insert and its finalization, the row stays `running` and every later run for that source fails with `scan_already_running`.

`--recover-stale` opts into a compare-and-swap recovery **before** the scan run starts. It calls the staging RPC `recuperar_document_scan_runs_travados`, which flips only runs older than the stale window from `running` to `failed`, preserves `started_at`/`source`/`triggered_by`, sets `finished_at`, and records an auditable `error_message` sentinel (`stale_recovered: ...`). It never deletes rows and never touches a run younger than the window.

```bash
npm run sync:supabase -- \
  --mapped data/exports/documentos-mapeados.jsonl \
  --events data/exports/ingestion-events.jsonl \
  --confirm-supabase-write \
  --recover-stale
```

- `--stale-after-minutes <n>` sets the stale window (default `30`; a hard floor of `5` is enforced by both the CLI-side client and the SQL RPC, so a live run is never recovered).
- Recovery requires `--confirm-supabase-write`. In dry-run there is no service-role client, so `--recover-stale` is ignored (the CLI prints a note and `stale_recovery.attempted` stays `false`).
- The result envelope reports `stale_recovery: { attempted, recovered_count }`. A repeatedly non-zero `recovered_count` means runs keep dying before finalizing — investigate the crash, do not just keep recovering.
- Requires migration `db/40_document_scan_runs_stale_recovery.sql` applied to staging. If the RPC is missing, the writer aborts with `migration_40_required` **before** creating any scan run (no blind write).
- Authorization: the RPC accepts `service_role` (writer self-heal) or an authenticated `is_admin()` session (manual unstick from the UI).
