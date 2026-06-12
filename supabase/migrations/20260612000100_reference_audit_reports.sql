CREATE TABLE IF NOT EXISTS public.reference_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  requires_action boolean NOT NULL,
  binding_count integer NOT NULL CHECK (binding_count >= 0),
  referenced_url_count integer NOT NULL CHECK (referenced_url_count >= 0),
  stale_binding_count integer NOT NULL DEFAULT 0 CHECK (stale_binding_count >= 0),
  stale_reference_count integer NOT NULL DEFAULT 0 CHECK (stale_reference_count >= 0),
  url_failure_count integer NOT NULL DEFAULT 0 CHECK (url_failure_count >= 0),
  url_blocked_count integer NOT NULL DEFAULT 0 CHECK (url_blocked_count >= 0),
  url_inconclusive_count integer NOT NULL DEFAULT 0 CHECK (url_inconclusive_count >= 0),
  db_finding_count integer NOT NULL DEFAULT 0 CHECK (db_finding_count >= 0),
  warning_count integer NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
  error_count integer NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  report jsonb NOT NULL CHECK (jsonb_typeof(report) = 'object'),
  source text NOT NULL DEFAULT 'github_actions' CHECK (source IN ('github_actions', 'local', 'manual')),
  workflow_name text,
  github_run_id text,
  github_run_attempt text,
  commit_sha text,
  run_url text
);

CREATE INDEX IF NOT EXISTS idx_reference_audit_reports_created_at
  ON public.reference_audit_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reference_audit_reports_requires_action
  ON public.reference_audit_reports (created_at DESC)
  WHERE requires_action;

CREATE TABLE IF NOT EXISTS public.reference_audit_acknowledgements (
  report_id uuid NOT NULL REFERENCES public.reference_audit_reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reference_audit_acknowledgements_user
  ON public.reference_audit_acknowledgements (user_id, acknowledged_at DESC);

ALTER TABLE public.reference_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_audit_acknowledgements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reference_audit_reports_select_admin ON public.reference_audit_reports;
CREATE POLICY reference_audit_reports_select_admin
  ON public.reference_audit_reports
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS reference_audit_reports_insert_service_role ON public.reference_audit_reports;
CREATE POLICY reference_audit_reports_insert_service_role
  ON public.reference_audit_reports
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS reference_audit_acknowledgements_select_admin_own ON public.reference_audit_acknowledgements;
CREATE POLICY reference_audit_acknowledgements_select_admin_own
  ON public.reference_audit_acknowledgements
  FOR SELECT
  TO authenticated
  USING ((user_id = (select auth.uid())) AND (select public.is_admin()));

DROP POLICY IF EXISTS reference_audit_acknowledgements_insert_admin_own ON public.reference_audit_acknowledgements;
CREATE POLICY reference_audit_acknowledgements_insert_admin_own
  ON public.reference_audit_acknowledgements
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (select auth.uid())) AND (select public.is_admin()));

DROP POLICY IF EXISTS reference_audit_acknowledgements_update_admin_own ON public.reference_audit_acknowledgements;
CREATE POLICY reference_audit_acknowledgements_update_admin_own
  ON public.reference_audit_acknowledgements
  FOR UPDATE
  TO authenticated
  USING ((user_id = (select auth.uid())) AND (select public.is_admin()))
  WITH CHECK ((user_id = (select auth.uid())) AND (select public.is_admin()));

REVOKE ALL ON TABLE public.reference_audit_reports FROM anon;
REVOKE ALL ON TABLE public.reference_audit_acknowledgements FROM anon;
GRANT SELECT ON TABLE public.reference_audit_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.reference_audit_acknowledgements TO authenticated;
GRANT SELECT, INSERT ON TABLE public.reference_audit_reports TO service_role;
GRANT ALL ON TABLE public.reference_audit_acknowledgements TO service_role;
