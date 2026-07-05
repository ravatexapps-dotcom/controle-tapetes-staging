// =====================================================================
// === scripts/staging/expedicao-partial-flow-diag.mjs =================
// Diagnostico READ-ONLY do contrato de expedicao parcial de acabamento
// em Supabase STAGING (ucrjtfswnfdlxwtmxnoo).
//
// Fase: RAVATEX-TAPETES-ACABAMENTO-PARTIAL-EXPEDITION-CONTRACT-B
//
// - Recalcula saldo liberavel por SELECT nas tabelas de movimento.
// - Chama somente a RPC read-only consultar_saldo_expedicao_latex.
// - Bloqueia se a URL for producao (bhgifjrfagkzubpyqpew).
// - Exige URL de staging (ucrjtfswnfdlxwtmxnoo).
// - Nunca imprime anon key, password, JWT ou tokens.
//
// Uso:  node scripts/staging/expedicao-partial-flow-diag.mjs
// Config: .ravatex-local/admin-disable-user-e2e.config.json (gitignored)
// =====================================================================

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const CONFIG = resolve(ROOT, '.ravatex-local', 'admin-disable-user-e2e.config.json');

const PROD_REF = 'bhgifjrfagkzubpyqpew';
const STAGING_REF = 'ucrjtfswnfdlxwtmxnoo';
const EPS = 0.009;

function die(msg) { console.error('ABORT: ' + msg); process.exit(1); }
function round2(n) { return Math.round(Number(n || 0) * 100) / 100; }
function sameId(a, b) { return String(a) === String(b); }
function opLabel(op) { return op ? 'OP ' + op.numero + '/' + op.ano + ' (id ' + op.id + ')' : 'OP ?'; }
function fmt(n) { return round2(n).toFixed(2); }

const cfg = JSON.parse(readFileSync(CONFIG, 'utf8'));
const url = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
const anonKey = cfg.anonKey;

if (!url || !anonKey || !cfg.adminEmail || !cfg.adminPassword) die('config incompleto em .ravatex-local');
if (url.includes(PROD_REF)) die('URL aponta para PRODUCAO - bloqueado');
if (!url.includes(STAGING_REF)) die('URL nao e staging autorizado (' + STAGING_REF + ')');

console.log('Ambiente staging:', url.replace(/https:\/\/([a-z0-9]+)\..*/, 'https://$1.supabase.co'));

async function login() {
  const res = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cfg.adminEmail, password: cfg.adminPassword }),
  });
  if (!res.ok) die('login admin falhou: HTTP ' + res.status);
  const body = await res.json();
  if (!body.access_token) die('login sem access_token');
  return body.access_token;
}

let TOKEN;
async function sel(pathq) {
  const res = await fetch(url + '/rest/v1/' + pathq, {
    headers: { apikey: anonKey, Authorization: 'Bearer ' + TOKEN },
  });
  if (!res.ok) die('SELECT falhou (' + pathq + '): HTTP ' + res.status + ' ' + (await res.text()).slice(0, 240));
  return res.json();
}

async function rpcRead(name, payload) {
  const res = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) die('RPC read-only falhou (' + name + '): HTTP ' + res.status + ' ' + (await res.text()).slice(0, 240));
  return res.json();
}

async function sqlCatalogDiag() {
  const dbUrl = process.env.STAGING_DB_URL || process.env.DB_URL || process.env.DATABASE_URL || '';
  console.log('\n===== DB/31 CATALOGO SQL (opcional) =====');
  if (!dbUrl) {
    console.log('Checagem SQL pulada: STAGING_DB_URL/DB_URL/DATABASE_URL ausente.');
    return;
  }
  if (dbUrl.includes(PROD_REF)) die('DB_URL aponta para PRODUCAO - bloqueado');
  if (!dbUrl.includes(STAGING_REF)) die('DB_URL nao e staging autorizado');

  const { Client } = await import('pg');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const procs = await client.query(`
      SELECT proname, pg_get_function_identity_arguments(oid) AS args
        FROM pg_proc
       WHERE pronamespace = 'public'::regnamespace
         AND proname IN ('consultar_saldo_expedicao_latex', 'liberar_expedicao_latex_parcial')
       ORDER BY proname
    `);
    const idx = await client.query(`
      SELECT indexname
        FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname IN ('entrega_itens_op_item_idx', 'expedicao_itens_op_item_idx')
       ORDER BY indexname
    `);
    console.log('RPCs DB/31:', procs.rows.length ? procs.rows.map((row) => row.proname + '(' + row.args + ')').join(' | ') : 'AUSENTES');
    console.log('Indices DB/31:', idx.rows.length ? idx.rows.map((row) => row.indexname).join(', ') : 'AUSENTES');
  } finally {
    await client.end();
  }
}

