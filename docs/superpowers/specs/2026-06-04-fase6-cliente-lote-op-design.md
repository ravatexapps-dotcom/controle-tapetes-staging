# Design — Fase 6: Cliente, Lote, fornecedores de fio sob demanda, % e PDF

**Data:** 2026-06-04
**Escopo:** 5 mudanças coesas em torno da OP (uma spec, plano em fases).

## Objetivo / contexto

Cinco ajustes pedidos pelo usuário:
1. Abrir uma OP não exige mais os fornecedores de **fio**; eles são atribuídos depois, no detalhe da OP. (Tecelagem continua obrigatória.)
2. A OP passa a ter um **Cliente**.
3. A OP passa a ter um **Lote** (número sequencial automático), vinculado ao cliente. A primeira OP do serviço cria o lote; OPs subsequentes (látex, geradas automaticamente) herdam o mesmo lote/cliente.
4. A lista de OPs mostra uma **barra de % entregue** por OP.
5. Botão no detalhe da OP que **gera um PDF** da lista de compra de fios, separado por Algodão e Poliéster.

Estado atual relevante: abrir OP exige 3 fornecedores (algodão, poliéster, tecelagem) e gera `ordens_compra_fio` com `fornecedor_id` NOT NULL; fornecedor de fio loga e registra kg (RLS `ocf_fornecedor_read` = `fornecedor_id = meu_fornecedor_id()`); não há tabela `clientes`.

## Decisões (acordadas no brainstorming)

1. **Fornecedor de fio:** atribuído pelo **admin depois**, no detalhe da OP. A ordem nasce sem fornecedor; ao atribuir, o fornecedor logado passa a ver e registrar.
2. **Tecelagem:** continua **obrigatória** ao abrir a OP (só os fios viram opcionais).
3. **Lote:** é um cadastro implícito (tabela `lotes` = número + cliente), criado ao salvar a primeira OP manual. Número **automático sequencial global**. **Cada OP manual inicia um lote novo**; só as OPs de látex (automáticas) herdam o lote/cliente da origem.
4. **PDF:** download direto via **jsPDF (CDN)**.

## 1. Modelo de dados

Migração idempotente `db/09_fase6_cliente_lote.sql`:

- **`clientes`**: `id BIGSERIAL PK`, `nome TEXT NOT NULL UNIQUE`, `criado_em TIMESTAMPTZ DEFAULT now()`.
- **`lotes`**: `id BIGSERIAL PK`, `numero INTEGER NOT NULL UNIQUE`, `cliente_id BIGINT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT`, `criado_em`.
- **`ops.lote_id`**: `BIGINT REFERENCES lotes(id) ON DELETE SET NULL` (nullable — OPs antigas ficam sem lote). Cliente é derivado por `lote → cliente`.
- **`ordens_compra_fio.fornecedor_id`**: dropar o `NOT NULL` (vira nullable). FK e CHECKs existentes mantidos.
- RLS: `clientes` e `lotes` com policies **admin-only** (`FOR ALL USING(is_admin()) WITH CHECK(is_admin())`), ambas com `ENABLE ROW LEVEL SECURITY`. Fornecedores não precisam ler cliente/lote (telas deles seguem mostrando Nº da OP).
- **`gerar_op_latex`** (recriada via `CREATE OR REPLACE`): ao inserir a OP de látex, também copia `lote_id` da OP de origem (`SELECT lote_id FROM ops WHERE id = v_op_id`).

Compatibilidade: tudo nullable/idempotente; OPs e ordens já existentes permanecem válidas.

## 2. Cliente + Lote no fluxo da OP

- **Cadastro de Clientes**: nova tela `#/cadastros/clientes` (espelha `screenCadastrosCores`: listar/criar/editar/excluir, campo `nome`), rota registrada e item adicionado ao `ADMIN_MENU`.
- **`screenNovaOP`**: novo campo **Cliente** (select), obrigatório para salvar (simulação ou abrir). Ao salvar uma OP manual pela primeira vez, cria o lote (`numero` = `MAX(numero)+1` em `lotes`, `cliente_id`) e grava `ops.lote_id`. Cliente editável enquanto `simulada` (atualiza `lotes.cliente_id` do lote daquela OP); read-only depois. Número do lote nunca é editado.
- **Exibição**: detalhe da OP mostra "Lote Nº X · Cliente Y" no cabeçalho; lista de OPs ganha colunas **Lote** e **Cliente** (query traz `lote:lote_id(numero, cliente:cliente_id(nome))`). OPs de látex aparecem com o lote/cliente herdado.
- OPs antigas sem `lote_id` mostram "—".

> Tradeoff aceito: como o lote nasce no primeiro salvamento (inclusive simulação), descartar uma simulação deixa um gap na numeração de lote. Aceitável no volume atual.

## 3. Fornecedores de fio opcionais + atribuição na OP

