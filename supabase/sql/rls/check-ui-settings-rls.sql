-- Vérification RLS ui_settings
-- Exécuter dans Supabase SQL Editor

-- 1. Vérifier que les policies existent
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'ui_settings';

-- 2. Vérifier les permissions de l'utilisateur courant
SELECT 
  has_table_privilege('public.ui_settings', 'SELECT') as can_select,
  has_table_privilege('public.ui_settings', 'INSERT') as can_insert,
  has_table_privilege('public.ui_settings', 'UPDATE') as can_update,
  has_table_privilege('public.ui_settings', 'DELETE') as can_delete;

-- 3. Inspecter les données existantes
SELECT 
  user_id,
  theme_name,
  jsonb_typeof(colors) as colors_type,
  created_at,
  updated_at
FROM public.ui_settings
ORDER BY created_at DESC;

-- 4. Tester une requête manuelle (remplacer <user_id> par un UUID réel)
-- SELECT colors FROM public.ui_settings WHERE user_id = '<user_id>'::uuid;
