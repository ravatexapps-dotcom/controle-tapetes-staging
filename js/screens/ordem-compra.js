// =====================================================================
// === SCREENS: ORDEM DE COMPRA — DETAIL (#/ordens-compra/:id) =========
// Phase: REFUND-B1 (spec §R.22.11). Dedicated purchase-order entity
// screen. Numeric id (ordem_compra.id is BIGSERIAL). Orchestration only —
// data via ordem-compra-data.js, rendering via ordem-compra-render.js,
// writes via ordem-compra-events.js. Emit/cancel/item actions live HERE
// (server-derived from the read model), never in op-nova.js. Emission is
// installed-but-inactive (§R.22.5/§R.22.6) — the Emitir control is always
// disabled and never wired.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  async function screenOrdemCompra(ordemId) {
    var id = Number(ordemId);
    var container = window.el('div', {});
    var state = ns.createInitialState();
    var handlers;

    function render() {
      // Additive PHASE-C4 integration: the base detail is unchanged; the
      // persistent Recebimentos section (native, post-draft orders only) is
      // appended as a sibling. renderReceiptSection returns null when no
      // section must exist, so nothing changes for legacy/draft orders.
      var nodes = [ns.renderDetail(state, handlers)];
      if (typeof ns.renderReceiptSection === 'function') {
        var receiptSection = ns.renderReceiptSection(state, handlers);
        if (receiptSection) nodes.push(receiptSection);
      }
      container.replaceChildren.apply(container, nodes);
    }
    async function reload() {
      await ns.loadOrdemDetail(id, state);
      await ns.loadDistribuicao(id, state);
      if (typeof ns.loadReceiptHistory === 'function') await ns.loadReceiptHistory(id, state);
      render();
    }

    handlers = ns.createEvents({ state: state, reload: reload });
    handlers.voltar = function () { window.navigate('#/ordens-compra'); };
    handlers.verPedido = function (pedidoId) { window.navigate('#/pedidos/' + pedidoId); };
    // Merge the PHASE-C4 receipt/reversal handlers alongside the unchanged
    // entity handlers (cancelar). The existing cancelar handler is untouched.
    if (typeof ns.createReceiptEvents === 'function') {
      var receiptHandlers = ns.createReceiptEvents({ state: state, reload: reload, ordemId: id });
      for (var k in receiptHandlers) {
        if (Object.prototype.hasOwnProperty.call(receiptHandlers, k)) handlers[k] = receiptHandlers[k];
      }
    }

    if (!Number.isFinite(id) || id <= 0) {
      window.toast('Ordem de compra inválida.', 'error');
      render();
      return window.shellLayout(window.ADMIN_MENU, container);
    }

    // Reference data for the add/edit-item forms (best-effort).
    await ns.loadFormRefs(state);
    await ns.loadOrdemDetail(id, state);
    await ns.loadDistribuicao(id, state);
    if (typeof ns.loadReceiptHistory === 'function') await ns.loadReceiptHistory(id, state);
    render();

    return window.shellLayout(window.ADMIN_MENU, container);
  }

  ns.screenOrdemCompra = screenOrdemCompra;
  window.screenOrdemCompra = screenOrdemCompra;
})(window);
