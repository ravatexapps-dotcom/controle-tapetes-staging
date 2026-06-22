// =====================================================================
// === ENVIRONMENT BANNER (Seam A UI) ==================================
// Banner laranja/amarelo fixo no RODAPÉ da janela, visível apenas
// quando APP_ENV !== 'production'. Não impede login; é um sinal
// visual para o operador de que está em staging.
//
// Carregar via <script src="js/environment-banner.js"></script> no
// <head>, DEPOIS de js/config.js (que provê APP_ENV, APP_CONFIG) e
// DEPOIS de js/supabase-client.js (que pode criar write-guard-banner
// com prioridade visual superior). ANTES do script inline principal.
//
// Comportamento preservado do script inline original:
//   - aparece só quando APP_ENV !== 'production';
//   - texto exato: 'AMBIENTE STAGING — DADOS DE TESTE. Não usar para
//     operações reais.';
//   - id: 'env-banner';
//   - role: 'status';
//   - position: fixed; bottom: 0; left: 0; right: 0; z-index: 99998;
//   - se o banner vermelho (write-guard-banner) existir, o laranja
//     é inserido logo após ele no DOM (preserva empilhamento);
//   - console.info laranja com label e host (acoplado ao banner);
//   - banner é best-effort: se o DOM não estiver pronto, silencioso.
// =====================================================================

(function (window) {
  'use strict';

  const ENV_BANNER_ID = 'env-banner';
  const ENV_BANNER_TEXT =
    'AMBIENTE STAGING — DADOS DE TESTE. Não usar para operações reais.';

  function ensureEnvironmentBanner() {
    if (window.APP_ENV === 'production') return null;

    // log laranja (preservado idêntico ao script inline)
    console.info(
      '%c[APP-ENV] ' + window.APP_CONFIG.label + ' — host: ' +
        (typeof location !== 'undefined' ? location.hostname : '(no location)'),
      'background:#f59e0b;color:#000;padding:2px 6px;border-radius:3px;font-weight:bold;'
    );

    try {
      if (typeof document === 'undefined' || !document.body) return null;
      const _envBanner = document.createElement('div');
      _envBanner.id = ENV_BANNER_ID;
      _envBanner.setAttribute('role', 'status');
      _envBanner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99998;' +
        'background:#f59e0b;color:#000;text-align:center;padding:6px 12px;' +
        'font-family:Inter,system-ui,sans-serif;font-size:13px;font-weight:600;' +
        'box-shadow:0 -1px 4px rgba(0,0,0,.2);';
      _envBanner.textContent = ENV_BANNER_TEXT;
      // Banner é independente do write-guard banner (que fica no topo e
      // é criado por js/supabase-client.js). Insere no body (append) —
      // fica no final do DOM, mas com position:fixed o ponto de inserção
      // não afeta o posicionamento visual. Se o write-guard banner já
      // existe, insere logo após ele para preservar empilhamento.
      const _wg = document.getElementById('write-guard-banner');
      if (_wg && _wg.parentNode) {
        _wg.parentNode.insertBefore(_envBanner, _wg.nextSibling);
      } else {
        document.body.appendChild(_envBanner);
      }
      return _envBanner;
    } catch (_) { /* DOM pode não estar pronto; banner é best-effort */ }
    return null;
  }

  // Expõe namespace para testes e para consumidores novos.
  window.RAVATEX_ENV_BANNER = {
    ensureEnvironmentBanner,
    ENV_BANNER_ID,
    ENV_BANNER_TEXT,
  };

  // Auto-init na carga do script. Se o body não estiver pronto
  // ainda, o try/catch interno silencia.
  ensureEnvironmentBanner();
})(window);
