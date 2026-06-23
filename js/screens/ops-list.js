// =====================================================================
// === SCREENS: OPS LIST (Seam A) =======================================
// Tela de listagem de Ordens de Produção (`screenListaOPs`). Extraída
// do <script> inline de index.html sem alterar comportamento, tabela
// Supabase, leitura, navegação ou layout.
//
// Carregar via <script src="js/screens/ops-list.js"></script> no
// <head>, DEPOIS de js/screens/cadastros.js e ANTES do script inline
// principal (o setRoutes do inline referencia a global legada
// `window.screenListaOPs`).
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - window.el / window.toast / window.pageHeader / window.dataTable
//     (js/ui.js)
//   - window.shellLayout / window.ADMIN_MENU
//     (js/screens/common.js)
//   - window.badgeStatus / window.badgeTipo
//     (js/badges.js)
//   - window.percentualEntregueOP
//     (js/calculo-op.js — função top-level exposta como global no
//      browser porque o módulo é carregado via <script> clássico)
//   - window.navigate
//     (js/router.js — resolvido em tempo de clique)
//   - window.supa
//     (js/supabase-client.js)
//
// A tela é read-only: NÃO faz insert/update/delete/rpc. Apenas
// `select` em `ops` (com joins em lote/cliente/op_itens) e em
// `entrega_itens` para a barra de progresso.
//
// Compatibilidade: window.screenListaOPs e
// window.RAVATEX_SCREENS.opsList.screenListaOPs ficam disponíveis
// para o setRoutes no inline.
// =====================================================================

(function (window) {
  'use strict';

  async function screenListaOPs() {
    const container = window.el('div', {});

    async function reload() {
      const { data, error } = await window.supa.from('ops')
        .select('id, numero, ano, status, tipo, criado_em, lote:lote_id(numero, cliente:cliente_id(nome)), op_itens(id, metros_pedidos, metros_ajustados)')
        .order('ano', { ascending: false })
        .order('numero', { ascending: false });
      if (error) { window.toast('Erro ao carregar OPs', 'error'); console.error(error); return; }
      const eiRes = await window.supa.from('entrega_itens').select('op_id, metros_entregues, defeito');
      if (eiRes.error) { window.toast('Erro ao carregar progresso', 'error'); console.error(eiRes.error); return; }
      itensPorOpId = {};
      for (const ei of (eiRes.data || [])) (itensPorOpId[ei.op_id] = itensPorOpId[ei.op_id] || []).push(ei);
      render(data || []);
    }

    let filtroTipo = 'todas';
    let itensPorOpId = {};
    function barraProgresso(pct) {
      return window.el('div', { class: 'w-32' },
        window.el('div', { class: 'h-2 bg-gray-200 rounded-full overflow-hidden' },
          window.el('div', { class: 'h-2 bg-blue-600 rounded-full', style: `width:${pct}%` })),
        window.el('div', { class: 'text-xs text-gray-500 mt-0.5' }, pct + '%'),
      );
    }
    function render(rows) {
      const header = window.pageHeader('Ordens de Produção', [{ label: '+ Nova OP', onclick: () => window.navigate('#/ops/nova') }]);
      const filtro = window.el('div', { class: 'flex gap-2 mb-3' },
        ...[['todas', 'Todas'], ['tecelagem', 'Tecelagem'], ['latex', 'Látex']].map(([val, lbl]) =>
          window.el('button', {
            class: 'px-3 py-1 rounded-lg text-sm font-semibold ' + (filtroTipo === val ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'),
            onclick: () => { filtroTipo = val; render(rows); },
          }, lbl)));
      const visiveis = filtroTipo === 'todas' ? rows : rows.filter(r => (r.tipo || 'tecelagem') === filtroTipo);
      const body = visiveis.length === 0
        ? window.el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' }, 'Nenhuma OP para este filtro.')
        : window.dataTable({
            columns: [
              { key: 'lote_op', label: 'OP', render: (r) => `Nº ${r.numero}/${r.ano}` },
              { key: 'tipo', label: 'Tipo', render: (r) => window.badgeTipo(r.tipo || 'tecelagem') },
              { key: 'lote', label: 'Lote', render: (r) => r.lote ? `Nº ${r.lote.numero}` : '—' },
              { key: 'cliente', label: 'Cliente', render: (r) => r.lote?.cliente?.nome || '—' },
              { key: 'status', label: 'Status', render: (r) => window.badgeStatus(r.status) },
              { key: 'progresso', label: 'Entregue', render: (r) => barraProgresso(window.percentualEntregueOP(r.op_itens || [], itensPorOpId[r.id] || [])) },
              { key: 'criado_em', label: 'Criada em', render: (r) => new Date(r.criado_em).toLocaleDateString('pt-BR') },
            ],
            rows: visiveis,
            actions: [
              { label: (r) => r.status === 'simulada' ? 'Editar' : 'Ver', onclick: (r) => window.navigate('#/ops/' + r.id) },
            ]
          });
      container.replaceChildren(header, filtro, body);
    }

    await reload();
    return window.shellLayout(window.ADMIN_MENU, container);
  }

  // -------------------------------------------------------------------
  // Namespace principal
  // -------------------------------------------------------------------

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};

  window.RAVATEX_SCREENS.opsList = {
    screenListaOPs,
  };

  // Compatibilidade com o setRoutes do inline.
  window.screenListaOPs = screenListaOPs;
})(window);
