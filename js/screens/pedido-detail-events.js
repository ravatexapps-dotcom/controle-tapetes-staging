// =====================================================================
// === SCREENS: PEDIDO DETAIL EVENTS ===================================
// Handlers e modais da tela de detalhe do pedido.
// =====================================================================

(function (window) {
  'use strict';

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  var ns = window.RAVATEX_SCREENS.pedidoDetail = window.RAVATEX_SCREENS.pedidoDetail || {};

  function createPedidoDetailEvents(ctx) {
    var pedidoId = ctx.pedidoId;
    var state = ctx.state;
    var reload = ctx.reload;
    var render = ctx.render;

    function navigateToPedidos() {
      window.navigate('#/pedidos');
    }

    function navigateToOp(opId) {
      window.navigate('#/ops/' + opId);
    }

    function navigateToNovaOp() {
      window.navigate('#/ops/nova?pedido_id=' + pedidoId);
    }

    function scrollToSection(id) {
      var node = document.getElementById(id);
      if (node && typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function buildTrackingAdmin() {
      if (typeof window.buildPedidoTrackingAdminCard !== 'function') return window.el('div', {});
      return window.buildPedidoTrackingAdminCard({
        pedido: state.pedido,
        onReload: async function () {
          ctx.setLoadingError(null);
          await reload();
          render();
        },
      });
    }

    function buildParciaisAdmin() {
      if (typeof window.buildPedidoParciaisAdminCard !== 'function') return window.el('div', {});
      return window.buildPedidoParciaisAdminCard({
        pedido: state.pedido,
        itens: state.itens,
        onReload: async function () {
          ctx.setLoadingError(null);
          await reload();
          render();
        },
      });
    }

    function placeholderButton(label, title) {
      return window.el('button', {
        type: 'button',
        style: 'display:inline-flex;align-items:center;gap:7px;background:#fff;color:#b6bdc8;border:1px solid #d8dce2;border-radius:4px;padding:9px 14px;font-weight:600;font-size:13.5px;font-family:inherit;cursor:not-allowed;',
        disabled: 'disabled',
        title: title || 'Em breve',
      }, label);
    }

    function buildEditItensButton() {
      var statusAtual = state.pedido ? state.pedido.status : null;
      var editavel = window.isPedidoEditavel
        ? window.isPedidoEditavel(statusAtual)
        : (statusAtual === 'rascunho' || statusAtual === 'recebido');
      if (editavel) {
        return window.el('button', {
          type: 'button',
          style: 'display:inline-flex;align-items:center;gap:7px;background:#fff;color:#2563eb;border:1px solid #2563eb;border-radius:4px;padding:7px 13px;font-weight:600;font-size:12.5px;font-family:inherit;cursor:pointer;',
          onclick: function () { window.navigate('#/pedidos/' + pedidoId + '/itens'); },
        }, 'Editar itens');
      }
      var motivo = 'Edicao de itens permitida apenas em status "Rascunho" ou "Recebido"';
      return placeholderButton('Editar itens', motivo);
    }

    function buildEditButton() {
      var statusAtual = state.pedido ? state.pedido.status : null;
      var editavel = window.isPedidoEditavel
        ? window.isPedidoEditavel(statusAtual)
        : (statusAtual === 'rascunho' || statusAtual === 'recebido');
      if (editavel) {
        return window.el('button', {
          type: 'button',
          style: 'display:inline-flex;align-items:center;gap:7px;background:#fff;color:#3f4757;border:1px solid #d8dce2;border-radius:4px;padding:9px 14px;font-weight:600;font-size:13.5px;font-family:inherit;cursor:pointer;',
          onclick: function () { openEditWarning('dados'); },
        }, ns.svgEl(ns.SVG_EDIT), 'Editar');
      }
      var motivo = 'Edicao permitida apenas em status "Rascunho" ou "Recebido"';
      return placeholderButton('Editar', motivo);
    }

    async function alterarStatus(novoStatus, btn) {
      if (!state.pedido) {
        window.toast('Pedido nao carregado.', 'error');
        return;
      }
      var statusAtual = state.pedido.status;
      if (!ns.canTransition(statusAtual, novoStatus)) {
        window.toast('Transicao nao permitida: ' + statusAtual + ' -> ' + novoStatus + '.', 'error');
        return;
      }

      var oldLabel = btn ? btn.textContent : null;
      var oldDisabled = btn ? btn.disabled : false;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Salvando...';
      }

      var apply = async function () {
        var res = await window.supa
          .from('pedidos')
          .update({ status: novoStatus })
          .eq('id', pedidoId);

        if (res.error) {
          window.toast('Erro ao atualizar status: ' + (res.error.message || 'desconhecido'), 'error');
          console.error('pedido-detail: erro ao atualizar status', res.error);
          if (btn) {
            btn.disabled = oldDisabled;
            btn.textContent = oldLabel;
          }
          return;
        }

        state.pedido.status = novoStatus;
        window.toast('Pedido marcado como ' + (window.pedidoStatusLabel ? window.pedidoStatusLabel(novoStatus) : novoStatus) + '.', 'success');
        await reload();
        render();
      };

      if (novoStatus === 'cancelado') {
        window.confirmDialog({
          title: 'Cancelar pedido',
          message: 'Tem certeza que deseja cancelar este pedido? Esta acao nao pode ser desfeita nesta fase.',
          confirmLabel: 'Sim, cancelar',
          danger: true,
          onConfirm: apply,
        });
        if (btn) {
          btn.disabled = oldDisabled;
          btn.textContent = oldLabel;
        }
        return;
      }

      await apply();
    }

    function movementField(label, value) {
      return window.el('div', {},
        window.el('label', {
          style: 'display:block;font-size:12px;font-weight:600;color:#5b6472;margin-bottom:6px;',
        }, label),
        window.el('div', {
          style: 'border:1px solid #d8dce2;border-radius:4px;padding:9px 12px;font-size:13.5px;color:#16203a;background:#fff;',
        }, ns.fmtTextoOuEmpty(value, '-'))
      );
    }

    function openMovementModal(ctxMovement) {
      var body = window.el('div', {},
        window.el('div', {
          style: 'display:flex;align-items:flex-start;gap:12px;margin-bottom:16px;',
        },
          window.el('div', {
            style: 'width:36px;height:36px;border-radius:50%;background:#eef3ff;display:flex;align-items:center;justify-content:center;flex-shrink:0;',
          }, ns.svgEl(ns.SVG_INFO)),
          window.el('div', {},
            window.el('div', {
              style: 'font-size:15px;font-weight:700;color:#16203a;',
            }, ctxMovement.title),
            window.el('div', {
              style: 'font-size:13px;color:#5b6472;margin-top:6px;line-height:1.5;',
            }, ctxMovement.detalhe)
          )
        ),
        window.el('div', {
          style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;',
        },
          movementField('Origem', ctxMovement.origem),
          movementField('Destino', ctxMovement.destino)
        ),
        movementField('Documentos esperados', ctxMovement.docs || 'Romaneio e NF'),
        ctxMovement.op ? movementField('OP vinculada', ns.opLabel(ctxMovement.op)) : null,
        window.el('div', {
          style: 'display:flex;align-items:flex-start;gap:10px;background:#f8f9fb;border:1px solid #eceef1;border-radius:4px;padding:12px 14px;margin-top:12px;',
        },
          ns.svgEl(ns.SVG_INFO),
          window.el('span', {
            style: 'font-size:12.5px;color:#5b6472;line-height:1.5;',
          }, 'A operacao continua canonica na OP. Use este atalho apenas para abrir a mesma origem de movimentacao, sem duplicar lancamentos no pedido.')
        )
      );

      window.modal({
        title: ctxMovement.title,
        body: body,
        saveLabel: ctxMovement.op ? 'Abrir OP' : 'Fechar',
        onSave: async function () {
          if (ctxMovement.op) {
            window.navigate('#/ops/' + ctxMovement.op.id);
          }
          return true;
        },
      });
    }

    function openEditWarning(mode) {
      var statusAtual = state.pedido ? state.pedido.status : null;
      var editavel = window.isPedidoEditavel
        ? window.isPedidoEditavel(statusAtual)
        : (statusAtual === 'rascunho' || statusAtual === 'recebido');

      if (!editavel) {
        window.toast('Edicao permitida apenas em pedidos em rascunho ou recebido.', 'error');
        return;
      }

      var hasOps = state.ops && state.ops.length > 0;
      if (!hasOps) {
        window.navigate(mode === 'itens'
          ? '#/pedidos/' + pedidoId + '/itens'
          : '#/pedidos/' + pedidoId + '/editar');
        return;
      }

      var body = window.el('div', {},
        window.el('div', {
          style: 'display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;',
        },
          window.el('div', {
            style: 'width:36px;height:36px;border-radius:50%;background:#fff4e6;display:flex;align-items:center;justify-content:center;flex-shrink:0;',
          }, ns.svgEl(ns.SVG_WARN)),
          window.el('div', {},
            window.el('div', {
              style: 'font-size:15.5px;font-weight:700;color:#16203a;',
            }, 'Este pedido ja tem OPs vinculadas'),
            window.el('div', {
              style: 'font-size:13px;color:#5b6472;margin-top:6px;line-height:1.5;',
            }, 'Editar dados gerais ou itens nao altera a producao ja lancada nas OPs - a OP continua sendo a origem oficial da movimentacao. Para mudar quantidades em producao, use "Movimentar".')
          )
        ),
        window.el('div', {
          style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f8f9fb;border:1px solid #eceef1;border-radius:4px;padding:10px 12px;',
        },
          window.el('div', {
            style: 'font-size:12.5px;color:#5b6472;line-height:1.5;',
          }, 'Se voce precisar ajustar a composicao do pedido comercial, a rota de itens continua disponivel.'),
          buildEditItensButton()
        )
      );

      window.modal({
        title: 'Editar pedido',
        body: body,
        saveLabel: mode === 'itens' ? 'Editar itens' : 'Editar mesmo assim',
        onSave: async function () {
          window.navigate(mode === 'itens'
            ? '#/pedidos/' + pedidoId + '/itens'
            : '#/pedidos/' + pedidoId + '/editar');
          return true;
        },
      });
    }

    function openStatusActions() {
      if (!state.pedido) return;

      var actions = ns.nextActionsForStatus(state.pedido.status);
      var body = window.el('div', {});

      if (actions.length === 0) {
        body.appendChild(window.el('div', {
          style: 'font-size:13px;color:#5b6472;line-height:1.5;',
        }, state.pedido.status === 'cancelado'
          ? 'Pedido cancelado. Nenhuma transicao disponivel nesta fase.'
          : 'Nenhuma acao de status disponivel para este pedido.'));
        window.modal({
          title: 'Acoes do pedido',
          body: body,
          saveLabel: 'Fechar',
          onSave: async function () { return true; },
        });
        return;
      }

      body.appendChild(window.el('div', {
        style: 'font-size:13px;color:#5b6472;margin-bottom:12px;line-height:1.5;',
      }, 'Use estas transicoes para manter o status comercial do pedido alinhado ao fluxo administrativo.'));

      var buttonsWrap = window.el('div', {
        style: 'display:flex;flex-direction:column;gap:8px;',
      });
      body.appendChild(buttonsWrap);

      var modalRef = window.modal({
        title: 'Acoes do pedido',
        body: body,
        saveLabel: 'Fechar',
        onSave: async function () { return true; },
      });

      actions.forEach(function (action) {
        var isCancel = action.status === 'cancelado';
        var btn = window.el('button', {
          type: 'button',
          style: 'display:flex;align-items:center;justify-content:center;background:' + (isCancel ? '#fff' : '#2563eb') + ';color:' + (isCancel ? '#b42318' : '#fff') + ';border:' + (isCancel ? '1px solid #f5c2c7' : 'none') + ';border-radius:4px;padding:10px 12px;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;',
          onclick: async function () {
            await alterarStatus(action.status, btn);
            modalRef.close();
          },
        }, action.label);
        buttonsWrap.appendChild(btn);
      });
    }

    function buildTrackingPreviewNode(statusInput, exceptionInput, messageInput) {
      var api = ns.getTrackingApi();
      var payload = {
        status_cliente_visual: statusInput.value || 'recebido',
        status_cliente_excecao: exceptionInput.value || null,
        status_cliente_mensagem: messageInput.value ? messageInput.value.trim() : null,
      };

      if (!api) {
        return window.el('div', {
          style: 'font-size:13px;color:#9aa2af;',
        }, 'Taxonomia de acompanhamento indisponivel.');
      }

      var progress = api.getClienteTrackingProgress(payload);
      var label = api.getClienteTrackingStatusLabel(payload);
      var message = api.getClienteTrackingMensagem(payload);
      var percent = Math.round((((progress.currentIndex >= 0 ? progress.currentIndex : 0) + 1) / progress.totalSteps) * 100);
      var badgeBg = '#eaf1fd';
      var badgeColor = '#2563eb';
      var badgeDot = '#2563eb';

      if (progress.exception) {
        if (progress.exception.tom === 'danger') {
          badgeBg = '#fdecec';
          badgeColor = '#a23434';
          badgeDot = '#b23b3b';
        } else if (progress.exception.tom === 'warning') {
          badgeBg = '#fff4e6';
          badgeColor = '#c2610c';
          badgeDot = '#e07b39';
        } else {
          badgeBg = '#f1f3f6';
          badgeColor = '#5b6472';
          badgeDot = '#6b7280';
        }
      }

      return window.el('div', {
        style: 'background:#f6f7f9;border:1px solid #eceef1;border-radius:4px;padding:14px 16px;',
      },
        window.el('div', {
          style: 'font-size:10.5px;font-weight:700;color:#8a93a3;letter-spacing:.05em;margin-bottom:10px;',
        }, 'PREVIEW'),
        window.el('span', {
          style: 'display:inline-flex;align-items:center;gap:7px;background:' + badgeBg + ';color:' + badgeColor + ';border-radius:4px;padding:5px 12px;font-size:13px;font-weight:700;margin-bottom:12px;',
        },
          window.el('span', {
            style: 'width:7px;height:7px;border-radius:50%;background:' + badgeDot + ';display:inline-block;',
          }),
          label
        ),
        window.el('div', {
          style: 'font-size:13.5px;color:#2c4a78;font-weight:500;line-height:1.5;margin-bottom:12px;',
        }, '"' + message + '"'),
        window.el('div', {
          style: 'height:6px;border-radius:99px;background:#e2e5ea;overflow:hidden;margin-bottom:6px;',
        },
          window.el('div', {
            style: 'width:' + percent + '%;height:100%;background:#2563eb;',
          })
        ),
        window.el('div', {
          style: 'display:flex;justify-content:space-between;font-size:11.5px;color:#9aa2af;',
        },
          window.el('span', {}, 'Etapa ' + ((progress.currentIndex >= 0 ? progress.currentIndex : 0) + 1) + ' de ' + progress.totalSteps),
          window.el('span', {}, percent + '%')
        )
      );
    }

    function openTrackingModal() {
      var api = ns.getTrackingApi();
      if (!api) {
        window.toast('Taxonomia visual do cliente indisponivel.', 'error');
        return;
      }

      var statusOptions = api.CLIENTE_TRACKING_STEPS.map(function (step) {
        return { value: step.key, label: step.label };
      });
      var exceptionOptions = api.CLIENTE_TRACKING_EXCECOES.map(function (item) {
        return { value: item.key, label: item.label };
      });

      var statusInput = window.selectInput({
        options: statusOptions,
        value: state.pedido.status_cliente_visual || (state.pedido.status === 'confirmado' ? 'confirmado' : 'recebido'),
        placeholder: 'Selecione uma etapa',
      });
      var exceptionInput = window.selectInput({
        options: exceptionOptions,
        value: state.pedido.status_cliente_excecao || '',
        placeholder: 'Sem excecao',
      });
      var messageInput = window.el('textarea', {
        style: 'width:100%;min-height:92px;border:1px solid #d8dce2;border-radius:4px;padding:9px 12px;font-size:13.5px;font-family:inherit;color:#16203a;resize:none;outline:none;',
        placeholder: 'Mensagem opcional ao cliente',
      });
      messageInput.value = state.pedido.status_cliente_mensagem || '';

      var previewWrap = window.el('div', { style: 'margin-top:4px;' });
      function renderPreview() {
        previewWrap.replaceChildren(buildTrackingPreviewNode(statusInput, exceptionInput, messageInput));
      }
      statusInput.addEventListener('change', renderPreview);
      exceptionInput.addEventListener('change', renderPreview);
      messageInput.addEventListener('input', renderPreview);
      renderPreview();

      var body = window.el('div', {},
        window.formField({
          label: 'Etapa principal',
          input: statusInput,
          hint: 'Mantem a trilha visual compartilhada com o portal do cliente.',
        }),
        window.formField({
          label: 'Excecao',
          input: exceptionInput,
          hint: 'Opcional. Quando definida, a comunicacao visual prioriza a excecao.',
        }),
        window.formField({
          label: 'Mensagem',
          input: messageInput,
          hint: 'Se ficar vazia, o sistema usa a frase padrao da etapa/excecao.',
        }),
        previewWrap
      );

      window.modal({
        title: 'Editar evolucao do cliente',
        body: body,
        saveLabel: 'Salvar mensagem',
        onSave: async function () {
          var updatePayload = {
            status_cliente_visual: statusInput.value || 'recebido',
            status_cliente_excecao: exceptionInput.value || null,
            status_cliente_mensagem: messageInput.value ? messageInput.value.trim() : null,
          };

          var updateRes = await window.supa
            .from('pedidos')
            .update(updatePayload)
            .eq('id', state.pedido.id);

          if (updateRes.error) {
            window.toast('Erro ao salvar situacao visivel: ' + (updateRes.error.message || 'desconhecido'), 'error');
            console.error('pedido-detail: erro ao atualizar situacao visivel', updateRes.error);
            return false;
          }

          var currentUserId = window.CURRENT_USER && window.CURRENT_USER.id
            ? window.CURRENT_USER.id
            : null;

          var insertRes = await window.supa
            .from('pedido_cliente_eventos')
            .insert({
              pedido_id: state.pedido.id,
              status: updatePayload.status_cliente_excecao || updatePayload.status_cliente_visual,
              titulo: api.getClienteTrackingStatusLabel(updatePayload),
              mensagem: api.getClienteTrackingMensagem(updatePayload),
              origem: 'manual',
              visivel_cliente: true,
              criado_por: currentUserId,
              metadata: null,
            });

          if (insertRes.error) {
            console.error('pedido-detail: erro ao inserir pedido_cliente_eventos', insertRes.error);
            window.toast('Situacao visivel salva, mas o historico visual nao foi registrado.', 'error');
          } else {
            window.toast('Situacao visivel salva com sucesso.', 'success');
          }

          await reload();
          render();
          return true;
        },
      });
    }

    return {
      buildTrackingAdmin: buildTrackingAdmin,
      buildParciaisAdmin: buildParciaisAdmin,
      buildEditButton: buildEditButton,
      buildEditItensButton: buildEditItensButton,
      navigateToPedidos: navigateToPedidos,
      navigateToOp: navigateToOp,
      navigateToNovaOp: navigateToNovaOp,
      scrollToSection: scrollToSection,
      openMovementModal: openMovementModal,
      openEditWarning: openEditWarning,
      openStatusActions: openStatusActions,
      openTrackingModal: openTrackingModal,
    };
  }

  ns.createPedidoDetailEvents = createPedidoDetailEvents;
})(window);
