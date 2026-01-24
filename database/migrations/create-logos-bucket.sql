-- ============================================================================
-- Migration: Create 'logos' bucket in Supabase Storage
-- ============================================================================
-- This bucket stores cabinet logos uploaded by admins.
-- The bucket is PUBLIC to allow getPublicUrl() to work for PPTX exports.
-- ============================================================================

-- Create the bucket if it doesn't exist (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,  -- PUBLIC bucket (logos are not sensitive)
  5242880,  -- 5MB max file size
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage RLS Policies for 'logos' bucket
-- ============================================================================
-- Note: These may already exist from fix-storage-rls-policies.sql
-- Using IF NOT EXISTS pattern via DO block

DO $$
BEGIN
  -- Policy: Admins can INSERT logos (upload)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can insert logos'
  ) THEN
    CREATE POLICY "Admins can insert logos" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'logos' 
        AND public.is_admin()
      );
  END IF;

  -- Policy: Admins can SELECT logos (preview in settings)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can select logos'
  ) THEN
    CREATE POLICY "Admins can select logos" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'logos' 
        AND public.is_admin()
      );
  END IF;

  -- Policy: Admins can UPDATE logos (replace)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can update logos'
  ) THEN
    CREATE POLICY "Admins can update logos" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'logos' 
        AND public.is_admin()
      )
      WITH CHECK (
        bucket_id = 'logos' 
        AND public.is_admin()
      );
  END IF;

  -- Policy: Admins can DELETE logos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can delete logos'
  ) THEN
    CREATE POLICY "Admins can delete logos" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'logos' 
        AND public.is_admin()
      );
  END IF;

  -- Policy: Public read access for logos (for PPTX export via getPublicUrl)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Public read logos'
  ) THEN
    CREATE POLICY "Public read logos" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'logos');
  END IF;
END $$;

-- ============================================================================
-- Verification
-- ============================================================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'logos';

-- ============================================================================
-- Rollback (if needed):
-- DELETE FROM storage.buckets WHERE id = 'logos';
-- DROP POLICY IF EXISTS "Admins can insert logos" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can select logos" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can update logos" ON storage.objects;
-- DROP POLICY IF EXISTS "Admins can delete logos" ON storage.objects;
-- DROP POLICY IF EXISTS "Public read logos" ON storage.objects;
-- ============================================================================
