# Ravatex Documents Ingestor

Módulo separado para ingestão de documentos (XML/PDF) via Gmail para o sistema Ravatex.

## Decisão arquitetural: **Drive-first**

> O Google Drive da mesma conta usada para leitura do Gmail é o **armazenamento canônico** dos documentos PDF/XML.

O disco local é usado **apenas** para:
- **SQLite** (`data/app.db`) — estado de processamento
- **Outbox JSONL** (`data/outbox/document-events.jsonl`) — eventos para o app principal
- **Cache temporário** (`data/cache/`) — espelho local *opcional* dos documentos, **nunca** fonte de verdade
- **Metadados auxiliares** (token Google, logs, mocks de teste)

`data/documents` (legado do scaffold anterior) foi removido. Qualquer coisa em disco local é explicitamente *cache*.

## Por que está fora do app principal

- **Responsabilidade única**: o app principal (Controle de Tapetes) gerencia pedidos, clientes e produção.
- **Segurança**: OAuth Gmail/Drive fica isolado.
- **Independência**: execução sob demanda via CLI.
- **Acoplamento futuro**: via outbox JSONL com referências Drive.

## Stack

- Node.js 22 + TypeScript (ESM strict)
- SQLite (better-sqlite3)
- googleapis (Gmail API + Drive API — preparados, não conectados)
- Vitest para testes
- Commander para CLI

## Configuração

1. Copie `.env.example` para `.env` e preencha:
   ```
   GOOGLE_CLIENT_ID=seu-client-id
   GOOGLE_CLIENT_SECRET=seu-client-secret
   GOOGLE_REDIRECT_URI=http://localhost
   GOOGLE_DRIVE_ROOT_FOLDER_NAME=Ravatex Documents Ingestor
   GOOGLE_DRIVE_CREATE_MISSING_FOLDERS=true
   ```

2. Crie credenciais OAuth 2.0 no [Google Cloud Console](https://console.cloud.google.com/):
   - Habilite **Gmail API** e **Google Drive API**
   - Baixe o JSON e salve como `credentials.json` (protegido pelo `.gitignore`)

3. Instale dependências:
   ```bash
   npm install
   ```

## Como usar

### Scanner (preparado — não processa emails reais automaticamente)
```bash
npm run scan
```

### Listar pendentes
```bash
npm run list:pending
```

### Atribuir Pedido manualmente
```bash
npm run assign -- --id <document_id_ou_email_id> --pedido 25/2026
```

### Exportar eventos
```bash
npm run export:events
```

## Estrutura de armazenamento

### Google Drive (canônico)
```
Ravatex Documents Ingestor/                 ← GOOGLE_DRIVE_ROOT_FOLDER_NAME
├── pendentes/
│   └── YYYY-MM-DD/
│       └── email-<gmail_message_id>/
└── pedidos/
    └── PED-XX-YYYY/
        └── YYYY-MM-DD/
            ├── nf/                ← nf_pdf + nf_xml
            ├── romaneio/
            ├── desconhecido/
            └── manifest.json
```

### Disco local (não-canônico)
```
data/
  app.db              # SQLite
  outbox/             # JSONL events
  cache/              # Mirror local opcional
  google-token.json   # OAuth token (protegido)
```

## Contrato de integração (evento JSONL)

Cada `document.detected` carrega referências Drive:

```json
{
  "schema_version": 1,
  "event_type": "document.detected",
  "event_id": "uuid",
  "created_at": "ISO-8601",
  "pedido_manual": "PED-25-2026",
  "source": "gmail",
  "gmail_message_id": "...",
  "thread_id": "...",
  "document": {
    "document_id": "uuid",
    "tipo_documento": "nf_pdf",
    "filename_original": "...",
    "sha256": "...",
    "storage_backend": "google_drive",
    "storage_uri": "gdrive://file/<drive_file_id>",
    "drive_file_id": "...",
    "drive_folder_id": "...",
    "drive_web_view_link": "https://drive.google.com/file/d/<id>/view",
    "drive_web_content_link": "https://drive.google.com/uc?...",
    "local_cache_path": "./data/cache/pedidos/.../arquivo.pdf",
    "manifest_storage_uri": "gdrive://file/<manifest_id>"
  },
  "status": "pending_app_acceptance"
}
```

## Fluxo

1. **Scan**: Gmail → classifica → planeja upload Drive (não processa emails reais automaticamente)
2. **Assign**: usuário atribui Pedido manualmente → Drive connector (stub) cria pasta/documento → manifest é atualizado no Drive → evento é gerado no outbox local
3. **Integração futura**: app Controle de Tapetes consome outbox local via `storage_uri`/`drive_file_id`, mostra notificação no Pedido
4. **Aceite/Rejeição**: o app principal decide incorporar/rejeitar (fase futura)
5. **Documento só entra no Pedido após aceite futuro** — nunca antes

## Proibições nesta fase

- ❌ Sem Supabase
- ❌ Sem processamento real automático de email
- ❌ Sem OCR
- ❌ Sem identificação automática de Pedido
- ❌ Sem watcher/daemon contínuo
- ❌ Sem usar disco local como fonte canônica de documento
