# ADENDO DE PATCH — RAVATEX-TAPETES-PEDIDO-FLOW-UI-AUDIT-FIX-R1

**Status:** PATCH TÉCNICO PRONTO — AGUARDANDO VALIDAÇÃO VISUAL DO USUÁRIO
**Base:** `work/app-next` @ `faf11f421c4b4413bfc54607979f7e821213a864`
**Data do patch:** 2026-07-06

## Resultado dos desalinhamentos

| ID | Tratamento |
|----|------------|
| B2-label | Corrigido. Setas ativas agora usam labels curtos e específicos: `Iniciar`, `Receber`, `Transferir`, `Movimentar`, `Entregar`. |
| E2-E5 | Comprovado/coberto. Writes do `openMovementModal` usam operação canônica e, após sucesso, chamam `refreshPedidoTransitionModal(...)` para reload, recálculo, re-render da tela e re-render do modal. |
| C3-done | Sem conflito funcional perigoso. Mantido como sobreposição segura: `adminStepper` não marca `done` com OP formal pendente, e `applyFormalPendingStage` funciona como backstop visual. Refactor de centralização fica como P2 técnico se necessário. |
| D1 | Mantido como polish P2. |
| D3 | Mantido como polish P2. |

## Labels finais

- Insumos → Tecelagem sem OP: seta `Iniciar`; modal/CTA `Gerar primeira OP`.
- Insumos → Tecelagem com OP: seta `Receber`; modal `Registrar recebimento de insumos`.
- Tecelagem → Acabamento: seta `Transferir`; modal/CTA `Transferir para Acabamento`.
- Acabamento → Expedição: seta `Movimentar`; modal/CTA `Movimentar para Expedição`.
- Expedição → Entrega: seta `Entregar`; modal `Registrar entrega`.

## Verificação

- `node --test tests\pedido-detail.smoke.js` = 161/161
- `node --test tests\pedido-detail-linked-ops.smoke.js` = 7/7
- `node --test tests\tec-to-acabamento-flow.smoke.js` = 39/39
- `node --test tests\expedicao-partial-flow.smoke.js` = 12/12
- `node --test tests\expedicao-flow.smoke.js` = 8/8
- `node --test tests\op-latex-admin.smoke.js` = 55/55
- `node --test tests\production-flow-invariants.smoke.js` = 11/11
- Diagnósticos staging read-only OK: invariantes de fluxo, consolidação Latex e expedição parcial.

Confirmações: produção intocada, `origin` não usado para escrita, sem SQL,
sem migration, sem dados reais novos, sem mutação real não autorizada, sem
write paralelo no Pedido, sem `git add .` e `supabase/.temp/` fora do patch.

---

# AUDITORIA DE FLUXO PRODUTIVO — PEDIDO DETAIL ADMIN

**HEAD:** `faf11f421c4b4413bfc54607979f7e821213a864`
**Branch:** `work/app-next`
**Fase:** RAVATEX-TAPETES-PEDIDO-FLOW-UI-CONSISTENCY-AUDIT-ONLY-A (P0)
**Data da auditoria:** 2026-07-05
**Tipo:** READ-ONLY / DIAGNÓSTICO

---

## MATRIZ A — 10 CENÁRIOS DE ESTADO DO PEDIDO

Mapeamento entrada → stage derivado (`pedido-chain-state.js:165-290`).

