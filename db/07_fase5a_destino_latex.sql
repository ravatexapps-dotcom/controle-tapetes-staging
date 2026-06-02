-- ============================================================
-- Fase 5a (complemento) — Destino de látex na entrega da tecelagem
-- Idempotente: pode rodar várias vezes.
-- ============================================================

-- Limpa entregas de teste 'cima' antes de impor o CHECK de obrigatoriedade.
-- SEGURO APENAS enquanto não houver entregas 'cima' reais (o QA da Fase 5a
-- ainda não rodou). NÃO rode este arquivo de novo depois que houver entregas
-- 'cima' de produção — ele apagaria dados reais.
DELETE FROM entregas WHERE etapa = 'cima';

-- Coluna de destino (empresa de látex). Nula para etapa 'latex' (Fase 5b).
ALTER TABLE entregas
  ADD COLUMN IF NOT EXISTS destino_fornecedor_id BIGINT
  REFERENCES fornecedores(id) ON DELETE RESTRICT;

-- Obrigatório quando etapa = 'cima'.
ALTER TABLE entregas DROP CONSTRAINT IF EXISTS entregas_destino_cima_chk;
ALTER TABLE entregas
  ADD CONSTRAINT entregas_destino_cima_chk
  CHECK (etapa <> 'cima' OR destino_fornecedor_id IS NOT NULL);

-- RLS: permitir que qualquer usuário autenticado liste empresas de látex
-- (necessário para o dropdown de destino visto pela tecelagem).
DROP POLICY IF EXISTS fornecedores_latex_read ON fornecedores;
CREATE POLICY fornecedores_latex_read ON fornecedores
  FOR SELECT TO authenticated USING (tipo = 'latex');
