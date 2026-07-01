// =====================================================================
// === SCREENS: PEDIDO DETAIL PROGRESS ================================
// Calculos e normalizacao de progresso do detalhe do pedido.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.pedidoDetail = window.RAVATEX_SCREENS.pedidoDetail || {};

  function opLabel(op) {
    return 'OP ' + op.numero + '/' + op.ano;
  }

  function stageKeyForOp(op) {
    return op && op.tipo === 'latex' ? 'acabamento' : 'tecelagem';
  }

  function stageLabelForOp(op) {
    return stageKeyForOp(op) === 'acabamento' ? 'Acabamento' : 'Tecelagem';
  }

  function deliveryStageForOp(op) {
    return op && op.tipo === 'latex' ? 'latex' : 'cima';
  }

  function targetMetersForOpItem(opItem) {
    var value = opItem && opItem.metros_ajustados != null
      ? opItem.metros_ajustados
      : opItem && opItem.metros_pedidos;
    return ns.round2(value);
  }

  function sumPedidoMetros(state) {
    if (state.pedido && ns.toFiniteNumber(state.pedido.metros_total) > 0) {
      return ns.round2(state.pedido.metros_total);
    }
    return ns.round2(state.itens.reduce(function (acc, item) {
      return acc + ns.toFiniteNumber(item.metros);
    }, 0));
  }

  function buildUniquePedidoItemByModelo(state) {
    var countByModelo = {};
    var map = {};
    state.itens.forEach(function (item) {
      countByModelo[item.modelo_id] = (countByModelo[item.modelo_id] || 0) + 1;
      map[item.modelo_id] = item;
    });
    Object.keys(map).forEach(function (modeloId) {
      if (countByModelo[modeloId] !== 1) delete map[modeloId];
    });
    return map;
  }

  function sortOpsForDisplay(rows) {
    return rows.slice().sort(function (a, b) {
      var aStage = stageKeyForOp(a) === 'tecelagem' ? 0 : 1;
      var bStage = stageKeyForOp(b) === 'tecelagem' ? 0 : 1;
      if (aStage !== bStage) return aStage - bStage;
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.numero - b.numero;
    });
  }

  function collectPartialMeta(state) {
    var meta = {
      anyDeliveredBreakdown: false,
      anyReadyBreakdown: false,
      deliveredByItem: {},
      readyByItem: {},
    };
    if (!state.parcialItens.length || !state.parciais.length) return meta;

    var parcialById = {};
    state.parciais.forEach(function (parcial) {
      parcialById[parcial.id] = parcial;
    });

    state.parcialItens.forEach(function (row) {
      var parcial = parcialById[row.parcial_id];
      if (!parcial || parcial.situacao === 'cancelado') return;
      var itemId = row.pedido_item_id;
      var metros = ns.toFiniteNumber(row.metros);

      if (parcial.situacao === 'entregue') {
        meta.anyDeliveredBreakdown = true;
        meta.deliveredByItem[itemId] = ns.round2((meta.deliveredByItem[itemId] || 0) + metros);
      }
      if (ns.READY_SITUATIONS.indexOf(parcial.situacao) !== -1) {
        meta.anyReadyBreakdown = true;
        meta.readyByItem[itemId] = ns.round2((meta.readyByItem[itemId] || 0) + metros);
      }
    });

    return meta;
  }

  function allocateByWeight(total, rows, keyName) {
    var result = {};
    var safeRows = rows.filter(function (row) { return ns.toFiniteNumber(row.weight) > 0; });
    if (!(ns.toFiniteNumber(total) > 0) || safeRows.length === 0) return result;

    var totalWeight = safeRows.reduce(function (acc, row) {
      return acc + ns.toFiniteNumber(row.weight);
    }, 0);
    if (!(totalWeight > 0)) return result;

    var allocated = 0;
    safeRows.forEach(function (row, index) {
      var raw = index === safeRows.length - 1
        ? total - allocated
        : ns.round2((ns.toFiniteNumber(total) * ns.toFiniteNumber(row.weight)) / totalWeight);
      var value = ns.round2(raw);
      allocated = ns.round2(allocated + value);
      result[row[keyName]] = value;
    });
    return result;
  }

  function stageState(percent, hasBase, remaining, done, terminalAtFull) {
    if (terminalAtFull && done >= hasBase && hasBase > 0) return 'done';
    if (hasBase > 0 && remaining <= 0) return 'done';
    if (hasBase > 0 || done > 0 || percent > 0) return 'current';
    return 'future';
  }

  function computeViewModel(state) {
    var pedido = state.pedido || {};
    var trackingApi = ns.getTrackingApi();
    var trackingSummary = trackingApi && typeof trackingApi.buildPedidoAcompanhamentoParcial === 'function'
      ? trackingApi.buildPedidoAcompanhamentoParcial(pedido, state.itens, state.parciais, { forCliente: false })
      : null;

    var totalPedido = sumPedidoMetros(state);
    var uniquePedidoItemByModelo = buildUniquePedidoItemByModelo(state);
    var opById = {};
    var opItemsFlat = [];
    var opSummaries = [];

    sortOpsForDisplay(state.ops).forEach(function (op) {
      opById[op.id] = op;
    });

    state.ops.forEach(function (op) {
      var totalTarget = 0;
      var doneTarget = 0;
      var itemNamesMap = {};
      var deliveryStage = deliveryStageForOp(op);
      var relatedEntregas = [];
      var entregaIdsSeen = {};

      (op.op_itens || []).forEach(function (opItem) {
        opItemsFlat.push({ op: op, opItem: opItem });
        totalTarget += targetMetersForOpItem(opItem);
        var modelo = state.modelosById[opItem.modelo_id];
        if (modelo && modelo.nome) itemNamesMap[modelo.nome] = true;
      });

      state.entregaItens.forEach(function (ei) {
        if (ei.op_id !== op.id || ei.defeito) return;
        var entrega = state.entregasById[ei.entrega_id];
        if (!entrega || entrega.etapa !== deliveryStage) return;
        doneTarget += ns.toFiniteNumber(ei.metros_entregues);
        if (!entregaIdsSeen[entrega.id]) {
          entregaIdsSeen[entrega.id] = true;
          relatedEntregas.push(entrega);
        }
      });

      totalTarget = ns.round2(totalTarget);
      doneTarget = ns.round2(doneTarget);
      var remaining = ns.round2(Math.max(totalTarget - doneTarget, 0));
      var modelNames = Object.keys(itemNamesMap);
      var progress = totalTarget > 0
        ? ns.clampPercent((doneTarget / totalTarget) * 100)
        : 0;

      var statusTone = {
        simulada: { bg: '#f1f3f6', text: '#5b6472', dot: '#9aa2af', label: 'Simulada' },
        aberta: { bg: '#eaf1fd', text: '#2563eb', dot: '#2563eb', label: 'Aberta' },
        em_producao: { bg: '#fff4e6', text: '#c2610c', dot: '#e07b39', label: 'Em producao' },
        finalizada: { bg: '#e6f4ec', text: '#18794a', dot: '#18794a', label: 'Finalizada' },
      }[op.status] || { bg: '#f1f3f6', text: '#5b6472', dot: '#9aa2af', label: ns.fmtTextoOuEmpty(op.status, 'Status') };

      var docBanner;
      if (stageKeyForOp(op) === 'tecelagem') {
        docBanner = doneTarget > 0
          ? { tone: 'warning', text: 'Romaneio tecelagem -> acabamento pendente' }
          : { tone: 'neutral', text: 'Sem movimentacao para acabamento registrada ainda' };
      } else {
        docBanner = doneTarget > 0
          ? { tone: 'danger', text: 'NF de expedicao pendente' }
          : { tone: 'neutral', text: 'Sem saida para expedicao registrada ainda' };
      }

      opSummaries.push({
        id: op.id,
        numero: op.numero,
        ano: op.ano,
        label: opLabel(op),
        tipo: op.tipo,
        stageKey: stageKeyForOp(op),
        stageLabel: stageLabelForOp(op),
        status: op.status,
        statusTone: statusTone,
        target: totalTarget,
        done: doneTarget,
        remaining: remaining,
        progress: progress,
        modelNames: modelNames,
        relatedEntregas: relatedEntregas,
        origemOp: op.origem_op_id ? opById[op.origem_op_id] || null : null,
        op: op,
        docBanner: docBanner,
      });
    });

    var linkedOpCount = opSummaries.length;
    var tecelagemSummaries = opSummaries.filter(function (row) { return row.stageKey === 'tecelagem'; });
    var acabamentoSummaries = opSummaries.filter(function (row) { return row.stageKey === 'acabamento'; });

    var emTecelagem = ns.round2(tecelagemSummaries.reduce(function (acc, row) { return acc + row.remaining; }, 0));
    var emAcabamento = ns.round2(acabamentoSummaries.reduce(function (acc, row) { return acc + row.remaining; }, 0));
    var finishedLatex = ns.round2(acabamentoSummaries.reduce(function (acc, row) { return acc + row.done; }, 0));

    var deliveredExactTotal = trackingSummary && trackingSummary.totais
      ? ns.toFiniteNumber(trackingSummary.totais.entregue)
      : 0;
    if (!(deliveredExactTotal > 0) && (pedido.status === 'entregue' || (trackingSummary && trackingSummary.statusVisual === 'concluido'))) {
      deliveredExactTotal = totalPedido;
    }
    deliveredExactTotal = ns.round2(deliveredExactTotal);

    var prontoExpedicao = ns.round2(Math.max(finishedLatex - deliveredExactTotal, 0));

    var tecMeta = ns.round2(tecelagemSummaries.reduce(function (acc, row) { return acc + row.target; }, 0));
    var tecDone = ns.round2(tecelagemSummaries.reduce(function (acc, row) { return acc + row.done; }, 0));
    var acabMeta = ns.round2(acabamentoSummaries.reduce(function (acc, row) { return acc + row.target; }, 0));
    var acabDone = ns.round2(acabamentoSummaries.reduce(function (acc, row) { return acc + row.done; }, 0));

    var tecOpIds = tecelagemSummaries.map(function (row) { return row.id; });
    var insumoOrdens = state.ordensFio.filter(function (ordem) {
      return tecOpIds.indexOf(ordem.op_id) !== -1;
    });
    var insumoPedidoKg = ns.round2(insumoOrdens.reduce(function (acc, ordem) {
      return acc + ns.toFiniteNumber(ordem.kg_pedido);
    }, 0));
    var insumoRecebidoKg = ns.round2(insumoOrdens.reduce(function (acc, ordem) {
      return acc + ns.toFiniteNumber(ordem.kg_recebido);
    }, 0));
    var insumoPercent = insumoPedidoKg > 0
      ? ns.clampPercent((insumoRecebidoKg / insumoPedidoKg) * 100)
      : 0;

    var partialMeta = collectPartialMeta(state);
    var itemMetricsById = {};
    var fallbackDeliveredByItem = {};

    if (!partialMeta.anyDeliveredBreakdown && deliveredExactTotal > 0) {
      var fallbackRows = state.itens.map(function (item) {
        var finishedByItem = 0;
        opItemsFlat.forEach(function (row) {
          if ((row.opItem.pedido_item_id || (uniquePedidoItemByModelo[row.opItem.modelo_id] && uniquePedidoItemByModelo[row.opItem.modelo_id].id)) !== item.id) return;
          if (stageKeyForOp(row.op) !== 'acabamento') return;
          state.entregaItens.forEach(function (ei) {
            if (ei.op_item_id !== row.opItem.id || ei.defeito) return;
            var entrega = state.entregasById[ei.entrega_id];
            if (entrega && entrega.etapa === 'latex') {
              finishedByItem += ns.toFiniteNumber(ei.metros_entregues);
            }
          });
        });
        return {
          itemId: item.id,
          weight: finishedByItem > 0 ? finishedByItem : ns.toFiniteNumber(item.metros),
        };
      });
      fallbackDeliveredByItem = allocateByWeight(deliveredExactTotal, fallbackRows, 'itemId');
    }

    state.itens.forEach(function (item) {
      var linkedOpLabels = {};
      var tecTotal = 0;
      var tecDoneItem = 0;
      var acabTotal = 0;
      var acabDoneItem = 0;

      opItemsFlat.forEach(function (row) {
        var resolvedPedidoItemId = row.opItem.pedido_item_id
          || (uniquePedidoItemByModelo[row.opItem.modelo_id] && uniquePedidoItemByModelo[row.opItem.modelo_id].id)
          || null;
        if (resolvedPedidoItemId !== item.id) return;

        linkedOpLabels[row.op.id] = row.op;

        if (stageKeyForOp(row.op) === 'tecelagem') {
          tecTotal += targetMetersForOpItem(row.opItem);
        } else {
          acabTotal += targetMetersForOpItem(row.opItem);
        }

        state.entregaItens.forEach(function (ei) {
          if (ei.op_item_id !== row.opItem.id || ei.defeito) return;
          var entrega = state.entregasById[ei.entrega_id];
          if (!entrega) return;
          if (stageKeyForOp(row.op) === 'tecelagem' && entrega.etapa === 'cima') {
            tecDoneItem += ns.toFiniteNumber(ei.metros_entregues);
          }
          if (stageKeyForOp(row.op) === 'acabamento' && entrega.etapa === 'latex') {
            acabDoneItem += ns.toFiniteNumber(ei.metros_entregues);
          }
        });
      });

      tecTotal = ns.round2(tecTotal);
      tecDoneItem = ns.round2(tecDoneItem);
      acabTotal = ns.round2(acabTotal);
      acabDoneItem = ns.round2(acabDoneItem);

      var deliveredItem = partialMeta.anyDeliveredBreakdown
        ? ns.toFiniteNumber(partialMeta.deliveredByItem[item.id])
        : ns.toFiniteNumber(fallbackDeliveredByItem[item.id]);
      deliveredItem = ns.round2(deliveredItem);

      var readyItem = partialMeta.anyReadyBreakdown
        ? ns.round2(ns.toFiniteNumber(partialMeta.readyByItem[item.id]))
        : ns.round2(Math.max(acabDoneItem - deliveredItem, 0));

      var relatedOps = sortOpsForDisplay(Object.keys(linkedOpLabels).map(function (opId) {
        return linkedOpLabels[opId];
      }));

      itemMetricsById[item.id] = {
        tecelagem: ns.round2(Math.max(tecTotal - tecDoneItem, 0)),
        acabamento: ns.round2(Math.max(acabTotal - acabDoneItem, 0)),
        prontos: readyItem,
        entregues: deliveredItem,
        relatedOps: relatedOps,
        relatedOpsLabel: relatedOps.length
          ? relatedOps.map(function (op) { return opLabel(op); }).join(' -> ')
          : '-',
      };
    });

    var documentRowsPedido = [
      {
        label: (pedido.referencia_cliente ? 'Pedido comercial · ' + pedido.referencia_cliente : 'Pedido comercial do cliente'),
        status: 'pendente',
        meta: 'Vinculo documental comercial ainda nao consolidado nesta fase.',
      },
      {
        label: 'Aprovacao comercial',
        status: 'pendente',
        meta: 'A centralizacao de anexos do pedido entra na fase documental.',
      },
    ];

    var documentRowsOperacionais = [];
    if (insumoOrdens.length > 0) {
      documentRowsOperacionais.push({
        label: 'Documentos de insumos',
        status: 'pendente',
        meta: 'Ordens de fio vinculadas as OPs de tecelagem.',
      });
    }
    opSummaries.forEach(function (summary) {
      if (summary.stageKey === 'tecelagem') {
        documentRowsOperacionais.push({
          label: 'Movimento: Tecelagem -> Acabamento · ' + summary.label,
          status: 'pendente',
          meta: summary.done > 0 ? 'Romaneio/NF ainda nao consolidados na tela de pedido.' : 'Sem transferencia registrada ainda.',
        });
      } else {
        documentRowsOperacionais.push({
          label: 'Movimento: Acabamento -> Expedicao · ' + summary.label,
          status: 'pendente',
          meta: summary.done > 0 ? 'Documentacao de saida ainda nao consolidada.' : 'Sem saida para expedicao registrada ainda.',
        });
      }
    });
    if (deliveredExactTotal > 0 || pedido.status === 'entregue') {
      documentRowsOperacionais.push({
        label: 'Comprovante de entrega',
        status: 'pendente',
        meta: 'Entrega ao cliente ainda sem documento consolidado nesta fase.',
      });
    }

    var pendingDocs = documentRowsPedido.concat(documentRowsOperacionais).filter(function (row) {
      return row.status !== 'anexado';
    }).length;

    var stepper = [
      {
        key: 'insumos',
        label: 'INSUMOS',
        color: '#2563eb',
        percent: insumoPercent,
        state: stageState(insumoPercent, insumoPedidoKg, Math.max(insumoPedidoKg - insumoRecebidoKg, 0), insumoRecebidoKg, false),
        sublabel: insumoPercent >= 100 ? 'concluido' : (insumoPedidoKg > 0 ? ns.fmtKg(insumoRecebidoKg) : 'aguardando'),
        transfer: {
          title: 'Registrar recebimento de insumos',
          origem: 'Insumos',
          destino: 'Tecelagem',
          detalhe: linkedOpCount ? 'O recebimento de fio continua canonico na OP de tecelagem vinculada.' : 'Vincule uma OP ao pedido para iniciar o fluxo produtivo.',
          op: tecelagemSummaries.length ? tecelagemSummaries[0].op : null,
          docs: 'NF de compra e romaneio',
        },
      },
      {
        key: 'tecelagem',
        label: 'TECELAGEM',
        color: '#2563eb',
        percent: tecMeta > 0 ? ns.clampPercent((tecDone / tecMeta) * 100) : 0,
        state: stageState(tecMeta > 0 ? ns.clampPercent((tecDone / tecMeta) * 100) : 0, tecMeta, emTecelagem, tecDone, false),
        sublabel: emTecelagem > 0 ? ns.fmtMetros(emTecelagem) : (tecMeta > 0 ? 'concluido' : 'aguardando'),
        transfer: {
          title: 'Movimentar Tecelagem -> Acabamento',
          origem: 'Tecelagem',
          destino: 'Acabamento',
          detalhe: tecelagemSummaries.length ? 'A mesma movimentacao da OP de origem deve ser usada aqui.' : 'Nenhuma OP de tecelagem vinculada.',
          op: tecelagemSummaries.length ? tecelagemSummaries[0].op : null,
          docs: 'Romaneio e NF',
        },
      },
      {
        key: 'acabamento',
        label: 'ACABAMENTO',
        color: '#e07b39',
        percent: acabMeta > 0 ? ns.clampPercent((acabDone / acabMeta) * 100) : 0,
        state: stageState(acabMeta > 0 ? ns.clampPercent((acabDone / acabMeta) * 100) : 0, acabMeta, emAcabamento, acabDone, false),
        sublabel: emAcabamento > 0 ? ns.fmtMetros(emAcabamento) : (acabMeta > 0 ? 'concluido' : 'aguardando'),
        transfer: {
          title: 'Movimentar Acabamento -> Expedicao',
          origem: 'Acabamento',
          destino: 'Expedicao',
          detalhe: acabamentoSummaries.length ? 'A finalizacao continua sendo registrada na OP de acabamento (latex).' : 'Nenhuma OP de acabamento vinculada.',
          op: acabamentoSummaries.length ? acabamentoSummaries[0].op : null,
          docs: 'NF de servico e romaneio',
        },
      },
      {
        key: 'expedicao',
        label: 'EXPEDICAO',
        color: '#2563eb',
        percent: totalPedido > 0 ? ns.clampPercent((prontoExpedicao / totalPedido) * 100) : 0,
        state: deliveredExactTotal >= totalPedido && totalPedido > 0
          ? 'done'
          : (prontoExpedicao > 0 ? 'current' : 'future'),
        sublabel: prontoExpedicao > 0 ? ns.fmtMetros(prontoExpedicao) : (deliveredExactTotal >= totalPedido && totalPedido > 0 ? 'concluido' : 'aguardando'),
        transfer: {
          title: 'Registrar saida para entrega',
          origem: 'Expedicao',
          destino: 'Entrega',
          detalhe: 'Expedicao e entrega ainda nao possuem movimentacao canonica dedicada no schema atual.',
          op: acabamentoSummaries.length ? acabamentoSummaries[0].op : null,
          docs: 'NF de expedicao',
        },
      },
      {
        key: 'entrega',
        label: 'ENTREGA',
        color: '#18794a',
        percent: totalPedido > 0 ? ns.clampPercent((deliveredExactTotal / totalPedido) * 100) : 0,
        state: deliveredExactTotal >= totalPedido && totalPedido > 0
          ? 'done'
          : (deliveredExactTotal > 0 ? 'current' : 'future'),
        sublabel: deliveredExactTotal > 0 ? ns.fmtMetros(deliveredExactTotal) : 'aguardando',
        transfer: null,
      },
    ];

    return {
      trackingApi: trackingApi,
      trackingSummary: trackingSummary,
      totalPedido: totalPedido,
      opSummaries: opSummaries,
      itemMetricsById: itemMetricsById,
      pendingDocs: pendingDocs,
      finishedLatex: finishedLatex,
      emTecelagem: emTecelagem,
      emAcabamento: emAcabamento,
      prontoExpedicao: prontoExpedicao,
      entregue: deliveredExactTotal,
      insumoPedidoKg: insumoPedidoKg,
      insumoRecebidoKg: insumoRecebidoKg,
      stepper: stepper,
      documentRowsPedido: documentRowsPedido,
      documentRowsOperacionais: documentRowsOperacionais,
      linkedOpCount: linkedOpCount,
    };
  }

  ns.opLabel = opLabel;
  ns.stageKeyForOp = stageKeyForOp;
  ns.stageLabelForOp = stageLabelForOp;
  ns.deliveryStageForOp = deliveryStageForOp;
  ns.targetMetersForOpItem = targetMetersForOpItem;
  ns.sortOpsForDisplay = sortOpsForDisplay;
  ns.computeViewModel = computeViewModel;
})(window);
