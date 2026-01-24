-- ============================================================================ 
-- Fix V2: Storage RLS policies for logos bucket admin uploads
-- ============================================================================

-- Activer RLS sur storage.objects si pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can INSERT logos (upload)
CREATE POLICY "Admins can insert logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' 
    AND public.is_admin()
  );

-- Policy: Admins can SELECT logos (preview)
CREATE POLICY "Admins can select logos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'logos' 
    AND public.is_admin()
  );

-- Policy: Admins can UPDATE logos (replace)
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

-- Policy: Admins can DELETE logos
CREATE POLICY "Admins can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' 
    AND public.is_admin()
  );

-- Note: Ces policies utilisent la fonction public.is_admin() créée dans create-cabinets-themes-logos.sql
-- Elles s'appliquent uniquement au bucket 'logos' et requièrent un JWT admin valide