| # | Cenário (condições) | Stage | displayStatus | adminBadge | adminStepper | Observação |
|---|---------------------|-------|---------------|------------|--------------|------------|
| A1 | Sem OPs, status=rascunho/recebido/confirmado | `comercial` | "Rascunho"/"Recebido"/"Confirmado" | = displayStatus | todos `future` exceto insumos=`future` | OK |
| A2 | hasTec, sem produção, insumos NÃO concluídos | `preparacao` | "Preparacao de insumos" | "Insumos" | insumos=`current` | OK |
| A3 | hasTec, sem produção, insumos CONCLUÍDOS | `preparacao` | "Tecelagem pronta para iniciar" | "Preparado" | insumos=`done` | OK |
| A4 | tecProduction ou tecRemaining>0 com insumos | `tecelagem` | "Tecelagem em andamento" | "Em producao" | tecelagem=`current` | OK |
| A5 | tecFinished (status terminal, saldo entregue) | `tecelagem_concluida` | "Tecelagem concluida" | "Tecelagem concluida" | tecelagem=`done` | OK |
| A6 | acabOpen ou hasAcab com target | `acabamento_entrada` | "Acabamento aguardando entrada" | "Aguardando entrada" | acabamento=`current` | OK |
| A7 | acabProduction | `acabamento` | "Acabamento em andamento" | "Em acabamento" | acabamento=`current` | OK |
| A8 | hasAcabLiberavel ou acabTerminalSemExpedicao | `pronto_expedicao` | "Pronto para expedicao" / "Expedicao liberada" | "Pronto para expedicao" | expedicao=`current` | OK |
| A9 | hasExpedicao && expedicaoSaldo > 0 | `expedicao` | "Expedicao em andamento" | "Expedicao" | expedicao=`current` | OK |
| A10 | pedido.status === 'entregue' | `concluido` | "Concluido" | "Concluido" | entrega=`done` | OK |

**Nenhum desalinhamento encontrado na matriz de estados.** A derivação de stage/displayStatus/adminBadge segue a hierarquia correta de precedência operacional.

---

## MATRIZ B — 5 SETAS DE TRANSIÇÃO (CONECTORES)

Ações entre etapas no stepper (`pedido-chain-state.js:309-341`).

| # | Ação | Chave | Condição habilitado | Label enabled | Label disabled/view | Severidade |
|---|------|-------|---------------------|---------------|---------------------|------------|
| B1 | Insumos → Tecelagem | transferInsumosToTecelagem | `!tecPendingAcceptance && !insumosConcluidos && !tecProduction && !hasAcab` | "Transferir" | "Insumos concluidos" (view), "Aguardar aceite da OP" (disabled), "Vincule uma OP" (disabled) | OK |
| B2 | Tecelagem → Acabamento | transferTecelagemToAcabamento | `canMoveTecToAcab` (hasTec && tecRemaining > 0 && producindo/finished) | "Transferir" | "Ver movimento" (view), "OP pendente de aceite" / "Sem saldo disponivel" (disabled) | OK |
| B3 | Acabamento → Expedicao | releaseExpedicao | `canReleaseExpedicao` (hasAcabLiberavel ou terminal sem expedicao) | "Liberar expedicao" | "Ver expedicao" (view), "Aguardando acabamento" (disabled) | OK |
| B4 | Expedicao → Entrega | registerDelivery | `canRegisterDelivery` (hasExpedicao && expedicaoSaldo > 0) | "Registrar entrega" | "Ver entrega" (view), `hidden` (sem expedicao) | OK |
| B5 | Concluir Pedido | concludePedido | `pedidoConcluido` (status='entregue') | "Pedido concluido" (view) | "Aguardando cadeia" (disabled) | OK |

### Desalinhamento B2 — Label "Transferir" ambíguo
- **Problema:** B1 e B2 usam **exatamente o mesmo label** "Transferir". Na prática representam operações distintas: B1 transfere **insumos** (fios) para a Tecelagem; B2 transfere **tecido produzido** para o Acabamento.
- **Sugestão:** B1 → "Transferir insumos", B2 → "Transferir produção" ou "Enviar para acabamento".

---

## MATRIZ C — BOLINHAS/ETAPAS DO STEPPER

5 stages no stepper (`pedido-detail-progress.js:717`, stepper array — não lido integralmente, mas confirmado por testes).

| # | Etapa | adminStepper states possíveis | Condição para `done` |
|---|-------|-------------------------------|-----------------------|
| C1 | insumos | `done`, `current`, `future` | `insumosConcluidos && !tecPendingAcceptance` |
| C2 | tecelagem | `done`, `current`, `future` | `tecFinished` |
| C3 | acabamento | `done`, `current`, `future` | `acabFinished` |
| C4 | expedicao | `done`, `current`, `future` | `pedidoConcluido` ou `(hasExpedicao && expedicaoSaldo <= 0 && expedicaoLiberado > 0)` |
| C5 | entrega | `done`, `current`, `future` | `pedidoConcluido` |

