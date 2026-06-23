// =====================================================================
// === SCREENS: OP PERSISTIR PURE HELPERS (Seam A) ======================
// Helpers puros de montagem de payload para persistência de OP,
// extraídos do <script> inline de index.html, de dentro de
// screenNovaOP. Concentra:
//
//   - itensValidosOP(itens)
//   - montarPayloadItensOP(itensValidos, opId)
//   - montarPayloadFornecedoresOP(fornSel, opId)
//   - montarPayloadOP({ numero, ano, status })
//   - montarPayloadLote({ numero, clienteSel })
//
// Carregar via <script src="js/screens/op-persistir.js"></script>
// no <head>, DEPOIS de js/screens/op-recalculo.js e ANTES de jspdf +
// script inline principal.
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - Nenhuma — helpers puros, sem dependência de Supabase, DOM,
//     toast, navigate ou qualquer módulo externo.
//
// NÃO depende de: window.supa, window.toast, window.modal,
// window.confirmDialog, window.CURRENT_USER, window.navigate.
// NÃO faz insert / update / delete / rpc — apenas helpers puros.
//
// Compatibilidade: window.itensValidosOP, window.montarPayloadItensOP,
// window.montarPayloadFornecedoresOP, window.montarPayloadOP e
// window.montarPayloadLote seguem disponíveis para os call-sites
// do inline (prefixados com `window.`).
// =====================================================================

(function (window) {
  'use strict';

  function itensValidosOP(itens) {
    return (itens || []).filter((item) => item && item.modeloId && Number(item.metros) > 0);
  }

  function montarPayloadItensOP(itensValidos, opId) {
    return itensValidos.map((item) => ({
      op_id: opId,
      modelo_id: item.modeloId,
      metros_pedidos: Number(item.metros),
    }));
  }

  function montarPayloadFornecedoresOP(fornSel, opId) {
    if (!fornSel || !fornSel.cima) return [];
    return [{
      op_id: opId,
      fornecedor_id: fornSel.cima,
      etapa: 'cima',
    }];
  }

  function montarPayloadOP({ numero, ano, status }) {
    return {
      numero: Number(numero),
      ano: Number(ano),
      status,
    };
  }

  function montarPayloadLote({ numero, clienteSel }) {
    return {
      numero: Number(numero),
      cliente_id: Number(clienteSel),
    };
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opPersistir = {
    itensValidosOP,
    montarPayloadItensOP,
    montarPayloadFornecedoresOP,
    montarPayloadOP,
    montarPayloadLote,
  };

  window.itensValidosOP = itensValidosOP;
  window.montarPayloadItensOP = montarPayloadItensOP;
  window.montarPayloadFornecedoresOP = montarPayloadFornecedoresOP;
  window.montarPayloadOP = montarPayloadOP;
  window.montarPayloadLote = montarPayloadLote;
})(window);
