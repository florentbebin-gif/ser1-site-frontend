-- Migration retroactive : 20260211001000_base_contrat_settings.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- CONTEXTE : Cette migration capture les changements de la "migration orpheline"
--   20260211001000 qui avait été appliquée directement en remote (via Supabase
--   Dashboard ou CLI hors repo) le 2026-02-11 sans être commitée dans git.
--
-- Découverte lors du sanity check post-merge PR#143 via `supabase db diff`.
-- La migration a été marquée `reverted` dans l'historique le 2026-02-25 afin
-- de débloquer le push de PR7. Ce fichier la réintroduit proprement dans le repo.
--
-- IDEMPOTENTE : utilise IF NOT EXISTS / DO $$ ... pour être safe sur le remote
--   (où la table existe déjà) et sur tout futur reset local.
-- ─────────────────────────────────────────────────────────────────────────────
-- Objet principal : table base_contrat_settings (singleton config catalogue)
-- Référencée dès 20260223000100_create_base_contrat_overrides.sql (commentaire)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.base_contrat_settings (
  id         integer                  NOT NULL DEFAULT 1,
  data       jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ── PK + contrainte singleton ────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'base_contrat_settings_pkey'
      AND conrelid = 'public.base_contrat_settings'::regclass
  ) THEN
    ALTER TABLE public.base_contrat_settings
      ADD CONSTRAINT base_contrat_settings_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'base_contrat_settings_single_row'
      AND conrelid = 'public.base_contrat_settings'::regclass
  ) THEN
    ALTER TABLE public.base_contrat_settings
      ADD CONSTRAINT base_contrat_settings_single_row CHECK (id = 1) NOT VALID;
    ALTER TABLE public.base_contrat_settings
      VALIDATE CONSTRAINT base_contrat_settings_single_row;
  END IF;
END $$;

-- ── Trigger updated_at (réutilise la fonction générique déjà définie) ─────────

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_updated_at_base_contrat'
      AND tgrelid = 'public.base_contrat_settings'::regclass
  ) THEN
    CREATE TRIGGER set_updated_at_base_contrat
      BEFORE UPDATE ON public.base_contrat_settings
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.base_contrat_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'base_contrat_settings'
      AND policyname = 'Admins can write base_contrat_settings'
  ) THEN
    CREATE POLICY "Admins can write base_contrat_settings"
      ON public.base_contrat_settings
      AS PERMISSIVE
      FOR ALL
      TO public
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'base_contrat_settings'
      AND policyname = 'Authenticated can read base_contrat_settings'
  ) THEN
    CREATE POLICY "Authenticated can read base_contrat_settings"
      ON public.base_contrat_settings
      AS PERMISSIVE
      FOR SELECT
      TO public
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ── Grants ───────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON public.base_contrat_settings TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON public.base_contrat_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON public.base_contrat_settings TO service_role;

-- ── Seed : insérer la ligne singleton si absente ─────────────────────────────

INSERT INTO public.base_contrat_settings (id, data)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
