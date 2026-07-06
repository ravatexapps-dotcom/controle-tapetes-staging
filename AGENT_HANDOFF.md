# AGENT HANDOFF

## Branch/HEAD/Status
- Repositório: documentos-ingestor (local, sem remote)
- Branch: master
- HEAD: `ae9c20a` + commits da fase E
- Status: limpo

## Fase concluída
RAVATEX-DOC-INGESTOR-CI-MOCK-INTEGRATION-E

## Objetivo da fase E
Validação hermética de integração mockada: testes não dependem de `.env` real, token Google real ou chamadas externas. Setup de teste força env isolado (token path inexistente, DB/outbox/cache em tmpdir). Teste de integração novo exercita o fluxo completo fake Gmail → fake Drive → SQLite temporário → outbox JSONL temporário.

## Arquivos criados/alterados nesta fase
```
tests/setup.ts                              (novo — setup hermético)
tests/integration-mock-flow.test.ts         (novo — 3 testes de integração)
vitest.config.ts                            (setupFiles adicionado)
package.json                                (script test:ci)
.github/workflows/test.yml                  (novo — CI workflow)
README.md                                   (seção "Validação hermética / CI")
PROJECT_STATE.md                            (atualizado)
AGENT_HANDOFF.md                            (atualizado)
```

## Scripts de validação
- `npm test` — hermético, 94/94
- `npm run test:ci` — mesmo que `npm test`, alias para CI

## Testes criados nesta fase
- `tests/integration-mock-flow.test.ts`:
  1. End-to-end: fake Gmail → classify → fake Drive → SQLite → fake assign → manifest → outbox pending_app_acceptance
  2. Idempotency: segundo scan do mesmo email não cria novo Drive file nem novo document
  3. exportPendingEvents: move eventos de SQLite para outbox JSONL

## Riscos remanescentes
- `config.ts` ainda lê `.env` real do `process.cwd()` no carregamento do módulo; testes dependem de `process.env` override (que funciona porque é aplicado no `tests/setup.ts` antes de qualquer import de `config.ts`).
- Smoke real (C2) continua manual; CI não valida fluxo real.
- Lockfile (`package-lock.json`) não foi gerado/committado nesta fase — CI usa `npm install` (não `npm ci`).

## Próxima fase recomendada
RAVATEX-DOC-INGESTOR-OPERATIONAL-UX-F

Foco:
- melhorar UX de `list:pending` (filtros, paginação, seleção por documento/email)
- relatório de importação (resumo por run, totais, erros)
- reprocessamento controlado (re-trigger de scan/assign)
- preparação do contrato visual que o Controle de Tapetes consumirá futuramente

## Histórico de fases
- A — Scaffold (28 testes, 6 suites)
- B — Gmail scan dry-run
- C1 — Login OAuth interativo
- C2 — Smoke real (1 email → Drive → assign → outbox)
- D — Hardening (caps, dedup, run log)
- D-R1 — Test isolation (drive.test.ts com fake Drive)
- E — CI mock integration (94 testes, 16 suites)
