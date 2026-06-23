// =====================================================================
// === SCREENS: OP RECALCULO PURE HELPERS + WRITE (Seam A/B) ============
// Helpers puros de cálculo de recalculo de OP, extraídos do
// <script> inline de index.html, de dentro de screenNovaOP.
// Concentra:
//
//   - maxMetrosItem(item, modelosById, parametrosByLargura, ordens)
//   - normalizarChaveSaldo(tipo, corId, corPoliester)
//   - aplicarRecalculoOP({ opId, resultado, modo, ordens })
//
// Carregar via <script src="js/screens/op-recalculo.js"></script>
// no <head>, DEPOIS de js/screens/painel.js e ANTES de jspdf +
// script inline principal.
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - window.larguraKey (js/calculo-op.js) — usado por maxMetrosItem
//   - window.supa (js/supabase-client.js) — usado por aplicarRecalculoOP
//
// NÃO depende de: window.toast, window.modal, window.confirmDialog,
// window.CURRENT_USER, window.navigate, window.saving.
//
// Compatibilidade: window.maxMetrosItem, window.normalizarChaveSaldo
// e window.aplicarRecalculoOP seguem disponíveis para os call-sites
// do inline (prefixados com `window.`).
// =====================================================================

(function (window) {
  'use strict';

  function maxMetrosItem(item, modelosById, parametrosByLargura, ordens) {
    const modelo = modelosById[item.modelo_id];
    const p = parametrosByLargura[window.larguraKey(modelo.largura)];
    const rAlg = p.algodao_por_ml * p.valor_x;
    const rPol = p.poliester_por_ml * p.valor_x;
    let cap = Infinity;
    for (const cor of [modelo.cor_1, modelo.cor_2]) {
      const ord = ordens.find(o => o.tipo === 'algodao' && o.cor_id === cor.id);
      if (ord && rAlg > 0) cap = Math.min(cap, Number(ord.kg_recebido) / rAlg);
    }
    for (const corP of ['PRETO', 'BRANCO']) {
      const ord = ordens.find(o => o.tipo === 'poliester' && o.cor_poliester === corP);
      if (ord && rPol > 0) cap = Math.min(cap, Number(ord.kg_recebido) / rPol);
    }
    return Number.isFinite(cap) ? Math.floor(cap) : 0;
  }

  function normalizarChaveSaldo(tipo, corId, corPoliester) {
    if (tipo === 'poliester') {
      return {
        is: { cor_id: null },
        eq: { tipo, cor_poliester: corPoliester },
      };
    }
    return {
      eq: { tipo, cor_id: corId },
    };
  }

  // Aplica o recalculo de OP executando todos os writes
  // (op_itens.update + saldo_fios_op.insert + saldo_fios
  // select/update/insert + ops.update status). Retorna um envelope
  // com error/step/partial para o caller decidir sobre toast,
  // navigate e saving.
  //
  // NÃO chama toast, navigate, saving, ou DOM. NÃO acessa estado
  // de closure de screenNovaOP — recebe tudo por argumento e usa
  // window.supa internamente.
  async function aplicarRecalculoOP({ opId, resultado, modo, ordens }) {
    const supa = window.supa;
    const round3 = (n) => Math.round(n * 1000) / 1000;

    // 1) grava metros_ajustados em cada op_item
    for (const it of resultado.itens) {
      const metros = modo === 'aceitar' ? it.metros_ajustados : it.metros_pedidos;
      const r = await supa.from('op_itens').update({ metros_ajustados: metros }).eq('id', it.op_item_id);
      if (r.error) {
        return { error: r.error, step: 'op_itens_update', partial: true };
      }
    }

    // 2) calcula as sobras conforme o modo
    const sobras = modo === 'aceitar'
      ? resultado.sobras
      : ordens.map((o) => {
          const kg = round3(Number(o.kg_recebido) - Number(o.kg_pedido));
          return kg > 0
            ? { ordem_id: o.id, tipo: o.tipo, cor_id: o.cor_id ?? null, cor_poliester: o.cor_poliester ?? null, kg_sobra: kg }
            : null;
        }).filter(Boolean);

    // 3) grava saldo por OP + atualiza o totalizador
    for (const s of sobras) {
      const insOp = await supa.from('saldo_fios_op').insert({
        op_id: opId, cor_id: s.cor_id, cor_poliester: s.cor_poliester, tipo: s.tipo, kg_sobra: s.kg_sobra,
      });
      if (insOp.error) {
        return { error: insOp.error, step: 'saldo_fios_op_insert', partial: true };
      }

      // totalizador saldo_fios: lê (filtrando por cor/tipo), soma e grava
      const chave = normalizarChaveSaldo(s.tipo, s.cor_id, s.cor_poliester);
      let sel = supa.from('saldo_fios').select('kg_total').eq('tipo', chave.eq.tipo);
      for (const [k, v] of Object.entries(chave.eq)) {
        if (k === 'tipo') continue; // já aplicado acima
        sel = sel.eq(k, v);
      }
      if (chave.is) {
        for (const [k, v] of Object.entries(chave.is)) {
          sel = sel.is(k, v);
        }
      }
      const cur = await sel.maybeSingle();
      if (cur.error) {
        return { error: cur.error, step: 'saldo_fios_select', partial: true };
      }
      const novoTotal = round3((cur.data ? Number(cur.data.kg_total) : 0) + s.kg_sobra);

      let saveTotal;
      if (cur.data) {
        let upd = supa.from('saldo_fios').update({ kg_total: novoTotal, atualizado_em: new Date().toISOString() }).eq('tipo', chave.eq.tipo);
        for (const [k, v] of Object.entries(chave.eq)) {
          if (k === 'tipo') continue;
          upd = upd.eq(k, v);
        }
        if (chave.is) {
          for (const [k, v] of Object.entries(chave.is)) {
            upd = upd.is(k, v);
          }
        }
        saveTotal = await upd;
      } else {
        saveTotal = await supa.from('saldo_fios').insert({
          cor_id: s.cor_id, cor_poliester: s.cor_poliester, tipo: s.tipo, kg_total: novoTotal,
        });
      }
      if (saveTotal.error) {
        return { error: saveTotal.error, step: cur.data ? 'saldo_fios_update' : 'saldo_fios_insert', partial: true };
      }
    }

    // 4) libera a produção
    const st = await supa.from('ops').update({ status: 'em_producao' }).eq('id', opId);
    if (st.error) {
      return { error: st.error, step: 'ops_update_status', partial: true };
    }

    return { error: null, step: 'ok', partial: false };
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.opRecalculo = {
    maxMetrosItem,
    normalizarChaveSaldo,
    aplicarRecalculoOP,
  };

  window.maxMetrosItem = maxMetrosItem;
  window.normalizarChaveSaldo = normalizarChaveSaldo;
  window.aplicarRecalculoOP = aplicarRecalculoOP;
})(window);
