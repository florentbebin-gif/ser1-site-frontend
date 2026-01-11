-- Ajouter une colonne 'mode' à la table ui_settings pour stocker le mode de l'utilisateur
-- Cette table existe déjà et gère les préférences utilisateur

ALTER TABLE public.ui_settings 
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'simplifie' CHECK (mode IN ('expert', 'simplifie'));

-- Mettre à jour les enregistrements existants pour s'assurer qu'ils ont une valeur par défaut
UPDATE public.ui_settings 
SET mode = 'simplifie' 
WHERE mode IS NULL;

-- Commentaire pour la documentation
COMMENT ON COLUMN public.ui_settings.mode IS 'Mode utilisateur : ''expert'' ou ''simplifié'' (défaut: simplifié)';
