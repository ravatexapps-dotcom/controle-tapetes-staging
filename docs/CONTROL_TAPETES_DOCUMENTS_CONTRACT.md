# Controle de Tapetes → Documents Ingestor: Contrato Futuro

> **Status:** Design / read-only. Nenhuma integração implementada nesta fase.
> **Objetivo:** Documentar o que o app Controle de Tapetes consumirá do Documents Ingestor, sem ainda alterar o app principal.

---

## 1. Visão geral

O Documents Ingestor é o módulo que recebe documentos (PDF/XML) via Gmail, classifica, armazena canonicamente no Google Drive e gera eventos para consumo externo. O Controle de Tapetes é o app principal que gerencia Pedidos, clientes e produção.

A integração futura será **unidirecional**: Controle de Tapetes **consome** eventos do Documents Ingestor, nunca o contrário.

```
┌─────────────────────┐         ┌──────────────────────┐
│  Gmail (PDF/XML)    │────────▶│  Documents Ingestor  │
└─────────────────────┘         │  - scan              │
                                │  - classify          │
                                │  - upload to Drive   │
                                │  - generate events   │
                                └──────────┬───────────┘
                                           │ outbox JSONL
                                           ▼
                                ┌──────────────────────┐
                                │  Controle de Tapetes  │
                                │  - consume events     │
                                │  - show in Pedido     │
                                │  - accept/reject      │
                                └──────────────────────┘
```

---

## 2. O que o Controle de Tapetes consumirá

### 2.1 Eventos `document.detected` (outbox JSONL)

Arquivo: `data/outbox/document-events.jsonl` (local) ou `document-storage-uri` no Drive.

Cada evento carrega:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `schema_version` | int | Versão do schema (atual: 1) |
| `event_type` | string | `"document.detected"` |
| `event_id` | UUID | ID único do evento |
| `created_at` | ISO-8601 | Timestamp de criação |
| `pedido_manual` | string | Pedido normalizado (ex: `PED-25-2026`) |
| `source` | string | `"gmail"` |
| `gmail_message_id` | string | ID da mensagem Gmail original |
| `thread_id` | string | ID da thread Gmail |
| `status` | enum | `pending_app_acceptance` \| `accepted` \| `rejected` |
| `document.document_id` | UUID | ID interno do documento |
| `document.tipo_documento` | enum | `nf_pdf` \| `nf_xml` \| `romaneio` \| `desconhecido` |
| `document.filename_original` | string | Nome original do arquivo |
| `document.sha256` | hex | Hash SHA256 do conteúdo |
| `document.storage_backend` | string | `"google_drive"` |
| `document.storage_uri` | URI | `gdrive://file/<drive_file_id>` |
| `document.drive_file_id` | string | ID do arquivo no Google Drive |
| `document.drive_web_view_link` | URL | Link de visualização no Drive |
| `document.drive_web_content_link` | URL | Link de download direto |
| `document.manifest_storage_uri` | URI | URI do manifest do Pedido no Drive |

### 2.2 Manifest do Pedido (no Drive)

Arquivo: `Ravatex Documents Ingestor/pedidos/PED-XX-YYYY/manifest.json`

Estrutura:
```json
{
  "schema_version": 1,
  "pedido": "PED-25-2026",
  "created_at": "...",
  "updated_at": "...",
  "storage_backend": "google_drive",
  "manifest_storage_uri": "gdrive://file/<manifest_id>",
  "documents": [
    {
      "document_id": "uuid",
      "tipo_documento": "nf_pdf",
      "filename_original": "nota.pdf",
      "sha256": "abc...",
      "storage_backend": "google_drive",
      "storage_uri": "gdrive://file/<id>",
      "drive_file_id": "...",
      "drive_web_view_link": "https://...",
      "ingested_at": "...",
      "event_id": "uuid",
      "status": "pending_app_acceptance"
    }
  ]
}
```

### 2.3 Links Drive (canônico)

Os documentos ficam no Google Drive da mesma conta usada para o Gmail. Links são públicos dentro do workspace.

