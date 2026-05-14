-- Migration : correction Advisor 0006 Supabase.
--
-- Objectif : eviter les policies permissives multiples pour authenticated/SELECT
-- sur cabinets et logos. Les anciennes policies admin FOR ALL sont scindees
-- en INSERT/UPDATE/DELETE, et le SELECT est fusionne en une policy unique.
--
-- Rollback : supprimer les policies *_select_auth et *_admin, puis recreer les
-- policies historiques "Admins can manage cabinets/logos" FOR ALL si besoin.

-- ============================================================================
-- cabinets
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage cabinets" ON public.cabinets;
DROP POLICY IF EXISTS cabinets_select_own ON public.cabinets;
DROP POLICY IF EXISTS cabinets_select_auth ON public.cabinets;
DROP POLICY IF EXISTS cabinets_insert_admin ON public.cabinets;
DROP POLICY IF EXISTS cabinets_update_admin ON public.cabinets;
DROP POLICY IF EXISTS cabinets_delete_admin ON public.cabinets;

CREATE POLICY cabinets_select_auth
  ON public.cabinets
  FOR SELECT
  TO authenticated
  USING (
    (select public.is_admin())
    OR id = (select private.get_my_cabinet_id())
  );

CREATE POLICY cabinets_insert_admin
  ON public.cabinets
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY cabinets_update_admin
  ON public.cabinets
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY cabinets_delete_admin
  ON public.cabinets
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- ============================================================================
-- logos
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage logos" ON public.logos;
DROP POLICY IF EXISTS logos_select_own_cabinet ON public.logos;
DROP POLICY IF EXISTS logos_select_auth ON public.logos;
DROP POLICY IF EXISTS logos_insert_admin ON public.logos;
DROP POLICY IF EXISTS logos_update_admin ON public.logos;
DROP POLICY IF EXISTS logos_delete_admin ON public.logos;

CREATE POLICY logos_select_auth
  ON public.logos
  FOR SELECT
  TO authenticated
  USING (
    (select public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.cabinets c
      WHERE c.id = (select private.get_my_cabinet_id())
        AND c.logo_id = logos.id
    )
  );

CREATE POLICY logos_insert_admin
  ON public.logos
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY logos_update_admin
  ON public.logos
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY logos_delete_admin
  ON public.logos
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));
