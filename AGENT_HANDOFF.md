# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `b4659a1` — Persist rejection reason in document events (G7-C-R1)

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`
- Push staging: `af919a2..997486a`
- Produção/origin oficial: intocados

## Fase concluída
RAVATEX-DOC-INGESTOR-G7-C-R1-REJECTION-REASON-PERSISTENCE

## Fase anterior
G7-C — Smoke local sintético (funil completo validado)

## Objetivo da fase G7-C-R1
Persistir `reason` de rejeição na tabela `ingestion_events` para que sobreviva ao re-export via `exportPendingEvents`.

### Causa raiz
`acceptance.ts:buildEvent()` incluía `reason` no objeto de evento, e `appendEvent()` escrevia no outbox JSONL corretamente. Porém:
- O INSERT em `ingestion_events` não incluía a coluna `reason`
- O SELECT em `exportPendingEvents` não lia `reason`
- `buildEventFromRow` não incluía `reason` no evento re-exportado

### Solução
1. **`schema.sql`**: adicionada coluna `reason TEXT` na tabela `ingestion_events`
2. **`sqlite.ts`**: migração `ensureLocalMigrations` adiciona a coluna se ausente (idempotente, verifica `table_info`)
3. **`acceptance.ts`**: INSERT agora inclui `reason` (NULL para accept, valor para reject)
4. **`outbox.ts`**: SELECT inclui `e.reason`; `buildEventFromRow` adiciona `reason` ao documento quando presente (via spread condicional)
5. **`funnel-smoke.test.ts`**: teste 2 agora valida `reason` após re-export

### Impacto
- Alteração de schema: sim, coluna `reason TEXT` adicionada via ALTER TABLE (migração segura)
- `document.accepted` e `document.linked` não são afetados (reason = NULL)
- `document.rejected` com reason mantém o campo após re-export
- `document.rejected` sem reason mantém comportamento atual (sem campo reason)

### Arquivos alterados
- `src/storage/schema.sql` — +1 linha (`reason TEXT`)
- `src/storage/sqlite.ts` — +4 linhas (migração)
- `src/core/acceptance.ts` — INSERTs atualizados com coluna `reason`
- `src/core/outbox.ts` — SELECT + `buildEventFromRow` com `reason`
- `tests/funnel-smoke.test.ts` — valida `reason` no re-export
- `PROJECT_STATE.md`, `AGENT_HANDOFF.md` — atualização

### Testes
- 24 suites, 264 testes passando (sem novos, funnel smoke atualizado)
- `funnel-smoke.test.ts` test 2: verifica reason no outbox inicial e no re-export
- `storage-schema.test.ts`: 21 testes passando (migração compatível com legacy DBs)

### Riscos remanescentes
1. Bloqueio de mismatch entrada/saída deferido (falta modelo de pedido)
2. Manifest Drive desatualizado após link (deferido)
3. event_id legado = document_id (deferido para v2)

### Próxima fase recomendada
RAVATEX-DOC-INGESTOR-G8-INTEGRATION-AND-SYNC
Foco: revisar assign real para incluir documentos já linked, sync manifest Drive, e integração com Controle de Tapetes.
