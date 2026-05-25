# Fase 3 — Nova OP com cálculo ao vivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir ao admin criar Ordens de Produção com cálculo de fio (kg por cor) ao vivo, salvar como simulação ou abrir (gerando ordens de compra de fio), e listar/reabrir OPs.

**Architecture:** O cálculo de fio vira um módulo puro `js/calculo-op.js` (sem DOM, testável com `node --test`), carregado no `index.html` via `<script>`. Duas telas novas no `index.html` seguindo o padrão das telas da Fase 2: lista de OPs (`#/ops`) e tela Nova OP (`#/ops/nova` e `#/ops/:id`). O router ganha um match dinâmico mínimo para `#/ops/:id`.

**Tech Stack:** Vanilla JS, HTML único, Tailwind via CDN, Supabase (Postgres + Auth + RLS), GitHub Pages. Sem bundler. Testes da lógica pura via `node --test` (Node 25 disponível).

**Referência:** spec em `docs/superpowers/specs/2026-05-25-fase3-nova-op.md`.

---

## Mapa de arquivos

- **Create:** `js/calculo-op.js` — funções puras `larguraKey`, `calcularFiosOP`, `montarOrdensCompraFio`. Exporta via `module.exports` (Node) e expõe como globais (browser).
- **Create:** `tests/calculo-op.test.js` — testes `node --test` das funções puras.
- **Modify:** `index.html` — `<script src="js/calculo-op.js">`; `ADMIN_MENU` (+ "OPs"); `routes` (+ `#/ops`, `#/ops/nova`); router com match dinâmico `#/ops/:id`; funções `screenListaOPs`, `screenNovaOP`.
- **Create:** `docs/qa/fase3-checklist.md` — checklist de QA manual.
- **Modify:** `STATUS.md` — marcar Fase 3 implementada.

**Decisão de rota:** `#/ops/:id` (id numérico) renderiza `screenNovaOP(id)`, que decide modo edição (status `simulada`) ou leitura (demais status). Isso cobre tanto "editar simulada" quanto "ver OP" do spec §3 com uma rota só.

---

## Task 1: Módulo de cálculo — `calcularFiosOP` (função pura)

**Files:**
- Create: `js/calculo-op.js`
- Test: `tests/calculo-op.test.js`

- [ ] **Step 1: Escrever o teste que falha**

Create `tests/calculo-op.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { calcularFiosOP, larguraKey } = require('../js/calculo-op.js');

// Parâmetros do seed (db/04_seed.sql)
const PARAMS = {
  '1.40': { algodao_por_ml: 0.000350, poliester_por_ml: 0.000420, valor_x: 1.0 },
  '2.10': { algodao_por_ml: 0.000525, poliester_por_ml: 0.000630, valor_x: 1.0 },
};
// Modelos: Conforto 1.40 (BRANCO/PRETO), Conforto 2.10 (PRETO/BRANCO)
const MODELOS = {
  1: { id: 1, nome: 'Conforto', largura: 1.40, cor_1: { id: 1, nome: 'BRANCO' }, cor_2: { id: 2, nome: 'PRETO' } },
  2: { id: 2, nome: 'Conforto', largura: 2.10, cor_1: { id: 2, nome: 'PRETO' }, cor_2: { id: 1, nome: 'BRANCO' } },
};

test('larguraKey normaliza 1.4 e 1.40 para a mesma chave', () => {
  assert.strictEqual(larguraKey(1.4), '1.40');
  assert.strictEqual(larguraKey('1.40'), '1.40');
  assert.strictEqual(larguraKey(2.1), '2.10');
});

test('1 item 1.40 x 200m: algodão por cor e poliéster conferem', () => {
  const r = calcularFiosOP([{ modeloId: 1, metros: 200 }], MODELOS, PARAMS);
  // algodão = 0.000350 * 1 * 200 = 0.07 por cor (BRANCO e PRETO)
  assert.ok(Math.abs(r.algodaoPorCor[1].kg - 0.07) < 1e-9);
  assert.ok(Math.abs(r.algodaoPorCor[2].kg - 0.07) < 1e-9);
  assert.strictEqual(r.algodaoPorCor[1].corNome, 'BRANCO');
  // poliéster = 0.000420 * 1 * 200 = 0.084 em PRETO e BRANCO
  assert.ok(Math.abs(r.poliester.PRETO - 0.084) < 1e-9);
  assert.ok(Math.abs(r.poliester.BRANCO - 0.084) < 1e-9);
});

test('2 itens larguras diferentes somam algodão por cor', () => {
  const r = calcularFiosOP(
    [{ modeloId: 1, metros: 200 }, { modeloId: 2, metros: 100 }],
    MODELOS, PARAMS
  );
  // BRANCO: 1.40 cor_1 (0.07) + 2.10 cor_2 (0.000525*100=0.0525) = 0.1225
  assert.ok(Math.abs(r.algodaoPorCor[1].kg - 0.1225) < 1e-9);
  // PRETO: 1.40 cor_2 (0.07) + 2.10 cor_1 (0.0525) = 0.1225
  assert.ok(Math.abs(r.algodaoPorCor[2].kg - 0.1225) < 1e-9);
});

test('poliéster sempre lista PRETO e BRANCO mesmo sem itens', () => {
  const r = calcularFiosOP([], MODELOS, PARAMS);
  assert.strictEqual(r.poliester.PRETO, 0);
  assert.strictEqual(r.poliester.BRANCO, 0);
  assert.deepStrictEqual(r.algodaoPorCor, {});
});

test('item com metros inválido é ignorado', () => {
  const r = calcularFiosOP([{ modeloId: 1, metros: 0 }, { modeloId: 1, metros: -5 }], MODELOS, PARAMS);
  assert.deepStrictEqual(r.algodaoPorCor, {});
});

test('largura sem parâmetro lança erro', () => {
  const modelos = { 9: { id: 9, nome: 'X', largura: 3.0, cor_1: { id: 1, nome: 'BRANCO' }, cor_2: { id: 2, nome: 'PRETO' } } };
  assert.throws(() => calcularFiosOP([{ modeloId: 9, metros: 100 }], modelos, PARAMS), /largura/);
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: FAIL — `Cannot find module '../js/calculo-op.js'`

- [ ] **Step 3: Implementar o mínimo em `js/calculo-op.js`**

Create `js/calculo-op.js`:

```js
// =====================================================================
// === CÁLCULO OP ======================================================
// Funções puras (sem DOM, sem Supabase) — testáveis com `node --test`.
// =====================================================================

