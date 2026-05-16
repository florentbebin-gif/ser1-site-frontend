-- Sécurise la fonction trigger Base CG retraite pour éviter un search_path mutable.

CREATE OR REPLACE FUNCTION public.set_updated_at_base_cg_retraite()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
