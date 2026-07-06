# PROJECT STATE

## Objetivo
Ingerir documentos (XML/PDF) recebidos por email (Gmail), classificar, permitir atribuição manual a Pedido e gerar eventos para integração futura com o app principal (Controle de Tapetes).

## Workspace
D:\OneDrive\Programação\Ravatex\documents-ingestor

## Stack
- Node.js 22.22.3 / npm 10.9.8
- TypeScript 5.7 (ESM strict)
- better-sqlite3 (SQLite local)
- googleapis (Gmail API + Drive API — preparado, validado em smoke real C2)
- Vitest 3.0
- Commander 13.1

## Contratos locais
- `contracts/document-event.schema.json` — schema do evento de documento detectado
- `contracts/manifest.schema.json` — schema do manifest de Pedido

## Status atual
- HEAD: `ae9c20a` + commits da fase E
- 94 testes passando (16 suites) — incluindo integração mockada completa
- Hermético: nenhum teste depende de `.env` real, token real ou chamadas Google
- OAuth real validado (C1)
- Smoke real com Drive/Gmail reais validado (C2)
- Hardening de scan (caps, wide-scan guard, cross-msg dedup, run log) aplicado (D)
- Drive tests isolados de credenciais reais (D-R1)
- CI workflow criado (E)

## Comandos disponíveis
- `npm run dev` — tsx watch
- `npm run scan` — scan (dry-run por padrão; use `--confirm-real-google` para real)
- `npm run list:pending` — lista documentos pendentes
- `npm run assign -- --id <id> --pedido <num> --confirm-real-google` — atribui Pedido
- `npm run export:events` — exporta eventos para JSONL
- `npm run login` — OAuth interativo (gera `data/google-token.json`)
- `npm test` — roda testes herméticos
- `npm run test:ci` — alias para CI
- `npm run test:watch` — modo watch

## Proibições permanentes
- Sem Supabase nesta fase
- Sem processamento automático de email
- Sem OCR
- Sem identificação automática de Pedido
- Sem watcher contínuo
- Sem uso de escopo `drive` (amplo)

## Última evidência de testes
```
Test Files  16 passed (16)
     Tests  94 passed (94)
```

## Decisão arquitetural
Não integrar Supabase nesta fase. O outbox JSONL é o contrato de integração. O app principal consumirá os eventos quando estiver pronto.

## Fases concluídas
- A — Scaffold
- B — Gmail scan (dry-run)
- C1 — Login OAuth interativo
- C2 — Smoke real (1 email → Drive → assign → outbox)
- D — Hardening (caps, dedup, run log)
- D-R1 — Test isolation (drive.test.ts com fake Drive)
- E — CI mock integration (hermetic setup + integration test + workflow)

## Próxima fase recomendada
RAVATEX-DOC-INGESTOR-OPERATIONAL-UX-F
Foco: melhorar UX de list:pending, seleção por documento/email, relatório de importação, reprocessamento controlado e preparação do contrato visual que o Controle de Tapetes consumirá futuramente.
