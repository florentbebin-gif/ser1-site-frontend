-- ============================================================================
-- MIGRATION: Security RLS - No user_metadata
-- Date: 2026-01-31
-- Objectif: Corriger ERROR "rls_references_user_metadata" et WARN "function_search_path_mutable"
-- ============================================================================

BEGIN;

-- 1. Vérifier/Activer RLS sur les tables concernées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='fiscality_settings' AND c.relrowsecurity=true
  ) THEN
    ALTER TABLE public.fiscality_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname='public' AND c.relname='issue_reports' AND c.relrowsecurity=true
  ) THEN
    ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Durcir public.is_admin() (NULL-safe + search_path fixé)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(
    (COALESCE(current_setting('request.jwt.claims', true), '{}'))::jsonb
      -> 'app_metadata' ->> 'role',
    'user'
  ) = 'admin';
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3. Fix search_path sur les fonctions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 4. DROP toutes policies user_metadata sur fiscality_settings
DROP POLICY IF EXISTS "Admins can write fiscality_settings" ON public.fiscality_settings;
DROP POLICY IF EXISTS "fiscality_settings_write_admin" ON public.fiscality_settings;

-- 5. CREATE policy fiscality_settings sur public.is_admin() (source de vérité unique)
CREATE POLICY "Admins can write fiscality_settings" ON public.fiscality_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. DROP policies user_metadata sur issue_reports
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can manage all issue_reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can manage all issue reports" ON public.issue_reports;

-- 7. CREATE policy issue_reports sur public.is_admin() (source de vérité unique)
CREATE POLICY "Admins can manage all issue_reports" ON public.issue_reports
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION (à exécuter manuellement)
-- ============================================================================
/*
-- Vérifier RLS activé
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
JOIN pg_namespace n ON n.oid = pg_class.relnamespace
WHERE n.nspname='public' AND relname IN ('fiscality_settings','issue_reports');

-- Vérifier search_path fixé
SELECT 
  p.proname,
  p.proconfig @> ARRAY['search_path=pg_catalog, public'] as has_fixed_search_path
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'set_updated_at', 'update_updated_at_column');

-- Vérifier 0 policy avec user_metadata
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual::text ILIKE '%user_metadata%' THEN 'USING uses user_metadata'
    WHEN with_check::text ILIKE '%user_metadata%' THEN 'WITH CHECK uses user_metadata'
    ELSE 'OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text ILIKE '%user_metadata%' OR with_check::text ILIKE '%user_metadata%');
*/
