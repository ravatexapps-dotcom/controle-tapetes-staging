# Backlog Funcional/Arquitetural do Fluxo Produtivo — Pedido

Fase: `RAVATEX-TAPETES-PRODUCTION-BACKLOG-REGISTER-A`
Data: 2026-07-04
Base: branch `work/app-next`, HEAD `26bf4a14e60c33ce905ebf9b37ff21486ddd87bc`
Fase anterior fechada: `RAVATEX-TAPETES-PRODUCTION-FLOW-UI-MAP-A`

---

## 1. Estado operacional atual comprovado

### 1.1 Caminho real para concluir um Pedido

O fluxo produtivo completo do Pedido é operacional. As 5 etapas do stepper
(`recebido → confirmado → insumos → tecelagem → acabamento → expedicao → transporte → concluido`,
com `insumos` e `transporte` puláveis) são cobertas por transições reais:

1. **Insumos** — `registrarRecebimentoOrdemFio` (`js/screens/op-writes.js:29`):
   registra kg recebidos na ordem de fio vinculada à OP de tecelagem. Chamada
   canônica também acessível via modal do Pedido Detail
   (`js/screens/pedido-detail-events.js:647`).

2. **Tecelagem → Acabamento** — `salvarEntregaCima` (`js/screens/entrega-writes.js:212`):
   grava entrega `etapa='cima'` + itens + chama RPC `gerar_op_latex` (find-or-accumulate).
   O formulário canônico é `buildEntregaInlineForm` (`js/screens/entrega-form.js:61`).
   O Pedido Detail chama o modal via `openMovementModal` (`js/screens/pedido-detail-events.js:814`).

3. **Acabamento → Expedição** — `liberar_expedicao` (RPC Supabase):
   chamada em `js/screens/op-latex-admin.js:236`. Cria expedição vinculada à OP
   de látex finalizada.

4. **Expedição → Entrega** — `registrar_entrega_expedicao` (RPC Supabase):
   chamada em `js/screens/expedicao-admin.js:272` e
   `js/screens/pedido-detail-events.js:787`. Registra entrega/coleta parcial ou
   total; `concluir_pedido_se_pronto` persiste a conclusão quando sem saldo.

### 1.2 Rotas/telas principais

| Rota | Tela | Função |
|---|---|---|
| `#/pedidos` | Admin — Lista de Pedidos | `pedidos-list.js` |
| `#/pedidos/<uuid>` | Admin — Detalhe do Pedido | `pedido-detail.js` |
| `#/ops` | Admin — Lista de OPs | `ops-list.js` |
| `#/ops/nova?pedido_id=<id>` | Admin — Nova OP via Pedido | `op-nova.js` |
| `#/ops/<id>` | Admin — Detalhe OP | `op-nova.js` / `op-latex-admin.js` |
| `#/expedicoes/<id>` | Admin — Expedição | `expedicao-admin.js` |

### 1.3 Etapas que permitem parcial

- **Tecelagem**: entregas parciais via `salvarEntregaCima` (múltiplas entregas
  para a mesma OP de tecelagem), cada uma acumulando na OP de acabamento
  consolidada.
- **Expedição**: `registrar_entrega_expedicao` aceita entrega parcial com
  rastreamento de saldo.

### 1.4 Ações manuais de finalização/conclusão

- **Acabamento finalizado**: botão "Finalizar" na tela de OP Látex
  (`js/screens/op-latex-admin.js`).
- **Liberar expedição**: botão "Liberar expedição" na tela de OP Látex.
- **Concluir Pedido**: `concluir_pedido_se_pronto` (RPC) — chamado ao
  registrar entrega de expedição quando não há saldo pendente.

### 1.5 Lacunas comprovadas pelo mapa UI (fase `PRODUCTION-FLOW-UI-MAP-A`)

