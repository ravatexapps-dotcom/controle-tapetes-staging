import { config } from '../config.js';
import type { TipoDocumento } from '../types/document.js';

export interface DriveLogicalPath {
  backend: 'google_drive';
  rootFolderName: string;
  logicalPath: string;
  folderUri?: string;
}

function todayDir(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rootName(): string {
  return config.googleDriveRootFolderName;
}

export function pdfSubfolder(tipo: TipoDocumento): string {
  const map: Record<TipoDocumento, string> = {
    nf_pdf: 'nf',
    nf_xml: 'nf',
    romaneio: 'romaneio',
    desconhecido: 'desconhecido',
  };
  return map[tipo];
}

export function pendenteDrivePath(gmailMessageId: string): DriveLogicalPath {
  return {
    backend: 'google_drive',
    rootFolderName: rootName(),
    logicalPath: `${rootName()}/pendentes/${todayDir()}/email-${gmailMessageId}`,
  };
}

export function pedidoDrivePath(pedidoManual: string): DriveLogicalPath {
  return {
    backend: 'google_drive',
    rootFolderName: rootName(),
    logicalPath: `${rootName()}/pedidos/${pedidoManual}/${todayDir()}`,
  };
}

export function pedidoDocumentDrivePath(
  pedidoManual: string,
  tipo: TipoDocumento,
  filename: string,
): DriveLogicalPath {
  return {
    backend: 'google_drive',
    rootFolderName: rootName(),
    logicalPath: `${rootName()}/pedidos/${pedidoManual}/${todayDir()}/${pdfSubfolder(tipo)}/${filename}`,
  };
}

export function pedidoSubfolderDrivePath(
  pedidoManual: string,
  tipo: TipoDocumento,
): DriveLogicalPath {
  return {
    backend: 'google_drive',
    rootFolderName: rootName(),
    logicalPath: `${rootName()}/pedidos/${pedidoManual}/${todayDir()}/${pdfSubfolder(tipo)}`,
  };
}

export function manifestDrivePath(pedidoManual: string): DriveLogicalPath {
  return {
    backend: 'google_drive',
    rootFolderName: rootName(),
    logicalPath: `${rootName()}/pedidos/${pedidoManual}/manifest.json`,
  };
}

export function localCacheRoot(): string {
  return config.localCachePath;
}
