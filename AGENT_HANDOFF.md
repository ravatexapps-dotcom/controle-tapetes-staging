# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `4385697` — Record G7 guardrails diagnostic

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`
- Push staging: `af919a2..997486a`
- Produção/origin oficial: intocados

## Fase concluída
RAVATEX-DOC-INGESTOR-G7-A-GUARDRAILS-DIAGNOSTIC

## Fase anterior
G6-C — Comandos `accept`/`reject` local-only + funil no report

## Objetivo da fase G7-A
Diagnóstico read-only dos guardrails antes de implementar G7-B. Mapear riscos de direção NF, event_id legado, manifest Drive e report/funil.

---

## A) Direção NF / Pedido

### Evidência no código
- `classifier.ts:54-71` — `lerDirecaoNFe()` extrai CNPJ do emitente/destinatário do XML e compara com `config.ravatexCnpjs`. Retorna `'entrada'` (destinatário é Ravatex), `'saida'` (emitente é Ravatex), ou `'desconhecida'`.
- `pedido.ts:1-29` — `normalizePedido()` apenas formata string para `PED-NN-YYYY`. Não resolve pedido real, não consulta banco externo.
- Schema `documentos` não tem campo de "direção esperada do pedido". `pedido_manual` é TEXT puro.
- PDFs classificados como NF têm `direcao_nf = null` (não-determinável sem OCR).
- `link.ts:22-24` — não lê nem valida `direcao_nf` do documento.

### Risco
Vincular NF entrada a pedido que espera saída (ou vice-versa) sem nenhum aviso. O operador pode cometer erro silencioso.

### Patch mínimo recomendado
**Warning no `link` quando `direcao_nf` for `null` ou `'desconhecida'`.** Não bloquear — não há dado confiável de direção esperada no pedido. Apenas informar:

```
[link] Warning: document has unknown/undetermined direcao_nf. Verify manually.
```

Arquivos: `link.ts` (adicionar warning após SELECT, antes do UPDATE). Testes: 2-3 (warning emitido para direcao_nf = null, warning para desconhecida, sem warning para entrada/saida determinada).

**Deferir** bloqueio de mismatch entrada/saída até existir modelo de pedido com direção esperada ou tabela de regras.

---

## B) event_id legado

### Evidência no código
- `outbox.ts:32-38` — SELECT `d.*, e.pedido_manual, e.event_type, e.status AS event_status, e.storage_uri, ...`. O `d.*` inclui `d.id`. `e.id` NÃO está no SELECT.
- `outbox.ts:61` — `event_id: row.id` → `row.id` = `d.id` = `documentos.id` (document_id).
- `outbox.ts:68` — `document_id: row.id` → mesmo valor. Correto para document.document_id.
- `event.ts:31` — `event_id: string` — tipo permite UUID mas valor atual é document_id.
- Contrato documentado (`docs/CONTROL_TAPETES_DOCUMENTS_CONTRACT.md:46`) diz `event_id: UUID | ID único do evento`, sugerindo UUID do evento, não do documento.

### Risco
Se um documento tem múltiplos eventos (linked, accepted), o `event_id` no outbox é o mesmo em todos. Consumidores não conseguem distinguir eventos distintos para o mesmo documento.

### Patch mínimo recomendado
**Adicionar `ingestion_event_id` ao evento outbox.** Manter `event_id` como está (compatibilidade legada). O `ingestion_event_id` teria o UUID real do `ingestion_events.id`.

Mudanças:
1. `outbox.ts:32-38` — SELECT adicionar `e.id AS ingestion_event_id`
2. `outbox.ts:58-82` — `buildEventFromRow` adicionar `ingestion_event_id: row.ingestion_event_id` ao retorno (fora do `document` object, no nível raiz)
3. `event.ts:26-39` — `DocumentEvent` adicionar `ingestion_event_id?: string`
4. Testes: 2-3 (documento com múltiplos eventos tem ingestion_event_id distintos, ingestion_event_id existe, event_id legado preservado)

**Deferir** migração de `event_id` para `ingestion_event_id` (quebra de compatibilidade) até schema v2.

---

## C) Manifest Drive após link local-only

### Evidência no código
- `manifest.ts` — `loadManifest/saveManifest/addDocumentToManifest` operam em arquivos locais.
- `realAssign.ts:106-115` — upload manifest para Drive via `deps.uploadManifest`.
- `realAssign.ts:117-132` — `addDocumentToManifest('/dev/null', ...)` — usa placeholder path.
- `link.ts` — não toca manifest (local ou Drive). Apenas SQLite + outbox.
- `acceptance.ts` — não toca manifest. Apenas SQLite + outbox.
- O outbox JSONL é o contrato de integração documentado.

### Risco
Operacional: se fizer link local-only e depois assign real, o manifest Drive não reflete documentos previamente linked (pois o arquivo não está na pasta do pedido no Drive). Edge case aceitável.

### Patch mínimo recomendado
**Nenhum.** O outbox JSONL é a fonte de verdade do vínculo. Manifest Drive é artefato do assign real. Link local-only é operação de vínculo lógico, não de storage.

**Deferir** sync manifest Drive até G8 (assign real revisado ou batch sync).

---

## D) Report/Funil

### Evidência no código
- `queries.ts:146-148` — `documentsByStatus` agrupa por `documentos.status` (pending, assigned, accepted, rejected).
- `queries.ts:176-182` — `pendingWithoutPedido` = count de `status='pending'`.
- `queries.ts:184-195` — `assignedByPedido` = count de `status='assigned'` agrupado.
- `queries.ts:197-199` — `pendingAppAcceptance` = count de `ingestion_events WHERE status='pending_app_acceptance' AND exported_at IS NULL`.
- `queries.ts:201-207` — `documentsAccepted` e `documentsRejected`.
- Único contador de eventos na seção de sumário: `pendingAppAcceptance`.

### Risco
MÍNIMO. O funil está visível mas disperso em múltiplos contadores. `pendingAppAcceptance` é contador de eventos, não de documentos, e fica entre contadores de documentos no sumário — leve confusão semântica.

### Patch mínimo recomendado
**Agrupar sumário do report em seções: documentos (by status/tipo/formato/direção/pedido) e outbox (pending events).** Renomear `pendingAppAcceptance` para `outboxPendingEvents` ou movê-lo para seção outbox.

Mudanças:
1. `queries.ts:119` — renomear `pendingAppAcceptance` para `outboxPendingEvents` (ou manter e ajustar display)
2. `cli.ts:276-278` — reorganizar saída texto do report em seções "documents" e "outbox"

**Deferir** até G7-B ou G8 conforme prioridade.

---

## Matriz de decisão

| Problema | Risco | Patch G7-B? | Deferido? | Arquivos afetados |
|---|---|---|---|---|
| Direção NF cega no link | Médio — erro operacional silencioso | SIM — warning | Bloqueio deferido (falta modelo pedido) | link.ts + 2 testes |
| event_id = document_id | Baixo — consumidores confundem eventos | SIM — adicionar ingestion_event_id | Migração event_id deferida (v2) | outbox.ts, event.ts + 2 testes |
| Manifest Drive desatualizado | Baixo — outbox é fonte de verdade | NÃO | Deferido até G8 (assign real batch) | Nenhum |
| Report disperso | Muito baixo — cosmético | SIM — reorganizar seções | Nenhum | queries.ts, cli.ts + 2 testes |

---

## Recomendação objetiva para G7-B

**RAVATEX-DOC-INGESTOR-G7-B-GUARDRAILS-PATCH**

Implementar os 3 patches seguros (direção warning, ingestion_event_id, report reorganizado), NÃO implementar bloqueio de direção nem migração de event_id.

**Ordem pronta para o próximo IAExecutor:**

```
FASE: RAVATEX-DOC-INGESTOR-G7-B-GUARDRAILS-PATCH

