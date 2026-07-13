# CONTEXTO TÉCNICO DO COMPONENTE

Este arquivo não é fonte do estado operacional atual da frente.
Fase atual, próxima ação, workspace ativo e status canônico pertencem ao
`PROJECT_STATE.md` da raiz.

## Responsabilidade do serviço

Ingestão de documentos (XML/PDF) recebidos por Gmail, com classificação,
atribuição manual a Pedido e geração de eventos para integração com o
Controle de Tapetes.

## Runtime e ferramentas

O serviço utiliza Node.js, TypeScript, SQLite, Google APIs e Vitest.

As versões efetivas e os scripts disponíveis devem ser consultados diretamente em:

- `package.json`
- `package-lock.json`
- `tsconfig.json`

Não copiar números de versão para o state.

## Bancos e artefatos usados

- SQLite local: `data/app.db` (com backups `data/*.backup-*`, ignorados
  por `.gitignore`).
- Outbox: `data/outbox/`
- Exports: `data/exports/`
- Run logs: `data/runs/`
- `.env` permanece dentro do serviço.

## Contratos relevantes

- `services/documents-ingestor/contracts/document-event.schema.json`
- `services/documents-ingestor/contracts/manifest.schema.json`
- `services/documents-ingestor/docs/CONTROL_TAPETES_DOCUMENTS_CONTRACT.md`
- `services/documents-ingestor/docs/SUPABASE_WRITER_RUNBOOK.md`

## Migration relacionada

- `../../db/49_document_technical_evidences.sql`

O estado de versionamento, aplicação e verificação por ambiente pertence
ao `PROJECT_STATE.md` da raiz e ao ledger da frente.

## Testes e comandos estáveis

A lista efetiva de scripts pertence a `package.json` (e lockfile);
as entradas abaixo são apenas orientação resumida dos comandos
mais usados pela frente.

- `npm test` — suíte hermética do Ingestor.
- `npm run test:ci` — alias para CI.
- `npm run sync:mapped` — `scan → export mapped → report` (dry-run padrão).
- `npm run export:ingestion-events` — exporta `ingestion-events.jsonl`.
- `npm run watch:scan-requests` — watcher da fila de solicitações
  (`--once` para operação manual controlada).
- `npm run write:latest` — gera `latest.json` (manifest do último export).

## Links canônicos

- Estado canônico: `../../PROJECT_STATE.md`
- Handoff ativo: `../../AGENT_HANDOFF.md`
- Modelo documental: `../../docs/governance/DOCUMENTATION_MODEL.md`
- Plano G28: `../../docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Plano Pedido/OP/Movimentação/Documentos:
  `../../docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Consumer design (Controle ↔ Ingestor):
  `../../docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md`
- Preservação histórica: `../../docs/legacy/pre-model/MANIFEST.md`

# REGISTROS HISTÓRICOS DO COMPONENTE — ARQUIVADOS

O conteúdo histórico completo deste arquivo foi preservado, byte a byte,
em:

`../../docs/legacy/pre-model/DOCUMENTS_INGESTOR_PROJECT_STATE_FULL_SNAPSHOT.md`

Manifesto de integridade:

`../../docs/legacy/pre-model/MANIFEST.md`

Commit de origem do snapshot:

`08b9af5e251de48e938600e5e4b4214e4d1e824e`

SHA-256 do snapshot completo:

`331d0ca977bf8cc96c021dace5db9afbb77c06a8f3ecc1879df460f25f4054eb`

O snapshot é histórico e não é fonte do estado operacional da frente.
Não deve ser editado nem receber novos closeouts.

A evolução estruturada do componente será registrada em ledger próprio
em fase posterior.

Esta seção não deve acumular novo conteúdo histórico.
