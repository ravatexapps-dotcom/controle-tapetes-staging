# HANDOFF OPERACIONAL ATIVO

- **Frente:** G28 — D5-B2 local decision boundary and explicit legacy loader/bridge provenance — `CLOSED / ACCEPTED_WITH_PREEXISTING_TEST_DEBT`
- **Workspace:** `D:\OneDrive\Programação\Ravatex\controle-tapetes-g28`
- **Branch:** `work/g28-document-qualification`
- **HEAD:** `c51542244ab6e3c683a1a0a54fcc634df6f7478d` — `G28-B5-D5-B2: require explicit legacy source for local decisions`
- **Estado:** `G28-B5-D5-B2 — CLOSED / ACCEPTED_WITH_PREEXISTING_TEST_DEBT`; auditoria V1 concluída.
- **Manifesto técnico (8 arquivos):** `js/documents-ingestor-import-received.js`, `js/documents-ingestor-loader.js`, `js/documents-ingestor.js`, `js/screens/documentos-recebidos.js`, `tests/documentos-recebidos-source-boundary.test.js`, `tests/documents-ingestor-loader.test.js`, `tests/documents-ingestor-local-decision-boundary.test.js` e `tests/g14-c-bridge-smoke.test.js`.
- **Expansão autorizada e limitada:** loader/bridge JSONL passou a projetar `_ravatex_source` por documento para que Pedido Detail receba `rdoc` materializado; não houve alteração no Pedido Detail, reader Supabase, RPCs ou banco.
- **Contrato final:** helpers locais exigem provenance explícita. `manual`/`legacy` permitem decisões locais; `supabase`, `unknown`, source ausente ou inválido falham fechados. ID isolado não lê decisão local sem source legacy explícita. Source ausente, inválido e `g22-auto` materializam `unknown`.
- **Fluxos:** Supabase preserva status canônico e não acessa o mapa local; `manual`/`legacy` explícitos preservam o fluxo local temporário; `unknown` não oferece fallback local nem `statusOverrides`. `statusOverrides` permanece temporariamente restrito ao fluxo legacy.
- **Validação:** todos os gates B2 verdes; revisão independente read-only retornou `APPROVE`. Dívidas preexistentes reproduzidas no baseline: 2 falhas em `tests/documents-ingestor.test.js` e 15 falhas em `tests/g14-c-bridge-smoke.test.js`; nenhuma regressão nova B2.
- **Nenhum acesso remoto:** sem staging, produção, Supabase, SQL, migration ou push.
- **Próxima fase autorizável:** `G28-B5-D5-B3 — REMOVE STATUSOVERRIDES`; não criar nem iniciar. D5-B4 permanece não autorizada.

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
