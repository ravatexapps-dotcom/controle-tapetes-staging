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
      container.replaceChildren(ns.renderDetail(state, handlers));
    }
    async function reload() {
      await ns.loadOrdemDetail(id, state);
      render();
    }

    handlers = ns.createEvents({ state: state, reload: reload });
    handlers.voltar = function () { window.navigate('#/ordens-compra'); };

    if (!Number.isFinite(id) || id <= 0) {
      window.toast('Ordem de compra inválida.', 'error');
      render();
      return window.shellLayout(window.ADMIN_MENU, container);
    }

    // Reference data for the add/edit-item forms (best-effort).
    await ns.loadFormRefs(state);
    await ns.loadOrdemDetail(id, state);
    render();

    return window.shellLayout(window.ADMIN_MENU, container);
  }

  ns.screenOrdemCompra = screenOrdemCompra;
  window.screenOrdemCompra = screenOrdemCompra;
})(window);
