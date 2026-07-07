import type { TipoDocumento, FormatoDocumento } from '../types/document.js';
import { formatoFromMimeType } from '../types/document.js';

export interface ClassifyOutput {
  tipoDocumento: TipoDocumento;
  formato: FormatoDocumento;
}

export interface ClassifyInput {
  filename: string;
  mimeType: string;
  subject?: string;
  contentSample?: string;
}

export function classifyAttachment(input: ClassifyInput): ClassifyOutput {
  const name = input.filename.toLowerCase();
  const subj = (input.subject ?? '').toLowerCase();
  const formato = formatoFromMimeType(input.mimeType);

  if (input.mimeType === 'text/xml' || name.endsWith('.xml')) {
    if (hasNfeStructure(input.contentSample ?? '')) {
      return { tipoDocumento: 'nf', formato: 'xml' };
    }
  }

  if (name.includes('romaneio') || subj.includes('romaneio')) {
    return { tipoDocumento: 'romaneio', formato };
  }

  const nfKeywords = ['nf', 'nfe', 'nota', 'danfe'];
  const nameMatch = nfKeywords.some(k => name.includes(k));
  const subjMatch = nfKeywords.some(k => subj.includes(k));

  if (input.mimeType === 'application/pdf' || name.endsWith('.pdf')) {
    if (nameMatch || subjMatch) {
      return { tipoDocumento: 'nf', formato: 'pdf' };
    }
  }

  return { tipoDocumento: 'desconhecido', formato };
}

function hasNfeStructure(content: string): boolean {
  const lower = content.toLowerCase();
  return lower.includes('<nfe') || lower.includes('<nfe') ||
         lower.includes('nfe') || lower.includes('nfe');
}
