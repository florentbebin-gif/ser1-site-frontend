-- Migration admin_setup.sql (REJOUABLE)
-- Ajout de la colonne admin_read_at pour le suivi des signalements lus par l'admin

DO $$
BEGIN
  -- Ajouter colonne admin_read_at si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'issue_reports' 
    AND column_name = 'admin_read_at'
  ) THEN
    ALTER TABLE public.issue_reports 
    ADD COLUMN admin_read_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Créer index pour performance (si n'existe pas)
CREATE INDEX IF NOT EXISTS idx_issue_reports_admin_read_at 
ON public.issue_reports(admin_read_at) 
WHERE admin_read_at IS NULL;

-- Supprimer policies existantes pour les recréer proprement
DROP POLICY IF EXISTS "Users can insert their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can update their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can delete their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read and update all issue reports" ON public.issue_reports;

-- Policies pour les utilisateurs (lecture seule de leurs propres signalements)
CREATE POLICY "Users can insert their own issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own issue reports" ON public.issue_reports
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own issue reports" ON public.issue_reports
  FOR DELETE USING (user_id = auth.uid());

-- Policy pour les admins (lecture + update admin_read_at)
CREATE POLICY "Admins can read and update all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  );

-- Vérification de la configuration
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'issue_reports' 
AND column_name = 'admin_read_at';

-- Afficher les policies RLS actives
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'issue_reports';
