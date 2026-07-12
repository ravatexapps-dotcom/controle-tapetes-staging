import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Contract test for db/49_document_technical_evidences.sql
//
// Static contract assertions over the produced SQL. This phase (G28-B3-B3) is
// offline: no PostgreSQL and no Supabase are touched. Each assertion targets a
// single responsibility of the migration and RPC; there is no single broad
// regex standing in for full validation.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
// tests -> documents-ingestor -> services -> repo root
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const MIGRATION_PATH = resolve(REPO_ROOT, 'db', '49_document_technical_evidences.sql');
const CANDIDATES_MIGRATION_PATH = resolve(REPO_ROOT, 'db', '38_documentos_schema.sql');

const sql = readFileSync(MIGRATION_PATH, 'utf-8');
const sqlLower = sql.toLowerCase();

// Structural SQL only: strip `--` line comments AND `COMMENT ON ... IS '...';`
// documentation statements. Documentation intentionally names prohibited
// tokens (is_current, now(), the sibling tables) to state the contract; those
// must not trip a structural absence check. A COMMENT ON literal may itself
// contain `;`, so the whole literal (`'[^']*'`) is consumed before the
// terminating semicolon.
const structuralSql = sql
  .split('\n')
  .map((line) => {
    const idx = line.indexOf('--');
    return idx >= 0 ? line.slice(0, idx) : line;
  })
  .join('\n')
  .replace(/COMMENT ON[\s\S]*?IS\s*'[^']*'\s*;/gi, '');
const structuralLower = structuralSql.toLowerCase();

// The function body between the outer `$$ ... $$` markers of the RPC.
const rpcBody = (() => {
  const start = sql.indexOf('SET search_path = public, auth');
  const bodyOpen = sql.indexOf('$$', start);
  const bodyClose = sql.indexOf('$$', bodyOpen + 2);
  return sql.slice(bodyOpen + 2, bodyClose);
})();

// The column list declared by `RETURNS TABLE ( ... )`.
const returnsTableColumns = (() => {
  const match = sql.match(/RETURNS TABLE\s*\(([^)]*)\)/i);
  return match ? match[1] : '';
})();

const FUNCTION_NAME = 'upsert_document_technical_evidence_ingestor_state';

describe('db/49 migration file and numbering', () => {
  it('exists at the expected path db/49_document_technical_evidences.sql', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true);
  });

  it('is not applied here: carries the versioned no-apply preamble', () => {
    expect(sqlLower).toContain('nao aplicar');
    // No remote apply / no explicit multi-statement transaction wrapper.
    expect(sqlLower).not.toContain('supabase db push');
  });
});

describe('table public.document_technical_evidences', () => {
  it('creates the child table idempotently', () => {
    expect(sql).toMatch(
      /CREATE TABLE IF NOT EXISTS\s+public\.document_technical_evidences/i,
    );
  });

  it('declares exactly the five required columns', () => {
    expect(sql).toMatch(/\bdocument_id\b/);
    expect(sql).toMatch(/\bevidence_version\b/);
    expect(sql).toMatch(/\btechnical_evidence\b/);
    expect(sql).toMatch(/\borigin\b/);
    expect(sql).toMatch(/\bcreated_at\b/);
  });

  it('types document_id as TEXT NOT NULL', () => {
    expect(sql).toMatch(/document_id\s+TEXT\s+NOT NULL/i);
  });

  it('document_id type matches document_candidates.document_id (TEXT)', () => {
    const candidatesSql = readFileSync(CANDIDATES_MIGRATION_PATH, 'utf-8');
    // The FK parent column is TEXT in db/38; the child mirrors that exactly.
    expect(candidatesSql).toMatch(/document_id\s+TEXT\s+NOT NULL/i);
    expect(sql).toMatch(/document_id\s+TEXT\s+NOT NULL/i);
  });

  it('types evidence_version as INTEGER NOT NULL', () => {
    expect(sql).toMatch(/evidence_version\s+INTEGER\s+NOT NULL/i);
  });

  it('types technical_evidence and origin as JSONB NOT NULL', () => {
    expect(sql).toMatch(/technical_evidence\s+JSONB\s+NOT NULL/i);
    expect(sql).toMatch(/origin\s+JSONB\s+NOT NULL/i);
  });

  it('types created_at as TIMESTAMPTZ NOT NULL', () => {
    expect(sql).toMatch(/created_at\s+TIMESTAMPTZ\s+NOT NULL/i);
  });

  it('uses a composite primary key (document_id, evidence_version)', () => {
    expect(sql).toMatch(
      /PRIMARY KEY\s*\(\s*document_id\s*,\s*evidence_version\s*\)/i,
    );
  });

  it('does not introduce a surrogate id, is_current, decision or status column', () => {
    expect(structuralSql).not.toMatch(/\bid\s+UUID\b/i);
    expect(structuralLower).not.toContain('is_current');
    expect(structuralLower).not.toContain('gen_random_uuid');
  });
});

