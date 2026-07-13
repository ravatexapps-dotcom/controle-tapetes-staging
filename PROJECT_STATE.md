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
- **Última fase aceita:** `G28-DOCS-B3-E1` — `CLOSED / ACCEPTED`
- **Commit documental de E1:** `793185701a4c09917354330f2596e2991e8b1dfc`
- **Fase técnica:** `G28-B3-B5-C` — `LOCAL IMPLEMENTATION ACCEPTED / STAGING BLOCKED`
- **Commit técnico:** `3465405db42bfedd0c1f2c479f9be61c46078d87`
- **Gate de staging bloqueado:** a identidade do endpoint MCP é
  `ucrjtfswnfdlxwtmxnoo`, porém a configuração local do writer está sem
  project ref, URL, service-role key e writer habilitado. A guarda
  `SUPABASE_PROJECT_REF == ucrjtfswnfdlxwtmxnoo` não pode ser comprovada na
  CLI; nenhum SQL, RPC, apply ou smoke foi iniciado.
- **Migration 49:** versionada; `NOT APPLIED IN STAGING`; `NOT APPLIED IN PRODUCTION`.
- **Supabase:** identidade do endpoint de staging verificada sem SQL/RPC;
  produção não acessada.
- **Próxima ação:** resolver exclusivamente o gate de configuração de staging e
  então retomar `G28-B3-B5-C` a partir do apply isolado da migration 49 e do
  smoke controlado. Não iniciar `G28-B3-B6` antes dessa validação.

### Débitos relevantes

- Gate de configuração local exclusiva de staging para o writer ainda precisa
  ser resolvido antes de qualquer SQL/RPC.
- Migration 49 — versionada; não aplicada em staging nem em produção.
- Apply isolado, smoke idempotente e cleanup de staging permanecem pendentes.
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
