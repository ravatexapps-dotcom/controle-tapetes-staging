# QA — Fase 1 (Fundação)

> ⚠️ **Banner — documento histórico.**
>
> Senhas de teste foram **anonimizadas** em
> `RAVATEX-TAPETES-DOCS-SANITIZE-A`. Os e-mails de teste
> abaixo foram preservados como referência histórica, mas as
> senhas **NÃO** estão mais neste documento. As contas
> `*@tapetes.test` continuam existindo no Supabase Auth como
> backdoor histórico; trate como pendência de segurança a ser
> resolvida em fase própria (ver `PROJECT_STATE.md`).
>
> Ver `docs/qa/README.md` e `docs/DOCUMENTATION_INDEX.md`
> para contexto e prevalência.

## Cenário 1: Login como admin
- [ ] Entrar com `admin@tapetes.test` / `[REDACTED_TEST_PASSWORD]`
- [ ] Tela redireciona pra `#/painel`
- [ ] Mostra "Bem-vindo, Murilo (Admin)"
- [ ] Botão "Sair" no canto superior direito
- [ ] Clicar em "Sair" leva de volta pra `#/login`

## Cenário 2: Login como fornecedor de fios
- [ ] Entrar com `algodao@tapetes.test` / `[REDACTED_TEST_PASSWORD]`
- [ ] Tela redireciona pra `#/fornecedor/home`
- [ ] Mostra "Olá, Fios Sul"

## Cenário 3: Login como tecelagem
- [ ] Entrar com `tecelagem@tapetes.test` / `[REDACTED_TEST_PASSWORD]`
- [ ] Redireciona pra `#/fornecedor/home`
- [ ] Mostra "Olá, Aurora"

## Cenário 4: Login como látex
- [ ] Entrar com `latex@tapetes.test` / `[REDACTED_TEST_PASSWORD]`
- [ ] Redireciona pra `#/fornecedor/home`
- [ ] Mostra "Olá, Premier"

## Cenário 5: Senha errada
- [ ] Tentar admin@tapetes.test / senhaerrada
- [ ] Toast vermelho "E-mail ou senha incorretos"
- [ ] Continua na tela de login

## Cenário 6: Acesso indevido a rota de admin
- [ ] Logar como `algodao@tapetes.test`
- [ ] Navegar manualmente pra `#/painel`
- [ ] Mostra tela "Acesso negado"

## Cenário 7: RLS bloqueando leitura indevida (Supabase Studio)
- [ ] No Supabase Studio, abrir SQL Editor
- [ ] Rodar como anon (não logado): `SELECT * FROM ops;` → deve retornar 0 linhas (ou erro)
- [ ] Em outro browser logado como tecelagem, abrir DevTools → Console e rodar:
      `await supa.from('fornecedores').select('*')` → deve retornar APENAS o registro "Tecelagem Aurora"
- [ ] Mesma chamada como admin no console → retorna os 4 fornecedores

## Cenário 8: Sessão persiste após reload
- [ ] Logar como admin
- [ ] Apertar F5
- [ ] Continua logado, vai direto pra `#/painel`
