# Design — Controle de Produção de Tapetes

**Data:** 2026-05-16
**Autor:** Vinícius Giansante (proprietário) + Claude (assistente)
**Status:** rascunho aprovado em brainstorm, aguardando review escrito

---

## 1. Contexto e objetivo

O sistema controla a produção de tapetes do Murilo, do pedido de fios até a entrega final do tapete pronto.

A produção segue 3 etapas terceirizadas:

1. **Fornecedor de fios** envia algodão e poliéster
2. **Tecelagem** (terceirizada) recebe os fios e produz a parte de cima do tapete
3. **Látex** (terceirizada) recebe a parte de cima e aplica o látex no verso, devolvendo o tapete pronto

O sistema precisa:

- Permitir admin simular uma Ordem de Produção (OP) calculando automaticamente quanto de fio comprar
- Gerar ordens de compra de fios para fornecedores
- Permitir cada fornecedor registrar suas entregas em portal próprio (sem ver dados dos outros)
- Recalcular automaticamente a OP quando o fio chegar com quantidade diferente da pedida
- Registrar entregas parciais e defeitos das terceirizadas
- Manter histórico de saldos de fios

## 2. Atores e permissões

| Perfil | Acessa |
|---|---|
| **Admin** (Vinícius, Murilo) | tudo — cadastros, OPs, parâmetros, preços, usuários |
| **Fornecedor de fios** | só ordens de compra de fios em aberto pra ele + registrar entrega |
| **Tecelagem** | só OPs em que foi vinculada + registrar entregas da parte de cima (parciais, com defeito) |
| **Látex** | só OPs em que foi vinculada + registrar entregas finais |

Admin cria os usuários e define o tipo (`admin` ou `fornecedor`). Ao criar uma OP, admin vincula quais fornecedores participam e em que etapa cada um atua.

## 3. Arquitetura

```
Browser (Chrome/Safari/Edge)
  └── index.html (single file)
       - HTML estrutural
       - Tailwind via CDN (estilo)
       - Supabase JS via CDN (banco e auth)
       - JS embutido (lógica de negócio)
        │
        │ HTTPS direto, usando anon key + JWT do usuário logado
        ▼
Supabase (gerenciado, plano free)
  - Postgres (tabelas + RLS)
  - Auth (email/senha)
```

**Hospedagem:** GitHub Pages com deploy automático no push para `main`.
**Custo total:** R$ 0/mês dentro dos limites do free do Supabase (500MB banco, 2GB tráfego/mês).
**Segurança:** RLS no Postgres garante isolamento por perfil. A anon key fica visível no HTML (é o design esperado).

### Organização interna do `index.html`

```
<head>           [meta, título, CDN Tailwind, Google Fonts]
<body>
  <div id="app"> [telas renderizadas via JS]
  <script>
    // === CONFIG ===   URL e anon key do Supabase
    // === UTIL ===     formatadores, cálculos, helpers
    // === SUPA ===     wrapper das chamadas do Supabase
    // === AUTH ===     login, logout, sessão
    // === ROUTER ===   navegação por hash (#/login, #/ops, …)
    // === SCREENS ===  funções que desenham cada tela
    // === MAIN ===     inicialização, listeners
  </script>
</body>
```

## 4. Modelo de dados

### Cadastros base

**`usuarios`** (perfil; o registro de auth fica no Supabase Auth)
- `id` UUID (vem do Auth)
- `email`, `nome`
- `tipo`: `admin` | `fornecedor`
- `fornecedor_id` FK opcional → `fornecedores.id`

**`cores`** — cores de algodão
- `id`, `nome` (ex: BRANCO, PRETO, BEGE)

**`modelos`**
- `id`, `nome`
- `cor_1_id` FK, `cor_2_id` FK (cor 1 é predominante)
- `largura`: `1.40` | `2.10`
- Unique: `(nome, cor_1_id, cor_2_id, largura)` — "Conforto BRANCO/PRETO 1,40" ≠ "Conforto PRETO/BRANCO 1,40"

**`parametros_largura`** — variáveis do cálculo, uma linha por largura
- `largura` PK (`1.40` ou `2.10`)
- `peso_linear`, `algodao_por_ml`, `poliester_por_ml`, `valor_x`

