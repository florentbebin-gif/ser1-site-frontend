-- Migration : audit log DMTG settings — auteur de modification.
--
-- Preuve existante : `updated_at` est déjà présent sur `tax_settings` et
-- `fiscality_settings` dans la migration initiale, avec triggers `set_updated_at`.
-- Cette migration ajoute uniquement l'auteur de la dernière écriture admin.

ALTER TABLE public.tax_settings
  ADD COLUMN IF NOT EXISTS updated_by uuid;

ALTER TABLE public.fiscality_settings
  ADD COLUMN IF NOT EXISTS updated_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tax_settings_updated_by_fkey'
      AND conrelid = 'public.tax_settings'::regclass
  ) THEN
    ALTER TABLE public.tax_settings
      ADD CONSTRAINT tax_settings_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fiscality_settings_updated_by_fkey'
      AND conrelid = 'public.fiscality_settings'::regclass
  ) THEN
    ALTER TABLE public.fiscality_settings
      ADD CONSTRAINT fiscality_settings_updated_by_fkey
      FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS tax_settings_updated_by_idx
  ON public.tax_settings(updated_by);

CREATE INDEX IF NOT EXISTS fiscality_settings_updated_by_idx
  ON public.fiscality_settings(updated_by);