// Normaliza largura para chave consistente ("1.4" e "1.40" -> "1.40").
function larguraKey(largura) {
  return Number(largura).toFixed(2);
}

// Calcula kg de fio por cor para os itens da OP.
// itens: [{ modeloId, metros }]
// modelosById: { [id]: { id, nome, largura, cor_1:{id,nome}, cor_2:{id,nome} } }
// parametrosByLargura: { [larguraKey]: { algodao_por_ml, poliester_por_ml, valor_x } }
// Retorna: { algodaoPorCor: { [corId]: {corId, corNome, kg} }, poliester: { PRETO, BRANCO } }
function calcularFiosOP(itens, modelosById, parametrosByLargura) {
  const algodaoPorCor = {};
  const poliester = { PRETO: 0, BRANCO: 0 };

  for (const item of itens) {
    const metros = Number(item.metros);
    if (!Number.isFinite(metros) || metros <= 0) continue;

    const modelo = modelosById[item.modeloId];
    if (!modelo) continue;

    const p = parametrosByLargura[larguraKey(modelo.largura)];
    if (!p) throw new Error('Sem parâmetros para largura ' + modelo.largura);

    const kgAlg = p.algodao_por_ml * p.valor_x * metros;
    for (const cor of [modelo.cor_1, modelo.cor_2]) {
      if (!algodaoPorCor[cor.id]) algodaoPorCor[cor.id] = { corId: cor.id, corNome: cor.nome, kg: 0 };
      algodaoPorCor[cor.id].kg += kgAlg;
    }

    const kgPol = p.poliester_por_ml * p.valor_x * metros;
    poliester.PRETO += kgPol;
    poliester.BRANCO += kgPol;
  }

  return { algodaoPorCor, poliester };
}

// (montarOrdensCompraFio é adicionada na Task 2)

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { larguraKey, calcularFiosOP };
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: PASS — 6 testes passando.

- [ ] **Step 5: Commit**

```bash
git add js/calculo-op.js tests/calculo-op.test.js
git commit -m "feat(fase3): funcao pura calcularFiosOP com testes node --test"
```

---

## Task 2: Módulo de cálculo — `montarOrdensCompraFio` (função pura)

**Files:**
- Modify: `js/calculo-op.js`
- Test: `tests/calculo-op.test.js`

- [ ] **Step 1: Adicionar o teste que falha**

Adicionar ao final de `tests/calculo-op.test.js` (e atualizar o require do topo):

Trocar a linha de require no topo do arquivo por:
```js
const { calcularFiosOP, larguraKey, montarOrdensCompraFio } = require('../js/calculo-op.js');
```

