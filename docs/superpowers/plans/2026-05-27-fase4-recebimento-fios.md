# Fase 4 — Recebimento de fios + recálculo automático — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o ciclo do fio: o fornecedor registra o kg recebido de cada ordem, o sistema recalcula os metros produzíveis pelo fator-gargalo, propõe o ajuste ao admin, grava `metros_ajustados` + saldo e move a OP para `em_producao`.

**Architecture:** SPA vanilla JS num único `index.html` (script inline) + módulo puro `js/calculo-op.js` (testável com `node --test`) + Supabase (Postgres/RLS). A lógica de recálculo é uma função pura nova (`recalcularOP`). A UI segue a Abordagem A: tela nova do fornecedor (`#/fornecedor/ordens`) e um bloco de recebimento/proposta dentro do detalhe da OP (`screenNovaOP`, `#/ops/:id`).

**Tech Stack:** HTML/CSS (Tailwind via CDN) + JavaScript vanilla, Supabase JS client (`supa`), helpers próprios (`el`, `toast`, `dataTable`, `formField`, `textInput`, `selectInput`, `pageHeader`, `shellLayout`). Testes com `node --test`.

**Referências:**
- Spec: `docs/superpowers/specs/2026-05-27-fase4-recebimento-fios-design.md`
- Schema: `db/01_schema.sql` (tabelas `ordens_compra_fio`, `op_itens`, `saldo_fios`, `saldo_fios_op`)
- RLS já existente (`db/03_policies.sql`): `ocf_fornecedor_update`, `op_itens_admin`, `saldo_fios_admin`, `saldo_fios_op_admin`, update de `ops` por admin — **nenhum SQL novo é necessário**.
- Idioma: tudo em português brasileiro (UI, mensagens, comentários).

---

## Estrutura de arquivos

- **`js/calculo-op.js`** — adicionar a função pura `recalcularOP` e exportá-la. (~30 linhas novas)
- **`tests/calculo-op.test.js`** — adicionar testes de `recalcularOP` e importá-la. (~60 linhas novas)
- **`index.html`** — script inline:
  - nova função `screenFornecedorOrdens()` (tela do fornecedor)
  - nova rota `#/fornecedor/ordens` + redirect de login + menu do fornecedor
  - dentro de `screenNovaOP`: estender o carregamento (ids de `op_itens` + `ordens_compra_fio`), adicionar `buildBlocoFios()` e `aplicarRecalculo()`
- **`docs/qa/fase4-checklist.md`** — novo checklist de QA.
- **`docs/superpowers/STATUS.md`** e **memory** — atualizar ao final.

---

## Task 1: Função pura `recalcularOP` + testes (TDD)

**Files:**
- Modify: `js/calculo-op.js` (adicionar função + export, perto de `montarOrdensCompraFio`)
- Test: `tests/calculo-op.test.js`

- [ ] **Step 1: Escrever os testes que falham**

Adicionar ao topo de `tests/calculo-op.test.js` o import (trocar a linha de require existente):

```js
const { calcularFiosOP, larguraKey, montarOrdensCompraFio, recalcularOP } = require('../js/calculo-op.js');
```

Adicionar ao final do arquivo:

