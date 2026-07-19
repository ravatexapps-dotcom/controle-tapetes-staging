// =====================================================================
// === SCREENS: ORDENS DE COMPRA — LIST (#/ordens-compra) ==============
// Phase: REFUND-B1 (spec §R.22.11). Dedicated list screen for native
// purchase-order administration. Orchestration only — data via
// ordem-compra-data.js, rendering via ordem-compra-render.js, writes via
// ordem-compra-events.js. The full entity lives here and on the detail
// screen, never inside op-nova.js or a transition modal (§R.16/§R.22.11).
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  async function screenOrdensCompra() {
    var container = window.el('div', {});
    var state = ns.createInitialState();
    var handlers;

    function render() {
      container.replaceChildren(ns.renderList(state, handlers));
    }
    async function reload() {
      await ns.loadOrdensList(state);
      render();
    }

    handlers = ns.createEvents({ state: state, reload: reload });
    handlers.verOrdem = function (id) { window.navigate('#/ordens-compra/' + id); };
    handlers.voltar = function () { window.navigate('#/ordens-compra'); };

    // Reference data for the "Nova ordem" form (best-effort).
    await ns.loadFormRefs(state);
    await ns.loadOrdensList(state);
    render();

    return window.shellLayout(window.ADMIN_MENU, container);
  }

  ns.screenOrdensCompra = screenOrdensCompra;
  window.screenOrdensCompra = screenOrdensCompra;
})(window);
