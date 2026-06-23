// =====================================================================
// === SCREENS: ENTREGA WRITES (Seam A) ================================
// Helpers de escrita de entrega. Esta fase contém:
//   - excluirEntrega (Fase 2.1 do DIAG)
//   - salvarEntregaLatex (Fase 2.2 do DIAG)
//   - atualizarEntregaLatex (Fase 2.2 do DIAG)
//
// Os demais writes (salvarEntregaCima, atualizarEntregaCima)
// permanecem inline por decisão arquitetural (Fase 2.3 do DIAG,
// risco alto por causa do rpc gerar_op_latex).
//
// Carregar via <script src="js/screens/entrega-writes.js"></script>
// no <head>, DEPOIS de js/screens/entrega-form.js e ANTES do
// script inline principal. As telas inline (screenFornecedorEntregas,
// screenFornecedorLatex, screenNovaOP, renderOPLatexAdmin)
// referenciam `excluirEntrega`, `salvarEntregaLatex` e
// `atualizarEntregaLatex` como identificadores bare, que são
// resolvidos como globais do <script> (window).
//
// Dependências resolvidas em tempo de chamada (não no load):
//   - window.supa            (js/supabase-client.js)
//   - window.toast           (js/ui.js)
//   - window.confirmDialog   (js/ui.js)
//
// Compatibilidade: window.excluirEntrega, window.salvarEntregaLatex
// e window.atualizarEntregaLatex seguem disponíveis exatamente
// como antes para o inline (call-sites bare preservados).
// =====================================================================

(function (window) {
  'use strict';

  // -------------------------------------------------------------------
  // Excluir entrega: usa o padrao de callback do confirmDialog (que so dispara
  // onConfirm em caso afirmativo). onSuccess() roda apos delete bem-sucedido.
  function excluirEntrega(entregaId, onSuccess) {
    window.confirmDialog({
      title: 'Excluir entrega',
      message: 'Esta ação remove a entrega e todos os seus itens. Continuar?',
      confirmLabel: 'Excluir',
      onConfirm: async () => {
        const r = await window.supa.from('entregas').delete().eq('id', entregaId);
        if (r.error) { window.toast('Erro ao excluir entrega', 'error'); console.error(r.error); return; }
        window.toast('Entrega excluída', 'success');
        if (onSuccess) onSuccess();
      },
    });
  }

  // -------------------------------------------------------------------
  // Persistência dos recebimentos de látex (Fase 5b). Espelha as de
  // tecelagem, mas etapa='latex', sem destino e sem gerar OP (a OP
  // de látex já existe).
  async function salvarEntregaLatex({ fornecedorId, opId, payload }) {
    if (payload.linhas.length === 0) { window.toast('Adicione ao menos 1 item com metros recebidos', 'error'); return false; }
    const ins = await window.supa.from('entregas').insert({
      fornecedor_id: fornecedorId, etapa: 'latex', data: payload.data, observacao: payload.observacao,
    }).select().single();
    if (ins.error) { window.toast('Erro ao gravar recebimento', 'error'); console.error(ins.error); return false; }
    const entregaId = ins.data.id;
    const itens = payload.linhas.map(l => ({ entrega_id: entregaId, op_id: opId, ...l }));
    const insItens = await window.supa.from('entrega_itens').insert(itens);
    if (insItens.error) {
      await window.supa.from('entregas').delete().eq('id', entregaId);
      window.toast('Erro ao gravar itens do recebimento', 'error'); console.error(insItens.error); return false;
    }
    window.toast('Recebimento registrado', 'success');
    return true;
  }

  async function atualizarEntregaLatex({ entregaId, opId, payload }) {
    if (payload.linhas.length === 0) { window.toast('Adicione ao menos 1 item com metros recebidos', 'error'); return false; }
    const upd = await window.supa.from('entregas').update({
      data: payload.data, observacao: payload.observacao,
    }).eq('id', entregaId);
    if (upd.error) { window.toast('Erro ao atualizar recebimento', 'error'); console.error(upd.error); return false; }
    await window.supa.from('entrega_itens').delete().eq('entrega_id', entregaId);
    const itens = payload.linhas.map(l => ({ entrega_id: entregaId, op_id: opId, ...l }));
    const insItens = await window.supa.from('entrega_itens').insert(itens);
    // MVP: se a reinsercao falhar aqui, a entrega fica sem itens.
    // Como o app eh single-admin e baixo volume, aceitamos o risco
    // e a correcao manual via Supabase.
    if (insItens.error) { window.toast('Erro ao regravar itens do recebimento', 'error'); console.error(insItens.error); return false; }
    window.toast('Recebimento atualizado', 'success');
    return true;
  }

  // -------------------------------------------------------------------
  // Namespace principal
  // -------------------------------------------------------------------

  window.RAVATEX_ENTREGA_WRITES = window.RAVATEX_ENTREGA_WRITES || {};

  window.RAVATEX_ENTREGA_WRITES.excluirEntrega = excluirEntrega;
  window.RAVATEX_ENTREGA_WRITES.salvarEntregaLatex = salvarEntregaLatex;
  window.RAVATEX_ENTREGA_WRITES.atualizarEntregaLatex = atualizarEntregaLatex;

  // Compatibilidade com o inline (call-sites bare preservados).
  window.excluirEntrega = excluirEntrega;
  window.salvarEntregaLatex = salvarEntregaLatex;
  window.atualizarEntregaLatex = atualizarEntregaLatex;
})(window);
