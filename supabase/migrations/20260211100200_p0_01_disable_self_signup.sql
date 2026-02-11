-- P0-01: Disable self-signup — invitation-only auth
--
-- IMPORTANT: Cette migration est un RAPPEL. Le blocage self-signup se fait dans
-- le dashboard Supabase (Authentication > Settings > Enable sign ups = OFF)
-- et NON via SQL.
--
-- Étapes manuelles requises dans le dashboard Supabase :
-- 1. Aller dans Authentication > Settings
-- 2. Décocher "Enable sign ups" (ou mettre à OFF)
-- 3. Confirmer que seul inviteUserByEmail() (Edge Function admin) peut créer des comptes
--
-- Vérification: tenter POST /auth/v1/signup doit retourner une erreur "Signups not allowed"
--
-- Cette migration ne contient aucun SQL exécutable.
-- Elle sert de documentation traçable dans le flux de migrations.

-- Placeholder pour que le fichier soit valide SQL
SELECT 'P0-01: self-signup disabled via Supabase dashboard — invitation-only' AS reminder;
