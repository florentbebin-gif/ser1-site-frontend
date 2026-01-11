-- 1. Identifier doublons (pour info)
-- select user_id, count(*) from public.ui_settings group by user_id having count(*) > 1;

-- 2. Supprimer les doublons en ne gardant que la ligne la plus récente par utilisateur
DELETE FROM public.ui_settings a
USING public.ui_settings b
WHERE a.user_id = b.user_id 
AND a.updated_at < b.updated_at;

-- 3. Supprimer les lignes orphelines (user_id NULL) sauf si c'était le template par défaut (mais on veut 1 ligne par user)
-- Le template par défaut (user_id NULL) causait des problèmes si on faisait des select sans filtre user_id précis
DELETE FROM public.ui_settings
WHERE user_id IS NULL;

-- 4. Ajouter la contrainte d'unicité pour empêcher la réapparition des doublons
CREATE UNIQUE INDEX IF NOT EXISTS ui_settings_user_unique
ON public.ui_settings(user_id);

-- 5. Vérifier la structure (optionnel)
-- SELECT * FROM public.ui_settings;
