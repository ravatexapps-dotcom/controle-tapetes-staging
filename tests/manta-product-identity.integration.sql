-- tests/manta-product-identity.integration.sql
--
-- PHASE-MANTA-A integration proof (db/78) — schema/constraint/trigger guards.
-- Governing contract: docs/architecture/MANTA_PRODUCT_VARIANT_PHASE_CONTRACT.md
--
-- ENVIRONMENT: disposable local PostgreSQL ONLY. The external runner applies the
-- Supabase-platform preamble, then db/01..db/78 in order, then this file. Never a
-- shared/remote/managed host. This file opens ONE transaction, plants its own
-- fixtures with triggers off, exercises the PHASE-MANTA-A database guards with
-- triggers on, and ROLLBACKs at the end — zero persistent mutation. db/78 clean
-- apply and idempotent re-apply are proven by the runner (apply, then reapply
-- db/78); the constraint/trigger guards below are proven here. The finishing-RPC
-- Manta rejection is additionally guarded in-code (op-persistir) and statically
-- asserted (tests/manta-product-identity-schema.smoke.js: the guard precedes
-- proximo_numero_op and derives type from tipo_produto, never the model name).
--
-- Run:  psql -X -v ON_ERROR_STOP=1 -f tests/manta-product-identity.integration.sql
-- Success = the MANTA_PRODUCT_IDENTITY_INTEGRATION_PASS sentinel with no error.

\set ON_ERROR_STOP on

BEGIN;

DO $manta$
DECLARE
  v_c1 BIGINT;
  v_c2 BIGINT;
  v_cli BIGINT;
  v_pedido UUID;
  v_lote BIGINT;
  v_op_tapete BIGINT;
  v_op_manta BIGINT;
  v_mod_tapete BIGINT;
  v_mod_manta BIGINT;
  v_ok BOOLEAN;
BEGIN
  -- ----------------------------------------------------------------------------
  -- Fixtures (triggers off): two colors; a Tapete and a Manta model sharing the
  -- same name/colors/width; a client/pedido/lote and two weaving OPs.
  -- ----------------------------------------------------------------------------
  PERFORM set_config('session_replication_role', 'replica', true);

  INSERT INTO public.cores (nome) VALUES ('MANTA-INT-KRAFT') RETURNING id INTO v_c1;
  INSERT INTO public.cores (nome) VALUES ('MANTA-INT-CRU')   RETURNING id INTO v_c2;

  -- (1) Uniqueness coexistence: a Tapete and a Manta may share name+colors+width.
  INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura, tipo_produto)
    VALUES ('MANTA-INT-BARCELONA', v_c1, v_c2, 1.40, 'tapete') RETURNING id INTO v_mod_tapete;
  INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura, tipo_produto)
    VALUES ('MANTA-INT-BARCELONA', v_c1, v_c2, 1.40, 'manta')  RETURNING id INTO v_mod_manta;

  INSERT INTO public.clientes (nome) VALUES ('MANTA-INT-CLI') RETURNING id INTO v_cli;
  INSERT INTO public.pedidos (cliente_id, numero, status)
    VALUES (v_cli, 990001, 'confirmado') RETURNING id INTO v_pedido;
  INSERT INTO public.lotes (numero, cliente_id, pedido_id)
    VALUES (990001, v_cli, v_pedido) RETURNING id INTO v_lote;
  INSERT INTO public.ops (numero, ano, status, tipo, lote_id)
    VALUES (990001, 2026, 'simulada', 'tecelagem', v_lote) RETURNING id INTO v_op_tapete;
  INSERT INTO public.ops (numero, ano, status, tipo, lote_id)
    VALUES (990002, 2026, 'simulada', 'tecelagem', v_lote) RETURNING id INTO v_op_manta;

  PERFORM set_config('session_replication_role', 'origin', true);

  -- ----------------------------------------------------------------------------
  -- (2) Manta width invariant: a Manta model must be 1.40 (CHECK rejects 2.10).
  -- ----------------------------------------------------------------------------
  v_ok := FALSE;
  BEGIN
    INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura, tipo_produto)
      VALUES ('MANTA-INT-BAD', v_c1, v_c2, 2.10, 'manta');
  EXCEPTION WHEN check_violation THEN v_ok := TRUE;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(2): Manta width 2.10 was accepted'; END IF;

  -- (3) tipo_produto domain is constrained to tapete|manta.
  v_ok := FALSE;
  BEGIN
    INSERT INTO public.modelos (nome, cor_1_id, cor_2_id, largura, tipo_produto)
      VALUES ('MANTA-INT-BADTYPE', v_c1, v_c2, 1.40, 'lencol');
  EXCEPTION WHEN check_violation THEN v_ok := TRUE;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(3): invalid tipo_produto accepted'; END IF;

  -- ----------------------------------------------------------------------------
  -- (4) pedido_itens Manta width-override guard: a non-null override <> 1.40 for
  --     a Manta model is rejected; NULL/1.40 and any Tapete override are fine.
  -- ----------------------------------------------------------------------------
  v_ok := FALSE;
  BEGIN
    INSERT INTO public.pedido_itens (pedido_id, modelo_id, metros, largura, ordem)
      VALUES (v_pedido, v_mod_manta, 100, 2.10, 1);
  EXCEPTION WHEN others THEN v_ok := TRUE;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(4): Manta pedido_item override 2.10 accepted'; END IF;

  INSERT INTO public.pedido_itens (pedido_id, modelo_id, metros, largura, ordem)
    VALUES (v_pedido, v_mod_tapete, 100, 2.10, 2);
  INSERT INTO public.pedido_itens (pedido_id, modelo_id, metros, largura, ordem)
    VALUES (v_pedido, v_mod_manta, 100, 1.40, 3);

  -- ----------------------------------------------------------------------------
  -- (5) Route-homogeneous OP guard: one OP cannot mix Tapete and Manta items;
  --     a homogeneous OP of either type is accepted.
  -- ----------------------------------------------------------------------------
  INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos) VALUES (v_op_tapete, v_mod_tapete, 100);
  v_ok := FALSE;
  BEGIN
    INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos) VALUES (v_op_tapete, v_mod_manta, 50);
  EXCEPTION WHEN others THEN v_ok := TRUE;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL(5): mixed Tapete+Manta OP accepted'; END IF;

  INSERT INTO public.op_itens (op_id, modelo_id, metros_pedidos) VALUES (v_op_manta, v_mod_manta, 100);

  RAISE NOTICE 'MANTA_PRODUCT_IDENTITY_INTEGRATION_PASS';
END
$manta$;

SELECT 'MANTA_PRODUCT_IDENTITY_INTEGRATION_PASS' AS result;

ROLLBACK;
