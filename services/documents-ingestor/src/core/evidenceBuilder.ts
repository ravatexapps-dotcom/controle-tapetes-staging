import type { ClassifyOutput } from './classifier.js';
import type {
  RegistryAvailability,
  EvidenceOrigin,
  TechnicalEvidence,
  CnpjPartyState,
  DirectionObservation,
  CounterpartyEmitenteFornecedor,
  CounterpartyDestinatarioCliente,
  CounterpartyAmbiguity,
  DuplicateRelation,
} from '../types/documentReview.js';
import type { DocumentEntityMatchResult, DocumentPartyEntityMatch } from '../types/documentEntityMatch.js';
import type { RegisteredEntityCnpj } from '../types/entityCnpj.js';

export interface BuildTechnicalEvidenceInput {
  classification: ClassifyOutput;
  registryAvailability: RegistryAvailability;
  duplicateRelation: DuplicateRelation;
  origin: Omit<EvidenceOrigin, 'evidenceVersion'>;
}

export interface BuiltTechnicalEvidence {
  technicalEvidence: TechnicalEvidence;
  origin: Omit<EvidenceOrigin, 'evidenceVersion'>;
}

function computeAmbiguity(matches: readonly RegisteredEntityCnpj[]): CounterpartyAmbiguity {
  if (matches.length <= 1) return 'none';
  const types = new Set<string>();
  for (const m of matches) {
    types.add(m.entityType);
  }
  if (types.size > 1) return 'mixed_entity_types';
  return 'multiple_same_type';
}

function detectInconsistencies(
  registryAvailability: RegistryAvailability,
  entityMatch: DocumentEntityMatchResult | null,
  counterpartyCnpjState: CnpjPartyState,
): readonly string[] {
  const inconsistencies: string[] = [];

  if (registryAvailability.kind === 'unavailable' && entityMatch !== null) {
    if (entityMatch.state !== 'registry_unavailable') {
      inconsistencies.push('registry_unavailable_but_entity_match_state_inconsistent');
    }
  }

  if (registryAvailability.kind === 'not_observed' && entityMatch !== null) {
    if (entityMatch.state === 'matched' || entityMatch.state === 'ambiguous') {
      inconsistencies.push('registry_not_observed_but_matches_present');
    }
  }

  if (
    registryAvailability.kind === 'available' &&
    entityMatch === null &&
    counterpartyCnpjState.kind === 'valid'
  ) {
    inconsistencies.push('registry_available_but_entity_match_missing');
  }

  return inconsistencies;
}

function buildEmitenteFornecedor(
  cnpjState: CnpjPartyState,
  matches: readonly RegisteredEntityCnpj[],
  registryAvailability: RegistryAvailability,
): CounterpartyEmitenteFornecedor {
  const counterparty: CounterpartyEmitenteFornecedor = {
    cnpjState,
    matches,
    ambiguity: computeAmbiguity(matches),
    registryAvailability,
    side: 'emitente',
    expectedEntityType: 'fornecedor',
  };
  return counterparty;
}

function buildDestinatarioCliente(
  cnpjState: CnpjPartyState,
  matches: readonly RegisteredEntityCnpj[],
  registryAvailability: RegistryAvailability,
): CounterpartyDestinatarioCliente {
  const counterparty: CounterpartyDestinatarioCliente = {
    cnpjState,
    matches,
    ambiguity: computeAmbiguity(matches),
    registryAvailability,
    side: 'destinatario',
    expectedEntityType: 'cliente',
  };
  return counterparty;
}

export function buildTechnicalEvidence(input: BuildTechnicalEvidenceInput): BuiltTechnicalEvidence {
  const { classification, registryAvailability, duplicateRelation, origin } = input;
  const tech = classification.technicalObservations;
  const entityMatch = classification.entityMatch;

  let directionObservation: DirectionObservation | null = null;

  if (classification.direcaoNf === 'entrada') {
    const emitenteParty: DocumentPartyEntityMatch | undefined = entityMatch
      ? entityMatch.emitente
      : undefined;
    const matches: readonly RegisteredEntityCnpj[] = emitenteParty ? emitenteParty.matches : [];
    const inconsistencies = detectInconsistencies(registryAvailability, entityMatch, tech.cnpjEmitente);
    directionObservation = {
      kind: 'entrada',
      ravatexSide: 'destinatario',
      counterparty: buildEmitenteFornecedor(tech.cnpjEmitente, matches, registryAvailability),
      inconsistencies,
    };
  } else if (classification.direcaoNf === 'saida') {
    const destinatarioParty: DocumentPartyEntityMatch | undefined = entityMatch
      ? entityMatch.destinatario
      : undefined;
    const matches: readonly RegisteredEntityCnpj[] = destinatarioParty ? destinatarioParty.matches : [];
    const inconsistencies = detectInconsistencies(registryAvailability, entityMatch, tech.cnpjDestinatario);
    directionObservation = {
      kind: 'saida',
      ravatexSide: 'emitente',
      counterparty: buildDestinatarioCliente(tech.cnpjDestinatario, matches, registryAvailability),
      inconsistencies,
    };
  } else if (classification.direcaoNf === 'desconhecida') {
    directionObservation = {
      kind: 'desconhecida',
      ravatexSide: null,
      counterparty: null,
      inconsistencies: [],
    };
  }

  const technicalEvidence: TechnicalEvidence = {
    tipoDocumento: classification.tipoDocumento,
    formato: classification.formato,
    xmlObservation: tech.xml,
    pdfObservation: tech.pdf,
    mimeExtensionObservation: tech.mimeExtension,
    cnpjEmitente: tech.cnpjEmitente,
    cnpjDestinatario: tech.cnpjDestinatario,
    registryAvailability,
    directionObservation,
    entityMatch,
    duplicateRelation,
  };

  return { technicalEvidence, origin };
}
