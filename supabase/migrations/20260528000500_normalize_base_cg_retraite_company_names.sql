-- Normalise les noms de compagnies Base-CG après migration canonique.
-- Ne touche pas Storage ; les triggers SQL existants recalculent row_hash et catalog_meta.

WITH rename_map(old_company, new_company) AS (
  VALUES
    ('EPSENS', 'MALAKOFF_HUMANIS'),
    ('GO_EPARGNE', 'EPARTIM'),
    ('LPA', 'LPA_PREVOYANCE'),
    ('MNRA', 'GARANCE'),
    ('SMA', 'SMABTP'),
    ('SMA_BTP', 'SMABTP')
)
UPDATE public.base_cg_retraite_contracts AS contracts
SET
  company = rename_map.new_company,
  contract_data = jsonb_set(
    contracts.contract_data,
    '{compagnie}',
    to_jsonb(rename_map.new_company),
    true
  ),
  updated_at = now()
FROM rename_map
WHERE
  contracts.company = rename_map.old_company
  OR contracts.contract_data ->> 'compagnie' = rename_map.old_company;
