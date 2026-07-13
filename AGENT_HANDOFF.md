# HANDOFF OPERACIONAL ATIVO

- **Frente ativa:** G28 — evidence sync / gate de staging
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **Estado aceito:**
  - `G28-DOCS-B3-E1` — `CLOSED / ACCEPTED`;
    commit `793185701a4c09917354330f2596e2991e8b1dfc`.
  - `G28-B3-B5-C` — implementação local aceita;
    commit técnico `3465405db42bfedd0c1f2c479f9be61c46078d87`.
  - revisão independente aprovada; testes focados repetidos após revisão.
- **Bloqueio ativo:** staging não pode ser operado pela CLI porque a
  configuração local do writer não contém project ref, URL, service-role key
  nem writer habilitado. O endpoint MCP identificado é
  `ucrjtfswnfdlxwtmxnoo`, mas a guarda local obrigatória não foi satisfeita;
  nenhum SQL/RPC, apply da migration 49 ou smoke foi executado.
- **Produção:** intocada.
- **Próxima fase substantiva:** resolver o gate de staging e retomar
  `G28-B3-B5-C` exclusivamente no apply isolado de migration 49 e smoke com
  cleanup comprovado. `G28-B3-B6` permanece bloqueada.
- **Restrições:** não editar snapshots; não aplicar migrations pendentes em
  lote; não acessar produção/origin; não fazer push.
- **Links canônicos:** estado → `PROJECT_STATE.md`; ledger →
  `docs/ledgers/G28_LEDGER.md`; contexto do componente →
  `services/documents-ingestor/PROJECT_STATE.md`.

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
