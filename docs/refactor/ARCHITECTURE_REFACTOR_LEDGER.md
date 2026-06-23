# Architecture Refactor Ledger — Ravatex Controle de Tapetes

> Ledger de fases do refactor arquitetural de
> `D:\OneDrive\Programação\Ravatex\controle-tapetes`.
> Última atualização: 2026-06-23 (HEAD `69c0036`,
> fase `RAVATEX-TAPETES-REFACTOR-STATE-DOCS-B`).

## 1. Premissas corrigidas
- **App estático**, não Next/Vercel.
- `index.html` único + JS clássico + Supabase.
- **Staging separado de produção** (2 repos, 2 refs Supabase).
- GitHub Pages publica no push em `origin/main` (produção).

## 2. Invariantes operacionais
- **Produção só por hostname oficial explícito** (grupoterrabranca.github.io).
- **Staging por padrão** fora de produção (qualquer outro hostname).
- **Write-guard preservado** (`_GUARD_BLOCK_WRITES` em
  `js/supabase-client.js`).
- **Supabase real não acessado em refactors** (todos os testes usam
  `vm.runInContext` + `fakeSupa` mockado).
- **Push só para `staging`** (`git push staging work/app-next:main`).
- **`origin/main` e PR #2 intocados** durante todo o refactor.
- **Sem segredo em relatório/doc** (`service_role`, senha, JWT
  secret, connection string com senha, anon key completa são
  proibidos de aparecer em qualquer artefato versionado).
- **Testes focados por fase** (não rodar suíte completa por padrão).
- **Stage seletivo** em commits (proibido `git add .`).

## 3. Estado inicial do refactor
- **Branch operacional inicial:** `work/app-next` em `e190022` (antes
  do refactor arquitetural o repo já estava em um estado pós-D1 com
  baseline documental, monólito `index.html` intacto).
- **Staging repo:** `ravatexapps-dotcom/controle-tapetes-staging` (ref
  Supabase `ucrjtfswnfdlxwtmxnoo`).
- **Origin repo:** `grupoterrabranca/controle-tapetes` (ref Supabase
  `bhgifjrfagkzubpyqpew`, **produção**).
- **Produção preservada** durante todo o refactor (nenhum push em
  `origin/main`).

## 4. Tabela de fases

| Fase | Commit | Arquivos principais | Testes | Status |
|---|---|---|---|---|
| CONFIG-MODULE-A | `5547e27` | `js/config.js` | focados | aceito |
| SUPABASE-CLIENT-MODULE-A | `6d50d08` | `js/supabase-client.js` | focados | aceito |
| ENV-BANNER-MODULE-A | `1f3238d` | `js/environment-banner.js` | focados | aceito |
| AUTH-MODULE-A | `1b56571` | `js/auth.js` | focados | aceito |
| ROUTER-MODULE-A | `6bb203f` | `js/router.js` | focados | aceito |
| SYSTEM-SCREENS-MODULE-A | `786f6b4` | `js/screens/system-screens.js` | focados | aceito |
| SCREENS-COMMON-MODULE-A | `ed8e75c` | `js/screens/common.js` | focados | aceito |
| CADASTROS-SCREENS-MODULE-A | `dd24365` | `js/screens/cadastros.js` | 295/295 | aceito |
| OPS-LIST-SCREEN-MODULE-A | `d7a8d25` | `js/screens/ops-list.js` | 325/325 | aceito |
| ENTREGA-FORM-HELPER-MODULE-A | `958f244` | `js/screens/entrega-form.js` | 358/358 | aceito |
| ENTREGA-WRITES-MODULE-A | `7ec1721` | `js/screens/entrega-writes.js` | 385/385 | aceito |
| ENTREGA-LATEX-WRITES-MODULE-A | `e190022` | `js/screens/entrega-writes.js` | 400/400 | aceito |
| ENTREGA-CIMA-WRITES-MODULE-A | `70635aa` | `js/screens/entrega-writes.js` | 416/416 | aceito |
| FORNECEDOR-SCREENS-DIAG-A | `70635aa` | read-only (sem commit) | 268/268 | aceito |
| FORNECEDOR-SCREENS-MODULE-A | `4b9ca12` | `js/screens/fornecedor.js` | 290/290 | aceito com ressalvas |
| REFACTOR-STATE-DOCS-A | `3a301cf` | `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` | docs-only | aceito |
| OP-FORM-DIAG-A | (read-only) | `index.html` (análise) | n/a | aceito |
| OP-LATEX-ADMIN-DIAG-A | (read-only) | `index.html` (análise) | n/a | aceito |
| OP-FORM-HELPERS-MODULE-A | `c480324` | `js/screens/op-form-helpers.js` | 36/36 + 24/24 + regressão (163/163) | aceito com ressalva leve |
| OP-ORDER-WRITE-MODULE-A | `ab79f1c` | `js/screens/op-writes.js` | 24/24 + regressão focada | aceito com ressalva leve (contagem de testes reportada inconsistente) |
| OP-FORNECEDOR-WRITE-DIAG-B | (read-only) | `index.html` (análise) | n/a | aceito |
| OP-FORNECEDOR-WRITE-MODULE-A | `1429950` | `js/screens/op-writes.js` | 49/49 + regressão focada | aceito com ressalva leve (contagem de testes reportada inconsistente) |
| OP-LATEX-ADMIN-WRITES-DIAG-A | (read-only) | `index.html` (análise) | n/a | aceito |
| OP-LATEX-ADMIN-MODULE-A | `69c0036` | `js/screens/op-latex-admin.js` | 30/30 + regressão focada (172/172) | aceito com ressalva leve (push teve timeout, concluído com retry) |
| REFACTOR-STATE-DOCS-B | (a criar) | `PROJECT_STATE.md`, `AGENT_HANDOFF.md`, `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md` | docs-only | esta fase |

