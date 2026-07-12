-- ============================================================
-- Fase: RAVATEX-DOCUMENTS-G28-B3-B3-TECHNICAL-EVIDENCE-STORAGE-MIGRATION-PATCH
-- Persistencia remota versionada da evidencia tecnica.
--
-- Escopo desta fase (somente SQL versionado, sem apply):
--   - public.document_technical_evidences (tabela filha versionada)
--   - constraints de integridade da evidencia e da origem
--   - RLS admin-only para leitura autenticada
--   - RPC dedicada de writer service_role, idempotente por chave
--
-- Espelho remoto da tabela local document_technical_evidences do
-- Documents Ingestor. Cada linha e um snapshot imutavel de
-- TechnicalEvidence + EvidenceOrigin, identificado por
-- (document_id, evidence_version). A linha corrente e MAX(evidence_version)
-- por document_id, obtida por consulta. Nao ha coluna is_current, nao ha
-- decisao humana, status humano, evento nem copia da evidencia em
-- document_candidates.
--
-- Fora de escopo (nao alterar nesta fase):
--   - runtime do Ingestor, sync geral, CLI, reader, UI;
--   - document_candidates, document_events, document_decisions,
--     document_scan_runs e suas RPCs;
--   - qualquer decisao humana ou evento.
--
-- Nao aplicar nesta fase. Migration versionada para revisao local e
-- aplicacao controlada futura em staging. Idempotente: usa
-- IF NOT EXISTS, DO-block para constraints, CREATE OR REPLACE, recria a
-- policy e reaplica revoke/grant. Sem apply, sem dados reais, sem secrets.
-- ============================================================


-- ============================================================
-- 1. Tabela public.document_technical_evidences
-- ============================================================

CREATE TABLE IF NOT EXISTS public.document_technical_evidences (
  document_id        TEXT        NOT NULL
    REFERENCES public.document_candidates(document_id) ON DELETE CASCADE,
  evidence_version   INTEGER     NOT NULL,
  technical_evidence JSONB       NOT NULL,
  origin             JSONB       NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (document_id, evidence_version)
);

COMMENT ON TABLE public.document_technical_evidences IS
  'Espelho remoto versionado da evidencia tecnica do Ingestor. Snapshot imutavel por (document_id, evidence_version); sem is_current, sem decisao, sem status humano, sem evento.';
COMMENT ON COLUMN public.document_technical_evidences.document_id IS
  'FK para public.document_candidates(document_id), tipo TEXT. ON DELETE CASCADE remove o historico de evidencia junto do candidate removido.';
COMMENT ON COLUMN public.document_technical_evidences.evidence_version IS
  'Versao positiva alocada localmente pelo Ingestor. Aceita qualquer versao inexistente; nao exige inicio em 1, sequencia continua, ausencia de lacunas nem ordem de chegada.';
COMMENT ON COLUMN public.document_technical_evidences.technical_evidence IS
  'Objeto JSON imutavel do TechnicalEvidence. Nunca sobrescrito para a mesma chave.';
COMMENT ON COLUMN public.document_technical_evidences.origin IS
  'Objeto JSON do EvidenceOrigin. origin.evidenceVersion e inteiro positivo e deve igualar a coluna evidence_version.';
COMMENT ON COLUMN public.document_technical_evidences.created_at IS
  'Timestamp original do snapshot local recebido no sync. Nunca substituido por now() nem sobrescrito em chamada idempotente.';

