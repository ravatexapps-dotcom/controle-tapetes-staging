# HANDOFF OPERACIONAL ATIVO

- **Frente:** G28 — D5-B3 remove local decision status overrides — `CLOSED / ACCEPTED`
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **HEAD:** `3532aa8417281fbc0f143963a1e7ef44b73cc2e7` — `G28-B5-D5-B3: remove local decision status overrides`
- **Estado:** `G28-B5-D5-B3 — CLOSED / ACCEPTED`.
- **Manifesto técnico:** `js/screens/documentos-recebidos.js`, `tests/documentos-recebidos-source-boundary.test.js`, `tests/documentos-recebidos-status-overrides-removal.test.js`.
- **Contrato final:** zero runtime `statusOverrides` e zero estado paralelo equivalente; falhas locais de save/remove exibem erro explícito; somente a persistência real determina o estado; sucesso rerenderiza a partir dela.
- **Proveniência preservada:** `manual`/`legacy` permanecem locais; Supabase permanece canônico/cloud-only; unknown, ausente, inválido, vazio, `null` e `g22-auto` permanecem fail-closed.
- **Validação:** gates prescritos verdes; gate focado final 26/26; node checks e diff checks passaram; revisão independente `APPROVE`; code-health delta `+13/-12`.
- **Nenhum acesso remoto:** sem staging, produção, Supabase, SQL, migration ou push.
- **D5-B4:** permanece não autorizada e não iniciada.
- **Próxima fase nomeável:** `G28-B5-D5-B4 — BLOCK LEGACY DECISION RPC RUNTIME CONSUMERS`; não criar nem iniciar.

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
