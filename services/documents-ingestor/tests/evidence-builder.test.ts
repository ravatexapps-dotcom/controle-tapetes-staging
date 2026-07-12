import { describe, it, expect } from 'vitest';
import {
  buildTechnicalEvidence,
  type BuildTechnicalEvidenceInput,
} from '../src/core/evidenceBuilder.js';
import type { ClassifyOutput } from '../src/core/classifier.js';
import type {
  RegistryAvailability,
  DuplicateRelation,
  EvidenceOrigin,
} from '../src/types/documentReview.js';
import type {
  DocumentEntityMatchResult,
  DocumentPartyEntityMatch,
} from '../src/types/documentEntityMatch.js';
import type { RegisteredEntityCnpj } from '../src/types/entityCnpj.js';

const EMITENTE_CNPJ = '11111111000111';
const DESTINATARIO_CNPJ = '99999999000199';
const RAW_BAD = 'abc-not-cnpj';

function makeRegistry(): RegistryAvailability {
  return { kind: 'available' };
}

function makeDuplicate(overrides?: Partial<DuplicateRelation>): DuplicateRelation {
  return { kind: 'none', detectionBasis: 'first_observation', ...overrides };
}

function makeOrigin(): Omit<EvidenceOrigin, 'evidenceVersion'> {
  return {
    technical: { source: 'classifier@1.0.0', authorship: 'system' },
    suggestion: { source: 'system', authorship: 'suggestion-engine', note: 'auto-suggested' },
  };
}

function mkMatch(
  entityType: 'cliente' | 'fornecedor',
  id: number,
  name: string,
  cnpj: string,
): RegisteredEntityCnpj {
  return { entityType, entityId: id, entityName: name, cnpj };
}

function mkParty(
  party: 'emitente' | 'destinatario',
  state: DocumentPartyEntityMatch['state'],
  matches: readonly RegisteredEntityCnpj[],
  cnpj: string | null,
): DocumentPartyEntityMatch {
  return { party, extractedCnpj: cnpj, state, matches };
}

function mkEntityMatch(
  state: DocumentEntityMatchResult['state'],
  emitente: DocumentPartyEntityMatch,
  destinatario: DocumentPartyEntityMatch,
): DocumentEntityMatchResult {
  return { state, emitente, destinatario };
}

function makeClassification(overrides?: Partial<ClassifyOutput>): ClassifyOutput {
  return {
    tipoDocumento: 'nf',
    formato: 'xml',
    direcaoNf: 'entrada',
    cnpjEmitente: EMITENTE_CNPJ,
    cnpjDestinatario: DESTINATARIO_CNPJ,
    entityMatch: null,
    technicalObservations: {
      xml: { classification: 'structural_nfe' },
      pdf: { classification: 'unavailable', reasons: [] },
      mimeExtension: { compatibility: 'compatible', mimeType: 'text/xml', extension: 'xml' },
      cnpjEmitente: { kind: 'valid', normalized: EMITENTE_CNPJ },
      cnpjDestinatario: { kind: 'valid', normalized: DESTINATARIO_CNPJ },
    },
    ...overrides,
  };
}

function makeInput(overrides?: Partial<BuildTechnicalEvidenceInput>): BuildTechnicalEvidenceInput {
  return {
    classification: makeClassification(),
    registryAvailability: makeRegistry(),
    duplicateRelation: makeDuplicate(),
    origin: makeOrigin(),
    ...overrides,
  };
}

