-- Migration: Bloc 2 - Optimisations RLS (Multiple Permissive Policies & InitPlan)
-- Droits: Séparation stricte par action (INSERT/UPDATE/DELETE), retrait des FOR ALL
--         et mise en cache des fonctions (select auth.uid()) / (select public.is_admin()).

-- ==============================================================================
-- 1. issue_reports
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can manage all issue_reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can read their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can insert issue reports" ON public.issue_reports;

CREATE POLICY "issue_reports_select_auth" ON public.issue_reports FOR SELECT TO authenticated
USING ( (user_id = (select auth.uid())) OR (select public.is_admin()) );

CREATE POLICY "Users can insert issue reports" ON public.issue_reports FOR INSERT TO authenticated
WITH CHECK ( user_id = (select auth.uid()) );

CREATE POLICY "issue_reports_update_admin" ON public.issue_reports FOR UPDATE TO authenticated
USING ( (select public.is_admin()) ) WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "issue_reports_delete_admin" ON public.issue_reports FOR DELETE TO authenticated
USING ( (select public.is_admin()) );


-- ==============================================================================
-- 2. themes
-- ==============================================================================
-- Note: "Anyone can read themes" (SELECT TO PUBLIC) est conservée.
DROP POLICY IF EXISTS "Admins can manage themes" ON public.themes;

CREATE POLICY "themes_insert_admin" ON public.themes FOR INSERT TO authenticated
WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "themes_update_admin" ON public.themes FOR UPDATE TO authenticated
USING ( (select public.is_admin()) ) WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "themes_delete_admin" ON public.themes FOR DELETE TO authenticated
USING ( (select public.is_admin()) );


-- ==============================================================================
-- 3. ui_settings
-- ==============================================================================
DROP POLICY IF EXISTS "Everyone can read default themes" ON public.ui_settings;
DROP POLICY IF EXISTS "Users can manage their own UI settings" ON public.ui_settings;

CREATE POLICY "ui_settings_select_all" ON public.ui_settings FOR SELECT TO PUBLIC
USING ( (theme_name = 'default') OR (user_id = (select auth.uid())) );

CREATE POLICY "ui_settings_insert_own" ON public.ui_settings FOR INSERT TO authenticated
WITH CHECK ( user_id = (select auth.uid()) );

CREATE POLICY "ui_settings_update_own" ON public.ui_settings FOR UPDATE TO authenticated
USING ( user_id = (select auth.uid()) ) WITH CHECK ( user_id = (select auth.uid()) );

CREATE POLICY "ui_settings_delete_own" ON public.ui_settings FOR DELETE TO authenticated
USING ( user_id = (select auth.uid()) );


-- ==============================================================================
-- 4. profiles
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin_same_cabinet" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_same_cabinet" ON public.profiles;

CREATE POLICY "profiles_select_combined" ON public.profiles FOR SELECT TO authenticated
USING ( (id = (select auth.uid())) OR ((select public.is_admin()) AND ((cabinet_id = (select public.get_my_cabinet_id())) OR (cabinet_id IS NULL))) );

-- L'UPDATE est restreint à l'admin du cabinet.
-- Aucune policy "profiles_update_own" n'est recréée : la modification directe par l'utilisateur de son propre profil (qui inclut role et cabinet_id) n'est pas supportée pour des raisons de sécurité. Ces modifications sensibles doivent passer par des Edge Functions ou le dashboard Admin.
CREATE POLICY "profiles_update_admin_same_cabinet" ON public.profiles FOR UPDATE TO authenticated
USING ( ((select public.is_admin()) AND ((cabinet_id = (select public.get_my_cabinet_id())) OR (cabinet_id IS NULL))) )
WITH CHECK ( ((select public.is_admin()) AND ((cabinet_id = (select public.get_my_cabinet_id())) OR (cabinet_id IS NULL))) );


-- ==============================================================================
-- 5. Paramétrages globaux (fiscality, tax, ps, base_contrat)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can write fiscality_settings" ON public.fiscality_settings;
DROP POLICY IF EXISTS "fiscality_settings_select_authenticated" ON public.fiscality_settings;
DROP POLICY IF EXISTS "Authenticated users can read fiscality_settings" ON public.fiscality_settings;

DROP POLICY IF EXISTS "Admins can write tax_settings" ON public.tax_settings;
DROP POLICY IF EXISTS "Authenticated users can read tax_settings" ON public.tax_settings;