Adicionar ao final:
```js
test('montarOrdensCompraFio gera 1 ordem por cor de algodão + PRETO + BRANCO', () => {
  const calc = calcularFiosOP(
    [{ modeloId: 1, metros: 200 }, { modeloId: 2, metros: 100 }],
    MODELOS, PARAMS
  );
  const ordens = montarOrdensCompraFio(calc);
  const algodao = ordens.filter(o => o.tipo === 'algodao');
  const poliester = ordens.filter(o => o.tipo === 'poliester');
  assert.strictEqual(algodao.length, 2);           // BRANCO e PRETO
  assert.strictEqual(poliester.length, 2);         // PRETO e BRANCO
  // cada ordem de algodão tem cor_id e cor_poliester null
  for (const o of algodao) { assert.ok(o.cor_id); assert.strictEqual(o.cor_poliester, null); assert.ok(o.kg_pedido > 0); }
  for (const o of poliester) { assert.strictEqual(o.cor_id, null); assert.ok(['PRETO','BRANCO'].includes(o.cor_poliester)); }
});

test('montarOrdensCompraFio arredonda kg_pedido para 3 casas', () => {
  const calc = calcularFiosOP([{ modeloId: 1, metros: 200 }], MODELOS, PARAMS);
  const ordens = montarOrdensCompraFio(calc);
  const branco = ordens.find(o => o.tipo === 'algodao' && o.cor_id === 1);
  assert.strictEqual(branco.kg_pedido, 0.07); // 0.07 já tem 3 casas
});

test('montarOrdensCompraFio não gera ordens sem itens', () => {
  const ordens = montarOrdensCompraFio(calcularFiosOP([], MODELOS, PARAMS));
  assert.strictEqual(ordens.length, 0);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: FAIL — `montarOrdensCompraFio is not a function`.

- [ ] **Step 3: Implementar em `js/calculo-op.js`**

Substituir o comentário `// (montarOrdensCompraFio é adicionada na Task 2)` por:

```js
// Transforma o resultado de calcularFiosOP em payloads de ordens_compra_fio.
// kg_pedido > 0 (schema CHECK) e arredondado a 3 casas (NUMERIC(10,3)).
// op_id e fornecedor_id são preenchidos na hora de salvar (não aqui).
function montarOrdensCompraFio(calculo) {
  const round3 = (n) => Math.round(n * 1000) / 1000;
  const ordens = [];

  for (const { corId, kg } of Object.values(calculo.algodaoPorCor)) {
    const kgPedido = round3(kg);
    if (kgPedido > 0) ordens.push({ tipo: 'algodao', cor_id: corId, cor_poliester: null, kg_pedido: kgPedido });
  }
  for (const cor of ['PRETO', 'BRANCO']) {
    const kgPedido = round3(calculo.poliester[cor]);
    if (kgPedido > 0) ordens.push({ tipo: 'poliester', cor_id: null, cor_poliester: cor, kg_pedido: kgPedido });
  }
  return ordens;
}
```

Atualizar o `module.exports` no final do arquivo para:
```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { larguraKey, calcularFiosOP, montarOrdensCompraFio };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: PASS — 9 testes passando.

- [ ] **Step 5: Commit**

```bash
git add js/calculo-op.js tests/calculo-op.test.js
git commit -m "feat(fase3): funcao pura montarOrdensCompraFio com testes"
```

---

## Task 3: Integrar módulo + menu + rotas no `index.html`

**Files:**
- Modify: `index.html` (tag script perto do fim do `<body>`; `ADMIN_MENU`; `routes`; `handleRoute`)

- [ ] **Step 1: Carregar o módulo no `index.html`**

Localizar a linha onde o Supabase é carregado por CDN (`<script src="https://...supabase...">`). Logo após ela (e antes do `<script>` principal com o código do app), adicionar:

```html
<script src="js/calculo-op.js"></script>
```

Verificar: `grep -n "calculo-op.js\|supabase" index.html` deve mostrar o módulo carregado antes do script principal.

- [ ] **Step 2: Adicionar "OPs" ao `ADMIN_MENU`**

No array `ADMIN_MENU` (após `{ href: '#/painel', label: 'Painel' },`), inserir:

```js
  { href: '#/ops',                     label: 'OPs' },
```

- [ ] **Step 3: Registrar rotas estáticas**

No objeto `routes`, após a linha `'#/painel': { render: screenPainel, roles: ['admin'] },`, adicionar:

```js
  '#/ops':      { render: screenListaOPs, roles: ['admin'] },
  '#/ops/nova': { render: () => screenNovaOP(null), roles: ['admin'] },
```

- [ ] **Step 4: Adicionar match dinâmico para `#/ops/:id`**

Substituir o corpo de `handleRoute` (a parte que faz `const route = routes[hash];` e o `if (!route)`) para resolver rota dinâmica. O `handleRoute` atual:

```js
async function handleRoute() {
  const hash = location.hash || '#/login';
  const route = routes[hash];

  if (!route) { setApp(screenNotFound()); return; }
  if (route.public) { setApp(await route.render()); return; }
  ...
}
```

Trocar as duas primeiras linhas internas por:

```js
async function handleRoute() {
  const hash = location.hash || '#/login';
  const route = matchRoute(hash);

  if (!route) { setApp(screenNotFound()); return; }
  ...
}
```

E adicionar, logo acima de `function handleRoute`:

```js
// Resolve rota: primeiro match exato, depois dinâmica #/ops/:id (id numérico).
function matchRoute(hash) {
  if (routes[hash]) return routes[hash];
  const m = hash.match(/^#\/ops\/(\d+)$/);
  if (m) return { render: () => screenNovaOP(Number(m[1])), roles: ['admin'] };
  return null;
}
```

- [ ] **Step 5: Stubs temporários para não quebrar o carregamento**

Adicionar, na seção `// === SCREENS ===` (após `screenFornecedorHome`), stubs que serão substituídos nas Tasks 4 e 5 (evita ReferenceError ao navegar):

