import type { EvidenceOrigin, TechnicalEvidence } from './documentReview.js';

/** Narrow, data-only projection of the current stored technical evidence. */
export interface TechnicalEvidenceExportRow {
  schemaVersion: 1;
  documentId: string;
  evidenceVersion: number;
  technicalEvidence: TechnicalEvidence;
  origin: EvidenceOrigin;
  createdAt: string;
}
