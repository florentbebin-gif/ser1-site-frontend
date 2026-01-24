-- ========================================
-- MIGRATION: Renommer SER1 Classique → Thème Original
-- ========================================

-- 1. RENOMMAGE THEME (idempotent)
UPDATE public.themes 
SET name = 'Thème Original' 
WHERE name = 'SER1 Classique' AND is_system = true;

-- 2. VERIFICATION
SELECT 
  'themes' as table_name, 
  id, 
  name, 
  is_system,
  CASE WHEN name = 'Thème Original' THEN '✅ OK' ELSE '❌ ERROR' END as status
FROM public.themes 
WHERE is_system = true AND name IN ('SER1 Classique', 'Thème Original');

-- 3. VERIFICATION CABINET LINK
SELECT 
  'cabinets' as table_name,
  c.name as cabinet_name,
  c.default_theme_id,
  t.name as theme_name,
  CASE WHEN t.name = 'Thème Original' THEN '✅ OK' ELSE '❌ ERROR' END as status
FROM public.cabinets c
LEFT JOIN public.themes t ON c.default_theme_id = t.id
WHERE c.name = 'Défaut';

-- ========================================
-- ROLLBACK (si nécessaire)
-- ========================================

-- ROLLBACK THEME
UPDATE public.themes 
SET name = 'SER1 Classique' 
WHERE name = 'Thème Original' AND is_system = true;
