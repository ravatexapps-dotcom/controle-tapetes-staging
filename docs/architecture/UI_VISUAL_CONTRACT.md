# CONTRATO VISUAL VERSIONADO — RAVATEX / CONTROLE DE TAPETES

> **Fase:** `G28-P0` — registro de governança (docs-only).
> **Origem:** consolidação da skill `.claude/design-skill/` (`inttex-ui`:
> `SKILL.md` + `README.md`), dos tokens versionados `css/tokens.css` (`--rv-*`) e
> dos dois pilotos reais de OP. Nenhum design novo foi inventado.
> **Motivo:** regras permanentes de UI **não podem** existir somente em `.claude`
> (que é untracked e ausente de worktrees novos — ver `CLAUDE_PROJECT_ASSET_MAP.md` §13).
> Este documento é a fonte versionada; a skill permanece como ferramenta de geração.

Precedência: este contrato **prevalece sobre a skill**. Uma skill pode ensinar a
aplicar o padrão, mas não pode contrariar a arquitetura nem este contrato.

---

## 0. Fontes reais

- `css/tokens.css` — tokens canônicos versionados (prefixo `--rv-*`).
- `.claude/design-skill/README.md` — guia completo (fundações, layout, componentes, regra de ouro de tabelas).
- `.claude/design-skill/SKILL.md` — regras inegociáveis resumidas.
- `.claude/design-skill/tokens/*.css` e `.claude/tokens/*.css` — tokens da skill (referência).
- Pilotos aprovados: `js/screens/op-latex-admin.js`, `js/screens/op-tecelagem-producao-admin.js`.
- Harness de verificação: `.claude/preview/*.html`.

Quando um ponto não tiver evidência suficiente nas fontes acima, está marcado
como **OPEN — REQUIRES IALEAD DECISION**.

---

## 1. Linguagem visual

Denso, limpo e sóbrio — “padding de ferramenta, não de landing”, mas com respiro
(gap ~14–16px entre cards). Cards **flat** (sem sombra), borda hairline. Nada de
emoji. Português (pt-BR), objetivo e operacional.

## 2. Tipografia

Fonte **Inter**. Escala densa (tokens `--rv-font-size-*`):