- **`abrirOP`**: requisitos passam a ser **cliente + fornecedor de tecelagem** (checks `faltam`/`faltamForn` olham só `cima`). O form de criação mantém só o select de tecelagem (selects de algodão/poliéster removidos da criação). A abertura gera `ordens_compra_fio` (kg por cor) com `fornecedor_id = NULL`; `op_fornecedores` criado só para `cima`.
- **Detalhe da OP, bloco "Recebimento de fios"**: dois selects no topo — **Fornecedor de algodão** e **Fornecedor de poliéster** (pré-preenchidos se já atribuídos). Ao salvar um deles:
  1. `UPDATE ordens_compra_fio SET fornecedor_id = <sel> WHERE op_id = <op> AND tipo = '<algodao|poliester>'`;
  2. upsert `op_fornecedores(op_id, fornecedor_id, etapa)` (`'fio_algodao'`/`'fio_poliester'`) — `ON CONFLICT (op_id, fornecedor_id, etapa) DO NOTHING` (e remover vínculo antigo do mesmo etapa se trocar o fornecedor).
- O fluxo de recebimento de kg segue igual (fornecedor logado ou admin). Granularidade por tipo (um fornecedor de algodão, um de poliéster).
- OPs já abertas (com fornecedor e ordens preenchidos) seguem funcionando; selects pré-preenchidos.

## 4. % entregue na lista de OPs

- Cada linha ganha uma barra de progresso com a % entregue.
- Função pura `percentualEntregueOP(opItens, entregaItensDaOP)` em `js/calculo-op.js`:
  - `meta = Σ(metros_ajustados ?? metros_pedidos)` dos `opItens`.
  - `feito = Σ(metros_entregues)` dos `entregaItensDaOP` com `defeito` falso.
  - retorna `meta > 0 ? min(100, round(feito/meta*100)) : 0`.
- `screenListaOPs` passa a trazer `op_itens(id, metros_pedidos, metros_ajustados)` e uma query `entrega_itens(op_id, metros_entregues, defeito)` agrupada por `op_id` em memória; a barra usa `percentualEntregueOP(op.op_itens, itensPorOpId[op.id] || [])`.
- Vale pros dois tipos: cada OP só recebe itens da própria etapa (cima → OP de tecelagem; latex → OP de látex).

## 5. PDF de compra de fios

- Botão **"PDF de compra de fios"** no detalhe da OP de tecelagem, visível quando há ordens (`aberta`/`em_producao`).
- **jsPDF via CDN**: adicionar o `<script>` da jsPDF 2.5.1 (`jspdf.umd.min.js`) no `index.html`, **com Subresource Integrity** — `integrity="sha384-..."` + `crossorigin="anonymous"` (copiar o hash SRI oficial fornecido pela página do cdnjs para essa versão/arquivo; não inventar o hash). Sem SRI, uma CDN comprometida injetaria código — então o atributo é obrigatório.
- Função pura `agruparOrdensCompraFio(ordens)` em `js/calculo-op.js`: separa `algodao`/`poliester`, soma `kg_pedido` por grupo, retorna estrutura ordenada (`{ algodao: [{rotulo, kg}], poliester: [...], totalAlgodao, totalPoliester }`). O `rotulo` do algodão usa a cor; do poliéster, PRETO/BRANCO.
- O desenho do PDF (jsPDF) é fino e consome essa estrutura: cabeçalho (Lote Nº · Cliente · OP Nº/ano · data), seção Algodão, seção Poliéster, subtotais. Baixa como `compra-fios-OP-<numero>-<ano>.pdf`.

## 6. Testes e verificação

- **Automatizado (`tests/calculo-op.test.js`)**: testes de `percentualEntregueOP` (ajustado vs pedido, defeito ignorado, meta=0 → 0, cap 100) e `agruparOrdensCompraFio` (separação por tipo, soma de kg, ordenação, rótulos). Os 25 testes atuais seguem como regressão.
- **RPC `gerar_op_latex`**: verificação manual no Supabase de que a OP de látex herda `lote_id`.
- **QA manual (`docs/qa/fase6-checklist.md`)**: cadastro de clientes; cliente+lote obrigatórios; lote automático sequencial; látex herdando lote/cliente; abrir OP só com tecelagem; atribuição de fornecedor de fio depois (e fornecedor logado passando a ver e registrar); barra de % batendo; PDF com seções corretas.

## Pendências de deploy (manuais)

- Rodar `db/09_fase6_cliente_lote.sql` no Supabase **antes** de a `main` ir pro ar (o front lê `lote`/`cliente`, ordens sem fornecedor e a função atualizada). Pages serve da `main`.
- Executar o QA manual da Fase 6.

## Fora de escopo

- Gerenciar lotes numa tela dedicada (lotes são criados/herdados automaticamente).
- Cliente com campos além de `nome` (contato, etc.).
- Atribuir fornecedor de fio diferente por cor (mantém-se por tipo).