**`fornecedores`**
- `id`, `nome`
- `tipo`: `fio_algodao` | `fio_poliester` | `tecelagem` | `latex`

**`precos_terceirizada`**
- `id`, `fornecedor_id` FK
- `etapa`: `cima` | `latex`
- `largura`: `1.40` | `2.10`
- `preco_por_metro`

### Operação (OP e filhos)

**`ops`**
- `id`, `numero`, `ano` → exibido como "Lote NN/AA"
- `status`: `simulada` | `aberta` | `em_producao` | `finalizada`
- `criado_em`, `finalizada_em`

**`op_itens`** — linhas de modelo dentro da OP
- `id`, `op_id` FK, `modelo_id` FK
- `metros_pedidos`, `metros_ajustados` (após recálculo de fio)

**`op_fornecedores`** — único vínculo entre OP e qualquer fornecedor (fio ou terceirizada)
- `op_id`, `fornecedor_id`, `etapa`: `fio_algodao` | `fio_poliester` | `cima` | `latex`
- Permite múltiplas terceirizadas por etapa no futuro sem mudar schema

### Compra e recebimento de fios

**`ordens_compra_fio`** — gerada automaticamente ao salvar OP
- `id`, `op_id`, `fornecedor_id`
- `tipo`: `algodao` | `poliester`
- `cor_id` FK (algodão) ou `cor` texto fixo PRETO/BRANCO (poliéster)
- `kg_pedido`, `kg_recebido`
- `data_pedido`, `data_recebimento`
- `status`: `pendente` | `recebido_parcial` | `recebido_total`

### Entregas das terceirizadas

**`entregas`**
- `id`, `fornecedor_id`, `etapa`: `cima` | `latex`
- `data`, `observacao`

**`entrega_itens`**
- `id`, `entrega_id`, `op_id` FK, `op_item_id` FK (linha correspondente da OP)
- `modelo_id` FK direto (usado quando a entrega não bate com nenhum `op_item` — caso raro de produção fora da OP)
- `metros_entregues`, `defeito` bool, `observacao`

### Saldos (informativo)

**`saldo_fios`** — totalizador
- `cor_id`, `tipo` (`algodao` | `poliester`), `kg_total`

**`saldo_fios_op`** — sobra por OP
- `op_id`, `cor_id`, `tipo`, `kg_sobra`

## 5. Cálculo de fios

**Variáveis do tapete** (em `modelos`): nome, cor 1, cor 2, largura.

**Variáveis do cálculo** (em `parametros_largura`, por largura): peso_linear, algodao_por_ml, poliester_por_ml, valor_x.

### Fórmula

Para cada item da OP (modelo × metros):

```
kg_algodao_cor_1 = (algodao_por_ml × valor_x) × metros
kg_algodao_cor_2 = (algodao_por_ml × valor_x) × metros   (mesma fórmula, cor 2)

kg_poliester_PRETO  = (poliester_por_ml × valor_x) × metros
kg_poliester_BRANCO = (poliester_por_ml × valor_x) × metros   (sempre as 2 cores)
```

Soma por cor entre todos os itens da OP → quantidade total de cada cor a comprar.

### Recálculo ao receber fio real

Quando fornecedor registra `kg_recebido` diferente do `kg_pedido`:

1. Sistema calcula quantos metros do(s) modelo(s) podem ser produzidos com o que chegou (fórmula inversa)
2. Mostra proposta ao admin: "Veio 1,5 kg a mais de BRANCO. Dá pra aumentar 50m do modelo X. Aceitar?"
3. Admin aceita → atualiza `op_itens.metros_ajustados`
4. Se sobrar fio (sem aumento possível): grava em `saldo_fios_op` + atualiza `saldo_fios`

Saldo é meramente informativo — não desconta da próxima OP.

## 6. Fluxos principais

### F1. Login e roteamento por perfil

Login email/senha (Supabase Auth) → busca `usuarios.tipo` → renderiza menu específico:
- Admin: dashboard completo
- Fornecedor de fios: tela "minhas ordens" + "registrar entrega"
- Tecelagem/Látex: tela "OPs comigo" + "registrar entrega"

