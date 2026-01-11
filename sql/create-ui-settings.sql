-- Table pour les paramètres UI/thème (lecture publique)
CREATE TABLE IF NOT EXISTS public.ui_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_name text DEFAULT 'default',
  colors jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_ui_settings_user_id ON public.ui_settings(user_id);

-- RLS (Row Level Security) pour que chaque utilisateur ne voit que ses settings
ALTER TABLE public.ui_settings ENABLE ROW LEVEL SECURITY;

-- Politique : chaque utilisateur peut lire/écrire ses propres settings
CREATE POLICY "Users can manage their own UI settings" ON public.ui_settings
  FOR ALL USING (auth.uid() = user_id);

-- Politique : lecture publique pour les thèmes par défaut (optionnel)
CREATE POLICY "Everyone can read default themes" ON public.ui_settings
  FOR SELECT USING (theme_name = 'default');

-- Trigger pour mettre à jour le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ui_settings_updated_at 
  BEFORE UPDATE ON public.ui_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer un thème par défaut si aucun n'existe (couleurs SER1 d'origine)
INSERT INTO public.ui_settings (id, user_id, theme_name, colors)
VALUES (
  gen_random_uuid(),
  NULL, -- Pas de user_id spécifique pour le thème par défaut
  'default',
  '{
    "primary": "#2B3E37",
    "primaryHover": "#1f2d28",
    "secondary": "#709B8B",
    "accent": "#9FBDB2",
    "background": "#CFDED8",
    "surface": "#788781",
    "text": "#000000",
    "textMuted": "#7F7F7F",
    "border": "#D9D9D9",
    "success": "#2B3E37",
    "warning": "#CEC1B6",
    "error": "#dc2626"
  }'::jsonb
) ON CONFLICT DO NOTHING;