| Lacuna | Detalhe |
|---|---|
| Botões "Movimentar" ambíguos | Na OP Látex e Tecelagem, "Movimentar" é anchor/atalho para o card de entregas, não uma ação de transição real. |
| Modais de seta não mostram pendências | Os modais abertos pelas setas do stepper no Pedido não exibem o que falta concluir entre etapas. |
| "Transferir restante" não existe | Não há ação/botão dedicado para transferir o saldo restante de uma etapa. |
| Aceite/ajuste da OP Tecelagem pelo Pedido não existe | O Pedido não oferece interface para revisar/aceitar a OP de tecelagem antes de entrar em produção. |
| Stepper não é clicável | As bolinhas do stepper no Pedido Detail não são clicáveis — apenas as setas entre etapas têm handlers. |
| Finalização explícita de Tecelagem não existe | Não há ação dedicada para marcar a Tecelagem como concluída. |
| Correlação visual OP↔Pedido parcial | O lineage strip existe (cadeia produtiva na OP de Tecelagem), mas a visualização no Pedido dos vínculos com OPs é limitada. |
| Novo requisito: split parcial | Permitir excepcionalmente criar OP separada para uma parcial, via select, mantendo acumular como padrão. |

---

## 2. Backlog ordenado

### A. ACTION-BUTTONS-R1
**Corrigir botões "Movimentar" ambíguos/anchors**

- **Problema**: Botões "Movimentar" na OP Em Produção Tecelagem e OP Látex
  funcionam como âncoras visuais para o card de entregas/movimentação, não como
  ações de transição. Isso confunde: o usuário clica esperando abrir um modal
  de movimentação e é rolado para outro card.
- **Escopo**: `js/screens/op-tecelagem-producao-admin.js`,
  `js/screens/op-latex-admin.js`.
