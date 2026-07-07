# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `a48209a` — G5 real validation + retry-message hardened
- Status: limpo

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`
- Push staging: `af919a2..997486a`
- Produção/origin oficial: intocados
- Status residual esperado: `?? supabase/.temp/`

## Fase concluída
RAVATEX-DOC-INGESTOR-G5-RETRY-AND-REAL-VALIDATION

## Fase anterior
G5 — Taxonomia + classificação + Drive layout + Manifest + retry + validação real

## Objetivo da fase G5
Validar em real o retry por Gmail messageId e confirmar que o pipeline taxa → pending → assign → outbox opera corretamente com dados reais.

### Validação real G5-R4-R1
Comando executado pelo operador:
```
npm.cmd run scan -- --retry-message 19f3c813e8d45be1 --max-attachments 1 --confirm-real-google
```
Resultado:
```
emailsScanned:    1
attachmentsFound: 1
newDocuments:     0
duplicates:       0
crossMsgDuplicates: 1
skippedByCap:     0
```

Comando de verificação:
```
npm.cmd run list:pending -- --tipo nf --formato xml --direcao entrada --limit 5
```
Confirmou documento `teste-nfe-entrada` como:
- tipo: nf, formato: xml, direcao_nf: entrada, status: pending, drive_id: presente

Report:
```
totalDocuments: 3
nf: 1
xml: 1
entrada: 1
pending NF entrada: 1
recentErrors: 0
```

Observação: `crossMsgDuplicates=1` (em vez de `duplicates=1`) é esperado — o retry reencontrou o mesmo sha256 de outro email (cross-message). Não criou documento novo. Escopo retry corrigido.

HEAD aprovado: `a48209a` (git status limpo).

## O que NÃO foi feito (intencionalmente)
- Nenhum scan real adicional ao necessário
- Nenhum assign real executado
- Nenhuma chamada Google/Drive extra
- Nenhuma alteração em data/app.db real
- Nenhum commit de token, cache, runs, outbox ou dados reais
- Nenhum toque em produção/origin oficial
- Nenhum commit de `supabase/.temp/`

## Histórico de fases
### documentos-ingestor
- A — Scaffold (28 testes, 6 suites)
- B — Gmail scan dry-run
- C1 — Login OAuth interativo
- C2 — Smoke real (1 email → Drive → assign → outbox)
- D — Hardening (caps, dedup, run log)
- D-R1 — Test isolation (drive.test.ts com fake Drive)
- E — CI mock integration (94 testes, 16 suites)
- F — UX (operational UX)
- G1 — Taxonomia 3 eixos (types + contracts + storage)
- G2 — Classificação XML NF-e direção (CNPJs)
- G3 — Drive folder layout hierárquico
- G4 — Manifest do Pedido
- G5 — Retry messageId + validação real R4-R1

### Controle de Tapetes (staging/work/app-next)
- G/H — UI Backlog Closeout (14/14 itens, HEAD 997486a)

---

## G6-A DIAGNÓSTICO — Fluxo pending → pedido/app/outbox

### 1. Hoje existe comando para vincular documento pending a um pedido?
**Sim, parcialmente.** O comando `npm run assign -- --id <id> --pedido <num>` existe, mas é **exclusivamente real-Google**: sem `--confirm-real-google`, ele apenas valida formato do pedido e retorna `null` (dry-run textual). Não há operação local-only que apenas marque `pedido_manual` e gere evento de outbox sem mover arquivos no Drive.

### 2. Se existe, ele é seguro, testado e local-only?
**Não é local-only.** O `assign` real (`src/core/realAssign.ts:56-208`) faz:
1. Move/copia arquivo no Drive (pasta pendentes → pasta pedido)
2. Cria/atualiza manifest.json no Drive
3. Atualiza SQLite (status → assigned, pedido_manual, storage_uri, drive IDs)
4. Cria evento na tabela `ingestion_events` com status `pending_app_acceptance`
5. Append no outbox JSONL

Tudo isso depende de Drive real (ou mock completo nos testes). Não existe fluxo "assign light" que só atualize SQLite + outbox.

Testes existentes (`assign-real.test.ts`, `integration-mock-flow.test.ts`) cobrem o fluxo completo com Drive mock. São 189 + 288 linhas de teste. Mas nenhum teste cobre assign **sem** Drive.

### 3. Se não existe, qual é a menor fase implementável?
A menor fase é **G6-A assignment local-only**: um comando `link` ou flag `--local-only` no `assign` existente que:
- Apenas valide o documento como pending
- Atualize `pedido_manual` e `status='assigned'` no SQLite
- Gere evento `ingestion_events` com status `pending_app_acceptance`
- Faça append no outbox JSONL
- **Pule** Drive move, manifest upload, cache local

### 4. O vínculo deve ser por qual identificador?
O sistema já suporta `pedido_manual` normalizado como `PED-NN-YYYY`. O `normalizePedido()` em `src/core/pedido.ts:1-29` aceita formatos `25/2026`, `PED-25-2026`, `PED 25/2026`, etc. **Usar o mesmo identificador já existente** (`pedido_manual` na tabela `documentos`).

### 5. O outbox já registra evento quando documento muda de pending para vinculado/aceito?
**Sim**, mas só via assign real (com Drive). O evento é criado em `realAssign.ts:175-196` com status `pending_app_acceptance` e appended ao outbox JSONL. O fluxo de `exportPendingEvents` em `src/core/outbox.ts:23-52` exporta eventos pendentes (`exported_at IS NULL`).

**Lacuna:** não existe transição local-only `pending → assigned` que dispare o evento de outbox.

### 6. Diferença entre:
- **documento vinculado a pedido**: `status='assigned'`, `pedido_manual` preenchido
- **documento aceito pelo app**: `status='accepted'` — hoje só é setado manualmente ou via reprocess. **Nunca** pelo fluxo real.
- **documento pendente sem pedido**: `status='pending'`, `pedido_manual IS NULL`

O schema tem 4 status: `pending → assigned → accepted | rejected`. O `accepted`/`rejected` são dead ends — não há código que os transicione a partir de `assigned` exceto edição manual ou reprocess.

### 7. O report atual permite acompanhar esse funil?
**Parcialmente.** O report (`src/core/queries.ts:125-224`) mostra:
- `pendingWithoutPedido`: count de `status='pending'`
- `assignedByPedido`: count de `status='assigned'` agrupado por pedido
- `pendingAppAcceptance`: count de `ingestion_events` com `status='pending_app_acceptance'` e `exported_at IS NULL`
- NF por direção, pending NF por direção

**Não mostra:** documentos assigned sem outbox event, assigned aguardando aceite do app, funil completo `pending → assigned → accepted/rejected`.

### 8. Quais invariants devem proteger contra vínculo errado?
- Documento já assigned ou accepted/rejected: **bloquear** (já existe em `realAssign.ts:73`)
- Pedido mal formatado: **bloquear** (já existe em `normalizePedido()`)
- Documento sem drive_file_id: **permitir assign local-only** (não precisa de Drive)
- Duplicidade de vínculo (mesmo documento para dois pedidos): **bloquear** (já existe)
- Documento de outro CNPJ/direção vinculado a pedido errado: **warning no mínimo** (não existe)
- Outbox event duplicado: Já existe `isEventDuplicate()` em `outbox.ts:85-91`

### 9. Quais testes focados seriam obrigatórios?
Para G6 assignment local-only:
1. `link` command aceita `--id` + `--pedido` sem `--confirm-real-google` e atualiza SQLite
2. Documento muda de `pending` para `assigned` com `pedido_manual` preenchido
3. Evento é criado em `ingestion_events` com status `pending_app_acceptance`
4. Outbox JSONL recebe o evento
5. Segundo assign no mesmo documento é rejeitado (idempotência)
6. Pedido inválido é rejeitado
7. Documento inexistente é rejeitado
8. Documento já assigned é rejeitado
9. `report` reflete a mudança (pendingWithoutPedido diminui, assignedByPedido aparece)
10. `list:pending --status assigned` mostra o documento

### 10. A próxima fase deve ser schema, CLI, outbox, report, ou combinação?
**Combinação mínima: CLI + outbox + (pequeno ajuste no report).**
- Schema: já suporta (status assigned, pedido_manual, ingestion_events)
- CLI: adicionar comando `link` ou flag `--local-only` no assign
- Outbox: já pronto, só acionar após SQLite update
- Report: ajuste pequeno para mostrar assigned vs pendingAppAcceptance

### Lacunas encontradas no diagnóstico
1. **Sem assign local-only**: todo assign requer Google Drive real
2. **app acceptance é dead end**: não há comando para transicionar `assigned → accepted/rejected`
3. **Funil incompleto no report**: não mostra quantos estão assigned aguardando aceite do app
4. **Sem proteção contra vínculo de direção errada**: pode vincular NF entrada a pedido de saída sem aviso
5. **accepted/rejected não geram evento de outbox**: se status mudar, não há notificação

### Risco principal da próxima implementação
**Criar assign local-only que seja inconsistente com o assign real.** Se o local-only setar `status='assigned'` sem mover o arquivo no Drive, o manifest do Pedido fica incompleto (documento não está na pasta do pedido no Drive). O operador precisa entender que `link` local-only ≠ assign real completo. Sugestão: nomear o comando como `link` (não `assign`) para deixar claro que é apenas vínculo lógico, sem efeito colateral no Drive.

### Recomendação objetiva da próxima fase
**G6-B LINK assignment local-only** — Implementar comando `link` que:
- Aceita `--id <doc_id>` e `--pedido <num>` (sem `--confirm-real-google`)
- Valida formato do pedido, documento existe, status pending
- Atualiza SQLite: `pedido_manual`, `status='assigned'`
- Cria evento `ingestion_events` com status `pending_app_acceptance`
- Append no outbox JSONL
- Não toca Drive, não move arquivos, não cria manifest
- Testes herméticos obrigatórios (sem Drive mock)
- Ajuste mínimo no `report` para distinguir assigned vs pendingAppAcceptance

### Ordem pronta para o próximo IAExecutor

```
FASE: RAVATEX-DOC-INGESTOR-G6B-LINK-ASSIGNMENT-LOCAL-ONLY

