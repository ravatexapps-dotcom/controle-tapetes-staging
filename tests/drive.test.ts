import { describe, it, expect } from 'vitest';
import {
  ensureRootFolder,
  ensureFolderPath,
  uploadDocument,
  uploadManifest,
  moveOrCopyDocumentToPedido,
} from '../src/connectors/drive.js';

describe('drive connector (stub contract)', () => {
  it('ensureRootFolder returns a Drive folder reference', async () => {
    const ref = await ensureRootFolder();
    expect(ref.driveFolderId).toBeTruthy();
    expect(ref.folderUri).toMatch(/^gdrive:\/\/folder\//);
  });

  it('ensureFolderPath returns a Drive folder reference for any logical path', async () => {
    const ref = await ensureFolderPath('Ravatex/pedidos/PED-25-2026/2026-07-06/nf');
    expect(ref.driveFolderId).toBeTruthy();
    expect(ref.folderUri).toMatch(/^gdrive:\/\/folder\//);
  });

  it('uploadDocument returns DriveReference with gdrive://file/<id>', async () => {
    const result = await uploadDocument({
      folderLogicalPath: 'Ravatex/pendentes/2026-07-06/email-abc',
      filename: 'nota.pdf',
      mimeType: 'application/pdf',
    });
    expect(result.file.storageBackend).toBe('google_drive');
    expect(result.file.storageUri).toMatch(/^gdrive:\/\/file\//);
    expect(result.file.driveFileId).toBeTruthy();
    expect(result.file.driveWebViewLink).toMatch(/^https:\/\/drive\.google\.com\/file\/d\//);
  });

  it('uploadManifest returns DriveReference for manifest.json', async () => {
    const ref = await uploadManifest({ pedido: 'PED-25-2026', payload: {} });
    expect(ref.storageBackend).toBe('google_drive');
    expect(ref.storageUri).toMatch(/^gdrive:\/\/file\//);
    expect(ref.driveFileId).toBeTruthy();
  });

  it('moveOrCopyDocumentToPedido returns a new Drive file reference', async () => {
    const ref = await moveOrCopyDocumentToPedido({
      sourceFileId: 'source-abc',
      destinationLogicalPath: 'Ravatex/pedidos/PED-25-2026/2026-07-06/nf',
    });
    expect(ref.storageBackend).toBe('google_drive');
    expect(ref.driveFileId).toBeTruthy();
  });
});
