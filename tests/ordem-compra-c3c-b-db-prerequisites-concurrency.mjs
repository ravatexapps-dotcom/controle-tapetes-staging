// PHASE-C3C-B-DB-PREREQ multi-session lock-order / re-evaluation proof.
// Governing contract: ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md §34.4.
// Idiom mirrors tests/ordem-compra-c3c-inactive-concurrency.mjs: OS-level psql
// subprocesses, a line-oriented sentinel protocol, cross-session blocking proven
// via pg_catalog.pg_blocking_pids, node:assert/strict, terminal token on success.
//
// ENVIRONMENT: local PostgreSQL only, full applied db/01..db/76 schema.
// Run:  PGDATABASE=<db> node tests/ordem-compra-c3c-b-db-prerequisites-concurrency.mjs
//
// Proof: two concurrent Component B calls against the SAME legacy-compat item
// serialize on the item FOR UPDATE lock; the second re-reads the committed total
// after its lock is granted (never a stale read). With absolute-total semantics a
// stale read would double-apply: holder moves 40 -> 55, subject targets 80; a
// fresh subject applies delta 25 (final 80), a stale subject would apply delta 40
// (final 95). Asserting the final cache is 80 proves the re-evaluation.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const psql = process.env.PSQL || 'psql';
const database = process.env.PGDATABASE || 'postgres';
const ADMIN = '77111111-1111-1111-1111-111111111111';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function openSession(name) {
  const child = spawn(psql, ['-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-d', database], {
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = [];
  const waiters = [];
  let pending = '';
  let stderr = '';
  let closed = false;
  let closeError;
  const completion = new Promise((resolve, reject) => {
    child.on('close', (code) => {
      closed = true;
      if (code !== 0) {
        closeError = new Error(`${name} psql exited ${code}: ${stderr}`);
        for (const waiter of waiters) { clearTimeout(waiter.timer); waiter.reject(closeError); }
        reject(closeError);
      } else {
        resolve();
      }
    });
  });

  function publish(line) {
    const value = line.trim();
    if (!value) return;
    lines.push(value);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(value)) {
        clearTimeout(waiter.timer);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(value);
      }
    }
  }

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    pending += chunk;
    const complete = pending.split(/\r?\n/);
    pending = complete.pop() || '';
    complete.forEach(publish);
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });

  return {
    name,
    send(sql) {
      assert.equal(closed, false, `${name} is closed`);
      child.stdin.write(`${sql}\n`);
    },
    waitFor(predicate, timeoutMs = 10000) {
      const existing = lines.find((line) => predicate(line));
      if (existing) return Promise.resolve(existing);
      if (closed) return Promise.reject(closeError || new Error(`${name} closed`));
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`${name} timeout; output=${lines.join(' | ')}; stderr=${stderr}`));
        }, timeoutMs);
        waiters.push({ predicate, resolve, reject, timer });
      });
    },
    async close() {
      if (!closed) child.stdin.write('\\q\n');
      await completion;
    },
  };
}

async function queryLines(sql) {
  const session = openSession('one-shot');
  const collected = [];
  session.send(`${sql}`);
  session.send(`SELECT 'ONE_SHOT_DONE';`);
  await session.waitFor((line) => { collected.push(line); return line === 'ONE_SHOT_DONE'; });
  await session.close();
  return collected.filter((line) => line !== 'ONE_SHOT_DONE');
}

async function waitForBlock(subjectPid, blockerPid) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const [row = ''] = await queryLines(`
      SELECT array_to_string(pg_catalog.pg_blocking_pids(${subjectPid}), ',')
      FROM pg_catalog.pg_stat_activity WHERE pid = ${subjectPid};
    `);
    if (row.split(',').includes(String(blockerPid))) return row;
    await delay(50);
  }
  throw new Error(`backend ${subjectPid} did not block on ${blockerPid}`);
}

