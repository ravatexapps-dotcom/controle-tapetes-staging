// =====================================================================
// === SCREENS: CLIENTE PEDIDO TRACKING ================================
// Componente visual de acompanhamento do pedido para o cliente B2B.
// Renderiza um stepper + banner de situação a partir de `pedido.status`.
//
// Fase: RAVATEX-TAPETES-PEDIDOS-CLIENTE-TRACKING-UI-A
// Escopo: componente puro de apresentação, sem rota própria. Recebe
//   `pedido` (já carregado por cliente-pedido-detail.js) e devolve um
//   node DOM. NÃO consulta o Supabase, NÃO insere/atualiza/deleta
//   nada, NÃO chama Edge Function. Não expõe dados internos de
//   produção, comerciais ou administrativos sensíveis (mesma lista de
//   bloqueio aplicada em cliente-pedido-detail.js).
//
//   Sem campo `status_cliente_visual` nesta fase — a etapa visível é
//   DERIVADA de `pedido.status` (mapeamento temporário, ver
//   `statusParaEtapaCliente`). Quando existir um campo client-visible
//   próprio (fase futura, alimentado por eventos visíveis ao cliente
//   ou automações), este componente deve passar a ler dele em vez de
//   derivar a partir do status operacional.
//
// Carregar via <script src="js/screens/cliente-pedido-tracking.js"></script>
// no <head>, DEPOIS de js/ui.js e ANTES de
// js/screens/cliente-pedido-detail.js.
//
// Dependências resolvidas em tempo de chamada:
//   - window.el (js/ui.js)
//
// Compatibilidade: window.buildClientePedidoTrackingCard e
// window.RAVATEX_SCREENS.clientePedidoTracking ficam disponíveis
// para cliente-pedido-detail.js.
// =====================================================================

