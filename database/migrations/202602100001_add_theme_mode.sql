-- ============================================================================
-- MIGRATION: Ajout theme_mode / preset_id / my_palette à ui_settings
-- Date: 2026-02-10
-- Objectif: Modèle déterministe à 3 états (cabinet | preset | my)
-- Compatibilité: Les anciennes colonnes (selected_theme_ref, custom_palette,
--   active_palette, colors) restent intactes — lecture en fallback côté client.
-- ============================================================================

BEGIN;

-- 1. Nouvelles colonnes (additives, aucune suppression)
ALTER TABLE public.ui_settings
  ADD COLUMN IF NOT EXISTS theme_mode  TEXT,
  ADD COLUMN IF NOT EXISTS preset_id   TEXT,
  ADD COLUMN IF NOT EXISTS my_palette  JSONB;

-- 2. Migration des données existantes
-- 2a. Copier custom_palette → my_palette (palette perso sauvegardée)
UPDATE public.ui_settings
SET my_palette = custom_palette
WHERE custom_palette IS NOT NULL
  AND my_palette IS NULL;

-- 2b. Dériver theme_mode depuis selected_theme_ref
--   cabinet / NULL  → 'cabinet'
--   custom (avec custom_palette) → 'my'
--   custom (sans custom_palette) → 'my' (safe default, active_palette préservé)
UPDATE public.ui_settings
SET theme_mode = CASE
  WHEN selected_theme_ref = 'cabinet' OR selected_theme_ref IS NULL THEN 'cabinet'
  ELSE 'my'
END
WHERE theme_mode IS NULL;

-- 3. Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_ui_settings_theme_mode
  ON public.ui_settings(theme_mode);

COMMIT;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
/*
BEGIN;
ALTER TABLE public.ui_settings
  DROP COLUMN IF EXISTS theme_mode,
  DROP COLUMN IF EXISTS preset_id,
  DROP COLUMN IF EXISTS my_palette;
COMMIT;
*/

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================
/*
SELECT
  user_id,
  theme_mode,
  preset_id,
  my_palette IS NOT NULL AS has_my_palette,
  selected_theme_ref      AS old_ref,
  custom_palette IS NOT NULL AS has_custom_palette
FROM public.ui_settings
LIMIT 20;
*/
