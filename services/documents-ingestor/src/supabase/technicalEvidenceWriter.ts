import type { EvidenceOrigin, TechnicalEvidence } from '../types/documentReview.js';
import type { TechnicalEvidenceExportRow } from '../types/technicalEvidenceExport.js';

// ============================================================================
// Technical evidence writer (G28-B3-B4)
//
// A narrow, single-call domain writer over the migration-49 RPC
// public.upsert_document_technical_evidence_ingestor_state.
//
// The Supabase client is injected as a minimal structural port: this module
// never creates a client, reads configuration or environment, touches the
// filesystem/network directly, retries, sleeps, or logs. It performs exactly
// one RPC call per invocation and classifies the relevant remote failures for
// a later sync layer (G28-B3-B5) to consume. Retry and orchestration are not
// this module's concern.
// ============================================================================

/**
 * Parameters of the migration-49 RPC, mapped 1:1 from the local transport row.
 * technicalEvidence and origin are passed as objects (the Supabase client
 * serializes them for transport); they are never stringified here.
 */
export interface TechnicalEvidenceRpcParams {
  p_document_id: string;
  p_evidence_version: number;
  p_technical_evidence: TechnicalEvidence;
  p_origin: EvidenceOrigin;
  p_created_at: string;
}

/** Structural shape of a Supabase/PostgREST error, without importing its type. */
export interface TechnicalEvidenceRpcError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/** Structural shape of a Supabase `.rpc()` resolution. */
export interface TechnicalEvidenceRpcResponse {
  data: unknown;
  error: TechnicalEvidenceRpcError | null;
}

/**
 * Minimal injection port: only the single `.rpc()` this writer needs. A real
 * service-role SupabaseClient satisfies it structurally; tests satisfy it with
 * a hermetic mock. No configuration, environment, or network types leak in.
 */
export interface TechnicalEvidenceRpcClient {
  rpc(
    fn: string,
    params: TechnicalEvidenceRpcParams,
  ): PromiseLike<TechnicalEvidenceRpcResponse>;
}

export type TechnicalEvidenceWriteOutcome = 'inserted' | 'unchanged';

export interface TechnicalEvidenceWriteResult {
  documentId: string;
  evidenceVersion: number;
  outcome: TechnicalEvidenceWriteOutcome;
}

export type TechnicalEvidenceWriterErrorKind =
  | 'conflict'
  | 'writer_required'
  | 'migration_required'
  | 'invalid_response'
  | 'remote_error';

/**
 * Stable domain error. The message is a fixed, payload-free string; the
 * original remote error (if any) is preserved as `cause` for programmatic
 * inspection and is never rendered into the message.
 */
export class TechnicalEvidenceWriterError extends Error {
  readonly kind: TechnicalEvidenceWriterErrorKind;

  constructor(kind: TechnicalEvidenceWriterErrorKind, message: string, cause?: unknown) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'TechnicalEvidenceWriterError';
    this.kind = kind;
  }
}

/** The exact RPC exposed by db/49. The writer calls this and only this. */
const RPC_NAME = 'upsert_document_technical_evidence_ingestor_state';

/**
 * Writes one technical-evidence snapshot through the injected RPC client and
 * returns only the outcome. Exactly one RPC call is made per invocation.
 */
export async function writeTechnicalEvidence(
  client: TechnicalEvidenceRpcClient,
  row: TechnicalEvidenceExportRow,
): Promise<TechnicalEvidenceWriteResult> {
  // Exact 1:1 mapping of the local transport contract to the RPC parameters.
  // schemaVersion belongs to the local transport row, not the RPC signature,
  // and is intentionally omitted. Objects are passed by reference: no manual
  // JSON serialization, no clone, no field rename, no recomputed version or
  // regenerated timestamp. evidenceVersion is already coherent inside origin
  // by the B3-B1 contract and is not re-added here.
  const params: TechnicalEvidenceRpcParams = {
    p_document_id: row.documentId,
    p_evidence_version: row.evidenceVersion,
    p_technical_evidence: row.technicalEvidence,
    p_origin: row.origin,
    p_created_at: row.createdAt,
  };

  const { data, error } = await client.rpc(RPC_NAME, params);

  if (error) {
    throw classifyRemoteError(error);
  }

  return validateResponseRow(data, row);
}

/**
 * Maps a remote error to a stable domain kind. Only concrete PostgREST /
 * PostgreSQL signals are treated as a missing migration; a generic remote
 * failure is never misclassified as migration_required.
 */
function classifyRemoteError(error: TechnicalEvidenceRpcError): TechnicalEvidenceWriterError {
  const code = typeof error.code === 'string' ? error.code : '';
  const message = typeof error.message === 'string' ? error.message : '';

  // The migration raises technical_evidence_conflict for a divergent repeat.
  if (/technical_evidence_conflict/i.test(message)) {
    return new TechnicalEvidenceWriterError('conflict', 'Technical evidence content conflict for this version.', error);
  }
  // The RPC's internal service_role gate raises writer_required for any other role.
  if (/writer_required/i.test(message)) {
    return new TechnicalEvidenceWriterError('writer_required', 'A service_role writer is required for this RPC.', error);
  }
  // Concrete "function not found" signals: PostgREST schema-cache miss
  // (PGRST202), PostgreSQL undefined_function (42883), or an explicit
  // missing-function message. Everything else stays a generic remote error.
  if (
    code === 'PGRST202'
    || code === '42883'
    || /upsert_document_technical_evidence_ingestor_state|schema cache|does not exist/i.test(message)
  ) {
    return new TechnicalEvidenceWriterError('migration_required', 'Technical evidence RPC (migration 49) is not available.', error);
  }
  return new TechnicalEvidenceWriterError('remote_error', 'Technical evidence remote write failed.', error);
}

/**
 * Validates the RPC response strictly: exactly one row whose document_id,
 * evidence_version and outcome match the request. Anything else is an
 * invalid_response — never silently accepted.
 */
function validateResponseRow(
  data: unknown,
  row: TechnicalEvidenceExportRow,
): TechnicalEvidenceWriteResult {
  if (!isUnknownArray(data)) {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response was not a row collection.');
  }
  if (data.length !== 1) {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response did not contain exactly one row.');
  }

  const record = data[0];
  if (!isRecord(record)) {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response row was not an object.');
  }

  if (record.document_id !== row.documentId) {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response document_id did not match the request.');
  }
  if (record.evidence_version !== row.evidenceVersion) {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response evidence_version did not match the request.');
  }

  const outcome = record.outcome;
  if (outcome !== 'inserted' && outcome !== 'unchanged') {
    throw new TechnicalEvidenceWriterError('invalid_response', 'RPC response outcome was not inserted or unchanged.');
  }

  return {
    documentId: row.documentId,
    evidenceVersion: row.evidenceVersion,
    outcome,
  };
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
