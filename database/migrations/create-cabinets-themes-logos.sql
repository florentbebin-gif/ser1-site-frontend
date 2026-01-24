-- ============================================================================
-- Migration V1: Add cabinets, themes, logos foundation
-- ============================================================================

-- 1) Function is_admin() - Source de vérité admin depuis JWT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  -- Vérifier le rôle depuis les claims JWT (user_metadata ou app_metadata)
  -- current_setting('request.jwt.claims', true) retourne NULL si pas de JWT
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'user_metadata'->>'role',
    current_setting('request.jwt.claims', true)::jsonb->>'app_metadata'->>'role',
    'user'
  ) = 'admin';
$$;

-- ============================================================================
-- 2) Table themes (liste globale gérée par admin)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  palette JSONB NOT NULL,              -- { c1: "#...", c2: "#...", ..., c10: "#..." }
  is_system BOOLEAN DEFAULT false,     -- true pour thèmes SER1 immuables
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index sur name pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_themes_name ON public.themes(name);

-- Trigger updated_at pour themes (réutiliser fonction existante si disponible)
CREATE TRIGGER set_themes_updated_at
  BEFORE UPDATE ON public.themes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3) Table logos (stockage avec dédup SHA256)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sha256 TEXT NOT NULL UNIQUE,         -- Hash pour dédup
  storage_path TEXT NOT NULL,          -- "logos/{cabinet_id}/{filename}"
  mime TEXT NOT NULL,                  -- "image/png" ou "image/jpeg"
  width INT,
  height INT,
  bytes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index sur sha256 pour dédup rapide
CREATE INDEX IF NOT EXISTS idx_logos_sha256 ON public.logos(sha256);

-- ============================================================================
-- 4) Table cabinets (entité centrale)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cabinets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- Nom unique du cabinet
  default_theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  logo_id UUID REFERENCES public.logos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index sur name pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_cabinets_name ON public.cabinets(name);

-- Trigger updated_at pour cabinets
CREATE TRIGGER set_cabinets_updated_at
  BEFORE UPDATE ON public.cabinets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 5) Ajouter cabinet_id aux profiles
-- ============================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cabinet_id UUID REFERENCES public.cabinets(id) ON DELETE SET NULL;

-- Index sur cabinet_id pour lookup rapide
CREATE INDEX IF NOT EXISTS idx_profiles_cabinet_id ON public.profiles(cabinet_id);

-- ============================================================================
-- 6) Activer RLS sur nouvelles tables
-- ============================================================================

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7) Policies RLS avec is_admin()
-- ============================================================================

-- themes: lecture pour tous, écriture admin
CREATE POLICY "Anyone can read themes" ON public.themes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage themes" ON public.themes
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- logos: admin full control (pas de user read en V1)
CREATE POLICY "Admins can manage logos" ON public.logos
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- cabinets: admin full control, lecture limitée en V1
CREATE POLICY "Admins can manage cabinets" ON public.cabinets
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Note: Pas de policy SELECT pour users en V1 (pas de besoin de lire les cabinets)

-- ============================================================================
-- 8) SEEDS initiaux
-- ============================================================================

-- Thème Original (palette exacte depuis le code)
INSERT INTO public.themes (name, palette, is_system) VALUES
('Thème Original', 
  '{"c1":"#2B3E37","c2":"#709B8B","c3":"#9FBDB2","c4":"#CFDED8","c5":"#788781","c6":"#CEC1B6","c7":"#F5F3F0","c8":"#D9D9D9","c9":"#7F7F7F","c10":"#000000"}',
  true
) ON CONFLICT (name) DO NOTHING;

-- Cabinet "Défaut" (lié par ID, pas par name)
INSERT INTO public.cabinets (name, default_theme_id) 
SELECT 'Défaut', id FROM public.themes WHERE name = 'Thème Original' AND is_system = true
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 9) Validation
-- ============================================================================

-- Vérifier que les tables sont créées
SELECT 'themes' as table_name, count(*) as row_count FROM public.themes
UNION ALL
SELECT 'logos', count(*) FROM public.logos
UNION ALL
SELECT 'cabinets', count(*) FROM public.cabinets
UNION ALL
SELECT 'profiles_with_cabinet', count(*) FROM public.profiles WHERE cabinet_id IS NOT NULL;
