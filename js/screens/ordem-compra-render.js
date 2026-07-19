// =====================================================================
// === SCREENS: ORDEM DE COMPRA — RENDER ===============================
// Phase: REFUND-B1 (spec §R.22). Pure render helpers for the native
// purchase-order administration screens. No Supabase, no state mutation:
// receive (state, handlers) and return DOM nodes. All action availability
// is read from the server-derived `acoes` object on each order
// (§R.22.10) — the client never decides which actions are allowed.
//
// Emission is INSTALLED BUT INACTIVE in REFUND-B1 (§R.22.5/§R.22.6): the
// Emitir control is always rendered DISABLED with the server-provided
// `bloqueio_emissao` reason and never wired to a handler.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  var el = window.el;

  var STATUS_LABEL = { rascunho: 'Rascunho', emitida: 'Emitida', cancelada: 'Cancelada' };
  var RECEB_LABEL = { nao_recebido: 'Não recebido', parcial: 'Recebimento parcial', recebido: 'Recebido' };
  var BLOQUEIO_LABEL = {
    distribuicao_necessidades_pendente:
      'Emissão disponível após a distribuição de necessidades (etapa PRE-PROD).',
  };
  ns.BLOQUEIO_LABEL = BLOQUEIO_LABEL;

  function badge(text, bg, fg) {
    return el('span', {
      style: 'display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;'
        + 'padding:3px 10px;border-radius:999px;white-space:nowrap;background:' + bg + ';color:' + fg + ';',
    }, text);
  }

  function modeloBadge(modelo) {
    return modelo === 'nativo'
      ? badge('Nativa', '#eaf1fd', '#2563eb')
      : badge('Legado', '#f3f4f6', '#8a93a3');
  }

  function statusBadge(status) {
    var map = {
      rascunho: ['#fff5e6', '#b7791f'],
      emitida: ['#eaf1fd', '#2563eb'],
      cancelada: ['#f3f4f6', '#8a93a3'],
    };
    var c = map[status] || ['#f3f4f6', '#8a93a3'];
    return badge(STATUS_LABEL[status] || status, c[0], c[1]);
  }

  function fioLabel(item) {
    var mat = item.material === 'algodao' ? 'Algodão' : 'Poliéster';
    var cor = item.cor_nome || item.cor_poliester || '—';
    return mat + ' · ' + cor;
  }
  ns.fioLabel = fioLabel;

  function fmtKg(v) {
    if (v == null) return '—';
    return (typeof window.fmtKg === 'function') ? window.fmtKg(v) : String(v);
  }

  // ---- LIST -----------------------------------------------------------
  ns.renderList = function (state, handlers) {
    var box = el('div', { id: 'ordens-compra-list' });

    var header = el('div', { class: 'flex justify-between items-center mb-4' },
      el('h1', { class: 'text-2xl font-bold' }, 'Ordens de compra'),
      el('button', {
        id: 'oc-nova',
        class: 'bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg',
        onclick: function () { handlers.novaOrdem(); },
      }, 'Nova ordem'));
    box.appendChild(header);

    if (state.indisponivel) {
      box.appendChild(el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' },
        'Administração de ordens de compra indisponível neste ambiente (migração db/68 não aplicada).'));
      return box;
    }

    if (!state.ordens.length) {
      box.appendChild(el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' },
        'Nenhuma ordem de compra ainda.'));
      return box;
    }

    var wrap = el('div', { class: 'bg-white rounded-xl shadow overflow-hidden' });
    var table = el('table', { class: 'w-full' });
    var thead = el('thead', { class: 'bg-gray-50 border-b' });
    thead.appendChild(el('tr', {},
      el('th', { class: 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase' }, 'Modelo'),
      el('th', { class: 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase' }, 'Fornecedor'),
      el('th', { class: 'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase' }, 'Situação'),
      el('th', { class: 'px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase' }, 'Itens'),
      el('th', { class: 'px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase' }, '')));
    var tbody = el('tbody', { class: 'divide-y divide-gray-100' });
    state.ordens.forEach(function (o) {
      var tr = el('tr', { class: 'hover:bg-gray-50', 'data-ordem-id': String(o.ordem_id) });
      tr.appendChild(el('td', { class: 'px-4 py-3 text-sm' }, modeloBadge(o.modelo)));
      tr.appendChild(el('td', { class: 'px-4 py-3 text-sm text-gray-800' }, o.fornecedor_nome || '— não atribuído'));
      tr.appendChild(el('td', { class: 'px-4 py-3 text-sm' }, statusBadge(o.status_administrativo)));
      tr.appendChild(el('td', { class: 'px-4 py-3 text-sm text-right text-gray-800', style: 'font-variant-numeric:tabular-nums;' }, String(o.itens_total)));
      tr.appendChild(el('td', { class: 'px-4 py-3 text-right' },
        el('button', {
          class: 'text-sm text-blue-700 hover:underline',
          onclick: function () { handlers.verOrdem(o.ordem_id); },
        }, 'Ver ordem')));
      tbody.appendChild(tr);
    });
    table.appendChild(thead);
    table.appendChild(tbody);
    wrap.appendChild(table);
    box.appendChild(wrap);
    return box;
  };

  // ---- DETAIL ---------------------------------------------------------
  ns.renderDetail = function (state, handlers) {
    var box = el('div', { id: 'ordem-compra-detail' });

    box.appendChild(el('div', { class: 'mb-4' },
      el('button', { class: 'text-sm text-blue-700 hover:underline', onclick: function () { handlers.voltar(); } }, '← Ordens de compra')));

    if (state.indisponivel) {
      box.appendChild(el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' },
        'Administração de ordens de compra indisponível neste ambiente (migração db/68 não aplicada).'));
      return box;
    }

    var o = state.ordem;
    if (!o) {
      box.appendChild(el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' }, 'Ordem de compra não encontrada.'));
      return box;
    }

    var acoes = o.acoes || {};

    // Header card
    var head = el('div', { class: 'bg-white rounded-xl shadow p-5 mb-4' });
    head.appendChild(el('div', { class: 'flex items-center gap-3 mb-3' },
      el('h1', { class: 'text-xl font-bold' }, 'Ordem de compra #' + o.ordem_id),
      modeloBadge(o.modelo), statusBadge(o.status_administrativo)));
    head.appendChild(el('div', { class: 'text-sm text-gray-600' },
      'Fornecedor: ' + (o.fornecedor_nome || '— não atribuído')));
    if (o.modelo === 'legado') {
      head.appendChild(el('div', { class: 'mt-2 text-xs text-gray-500' },
        'Ordem importada do modelo legado — inerte no novo modelo (administração pela via legada).'));
    }

    // Actions row (server-derived)
    var actions = el('div', { class: 'flex items-center gap-2 mt-4' });
    if (acoes.editar_itens) {
      actions.appendChild(el('button', {
        id: 'oc-add-item',
        class: 'bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-3 py-2 rounded-lg',
        onclick: function () { handlers.adicionarItem(o); },
      }, 'Adicionar item'));
    }
    if (acoes.cancelar) {
      actions.appendChild(el('button', {
        id: 'oc-cancelar',
        class: 'border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold px-3 py-2 rounded-lg',
        onclick: function () { handlers.cancelar(o); },
      }, 'Cancelar ordem'));
    }
    // Emission — INSTALLED BUT INACTIVE (§R.22.6): always disabled, never wired.
    var emitBtn = el('button', {
      id: 'oc-emitir',
      class: 'bg-gray-200 text-gray-500 text-sm font-semibold px-3 py-2 rounded-lg cursor-not-allowed',
      title: BLOQUEIO_LABEL[o.bloqueio_emissao] || 'Emissão indisponível nesta fase.',
      disabled: true,
    }, 'Emitir');
    actions.appendChild(emitBtn);
    head.appendChild(actions);
    if (o.pode_emitir === false && o.bloqueio_emissao) {
      head.appendChild(el('div', { id: 'oc-bloqueio-emissao', class: 'mt-2 text-xs text-amber-700' },
        BLOQUEIO_LABEL[o.bloqueio_emissao] || o.bloqueio_emissao));
    }
    box.appendChild(head);

    // Items
    var itemsCard = el('div', { class: 'bg-white rounded-xl shadow overflow-hidden mb-4' });
    itemsCard.appendChild(el('div', { class: 'px-5 py-3 border-b text-xs font-semibold text-gray-600 uppercase' }, 'Itens'));
    var items = o.itens || [];
    if (!items.length) {
      itemsCard.appendChild(el('div', { class: 'p-6 text-center text-gray-500 text-sm' }, 'Nenhum item neste rascunho.'));
    } else {
      var t = el('table', { class: 'w-full' });
      var th = el('thead', { class: 'bg-gray-50 border-b' });
      th.appendChild(el('tr', {},
        el('th', { class: 'px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase' }, 'Fio'),
        el('th', { class: 'px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase' }, 'Kg pedido'),
        el('th', { class: 'px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase' }, 'Kg alocado'),
        el('th', { class: 'px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase' }, '')));
      var tb = el('tbody', { class: 'divide-y divide-gray-100' });
      items.forEach(function (it) {
        var tr = el('tr', { 'data-item-id': String(it.item_id) });
        tr.appendChild(el('td', { class: 'px-4 py-2 text-sm text-gray-800' }, fioLabel(it)));
        tr.appendChild(el('td', { class: 'px-4 py-2 text-sm text-right text-gray-800', style: 'font-variant-numeric:tabular-nums;' }, fmtKg(it.kg_pedido)));
        tr.appendChild(el('td', { class: 'px-4 py-2 text-sm text-right text-gray-500', style: 'font-variant-numeric:tabular-nums;' }, fmtKg(it.kg_alocado)));
        var actTd = el('td', { class: 'px-4 py-2 text-right whitespace-nowrap' });
        if (acoes.editar_itens) {
          actTd.appendChild(el('button', {
            class: 'text-sm text-blue-700 hover:underline ml-3', onclick: function () { handlers.editarItem(o, it); },
          }, 'Editar'));
        }
        if (acoes.remover_itens) {
          actTd.appendChild(el('button', {
            class: 'text-sm text-red-600 hover:underline ml-3', onclick: function () { handlers.removerItem(o, it); },
          }, 'Remover'));
        }
        tr.appendChild(actTd);
        tb.appendChild(tr);
      });
      t.appendChild(th); t.appendChild(tb);
      itemsCard.appendChild(t);
    }
    box.appendChild(itemsCard);

    // Event history
    var evCard = el('div', { class: 'bg-white rounded-xl shadow overflow-hidden' });
    evCard.appendChild(el('div', { class: 'px-5 py-3 border-b text-xs font-semibold text-gray-600 uppercase' }, 'Histórico'));
    var evs = state.eventos || [];
    if (!evs.length) {
      evCard.appendChild(el('div', { class: 'p-6 text-center text-gray-500 text-sm' }, 'Sem eventos administrativos.'));
    } else {
      var list = el('div', { class: 'divide-y divide-gray-100' });
      evs.forEach(function (e) {
        list.appendChild(el('div', { class: 'px-5 py-3 text-sm text-gray-700 flex justify-between' },
          el('span', {}, (e.tipo_evento || '') + (e.valor_anterior ? (' (' + e.valor_anterior + ' → ' + e.valor_novo + ')') : '')),
          el('span', { class: 'text-gray-400 text-xs' }, e.criado_em ? String(e.criado_em).slice(0, 19).replace('T', ' ') : '')));
      });
      evCard.appendChild(list);
    }
    box.appendChild(evCard);

    return box;
  };
})(window);
