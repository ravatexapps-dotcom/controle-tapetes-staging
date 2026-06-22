# Ravatex Controle de Tapetes — Sandbox/Staging Baseline

> Documento de checkpoint. Estado validado do sandbox de código + Supabase
> staging após as fases BACKUP-A → BACKUP-D → SANDBOX-B → STAGING-B →
> CONFIG-STAGING-A → SMOKE-STAGING-B → WRITE-STAGING-A → WRITE-STAGING-CLEANUP-A.
> Sem mudança funcional desde a fase WRITE-GUARD-A (commit 4ae6bb7).

---

## 1. Ambientes

### Produção
- **Supabase ref (canônico):** `bhgifjrfagkzubpyqpew`
- **URL:** https://bhgifjrfagkzubpyqpew.supabase.co
- **Repo oficial:** https://github.com/grupoterrabranca/controle-tapetes.git

### Staging
- **Supabase ref:** `ucrjtfswnfdlxwtmxnoo`
- **URL:** https://ucrjtfswnfdlxwtmxnoo.supabase.co
- **Repo sandbox:** https://github.com/ravatexapps-dotcom/controle-tapetes-staging.git

> ⚠️ **Atenção — typo processual:** durante as fases WRITE-STAGING-A e
> WRITE-STAGING-CLEANUP-A apareceu em alguns logs e em uma cópia do ref
> canônico a string `bhgifjrfagkezubpyqpew`. **Esse valor está errado** — é
> apenas ruído de cópia. O ref canônico de produção é `bhgifjrfagkzubpyqpew`
> (com `f` antes do `g`).

---

## 2. Estado Git (work/app-next)

| Item | Valor |
|---|---|
| branch local | `work/app-next` |
| commit de config staging | `4435160` ("Configure staging Supabase environment") |
| repo sandbox `main` | aponta para `4435160` (publicado na SANDBOX-B) |
| origin oficial | **não recebeu push** (intocado) |
| `main` oficial | permanece intocada conforme último relatório |
| PR #2 | intocado |
| working tree final | limpo |

---

## 3. Backup e Restore

| Item | Valor |
|---|---|
| backup base | `D:\OneDrive\Programação\Ravatex\backups-tapetes\2026-06-21_2054_prod\` |
| arquivos usados no restore | `schema_public.sql`, `auth_users.sql`, `data_public.sql` |
| restore em staging | aprovado (exit 0 nos 3 psql) |
| 16 tabelas public validadas | sim |
| 3 funções public validadas | sim (`gerar_op_latex(bigint)`, `is_admin()`, `meu_fornecedor_id()`) |
| row counts pós-restore | **idênticos** aos da BACKUP-D (validado em STAGING-B) |
| validação adicional em cluster PG local | aprovada (BACKUP-D) |

---

## 4. Configuração do App

| Item | Comportamento |
|---|---|
| `grupoterrabranca.github.io` e subdomínios | **produção** (URL `bhgifjrfagkzubpyqpew.supabase.co`) |
| `localhost`, `127.0.0.1` | **staging** (URL `ucrjtfswnfdlxwtmxnoo.supabase.co`) |
| `ravatexapps-dotcom.github.io` e subdomínios | **staging** |
| Qualquer outro host | **staging** (fallback seguro — nunca cai em produção por acidente) |
| Banner laranja em staging | `AMBIENTE STAGING — DADOS DE TESTE. Não usar para operações reais.` |
| Banner vermelho (write-guard) | **não aparece** em staging (geometricamente impossível ativar) |
| Write-guard preservado | sim, como defesa em profundidade |

### Regra de ouro

> **Produção só é escolhida por hostname explícito.** Qualquer host que
> não seja `grupoterrabranca.github.io` aponta para staging.

---

## 5. Smokes Executados (fase, escopo, resultado)

| Fase | Escopo | Resultado |
|---|---|---|
| SMOKE-STAGING-A | static + runtime (vm sandbox) | 23/23 testes focados |
| SMOKE-STAGING-B | real browser: login + 16 reads | 18 calls staging, 0 produção, banner visível |
| WRITE-STAGING-A | insert/select/delete em `cores` | reversível; row count restaurado |
| WRITE-STAGING-CLEANUP-A | remoção de residual id=7 | 7 → 6, marker `RAVATEX*` = 0 |

### Resultado consolidado do SMOKE-STAGING-B

- **Login real OK** com `admin@tapetes.test`
- **18 chamadas reais para staging** (1 login + 16 reads + 1 RLS check)
- **0 chamadas para produção**
- **16/16 tabelas lidas** com row counts idênticos ao backup
- **Banner laranja de staging visível**
- **Banner vermelho de write-guard NÃO visível** (esperado)
- **Zero writes** executados

### Resultado consolidado do WRITE-STAGING-A + CLEANUP

- INSERT 1 registro em `cores` com marcador `RAVATEX_STAGING_SMOKE_*`
- SELECT do registro (status 200)
- DELETE por id exato (status 204)
- Cleanup residual `id=7` (criado por tentativa anterior): DELETE por id exato (status 204)
- `cores` row count: **inicial 7 → após cleanup 6** (baseline restaurado)
- Marcador `RAVATEX*` final: **0**

---

## 6. Baseline Final de Dados (staging `ucrjtfswnfdlxwtmxnoo`)

| Tabela | Row count | Conferem com BACKUP-D? |
|---|---|---|
| usuarios | 1 | ✓ |
| clientes | 2 | ✓ |
| cores | **6** | ✓ (após cleanup) |
| modelos | 11 | ✓ |
| fornecedores | 4 | ✓ |
| ops | 2 | ✓ |
| op_itens | 11 | ✓ |
| entregas | 0 | ✓ |
| entrega_itens | 0 | ✓ |
| lotes | 2 | ✓ |
| ordens_compra_fio | 11 | ✓ |
| op_fornecedores | 2 | ✓ |
| parametros_largura | 2 | ✓ |
| precos_terceirizada | 0 | ✓ |
| saldo_fios | 0 | ✓ |
| saldo_fios_op | 0 | ✓ |
| auth.users | 2 | (sem comparativo — restaurado de `auth_users.sql`) |
| registros com nome `like.RAVATEX*` | **0** | ✓ (limpo) |

---

## 7. Ressalvas e Pendências

1. **Senha `Admin123!` em staging** foi restaurada do backup original e está
   ativa. Como essa senha foi pública no README antes de 2026-06-21, deve
   ser rotacionada em fase própria: `AUTH-STAGING-HARDENING-A`.
2. **Anon key staging** está commitada no `index.html` (em ambos os repos).
   É pública por design do Supabase (RLS é a barreira real), mas o ideal é
   rotacionar se staging for promovido a produção.
3. **Backdoor `*@tapetes.test`** no Supabase Auth: 4 contas restauradas do
   backup (`admin`, `algodao`, `tecelagem`, `latex`). Devem ser removidas/rotacionadas
   em fase própria.
4. **Typos nos logs de fases anteriores:** A string
   `bhgifjrfagkezubpyqpew` apareceu em logs como ruído de cópia. **Não
   é ref válido.** O ref canônico é `bhgifjrfagkzubpyqpew` (com `f`).
5. **Cobertura RLS/policies:** Validada via login + 16 reads com JWT de
   usuário. Não foi exercitado login em nome de fornecedor (ex.: `algodao@tapetes.test`)
   nesta baseline. Smoke em fase própria se necessário.
6. **Backups `*.sql` em OneDrive:** sincronização automática; não commitar
   no Git. `.gitignore` cobre `backups/`.

---

## 8. Como Rodar Localmente Contra Staging

```bash
# 1. Servir o app em localhost
cd "D:\OneDrive\Programação\Ravatex\controle-tapetes"
python -m http.server 8765