```js
test('recalcularOP fator < 1 escala metros pra baixo e gera saldo da cor não-gargalo', () => {
  const itens = [{ op_item_id: 10, metros_pedidos: 200 }];
  const ordens = [
    { id: 1, tipo: 'algodao', cor_id: 1, cor_poliester: null, kg_pedido: 10, kg_recebido: 10 },
    { id: 2, tipo: 'algodao', cor_id: 2, cor_poliester: null, kg_pedido: 10, kg_recebido: 5 },
  ];
  const r = recalcularOP(itens, ordens);
  assert.strictEqual(r.fator, 0.5);
  assert.strictEqual(r.itens[0].metros_ajustados, 100);
  assert.strictEqual(r.itens[0].metros_pedidos, 200);
  // ordem 1 sobra 10 - 0.5*10 = 5; ordem 2 (gargalo) sobra 0 -> não entra
  assert.strictEqual(r.sobras.length, 1);
  assert.deepStrictEqual(r.sobras[0], { ordem_id: 1, tipo: 'algodao', cor_id: 1, cor_poliester: null, kg_sobra: 5 });
});

test('recalcularOP fator > 1 escala metros pra cima', () => {
  const itens = [{ op_item_id: 10, metros_pedidos: 100 }];
  const ordens = [
    { id: 1, tipo: 'poliester', cor_id: null, cor_poliester: 'PRETO', kg_pedido: 10, kg_recebido: 20 },
    { id: 2, tipo: 'poliester', cor_id: null, cor_poliester: 'BRANCO', kg_pedido: 10, kg_recebido: 15 },
  ];
  const r = recalcularOP(itens, ordens);
  assert.strictEqual(r.fator, 1.5);
  assert.strictEqual(r.itens[0].metros_ajustados, 150);
  // ordem 1 sobra 20 - 1.5*10 = 5; ordem 2 (gargalo) sobra 0
  assert.strictEqual(r.sobras.length, 1);
  assert.strictEqual(r.sobras[0].ordem_id, 1);
  assert.strictEqual(r.sobras[0].kg_sobra, 5);
});

test('recalcularOP fator = 1 não ajusta e não gera saldo', () => {
  const itens = [{ op_item_id: 10, metros_pedidos: 120 }];
  const ordens = [
    { id: 1, tipo: 'algodao', cor_id: 1, cor_poliester: null, kg_pedido: 7, kg_recebido: 7 },
    { id: 2, tipo: 'poliester', cor_id: null, cor_poliester: 'PRETO', kg_pedido: 8, kg_recebido: 8 },
  ];
  const r = recalcularOP(itens, ordens);
  assert.strictEqual(r.fator, 1);
  assert.strictEqual(r.itens[0].metros_ajustados, 120);
  assert.strictEqual(r.sobras.length, 0);
});

test('recalcularOP arredonda metros a 2 casas e sobra a 3 casas', () => {
  const itens = [{ op_item_id: 10, metros_pedidos: 100 }];
  const ordens = [
    { id: 1, tipo: 'algodao', cor_id: 1, cor_poliester: null, kg_pedido: 3, kg_recebido: 1 },   // ratio 0.3333
    { id: 2, tipo: 'algodao', cor_id: 2, cor_poliester: null, kg_pedido: 3, kg_recebido: 3 },
  ];
  const r = recalcularOP(itens, ordens);
  // fator = 1/3 ; metros = round2(100/3) = 33.33
  assert.strictEqual(r.itens[0].metros_ajustados, 33.33);
  // ordem 2 sobra = round3(3 - (1/3)*3) = round3(2) = 2
  assert.strictEqual(r.sobras[0].kg_sobra, 2);
});

test('recalcularOP sem ordens mantém metros (fator 1)', () => {
  const r = recalcularOP([{ op_item_id: 10, metros_pedidos: 50 }], []);
  assert.strictEqual(r.fator, 1);
  assert.strictEqual(r.itens[0].metros_ajustados, 50);
  assert.strictEqual(r.sobras.length, 0);
});
```

- [ ] **Step 2: Rodar os testes e ver falhar**

Run: `node --test tests/calculo-op.test.js`
Expected: FAIL — `recalcularOP is not a function` (os 5 testes novos falham; os 9 antigos continuam passando).

- [ ] **Step 3: Implementar `recalcularOP`**

Em `js/calculo-op.js`, adicionar logo após a função `montarOrdensCompraFio` (antes do bloco `module.exports`):

