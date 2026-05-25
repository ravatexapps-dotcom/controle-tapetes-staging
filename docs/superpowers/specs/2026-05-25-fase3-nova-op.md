# Design — Fase 3: Nova OP com cálculo ao vivo

**Data:** 2026-05-25
**Autor:** Vinícius Giansante (proprietário) + Claude (assistente)
**Fase:** 3 — Admin: Nova OP com cálculo ao vivo
**Depende de:** Fase 2 (Admin Cadastros) concluída — cores, modelos, parâmetros, fornecedores, preços e usuários cadastráveis.
**Referência:** `docs/superpowers/specs/2026-05-16-controle-tapetes-design.md` §5 (cálculo) e §F3 (fluxo de criação de OP).

## 1. Objetivo

Permitir que o admin crie uma Ordem de Produção (OP) montando itens (modelo × metros) e veja, **ao vivo**, quanto de fio precisa comprar por cor. A OP pode ser salva como **simulação** (rascunho) ou **aberta** (compromisso real, que gera as ordens de compra de fio automaticamente).

## 2. Escopo

**Inclui:**
- Tela **Nova OP** (`#/ops/nova`) e edição de simulação (`#/ops/{id}/editar`) — layout de página única com painel lateral de cálculo ao vivo.
- **Lista de OPs** (`#/ops`) — tabela com Lote, status, ações.
- Cálculo ao vivo de **kg de fio por cor** (algodão por cor dos modelos + poliéster PRETO/BRANCO).
- Salvar como `simulada` (sem gerar ordens) ou abrir como `aberta` (gera `ordens_compra_fio`).
- Reabrir/editar OPs `simulada`; abrir em leitura as demais.

**Não inclui (fases futuras):**
- Cálculo de **custos** (tecelagem/látex) ou **preço final** de venda — o cálculo desta fase é só consumo de fio (kg), fiel ao §5. Não há preço de fio por kg no schema.
- Recebimento de fio e recálculo de metros (Fase 4).
- Etapas de tecelagem/látex e entregas (Fase 5).
- Fechamento de OP (Fase 6).

## 3. Telas e rotas

Tudo dentro do `index.html` existente, seguindo o padrão das telas CRUD da Fase 2. Adicionar **"OPs"** ao `ADMIN_MENU`.

### `#/ops` — Lista de OPs
- Tabela: **Lote** (`Nº 12/2026`), **Status** (badge: simulada=cinza, aberta=azul, em_producao=âmbar, finalizada=verde), **Itens** (qtd de linhas), **Criada em**, **Ações**.
- Ordenação: ano desc, número desc.
- Botão **"Nova OP"** no topo direito → `#/ops/nova`.
- Ação por linha: `simulada` → "Editar"; demais → "Ver" (leitura).
- Estado vazio: "Nenhuma OP ainda. Crie a primeira."

### `#/ops/nova` e `#/ops/{id}/editar` — Tela Nova OP
Uma única função `screenNovaOP(opId?)` cobre criação e edição. Layout de **página única**:

- **Coluna esquerda:**
  - Campos de **Lote**: número e ano (editáveis; sugestão automática em criação).
  - **Itens**: lista de linhas (select de modelo + input de metros), com adicionar/remover.
  - **Fornecedores**: 4 selects (algodão, poliéster, tecelagem, látex), cada um filtrado pelo `tipo` correspondente em `fornecedores`.
- **Coluna direita (painel fixo):**
  - Resumo de **kg de fio por cor**, recalculado a cada mudança nos itens.
  - Rodapé com botões **"Salvar simulação"** e **"Abrir OP"**.

## 4. Cálculo (função pura)

Extrair `calcularFiosOP(itens, modelosById, parametrosByLargura)` no escopo global, **sem DOM**, para ser testável isoladamente.

Para cada item (modelo × metros), usando `parametros_largura` da largura do modelo:

```
kg_algodao[cor_1] += algodao_por_ml × valor_x × metros
kg_algodao[cor_2] += algodao_por_ml × valor_x × metros
kg_poliester[PRETO]  += poliester_por_ml × valor_x × metros
kg_poliester[BRANCO] += poliester_por_ml × valor_x × metros
```

Retorna:
```js
{
  algodaoPorCor: { BRANCO: 0.123, PRETO: 0.123, ... },  // somado entre itens, agrupado por nome de cor
  poliester:     { PRETO: 0.147, BRANCO: 0.147 }         // sempre as duas cores, mesmo que zero
}
```

