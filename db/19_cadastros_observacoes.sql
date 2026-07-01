-- ============================================================
-- Fase: RAVATEX-TAPETES-ADMIN-CADASTROS-MODALS-SCHEMA-PERSISTENCE-A
-- Persistencia real do campo Observacoes nos cadastros admin.
--
-- Escopo:
--   - adicionar coluna observacoes (text, nullable) em:
--     cores, clientes, modelos, fornecedores, precos_terceirizada,
--     usuarios;
--   - aditiva, nullable, sem default obrigatorio, sem trigger,
--     sem alteracao de RLS/policies.
--
-- Nao implementado nesta fase:
--   - imagem de referencia de modelos (sem infraestrutura de
--     Storage no projeto; ver relatorio da fase para detalhes);
--   - migracao manual de dados;
--   - aplicacao em producao (bhgifjrfagkzubpyqpew).
--
-- Idempotente: pode rodar varias vezes sem efeito cumulativo.
-- Sem DELETE destrutivo, sem dados reais, sem secrets.
-- ============================================================

ALTER TABLE public.cores
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE public.modelos
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE public.precos_terceirizada
  ADD COLUMN IF NOT EXISTS observacoes TEXT;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS observacoes TEXT;
