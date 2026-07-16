-- ============================================================
-- Fase: A4.1 (docs/architecture/CAMADA2_USUARIOS_SPEC_PROPOSED.md)
-- Schema aditivo, forward-only, idempotente (staging-only).
--
-- Adiciona suporte a senha temporaria + troca forcada no primeiro
-- login (caminho unico decidido pelo arquiteto para A4; convite por
-- e-mail/SMTP permanece NOT AUTHORIZED).
--
-- usuarios.senha_temporaria: TRUE enquanto a senha em vigor foi
--   gerada pelo admin (criacao ou reset futuro em A5) e ainda nao
--   foi trocada pelo proprio usuario via auth.updateUser self-service.
-- usuarios.senha_gerada_em: timestamp da geracao, usado por fase
--   futura (A4.2/A5) para checar expiracao.
--
-- Nao implementado nesta fase: guarda de boot, tela de troca
-- obrigatoria (A4.2), reset administrativo (A5). Apenas schema +
-- a extensao pontual da Edge Function admin-create-user (fora deste
-- arquivo SQL).
-- ============================================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS senha_temporaria BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS senha_gerada_em  TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.usuarios.senha_temporaria IS 'TRUE quando a senha em vigor foi gerada pelo admin (criacao/reset) e ainda nao foi trocada pelo proprio usuario. DEFAULT FALSE preserva usuarios existentes.';
COMMENT ON COLUMN public.usuarios.senha_gerada_em  IS 'Timestamp de geracao da senha temporaria. NULL quando senha_temporaria=FALSE.';

NOTIFY pgrst, 'reload schema';