describe('foreign key to document_candidates', () => {
  it('references public.document_candidates(document_id)', () => {
    expect(sql).toMatch(
      /REFERENCES\s+public\.document_candidates\s*\(\s*document_id\s*\)/i,
    );
  });

  it('cascades on delete of the parent candidate', () => {
    expect(sql).toMatch(
      /REFERENCES\s+public\.document_candidates\s*\(\s*document_id\s*\)\s+ON DELETE CASCADE/i,
    );
  });
});

describe('integrity constraints', () => {
  it('requires a positive evidence_version (>= 1)', () => {
    expect(sql).toMatch(/CHECK\s*\(\s*evidence_version\s*>=\s*1\s*\)/i);
  });

  it('requires technical_evidence to be a JSON object', () => {
    expect(sql).toMatch(
      /CHECK\s*\(\s*jsonb_typeof\(technical_evidence\)\s*=\s*'object'\s*\)/i,
    );
  });

  it('requires origin to be a JSON object', () => {
    expect(sql).toMatch(
      /CHECK\s*\(\s*jsonb_typeof\(origin\)\s*=\s*'object'\s*\)/i,
    );
  });

  it('requires origin to carry the evidenceVersion key', () => {
    expect(sql).toMatch(/origin\s*\?\s*'evidenceVersion'/i);
  });

  it('requires origin.evidenceVersion to be a positive JSON integer', () => {
    // JSON number (rejects numeric strings), and pure positive integer text
    // (rejects decimal, zero, negative).
    expect(sql).toMatch(
      /jsonb_typeof\(origin\s*->\s*'evidenceVersion'\)\s*=\s*'number'/i,
    );
    expect(sql).toContain("(origin ->> 'evidenceVersion') ~ '^[1-9][0-9]*$'");
  });

  it('requires origin.evidenceVersion to equal the evidence_version column', () => {
    expect(sql).toMatch(
      /\(origin\s*->>\s*'evidenceVersion'\)\s*=\s*evidence_version::text/i,
    );
  });
});

describe('created_at is the received snapshot value, never now()', () => {
  it('has no DEFAULT on created_at', () => {
    expect(sql).not.toMatch(/created_at[^\n,]*DEFAULT/i);
  });

  it('contains no now() / datetime() in structural SQL', () => {
    expect(structuralLower).not.toContain('now()');
    expect(structuralLower).not.toContain('datetime(');
  });

  it('inserts the p_created_at parameter verbatim', () => {
    expect(sql).toMatch(/INSERT INTO public\.document_technical_evidences[\s\S]*p_created_at/i);
  });
});