### Desalinhamento C3 — FormalPending não distingue no stepper
- **Problema:** `applyFormalPendingStage` em `pedido-detail-progress.js:137-144` força o stage para `current` com sublabel "OP pendente" quando há formalPending (saldo zerado mas OP não terminal). Porém, `adminStepper.acabamento` na linha 348 de `pedido-chain-state.js` usa `acabSaldoEntregue ? 'current'` — que NÃO considera `acabFormalPending`. O teste `STEPPER-OP-PENDING-R1` (linha 259) valida o comportamento esperado, mas a lógica em chain-state diverge: se `acabFormalPending=true` e `acabSaldoEntregue=true`, o adminStepper fica `current` em vez de `done` — **mas o progresso visual (stepper UI) é corrigido via `applyFormalPendingStage` num segundo passo, criando dupla fonte de verdade.**
- **Severidade:** MÉDIA — funciona por coincidência (pós-processamento no computeViewModel), mas fragiliza manutenção.

---

## MATRIZ D — TEXTOS PROBLEMÁTICOS

| # | Local | Texto atual | Problema | Severidade |
|---|-------|-------------|----------|------------|
| D1 | `pedido-chain-state.js:289` | "Preparacao de insumos" | O adminBadge é "Insumos" (label curto), mas o displayStatus é frase completa. Inconsistente com outros estágios que sincronizam badge/status. | BAIXA |
| D2 | `pedido-chain-state.js:84` | fallback label "Indisponivel" | Usado apenas se nenhum label for passado ao helper `action()` — ocorre em algum canto? Não evidenciado em runtime. | BAIXA (só fallback) |
| D3 | `pedido-chain-state.js:326` | "Sem saldo disponivel" | Genérico demais — não explica se é saldo de tecido, de insumos, ou de produção. | BAIXA |
| D4 | B1/B2 ambos "Transferir" | matrix B acima | Ambiguidade entre transferência de insumos vs. produção. | MÉDIA |
| D5 | `pedido-detail-progress.js` | "OP pendente" | Sublabel usado tanto para Tecelagem quanto para Acabamento quando há formalPending. Semanticamente correto, mas pode confundir qual etapa. | BAIXA |

---

## MATRIZ E — AÇÕES QUE PRECISAM REFRESH

| # | Ação | Fonte | Recarrega? | Evidência |
|---|------|-------|------------|-----------|
| E1 | alterarStatus (rascunho→recebido→confirmado→cancelado) | `pedido-detail.smoke.js:1174-1182` | SIM — `state.pedido.status = novoStatus` seguido de `render()` | Teste 15 |
| E2 | Transferir Insumos → Tecelagem (registrarRecebimentoOrdemFio) | Teste `pedido-detail.smoke.js:965-978` | NÃO verificado — depende do helper externo | Precisa verificar se `registrarRecebimentoOrdemFio` reinvoca reload |
| E3 | Transferir Tecelagem → Acabamento (salvarEntregaCima) | Teste `pedido-detail.smoke.js:965-978` | NÃO verificado — delega para window.salvarEntregaCima | Idem |
| E4 | Liberar Expedição (liberar_expedicao RPC) | Teste `pedido-detail.smoke.js:972` | NÃO verificado | Idem |
| E5 | Registrar Entrega (registrar_entrega_expedicao RPC) | Teste `pedido-detail.smoke.js:974` | NÃO verificado | Idem |
| E6 | Aceitar OP Tecelagem (aplicarRecalculoOP) | `pedido-detail.smoke.js:1686-1693` | SIM — `await reload(); render();` | Teste 22 |
| E7 | Confirmar entrada no Acabamento (alterar_status_op) | `op-latex-admin.smoke.js:932-968` | SIM — reload pós-confirmação | Teste 37 |
| E8 | Finalizar OP Latex (alterar_status_op) | `op-latex-admin.smoke.js:598-621` | SIM — reload pós-finalização | Teste 24b |
| E9 | Concluir Pedido (concluir_pedido_se_pronto) | `pedido-detail.smoke.js:1821-1846` | SIM — `reloadN=1, renderN=1` | Teste 22 |

