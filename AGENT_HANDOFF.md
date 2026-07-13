# HANDOFF OPERACIONAL ATIVO

- **Frente ativa:** G28 — Documentation Source-of-Truth Refactor
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **Objetivo imediato:** concluir o gate de `G28-DOCS-B3-C`, que substitui
  os históricos congelados dos arquivos operacionais por referências aos
  snapshots imutáveis já verificados.
- **Estado de entrada:**
  - `G28-DOCS-B1` — `CLOSED / ACCEPTED`
  - `G28-DOCS-B2` — `CLOSED / ACCEPTED`
  - `G28-DOCS-B2-R1` — `CLOSED / ACCEPTED`
  - `G28-DOCS-B2-CLOSEOUT` — `CLOSED / ACCEPTED`
  - `G28-DOCS-B3-B0` — `CLOSED / ACCEPTED`
  - `G28-DOCS-B3-C` — `EM EXECUÇÃO / AGUARDANDO GATE`
  - `G28-B3-B5-C` — `SUSPENDED`
- **Arquivos obrigatórios:**
  - `docs/governance/DOCUMENTATION_MODEL.md`
  - `docs/DOCUMENTATION_INDEX.md`
  - `PROJECT_STATE.md`
  - `AGENT_HANDOFF.md`
  - `services/documents-ingestor/PROJECT_STATE.md`
- **Restrições:**
  - não editar os snapshots;
  - não criar ledger nesta fase;
  - não alterar planos ou índices;
  - não retomar `G28-B3-B5-C`;
  - não aplicar migration 49;
  - não acessar Supabase real;
  - não fazer push.
- **Próxima entrega:**
  - gate do arquiteto para `G28-DOCS-B3-C`;
  - após aceite, definição e criação dos ledgers estruturados por frente.
- **Links canônicos:**
  - estado atual → `PROJECT_STATE.md`
  - modelo documental → `docs/governance/DOCUMENTATION_MODEL.md`
  - autoridade documental → `docs/DOCUMENTATION_INDEX.md`
  - plano G28 → `docs/architecture/DOCUMENTOS_VALIDACAO_VINCULOS_E_EVOLUCAO_PLANO.md`
  - preservação pré-modelo → `docs/legacy/pre-model/MANIFEST.md`

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
