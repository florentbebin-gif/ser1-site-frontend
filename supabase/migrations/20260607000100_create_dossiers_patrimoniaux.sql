CREATE TABLE IF NOT EXISTS public.dossiers_patrimoniaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Dossier patrimonial',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  completion_status text NOT NULL DEFAULT 'empty' CHECK (completion_status IN ('empty', 'partial', 'complete')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dossiers_patrimoniaux_user_updated
  ON public.dossiers_patrimoniaux (user_id, updated_at DESC);

DROP TRIGGER IF EXISTS set_dossiers_patrimoniaux_updated_at ON public.dossiers_patrimoniaux;
CREATE TRIGGER set_dossiers_patrimoniaux_updated_at
  BEFORE UPDATE ON public.dossiers_patrimoniaux
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.dossiers_patrimoniaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dossiers_patrimoniaux_select_own_or_admin ON public.dossiers_patrimoniaux;
CREATE POLICY dossiers_patrimoniaux_select_own_or_admin
  ON public.dossiers_patrimoniaux
  FOR SELECT
  TO authenticated
  USING ((user_id = (select auth.uid())) OR (select public.is_admin()));

DROP POLICY IF EXISTS dossiers_patrimoniaux_insert_own_or_admin ON public.dossiers_patrimoniaux;
CREATE POLICY dossiers_patrimoniaux_insert_own_or_admin
  ON public.dossiers_patrimoniaux
  FOR INSERT
  TO authenticated
  WITH CHECK ((user_id = (select auth.uid())) OR (select public.is_admin()));

DROP POLICY IF EXISTS dossiers_patrimoniaux_update_own_or_admin ON public.dossiers_patrimoniaux;
CREATE POLICY dossiers_patrimoniaux_update_own_or_admin
  ON public.dossiers_patrimoniaux
  FOR UPDATE
  TO authenticated
  USING ((user_id = (select auth.uid())) OR (select public.is_admin()))
  WITH CHECK ((user_id = (select auth.uid())) OR (select public.is_admin()));

DROP POLICY IF EXISTS dossiers_patrimoniaux_delete_own_or_admin ON public.dossiers_patrimoniaux;
CREATE POLICY dossiers_patrimoniaux_delete_own_or_admin
  ON public.dossiers_patrimoniaux
  FOR DELETE
  TO authenticated
  USING ((user_id = (select auth.uid())) OR (select public.is_admin()));

REVOKE ALL ON TABLE public.dossiers_patrimoniaux FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dossiers_patrimoniaux TO authenticated;
GRANT ALL ON TABLE public.dossiers_patrimoniaux TO service_role;
