-- Migration: Create base_contrat_overrides table
-- PR1 — Infrastructure pivot Base-Contrat (hybride hardcodé + admin clôture)
--
-- L'admin peut uniquement fermer/rouvrir un produit avec une date.
-- Règles fiscales : hardcodées dans src/domain/base-contrat/catalog.ts.

CREATE TABLE IF NOT EXISTS public.base_contrat_overrides (
  product_id   text        PRIMARY KEY,
  closed_date  date        NULL,
  note_admin   text        NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Trigger updated_at ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at_base_contrat_overrides()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_base_contrat_overrides_updated_at
  BEFORE UPDATE ON public.base_contrat_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_base_contrat_overrides();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.base_contrat_overrides ENABLE ROW LEVEL SECURITY;

-- Lecture : tout utilisateur authentifié du cabinet
CREATE POLICY "overrides_select_authenticated"
  ON public.base_contrat_overrides
  FOR SELECT
  TO authenticated
  USING (true);

-- Écriture : admin uniquement (public.is_admin() — même pattern que base_contrat_settings)
CREATE POLICY "overrides_write_admin"
  ON public.base_contrat_overrides
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── Grants ───────────────────────────────────────────────────────────────────

GRANT SELECT ON public.base_contrat_overrides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.base_contrat_overrides TO authenticated;
