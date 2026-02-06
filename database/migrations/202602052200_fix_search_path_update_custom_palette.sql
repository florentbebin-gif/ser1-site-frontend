-- ============================================================================
-- MIGRATION: Fix search_path mutable pour update_custom_palette_timestamp
-- Date: 2026-02-05
-- Objectif: Sécuriser la fonction en fixant le search_path
-- ============================================================================

BEGIN;

-- Recréer la fonction avec search_path fixe
CREATE OR REPLACE FUNCTION update_custom_palette_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Fixer le search_path pour éviter les attaques par détournement de schéma
    PERFORM set_config('search_path', 'public, pg_catalog', true);
    
    IF NEW.custom_palette IS DISTINCT FROM OLD.custom_palette THEN
        NEW.custom_palette_updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
