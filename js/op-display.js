// =====================================================================
// === OP OPERATIONAL DISPLAY (helper central) =========================
// Identificacao operacional da OP atrelada ao Pedido:
//
//   OP {pedido_numero}/{pedido_ano}-{tipo}{seq}
//
// Exemplos: OP 21/2026-T01, OP 21/2026-T02, OP 21/2026-A01, OP 21/2026-A02
//
// Regras (fase RAVATEX-TAPETES-OP-OPERATIONAL-CODE-HELPER-B):
//   - pedido_numero = pedido.numero
//   - pedido_ano    = year(pedido.criado_em)
//   - tipo:           tecelagem -> 'T'; latex/acabamento -> 'A'
//   - seq:            sequencial de 2 digitos POR Pedido + Tipo,
//                     ordenado por ops.criado_em asc, desempate ops.id asc
//
// Fallback obrigatorio para o legado `OP {numero}/{ano}` quando faltar
// contexto confiavel de Pedido (sem pedido.numero, sem pedido.criado_em,
// tipo desconhecido ou a OP nao esta na lista de irmas do Pedido). Nunca
// inventa codigo incompleto.
//
// Puro: sem DOM, sem Supabase, sem regra de negocio. Carregar cedo
// (index.html: logo apos js/badges.js). Consumidores DEVEM cair no legado
// caso este helper nao esteja carregado.
// =====================================================================

