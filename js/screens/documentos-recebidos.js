// =====================================================================
// === SCREENS: DOCUMENTOS RECEBIDOS ==================================
// Tela admin `#/documentos/recebidos` — read-only sobre o estado
// `window.RAVATEX_DOCUMENTS_RECEIVED` populado pelo loader dedicado
// do G12-G1. NAO consome `window.RAVATEX_DOCUMENTS_LOADED_EVENTS` (que
// permanece exclusivo do Pedido Detail).
//
// Cada item da fila representa um documento recebido do Gmail/Drive
// que ainda nao foi atrelado a um Pedido. Esta tela apenas EXIBE —
// nenhum atrelamento e criado aqui; o botao "Ver" abre o link do
// Drive em nova aba.
//
// Sem Supabase, sem Google/Drive real, sem persistencia, sem
// watcher/polling. Documentos NAO sao armazenados no navegador
// alem do snapshot em memoria ja carregado via import manual.
//
// Carregar via <script src="js/screens/documentos-recebidos.js"></script>
// DEPOIS de js/documents-ingestor.js e js/documents-ingestor-loader.js
// e DEPOIS de js/screens/common.js (precisa de window.shellLayout e
// window.ADMIN_MENU), e ANTES de js/boot.js (que registra a rota).
// =====================================================================

