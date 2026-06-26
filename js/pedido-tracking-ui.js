(function (window) {
  'use strict';

  var CLIENTE_TRACKING_STEPS = Object.freeze([
    Object.freeze({ key: 'recebido', label: 'Recebido', frasePadrao: 'Seu pedido foi recebido.' }),
    Object.freeze({ key: 'confirmado', label: 'Confirmado', frasePadrao: 'Seu pedido foi confirmado para atendimento.' }),
    Object.freeze({ key: 'insumos', label: 'Insumos', frasePadrao: 'Seu pedido esta na etapa de insumos.', pulavel: true }),
    Object.freeze({ key: 'tecelagem', label: 'Tecelagem', frasePadrao: 'Seu pedido esta em tecelagem.' }),
    Object.freeze({ key: 'acabamento', label: 'Acabamento', frasePadrao: 'Seu pedido esta em acabamento.' }),
    Object.freeze({ key: 'expedicao', label: 'Expedição', frasePadrao: 'Seu pedido esta em expedicao.' }),
    Object.freeze({ key: 'transporte', label: 'Transporte', frasePadrao: 'Seu pedido esta em transporte.', pulavel: true }),
    Object.freeze({ key: 'concluido', label: 'Concluído', frasePadrao: 'Seu pedido foi concluido.' }),
  ]);

  var CLIENTE_TRACKING_EXCECOES = Object.freeze([
    Object.freeze({ key: 'aguardando_definicao', label: 'Aguardando definicao', tom: 'warning', frasePadrao: 'Seu pedido esta aguardando definicao.' }),
    Object.freeze({ key: 'aguardando_insumo', label: 'Aguardando insumo', tom: 'warning', frasePadrao: 'Seu pedido esta aguardando insumo.' }),
    Object.freeze({ key: 'pausado', label: 'Pausado', tom: 'neutral', frasePadrao: 'Seu pedido esta pausado no momento.' }),
    Object.freeze({ key: 'cancelado', label: 'Cancelado', tom: 'danger', frasePadrao: 'Seu pedido foi cancelado.' }),
  ]);

  var STEP_BY_KEY = Object.create(null);
  var EXCECAO_BY_KEY = Object.create(null);
  var STEP_INDEX_BY_KEY = Object.create(null);

  CLIENTE_TRACKING_STEPS.forEach(function (step, index) {
    STEP_BY_KEY[step.key] = step;
    STEP_INDEX_BY_KEY[step.key] = index;
  });

  CLIENTE_TRACKING_EXCECOES.forEach(function (item) {
    EXCECAO_BY_KEY[item.key] = item;
  });

  function normalizarTrackingKey(value) {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  }

  function getClienteTrackingStep(key) {
    return STEP_BY_KEY[normalizarTrackingKey(key)] || null;
  }

  function getClienteTrackingException(key) {
    return EXCECAO_BY_KEY[normalizarTrackingKey(key)] || null;
  }

  function getPedidoMensagemPublicada(pedido) {
    if (!pedido || typeof pedido.status_cliente_mensagem !== 'string') return '';
    return pedido.status_cliente_mensagem.trim();
  }

  function resolveClienteTrackingStep(pedido) {
    var visualKey = pedido && pedido.status_cliente_visual;
    var step = getClienteTrackingStep(visualKey);
    return {
      fallbackToRecebido: !step,
      step: step || STEP_BY_KEY.recebido,
    };
  }

  function getClienteTrackingStatusLabel(pedido) {
    var excecao = getClienteTrackingException(pedido && pedido.status_cliente_excecao);
    if (excecao) return excecao.label;
    return resolveClienteTrackingStep(pedido).step.label;
  }

  function getClienteTrackingMensagem(pedido) {
    var mensagemPublicada = getPedidoMensagemPublicada(pedido);
    if (mensagemPublicada) return mensagemPublicada;

    var excecao = getClienteTrackingException(pedido && pedido.status_cliente_excecao);
    if (excecao) return excecao.frasePadrao;

    return resolveClienteTrackingStep(pedido).step.frasePadrao;
  }

  function getClienteTrackingProgress(pedido) {
    var excecao = getClienteTrackingException(pedido && pedido.status_cliente_excecao);
    var resolved = resolveClienteTrackingStep(pedido);
    var currentStep = excecao && excecao.key === 'cancelado' ? null : resolved.step;
    var currentIndex = currentStep ? STEP_INDEX_BY_KEY[currentStep.key] : -1;

    return {
      steps: CLIENTE_TRACKING_STEPS,
      exception: excecao,
      currentStep: currentStep,
      currentKey: currentStep ? currentStep.key : null,
      currentIndex: currentIndex,
      totalSteps: CLIENTE_TRACKING_STEPS.length,
      isException: !!excecao,
      isTerminal: !!(excecao && excecao.key === 'cancelado') || !!(currentStep && currentStep.key === 'concluido'),
      fallbackToRecebido: resolved.fallbackToRecebido,
    };
  }

  var trackingApi = {
    CLIENTE_TRACKING_STEPS: CLIENTE_TRACKING_STEPS,
    CLIENTE_TRACKING_EXCECOES: CLIENTE_TRACKING_EXCECOES,
    getClienteTrackingStep: getClienteTrackingStep,
    getClienteTrackingException: getClienteTrackingException,
    getClienteTrackingStatusLabel: getClienteTrackingStatusLabel,
    getClienteTrackingMensagem: getClienteTrackingMensagem,
    getClienteTrackingProgress: getClienteTrackingProgress,
  };

  window.RavatexPedidoTracking = trackingApi;

  window.RAVATEX_PEDIDO_UI = window.RAVATEX_PEDIDO_UI || {};
  window.RAVATEX_PEDIDO_UI.CLIENTE_TRACKING = trackingApi;
})(window);
