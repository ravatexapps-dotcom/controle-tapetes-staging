import { randomUUID } from 'node:crypto';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getDb } from '../storage/sqlite.js';
import { classifyAttachment } from './classifier.js';
import { isDuplicate, isEmailProcessed, markEmailProcessed } from './dedupe.js';
import { appendEvent, isEventDuplicate } from './outbox.js';
import { normalizePedido } from './pedido.js';
import { addDocumentToManifest } from './manifest.js';
import {
  pedidoSubfolderDrivePath,
  manifestDrivePath,
  localCacheRoot,
} from './paths.js';
import {
  ensureRootFolder,
  ensureFolderPath,
  uploadDocument,
  uploadManifest,
} from '../connectors/drive.js';
import { createDocumentEvent } from '../types/event.js';
import type { TipoDocumento } from '../types/document.js';
import { config } from '../config.js';

export async function scanGmail(options: { daysBack?: number } = {}): Promise<number> {
  console.log('[scanGmail] Structure prepared — Gmail connector not yet wired.');
  console.log('[scanGmail] Would scan emails with daysBack=%d', options.daysBack ?? 7);
  return 0;
}

export interface AssignResult {
  documentId: string;
  pedidoManual: string;
  eventId: string;
  storageUri: string;
  driveFileId: string;
}

export async function assignPedido(
  emailOrDocumentId: string,
  pedidoManual: string,
): Promise<AssignResult | null> {
  const normalized = normalizePedido(pedidoManual);
  if (!normalized) {
    console.error('Invalid pedido format:', pedidoManual);
    return null;
  }

  const database = getDb();

  const doc = database.prepare(
    `SELECT * FROM documentos WHERE id = ? OR gmail_message_id = ? LIMIT 1`
  ).get(emailOrDocumentId, emailOrDocumentId) as any;

  if (!doc) {
    console.error('Document not found:', emailOrDocumentId);
    return null;
  }

  if (doc.status !== 'pending') {
    console.log('Document already assigned (status=%s)', doc.status);
    return null;
  }

  const eventId = randomUUID();
  const tipo = doc.tipo_documento as TipoDocumento;

  const subfolder = pedidoSubfolderDrivePath(normalized, tipo);
  const mPath = manifestDrivePath(normalized);

  const folderRef = await ensureFolderPath(subfolder.logicalPath);
  const upload = await uploadDocument({
    folderLogicalPath: subfolder.logicalPath,
    filename: doc.filename_original,
    mimeType: 'application/octet-stream',
  });
  void mPath;

  const localCacheFilePath = join(localCacheRoot(), 'pedidos', normalized, subfolder.logicalPath.split('/').slice(-2).join('/'), doc.filename_original);
  ensureLocalCacheDir(localCacheFilePath);

  const manifestUpload = await uploadManifest({
    pedido: normalized,
    payload: { pedido: normalized, documents: [] },
  });

  addDocumentToManifest('/dev/null', normalized, {
    document_id: doc.id,
    tipo_documento: tipo,
    filename_original: doc.filename_original,
    sha256: doc.sha256,
    storage_backend: 'google_drive',
    storage_uri: upload.file.storageUri,
    drive_file_id: upload.file.driveFileId,
    drive_folder_id: upload.file.driveFolderId,
    drive_web_view_link: upload.file.driveWebViewLink,
    drive_web_content_link: upload.file.driveWebContentLink,
    local_cache_path: localCacheFilePath,
    ingested_at: new Date().toISOString(),
    event_id: eventId,
    status: 'pending_app_acceptance',
  });

  database.prepare(
    `UPDATE documentos
     SET status = 'assigned',
         pedido_manual = ?,
         updated_at = datetime('now'),
         storage_backend = 'google_drive',
         storage_uri = ?,
         drive_file_id = ?,
         drive_folder_id = ?,
         drive_web_view_link = ?,
         drive_web_content_link = ?,
         local_cache_path = ?
     WHERE id = ?`
  ).run(
    normalized,
    upload.file.storageUri,
    upload.file.driveFileId,
    upload.file.driveFolderId,
    upload.file.driveWebViewLink,
    upload.file.driveWebContentLink,
    localCacheFilePath,
    doc.id,
  );

  const event = createDocumentEvent({
    eventId,
    pedidoManual: normalized,
    gmailMessageId: doc.gmail_message_id,
    threadId: doc.thread_id,
    documentId: doc.id,
    tipoDocumento: tipo,
    filenameOriginal: doc.filename_original,
    sha256: doc.sha256,
    driveFileId: upload.file.driveFileId,
    driveFolderId: upload.file.driveFolderId,
    driveWebViewLink: upload.file.driveWebViewLink,
    driveWebContentLink: upload.file.driveWebContentLink,
    localCachePath: localCacheFilePath,
    manifestStorageUri: manifestUpload.storageUri,
    status: 'pending_app_acceptance',
  });

  if (!isEventDuplicate(eventId)) {
    database.prepare(
      `INSERT INTO ingestion_events (
         id, event_type, pedido_manual, document_id, status,
         storage_backend, storage_uri, drive_file_id, drive_web_view_link,
         manifest_storage_uri, manifest_drive_file_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      eventId,
      'document.detected',
      normalized,
      doc.id,
      'pending_app_acceptance',
      'google_drive',
      event.document.storage_uri,
      event.document.drive_file_id,
      event.document.drive_web_view_link ?? null,
      event.document.manifest_storage_uri ?? null,
      manifestUpload.driveFileId,
    );

    appendEvent(event);
  }

  void folderRef;
  void ensureRootFolder;
  void config;

  return {
    documentId: doc.id,
    pedidoManual: normalized,
    eventId,
    storageUri: upload.file.storageUri,
    driveFileId: upload.file.driveFileId,
  };
}

function ensureLocalCacheDir(filePath: string): void {
  const idx = filePath.lastIndexOf('\\') >= 0 ? filePath.lastIndexOf('\\') : filePath.lastIndexOf('/');
  if (idx === -1) return;
  const dir = filePath.slice(0, idx);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function listPending(): any[] {
  const database = getDb();
  return database.prepare(
    `SELECT * FROM documentos WHERE status = 'pending' ORDER BY created_at DESC`
  ).all();
}

export function getDocumentEvents(): any[] {
  const database = getDb();
  return database.prepare(
    `SELECT * FROM ingestion_events ORDER BY created_at DESC`
  ).all();
}

export { classifyAttachment } from './classifier.js';
export { normalizePedido } from './pedido.js';
export { exportPendingEvents } from './outbox.js';
