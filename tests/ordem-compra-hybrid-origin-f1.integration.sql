\set ON_ERROR_STOP on

BEGIN;

INSERT INTO auth.users(id, email) VALUES
  ('31111111-1111-1111-1111-111111111111', 'f1-admin-a@example.invalid'),
  ('32222222-2222-2222-2222-222222222222', 'f1-admin-b@example.invalid'),
  ('33333333-3333-3333-3333-333333333333', 'f1-client@example.invalid');

INSERT INTO public.usuarios(id, email, nome, tipo, ativo) VALUES
  ('31111111-1111-1111-1111-111111111111', 'f1-admin-a@example.invalid', 'F1 Admin A', 'admin', TRUE),
  ('32222222-2222-2222-2222-222222222222', 'f1-admin-b@example.invalid', 'F1 Admin B', 'admin', TRUE);

INSERT INTO public.fornecedores(id, nome, tipo) VALUES
  (9301, 'F1 Cotton Supplier A', 'fio_algodao'),
  (9302, 'F1 Cotton Supplier B', 'fio_algodao'),
  (9303, 'F1 Polyester Supplier', 'fio_poliester');

INSERT INTO public.clientes(id, nome) VALUES (9301, 'F1 Integration Client');
INSERT INTO public.cores(id, nome) VALUES (9301, 'F1 Integration Color');

INSERT INTO public.pedidos(id, cliente_id, numero, status) VALUES
  ('34444444-4444-4444-4444-444444444444', 9301, 993001, 'rascunho'),
  ('35555555-5555-5555-5555-555555555555', 9301, 993002, 'rascunho');

INSERT INTO public.lotes(id, numero, cliente_id, pedido_id) VALUES
  (9301, 993001, 9301, '34444444-4444-4444-4444-444444444444'),
  (9302, 993002, 9301, '35555555-5555-5555-5555-555555555555');

INSERT INTO public.ops(id, numero, ano, status, tipo, lote_id) VALUES
  (9301, 993001, 2026, 'aberta', 'tecelagem', 9301),
  (9302, 993002, 2026, 'aberta', 'tecelagem', 9302);

INSERT INTO public.necessidade_compra_fio(
  id, pedido_id, origem_tipo, op_id, material, cor_id, cor_poliester,
  kg_necessario, kg_alocado, legado
) VALUES
  (9401, '34444444-4444-4444-4444-444444444444', 'op', 9301, 'algodao', 9301, NULL, 100, 0, FALSE),
  (9402, '34444444-4444-4444-4444-444444444444', 'pedido', NULL, 'poliester', NULL, 'PRETO', 80, 0, FALSE),
  (9403, '35555555-5555-5555-5555-555555555555', 'op', 9302, 'algodao', 9301, NULL, 60, 0, FALSE);

SELECT set_config('request.jwt.claim.sub', '31111111-1111-1111-1111-111111111111', TRUE);

DO $test$
DECLARE
  r JSONB;
  replay JSONB;
  order_id BIGINT;
  item_id BIGINT;
  allocation_id BIGINT;
  shared_order_id BIGINT;
  shared_item_id BIGINT;
  shared_allocation_id BIGINT;
  op_item_id BIGINT;
  op_allocation_id BIGINT;
  receipt JSONB;
  reversal JSONB;
  source_shared BIGINT;
  source_excess BIGINT;
  op_count BIGINT;
  caught BOOLEAN := FALSE;
  keys TEXT[];
  expected_keys CONSTANT TEXT[] := ARRAY[
    'alocacao_id', 'codigo', 'cor_id', 'cor_poliester', 'discriminador',
    'fornecedor_id', 'idempotency_key', 'item_kg_pedido', 'item_removido',
    'kg_anterior', 'kg_final', 'material', 'necessidade_id',
    'necessidade_kg_alocado', 'necessidade_kg_necessario',
    'necessidade_kg_restante', 'ok', 'op_id', 'ordem_compra_id',
    'ordem_compra_item_id', 'ordem_removida', 'origem_tipo', 'pedido_id'
  ];
