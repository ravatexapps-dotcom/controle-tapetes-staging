# HANDOFF OPERACIONAL ATIVO

- **Frente ativa:** G28 — G28-B4 closed and accepted; próxima fase B5 — human validation contract and modal
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **Fase aceita mais recente:** `G28-B4 — DOCUMENT QUEUE` — `CLOSED / ACCEPTED`
- **Commit técnico aceito:** `f007ab3c733d584e9da57c8436294d9b42ea9652` — `Consolidate document queue file access`
- **Cadeia B4 aceita:**
  - `50f543ff8c6917599cf35768e9e84531532bf177` — Add pure document queue read model
  - `d0f0424924b57b3754fe87a0be0336292f5c2b74` — Bind received documents queue filters
  - `948213885506fdb6e41cfe10451af21e006ce441` — Distinguish missing Pedido link availability
  - `2958e6451b49986ac1af414e62cd31df698dcaa5` — Show document queue state indicators
  - `f007ab3c733d584e9da57c8436294d9b42ea9652` — Consolidate document queue file access
- **Contratos estáveis:** queue read model puro, sem Supabase/DOM/network/write; binding/filtros aceitos; indicadores; drive action gate; sem action/modal/write/RPC/backend/Gmail/filesystem
- **Validação:** model 48, queue UI 58, decisions 20, reader 39, screen smoke 133, import received 36, import UI 40, router 43; 3 node checks; diff check limpo (apenas avisos pré-existentes LF→CRLF)
- **Baseline Git pré-closeout:** `f007ab3c733d584e9da57c8436294d9b42ea9652`; worktree/staging limpos; zero untracked
- **Produção:** não acessada
- **Push:** não executado
- **Próxima fase:** `G28-B5 — HUMAN VALIDATION CONTRACT AND MODAL`
- **Próxima ação autorizada:** `G28-B5-A — Human validation, persistence, and linking boundary diagnosis`
- **Diagnóstico B5-A — perguntas obrigatórias:**
  - Quais writes remotos de decisão existem hoje e qual o contrato de cada um?
  - Quais as responsabilidades do modal de validação humana (escopo vs. B5 writes)?
  - Quais writes B5 persistirão (decisão, vínculo, justificativa)?
  - Qual o linking canônico Pedido/OP em B6 e como B5 o prepara?
  - Quais os limites entre accepted/rejected/justification/correction/revocation?
  - Quais ações de decisão legadas devem ser preservadas, migradas ou retiradas?
  - Qual a exata propriedade de UI/persistence/RPC/audit entre as camadas?
- **Hard prohibitions:**
  - `Do not implement B5.`
  - `Do not modify code, UI, tests, schema, Supabase, or production.`
  - `Do not reopen G28-B4.`
  - `Do not push.`
- **Arquivos autoritativos obrigatórios antes da próxima implementação:**
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `docs/DOCUMENTATION_INDEX.md`
  - `docs/governance/DOCUMENTATION_MODEL.md`
  - `docs/ledgers/G28_LEDGER.md`
  - `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  - `docs/architecture/DOCUMENTS_INGESTOR_CONSUMER_DESIGN.md`
  - `docs/architecture/CODE_HEALTH_RULES.md`
- **Links canônicos:** estado → `PROJECT_STATE.md`; ledger → `docs/ledgers/G28_LEDGER.md`

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
