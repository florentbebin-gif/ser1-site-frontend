-- Script de nettoyage et de fiabilisation de la table ui_settings
-- À exécuter dans l'éditeur SQL Supabase

BEGIN;

-- 1) Supprimer les entrées avec user_id NULL
DELETE FROM ui_settings WHERE user_id IS NULL;

-- 2) Dédoublonner ui_settings : garder la ligne la plus récente pour chaque user_id
-- Utilise une CTE (Common Table Expression) pour identifier les doublons à supprimer
WITH DuplicatesToDelete AS (
    SELECT
        id,
        user_id,
        ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY COALESCE(updated_at, created_at) DESC, created_at DESC, id DESC) as rn
    FROM ui_settings
    WHERE user_id IS NOT NULL
)
DELETE FROM ui_settings
WHERE id IN (SELECT id FROM DuplicatesToDelete WHERE rn > 1);

-- 3) Ajouter une contrainte d'unicité sur user_id
-- Crée un index unique qui garantit une seule ligne par utilisateur
ALTER TABLE ui_settings ADD CONSTRAINT ui_settings_user_id_unique UNIQUE (user_id);

COMMIT;

-- Vérification (optionnel)
-- SELECT user_id, COUNT(*) as count FROM ui_settings GROUP BY user_id HAVING COUNT(*) > 1;
