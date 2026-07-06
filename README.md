# Ravatex Documents Ingestor

Módulo separado para ingestão de documentos (XML/PDF) via Gmail para o sistema Ravatex.

## Decisão arquitetural: **Drive-first**

> O Google Drive da mesma conta usada para leitura do Gmail é o **armazenamento canônico** dos documentos PDF/XML.

O disco local é usado **apenas** para:
- **SQLite** (`data/app.db`) — estado de processamento
- **Outbox JSONL** (`data/outbox/document-events.jsonl`) — eventos para o app principal
- **Cache temporário** (`data/cache/`) — espelho local *opcional* dos documentos, **nunca** fonte de verdade
- **Token Google** (`data/google-token.json`) — protegido pelo `.gitignore`

## Por que está fora do app principal

- **Responsabilidade única**: o app principal (Controle de Tapetes) gerencia pedidos, clientes e produção.
- **Segurança**: OAuth Gmail/Drive fica isolado.
- **Independência**: execução sob demanda via CLI.
- **Acoplamento futuro**: via outbox JSONL com referências Drive.

## Stack

- Node.js 22 + TypeScript (ESM strict)
- SQLite (better-sqlite3)
- googleapis (Gmail API + Drive API)
- Vitest para testes
- Commander para CLI

## Configuração

1. Copie `.env.example` para `.env` e preencha:
   ```
   GOOGLE_CLIENT_ID=seu-client-id
   GOOGLE_CLIENT_SECRET=seu-client-secret
   GOOGLE_REDIRECT_URI=http://localhost
   GOOGLE_OAUTH_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/drive.file
   GOOGLE_DRIVE_ROOT_FOLDER_NAME=Ravatex Documents Ingestor
   GOOGLE_DRIVE_CREATE_MISSING_FOLDERS=true
   INGEST_REAL_GOOGLE=false
   ```

