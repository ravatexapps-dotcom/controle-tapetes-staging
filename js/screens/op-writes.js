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
//
// NÃO depende de: window.toast, window.navigate, window.CURRENT_USER.
// NÃO faz select / rpc — apenas update, delete, insert.
//
// Compatibilidade: window.registrarRecebimentoOrdemFio e
// window.atribuirFornecedorFioOp seguem disponíveis para os
// call-sites do inline.
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
