-- ============================================================================
-- MIGRATION: Harmoniser RLS tax_settings + ps_settings → is_admin()
-- Date: 2026-02-11
-- Objectif: Aligner sur le même mécanisme que fiscality_settings
-- ============================================================================

-- 1. tax_settings : remplacer policy profiles-based par is_admin()
DROP POLICY IF EXISTS "Admins can write tax_settings" ON public.tax_settings;

CREATE POLICY "Admins can write tax_settings" ON public.tax_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. ps_settings : remplacer policy profiles-based par is_admin()
DROP POLICY IF EXISTS "Admins can write ps_settings" ON public.ps_settings;

CREATE POLICY "Admins can write ps_settings" ON public.ps_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