describe('row level security and grants', () => {
  it('enables RLS on the table', () => {
    expect(sql).toMatch(
      /ALTER TABLE\s+public\.document_technical_evidences\s+ENABLE ROW LEVEL SECURITY/i,
    );
  });

  it('exposes an admin-only SELECT policy', () => {
    expect(sql).toMatch(/CREATE POLICY[\s\S]*FOR SELECT[\s\S]*USING\s*\(\s*public\.is_admin\(\)\s*\)/i);
  });

  it('grants no write policy to authenticated users', () => {
    expect(sql).not.toMatch(/CREATE POLICY[^;]*FOR\s+(ALL|INSERT|UPDATE|DELETE)/i);
  });

  it('revokes all from PUBLIC, anon and authenticated on the table', () => {
    expect(sql).toMatch(/REVOKE ALL ON TABLE\s+public\.document_technical_evidences\s+FROM PUBLIC/i);
    expect(sql).toMatch(/REVOKE ALL ON TABLE\s+public\.document_technical_evidences\s+FROM anon/i);
    expect(sql).toMatch(/REVOKE ALL ON TABLE\s+public\.document_technical_evidences\s+FROM authenticated/i);
  });

  it('grants only SELECT to authenticated and nothing to anon', () => {
    expect(sql).toMatch(/GRANT SELECT ON TABLE\s+public\.document_technical_evidences\s+TO authenticated/i);
    expect(sql).not.toMatch(/GRANT[^;]*\bTO anon\b/i);
  });
});

