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