```js
// Recalcula a OP a partir do fio realmente recebido (fator-gargalo).
// A cor de fio com menor (kg_recebido / kg_pedido) define o quanto a OP escala.
// itens:  [{ op_item_id, metros_pedidos }]
// ordens: [{ id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido }]
// Retorna: { fator, itens:[{op_item_id, metros_pedidos, metros_ajustados}],
//            sobras:[{ordem_id, tipo, cor_id, cor_poliester, kg_sobra}] }  (só sobras > 0)
function recalcularOP(itens, ordens) {
  const round2 = (n) => Math.round(n * 100) / 100;
  const round3 = (n) => Math.round(n * 1000) / 1000;

  let fator = Infinity;
  for (const o of ordens) {
    const ratio = Number(o.kg_recebido) / Number(o.kg_pedido);
    if (ratio < fator) fator = ratio;
  }
  if (!Number.isFinite(fator)) fator = 1; // sem ordens: nada a ajustar

  const itensOut = itens.map((i) => ({
    op_item_id: i.op_item_id,
    metros_pedidos: Number(i.metros_pedidos),
    metros_ajustados: round2(Number(i.metros_pedidos) * fator),
  }));

  const sobras = [];
  for (const o of ordens) {
    const kgSobra = round3(Number(o.kg_recebido) - fator * Number(o.kg_pedido));
    if (kgSobra > 0) {
      sobras.push({
        ordem_id: o.id,
        tipo: o.tipo,
        cor_id: o.cor_id ?? null,
        cor_poliester: o.cor_poliester ?? null,
        kg_sobra: kgSobra,
      });
    }
  }

  return { fator, itens: itensOut, sobras };
}
```

E atualizar o export no final do arquivo:

```js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { larguraKey, calcularFiosOP, montarOrdensCompraFio, recalcularOP };
}
```

- [ ] **Step 4: Rodar os testes e ver passar**

Run: `node --test tests/calculo-op.test.js`
Expected: PASS — 14 testes (9 antigos + 5 novos), 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/calculo-op.js tests/calculo-op.test.js
git commit -m "feat(fase4): recalcularOP (fator-gargalo) com testes"
```

---

## Task 2: Tela do fornecedor — `#/fornecedor/ordens`

**Files:**
- Modify: `index.html` (nova função `screenFornecedorOrdens`; rota; redirect de login; menu)

- [ ] **Step 1: Adicionar a função `screenFornecedorOrdens`**

Em `index.html`, logo após a função `screenFornecedorHome` (que termina em `}` perto da linha 420), inserir:

```js
// Rótulo do fio de uma ordem de compra.
function rotuloFio(ordem) {
  if (ordem.tipo === 'algodao') return 'Algodão — ' + (ordem.cores?.nome || '?');
  return 'Poliéster — ' + (ordem.cor_poliester || '?');
}

const OCF_STATUS_LABEL = {
  pendente: 'Pendente', recebido_parcial: 'Recebido (parcial)', recebido_total: 'Recebido',
};

async function screenFornecedorOrdens() {
  const container = el('div', {});

  async function reload() {
    if (!CURRENT_USER.fornecedor_id) {
      container.replaceChildren(
        pageHeader('Minhas ordens'),
        el('div', { class: 'bg-white rounded-xl shadow p-8 text-center text-gray-500' },
          'Seu usuário não está vinculado a um fornecedor. Fale com o administrador.')
      );
      return;
    }
    const { data, error } = await supa.from('ordens_compra_fio')
      .select('id, tipo, cor_poliester, kg_pedido, kg_recebido, data_recebimento, status, ops(numero, ano), cores:cor_id(id, nome)')
      .order('id', { ascending: true });
    if (error) { toast('Erro ao carregar ordens', 'error'); console.error(error); return; }
    render(data || []);
  }

  function lote(ordem) { return ordem.ops ? `Nº ${ordem.ops.numero}/${ordem.ops.ano}` : '—'; }
  const fmtKg = (n) => (n == null ? '—' : Number(n).toFixed(3).replace('.', ',') + ' kg');

  function linhaPendente(ordem) {
    const kgInput = textInput({ type: 'number', step: '0.001', value: String(ordem.kg_pedido) });
    const dataInput = textInput({ type: 'date', value: new Date().toISOString().slice(0, 10) });
    const btn = el('button', {
      class: 'bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg px-3 py-2',
      onclick: async () => {
        const kg = Number(kgInput.value);
        if (!(kg > 0)) { toast('Informe o kg recebido', 'error'); return; }
        const dataRec = dataInput.value || new Date().toISOString().slice(0, 10);
        const status = kg < Number(ordem.kg_pedido) ? 'recebido_parcial' : 'recebido_total';
        btn.disabled = true;
        const { error } = await supa.from('ordens_compra_fio')
          .update({ kg_recebido: kg, data_recebimento: dataRec, status })
          .eq('id', ordem.id);
        if (error) { toast('Erro ao registrar recebimento', 'error'); console.error(error); btn.disabled = false; return; }
        toast('Recebimento registrado', 'success');
        reload();
      }
    }, 'Registrar');

    return el('div', { class: 'flex flex-wrap items-end gap-3 border-b py-3' },
      el('div', { class: 'flex-1 min-w-[160px]' },
        el('div', { class: 'text-xs text-gray-500' }, lote(ordem)),
        el('div', { class: 'font-medium text-gray-800' }, rotuloFio(ordem)),
        el('div', { class: 'text-xs text-gray-500' }, 'Pedido: ' + fmtKg(ordem.kg_pedido)),
      ),
      el('div', { class: 'w-32' }, formField({ label: 'Kg recebido', input: kgInput })),
      el('div', { class: 'w-40' }, formField({ label: 'Data', input: dataInput })),
      btn,
    );
  }

  function render(rows) {
    const pendentes = rows.filter(r => r.data_recebimento == null);
    const recebidas = rows.filter(r => r.data_recebimento != null);

    const blocos = [pageHeader('Minhas ordens')];

    blocos.push(el('div', { class: 'bg-white rounded-xl shadow p-5 mb-6' },
      el('div', { class: 'font-semibold text-gray-700 mb-2' }, 'Pendentes'),
      pendentes.length === 0
        ? el('p', { class: 'text-sm text-gray-400' }, 'Nenhuma ordem pendente.')
        : el('div', {}, pendentes.map(linhaPendente)),
    ));

    blocos.push(el('div', { class: 'bg-white rounded-xl shadow p-5' },
      el('div', { class: 'font-semibold text-gray-700 mb-2' }, 'Recebidas'),
      recebidas.length === 0
        ? el('p', { class: 'text-sm text-gray-400' }, 'Nenhuma ordem recebida ainda.')
        : dataTable({
            columns: [
              { key: 'lote', label: 'Lote', render: lote },
              { key: 'fio', label: 'Fio', render: rotuloFio },
              { key: 'kg_pedido', label: 'Pedido', render: (r) => fmtKg(r.kg_pedido) },
              { key: 'kg_recebido', label: 'Recebido', render: (r) => fmtKg(r.kg_recebido) },
              { key: 'data', label: 'Data', render: (r) => new Date(r.data_recebimento + 'T00:00:00').toLocaleDateString('pt-BR') },
              { key: 'status', label: 'Status', render: (r) => OCF_STATUS_LABEL[r.status] || r.status },
            ],
            rows: recebidas,
          }),
    ));

    container.replaceChildren(...blocos);
  }

  await reload();
  return shellLayout([{ href: '#/fornecedor/ordens', label: 'Minhas ordens' }], container);
}
```

- [ ] **Step 2: Registrar a rota**

Em `index.html`, no objeto `routes` (perto da linha 280), trocar a entrada do fornecedor por:

```js
  '#/fornecedor/home': { render: screenFornecedorHome, roles: ['fornecedor'] },
  '#/fornecedor/ordens': { render: screenFornecedorOrdens, roles: ['fornecedor'] },
```

- [ ] **Step 3: Repontar o redirect de login**

Em `index.html`, na função que roteia por perfil (perto da linha 360), trocar:

```js
  else navigate('#/fornecedor/home');
```

por:

```js
  else navigate('#/fornecedor/ordens');
```

- [ ] **Step 4: Verificar no navegador**

Subir o site (ver `docs/qa/` para a forma usual) ou abrir o GitHub Pages após deploy. Logar como **fornecedor de fios** (usuário de teste da Fase 1). Confirmar:
- A tela "Minhas ordens" carrega com as seções "Pendentes" e "Recebidas".
- Uma OP `aberta` com ordens daquele fornecedor mostra as ordens em "Pendentes" com kg pré-preenchido = pedido e data = hoje.
- Clicar "Registrar" grava: a ordem some de Pendentes e aparece em Recebidas com o status correto (`Recebido` se kg ≥ pedido, `Recebido (parcial)` se kg < pedido). Conferir no Supabase a linha de `ordens_compra_fio` (kg_recebido, data_recebimento, status).