describe('dedicated service_role RPC', () => {
  it(`defines public.${FUNCTION_NAME}`, () => {
    expect(sql).toMatch(
      new RegExp(`CREATE OR REPLACE FUNCTION\\s+public\\.${FUNCTION_NAME}`, 'i'),
    );
  });

  it('declares the five typed parameters', () => {
    expect(sql).toMatch(/p_document_id\s+TEXT/i);
    expect(sql).toMatch(/p_evidence_version\s+INTEGER/i);
    expect(sql).toMatch(/p_technical_evidence\s+JSONB/i);
    expect(sql).toMatch(/p_origin\s+JSONB/i);
    expect(sql).toMatch(/p_created_at\s+TIMESTAMPTZ/i);
  });

  it('is SECURITY DEFINER with an explicit safe search_path', () => {
    expect(sql).toMatch(/SECURITY DEFINER/i);
    expect(sql).toMatch(/SET search_path\s*=\s*public,\s*auth/i);
  });

  it('enforces an internal service_role gate (not the grant alone)', () => {
    expect(rpcBody).toMatch(/auth\.role\(\)\s+IS DISTINCT FROM\s+'service_role'/i);
    expect(rpcBody).toMatch(/RAISE EXCEPTION/i);
  });

  it('does not accept a role or user as a parameter', () => {
    expect(sqlLower).not.toContain('p_role');
    expect(sqlLower).not.toContain('p_user');
  });

  it('revokes execution from PUBLIC, anon and authenticated', () => {
    expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${FUNCTION_NAME}\\([^)]*\\) FROM PUBLIC`, 'i'));
    expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${FUNCTION_NAME}\\([^)]*\\) FROM anon`, 'i'));
    expect(sql).toMatch(new RegExp(`REVOKE ALL ON FUNCTION public\\.${FUNCTION_NAME}\\([^)]*\\) FROM authenticated`, 'i'));
  });

  it('grants execution only to service_role', () => {
    expect(sql).toMatch(new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${FUNCTION_NAME}\\([^)]*\\) TO service_role`, 'i'));
    expect(sql).not.toMatch(
      new RegExp(`GRANT EXECUTE ON FUNCTION public\\.${FUNCTION_NAME}[^;]*TO\\s+(authenticated|anon|public)`, 'i'),
    );
  });
});

describe('idempotency and conflict semantics', () => {
  it('inserts on a new key and reports outcome inserted', () => {
    expect(rpcBody).toMatch(/INSERT INTO public\.document_technical_evidences/i);
    expect(rpcBody).toContain("'inserted'::TEXT");
  });

  it('reports outcome unchanged on an identical repeat', () => {
    expect(rpcBody).toContain("'unchanged'::TEXT");
  });

  it('compares all three content fields before deciding unchanged', () => {
    expect(rpcBody).toMatch(/v_existing\.technical_evidence\s*=\s*p_technical_evidence/i);
    expect(rpcBody).toMatch(/v_existing\.origin\s*=\s*p_origin/i);
    expect(rpcBody).toMatch(/v_existing\.created_at\s+IS NOT DISTINCT FROM\s+p_created_at/i);
  });

  it('raises an exception on a divergent-content conflict', () => {
    expect(rpcBody).toMatch(/RAISE EXCEPTION\s*\n?\s*'technical_evidence_conflict/i);
  });

  it('never uses ON CONFLICT DO UPDATE (no silent overwrite)', () => {
    expect(structuralLower).not.toContain('on conflict');
  });

  it('locks the existing row for a consistent comparison', () => {
    expect(rpcBody).toMatch(/FOR UPDATE/i);
  });
});

describe('minimal return payload', () => {
  it('RETURNS TABLE exposes only document_id, evidence_version and outcome', () => {
    expect(returnsTableColumns).toMatch(/document_id/i);
    expect(returnsTableColumns).toMatch(/evidence_version/i);
    expect(returnsTableColumns).toMatch(/outcome/i);
  });

  it('does not return technical_evidence, origin or any technical payload', () => {
    expect(returnsTableColumns.toLowerCase()).not.toContain('technical_evidence');
    expect(returnsTableColumns.toLowerCase()).not.toContain('origin');
    // The two success paths select only the three contract values.
    expect(rpcBody).toMatch(/RETURN QUERY SELECT v_document_id, p_evidence_version, 'inserted'::TEXT/i);
    expect(rpcBody).toMatch(/RETURN QUERY SELECT v_document_id, p_evidence_version, 'unchanged'::TEXT/i);
  });

  it('restricts outcome to inserted and unchanged (conflict is an exception)', () => {
    const outcomes = [...rpcBody.matchAll(/'(inserted|unchanged|conflict)'::TEXT/gi)].map((m) => m[1].toLowerCase());
    expect(outcomes).toContain('inserted');
    expect(outcomes).toContain('unchanged');
    expect(outcomes).not.toContain('conflict');
  });
});

describe('history and out-of-order versions', () => {
  it('accepts any not-yet-present version without ordering rules', () => {
    // No enforcement that the first version is 1 nor a contiguous sequence.
    expect(sql).not.toMatch(/evidence_version\s*=\s*1\b/);
    expect(sqlLower).not.toContain('max(evidence_version) + 1');
  });

  it('does not create the candidate automatically (FK must reject)', () => {
    expect(sql).not.toMatch(/INSERT INTO\s+public\.document_candidates/i);
  });
});

describe('scope isolation: no other document entities are touched', () => {
  it('does not reference document_decisions, document_events or document_scan_runs', () => {
    expect(structuralLower).not.toContain('document_decisions');
    expect(structuralLower).not.toContain('document_events');
    expect(structuralLower).not.toContain('document_scan_runs');
  });

  it('does not write to document_candidates (only references it via FK)', () => {
    expect(sql).not.toMatch(/(INSERT INTO|UPDATE|DELETE FROM)\s+public\.document_candidates/i);
  });

  it('does not declare global cross-entity atomicity', () => {
    // No explicit SQL transaction block spanning multiple entities.
    expect(sql).not.toMatch(/\bBEGIN\s*;/);
    expect(sqlLower).not.toContain('commit;');
    // The only write target in the migration is the evidence table itself.
    const insertTargets = [...sql.matchAll(/INSERT INTO\s+public\.(\w+)/gi)].map((m) => m[1]);
    expect(new Set(insertTargets)).toEqual(new Set(['document_technical_evidences']));
  });
});
