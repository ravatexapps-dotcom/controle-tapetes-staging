# HANDOFF OPERACIONAL ATIVO

- **Frente:** G28 — D4-R1 canonical decision runtime modules correction — `CLOSED / ACCEPTED`
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **HEAD:** `425172a95cbf2b340aa5f72110d317917a79e1f6` — `Load canonical document decision runtime modules`
- **Correção técnica:** D4-V1 (`ae907b8`) foi PATCH COMMITTED / NOT ACCEPTED — auditoria read-only detectou `documents-decision-command.js`, `documentos-recebidos-decision-modal.js` e `documents-decision-controller.js` ausentes no index.html. R1 (`425172a9`) carrega os três módulos estaticamente no index.html e reordena adapter/reader: `documents-supabase-decisions → documents-supabase-reader → documents-decision-command → documentos-recebidos-decision-modal → documents-decision-controller → documentos-recebidos`.
- **Smoke test:** inspeciona index.html real para presença exactly-once e ordem; sem import dinâmico.
- **Arquivos do commit técnico:** `index.html` e `tests/documentos-recebidos.smoke.js`.
- **Validação:** `node --check` em 4 arquivos; 11 integration, 135 screen smoke, 58 queue UI, 68 controller, 41 modal, 96 lifecycle, 59 adapter, 46 reader, 23 migration contract, 48 queue read model = 585 pass/0 fail; `git diff --check` aprovado com aviso LF→CRLF não bloqueante; revisão independente read-only OpenCode `opencode-go/deepseek-v4-flash` retornou `APPROVE`, sem mutação.
- **Nenhum acesso remoto:** staging não acessado, produção não acessada, push não executado.
- **Riscos residuais:** aviso Git LF→CRLF não bloqueante; D5 não iniciado e não autorizado.
- **Próximo passo:** D5 e quaisquer mudanças remotas, de banco, linking, undo/revogação ou ampliação de UI permanecem sem autorização — não iniciar sem nova decisão explícita.

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