-- Constraints nomeadas via DO-block idempotente (padrao das tabelas
-- documentais). Sem DEFAULT em created_at: o valor vem do snapshot.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'document_technical_evidences_evidence_version_check'
       AND conrelid = 'public.document_technical_evidences'::regclass
  ) THEN
    ALTER TABLE public.document_technical_evidences
      ADD CONSTRAINT document_technical_evidences_evidence_version_check
      CHECK (evidence_version >= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'document_technical_evidences_technical_evidence_object_check'
       AND conrelid = 'public.document_technical_evidences'::regclass
  ) THEN
    ALTER TABLE public.document_technical_evidences
      ADD CONSTRAINT document_technical_evidences_technical_evidence_object_check
      CHECK (jsonb_typeof(technical_evidence) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'document_technical_evidences_origin_object_check'
       AND conrelid = 'public.document_technical_evidences'::regclass
  ) THEN
    ALTER TABLE public.document_technical_evidences
      ADD CONSTRAINT document_technical_evidences_origin_object_check
      CHECK (jsonb_typeof(origin) = 'object');
  END IF;

  -- origin.evidenceVersion deve estar presente, ser numero JSON, inteiro
  -- positivo e estritamente igual a coluna evidence_version. Rejeita
  -- ausente, null, string numerica, decimal, zero e negativo.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'document_technical_evidences_origin_version_check'
       AND conrelid = 'public.document_technical_evidences'::regclass
  ) THEN
    ALTER TABLE public.document_technical_evidences
      ADD CONSTRAINT document_technical_evidences_origin_version_check
      -- Comparacao textual canonica: a regex garante inteiro positivo sem
      -- zero a esquerda, e evidence_version::text nunca tem zero a esquerda,
      -- logo a igualdade de texto equivale a igualdade numerica sem cast que
      -- possa lancar erro na avaliacao da constraint.
      CHECK (
        origin ? 'evidenceVersion'
        AND jsonb_typeof(origin -> 'evidenceVersion') = 'number'
        AND (origin ->> 'evidenceVersion') ~ '^[1-9][0-9]*$'
        AND (origin ->> 'evidenceVersion') = evidence_version::text
      );
  END IF;
END;
$$;

-- A chave primaria (document_id, evidence_version) ja indexa a busca da
-- maior versao por document_id (MAX(evidence_version) WHERE document_id = ?).
-- Nenhum indice adicional nem estado paralelo de versao corrente.


-- ============================================================
-- 2. RLS admin-only e grants da tabela
-- ============================================================

ALTER TABLE public.document_technical_evidences ENABLE ROW LEVEL SECURITY;

-- Leitura autenticada somente para admin. Nenhuma escrita pela aplicacao:
-- o writer service_role grava exclusivamente pela RPC SECURITY DEFINER
-- abaixo. anon nao tem nenhum acesso.
DROP POLICY IF EXISTS document_technical_evidences_admin_select
  ON public.document_technical_evidences;
CREATE POLICY document_technical_evidences_admin_select
  ON public.document_technical_evidences
  FOR SELECT
  USING (public.is_admin());

REVOKE ALL ON TABLE public.document_technical_evidences FROM PUBLIC;
REVOKE ALL ON TABLE public.document_technical_evidences FROM anon;
REVOKE ALL ON TABLE public.document_technical_evidences FROM authenticated;

-- Leitura direta para admins autenticados via RLS; sem escrita administrativa
-- pela aplicacao. service_role mantem o acesso padrao do Supabase e grava
-- apenas pela RPC definer.
GRANT SELECT ON TABLE public.document_technical_evidences TO authenticated;


