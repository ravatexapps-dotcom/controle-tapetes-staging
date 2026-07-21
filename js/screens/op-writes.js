// =====================================================================
// === SCREENS: OP WRITES (Seam A) ======================================
// Helpers de write de OP extraídos do <script> inline de index.html,
// de dentro de screenNovaOP. Concentra:
//
//   - registrarRecebimentoOrdemFio(...)
//   - atribuirFornecedorFioOp(...)
//
// Carregar via <script src="js/screens/op-writes.js"></script> no
// <head>, DEPOIS de js/screens/op-form-helpers.js e ANTES de jspdf +
// script inline principal. As telas inline (screenNovaOP)
// referenciam os helpers acima com prefixo `window.` (call-sites
// explícitos).
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - window.supa (js/supabase-client.js) — client Supabase + write-guard
//   - window.RAVATEX_SCREENS.ordemCompraReceiptCutover
//     (js/screens/ordem-compra-receipt-cutover.js) — PHASE-C3C-B legacy-compat
//     receipt adapter; registrarRecebimentoOrdemFio attempts it first and
//     falls back to the exact pre-phase flat UPDATE (§32 of
//     docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md)
//
// NÃO depende de: window.toast, window.navigate, window.CURRENT_USER.
// NÃO faz select ou rpc diretamente — apenas update, delete, insert, e a
// delegação ao adapter acima (que por sua vez isola o único rpc do arquivo).
//
// Compatibilidade: window.registrarRecebimentoOrdemFio e
// window.atribuirFornecedorFioOp seguem disponíveis para os
// call-sites do inline.
// =====================================================================

(function (window) {
  'use strict';

  // PHASE-C3C-B (docs/architecture/ORDEM_COMPRA_C3C_B_PHASE_CONTRACT.md §32,
  // corrected §34): attempts the canonical legacy-compat receipt adapter
  // first; falls back to the exact pre-phase flat UPDATE, byte-identical,
  // only on the documented inactive signal or the bounded missing-function
  // condition. Never issues both writes for one successful attempt. The
  // adapter is resolved at call time (not module load), matching this
  // file's existing window.supa convention.
  //
  // `attempt` (optional): a receipt-attempt object from the adapter's
  // createReceiptAttempt()/createAttemptTracker().resolveAttempt(). Every
  // real authorized receipt UI call-site owns and passes its own attempt so
  // a retry of unchanged intent reuses the same idempotency token (§34); if
  // omitted, a fresh attempt is created internally for backward
  // compatibility with any caller not yet supplying one.
  //
  // Return shape adds `ambiguous` (boolean) alongside the existing
  // `{ data, error }` contract every caller already checks: `ambiguous:
  // true` means the RPC call itself failed with unknown server commit
  // status (network/timeout) — the caller must retain its attempt for a
  // retry of unchanged intent, never treat it as done. `ambiguous: false`
  // means the outcome was deterministic (success, legacy fallback, or a
  // recognized/unrecognized server rejection) — the caller should close its
  // attempt lifecycle.
  async function registrarRecebimentoOrdemFio({
    ordemId,
    kgRecebido,
    dataRecebimento,
    status,
    attempt,
  }) {
    var cutover = window.RAVATEX_SCREENS && window.RAVATEX_SCREENS.ordemCompraReceiptCutover;
    if (cutover) {
      var useAttempt = attempt || cutover.createReceiptAttempt();
      var canonical = await cutover.attemptCanonicalReceipt({
        ordensCompraFioId: ordemId,
        kgTotalAbsoluto: kgRecebido,
        dataRecebimento: dataRecebimento,
      }, useAttempt);
      if (canonical.outcome === 'canonical_success') {
        return { data: canonical.result, error: null, ambiguous: false };
      }
      if (canonical.outcome === 'ambiguous_failure') {
        return { data: null, error: canonical.error, ambiguous: true };
      }
      if (canonical.outcome === 'hard_failure') {
        return {
          data: null,
          error: canonical.error || Object.assign(
            new Error((canonical.result && (canonical.result.erro || canonical.result.codigo)) || 'Falha ao registrar recebimento'),
            { codigo: canonical.result && canonical.result.codigo }
          ),
          ambiguous: false,
        };
      }
      // outcome === 'legacy_fallback' — fall through to the exact existing
      // flat write below.
    }
    var flat = await window.supa
      .from('ordens_compra_fio')
      .update({
        kg_recebido: kgRecebido,
        data_recebimento: dataRecebimento,
        status,
      })
      .eq('id', ordemId);
    return Object.assign({}, flat, { ambiguous: false });
  }

  // -------------------------------------------------------------------
  // atribuirFornecedorFioOp — assign a fornecedor to a fio type for an OP.
  // Replaces the old op_fornecedores record for the etapa with the new
  // fornecedorId, and also updates all ordens_compra_fio of the given
  // tipo to point to the same fornecedor. Returns { error, step }.
  async function atribuirFornecedorFioOp({
    opId,
    etapa,
    tipo,
    fornecedorId,
  }) {
    if (!opId || !etapa || !tipo || !fornecedorId) {
      return {
        error: new Error('opId, etapa, tipo and fornecedorId are required'),
        step: 0,
      };
    }

    let result = await window.supa
      .from('ordens_compra_fio')
      .update({ fornecedor_id: fornecedorId })
      .eq('op_id', opId)
      .eq('tipo', tipo);

    if (result.error) return { error: result.error, step: 1 };

    result = await window.supa
      .from('op_fornecedores')
      .delete()
      .eq('op_id', opId)
      .eq('etapa', etapa);

    if (result.error) return { error: result.error, step: 2 };

    result = await window.supa
      .from('op_fornecedores')
      .insert([{ op_id: opId, fornecedor_id: fornecedorId, etapa }]);

    if (result.error) return { error: result.error, step: 3 };

    return { error: null, step: 0 };
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opWrites = {
    ...window.RAVATEX_SCREENS.opWrites,
    registrarRecebimentoOrdemFio,
    atribuirFornecedorFioOp,
  };

  window.registrarRecebimentoOrdemFio = registrarRecebimentoOrdemFio;
  window.atribuirFornecedorFioOp = atribuirFornecedorFioOp;
})(window);
