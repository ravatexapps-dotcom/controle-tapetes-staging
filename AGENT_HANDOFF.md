# HANDOFF OPERACIONAL ATIVO

- **Nenhuma fase funcional ativa.** G28-C está `CLOSED / ACCEPTED_WITH_NONBLOCKING_AUTHENTICATED_BROWSER_SMOKE_DEBT`. G28-D discovery está `RELEASE CONTRACT DISCOVERY COMPLETE / BLOCKED BY SPECIFIC MISSING DEPLOYMENT DEFINITION`; sua publicação está `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED` e não constitui fase ativa. A definição canônica atual do mapeamento de publicação e o procedimento autorizado para migrations 51/52 não existem no repositório; ver `docs/releases/G28_D_RELEASE_CANDIDATE.md`.
- **Última fase aceita:** `G28-C — CLOSED / ACCEPTED_WITH_NONBLOCKING_AUTHENTICATED_BROWSER_SMOKE_DEBT` (decisão arquitetural explícita em 2026-07-15; matriz staging/projeções 16/16 PASS; closeout `a7d7caa`, aceite `d5ec09f`). G28-B8 está `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C`: suas capacidades de correção, revogação, restauração e auditoria foram explicitamente validadas e aceitas no gate de G28-C.
- **Commits R1 concluídos:** `271761c3de20427b2cc9059d5ff7cc3727545e6d` — `G28: reconcile canonical phase state` (closeout documental inicial R1); `edaf0b4d36f24aa7b9490e51a42624cc70d45963` — `G28: correct canonical reconciliation state` (correção de defeitos textuais do R1). O HEAD atual deve ser consultado diretamente com `git rev-parse HEAD`.
- **Próxima ação:** após o fechamento desta reconciliação documental, uma nova reconciliação read-only do backlog geral (`PEDIDO_PRODUCTION_FLOW_BACKLOG.md` e demais frentes) escolherá a próxima frente funcional. Publicação não é a próxima ação e nenhuma implementação automática se segue. Nenhuma fase funcional posterior está autorizada. `OPEN_ARCHITECT_DECISIONS: DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`.
- **Workspace / branch / HEAD anterior:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28` / `work/g28-document-qualification`. HEAD técnico/documental anterior: `b27e79fdba1ed8fb8a6232d8e0b8ca4b37ac3a2c` (linha de base histórica de descoberta G28-D; este registro documental a sucede).
- **Leitura obrigatória antes de rotear qualquer ordem:** `PROJECT_STATE.md`, este handoff, plano mestre G28 (`docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, ledger G28 (`docs/ledgers/G28_LEDGER.md`) e contratos/runtime aplicáveis.
- **Continuidade documental — caminhos obrigatórios:**
  1. `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  2. `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  3. `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  4. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  5. `PROJECT_STATE.md`
  6. `AGENT_HANDOFF.md`
  7. `docs/ledgers/G28_LEDGER.md`
  8. `docs/DOCUMENTATION_INDEX.md`
  9. `docs/governance/DOCUMENTATION_MODEL.md`
  Todo handoff futuro deve retransmitir estes caminhos e instruir expressamente o chat seguinte a retransmiti-los novamente em qualquer handoff posterior. A cadeia de continuidade do plano e do backlog não pode ser interrompida.
- **Runtime boundaries:** contrato Documento→Pedido 0..1 e Documento→OP 0..N; tabelas de revisão dedicadas; Ingestor retém campos candidate/event; B5 preservado; sem `statusOverrides`, dupla escrita, backfill ou produção.
- **Dívida não bloqueante:** `AUTHENTICATED_BROWSER_SMOKE_BLOCKED_BY_TOOLING` (browser não possui aplicação/sessão admin de staging).

## Controlled Delete × Histórico Documental (Pedido/OP) — CLOSED / ACCEPTED

- **Commit técnico:** `707a37bd1d2c4728ab2a17433b6441049bd88062` — `Guard controlled delete against document link history` (`js/delete-helpers.js`, `tests/controlled-delete.smoke.js`, `db/53`–`db/56`).
- **Commit documental:** este closeout (`Close controlled delete document history guard`). O HEAD atual deve ser consultado diretamente com `git rev-parse HEAD`.
- **Problema original:** exclusão física controlada de Pedido/OP (`db/34`–`db/37`) violava a FK `document_link_revision_ops_op_id_fkey` ao tentar remover OP ainda referenciada por histórico documental canônico append-only.
- **Causa raiz e correções:** `db/53` adiciona guard documental via wrappers `SECURITY DEFINER` que bloqueiam exclusão física quando há histórico canônico (`document_link_revisions`/`document_link_revision_ops`), renomeando a lógica destrutiva legada para `*_pre53` (inacessível externamente); `db/54` corrige achado de segurança emergencial (`anon_execute = true` nas RPCs públicas), restringindo `EXECUTE` a `authenticated`; `db/55` corrige `to_jsonb(<literal>)` sem cast explícito (`could not determine polymorphic type`) via patch forward-only; `db/56` corrige regressão de `jsonb_set` `STRICT` que colapsava o diagnóstico para `NULL` em alvos elegíveis, usando `COALESCE(to_jsonb(v_reason), 'null'::jsonb)`.
- **Testes locais:** `node --check js/delete-helpers.js` PASS; `tests/controlled-delete.smoke.js` **53/53**; `tests/document-canonical-links-contract.test.js` **21/21**; `git diff --check` PASS.
- **Smokes de staging (`ucrjtfswnfdlxwtmxnoo`, fixtures sintéticas, cleanup zero):** Caso A1 (OP elegível com dependência, sem histórico) — diagnóstico não nulo, remoção concluída; Caso A2 (Pedido elegível com dependência, sem histórico) — diagnóstico não nulo, remoção concluída; Caso B (com histórico documental) — diagnóstico bloqueado, `remover_op`/`remover_pedido` bloqueados de forma controlada, todo o histórico documental preservado sem alteração. `op_numeros` preservado em todos os casos.
- **ACL final (verificada em catálogo ao vivo):** as 4 RPCs públicas — `authenticated`-only (`PUBLIC`/`anon` sem `EXECUTE`); as 4 funções `*_pre53` — `postgres`-only (`PUBLIC`/`anon`/`authenticated` sem `EXECUTE`).
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Próxima ação autorizável (conforme `PROJECT_STATE.md`):** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION`.
- **Detalhe completo:** `PROJECT_STATE.md` (seção "Controlled Delete × Histórico Documental") e `docs/ledgers/G28_LEDGER.md` (entrada append-only).

# HISTÓRICO DE HANDOFFS — ARQUIVADO

O conteúdo histórico completo dos handoffs anteriores foi preservado,
byte a byte, em:

`docs/legacy/pre-model/AGENT_HANDOFF_FULL_SNAPSHOT.md`

Manifesto de integridade:

`docs/legacy/pre-model/MANIFEST.md`

Commit de origem do snapshot:

`08b9af5e251de48e938600e5e4b4214e4d1e824e`

SHA-256 do snapshot completo:

`386810890675714527fc349fa29ddab3fe977dd80c0b270899a7b1a2b3a24b4d`

O snapshot é exclusivamente histórico. Não representa o handoff ativo,
não deve ser editado e não deve receber novos closeouts.

Esta seção não deve acumular novo conteúdo histórico.