// ---------------------------------------------------------------------------
// Setup: plant a canonical_active singleton + one compat-mapped legacy item with
// an imported opening balance of 40 kg (committed so both sessions observe it).
// ---------------------------------------------------------------------------
async function setup() {
  await queryLines(`
    SET session_replication_role = replica;
    INSERT INTO auth.users(id, email) VALUES ('${ADMIN}', 'c3cb-conc-admin@example.invalid')
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.usuarios(id, email, nome, tipo, fornecedor_id, ativo)
      VALUES ('${ADMIN}', 'c3cb-conc-admin@example.invalid', 'C3CB Conc Admin', 'admin', NULL, TRUE)
      ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.fornecedores(id, nome, tipo) VALUES (77001, 'C3CB Conc Supplier', 'fio_algodao');
    INSERT INTO public.cores(id, nome) VALUES (77001, 'C3CB Conc Color');
    INSERT INTO public.saldo_fios(tipo, cor_id, cor_poliester, kg_total) VALUES ('algodao', 77001, NULL, 1000.000);
    INSERT INTO public.pedidos(id, cliente_id, numero, status)
      VALUES ('77999999-0000-0000-0000-000000000001', 77001, 77001, 'rascunho');
    INSERT INTO public.ops(id, numero, ano, status, lote_id) VALUES (77001, 7701, 2026, 'aberta', NULL);
    INSERT INTO public.ordens_compra_fio(id, op_id, fornecedor_id, tipo, cor_id, cor_poliester,
      kg_pedido, kg_recebido, data_pedido, status, status_administrativo)
      VALUES (77001, 77001, 77001, 'algodao', 77001, NULL, 100.000, 40.000, CURRENT_DATE, 'recebido_parcial', 'emitida');
    INSERT INTO public.necessidade_compra_fio(id, pedido_id, origem_tipo, op_id, material, cor_id,
      cor_poliester, kg_necessario, kg_alocado, legado, legado_origem_ordem_compra_fio_id)
      VALUES (77001, '77999999-0000-0000-0000-000000000001', 'op', 77001, 'algodao', 77001, NULL, 100.000, 100.000, TRUE, 77001);
    INSERT INTO public.ordem_compra(id, pedido_id, fornecedor_id, status_administrativo, status_aceite,
      status_recebimento, legado, legado_provenance)
      VALUES (77001, '77999999-0000-0000-0000-000000000001', 77001, 'emitida', 'nao_aplicavel', 'parcial', TRUE, 'emitido_nao_recebido');
    INSERT INTO public.ordem_compra_item(id, ordem_id, material, cor_id, cor_poliester, kg_pedido, kg_recebido)
      VALUES (77001, 77001, 'algodao', 77001, NULL, 100.000, 40.000);
    INSERT INTO public.ordem_compra_item_alocacao(id, item_id, necessidade_id, op_id, kg_alocado)
      VALUES (77001, 77001, 77001, 77001, 100.000);
    INSERT INTO public.ordem_compra_item_compat_fio(id, ordem_compra_item_id, ordens_compra_fio_id, origem)
      VALUES (77001, 77001, 77001, 'imported_legacy');
    INSERT INTO public.ordem_compra_recebimentos(id, ordem_compra_id, comando_tipo, idempotency_namespace,
      idempotency_key, ator_id, ator_tipo, ocorrido_em, origem_tipo, comando_payload, comando_hash, resultado_metadata)
      VALUES (770001, 77001, 'import_saldo_inicial', 'legacy_initial_balance_v1', 'c3cb_conc_import',
        NULL, 'sistema', clock_timestamp(), 'legacy_flat_snapshot', '{"schema_version":3}'::jsonb, repeat('a', 64), '{}'::jsonb);
    INSERT INTO public.ordem_compra_fio_lancamentos(id, ordem_compra_fio_id, ordem_compra_item_id, kg_recebido,
      data_recebimento, criado_por, tipo, idempotency_key, origem_tipo, recebimento_id, ordem_compra_id,
      ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester, kg_excesso, ator_tipo, linha_indice)
      VALUES (770001, NULL, 77001, 40.000, CURRENT_DATE, NULL, 'import_saldo_inicial', 'c3cb_conc_import_line',
        'legacy_flat_snapshot', 770001, 77001, 77001, 77001, 'algodao', 77001, NULL, 0, NULL, 1);
    UPDATE public.ordem_compra_cutover SET status='canonical_active', read_authority='canonical',
      reconciliation_status='reconciled', final_acl_closed_at=clock_timestamp(),
      canonical_activated_at=clock_timestamp(), cutover_generation=770001 WHERE id=1;
    SET session_replication_role = origin;
  `);
}

