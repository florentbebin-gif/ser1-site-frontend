-- Migration : persistance Supabase de la Base CG retraite et des documents CG.

CREATE TABLE IF NOT EXISTS public.base_cg_retraite_overrides (
  contract_id   text PRIMARY KEY,
  contract_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_deleted    boolean NOT NULL DEFAULT false,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.base_cg_retraite_documents (
  id            text PRIMARY KEY,
  contract_id   text NOT NULL,
  label         text NOT NULL,
  document_type text NOT NULL,
  status        text NOT NULL DEFAULT 'uploaded',
  source_url    text NULL,
  version_label text NULL,
  storage_path  text NULL,
  file_name     text NULL,
  mime          text NULL,
  bytes         bigint NULL,
  uploaded_at   timestamptz NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT base_cg_retraite_documents_type_chk
    CHECK (document_type IN ('conditions_generales', 'notice_information', 'avenant', 'autre')),
  CONSTRAINT base_cg_retraite_documents_status_chk
    CHECK (status IN ('missing', 'linked', 'uploaded')),
  CONSTRAINT base_cg_retraite_documents_source_chk
    CHECK (
      status = 'missing'
      OR source_url IS NOT NULL
      OR storage_path IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_base_cg_retraite_documents_contract
  ON public.base_cg_retraite_documents (contract_id);

CREATE OR REPLACE FUNCTION public.set_updated_at_base_cg_retraite()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_base_cg_retraite_overrides_updated_at
  ON public.base_cg_retraite_overrides;
CREATE TRIGGER trg_base_cg_retraite_overrides_updated_at
  BEFORE UPDATE ON public.base_cg_retraite_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_base_cg_retraite();

DROP TRIGGER IF EXISTS trg_base_cg_retraite_documents_updated_at
  ON public.base_cg_retraite_documents;
CREATE TRIGGER trg_base_cg_retraite_documents_updated_at
  BEFORE UPDATE ON public.base_cg_retraite_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_base_cg_retraite();

ALTER TABLE public.base_cg_retraite_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_cg_retraite_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "base_cg_retraite_overrides_select_auth" ON public.base_cg_retraite_overrides;
DROP POLICY IF EXISTS "base_cg_retraite_overrides_insert_admin" ON public.base_cg_retraite_overrides;
DROP POLICY IF EXISTS "base_cg_retraite_overrides_update_admin" ON public.base_cg_retraite_overrides;
DROP POLICY IF EXISTS "base_cg_retraite_overrides_delete_admin" ON public.base_cg_retraite_overrides;

CREATE POLICY "base_cg_retraite_overrides_select_auth"
  ON public.base_cg_retraite_overrides
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "base_cg_retraite_overrides_insert_admin"
  ON public.base_cg_retraite_overrides
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "base_cg_retraite_overrides_update_admin"
  ON public.base_cg_retraite_overrides
  FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "base_cg_retraite_overrides_delete_admin"
  ON public.base_cg_retraite_overrides
  FOR DELETE TO authenticated
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "base_cg_retraite_documents_select_auth" ON public.base_cg_retraite_documents;
DROP POLICY IF EXISTS "base_cg_retraite_documents_insert_admin" ON public.base_cg_retraite_documents;
DROP POLICY IF EXISTS "base_cg_retraite_documents_update_admin" ON public.base_cg_retraite_documents;
DROP POLICY IF EXISTS "base_cg_retraite_documents_delete_admin" ON public.base_cg_retraite_documents;

CREATE POLICY "base_cg_retraite_documents_select_auth"
  ON public.base_cg_retraite_documents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "base_cg_retraite_documents_insert_admin"
  ON public.base_cg_retraite_documents
  FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "base_cg_retraite_documents_update_admin"
  ON public.base_cg_retraite_documents
  FOR UPDATE TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

CREATE POLICY "base_cg_retraite_documents_delete_admin"
  ON public.base_cg_retraite_documents
  FOR DELETE TO authenticated
  USING ((select public.is_admin()));

GRANT SELECT ON public.base_cg_retraite_overrides TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.base_cg_retraite_overrides TO authenticated;
GRANT SELECT ON public.base_cg_retraite_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.base_cg_retraite_documents TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'base-cg-retraite-cg',
  'base-cg-retraite-cg',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DROP POLICY IF EXISTS "base_cg_retraite_cg_select_auth" ON storage.objects;
DROP POLICY IF EXISTS "base_cg_retraite_cg_insert_admin" ON storage.objects;
DROP POLICY IF EXISTS "base_cg_retraite_cg_update_admin" ON storage.objects;
DROP POLICY IF EXISTS "base_cg_retraite_cg_delete_admin" ON storage.objects;

CREATE POLICY "base_cg_retraite_cg_select_auth"
  ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'base-cg-retraite-cg');

CREATE POLICY "base_cg_retraite_cg_insert_admin"
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'base-cg-retraite-cg'
    AND (select public.is_admin())
  );

CREATE POLICY "base_cg_retraite_cg_update_admin"
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'base-cg-retraite-cg'
    AND (select public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'base-cg-retraite-cg'
    AND (select public.is_admin())
  );

CREATE POLICY "base_cg_retraite_cg_delete_admin"
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'base-cg-retraite-cg'
    AND (select public.is_admin())
  );

INSERT INTO public.base_cg_retraite_documents (
  id,
  contract_id,
  label,
  document_type,
  status,
  version_label,
  storage_path,
  file_name,
  mime,
  bytes,
  uploaded_at
)
VALUES (
  'swisslife-per-individuel-13124-09-2019',
  'swisslife-perin-swisslife-per-individuel-24',
  'Notice SwissLife PER Individuel',
  'notice_information',
  'uploaded',
  '13124 – 09.2019',
  'swisslife/swisslife-per-individuel/13124-09-2019.pdf',
  '13124-09-2019.pdf',
  'application/pdf',
  462558,
  now()
)
ON CONFLICT (id) DO UPDATE SET
  contract_id = excluded.contract_id,
  label = excluded.label,
  document_type = excluded.document_type,
  status = excluded.status,
  version_label = excluded.version_label,
  storage_path = excluded.storage_path,
  file_name = excluded.file_name,
  mime = excluded.mime,
  bytes = excluded.bytes,
  uploaded_at = coalesce(public.base_cg_retraite_documents.uploaded_at, excluded.uploaded_at);
