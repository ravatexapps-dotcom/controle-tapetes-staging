// =====================================================================
// === js/documents-ingestor.js =========================================
// Consumidor read-only de eventos do Documents Ingestor (outbox JSONL).
//
// Fase: RAVATEX-TAPETES-G11-B-DOCUMENTS-CONSUMER-PATCH
// Escopo: parser, normalizador, deduplicacao e consolidacao de eventos
//   do outbox. Nao faz fetch, nao persiste em Supabase, nao chama
//   Google/Drive. Opera sobre JSONL em memoria.
//
// Carregar via <script src="js/documents-ingestor.js?v=...></script>
// DEPOIS de js/ui.js e ANTES dos screens de pedido-detail.
//
// Compatibilidade: expoe window.RAVATEX_DOCUMENTS. Funcoes puras;
// nenhuma dependencia de DOM, Supabase ou rede.
// =====================================================================

(function (window) {
  'use strict';

  var ns = window.RAVATEX_DOCUMENTS || {};

  // -------------------------------------------------------------------
  // Constantes de status / badges
  // -------------------------------------------------------------------

  var DOC_STATUS_META = Object.freeze({
    pending_app_acceptance: { bg: '#fff4e6', text: '#c2610c', label: 'Pendente' },
    accepted:              { bg: '#e6f4ec', text: '#18794a', label: 'Aceito' },
    rejected:              { bg: '#fdecec', text: '#a23434', label: 'Rejeitado' },
  });

  var DOC_TIPO_BADGE = Object.freeze({
    nf:       { bg: '#eaf1fd', text: '#2563eb', label: 'NF' },
    romaneio: { bg: '#f3effd', text: '#6a3db8', label: 'Romaneio' },
  });

  var DOC_FORMATO_BADGE = Object.freeze({
    pdf: { bg: '#fdeee6', text: '#b65630', label: 'PDF' },
    xml: { bg: '#e6f1fd', text: '#2563eb', label: 'XML' },
  });

  var DOC_DIRECAO_BADGE = Object.freeze({
    entrada: { bg: '#e6f4ec', text: '#18794a', label: 'Entrada' },
    saida:   { bg: '#fdf0e6', text: '#b65630', label: 'Saida' },
  });

  var DOC_EVENT_LABEL = Object.freeze({
    'document.detected':  'Documento detectado',
    'document.linked':    'Documento vinculado',
    'document.accepted':  'Documento aceito',
    'document.rejected':  'Documento rejeitado',
  });

  // -------------------------------------------------------------------
  // Normalizacao de pedido
  // -------------------------------------------------------------------

  ns.normalizePedidoKey = function normalizePedidoKey(numero, ano) {
    if (numero == null && ano == null) return null;
    if (numero == null) return 'PED-XX-' + String(ano);
    var pad = String(numero).padStart(2, '0');
    var y = ano != null ? String(ano) : 'XXXX';
    return 'PED-' + pad + '-' + y;
  };

  // -------------------------------------------------------------------
  // Parser JSONL
  // -------------------------------------------------------------------

  ns.parseDocumentEventsJsonl = function parseDocumentEventsJsonl(text) {
    if (typeof text !== 'string' || !text.trim()) return [];
    var events = [];
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      try {
        var ev = JSON.parse(line);
        if (ev && typeof ev === 'object' && typeof ev.event_type === 'string') {
          events.push(ev);
        }
      } catch (_e) {
        // Linha malformada ignorada.
      }
    }
    return events;
  };

  // -------------------------------------------------------------------
  // Validacao minima de evento
  // -------------------------------------------------------------------

  ns.isValidDocumentEvent = function isValidDocumentEvent(ev) {
    if (!ev || typeof ev !== 'object') return false;
    if (typeof ev.event_type !== 'string') return false;
    if (typeof ev.pedido_manual !== 'string') return false;
    if (!ev.document || typeof ev.document !== 'object') return false;
    if (typeof ev.document.document_id !== 'string') return false;
    return true;
  };

  // -------------------------------------------------------------------
  // Filtro por pedido
  // -------------------------------------------------------------------

  ns.filterEventsByPedido = function filterEventsByPedido(events, pedidoKey) {
    if (!Array.isArray(events) || !pedidoKey) return [];
    return events.filter(function (ev) {
      return ev.pedido_manual === pedidoKey;
    });
  };

  // -------------------------------------------------------------------
  // Deduplicacao por ingestion_event_id
  // -------------------------------------------------------------------

  ns.deduplicateEvents = function deduplicateEvents(events) {
    if (!Array.isArray(events)) return [];
    var seen = {};
    var deduped = [];
    for (var i = 0; i < events.length; i++) {
      var key = events[i].ingestion_event_id || events[i].event_id;
      if (!seen[key]) {
        seen[key] = true;
        deduped.push(events[i]);
      }
    }
    return deduped;
  };

  // -------------------------------------------------------------------
  // Ordenacao por created_at
  // -------------------------------------------------------------------

  ns.sortEventsByCreatedAt = function sortEventsByCreatedAt(events) {
    if (!Array.isArray(events)) return [];
    return events.slice().sort(function (a, b) {
      var da = typeof a.created_at === 'string' ? a.created_at : '';
      var db = typeof b.created_at === 'string' ? b.created_at : '';
      if (da < db) return -1;
      if (da > db) return 1;
      // Desempate: ingestion_event_id lexicografico
      var ia = a.ingestion_event_id || '';
      var ib = b.ingestion_event_id || '';
      if (ia < ib) return -1;
      if (ia > ib) return 1;
      return 0;
    });
  };

  // -------------------------------------------------------------------
  // Consolidacao por document_id
  // -------------------------------------------------------------------

  ns.consolidateDocumentState = function consolidateDocumentState(events) {
    if (!Array.isArray(events)) return [];
    var byDoc = {};
    var docOrder = [];

    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      var docId = ev.document && ev.document.document_id;
      if (!docId) continue;

      if (typeof byDoc[docId] === 'undefined') {
        docOrder.push(docId);
        byDoc[docId] = ev;
      } else {
        // Substitui se o evento for mais recente
        var existing = byDoc[docId];
        var da = typeof existing.created_at === 'string' ? existing.created_at : '';
        var db = typeof ev.created_at === 'string' ? ev.created_at : '';
        if (db > da) {
          byDoc[docId] = ev;
        }
      }
    }

    return docOrder.map(function (docId) { return byDoc[docId]; });
  };

  // -------------------------------------------------------------------
  // Helper: get badge meta para um tipo
  // -------------------------------------------------------------------

  ns.getDocumentStatusBadgeMeta = function getDocumentStatusBadgeMeta(status) {
    return DOC_STATUS_META[status] || DOC_STATUS_META.pending_app_acceptance;
  };

  ns.getDocumentTipoBadgeMeta = function getDocumentTipoBadgeMeta(tipo) {
    return DOC_TIPO_BADGE[tipo] || { bg: '#f1f3f6', text: '#5b6472', label: tipo || 'Doc' };
  };

  ns.getDocumentFormatoBadgeMeta = function getDocumentFormatoBadgeMeta(formato) {
    return DOC_FORMATO_BADGE[formato] || null;
  };

  ns.getDocumentDirecaoBadgeMeta = function getDocumentDirecaoBadgeMeta(direcao) {
    return DOC_DIRECAO_BADGE[direcao] || null;
  };

  ns.getDocumentEventLabel = function getDocumentEventLabel(eventType) {
    return DOC_EVENT_LABEL[eventType] || eventType;
  };

  // -------------------------------------------------------------------
  // Montagem: pipeline completo por pedido
  // -------------------------------------------------------------------

  ns.buildDocumentsForPedido = function buildDocumentsForPedido(events, pedidoKey) {
    if (!Array.isArray(events) || !pedidoKey) {
      return { consolidatedDocuments: [], timeline: [] };
    }

    var filtered = ns.filterEventsByPedido(events, pedidoKey);
    var deduped = ns.deduplicateEvents(filtered);
    var sorted = ns.sortEventsByCreatedAt(deduped);
    var consolidated = ns.consolidateDocumentState(sorted);

    return {
      consolidatedDocuments: consolidated,
      timeline: sorted,
    };
  };

  // -------------------------------------------------------------------
  // Timestamp formatador local (para exibicao na UI)
  // -------------------------------------------------------------------

  ns.fmtTimestamp = function fmtTimestamp(iso) {
    if (!iso) return '-';
    try {
      var d = new Date(iso);
      var day = String(d.getDate()).padStart(2, '0');
      var mon = String(d.getMonth() + 1).padStart(2, '0');
      var hour = String(d.getHours()).padStart(2, '0');
      var min = String(d.getMinutes()).padStart(2, '0');
      return day + '/' + mon + ' ' + hour + ':' + min;
    } catch (_e) {
      return String(iso).slice(0, 16);
    }
  };

  // -------------------------------------------------------------------
  // Namespace
  // -------------------------------------------------------------------

  window.RAVATEX_DOCUMENTS = ns;
})(window);
