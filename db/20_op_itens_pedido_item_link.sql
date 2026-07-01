-- ============================================================
-- Fase: RAVATEX-TAPETES-PEDIDO-OP-LINK-C
-- Vínculo Pedido → OP: op_itens.pedido_item_id.
--
-- Escopo:
--   - Adicionar coluna op_itens.pedido_item_id (UUID, nullable).
--   - FK para pedido_itens(id) ON DELETE SET NULL.
--   - Índice em op_itens.pedido_item_id.
--
-- Justificativa:
--   - Contrato docs/architecture/PEDIDO_OP_SCHEMA_CONTRACT.md §2.4.
--   - Permite rastrear qual item do pedido comercial originou
--     este item da OP produtiva.
--   - NULLABLE: OPs avulsas (sem pedido) continuam funcionando.
--   - ON DELETE SET NULL: apagar pedido_item não cascateia OP.
--
-- NÃO aplicado em Supabase. Migration versionada apenas.
--
-- Idempotente: pode rodar várias vezes sem efeito cumulativo.
-- Sem DELETE destrutivo, sem dados reais, sem secrets.
-- ============================================================

ALTER TABLE public.op_itens
  ADD COLUMN IF NOT EXISTS pedido_item_id UUID
    REFERENCES public.pedido_itens(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.op_itens.pedido_item_id IS
  'Item do pedido comercial que originou este item da OP. NULL se OP avulsa.';

CREATE INDEX IF NOT EXISTS op_itens_pedido_item_idx
  ON public.op_itens(pedido_item_id);

-- O índice lotes_pedido_idx já existe (db/13_pedidos_schema.sql linha 127).
-- Nenhuma ação adicional necessária em lotes.

-- ============================================================
-- Reload do schema cache (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