> Sem testes automatizados aqui (DOM + Supabase). Verificação é manual, como nas Fases 2–3.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat(fase4): tela do fornecedor registra recebimento de fios"
```

---

## Task 3: Carregar ordens/itens e exibir o bloco de recebimento no detalhe da OP

**Files:**
- Modify: `index.html` (dentro de `screenNovaOP`: select de carga, estado, `buildScreen`, novo `buildBlocoFios`)

- [ ] **Step 1: Estender o carregamento da OP**

Em `screenNovaOP`, no `select` de carga da OP (linha ~501), incluir `id` e `metros_ajustados` em `op_itens`. Trocar:

```js
      .select('id, numero, ano, status, op_itens(modelo_id, metros_pedidos), op_fornecedores(fornecedor_id, etapa)')
```

por:

```js
      .select('id, numero, ano, status, op_itens(id, modelo_id, metros_pedidos, metros_ajustados), op_fornecedores(fornecedor_id, etapa)')
```

- [ ] **Step 2: Guardar os itens crus e carregar as ordens**

Em `screenNovaOP`, logo após a linha `readOnly = data.status !== 'simulada';` (linha ~512), e ainda dentro do `if (opId) { ... }`, adicionar:

```js
    opItensRaw = data.op_itens || [];
    if (op.status !== 'simulada') {
      const ordRes = await supa.from('ordens_compra_fio')
        .select('id, tipo, cor_id, cor_poliester, kg_pedido, kg_recebido, status, cores:cor_id(id, nome)')
        .eq('op_id', op.id);
      if (ordRes.error) { toast('Erro ao carregar ordens de fio', 'error'); console.error(ordRes.error); }
      ordens = ordRes.data || [];
    }
```

E declarar as duas variáveis novas junto do estado da tela (perto da linha 494, ao lado de `let fornSel = ...`):

```js
  let opItensRaw = [];
  let ordens = [];
```

- [ ] **Step 3: Pendurar o bloco de fios na tela**

Em `buildScreen()` (linha ~620), após `wrap.appendChild(grid);` e antes de `return wrap;`, adicionar:

```js
    if (op && op.status !== 'simulada') wrap.appendChild(buildBlocoFios());