```js
async function screenListaOPs() { return shellLayout(ADMIN_MENU, el('div', {}, pageHeader('OPs', []), el('p', {}, 'Em construção'))); }
async function screenNovaOP(opId) { return shellLayout(ADMIN_MENU, el('div', {}, pageHeader('Nova OP', []), el('p', {}, 'Em construção (opId=' + opId + ')'))); }
```

- [ ] **Step 6: Verificar manualmente no navegador**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && python3 -m http.server 8000` e abrir `http://localhost:8000` (configurar credenciais Supabase no topo do script se necessário).
Login como admin → menu mostra "OPs" → clicar abre `#/ops` ("Em construção"). Navegar a `#/ops/nova` e `#/ops/5` mostram os stubs sem erro no console.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat(fase3): integra modulo calculo, menu OPs e rotas (com stubs)"
```

---

## Task 4: Tela Lista de OPs (`screenListaOPs`)

**Files:**
- Modify: `index.html` (substituir o stub `screenListaOPs`)

- [ ] **Step 1: Implementar `screenListaOPs`**

Substituir o stub de `screenListaOPs` por:

```js
const OP_STATUS_BADGE = {
  simulada:    'bg-gray-100 text-gray-700',
  aberta:      'bg-blue-100 text-blue-700',
  em_producao: 'bg-amber-100 text-amber-700',
  finalizada:  'bg-green-100 text-green-700',
};
const OP_STATUS_LABEL = {
  simulada: 'Simulada', aberta: 'Aberta', em_producao: 'Em produção', finalizada: 'Finalizada',
};

function badgeStatus(status) {
  return el('span', { class: 'px-2 py-1 rounded text-xs font-semibold ' + (OP_STATUS_BADGE[status] || 'bg-gray-100 text-gray-700') },
    OP_STATUS_LABEL[status] || status);
}

