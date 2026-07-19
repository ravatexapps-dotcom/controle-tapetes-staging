-- PHASE-C3A: inactive legacy opening-balance and cutover foundation.
-- Staging only. No real import, writer fence, reader switch, or flat ACL change.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

CREATE TABLE public.ordem_compra_cutover (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'legacy_active'
    CHECK (status IN ('legacy_active','maintenance_fenced','canonical_active')),
  snapshot_hash TEXT,
  inventory_baseline_hash TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (reconciliation_status IN ('not_started','previewed','reconciled')),
  productive_receipt_started_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'legacy_active' AND productive_receipt_started_at IS NULL)
    OR status <> 'legacy_active')
);
ALTER TABLE public.ordem_compra_cutover ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_cutover FROM authenticated;

CREATE TABLE public.ordem_compra_cutover_inventory_baseline (
  id BIGSERIAL PRIMARY KEY,
  cutover_id BIGINT NOT NULL REFERENCES public.ordem_compra_cutover(id) ON DELETE RESTRICT,
  material TEXT NOT NULL CHECK (material IN ('algodao','poliester')),
  cor_id BIGINT REFERENCES public.cores(id) ON DELETE RESTRICT,
  cor_poliester TEXT CHECK (cor_poliester IN ('PRETO','BRANCO')),
  kg_total NUMERIC(12,3) NOT NULL,
  CHECK ((material = 'algodao' AND cor_id IS NOT NULL AND cor_poliester IS NULL)
      OR (material = 'poliester' AND cor_id IS NULL AND cor_poliester IS NOT NULL))
);
CREATE UNIQUE INDEX ordem_compra_cutover_inventory_baseline_identity
  ON public.ordem_compra_cutover_inventory_baseline(cutover_id, material, COALESCE(cor_id,0), COALESCE(cor_poliester,''));
ALTER TABLE public.ordem_compra_cutover_inventory_baseline ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ordem_compra_cutover_inventory_baseline FROM PUBLIC;
REVOKE ALL ON TABLE public.ordem_compra_cutover_inventory_baseline FROM anon;
REVOKE ALL ON TABLE public.ordem_compra_cutover_inventory_baseline FROM authenticated;

ALTER TABLE public.ordem_compra_recebimentos
  ALTER COLUMN ator_id DROP NOT NULL;
ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_idempotencia,
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_comando_tipo_check,
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_idempotency_namespace_check,
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_ator_tipo_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3a_tipo_check
    CHECK (comando_tipo IN ('recebimento','estorno','import_saldo_inicial')),
  ADD CONSTRAINT ordem_compra_recebimentos_c3a_namespace_check
    CHECK (idempotency_namespace IN ('native_receipt_v1','legacy_initial_balance_v1')),
  ADD CONSTRAINT ordem_compra_recebimentos_c3a_actor_check
    CHECK ((ator_tipo IN ('admin','fornecedor') AND ator_id IS NOT NULL)
        OR (ator_tipo = 'sistema' AND ator_id IS NULL));
CREATE UNIQUE INDEX ordem_compra_recebimentos_c3a_idempotencia
  ON public.ordem_compra_recebimentos(
    idempotency_namespace, ator_tipo,
    COALESCE(ator_id, '00000000-0000-0000-0000-000000000000'::uuid), idempotency_key
  );

ALTER TABLE public.ordem_compra_fio_lancamentos
  DROP CONSTRAINT IF EXISTS ordem_compra_fio_lancamentos_tipo_check;
ALTER TABLE public.ordem_compra_fio_lancamentos
  ADD CONSTRAINT ordem_compra_fio_lancamentos_c3a_tipo_check
    CHECK (tipo IN ('recebimento','import_saldo_inicial','estorno'));

CREATE OR REPLACE FUNCTION public.trg_native_lancamento_shape_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_header public.ordem_compra_recebimentos%ROWTYPE;
DECLARE v_item public.ordem_compra_item%ROWTYPE;
DECLARE v_alloc public.ordem_compra_item_alocacao%ROWTYPE;
DECLARE v_source public.ordem_compra_fio_lancamentos%ROWTYPE;
BEGIN
  IF NEW.recebimento_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_header FROM public.ordem_compra_recebimentos WHERE id = NEW.recebimento_id;
  IF NOT FOUND OR v_header.ordem_compra_id <> NEW.ordem_compra_id THEN RAISE EXCEPTION 'native ledger header/order mismatch'; END IF;
  IF (v_header.ator_tipo = 'sistema' AND NEW.criado_por IS NOT NULL)
     OR (v_header.ator_tipo <> 'sistema' AND (v_header.ator_id IS DISTINCT FROM NEW.criado_por OR v_header.ator_tipo IS DISTINCT FROM NEW.ator_tipo)) THEN
    RAISE EXCEPTION 'native ledger actor mismatch';
  END IF;
  SELECT * INTO v_item FROM public.ordem_compra_item WHERE id = NEW.ordem_compra_item_id;
  IF NOT FOUND OR v_item.ordem_id <> NEW.ordem_compra_id OR v_item.material IS DISTINCT FROM NEW.material
     OR v_item.cor_id IS DISTINCT FROM NEW.cor_id OR v_item.cor_poliester IS DISTINCT FROM NEW.cor_poliester THEN
    RAISE EXCEPTION 'native ledger item/material identity mismatch';
  END IF;
  IF NEW.ordem_compra_item_alocacao_id IS NOT NULL THEN
    SELECT * INTO v_alloc FROM public.ordem_compra_item_alocacao WHERE id = NEW.ordem_compra_item_alocacao_id;
    IF NOT FOUND OR v_alloc.item_id <> NEW.ordem_compra_item_id OR v_alloc.op_id IS NULL OR v_alloc.op_id <> NEW.op_id THEN RAISE EXCEPTION 'native ledger allocation/real-OP mismatch'; END IF;
  END IF;
  IF NEW.tipo = 'import_saldo_inicial' THEN
    IF v_header.comando_tipo <> 'import_saldo_inicial' OR v_header.ator_tipo <> 'sistema'
       OR NEW.estorno_de_id IS NOT NULL OR NEW.kg_recebido <= 0 THEN RAISE EXCEPTION 'invalid opening-balance import'; END IF;
  ELSIF NEW.tipo = 'recebimento' THEN
    IF v_header.comando_tipo <> 'recebimento' OR NEW.estorno_de_id IS NOT NULL THEN RAISE EXCEPTION 'positive native receipt/header mismatch'; END IF;
  ELSIF NEW.tipo = 'estorno' THEN
    IF v_header.comando_tipo <> 'estorno' OR NEW.estorno_de_id IS NULL THEN RAISE EXCEPTION 'native reversal/header mismatch'; END IF;
    SELECT * INTO v_source FROM public.ordem_compra_fio_lancamentos WHERE id = NEW.estorno_de_id;
    IF NOT FOUND OR v_source.tipo <> 'recebimento' OR v_source.recebimento_id IS NULL THEN RAISE EXCEPTION 'import or invalid source cannot be reversed'; END IF;
  ELSE RAISE EXCEPTION 'invalid ledger type'; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_native_lancamento_derive_state ON public.ordem_compra_fio_lancamentos;
