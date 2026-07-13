# HANDOFF OPERACIONAL ATIVO

- **Frente ativa:** G28 — technical evidence reader aceito; próxima fase requer decisão de arquiteto
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **Fase aceita mais recente:** `G28-B3-B6-B — CURRENT TECHNICAL EVIDENCE ADMIN READER` — `CLOSED / ACCEPTED`
- **Commit técnico:** `6ade74fd6b8584320dbf12df1dbf334aeabbc8b6` — `Read current technical evidence in document reader`
- **Arquivos alterados:** somente `js/documents-supabase-reader.js` e `tests/documents-supabase-reader.test.js`
- **Contrato reader estável:**
  - interface pública: `window.RAVATEX_DOCUMENTS.loadReceivedDocumentsFromSupabase()` (preservada)
  - attachment interno: `_ravatex_technical_evidence`
  - fonte remota: `public.document_technical_evidences`
  - acesso: admin autenticado direto, RLS existente
  - versão: corrente (`evidence_version` highest valid positive numeric)
  - estados: `available`, `missing`, `invalid` distintos; falha remota ≠ `missing`
  - sem fallback para evidência mais antiga; sem evidência histórica
- **Validação:** `node --check` passou; 39 reader tests aprovados; 91 screen smoke tests aprovados; `git diff --check` limpo
- **Revisão independente:** APPROVE
- **Baseline Git pré-closeout:** `6ade74fd6b8584320dbf12df1dbf334aeabbc8b6`; worktree/staging limpos; zero untracked
- **Produção:** não acessada.
- **Push:** não executado.
- **Code-health watch:** reader 268 linhas; reader test 618 linhas; qualquer expansão funcional substancial exige nova revisão de coesão antes de adicionar lógica substancial a qualquer um dos dois arquivos.
- **Arquivos autoritativos obrigatórios antes de qualquer próxima implementação:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `docs/DOCUMENTATION_INDEX.md`
  - `docs/governance/DOCUMENTATION_MODEL.md`
  - `docs/ledgers/G28_LEDGER.md`
  - `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  - `docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md`
  - `docs/architecture/CODE_HEALTH_RULES.md`
  - `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
  - `docs/architecture/PEDIDO_PRODUCTION_FLOW_BACKLOG.md`
  - `services/documents-ingestor/PROJECT_STATE.md`
- **Próxima fase substantiva:** `NEXT SUBSTANTIVE PHASE: REQUIRES ARCHITECT DECISION`.
  O plano mestre autoritativo (`DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`) está inconsistente com a baseline aceita B3-B5-C e B6-B (ainda nomeia B3-B5-B como `NOT STARTED` e posiciona diferentemente os estágios genéricos posteriores), enquanto os demais planos/backlogs obrigatórios cobrem preocupações separadas de Pedido/OP e produção. Os planos/backlogs autoritativos não sequenciam univocamente um sucessor após a baseline B6-B aceita; um arquiteto deve reconciliar o plano/backlog G28 antes de uma nova fase de implementação.
- **Restrições explícitas:**
  - `Do not reopen G28-B3-B6-B.`
  - `Do not add UI, historical evidence, human decisions, database changes, or Documents Ingestor changes without a new explicit phase.`
  - Não editar snapshots; não aplicar migrations pendentes em lote; não acessar produção/origin; não fazer push.
- **Links canônicos:** estado → `PROJECT_STATE.md`; ledger → `docs/ledgers/G28_LEDGER.md`; contexto do componente → `services/documents-ingestor/PROJECT_STATE.md`.

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
