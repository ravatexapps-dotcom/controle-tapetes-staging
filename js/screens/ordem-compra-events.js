// =====================================================================
// === SCREENS: ORDEM DE COMPRA — EVENTS (write handlers) ==============
// Phase: REFUND-B1 (spec §R.22). Write handlers for the native
// purchase-order administration screens. Every write goes through a
// db/68 SECURITY DEFINER RPC and checks BOTH res.error (transport, incl.
// PGRST202) AND res.data.ok !== true (business rejection) before
// declaring success — the 275ede2 lesson (§20 double-fidelity). No
// emission handler exists here: emission is installed-but-inactive in
// REFUND-B1 (§R.22.5/§R.22.6) and the UI never calls emitir_ordem_compra.
//
// definir_item_ordem_compra receives the ABSOLUTE item quantity
// (§R.22.3) — the kg field is the desired total, never a delta.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.ordemCompra = window.RAVATEX_SCREENS.ordemCompra || {};

  var el = window.el;

  // Calls an RPC; returns the JSON payload on business success, or null
  // (with a toast) on transport error / business rejection.
  async function rpcWrite(name, params, successMsg) {
    var res = await window.supa.rpc(name, params);
    if (res && res.error) {
      window.toast('Erro de comunicação com o servidor.', 'error');
      console.error(name, res.error);
      return null;
    }
    if (!res || !res.data || res.data.ok !== true) {
      window.toast((res && res.data && res.data.erro) || 'Operação recusada.', 'error');
      console.error(name, res && res.data);
      return null;
    }
    if (successMsg) window.toast(successMsg, 'success');
    return res.data;
  }
  ns.rpcWrite = rpcWrite;

  // Builds an item form body. When pedido/fornecedor are fixed (adding to
  // an existing draft) their selects are omitted. When `fixedMaterial`/
  // `fixedColor` are provided (editing an item's quantity) only kg is
  // editable. Returns { body, read } where read() validates and returns
  // the definir_item_ordem_compra params, or null (with a toast).
  function buildItemForm(state, opts) {
    opts = opts || {};
    var body = el('div', {});

    var pedidoSel = null;
    if (!opts.fixedPedidoId) {
      pedidoSel = window.selectInput({
        options: (state.pedidos || []).map(function (p) { return { value: p.id, label: '#' + p.numero }; }),
        placeholder: 'Selecione o pedido...',
      });
      body.appendChild(window.formField({ label: 'Pedido', input: pedidoSel }));
    }

    var fornSel = null;
    if (!opts.fixedFornecedorId) {
      fornSel = window.selectInput({
        options: (state.fornecedores || []).map(function (f) { return { value: f.id, label: f.nome }; }),
        placeholder: 'Selecione o fornecedor...',
      });
      body.appendChild(window.formField({ label: 'Fornecedor', input: fornSel }));
    }

    var matSel = null;
    var colorSlot = el('div', {});
    var corSel = null;
    var poliSel = null;

    function renderColor(material) {
      colorSlot.replaceChildren();
      corSel = null; poliSel = null;
      if (material === 'algodao') {
        corSel = window.selectInput({
          options: (state.cores || []).map(function (c) { return { value: c.id, label: c.nome }; }),
          placeholder: 'Selecione a cor...',
        });
        colorSlot.appendChild(window.formField({ label: 'Cor (algodão)', input: corSel }));
      } else if (material === 'poliester') {
        poliSel = window.selectInput({
          options: [{ value: 'PRETO', label: 'PRETO' }, { value: 'BRANCO', label: 'BRANCO' }],
          placeholder: 'Selecione a cor...',
        });
        colorSlot.appendChild(window.formField({ label: 'Cor (poliéster)', input: poliSel }));
      }
    }

    if (opts.fixedMaterial) {
      // editing quantity: material + color are fixed (shown read-only)
      body.appendChild(window.formField({
        label: 'Fio',
        input: el('div', { class: 'text-sm text-gray-700 py-2' }, ns.fioLabel({
          material: opts.fixedMaterial, cor_nome: opts.fixedCorNome, cor_poliester: opts.fixedCorPoliester,
        })),
      }));
    } else {
      matSel = window.selectInput({
        options: [{ value: 'algodao', label: 'Algodão' }, { value: 'poliester', label: 'Poliéster' }],
        placeholder: 'Selecione o material...',
      });
      matSel.addEventListener('change', function () { renderColor(matSel.value); });
      body.appendChild(window.formField({ label: 'Material', input: matSel }));
      body.appendChild(colorSlot);
    }

    var kgInput = window.textInput({ type: 'number', step: '0.001', value: opts.kg != null ? String(opts.kg) : '' });
    body.appendChild(window.formField({ label: 'Kg pedido (quantidade total)', input: kgInput }));

    function read() {
      var pedido_id = opts.fixedPedidoId || (pedidoSel && pedidoSel.value) || null;
      var fornecedor_id = opts.fixedFornecedorId || (fornSel && fornSel.value ? Number(fornSel.value) : null);
      var material = opts.fixedMaterial || (matSel && matSel.value) || null;
      var cor_id = null, cor_poliester = null;
      if (material === 'algodao') {
        cor_id = opts.fixedCorId || (corSel && corSel.value ? Number(corSel.value) : null);
      } else if (material === 'poliester') {
        cor_poliester = opts.fixedCorPoliester || (poliSel && poliSel.value) || null;
      }
      var kg = Number(kgInput.value);

      if (!pedido_id) { window.toast('Selecione o pedido.', 'error'); return null; }
      if (!fornecedor_id) { window.toast('Selecione o fornecedor.', 'error'); return null; }
      if (material !== 'algodao' && material !== 'poliester') { window.toast('Selecione o material.', 'error'); return null; }
      if (material === 'algodao' && !cor_id) { window.toast('Selecione a cor.', 'error'); return null; }
      if (material === 'poliester' && !cor_poliester) { window.toast('Selecione a cor.', 'error'); return null; }
      if (!(kg > 0)) { window.toast('Informe uma quantidade maior que zero.', 'error'); return null; }

      return {
        p_pedido_id: pedido_id,
        p_fornecedor_id: fornecedor_id,
        p_material: material,
        p_cor_id: cor_id,
        p_cor_poliester: cor_poliester,
        p_kg_pedido: kg,
      };
    }

    return { body: body, read: read };
  }

  function allocationNeedLabel(need) {
    var origin = need.origem_tipo === 'op'
      ? 'OP ' + (need.op_numero != null ? need.op_numero : need.op_id)
      : 'Pedido';
    return origin + ' · restante ' + Number(need.kg_restante || 0) + ' kg';
  }

  function buildAllocationForm(item) {
    var needs = item.necessidades_compativeis || [];
    if (!needs.length) return null;

    var body = el('div', {});
    body.appendChild(el('p', { class: 'text-sm text-gray-600 mb-3' },
      'Defina a quantidade total desta alocação. Repetir a mesma necessidade e OP atualiza o valor absoluto.'));

    var needSel = window.selectInput({
      options: needs.map(function (need) {
        return { value: String(need.necessidade_id), label: allocationNeedLabel(need) };
      }),
      placeholder: 'Selecione a necessidade...',
    });
    body.appendChild(window.formField({ label: 'Necessidade', input: needSel }));

    var opInput = window.textInput({ type: 'number', step: '1', value: '' });
    var opField = window.formField({ label: 'OP de atribuição (ID)', input: opInput });
    body.appendChild(opField);

    var kgInput = window.textInput({ type: 'number', step: '0.001', value: '' });
    body.appendChild(window.formField({ label: 'Kg alocado (quantidade total)', input: kgInput }));

    function selectedNeed() {
      return needs.find(function (need) { return String(need.necessidade_id) === String(needSel.value); }) || null;
    }

    function syncOriginField() {
      var need = selectedNeed();
      var isCottonNeed = need && need.origem_tipo === 'op';
      opInput.disabled = Boolean(isCottonNeed);
      opInput.value = isCottonNeed ? String(need.op_id) : '';
      opField.style.display = isCottonNeed ? 'none' : '';
    }
    needSel.addEventListener('change', syncOriginField);
    syncOriginField();

    function read() {
      var need = selectedNeed();
      var kg = Number(kgInput.value);
      if (!need) { window.toast('Selecione a necessidade.', 'error'); return null; }
      if (!(kg > 0)) { window.toast('Informe uma quantidade maior que zero.', 'error'); return null; }

      var opId = need.origem_tipo === 'op' ? Number(need.op_id) : Number(opInput.value);
      if (!Number.isInteger(opId) || opId <= 0) {
        window.toast('Informe uma OP válida para atribuição.', 'error');
        return null;
      }
      return { p_necessidade_id: Number(need.necessidade_id), p_op_id: opId, p_kg: kg };
    }

    return { body: body, read: read };
  }
  ns.buildItemForm = buildItemForm;

  ns.createEvents = function (cfg) {
    cfg = cfg || {};
    var state = cfg.state;
    var reload = cfg.reload || function () {};

    return {
      // List: create a native draft (or accumulate into the active one) and
      // navigate to its detail.
      novaOrdem: function () {
        var form = buildItemForm(state, {});
        window.modal({
          title: 'Nova ordem de compra',
          body: form.body,
          saveLabel: 'Criar',
          onSave: async function () {
            var params = form.read();
            if (!params) return false;
            var data = await rpcWrite('definir_item_ordem_compra', params, 'Item definido.');
            if (!data) return false;
            window.navigate('#/ordens-compra/' + data.ordem_compra_id);
          },
        });
      },

      // Detail: add an item to the current draft (pedido/supplier fixed).
      adicionarItem: function (ordem) {
        var form = buildItemForm(state, { fixedPedidoId: ordem.pedido_id, fixedFornecedorId: ordem.fornecedor_id });
        window.modal({
          title: 'Adicionar item',
          body: form.body,
          saveLabel: 'Salvar',
          onSave: async function () {
            var params = form.read();
            if (!params) return false;
            var data = await rpcWrite('definir_item_ordem_compra', params, 'Item adicionado.');
            if (!data) return false;
            await reload();
          },
        });
      },

      // Detail: change an item's absolute quantity (material/color fixed).
      editarItem: function (ordem, item) {
        var form = buildItemForm(state, {
          fixedPedidoId: ordem.pedido_id, fixedFornecedorId: ordem.fornecedor_id,
          fixedMaterial: item.material, fixedCorId: item.cor_id, fixedCorNome: item.cor_nome,
          fixedCorPoliester: item.cor_poliester, kg: item.kg_pedido,
        });
        window.modal({
          title: 'Editar quantidade',
          body: form.body,
          saveLabel: 'Salvar',
          onSave: async function () {
            var params = form.read();
            if (!params) return false;
            var data = await rpcWrite('definir_item_ordem_compra', params, 'Quantidade atualizada.');
            if (!data) return false;
            await reload();
          },
        });
      },

      removerItem: function (ordem, item) {
        window.confirmDialog({
          title: 'Remover item',
          message: 'Remover ' + ns.fioLabel(item) + ' deste rascunho?',
          confirmLabel: 'Remover',
          onConfirm: async function () {
            var data = await rpcWrite('remover_item_ordem_compra', { p_item_id: item.item_id }, 'Item removido.');
            if (data) await reload();
          },
        });
      },

      cancelar: function (ordem) {
        window.confirmDialog({
          title: 'Cancelar ordem',
          message: 'Cancelar esta ordem de compra? Os itens são preservados, mas a ordem fica terminal.',
          confirmLabel: 'Cancelar ordem',
          onConfirm: async function () {
            var data = await rpcWrite('cancelar_ordem_compra', { p_ordem_id: ordem.ordem_id }, 'Ordem cancelada.');
            if (data) await reload();
          },
        });
      },

      sincronizarNecessidades: async function (pedidoId) {
        var data = await rpcWrite('sincronizar_necessidades_compra_fio', {
          p_pedido_id: pedidoId,
        }, 'Necessidades sincronizadas.');
        if (data) await reload();
      },

      abrirDistribuir: function (item) {
        var form = buildAllocationForm(item);
        if (!form) {
          window.toast('Nenhuma necessidade compatível disponível para este item.', 'error');
          return;
        }
        window.modal({
          title: 'Distribuir necessidade',
          body: form.body,
          saveLabel: 'Salvar distribuição',
          onSave: async function () {
            var params = form.read();
            if (!params) return false;
            params.p_item_id = item.item_id;
            var data = await rpcWrite('alocar_necessidade_compra_fio', params, 'Distribuição atualizada.');
            if (!data) return false;
            await reload();
          },
        });
      },

      removerAlocacao: function (alocacaoId) {
        window.confirmDialog({
          title: 'Remover alocação',
          message: 'Remover esta alocação da ordem de compra?',
          confirmLabel: 'Remover alocação',
          onConfirm: async function () {
            var data = await rpcWrite('remover_alocacao_compra_fio', {
              p_alocacao_id: alocacaoId,
            }, 'Alocação removida.');
            if (data) await reload();
          },
        });
      },
    };
  };
})(window);
