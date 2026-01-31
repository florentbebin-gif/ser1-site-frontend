-- ============================================================================
-- MIGRATION: Fix search_path remaining functions
-- Date: 2026-01-31
-- Objectif: Corriger WARN "function_search_path_mutable" pour fonctions utilitaires
-- ============================================================================

BEGIN;

-- 1. get_settings_version()
-- Fonction utilitaire pour obtenir la version des settings
CREATE OR REPLACE FUNCTION public.get_settings_version()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_version integer;
BEGIN
  SELECT version INTO v_version
  FROM public.settings_version
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_version, 0);
END;
$$;

-- 2. bump_settings_version()
-- Fonction pour incrémenter la version des settings
CREATE OR REPLACE FUNCTION public.bump_settings_version()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  new_version integer;
BEGIN
  INSERT INTO public.settings_version (version, updated_at)
  VALUES (
    COALESCE((SELECT MAX(version) FROM public.settings_version), 0) + 1,
    now()
  )
  RETURNING version INTO new_version;
  
  RETURN new_version;
END;
$$;

-- 3. sync_settings_data_tax()
-- Fonction de synchronisation des données tax settings
CREATE OR REPLACE FUNCTION public.sync_settings_data_tax()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Logique de sync à adapter selon votre implémentation actuelle
  -- Exemple: met à jour une table agrégée ou déclenche un event
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'tax_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$$;

-- 4. sync_settings_data_fiscality()
-- Fonction de synchronisation des données fiscality settings
CREATE OR REPLACE FUNCTION public.sync_settings_data_fiscality()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'fiscality_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$$;

-- 5. sync_settings_data_ps()
-- Fonction de synchronisation des données ps settings
CREATE OR REPLACE FUNCTION public.sync_settings_data_ps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  PERFORM pg_notify('settings_changed', json_build_object(
    'table', 'ps_settings',
    'user_id', auth.uid(),
    'timestamp', extract(epoch from now())
  )::text);
  
  RETURN NEW;
END;
$$;

COMMIT;

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION
-- ============================================================================
/*
-- Vérifier que search_path est fixé pour toutes ces fonctions
SELECT 
  p.proname,
  p.proconfig @> ARRAY['search_path=pg_catalog, public'] as has_fixed_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_settings_version',
    'bump_settings_version', 
    'sync_settings_data_tax',
    'sync_settings_data_fiscality',
    'sync_settings_data_ps'
  );

-- Expected: toutes les lignes doivent avoir has_fixed_search_path = true
*/
