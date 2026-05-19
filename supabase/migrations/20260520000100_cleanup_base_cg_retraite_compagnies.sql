-- Migration : nettoyage des compagnies obsolètes dans la Base CG retraite.
--
-- Ordre de déploiement recommandé : déployer le code applicatif, puis appliquer
-- cette migration. Le code reste défensif si la base contient encore les anciens noms.
--
-- Rollback manuel si nécessaire :
-- 1. Réactiver les deux overrides Primonial soft-supprimés :
--    UPDATE public.base_cg_retraite_overrides
--    SET is_deleted = false, updated_at = now()
--    WHERE contract_id IN (
--      'primonial-madelin-gestion-privee-promadelin-35',
--      'primonial-madelin-cardif-retraite-professionnels-patrimoine-management-et-associes-36'
--    );
-- 2. Restaurer PERIN- PRIMOPER chez PRIMONIAL :
--    UPDATE public.base_cg_retraite_overrides
--    SET contract_data = jsonb_set(contract_data, '{compagnie}', to_jsonb('PRIMONIAL'::text), true),
--        updated_at = now()
--    WHERE contract_id = 'primonial-perin-primoper-37'
--      AND contract_data ->> 'compagnie' = 'ORADEA';
-- 3. Restaurer CREDIT_DU_NORD uniquement sur les overrides historiques
--    Antarius déplacés vers SOCIETE_GENERALE :
--    UPDATE public.base_cg_retraite_overrides
--    SET contract_data = jsonb_set(contract_data, '{compagnie}', to_jsonb('CREDIT_DU_NORD'::text), true),
--        updated_at = now()
--    WHERE contract_id IN (
--      'credit-du-nord-perp-antarius-perp-229',
--      'credit-du-nord-madelin-antarius-retraite-madelin-230',
--      'credit-du-nord-perin-antarius-perin-231'
--    )
--      AND contract_data ->> 'compagnie' = 'SOCIETE_GENERALE';
--
-- Aucun document base_cg_retraite_documents ni objet Storage n'est supprimé ici.

WITH contrats_a_supprimer(contract_id) AS (
  VALUES
    ('primonial-madelin-gestion-privee-promadelin-35'),
    ('primonial-madelin-cardif-retraite-professionnels-patrimoine-management-et-associes-36')
)
UPDATE public.base_cg_retraite_overrides AS overrides
SET
  is_deleted = true,
  updated_at = now()
FROM contrats_a_supprimer
WHERE overrides.contract_id = contrats_a_supprimer.contract_id
  AND overrides.is_deleted IS DISTINCT FROM true;

UPDATE public.base_cg_retraite_overrides
SET
  contract_data = jsonb_set(
    contract_data,
    '{compagnie}',
    to_jsonb('SOCIETE_GENERALE'::text),
    true
  ),
  updated_at = now()
WHERE contract_id IN (
    'credit-du-nord-perp-antarius-perp-229',
    'credit-du-nord-madelin-antarius-retraite-madelin-230',
    'credit-du-nord-perin-antarius-perin-231'
  )
  AND contract_data ->> 'compagnie' = 'CREDIT_DU_NORD';

UPDATE public.base_cg_retraite_overrides
SET
  contract_data = jsonb_set(
    contract_data,
    '{compagnie}',
    to_jsonb('ORADEA'::text),
    true
  ),
  updated_at = now()
WHERE contract_id = 'primonial-perin-primoper-37'
  AND contract_data ->> 'compagnie' = 'PRIMONIAL'
  AND contract_data ->> 'nomContrat' = 'PERIN- PRIMOPER';