async function screenListaOPs() {
  const container = el('div', {});

  async function reload() {
    const { data, error } = await supa.from('ops')
      .select('id, numero, ano, status, criado_em, op_itens(id)')
      .order('ano', { ascending: false })
      .order('numero', { ascending: false });
    if (error) { toast('Erro ao carregar OPs', 'error'); console.error(error); return; }
    render(data || []);
  }

  function render(rows) {
    container.replaceChildren(
      pageHeader('Ordens de Produção', [{ label: '+ Nova OP', onclick: () => navigate('#/ops/nova') }]),
      dataTable({
        columns: [
          { key: 'lote', label: 'Lote', render: (r) => `Nº ${r.numero}/${r.ano}` },
          { key: 'status', label: 'Status', render: (r) => badgeStatus(r.status) },
          { key: 'itens', label: 'Itens', render: (r) => String((r.op_itens || []).length) },
          { key: 'criado_em', label: 'Criada em', render: (r) => new Date(r.criado_em).toLocaleDateString('pt-BR') },
        ],
        rows,
        actions: [
          { label: 'Abrir', onclick: (r) => navigate('#/ops/' + r.id) },
        ]
      })
    );
  }

  await reload();
  return shellLayout(ADMIN_MENU, container);
}
```

- [ ] **Step 2: Verificar no navegador**

Recarregar `http://localhost:8000` → `#/ops`. Se não houver OPs, mostra "Nenhum registro ainda." Se houver, mostra a tabela com Lote, status (badge), nº de itens e data. Botão "Abrir" navega para `#/ops/{id}` (stub da Task 3 até a Task 5 ser feita).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(fase3): tela lista de OPs"
```

---

## Task 5: Tela Nova OP — layout, itens e cálculo ao vivo (`screenNovaOP`)

**Files:**
- Modify: `index.html` (substituir o stub `screenNovaOP`)

Esta task implementa a UI de criação (itens + fornecedores + painel de cálculo ao vivo) **sem** a persistência ainda — os botões salvar/abrir entram na Task 6. Carrega OP existente quando `opId` é passado.

- [ ] **Step 1: Implementar `screenNovaOP` (montagem + cálculo ao vivo)**

Substituir o stub de `screenNovaOP` por:

```js
async function screenNovaOP(opId) {
  const container = el('div', {});

  // 1) Carrega dados de apoio
  const [modelosRes, paramsRes, fornsRes] = await Promise.all([
    supa.from('modelos').select('id, nome, largura, cor_1:cor_1_id(id,nome), cor_2:cor_2_id(id,nome)').order('nome'),
    supa.from('parametros_largura').select('*'),
    supa.from('fornecedores').select('id, nome, tipo').order('nome'),
  ]);
  if (modelosRes.error || paramsRes.error || fornsRes.error) {
    toast('Erro ao carregar dados da OP', 'error');
    console.error(modelosRes.error || paramsRes.error || fornsRes.error);
    return shellLayout(ADMIN_MENU, container);
  }
  const modelos = modelosRes.data || [];
  const modelosById = Object.fromEntries(modelos.map(m => [m.id, m]));
  const parametrosByLargura = Object.fromEntries((paramsRes.data || []).map(p => [larguraKey(p.largura), p]));
  const forns = fornsRes.data || [];
  const fornsPorTipo = (tipo) => forns.filter(f => f.tipo === tipo).map(f => ({ value: f.id, label: f.nome }));

  // 2) Estado da tela
  let op = null;                 // OP existente (modo edição/leitura)
  let itens = [];                // [{ modeloId, metros }]
  let fornSel = { fio_algodao: '', fio_poliester: '', cima: '', latex: '' };
  let numero = '', ano = new Date().getFullYear();
  let readOnly = false;

  if (opId) {
    const { data, error } = await supa.from('ops')
      .select('id, numero, ano, status, op_itens(modelo_id, metros_pedidos), op_fornecedores(fornecedor_id, etapa)')
      .eq('id', opId).single();
    if (error || !data) { toast('OP não encontrada', 'error'); console.error(error); navigate('#/ops'); return container; }
    op = data;
    numero = data.numero; ano = data.ano;
    itens = (data.op_itens || []).map(i => ({ modeloId: i.modelo_id, metros: i.metros_pedidos }));
    for (const f of (data.op_fornecedores || [])) fornSel[f.etapa] = f.fornecedor_id;
    readOnly = data.status !== 'simulada';
  } else {
    // sugere próximo número do ano corrente
    const { data } = await supa.from('ops').select('numero').eq('ano', ano).order('numero', { ascending: false }).limit(1);
    numero = (data && data[0] ? data[0].numero : 0) + 1;
  }

  // 3) Render
  function render() {
    container.replaceChildren(buildScreen());
  }

  function buildScreen() {
    const titulo = op ? `OP Nº ${op.numero}/${op.ano}` + (readOnly ? ' (leitura)' : ' (editar)') : 'Nova OP';
    const wrap = el('div', {});
    wrap.appendChild(pageHeader(titulo, [{ label: '← Voltar', onclick: () => navigate('#/ops') }]));

    const grid = el('div', { class: 'flex flex-col lg:flex-row gap-6' });
    grid.appendChild(buildLeft());
    grid.appendChild(buildRight());
    wrap.appendChild(grid);
    return wrap;
  }

  function disabledAttr(node) { if (readOnly) node.setAttribute('disabled', 'disabled'); return node; }

  function buildLeft() {
    const left = el('div', { class: 'flex-1 bg-white rounded-xl shadow p-5' });

    // Lote
    const numInput = disabledAttr(textInput({ type: 'number', value: String(numero) }));
    const anoInput = disabledAttr(textInput({ type: 'number', value: String(ano) }));
    numInput.addEventListener('input', () => { numero = numInput.value; });
    anoInput.addEventListener('input', () => { ano = anoInput.value; });
    const lote = el('div', { class: 'flex gap-3' },
      el('div', { class: 'w-28' }, formField({ label: 'Número', input: numInput })),
      el('div', { class: 'w-28' }, formField({ label: 'Ano', input: anoInput })),
    );
    left.appendChild(lote);

    // Itens
    left.appendChild(el('div', { class: 'font-semibold text-gray-700 mt-2 mb-2' }, 'Itens (modelo × metros)'));
    const itensWrap = el('div', {});
    const modeloOptions = modelos.map(m => ({
      value: m.id,
      label: `${m.nome} ${larguraKey(m.largura)}m · ${m.cor_1?.nome}/${m.cor_2?.nome}`,
    }));
    itens.forEach((item, idx) => itensWrap.appendChild(buildItemRow(item, idx, modeloOptions)));
    left.appendChild(itensWrap);

    if (!readOnly) {
      left.appendChild(el('button', {
        class: 'mt-2 text-sm text-blue-700 hover:underline',
        onclick: () => { itens.push({ modeloId: '', metros: '' }); render(); }
      }, '+ adicionar item'));
    }

    // Fornecedores
    left.appendChild(el('div', { class: 'font-semibold text-gray-700 mt-5 mb-2' }, 'Fornecedores'));
    left.appendChild(buildFornField('Algodão', 'fio_algodao'));
    left.appendChild(buildFornField('Poliéster', 'fio_poliester'));
    left.appendChild(buildFornField('Tecelagem (parte de cima)', 'cima'));
    left.appendChild(buildFornField('Látex', 'latex'));

    return left;
  }

  function buildItemRow(item, idx, modeloOptions) {
    const modeloSel = disabledAttr(selectInput({ options: modeloOptions, value: item.modeloId, placeholder: 'Modelo...' }));
    const metrosInput = disabledAttr(textInput({ type: 'number', value: item.metros === '' ? '' : String(item.metros), placeholder: 'metros' }));
    modeloSel.addEventListener('change', () => { item.modeloId = modeloSel.value ? Number(modeloSel.value) : ''; renderRight(); });
    metrosInput.addEventListener('input', () => { item.metros = metrosInput.value === '' ? '' : Number(metrosInput.value); renderRight(); });

    const row = el('div', { class: 'flex gap-2 items-center mb-2' },
      el('div', { class: 'flex-1' }, modeloSel),
      el('div', { class: 'w-24' }, metrosInput),
    );
    if (!readOnly) {
      row.appendChild(el('button', { class: 'text-red-600 hover:underline text-sm', onclick: () => { itens.splice(idx, 1); render(); } }, '✕'));
    }
    return row;
  }

  function buildFornField(label, etapa) {
    const fornsTipo = etapa === 'cima' ? fornsPorTipo('tecelagem') : fornsPorTipo(etapa);
    const sel = disabledAttr(selectInput({ options: fornsTipo, value: fornSel[etapa], placeholder: 'Selecione...' }));
    sel.addEventListener('change', () => { fornSel[etapa] = sel.value ? Number(sel.value) : ''; renderRight(); });
    return formField({ label, input: sel });
  }

  // Painel direito (cálculo + botões). renderRight só recalcula o painel.
  let rightNode = null;
  function buildRight() {
    rightNode = el('div', { class: 'lg:w-80 bg-gray-50 rounded-xl shadow p-5 self-start' });
    renderRightInto();
    return rightNode;
  }
  function renderRight() { if (rightNode) renderRightInto(); }

  function renderRightInto() {
    let calc;
    try {
      calc = calcularFiosOP(itens, modelosById, parametrosByLargura);
    } catch (err) {
      rightNode.replaceChildren(el('p', { class: 'text-red-600 text-sm' }, err.message));
      return;
    }
    const fmt = (n) => Number(n).toFixed(3).replace('.', ',') + ' kg';
    const children = [el('div', { class: 'font-semibold text-gray-700 mb-3' }, 'Fio necessário')];

    const algEntries = Object.values(calc.algodaoPorCor);
    children.push(el('div', { class: 'text-xs uppercase text-gray-500 mb-1' }, 'Algodão'));
    if (algEntries.length === 0) children.push(el('p', { class: 'text-sm text-gray-400 mb-2' }, '—'));
    for (const a of algEntries) children.push(el('p', { class: 'text-sm mb-1' }, `${a.corNome}: `, el('b', {}, fmt(a.kg))));

    children.push(el('div', { class: 'text-xs uppercase text-gray-500 mt-3 mb-1' }, 'Poliéster'));
    children.push(el('p', { class: 'text-sm mb-1' }, 'PRETO: ', el('b', {}, fmt(calc.poliester.PRETO))));
    children.push(el('p', { class: 'text-sm mb-1' }, 'BRANCO: ', el('b', {}, fmt(calc.poliester.BRANCO))));

    // Botões entram na Task 6 — placeholder até lá:
    if (!readOnly) children.push(el('div', { class: 'mt-5 text-xs text-gray-400' }, '(botões salvar/abrir — Task 6)'));

    rightNode.replaceChildren(...children);
    // guarda o último cálculo para a Task 6
    rightNode._calc = calc;
  }

  render();
  return shellLayout(ADMIN_MENU, container);
}
```

- [ ] **Step 2: Verificar no navegador**

Recarregar e abrir `#/ops/nova`. Adicionar item, escolher modelo e digitar metros → painel direito atualiza os kg ao vivo. Poliéster sempre mostra PRETO e BRANCO. Selecionar fornecedores nos 4 selects. Número sugerido aparece preenchido.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(fase3): tela Nova OP com itens, fornecedores e calculo ao vivo"
```

---

## Task 6: Salvar simulação e Abrir OP (persistência + ordens de compra)

**Files:**
- Modify: `index.html` (dentro de `screenNovaOP`: substituir o placeholder de botões e adicionar funções de salvar)

- [ ] **Step 1: Adicionar validação e funções de salvar dentro de `screenNovaOP`**

Dentro de `screenNovaOP`, antes de `function render()`, adicionar:

```js
  function itensValidos() {
    return itens.filter(i => i.modeloId && Number(i.metros) > 0);
  }

  // Persiste ops + filhos. status: 'simulada' | 'aberta'. Retorna id da OP ou null.
  async function persistir(status) {
    const numeroInt = parseInt(numero, 10), anoInt = parseInt(ano, 10);
    if (!numeroInt || !anoInt) { toast('Número e ano são obrigatórios', 'error'); return null; }
    const validos = itensValidos();
    if (validos.length === 0) { toast('Adicione ao menos 1 item com metros', 'error'); return null; }

    if (status === 'aberta') {
      const faltam = ['fio_algodao', 'fio_poliester', 'cima', 'latex'].filter(e => !fornSel[e]);
      if (faltam.length) { toast('Escolha os 4 fornecedores antes de abrir a OP', 'error'); return null; }
    }

    // 1) upsert ops
    let opRow;
    if (op) {
      const r = await supa.from('ops').update({ numero: numeroInt, ano: anoInt, status }).eq('id', op.id).select().single();
      if (r.error) { erroSalvar(r.error); return null; }
      opRow = r.data;
    } else {
      const r = await supa.from('ops').insert({ numero: numeroInt, ano: anoInt, status }).select().single();
      if (r.error) { erroSalvar(r.error); return null; }
      opRow = r.data;
    }
    const opIdSalvo = opRow.id;

    // 2) substitui op_itens
    await supa.from('op_itens').delete().eq('op_id', opIdSalvo);
    const itensPayload = validos.map(i => ({ op_id: opIdSalvo, modelo_id: i.modeloId, metros_pedidos: Number(i.metros) }));
    const itensRes = await supa.from('op_itens').insert(itensPayload);
    if (itensRes.error) { toast('Erro ao salvar itens', 'error'); console.error(itensRes.error); return null; }

    // 3) substitui op_fornecedores (apenas etapas escolhidas)
    await supa.from('op_fornecedores').delete().eq('op_id', opIdSalvo);
    const fornPayload = ['fio_algodao', 'fio_poliester', 'cima', 'latex']
      .filter(e => fornSel[e])
      .map(e => ({ op_id: opIdSalvo, fornecedor_id: fornSel[e], etapa: e }));
    if (fornPayload.length) {
      const fornRes = await supa.from('op_fornecedores').insert(fornPayload);
      if (fornRes.error) { toast('Erro ao salvar fornecedores', 'error'); console.error(fornRes.error); return null; }
    }

    // 4) se abrir: gera ordens_compra_fio (com rollback de status em caso de falha)
    if (status === 'aberta') {
      const calc = calcularFiosOP(validos, modelosById, parametrosByLargura);
      const ordens = montarOrdensCompraFio(calc).map(o => ({
        op_id: opIdSalvo,
        fornecedor_id: o.tipo === 'algodao' ? fornSel.fio_algodao : fornSel.fio_poliester,
        tipo: o.tipo, cor_id: o.cor_id, cor_poliester: o.cor_poliester,
        kg_pedido: o.kg_pedido, status: 'pendente',
      }));
      // recria do zero pra idempotência ao reabrir simulada->aberta
      await supa.from('ordens_compra_fio').delete().eq('op_id', opIdSalvo);
      const ordRes = await supa.from('ordens_compra_fio').insert(ordens);
      if (ordRes.error) {
        await supa.from('ops').update({ status: 'simulada' }).eq('id', opIdSalvo);
        toast('Falha ao gerar ordens de compra — OP mantida como simulada', 'error');
        console.error(ordRes.error);
        return null;
      }
    }

    return opIdSalvo;
  }

  function erroSalvar(error) {
    if (error.message && error.message.includes('duplicate')) toast(`Já existe OP nº ${numero} em ${ano}`, 'error');
    else toast('Erro ao salvar OP', 'error');
    console.error(error);
  }

  async function salvarSimulacao() {
    const id = await persistir('simulada');
    if (id) { toast('Simulação salva', 'success'); navigate('#/ops'); }
  }
  async function abrirOP() {
    const id = await persistir('aberta');
    if (id) { toast('OP aberta — ordens de compra geradas', 'success'); navigate('#/ops'); }
  }