- Título de página 22px/800, tracking `-.02em`;
- valor de métrica 15px/700;
- célula/valor 13–13,5px (`--rv-font-size-body` 13px, `--rv-color-value` #26303f);
- rótulo de métrica ~12,5px (`--rv-font-size-value`);
- rótulo de seção 11px/700 UPPERCASE, tracking `.06em` (`--rv-tracking-label`);
- cabeçalho de tabela 10,5px/600 UPPERCASE.

Nada abaixo de 10,5px. **Todo número** usa `font-variant-numeric: tabular-nums`
(`.tnum`) e vírgula decimal com unidade (`1000,00 m`, `183,000 kg`). Datas `DD/MM/AAAA`.

## 3. Forma, cantos e sombra

- **Raios (baixa curvatura):** card **6px** (`--rv-radius-card`), controle
  **4px** (`--rv-radius-control`), badge **pílula** (`--rv-radius-pill` 999px).
  Nunca arredondar botão como card.
- **Pílula é exclusiva de badge/etapa/status** — não usar em botões, inputs ou cards.
- **Sombra** só em menus/popovers; cards são flat. Evitar sombras pesadas.
- Borda hairline `1px solid var(--rv-color-line-200)`.

## 4. Cores (aliases semânticos — `css/tokens.css`)

- Texto: título/corpo `--rv-color-title`/`--rv-color-text` #16203a; apagado `--rv-color-muted`; valor forte `--rv-color-value`.
- Acento (azul): `--rv-color-accent` #2563eb; fundo suave `--rv-color-subtle-bg` #eaf1fd.
- Superfícies: `--rv-color-surface` #fff; header `--rv-color-bg-header`.
- Linhas: `--rv-color-line-100` (tabela), `--rv-color-line-200` (card), `--rv-color-input-border`.
- Semânticas: `--rv-color-danger` #d6403a, `--rv-color-success` #18794a, `--rv-color-warning` #c2610c — cada uma lida como status; usar com moderação.
- **Etapa (stage):** Tecelagem roxo `--rv-stage-tecelagem`; Acabamento teal `--rv-stage-acabamento` (cada uma com `-bg`).
- **Status:** Preparação azul `--rv-status-prep`; Em produção âmbar `--rv-status-prod` + dot `--rv-status-prod-dot`.
- **Etapa ≠ status:** nunca a mesma cor para etapa e status.

Re-tematizar = editar só a escala base e o accent nos tokens; cards/botões/badges/tabelas herdam.

## 5. Layout (shell + cockpit)

- **Shell:** header fixo ~62px (`--rv-header-h`) + sidebar ~196px (`--rv-sidebar-w`;
  item ativo `bg-accent-soft text-accent`, radius 4px) + main rolável.
- **Conteúdo:** largura cheia até **1600px**, centralizado; padding `18px 32px 40px`.
  Nunca faixa central estreita com sobra lateral.
- **Cockpit de 2 colunas** (telas de detalhe): `grid-template-columns: minmax(0,1fr)
  var(--rv-rail-w)` com rail direito **300px** (`--rv-rail-w`) `position:sticky;top:0`.
  Conteúdo/tabelas à esquerda; resumo, métricas e **ação primária** no rail. Não
  repetir o mesmo dado nos dois lados.
- **Regra do rail:** tudo no rail é vertical/full-width (métricas empilhadas,
  inputs e botões `width:100%`). **Proibido** grid de colunas fixas dentro do rail.

## 6. Cards e seções

Toda seção abre com **chip de ícone** 20–22px (radius 4px, `--rv-color-chip-bg`,
glyph 13px `--rv-color-chip-glyph`) + rótulo 11px UPPERCASE. Ícone discreto e
**distinto por seção**. **Proibido:** barra vertical azul, strip sólida,
pseudo-ícone por borda, header numerado dominante (“1. Dados”, “2. Itens”).

## 7. Tabelas — regra de ouro

**A largura e o alinhamento do CABEÇALHO de cada coluna DEVEM ser idênticos aos
dos VALORES.** Garantir por `<table style="table-layout:fixed">` + `<colgroup>`
com `text-align` repetido em `th`/`td`, **ou** um `grid-template-columns`
compartilhado entre header e todas as linhas. Colunas numéricas `text-right` no
header e nos valores; `.tnum` em todo número; wrapper `overflow-x:auto` em tabelas
de colunas fixas em px para a última coluna nunca sumir.

## 8. Botões

- **Uma ação primária por tela**, preenchida (`bg-accent text-white`, radius 4px,
  ~38px), junto do contexto (no rail). Hover accent-hover.
- Secundário: superfície + borda, discreto (~34px), ícone + texto.
- Positivo (ex.: Finalizar): verdes suaves.
- **Destrutivo (Excluir): sempre ícone + texto**, vermelho discreto — nunca só ícone.
- Sem redundância: não repetir no topo atalho/dado que já existe como link/seção.

## 9. Formulários

- Grid de pares rótulo/valor: `grid-cols-3`, gap `13px 18px`; rótulo 11,5px
  apagado + valor 13,5px/600 forte. Links em accent.
- Inputs radius 4px (`--rv-radius-control`), borda `--rv-color-input-border`.
- No rail, inputs `width:100%`.
- Campos aparecem conforme o tipo selecionado (ex.: modal “Validar e vincular”,
  campos por tipo de documento).

## 10. Badges — status e etapa

Pílula ~11,5px/600. **Status** com dot (Preparação azul; Em produção âmbar).
**Etapa** por cor (Tecelagem roxo; Acabamento teal), sempre em pílula suave.
Quando o header de seção carrega badge à direita, usar a variante de chip **sem
`margin-bottom`** dentro de `flex align-items:center; justify-content:space-between`.

## 11. Documentos / Anexos

Slots **por tipo** (Romaneio, NF de entrada, NF de saída — múltiplos arquivos por
tipo): rótulo + badge de contagem; chips de arquivo full-width (`--rv-color-subtle-bg`,
borda `--rv-color-line-100`, ícone PDF vermelho + nome com ellipsis + tamanho·data
+ remover ×); botão tracejado “Anexar” por tipo, `width:100%`. Estado vazio
honesto (“Nenhum arquivo anexado.”) — **sem nomes de arquivo fabricados nem badges
falsos** quando o backend ainda não existe; o “Anexar” apenas sinaliza.

## 12. Modais

Camada acima do conteúdo (`--rv-z-modal` 200; toast `--rv-z-toast` 250). Herdam
tipografia, cantos (card 6px / controle 4px), cards flat e a regra de uma ação
primária. O modal “Validar e vincular” (fase G28-B5) deve exibir **evidência
técnica** (somente leitura) separada dos **campos humanos** (editáveis), com
campos condicionais por tipo e ações explícitas (validar e vincular / rejeitar /
ignorar / cancelar).

**OPEN — REQUIRES IALEAD DECISION:** dimensões exatas, comportamento de overlay
(scroll-lock, dismiss por clique fora/ESC), largura máxima e responsividade mobile
do modal não estão especificados nas fontes atuais e devem ser fechados antes de
G28-B5.

## 13. Iconografia

Estilo **Feather / Lucide** (stroke 1.8–2, cantos arredondados). Tamanhos: nav
16px, chip de seção 13px, ações 14–16px; glyph padrão `--rv-color-chip-glyph`.
Sem ícones preenchidos pesados, sem emoji, sem PNG. Ícone decorativo é ruído —
cada chip tem ícone com propósito.

## 14. Responsividade

Largura cheia até 1600px; cockpit ocupa o monitor; tabelas de colunas fixas em
`overflow-x:auto`. **OPEN — REQUIRES IALEAD DECISION:** breakpoints formais e
comportamento do cockpit/rail em telas estreitas (empilhar rail abaixo do
conteúdo) ainda não estão fixados.

## 15. Acessibilidade

Contraste suficiente para texto de status mesmo em paletas claras; título escuro
(`--rv-color-title`) para legibilidade; alvos de toque coerentes com a altura dos
controles (34–38px); status legível por dot + rótulo (não só cor). **OPEN —
REQUIRES IALEAD DECISION:** metas WCAG explícitas, foco de teclado e labels ARIA
não estão documentados nas fontes atuais.

## 16. Terminologia

pt-BR. Rótulos curtos em Title Case (“Fornecedor de acabamento”, “Saldo em
tecelagem”); rótulos de seção em UPPERCASE. Mensagens de estado curtas e neutras
(“Nenhuma entrega registrada ainda.”). Sem emoji.

## 17. Reutilização de componentes e continuidade Documentos/Pedido/OP

Telas novas (Documentos, fila, modal, superfícies do Pedido/OP) devem nascer com
os mesmos tokens, cards, tabelas, badges e o cockpit já usados nos pilotos de OP —
sem reinventar cor, tipo, espaçamento ou componente. A seção de Documentos e as
superfícies de exibição no Pedido e na OP devem consumir os mesmos padrões e o
mesmo vínculo canônico.

## 18. Validação visual (obrigatória)

Cada tela é conferida por **render real** no harness de browser
(`.claude/preview/*.html`), instanciando o componente com dados fake e medindo
overflow/alinhamento — não confiar só em screenshot nem só em teste. Testes de
smoke que codificam o visual antigo (headers numerados, strips, grids fixos)
devem ser atualizados para o canônico novo, preservando as asserções **funcionais**.

## 19. Proibições (soluções simplificadas)

É proibida qualquer réplica simplificada que não cumpra o requisito real:
barras/strips no lugar de chip de ícone; grids de colunas fixas no rail;
`max-width` estreito com vãos laterais; header numerado; pílula em botão; sombra
pesada; badges/arquivos fabricados sem backend; cabeçalho de tabela desalinhado
dos valores.

---

> **Este é o contrato visual versionado.** Consultar antes de qualquer fase de UI,
> junto de `css/tokens.css` e (quando presente) da skill `.claude/design-skill`.
> Atualizar quando um ponto `OPEN` for decidido pelo IAlead ou quando um novo
> padrão for aprovado nos pilotos.