- **Proposta**: Renomear âncoras para rótulo explícito (ex.: "Ir para
  movimentação") ou substituir por CTA que abre o modal canônico de transição
  (`openMovementModal`) diretamente, sem scroll.
- **Risco**: Baixo — alteração de label/comportamento local, sem writes novos.
- **Critério de aceite**: Botão "Movimentar" na OP Tecelagem e OP Látex não
  é mais âncora; abre modal de transição ou tem label que deixa claro que é
  navegação interna.

### B. PEDIDO-TRANSITION-MODAL-GAPS-B
**Modais de seta devem mostrar pendências completas entre steppers**

- **Problema**: As setas entre etapas do stepper no Pedido Detail abrem modais
  de transição (`openMovementModal`), mas esses modais não mostram o panorama
  completo de pendências — totais por produto, já movimentado, faltante, OPs
  relacionadas, bloqueios e próxima ação.
- **Escopo**: `js/screens/pedido-detail-events.js` (render do modal de
  transição), possivelmente `pedido-detail-render.js`.
- **Proposta**: Enriquecer cada modal com sumário de pendências calculado a
  partir da mesma fonte canônica (`derivePedidoChainState` em
  `pedido-chain-state.js`), não duplicada.
- **Ver §4** para requisito detalhado.
- **Risco**: Médio — requer nova UI em cada modal, mas sem novos writes.
- **Critério de aceite**: Cada modal de seta exibe: totais por produto, já
  movimentado, faltante, OPs relacionadas, bloqueios (se houver) e CTA da
  próxima ação.

### C. PEDIDO-TRANSFER-REMAINING-B
**Botão/ação "Transferir restante"**

- **Problema**: Quando uma transferência parcial já foi feita, não há ação
  explícita para transferir o saldo restante de uma vez. O usuário precisa
  criar outra entrega manualmente.
- **Escopo**: `js/screens/pedido-detail-events.js` (novo handler no modal de
  transição), possivelmente reutilizando `salvarEntregaCima` com payload
  calculado do saldo.
- **Proposta**: Adicionar CTA "Transferir restante" no modal de transição que
  pré-preenche o formulário com o saldo pendente de cada item.
- **Risco**: Médio — write real, mas reutiliza operação canônica existente.
- **Critério de aceite**: Botão "Transferir restante" visível quando há saldo
  pendente; ao clicar, pré-preenche formulário com o saldo e executa a
  operação canônica.

### D. PEDIDO-TEC-ACCEPTANCE-B
**Aceite/ajuste da OP Tecelagem pelo Pedido**

- **Problema**: A OP de tecelagem, quando criada a partir do Pedido, não passa
  por uma etapa de revisão/aceite no contexto do Pedido. O admin precisa
  navegar até a tela de OP para ajustar.
- **Escopo**: Novo componente/modal no `pedido-detail.js` que permita revisar
  os itens da OP de tecelagem vinculada, ajustar quantidades (dentro do saldo
  do pedido) e confirmar o início da produção.
- **Risco**: Alto — envolve validação de consistência Pedido↔OP e possível
  write em `op_itens`.
- **Critério de aceite**: Admin consegue revisar e ajustar a OP de tecelagem
  vinculada diretamente do detalhe do Pedido, sem navegar para a tela de OP.

### E. LATEX-SPLIT-PARTIAL-POLICY-A
**Diagnóstico/arquitetura para select de split parcial**

- **Problema**: A regra atual é sempre acumular na OP de látex existente
  (`gerar_op_latex` com find-or-accumulate). O novo requisito exige permitir,
  excepcionalmente, criar uma OP separada para uma parcial específica.
- **Escopo**: Diagnóstico de schema, índices, RPC `gerar_op_latex`, tabelas
  `ops`, `entregas`, `entrega_itens`.
- **Ver §3** para requisito detalhado.
- **Risco**: Alto — altera a regra de consolidação; exige nova chave de
  agrupamento, rastro/histórico e não pode reintroduzir "uma OP por parcial"
  automático.
- **Critério de aceite**: Diagnóstico documentado com: tabelas afetadas,
  índices existentes, assinatura atual da RPC, proposta de nova chave de
  agrupamento, impacto em RLS, e contrato de UI para o select.

### F. PEDIDO-STEPPER-STAGE-MODALS-B
**Bolinhas do stepper clicáveis e modais por etapa**

- **Problema**: As bolinhas do stepper no Pedido Detail (8 etapas:
  recebido/confirmado/insumos/tecelagem/acabamento/expedicao/transporte/
  concluido) não são clicáveis. Apenas as setas entre etapas abrem modais de
  transição.
- **Escopo**: `js/screens/pedido-detail-render.js` (render do stepper),
  `js/screens/pedido-detail-progress.js` (lógica de estado).
- **Proposta**: Tornar cada bolinha clicável, abrindo um modal informativo
  com o estado daquela etapa: dados agregados, OPs vinculadas, progresso,
  eventos/histórico.
- **Risco**: Baixo — read-only, sem writes novos.
- **Critério de aceite**: Cada bolinha do stepper é clicável e abre um modal
  com informações da etapa correspondente.

### G. TEC-STAGE-FINALIZATION-A
**Decisão/implementação de finalização explícita da Tecelagem**

- **Problema**: Não existe ação explícita para marcar a etapa de Tecelagem
  como concluída. A transição para Acabamento acontece via entrega
  (`salvarEntregaCima`), mas a OP de tecelagem em si não tem um estado
  terminal explícito ("concluída") separado da última entrega.
- **Escopo**: Decisão arquitetural primeiro: a Tecelagem é concluída
  automaticamente quando todo o saldo foi transferido, ou exige ação
  explícita? Depois, implementação na UI (OP Tecelagem e/ou Pedido Detail).
- **Risco**: Médio — envolve decisão de lifecycle de OP e possível uso de
  `alterar_status_op`.
- **Critério de aceite**: Decisão documentada; se ação explícita, botão
  "Concluir Tecelagem" visível e funcional; se automática, indicador claro
  de que a etapa foi concluída.

### H. OP-PEDIDO-LINEAGE-UX-B
**Padronizar correlação visual Pedido↔OP**

- **Problema**: A correlação visual entre Pedido e OPs vinculadas é parcial.
  O lineage strip existe na OP de Tecelagem (mostra a OP de Acabamento
  consolidada), mas no Pedido Detail a listagem de OPs vinculadas é básica
  e não mostra a cadeia completa.
- **Escopo**: `js/screens/pedido-detail-render.js` (bloco de OPs vinculadas),
  `pedido-detail-progress.js` (dados agregados).
- **Proposta**: Criar visualização de lineage no Pedido Detail: cards/linha
  do tempo mostrando OP Tecelagem → OP Acabamento → Expedição, com status,
  progresso e ações rápidas.
- **Risco**: Médio — read-only, mas requer UI nova com dados já carregados.
- **Critério de aceite**: No detalhe do Pedido, a seção de OPs mostra a
  cadeia produtiva completa com status, progresso e navegação para cada OP.

---

## 3. Novo requisito de split parcial (LATEX-SPLIT-PARTIAL-POLICY-A)

### 3.1 Regra padrão (não alterar)

- **Acumular na mesma OP** quando coincidirem: mesma OP de tecelagem de
  origem (`origem_op_id`) + mesmo fornecedor de látex
  (`destino_fornecedor_id`).
- A RPC `gerar_op_latex` implementa find-or-accumulate: se já existe OP de
  látex `aberta` ou `em_producao` para essa combinação, acumula os itens da
  nova entrega nela; senão, cria uma nova.
- Este comportamento é o padrão e **não deve ser alterado**.

### 3.2 Exceção (novo requisito)

- Permitir, **explicitamente e por select**, criar uma **nova OP de látex
  separada** para uma entrega parcial específica, mesmo quando já existe uma
  OP de látex consolidada para a mesma combinação origem+fornecedor.
- A exceção **não deve ser o padrão** — o padrão continua sendo acumular.
- A exceção **deve ser explícita** via select/binário no formulário de
  entrega (`buildEntregaInlineForm`) ou no momento de chamar
  `salvarEntregaCima`.
- A exceção **deve exigir rastro/histórico**: a nova OP deve registrar
  `origem_entrega_id` específica e o motivo da separação.

### 3.3 Restrições absolutas

- **NÃO** reintroduzir "uma OP por parcial" como comportamento automático.
- **NÃO** quebrar a idempotência de `gerar_op_latex` para o caso padrão.
- **NÃO** criar migration ou alterar schema nesta fase de diagnóstico
  (`LATEX-SPLIT-PARTIAL-POLICY-A` é diagnóstico/arquitetura, não
  implementação).

### 3.4 Diagnóstico necessário (antes de implementar)

1. **Mapear `gerar_op_latex`**: assinatura atual, parâmetros, lógica de
   find-or-accumulate, retorno.
2. **Mapear tabelas afetadas**: `ops`, `op_itens`, `entregas`,
   `entrega_itens`, `lotes`.
3. **Mapear índices existentes**: `ops.origem_op_id`, `ops.origem_entrega_id`,
   `ops.tipo`, `ops.status`.
4. **Definir nova chave de agrupamento**: como a RPC decide se acumula ou
   cria? A chave atual é `(origem_op_id, destino_fornecedor_id, tipo='latex')`.
   A exceção precisa de um novo discriminador (ex.: flag `forcar_nova_op`
   passada como parâmetro).
5. **Definir contrato de UI**: onde e como o select/binário aparece no
   formulário de entrega.
6. **Avaliar impacto em RLS**: a nova OP herda as mesmas policies de `ops`
   com `tipo='latex'`.

---

## 4. Requisito de modais de transição (PEDIDO-TRANSITION-MODAL-GAPS-B)

### 4.1 Conteúdo obrigatório de cada modal

Cada modal aberto pelas setas do stepper no Pedido Detail deve exibir:

| Informação | Fonte |
|---|---|
| Totais por produto (metros pedido) | `pedido_itens` |
| Já movimentado na etapa atual | `entrega_itens` agregado por `op_item_id` |
| Faltante para concluir a transição | `total - movimentado` |
| OPs relacionadas à etapa | `ops` vinculadas ao pedido (via `lotes.pedido_id`) |
| Bloqueios (se houver) | Ex.: OP de destino não confirmada, fornecedor pendente |
| Próxima ação (CTA) | "Transferir", "Transferir restante", "Liberar expedição", etc. |

### 4.2 Fonte de cálculo canônica

- A fonte de cálculo **deve ser compartilhada**, não duplicada por modal.
- A matriz `derivePedidoChainState` (`js/screens/pedido-chain-state.js:146`)
  já calcula o estado de cada etapa com gates e ações.
- Os modais devem consumir essa mesma matriz, complementada com dados
  granulares (por item) quando necessário.
- **Proibido**: cada modal recalcular totais independentemente com lógica
  própria.

### 4.3 Estados visuais

- **Ativo (azul)**: label "Transferir", seta clicável → abre modal de
  transição.
- **Concluído (verde/neutral)**: label "Concluído", seta clicável → abre
  histórico da transição com parciais.
- **Aguardando (cinza/muted)**: label "Aguardar", seta não clicável.
- **View/Edit**: label curto integrado, abre contexto quando permitido.

---

## 5. Critérios gerais de implementação

1. **Uma fase por grupo de problema**: cada item do backlog (A-H) é uma fase
   independente. Não agrupar múltiplos itens em uma fase só.
2. **Nenhum patch grande sem diagnóstico**: itens marcados como
   "diagnóstico/arquitetura primeiro" (E, G) exigem documento de design antes
   de código.
3. **Nenhum fechamento sem testes/evidência**: cada fase deve ter smoke test
   dedicado ou evidência visual documentada.
4. **Preservar produção intocada**: `bhgifjrfagkzubpyqpew` e `origin/main`
   nunca são alvo de push.
5. **Staging seletivo**: `git add` apenas os arquivos da fase; nunca
   `git add .`.
6. **Atualizar `AGENT_HANDOFF.md` ao fim** de cada fase, registrando estado
   pós-fase, arquivos alterados, testes e próximo passo.
7. **Push somente para `staging`**: `git push staging work/app-next`.
8. **Branch**: sempre `work/app-next`.
9. **Residual permitido**: `?? supabase/.temp/` — nunca commitado.

---

## 6. Ordem técnica de implementação

| # | Item | Dependências | Risco | Tipo |
|---|---|---|---|---|
| 1 | A. ACTION-BUTTONS-R1 | Nenhuma | Baixo | UI |
| 2 | B. PEDIDO-TRANSITION-MODAL-GAPS-B | Nenhuma | Médio | UI |
| 3 | C. PEDIDO-TRANSFER-REMAINING-B | B (reusa modal) | Médio | UI + Write |
| 4 | F. PEDIDO-STEPPER-STAGE-MODALS-B | Nenhuma | Baixo | UI |
| 5 | H. OP-PEDIDO-LINEAGE-UX-B | Nenhuma | Médio | UI |
| 6 | D. PEDIDO-TEC-ACCEPTANCE-B | H (lineage) | Alto | UI + Write |
| 7 | E. LATEX-SPLIT-PARTIAL-POLICY-A | Nenhuma (diagnóstico) | Alto | Arquitetura |
| 8 | G. TEC-STAGE-FINALIZATION-A | D, E (decisões de lifecycle) | Médio | Arquitetura + UI |

### Justificativa da ordem

1. **A** primeiro: correção simples, baixo risco, remove confusão imediata.
2. **B** em seguida: enriquece os modais existentes sem alterar writes.
3. **C** depende de B: o botão "Transferir restante" vive no modal
   enriquecido.
4. **F** é independente e de baixo risco: só UI read-only.
5. **H** é independente e melhora a experiência de navegação.
6. **D** depende de H para o contexto visual de lineage; é o primeiro item
   que envolve writes novos.
7. **E** é diagnóstico puro: não altera código, só documenta o caminho para
   implementar o split parcial.
8. **G** é o último: depende das decisões de D (ciclo de vida da Tecelagem) e
   E (política de split) para definir se a finalização é automática ou
   explícita.

---

## 7. Riscos mapeados

| Risco | Itens afetados | Mitigação |
|---|---|---|
| Regra de consolidação Látex quebrada | E | Diagnóstico antes de código; não alterar `gerar_op_latex` sem teste de regressão. |
| Write inconsistente entre Pedido e OP | C, D | Reutilizar operações canônicas (`salvarEntregaCima`, `alterar_status_op`); nunca write direto. |
| Divergência de totais entre modais | B | Fonte única: `derivePedidoChainState` + `entrega_itens`. |
| Stepper dessincronizado | F, G | Consumir `chainState` da matriz canônica, não recalcular. |
| "Uma OP por parcial" reintroduzido | E | Restrição absoluta documentada; review obrigatório. |

---

## 8. Referências

- `js/screens/pedido-chain-state.js` — Matriz canônica de estado (`derivePedidoChainState`)
- `js/screens/pedido-detail-progress.js` — Render do bloco `Progresso produtivo`
- `js/screens/pedido-detail-render.js` — Render do stepper e conectores
- `js/screens/pedido-detail-events.js` — Handlers dos modais de transição (`openMovementModal`)
- `js/screens/entrega-writes.js` — `salvarEntregaCima` (write canônico Tecelagem→Acabamento)
- `js/screens/entrega-form.js` — `buildEntregaInlineForm` (formulário canônico de entrega)
- `js/screens/op-tecelagem-producao-admin.js` — Tela OP Em Produção Tecelagem
- `js/screens/op-latex-admin.js` — Tela OP Látex/Acabamento
- `js/screens/expedicao-admin.js` — Tela de Expedição
- `tests/production-flow-invariants.smoke.js` — Invariantes do fluxo produtivo
- `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` — Plano arquitetural
- `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` — Contrato de schema
- `PROJECT_STATE.md` — Histórico completo de fases
- `AGENT_HANDOFF.md` — Estado atual e regras vinculantes