### F2. Cadastros (admin, ordem sugerida na primeira vez)

cores → modelos → parametros → fornecedores → precos → usuarios

### F3. Simulação e criação de OP

1. Admin adiciona itens (modelo + metros)
2. Cálculo de fios atualizado ao vivo
3. Resumo mostra kg necessários por cor
4. Admin escolhe fornecedor de algodão, de poliéster, tecelagem, látex
5. Salva como Lote:
   - Atribui próximo numero/ano (editável)
   - Cria `ops` com status `aberta`
   - Cria `op_itens`
   - Cria `ordens_compra_fio` automaticamente (1 por cor de algodão + 1 poliéster preto + 1 poliéster branco)

### F4. Recebimento de fios + recálculo

Fornecedor lista ordens em aberto → registra entrega (data + kg por cor) → sistema recalcula → propõe ajuste → admin aceita ou ignora → saldo registrado se houver sobra.

### F5. Etapas tecelagem e látex

OP em `em_producao` aparece pras terceirizadas vinculadas. Cada uma cria entregas parciais com linhas (modelo, metros, defeito sim/não, observação). Permite incluir item de outra OP na mesma entrega (cenário raro).

### F6. Fechamento da OP

Status vai pra `finalizada` automaticamente quando todos os `op_itens.metros_ajustados` foram 100% entregues pelo látex. Admin também pode fechar manualmente com observação. OP fechada vira somente leitura.

## 7. UI e navegação

### Layout admin

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  Controle de Tapetes              [Murilo ▾] [Sair]        │
├────────────┬─────────────────────────────────────────────────┤
│ ▸ Painel   │                                                 │
│ ▸ OPs      │   Conteúdo da tela atual                        │
│ ▸ Entregas │                                                 │
│ ▸ Estoque  │                                                 │
│ ▸ Cadastros│                                                 │
│ ▸ Parâmetro│                                                 │
│ ▸ Preços   │                                                 │
│ ▸ Usuários │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

