// =====================================================================
// === js/documents-ingestor-import-ui.js ===============================
// UX manual para importar eventos JSONL do Documents Ingestor.
// Adiciona um botao flutuante que abre dialogo de arquivo, le via
// FileReader e chama loadDocumentsIngestorEventsFromText.
//
// Fase: RAVATEX-TAPETES-G11-E-DOCUMENTS-MANUAL-IMPORT-UX
// Escopo: UX manual, local, read-only. Sem rede, sem Supabase, sem
//   Google/Drive, sem persistencia, sem watcher.
//
// Depende de:
//   - js/documents-ingestor-loader.js (RAVATEX_DOCUMENTS.loadFromText)
//   - js/ui.js (window.toast)
// Carregar via <script src="js/documents-ingestor-import-ui.js?v=...>
// DEPOIS de documents-ingestor-loader.js.
//
// Nao carrega nada automaticamente. Nao persiste. Nao chama rede.
// =====================================================================

(function (window) {
  'use strict';

  var docs = window.RAVATEX_DOCUMENTS;
  if (!docs || typeof docs.loadDocumentsIngestorEventsFromText !== 'function') {
    return;
  }

  var IMPORT_BUTTON_ID = 'rv-docs-import-btn';

  function createImportUI() {
    // Hidden file input
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.jsonl,.txt,application/jsonl,text/plain';
    fileInput.style.display = 'none';
    fileInput.id = 'rv-docs-import-input';
    fileInput.setAttribute('aria-label', 'Selecionar arquivo JSONL do Documents Ingestor');

    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function () {
        var text = typeof reader.result === 'string' ? reader.result : '';
        var result = docs.loadDocumentsIngestorEventsFromText(text);

        if (result.ok) {
          var msg = result.count + ' evento(s) do Documents Ingestor carregado(s). '
            + 'Abra ou recarregue o Pedido para ver "Documentos Recebidos (Ingestor)". '
            + 'Nada foi persistido.';
          window.toast(msg, 'success');
        } else {
          window.toast('Erro ao importar: ' + (result.error || 'Falha desconhecida.'), 'error');
        }

        // Limpa o input para permitir reimportar o mesmo arquivo
        fileInput.value = '';
      };

      reader.onerror = function () {
        window.toast('Erro ao ler o arquivo selecionado.', 'error');
        fileInput.value = '';
      };

      reader.readAsText(file);
    });

    document.body.appendChild(fileInput);

    // Floating button
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = IMPORT_BUTTON_ID;
    btn.setAttribute('aria-label', 'Importar eventos do Documents Ingestor');
    btn.title = 'Importar JSONL do Documents Ingestor';
    btn.textContent = 'Importar docs';
    btn.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:100;'
      + 'background:#2563eb;color:#fff;border:none;border-radius:6px;'
      + 'padding:8px 16px;font-size:13px;font-weight:600;'
      + 'font-family:inherit;cursor:pointer;box-shadow:0 2px 8px rgba(37,99,235,.35);'
      + 'transition:opacity .2s;opacity:.85;';

    btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '.85'; });

    btn.addEventListener('click', function () {
      fileInput.click();
    });

    document.body.appendChild(btn);
  }

  try {
    if (document.body) {
      createImportUI();
    } else if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', createImportUI);
    }
  } catch (_e) {
    // Melhor esforco: nao quebrar outros scripts.
  }

})(window);
