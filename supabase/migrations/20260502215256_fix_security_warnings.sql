-- Migration : correction des 21 warnings de sécurité Supabase
-- Catégories : anon_security_definer_function_executable,
--              authenticated_security_definer_function_executable,
--              public_bucket_allows_listing

-- ===========================================================================
-- 1. Fonctions appelables uniquement par authenticated (pas par anon)
--    → REVOKE de PUBLIC + anon, puis GRANT ciblé à authenticated
-- ===========================================================================

-- get_my_cabinet_id — helper RLS (SECURITY DEFINER anti-récursion, non-callable par anon)
REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_id()        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_cabinet_id()        TO authenticated;

-- get_my_cabinet_logo — appelée via .rpc() côté client, uniquement en session
REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_logo()      FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_cabinet_logo()      TO authenticated;

-- get_my_cabinet_theme_palette — idem
REVOKE EXECUTE ON FUNCTION public.get_my_cabinet_theme_palette() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_my_cabinet_theme_palette() TO authenticated;

-- ensure_pass_history_current — appelée via .rpc() dans usePassHistory.ts (admin uniquement)
REVOKE EXECUTE ON FUNCTION public.ensure_pass_history_current() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.ensure_pass_history_current() TO authenticated;

-- get_settings_version — pas de .rpc() client trouvé, réservée aux admins
REVOKE EXECUTE ON FUNCTION public.get_settings_version()     FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_settings_version()     TO authenticated;

-- ===========================================================================
-- 2. Fonctions internes (triggers ou serveur) — REVOKE total de PUBLIC
--    Pas de GRANT : appelées uniquement par trigger ou service_role
-- ===========================================================================

-- handle_new_auth_user — trigger sur auth.users, jamais via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user()     FROM PUBLIC, anon, authenticated;

-- bump_settings_version — aucun appel .rpc() trouvé dans src/
REVOKE EXECUTE ON FUNCTION public.bump_settings_version()    FROM PUBLIC, anon, authenticated;

-- ===========================================================================
-- 3. Fonctions is_admin — passage en SECURITY INVOKER
--    Ces fonctions lisent le JWT (is_admin()) ou la table profiles (is_admin(uid)).
--    SECURITY DEFINER n'est pas nécessaire ici ; SECURITY INVOKER est plus sûr.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT COALESCE(
    (COALESCE(current_setting('request.jwt.claims', true), '{}'))::jsonb
      -> 'app_metadata' ->> 'role',
    'user'
  ) = 'admin';
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND lower(COALESCE(p.role,'')) = 'admin'
  );
$function$;

-- ===========================================================================
-- 4. Buckets publics — suppression des policies SELECT trop larges
--    getPublicUrl() fonctionne sans policy SELECT sur storage.objects.
--    Le listage complet du bucket n'est jamais utilisé par le frontend.
-- ===========================================================================

DROP POLICY IF EXISTS "Public read logos"    ON storage.objects;
DROP POLICY IF EXISTS "Public read on COVERS" ON storage.objects;