### Layout fornecedor (enxuto)

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  Controle de Tapetes              [Tecelagem A ▾] [Sair]   │
├────────────┬─────────────────────────────────────────────────┤
│ ▸ Minhas OPs│   Lista das OPs vinculadas                     │
│ ▸ Entregas  │   + botão grande "+ Nova entrega"              │
└─────────────┴────────────────────────────────────────────────┘
```

### Telas admin

1. **Painel** — cards: OPs abertas, fios pendentes, entregas atrasadas, saldo de fios
2. **Lista de OPs** — tabela com Lote, status, % concluído, tecelagem, látex
3. **Detalhe da OP** — tabs: Itens · Ordens de compra · Entregas tecelagem · Entregas látex · Saldo · Histórico
4. **Nova OP** — wizard: itens → cálculo ao vivo → escolher fornecedores → salvar
5. **Entregas** — visão global com filtros
6. **Estoque** — saldos total e por OP
7. **Cadastros** — tabela+modal pra cores, modelos, fornecedores
8. **Parâmetros** — formulário 2 colunas (1,40 e 2,10)
9. **Preços** — tabela editável (terceirizada × etapa × largura)
10. **Usuários** — lista + criar/editar com tipo e vínculo

### Telas fornecedor

- **Minhas OPs** — filtradas pelo `fornecedor_id`
- **Nova entrega** — formulário com data + linhas
- **Minhas entregas** — histórico

### Rotas (hash routing)

```
#/login
#/painel
#/ops                            #/ops/nova                     #/ops/{id}
#/entregas
#/estoque
#/cadastros/cores                #/cadastros/modelos            #/cadastros/fornecedores
#/parametros
#/precos
#/usuarios
#/fornecedor/minhas-ops          #/fornecedor/nova-entrega      #/fornecedor/minhas-entregas
```

### Visual

Provisório (aguardando screenshots do Max Home):
- Paleta: cinza claro de fundo (#f4f5f7), branco nos cards, azul escuro primário (#1e3a8a)
- Tipografia: Inter via Google Fonts
- Componentes Tailwind: `rounded-xl`, sombra suave, tabelas com hover, modais centralizados, badges de status
- Responsivo: menu vira drawer no mobile (fornecedores podem usar no celular)

### Comportamentos

- Loading com overlay; nunca tela travada sem feedback
- Modal de confirmação em ações destrutivas
- Toasts pra sucesso/erro (sem `alert()`)
- Esc fecha modal; Enter envia formulário simples
- Aviso se sair de OP em rascunho sem salvar
- Cálculo de fios atualizado ao digitar

## 8. Segurança (RLS)

| Tabela | Admin | Fornecedor |
|---|---|---|
| `cores`, `modelos`, `parametros_largura`, `fornecedores`, `precos_terceirizada` | leitura+escrita total | sem acesso (ou só leitura básica conforme necessidade) |
| `usuarios` | total | só ler/editar próprio perfil |
| `ops`, `op_itens`, `op_fornecedores` | total | leitura só onde existe vínculo dele em `op_fornecedores` |
| `ordens_compra_fio` | total | leitura+update da própria entrega só onde `fornecedor_id = meu` |
| `entregas`, `entrega_itens` | total | leitura+criação só onde `fornecedor_id = meu` |
| `saldo_fios`, `saldo_fios_op` | total | sem acesso |

Funções SQL auxiliares no banco: `is_admin()` e `meu_fornecedor_id()` consultam o JWT via `auth.uid()`.

## 9. Erros e bordas

- Toda chamada async com try/catch e toast amigável
- Validação no frontend (campos obrigatórios destacados) + constraints no banco (NOT NULL, CHECK, UNIQUE, triggers)
- Conflito de versão: último a salvar ganha; `updated_at` permite auditoria
- Sessão expirada: refresh automático do Supabase; falha → redireciona pro login mantendo destino
- Offline detectado via `navigator.onLine`, banner de aviso
- Item sem modelo, metragem zero, parâmetro de largura faltando → bloqueia com mensagem clara
- Tentativa de acesso indevido → RLS bloqueia no banco + frontend esconde
- Entrega com metros > pendente → avisa mas permite (cobre defeito/extra)

## 10. Testes

Sem suite formal de testes automatizados (over-engineering pra single HTML). Em vez disso:

- **Checklist manual de QA** por perfil (admin / fios / tecelagem / látex) gerado junto do projeto
- **Seed SQL de dados de teste**: 1 admin, 1 de cada tipo de fornecedor, 3 cores, 2 modelos, 1 OP simulada
- **Queries de validação RLS** prontas pro Supabase Studio: logar como tecelagem A e tentar ler OP da B etc.

## 11. Plano de entrega (fases)

| Fase | Conteúdo | Estimativa |
|---|---|---|
| 1 | Repositório GitHub, projeto Supabase, schema completo, RLS, funções, HTML base com login, seed | 1 dia |
| 2 | Admin — cadastros (cores, modelos, parâmetros, fornecedores, preços, usuários) | 1 dia |
| 3 | Admin — Nova OP com cálculo ao vivo, salvar como Lote, lista e detalhe | 1–2 dias |
| 4 | Fornecedor de fios + recálculo automático + proposta de ajuste | 1 dia |
| 5 | Tecelagem e látex (entregas parciais, defeitos, progresso) | 1 dia |
| 6 | Fechamento automático/manual, painel inicial, estoque/saldo | 1/2 dia |
| 7 | Aplicar visual do Max Home (após screenshots), QA completo, deploy final | 1/2 dia |

Total estimado: **6–8 dias úteis** somando as sessões de desenvolvimento.

## 12. Fora do escopo (não entra no MVP)

- Integração com Bling ERP
- Notificações por email/WhatsApp
- App mobile nativo (responsivo cobre o uso no celular)
- Relatórios gerenciais avançados (vem depois do MVP)
- Importação em massa de cadastros (CSV)
- Pagamentos automáticos pros terceirizados

## 13. Pendências e suposições

- **Visual:** aguardando screenshots do Max Home para aplicar paleta e tipografia fiéis
- **Domínio próprio:** assumimos URL gratuita do GitHub Pages por enquanto; domínio próprio pode ser plugado depois
- **Backup do banco:** Supabase free faz snapshot diário; sem backup automático extra no MVP
- **Suposição:** "Poliester/MG" no enunciado original foi typo de "Poliester/ML"; fórmula usa ML
