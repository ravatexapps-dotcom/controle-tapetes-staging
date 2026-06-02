# Design — Destino de látex na entrega da tecelagem

**Data:** 2026-06-02
**Fase:** complemento da Fase 5a (Tecelagem) / ponte para a Fase 5b (Látex)

## Problema

Ao registrar uma entrega da parte de cima, a tecelagem não tem onde informar
**para qual empresa de látex** o material foi enviado. Pela regra do projeto, o
látex é decidido **depois** da parte de cima (não na criação da OP) e pode haver
mais de um destino por OP. O momento natural de capturar esse destino é a própria
entrega da tecelagem.

## Decisões (acordadas no brainstorming)

1. **Granularidade:** um destino por entrega. Material que foi para outra empresa
   de látex é registrado como uma entrega separada (isso já satisfaz "mais de um
   destino por OP").
2. **Lista de destinos:** livre — todas as empresas com `tipo='latex'`. Sem
   pré-atribuição na OP.
3. **Obrigatoriedade:** obrigatório ao salvar a entrega da tecelagem.

## 1. Modelo de dados

Nova coluna em `entregas`:

```sql
ALTER TABLE entregas
  ADD COLUMN destino_fornecedor_id BIGINT REFERENCES fornecedores(id) ON DELETE RESTRICT;
```

- Para `etapa='cima'`: empresa de látex de destino.
- Para futuras entregas `etapa='latex'` (Fase 5b): permanece nulo.
- Obrigatoriedade via CHECK:

```sql
ALTER TABLE entregas
  ADD CONSTRAINT entregas_destino_cima_chk
  CHECK (etapa <> 'cima' OR destino_fornecedor_id IS NOT NULL);
```

Como o QA da Fase 5a ainda não rodou, parte-se do princípio de que não há
entregas `'cima'` reais. Se existirem linhas de teste sem destino, a migração as
remove antes de criar o CHECK. A validação de que o destino é do tipo `latex`
fica no app (dropdown filtrado), coerente com o padrão MVP single-admin.

## 2. RLS

Bloqueio atual: a policy `fornecedores_self` só permite ao fornecedor ler a
própria linha, então a tecelagem não consegue listar as empresas de látex para o
dropdown. Nova policy (somente leitura, dado não-sensível):

```sql
DROP POLICY IF EXISTS fornecedores_latex_read ON fornecedores;
CREATE POLICY fornecedores_latex_read ON fornecedores
  FOR SELECT USING (tipo = 'latex');
```

As mudanças de schema + RLS vão num novo arquivo idempotente
`db/07_fase5a_destino_latex.sql`.

## 3. UI (`index.html`)

O form de entrega é montado por uma função que retorna `{ node, getPayload }`,
reutilizada pela tela do fornecedor (`screenFornecedorEntregas`) e pelo bloco do
admin no detalhe da OP.

- **a) Carregar látex:** buscar uma vez
  `supa.from('fornecedores').select('id, nome').eq('tipo', 'latex').order('nome')`
  e passar a lista para o form.
- **b) Campo:** `<select>` "Destino (látex)" com opção placeholder vazia e uma
  opção por empresa. `getPayload()` passa a retornar `destino_fornecedor_id`
  (number ou null).
- **c) Validação ao salvar:** em `salvarEntregaCima` e `atualizarEntregaCima`,
  abortar com toast se `destino_fornecedor_id` vazio; incluir o campo no
  `insert`/`update` de `entregas`.
- **d) Edição:** pré-selecionar o destino atual; a query de carregamento das
  entregas passa a trazer `destino_fornecedor_id`.
- **e) Histórico:** exibir o nome da empresa de látex em cada entrega listada
  (tela do fornecedor e bloco admin), via `destino:destino_fornecedor_id(nome)`.

## 4. Validação, edição e testes

- **Testes automatizados:** o destino é só um vínculo (FK) e não altera o cálculo
  de metros — sem nova função pura. Os 23 testes existentes seguem como
  regressão (`node --test tests/calculo-op.test.js`).
- **QA manual:** acrescentar itens ao `docs/qa/fase5a-checklist.md` cobrindo
  destino obrigatório, exibição no histórico, edição mantendo/trocando destino e
  admin lançando/editando com destino.
- **Verificação:** suíte verde + conferência de que o dropdown popula e persiste.

## Fora de escopo (Fase 5b)

A Fase 5b (látex) consumirá `entregas.destino_fornecedor_id` como fonte da
verdade de quais OPs cada empresa de látex recebeu — derivando a fila de trabalho
do látex a partir das entregas da tecelagem que apontam para ela. Não construído
aqui; este campo é a interface limpa para essa fase.
