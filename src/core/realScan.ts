import { createHash, randomUUID } from 'node:crypto';
import { getDb } from '../storage/sqlite.js';
import { classifyAttachment } from './classifier.js';
import { isDuplicate, isEmailProcessed, markEmailProcessed } from './dedupe.js';
import { pendenteDrivePath } from './paths.js';
import { uploadDocument, uploadManifest } from '../connectors/drive.js';
import { fetchRecentEmails, listAttachments, downloadAttachment, isAttachmentCandidate } from '../connectors/gmail.js';
import type { GmailAttachmentRef, GmailMessageMeta, RawAttachment } from '../connectors/gmail.js';

export interface ScanOptions {
  daysBack?: number;
  confirmReal?: boolean;
}

export interface ScanResult {
  mode: 'real' | 'dry-run';
  emailsScanned: number;
  attachmentsFound: number;
  newDocuments: number;
  duplicates: number;
  errors: string[];
}

export interface ScanDeps {
  fetchEmails: (daysBack: number) => Promise<GmailMessageMeta[]>;
  listAtts: (msgId: string) => Promise<GmailAttachmentRef[]>;
  downloadAtt: (msgId: string, attId: string) => Promise<Buffer | null>;
  uploadDoc: (params: { folderLogicalPath: string; filename: string; mimeType: string; data: Buffer }) => Promise<{ file: { storageUri: string; driveFileId: string; driveWebViewLink: string; driveFolderId?: string; driveWebContentLink?: string } }>;
}

const defaultDeps: ScanDeps = {
  fetchEmails: async (daysBack) => fetchRecentEmails(daysBack),
  listAtts: async (msgId) => listAttachments(msgId),
  downloadAtt: async (msgId, attId) => downloadAttachment(msgId, attId),
  uploadDoc: async (params) => {
    const r = await uploadDocument(params);
    return { file: r.file };
  },
};

export function createScan(deps: ScanDeps = defaultDeps) {
  return async function scan(opts: ScanOptions = {}): Promise<ScanResult> {
    const mode: 'real' | 'dry-run' = opts.confirmReal ? 'real' : 'dry-run';
    const daysBack = opts.daysBack ?? 7;
    const errors: string[] = [];
    let attachmentsFound = 0;
    let newDocuments = 0;
    let duplicates = 0;

    if (mode === 'dry-run') {
      return {
        mode,
        emailsScanned: 0,
        attachmentsFound: 0,
        newDocuments: 0,
        duplicates: 0,
        errors: [],
      };
    }

    const emails = await deps.fetchEmails(daysBack);
    const database = getDb();

    for (const email of emails) {
      if (isEmailProcessed(email.gmailMessageId)) continue;

      markEmailProcessed(email.gmailMessageId, email.threadId, email.subject, 0);

      const atts = await deps.listAtts(email.gmailMessageId);
      const candidates = atts.filter(a => isAttachmentCandidate(a.filename, a.mimeType));
      attachmentsFound += candidates.length;

      let processedCount = 0;
      for (const att of candidates) {
        try {
          const buffer = await deps.downloadAtt(email.gmailMessageId, att.attachmentId);
          if (!buffer) {
            errors.push(`empty buffer for ${att.attachmentId}`);
            continue;
          }

          const sha256 = createHash('sha256').update(buffer).digest('hex');
          if (isDuplicate(email.gmailMessageId, att.attachmentId, sha256)) {
            duplicates++;
            continue;
          }

          const tipo = classifyAttachment({
            filename: att.filename,
            mimeType: att.mimeType,
            subject: email.subject,
            contentSample: sampleXml(buffer, att.mimeType),
          });

          const drivePath = pendenteDrivePath(email.gmailMessageId).logicalPath;
          const upload = await deps.uploadDoc({
            folderLogicalPath: drivePath,
            filename: att.filename,
            mimeType: att.mimeType,
            data: buffer,
          });

          const documentId = randomUUID();
          database.prepare(
            `INSERT INTO documentos (
               id, gmail_message_id, thread_id, attachment_id, filename_original,
               sha256, tipo_documento,
               storage_backend, storage_uri, drive_file_id, drive_folder_id,
               drive_web_view_link, drive_web_content_link, local_cache_path,
               status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
          ).run(
            documentId,
            email.gmailMessageId,
            email.threadId,
            att.attachmentId,
            att.filename,
            sha256,
            tipo,
            'google_drive',
            upload.file.storageUri,
            upload.file.driveFileId,
            upload.file.driveFolderId ?? null,
            upload.file.driveWebViewLink,
            upload.file.driveWebContentLink ?? null,
            null,
          );
          newDocuments++;
          processedCount++;
        } catch (err: any) {
          errors.push(`att ${att.attachmentId}: ${err?.message ?? String(err)}`);
        }
      }

      database.prepare(
        `UPDATE emails_processados SET attachments_count = ? WHERE gmail_message_id = ?`
      ).run(processedCount, email.gmailMessageId);
    }

    return {
      mode,
      emailsScanned: emails.length,
      attachmentsFound,
      newDocuments,
      duplicates,
      errors,
    };
  };
}

function sampleXml(buffer: Buffer, mimeType: string): string {
  if (mimeType !== 'text/xml' && mimeType !== 'application/xml') return '';
  return buffer.toString('utf-8', 0, Math.min(buffer.length, 2048));
}