function add(map, key, value) {
  if (key == null) return;
  map[String(key)] = round2((map[String(key)] || 0) + Number(value || 0));
}

(async () => {
  TOKEN = await login();

  const latexOps = await sel(
    'ops?tipo=eq.latex&select=id,numero,ano,tipo,status,lote_id,origem_op_id,destino_fornecedor_id,motivo_separacao,criado_em,op_itens(id,pedido_item_id,modelo_id,metros_pedidos,metros_ajustados)&order=id.asc'
  );
  const lotes = await sel('lotes?select=id,numero,pedido_id,cliente_id&order=id.asc');
  const pedidos19 = await sel('pedidos?numero=eq.19&select=id,numero,status,status_cliente_visual&order=criado_em.desc');
  const entregasLatex = await sel(
    'entregas?etapa=eq.latex&select=id,etapa,data,fornecedor_id,entrega_itens(id,op_id,op_item_id,metros_entregues,defeito)&order=id.asc'
  );
  const expedicoes = await sel('expedicoes?select=id,pedido_id,op_latex_id,lote_id,status,criado_em,atualizado_em&order=id.asc');
  const expedicaoItens = await sel('expedicao_itens?select=id,expedicao_id,op_item_id,pedido_item_id,modelo_id,metros_liberados,metros_entregues&order=id.asc');

  const lotesById = Object.fromEntries(lotes.map((lote) => [String(lote.id), lote]));
  const opsById = Object.fromEntries(latexOps.map((op) => [String(op.id), op]));
  const expedicoesById = Object.fromEntries(expedicoes.map((exp) => [String(exp.id), exp]));
  const expedicoesByOp = {};
  expedicoes.forEach((exp) => { expedicoesByOp[String(exp.op_latex_id)] = exp; });

  const acabadoByOpItem = {};
  entregasLatex.forEach((entrega) => {
    (entrega.entrega_itens || []).forEach((item) => {
      if (item.defeito || item.op_item_id == null) return;
      add(acabadoByOpItem, item.op_item_id, item.metros_entregues);
    });
  });

  const liberadoByOpItem = {};
  const entregueByOpItem = {};
  expedicaoItens.forEach((item) => {
    add(liberadoByOpItem, item.op_item_id, item.metros_liberados);
    add(entregueByOpItem, item.op_item_id, item.metros_entregues);
  });

  const itemRows = [];
  latexOps.forEach((op) => {
    (op.op_itens || []).forEach((item) => {
      const previsto = round2(item.metros_ajustados || item.metros_pedidos || 0);
      const acabado = round2(acabadoByOpItem[String(item.id)] || 0);
      const liberado = round2(liberadoByOpItem[String(item.id)] || 0);
      const entregue = round2(entregueByOpItem[String(item.id)] || 0);
      itemRows.push({
        op,
        op_item_id: item.id,
        pedido_item_id: item.pedido_item_id,
        modelo_id: item.modelo_id,
        previsto,
        acabado,
        liberado,
        entregue,
        saldo: round2(Math.max(acabado - liberado, 0)),
      });
    });
  });

  const rowsByOp = {};
  itemRows.forEach((row) => { (rowsByOp[String(row.op.id)] = rowsByOp[String(row.op.id)] || []).push(row); });

  const overReleaseRaw = itemRows.filter((row) => row.liberado > row.acabado + EPS);
  const legacyTotalReleaseRows = overReleaseRaw.filter((row) => {
    const terminal = row.op.status === 'concluida' || row.op.status === 'finalizada';
    return terminal && row.acabado <= EPS && row.liberado <= row.previsto + EPS;
  });
  const overRelease = overReleaseRaw.filter((row) => legacyTotalReleaseRows.indexOf(row) === -1);
  const overDelivery = expedicaoItens.filter((item) => Number(item.metros_entregues || 0) > Number(item.metros_liberados || 0) + EPS);

  const expStatusProblems = [];
  expedicoes.forEach((exp) => {
    const itens = expedicaoItens.filter((item) => sameId(item.expedicao_id, exp.id));
    const liberado = round2(itens.reduce((acc, item) => acc + Number(item.metros_liberados || 0), 0));
    const entregue = round2(itens.reduce((acc, item) => acc + Number(item.metros_entregues || 0), 0));
    const expected = liberado > 0 && entregue >= liberado - EPS
      ? 'concluida'
      : (entregue > 0 ? 'parcial' : 'aguardando_expedicao');
    if (exp.status !== expected) expStatusProblems.push({ exp, liberado, entregue, expected });
  });

  const expInvalidOp = expedicoes.filter((exp) => !opsById[String(exp.op_latex_id)]);
  const defaultGroups = {};
  latexOps
    .filter((op) => op.motivo_separacao == null)
    .forEach((op) => {
      const key = String(op.origem_op_id || '') + '::' + String(op.destino_fornecedor_id || '');
      (defaultGroups[key] = defaultGroups[key] || []).push(op);
    });
  const defaultDupGroups = Object.entries(defaultGroups).filter(([, ops]) => ops.length > 1);

  const partialCandidates = latexOps
    .filter((op) => op.status === 'em_producao')
    .map((op) => {
      const rows = rowsByOp[String(op.id)] || [];
      return {
        op,
        acabado: round2(rows.reduce((acc, row) => acc + row.acabado, 0)),
        liberado: round2(rows.reduce((acc, row) => acc + row.liberado, 0)),
        saldo: round2(rows.reduce((acc, row) => acc + row.saldo, 0)),
      };
    })
    .filter((row) => row.saldo > EPS);

  console.log('\n===== RESUMO =====');
  console.log('OPs latex:', latexOps.length, '| entregas latex:', entregasLatex.length, '| expedicoes:', expedicoes.length, '| expedicao_itens:', expedicaoItens.length);
  console.log('OPs em_producao com saldo acabado liberavel:', partialCandidates.length);
  partialCandidates.slice(0, 8).forEach((row) => {
    console.log('  - ' + opLabel(row.op) + ' status=' + row.op.status
      + ' acabado=' + fmt(row.acabado) + ' liberado=' + fmt(row.liberado) + ' disponivel=' + fmt(row.saldo));
  });
  if (!partialCandidates.length) {
    console.log('  (sem candidato atual em staging; invariantes de excesso ainda foram recalculadas)');
  }

  console.log('\n===== INVARIANTES DE QUANTIDADE =====');
  console.log('Liberacao parcial > acabado:', overRelease.length ? 'FAIL ' + overRelease.length : 'OK 0');
  overRelease.slice(0, 12).forEach((row) => {
    console.log('  - ' + opLabel(row.op) + ' item ' + row.op_item_id
      + ' acabado=' + fmt(row.acabado) + ' liberado=' + fmt(row.liberado));
  });
  console.log('Liberacao legada total sem movimento latex:', legacyTotalReleaseRows.length ? legacyTotalReleaseRows.length + ' item(ns) reportado(s)' : '0');
  legacyTotalReleaseRows.slice(0, 12).forEach((row) => {
    console.log('  - ' + opLabel(row.op) + ' item ' + row.op_item_id
      + ' previsto=' + fmt(row.previsto) + ' acabado=' + fmt(row.acabado)
      + ' liberado=' + fmt(row.liberado) + ' (db/23 terminal legado)');
  });
  console.log('Entrega/coleta > liberado:', overDelivery.length ? 'FAIL ' + overDelivery.length : 'OK 0');
  overDelivery.slice(0, 12).forEach((item) => {
    const exp = expedicoesById[String(item.expedicao_id)];
    console.log('  - expedicao #' + item.expedicao_id + ' ' + (exp ? opLabel(opsById[String(exp.op_latex_id)]) : '')
      + ' item ' + item.id + ' liberado=' + fmt(item.metros_liberados) + ' entregue=' + fmt(item.metros_entregues));
  });
  console.log('Status expedicao coerente:', expStatusProblems.length ? 'FAIL ' + expStatusProblems.length : 'OK 0 divergencias');
  expStatusProblems.slice(0, 12).forEach((row) => {
    console.log('  - expedicao #' + row.exp.id + ' status=' + row.exp.status
      + ' esperado=' + row.expected + ' liberado=' + fmt(row.liberado) + ' entregue=' + fmt(row.entregue));
  });

  console.log('\n===== CONTRATO ESTRUTURAL =====');
  console.log('Expedicoes apontam para OP latex existente:', expInvalidOp.length ? 'FAIL ' + expInvalidOp.length : 'OK');
  expInvalidOp.forEach((exp) => console.log('  - expedicao #' + exp.id + ' op_latex_id=' + exp.op_latex_id));
  if (defaultDupGroups.length) {
    console.log('Duplicatas default de OP latex por origem+destino: FAIL ' + defaultDupGroups.length);
    defaultDupGroups.forEach(([key, ops]) => console.log('  - ' + key + ': ' + ops.map(opLabel).join(', ')));
  } else {
    console.log('Duplicatas default de OP latex por origem+destino: OK 0');
  }
  console.log('Sem OP criada por liberacao parcial: validado por inexistencia de nova OP default duplicada e por expedicoes vinculadas a OP latex existente.');

  const rpcTarget = partialCandidates[0]?.op || latexOps.find((op) => (rowsByOp[String(op.id)] || []).some((row) => row.acabado > 0)) || latexOps[0];
  if (rpcTarget) {
    console.log('\n===== RPC READ-ONLY consultar_saldo_expedicao_latex =====');
    const rpc = await rpcRead('consultar_saldo_expedicao_latex', { p_op_latex_id: rpcTarget.id });
    if (!rpc || rpc.ok !== true) die('consultar_saldo_expedicao_latex retornou erro: ' + JSON.stringify(rpc));
    console.log(opLabel(rpcTarget) + ' status=' + rpc.op_status
      + ' previsto=' + fmt(rpc.previsto_total)
      + ' acabado=' + fmt(rpc.acabado_total)
      + ' liberado=' + fmt(rpc.liberado_total)
      + ' disponivel=' + fmt(rpc.saldo_disponivel_total)
      + ' itens=' + ((rpc.itens || []).length));
  }

  console.log('\n===== PEDIDO ANALISADO =====');
  let selectedPedido = pedidos19[0] || null;
  if (!selectedPedido) {
    const fromCandidate = partialCandidates[0]?.op;
    const candidateLote = fromCandidate ? lotesById[String(fromCandidate.lote_id)] : null;
    if (candidateLote?.pedido_id) {
      const rows = await sel('pedidos?id=eq.' + encodeURIComponent(candidateLote.pedido_id) + '&select=id,numero,status,status_cliente_visual');
      selectedPedido = rows[0] || null;
    }
  }
  if (!selectedPedido) {
    const firstLoteWithLatex = latexOps.map((op) => lotesById[String(op.lote_id)]).find((lote) => lote?.pedido_id);
    if (firstLoteWithLatex?.pedido_id) {
      const rows = await sel('pedidos?id=eq.' + encodeURIComponent(firstLoteWithLatex.pedido_id) + '&select=id,numero,status,status_cliente_visual');
      selectedPedido = rows[0] || null;
    }
  }

  if (selectedPedido) {
    const pedidoLotes = lotes.filter((lote) => sameId(lote.pedido_id, selectedPedido.id));
    const loteIds = new Set(pedidoLotes.map((lote) => String(lote.id)));
    const pedidoLatexOps = latexOps.filter((op) => loteIds.has(String(op.lote_id)));
    console.log('Pedido #' + selectedPedido.numero + ' id=' + selectedPedido.id
      + ' status=' + selectedPedido.status + ' cliente_visual=' + selectedPedido.status_cliente_visual
      + ' | lotes=' + pedidoLotes.map((lote) => lote.id).join(','));
    pedidoLatexOps.forEach((op) => {
      const rows = rowsByOp[String(op.id)] || [];
      const exp = expedicoesByOp[String(op.id)];
      console.log('  - ' + opLabel(op) + ' status=' + op.status
        + ' acabado=' + fmt(rows.reduce((acc, row) => acc + row.acabado, 0))
        + ' liberado=' + fmt(rows.reduce((acc, row) => acc + row.liberado, 0))
        + ' disponivel=' + fmt(rows.reduce((acc, row) => acc + row.saldo, 0))
        + ' expedicao=' + (exp ? '#' + exp.id + ':' + exp.status : 'nenhuma'));
    });
    if (!pedidoLatexOps.length) console.log('  (pedido sem OP latex vinculada por lote)');
  } else {
    console.log('Nenhum pedido com OP latex encontrado para snapshot.');
  }

  await sqlCatalogDiag();

  console.log('\n===== VEREDICTO =====');
  const hardFails = overRelease.length + overDelivery.length + expStatusProblems.length + expInvalidOp.length + defaultDupGroups.length;
  if (hardFails > 0) {
    console.log('FAIL - corrigir invariantes antes de liberar a fase.');
    process.exit(2);
  }
  console.log('OK - saldos parciais, status de expedicao e limites entrega/liberado coerentes em staging.');
})().catch((e) => die(e && e.message ? e.message : String(e)));
