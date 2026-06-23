# PROJECT_STATE.md — Controle de Tapetes (Grupo Terra Branca)

> Snapshot de estado canônico curto. Atualizado em **2026-06-23** (fase
> RAVATEX-TAPETES-REFACTOR-STATE-DOCS-B — após extração do módulo
> `js/screens/op-latex-admin.js` e dos helpers de OP).
> Fonte da verdade operacional. Detalhe por fase em
> `docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md`.

## Produto
SPA web para controlar a produção de tapetes, do pedido de fio até o
recebimento do látex. Perfis: **admin** (operação) e **fornecedor**
(fio / tecelagem / látex).

## Stack real (confirmada)
- Frontend: `index.html` único + `js/**` (JS clássico, sem build) +
  Tailwind via CDN.
- Cálculo: `js/calculo-op.js` — funções puras, testadas com `node --test`.
- Backend: Supabase + Auth e-mail/senha + RLS. Plano free.
- Hospedagem: **GitHub Pages** (publica no push pra `main`). **Não é
  Vercel. Não é Next.js.**

## Arquitetura
- **App estático `index.html` + JS clássico + Supabase.**
- **Staging separado de produção**: 2 repos, 2 refs Supabase.
  - `staging` → `controle-tapetes-staging` + ref `ucrjtfswnfdlxwtmxnoo`.
  - `origin` → `grupoterrabranca/controle-tapetes` + ref `bhgifjrfagkzubpyqpew`.

## Estado atual do refactor
- **Branch operacional:** `work/app-next`.
- **HEAD atual:** `69c0036` — "Extract OP latex admin screen module".
- **staging/main atual:** `69c0036` (sincronizado com `work/app-next`).
- **origin/main oficial:** **intocado** durante todo o refactor.
- **PR #2:** **intocado** durante todo o refactor.
- **Working tree esperado:** **limpo**.
- **Produção (grupoterrabranca.github.io):** **preservada** — não
  recebeu nenhum push de refactor.
- **Supabase real:** **não acessado** em nenhuma fase de refactor ou
  teste mockado.

## Módulos extraídos (ordem cronológica)
1. `js/config.js` (commit `5547e27`, CONFIG-MODULE-A).
2. `js/supabase-client.js` (commit `6d50d08`, SUPABASE-CLIENT-MODULE-A).
3. `js/environment-banner.js` (commit `1f3238d`, ENV-BANNER-MODULE-A).
4. `js/auth.js` (commit `1b56571`, AUTH-MODULE-A).
5. `js/router.js` (commit `6bb203f`, ROUTER-MODULE-A).
6. `js/screens/system-screens.js` (commit `786f6b4`, SYSTEM-SCREENS-MODULE-A).
7. `js/screens/common.js` (commit `ed8e75c`, SCREENS-COMMON-MODULE-A).
8. `js/screens/cadastros.js` (commit `dd24365`, CADASTROS-SCREENS-MODULE-A).
9. `js/screens/ops-list.js` (commit `d7a8d25`, OPS-LIST-SCREEN-MODULE-A).
10. `js/screens/entrega-form.js` (commit `958f244`, ENTREGA-FORM-HELPER-MODULE-A).
11. `js/screens/entrega-writes.js` (commit `7ec1721`,
    ENTREGA-WRITES-MODULE-A; expandido em `e190022` Latex e
    `70635aa` Cima).
12. `js/screens/fornecedor.js` (commit `4b9ca12`,
    FORNECEDOR-SCREENS-MODULE-A).
13. `js/screens/op-form-helpers.js` (commit `c480324`,
    OP-FORM-HELPERS-MODULE-A) — `rotuloModelo`, `fmtKg`,
    `fmtMetros`, `disabledAttr`. Inclui unificação de
    `rotuloFioOrdem` (clone local) com `rotuloFio` de
    `entrega-form.js`.
14. `js/screens/op-writes.js` (commit `ab79f1c`,
    OP-ORDER-WRITE-MODULE-A — `registrarRecebimentoOrdemFio`;
    expandido em `1429950` com `atribuirFornecedorFioOp` na fase
    OP-FORNECEDOR-WRITE-MODULE-A).
15. `js/screens/op-latex-admin.js` (commit `69c0036`,
    OP-LATEX-ADMIN-MODULE-A) — `renderOPLatexAdmin` saiu do inline.

### Estado atual de `js/screens/op-writes.js`

Concentra os dois helpers de write de OP extraídos:

- `registrarRecebimentoOrdemFio` (commit `ab79f1c`,
  OP-ORDER-WRITE-MODULE-A).
- `atribuirFornecedorFioOp` (commit `1429950`,
  OP-FORNECEDOR-WRITE-MODULE-A).

## Inline remanescente em `index.html`
Após o refactor (HEAD `69c0036`), o `<script>` inline de
`index.html` ainda contém:

- `screenPainel` (placeholder).
- `screenNovaOP` (854 linhas, 12 tabelas Supabase, 4 `.single()`).
  Internals: `persistir`, `salvarSimulacao`, `abrirOP`, `render`,
  `buildScreen`, `disabledAttr` (closure), `buildLeft`, `buildItemRow`,
  `buildFornField`, `atribuirFornecedorFio` (usa
  `window.atribuirFornecedorFioOp` para o write), `reloadOrdens`,
  `buildOrdemPendenteRow` (usa `window.registrarRecebimentoOrdemFio`
  para o write), `gerarPdfCompraFios`, `buildBlocoFios`,
  `buildBlocoTecelagem`, `abrirEdicaoAdmin`, `reloadEntregasCima`,
  `maxMetrosItem`, `buildProposta`, `aplicarRecalculo`,
  `buildRight`, `renderRight`, `renderRightInto`.
- `setRoutes` (registro de rotas).
- `main` (boot).

`renderOPLatexAdmin` foi extraída para
`js/screens/op-latex-admin.js` e continua acessível via
`window.renderOPLatexAdmin`. O call-site em `screenNovaOP` foi
atualizado para `return await window.renderOPLatexAdmin(op.id);`.

`rotuloFioOrdem` (clone local) foi unificado com `rotuloFio` em
`OP-FORM-HELPERS-MODULE-A`. `rotuloModelo` foi movido para
`js/screens/op-form-helpers.js` como `window.rotuloModelo`.

## Riscos principais
- 🔴 **`screenNovaOP` ainda é o maior bloco inline** (854 linhas) e
  o mais sensível. Concentra 12 tabelas Supabase, 4 `.single()`, 13+
  writes não transacionais.
- 🔴 **`persistir` segue com writes não transacionais em**
  `ops` (insert/update), `lotes` (insert/update), `op_itens`
  (delete+insert), `op_fornecedores` (delete+insert),
  `ordens_compra_fio` (delete+insert). Rollback parcial manual já
  cobre alguns cenários (reverter status para `'simulada'`,
  deletar OP recém-criada se lote falhar), mas não cobre todos.
- 🔴 **`aplicarRecalculo` segue com writes em 4 tabelas** —
  `op_itens` (update), `saldo_fios_op` (insert), `saldo_fios`
  (select+update+insert), `ops` (update de status para
  `'em_producao'`). Toasts explicitamente dizem
  "verifique no Supabase" se uma operação intermediária falha.
- 🟡 **`buildOrdemPendenteRow` continua inline**, mas o write de
  recebimento já foi extraído — apenas a renderização do input e a
  regra de cálculo de status (`recebido_parcial` /
  `recebido_total`) permanecem no inline.
- 🟢 **`renderOPLatexAdmin` está isolado** em
  `js/screens/op-latex-admin.js`. Os writes internos
  (`finalizar`, `editarEnviado`, `excluirOpLatex`) ficaram
  encapsulados na closure do módulo; sem extração adicional nesta
  fase.
- 🟡 Falhas de smoke dependentes de `http.server :8765`
  (`tests/index-inline.smoke.js`, parte de
  `tests/write-guard.smoke.js`) são **pré-existentes** e **não
  atribuídas** ao refactor. Verificadas com `git stash` em commits
  anteriores.

## Comandos seguros
- `node --test tests/calculo-op.test.js` — cálculos puros.
- `node --test tests/<arquivo>.smoke.js` — testes focados por fase.
- Servir local: `python -m http.server 8765` (apenas para
  `index-inline.smoke.js` e parte de `write-guard.smoke.js`).

## Ações PROIBIDAS sem autorização explícita
- `db/10_reset_producao.sql` e `db/11_reset_producao.sql` (DELETE em
  massa de produção).
- Qualquer SQL contra `bhgifjrfagkzubpyqpew` sem backup.
- Push em `origin/main` (= produção).
- Editar `index.html`, `js/**`, `tests/**` durante fase docs-only.
- Tocar `origin/main` ou PR #2.

## Próxima fase recomendada
Após esta docs-only, o próximo alvo é uma das duas:

1. **`RAVATEX-TAPETES-SCREENPAINEL-MODULE-A`** — extração pequena e
   segura de `screenPainel` (placeholder de 9 linhas). Risco
   estrutural mínimo; reduz a pegada do inline.
2. **`RAVATEX-TAPETES-OP-RECALCULO-DIAG-B`** — diagnóstico
   específico de `aplicarRecalculo` (e opcionalmente `persistir`)
   antes de qualquer extração. Objetivo: reduzir risco de negócio
   dos writes não transacionais antes de movê-los.

**Não** recomendar extração direta de `persistir` ou
`aplicarRecalculo` sem diagnóstico específico — os writes tocam
múltiplas tabelas e exigem plano de rollback/compensação antes de
qualquer movimentação.

## Pendências de informação
- Quem tem write no GitHub `grupoterrabranca` e acesso ao Supabase?
- Existe backup automático do Supabase? Quem sabe restaurar?
- O backdoor `*@tapetes.test` (ver histórico de D1) já foi removido?
- Há link/projeto Vercel real? (premissa atual: não — app é estático
  no GitHub Pages.)
