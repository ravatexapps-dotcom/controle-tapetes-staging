import type { StoredTechnicalEvidence } from './evidenceStore.js';
import type { TechnicalEvidenceExportRow } from '../types/technicalEvidenceExport.js';

/**
 * Projects the current persisted technical-evidence snapshot without deriving,
 * normalizing, or mutating any of its observations.
 */
export function projectCurrentTechnicalEvidenceExport(
  stored: StoredTechnicalEvidence | null,
): TechnicalEvidenceExportRow | null {
  if (stored === null) return null;

  if (stored.evidenceVersion !== stored.origin.evidenceVersion) {
    throw new Error(
      `Stored evidenceVersion ${stored.evidenceVersion} diverges from origin.evidenceVersion ${stored.origin.evidenceVersion}`,
    );
  }

  return {
    schemaVersion: 1,
    documentId: stored.documentId,
    evidenceVersion: stored.evidenceVersion,
    technicalEvidence: stored.technicalEvidence,
    origin: stored.origin,
    createdAt: stored.createdAt,
  };
}