BEGIN
  r := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 40.000, 'op-create');
  IF r->>'discriminador' <> 'created' OR (r->>'op_id')::BIGINT <> 9301 THEN
    RAISE EXCEPTION 'OP-origin create/provenance failed: %', r;
  END IF;
  SELECT array_agg(key ORDER BY key) INTO keys FROM jsonb_object_keys(r) key;
  IF keys IS DISTINCT FROM expected_keys THEN
    RAISE EXCEPTION 'result field contract differs: %', keys;
  END IF;
  order_id := (r->>'ordem_compra_id')::BIGINT;
  item_id := (r->>'ordem_compra_item_id')::BIGINT;
  allocation_id := (r->>'alocacao_id')::BIGINT;

  replay := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 40.000, 'op-create');
  IF replay IS DISTINCT FROM r THEN
    RAISE EXCEPTION 'exact replay differed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 9301, 41.000, 'op-create')->>'codigo') <> 'idempotencia_conflitante' THEN
    RAISE EXCEPTION 'conflicting command key was not rejected';
  END IF;

  r := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 70.000, 'op-increase');
  IF r->>'discriminador' <> 'increased' OR (r->>'kg_anterior')::NUMERIC <> 40 THEN
    RAISE EXCEPTION 'increase failed: %', r;
  END IF;
  r := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 25.000, 'op-reduce');
  IF r->>'discriminador' <> 'reduced' OR (r->>'item_kg_pedido')::NUMERIC <> 25 THEN
    RAISE EXCEPTION 'reduction/derived total failed: %', r;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_item i
    WHERE i.id = item_id
      AND i.kg_pedido IS DISTINCT FROM (
        SELECT sum(a.kg_alocado) FROM public.ordem_compra_item_alocacao a WHERE a.item_id = i.id
      )
  ) THEN
    RAISE EXCEPTION 'item quantity diverged from allocation sum';
  END IF;

  BEGIN
    UPDATE public.ordem_compra_item SET kg_pedido = kg_pedido + 1 WHERE id = item_id;
    SET CONSTRAINTS ALL IMMEDIATE;
  EXCEPTION WHEN OTHERS THEN
    caught := TRUE;
  END;
  SET CONSTRAINTS ALL DEFERRED;
  IF NOT caught THEN
    RAISE EXCEPTION 'direct item quantity divergence was accepted';
  END IF;

  SELECT count(*) INTO op_count FROM public.ops;
  r := public.definir_alocacao_necessidade_compra_fio(9402, 9303, 30.000, 'shared-create');
  IF r->>'discriminador' <> 'created' OR r->'op_id' <> 'null'::JSONB THEN
    RAISE EXCEPTION 'shared create fabricated OP: %', r;
  END IF;
  shared_order_id := (r->>'ordem_compra_id')::BIGINT;
  shared_item_id := (r->>'ordem_compra_item_id')::BIGINT;
  shared_allocation_id := (r->>'alocacao_id')::BIGINT;
  IF (SELECT count(*) FROM public.ops) <> op_count THEN
    RAISE EXCEPTION 'shared command fabricated a representative OP';
  END IF;
  IF (SELECT op_id FROM public.ordem_compra_item_alocacao WHERE id = shared_allocation_id) IS NOT NULL THEN
    RAISE EXCEPTION 'shared allocation OP is not NULL';
  END IF;

  IF (public.definir_alocacao_necessidade_compra_fio(9402, 9301, 1.000, 'wrong-supplier')->>'codigo') <> 'fornecedor_incompativel' THEN
    RAISE EXCEPTION 'material-incompatible supplier was accepted';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(999999, 9301, 1.000, 'missing-need')->>'codigo') <> 'necessidade_nao_encontrada' THEN
    RAISE EXCEPTION 'missing need taxonomy failed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 999999, 1.000, 'missing-supplier')->>'codigo') <> 'fornecedor_invalido' THEN
    RAISE EXCEPTION 'missing supplier taxonomy failed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 9301, 100.001, 'over-cap')->>'codigo') <> 'excede_saldo' THEN
    RAISE EXCEPTION 'need cap failed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 9301, -1, 'negative')->>'codigo') <> 'kg_invalido' THEN
    RAISE EXCEPTION 'negative quantity taxonomy failed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 9301, 1.0001, 'scale')->>'codigo') <> 'kg_invalido' THEN
    RAISE EXCEPTION 'quantity scale taxonomy failed';
  END IF;

  PERFORM set_config('request.jwt.claim.sub', '32222222-2222-2222-2222-222222222222', TRUE);
  r := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 25.000, 'op-create');
  IF r->>'discriminador' <> 'unchanged' THEN
    RAISE EXCEPTION 'actor-scoped key was not independent: %', r;
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', TRUE);
  IF (public.definir_alocacao_necessidade_compra_fio(9401, 9301, 25.000, 'unauthorized')->>'codigo') <> 'sem_permissao' THEN
    RAISE EXCEPTION 'non-admin authorization failed';
  END IF;
  PERFORM set_config('request.jwt.claim.sub', '31111111-1111-1111-1111-111111111111', TRUE);

  r := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 0.000, 'op-remove');
  IF r->>'discriminador' <> 'removed' OR r->>'item_removido' <> 'true' OR r->>'ordem_removida' <> 'true' THEN
    RAISE EXCEPTION 'cleanup failed: %', r;
  END IF;
  IF EXISTS (SELECT 1 FROM public.ordem_compra WHERE id = order_id)
     OR EXISTS (SELECT 1 FROM public.ordem_compra_item WHERE id = item_id)
     OR EXISTS (SELECT 1 FROM public.ordem_compra_item_alocacao WHERE id = allocation_id) THEN
    RAISE EXCEPTION 'cleanup left a shell';
  END IF;
  replay := public.definir_alocacao_necessidade_compra_fio(9401, 9301, 0.000, 'op-remove');
  IF replay IS DISTINCT FROM r OR NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_distribuicao_comandos
    WHERE ator_id = '31111111-1111-1111-1111-111111111111' AND idempotency_key = 'op-remove'
  ) THEN
    RAISE EXCEPTION 'cleanup replay/audit failed';
  END IF;

  r := public.definir_alocacao_necessidade_compra_fio(9403, 9301, 20.000, 'historical-create');
  order_id := (r->>'ordem_compra_id')::BIGINT;
  IF (public.emitir_ordem_compra(order_id)->>'ok')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'owner-only isolated emission setup failed';
  END IF;
  IF (public.definir_alocacao_necessidade_compra_fio(9403, 9301, 10.000, 'post-emission')->>'codigo') <> 'estado_invalido' THEN
    RAISE EXCEPTION 'post-emission distribution was not rejected';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ordem_compra WHERE id = order_id AND status_administrativo = 'emitida') THEN
    RAISE EXCEPTION 'historical order was rewritten/deleted';
  END IF;

  r := public.definir_alocacao_necessidade_compra_fio(9402, 9303, 80.000, 'shared-fill');
  IF (public.emitir_ordem_compra(shared_order_id)->>'ok')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'shared isolated emission setup failed';
  END IF;
  receipt := public.registrar_recebimento_ordem_compra(
    shared_order_id, 'shared-receipt', clock_timestamp(), 'F1-TEST', 'isolated', 'F1',
    jsonb_build_array(
      jsonb_build_object('item_id', shared_item_id, 'destino', 'alocacao', 'alocacao_id', shared_allocation_id, 'kg', 10.000),
      jsonb_build_object('item_id', shared_item_id, 'destino', 'excesso', 'kg', 2.000)
    )
  );
  IF (receipt->>'ok')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'shared/excess receipt failed: %', receipt;
  END IF;
  SELECT id INTO source_shared FROM public.ordem_compra_fio_lancamentos
  WHERE recebimento_id = (receipt->>'recebimento_id')::BIGINT AND ordem_compra_item_alocacao_id IS NOT NULL;
  SELECT id INTO source_excess FROM public.ordem_compra_fio_lancamentos
  WHERE recebimento_id = (receipt->>'recebimento_id')::BIGINT AND ordem_compra_item_alocacao_id IS NULL;
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_fio_lancamentos
    WHERE id IN (source_shared, source_excess) AND op_id IS NOT NULL
  ) OR EXISTS (
    SELECT 1 FROM public.ordem_compra_fio_movimentos_estoque
    WHERE lancamento_id IN (source_shared, source_excess) AND op_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'shared/excess receipt or movement fabricated OP';
  END IF;

  reversal := public.estornar_recebimento_ordem_compra(
    shared_order_id, 'shared-reversal', clock_timestamp(), 'F1 isolated reversal',
    jsonb_build_array(
      jsonb_build_object('lancamento_id', source_shared, 'kg', 3.000),
      jsonb_build_object('lancamento_id', source_excess, 'kg', 1.000)
    )
  );
  IF (reversal->>'ok')::BOOLEAN IS NOT TRUE THEN
    RAISE EXCEPTION 'shared reversal failed: %', reversal;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.ordem_compra_fio_lancamentos
    WHERE recebimento_id = (reversal->>'recebimento_id')::BIGINT AND op_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'shared reversal fabricated OP';
  END IF;

  SELECT i.id INTO op_item_id
  FROM public.ordem_compra_item i WHERE i.ordem_id = order_id;
  SELECT a.id INTO op_allocation_id
  FROM public.ordem_compra_item_alocacao a WHERE a.item_id = op_item_id;
  receipt := public.registrar_recebimento_ordem_compra(
    order_id, 'op-receipt', clock_timestamp(), 'F1-OP', 'isolated', 'F1',
    jsonb_build_array(jsonb_build_object(
      'item_id', op_item_id,
      'destino', 'alocacao',
      'alocacao_id', op_allocation_id,
      'kg', 5.000
    ))
  );
  IF (receipt->>'ok')::BOOLEAN IS NOT TRUE OR EXISTS (
    SELECT 1 FROM public.ordem_compra_fio_lancamentos
    WHERE recebimento_id = (receipt->>'recebimento_id')::BIGINT AND op_id IS DISTINCT FROM 9302
  ) THEN
    RAISE EXCEPTION 'OP-origin receipt lost real OP: %', receipt;
  END IF;

  IF has_function_privilege('authenticated', 'public.definir_item_ordem_compra(uuid,bigint,text,bigint,text,numeric)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.alocar_necessidade_compra_fio(bigint,bigint,bigint,numeric)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.remover_item_ordem_compra(bigint)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.remover_alocacao_compra_fio(bigint)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.emitir_ordem_compra(bigint)', 'EXECUTE') THEN
    RAISE EXCEPTION 'obsolete/emission writer remains executable by authenticated';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.sincronizar_necessidades_compra_fio(uuid)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.cancelar_ordem_compra(bigint)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.registrar_recebimento_ordem_compra(bigint,text,timestamptz,text,text,text,jsonb)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.estornar_recebimento_ordem_compra(bigint,text,timestamptz,text,jsonb)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.visualizar_importacao_saldo_inicial_c3a()', 'EXECUTE') THEN
    RAISE EXCEPTION 'authorized RPC ACL is incomplete';
  END IF;
  IF has_function_privilege('authenticated', 'public.importar_saldo_inicial_ordem_compra_c3a(jsonb)', 'EXECUTE')
     OR has_function_privilege('service_role', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)', 'EXECUTE')
     OR EXISTS (
       SELECT 1
       FROM pg_catalog.pg_proc p,
            pg_catalog.aclexplode(COALESCE(p.proacl, pg_catalog.acldefault('f', p.proowner))) a
       WHERE p.oid = 'public.definir_alocacao_necessidade_compra_fio(bigint,bigint,numeric,text)'::regprocedure
         AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
     ) THEN
    RAISE EXCEPTION 'owner-only/new RPC ACL boundary failed';
  END IF;
END;
$test$;

ROLLBACK;

SELECT 'F1_INTEGRATION_PASS' AS result;
