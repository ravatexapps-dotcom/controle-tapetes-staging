-- PHASE-C3C-B-DB-PREREQ: legacy-compat database prerequisites.
-- Governing contract: docs/architecture/ORDEM_COMPRA_C3C_B_DB_PREREQUISITES_PHASE_CONTRACT.md
--   (R2 architecture accepted in §34; R3 shape-guard correction recorded in §35).
-- Normative anchors (applied normative by this phase's order):
--   ORDEM_COMPRA_LIFECYCLE_SPEC_PROPOSED.md §R.29.7
--   PEDIDO_OP_SCHEMA_CONTRACT.md §13.18
--
-- This migration installs exactly:
--   1. public.listar_ordens_compra_fio_compat(UUID, BIGINT)              -- Component A
--   2. public.registrar_recebimento_ordem_compra_fio_compat(...)          -- Component B
--   3. an additive extension of the idempotency_namespace CHECK constraints
--      on public.ordem_compra_recebimentos to admit 'legacy_compat_receipt_v1'.
--
-- Frozen architecture (contract §34, do not redesign here):
--   * both functions are installed INERT and answer only under canonical_active;
--   * deterministic LIFO reversal, admin-only decrease;
--   * imported opening balance (tipo='import_saldo_inicial') is an immutable floor;
--   * item and item x OP reader grains;
--   * fixed compat-mapped corpus (no bridge trigger, no backfill);
--   * completeness/freeze/re-baseline belong to the later real-cutover/C3D band.
--
-- Architect ruling (contract §35, R3 shape-guard correction): the installed
-- trg_native_lancamento_shape_guard (db/71/db/74) cross-checks the header's
-- comando_tipo against each ledger line's tipo. Legacy-compat receipts therefore
-- reuse the NATIVE command types -- comando_tipo='recebimento' for increase and
-- the equal/no-op record, comando_tipo='estorno' for decrease -- and are
-- distinguished SOLELY by idempotency_namespace='legacy_compat_receipt_v1'. No
-- 'recebimento_compat' comando_tipo is introduced or admitted; the comando_tipo
-- CHECK and the shape guard are left unchanged. This corrects the narrow
-- §34.3/§13.18 premise within this authorized phase.
--
-- Boundaries: no bridge trigger; no backfill; no compat-mapping row creation; no
-- modification of db/67 or db/75 objects; no existing data mutation; no product,
-- UI, JavaScript, HTML, or CSS change. Rollback = drop the two functions and
-- restore the two prior CHECK definitions (see the ROLLBACK REHEARSAL block at
-- the foot of this file). Idempotent: CREATE OR REPLACE FUNCTION and
-- DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT converge on re-run.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

-- -----------------------------------------------------------------------------
-- 1. Additive idempotency_namespace CHECK extension (idempotency_namespace only)
--
-- The namespace column is gated by TWO named constraints after db/71 (renamed
-- the IN-list check to ordem_compra_recebimentos_c3a_namespace_check) and db/75
-- (added ordem_compra_recebimentos_c3c_hash_check coupling namespace<->hash
-- shape). Both are extended additively to admit 'legacy_compat_receipt_v1' with
-- the native 32-hex md5 command hash. No existing row's namespace/type changes;
-- comando_tipo (ordem_compra_recebimentos_c3a_tipo_check) is intentionally left
-- unchanged.
-- -----------------------------------------------------------------------------

ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3a_namespace_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3a_namespace_check
    CHECK (idempotency_namespace IN (
      'native_receipt_v1', 'legacy_initial_balance_v1', 'legacy_compat_receipt_v1'
    ));

ALTER TABLE public.ordem_compra_recebimentos
  DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3c_hash_check;
ALTER TABLE public.ordem_compra_recebimentos
  ADD CONSTRAINT ordem_compra_recebimentos_c3c_hash_check CHECK (
    (idempotency_namespace = 'native_receipt_v1' AND comando_hash ~ '^[0-9a-f]{32}$')
    OR
    (idempotency_namespace = 'legacy_initial_balance_v1' AND comando_hash ~ '^[0-9a-f]{64}$')
    OR
    (idempotency_namespace = 'legacy_compat_receipt_v1' AND comando_hash ~ '^[0-9a-f]{32}$')
  );

-- -----------------------------------------------------------------------------
-- 2. Component A — canonical order-catalog projection (inert until canonical)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.listar_ordens_compra_fio_compat(
  p_pedido_id UUID    DEFAULT NULL,
  p_op_id     BIGINT  DEFAULT NULL
)
RETURNS TABLE (
  ordens_compra_fio_id      BIGINT,
  ordem_compra_id           BIGINT,
  ordem_compra_item_id      BIGINT,
  pedido_id                 UUID,
  op_id                     BIGINT,
  op_ids_multiplos          BOOLEAN,
  op_numero                 INTEGER,
  op_ano                    INTEGER,
  op_label                  TEXT,
  fornecedor_id             BIGINT,
  fornecedor_nome           TEXT,
  tipo                      TEXT,
  material                  TEXT,
  cor_id                    BIGINT,
  cor_nome                  TEXT,
  cor_poliester             TEXT,
  kg_pedido                 NUMERIC,
  kg_recebido               NUMERIC,
  kg_recebido_atribuido     NUMERIC,
  kg_excesso                NUMERIC,
  status                    TEXT,
  status_administrativo     TEXT,
  status_aceite             TEXT,
  status_recebimento        TEXT,
  data_recebimento          DATE,
  alocacoes                 JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_supplier_id BIGINT;
BEGIN
  -- Inert until canonical activation. The native cache this reader projects
  -- (ordem_compra_item.kg_recebido) is authoritative only under canonical_active
  -- (contract §30). Signal inactivity by raising, exactly like the installed
  -- canonical reader listar_recebimentos_ordem_compra_normalizados.
  IF NOT EXISTS (
    SELECT 1 FROM public.ordem_compra_cutover
    WHERE id = 1 AND status = 'canonical_active' AND read_authority = 'canonical'
  ) THEN
    RAISE EXCEPTION 'listar_compat_inativo' USING ERRCODE = '55000';
  END IF;

  IF NOT public.is_admin() THEN
    SELECT u.fornecedor_id INTO v_supplier_id
    FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.tipo = 'fornecedor' AND u.ativo = TRUE;
    IF v_supplier_id IS NULL THEN
      RAISE EXCEPTION 'sem_permissao' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_op_id IS NULL THEN
    -- Item grain: one row per compat mapping (isomorphic 1:1 with a flat row).
    RETURN QUERY
    WITH base AS (
      SELECT c.ordens_compra_fio_id AS f_id, oc.id AS oc_id, it.id AS it_id,
             oc.pedido_id AS ped_id, oc.fornecedor_id AS forn_id, forn.nome AS forn_nome,
             it.material AS mat, it.cor_id AS c_id, cor.nome AS c_nome, it.cor_poliester AS c_pol,
             it.kg_pedido AS kg_ped, it.kg_recebido AS kg_rec,
             oc.status_administrativo AS st_adm, oc.status_aceite AS st_ace,
             oc.status_recebimento AS st_rec
      FROM public.ordem_compra_item_compat_fio c
      JOIN public.ordem_compra_item it ON it.id = c.ordem_compra_item_id
      JOIN public.ordem_compra oc ON oc.id = it.ordem_id
      LEFT JOIN public.fornecedores forn ON forn.id = oc.fornecedor_id
      LEFT JOIN public.cores cor ON cor.id = it.cor_id
      WHERE oc.legado = TRUE
        AND (p_pedido_id IS NULL OR oc.pedido_id = p_pedido_id)
        AND (public.is_admin() OR oc.fornecedor_id = v_supplier_id)
    ),
    alloc AS (
      SELECT a.item_id AS it_id,
             count(*) AS n_alloc,
             count(DISTINCT a.op_id) AS n_op,
             bool_or(a.op_id IS NULL) AS has_null_op,
             min(a.op_id) AS min_op
      FROM public.ordem_compra_item_alocacao a
      GROUP BY a.item_id
    ),
    led AS (
      SELECT l.ordem_compra_item_id AS it_id,
             sum(l.kg_recebido) FILTER (WHERE l.ordem_compra_item_alocacao_id IS NOT NULL) AS kg_atr,
             sum(l.kg_recebido) FILTER (WHERE l.ordem_compra_item_alocacao_id IS NULL) AS kg_exc,
             max(l.data_recebimento) AS dt
      FROM public.ordem_compra_fio_lancamentos l
      WHERE l.recebimento_id IS NOT NULL
      GROUP BY l.ordem_compra_item_id
    )
    SELECT
      base.f_id, base.oc_id, base.it_id, base.ped_id,
      CASE WHEN al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE) THEN al.min_op ELSE NULL END,
      NOT (al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE)),
      CASE WHEN al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE) THEN o.numero ELSE NULL END,
      CASE WHEN al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE) THEN o.ano ELSE NULL END,
      CASE WHEN al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE)
           THEN 'Nº ' || o.numero || '/' || o.ano ELSE NULL END,
      base.forn_id, base.forn_nome, base.mat, base.mat, base.c_id, base.c_nome, base.c_pol,
      base.kg_ped, base.kg_rec,
      COALESCE(led.kg_atr, 0), COALESCE(led.kg_exc, 0),
      CASE WHEN base.kg_rec = 0 THEN 'pendente'
           WHEN base.kg_rec < base.kg_ped THEN 'recebido_parcial'
           ELSE 'recebido_total' END,
      base.st_adm, base.st_ace, base.st_rec,
      CASE WHEN base.kg_rec = 0 THEN NULL ELSE led.dt END,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'alocacao_id', a.id, 'op_id', a.op_id,
          'op_numero', ao.numero, 'op_ano', ao.ano,
          'kg_alocado', a.kg_alocado,
          'kg_recebido', COALESCE((
            SELECT sum(l2.kg_recebido) FROM public.ordem_compra_fio_lancamentos l2
            WHERE l2.ordem_compra_item_alocacao_id = a.id AND l2.recebimento_id IS NOT NULL
          ), 0)
        ) ORDER BY a.id)
        FROM public.ordem_compra_item_alocacao a
        LEFT JOIN public.ops ao ON ao.id = a.op_id
        WHERE a.item_id = base.it_id
      ), '[]'::jsonb)
    FROM base
    JOIN alloc al ON al.it_id = base.it_id
    LEFT JOIN led ON led.it_id = base.it_id
    LEFT JOIN public.ops o
      ON o.id = CASE WHEN al.n_op = 1 AND NOT COALESCE(al.has_null_op, FALSE) THEN al.min_op ELSE NULL END
    ORDER BY base.f_id;
  ELSE
    -- OP-attributable grain: one row per compat-mapped item that has at least
    -- one allocation in the requested OP; allocations aggregated within the OP
    -- (contract §25.2). Excess (op-less) quantities are never OP-attributable.
    RETURN QUERY
    WITH base AS (
      SELECT c.ordens_compra_fio_id AS f_id, oc.id AS oc_id, it.id AS it_id,
             oc.pedido_id AS ped_id, oc.fornecedor_id AS forn_id, forn.nome AS forn_nome,
             it.material AS mat, it.cor_id AS c_id, cor.nome AS c_nome, it.cor_poliester AS c_pol,
             oc.status_administrativo AS st_adm, oc.status_aceite AS st_ace,
             oc.status_recebimento AS st_rec
      FROM public.ordem_compra_item_compat_fio c
      JOIN public.ordem_compra_item it ON it.id = c.ordem_compra_item_id
      JOIN public.ordem_compra oc ON oc.id = it.ordem_id
      LEFT JOIN public.fornecedores forn ON forn.id = oc.fornecedor_id
      LEFT JOIN public.cores cor ON cor.id = it.cor_id
      WHERE oc.legado = TRUE
        AND (p_pedido_id IS NULL OR oc.pedido_id = p_pedido_id)
        AND (public.is_admin() OR oc.fornecedor_id = v_supplier_id)
        AND EXISTS (
          SELECT 1 FROM public.ordem_compra_item_alocacao a
          WHERE a.item_id = it.id AND a.op_id = p_op_id
        )
    ),
    opalloc AS (
      SELECT a.item_id AS it_id,
             sum(a.kg_alocado) AS kg_ped,
             COALESCE(sum(led.kg), 0) AS kg_atr,
             max(led.dt) AS dt
      FROM public.ordem_compra_item_alocacao a
      LEFT JOIN LATERAL (
        SELECT sum(l.kg_recebido) AS kg, max(l.data_recebimento) AS dt
        FROM public.ordem_compra_fio_lancamentos l
        WHERE l.ordem_compra_item_alocacao_id = a.id AND l.recebimento_id IS NOT NULL
      ) led ON TRUE
      WHERE a.op_id = p_op_id
      GROUP BY a.item_id
    )
    SELECT
      base.f_id, base.oc_id, base.it_id, base.ped_id,
      p_op_id, FALSE, o.numero, o.ano, 'Nº ' || o.numero || '/' || o.ano,
      base.forn_id, base.forn_nome, base.mat, base.mat, base.c_id, base.c_nome, base.c_pol,
      opa.kg_ped, opa.kg_atr, opa.kg_atr, 0::NUMERIC,
      CASE WHEN opa.kg_atr = 0 THEN 'pendente'
           WHEN opa.kg_atr < opa.kg_ped THEN 'recebido_parcial'
           ELSE 'recebido_total' END,
      base.st_adm, base.st_ace, base.st_rec,
      CASE WHEN opa.kg_atr = 0 THEN NULL ELSE opa.dt END,
      COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'alocacao_id', a.id, 'op_id', a.op_id,
          'op_numero', ao.numero, 'op_ano', ao.ano,
          'kg_alocado', a.kg_alocado,
          'kg_recebido', COALESCE((
            SELECT sum(l2.kg_recebido) FROM public.ordem_compra_fio_lancamentos l2
            WHERE l2.ordem_compra_item_alocacao_id = a.id AND l2.recebimento_id IS NOT NULL
          ), 0)
        ) ORDER BY a.id)
        FROM public.ordem_compra_item_alocacao a
        LEFT JOIN public.ops ao ON ao.id = a.op_id
        WHERE a.item_id = base.it_id AND a.op_id = p_op_id
      ), '[]'::jsonb)
    FROM base
    JOIN opalloc opa ON opa.it_id = base.it_id
    LEFT JOIN public.ops o ON o.id = p_op_id
    ORDER BY base.it_id;
  END IF;
