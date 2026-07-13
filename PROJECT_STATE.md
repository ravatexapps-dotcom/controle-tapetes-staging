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
- **Última fase aceita:** `G28-B3-B6-B` — `CLOSED / ACCEPTED`
- **Commit documental de E1:** `793185701a4c09917354330f2596e2991e8b1dfc`
- **Fase técnica mais recente:** `G28-B3-B6-B` — `CURRENT TECHNICAL EVIDENCE ADMIN READER`
- **Commit técnico:** `6ade74fd6b8584320dbf12df1dbf334aeabbc8b6` — `Read current technical evidence in document reader`
- **Migration 49:** `APPLIED IN STAGING` / `VERIFIED IN STAGING`; `NOT APPLIED IN PRODUCTION`.
- **Controle reader:** carrega evidência técnica corrente persistida via `window.RAVATEX_DOCUMENTS.loadReceivedDocumentsFromSupabase()`;
  interface pública inalterada; attachment interno em `_ravatex_technical_evidence`;
  somente versão corrente (`evidence_version`); estados distintos `available` / `missing` / `invalid`;
  falha de leitura remota ≠ `missing`; versão corrente inválida não faz fallback para evidência mais antiga.
- **Evidência histórica:** não carregada.
- **UI:** inalterada; sem renderização.
- **Database:** inalterada; Documents Ingestor inalterado.
- **Writes/RPC:** nenhum; sem segundo client Supabase; sem fonte paralela.
- **Validação:** `node --check` passou; 39 reader tests aprovados; 91 screen smoke tests aprovados; diff checks passaram.
- **Revisão independente:** APPROVE.
- **Produção:** não acessada.
- **Code-health watch:** reader 268 linhas; reader test 618 linhas; qualquer expansão funcional substancial exige nova revisão de coesão antes de adicionar lógica substancial a qualquer um dos dois arquivos; isto não é um defeito ou bloqueador.
- **Próxima fase:** `NEXT SUBSTANTIVE PHASE: REQUIRES ARCHITECT DECISION`.
  O plano mestre autoritativo (`DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`) está inconsistente com a baseline aceita B3-B5-C e B6-B (ainda nomeia B3-B5-B como `NOT STARTED` e posiciona diferentemente os estágios genéricos posteriores), enquanto os demais planos/backlogs obrigatórios cobrem preocupações separadas de Pedido/OP e produção. Os planos/backlogs autoritativos não sequenciam univocamente um sucessor após a baseline B6-B aceita; um arquiteto deve reconciliar o plano/backlog G28 antes de uma nova fase de implementação.

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
