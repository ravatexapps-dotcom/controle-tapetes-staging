import type { TipoDocumento, FormatoDocumento, DirecaoNF } from '../types/document.js';
import { formatoFromMimeType } from '../types/document.js';
import { config } from '../config.js';

export interface ClassifyOutput {
  tipoDocumento: TipoDocumento;
  formato: FormatoDocumento;
  direcaoNf: DirecaoNF | null;
}

export interface ClassifyInput {
  filename: string;
  mimeType: string;
  subject?: string;
  contentSample?: string;
  ravatexCnpjs?: string[];
}

export function classifyAttachment(input: ClassifyInput): ClassifyOutput {
  const name = input.filename.toLowerCase();
  const subj = (input.subject ?? '').toLowerCase();
  const formato = formatoFromMimeType(input.mimeType);

  if (input.mimeType === 'text/xml' || name.endsWith('.xml')) {
    if (hasNfeStructure(input.contentSample ?? '')) {
      const cnpjs = input.ravatexCnpjs ?? config.ravatexCnpjs;
      const direcao = lerDirecaoNFe(input.contentSample ?? '', cnpjs);
      return { tipoDocumento: 'nf', formato: 'xml', direcaoNf: direcao };
    }
  }

  if (name.includes('romaneio') || subj.includes('romaneio')) {
    return { tipoDocumento: 'romaneio', formato, direcaoNf: null };
  }

  const nfKeywords = ['nf', 'nfe', 'nota', 'danfe'];
  const nameMatch = nfKeywords.some(k => name.includes(k));
  const subjMatch = nfKeywords.some(k => subj.includes(k));

  if (input.mimeType === 'application/pdf' || name.endsWith('.pdf')) {
    if (nameMatch || subjMatch) {
      return { tipoDocumento: 'nf', formato: 'pdf', direcaoNf: null };
    }
  }

  return { tipoDocumento: 'desconhecido', formato, direcaoNf: null };
}

function hasNfeStructure(content: string): boolean {
  const lower = content.toLowerCase();
  return lower.includes('nfe') || lower.includes('nfe');
}

export function lerDirecaoNFe(xmlContent: string, ravatexCnpjs: string[]): DirecaoNF {
  const destCNPJ = extrairCNPJdeElemento(xmlContent, 'dest');
  const emitCNPJ = extrairCNPJdeElemento(xmlContent, 'emit');

  const normalizar = (cnpj: string) => cnpj.replace(/\D/g, '');

  if (destCNPJ) {
    const norm = normalizar(destCNPJ);
    if (ravatexCnpjs.some(c => c === norm)) return 'entrada';
  }

  if (emitCNPJ) {
    const norm = normalizar(emitCNPJ);
    if (ravatexCnpjs.some(c => c === norm)) return 'saida';
  }

  return 'desconhecida';
}

function extrairCNPJdeElemento(xml: string, parentElement: string): string | null {
  const parentRegex = new RegExp(
    `<[^>]*?:?${parentElement}[^>]*?>([\\s\\S]*?)<\\/[^>]*?:?${parentElement}[^>]*?>`,
    'i'
  );
  const parentMatch = xml.match(parentRegex);
  if (!parentMatch) return null;

  const fieldRegex = /<[^>]*?:?CNPJ[^>]*?>([\d./-]*)<\/[^>]*?:?CNPJ[^>]*?>/i;
  const fieldMatch = parentMatch[1].match(fieldRegex);
  return fieldMatch ? fieldMatch[1].trim() : null;
}
