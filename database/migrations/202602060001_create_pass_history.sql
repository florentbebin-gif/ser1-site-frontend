-- ============================================================================
-- MIGRATION: Création table pass_history + RPC ensure_pass_history_current
-- Date: 2026-02-06
-- Objectif: Référentiel PASS dynamique (8 dernières années, rollover au 1er janvier)
-- ============================================================================

BEGIN;

-- 1. Table pass_history
CREATE TABLE IF NOT EXISTS public.pass_history (
  year        INT PRIMARY KEY,
  pass_amount NUMERIC,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_pass_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pass_history_updated_at ON public.pass_history;
CREATE TRIGGER trg_pass_history_updated_at
  BEFORE UPDATE ON public.pass_history
  FOR EACH ROW EXECUTE FUNCTION public.update_pass_history_updated_at();

-- 3. Seed des 8 valeurs existantes (identiques au tableau statique)
INSERT INTO public.pass_history (year, pass_amount) VALUES
  (2019, 40524),
  (2020, 41136),
  (2021, 41136),
  (2022, 41136),
  (2023, 43992),
  (2024, 46368),
  (2025, 47100),
  (2026, 48060)
ON CONFLICT (year) DO NOTHING;

-- 4. RLS
ALTER TABLE public.pass_history ENABLE ROW LEVEL SECURITY;

-- Lecture : utilisateurs authentifiés
DROP POLICY IF EXISTS "pass_history_select" ON public.pass_history;
CREATE POLICY "pass_history_select"
  ON public.pass_history FOR SELECT
  TO authenticated
  USING (true);

-- Écriture (insert/update/delete) : admin uniquement
DROP POLICY IF EXISTS "pass_history_admin_insert" ON public.pass_history;
CREATE POLICY "pass_history_admin_insert"
  ON public.pass_history FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pass_history_admin_update" ON public.pass_history;
CREATE POLICY "pass_history_admin_update"
  ON public.pass_history FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "pass_history_admin_delete" ON public.pass_history;
CREATE POLICY "pass_history_admin_delete"
  ON public.pass_history FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. RPC ensure_pass_history_current()
--    Idempotente : insère les années manquantes jusqu'à currentYear,
--    puis supprime les plus anciennes pour garder exactement 8 lignes.
--    SECURITY DEFINER pour permettre l'appel par tout utilisateur authentifié.
CREATE OR REPLACE FUNCTION public.ensure_pass_history_current()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_year INT := EXTRACT(YEAR FROM now())::INT;
  v_max_year     INT;
  v_y            INT;
BEGIN
  -- Récupérer l'année max existante
  SELECT max(year) INTO v_max_year FROM public.pass_history;

  -- Si la table est vide, rien à faire (le seed doit avoir été appliqué)
  IF v_max_year IS NULL THEN
    RETURN;
  END IF;

  -- Insérer les années manquantes jusqu'à l'année courante
  IF v_max_year < v_current_year THEN
    FOR v_y IN (v_max_year + 1)..v_current_year LOOP
      INSERT INTO public.pass_history (year, pass_amount)
      VALUES (v_y, NULL)
      ON CONFLICT (year) DO NOTHING;
    END LOOP;
  END IF;

  -- Garder exactement les 8 plus récentes
  DELETE FROM public.pass_history
  WHERE year NOT IN (
    SELECT year FROM public.pass_history
    ORDER BY year DESC
    LIMIT 8
  );
END;
$$;

-- Accès pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.ensure_pass_history_current() TO authenticated;

COMMIT;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
/*
BEGIN;
DROP FUNCTION IF EXISTS public.ensure_pass_history_current();
DROP TRIGGER IF EXISTS trg_pass_history_updated_at ON public.pass_history;
DROP FUNCTION IF EXISTS public.update_pass_history_updated_at();
DROP TABLE IF EXISTS public.pass_history;
COMMIT;
*/
