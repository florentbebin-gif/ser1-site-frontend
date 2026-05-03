-- Migration: Bloc 1 - Sécurité RLS et Duplications
-- Droits: Sécurité critique sur profiles, redondances exactes de policies et index.

-- ==============================================================================
-- 1. Faille Sécurité RLS sur profiles
-- L'ancienne policy "Admins can update any profile" permettait un bypass inter-cabinet.
-- Elle est remplacée (historiquement) par profiles_update_admin_same_cabinet.
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- ==============================================================================
-- 2. Redondance exacte de lecture sur issue_reports
-- "Users can view own issue reports" a exactement le même USING que 
-- "Users can read their own issue reports".
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own issue reports" ON public.issue_reports;

-- ==============================================================================
-- 3. Redondance de scope sur fiscality_settings
-- Si fiscality_settings_select_authenticated (TO authenticated) existe, on peut dropper
-- la policy TO public "Authenticated users can read fiscality_settings" 
-- qui fait la même chose (en plus lourd) via auth.role()
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM pg_policy 
      WHERE polrelid = 'public.fiscality_settings'::regclass 
      AND polname = 'fiscality_settings_select_authenticated'
  ) THEN
      DROP POLICY IF EXISTS "Authenticated users can read fiscality_settings" ON public.fiscality_settings;
  END IF;
END $$;

-- ==============================================================================
-- 4. Index dupliqué
-- idx_issue_reports_unread est strictement identique à idx_issue_reports_admin_unread
-- ==============================================================================
DROP INDEX IF EXISTS public.idx_issue_reports_unread;

-- ==============================================================================
-- NOTES DE ROLLBACK
-- ==============================================================================
-- 1. profiles : Attention ! Ne recréez JAMAIS "Admins can update any profile" sauf en 
--    cas de rollback historique d'urgence absolue, cela restaurerait la faille de 
--    sécurité inter-cabinet. 
--    Le rollback de sécurité normal (scopé au cabinet) si la policy a été altérée est :
--    CREATE POLICY "profiles_update_admin_same_cabinet" ON public.profiles FOR UPDATE TO authenticated 
--      USING ((select public.is_admin()) AND ((cabinet_id = (select public.get_my_cabinet_id())) OR (cabinet_id IS NULL))) 
--      WITH CHECK ((select public.is_admin()) AND ((cabinet_id = (select public.get_my_cabinet_id())) OR (cabinet_id IS NULL)));
--
-- 2. issue_reports policy :
--    CREATE POLICY "Users can view own issue reports" ON public.issue_reports FOR SELECT USING (user_id = auth.uid());
--
-- 3. fiscality_settings policy :
--    CREATE POLICY "Authenticated users can read fiscality_settings" ON public.fiscality_settings FOR SELECT USING (auth.role() = 'authenticated');
--
-- 4. issue_reports index :
--    CREATE INDEX idx_issue_reports_unread ON public.issue_reports USING btree (created_at DESC) WHERE (admin_read_at IS NULL);
-- ==============================================================================