(function (window) {
  'use strict';

  // Etapas visíveis ao cliente nesta fase (sketch inicial). O estado
  // de cancelamento NÃO entra aqui — é uma exceção fora da linha do
  // tempo, tratada separadamente em buildClientePedidoTrackingCard.
  var STEPS = [
    { key: 'recebido',    label: 'Recebido',            frase: 'Seu pedido foi recebido.' },
    { key: 'confirmado',  label: 'Confirmado',          frase: 'Seu pedido está em análise.' },
    { key: 'em_producao', label: 'Em produção',         frase: 'Seu pedido está em produção.' },
    { key: 'acabamento',  label: 'Em acabamento',       frase: 'Seu pedido está em acabamento.' },
    { key: 'pronto',      label: 'Pronto para entrega', frase: 'Seu pedido está pronto para entrega.' },
    { key: 'entregue',    label: 'Entregue',            frase: 'Seu pedido foi entregue.' },
  ];

  // -------------------------------------------------------------------
  // statusParaEtapaCliente: mapeamento TEMPORÁRIO de `pedido.status`
  // (operacional) para a etapa visível ao cliente. Será substituído
  // por um campo client-visible próprio em fase futura.
  //
  // Os demais status operacionais ainda não têm uma transição
  // alcançável pela tela de detalhe nesta fase e não têm
  // correspondência 1:1 clara com um único nó deste stepper de 6
  // etapas (ex.: o status seguinte poderia equivaler tanto a "Em
  // produção" quanto a "Em acabamento"). Por isso, qualquer status
  // fora do mapeamento explícito cai em `null` (futuro/neutro) em vez
  // de adivinhar a etapa.
  // -------------------------------------------------------------------
  function statusParaEtapaCliente(status) {
    switch (status) {
      case 'rascunho':
      case 'recebido':
        return 'recebido';
      case 'confirmado':
        return 'confirmado';
      default:
        return null;
    }
  }

  function stepIndexByKey(key) {
    if (!key) return -1;
    for (var i = 0; i < STEPS.length; i++) {
      if (STEPS[i].key === key) return i;
    }
    return -1;
  }

  function buildStepNode(step, index, currentIndex) {
    var estado = index < currentIndex ? 'concluido' : (index === currentIndex ? 'atual' : 'futuro');
    var wrap = window.el('div', { class: 'flex-1 min-w-[88px] flex flex-col items-center relative px-1' });

    if (index > 0) {
      var corConector = index <= currentIndex ? 'bg-blue-600' : 'bg-gray-200';
      wrap.appendChild(window.el('div', {
        class: 'absolute top-4 -left-1/2 w-full h-0.5 ' + corConector,
      }));
    }

    var circuloClasse = 'w-8 h-8 rounded-full flex items-center justify-center relative z-10 '
      + 'text-sm font-bold ring-4 ring-white ';
    var circuloConteudo;
    if (estado === 'concluido') {
      circuloClasse += 'bg-blue-600 text-white';
      circuloConteudo = '✓';
    } else if (estado === 'atual') {
      circuloClasse += 'bg-blue-600 text-white shadow-[0_0_0_4px_rgba(37,99,235,0.18)]';
      circuloConteudo = String(index + 1);
    } else {
      circuloClasse += 'bg-white border-2 border-gray-200 text-gray-400';
      circuloConteudo = String(index + 1);
    }
    wrap.appendChild(window.el('div', { class: circuloClasse }, circuloConteudo));

    var labelClasse = 'mt-2 text-xs text-center leading-snug ';
    if (estado === 'concluido') labelClasse += 'text-gray-600 font-semibold';
    else if (estado === 'atual') labelClasse += 'text-blue-700 font-bold';
    else labelClasse += 'text-gray-400 font-medium';
    wrap.appendChild(window.el('div', { class: labelClasse }, step.label));

    if (estado === 'atual') {
      wrap.appendChild(window.el('div', { class: 'text-[11px] text-blue-600 font-semibold mt-0.5' }, 'em andamento'));
    }

    return wrap;
  }

  function buildBanner(etapaInfo) {
    if (!etapaInfo) {
      return window.el('div', {
        class: 'flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mt-6',
      }, window.el('span', { class: 'text-gray-500 text-sm' },
        'Aguardando atualização da situação deste pedido.'));
    }
    return window.el('div', {
      class: 'flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mt-6',
    }, window.el('span', { class: 'text-blue-800 text-sm font-medium' }, etapaInfo.frase));
  }

  // Estado de exceção: cancelado. Substitui o stepper por um aviso
  // calmo — não é tratado como progresso normal da linha do tempo.
  function buildCanceladoCard() {
    return window.el('div', { class: 'bg-white rounded-xl shadow p-6 mb-4 border border-red-100' },
      window.el('div', { class: 'text-base font-bold text-gray-900 mb-3' }, 'Acompanhamento do pedido'),
      window.el('div', { class: 'flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-4 py-3' },
        window.el('span', { class: 'text-red-700 text-sm font-medium' },
          'Este pedido foi cancelado e não está mais em andamento.')
      )
    );
  }

  // -------------------------------------------------------------------
  // buildClientePedidoTrackingCard: componente principal.
  // Recebe o `pedido` já carregado (apenas `status` é usado) e
  // devolve o card de acompanhamento. Não busca dados, não escreve
  // nada — puramente apresentação.
  // -------------------------------------------------------------------
  function buildClientePedidoTrackingCard(pedido) {
    if (!pedido) return window.el('div', {});

    if (pedido.status === 'cancelado') {
      return buildCanceladoCard();
    }

    var etapaKey = statusParaEtapaCliente(pedido.status);
    var currentIndex = stepIndexByKey(etapaKey);
    var etapaInfo = currentIndex >= 0 ? STEPS[currentIndex] : null;

    var card = window.el('div', { class: 'bg-white rounded-xl shadow p-6 mb-4' });
    card.appendChild(window.el('div', { class: 'text-base font-bold text-gray-900 mb-6' },
      'Acompanhamento do pedido'));

    var stepperRow = window.el('div', { class: 'flex flex-wrap items-start gap-y-6' });
    for (var i = 0; i < STEPS.length; i++) {
      stepperRow.appendChild(buildStepNode(STEPS[i], i, currentIndex));
    }
    card.appendChild(stepperRow);
    card.appendChild(buildBanner(etapaInfo));

    return card;
  }

  // -------------------------------------------------------------------
  // Namespace principal
  // -------------------------------------------------------------------
  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.clientePedidoTracking = {
    CLIENTE_TRACKING_STEPS: STEPS,
    statusParaEtapaCliente: statusParaEtapaCliente,
    buildClientePedidoTrackingCard: buildClientePedidoTrackingCard,
  };

  window.CLIENTE_TRACKING_STEPS = STEPS;
  window.statusParaEtapaCliente = statusParaEtapaCliente;
  window.buildClientePedidoTrackingCard = buildClientePedidoTrackingCard;
})(window);