-- ============================================================
-- 3. RPC writer service_role: upsert idempotente por versao
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_document_technical_evidence_ingestor_state(
  p_document_id TEXT,
  p_evidence_version INTEGER,
  p_technical_evidence JSONB,
  p_origin JSONB,
  p_created_at TIMESTAMPTZ
)
RETURNS TABLE (
  document_id      TEXT,
  evidence_version INTEGER,
  outcome          TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_document_id TEXT := NULLIF(btrim(p_document_id), '');
  v_origin_version TEXT := p_origin ->> 'evidenceVersion';
  v_existing public.document_technical_evidences%ROWTYPE;
  v_found BOOLEAN := FALSE;
BEGIN
  -- Gate interno obrigatorio: somente o writer service_role. Nao confiar
  -- apenas no grant. Qualquer outra role e rejeitada por excecao. A role
  -- nao e parametro; vem de auth.role().
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'writer_required'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_document_id IS NULL THEN
    RAISE EXCEPTION 'document_id_required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_evidence_version IS NULL OR p_evidence_version < 1 THEN
    RAISE EXCEPTION 'evidence_version_invalid'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_technical_evidence IS NULL
     OR jsonb_typeof(p_technical_evidence) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'technical_evidence_invalid'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- origin deve ser objeto e origin.evidenceVersion inteiro positivo igual
  -- a p_evidence_version. Mesma regra da constraint da tabela.
  IF p_origin IS NULL
     OR jsonb_typeof(p_origin) IS DISTINCT FROM 'object'
     OR NOT (p_origin ? 'evidenceVersion')
     OR jsonb_typeof(p_origin -> 'evidenceVersion') IS DISTINCT FROM 'number'
     OR v_origin_version !~ '^[1-9][0-9]*$'
     OR v_origin_version IS DISTINCT FROM p_evidence_version::text THEN
    RAISE EXCEPTION 'origin_evidence_version_invalid'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_created_at IS NULL THEN
    RAISE EXCEPTION 'created_at_required'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Idempotencia estrita por (document_id, evidence_version). Bloqueia a
  -- linha existente para uma comparacao consistente.
  SELECT * INTO v_existing
    FROM public.document_technical_evidences t
   WHERE t.document_id = v_document_id
     AND t.evidence_version = p_evidence_version
   FOR UPDATE;
  v_found := FOUND;

  IF v_found THEN
    -- Mesma chave: conteudo identico e idempotente (unchanged); conteudo
    -- divergente e conflito. Compara os tres campos de conteudo. Nao
    -- atualiza, nao sobrescreve created_at, nao usa ON CONFLICT DO UPDATE.
    IF v_existing.technical_evidence = p_technical_evidence
       AND v_existing.origin = p_origin
       AND v_existing.created_at IS NOT DISTINCT FROM p_created_at THEN
      RETURN QUERY SELECT v_document_id, p_evidence_version, 'unchanged'::TEXT;
      RETURN;
    END IF;

    RAISE EXCEPTION
      'technical_evidence_conflict: divergent stored content for document_id=% evidence_version=%',
      v_document_id, p_evidence_version
      USING ERRCODE = 'raise_exception';
  END IF;

  -- Chave inexistente: insere. A FK rejeita candidate inexistente; a RPC
  -- nao cria candidate. Qualquer versao inexistente, maior ou menor, e
  -- permitida: nao ha imposicao de ordem de chegada nem de historico integral.
  -- Atomicidade limitada a esta versao de evidencia. Nao ha atomicidade
  -- global entre candidate, evidence, event e scan run; este patch nao
  -- declara o sync inteiro como transacional.
  INSERT INTO public.document_technical_evidences (
    document_id, evidence_version, technical_evidence, origin, created_at
  ) VALUES (
    v_document_id, p_evidence_version, p_technical_evidence, p_origin, p_created_at
  );

  RETURN QUERY SELECT v_document_id, p_evidence_version, 'inserted'::TEXT;
  RETURN;
END;
$$;

COMMENT ON FUNCTION public.upsert_document_technical_evidence_ingestor_state(TEXT, INTEGER, JSONB, JSONB, TIMESTAMPTZ) IS
  'Writer service_role: insere um snapshot de evidencia tecnica por (document_id, evidence_version). Idempotente para conteudo identico (unchanged); rejeita conteudo divergente por excecao. Retorna apenas document_id, evidence_version e outcome.';

REVOKE ALL ON FUNCTION public.upsert_document_technical_evidence_ingestor_state(TEXT, INTEGER, JSONB, JSONB, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_document_technical_evidence_ingestor_state(TEXT, INTEGER, JSONB, JSONB, TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_document_technical_evidence_ingestor_state(TEXT, INTEGER, JSONB, JSONB, TIMESTAMPTZ) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_document_technical_evidence_ingestor_state(TEXT, INTEGER, JSONB, JSONB, TIMESTAMPTZ) TO service_role;


NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