```

- [ ] **Step 2: Trocar o placeholder de botões pelo real**

Em `renderRightInto`, substituir o bloco:

```js
    // Botões entram na Task 6 — placeholder até lá:
    if (!readOnly) children.push(el('div', { class: 'mt-5 text-xs text-gray-400' }, '(botões salvar/abrir — Task 6)'));
```

por:

```js
    if (!readOnly) {
      const faltamForn = ['fio_algodao', 'fio_poliester', 'cima', 'latex'].filter(e => !fornSel[e]);
      const btnSim = el('button', {
        class: 'w-full mt-5 mb-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg py-2',
        onclick: salvarSimulacao,
      }, 'Salvar simulação');
      const btnAbrir = el('button', {
        class: 'w-full font-semibold rounded-lg py-2 ' + (faltamForn.length
          ? 'bg-blue-300 text-white cursor-not-allowed'
          : 'bg-blue-700 hover:bg-blue-800 text-white'),
        onclick: () => { if (!faltamForn.length) abrirOP(); },
      }, 'Abrir OP');
      if (faltamForn.length) btnAbrir.setAttribute('disabled', 'disabled');
      children.push(btnSim, btnAbrir);
      if (faltamForn.length) children.push(el('p', { class: 'text-xs text-gray-500 mt-1' }, 'Escolha os 4 fornecedores para abrir.'));
    }
