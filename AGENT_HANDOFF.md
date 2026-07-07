# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `75ef242` — Preserve document event type in outbox export (G6-B-R1)
- Status: limpo

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`
- Push staging: `af919a2..997486a`
- Produção/origin oficial: intocados
- Status residual esperado: `?? supabase/.temp/`

## Fase concluída
RAVATEX-DOC-INGESTOR-G6-B-R1-OUTBOX-EVENT-PRESERVATION

## Fase anterior
G6-B — Comando `link` local-only (vincular documento pending a pedido sem Drive)

## Objetivo da fase G6-B-R1
Corrigir o `exportPendingEvents` / `buildEventFromRow` para preservar o `event_type` real salvo em `ingestion_events`, em vez de hardcoded `'document.detected'`.

### Causa raiz
`buildEventFromRow()` em `src/core/outbox.ts:60` hardcodava `event_type: 'document.detected'`, ignorando `e.event_type` que já era SELECTado da tabela `ingestion_events`. Eventos `document.linked` exportavam incorretamente como `document.detected`.

### Onde estava o hardcode
- `src/core/outbox.ts`, linha 60: `event_type: 'document.detected'` (hardcoded)
- `src/types/event.ts`, linha 28: `event_type: 'document.detected'` (tipo literal restritivo)

### Como foi corrigido
1. `src/types/event.ts`: `event_type` ampliado de `'document.detected'` → `string`
2. `src/core/outbox.ts`: `buildEventFromRow` usa `row.event_type` (valor real do DB) em vez de hardcode
3. `status` (`row.event_status`) já era preservado corretamente — nenhuma alteração necessária
4. O SQL de export (`exportPendingEvents`) já SELECTava `e.event_type, e.status AS event_status` — a query estava correta, o bug era só na função `buildEventFromRow`

### Testes
- 3 novos testes em `tests/link.test.ts`:
  - `exportPendingEvents preserves document.linked event_type and status`
  - `exportPendingEvents preserves document.detected event_type from real assign`
  - `re-export does NOT transform document.linked into document.detected`
- 232 testes passando (21 suites) — 3 novos + 229 existentes

### Arquivos alterados
- `src/types/event.ts` — `event_type: string` (era `'document.detected'`)
- `src/core/outbox.ts` — `event_type: row.event_type` (era hardcoded)
- `tests/link.test.ts` — 3 novos testes de preservação de export
- `PROJECT_STATE.md`, `AGENT_HANDOFF.md` — atualização documental

### Garantias
- `document.detected` continua exportando como `document.detected`
- `document.linked` exporta como `document.linked`
- `status` (`pending_app_acceptance`) preservado em ambos
- Nenhuma alteração em schema, assign real, scan real, ou comando `link`
- Nenhum Google/Drive chamado

### Riscos remanescentes
1. **App acceptance é dead end**: não há comando para transicionar `assigned → accepted/rejected`
2. **event_id no export é document_id, não ingestion_events.id**: `buildEventFromRow` usa `row.id` que é `d.id` (document_id), não `e.id`. Comportamento legado, não quebra integração atual.
3. **Sem proteção contra vínculo de direção errada**: NF entrada pode ser linked a pedido de saída sem aviso
4. **Manifest do Pedido desatualizado após link**: documento linked local-only não está na pasta do pedido no Drive
5. **accepted/rejected não geram evento de outbox**

### Próxima fase recomendada
RAVATEX-DOC-INGESTOR-G6-C-APP-ACCEPTANCE-AND-FUNNEL
Foco: comando `accept`/`reject` local-only para transicionar `assigned → accepted/rejected`, com evento outbox `document.accepted`/`document.rejected`, fechando o funil de aceite do app.
