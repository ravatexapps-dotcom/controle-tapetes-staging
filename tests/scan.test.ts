import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createScan } from '../src/core/realScan.js';
import type { ScanDeps } from '../src/core/realScan.js';
import { getDb, closeDb } from '../src/storage/sqlite.js';

function mkDeps(overrides: Partial<ScanDeps> = {}): ScanDeps {
  return {
    fetchEmails: async (daysBack: number) => {
      void daysBack;
      return [];
    },
    listAtts: async (msgId: string) => {
      void msgId;
      return [];
    },
    downloadAtt: async () => null,
    uploadDoc: async ({ filename, mimeType }) => ({
      file: {
        storageUri: `gdrive://file/mock-${encodeURIComponent(filename)}`,
        driveFileId: `mock-${encodeURIComponent(filename)}`,
        driveWebViewLink: `https://drive.google.com/file/d/mock-${encodeURIComponent(filename)}/view`,
        driveFolderId: 'mock-folder',
      },
    }),
    ...overrides,
  };
}

import { randomUUID } from 'node:crypto';

const DB_DIR = join(tmpdir(), `ravatex-scan-test-${randomUUID()}`);

describe('real scan flow (mocked Google)', () => {
  beforeEach(() => {
    if (existsSync(DB_DIR)) rmSync(DB_DIR, { recursive: true });
    mkdirSync(DB_DIR, { recursive: true });
    process.env.DATABASE_PATH = join(DB_DIR, 'app.db');
    process.env.OUTBOX_PATH = join(DB_DIR, 'outbox.jsonl');
    process.env.LOCAL_CACHE_PATH = join(DB_DIR, 'cache');
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME = 'Ravatex Documents Ingestor';
    closeDb();
    const db = getDb();
    db.exec('DELETE FROM ingestion_events; DELETE FROM documentos; DELETE FROM emails_processados;');
  });

  afterEach(() => {
    closeDb();
    if (existsSync(DB_DIR)) rmSync(DB_DIR, { recursive: true });
  });

  it('dry-run mode does NOT call any deps', async () => {
    let called = false;
    const deps = mkDeps({
      fetchEmails: async () => { called = true; return []; },
    });
    const scan = createScan(deps);
    const result = await scan({ confirmReal: false });
    expect(result.mode).toBe('dry-run');
    expect(called).toBe(false);
  });

  it('real scan: empty mailbox produces 0 documents', async () => {
    const scan = createScan(mkDeps());
    const result = await scan({ confirmReal: true });
    expect(result.mode).toBe('real');
    expect(result.emailsScanned).toBe(0);
    expect(result.newDocuments).toBe(0);
  });

  it('real scan: detects PDF, classifies as nf_pdf, uploads, persists in SQLite', async () => {
    const fakePdf = Buffer.from('%PDF-1.4\n...nota fiscal fake content...');
    const deps = mkDeps({
      fetchEmails: async () => [
        {
          gmailMessageId: 'msg-1',
          threadId: 'thr-1',
          from: 'fornecedor@example.com',
          subject: 'NF-e 12345',
          date: '2026-07-01',
          attachmentCount: 1,
        },
      ],
      listAtts: async () => [
        {
          gmailMessageId: 'msg-1',
          threadId: 'thr-1',
          attachmentId: 'att-1',
          filename: 'NF-12345.pdf',
          mimeType: 'application/pdf',
          size: fakePdf.length,
        },
      ],
      downloadAtt: async () => fakePdf,
    });
    const scan = createScan(deps);
    const result = await scan({ confirmReal: true });
    expect(result.newDocuments).toBe(1);
    expect(result.duplicates).toBe(0);

    const db = getDb();
    const docs = db.prepare(`SELECT * FROM documentos`).all() as any[];
    expect(docs).toHaveLength(1);
    expect(docs[0].filename_original).toBe('NF-12345.pdf');
    expect(docs[0].tipo_documento).toBe('nf_pdf');
    expect(docs[0].storage_backend).toBe('google_drive');
    expect(docs[0].storage_uri).toMatch(/^gdrive:\/\/file\//);
    expect(docs[0].drive_file_id).toBeTruthy();
    expect(docs[0].drive_web_view_link).toMatch(/^https:\/\/drive\.google\.com\/file\/d\//);
    expect(docs[0].status).toBe('pending');
  });

  it('real scan: second scan of same email is fully skipped (idempotency at email level)', async () => {
    const fakePdf = Buffer.from('%PDF-1.4\n...content...');
    const deps = mkDeps({
      fetchEmails: async () => [
        { gmailMessageId: 'msg-skip-twice', threadId: 't', from: '', subject: 'NF', date: '', attachmentCount: 1 },
      ],
      listAtts: async () => [
        { gmailMessageId: 'msg-skip-twice', threadId: 't', attachmentId: 'att-1', filename: 'n.pdf', mimeType: 'application/pdf', size: 0 },
      ],
      downloadAtt: async () => fakePdf,
    });
    const scan = createScan(deps);
    const r1 = await scan({ confirmReal: true });
    expect(r1.newDocuments).toBe(1);
    const r2 = await scan({ confirmReal: true });
    expect(r2.newDocuments).toBe(0);
    expect(r2.duplicates).toBe(0);
    const db = getDb();
    const docCount = (db.prepare(`SELECT COUNT(*) AS c FROM documentos`).get() as any).c;
    expect(docCount).toBe(1);
  });

  it('real scan: XML with NF-e structure is classified as nf_xml', async () => {
    const xml = Buffer.from('<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>');
    const deps = mkDeps({
      fetchEmails: async () => [
        { gmailMessageId: 'm', threadId: 't', from: '', subject: '', date: '', attachmentCount: 1 },
      ],
      listAtts: async () => [
        { gmailMessageId: 'm', threadId: 't', attachmentId: 'a', filename: 'nfe.xml', mimeType: 'text/xml', size: 0 },
      ],
      downloadAtt: async () => xml,
    });
    const scan = createScan(deps);
    const r = await scan({ confirmReal: true });
    expect(r.newDocuments).toBe(1);
    const db = getDb();
    const doc = db.prepare(`SELECT tipo_documento FROM documentos LIMIT 1`).get() as any;
    expect(doc.tipo_documento).toBe('nf_xml');
  });

  it('real scan: PDF with romaneio in name is classified as romaneio', async () => {
    const pdf = Buffer.from('%PDF-1.4\nromaneio...');
    const deps = mkDeps({
      fetchEmails: async () => [
        { gmailMessageId: 'm2', threadId: 't', from: '', subject: '', date: '', attachmentCount: 1 },
      ],
      listAtts: async () => [
        { gmailMessageId: 'm2', threadId: 't', attachmentId: 'a', filename: 'romaneio_carga.pdf', mimeType: 'application/pdf', size: 0 },
      ],
      downloadAtt: async () => pdf,
    });
    const scan = createScan(deps);
    await scan({ confirmReal: true });
    const db = getDb();
    const doc = db.prepare(`SELECT tipo_documento FROM documentos LIMIT 1`).get() as any;
    expect(doc.tipo_documento).toBe('romaneio');
  });

  it('real scan: non-PDF/XML attachment is filtered out', async () => {
    const png = Buffer.from('not a real png');
    let downloadCalled = false;
    const deps = mkDeps({
      fetchEmails: async () => [
        { gmailMessageId: 'm3', threadId: 't', from: '', subject: '', date: '', attachmentCount: 1 },
      ],
      listAtts: async () => [
        { gmailMessageId: 'm3', threadId: 't', attachmentId: 'a', filename: 'photo.png', mimeType: 'image/png', size: 0 },
      ],
      downloadAtt: async () => { downloadCalled = true; return png; },
    });
    const scan = createScan(deps);
    const r = await scan({ confirmReal: true });
    expect(r.newDocuments).toBe(0);
    expect(downloadCalled).toBe(false);
  });

  it('real scan: email already processed is skipped (idempotency)', async () => {
    const fakePdf = Buffer.from('%PDF-1.4\n...content...');
    let fetchCalls = 0;
    const deps = mkDeps({
      fetchEmails: async () => {
        fetchCalls++;
        return [
          { gmailMessageId: 'msg-once', threadId: 't', from: '', subject: '', date: '', attachmentCount: 1 },
        ];
      },
      listAtts: async () => [
        { gmailMessageId: 'msg-once', threadId: 't', attachmentId: 'a', filename: 'n.pdf', mimeType: 'application/pdf', size: 0 },
      ],
      downloadAtt: async () => fakePdf,
    });
    const scan = createScan(deps);
    await scan({ confirmReal: true });
    await scan({ confirmReal: true });
    expect(fetchCalls).toBe(2);
    const db = getDb();
    const emails = db.prepare(`SELECT * FROM emails_processados`).all();
    expect(emails).toHaveLength(1);
  });

  it('real scan: errors during upload are captured, not thrown', async () => {
    const fakePdf = Buffer.from('%PDF-1.4\n...');
    const deps = mkDeps({
      fetchEmails: async () => [
        { gmailMessageId: 'm-err', threadId: 't', from: '', subject: '', date: '', attachmentCount: 1 },
      ],
      listAtts: async () => [
        { gmailMessageId: 'm-err', threadId: 't', attachmentId: 'a', filename: 'n.pdf', mimeType: 'application/pdf', size: 0 },
      ],
      downloadAtt: async () => fakePdf,
      uploadDoc: async () => { throw new Error('drive quota'); },
    });
    const scan = createScan(deps);
    const r = await scan({ confirmReal: true });
    expect(r.newDocuments).toBe(0);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});
