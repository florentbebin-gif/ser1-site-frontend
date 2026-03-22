-- Patch V3 : ajouter SET search_path à admin_accounts_set_updated_at()
-- Résout le warning Supabase function_search_path_mutable.

CREATE OR REPLACE FUNCTION public.admin_accounts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
