-- Script de diagnostic et réparation pour la table issue_reports
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'issue_reports'
  ) THEN
    RAISE NOTICE 'La table issue_reports n''existe pas. Création...';
    
    -- Créer la table si elle n'existe pas
    CREATE TABLE public.issue_reports (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at timestamptz DEFAULT now() NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      page text NOT NULL,
      title text NOT NULL,
      description text NOT NULL,
      meta jsonb DEFAULT '{}'::jsonb,
      status text DEFAULT 'new' NOT NULL,
      admin_read_at timestamptz DEFAULT NULL
    );
    
    -- Activer RLS
    ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Table issue_reports créée avec succès.';
  ELSE
    RAISE NOTICE 'La table issue_reports existe déjà.';
  END IF;
END $$;

-- 2. Vérifier la structure de la table et ajouter les colonnes manquantes
DO $$
BEGIN
  -- Vérifier si la colonne admin_read_at existe
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'issue_reports' AND column_name = 'admin_read_at'
  ) THEN
    ALTER TABLE public.issue_reports ADD COLUMN admin_read_at timestamptz DEFAULT NULL;
    RAISE NOTICE 'Colonne admin_read_at ajoutée.';
  END IF;
END $$;

-- 3. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_issue_reports_user_id ON public.issue_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_issue_reports_admin_read_at ON public.issue_reports(admin_read_at) WHERE admin_read_at IS NULL;

-- 4. Supprimer toutes les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Users can insert their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can view their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can update their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Users can delete their own issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can read and update all issue reports" ON public.issue_reports;

-- 5. Recréer les policies correctement
-- Policy pour les utilisateurs
CREATE POLICY "Users can insert their own issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own issue reports" ON public.issue_reports
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own issue reports" ON public.issue_reports
  FOR DELETE USING (user_id = auth.uid());

-- Policy pour les admins (lecture + mise à jour de tous les signalements)
-- Cette policy utilise app_metadata.role pour identifier les admins
CREATE POLICY "Admins can manage all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata'::jsonb ->> 'role' = 'admin'
  );

-- 6. Insérer un signalement de test si la table est vide
DO $$
DECLARE
  admin_id uuid;
  count_reports integer;
BEGIN
  -- Vérifier si la table est vide
  SELECT COUNT(*) INTO count_reports FROM public.issue_reports;
  
  IF count_reports = 0 THEN
    -- Trouver un utilisateur admin
    SELECT id INTO admin_id FROM auth.users 
    WHERE raw_app_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'admin'
    LIMIT 1;
    
    IF admin_id IS NOT NULL THEN
      -- Insérer un signalement de test
      INSERT INTO public.issue_reports (
        user_id, page, title, description, status
      ) VALUES (
        admin_id, 
        '/settings', 
        'Signalement de test', 
        'Ceci est un signalement de test pour vérifier que la table fonctionne correctement.',
        'new'
      );
      RAISE NOTICE 'Signalement de test inséré pour l''utilisateur admin %', admin_id;
    ELSE
      RAISE NOTICE 'Aucun utilisateur admin trouvé pour créer un signalement de test.';
    END IF;
  ELSE
    RAISE NOTICE 'La table issue_reports contient déjà % signalements.', count_reports;
  END IF;
END $$;

-- 7. Afficher les informations de diagnostic
SELECT 'Table structure' as info, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'issue_reports';

SELECT 'Row count' as info, COUNT(*) as count FROM public.issue_reports;

SELECT 'RLS policies' as info, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'issue_reports';

-- 8. Vérifier les signalements existants
SELECT 
  id, 
  created_at, 
  user_id, 
  page, 
  title, 
  LEFT(description, 50) as description_preview, 
  admin_read_at,
  status
FROM public.issue_reports
ORDER BY created_at DESC;