(function (window) {
  'use strict';

  // Mapa tipo real do banco -> letra operacional. `latex` e a etapa que o
  // fluxo do usuario chama de "Acabamento", por isso 'A'. `acabamento` fica
  // como sinonimo defensivo. Qualquer outro tipo cai em fallback (null).
  var TYPE_LETTER = { tecelagem: 'T', latex: 'A', acabamento: 'A' };

  function normalizeTipo(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  function getOpTypeLetter(op) {
    if (!op) return null;
    return TYPE_LETTER[normalizeTipo(op.tipo)] || null;
  }

  function getPedidoOperationalYear(pedido) {
    if (!pedido) return null;
    var raw = pedido.criado_em;
    if (raw == null) return null;
    // Timestamp ISO 'YYYY-...': extrai o ano do prefixo, sem deslocamento de
    // fuso (bate com year(criado_em) do Postgres).
    var match = /^(\d{4})/.exec(String(raw));
    if (match) {
      var year = Number(match[1]);
      return Number.isFinite(year) ? year : null;
    }
    var parsed = new Date(raw);
    var fallbackYear = parsed.getFullYear();
    return Number.isFinite(fallbackYear) ? fallbackYear : null;
  }

  // Chave de ordenacao cronologica: criado_em (string ISO ordena por data)
  // com id como desempate/fallback. Ambos monotonicos por criacao.
  function compareForSequence(a, b) {
    var ca = a && a.criado_em != null ? String(a.criado_em) : '';
    var cb = b && b.criado_em != null ? String(b.criado_em) : '';
    if (ca !== cb) return ca < cb ? -1 : 1;
    var ia = a && a.id != null ? a.id : 0;
    var ib = b && b.id != null ? b.id : 0;
    if (ia === ib) return 0;
    return ia < ib ? -1 : 1;
  }

  function buildOpOperationalSequence(op, siblingOps) {
    if (!op || op.id == null || !Array.isArray(siblingOps)) return null;
    var letter = getOpTypeLetter(op);
    if (!letter) return null;
    var sameType = siblingOps.filter(function (candidate) {
      return candidate && candidate.id != null && getOpTypeLetter(candidate) === letter;
    });
    if (sameType.length === 0) return null;
    sameType.sort(compareForSequence);
    for (var i = 0; i < sameType.length; i++) {
      if (String(sameType[i].id) === String(op.id)) return i + 1;
    }
    return null;
  }

  function pad2(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    var s = String(n);
    return s.length >= 2 ? s : ('0' + s);
  }

  function formatOpLegacyCode(op) {
    if (!op) return 'OP -';
    var numero = op.numero != null ? op.numero : '-';
    if (op.ano != null) return 'OP ' + numero + '/' + op.ano;
    return 'OP ' + numero;
  }

  function resolveSiblings(context) {
    if (!context) return null;
    if (Array.isArray(context.siblingOps)) return context.siblingOps;
    if (Array.isArray(context.ops)) return context.ops;
    return null;
  }

  // context = { pedido, ops } (ops = todas as OPs do mesmo Pedido) ou
  // { pedido, siblingOps }. Retorna o codigo operacional quando ha contexto
  // suficiente; caso contrario o legado `OP {numero}/{ano}`.
  function formatOpOperationalCode(op, context) {
    if (!op) return 'OP -';
    var pedido = context ? context.pedido : null;
    var siblings = resolveSiblings(context);
    var letter = getOpTypeLetter(op);
    var year = getPedidoOperationalYear(pedido);
    var pedidoNumero = pedido && pedido.numero != null ? pedido.numero : null;
    var seqLabel = pad2(buildOpOperationalSequence(op, siblings));
    if (letter && year != null && pedidoNumero != null && seqLabel) {
      return 'OP ' + pedidoNumero + '/' + year + '-' + letter + seqLabel;
    }
    return formatOpLegacyCode(op);
  }

  // ===================================================================
  // Product variation identity (PHASE-MANTA-A).
  // Pure display of the canonical modelos.tipo_produto ('tapete'|'manta').
  // Single source of the product-line label contract used across Pedido
  // and OP surfaces:
  //   "Manta · Arabesco · 1,40 m · KRAFT/CRU"
  //   "Tapete · Barcelona · 2,10 m · KRAFT/CRU"
  // Never infers the type from the model name.
  // ===================================================================

  // Any value other than the canonical 'manta' resolves to 'Tapete', the
  // backfill default carried by every existing row (modelos.tipo_produto
  // DEFAULT 'tapete'). Keeps the label honest without name inference.
  function productTypeLabel(tipoProduto) {
    return normalizeTipo(tipoProduto) === 'manta' ? 'Manta' : 'Tapete';
  }

  function formatWidthPtBr(largura) {
    var n = Number(largura);
    if (!Number.isFinite(n)) return null;
    return n.toFixed(2).replace('.', ',');
  }

  function resolveCorNome(cor) {
    if (cor == null) return null;
    if (typeof cor === 'string') return cor;
    if (typeof cor === 'object' && cor.nome) return cor.nome;
    return null;
  }

  // model = { tipo_produto, nome, largura, cor_1|cor1, cor_2|cor2 } where a
  // cor may be a string or a { nome } object. Emits the canonical
  // "Tipo · Nome · L,LL m · COR1/COR2" contract, dropping any part
  // that is genuinely absent (never fabricating a value).
  function formatProductLabel(model) {
    if (!model) return '';
    var parts = [productTypeLabel(model.tipo_produto)];
    if (model.nome != null && String(model.nome).trim() !== '') parts.push(String(model.nome).trim());
    var w = formatWidthPtBr(model.largura);
    if (w != null) parts.push(w + ' m');
    var c1 = resolveCorNome(model.cor_1 != null ? model.cor_1 : model.cor1);
    var c2 = resolveCorNome(model.cor_2 != null ? model.cor_2 : model.cor2);
    if (c1 || c2) parts.push([c1 || '—', c2 || '—'].join('/'));
    return parts.join(' · ');
  }

  // Resolves a single tipo_produto for a whole OP from its items (each
  // carrying its modelo's tipo_produto, directly or via `modelo`/`modelos`).
  // Returns 'tapete' | 'manta' | 'misto' | null. A route-homogeneous OP
  // (DB-enforced) returns a single type; 'misto' is a defensive signal.
  function deriveProductType(items) {
    if (!Array.isArray(items) || items.length === 0) return null;
    var seen = {};
    for (var i = 0; i < items.length; i++) {
      var it = items[i] || {};
      var raw = it.tipo_produto
        || (it.modelo && it.modelo.tipo_produto)
        || (it.modelos && it.modelos.tipo_produto);
      var tp = normalizeTipo(raw) === 'manta' ? 'manta' : 'tapete';
      seen[tp] = true;
    }
    var keys = Object.keys(seen);
    if (keys.length > 1) return 'misto';
    return keys[0];
  }

  // OP-level label: 'Tapete' | 'Manta' | 'Misto' | null (empty/unknown).
  function opProductTypeLabel(items) {
    var tp = deriveProductType(items);
    if (tp == null) return null;
    if (tp === 'misto') return 'Misto';
    return productTypeLabel(tp);
  }

  var api = {
    getOpTypeLetter: getOpTypeLetter,
    getPedidoOperationalYear: getPedidoOperationalYear,
    buildOpOperationalSequence: buildOpOperationalSequence,
    formatOpOperationalCode: formatOpOperationalCode,
    formatOpLegacyCode: formatOpLegacyCode,
    productTypeLabel: productTypeLabel,
    formatProductLabel: formatProductLabel,
    deriveProductType: deriveProductType,
    opProductTypeLabel: opProductTypeLabel,
  };

  window.RAVATEX_OP_DISPLAY = api;
})(window);