## 5. Ressalvas processuais aceitas em `FORNECEDOR-SCREENS-MODULE-A` (commit `4b9ca12`)

- **Escopo de testes ampliado para boot chain** em
  `tests/screens-common.smoke.js`, `tests/system-screens.smoke.js`
  e `tests/router.smoke.js`. Todos esses testes precisaram carregar
  o novo `fornecedor.js` no boot para que o `setRoutes` inline
  (que referencia `screenFornecedor*` como bare) não quebrasse com
  `ReferenceError`. A mudança é puramente de boot helpers; nenhuma
  asserção de comportamento foi enfraquecida.
- **Contagem de arquivos no relatório final** da fase
  `FORNECEDOR-SCREENS-MODULE-A` (anterior a este docs-only) estava
  inconsistente quanto ao número total de arquivos alterados
  versus criados. Este ledger registra a contagem corrigida:
  - **2 arquivos criados** (`js/screens/fornecedor.js`,
    `tests/fornecedor-screens.smoke.js`).
  - **8 arquivos modificados** (`index.html`, `tests/entrega-writes.smoke.js`,
    `tests/entrega-form.smoke.js`, `tests/ops-list-screen.smoke.js`,
    `tests/cadastros-screens.smoke.js`, `tests/screens-common.smoke.js`,
    `tests/system-screens.smoke.js`, `tests/router.smoke.js`).
  - **Total:** 10 arquivos (2 criados + 8 modificados) no commit
    `4b9ca12`.
- **Falhas em `tests/index-inline.smoke.js` e parte de
  `tests/write-guard.smoke.js` dependentes de `http.server :8765`**
  verificadas como **pré-existentes** (commits anteriores ao refactor
  arquitetural). Confirmado com `git stash` no commit `70635aa`:
  mesmas 6 falhas em `index-inline` e 17 em `write-guard`. Não
  atribuídas à extração de fornecedor.

## 5b. Ressalvas processuais aceitas em fases recentes (pós-`4b9ca12`)

- **`OP-FORM-HELPERS-MODULE-A` (commit `c480324`)**: o helper
  `disabledAttr` mudou de assinatura de `(node)` para
  `(disabled, node)` para que pudesse viver fora da closure de
  `screenNovaOP` e acessar a flag `readOnly` via parâmetro. Todos os
  call-sites inline foram atualizados para
  `disabledAttr(readOnly, ...)` e os 163 testes focados passaram
  (36 do op-form-helpers, 24 do op-writes inicial, e regressão).
