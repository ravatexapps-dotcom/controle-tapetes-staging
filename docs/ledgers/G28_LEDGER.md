# G28 — LEDGER DE FASES ACEITAS

## Papel

Este arquivo é o ledger append-only da frente G28 — Document Qualification /
Documents Ingestor.

Registra fases encerradas e aceitas, commits, arquivos principais, validações,
riscos residuais e a próxima fase indicada no momento do fechamento.

Não é fonte do estado operacional atual.
O estado atual pertence ao `PROJECT_STATE.md` da raiz.

Não substitui o Git.
Commits, diffs e manifestos exatos devem ser consultados diretamente no Git.

## Cobertura

A cobertura estruturada deste ledger começa no baseline técnico imediatamente
anterior à adoção do modelo documental e segue prospectivamente.

O histórico pré-modelo completo permanece preservado, sem reconstrução
especulativa, em:

`docs/legacy/pre-model/MANIFEST.md`

Os diagnósticos rejeitados `G28-DOCS-B3-A` e `G28-DOCS-B3-A-R1` não são
fontes deste ledger e não geram entradas de fase aceita.

## Regra append-only

Entradas aceitas não são reescritas.
Correções posteriores recebem nova entrada vinculada à fase anterior.
Cada fase aceita gera no máximo uma entrada neste ledger.

## Modelo de entrada

Cada fase registra: gate, commit aceito, arquivos principais, validação,
risco residual e próxima fase indicada no fechamento.

---

## 2026-07-12 — G28-B3-B5-B — Prepare technical evidence sync input

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `013a0e18157bf31215eed651eae3e8e1617f5815` — `Prepare technical evidence sync input`
- **Arquivos principais:**
  - `services/documents-ingestor/src/core/syncSupabase.ts`
  - `services/documents-ingestor/tests/sync-supabase.test.ts`
- **Validação:** 108 testes aprovados em duas execuções focadas; dry-run sem
  efeitos remotos; confirmed write com technical evidence ainda falha
  localmente antes de qualquer efeito remoto porque a integração final
  pertence a `G28-B3-B5-C`.
- **Risco residual:** integração de escrita confirmada ainda pendente;
  migration 49 versionada e não aplicada.
- **Próxima fase indicada no fechamento:** `G28-B3-B5-C`, posteriormente
  suspensa durante o refactor documental.

> Entrada técnica pré-modelo importada como baseline. Única entrada técnica
> pré-modelo autorizada. As fases anteriores (`G28-P0`, `G28-B1`, `G28-B2`,
> `G28-B3-B1` até `B3-B5-A`) não foram reconstruídas a partir dos snapshots.

---

## 2026-07-12 — G28-DOCS-B1 — Define documentation source-of-truth model

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `81cff64df7d2acf989c77a4a15f5c27e8cbc8d84` — `Define documentation source-of-truth model`
- **Arquivos principais:**
  - `docs/governance/DOCUMENTATION_MODEL.md`
  - `docs/DOCUMENTATION_INDEX.md`
- **Validação:** fase documental; `git diff --check` limpo; Git final limpo.
- **Risco residual:** arquivos operacionais ainda continham histórico
  pré-modelo.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B2`.

---

## 2026-07-12 — G28-DOCS-B2 — Cut over active documentation state ownership

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `0b4df167d1206624a41a6febddbf46df966cdda1` — `Cut over active documentation state ownership`
- **Arquivos principais:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `services/documents-ingestor/PROJECT_STATE.md`
- **Validação:** fase documental; `git diff --check` limpo; Git final limpo.
- **Risco residual:** o contexto técnico do componente ainda duplicava versões
  de ferramentas e estado de apply da migration, o que originou a correção
  `G28-DOCS-B2-R1`.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B2-R1`.

---

## 2026-07-12 — G28-DOCS-B2-R1 — Keep component state non-operational

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `8c21c20d9d01d261380f4eead766d90d67d8e905` — `Keep component state non-operational`
- **Arquivos principais:**
  - `services/documents-ingestor/PROJECT_STATE.md`
- **Validação:** fase documental; `git diff --check` limpo; Git final limpo.
- **Risco residual:** versões de ferramentas e estado de apply da migration
  deixaram de ser duplicados no state local do Ingestor; o apontamento
  definitivo desses fatos pertence ao `PROJECT_STATE.md` da raiz e ao ledger
  da frente.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B2-CLOSEOUT`.

---

## 2026-07-12 — G28-DOCS-B2-CLOSEOUT — Record G28 documentation cutover acceptance

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `08b9af5e251de48e938600e5e4b4214e4d1e824e` — `Record G28 documentation cutover acceptance`
- **Arquivos principais:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
- **Validação:** fase documental; `git diff --check` limpo; Git final limpo.
- **Risco residual:** os blocos ativos passaram a apontar para o diagnóstico
  histórico, sem alteração dos históricos congelados; a compactação dos
  históricos ainda estava pendente.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B3-B0`.

---

## 2026-07-12 — G28-DOCS-B3-B0 — Preserve pre-model documentation snapshots

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `5960e3b75ce62521d89d32586d4660198f8f52c0` — `Preserve pre-model documentation snapshots`
- **Arquivos principais:**
  - `docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md`
  - `docs/legacy/pre-model/AGENT_HANDOFF_FULL_SNAPSHOT.md`
  - `docs/legacy/pre-model/DOCUMENTS_INGESTOR_PROJECT_STATE_FULL_SNAPSHOT.md`
  - `docs/legacy/pre-model/MANIFEST.md`
- **Validação:** tamanho em bytes idêntico entre cada origem e seu snapshot;
  SHA-256 idêntico; `fc /b` sem diferenças; blobs Git correspondentes aos
  conteúdos preservados.
- **Risco residual:** histórico ainda duplicado nos arquivos operacionais
  antes do cutover `G28-DOCS-B3-C`.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B3-C`.

---

## 2026-07-12 — G28-DOCS-B3-C — Replace active histories with immutable snapshot references

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `391f3ee3cd41c8729304e4751b9508a1e0259b0e` — `Replace active histories with immutable snapshot references`
- **Arquivos principais:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `services/documents-ingestor/PROJECT_STATE.md`
- **Validação:** snapshots com hashes inalterados após o corte; históricos
  congelados substituídos por referências auditáveis aos snapshots
  imutáveis; `git diff --check` limpo.
- **Risco residual:** ledger da frente G28 ainda não criado.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B3-C-CLOSEOUT`.

---

## 2026-07-12 — G28-DOCS-B3-C-CLOSEOUT — Record immutable history cutover acceptance

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `88f62ca5e92005a1677aa99ce761645cbafdc3b4` — `Record immutable history cutover acceptance`
- **Arquivos principais:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
- **Validação:** diff restrito aos blocos ativos; snapshots intactos;
  Git final limpo.
- **Risco residual:** criação do ledger G28 pendente.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B3-D1`.

---

## 2026-07-12 — G28-DOCS-B3-D1 — Bootstrap prospective G28 phase ledger

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `dcd9823a73d6846e40ff0112543b3c9fe194309b` — `Bootstrap prospective G28 phase ledger`
- **Arquivos principais:** `docs/ledgers/G28_LEDGER.md`; `docs/DOCUMENTATION_INDEX.md`
- **Validação:** oito commits de origem verificados como existentes e ancestrais
  da cadeia; ledger criado com exatamente oito entradas iniciais; somente
  `G28-B3-B5-B` importado como baseline técnico pré-modelo; diagnósticos
  rejeitados excluídos como fontes; `git diff --check` limpo; Git final limpo.
- **Risco residual:** listas documentais legadas ainda concorrem parcialmente
  com o modelo de autoridade; nenhum ledger de outra frente foi criado.
- **Próxima fase indicada no fechamento:** `G28-DOCS-B3-E1 — DOCUMENTATION AUTHORITY LIST RECONCILIATION`.

---

## 2026-07-13 — G28-DOCS-B3-E1 — Documentation authority list reconciliation

- **Gate:** CLOSED / ACCEPTED
- **Commit aceito:** `793185701a4c09917354330f2596e2991e8b1dfc` — `Reconcile documentation authority references`
- **Arquivos principais:**
  - `Guide-and-governance-rules.stxt`
  - `docs/DOCUMENTATION_INDEX.md`
  - `docs/architecture/CLAUDE_PROJECT_ASSET_MAP.md`
- **Validação:** lista única de autoridade consolidada em
  `docs/DOCUMENTATION_INDEX.md`; asset map e guia redirecionados ao modelo
  canônico; `git diff --check` limpo.
- **Risco residual:** inventário de migrations permanece volumoso e deve ser
  consultado diretamente no repositório, não reconstruído neste ledger.
- **Próxima fase indicada no fechamento:** retomada técnica
  `G28-B3-B5-C`.

---

## 2026-07-13 — G28-B3-B5-C — Complete technical evidence sync integration

- **Gate:** LOCAL IMPLEMENTATION ACCEPTED / STAGING BLOCKED
- **Commit técnico:** `3465405db42bfedd0c1f2c479f9be61c46078d87` —
  `Integrate technical evidence into Supabase sync`
- **Arquivos principais:**
  - `services/documents-ingestor/src/core/syncSupabase.ts`
  - `services/documents-ingestor/src/supabase/serviceRoleClient.ts`
  - `services/documents-ingestor/src/cli.ts`
  - `services/documents-ingestor/tests/sync-supabase.test.ts`
  - `services/documents-ingestor/tests/sync-supabase-cli.test.ts`
- **Validação local:** revisão independente aprovada após correção; testes
  focados repetidos após a revisão: 223 testes em cinco arquivos e quatro
  testes de CLI em arquivo adicional, todos aprovados; `git diff --check`
  limpo. Um único client service-role é reutilizado; a ordem é candidate →
  evidence → events; não há retry automático.
- **Staging:** bloqueado antes de SQL/RPC. A identidade do endpoint MCP aponta
  para `ucrjtfswnfdlxwtmxnoo`, mas a configuração local do writer não contém
  `SUPABASE_PROJECT_REF`, URL, service-role key nem writer habilitado; portanto
  a guarda obrigatória da CLI não pode ser comprovada e migration 49, smoke e
  cleanup não foram executados.
- **Risco residual:** a persistência confirmada é multichamada, sem atomicidade
  global; além disso, falta resolver a configuração local exclusiva de staging
  antes do apply e do smoke controlado.
- **Próxima ação indicada:** resolver o gate de staging e retomar somente
  migration 49 + smoke controlado, preservando produção intocada.

---

## 2026-07-13 — G28-B3-B5-C — CLOSED / ACCEPTED

- **Gate:** CLOSED / ACCEPTED
- **Commit técnico:** `3465405db42bfedd0c1f2c479f9be61c46078d87` —
  `Integrate technical evidence into Supabase sync`
- **Arquivos principais:**
  - `services/documents-ingestor/src/core/syncSupabase.ts`
  - `services/documents-ingestor/src/supabase/serviceRoleClient.ts`
  - `services/documents-ingestor/src/cli.ts`
  - `services/documents-ingestor/tests/sync-supabase.test.ts`
  - `services/documents-ingestor/tests/sync-supabase-cli.test.ts`
  - `db/49_document_technical_evidences.sql`
- **Validação de staging:** configuração CLI comprovada via caminho de código
  real; ref `ucrjtfswnfdlxwtmxnoo` confirmada na URL e no project ref; writer
  habilitado; production target false. Migration 49 aplicada e verificada
  em staging (tabela, PK, FK cascade, checks, RLS, admin policy, RPC
  SECURITY DEFINER, contrato escritor inserted/unchanged/conflict).
- **Smoke controlado:** dry-run sem efeitos remotos; primeiro confirmed write
  inseriu candidate e evidence; replay idempotente retornou unchanged sem
  duplicata; conflito com conteúdo divergente detectado, scan finalizada como
  failed, sem retry; cleanup confirmou zero linhas sintéticas em candidates,
  evidences, events, scan runs e decisions.
- **Testes locais:** 223 aprovados em cinco arquivos focados; 4 aprovados no
  arquivo CLI; `git diff --check` limpo.
- **Produção:** não acessada.
- **Risco residual:** persistência confirmada é multichamada e não oferece
  atomicidade global; a convergência depende da idempotência dos contratos
  remotos.
- **Próxima fase indicada:** `G28-B3-B6 — TECHNICAL EVIDENCE READER`.

---

## 2026-07-13 — G28-B3-B6-B — Current technical evidence admin reader

- **Gate:** CLOSED / ACCEPTED
- **Commit técnico:** `6ade74fd6b8584320dbf12df1dbf334aeabbc8b6` — `Read current technical evidence in document reader`
- **Arquivos principais:**
  - `js/documents-supabase-reader.js`
  - `tests/documents-supabase-reader.test.js`
- **Contrato público preservado:** `window.RAVATEX_DOCUMENTS.loadReceivedDocumentsFromSupabase()`
- **Campo interno de attachment:** `_ravatex_technical_evidence`
- **Fonte remota:** `public.document_technical_evidences`
- **Acesso:** admin autenticado direto, sob RLS existente
- **Versão carregada:** versão corrente (highest valid positive numeric `evidence_version`)
- **Estados:** `available`, `missing`, `invalid`
- **Falha remota:** distinta de `missing`; não há fallback silencioso
- **Versão inválida:** a versão corrente é rejeitada como `invalid`; não há fallback para evidência mais antiga
- **Evidência histórica:** diferida; não carregada
- **UI:** inalterada; sem renderização
- **Database:** inalterada; Documents Ingestor inalterado
- **Writes/RPC:** nenhum; sem segundo client Supabase; sem fonte paralela
- **Validação:** `node --check` passou; 39 reader tests aprovados; 91 screen smoke tests aprovados; diff checks passaram
- **Revisão independente:** APPROVE
- **Produção:** não acessada
- **Push:** não executado
- **Risco residual:** reader 268 linhas; reader test 618 linhas; qualquer expansão funcional substancial exige nova revisão de coesão antes de adicionar lógica substancial a qualquer um dos dois arquivos; isto não é um defeito ou bloqueador.
- **Próxima fase indicada no fechamento:** `NEXT SUBSTANTIVE PHASE: REQUIRES ARCHITECT DECISION`. O plano mestre autoritativo (`DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`) está inconsistente com a baseline aceita B3-B5-C e B6-B (ainda nomeia B3-B5-B como `NOT STARTED` e posiciona diferentemente os estágios genéricos posteriores), enquanto os demais planos/backlogs obrigatórios cobrem preocupações separadas de Pedido/OP e produção. Portanto os planos/backlogs autoritativos não sequenciam univocamente um sucessor após a baseline B6-B aceita; um arquiteto deve reconciliar o plano/backlog G28 antes de uma nova fase de implementação.

---

## 2026-07-13 — G28-B4 — DOCUMENT QUEUE

- **Gate:** CLOSED / ACCEPTED
- **Subfases aceitas:** G28-B4-A, G28-B4-B1, G28-B4-B2, G28-B4-B1-R1, G28-B4-B3, G28-B4-B4
- **Commits aceitos:**
  - `50f543ff8c6917599cf35768e9e84531532bf177` — Add pure document queue read model
  - `d0f0424924b57b3754fe87a0be0336292f5c2b74` — Bind received documents queue filters
  - `948213885506fdb6e41cfe10451af21e006ce441` — Distinguish missing Pedido link availability
  - `2958e6451b49986ac1af414e62cd31df698dcaa5` — Show document queue state indicators
  - `f007ab3c733d584e9da57c8436294d9b42ea9652` — Consolidate document queue file access
- **Escopo funcional:** pure queue read model com eixos source/evidence/review/Pedido; estados Pedido `confirmed_pedido_reference`, `suggested_pedido`, `no_confirmed_link`, `unavailable`; OP e duplicate indisponíveis; alertas determinísticos display-only; sem Supabase/DOM/network/write no read model; binding/filtros/indicadores aceitos; gate exclusivo por `queueItem.source_file.state`; ações Drive preservadas apenas após `drive_available`; spans unsupported/missing explicativos e não interativos; validation informacional; sem action/modal/write/RPC/backend/Gmail/filesystem
- **Validação focada:** model 48, queue UI 58, decisions 20, reader 39, screen smoke 133, import received 36, import UI 40, router 43; 3 node checks; diff check limpo (apenas avisos pré-existentes LF→CRLF)
- **Validação visual:** fixture local in-memory; ambas as posições do wrapper horizontal intencional inspecionadas; Drive um Ver e um Baixar apenas; spans unsupported/missing sem clique; wrapping sem clipping; servidor local parado
- **Push:** não executado
- **Baseline pré-closeout:** `f007ab3c733d584e9da57c8436294d9b42ea9652`; worktree/staging limpos; zero untracked
- **Débitos não bloqueantes:** `documentos-recebidos.js` excepcionalmente grande; document-row rendering ~151 linhas, candidato a code-health futuro; sem refatoração autorizada; semântica atual exige mudanças de nomenclatura testadas deliberadamente; B4 não implementa modal de validação humana, novas writes de decisão, linking canônico Pedido/OP, detecção de duplicatas, histórico de evidência, correção/revogação, backends Gmail/novos arquivos
- **Próxima fase indicada no fechamento:** `G28-B5 — HUMAN VALIDATION CONTRACT AND MODAL`
- **Próxima ação autorizada:** `G28-B5-A — Human validation, persistence, and linking boundary diagnosis`

---

## 2026-07-14 — G28-B5 — Human decision command contract and staging verification

- **Gate:** `G28-B5-B1 — CLOSED / ACCEPTED`; `G28-B5-B2 — CLOSED / ACCEPTED`; `G28-B5 — CLOSED / ACCEPTED`
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **HEAD técnico:** `b247e43504c0afcc0d25e95f8012f93a09eb0692` — `Add idempotent document decision command contract`
- **Target de staging:** `ucrjtfswnfdlxwtmxnoo`
- **Migration:** registrada como `20260714012641 document_decision_command`
- **Validação estrutural:** coluna UUID nullable `document_decisions.command_id`, índice único parcial válido `document_decisions_command_id_uidx`, RPC `registrar_decisao_documento(...)`, propriedades de segurança e grants aprovados; RPCs legadas preservadas
- **Validação comportamental:** autorização admin, rejeição de anon/não-admin, normalização, seis outcomes, replay idempotente, conflitos sem mutação, precondição de decisão ativa e rollback transacional aprovados
- **Concorrência real:** sessões com backends e janelas sobrepostas; A produziu `created` + `replayed` para o mesmo comando; B produziu `created` + `active_decision_exists` para comandos distintos no mesmo candidato; C produziu `created` + `command_conflict` para o mesmo comando com payload divergente
- **Limpeza:** fixtures removidas; 39 candidates, 0 decisions e zero resíduos em usuários, candidates, decisions, events, scan requests, scan runs e technical evidences
- **Produção:** projeto `bhgifjrfagkzubpyqpew` não acessado
- **Documentação de closeout:** `PROJECT_STATE.md`, `AGENT_HANDOFF.md` e este ledger; commit documental `Record G28 B5 staging decision command verification`
- **Push:** não executado
- **Risco residual:** nenhum consumidor runtime foi redirecionado; a RPC canônica ainda não está integrada à UI; `decidir_documento` permanece ativa e não idempotente; modal, B6-A, B6-B e B8 continuam separados
- **Próxima decisão indicada:** decisão arquitetural explícita antes de qualquer implementação de integração runtime, UI/modal, linking ou correção/revogação

---

## 2026-07-14 — G28-B5-D4-R1 — Load canonical document decision runtime modules

- **Gate:** CLOSED / ACCEPTED
- **Antecedente:** G28-B5-D4-V1 — `PATCH COMMITTED / NOT ACCEPTED`. Auditoria read-only confirmou que index.html não carregava `documents-decision-command.js`, `documentos-recebidos-decision-modal.js` nem `documents-decision-controller.js`, tornando o runtime D4 inoperante.
- **Commit técnico aceito:** `425172a95cbf2b340aa5f72110d317917a79e1f6` — `Load canonical document decision runtime modules`
- **Arquivos alterados:** `index.html` e `tests/documentos-recebidos.smoke.js`.
- **Mudança efetiva:** index.html passou a carregar os três módulos runtime estaticamente; ordem efetiva: `documents-supabase-decisions → documents-supabase-reader → documents-decision-command → documentos-recebidos-decision-modal → documents-decision-controller → documentos-recebidos`. Sem import dinâmico; smoke test inspeciona index.html real para exactly-once e ordem.
- **Validação local:** `node --check` em 4 arquivos; 11 integration, 135 screen smoke, 58 queue UI, 68 controller, 41 modal, 96 lifecycle, 59 adapter, 46 reader, 23 migration contract, 48 queue read model — 585 pass/0 fail.
- **Git diff check:** aprovado com aviso LF→CRLF informacional não bloqueante.
- **Revisão independente:** OpenCode `opencode-go/deepseek-v4-flash`, read-only, retornou `APPROVE` sem mutação.
- **Staging:** não acessado.
- **Produção:** projeto `bhgifjrfagkzubpyqpew` não acessado.
- **Push:** não executado.
- **D4 aceito:** D4-V1 rejeitado; D4-R1 aceita como a integração runtime canônica corrigida. D4 e R1 agora CLOSED / ACCEPTED.
- **Risco residual:** aviso LF→CRLF não bloqueante; nenhuma pendência técnica identificada.
- **D5:** não iniciado e não autorizado. D5 e quaisquer mudanças remotas, de banco, linking, undo/revogação ou ampliação de UI requerem nova decisão arquitetural explícita.
- **Próxima decisão indicada:** D5 — indeferido e não autorizado.

---

## 2026-07-14 — G28-B5-D5-A / G28-B5-D5-B1 — Explicit document source boundary

- **G28-B5-D5-A:** diagnóstico read-only; defeito confirmado: source ausente era tratado implicitamente como legacy. Decisão: ausência de `_ravatex_source` não significa legacy.
- **G28-B5-D5-B1:** implementação do boundary explícito; commit técnico `2bac73d0f386ca61a53548d304b98e076fbb06ef` — `G28-B5-D5-B1: enforce explicit document source boundary`.
- **Manifesto técnico:**
  - `js/screens/documentos-recebidos.js`
  - `tests/documentos-recebidos-source-boundary.test.js`
  - `tests/documentos-recebidos-decision-integration.test.js`
  - `tests/documentos-recebidos.smoke.js`
- **Classificação:** `supabase | legacy | unknown`.
- **Boundary:** `unknown` fail-closed; Supabase preservado; `legacy`/`manual` explícito preservado; fallback G22 sem source tratado como `unknown`.
- **Validação:** gates verdes; revisão independente `APPROVE`; telemetria partial e não bloqueante.
- **Acessos remotos:** sem staging; sem produção; sem push.
- **Próxima fase:** D5-B2, D5-B3 e D5-B4 não iniciadas.

---

## 2026-07-14 — G28-B5-D5-B2 — Harden local decision helpers and explicit legacy call sites

- **Gate:** `CLOSED / ACCEPTED_WITH_PREEXISTING_TEST_DEBT`; auditoria V1 `VERIFIED`.
- **Baseline técnico:** `ff15d0c`.
- **Commit técnico final:** `c51542244ab6e3c683a1a0a54fcc634df6f7478d` — `G28-B5-D5-B2: require explicit legacy source for local decisions`.
- **Amend excepcional:** somente correção de mensagem do commit `b483620c5248665614e576b2f7c742c9fcd08dea`; tree preservada `66cad0f089e56b94c4c0471d442e33fa162d3443`.
- **Manifesto literal:**
  - `js/documents-ingestor-import-received.js`
  - `js/documents-ingestor-loader.js`
  - `js/documents-ingestor.js`
  - `js/screens/documentos-recebidos.js`
  - `tests/documentos-recebidos-source-boundary.test.js`
  - `tests/documents-ingestor-loader.test.js`
  - `tests/documents-ingestor-local-decision-boundary.test.js`
  - `tests/g14-c-bridge-smoke.test.js`
- **Mudança funcional:** helpers locais endurecidos; somente provenance explícita `manual`/`legacy` permite decisão local. Provenance explícita foi materializada no loader/bridge por documento; source ausente e `g22-auto` são `unknown`; Pedido Detail foi preservado e recebe o documento materializado.
- **Proporção:** 87 inserções e 23 remoções em produção; 804 inserções e 22 remoções em testes; classificação `SCOPE_PROPORTIONATE`.
- **Validação:** gates obrigatórios verdes; revisão independente read-only `APPROVE`; nenhuma regressão nova.
- **Dívida preexistente:** 2 falhas em `tests/documents-ingestor.test.js` e 15 falhas em `tests/g14-c-bridge-smoke.test.js`, idênticas ao baseline.
- **Acessos:** sem staging, produção, Supabase ou push.
- **Próxima fase indicada:** `G28-B5-D5-B3 — REMOVE STATUSOVERRIDES`; D5-B3/D5-B4 não iniciadas.

---

## 2026-07-14 — G28-B5-D5-B3 — Remove local decision status overrides

- **Gate:** `CLOSED / ACCEPTED`.
- **Baseline técnico:** `3f12bd0` (`3f12bd015d233b8686a8d495435e17294cf66b12`).
- **Commit técnico:** `3532aa8` (`3532aa8417281fbc0f143963a1e7ef44b73cc2e7`) — `G28-B5-D5-B3: remove local decision status overrides`.
- **Manifesto literal:**
  - `js/screens/documentos-recebidos.js`
  - `tests/documentos-recebidos-source-boundary.test.js`
  - `tests/documentos-recebidos-status-overrides-removal.test.js`
- **Causa raiz:** falha de persistência local podia simular visualmente estado aceito/rejeitado.
- **Mudança efetiva:** remoção completa de `statusOverrides` do runtime; nenhum estado paralelo substituto foi criado.
- **Comportamento de falha:** save/remove local exibem erro explícito e preservam o status real ou a decisão persistida; sucesso rerenderiza a partir da persistência real.
- **Proveniência preservada:** `manual`/`legacy` permanecem elegíveis para decisões locais; Supabase permanece canônico/cloud-only; unknown, ausente, inválido, vazio, `null` e `g22-auto` permanecem fail-closed.
- **Validação:** gate focado 26/26; todos os gates prescritos verdes; node checks e diff checks aprovados; revisão independente `APPROVE`; code health `+13/-12`.
- **Telemetria:** `TELEMETRY_STATUS: partial`; `TELEMETRY_RUN_IDS: 7a2b1ac6-2114-4cd2-a99a-4a57005991c2`; `TELEMETRY_FAILURES: invalid_outcome, arguments_invalid`; não bloqueante.
- **Acessos:** zero staging, produção, Supabase, SQL, migration e push.
- **Escopo:** B2 helpers, RPCs, banco e fluxo canônico não foram alterados; D5-B4 não foi iniciada.
- **Próxima fase nomeável:** `G28-B5-D5-B4 — BLOCK LEGACY DECISION RPC RUNTIME CONSUMERS`; não criar nem iniciar.

---

## 2026-07-14 — G28-B5-D5-B4 — Record legacy decision RPC runtime removal closeout

- **Gate:** `CLOSED / ACCEPTED`.
- **Technical HEAD:** `3d64b62f25516ef0d18e2613fc50298e2faee16a` — `G28-B5-D5-B4: remove legacy document decision RPC runtime`.
- **Manifesto literal:**
  - `js/documents-supabase-decisions.js`
  - `tests/documentos-recebidos.smoke.js`
  - `tests/documents-supabase-decisions.test.js`
  - `tests/document-legacy-decision-rpc-runtime-boundary.test.js`
- **Removals:**
  - `decideDocumentInCloud` (function) removed.
  - `window.RAVATEX_DOCUMENTS.decideDocumentInCloud` removed.
  - Zero JavaScript runtime calls to `decidir_documento`.
- **Preserved:**
  - `registerDocumentDecisionInCloud` and `registrar_decisao_documento` (canonical command adapter).
  - `undoDocumentDecisionInCloud` and `desfazer_decisao_documento` (undo adapter).
  - SQL `decidir_documento` was not removed.
- **Validation:** focused gates green; independent review `APPROVE`.
- **Access:** no external, database, staging, production, migration, or push access.
- **Telemetry:** unavailable and non-blocking.
- **Residual risk:** external consumers of `decidir_documento` outside this repository may exist.
- **Next phases:** `G28-B5-D5-B5` and `G28-B8` remain unauthorized and not started.

---

## 2026-07-14 — G28-B5-D5-B4-C-R1 — Documentary closeout correction

- **Corrected phase identifier:** `G28-B5-D5-B4-C` (the prior entry was imprecisely named).
- **Canonical documentary HEAD** (before this correction): `18afe021f54e422b7fe54ed60f26e49e402f41db` — `G28-B5-D5-B4-C: record legacy decision RPC runtime removal closeout`.
- **Technical HEAD** remains: `3d64b62f25516ef0d18e2613fc50298e2faee16a` — `G28-B5-D5-B4: remove legacy document decision RPC runtime`.
- **Corrected residual risk:** external consumers of `window.RAVATEX_DOCUMENTS.decideDocumentInCloud` may exist and will no longer find that export. The prior residual risk statement incorrectly described the risk as concerning SQL `decidir_documento`.
- **SQL `decidir_documento`** remains preserved.
- **Nature of prior entry:** the prior entry was not a technical-state change; it contained phase identifier imprecision and residual risk scope imprecision only. No code, tests, SQL, or package files were modified by this correction.

---

## 2026-07-14 — G28-B5-D5 — Consolidated regression and residual legacy decision closeout

- **Gate:** `CLOSED / ACCEPTED`.
- **B1 — explicit source boundary:** `CLOSED / ACCEPTED`.
- **B2 — source-gated local decision helpers:** `CLOSED / ACCEPTED_WITH_PREEXISTING_TEST_DEBT`.
- **B3 — removal of statusOverrides:** `CLOSED / ACCEPTED`.
- **B4 — removal of legacy JavaScript decision RPC consumer:** `CLOSED / ACCEPTED`.
- **B5 — consolidated regression and residual legacy decision:** `CLOSED / ACCEPTED`.
- **Technical commits:**
  - B1: `b247e43504c0afcc0d25e95f8012f93a09eb0692` — `Add idempotent document decision command contract`
  - B2: `c51542244ab6e3c683a1a0a54fcc634df6f7478d` — `G28-B5-D5-B2: require explicit legacy source for local decisions`
  - B3: `3532aa8417281fbc0f143963a1e7ef44b73cc2e7` — `G28-B5-D5-B3: remove local decision status overrides`
  - B4: `3d64b62f25516ef0d18e2613fc50298e2faee16a` — `G28-B5-D5-B4: remove legacy document decision RPC runtime`
- **Documentary closeout commits:**
  - B4-C: `18afe021f54e422b7fe54ed60f26e49e402f41db` — `G28-B5-D5-B4-C: record legacy decision RPC runtime removal closeout`
  - D5 (this closeout entry): documentary commit containing this entry; resolve the final HEAD with `git rev-parse HEAD` after commit.
- **Syntax checks (all exit 0):**
  - `node --check js/documents-supabase-decisions.js`
  - `node --check js/documents-ingestor.js`
  - `node --check js/screens/documentos-recebidos.js`
- **Focused tests (all exit 0):**
  - `documents-supabase-decisions.test.js`: 47 pass / 0 fail
  - `documentos-recebidos-decision-integration.test.js`: 11 / 0
  - `documentos-recebidos.smoke.js`: 135 / 0
  - `document-legacy-decision-rpc-runtime-boundary.test.js`: 3 / 0
  - `documents-decision-controller.test.js`: 68 / 0
  - `documentos-recebidos-decision-modal.test.js`: 41 / 0
  - `documents-decision-command.test.js`: 96 / 0
  - `documents-supabase-reader.test.js`: 46 / 0
  - `document-decision-command-contract.test.js`: 23 / 0
  - `document-queue-read-model.test.js`: 48 / 0
  - `documentos-recebidos-source-boundary.test.js`: 14 / 0
  - `documentos-recebidos-status-overrides-removal.test.js`: 12 / 0
  - `documents-ingestor-local-decision-boundary.test.js`: 40 / 0
  - **Total: 584 pass / 0 fail**
- **Runtime static counts:**
  - `D5_REGRESSION_GREEN`
  - `RUNTIME_DECIDIR_DOCUMENTO_CALLS=0`
  - `RUNTIME_DECIDE_DOCUMENT_IN_CLOUD_EXPORTS=0`
  - `RUNTIME_STATUS_OVERRIDES=0`
  - `CANONICAL_REGISTER_ADAPTER_PRESENT=1`
  - `CANONICAL_REGISTER_RPC_CALL_PRESENT=1`
  - `CANONICAL_UNDO_ADAPTER_PRESENT=1`
  - `CANONICAL_UNDO_RPC_CALL_PRESENT=1`
  - `SQL_DECIDIR_DOCUMENTO_PRESENT=1`
- **Known historical debt (not blocking, identical to baseline):**
  - `tests/documents-ingestor.test.js`: 2 known failures
  - `tests/g14-c-bridge-smoke.test.js`: 15 known fixture failures
- **Binding residual decision:** The explicit manual/legacy local decision domain remains temporarily supported. Only documents explicitly classified as manual or legacy may read, write, or remove local decisions. Supabase, unknown, absent, empty, null, invalid, and g22-auto sources must remain fail-closed and must never use local decision persistence. D5 does not authorize migration, automatic conversion, database removal, or removal of the explicit legacy local decision domain. Any future migration or removal of the legacy domain requires a separate read-only diagnosis and explicit architect authorization. This does not preserve or authorize silent fallback, source inference, local persistence for Supabase/unknown, visual parallel state, `decideDocumentInCloud`, JavaScript calls to `decidir_documento`, aliases, proxies, wrappers, or stubs.
- **Residual external-consumer risk:** External consumers of `window.RAVATEX_DOCUMENTS.decideDocumentInCloud` outside this repository may exist and will no longer find that export.
- **SQL and canonical register/undo preservation:** SQL `decidir_documento` preserved (not removed, not migrated). Canonical register adapter `registerDocumentDecisionInCloud`/`registrar_decisao_documento` preserved. Canonical undo adapter `undoDocumentDecisionInCloud`/`desfazer_decisao_documento` preserved.
- **Access:** No remote access. No staging, production, Supabase, database, network, MCP, or push.
- **Next phases:** B6 and B8 not started. No next phase authorized. Any future implementation requires separate architect authorization.

---

## 2026-07-14 — G28-PLAN-R1 — Documentary plan/state/handoff/ledger reconciliation

- **Gate:** RECONCILIATION EXECUTED (docs-only, no runtime/code/SQL/migration/test/staging/production/push)
- **Cause:** canonical plan, state, handoff and ledger exhibited drift after accepted phases G28-B5-D5 and prior; stale active-phase text in master plan incorrectly implied G28-P0 active; matrix showed B3 IN_PROGRESS, B4 PLANNED, B5 PLANNED when all are accepted; header referenced G27 as last milestone; plan suggested reentering B1 after approval
- **Authority files used for evidence:** `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger, `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, `docs/governance/DOCUMENTATION_MODEL.md`
- **Verified checkpoint:**
  - Last fully accepted TECHNICAL block: `G28-B5-D5` — `CLOSED / ACCEPTED`
  - Baseline: `7d3e0261b668a46a80208198352039dc1f352010` (branch `work/g28-document-qualification`, clean worktree/index, no untracked)
  - No active implementation phase
  - Next authorizable action: none; requires architect authorization
  - Open architect decisions: Documento↔Pedido cardinality/relationship; Documento↔OP cardinality including multiplicity/representation; required/optional links per document type; compatibility (Documento↔OP proven open; no accepted cardinality decision exists)
- **B6 classification:** PLANNED / DIAGNOSED (architectural boundaries only) / NOT DECIDED / NOT IMPLEMENTED / NOT ACCEPTED
  - No B6 contract, schema, RPC, read-model, or UI accepted
  - Existing `document_candidates.pedido_id` / `document_events.pedido_id` (db/38_documentos_schema.sql, commit 5a92a436) and B4 display-only queue read model are noncanonical pre-B6 evidence; they do not establish accepted canonical Documento↔Pedido cardinality or link contract
  - G28-B6-B: PLANNED / NOT STARTED; no accepted definition, contract, or implementation evidence
  - B1 and accepted B5 decision-command contract did not implement canonical linking
  - No B6/B6-A/B6-B commits in Git history; no `document_pedido_*`, `document_op_*`, or B6 schema/RPC/read-model/UI found
  - G28-B1 plan lines 560–568 documented architectural boundaries/open decisions (cardinality/multiplicity, required/optional links, incompatible link treatment). This is a completed architectural-boundary diagnosis, not a completed architect cardinality decision and not B6 implementation
  - Documento↔OP cardinality remains open from B1 plan lines 511–519
- **Deferred/not-started:** B6, B7, B8
- **Files modified:** `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` (added CURRENT EXECUTION CHECKPOINT, updated header, matrix, subphase section, allowed states, closure criteria, next-action section), `PROJECT_STATE.md` (compacted operational state, added open decisions, deferred phases, active-phase=none), `AGENT_HANDOFF.md` (mandatory reading list, reconciliation baseline, prohibition on numbering inference), this ledger (this entry), `docs/governance/DOCUMENTATION_MODEL.md` (added §17 PHASE CHECKPOINT RECONCILIATION)
- **No activity:** no code, SQL, migration, runtime, test, staging, production, Supabase, network, MCP, or push executed by this reconciliation
- **Next indicated:** any future B6 order must use this reconciled checkpoint, not phase numbering; reconcile master plan before issuing any future order

---

## 2026-07-14 — G28-B6 — Canonical document links (Documento↔Pedido / Documento↔OP)

- **Gate:** `READY FOR IASUP ACCEPTANCE` — `IMPLEMENTED LOCALLY / STAGING VERIFICATION BLOCKED`. No Supabase MCP/CLI is available in this environment; staging `ucrjtfswnfdlxwtmxnoo` was not accessed and `db/51` was not applied. Not `CLOSED`, not `ACCEPTED`; G28-B7 not authorized.
- **Approved contract implemented:** Documento→Pedido `0..1` confirmed; Documento→OP `0..N` confirmed. Dedicated, typed, versioned canonical persistence. `document_candidates.pedido_id` / `document_events.pedido_id` NOT promoted/populated/reinterpreted; `pedido_manual` remains suggestion only.
- **Schema (additive, versioned, NOT applied):** `db/51_document_canonical_links.sql` — `document_link_revisions` (one complete link-state revision per document: `pedido_id` nullable, `version`, `active`, unique `command_id`, `created_by/at`, `revoked_by/at/reason`; typed FKs to `document_candidates(document_id)`, `pedidos(id)`, `auth.users`; unique `(document_id, version)`; partial-unique active revision per document; active/revocation CHECK; ON DELETE RESTRICT preserving audit) and `document_link_revision_ops` (PK `(revision_id, op_id)`; typed FKs to revision and `ops(id)`). Admin-only RLS + grants mirroring `db/38`.
- **RPCs (SECURITY DEFINER, admin-only, idempotent):**
  - `registrar_vinculos_documento(TEXT, UUID, BIGINT[], UUID, UUID)` — advisory lock by `command_id`, candidate `FOR UPDATE`, existence/not-cancelled/compatibility (OP→Pedido via `lotes.pedido_id`) fail-closed, revokes prior active revision without deleting; bounded outcomes (created, updated, no_change, replayed, active_revision_exists, stale_active_revision, command_conflict, candidate_not_found, duplicate_op, pedido_not_found, pedido_not_linkable, op_not_found, op_not_linkable, op_pedido_mismatch, op_not_avulsa, input_error, auth_error).
  - `registrar_decisao_e_vinculos_documento(...)` — atomic composition of `registrar_vinculos_documento` + `registrar_decisao_documento` (B5 preserved, unchanged), full rollback via block savepoint if either fails; allows explicit empty-link state; does not merge link data into `document_decisions`.
- **Runtime:** `js/documents-supabase-links.js` (register / atomic apply / read active revision / read linkable targets — reads are read-only); `js/documents-validation-command.js` (idempotent lifecycle, two command ids reused on retry); `js/documents-supabase-reader.js` attaches `_ravatex_link_revision` (fail-closed `unavailable`, never silent "no links"); `js/document-queue-read-model.js` confirmed Pedido only from the active revision (candidate `pedido_id` ignored), OP projection replaces the unavailable placeholder, cancelled-target warnings; `js/screens/documentos-recebidos-decision-modal.js` completes "Validar e vincular" (suggestion shown separately, Pedido `0..1`, OP `0..N` compatibility-filtered, non-blocking NF/romaneio warning); screen routes accept→atomic action, reject/undo on the existing canonical paths; `index.html` loads the two new modules.
- **Preserved / not created:** `registrar_decisao_documento`, `desfazer_decisao_documento`, SQL `decidir_documento` (no runtime caller). No `documentos_operacionais`, no generic `document_links(target_type,target_id)`, no scalar `op_id` on candidates, no confirmed-link write to `document_candidates.pedido_id`, no dual writes, no backfill, no localStorage/fallback/aliases/service-role in the cloud runtime.
- **Local focused tests (green):** 654/654 across the document battery, incl. new files: `document-canonical-links-contract` (21), `documents-supabase-links` (13), `documents-supabase-reader-links` (4), `documents-validation-command` (10); updated `document-queue-read-model` (59), `documentos-recebidos-decision-modal` (52), `documentos-recebidos-decision-integration` (11), `documentos-recebidos.smoke` (135). `git diff --check` clean (non-blocking LF→CRLF warnings); `node --check` on all changed JS.
- **Pre-existing debt unchanged:** `documents-ingestor.test.js` 2 fail; `g14-c-bridge-smoke.test.js` 15 fail (identical to baseline).
- **Access:** no staging, production, Supabase, applied migration, network, MCP, or push. `db/51` versioned and NOT applied.
- **Commit:** single local commit `G28-B6: implement canonical document links` (resolve final HEAD with `git rev-parse HEAD` after commit).
- **Residual risk:** staging unverified — tables/columns/types/constraints/indexes/RLS/policies/grants/RPC signatures/idempotent replay/compatibility must be applied and verified in `ucrjtfswnfdlxwtmxnoo` before acceptance; wrapper atomicity depends on savepoint behavior under real execution; historically under-populated `lotes.pedido_id` limits linkable OPs (avulsa rule covers, no backfill).
- **Next indicated (not authorized):** apply + verify `db/51` in staging, then `G28-B7` (surface display) requires explicit architect authorization.

---

## 2026-07-14 — G28-B6 — Direct staging verification and closeout

- **Gate:** `STAGING FUNCTIONALLY VERIFIED / READY FOR ARCHITECT ACCEPTANCE`; not `CLOSED` or `ACCEPTED`. `G28-B7` remains `NOT AUTHORIZED`.
- **Operator / mode:** Hermes / `gpt-5.6-terra`, direct Supabase MCP execution; no delegation for Supabase. Workspace `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`, branch `work/g28-document-qualification`, initial HEAD `b2f180ed0e6f1c2ee6c02881d0199d1bfaf29366`, clean worktree.
- **Scope and safety:** staging `ucrjtfswnfdlxwtmxnoo` only; production `bhgifjrfagkzubpyqpew` not accessed; no secrets recorded; no push. Fixture marker `G28-B6-VERIFY-c63b6c2c8aff4da58e87d1e75f7a9236` was isolated from production data.
- **Contract evidence:** live `document_link_revisions` / `document_link_revision_ops`, dependent columns, RLS/grants and the four critical RPCs were inspected. `registrar_vinculos_documento` exercised 20 cases: valid Pedido/OP, duplicate/replay/no_change, expected-active conflict/stale, missing/cancelled targets, Pedido↔OP mismatch, avulsa-only rule and validation outcomes; result `20/20`.
- **Ownership and read-model evidence:** canonical revisions changed while `document_candidates.pedido_id`, `document_candidates.pedido_manual` and `document_events.pedido_id` remained byte-for-byte as fixture input. Reader projection exposed active revision Pedido/OP/statuses; frontend configured for staging returned explicit `supabase_unavailable` when its link source was removed and did not write.
- **Atomic wrapper evidence:** `registrar_decisao_e_vinculos_documento` covered success, duplicate/retry/conflict, invalid link and a decision-side failure after a valid link request. The latter returned `decision_failed` and proved `no_new_revision`, `no_new_decision`, prior active revision and OP rows preserved (PostgreSQL rollback).
- **Functional UI evidence:** local app was served temporarily with staging configuration and confirmed the staging URL. Authenticated modal smoke was not executable because no admin browser session was available: `LIVE_MODAL_SMOKE_BLOCKED_BY_TOOLING`; this is a residual risk, not a backend failure.
- **Fixture cleanup:** deleted event, decision, OP B, cancelled OP, cancelled Pedido and the unreferenced lot B; restored candidate to `pending` with `accepted_at/rejected_at = NULL`. Remaining restrictive audit graph is explicit: 1 client, 2 Pedidos, 2 lotes, 4 OPs, 1 candidate, 8 link revisions and 10 link-revision OP rows. It was intentionally retained because deleting audit children to force cleanup would destroy the approved `ON DELETE RESTRICT` history.
- **Cause / corrective action:** no B6 technical defect was found; no code/schema/runtime patch made. Documentation state only was corrected.
- **Local validation:** B6 affected source battery (10 files) `374 pass / 0 fail`. Extended 14-file document battery `641 pass / 2 fail`: two pre-existing stale expectations in `tests/documentos-recebidos-queue-ui.test.js` expect candidate-based Pedido/OP presentation contradicted by B6 canonical revision behavior (`candidate.pedido_id` ignored; no active OP projects `no_confirmed_op`). No JS changed during this closeout and no correction was authorized.
- **Files changed in closeout:** `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, this ledger.
- **Residual risks:** authenticated live-modal smoke pending browser admin auth; two stale queue-ui assertions as above; architect acceptance pending. Next step is architect acceptance only; no B7 work, migration, backfill, repair or push.

---

## 2026-07-14 — G28-B6 — Architect acceptance and G28-B7 authorization

- **Gate:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_TEST_DEBT`. Explicit architect decision recorded in this session; it intentionally supersedes the prior checkpoint that still described G28-B6 as `READY FOR ARCHITECT ACCEPTANCE`. Not an inference from phase numbering.
- **Technical implementation commit:** `b2f180ed0e6f1c2ee6c02881d0199d1bfaf29366` — `G28-B6: implement canonical document links`.
- **Staging verification closeout commit:** `b130db44d32718ddf6d3e2bffb1439dac3a1948f` — `docs(G28-B6): record staging verification closeout`.
- **Staging project:** `ucrjtfswnfdlxwtmxnoo`. Production `bhgifjrfagkzubpyqpew` not accessed. No push.
- **Accepted non-blocking debts:**
  1. authenticated browser smoke remains pending;
  2. two stale expectations remain in `tests/documentos-recebidos-queue-ui.test.js`;
  3. the synthetic staging audit graph remains preserved under `ON DELETE RESTRICT` and is documented.
- **Accepted B6 contract (unchanged):** Documento→Pedido `0..1` confirmed; Documento→OP `0..N` confirmed; canonical source `document_link_revisions` / `document_link_revision_ops`; `document_candidates.pedido_id` / `document_events.pedido_id` remain Ingestor-owned; `pedido_manual` remains suggestion only.
- **Authorization:** `G28-B7` (exibição nas superfícies) is explicitly authorized. No later phase (`G28-B8`+) is authorized.
- **Next authorizable action:** implement `G28-B7` per master plan §CAMADA 1 / §SEQUÊNCIA DE IMPLEMENTAÇÃO — G28-B7.

---

## 2026-07-14 — G28-B7 — Surface display of canonical document links (Pedido detail increment)

- **Gate:** `IMPLEMENTED / TESTED (local) / READY FOR ARCHITECT ACCEPTANCE`. Not `CLOSED`, not `ACCEPTED` (IAexec does not self-close). No later phase authorized.
- **Scope implemented:** canonical reverse projection ("documents linked to a target") + wiring on the **Pedido detail** admin surface, which previously presented `pedido_manual` matches as if they were links (a B6-contract violation). All surfaces now consume the same canonical projection.
- **New pure read model:** `js/document-surface-links-read-model.js` — `RAVATEX_DOCUMENT_SURFACE_LINKS.buildLinkedDocumentsForPedido(pedidoId)` and `buildLinkedDocumentsForOp(opId)`. Read-only; derives confirmed links **only** from the active canonical revision attached by the reader (`_ravatex_link_revision`). `pedido_manual`, `candidate.pedido_id`, CNPJ and technical evidence are never read as links. Explicit states: `loading | invalid | unavailable | empty | available` (fail-closed — never a silent "no links"). No writes, no DOM, no network.
- **Pedido detail wiring:** `js/screens/pedido-detail-progress.js` computes `linkedDocumentRows` / `linkedDocumentsState` from the read model (guarded, fail-closed to `unavailable` when the module or globals are absent). `js/screens/pedido-detail-render.js` renders a `DOCUMENTOS VINCULADOS` section (confirmed-only, "Vinculo confirmado" pill, revision version, linked-OP ids, cancelled-target warning, explicit empty/unavailable states) and relabels the pre-existing Ingestor section as suggestions (not confirmed links). `index.html` loads the new module.
- **Distinct from suggestions:** confirmed canonical links (new section) vs `pedido_manual` Ingestor suggestions (existing section, now explicitly labeled). No inference, no dual write, no new writer, no generic polymorphic link, no `documentos_operacionais`, no B8 correction/revocation UI, no OP-lifecycle/inventory/financial change.
- **B6 stale test debt resolved (in this commit):** `tests/documentos-recebidos-queue-ui.test.js` — (1) `getPedidoOptions` no longer expects `uuid-ped` from `candidate.pedido_id`; (2) OP state expectation corrected from `unavailable` to `no_confirmed_op` (`{ state:'no_confirmed_op', op_ids:[] }`). Behavioral assertions preserved.
- **New focused tests:** `tests/document-surface-links-read-model.test.js` (14) — confirmed pedido/op, multiple OPs `0..N`, suggestion-vs-confirmation, cancelled target, unavailable/loading/invalid, non-supabase never confirmed. `tests/pedido-detail-linked-documents.smoke.js` (6) — view model + `buildDocuments` DOM for available/empty/unavailable.
- **Tests (LF, exit 0):** document surface links 14/14; pedido-detail-linked-documents 6/6; queue-ui 58/58; full document battery + pedido-detail-linked-ops + documents-ingestor-ui-smoke 475/475; B5-D5 document regression 303/303. `node --check` on all changed JS; `git diff --check` clean (informational LF→CRLF only).
- **Pre-existing debt unchanged:** `tests/pedido-detail.smoke.js` has 41 pre-existing failures driven by CRLF working-tree line endings breaking `\n`-anchored source-slice regexes over other untouched files (op-latex-admin, op-nova, entrega-form); identical set with and without this change (verified against the LF baseline). `tests/documents-ingestor.test.js` and `tests/g14-c-bridge-smoke.test.js` pre-existing failures also unchanged.
- **Not wired this increment (mechanism ready, reported remaining B7 work):** OP detail surface (`op-latex-admin` document card is an intentional Drive-attachment stub, not a linked-documents display; a green smoke asserts its stub text), Pedido/OP timeline canonical entries, and a dedicated global document search. The canonical central Documentos queue and its `pedido_state` filters were already canonical from B6. `buildLinkedDocumentsForOp` is implemented and tested and is the ready consumer for the OP surface.
- **Remote verification required (not performed — Supabase access prohibited for Claude):** authenticated admin rendering of the Pedido-detail `DOCUMENTOS VINCULADOS` section against staging `ucrjtfswnfdlxwtmxnoo` with a document whose active revision links the Pedido; confirm confirmed-vs-suggestion separation and the empty/unavailable states in the live app. No new remote queries were introduced (the projection reads the already-loaded reader output).
- **Access:** no push; no production; no Supabase; no migration; no network.
- **Commit:** single local commit `G28-B7: display canonical document links on Pedido detail` (resolve final HEAD with `git rev-parse HEAD` after commit).
- **Next indicated (not authorized):** architect acceptance of this B7 increment and/or explicit authorization to continue the remaining B7 surfaces. `G28-B8` remains unauthorized.

---

## 2026-07-14 — G28-B7 — Complete canonical link display surfaces (continuation)

- **Gate:** `IMPLEMENTED / TESTED (local) / READY FOR ARCHITECT ACCEPTANCE`. Same-phase continuation of the entry above; not a new phase, not `CLOSED`, not `ACCEPTED` (IAexec does not self-close). `G28-B8` remains unauthorized.
- **Antecedent:** partial Pedido-detail B7 commit `ed35f049397af4061ed6e8bb2d9ec3056c543724` (Pedido detail only). A prior session exhausted credits after implementing the remaining B7 surfaces and running tests, before documentation closeout and commit. This continuation recovers, audits, verifies and commits that work without redesign.
- **Surfaces completed in this continuation:**
  - **OP detail:** `js/screens/op-latex-admin.js` and `js/screens/op-tecelagem-producao-admin.js` now render `Documentos vinculados` (confirmed canonical links via `buildLinkedDocumentsForOp`) and append canonical document-link timeline entries. The pre-existing Drive-attachment slots are preserved as the visual-only attachment layer, unchanged.
  - **Pedido / OP canonical timeline:** `js/document-surface-links-read-model.js` gains `buildDocumentLinkTimelineForPedido` / `buildDocumentLinkTimelineForOp` and `TIMELINE_KIND` (`linked`/`replaced`/`unlinked`). Ordered newest-first; confirmed-only by default; an OP entry is included ONLY when the OP is explicitly in the revision's typed OP children — never inferred via Pedido membership. Pedido detail renders a `LINHA DO TEMPO DOS VINCULOS` block; `js/screens/pedido-detail-progress.js` exposes `linkedDocumentTimeline` in the view model.
  - **Global canonical search/filtering:** `js/screens/documentos-recebidos-queue-ui.js` adds `matchesConfirmedPedido`, `matchesConfirmedOp`, `matchesLinkAvailability` (filter axis `all`/`available`/`unavailable`), `getConfirmedOpOptions`, and the `confirmedPedidoId` / `confirmedOpId` / `linkAvailability` criteria wired into `filterQueue`. A confirmed Pedido filter matches ONLY the active canonical revision's `pedido_id`; a confirmed OP filter matches ONLY OPs explicitly present in the active revision's typed OP children; `pedido_manual` and `candidate.pedido_id` never satisfy a confirmed filter; unavailable link source is fail-closed.
  - **Shared surface UI helper:** new `js/document-links-surface-ui.js` (`window.RAVATEX_DOCUMENT_LINKS_UI`) — pure, dependency-injected DOM builders `buildLinkedDocumentNodes` and `buildLinkTimelineNodes` consumed by the OP surfaces and the Pedido-detail timeline. No Supabase, no writes, no globals beyond injected `el`/`svgEl`. `index.html` loads it statically.
- **Contract preserved (B6/B7):** confirmed links read only from the active canonical revision (`_ravatex_link_revision`); `document_candidates.pedido_id` and `pedido_manual` remain Ingestor-owned suggestions; no writers, no localStorage, no parallel state, no OP/Pedido/inventory/production/financial lifecycle change, no B8 correction/revocation UI.
- **Tests (LF, exit 0):**
  - `node --check` on every changed JS (10 files) — all OK.
  - New focused `tests/document-links-surface.test.js`: **14/14** (timeline pedido/op projection + shared UI helper, incl. pedido_manual/candidate.pedido_id never confirmed, OP-not-present not inferred).
  - `tests/documentos-recebidos-queue-ui.test.js`: **69/69** (added 11 canonical search/filter cases; existing 58 preserved).
  - `tests/pedido-detail-linked-documents.smoke.js`: **7/7** (added canonical-timeline render case).
  - B4–B7 document battery (19 files): **616/616**.
  - OP + ingestor UI battery: **670 pass / 15 pre-existing** (see pre-existing comparison below). `op-latex-admin.smoke.js` (the OP file modified by this increment): **55/0**.
- **Pre-existing failure comparison (verified against baseline `ed35f04`):**
  - `tests/ops-list-screen.smoke.js` 11 fail, `tests/op-form-helpers.smoke.js` 3 fail, `tests/op-writes.smoke.js` 1 fail: stale-regex expectations that read `index.html` with a strict `<script\s+src="js/screens/cadastros\.js"\s*></script>` pattern ignoring the `?v=` cache-buster suffix; proven identical on baseline HEAD (`findScriptIdx` returns `-1` on both worktree and baseline). None of these files are modified by this increment. Classification: `STALE EXPECTATION` / `PRE-EXISTING`.
  - `tests/pedido-detail.smoke.js`: 140 pass / 41 fail (CRLF `\n`-anchored regexes over untouched files) — identical to the figure reported by the prior session and to baseline. Classification: `ENVIRONMENT / CRLF ARTIFACT` / `PRE-EXISTING`.
  - `tests/documents-ingestor.test.js`: 2 fail; `tests/g14-c-bridge-smoke.test.js`: 15 fail — unchanged from the B5-D5 ledger debt. Classification: `PRE-EXISTING`.
- **No corrections required:** the audited diff satisfies all 10 B7-contract review points; no working code was rewritten for style.
- **Remote verification required (not performed — Supabase access prohibited for Claude):** authenticated admin rendering of the new sections (Pedido-detail `DOCUMENTOS VINCULADOS` + timeline; OP-detail `Documentos vinculados` + timeline; queue canonical filters) against staging `ucrjtfswnfdlxwtmxnoo`. No new remote queries were introduced.
- **Access:** no push; no production; no Supabase; no migration; no network.
- **Commit:** single local commit `G28-B7: complete canonical link display surfaces` (resolve final HEAD with `git rev-parse HEAD` after commit).
- **Next indicated (not authorized):** architect acceptance of `G28-B7` (all surfaces implemented and tested locally). `G28-B8` remains unauthorized.

---

## 2026-07-14 — G28-B7 — Architect acceptance and G28-B8 authorization

- **Gate:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_REMOTE_SMOKE_DEBT`. Explicit architect decision recorded in this session; not an inference from phase numbering.
- **Partial commit (Pedido-detail increment):** `ed35f049397af4061ed6e8bb2d9ec3056c543724`.
- **Completion commit (all surfaces):** `9ef61e1896af631bc5aeeced4af93c77051f4de4`.
- **Accepted contract:** canonical reverse projection consumed by every surface (Pedido detail, OP detail, Pedido/OP timeline, central Documentos search/filters) reads confirmed links **only** from the active canonical revision (`_ravatex_link_revision`); `pedido_manual` and `candidate.pedido_id` remain Ingestor suggestions and are never read as links; OP never inferred via Pedido membership; unavailable link source is fail-closed.
- **Accepted non-blocking debt:** authenticated staging smoke of the B7 Pedido, OP, timeline and search surfaces against `ucrjtfswnfdlxwtmxnoo` remains pending (Supabase prohibited for the local agent; no new remote queries were introduced).
- **Authorization:** `G28-B8` (correction / revocation / restoration / audit) is explicitly authorized. No phase after `G28-B8` is authorized.
- **Next authorizable action:** implement `G28-B8` per master plan §1.10 / §SEQUÊNCIA — G28-B8.

---

## 2026-07-14 — G28-B8 — Correction, revocation, restoration and audit of canonical links

- **Gate:** `IMPLEMENTED / TESTED (local) / READY FOR ARCHITECT ACCEPTANCE`. Not `CLOSED`, not `ACCEPTED` (IAexec does not self-close). No phase after `G28-B8` authorized.
- **Scope implemented:** the minimum complete contract for human administration of canonical document links, extending the single canonical command boundary (no competing writer):
  - **Correction** — replace the complete active link set with a corrected state (new revision; previous revision revoked, not deleted; requires the expected active revision id; idempotent; fails closed on stale/divergent state; records actor/timestamp/reason).
  - **Revocation / unlink** — register the canonical explicit empty-link state (`pedido_id` NULL, no OPs); previous linked revision preserved; reason + actor recorded; the Ingestor suggestion and the document decision are never touched.
  - **Restoration** — copy a selected historical revision's normalized Pedido/OP set into a NEW active revision, stamping `restored_from_revision_id`; the historical row is never reactivated or mutated; current Pedido/OP validity and compatibility are revalidated (fail-closed); optimistic concurrency + idempotency.
  - **Audit** — read-only trail of every append-only revision (version, active/revoked, Pedido, OPs, actor, created_at, revoked actor/at, reason, restoration source, command id), newest-first, with active-revision-uniqueness anomaly detection; fail-closed when history is unavailable.
- **Schema / RPC (additive migration `db/52_document_link_correction_revocation_restoration.sql`, NOT applied):**
  - Additive column `document_link_revisions.restored_from_revision_id UUID` (typed FK to `document_link_revisions(id)` ON DELETE RESTRICT + partial index). No backfill.
  - Evolved the single writer `registrar_vinculos_documento` (DROP of the 5-arg signature + recreate with two trailing DEFAULT NULL params `p_reason`, `p_restored_from_revision_id`): reason → `revocation_reason` of the superseded revision (COALESCE `'superseded'`); provenance stamped on the new revision. Five-arg positional callers (the B6 atomic wrapper) keep identical behavior. All B6 outcomes/locks/validation preserved; still no DELETE, no candidate/decision mutation, no inference.
  - New RPC `restaurar_vinculos_documento(...)` — reads the historical source (read-only), copies its normalized Pedido/OP set and delegates to `registrar_vinculos_documento` (no duplicated compatibility logic), stamping provenance; rejects `restore_source_not_found` / `restore_source_mismatch` and propagates the writer's fail-closed outcomes when the historical target is no longer valid.
  - Admin-only grants reapplied; PostgREST reload. Additive: no DROP TABLE; B5 decision RPCs and legacy `decidir_documento` untouched.
- **Runtime:** `js/documents-supabase-links.js` gains `loadDocumentLinkRevisionHistory` (full append-only history + OP children, read-only, fail-closed) and `restoreDocumentLinksInCloud` (→ `restaurar_vinculos_documento`); `registerDocumentLinksInCloud` carries an optional `reason` (sent only when present, preserving the accepted five-param shape for correction/unlink). New pure `js/document-link-audit-read-model.js` (ordered audit trail + active-uniqueness). New pure `js/document-link-admin-controller.js` (correction/revocation/restoration orchestration; in-memory command-id reuse on retry with the server RPC as idempotency authority; optimistic concurrency; outcome→UI mapping). New pure `js/screens/document-link-admin-modal.js` (inspect active links + full history, correct, unlink, restore; reason required; stale/conflict/unavailable fail-closed). Wired into the central Documentos queue only (`js/screens/documentos-recebidos.js`: guarded `handleLinkAdmin` + a per-row "Histórico e vínculos" action); read-only Pedido/OP display surfaces untouched. `index.html` loads the three new modules.
- **UI boundary:** the administrative surface lives only in the central Documentos queue (plan-authorized); no parallel generic admin screen; no mutation from Pedido/OP read-only surfaces. A human reason is required for every mutating action.
- **Local focused tests (LF, exit 0):** `document-link-correction-restoration-contract` 13/13; `document-link-audit-read-model` 11/11; `document-link-admin-controller` 18/18; `document-link-admin-modal.smoke` 12/12; `documents-supabase-links` 25/25 (12 new B8 cases). Full B4–B8 document/link battery (26 files) **831/831**. `node --check` on all five changed/new JS files; `git diff --check` clean (informational LF→CRLF only). Updated `document-decision-command-contract` allow-list to admit `db/52` (git-manifest gate), consistent with the db/51 precedent.
- **Regression:** B6 atomic validation + B7 read-only display surfaces remain green within the 831/831 battery. Pre-existing failures unchanged vs the B7 baseline: `pedido-detail.smoke.js` 140/41 (CRLF), `ops-list-screen.smoke.js` 19/11, `op-form-helpers.smoke.js` 33/3, `op-writes.smoke.js` 48/1 (stale index.html regexes over untouched files), `documents-ingestor.test.js` 2, `g14-c-bridge-smoke.test.js` 15.
- **Remote verification required (not performed — Supabase prohibited for the local agent):** apply + verify `db/52` in staging `ucrjtfswnfdlxwtmxnoo` (column, FK, index, evolved writer signature/grants, restoration RPC semantics, idempotent replay, optimistic concurrency, fail-closed restore of invalidated targets) and authenticated admin render of the link-admin modal (history, correct, unlink, restore, stale/conflict feedback). No new remote query shape beyond the additive history read.
- **Access:** no push; no production; no Supabase; no applied migration; no network. `db/52` versioned and NOT applied.
- **Commit:** single local technical commit including this closeout (resolve final HEAD with `git rev-parse HEAD` after commit).
- **Residual risk:** staging unverified — schema/RPC/idempotency/compatibility must be applied and verified in `ucrjtfswnfdlxwtmxnoo` before acceptance; the client controller keeps command-id reuse in memory (durable convergence relies on the server RPC idempotency, not sessionStorage).
- **Next indicated (not authorized):** architect acceptance of `G28-B8`. No phase after `G28-B8` is authorized.

---

## 2026-07-14 — G28-B8 — Direct staging deployment, verification and closeout

- **Gate:** `STAGING FUNCTIONALLY VERIFIED / READY FOR ARCHITECT ACCEPTANCE`; not `CLOSED` or `ACCEPTED`. No phase after B8 is authorized.
- **Operator / mode:** Hermes / `gpt-5.6-terra`, direct Supabase MCP; no delegation. Initial technical HEAD `f985f8b857f83d977936eae47ea830a5cb6ba4c3`, branch `work/g28-document-qualification`, clean worktree; production not accessed and no push.
- **Target/apply:** `https://ucrjtfswnfdlxwtmxnoo.supabase.co` proved the staging ref. Preflight found migration 52 absent, the five-argument writer active and the B6 wrapper as textual caller. The exact repository db/52 file was applied once; registry `20260715024449 / 52_document_link_correction_revocation_restoration`.
- **Proof:** UUID column, RESTRICT self-FK, partial index, evolved defaulted writer, restore RPC, SECURITY DEFINER/search_path/grants and unchanged B5 hashes were verified. Authenticated fixture `G28-B8-VERIFY` passed 18/18: correction/unlink/history, no-change/stale/replay/conflict, restoration/provenance/revalidation, audit/ownership and B6 wrapper compatibility. RPCs produced no operational side effects; all nine marker-residue categories are zero after cleanup.
- **Local:** B8 focused suite 79/79; five `node --check` and `git diff --check` passed before documentation.
- **Modal smoke:** `LIVE_B8_MODAL_SMOKE_BLOCKED_BY_TOOLING` — browser has neither the staging admin application nor an authenticated admin session; no auth was weakened.
- **Corrections:** none; staging did not prove a defect from the technical commit.
- **Residual / next action:** only architect acceptance of B8; G28-C/D and later phases remain deferred/not authorized.

---

## 2026-07-15 — G28-C — Direct staging validation closeout

- **Operator / target:** Hermes direct, staging `ucrjtfswnfdlxwtmxnoo`; no delegation, production access or push.
- **Harness / result:** harness-only fixture-order and assertion-variable defects were corrected; integrated database/canonical-projection matrix `16/16 PASS` covered technical evidence, decisions, B6 multi-OP linking, B8 correction/unlink/restoration/audit and canonical projections.
- **Proof / safety:** confirmed links derived only from `document_link_revisions` and `document_link_revision_ops`; Ingestor-owned candidate/event suggestion fields and Pedido/OP operational snapshots remained unchanged. No product, schema, RPC, migration or architecture defect was proven.
- **Cleanup / debt:** `G28-C-VERIFY` residue is zero in candidates, technical evidence, events, decisions, revisions, revision ops, pedidos, lotes, ops, clientes and fornecedores. `AUTHENTICATED_BROWSER_SMOKE_BLOCKED_BY_TOOLING`: no staging administrative application/session was available.
- **Gate:** `G28-C — READY FOR ARCHITECT ACCEPTANCE`, not closed or accepted. No later phase, including G28-D, is authorized.

---

## 2026-07-15 — G28-C — Architect acceptance recording

- **Decision:** `G28-C — CLOSED / ACCEPTED_WITH_NONBLOCKING_AUTHENTICATED_BROWSER_SMOKE_DEBT`.
- **Basis:** staging database/canonical projection matrix 16/16 PASS; no product, schema, RPC, migration, ownership or architectural defect; harness-only corrections; zero fixture residue; prior append-only ledger proof and canonical closeout commit `a7d7caa8984e56b44c0302bff5d578a8be5ff536`.
- **Residual / authority:** authenticated administrative browser smoke remains a non-blocking tooling debt. G28-D and later phases remain not authorized; no push and no production access.

---

## 2026-07-15 — G28-D — Release contract discovery and release-candidate preparation

- **Gate:** `RELEASE CONTRACT DISCOVERY COMPLETE / BLOCKED BY SPECIFIC MISSING DEPLOYMENT DEFINITION`; this is not acceptance, publication, or authorization of later phases.
- **Baseline / accepted lineage:** B8 technical `f985f8b857f83d977936eae47ea830a5cb6ba4c3`; B8 staging closeout `5c30c147601ac5b31e9fb09569cc057dee02de09`; C closeout `a7d7caa8984e56b44c0302bff5d578a8be5ff536`; C acceptance `d5ec09f803c2c64697ee3605b7d4ecfee168a66a`.
- **Discovery:** static root app has no build command. Historical repository text names GitHub Pages/main, but labels itself legacy; no current canonical publication mapping, exact push contract, production migration 51/52 state/apply procedure, rollback contract, or authenticated post-deploy smoke is defined in repository evidence.
- **Candidate:** `docs/releases/G28_D_RELEASE_CANDIDATE.md` records the source-backed fields, exact unknowns, migration prerequisites, local remote-ref relation, readiness checks and a deliberately empty publication-command contract.
- **Local checks:** selected B4–B8 document/link battery `901` pass / `0` fail; five B8 syntax checks and `git diff --check` passed. `services/documents-ingestor` combined `npm run build; npm test` timed out locally after 120 seconds without output; no dependency installation, network, production, Supabase access, push, tag, or publication occurred.
- **Blocker / next authority:** architect must define the current production provider/target/ref/command and authorize a production migration 51/52 verification/apply procedure before a publication plan can exist. Later phases remain unauthorized.

---

## 2026-07-15 — G28-STATE-RECONCILIATION-R1 — Canonical phase state reconciliation

- **Gate:** RECONCILIATION EXECUTED (docs-only; no code, SQL, migration, test, staging, production, push, remote)
- **Root cause:** documented canonical-state divergence. After G28-C architect acceptance and G28-D release-contract discovery, the master plan's CURRENT EXECUTION CHECKPOINT, phase matrix, PRÓXIMA AÇÃO section, AGENT_HANDOFF.md and PROJECT_STATE.md exhibited stale claims: checkpoint still described B7 as last accepted and B8 as active; matrix showed C as DEFERRED and D as DEFERRED; handoff cited B7 as last accepted and stated B8 acceptance pending; B8 classification was still READY FOR ARCHITECT ACCEPTANCE when it had been subsumed by C's gate.
- **Historical checkpoint:** `d5ec09f803c2c64697ee3605b7d4ecfee168a66a` (C acceptance).
- **Discovery HEAD:** `b27e79fdba1ed8fb8a6232d8e0b8ca4b37ac3a2c` (pre-reconciliation HEAD; worktree/index clean; no untracked).
- **Classification:** `MATERIAL_DIVERGENCE` — the canonical phase state was recorded differently across four authoritative documents.
- **B8 / C relationship:** B8 is `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C`. G28-C's staging validation matrix (16/16 PASS) explicitly validated and accepted the correction, revocation, restoration and audit capabilities that B8 implemented. B8 is not pending; its capabilities were incorporated into C's gate and architectural acceptance. No separate B8 acceptance was invented.
- **D discovery:** `RELEASE CONTRACT DISCOVERY COMPLETE / BLOCKED BY SPECIFIC MISSING DEPLOYMENT DEFINITION`. The release candidate `docs/releases/G28_D_RELEASE_CANDIDATE.md` records the source-backed discovery and the blocker list. No publication authorization is implied by the discovery state.
- **D publication:** `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED`. No publication, push, production access, tag, release or deploy is authorized.
- **Active functional phase:** `NONE`. G28-C is CLOSED; G28-D discovery is completed/blocked and does not constitute an active functional phase.
- **Files updated:**
  - `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` — renamed stale CURRENT EXECUTION CHECKPOINT to HISTORICAL EXECUTION CHECKPOINT — SUPERSEDED; updated B8/C/D matrix rows; rewrote PRÓXIMA AÇÃO — ESTADO ATUAL.
  - `PROJECT_STATE.md` — identified b27e79f as prior technical/documentary head; stated current reconciliation action G28-STATE-RECONCILIATION-R1; clarified no functional phase active and no next phase named.
  - `AGENT_HANDOFF.md` — fixed last accepted phase to G28-C; classified B8 as subsumed by C; added nine-path continuity list with retransmission sentence; removed stale B8-acceptance-pending claim.
  - `docs/ledgers/G28_LEDGER.md` — this entry (append-only).
- **No activity:** no code, SQL, migration, runtime, test, staging, production, Supabase, network, MCP, or push executed. No functional tests, no browser, no remote, no deployment, no tag.
- **Commit:** this closeout commit; resolve final HEAD with `git rev-parse HEAD` after commit. Do not invent future SHA.
- **Next indicated:** after this reconciliation is committed, a new read-only reconciliation of the general backlog (`PEDIDO_PRODUCTION_FLOW_BACKLOG.md` and other fronts) shall choose the next functional front. Publication is not the next action.

---

## G28-STATE-RECONCILIATION-R1 — Corrective documentary addendum

- **Gate:** CORRECTIVE ADDENDUM (docs-only; no code, SQL, migration, test, staging, production, push, remote)
- **Original R1 commit:** `271761c3de20427b2cc9059d5ff7cc3727545e6d` — `G28: reconcile canonical phase state`
- **Corrected textual defects in original R1:**
  1. **Active header (master plan):** replaced claim "G28-D is the active authorized phase" — corrected to "Nenhuma fase funcional está ativa", G28-C accepted, G28-D discovery/preparation completed/blocked, publication not started/not accepted/not authorized.
  2. **B7/B8 classification (master plan header):** B7 corrected from `IMPLEMENTED / TESTED (local)` to `CLOSED / ACCEPTED_WITH_NONBLOCKING_REMOTE_SMOKE_DEBT` (evidenced); B8 corrected from `STAGING FUNCTIONALLY VERIFIED / READY FOR ARCHITECT ACCEPTANCE` to `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C` with explanation that C's 16/16 gate accepted B8 capabilities and B8 is not pending.
  3. **G28-D commit reference (phase matrix):** corrected false reference "release candidate `d5ec09f`" to the actual discovery/preparation commit `b27e79fdba1ed8fb8a6232d8e0b8ca4b37ac3a2c`. D5 did not create the release candidate.
  4. **Independent-acceptance wording (PRÓXIMA AÇÃO):** removed claim that B8 "foi aceito" as if independent; listed B8 separately as `TECHNICALLY COMPLETED / ACCEPTANCE SUBSUMED BY G28-C` with explicit note that B8 has no independent acceptance.
  5. **PROJECT_STATE.md and AGENT_HANDOFF.md SHA recording:** recorded the already-created R1 commit SHA `271761c3de20427b2cc9059d5ff7cc3727545e6d`; removed forward-looking "resolve after commit" language for R1; instructed next chat to resolve current Git HEAD directly.
- **No technical state changed:** no code, tests, SQL, migration, runtime, staging, production, Supabase, network, MCP, or push was executed. This is strictly a documentary correction.
- **Corrective commit:** resolve final HEAD with `git rev-parse HEAD` after commit.

---
## 2026-07-15 — G28-STATE-RECONCILIATION-R1 — Superseded-checkpoint reference addendum

- **Gate:** CORRECTIVE ADDENDUM (docs-only; no code, SQL, migration, test, staging, production, push, remote)
- **Prior corrective commit:** `edaf0b4d36f24aa7b9490e51a42624cc70d45963` — `G28: correct canonical reconciliation state`
- **Cause:** the prior R1 corrective commit missed two live non-historical references to the renamed CURRENT EXECUTION CHECKPOINT in the master plan: (1) the P0 historical record line `Estado atual: ver CURRENT EXECUTION CHECKPOINT acima` still pointed to a superseded label as if current; (2) the `CRITÉRIO DE FECHAMENTO DO PLANO` section still asserted that historical cardinality/type/compatibility decisions remained listed in CURRENT EXECUTION CHECKPOINT. Additionally, the G28-D publication triple was incomplete at several summary points (`NOT STARTED / NOT AUTHORIZED` instead of `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED`).
- **Resulting canonical state:** zero occurrences of the token CURRENT EXECUTION CHECKPOINT remain in the live master plan. The historical checkpoint title `HISTORICAL EXECUTION CHECKPOINT — SUPERSEDED` is preserved. The G28-D publication triple is normalized to `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED` across the master plan, PROJECT_STATE.md and AGENT_HANDOFF.md. The prior corrective commit `edaf0b4d36f24aa7b9490e51a42624cc70d45963` is recorded in PROJECT_STATE.md and AGENT_HANDOFF.md. The ledger entry `G28-STATE-RECONCILIATION-R1 — Corrective documentary addendum` is not altered.
- **Files changed (this addendum):** `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/ledgers/G28_LEDGER.md` (this entry).
- **No code, tests, remotes, production, or push.**

---

## 2026-07-15 — Controlled Delete × Document Link History Guard — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED`. Technical commit `707a37bd1d2c4728ab2a17433b6441049bd88062` — `Guard controlled delete against document link history`.
- **Original defect:** the pre-existing Controlled Delete RPCs (`db/34`–`db/37`, `RAVATEX-TAPETES-PEDIDO-OP-CONTROLLED-DELETE-*`) attempted physical deletion of an OP still referenced by canonical, append-only document link history and failed with a raw foreign-key violation on `document_link_revision_ops_op_id_fkey`. The documentary history cannot be deleted merely to permit an unrelated physical delete.
- **Guard applied — `db/53_controlled_delete_document_link_guard.sql`:** renamed the four legacy RPCs from `db/37` to `*_pre53` and revoked `EXECUTE` on them for every role (anti-bypass); recreated the four public signatures (`diagnosticar_impacto_pedido`, `diagnosticar_impacto_op`, `remover_pedido`, `remover_op`) as `SECURITY DEFINER` wrappers that call the corresponding `*_pre53` diagnostic, enrich the JSON with `document_link_revision_ops` / `document_link_revisions` / `documentos_vinculados` counts, and block (`classification=blocked`, `ok=false`) before ever delegating to the destructive `*_pre53` logic when canonical documentary history exists. Never mutates `document_link_revisions`, `document_link_revision_ops`, or `op_numeros`.
- **ACL corrected — `db/54_controlled_delete_document_link_grants.sql`:** staging inspection after `db/53` found `anon_execute = true` on the four public RPCs (a live security defect, not present in the intended design). `db/54` is an additive grants-only correction: revokes `EXECUTE` from `PUBLIC`/`anon`, keeps `authenticated`. No function body, table, or cascade logic touched.
- **Cast corrected — `db/55_controlled_delete_document_link_policy_cast.sql`:** the first staging smoke on `db/53` failed with `could not determine polymorphic type because input has type unknown`, caused by `to_jsonb(<string literal>)` without an explicit cast on the guard's policy-message literal (the only untyped `to_jsonb` call among 16 in the file; all others already carry typed boolean/bigint arguments). `db/55` is a forward-only `DO` block that locates the untyped literal in the two live diagnostic functions via `pg_get_functiondef` + `position()`, and rewrites them in place via `EXECUTE replace(...)` to add `::TEXT`. No grants, cascade, or destructive logic touched.
- **Null-safe diagnostic corrected — `db/56_controlled_delete_document_link_diagnostics_null_safe.sql`:** staging smoke of an eligible (non-blocked) target revealed a second regression introduced by `db/53`: `jsonb_set(...)` is `STRICT`, and the wrappers' final `jsonb_set(..., '{reason}', to_jsonb(v_reason), TRUE)` collapsed the *entire* RPC return to raw SQL `NULL` whenever `v_reason` was `NULL` — which is every non-blocked classification (`safe`, `requires_confirmation`, `requires_cascade_confirmation`), because the inherited `db/37` diagnostic logic never sets `v_blocked=TRUE` on its own (blocking by entrega/expedição was replaced by cascade in that phase). `db/56` redefines the same two diagnostic wrappers, changing only `to_jsonb(v_reason)` to `COALESCE(to_jsonb(v_reason), 'null'::jsonb)` in the final return, restoring the original `jsonb_build_object`-equivalent null-safe contract (`{"reason": null, ...}` instead of a collapsed `NULL`). No other line, grant, or function redefined.
- **`db/53` provenance note (pre-closeout integrity pass):** before the technical commit, `db/53`'s local (uncommitted) source was found to contain the post-`db/55` cast (`::TEXT`) already baked into its two policy-literal `to_jsonb()` calls, diverging from the SQL actually applied to staging (which lacked the cast, per `db/55`'s own precondition check against the live function definition). This was a retrospective, pre-commit normalization of an untracked file and broke replay-safety of a fresh `53→54→55→56` install (`db/55`'s precondition would raise an exception). Resolved before commit by restoring `db/53` to the two-literal, no-cast form actually applied originally, keeping `db/55` as the sole forward-only cast fix. No migration file was rewritten after being committed; `db/53` had never been committed at any point in this history.
- **Staging functional validation (synthetic fixtures, reserved numbers/`ano=2099`, zero residue after cleanup, `op_numeros` unchanged throughout):**
  - **Case A1 — eligible OP with a real dependency, no documentary history:** `diagnosticar_impacto_op` returned a non-null object (`blocked=false`, `classification=requires_confirmation`, `reason` JSON `null`); `remover_op(id, 'EXCLUIR')` returned `ok=true` and deleted the OP and its dependent `op_itens` row.
  - **Case A2 — eligible Pedido with a real dependency, no documentary history:** `diagnosticar_impacto_pedido` returned a non-null object with the same classification; `remover_pedido(id, 'EXCLUIR')` returned `ok=true` and deleted the Pedido, its lote, and its OP.
  - **Case B — Pedido/OP with canonical documentary history (`document_link_revisions` active revision + `document_link_revision_ops`):** both diagnostics returned `blocked=true`, `classification=blocked`, `documentary_history_blocker=true`; both `remover_op` and `remover_pedido` (called with `'EXCLUIR TUDO'`) returned a controlled block (`ok=false`, `blocked=true`) with no foreign-key exception and no partial mutation; Pedido, OP, `document_candidates`, the active `document_link_revisions` row (`active=true`, unchanged `version`/`revoked_at`), and `document_link_revision_ops` all persisted unchanged.
  - All synthetic fixtures across both smoke rounds were removed by targeted cleanup; a final residue check confirmed zero remaining fixture rows and an unchanged `op_numeros` (`latex/2026`, `tecelagem/2026`) relative to the value recorded before any fixture was created.
- **ACL verified live in catalog (post-`db/56`, unchanged from post-`db/54`):** the four public RPCs — `PUBLIC` and `anon` without `EXECUTE`, `authenticated` with `EXECUTE`. The four `*_pre53` functions — `PUBLIC`, `anon`, and `authenticated` all without `EXECUTE` (owner/`postgres` only).
- **Local test gates (final, pre- and post-commit, identical results):** `node --check js/delete-helpers.js` PASS; `node --test tests/controlled-delete.smoke.js` **53/53** (includes 6 new regression tests added for `db/56`: file existence, both diagnostics redefined, null-safe `COALESCE` construction present, vulnerable unguarded pattern absent, `remover_op`/`remover_pedido`/`*_pre53`/grants not redefined, no function beyond the two diagnostics touched); `node --test tests/document-canonical-links-contract.test.js` **21/21**; `git diff --check` PASS.
- **Technical commit:** `707a37bd1d2c4728ab2a17433b6441049bd88062` — `Guard controlled delete against document link history`. Contains exactly `js/delete-helpers.js` (M), `tests/controlled-delete.smoke.js` (M), `db/53_controlled_delete_document_link_guard.sql` (A), `db/54_controlled_delete_document_link_grants.sql` (A), `db/55_controlled_delete_document_link_policy_cast.sql` (A), `db/56_controlled_delete_document_link_diagnostics_null_safe.sql` (A). No documentation file included in the technical commit.
- **Documental closeout:** this entry, together with `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, and `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (D-DEL10–D-DEL13).
- **Not claimed by this closeout:** no global Controle de Tapetes closure; no publication; no production readiness; G28-D remains not accepted; the general production backlog remains open; no later phase is auto-authorized. Production (`bhgifjrfagkzubpyqpew`) was not accessed; no push was executed.
- **Known pre-existing documentation gap (not created by, and not resolved by, this closeout):** `db/37_controlled_delete_expedicao_cascade.sql` (Expedição Cascade) was never given its own `D-DEL` decision-table entry in `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`, nor an `## Atualizacao` section in `PEDIDO_OP_SCHEMA_CONTRACT.md` / `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (both stop at `db/36` / FK Order Fix E); `db/34`–`db/37` were also never indexed in `docs/DOCUMENTATION_INDEX.md` §4. This closeout continues the `D-DEL` sequence from `D-DEL10` for its own migrations only and does not backfill the missing `db/37` entry.

---

## 2026-07-15 — Admin/Pedido Static Residue — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED`. Technical commit `7978e0a4fe021467cc23e0aeed63ac87ba738f1b` — `Fix admin order completion button state`.
- **Origin:** identified during the read-only backlog reconciliation of 2026-07-15 (`docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` §9.6/§9.7) as the sole remaining open item of the Admin/Pedido/Production backlog: static residue `disabled: ready ? null : 'disabled'` in `js/screens/expedicao-admin.js:405`.
- **Root cause confirmed:** the shared helper `el()` (`js/ui.js:10-22`) calls `setAttribute(k, v)` for every attribute in the passed object without skipping `null` (unlike its child-node handling, which does skip `null`/`false`). A `null` value is stringified by the DOM into the literal attribute `disabled="null"` — a present boolean attribute — disabling the "Concluir pedido" button even when `ready === true`.
- **Decision not to alter the shared helper:** this was the only call site across the entire repository using the null-as-omission convention for an `el()` attribute (confirmed by `git grep`); modifying `el()` would have a broader, unassessed blast radius across every screen using the helper. The fix was scoped exclusively to the call site.
- **Localized patch:** `js/screens/expedicao-admin.js`, function `buildConclusao` — `buttonAttrs` is now built as a local variable before the `return`; the `disabled` key is added to the object only when `!ready` (`buttonAttrs.disabled = 'disabled'`), and is never assigned `null`. `onclick`, button text, styles and structure are unchanged; the guard `if (!ready) return;` inside `onclick` is preserved.
- **Regression test:** `tests/expedicao-flow.smoke.js` gained one new static test asserting (1) the original `disabled: ready ? null : 'disabled'` pattern must not reappear, (2) the inverted equivalent (`disabled: !ready ? 'disabled' : null`) must not appear, and (3) the correct conditional pattern (`if (!ready) { buttonAttrs.disabled = 'disabled'; }`) must be present.
- **Local validation (LF, exit 0):** `node --check js/screens/expedicao-admin.js` PASS; `tests/expedicao-flow.smoke.js` **9/9**; `tests/expedicao-partial-flow.smoke.js` **12/12** (no regression); `git diff --check` PASS.
- **Manifesto:** exactly `js/screens/expedicao-admin.js` (M) and `tests/expedicao-flow.smoke.js` (M). `js/ui.js` untouched. No documentation file in the technical commit.
- **Access:** no staging; no production (`bhgifjrfagkzubpyqpew` not accessed); no push.
- **Documental closeout:** this entry, together with `PROJECT_STATE.md`, `AGENT_HANDOFF.md` and `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`.
- **Not claimed by this closeout:** no global Controle de Tapetes closure; no publication; no production readiness; G28-D remains `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED`; `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A`, `DELETE-PROD-GUARD-A`, `DELETE-AUDIT-LOG-A`, `G28-CAMADA-2`, `G28-CAMADA-3` and `G28-CAMADA-4` remain unchanged/deferred.
- **Next authorizable action:** `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A` — `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` / `NOT STARTED`. This entry does not authorize its execution.

---

## 2026-07-15 — Cliente Order Summary Read Model — Staging Validation — CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBTS

- **Phase:** `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A`.
- **Gate:** `CLOSED / ACCEPTED_WITH_NONBLOCKING_DEBTS`. No technical commit — the phase changed no files (verification-only). This entry is the documental closeout.
- **Closeout sequence:** `db/30` found already deployed → no drift confirmed → verification-only mode → real RPC contract validated → ACL catalog inspected → anonymous behavior empirically fail-closed → broader grants retained as debt → browser smoke blocked → no remediation performed → documentary closeout.
- **Object state (staging `ucrjtfswnfdlxwtmxnoo`, PostgreSQL 17.6):** `public.cliente_pedido_summary(uuid)` already present — signature `cliente_pedido_summary(p_pedido_id uuid)`, `RETURNS jsonb`, `SECURITY DEFINER`, `STABLE`, `search_path=public`, owner `postgres`, language `plpgsql`. `pg_get_functiondef` body is byte-for-byte equivalent to `db/30_cliente_pedido_summary_readmodel.sql` (only CRLF vs LF line-endings differ) — **no schema drift**. All 16 dependency tables referenced by the function exist.
- **Migration provenance:** `db/30` is **not recorded** in `supabase_migrations.schema_migrations` (the tracked history begins at `document_technical_evidences` / `document_decision_command` / `52`…`56`; `db/30` predates this tracking). The deployed object exists without a migration-history row; provenance kept explicit.
- **ACL inspected live (divergence from canonical intent):** `EXECUTE` granted to `PUBLIC`, `anon`, `authenticated`, and `service_role`. `db/30` (and decision `D-COS02`) intend **only** `authenticated`. The broader grants are the Supabase default-privileges artifact — same class as the `db/54` finding. Not silently normalized: retained as a governance/hygiene debt.
- **Empirical behavior (read-only; each RPC call ran inside `BEGIN … ROLLBACK`; the function is `STABLE`/read-only; zero data mutation):**
  - T1 — authenticated test client (`usuarios.tipo='cliente'`, `cliente_id=3`) on its own Pedido (`numero 33`, `rascunho`): `ok=true`, full DTO; `itens[1]`, other collections `[]` via `COALESCE`.
  - T2 — `anon` role on the same Pedido: `ok=false`, `"Pedido nao encontrado ou sem permissao"` — **fail-closed**: `anon` can execute but receives no customer data → **no confirmed data exposure**.
  - T3 — client `cliente_id=3` on a foreign Pedido (`cliente_id=22`): `ok=false` — cross-tenant denial.
  - T4 — admin (`usuarios.tipo='admin'`) on the foreign Pedido: `ok=true`, complete key set (admin path).
- **Frontend contract match (`js/screens/cliente-pedido-detail.js` → `supa.rpc('cliente_pedido_summary', { p_pedido_id })`, ~line 180):** every consumed field present with correct type — top-level `ok/pedido/itens/parciais/entregas/pendencias/chain_state/timeline/status/status_label/progresso_percentual`; `pedido.{numero,status,status_cliente_visual,status_cliente_atualizado_em,atualizado_em,prazo_entrega,tipo_recebimento,observacao}`; `chain_state.{isOperationalOverride,displayStatus}`; `entregas[]{descricao,data,quantidade}`; `timeline[]{data,titulo,descricao,status}`; `itens[]{modelo,largura,cor_1,cor_2,metros}`. Null fields (`tipo_recebimento`, `observacao`) and empty collections handled gracefully by the consumer; the `loadingError` branches are not on the happy path — **no silent-fallback dependency**.
- **Portal validation level:** `STATIC_CONTRACT_WITH_REAL_RPC_PAYLOAD` (real RPC payload compared field-by-field against the consumer). Authenticated browser smoke not executed — no test-client password available; recorded as a nonblocking debt (real RPC + ACL behavior + payload contract all validated).
- **Local gates:** `node --check js/screens/cliente-pedido-detail.js` PASS; `git diff --check` clean; `git status --short` empty; HEAD unchanged at `33a8034…` throughout the technical verification.
- **Access & tooling:** Supabase MCP **not exposed in the session** (no `.mcp.json`, no installed connector); Supabase CLI not installed. The architect-authorized **direct PostgreSQL fallback** was used for verification only; the temporary out-of-repo tooling (pg driver + guarded runner + credentials file) was removed afterward; no secret was echoed to any command, log, report, or Git. Production (`bhgifjrfagkzubpyqpew`) not accessed; the runner refuses the production ref internally.
- **No changes during verification:** no schema mutation, no data mutation, no fixtures, no code/SQL change, no new migration, no ACL remediation, no commit, no push.
- **Nonblocking debts:**
  1. `ACL_GRANTS_BROADER_THAN_CANONICAL_CONTRACT` — `PUBLIC` and `anon` retain `EXECUTE`; empirical `anon` behavior is fail-closed; no confirmed customer-data exposure; remediation requires a separate authorized grants-only migration.
  2. `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` — deployed object exists, no drift; environment/tooling provenance kept explicit.
  3. `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED` — blocked by absence of a test-client password; real RPC and frontend contract verification passed.
- **ACL remediation candidate (recorded, not authorized, not started):** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` — `ARCHITECT DECISION REQUIRED`. Intended scope, if later authorized: a grants-only forward migration analogous to `db/54` (`REVOKE EXECUTE … FROM PUBLIC, anon`, preserving canonical `authenticated`). Not created in this closeout.
- **Documental closeout:** this entry, together with `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, and (materially required) `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (§9 next-step + decision `D-COS06`).
- **Not claimed by this closeout:** no global Controle de Tapetes closure; no publication; no production readiness; G28-D remains `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED`; the general production backlog remains open; `DELETE-PROD-GUARD-A`, `DELETE-AUDIT-LOG-A`, `G28-CAMADA-2`, `G28-CAMADA-3`, `G28-CAMADA-4` unchanged/deferred.
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION` — no unequivocal single next action exists; the ACL remediation candidate must not be auto-selected.

---

## 2026-07-15 — Docs Canonical Consistency Backfill A — CLOSED / ACCEPTED

- **Phase:** `DOCS-CANONICAL-CONSISTENCY-BACKFILL-A`.
- **Gate:** `CLOSED / ACCEPTED`. Documentation-only — no code, test, SQL, migration, staging, or production access. Commit: `Backfill canonical migration documentation`.
- **Sequence:** full canonical backlog reconciliation (prior read-only pass, 2026-07-15) → documentation gaps confirmed (db/37 missing `D-DEL` entry; db/34–37 and db/53–56 missing from `docs/DOCUMENTATION_INDEX.md` §4; stale `db/30` index status) → `db/37_controlled_delete_expedicao_cascade.sql` migration and the accepted Controlled Delete contract inspected → missing `D-DEL` decision documented → `db/34`–`db/37` index entries added → `db/53`–`db/56` index entries added → `db/30` stale status corrected → technical and environment debts preserved as open → documentation backfill closed.
- **Gap 1 — db/37 D-DEL entry:** `db/37_controlled_delete_expedicao_cascade.sql` (fase `RAVATEX-TAPETES-PEDIDO-OP-CONTROLLED-DELETE-EXPEDICAO-CASCADE-E2`) was applied and validated in staging alongside `db/34`–`db/36` but had never received its own `D-DEL` decision row — a gap explicitly flagged in `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` next to decisions `D-DEL10`–`D-DEL13` ("lacuna pre-existente, fora do escopo"). Derived directly from the real `db/37` file (expedição stops being an unconditional blocker and joins the `EXCLUIR TUDO` cascade — `expedicao_movimento_itens` → `expedicao_movimentos` → `expedicao_itens` → `expedicoes` removed before OPs/entregas/lotes/pedido) and from the `db/34`–`db/36` sequence it supersedes. Added as `D-DEL14` in `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §10, new subsection "Fase Controlled Delete — Expedição Cascade (db/37)", numbered to continue from the existing `D-DEL13` without colliding with the decisions already registered in the plano.
- **Gap 2 — db/34–37 and db/53–56 index coverage:** 8 rows added to `docs/DOCUMENTATION_INDEX.md` §4, each description derived from reading the actual migration file (not inferred from numbering alone): `db/34` (diagnostics + removal RPCs, drops legacy numbered-OP trigger), `db/35` (adds cascade with `EXCLUIR TUDO`), `db/36` (fixes FK order + DELETE guard return value), `db/37` (expedição joins the cascade), `db/53` (document-link guard wrappers, renames legacy functions to `*_pre53`), `db/54` (emergency grants fix), `db/55` (polymorphic cast fix), `db/56` (`jsonb_set` STRICT null-collapse fix). All 8 recorded as applied/validated staging-only (`ucrjtfswnfdlxwtmxnoo`); production `bhgifjrfagkzubpyqpew` untouched by all of them.
- **Gap 3 — db/30 stale index status:** `docs/DOCUMENTATION_INDEX.md` §4 still classified `db/30_cliente_pedido_summary_readmodel.sql` as "Versionado no repo, ainda nao aplicado" — stale since the `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A` closeout (2026-07-15, same day, earlier in this ledger) found it already deployed. Corrected to the precise accepted state: deployed and functionally verified in staging, no schema drift confirmed, not recorded in `supabase_migrations.schema_migrations`, live ACL broader than the `authenticated`-only canonical intent (`D-COS02`), anonymous empirical behavior fail-closed, no confirmed customer-data exposure, ACL remediation (`CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1`) remains a separate architect decision, authenticated browser smoke remains a nonblocking debt. Neither the ACL debt nor the migration-history divergence is claimed fixed by this entry.
- **No history rewritten:** no prior ledger entry, `PROJECT_STATE.md` block, or plan section was edited to make the previous omission disappear; the gap remains visible in `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` exactly as recorded at the time of the Controlled Delete Document Link Guard closeout, with the correction appended as new content.
- **Conditional files read, not changed:** `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (contains the D-DEL10–D-DEL13 table and the db/37 gap note — historically accurate, not a stale current-state claim, so left untouched); `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` (references db/34–db/37 only in the already-accurate Controlled Delete Document Link Guard summary); `docs/governance/DOCUMENTATION_MODEL.md` (no db/NN or D-DEL references at all). No materially incorrect current-state statement found in any of the three.
- **Files changed:** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, `docs/DOCUMENTATION_INDEX.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger. No source code, test, SQL, migration, environment, or runtime file touched.
- **Preserved open/unresolved (not closed by this entry):** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` (`ARCHITECT DECISION REQUIRED`); `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; authenticated-browser-smoke debts (G28-C/D/B7/Portal Cliente); `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`; `G28-D` publication; production application of the staging-only migration stack (`db/12`, `db/21`, `db/30`, `db/49`–`db/56`); `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-2/3/4`.
- **Access:** no Supabase MCP, no staging connection, no production access (`bhgifjrfagkzubpyqpew` not accessed), no database connection of any kind this phase. **Push:** not executed.
- **Local gates:** `git diff --check` clean; worktree clean, staging empty, zero untracked before and after.
- **Next authorizable action:** `ARCHITECT DECISION REQUIRED` — `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` remains the sole material gate. This documentation backfill does not authorize any subsequent technical phase.

---

## 2026-07-15 — Staging-Only Execution Boundary A — ARCHITECT DECISION RECORDED

- **Phase:** `STAGING-ONLY-EXECUTION-BOUNDARY-A`.
- **Gate:** `ARCHITECT DECISION RECORDED — DOCUMENTATION ONLY`. No code, test, SQL, migration, Supabase/MCP, staging, production, or Vercel access. Commit: `Record staging-only execution boundary`.
- **Sequence:** full backlog reconciliation completed (prior read-only pass, 2026-07-15) → deployment mapping identified as the prior material gate (`DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`, recorded across `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, and the master plan) → architect explicitly selected staging-only continuation (binding decision: current operational environment is Supabase staging `ucrjtfswnfdlxwtmxnoo` exclusively) → protected/production environment (`bhgifjrfagkzubpyqpew`) removed from current scope → production migration planning deferred until global backlog completion → G28-D reclassified as deferred and nonblocking for staging (publication `NOT STARTED / NOT ACCEPTED / NOT AUTHORIZED`, unchanged, but no longer the current blocker) → Vercel retained only as a future publication candidate, not selected, not a decision, not an authorization → staging backlog allowed to continue → ACL grants-only staging candidate (`CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1`) becomes `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` → no technical phase started by this entry.
- **Reclassification recorded:** `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` no longer recorded as the current material blocker or as the next required architect decision. Reclassified as `DEFERRED BY ARCHITECT UNTIL GLOBAL BACKLOG COMPLETION / NOT A CURRENT STAGING BLOCKER / NOT STARTED`. This entry does not claim the deployment procedure has been discovered, defined, tested, or completed — it remains exactly as undiscovered as before; only its blocking status changed, by explicit architect choice, not by technical progress.
- **G28-D:** discovery status unchanged — `RELEASE CONTRACT DISCOVERY COMPLETE`, evidence preserved verbatim in `docs/releases/G28_D_RELEASE_CANDIDATE.md` (status line updated to reference this deferral; all discovery fields, unknowns, and evidence untouched). Publication reclassified from `BLOCKED BY SPECIFIC MISSING DEPLOYMENT DEFINITION` to `DEFERRED BY ARCHITECT / NOT A CURRENT BLOCKER / NOT AUTHORIZED`.
- **Vercel:** recorded as a future publication-provider candidate only. No selection, no decision, no authorization, no access performed.
- **No history rewritten:** no prior ledger entry, `PROJECT_STATE.md` closeout block, or plan section describing the earlier "blocked" characterization was deleted or altered; this entry and the corresponding append/update sections in `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, and `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` record the reclassification as new, dated content layered on top of the prior record, with an explicit note that the new state prevails going forward.
- **Conditional files read, not changed:** `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (contains historical `D-DEL` decisions and its own `OPEN_ARCHITECT_DECISIONS`/G28-D references were already reconciled in the prior `DOCS-CANONICAL-CONSISTENCY-BACKFILL-A` pass and are not the live-state owner for this cross-cutting environment decision — `PROJECT_STATE.md` is; no materially stale statement requiring edit here beyond what governance assigns to `PROJECT_STATE.md`); `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (schema/RPC contract — no deployment-mapping or G28-D claims present); `docs/DOCUMENTATION_INDEX.md` (documentation arbiter — no deployment-mapping or G28-D current-state claims present, index rows already accurate as of the prior backfill); `docs/governance/DOCUMENTATION_MODEL.md` (governance rules only — no db/NN, D-DEL, or deployment-mapping references at all). No materially incorrect current-state statement found requiring edits to these four beyond the mandatory files already updated.
- **Files changed:** `PROJECT_STATE.md` (new "Decisão de Arquiteto — Fronteira de Execução Staging-Only" section + `OPEN_ARCHITECT_DECISIONS` line update), `AGENT_HANDOFF.md` (continuity summary update + new closeout section), `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` (header fields, G28-D matrix row, closure criterion, next-action section), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (append/update section), `docs/releases/G28_D_RELEASE_CANDIDATE.md` (status line only, all discovery evidence preserved), this ledger. No source code, test, SQL, migration, environment, or runtime file touched.
- **Preserved open/unresolved (not closed by this entry):** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` — now explicitly `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` but **not started, not executed by this entry**; `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; authenticated-browser-smoke debts (G28-C/D/B7/Portal Cliente); production application of the staging-only migration stack (`db/12`, `db/21`, `db/30`, `db/49`–`db/56`); `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-2/3/4`; the deployment-mapping/production-migration-procedure definition itself (still undefined — only its blocking status changed).
- **Access:** no Supabase MCP, no staging connection, no protected/production project access (`bhgifjrfagkzubpyqpew` not accessed), no database connection of any kind, no Vercel access. **Push:** not executed.
- **Local gates:** `git diff --check` clean; worktree clean, staging empty, zero untracked before and after.
- **Next authorizable action:** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` — `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` / `NOT STARTED` / staging-only. This entry does not execute or authorize that phase; it only records readiness per the architect's explicit instruction.

---

## 2026-07-15 — Cliente Order Summary ACL Grants R1 — CLOSED / ACCEPTED (technical + documentary)

- **Phase:** `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1`.
- **Gate:** `CLOSED / ACCEPTED`. Technical commit `82f5ba70ace2e74c51b7c0295d1ecf8e319954be` — `Restrict client order summary RPC grants` (`db/57_cliente_pedido_summary_acl_grants.sql`, `tests/cliente-pedido-summary-acl-grants.smoke.js`). Documentary closeout commit: this entry (`Close client order summary RPC grant hardening`).
- **Sequence:** broader staging ACL confirmed (prior closeout `CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A`, `D-COS06`) → architect authorized grants-only remediation (`CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` order) → `db/57_cliente_pedido_summary_acl_grants.sql` created (grants-only, forward-only, idempotent, exact-signature) → Supabase MCP exposed and connected to authorized staging (confirmed via migration-registry and table fingerprint against `ucrjtfswnfdlxwtmxnoo`, distinct from the protected/legacy project) → migration applied through `mcp__supabase__apply_migration` (tracked operation, exactly once) → migration registry confirmed (`20260715190627 / 57_cliente_pedido_summary_acl_grants` present; `db/30` still absent, not fabricated) → `PUBLIC`/`anon`/`service_role` `EXECUTE` revoked → `authenticated` `EXECUTE` preserved → function definition and contract unchanged (identical `pg_get_functiondef` md5 hash before/after: `fd428d6f3ae7c8c9a935a1f774903de1`) → empirical role matrix passed (anon `42501` at ACL boundary; authenticated owner `ok=true`; authenticated cross-tenant `ok=false` fail-closed; authenticated admin `ok=true`; service_role direct `SET ROLE` `42501`, `rolbypassrls` distinguished from function `EXECUTE`) → tests 21/21 passed → no data mutation (all empirical checks in `BEGIN … ROLLBACK`, no fixtures created, existing pedidos 33/34 and usuarios reused) → technical commit → documentary closeout (this entry).
- **Preflight consumer search:** full-repository grep for `cliente_pedido_summary` found 12 files — 9 documentation/ledger references, 3 test files (static contract), and exactly one runtime consumer: `js/screens/cliente-pedido-detail.js` via `window.supa.rpc('cliente_pedido_summary', ...)` on the standard authenticated frontend path. Targeted searches of `supabase/`, `scripts/`, `services/` found zero Edge Function or server-side/`service_role` consumers. No consumer required `service_role`; the preflight therefore authorized including `service_role` in the `REVOKE` list (not merely preserving whatever the ACL happened to already grant).
- **Final ACL (verified live via `pg_proc.proacl`):** before — `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}` (`PUBLIC`, `anon`, `authenticated`, `service_role` all granted). After — `{postgres=X/postgres,authenticated=X/postgres}` (`PUBLIC` false, `anon` false, `authenticated` true, `service_role` false; owner `postgres` retains inherent privilege).
- **Function contract (verified unchanged):** name `cliente_pedido_summary`, signature `(uuid)`, return `jsonb`, `SECURITY DEFINER` true, `STABLE`, `search_path=public`, owner `postgres`, body byte-identical (md5 hash and byte length identical before/after).
- **Anonymous behavior upgrade recorded explicitly:** prior to this migration, `anon` executed the function and received a business-layer fail-closed JSON (`{"ok":false,"erro":"Pedido nao encontrado ou sem permissao"}`). After this migration, `anon` is rejected at the function ACL boundary (`ERROR 42501: permission denied for function cliente_pedido_summary`) before the function body runs at all. This entry does not describe the current behavior as merely "fail-closed after execution" — it is ACL-boundary denial.
- **service_role distinction:** `service_role` has `rolbypassrls=true` (a Postgres role attribute that bypasses row-level security on tables). This is a separate mechanism from function `EXECUTE` privilege and does not restore access to this function; direct `SET ROLE service_role` invocation correctly receives `42501` after this migration. The migration was not altered to change this result — it is the intended, correct outcome.
- **Frontend:** `js/screens/cliente-pedido-detail.js` reconfirmed as the sole runtime consumer, unchanged; no frontend defect found; no frontend file modified.
- **Debts closed:** `ACL_GRANTS_BROADER_THAN_CANONICAL_CONTRACT` (Portal Cliente closeout debt #1) — **RESOLVED IN STAGING**.
- **Debts preserved as open (not closed by this phase):** `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY` (no migration-history entry fabricated or repaired for `db/30`); `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`; production application of the staging-only migration stack (now including `db/57`); `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` (deferred per `STAGING-ONLY-EXECUTION-BOUNDARY-A`); `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-2/3/4`; `db/57` is classified as applied only in staging (`ucrjtfswnfdlxwtmxnoo`) — not production.
- **No history rewritten:** the earlier ledger entry recording the ACL debt (`CLIENTE-ORDER-SUMMARY-READMODEL-APPLY-STAGING-A`, 2026-07-15, above) was not edited; this entry and the corresponding append/update sections in `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (`D-COS07`), and `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` record the closure as new, dated content layered on top of the prior record.
- **Conditional files decisions:** `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` — **CHANGED**: its live-state header ("Decisões de arquiteto em aberto") and its "PRÓXIMA AÇÃO — ESTADO ATUAL" section both still described `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` as `READY FOR EXPLICIT ARCHITECT AUTHORIZATION` — a materially stale current-state claim (not a dated historical note), corrected to reflect `CLOSED / ACCEPTED` and `NEXT_AUTHORIZABLE_ACTION: NONE`. `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` — **NOT CHANGED**: its one `CLIENTE-ORDER-SUMMARY-READMODEL-ACL-GRANTS-R1` mention sits inside the dated, historical `## Atualizacao 2026-07-15 - Docs Canonical Consistency Backfill A` section, accurately describing that backfill's scope at the time it was written — not a current-state claim. `docs/governance/DOCUMENTATION_MODEL.md` — **NOT CHANGED**: no `cliente_pedido_summary`, `db/NN`, or ACL references of any kind. `docs/releases/G28_D_RELEASE_CANDIDATE.md` — **NOT CHANGED**: G28-D publication discovery, unrelated to this Portal Cliente ACL phase; no stale statement found.
- **Files changed:** `PROJECT_STATE.md` (new "Portal Cliente — ACL Grants Hardening" section + staging-only decision block's next-candidate field updated), `AGENT_HANDOFF.md` (continuity summary update + new closeout section), `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (`D-COS07` added, §9 next-step updated, `D-COS06` left unedited), `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (append/update closeout section), `docs/DOCUMENTATION_INDEX.md` (`db/57` row added, `db/30` row ACL statement corrected), `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` (conditional file, two stale current-state lines corrected — see above), this ledger. No source code, test, SQL, migration, environment, or runtime file touched by this documentary pass (the technical files were already committed in `82f5ba7`).
- **Access:** no Supabase/MCP/staging/production/Vercel access during this documentary pass (all staging access occurred in the prior technical phase, commit `82f5ba7`). **Push:** not executed.
- **Local gates:** `git diff --check` clean; worktree clean, staging empty, zero untracked before and after.
- **Next authorizable action:** `NEXT_AUTHORIZABLE_ACTION: NONE`. `ARCHITECT_DECISION_REQUIRED:` explicit reconciliation of the remaining staging backlog (candidates include, but this entry does not select: production deployment, G28-D, Vercel, `db/30` migration-history repair, authenticated browser smoke, Controlled Delete production guard — none auto-selected).

---

## 2026-07-15 — DOCS-PEDIDO-OP-LEGACY-PLAN-STATUS-CONSISTENCY-R1 — Reconcile legacy Pedido↔OP plan phase statuses

- **Gate:** `CLOSED / ACCEPTED`. Docs-only; no code, test, SQL, migration, runtime, Supabase, MCP, staging, protected/production project, Vercel, network, or push. Documentary commit `Reconcile legacy Pedido OP plan phase statuses` (resolve final HEAD with `git rev-parse HEAD` after commit).
- **Sequence:** prior read-only backlog reconciliation → materially stale current-state rows found in two legacy plans (`docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` §9 "Fases futuras — sequência atualizada"; `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` §5 "Fases futuras sugeridas") → current authorities compared → D/E/F confirmed delivered → G/H/I confirmed superseded by the G28 canonical document pipeline → J confirmed future and unsequenced → the two plan representations corrected → no code/SQL/migration/environment access → documentary commit → Git final verification.
- **Root cause:** both legacy plans still represented Fases D–J as currently pending (`Pendente` in the schema-contract §9 status column; blank/absent status cells in the movement-plan §5 table), contradicting the current-state authorities that show the production flow operational and the `documentos_operacionais`-based document design superseded by the accepted G28 canonical link pipeline. Classification: `MATERIAL_DIVERGENCE` between two legacy planning tables and the current-state authorities. These were current-state planning rows, not dated historical records.
- **D/E/F — delivered through accepted production-flow work:**
  - **D** (OPs vinculadas no Pedido Detail Admin): the Pedido Detail lists linked OPs with status/progress/link — `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` §1.2, §9.4 (§2 item H resolved).
  - **E** (stepper/preview produtivo): stepper/preview with real OP-derived progress via `derivePedidoChainState` — backlog §2 item F resolved (§9.4), §9.7 hub R2 closed.
  - **F** (operação canônica de movimentação): the Pedido reuses the OP canonical operations (`salvarEntregaCima`, `liberar_expedicao_latex_parcial`, `registrar_entrega_expedicao`, `registrarRecebimentoOrdemFio`) with no parallel write — backlog §1.1, §9.5.
  - Classified `Entregue via fluxo produtivo aceito` (delivered), not `CLOSED / ACCEPTED` under the legacy phase name — no per-legacy-phase formal acceptance was invented.
- **G/H/I — superseded by the G28 canonical document pipeline:** the generic `documentos_operacionais` design (§4/§5 of the schema contract) was never created; the accepted G28 front (`DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, G28-B1…C) built typed canonical `document_link_revisions` / `document_link_revision_ops` (db/51/52), Documento→Pedido `0..1` / Documento→OP `0..N`, explicitly forbidding the generic `document_links(target_type,target_id)` / `documentos_operacionais` approach. G (documentary pending), H (Drive/OneDrive external-file design), I (Gmail/PDF/XML automation = the Documents Ingestor detection + human-validation queue) are all superseded, not silently deleted — the rows remain visible and relabeled `Superada`.
- **J — future and unsequenced:** the transactional inter-stage saldo guard (`PEDIDO_OP_SCHEMA_CONTRACT.md` §7) is not delivered, not started, not authorized; retained and relabeled `Futura / não sequenciada / não iniciada / não autorizada`. Its description was not removed.
- **Preserved unchanged:** no dated historical section rewritten; the original architectural intent (`documentos_operacionais` §4, saldo por etapa §7) preserved; no accepted-implementation record altered; no code/runtime/behavior changed; no new implementation phase authorized.
- **Files changed:** `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (§9 status cells D–J + reconciliation note), `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md` (§5 table Status column + D–J cells + reconciliation note), `PROJECT_STATE.md` (new closeout block), `AGENT_HANDOFF.md` (new closeout section + routing instruction that D–I are not open implementation phases), this ledger (this append-only entry).
- **Conditional files decisions:** `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md` — **NOT CHANGED** (its production-flow current-state is already accurate; this correction only cited it as evidence). `docs/DOCUMENTATION_INDEX.md` — **NOT CHANGED** (authority/classification/paths unaffected; no stale row introduced by this correction).
- **State unchanged by this correction:** `ACTIVE_PHASE: NONE`; `NEXT_AUTHORIZABLE_ACTION: NONE` pending explicit architect selection of a new front. All open debts and deferred fronts preserved.
- **Access:** no Supabase/MCP/staging/protected-project/production/Vercel access; **MCP invocations: 0; Supabase invocations: 0.** **Push:** not executed.
- **Local gates:** `git diff --check` clean; worktree clean, staging empty, zero untracked before and after.
- **Continuity (retransmit in every future handoff):** `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`, `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/ledgers/G28_LEDGER.md`, `docs/DOCUMENTATION_INDEX.md`, `docs/governance/DOCUMENTATION_MODEL.md`. Every future agent must retransmit these nine paths and instruct the next continuity to retransmit them again.
- **Next authorizable action:** `NEXT_AUTHORIZABLE_ACTION: NONE`. `ARCHITECT_DECISION_REQUIRED:` explicit selection of the next front (this documentary correction authorizes none).

---

## 2026-07-15 — G28-RECONCILIATION-DECISIONS-A — Record architect reconciliation decisions

- **Gate:** DOCUMENTARY / ARCHITECT DECISIONS RECORDED. Docs-only; sem código, teste, SQL, migration, Supabase, MCP, staging, produção ou Vercel acessados/alterados.
- **Commit documental:** `Record architect reconciliation decisions` (HEAD a consultar com `git rev-parse HEAD`).
- **Baseline de origem:** `BACKLOG-RECONCILIATION-READONLY-R1` — diagnóstico read-only anterior (sem alteração de arquivo), preservado verbatim em `docs/reports/BACKLOG_RECONCILIATION_R1_2026-07-15.md`.
- **Arquivos principais:** `PROJECT_STATE.md` (nova seção `G28-RECONCILIATION-DECISIONS-A`); `AGENT_HANDOFF.md` (nova seção de continuidade + bullets de topo atualizados); `docs/DOCUMENTATION_INDEX.md` (entradas para o relatório e o closeout do ChatGPT); `docs/governance/DOCUMENTATION_MODEL.md` (referência ao contrato de saúde arquitetural, se aplicável); `docs/reports/BACKLOG_RECONCILIATION_R1_2026-07-15.md` (novo); `docs/handoffs/CHATGPT_CLOSEOUT_2026-07-15.md` (já commitado em fase anterior; confirmado, não modificado nesta fase); este ledger.
- **Decisões registradas:**
  1. `PROJECT-CONTROL-BASELINE-R1` (ChatGPT): `REJECTED / NOT RATIFIED` — classificação materialmente incorreta da Camada 2 (tratou capacidade parcial como implementação aceita). Artefato externo, nunca canônico.
  2. `PROJECT-CONTROL-BASELINE-R1-CORRECTION` (ChatGPT): `CANCELLED / ABSORBED / SUPERSEDED` pelo diagnóstico `BACKLOG-RECONCILIATION-READONLY-R1`, adotado como baseline de referência corrente.
  3. `G28-CAMADA-2`: reclassificada `CAPACIDADE PARCIAL PREEXISTENTE` (CRUD de usuários, desativação/ban via Edge Functions, papel único `usuarios.tipo`, vínculo cliente/fornecedor — subproduto de `AUTH-DISABLE-USER` e do Portal Cliente) `+ ESCOPO PLENO A1-A7 DIFERIDO` (reset/recuperação de senha, convites, matriz de papéis/permissões, auditoria completa, política de senha plena, reativação — nenhum encontrado no código real). Referência funcional/visual para o escopo pleno: `D:\OneDrive\Programação\SGAA_clean_baseline`. Nenhuma implementação autorizada.
  4. `G28-C`: reclassificado no estado vigente `CLOSED / TECHNICALLY ACCEPTED — ARCHITECT PRODUCT VALIDATION PENDING`, separando aceite técnico/staging (matriz 16/16, migrations aplicadas/verificadas) de validação funcional/pessoal do arquiteto (não registrada) e do smoke autenticado de browser (`AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`, nunca executado). Closeout histórico (`a7d7caa`/aceite `d5ec09f`) **não reescrito** — ver entradas próprias "G28-C — Direct staging validation closeout" e "G28-C — Architect acceptance recording" acima, preservadas inalteradas.
  5. Governança de supervisão: acompanhamento de progresso, continuidade, escopo, autorizações, fases e documentação transferidos para Claude (chat) + Claude Code (residente); ChatGPT passa a consultor de processo, sem custódia de estado e sem autoridade para emitir ordens.
  6. Próxima frente selecionada: `G28-CAMADA-2`, início por diagnóstico read-only comparativo em ordem própria subsequente (não autorizado por esta entrada). Higiene do worktree `work/app-next` (11 commits atrás de `staging/work/app-next`, worktree sujo) autorizada como tarefa paralela read-only, em ordem separada.
- **Não alterado:** nenhuma entrada histórica deste ledger foi reescrita; nenhum código/teste/SQL/migration/runtime tocado; nenhuma fase de implementação autorizada.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado nesta fase.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Risco residual:** nenhum novo introduzido; débitos preexistentes preservados (`AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`, `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`, worktree `app-next` divergente/sujo, worktree detached órfão em `2a492f0`).
- **Próxima fase indicada no fechamento:** diagnóstico read-only comparativo de `G28-CAMADA-2` (ordem própria, não autorizada por esta entrada); higiene read-only de `work/app-next` (tarefa paralela autorizada, ordem separada).

---

## 2026-07-15 — Add CLAUDE.md agent entrypoint

- **Gate:** DOCUMENTARY / HARNESS CONFIG. Docs-only; sem código, teste, SQL, migration, Supabase, MCP, staging, produção ou Vercel acessados/alterados.
- **Commit:** `Add CLAUDE.md agent entrypoint` (HEAD a consultar com `git rev-parse HEAD`).
- **Arquivo criado:** `CLAUDE.md` (raiz) — ponteiro de harness, carregado automaticamente por agentes Claude Code neste diretório.
- **Conteúdo:** lista de leitura obrigatória (`PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/architecture/CODE_HEALTH_RULES.md`, `docs/governance/DOCUMENTATION_MODEL.md`, `docs/DOCUMENTATION_INDEX.md`) e resumo-ponteiro de regras operacionais (fase por autorização explícita, staging-only, restrições de Git, closeout documental obrigatório). Não duplica regra nenhuma em detalhe — aponta para os canônicos.
- **Autoridade:** `CLAUDE.md` **não é fonte canônica**. Em conflito com qualquer documento canônico, os canônicos prevalecem; divergência exige interromper e reportar, não seguir o resumo.
- **Não alterado:** nenhuma regra canônica reescrita ou duplicada; nenhum código/teste/SQL/migration/runtime tocado.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Próxima fase indicada no fechamento:** nenhuma — este registro não autoriza fase técnica alguma.

---

## 2026-07-15 — CAMADA2-USUARIOS-SPEC-MATERIALIZE-R1 — Add Camada 2 user administration spec

- **Gate:** DOCUMENTARY / PROPOSED. Docs-only; sem código, teste, SQL, migration, Supabase, MCP, staging, produção ou Vercel acessados/alterados.
- **Commit:** `Add Camada 2 user administration spec` (HEAD a consultar com `git rev-parse HEAD`).
- **Antecedente:** `CAMADA2-USUARIOS-SPEC-DIAGNOSTIC-R1` — diagnóstico read-only cross-repo (Tapetes × `D:\OneDrive\Programação\SGAA_clean_baseline`, projeto Flask/SQLite não relacionado, lido em modo estritamente read-only via dois agentes de exploração), cujo conteúdo foi incorporado com decisões do arquiteto e 5 ajustes de revisão.
- **Arquivo criado:** `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` — spec `A1-A7` + política de senha, cada item com: o que o SGAA faz, o que já existe no Tapetes (evidência file:line), o que falta, proposta adaptada, módulos/arquivos previstos, riscos de Auth, subfase/gate.
- **Decisões do arquiteto incorporadas:** `nivel_acesso` com 2 níveis (`completo`/`somente_leitura`); tabela de overrides de permissões **não construída** (opção futura condicionada); A4 = caminho único senha-temporária-com-troca-forçada, e-mail/SMTP `NOT AUTHORIZED`; bulk actions (A3.3) `DEFERRED`.
- **Ajustes de revisão aplicados:** (1) cutover de rota antecipado para A3.1 (troca do handler em `js/boot.js` + validação visual do arquiteto), A3.4 vira remoção isolada do código legado; (2) "último acesso" incluído em A3.2 (leitura de `auth.users.last_sign_in_at`, sem write) e revogação explícita de sessão declarada fora de escopo; (3) gate de mockup obrigatório antes de A3.2; (4) plano de módulos e gates atualizados com edições pontuais de `index.html`/cache-busting (§2/§12/§17) e smoke de rota/boot (§13) nas subfases que tocam `index.html`/`boot.js`; (5) `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` adicionado aos artefatos de closeout de A3.1/A3.4, e a localização de `js/admin-usuarios-writes.js`/`js/admin-usuarios-audit-read-model.js` na raiz de `js/` justificada como precedente consciente do trio `document-link-*`.
- **Caveat de segurança preservado:** a spec rejeita explicitamente 4 práticas do SGAA (senhas padrão em texto puro exibidas na UI, ausência de política de complexidade, ausência de auditoria, confirmação via `window.confirm()` nativo) — usado apenas como referência de arquitetura de informação/organização de tela, nunca de política de segurança.
- **Arquivos principais:** `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (novo); `docs/DOCUMENTATION_INDEX.md` (nova entrada, classificação "Spec proposta (design)", autoridade condicionada a aceite); `PROJECT_STATE.md` (bloco de estado — spec criada, `PROPOSED`); `AGENT_HANDOFF.md` (continuidade); este ledger.
- **Não alterado:** nenhum código, teste, SQL, migration, runtime tocado; nenhuma subfase autorizada; nenhum arquivo do repositório SGAA_clean_baseline tocado (leitura estritamente read-only, confirmada por dois agentes de exploração independentes).
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Risco residual:** nenhum novo — a spec em si não muda nenhum estado de código/dado; débitos preexistentes preservados.
- **Próxima fase indicada no fechamento:** `A3.1` — `READY FOR EXPLICIT ARCHITECT AUTHORIZATION / NOT STARTED`. Este registro não autoriza sua execução.

---

## 2026-07-15 — CAMADA2-USUARIOS-A3-1 — Extract user administration screen modules

- **Gate:** `CLOSED / ACCEPTED`. Refactor puro (§14 `CODE_HEALTH_RULES.md`) — sem feature nova, sem mudança de comportamento visual/funcional.
- **Commit técnico:** `4f01101143a512c8018d58ce9e523064c38a145f` — `Extract user administration screen modules`.
- **Commit documental:** este closeout (`Close Camada 2 user administration screen extraction`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **Autorização:** ordem do arquiteto explícita, escopo restrito a A3.1 (sem encadeamento automático de subfases seguintes), conforme `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`.
- **Arquivos principais:**
  - `js/admin-usuarios-writes.js` (novo, 196L) — camada de I/O pura (sem toast/DOM), reads de usuarios/fornecedores/clientes, writes via Edge Functions `admin-create-user`/`admin-disable-user`/`admin-delete-user` + PostgREST update, mapeamento de erro consolidado. Padrão `op-writes.js`/`entrega-writes.js`/`document-link-admin-controller.js`.
  - `js/screens/admin-usuarios-modal.js` (novo, 500L) — 3 modais (criar/editar, desativar, excluir). Helpers de formulário (`adminUsuariosModalField`, `openAdminUsuariosFormModal` etc.) duplicados localmente de `cadastros.js:204-449`, renomeados com prefixo `adminUsuarios` — necessário porque `cadastros.js` é uma IIFE que não expõe esses helpers em `window.*` e a ordem proibia alterá-lo.
  - `js/screens/admin-usuarios.js` (novo, 188L) — orquestração/render, extração 1:1 de `screenCadastrosUsuarios` (`cadastros.js:2226-2713`).
  - `index.html` — +3 `<script>` (writes → modal → screen), cache-busting `?v=20260715-camada2-a31`, inseridos logo após `cadastros.js`, antes de `ops-list.js`.
  - `js/boot.js` — rota `#/cadastros/usuarios` recableada de `window.screenCadastrosUsuarios` para `window.screenAdminUsuarios` (1 linha); comentário de dependências do cabeçalho corrigido.
  - `tests/admin-usuarios.smoke.js` (novo, 402L, 13 testes) — paridade visual (grid/badges/busca/toggle/botões), guardas de auto-proteção, wiring de escrita (spies sobre `RAVATEX_ADMIN_USUARIOS_MODAL`), unit dos writes (`RAVATEX_ADMIN_USUARIOS_WRITES` chamando `supa` corretamente), não-regressão (`cadastros.js` intocado).
  - `tests/boot.smoke.js` — +2 testes: cutover de rota (`render.name === 'screenAdminUsuarios'`), ordem/cache-busting dos 3 scripts novos.
  - `tests/cadastros-screens.smoke.js` — sandboxes de boot completo (testes 22/23) ajustados para carregar os 3 módulos novos (sem isso, teste 22 quebrava por consequência indireta da troca de rota, não por alteração em `cadastros.js`); nova asserção `routes['#/cadastros/usuarios'].render.name === 'screenAdminUsuarios'`.
- **Acoplamento oculto encontrado e resolvido (não constituiu HARD STOP):** os 8 helpers de formulário usados por `screenCadastrosUsuarios` são privados à IIFE de `cadastros.js` (só `window.labelFornecedorTipo` é global). Duplicados como funções puras (dependem só de `window.el`/`window.supa`, sem estado privado de `cadastros.js`), preservando comportamento idêntico sem tocar o arquivo proibido.
- **Decisão de escopo registrada:** a função `render()` original (`cadastros.js:2266-2317`, dataTable genérico) nunca era chamada — `reload()` só chamava `renderStandalone()`. Código morto/inalcançável, **não portado**: omissão não altera nenhum comportamento observável.
- **Não alterado:** `js/screens/cadastros.js`, `js/ui.js`, `js/auth.js` — intocados, confirmado por `git status`. `screenCadastrosUsuarios`/`window.screenCadastrosUsuarios` permanecem em `cadastros.js` como código morto até remoção isolada em `A3.4`.
- **Testes:** `node --check` nos 3 arquivos novos + `boot.js` PASS; `tests/admin-usuarios.smoke.js` **13/13**; `tests/boot.smoke.js` **32/32**; `tests/cadastros-screens.smoke.js` **32/32**; regressão ampla de 28 suítes adicionais referenciando `boot.js`/rotas: **1207 pass / 89 fail — contagem idêntica ao baseline pré-fase**, confirmado via `git stash`/`stash pop` (89 falhas são débito pré-existente — servidor `:8765` não rodando, extração de inline-script antiga — nenhuma nova). `git diff --check` limpo.
- **Validação visual:** confirmada explicitamente pelo arquiteto na rota `#/cadastros/usuarios`, app local (`http://localhost:8765`, `.claude/launch.json` criado nesta fase para o preview) apontando para staging `ucrjtfswnfdlxwtmxnoo` — paridade 1:1 aceita antes deste closeout, conforme gate de aceite da ordem.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Documentação atualizada:** `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` (§16 — novo módulo estrutural + mudança de rota; nova linha em §4 "Tabela de fases" e 3 novas linhas em §6 "Módulos extraídos"); `PROJECT_STATE.md` (nova seção "Camada 2 — Extração da Tela de Usuários"); `AGENT_HANDOFF.md` (novo closeout + continuidade).
- **Risco residual:** nenhum novo introduzido. Débitos preexistentes preservados (`AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`, `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`, worktree `app-next` divergente/sujo).
- **Próxima fase indicada no fechamento:** `A3.2` — sob **gate de mockup** (cards-resumo + toolbar exigem aprovação de mockup do arquiteto antes de implementar). `A3.3` (bulk actions) permanece `DEFERRED`. `A3.4` (remoção do código legado) depende das demais subfases A3.x aceitas. Nenhuma subfase autorizada por esta entrada.

---

## 2026-07-15 — CAMADA2-USUARIOS-A3-2 — Add user admin summary cards and toolbar

- **Gate:** `CLOSED / ACCEPTED`. Feature aditiva de UI (§14 `CODE_HEALTH_RULES.md`) sobre módulo extraído em A3.1 — sem refactor, sem write novo, sem Auth.
- **Commits técnicos:** `b4a6238c34afb683ec7a973d230330b7266c99f2` — `Add user admin summary cards and toolbar`; `3198570c04b08bef83605f64bc9ae1c5ece8b873` — `Align summary card background with dashboard` (ajuste pós-validação visual: fundo dos cards de `#f4f6f9` para `#fff`, mesmo tom de `.rv-adm-card` em `js/screens/painel.js`).
- **Commit documental:** este closeout (`Close user admin summary cards phase`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **Gate de mockup:** `SATISFEITO` — mockup aprovado pelo arquiteto em 2026-07-15 (cards-resumo com ícone KPI + toolbar + badge de papel por cor), registrado em `docs/design/CAMADA2_A32_MOCKUP_APPROVED.md` com os valores finais (incluindo o ajuste de fundo pós-validação).
- **Escopo implementado (itens 1, 2, 3, 5 da ordem):**
  - **Cards-resumo (4):** Administradores/Fornecedores/Clientes/Inativos, contagens derivadas de `allUsers` (já carregado por `reload()`, sem query nova), ícones KPI (escudo/fábrica/usuários/user-off).
  - **Toolbar:** busca (placeholder "Buscar por nome ou e-mail"), select Ordenar (Nome A–Z/Z–A/Tipo/Último acesso), select Filtrar por tipo (Todos/Admin/Fornecedor/Cliente), toggle "Mostrar inativos" — todos client-side sobre `allUsers`.
  - **Badge de papel** (coluna Tipo): Admin `#e8eefc`/`#2563eb`, Fornecedor `#eceef1`/`#5a6472`, Cliente `#f0edfc`/`#6d5bd0`.
  - **Opacidade de linha inativa:** `0.6` na linha inteira do grid quando `ativo === false`.
- **Item 4 (coluna "Último acesso") — NÃO implementado, HARD STOP confirmado:** busca exaustiva no repositório confirmou zero leitura de `auth.users.last_sign_in_at` e nenhuma RPC/view que o exponha; qualquer via de leitura exige migration nova. **Decisão do arquiteto (2026-07-15): via escolhida = RPC `SECURITY DEFINER` admin-only, padrão `is_admin()`.** Registrada como micro-fase futura `CAMADA2-LAST-ACCESS-RPC` — `NOT AUTHORIZED`, candidata a ser agrupada com a migration de `A4.1`. A opção "Último acesso" existe no select Ordenar (parte do item 2, UI) mas é inerte (sort estável, sem efeito visível) até a RPC existir.
- **Arquivos principais:** `js/screens/admin-usuarios.js` (cards-resumo, toolbar, badge de papel, opacidade — `kpiCard`/`tipoBadge`/`sortRows` novos; `renderStandalone()` estendido); `tests/admin-usuarios.smoke.js` (7 testes novos: contagens dos cards, opções da toolbar, filtro por tipo sem query nova, ordenação Z–A, cores do badge, opacidade de linha inativa, ausência confirmada da coluna "Último acesso"; teste 11-13 corrigido para localizar linhas por conteúdo em vez de índice posicional, já que a ordenação padrão alfabética reordena o grid); `docs/design/CAMADA2_A32_MOCKUP_APPROVED.md` (novo); `docs/governance/SUPERVISION_PROTOCOL.md` (novo); `docs/DOCUMENTATION_INDEX.md` (2 entradas novas); `PROJECT_STATE.md`; `AGENT_HANDOFF.md`.
- **Não alterado:** `index.html` (nenhum script novo — feature inteira dentro de `admin-usuarios.js` existente); `js/admin-usuarios-writes.js` (nenhum read novo necessário); `js/screens/admin-usuarios-modal.js`; `js/screens/cadastros.js`; `js/ui.js`; `js/auth.js`. `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` **não recebeu entrada nesta fase** — nenhum módulo estrutural novo foi criado (apenas edição de arquivos já existentes de A3.1), consistente com o §16 (só exige registro para módulo novo/mudança de rota, nenhum dos dois ocorreu aqui).
- **Testes:** `node --check` PASS; `tests/admin-usuarios.smoke.js` **20/20**; `tests/boot.smoke.js` + `tests/cadastros-screens.smoke.js` **64/64** (sem regressão); `git diff --check` limpo.
- **Validação visual:** confirmada explicitamente pelo arquiteto na rota `#/cadastros/usuarios`, app local (`http://localhost:8765`) apontando para staging `ucrjtfswnfdlxwtmxnoo`, incluindo o ajuste de fundo dos cards aplicado antes do fechamento.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked.
- **Risco residual:** nenhum novo. Débitos preexistentes preservados. Novo débito registrado (não bloqueante): `CAMADA2-LAST-ACCESS-RPC` — `NOT AUTHORIZED`, candidata a agrupar com `A4.1`.
- **Próxima fase indicada no fechamento:** `ARCHITECT DECISION REQUIRED` — candidatas sem prioridade inequívoca: `A4.1` (schema `senha_temporaria`/política de senha, possivelmente agrupada com `CAMADA2-LAST-ACCESS-RPC`), `A2.1` (schema `nivel_acesso`), `A6.1` (schema/trigger de auditoria). `A3.3` permanece `DEFERRED`. `A3.4` depende das demais subfases A3.x aceitas. Nenhuma subfase autorizada por esta entrada.

---

## 2026-07-15 — G28-GOVERNANCE-CONSOLIDATION-A — Consolidate supervision protocol and register publication criteria

- **Gate:** `CLOSED / ACCEPTED`. Docs-only — sem código, teste, SQL, migration, Supabase, staging, produção ou Vercel acessados/alterados.
- **Commit documental:** `Consolidate supervision protocol and register publication criteria`. O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **Arquivos principais:**
  - `docs/governance/SUPERVISION_PROTOCOL.md` — apêndice "Handoff de supervisão — bloco padrão" (texto verbatim do arquiteto); formato de relatório (§3) passou a exigir seção `STRUCTURAL POLICY COMPLIANCE` em toda fase de implementação.
  - `PROJECT_STATE.md` — nova seção "Decisão de Arquiteto — Critério de Publicação e Frentes Candidatas".
  - `AGENT_HANDOFF.md` — novo closeout + continuidade (11 caminhos obrigatórios, `SUPERVISION_PROTOCOL.md` adicionado).
- **Frentes candidatas registradas (`NOT AUTHORIZED`):** `CODE-HEALTH-AUDIT-§18-R1` — auditoria read-only pós-Camada 2 (§18 `CODE_HEALTH_RULES.md`), insumo para decomposição incremental de `cadastros.js` (~2.200 linhas, 6 telas embutidas remanescentes) e triagem de débitos de teste de baseline; `PUBLICATION-TRACK-REVIEW` — revisão da fronteira staging-only + `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` + G28-D + aplicação em produção das migrations staging-only + `DELETE-PROD-GUARD-A`, `NOT AUTHORIZED / CONDITIONED`.
- **Decisão vinculante do arquiteto — critério de publicação:** produção só é autorizada após `G28-CAMADA-2` (escopo pleno `A1-A7`) e `G28-CAMADA-3` (backup automático) estarem ambas `CLOSED / ACCEPTED` em staging. `PUBLICATION-TRACK-REVIEW` condicionada a esse critério. `STAGING-ONLY-EXECUTION-BOUNDARY-A` permanece vigente sem alteração.
- **Consequência registrada:** `G28-CAMADA-3` reclassificada de diferida para `CAMINHO CRÍTICO DE PUBLICAÇÃO` (após `G28-CAMADA-2`), pendente de spec própria; diagnóstico `BK1-BK8` fica como fase futura, `NOT AUTHORIZED`.
- **Não alterado:** nenhum código, teste, SQL, migration, runtime tocado; nenhuma subfase de `G28-CAMADA-2`/`G28-CAMADA-3` autorizada; `git diff --check` limpo.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada. **Push:** não executado.
- **Estado final do worktree:** limpo; staging seletiva por caminho literal; zero untracked após o commit.
- **Risco residual:** nenhum novo. Débitos preexistentes preservados.
- **Próxima fase indicada no fechamento:** `ARCHITECT DECISION REQUIRED AFTER BACKLOG RECONCILIATION` — inalterada; candidatas de `G28-CAMADA-2` (`A4.1`, `A2.1`, `A6.1`) seguem sem prioridade inequívoca. Este registro não autoriza nenhuma subfase.

---

## 2026-07-16 — A4.1 + CAMADA2-LAST-ACCESS-RPC — Add temporary password schema and last sign-in read model

- **Gate:** `CLOSED / ACCEPTED`. Schema/RPC aditivo + extensão pontual de Edge Function (§14 `CODE_HEALTH_RULES.md` — sem UI, sem boot, sem produção, sem mistura de domínios).
- **Frente:** `G28-CAMADA-2`, subfases `A4.1` (schema `senha_temporaria`/política de senha) agrupada com a micro-fase `CAMADA2-LAST-ACCESS-RPC` (RPC de "último acesso"), conforme decisão do arquiteto registrada no closeout de `A3.2`.
- **Autorização:** ordem explícita do arquiteto ("AUTORIZAÇÃO DO ARQUITETO — SUBFASE A4.1 + CAMADA2-LAST-ACCESS-RPC"), Sonnet 5 / esforço médio, escopo restrito às duas migrations + extensão da Edge Function `admin-create-user` + aplicação em staging. UI de consumo (coluna "Último acesso") explicitamente **fora de escopo** desta ordem.
- **Commits técnicos:**
  - `bf0d522` — `Add temporary password schema and last sign-in read model` (`db/58_admin_usuarios_senha_temporaria.sql`, `db/59_admin_last_sign_in_readmodel.sql`, `supabase/functions/admin-create-user/index.ts`, `supabase/functions/admin-create-user/README.md`, `tests/admin-usuarios-senha-temporaria-schema.smoke.js`, `tests/admin-last-sign-in-readmodel.smoke.js`, `tests/admin-create-user.smoke.js`, `tests/document-decision-command-contract.test.js`).
  - `c6289f8` — `Add password-policy E2E verification runner for admin-create-user` (`scripts/staging/admin-create-user-password-policy-e2e.mjs`, `docs/DOCUMENTATION_INDEX.md`).
- **Commit documental:** este closeout (`Close temporary password schema phase`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **Schema (`db/58_admin_usuarios_senha_temporaria.sql`):** `usuarios.senha_temporaria BOOLEAN NOT NULL DEFAULT FALSE` + `usuarios.senha_gerada_em TIMESTAMPTZ NULL`. Aditiva, idempotente (`ADD COLUMN IF NOT EXISTS`). Base do caminho único decidido para `A4` (senha temporária + troca forçada no primeiro login); `A4.2` (guarda de boot + tela de troca) e `A4.3` (convite por e-mail, `NOT AUTHORIZED`) permanecem fora desta fase.
- **RPC (`db/59_admin_last_sign_in_readmodel.sql`):** `public.admin_usuarios_last_sign_in()` — `RETURNS TABLE(id UUID, last_sign_in_at TIMESTAMPTZ)`, `SECURITY DEFINER`, `STABLE`, `search_path=public,auth`, guarda `is_admin()` (padrão `db/12`) com `RAISE EXCEPTION ... USING ERRCODE = '42501'` para chamador não-admin. Expõe apenas `id`+`last_sign_in_at`; nunca email/senha/metadata. Grants explícitos no próprio arquivo: `REVOKE EXECUTE ... FROM PUBLIC, anon, service_role; GRANT EXECUTE ... TO authenticated` (lição de `db/30`/`db/54`/`db/57` — nunca confiar em default privileges).
- **Edge Function `admin-create-user` (extensão pontual):** `PASSWORD_MIN_LENGTH` 6→8 + `PASSWORD_DIGIT_RE = /[0-9]/` (≥1 dígito obrigatório); insert em `public.usuarios` passou a setar `senha_temporaria: true`, `senha_gerada_em: new Date().toISOString()`. `README.md` atualizado com a nova política.
- **Aplicação em staging (`ucrjtfswnfdlxwtmxnoo`), via Supabase MCP, migration rastreada:** `db/58` → registro `20260716014338 / 58_admin_usuarios_senha_temporaria`; `db/59` → registro `20260716014358 / 59_admin_last_sign_in_readmodel`. Ambos confirmados no catálogo antes/depois via `list_migrations`. Colunas verificadas ao vivo com tipo/nullability/default do arquivo; os 10 usuários pré-existentes preservados sem efeito retroativo (`senha_temporaria=false`, `senha_gerada_em=NULL` em todos, `count` confirmado). `pg_get_functiondef` de `admin_usuarios_last_sign_in` idêntico ao arquivo fonte.
- **Matriz de papéis da RPC (staging, read-only, `BEGIN…ROLLBACK`, sem fixtures):** `anon` → `ERROR 42501: permission denied for function admin_usuarios_last_sign_in` (bloqueado no limite de ACL, antes de executar); `authenticated` não-admin (fornecedor real ativo) → `ERROR 42501: Apenas administradores podem consultar o ultimo acesso de usuarios.` (negação de negócio dentro da função, `RAISE EXCEPTION`); `authenticated` admin (admin real ativo) → `ok`, retorna somente `id`+`last_sign_in_at`. ACL final verificada em `information_schema.routine_privileges`: apenas `authenticated` (EXECUTE explícito) e `postgres` (owner); `PUBLIC`/`anon`/`service_role` sem `EXECUTE`.
- **Deploy da Edge Function:** **executado pelo arquiteto** diretamente em staging (`ucrjtfswnfdlxwtmxnoo`) — fora do alcance de ferramentas/credenciais desta sessão (sem `SUPABASE_ACCESS_TOKEN`/CLI logada, sem tool MCP de deploy de Edge Function). Evidência indireta: `supabase/.temp/project-ref` (gerado localmente pela CLI do arquiteto, não versionado) contém `ucrjtfswnfdlxwtmxnoo`.
- **Verificação pós-deploy (E2E real em staging, `result: PASS`, 9/9 passos):** runner `scripts/staging/admin-create-user-password-policy-e2e.mjs` (mesmo esqueleto/garantias de segurança do `admin-disable-user-e2e.mjs` — login com senha real executado por humano, nunca pelo agente IA; sanitização de segredos; guarda de staging-only; config local gitignored), **executado pelo arquiteto** (o agente IA está estruturalmente impedido de entrar senha/token em qualquer campo, mesmo sob autorização explícita — regra permanente, não específica deste projeto). Passos confirmados: (1) `admin_login`; (2) `admin_active`; (3) `fornecedor_resolved` (`fornecedor_id=5`, fixture sintética "Teste"); (4) senha de 7 caracteres → `VALIDATION_ERROR` com mensagem de comprimento; (5) senha de 8 caracteres sem dígito → `VALIDATION_ERROR` com mensagem de dígito; (6) senha válida (8+ caracteres, 1+ dígito) → usuário sintético criado com sucesso; (7) `public.usuarios` confirmado via REST com `senha_temporaria=true` e `senha_gerada_em` preenchido; (8) cleanup via `admin-delete-user` (fluxo existente, hard delete + `confirm_email`) → `deleted=true`; (9) `cleanup_verify` — perfil ausente em `public.usuarios` após delete, **cleanup zero confirmado**.
- **Testes locais:** `node --check` PASS em todos os arquivos JS/`.mjs` tocados; `admin-usuarios-senha-temporaria-schema.smoke.js` **7/7**; `admin-last-sign-in-readmodel.smoke.js` **9/9**; `admin-create-user.smoke.js` estendido (7 chars falha por comprimento, 8 sem dígito falha por dígito, 8+dígito passa — validação real extraída do source; marcação `senha_temporaria`/`senha_gerada_em` no insert) **25/25**; allow-list de `db/` em `document-decision-command-contract.test.js` estendida (precedente `db/51`/`db/52`) para `db/58`/`db/59`; os 4 arquivos combinados **71/71**; regressão ampla `tests/admin-*.smoke.js` + `boot.smoke.js` **263/263**, sem regressão. `git diff --check` limpo (apenas avisos informativos LF→CRLF).
- **STRUCTURAL POLICY COMPLIANCE:** §7 (tamanho — todos os arquivos tocados entre 28–440 linhas, abaixo do teto aceitável de 500); §9 (writes Supabase — nenhum write novo em módulo de render; Edge Function existente estendida pontualmente); §13 (testes proporcionais — smokes novos + regressão 263/263 + E2E real de staging); §14 (fases — schema/RPC/Edge Function isolados de UI/docs; runner E2E e entrada de índice tratados em commit próprio, separado do commit técnico de schema); §15 (Git — `git status`/branch/HEAD verificados antes do patch, staging seletivo por caminho literal, sem `add -A`/`reset`/`rebase`/push); §16 (documentação — este closeout).
- **Não implementado nesta fase (fora de escopo, não iniciado):** consumo da RPC `db/59` na UI (coluna "Último acesso" em `js/screens/admin-usuarios.js`); `A4.2` (guarda de boot + tela de troca obrigatória, self-service `auth.updateUser`, gate visual); `A4.3` (convite por e-mail/SMTP, `NOT AUTHORIZED`).
- **Débito corrigido nesta fase:** `docs/operations/AUTH_USER_PROVISIONING_RUNBOOK.md` — os 2 pontos que citavam "mínimo 6 caracteres"/"senha < 6" (desatualizados desde a extensão da Edge Function) corrigidos para a política vigente (8 caracteres + 1 dígito) com nota sobre `senha_temporaria`/troca obrigatória prevista em `A4.2`.
- **Débitos preexistentes preservados (inalterados por esta fase):** `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED` (G28-C/D/B7/Portal Cliente); `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`; `G28-D`; `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-3`/`G28-CAMADA-4`; worktree `app-next` divergente/sujo.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada em nenhum momento. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked (`supabase/.temp/` é cache local da CLI do Supabase, não rastreado, gerado pela ação do arquiteto — não constitui trabalho pendente).
- **Risco residual:** nenhum novo. Guarda `is_admin()` e ACL de `db/59` testadas empiricamente nos 3 papéis relevantes; política de senha testada em produção real de staging (não apenas estaticamente).
- **Próxima fase indicada no fechamento:** `ARCHITECT DECISION` — candidatas: micro-fase de consumo da RPC `db/59` na UI (coluna "Último acesso" em `js/screens/admin-usuarios.js`, sob gate de mockup se envolver elemento visual novo); `A4.2` (guarda de boot + tela de troca obrigatória, gate visual). Nenhuma subfase autorizada por este registro.

## 2026-07-16 — A4.2 — Add mandatory password change gate

- **Gate:** `CLOSED / ACCEPTED`. Feature aditiva (tela + guarda) sobre schema já existente (`db/58`, `A4.1`) — sem migration nova, sem Edge Function nova, sem produção (§14 `CODE_HEALTH_RULES.md`).
- **Frente:** `G28-CAMADA-2`, subfase `A4.2` de `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`, autorizada após `A4.1` + `CAMADA2-LAST-ACCESS-RPC`.
- **Autorização:** ordem explícita do arquiteto ("AUTORIZAÇÃO DO ARQUITETO — SUBFASE A4.2"), gate de mockup satisfeito (card centrado sem shell, checklist vivo, toggle de visibilidade, link "Sair da conta", aprovado em 2026-07-16), Sonnet 5 / esforço médio.
- **Hard stop levantado e resolvido dentro da fase, com decisão explícita do arquiteto (Opção A):** a guarda projetada (`se CURRENT_USER.senha_temporaria === true`) não podia funcionar porque `js/auth.js` (`loadCurrentUser()`) nunca selecionava `senha_temporaria`/`senha_gerada_em` — colunas adicionadas por `db/58` em `A4.1`, mas nunca lidas em nenhum lugar do repositório (confirmado por grep antes de escrever qualquer código). `js/auth.js` não estava no manifesto original da ordem. Antes de decidir unilateralmente, a sessão parou, verificou RLS/grants (read-only, catálogo ao vivo) e reportou 2 opções ao arquiteto: (A) ampliar `auth.js` só no `select`; (B) manter o manifesto e ler a flag via um helper próprio em `boot.js`. O arquiteto escolheu **Opção A**, ampliando o manifesto em exatamente 1 arquivo, para exatamente 1 mudança (2 colunas a mais no `select` de `loadCurrentUser()`) — nenhuma outra linha de `auth.js` tocada, mecanismo de Auth (§11) intocado.
- **Commit técnico:** `6c624ef` — `Add mandatory password change gate` (`js/auth.js`, `js/boot.js`, `js/trocar-senha-writes.js` (novo), `js/screens/trocar-senha-obrigatoria.js` (novo), `scripts/staging/trocar-senha-obrigatoria-e2e.mjs` (novo), `index.html`, `tests/auth.smoke.js`, `tests/boot.smoke.js`, `tests/trocar-senha-obrigatoria.smoke.js` (novo)).
- **Commit documental:** este closeout (`Close mandatory password change phase`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **RLS/grants verificados em staging (`ucrjtfswnfdlxwtmxnoo`) antes de codar, via Supabase MCP, read-only:** `pg_policy` em `public.usuarios` — `usuarios_self_update` (`polcmd='w'`, `USING id=auth.uid() AND ativo IS TRUE`, `WITH CHECK` preserva `tipo`, impede auto-escalação de papel); `information_schema.column_privileges` confirma `authenticated` com `UPDATE` explícito em `senha_temporaria` e `senha_gerada_em`. Conclusão: self-update funciona sem policy nova, sem afrouxamento de RLS existente.
- **`js/auth.js` (única mudança):** `select` de `loadCurrentUser()` ganha `senha_temporaria, senha_gerada_em` entre `cliente_id` e o join de `fornecedores`. Nenhuma outra linha alterada.
- **`js/boot.js`:** `isSenhaTemporariaExpirada(geradaEm)` — pura, 7 dias (política de `CAMADA2_USUARIOS_SPEC_PROPOSED.md`), sem estado de closure. `guardedHandleRoute()` — envolve `window.handleRoute` (de `js/router.js`, **intocado**) sem alterá-lo: usado no listener de `hashchange` (substitui o `window.handleRoute` direto) e na decisão inicial de `main()`, pós-`loadCurrentUser()`/pré-bootstrap G24-C. Se `CURRENT_USER.senha_temporaria === true`, renderiza a tela via `window.setApp` e retorna sem rotear. Exportado só para teste em `window.RAVATEX_BOOT_GUARD = { isSenhaTemporariaExpirada, guardedHandleRoute }`.
- **`js/trocar-senha-writes.js` (novo módulo, 51 linhas, write puro sem DOM/toast, mesmo contrato de `admin-usuarios-writes.js`):** `trocarSenhaObrigatoria(userId, novaSenha)` — `supabase.auth.updateUser({password})` self-service (sem `auth.admin.*`) e, em sucesso, `UPDATE usuarios SET senha_temporaria=false WHERE id=userId` via PostgREST. Retorna `{ok:true}` ou `{ok:false, stage:'auth'|'flag', error}` — `stage:'flag'` sinaliza estado parcial real (senha já trocada no Auth, perfil não atualizado), nunca tratado como sucesso silencioso.
- **`js/screens/trocar-senha-obrigatoria.js` (novo, 243 linhas, dentro do alvo ≤250L da ordem):** card centrado sem shell/menu (`#eceef1` fundo, card branco `#d8dce2` radius 6px), ícone cadeado (`#e8eefc`/`#2563eb`), título+texto, 2 campos com toggle de olho (`#8a93a3`), checklist vivo em `#f4f6f9` (3 critérios: 8+ caracteres, 1+ dígito, senhas coincidem — `#8a93a3` pendente → `#18794a` satisfeito, atualiza por tecla), botão "Definir nova senha" full-width `#2563eb` habilitado só com os 3 critérios verdes, link discreto "Sair da conta" (logout real via `window.logout`). Modo `expired` (`senha_gerada_em` > 7 dias): sem campos/checklist/botão, mensagem de expiração + "Sair da conta" como botão primário.
- **`index.html`:** `js/trocar-senha-writes.js?v=20260716-camada2-a42` (após `auth.js`, antes de `router.js`) e `js/screens/trocar-senha-obrigatoria.js?v=20260716-camada2-a42` (após `system-screens.js`), ambos antes de `boot.js`.
- **Testes locais:** `node --check` PASS nos 5 arquivos JS/`.mjs` tocados/novos; `tests/trocar-senha-obrigatoria.smoke.js` (novo) **14/14** (write sucesso/falha `auth`/falha `flag`; render normal título/campos/checklist/botão desabilitado/"Sair da conta"; checklist reage por tecla real via `dispatchEvent`; toggle de olho; submit sucesso com `loadCurrentUser`+`routeAfterLogin`; submit falha sem navegação silenciosa; modo `expired`; "Sair da conta" nos 2 modos); `tests/boot.smoke.js` estendido **44/44** (13 testes novos: namespace `RAVATEX_BOOT_GUARD`, `isSenhaTemporariaExpirada` pura incl. limite de 7 dias, `guardedHandleRoute` unitário nos 3 casos — `CURRENT_USER` nulo/flag false/flag true —, integração real via `main()` com sessão autenticada mockada — flag true bloqueia e renderiza, flag+expiração renderiza modo expirado, flag false segue fluxo normal —, ordem/cache-busting dos 2 scripts novos); `tests/auth.smoke.js` estendido (3 testes novos + 1 pré-existente corrigido — regex do formato do `select`, que mudou legitimamente) **37/43**, os 6 que falham confirmados idênticos ao baseline via `git stash` (regex desatualizado quanto a `?v=` em cache-busting de `<script src="js/auth.js">`, anterior a esta fase — não corrigido aqui, ver débito abaixo). Regressão consolidada (`boot`+`auth`+`trocar-senha-obrigatoria`+`admin-usuarios`+`cadastros-screens`) **150/156**, mesma contagem de débito pré-existente confirmada via `git stash`. `git diff --check` limpo (só avisos informativos LF→CRLF).
- **Verificação visual/funcional sem credenciais (preview local `http://localhost:8765`, staging `ucrjtfswnfdlxwtmxnoo`, sem login):** tela real (módulos carregados sem mock) renderizada num overlay de diagnóstico — modo normal confirmado via `get_page_text`; checklist reage a tecla real (`dispatchEvent('input')`) com cores computadas reais do navegador: 8+ caracteres+dígito com confirmação diferente → 2/3 verde (`rgb(24,121,74)`=`#18794a`) + 1 cinza (`rgb(138,147,163)`=`#8a93a3`), botão **continua desabilitado**; corrigindo a confirmação → 3/3 verde, botão **habilita**; toggle de olho `password→text→password` confirmado; modo `expired` — 0 campos, 0 `<form>`, só mensagem + "Sair da conta" confirmado via `querySelectorAll`. Console sem erros. Overlay desmontado ao final, nenhum estado real alterado.
- **Validação da perna autenticada — CONFIRMADA PELO ARQUITETO, validação manual em staging (`ucrjtfswnfdlxwtmxnoo`):** usuário sintético criado pelo fluxo novo (senha temporária via `admin-create-user`), gate exibido no primeiro login, checklist reagiu, troca efetuada, `senha_temporaria` zerada, segundo login entrou direto sem o gate. Usuário de teste removido ao final. **Motivo de o agente IA não ter executado essa perna diretamente:** entrar senha em qualquer campo (mesmo senha sintética/descartável) é proibido para o agente, regra permanente já registrada no closeout de `A4.1` — por isso foi criado `scripts/staging/trocar-senha-obrigatoria-e2e.mjs` (mesmo esqueleto/garantias de segurança do `admin-create-user-password-policy-e2e.mjs`: senha sintética gerada pelo próprio script, login automatizado feito pelo script quando executado por um humano, nunca pelo agente; sanitização de segredos; guarda de staging-only; config local gitignored) como runner equivalente para reexecução futura — **não executado nesta fase**, já que a validação usada para o closeout foi a manual do arquiteto.
- **Débito registrado nesta fase (não bloqueante, candidato a `CODE-HEALTH-AUDIT-§18-R1`):** os 6 testes pré-existentes em `tests/auth.smoke.js` que falham checando `<script src="js/auth.js">` sem considerar `?v=` (regex desatualizado desde que cache-busting foi adicionado a `auth.js`, confirmado idêntico ao baseline via `git stash`, anterior a esta fase) — não corrigido aqui, fora de escopo desta ordem.
- **Débito de continuidade documental (pré-existente, não gerado por esta fase, mas explicitado aqui):** a micro-fase `CAMADA2-LAST-ACCESS-UI` (consumo da RPC `db/59` — coluna "Último acesso" em `js/screens/admin-usuarios.js`, technical commit `0aff22f` — `Add last sign-in column to user admin`) teve seu relatório de implementação entregue (`IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`), mas a sessão prosseguiu diretamente para a autorização de `A4.2` sem um `OK` explícito nem ordem de closeout registrada para essa micro-fase especificamente. Funcionalidade implementada e no histórico; falta apenas o registro documental formal (`CLOSED/ACCEPTED`) — pendente de confirmação/ordem própria do arquiteto.
- **STRUCTURAL POLICY COMPLIANCE:** §7 (tamanho — `trocar-senha-obrigatoria.js` 243L dentro do alvo ≤250L da ordem; `trocar-senha-writes.js` 51L; `boot.js` 166L, era 121L; `auth.js` 150L, era 149L — todos abaixo do teto aceitável de 500); §9 (writes Supabase — write novo isolado em módulo próprio, tabela/operação/payload/comportamento de erro/risco de estado parcial documentados no cabeçalho do arquivo, teste smoke correspondente); §10 (reads — leitura de perfil permanece em `auth.js`, único ponto de leitura de `CURRENT_USER`, sem duplicação); §11 (auth/perfil — `auth.js` alterado só no `select`, `id=auth.uid()` preservado, nenhuma máscara de ausência de perfil); §12 (cache-busting — os 2 scripts novos com `?v=20260716-camada2-a42`, ordem correta, smokes de `boot`/`index.html` atualizados); §13 (testes — `node --check` + smoke do módulo novo + smoke de boot atualizado, cobrindo rota/ordem de scripts + smokes existentes verdes, débito pré-existente isolado e confirmado); §14 (fases — escopo único: guarda+tela, sem migration, sem Edge Function nova, sem Admin API; hard stop resolvido em ordem separada de decisão, não misturado ao código); §15 (Git — `git status`/branch/HEAD verificados antes do patch, staging seletivo por caminho literal, sem `add -A`/`reset`/`rebase`/push); §16 (documentação — este closeout + `DOCUMENTATION_INDEX.md`).
- **Não implementado nesta fase (fora de escopo, não iniciado):** `A4.3` (convite por e-mail, `NOT AUTHORIZED`); `A2.1` (schema `nivel_acesso`); `A6.1` (schema/trigger de auditoria); `A5.1-A5.2` (reset de senha por admin, `Auth` risco médio — requer verificação dedicada equivalente a `admin-disable-user`).
- **Débitos preexistentes preservados (inalterados por esta fase):** `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED` (G28-C/D/B7/Portal Cliente); `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`; `G28-D`; `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-3`/`G28-CAMADA-4`; worktree `app-next` divergente/sujo.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada em nenhum momento. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked (`supabase/.temp/` pré-existente, cache local da CLI do Supabase, não gerado por esta sessão).
- **Risco residual:** nenhum novo. RLS `usuarios_self_update` e grants de `authenticated` verificados empiricamente antes de codar; guarda testada unitariamente nos 3 casos relevantes (`CURRENT_USER` nulo, flag false, flag true) e via integração real de `main()`; perna autenticada completa validada manualmente pelo arquiteto em staging real.
- **Próxima fase indicada no fechamento:** `ARCHITECT DECISION` — candidatas: `A2.1` (schema `nivel_acesso`), `A6.1` (schema/trigger de auditoria), `A5.1-A5.2` (reset de senha por admin). Nenhuma subfase autorizada por este registro. Confirmação/closeout formal de `CAMADA2-LAST-ACCESS-UI` também pendente (ver débito acima).

## 2026-07-16 — CAMADA2-LAST-ACCESS-UI — Close last sign-in column phase

- **Gate:** `CLOSED / ACCEPTED`. Feature aditiva de UI consumindo RPC já existente (`db/59`, `A4.1`) — sem schema, sem Edge Function, sem boot (§14 `CODE_HEALTH_RULES.md`).
- **Frente:** `G28-CAMADA-2`, micro-fase de consumo da RPC `admin_usuarios_last_sign_in` na tela de usuários, autorizada após `A4.1` + `CAMADA2-LAST-ACCESS-RPC`.
- **Autorização original:** "AUTORIZAÇÃO DO ARQUITETO — MICRO-FASE CAMADA2-LAST-ACCESS-UI", Sonnet 5 / esforço baixo, escopo restrito a `js/admin-usuarios-writes.js` + `js/screens/admin-usuarios.js` + smoke estendido; proibido write novo/migration/`index.html`/modal/boot.
- **Commit técnico:** `0aff22f` — `Add last sign-in column to user admin` (`js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `tests/admin-usuarios.smoke.js`).
- **Commit documental:** este closeout (`Close last sign-in column phase`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **`js/admin-usuarios-writes.js`:** `fetchLastSignIn()` — `window.supa.rpc('admin_usuarios_last_sign_in')`, read puro sem DOM/toast, mesmo contrato do módulo.
- **`js/screens/admin-usuarios.js`:** `reload()` faz uma única chamada à RPC por ciclo, mergeando por `id` em `lastSignInById` (nenhuma chamada por linha); coluna "ULTIMO ACESSO" no grid (`formatLastSignIn`, `dd/mm/aaaa hh:mm`, `"—"` para nulo/ausente/inválido); ordenação "Último acesso" ativada em `sortRows` (mais recente primeiro, nulos sempre por último, independente da direção); falha da RPC capturada em `try/catch` — `console.warn`, `lastSignInById` fica vazio, coluna inteira cai para `"—"`, tela e lista continuam normais (fail-open para leitura, nunca derruba a UI).
- **Não tocado (confirmado por `git status` na fase):** nenhum write novo; nenhuma migration; `index.html` intocado; nenhum modal; `js/boot.js` intocado.
- **Testes locais:** `node --check` PASS; `tests/admin-usuarios.smoke.js` estendido **23/23** (4 testes novos: 22 — coluna presente/formato/fallback de nulo; 23 — RPC chamada exatamente 1x por `reload()`; 24 — falha da RPC não derruba a tela; 25 — ordenação com nulos por último); regressão `tests/boot.smoke.js` + `tests/cadastros-screens.smoke.js` + `tests/admin-*.smoke.js` **298/298**, sem regressão. `git diff --check` limpo.
- **Verificação em preview local (staging real `ucrjtfswnfdlxwtmxnoo`, sessão já autenticada, sem credenciais entradas pelo agente):** coluna "ULTIMO ACESSO" populada com dados reais (timestamps formatados corretamente, `"—"` para usuários nunca logados) via `get_page_text`; ordenação "Último acesso" aplicada ao vivo confirmou ordem decrescente correta com todos os `"—"` agrupados por último; console sem erros/warnings.
- **Validação visual — CONFIRMADA PELO ARQUITETO em 2026-07-16:** "coluna populada com dados reais, formato correto, `"—"` nos nunca-logados, ordenação com nulos por último — conferido no preview em 2026-07-16".
- **STRUCTURAL POLICY COMPLIANCE:** §7 (tamanho — `js/screens/admin-usuarios.js` 334 linhas, era 305; `js/admin-usuarios-writes.js` 206 linhas, era 196; ambos abaixo do teto aceitável de 500); §10 (reads Supabase — `fetchLastSignIn()` é read simples ligado à montagem da tela, extraído para o módulo de I/O já existente, mesmo padrão de `fetchUsuariosPageData`, sem write); §13 (testes — `node --check` + smoke do módulo (23/23) + regressão de boot/cadastros/admin-* (298/298); sem alteração de `index.html`/`boot.js`/ordem de scripts, smoke de rota/boot não exigido e não alterado); §14 (fases — escopo único, só frontend consumindo RPC já existente, sem Supabase/schema tocado).
- **Débito de continuidade documental fechado por este registro:** o relatório de implementação desta micro-fase ficou em `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO` enquanto a sessão prosseguiu diretamente para a autorização de `A4.2`, sem `OK` explícito nem ordem de closeout registrada para esta micro-fase especificamente naquele momento. Confirmado e fechado nesta entrada, junto com a autorização de `A5.1-A5.2`.
- **Não implementado (fora de escopo, já registrado antes):** demais itens de `A3.2`/`A4` não relacionados a "último acesso".
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada em nenhum momento. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked (`supabase/.temp/` pré-existente, não gerado por esta sessão).
- **Risco residual:** nenhum. RPC já validada em staging com matriz de papéis (fase `A4.1`); consumo na UI é read-only, fail-closed em caso de erro.
- **Próxima fase indicada no fechamento:** já superada — `A5.1-A5.2` (reset de senha administrativo) autorizada e em andamento (ver entrada própria).

## 2026-07-16 — A5.1-A5.2 — Add admin password reset

- **Gate:** `CLOSED / ACCEPTED`. Edge Function nova + UI de ação (§14 `CODE_HEALTH_RULES.md`) — sem migration (db/58 cobre), sem boot, sem reativação (`A5.3-A5.4`), sem produção.
- **Frente:** `G28-CAMADA-2`, subfase `A5.1-A5.2` de `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`, autorizada após `A4.2`. `A5.3-A5.4` explicitamente não inclusas.
- **Autorização:** ordem explícita do arquiteto ("ORDEM — A5.1-A5.2"), Sonnet 5 / esforço médio (superfície Admin API nova: `updateUserById({password})`, nunca exercitada antes neste repo). Decisão do arquiteto incorporada: auto-reset **BLOQUEADO** — admin usa o fluxo normal de troca (`A4.2`), evita footgun.
- **Commit técnico:** `b726717` — `Add admin password reset` (`supabase/functions/admin-reset-user-password/index.ts`, `supabase/functions/admin-reset-user-password/README.md`, `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `js/screens/admin-usuarios-modal.js`, `scripts/staging/admin-reset-password-e2e.mjs`, `tests/admin-reset-user-password.smoke.js`, `tests/admin-usuarios.smoke.js`).
- **Commit documental:** este closeout (`Close admin password reset phase`). O HEAD atual deve ser consultado com `git rev-parse HEAD`.
- **Edge Function `admin-reset-user-password` (espelho do esqueleto `admin-disable-user`):** JWT→admin ATIVO (`tipo='admin' AND ativo=true`)→payload; `SELF_RESET_FORBIDDEN` se `target_id === caller_id`; busca alvo em `public.usuarios` (`NOT_FOUND` se ausente); gera senha temporária de 12 caracteres via `crypto.getRandomValues` (charset sem ambiguidade visual `0`/`O`/`1`/`l`/`I`, garantia determinística de ≥1 dígito — nunca `Math.random`, nunca valor fixo por papel); `auth.admin.updateUserById(target_id, {password: newPassword})`; em sucesso, `UPDATE usuarios SET senha_temporaria=true, senha_gerada_em=now() WHERE id=target_id`; retorna `{user_id, email, tipo, password, senha_temporaria:true}` — a senha **uma única vez**, nunca logada em nenhum branch de erro (`console.error` só referencia `targetId`). Sem `ban_duration`, sem `auth.admin.createUser/deleteUser` (fora de escopo).
- **Estado parcial sem compensação segura:** o reset toca `updateUserById` **antes** do update de perfil. Se o update falhar após o reset no Auth ter sucesso (`PROFILE_UPDATE_FAILED`), não há reversão segura possível (senha antiga desconhecida/não recuperável) — retorna erro explícito orientando nova tentativa (idempotente, cada chamada gera uma senha nova independente do estado anterior). Documentado no README da função.
- **`js/admin-usuarios-writes.js`:** `resetarSenha(userId)` — `supa.functions.invoke('admin-reset-user-password', {body:{user_id}})`; `friendlyResetMessage(code, fallback)` mapeando os 8 códigos de erro para PT-BR.
- **`js/screens/admin-usuarios.js`:** botão de ícone chave (`ICON_KEY`, convenção visual idêntica aos 3 botões existentes — 30×30, borda `#eceef1`, cor `#8a93a3`) entre Editar e Desativar; guarda de auto-reset visual (desabilitado + tooltip "Nao pode resetar a propria senha" na própria linha), construída com atributo `disabled` **condicionalmente incluído no objeto de attrs** (só quando `true`) — padrão seguro que evita o footgun de `el()`/`setAttribute` com boolean (ver achado registrado abaixo).
- **`js/screens/admin-usuarios-modal.js`:** `openResetarSenhaModal(usr, {onDone})` — `window.confirmDialog` (nunca `window.confirm`), mensagem cita o e-mail do alvo; em sucesso, `openSenhaGeradaModal(password, email)` — `window.modal` com a senha em bloco monoespaçado selecionável, botão "Copiar senha" (Clipboard API, fallback gracioso via toast se a permissão for negada, sem crash), aviso "Esta senha não será exibida novamente"; a senha não é persistida em lugar nenhum além da closure da função (sai de escopo ao fechar o modal). Erro → toast + `friendlyResetMessage`, sem abrir o modal de senha (sem estado ambíguo).
- **Deploy da Edge Function:** **executado pelo arquiteto** diretamente em staging (`ucrjtfswnfdlxwtmxnoo`) — fora do alcance de credenciais/ferramentas desta sessão (agente IA não entra senha/token/API key em nenhum campo, regra permanente e não contornável por autorização, já registrada nos closeouts de `A4.1`/`A4.2`).
- **Verificação pós-deploy — E2E real em staging, `result: PASS` (15/15 passos), executado pelo arquiteto** via `scripts/staging/admin-reset-password-e2e.mjs` (mesmo esqueleto/garantias de segurança dos runners anteriores — login com senha real só por humano, nunca pelo agente; todas as senhas P1/P2/P3 geradas pelo próprio script ou recebidas da Edge Function, nunca digitadas; sanitização de segredos; guarda de staging-only; config local gitignored). `test_user_id: 170f8479-e2da-4a6d-b597-080716be9c20`. Passos confirmados: `admin_login`; `admin_active`; `fornecedor_resolved`; `create_synthetic_user` (senha P1); `self_reset_forbidden` (admin tenta resetar a própria senha → `403 SELF_RESET_FORBIDDEN`); `reset_not_found` (UUID inexistente → `404 NOT_FOUND`); `reset_synthetic_user` (senha P2 recebida, não impressa); `reset_flag_and_timestamp` (`senha_temporaria=true`, `senha_gerada_em` atualizado, comparado ao valor da criação); `old_password_rejected` (P1 não funciona mais — login esperado falhar, confirmado); `synthetic_login_new_password` (login com P2 ok, próprio token lê `senha_temporaria=true` — a guarda `A4.2` dispararia aqui no app real); `self_service_password_change` (P3 via `PATCH /auth/v1/user` + `PATCH /rest/v1/usuarios` self-service, mesmo caminho de `A4.2`); `flag_cleared_confirmed` (`senha_temporaria=false`, token admin); `relogin_no_gate` (login com P3 ok, `senha_temporaria=false` — "próximo login entra direto", sem gate); `cleanup_delete` (`admin-delete-user`, `deleted=true`); `cleanup_verify` (perfil ausente, cleanup zero confirmado).
- **Testes locais:** `node --check` PASS em todos os arquivos JS/TS/`.mjs` tocados/novos; `tests/admin-reset-user-password.smoke.js` (novo, estático) **23/23** — inclui simulação real de 1000 amostras da régua de senha com `crypto.randomBytes` (nunca menos de 8 caracteres, sempre ≥1 dígito), charset sem ambiguidade visual confirmado, nenhum `console.*` referenciando `newPassword`; `tests/admin-usuarios.smoke.js` estendido **29/29** (6 testes novos: namespaces, botão+guarda visual, `confirmDialog` com e-mail correto, fluxo de sucesso completo até "Senha gerada" com senha/copiar/aviso, fluxo de erro sem modal de senha, write isolado); regressão consolidada (9 suítes relacionadas: `admin-usuarios`, `admin-reset-user-password`, `boot`, `cadastros-screens`, `admin-create-user`, `auth-disable-user-schema`, `cadastros-usuarios-auth-ui`, `auth`, `trocar-senha-obrigatoria`) **268/275**, os 7 que falham confirmados idênticos ao baseline pré-existente (6 de `tests/auth.smoke.js` + 1 de `tests/cadastros-*`, nenhum novo). `git diff --check` limpo.
- **Verificação visual sem credenciais (preview local, sem login), aceita pelo arquiteto como evidência suficiente dispensando o gate de validação visual separado:** fluxo completo exercitado em navegador real (`window.supa` mockado localmente, nenhuma escrita real em staging) — botão → `confirmDialog` (título "Resetar senha", menciona o e-mail do alvo) → confirmar → `invoke('admin-reset-user-password', {user_id})` → modal "Senha gerada" com a senha/botão copiar/aviso confirmados via `textContent` real; guarda de auto-reset confirmada com valores reais de `.disabled` (`window.el(...).disabled`) no DOM real, não em mock de teste.
- **Achado fora de escopo — candidato `UI-EL-BOOLEAN-ATTR-FIX` (`NOT AUTHORIZED`, severidade `NÃO CONFIRMADA` — verificação do arquiteto pendente):** durante a implementação, o executor observou empiricamente em navegador real (`window.el('button', {disabled:false}, 'x').disabled === true`) que `js/ui.js`'s `el()` não trata boolean em `setAttribute` — `setAttribute('disabled', false)` marca o atributo presente em qualquer navegador real. Isso potencialmente afeta os botões "Desativar" (`disabled: user.ativo === false`) e "Excluir" (`disabled: !!(meId && user.id === meId)`) em `js/screens/admin-usuarios.js`, que poderiam ficar incorretamente desabilitados no caso comum (usuário ativo / não é o próprio admin) — mesma causa-raiz do resíduo já corrigido uma vez em `expedicao-admin.js` (fase "Admin/Pedido — Resíduo Estático do Botão de Conclusão"). **Por decisão do arquiteto, registrado como severidade NÃO CONFIRMADA — tratar como potencial regressão ativa até verificação direta do arquiteto nos botões Desativar/Excluir da tela de usuários em staging.** Não corrigido nesta fase (fora do manifesto de `A5.1-A5.2`, que proíbe explicitamente tocar `admin-disable/delete/create`). O botão de reset novo usa o padrão seguro (chave `disabled` só entra no objeto de attrs quando `true`), confirmado empiricamente no mesmo navegador.
- **Achado fora de escopo — candidato de decomposição (`CODE-HEALTH-AUDIT-§18-R1`):** `js/screens/admin-usuarios-modal.js` chegou a 576 linhas (acima do "aceitável" 500 de §7) ao acomodar o 4º modal (mesmo padrão dos 3 existentes: criar/editar, desativar, excluir). Não extraído para arquivo novo nesta fase — a ordem autorizou explicitamente `admin-usuarios-modal.js` como destino (item 3 do escopo), sem arquivo novo no manifesto (`PROIBIDO: qualquer necessidade fora do manifesto`).
- **STRUCTURAL POLICY COMPLIANCE:** §7 (tamanho — `admin-reset-user-password/index.ts` 267L, `admin-usuarios-writes.js` 239L, `admin-usuarios.js` 351L, todos abaixo do teto; `admin-usuarios-modal.js` 576L acima do aceitável, justificado acima); §9 (writes Supabase — write novo isolado `resetarSenha`, operação/payload/comportamento de erro documentados, teste smoke correspondente); §13 (testes — `node --check` + smoke da Edge Function 23/23 + smoke da UI 6 novos + regressão 268/275 com débito isolado); §14 (fases — escopo único: Edge Function + UI de ação, sem migration, sem tocar `admin-disable/delete/create`, sem `ban_duration`, sem reativação); §15 (Git — staging seletivo por caminho literal, 8 arquivos exatos, sem `add -A`/`reset`/`rebase`/push); §16 (documentação — este closeout + `docs/DOCUMENTATION_INDEX.md`).
- **Não implementado nesta fase (fora de escopo, não iniciado):** `A5.3-A5.4` (reativação, autorização própria futura); `A2.1` (schema `nivel_acesso`); `A6.1` (schema/trigger de auditoria); correção de `UI-EL-BOOLEAN-ATTR-FIX`.
- **Débitos preexistentes preservados (inalterados por esta fase):** `DB30_NOT_RECORDED_IN_SUPABASE_MIGRATION_HISTORY`; `AUTHENTICATED_BROWSER_SMOKE_NOT_EXECUTED`; `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE`; `G28-D`; `DELETE-PROD-GUARD-A`; `DELETE-AUDIT-LOG-A`; `G28-CAMADA-3`/`G28-CAMADA-4`; débito de teste de baseline de `A4.2` (6 testes de `tests/auth.smoke.js`); worktree `app-next` divergente/sujo.
- **Produção:** `bhgifjrfagkzubpyqpew` não acessada em nenhum momento. **Push:** não executado.
- **Estado final do worktree:** limpo; staging vazio; zero untracked (`supabase/.temp/` pré-existente, cache local da CLI do Supabase, não gerado por esta sessão).
- **Risco residual:** nenhum novo confirmado. `UI-EL-BOOLEAN-ATTR-FIX` é um achado NÃO CONFIRMADO (severidade pendente de verificação do arquiteto), registrado explicitamente para não ser esquecido, não tratado como bloqueio corrente.
- **Próxima fase indicada no fechamento:** `ARCHITECT DECISION` — candidatas: `A5.3-A5.4` (reativação), `UI-EL-BOOLEAN-ATTR-FIX` (pendente de confirmação), `A2.1` (schema `nivel_acesso`), `A6.1` (schema/trigger de auditoria). Nenhuma subfase autorizada por este registro.

## 2026-07-16 — DOC-LANGUAGE-MIGRATION-L1 — Translate governance documents to English (L1)

- **Gate:** `CLOSED / ACCEPTED`. Docs-only translation slice — no code, SQL, migration, Supabase, staging, production or push. First English-authored entry of the DOC-LANGUAGE-MIGRATION era; earlier entries are immutable and remain in their original language.
- **Front:** `DOC-LANGUAGE-MIGRATION`, batch `L1` (governance and rules), authorized by explicit architect order plus an addendum that distributes the language policy across the canonical homes.
- **Authorization:** architect order "ORDEM — DOC-LANGUAGE-MIGRATION-L1" (translation configured for Sonnet 5 / medium effort; audit as a separate high-effort pass) plus "ADENDO À ORDEM DOC-LANGUAGE-MIGRATION-L1". Runtime note: Sonnet 5 was unavailable in this environment (the model alias resolved to an inaccessible model), so the translate and audit passes ran on the session model instead — the two-pass structure and the medium-translate / high-audit effort split were preserved.
- **Accepted commit:** this closeout (`Translate governance documents to English (L1)`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Translated files (content to English; canonical paths, file names, anchors and cross-references unchanged):** `docs/architecture/CODE_HEALTH_RULES.md`, `docs/governance/SUPERVISION_PROTOCOL.md`, `docs/governance/DOCUMENTATION_MODEL.md`, `CLAUDE.md`. Each pt-BR original was moved, in this same commit, to `docs/archive/pt-BR/<original-path>` (byte-for-byte preservation, verified with `cmp`).
- **Preserved verbatim (not translated):** canonical status vocabulary (`CLOSED`, `ACCEPTED`, `NOT AUTHORIZED`, `AUTHORIZED`, `DEFERRED`, `PROPOSED`, `HARD STOP`, `READ-ONLY`, `STRUCTURAL POLICY COMPLIANCE`, the `PLAN_ALIGNMENT` label block); the architect's verbatim supervision-handoff block in `SUPERVISION_PROTOCOL.md` (Appendix, kept in Portuguese); the operational gate marker `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`; and `DOCUMENTATION_MODEL.md` §17 (already English). Role names were mapped ARQUITETO→ARCHITECT / PARECERISTA→REVIEWER / EXECUTOR RESIDENTE→RESIDENT EXECUTOR.
- **Language policy incorporated (addendum; English; same commit):** `DOCUMENTATION_MODEL.md` §18 "Language policy"; `CODE_HEALTH_RULES.md` §19 "Rule for language"; `SUPERVISION_PROTOCOL.md` §3 order-format language line; `CLAUDE.md` pointer-summary pointing to those canonical homes.
- **Index:** `docs/DOCUMENTATION_INDEX.md` updated — new §7 recording the DOC-LANGUAGE-MIGRATION track and the `docs/archive/pt-BR/` archive, plus provenance notes on the four translated rows. The index itself was kept in Portuguese (not in L1 scope; its own future slice).
- **Audit (separate high-effort pass, order step 3):** original × translation compared line by line on normative load (status, conditions, negations, quantifiers, prohibitions) and on structural fidelity. Divergences found and fixed: 1 by the audit pass (`DOCUMENTATION_MODEL.md` H1 title left in Portuguese → corrected) and 1 by the resident executor's final review (`CLAUDE.md` `**PROIBIDA**` left untranslated → `**FORBIDDEN**`). Structural invariants (heading count, code fences, table rows) match the originals; code fences byte-identical; no `[pt: ...]` pending items.
- **Verification:** `git diff --check` clean; archive copies byte-identical to originals (`cmp`); Portuguese-residue scan clean except the intended verbatim items above.
- **Residual risk:** none functional (docs-only). Non-blocking consistency note: `CODE_HEALTH_RULES.md` now carries 19 numbered rules; the "18 rules of modularization" descriptors (`DOCUMENTATION_MODEL.md` §2, `CLAUDE.md`, `docs/DOCUMENTATION_INDEX.md`) were left as-is because rule 19 is a language rule, not a modularization rule ("demais termos inalterados") — a count change is a one-line follow-up if the architect prefers it.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not generated by this session, not staged).
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — subsequent DOC-LANGUAGE-MIGRATION batches (`L2`+) are not authorized by this entry.

## 2026-07-16 — DOC-LANGUAGE-MIGRATION-L2 — Translate living state documents to English (L2)

- **Gate:** `CLOSED / ACCEPTED`. Docs-only translation slice — no code, SQL, migration, Supabase, staging, production or push. Second batch of the DOC-LANGUAGE-MIGRATION track (living state documents).
- **Front:** `DOC-LANGUAGE-MIGRATION`, batch `L2`, authorized by explicit architect order plus an amendment that replaced Rule 2.
- **Authorization:** architect order "ORDER — DOC-LANGUAGE-MIGRATION-L2" (translate pass Sonnet 5; separate mandatory Opus 4.8 high-effort audit, "think hard") plus "AMENDMENT TO DOC-LANGUAGE-MIGRATION-L2". Runtime note: Sonnet 5 was unavailable in this environment (its alias resolves to an inaccessible model) — the translate pass ran on session-model subagents (one per file; `PROJECT_STATE.md` split into 3 section-aligned chunks after a single-agent stall), and the mandatory Opus 4.8 high-effort audit was performed by the resident executor in the main context (precedent: L1 runtime deviation, accepted).
- **Amendment (Rule 2 replaced):** ALL content translated to English, including recorded architect decisions and previously-verbatim Portuguese blocks. Each translated Architect Decision record carries the provenance note `(translated from the architect's original Portuguese; original in docs/archive/pt-BR/)` (3 in `PROJECT_STATE.md`, 3 in `AGENT_HANDOFF.md`). The pt-BR archive remains the authoritative wording of those decisions in any nuance dispute.
- **Translated files (content to English; file names, anchors, paths, cross-references unchanged):** `PROJECT_STATE.md`, `AGENT_HANDOFF.md`. Each pre-L2 original was moved, in this same commit, to `docs/archive/pt-BR/<path>` (byte-for-byte, verified with `cmp`).
- **Language policy updated (amendment, same commit):** `DOCUMENTATION_MODEL.md` §18 reworded — "architect orders may be issued in Portuguese; once recorded in canonical documents they are recorded in English, with the original wording preserved in the ledger or archive"; `SUPERVISION_PROTOCOL.md` §3 language line aligned and its appendix supervision-handoff block translated to English (a template, not a signed decision; pt-BR original preserved in the L1 archive); `CLAUDE.md` language summary updated to match; `docs/DOCUMENTATION_INDEX.md` §7 intro + a new `L2` batch table + provenance notes on the two rows.
- **Kept verbatim:** canonical status vocabulary; the operational gate marker `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`; the front labels `Camada N`; user-facing pt-BR UI strings (`Concluir pedido`, `Último acesso`/`ULTIMO ACESSO`, `Senha gerada`, `Sair da conta`, `Desativar`, `Excluir`, `dd/mm/aaaa hh:mm`); phase IDs, commit SHAs, dates, environment refs, code identifiers; the already-English L1 block in `PROJECT_STATE.md` (reproduced byte-identical).
- **Audit (Opus 4.8, high effort, separate pass over the concatenated files):** SHAs and dates identical between originals and translations (set diff); status-token counts preserved (only intended pt→en increases, e.g. `DIFERIDO`→`DEFERRED`, `NÃO ACEITA`→`NOT ACCEPTED`; zero losses); structure intact (headings/fences/table-rows match; `PROJECT_STATE.md` −10 lines = wrapping compression, no content drop — verified 66/66 bold-label bullets identical); L1 block byte-identical; all 16 `AGENT_HANDOFF.md` section cross-references resolve to `PROJECT_STATE.md` headings. No `[pt: ...]` pending items.
- **Cross-seam terminology reconciled (chunk/agent divergences fixed to a single rendering):** `documental`→`documentation`/`document` (unified to the AGENT_HANDOFF rendering; note: L1 uses "documentary" — flagged, not re-edited); `Portal Cliente`→`Client Portal`; `Guarda`→`Guard` (the immutable commit message keeps `gate`); `Users`→`User Screen Extraction`; Last-Access-RPC-consumption word order unified.
- **Verification:** `git diff --check` clean; archive copies byte-identical (`cmp`); the commit message `Add mandatory password change gate` and the code field `documentary_history_blocker` preserved intact.
- **Accepted commit:** this closeout (`Translate living state documents to English (L2)`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — subsequent DOC-LANGUAGE-MIGRATION batches (`L3`+) are not authorized by this entry.

## 2026-07-16 — PROJECT-STATE-COMPACTION-A — Compact PROJECT_STATE to current-state-only

- **Gate:** `CLOSED / ACCEPTED`. Docs-only structural reorganization — no code, SQL, migration, Supabase, staging, production or push. `PROJECT_STATE.md` rewritten to current-state-only with no content loss.
- **Front:** living-state maintenance, authorized by explicit architect order "ORDER — PROJECT-STATE-COMPACTION-A" (paste-gated to run only after L2 was `CLOSED / ACCEPTED`).
- **Preceding follow-up (same session, commit `e980265`):** applied the two L2-acceptance rulings — unified the documentation term (`documental` → `documentation`/`document`, including re-editing committed L1 `docs/governance/DOCUMENTATION_MODEL.md` as explicitly authorized for this one term) and recorded the phase-ID naming rule in `DOCUMENTATION_MODEL.md` §18 (`Camada N` ↔ `G28-CAMADA-N`, never translated).
- **Result:** `PROJECT_STATE.md` **999 → 189 lines** (active phase / next action, binding decisions in force, live debts and candidates, environment/worktree standing facts, "Closed phases" index, mandatory links, historical-reference pointers).
- **Archive (new):** the historical phase-closeout narratives (former `PROJECT_STATE.md` lines 7–954 — 18 phase sections) moved verbatim, in original order, to `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`. Binding rulings from the three Architect Decision sections are restated (condensed) in `PROJECT_STATE.md` §"Binding decisions in force"; their full verbatim records remain in the archive and in `docs/archive/pt-BR/PROJECT_STATE.md`.
- **No content loss (block classification):** MOVE = former lines 7–954 → archive verbatim (948 lines); KEEP = former lines 1–6 (preamble) + 955–999 (Relevant debts, Historical reference, Mandatory links, legacy pre-model pointer) → carried into the new `PROJECT_STATE.md` (debts/links/reference near-verbatim; preamble and legacy pointer condensed with all facts preserved). Every former block accounted for.
- **AGENT_HANDOFF.md:** not compacted (per order). Its 17 "Full detail" pointers to former `PROJECT_STATE.md` sections were redirected to `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md`; a compaction note added at the top; the mandatory-reading `PROJECT_STATE.md` references left intact.
- **Index:** `docs/DOCUMENTATION_INDEX.md` §1c registers the archive file as preservation (not a current-state source).
- **Verification:** new `PROJECT_STATE.md` 189 lines (≤ ~300 target); archive 948 moved lines + header; canonical status tokens preserved; commit SHAs preserved; `git diff --check` clean; cross-references (mandatory links, archive pointer) resolve.
- **Accepted commit:** this closeout (`Compact PROJECT_STATE to current-state-only`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `ARCHITECT DECISION`. This phase satisfies the stated precondition for `DOC-LANGUAGE-MIGRATION-L3`, which remains `NOT AUTHORIZED` pending its own explicit order.

## 2026-07-16 — DOC-LANGUAGE-MIGRATION-L3 — Translate specs and plans to English (L3)

- **Gate:** `CLOSED / ACCEPTED`. Docs-only translation slice — no code, SQL, migration, staging, production or push. Final lot of the DOC-LANGUAGE-MIGRATION track for currently-scoped canonical documents.
- **Front:** `DOC-LANGUAGE-MIGRATION`, batch `L3`, authorized by explicit architect order after `PROJECT-STATE-COMPACTION-A` closed (stated precondition).
- **Authorization:** architect order "ORDER — DOC-LANGUAGE-MIGRATION-L3 (final lot: specs and plans)". Runtime note (accepted precedent from L1/L2): Sonnet 5 unavailable in this environment; translate pass ran on session-model subagents (large files split into section-aligned chunks by heading text, not line number, after two off-by-one line-citation errors were self-corrected by the agents matching on heading text); the mandatory high-effort whole-file audit was performed by the resident executor in the main context.
- **Scope — 19 files translated** (content only; file names, anchors, paths, cross-references unchanged): the 7 files named in the order (`CAMADA2_USUARIOS_SPEC_PROPOSED.md`, `DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`, `PEDIDO_PRODUCTION_FLOW_BACKLOG.md`, `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`, `PEDIDO_OP_SCHEMA_CONTRACT.md`, `BACKLOG_RECONCILIATION_R1_2026-07-15.md`, `CAMADA2_A32_MOCKUP_APPROVED.md`) plus, per architect scope ruling on the order's "plus any remaining pt-BR file in docs/" clause: 3 `docs/operations/` runbooks, 8 `docs/architecture/`+`docs/ui/` living contracts, and `docs/DOCUMENTATION_INDEX.md` itself (the arbiter — not previously touched in L1/L2). Each pt-BR original moved, same commit, to `docs/archive/pt-BR/<path>` (byte-for-byte, verified with `cmp`, all 19 identical).
- **Explicitly excluded from L3 (architect ruling, remain pt-BR):** `docs/qa/*` and `docs/superpowers/*` (18 files, self-classified `NÃO GUIAM EXECUÇÃO` / one subfolder flagged dangerous for AI to follow literally — historical/quarantined, same class as ledgers/archive); the root `docs/*.md` legacy files in the same `DOCUMENTATION_INDEX.md` §4 "Docs legadas" table (`DEPLOYMENT.md`, `AI_AGENT_RULES.md`, `BACKUP_AND_RESTORE.md`, `HANDOFF.md`, `STAGING_BASELINE.md`); `docs/legacy/pre-model/*.md` (byte-immutable snapshots with a recorded SHA-256 — translating would violate their own immutability guarantee, not literally named in the order's exclusion list but in direct conflict with a separate binding rule); `docs/releases/G28_D_RELEASE_CANDIDATE.md` (already English, 0 pt-BR content found).
- **Kept verbatim:** canonical status vocabulary; the gate marker `IMPLEMENTAÇÃO VALIDADA / AGUARDANDO VALIDAÇÃO VISUAL DO ARQUITETO`; front labels `Camada N`; user-facing pt-BR UI strings; phase/decision IDs, commit SHAs, dates, environment refs, code/SQL identifiers; fenced code blocks reproduced byte-for-byte (including literal order-format blocks such as the G28-P0/PLAN_ALIGNMENT-style blocks and one "Ready-to-issue order for G11-B" block in `DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md`, flagged as a discretionary preserved-verbatim judgment call for architect review).
- **Structural check (before audit, per order):** all 19 files — heading count, fence count, and table-row count identical original vs. translation, verified before and after every subsequent fix. Line-count deltas (−86 to +9 lines) fully explained: wrapping compression/expansion, never a content drop (spot-verified in depth on the largest delta, `PEDIDO_OP_SCHEMA_CONTRACT.md` −86 lines/−11%, by direct side-by-side reading of its largest section, all 24 decision IDs present).
- **Audit (whole-file, high effort, resident executor):** SHAs and dates identical (set diff) across all 19 files, zero mismatches. Full read-and-compare of the two highest-normative-stakes files: `BACKLOG_RECONCILIATION_R1_2026-07-15.md` (ratified reference baseline; §6 divergence verdicts D1–D7 verified clause-by-clause, zero drift on any negation/quantifier/judgment) and `docs/DOCUMENTATION_INDEX.md` (the arbiter; full read).
- **Divergences found and corrected (cross-file terminology + line-wrap false positives + real gaps):**
  - `documental` (adjective) reappeared in 4 files (translate-pass regression vs. the L2 architect ruling) — swept and unified to `documentation`/`document` across all 19 files (0 remaining).
  - `Atualizacao` vs. `Update` section-heading inconsistency across 4 files — unified to `Update` (majority rendering; the one file forced to keep it verbatim by an over-specific instruction was corrected).
  - `Portal Cliente` leftover in 3 files — unified to `Client Portal`.
  - `Pedido`/`Order` inconsistency within `CLIENTE_PORTAL_UI_GAP_INVENTORY.md` (its own §4 vs. §6, from two different chunk agents) — unified to `Pedido` (the file's and project's dominant rendering).
  - 3 instances of a canonical multi-word status token (`NOT AUTHORIZED`) split across a markdown line-wrap (present in 2 files; 1 pre-existing in the pt-BR original itself, 2 introduced by translation reflow) — rejoined for grep-ability; a systematic re-scan across all 19 files for the same pattern on 11 tokens found zero further instances.
  - **8 table-header rows left in Portuguese** (`Documento`→`Document`, `Arquivo`→`File`, `Papel`→`Role`, `Propósito`→`Purpose`, `Categoria`→`Category`, `Fase`→`Phase`) in `docs/DOCUMENTATION_INDEX.md`, plus **6 more** of the same defect class found by a full-file sweep in `CAMADA2_USUARIOS_SPEC_PROPOSED.md` and `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (content/prose correctly translated, header row left pt-BR) — all 14 fixed; re-swept to zero across all 19 files.
  - Broader residual-Portuguese-prose sweep (connector words, common verbs) across all 19 files: every hit traced to a legitimate cause (quoted pt-BR UI string, fenced code block preserved verbatim) — no further translation gaps found.
- **`docs/DOCUMENTATION_INDEX.md` self-update (same file, same commit):** §7 gained a `Batch DOC-LANGUAGE-MIGRATION-L3` table (19 rows) plus a note recording the excluded-file categories above; §1/§1c/§1d rows for the 4 previously-untranslated-index-referenced files (`DOCUMENTATION_MODEL.md`, `SUPERVISION_PROTOCOL.md`, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `CODE_HEALTH_RULES.md`, `CLAUDE.md`) already carried provenance notes from L1/L2 and were left as-is; new `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` (from `PROJECT-STATE-COMPACTION-A`) already indexed in §1c.
- **No `[pt: ...]` pending items** — no phrase was too ambiguous to translate with certainty across all 19 files.
- **Verification:** `git diff --check` clean (only pre-existing Markdown hard-break trailing-space markers, confirmed present in the pt-BR originals too, not introduced); archive copies byte-identical (`cmp`, all 19); structural counts (headings/fences/tables) identical original vs. final translation for all 19 files after every fix.
- **Accepted commit:** this closeout (`Translate specs and plans to English (L3)`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `ARCHITECT DECISION`. `DOC-LANGUAGE-MIGRATION` closes for the currently-scoped canonical documents; any translation of the excluded historical/quarantined categories requires its own future order.

## 2026-07-16 — DOC-LANGUAGE-MIGRATION-L3-FOLLOWUP — Translate G11-B historical order block

- **Gate:** `CLOSED / ACCEPTED`. Docs-only follow-up to L3 — no code, SQL, migration, staging, production or push.
- **Front:** `DOC-LANGUAGE-MIGRATION`, small follow-up to batch `L3`, authorized by explicit architect ruling on the one item flagged for review in the L3 report.
- **Scope:** `docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md` §5, "Ready-to-issue order for G11-B (next IAExecutor)" — the one fenced block in the L3 scope left in Portuguese as a discretionary "preserve fenced content verbatim" judgment call. Architect ruling: translate it, with the standard provenance note. Translated (labels, prose, "Do not" list, section title) while keeping verbatim: phase ID, commit SHAs (`381506c`, `956682d`), branch/file names, function names, namespace, test commands, and — per the file's own established convention elsewhere — the quoted literal UI section name (`"Documentos Recebidos"`), status-enum literals (`Aceito`/`Pendente`/`Rejeitado`), and domain direction/type literals (`Entrada`/`Saída`, `NF`/`Romaneio`). Provenance note `(translated from the architect's original Portuguese; original in docs/archive/pt-BR/)` added under the heading — the byte-identical pt-BR original was already archived in the `L3` commit (`77c8243`) and remains authoritative for any nuance dispute.
- **Permanent exclusion ratified (`DOCUMENTATION_MODEL.md` §18):** the `docs/legacy/pre-model/*` immutability exclusion — flagged as a discretionary judgment call in the `L3` report (not literally named in that order's exclusion list, but in direct conflict with the separate binding immutability rule for those SHA-256-anchored snapshots) — is now recorded as a permanent, standing exclusion alongside ledgers/`docs/handoffs/`/`docs/archive/`, together with `docs/qa/*`, `docs/superpowers/*`, and the root `docs/*.md` legacy files (already excluded by ruling in `L3`).
- **Verification:** fence count and heading count unchanged in the touched file; no residual Portuguese prose outside the deliberately-kept literals; `git diff --check` clean.
- **Accepted commit:** this closeout (`Translate G11-B historical order block`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Track closure — `DOC-LANGUAGE-MIGRATION`: `COMPLETE`.** `L1` (governance: `CODE_HEALTH_RULES.md`, `SUPERVISION_PROTOCOL.md`, `DOCUMENTATION_MODEL.md`, `CLAUDE.md`) + `L2` (living state: `PROJECT_STATE.md`, `AGENT_HANDOFF.md`) + `L3` (19 files: the remaining active specs/plans/contracts/reports/runbooks + the `DOCUMENTATION_INDEX.md` arbiter itself) + this follow-up (the one remaining historical order block) together translate every currently-scoped canonical document to English. `docs/qa/*`, `docs/superpowers/*`, the root `docs/*.md` legacy files, and `docs/legacy/pre-model/*` are permanently excluded — quarantined (historical, self-classified as not guiding execution) or immutable (SHA-256-anchored snapshots) by standing rule in `DOCUMENTATION_MODEL.md` §18, not by omission. **`DOC-LANGUAGE-MIGRATION-L4` and any further batch: `NOT AUTHORIZED`** — reopening translation of an excluded category requires its own future architect order.

## 2026-07-16 — A5.3-A5.4 — Add admin user reactivation

- **Gate:** `CLOSED / ACCEPTED`. New Edge Function + UI action (§14 `CODE_HEALTH_RULES.md`) — no migration, no boot, no production.
- **Front:** `G28-CAMADA-2`, subphase `A5.3-A5.4` of `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`, authorized in parallel with `A5.1-A5.2` per the subphase/gate table. Completes the `A5` track (reset + reactivation).
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASE A5.3-A5.4"), Sonnet 5 / medium effort (Edge Function mirroring `admin-disable-user` with one new Admin API parameter, `ban_duration: 'none'`).
- **Technical commit:** `f886e26` — `Add admin user reactivation` (`supabase/functions/admin-reactivate-user/index.ts`, `supabase/functions/admin-reactivate-user/README.md`, `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios.js`, `js/screens/admin-usuarios-modal.js`, `scripts/staging/admin-reactivate-e2e.mjs`, `tests/admin-reactivate-user.smoke.js`, `tests/admin-usuarios.smoke.js`).
- **Documentation commit:** this closeout (`Close admin user reactivation phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Edge Function `admin-reactivate-user` (symmetric counterpart of `admin-disable-user`):** JWT→active admin (`tipo='admin' AND ativo=true`)→payload; `SELF_REACTIVATE_FORBIDDEN` if `target_id === caller_id` (practically unreachable, guarded for symmetry); fetches the target in `public.usuarios` (`NOT_FOUND` if absent); requires the target to be inactive (`REACTIVATE_NOT_INACTIVE` otherwise — deliberately **not** idempotent, unlike `admin-disable-user`'s `already_disabled`: reactivating an already-active user is a caller error, there is no ambiguous "already reactivated" state to collapse into); `UPDATE usuarios SET ativo=true, desativado_em=null, desativado_por=null, motivo_desativacao=null WHERE id=target_id`; `auth.admin.updateUserById(target_id, {ban_duration:'none'})`; returns `{user_id, email, tipo, ativo:true, auth_banned:false}`.
- **Compensation on partial failure:** if the Auth unban call fails after the profile has already been marked `ativo=true`, the function reverts to the *exact* previous inactive state — `desativado_em`/`desativado_por`/`motivo_desativacao` are read and preserved **before** the update, not re-stamped with new values — returning `AUTH_UNBAN_FAILED`; if the reversion itself fails, `COMPENSATION_FAILED` (manual action required). Same design pattern as `admin-disable-user`'s compensation.
- **`js/admin-usuarios-writes.js`:** `reativarUsuario(userId)` — `supa.functions.invoke('admin-reactivate-user', {body:{user_id}})`; `friendlyReactivateMessage(code, fallback)` mapping the error codes to PT-BR.
- **`js/screens/admin-usuarios.js`:** inactive rows swap the ban icon for a refresh icon in the same action slot (safe boolean-attr pattern — no `disabled` key on this button in either state, which incidentally also cleared the `UI-EL-BOOLEAN-ATTR-FIX` risk for this specific control, see finding below).
- **`js/screens/admin-usuarios-modal.js`:** `openReativarModal(usr, {onDone})` — `window.confirmDialog` (non-destructive, `danger:false`), message cites the target's e-mail; success → toast; error → toast + `friendlyReactivateMessage`, no ambiguous state.
- **Deploy of the Edge Function: executed by the architect** directly in staging (`ucrjtfswnfdlxwtmxnoo`) — outside the credential reach of this session (AI agent does not enter password/token/API key in any field, permanent rule).
- **Post-deploy verification — real E2E in staging, `result: PASS` (13/13 steps), executed by the architect** via `scripts/staging/admin-reactivate-e2e.mjs` (`test_user_id: 860b6fea-ac9e-45b1-8b85-9cfa255020e4`). Steps confirmed: `admin_login`; `admin_active`; `fornecedor_resolved`; `create_synthetic_user`; `synthetic_login_before_disable`; `disable_synthetic_user` (`ativo=false`, `auth_banned=true`, existing `admin-disable-user` flow); `login_blocked_after_disable` (HTTP 400, banned); `reactivate_synthetic_user` (`ativo=true`, `auth_banned=false`); `profile_flags_cleared` (`desativado_em`/`desativado_por`/`motivo_desativacao` all `null`); `login_restored`; `reactivate_not_inactive_guard` (`REACTIVATE_NOT_INACTIVE` on the now-active target); `cleanup_delete`; `cleanup_verify` (zero cleanup confirmed).
- **Local tests:** `node --check` PASS on all touched/new files; `tests/admin-reactivate-user.smoke.js` (new, static) **22/22**; `tests/admin-usuarios.smoke.js` extended **35/35** (6 new tests: icon swap by `ativo` state, `confirmDialog`, full success flow, error flow, isolated write); consolidated regression across the touched suites (`admin-usuarios`, `admin-reactivate-user`, `admin-disable-user`, `admin-reset-user-password`, `boot`, `cadastros-screens`) **195/195**, no regressions. `git diff --check` clean.
- **Architect visual validation:** Desativar button on an active user **confirmed working** in staging.
- **Finding — `UI-EL-BOOLEAN-ATTR-FIX` severity updated from `NOT CONFIRMED` to `CONFIRMED — ACTIVE REGRESSION`:** while validating the Reativar flow, the architect found that a disabled user disappears from the Usuários screen and stays gone even with "Mostrar inativos" checked — the checkbox does not visually reflect its real state and appears to always render checked. Root cause diagnosed: `js/screens/admin-usuarios.js`'s toggle passes `checked: mostrarInativos` straight into `window.el()`, which calls `node.setAttribute('checked', mostrarInativos)` unconditionally; since `renderStandalone()` creates a brand-new `<input>` on every re-render, the `checked` attribute is always present as a string (`"true"`/`"false"`), and HTML boolean attributes are true-by-presence regardless of value — so the fresh checkbox always renders checked, independent of the actual `mostrarInativos` state. Same root cause as the `disabled="null"` residue already fixed once in `expedicao-admin.js`, now empirically reproduced via a second control. The Excluir button in the same file (`disabled: !!(meId && user.id === meId)`) carries the identical pattern and is unconfirmed but suspect. Not fixed in this phase (outside the `A5.3-A5.4` manifest; mixing diagnosis with a patch here would violate `CODE_HEALTH_RULES.md` §14). Recorded as the priority `ARCHITECT DECISION` candidate.
- **Finding unchanged — decomposition candidate (`CODE-HEALTH-AUDIT-§18-R1`):** `js/screens/admin-usuarios-modal.js` grew from 576 to 604 lines accommodating the 5th modal (`openReativarModal`); already a recorded candidate, no action taken.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **A5 track closure:** `A5.1-A5.2` (administrative password reset) + `A5.3-A5.4` (user reactivation) together close the full `A5` track (reset + blocking + reactivation) of `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`.
- **Next phase indicated at closeout:** `ARCHITECT DECISION` among `UI-EL-BOOLEAN-ATTR-FIX` (now `CONFIRMED — ACTIVE REGRESSION`, recommended priority), `A2.1` (`nivel_acesso` schema) and `A6.1` (audit schema/trigger). `A3.4` unlocks once the remaining `A2`/`A6` subphases close.

## 2026-07-16 — UI-ACTION-BUTTON-CONTRACT-AMENDMENT (phase i) — Amend UI visual contract with row-level icon button spec

- **Gate:** `CLOSED / ACCEPTED`. Docs-only — no code, SQL, migration, staging, production or push. Phase `i` of the `UI-ACTION-BUTTON` track.
- **Front:** follow-up to the read-only `UI-ACTION-BUTTON-CONFORMANCE-DIAGNOSIS` (architect observed the Users screen's action buttons diverge in shape/size from the Clients screen).
- **Authorization:** explicit architect order ("ORDER — UI-ACTION-BUTTON-CONTRACT-AMENDMENT (phase i)"), session model / low effort — content fully ratified by the architect beforehand, mechanical transcription.
- **Diagnosis finding recorded:** `docs/architecture/UI_VISUAL_CONTRACT.md` §8 "Buttons" already had an explicit rule ("Destructive (Excluir): always icon + text, never icon only") written from the two approved pilots' (`op-latex-admin.js`/`op-tecelagem-producao-admin.js`) entity-level header actions — but no spec at all for the compact row-level icon button used by nearly every list/grid screen (admin-usuarios.js, the 5 cadastros.js screens, ops-list.js, pedidos-list.js, documentos-recebidos.js, pedido-detail-render.js), which is icon-only everywhere and therefore in literal conflict with the written destructive-button rule.
- **Architect ruling (conflict resolution):** Option A — add a `COMPONENT-SPECIFIC` carve-out for the row-level compact icon button, exempt from the destructive icon+text rule; that rule remains binding for entity-level header actions (unchanged).
- **§8.1 added** (`docs/architecture/UI_VISUAL_CONTRACT.md`): ratified against the Clients screen reference (`js/screens/cadastros.js` `screenCadastrosClientes`'s `makeIconButton`). Mandatory guards for the exemption: title tooltip + `aria-label`; screen-reader label via the clip-rect sr-only pattern (never `display:none`); `confirmDialog` gating on any destructive row action. Ratified values: 30×30px; radius `--rv-radius-control` (4px); border `1px solid #eceef1` / background `#fff` (rest); color `#8a93a3` (neutral) / `#d6403a` (danger); icon 14px per §13; gap 6px; hover neutral `border-color:#d0d5de;color:#3f4757`; hover danger `border-color:#fca5a5;background:#fff1f1;color:#c53030` (the Clientes/Modelos variant, not Cores/Fornecedores' `#fff5f5`/`#d6403a`); disabled via the safe boolean pattern (key present only when `true`, per `UI-EL-BOOLEAN-ATTR-FIX`).
- **§0.2 taxonomy updated:** "row-level compact icon button" added to the `COMPONENT-SPECIFIC` list, cross-referencing §8.1 and noting entity-level header actions are excluded from the carve-out.
- **`PROJECT_STATE.md` registered:** `UI-ACTION-BUTTON` track — phase `i` `CLOSED / ACCEPTED` (this record); phase `ii` (`actionButton()` helper in `js/ui.js`, additive, zero screens migrated) and phase `iii` (per-screen migrations, priority order per the diagnosis) `NOT AUTHORIZED`, each pending its own order. Registered candidates, not started: `MODAL-BUTTON-CSS-CHECK` (read-only — `document-link-admin-modal.js`/`documentos-recebidos-decision-modal.js` render buttons with no inline style, deferred to external CSS classes not found in the repo); `fornecedor.js` visual redesign (separate future track).
- **`DOCUMENTATION_INDEX.md`:** no update needed — `UI_VISUAL_CONTRACT.md` has no separate §1 content-description entry to amend, only its L3 translation-provenance row (unaffected by this content change).
- **Accepted commit:** this closeout (`Amend UI visual contract with row-level icon button spec`). Consult the actual HEAD with `git rev-parse HEAD`.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `UI-ACTION-BUTTON-HELPER` (phase `ii`) — already authorized in the same architect message as its own order, to be executed and closed separately.

## 2026-07-16 — UI-ACTION-BUTTON-HELPER (phase ii) — Add actionButton primitive per visual contract

- **Gate:** `CLOSED / ACCEPTED`. Additive-only code, new primitive in `js/ui.js` — no screen migrated, no other primitive touched, no push. Phase `ii` of the `UI-ACTION-BUTTON` track.
- **Front:** follow-up to phase `i` (`UI-ACTION-BUTTON-CONTRACT-AMENDMENT`, commit `f30aa0d`, `CLOSED / ACCEPTED`).
- **Authorization:** explicit architect order ("ORDER — UI-ACTION-BUTTON-HELPER (phase ii)"), session model / medium effort (new primitive, small surface, app-wide future blast radius — the smoke is the gate).
- **Technical commit:** `bbfd58c` — `Add actionButton primitive per visual contract` (`js/ui.js`, `tests/ui-action-button.smoke.js`).
- **Documentation commit:** this closeout (`Close actionButton primitive phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **`actionButton({ title, icon, danger, disabled, onclick, srLabel })`:** implements §8.1 verbatim — 30×30px; radius 4px (`--rv-radius-control`); border `1px solid #eceef1` / background `#fff` at rest; color `#8a93a3` (neutral) / `#d6403a` (danger); 14px icon slot (caller-supplied DOM Node); hover via `mouseenter`/`mouseleave` (neutral `border-color:#d0d5de;color:#3f4757`; danger `border-color:#fca5a5;background:#fff1f1;color:#c53030`), restored on `mouseleave`; safe boolean `disabled` pattern (the `disabled` key is present in the attrs object only when `true`, per `UI-EL-BOOLEAN-ATTR-FIX`), `opacity:0.45`/`cursor:default` while disabled; mandatory screen-reader label via the clip-rect sr-only pattern (never `display:none`, the exact defect found in `ops-list.js` during the conformance diagnosis).
- **API note:** `confirmDialog` gating on destructive actions is the caller's duty, not the helper's — documented in the header comment, per the §8.1 guard requiring confirmation before any destructive row action executes.
- **No API ambiguity found** against §8.1 as written — no `HARD STOP` raised.
- **Zero call sites migrated** — purely additive, as scoped; `el()` and every other `js/ui.js` primitive untouched.
- **Local tests:** `node --check` PASS on both touched/new files; `tests/ui-action-button.smoke.js` (new, unit) **14/14** — dimensions/rest-state attrs; sr-only label present via clip-rect and never `display:none`; `disabled` attribute present only when `disabled:true` (using the DOM-coercion-aware double introduced for `UI-EL-BOOLEAN-ATTR-FIX`, i.e. `hasAttribute`-based, not raw `setAttribute` value); both hover variants restored on `mouseleave`; `onclick` wired via `addEventListener` and absent when disabled.
- **Full regression — in-place stash-verified** (same method as `UI-EL-BOOLEAN-ATTR-FIX`, not `git worktree`, to avoid the CRLF checkout artifact found in that phase): before (js/ui.js reverted, new test file moved aside) `3634` tests / `3473` pass / `161` fail; after `3648` tests / `3487` pass / `161` fail — exactly the 14 new tests added, all passing; the 161 failing test names are byte-identical before/after (`diff` confirmed). The `161` count (vs. an earlier session's `156`) is entirely `tests/write-guard.smoke.js` `ECONNREFUSED 127.0.0.1:8765` noise — those 5 tests require a local static file server on port 8765 not running in this shell; reproduced identically with `js/ui.js` fully reverted, confirming zero relation to this change.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `UI-ACTION-BUTTON-MIGRATION-1` (phase `iii`, screen lot 1 — `pedidos-list.js` + `cliente-pedidos-list.js`) — authorized in the same architect message as this closeout, in progress. Lot 2 (`ops-list.js`, with its `display:none` sr-only fix) and beyond remain `NOT AUTHORIZED`, pending their own orders.

## 2026-07-16 — UI-ACTION-BUTTON-MIGRATION-1 (phase iii, lot 1) — Migrate order lists to actionButton

- **Gate:** `CLOSED / ACCEPTED`. Refactor-to-conformance (§14 — no features). Phase `iii`, lot `1` of the `UI-ACTION-BUTTON` track.
- **Front:** follow-up to phase `ii` (`UI-ACTION-BUTTON-HELPER`, commit `bbfd58c`, `CLOSED / ACCEPTED`).
- **Authorization:** explicit architect order ("ORDER — UI-ACTION-BUTTON-MIGRATION-1 (phase iii, screen lot 1)"), session model / medium effort.
- **Technical commit:** `31b66af` — `Migrate order lists to actionButton` (`js/screens/pedidos-list.js`, `js/screens/cliente-pedidos-list.js`, `tests/pedidos-list.smoke.js`, `tests/cliente-pedidos-list.smoke.js`).
- **Documentation commit:** this closeout (`Close order lists migration phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Migrated call sites:** `pedidos-list.js` — `rowActions()` (eyeBtn "Visualizar", deleteBtn "Excluir Pedido") and `navBtn()` (pagination ◀/▶); `cliente-pedidos-list.js` — row `eyeBtn` ("Ver pedido") and `navBtn()`. All rebuilt via `window.actionButton()` per §8.1: 30×30px, radius 4px, border `#eceef1`/bg `#fff`, 14px icons (shrunk from 17px), hover, safe boolean `disabled`, mandatory sr-only label. Row-actions gap tightened 8px→6px per the ratified spec.
- **Same handlers/gating preserved:** `pedidos-list.js`'s Excluir keeps calling `excluirPedido()` → `RAVATEX_DELETE.excluirPedidoComFluxo()`, which already gates the destructive action via `showDeleteConfirmation` (`js/delete-helpers.js`) — no redundant `confirmDialog` wrapper added.
- **A11y conformance gain (not a feature):** both screens' pagination nav buttons had no accessible name before migration; they now carry `title`="Página anterior"/"Próxima página" plus the mandatory sr-only label, for free from the primitive.
- **Two judgments ratified by the architect at this closeout, standing for all remaining lots:** (1) existing domain-specific confirmation flows satisfy the §8.1 destructive guard without a redundant `confirmDialog` wrapper; (2) §8.1 dimension/sr-only/disabled correctness is proven once at the `actionButton()` primitive level — screen-level smokes assert call-site routing (correct args passed) only, not the primitive's internals.
- **Local tests:** `node --check` PASS on all 4 touched files. Both smokes extended with static conformance checks, matching their pre-existing 100%-static testing style (neither had runtime DOM rendering or old-style assertions to replace — new conformance assertions added instead): call sites route through `window.actionButton()` with the right `title`/`danger`/`disabled`/`onclick`; old 3px-radius/17px-icon/imperative-style-override patterns confirmed absent; destructive handler confirmed unchanged, no `window.confirm` introduced.
- **Full regression — in-place stash-verified:** before `3648` tests / `3492` pass / `156` fail; after `3660` / `3504` / `156` — exactly the 12 new tests added, all passing; the 156 failing test names byte-identical before/after (`diff` confirmed).
- **Architect visual validation — CONFIRMED:** both `#/pedidos` and `#/cliente/pedidos` validated against the Clients screen reference.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `UI-ACTION-BUTTON-MIGRATION-2` (phase `iii`, lot `2` — `admin-usuarios.js` users screen + `ops-list.js`, including its sr-only `display:none` a11y fix) — authorized by explicit architect order in the same message as this closeout, in progress. Addendum honored from the architect's preceding message: report the users screen's ACOES column resolved width (4 buttons, ~138px at spec size); a one-line grid-template fix is in scope only if the row compresses. Lot `3` (`cadastros.js`) and beyond remain `NOT AUTHORIZED`, pending their own orders.

## 2026-07-16 — UI-ACTION-BUTTON-MIGRATION-2 (phase iii, lot 2) — Migrate users and ops screens to actionButton

- **Gate:** `CLOSED / ACCEPTED`. Refactor-to-conformance (§14 — no features). Phase `iii`, lot `2` of the `UI-ACTION-BUTTON` track.
- **Front:** follow-up to lot `1` (`UI-ACTION-BUTTON-MIGRATION-1`, commit `31b66af`, `CLOSED / ACCEPTED`).
- **Authorization:** explicit architect order ("ORDER — UI-ACTION-BUTTON-MIGRATION-2 (users screen + ops-list)"), session model / medium effort. An addendum from the architect's preceding message (not repeated in the formal order text, but not contradicted either) was honored: report the users screen's ACOES column resolved width; a one-line grid-template fix in scope only if the row compresses.
- **Technical commit:** `abfb95e` — `Migrate users and ops screens to actionButton` (`js/screens/admin-usuarios.js`, `js/screens/ops-list.js`, `tests/admin-usuarios.smoke.js`, `tests/ops-list-screen.smoke.js`).
- **Documentation commit:** this closeout (`Close users and ops screens migration phase`). The current HEAD must be consulted with `git rev-parse HEAD`.
- **Migrated call sites:** `admin-usuarios.js` — the 4 row actions (Editar, Resetar senha, Desativar/Reativar icon-swap, Excluir); `ops-list.js` — row actions (Editar/Ver, Excluir OP) and pagination `navBtn()`. All rebuilt via `window.actionButton()` per §8.1 — same handlers, same modal/`confirmDialog` gating, same disabled self-guards, same icon-swap logic preserved; only the button rendering changed.
- **`ops-list.js` a11y fix:** the recorded sr-only `display:none` divergence (hides the label from assistive tech too) is now the correct clip-rect pattern, provided natively by `actionButton()`.
- **`ops-list.js` Excluir OP conformance gain:** now `danger` (red), matching every other Excluir action already migrated — was neutral gray before.
- **Column-sizing fix (addendum, ratified in scope):** the users screen's ACOES column was hardcoded `102px`; 4 `actionButton()`s need `30×4 + 6×3 = 138px`. Widened via the single shared `gridTemplate` variable (both header row and data rows), no other layout change.
- **A11y conformance gain (not a feature):** `ops-list.js`'s pagination nav buttons had no accessible name before migration; now carry `title`="Página anterior"/"Próxima página".
- **Local tests:** `node --check` PASS on all 4 touched files. `admin-usuarios.smoke.js` extended with 3 new tests (sr-only clip-rect on all 4 buttons; danger/neutral colors confirmed correct per button; ACOES grid-template confirmed `138px`) — all 39 pre-existing tests kept passing unmodified. `ops-list-screen.smoke.js`'s `FakeNode` gained `removeAttribute`/`hasAttribute` (defense-in-depth, matching the established `UI-EL-BOOLEAN-ATTR-FIX` fix pattern, though not exercised by any current call site); extended with 5 new tests (sr-only clip-rect never `display:none`; danger color on Excluir OP; handler/gating unchanged; pagination titles present; icons confirmed 14px) — all 19 pre-existing-passing tests kept passing; the 11 pre-existing failures (index-inline-related) confirmed via stash-diff to predate this change, unchanged.
- **Full regression — in-place stash-verified:** before `3660` tests / `3499` pass / `161` fail; after `3668` / `3507` / `161` — exactly the 8 new tests added, all passing; the 161 failing test names byte-identical before/after (`diff` confirmed).
- **Architect visual validation — CONFIRMED:** users screen validated against the Clients reference (the original complaint's own test); `#/ops` spot-checked.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** lot `3` (`cadastros.js`) — `NOT AUTHORIZED`, pending its own order. Registered candidates unchanged: `MODAL-BUTTON-CSS-CHECK` (read-only), `fornecedor.js` visual redesign (separate track).

## 2026-07-16 — UI-USERS-GRID-TEXT-OVERFLOW — Add text overflow ellipsis to users grid

- **Gate:** `CLOSED / ACCEPTED`. UI refinement, presentation-only (§14 — no refactor, no logic changes). Users screen only.
- **Front:** follow-up to `UI-ACTION-BUTTON-MIGRATION-2` (users screen), documentation closeout folded into the same phase per explicit architect order (low-effort, mechanical CSS fix).
- **Authorization:** explicit architect order ("ORDER — UI-USERS-GRID-TEXT-OVERFLOW"), session model / low effort.
- **Technical + documentation commit:** `3e95e86` — `Add text overflow ellipsis to users grid` (`js/screens/admin-usuarios.js`, `tests/admin-usuarios.smoke.js`).
- **Fix:** E-MAIL/NOME/FORNECEDOR/CLIENTE grid cells truncate to a single line with an ellipsis (`white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0`), consistent across header and data rows. Each truncated cell carries a `title` attribute with the full value — omitted when the displayed text is the `—` fallback, to avoid a useless tooltip. New local pure helper `truncatedCell(displayText, rawValue, colorStyle)` reused across the 4 cells.
- **Resulting grid template (reported per order item 3):** `2fr 1fr 110px 1fr 1fr 90px 130px 138px` — E-MAIL widened `1.3fr`→`2fr`; NOME/FORNECEDOR/CLIENTE unchanged at `1fr`; TIPO/STATUS/ULTIMO ACESSO/ACOES (`138px`, from `UI-ACTION-BUTTON-MIGRATION-2`) unchanged.
- **No data/handler/button change** — pure CSS + a `title` attribute.
- **Local tests:** `node --check` PASS. `tests/admin-usuarios.smoke.js` extended with 4 new tests (exact grid-template match; E-MAIL nowrap/overflow/ellipsis/min-width + full-value title on a long synthetic address, full text confirmed still present in the DOM; NOME/FORNECEDOR/CLIENTE same treatment with title absent on `—` cells; header cells carry the same truncation treatment, TIPO/STATUS confirmed without ellipsis); one pre-existing test's grid-template filter regex updated (`1\.3fr`→`2fr`) to match the new leading fraction, no assertion semantics changed. All 42 pre-existing tests kept passing.
- **Full regression — in-place stash-verified:** before `3668` tests / `3512` pass / `156` fail; after `3672` / `3516` / `156` — exactly the 4 new tests added, all passing; the 156 failing test names byte-identical before/after (`diff` confirmed).
- **Architect visual gate:** not independently re-verified by the agent — no live/staging browser session available in this environment (standing limitation). The architect's own quick check (long synthetic email truncates with "…", hover shows the full address, no row-height jump, no horizontal scroll) is the operative verification for this phase.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — no single unambiguous candidate; `UI-ACTION-BUTTON` lot `3` (`cadastros.js`), `A2.1`, `A6.1` remain on the table, none authorized by this record.

## 2026-07-16 — UI-GRID-TEXT-CONTRACT-AMENDMENT — Amend UI visual contract with grid text overflow rule

- **Gate:** `CLOSED / ACCEPTED`. Docs-only phase (§14 — no code change).
- **Front:** follow-up to a read-only diagnosis order (`UI-GRID-TEXT-OVERFLOW-DIAGNOSIS`) that inventoried every list/grid screen for text-column overflow behavior, using the ratified `UI-USERS-GRID-TEXT-OVERFLOW` fix (`admin-usuarios.js`, commit `3e95e86`) as the candidate pattern.
- **Authorization:** explicit architect ruling ("ARCHITECT RULINGS — UI-GRID-TEXT-OVERFLOW", item 1) adopting the diagnosis report's PROPOSED contract wording verbatim, followed by explicit order ("ORDER — UI-GRID-TEXT-CONTRACT-AMENDMENT"), session model / low effort.
- **Diagnosis findings (read-only, no changes):** `UI_VISUAL_CONTRACT.md` §7 was `SILENT` on per-cell text truncation (only covered header/value column-width alignment and `overflow-x:auto` on the table wrapper). Inventory found the ellipsis+tooltip pattern already applied in `admin-usuarios.js`, `cadastros.js` (Cores, Modelos grids), `painel.js` (several KPI/stage labels), and `documentos-recebidos.js` (filename); still missing/unconstrained in `cadastros.js` Clientes (nome/contato) and Fornecedores (nome/email) grids, `pedidos-list.js`/`ops-list.js` CLIENTE column, `painel.js` `.rv-adm-ref`/`.rv-adm-mini` (has `nowrap` but no `overflow`/`text-overflow`), and the legacy `screenCadastrosUsuarios` duplicate in `cadastros.js`.
- **Architect ruling (scope correction):** the legacy `cadastros.js` Usuarios duplicate (~lines 2226-2381) was explicitly removed from the fix track's scope — that screen is dead code since routing moved to `admin-usuarios.js` at `A3.1`; its defect is registered as a finding confirming `A3.4` (legacy removal) is overdue, not fixed here.
- **Technical + documentation commit (this entry):** contract §7.1 added verbatim to `docs/architecture/UI_VISUAL_CONTRACT.md`; `PROJECT_STATE.md` updated to register the `UI-GRID-TEXT-OVERFLOW` track (helper promotion + Lots A/B/C all `NOT AUTHORIZED`, pending their own orders) and the `A3.4`-overdue finding; this ledger entry.
- **Phasing ratified:** contract amendment (this phase, docs-only) → helper promotion (`truncatedCell` → `js/ui.js`) → Lot A (`cadastros.js` Clientes + Fornecedores only) → Lot B (`pedidos-list.js`/`ops-list.js` CLIENTE) → Lot C (`painel.js` cosmetic). Each its own order, each with its own visual gate.
- **No code touched, no tests affected.**
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit; staging by literal path only; `supabase/.temp/` remains pre-existing untracked (not staged).
- **Next phase indicated at closeout:** `UI-GRID-TEXT-HELPER` (helper promotion), already separately ordered by the architect; awaiting its own execution and closeout.

## 2026-07-16 — UI-GRID-TEXT-HELPER — Promote truncatedCell to ui primitive

- **Gate:** `CLOSED / ACCEPTED`. Helper-promotion phase (§14 — additive move, zero screens beyond `admin-usuarios.js` migrated).
- **Front:** second phase of the `UI-GRID-TEXT-OVERFLOW` track, following `UI-GRID-TEXT-CONTRACT-AMENDMENT` (§7.1 ratified).
- **Authorization:** explicit architect order ("ORDER — UI-GRID-TEXT-HELPER"), session model / medium effort.
- **Technical commit:** this entry's paired commit — `js/ui.js`, `js/screens/admin-usuarios.js`, `tests/ui-truncated-cell.smoke.js` (new).
- **Change:** `truncatedCell(displayText, rawValue, colorStyle)` and its `TRUNCATE_CELL_STYLE` constant moved verbatim from `js/screens/admin-usuarios.js` into `js/ui.js`, alongside `actionButton` (same promotion pattern as `UI-ACTION-BUTTON-HELPER`). `TRUNCATE_CELL_STYLE` is additionally exposed as `window.TRUNCATE_CELL_STYLE` (function declarations attach to `window` automatically in this codebase's classic-script loading model; `const` does not, so an explicit assignment was required for the one admin-usuarios.js header-row call site that references the raw style string directly, not through `truncatedCell()`). `admin-usuarios.js`'s local copy deleted; its 4 call sites now call `window.truncatedCell(...)`, its header-row style reference now reads `window.TRUNCATE_CELL_STYLE`. Signature unchanged; behavior unchanged.
- **No other screen migrated** — Lot A (`cadastros.js` Clientes + Fornecedores) remains its own separate, `NOT AUTHORIZED` order.
- **Local tests:** `node --check` PASS on both touched files. New `tests/ui-truncated-cell.smoke.js` (7 tests, against the real `js/ui.js` in a vm sandbox, same harness pattern as `tests/ui-action-button.smoke.js`): function/style-constant exposed, nowrap/hidden/ellipsis/min-width:0 + caller colorStyle preserved, `title` carries the full rawValue and full text stays in the DOM (not string-truncated), `title` absent on the "—" fallback and on empty string. All 7 pass. `tests/admin-usuarios.smoke.js`'s existing 46 tests (including the 4 `UI-USERS-GRID-TEXT-OVERFLOW` truncation tests) kept passing UNMODIFIED — the required proof that the swap is behavior-neutral.
- **Full regression — before/after file-swap verified (not git-stash; a permission-denied cleanup on unrelated `.agents`/`.codex`/`supabase/.temp` paths made `git stash -u` behave unreliably in this worktree, confirmed via `git diff stash@{0}` showing zero delta against the working tree before abandoning that path):** the two touched source files were swapped for their HEAD (`3ef0c74`) versions and the new test file moved aside, full suite run (`before`: `3672` tests / `3516` pass / `156` fail), then files restored and re-run (`after`: `3679` / `3523` / `156`) — exactly the 7 new tests added, all passing; the 156 failing test names confirmed byte-identical via `diff` on the sorted failing-test-name lists.
- **Architect visual gate:** not independently re-verified by the agent — no live/staging browser session available in this environment (standing limitation, same as `UI-USERS-GRID-TEXT-OVERFLOW`). Pure refactor with an identical-behavior test proof; architect spot-check of the users screen recommended before the next lot.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`; the stray identical stash entry (`stash@{0}`, confirmed zero-diff against the working tree) was left in place rather than dropped, since dropping it was outside this order's authorization.
- **Next phase indicated at closeout:** Lot A (`cadastros.js` Clientes + Fornecedores grids only, per the architect's scope correction excluding the legacy Usuarios duplicate) — `NOT AUTHORIZED`, pending its own order.

## 2026-07-16 — UI-GRID-TEXT-LOT-A — Apply grid text truncation to cadastros grids

- **Gate:** `CLOSED / ACCEPTED` (technical + test proof); architect visual gate still pending. UI refinement (§14 — no refactor, no logic changes).
- **Front:** third phase of the `UI-GRID-TEXT-OVERFLOW` track, following `UI-GRID-TEXT-HELPER` (`window.truncatedCell`/`window.TRUNCATE_CELL_STYLE` in `js/ui.js`).
- **Authorization:** explicit architect order ("ORDER — UI-GRID-TEXT-LOT-A"), session model / medium effort, scoped to exactly two grids in `js/screens/cadastros.js` (Clientes, Fornecedores) per the prior scope-correction ruling excluding the legacy Usuarios duplicate.
- **Technical commit:** `0a1457b` — `Apply grid text truncation to cadastros grids` (`js/screens/cadastros.js`, `tests/ui-grid-text-lot-a.smoke.js` new, `tests/direct-cnpj-screens.smoke.js`).
- **Clientes grid (`screenCadastrosClientes`):** NOME and CONTATO (optional column) cells now render via `window.truncatedCell()`; header cells for both columns carry the same §7.1 CSS via `window.TRUNCATE_CELL_STYLE` (previously only `white-space:nowrap`). CNPJ/ID/AÇÕES columns unaffected. **Column fractions unchanged** (NOME `1.2fr`, CONTATO `1fr`) — judged not visibly starved, since person/contact names are typically shorter than the email case that motivated the users-grid widening; the architect's visual gate is the operative check if this judgment needs revising.
- **Fornecedores grid (`screenCadastrosFornecedores`):** NOME and EMAIL cells now render via `window.truncatedCell()`; header cells same treatment. **Grid template widened:** `1fr 1fr 110px 1fr 70px 100px` → `1fr 1.6fr 110px 1fr 70px 100px` (EMAIL column only), mirroring the users-grid E-MAIL widening precedent (long addresses need more share than a person/company name column) — applied in both the header row and data rows (2 occurrences). CNPJ/TIPO/ID/AÇÕES unaffected.
- **Legacy Usuarios duplicate, Cores, Modelos, Preços, and all button/handler/data code in `cadastros.js`:** untouched, per the FORBIDDEN clause.
- **Test-harness fix (required for regression parity):** `tests/direct-cnpj-screens.smoke.js` hand-rolls its own `ui.js`-primitive mocks in a vm sandbox rather than loading the real `js/ui.js`; it had no `truncatedCell`/`TRUNCATE_CELL_STYLE` stand-in, so its 3 pre-existing Clientes/Fornecedores render tests broke immediately (`window.truncatedCell is not a function`) once `cadastros.js` started calling it. Added a same-shape mock (`sandbox.truncatedCell`/`sandbox.TRUNCATE_CELL_STYLE`) to that harness — no assertion semantics changed, purely unblocks a mock gap exposed by the mechanical migration.
- **Local tests:** `node --check` PASS on `cadastros.js`. New `tests/ui-grid-text-lot-a.smoke.js` (9 tests, against the real `js/ui.js` + `js/screens/common.js` + `js/screens/cadastros.js` in a vm sandbox, fake supa): both grids' target cells carry the §7.1 CSS, long synthetic values truncate visually but stay full-length in the DOM with a `title` tooltip, the "—" fallback carries no tooltip, header cells match data-row CSS, non-truncated columns (CNPJ, TIPO) unaffected, and the two grid-template assertions (Fornecedores widened, Clientes unchanged) match the reported values. All 9 pass. `tests/cadastros-screens.smoke.js`'s 32 pre-existing tests and `tests/direct-cnpj-screens.smoke.js`'s 15 pre-existing tests (18 total after the harness fix) kept passing.
- **Full regression — before/after file-swap verified (file-swap-against-HEAD method, per the helper-phase precedent — `git stash -u` remains unreliable in this worktree):** `js/screens/cadastros.js` and `tests/direct-cnpj-screens.smoke.js` swapped for their HEAD (`bfcbadc`) versions and the new test file moved aside; full suite run (`before`: `3679` tests / `3523` pass / `156` fail — matching the prior phase's closing state), then files restored and re-run (`after`: `3688` / `3532` / `156`) — exactly the 9 new lot-A tests added, all passing; the 156 failing test names confirmed byte-identical via `diff` on the sorted failing-test-name lists.
- **Resulting grid templates (reported per order item 3):**
  - Clientes: `{nome 1.2fr}{contato 1fr, if supported}{telefone 1fr, if supported}{cnpj 1.2fr}{id 70px}{acoes 100px}` — unchanged from before this phase; only the truncation CSS and header treatment changed.
  - Fornecedores: `1fr 1fr 110px 1fr 70px 100px` → `1fr 1.6fr 110px 1fr 70px 100px` (NOME / EMAIL / CNPJ / TIPO / ID / AÇÕES).
- **Stash note:** `stash@{0}` (left in place at the prior phase's closeout) was checked again this phase — it is now confirmed **stale** (`git diff stash@{0}` shows `tests/ui-truncated-cell.smoke.js` as a new-file delta, since that stash predates the helper-phase commits landing on `HEAD`). Per the order's condition ("authorized if you confirm it is still byte-identical"), it was **not** dropped. Recommend an explicit architect instruction to drop it in a future order, since it no longer serves any recovery purpose.
- **Architect visual gate:** not independently re-verified by the agent — no live/staging browser session available in this environment (standing limitation). Pending: long client name/contact and long supplier email truncate with "…", hover reveals full value, no row-height jump, no horizontal scroll — per the order's GATE clause.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/` and the stale `stash@{0}`.
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — architect visual gate on Lot A, then Lot B (`pedidos-list.js`/`ops-list.js` CLIENTE) or Lot C (`painel.js` cosmetic), both still `NOT AUTHORIZED`.

## 2026-07-16 — Architect validation of Lot A + new findings registered + stash cleanup

- **Gate:** `CLOSED / ACCEPTED` (docs-only; no code change).
- **Architect visual validation:** `UI-GRID-TEXT-LOT-A` `CONFIRMED` — nome/email conformant on both grids (Clientes, Fornecedores).
- **`stash@{0}` dropped:** explicitly authorized by the architect this turn; it had already been confirmed stale (predates the helper-phase commits) at the Lot A closeout, so no data was lost.
- **New findings registered as `NOT AUTHORIZED` candidates, per architect instruction from the Lot A visual inspection:**
  1. `UI-FIXED-FORMAT-COLUMN-WIDTHS` — Fornecedores grid's CNPJ column (`110px`) wraps an 18-char formatted CNPJ. The diagnosis correctly classified fixed-format fields as not overflow-prone (§7.1 does not apply — a CNPJ must never be truncated) but did not check width against content length; a §7 golden-rule sizing defect, not a §7.1 gap. Candidate scope: audit every fixed-format column (CNPJ, CPF, dates, phone) app-wide for wrap, size to content.
  2. `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` — **HIGH SEVERITY.** The diagnosis classified `documentos-recebidos.js` as already-compliant; the architect's live visual inspection found overlapping text on `#/documentos-recebidos` (PEDIDO cell's link overflows across DATAS; "Arquivo não disponível" collides with AÇÕES). Candidate scope: read-only diagnosis first (what overflows, why the grid tracks don't contain it), then a scoped fix.
  3. `TEST-MOCK-FIDELITY-AUDIT` — suites that hand-mock `js/ui.js` primitives instead of loading the real module are structurally blind to primitive-level defects (precedent: `UI-EL-BOOLEAN-ATTR-FIX`; this chain's own `tests/direct-cnpj-screens.smoke.js` needed a `truncatedCell` mock patch during `UI-GRID-TEXT-LOT-A`). Candidate scope: inventory every test file that hand-mocks `ui.js` primitives, assess drift risk.
- **Authorization for Lot B and C:** architect ordered execution of `UI-GRID-TEXT-LOT-B-AND-C` (`pedidos-list.js`/`ops-list.js` CLIENTE column; `painel.js` `.rv-adm-ref`/`.rv-adm-mini` cosmetic fix), per the scope already ratified at the original `UI-GRID-TEXT-OVERFLOW-DIAGNOSIS` phasing. Execution follows in this same chain — see the `UI-GRID-TEXT-LOT-B-AND-C` entry below.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.

## 2026-07-16 — UI-GRID-TEXT-LOT-B-AND-C — Apply grid text truncation to CLIENTE columns and painel cosmetics

- **Gate:** `CLOSED / ACCEPTED` (technical + test proof); architect visual gate still pending. UI refinement (§14 — no refactor, no logic changes for Lot B; pure CSS for Lot C).
- **Front:** fourth and fifth phase of the `UI-GRID-TEXT-OVERFLOW` track, executed together per explicit architect order ("execute ORDER — UI-GRID-TEXT-LOT-B-AND-C as previously issued"), completing the scope ratified at the original diagnosis phasing.
- **Authorization:** explicit architect order, session model / medium effort (same tier as Lots A and the helper phase).
- **Technical commit:** `cfa8b4b` — `Apply grid text truncation to CLIENTE columns and painel cosmetics` (`js/screens/pedidos-list.js`, `js/screens/ops-list.js`, `js/screens/painel.js`, `tests/ui-grid-text-lot-b-and-c.smoke.js` new).
- **Lot B — pedidos-list.js (`screenPedidosLista`):** CLIENTE data cell (`clienteNome(pedido)`) now renders via `window.truncatedCell()`; header cell (index 1 of 9) uses `window.TRUNCATE_CELL_STYLE`; PEDIDO, SIT. INTERNA, VISÍVEL, PARCIAL, PRAZO, RECEBIMENTO, ATUALIZADO, AÇÕES columns unaffected. **No width change** — `TR_COLS` unchanged (`minmax(180px,1.28fr)` for CLIENTE); the grid already has an `overflow-x:auto` wrapper with `min-width:1110px` as its overflow strategy, judged sufficient (lower severity per the original diagnosis).
- **Lot B — ops-list.js (`screenListaOPs`):** CLIENTE data cell (`clienteNome(row)`) now renders via `window.truncatedCell()`; header cell (index 2 of 7) uses `window.TRUNCATE_CELL_STYLE`; OP/LOTE, TIPO, STATUS, ENTREGUE, CRIADA EM, AÇÕES unaffected. **No width change** — same rationale (existing `overflow-x:auto` + `min-width:980px` fallback).
- **Lot C — painel.js (`dashboardCss`):** `.rv-adm-ref` and `.rv-adm-mini` CSS rules gained `overflow:hidden;text-overflow:ellipsis;` alongside their existing `white-space:nowrap;` — pure CSS-string edit, no markup/handler/data change. Neighboring rules (`.rv-adm-action-title`, `.rv-adm-cta`, etc.) confirmed untouched.
- **Local tests:** `node --check` PASS on all 3 touched screen files. New `tests/ui-grid-text-lot-b-and-c.smoke.js` (10 tests): pedidos-list.js section is static/source-level (that screen has no pre-existing runtime-render harness — its own test suite, `tests/pedidos-list.smoke.js`, is fully static, so this stays consistent with that precedent) — confirms the truncatedCell call site and the header's index-1 branch; ops-list.js section is runtime (reuses the proven `makeOpsSandbox` shape from `tests/ops-list-screen.smoke.js`) — confirms the §7.1 CSS, full-value title, "—" fallback with no title, and header/TIPO-badge distinction against the real `js/ui.js` + `common.js` + `cadastros.js` + `ops-list.js`; painel.js section asserts the two CSS rule strings verbatim plus a sanity check that neighboring rules are untouched. All 10 pass. `tests/pedidos-list.smoke.js` (all static, unaffected), `tests/ops-list-screen.smoke.js`/`tests/ops-list.smoke.js`, `tests/painel-screen.smoke.js`, and `tests/cadastros-screens.smoke.js` re-run together: same 11 pre-existing failures as before this phase (all confirmed index-inline-residue, unrelated — cross-checked by name against the known baseline failure list), zero new failures.
- **Full regression — before/after file-swap verified (file-swap-against-HEAD method, per precedent):** the three touched screen files swapped for their HEAD (`c77247c`) versions and the new test file moved aside; full suite run (`before`, this session: `3688` tests / `3527` pass / `161` fail), then files restored and re-run (`after`: `3698` / `3537` / `161`) — exactly the 10 new Lot B/C tests added, all passing; the 161 failing test names confirmed byte-identical (`comm -13`/`comm -23` empty both ways) between before/after **within this same session**. Note: this session's absolute fail count (161) differs from the prior session's recorded close (156) — traced to a local test HTTP server dependency (`ECONNREFUSED 127.0.0.1:8765` in isolated re-runs of the affected files), i.e. pre-existing environmental flakiness unrelated to any code in this repo (matches the documented `~87 pre-existing http.server/index.html failures to ignore`), not a regression introduced by this phase. The before/after comparison inside one continuous shell session is unaffected by this and remains the valid proof.
- **Architect visual gate:** not independently re-verified by the agent — no live/staging browser session available in this environment (standing limitation). Pending: CLIENTE column truncates with "…" and reveals full name/on hover on both `#/pedidos` and `#/ops`; `.rv-adm-ref`/`.rv-adm-mini` no longer risk visual overflow on the painel dashboard.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** this closes the `UI-GRID-TEXT-OVERFLOW` track's fully-authorized scope (contract + helper + Lots A/B/C). Remaining open fronts, all `NOT AUTHORIZED`: `UI-FIXED-FORMAT-COLUMN-WIDTHS`, `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` (high severity), `TEST-MOCK-FIDELITY-AUDIT` — `ARCHITECT DECISION` on which to open next.

## 2026-07-16 — UI-DOCUMENTOS-RECEBIDOS-LAYOUT-DIAGNOSIS + FIX — Fix documentos-recebidos PEDIDO/AÇÕES layout overlap

- **Gate:** `CLOSED / ACCEPTED` — architect visual gate `CONFIRMED`. Diagnosis was read-only (§14); the fix itself is UI refinement — no data/handler logic touched.
- **Front:** closes the `UI-DOCUMENTOS-RECEBIDOS-LAYOUT-FIX` candidate registered at the `UI-GRID-TEXT-LOT-A` architect validation, itself following an architect live-visual-inspection finding that the original `UI-GRID-TEXT-OVERFLOW-DIAGNOSIS` had misclassified this screen as already-compliant.
- **Authorization:** explicit architect order ("ORDER — UI-DOCUMENTOS-RECEBIDOS-LAYOUT-DIAGNOSIS", read-only, session model / medium effort), followed by "Ok. go on" authorizing the scoped fix per the diagnosis's own PROPOSED recommendation.
- **Diagnosis findings (read-only, no changes at that step):** `pedidoCell()` (`documentos-recebidos.js:706-719` pre-fix) rendered `doc.pedido` — a raw, unbounded identifier (`pedido_manual`/`pedido`/`pedido_key`) — as the **direct flex item** of `pedidoCol` (`flex-direction:column`), with only `white-space:nowrap`. A flex item's automatic minimum size defaults to its min-content width unless `min-width:0` or a non-`visible` `overflow` is set on the item itself; `pedidoCol`'s own `min-width:0` only fixed the *grid track*, not the span. Result: long tokens rendered at full width and painted past the PEDIDO column into DATAS (flex containers don't clip by default). Filename/remetente were correctly protected because their overflow-guarded `<div>`s are nested *inside* an already-constrained flex item, not themselves the flex item — the one structural difference that exposed PEDIDO. Separately, `buildActionButtons()`'s `wrap` div (`justify-content:center;gap:6px;`, no `flex-wrap`) can hold both the source-file-unavailable label (independently wrap-protected on its own) **and** up to 3 decision icon buttons from a second, independently-gated `if` block — combined content routinely exceeds the fixed 148px AÇÕES track with nothing to stack it onto a second line, hence "collides with AÇÕES" only on the specific row-state combination the architect's screenshot caught. `stateSpan()` labels (evidence/review/pedido/source) carry the same defect *class* but are bounded, enum-mapped PT-BR strings today (confirmed by reading `documentos-recebidos-queue-ui.js:394-411`) — lower priority, defensive only.
- **Blast-radius assessment (read-only):** `pedidoCell` is the only cell in this file rendering a raw unbounded token as a direct flex item; a broader grep across `js/screens/*.js` found no other same-structure instance beyond what Lots A/B/C already covered. `document-link-admin-modal.js` also displays a `pedido_manual` suggestion, via a plain `<p>` with an external CSS class not present in the repo — same blind spot as the standing `MODAL-BUTTON-CSS-CHECK` candidate; flagged as unverified, not folded into this fix.
- **Technical commit:** `90726dd` — `Fix documentos-recebidos PEDIDO/AÇÕES layout overlap` (`js/screens/documentos-recebidos.js`, `tests/ui-documentos-recebidos-layout-fix.smoke.js` new).
- **Fix applied:** `pedidoCell()` (both the linked and `'Não mapeado'` fallback branches) gained the full §7.1 bundle — `overflow:hidden;text-overflow:ellipsis;min-width:0` — alongside the existing `white-space:nowrap`; the linked branch also gained a `title: doc.pedido` tooltip (existing `data-field`/`data-pedido` attributes preserved unchanged, confirmed against `tests/documentos-recebidos.smoke.js`'s pre-existing assertions). `stateSpan()` gained the same defensive bundle. `buildActionButtons()`'s `wrap` div gained `flex-wrap:wrap` — a §7 column-sizing correction, not a truncation fix; nothing in that cell should ever be cut.
- **Local tests:** `node --check` PASS. New `tests/ui-documentos-recebidos-layout-fix.smoke.js` (6 tests, against the real `js/ui.js` + `documentos-recebidos.js` + its dependency chain in a vm sandbox): PEDIDO cell (linked) carries the full CSS bundle, full-token `title`, full text preserved in the DOM, and `data-pedido`/`data-field` preserved; PEDIDO cell (fallback) carries the same bundle; AÇÕES wrap carries `flex-wrap:wrap` both at the source level and at runtime (verified via the "Indisponível" no-queue-item branch); `stateSpan()` source-level bundle check. All 6 pass. `tests/documentos-recebidos.smoke.js` (135 tests), `tests/pedido-detail-linked-documents.smoke.js`, and `tests/document-link-admin-modal.smoke.js` re-run together (154 tests total): all pass unmodified — the required behavior-neutrality proof, including the two `data-pedido` assertions this fix could have broken.
- **Full regression — before/after file-swap verified (file-swap-against-HEAD method, per precedent):** `documentos-recebidos.js` swapped for its HEAD (`806d85c`) version and the new test file moved aside; full suite run (`before`: `3698` tests / `3542` pass / `156` fail), then files restored and re-run (`after`: `3704` / `3548` / `156`) — exactly the 6 new tests added, all passing; the 156 failing test names confirmed byte-identical (`comm -13`/`comm -23` empty both ways).
- **Architect visual gate:** `CONFIRMED` — "Validated" (architect, this closeout). Not independently re-verified by the agent beforehand — no live/staging browser session available in this environment (standing limitation); the architect's own check is the operative verification, per the pattern established at every prior visual-gate closeout in this track.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — remaining `NOT AUTHORIZED` candidates: `UI-FIXED-FORMAT-COLUMN-WIDTHS` (Fornecedores CNPJ wrap, app-wide fixed-format column audit), `TEST-MOCK-FIDELITY-AUDIT` (hand-mocked `ui.js` primitives), and the standing `MODAL-BUTTON-CSS-CHECK` (now with a same-family unverified lead: `document-link-admin-modal.js`'s `pedido_manual` suggestion).

## 2026-07-16 — A6.1 — User Audit Trail Schema + Trigger

- **Gate:** `CLOSED / ACCEPTED` — schema/migration phase, staging-verified. No UI, no Edge Function, no boot, no production (per the order's scope).
- **Front:** `G28-CAMADA-2`, subphase `A6.1` (first of the `A6.1 → A6.2 → A6.3` audit track), per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` §A6.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASE A6.1"), session model / medium effort, scoped exclusively to A6.1 (schema + trigger) — A6.2 (Edge Function wiring) and A6.3 (read-only UI panel) explicitly out of scope, require their own orders.
- **Technical commit:** `ee0e77b` — `Add user audit trail schema` (`db/60_usuarios_auditoria_schema.sql` new, `tests/document-decision-command-contract.test.js` — `ALLOWED_DB` allow-list extended per the db/51/52/58/59 precedent).
- **Schema:** `public.usuarios_eventos(id BIGSERIAL, usuario_id UUID → public.usuarios(id) ON DELETE CASCADE, tipo_evento TEXT, ator_id UUID → auth.users(id) ON DELETE SET NULL, payload JSONB DEFAULT '{}', criado_em TIMESTAMPTZ DEFAULT now())`, indexed on `usuario_id` and `(usuario_id, criado_em DESC)` — mirrors `public.op_eventos` (db/21).
- **Trigger:** `trg_usuario_evento` (`AFTER UPDATE ON public.usuarios FOR EACH ROW`) calls `public.trigger_usuario_evento()` (`SECURITY DEFINER`). Diffs `to_jsonb(OLD)`/`to_jsonb(NEW)` over a watched-key array (`ativo`, `tipo`, `nivel_acesso`, `senha_temporaria`); inserts one `perfil_alterado` row with a `{"<campo>":{"de":...,"para":...}}` payload only for the keys that actually changed. A key absent from the row (e.g. `nivel_acesso`, not yet added by `A2.1`) is silently skipped by the `to_jsonb`/`?` existence check — no follow-up migration to this trigger is required when `A2.1` lands.
- **Actor-resolution / no-double-recording design decision (per the order's explicit requirement):** two distinct write paths reach `public.usuarios` — (a) direct PostgREST `UPDATE` from an authenticated admin session (`js/admin-usuarios-writes.js` `updateUsuario`), where `auth.uid()` resolves to the acting admin; (b) the five Edge Functions (`admin-create-user`, `admin-disable-user`, `admin-delete-user`, `admin-reset-user-password`, `admin-reactivate-user`) using the `service_role` key, where there is no JWT/session in that DB connection and `auth.uid()` is `NULL`. The trigger records only when `auth.uid() IS NOT NULL` (path a); when `NULL` (path b) it is a no-op. `A6.2` will wire those Edge Functions to insert their own `usuarios_eventos` row explicitly, with the actor id they already resolved from their own caller's JWT — this design avoids a double entry once `A6.2` lands. Mirrors `op_eventos.criado_por` (nullable, `auth.uid()`).
- **RLS + grants:** `usuarios_eventos` — `RLS ENABLED`; `REVOKE ALL FROM PUBLIC, anon, authenticated`; `GRANT SELECT TO authenticated`; single policy `usuarios_eventos_admin_select FOR SELECT USING (is_admin())`. No `INSERT`/`UPDATE`/`DELETE` policy for any client role — the only write path is the `SECURITY DEFINER` trigger function (table-owner bypass of RLS), matching the `document_link_revisions` model (db/51 §4: "Leitura direta admin via RLS; escrita apenas pelas RPCs SECURITY DEFINER").
- **Role matrix (verified in staging, `ucrjtfswnfdlxwtmxnoo`, transactional `BEGIN…ROLLBACK`, synthetic-value fixtures reusing two real staging users — `admin@tapetes.test` as actor, one `fornecedor` row as target — zero permanent mutation):**

  | Role / context | Action | Result |
  |---|---|---|
  | Authenticated admin, direct `UPDATE usuarios SET ativo=...` | trigger fires | exactly 1 new `usuarios_eventos` row; `tipo_evento='perfil_alterado'`; `ator_id`=admin id; `payload` = `{"ativo":{"de":<old>,"para":<new>}}` only (no unrelated keys) |
  | Authenticated admin, direct `UPDATE usuarios SET senha_temporaria=...` | trigger fires | 1 new row, `payload.senha_temporaria.{de,para}` correct |
  | Authenticated admin, no-op `UPDATE usuarios SET ativo=ativo` (same value) | trigger fires, no-op | 0 new rows (`IS DISTINCT FROM` correctly no-ops) |
  | `auth.uid() IS NULL` (simulated service_role context), `UPDATE usuarios` | trigger fires, no-op | 0 new rows — proves no double-recording once `A6.2` wires explicit Edge Function inserts |
  | `anon`, `SELECT * FROM usuarios_eventos` | denied | `insufficient_privilege`, `SQLSTATE 42501` (no `GRANT` at all, not just RLS) |
  | `authenticated` non-admin, `SELECT` (seeded row present) | denied by RLS | 0 rows returned (has `SELECT` grant, `is_admin()` filters) |
  | `authenticated` admin, `SELECT` (seeded row present) | allowed | 1 row (the seeded row) returned |

- **Migrations registry — before/after (staging, `ucrjtfswnfdlxwtmxnoo`, `list_migrations`):** before — highest recorded `59_admin_last_sign_in_readmodel` (`20260716014358`); after — `60_usuarios_auditoria_schema` recorded at `20260717002523`, immediately following `59` with no gap.
- **Local tests:** `node --check` on the new test-file edit PASS; `tests/document-decision-command-contract.test.js` **23/23**. Full-suite file-swap-against-HEAD comparison (`git show HEAD:… > …`, restore after — `git stash` remains unreliable in this Windows worktree per standing precedent): before (HEAD version of the test file, `db/60` untracked) — `3704` tests / `3547` pass / `157` fail; after (edited test file) — `3704` / `3548` / `156` fail — exactly the one intended assertion (the `db/60` allow-list gap) flipped from fail to pass, zero new failures, zero tests lost.
- **STRUCTURAL POLICY COMPLIANCE:** `docs/architecture/CODE_HEALTH_RULES.md` read in full; this phase is schema/migration-only (no `index.html`, `boot.js`, `router.js`, `ui.js`, or screen file touched) — §2–§10 not applicable; §7 (size) — new file `db/60_usuarios_auditoria_schema.sql` well under the acceptable ceiling; §13 (tests) — migration smoke via the extended allow-list, staging role-matrix verify; §14 (single scope) — schema/trigger only, no refactor/feature mixing, no production; §15 (Git) — selective staging by literal path (`db/60_usuarios_auditoria_schema.sql`, `tests/document-decision-command-contract.test.js` only), single technical commit, no push, no `add -A`/`reset`/`rebase`; §16 (docs) — this closeout. Per the spec's own governance note (`CAMADA2_USUARIOS_SPEC_PROPOSED.md`, "Refactor governance" section), `A6.1` does not introduce a new structural module in the §16 sense (additive schema/trigger) — no `ARCHITECTURE_REFACTOR_LEDGER.md` entry required, only the standard closeout artifacts (this ledger, `PROJECT_STATE.md`, `AGENT_HANDOFF.md`).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `ARCHITECT DECISION` required for `A6.2` (Edge Function wiring of `usuarios_eventos` — the five existing Edge Functions each gain one explicit insert) or any other candidate on the standing list (`UI-EL-BOOLEAN-ATTR-FIX`, `A2.1`). `A6.3` (read-only UI panel) remains blocked on `A6.2` per the spec's own subphase order. Not authorized by this record.

## 2026-07-16 — A6.1-B — Preserve User Audit Events on Profile Deletion

- **Gate:** `CLOSED / ACCEPTED` — corrective schema/migration phase, staging-verified. No UI, no Edge Function, no production.
- **Front:** `G28-CAMADA-2`, correction discovered mid-`A6.2` (Edge Function audit wiring) authorization — see the `A6.2` HARD STOP recorded in this session: `db/60`'s `usuarios_eventos.usuario_id` FK used `ON DELETE CASCADE`, which would destroy an event row in the same statement that deletes the subject's `public.usuarios` profile (`admin-delete-user`), before `A6.2` could ever wire an explicit insert for that action.
- **Architect ruling:** `ON DELETE CASCADE` rejected (destroys the trail); dropping the FK entirely rejected (loses integrity while the subject still exists). Adopted: `ON DELETE SET NULL` on `usuario_id` + a denormalized identity snapshot (`usuario_email`, `usuario_nome`, `usuario_tipo`) captured at insert time, so a parent-less event remains self-describing.
- **Authorization:** explicit architect order ("ORDER — A6.1-B (audit schema correction, migration)"), session model / medium effort, scoped exclusively to this corrective migration — `db/60` not edited (immutable, applied), Edge Functions (`A6.2`) and UI (`A6.3`) explicitly out of scope, resume after this closeout.
- **Technical commit:** `fa8e1b9` — `Preserve user audit events on profile deletion` (`db/61_usuarios_eventos_preserve_on_delete.sql` new, `tests/document-decision-command-contract.test.js` — `ALLOWED_DB` allow-list extended per the `db/51/52/58/59/60` precedent).
- **Schema changes:** `usuarios_eventos.usuario_id` — `NOT NULL` dropped, FK dropped and recreated as `FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL` (discovered/dropped dynamically via a `pg_constraint` `DO` block, mirroring `db/21`'s pattern, rather than hardcoding the auto-generated constraint name). Three new nullable columns: `usuario_email`, `usuario_nome`, `usuario_tipo` — the minimum needed to make an orphaned event row readable in a future audit UI (`A6.3`): who the event was about (email/nome) and what kind of account (tipo). Nothing sensitive beyond identity is snapshotted — no password/token, no `fornecedor_id`/`cliente_id`/`observacoes` (the `perfil_alterado` `payload` already carries the specific changed fields; snapshot columns are identity-only, for readability after deletion, not a duplicate of the event's own data).
- **Trigger:** `trigger_usuario_evento()` updated in place (`CREATE OR REPLACE FUNCTION`, same function identity, same trigger binding from `db/60` — no re-`CREATE TRIGGER` needed) to populate the three snapshot columns from `NEW` (already available mid-`UPDATE`, no extra query).
- **Backfill:** an `UPDATE ... FROM public.usuarios` statement backfills the snapshot for any pre-existing `usuarios_eventos` row whose parent still exists. At apply time staging `usuarios_eventos` had 0 rows (confirmed at both the `A6.1` and this phase's own staging verify, which run entirely inside `BEGIN…ROLLBACK`) — the statement is a documented no-op today, included for correctness/idempotency should the migration ever be re-applied against a populated table.
- **ACL/RLS:** re-asserted verbatim from `db/60` (not just inherited) — `RLS ENABLED`; `REVOKE ALL FROM PUBLIC, anon, authenticated`; `GRANT SELECT TO authenticated`; single policy `usuarios_eventos_admin_select FOR SELECT USING (is_admin())`. Verified in the live catalog post-apply: `anon_select=false`, `authenticated_select=true`, `authenticated_insert=false`, `anon_insert=false`, `rls_enabled=true`, 1 policy. FK catalog check post-apply: both `usuarios_eventos_usuario_id_fkey` and `usuarios_eventos_ator_id_fkey` now `confdeltype='n'` (`SET NULL`) — `usuario_id`'s previous `confdeltype='c'` (`CASCADE`) confirmed gone.
- **Role matrix — re-run of the full `db/60` matrix under the `db/61` schema (staging, `ucrjtfswnfdlxwtmxnoo`, transactional `BEGIN…ROLLBACK`, synthetic-value fixtures reusing the same two real staging users as `A6.1`, zero permanent mutation):** all six `db/60` cases re-verified green (trigger fires once per changed watched field with correct payload/`ator_id`/now also the identity snapshot; no-op UPDATE does not record; simulated `auth.uid() IS NULL` context does not double-record; `anon` denied `42501`; authenticated non-admin denied by RLS, 0 rows; authenticated admin reads the seeded row) — no regression from the schema change.
- **New survival case (the reason for this phase):** a fully synthetic `auth.users` + `public.usuarios` row (transaction-local `gen_random_uuid()` id, `__verify_a61b_...@synthetic.invalid` email, never a real entity) was created, updated once (admin actor) to generate one `usuarios_eventos` row, then its `public.usuarios` row was `DELETE`d directly — mirroring `admin-delete-user`'s own `usuarios` delete. Result: the event row **survived** the delete with `usuario_id` now `NULL`, `usuario_email`/`usuario_nome`/`usuario_tipo` intact and matching the synthetic fixture, `payload`/`tipo_evento` unchanged, and still readable by an admin session under RLS (`usuario_id IS NULL` row selected successfully). All assertions passed; zero residue confirmed afterward (`eventos_total=0`, synthetic `usuarios`/`auth.users` rows both `0` — full rollback).
- **Migrations registry — before/after (staging, `list_migrations`):** before — highest recorded `60_usuarios_auditoria_schema` (`20260717002523`); after — `61_usuarios_eventos_preserve_on_delete` recorded at `20260717003652`, immediately following with no gap.
- **Local tests:** `node --check` PASS. `tests/document-decision-command-contract.test.js` **23/23**. Full-suite file-swap-against-HEAD comparison: before (HEAD version of the test file, `db/61` untracked) — `3704` tests / `3547` pass / `157` fail; after (edited test file) — `3704` / `3548` / `156` fail — exactly the one intended assertion (the `db/61` allow-list gap) flipped from fail to pass, zero new failures.
- **STRUCTURAL POLICY COMPLIANCE:** `docs/architecture/CODE_HEALTH_RULES.md` re-consulted; schema/migration-only phase (no `index.html`/`boot.js`/`router.js`/`ui.js`/screen file touched) — §2–§10 not applicable; §7 (size) — new file well under the acceptable ceiling; §13 (tests) — migration smoke via the extended allow-list, full staging role-matrix + survival-case verify; §14 (single scope) — schema correction only, no refactor/feature mixing, `db/60` not touched (immutable, per the order), no production; §15 (Git) — selective staging by literal path (`db/61_usuarios_eventos_preserve_on_delete.sql`, `tests/document-decision-command-contract.test.js` only), single technical commit, no push; §16 (docs) — this closeout. No `ARCHITECTURE_REFACTOR_LEDGER.md` entry required (additive schema/trigger correction, not a new structural module, same governance note as `A6.1`).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `A6.2` (Edge Function audit wiring) resumes — the `db/60`/`db/61` schema now supports a surviving `admin-delete-user` audit event. Not authorized by this record; requires its own order (already issued once, paused by the HARD STOP this phase resolves — architect must re-authorize or explicitly resume `A6.2`).

## 2026-07-17 — A6.2 — Audit Trail Wiring (Admin Edge Functions) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — real E2E in staging `result: PASS` (`15/15` steps), executed and evidenced by the architect. Deploy of the five Edge Functions to staging executed by the architect (outside this session's credential reach).
- **Front:** `G28-CAMADA-2`, subphase `A6.2`, resumed after `A6.1-B` resolved the FK HARD STOP that had originally paused it (see the `A6.1-B` entry above).
- **Authorization:** explicit architect order ("ARCHITECT — RESUME A6.2"), session model / medium effort, re-authorized as originally scoped with the delete-ordering adjustment; closed by "ORDER — CLOSEOUT A6.2" (session model / low effort).
- **Technical commits:** `b67b126` — `Add audit trail writes to admin Edge Functions` (`supabase/functions/admin-create-user/index.ts`, `admin-disable-user/index.ts`, `admin-reactivate-user/index.ts`, `admin-reset-user-password/index.ts`, `admin-delete-user/index.ts`, and their five `tests/*.smoke.js`); `7309349` — `Add A6.2 usuarios_eventos audit trail e2e runner` (`scripts/staging/usuarios-audit-e2e.mjs`).
- **Per-function audit contract:**

  | Function | tipo_evento | payload | insert placement | failure rule |
  |---|---|---|---|---|
  | `admin-create-user` | `usuario_criado` | `{tipo, fornecedor_id, cliente_id}` | last step, fully-committed success only | log + `audit_recorded:false`, action stands |
  | `admin-disable-user` | `usuario_desativado` | `{ativo:{de:true,para:false}, motivo}` | last step, fully-committed success only | log + flag, action stands |
  | `admin-reactivate-user` | `usuario_reativado` | `{ativo:{de:false,para:true}}` | last step, fully-committed success only | log + flag, action stands |
  | `admin-reset-user-password` | `senha_resetada` | `{}` (empty — password never persisted to audit) | last step, fully-committed success only | log + flag, action stands |
  | `admin-delete-user` | `usuario_excluido` | `{}` | **before** the `public.usuarios` delete (architect ruling) | log + flag on insert failure; **no compensation invented** if the delete itself subsequently fails/is compensated — event remains, documented trade-off |

- **Canonical audit-trail design (recorded in `PROJECT_STATE.md` "Binding decisions in force" and `docs/DOCUMENTATION_INDEX.md` §4):** two write paths to `public.usuarios_eventos`, mutually exclusive by the `auth.uid()` condition — the `db/60` trigger for authenticated-session direct `UPDATE`s, and each Edge Function's own explicit insert for `service_role`-context actions (where `auth.uid() IS NULL` excludes the trigger by design). Both paths populate the `db/61` identity snapshot columns.
- **Delete-ordering trade-off (explicitly accepted, not a defect):** `admin-delete-user`'s insert precedes the delete so the `db/61` FK is satisfiable at insert time. If the delete subsequently fails (`USER_HAS_REFERENCES`) or is compensated (`AUTH_DELETE_FAILED` → profile reinserted), the `usuario_excluido` event remains on record even though the profile was not, in the end, deleted. No compensation was invented for the audit table on those paths — a deliberate scope boundary stated in code comments and this record.
- **Local tests:** 5 smoke files extended (`tests/admin-create-user.smoke.js`, `admin-disable-user.smoke.js`, `admin-reactivate-user.smoke.js`, `admin-reset-user-password.smoke.js`, `admin-delete-user.smoke.js`) — +37 tests total, covering: insert present; correct `tipo_evento`; `ator_id` from `callerId` (never `auth.uid()`); identity snapshot fields; payload shape (including the empty-object assertion and the explicit no-password-string check for `admin-reset-user-password`); insert-ordering (after the last committed step for four functions, before the delete for `admin-delete-user`); failure-flag behavior (`auditRecorded=false` + `console.error`, no `return errorResponse` on audit failure); and, for `admin-delete-user`, an explicit assertion that no `.from("usuarios_eventos").delete` exists anywhere in the file (no invented compensation). All 5 suites green (39+46+29+50+31 = 195 tests total in those five files after this phase).
- **Full regression — before/after file-swap verified (file-swap-against-HEAD method):** the five Edge Functions + five smoke files swapped for their HEAD (`00e0b4c`) versions; full suite run (`before`: `3704` tests / `3548` pass / `156` fail — matching the `A6.1-B` closing state), then files restored and re-run (`after`: `3741` / `3585` / `156` fail) — exactly the 37 new tests added, all passing, fail count unchanged (byte-identical to baseline).
- **Staging E2E (`scripts/staging/usuarios-audit-e2e.mjs`, run by the architect, not by this session — requires admin credentials):** `result: PASS`, `15/15` steps, `2026-07-17`, synthetic user `c0d5da9c-471c-459f-b0c4-02110fa81709`. Verified: exactly one event per action across all five functions (proving the trigger's `auth.uid() IS NULL` exclusion holds under real `service_role` execution — no double-entry); correct `tipo_evento`/`ator_id`/payload/identity-snapshot per action; the `senha_resetada` payload confirmed free of the generated password in any form; all 5 accumulated events (`usuario_criado`, `usuario_desativado`, `usuario_reativado`, `senha_resetada`, `usuario_excluido`) confirmed surviving the profile's own deletion, `usuario_id` NULL on all 5, identity snapshot intact and legible by email; `public.usuarios`/`auth.users` cleanup zero confirmed (the orphaned `usuarios_eventos` rows are the intended permanent artifact of the test — append-only table, no `DELETE` policy for any client role, so they are not "cleaned up" by design, matching `db/60`/`db/61`'s contract).
- **STRUCTURAL POLICY COMPLIANCE:** `docs/architecture/CODE_HEALTH_RULES.md` re-consulted; §9 (Supabase writes) — the new `usuarios_eventos` inserts stay inside the existing Edge Function modules (no render-function write, no new write module needed at this scale); §13 (tests) — smoke extended per function + staging E2E; §14 (single scope) — Edge Function changes only, no migration (`db/60`/`db/61` untouched, per the order), no UI, no production; §15 (Git) — selective staging by literal path, two commits (functions+tests, then the e2e script), no push; §16 (docs) — this closeout + `docs/DOCUMENTATION_INDEX.md` §4 update.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `A6.3` (read-only audit panel) — mockup gate satisfied (approved by the architect 2026-07-17); closes the `A6` track. Not authorized by this record; standing candidates otherwise unchanged (`UI-EL-BOOLEAN-ATTR-FIX`, `A2.1`).

## 2026-07-17 — A6.3 — User Audit Panel (read-only) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect visual gate `CONFIRMED`. Closes the `A6` track (`A6.1` + `A6.1-B` + `A6.2` + `A6.3`).
- **Front:** `G28-CAMADA-2`, subphase `A6.3` (read-only audit panel), per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`. Mockup gate satisfied by the architect (2026-07-17): panel inside the edit modal below a divider; one row per event — icon, action, actor + detail, timestamp; read-only label; §7.1 truncation on the detail line.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASE A6.3"), session model / medium effort, scoped exclusively to A6.3; closed by the consolidated closeout order.
- **Technical commit:** `e31f269` — `Add user audit panel` (`js/admin-usuarios-audit-read-model.js` new, `js/admin-usuarios-writes.js`, `js/screens/admin-usuarios-audit-panel.js` new, `js/screens/admin-usuarios-modal.js`, `index.html`, 4 test files new/extended).
- **Read model:** `js/admin-usuarios-audit-read-model.js` (pure, mirrors `document-link-audit-read-model.js`) maps `usuarios_eventos` rows for all 6 possible `tipo_evento` values (5 `A6.2` Edge-Function-recorded types + the trigger's own `perfil_alterado`) to pt-BR action labels, human-readable payload phrases, `dd/MM HH:mm` timestamps; defensive fallback for unrecognized event types; explicit `subjectOrphaned` flag for `usuario_id IS NULL` (`db/61` delete-survival). No DOM, no `window.supa`, never throws.
- **Read path:** `fetchUsuarioEventos(userId, limit)` (`js/admin-usuarios-writes.js`) — plain RLS-filtered select on `usuarios_eventos` + a second plain select on `usuarios` for actor identity resolution. No RPC, no migration — the order's escalation condition ("Escalate if the read path requires anything beyond a plain RLS-filtered select") was never triggered.
- **Panel:** `js/screens/admin-usuarios-audit-panel.js` renders the approved mockup — divider, "Histórico" header with count badge + "somente leitura" label, per-event row (16px icon / action label / actor+detail via `window.truncatedCell` §7.1 bundle / timestamp), 5 most recent visible + "ver todos" toggle for the rest (max-height ~280px scrollable). Icon vocabulary: 4 of 6 tipo_evento icons named explicitly by the mockup; `usuario_excluido`/`perfil_alterado` reuse this screen's own already-established trash/pencil icons (flagged as an assumption at the visual gate, confirmed acceptable by the architect).
- **Wiring:** `js/screens/admin-usuarios-modal.js` `openUsuarioModal`, edit branch only (`isEdit && usr && usr.id`) — no history exists on create. Fail-closed: any load failure renders a discreet "Histórico indisponível", logs, and never breaks the rest of the modal.
- **Tests:** +37 (22 pure read-model unit tests, 14 panel smoke tests including a fully-simulated "ver todos" toggle via a `.style`-aware `FakeNode`, 1 boot/script-order test). File-swap regression: before (`A6.2` closing state) — `3741` tests / `3585` pass / `156` fail; after — `3778` tests / `3622` pass / `156` fail — exactly the 37 new tests, zero regressions.
- **STRUCTURAL POLICY COMPLIANCE:** no writes anywhere in this phase; `db/60`/`db/61` untouched; no Edge Function changes; `cadastros.js` untouched; §7 (size) — all new files well under the acceptable ceiling; §13 (tests) — pure unit + panel smoke + boot/script-order; §14 (single scope) — UI-only, read-only; §15 (Git) — single technical commit, selective staging, no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `G28-CAMADA-2 / A6` track `COMPLETE`. The visual gate itself surfaced a live defect (see the `UI-INVOKE-ENVELOPE-FIX` entry immediately below, which interrupted and then completed this closeout).

## 2026-07-17 — UI-INVOKE-ENVELOPE-FIX — Fix Admin Edge Function Response Envelope Unwrap — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect-confirmed: reset shows the generated password, no red toast; create with observações saves correctly.
- **Front:** live defect discovered during the `A6.3` architect visual gate — `admin-reset-user-password` succeeded in staging (Auth password rotated, profile flagged) but the UI showed both a green "Senha resetada" success toast and a red "Senha resetada, mas a resposta não trouxe o valor gerado." error toast on the same action, and never displayed the generated password.
- **Authorization:** two-step — "ARCHITECT — HARD STOP, READ-ONLY DIAGNOSIS" (root-cause analysis only, no changes), followed by "ARCHITECT AUTHORIZATION — UI-INVOKE-ENVELOPE-FIX" (session model / medium effort) once the diagnosis was accepted.
- **Root cause:** `@supabase/supabase-js` `FunctionsClient.invoke()` returns the raw parsed HTTP JSON body verbatim as `data` (`data = await response.json()`, no unwrapping — confirmed against the actual `supabase/functions-js` source). Every admin-* Edge Function already wraps its success payload in `{data: <payload>}` via `jsonResponse()` (`supabase/functions/_shared/response.ts`). Client-side call sites in `js/screens/admin-usuarios-modal.js` (`data.password`, `createData.user_id`, `data.ativo`) read one level too shallow — the true value was at `data.data.*`. **Pre-existing since `A5.1-A5.2`** (`resetarSenha`, commit `b726717`) — `A6.2` did not cause this; it only added `audit_recorded` inside the same already-mis-consumed envelope, and its own visual gate is what finally surfaced the defect live.
- **Technical commit:** `7b37e8e` — `Fix admin Edge Function response envelope unwrap` (`js/admin-usuarios-writes.js`, `tests/admin-usuarios.smoke.js`).
- **Fix:** `invokeAdminFunction(name, body)` — the single central unwrap point for all five `functions.invoke()`-based writes (`createUsuario`, `disableUsuario`, `deleteUsuario`, `resetarSenha`, `reativarUsuario`). On success, unwraps `res.data.data` once; on error, passes `res.error` through unchanged (`parseEdgeFunctionError` already reads `error.context.json()` directly, unaffected). Existing call sites in `admin-usuarios-modal.js` required zero changes.
- **Why no test caught it:** `tests/admin-usuarios.smoke.js`'s fake Supabase client's `functions.invoke()` mock returned the inner payload flat (one level shallower than the real client) — the mock and the pre-fix code were wrong in the same way, cancelling out. Corrected the mock's `invoke` wrapper to double-wrap exactly like production (`invokeImpl` callbacks unchanged — they already returned the correct "inner" shape; the wrapper now adds the outer `{data: ...}` layer automatically).
- **Regression proof (verified, not asserted):** added 4 direct unit tests (one per remaining write beyond the existing full-flow reset-password UI test) asserting the unwrapped `data.*` fields. Re-ran the full suite against the **pre-fix** `js/admin-usuarios-writes.js` with the **corrected** mock: **5 tests fail** (the 4 new tests + the pre-existing full click-through "sucesso: confirma o reset… abre 'Senha gerada'" test) — proof these are real regression guards, not tautological. File-swap regression (fixed code, both files): before (`A6.3` closing state) — `3778` tests / `3622` pass / `156` fail; after — `3782` tests / `3626` pass / `156` fail — exactly the 4 new tests, zero collateral regressions.
- **Audit of all `functions.invoke()` call sites in `js/`:** exactly two files use it. `js/admin-usuarios-writes.js` (5 sites) — fixed. `js/screens/cadastros.js` (frozen legacy `screenCadastrosUsuarios`, 3 sites) — `admin-disable-user`/`admin-delete-user` only read `{error}`, unaffected; `admin-create-user` has the **identical** bug (`createData.user_id` silently `undefined`, causing the observações-save follow-up to silently no-op) — same mechanism, but this file is out of scope, frozen until `A3.4`. **Reported, not fixed** — recorded as one more concrete justification for `A3.4` (legacy code removal).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `TEST-MOCK-FIDELITY-AUDIT` (read-only, **promoted to priority candidate** at this consolidated closeout — three defects from the identical root class in one day: `UI-EL-BOOLEAN-ATTR-FIX`'s unmodeled boolean-`setAttribute` DOM behavior, hand-mocked `js/ui.js` primitives elsewhere in the suite, and this phase's flat-`invoke()` mock). Scope for that audit: inventory every test double in `tests/` that fakes a runtime boundary (Supabase client, DOM/`ui.js` primitives, Edge Function envelopes) and diverges from the real behavior it imitates — read-only, no code fix bundled. `A2.1` (schema `nivel_acesso`) and `A3.4` (legacy code removal in `cadastros.js`) are the next authorizable **technical** candidates after that audit.
- **New candidates registered, `NOT AUTHORIZED`:** `A6-GLOBAL-AUDIT-VIEW` (`usuario_excluido` events are unreachable from the per-user panel by construction — it only opens for an existing profile; an admin-level, cross-user audit view is recommended before publication); `AUDIT-ACTOR-SNAPSHOT` (the panel resolves actor identity live via a join to `public.usuarios`; if the acting admin is later deleted, the actor line goes blank while the event subject's own identity snapshot — `db/61` — survives; proposed fix mirrors `db/61`'s pattern onto `ator_email`/`ator_nome` columns).

## 2026-07-17 — TEST-MOCK-FIDELITY-AUDIT — Test Mock Fidelity Audit (read-only) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect ratification 2026-07-17 ("ARCHITECT RULINGS — TEST-MOCK-FIDELITY-AUDIT: ACCEPTED as reported").
- **Front:** promoted to priority read-only candidate at the consolidated `A6`/`UI-INVOKE-ENVELOPE-FIX` closeout (`260301a`) — three defects of one root class in one day: a test double that diverges from the real behavior it imitates and confirms whatever bug that divergence contains.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — TEST-MOCK-FIDELITY-AUDIT (read-only)"), session model / high effort, scoped to inventory + verdicts + proposal; no file changed by the audit itself.
- **Documentation commit:** this closeout (`Record test mock fidelity audit`) — docs-only. Current HEAD via `git rev-parse HEAD`.
- **Method:** all 124 `tests/` suites partitioned into 6 category batches, each verdict cross-checked centrally against the live source it imitates (`js/ui.js` `el()` boolean coercion, `functions.invoke()` double envelope, `.rpc()`/PostgREST `{data,error}`, real ui.js primitives).
- **Result:** **zero confirmed (c) structurally-blind doubles that mask a live bug.** The three triggering defects were genuine (c) at the time and are fixed with their doubles corrected into the faithful seed. Only `admin-usuarios.smoke.js` runtime-fakes `functions.invoke` and it is faithful (double-wrapped `{data:{data:payload}}`); every other `invoke` reference in `tests/` is a static source-string assertion. No suite uses a real DOM (jsdom).
- **Verdict distribution (124 suites):** ~52 NO-DOUBLE (static/pure-fn), ~51 FAITHFUL, ~18 BENIGN, 0 (c), 3–4 KNOWN-DEBT (stale/env).
- **Substantive finding (structural):** fidelity is accidental/per-suite — `R1` quarantined boolean-blind hand-mock `el()` (`direct-cnpj-screens`, `pedido-form`, `cliente-pedido-tracking`, `pedido-detail-linked-documents`, `tec-to-acabamento-flow`; benign only because those screens have no boolean/ternary attr today), `R2` fail-unsafe raw-store `FakeNode` copy-drift (`fornecedor-screens`, `painel-screen`; loads real `el()` so crashes rather than false-greens), `R3` legacy-dead-code invoke coverage gap (resolved by `A3.4`).
- **Known-debt re-grounding:** the historical "~87 http.server/index.html failures" and "11 index-inline failures" are stale baseline artifacts resolving into two non-mock-fidelity buckets — (1) fixed-port `:8765` environment dependency (`index-inline`, `write-guard`; others self-host on ephemeral `listen(0)`), (2) stale inline-`<script>` assertions (`index-inline`/`config`/`supabase-client` share an `extractInlineScript` helper asserting an inline block the modularization removed; `index.html` now 79/79 `<script src=…>`). Measured: `index-inline` = 6 fail / 7.
- **Ratified rulings:** shared-double `tests/_doubles.js` `APPROVED as proposed` (additive, opt-in, phased, mandatory meta-tests, seeded from the three corrected doubles); `§20` (test-double fidelity) added to `docs/architecture/CODE_HEALTH_RULES.md` (and the `CLAUDE.md` pointer count 19→20); lots `L1` (shared module + `R1` adoption + `R2` fix) and `L2` (stale inline-`<script>` cleanup, ephemeral `listen(0)`) `AUTHORIZED`; `L3` `NO ACTION` (subsumed by `A3.4`, its fourth justification).
- **Report:** `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md` (full per-suite verdicts + evidence + shared-double assessment + prioritized lots + known-debt classification).
- **STRUCTURAL POLICY COMPLIANCE:** read-only audit — no code/test/SQL/migration change; `§14` — docs (`L0`) separated from code (`L1`/`L2`) into distinct phases; `§18` — periodic read-only audit, concludes "continue + specific correction phase"; `§20` established and folded into this docs commit; no Supabase/MCP/staging/production access; `bhgifjrfagkzubpyqpew` not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Next phase indicated at closeout:** Lot `L1` (`TEST-DOUBLE-SHARED-MODULE`) — `AUTHORIZED` as the next code phase; then `L2`; then `A2.1`/`A3.4`.

## 2026-07-17 — TEST-DOUBLE-SHARED-MODULE (Lot L1) + TEST-DOUBLE-STALE-ASSERTION-CLEANUP (Lot L2) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect order "PROCEED NOW" (2026-07-17, after quota reset cancelled the prior session-limit hold): (1) finish tec-to-acabamento R1 (closes L1); (2) L2 as authorized; (3) read-only `git worktree list` report. Both lots authorized by the `TEST-MOCK-FIDELITY-AUDIT` ratification.
- **Front:** implementation follow-up to `TEST-MOCK-FIDELITY-AUDIT` (report `docs/reports/TEST_MOCK_FIDELITY_AUDIT_2026-07-17.md`), closing the structural residual classes `R1` (quarantined boolean-blindness) and `R2` (fail-unsafe copy-drift) via the approved shared double, and clearing the stale-assertion known-debt baseline.
- **Lot `L1` — shared test-double module (commits `54ee8aa`, `4d2f304`, `520c9a6`):**
  - `tests/_doubles.js` — canonical `FaithfulNode` (real DOM boolean-attr presence coercion; plain-object `_attrs`; `hasAttribute`/`removeAttribute`; style dual-access; select→value reflection), `makeFakeSupa` (double-envelope `functions.invoke`, single-level `.rpc`, `{data,error}` chain with single()/maybeSingle() vs array, error injection), `createDocument`. Seeded from the three corrected doubles. Ships with `tests/_doubles.meta.test.js` (16 tests) proving the double catches each class it exists to catch (§20).
  - `R1` adoption in **all 5** boolean-blind suites — `cliente-pedido-tracking`, `pedido-detail-linked-documents`, `direct-cnpj-screens`, `pedido-form`, `tec-to-acabamento-flow` — each rendering through the REAL `js/ui.js` `el()` backed by `FaithfulNode`, with representation-only reconciliations (`onclick`→`_listeners.click`, `getAttribute('placeholder')`, `tagName`, tree-walk text/find helpers) and a per-suite demonstration test proving the old raw-store double would have masked a boolean-attr regression. `R2` fail-unsafe drift fixed by adding `removeAttribute`/`hasAttribute` parity to `fornecedor-screens`/`painel-screen`.
  - **No existing assertion weakened or removed** (verified per suite: test count = baseline + 1 demo; 0 removed asserts). The 2 pre-existing `tec-to-acabamento-flow` static-slice failures (caso 9, MODAL caso 6) preserved intact.
- **Lot `L2` — stale-assertion cleanup (commit `2c9a4c2`):** `index.html` is fully modularized (no content-bearing inline `<script>`; every script loads with a `?v=` cache-buster, §12). Rewrote the stale assertions in `index-inline`/`config`/`supabase-client` to the post-modularization structure (assert no inline script + that the extracted logic lives in its module; tolerate `?v=`; use the `js/boot.js` entrypoint as the ordering boundary); replaced `index-inline`'s fixed `:8765` fetch with an ephemeral `listen(0)` server and adopted `createDocument`; made `fornecedor-screens`'s hardcoded menu-count dynamic (one link per `ADMIN_MENU` item). Result: `index-inline` 6/6, `config` 28/28, `supabase-client` 26/26, `fornecedor-screens` 30/30 — the "~87 / 11 failures" baseline debt is resolved.
- **Read-only worktree finding (task 3):** `controle-tapetes-g28` is a linked worktree of the main repo (`controle-tapetes/.git`). A stale registration `tapetes-baseline-check` (not locked, empty `gitdir`, target directory missing on disk — prunable) causes git's auto-prune to fail with `Permission denied` (likely a OneDrive sync lock) on every commit — harmless, does not affect commits. `git worktree prune` / manual metadata removal is a candidate **pending explicit authorization**; NOT pruned unilaterally.
- **Registered follow-up (`NOT AUTHORIZED`, same stale class, out of L2's named scope):** `tec-to-acabamento-flow`'s 2 static-slice assertions are false-red brittle `buildTecelagemTransferForm` slice regexes — the source content they check (`comOpcaoSplit:true`, `layout:'stacked'`, `js/screens/pedido-detail-events.js:1691`) is present; a trivial regex-anchor fix.
- **STRUCTURAL POLICY COMPLIANCE:** `§7` — `tests/_doubles.js` ~250 lines (ideal); `§13` — every change is test-side with proportional demonstration/meta tests, no product code touched; `§14` — docs (L0) separated from code (L1/L2) into distinct commits, no feature mixed in; `§15` — selective staging by literal path, no push, forbidden git ops avoided; `§19` — new code/comments/commit messages in English; `§20` — established by the audit and honored throughout (shared double preferred; hand-rolled divergences carry justification comments). No Supabase/MCP/staging/production access; `bhgifjrfagkzubpyqpew` not accessed.
- **Local verification:** all touched suites green — meta 16/16, `cliente-pedido-tracking` 25/25, `pedido-detail-linked-documents` 8/8, `direct-cnpj-screens` 19/19, `pedido-form` 42/42, `tec-to-acabamento-flow` 38/40 (2 pre-existing static-slice fails preserved), `fornecedor-screens` 30/30, `painel-screen` 16/16, `index-inline` 6/6, `config` 28/28, `supabase-client` 26/26. `node --check` passes on every edited file; `git diff --check` clean.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Next phase indicated at closeout:** `A2.1` (schema `nivel_acesso`) — pending its own architect order; `A3.4` (legacy `cadastros.js` removal) after.

## 2026-07-17 — A2.1 (nivel_acesso schema) + A2.1-B (ACL correction) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect order "ARCHITECT AUTHORIZATION — SUBPHASE A2.1 (nivel_acesso schema)" (session model / medium effort), plus the follow-up ruling "A2.1 HARD STOP: OPTION 3" authorizing A2.1-B. Per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` and the ratified decisions (two levels only; NO overrides table).
- **Front:** `G28-CAMADA-2`, subphases `A2.1` (schema) + `A2.1-B` (grants-only ACL correction). Covers A2.1 exclusively — `A2.2` (modal wiring) and `A2.3` (route enforcement) require their own orders.
- **Technical commit:** `f108c45` — `Add admin access level schema and ACL correction` (`db/62_admin_nivel_acesso_schema.sql`, `db/63_is_admin_full_grants.sql`, `tests/admin-nivel-acesso-schema.smoke.js`, `tests/is-admin-full-grants-schema.smoke.js`). Documentation closeout: this entry.
- **`db/62` (A2.1):** additive, forward-only, idempotent. `public.usuarios.nivel_acesso TEXT NOT NULL DEFAULT 'completo'` + named CHECK `usuarios_nivel_acesso_check (nivel_acesso IN ('completo','somente_leitura'))` (expandable later). Helper `public.is_admin_full()` — `plpgsql SECURITY DEFINER STABLE search_path=public,auth` with `EXCEPTION -> FALSE`, requires `ativo IS TRUE AND tipo='admin' AND nivel_acesso='completo'`; same shape as db/12's `is_admin()`. `usuarios.tipo` and `is_admin()` **untouched** (ratified: `tipo` anchors all RLS). ACL in the migration (revoke PUBLIC/anon, grant authenticated).
- **`db/63` (A2.1-B):** grants-only, forward-only, idempotent correction (precedent db/57). Root cause of the hard stop: `db/62`'s ACL block revoked PUBLIC/anon but not `service_role`, which retained `EXECUTE` via Supabase's default function privileges — less strict than the db/54/57 authenticated-only standard on that row (functionally harmless: `service_role` is server-only, bypasses RLS, and `is_admin_full()` returns FALSE under it since `auth.uid()` is NULL). `db/63` states the COMPLETE intended ACL: `REVOKE ALL FROM PUBLIC, anon, service_role; GRANT EXECUTE TO authenticated`.
- **Hard stop + ruling (recorded):** the architect had named "ACL diverging" a hard stop; on encountering `service_role=X`, execution stopped before the technical commit and reported. Architect ruled **Option 3** (db/62 stands as applied and recorded; correct forward-only via a new grants-only migration).
- **Staging (project ref confirmed = `ucrjtfswnfdlxwtmxnoo` via migration-history fingerprint; registry recorded after 62):** `db/62` → `20260717093122 / 62_admin_nivel_acesso_schema`; `db/63` → `20260717101401 / 63_is_admin_full_grants`. Pre-state clean (column/helper/CHECK absent; `is_admin` present). All 10 existing users defaulted `nivel_acesso='completo'` (0 null) — no silent privilege change.
- **Verification (BEGIN…ROLLBACK / DO-block with forced RAISE, cleanup zero):** role matrix — completo admin `is_admin_full=true`/`is_admin=true`; **somente_leitura admin `is_admin_full=false`/`is_admin=true` (critical regression: the anchor is unchanged for a read-only admin)**; inactive admin false/false; non-admin false/false; no-session/anon false/false. CHECK rejects `'invalido'` (23514). `db/60` trigger records the `nivel_acesso` change as `perfil_alterado` with payload `{"nivel_acesso":{"de":"completo","para":"somente_leitura"}}`. After `db/63`: catalog ACL `[postgres, authenticated]` only; `has_function_privilege` → authenticated `true`, anon/service_role `false`; runtime `service_role` call → `42501` (helper unreachable); authenticated completo admin path unchanged (`is_admin_full=true`, `is_admin=true`). **Hard-stop condition (ACL final state still diverging) cleared.**
- **Tests:** `admin-nivel-acesso-schema.smoke.js` (11) + `is-admin-full-grants-schema.smoke.js` (6) — 17/17, allow-list extended to permit exactly the `is_admin_full` function creation while forbidding any touch to `tipo`/`is_admin()`/policies/destructive DDL. Purely additive (2 new migrations + 2 new smokes); no existing suite changed, so the new-clean-baseline regression delta is +17 passing, zero existing tests affected.
- **Registered candidates (`NOT AUTHORIZED`):** `IS-ADMIN-ACL-REVIEW` — the anchor `public.is_admin()` grants `EXECUTE` to PUBLIC/anon/authenticated/service_role, more permissive than the db/57 standard; tightening it touches every RLS policy, so it needs its own read-only diagnosis before any change. Also folded in (per the order): `tec-to-acabamento-flow`'s 2 stale static-slice assertions (same class as `L2`, out of its named scope; trivial regex-anchor fix).
- **STRUCTURAL POLICY COMPLIANCE:** `§13` — migration smokes proportional to risk, allow-list extended and justified; `§14` — schema/migration only (no UI/Edge Function/boot), docs closeout separate from the technical commit; `§15` — selective staging by literal path, single technical commit, no push, no forbidden git ops; `§19` — English new code/comments/commit message; `§20` — n/a (no test doubles). No production; `bhgifjrfagkzubpyqpew` not accessed. `usuarios.tipo`, `is_admin()`, and all existing RLS policies untouched.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Next phase indicated at closeout:** `A2.2` (modal wiring) — pending its own architect order; then `A2.3` (route enforcement), `A3.4` (legacy removal).

## 2026-07-17 — A2.2 (modal wiring) + A2.3 (pilot route enforcement) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect visual gate `CONFIRMED` ("ARCHITECT VALIDATION — A2.2/A2.3: OK"), ratifying both design decisions named below. Closes the `G28-CAMADA-2 / A2` track (`A2.1` + `A2.1-B` + `A2.2` + `A2.3`) as `COMPLETE`.
- **Front:** `G28-CAMADA-2`, subphases `A2.2` (modal wiring) + `A2.3` (pilot route enforcement), per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`. Two levels only (`completo`/`somente_leitura`), no overrides table.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASES A2.2 + A2.3"), session model / medium effort, scoped exclusively to these two subphases.
- **Technical commit:** `09eb2a0` — `Wire admin access level into user admin` (`js/admin-usuarios-writes.js`, `js/screens/admin-usuarios-modal.js`, `js/screens/admin-usuarios.js`, `index.html`, `tests/admin-usuarios.smoke.js`). Documentation closeout: this entry.
- **A2.2 — modal wiring:** `js/screens/admin-usuarios-modal.js`'s `openUsuarioModal` gained a "Nível de acesso" select (`Completo`/`Somente leitura`, default `completo`). **Design decision 1 (field visibility):** hidden via `display:none` for fornecedor/cliente — same treatment as the existing `wrapperForn`/`wrapperCli` fields (present in the DOM, never removed, just toggled by the same `tipoSel` change listener); a non-admin row's existing `nivel_acesso` (schema default `completo`, meaningless for it) is left untouched since the update payload only adds the key when the selected `tipo === 'admin'`. **Design decision 2 (HARD STOP, confirmed):** `supabase/functions/admin-create-user/index.ts`'s `INSERT INTO usuarios` uses a fixed column list that never reads or persists `nivel_acesso` — so the select is rendered **edit-only** (`isEdit`), never on the "Novo usuário" form, and the create payload never carries the key at all. A new admin is created at the schema default (`completo`); its level is set via a follow-up edit, which works because `updateUsuario` is a raw PostgREST `update()` (not an Edge Function) and `usuarios_admin_all` (`is_admin()`-based RLS) already permits any admin to write the column. `js/admin-usuarios-writes.js`'s `fetchUsuariosPageData` select gained `nivel_acesso`. `js/screens/admin-usuarios.js`'s `tipoBadge()` gained a quiet suffix — `"Admin · leitura"` for `somente_leitura`, plain `"Admin"` for `completo` (no new column, per `UI_VISUAL_CONTRACT.md` §8.1/§7.1).
- **A2.3 — pilot route enforcement:** pilot = the users screen itself (tightest loop — where the field is edited and displayed). Two-layered, both **client-side only**: (1) UI — "Novo usuário" and all 4 row `actionButton()`s (Editar/Resetar senha/Desativar-Reativar/Excluir) render `disabled` (safe boolean pattern — the key is only ever set when `true`) with an explanatory title, gated on the acting admin's own row (`tipo='admin' && nivel_acesso='somente_leitura'`, found in the already-fetched `allUsers` — no new query) matching `meId`; (2) write helpers — every function in `js/admin-usuarios-writes.js` (`createUsuario`/`updateUsuario`/`disableUsuario`/`deleteUsuario`/`resetarSenha`/`reativarUsuario`) takes a trailing `readOnly` boolean, threaded from the screen through the modal's `options.readOnly`, and short-circuits with `{ error: { code: 'CLIENT_READONLY_FORBIDDEN', message: '...' } }` before ever calling `window.supa` — defense-in-depth if a disabled control were ever bypassed.
- **Explicit limitation (recorded, not fixed here):** a `somente_leitura` admin whose JWT still carries `tipo='admin'` can bypass all of the above via direct API calls — RLS (`usuarios_admin_all`) and every admin Edge Function key exclusively on `tipo`, not `nivel_acesso`; `is_admin_full()` (`db/62`) exists and is consumed by zero policies.
- **Tests:** +6 in `tests/admin-usuarios.smoke.js` (56/56) — select visibility (visible/hidden/edit-only-absent), edit-vs-create payload (carries the field / never carries it), grid badge, pilot enforcement for a `somente_leitura` acting admin, regression for a `completo` acting admin, write-helper refusal (`CLIENT_READONLY_FORBIDDEN`, zero `supa` calls). Fixed a genuine `§20` test-double fidelity gap in the same suite while touching it for this phase: the hand-rolled `FakeNode` didn't mirror real `<select>` behavior (an option's `.selected = true` should propagate to the parent's `.value`) and lacked a `.style` object mirror — both required by the new save-flow tests, now converged to the pattern already established in `tests/admin-usuarios-audit-panel.smoke.js`.
- **Regression proof:** `node --check` clean on all 3 changed JS files; `tests/admin-usuarios.smoke.js` 56/56; full-suite regression (`node --test tests/*.js`) verified via `git stash`/`stash pop` — 138 pre-existing failures identical before and after this phase's changes, zero new failures, exactly +6 passing (the new tests). `git diff --check` clean.
- **Registered candidates (`NOT AUTHORIZED`, both flagged `PRE-PUBLICATION`):** `A2-SERVER-SIDE-ENFORCEMENT` — RLS/Edge Functions still key exclusively on `tipo='admin'`; `somente_leitura` is UI-only and bypassable via direct API; `is_admin_full()` exists (`db/62`) and is unused by any policy; **required before any real read-only admin is trusted in production.** `A2-CREATE-NIVEL-ACESSO-WIRING` — `admin-create-user`'s fixed column list drops the field; new admins always land at `completo` and require a follow-up edit; wiring the create path requires an Edge Function change.
- **STRUCTURAL POLICY COMPLIANCE:** `§7` (size) — all 3 touched files stay well under the acceptable ceiling; `§12` (cache-busting) — the 3 touched scripts' `?v=` bumped in `index.html`; `§13` (tests) — 6 new smokes proportional to the pilot-enforcement + payload-wiring risk, plus full regression; `§14` (single scope) — A2.2+A2.3 only, no RLS/Edge Function/overrides-table/other-route/A3.4/production touched; `§15` (Git) — selective staging by literal path, single technical commit, no push; `§19` — English new code/comments/commit message, pt-BR UI strings (`"Nível de acesso"`, `"Completo"`, `"Somente leitura"`, `"Admin · leitura"`); `§20` — test-double fidelity gap found and fixed while the suite was touched for this phase, per the additive/opt-in philosophy. No Supabase/MCP/staging/production access in this phase (UI + client-side logic only); `bhgifjrfagkzubpyqpew` not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `A3.4` (legacy screen removal in `cadastros.js`) — pending its own architect order. Closes the `G28-CAMADA-2 / A2` track.

## 2026-07-17 — A3.4 (legacy user screen removal) — CLOSED / ACCEPTED — G28-CAMADA-2 TRACK COMPLETE

- **Gate:** `CLOSED / ACCEPTED` — architect ratification ("ARCHITECT RATIFICATION — A3.4: ACCEPTED"), explicitly accepting the reachability proof, the helper classification (3 orphaned removed, all shared kept), and the test removals. **This closeout closes the entire `G28-CAMADA-2` track.**
- **Front:** `G28-CAMADA-2`, subphase `A3.4` (legacy code removal in `cadastros.js`), the last subphase named in `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`. All prerequisite subphases (`A2.1`/`A2.1-B`/`A2.2`/`A2.3`, `A3.1`/`A3.2`, `A4.1`/`A4.2`, `A5.1-A5.2`/`A5.3-A5.4`, `A6.1`/`A6.1-B`/`A6.2`/`A6.3`) were `CLOSED / ACCEPTED` before this order.
- **Authorization:** explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASE A3.4"), session model / medium effort, scoped to dead-code removal only — no feature, no behavior change to the 6 remaining screens.
- **Technical commit:** `32e466a` — `Remove legacy user screen` (`js/screens/cadastros.js`, `tests/admin-delete-user.smoke.js`, `tests/admin-usuarios.smoke.js`, `tests/cadastros-screens.smoke.js`, `tests/cadastros-usuarios-auth-ui.smoke.js` deleted). Documentation closeout: this entry.
- **Reachability proof (required before the diff, per the order):** `screenCadastrosUsuarios` was declared exactly once (`cadastros.js:2218`, pre-removal) and exported twice (`window.screenCadastrosUsuarios`, `RAVATEX_SCREENS.cadastros.screenCadastrosUsuarios`). The route `#/cadastros/usuarios` in `js/boot.js` has resolved to `window.screenAdminUsuarios` since the `A3.1` cutover — never to the legacy function. A repo-wide grep found **zero production (non-test, non-doc) call sites** for the function or either export; every other hit was historical prose (`AGENT_HANDOFF.md`, `PROJECT_STATE.md`, the ledger, specs, archives) or test code.
- **Orphaned-vs-shared helper mapping (built from an actual call-site grep of every private helper in the file, not inference):** removed — `friendlyDisableMessage`, `friendlyDeleteMessage` (only callers were inside `screenCadastrosUsuarios`), `setCadastrosModalFieldVisibility` (same), plus the function itself and its two export lines. Kept — `labelFornecedorTipo`/`FORNECEDOR_TIPOS` (used by `screenCadastrosFornecedores` **and** exported to `window.*`, consumed externally by `admin-usuarios-modal.js`), `detectOptionalColumns`, the 4 CNPJ helpers, and the entire `cadastrosModal*`/`cadastrosTextarea`/`cadastrosObservacoesField`/`openCadastrosFormModal` form-helper family — all used by ≥1 of the other 6 screens.
- **Result:** `js/screens/cadastros.js` **2742 → 2184 lines** (558 removed: the function + 3 orphaned helpers + doc-comment cleanup). `tests/cadastros-usuarios-auth-ui.smoke.js` deleted entirely (38 tests, 100% targeting the legacy screen via static source assertions on `cadastros.js`). `tests/admin-delete-user.smoke.js`: removed 3 tests asserting the legacy screen's `admin-delete-user` integration (50→47); kept 4 general negative-invariant tests (still true, now more absolute — no `usuarios` code path in `cadastros.js` at all). `tests/cadastros-screens.smoke.js`: removed tests 20/20a/20b (direct calls to the deleted function) + 1 generated per-table test (32→28); every "7 telas" count/list corrected to 6; added an explicit `window.screenCadastrosUsuarios === undefined` regression assertion. `tests/admin-usuarios.smoke.js`: rewrote test 15 (was asserting the legacy screen was *untouched* pending `A3.4`; now asserts it's *gone*) — 56 tests, same count.
- **Resolved by deletion (per the order, item 4):** the `admin-create-user` invoke-envelope bug at the legacy `cadastros.js:2659` (identical to `UI-INVOKE-ENVELOPE-FIX`, already fixed in the live `js/admin-usuarios-writes.js`, previously only reported — not fixed — for this frozen legacy copy); the `checked: mostrarInativos` boolean-attribute bug at the legacy `:2348` (same class as `UI-EL-BOOLEAN-ATTR-FIX`); the `TEST-MOCK-FIDELITY-AUDIT` `R3` legacy-dead-code test-coverage gap. All three are moot — the code they lived in no longer exists.
- **Verification:** `node --check` clean on `cadastros.js` and all touched test files. Every affected suite green: `cadastros-screens.smoke.js` 28/28, `admin-usuarios.smoke.js` 56/56, `admin-delete-user.smoke.js` 47/47, `direct-cnpj-screens.smoke.js` (consumes `RAVATEX_SCREENS.cadastros.formatarCnpj`/`normalizarCnpj`) 19/19, `boot.smoke.js` + `admin-usuarios-audit-panel.smoke.js` unaffected — 209/209 combined. Full-suite parallel runs (`node --test tests/*.js`) carry pre-existing, unrelated non-determinism in this environment (one file, `g14-c-bridge-smoke.test.js`, crashes-as-one-line vs. enumerates-individually across runs; `admin-disable-user.smoke.js`, untouched by this phase, is sensitive to CRLF/LF line-ending drift between checkouts) — resolved by isolating every touched file in a temporary `git worktree` at the prior commit vs. the current state: reconciled to exactly **-45 tests (all intentional), -1 pre-existing failure eliminated (baked into the deleted dead-test file), zero new failures.** `git diff --check` clean (only the expected CRLF-on-checkout informational warning).
- **`G28-CAMADA-2` — TRACK `COMPLETE` / `CLOSED / ACCEPTED` in staging (full scope `A1-A7` + password policy):** `A1` (auth diagnostic) and `A7` (password policy) satisfied by the pre-existing architecture per `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`; `A2` (roles/permissions: `A2.1`/`A2.1-B`/`A2.2`/`A2.3`), `A3` (user administration screen: `A3.1`/`A3.2`/`A3.4`), `A4` (temporary password + forced change: `A4.1`/`A4.2`), `A5` (reset + reactivation: `A5.1-A5.2`/`A5.3-A5.4`), `A6` (audit trail: `A6.1`/`A6.1-B`/`A6.2`/`A6.3`) all `CLOSED / ACCEPTED`. **Reclassification history:** the layer entered this work cycle classified `PRE-EXISTING PARTIAL CAPABILITY` (user CRUD, disable/ban, single role `usuarios.tipo`, client/supplier link) `+ FULL SCOPE A1-A7 DEFERRED` (`G28-RECONCILIATION-DECISIONS-A`, 2026-07-15, `NOT ACCEPTED AS A DEDICATED PHASE`) and exits `CLOSED / ACCEPTED` in staging (2026-07-17).
- **Publication criterion status:** first half satisfied — `G28-CAMADA-2` `CLOSED / ACCEPTED` in staging — with **two explicit `PRE-PUBLICATION` asterisks that MUST close before production**: `A2-SERVER-SIDE-ENFORCEMENT` (RLS/Edge Functions still key exclusively on `tipo='admin'`; `nivel_acesso` enforcement is client-side only) and `A2-CREATE-NIVEL-ACESSO-WIRING` (`admin-create-user`'s fixed column list drops the field). Second half — `G28-CAMADA-3` (automated backup) — remains `NOT STARTED`, no spec, on the publication critical path.
- **Registered candidates (`NOT AUTHORIZED`):** `cadastrosModalGrid` — a pre-existing dead helper in `cadastros.js` with zero call sites anywhere, unrelated to `screenCadastrosUsuarios`/this phase (out of scope, "refactoring what remains" was forbidden); folded into `CODE-HEALTH-AUDIT-§18-R1`. Second stale git-worktree metadata entry (`baseline-check-a34`, created to isolate full-suite regression noise from this phase's own changes) — same `Permission denied` (OneDrive/AV lock) class already documented for `tapetes-baseline-check`; harmless, does not affect commits; both await one authorized cleanup pass.
- **STRUCTURAL POLICY COMPLIANCE:** `§7` (size) — `cadastros.js` shrank, no file grew; `§13` (tests) — every deletion proportional and proven via reachability grep before the diff, isolated-worktree regression proof given the full-suite's own pre-existing non-determinism; `§14` (single scope) — dead-code removal only, no other screen touched, no feature, no behavior change; `§15` (Git) — selective staging by literal path, single technical commit, no push; `§19` — English new code/comments/commit message. No Supabase/MCP/staging/production access in this phase; `bhgifjrfagkzubpyqpew` not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `ARCHITECT DECISION` — no single unambiguous next technical phase. Candidates: `G28-CAMADA-3` diagnosis (spec `BK1-BK8`, mirroring the Camada 2 approach — next on the publication critical path); the two `PRE-PUBLICATION` asterisks; `A6-GLOBAL-AUDIT-VIEW`/`AUDIT-ACTOR-SNAPSHOT`.

## 2026-07-17 — G28-CAMADA-3-DIAGNOSIS-R1 (read-only) + BK3 (backup contract) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect ratification ("ARCHITECT DECISIONS — G28-CAMADA-3": "Diagnosis G28-CAMADA-3-DIAGNOSIS-R1: ACCEPTED as reported"), plus the follow-up order "ORDER — BK3 (backup contract, docs-only)" (session model / medium effort), scoped to producing the contract document only.
- **Front:** `G28-CAMADA-3` (automated backup — the second half of the `G28-GOVERNANCE-CONSOLIDATION-A` publication criterion). First technical engagement with this front; entered the cycle `NOT STARTED, no spec`.
- **Authorization:** two-step — "ARCHITECT AUTHORIZATION — G28-CAMADA-3 DIAGNOSIS (read-only)" (session model / high effort, explicitly reasoned: "the value is judgment — scoping a backup system for a Supabase Free-tier B2B app, weighing real options against real constraints. A shallow spec costs an entire track in rework"), followed by the architect's ratification + decisions message, then "ORDER — BK3 (backup contract, docs-only)" (session model / medium effort).
- **Diagnosis method (read-only, no file changes):** read the master plan's CAMADA 3 section (`docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md:732-796`, `BK1-BK8` + P4 + hard stops), the existing manual runbook (`docs/BACKUP_AND_RESTORE.md`) and `docs/STAGING_BASELINE.md`, `docs/architecture/CODE_HEALTH_RULES.md` in full, `docs/architecture/UI_VISUAL_CONTRACT.md`, and the precedent `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md` (format mirrored). Two parallel read-only Explore agents mapped (1) `SGAA_clean_baseline`'s backup subsystem in full (scope, scheduling, storage targets, retention, integrity, restore flow, UI, logs, permissions) and (2) this repo's stateful-storage inventory (Supabase Storage usage, the Documents Ingestor's local SQLite, the Postgres schema surface, `auth.users` as a separate store, Edge Function secrets, recoverable-from-git vs. live-only assets). Independently verified live against staging (`ucrjtfswnfdlxwtmxnoo`, confirmed by the presence of `usuarios.nivel_acesso`/`db/62`, a staging-only column) via read-only Supabase MCP queries: `information_schema`/`pg_extension`/`storage.buckets`/`storage.objects` counts, `list_migrations`, and row counts for `document_link_revisions`/`document_link_revision_ops`/`usuarios_eventos`/`document_candidates`/etc.
- **Key findings (evidence-based):** 0 Supabase Storage buckets/objects confirmed live — document bytes are Drive-first (`services/documents-ingestor/README.md`), Postgres holds only pointers (`drive_file_id`, `sha256`), no `bytea`/base64 column anywhere in `db/*.sql`; `public` schema grew to ≈40 tables (38 confirmed live base tables) vs. the runbook's stale "16 tabelas"; `auth` schema has 23 base tables (not just `auth.users` — the existing runbook's `auth_users.sql`-only dump is a restore-fidelity gap, since a restore without `auth.identities` cannot authenticate); `pg_cron`/`pg_net`/`http`/`pgsodium` are available to enable but not currently enabled (a static browser app cannot itself schedule anything — the fact that drives the whole trigger-agnostic design); only 14 of 63 migrations recorded in `supabase_migrations.schema_migrations` (partial/unreliable ledger — the repo's `db/*.sql` remains the authoritative schema source); append-only canonical history confirmed present and non-trivial (`document_link_revisions`=8, `document_link_revision_ops`=10, `usuarios_eventos`=9, `document_events`=1, `document_scan_requests`=23); DB size 15 MB, tiny row counts (10 `auth.users`/`usuarios`, 40 `document_candidates`, 3 `pedidos`, 7 `ops`).
- **SGAA caveat discipline applied (same standard as Camada 2):** SGAA's engine and I/O assumptions REJECTED as stack-specific — SQLite online-backup API + atomic file-swap restore (Postgres has no single file to swap), the `@app.after_request` opportunistic pseudo-scheduler with in-process non-persisted cooldown (a static browser app has no request lifecycle to hook), server-side OAuth token storage Fernet-encrypted in the app DB (a static GitHub-Pages app holds no server secret), and SGAA's absent tested-restore drill (violates the master plan's own rule, `L772`). Correctly borrowed (information architecture/UX only): the single-page operator dashboard, GFS multi-window retention, "manual backups never expire", SHA-256 + essential-table restore-input verification, per-destination upload log with last-error surfacing, and `full`-scope RBAC gating on restore/delete.
- **Options ranked (diagnosis deliverable, informing but not identical to the architect's ratified decisions):** (A, recommended) scheduled `pg_dump` via an external CI trigger → external storage, with a staging restore drill; (B) Supabase Pro managed backups/PITR (paid, post-publication complement); (C) formalized operator runbook on Task Scheduler + cloud sync (strongest fallback; its restore drill adopted regardless of which mechanism wins); (D, not recommended as primary) in-platform `pg_cron`+`pg_net` → Edge Function exporter (re-implements `pg_dump` poorly, fragile `auth`-schema restore). Ranking for this project: A > C > B > D.
- **Architect decisions ratified (superseding the diagnosis's specific trigger recommendation):** (1) **scope** — `public` data + the **full `auth` schema** (not just `auth.users`; the diagnosis's `auth.identities` finding accepted); document bytes **out of scope by design** (Drive-first); Storage re-verified as 0 buckets every cycle, fails loudly if a bucket ever appears; (2) **trigger** — `DEFERRED BY ARCHITECT` (likely GitHub Actions or Vercel cron, decided with hosting) — consequence: the exporter must be **trigger-agnostic**, self-contained, idempotent, parameterized, invokable by any scheduler or by hand, with zero scheduling logic inside the exporter itself; registered `CAMADA3-TRIGGER-SELECTION`, `NOT AUTHORIZED`, blocks the "automated" half of the publication criterion; (3) **destinations** — multi-destination by design (SGAA's per-provider pattern); Google Drive primary, implemented now (reuses the Ingestor's OAuth pattern); OneDrive second destination, interface-ready/not configured, ships disabled with its wiring in place; `backup_runs`/the exporter/this contract must never hardcode a single-destination assumption.
- **Documentation commit:** this closeout, together with `docs/architecture/CAMADA3_BACKUP_CONTRACT.md` (new). Docs-only — no code, test, SQL, migration, Supabase, staging, production, or Vercel accessed/changed beyond the read-only diagnosis queries already logged above. The current HEAD must be consulted directly with `git rev-parse HEAD`.
- **`BK3` contract contents (`docs/architecture/CAMADA3_BACKUP_CONTRACT.md`, `PROPOSED`, ratified as the binding premise for later subphases):** §1 scope (in/out, with the `auth`-schema and Drive-first-bytes rationale spelled out); §2 cadence/retention (GFS 4-window model — 24h/7d/4wk/12mo — "manual backups never expire"); §3 integrity (SHA-256 + per-table row-count manifest as the restore assertion baseline, essential-table presence check); §4 N-destination contract (Drive primary, OneDrive interface-ready, per-destination status/last-error, the known single-destination-loss risk registered honestly); §5 trigger-agnostic exporter contract (invocation/inputs/outputs/exit codes/idempotency/`backup_runs` recording — mirrors the Ingestor's `--confirm-real-google` and `watch:scan-requests` envelope precedents); §6 restore SLO + drill contract (monthly + after every migration, scratch target only, 7-step mechanical procedure culminating in a real login proving `auth.identities` restored, disqualification rule for any untestable-in-staging mechanism); §7 explicit limits (production restore never rehearsed against production, account/vendor loss out of scope, trigger deferred); §8 stale-docs finding (`docs/BACKUP_AND_RESTORE.md`/`docs/STAGING_BASELINE.md` describe a pre-Documents world — refresh registered as part of `BK7`, not fixed in this docs-only phase); a BK-sequence recap table (`BK1`/`BK2` closed by the diagnosis, `BK3` closed by this contract, `BK4.1`-`BK8` + `CAMADA3-TRIGGER-SELECTION` all `NOT AUTHORIZED`); and a `STRUCTURAL POLICY COMPLIANCE` section.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — diagnosis (read-only) and contract (docs-only) kept as one combined documentary phase per the architect's explicit two-order sequence, no code/SQL/staging/production touched at any point; `§15` (Git) — selective staging by literal path, single documentation commit, no push, no forbidden git ops; `§18` (periodic audit posture) — the diagnosis itself functions as the read-only audit this front had never received; `§19` — English throughout, ready for pt-BR UI strings once `BK5` eventually builds the panel; staging-only execution boundary (`STAGING-ONLY-EXECUTION-BOUNDARY-A`) — every live query was read-only against staging (`ucrjtfswnfdlxwtmxnoo`), production (`bhgifjrfagkzubpyqpew`) never accessed, no production wiring proposed or implied as current work.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after commit aside from pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `BK4.1` (`backup_runs` schema + `service_role` writer RPC), pending its own architect order — or `CAMADA3-TRIGGER-SELECTION` first, if the architect resolves hosting before schema work. `BK4.2` (the exporter), `BK7` (restore runbook + stale-docs refresh), and `BK8` (real recovery drill) are each their own risk gate, named explicitly in the contract.

## 2026-07-17 — BK4.1 (backup_runs schema) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ARCHITECT AUTHORIZATION — SUBPHASE BK4.1 (backup_runs schema)"), Sonnet 5 / medium effort, scoped to `BK4.1` exclusively — `BK4.2` (exporter), `BK5`, `BK6`, `BK7`, `BK8` each require their own order.
- **Front:** `G28-CAMADA-3`, subphase `BK4.1`, per `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`.
- **Technical commit:** `d39a848` — `Add backup runs schema` (`db/64_backup_runs_schema.sql`, `tests/backup-runs-schema.smoke.js`). Documentation closeout: this entry, in a separate commit after staging verification, per the order's explicit instruction.
- **Two new tables:** `public.backup_runs` — append-only run record (`started_at`, `finished_at`, `status` `running|completed|failed`, `scope` `CHECK`-locked to the single ratified value `'public+auth'`, `bytes` (`>=0` when present), `sha256` (format-checked `^[0-9a-f]{64}$`), `row_count_manifest` JSONB object-checked, `triggered_by` `scheduled|manual`, `retention_class` `gfs|manual`, `error`); `terminal_times_check` requires `finished_at IS NULL` iff `status='running'`; `failed_reason_check` requires non-null `error` iff `status='failed'`. `public.backup_run_destinations` — child table, `run_id` `REFERENCES public.backup_runs(id) ON DELETE CASCADE`, `destination`, `status` `pending|ok|failed|skipped`, `uploaded_at`, `error`; unique `(run_id, destination)`; `ok` requires `uploaded_at`, `failed` requires `error`.
- **Destination-model decision (justified per the order's request):** a **child table**, not a JSONB column — matches the contract's requirement that per-destination status/last-error be first-class (`"Drive OK / OneDrive skipped"` as a row, not a parsed blob), and lets a future `BK6` retention pass or `BK5` UI panel query/join destinations directly. Within that table, **`destination` is deliberately left an open `TEXT` field** — only a non-empty/lowercase format `CHECK`, no enumeration — because the contract (§4) explicitly requires adding a second destination (OneDrive) to never need a schema migration. This is the one deliberate asymmetry against `backup_runs.scope`, which **is** `CHECK`-locked to the single value `'public+auth'`, because the contract (§1/§7) treats any scope change as its own gated revision event, not a free-text possibility.
- **Writer path — two `service_role`-only RPCs, mirroring `db/38`'s two-phase shape and `db/49`'s internal gate:** `public.iniciar_backup_run(p_scope, p_triggered_by, p_retention_class)` opens a run in `status='running'`; `public.finalizar_backup_run(p_run_id, p_status, p_bytes, p_sha256, p_row_count_manifest, p_error, p_destinations JSONB)` closes it `completed`/`failed` **and** writes one `backup_run_destinations` row per element of `p_destinations` in the same transaction — any single destination `INSERT` failure (malformed element) rolls back the entire call, so a run is never left recorded as terminal with partial/missing destinations. Both RPCs gate internally on `auth.role() = 'service_role'` (`RAISE EXCEPTION 'writer_required'` otherwise), not relying on `GRANT` alone — mirrors `db/49`'s `upsert_document_technical_evidence_ingestor_state` pattern exactly, since the exporter has no JWT (same authorization path as the admin Edge Functions).
- **RLS/ACL — stricter than the `db/38` precedent by explicit order:** admin-only `SELECT` policy on both tables (`USING (public.is_admin())`); **no `INSERT`/`UPDATE`/`DELETE` policy for any client role on either table** — unlike `db/38`'s admin-`FOR ALL` policies, even an authenticated admin session cannot write directly; every write goes through the two `SECURITY DEFINER` RPCs, which write as the table owner (`postgres`) and bypass RLS by ownership, never by a permissive policy. Full, complete ACL stated in the migration itself (`db/57`/`db/63` standard, not a delta): `REVOKE ALL` from `PUBLIC`/`anon`/`authenticated`/`service_role` on both tables, then `GRANT SELECT` to `authenticated` only; `REVOKE ALL` from `PUBLIC`/`anon`/`authenticated` on both RPCs, then `GRANT EXECUTE` to `service_role` only.
- **Staging (`ucrjtfswnfdlxwtmxnoo`, confirmed via the `usuarios.nivel_acesso`/`db/62` fingerprint before apply): applied.** Registry `20260717125153 / 64_backup_runs_schema`. Pre-state clean (neither table existed; confirmed by direct query before apply).
- **Verification (`BEGIN…ROLLBACK`, synthetic fixtures, cleanup confirmed zero — `0` rows in both tables read back after `ROLLBACK`), 17/17 checks:**
  1. anon `SELECT backup_runs` → `42501` (table `GRANT` boundary).
  2. non-admin authenticated (`fornecedor`) `SELECT backup_runs` → succeeds, `0` rows (RLS filters, `GRANT` allows the attempt).
  3. anon calling `iniciar_backup_run()` → `42501` (only `service_role` has `EXECUTE`).
  4. admin authenticated calling `iniciar_backup_run()` → `42501` (same — admin status is irrelevant to this `GRANT`; only `service_role` may call).
  5. **Defense-in-depth:** DB role `service_role` with a JWT `role` claim manually set to `authenticated` (a deliberately mismatched simulation) → the internal `auth.role()` gate still fires (`writer_required`) — proves the internal check inside the function body is not dead code redundant with the outer `GRANT`.
  6. `service_role` (DB role + aligned JWT claim) opens run 1 via `iniciar_backup_run()` → success, `run_id` captured.
  6b–6d. `finalizar_backup_run`'s three graceful-error branches fire correctly on malformed input: `status='failed'` with no `error` → `error_required_when_failed`; a non-object `row_count_manifest` (a JSON array) → `row_count_manifest_invalid`; a non-array `p_destinations` (a JSON object) → `destinations_invalid`. None of these raise a raw exception — all return `{ok:false, error:...}` as designed.
  7. `finalizar_backup_run` closes run 1 as `completed` with **two destination rows in one call** (`google_drive:ok` + `onedrive:skipped`) → success, `destinations_recorded:2`.
  8. A second run (`triggered_by='scheduled'`, `retention_class='manual'` — proving the "a scheduled run can still be pinned manual retention" design intent from the contract) opened and finalized `failed` with one `failed` destination (`google_drive`, with an `error`) → success.
  9. Double-finalize of the already-`completed` run 1 → graceful `run_not_running_or_not_found`, not a crash — proves the strict `WHERE status='running'` transition guard.
  10. `service_role` attempting a **raw** `UPDATE` on `backup_runs`, bypassing both RPCs → `42501` — proves `service_role` itself has zero direct table grant; only the RPCs (running as table owner) can write.
  11. **The order's literal required test:** admin authenticated reads run 1 back — `status='completed'`, `bytes=1048576`, `sha256` 64 chars, `row_count_manifest` correct, and **both destination rows read back correctly** (`google_drive:ok, onedrive:skipped`) — exact match.
  12. Admin authenticated attempting `UPDATE`/`DELETE` on `backup_runs` and `UPDATE` on `backup_run_destinations` → `42501` on all three — append-only intent holds even for an admin session, confirming no write policy exists at all.
- **Tests:** `tests/backup-runs-schema.smoke.js`, 17/17 (static source assertions — every column/default, every `CHECK` constraint including the `scope`-locked-vs-`destination`-open asymmetry, RLS policy shape and completeness, both RPC signatures/`SECURITY DEFINER`/gate/validation branches, no destructive DDL, no secrets, `db/62`/`db/63` non-regression). Purely additive change (two new files; zero existing files modified) — **regression is guaranteed by construction**: full suite `3792` tests / `3658` pass / `134` fail (pre-existing, documented flakiness class, unrelated to this phase) / `+17` new tests, all passing.
- **Forbidden scope honored:** no exporter (`BK4.2`), no UI (`BK5`), no retention pruning (`BK6`), no CI config, no production access, no push.
- **Hard stops:** none encountered — project ref confirmed staging before apply; migration was not already recorded; final ACL matches intent exactly (verified live via the role matrix, not assumed); `db/60`-`db/63` untouched (confirmed by the non-regression test).
- **STRUCTURAL POLICY COMPLIANCE:** `§7` (size) — both new files well under the acceptable ceiling; `§9` (Supabase writes) — writes confined to the two named RPCs, affected tables/operation/payload/error-behavior/atomicity all documented in-file; `§13` (tests) — migration smoke proportional to risk, allow-list-style static assertions, full staging role-matrix as the real gate; `§14` (single scope) — schema/RPC only, no exporter/UI/retention/CI/production mixed in; `§15` (Git) — selective staging by literal path, single technical commit, no push, no forbidden git ops; `§19` — English new code/comments/commit message. No production access (`bhgifjrfagkzubpyqpew` not accessed); no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after both commits aside from the pre-existing untracked `supabase/.temp/`.
- **Next phase indicated at closeout:** `BK4.2` (the exporter), pending its own architect order — its own risk gate per the contract (DB credential handling, full `auth`-schema dump/restore fidelity). `BK5`–`BK8` and `CAMADA3-TRIGGER-SELECTION` remain `NOT AUTHORIZED`, each pending its own order.

## 2026-07-17 — BK4.2 (the exporter) — first real execution + restore-smoke — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ARCHITECT — RESOLVE BEFORE CLOSEOUT"), two-step: (1) read-only, determine which OAuth client the successful run used, before closing; (2) close `BK4.2` recording the restore-smoke evidence, the Client ID answer (or explicit `UNRESOLVED`), a contract note on bundle secrecy, and `CAMADA3-DRIVE-ACTIVATION`/`CAMADA3-TRIGGER-SELECTION` state. Documentation commit only, no push.
- **Front:** `G28-CAMADA-3`, subphase `BK4.2`, per `docs/architecture/CAMADA3_BACKUP_CONTRACT.md`. The exporter's code (`scripts/backup/export-db.mjs` + `scripts/backup/lib/*`) was already committed prior to this closeout (`4831ca3` — `Add trigger-agnostic database exporter`; `75f8ff9`, `153b2a2`, `51c4633`, `e11d05e` — four follow-up OAuth/credential-handling fixes). This closeout adds **no new code** — it is verification of an already-committed mechanism, followed by a docs-only commit.
- **Provenance of the claim:** the architect relayed a "BK4.2 — REAL STAGING EXPORT COMPLETED SUCCESSFULLY" report obtained via a separate ChatGPT session. Per this project's own supervision governance (`PROJECT_STATE.md`: "ChatGPT is a process consultant without state custody and without authority to issue orders"), the claim was **not accepted on report alone** — it was independently re-derived from three ground-truth sources before anything else proceeded.
- **Claim verification (read-only, before any restore attempt):** the bundle file `backups/ravatex-backup-20260717T171339Z.tar.gz` exists on disk; its SHA-256, recomputed independently (`dab5bb03422e3662af471d30d77091f98afb7199199897e7f6f1c22a13977c2`), matched the `backup_runs.sha256` value read live from staging (`ucrjtfswnfdlxwtmxnoo`) exactly. `backup_runs.id = ae55e714-3f58-49b0-957d-7b959de7b630`: `status=completed`, `bytes=83378`, `triggered_by=manual`, `retention_class=manual`. `backup_run_destinations`: `google_drive=ok` (`uploaded_at` recorded), `onedrive=skipped`. `row_count_manifest` matched the reported highlights exactly: `auth.users=10`, `auth.identities=8`, `public.usuarios=10`, `public.ops=8`, `public.pedidos=4`, `storage_buckets_count=0`. A prior attempt, `backup_runs.id = 0ab0c04b-6b83-41fc-af99-1e82aac2fd40`, failed with `google_token_request_failed_400: invalid_grant: Token has been expired or revoked` (a stale, previously-copied Documents Ingestor token — not a client/credential mismatch) — retained as legitimate history, not remediated.
- **Restore-smoke drill (mechanism proof; not `BK8`'s formalized/repeatable version):** the bundle was extracted for inspection. A permission check correctly **blocked** a first attempt to `head` the extracted `auth_full.sql`, flagging that it would print real staging password hashes/session data into the transcript — every subsequent check used structural `grep` on schema-level SQL keywords or `count(*)`/boolean queries only, never row content. Found no extension/role dependencies in either dump file (`--no-owner --no-privileges` throughout) — self-contained, restorable into a vanilla Postgres. Spun up an isolated local scratch PostgreSQL 18.4 cluster (`initdb`/`pg_ctl`, ephemeral port `5555`, temp data directory, `-k ""` disabling unix sockets) — never staging, never production. Restored in the contract's mandated order — `auth_full.sql` → `schema_public.sql` → `data_public.sql` — **zero `ERROR` lines across all three files**. Built a PL/pgSQL dynamic-SQL count of every restored table (avoiding a fragile shell-loop that had initially mis-generated a query and produced a false "table does not exist" — corrected and re-verified) and diffed against the bundle's own `manifest.json`: **63/63 tables matched exactly, 0 mismatches** — including `auth.identities = 8` explicitly, resolving in mechanism the exact restore-fidelity gap the original diagnosis (`G28-CAMADA-3-DIAGNOSIS-R1`) flagged against the pre-existing `auth.users`-only runbook. Referential integrity: `0` orphaned `auth.identities` (all reference a valid `auth.users` row), `0` orphaned `public.usuarios`→`auth.users` FK rows (the cross-schema invariant `CODE_HEALTH_RULES.md` §11 depends on); all 10 restored users carry a non-empty `encrypted_password` hash (structural proof a real login is possible — no live login attempted, since that needs a real password not handled in this pass). Canonical append-only history intact: `document_link_revisions=8`, `usuarios_eventos=9`. **Cleanup:** `pg_ctl stop -m fast`, then the entire temp directory (which held real staging password hashes/tokens) removed; confirmed no stray postgres process remained.
- **OAuth client — resolved via Google's own infrastructure, not inferred (task 1 of the order):** two different OAuth client JSON files exist locally in `.ravatex-local/` — the Documents Ingestor's own (`334691504707-eh26scjcmgetfrmfsc2ndgi8de6kdb07.apps.googleusercontent.com`, dated 2026-07-06, matching that file's mtime) and a second, apparently-unused one (`...9v4j8gv9fvd34jjj5s1vgnvrglgvhsl4...`, dated 2026-07-11 — predating today's session, most likely a leftover from `BK4.2`'s originally-designed dedicated grant, abandoned when the architect later decided to reuse the Ingestor's client operationally). The one login attempt with a local log (`backup-login.log`, UTF-16LE, converted for inspection) used the Ingestor's client but failed ("No code received. Aborting." — no code was ever pasted); no log captured the successful token's actual origin, since `runExport()`'s logging never echoes `clientId` (confirmed by reading `export-core.mjs`/`drive.mjs` directly) and grepping the two run logs (converted from UTF-16LE first, after an initial plain-`grep` false negative from encoding mismatch) found no client_id string in either. Resolved **definitively**: the access token in `.ravatex-local/backup-google-token.json` was still valid (33 minutes remaining, checked via `expiry_date` vs. current time — timestamps only, no secret printed); called `https://oauth2.googleapis.com/tokeninfo?access_token=...` (a read-only introspection needing only the access token itself, never a client secret) and read only the response fields (`access_token` explicitly deleted from the object before logging) — both `aud` and `azp` resolved to `334691504707-eh26scjcmgetfrmfsc2ndgi8de6kdb07.apps.googleusercontent.com`, independently cross-checked against that exact string in the Documents Ingestor's own `.env` (`GOOGLE_CLIENT_ID=...`) at the separate, standalone repo `D:\OneDrive\Programação\Ravatex\documents-ingestor\` (its own `.git`, no relation to this repo's `services/documents-ingestor/` copy). **Conclusion: the successful run reused the Documents Ingestor's OAuth client — not a dedicated grant**, contradicting the premise stated in `CAMADA3_BACKUP_CONTRACT.md` §4 ("a new, dedicated OAuth grant and folder for backups").
- **Contract amended (`docs/architecture/CAMADA3_BACKUP_CONTRACT.md`):** status banner changed `PROPOSED`→`RATIFIED`; §4 gained a dated amendment recording the OAuth-reuse finding in full, the coupling consequence (rotating/revoking the Ingestor's grant breaks backups too), and the two registered remediation options (formalize the reuse, or build a genuinely dedicated client) — explicitly not decided here; §6 gained a new binding rule, **"Bundle contents are secrets"** — every drill (this one and `BK8`'s formalized version) inspects structure and row counts only, never prints/logs/persists actual row content, and bundles remain gitignored and must never be committed; the BK sequence table updated (`BK4.1`/`BK4.2` → `CLOSED / ACCEPTED`; `BK8` clarified as "one manual drill performed, formalized/repeatable version still pending"; `CAMADA3-DRIVE-ACTIVATION` added as a new tracked row); a full "Amendment 2026-07-17 — BK4.2 first real execution (findings)" section added before `STRUCTURAL POLICY COMPLIANCE`; the closing banner updated to reflect ratified status. No other canonical document rewritten — `PROJECT_STATE.md`/`AGENT_HANDOFF.md`/this entry are the closeout record; the contract itself carries the technical amendment.
- **Registered, per the order:** `CAMADA3-DRIVE-ACTIVATION` — **partially exercised** (one real manual `google_drive` upload succeeded in staging) but `NOT AUTHORIZED` as a standing/repeated/production capability (`BK5` UI, `BK6` retention, the trigger, and the OAuth-coupling decision all still pending). `CAMADA3-TRIGGER-SELECTION` — reconfirmed still `NOT AUTHORIZED`/deferred, unchanged by this closeout. `CAMADA3-OAUTH-GRANT-COUPLING` — new, `NOT AUTHORIZED`, live debt requiring an explicit architect decision (formalize vs. de-couple).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — verification-only, no exporter/UI/retention/CI code touched, contract amendment is docs-only; `§15` (Git) — this closeout is a single documentation commit, selective staging by literal path, no push; `§19` — English throughout. No Supabase writes beyond the two already-existing recorded runs (no new `iniciar_backup_run`/`finalizar_backup_run` calls made by this closeout itself — only `SELECT`s against `backup_runs`/`backup_run_destinations`, and a fully isolated local scratch Postgres for the restore, destroyed after use). Production (`bhgifjrfagkzubpyqpew`) not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after this commit aside from the pre-existing untracked `supabase/.temp/`; the restore-drill's temp directory and scratch Postgres cluster were fully removed before this commit, never tracked by git.
- **Next phase indicated at closeout:** `BK5` (read-only UI panel + manual-trigger write), pending its own architect order, mockup gate first — or resolution of the `CAMADA3-OAUTH-GRANT-COUPLING` decision, which may be worth settling before `BK5`/`BK6` build further on top of the current Drive integration. `BK6`, `BK7`, `BK8` (formalized), and `CAMADA3-TRIGGER-SELECTION` remain `NOT AUTHORIZED`, each pending its own order.

## 2026-07-17 — PRODUCTION-READINESS-DIAGNOSIS-R1 (read-only) ratified + BACKLOG FREEZE — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect order "ARCHITECT — RATIFY DIAGNOSIS + FREEZE BACKLOG (docs-only)": (1) accept `PRODUCTION-READINESS-DIAGNOSIS-R1` and record it as a ratified reference report (precedent `BACKLOG_RECONCILIATION_R1`), its 12-item ranked residual risk register now canonical; (2) record the amended publication criterion; (3) record the backlog freeze; (4) correct the branch commit count to 749; (5) register the `M0`-`M10` migration plan as the active track, all phases `NOT AUTHORIZED`; (6) update ledger + `PROJECT_STATE` + `AGENT_HANDOFF` + `DOCUMENTATION_INDEX` in a single commit, no push.
- **Front:** whole-system production-readiness / migration to a new environment (new repo + new Supabase project + Vercel). First engagement with this front as an authorized track; supersedes the deferred `DEPLOYMENT_MAPPING_AND_PRODUCTION_MIGRATION_PROCEDURE` candidate.
- **Authorization:** two-step — "ARCHITECT AUTHORIZATION — PRODUCTION-READINESS-DIAGNOSIS-R1 (read-only)" (Opus 4.8 / high effort, explicitly reasoned: "judgment over a whole-system move; a shallow answer is discovered in production"), followed by the ratification order above (docs-only). Nothing in either order authorized execution of any migration phase.
- **Diagnosis method (read-only, no file changes in the diagnosis phase):** read `PROJECT_STATE.md` + `AGENT_HANDOFF.md` for state; three parallel read-only investigation agents gathered (1) the schema/migration inventory (`db/` ordered set, `setup_completo.sql` staleness, migration-ledger reconciliation), (2) config/edge-functions/ingestor/backup — everything pointing at `ucrjtfswnfdlxwtmxnoo` or holding secrets (file:line, no secret values printed), and (3) git state (branch, commit count, remotes, worktrees, SHA-citation scope, gitignore/secret safety). No live Supabase queries issued; production `bhgifjrfagkzubpyqpew` not accessed.
- **Report deliverable (`docs/reports/PRODUCTION_READINESS_DIAGNOSIS_R1_2026-07-17.md`, ratified reference report):** §1 migration inventory (authoritative schema path = ordered `db/01`→`db/64` replay, NOT `setup_completo.sql` — pre-Pedido partial — and NOT `supabase db push` — ledger records only 14 of 63, silently skipping ~49; auth migrate-via-`BK4.2`-bundle vs recreate-fresh; 5 edge functions × 3 secrets, deploy order; config/ingestor/backup repoint surface; 0 Storage buckets, self-verifying); §2 Vercel + repo-linked Supabase (Vercel cron does NOT resolve `CAMADA3-TRIGGER-SELECTION` — the exporter shells out to `pg_dump`/`psql`, use GitHub Actions; repo-linked preview deploys are a real DB-exposure vector for a static app shipping its Supabase key in `js/config.js`); §3 branch recommendation (full-history push of 749 commits preserves ~656 SHA citations across 49 docs; squash/fresh-start rejected; stale worktree registrations die with the old `.git`); §4 canonical residual risk register (12 items, ranked by production consequence, with before-first-user / first-week / deferrable timing); §5 minimum pre-launch set (recommendation); §6 the `M0`-`M10` migration plan with per-phase gates, rollback path, and five things unverifiable-until-live.
- **Decisions recorded (per the order):** (1) diagnosis `ACCEPTED`, registered as a ratified reference report in `DOCUMENTATION_INDEX.md` §1d; its residual risk register is now canonical (mirrored in `PROJECT_STATE.md` "Live debts and candidates"). (2) **Amended publication criterion** — publication proceeds with Camada 3 at `BK4.2`; remaining Camada-3 scope (`BK5`/`BK6`/`BK7`/`BK8`, `CAMADA3-TRIGGER-SELECTION`) and the two `PRE-PUBLICATION` asterisks (`A2-SERVER-SIDE-ENFORCEMENT`, `A2-CREATE-NIVEL-ACESSO-WIRING`) become `POST-LAUNCH DEBT` with production consequences; the reviewer objection (minimum pre-launch set) recorded and **overruled** — the architect decides which register items close before cutover. Supersedes `G28-GOVERNANCE-CONSOLIDATION-A`'s "both Camada-2 and full Camada-3 CLOSED" premise (verbatim original preserved in `PROJECT_STATE.md`). (3) **`BACKLOG FREEZE`** — no NEW fronts until after cutover (`M10`); only the `M0`-`M10` plan and the canonical residual risk register are authorizable work. (4) Canon corrected: branch commit count = **749** (`git rev-list --count HEAD`), not "~555". (5) `M0`-`M10` registered as the **active track**, every phase `NOT AUTHORIZED` pending its own individual order.
- **Migration target coordinates (all newly created, empty — supplied by the architect):** GitHub `inttexsystem/inttracker` (`https://github.com/inttexsystem/inttracker.git`); Supabase `gqmpsxkxynrjvidfmojk` (`https://gqmpsxkxynrjvidfmojk.supabase.co`; key supplied is the **new-format** publishable key `sb_publishable_…`, not a legacy anon JWT — key-regime decision pending); Vercel `vercel.com/inttex` (repo-linked).
- **Separate technical commit (done first, per the order):** `be6f081` — `Ignore supabase CLI temp cache` — added `supabase/.temp/` to `.gitignore`; the 8 untracked CLI-cache files (`project-ref`, `pooler-url`, `linked-project.json`, version stamps) leaked the Supabase project ref + pooler URL, and `M0` will push 749 commits. Verified: `git check-ignore` now matches; the 8 files dropped out of `git status`. No real secrets were ever tracked (only `.env.example` templates + backup code/docs).
- **Documentation commit:** this closeout, together with the new report, `PROJECT_STATE.md` (active track, amended publication criterion, backlog freeze, canonical residual risk register, 749 correction, Vercel-selected), `AGENT_HANDOFF.md` (new top entry), and `DOCUMENTATION_INDEX.md` §1d (report registered). Single commit "Ratify production readiness diagnosis and freeze backlog", separate from the `.gitignore` commit above.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — diagnosis (read-only) + ratification (docs-only) kept as documentary work; no code/SQL/staging/production touched; `§15` (Git) — selective staging by literal path, two separate single-purpose commits (`.gitignore` first, then docs), no push, no forbidden git ops; `§19` — English throughout. Staging-only execution boundary respected (no live queries in this phase); production (`bhgifjrfagkzubpyqpew`) not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Final worktree state:** clean after both commits; `supabase/.temp/` now ignored (no longer shows as untracked).
- **Next phase indicated at closeout:** an individual order for `M0` (new repo landing — full-history push of 749 commits to `inttexsystem/inttracker`, gitignore already done), or any other `M0`-`M10` phase. All ten migration phases remain `NOT AUTHORIZED`, each pending its own order; the backlog freeze holds until after cutover (`M10`).

## 2026-07-17 — PROJECT-STATE-COMPACTION-B (+ pre-migration architect decisions) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect order "ORDER — PROJECT-STATE-COMPACTION-B (+ architect decisions)" (Sonnet 5 / medium effort; method identical to `PROJECT-STATE-COMPACTION-A`, `dd63868`). Docs-only; no other phase in parallel (rewrites `PROJECT_STATE`).
- **Front:** living-state maintenance + recording three pre-migration architect decisions.
- **Part 1 — architect decisions recorded** in `PROJECT_STATE.md` "Binding decisions in force" (§Pre-migration decisions): (a) **key regime = new format** — `sb_publishable_` + a matching secret key, standardized across `js/config.js`, `scripts/backup/*`, `scripts/staging/*`, the Ingestor (in-repo + standalone twin), and asserting tests; no legacy anon/service_role JWTs; the secret key never in chat or repo (`supabase secrets` / Vercel env / GH Actions secrets only). (b) **launch user model = full-trust admins only** — no `somente_leitura` admin may be created in production until `A2-SERVER-SIDE-ENFORCEMENT` closes; the constraint IS the mitigation (risk unchanged, exposure zero only while it holds); `A2-SERVER-SIDE-ENFORCEMENT` + `A2-CREATE-NIVEL-ACESSO-WIRING` therefore rank FIRST-WEEK in the residual risk register (was before-first-user-conditional). (c) **standing pre-launch items** — `DELETE-PROD-GUARD-A`, the backup trigger via GitHub Actions + the `BK7` runbook, and the auth-restore rehearsal into a throwaway Supabase project before `M3`.
- **Part 2 — compaction (method = `PROJECT-STATE-COMPACTION-A`):** `PROJECT_STATE.md` → current-state-only, **803 → 357 lines** (−446, −55%). Five contiguous narrative ranges moved **verbatim** (via `sed` byte-exact extraction, not retyped) to `docs/closeouts/PROJECT_STATE_ARCHIVE_2026-07.md` under a new `## Batch: PROJECT-STATE-COMPACTION-B` divider (archive 1082 → 1530 lines, +448 incl. section headings/notes): (1) the former "Active phase" Camada-2 subphase closeout sub-bullets (A3.4, A2.2/A2.3, A2.1/A2.1-B, L1, L2, TEST-MOCK-FIDELITY-AUDIT, A6 track, UI-INVOKE-ENVELOPE-FIX, A2/A6 candidates); (2) the superseded Publication Criterion `G28-GOVERNANCE-CONSOLIDATION-A` + G28-CAMADA-3 BK3/BK4.1/BK4.2 inline narrative + G28-CAMADA-2 classification; (3) UI-EL-BOOLEAN-ATTR-FIX confirmed-regression narrative + TEST-MOCK-FIDELITY-AUDIT ruling narrative; (4) the resolved test-baseline note; (5) the UI-ACTION-BUTTON + UI-GRID-TEXT-OVERFLOW track narratives. Each is replaced by a condensed ruling and/or a "Closed phases" table row in `PROJECT_STATE.md`.
- **KEEP (current state, condensed where a ruling):** active track (`M0`-`M10`) + next authorizable action + backlog freeze; all binding decisions in force (Part 1, amended publication criterion, backlog freeze, staging-only boundary — its Vercel/production-postponement items noted as superseded, the `bhgifjrfagkzubpyqpew` don't-touch rule fully in force); the 12-item residual risk register (with Part-1 timing amendments); live debts; environment standing facts; the "Closed phases" index (42 rows, KEEP per the order); mandatory links; historical reference.
- **NOTHING deleted:** every former line is either in the new `PROJECT_STATE.md` or verbatim in the archive batch — proven by the classification table in the phase report. The pre-first-compaction byte-for-byte snapshot (`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md`) is untouched.
- **Verification:** archive append boundaries spot-checked (batch divider at archive line 1086; first moved bullet = the A3.4 sub-bullet, verbatim); new file 357 lines (Closed-phases index = 46; prose body ≈ 311, at the ~300 target); status tokens preserved (`CLOSED / ACCEPTED`, `NOT AUTHORIZED`, `POST-LAUNCH DEBT`, `PRE-PUBLICATION`); cross-references resolve (report, backup contract, archive, ledger, DOCUMENTATION_INDEX).
- **Pointer sync:** `AGENT_HANDOFF.md` — not compacted; a top entry added recording this compaction + the three Part-1 decisions (precedent: the `PROJECT-STATE-COMPACTION-A` handoff note). `docs/DOCUMENTATION_INDEX.md` — the archive entry updated to name the `PROJECT-STATE-COMPACTION-B` batch.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only compaction + decision recording, no code/SQL/staging/production touched; `§15` (Git) — selective staging by literal path, single commit, no push; `§19` — English throughout. `bhgifjrfagkzubpyqpew` not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Next phase indicated at closeout:** unchanged — an individual order for `M0` or any `M0`-`M10` phase; backlog freeze holds until after cutover.

## 2026-07-17 — PROJECT-STATE-COMPACTION-B (completion, linked to the entry above) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — the architect **re-issued** "ORDER — PROJECT-STATE-COMPACTION-B (+ architect decisions)" with two additions over the first pass: a new decision **(d)** and an explicit reassertion of the **≤ ~300-line** verification gate (the first pass landed at 357 and flagged the overage). Append-only linked correction of the compaction-B entry above — the prior entry is not rewritten.
- **Decision (d) recorded** (`PROJECT_STATE.md` "Environment and worktree standing facts"): **Supabase MCP configured and verified against `gqmpsxkxynrjvidfmojk`, read-only, token held outside the repo.** Read-only introspection of the new project is available; no write path is authorized outside a specific `M0`-`M10` order.
- **Compaction completed to gate:** `PROJECT_STATE.md` trimmed **357 → 301 lines** (≤ ~300 gate met). The bulk saving is the "Closed phases" index: the 2026-07-16 era (16 phases) and the 2026-07-15-and-earlier era (13 phases) each collapsed into a single pointer row that **retains every commit SHA** and points to the ledger/archive; the 2026-07-17 migration-era rows stay explicit. The remainder is prose compression of already-condensed rulings (no ruling dropped) — every binding decision, the 12-item residual register, all live debts, and all environment facts remain. No further content moved to the archive (the compaction-B archive batch from the first pass is unchanged); nothing deleted.
- **Verification:** new file **301 lines**; status tokens preserved (`CLOSED / ACCEPTED`, `NOT AUTHORIZED`, `POST-LAUNCH DEBT`, `BEFORE-FIRST-USER`/`FIRST-WEEK`, `M0`-`M10`, `749`); Part-1 decisions a/b/c/d all present; cross-references resolve. `AGENT_HANDOFF.md` top entry updated (line count 357→301, decision (d) added); `docs/DOCUMENTATION_INDEX.md` archive entry already names the compaction-B batch (no further change).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only; `§15` (Git) — selective staging by literal path, single commit, no push; `§19` — English throughout. `bhgifjrfagkzubpyqpew` not accessed; no push.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed.
- **Next phase indicated at closeout:** unchanged — an individual order for `M0` or any `M0`-`M10` phase; backlog freeze holds until after cutover.

## 2026-07-17 — M0 (repository migration — push to inttexsystem/inttracker) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit single-use architect order "ARCHITECT AUTHORIZATION — M0 (push to the new repository)" (Sonnet 5 / low effort — mechanical git operations, fully specified, verifications as the gate). Git-only phase: no file changes, no Supabase, no Vercel, except the final small docs-record commit named by the order.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M0` (new repo landing), first phase of the active migration track to execute.
- **Pre-flight (per the order, stop-on-anomaly):** `git status --short` clean; `git log --oneline -3` confirmed HEAD = `7b2ab7d` (the `PROJECT-STATE-COMPACTION-B` completion commit), matching the order's expectation. `git check-ignore` on `supabase/.temp`, `.ravatex-local`, `backups` — all ignored; `.mcp.json` reported not-ignored, but investigated and found **absent from the working tree, index, and history entirely** — not a real gap, no HARD STOP (nothing to leak). Tracked-file secrets sweep: `sb_secret` — clean; `service_role` key values — clean; connection strings — one hit, `docs/BACKUP_AND_RESTORE.md:44`, a documented `[SENHA]` placeholder, not a real credential; `eyJ` (JWT prefix) — hits confined to `js/config.js:24` (production ref) and `:31` (staging ref), each individually verified via an isolated `role`-claim decode (extracting only the `role` field, not printing the full token, per a tool-use safety guard) — both **`role: anon`**, the standard public client-side key in this architecture (RLS-gated, not a secret; pre-existing, unchanged by this phase), not `service_role`/`sb_secret`. No HARD STOP triggered.
- **Remote:** `git remote add production https://github.com/inttexsystem/inttracker.git`. `git fetch production` + `git ls-remote production` confirmed the destination **empty** (no branches) before push — matching the architect's confirmation in the order. No HARD STOP.
- **Push (authorized, single-use):** `git push production work/g28-document-qualification:main` — `* [new branch] work/g28-document-qualification -> main`. No force, no tags, no other branch pushed.
- **Verify:** remote `production` fetch/push URL both `https://github.com/inttexsystem/inttracker.git`; branch mapping `work/g28-document-qualification` (local) → `main` (production); HEAD SHA `7b2ab7d7aaca44edf2781b24eb5aeecf8ba63c50`; commit count pushed = **753** (`git rev-list --count HEAD`) — reconciled against the diagnosis-time figure of 749: the 4 commits added since (`be6f081`, `9566837`, `2a88227`, `7b2ab7d`) account for the difference, canon corrected accordingly; `git rev-list --left-right --count production/main...HEAD` = **`0 0`** (exact match, no divergence).
- **Record (this commit, per the order — to be pushed too):** `PROJECT_STATE.md` — `M0` marked `CLOSED / ACCEPTED` in "Active phase" and given its own entry under "Migration governance"; commit-count canon corrected (749 at diagnosis → 753 at push); environment facts updated (`production` remote added; `origin`/`staging` retained, `staging` now historical-backup-only; migration-targets line updated — GitHub target no longer empty; push-authorization note scoped to this single-use grant); "Closed phases" index gained the `M0` row; next authorizable action advanced to `M1`. `AGENT_HANDOFF.md` — new top entry recording the full verification trail (not compacted). This ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — git-only + the one named docs-record commit, no other file/code/SQL/Supabase/Vercel touched; `§15` (Git) — the push was the explicit single-use authorized action of this order; the docs-record commit stages by literal path; `§19` — English throughout. Production Supabase `bhgifjrfagkzubpyqpew` not accessed.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed (Supabase). **Push:** executed — `production/main`, single-use authorization, per this order only; no further push authorized by it.
- **Next phase indicated at closeout:** an individual order for `M1` (new Supabase project provisioning) — or any other `M2`-`M10` phase per the architect's sequencing. Backlog freeze holds until after cutover (`M10`).

## 2026-07-17 — M1 (new Supabase project verification + sanction — gqmpsxkxynrjvidfmojk) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit single-use architect order "ARCHITECT AUTHORIZATION — M1 (new Supabase project provisioning)" (Sonnet 5 / low effort — read-only verification + docs recording, mechanical). The order states the project was pre-created by the architect; this phase verifies and records it as the sanctioned target, nothing created.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M1` (new Supabase project verification), second phase of the active migration track to execute.
- **Verify (read-only, via the project-scoped Supabase MCP):** `list_tables` across `public`/`auth`/`storage` — **zero tables in `public`**; `auth` schema carries its stock scaffolding only, **23 base tables** (`users`, `refresh_tokens`, `instances`, `audit_log_entries`, `schema_migrations`, `identities`, `sessions`, `mfa_factors`, `mfa_challenges`, `mfa_amr_claims`, `sso_providers`, `sso_domains`, `saml_providers`, `saml_relay_states`, `flow_state`, `one_time_tokens`, `oauth_clients`, `oauth_authorizations`, `oauth_consents`, `oauth_client_states`, `custom_oauth_providers`, `webauthn_credentials`, `webauthn_challenges`), all `0` rows except `auth.schema_migrations` (77 stock seed rows, not project data); `storage` schema carries its own stock scaffolding (8 tables), `buckets`/`objects` both `0` rows. `list_migrations` → `[]` (0 rows in the migrations registry — matches the order's expectation exactly). `execute_sql select count(*) from storage.buckets` → `0`, cross-checking the `list_tables` row count independently. **No table/migration/bucket found anywhere in the profile → no HARD STOP triggered**; nothing created, nothing written.
- **Identification evidence (per the order's own honesty requirement):** the order anticipated the toolset "cannot read the ref directly," leaving identification to rest on config-plus-empty-profile alone. That anticipated limit **does not hold**: `claude mcp list` prints the live connection URL as `https://mcp.supabase.com/mcp?project_ref=gqmpsxkxynrjvidfmojk&features=database&read_only=true` — both the `project_ref` and the `read_only=true` flag are **directly visible** in the MCP's own configuration string, confirmed by direct tool output, not inferred from an empty schema profile. Recorded as a correction to the order's assumed tooling limit (stronger evidence than expected), not a deviation from its verification method. The empty profile itself remains independently consistent with a newly-created project and inconsistent with staging (`ucrjtfswnfdlxwtmxnoo`, 64 migrations replayed, ~40 `public` tables).
- **Record (this commit, per the order):** `PROJECT_STATE.md` — `M1` marked `CLOSED / ACCEPTED` in "Active phase and next action"; new "Migration governance" entry recording the verification outputs and the boundary amendment; the "Staging-only execution boundary" bullet amended in place to reflect the same; "Environment and worktree standing facts" updated (Supabase migration-target line now records the verified-virgin state; MCP line records the direct `claude mcp list` confirmation); "Closed phases" index gained the `M1` row; next authorizable action advanced to `M2`. `AGENT_HANDOFF.md` — new top entry recording the full verification trail (not compacted). This ledger entry.
- **Boundary amendment (binding, this order):** the staging-only execution boundary is amended — writes to `gqmpsxkxynrjvidfmojk` are authorized **only within explicitly ordered `M`-track phases** (`M2`, `M3`, `M4`, `M9`); `ucrjtfswnfdlxwtmxnoo` becomes **read-only legacy** (the `M3` exporter/export-read path is the named exception); production `bhgifjrfagkzubpyqpew` **remains PROHIBITED and untouched**, unaffected by this amendment.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — read-only verification + the one named docs-record commit, no other file/code/SQL/Supabase/Vercel touched, no write attempted anywhere; `§15` (Git) — the docs-record commit stages by literal path, pushed to `production/main` under the single-track push authorization extended to documentation commits for this order; `§19` — English throughout. Production Supabase `bhgifjrfagkzubpyqpew` not accessed; staging `ucrjtfswnfdlxwtmxnoo` not accessed by this phase.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed (Supabase). **Push:** executed — `production/main`, this order's single-track documentation-commit authorization only; no further push authorized by it.
- **Next phase indicated at closeout:** an individual order for `M2` — or any other `M3`-`M10` phase per the architect's sequencing. Backlog freeze holds until after cutover (`M10`).

## 2026-07-17 — M2 (schema replay db/01→db/64 into gqmpsxkxynrjvidfmojk) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit single-use architect order "ARCHITECT AUTHORIZATION — M2 (schema replay into the sanctioned target)" (Opus 4.8 / high effort). Supabase-writes phase against the sanctioned target only; no code changes; docs record commit pushed under the M-track authorization.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M2` (schema replay), third phase of the active migration track to execute.
- **HARD STOP ZERO (pre-write, passed):** `claude mcp list` URL and `get_project` both pin `ref=gqmpsxkxynrjvidfmojk` (name "Inttex", org `iapmvdwhfjwndhrylbbm`, region ca-central-1, Postgres 17.6); virgin pre-state confirmed (`public`=0 tables, `list_migrations`=`[]`, storage buckets=0). No table/migration/bucket found → gate cleared, no HARD STOP.
- **MCP surface note:** the M1 project-scoped read-only MCP was flipped to write by the architect for M2; on reconnect it resolved to the management-scoped Supabase server (tools take explicit `project_id`; toolset includes `create_project`/`deploy_edge_function`). All M2 writes targeted `project_id=gqmpsxkxynrjvidfmojk` exclusively.
- **Source (ratified by PRODUCTION-READINESS-DIAGNOSIS-R1):** repo `db/`, ordered replay `db/01→db/64`, skipping the 5 `*.verify.sql` files; `setup_completo.sql` (stale pre-Pedido partial) and `supabase db push` forbidden as schema source.
- **Method + result:** each migration applied one-by-one via MCP `apply_migration`, registered under its canonical file-stem name, verified after each; stop-on-error, never skip/patch/reorder. **64/64 applied, zero errors.** `BEGIN;…COMMIT;`-wrapped files (10/11/26/28/29/31/32/33/45/46/47/48) applied cleanly. `db/44`→`db/46` created then removed the `parceiros` model (guard required empty tables — satisfied). `db/53` applied byte-faithfully so `db/55`'s exact-string-match repair precondition matched (it did).
- **Data-writing ruling (architect):** mid-replay the auto-mode classifier denied the `db/04` seed write; the architect ruled **Option 1 — faithful `01→64`, no file skipped, data-writing applies within `db/01-64` authorized** and **corrected gate 4d** from "all row counts 0" (wrong premise — some migrations seed reference/configuration data by design) to "row counts match the faithful replay; report residual per table with origin; genuine test data that survives is reported, not deleted."
- **Post-replay verification gate:** (4a) registry = **64 entries, order `01→64`, canonical names**; (4b) **parity vs staging NOT EXECUTABLE** — the reconnected management-MCP credential is permission-denied on `ucrjtfswnfdlxwtmxnoo` (`execute_sql` → "You do not have permission"); reported as a tooling limitation, new-project absolute profile stands (40 public tables / 0 views / 53 functions / 67 RLS policies / 9 triggers / 0 buckets), consistent with the R1 ~40-public-tables staging finding; (4c) ACL spot-checks faithful — `is_admin_full`/backup-writer RPCs(`db/64`)/evidence-writer(`db/49`)=service_role/postgres only, document-scan RPCs+`decidir_documento`(`db/38`)=authenticated (admin-gated internally), `is_admin()` broad = the pre-existing `IS-ADMIN-ACL-REVIEW` debt reproduced faithfully (not a defect); (4d, corrected) sole residual **`parametros_largura`=2** (width-calc configuration from `db/04`, kept by `db/10`/`db/11`); every `db/04` test cadastro wiped by `db/10` (confirmed 0), `op_numeros`=0, all else 0 — no test data survived, nothing deleted; (4e) buckets=0.
- **Record (this commit):** `docs/reports/M2_SCHEMA_REPLAY_VERIFICATION_2026-07-17.md` (full apply log + gate); `PROJECT_STATE.md` (`M2` CLOSED/ACCEPTED in Active phase + Migration governance entry + environment facts + Closed-phases row; next action → `M3`; MCP read-only flip reminder); `AGENT_HANDOFF.md` top entry; this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — Supabase schema replay + the one named docs-record commit, no code/frontend/Edge Functions touched, no auth data (M3), no config repoint (M5); `§15` (Git) — docs-record commit stages by literal path, pushed to `production/main` under the M-track authorization; `§19` — English throughout. Production `bhgifjrfagkzubpyqpew` not accessed; staging `ucrjtfswnfdlxwtmxnoo` only read-attempted for parity (denied), never written.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** executed — `production/main`, M-track docs-commit authorization only.
- **Standing reminder:** flip the Supabase MCP back to read-only now that M2's write window is closed (M3/M4/M9 re-authorize their own).
- **Next phase indicated at closeout:** an individual order for `M3` — or any `M4`-`M10` phase per the architect's sequencing. Backlog freeze holds until after cutover (`M10`).

## 2026-07-17 — M3-DATA (production data migration into gqmpsxkxynrjvidfmojk) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ARCHITECT RULING — parametros_largura" + "M3-DATA closeout", Sonnet 5 / low effort). Docs-only closeout for this record; the underlying data migration (row copy from `ucrjtfswnfdlxwtmxnoo` into `gqmpsxkxynrjvidfmojk`, auth remap, FK integrity pass, sequence resync) was executed earlier in the same working session; this entry is the documental closeout plus one live data correction (`parametros_largura`) ordered explicitly by the architect at closeout time.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M3` (production data), fourth phase of the active migration track to execute.
- **Verification table (row counts, legacy `ucrjtfswnfdlxwtmxnoo` vs new `gqmpsxkxynrjvidfmojk`, re-confirmed live at closeout via `list_tables`):**

  | Table | Legacy | New | Note |
  |---|---|---|---|
  | `clientes` | 5 | 3 | 2 excluded (test/synthetic) |
  | `cores` | 6 | 6 | full match |
  | `fornecedores` | 5 | 4 | 1 excluded |
  | `lotes` | 13 | 5 | 8 excluded |
  | `modelos` | 12 | 12 | full match |
  | `op_fornecedores` | 4 | 2 | 2 excluded |
  | `op_itens` | 13 | 11 | 2 excluded |
  | `ops` | 8 | 2 | 6 excluded |
  | `ordens_compra_fio` | 19 | 11 | 8 excluded |
  | `precos_terceirizada` | 1 | 0 | 1 excluded |
  | `saldo_fios` | 5 | 5 | full match |
  | `usuarios` | 10 | 1 | 9 excluded (non-production accounts) |
  | `auth.users` | 10 | 1 | mirrors `usuarios`, single surviving admin |
  | `pedidos` | 4 | 1 | 3 excluded |
  | `pedido_itens` | 4 | 2 | 2 excluded |
  | `op_eventos` | 1 | 0 | 1 excluded |
  | `document_candidates` | 40 | 37 | 3 excluded |
  | `document_scan_runs` | 30 | 30 | full match |
  | `document_scan_requests` | 24 | 24 | full match, `requested_by_user_id` remapped (see below) |
  | `document_link_revisions` | 8 | 0 | excluded entirely — audit trail, ruling (b)-adjacent, see below |
  | `document_link_revision_ops` | 10 | 0 | excluded entirely — audit trail |
  | `usuarios_eventos` | 9 | 0 | excluded entirely — architect ruling (a) |
  | `parametros_largura` | 2 | 2 | seeded by `db/04`, **overwritten from legacy this closeout** — architect ruling (b) |

- **Auth remap — 24 rows, single column (re-confirmed live):** `public.document_scan_requests.requested_by_user_id` — the only FK-bearing column found holding legacy `auth.users` ids across surviving rows — was remapped to the single surviving admin account in the new project. Live check at closeout: `24` total rows, `24` non-null `requested_by_user_id`, `1` distinct value (the new project's sole `auth.users` row) — consistent with the launch user model (full-trust admins only, single admin migrated).
- **FK integrity — re-verified live at closeout:** dynamic per-constraint orphan scan across every single-column foreign key in `public` (`pg_constraint`-driven, one `NOT EXISTS` count per relationship) — **76 relationships checked, 0 orphans** (superset of the phase's original 16-relationship auth-touching scope, all of which pass). Of the 76, **13 reference `auth.users`** directly (`usuarios`×2, `pedido_eventos`, `pedido_cliente_eventos`, `pedido_parciais`, `op_eventos`, `expedicao_movimentos`, `document_decisions`×2, `document_scan_requests`, `document_link_revisions`×2, `usuarios_eventos`) — every one resolves cleanly to the single migrated admin account, zero dangling references.
- **Sequence resync — re-verified live at closeout:** all 10 populated `BIGSERIAL`/`SERIAL` sequences in `public` (`clientes`, `cores`, `fornecedores`, `lotes`, `modelos`, `op_fornecedores`, `op_itens`, `ops`, `ordens_compra_fio`, `saldo_fios`) checked `last_value` against `MAX(id)` of their owning table — **10/10 exact match**, no gap, no collision risk on next insert.
- **Architect ruling (a) — `usuarios_eventos` excluded entirely (binding):** remapping `ator_id` from legacy identities to the new project's single migrated admin would fabricate audit history — every event would appear to have been performed by an actor who, in the new project, never took that action. The legacy project (`ucrjtfswnfdlxwtmxnoo`) retains the original 9-row trail as the historical record; the new project's `usuarios_eventos` starts empty and truthful from cutover. The same reasoning extends to `document_link_revisions`/`document_link_revision_ops` (8/10 rows, canonical document-link history keyed on `created_by`/`revoked_by` actor columns) — excluded for the identical reason, not a separate decision.
- **Architect ruling (b) — `parametros_largura` overwritten from legacy (binding):** the `db/04` seed values (`peso_linear` 1.5000/2.2500, `valor_x` 1.0000) are a bootstrap default, not real data. The legacy project's live-tuned configuration (`largura=1.40`: `peso_linear=0.3360`, `algodao_por_ml=0.226000`, `poliester_por_ml=0.110000`, `valor_x=0.5000`; `largura=2.10`: `peso_linear=0.5370`, `algodao_por_ml=0.366000`, `poliester_por_ml=0.171000`, `valor_x=0.5000`) is real operationally-tuned data by the same standard as `clientes`/`modelos`, and supersedes the seed. **Applied this closeout** via `UPDATE public.parametros_largura` against `gqmpsxkxynrjvidfmojk`, matched by `largura`, all four value columns + `atualizado_em` set from the legacy row. Before/after:

  | `largura` | Column | Before (seed) | After (legacy live) |
  |---|---|---|---|
  | 1.40 | `peso_linear` | 1.5000 | 0.3360 |
  | 1.40 | `algodao_por_ml` | 0.000350 | 0.226000 |
  | 1.40 | `poliester_por_ml` | 0.000420 | 0.110000 |
  | 1.40 | `valor_x` | 1.0000 | 0.5000 |
  | 2.10 | `peso_linear` | 2.2500 | 0.5370 |
  | 2.10 | `algodao_por_ml` | 0.000525 | 0.366000 |
  | 2.10 | `poliester_por_ml` | 0.000630 | 0.171000 |
  | 2.10 | `valor_x` | 1.0000 | 0.5000 |

- **Exclusion set (test/synthetic data, counts per table — see verification table above):** `clientes`(2), `fornecedores`(1), `lotes`(8), `op_fornecedores`(2), `op_itens`(2), `ops`(6), `ordens_compra_fio`(8), `precos_terceirizada`(1), `usuarios`(9)/`auth.users`(9), `pedidos`(3), `pedido_itens`(2), `op_eventos`(1), `document_candidates`(3) — non-production/test rows not carried over. `usuarios_eventos`(9)/`document_link_revisions`(8)/`document_link_revision_ops`(10) excluded entirely per ruling (a), a distinct rationale from the row-level test-data exclusions above. The new database is **intentionally smaller than legacy by design** — not an incomplete migration.
- **Legacy retention (binding, registered this closeout):** `ucrjtfswnfdlxwtmxnoo` retains the original `usuarios_eventos`/`document_link_revisions`/`document_link_revision_ops` audit trail and the excluded test/synthetic rows above — it is now the **historical record** for both, on top of its existing read-only-legacy status (`M1`). **Must not be deleted or pruned without a separate, explicit architect decision.**
- **`backup_runs`/`backup_run_destinations` note (observation, not a defect):** the new project carries 2/4 rows in these tables even though legacy's schema (older, pre-`db/64`) never had them — this data originates from post-`M2` activity against `gqmpsxkxynrjvidfmojk` itself, not from a legacy migration; flagged for completeness, no action taken.
- **Record (this commit):** `PROJECT_STATE.md` (`M3` marked `CLOSED / ACCEPTED` in Active phase + Migration governance entry + environment facts + Closed-phases row; rulings (a)/(b) added to "Binding decisions in force"; next action → `M4`); `AGENT_HANDOFF.md` top entry; this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — one live data correction (`parametros_largura`, 2 rows) + documentation, no schema/code/frontend/Edge Functions touched; `§15` (Git) — docs-record commit stages by literal path, pushed to `production/main` under the M-track authorization; `§19` — English throughout. Production `bhgifjrfagkzubpyqpew` not accessed; legacy `ucrjtfswnfdlxwtmxnoo` read-only (no writes, retained as historical record per this closeout).
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** executed — `production/main`, M-track docs-commit authorization only.
- **Next phase indicated at closeout:** an individual order for `M4` — or any `M5`-`M10` phase per the architect's sequencing. Backlog freeze holds until after cutover (`M10`).

## 2026-07-18 — M8 (Documents Ingestor repoint → gqmpsxkxynrjvidfmojk) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit single-use architect order ("ARCHITECT AUTHORIZATION — M8 (Ingestor repoint)", Sonnet 5 → Opus 4.8 / medium effort). Configuration phase: no schema changes, no Supabase writes issued by Claude, no production data manipulation. Executed **out of numeric sequence** (ahead of `M4`-`M7`) by direct architect order — phases do not chain automatically; the architect may order any phase.
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, phase `M8` (Ingestor repoint).
- **Problem:** the Documents Ingestor (two installations — the in-repo `services/documents-ingestor/` copy and the standalone operational twin at `D:\OneDrive\Programação\Ravatex\documents-ingestor\`) still wrote to legacy `ucrjtfswnfdlxwtmxnoo`; the live production project `gqmpsxkxynrjvidfmojk` was receiving no documents.
- **STEP 1 diagnosis (read-only) — config surfaces found:**
  - Two `.env` files (both gitignored, both held the legacy service-role JWT): in-repo (Supabase vars only, no Google creds) and the standalone twin (full Google OAuth creds + `INGEST_REAL_GOOGLE=true` — the copy the scheduled task actually runs).
  - **Windows Task Scheduler entry confirmed live** (read-only `Get-ScheduledTask`): task `Ravatex-DocumentScanWatcher-Staging`, logon trigger (user `klebe`), runs `powershell -File …\documents-ingestor\ops\watcher\Start-DocumentScanWatcher.ps1` → the **standalone twin**, confirming it as the real entry point.
  - **Hard-coded guard (not in the order, surfaced by diagnosis):** both `Start-DocumentScanWatcher.ps1` copies pin `$ExpectedProjectRef = 'ucrjtfswnfdlxwtmxnoo'` and refuse to start on mismatch — repointing `.env` alone would have bricked the scheduled watcher. Brought into scope.
  - Docs: both `docs/SUPABASE_WRITER_RUNBOOK.md` copies hardcoded "Staging Only / `ucrjtfswnfdlxwtmxnoo`".
  - Hermetic tests (`scan.test.ts`, `service-role-reader-client.test.ts`) reference the legacy ref only as fixture values — left untouched (test-double fidelity, `§20`).
- **Schema verification (live, read-only against `gqmpsxkxynrjvidfmojk`):** all tables the Ingestor writes exist (`document_candidates` 37 rows all with `drive_file_id`/`drive_web_view_link` populated, `document_scan_runs`, `document_scan_requests`, `document_events`, `document_decisions`, `document_technical_evidences`, `document_link_revisions`/`_ops`); all required RPCs present with `service_role EXECUTE` (`claim_next_document_scan_request`, `mark_document_scan_request_running`, `finish_document_scan_request`, `recuperar_document_scan_runs_travados`, `upsert_document_candidate_ingestor_state`, `iniciar_document_scan_run`, `finalizar_document_scan_run`, `solicitar_document_scan`). Nothing the Ingestor needs is missing.
- **Drive/OAuth (ruling #4, unchanged):** Drive folder resolution is by name (`GOOGLE_DRIVE_ROOT_FOLDER_ID` blank, create-missing=true) — independent of the Supabase project; repoint does not affect it. `CAMADA3-OAUTH-GRANT-COUPLING` debt stands unaffected.
- **Two order claims corrected against live evidence (both architect-withdrawn):**
  - **CI workflow:** the named `.github/workflows/ingestor-ci.yml` does **not exist** in either repo; no workflow references the prohibited production ref `bhgifjrfagkzubpyqpew` or any project ref (the only Ingestor CI is hermetic `npm test`, zero secrets). Nothing deleted. Architect withdrew ruling #2.
  - **`PRODUCTION-SECURITY-01` (`document_scan_runs` RLS-off / anon-INSERT):** premise **disproven live** — `document_scan_runs` has RLS enabled, one `is_admin()`-gated `ALL` policy, zero anon grants; all `document_*` siblings share that safe shape. Not registered (refused to record a canonical entry on a false premise). Architect withdrew ruling #3 and affirmed the refusal as the standard.
- **`ANON-GRANT-DEFENSE-IN-DEPTH` — registered (ruling #3b, the real finding):** the sibling sweep found **27 non-document `public` tables** carrying raw table-level `anon INSERT/UPDATE/DELETE` grants, inert today only because RLS policies (`is_admin()`/`meu_fornecedor_id()`/`meu_cliente_id()`) evaluate false for unauthenticated sessions. Not a live hole; the defect is that grants and policies disagree (no second line of defence). Pre-existing, faithfully migrated from the `db/*` grants. Registered as a **separate** `NOT AUTHORIZED` first-week candidate, cross-referenced to `IS-ADMIN-ACL-REVIEW` (table-grant scope vs anchor-function-ACL scope) — **not merged**. Full list in `PROJECT_STATE.md` "Live debts and candidates".
- **STEP 2 repoint applied — config surfaces changed (both installations):**
  - Both `.env` (gitignored): `SUPABASE_URL` + `SUPABASE_PROJECT_REF` → `gqmpsxkxynrjvidfmojk`; `SUPABASE_SERVICE_ROLE_KEY` → the new-format `sb_secret_` key **pasted by the architect directly** (never seen/logged/committed by Claude). Standalone twin's Google creds + `RAVATEX_CNPJS` preserved untouched. In-place `.*`-pattern substitution used deliberately so no byte of the old legacy secret (or the twin's Google client secret) was ever echoed into a tool call; even a 3-char key-prefix print was correctly blocked by the auto-mode classifier and abandoned.
  - Both `Start-DocumentScanWatcher.ps1`: `$ExpectedProjectRef` → `gqmpsxkxynrjvidfmojk`; guard message "authorized staging project" → "authorized target project".
  - Both `SUPABASE_WRITER_RUNBOOK.md`: "Staging Only / `ucrjtfswnfdlxwtmxnoo`" → "Sanctioned Target Project Only / `gqmpsxkxynrjvidfmojk`", worded to survive `M10` cutover without a second edit; adds the legacy + protected refs to the never-use list and notes the new-format key regime (same env-var name, new value format).
- **STEP 2 verification — real watcher cycle against `gqmpsxkxynrjvidfmojk` (`--once --confirm-real-google --confirm-supabase-write`):** the watcher claimed the one pre-existing active `gmail` request (`f3c3647e`, a migrated legacy intent), created scan run `e9287e0e` (`triggered_by=service_role_cli`), marked the request running, then **failed at the Gmail scan with `invalid_grant`** (expired Google OAuth token — the pre-flagged operational caveat, same failure mode as `BK4.2`'s earlier attempt), finalizing both run and request as `failed` (0 documents). **Repoint proven at the Supabase layer, confirmed live:** the Ingestor authenticated to the new project with the new `sb_secret_` key and all five writes landed (`request f3c3647e` requested→claimed→running→failed linked to `scan_run e9287e0e`); **schema compatible** — zero `migration_XX_required`/`PGRST202`/schema-cache errors, service_role writer gates fired. The legacy project was never contacted; the queue is left clean (no stuck `running` lock).
- **Architect decision at closeout (M8 close):** **accept the Supabase-layer proof** (new-key auth + schema compatibility + real writes landed) and **defer** the full Gmail→Drive→DB document demonstration as a follow-up gated on the Google OAuth token refresh — an interactive login that is the architect's action (credential/OAuth) and coupled to `CAMADA3-OAUTH-GRANT-COUPLING` (same client the backup exporter reuses).
- **`INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — registered follow-up (`NOT AUTHORIZED`):** demonstrate one real document processed end to end into `gqmpsxkxynrjvidfmojk` with its Drive file resolving; gated on the Google OAuth token refresh; tie to `CAMADA3-OAUTH-GRANT-COUPLING`. A fresh scan request must be seeded (the migrated one was consumed as `failed` during verification).
- **Record (this commit):** `PROJECT_STATE.md` (`M8` `CLOSED / ACCEPTED` + environment facts + Closed-phases row; `ANON-GRANT-DEFENSE-IN-DEPTH` + `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` registered); `AGENT_HANDOFF.md` top entry; this ledger entry. Repoint edits to the two `.env` files are gitignored (not committed); the two `.ps1` guards + two runbooks in the standalone twin live in that separate repo (not this repo's history).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — configuration + documentation only, no schema/db, no Supabase writes issued by Claude (the watcher's writes went through the Ingestor's own service_role key, not the MCP; all Claude MCP calls were read-only `SELECT`); `§15` (Git) — selective staging by literal path, no push in this order (architect acceptance required before any push); `§19` — English throughout. Secret hygiene held: the `sb_secret_` key never appeared in repo/logs/chat. Production `bhgifjrfagkzubpyqpew` not accessed; legacy `ucrjtfswnfdlxwtmxnoo` not written.
- **Standing reminder (unchanged):** flip the Supabase MCP back to read-only — it remains management-scoped/write-capable from `M2`/`M3`; M8 used it read-only only.
- **Production:** `bhgifjrfagkzubpyqpew` not accessed. **Push:** not executed (not authorized by this order).
- **Next phase indicated at closeout:** an individual order for `M4` (Edge Functions + secrets) or any other `M5`-`M10` phase; plus the deferred `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` once the Google token is refreshed. Backlog freeze holds until after cutover (`M10`).

## 2026-07-18 — M10 CUTOVER CLOSEOUT — G28-MIGRATION-TRACK (M0-M10) COMPLETE / CLOSED — backlog freeze LIFTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ORDER — M10 CUTOVER CLOSEOUT", Sonnet 5 / low effort). Docs-only phase: no code, SQL, Supabase, or Vercel action by Claude; records an already-accomplished cutover. Push authorized for the docs commit (M-track authorization).
- **Front:** `PRODUCTION-MIGRATION-M0-M10`, final closeout — records `M4`/`M5`/`M6`/`M10` `CLOSED / ACCEPTED`, `M7`/`M9` `SUPERSEDED BY REALITY`, and marks the track `COMPLETE`.
- **Accomplished fact (recorded, not performed here):** the system is **LIVE IN PRODUCTION** at `inttracker-jade.vercel.app`, served by Vercel from `inttexsystem/inttracker` (`main`), running against Supabase `gqmpsxkxynrjvidfmojk` with migrated data, deployed Edge Functions, repointed client config, and a repointed Ingestor.
- **Phase records:**
  - **`M4` (Edge Functions + secrets) — `CLOSED / ACCEPTED`:** the five admin Edge Functions deployed to `gqmpsxkxynrjvidfmojk` by the architect with per-function secrets (new-format key regime); out-of-band deploy, no repo artifact; exercised by the live app.
  - **`M5` (client config repoint) — `CLOSED / ACCEPTED`:** `js/config.js` repointed (`75c4ab6` "Repoint config to new Supabase project"), environment split restored (`1e17087` "Restore environment split in config") so host detection routes production vs. development, banner fixed (`f369964`). New-format publishable key committed (RLS-gated, public by design). On `production/main`.
  - **`M6` (Vercel wiring) — `CLOSED / ACCEPTED`:** repo linked, static deploy configured (`5416128` "Trigger first Vercel deploy", `aa77612` "Configure Vercel static deployment"); live at `inttracker-jade.vercel.app`. A **Root Directory defect** was found during wiring and **cleared**.
  - **`M7` (smoke verification) — `SUPERSEDED BY REALITY`:** no separate scoped smoke phase ran; superseded by the live-and-serving production system (login/pedido/admin exercised by real use). Recorded honestly as not-run-as-scoped — no fabricated smoke closeout.
  - **`M9` (backup repoint + first real run) — `SUPERSEDED BY REALITY` / `NOT EXECUTED AS SCOPED`:** the production backup mechanism was never stood up (no `PG*`/`SUPABASE_*` repoint, no automated trigger, no first production run). The exporter was proven once, manually, in staging (`BK4.2`). Folded into the `CAMADA3 BK5-BK8` post-launch debt — **no proven production backup exists.** No fabricated run.
  - **`M10` (cutover) — `CLOSED / ACCEPTED`:** primary URL is Vercel; live against `gqmpsxkxynrjvidfmojk` with real use; performed by the architect. This entry records it.
- **`G28-MIGRATION-TRACK` — `COMPLETE / CLOSED`.** Final state: **production = `gqmpsxkxynrjvidfmojk` on `inttexsystem/inttracker`, served by Vercel (`inttracker-jade.vercel.app`); development/legacy = `ucrjtfswnfdlxwtmxnoo` (retained, now the development database, historical record for excluded audit trails/test rows); `bhgifjrfagkzubpyqpew` remains PROHIBITED and unused, never accessed.**
- **`BACKLOG FREEZE` — `LIFTED` (2026-07-18):** the freeze was scoped "until after cutover (`M10`)"; cutover is done. New fronts are authorizable again, each by its own order.
- **`POST-LAUNCH DEBT REGISTER` — consolidated + ranked** into a single list in `PROJECT_STATE.md` (was scattered across entries and the former "residual risk register (12 items)"). Ranked by production consequence: (1) `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` — **ACTIVE PRODUCTION BLOCKER** (expired Google token; no documents entering the live system); (2) `CAMADA3 BK5-BK8` — no proven production backup (`M9` never ran; exporter manual, proven once); (3) `DELETE-PROD-GUARD-A` — delete guard not on production; (4) `A2-SERVER-SIDE-ENFORCEMENT` — with binding mitigation (no `somente_leitura` admin may exist in production until it closes); (5) `A2-CREATE-NIVEL-ACESSO-WIRING`; (6) `ANON-GRANT-DEFENSE-IN-DEPTH`; (7) `CAMADA3-OAUTH-GRANT-COUPLING` (interacts with #1 — shared OAuth client); (8) `IS-ADMIN-ACL-REVIEW`; (9) `CODE-HEALTH-AUDIT-§18-R1` (incl. `UI-EL-BOOLEAN-ATTR-FIX`); (10) `TEST-MOCK-FIDELITY` remaining lots; (11) `UI-FIXED-FORMAT-COLUMN-WIDTHS`; (12) `UI-ACTION-BUTTON` lot 3; (13) `MODAL-BUTTON-CSS-CHECK`; (14) two stale git-worktrees.
- **Mystery branch — registered for review, investigated read-only (no delete):** `v0/administrativointtex-9166-cf89b1d8` on the `production` remote points at our own commit `75c4ab6` ("Repoint config to new Supabase project"), carries **zero commits not already in `production/main`** (`git rev-list --left-right --count production/main...` = `5 0`), and is a **strict ancestor of `main`** — an older snapshot of this branch's history, not foreign content. Consistent with a **Vercel/v0 import artifact** (branch auto-created at the HEAD commit when the repo was connected). No code-review concern; safe to leave or delete at the architect's discretion.
- **Record (this commit):** `PROJECT_STATE.md` (Active phase → track COMPLETE + freeze LIFTED; `M4`-`M10` governance entries; consolidated ranked `POST-LAUNCH DEBT REGISTER` + mystery-branch registration; environment facts → production live / legacy = dev DB; publication provider → Vercel live; Closed-phases rows); `AGENT_HANDOFF.md` top entry; this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no code/schema/Supabase/Vercel action by Claude; `§15` (Git) — selective staging by literal path, push to `production/main` under M-track authorization; `§19` — English throughout. Production `bhgifjrfagkzubpyqpew` not accessed.
- **Push:** authorized and executed — `production/main`, docs commit "Close migration track and lift backlog freeze".
- **Next authorizable action:** any new front by its own order; the standing highest-priority item is `INGESTOR-DOC-CYCLE-VERIFY-DEFERRED` (active production blocker). Standing reminder: flip the Supabase MCP back to read-only.

## 2026-07-18 — ORDEM-COMPRA-SPEC (Purchase Order Lifecycle Spec) — SPEC DELIVERED / PENDING RATIFICATION

- **Gate:** docs-only phase, explicit architect order ("ARCHITECT AUTHORIZATION —
  ORDEM-COMPRA-SPEC (docs-only)", Sonnet 5 / high effort), per the accepted
  `PURCHASE-ORDER-FOUNDATION-AUDIT` and a consolidated set of architect decisions
  carried in the order itself. No code, SQL, staging, or production action authorized
  or taken.
- **Front:** new track, `ORDEM-COMPRA-LIFECYCLE` (purchase-order / `ordens_compra_fio`
  lifecycle rework).
- **Deliverable:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` —
  `PROPOSED`, for architect ratification. Specifies, against an evidenced read-only
  inventory of the current code (`ordens_compra_fio` schema in `db/01_schema.sql`,
  generation at Abrir OP in `op-persistir.js:218-236`, the single shared receipt
  writer `registrarRecebimentoOrdemFio` in `op-writes.js:29-43` called from
  `op-nova.js`'s `buildBlocoFios`/`buildOrdemPendenteRow` and from
  `pedido-detail-events.js`'s `buildInsumosTransferForm` inside the `insumos`
  stepper-stage transition modal, and the unguarded client-side
  `iniciarProducaoOP`/`snapshotSaldoEIniciarProducao` production-start writer in
  `op-recalculo.js:108-163`):
  - **Three orthogonal dimensions**, not a linear state machine — administrative
    cycle (`rascunho`/`emitida`/`cancelada`), acceptance
    (`nao_aplicavel`/`pendente`/`aceita`/`rejeitada`), and receipt (derived,
    `nao_recebido`/`parcial`/`recebido`, computed from a new append-only
    `ordem_compra_fio_lancamentos` physical-registration ledger against
    `kg_pedido` — never set directly).
  - **Schema (PROPOSED, additive only):** new columns on `ordens_compra_fio`
    (`status_administrativo`, `status_aceite`, `aceite_exigido_na_emissao` snapshot,
    `emitida_em`/`_por`, `cancelada_em`/`_por`, `aceite_decidida_em`/`_por`,
    `aceite_motivo`, `status_recebimento`, `legado_recebimento_automatico`); new
    tables `ordem_compra_fio_lancamentos` (receipt ledger), `ordem_compra_eventos`
    (transition audit, `op_eventos`/`usuarios_eventos` pattern), and
    `ordem_compra_config` (singleton, `exige_aceite BOOLEAN DEFAULT FALSE`,
    deliberately not a generic config/feature-flag engine per the ratified Rule 7);
    a one-time legacy-marking backfill for every pre-existing row
    (`status_administrativo='emitida'`, `legado_recebimento_automatico=TRUE`, no
    retroactive `kg_recebido` rewrite).
  - **Config freeze rule:** emission snapshots the live `ordem_compra_config` value
    into `aceite_exigido_na_emissao`; toggling the global config only affects orders
    emitted afterward — no retroactive blocking/unblocking.
  - **Production gate (Phase D, specified only):** two independent queries for
    "Iniciar produção" — cotton per-OP, polyester per-pedido (shared PRETO/BRANCO
    orders gate all the pedido's OPs together, per architect decision (a) in the
    order), joined via `ordens_compra_fio.op_id → ops.lote_id → lotes.pedido_id`.
    Flagged, not resolved: the current gate attach point
    (`op-recalculo.js:108-163`) is a direct client-side `ops` update with no RPC in
    front of it — wiring the gate only in the UI would repeat the shape of the
    already-registered `A2-SERVER-SIDE-ENFORCEMENT` debt; Phase D should enforce
    server-side.
  - **7 open architect decisions** (a)-(g) — supplier-accepts-own-order precedence,
    admin-accepts-on-behalf, admin-override-of-rejection, undo-acceptance,
    acceptance-after-partial-receipt, order-modification-after-emission (recommended:
    emission locks quantities), cancellation-with-partial-receipts (recommended:
    ledger entries are never reversed) — each with a recommendation, none ratified
    by this document.
  - **UI surface (conceptual, no mockup):** new affordances render as a sub-panel
    inside the existing `insumos` transition-modal host
    (`buildInsumosTransferForm`/`buildBlocoFios`), reusing existing control-panel
    visual tokens — not a new pedido stage, not a detached CRUD screen. Mockup gate
    (Supervision Protocol) is explicitly deferred to after ratification, by the
    architect's reviewer.
  - **Phasing, each independently shippable:** `A` schema+config (additive,
    zero behavior change) → `B` panel visibility + administrative writes
    (behavior change flagged: newly opened OPs require explicit "Emitir" before
    receipt) → `C` receipt rework via the single shared writer (internal
    implementation swap behind an unchanged RPC signature) → `D` gate activation
    (behavior change flagged: production-start can now block on insufficient yarn)
    → `E` dormant-acceptance verification checkpoint (no code, read-only). Blast
    radius stated per phase in the spec; none authorized by this record.
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE` track
  `OPENED`, spec `PROPOSED`, all phases `NOT AUTHORIZED` — Active phase block,
  `NOT AUTHORIZED` candidate fronts, Closed-phases row, Mandatory links); this
  ledger entry. `AGENT_HANDOFF.md` not touched (not in this order's REGISTER scope).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no
  code/schema/Supabase action; `§16` (documentation) — new architectural contract
  doc, registered in `PROJECT_STATE.md` + this ledger per the order's explicit
  REGISTER instruction (`docs/DOCUMENTATION_INDEX.md` classification not touched —
  out of this order's scope); `§19` — English throughout, matching the canonical
  state/report language policy. No staging/production access; no schema, RPC, or
  frontend file created or modified.
- **Push:** authorized by the order for this docs commit only ("Add purchase order
  lifecycle spec").
- **Next authorizable action:** architect ratification of
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, including a ruling on
  open decisions (a)-(g); then Phase `A` (schema + config), its own order, per the
  phasing in §8 of the spec.

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1 — RATIFIED

- **Gate:** docs-only phase. Two-step order: (1) an independent read-only
  architecture review (Sonnet 5 / high effort) of commit `0859124`
  ("Add purchase order lifecycle spec") against the ratified model; (2) the
  architect's explicit ruling on the review's findings ("ARCHITECT
  RATIFICATION — ORDEM_COMPRA_LIFECYCLE_SPEC"). No code, schema, staging, or
  production action authorized or taken.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track (opened `ORDEM-COMPRA-SPEC`,
  2026-07-18).
- **Review findings (step 1):** validated the spec against all ten ratified
  model points (§1 of the spec) — nine matched; one **confirmed defect**
  (Finding 1): the receipt precondition in §4/§6 read
  `status_aceite != 'pendente'`, which is also true for `rejeitada` — a
  rejected purchase order would have passed the precondition and been able
  to register a receipt, contradicting the ratified rule that receipt is
  blocked until `aceita`. Also surfaced, unprompted: (i) `ordem_compra_eventos`
  payload completeness (minor, non-blocking) and (ii) an RLS-enforcement gap
  — nothing in the original spec revoked direct `UPDATE` on the four
  dimension-bearing columns from `authenticated`, so "single shared writer"
  was a convention, not an enforced invariant (same shape as this project's
  own registered `ANON-GRANT-DEFENSE-IN-DEPTH` debt). Confirmed: all five
  phases (A-E) independently shippable (with a one-transaction caveat on
  Phase A's backfill), Phase C preserves the single shared writer's external
  signature, Phase D's gate correctly relies on the persisted per-order
  policy snapshot rather than the live config (by construction, since the
  receipt-registration writer is the only path `kg_recebido` can move
  through). Verified exact push target: commit
  `0859124060994c4bb29a38a742363d52aaa258e7` on `production`
  (`https://github.com/inttexsystem/inttracker.git`), branch `main`.
  **Re-confirmed, exhaustively, that no `PURCHASE-ORDER-FOUNDATION-AUDIT`
  document exists** anywhere in this repository, any branch, or this ledger
  — the executor hard-stopped rather than fabricate a reconstruction when
  first asked to persist it verbatim, per the architect's own instruction
  ("if the exact source is unavailable, hard stop and request it").
- **Architect ruling (step 2), applied to the spec this commit:**
  - **Finding 1 — `CONFIRMED DEFECT`, corrected.** §4 and §6 of
    `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` corrected to
    `status_aceite IN ('nao_aplicavel', 'aceita')`; §7(e)'s citation
    corrected to match.
  - **Decisions (a)-(g) — all ratified**, annotated inline in the spec's §7,
    summarized in its new §11: (a) deferral confirmed, future precedent
    recorded as guidance only; (b) ratified **YES, unconditionally** —
    100%-admin-authored acceptance until supplier self-service ships is
    correct, not a smell; (c) ratified as recommended (`aceite_override_admin`
    event, mandatory `aceite_motivo`); (d) ratified as recommended (no undo
    path, cancel + new draft); (e) ratified as recommended, contingent on
    Finding 1 (satisfied); (f) ratified as recommended, **decided now rather
    than deferred** — emission locks `kg_pedido`, since changing this after
    Phase B ships would break the `emitir` RPC's contract; (g) ratified as
    recommended — ledger entries never reverse, `saldo_fios` reflects
    physically received kg regardless of administrative state, with the
    `saldo_fios` write-path confirmation folded into the Phase C order as an
    explicit verification step.
  - **Two new implementation gaps, both accepted, folded into §8's phasing
    table as binding requirements:** (1) Phase A's migration must apply the
    `ALTER TABLE` and the legacy backfill in one transaction (closing the
    window for a live draft to be mislabeled); (2) Phase B/C's migration must
    revoke direct `UPDATE` on `kg_recebido`/`status_recebimento`/
    `status_administrativo`/`status_aceite` from `authenticated`, making the
    four `SECURITY DEFINER` RPCs the sole writers.
  - **Phantom-audit governance item — NOT resolved by this ratification,
    explicitly carried forward.** The architect confirmed the prior hard stop
    was correct and is retrieving the original source for verbatim
    persistence as `docs/reports/PURCHASE_ORDER_FOUNDATION_AUDIT_R1_2026-07-18.md`;
    if reported unrecoverable, the fallback is an honest citation correction
    (spec banner + `PROJECT_STATE.md` cite the architect's in-chat
    authorization directly). Neither branch has executed yet.
- **Status change:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  moves from `PROPOSED` to `RATIFIED` (filename unchanged — same convention
  as `CAMADA2_USUARIOS_SPEC_PROPOSED.md`, which also kept its `_PROPOSED`
  suffix after full delivery). **Ratification authorizes no implementation.**
  Phase `A` (and every other phase) remains `NOT AUTHORIZED`, pending its own
  order.
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE`
  track block updated to `RATIFIED`, phases still `NOT AUTHORIZED`;
  `NOT AUTHORIZED` candidate fronts line updated; Closed-phases row added;
  Mandatory links line updated); this ledger entry;
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (status banner,
  §4/§6/§7(e) correction, §7(a)-(g) ratification annotations, §8 binding
  requirements, new §11 ratification record, §10 updated).
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation
  only, no code/schema/Supabase action; `§15` (Git) — selective staging by
  literal path, single commit, push authorized by this order; `§19` —
  English throughout. No staging/production access; no schema, RPC, or
  frontend file created or modified.
- **Push:** authorized by this order — single commit "Ratify purchase order
  lifecycle spec".
- **Next authorizable action:** Phase `A` (schema + config), its own order,
  per the ratified phasing in §8 of the spec — subject to the two binding
  requirements above. Separately: resolution of the phantom-audit governance
  item (source retrieval or the fallback citation correction), whenever the
  architect reports which branch applies.

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE Phase A (schema + config) — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — explicit architect order ("ARCHITECT
  AUTHORIZATION — ORDEM-COMPRA-PHASE-A (schema + config)"), Sonnet 5 / medium
  effort, scoped to Phase `A` exclusively per `ORDEM_COMPRA_LIFECYCLE_SPEC_
  PROPOSED.md` §11 — Phases `B`-`E` each require their own order.
- **Front:** `ORDEM-COMPRA-LIFECYCLE`, Phase `A`, per
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (`RATIFIED`,
  `ORDEM-COMPRA-LIFECYCLE-SPEC-RATIFICATION-R1`).
- **Branch discipline (new, binding for all implementation work going
  forward per this order):** branch `dev` created from `work/g28-document-
  qualification`'s HEAD (`84e2a07`); all implementation commits for this
  phase land on `dev`. `git push production dev` is separately authorized
  (remote backup) — see Push below. Push to `main` remains forbidden
  (auto-deploys to production).
- **Technical commit:** `fb0e6cb` — "Add ordem de compra lifecycle schema
  (Phase A)" (`db/65_ordem_compra_lifecycle_schema.sql`,
  `tests/ordem-compra-lifecycle-schema.smoke.js`). Documentation closeout:
  this entry, in a separate commit after staging verification.
- **Scope resolution (asked and answered before writing SQL):** the order's
  own bullet enumeration named only three schema elements (dimension
  columns, `ordem_compra_eventos`, config storage) but its SCOPE header
  cited spec §8's Phase A row as authoritative, and that row explicitly
  includes a fourth element — the `ordem_compra_fio_lancamentos` ledger
  table (empty, no trigger, Phase C's job to wire). Flagged to the architect
  before implementation; **architect selected "include it, per §8's Phase A
  row"** — included in `db/65`, documented here rather than silently
  resolved either way.
- **Four schema additions, all additive/forward-only/idempotent:**
  1. **`public.ordens_compra_fio`** gains 12 new columns (§3.1):
     `status_administrativo` (`rascunho|emitida|cancelada`, default
     `rascunho`), `status_aceite` (`nao_aplicavel|pendente|aceita|
     rejeitada`, default `nao_aplicavel`), `status_recebimento`
     (`nao_recebido|parcial|recebido`, default `nao_recebido`) — the three
     orthogonal dimensions — plus `aceite_exigido_na_emissao` (nullable
     freeze-snapshot), `emitida_em`/`emitida_por`, `cancelada_em`/
     `cancelada_por`, `aceite_decidida_em`/`aceite_decidida_por`,
     `aceite_motivo`, `legado_recebimento_automatico` (default `FALSE`).
     Every column additive/nullable-or-defaulted; the existing `status`/
     `kg_recebido` columns untouched (confirmed by static test — no `DROP`,
     no `ALTER COLUMN` on either).
  2. **`public.ordem_compra_fio_lancamentos`** (new, §3.2) — physical
     receipt ledger, `kg_recebido NUMERIC(10,3) CHECK (> 0)`, indexed on
     `ordem_compra_fio_id`. Shipped empty/unused: no trigger (Phase C's
     job), no writer RPC.
  3. **`public.ordem_compra_eventos`** (new, §3.4) — transition audit,
     `op_eventos` (`db/21`) / `usuarios_eventos` (`db/60`) pattern:
     `dimensao CHECK IN (administrativo, aceite, recebimento)`,
     `tipo_evento`, `valor_anterior`/`valor_novo`, `payload JSONB`. No
     writer exists yet (every write path in spec §4 is Phase B/C).
  4. **`public.ordem_compra_config`** (new, §3.5) — singleton
     (`id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1)`),
     `exige_aceite BOOLEAN NOT NULL DEFAULT FALSE`, seeded via
     `INSERT ... ON CONFLICT (id) DO NOTHING`. Dedicated one-row table, not
     a generic key-value store (Rule 7).
- **RLS/ACL — db/57/63 standard, admin-only read, no client writes, stated
  complete (not a delta) on all three new tables:** `ENABLE ROW LEVEL
  SECURITY`; `REVOKE ALL FROM PUBLIC, anon, authenticated`; `GRANT SELECT TO
  authenticated`; single `FOR SELECT USING (is_admin())` policy; no
  `INSERT`/`UPDATE`/`DELETE` policy for any client role on any of the three
  — every future writer (Phase B/C's `SECURITY DEFINER` RPCs) writes as
  table owner, bypassing RLS by ownership, never by a permissive policy.
- **Binding gap 1 honored (single transaction):** the `ALTER TABLE` and the
  §3.6 legacy-marking `UPDATE` execute inside one explicit `BEGIN`/`COMMIT`
  block in `db/65` — no window exists for a live draft row to be mislabeled
  by the backfill's own `WHERE status_administrativo = 'rascunho'` clause.
  Binding gap 2 (revoking direct `UPDATE` on the four dimension columns from
  `authenticated`) is explicitly Phase B/C scope, per the spec — not applied
  here; confirmed absent by static test (`scope guard` test).
- **Legacy backfill (§3.6):** every pre-existing row (39 total, all at the
  column default `status_administrativo='rascunho'` immediately after the
  `ALTER TABLE`) marked `status_administrativo='emitida'`,
  `status_aceite='nao_aplicavel'`, `legado_recebimento_automatico=TRUE`,
  `status_recebimento` derived from the legacy `status` column
  (`pendente→nao_recebido`, `recebido_parcial→parcial`,
  `recebido_total→recebido`). No `kg_recebido` value rewritten.
- **HARD STOP ZERO passed before any write:** the order required confirming
  the MCP ref before writing. The project-scoped `supabase-legacy` MCP
  (distinct from the management-scoped, production-pinned, read-only MCP
  already connected this session) was fingerprinted via row counts unique
  to the legacy/development database per the `M3` closeout record —
  `usuarios_eventos=9` and `document_link_revisions=8` — both matched
  exactly, confirming `supabase-legacy` is pinned to `ucrjtfswnfdlxwtmxnoo`
  (development, formerly "staging"), not `gqmpsxkxynrjvidfmojk`
  (production). No write issued before this confirmation.
- **Staging (`ucrjtfswnfdlxwtmxnoo`) apply:** applied via `supabase-legacy`
  MCP `apply_migration`. **Migrations registry — before/after:** before —
  highest recorded `64_backup_runs_schema` (`20260717125153`); after —
  `65_ordem_compra_lifecycle_schema` recorded at `20260718110246`,
  immediately following `64` with no gap. **Pre-state:** 39
  `ordens_compra_fio` rows (12 `pendente`, 0 `recebido_parcial`, 27
  `recebido_total`); none of the four new tables/columns existed.
  **Post-state:** same 39 rows, all backfilled correctly (12→
  `nao_recebido`, 27→`recebido`, 0 bad-mapping rows in either group,
  confirmed live); `ordem_compra_fio_lancamentos`/`ordem_compra_eventos`
  both empty (0 rows, as designed); `ordem_compra_config` = 1 row,
  `exige_aceite=false`.
- **Verification matrix (`BEGIN…ROLLBACK`, synthetic, cleanup confirmed
  zero), 14/14 checks, all `OK`:**
  1. Legacy marking: both groups (27 `recebido_total`→`recebido`, 12
     `pendente`→`nao_recebido`) map correctly, zero bad-mapping rows, zero
     `NULL kg_recebido` on a `recebido_total` row.
  2. New order defaults: a synthetic draft lands `status_administrativo=
     rascunho`, `status_aceite=nao_aplicavel`, `status_recebimento=
     nao_recebido`, `aceite_exigido_na_emissao=NULL`,
     `legado_recebimento_automatico=false` — exactly the column defaults,
     no legacy contamination.
  3. `ordem_compra_config`: exactly 1 row, `exige_aceite=false`.
  4. Events-table role matrix: `anon` `SELECT` → `42501` (table `GRANT`
     boundary, before RLS even evaluates); non-admin `authenticated`
     (`auth.uid()` resolved to a random UUID with no matching admin row) →
     `0` rows visible (RLS filters); admin `authenticated` (real admin
     `auth.uid()`) → `1` row visible (the synthetic event, correctly
     surfaced).
  5. Dimension `CHECK` constraints reject invalid values on all four
     enum-bearing columns: `status_administrativo`, `status_aceite`,
     `status_recebimento` (all `23514 check_violation` on an out-of-set
     `UPDATE`), `ordem_compra_eventos.dimensao` (same), and the
     `ordem_compra_config` singleton `CHECK (id = 1)` (rejects a second row
     with `id=2`).
  **Cleanup verified zero:** post-rollback live counts —
  `ordens_compra_fio=39` (unchanged), `ordem_compra_fio_lancamentos=0`,
  `ordem_compra_eventos=0`, `ordem_compra_config=1` (the real seed row
  only) — no synthetic residue survived the `ROLLBACK`.
- **Tests:** `tests/ordem-compra-lifecycle-schema.smoke.js`, 12/12 (static
  source assertions — every new column/default/`CHECK`, all three new
  tables' shape/index/RLS/grants, the single-transaction wrapper, the
  backfill mapping, and a scope guard confirming no RPC/trigger/
  dimension-column `REVOKE` — all explicitly Phase B/C/D territory — leaked
  into this file). **Regression — file-swap method** (purely additive
  change, one new SQL file + one new test file, zero existing files
  modified — regression is guaranteed by construction, verified anyway):
  the new test file moved aside, full suite run (`before`: `3830` tests /
  `3690` pass / `140` fail), file restored and re-run (`after`: `3842` /
  `3702` pass / `140` fail) — exactly the `+12` new tests added, all
  passing; the 140 failing test names confirmed byte-identical between
  runs (`comm -13`/`comm -23` both empty — pre-existing, unrelated
  flakiness class, e.g. `write-guard.smoke.js`'s `ECONNREFUSED
  127.0.0.1:8765` against a local `http.server` not running in this
  session).
- **Forbidden scope honored:** no RPC (`emitir`/`cancelar`/`decidir_aceite`/
  `registrar_recebimento_ordem_compra_fio` — all Phase B), no UI, no
  `.js` file touched, no trigger on `ordem_compra_fio_lancamentos` (Phase
  C), no `REVOKE` of the dimension columns' `authenticated` write access
  (Phase B/C, binding gap 2), no production access, no push to `main`.
- **Hard stops:** none encountered. MCP ref confirmed before any write (see
  above); the one scope ambiguity (ledger table inclusion) was surfaced to
  the architect and resolved before implementation, not guessed.
- **STRUCTURAL POLICY COMPLIANCE:** `§7` (size) — both new files well under
  the acceptable ceiling; `§9` (Supabase writes) — no JS write module
  touched (schema-only phase); `§13` (tests) — migration smoke proportional
  to risk, static allow-list-style assertions, full staging role-matrix via
  `BEGIN…ROLLBACK` as the real gate; `§14` (single scope) — schema/config
  only, no RPC/UI/trigger/gate mixed in; `§15` (Git) — selective staging by
  literal path (`db/65` + the new test file only — the pre-existing
  uncommitted `op-nova.js`/`op-recalculo.js`/test changes on this worktree
  from before this phase began were never staged or touched), technical
  commit then a separate docs commit, both on `dev`, no `add -A`/`reset`/
  `rebase`/force-push/`merge`/`tag`/`amend`; `§19` — English throughout new
  code/comments/commit messages. No production access
  (`gqmpsxkxynrjvidfmojk` not accessed by this phase — confirmed via the
  fingerprint check above); push to `main` never attempted.
- **Production:** `gqmpsxkxynrjvidfmojk` not accessed. **Push:** `git push
  production dev` authorized by this order (remote backup only — `dev`
  branch, not `main`).
- **Record (this commit):** `PROJECT_STATE.md` (`ORDEM-COMPRA-LIFECYCLE`
  track block: Phase `A` moved from `NOT AUTHORIZED` to `CLOSED /
  ACCEPTED`; Closed-phases row added; `NOT AUTHORIZED` candidate fronts line
  updated to show Phases `B`-`E` remaining); `AGENT_HANDOFF.md` (new top
  entry); this ledger entry; `docs/DOCUMENTATION_INDEX.md` §4 (new `db/65`
  row + new smoke-test row); `docs/reports/ORDEM_COMPRA_PHASE_A_2026-07-
  18.md` (new phase report — guide format + verification matrix +
  registry before/after).
- **Next phase indicated at closeout:** Phase `B` (panel visibility +
  administrative writes — `emitir_ordem_compra_fio`/
  `cancelar_ordem_compra_fio` RPCs, a precondition-guarded
  `registrar_recebimento_ordem_compra_fio`, UI badges, and binding gap 2's
  `REVOKE`), pending its own architect order per spec §8. Phases `C`
  (receipt rework via the ledger trigger), `D` (gate activation), and `E`
  (dormant-acceptance checkpoint) remain `NOT AUTHORIZED`, each pending its
  own order.

## 2026-07-18 — YARN-BUTTONS-PHASE-1 (+ corrections) — Shared Distribution Builder — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` — architect visual validation on staging
  local of BOTH surfaces (OP screen Preparação block + Pedido hub transition
  modal). Order `CLOSEOUT YARN-BUTTONS-SHARED-BUILDER` (docs-only, Sonnet 5 /
  low effort).
- **Front:** `YARN-BUTTONS-PHASE-1` and its two corrections
  (`YARN-BUTTONS-PHASE-1-CORRECTION`, `YARN-BUTTONS-FINAL-CONTRACT`). UI-only,
  branch `dev`.
- **Final contract (recorded, binding):**
  - The proposal/distribution modal footer is EXACTLY two buttons —
    **`Manter pedido`** and **`Salvar distribuição`** — both **save-only**:
    they persist `op_itens.metros_ajustados` via `salvarDistribuicaoOP` and
    NEVER start production, change status, or snapshot saldo. `Manter pedido`
    persists the pedido metrage; `Salvar distribuição` persists the slider
    distribution (enabled only when the current distribution differs from the
    last saved one, and no yarn is exceeded).
  - **`Iniciar produção`** is the ONLY production-start path (saldo snapshot
    + `status → em_producao`, via `iniciarProducaoOP`). It is present on BOTH
    surfaces — the OP screen Preparação block and the Pedido hub transition
    surface — and is enabled only when a saved distribution exists AND the
    received yarn covers it; otherwise disabled with an explanatory `title`.
  - `Aceitar proposta` removed entirely (both surfaces). The dead
    `aplicarRecalculo` wrapper in `op-nova.js` removed.
- **ROOT CAUSE (why the earlier corrections regressed):** TWO parallel modal
  builders existed — `op-nova.js` (`buildProposta`) and
  `pedido-detail-events.js` (`buildTecAcceptanceProposalBlock` /
  `openTecAcceptanceModal`). The first two corrections edited only the OP
  screen, so the removed `Aceitar proposta` button (and a live
  production-start path) kept returning from the Pedido-side twin whenever an
  OP was accepted from the Pedido panel. It was not dead code — it was a
  deliberately-built, separately-tested parallel implementation.
- **Resolution:** new shared module **`js/screens/op-distribuicao-ui.js`** —
  `buildDistribuicaoBlock` (sliders + live consumption + `[Manter pedido,
  Salvar distribuição]`, save-only) and `buildIniciarProducaoButton` (the
  single production-start). Both surfaces now CONSUME these builders; the two
  duplicated implementations were deleted. Duplication eliminated.
- **Files:** new `js/screens/op-distribuicao-ui.js`; `js/screens/op-nova.js`
  (buildProposta → shared block; Preparação rail → shared button; dead
  wrapper removed); `js/screens/pedido-detail-events.js` (twin builders →
  shared block + shared button; hub `Aceitar OP` → `Distribuição` opening the
  save-only modal + `Iniciar produção`); `index.html` (script tag); smokes
  `op-nova`/`op-recalculo`/`pedido-detail`/`op-latex-admin`/`op-writes`/
  `op-persistir`.
- **Verification:** in-browser against the real production code (running
  static app) — modal footer proven to be exactly `[Manter pedido, Salvar
  distribuição]`; `Salvar` click calls ONLY `salvarDistribuicaoOP` (never
  `iniciarProducaoOP`); `Iniciar produção` disabled without a saved
  distribution (with title) and enabled with one, click → `iniciarProducaoOP`.
  Grep-confirmed the only Tecelagem production-start is `iniciarProducaoOP`,
  called from one place (the shared button). Full suite `3710` pass / `132`
  fail — **zero new failures vs baseline** (`134`); the net `-2` are the two
  previously-updated OP smokes now green. All remaining failures pre-existing
  (CRLF slice-regex + `http.server` `:8765` not running).
- **Technical commits (branch `dev`):** `02679f9` (Fix Iniciar produção
  button placement — the first correction) and `2388d39` (Unify yarn
  distribution UI into one shared builder — this closeout+s subject). This
  ledger entry + `PROJECT_STATE.md` + `AGENT_HANDOFF.md` recorded in a
  separate docs commit.
- **Open PRODUCT DECISION (registered, NOT a defect):** `Manter pedido` may
  now be redundant with `Salvar distribuição` (both are save-only; `Manter`
  just seeds the pedido metrage). Architect to decide keep-or-remove; if
  removed, can fold into a future `YARN-BUTTONS Phase B`.
- **LESSON (standing governance/process note):** UI position must be
  specified by NAMED block/screen, never by relative reference; and every
  UI order must require verifying ALL surfaces that render the component —
  this app has documented modal duplication (OP screen ↔ Pedido hub) and a
  single-surface edit silently leaves the twin stale.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — UI-only, one
  coherent change (extract-and-consume); `§7` (size) — shared module small,
  both screens shrank (net `-183` lines across the code files); `§15` (Git)
  — selective staging by literal path (the pre-existing uncommitted
  `.gitignore` change left untouched/unstaged), single docs commit on `dev`,
  no `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/`amend`; `§19` —
  English for new code/comments/commit messages, pt-BR preserved for
  user-facing UI labels. No production access; no push to `main`.
- **Next indicated at closeout:** await the architect+s keep/remove ruling on
  `Manter pedido` (the registered product decision). No further YARN-BUTTONS
  work authorized otherwise.

---

## 2026-07-18 — ORDEM-COMPRA SPEC AMENDMENT (Part 1) — CLOSED / ACCEPTED — + PHASE B1 AUTHORIZED, DB-execution HARD-STOPPED

- **Gate:** `CLOSED / ACCEPTED` for **Part 1 (spec amendment, docs-only)** of
  the order "ARCHITECT ORDER — ORDEM-COMPRA SPEC AMENDMENT + PHASE B1"
  (Sonnet 5 / medium effort as ordered; executed by the resident executor).
  **Part 2 (Phase `B1`) is AUTHORIZED but `HARD-STOPPED` this session** — see
  the hard-stop record below. No code, schema, staging, or production action
  taken.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track. Branch `dev`.
- **Part 1 — what was amended** (`docs/architecture/ORDEM_COMPRA_LIFECYCLE_
  SPEC_PROPOSED.md`), recording the architect's 2026-07-18 decision:
  - **Separation of responsibilities (the ruling):** receipt registration
    (`lançamentos`: quantity, date, partial) lives on the purchase order's own
    detail screen (receipt is a fact about the *purchase*, not the production;
    also future-proofs supplier acceptance and multi-OP/`saldo` sharing). The
    OP screen's section becomes a **reader** (linked orders + dimension badges +
    available yarn per color; registers nothing). Distribution sliders +
    `Salvar distribuição` + `Iniciar produção` stay on the OP screen; the
    Phase D gate reads availability from the orders' received totals.
  - **§6 (UI surface):** the single-section description is superseded by a
    dated amendment block describing **three surfaces** — (a) OP detail screen
    section (reader + admin-cycle actions) → Phase `B1`; (b) purchase order
    detail screen (route `#/ordens-compra/:id`, the entity's home) → Phase
    `B2`, receipt UI present but wired in Phase C; (c) purchase orders list
    screen (sidebar, filterable) → Phase `B3`. Original bullets retained for
    provenance; the amendment block governs on conflict.
  - **§8 (phasing):** the single Phase `B` row is superseded by `B1`/`B2`/`B3`
    plus a clarified Phase `C` (receipt entry point = the order detail screen;
    OP section reflects totals automatically). Phases `D`/`E` unchanged.
    `B1`'s `emitir` carries an additional **fornecedor-assigned precondition**,
    recorded as *additive* to §4's `status_administrativo = 'rascunho'`
    precondition, not a change to the ratified §4 contract.
  - **Ratified content untouched:** the three-dimension model (§1), the
    write-path contracts (§4), the gate definition (§5), and the freeze rule
    (§2.3) are unchanged — the order's escalate-on-conflict condition did not
    trigger (the amendment is confined to §6/§8, which the order authorized).
- **Part 2 — Phase `B1`: HARD STOP (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`).**
  The order routes all DB work through the `supabase-legacy` MCP against
  staging `ucrjtfswnfdlxwtmxnoo`, with "confirm ref, HARD STOP on mismatch" as
  a pre-step. That MCP is **unauthenticated** this session and its OAuth flow
  **cannot be completed non-interactively** (session-start notice; its tools
  are absent from the tool registry, verified via ToolSearch — neither
  `mcp__supabase-legacy__*` nor `mcp__supabase__*` resolvable). Consequently
  the mandated ref-confirmation itself cannot run, and neither can: the
  `emitir_ordem_compra_fio` / `cancelar_ordem_compra_fio` RPCs, the RLS-revoke
  migration `db/66`, the RPC role-matrix tests, or the final-ACL catalog
  verification. Per the Supervision Protocol, a phase that cannot meet its
  test/verification gate is **not** closed with unverified artifacts; the
  executor stopped and reported rather than commit unapplied RPCs/RLS/UI as a
  false `B1` closeout. **To unblock:** authorize the `supabase-legacy` MCP in
  an interactive session, then resume/re-issue Part 2.
- **Validação:** docs-only Part 1 — `git diff --check` clean; the three spec
  edits + `PROJECT_STATE.md` + this ledger entry are the whole change set. No
  schema/RPC/JS file created or modified. MCP unavailability confirmed by
  ToolSearch returning no `supabase*` tools.
- **Record (this commit):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_
  PROPOSED.md` (top-banner amendment pointer, §6 amendment block, §8 amendment
  block); `PROJECT_STATE.md` (ORDEM-COMPRA track note updated with the
  amendment + `B1` authorization + hard stop; the ratification-era "all phases
  NOT AUTHORIZED" sentence cross-referenced; `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-
  AUTH` live debt added; candidate-fronts line → `B2`-`E`; Closed-phases row
  added); this ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only, one
  coherent amendment; `§15` (Git) — selective staging by literal path, single
  docs commit on `dev`, the pre-existing uncommitted `.gitignore` change left
  untouched/unstaged, no `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/
  `amend`; `§19` — English throughout (spec is a canonical doc; no UI text
  touched). No staging/production access; no push authorized by this order
  segment.
- **Next indicated at closeout:** resolve `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`
  (authorize the `supabase-legacy` MCP interactively), then execute Phase `B1`
  Part 2 under its authorization. Amendment Part 1 requires nothing further.

---

## 2026-07-18 — ORDEM-COMPRA-LIFECYCLE Phase B1 — CLOSED / ACCEPTED

- **Gate:** `CLOSED / ACCEPTED` (Sonnet 5 / low effort, docs-only closeout,
  branch `dev`). Supersedes the hard-stop recorded in the prior entry
  (`ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH`) — the `supabase-legacy` MCP
  authenticated this session.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` track, Phase `B1`.
- **What closes:** both halves of Phase `B1`.
  - **UI reader** (`buildOrdensReaderSection`, `js/screens/op-nova.js`,
    commit `b0c3f27`): one row per linked order, material—cor · fornecedor ·
    qtd · three dimension badges · Emitir/Cancelar admin actions per state,
    config chip, frozen-at-emission note, no receipt inputs; defensive
    extended-select-with-fallback so a pre-`db/65` database degrades safely.
  - **DB half** (`db/66_ordem_compra_emitir_cancelar.sql`, commit `5a2cde7`,
    applied to staging `ucrjtfswnfdlxwtmxnoo` in an earlier session):
    `emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio` RPCs (admin-only via
    `is_admin()`; emit requires `status_administrativo='rascunho'` AND
    `fornecedor_id IS NOT NULL`; cancel requires `rascunho`|`emitida`; each
    writes one `ordem_compra_eventos` row) + partial ACL hardening (`REVOKE
    UPDATE` on `ordens_compra_fio` from `authenticated`, restored
    column-by-column except the three dimension columns).
- **Verification this session (read-only diagnosis → seed → verify →
  fix, four sub-steps):**
  1. **Staging seed:** HARD STOP fingerprint (`usuarios_eventos=9`,
     `document_link_revisions=8`) confirmed the MCP pinned to
     `ucrjtfswnfdlxwtmxnoo` before any write. Seeded `fornecedor_id` on 4
     `rascunho` orders (OP nº36/2026, ids 137-140) via direct `UPDATE` (not
     the broken UI selects) so the architect could walk both admin actions.
  2. **Bug report reconciliation:** the architect observed an Emitir click
     on a null-fornecedor order show a success toast and appear to move to
     `emitida`. A full scan of every non-legacy `ordens_compra_fio` row
     showed **100% still `rascunho`, zero real `emitida_em`, zero
     `ordem_compra_eventos` rows** — no order had ever actually transitioned
     via this RPC. A first re-test attempt (CTEs joined only by a constant)
     gave a false "no effect" reading — Postgres does not guarantee CTE
     execution order without a real data dependency; corrected with a
     PL/pgSQL `DO` block (guaranteed sequential statements) in a scoped
     `BEGIN…ROLLBACK` transaction simulating the admin JWT
     (`request.jwt.claims`): null-fornecedor emit → `{ok:false,erro:'Ordem
     sem fornecedor atribuido nao pode ser emitida'}`, row unchanged;
     fornecedor-assigned emit → `{ok:true,...}`, row genuinely transitions +
     1 `ordem_compra_eventos` row. **The RPC and db/66's matrix are correct
     in both directions** — the discrepancy was entirely client-side.
  3. **Root cause + fix:** `emitirOrdemCompra`/`cancelarOrdemCompra`
     (`js/screens/op-nova.js:1073-1091`, pre-fix) checked only `res.error`
     (transport-level); the RPCs return HTTP 200 with `{ok:false,erro:...}`
     on business-logic rejection, so `res.error` stays falsy and the code
     fell through to an unconditional success toast + `reloadOrdens()`.
     Fixed (commit `275ede2`) to also check `res.data.ok !== true`,
     surfacing `res.data.erro` on rejection; identical fix applied to
     `cancelarOrdemCompra` (same latent defect, not yet observed live —
     double-cancel would have false-succeeded identically).
  4. **Sweep (no systemic debt):** every other `supa.rpc(...)` call site
     checked — `alterar_status_op`, `concluir_pedido_se_pronto`,
     `cliente_pedido_summary`, `registrar_entrega_expedicao`,
     `liberar_expedicao`/`liberar_expedicao_latex_parcial`, the
     `documents-supabase-*` adapters, `delete-helpers.js`'s
     `normalizeResult` already check `res.data.ok === false` correctly;
     `gerar_op_latex`/`gerar_op_latex_split` (`RAISE EXCEPTION`, no
     `{ok,erro}` envelope), `proximo_numero_op`/`admin_usuarios_last_sign_in`
     (plain scalar/read, no envelope) correctly use error-only checks. This
     was an isolated defect in the two new B1 handlers, not a pattern.
  5. **Architect visual re-walk (staging):** error path — Emitir on the
     "— não atribuído" order → error toast, row stays Rascunho; success
     path — Emitir on a fornecedor-seeded order → success toast, badge
     flips to Emitida. **Both confirmed OK.**
- **Tests:** 2 new render-harness smokes (`tests/op-nova.smoke.js` #77-78)
  assert the error path (rejected emit/cancel → error toast with the RPC's
  own message, not the false success toast, correct `bg-red-600` class).
  Harness extended with an optional `rpcImpl` hook on
  `buildFakeSupa`/`makeRenderSandbox`/`renderNovaOpForTest` (default
  preserves prior no-op behavior, zero impact on existing tests) and an
  exposed `sandbox.__toastsNode`. `tests/op-nova.smoke.js` 83/83 pass; full
  suite `132` pre-existing failures unchanged, zero regression.
- **Ratified supplier-assignment decision (this closeout, binding):**
  fornecedor assignment is a **per-order** property of `ordens_compra_fio`.
  The schema already supports it fully — nullable `fornecedor_id` FK, one
  row per material+color already generated at Abrir OP
  (`montarOrdensCompraFio`), already the row-level RLS ownership key
  (`ocf_fornecedor_read`/`ocf_fornecedor_update`) and already the `emitir`
  RPC's own precondition — **no schema change needed**, this is UI-relocation
  work. Assignment **moves to the future Phase `B2` order-detail screen**.
  The OP-screen's legacy fornecedor selects (`buildAtrib` in `op-nova.js`,
  which bulk-assigns one fornecedor per material type across an entire OP
  via `atribuirFornecedorFioOp`, collapsing what the schema already models
  as independent per-color orders) are **removed only after `B2` is
  functional** — no gap where assignment becomes impossible in the UI.
  `op_fornecedores` (the OP-level `etapa`-keyed bookkeeping table) is
  **kept synchronized as a compatibility projection, not cosmetic** —
  `ops_fornecedor_read`/`op_itens_fornecedor_read` RLS key on it for
  supplier visibility into the OP, and `screenFornecedorOrdens`'s embedded
  `ops(numero,ano)` join silently degrades to `—` without it; `B2`'s
  fornecedor-assignment writer must also upsert the matching
  `op_fornecedores` row. **Reassignment after `emitida` is BLOCKED** — the
  correction path is cancel + open a new draft order, not an in-place swap
  on an already-emitted order (keeps the `ordem_compra_eventos` audit trail
  honest, consistent with the ratified "emission locks quantities"
  precedent). The empty-dropdown bug (`fornecedores.tipo` domain
  `fio_algodao`/`fio_poliester`/`tecelagem`/`latex` vs
  `ordens_compra_fio.tipo` domain `algodao`/`poliester`, collided under the
  shared variable name `tipo` in `buildAtrib`, `op-nova.js:1185-1188`) is
  **recorded as noted-not-fixed** — those selects are slated for removal at
  `B2`, so patching a soon-to-be-deleted path is not worthwhile.
- **Debts registered (canonical, verbatim):**
  - `ORDEM-COMPRA-B1-KG-RECEBIDO-ACL-GAP` — `kg_recebido` remains directly
    writable by `authenticated` after `db/66` (both
    `registrarRecebimentoOrdemFio`, `op-writes.js:29-43`, and
    `screenFornecedorOrdens`, `fornecedor.js:461-463`, keep writing it
    directly, the latter gated by the pre-existing `ocf_fornecedor_update`
    RLS policy); PostgreSQL column-level `REVOKE` cannot narrow an
    already-existing table-level grant without breaking both live
    consumers immediately, with no replacement RPC. **Closes only when
    Phase C ships the ledger-based `registrar_recebimento_ordem_compra_fio`
    RPC in the same migration that revokes `kg_recebido` from
    `authenticated`.**
  - `SUPPLIER_RECEIPT_WRITE_PATH_DISCOVERED` — `js/screens/fornecedor.js:461`
    (`screenFornecedorOrdens`) is a live, independent supplier-facing direct
    `UPDATE` of `kg_recebido`/`data_recebimento`/`status` on
    `ordens_compra_fio`; not mentioned in the spec's §0 evidenced-inventory
    (which asserted suppliers have no existing write path on this table).
    Flagged here in the provenance trail — **§0 of
    `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` is
    deliberately NOT rewritten**; the discovery is recorded as a correction
    trail, not folded silently into the ratified inventory text.
  - **Phase C scope AMENDED (binding):** the ledger-based
    `registrar_recebimento_ordem_compra_fio` RPC and rewrite must serve
    **both** live consumers — `op-writes.js`'s `registrarRecebimentoOrdemFio`
    **and** `fornecedor.js`'s `screenFornecedorOrdens` (previously scoped
    only around the admin writer) — `screenFornecedorOrdens` must be
    rewritten to call the ledger RPC instead of updating
    `ordens_compra_fio` directly.
- **Record (this commit):** `PROJECT_STATE.md` (Phase `B1` marked `CLOSED /
  ACCEPTED`, `ORDEM-COMPRA-B1-BLOCKED-BY-MCP-AUTH` marked `RESOLVED`, the
  three debts registered, the supplier-assignment decision recorded,
  Closed-phases row added); `AGENT_HANDOFF.md` (new entry, prepended); this
  ledger entry.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — docs-only
  closeout, one coherent record of an already-verified phase; `§15` (Git) —
  selective staging by literal path, single docs commit on `dev`, the
  pre-existing uncommitted `.gitignore` change left untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force-push/`merge`/`tag`/`amend`; `§19` —
  English throughout (canonical docs; no UI text touched). No DB/schema
  action this commit (the RPCs/ACL were already live from an earlier
  session, re-verified read-only + via a rolled-back synthetic matrix); no
  production access; no push to `main`.
- **Next indicated at closeout:** Phase `B2` (order detail screen, route
  `#/ordens-compra/:id`), its own order — scope must include the per-order
  fornecedor-assignment UI per the ratified decision above, and must
  preserve the `op_fornecedores` compatibility-projection write.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Legacy Diagnosis + PART 1 refounded spec — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only phase (Opus 4.8 / high effort). Multi-order chain:
  (1) "ORDEM-COMPRA REFOUNDATION SPEC" (docs + read-only diagnosis), (2)
  "HEADER-COUNT RECONCILIATION" (read-only), (3) "RATIFY 51-HEADER LEGACY MODEL"
  (diagnosis correction + commit), (4) "CONTEXT SUPPLEMENT SUPPLIED / PART 1
  UNBLOCKED". No implementation, no schema/RPC, no production access, no push,
  `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE`, refoundation of the purchase-order model.
- **Read-only legacy diagnosis (staging `ucrjtfswnfdlxwtmxnoo`, HARD STOP ZERO
  passed — `usuarios_eventos=9`/`document_link_revisions=8`):** full-table
  classification of all 64 `ordens_compra_fio` rows into four classes (A 27 legacy
  emitted+received; B 12 legacy emitted-unreceived; C 13 clean drafts; D 12 draft
  but physically-received via the direct-write path). Facts: `ordem_compra_eventos`
  and `ordem_compra_fio_lancamentos` both **empty**; 60/64 rows `fornecedor_id`
  NULL; OP36 splits one OP across suppliers 4/5/22; over-receipt +405.98 kg; 0
  cancelled, 0 partial receipts. `docs/reports/ORDEM_COMPRA_LEGACY_DIAGNOSIS_
  2026-07-18.md`.
- **Header-count reconciliation → architect ruling:** a first preview reported 14
  headers (grouped NULL suppliers by pedido — **rejected**, fabricates commercial
  identity); a 50-header alternative merged `(pedido,fornecedor)` (**rejected** —
  proves future draft-accumulation, not historical order identity). **Architect
  ratified the 1:1 model:** every header-bearing legacy row → its own legacy
  header, no auto-merge, Class C → needs-only. **Ratified counts: 64 needs / 51
  headers / 51 items / 51 allocations** (A 27/27/27/27, B 12/12/12/12, C 13/0/0/0,
  D 12/12/12/12). OP36 = **4 legacy headers** (vs 3 future-native). Diagnosis
  corrected to the ratified model and committed **alone** as `de62b16` — "Add
  purchase-order legacy diagnosis" (1 file, 259 insertions; `.gitignore` not
  staged).
- **CONTEXT SUPPLEMENT blocker (four structural flaws):** referenced across orders
  but absent from the session and the repository (exhaustive search). Executor
  **hard-stopped twice** rather than fabricate; the architect confirmed the stop
  correct and supplied the authoritative CONTEXT SUPPLEMENT, unblocking PART 1.
- **PART 1 — refounded spec (`Part R`, PROPOSED):**
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` amended (status →
  `PROPOSED / AWAITING ARCHITECT RATIFICATION`) with the four-layer model
  (`necessidade_compra_fio → ordem_compra → ordem_compra_item →
  ordem_compra_item_alocacao`): domain ownership (Pedido owns header, OP-origin at
  allocation), the three internal acts of the Insumos stage, allocation invariants
  making **double distribution structurally impossible**, native accumulator
  (Rule 1: one active draft per pedido+fornecedor; new draft after emission; native
  supplier required), issuance freeze + immutable emitted order + cancel-and-
  replace, acceptance lifecycle, item-level immutable receipt ledger + derived
  state (Rule 2: snapshot→ledger transition), over-receipt→`saldo_fios`, legacy
  1:1 conversion (A/B/C/D, 64/51/51/51, supplier-null exception, Class-D
  received-without-emission provenance, OP36 legacy-vs-native), coexistence with
  `ordens_compra_fio` (**both** receipt writers `registrarRecebimentoOrdemFio` +
  `screenFornecedorOrdens` live until Phase C; `KG-RECEBIDO-ACL-GAP` closes only
  after both migrate and direct UPDATE is revoked), immutable events, native-vs-
  legacy identity semantics, production-diagnosis precondition, migration
  safety/rollback boundaries, and permanent UI governance. **Explicit verification
  against the four flaws (§R.18) and the two additional rules (§R.19).** Rephased
  track `REFUND-A → REFUND-B1 → PRE-PROD → B2 → C → D → E` with per-phase
  responsibility + exit gate (§R.17). The flat foundation of Phase `A` (`db/65`) /
  `B1` (`db/66`) is **superseded on the persistence model**; §0–§11 retained for
  provenance; **historical acceptance of A/B1 preserved, not erased.**
- **Canonical reconciliation (§8, 11 docs — no material contradiction):**
  `AGENT_HANDOFF`, `PROJECT_STATE`, `PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO`
  (orthogonal), `PEDIDO_PRODUCTION_FLOW_BACKLOG` (confirms two-writer reality +
  transition-modal/dedicated-screen UI), `DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO`
  (orthogonal), `PEDIDO_OP_SCHEMA_CONTRACT` (confirms ownership: `lotes.pedido_id`
  grouping, no `ops.pedido_id`/`pedidos.op_id`, OP-origin chain), the current spec,
  the ledger (append-only), `DOCUMENTATION_INDEX`, `DOCUMENTATION_MODEL`,
  `SUPERVISION_PROTOCOL`. **Follow-ups flagged (outside this pass's allowed
  files):** `PEDIDO_OP_SCHEMA_CONTRACT.md §6.2` (Insumos source names
  `ordens_compra_fio` — will need the four-layer model post-cutover) and
  `DOCUMENTATION_INDEX.md` (register the new diagnosis report + refounded spec) —
  each a separate documentation phase.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` (single scope) — documentation only, no
  code/schema/Supabase action; `§15` (Git) — selective staging by literal path,
  two commits on `dev` (diagnosis alone, then spec + state/continuity), pre-existing
  `.gitignore` change left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force-push/`merge`/`tag`/`amend`; `§16` (documentation) — spec amended, state +
  ledger updated, `DOCUMENTATION_INDEX` registration deferred as a flagged
  follow-up (out of allowed-file scope); `§19` — English throughout. Read-only DB
  access was limited to legacy `ucrjtfswnfdlxwtmxnoo` (fingerprint-confirmed);
  production `gqmpsxkxynrjvidfmojk` and prohibited `bhgifjrfagkzubpyqpew` **not
  accessed**.
- **Production:** UNKNOWN for migration; not accessed. A contemporaneous read-only
  production diagnosis is a **binding precondition** before any production
  promotion/migration in this track (§R.14). **Push:** none (prohibited by order).
- **Record:** diagnosis commit `de62b16` ("Add purchase-order legacy diagnosis");
  PART 1 commit "Propose purchase-order refoundation specification"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** architect review + explicit ratification of Part R.
  `REFUND-A` and every phase remain `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R DESIGN-GATE PATCH — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only patch (Opus 4.8 / high effort). Order chain: (1)
  "PART R RATIFICATION AUDIT" (read-only) → verdict
  `REQUIRES_SPEC_PATCH_BEFORE_RATIFICATION`; (2) "PART R DESIGN-GATE PATCH" —
  architect accepted the verdict and supplied design rulings 1–7. No
  implementation, no DB access, no production, no push, `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` refoundation, Part R design-gate correction.
- **Audit findings (accepted):** Part R had three flagged `DESIGN` alternatives
  (need-origin model; double-distribution enforcement; consolidation granularity)
  plus a UNIQUE-key defect, an opening-balance-vs-ledger contradiction, incomplete
  concurrency control (write skew), and a coexistence dual-write gap. Active-draft
  uniqueness and Class-D representability were passed as adequate.
- **Rulings applied (Part R patched, no alternatives remain):**
  - **R1 atomic need (Model A):** dropped `necessidade_compra_fio_origem` + rejected
    JSONB; each `necessidade_compra_fio` row carries its own origin
    (`origem_tipo`∈{op,pedido}, `op_id` set iff 'op'); no parent/child total
    invariant.
  - **R2 identity/granularity:** cotton = one need per (pedido, op, color); shared
    polyester = one per (pedido, color), `op_id` NULL; **NULL-safe separate partial
    unique indexes** (not one UNIQUE over nullable columns); recalculation
    reconciles the same logical need and is rejected if it would drop
    `kg_necessario` below `kg_alocado`. **64 needs unchanged.**
  - **R3 double-distribution:** single design — canonical `SECURITY DEFINER`
    allocation RPCs (direct DML revoked), trigger-maintained
    `necessidade.kg_alocado` cache with `CHECK (>=0 AND <=kg_necessario)`,
    `SELECT … FOR UPDATE` on the need row, INSERT/reversal coverage, deterministic
    lock order; the **T1/T2 write-skew race is documented and defeated**; bare-SUM
    and app-only designs rejected; drift is a blocking audit invariant.
  - **R4 Class-D:** constrained `legado_provenance` domain (CHECK) + table invariant
    `ordem_compra_no_native_anomaly` (native row cannot be rascunho+received);
    Class C has no header/provenance.
  - **R5 ledger + opening balance:** single ledger-derived model post-Phase-C, **no
    `kg_recebido_inicial`**; append-only ledger with `tipo`∈{recebimento,
    import_saldo_inicial, estorno}, `idempotency_key UNIQUE`, compensating negative
    `estorno`, no UPDATE/DELETE; no opening entry during REFUND-A (reads flat);
    8-step Phase-C cutover creates exactly one idempotent import entry per nonzero
    balance, reconciles, then revokes — no double-count.
  - **R6 over-receipt:** attributable = min(received, allocations); surplus =
    max(received − attributable, 0) → `saldo_fios`; idempotency/no-double-count
    fixed now.
  - **R7 coexistence authority (per dimension):** authority matrix per phase (admin
    → new at REFUND-B1; receipt → flat until Phase C; ledger after C); **one-to-one**
    compatibility mapping; flat admin columns are mirrors, not competing authority —
    **no equal-authority split-brain**; both flat receipt writers live until Phase C.
  - **Phase gates (R.17):** each phase states admin/receipt authority, bridge state,
    writers, rollback, entry/exit gates, migration-auth-required, UI-validation-
    required; no premature revoke, no unapproved production migration, no
    auto-authorization.
  - **Null-Pedido legacy edge (OP1/OP2):** `pedido_id` nullable-for-legacy (CHECK
    `necessidade_pedido_native`) so the 11 orphan rows import without a Pedido;
    native needs always have a Pedido (§R.10.7). Analogous to the ratified
    supplier-null exception; flagged for ratification.
- **Validation gates (all pass):** no `necessidade_compra_fio_origem`/JSONB origin
  store (only negated); one concurrency design; T1/T2 addressed; ledger derivation
  non-contradictory; idempotency + compensation present; coexistence authority per
  dimension; no REFUND-B1→C split-brain; Class-D representable; active-draft rule
  intact; **conversion remains 64/51/51/51**. Search for open-alternative language
  (`TBD`/`TODO`/`to decide`/`alternative`/`option`/`recommend`/`DESIGN:`) → **all
  matches in the superseded §0–§11** (ratified decisions / historical flat model);
  **none in Part R.**
- **Canonical reconciliation:** no material contradiction; the two known follow-ups
  (`PEDIDO_OP_SCHEMA_CONTRACT.md §6.2`, `DOCUMENTATION_INDEX.md` registration)
  remain **non-blocking documentation follow-ups**, not edited in this pass.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` docs-only; `§15` selective staging by
  literal path, one commit on `dev`, `.gitignore` untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force/`merge`/`tag`/`amend`; `§16` spec + state + this
  ledger; `§19` English. No DB access, no production, no prohibited-project access.
- **Record:** commit "Resolve purchase-order refoundation design gates"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** a **final read-only ratification audit** of the
  patched Part R; then architect ratification; then `REFUND-A`, its own order.
  `REFUND-A` remains `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R FINAL STRUCTURAL PATCH — PROPOSED / AWAITING RATIFICATION

- **Gate:** documentation-only patch (Opus 4.8 / high effort). Order chain: (1)
  "FINAL PART R RATIFICATION AUDIT" (read-only) → `REQUIRES_SPEC_PATCH_BEFORE_
  RATIFICATION`; (2) "PART R FINAL STRUCTURAL PATCH" — architect accepted the
  verdict and supplied structural rulings. No implementation, no DB access, no
  production, no push, `main` untouched.
- **Front:** `ORDEM-COMPRA-LIFECYCLE` refoundation, Part R final structural
  correction.
- **Audit findings (accepted):** design-gate patch was language-clean but had
  structural gaps — four material/origin combinations permitted where only two are
  native-canonical; NULL-pedido legacy uniqueness hole; missing legacy source-row
  identity; RPC-only OP/Pedido ownership; ledger sign/over-reversal unspecified;
  compatibility mapping prose-only; saldo stale-after-estorno. Class-D and
  active-draft uniqueness passed.
- **Rulings applied (Part R patched):**
  - **Legacy need identity (§2):** added `legado_origem_ordem_compra_fio_id`
    (NOT NULL iff legado; UNIQUE among legacy; source-row identity, **not**
    COALESCE/nullable-Pedido). Two historical rows sharing OP/material/color/
    supplier/state are not merged.
  - **Material/origin domain (§3):** `necessidade_material_origem` CHECK — exactly
    **two native combos** (cotton=OP-origin, polyester=Pedido-origin); **OP-origin
    polyester = legacy-only**; **Pedido-origin cotton forbidden** (native + legacy).
  - **Partial uniqueness (§4):** three separate indexes — native cotton
    `(pedido,op,cor)`, native shared polyester `(pedido,cor_poliester)`, legacy
    import `(legado_origem_ordem_compra_fio_id)`; no native index for OP-origin
    polyester / Pedido-origin cotton; legacy dedup by source row, not nullable-Pedido.
  - **Need write authority + ownership (§5):** revoke direct DML on
    `necessidade_compra_fio`; sole `SECURITY DEFINER` writers; constraint trigger
    enforcing `op_id → ops.lote_id → lotes.pedido_id = pedido_id` on every write
    regardless of caller (RPC-only insufficient); legacy exception carved.
  - **Allocation writer order (§6):** RPC (lock need `FOR UPDATE` → verify parent
    native active draft → mutate allocation) vs trigger (sole `kg_alocado`
    maintainer, does not touch allocation row) — no double-maintenance.
  - **Receipt ledger (§7-8):** sign CHECKs (`recebimento`/`import` kg>0,
    `estorno` kg<0 + `estorno_de_id` to a positive same-item entry); two-way
    append-only (`REVOKE UPDATE/DELETE` + mutation guard); partial/repeated
    reversals with `SUM(ABS(estornos)) <= original`, over-reversal rejected,
    cumulative `kg_recebido` cannot go negative; idempotency_key UNIQUE.
  - **Compatibility mapping (§9):** explicit `ordem_compra_item_compat_fio` table,
    two `UNIQUE` FKs (one-to-one both directions), immutable, `origem` ∈
    {imported_legacy, native_bridge}; creation timing per phase; Class C → no
    mapping; writers locate the flat row via the mapping, not inference.
  - **Opening import + recovery (§10):** one controlled maintenance window, fence
    verified by write-denial, one import entry per nonzero mapped balance
    (idempotency = mapping+item+cutover), **point of no return = first canonical
    receipt write after read switch**; before = rollback to flat; after =
    forward-only.
  - **Saldo reconciliation (§11):** event-derived `surplus_delta` per ledger entry;
    movement UNIQUE by (ledger entry, movement type); estorno → negative movement
    (stale surplus corrected); transactional/outbox; reconciles to derived surplus.
  - **Native receipt gate (§12):** receipt only when `emitida` + `status_aceite IN
    (nao_aplicavel,aceita)`; **receipt-before-issuance prohibited**; Class-D is a
    legacy import exception.
- **Validation gates (all pass):** source-row legacy identity; separate
  native/legacy uniqueness; two native combos only; OP-origin polyester legacy-only;
  Pedido-origin cotton forbidden; need DML revoked; ownership DB guard; sole
  `kg_alocado` maintainer; ledger sign + partial/over-reversal + non-negative
  cumulative + append-only; explicit mapping table + two-way uniqueness; Class C no
  mapping; bridge item mapped before receivable; idempotent import; cutover
  rollback + point-of-no-return; event-derived idempotent saldo; explicit receipt
  lifecycle states; **conversion remains 64/51/51/51**; **no open-alternative
  language in Part R** (the one `either` at the mapping-timing bullet is natural
  language; all other matches are in the superseded §0–§11).
- **Canonical reconciliation:** no material contradiction; the two documentation
  follow-ups (`PEDIDO_OP_SCHEMA_CONTRACT.md §6.2`, `DOCUMENTATION_INDEX.md`
  registration) remain **non-blocking** and untouched.
- **STRUCTURAL POLICY COMPLIANCE:** `§14` docs-only; `§15` selective staging by
  literal path, one commit on `dev`, `.gitignore` untouched/unstaged, no
  `add -A`/`reset`/`rebase`/force/`merge`/`tag`/`amend`; `§16` spec + state + this
  ledger; `§19` English. No DB access, no production, no prohibited-project access.
- **Record:** commit "Complete purchase-order refoundation structural contract"
  (`ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry).
- **Next authorizable action:** one final read-only verification of the patched
  structural clauses; then architect ratification; then `REFUND-A`, its own order.
  `REFUND-A` remains `NOT AUTHORIZED`.

## 2026-07-18 — ORDEM-COMPRA REFOUNDATION — Part R RATIFICATION CLOSEOUT — RATIFIED / ACCEPTED

- **Architect ruling:** Part R is `RATIFIED / ACCEPTED`. Acceptance baseline:
  `f2261ec`. The final read-only verification returned `RATIFIABLE` and found no
  migration-critical contradiction, omission, ambiguity, or unresolved choice.
- **Acceptance chain:** legacy diagnosis commit `de62b16`; initial proposed-spec
  commit `c49f369`; design-gate commit `c10e959`; final structural-contract commit
  and acceptance baseline `f2261ec`.
- **Conversion confirmed:** **64 needs / 51 headers / 51 items / 51 allocations**.
  Every header-bearing legacy source row remains 1:1; Class C remains needs-only.
- **Persistence ruling:** the four-layer Part R model is governing. Historical
  acceptance of old Phase `A` and `B1` is preserved; their flat persistence
  foundation is superseded, not erased.
- **Authorization boundary:** acceptance authorizes no implementation. No
  implementation has begun. `REFUND-A` remains `NOT AUTHORIZED` and requires its
  own architect order. A contemporaneous read-only production diagnosis remains a
  binding precondition before any production promotion or migration in this track.
- **Pending non-blocking documentation follow-ups:** update
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and register the refounded spec/diagnosis in
  `DOCUMENTATION_INDEX.md`; neither changes or blocks the ratified structural model.
- **Local instruction-file classification:** untracked root `AGENTS.md` was present
  before this closeout and is byte-identical to tracked `CLAUDE.md`, the authority-
  none agent-tooling pointer. It has no repository references or Git history,
  introduces no conflicting instruction, and was left untouched and uncommitted.
  Pre-existing `.gitignore` changes were also left untouched and unstaged.
- **Scope:** documentation-only closeout. Only the governing spec, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, and this append-only ledger were changed. No code, migration,
  database, production, prohibited project, push, or `main` action occurred.
- **Next authorizable action:** `REFUND-A`, by a separate explicit architect order.
  `REFUND-A` remains `NOT AUTHORIZED`.

---

## 2026-07-18 — REFUND-A PRE-ORDER STRUCTURAL CLARIFICATION — CLOSED / ACCEPTED

- **Links to:** the Part R RATIFICATION CLOSEOUT entry above (append-only correction
  trail; refines migration mechanics only, does not reopen the ratified model).
- **Gate:** CLOSED / ACCEPTED. Documentation-only. Baseline `dev @ 988cc9d`.
- **Context:** a REFUND-A pre-order reconciliation found canonical contradictions
  between Part R's earlier "clean re-point of empty event/ledger tables" language
  and the live flat writers (`emitir_ordem_compra_fio`/`cancelar_ordem_compra_fio`,
  db/66) that still write `ordem_compra_eventos` referencing `ordens_compra_fio`.
  The architect resolved the boundaries with seven rulings.
- **Ruling 1 — Event coexistence (additive dual-reference):** REFUND-A does NOT
  destructively re-point `ordem_compra_eventos`. Retain the legacy
  `ordens_compra_fio` reference; add a nullable `ordem_compra` reference; enforce
  exactly one purchase-order model per event; flat writers keep writing
  legacy-referenced events; REFUND-B1 switches admin writers; legacy reference
  removed only in a later authorized cleanup after reconciliation. No historical
  event rewritten or silently re-pointed.
- **Ruling 2 — Receipt-ledger coexistence (additive dual-reference):** REFUND-A does
  NOT destructively re-point `ordem_compra_fio_lancamentos`. Retain the legacy
  item/order reference; add nullable `ordem_compra_item_id`; enforce exactly one
  applicable parent; no opening-balance entries in REFUND-A; Phase C performs the
  final snapshot import, switches both receipt writers, makes the item ledger
  authoritative; legacy reference removed only after Phase-C reconciliation + a
  separate cleanup.
- **Ruling 3 — REFUND-A authority (schema-and-seed only):** create the four new
  layers + the compatibility mapping; seed the ratified 64/51/51/51 conversion; add
  the transitional event/ledger references; leave all live admin + receipt authority
  on `ordens_compra_fio`; switch no reader/writer; revoke no flat privilege; create
  no opening receipt balance.
- **Ruling 4 — Complete rollback:** restore the exact pre-migration schema/data
  state — drop the four new tables + the compatibility mapping table; remove ONLY
  the additive event/ledger columns/constraints/indexes/triggers/functions;
  preserve every original event/ledger column and legacy writer contract; prove
  `ordens_compra_fio` and all flat data byte/count equivalent to the pre-migration
  snapshot. No destructive transformation permitted in REFUND-A.
- **Ruling 5 — MCP capability:** canonical docs must not assert the configured MCP
  is both read-only and write-ready. Effective write capability UNKNOWN until
  runtime preflight; the future REFUND-A order must fingerprint the target as
  `ucrjtfswnfdlxwtmxnoo`, verify actual tool capability + DB role before any write;
  a read-only MCP or ambiguous target is a HARD STOP; production and
  `bhgifjrfagkzubpyqpew` remain prohibited.
- **Ruling 6 — Pedido ownership preflight:** the future REFUND-A order must run a
  read-only preflight verifying column existence/constraints, actual
  population/null counts, OP → lote → Pedido consistency, and whether OP1/OP2 remain
  unresolved legacy exceptions. Any result inconsistent with the ratified conversion
  is a HARD STOP before migration.
- **Ruling 7 — Current-state correction:** `PROJECT_STATE.md` no longer says phases
  await Part R ratification. Part R is `RATIFIED / ACCEPTED`; REFUND-A is blocked
  pending this structural clarification and its explicit migration order; no
  implementation has begun.
- **Files changed:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (header clarification banner; §R.3 event/ledger paragraph → additive dual-reference;
  §R.8 ledger parenthetical; §R.12 immutable-events reworded; §R.15 rollback boundary
  → complete rollback contract; §R.17 REFUND-A phase entry; §R.18 Flaw-4
  verification; new **§R.20** consolidating Rulings 1–7), `PROJECT_STATE.md`
  (current-state correction), `AGENT_HANDOFF.md` (new entry), and this ledger entry.
- **Scope discipline:** no change to plans, backlog, schema contract
  (`PEDIDO_OP_SCHEMA_CONTRACT.md`), documentation index, code, migrations,
  `.gitignore`, or `AGENTS.md`. No DB access, no implementation, no migration, no
  production, no prohibited-project access, no push, no `main` change.
- **Status after patch:** Part R historical acceptance preserved; structural
  clarification recorded; `REFUND-A` remains `NOT AUTHORIZED`.
- **Next authorizable action:** architect review of this clarification, then a
  separate REFUND-A migration order.

---

## 2026-07-19 — REFUND-A — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT ACCEPTANCE

- **Links to:** the `REFUND-A PRE-ORDER STRUCTURAL CLARIFICATION` entry above
  (§R.20 is the migration-boundary contract this implementation follows) and the
  Part R `RATIFICATION CLOSEOUT` entry (the governing model).
- **Gate:** `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT ACCEPTANCE` —
  not marked accepted by this entry. Baseline `dev @ 5fd94d8`; staging
  `ucrjtfswnfdlxwtmxnoo` only; no production access; no push.
- **Authorization chain:** `REFUND-A — EXECUTION ORDER` (schema-and-seed
  authorization) followed by `ARCHITECT RULING — CLEAR REFUND-A CONCURRENCY HARD
  STOP` (waiving the live two-session test for this phase only, substituting
  structural + sequential evidence, and registering
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`).
- **Credential-handling incident (recorded for the record):** mid-execution, the
  live T1/T2 concurrency test HARD-STOPPED because no available tooling channel
  could hold two independent database sessions open (`dblink` present but cannot
  self-connect without a password; MCP `execute_sql` cannot straddle a held-open
  transaction across calls). In response, plaintext database credentials
  (`admin@tapetes.test` / a password) were supplied directly in chat with
  instructions to use them for the test. **Declined** — entering passwords to
  authenticate is a standing prohibited action that does not lift on request, even
  when explicitly authorized and detailed. The credentials were never used, never
  echoed, never stored, and do not appear in this ledger, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, any commit, or any file. The architect subsequently issued
  the formal concurrency-gate waiver instead (no credential use required).
- **Preflights (all passed; full detail in `AGENT_HANDOFF.md`):** canonical
  reconciliation; git preflight (branch `dev`, HEAD `5fd94d8`, next slot `db/67`,
  `.gitignore`/`AGENTS.md` residue untouched); database target + capability
  preflight (fingerprint match, write-capable, transactional); legacy-corpus
  preflight (64/27/12/13/12, both history tables empty); Pedido-ownership
  preflight (11 null-Pedido rows all OP1/OP2, op→lote→pedido consistent
  elsewhere, OP36 = 4 distinct headers).
- **Migration:** `db/67_ordem_compra_refoundation_schema.sql`, 705 lines. Dry-run
  rehearsed in a rolled-back transaction first (zero residue confirmed before and
  after), then applied for real via `apply_migration`. **Technical commit:**
  `eb84071` ("Create purchase-order refoundation foundation"). **Staging
  migration-history identifier:** `20260719012036 /
  67_ordem_compra_refoundation_schema`.
- **Schema objects created:** the four Part R persistence layers
  (`necessidade_compra_fio`, `ordem_compra`, `ordem_compra_item`,
  `ordem_compra_item_alocacao`) with every ratified column, `CHECK`, partial
  unique index, RLS policy (admin-only `SELECT`), and grant (zero
  `authenticated`/`anon` DML — confirmed load-bearing: `public` schema default
  ACLs auto-grant full DML to `anon`/`authenticated`/`service_role` on new
  objects, so every `REVOKE ALL` in the migration is necessary, not defensive);
  `ordem_compra_item_compat_fio` (explicit one-to-one compatibility mapping,
  same grant posture); the `op→lote→pedido` ownership guard trigger on
  `necessidade_compra_fio`; the `kg_alocado` sole-cache-maintainer trigger on
  `ordem_compra_item_alocacao`; the canonical allocation RPC
  `alocar_necessidade_compra_fio` (`SELECT … FOR UPDATE`, granted to `postgres`
  only — no client role); the additive dual-reference transition on
  `ordem_compra_eventos` (legacy ref relaxed to nullable, `ordem_compra_id`
  added nullable, exactly-one-parent `CHECK`) and on
  `ordem_compra_fio_lancamentos` (same pattern plus the full ledger structural
  contract: `tipo`/`estorno_de_id`/`idempotency_key`/`origem_tipo`/`origem_ref`,
  sign `CHECK`, append-only guard trigger, estorno-relationship guard trigger).
- **Seed conversion by class (exact match to the ratified diagnosis):**

  | Class | Needs | Headers | Items | Allocations | Mappings |
  |---|---:|---:|---:|---:|---:|
  | A | 27 | 27 | 27 | 27 | 27 |
  | B | 12 | 12 | 12 | 12 | 12 |
  | C | 13 | 0 | 0 | 0 | 0 |
  | D | 12 | 12 | 12 | 12 | 12 |
  | **Total** | **64** | **51** | **51** | **51** | **51** |

  All 51 header-bearing needs fully self-allocated (`kg_alocado = kg_necessario`);
  13 Class-C needs unallocated (`kg_alocado = 0`).
- **OP36 result:** 4 distinct headers (rows 137/138/139/140, suppliers 4/5/22/22);
  rows 139/140 (both supplier 22, PRETO/BRANCO) confirmed **not merged**.
- **OP1/OP2 result:** 11 null-Pedido needs and headers (`op_id ∈ {1,2}`), each
  keyed by its unique `legado_origem_ordem_compra_fio_id` source-row identity, no
  duplication or collapse.
- **Compatibility mapping:** 51 `imported_legacy` rows, one-to-one in both
  directions (both `UNIQUE` constraints hold); Class C created none; the bridge
  is inactive (no live application path reads it).
- **Allocation concurrency result:** live two-session T1/T2 test **waived** by
  architect ruling (see above). Substitute evidence delivered: `SELECT … FOR
  UPDATE` catalog-proven in `alocar_necessidade_compra_fio`; the trigger proven
  the sole `kg_alocado` maintainer (full-`SUM` recompute on every
  INSERT/UPDATE/DELETE); `kg_alocado>=0`/`kg_alocado<=kg_necessario` CHECKs in
  place; sequential valid-allocation, over-allocation-rejection (against a
  genuinely full need, id 17, 860.100/860.100), and reversal-via-delete
  (40.000 → 0.000, never negative) all passed. **Debt:
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING`** — non-blocking here; HARD STOP before
  PRE-PROD activation, before any client grant on allocation RPCs, before any
  application writer call, before any production promotion involving
  allocation.
- **Negative constraint matrix — 21/21 correctly rejected** by the intended
  guard (native cotton/Pedido-origin and native polyester/OP-origin forbidden
  combos; native NULL-Pedido; mismatched OP/Pedido via the ownership guard;
  duplicate native cotton/shared-polyester needs; duplicate legacy source-row
  identity; legacy row without source reference; invalid Class-D provenance on
  a native row; second native active draft same Pedido+supplier; allocation
  over a genuinely full need; direct `authenticated` DML on
  `necessidade_compra_fio` and `ordem_compra_item_alocacao` — `permission
  denied`; event rows with both/neither parent; ledger row with both parents;
  invalid ledger sign). Two fixtures (native-polyester-OP-origin,
  duplicate-legacy-source-row) were corrected and re-run after an initial
  mismatched op/pedido test pairing caused them to trip the ownership guard
  before reaching their intended constraint — both then confirmed against the
  intended guard directly.
- **Append-only and reversal tests:** `UPDATE`/`DELETE` against
  `ordem_compra_fio_lancamentos` both rejected by the append-only guard trigger
  (fires regardless of caller). Estorno-relationship guard enforces
  same-parent, positive-source-only reversal. **Over-reversal magnitude** is a
  documented, intentional scope boundary — schema currently allows an estorno
  larger than its source entry because that quantity validation is Phase C's
  canonical-writer responsibility (Ruling 8), not a REFUND-A schema `CHECK`;
  verified this is the case (not a defect) rather than silently claimed as
  covered.
- **Existing flat-flow regression — all passed** (live RPC calls under a
  simulated real admin session via `request.jwt.claims`, rolled back):
  `emitir_ordem_compra_fio` succeeds unchanged (1 event, legacy-referenced,
  `ordem_compra_id` NULL); `cancelar_ordem_compra_fio` succeeds unchanged (2nd
  event); the OP-screen extended-select reader pattern resolves all 64 rows;
  the direct `kg_recebido` writer pattern (`registrarRecebimentoOrdemFio`/
  `screenFornecedorOrdens`) still succeeds unchanged.
- **Before/after flat-data equality:** `ordens_compra_fio` — 64 rows, **identical
  md5 row-fingerprint** (`e11babdaf6cc98bd3b688839a790b64d`) captured before the
  dry run, after the dry run's rollback, after the real apply, after the full
  negative-test matrix, after the regression matrix, and after the rollback
  rehearsal (six independent checkpoints, byte-identical every time).
- **Rollback rehearsal:** the complete rollback DDL executed for real inside a
  transaction — drop the four new tables + compat mapping + all 5 new
  functions; remove only the additive event/ledger
  columns/constraints/triggers; restore the original `NOT NULL` on both legacy
  references and the original `kg_recebido > 0` CHECK on the ledger. All **9**
  restoration checks passed (new objects absent; `ordem_compra_eventos`/
  `ordem_compra_fio_lancamentos` column sets byte-identical to pre-migration;
  both legacy references `NOT NULL` again; `ordens_compra_fio` byte/count
  -equivalent; both history tables still empty; db/66 RPCs survive untouched).
  The rehearsal transaction was then rolled back (rehearsal only), and a final
  state check confirmed the real committed migration remained fully intact
  (all 5 tables present, exact seed counts, unchanged fingerprint).
- **Structural policy compliance:** SQL migration, not a JS screen —
  `CODE_HEALTH_RULES.md` §7's line-count guidance targets app screens; the
  705-line single file is justified as one cohesive, transaction-scoped unit
  (§14 single-scope-per-phase — splitting an atomic seed transaction across
  files would be a correctness risk, not a health improvement). §9/§15/§16/§19
  followed. No JS/UI/Edge Function touched; no duplicated writer logic.
- **Files changed:** `db/67_ordem_compra_refoundation_schema.sql` (new,
  technical commit `eb84071`); `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this
  ledger entry (documentation commit, separate). No other file touched.
- **Scope discipline:** no application code, UI, Edge Function, plans/backlog,
  `PEDIDO_OP_SCHEMA_CONTRACT.md`, `DOCUMENTATION_INDEX.md`,
  `SUPERVISION_PROTOCOL.md`, diagnosis report, `.gitignore`, or `AGENTS.md`
  changed. No reader/writer cutover; no existing flat privilege revoked; no
  opening ledger balance created; no production access; no prohibited-project
  access; no push; no `main` change.
- **Remaining risks / debts:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (see above);
  the pre-existing non-blocking documentation follow-ups
  (`PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2, `DOCUMENTATION_INDEX.md`) carried over
  unchanged; a contemporaneous read-only production diagnosis remains a binding
  precondition before any production promotion in this track.
- **Status:** `REFUND-A` is `IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT ACCEPTANCE` — not marked accepted by this pass. `REFUND-B1` and
  every later phase remain `NOT AUTHORIZED`.
- **Next authorizable action:** architect acceptance of this implementation,
  then `REFUND-B1` by its own separate order.

---

## 2026-07-19 — REFUND-A — ARCHITECT ACCEPTANCE CLOSEOUT — CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT

- **Links to:** the `REFUND-A — IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT ACCEPTANCE` entry directly above (append-only — that entry's
  record of the implementation and its evidence stands unchanged; this entry
  records the architect's acceptance decision on top of it).
- **Gate:** `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`.
  Documentation-only closeout; no database access. Baseline `dev @ e1ae04e`.
- **Architect ruling:** REFUND-A is accepted. **Technical commit:** `eb84071`
  ("Create purchase-order refoundation foundation"). **Documentation commit:**
  `e1ae04e` ("Record REFUND-A staging verification"). **Staging
  migration-history identifier:** `20260719012036 /
  67_ordem_compra_refoundation_schema`. **Exact conversion:** **64 needs / 51
  headers / 51 items / 51 allocations / 51 compatibility mappings.**
- **Flat authority preserved:** administrative and receipt authority remain
  entirely on `ordens_compra_fio`; no reader or writer was switched by
  REFUND-A or by this acceptance. No production access. No push.
- **Live concurrency test — factual record:** the live two-session T1/T2
  interleave test was **not executed** in REFUND-A (architect-waived, since
  allocation is not activated as a business path in this phase). Accepted
  substitute evidence — all passed: catalog-proven `SELECT … FOR UPDATE` in
  the canonical allocation RPC; proof the trigger is the sole `kg_alocado`
  cache maintainer; the `kg_alocado>=0`/`kg_alocado<=kg_necessario` CHECKs;
  direct-DML denial to `authenticated`/`anon`; deterministic sequential tests
  (valid allocation, over-allocation rejection against a genuinely full need,
  reversal-via-delete never negative).
- **Debt `LIVE_ALLOCATION_T1_T2_TEST_PENDING` — does NOT block this
  acceptance.** It is a binding **HARD STOP** before, specifically:
  1. `PRE-PROD` activates purchase distribution;
  2. any authenticated business grant is added to the allocation RPCs;
  3. any application begins calling the allocation writer;
  4. any production promotion involving allocation.
- **New Phase-C activation obligation (this closeout, binding):** the
  canonical receipt writer must enforce the **remaining reversible quantity**
  for partial/repeated `estorno` reversals (§R.8 Ruling 8: `SUM(ABS(valid
  estornos)) <= original positive kg`) **before ledger authority is
  activated**. REFUND-A's append-only and estorno-relationship guards
  enforce shape/relationship (same parent, positive source, no self
  -reference) but not reversal **magnitude** — verified live during REFUND-A
  as an intentional, documented scope boundary (Phase C canonical-writer
  responsibility, not a REFUND-A schema `CHECK`), not a defect. Phase C's
  migration/RPC must close this obligation before the read/write switch to
  the ledger (§R.8's Phase-C cutover sequence).
- **Next phase authorization:** `REFUND-B1` is now the next authorizable
  phase but is **NOT authorized by this closeout** — it requires its own
  separate order. `PRE-PROD` and every later phase remain `NOT AUTHORIZED`.
- **Production diagnosis precondition unchanged:** a contemporaneous
  read-only **production** `ordens_compra_fio` diagnosis remains mandatory
  immediately before any production promotion/migration in this track;
  production remains `UNKNOWN for migration` and was not accessed by this
  closeout.
- **Documentation debts remain pending, unchanged:**
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 and `DOCUMENTATION_INDEX.md`.
- **Files changed (exactly four, per order):** `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry,
  `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (factual
  implementation-result annotation only — the ratified Part R contract text
  itself is unchanged; no append-only history rewritten).
- **Scope discipline:** no database access; no migration alteration; no
  application code; `.gitignore`/`AGENTS.md` untouched; no push; no `main`
  touch; `REFUND-B1` not begun.
- **Status:** `REFUND-A` is `CLOSED / ACCEPTED_WITH_BLOCKING_FUTURE_ACTIVATION_DEBT`.
- **Next authorizable action:** `REFUND-B1`, by its own separate architect
  order.

## 2026-07-19 — REFUND-B1-CONTRACT-R1 — NATIVE ADMIN AUTHORITY DESIGN CLOSURE — DOCUMENTED / AWAITING ARCHITECT ACCEPTANCE

- **Order:** `REFUND-B1-CONTRACT-R1 — NATIVE ADMIN AUTHORITY DESIGN CLOSURE`
  (Opus 4.8, high effort). **Type:** documentation-only architecture contract
  clarification. **Baseline:** `dev @
  6a1066e80f0f470f7355b7bb3f38c6438da59ee7`. **Staging:** `ucrjtfswnfdlxwtmxnoo`
  (read-only, no write this phase). **Production `gqmpsxkxynrjvidfmojk`,
  prohibited `bhgifjrfagkzubpyqpew`, `main`, push:** untouched. **REFUND-B1
  implementation: NOT AUTHORIZED.**
- **Purpose:** close the design gaps the accepted REFUND-B1 pre-order
  reconciliation surfaced (native draft-origination, native item + bridge,
  emit/cancel authority transition, read-model/UI ownership, native-data
  rollback, exact manifest + gates) before any `db/68` or application change is
  authorized.
- **Preflight (all confirmed, no material difference):** branch `dev`; HEAD
  `6a1066e`; worktree only the known pre-existing `M .gitignore` / `?? AGENTS.md`;
  `6a1066e` is a tip with no children (no later commit); staging read-only checks
  — `db/67` present (`20260719012036`), counts `64/51/51/51/51`,
  `ordem_compra_eventos`/`ordem_compra_fio_lancamentos` empty, no new-model
  business writer active, `alocar_necessidade_compra_fio` EXECUTE = false for
  every role, `emitir/cancelar_ordem_compra_fio` still flat, five new tables
  `SELECT`-only to `authenticated` with zero anon DML.
- **Decisive facts established (read-only):** `ordens_compra_fio.op_id` is
  **`NOT NULL`** (staging) — the schema basis for the bridge HARD STOPs; the
  frontend has **zero** references to any new-model table/RPC (greenfield client
  side); production carries `db/01→64` only (no db/65–67), so the app's existing
  `42703` fallback in `fetchOrdensCompraFio` is load-bearing and every REFUND-B1
  read-model/UI element must degrade the same way.
- **Contract written — `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` §R.21
  (`REFUND-B1-CONTRACT-R1`), verbatim determinations:**
  - **§R.21.5 origination (Option B):** ONE writer
    `adicionar_item_ordem_compra(p_pedido_id UUID, p_fornecedor_id BIGINT,
    p_material, p_cor_id, p_cor_poliester, p_kg_pedido)` create-or-get header +
    accumulate item atomically; advisory-lock on `(pedido,supplier)`; partial
    unique index backstop; supplier required; **no allocation, no needs, no
    event** (drafts unaudited; first event at emit); additive-not-idempotent
    (UI must gate double-submit); EXECUTE `authenticated` only.
  - **§R.21.6 item identity:** `(ordem_id, material, color)`; item layer is
    OP-free/need-free; may span multiple needs/OPs via future allocations;
    same material/color accumulates; quantity frozen at emission;
    allocation-sum reconciliation is PRE-PROD's.
  - **§R.21.7 bridge:** `criar_ponte_compat_ordem_compra_item(p_item_id)`
    internal-only, DEFINED but **granted to no role and never called in
    REFUND-B1** (activation = PRE-PROD, since the flat `op_id NOT NULL` needs
    allocation-derived provenance). Four §7 cases resolved: (1) single-OP cotton
    **representable**; (2) multi-OP cotton, (3) Pedido-origin polyester
    (`op_id` NULL), (4) multi-OP future allocations — **HARD STOP, never
    fabricate an OP; not flat-bridgeable; Phase-C native ledger only.** Recorded
    as a standing PRE-PROD hard stop.
  - **§R.21.8/§R.21.9 emit/cancel:** `emitir_ordem_compra`/
    `cancelar_ordem_compra` on `ordem_compra.id`; reject `legado=TRUE`; emit
    requires rascunho+supplier+≥1 item (no allocation required in REFUND-B1);
    freezes issuance snapshot; writes `ordem_compra_id` events
    (`ordem_compra_fio_id` NULL); administrative-only mirror to native_bridge
    shadows (no-op in REFUND-B1); received-quantity blocks cancel from Phase C;
    never deletes items/allocations/mappings/shadows/events; `SECURITY DEFINER`
    + `is_admin()` + EXECUTE `authenticated` only; explicit error codes.
  - **§R.21.10 coexistence:** `legado` discriminator; imported legacy inert;
    native RPCs reject legado; db/66 legacy RPCs stay for imported flat only and
    (PRE-PROD obligation) must reject native_bridge shadow rows; read model
    surfaces a native order once.
  - **§R.21.11 read model:** `SECURITY DEFINER` RPC pair
    `listar_ordens_compra_admin(p_pedido_id)` / `obter_ordem_compra_admin(p_ordem_id)`
    (not a view) — server-composed, excludes shadows, server-derived allowed
    actions + model discriminator, degrades via PGRST202.
  - **§R.21.12 UI:** dedicated `#/ordens-compra/:id` numeric route (NEW regex
    branch in `js/router.js` — no generic `:id` support exists), `#/ordens-compra`
    list + `ADMIN_MENU` entry, `screenOrdemCompra(id)` on the `pedido-detail.js`
    template, emit/cancel as actions **on the dedicated screen**;
    `buildOrdensReaderSection` demoted to summary + "ver ordem" link with inline
    actions removed. **Pulls the former "B2" dedicated screen into REFUND-B1**
    (admin authority can't be exposed governance-compliantly from a
    reader/modal); B2 residual = supplier-assignment relocation + Phase-C receipt
    UI.
  - **§R.21.13 rollback:** routing/authority, **non-destructive** — revert app
    admin writes to flat, revoke native-writer EXECUTE, retain all native
    rows/events/mappings/shadows, retained rows go inert/read-only; never delete
    or fabricate reverse events.
  - **§R.21.14 naming drift:** accepted the **installed** name
    `alocar_necessidade_compra_fio(p_item_id, p_necessidade_id, p_op_id, p_kg)`
    as canonical for future PRE-PROD; §R.4's `alocar_necessidade(...)` prose
    corrected-on-naming; REFUND-B1 creates no alias, grants nothing.
  - **§R.21.15 ACL:** all writers `SECURITY DEFINER`+`is_admin()`+EXECUTE
    `authenticated`; bridge granted to no role; no new-model client DML; **must
    not** reproduce the `ordens_compra_fio` anon table-`UPDATE` gap (REFUND-A's
    tables have zero anon DML — hold that bar); no allocation grant; no receipt
    change.
  - **§R.21.16 manifest (exact, no "and related files"):** `db/68_ordem_compra_native_admin.sql`;
    six RPCs; new screens `ordens-compra-list.js` / `ordem-compra.js` /
    `ordem-compra-data.js` (+ optional `-render.js`/`-events.js`); edits to
    `js/router.js`, `js/boot.js`, `js/screens/common.js`, `js/screens/op-nova.js`,
    `index.html`; tests `tests/ordem-compra.smoke.js` + a DB writer matrix +
    `op-nova.smoke.js` additions; closeout docs; **`PEDIDO_OP_SCHEMA_CONTRACT.md`
    §6.2 corrected in this phase**.
  - **§R.21.17 matrix:** full DB / legacy-regression / UI gates incl.
    no-allocation-activation, exactly-one-parent events, bridge HARD-STOP
    assertions, and graceful degradation on a db without db/65–67.
- **§6.2 correction:** `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 INSUMOS row +
  refoundation note — `ordens_compra_fio` is now a **per-dimension** authority
  (admin → `ordem_compra` at REFUND-B1; receipt stays flat until Phase C), no
  longer a stale sole-authority contract; closes the standing §6.2 documentation
  debt.
- **Remaining hard stops (design, for the future REFUND-B1 order):** the bridge
  multi-OP/polyester non-representability (§R.21.7) is a **PRE-PROD** hard stop,
  not a REFUND-B1 blocker; migration `db/68` is its own separate gate; UI
  validation mandatory; canonical staging-vs-development naming for
  `ucrjtfswnfdlxwtmxnoo` is inconsistent across tracks (this order labels it
  "staging"; `PROJECT_STATE.md` labels it the "development database") — noted, not
  resolved here.
- **STRUCTURAL POLICY COMPLIANCE (`CODE_HEALTH_RULES.md`):** docs-only, so the
  implementation-report `STRUCTURAL POLICY COMPLIANCE` obligation (§3 of
  `SUPERVISION_PROTOCOL.md`, "not docs-only") does not strictly apply; recorded
  anyway — §14 (single scope: one documentation design-closure), §15 (Git:
  selective staging by literal path, one docs commit on `dev`,
  `.gitignore`/`AGENTS.md` left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force/`merge`/`tag`/`amend`), §16 (docs updated: spec + contract + state +
  handoff + this ledger), §19 (English). No code, no migration, no test file
  touched.
- **Files changed (exactly five):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (banner pointer + new §R.21), `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`
  (§6.2), `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** no DB write; no migration applied/altered; no application
  code; no test; `.gitignore`/`AGENTS.md` untouched; no push; no `main`; no
  production; prohibited project not accessed.
- **Status:** `REFUND-B1-CONTRACT-R1` is `DOCUMENTED / AWAITING ARCHITECT
  ACCEPTANCE`. **REFUND-B1 implementation remains `NOT AUTHORIZED`.**
- **Next authorizable action:** architect acceptance of this contract, then a
  separate `REFUND-B1` implementation order.

## 2026-07-19 — REFUND-B1-CONTRACT-R2 — ACTIVATION-BOUNDARY CORRECTION — DOCUMENTATION GATE (commit 1 of the R2 implementation order)

- **Order:** `REFUND-B1-CONTRACT-R2 + REFUND-B1 IMPLEMENTATION ORDER` (Opus 4.8,
  high effort). **Baseline:** `dev @ 39d35f7`. **This entry = the docs-only R2
  correction (order §12).** R1 (§R.21) was **`NOT ACCEPTED AS WRITTEN`.**
- **Three defects corrected (architect findings, order §1):**
  1. **emission without allocation** — R1 §R.21.8 allowed emitting a native order
     with items but no allocations; allocations carry immutable need/OP provenance,
     so such an order could never acquire provenance later.
  2. **non-idempotent item writer** — R1 §R.21.5 `adicionar_item_ordem_compra` was
     additive and leaned on UI double-submit gating (not an idempotency mechanism).
  3. **premature incomplete bridge** — R1 §R.21.7's bridge could not represent
     Pedido-origin polyester / multi-OP items without fabricating an `op_id`.
- **Binding R2 boundary (order §2):** REFUND-B1 activates **native draft
  administrative authority, not native emission authority.** ACTIVE = create/obtain
  draft, define absolute item qty, edit/remove draft items, cancel draft, list,
  dedicated screen. INSTALLED-INACTIVE = emission RPC (no client grant) + disabled
  emit UI. NOT CREATED = compatibility bridge. INACTIVE = allocation writer, receipt
  ledger, native receipt path, flat shadows. Native emission activates only in
  PRE-PROD after `LIVE_ALLOCATION_T1_T2_TEST_PENDING` is resolved + full allocation
  is possible + the precondition is provable against real allocations.
- **Contract determinations recorded (spec §R.22.3–§R.22.13):**
  - `definir_item_ordem_compra(p_pedido_id UUID, p_fornecedor_id BIGINT, p_material,
    p_cor_id, p_cor_poliester, p_kg_pedido)` — **absolute, idempotent** (sets
    `kg_pedido`, never increments; same args → same state); create-or-get single
    active draft; create-or-update the `(material,color)` item; no allocation/need/
    OP/event; only `rascunho` mutable; advisory lock + partial-unique backstop;
    `SECURITY DEFINER`/`is_admin()`/EXECUTE `authenticated` only; return
    `{ok,codigo,ordem_compra_id,ordem_compra_item_id,criado_ordem,criado_item,
    kg_pedido_final}`.
  - `remover_item_ordem_compra(p_item_id)` — draft-only; reject legado / emitted /
    cancelled / **allocations-exist**; delete only the item; never the parent; no
    event; same ACL.
  - `emitir_ordem_compra(p_ordem_id)` — **installed, granted to no role** (owner-only
    for rollback-safe tests); rejects unless native + rascunho + supplier + ≥1 item +
    every item ≥1 allocation + `SUM(active alloc)=item.kg_pedido` + Pedido-ownership +
    material/color identity + acceptance snapshot freezable; on success freezes
    issuance, sets states atomically, one `ordem_compra_id` event (`ordem_compra_fio_id`
    NULL), never fabricates OP provenance, never creates a flat shadow;
    post-emission immutability holds by construction (draft writers reject non-rascunho;
    allocation writer ungranted).
  - `cancelar_ordem_compra(p_ordem_id)` — **active** for drafts (rascunho→cancelada,
    retains items, one `ordem_compra_id` event, repeat-cancel rejected, terminal);
    emitted-order cancel deferred to PRE-PROD/Phase C.
  - **No bridge** — debt `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`
    registered; PRE-PROD decides single-OP-bridgeable vs native-ledger-only from real
    allocations.
  - Read model `listar_ordens_compra_admin(p_pedido_id UUID)` /
    `obter_ordem_compra_admin(p_ordem_id BIGINT)` — server-composed, native+legacy
    once each, server-derived actions (`editar_itens/remover_itens/cancelar=true`,
    `emitir=false` + `bloqueio_emissao='distribuicao_necessidades_pendente'`,
    `receber=false`); `SECURITY DEFINER`/EXECUTE `authenticated` only.
  - Dedicated screen: 5 files (`ordens-compra-list.js`, `ordem-compra.js`,
    `ordem-compra-data.js`, `ordem-compra-render.js`, `ordem-compra-events.js`),
    routes `#/ordens-compra` + `#/ordens-compra/:id`; `op-nova.js` net-reduced to
    summary + "Ver ordem" link (inline emit/cancel removed).
  - Migration `db/68_ordem_compra_native_draft_admin.sql`; no bridge / allocation
    grant / receipt-ledger activation / flat shadow / opening balance / unrelated
    table change.
- **`PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2** refined to R2 (native draft admin →
  `ordem_compra` at REFUND-B1; native emission deferred to PRE-PROD; receipt flat
  until Phase C; no native receipt path / shadow yet).
- **STRUCTURAL POLICY COMPLIANCE:** docs-only (§3 report obligation N/A); §14
  single scope (one correction), §15 selective staging (5 files, `.gitignore`/
  `AGENTS.md` untouched), §16 docs updated, §19 English.
- **Files changed (exactly five):** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`
  (banner + §R.22), `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md` (§6.2),
  `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** no DB write, no migration, no application code, no test, no
  push, no `main`, no production, prohibited project not accessed.
- **Conditional continuation (order §13):** after this commit, its diff is
  self-inspected against the order; if exact, implementation proceeds immediately
  under the same order (no further architect message). `PRE-PROD` remains
  `NOT AUTHORIZED`.

## 2026-07-19 — REFUND-B1 — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT VISUAL VALIDATION AND ACCEPTANCE

- **Order:** `REFUND-B1-CONTRACT-R2 + REFUND-B1 IMPLEMENTATION ORDER` (Opus 4.8,
  high effort). **Baseline:** `dev @ 39d35f7`. **Staging:** `ucrjtfswnfdlxwtmxnoo`
  only. **The R2 documentation gate (commit `231f17a`) passed exactly** (§13
  self-check confirmed all mandated terms + exactly five docs + no
  `.gitignore`/`AGENTS.md`), so implementation proceeded under the same order.
- **Commits:** `231f17a` (R2 docs correction), `82f6247` (migration), `d4d7533`
  (application + tests), + this closeout. **No production, no push, no `main`,
  prohibited project not accessed.**
- **Migration — `db/68_ordem_compra_native_draft_admin.sql`** (staging
  migration-history id `20260719025055 / 68_ordem_compra_native_draft_admin`).
  Objects (exactly the authorized set, §R.22.13): `definir_item_ordem_compra`
  (create-or-get single active draft + create-or-update unique (material,color)
  item, **ABSOLUTE idempotent** quantity, advisory-locked, no allocation/event),
  `remover_item_ordem_compra`, `cancelar_ordem_compra` (draft rascunho→cancelada),
  `listar_ordens_compra_admin` / `obter_ordem_compra_admin` (server-composed read
  model, native+legacy each once, server-derived `acoes`), and
  `emitir_ordem_compra` **installed but granted to NO client role** (full-allocation
  precondition: every item ≥1 allocation + `SUM(active alloc)=kg_pedido` + Pedido
  ownership + material/color identity; owner-only for rollback-safe tests) + two
  partial unique indexes (`ordem_compra_item_unico_algodao/_poliester`) backing the
  idempotent writer. All client RPCs `SECURITY DEFINER` + internal `is_admin()` +
  EXECUTE `authenticated` only, `PUBLIC`/`anon`/`service_role` revoked. **No bridge
  RPC, no `native_bridge` rows, no flat shadow, no allocation grant, no receipt
  change** (verified live).
- **DB test matrix (§16, all rolled-back BEGIN…ROLLBACK; admin session via
  `SET LOCAL request.jwt.claims`):** first-draft creation; reuse of the active
  (pedido,supplier) draft; **absolute-quantity idempotency** (repeat same call →
  `criado_*=false`, kg unchanged, no increment); quantity replacement (100→150, not
  250); same/different material-color item; cancelled and emitted orders NOT reused
  (new draft); invalid pedido/supplier; invalid material/color combos; zero/negative
  qty; legacy-header mutation rejection (cancel/emit/remove → `ordem_legado`); item
  removal; removal-with-allocation rejected (`possui_alocacao`); draft cancel; repeat
  -cancel rejected (`estado_invalido`); event carries `ordem_compra_id` only
  (`ordem_compra_fio_id` NULL); **emission rejected with no allocations
  (`alocacao_incompleta`) and partial allocations, succeeding only in an owner-only
  fully-allocated fixture** (event `emitida`, `ordem_compra_id`); incoherent-
  allocation rejected (`alocacao_incoerente`); post-emission immutability (definir →
  new draft; remove/cancel on emitted → `estado_invalido`); ACL — `authenticated`
  runtime-executes definir (SECURITY DEFINER writes as owner) but is **denied
  `emitir`** (function-priv false + runtime `insufficient_privilege`), `anon`/
  `service_role` cannot execute the new RPCs, no direct `authenticated`/`anon` table
  DML on `ordem_compra`/`ordem_compra_item`, `alocar_necessidade_compra_fio` ungranted,
  no bridge object, zero `native_bridge` rows. Persistent state unchanged after all
  tests (headers 51, items 51, allocations 51, events 0, needs 64).
- **Legacy regression (§17, rolled-back live):** flat `cancelar_ordem_compra_fio(1)`
  → ok (emitida→cancelada); flat `emitir_ordem_compra_fio` still enforces its
  contract; direct `kg_recebido` write path (registrarRecebimentoOrdemFio /
  screenFornecedorOrdens) works (1024.8→123.4); OP-screen extended-select reader
  resolves the dimension columns. **`ordens_compra_fio` fingerprint
  `eb26d39316e7fb4a5f4b46c8a99631b3` byte-identical before and after** (64 rows).
  Existing ACL debts (`KG-RECEBIDO-ACL-GAP`, `ANON-GRANT-DEFENSE-IN-DEPTH`)
  unchanged, not expanded.
- **Application (`d4d7533`):** five screen files —
  `js/screens/ordem-compra-data.js` (102), `ordem-compra-render.js` (242),
  `ordem-compra-events.js` (233), `ordens-compra-list.js` (43), `ordem-compra.js`
  (51); routing/nav — `js/router.js` (numeric `#/ordens-compra/(\d+)` regex branch),
  `js/boot.js` (`#/ordens-compra` route), `js/screens/common.js` (`ADMIN_MENU` entry
  + icon), `index.html` (five cache-busted script tags); `js/screens/op-nova.js`
  net-reduced 1548→1503 (reader = compact summary + "Ver ordens de compra" link;
  inline emit/cancel handlers + SVGs removed). res.data.ok + PGRST202 handling
  throughout (graceful degradation on a db without db/68).
- **UI validation (§20, staging-served app at `localhost:8765`, stubbed data —
  admin auth not entered, per prohibited-action policy):** `#/ordens-compra` list
  renders the native and imported-legacy orders **each once** with model
  discriminator, status, item count, and "Ver ordem"; `#/ordens-compra/:id` native
  draft renders items with **Editar/Remover**, **Adicionar item**, **Cancelar
  ordem**, and a **disabled Emitir** whose title/notice is *"Emissão disponível após
  a distribuição de necessidades (etapa PRE-PROD)"* (`disabled=true`, no click
  handler); imported-legacy detail is **read-only** (no add/edit/remove/cancel,
  Emitir disabled, "inerte no novo modelo" note); no console errors. Screenshots
  timed out in this environment; evidence captured via text-DOM inspection
  (get_page_text + button-state introspection). Architect visual acceptance remains
  required before final closure.
- **Rollback rehearsal (§21, rolled-back):** revoking EXECUTE on the five active
  client RPCs makes them inert (`authenticated` false) while **retaining all native
  data** (64/51/51/51, events 0); dropping the six db/68 functions + two indexes
  leaves db/67 fully intact (four layers + compat + `alocar_necessidade_compra_fio`
  all present, `ordens_compra_fio` 64). Rehearsal rolled back; db/68 confirmed still
  live afterward (6 functions, correct grants).
- **Test suite (§R):** full `node --test tests/*.js` = **3871 tests, 3739 pass, 132
  fail**; diff vs the committed baseline (3863/3731/**132**) = **zero net-new
  failures** — the 132 are pre-existing (stale http.server/index.html-inline-script
  suites). `tests/ordem-compra.smoke.js` 10/10; `tests/op-nova.smoke.js` 81/81
  (retired the two obsolete OP-screen emit/cancel tests). `node --check` clean on all
  new/changed JS.
- **STRUCTURAL POLICY COMPLIANCE (`CODE_HEALTH_RULES.md`):** **§7 (size)** — five
  new screen files 43–242 lines, all within the ≤250 ideal; `op-nova.js` is the
  accepted frozen exception and this change is **net-reductive** (1548→1503);
  `db/68` 575 lines is one cohesive transaction-scoped migration (§14 single-scope,
  same justification as db/65/67). **§4/§3** — the new `#/ordens-compra/(\d+)` branch
  is a hand-written regex in `router.js` (the engine has no generic `:id`), route
  registration in `boot.js`, no OP/Supabase logic in the router. **§9 (writes)** —
  all new persistence is behind db/68 SECURITY DEFINER RPCs called from
  `ordem-compra-events.js`; no `insert/update/delete` inside render functions; each
  writer declares table/op/payload/error-behavior; atomicity noted (get-or-create +
  item under one advisory-locked call). **§10 (reads)** — the read model is a
  dedicated RPC pair, not a client join. **§12 (cache-busting)** — five new scripts
  carry `?v=20260719-refund-b1`, before `boot.js`, no `?v=` on CDNs. **§13/§20
  (tests)** — new smoke suite via the shared `_doubles.js` FaithfulNode (boolean-attr
  fidelity), business-rejection (`res.data.ok`) asserted, full suite run + baseline
  compared. **§15 (git)** — selective staging by literal path, four commits on `dev`,
  `.gitignore`/`AGENTS.md` left untouched/unstaged, no `add -A`/`reset`/`rebase`/
  force/`merge`/`tag`/`amend`. **§16 (docs)** — spec §R.22 + this closeout.
  **§19 (language)** — English code/comments/commits; pt-BR UI strings.
  **Forced coupling recorded (beyond §19's two named test files):** the §11-required
  nav additions (route + `ADMIN_MENU` entry) necessitated mechanical menu/route-count
  fixture syncs in `tests/boot.smoke.js` (route count 21→22),
  `tests/screens-common.smoke.js` (`EXPECTED_ADMIN_MENU` +1),
  `tests/cadastros-screens.smoke.js` and `tests/documentos-recebidos.smoke.js`
  (menu-links 11→12). No test logic changed; these mirror the app menu and would
  otherwise be false-red. Flagged for architect awareness.
- **Files changed:** `db/68_ordem_compra_native_draft_admin.sql` (new);
  `js/screens/ordem-compra-data.js`, `ordem-compra-render.js`,
  `ordem-compra-events.js`, `ordens-compra-list.js`, `ordem-compra.js` (new);
  `js/router.js`, `js/boot.js`, `js/screens/common.js`, `js/screens/op-nova.js`,
  `index.html` (modified); `tests/ordem-compra.smoke.js` (new);
  `tests/op-nova.smoke.js`, `tests/boot.smoke.js`, `tests/screens-common.smoke.js`,
  `tests/cadastros-screens.smoke.js`, `tests/documentos-recebidos.smoke.js`
  (modified); `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, this ledger entry (closeout).
- **Open future debts / blocked actions:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING`
  (HARD STOP before allocation activation); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`
  (PRE-PROD must decide single-OP-bridgeable vs native-ledger-only, never fabricate an
  OP); **active native emission deferred to PRE-PROD**; **native receipt authority
  deferred to Phase C**; a contemporaneous read-only **production** diagnosis remains
  mandatory before any production migration. **`PRE-PROD` is `NOT AUTHORIZED`.**
- **Status:** `REFUND-B1` is `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT
  VISUAL VALIDATION AND ACCEPTANCE`. **Next authorizable action:** architect visual
  validation + acceptance, then a separate `PRE-PROD` order.

## 2026-07-19 — REFUND-B1 — ARCHITECT ACCEPTANCE CLOSEOUT — CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES

- **Links to:** the `REFUND-B1 — IMPLEMENTED / VERIFIED IN STAGING / AWAITING
  ARCHITECT VISUAL VALIDATION AND ACCEPTANCE` entry directly above (append-only —
  that entry's record of the implementation and its evidence stands unchanged;
  this entry records the architect's acceptance decision on top of it).
- **Gate:** `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES`. Documentation-only
  closeout; no database access. Baseline `dev @ 7a2c04c`.
- **Architect ruling:** REFUND-B1 is accepted. **Technical commits:** `231f17a`
  (Correct REFUND-B1 activation boundaries), `82f6247` (Add native purchase-order
  draft administration), `d4d7533` (Add dedicated native purchase-order
  administration), `7a2c04c` (Record REFUND-B1 staging verification). **Staging
  migration:** `20260719025055 / 68_ordem_compra_native_draft_admin`.
- **Visual qualification — `ACCEPTED`.** The architect reviewed the supplied
  contact sheet. Accepted findings: dedicated purchase-order list and entity
  screens; native/legacy distinction; item editing confined to the dedicated
  entity; action-only cancellation modal; native emission visibly disabled with
  PRE-PROD explanation; OP screen reduced to contextual summary and navigation;
  no duplicate native/flat-shadow representation; desktop and tablet layouts
  acceptable.
- **Out-of-manifest test fixture synchronization — `QUALIFIED / ACCEPTABLE`.**
  The changes in `tests/boot.smoke.js`, `tests/screens-common.smoke.js`,
  `tests/cadastros-screens.smoke.js`, `tests/documentos-recebidos.smoke.js` are
  accepted as mechanical, coverage-preserving synchronization caused by the new
  route, menu entry, and screen registration. No assertion weakening or
  unrelated behavioral change was identified.
- **Non-blocking UI debt — `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.** The
  390px evidence shows severe content compression caused by the pre-existing
  fixed-width administrative sidebar. This is app-wide; not introduced by
  REFUND-B1; non-blocking for REFUND-B1 acceptance; **not authorized for
  correction in this closeout**. Must be handled as a separate global UI phase,
  not as an ordem-compra-specific patch.
- **Future blocking gates (binding, restated):**
  1. `LIVE_ALLOCATION_T1_T2_TEST_PENDING` — blocks allocation business
     activation; authenticated allocation grants; application allocation
     calls; production promotion involving allocation.
  2. `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` — blocks flat
     receipt shadows that require fabricated or arbitrary `op_id`; native
     receipt routing through legacy writers for shared-polyester or multi-OP
     items.
  3. **Native emission** — remains inactive and ungranted. Activation belongs
     to PRE-PROD only, after: allocation activation is valid; live concurrency
     evidence passes; every item is fully reconciled to allocations; emission
     preconditions pass.
  4. **Native receipt authority** — remains deferred to Phase C.
  5. **Production** — a contemporaneous read-only production diagnosis
     remains mandatory before any production migration or promotion.
- **B2 residual scope** (per-order supplier-assignment relocation off the OP
  screen; Phase-C receipt UI wiring) remains governed by the updated canonical
  plan (this closeout + §R.22).
- **Next phase authorization:** `PRE-PROD` is now the next authorizable phase
  but is **NOT authorized by this closeout** — it requires its own separate
  order.
- **Production diagnosis precondition unchanged:** production remains
  `UNKNOWN for migration` and was not accessed by this closeout.
- **Files changed (exactly four, per order):** `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry, `docs/architecture/
  ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` (new §R.22.18 acceptance record +
  banner update — no ratified rule/column/constraint/gate rewritten; no
  append-only history rewritten).
- **Scope discipline:** no database access; `db/68` unmodified; no application
  code; no test changed; `.gitignore`/`AGENTS.md` untouched; no push; no `main`
  touch; `PRE-PROD` not begun.
- **Status:** `REFUND-B1` is `CLOSED / ACCEPTED_WITH_RECORDED_FUTURE_GATES`.
- **Next authorizable action:** `PRE-PROD`, only by its own separate architect
  order.

## 2026-07-19 — PRE-PROD-A-R1 — NATIVE ALLOCATION CONTRACT — DOCUMENTATION GATE (commit 1 of the PRE-PROD-A implementation order)

- **Order:** `PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY`
  (Opus 4.8, high effort). Mode: binding contract closure followed by conditional
  staging implementation.
- **Baseline:** `dev @ 51f31dd` (REFUND-B1 accepted). Required ancestors
  `7a2c04c`/`39d35f7`/`6a1066e`/`988cc9d` present; no later commit; worktree only
  `M .gitignore` + `?? AGENTS.md` (untouched); migration slot `db/69` free.
- **Gate:** documentation-only contract closure (order §5). No `db/69`, no
  application code, no test change in this commit.
- **Staging preflight (read-only):** reached via the pre-configured
  `supabase-legacy` MCP connection; fingerprint matched the declared staging state
  exactly — `ordens_compra_fio`=64, native `64/51/51/51/51`, receipt ledger +
  `ordem_compra_eventos` empty, `alocar_necessidade_compra_fio` present. (Project
  ref is not SQL-exposable; identity rests on the pre-configured connection + exact
  fingerprint.)
- **§8 authoritative need formula — PROVEN:** an in-SQL replica of
  `js/calculo-op.js` (`calcularFiosOP` + `montarOrdensCompraFio`) — cotton
  `algodao_por_ml·valor_x·Σ metros_pedidos` dual-added to `cor_1_id`/`cor_2_id`
  (incl. double-add when equal), polyester `poliester_por_ml·valor_x·Σ metros`,
  `round3`, `>0`, restricted to eligible OP states `aberta`/`em_producao`
  (`tecelagem`; latex excluded) — reproduced the live 64-row flat corpus with **0
  unmatched keys and 0.000 kg drift**. The §8 hard stop is cleared; full fixture
  parity re-runs at db/69 authoring.
- **Contract recorded:** `ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md` **§R.23**
  (phase split + emission-after-Phase-C sequence; Pedido regime
  `pedido_compra_fio_regime` + `resolver_regime_compra_fio_pedido`; persistirOP
  cutover; authoritative need source; `avaliar`/`sincronizar` need RPCs; absolute
  idempotent allocation + uniqueness; `remover_alocacao_compra_fio`; post-emission
  DB backstop; `obter_distribuicao_ordem_compra` + block reasons; emission stays
  inactive; dedicated UI + no new route; `db/69` manifest + ACL; T1/T2 mechanism +
  grant-activation order; rollback; debts). Cross-recorded in `PROJECT_STATE.md`
  (active-phase bullet), `AGENT_HANDOFF.md` (top continuity bullet),
  `PEDIDO_OP_SCHEMA_CONTRACT.md` §6.2 note, and
  `PEDIDO_PRODUCTION_FLOW_BACKLOG.md` (update log).
- **Files changed:** `docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md`,
  `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`,
  `docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md`, `PROJECT_STATE.md`,
  `AGENT_HANDOFF.md`, this ledger entry.
- **Scope discipline:** documentation-only; no `db/69` yet; no application code; no
  test change; `.gitignore`/`AGENTS.md` untouched; no push; no `main` touch;
  production (`gqmpsxkxynrjvidfmojk`) and prohibited (`bhgifjrfagkzubpyqpew`) not
  accessed.
- **Open future debts / blocked actions:**
  `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (closed only by the real authenticated
  two-session test, still pending); `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`;
  native emission inactive/ungranted; native receipt deferred to Phase C;
  production diagnosis precondition; `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
- **Status:** `PRE-PROD-A-R1` contract is `CLOSED`; implementation is
  `AUTHORIZED (CONDITIONAL) / STAGING PENDING`.
- **Next authorizable action:** the PRE-PROD-A implementation half under the same
  order — author + apply `db/69` to staging, owner + authenticated negative tests,
  the live T1/T2 concurrency test (needs a Kleber-logged-in staging admin browser
  session), the dedicated distribution UI, visual evidence, and closeout. Native
  emission, native receipt, `PRE-PROD-B`, and `Phase C` remain `NOT AUTHORIZED`.

## 2026-07-19 — PRE-PROD-A-R1 — DB FOUNDATION APPLIED + OWNER-TESTED / APP AUTHORED — SESSION CHECKPOINT (commits 2-3 of the implementation order)

- **Order:** `PRE-PROD-A-R1 — NATIVE NEEDS, ALLOCATION AND LIVE CONCURRENCY` (Opus 4.8).
  This is a mid-phase session checkpoint, not an acceptance; recorded because the next
  atomic block (live T1/T2) needs a browser session unavailable this session.
- **Commits:** `4ffd674` (Add native need and allocation foundation), `2bcacac` (Add
  native purchase-order distribution UI). Baseline `dev @ 51f31dd`; HEAD `2bcacac`.
- **Migration:** `db/69_ordem_compra_preprod_allocation.sql` **APPLIED to staging
  `ucrjtfswnfdlxwtmxnoo`** (Supabase migration history `69_ordem_compra_preprod_allocation`).
  Complete/self-consistent; safe to leave applied. Objects: `pedido_compra_fio_regime` +
  immutability guard + `resolver_regime_compra_fio_pedido`; `avaliar`/`sincronizar_necessidades_compra_fio`;
  hardened absolute `alocar_necessidade_compra_fio` + identity uniqueness index;
  `remover_alocacao_compra_fio`; post-emission item/allocation mutation guards;
  `obter_distribuicao_ordem_compra` + read-model block-reason replacements. ACL: all 8
  client RPCs SECURITY DEFINER + is_admin(), EXECUTE authenticated only; `emitir_ordem_compra`
  ungranted (emission inactive); no bridge, no flat shadow, no receipt/ledger activation.
- **§8 need formula:** proven — SQL replica of `calcularFiosOP`/`montarOrdensCompraFio`
  reproduced the 64-row flat corpus with 0 unmatched keys and **0.000 kg drift** (eligible
  aberta/em_producao tecelagem OPs).
- **DB test matrix (§23):** all pass (regime; need assessment incl. idempotent/absolute-update/
  obsolete-delete/parity; allocation incl. absolute/idempotent/over-allocation/coherence/
  cache=SUM/removal; read model incl. block reasons + poly OP attribution; ACL; sync-conflicts
  incl. decrease-below-alloc atomic + non-draft block + legacy-regime rejection), run as
  rolled-back admin-context transactions. **Legacy regression (§24):** clean —
  64/51/51/51/51, `ordens_compra_fio` kg checksum 25608.300, zero fixture residue.
- **3 db/69 bugs found + fixed during testing:** Cyrillic typo in the item-quantity guard;
  `sincronizar` temp-table re-entrancy (added `DROP TABLE IF EXISTS _sync_plan`);
  `obter_distribuicao` record→json ORDER BY (`to_jsonb(x) ORDER BY x.item_id`). File and
  staging kept in sync.
- **Application:** `op-persistir.js` regime cutover (§R.23.2; native skips flat + syncs needs,
  no silent fallback); new `js/screens/op-compra-regime.js` (regime/need RPC wrappers) and
  `js/screens/ordem-compra-distribuicao.js` (distribution read view; allocation write controls
  **disabled** behind `ALLOCATION_ENABLED=false`, §22); wiring in `ordem-compra{,-data,-render}.js`
  + `index.html`; no router/boot/common change (§17).
- **STRUCTURAL POLICY COMPLIANCE (§26):** new files well within CODE_HEALTH §7 caps
  (op-compra-regime.js ~85 lines; ordem-compra-distribuicao.js ~190 lines; db/69 ~1080 lines SQL);
  no Supabase writes in render (§9); no client-side authority reconstruction (server RPCs);
  cache trigger remains sole `kg_alocado` maintainer; no new responsibility on op-nova.js; no
  transient concurrency probe present.
- **Tests:** `op-persistir.smoke.js` amended under explicit architect authorization (outside the
  §25 manifest) for the regime-gated behavior + native no-flat-row proof; `node --check` clean on
  all touched JS; full suite **133 failures = clean-HEAD baseline, zero new**.
- **Scope discipline:** staging only; production (`gqmpsxkxynrjvidfmojk`) and prohibited
  (`bhgifjrfagkzubpyqpew`) not accessed; no push; no `main`; `.gitignore`/`AGENTS.md` untouched.
- **Open / pending (next session, needs Kleber's staging browser login):** live authenticated
  **T1/T2 concurrency test** closing `LIVE_ALLOCATION_T1_T2_TEST_PENDING` (transient probe
  `preprod_a_allocation_concurrency_probe` to be created for the test and dropped immediately —
  none exists now); then enable `ALLOCATION_ENABLED`; browser visual evidence (§27); rollback
  rehearsal (§28); §30 closeout. `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED`, native
  emission/receipt, `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`, and production diagnosis remain open.
- **Status:** `PRE-PROD-A-R1` DB foundation applied + owner-tested; application authored with
  allocation UI disabled; **live concurrency, visual evidence, and closeout PENDING**. Not accepted.
- **Next authorizable action:** resume PRE-PROD-A with the live T1/T2 test against the applied
  db/69. `PRE-PROD-B` and `Phase C` remain `NOT AUTHORIZED`.

## 2026-07-19 — PRE-PROD-A-R1 — POST-CONCURRENCY ACTIVATION, VISUAL PACKAGE, ROLLBACK, AND CLOSEOUT (awaiting architect acceptance)

- **Scope and environment:** staging `ucrjtfswnfdlxwtmxnoo` only. Production
  `gqmpsxkxynrjvidfmojk`, prohibited project `bhgifjrfagkzubpyqpew`, `main`, and push
  were not accessed. `db/69` remains applied (`20260719120036 /
  69_ordem_compra_preprod_allocation`); no migration was changed.
- **Live concurrency PASS / debt resolved:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING`
  is closed. T1 PID `2272591` locked the real need first at
  `2026-07-19T14:07:12.423433+00:00`, readiness was visible at `...12.423614`, then
  committed absolute 60 kg at `...14.959616`. T2 PID `2272590` began at
  `...14:07:13.362084+00`, waited, locked at `...14.962558`, and rejected its
  absolute 60 kg request with `excede_saldo` after re-evaluating the 40 kg remainder.
  Final allocation/cache were 60 kg; no over-allocation.
- **ACL:** retained executed authenticated ACL evidence was not unnecessarily
  repeated. Current catalog: the eight authorized native admin RPCs are `SECURITY
  DEFINER`, `authenticated`-only, `anon`/`PUBLIC` denied. Authenticated admin UI
  writes succeeded. `emitir_ordem_compra(bigint)` is ungranted to `authenticated`,
  `anon`, and `PUBLIC`, and remains inactive.
- **Activation/UI evidence:** enabled `ALLOCATION_ENABLED=true`; added the missing
  event handlers and allocation modal for explicit create/absolute update/remove plus
  need synchronization. Authenticated browser evidence: native draft controls;
  create 60 kg, absolute update 60→80 kg, remove; native/legacy list; incomplete
  block; complete block `recebimento_nativo_ainda_inativo`; desktop/tablet/mobile;
  and OP purchase-order summary/navigation. The out-of-Git contact sheet is
  `C:/Users/klebe/.codex/visualizations/2026/07/19/preprod-a-r1/PRE-PROD-A-R1-contact-sheet.png`.
  The 390px capture reproduces the existing `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT`.
- **Rollback rehearsal:** temporarily disabled UI and revoked EXECUTE from
  `authenticated` for `sincronizar_necessidades_compra_fio(uuid)`,
  `alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)`, and
  `remover_alocacao_compra_fio(bigint)`. Native `persistirOP` under a simulated actual
  `42501` writer denial returns `necessidades_sync`, `partial=true`, and performs no
  flat writer/calc call. UI and grants were restored.
- **Tests:** `node --check` passed for the touched screens; focused
  `ordem-compra`/`op-persistir`/`boot` smoke: **129/129 pass**. Full `node --test`
  suite: **3,743 pass / 132 fail / 3,875 tests**; historical full-suite baseline was
  133 failures, with no new failure attributed to this closeout.
- **Zero residue:** probe functions=0; fixture needs `128..135`=0; fixture orders
  `76..82`=0; fixture items `70..79`=0; fixture allocations=0; run-key advisory
  locks=0; active probe activity=0. No runner or credential material was created or
  persisted; the external screenshots/contact sheet are intended visual deliverables.
- **Status / debts:** PRE-PROD-A is **IMPLEMENTED / VERIFIED IN STAGING / LIVE
  CONCURRENCY PASS / AWAITING ARCHITECT VISUAL VALIDATION AND ACCEPTANCE**. Do not
  record architect acceptance yet. Native emission remains inactive/ungranted;
  receipt and Phase C remain pending; PRE-PROD-B, Phase C, production, `main`, and
  push remain prohibited. Next authorizable action: architect visual validation and
  acceptance only.

## 2026-07-19 — PRE-PROD-A-R1 — ARCHITECT ACCEPTANCE — CLOSED / ACCEPTED_WITH_NONBLOCKING_ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT

- **Architect ruling:** `PRE-PROD-A-R1` is closed and accepted. The accepted record
  includes staging migration `20260719120036 / 69_ordem_compra_preprod_allocation`,
  implementation commit `56868fea1b65c3d627827a0bba47997cb1de0511`, authenticated
  ACL PASS, rollback rehearsal PASS, focused tests 129/129 PASS, full suite 3,743
  pass / 132 historical failures, zero transient residue, and accepted desktop/tablet
  visual evidence.
- **Concurrency gate resolved:** `LIVE_ALLOCATION_T1_T2_TEST_PENDING` is resolved.
  T1 PID `2272591` acquired the real lock first and committed absolute 60 kg; T2 PID
  `2272590` waited, re-evaluated 40 kg remaining, and rejected absolute 60 kg with
  `excede_saldo`. Final allocation/cache=60 kg; no over-allocation.
- **Accepted operating state:** allocation controls are active in staging for eligible
  native drafts; legacy remains read-only. Native emission remains inactive and
  `emitir_ordem_compra` remains ungranted. Native receipt and Phase C remain pending;
  `NATIVE_RECEIPT_COMPATIBILITY_MULTI_ORIGIN_UNRESOLVED` remains open.
- **Non-blocking/deferred work:** `ADMIN_SHELL_MOBILE_RESPONSIVENESS_DEBT` remains open
  and non-blocking. UI provenance / modern-visual-language audit is deferred as a
  separate post-stabilization activity and does not block this acceptance.
- **Boundaries:** a contemporaneous read-only production diagnosis remains mandatory
  before any production work. Production, `main`, push, PRE-PROD-B, and Phase C
  implementation remain prohibited unless separately authorized. The next
  authorizable action is a separate architect order selecting a reconciled backlog
  front.

## 2026-07-19 — PHASE-C1 — NATIVE RECEIPT AUTHORITY CONTRACT — CLOSED / ACCEPTED

- **Order:** `PHASE C1 — NATIVE RECEIPT AUTHORITY CONTRACT`.
- **Baseline / Git:** branch `dev`, HEAD
  `47b8e6a6bc8dea0cd0fe053fef2ef9f2f16f14fa`; required lineage confirmed. Known
  pre-existing residue `.gitignore` modified and `AGENTS.md` untracked was preserved
  untouched and unstaged.
- **Scope executed:** documentation-only canonical reconciliation and contract closure.
  No implementation, SQL/migration, staging/production write, ACL/grant, UI, test,
  push, `main`, or C2 action was performed.
- **Canonical authority:** `ordem_compra_fio_lancamentos` evolves as the sole physical
  receipt ledger. No competing ledger or flat received-total authority survives the
  cutover. Events are audit-only; item totals, order receipt status, and projections
  are database-derived; clients receive no receipt-table DML.
- **Receipt shape:** immutable header with receipt/document identity, origin, date,
  actor, stable submission idempotency key, and immutable command metadata. Each line
  binds header, native item, optional allocation, allocation's real OP, and canonical
  ledger entry. A single receipt may span multiple items, allocations, and real OPs.
- **Material semantics:** cotton follows its concrete real-OP allocation. Shared
  polyester needs keep `op_id IS NULL`; physical lines follow the selected
  allocation's actual OP, allowing multiple real OPs without representative or fake
  OPs. Excess stays on the same receipt/item, creates no fake need/allocation, and may
  produce only the narrow atomic inventory movement.
- **Writer and reversal:** receive only emitted, non-cancelled, acceptance-eligible
  native orders; lock order/item and allocations deterministically (allocation IDs
  ascending); re-evaluate under lock; stable exact-repeat idempotency returns the
  original result; conflicting reuse rejects; cumulative allocation receipts cannot
  exceed `kg_alocado`; invalid states reject; history is immutable. Reversal appends
  an idempotent negative entry referencing its positive source, locks source and
  reversals, caps at the remaining reversible quantity, and cannot make derived totals
  negative.
- **Actors / ACL:** admin and future matching supplier use the same RPC. Supplier scope
  is limited to its matching order; no table DML. Supplier reversal authority remains
  an explicit C2 decision and must not be inferred. Supplier UI is deferred.
- **Legacy classes:** A and D import one `import_saldo_inicial` receipt per mapped item
  for non-zero balance; D preserves received-without-emission without fake events. B
  seeds none; C has no rows. Fake needs, allocations, OPs, or events are forbidden.
- **Cutover / rollback:** fence both flat writers and prove denial; snapshot all 51
  mappings; import and reconcile; migrate both consumers; switch readers; revoke flat
  updates; close the ACL gap; remove anonymous update. Rollback is allowed only before
  the first post-switch canonical receipt and only with zero canonical writes; after
  that point recovery is forward-only.
- **UI placement:** future admin UI only at `#/ordens-compra/:id`, persistent
  **Recebimentos** section with dedicated modal action. No receipt UI in OP, Pedido,
  production-transition, or supplier-assignment modals. Supplier UI remains later.
- **Binding sequence:** C1 contract; C2 inactive foundation/writer/reversal/narrow
  inventory; C3 cutover/import/readers/ACL; C4 admin UI and later supplier UI; C5
  separate emission activation. Native emission stays inactive/ungranted until C1-C4
  are accepted. Phases do not chain automatically.
- **Open before C2:** exact header schema and idempotency namespace; supplier reversal
  permission; inventory-movement object/reconciliation; multi-line RPC signature/result
  plus complete lock order; migration split between inactive foundation and cutover.
- **Documentation index ruling:** no update required under the documentation model;
  C1 creates no new canonical path, authority class, document class, or migration.
- **Status / next authorization:** `PHASE-C1` is `CLOSED / ACCEPTED`. C2 is **not
  authorized**. The next possible action is a separate architect C2 order after the
  open contract decisions are settled.

## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT IMPLEMENTATION BOUNDARY — DOCUMENTATION GATE

- **Order:** `PHASE C2 — NATIVE RECEIPT FOUNDATION, WRITER, REVERSAL AND NARROW
  INVENTORY INTEGRATION`.
- **Baseline:** `dev @ 3395f83df0eb7db604df9a80d4a43a0601bc8b6c`; C1 is
  closed/accepted and is the direct ancestor. Known `.gitignore` modified and
  `AGENTS.md` untracked residue preserved out of scope.
- **Local/staging preflight:** local latest migration is `db/69`; slot 70 is free.
  Staging `ucrjtfswnfdlxwtmxnoo` is healthy on PostgreSQL 17.6 and its last recorded
  migration is `20260719120036 / 69_ordem_compra_preprod_allocation`. Corpus remains
  64 flat/needs, 51 native legacy headers/items/allocations/mappings, receipt ledger
  and events zero, native orders zero, transient objects zero. Flat checksum remains
  25,608.300 kg ordered / 20,221.280 kg received; native item checksum matches.
  `emitir_ordem_compra` has no EXECUTE for PUBLIC/anon/authenticated/service_role.
- **Inventory inspection:** `saldo_fios` has 5 rows / 2,685.020 kg and no duplicate
  material/color identity; `saldo_fios_op` is empty. Its current client writer is the
  OP recalculation path and no source-linked receipt movement authority exists.
  Therefore C2 may create only a receipt-source surplus movement object; it may not
  refactor general inventory.
- **Concrete contract:** lifecycle spec §R.25 closes the five C2 decisions left by
  C1. Header = immutable `ordem_compra_recebimentos`; idempotency namespace
  `native_receipt_v1`, scoped by actor type + actor UUID + key, with canonical JSONB
  equality. Ledger gains native command/order/allocation/real-OP/material/excess/
  actor/line identity while preserving legacy coexistence columns.
- **RPCs:** `registrar_recebimento_ordem_compra` accepts a non-empty multi-line
  absolute command with lines explicitly `alocacao` or `excesso`; only active admin
  or the order's active matching supplier. `estornar_recebimento_ordem_compra` is
  administrator-only and refuses imported opening balances. The actor-scoped read
  model is `obter_historico_recebimento_ordem_compra`.
- **Locks:** native order; items ascending; allocations ascending; scoped command
  identity; relevant ledger rows ascending; deterministic material/color inventory
  identities. All caps are re-evaluated after waits.
- **Ownership:** `ordem_compra_fio_lancamentos` is physical authority; item/header
  caches derive in the database; allocation/excess/reversible quantities are
  projections. `ordem_compra_fio_movimentos_estoque` is immutable and unique by
  ledger source entry; only surplus delta affects `saldo_fios`, preserving §R.9 and
  preventing allocated kg from becoming general stock.
- **ACL:** new tables expose no client mutation. Receipt/reversal/read RPCs are
  authenticated-only after PUBLIC/anon/service_role revoke; matching supplier has
  receipt only, never reversal. Native emission and flat UPDATE ACL remain unchanged.
- **Rollback/exclusions:** revoke C2 grants and rehearse dependency-safe C2 object
  removal only while zero real canonical receipts exist. No import/seed, cutover,
  flat-writer fence, productive-reader switch, UI, emission activation, production,
  `main`, or push. C3/C4/C5 remain unauthorized.
- **Status / next action:** documentation boundary is closed. Continue under the same
  architect order only with `db/70`, focused tests, staging verification/cleanup,
  rollback rehearsal, and canonical closeout. Do not record architect acceptance or
  begin C3.

## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT FOUNDATION — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE

- **Order and baseline:** `PHASE C2 — NATIVE RECEIPT FOUNDATION, WRITER, REVERSAL
  AND NARROW INVENTORY INTEGRATION`; `dev @
  3395f83df0eb7db604df9a80d4a43a0601bc8b6c`. C1 lineage was confirmed. Permanent
  `.gitignore` modified / `AGENTS.md` untracked residue was preserved untouched and
  unstaged. Boundary commit: `9a5cb4f`; implementation commit: `833c2ad`.
- **Implementation:** exactly migration
  `db/70_ordem_compra_native_receipt_foundation.sql` and focused test
  `tests/ordem-compra-native-receipt.smoke.js`. Staging records
  `20260719160518 / 70_ordem_compra_native_receipt_foundation`. The sole receipt
  ledger was extended additively; immutable command headers, actor-scoped exact
  idempotency, admin/matching-supplier receipt, admin-only reversal, actor-scoped
  history, database-derived caches, and one source-linked surplus movement per
  ledger entry are active. Native emission remains ungranted.
- **Functional and authorization evidence:** rollback-only scenarios passed for
  partial/successive/multi-item/multi-allocation receipts, cotton and shared
  polyester real-OP attribution, excess, exact retry, conflicting retry, draft/
  pending/rejected/cancelled rejection, allocation cap, supplier ownership,
  administrator partial/full reversal, over-reversal, immutable guards, history
  scope, and exact stock delta. Authenticated clients can execute only the three C2
  RPCs; header/ledger/movement direct mutation is denied; supplier reversal is
  denied; `emitir_ordem_compra` remains denied.
- **True concurrency evidence:** five independent-backend scenarios passed. Same
  allocation used PIDs 2281708/2281707 (`ok` / post-wait `excede_alocacao`);
  duplicate identity used 2281917/2281916 (both `ok`, same header); receipt/reversal
  used 2282003/2282002 with a transaction-id lock wait and both `ok`; distinct
  shared-polyester allocations/real OPs used 2282095/2282094 with a transaction-id
  wait and both `ok`; same-item excess/cache used 2282204/2282205 with a
  transaction-id wait, both `ok`, exact 5 kg ledger/movement/cache delta, and all
  caps intact. Every waiting writer re-evaluated under lock.
- **Rollback and cleanup:** dependency-safe C2 removal was rehearsed inside a
  transaction without CASCADE and rolled back; db/67-db/69, 51 legacy header/item/
  allocation rows, and flat ACL remained intact. All marked fixture rows and
  temporary cron/probe objects were removed. Final staging: 64 flat needs; 51 legacy
  headers/items/allocations; zero native orders, receipt headers, receipt ledger,
  movements, or orphans; `saldo_fios` 5 rows / 2,685.020 kg; no cron, dblink, probe
  schema/function, active job, or disabled C2 trigger.
- **Checksums and tests:** flat ordered 25,608.300 kg; flat received and legacy item
  received 20,221.280 kg; allocations and need cache 20,238.300 kg. Focused native
  purchase-order tests: 48/48 pass; new focused file: 13/13 pass. Full JavaScript
  suite: 3,888 tests, 3,755 pass, 133 pre-existing unrelated failures, 0 skipped;
  none is attributed to the two C2 implementation files.
- **STRUCTURAL POLICY COMPLIANCE:** the 1,211-line migration is the single atomic
  file required by the architect; splitting it was expressly outside scope. The
  approximately 347-line receipt writer and 256-line reversal remain below the
  500-line acceptable function limit and are cohesive transactional lock/write
  orchestrators; derivation and result helpers are already separated. Further
  SECURITY DEFINER fragmentation would expand privilege surface and disperse the
  lock contract. The 211-line focused test is bounded to C2. No UI/application
  monolith, parallel authority, silent fallback, or undocumented cross-layer
  dependency was introduced.
- **Scope preservation:** no import/seed, cutover, flat-writer fence, productive
  reader switch, flat ACL change, UI, emission activation/grant, production,
  `main`, push, C3, C4, or C5 action occurred. C2 is not architect-accepted.

PLAN_ALIGNMENT:
MASTER_PLAN: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md (§R.24-§R.25) and docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
LAST_ACCEPTED_PHASE: PHASE-C1 (CLOSED / ACCEPTED)
CURRENT_PHASE: PHASE-C2 (IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE)
NEXT_AUTHORIZABLE_ACTION: ARCHITECT TECHNICAL ACCEPTANCE DECISION FOR PHASE-C2 ONLY
OPEN_ARCHITECT_DECISIONS: ACCEPT OR REJECT PHASE-C2 TECHNICAL CLOSEOUT; C3 REMAINS UNAUTHORIZED
DEFERRED_PHASES: PHASE-C3; PHASE-C4; PHASE-C5; PRODUCTION; MAIN; PUSH
STATE_FILES_UPDATED: PROJECT_STATE.md; AGENT_HANDOFF.md; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md; docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md; docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md; docs/ledgers/G28_LEDGER.md
MATERIAL_DIVERGENCES: NONE

## PHASE-C3A — Contract boundary opened (2026-07-19)

- **Status:** `AUTHORIZED / CONTRACT CLOSURE IN PROGRESS`; staging-only, no real
  import/cutover. Current `saldo_fios` is the opening inventory baseline. Historical
  import is receipt-state reconstruction: zero movement and no `saldo_fios`/
  `saldo_fios_op` mutation.
- **Future shape:** 39 `legacy_initial_balance_v1` system headers; 44 immutable
  `import_saldo_inicial` entries (39 allocation-attributed plus five allocation-free
  excess), 20,221.280 kg reconstructed, 405.980 kg excess. Debt:
  `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`.
- **Not authorized:** real seed, fence activation, reader/writer switch, flat ACL
  revocation, UI, native emission, C3B/C3C/C3D/C4/C5, production, `main`, or push.

## 2026-07-19 — PHASE-C2 — NATIVE RECEIPT FOUNDATION — CLOSED / ACCEPTED

- **Architect ruling:** `PHASE-C2` is `CLOSED / ACCEPTED`. Accepted technical/staging
  checkpoint: `dev @ 14ca5c77f87c11c310a6df2469969a23e32972d5`; staging migration:
  `20260719160518 / 70_ordem_compra_native_receipt_foundation`.
- **Accepted model:** immutable native receipt headers; the additive
  `ordem_compra_fio_lancamentos` sole canonical physical receipt ledger; canonical
  multi-line receipt writer; administrator-only source-linked reversal; deterministic
  locking and actor-scoped exact idempotency; ledger-derived receipt caches; and one
  transactional source-linked surplus movement per ledger entry. A matching active
  supplier may register only its own order receipts; supplier reversal remains denied.
  Direct client DML is denied; receipt/reversal/read RPCs are authenticated-only;
  native emission remains inactive and ungranted.
- **Acceptance evidence:** 48/48 focused tests and 13/13 new C2 tests pass; five real
  concurrent-backend scenarios pass; rollback rehearsal passes without CASCADE;
  db/67-db/69 and the legacy flat path remain intact; final staging fixtures and
  transient artifacts are zero. No opening-balance seed, productive-reader switch,
  cutover, flat ACL change, UI, C3/C4/C5 action, production, `main`, or push occurred.
- **Full-suite reconciliation:** PRE-PROD-A `47b8e6a`, pre-C2 baseline `3395f83`, and
  C2 checkpoint `14ca5c7` each reproduce 133 identified failures. The accepted C2
  full-suite baseline is 3,864 tests / 3,731 pass / 133 pre-existing failures; zero
  baseline-only, current-only, or unstable identities; normalized set SHA-256
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`. The earlier
  aggregate count of 132 is superseded. Zero C2 regression exists.
- **Post-acceptance boundary:** flat receipt remains productive authority until C3
  cutover. C3, C4, and C5 remain unimplemented. The next authorizable action is a
  fresh read-only C3 pre-cutover reconciliation and implementation-boundary diagnosis;
  it does not authorize C3 implementation.

PLAN_ALIGNMENT:
MASTER_PLAN: docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md (§R.24-§R.25) and docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md
LAST_ACCEPTED_PHASE: PHASE-C2 (CLOSED / ACCEPTED)
CURRENT_PHASE: NONE — PHASE-C2 CLOSED / ACCEPTED
NEXT_AUTHORIZABLE_ACTION: FRESH READ-ONLY C3 PRE-CUTOVER RECONCILIATION AND IMPLEMENTATION-BOUNDARY DIAGNOSIS
OPEN_ARCHITECT_DECISIONS: C3 IMPLEMENTATION REQUIRES A SEPARATE ARCHITECT AUTHORIZATION AFTER RECONCILIATION
DEFERRED_PHASES: PHASE-C3 IMPLEMENTATION; PHASE-C4; PHASE-C5; PRODUCTION; MAIN; PUSH
STATE_FILES_UPDATED: PROJECT_STATE.md; AGENT_HANDOFF.md; docs/architecture/ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md; docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md; docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md; docs/ledgers/G28_LEDGER.md
MATERIAL_DIVERGENCES: NONE

## 2026-07-19 — PHASE-C3A-R1/R2 — INACTIVE CUTOVER AND OWNER-ONLY IMPORT COMMAND — IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL ACCEPTANCE

- **Authorization and lineage:** accepted pre-C3A baseline
  `361d0f77388b0adac9b83997707cd49df938e4dd`; contract `d23645f`; foundation
  `fca6ea7`; R1 protected singleton `0908b77`; R2 command `94e6068`. Staging only;
  production, prohibited project, `main`, and push were not accessed.
- **Applied migrations:** `20260719172749 / 71_ordem_compra_c3a_cutover_foundation`,
  `20260719174006 / 72_ordem_compra_c3a_cutover_initial_state`, and
  `20260719175732 / 73_ordem_compra_c3a_import_command`.
- **Root cause and correction:** db/71 created import-compatible header/type/trigger
  foundations but omitted the owner command, so duplicate replay/conflict and real
  concurrency semantics did not exist. It also retained a ledger actor check that
  excluded `sistema` and a NOT NULL receipt date that would fabricate a physical
  date. db/73 adds exactly one owner-only command plus the minimum actor/date and
  source-identity support; no application or activation path was added.
- **Command contract:** `public.importar_saldo_inicial_ordem_compra_c3a(jsonb)`,
  owner `postgres`, `SECURITY DEFINER`, empty fixed `search_path`, EXECUTE revoked
  from PUBLIC/anon/authenticated/service_role. Namespace
  `legacy_initial_balance_v1`; identity is cutover + flat row + mapping + item.
  Canonical request JSONB uses explicit NULL and three-decimal kg strings. Its
  SHA-256 and the full derived payload SHA-256 cover snapshot identity/hash,
  order/item/allocation/real OP, Class A/D, total/attributed/excess kg, and provenance;
  volatile execution time is excluded and stored as header acceptance time only.
  Class D records `recebido_sem_emissao`; no physical date, document, emission,
  acceptance, human actor, or representative OP is fabricated.
- **Locks and idempotency:** source key is
  `hashtextextended('legacy_initial_balance_v1|source|cutover|flat',0)`; full key is
  `hashtextextended('legacy_initial_balance_v1|identity|cutover|flat|mapping|item',0)`.
  Both are transaction-scoped. A 64-bit hash collision could conservatively serialize
  unrelated work but cannot bypass payload/source validation or uniqueness. Exact
  retry returns the stored header and ledger IDs with no mutation; changed quantity,
  mapping, snapshot, or other meaning returns `idempotencia_conflitante`.
- **Functional gates:** rollback-controlled pre-apply and live-staging matrices passed
  first valid A/D import, exact retry, quantity/mapping/snapshot conflict, B/C and zero
  denial, allocation overflow, valid excess, fabricated excess allocation denial,
  execution denial, inventory non-posting, and import non-reversibility. Import shape
  is one allocation line plus an excess line only when excess is positive; line sum
  equals source total and allocation never exceeds the real allocation.
- **Distinct-backend concurrency:** scenario A PIDs `18624/20432`, full identity lock
  `-6666601321319751478`, observed advisory wait, one header/two ledger rows and exact
  IDs `3 / 3,4` returned to both calls. Scenario B PIDs `29848/17092`, identity lock
  `5039416729415450130`, observed advisory wait, first `ok`, second
  `idempotencia_conflitante`, one header/one ledger/no movement. Scenario C import/C2
  PIDs `14692/24184` completed independently: import two lines/zero movement; C2 one
  receipt/one movement/+1 kg isolated test-stock effect. Scenario D flat/import PIDs
  `15856/23736` under `legacy_active`: transient flat 4.125 kg write succeeded and
  rolled back to 4.000; import rejected `estado_cutover_invalido`; no source-4 header.
  All concurrency fixtures ran in an isolated PostgreSQL instance, which was stopped
  and removed; real staging cutover state was never activated.
- **Rollback rehearsals:** db/73-only and full db/71-db/73 rollback passed inside
  staging transactions without CASCADE. Dependency-safe order removed command/index,
  restored ledger actor/date shape, removed singleton protection/row, restored db/70
  guard/trigger/header/ledger constraints, then removed baseline/cutover tables. C2
  admin and matching-supplier receipt passed; supplier reversal stayed denied; admin
  reversal and flat receipt passed; inventory remained unchanged. db/71, db/72, and
  db/73 were restored in order and the rehearsal transaction rolled back cleanly.
- **Tests and regression:** focused purchase-order suite `56/56`. Two detached runs
  per revision of `node --test tests/*.js`: baseline 3,864 tests / 3,731 pass / 133
  known failures; current 3,872 / 3,739 / 133. Baseline-only, current-only, and
  unstable identities are all zero; canonical normalized SHA-256 remains
  `af9246c162a514f1162d845bb129980f9a1e4505c46323966d8def262a48a192`.
- **Final cleanup:** migrations 71/72/73 applied; one singleton
  `id=1 / legacy_active / not_started`, NULL snapshot/baseline/productive markers;
  zero headers, ledger, movements, baseline rows, fixture rows, transient functions,
  active probe sessions, disabled triggers, or temporary grants. Preview remains
  39 headers / 44 ledger / 20,221.280 kg / 405.980 kg excess / zero movements.
  `saldo_fios` remains 5 rows / 2,685.020 kg, normalized hash
  `79d5c1393193b67cd9f3a7b8cdc5037ce919bca87084d59f84a08949baafd566`;
  `saldo_fios_op` remains zero. Flat ACL/writers and native emission denial are
  unchanged.
- **Structural policy:** db/73 is a cohesive 388-line migration, below the 500-line
  acceptable file limit. The single long command is a documented §7 exception: the
  architect required one owner-only atomic maintenance command; splitting state,
  snapshot, lock, fingerprint, and immutable-write orchestration would add privileged
  surface and disperse the transaction contract. No UI/application monolith or
  parallel source of truth was introduced.
- **Boundary:** no real import, snapshot, fence, reader/writer switch, flat ACL
  closure, Class-B receipt, activation RPC, db/74, emission, C3B/C3C/C3D/C4/C5,
  production, `main`, or push. `HISTORICAL_SALDO_FIOS_PROVENANCE_UNAVAILABLE`
  remains nonblocking debt. The next single authorizable action is architect technical
  acceptance or rejection of PHASE-C3A. Architect acceptance is not recorded here.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — CANONICAL DOCUMENTATION CORRECTION R2

- **Authorization / mode:** architect-authorized documentation-only correction.
  Implementation, SQL, migrations, tests, grants, staging writes, production,
  `main`, and push prohibited. Baseline `dev @
  369e5342d3dee0c361a10c42ac1d889f3483b8c7`; accepted C2 lineage
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Known modified
  `.gitignore` and untracked `AGENTS.md` remained untouched; index was empty and no
  `index.lock` existed.
- **Accepted evidence and decision:** the architect accepted the purchase-order
  impact audit and the hybrid-origin addendum. Redo verdicts remain **NO** for B1,
  PRE-PROD, C1, C2, and C3A. The selected strategy is localized forward correction,
  not phase restart. C3A remains implemented/verified in staging and unaccepted.
- **Hybrid origin:** native cotton is OP-origin and uses the real calculating OP;
  genuinely shared polyester is Pedido-origin with `necessidade.op_id IS NULL`.
  Future allocation provenance is server-derived from the locked need:
  OP-origin → `allocation.op_id = necessidade.op_id`; Pedido-origin →
  `allocation.op_id IS NULL`. No caller-selected, representative, synthetic,
  convenience, first, or arbitrary OP is permitted.
- **Identity / quantity / ownership:** shared allocation identity must be NULL-safe;
  `ordem_compra_item.kg_pedido` is authoritative only as the sum of allocation kg;
  purchase orders belong to Pedido + supplier; purchasing distribution belongs to
  Pedido → Insumos / `aguardando_fios`, with no new stepper stage. A dedicated route
  remains an allowed surface only. An item may consolidate allocations from multiple
  OP-specific needs and shared Pedido needs.
- **Localized defects found:** `db/69` accepts caller-controlled `p_op_id`, requires an
  OP for shared allocations, and uses a plain nullable-OP unique index; `db/68` exposes
  an independent manual item quantity; `db/70` receipt/ledger/movement guards require
  non-NULL OP on every allocated line. These applied files were not altered. Phase C
  remains reusable but requires focused forward correction and revalidation for shared
  NULL-OP allocation lines. Valid excess remains allocation-free under `saldo_fios`.
- **Operational paths superseded for future origination:** independent `Nova ordem`;
  `definir_item_ordem_compra` as origination writer; item-first
  `alocar_necessidade_compra_fio`; caller-controlled `p_op_id`; manual authoritative
  item quantity; allocation ownership by purchase-order detail; supplier-assignment
  ownership by OP; any receipt/ledger rule requiring artificial shared OP provenance.
- **Documentation transaction:** corrected the governing lifecycle spec, current
  state, active handoff, production-flow backlog, schema contract, documentation
  index, and this append-only ledger. Earlier B1, PRE-PROD, C1, C2, and C3A entries
  remain byte-preserved. The legacy diagnosis, Pedido/OP movement plan, Documents
  evolution plan, governance model, supervision protocol, code-health rules, and
  `CLAUDE.md` were inspected and required no change because they contain no current
  hybrid-origin contradiction within their roles.
- **Forward sequence:** documentation correction → separately authorized corrective
  implementation → focused staging validation → PRE-PROD revalidation → Phase C
  shared-allocation revalidation → later architect disposition of C3A → only then
  C3B and subsequent phases. No phase chains.
- **Status:** `COMPLETED / AWAITING ARCHITECT ACCEPTANCE`. The only next
  authorizable action is architect acceptance or rejection of this documentation
  correction. `NO IMPLEMENTATION AUTHORIZED`.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN R2 — ARCHITECT ACCEPTANCE CLOSEOUT

- **Accepted commit:** `840dcb19b6bc6ffd8543a3f79bcae07516738bf6`.
- **Ratified status:** Impact Audit `CLOSED / ACCEPTED`; Hybrid Need Origin Addendum
  `CLOSED / ACCEPTED`; Documentation Correction R2 `CLOSED / ACCEPTED`.
- **Redo / strategy rulings:** REFUND-A redo **NO**; REFUND-B1 redo **NO**;
  PRE-PROD redo **NO**; Phase C redo **NO**; selected strategy = forward corrective
  migration; staging-data conversion required = **NO**.
- **C3A:** remains `IMPLEMENTED / VERIFIED IN STAGING / AWAITING ARCHITECT TECHNICAL
  ACCEPTANCE`; this closeout does not accept it.
- **Next active technical phase:** `PURCHASE-ORDER HYBRID ORIGIN — FORWARD
  CORRECTION F1`, `AUTHORIZED`, scoped to database authority, atomic need-first
  writer, derived OP-or-NULL provenance, NULL-safe allocation identity,
  allocation-derived item quantity, deterministic removal/cleanup, obsolete
  database-writer restriction, and localized Phase C shared-allocation compatibility.
  UI correction remains outside F1.
- **Boundary:** staging database writes, production, `main`, push, UI/F2, C3A
  acceptance, and later phases remain unauthorized. F1 implementation may begin only
  after its read-only readiness reconciliation passes.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT CLOSURE R1

- **Authorization / baseline:** documentation-only architectural contract closure on
  `dev` at `91fac9ca730660244bfc6d537e7282c4802f9089`; lineage from accepted C2
  baseline `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Known modified
  `.gitignore` and untracked `AGENTS.md` remained untouched and unstaged. No SQL,
  migration, application, test, grant, environment write, production, `main`, or
  push was authorized.
- **Accepted readiness result recorded:** F1 implementation readiness returned
  `HARD_STOP — CONTRACT INCOMPLETE`. The accepted hybrid-origin model determined
  provenance and quantity invariants but not the exact need-first API, replay model,
  zero-allocation/item/draft cleanup transitions, or obsolete-writer ACL disposition.
  Implementation did not start.
- **Canonical command:**
  `definir_alocacao_necessidade_compra_fio(p_necessidade_id BIGINT,
  p_fornecedor_id BIGINT, p_kg_alocado NUMERIC, p_idempotency_key TEXT) RETURNS
  JSONB`; authenticated active admin only. Need, supplier, absolute target, and
  idempotency key are the only caller inputs. Pedido, material, color, order, item,
  allocation, and real-or-NULL OP are derived under lock.
- **Idempotency / mutation:** permanent immutable command journal in namespace
  `native_distribution_v1`, unique by namespace + actor + key, canonical request
  JSONB equality plus MD5 fingerprint. Same request/key returns the stored result;
  changed request/key conflicts; intentional create/increase/reduction/removal uses a
  new key. One absolute-target API is canonical; target zero is removal.
- **Cleanup / quantity:** zero allocation row is deleted; an item with no allocations
  is deleted; a never-emitted active draft with no items is deleted. No lifecycle
  event is fabricated; the immutable command is the audit. Later distribution creates
  new entity IDs while old-key replay returns stored deleted IDs. Every surviving
  item is protected by a deferred constraint trigger requiring at least one allocation
  and exact `kg_pedido = SUM(kg_alocado)`.
- **Identity / provenance:** logical identity is exactly `(item_id,
  necessidade_id)`, making shared NULL provenance structurally irrelevant to
  uniqueness. Duplicate preflight is mandatory before replacing the old index.
  OP-origin stores the need's real OP; Pedido-origin stores NULL; imported legacy
  real-OP rows are preserved without conversion.
- **ACL closure:** only the new need-first writer gets authenticated execution.
  `definir_item_ordem_compra`, item-first `alocar_necessidade_compra_fio`,
  `remover_item_ordem_compra`, and `remover_alocacao_compra_fio` become owner-only
  deprecated definitions. Native emission remains owner-only/inactive; draft cancel,
  receipt/reversal, read-only preview, flat coexistence, and owner-only C3A authority
  retain their exact documented boundaries.
- **Phase C shape:** allocated OP-origin lines keep the real OP; allocated shared
  Pedido-origin lines retain full order/supplier/Pedido/item/need/allocation/material/
  color/quantity/receipt/ledger/movement identity with NULL OP; excess remains
  allocation-free and OP-free. db/70 and db/71 future guards become NULL-safe; receipt
  selection drops the non-NULL filter; caps, reversal, surplus movement, and db/73
  legacy real-OP/non-posting import remain unchanged. No history/data conversion.
- **Concurrency / errors:** exact command-key advisory gate, command row, need,
  supplier, draft advisory+row, item, allocation, mutation/cleanup, and command insert
  order is closed. Stable codes cover authorization, need/supplier/quantity/origin,
  capacity, replay conflict, frozen state, duplicates, cleanup, and receipt mismatch.
- **Canonical transaction:** lifecycle §R.28 and schema contract §13 contain the
  complete executable contract; backlog, current state, active handoff, documentation
  index, and this append-only entry are synchronized. Earlier R2, REFUND, PRE-PROD,
  C1, C2, and C3A entries were not rewritten.
- **Status / next action:** `COMPLETED / AWAITING ARCHITECT ACCEPTANCE`. F1
  implementation is not authorized. The only next authorizable action is architect
  acceptance or rejection; acceptance must be followed by a separate F1
  implementation order. F2 and C3A acceptance remain unauthorized/pending.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT ACCEPTANCE

- **Accepted contract commit:** `00897f09267fc8304b329ce46ba985d03a57faff`.
- **Ratified status:** `PURCHASE-ORDER HYBRID ORIGIN — F1 EXECUTABLE CONTRACT
  CLOSURE R1: CLOSED / ACCEPTED`.
- **Implementation authorization:** `PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD
  CORRECTION IMPLEMENTATION R1: AUTHORIZED`, subject to the final read-only
  reconciliation returning `READY_FOR_F1_IMPLEMENTATION`.
- **Preserved decisions:** all redo verdicts remain **NO** and forward correction
  remains the selected strategy. C3A remains implemented and verified but not
  accepted. F2 UI and staging application remain unauthorized.
- **Boundary:** isolated PostgreSQL verification is permitted. Staging, production,
  `main`, remote changes, push, C3A acceptance, F2, and later phases are prohibited.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION IMPLEMENTATION R1

- **Baseline / authorization:** `dev` at accepted contract
  `00897f09267fc8304b329ce46ba985d03a57faff`; acceptance registration commit
  `380c03dd34f37db80b1c171deb50017b685b69aa`. Lineage from
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed. Final reconciliation verdict:
  `READY_FOR_F1_IMPLEMENTATION`.
- **Technical implementation:** commit
  `463cafbdd4816ff1093b3086dd71d3d6e70b3479`; forward-only migration
  `db/74_ordem_compra_hybrid_origin_forward_correction.sql`. It installs
  `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT) RETURNS JSONB`,
  immutable `native_distribution_v1` actor/key journal, exact replay/conflict and
  absolute create/increase/reduce/remove/unchanged semantics, corrected unique
  `(item_id, necessidade_id)` identity, derived `kg_pedido`, deterministic cleanup,
  draft/history freeze guards, and the accepted ACL matrix.
- **Phase C correction:** native allocated ledger shape now permits shared NULL OP;
  the db/71-compatible guard, receipt allocation selection/derivation, ledger,
  movement, history, caps, and reversal preserve NULL for Pedido-origin, real OP for
  OP-origin, and allocation-free/OP-free excess. C3A real-OP import and non-posting
  behavior remain unchanged and unaccepted.
- **Application boundary:** independent `Nova ordem`, manual item add/edit/remove,
  and allocation controls remain visible only as disabled/read-only surfaces with no
  handlers. Shared allocations render as `Pedido compartilhado`. These minimal
  changes prevent calls to superseded writers; F2 was not implemented.
- **Isolated database evidence:** PostgreSQL 18.4, full db/67-db/73-compatible local
  baseline, clean db/74 apply and clean reapply, no CASCADE, no environment data
  conversion. `tests/ordem-compra-hybrid-origin-f1.integration.sql` passed inside
  `BEGIN ... ROLLBACK`, proving OP/shared provenance, exact result fields, replay,
  conflict, actor scope, scalar/error taxonomy, quantity cap, derived-quantity guard,
  cleanup and post-cleanup replay/audit, post-emission freeze, shared and OP receipt,
  excess, reversal, movement provenance, and final ACLs.
- **Concurrency evidence:** eight distinct-session cases passed: OP first allocation
  `created/unchanged`; shared first allocation `created/unchanged`; target race
  `increased/reduced` with final 25 kg; removal/recreate `removed/created` with final
  15 kg; empty-draft cleanup/new-need `removed/created`; competing same-draft creation
  `created/created` with one draft; duplicate actor/key returned the exact stored
  `created` result with one journal/allocation row; emission/allocation returned
  `ok/estado_invalido` and retained 20 kg. Final assertion:
  `F1_CONCURRENCY_PASS | 9 allocations | 17 race command rows`; all surviving item
  quantities equalled allocation sums.
- **Tests:** focused purchase-order suite 62/62. Purchase-order + receipt/C3A + OP
  persistence/recalculation + Pedido summary selection 277/278; the sole failure is
  the pre-existing `op-writes` menu-count expectation (expected 9, rendered 12).
  Full suite baseline was 3,896 tests / 3,764 pass / 132 fail; final is 3,902 / 3,770
  / 132. The 132 normalized failure identities are exactly unchanged, SHA-256
  `5aca571de6057bfdf2080ef945112189e6f3f4cb7795ccd827a729131642e75f`.
- **Code health / exception:** JS source files remain below 500 lines and F1 added no
  UI/domain/persistence coupling. The 1,227-line migration and its long RPC/replaced
  receipt definition are a documented cohesive SQL exception: the accepted contract
  requires one atomic next-number migration, and PostgreSQL `CREATE OR REPLACE
  FUNCTION` requires full function bodies for localized replacement. Splitting would
  break the single forward correction and rollback/apply proof. Static tests,
  `node --check`, `git diff --check`, no-CASCADE inspection, and dynamic ACL matrix
  passed.
- **Boundary / status:** `IMPLEMENTED / VERIFIED LOCALLY / AWAITING ARCHITECT
  REVIEW`. No staging application, production, `main`, remote change, push, migration
  history write, or C3A acceptance occurred. Known modified `.gitignore` and untracked
  `AGENTS.md` remained untouched and unstaged. F2 remains unauthorized.
- **Next authorizable action:** architect acceptance or rejection of F1. A separate
  explicit order is required for staging application or F2; neither chains from this
  closeout.
- **Final ACL reconciliation addendum:** follow-up technical commit
  `680cff136a3294ae9a345fc8f91f02e246891eef` corrects an over-broad local-only
  revocation before any environment application. The accepted matrix preserves
  authenticated `sincronizar_necessidades_compra_fio(UUID)` for canonical need
  synchronization; PUBLIC, `anon`, and `service_role` remain revoked. All obsolete
  manual/item-first writers remain owner-only. db/74 reapply, dynamic ACL proof,
  rollback integration 62/62 focused tests, and the exact broad-suite failure hash
  passed again. No staging or other environment observed the superseded local ACL.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION ACCEPTANCE R1

- **Architect ruling:** `PURCHASE-ORDER HYBRID ORIGIN — F1 FORWARD CORRECTION
  IMPLEMENTATION R1` is `CLOSED / ACCEPTED_WITH_NONBLOCKING_BASELINE_TEST_DEBT`.
  Accepted technical commits: `463cafbdd4816ff1093b3086dd71d3d6e70b3479` and
  `680cff136a3294ae9a345fc8f91f02e246891eef`; final technical closeout HEAD:
  `1ea4a509c069983732af86130d0092b6c1d96e2b`.
- **Accepted evidence and boundaries:** `db/74_ordem_compra_hybrid_origin_forward_correction.sql`
  is implemented and verified locally only. It was not applied to staging. The
  normalized broader-suite failures remain exactly unchanged; the existing
  admin-menu count failure remains pre-existing and nonblocking. No staging
  application, Supabase write, production, `main`, remote change, or push occurred.
- **Disposition:** F2 is authorized as `PURCHASE-ORDER HYBRID ORIGIN — F2
  PEDIDO/INSUMOS UI CUTOVER R1`, subject to its own readiness reconciliation and
  all hard gates in the architect order. C3A remains `IMPLEMENTED / VERIFIED / NOT
  ACCEPTED`. The F2 boundary does not authorize staging application or any later
  C3 phase.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F2 PEDIDO/INSUMOS UI CUTOVER R1

- **Readiness / technical commit:** reconciliation returned
  `READY_FOR_F2_IMPLEMENTATION`. Technical commit
  `577921150ac5a478294f28b1c8c3501dad23dbbb` installs the admin route
  `#/pedidos/:pedidoId/insumos`, loaded by
  `js/screens/pedido-insumos-distribuicao.js`; Pedido detail and the OP summary
  link to it contextually.
- **Ownership and command contract:** the screen reads the existing authenticated
  canonical need/allocation projections and calls only
  `definir_alocacao_necessidade_compra_fio(BIGINT,BIGINT,NUMERIC,TEXT)`. It sends
  need identity, supplier identity, absolute target, and a client command key;
  it never sends Pedido, OP, order, item, material, color, or authoritative item
  quantity. OP-origin needs display server-derived OP provenance read-only;
  shared Pedido-origin needs display `Pedido compartilhado` with no OP selector.
  A modal keeps one generated key through exact/uncertain-response retries and
  creates a new key only for a later intentional action. The UI maps F1 business
  errors explicitly, including authorization, missing need/supplier, invalid or
  excessive target, frozen state, idempotency conflict, provenance, concurrency,
  and cleanup conflicts.
- **Cutover:** purchase-order list/detail screens retain consultation, lifecycle,
  receipt/history, cancellation, and navigation to the owning Pedido. They no
  longer expose `Nova ordem`, manual item writes, or allocation mutation. OP no
  longer assigns a purchasing supplier and links to the Pedido-owned surface;
  unrelated legacy receipt behavior remains intact. No new stepper stage or
  migration was added.
- **Verification:** JavaScript syntax checks and focused
  `pedido-insumos-distribuicao`, purchase-order, OP, and router tests pass
  `139/139`; `git diff --check` passes. Static searches confirm order-first
  writers and the OP purchasing assignment call are absent. Parallel broader-suite
  runs against the F1 closeout worktree and F2 both report 133 pre-existing
  failures; failure identities are not stable under the suite's parallel runner,
  and the serial normalization attempt exceeded the 120-second local limit.
- **Boundary / status:** `IMPLEMENTED / VERIFIED LOCALLY / AWAITING ARCHITECT
  REVIEW`. No staging application, Supabase write, production, `main`, remote
  change, or push occurred. `db/74` remains unapplied to staging. C3A remains
  implemented and verified but not accepted. Next authorizable action: an
  architect-reviewed, separately authorized integrated F1+F2 staging deployment
  and validation.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F2 ARCHITECT ACCEPTANCE REGISTRATION R1

- **Architect ruling:** `PURCHASE-ORDER HYBRID ORIGIN — F2 PEDIDO/INSUMOS UI CUTOVER
  R1` is `CLOSED / ACCEPTED_LOCALLY_WITH_INTEGRATED_STAGING_VALIDATION_REQUIRED`.
- **Accepted commits and evidence:** technical commit
  `577921150ac5a478294f28b1c8c3501dad23dbbb`; documentation closeout commit
  `911b7985297d3b33b4fbf4cf3575a39b8440ff42`; focused F2/Pedido/OP/order/router
  result `139/139 PASS`.
- **Pending integrated evidence:** browser validation and staging application remain
  pending. The 133 broader-suite failures are preserved as pre-existing baseline
  debt; deterministic serial comparison of their identities remains incomplete and
  must not be represented as exact identity proof.
- **Authorization:** `PURCHASE-ORDER HYBRID ORIGIN — F3 INTEGRATED STAGING DEPLOYMENT
  AND AUTHENTICATED VALIDATION R1` is authorized against development/staging project
  `ucrjtfswnfdlxwtmxnoo`, subject to contemporary reconciliation and the explicit
  readiness gate. C3A remains implemented and verified but not accepted.
- **Boundary:** this acceptance does not authorize production, `main`, the prohibited
  project, native-emission activation, C3A activation/acceptance, C3B, or any later
  phase.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3 PARTIAL STAGING CHECKPOINT — HARD STOP

- **Readiness:** `READY_FOR_F3_STAGING_DEPLOYMENT`. Branch `dev`; initial HEAD
  `911b7985297d3b33b4fbf4cf3575a39b8440ff42`; F2 acceptance-registration commit
  `8214ab7b4e7c185d6f4501a593fcaa836ad65d1b`; required lineage anchor
  `361d0f77388b0adac9b83997707cd49df938e4dd` confirmed.
- **Staging migration:** exact checked-out `db/74` applied to
  `ucrjtfswnfdlxwtmxnoo` as `20260719215401 /
  74_ordem_compra_hybrid_origin_forward_correction`. An initial transport-truncated
  submission failed inside the migration transaction and left no history/object
  residue; the complete 50,036-byte file then applied successfully.
- **Preservation and authority:** every recorded business table count, material total,
  and stable row hash is identical before/after. The command journal exists empty;
  allocation identity is `(item_id, necessidade_id)`; the need-first RPC and all
  accepted guards are installed. `authenticated` retains only the accepted
  need-first/sync/cancel/receipt/reversal/preview surfaces; obsolete manual/item-first
  and independent remover writers, native emission, and C3A import are owner-only.
  C3A remains `legacy_active / not_started`, with zero import/baseline rows.
- **Staging application:** exact committed tree
  `8214ab7b4e7c185d6f4501a593fcaa836ad65d1b` deployed without Git push to Vercel
  preview `dpl_7QGBHzW8MoE4sPVVuGdFrv9Ci7iP`, URL
  `inttracker-5o6qxsrxz-inttex.vercel.app`, `READY`, target `preview`.
- **Hard stop:** the deployment URL, generated alias, and `dev` preview alias all
  redirect to Vercel Authentication. The controlled browser has no authenticated
  Vercel session. Per the order, no workaround, fixture, or business-data mutation
  was attempted. Authenticated browser/API, PRE-PROD, Phase C, focused post-deploy,
  and broader-suite comparison remain pending and are not claimed as passed.
- **Residue and boundaries:** fixture residue is zero because no fixture was created.
  Production `gqmpsxkxynrjvidfmojk`, prohibited project
  `bhgifjrfagkzubpyqpew`, `main`, native emission, and C3A activation/acceptance were
  not accessed. Next authorized action: architect authenticates the preserved
  controlled-browser Vercel login, then instructs Codex to resume F3 at the
  authenticated-browser gate without reapplying `db/74` or redeploying by default.

## 2026-07-19 — PURCHASE-ORDER HYBRID ORIGIN — F3R1 STAGING DATABASE/API AND PHASE C CHECKPOINT — HARD STOP

- **Starting state:** branch `dev`, HEAD
  `52cc62f966e32ea61260b63aa1a299fbea876566`; modified `.gitignore`, untracked
  `AGENTS.md`, empty index, and no `index.lock` preserved.
- **Database verification:** staging `ucrjtfswnfdlxwtmxnoo` contains exactly one
  `20260719215401 / 74_ordem_compra_hybrid_origin_forward_correction` and no later
  purchase-order migration. The checked-out command journal, need-first RPC
  signature/body, allocation identity, provenance/quantity/freeze guards,
  nullable-OP Phase C replacements, and accepted effective ACL matrix match.
- **Data preservation:** recorded purchase-order, need, allocation, item, receipt,
  ledger, movement, cutover, and inventory counts/totals/stable hashes match the
  post-`db/74` baseline. C3A remains `legacy_active / not_started`; native emitted
  orders remain zero.
- **Rollback-only validation:** a canonical-domain fixture passed OP-origin and
  shared Pedido-origin absolute-target create/increase/reduce/zero, draft/item
  reuse, server-derived provenance, derived item quantity, duplicate prevention,
  exact replay, conflicting-key rejection, journal survival through cleanup,
  post-emission freeze, ACL denial, receipt, reversal, excess, and nullable-OP
  ledger/movement behavior. Transaction rollback left zero fixture residue.
- **Revalidation result:** `PRE-PROD HYBRID ORIGIN REVALIDATION: PASS` and `PHASE C
  HYBRID PROVENANCE REVALIDATION: PASS` on read-only and rollback evidence. These
  results do not activate or accept C3A.
- **Regression evidence:** focused scope produced 430 tests, 428 passed, with two
  unchanged-HEAD baseline failures (obsolete OP purchasing-supplier expectation and
  stale admin-menu count). Two broader parallel runs each produced 3,906 total,
  3,773 passed, and 133 failed with the same observed normalized failure-identity
  SHA-256 `a6ec3d6a4045763291ce30b48a1237c7695871b7534cf839229611f07cfb0dd2`.
  Deterministic serial identity is not claimed; new attributable failures: zero.
- **Hard stop:** committed multi-session staging concurrency remains unproved. A
  successful committed synthetic command must retain its actor/key in the immutable
  journal even after zero-target cleanup, so it cannot meet the mandatory
  zero-residue policy; no canonical retained staging fixture exists. The accepted
  isolated F1 distinct-session race matrix remains valid but is not silently
  substituted for the specifically requested committed staging proof.
- **Boundaries and next action:** Vercel/browser, production, `main`, remotes, push,
  the prohibited project, native emission activation, and C3A execution were not
  accessed. Next authorizable action: architect disposition of the concurrency
  evidence boundary—accept the isolated F1 race matrix plus F3R1 staging evidence,
  or authorize an explicit retained-fixture/journal-residue policy. C3A disposition
  remains deferred until F3R1 can close.
