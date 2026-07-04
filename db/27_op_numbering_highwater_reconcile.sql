-- =====================================================================
-- db/27_op_numbering_highwater_reconcile.sql
-- RAVATEX-TAPETES-OP-NUMBERING-HIGHWATER-R1
--
-- Reconciles op_numeros with existing ops without reducing counters.
-- It does not update/delete ops and does not change Latex rules.
-- =====================================================================

INSERT INTO public.op_numeros (tipo, ano, ultimo_numero)
SELECT
  o.tipo,
  o.ano,
  MAX(o.numero)::INTEGER AS ultimo_numero
FROM public.ops o
WHERE o.tipo IS NOT NULL
  AND o.ano IS NOT NULL
  AND o.numero IS NOT NULL
GROUP BY o.tipo, o.ano
ON CONFLICT (tipo, ano) DO UPDATE
   SET ultimo_numero = GREATEST(public.op_numeros.ultimo_numero, EXCLUDED.ultimo_numero),
       updated_at = CASE
         WHEN public.op_numeros.ultimo_numero < EXCLUDED.ultimo_numero THEN NOW()
         ELSE public.op_numeros.updated_at
       END;

COMMENT ON TABLE public.op_numeros IS
  'High-water monotonicos de numeracao de OP por tipo/ano. db/27 reconcilia com MAX(ops.numero) sem reduzir contador.';

GRANT EXECUTE ON FUNCTION public.proximo_numero_op(TEXT, INTEGER) TO authenticated;