### Desalinhamento E2-E5 — Ações canônicas sem reload verificado
- **Problema:** As 4 ações canônicas usadas pelo `openMovementModal` (`registrarRecebimentoOrdemFio`, `salvarEntregaCima`, `liberar_expedicao`, `registrar_entrega_expedicao`) são **delegadas a helpers externos**. O modal do Pedido Detail não controla o callback pós-write — depende que cada helper emita seu próprio reload/render. Se o helper não re-renderizar o Pedido Detail, a UI fica stale.
- **Severidade:** MÉDIA — não é bug hoje (os helpers funcionam), mas é gap de resiliência.

---

## MATRIZ F — ARQUITETURA DE MÓDULOS E DEPENDÊNCIAS

| Módulo | Depende de | Expõe | Risco de desalinhamento |
|--------|-----------|-------|------------------------|
| `pedido-chain-state.js` | Nenhum (puro) | `derivePedidoChainState` | BAIXO — função pura, testada |
| `pedido-detail-progress.js` | `pedido-chain-state` (via ns) | `computeViewModel` | MÉDIO — dupla fonte de stepper state (adminStepper + applyFormalPendingStage) |
| `pedido-detail-render.js` | ns.progress, ns.events | `screenPedidoDetalhe` | MÉDIO — acoplamento com ns compartilhado |
| `pedido-detail-events.js` | Helpers externos (registrarRecebimentoOrdemFio, etc.) | handlers | MÉDIO — sem contrato formal de callbacks pós-write |
| `pedido-detail-data.js` | `supa` client | `loadPedidoDetailData` | BAIXO — isolado, com fallbacks |

---

## CONSIDERAÇÕES ADICIONAIS

1. **Último commit (`faf11f42`):** "Fix insumos tecelagem modal state refresh" — confirma que o patch mais recente já tratou de refresh no modal de insumos. O risco E2-E5 pode já estar mitigado neste commit.

2. **`AGENT_HANDOFF.md` e `PROJECT_STATE.md`** indicam "PATCH TECNICO PRONTO - AGUARDANDO VALIDACAO VISUAL DO USUARIO" — confirma que a fase atual é **validação visual**, não codificação.

3. **Cobertura de testes:** 7 arquivos de smoke test cobrem os contratos obrigatórios. Testes de runtime (VM) confirmam comportamento de `derivePedidoChainState`, `computeViewModel`, `openMovementModal`, `finalizarOp`, etc. Sem falhas detectadas.

4. **Grep output não recuperado** — o arquivo temporário de saída do grep (~49k chars) foi perdido entre sessões. As buscas relevantes foram refeitas durante a auditoria.

---

## RESUMO DE DESALINHAMENTOS

| ID | Severidade | Descrição | Localização |
|----|------------|-----------|-------------|
| B2-label | MÉDIA | B1 e B2 compartilham label "Transferir" para operações distintas | `pedido-chain-state.js:319,323` |
| C3-done | MÉDIA | `adminStepper.acabamento` vs `applyFormalPendingStage` duplicam lógica de estado `done` | `pedido-chain-state.js:348` + `pedido-detail-progress.js:137-144` |
| E2-E5 | MÉDIA | Ações canônicas no modal sem reload pós-write verificado | `pedido-detail-events.js:openMovementModal` |
| D1 | BAIXA | displayStatus "Preparacao de insumos" sem badge equivalente | `pedido-chain-state.js:289` |
| D3 | BAIXA | "Sem saldo disponivel" pouco descritivo | `pedido-chain-state.js:326` |

**Total: 5 desalinhamentos (0 críticos, 3 médios, 2 baixos). Nenhum bloqueante.**

Sugestão: validar visualmente os pontos B2 (ambiguidade de label) e C3 (dupla fonte de stepper `done`) antes de considerar a fase encerrada.
