// =====================================================================
// === SUPABASE DOCUMENTS DECISIONS ====================================
// Adapter module for Supabase document decisions via RPC.
// Preserved functions: undoDocumentDecisionInCloud (undo adapter) and
// registerDocumentDecisionInCloud (canonical command adapter).
//
// Carregar via <script src="js/documents-supabase-decisions.js?v=...">
// DEPOIS de js/documents-supabase-reader.js e ANTES das telas que usam
// o namespace RAVATEX_DOCUMENTS.
// =====================================================================

(function (window) {
  'use strict';

  var ns = window.RAVATEX_DOCUMENTS || {};

  ns.undoDocumentDecisionInCloud = function undoDocumentDecisionInCloud(documentId, motivo) {
    if (!window.supa || typeof window.supa.rpc !== 'function') {
      return Promise.resolve({ ok: false, error: 'supabase_unavailable' });
    }

    var docId = typeof documentId === 'string' ? documentId.trim() : '';
    if (!docId) {
      return Promise.resolve({ ok: false, error: 'document_id_required' });
    }

    var motivoTrimmed = typeof motivo === 'string' ? motivo.trim() : '';
    return Promise.resolve()
      .then(function () {
        return window.supa.rpc('desfazer_decisao_documento', {
          p_document_id: docId,
          p_motivo: motivoTrimmed || null,
        });
      })
      .then(function (r) {
        if (r && r.error) {
          return { ok: false, error: (r.error && r.error.message) || 'supabase_error' };
        }
        if (r && r.data) return r.data;
        return { ok: false, error: 'supabase_error' };
      })
      .catch(function () {
        return { ok: false, error: 'network' };
      });
  };

  ns.registerDocumentDecisionInCloud = function registerDocumentDecisionInCloud(envelope) {
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
      return Promise.resolve({ ok: false, error: 'invalid_envelope' });
    }

    if (!window.supa || typeof window.supa.rpc !== 'function') {
      return Promise.resolve({ ok: false, error: 'supabase_unavailable' });
    }

    var documentId = typeof envelope.documentId === 'string' ? envelope.documentId.trim() : '';
    if (!documentId) {
      return Promise.resolve({ ok: false, error: 'document_id_required' });
    }

    var decision = envelope.decision;
    if (decision !== 'accepted' && decision !== 'rejected') {
      return Promise.resolve({ ok: false, error: 'invalid_decision' });
    }

    var motivo = typeof envelope.motivo === 'string' ? envelope.motivo.trim() : '';
    if (decision === 'rejected' && !motivo) {
      return Promise.resolve({ ok: false, error: 'motivo_required' });
    }

    if (!envelope.commandId) {
      return Promise.resolve({ ok: false, error: 'command_id_required' });
    }

    if (decision === 'accepted') {
      motivo = null;
    }

    var expectedActiveDecisionId = envelope.expectedActiveDecisionId;
    if (expectedActiveDecisionId !== null) {
      if (typeof expectedActiveDecisionId !== 'string' || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(expectedActiveDecisionId)) {
        return Promise.resolve({ ok: false, error: 'invalid_expected_active_decision_id' });
      }
    }

    return Promise.resolve()
      .then(function () {
        return window.supa.rpc('registrar_decisao_documento', {
          p_document_id: documentId,
          p_decision: decision,
          p_motivo: motivo,
          p_command_id: envelope.commandId,
          p_expected_active_decision_id: expectedActiveDecisionId,
        });
      })
      .then(function (r) {
        if (r && r.error) {
          return { ok: false, error: (r.error && r.error.message) || 'supabase_error' };
        }
        if (r && r.data) {
          return r.data;
        }
        return { ok: false, error: 'supabase_error' };
      })
      .catch(function () {
        return { ok: false, error: 'network' };
      });
  };

  window.RAVATEX_DOCUMENTS = ns;
})(window);
