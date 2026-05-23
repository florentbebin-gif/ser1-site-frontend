-- Migration : référentiel Prévoyance RO et maintien employeur.

CREATE TABLE IF NOT EXISTS public.prevoyance_regime_settings (
  code                  text PRIMARY KEY,
  label                 text NOT NULL,
  caisse                text NOT NULL,
  population            text NOT NULL,
  default_contract_kind text NOT NULL,
  year                  integer NOT NULL,
  data                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources               jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prevoyance_regime_population_chk
    CHECK (population IN ('salarie', 'tns', 'liberal', 'exploitant_agricole', 'avocat')),
  CONSTRAINT prevoyance_regime_kind_chk
    CHECK (default_contract_kind IN ('individuel', 'collectif'))
);

CREATE TABLE IF NOT EXISTS public.prevoyance_maintien_employeur_settings (
  code       text PRIMARY KEY,
  label      text NOT NULL,
  year       integer NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  sources    jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at_prevoyance_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevoyance_regime_settings_updated_at
  ON public.prevoyance_regime_settings;
CREATE TRIGGER trg_prevoyance_regime_settings_updated_at
  BEFORE UPDATE ON public.prevoyance_regime_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_prevoyance_settings();

DROP TRIGGER IF EXISTS trg_prevoyance_maintien_employeur_settings_updated_at
  ON public.prevoyance_maintien_employeur_settings;
CREATE TRIGGER trg_prevoyance_maintien_employeur_settings_updated_at
  BEFORE UPDATE ON public.prevoyance_maintien_employeur_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_prevoyance_settings();

ALTER TABLE public.prevoyance_regime_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prevoyance_maintien_employeur_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prevoyance_regime_settings_select_auth" ON public.prevoyance_regime_settings;
DROP POLICY IF EXISTS "prevoyance_regime_settings_insert_admin" ON public.prevoyance_regime_settings;
DROP POLICY IF EXISTS "prevoyance_regime_settings_update_admin" ON public.prevoyance_regime_settings;
DROP POLICY IF EXISTS "prevoyance_regime_settings_delete_admin" ON public.prevoyance_regime_settings;

CREATE POLICY "prevoyance_regime_settings_select_auth"
  ON public.prevoyance_regime_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "prevoyance_regime_settings_insert_admin"
  ON public.prevoyance_regime_settings
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "prevoyance_regime_settings_update_admin"
  ON public.prevoyance_regime_settings
  FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "prevoyance_regime_settings_delete_admin"
  ON public.prevoyance_regime_settings
  FOR DELETE TO authenticated
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "prevoyance_maintien_employeur_settings_select_auth"
  ON public.prevoyance_maintien_employeur_settings;
DROP POLICY IF EXISTS "prevoyance_maintien_employeur_settings_insert_admin"
  ON public.prevoyance_maintien_employeur_settings;
DROP POLICY IF EXISTS "prevoyance_maintien_employeur_settings_update_admin"
  ON public.prevoyance_maintien_employeur_settings;
DROP POLICY IF EXISTS "prevoyance_maintien_employeur_settings_delete_admin"
  ON public.prevoyance_maintien_employeur_settings;

CREATE POLICY "prevoyance_maintien_employeur_settings_select_auth"
  ON public.prevoyance_maintien_employeur_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "prevoyance_maintien_employeur_settings_insert_admin"
  ON public.prevoyance_maintien_employeur_settings
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "prevoyance_maintien_employeur_settings_update_admin"
  ON public.prevoyance_maintien_employeur_settings
  FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "prevoyance_maintien_employeur_settings_delete_admin"
  ON public.prevoyance_maintien_employeur_settings
  FOR DELETE TO authenticated
  USING ((select public.is_admin()));

REVOKE ALL ON public.prevoyance_regime_settings FROM anon;
REVOKE ALL ON public.prevoyance_maintien_employeur_settings FROM anon;

GRANT SELECT ON public.prevoyance_regime_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prevoyance_regime_settings TO authenticated;
GRANT ALL ON public.prevoyance_regime_settings TO service_role;

GRANT SELECT ON public.prevoyance_maintien_employeur_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prevoyance_maintien_employeur_settings TO authenticated;
GRANT ALL ON public.prevoyance_maintien_employeur_settings TO service_role;