```

- [ ] **Step 4: Implementar `buildBlocoFios` (exibição)**

Dentro de `screenNovaOP`, adicionar a função (por exemplo logo após `buildLeft`/`buildFornField`, antes de `buildRight`). Esta etapa só **exibe**; os botões chamam `aplicarRecalculo`, criado na Task 4 — deixe a chamada já escrita.

```js
  function fmtKg(n) { return (n == null ? '—' : Number(n).toFixed(3).replace('.', ',') + ' kg'); }
  function fmtMetros(n) { return Number(n).toFixed(2).replace('.', ',') + ' m'; }
  function rotuloFioOrdem(o) {
    return o.tipo === 'algodao' ? 'Algodão — ' + (o.cores?.nome || '?') : 'Poliéster — ' + (o.cor_poliester || '?');
  }

  function buildBlocoFios() {
    const box = el('div', { class: 'bg-white rounded-xl shadow p-5 mt-6' });
    box.appendChild(el('div', { class: 'font-semibold text-gray-700 mb-3' }, 'Recebimento de fios'));

    // Tabela de ordens (sempre visível quando não-simulada)
    box.appendChild(dataTable({
      columns: [
        { key: 'fio', label: 'Fio', render: rotuloFioOrdem },
        { key: 'kg_pedido', label: 'Pedido', render: (o) => fmtKg(o.kg_pedido) },
        { key: 'kg_recebido', label: 'Recebido', render: (o) => o.kg_recebido == null ? 'aguardando' : fmtKg(o.kg_recebido) },
        { key: 'status', label: 'Status', render: (o) => OCF_STATUS_LABEL[o.status] || o.status },
      ],
      rows: ordens,
    }));

    const todasRecebidas = ordens.length > 0 && ordens.every(o => o.kg_recebido != null);

    if (op.status === 'aberta') {
      if (!todasRecebidas) {
        const faltam = ordens.filter(o => o.kg_recebido == null).length;
        box.appendChild(el('p', { class: 'text-sm text-amber-700 mt-3' },
          `Aguardando recebimento de ${faltam} fio(s) para calcular a proposta de ajuste.`));
        return box;
      }
      box.appendChild(buildProposta());
    } else {
      // em_producao / finalizada: mostra metros aplicados (leitura)
      box.appendChild(el('div', { class: 'font-semibold text-gray-700 mt-4 mb-2' }, 'Metros de produção'));
      box.appendChild(dataTable({
        columns: [
          { key: 'modelo', label: 'Modelo', render: (i) => modelosById[i.modelo_id]?.nome || ('#' + i.modelo_id) },
          { key: 'metros_pedidos', label: 'Pedido', render: (i) => fmtMetros(i.metros_pedidos) },
          { key: 'metros_ajustados', label: 'Produção', render: (i) => i.metros_ajustados == null ? fmtMetros(i.metros_pedidos) : fmtMetros(i.metros_ajustados) },
        ],
        rows: opItensRaw,
      }));
    }
    return box;
  }

  function buildProposta() {
    const itensCalc = opItensRaw.map(i => ({ op_item_id: i.id, modelo_id: i.modelo_id, metros_pedidos: Number(i.metros_pedidos) }));
    const resultado = recalcularOP(itensCalc, ordens);
    const wrap = el('div', { class: 'mt-4' });

    const semFio = ordens.some(o => Number(o.kg_recebido) <= 0);
    if (semFio) wrap.appendChild(el('p', { class: 'text-sm text-red-600 mb-2' }, 'Atenção: alguma ordem foi recebida com 0 kg.'));

    wrap.appendChild(el('p', { class: 'text-sm text-gray-700 mb-2' },
      'Fator de produção (cor mais escassa): ', el('b', {}, resultado.fator.toFixed(2).replace('.', ','))));

    // Tabela item: pedido -> proposto
    wrap.appendChild(dataTable({
      columns: [
        { key: 'modelo', label: 'Modelo', render: (it) => modelosById[itensCalc.find(c => c.op_item_id === it.op_item_id).modelo_id]?.nome || '?' },
        { key: 'metros_pedidos', label: 'Pedido', render: (it) => fmtMetros(it.metros_pedidos) },
        { key: 'metros_ajustados', label: 'Proposto', render: (it) => fmtMetros(it.metros_ajustados) },
      ],
      rows: resultado.itens,
    }));

    // Sobras
    if (resultado.sobras.length) {
      wrap.appendChild(el('div', { class: 'text-xs uppercase text-gray-500 mt-3 mb-1' }, 'Sobra de fio (vira saldo)'));
      for (const s of resultado.sobras) {
        const nome = s.tipo === 'algodao'
          ? 'Algodão — ' + (ordens.find(o => o.id === s.ordem_id)?.cores?.nome || '?')
          : 'Poliéster — ' + s.cor_poliester;
        wrap.appendChild(el('p', { class: 'text-sm mb-1' }, `${nome}: `, el('b', {}, fmtKg(s.kg_sobra))));
      }
    }

    // Botões
    const btnAceitar = el('button', {
      class: 'bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg px-4 py-2 mt-4 mr-2',
      onclick: () => aplicarRecalculo(resultado, 'aceitar'),
    }, 'Aceitar proposta');
    const btnManter = el('button', {
      class: 'bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg px-4 py-2 mt-4',
      onclick: () => aplicarRecalculo(resultado, 'manter'),
    }, 'Manter pedido');
    wrap.appendChild(el('div', {}, btnAceitar, btnManter));
    return wrap;
  }
