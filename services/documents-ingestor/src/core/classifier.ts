import type { TipoDocumento, FormatoDocumento, DirecaoNF } from '../types/document.js';
import { config } from '../config.js';
import type { EntityCnpjRegistry } from '../types/entityCnpj.js';
import type { DocumentEntityMatchResult } from '../types/documentEntityMatch.js';
import { matchDocumentEntityCnpjs } from './documentEntityMatch.js';
import { extractValidCnpj } from './cnpj.js';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export interface ExtractedNfeParties {
  emitenteCnpj: string | null;
  destinatarioCnpj: string | null;
}

export interface ClassifyOutput {
  tipoDocumento: TipoDocumento;
  formato: FormatoDocumento;
  direcaoNf: DirecaoNF | null;
  cnpjEmitente: string | null;
  cnpjDestinatario: string | null;
  entityMatch: DocumentEntityMatchResult | null;
}

export interface ClassifyInput {
  filename: string;
  mimeType: string;
  subject?: string;
  contentSample?: string;
  ravatexCnpjs?: string[];
  entityRegistry?: EntityCnpjRegistry;
}

const nfeParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  removeNSPrefix: true,
  trimValues: true,
  processEntities: true,
  htmlEntities: false,
});

const XML_SAMPLE_CAP_BYTES = 2048;

function computeFormato(mimeType: string, filenameLower: string): FormatoDocumento {
  if (mimeType === 'text/xml' || mimeType === 'application/xml') return 'xml';
  if (mimeType === 'application/pdf') return 'pdf';
  if (filenameLower.endsWith('.xml')) return 'xml';
  if (filenameLower.endsWith('.pdf')) return 'pdf';
  return 'desconhecido';
}

function isXmlCandidate(mimeType: string, filenameLower: string): boolean {
  if (mimeType === 'text/xml' || mimeType === 'application/xml') return true;
  if (filenameLower.endsWith('.xml')) return true;
  return false;
}

function validateXmlWellFormed(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const result = XMLValidator.validate(content);
  return result === true;
}

interface InfNFeContainer {
  emit?: { CNPJ?: unknown };
  dest?: { CNPJ?: unknown };
}

function findInfNFeNode(parsed: unknown): InfNFeContainer | null {
  if (!parsed || typeof parsed !== 'object' || parsed === null) return null;
  const root = parsed as Record<string, unknown>;
  if (root.nfeProc && typeof root.nfeProc === 'object' && root.nfeProc !== null) {
    const proc = root.nfeProc as Record<string, unknown>;
    if (proc.NFe && typeof proc.NFe === 'object' && proc.NFe !== null) {
      const nfe = proc.NFe as Record<string, unknown>;
      if (nfe.infNFe && typeof nfe.infNFe === 'object' && nfe.infNFe !== null) {
        return nfe.infNFe as InfNFeContainer;
      }
    }
  }
  if (root.NFe && typeof root.NFe === 'object' && root.NFe !== null) {
    const nfe = root.NFe as Record<string, unknown>;
    if (nfe.infNFe && typeof nfe.infNFe === 'object' && nfe.infNFe !== null) {
      return nfe.infNFe as InfNFeContainer;
    }
  }
  return null;
}

function isNfeStructure(content: string): boolean {
  if (!validateXmlWellFormed(content)) return false;
  let parsed: unknown;
  try {
    parsed = nfeParser.parse(content);
  } catch {
    return false;
  }
  return findInfNFeNode(parsed) !== null;
}