describe('buildTechnicalEvidence', () => {
  it('entrada: ravatex is destinatario, counterparty is emitente/fornecedor with matched registry', () => {
    const emitenteMatches: RegisteredEntityCnpj[] = [
      mkMatch('fornecedor', 42, 'Acme Fornecimentos', EMITENTE_CNPJ),
    ];
    const entityMatch = mkEntityMatch(
      'matched',
      mkParty('emitente', 'matched', emitenteMatches, EMITENTE_CNPJ),
      mkParty('destinatario', 'unmatched', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    const te = result.technicalEvidence;
    expect(te.tipoDocumento).toBe('nf');
    expect(te.formato).toBe('xml');
    expect(te.directionObservation).not.toBeNull();
    if (te.directionObservation?.kind === 'entrada') {
      expect(te.directionObservation.ravatexSide).toBe('destinatario');
      expect(te.directionObservation.counterparty.side).toBe('emitente');
      expect(te.directionObservation.counterparty.expectedEntityType).toBe('fornecedor');
      expect(te.directionObservation.counterparty.cnpjState).toEqual({ kind: 'valid', normalized: EMITENTE_CNPJ });
      expect(te.directionObservation.counterparty.matches).toEqual(emitenteMatches);
      expect(te.directionObservation.counterparty.ambiguity).toBe('none');
      expect(te.directionObservation.counterparty.registryAvailability).toEqual({ kind: 'available' });
      expect(te.directionObservation.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('saida: ravatex is emitente, counterparty is destinatario/cliente with matched registry', () => {
    const destMatches: RegisteredEntityCnpj[] = [
      mkMatch('cliente', 7, 'Cliente Final', DESTINATARIO_CNPJ),
    ];
    const entityMatch = mkEntityMatch(
      'matched',
      mkParty('emitente', 'unmatched', [], EMITENTE_CNPJ),
      mkParty('destinatario', 'matched', destMatches, DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({ direcaoNf: 'saida', entityMatch }),
    }));
    const te = result.technicalEvidence;
    if (te.directionObservation?.kind === 'saida') {
      expect(te.directionObservation.ravatexSide).toBe('emitente');
      expect(te.directionObservation.counterparty.side).toBe('destinatario');
      expect(te.directionObservation.counterparty.expectedEntityType).toBe('cliente');
      expect(te.directionObservation.counterparty.cnpjState).toEqual({ kind: 'valid', normalized: DESTINATARIO_CNPJ });
      expect(te.directionObservation.counterparty.matches).toEqual(destMatches);
      expect(te.directionObservation.counterparty.ambiguity).toBe('none');
      expect(te.directionObservation.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected saida directionObservation');
    }
  });

  it('desconhecida explicit: ravatexSide null and counterparty null', () => {
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({ direcaoNf: 'desconhecida' }),
    }));
    const dir = result.technicalEvidence.directionObservation;
    expect(dir).not.toBeNull();
    if (dir?.kind === 'desconhecida') {
      expect(dir.ravatexSide).toBeNull();
      expect(dir.counterparty).toBeNull();
      expect(dir.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected desconhecida directionObservation');
    }
  });

  it('null direction: directionObservation is null', () => {
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({ direcaoNf: null }),
    }));
    expect(result.technicalEvidence.directionObservation).toBeNull();
  });

  it('raw CNPJ copied verbatim: invalid state with raw preserved on counterparty', () => {
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({
        direcaoNf: 'entrada',
        technicalObservations: {
          xml: { classification: 'structural_nfe' },
          pdf: { classification: 'unavailable', reasons: [] },
          mimeExtension: { compatibility: 'compatible', mimeType: 'text/xml', extension: 'xml' },
          cnpjEmitente: { kind: 'invalid', raw: RAW_BAD },
          cnpjDestinatario: { kind: 'valid', normalized: DESTINATARIO_CNPJ },
        },
      }),
    }));
    expect(result.technicalEvidence.cnpjEmitente).toEqual({ kind: 'invalid', raw: RAW_BAD });
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.counterparty.cnpjState).toEqual({ kind: 'invalid', raw: RAW_BAD });
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('same CNPJ cliente+fornecedor: matches preserved, ambiguity mixed_entity_types', () => {
    const mixed: RegisteredEntityCnpj[] = [
      mkMatch('fornecedor', 1, 'Supplier Co', EMITENTE_CNPJ),
      mkMatch('cliente', 2, 'Client Co', EMITENTE_CNPJ),
    ];
    const entityMatch = mkEntityMatch(
      'ambiguous',
      mkParty('emitente', 'matched', mixed, EMITENTE_CNPJ),
      mkParty('destinatario', 'unmatched', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.counterparty.matches).toEqual(mixed);
      expect(dir.counterparty.ambiguity).toBe('mixed_entity_types');
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('registry available + unmatched: passed through to counterparty, no inconsistency', () => {
    const registry: RegistryAvailability = { kind: 'available' };
    const entityMatch = mkEntityMatch(
      'unmatched',
      mkParty('emitente', 'unmatched', [], EMITENTE_CNPJ),
      mkParty('destinatario', 'unmatched', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      registryAvailability: registry,
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    expect(result.technicalEvidence.registryAvailability).toEqual(registry);
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.counterparty.registryAvailability).toEqual(registry);
      expect(dir.counterparty.matches).toEqual([]);
      expect(dir.counterparty.ambiguity).toBe('none');
      expect(dir.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('registry unavailable: reason and warning preserved on both technicalEvidence and counterparty', () => {
    const registry: RegistryAvailability = {
      kind: 'unavailable',
      reason: 'network_timeout',
      warning: 'Registry service unreachable',
    };
    const entityMatch = mkEntityMatch(
      'registry_unavailable',
      mkParty('emitente', 'registry_unavailable', [], EMITENTE_CNPJ),
      mkParty('destinatario', 'registry_unavailable', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      registryAvailability: registry,
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    expect(result.technicalEvidence.registryAvailability).toEqual(registry);
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.counterparty.registryAvailability).toEqual(registry);
      expect(dir.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('registry not_observed with no matches: passed through, no inconsistency', () => {
    const registry: RegistryAvailability = { kind: 'not_observed' };
    const entityMatch = mkEntityMatch(
      'no_extracted_cnpj',
      mkParty('emitente', 'missing_cnpj', [], null),
      mkParty('destinatario', 'missing_cnpj', [], null),
    );
    const result = buildTechnicalEvidence(makeInput({
      registryAvailability: registry,
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    expect(result.technicalEvidence.registryAvailability).toEqual(registry);
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.counterparty.registryAvailability).toEqual(registry);
      expect(dir.inconsistencies).toEqual([]);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('contradiction: registry unavailable but entityMatch has matches -> inconsistencies recorded', () => {
    const registry: RegistryAvailability = { kind: 'unavailable', reason: 'timeout', warning: 'fail' };
    const matches: RegisteredEntityCnpj[] = [
      mkMatch('fornecedor', 1, 'Acme', EMITENTE_CNPJ),
    ];
    const entityMatch = mkEntityMatch(
      'matched',
      mkParty('emitente', 'matched', matches, EMITENTE_CNPJ),
      mkParty('destinatario', 'unmatched', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      registryAvailability: registry,
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.inconsistencies.length).toBeGreaterThan(0);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('contradiction: registry not_observed but entityMatch has matches -> inconsistencies recorded', () => {
    const registry: RegistryAvailability = { kind: 'not_observed' };
    const matches: RegisteredEntityCnpj[] = [
      mkMatch('fornecedor', 1, 'Acme', EMITENTE_CNPJ),
    ];
    const entityMatch = mkEntityMatch(
      'matched',
      mkParty('emitente', 'matched', matches, EMITENTE_CNPJ),
      mkParty('destinatario', 'unmatched', [], DESTINATARIO_CNPJ),
    );
    const result = buildTechnicalEvidence(makeInput({
      registryAvailability: registry,
      classification: makeClassification({ direcaoNf: 'entrada', entityMatch }),
    }));
    const dir = result.technicalEvidence.directionObservation;
    if (dir?.kind === 'entrada') {
      expect(dir.inconsistencies.length).toBeGreaterThan(0);
    } else {
      throw new Error('expected entrada directionObservation');
    }
  });

  it('duplicate none: detectionBasis preserved verbatim', () => {
    const duplicate: DuplicateRelation = { kind: 'none', detectionBasis: 'first_observation' };
    const result = buildTechnicalEvidence(makeInput({ duplicateRelation: duplicate }));
    expect(result.technicalEvidence.duplicateRelation).toEqual(duplicate);
  });

  it('duplicate with canonicalRef: canonicalRef preserved verbatim', () => {
    const duplicate: DuplicateRelation = {
      kind: 'same_message',
      detectionBasis: 'gmail_message_id',
      canonicalRef: {
        documentId: 'doc-1',
        gmailMessageId: 'gmail-msg-1',
        attachmentId: 'att-1',
        sha256: 'deadbeef',
        filenameOriginal: 'invoice.xml',
      },
    };
    const result = buildTechnicalEvidence(makeInput({ duplicateRelation: duplicate }));
    expect(result.technicalEvidence.duplicateRelation).toEqual(duplicate);
  });

  it('probable fiscal PDF reasons copied; no decision field added by the builder', () => {
    const classification = makeClassification({
      tipoDocumento: 'nf',
      formato: 'pdf',
      direcaoNf: null,
      cnpjEmitente: null,
      cnpjDestinatario: null,
      entityMatch: null,
      technicalObservations: {
        xml: { classification: 'unavailable' },
        pdf: {
          classification: 'probable_fiscal_pdf',
          reasons: [
            { source: 'filename', reasonCode: 'matches_nf_token' },
            { source: 'subject', reasonCode: 'matches_nf_token' },
          ],
        },
        mimeExtension: { compatibility: 'compatible', mimeType: 'application/pdf', extension: 'pdf' },
        cnpjEmitente: { kind: 'unavailable' },
        cnpjDestinatario: { kind: 'unavailable' },
      },
    });
    const result = buildTechnicalEvidence(makeInput({ classification }));
    const pdf = result.technicalEvidence.pdfObservation;
    expect(pdf).toEqual({
      classification: 'probable_fiscal_pdf',
      reasons: [
        { source: 'filename', reasonCode: 'matches_nf_token' },
        { source: 'subject', reasonCode: 'matches_nf_token' },
      ],
    });
    expect(pdf).not.toHaveProperty('decision');
    expect(pdf).not.toHaveProperty('isFiscal');
    expect(pdf).not.toHaveProperty('approved');
    expect(result.technicalEvidence.directionObservation).toBeNull();
  });

  it('xml/pdf/mime observations are raw-free (no content/buffer/sample/raw fields)', () => {
    const result = buildTechnicalEvidence(makeInput());
    const te = result.technicalEvidence;
    expect(Object.keys(te.xmlObservation)).toEqual(['classification']);
    expect(Object.keys(te.pdfObservation).sort()).toEqual(['classification', 'reasons']);
    expect(Object.keys(te.mimeExtensionObservation).sort()).toEqual(['compatibility', 'extension', 'mimeType']);
    for (const obs of [te.xmlObservation, te.pdfObservation, te.mimeExtensionObservation]) {
      const keys = Object.keys(obs).join(',');
      expect(keys).not.toMatch(/content|buffer|sample|raw/i);
    }
  });

  it('origin envelope: input and output lack evidenceVersion', () => {
    const origin = makeOrigin();
    expect(origin).not.toHaveProperty('evidenceVersion');
    const result = buildTechnicalEvidence(makeInput({ origin }));
    expect(result.origin).not.toHaveProperty('evidenceVersion');
    expect(result.origin.technical).toEqual(origin.technical);
    expect(result.origin.suggestion).toEqual(origin.suggestion);
  });

  it('output is JSON-serializable, inputs are unmutated, technicalEvidence has no forbidden fields', () => {
    const input = makeInput();
    const snap = {
      classification: JSON.parse(JSON.stringify(input.classification)),
      registry: JSON.parse(JSON.stringify(input.registryAvailability)),
      duplicate: JSON.parse(JSON.stringify(input.duplicateRelation)),
      origin: JSON.parse(JSON.stringify(input.origin)),
    };
    const result = buildTechnicalEvidence(input);
    expect(input.classification).toEqual(snap.classification);
    expect(input.registryAvailability).toEqual(snap.registry);
    expect(input.duplicateRelation).toEqual(snap.duplicate);
    expect(input.origin).toEqual(snap.origin);
    const round = JSON.parse(JSON.stringify(result));
    expect(round).toEqual(result);
    const allowedKeys = [
      'cnpjDestinatario',
      'cnpjEmitente',
      'directionObservation',
      'duplicateRelation',
      'entityMatch',
      'formato',
      'mimeExtensionObservation',
      'pdfObservation',
      'registryAvailability',
      'tipoDocumento',
      'xmlObservation',
    ];
    expect(Object.keys(result.technicalEvidence).sort()).toEqual(allowedKeys.sort());
    expect(result.origin).not.toHaveProperty('evidenceVersion');
  });
});
