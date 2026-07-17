-- ============================================================
-- Fase: G28-CAMADA-2 A6.1-B — Preserve usuarios_eventos on profile delete
--
-- Corrective, forward-only migration over db/60 (applied, immutable —
-- this migration does not edit db/60, it alters what db/60 created).
--
-- Root cause: db/60's usuarios_eventos.usuario_id FK used
-- ON DELETE CASCADE. admin-delete-user (A6.2 scope) hard-deletes the
-- public.usuarios row; under CASCADE the event row for that user is
-- destroyed in the same statement, before or instead of ever
-- surviving — an audit trail that disappears with its subject is not
-- an audit trail. Architect ruling: CASCADE rejected (destroys the
-- trail); dropping the FK entirely rejected (loses integrity while
-- the subject still exists). Adopted: ON DELETE SET NULL + a
-- denormalized identity snapshot captured at insert time, so the
-- event remains self-describing after the parent row is gone.
--
-- Scope:
--   1. usuarios_eventos.usuario_id: NOT NULL -> nullable; FK
--      recreated with ON DELETE SET NULL (CASCADE dropped).
--   2. New nullable snapshot columns: usuario_email, usuario_nome,
--      usuario_tipo. Chosen as the minimum needed to make a
--      parent-less event row readable in an audit UI (A6.3) — "who
--      was this about" (email/nome) and "what kind of account"
--      (tipo). Nothing sensitive beyond identity is snapshotted: no
--      password/token/observacoes/fornecedor_id/cliente_id — those
--      either never existed in usuarios_eventos or are out of this
--      table's stated purpose (payload already carries the specific
--      changed fields for perfil_alterado events).
--   3. trigger_usuario_evento() (db/60) updated in place (CREATE OR
--      REPLACE, same function identity) to populate the 3 snapshot
--      columns from NEW (the row mid-UPDATE, already available — no
--      extra query).
--   4. Backfill: existing usuarios_eventos rows whose parent
--      public.usuarios row still exists get their snapshot populated
--      from that live row. At the time of this migration, staging
--      usuarios_eventos is empty (0 rows — confirmed at the A6.1
--      staging verify, which runs entirely inside BEGIN...ROLLBACK)
--      because trg_usuario_evento only started recording with db/60
--      and no direct-UPDATE admin edit has landed since; the backfill
--      statement is included for correctness/idempotency regardless
--      of that current emptiness, and is a no-op today.
--   5. ACL/RLS: unchanged intent from db/60 (admin-only SELECT, no
--      client writes) — re-asserted verbatim (not just inherited) so
--      the final grants/policy are provably explicit, not assumed.
--
-- Idempotent: can run multiple times without cumulative effect.
-- No destructive DELETE, no real data, no secrets.
-- ============================================================


-- ============================================================
-- 1. usuario_id: nullable + FK ON DELETE SET NULL
-- ============================================================

ALTER TABLE public.usuarios_eventos
  ALTER COLUMN usuario_id DROP NOT NULL;

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT con.conname
    FROM pg_constraint con
    WHERE con.conrelid = 'public.usuarios_eventos'::regclass
      AND con.contype = 'f'
      AND con.confrelid = 'public.usuarios'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.usuarios_eventos DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;
END $$;

ALTER TABLE public.usuarios_eventos
  ADD CONSTRAINT usuarios_eventos_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.usuarios_eventos.usuario_id IS
  'Subject of the event. NULL once the subject profile has been permanently deleted (admin-delete-user) — the event survives via the snapshot columns below, per the ON DELETE SET NULL FK.';


-- ============================================================
-- 2. Identity snapshot columns
-- ============================================================

ALTER TABLE public.usuarios_eventos
  ADD COLUMN IF NOT EXISTS usuario_email TEXT,
  ADD COLUMN IF NOT EXISTS usuario_nome  TEXT,
  ADD COLUMN IF NOT EXISTS usuario_tipo  TEXT;

COMMENT ON COLUMN public.usuarios_eventos.usuario_email IS
  'Snapshot of usuarios.email at event time. Kept even after usuario_id becomes NULL (profile deleted) so the event stays readable. Not a substitute for usuario_id while the parent row exists.';

COMMENT ON COLUMN public.usuarios_eventos.usuario_nome IS
  'Snapshot of usuarios.nome at event time. Same survival purpose as usuario_email.';

COMMENT ON COLUMN public.usuarios_eventos.usuario_tipo IS
  'Snapshot of usuarios.tipo at event time. Same survival purpose as usuario_email.';


-- ============================================================
-- 3. Trigger: populate the snapshot columns (same function identity
-- as db/60 — CREATE OR REPLACE, no new trigger, no re-binding needed)
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_usuario_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old     JSONB;
  v_new     JSONB;
  v_changed JSONB := '{}'::jsonb;
  v_key     TEXT;
  v_watched TEXT[] := ARRAY['ativo', 'tipo', 'nivel_acesso', 'senha_temporaria'];
BEGIN
  -- service_role context (Edge Functions): no JWT, auth.uid() is NULL.
  -- Those flows record explicitly (A6.2) — skip here to avoid
  -- double-recording. See db/60 design decision note.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  v_old := to_jsonb(OLD);
  v_new := to_jsonb(NEW);

  FOREACH v_key IN ARRAY v_watched LOOP
    IF v_old ? v_key AND (v_old -> v_key) IS DISTINCT FROM (v_new -> v_key) THEN
      v_changed := v_changed || jsonb_build_object(
        v_key, jsonb_build_object('de', v_old -> v_key, 'para', v_new -> v_key)
      );
    END IF;
  END LOOP;

  IF v_changed <> '{}'::jsonb THEN
    INSERT INTO public.usuarios_eventos (
      usuario_id, tipo_evento, ator_id, payload,
      usuario_email, usuario_nome, usuario_tipo
    )
    VALUES (
      NEW.id, 'perfil_alterado', auth.uid(), v_changed,
      NEW.email, NEW.nome, NEW.tipo
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger binding itself is untouched (same trigger name/timing/table
-- as db/60); CREATE OR REPLACE FUNCTION above is sufficient.


-- ============================================================
-- 4. Backfill: snapshot existing rows whose parent still exists
-- (staging test data only; 0 rows expected/affected at this migration
-- per the note above — statement included for correctness/idempotency)
-- ============================================================

UPDATE public.usuarios_eventos ue
SET usuario_email = u.email,
    usuario_nome  = u.nome,
    usuario_tipo  = u.tipo
FROM public.usuarios u
WHERE ue.usuario_id = u.id
  AND ue.usuario_email IS NULL
  AND ue.usuario_nome IS NULL
  AND ue.usuario_tipo IS NULL;


-- ============================================================
-- 5. RLS + grants — re-asserted verbatim from db/60 (explicit, not
-- inherited)
-- ============================================================

ALTER TABLE public.usuarios_eventos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.usuarios_eventos FROM PUBLIC;
REVOKE ALL ON TABLE public.usuarios_eventos FROM anon;
REVOKE ALL ON TABLE public.usuarios_eventos FROM authenticated;

GRANT SELECT ON TABLE public.usuarios_eventos TO authenticated;

DROP POLICY IF EXISTS usuarios_eventos_admin_select ON public.usuarios_eventos;
CREATE POLICY usuarios_eventos_admin_select ON public.usuarios_eventos FOR SELECT
  USING (is_admin());


-- ============================================================
-- Schema cache reload (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
