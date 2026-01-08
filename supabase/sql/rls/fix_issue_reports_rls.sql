-- Migration RLS issue_reports - unifier les policies admin (app_metadata.role uniquement)
-- Exécuter dans Supabase SQL Dashboard

-- Supprimer les anciennes policies admin contradictoires
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read and update all issue reports" ON public.issue_reports;

-- Recréer une seule policy admin cohérente (déjà dans admin_setup.sql, mais on s'assure qu'elle est correcte)
CREATE POLICY "Admins can read and update all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  );

-- Vérification
SELECT 
  policyname, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'issue_reports' 
  AND policyname LIKE '%Admin%';