**Layout Drive (G3+):**
```
Ravatex Documents Ingestor/
  pendentes/
    YYYY-MM-DD/
      nf/{entrada,saida,desconhecida}/
      romaneio/
      desconhecido/
  pedidos/
    PED-XX-YYYY/
      manifest.json
      YYYY-MM-DD/
        nf/{entrada,saida,desconhecida}/
        romaneio/
        desconhecido/
```

**Compatibilidade:** Arquivos pré-G3 em `pendentes/YYYY-MM-DD/email-<msgid>/` e manifests/eventos antigos continuam válidos.

---

## 3. Campos mínimos para exibição no Pedido

Para mostrar um documento pendente na UI do Controle de Tapetes, são necessários:

| Campo | Origem | Obrigatório |
|-------|--------|-------------|
| `document_id` | evento | sim |
| `pedido_manual` | evento | sim |
| `tipo_documento` | evento | sim |
| `filename_original` | evento | sim |
| `drive_web_view_link` | evento | sim (link para abrir no Drive) |
| `drive_file_id` | evento | sim (para ações) |
| `created_at` | evento | sim (ordenação) |
| `status` | evento | sim (`pending_app_acceptance`) |

---

## 4. Fluxo futuro de aceite/rejeição

```
1. Documents Ingestor gera evento `document.detected` com status `pending_app_acceptance`
2. Controle de Tapetes consome evento (poll outbox ou watch arquivo)
3. Controle de Tapetes mostra notificação no Pedido
4. Usuário aceita ou rejeita no Controle de Tapetes
5. Controle de Tapetes atualiza status (mecanismo a definir — ver §6)
6. Documents Ingestor pode opcionalmente mover/apagar arquivo do Drive (fase futura)
```

**Importante:** nesta fase, o status `pending_app_acceptance` é gerado mas **não há mecanismo de feedback** do Controle de Tapetes. O Documents Ingestor não consulta nenhum endpoint externo.

---

## 5. Status `pending_app_acceptance`

Este status significa: "documento foi classificado, atribuído a um Pedido, movido para a pasta do Pedido no Drive, e está aguardando o app principal decidir se aceita ou rejeita".

A decisão de aceite/rejeição é **exclusiva do Controle de Tapetes**. O Documents Ingestor não toma essa decisão.

---

## 6. O que NÃO será feito nesta fase

- ❌ Nenhuma chamada HTTP/Webhook do Documents Ingestor para o Controle de Tapetes
- ❌ Nenhum polling ativo do Controle de Tapetes para o outbox
- ❌ Nenhuma alteração no repositório do Controle de Tapetes
- ❌ Nenhum Supabase
- ❌ Nenhuma autenticação compartilhada entre os dois apps
- ❌ Nenhum mapeamento automático de email → Pedido (atribuição é manual)
- ❌ Nenhuma deleção automática de arquivo no Drive após aceite
- ❌ Nenhuma atualização de status `accepted`/`rejected` pelo Documents Ingestor

---

## 7. O que será feito em fases futuras

| Fase | Descrição |
|------|-----------|
| G | Design do mecanismo de feedback (poll vs webhook vs push) |
| H | Implementação do consumidor no Controle de Tapetes |
| I | Atualização de status (accepted/rejected) via endpoint ou arquivo de controle |
| J | Limpeza opcional do Drive após aceite |

---

## 8. Comandos úteis para o operador do Controle de Tapetes

Enquanto a integração não existe, o operador pode usar os comandos do Documents Ingestor para inspecionar:

```bash
# Listar documentos pendentes (saída segura, IDs mascarados)
npm run list:pending

# Inspecionar um documento específico
npm run inspect -- --id <document_id_ou_gmail_message_id>

# Ver relatório agregado
npm run report

# Reprocessar (dry-run por padrão)
npm run reprocess -- --id <document_id>
npm run reprocess -- --id <document_id> --confirm
```

Todos os comandos são read-only por padrão, exceto `reprocess --confirm` que aplica ações locais idempotentes. Nenhum comando chama Google real sem `--confirm-real-google`.
