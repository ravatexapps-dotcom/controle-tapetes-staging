#!/usr/bin/env node
import { Command } from 'commander';
import { scanGmail, listPending, assignPedido, exportPendingEvents } from './index.js';
import { config } from './config.js';

const program = new Command();

program
  .name('ravatex-ingestor')
  .description('Ravatex Documents Ingestor CLI')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan Gmail for new document attachments')
  .option('-d, --days <number>', 'Number of days back to scan', String(config.scanDaysBack))
  .option('--confirm-real-google', 'Process real Gmail/Drive (otherwise dry-run)')
  .option('--dry-run', 'Force dry-run even if --confirm-real-google is set')
  .action(async (opts) => {
    const confirmReal = Boolean(opts.confirmRealGoogle) && !opts.dryRun;
    const result = await scanGmail({
      daysBack: parseInt(opts.days, 10),
      confirmReal,
    });
    if (result.mode === 'dry-run') {
      console.log('[scan] DRY-RUN — no real Gmail/Drive calls performed.');
      console.log('[scan] Pass --confirm-real-google to perform real processing.');
    } else {
      console.log('[scan] REAL mode:');
      console.log(`  emailsScanned:    ${result.emailsScanned}`);
      console.log(`  attachmentsFound: ${result.attachmentsFound}`);
      console.log(`  newDocuments:     ${result.newDocuments}`);
      console.log(`  duplicates:       ${result.duplicates}`);
      if (result.errors.length) {
        console.log(`  errors:           ${result.errors.length}`);
        for (const e of result.errors) console.log(`    - ${e}`);
      }
    }
  });

program
  .command('list-pending')
  .description('List pending documents')
  .action(() => {
    const pending = listPending();
    if (pending.length === 0) {
      console.log('No pending documents.');
      return;
    }
    for (const doc of pending) {
      console.log(`  ${doc.id} | ${doc.filename_original} | ${doc.tipo_documento} | ${doc.drive_file_id ?? 'no-drive'} | ${doc.created_at}`);
    }
  });

program
  .command('assign')
  .description('Assign a document to a Pedido')
  .requiredOption('--id <id>', 'Document ID or Gmail message ID')
  .requiredOption('--pedido <pedido>', 'Pedido number (e.g. 25/2026)')
  .option('--confirm-real-google', 'Move/copy in real Drive (otherwise dry-run)')
  .action(async (opts) => {
    const result = await assignPedido(opts.id, opts.pedido, {
      confirmReal: Boolean(opts.confirmRealGoogle),
    });
    if (result) {
      console.log('Assigned: document=%s pedido=%s event=%s storage=%s', result.documentId, result.pedidoManual, result.eventId, result.storageUri);
    } else {
      console.log('Assign did not produce a result. Use --confirm-real-google to perform real Drive move.');
      process.exit(1);
    }
  });

program
  .command('export-events')
  .description('Export pending events to JSONL outbox')
  .action(() => {
    const events = exportPendingEvents();
    console.log('Exported %d events.', events.length);
  });

program.parse(process.argv);