END;
$$;

ALTER FUNCTION public.listar_ordens_compra_fio_compat(UUID, BIGINT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.listar_ordens_compra_fio_compat(UUID, BIGINT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.listar_ordens_compra_fio_compat(UUID, BIGINT) TO authenticated;

COMMENT ON FUNCTION public.listar_ordens_compra_fio_compat(UUID, BIGINT) IS
  'PHASE-C3C-B-DB-PREREQ Component A: canonical order-catalog projection for legacy-compat orders. Inert (raises listar_compat_inativo, 55000) unless canonical_active. Item grain (p_op_id NULL) or item x OP grain (p_op_id set). Admin unrestricted; supplier scoped to its own fornecedor. Reads the fixed compat-mapped corpus only (oc.legado = TRUE).';

-- -----------------------------------------------------------------------------
-- 3. Component B — atomic legacy receipt-intent adapter (inert until canonical)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.registrar_recebimento_ordem_compra_fio_compat(
  p_ordens_compra_fio_id BIGINT,
  p_kg_total_absoluto    NUMERIC,
  p_data_recebimento     DATE,
  p_idempotency_key      TEXT,
  p_documento_ref        TEXT DEFAULT NULL,
  p_origem_ref           TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cutover     public.ordem_compra_cutover%ROWTYPE;
  v_actor       RECORD;
  v_actor_type  TEXT;
  v_map         public.ordem_compra_item_compat_fio%ROWTYPE;
  v_order       public.ordem_compra%ROWTYPE;
  v_item        public.ordem_compra_item%ROWTYPE;
  v_header      public.ordem_compra_recebimentos%ROWTYPE;
  v_payload     JSONB;
  v_hash        TEXT;
  v_origem_ref  TEXT;
  v_header_id   BIGINT;
  v_target      NUMERIC(12,3);
  v_current     NUMERIC(12,3);
  v_delta       NUMERIC(12,3);
  v_remaining   NUMERIC(12,3);
  v_fill        NUMERIC(12,3);
  v_take        NUMERIC(12,3);
  v_capacity    NUMERIC(12,3);
  v_alloc_recv  NUMERIC(12,3);
  v_import_tot  NUMERIC(12,3);
  v_reversible  NUMERIC(12,3);
  v_line        INTEGER := 0;
  v_alloc       RECORD;
  v_src         RECORD;
  v_error       TEXT;
BEGIN
  -- Activation gate (contract §22.2): inert unless canonical_active. Never
  -- attempts a write the db/75 command-state guard would reject during
  -- legacy_active/maintenance_fenced; the guard remains the authoritative
  -- backstop, unmodified.
  SELECT * INTO v_cutover FROM public.ordem_compra_cutover WHERE id = 1;
  IF NOT FOUND OR v_cutover.status <> 'canonical_active'
     OR v_cutover.read_authority <> 'canonical' THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'recebimento_compat_inativo',
      'erro', 'Legacy-compat receipt adapter is inactive');
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Usuario nao autenticado');
  END IF;
  IF p_kg_total_absoluto IS NULL OR p_kg_total_absoluto < 0
     OR p_data_recebimento IS NULL
     OR p_idempotency_key IS NULL OR length(btrim(p_idempotency_key)) NOT BETWEEN 1 AND 200 THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'kg_absoluto_invalido',
      'erro', 'Total absoluto, data e chave de idempotencia sao obrigatorios e o total nao pode ser negativo');
  END IF;

  SELECT u.tipo, u.ativo, u.fornecedor_id INTO v_actor
  FROM public.usuarios u WHERE u.id = auth.uid();
  IF NOT FOUND OR v_actor.ativo IS NOT TRUE OR v_actor.tipo NOT IN ('admin', 'fornecedor') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Ator sem permissao de recebimento');
  END IF;
  v_actor_type := v_actor.tipo;

  -- Server-side flat->native resolution (contract §6.4.1).
  SELECT * INTO v_map FROM public.ordem_compra_item_compat_fio
  WHERE ordens_compra_fio_id = p_ordens_compra_fio_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'mapeamento_compat_ausente',
      'erro', 'Ordem legada sem mapeamento de compatibilidade');
  END IF;

  -- Lock order then item (contract §6.4.2 / §6.10 lock order steps 1-2).
  SELECT * INTO v_order FROM public.ordem_compra
  WHERE id = (SELECT it.ordem_id FROM public.ordem_compra_item it WHERE it.id = v_map.ordem_compra_item_id)
  FOR UPDATE;
  SELECT * INTO v_item FROM public.ordem_compra_item
  WHERE id = v_map.ordem_compra_item_id FOR UPDATE;
  IF v_order.id IS NULL OR v_item.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'erro', 'Ordem/item nativo ausente');
  END IF;

  -- Legacy-appropriate eligibility gate (contract §6.4.3): permits emitida and
  -- rascunho (Class D), rejects cancelada; native-only 'emitida' rule not used.
  IF NOT v_order.legado
     OR v_order.status_administrativo = 'cancelada'
     OR v_order.status_aceite NOT IN ('nao_aplicavel', 'aceita') THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'estado_invalido',
      'erro', 'Ordem legada nao elegivel para recebimento');
  END IF;

  -- Order/actor permission for the general (increase/equal) path (§6.10).
  IF v_actor_type = 'admin' THEN
    IF NOT public.is_admin() THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Administrador invalido');
    END IF;
  ELSIF v_actor.fornecedor_id IS NULL OR v_actor.fornecedor_id IS DISTINCT FROM v_order.fornecedor_id THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'sem_permissao', 'erro', 'Fornecedor nao corresponde a ordem');
  END IF;

  -- Deterministic idempotency identity built from the caller's intent only.
  v_origem_ref := COALESCE(NULLIF(btrim(p_origem_ref), ''), p_ordens_compra_fio_id::TEXT);
  v_payload := jsonb_build_object(
    'schema_version', 1,
    'flat_row_id', p_ordens_compra_fio_id,
    'ordem_compra_id', v_order.id,
    'ordem_compra_item_id', v_item.id,
    'kg_total_absoluto', to_char(p_kg_total_absoluto::NUMERIC(12,3), 'FM999999999990.000'),
    'data_recebimento', to_char(p_data_recebimento, 'YYYY-MM-DD'),
    'documento_ref', NULLIF(btrim(p_documento_ref), ''),
    'origem_ref', v_origem_ref
  );
  v_hash := md5(v_payload::TEXT);

  -- Actor-scoped advisory idempotency lock, then the header lookup (§6.10 step 5,
  -- taken before the lookup, consistent with the native command).
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'legacy_compat_receipt_v1|' || v_actor_type || '|' || auth.uid()::TEXT || '|' || btrim(p_idempotency_key), 0
  ));

  SELECT * INTO v_header FROM public.ordem_compra_recebimentos h
  WHERE h.idempotency_namespace = 'legacy_compat_receipt_v1'
    AND h.ator_tipo = v_actor_type
    AND h.ator_id = auth.uid()
    AND h.idempotency_key = btrim(p_idempotency_key)
  FOR UPDATE;
  IF FOUND THEN
    IF v_header.comando_payload = v_payload AND v_header.comando_hash = v_hash
       AND v_header.ordem_compra_id = v_order.id THEN
      IF v_header.resultado_metadata ->> 'outcome' = 'no_change' THEN
        RETURN jsonb_build_object('ok', true, 'codigo', 'sem_alteracao',
          'recebimento_id', v_header.id, 'ordem_compra_id', v_header.ordem_compra_id);
      END IF;
      RETURN public._resultado_comando_recebimento(v_header.id);
    END IF;
    RETURN jsonb_build_object('ok', false, 'codigo', 'idempotencia_conflitante',
      'erro', 'Chave reutilizada com comando diferente');
  END IF;

  -- Immutable delta computed under the item lock (no TOCTOU window, §6.5).
  v_target  := p_kg_total_absoluto::NUMERIC(12,3);
  v_current := v_item.kg_recebido;
  v_delta   := v_target - v_current;

  IF v_delta < 0 AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'codigo', 'decremento_exige_admin',
      'erro', 'Somente administrador pode reduzir o total recebido');
  END IF;

  -- Lock the item's allocations and existing ledger lines (§6.10 steps 3-4).
  PERFORM 1 FROM public.ordem_compra_item_alocacao a
  WHERE a.item_id = v_item.id ORDER BY a.id FOR UPDATE;
  PERFORM l.id FROM public.ordem_compra_fio_lancamentos l
  WHERE l.ordem_compra_item_id = v_item.id ORDER BY l.id FOR UPDATE;
  PERFORM pg_advisory_xact_lock(hashtextextended(
    'native_receipt_inventory|' || v_item.material || '|'
    || COALESCE(v_item.cor_id::TEXT, '') || '|' || COALESCE(v_item.cor_poliester, ''), 0
  ));

  IF v_delta = 0 THEN
    -- Deterministic no-op: record the idempotency header (comando_tipo native
    -- 'recebimento') with zero ledger lines; not a productive receipt (no PONR).
    INSERT INTO public.ordem_compra_recebimentos(
      ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
      ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
      comando_payload, comando_hash, resultado_metadata
    ) VALUES (
      v_order.id, 'recebimento', 'legacy_compat_receipt_v1', btrim(p_idempotency_key),
      auth.uid(), v_actor_type, p_data_recebimento::timestamptz,
      NULLIF(btrim(p_documento_ref), ''), 'legacy_compat_intent_v1', v_origem_ref,
      v_payload, v_hash,
      jsonb_build_object('schema_version', 1, 'outcome', 'no_change',
        'kg_anterior', to_char(v_current, 'FM999999999990.000'),
        'kg_total_absoluto', to_char(v_target, 'FM999999999990.000'))
    ) RETURNING id INTO v_header_id;
    RETURN jsonb_build_object('ok', true, 'codigo', 'sem_alteracao',
      'recebimento_id', v_header_id, 'ordem_compra_id', v_order.id);

  ELSIF v_delta > 0 THEN
    -- Increase: fan out ascending allocation id, spilling the remainder to one
    -- explicit excess line (§6.6). comando_tipo native 'recebimento'.
    INSERT INTO public.ordem_compra_recebimentos(
      ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
      ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
      comando_payload, comando_hash, resultado_metadata
    ) VALUES (
      v_order.id, 'recebimento', 'legacy_compat_receipt_v1', btrim(p_idempotency_key),
      auth.uid(), v_actor_type, p_data_recebimento::timestamptz,
      NULLIF(btrim(p_documento_ref), ''), 'legacy_compat_intent_v1', v_origem_ref,
      v_payload, v_hash,
      jsonb_build_object('schema_version', 1, 'outcome', 'increase',
        'kg_anterior', to_char(v_current, 'FM999999999990.000'),
        'kg_total_absoluto', to_char(v_target, 'FM999999999990.000'),
        'delta', to_char(v_delta, 'FM999999999990.000'))
    ) RETURNING id INTO v_header_id;

    v_remaining := v_delta;
    FOR v_alloc IN
      SELECT a.id, a.op_id, a.kg_alocado
      FROM public.ordem_compra_item_alocacao a
      WHERE a.item_id = v_item.id
      ORDER BY a.id
    LOOP
      EXIT WHEN v_remaining <= 0;
      SELECT COALESCE(sum(l.kg_recebido), 0) INTO v_alloc_recv
      FROM public.ordem_compra_fio_lancamentos l
      WHERE l.ordem_compra_item_alocacao_id = v_alloc.id AND l.recebimento_id IS NOT NULL;
      v_capacity := v_alloc.kg_alocado - v_alloc_recv;
      IF v_capacity <= 0 THEN CONTINUE; END IF;
      v_fill := LEAST(v_remaining, v_capacity);
      v_line := v_line + 1;
      INSERT INTO public.ordem_compra_fio_lancamentos(
        ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
        observacao, criado_por, tipo, estorno_de_id, idempotency_key,
        origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
        ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
        kg_excesso, ator_tipo, linha_indice
      ) VALUES (
        NULL, v_item.id, v_fill, p_data_recebimento,
        NULLIF(btrim(p_documento_ref), ''), auth.uid(), 'recebimento', NULL,
        'legacy_compat_receipt:' || v_header_id::TEXT || ':' || v_line::TEXT,
        'legacy_compat_intent_v1', v_origem_ref, v_header_id, v_order.id,
        v_alloc.id, v_alloc.op_id, v_item.material, v_item.cor_id, v_item.cor_poliester,
        0, v_actor_type, v_line
      );
      v_remaining := v_remaining - v_fill;
    END LOOP;

    IF v_remaining > 0 THEN
      v_line := v_line + 1;
      INSERT INTO public.ordem_compra_fio_lancamentos(
        ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
        observacao, criado_por, tipo, estorno_de_id, idempotency_key,
        origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
        ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
        kg_excesso, ator_tipo, linha_indice
      ) VALUES (
        NULL, v_item.id, v_remaining, p_data_recebimento,
        NULLIF(btrim(p_documento_ref), ''), auth.uid(), 'recebimento', NULL,
        'legacy_compat_receipt:' || v_header_id::TEXT || ':' || v_line::TEXT,
        'legacy_compat_intent_v1', v_origem_ref, v_header_id, v_order.id,
        NULL, NULL, v_item.material, v_item.cor_id, v_item.cor_poliester,
        v_remaining, v_actor_type, v_line
      );
      v_remaining := 0;
    END IF;

    -- Productive canonical receipt participates in the single §R.29.3 PONR
    -- exactly as the native command (contract §22.4). No second PONR is created.
    UPDATE public.ordem_compra_cutover
    SET productive_receipt_started_at = COALESCE(productive_receipt_started_at, clock_timestamp())
    WHERE id = 1;
    RETURN public._resultado_comando_recebimento(v_header_id);

  ELSE
    -- Decrease (admin-only): imported opening balance is an immutable floor
    -- (§24); reversal is deterministic LIFO over tipo='recebimento' lines (§6.7).
    SELECT COALESCE(sum(l.kg_recebido), 0) INTO v_import_tot
    FROM public.ordem_compra_fio_lancamentos l
    WHERE l.ordem_compra_item_id = v_item.id
      AND l.tipo = 'import_saldo_inicial' AND l.recebimento_id IS NOT NULL;
    IF v_target < v_import_tot THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'reducao_abaixo_saldo_importado',
        'erro', 'Reducao abaixo do saldo importado imutavel',
        'saldo_importado', to_char(v_import_tot, 'FM999999999990.000'));
    END IF;

    SELECT COALESCE(sum(rev.remaining), 0) INTO v_reversible FROM (
      SELECT p.kg_recebido + COALESCE((
        SELECT sum(r.kg_recebido) FROM public.ordem_compra_fio_lancamentos r
        WHERE r.estorno_de_id = p.id
      ), 0) AS remaining
      FROM public.ordem_compra_fio_lancamentos p
      WHERE p.ordem_compra_item_id = v_item.id
        AND p.tipo = 'recebimento' AND p.recebimento_id IS NOT NULL
    ) rev;
    v_remaining := v_current - v_target;
    IF v_remaining > v_reversible THEN
      RETURN jsonb_build_object('ok', false, 'codigo', 'excede_estornavel',
        'erro', 'Reducao excede o saldo reversivel',
        'disponivel', to_char(v_reversible, 'FM999999999990.000'));
    END IF;

    INSERT INTO public.ordem_compra_recebimentos(
      ordem_compra_id, comando_tipo, idempotency_namespace, idempotency_key,
      ator_id, ator_tipo, ocorrido_em, documento_ref, origem_tipo, origem_ref,
      comando_payload, comando_hash, resultado_metadata
    ) VALUES (
      v_order.id, 'estorno', 'legacy_compat_receipt_v1', btrim(p_idempotency_key),
      auth.uid(), v_actor_type, p_data_recebimento::timestamptz,
      NULLIF(btrim(p_documento_ref), ''), 'legacy_compat_intent_v1', v_origem_ref,
      v_payload, v_hash,
      jsonb_build_object('schema_version', 1, 'outcome', 'decrease',
        'kg_anterior', to_char(v_current, 'FM999999999990.000'),
        'kg_total_absoluto', to_char(v_target, 'FM999999999990.000'),
        'delta', to_char(v_delta, 'FM999999999990.000'))
    ) RETURNING id INTO v_header_id;

    FOR v_src IN
      SELECT p.id, p.ordem_compra_item_alocacao_id AS aloc_id, p.op_id,
             p.material, p.cor_id, p.cor_poliester, p.kg_excesso,
             p.kg_recebido + COALESCE((
               SELECT sum(r.kg_recebido) FROM public.ordem_compra_fio_lancamentos r
               WHERE r.estorno_de_id = p.id
             ), 0) AS remaining
      FROM public.ordem_compra_fio_lancamentos p
      WHERE p.ordem_compra_item_id = v_item.id
        AND p.tipo = 'recebimento' AND p.recebimento_id IS NOT NULL
      ORDER BY p.id DESC
    LOOP
      EXIT WHEN v_remaining <= 0;
      IF v_src.remaining <= 0 THEN CONTINUE; END IF;
      v_take := LEAST(v_remaining, v_src.remaining);
      v_line := v_line + 1;
      INSERT INTO public.ordem_compra_fio_lancamentos(
        ordem_compra_fio_id, ordem_compra_item_id, kg_recebido, data_recebimento,
        observacao, criado_por, tipo, estorno_de_id, idempotency_key,
        origem_tipo, origem_ref, recebimento_id, ordem_compra_id,
        ordem_compra_item_alocacao_id, op_id, material, cor_id, cor_poliester,
        kg_excesso, ator_tipo, linha_indice
      ) VALUES (
        NULL, v_item.id, -v_take, p_data_recebimento,
        'ajuste_absoluto_legacy_compat', auth.uid(), 'estorno', v_src.id,
        'legacy_compat_reversal:' || v_header_id::TEXT || ':' || v_line::TEXT,
        'legacy_compat_intent_v1', v_src.id::TEXT, v_header_id, v_order.id,
        v_src.aloc_id, v_src.op_id, v_src.material, v_src.cor_id, v_src.cor_poliester,
        CASE WHEN v_src.kg_excesso <> 0 THEN -v_take ELSE 0 END, v_actor_type, v_line
      );
      v_remaining := v_remaining - v_take;
    END LOOP;

    IF v_remaining > 0 THEN
      -- Unreachable given the reversible check above; fail closed if reached.
      RAISE EXCEPTION 'excede_estornavel_interno';
    END IF;
    RETURN public._resultado_comando_recebimento(v_header_id);
  END IF;

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
  RETURN jsonb_build_object('ok', false, 'codigo', 'erro_interno', 'erro', v_error);
