-- Assistance & Suggestions : pièces jointes privées et suppression du champ page.

ALTER TABLE public.issue_reports
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.issue_reports
  ALTER COLUMN description DROP NOT NULL;

ALTER TABLE public.issue_reports
  DROP COLUMN IF EXISTS page;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'issue-reports',
  'issue-reports',
  false,
  26214400,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "issue_reports_files_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "issue_reports_files_insert_owner" ON storage.objects;
DROP POLICY IF EXISTS "issue_reports_files_delete_owner_or_admin" ON storage.objects;

CREATE POLICY "issue_reports_files_select_auth"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'issue-reports'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR (select public.is_admin())
    )
  );

CREATE POLICY "issue_reports_files_insert_owner"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'issue-reports'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "issue_reports_files_delete_owner_or_admin"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'issue-reports'
    AND (
      (storage.foldername(name))[1] = (select auth.uid())::text
      OR (select public.is_admin())
    )
  );
