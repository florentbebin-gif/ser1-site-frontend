-- Répare deux contrats Generali écrasés par des overrides partiels lors du backfill canonique.
-- Les triggers SQL recalculent row_hash et catalog_meta après ces upserts.

INSERT INTO public.base_cg_retraite_contracts (
  contract_id,
  source_id,
  company,
  contract_name,
  contract_type,
  per_compartment,
  contract_data,
  is_deleted,
  updated_at
)
VALUES
  (
    'generali-madelin-la-retraite-94-153',
    'Contrat N°153',
    'GENERALI',
    'MADELIN- La retraite 94',
    'MADELIN',
    'C1',
    '{"compagnie":"GENERALI","id":"generali-madelin-la-retraite-94-153","nomContrat":"MADELIN- La retraite 94","perCompartment":"C1","phaseEpargne":{"clauseBeneficiaire":"Standard\n(Rente temporaire)","dateCommercialisation":"De 1986 à 2008","fraisArbitrage":"-","fraisGestion":0.006,"fraisTransfertSortant":"1% + 5% décroissant avant 10 ans sinon 0%","fraisTransfertSortantRate":0.01,"fraisVersements":0.05,"garantiesComplementaires":"Option 1 : rente individuelle\nOption 1A : rente réversible 60% conjoint\nOption 2 : rente réversible 100% conjoint\nInclus : Bonne fin en 1A et 2 et exo des cotisations (pour toutes)","nombreFonds":1,"rendementFondsEuro":"NC\n(TMG à 2% bruts 31/12/16)","repartitionUcEuro":null},"phaseLiquidation":{"ageLimiteLiquidation":"NC","annuitesGaranties":"Oui 10 ans (rente 1 et 2)","fractionnementCapital":"Non","fraisArrerages":0,"fraisArreragesRate":0,"rachatLibre":"Non","renteEstimee":null,"reversionIncluse":"Oui en 1A et 2","reversionPossible":"Oui","sortieCapitalRetraite":"Non","tableConversionRente":"TPRV93","tableGarantieAdhesion":"Oui","tauxTechnique":"2,90% nets pour vst avant 31/12/16 puis 0%"},"pointsParams":null,"sourceId":"Contrat N°153","typeContrat":"MADELIN"}'::jsonb,
    false,
    now()
  ),
  (
    'generali-madelin-scenario-retraite-madelin-150',
    'Contrat N°150',
    'GENERALI',
    'MADELIN- SCENARIO RETRAITE - MADELIN',
    'MADELIN',
    'C1',
    '{"compagnie":"GENERALI","id":"generali-madelin-scenario-retraite-madelin-150","nomContrat":"MADELIN- SCENARIO RETRAITE - MADELIN","perCompartment":"C1","phaseEpargne":{"clauseBeneficiaire":"Standard\n(Rente viagère)","dateCommercialisation":"De 2001 à 2008","fraisArbitrage":"0,5% (maxi 50€)","fraisGestion":0.0096,"fraisTransfertSortant":"1% avant 10 ans sinon 0","fraisTransfertSortantRate":0.01,"fraisVersements":0.03,"garantiesComplementaires":"Inclus :\nExo des cotisations","nombreFonds":5,"rendementFondsEuro":"NC","repartitionUcEuro":null},"phaseLiquidation":{"ageLimiteLiquidation":"75 ans","annuitesGaranties":"Non","fractionnementCapital":"Non","fraisArrerages":"NC","fraisArreragesRate":null,"rachatLibre":"Non","renteEstimee":null,"reversionIncluse":"NC","reversionPossible":"Oui sur option (60 - 75 - 100%)","sortieCapitalRetraite":"Non","tableConversionRente":"TPRV93","tableGarantieAdhesion":"Oui","tauxTechnique":0},"pointsParams":null,"sourceId":"Contrat N°150","typeContrat":"MADELIN"}'::jsonb,
    false,
    now()
  )
ON CONFLICT (contract_id) DO UPDATE SET
  source_id = excluded.source_id,
  company = excluded.company,
  contract_name = excluded.contract_name,
  contract_type = excluded.contract_type,
  per_compartment = excluded.per_compartment,
  contract_data = excluded.contract_data,
  is_deleted = false,
  updated_at = now();