```

- [ ] **Step 3: Verificar no navegador (caminho feliz)**

Recarregar `#/ops/nova`. Montar 1 item válido, **sem** todos fornecedores → "Abrir OP" desabilitado, "Salvar simulação" funciona e volta pra lista com a OP `simulada`. Reabrir a simulada, escolher os 4 fornecedores → "Abrir OP" habilita; abrir → toast de sucesso, OP vira `aberta` na lista.

- [ ] **Step 4: Verificar geração de ordens (Supabase)**

No painel do Supabase (Table editor) ou SQL: `select * from ordens_compra_fio where op_id = <id>;` deve ter 1 linha por cor de algodão + 1 PRETO + 1 BRANCO, todas `status = 'pendente'`, `kg_pedido > 0`, fornecedor correto.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase3): salvar simulacao e abrir OP gerando ordens de compra"
```

---

## Task 7: Modo leitura para OPs não-simuladas + checklist de QA

**Files:**
- Modify: `index.html` (verificação — `readOnly` já implementado na Task 5)
- Create: `docs/qa/fase3-checklist.md`

- [ ] **Step 1: Verificar modo leitura no navegador**

Abrir uma OP `aberta` pela lista (`#/ops/{id}`). Todos os inputs/selects devem estar desabilitados, sem botões de "adicionar item", "✕", "Salvar simulação" ou "Abrir OP". O título mostra "(leitura)". Tentar editar não deve ser possível.

