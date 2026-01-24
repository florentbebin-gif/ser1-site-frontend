-- ============================================================================
-- RPC SECURITY DEFINER: get_my_cabinet_theme_palette()
-- Permet aux users authentifiés de récupérer la palette de leur cabinet
-- sans ouvrir une policy SELECT large sur cabinets
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_cabinet_theme_palette()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.palette
  FROM public.profiles p
  JOIN public.cabinets c ON c.id = p.cabinet_id
  JOIN public.themes t ON t.id = c.default_theme_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

-- Grant EXECUTE à tous les users authentifiés
GRANT EXECUTE ON FUNCTION public.get_my_cabinet_theme_palette() TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Test: SELECT public.get_my_cabinet_theme_palette();
-- Devrait retourner la palette JSON du cabinet du user connecté

-- ============================================================================
-- ROLLBACK (si nécessaire)
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.get_my_cabinet_theme_palette();