Agente recomendado: DeepSeek Flash
Modo: implementação controlada (CLI + outbox + tests)
Escopo:
  1. Adicionar comando `link` em CLI (src/cli.ts):
     --id <document_id_or_email_id>
     --pedido <pedido_number>
     Sem --confirm-real-google (é sempre local-only)
  2. Criar função linkDocument() em src/core/ingest.ts ou novo src/core/link.ts
     - Valida pedido (normalizePedido)
     - Busca documento por id ou gmail_message_id
     - Verifica status pending (bloqueia se assigned/accepted/rejected)
     - Gera evento UUID
     - UPDATE documentos SET pedido_manual, status='assigned', updated_at
     - INSERT INTO ingestion_events com status 'pending_app_acceptance'
     - appendEvent() no outbox JSONL
     - Retorna { documentId, pedidoManual, eventId }
  3. Testes herméticos em tests/link.test.ts (sem Drive mock):
     - link comando aceita id + pedido
     - status muda pending → assigned
     - pedido_manual preenchido
     - ingestion_events criado
     - outbox JSONL contém evento
     - idempotência: segundo link rejeitado
     - pedido inválido rejeitado
     - documento inexistente rejeitado
     - documento já assigned rejeitado
  4. Ajuste no report (queries.ts) para:
     - Adicionar assignedByStatus no generateReport (opcional)
     - Não quebrar existing tests
  5. Atualizar PROJECT_STATE.md e AGENT_HANDOFF.md

Não fazer:
  - Não alterar realAssign.ts, realScan.ts
  - Não tocar drive.ts, gmail.ts, oauth.ts
  - Não alterar schema.sql nem criar migration
  - Não chamar Google/Drive real
  - Não fazer assign real (sem Drive move)

Testes obrigatórios:
  - npm.cmd test (garantir 152+ testes passando)
  - git diff --check

Critério de aceite:
  - npm.cmd run link -- --id <doc_id> --pedido 25/2026 funciona sem Google
  - Documento aparece como assigned no list-pending --status assigned
  - Evento aparece no outbox JSONL
  - Report mostra assignedByPedido
  - Todos os testes existentes continuam passando
  - Nenhum dado real é tocado ou commitado

HEAD esperado: a48209a + 1 commit documental
```

## Próxima fase recomendada
RAVATEX-DOC-INGESTOR-G6B-LINK-ASSIGNMENT-LOCAL-ONLY
Foco: vincular documento pending a pedido sem Google real (local-only SQLite + outbox). Sem Drive move, sem manifest upload. Ver ordem completa acima.