- [ ] **Step 2: Criar o checklist de QA**

Create `docs/qa/fase3-checklist.md`:

```markdown
# QA — Fase 3: Nova OP com cálculo ao vivo

Pré-requisitos: logado como admin; cadastros da Fase 2 populados (seed `db/04_seed.sql`).

## Cálculo (automatizado — `node --test tests/`)
- [ ] 1. 1 item 1,40 / 200 m → algodão 0,070 kg por cor; poliéster 0,084 kg PRETO e BRANCO.
- [ ] 2. 2 itens de larguras diferentes → soma por cor correta.
- [ ] 3. Poliéster sempre lista PRETO e BRANCO (mesmo zero).
- [ ] 4. `montarOrdensCompraFio` gera 1 ordem por cor de algodão + PRETO + BRANCO.

## UI / Integração (manual no site)
- [ ] 5. Menu "OPs" aparece; `#/ops` lista as OPs (Lote, status, itens, data).
- [ ] 6. "Nova OP" sugere número = último do ano + 1.
- [ ] 7. Adicionar/editar itens recalcula o painel ao vivo.
- [ ] 8. Remover último item zera o painel.
- [ ] 9. "Abrir OP" desabilitado até os 4 fornecedores estarem escolhidos.
- [ ] 10. "Salvar simulação" grava status `simulada` e **não** gera `ordens_compra_fio`.
- [ ] 11. "Abrir OP" grava `aberta` e gera as `ordens_compra_fio` corretas (conferir no Supabase).
- [ ] 12. Reabrir uma `simulada` recarrega itens/fornecedores; salvar substitui os filhos.
- [ ] 13. OP `aberta`/`em_producao`/`finalizada` abre em leitura (campos desabilitados, sem botões).
- [ ] 14. Número/ano duplicado → mensagem "Já existe OP nº X em <ano>".

## Resultado
(preencher após execução: X/14)
```

- [ ] **Step 3: Rodar os testes automatizados**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: PASS — 9 testes. Marcar itens 1-4 do checklist.

- [ ] **Step 4: Commit**

```bash
git add docs/qa/fase3-checklist.md
git commit -m "docs(qa): checklist da Fase 3"
```

---

## Task 8: Atualizar STATUS.md e finalizar

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 1: Atualizar `STATUS.md`**

Localizar a seção da Fase 3 em `STATUS.md` e marcá-la como implementada / aguardando QA do Vinícius (seguir o formato usado para a Fase 2 no mesmo arquivo). Incluir: telas Lista de OPs e Nova OP com cálculo ao vivo, salvar simulação / abrir OP com geração de ordens de compra; testes da lógica pura via `node --test`.

- [ ] **Step 2: Verificar suite completa antes de fechar**

Run: `cd "/Users/viniciuscgiansante/Documents/Controle Tapetes Murilo" && node --test tests/`
Expected: PASS — 9 testes.

- [ ] **Step 3: Commit**

```bash
git add STATUS.md
git commit -m "docs(status): Fase 3 implementada, aguardando QA"
```

- [ ] **Step 4: QA manual final**

Percorrer os itens 5-14 do checklist `docs/qa/fase3-checklist.md` no site (local ou após push para GitHub Pages) e registrar o resultado. Bugs não-bloqueantes vão para `docs/qa/fase3-bugs-pendentes.md` (criar se necessário), seguindo o padrão da Fase 2.

---

## Self-review (preenchido na escrita do plano)

- **Cobertura do spec:** §3 telas/rotas → Tasks 3,4,5,7; §4 cálculo → Tasks 1,2; §5 persistência/ordens/lote → Task 6; §6 validações/leitura/duplicado/rollback → Tasks 5,6,7; §7 testes → Tasks 1,2,7; §8 arquivos → todas. Sem lacunas.
- **Consistência de tipos:** `calcularFiosOP` retorna `{algodaoPorCor:{[corId]:{corId,corNome,kg}}, poliester:{PRETO,BRANCO}}` — usado igual em testes, painel e `montarOrdensCompraFio`. `montarOrdensCompraFio` retorna `{tipo,cor_id,cor_poliester,kg_pedido}` — campos batem com a tabela `ordens_compra_fio` e com o map de `persistir`. `larguraKey` usado para montar e consultar `parametrosByLargura`.
- **Placeholders:** nenhum "TBD/TODO"; os "placeholders de botões" da Task 5 são intencionais e substituídos explicitamente na Task 6.