2. Crie credenciais OAuth 2.0 no [Google Cloud Console](https://console.cloud.google.com/):
   - Habilite **Gmail API** e **Google Drive API**
   - Crie OAuth 2.0 Client ID (tipo "Desktop app" ou "Web application")
   - Salve as credenciais em `data/google-token.json` (gerado pelo primeiro login)

3. Instale dependências:
   ```bash
   npm install
   ```

## Segurança operacional

> **Nenhuma chamada real ao Google é feita sem comando explícito.**

| Comando | Comportamento |
|---------|---------------|
| `npm run scan` (sem flag) | **DRY-RUN** — não chama Gmail/Drive. |
| `npm run scan -- --confirm-real-google` | **REAL** — chama Gmail API e Drive API. |
| `npm run scan -- --dry-run` | Força DRY-RUN mesmo se flag estiver ativa. |
| `npm run assign -- --id X --pedido Y` | DRY-RUN (apenas valida). |
| `npm run assign -- --id X --pedido Y --confirm-real-google` | **REAL** — move/copia no Drive. |
| `npm run list:pending` | Apenas leitura local. |
| `npm run export:events` | Apenas leitura/escrita local. |

Quando `INGEST_REAL_GOOGLE=false` (padrão no `.env.example`), o `confirmReal: true` ainda é exigido pela CLI — ambos os gates são necessários.

## Escopos OAuth (preferenciais)

- `https://www.googleapis.com/auth/gmail.readonly` — leitura da caixa (read-only)
- `https://www.googleapis.com/auth/drive.file` — acesso apenas a arquivos criados/abertos pelo app

**Não usar** `https://www.googleapis.com/auth/drive` (escopo amplo) sem justificativa explícita. O connector OAuth recusa broad-scope via `assertSafeScopes()`.

## Como usar

### 1. Setup (uma vez)
```bash
# 1.1 — primeiro login OAuth (gera data/google-token.json)
# Em fase futura (RAVATEX-DOC-INGESTOR-REAL-ACCOUNT-SMOKE-C).

# 1.2 — instalar deps
npm install
```

### 2. Scan dry-run (seguro, padrão)
```bash
npm run scan
```
Saída esperada:
```
[scan] DRY-RUN — no real Gmail/Drive calls performed.
[scan] Pass --confirm-real-google to perform real processing.
```

### 3. Scan real
```bash
npm run scan -- --confirm-real-google
```
Saída esperada (real):
```
[scan] REAL mode:
  emailsScanned:    1
  attachmentsFound: 2
  newDocuments:     2
  duplicates:       0
```

### 4. Listar pendentes
```bash
npm run list:pending
```

### 5. Atribuir Pedido manualmente
```bash
npm run assign -- --id <document_id_ou_email_id> --pedido 25/2026 --confirm-real-google
```

### 6. Exportar eventos
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
│           └── <anexo>.pdf|xml
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
  google-token.json   # OAuth token (protegido por .gitignore)
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

1. **Scan**: Gmail → classifica → upload para Drive em `pendentes/`
2. **Assign**: usuário atribui Pedido manualmente → move/copia no Drive para `pedidos/PED-XX-YYYY/...` → manifest é criado/atualizado no Drive → evento `pending_app_acceptance` é gerado no outbox local
3. **Integração futura**: app Controle de Tapetes consome outbox local via `storage_uri`/`drive_file_id`, mostra notificação no Pedido
4. **Aceite/Rejeição**: o app principal decide incorporar/rejeitar (fase futura)
5. **Documento só entra no Pedido após aceite futuro** — nunca antes

## Comportamento de movimento no Drive

Por padrão, `assignPedido` **copia** o documento do Drive `pendentes/` para `pedidos/PED-XX-YYYY/...` (não apaga o original). Isso preserva o original como trilha de auditoria. Para mudar, ver `AssignOptions.copyInsteadOfMove`.

## Proibições nesta fase

- ❌ Sem Supabase
- ❌ Sem processamento real automático sem `--confirm-real-google`
- ❌ Sem OCR
- ❌ Sem identificação automática de Pedido
- ❌ Sem watcher/daemon contínuo
- ❌ Sem uso de escopo `drive` (amplo)
- ❌ Sem deletar/mover emails
- ❌ Sem usar disco local como fonte canônica de documento

## Validação hermética / CI

A suíte de testes é **hermética**: não usa `.env` real, não usa `data/google-token.json` real, não faz chamadas reais a Gmail/Drive. Todo o tráfego para Google é injetado via mocks/fakes (DI explícita em `createScan`/`createAssignPedido` e fake `drive_v3.Drive`).

| Comando | O que faz | Dependências externas |
|---------|-----------|----------------------|
| `npm test` | Roda todos os testes com setup hermético (`tests/setup.ts`) | Nenhuma |
| `npm run test:ci` | Mesmo que `npm test` (alias para CI) | Nenhuma |
| `npm run test:watch` | Modo watch para desenvolvimento local | Nenhuma |

### Garantias automáticas

- `tests/setup.ts` força `GOOGLE_TOKEN_PATH` para um path **inexistente** em `os.tmpdir()` antes de qualquer módulo carregar `config.ts`. Resultado: nenhum token real é lido.
- `DATABASE_PATH`, `OUTBOX_PATH`, `LOCAL_CACHE_PATH` apontam para diretórios temporários únicos por run. Nenhum `data/app.db`, `data/outbox/*.jsonl` ou `data/cache/` real é tocado.
- `INGEST_REAL_GOOGLE=false` é forçado no env de teste.
- O teste de integração (`tests/integration-mock-flow.test.ts`) exercita o fluxo completo fake Gmail → fake Drive → SQLite temporário → outbox JSONL temporário, sem nenhuma chamada de rede.

### Smoke real (opcional, manual)

O smoke real com conta Google (`REAL-ACCOUNT-SMOKE-C2`) é **manual e explícito**:
- Requer `npm run login` para gerar `data/google-token.json`.
- Requer `--confirm-real-google` na CLI.
- Toca o Drive real e o Gmail real.

Não faz parte de `npm test` / `npm run test:ci` / CI. Nunca commite `data/google-token.json`, `data/app.db`, `data/outbox/*.jsonl` ou `data/runs/*.jsonl` — todos estão no `.gitignore`.

### Workflow CI

`.github/workflows/test.yml` roda `npm install && npm run test:ci` em push/PR. Não requer secrets, não usa credenciais Google, não publica artefatos.
