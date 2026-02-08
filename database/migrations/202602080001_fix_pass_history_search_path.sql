-- ============================================================================
-- MIGRATION: Fix search_path mutable sur update_pass_history_updated_at
-- Date: 2026-02-08
-- Objectif: Résoudre le warning Supabase Security Advisor "function_search_path_mutable"
-- ============================================================================

BEGIN;

-- Fix: Ajouter SET search_path à la fonction trigger
-- Cela garantit que la fonction résout toujours les objets dans les bons schémas
CREATE OR REPLACE FUNCTION public.update_pass_history_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMIT;

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
/*
BEGIN;
-- Restaurer la version sans search_path fixe (non recommandé)
CREATE OR REPLACE FUNCTION public.update_pass_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMIT;
*/
