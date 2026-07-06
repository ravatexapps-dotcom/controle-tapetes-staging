import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDb, closeDb } from '../src/storage/sqlite.js';
import { randomUUID } from 'node:crypto';

const DB_DIR = join(tmpdir(), `ravatex-schema-test-${randomUUID()}`);

describe('SQLite schema carries Drive-first contract', () => {
  beforeEach(() => {
    if (existsSync(DB_DIR)) rmSync(DB_DIR, { recursive: true });
    mkdirSync(DB_DIR, { recursive: true });
    process.env.DATABASE_PATH = join(DB_DIR, 'app.db');
    process.env.OUTBOX_PATH = join(DB_DIR, 'outbox.jsonl');
    process.env.LOCAL_CACHE_PATH = join(DB_DIR, 'cache');
    closeDb();
    getDb();
  });

  afterEach(() => {
    closeDb();
    if (existsSync(DB_DIR)) rmSync(DB_DIR, { recursive: true });
  });

  it('documentos table has Drive columns', () => {
    const db = getDb();
    const cols = db.prepare(`PRAGMA table_info(documentos)`).all() as any[];
    const names = cols.map(c => c.name);
    expect(names).toContain('storage_backend');
    expect(names).toContain('storage_uri');
    expect(names).toContain('drive_file_id');
    expect(names).toContain('drive_folder_id');
    expect(names).toContain('drive_web_view_link');
    expect(names).toContain('drive_web_content_link');
    expect(names).toContain('local_cache_path');
  });

  it('ingestion_events table has Drive columns', () => {
    const db = getDb();
    const cols = db.prepare(`PRAGMA table_info(ingestion_events)`).all() as any[];
    const names = cols.map(c => c.name);
    expect(names).toContain('storage_backend');
    expect(names).toContain('storage_uri');
    expect(names).toContain('drive_file_id');
    expect(names).toContain('drive_web_view_link');
    expect(names).toContain('manifest_storage_uri');
    expect(names).toContain('manifest_drive_file_id');
  });

  it('documentos unique dedup index exists', () => {
    const db = getDb();
    const idx = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='index' AND name='idx_documentos_dedup'`
    ).get();
    expect(idx).toBeTruthy();
  });

  it('storage_backend default is google_drive', () => {
    const db = getDb();
    const uniqueId = `m-test-default-${randomUUID()}`;
    db.prepare(
      `INSERT OR IGNORE INTO emails_processados (gmail_message_id) VALUES (?)`
    ).run(uniqueId);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO documentos (
         id, gmail_message_id, attachment_id, filename_original, sha256
       ) VALUES (?, ?, ?, ?, ?)`
    ).run(id, uniqueId, 'a', 'n.pdf', 'a'.repeat(64));
    const doc = db.prepare(`SELECT storage_backend FROM documentos WHERE id = ?`).get(id) as any;
    expect(doc.storage_backend).toBe('google_drive');
  });
});
