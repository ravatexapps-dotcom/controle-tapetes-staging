# ESTADO ATUAL CANÔNICO

Este bloco é a única fonte de estado operacional atual por frente.
HEAD, working tree, staging e divergência devem ser consultados diretamente no Git.
O conteúdo histórico abaixo não determina o estado atual.

## Bloco da frente ativa

### Document Qualification / Documents Ingestor — G28

- **Frente:** Document Qualification / Documents Ingestor — G28
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **Remoto permitido:** nenhum push sem autorização expressa nesta cadeia
- **Última fase aceita:** `G28-B6 — CLOSED / ACCEPTED_WITH_NONBLOCKING_TEST_DEBT` (aceite arquitetural explícito em 2026-07-14; supersede intencionalmente o checkpoint anterior que descrevia B6 como READY FOR ARCHITECT ACCEPTANCE). Commit técnico `b2f180ed0e6f1c2ee6c02881d0199d1bfaf29366`; closeout de verificação em staging `b130db44d32718ddf6d3e2bffb1439dac3a1948f`; staging `ucrjtfswnfdlxwtmxnoo`; produção `bhgifjrfagkzubpyqpew` não acessada.
- **Fase ativa:** `G28-B7 — exibição nas superfícies — AUTHORIZED`. Verificação funcional de B6 foi executada diretamente em staging `ucrjtfswnfdlxwtmxnoo`: matriz RPC 20/20, propriedade dupla preservada, wrapper atômico com rollback PostgreSQL provado, reader/adapter verificados contra a projeção canônica e fallback `supabase_unavailable` exercitado no frontend local configurado para staging. Não houve correção técnica.
- **Débitos não bloqueantes aceitos em B6:** (1) smoke autenticado de browser permanece pendente; (2) duas expectativas obsoletas permanecem em `tests/documentos-recebidos-queue-ui.test.js`; (3) o grafo sintético de auditoria em staging permanece preservado sob `ON DELETE RESTRICT` e documentado.
- **Próxima ação autorizável:** implementar `G28-B7` (exibição nas superfícies). Nenhuma fase posterior autorizada; sem push; produção proibida.
- **Contrato B6 aceito:** Documento→Pedido 0..1; Documento→OP 0..N; revisão canônica tipada/versionada; `document_candidates.pedido_id` e `document_events.pedido_id` mantidos sob propriedade do Ingestor; `pedido_manual` permanece sugestão.
- **Fases planejadas, não iniciadas (deferred):** G28-B8 (correção/revogação/restauração/auditoria) — aguarda B7.
- **Plano mestre reconciliado:** `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md` (G28-PLAN-R1 2026-07-14)
- **Subfases B5-D5 aceitas:** B5-B1 (idempotent decision command contract), B5-B2 (migration applied/verified staging), D4-R1 (canonical runtime modules loaded), D5-A (source boundary diagnosis), D5-B1 (explicit source classification), D5-B2 (source-gated local decision helpers), D5-B3 (statusOverrides removal), D5-B4 (legacy decision RPC runtime removal), D5 (consolidated regression GREEN). Ver ledger G28 para detalhes de commits e validação.
- **Push:** não executado
- **Produção:** projeto `bhgifjrfagkzubpyqpew` não acessado
- **Runtime boundaries:** canonical register/undo adapters and RPCs preserved; SQL `decidir_documento` preserved (not removed, not migrated); no `statusOverrides` or parallel state; no `decideDocumentInCloud`; explicit manual/legacy local domain temporarily supported; Supabase/unknown/absent/null/invalid/g22-auto fail-closed; no migration, conversion, or removal of legacy domain authorized.

### Débitos relevantes

- Migrations 49 e 50 — aplicadas e verificadas em staging; não aplicadas em produção por esta cadeia.
- Evoluções posteriores de UI/runtime, destino da RPC legada e qualquer linking/revogação requerem nova decisão arquitetural.
- Push — não autorizado nesta cadeia.

### Referência histórica

- Preservação pré-modelo: `docs/legacy/pre-model/MANIFEST.md`
- Ledger da frente G28: `docs/ledgers/G28_LEDGER.md`

### Links obrigatórios

- Modelo de governança documental: `docs/governance/DOCUMENTATION_MODEL.md`
- Árbitro de autoridade documental: `docs/DOCUMENTATION_INDEX.md`
- Plano mestre G28: `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
- Plano Pedido/OP/Movimentação/Documentos: `docs/architecture/PEDIDO_OP_MOVIMENTACAO_DOCUMENTOS_PLANO.md`
- Estado local do Ingestor (contexto técnico): `services/documents-ingestor/PROJECT_STATE.md`

# HISTÓRICO LEGADO PRÉ-MODELO — ARQUIVADO

O conteúdo histórico completo que existia neste arquivo antes da
compactação foi preservado, byte a byte, em:

`docs/legacy/pre-model/PROJECT_STATE_FULL_SNAPSHOT.md`

Manifesto de integridade:

`docs/legacy/pre-model/MANIFEST.md`

Commit de origem do snapshot:

`08b9af5e251de48e938600e5e4b4214e4d1e824e`

SHA-256 do snapshot completo:

`7cacddd59c5b2fe9bae1add1a54a3433c370ccdad713bbd4010a1d11f1b39a98`

O snapshot não é fonte de estado atual e não deve ser editado nem receber
novos closeouts.

A evolução histórica estruturada será registrada em ledger próprio da
frente em fase posterior.

Esta seção não deve acumular novo conteúdo histórico.
