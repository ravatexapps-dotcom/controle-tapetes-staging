# `docs/qa/` — Checklists históricos de QA

> ⚠️ **BANNER — DOCUMENTO LEGADO. NÃO USAR COMO ESPECIFICAÇÃO TÉCNICA.**
>
> Os arquivos desta pasta são **checklists de QA das fases 1–6
> do projeto**, escritos antes do refactor/hardening. São úteis
> como **registro histórico** do que foi testado em cada fase,
> mas **NÃO** devem guiar a implementação de novas features nem
> servir como fonte de verdade sobre o estado atual.
>
> **A arquitetura foi modularizada** após esses testes. Hoje:
>
> - `index.html` é puramente declarativo.
> - Telas e writes estão em `js/screens/*` (módulos por
>   tela/domínio).
> - Existe remote `staging` separado de `origin` (= produção).
> - Testes de regressão vivem em `tests/*.smoke.js` (Node),
>   não em checklists manuais em `docs/qa/`.

## Por que estes docs continuam aqui

Estes checklists registram **o que foi validado em cada fase**
(automatizado e manual). Servem como evidência histórica de
que o app chegou a um certo estado funcional em cada marco.
**NÃO** servem como especificação para código atual nem como
base para novos patches.

## Riscos específicos desta pasta

### Credenciais antigas em `fase1-checklist.md` e `fase2-checklist.md`

Os arquivos de QA das Fases 1 e 2 continham senhas de teste
explícitas (e.g. `Admin123!`, `Fornec123!`). Em
`RAVATEX-TAPETES-DOCS-SANITIZE-A` (commit `0d5ef7b` →
próximo) essas senhas foram **substituídas** pelo placeholder
`[REDACTED_TEST_PASSWORD]`. Os e-mails de teste foram
preservados, mas as senhas **NÃO** são mais válidas neste
documento.

> **Não confiar** em nenhuma credencial que apareça em doc
> legada. As contas de teste `*@tapetes.test` continuam
> existindo no Supabase Auth como backdoor histórico (ver
> `PROJECT_STATE.md` §Ações PROIBIDAS); trate como pendência
> de segurança a ser resolvida em fase própria.

### `fase2-bugs-pendentes.md`

Bug pendente antigo (select de Largura não vem preenchido ao
editar Preço, com tentativa de fix em `76bf39c`). **Verificar
se ainda persiste** no app atual antes de qualquer ação. Não
tratar como verdade sem reproduzir.

### Demais checklists (`fase3`–`fase6`, `fase5a`, `fase5b`) e `roteiro-teste-fase6.md`

Conteúdo histórico de QA. Os passos podem descrever
funcionalidade que **ainda existe**, mas assumem contexto
arquitetural antigo (e.g. UI sem módulos, fluxo de push
direto). Não usar como especificação de patches novos.

## Onde encontrar QA e testes vigentes

- **`tests/*.smoke.js`** — suíte de smoke tests em Node.
  Rodar com `node --test <arquivo>.smoke.js` ou
  `node --test tests/<vários-arquivos>.smoke.js`.
- **`AGENT_HANDOFF.md`** §"Comandos seguros por fase" — bloco
  canônico de regressão.
- **`docs/architecture/CODE_HEALTH_RULES.md`** §13 — política
  de testes.

## Política de atualização desta pasta

- Não criar novos checklists manuais aqui. Novas fases devem
  ter smoke tests em `tests/*.smoke.js`.
- Não atualizar os checklists existentes com HEAD/estado
  atual; isso pertence a `PROJECT_STATE.md` e ao LEDGER.
- Não mover/deletar arquivos sem autorização explícita.
