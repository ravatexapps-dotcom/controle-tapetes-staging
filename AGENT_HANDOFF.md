# AGENT HANDOFF

## Branch/HEAD/Status
### documentos-ingestor (este repositório)
- Branch: master
- HEAD: `0f864a2` — Record real-lite operational smoke
- Status: limpo

### Controle de Tapetes (staging/work/app-next)
- HEAD canônico: `997486a`

## Fase concluída
RAVATEX-DOC-INGESTOR-G8-D-REAL-LITE-OPERATIONAL-SMOKE

## Fase anterior
G8-C — Polish operacional (filtros, export, inspect)

## Objetivo da fase G8-D
Validar em ambiente real-lite (SQLite real, sem Google/Drive) que o funil local funciona com documento teste do G5.

### Documento teste usado
- Gmail message ID: `19f3...e1` (G5 smoke document)
- Doc ID: `cda1...05` (masked)
- Tipo: nf, formato: xml, direção: entrada
- Status inicial: `pending`
- Pedido inicial: `(none)`

### Comandos executados

**Parte 1 — Baseline:**
```
npm.cmd run inspect -- --id 19f3c813e8d45be1
→ status=pending, pedido=none, drive_file_id presente, drive_web_view_link presente

npm.cmd run report -- --days 1
→ 3 documentos (1 nf/entrada, 2 desconhecido), 0 accepted, 0 rejected
```

**Parte 2 — Link local-only:**
```
npm.cmd run link -- --id 19f3c813e8d45be1 --pedido 999/2026
→ [link] Linked: document=cda1...05 pedido=PED-99-2026 event=c9fe...fc

npm.cmd run inspect -- --id 19f3c813e8d45be1
→ status=assigned, pedido=PED-99-2026

npm.cmd run export:events -- --pedido PED-99-2026 --event-type document.linked --json
→ event_type=document.linked, ingestion_event_id=c9fe...fc, event_id=cda1...05 (legado)
```

**Parte 3 — Accept local-only:**
```
npm.cmd run accept -- --id 19f3c813e8d45be1
→ [accept] Accepted: document=cda1...05 pedido=PED-99-2026 event=ebfd...76

npm.cmd run inspect -- --id 19f3c813e8d45be1
→ status=accepted

npm.cmd run export:events -- --pedido PED-99-2026 --event-type document.accepted --json
→ event_type=document.accepted, ingestion_event_id=ebfd...76, status=accepted, event_id legado preservado

npm.cmd run report -- --days 1
→ documentsAccepted=1, pendingWithoutPedido=2
```

### Evidências
- **Link**: `document.linked` exportado com `ingestion_event_id` UUID, `event_id` = document_id (legado)
- **Accept**: `document.accepted` exportado com `ingestion_event_id` diferente do linked
- **Links Drive**: `inspect` mostra `drive_file_id`, `drive_web_view_link`, `drive_content_link`, `storage_uri` (valores reais, sem máscara)
- **Report**: baseline 3 pending → após link+accept: 1 accepted, 2 pending (sem pedido)
- **Git status**: limpo (nenhum arquivo alterado, nenhum dado commitado)

### Garantias
- Nenhum scan real executado
- Nenhum assign real executado
- Nenhuma chamada Google/Drive real
- Nenhum dado commitado
- Apenas documento teste controlado foi tocado via comandos CLI local-only

### Riscos remanescentes
1. Manifest Drive não reflete link/accept local-only (documento não foi movido no Drive)
2. Bloqueio de mismatch entrada/saída deferido
3. event_id migração v2 deferida

### Próxima fase recomendada
RAVATEX-DOC-INGESTOR-G9-DRIVE-MANIFEST-SYNC-DESIGN
Foco: sincronizar assign real com documentos linked, atualizar manifest Drive, integração Controle de Tapetes.
