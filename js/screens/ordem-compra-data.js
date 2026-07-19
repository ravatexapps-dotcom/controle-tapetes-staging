// =====================================================================
// === SCREENS: ORDEM DE COMPRA — DATA LOADER ==========================
// Phase: REFUND-B1 (spec §R.22). Data layer for the dedicated native
// purchase-order administration screens (list + detail). Mirrors the
// pedido-detail-data.js convention: reopens the shared
// window.RAVATEX_SCREENS.ordemCompra namespace and exposes async loaders
// that take (id?, state) and write onto state, returning null on success
// or a string error-code the caller branches on.
//
// All order reads go through the SECURITY DEFINER read-model RPCs
// (listar_ordens_compra_admin / obter_ordem_compra_admin, db/68) — the
// client never reconstructs administrative authority from table joins
// (§R.22.10/§R.22.11). Graceful degradation: on a database without db/68
// the RPC is missing (PostgREST PGRST202) and the loader returns
// 'indisponivel' so the screen renders a neutral notice instead of
// crashing (§R.22.0 — production carries db/01→64 only).
//
// Form reference reads (pedidos / fornecedores / cores) are simple
// table selects for the "nova ordem" / "adicionar item" pickers; they do
// not carry administrative authority.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  function isMissingFunction(error) {
    if (!error) return false;
    return error.code === 'PGRST202'
      || /function .* does not exist/i.test(error.message || '')
      || /could not find the function/i.test(error.message || '');
  }
  ns.isMissingFunction = isMissingFunction;

  ns.createInitialState = function () {
    return {
      ordens: [],
      ordem: null,
      eventos: [],
      pedidos: [],
      fornecedores: [],
      cores: [],
      indisponivel: false,
    };
  };

  // List view loader — listar_ordens_compra_admin(p_pedido_id=null).
  ns.loadOrdensList = async function (state) {
    state.ordens = [];
    state.indisponivel = false;
    var res = await window.supa.rpc('listar_ordens_compra_admin', { p_pedido_id: null });
    if (res.error) {
      if (isMissingFunction(res.error)) { state.indisponivel = true; return 'indisponivel'; }
      console.error('ordem-compra: erro ao listar', res.error);
      window.toast('Erro ao carregar ordens de compra.', 'error');
      return 'lista';
    }
    if (!res.data || res.data.ok !== true) {
      console.error('ordem-compra: listar recusou', res.data);
      window.toast((res.data && res.data.erro) || 'Sem permissao para ordens de compra.', 'error');
      return 'lista';
    }
    state.ordens = res.data.ordens || [];
    return null;
  };

  // Detail view loader — obter_ordem_compra_admin(p_ordem_id).
  ns.loadOrdemDetail = async function (ordemId, state) {
    state.ordem = null;
    state.eventos = [];
    state.indisponivel = false;
    var res = await window.supa.rpc('obter_ordem_compra_admin', { p_ordem_id: ordemId });
    if (res.error) {
      if (isMissingFunction(res.error)) { state.indisponivel = true; return 'indisponivel'; }
      console.error('ordem-compra: erro ao obter', res.error);
      window.toast('Erro ao carregar a ordem de compra.', 'error');
      return 'detalhe';
    }
    if (!res.data || res.data.ok !== true) {
      window.toast((res.data && res.data.erro) || 'Ordem de compra nao encontrada.', 'error');
      return 'nao_encontrada';
    }
    state.ordem = res.data.ordem || null;
    state.eventos = res.data.eventos || [];
    return null;
  };

  // Reference data for the create/edit forms. Best-effort: a failure here
  // does not block rendering the (read-only) order view — the pickers just
  // stay empty and the write actions surface their own errors.
  ns.loadFormRefs = async function (state) {
    var pedRes = await window.supa.from('pedidos').select('id, numero').order('numero', { ascending: false });
    state.pedidos = (pedRes && !pedRes.error && pedRes.data) ? pedRes.data : [];
    var fornRes = await window.supa.from('fornecedores').select('id, nome, tipo').order('nome', { ascending: true });
    state.fornecedores = (fornRes && !fornRes.error && fornRes.data) ? fornRes.data : [];
    var corRes = await window.supa.from('cores').select('id, nome').order('nome', { ascending: true });
    state.cores = (corRes && !corRes.error && corRes.data) ? corRes.data : [];
    return null;
  };
})(window);