- **`OP-ORDER-WRITE-MODULE-A` (commit `ab79f1c`) e
  `OP-FORNECEDOR-WRITE-MODULE-A` (commit `1429950`)**: o relatório
  final dessas fases teve **contagem de testes reportada de forma
  inconsistente** — usou-se uma "soma geral" em vez da contagem
  exata por suíte. As suítes individuais
  (`tests/op-writes.smoke.js`) passaram individualmente (24/24 e
  49/49 respectivamente, mais regressão focada 100%). Não bloqueante
  para a aceitação das fases.
- **`OP-LATEX-ADMIN-MODULE-A` (commit `69c0036`)**: o push para
  `staging` teve **timeout na primeira tentativa** e foi concluído
  com **retry** usando timeout maior. Conteúdo do commit e
  contagem de testes (30/30 + 172/172 regressão) estavam corretos.
  4 testes em arquivos de regressão
  (`tests/op-writes.smoke.js`, `tests/op-form-helpers.smoke.js`,
  `tests/entrega-writes.smoke.js`, `tests/fornecedor-screens.smoke.js`)
  precisaram ser adaptados para refletir a extração de
  `renderOPLatexAdmin` do inline (esperado, mudança no escopo
  permitido).

## 6. Módulos extraídos (lista canônica)

| Módulo | Commit de extração | Fase |
|---|---|---|
| `js/config.js` | `5547e27` | CONFIG-MODULE-A |
| `js/supabase-client.js` | `6d50d08` | SUPABASE-CLIENT-MODULE-A |
| `js/environment-banner.js` | `1f3238d` | ENV-BANNER-MODULE-A |
| `js/auth.js` | `1b56571` | AUTH-MODULE-A |
| `js/router.js` | `6bb203f` | ROUTER-MODULE-A |
| `js/screens/system-screens.js` | `786f6b4` | SYSTEM-SCREENS-MODULE-A |
| `js/screens/common.js` | `ed8e75c` | SCREENS-COMMON-MODULE-A |
| `js/screens/cadastros.js` | `dd24365` | CADASTROS-SCREENS-MODULE-A |
| `js/screens/ops-list.js` | `d7a8d25` | OPS-LIST-SCREEN-MODULE-A |
| `js/screens/entrega-form.js` | `958f244` | ENTREGA-FORM-HELPER-MODULE-A |
| `js/screens/entrega-writes.js` | `7ec1721` (+ `e190022`, `70635aa`) | ENTREGA-WRITES-MODULE-A (+ LATEX, + CIMA) |
| `js/screens/fornecedor.js` | `4b9ca12` | FORNECEDOR-SCREENS-MODULE-A |
| `js/screens/op-form-helpers.js` | `c480324` | OP-FORM-HELPERS-MODULE-A |
| `js/screens/op-writes.js` | `ab79f1c` (+ `1429950`) | OP-ORDER-WRITE-MODULE-A (+ OP-FORNECEDOR-WRITE-MODULE-A) |
| `js/screens/op-latex-admin.js` | `69c0036` | OP-LATEX-ADMIN-MODULE-A |

### Estado atual de `js/screens/op-writes.js`

Concentra os dois helpers de write de OP extraídos:

- `registrarRecebimentoOrdemFio` (`ab79f1c`,
  OP-ORDER-WRITE-MODULE-A)
- `atribuirFornecedorFioOp` (`1429950`,
  OP-FORNECEDOR-WRITE-MODULE-A)

## 7. Inline remanescente em `index.html` (após `69c0036`)

- `screenPainel` (placeholder, 9 linhas).
- `screenNovaOP` (854 linhas, 12 tabelas Supabase, 4 `.single()`,
  13+ writes). Internals: `persistir`, `salvarSimulacao`,
  `abrirOP`, `render`, `buildScreen`, `disabledAttr` (closure),
  `buildLeft`, `buildItemRow`, `buildFornField`,
  `atribuirFornecedorFio` (que chama
  `window.atribuirFornecedorFioOp` para o write), `reloadOrdens`,
  `buildOrdemPendenteRow` (que chama
  `window.registrarRecebimentoOrdemFio` para o write),
  `gerarPdfCompraFios`, `buildBlocoFios`, `buildBlocoTecelagem`,
  `abrirEdicaoAdmin`, `reloadEntregasCima`, `maxMetrosItem`,
  `buildProposta`, `aplicarRecalculo`, `buildRight`,
  `renderRight`, `renderRightInto`.