```

> `modelosById` já existe no escopo de `screenNovaOP` (usado em `renderRightInto`). `OCF_STATUS_LABEL` foi criado na Task 2.

- [ ] **Step 5: Verificar no navegador**

Logar como **admin**. Abrir uma OP `aberta` (`#/ops/:id`):
- O bloco "Recebimento de fios" aparece com a tabela das ordens.
- Com ordens ainda pendentes: mostra o aviso "Aguardando recebimento de N fio(s)" e **nenhum** botão.
- Após registrar todas (via tela do fornecedor da Task 2): recarregar a OP mostra o fator, a tabela pedido→proposto, as sobras e os botões "Aceitar proposta"/"Manter pedido".
- (Os botões ainda não persistem — isso é a Task 4. Não clicar para validar ainda, ou esperar erro de `aplicarRecalculo is not defined`.)

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(fase4): bloco de recebimento e proposta de ajuste no detalhe da OP"
```

---

## Task 4: Persistir a decisão (aceitar/manter) + liberar produção

**Files:**
- Modify: `index.html` (dentro de `screenNovaOP`: função `aplicarRecalculo`)

- [ ] **Step 1: Implementar `aplicarRecalculo`**

Dentro de `screenNovaOP`, adicionar (perto de `buildProposta`):

```js
  async function aplicarRecalculo(resultado, modo) {
    if (saving) return;
    saving = true;
    try {
      // 1) grava metros_ajustados em cada op_item
      for (const it of resultado.itens) {
        const metros = modo === 'aceitar' ? it.metros_ajustados : it.metros_pedidos;
        const r = await supa.from('op_itens').update({ metros_ajustados: metros }).eq('id', it.op_item_id);
        if (r.error) { toast('Erro ao gravar metros ajustados', 'error'); console.error(r.error); return; }
      }

      // 2) calcula as sobras conforme o modo
      const round3 = (n) => Math.round(n * 1000) / 1000;
      const sobras = modo === 'aceitar'
        ? resultado.sobras
        : ordens.map(o => {
            const kg = round3(Number(o.kg_recebido) - Number(o.kg_pedido));
            return kg > 0
              ? { ordem_id: o.id, tipo: o.tipo, cor_id: o.cor_id ?? null, cor_poliester: o.cor_poliester ?? null, kg_sobra: kg }
              : null;
          }).filter(Boolean);

      // 3) grava saldo por OP + atualiza o totalizador
      for (const s of sobras) {
        const insOp = await supa.from('saldo_fios_op').insert({
          op_id: op.id, cor_id: s.cor_id, cor_poliester: s.cor_poliester, tipo: s.tipo, kg_sobra: s.kg_sobra,
        });
        if (insOp.error) { toast('Erro ao gravar saldo da OP', 'error'); console.error(insOp.error); return; }

        // totalizador saldo_fios: lê (filtrando por cor/tipo), soma e grava
        let sel = supa.from('saldo_fios').select('kg_total').eq('tipo', s.tipo);
        sel = s.cor_id != null ? sel.eq('cor_id', s.cor_id) : sel.is('cor_id', null).eq('cor_poliester', s.cor_poliester);
        const cur = await sel.maybeSingle();
        if (cur.error) { toast('Erro ao ler saldo total', 'error'); console.error(cur.error); return; }
        const novoTotal = round3((cur.data ? Number(cur.data.kg_total) : 0) + s.kg_sobra);

        let saveTotal;
        if (cur.data) {
          let upd = supa.from('saldo_fios').update({ kg_total: novoTotal, atualizado_em: new Date().toISOString() }).eq('tipo', s.tipo);
          upd = s.cor_id != null ? upd.eq('cor_id', s.cor_id) : upd.is('cor_id', null).eq('cor_poliester', s.cor_poliester);
          saveTotal = await upd;
        } else {
          saveTotal = await supa.from('saldo_fios').insert({
            cor_id: s.cor_id, cor_poliester: s.cor_poliester, tipo: s.tipo, kg_total: novoTotal,
          });
        }
        if (saveTotal.error) { toast('Erro ao gravar saldo total', 'error'); console.error(saveTotal.error); return; }
      }

      // 4) libera a produção
      const st = await supa.from('ops').update({ status: 'em_producao' }).eq('id', op.id);
      if (st.error) { toast('Erro ao atualizar status da OP', 'error'); console.error(st.error); return; }

      toast(modo === 'aceitar' ? 'Proposta aceita — produção liberada' : 'Pedido mantido — produção liberada', 'success');
      navigate('#/ops');
    } finally {
      saving = false;
    }
  }
```

> `saving` já existe no escopo de `screenNovaOP` (usado em `salvarSimulacao`/`abrirOP`).

- [ ] **Step 2: Verificar fluxo "Aceitar" no navegador + Supabase**

Pré: uma OP `aberta` com **todas** as ordens recebidas com kg **diferente** do pedido (registrar via tela do fornecedor; deixar pelo menos uma cor sobrando).
1. Como admin, abrir a OP, conferir a proposta, clicar **"Aceitar proposta"**.
2. Esperado: toast "Proposta aceita — produção liberada" e volta pra `#/ops` com a OP em **Em produção**.
3. No Supabase conferir:
   - `op_itens.metros_ajustados` = `metros_pedidos × fator` (arredondado a 2 casas).
   - `saldo_fios_op` tem 1 linha por sobra > 0 da proposta.
   - `saldo_fios` foi incrementado (ou criado) por cor/tipo com o mesmo kg.
   - `ops.status = 'em_producao'`.
