-- Migration corrective : nettoyage et reclassement des PDF Base CG retraite.
-- Les objets Storage sont copiés/supprimés par CLI après validation humaine.

CREATE OR REPLACE FUNCTION pg_temp.base_cg_retraite_jsonb_is_missing(value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN value IS NULL THEN true
    WHEN jsonb_typeof(value) = 'null' THEN true
    WHEN jsonb_typeof(value) = 'string' THEN
      btrim(value #>> '{}') = ''
      OR btrim(value #>> '{}') ~* '^(?:-|n/a|na|nc|n\.c\.|non communiqu[eé]|non renseign[eé]|à compl[eé]ter|a compl[eé]ter)$'
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.base_cg_retraite_fill_missing(existing jsonb, incoming jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  key text;
  merged jsonb := COALESCE(existing, '{}'::jsonb);
BEGIN
  IF pg_temp.base_cg_retraite_jsonb_is_missing(incoming) THEN
    RETURN existing;
  END IF;

  IF pg_temp.base_cg_retraite_jsonb_is_missing(existing) THEN
    RETURN incoming;
  END IF;

  IF jsonb_typeof(existing) = 'array' OR jsonb_typeof(incoming) = 'array' THEN
    RETURN existing;
  END IF;

  IF jsonb_typeof(existing) = 'object' AND jsonb_typeof(incoming) = 'object' THEN
    FOR key IN SELECT jsonb_object_keys(incoming) LOOP
      merged := jsonb_set(
        merged,
        ARRAY[key],
        pg_temp.base_cg_retraite_fill_missing(existing -> key, incoming -> key),
        true
      );
    END LOOP;
    RETURN merged;
  END IF;

  RETURN existing;
END;
$$;

-- Documents finaux à ajouter après copie Storage.
INSERT INTO public.base_cg_retraite_documents (
  id, contract_id, label, document_type, status, source_url, version_label,
  storage_path, file_name, mime, bytes, uploaded_at
)
VALUES
('abeille-perin-abeille-retraite-plurielle-394-conditions_generales-v6369o-06-2025-b3e85939', 'abeille-perin-abeille-retraite-plurielle-394', 'Conditions générales PERIN- ABEILLE RETRAITE PLURIELLE', 'conditions_generales', 'uploaded', NULL, 'V6369O 06/2025', 'abeille/perin-abeille-retraite-plurielle/v6369o-06-2025.pdf', 'v6369o-06-2025.pdf', 'application/pdf', 1212380, now()),
('ag2r-la-mondiale-madelin-retraite-agricole-373-notice_information-09-2009-72460fa5', 'ag2r-la-mondiale-madelin-retraite-agricole-373', 'Notice d''information MADELIN- MONDIALE RETRAITE AGRICOLE', 'notice_information', 'uploaded', NULL, '09/2009', 'ag2r-la-mondiale/madelin-mondiale-retraite-agricole/09-2009.pdf', '09-2009.pdf', 'application/pdf', 563057, now()),
('ageas-madelin-forticiel-conditions_generales-2007-0eca340a', 'ageas-madelin-forticiel', 'Conditions générales MADELIN- FORTICIEL', 'conditions_generales', 'uploaded', NULL, '2007', 'ageas/madelin-forticiel/2007.pdf', '2007.pdf', 'application/pdf', 99140, now()),
('generali-art83-xaelidia-retraite-entreprise-138-notice_information-03-2007-8aa54da0', 'generali-art83-xaelidia-retraite-entreprise-138', 'Notice d''information ART83- XAELIDIA RETRAITE ENTREPRISE', 'notice_information', 'uploaded', NULL, '03/2007', 'generali/art83-xaelidia-retraite-entreprise/03-2007.pdf', '03-2007.pdf', 'application/pdf', 838974, now()),
('generali-art83-xaelidia-retraite-entreprise-138-notice_information-2015-688e5512', 'generali-art83-xaelidia-retraite-entreprise-138', 'Notice d''information ART83- XAELIDIA RETRAITE ENTREPRISE', 'notice_information', 'uploaded', NULL, '2015', 'generali/art83-xaelidia-retraite-entreprise/2015.pdf', '2015.pdf', 'application/pdf', 651592, now()),
-- Item 11 : les PDF La retraite 94 appartiennent à La retraite 13.
('generali-madelin-la-retraite-13-156-notice_information-2012-6c88f69d', 'generali-madelin-la-retraite-13-156', 'Notice d''information MADELIN-La retraite 13', 'notice_information', 'uploaded', NULL, '2012', 'generali/madelin-la-retraite-13/2012.pdf', '2012.pdf', 'application/pdf', 643775, now()),
('generali-madelin-la-retraite-13-156-notice_information-2015-7c18e9fc', 'generali-madelin-la-retraite-13-156', 'Notice d''information MADELIN-La retraite 13', 'notice_information', 'uploaded', NULL, '2015', 'generali/madelin-la-retraite-13/2015.pdf', '2015.pdf', 'application/pdf', 497492, now()),
-- Item 10 : le PDF La retraite 15 appartient à La retraite 94.
('generali-madelin-la-retraite-94-153-conditions_generales-08-2004-f3733398', 'generali-madelin-la-retraite-94-153', 'Conditions générales MADELIN- La retraite 94', 'conditions_generales', 'uploaded', NULL, '08/2004', 'generali/madelin-la-retraite-94/08-2004.pdf', '08-2004.pdf', 'application/pdf', 141410, now()),
('generali-madelin-serenidad-retraite-madelin-151-notice_information-01-2007-a17af45b', 'generali-madelin-serenidad-retraite-madelin-151', 'Notice d''information MADELIN- SERENIDAD RETRAITE MADELIN', 'notice_information', 'uploaded', NULL, '01/2007', 'generali/madelin-serenidad-retraite-madelin/01-2007.pdf', '01-2007.pdf', 'application/pdf', 350235, now()),
('generali-madelin-serenidad-retraite-madelin-151-notice_information-08-2004-6d41cc9b', 'generali-madelin-serenidad-retraite-madelin-151', 'Notice d''information MADELIN- SERENIDAD RETRAITE MADELIN', 'notice_information', 'uploaded', NULL, '08/2004', 'generali/madelin-serenidad-retraite-madelin/08-2004.pdf', '08-2004.pdf', 'application/pdf', 633983, now())
ON CONFLICT (id) DO UPDATE SET
  contract_id = excluded.contract_id,
  label = excluded.label,
  document_type = excluded.document_type,
  status = excluded.status,
  source_url = excluded.source_url,
  version_label = excluded.version_label,
  storage_path = excluded.storage_path,
  file_name = excluded.file_name,
  mime = excluded.mime,
  bytes = excluded.bytes,
  uploaded_at = COALESCE(public.base_cg_retraite_documents.uploaded_at, excluded.uploaded_at);

-- Documents retirés ou déplacés : retrait de la couche applicative uniquement.
DELETE FROM public.base_cg_retraite_documents
WHERE id IN (
  'ageas-perp-conditions-generales-forticiel-conditions_generales-2007-0eca340a',
  'april-madelin-retraite-madelin-april-328-conditions_generales-09-2007-62ec3105',
  'axa-art83-retraite-4-g-293-conditions_generales-2007-5e134107',
  'axa-art83-retraite-entreprise-a-adhesion-obligatoire-294-conditions_generales-2004-3414d93c',
  'cardif-madelin-cardif-retraite-madelin-251-notice_information-2008-6c00902c',
  'credit-agricole-madelin-accordance-238-notice_information-04-2015-5baff912',
  'gan-perp-gan-retraite-garantie-180-notice_information-08-2008-d786e3f2',
  'generali-art83-la-retraite-94-article-83-134-notice_information-03-2007-8aa54da0',
  'generali-art83-la-retraite-94-article-83-134-notice_information-2015-688e5512',
  'generali-madelin-la-retraite-13-156-conditions_generales-08-2004-0248533b',
  'generali-madelin-la-retraite-15-157-conditions_generales-08-2004-f3733398',
  'generali-madelin-la-retraite-94-153-notice_information-2012-6c88f69d',
  'generali-madelin-la-retraite-94-153-notice_information-2015-7c18e9fc',
  'generali-madelin-scenario-retraite-madelin-150-notice_information-01-2007-a17af45b',
  'generali-madelin-scenario-retraite-madelin-150-notice_information-08-2004-6d41cc9b',
  'la-medicale-madelin-medicale-horizon-madelin-105-conditions_generales-2007-cf061f02',
  'la-medicale-madelin-medicale-horizon-madelin-2-103-conditions_generales-2007-83d2cf60',
  'la-medicale-madelin-medicale-retraite-104-notice_information-01-2014-f38efd43',
  'prefon-perp-prefon-retraite-41-notice_information-12-2019-bc0def6c'
)
OR storage_path IN (
  'ageas/conditions-generales-forticiel/2007.pdf',
  'april/madelin-retraite-madelin-april/09-2007.pdf',
  'axa/art83-retraite-4-g/2007.pdf',
  'axa/art83-retraite-entreprise-a-adhesion-obligatoire/2004.pdf',
  'cardif/madelin-cardif-retraite-madelin/2008.pdf',
  'credit-agricole/madelin-accordance/04-2015.pdf',
  'gan/perp-gan-retraite-garantie/08-2008.pdf',
  'generali/art83-la-retraite-94-article-83/03-2007.pdf',
  'generali/art83-la-retraite-94-article-83/2015.pdf',
  'generali/madelin-la-retraite-13/08-2004.pdf',
  'generali/madelin-la-retraite-15/08-2004.pdf',
  'generali/madelin-la-retraite-94/2012.pdf',
  'generali/madelin-la-retraite-94/2015.pdf',
  'generali/madelin-scenario-retraite-madelin/01-2007.pdf',
  'generali/madelin-scenario-retraite-madelin/08-2004.pdf',
  'la-medicale/madelin-medicale-horizon-madelin/2007.pdf',
  'la-medicale/madelin-medicale-horizon-madelin-2/2007.pdf',
  'la-medicale/madelin-medicale-retraite/01-2014.pdf',
  'prefon/perp-prefon-retraite/12-2019.pdf'
);

-- Renommage affiché du contrat agricole existant.
INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES (
  'ag2r-la-mondiale-madelin-retraite-agricole-373',
  '{"id":"ag2r-la-mondiale-madelin-retraite-agricole-373","nomContrat":"MADELIN- MONDIALE RETRAITE AGRICOLE"}'::jsonb,
  false,
  now()
)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = public.base_cg_retraite_overrides.contract_data || excluded.contract_data,
  is_deleted = false,
  updated_at = now();

-- Mise à jour des champs métier validés pour Abeille Retraite Plurielle.
INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES (
  'abeille-perin-abeille-retraite-plurielle-394',
  '{"id":"abeille-perin-abeille-retraite-plurielle-394","phaseEpargne":{"fraisGestionFondsEuro":0.01},"phaseLiquidation":{"ageLimiteLiquidation":"80 ans"}}'::jsonb,
  false,
  now()
)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data =
    COALESCE(public.base_cg_retraite_overrides.contract_data, '{}'::jsonb)
    || jsonb_build_object(
      'id',
      'abeille-perin-abeille-retraite-plurielle-394',
      'phaseEpargne',
      COALESCE(public.base_cg_retraite_overrides.contract_data -> 'phaseEpargne', '{}'::jsonb)
        || '{"fraisGestionFondsEuro":0.01}'::jsonb,
      'phaseLiquidation',
      COALESCE(public.base_cg_retraite_overrides.contract_data -> 'phaseLiquidation', '{}'::jsonb)
        || '{"ageLimiteLiquidation":"80 ans"}'::jsonb
    ),
  is_deleted = false,
  updated_at = now();

-- FORTICIEL : ancien override PERP remplacé par un override Madelin canonique.
INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES (
  'ageas-madelin-forticiel',
  '{"id":"ageas-madelin-forticiel","sourceId":"Source PDF FORTICIEL - Conditions Générales FORTICIEL","compagnie":"AGEAS","nomContrat":"MADELIN- FORTICIEL","typeContrat":"MADELIN","perCompartment":"C1","phaseEpargne":{"dateCommercialisation":null,"nombreFonds":null,"repartitionUcEuro":null,"rendementFondsEuro":null,"fondsEuroGarantis":null,"fraisVersements":0.05,"fraisGestion":null,"fraisGestionFondsEuro":null,"fraisGestionUc":null,"fraisArbitrage":"0.50 %","fraisTransfertSortant":null,"fraisTransfertSortantRate":null,"clauseBeneficiaire":null,"garantiesComplementaires":null},"phaseLiquidation":{"ageLimiteLiquidation":null,"sortieCapitalRetraite":null,"fractionnementCapital":null,"rachatLibre":null,"tableConversionRente":null,"tableGarantieAdhesion":null,"tauxTechnique":null,"fraisArrerages":null,"fraisArreragesRate":null,"annuitesGaranties":null,"reversionPossible":null,"reversionIncluse":null,"renteEstimee":null},"documents":[],"pointsParams":null}'::jsonb,
  false,
  now()
)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = excluded.contract_data,
  is_deleted = false,
  updated_at = now();

INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES
  ('ageas-perp-conditions-generales-forticiel', '{"id":"ageas-perp-conditions-generales-forticiel"}'::jsonb, true, now()),
  ('prefon-perp-prefon-retraite-41', '{"id":"prefon-perp-prefon-retraite-41"}'::jsonb, true, now())
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = excluded.contract_data,
  is_deleted = true,
  updated_at = now();

-- Valeurs métier extraites des PDF Generali déplacés.
INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES (
  'generali-madelin-la-retraite-13-156',
  '{"id":"generali-madelin-la-retraite-13-156","phaseEpargne":{"fraisArbitrage":"0.3 %"}}'::jsonb,
  false,
  now()
)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = pg_temp.base_cg_retraite_fill_missing(
    public.base_cg_retraite_overrides.contract_data,
    excluded.contract_data
  ),
  is_deleted = false,
  updated_at = now();

UPDATE public.base_cg_retraite_overrides
SET
  contract_data = '{"id":"generali-madelin-la-retraite-94-153"}'::jsonb,
  is_deleted = false,
  updated_at = now()
WHERE contract_id = 'generali-madelin-la-retraite-94-153';

INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES (
  'generali-madelin-serenidad-retraite-madelin-151',
  '{"id":"generali-madelin-serenidad-retraite-madelin-151","phaseLiquidation":{"fraisArrerages":0.03,"fraisArreragesRate":0.03}}'::jsonb,
  false,
  now()
)
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = pg_temp.base_cg_retraite_fill_missing(
    public.base_cg_retraite_overrides.contract_data,
    excluded.contract_data
  ),
  is_deleted = false,
  updated_at = now();

UPDATE public.base_cg_retraite_overrides
SET
  contract_data = '{"id":"generali-madelin-scenario-retraite-madelin-150"}'::jsonb,
  is_deleted = false,
  updated_at = now()
WHERE contract_id = 'generali-madelin-scenario-retraite-madelin-150';