O painel direito renderiza esse objeto. Poliéster aparece **sempre** com PRETO e BRANCO.

## 5. Persistência

Sem transação no client Supabase — inserções em ordem, com reversão manual em caso de falha (ver §6).

### Salvar simulação (`status = 'simulada'`)
- `INSERT` (criação) ou `UPDATE` (edição) em `ops` com `numero`, `ano`, `status='simulada'`.
- Substitui `op_itens` (delete das linhas existentes + insert das atuais).
- Substitui `op_fornecedores` (apenas as etapas que foram escolhidas).
- **Não** gera `ordens_compra_fio`.

### Abrir OP (`status = 'aberta'`)
- Tudo acima, porém `status='aberta'`.
- Gera `ordens_compra_fio` automaticamente:
  - **1 ordem por cor de algodão distinta** presente nos modelos: `tipo='algodao'`, `cor_id` da cor, `kg_pedido` = soma daquela cor, `fornecedor_id` = o escolhido para `fio_algodao`.
  - **1 ordem poliéster PRETO + 1 BRANCO**: `tipo='poliester'`, `cor_poliester`, `kg_pedido` = soma, `fornecedor_id` = o escolhido para `fio_poliester`.
  - Todas com `status='pendente'`, `data_pedido` = hoje.

### Sugestão de Lote
Em criação, sugerir `numero = max(numero do ano corrente) + 1` e `ano` = ano atual; ambos editáveis.

## 6. Validações e casos de borda

**Salvar simulação** (permissivo):
- Pelo menos 1 item com modelo e metros > 0.
- Fornecedores opcionais.
- Número e ano obrigatórios.

**Abrir OP** (rigoroso):
- Pelo menos 1 item válido.
- Os 4 fornecedores escolhidos. Botão desabilitado até completar, com aviso do que falta.
- Número/ano únicos no ano (`UNIQUE(numero, ano)` no schema) — erro tratado com mensagem amigável: "Já existe OP nº X em 2026".

**Casos de borda:**
- **Editar `simulada`:** recarrega itens/fornecedores no wizard; salvar substitui (delete+insert) os filhos.
- **OP `aberta`/`em_producao`/`finalizada`:** abre em **leitura** (campos desabilitados, sem botões de salvar) — protege ordens de compra já geradas.
- **Item duplicado** (mesmo modelo 2×): permitido; metros somam no cálculo.
- **Modelo sem `parametros_largura`:** não deve ocorrer (schema restringe larguras a 1.40/2.10 e o seed cobre ambas); se faltar, exibir erro e bloquear o cálculo daquele item.
- **Remover último item:** painel zera; botões de salvar desabilitados.
- **Falha ao abrir OP** (ex.: `ops` criada mas `ordens_compra_fio` falhou): reverter `ops.status` para `simulada` e avisar — evita OP "aberta" sem ordens.

## 7. Testes

O projeto mantém a stack "sem build" (vanilla JS, sem runner configurado). Estratégia, coerente com a Fase 2:

- Função pura `calcularFiosOP(...)` isolada no escopo global, testável manualmente via console e candidata a runner futuro.
- `docs/qa/fase3-checklist.md` com cenários:
  1. 1 item 1,40 / 200 m → kg de algodão por cor e poliéster conferem com a fórmula.
  2. 2 itens de larguras diferentes → soma por cor correta.
  3. Poliéster sempre lista PRETO e BRANCO (mesmo zero).
  4. Abrir OP gera o número correto de `ordens_compra_fio` (1 por cor de algodão + PRETO + BRANCO).
  5. Salvar simulação **não** gera ordens.
  6. Editar simulada recarrega e substitui itens/fornecedores.
  7. OP aberta abre em leitura (sem salvar).
  8. Número/ano duplicado bloqueado com mensagem amigável.
  9. "Abrir OP" desabilitado sem os 4 fornecedores.
- Validação manual no site após deploy (GitHub Pages), como na Fase 2.

## 8. Arquivos afetados

- `index.html` — `ADMIN_MENU` (+ "OPs"); rotas `#/ops`, `#/ops/nova`, `#/ops/{id}/editar`; funções `screenListaOPs`, `screenNovaOP`, bloco `// === CÁLCULO OP ===` com `calcularFiosOP`.
- `docs/qa/fase3-checklist.md` — novo checklist de QA.
- `STATUS.md` — atualizar para Fase 3.

Nenhuma mudança de schema necessária — as tabelas `ops`, `op_itens`, `op_fornecedores` e `ordens_compra_fio` já existem (Fase 1).
