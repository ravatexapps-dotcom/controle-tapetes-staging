// =====================================================================
// === SCREENS: ORDEM DE COMPRA — RECEIPT CUTOVER ADAPTER (PHASE-C3C-B) ==
// Phase: PHASE-C3C-B (docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md
// §32). Pure adapter: no DOM access, no rendering, no route logic, no direct
// fallback query/mutation ownership. The single place in the codebase that
// knows the two db/76 RPC names, their parameter contracts, success shapes,
// inactive signals, the bounded missing-function condition, and the
// fail-closed error set.
//
// Each call-site (op-writes.js, fornecedor.js, pedido-detail-data.js,
// op-nova.js) keeps owning its own existing legacy query/mutation as the
// fallback body; this module only classifies the canonical RPC response and
// returns an explicit { outcome } the caller branches on:
//   - 'canonical_success' — canonical RPC succeeded; use `rows`/`result`.
//   - 'legacy_fallback'   — canonical surface is inactive, or (bounded,
//                           §32.4) the RPC does not exist yet in this
//                           environment; the caller must run its exact
//                           existing legacy path.
//   - 'hard_failure'      — every other error; the caller must surface it,
//                           never silently fall back.
//
// Idempotency: createReceiptAttempt() mints one token per user-initiated
// submission. The caller retains the returned attempt object across retries
// of THAT SAME attempt (network timeout, connection drop, ambiguous
// response) and reuses attempt.token verbatim; a genuinely new submission
// calls createReceiptAttempt() again. This module holds no attempt state of
// its own and never persists a token across distinct user submissions.
//
// Dependência resolvida em tempo de chamada: window.supa (js/supabase-client.js).
// =====================================================================

(function (window) {
  'use strict';

  function newIdempotencyToken() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'c3cb-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  // One explicit, caller-owned object per user-initiated submission attempt.
  // Retain and reuse across retries of the same attempt; call this again
  // (discarding the previous attempt object) for a genuinely new submission.
  function createReceiptAttempt() {
    return { token: newIdempotencyToken() };
  }

  function isCanonicalReaderInactive(error) {
    return !!error && error.code === '55000'
      && /listar_compat_inativo/i.test(error.message || '');
  }

  function isCanonicalWriterInactiveResult(result) {
    return !!result && result.ok === false && result.codigo === 'recebimento_compat_inativo';
  }

  // Bounded per PHASE_CONTRACT.md §32.4: signals only "db/76 is not yet
  // installed in this environment," never a permanent/unconditional
  // fallback trigger.
  function isMissingCompatFunction(error) {
    return !!error && (
      error.code === '42883'
      || /function .* does not exist/i.test(error.message || '')
    );
  }

  // Defensive detection for the db/75 protected-mutation-guard error a
  // future real fence activation could raise against the still-live legacy
  // write paths (op-persistir.js source rows, op-recalculo.js saldo writes).
  // Not reachable while legacy_active; exists so those call-sites fail
  // cleanly instead of crashing on an unhandled Postgres error.
  function isLegacyReceiptFenced(error) {
    return !!error && error.code === '55000'
      && /legacy_receipt_fenced/i.test(error.message || '');
  }

  // Maps one Component A row (public.listar_ordens_compra_fio_compat) into
  // the legacy ordens_compra_fio row shape the unmodified downstream
  // consumers expect. Exercised only under a mocked canonical-success
  // response in tests (phase contract §12/§32.6) — unreachable in
  // production while legacy_active, the only state throughout this phase.
  // Component A does not project aceite_exigido_na_emissao /
  // legado_recebimento_automatico (op-nova.js's extended dimension select);
  // both are set to null here — a documented, non-blocking limitation of
  // this otherwise-unreachable mapping.
  function mapCanonicalRowToLegacyShape(row) {
    return {
      id: row.ordens_compra_fio_id,
      op_id: row.op_id,
      ops: (row.op_numero != null && row.op_ano != null)
        ? { numero: row.op_numero, ano: row.op_ano }
        : null,
      tipo: row.tipo,
      material: row.material,
      cor_id: row.cor_id,
      cor_poliester: row.cor_poliester,
      kg_pedido: row.kg_pedido,
      kg_recebido: row.kg_recebido,
      status: row.status,
      status_administrativo: row.status_administrativo,
      status_aceite: row.status_aceite,
      status_recebimento: row.status_recebimento,
      data_recebimento: row.data_recebimento,
      fornecedor_id: row.fornecedor_id,
      aceite_exigido_na_emissao: null,
      legado_recebimento_automatico: null,
      cores: row.cor_id ? { id: row.cor_id, nome: row.cor_nome } : null,
    };
  }

  // attemptCanonicalRead({ pedidoId, opId }) — item grain when opId is
  // omitted (pedido-detail-data.js's p_pedido_id scoping), item x OP grain
  // when opId is supplied (op-nova.js's fetchOrdensCompraFio(opId)).
  async function attemptCanonicalRead({ pedidoId, opId } = {}) {
    const res = await window.supa.rpc('listar_ordens_compra_fio_compat', {
      p_pedido_id: pedidoId || null,
      p_op_id: opId || null,
    });
    if (!res.error) {
      return {
        outcome: 'canonical_success',
        rows: (res.data || []).map(mapCanonicalRowToLegacyShape),
      };
    }
    if (isCanonicalReaderInactive(res.error) || isMissingCompatFunction(res.error)) {
      return { outcome: 'legacy_fallback', error: res.error };
    }
    return { outcome: 'hard_failure', error: res.error };
  }

  // attemptCanonicalReceipt(params, attempt) — params: { ordensCompraFioId,
  // kgTotalAbsoluto, dataRecebimento, documentoRef, origemRef }. `attempt`
  // is the object returned by createReceiptAttempt(); its token is sent
  // verbatim as p_idempotency_key, including on any retry of this same
  // attempt.
  async function attemptCanonicalReceipt(params, attempt) {
    const res = await window.supa.rpc('registrar_recebimento_ordem_compra_fio_compat', {
      p_ordens_compra_fio_id: params.ordensCompraFioId,
      p_kg_total_absoluto: params.kgTotalAbsoluto,
      p_data_recebimento: params.dataRecebimento,
      p_idempotency_key: attempt && attempt.token,
      p_documento_ref: params.documentoRef || null,
      p_origem_ref: params.origemRef || null,
    });
    if (res.error) {
      if (isMissingCompatFunction(res.error)) {
        return { outcome: 'legacy_fallback', error: res.error };
      }
      return { outcome: 'hard_failure', error: res.error };
    }
    const result = res.data;
    if (isCanonicalWriterInactiveResult(result)) {
      return { outcome: 'legacy_fallback', result };
    }
    if (result && result.ok === true) {
      return { outcome: 'canonical_success', result };
    }
    // Every other { ok:false, codigo:... } — sem_permissao, estado_invalido,
    // mapeamento_compat_ausente, decremento_exige_admin,
    // reducao_abaixo_saldo_importado, excede_estornavel,
    // kg_absoluto_invalido, idempotencia_conflitante, erro_interno, or any
    // unrecognized code — fails closed. Never classified as inactive.
    return { outcome: 'hard_failure', result };
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.ordemCompraReceiptCutover = {
    newIdempotencyToken,
    createReceiptAttempt,
    isCanonicalReaderInactive,
    isCanonicalWriterInactiveResult,
    isMissingCompatFunction,
    isLegacyReceiptFenced,
    mapCanonicalRowToLegacyShape,
    attemptCanonicalRead,
    attemptCanonicalReceipt,
  };
})(window);
