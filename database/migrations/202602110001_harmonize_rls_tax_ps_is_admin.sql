-- ============================================================================
-- MIGRATION: Harmoniser RLS tax_settings + ps_settings → is_admin()
-- Date: 2026-02-11
-- Objectif: Aligner sur le même mécanisme que fiscality_settings
-- Précondition: vérifier que is_admin() fonctionne (test admin promu sur staging)
-- ============================================================================
-- ⚠️  Appliquer d'abord sur STAGING, tester un save admin promu, puis prod.
-- ============================================================================

BEGIN;

-- 1. tax_settings : remplacer policy profiles-based par is_admin()
DROP POLICY IF EXISTS "Admins can write tax_settings" ON public.tax_settings;

CREATE POLICY "Admins can write tax_settings" ON public.tax_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- La policy SELECT reste inchangée :
-- "Authenticated users can read tax_settings" → auth.role() = 'authenticated'

-- 2. ps_settings : remplacer policy profiles-based par is_admin()
DROP POLICY IF EXISTS "Admins can write ps_settings" ON public.ps_settings;

CREATE POLICY "Admins can write ps_settings" ON public.ps_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- La policy SELECT reste inchangée :
-- "Authenticated users can read ps_settings" → auth.role() = 'authenticated'

COMMIT;

-- ============================================================================
-- VÉRIFICATION POST-MIGRATION (exécuter manuellement)
-- ============================================================================
/*
-- Toutes les policies write doivent utiliser is_admin()
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('fiscality_settings', 'tax_settings', 'ps_settings')
ORDER BY tablename, policyname;

-- Aucune policy ne doit référencer profiles.role
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text ILIKE '%profiles%' OR with_check::text ILIKE '%profiles%');

-- Test fonctionnel : en tant qu'admin promu (app_metadata.role='admin') :
-- SELECT data FROM tax_settings WHERE id=1;     -- doit réussir
-- UPDATE tax_settings SET data=data WHERE id=1;  -- doit réussir
-- En tant que user normal :
-- UPDATE tax_settings SET data=data WHERE id=1;  -- doit échouer (0 rows)
*/
