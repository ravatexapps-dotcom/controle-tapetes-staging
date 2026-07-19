// =====================================================================
// === ORDEM DE COMPRA — ENTITY ACTIONS =================================
// Purchase orders retain lifecycle consultation and cancellation only.
// F2 moved purchasing distribution to Pedido / Insumos; no order-first
// item or allocation writer remains reachable from this module.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  async function rpcWrite(name, params, successMsg) {
    var result = await window.supa.rpc(name, params);
    if (result.error || !result.data || result.data.ok !== true) {
      var data = result.data || {};
      window.toast(data.erro || 'Não foi possível concluir a ação.', 'error');
      return null;
    }
    window.toast(successMsg, 'success');
    return result.data;
  }

  ns.rpcWrite = rpcWrite;

  ns.createEvents = function (ctx) {
    var state = ctx.state || {};
    var reload = ctx.reload;
    var ordem = state.ordem || {};
    return {
      cancelar: function () {
        window.confirmDialog({
          title: 'Cancelar ordem de compra',
          message: 'Cancelar esta ordem? A distribuição não será alterada por esta ação.',
          confirmLabel: 'Cancelar ordem',
          onConfirm: async function () {
            var data = await rpcWrite('cancelar_ordem_compra', { p_ordem_id: ordem.ordem_id }, 'Ordem cancelada.');
            if (data) await reload();
          },
        });
      },
    };
  };
})(window);
