-- Migration : durcissement Advisor 0029 Supabase.
--
-- Objectif : retirer les fonctions SECURITY DEFINER appelables directement par
-- authenticated dans le schema API public, sans casser les usages legitimes.
-- Rollback : recreer les policies precedentes et repasser les fonctions public
-- en SECURITY DEFINER si une regression RLS est constatee.

-- ============================================================================
-- 1. Helper RLS interne : sortie du schema public expose par PostgREST.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.get_my_cabinet_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT p.cabinet_id
  FROM public.profiles p
  WHERE p.id = auth.uid();
$function$;

COMMENT ON FUNCTION private.get_my_cabinet_id() IS
  'Retourne le cabinet_id du user courant pour les policies RLS. SECURITY DEFINER hors schema API public pour eviter la recursion profiles.';

REVOKE EXECUTE ON FUNCTION private.get_my_cabinet_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_my_cabinet_id() TO authenticated, service_role;

DROP POLICY IF EXISTS profiles_select_combined ON public.profiles;
CREATE POLICY profiles_select_combined
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR (
      (select public.is_admin())
      AND (
        cabinet_id = (select private.get_my_cabinet_id())
        OR cabinet_id IS NULL
      )
    )
  );

DROP POLICY IF EXISTS profiles_update_admin_same_cabinet ON public.profiles;
CREATE POLICY profiles_update_admin_same_cabinet
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (select public.is_admin())
    AND (
      cabinet_id = (select private.get_my_cabinet_id())
      OR cabinet_id IS NULL
    )
  )
  WITH CHECK (
    (select public.is_admin())
    AND (
      cabinet_id = (select private.get_my_cabinet_id())
      OR cabinet_id IS NULL
    )
  );

REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_id() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.get_my_cabinet_id();

-- ============================================================================
-- 2. Acces lecture cabinet/logo necessaires aux RPC SECURITY INVOKER.
-- ============================================================================

DROP POLICY IF EXISTS cabinets_select_own ON public.cabinets;
CREATE POLICY cabinets_select_own
  ON public.cabinets
  FOR SELECT
  TO authenticated
  USING (id = (select private.get_my_cabinet_id()));

DROP POLICY IF EXISTS logos_select_own_cabinet ON public.logos;
CREATE POLICY logos_select_own_cabinet
  ON public.logos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cabinets c
      WHERE c.id = (select private.get_my_cabinet_id())
        AND c.logo_id = logos.id
    )
  );

CREATE OR REPLACE FUNCTION public.get_my_cabinet_logo()
RETURNS TABLE(storage_path text, placement character varying)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT
    l.storage_path,
    c.logo_placement
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.logos l ON l.id = c.logo_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_cabinet_theme_palette()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT t.palette
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.themes t ON t.id = c.default_theme_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_logo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_cabinet_logo() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_theme_palette() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_cabinet_theme_palette() TO authenticated;

-- ============================================================================
-- 3. Maintenance PASS : callable par authenticated, mais invoker + garde admin.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_pass_history_current()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_current_year int := EXTRACT(YEAR FROM now())::int;
  v_max_year int;
  v_y int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Operation reservee aux administrateurs'
      USING ERRCODE = '42501';
  END IF;

  SELECT max(year) INTO v_max_year
  FROM public.pass_history;

  IF v_max_year IS NULL THEN
    RETURN;
  END IF;

  IF v_max_year < v_current_year THEN
    FOR v_y IN (v_max_year + 1)..v_current_year LOOP
      INSERT INTO public.pass_history (year, pass_amount)
      VALUES (v_y, NULL)
      ON CONFLICT (year) DO NOTHING;
    END LOOP;
  END IF;

  DELETE FROM public.pass_history
  WHERE year NOT IN (
    SELECT year
    FROM public.pass_history
    ORDER BY year DESC
    LIMIT 8
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.ensure_pass_history_current() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_pass_history_current() TO authenticated;

-- ============================================================================
-- 4. Fonction non utilisee cote client : reservee au service role.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.get_settings_version() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_settings_version() TO service_role;
