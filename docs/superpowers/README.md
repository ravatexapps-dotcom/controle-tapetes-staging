# `docs/superpowers/` — Conteúdo legado/histórico

> ⚠️ **BANNER — DOCUMENTO LEGADO. NÃO SEGUIR LITERALMENTE.**
>
> Os arquivos desta pasta foram escritos durante as **fases 1–7
> pré-refactor** do projeto, quando o app era um monólito
> `index.html` com scripts inline, writes Supabase espalhados em
> funções de render e fluxo de push direto para produção.
>
> **A arquitetura atual foi modularizada** após o ciclo de
> refactor/hardening congelado em `7f3c6da`. Hoje:
>
> - `index.html` é puramente declarativo, com cache-busting
>   `?v=20260623-asset1` em assets locais.
> - `js/boot.js` é o entrypoint, respeita DOM ready.
> - `js/router.js` é engine genérica.
> - `js/ui.js` tem root lookup seguro (`getAppRoot`).
> - Telas e writes estão em `js/screens/*` (módulos por
>   tela/domínio).
> - Helpers puros ficam em `js/calculo-op.js`.
> - Existe remote `staging` separado de `origin` (= produção).
> - Push de desenvolvimento vai para `staging` apenas;
>   `origin/main` é protegido e intocado.

## Por que estes docs continuam aqui

Estes docs são **registro histórico** da evolução do projeto
(especialmente `STATUS.md`, `specs/`, `plans/`). Foram preservados
para que humanos e IAs possam entender o caminho que levou à
arquitetura atual. **NÃO** devem ser usados como playbook de
execução.

## Riscos específicos desta pasta

### `docs/superpowers/plans/*.md` — PERIGOSO PARA IA

Os 9 arquivos em `plans/` (Fase 1 a Fase 7) instruem a:

- Modificar `index.html` diretamente.
- Inserir `supa.from('tabela').insert/update/delete(...)` em
  funções de render.
- Usar `git add index.html` e `git add .` em sequência.
- Fazer push para `main` (= produção no contexto antigo) sem
  staging.

Seguir essas instruções literalmente **violaria
`docs/architecture/CODE_HEALTH_RULES.md` §2, §6, §9 e §15**, e
reintroduziria o monólito pré-refactor.

> Trate os plans como **registro de intenção**, não como
> playbook executável. Antes de implementar qualquer requisito
> funcional aqui descrito, adapte-o à arquitetura modular atual
> e confirme com `AGENT_HANDOFF.md`.

### `docs/superpowers/specs/*.md` — Obsoleto

Os 9 specs descrevem designs de feature no contexto de
`index.html` monolítico. A especificação funcional (o que o app
deve fazer) pode ainda ser útil; a alocação de código (em qual
arquivo, com qual estrutura) precisa ser refeita para a
arquitetura modular.

### `docs/superpowers/STATUS.md` — Histórico

Documenta fases concluídas (1–6 + complemento destino látex) e
menciona "Fase 7 — Corrigir/Desfazer recebimento de fio" como
pendente. O status das fases anteriores ao refactor pode ser
inferido deste arquivo, mas o **estado canônico atual** está em
`PROJECT_STATE.md` e em
`docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md`.

## Onde encontrar o estado atual

- **`PROJECT_STATE.md`** (raiz) — snapshot canônico curto.
- **`AGENT_HANDOFF.md`** (raiz) — estado aceito, regras, proibições.
- **`docs/refactor/ARCHITECTURE_REFACTOR_LEDGER.md`** —
  histórico de fases do refactor.
- **`docs/architecture/CODE_HEALTH_RULES.md`** — regras
  vinculantes.
- **`docs/DOCUMENTATION_INDEX.md`** — índice de toda a
  documentação.

## Política de atualização desta pasta

- Em caso de nova fase, **criar** specs/plans na estrutura
  modular atual (`docs/architecture/`, `docs/refactor/`, e
  specs dedicadas a módulos). Não reutilizar esta pasta para
  planos novos.
- Manter esta pasta como arquivo histórico. Não mover/deletar
  arquivos sem autorização explícita.
- Não atualizar `STATUS.md` com HEAD/estado atual; isso pertence
  a `PROJECT_STATE.md` e ao LEDGER.
