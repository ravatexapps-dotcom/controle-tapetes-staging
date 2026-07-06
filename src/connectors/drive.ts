import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

export interface DriveReference {
  storageBackend: 'google_drive';
  storageUri: string;
  driveFileId: string;
  driveFolderId?: string;
  driveWebViewLink: string;
  driveWebContentLink?: string;
}

export interface DriveFolderReference {
  driveFolderId: string;
  folderUri: string;
  driveWebViewLink?: string;
}

export interface UploadResult {
  file: DriveReference;
  folder: DriveFolderReference;
}

function stubId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

function fileViewLink(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function fileContentLink(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function folderViewLink(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

export async function ensureRootFolder(): Promise<DriveFolderReference> {
  const folderId = config.googleDriveRootFolderId || stubId('folder');
  return {
    driveFolderId: folderId,
    folderUri: `gdrive://folder/${folderId}`,
    driveWebViewLink: folderViewLink(folderId),
  };
}

export async function ensureFolderPath(logicalPath: string): Promise<DriveFolderReference> {
  const folderId = stubId('folder');
  void logicalPath;
  return {
    driveFolderId: folderId,
    folderUri: `gdrive://folder/${folderId}`,
    driveWebViewLink: folderViewLink(folderId),
  };
}

export async function uploadDocument(params: {
  folderLogicalPath: string;
  filename: string;
  mimeType: string;
  data?: Buffer;
}): Promise<UploadResult> {
  void params;
  const fileId = stubId('file');
  const folder = await ensureFolderPath(params.folderLogicalPath);
  return {
    file: {
      storageBackend: 'google_drive',
      storageUri: `gdrive://file/${fileId}`,
      driveFileId: fileId,
      driveFolderId: folder.driveFolderId,
      driveWebViewLink: fileViewLink(fileId),
      driveWebContentLink: fileContentLink(fileId),
    },
    folder,
  };
}

export async function uploadManifest(params: {
  pedido: string;
  payload: unknown;
}): Promise<DriveReference> {
  void params;
  const fileId = stubId('file');
  return {
    storageBackend: 'google_drive',
    storageUri: `gdrive://file/${fileId}`,
    driveFileId: fileId,
    driveWebViewLink: fileViewLink(fileId),
    driveWebContentLink: fileContentLink(fileId),
  };
}

export async function moveOrCopyDocumentToPedido(params: {
  sourceFileId: string;
  destinationLogicalPath: string;
}): Promise<DriveReference> {
  void params;
  const fileId = stubId('file');
  return {
    storageBackend: 'google_drive',
    storageUri: `gdrive://file/${fileId}`,
    driveFileId: fileId,
    driveWebViewLink: fileViewLink(fileId),
    driveWebContentLink: fileContentLink(fileId),
  };
}

export async function listRecentFiles(daysBack: number): Promise<DriveReference[]> {
  void daysBack;
  return [];
}
