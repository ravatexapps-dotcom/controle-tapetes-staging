// =====================================================================
// === js/documents-ingestor-loader.js ==================================
// Loader local/manual para popular window.RAVATEX_DOCUMENTS_LOADED_EVENTS
// a partir de texto JSONL, array de eventos ou URL local controlada.
//
// Fase: RAVATEX-TAPETES-G11-D-DOCUMENTS-LOCAL-LOADER
// Escopo: funcoes explicitas, sem auto-load em producao, sem Supabase,
//   sem Google/Drive, sem persistencia, sem rede automatica.
//
// Depende de js/documents-ingestor.js (window.RAVATEX_DOCUMENTS).
// Carregar via <script src="js/documents-ingestor-loader.js?v=...></script>
// DEPOIS de js/documents-ingestor.js.
//
// Uso explicito (dev/teste):
//   RAVATEX_DOCUMENTS.loadDocumentsIngestorEventsFromText(jsonlText);
//   RAVATEX_DOCUMENTS.loadDocumentsIngestorEventsFromUrl('/data/fixtures/document-events-sample.jsonl');
//   RAVATEX_DOCUMENTS.setDocumentsIngestorEvents(eventsArray);
//
// Nao carrega nada automaticamente. Nao faz fetch sem chamada explicita.
// Nao persiste nada. Nao chama Supabase nem Google/Drive.
// =====================================================================