# 2. Abrir no navegador
# http://localhost:8765/index.html

# 3. Verificar que o banner laranja aparece
# 4. Login com admin@tapetes.test (senha padrão Admin123!, rotacionar!)
# 5. Acessar telas — todas as leituras vão para staging
```

---

## 9. Próximas Fases Recomendadas

| Fase | Descrição |
|---|---|
| `AUTH-STAGING-HARDENING-A` | Rotacionar senha admin e remover/rotacionar usuários `*@tapetes.test` no Auth staging |
| `FEATURE-WORK-A` | Retomar ajustes funcionais (ex.: Fase 7 corrigir/desfazer recebimento de fio) usando staging como destino de teste |
| `DEPLOY-STAGING-A` | Resolver Vercel/GitHub Pages staging, se necessário |
| `BACKUP-POLICY-A` | Formalizar periodicidade de backup e rotação de manifest SHA256 |

---

## 10. Mapa de Referências Canônicas (anti-erro)

| Contexto | Valor correto | Onde aparece |
|---|---|---|
| Supabase produção ref | `bhgifjrfagkzubpyqpew` | `index.html` linha 37, `docs/HANDOFF.md` |
| Supabase staging ref | `ucrjtfswnfdlxwtmxnoo` | `index.html` linha 44, `docs/STAGING_BASELINE.md` |
| Supabase produção URL | `https://bhgifjrfagkzubpyqpew.supabase.co` | `index.html` linha 37 |
| Supabase staging URL | `https://ucrjtfswnfdlxwtmxnoo.supabase.co` | `index.html` linha 44 |
| Repo oficial | `https://github.com/grupoterrabranca/controle-tapetes.git` | `git remote -v` |
| Repo sandbox | `https://github.com/ravatexapps-dotcom/controle-tapetes-staging.git` | `git remote -v` |

> **Errar a ordem das letras em qualquer ref = incidente.** O ref de
> produção foi digitado errado nos logs das fases WRITE-STAGING-A e
> CLEANUP-A como `bhgifjrfagkezubpyqpew`. Compare sempre com a tabela
> acima antes de usar um ref em qualquer comando.
