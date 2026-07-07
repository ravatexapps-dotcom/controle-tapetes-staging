import { describe, it, expect } from 'vitest';
import { classifyAttachment, lerDirecaoNFe } from '../src/core/classifier.js';

const RAVATEX_CNPJ_1 = '12345678000190';
const RAVATEX_CNPJ_2 = '98765432000110';

function makeNFeXml(destCnpj?: string, emitCnpj?: string, useNsPrefix = false): string {
  const ns = useNsPrefix ? 'nfe:' : '';
  const destBlock = destCnpj
    ? `<${ns}dest><${ns}CNPJ>${destCnpj}</${ns}CNPJ></${ns}dest>`
    : `<${ns}dest><${ns}xNome>Cliente</${ns}xNome></${ns}dest>`;
  const emitBlock = emitCnpj
    ? `<${ns}emit><${ns}CNPJ>${emitCnpj}</${ns}CNPJ></${ns}emit>`
    : `<${ns}emit><${ns}xNome>Fornecedor</${ns}xNome></${ns}emit>`;
  return `<${ns}nfeProc xmlns${ns ? ':' + ns.replace(':', '') + '=' : ''}"http://www.portalfiscal.inf.br/nfe"><${ns}NFe><${ns}infNFe>${destBlock}${emitBlock}</${ns}infNFe></${ns}NFe></${ns}nfeProc>`;
}

describe('classifier', () => {
  it('classifies XML with NF-e structure as nf + formato xml', () => {
    const result = classifyAttachment({
      filename: 'nota.xml',
      mimeType: 'text/xml',
      contentSample: '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>',
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('xml');
  });

  it('classifies PDF with nf in name as nf + formato pdf', () => {
    const result = classifyAttachment({
      filename: 'NF-12345.pdf',
      mimeType: 'application/pdf',
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('pdf');
    expect(result.direcaoNf).toBeNull();
  });

  it('classifies PDF with nota in subject as nf + formato pdf', () => {
    const result = classifyAttachment({
      filename: 'documento.pdf',
      mimeType: 'application/pdf',
      subject: 'Nota Fiscal 123',
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('pdf');
  });

  it('classifies PDF with romaneio in filename as romaneio', () => {
    const result = classifyAttachment({
      filename: 'romaneio_carga.pdf',
      mimeType: 'application/pdf',
    });
    expect(result.tipoDocumento).toBe('romaneio');
    expect(result.formato).toBe('pdf');
    expect(result.direcaoNf).toBeNull();
  });

  it('classifies PDF with romaneio in subject as romaneio', () => {
    const result = classifyAttachment({
      filename: 'anexo.pdf',
      mimeType: 'application/pdf',
      subject: 'Romaneio de entrega',
    });
    expect(result.tipoDocumento).toBe('romaneio');
    expect(result.formato).toBe('pdf');
  });

  it('classifies plain PDF without keywords as desconhecido', () => {
    const result = classifyAttachment({
      filename: 'contrato.pdf',
      mimeType: 'application/pdf',
    });
    expect(result.tipoDocumento).toBe('desconhecido');
    expect(result.formato).toBe('pdf');
  });

  it('classifies XML without NF-e structure as desconhecido', () => {
    const result = classifyAttachment({
      filename: 'dados.xml',
      mimeType: 'text/xml',
      contentSample: '<root><item>teste</item></root>',
    });
    expect(result.tipoDocumento).toBe('desconhecido');
    expect(result.formato).toBe('xml');
  });

  it('classifies unknown mime type as desconhecido with formato desconhecido', () => {
    const result = classifyAttachment({
      filename: 'file.bin',
      mimeType: 'application/octet-stream',
    });
    expect(result.tipoDocumento).toBe('desconhecido');
    expect(result.formato).toBe('desconhecido');
  });
});

describe('NF direction (XML)', () => {
  const cnpjs = [RAVATEX_CNPJ_1, RAVATEX_CNPJ_2];

  it('XML with dest/CNPJ matching Ravatex CNPJ → entrada', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_1, '11111111000111');
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('xml');
    expect(result.direcaoNf).toBe('entrada');
  });

  it('XML with emit/CNPJ matching Ravatex CNPJ → saida', () => {
    const xml = makeNFeXml('11111111000111', RAVATEX_CNPJ_2);
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('xml');
    expect(result.direcaoNf).toBe('saida');
  });

  it('XML without CNPJ matching Ravatex → desconhecida', () => {
    const xml = makeNFeXml('11111111000111', '22222222000122');
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.tipoDocumento).toBe('nf');
    expect(result.formato).toBe('xml');
    expect(result.direcaoNf).toBe('desconhecida');
  });

  it('XML with formatted CNPJ (dots/slashes) works', () => {
    const xml = makeNFeXml('12.345.678/0001-90', '11.111.111/0001-11');
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: [RAVATEX_CNPJ_1],
    });
    expect(result.direcaoNf).toBe('entrada');
  });

  it('XML with namespace prefix works', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_2, '11111111000111', true);
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.direcaoNf).toBe('entrada');
  });

  it('XML without dest/emit CNPJ elements → desconhecida', () => {
    const xml = '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe><infNFe><dest><xNome>Cliente</xNome></dest><emit><xNome>Fornecedor</xNome></emit></infNFe></NFe></nfeProc>';
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.direcaoNf).toBe('desconhecida');
  });

  it('no RAVATEX_CNPJS config → desconhecida', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_1, '11111111000111');
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: [],
    });
    expect(result.direcaoNf).toBe('desconhecida');
  });

  it('dest prioritário: ambos batem → entrada', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_1, RAVATEX_CNPJ_2);
    const result = classifyAttachment({
      filename: 'nfe.xml',
      mimeType: 'text/xml',
      contentSample: xml,
      ravatexCnpjs: cnpjs,
    });
    expect(result.direcaoNf).toBe('entrada');
  });

  it('XML inválido não quebra — cai para desconhecido', () => {
    const result = classifyAttachment({
      filename: 'corrupt.xml',
      mimeType: 'text/xml',
      contentSample: 'not even valid <<<xml>>>',
    });
    expect(result.tipoDocumento).toBe('desconhecido');
  });
});

describe('lerDirecaoNFe (unit)', () => {
  const cnpjs = [RAVATEX_CNPJ_1];

  it('returns entrada when dest matches', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_1);
    expect(lerDirecaoNFe(xml, cnpjs)).toBe('entrada');
  });

  it('returns saida when emit matches', () => {
    const xml = makeNFeXml(null, RAVATEX_CNPJ_1);
    expect(lerDirecaoNFe(xml, cnpjs)).toBe('saida');
  });

  it('returns desconhecida when neither matches', () => {
    const xml = makeNFeXml(null, '99999999000199');
    expect(lerDirecaoNFe(xml, cnpjs)).toBe('desconhecida');
  });

  it('empty CNPJ list returns desconhecida', () => {
    const xml = makeNFeXml(RAVATEX_CNPJ_1);
    expect(lerDirecaoNFe(xml, [])).toBe('desconhecida');
  });
});