- `setRoutes` (registro de rotas).
- `main` (boot).

`renderOPLatexAdmin` foi extraída para
`js/screens/op-latex-admin.js` e é acessada via
`window.renderOPLatexAdmin` no call-site de `screenNovaOP`.

`rotuloFioOrdem` (clone local) foi unificado com `rotuloFio` em
`OP-FORM-HELPERS-MODULE-A`. `rotuloModelo` foi movido para
`js/screens/op-form-helpers.js` como `window.rotuloModelo`.

## 8. Próximos cortes recomendados

1. **`SCREENPAINEL-MODULE-A`** — extração pequena e segura de
   `screenPainel` (placeholder de 9 linhas). Risco estrutural
   mínimo; reduz a pegada do inline.
2. **`OP-RECALCULO-DIAG-B`** — diagnóstico específico de
   `aplicarRecalculo` (e opcionalmente `persistir`) antes de
   qualquer extração. Objetivo: reduzir risco de negócio dos
   writes não transacionais antes de movê-los.
3. **`OP-PERSISTIR-DIAG-B`** — diagnóstico específico de
   `persistir` para mapear o rollback parcial manual existente e
   definir estratégia de compensação antes de qualquer extração.
4. **Só depois** considerar extração final de `screenNovaOP`
   (último grande corte do refactor arquitetural).

## 9. Riscos residuais do refactor (após `69c0036`)

- 🔴 **`screenNovaOP` é o maior bloco inline remanescente** (854
  linhas) e o mais sensível. Concentra 12 tabelas Supabase, 4
  `.single()`, 13+ writes não transacionais.
- 🔴 **`persistir` segue com writes não transacionais** em
  `ops` (insert/update), `lotes` (insert/update), `op_itens`
  (delete+insert), `op_fornecedores` (delete+insert),
  `ordens_compra_fio` (delete+insert). Rollback parcial manual
  já cobre alguns cenários (reverter status para `'simulada'`,
  deletar OP recém-criada se lote falhar), mas não cobre todos.
- 🔴 **`aplicarRecalculo` segue com writes em 4 tabelas** —
  `op_itens` (update), `saldo_fios_op` (insert), `saldo_fios`
  (select+update+insert), `ops` (update de status para
  `'em_producao'`). Toasts explicitamente dizem
  "verifique no Supabase" se uma operação intermediária falha.
- 🟢 **`renderOPLatexAdmin` está isolado** em
  `js/screens/op-latex-admin.js`. Os writes internos
  (`finalizar`, `editarEnviado`, `excluirOpLatex`) ficaram
  encapsulados na closure do módulo.
- 🟡 Falhas de smoke dependentes de `http.server :8765`
  (`tests/index-inline.smoke.js`, parte de
  `tests/write-guard.smoke.js`) são **pré-existentes** e não
  atribuídas ao refactor.
- 🟡 O backdoor `*@tapetes.test` (ver histórico de D1 em
  `PROJECT_STATE.md`) ainda depende de ação do dono para remoção.

## 10. Política de updates deste ledger

- Este ledger é atualizado em **fase docs-only** após cada fase
  arquitetural significativa.
- Cada entrada nova na tabela de fases inclui: fase, commit, arquivos
  principais, testes, status.
- Cada ressalva processual é registrada explicitamente na seção 5
  (Ressalvas processuais aceitas em `<FASE>`).
- O ledger **NÃO** inclui `service_role`, senhas, JWT secrets,
  connection strings com senha ou anon key completa. Apenas refs
  públicos do Supabase (`bhgifjrfagkzubpyqpew` para produção,
  `ucrjtfswnfdlxwtmxnoo` para staging) são mencionados, porque
  aparecem também em `js/config.js` e já são públicos via
  `STAGING_BASELINE.md`.
