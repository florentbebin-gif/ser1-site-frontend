-- Migration: Create base_contrat_settings table
-- Purpose: Store the V3 "Référentiel contrats" product catalog as a versioned JSON blob.
-- Pattern: Same as fiscality_settings / tax_settings / ps_settings (id=1, data jsonb).

-- 1. Table
CREATE TABLE IF NOT EXISTS public.base_contrat_settings (
  id         integer PRIMARY KEY DEFAULT 1,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT base_contrat_settings_single_row CHECK (id = 1)
);

-- 2. RLS
ALTER TABLE public.base_contrat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read base_contrat_settings"
  ON public.base_contrat_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can write base_contrat_settings"
  ON public.base_contrat_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Trigger updated_at (reuses existing function from remote_commit migration)
CREATE TRIGGER set_updated_at_base_contrat
  BEFORE UPDATE ON public.base_contrat_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Grants
GRANT SELECT ON public.base_contrat_settings TO authenticated;
GRANT ALL ON public.base_contrat_settings TO service_role;

-- 5. Seed row
INSERT INTO public.base_contrat_settings (id, data)
VALUES (1, '{"schemaVersion": 1, "products": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;