async function teardown() {
  await queryLines(`
    SET session_replication_role = replica;
    UPDATE public.ordem_compra_cutover SET status='legacy_active', read_authority='flat',
      reconciliation_status='not_started', final_acl_closed_at=NULL, canonical_activated_at=NULL,
      productive_receipt_started_at=NULL, cutover_generation=NULL WHERE id=1;
    DELETE FROM public.ordem_compra_fio_movimentos_estoque WHERE ordem_compra_item_id=77001;
    DELETE FROM public.ordem_compra_fio_lancamentos WHERE ordem_compra_item_id=77001;
    DELETE FROM public.ordem_compra_recebimentos WHERE ordem_compra_id=77001;
    DELETE FROM public.ordem_compra_item_compat_fio WHERE ordem_compra_item_id=77001;
    DELETE FROM public.ordem_compra_item_alocacao WHERE item_id=77001;
    DELETE FROM public.ordem_compra_item WHERE id=77001;
    DELETE FROM public.ordem_compra WHERE id=77001;
    DELETE FROM public.necessidade_compra_fio WHERE id=77001;
    DELETE FROM public.ordens_compra_fio WHERE id=77001;
    DELETE FROM public.ops WHERE id=77001;
    DELETE FROM public.pedidos WHERE id='77999999-0000-0000-0000-000000000001';
    DELETE FROM public.saldo_fios WHERE cor_id=77001;
    DELETE FROM public.cores WHERE id=77001;
    DELETE FROM public.fornecedores WHERE id=77001;
    DELETE FROM public.usuarios WHERE id='${ADMIN}';
    DELETE FROM auth.users WHERE id='${ADMIN}';
    SET session_replication_role = origin;
  `);
}

async function main() {
  await setup();

  const deadlocksBefore = Number((await queryLines(
    `SELECT deadlocks FROM pg_catalog.pg_stat_database WHERE datname = current_database();`))[0]);

  const auth = (uid) => `SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub', '${uid}', TRUE);`;

  // Holder: lock the item row, hold it open.
  const holder = openSession('holder');
  holder.send(`${auth(ADMIN)} BEGIN; SELECT 'PID|' || pg_backend_pid();
    SELECT id FROM public.ordem_compra_item WHERE id = 77001 FOR UPDATE; SELECT 'HELD';`);
  const holderPid = Number((await holder.waitFor((l) => l.startsWith('PID|'))).split('|')[1]);
  await holder.waitFor((l) => l === 'HELD');

  // Subject: Component B increase to absolute 80 — blocks on the item lock.
  const subject = openSession('subject');
  subject.send(`${auth(ADMIN)} SELECT 'SUBJECT_PID|' || pg_backend_pid();
    SELECT 'RESULT|' || public.registrar_recebimento_ordem_compra_fio_compat(
      77001, 80.000, CURRENT_DATE, 'conc-subject', NULL, NULL)::TEXT;`);
  const subjectPid = Number((await subject.waitFor((l) => l.startsWith('SUBJECT_PID|'))).split('|')[1]);

  const evidence = await waitForBlock(subjectPid, holderPid);
  console.log(`LOCK_STAGE|item|subject=${subjectPid}|blocker=${holderPid}|blocking_pids=${evidence}`);

  // Holder itself moves 40 -> 55 via Component B, then commits and releases.
  holder.send(`SELECT 'HOLDER_RESULT|' || public.registrar_recebimento_ordem_compra_fio_compat(
      77001, 55.000, CURRENT_DATE, 'conc-holder', NULL, NULL)::TEXT;
    COMMIT; SELECT 'HOLDER_COMMITTED';`);
  const holderResult = await holder.waitFor((l) => l.startsWith('HOLDER_RESULT|'));
  assert.match(holderResult, /"ok"\s*:\s*true/);
  await holder.waitFor((l) => l === 'HOLDER_COMMITTED');

  // Subject unblocks, re-reads the committed 55, applies delta 25 -> final 80.
  const subjectResult = await subject.waitFor((l) => l.startsWith('RESULT|'));
  assert.match(subjectResult, /"ok"\s*:\s*true/);

  await holder.close();
  await subject.close();

  const finalCache = Number((await queryLines(
    `SELECT kg_recebido FROM public.ordem_compra_item WHERE id = 77001;`))[0]);
  // 80 proves fresh re-evaluation against the holder's committed 55.
  // A stale read of 40 would have double-applied to 95.
  assert.equal(finalCache, 80, `expected fresh re-evaluation to 80, got ${finalCache}`);

  const deadlocksAfter = Number((await queryLines(
    `SELECT deadlocks FROM pg_catalog.pg_stat_database WHERE datname = current_database();`))[0]);
  assert.equal(deadlocksAfter, deadlocksBefore, 'a deadlock occurred');

  await teardown();

  console.log('SERIALIZATION|item_for_update=true|stale_read=false|final_cache=80');
  console.log(`FINAL|deadlocks=${deadlocksAfter}`);
  console.log('C3C_B_CONCURRENCY_PASS');
}

main().catch(async (error) => {
  try { await teardown(); } catch { /* best effort */ }
  console.error(error);
  process.exitCode = 1;
});
