import { describe, it, expect } from 'vitest';
import {
  tipoSubfolder,
  pendenteDrivePath,
  pedidoDocumentDrivePath,
  pedidoSubfolderDrivePath,
  manifestDrivePath,
} from '../src/core/paths.js';

describe('tipoSubfolder', () => {
  it('nf + entrada → nf/entrada', () => {
    expect(tipoSubfolder('nf', 'entrada')).toBe('nf/entrada');
  });

  it('nf + saida → nf/saida', () => {
    expect(tipoSubfolder('nf', 'saida')).toBe('nf/saida');
  });

  it('nf + desconhecida → nf/desconhecida', () => {
    expect(tipoSubfolder('nf', 'desconhecida')).toBe('nf/desconhecida');
  });

  it('nf + null → nf/desconhecida', () => {
    expect(tipoSubfolder('nf', null)).toBe('nf/desconhecida');
  });

  it('nf + undefined → nf/desconhecida', () => {
    expect(tipoSubfolder('nf')).toBe('nf/desconhecida');
  });

  it('romaneio → romaneio', () => {
    expect(tipoSubfolder('romaneio')).toBe('romaneio');
  });

  it('desconhecido → desconhecido', () => {
    expect(tipoSubfolder('desconhecido')).toBe('desconhecido');
  });
});

describe('pendenteDrivePath (G3)', () => {
  it('uses pendentes/YYYY-MM-DD/{tipo}/{direcao} format', () => {
    const p = pendenteDrivePath({
      date: '2026-07-06',
      tipoDocumento: 'nf',
      direcaoNf: 'entrada',
    });
    expect(p.backend).toBe('google_drive');
    expect(p.logicalPath).toBe('Ravatex Documents Ingestor/pendentes/2026-07-06/nf/entrada');
  });

  it('does NOT contain email-<id>', () => {
    const p = pendenteDrivePath({
      tipoDocumento: 'romaneio',
    });
    expect(p.logicalPath).not.toContain('email-');
  });

  it('nf saida produces correct path', () => {
    const p = pendenteDrivePath({
      date: '2026-01-15',
      tipoDocumento: 'nf',
      direcaoNf: 'saida',
    });
    expect(p.logicalPath).toContain('/nf/saida');
  });

  it('nf desconhecida produces correct path', () => {
    const p = pendenteDrivePath({
      tipoDocumento: 'nf',
      direcaoNf: 'desconhecida',
    });
    expect(p.logicalPath).toContain('/nf/desconhecida');
  });

  it('romaneio produces correct path', () => {
    const p = pendenteDrivePath({
      tipoDocumento: 'romaneio',
    });
    expect(p.logicalPath).toContain('/romaneio');
  });

  it('desconhecido produces correct path', () => {
    const p = pendenteDrivePath({
      tipoDocumento: 'desconhecido',
    });
    expect(p.logicalPath).toContain('/desconhecido');
  });

  it('includes filename when provided', () => {
    const p = pendenteDrivePath({
      tipoDocumento: 'nf',
      direcaoNf: 'entrada',
      filename: 'nfe.xml',
    });
    expect(p.logicalPath).toContain('/nfe.xml');
  });
});

describe('pedidoDocumentDrivePath (G3)', () => {
  it('uses pedidos/PED/YYYY-MM-DD/{tipo}/{direcao}/filename', () => {
    const p = pedidoDocumentDrivePath({
      pedidoManual: 'PED-25-2026',
      date: '2026-07-06',
      tipoDocumento: 'nf',
      direcaoNf: 'saida',
      filename: 'nfe.xml',
    });
    expect(p.logicalPath).toBe(
      'Ravatex Documents Ingestor/pedidos/PED-25-2026/2026-07-06/nf/saida/nfe.xml'
    );
  });

  it('romaneio has no direcao subfolder', () => {
    const p = pedidoDocumentDrivePath({
      pedidoManual: 'PED-01-2026',
      tipoDocumento: 'romaneio',
      filename: 'r.pdf',
    });
    expect(p.logicalPath).toContain('/romaneio/r.pdf');
    expect(p.logicalPath).not.toContain('/romaneio/entrada');
    expect(p.logicalPath).not.toContain('/romaneio/saida');
    expect(p.logicalPath).not.toContain('/romaneio/desconhecida');
  });

  it('contains pedido prefix', () => {
    const p = pedidoDocumentDrivePath({
      pedidoManual: 'PED-50-2026',
      tipoDocumento: 'nf',
      direcaoNf: 'entrada',
      filename: 'n.pdf',
    });
    expect(p.logicalPath).toContain('PED-50-2026');
  });
});

describe('pedidoSubfolderDrivePath (G3)', () => {
  it('is a folder, no filename', () => {
    const p = pedidoSubfolderDrivePath({
      pedidoManual: 'PED-25-2026',
      tipoDocumento: 'nf',
      direcaoNf: 'entrada',
    });
    expect(p.logicalPath).toMatch(/\/nf\/entrada$/);
    expect(p.logicalPath).toContain('PED-25-2026');
  });

  it('romaneio subfolder is flat', () => {
    const p = pedidoSubfolderDrivePath({
      pedidoManual: 'PED-01-2026',
      tipoDocumento: 'romaneio',
    });
    expect(p.logicalPath).toMatch(/\/romaneio$/);
  });
});

describe('manifestDrivePath (unchanged)', () => {
  it('ends with manifest.json under Pedido folder', () => {
    const p = manifestDrivePath('PED-25-2026');
    expect(p.backend).toBe('google_drive');
    expect(p.logicalPath).toMatch(/pedidos\/PED-25-2026\/manifest\.json$/);
  });
});

describe('paths are NOT absolute disk paths', () => {
  it('logicalPath does not contain drive letters', () => {
    const p = pedidoDocumentDrivePath({
      pedidoManual: 'PED-25-2026',
      tipoDocumento: 'nf',
      direcaoNf: 'entrada',
      filename: 'n.pdf',
    });
    expect(p.logicalPath.includes(':\\')).toBe(false);
    expect(p.logicalPath.startsWith('/')).toBe(false);
  });
});
