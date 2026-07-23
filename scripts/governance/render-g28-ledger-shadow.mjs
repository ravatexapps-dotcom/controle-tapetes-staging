import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  COMPATIBILITY_BEGIN,
  COMPATIBILITY_END,
  COMPATIBILITY_PATH,
  INDEX_PATH,
  PARTITION_DIR,
  PAYLOAD_BEGIN,
  PAYLOAD_END,
  REPO_ROOT
} from './build-g28-ledger-partitions.mjs';

function readPayload(filePath) {
  const bytes = fs.readFileSync(filePath);
  const begin = Buffer.from(`${PAYLOAD_BEGIN}\n`, 'utf8');
  const end = Buffer.from(`\n${PAYLOAD_END}\n`, 'utf8');
  const start = bytes.indexOf(begin);
  const finish = bytes.indexOf(end, start + begin.length);
  if (start < 0 || finish < 0) throw new Error(`partition payload markers missing: ${filePath}`);
  return bytes.subarray(start + begin.length, finish);
}

export function renderCompatibilityPayload(root = REPO_ROOT) {
  const index = JSON.parse(fs.readFileSync(path.join(root, INDEX_PATH), 'utf8'));
  const payloads = index.partitions.map(partition => readPayload(path.join(root, PARTITION_DIR, partition.file_name)));
  return Buffer.concat(payloads);
}

export function renderCompatibilityView(root = REPO_ROOT) {
  const payload = renderCompatibilityPayload(root);
  const header = Buffer.from([
    '<!-- GENERATED NON-CANONICAL COMPATIBILITY VIEW — DO NOT EDIT -->',
    '<!-- canonical_source: docs/ledgers/G28_LEDGER.md -->',
    '<!-- reconstruction: ORDERED_PARTITION_PAYLOADS -->',
    COMPATIBILITY_BEGIN,
    ''
  ].join('\n'), 'utf8');
  return Buffer.concat([header, payload, Buffer.from(`\n${COMPATIBILITY_END}\n`, 'utf8')]);
}

export function writeCompatibilityView(root = REPO_ROOT) {
  const output = path.join(root, COMPATIBILITY_PATH);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderCompatibilityView(root));
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    writeCompatibilityView(process.cwd());
    console.log('G28_LEDGER_SHADOW_RENDER: PASS');
  } catch (error) {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  }
}
