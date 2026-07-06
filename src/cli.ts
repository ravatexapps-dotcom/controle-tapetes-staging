#!/usr/bin/env node
import { Command } from 'commander';
import { scanGmail, listPending, assignPedido, exportPendingEvents } from './index.js';

const program = new Command();

program
  .name('ravatex-ingestor')
  .description('Ravatex Documents Ingestor CLI')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan Gmail for new document attachments')
  .option('-d, --days <number>', 'Number of days back to scan', '7')
  .action(async (opts) => {
    const count = await scanGmail({ daysBack: parseInt(opts.days, 10) });
    console.log('Scan complete. %d new documents detected.', count);
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
      console.log(`  ${doc.id} | ${doc.filename_original} | ${doc.tipo_documento} | ${doc.created_at}`);
    }
  });

program
  .command('assign')
  .description('Assign a document to a Pedido')
  .requiredOption('--id <id>', 'Document ID or Gmail message ID')
  .requiredOption('--pedido <pedido>', 'Pedido number (e.g. 25/2026)')
  .action(async (opts) => {
    const result = await assignPedido(opts.id, opts.pedido);
    if (result) {
      console.log('Assigned: document=%s pedido=%s event=%s storage=%s', result.documentId, result.pedidoManual, result.eventId, result.storageUri);
    } else {
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
