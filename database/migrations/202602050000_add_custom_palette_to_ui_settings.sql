-- ============================================================================
-- MIGRATION: Ajout custom_palette et selected_theme_ref à ui_settings
-- Date: 2026-02-05
-- Objectif: Séparer la palette personnalisée (persistante) du thème sélectionné
-- ============================================================================

BEGIN;

-- 1. Ajouter les nouvelles colonnes
ALTER TABLE public.ui_settings 
  ADD COLUMN IF NOT EXISTS custom_palette JSONB,
  ADD COLUMN IF NOT EXISTS custom_palette_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS selected_theme_ref TEXT DEFAULT 'cabinet',
  ADD COLUMN IF NOT EXISTS active_palette JSONB; -- Copie dénormalisée pour affichage rapide

-- 2. Migrer les données existantes
-- Si theme_name = 'custom' ou 'custom-ui-only', migrer vers custom_palette
UPDATE public.ui_settings 
SET 
  custom_palette = colors,
  custom_palette_updated_at = updated_at,
  selected_theme_ref = 'custom',
  active_palette = colors
WHERE theme_name IN ('custom', 'custom-ui-only');

-- Si theme_name = thème prédéfini (pas 'default'), migrer vers selected_theme_ref
UPDATE public.ui_settings 
SET 
  selected_theme_ref = theme_name,
  active_palette = colors
WHERE theme_name NOT IN ('custom', 'custom-ui-only', 'default') 
  AND theme_name IS NOT NULL;

-- 3. Créer un index sur selected_theme_ref pour les recherches
CREATE INDEX IF NOT EXISTS idx_ui_settings_selected_theme 
  ON public.ui_settings(selected_theme_ref);

-- 4. Trigger pour mettre à jour custom_palette_updated_at
CREATE OR REPLACE FUNCTION update_custom_palette_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.custom_palette IS DISTINCT FROM OLD.custom_palette THEN
        NEW.custom_palette_updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_palette_timestamp ON public.ui_settings;
CREATE TRIGGER update_custom_palette_timestamp
    BEFORE UPDATE ON public.ui_settings
    FOR EACH ROW EXECUTE FUNCTION update_custom_palette_timestamp();

COMMIT;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
/*
BEGIN;
DROP TRIGGER IF EXISTS update_custom_palette_timestamp ON public.ui_settings;
ALTER TABLE public.ui_settings 
  DROP COLUMN IF EXISTS custom_palette,
  DROP COLUMN IF EXISTS custom_palette_updated_at,
  DROP COLUMN IF EXISTS selected_theme_ref,
  DROP COLUMN IF EXISTS active_palette;
COMMIT;
*/

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================
/*
-- Vérifier les colonnes
SELECT column_name, data_type 
FROM information.columns 
WHERE table_name = 'ui_settings';

-- Vérifier la migration des données
SELECT 
  user_id,
  theme_name as ancien_theme,
  selected_theme_ref as nouveau_ref,
  custom_palette IS NOT NULL as a_custom_palette,
  custom_palette_updated_at
FROM ui_settings 
LIMIT 10;
*/
