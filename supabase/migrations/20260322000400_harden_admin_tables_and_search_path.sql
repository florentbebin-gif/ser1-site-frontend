-- Post-V3 hardening
-- 1. Fix mutable search_path on trigger functions flagged by Supabase Advisor
-- 2. Add explicit service_role-only policies on admin tables so Advisor no longer reports
--    "RLS enabled, no policy" for intentional service_role-only tables

CREATE OR REPLACE FUNCTION public.set_updated_at_base_contrat_overrides()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

REVOKE ALL ON TABLE public.admin_accounts FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_accounts TO service_role;

DROP POLICY IF EXISTS admin_accounts_service_role_only ON public.admin_accounts;
CREATE POLICY admin_accounts_service_role_only
  ON public.admin_accounts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.admin_action_audit FROM anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.admin_action_audit TO service_role;

DROP POLICY IF EXISTS admin_action_audit_service_role_select ON public.admin_action_audit;
CREATE POLICY admin_action_audit_service_role_select
  ON public.admin_action_audit
  FOR SELECT
  TO service_role
  USING (true);

DROP POLICY IF EXISTS admin_action_audit_service_role_insert ON public.admin_action_audit;
CREATE POLICY admin_action_audit_service_role_insert
  ON public.admin_action_audit
  FOR INSERT
  TO service_role
  WITH CHECK (true);
