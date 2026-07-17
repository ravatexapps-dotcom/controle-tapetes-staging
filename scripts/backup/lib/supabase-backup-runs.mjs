// scripts/backup/lib/supabase-backup-runs.mjs
//
// Writer client for the db/64 RPCs (iniciar_backup_run / finalizar_backup_run),
// BK4.1's service_role-only writer path. Called over PostgREST with the
// service_role JWT — the same authorization mechanism as the admin Edge
// Functions (db/64's own header: "no JWT — same authorization path as
// the admin Edge Functions"), not a raw `SET ROLE` over the psql
// connection. This is a separate secret (SUPABASE_SERVICE_ROLE_KEY) from
// the PG* connection used for pg_dump/psql in lib/pg.mjs.

async function rpc(supabaseUrl, serviceRoleKey, fn, args, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${fn}_response_unparseable_${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`${fn}_http_${res.status}: ${json?.message || json?.error || 'unknown'}`);
  }
  return json;
}

export async function iniciarBackupRun({ supabaseUrl, serviceRoleKey, scope, triggeredBy, retentionClass }, io = {}) {
  return rpc(
    supabaseUrl,
    serviceRoleKey,
    'iniciar_backup_run',
    { p_scope: scope, p_triggered_by: triggeredBy, p_retention_class: retentionClass },
    io,
  );
}

export async function finalizarBackupRun(
  { supabaseUrl, serviceRoleKey, runId, status, bytes, sha256, rowCountManifest, error, destinations },
  io = {},
) {
  return rpc(
    supabaseUrl,
    serviceRoleKey,
    'finalizar_backup_run',
    {
      p_run_id: runId,
      p_status: status,
      p_bytes: bytes ?? null,
      p_sha256: sha256 ?? null,
      p_row_count_manifest: rowCountManifest ?? {},
      p_error: error ?? null,
      p_destinations: destinations ?? [],
    },
    io,
  );
}
