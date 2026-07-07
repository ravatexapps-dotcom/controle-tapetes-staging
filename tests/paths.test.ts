import { describe, it, expect } from 'vitest';
import {
  pdfSubfolder,
  pendenteDrivePath,
  pedidoDrivePath,
  pedidoDocumentDrivePath,
  pedidoSubfolderDrivePath,
  manifestDrivePath,
} from '../src/core/paths.js';

describe('paths (Drive logical)', () => {
  it('maps nf to nf/', () => {
    expect(pdfSubfolder('nf')).toBe('nf');
  });

  it('maps romaneio to romaneio/', () => {
    expect(pdfSubfolder('romaneio')).toBe('romaneio');
  });

  it('maps desconhecido to desconhecido/', () => {
    expect(pdfSubfolder('desconhecido')).toBe('desconhecido');
  });

  it('pendenteDrivePath returns backend=google_drive with logical path under root', () => {
    const p = pendenteDrivePath('msg123');
    expect(p.backend).toBe('google_drive');
    expect(p.logicalPath).toContain('pendentes');
    expect(p.logicalPath).toContain('email-msg123');
    expect(p.rootFolderName).toBeTruthy();
  });

  it('pedidoDrivePath uses Ravatex Documents Ingestor root and pedidos prefix', () => {
    const p = pedidoDrivePath('PED-25-2026');
    expect(p.backend).toBe('google_drive');
    expect(p.logicalPath).toMatch(/^Ravatex Documents Ingestor\/pedidos\/PED-25-2026\/\d{4}-\d{2}-\d{2}$/);
  });

  it('pedidoDocumentDrivePath puts filename in correct tipo subfolder', () => {
    const p = pedidoDocumentDrivePath('PED-25-2026', 'romaneio', 'r.pdf');
    expect(p.logicalPath).toContain('/romaneio/r.pdf');
    expect(p.logicalPath).toContain('PED-25-2026');
  });

  it('pedidoSubfolderDrivePath is a folder, no filename', () => {
    const p = pedidoSubfolderDrivePath('PED-25-2026', 'nf');
    expect(p.logicalPath).toMatch(/\/nf$/);
  });

  it('manifestDrivePath ends with manifest.json under Pedido folder', () => {
    const p = manifestDrivePath('PED-25-2026');
    expect(p.backend).toBe('google_drive');
    expect(p.logicalPath).toMatch(/pedidos\/PED-25-2026\/manifest\.json$/);
  });

  it('pathes returned are NOT absolute local disk paths', () => {
    const p = pedidoDocumentDrivePath('PED-25-2026', 'nf', 'n.pdf');
    expect(p.logicalPath.includes(':\\')).toBe(false);
    expect(p.logicalPath.startsWith('/')).toBe(false);
  });
});
