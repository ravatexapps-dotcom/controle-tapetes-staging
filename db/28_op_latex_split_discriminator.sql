-- =====================================================================
-- db/28_op_latex_split_discriminator.sql
-- RAVATEX-TAPETES-OP-PARTIAL-SPLIT-DB28-B
--
-- Prepares the schema for exceptional Latex split OPs without changing
-- gerar_op_latex, without creating a split RPC, and without UI changes.
--
-- Contract:
--   - Default Latex OP: motivo_separacao IS NULL.
--   - Future split Latex OP: motivo_separacao IS NOT NULL.
--   - The default Latex OP unique key remains
--     (origem_op_id, destino_fornecedor_id), but only for defaults.
--
-- Operational warning:
--   db/29 must adjust gerar_op_latex to use:
--     ON CONFLICT (origem_op_id, destino_fornecedor_id)
--     WHERE tipo = 'latex' AND motivo_separacao IS NULL
--   before functional homologation that creates new default Latex OPs.
-- =====================================================================

BEGIN;

ALTER TABLE public.ops
  ADD COLUMN IF NOT EXISTS motivo_separacao TEXT NULL;

COMMENT ON COLUMN public.ops.motivo_separacao IS
  'Nao-NULL apenas em OPs latex criadas por split excepcional explicito. NULL = OP latex consolidada default.';

-- Hard-stop: before replacing the index, current default cardinality must
-- remain unique by origem+destino.
DO $$
DECLARE
  g RECORD;
BEGIN
  FOR g IN
    SELECT
      o.origem_op_id,
      o.destino_fornecedor_id,
      array_agg(o.id ORDER BY o.id) AS op_ids,
      count(*) AS total
    FROM public.ops o
    WHERE o.tipo = 'latex'
      AND o.motivo_separacao IS NULL
      AND o.origem_op_id IS NOT NULL
      AND o.destino_fornecedor_id IS NOT NULL
    GROUP BY o.origem_op_id, o.destino_fornecedor_id
    HAVING count(*) > 1
  LOOP
    RAISE EXCEPTION
      'db/28 abortada: duplicidade default de OP latex para origem_op_id=% destino_fornecedor_id=% ids=%',
      g.origem_op_id, g.destino_fornecedor_id, g.op_ids;
  END LOOP;
END $$;

DROP INDEX IF EXISTS public.ops_latex_origem_destino_uidx;

CREATE UNIQUE INDEX ops_latex_origem_destino_uidx
  ON public.ops (origem_op_id, destino_fornecedor_id)
  WHERE tipo = 'latex' AND motivo_separacao IS NULL;

CREATE INDEX IF NOT EXISTS ops_latex_split_idx
  ON public.ops (origem_op_id, destino_fornecedor_id)
  WHERE tipo = 'latex' AND motivo_separacao IS NOT NULL;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;