Agente: DeepSeek Pro
Modo: patch pequeno com testes focados
HEAD base: (G7-A commit)

Escopo:
  1. link.ts: warning quando direcao_nf é null ou 'desconhecida'
     - Antes do UPDATE, emitir console.warn se doc.direcao_nf for null/nulo
     - Não bloquear o link
  2. outbox.ts: adicionar ingestion_event_id ao SELECT e ao buildEventFromRow
     - SELECT: adicionar `e.id AS ingestion_event_id` após `e.manifest_storage_uri`
     - buildEventFromRow: adicionar `ingestion_event_id: row.ingestion_event_id`
  3. event.ts: adicionar ingestion_event_id?: string ao DocumentEvent
  4. queries.ts: renomear pendingAppAcceptance → outboxPendingEvents
  5. cli.ts: reorganizar saída do report em seções "documents" e "outbox"
  6. Testes: 6-8 testes no total (2 direção, 2 event_id, 2 report)
  7. Docs: atualizar PROJECT_STATE.md e AGENT_HANDOFF.md

Não fazer:
  - Não implementar bloqueio de direção NF entrada/saída
  - Não migrar event_id (manter compat legado)
  - Não tocar manifest Drive
  - Não alterar schema
  - Não chamar Google/Drive real
  - Não fazer scan/assign real

Testes obrigatórios:
  - npm.cmd test (≥250 passando, sem regressão)
  - git diff --check

Critério de aceite:
  - link emite warning para direção desconhecida
  - link não bloqueia por direção
  - ingestion_event_id existe no evento outbox
  - event_id legado preservado
  - report mostra seções organizadas
  - testes existentes continuam passando
```