4. Reabrir a OP: o bloco agora mostra "Metros de produção" em leitura, **sem** botões.

- [ ] **Step 3: Verificar fluxo "Manter pedido"**

Pré: outra OP `aberta` com todas as ordens recebidas, com pelo menos uma cor com kg recebido **maior** que o pedido.
1. Abrir, clicar **"Manter pedido"**.
2. Esperado: `op_itens.metros_ajustados = metros_pedidos`; `saldo_fios_op` recebe `kg_recebido − kg_pedido` (só onde > 0); `saldo_fios` incrementado; `ops.status = 'em_producao'`.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat(fase4): aplica recalculo (aceitar/manter), grava saldo e libera producao"
```

---

## Task 5: Checklist de QA + atualização de status

**Files:**
- Create: `docs/qa/fase4-checklist.md`
- Modify: `docs/superpowers/STATUS.md`

- [ ] **Step 1: Criar o checklist de QA**

Criar `docs/qa/fase4-checklist.md`:

```markdown
# QA — Fase 4: Recebimento de fios + recálculo automático

Pré-requisitos: logado conforme cada item; OP `aberta` com ordens de fio geradas (Fase 3).

## Cálculo (automatizado — `node --test tests/calculo-op.test.js`)
- [ ] 1. `recalcularOP` fator < 1 escala metros pra baixo e gera saldo.
- [ ] 2. `recalcularOP` fator > 1 escala metros pra cima.
- [ ] 3. `recalcularOP` fator = 1 não ajusta e não gera saldo.
- [ ] 4. Arredondamento: metros 2 casas, sobra 3 casas.

## Fornecedor (manual no site, logado como fornecedor de fios)
- [ ] 5. Menu "Minhas ordens"; tela lista Pendentes e Recebidas.
- [ ] 6. Registrar recebimento (kg + data) move a ordem para Recebidas com status correto (parcial se kg < pedido).
- [ ] 7. Usuário sem fornecedor vinculado vê estado vazio amigável.

## Admin (manual no site, logado como admin)
- [ ] 8. OP `aberta` mostra o bloco "Recebimento de fios" com a tabela das ordens.
- [ ] 9. Com ordens pendentes: aviso "Aguardando recebimento de N fio(s)", sem botões.
- [ ] 10. Todas recebidas: mostra fator, tabela pedido→proposto e sobras.
- [ ] 11. "Aceitar proposta": grava `metros_ajustados = pedido × fator`, `saldo_fios_op`/`saldo_fios`, OP → `em_producao` (conferir no Supabase).
- [ ] 12. "Manter pedido": `metros_ajustados = metros_pedidos`, saldo = `recebido − pedido` (>0), OP → `em_producao`.
- [ ] 13. OP `em_producao` abre o bloco em leitura (metros aplicados, sem botões).

## Resultado
(preencher após execução: X/13)
```

- [ ] **Step 2: Atualizar STATUS.md**

Em `docs/superpowers/STATUS.md`, mudar o cabeçalho "Fase atual" para a Fase 5 e adicionar a Fase 4 em "Fases concluídas" (seguir o formato das fases anteriores: o que foi implementado + resultado do QA). Marcar a Fase 5 (Tecelagem e látex) como próxima.

- [ ] **Step 3: Commit**

```bash
git add docs/qa/fase4-checklist.md docs/superpowers/STATUS.md
git commit -m "docs(fase4): checklist de QA e atualizacao de status"
```

---

## Verificação final

- [ ] `node --test tests/calculo-op.test.js` → 14 testes passando (9 antigos + 5 de `recalcularOP`).
- [ ] QA manual dos itens 5–13 do `docs/qa/fase4-checklist.md` (fornecedor + admin no site).
- [ ] Atualizar a memória do projeto (fase atual → Fase 5) ao concluir o QA.