DROP POLICY IF EXISTS "Admins can write ps_settings" ON public.ps_settings;
DROP POLICY IF EXISTS "Authenticated users can read ps_settings" ON public.ps_settings;

DROP POLICY IF EXISTS "Admins can write base_contrat_settings" ON public.base_contrat_settings;
DROP POLICY IF EXISTS "Authenticated can read base_contrat_settings" ON public.base_contrat_settings;

-- SELECT
CREATE POLICY "fiscality_settings_select_auth" ON public.fiscality_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "tax_settings_select_auth" ON public.tax_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "ps_settings_select_auth" ON public.ps_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "base_contrat_settings_select_auth" ON public.base_contrat_settings FOR SELECT TO authenticated USING (true);

-- INSERT
CREATE POLICY "fiscality_settings_insert_admin" ON public.fiscality_settings FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "tax_settings_insert_admin" ON public.tax_settings FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "ps_settings_insert_admin" ON public.ps_settings FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));
CREATE POLICY "base_contrat_settings_insert_admin" ON public.base_contrat_settings FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()));

-- UPDATE
CREATE POLICY "fiscality_settings_update_admin" ON public.fiscality_settings FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "tax_settings_update_admin" ON public.tax_settings FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "ps_settings_update_admin" ON public.ps_settings FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY "base_contrat_settings_update_admin" ON public.base_contrat_settings FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- DELETE
CREATE POLICY "fiscality_settings_delete_admin" ON public.fiscality_settings FOR DELETE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "tax_settings_delete_admin" ON public.tax_settings FOR DELETE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "ps_settings_delete_admin" ON public.ps_settings FOR DELETE TO authenticated USING ((select public.is_admin()));
CREATE POLICY "base_contrat_settings_delete_admin" ON public.base_contrat_settings FOR DELETE TO authenticated USING ((select public.is_admin()));


-- ==============================================================================
-- 6. app_settings_meta
-- ==============================================================================
-- Note: "app_settings_meta_read_auth" (SELECT TO authenticated USING true) est conservée.
DROP POLICY IF EXISTS "app_settings_meta_write_admin" ON public.app_settings_meta;

CREATE POLICY "app_settings_meta_insert_admin" ON public.app_settings_meta FOR INSERT TO authenticated
WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "app_settings_meta_update_admin" ON public.app_settings_meta FOR UPDATE TO authenticated
USING ( (select public.is_admin()) ) WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "app_settings_meta_delete_admin" ON public.app_settings_meta FOR DELETE TO authenticated
USING ( (select public.is_admin()) );


-- ==============================================================================
-- 7. base_contrat_overrides
-- ==============================================================================
DROP POLICY IF EXISTS "overrides_write_admin" ON public.base_contrat_overrides;
DROP POLICY IF EXISTS "overrides_select_admin" ON public.base_contrat_overrides;

CREATE POLICY "overrides_select_admin" ON public.base_contrat_overrides FOR SELECT TO authenticated
USING ( (select public.is_admin()) );

CREATE POLICY "overrides_insert_admin" ON public.base_contrat_overrides FOR INSERT TO authenticated
WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "overrides_update_admin" ON public.base_contrat_overrides FOR UPDATE TO authenticated
USING ( (select public.is_admin()) ) WITH CHECK ( (select public.is_admin()) );

CREATE POLICY "overrides_delete_admin" ON public.base_contrat_overrides FOR DELETE TO authenticated
USING ( (select public.is_admin()) );

-- ==============================================================================
-- NOTES DE ROLLBACK
-- ==============================================================================
-- Le rollback de cette migration nécessiterait la restauration des policies FOR ALL
-- et des policies dupliquées (multiple_permissive_policies).
--
-- Attention majeure : NE JAMAIS restaurer "Admins can update any profile" (faille inter-cabinet)
-- ni "profiles_update_own" sans un contrôle strict des colonnes (role, cabinet_id).
--
-- Pour restaurer l'état précédent d'une table, recréez la policy FOR ALL. Exemple pour tax_settings :
-- CREATE POLICY "Admins can write tax_settings" ON public.tax_settings FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
-- CREATE POLICY "Authenticated users can read tax_settings" ON public.tax_settings FOR SELECT TO public USING (auth.role() = 'authenticated');
--
-- Pour les policies utilisant auth_rls_initplan (ex: issue_reports_select_auth),
-- le rollback consisterait à retirer les wrappers `(select ...)` autour de auth.uid() et public.is_admin().
-- ==============================================================================
