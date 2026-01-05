-- ============================================================================
-- FIX pour profiles : assurer que profiles.id = auth.users.id
-- et créer la ligne manquante pour l'utilisateur courant
-- ============================================================================

-- 1) Vérifier si votre utilisateur existe dans profiles
-- Remplacez 'votre-email@example.com' par votre vrai email
SELECT * FROM public.profiles WHERE email = 'votre-email@example.com';

-- 2) Si la ligne n'existe pas, la créer avec le bon id (auth.users.id)
-- D'abord, récupérez votre user_id depuis auth.users :
SELECT id, email FROM auth.users WHERE email = 'votre-email@example.com';

-- 3) Insérer/corriger la ligne dans profiles (remplacez UUID par votre id)
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
VALUES (
  'VOTRE-UUID-ICI', -- <-- copiez l'id depuis auth.users
  'votre-email@example.com',
  'admin',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  updated_at = now();

-- 4) Vérifier le résultat
SELECT * FROM public.profiles WHERE email = 'votre-email@example.com';

-- 5) Policy alternative plus permissive pour profiles (si nécessaire)
-- Décommentez si vous avez des erreurs 403 en lisant profiles
/*
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
*/
