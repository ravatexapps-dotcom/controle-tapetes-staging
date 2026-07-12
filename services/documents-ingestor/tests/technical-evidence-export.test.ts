import { describe, expect, it } from 'vitest';
import { projectCurrentTechnicalEvidenceExport } from '../src/core/technicalEvidenceExport.js';
import type { StoredTechnicalEvidence } from '../src/core/evidenceStore.js';
import type { EvidenceOrigin, TechnicalEvidence } from '../src/types/documentReview.js';

function makeTechnicalEvidence(): TechnicalEvidence {
  const matches: NonNullable<TechnicalEvidence['entityMatch']>['emitente']['matches'] = [
    { entityType: 'fornecedor', entityId: 17, entityName: 'Fornecedor Alfa', cnpj: '11111111000111' },
    { entityType: 'cliente', entityId: 18, entityName: 'Cliente Alfa', cnpj: '11111111000111' },
  ];

  return {
    tipoDocumento: 'nf',
    formato: 'xml',
    xmlObservation: { classification: 'structural_nfe' },
    pdfObservation: {
      classification: 'probable_fiscal_pdf',
      reasons: [{ source: 'filename', reasonCode: 'fiscal_filename' }],
    },
    mimeExtensionObservation: {
      compatibility: 'conflict',
      mimeType: 'application/xml',
      extension: 'pdf',
    },
    cnpjEmitente: { kind: 'valid', normalized: '11111111000111' },
    cnpjDestinatario: { kind: 'invalid', raw: 'destinatario-invalido' },
    registryAvailability: { kind: 'available' },
    directionObservation: {
      kind: 'entrada',
      ravatexSide: 'destinatario',
      counterparty: {
        side: 'emitente',
        expectedEntityType: 'fornecedor',
        cnpjState: { kind: 'valid', normalized: '11111111000111' },
        matches,
        ambiguity: 'mixed_entity_types',
        registryAvailability: { kind: 'available' },
      },
      inconsistencies: ['registry_result_conflicts_with_document_direction'],
    },
    entityMatch: {
      state: 'ambiguous',
      emitente: {
        party: 'emitente',
        extractedCnpj: '11111111000111',
        state: 'ambiguous',
        matches,
      },
      destinatario: {
        party: 'destinatario',
        extractedCnpj: null,
        state: 'missing_cnpj',
        matches: [],
      },
    },
    duplicateRelation: {
      kind: 'possible_duplicate',
      detectionBasis: 'same issuer and value observation',
      canonicalRef: { documentId: 'canonical-document', sha256: 'abc123', filenameOriginal: 'nota.xml' },
    },
  };
}

function makeOrigin(evidenceVersion = 7): EvidenceOrigin {
  return {
    technical: { source: 'classifier-v3', authorship: 'documents-ingestor' },
    suggestion: { source: 'system', authorship: 'review-engine', note: 'requires human review' },
    evidenceVersion,
  };
}

function makeStored(): StoredTechnicalEvidence {
  return {
    documentId: 'document-42',
    evidenceVersion: 7,
    technicalEvidence: makeTechnicalEvidence(),
    origin: makeOrigin(),
    createdAt: '2026-07-12T10:30:00.000Z',
  };
}

describe('projectCurrentTechnicalEvidenceExport', () => {
  it('returns null for a legacy document without stored technical evidence', () => {
    expect(projectCurrentTechnicalEvidenceExport(null)).toBeNull();
  });

  it('projects the schema version and every required top-level field exactly', () => {
    const stored = makeStored();

    expect(projectCurrentTechnicalEvidenceExport(stored)).toEqual({
      schemaVersion: 1,
      documentId: stored.documentId,
      evidenceVersion: stored.evidenceVersion,
      technicalEvidence: stored.technicalEvidence,
      origin: stored.origin,
      createdAt: stored.createdAt,
    });
  });

  it('preserves technical evidence and origin references without recalculation or normalization', () => {
    const stored = makeStored();
    const row = projectCurrentTechnicalEvidenceExport(stored);

    expect(row).not.toBeNull();
    expect(row?.technicalEvidence).toBe(stored.technicalEvidence);
    expect(row?.origin).toBe(stored.origin);
    expect(row?.technicalEvidence.cnpjDestinatario).toEqual({ kind: 'invalid', raw: 'destinatario-invalido' });
  });

  it('preserves observations, registry, direction, matching, duplicate relation, and incompatibilities', () => {
    const stored = makeStored();
    const row = projectCurrentTechnicalEvidenceExport(stored);

    expect(row?.technicalEvidence.xmlObservation).toBe(stored.technicalEvidence.xmlObservation);
    expect(row?.technicalEvidence.pdfObservation).toBe(stored.technicalEvidence.pdfObservation);
    expect(row?.technicalEvidence.mimeExtensionObservation).toBe(stored.technicalEvidence.mimeExtensionObservation);
    expect(row?.technicalEvidence.registryAvailability).toBe(stored.technicalEvidence.registryAvailability);
    expect(row?.technicalEvidence.directionObservation).toBe(stored.technicalEvidence.directionObservation);
    expect(row?.technicalEvidence.entityMatch).toBe(stored.technicalEvidence.entityMatch);
    expect(row?.technicalEvidence.duplicateRelation).toBe(stored.technicalEvidence.duplicateRelation);
  });

  it('throws explicitly when stored and origin evidence versions diverge', () => {
    const stored = makeStored();
    stored.origin = makeOrigin(8);

    expect(() => projectCurrentTechnicalEvidenceExport(stored))
      .toThrow(/evidenceVersion.*origin\.evidenceVersion|origin\.evidenceVersion.*evidenceVersion/i);
  });

  it('is JSON-serializable as a data-only export row', () => {
    const row = projectCurrentTechnicalEvidenceExport(makeStored());

    const json = JSON.stringify(row);
    expect(JSON.parse(json)).toEqual(row);
    expect(json).not.toContain('RAW_XML_SENTINEL');
    expect(json).not.toContain('RAW_PDF_SENTINEL');
    expect(json).not.toContain('BUFFER_SENTINEL');
  });

  it('does not carry human decisions, events, candidates, history, UI, status, Pedido, OP, review, or scores', () => {
    const row = projectCurrentTechnicalEvidenceExport(makeStored());
    const serialized = JSON.stringify(row);

    for (const forbiddenField of [
      'humanDecision', 'humanReviewInput', 'humanDecisionHistory', 'events', 'candidates',
      'history', 'ui', 'status', 'pedido', 'op', 'review', 'ignore', 'reject', 'revoke', 'score',
    ]) {
      expect(serialized).not.toContain(`"${forbiddenField}"`);
    }
  });

  it('does not mutate the stored row or any of its nested evidence', () => {
    const stored = makeStored();
    const snapshot = JSON.parse(JSON.stringify(stored));

    projectCurrentTechnicalEvidenceExport(stored);

    expect(stored).toEqual(snapshot);
  });

  it('is deterministic for the same stored row', () => {
    const stored = makeStored();

    expect(projectCurrentTechnicalEvidenceExport(stored))
      .toEqual(projectCurrentTechnicalEvidenceExport(stored));
  });

  it('has no export fields beyond the narrow technical-evidence contract', () => {
    const row = projectCurrentTechnicalEvidenceExport(makeStored());

    expect(Object.keys(row ?? {}).sort()).toEqual([
      'createdAt',
      'documentId',
      'evidenceVersion',
      'origin',
      'schemaVersion',
      'technicalEvidence',
    ]);
  });
});
