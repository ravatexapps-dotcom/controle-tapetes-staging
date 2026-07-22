// =====================================================================
// === SCREENS: ORDEM DE COMPRA — RECEIPT RENDER (PHASE-C4) =============
// Phase: PHASE-C4 (docs/architecture/ORDEM_COMPRA_C4_PHASE_CONTRACT.md,
// OC-C4-ADMIN-001). Pure render for the persistent "Recebimentos" section on
// the dedicated purchase-order detail screen (§R.24.9). Receives
// (state, handlers) and returns DOM nodes — NO Supabase, NO state mutation,
// NO DML (CODE_HEALTH §9). All action availability is read from the
// server-derived `acoes` object in the read model (state.receiptHistory) —
// never recomputed client-side, never inferred from local status fields.
//
// Rendered ONLY for native orders past the draft stage; legacy
// (modelo==='legado') and native-draft orders render no section (contract §7
// matrix). NULL-op / Pedido-origin allocations render as a first-class,
// honest "Pedido (compartilhada)" attribution — never a fabricated OP
// (§R.28.6/§R.29.2). Excess is shown explicitly and distinctly from
// allocation quantities.
//
// Visual: flat hairline card (rounded-lg / #eceef1, no shadow), section icon
// chip + 11px UPPERCASE label (§6), golden-rule table alignment with
// text-right tabular numerics and decimal comma + unit (§2/§7), one dominant
// "Registrar recebimento" action per the section's decision scope (§8), and
// the ratified compact icon-only row-level reversal button (§8.1) via
// js/ui.js's actionButton(). The item/allocation tables are hand-built with
// the same idiom as the sibling ordem-compra-render.js so numeric HEADERS
// align right with their VALUES (dataTable() renders header cells text-left
// only and cannot satisfy the §7 golden rule for numeric columns).
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  var el = window.el;

  // Feather/Lucide 14px functional glyphs (§13). svgIcon mirrors the ratified
  // cadastros.js pattern (innerHTML → firstChild); stroke:currentColor so the
  // actionButton/chip color styling applies.
  function svgIcon(markup) {
    var tmp = document.createElement('div');
    tmp.innerHTML = String(markup).trim();
    return tmp.firstChild;
  }
  var ICON_INBOX = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>';
  var ICON_UNDO = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>';

  function fmtKg(v) {
    if (v == null) return '—';
    return (typeof window.fmtKg === 'function') ? window.fmtKg(v) : String(v);
  }

  // ISO timestamp → DD/MM/AAAA HH:MM (§2).
  function fmtDateTime(ts) {
    if (!ts) return '—';
    var s = String(ts);
    var d = s.slice(0, 10).split('-');
    if (d.length !== 3) return s;
    var time = s.length >= 16 ? (' ' + s.slice(11, 16)) : '';
    return d[2] + '/' + d[1] + '/' + d[0] + time;
  }

  // Honest OP attribution — a real OP id, or the first-class shared/excess
  // state. NEVER fabricates an OP for a NULL-op (Pedido-origin) or excess line.
  function opLabel(opId) {
    if (opId == null) return 'Pedido (compartilhada)';
    return 'OP ' + opId;
  }

  function sectionCard(children) {
    return el('div', { id: 'oc-recebimentos', class: 'bg-white rounded-lg border border-[#eceef1] overflow-hidden mb-4' }, children);
  }

  // Section header: icon chip (20px, radius 4px) + 11px UPPERCASE label +
  // optional dominant action on the right (§6/§8).
  function sectionHeader(actionNode) {
    var chip = el('span', {
      style: 'display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;'
        + 'border-radius:4px;background:#eaf1fd;color:#2563eb;flex:none;',
    }, svgIcon(ICON_INBOX));
    var label = el('span', {
      style: 'font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6b7280;',
    }, 'Recebimentos');
    var left = el('div', { class: 'flex items-center gap-2' }, chip, label);
    return el('div', {
      class: 'px-5 py-3 border-b border-[#eceef1] flex items-center justify-between',
    }, left, actionNode || el('span', {}));
  }

  function th(label, right) {
    return el('th', {
      class: 'px-4 py-2 text-xs font-semibold text-gray-600 uppercase ' + (right ? 'text-right' : 'text-left'),
    }, label);
  }
  function tdNum(value) {
    return el('td', {
      class: 'px-4 py-2 text-sm text-right text-gray-800',
      style: 'font-variant-numeric:tabular-nums;',
    }, fmtKg(value));
  }
  function tdText(value, muted) {
    return el('td', { class: 'px-4 py-2 text-sm ' + (muted ? 'text-gray-500' : 'text-gray-800') }, value);
  }

  function fioLabel(row) {
    var mat = row.material === 'algodao' ? 'Algodão' : 'Poliéster';
    var cor = row.cor_poliester || (row.cor_id != null ? ('Cor ' + row.cor_id) : '—');
    return mat + ' · ' + cor;
  }

  // Per-item saldos: Kg pedido / recebido / restante / excesso (item totals).
  function itensTable(itens) {
    var t = el('table', { class: 'w-full', style: 'table-layout:fixed;' });
    var head = el('thead', { class: 'bg-gray-50 border-b border-[#eceef1]' });
    head.appendChild(el('tr', {}, th('Fio'), th('Kg pedido', true), th('Kg recebido', true), th('Kg restante', true), th('Kg excesso', true)));
    var body = el('tbody', { class: 'divide-y divide-gray-100' });
    itens.forEach(function (it) {
      body.appendChild(el('tr', { 'data-item-id': String(it.item_id) },
        tdText(fioLabel(it)), tdNum(it.kg_pedido), tdNum(it.kg_recebido), tdNum(it.kg_restante), tdNum(it.kg_excesso)));
    });
    t.appendChild(head); t.appendChild(body);
    return el('div', { class: 'overflow-x-auto' }, t);
  }

  // Per-allocation remaining: honest OP/Pedido attribution + kg remaining.
  function alocacoesTable(itens) {
    var t = el('table', { class: 'w-full', style: 'table-layout:fixed;' });
    var head = el('thead', { class: 'bg-gray-50 border-b border-[#eceef1]' });
    head.appendChild(el('tr', {}, th('Fio'), th('Origem'), th('Kg alocado', true), th('Kg recebido', true), th('Kg restante', true)));
    var body = el('tbody', { class: 'divide-y divide-gray-100' });
    var count = 0;
    itens.forEach(function (it) {
      (it.alocacoes || []).forEach(function (a) {
        count += 1;
        body.appendChild(el('tr', { 'data-alocacao-id': String(a.alocacao_id) },
          tdText(fioLabel(it)),
          tdText(opLabel(a.op_id), a.op_id == null),
          tdNum(a.kg_alocado), tdNum(a.kg_recebido), tdNum(a.kg_restante)));
      });
    });
    if (!count) {
      return el('div', { class: 'px-5 py-4 text-sm text-gray-500' }, 'Nenhuma alocação neste item.');
    }
    t.appendChild(head); t.appendChild(body);
    return el('div', { class: 'overflow-x-auto' }, t);
  }

  function tipoBadge(comandoTipo) {
    var isEstorno = comandoTipo === 'estorno';
    return el('span', {
      style: 'display:inline-flex;align-items:center;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap;'
        + (isEstorno ? 'background:#fdecec;color:#c53030;' : 'background:#e7f5ee;color:#18794a;'),
    }, isEstorno ? 'Estorno' : 'Recebimento');
  }

  // One reversal control per reversible receipt lançamento. Compact icon-only
  // row action (§8.1) via actionButton(): 30×30, radius 4px, title +
  // aria-label + sr-only label (all inside actionButton), disabled derived
  // strictly from the server model (acoes.estornar AND kg_reversivel > 0).
  // The confirmDialog gate before execution is wired in the events layer.
  function reversalButton(comando, lanc, acoes, handlers) {
    var reversible = comando.comando_tipo === 'recebimento'
      && acoes && acoes.estornar === true
      && Number(lanc.kg_reversivel) > 0;
    return window.actionButton({
      title: 'Estornar recebimento',
      icon: svgIcon(ICON_UNDO),
      danger: true,
      disabled: !reversible,
      srLabel: 'Estornar recebimento do lançamento ' + lanc.id,
      onclick: reversible ? function () { handlers.estornarLancamento(comando, lanc); } : undefined,
    });
  }

  // Command history: one block per command (recebimento/estorno) with its
  // header metadata and a nested lançamentos table carrying honest per-line
  // OP/excess attribution and the row-level reversal control.
  function historico(comandos, acoes, handlers) {
    var wrap = el('div', { id: 'oc-recebimentos-historico', class: 'divide-y divide-gray-100' });
    if (!comandos.length) {
      return el('div', { id: 'oc-recebimentos-historico', class: 'px-5 py-8 text-center text-gray-500 text-sm' },
        'Nenhum recebimento registrado ainda.');
    }
    comandos.forEach(function (c) {
      var block = el('div', { class: 'px-5 py-4', 'data-comando-id': String(c.id) });
      var meta = el('div', { class: 'flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 text-sm' },
        tipoBadge(c.comando_tipo),
        el('span', { class: 'text-gray-500', style: 'font-variant-numeric:tabular-nums;' }, fmtDateTime(c.ocorrido_em)),
        el('span', { class: 'text-gray-500' }, 'Ator: ' + (c.ator_tipo || '—')),
        el('span', { class: 'text-gray-500', title: c.documento_ref || undefined }, 'Doc.: ' + (c.documento_ref || '—')),
        el('span', { class: 'text-gray-500', title: c.origem_ref || undefined },
          'Origem: ' + ((c.origem_tipo || '—') + (c.origem_ref ? (' / ' + c.origem_ref) : ''))));
      block.appendChild(meta);

      var t = el('table', { class: 'w-full', style: 'table-layout:fixed;' });
      var head = el('thead', { class: 'bg-gray-50 border-y border-[#eceef1]' });
      var showActions = c.comando_tipo === 'recebimento';
      var headRow = el('tr', {}, th('Fio'), th('Origem'), th('Kg'), th('Kg excesso', true), th('Reversível', true));
      headRow.appendChild(el('th', { class: 'px-4 py-2 text-xs font-semibold text-gray-600 uppercase text-right' }, showActions ? 'Ações' : ''));
      head.appendChild(headRow);
      var body = el('tbody', { class: 'divide-y divide-gray-100' });
      (c.lancamentos || []).forEach(function (l) {
        var tr = el('tr', { 'data-lancamento-id': String(l.id) });
        tr.appendChild(tdText(fioLabel(l)));
        tr.appendChild(tdText(opLabel(l.op_id), l.op_id == null));
        tr.appendChild(el('td', { class: 'px-4 py-2 text-sm text-right text-gray-800', style: 'font-variant-numeric:tabular-nums;' }, fmtKg(l.kg)));
        tr.appendChild(tdNum(l.kg_excesso));
        tr.appendChild(el('td', { class: 'px-4 py-2 text-sm text-right text-gray-500', style: 'font-variant-numeric:tabular-nums;' }, fmtKg(l.kg_reversivel)));
        var actTd = el('td', { class: 'px-4 py-2 text-right' });
        if (showActions) actTd.appendChild(reversalButton(c, l, acoes, handlers));
        tr.appendChild(actTd);
        body.appendChild(tr);
      });
      // Kg column header must align right with its numeric values.
      headRow.children[2].className = 'px-4 py-2 text-xs font-semibold text-gray-600 uppercase text-right';
      t.appendChild(head); t.appendChild(body);
      block.appendChild(el('div', { class: 'overflow-x-auto' }, t));
      wrap.appendChild(block);
    });
    return wrap;
  }

  function subHeader(label) {
    return el('div', { class: 'px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-[#eceef1]' }, label);
  }

  // renderReceiptSection(state, handlers) → DOM node, or null when no section
  // must exist (non-native order, or native draft — contract §7 matrix).
  ns.renderReceiptSection = function (state, handlers) {
    var o = state && state.ordem;
    if (!o || o.modelo !== 'nativo') return null;
    if (o.status_administrativo === 'rascunho') return null;

    var hist = state.receiptHistory;

    // Loading / error / empty are honest, distinct states (§15).
    if (!hist || hist.loading) {
      return sectionCard([
        sectionHeader(null),
        el('div', { class: 'px-5 py-8 text-center text-gray-500 text-sm' }, 'Carregando recebimentos…'),
      ]);
    }
    if (hist.ok !== true) {
      return sectionCard([
        sectionHeader(null),
        el('div', { id: 'oc-recebimentos-erro', class: 'px-5 py-8 text-center text-gray-500 text-sm' },
          'Não foi possível carregar os recebimentos.'),
      ]);
    }

    var acoes = hist.acoes || {};
    var registrarBtn = null;
    if (acoes.receber === true) {
      registrarBtn = el('button', {
        id: 'oc-registrar-recebimento',
        class: 'bg-[#2563eb] hover:bg-[#1e56d6] text-white text-sm font-semibold px-3 py-2 rounded',
        style: 'border-radius:4px;',
        onclick: function () { handlers.abrirRegistroRecebimento(); },
      }, 'Registrar recebimento');
    }

    var children = [sectionHeader(registrarBtn)];
    var itens = hist.itens || [];
    children.push(subHeader('Saldos por item'));
    children.push(itens.length ? itensTable(itens) : el('div', { class: 'px-5 py-4 text-sm text-gray-500' }, 'Nenhum item nesta ordem.'));
    children.push(subHeader('Alocações'));
    children.push(alocacoesTable(itens));
    children.push(subHeader('Histórico'));
    children.push(historico(hist.comandos || [], acoes, handlers));

    return sectionCard(children);
  };
})(window);
