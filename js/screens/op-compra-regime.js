// =====================================================================
// === SCREENS: OP COMPRA REGIME + NATIVE NEED RPC WRAPPERS ============
// Client wrappers for the PRE-PROD-A (spec §R.23) server RPCs that own
// the per-Pedido yarn-purchasing regime and native need assessment:
//
//   - resolverRegimeCompraFio(pedidoId)       -> resolver_regime_compra_fio_pedido
//   - avaliarNecessidadesCompraFio(pedidoId)  -> avaliar_necessidades_compra_fio
//   - sincronizarNecessidadesCompraFio(pedidoId) -> sincronizar_necessidades_compra_fio
//
// These are the ONLY client entry points to the regime/need writers. The
// server decides the regime (legacy | native); the client never decides
// locally. Every wrapper returns the RPC's JSON envelope
// ({ ok, codigo, ... }) or a synthesized { ok:false, error } on transport
// failure — callers must branch on `ok` and never silently fall back.
//
// Load via <script src="js/screens/op-compra-regime.js"></script> in the
// <head>, BEFORE js/screens/op-persistir.js (persistirOP consults it) and
// before the ordem-compra distribution child module.
//
// Depends at call time on window.supa (js/supabase-client.js). No DOM, no
// toast/navigate — pure data access, per CODE_HEALTH_RULES §9 (writes and
// RPC calls live in explicit modules, never in render).
// =====================================================================

(function (window) {
  'use strict';

  function supa() {
    return window.supa;
  }

  // Normalizes a Supabase rpc() result into the RPC's JSON envelope.
  // On transport error returns { ok:false, codigo:'transporte', error }.
  function envelope(res, fallbackMsg) {
    if (res.error) {
      return { ok: false, codigo: 'transporte', erro: fallbackMsg, error: res.error };
    }
    if (!res.data || typeof res.data !== 'object') {
      return { ok: false, codigo: 'resposta_vazia', erro: fallbackMsg };
    }
    return res.data;
  }

  // Server-authoritative get-or-create of the Pedido purchasing regime.
  // Returns { ok, modelo:'legacy'|'native', criado, ... }.
  async function resolverRegimeCompraFio(pedidoId) {
    const res = await supa().rpc('resolver_regime_compra_fio_pedido', { p_pedido_id: pedidoId });
    return envelope(res, 'Falha ao resolver regime de compra do Pedido');
  }

  // Read-only preview of the native need synchronization plan. Native only.
  async function avaliarNecessidadesCompraFio(pedidoId) {
    const res = await supa().rpc('avaliar_necessidades_compra_fio', { p_pedido_id: pedidoId });
    return envelope(res, 'Falha ao avaliar necessidades nativas');
  }

  // Canonical native-need writer (all-or-nothing, idempotent). Native only.
  async function sincronizarNecessidadesCompraFio(pedidoId) {
    const res = await supa().rpc('sincronizar_necessidades_compra_fio', { p_pedido_id: pedidoId });
    return envelope(res, 'Falha ao sincronizar necessidades nativas');
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opCompraRegime = {
    resolverRegimeCompraFio,
    avaliarNecessidadesCompraFio,
    sincronizarNecessidadesCompraFio,
  };

  window.resolverRegimeCompraFio = resolverRegimeCompraFio;
  window.avaliarNecessidadesCompraFio = avaliarNecessidadesCompraFio;
  window.sincronizarNecessidadesCompraFio = sincronizarNecessidadesCompraFio;
})(window);
