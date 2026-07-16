-- ============================================================
-- Fase: CAMADA2-LAST-ACCESS-RPC (agrupada com A4.1, ver
-- docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md)
-- Schema/RPC aditivo, forward-only, idempotente (staging-only).
--
-- Fecha o HARD STOP registrado no closeout de A3.2: nenhuma
-- RPC/view expunha auth.users.last_sign_in_at. Esta migration cria
-- um read model admin-only, SECURITY DEFINER, que expoe apenas
-- id + last_sign_in_at (auth.users) dos usuarios visiveis em
-- public.usuarios. Nao expoe email, senha, metadata ou qualquer
-- outra coluna de auth.users.
--
-- Padrao de guarda: mesmo is_admin() de db/12 (exige tipo='admin'
-- AND ativo IS TRUE). Usuario autenticado nao-admin recebe
-- RAISE EXCEPTION (negado), nao lista vazia — evita ambiguidade
-- com "admin sem usuarios visiveis".
--
-- Nao implementado nesta fase: consumo na UI (coluna "Ultimo
-- acesso" em js/screens/admin-usuarios.js) — micro-fase propria
-- posterior, fora deste registro (Camada 2 §14: nao misturar
-- Supabase com frontend).
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_usuarios_last_sign_in()
RETURNS TABLE (
  id               UUID,
  last_sign_in_at  TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem consultar o ultimo acesso de usuarios.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id, au.last_sign_in_at
  FROM public.usuarios u
  JOIN auth.users au ON au.id = u.id;
END;
$$;

COMMENT ON FUNCTION public.admin_usuarios_last_sign_in() IS 'Read model admin-only (SECURITY DEFINER, STABLE): retorna id + last_sign_in_at (auth.users) dos usuarios visiveis em public.usuarios. Nao expoe email/senha/metadata. RAISE EXCEPTION 42501 para chamador nao-admin.';

-- Grants explicitos — nunca confiar nos default privileges do Supabase
-- (licao registrada de db/30/db/54/db/57).
REVOKE EXECUTE ON FUNCTION public.admin_usuarios_last_sign_in() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_usuarios_last_sign_in() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_usuarios_last_sign_in() FROM service_role;
GRANT EXECUTE ON FUNCTION public.admin_usuarios_last_sign_in() TO authenticated;

NOTIFY pgrst, 'reload schema';
