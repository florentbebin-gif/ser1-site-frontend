-- Table pour les signalements de problèmes
CREATE TABLE IF NOT EXISTS public.issue_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'new' NOT NULL
);

-- Activer RLS sur la table
ALTER TABLE public.issue_reports ENABLE ROW LEVEL SECURITY;

-- Politique RLS : seul l'utilisateur connecté peut insérer ses propres signalements
CREATE POLICY "Users can insert their own issue reports" ON public.issue_reports
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Politique RLS : seul l'utilisateur connecté peut voir ses propres signalements
CREATE POLICY "Users can view their own issue reports" ON public.issue_reports
  FOR SELECT USING (user_id = auth.uid());

-- Politique RLS : seul l'utilisateur connecté peut mettre à jour ses propres signalements
CREATE POLICY "Users can update their own issue reports" ON public.issue_reports
  FOR UPDATE USING (user_id = auth.uid());

-- Politique RLS : seul l'utilisateur connecté peut supprimer ses propres signalements
CREATE POLICY "Users can delete their own issue reports" ON public.issue_reports
  FOR DELETE USING (user_id = auth.uid());

-- Politique RLS : les admins peuvent lire tous les signalements
CREATE POLICY "Admins can read all issue reports" ON public.issue_reports
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'user_metadata'::jsonb ->> 'role' = 'admin' OR
    auth.jwt() ->> 'app_metadata'::jsonb ->> 'role' = 'admin'
  );
