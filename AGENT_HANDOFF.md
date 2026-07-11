# G26-B-D — MONOREPO DOCUMENTATION CONSOLIDATION

PROJETO: Ravatex — Controle de Tapetes (monorepo)
WORKSPACE: D:\OneDrive\Programação\Ravatex\controle-tapetes
BRANCH ATIVA: work/documents-ingestor-monorepo
HEAD CANONICO: 9e68160435f484a58869fa4623cda94a3d37aa7b
FASE ATUAL: G26-B-D — CONSOLIDATION OK

## ESTADO ATUAL DO MONOREPO

- Branch `work/documents-ingestor-monorepo` contem toda a cadeia G26 concluida
  (G26-A, G26-A-R1, G26-B-B1 a B5, G26-B-C1 a C3).
- O Documents Ingestor reside em `services/documents-ingestor` como parte
  integrante do monorepo `controle-tapetes`.
- Runtimes permanecem separados: o Ingestor mantem seu proprio Node.js 22.22.3
  e `.env` dentro de `services/documents-ingestor/`.
- Nao existem npm workspaces.
- Wrapper CLI: `scripts/ingestor.bat` (invoca o CLI do Ingestor com
  `--package-root` automatico).
- Workflow CI: `.github/workflows/documents-ingestor-test.yml`.
- Suite completa do Ingestor: 673/673.
- Controle de Tapetes (app principal): branch `work/app-next`, HEAD `e31ef3a`.
  Nao alterado nesta fase.
- Commits da cadeia culminando em `9e68160` (Move ingestor tests to monorepo
  workflow).

## ESTADO DO REPOSITORIO ANTIGO

- O repositorio original `D:\OneDrive\Programação\Ravatex\documents-ingestor`
  permanece preservado apenas para consulta e transicao.
- Nao deve receber novos commits, push ou alteracoes.
- A referencia historica esta consolidada na secao "Monorepo Incorporation" de
  `services/documents-ingestor/PROJECT_STATE.md`.

## DEBITOS PENDENTES

- 4 vulnerabilidades moderadas do npm audit no Ingestor.
- Metadata orfa `.git/worktrees/baseline-worktree`.
- Execucao real do GitHub Actions (workflow versionado mas nunca executado
  remotamente).
- Projecao futura de sha256 e attachment_id (melhorias planejadas para o
  Ingestor).
- Repositorio antigo ainda preservado (remocao futura apos periodo de
  transicao).

## PROXIMA ACAO — G26-C

Fase: **G26-C — FINAL VALIDATION, MERGE TO work/app-next AND STAGING PUSH**

Workspace: D:\OneDrive\Programação\Ravatex\controle-tapetes

Etapas:
1. Validacao final da consolidacao documental (HEAD atual `9e68160`).
2. Merge de `work/documents-ingestor-monorepo` em `work/app-next`.
3. Push para staging (`ravatexapps-dotcom/controle-tapetes-staging`).
4. Observar execucao do GitHub Actions `documents-ingestor-test.yml` apos
   publicacao.
5. Atualizar `PROJECT_STATE.md` e `AGENT_HANDOFF.md` com status pos-merge.

## GATES OBRIGATORIOS ANTES DE MERGE/PUSH

- [ ] `git diff --check` limpo (sem whitespace errors).
- [ ] Nenhuma referencia ao workspace antigo
      (`D:\OneDrive\Programação\Ravatex\documents-ingestor`) fora de secao
      historica de repositorio legado preservado.
- [ ] Nenhuma alteracao de codigo (fase estritamente documental).
- [ ] `git status --short` contem apenas os 3 arquivos documentais alterados.
- [ ] `git log --oneline -20` na branch `work/documents-ingestor-monorepo`
      confirma a cadeia G26 completa.
- [ ] Nenhum push realizado antes da autorizacao explicita.
- [ ] Producao (`bhgifjrfagkzubpyqpew`) nao contatada.

## PENDENCIA POS-MERGE/PUSH

- Observar GitHub Actions `documents-ingestor-test.yml` apos publicacao para
  confirmar que a suite 673/673 executa integralmente em CI remoto.
- A execucao do workflow em CI remoto e pre-requisito para considerar a
  incorporacao validada em staging.
