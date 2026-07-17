// scripts/backup/lib/sanitize.mjs
//
// Secret redaction for the trigger-agnostic database exporter (Camada 3,
// BK4.2). Every string that could reach the console, the backup_runs
// error column, or a thrown Error message must pass through here first.
//
// Two layers, applied together:
//   1. Literal redaction — every known live secret value (PGPASSWORD,
//      SUPABASE_SERVICE_ROLE_KEY, Google client secret/refresh/access
//      token) is stripped verbatim, so even an upstream tool (pg_dump,
//      the Google API) that unexpectedly echoes a secret back in its own
//      error text is still caught.
//   2. Shape-based redaction — a defensive second layer for
//      connection-string, JWT and "password=" shaped fragments, in case
//      a secret reaches here that was never registered in layer 1 (e.g.
//      a typo'd env var reused unexpectedly).
//
// This is deliberately conservative: it is safe to over-redact (a
// message that loses a benign 4+ character substring is still legible),
// never safe to under-redact.

const CONN_STRING_RE = /postgres(?:ql)?:\/\/[^\s"'()]+/gi;
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const PASSWORD_KV_RE = /(password|pwd|secret|token|apikey|api_key)\s*[=:]\s*[^\s&"']+/gi;

/**
 * @param {Array<string|undefined|null>} secrets known live secret values
 * @returns {(text: unknown) => string}
 */
export function buildRedactor(secrets) {
  const literals = [...new Set((secrets || []).filter(s => typeof s === 'string' && s.length >= 4))]
    // Longest first, so a secret that is a substring of another
    // (unlikely, but cheap to guard) never partially unmasks it.
    .sort((a, b) => b.length - a.length);

  return function redact(text) {
    if (text === null || text === undefined) return text;
    let out = typeof text === 'string' ? text : String(text);
    for (const secret of literals) {
      out = out.split(secret).join('[REDACTED]');
    }
    out = out.replace(CONN_STRING_RE, '[REDACTED_CONN_STRING]');
    out = out.replace(JWT_RE, '[REDACTED_JWT]');
    out = out.replace(PASSWORD_KV_RE, (_m, key) => `${key}=[REDACTED]`);
    return out;
  };
}

/** Truncates a sanitized message to a bounded length before persistence (mirrors the watcher's 1000-char error_message convention). */
export function truncate(text, maxLen = 1000) {
  const s = typeof text === 'string' ? text : String(text ?? '');
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}