(function (window) {
  'use strict';

  var ns = window.RAVATEX_DOCUMENTS;
  if (!ns) {
    return;
  }

  var MAX_EVENTS = 2000;

  var BLOCKED_SCHEMES = ['javascript:', 'data:', 'blob:', 'file:', 'ftp:', 'chrome:', 'edge:'];

  // -------------------------------------------------------------------
  // Validacao de URL do loader (mesma origem / caminho local controlado)
  // -------------------------------------------------------------------

  function validateLoaderUrl(url) {
    var trimmed = url.trim();
    if (!trimmed) {
      return { valid: false, error: 'URL nao pode ser vazia.' };
    }
    var lower = trimmed.toLowerCase();
    for (var i = 0; i < BLOCKED_SCHEMES.length; i++) {
      if (lower.indexOf(BLOCKED_SCHEMES[i]) === 0) {
        return { valid: false, error: 'Esquema de URL bloqueado: ' + BLOCKED_SCHEMES[i] };
      }
    }
    if (lower.indexOf('://') !== -1) {
      return { valid: false, error: 'URLs absolutas (com ://) nao sao permitidas. Use caminho relativo ou mesma origem.' };
    }
    if (lower.indexOf('//') === 0) {
      return { valid: false, error: 'URLs com protocolo relativo (//) nao sao permitidas. Use caminho relativo ou mesma origem.' };
    }
    if (lower.indexOf('../') !== -1 || lower.indexOf('..\\') !== -1) {
      return { valid: false, error: 'Path traversal (../) nao e permitido.' };
    }
    if (lower.indexOf('\\\\') === 0) {
      return { valid: false, error: 'Caminhos UNC nao sao permitidos.' };
    }
    return { valid: true };
  }

  // -------------------------------------------------------------------
  // Validacao de array de eventos
  // -------------------------------------------------------------------

  function validateEventsArray(events) {
    if (!Array.isArray(events)) {
      return { valid: false, error: '{input} deve ser um array.' };
    }
    if (events.length > MAX_EVENTS) {
      return { valid: false, error: 'Excedeu o limite maximo de ' + MAX_EVENTS + ' eventos.' };
    }
    for (var i = 0; i < events.length; i++) {
      if (!ns.isValidDocumentEvent(events[i])) {
        return { valid: false, error: 'Evento invalido na posicao ' + i + ' (falta event_type, pedido_manual ou document.document_id).' };
      }
    }
    return { valid: true };
  }

  // -------------------------------------------------------------------
  // Carregar eventos a partir de texto JSONL
  // -------------------------------------------------------------------

  ns.loadDocumentsIngestorEventsFromText = function loadDocumentsIngestorEventsFromText(jsonlText) {
    if (typeof jsonlText !== 'string' || !jsonlText.trim()) {
      return { ok: false, count: 0, error: '{input} deve ser uma string JSONL nao vazia.' };
    }

    var events;
    try {
      events = ns.parseDocumentEventsJsonl(jsonlText);
    } catch (_e) {
      return { ok: false, count: 0, error: 'Falha ao interpretar JSONL como eventos: ' + String(_e) };
    }

    if (!events.length) {
      return { ok: false, count: 0, error: 'Nenhum evento valido encontrado no texto JSONL.' };
    }

    var validation = validateEventsArray(events);
    if (!validation.valid) {
      return { ok: false, count: 0, error: validation.error };
    }

    var deduped = ns.deduplicateEvents(events);
    window.RAVATEX_DOCUMENTS_LOADED_EVENTS = deduped;

    return { ok: true, count: deduped.length };
  };

  // -------------------------------------------------------------------
  // Carregar eventos a partir de URL local controlada (chamada explicita)
  // -------------------------------------------------------------------

  ns.loadDocumentsIngestorEventsFromUrl = function loadDocumentsIngestorEventsFromUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
      return Promise.resolve({ ok: false, count: 0, error: '{url} deve ser uma string nao vazia.' });
    }

    var urlCheck = validateLoaderUrl(url);
    if (!urlCheck.valid) {
      return Promise.resolve({ ok: false, count: 0, error: urlCheck.error });
    }

    if (typeof window.fetch !== 'function') {
      return new Promise(function (resolve) {
        resolve({ ok: false, count: 0, error: 'fetch nao esta disponivel neste ambiente.' });
      });
    }

    return window.fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(function (text) {
        if (typeof text !== 'string' || !text.trim()) {
          return { ok: false, count: 0, error: 'Resposta da URL esta vazia.' };
        }
        return ns.loadDocumentsIngestorEventsFromText(text);
      })
      .catch(function (err) {
        return { ok: false, count: 0, error: 'Erro ao carregar eventos da URL: ' + String(err) };
      });
  };

  // -------------------------------------------------------------------
  // Setar eventos diretamente a partir de array pre-existente
  // -------------------------------------------------------------------

  ns.setDocumentsIngestorEvents = function setDocumentsIngestorEvents(events) {
    if (!Array.isArray(events)) {
      return { ok: false, count: 0, error: '{events} deve ser um array.' };
    }

    if (events.length === 0) {
      window.RAVATEX_DOCUMENTS_LOADED_EVENTS = [];
      return { ok: true, count: 0 };
    }

    var validation = validateEventsArray(events);
    if (!validation.valid) {
      return { ok: false, count: 0, error: validation.error };
    }

    var deduped = ns.deduplicateEvents(events);
    window.RAVATEX_DOCUMENTS_LOADED_EVENTS = deduped;

    return { ok: true, count: deduped.length };
  };

  // -------------------------------------------------------------------
  // Suporte a documentos-recebidos.jsonl (formato flat do Ingestor G12-D1)
  //
  // Estado separado: window.RAVATEX_DOCUMENTS_RECEIVED (array de docs).
  // NAO toca window.RAVATEX_DOCUMENTS_LOADED_EVENTS.
  // Reutiliza validateLoaderUrl (mesma politica de URL guard).
  //
  // Fase: RAVATEX-TAPETES-G12-G1-RECEIVED-DOCUMENTS-PARSER-LOADER
  // -------------------------------------------------------------------

  function validateReceivedDocumentsArray(docs) {
    if (!Array.isArray(docs)) {
      return { valid: false, error: '{input} deve ser um array.' };
    }
    if (docs.length > MAX_EVENTS) {
      return { valid: false, error: 'Excedeu o limite maximo de ' + MAX_EVENTS + ' documentos.' };
    }
    for (var i = 0; i < docs.length; i++) {
      if (!ns.isValidReceivedDocument(docs[i])) {
        return { valid: false, error: 'Documento invalido na posicao ' + i + ' (falta document_id).' };
      }
    }
    return { valid: true };
  }

  function dedupeReceivedDocuments(docs) {
    var seen = {};
    var deduped = [];
    for (var i = 0; i < docs.length; i++) {
      var key = docs[i] && docs[i].document_id;
      if (!key) continue;
      if (!seen[key]) {
        seen[key] = true;
        deduped.push(docs[i]);
      }
    }
    return deduped;
  }

  function setReceivedSource(source) {
    var normalized = typeof source === 'string' && source ? source : 'manual';
    window.RAVATEX_DOCUMENTS_RECEIVED_SOURCE = normalized;
    window.RAVATEX_DOCUMENTS_RECEIVED_SOURCE_METADATA = {
      source: normalized,
      loadedAt: new Date().toISOString(),
    };
  }

  ns.setReceivedDocuments = function setReceivedDocuments(docs, options) {
    if (!Array.isArray(docs)) {
      return { ok: false, count: 0, error: '{docs} deve ser um array.' };
    }

    if (docs.length === 0) {
      window.RAVATEX_DOCUMENTS_RECEIVED = [];
      setReceivedSource(options && options.source);
      return { ok: true, count: 0 };
    }

    var validation = validateReceivedDocumentsArray(docs);
    if (!validation.valid) {
      return { ok: false, count: 0, error: validation.error };
    }

    var deduped = dedupeReceivedDocuments(docs);
    window.RAVATEX_DOCUMENTS_RECEIVED = deduped;
    setReceivedSource(options && options.source);

    return { ok: true, count: deduped.length };
  };

  ns.loadReceivedDocumentsFromText = function loadReceivedDocumentsFromText(jsonlText, options) {
    if (typeof jsonlText !== 'string' || !jsonlText.trim()) {
      return { ok: false, count: 0, error: '{input} deve ser uma string JSONL nao vazia.' };
    }

    var docs;
    try {
      docs = ns.parseReceivedDocumentsJsonl(jsonlText);
    } catch (_e) {
      return { ok: false, count: 0, error: 'Falha ao interpretar JSONL como documentos recebidos: ' + String(_e) };
    }

    if (!docs.length) {
      return { ok: false, count: 0, error: 'Nenhum documento valido encontrado no texto JSONL.' };
    }

    var validation = validateReceivedDocumentsArray(docs);
    if (!validation.valid) {
      return { ok: false, count: 0, error: validation.error };
    }

    return ns.setReceivedDocuments(docs, options || { source: 'manual' });
  };

  ns.loadReceivedDocumentsFromUrl = function loadReceivedDocumentsFromUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
      return Promise.resolve({ ok: false, count: 0, error: '{url} deve ser uma string nao vazia.' });
    }

    var urlCheck = validateLoaderUrl(url);
    if (!urlCheck.valid) {
      return Promise.resolve({ ok: false, count: 0, error: urlCheck.error });
    }

    if (typeof window.fetch !== 'function') {
      return new Promise(function (resolve) {
        resolve({ ok: false, count: 0, error: 'fetch nao esta disponivel neste ambiente.' });
      });
    }

    return window.fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.text();
      })
      .then(function (text) {
        if (typeof text !== 'string' || !text.trim()) {
          return { ok: false, count: 0, error: 'Resposta da URL esta vazia.' };
        }
        return ns.loadReceivedDocumentsFromText(text);
      })
      .catch(function (err) {
        return { ok: false, count: 0, error: 'Erro ao carregar documentos da URL: ' + String(err) };
      });
  };

})(window);
