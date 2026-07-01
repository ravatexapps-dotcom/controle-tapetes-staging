// =====================================================================
// === SCREENS: OP LATEX ADMIN (Seam A) =================================
// Tela admin da OP de latex/acabamento. A fase standalone aplica o
// redesign visual somente na preparacao (status aberta) e preserva o
// fluxo existente para em_producao/finalizada.
// =====================================================================

(function (window) {
  'use strict';

  function svgEl(markup) {
    var tmp = document.createElement('div');
    tmp.innerHTML = markup;
    return tmp.firstElementChild;
  }

  var SVG_BACK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  var SVG_ICON_OP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path><rect x="9" y="3" width="6" height="4" rx="1"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="9" y1="16" x2="13" y2="16"></line></svg>';
  var SVG_ICON_GRID = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18M3 15h18M9 3v18"></path></svg>';
  var SVG_ICON_LINES = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10H3M21 6H3M21 14H3M21 18H3"></path></svg>';
  var SVG_ICON_SUMMARY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"></rect><path d="M8 7h8M8 11h8M8 15h5"></path></svg>';
  var SVG_INFO_BAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  var SVG_OPEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
  var SVG_HINT_LOCK = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9aa2af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';

  var CARD = 'background:#fff;border:1px solid #eceef1;border-radius:6px;';
  var FIELD_LABEL = 'font-size:13px;font-weight:600;color:#3f4757;margin-bottom:7px;display:block;';
  var TH_STYLE = 'font-size:11px;font-weight:700;color:#8a93a3;letter-spacing:.04em;white-space:nowrap;';
  var BTN_PRIMARY = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;background:#2563eb;color:#fff;border:none;border-radius:4px;padding:12px 16px;font-weight:700;font-size:15px;font-family:inherit;';
  var BTN_BACK = 'display:inline-flex;align-items:center;gap:7px;background:#fff;color:#5b6472;border:1px solid #d8dce2;border-radius:4px;padding:8px 16px;font-weight:600;font-size:13.5px;font-family:inherit;cursor:pointer;';
  var BTN_LINK = 'display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#2563eb;background:none;border:none;padding:0;cursor:pointer;font-family:inherit;';
  var BTN_DANGER_LINK = 'display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#d6403a;background:none;border:none;padding:0;cursor:pointer;font-family:inherit;';
  var SECTION_ICON = 'width:34px;height:34px;border-radius:6px;background:#eaf1fd;display:flex;align-items:center;justify-content:center;flex-shrink:0;';

  function sectionIcon(svgMarkup) {
    return el('div', { style: SECTION_ICON }, svgEl(svgMarkup));
  }

  function sectionHead(svgMarkup, title) {
    return el('div', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:18px;' },
      sectionIcon(svgMarkup),
      el('span', { style: 'font-size:16px;font-weight:700;color:#16203a;' }, title));
  }

  function fieldBlock(label, valueNode, style) {
    return el('div', { style: style || '' },
      el('label', { style: FIELD_LABEL }, label),
      valueNode);
  }

  function thRow(colsTemplate, labels) {
    return el('div', { style: 'display:grid;grid-template-columns:' + colsTemplate + ';gap:10px;padding:10px 24px;background:#f8f9fb;border-bottom:1px solid #eceef1;' },
      labels.map(function (label, idx) {
        return el('div', { style: TH_STYLE + (idx === labels.length - 1 ? 'text-align:right;' : '') }, label);
      }));
  }

  function gridRow(colsTemplate, cells) {
    return el('div', { style: 'display:grid;grid-template-columns:' + colsTemplate + ';gap:10px;padding:12px 24px;border-bottom:1px solid #f1f3f6;align-items:center;' }, cells);
  }

  function sumMetros(rows, key) {
    return Math.round((rows || []).reduce(function (acc, row) {
      return acc + Number(row && row[key] ? row[key] : 0);
    }, 0) * 100) / 100;
  }

  async function renderOPLatexAdmin(opId) {
    var container = el('div', {});

    async function reload() {
      var opRes = await supa.from('ops')
        .select('id, numero, ano, status, tipo, observacao, origem_op_id, lote:lote_id(id, numero, cliente:cliente_id(id, nome)), op_itens(id, modelo_id, metros_pedidos, metros_ajustados), op_fornecedores(fornecedor_id, etapa, fornecedores:fornecedor_id(nome))')
        .eq('id', opId)
        .single();
      if (opRes.error) {
        toast('Erro ao carregar OP de latex', 'error');
        console.error(opRes.error);
        return;
      }

      var op = opRes.data;
      var latexForn = (op.op_fornecedores || []).find(function (row) { return row.etapa === 'latex'; });
      var latexFornecedorId = latexForn ? latexForn.fornecedor_id : null;

      var origemOp = null;
      if (op.origem_op_id) {
        var origemRes = await supa.from('ops')
          .select('id, numero, ano, tipo')
          .eq('id', op.origem_op_id)
          .maybeSingle();
        if (!origemRes.error && origemRes.data) origemOp = origemRes.data;
      }

      var entRes = await supa.from('entregas')
        .select('id, fornecedor_id, data, observacao, entrega_itens(id, op_id, op_item_id, metros_entregues, defeito, observacao)')
        .eq('etapa', 'latex')
        .eq('fornecedor_id', latexFornecedorId)
        .order('data', { ascending: false })
        .order('id', { ascending: false });
      var recebimentos = (entRes.data || []).filter(function (row) {
        return (row.entrega_itens || []).some(function (ei) { return ei.op_id === op.id; });
      });

      var modeloIds = Array.from(new Set((op.op_itens || []).map(function (item) { return item.modelo_id; })));
      var modelosRes = modeloIds.length
        ? await supa.from('modelos').select('id, nome, largura, cor_1:cor_1_id(id,nome), cor_2:cor_2_id(id,nome)').in('id', modeloIds)
        : { data: [] };
      var modelosById = {};
      (modelosRes.data || []).forEach(function (modelo) { modelosById[modelo.id] = modelo; });

      render(op, recebimentos, modelosById, latexFornecedorId, origemOp);
    }

    function render(op, recebimentos, modelosById, latexFornecedorId, origemOp) {
      var recItens = recebimentos.flatMap(function (ent) {
        return (ent.entrega_itens || []).filter(function (ei) { return ei.op_id === op.id; });
      });
      var totalPorItem = totalEntregueCimaPorItem(recItens);

      function abrirEdicaoAdmin(ent, opArg, modelosByIdArg) {
        var form = buildEntregaInlineForm({ opItens: opArg.op_itens || [], modelosById: modelosByIdArg, entrega: ent, comDestino: false });
        modal({
          title: 'Editar recebimento - ' + new Date(ent.data + 'T00:00:00').toLocaleDateString('pt-BR'),
          body: form.node,
          saveLabel: 'Salvar alteracoes',
          onSave: async function () {
            var ok = await atualizarEntregaLatex({ entregaId: ent.id, opId: opArg.id, payload: form.getPayload() });
            if (ok) reload();
            return ok;
          },
        });
      }

      if (op.status !== 'aberta') {
        var acoes = [{ label: '← Voltar', onclick: function () { navigate('#/ops'); } }];
        if (op.origem_op_id) acoes.push({ label: 'Ir para OP de tecelagem', onclick: function () { navigate('#/ops/' + op.origem_op_id); } });
        if (op.status === 'em_producao') acoes.push({ label: 'Finalizar OP de látex', onclick: function () { finalizar(op.id); } });
        if (op.status === 'em_producao') acoes.push({ label: 'Editar enviado', onclick: function () { editarEnviado(op, modelosById); } });
        acoes.push({ label: 'Excluir OP de látex', onclick: function () { excluirOpLatex(op.id); } });

        var header = pageHeader('OP de látex Nº ' + op.numero + '/' + op.ano, acoes);
        var info = el('div', { class: 'bg-white rounded-xl shadow p-5 mb-4' },
          el('div', { class: 'flex items-center gap-3 mb-2' }, badgeTipo('latex'), badgeStatus(op.status)),
          op.lote ? el('div', { class: 'text-sm text-gray-700 mb-1' }, 'Lote Nº ' + op.lote.numero + ' · ' + (op.lote.cliente?.nome || '—')) : el('span', {}),
          op.observacao ? el('div', { class: 'text-sm text-gray-600' }, op.observacao) : el('span', {}));

        var tabela = dataTable({
          columns: [
            { key: 'modelo', label: 'Modelo', render: function (item) {
                var modelo = modelosById[item.modelo_id];
                return modelo ? window.rotuloModelo(modelo) : ('#' + item.modelo_id);
              } },
            { key: 'enviado', label: 'Enviado', render: function (item) { return window.fmtMetros(item.metros_pedidos); } },
            { key: 'recebido', label: 'Recebido', render: function (item) { return window.fmtMetros(totalPorItem[item.id] || 0); } },
            { key: 'falta', label: 'Falta', render: function (item) {
                var falta = Math.round((Number(item.metros_pedidos) - (totalPorItem[item.id] || 0)) * 100) / 100;
                return el('span', { class: falta <= 0 ? 'text-green-700' : 'text-gray-800' }, falta <= 0 ? '✅ completo' : window.fmtMetros(falta));
              } },
          ],
          rows: op.op_itens || [],
        });

        var box = el('div', { class: 'bg-white rounded-xl shadow p-5' });
        box.appendChild(el('div', { class: 'font-semibold text-gray-700 mb-3' }, 'Recebimentos'));

        if (op.status === 'em_producao' && latexFornecedorId) {
          var formHolder = el('div', {});
          var btnNova = el('button', { class: 'text-sm text-blue-700 hover:underline mb-2',
            onclick: function () {
              var form = buildEntregaInlineForm({ opItens: op.op_itens || [], modelosById: modelosById, comDestino: false });
              var btnSalvar = el('button', { class: 'bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg px-3 py-2 mr-2',
                onclick: async function () {
                  btnSalvar.disabled = true;
                  var ok = await salvarEntregaLatex({ fornecedorId: latexFornecedorId, opId: op.id, payload: form.getPayload() });
                  btnSalvar.disabled = false;
                  if (ok) reload();
                } }, 'Salvar recebimento');
              var btnCancelar = el('button', { class: 'bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg px-3 py-2',
                onclick: function () {
                  formHolder.replaceChildren();
                  btnNova.style.display = '';
                } }, 'Cancelar');
              formHolder.replaceChildren(el('div', {}, form.node, el('div', { class: 'mt-2' }, btnSalvar, btnCancelar)));
              btnNova.style.display = 'none';
            } }, '+ Novo recebimento');
          box.appendChild(btnNova);
          box.appendChild(formHolder);
        }

        if (recebimentos.length === 0) {
          box.appendChild(el('p', { class: 'text-sm text-gray-400 mt-2' }, 'Nenhum recebimento registrado ainda.'));
        } else {
          recebimentos.forEach(function (ent) {
            var sub = el('div', { class: 'border-b py-3' });
            sub.appendChild(el('div', { class: 'flex items-center justify-between' },
              el('div', { class: 'text-sm' }, el('b', {}, new Date(ent.data + 'T00:00:00').toLocaleDateString('pt-BR'))),
              op.status === 'em_producao' ? el('div', {},
                el('button', { class: 'text-sm text-blue-700 hover:underline mr-3',
                  onclick: function () { abrirEdicaoAdmin(ent, op, modelosById); } }, 'Editar'),
                el('button', { class: 'text-sm text-red-600 hover:underline',
                  onclick: function () { excluirEntrega(ent.id, reload); } }, 'Excluir')) : ''));
            if (ent.observacao) sub.appendChild(el('div', { class: 'text-xs text-gray-500' }, ent.observacao));
            (ent.entrega_itens || []).filter(function (item) { return item.op_id === op.id; }).forEach(function (ei) {
              var it = (op.op_itens || []).find(function (item) { return item.id === ei.op_item_id; });
              var modelo = it ? modelosById[it.modelo_id] : null;
              sub.appendChild(el('div', { class: 'text-sm text-gray-700' },
                (modelo ? window.rotuloModelo(modelo) : ('#' + ei.op_item_id)) + ': ' + window.fmtMetros(ei.metros_entregues),
                ei.defeito ? el('span', { class: 'ml-2 text-red-600 font-semibold' }, '⚠ DEFEITO') : '',
                ei.observacao ? el('span', { class: 'ml-2 text-xs text-gray-500' }, '(' + ei.observacao + ')') : ''));
            });
            box.appendChild(sub);
          });
        }

        container.replaceChildren(header, info, tabela, el('div', { class: 'h-4' }), box);
        return;
      }

      var totalEnviado = sumMetros(op.op_itens, 'metros_pedidos');
      var totalRecebido = Math.round(recItens.reduce(function (acc, item) {
        return acc + Number(item.metros_entregues || 0);
      }, 0) * 100) / 100;
      var metrosAguardando = Math.round(Math.max(totalEnviado - totalRecebido, 0) * 100) / 100;
      var latexFornecedorNome = ((op.op_fornecedores || []).find(function (row) {
        return row.etapa === 'latex';
      }) || {}).fornecedores?.nome || '—';
      var origemLabel = origemOp
        ? ('OP ' + origemOp.numero + '/' + origemOp.ano + ' · Tecelagem')
        : (op.origem_op_id ? ('OP #' + op.origem_op_id) : '—');

      function buildHeader() {
        var subtitulo = origemOp
          ? 'Preparacao do acabamento a partir de ' + origemLabel + '.'
          : 'Preparacao da OP de acabamento antes do inicio da producao.';
        return el('div', { style: 'display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;gap:12px;flex-wrap:wrap;' },
          el('div', {},
            el('div', { style: 'font-size:22px;font-weight:800;color:#16203a;letter-spacing:-.01em;' }, 'OP Aberta de Acabamento · Nº ' + op.numero + '/' + op.ano),
            el('div', { style: 'font-size:13px;color:#8a93a3;margin-top:3px;line-height:1.45;' }, subtitulo)),
          el('button', { type: 'button', style: BTN_BACK, onclick: function () { navigate('#/ops'); } }, svgEl(SVG_BACK), 'Voltar'));
      }

      function buildCardDados() {
        var loteLabel = op.lote
          ? ('Lote Nº ' + op.lote.numero + ' · ' + (op.lote.cliente?.nome || '—'))
          : 'Sem lote vinculado';
        return el('div', { style: CARD + 'padding:22px 24px;' },
          sectionHead(SVG_ICON_OP, '1. Preparacao da OP'),
          el('div', { style: 'display:grid;grid-template-columns:1fr 140px;gap:14px;margin-bottom:16px;' },
            fieldBlock('Número', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, String(op.numero))),
            fieldBlock('Ano', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, String(op.ano)))),
          el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:16px;' },
            fieldBlock('Fornecedor de acabamento', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, latexFornecedorNome)),
            fieldBlock('Lote', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, loteLabel))),
          op.observacao ? el('div', { style: 'margin-top:16px;font-size:12.5px;color:#5b6472;line-height:1.5;' }, op.observacao) : '');
      }

      function buildCardItens() {
        var card = el('div', { style: CARD + 'padding:22px 0 0;' },
          el('div', { style: 'display:flex;align-items:center;justify-content:space-between;padding:0 24px 18px;' },
            el('div', { style: 'display:flex;align-items:center;gap:10px;' },
              sectionIcon(SVG_ICON_GRID),
              el('span', { style: 'font-size:16px;font-weight:700;color:#16203a;' }, '2. Itens da OP'),
              el('span', { style: 'font-size:13px;color:#8a93a3;font-weight:400;' }, '(modelo × metros)'))));

        if (!(op.op_itens || []).length) {
          card.appendChild(el('div', { style: 'padding:0 24px 20px;font-size:13px;color:#aab2bf;' }, 'Nenhum item vinculado a esta OP.'));
          return card;
        }

        card.appendChild(thRow('1fr 140px 140px', ['MODELO', 'ENVIADO', 'RECEBIDO']));
        (op.op_itens || []).forEach(function (item) {
          var modelo = modelosById[item.modelo_id];
          card.appendChild(gridRow('1fr 140px 140px', [
            el('div', { style: 'font-size:13.5px;font-weight:500;color:#16203a;' }, modelo ? window.rotuloModelo(modelo) : ('#' + item.modelo_id)),
            el('div', { style: 'font-size:13.5px;color:#3f4757;' }, window.fmtMetros(item.metros_pedidos)),
            el('div', { style: 'font-size:13.5px;color:#3f4757;' }, window.fmtMetros(totalPorItem[item.id] || 0)),
          ]));
        });
        return card;
      }

      function buildCardRecebimentos() {
        var box = el('div', { style: CARD + 'padding:22px 24px 20px;' });
        box.appendChild(sectionHead(SVG_ICON_LINES, '3. Material recebido da tecelagem'));
        box.appendChild(el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:18px;' },
          fieldBlock('OP origem',
            origemOp
              ? el('button', { type: 'button', style: BTN_LINK, onclick: function () { navigate('#/ops/' + origemOp.id); } }, origemLabel)
              : el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, origemLabel)),
          fieldBlock('Material recebido da tecelagem', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, window.fmtMetros(totalEnviado))),
          fieldBlock('Total ajustado da OP', el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, window.fmtMetros(totalEnviado))),
          fieldBlock('Metros aguardando inicio do acabamento', el('div', { style: 'font-size:14px;font-weight:700;color:#2563eb;' }, window.fmtMetros(metrosAguardando)))));

        box.appendChild(el('div', { style: 'font-size:13px;font-weight:700;color:#16203a;margin-bottom:8px;' }, 'Historico'));
        if (!recebimentos.length) {
          box.appendChild(el('div', { style: 'font-size:13px;color:#aab2bf;' }, 'Nenhum recebimento registrado ainda.'));
          return box;
        }

        box.appendChild(el('div', {},
          recebimentos.map(function (ent) {
            var sub = el('div', { style: 'border-bottom:1px solid #f1f3f6;padding:14px 0;' });
            sub.appendChild(el('div', { style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;' },
              el('div', { style: 'font-size:14px;font-weight:600;color:#16203a;' }, new Date(ent.data + 'T00:00:00').toLocaleDateString('pt-BR'))));
            if (ent.observacao) sub.appendChild(el('div', { style: 'font-size:12px;color:#8a93a3;margin-top:2px;' }, ent.observacao));
            (ent.entrega_itens || []).filter(function (item) { return item.op_id === op.id; }).forEach(function (ei) {
              var opItem = (op.op_itens || []).find(function (row) { return row.id === ei.op_item_id; });
              var modelo = opItem ? modelosById[opItem.modelo_id] : null;
              sub.appendChild(el('div', { style: 'font-size:13.5px;color:#3f4757;margin-top:4px;' },
                (modelo ? window.rotuloModelo(modelo) : ('#' + ei.op_item_id)) + ': ' + window.fmtMetros(ei.metros_entregues),
                ei.defeito ? el('span', { style: 'margin-left:8px;color:#d6403a;font-weight:600;font-size:12.5px;' }, 'DEFEITO') : '',
                ei.observacao ? el('span', { style: 'margin-left:8px;font-size:12px;color:#8a93a3;' }, '(' + ei.observacao + ')') : ''));
            });
            return sub;
          })));
        return box;
      }

      function buildRight() {
        var right = el('div', { style: CARD + 'padding:20px;' });
        right.replaceChildren(
          el('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:16px;' },
            el('div', { style: 'width:40px;height:40px;border-radius:8px;background:#eaf1fd;display:flex;align-items:center;justify-content:center;flex-shrink:0;' }, svgEl(SVG_ICON_SUMMARY)),
            el('div', {},
              el('div', { style: 'font-size:15px;font-weight:700;color:#16203a;' }, 'Resumo da OP'),
              el('span', { style: 'display:inline-block;margin-top:4px;background:#eaf1fd;color:#2563eb;font-size:11.5px;font-weight:600;border-radius:4px;padding:2px 8px;' }, 'Preparacao'))),
          el('div', { style: 'font-size:13px;color:#5b6472;font-weight:500;margin-bottom:16px;' }, 'OP ' + op.numero + '/' + op.ano),
          el('div', { style: 'height:1px;background:#eceef1;margin-bottom:16px;' }),
          origemOp ? el('div', { style: 'font-size:10.5px;font-weight:700;color:#8a93a3;letter-spacing:.06em;margin-bottom:6px;' }, 'ORIGEM') : '',
          origemOp ? el('div', { style: 'font-size:13.5px;font-weight:700;color:#16203a;margin-bottom:4px;' }, origemLabel) : '',
          el('div', { style: 'font-size:12.5px;color:#5b6472;margin-bottom:14px;line-height:1.5;' }, 'Fornecedor de acabamento: ' + latexFornecedorNome),
          el('div', { style: 'font-size:13px;font-weight:700;color:#16203a;margin-bottom:14px;' }, 'Movimentacao da OP'),
          el('div', { style: 'margin-bottom:14px;' },
            el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;' },
              el('span', { style: 'font-size:13px;font-weight:600;color:#3f4757;' }, 'Recebido da tecelagem'),
              el('span', { style: 'font-size:13px;color:#3f4757;font-weight:500;' }, window.fmtMetros(totalEnviado))),
            el('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;' },
              el('span', { style: 'font-size:13px;font-weight:600;color:#3f4757;' }, 'Recebido no acabamento'),
              el('span', { style: 'font-size:13px;color:#3f4757;font-weight:500;' }, window.fmtMetros(totalRecebido))),
            el('div', { style: 'display:flex;justify-content:space-between;align-items:center;' },
              el('span', { style: 'font-size:13px;font-weight:600;color:#3f4757;' }, 'Saldo aguardando'),
              el('span', { style: 'font-size:13px;color:' + (metrosAguardando > 0 ? '#2563eb' : '#18794a') + ';font-weight:700;' }, window.fmtMetros(metrosAguardando)))),
          el('div', { style: 'height:1px;background:#eceef1;margin-bottom:14px;' }),
          el('button', {
            type: 'button',
            style: BTN_PRIMARY + 'margin-bottom:12px;opacity:.6;cursor:not-allowed;',
            disabled: true,
          }, svgEl(SVG_OPEN), 'Colocar em producao'),
          el('div', { style: 'display:flex;align-items:flex-start;gap:7px;margin-bottom:14px;' },
            svgEl(SVG_HINT_LOCK),
            el('span', { style: 'font-size:12px;color:#8a93a3;line-height:1.5;' }, 'Transicao para producao sera implementada em fase propria.')),
          origemOp ? el('button', { type: 'button', style: BTN_LINK + 'margin-bottom:10px;', onclick: function () { navigate('#/ops/' + origemOp.id); } }, 'Ir para OP de tecelagem') : '',
          el('button', { type: 'button', style: BTN_DANGER_LINK, onclick: function () { excluirOpLatex(op.id); } }, 'Excluir OP de acabamento'));
        return right;
      }

      function buildBottomInfoBar() {
        return el('div', { style: 'margin-top:16px;display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #eceef1;border-radius:6px;padding:12px 16px;' },
          svgEl(SVG_INFO_BAR),
          el('span', { style: 'font-size:13px;color:#5b6472;' }, 'Esta OP esta aberta em modo de preparacao visual. A transicao para producao permanece fora de escopo nesta fase.'));
      }

      container.replaceChildren(
        buildHeader(),
        el('div', { style: 'display:grid;grid-template-columns:1fr 288px;gap:16px;align-items:start;' },
          el('div', { style: 'display:flex;flex-direction:column;gap:16px;' },
            buildCardDados(),
            buildCardItens(),
            buildCardRecebimentos()),
          buildRight()),
        buildBottomInfoBar());
    }

    async function finalizar(id) {
      confirmDialog({
        title: 'Finalizar OP de latex',
        message: 'Marcar esta OP de latex como finalizada?',
        confirmLabel: 'Finalizar',
        onConfirm: async function () {
          var r = await supa.from('ops').update({ status: 'finalizada', finalizada_em: new Date().toISOString() }).eq('id', id);
          if (r.error) {
            toast('Erro ao finalizar', 'error');
            console.error(r.error);
            return;
          }
          toast('OP de latex finalizada', 'success');
          reload();
        },
      });
    }

    function editarEnviado(op, modelosById) {
      var linhas = (op.op_itens || []).map(function (it) {
        var m = modelosById[it.modelo_id];
        var rotulo = m
          ? (m.nome + ' ' + larguraKey(m.largura) + 'm · ' + (m.cor_1?.nome || '?') + '/' + (m.cor_2?.nome || '?'))
          : ('#' + it.modelo_id);
        var input = textInput({ type: 'number', step: '0.01', value: String(it.metros_pedidos) });
        return {
          id: it.id,
          input: input,
          node: el('div', { class: 'flex items-center gap-2 mb-2' },
            el('div', { class: 'flex-1 text-sm text-gray-700' }, rotulo),
            el('div', { class: 'w-32' }, formField({ label: 'Enviado (m)', input: input }))),
        };
      });

      modal({
        title: 'Editar enviado (manual)',
        body: el('div', {},
          el('p', { class: 'text-xs text-gray-500 mb-3' }, 'Ajuste os metros enviados por modelo.'),
          linhas.map(function (linha) { return linha.node; })),
        saveLabel: 'Salvar',
        onSave: async function () {
          for (var i = 0; i < linhas.length; i++) {
            var val = Number(linhas[i].input.value);
            if (!Number.isFinite(val) || val <= 0) {
              toast('Informe um valor maior que zero em todos os modelos', 'error');
              return false;
            }
          }
          for (var j = 0; j < linhas.length; j++) {
            var row = linhas[j];
            var r = await supa.from('op_itens').update({ metros_pedidos: Number(row.input.value) }).eq('id', row.id);
            if (r.error) {
              toast('Erro ao salvar enviado', 'error');
              console.error(r.error);
              return false;
            }
          }
          toast('Enviado atualizado', 'success');
          reload();
          return true;
        },
      });
    }

    function excluirOpLatex(id) {
      confirmDialog({
        title: 'Excluir OP de latex',
        message: 'Isto remove a OP de latex e seus itens. Se ja houver recebimentos lancados, a exclusao sera bloqueada - exclua os recebimentos primeiro. Continuar?',
        confirmLabel: 'Excluir',
        onConfirm: async function () {
          var r = await supa.from('ops').delete().eq('id', id);
          if (r.error) {
            toast('Erro ao excluir OP de latex', 'error');
            console.error(r.error);
            return;
          }
          toast('OP de latex excluida', 'success');
          navigate('#/ops');
        },
      });
    }

    await reload();
    return shellLayout(ADMIN_MENU, container);
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opLatexAdmin = {
    renderOPLatexAdmin: renderOPLatexAdmin,
  };

  window.renderOPLatexAdmin = renderOPLatexAdmin;
})(window);