export function extrairPartesNFe(xmlContent: string): ExtractedNfeParties {
  if (!validateXmlWellFormed(xmlContent)) {
    return { emitenteCnpj: null, destinatarioCnpj: null };
  }
  let parsed: unknown;
  try {
    parsed = nfeParser.parse(xmlContent);
  } catch {
    return { emitenteCnpj: null, destinatarioCnpj: null };
  }
  const infNFe = findInfNFeNode(parsed);
  if (!infNFe) {
    return { emitenteCnpj: null, destinatarioCnpj: null };
  }
  const emitCnpjRaw = infNFe.emit && typeof infNFe.emit === 'object'
    ? (infNFe.emit as { CNPJ?: unknown }).CNPJ
    : undefined;
  const destCnpjRaw = infNFe.dest && typeof infNFe.dest === 'object'
    ? (infNFe.dest as { CNPJ?: unknown }).CNPJ
    : undefined;
  return {
    emitenteCnpj: extractValidCnpj(typeof emitCnpjRaw === 'string' ? emitCnpjRaw : null),
    destinatarioCnpj: extractValidCnpj(typeof destCnpjRaw === 'string' ? destCnpjRaw : null),
  };
}

export function classifyAttachment(input: ClassifyInput): ClassifyOutput {
  const name = input.filename.toLowerCase();
  const subj = (input.subject ?? '').toLowerCase();
  const formato = computeFormato(input.mimeType, name);

  if (isXmlCandidate(input.mimeType, name)) {
    const sample = input.contentSample ?? '';
    if (isNfeStructure(sample)) {
      const parties = extrairPartesNFe(sample);
      const cnpjs = input.ravatexCnpjs ?? config.ravatexCnpjs;
      const direcao = lerDirecaoNFe(parties, cnpjs);
      const entityMatch = buildEntityMatch(parties, input.entityRegistry);
      return {
        tipoDocumento: 'nf',
        formato: 'xml',
        direcaoNf: direcao,
        cnpjEmitente: parties.emitenteCnpj,
        cnpjDestinatario: parties.destinatarioCnpj,
        entityMatch,
      };
    }
  }

  if (name.includes('romaneio') || subj.includes('romaneio')) {
    return {
      tipoDocumento: 'romaneio',
      formato,
      direcaoNf: null,
      cnpjEmitente: null,
      cnpjDestinatario: null,
      entityMatch: buildEntityMatch({ emitenteCnpj: null, destinatarioCnpj: null }, input.entityRegistry),
    };
  }

  const nfKeywords = ['nf', 'nfe', 'nota', 'danfe'];
  const nameMatch = nfKeywords.some(k => name.includes(k));
  const subjMatch = nfKeywords.some(k => subj.includes(k));

  if (input.mimeType === 'application/pdf' || name.endsWith('.pdf')) {
    if (nameMatch || subjMatch) {
      return {
        tipoDocumento: 'nf',
        formato: 'pdf',
        direcaoNf: null,
        cnpjEmitente: null,
        cnpjDestinatario: null,
        entityMatch: buildEntityMatch({ emitenteCnpj: null, destinatarioCnpj: null }, input.entityRegistry),
      };
    }
  }

  return {
    tipoDocumento: 'desconhecido',
    formato,
    direcaoNf: null,
    cnpjEmitente: null,
    cnpjDestinatario: null,
    entityMatch: buildEntityMatch({ emitenteCnpj: null, destinatarioCnpj: null }, input.entityRegistry),
  };
}

export function lerDirecaoNFe(parties: ExtractedNfeParties, ravatexCnpjs: string[]): DirecaoNF {
  if (parties.destinatarioCnpj) {
    if (ravatexCnpjs.some(c => c === parties.destinatarioCnpj)) return 'entrada';
  }

  if (parties.emitenteCnpj) {
    if (ravatexCnpjs.some(c => c === parties.emitenteCnpj)) return 'saida';
  }

  return 'desconhecida';
}

function buildEntityMatch(
  parties: ExtractedNfeParties,
  entityRegistry: EntityCnpjRegistry | undefined,
): DocumentEntityMatchResult | null {
  if (!entityRegistry) return null;
  return matchDocumentEntityCnpjs({
    emitenteCnpj: parties.emitenteCnpj,
    destinatarioCnpj: parties.destinatarioCnpj,
    registry: entityRegistry,
  });
}