(function (window) {
  'use strict';

  function getReceived() {
    if (typeof window.RAVATEX_DOCUMENTS_RECEIVED === 'undefined') return [];
    var v = window.RAVATEX_DOCUMENTS_RECEIVED;
    return Array.isArray(v) ? v : [];
  }

  function badgeTone(tipo) {
    if (tipo === 'nf') return { bg: '#eaf1fd', text: '#2563eb', label: 'NF' };
    if (tipo === 'romaneio') return { bg: '#f3effd', text: '#6a3db8', label: 'Romaneio' };
    if (tipo === 'desconhecido') return { bg: '#f1f3f6', text: '#5b6472', label: 'Desconhecido' };
    return { bg: '#f1f3f6', text: '#5b6472', label: tipo || 'Doc' };
  }

  function formatoBadge(formato) {
    if (formato === 'pdf') return { bg: '#fdeee6', text: '#b65630', label: 'PDF' };
    if (formato === 'xml') return { bg: '#e6f1fd', text: '#2563eb', label: 'XML' };
    if (formato === 'desconhecido') return { bg: '#f1f3f6', text: '#5b6472', label: '?' };
    return null;
  }

  function direcaoBadge(direcao) {
    if (direcao === 'entrada') return { bg: '#e6f4ec', text: '#18794a', label: 'Entrada' };
    if (direcao === 'saida') return { bg: '#fdf0e6', text: '#b65630', label: 'Saida' };
    if (direcao === 'desconhecida') return { bg: '#f1f3f6', text: '#5b6472', label: '?' };
    return null;
  }

  function fmtDataHoraCurta(iso) {
    if (!iso) return '-';
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '-';
      var day = String(d.getDate()).padStart(2, '0');
      var mon = String(d.getMonth() + 1).padStart(2, '0');
      var hour = String(d.getHours()).padStart(2, '0');
      var min = String(d.getMinutes()).padStart(2, '0');
      return day + '/' + mon + ' ' + hour + ':' + min;
    } catch (_e) {
      return String(iso).slice(0, 16);
    }
  }

  function buildBadge(meta) {
    if (!meta) return null;
    return window.el('span', {
      style: 'display:inline-flex;background:' + meta.bg + ';color:' + meta.text
        + ';border-radius:4px;padding:2px 8px;font-size:10.5px;font-weight:700;'
        + 'letter-spacing:.02em;flex-shrink:0;',
    }, meta.label);
  }

  function buildHeader() {
    var header = window.el('div', { style: 'margin-bottom:14px;' },
      window.el('div', {
        style: 'font-size:20px;font-weight:800;color:#16203a;letter-spacing:-.01em;margin-bottom:4px;',
      }, 'Documentos Recebidos (Ingestor)'),
      window.el('div', {
        style: 'font-size:13px;color:#5b6472;line-height:1.5;',
      }, 'Fila de documentos detectados pelo Documents Ingestor que ainda nao foram atrelados a um Pedido.')
    );
    return header;
  }

  function buildEmptyState() {
    var card = window.el('div', {
      style: 'background:#fff;border:1px solid #eceef1;border-radius:8px;'
        + 'padding:32px 24px;text-align:center;',
    },
      window.el('div', {
        style: 'font-size:15px;font-weight:700;color:#16203a;margin-bottom:6px;',
      }, 'Nenhum documento recebido'),
      window.el('div', {
        style: 'font-size:13px;color:#8a93a3;line-height:1.5;',
      }, 'Carregue um arquivo documentos-recebidos.jsonl no Pedido ou via botao dedicado de import para popular esta fila.')
    );
    return card;
  }

  function buildCountHeader(count) {
    return window.el('div', {
      style: 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;',
    },
      window.el('div', {
        style: 'font-size:11px;font-weight:700;color:#8a93a3;letter-spacing:.05em;',
      }, 'DOCUMENTOS RECEBIDOS'),
      window.el('div', {
        style: 'font-size:12px;color:#5b6472;',
      }, String(count) + ' documento' + (count === 1 ? '' : 's'))
    );
  }

  function buildDocumentRow(doc) {
    var tipo = doc && doc.tipo_documento;
    var formato = doc && doc.formato;
    var direcao = doc && doc.direcao_nf;
    var filename = doc && doc.filename_original ? doc.filename_original : 'Documento';
    var driveLink = doc && doc.drive_web_view_link ? doc.drive_web_view_link : null;
    var when = doc && doc.created_at ? doc.created_at : null;

    var badges = window.el('div', { style: 'display:flex;gap:5px;flex-wrap:wrap;align-items:center;' });
    var tipoB = buildBadge(badgeTone(tipo));
    if (tipoB) badges.appendChild(tipoB);
    var formatoB = buildBadge(formatoBadge(formato));
    if (formatoB) badges.appendChild(formatoB);
    var direcaoB = buildBadge(direcaoBadge(direcao));
    if (direcaoB) badges.appendChild(direcaoB);

    var statusPill = window.el('span', {
      style: 'display:inline-flex;background:#fff4e6;color:#c2610c;'
        + 'border-radius:4px;padding:2px 8px;font-size:10.5px;font-weight:700;'
        + 'letter-spacing:.02em;flex-shrink:0;',
    }, 'Pendente');

    var verBtn;
    if (driveLink) {
      verBtn = window.el('button', {
        type: 'button',
        'data-action': 'ver-documento-drive',
        'data-document-id': (doc && doc.document_id) || '',
        style: 'display:inline-flex;align-items:center;gap:6px;background:#fff;color:#2563eb;'
          + 'border:1px solid #2563eb;border-radius:4px;padding:4px 12px;'
          + 'font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;flex-shrink:0;',
        onclick: function () {
          if (typeof window.open === 'function') {
            window.open(driveLink, '_blank', 'noopener,noreferrer');
          }
        },
      }, 'Ver');
    } else {
      verBtn = window.el('span', {
        'data-action': 'sem-link',
        'data-document-id': (doc && doc.document_id) || '',
        style: 'color:#9aa2af;font-size:11.5px;font-style:italic;flex-shrink:0;',
      }, 'Sem link');
    }

    var right = window.el('div', { style: 'display:flex;align-items:center;gap:10px;flex-shrink:0;' },
      statusPill,
      verBtn
    );

    var left = window.el('div', { style: 'display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 0%;' },
      window.el('div', {
        style: 'display:flex;flex-direction:column;gap:5px;min-width:0;flex:1 1 0%;',
      },
        window.el('div', {
          style: 'font-size:13.5px;font-weight:600;color:#16203a;'
            + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
        }, filename),
        window.el('div', {
          style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;',
        }, badges, window.el('span', {
          style: 'font-size:11.5px;color:#9aa2af;flex-shrink:0;',
        }, fmtDataHoraCurta(when)))
      ),
      right
    );

    return window.el('div', {
      'data-document-id': (doc && doc.document_id) || '',
      'data-row': 'documento-recebido',
      style: 'display:flex;align-items:center;justify-content:space-between;'
        + 'gap:14px;padding:12px 18px;background:#fff;'
        + 'border-bottom:1px solid #f1f3f6;',
    }, left);
  }

  function buildCard(received) {
    var card = window.el('div', {
      style: 'background:#fff;border:1px solid #eceef1;border-radius:8px;'
        + 'overflow:hidden;margin-bottom:14px;',
    });

    card.appendChild(buildCountHeader(received.length));

    var list = window.el('div', { style: 'display:flex;flex-direction:column;' });
    received.forEach(function (doc, index) {
      var row = buildDocumentRow(doc);
      if (index === received.length - 1) {
        row.style.borderBottom = 'none';
      }
      list.appendChild(row);
    });
    card.appendChild(list);

    return card;
  }

  function screenDocumentosRecebidos(container) {
    var received = getReceived();

    var page = window.el('div', { style: 'max-width:1100px;' });
    page.appendChild(buildHeader());

    if (!received.length) {
      page.appendChild(buildEmptyState());
    } else {
      page.appendChild(buildCard(received));
    }

    container.appendChild(page);
    return window.shellLayout(window.ADMIN_MENU, container);
  }

  window.RAVATEX_SCREENS = window.RAVATEX_SCREENS || {};
  window.RAVATEX_SCREENS.documentosRecebidos = {
    screenDocumentosRecebidos: screenDocumentosRecebidos,
  };
  window.screenDocumentosRecebidos = screenDocumentosRecebidos;
})(window);