END;
$$;

ALTER FUNCTION public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT) IS
  'PHASE-C3C-B-DB-PREREQ Component B: atomic legacy receipt-intent adapter. Inert (returns recebimento_compat_inativo) unless canonical_active. Resolves the flat row through the compat mapping, computes an immutable absolute-total delta under lock, and translates it into the native immutable ledger: increase fans out over allocations then explicit excess (comando_tipo recebimento, participates in the §R.29.3 PONR); decrease is admin-only, deterministic LIFO over tipo=recebimento lines with the imported balance as an immutable floor (comando_tipo estorno). Compat identity is carried only by idempotency_namespace=legacy_compat_receipt_v1.';

-- -----------------------------------------------------------------------------
-- 4. Schema cache reload (PostgREST)
-- -----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- =============================================================================
-- ROLLBACK REHEARSAL (documentary; not executed by apply)
--
-- Reduced-manifest rollback (contract §34.4): drop the two new functions and
-- restore the two prior idempotency_namespace CHECK definitions. No backfill
-- rows exist to preserve or remove; no bridge trigger exists to remove; db/76
-- created no ordem_compra_item_compat_fio row and introduced no FK on the legacy
-- delete/reinsert flow. comando_tipo (c3a_tipo_check) was never changed.
--
--   BEGIN;
--   DROP FUNCTION IF EXISTS public.registrar_recebimento_ordem_compra_fio_compat(BIGINT, NUMERIC, DATE, TEXT, TEXT, TEXT);
--   DROP FUNCTION IF EXISTS public.listar_ordens_compra_fio_compat(UUID, BIGINT);
--   ALTER TABLE public.ordem_compra_recebimentos
--     DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3a_namespace_check;
--   ALTER TABLE public.ordem_compra_recebimentos
--     ADD CONSTRAINT ordem_compra_recebimentos_c3a_namespace_check
--       CHECK (idempotency_namespace IN ('native_receipt_v1','legacy_initial_balance_v1'));
--   ALTER TABLE public.ordem_compra_recebimentos
--     DROP CONSTRAINT IF EXISTS ordem_compra_recebimentos_c3c_hash_check;
--   ALTER TABLE public.ordem_compra_recebimentos
--     ADD CONSTRAINT ordem_compra_recebimentos_c3c_hash_check CHECK (
--       (idempotency_namespace = 'native_receipt_v1' AND comando_hash ~ '^[0-9a-f]{32}$')
--       OR
--       (idempotency_namespace = 'legacy_initial_balance_v1' AND comando_hash ~ '^[0-9a-f]{64}$')
--     );
--   NOTIFY pgrst, 'reload schema';
--   COMMIT;
-- =============================================================================
