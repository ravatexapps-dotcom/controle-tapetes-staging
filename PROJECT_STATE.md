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
- **Última fase aceita:** `G28-B4 — DOCUMENT QUEUE` — `CLOSED / ACCEPTED`
- **Commit técnico aceito:** `f007ab3c733d584e9da57c8436294d9b42ea9652` — `Consolidate document queue file access`
- **Cadeia B4 aceita:**
  - `50f543ff8c6917599cf35768e9e84531532bf177` — Add pure document queue read model
  - `d0f0424924b57b3754fe87a0be0336292f5c2b74` — Bind received documents queue filters
  - `948213885506fdb6e41cfe10451af21e006ce441` — Distinguish missing Pedido link availability
  - `2958e6451b49986ac1af414e62cd31df698dcaa5` — Show document queue state indicators
  - `f007ab3c733d584e9da57c8436294d9b42ea9652` — Consolidate document queue file access
- **Escopo funcional:** pure queue read model com eixos source/evidence/review/Pedido; estados Pedido `confirmed_pedido_reference`, `suggested_pedido`, `no_confirmed_link`, `unavailable`; OP e duplicate indisponíveis; alertas determinísticos display-only; sem Supabase/DOM/network/write no read model; binding/filtros/indicadores aceitos; gate exclusivo por `queueItem.source_file.state`; ações Drive preservadas apenas após `drive_available`; spans unsupported/missing explicativos e não interativos; validation informacional; sem action/modal/write/RPC/backend/Gmail/filesystem
- **Subfases aceitas:** B4-A, B4-B1, B4-B2, B4-B1-R1, B4-B3, B4-B4
- **Validação focada:** model 48, queue UI 58, decisions 20, reader 39, screen smoke 133, import received 36, import UI 40, router 43; 3 node checks; diff check limpo (apenas avisos pré-existentes LF→CRLF)
- **Validação visual:** fixture local in-memory; ambas as posições do wrapper horizontal intencional inspecionadas; Drive um Ver e um Baixar apenas; spans unsupported/missing sem clique; wrapping sem clipping; servidor local parado
- **Push:** não executado
- **Débitos não bloqueantes:** `documentos-recebidos.js` excepcionalmente grande; document-row rendering ~151 linhas, candidato a code-health futuro; sem refatoração autorizada; semântica atual exige mudanças de nomenclatura testadas deliberadamente; B4 não implementa modal de validação humana, novas writes de decisão, linking canônico Pedido/OP, detecção de duplicatas, histórico de evidência, correção/revogação, backends Gmail/novos arquivos
- **Próxima fase:** `G28-B5 — HUMAN VALIDATION CONTRACT AND MODAL`
- **Próxima ação autorizada:** `G28-B5-A — Human validation, persistence, and linking boundary diagnosis`

### Débitos relevantes

- Migration 49 — aplicada e verificada em staging; não aplicada em produção.
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
