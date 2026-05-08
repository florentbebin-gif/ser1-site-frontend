-- Migration : statut de revue des overrides Base-Contrat.
--
-- Objectif : transformer les overrides binaires ouvert/clôturé en outil de
-- pilotage de veille juridique, sans réutiliser note_admin.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'base_contrat_review_status'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE public.base_contrat_review_status AS ENUM (
      'ok',
      'a_revoir',
      'obsolescence_a_confirmer'
    );
  END IF;
END $$;

ALTER TABLE public.base_contrat_overrides
  ADD COLUMN IF NOT EXISTS review_status public.base_contrat_review_status,
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS next_review_at date;

UPDATE public.base_contrat_overrides
SET review_status = 'ok'
WHERE review_status IS NULL;

ALTER TABLE public.base_contrat_overrides
  ALTER COLUMN review_status SET DEFAULT 'ok',
  ALTER COLUMN review_status SET NOT NULL;

COMMENT ON COLUMN public.base_contrat_overrides.review_status IS
  'Statut de revue juridique admin : ok, à revoir ou obsolescence à confirmer.';

COMMENT ON COLUMN public.base_contrat_overrides.review_reason IS
  'Raison dédiée du statut de revue, distincte de note_admin.';

COMMENT ON COLUMN public.base_contrat_overrides.next_review_at IS
  'Date de prochaine revue juridique ou fiscale attendue.';
