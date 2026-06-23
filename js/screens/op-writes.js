// =====================================================================
// === SCREENS: OP WRITES (Seam A) ======================================
// Helpers de write de OP extraídos do <script> inline de index.html,
// de dentro de screenNovaOP. Concentra:
//
//   - registrarRecebimentoOrdemFio(...)
//
// Carregar via <script src="js/screens/op-writes.js"></script> no
// <head>, DEPOIS de js/screens/op-form-helpers.js e ANTES de jspdf +
// script inline principal. As telas inline (screenNovaOP)
// referenciam o helper acima com prefixo `window.` (call-site
// explícito).
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - window.supa (js/supabase-client.js) — client Supabase + write-guard
//
// NÃO depende de: window.toast, window.navigate, window.CURRENT_USER.
// NÃO faz select / rpc — apenas update.
//
// Compatibilidade: window.registrarRecebimentoOrdemFio segue
// disponível para o call-site do inline em buildOrdemPendenteRow.
// =====================================================================

(function (window) {
  'use strict';

  async function registrarRecebimentoOrdemFio({
    ordemId,
    kgRecebido,
    dataRecebimento,
    status,
  }) {
    return await window.supa
      .from('ordens_compra_fio')
      .update({
        kg_recebido: kgRecebido,
        data_recebimento: dataRecebimento,
        status,
      })
      .eq('id', ordemId);
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opWrites = {
    registrarRecebimentoOrdemFio,
  };

  window.registrarRecebimentoOrdemFio = registrarRecebimentoOrdemFio;
})(window);
