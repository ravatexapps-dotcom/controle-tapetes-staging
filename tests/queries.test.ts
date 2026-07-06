import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getDb, closeDb } from '../src/storage/sqlite.js';
import { listPendingDocuments, inspectByDocumentOrEmail, generateReport, planReprocess } from '../src/core/queries.js';
import { HERMETIC_TEST_ROOT } from './setup.js';

const SCENARIO_DIR = join(HERMETIC_TEST_ROOT, `queries-test-${randomUUID()}`);

function seed() {
  const db = getDb();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  db.prepare(`INSERT INTO emails_processados (gmail_message_id, thread_id, subject, processed_at, attachments_count) VALUES (?, ?, ?, ?, ?)`).run('msg-q-1', 'thr-q-1', 'NF-e 12345', now, 1);
  db.prepare(`INSERT INTO emails_processados (gmail_message_id, thread_id, subject, processed_at, attachments_count) VALUES (?, ?, ?, ?, ?)`).run('msg-q-2', 'thr-q-2', 'Romaneio carga', now, 1);
  db.prepare(`INSERT INTO documentos (id, gmail_message_id, thread_id, attachment_id, filename_original, sha256, tipo_documento, storage_backend, storage_uri, drive_file_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('doc-1', 'msg-q-1', 'thr-q-1', 'att-1', 'NF-12345.pdf', 'sha1', 'nf_pdf', 'google_drive', 'gdrive://file/d1', 'd1', 'pending', now, now);
  db.prepare(`INSERT INTO documentos (id, gmail_message_id, thread_id, attachment_id, filename_original, sha256, tipo_documento, storage_backend, storage_uri, drive_file_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('doc-2', 'msg-q-2', 'thr-q-2', 'att-2', 'romaneio.pdf', 'sha2', 'romaneio', 'google_drive', 'gdrive://file/d2', 'd2', 'assigned', now, now);
  db.prepare(`UPDATE documentos SET pedido_manual = ? WHERE id = ?`).run('PED-01-2026', 'doc-2');
  db.prepare(`INSERT INTO ingestion_events (id, event_type, pedido_manual, document_id, status, storage_backend, storage_uri, drive_file_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run('ev-1', 'document.detected', 'PED-01-2026', 'doc-2', 'pending_app_acceptance', 'google_drive', 'gdrive://file/d2', 'd2', now);
}

describe('operational queries (hermetic)', () => {
  beforeEach(() => {
    if (existsSync(SCENARIO_DIR)) rmSync(SCENARIO_DIR, { recursive: true });
    mkdirSync(SCENARIO_DIR, { recursive: true });
    process.env.DATABASE_PATH = join(SCENARIO_DIR, 'app.db');
    process.env.OUTBOX_PATH = join(SCENARIO_DIR, 'outbox.jsonl');
    process.env.LOCAL_CACHE_PATH = join(SCENARIO_DIR, 'cache');
    closeDb();
    const db = getDb();
    db.exec('DELETE FROM ingestion_events; DELETE FROM documentos; DELETE FROM emails_processados;');
    seed();
  });

  afterEach(() => {
    closeDb();
    if (existsSync(SCENARIO_DIR)) rmSync(SCENARIO_DIR, { recursive: true });
  });

  it('listPendingDocuments default limit is 20', () => {
    const rows = listPendingDocuments();
    expect(rows.length).toBeLessThanOrEqual(20);
  });

  it('listPendingDocuments respects --limit', () => {
    const rows = listPendingDocuments({ limit: 1 });
    expect(rows).toHaveLength(1);
  });

  it('listPendingDocuments caps limit at 200', () => {
    const rows = listPendingDocuments({ limit: 9999 });
    expect(rows.length).toBeLessThanOrEqual(200);
  });

  it('listPendingDocuments filters by status', () => {
    const pending = listPendingDocuments({ status: 'pending' });
    expect(pending.every(r => r.status === 'pending')).toBe(true);
    const assigned = listPendingDocuments({ status: 'assigned' });
    expect(assigned.every(r => r.status === 'assigned')).toBe(true);
  });

  it('listPendingDocuments filters by tipo', () => {
    const romaneio = listPendingDocuments({ tipo: 'romaneio' });
    expect(romaneio.every(r => r.tipo_documento === 'romaneio')).toBe(true);
  });

  it('inspectByDocumentOrEmail finds by document id', () => {
    const result = inspectByDocumentOrEmail('doc-1');
    expect(result).not.toBeNull();
    expect(result!.document.id).toBe('doc-1');
    expect(result!.document.gmail_message_id).toBe('msg-q-1');
    expect(result!.email).not.toBeNull();
    expect(result!.email.subject).toBe('NF-e 12345');
  });

  it('inspectByDocumentOrEmail finds by gmail message id', () => {
    const result = inspectByDocumentOrEmail('msg-q-2');
    expect(result).not.toBeNull();
    expect(result!.document.id).toBe('doc-2');
    expect(result!.events).toHaveLength(1);
  });

  it('inspectByDocumentOrEmail returns null for unknown id', () => {
    expect(inspectByDocumentOrEmail('nonexistent')).toBeNull();
  });

  it('generateReport aggregates by tipo and status', () => {
    const report = generateReport();
    expect(report.totalEmailsProcessed).toBe(2);
    expect(report.totalDocuments).toBe(2);
    expect(report.documentsByTipo.nf_pdf).toBe(1);
    expect(report.documentsByTipo.romaneio).toBe(1);
    expect(report.documentsByStatus.pending).toBe(1);
    expect(report.documentsByStatus.assigned).toBe(1);
    expect(report.pendingWithoutPedido).toBe(1);
    expect(report.assignedByPedido['PED-01-2026']).toBe(1);
    expect(report.pendingAppAcceptance).toBe(1);
  });

  it('planReprocess returns actions for pending document with Drive ref', () => {
    const plan = planReprocess('doc-1');
    expect(plan).not.toBeNull();
    expect(plan!.actions).toContain('reclassify-local');
    expect(plan!.actions).toContain('create-outbox-event-if-absent');
    expect(plan!.blocked).toBe(false);
  });

  it('planReprocess blocks assigned documents', () => {
    const plan = planReprocess('doc-2');
    expect(plan).not.toBeNull();
    expect(plan!.blocked).toBe(true);
    expect(plan!.blockReason).toContain('assigned');
  });
});