CREATE TRIGGER trg_native_lancamento_derive_state
  AFTER INSERT ON public.ordem_compra_fio_lancamentos FOR EACH ROW
  WHEN (NEW.tipo <> 'import_saldo_inicial') EXECUTE FUNCTION public.trg_native_lancamento_derive_state();

CREATE OR REPLACE FUNCTION public.trg_import_saldo_inicial_derive_receipt_cache()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.tipo <> 'import_saldo_inicial' THEN RETURN NEW; END IF;
  UPDATE public.ordem_compra_item i SET kg_recebido = (
    SELECT COALESCE(sum(l.kg_recebido),0) FROM public.ordem_compra_fio_lancamentos l WHERE l.ordem_compra_item_id=i.id
  ) WHERE i.id=NEW.ordem_compra_item_id;
  UPDATE public.ordem_compra o SET status_recebimento = CASE
    WHEN EXISTS (SELECT 1 FROM public.ordem_compra_item i WHERE i.ordem_id=o.id AND i.kg_recebido < i.kg_pedido) THEN 'parcial'
    ELSE 'recebido' END WHERE o.id=NEW.ordem_compra_id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.trg_import_saldo_inicial_derive_receipt_cache() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER trg_import_saldo_inicial_derive_receipt_cache AFTER INSERT ON public.ordem_compra_fio_lancamentos
  FOR EACH ROW WHEN (NEW.tipo='import_saldo_inicial') EXECUTE FUNCTION public.trg_import_saldo_inicial_derive_receipt_cache();

CREATE OR REPLACE FUNCTION public.visualizar_importacao_saldo_inicial_c3a()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
WITH mapped AS (
 SELECT f.id flat_row_id, c.id mapping_id, i.id item_id, i.ordem_id, a.id allocation_id, a.op_id,
        f.kg_recebido, LEAST(f.kg_recebido,a.kg_alocado) attributed_kg,
        GREATEST(f.kg_recebido-a.kg_alocado,0) excess_kg,
        CASE WHEN f.status_administrativo='rascunho' AND f.status='recebido_total' THEN 'D'
             WHEN f.status_administrativo='emitida' AND f.kg_recebido>0 THEN 'A'
             WHEN f.status_administrativo='emitida' THEN 'B' ELSE 'C' END class
 FROM public.ordens_compra_fio f
 JOIN public.ordem_compra_item_compat_fio c ON c.ordens_compra_fio_id=f.id
 JOIN public.ordem_compra_item i ON i.id=c.ordem_compra_item_id
 JOIN public.ordem_compra_item_alocacao a ON a.item_id=i.id
 WHERE f.kg_recebido>0
), baseline AS (
 SELECT jsonb_agg(jsonb_build_object('material',tipo,'cor_id',cor_id,'cor_poliester',cor_poliester,'kg_total',kg_total) ORDER BY tipo,cor_id,cor_poliester) rows
 FROM public.saldo_fios
)
SELECT jsonb_build_object('ok',true,'flat_rows',(SELECT count(*) FROM public.ordens_compra_fio),
 'mapped_items',(SELECT count(*) FROM public.ordem_compra_item_compat_fio),
 'headers',(SELECT count(*) FROM mapped),'ledger_entries',(SELECT count(*)+count(*) FILTER (WHERE excess_kg>0) FROM mapped),
 'reconstructed_kg',(SELECT coalesce(sum(kg_recebido),0) FROM mapped),'excess_kg',(SELECT coalesce(sum(excess_kg),0) FROM mapped),
 'classes',(SELECT jsonb_object_agg(class,n) FROM (SELECT class,count(*) n FROM mapped GROUP BY class) x),
 'inventory_movements',0,'inventory_baseline',(SELECT rows FROM baseline)); $$;
REVOKE ALL ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() FROM anon;
REVOKE ALL ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() FROM service_role;
GRANT EXECUTE ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() TO authenticated;

COMMENT ON TABLE public.ordem_compra_cutover IS 'PHASE-C3A inactive cutover state. Starts legacy_active; no C3A writer fence.';
COMMENT ON FUNCTION public.visualizar_importacao_saldo_inicial_c3a() IS 'PHASE-C3A read-only preview; no import or inventory posting.';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
COMMIT;
