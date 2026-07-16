# `admin-reactivate-user` — Supabase Edge Function

## Objetivo

Reativar um usuário previamente desativado — contraparte simétrica de
`admin-disable-user`. Marca `public.usuarios.ativo=true`, limpa
`desativado_em`/`desativado_por`/`motivo_desativacao` e remove o ban do
Auth via `auth.admin.updateUserById(target_id, { ban_duration: 'none' })`.
Chamada pelo app admin via
`supabase.functions.invoke('admin-reactivate-user', payload)`.

Contrato completo: `docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md`
(subfase `A5.3-A5.4`).

## Contrato

* **Método:** `POST` (aceita `OPTIONS` para preflight CORS).
* **Header:** `Authorization: Bearer <jwt-do-admin>`.
* **Body (JSON):**

  ```json
  {
    "user_id": "<uuid-do-usuario-alvo>"
  }
  ```

* **Sucesso** (`200`):

  ```json
  {
    "data": {
      "user_id": "<uuid>",
      "email": "usuario@exemplo.com",
      "tipo": "fornecedor",
      "ativo": true,
      "auth_banned": false
    }
  }
  ```

* **Erro** (códigos: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
  `SELF_REACTIVATE_FORBIDDEN`, `NOT_FOUND`, `REACTIVATE_NOT_INACTIVE`,
  `PROFILE_UPDATE_FAILED`, `AUTH_UNBAN_FAILED`, `COMPENSATION_FAILED`,
  `UNKNOWN`):

  ```json
  {
    "error": { "code": "REACTIVATE_NOT_INACTIVE", "message": "Usuário não está inativo." }
  }
  ```

## Guardas

* **Chamador precisa ser admin ATIVO** (`tipo='admin' AND ativo=true`
  em `public.usuarios`), verificado server-side — não confia no
  payload do front.
* **Alvo precisa existir** (`NOT_FOUND` caso contrário).
* **Alvo precisa estar inativo** (`REACTIVATE_NOT_INACTIVE` caso
  contrário) — diferente de `admin-disable-user`, reativar um usuário
  já ativo é erro do chamador, não um no-op idempotente: não há estado
  "já reativado" ambíguo para colapsar.
* **Auto-reativação bloqueada** (`SELF_REACTIVATE_FORBIDDEN`): na
  prática inatingível (um chamador com sessão ativa nunca pode ser seu
  próprio alvo inativo — um usuário inativo está banido no Auth e não
  consegue manter sessão válida), mas guardado por simetria com
  `SELF_DISABLE_FORBIDDEN`.

## Compensação (estado parcial)

Se a remoção do ban no Auth falhar após o perfil já ter sido marcado
`ativo=true`, a função reverte o perfil para o estado inativo anterior
exato (`desativado_em`/`desativado_por`/`motivo_desativacao`
preservados antes do update, não apenas zerados) e retorna
`AUTH_UNBAN_FAILED`. Se a própria reversão falhar, retorna
`COMPENSATION_FAILED` — requer ação manual, mesmo padrão de
`admin-disable-user`.

## Variáveis de ambiente esperadas

Configuradas via `supabase secrets` (nunca versionadas):

| Nome | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase. |
| `SUPABASE_ANON_KEY` | Anon key pública. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (secret; usada **somente** server-side). |

## Segurança

* `service_role` nunca deve aparecer no front-end, em `js/config.js`,
  `index.html`, `localStorage` ou em qualquer arquivo versionado.
* A função valida que o chamador é `admin` ativo consultando
  `public.usuarios` server-side.
* Não há hard delete nem `auth.admin.deleteUser` — apenas
  `updateUserById` para remoção do ban.

## Deploy (apenas referência — não executar nesta fase)

```bash
supabase functions deploy admin-reactivate-user --project-ref <staging-ref>
```

As secrets (`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_URL`/
`SUPABASE_ANON_KEY`) já estão configuradas em staging pelas fases
anteriores (`admin-create-user`/`admin-disable-user`/`admin-delete-user`/
`admin-reset-user-password` compartilham o mesmo projeto).

Deploy controlado **pelo arquiteto** — fora do alcance de
credenciais/ferramentas desta sessão (agente IA não entra senha/
token/API key em nenhum campo, regra permanente).

## Exemplo de payload

```json
{
  "user_id": "11111111-2222-3333-4444-555555555555"
}
```
