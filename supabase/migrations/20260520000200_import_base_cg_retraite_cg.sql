-- Migration : import préparé des CG retraite locales.
-- Ne pas appliquer avant validation de .tmp/base-cg-retraite/import-summary.md.

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

INSERT INTO public.base_cg_retraite_documents (
  id, contract_id, label, document_type, status, source_url, version_label,
  storage_path, file_name, mime, bytes, uploaded_at
)
VALUES
('agipi-madelin-far-358-notice_information-agi-0118-ed-01-2012-1b4e6dd0', 'agipi-madelin-far-358', 'Notice d''information MADELIN- FAR', 'notice_information', 'uploaded', NULL, 'AGI 0118 Ed 01/2012', 'agipi/madelin-far/agi-0118-ed-01-2012.pdf', 'agi-0118-ed-01-2012.pdf', 'application/pdf', 1132871, now()),
('april-madelin-retraite-madelin-april-328-conditions_generales-09-2007-62ec3105', 'april-madelin-retraite-madelin-april-328', 'Conditions générales MADELIN- RETRAITE MADELIN APRIL', 'conditions_generales', 'uploaded', NULL, '09-2007', 'april/madelin-retraite-madelin-april/09-2007.pdf', '09-2007.pdf', 'application/pdf', 647418, now()),
('april-madelin-cardif-retraite-professionnels-april-327-notice_information-10-2008-8495a5ef', 'april-madelin-cardif-retraite-professionnels-april-327', 'Notice d''information MADELIN- CARDIF RETRAITE PROFESSIONNELS (APRIL)', 'notice_information', 'uploaded', NULL, '10/2008', 'april/madelin-cardif-retraite-professionnels-april/10-2008.pdf', '10-2008.pdf', 'application/pdf', 862247, now()),
('abeille-madelin-norwich-strategie-retraite-loi-madelin-391-notice_information-2007-45f594b2', 'abeille-madelin-norwich-strategie-retraite-loi-madelin-391', 'Notice d''information MADELIN- NORWICH STRATEGIE RETRAITE LOI MADELIN', 'notice_information', 'uploaded', NULL, '2007', 'abeille/madelin-norwich-strategie-retraite-loi-madelin/2007.pdf', '2007.pdf', 'application/pdf', 352696, now()),
('axa-art83-retraite-4-g-293-conditions_generales-2007-5e134107', 'axa-art83-retraite-4-g-293', 'Conditions générales ART83- RETRAITE 4 G', 'conditions_generales', 'uploaded', NULL, '2007', 'axa/art83-retraite-4-g/2007.pdf', '2007.pdf', 'application/pdf', 645755, now()),
('axa-art83-retraite-entreprise-a-adhesion-obligatoire-294-conditions_generales-2004-3414d93c', 'axa-art83-retraite-entreprise-a-adhesion-obligatoire-294', 'Conditions générales ART83- RETRAITE ENTREPRISE A ADHÉSION OBLIGATOIRE', 'conditions_generales', 'uploaded', NULL, '2004', 'axa/art83-retraite-entreprise-a-adhesion-obligatoire/2004.pdf', '2004.pdf', 'application/pdf', 205009, now()),
('axa-madelin-regularite-retraite-pro-euractiel-des-professionnels-308-conditions_generales-2012-33e4639b', 'axa-madelin-regularite-retraite-pro-euractiel-des-professionnels-308', 'Conditions générales MADELIN- REGULARITE RETRAITE PRO / EURACTIEL DES PROFESSIONNELS', 'conditions_generales', 'uploaded', NULL, '2012', 'axa/madelin-regularite-retraite-pro-euractiel-des-professionnels/2012.pdf', '2012.pdf', 'application/pdf', 425905, now()),
('axa-perp-perp-reference-299-conditions_generales-2014-ce026129', 'axa-perp-perp-reference-299', 'Conditions générales PERP- PERP REFERENCE', 'conditions_generales', 'uploaded', NULL, '2014', 'axa/perp-perp-reference/2014.pdf', '2014.pdf', 'application/pdf', 875346, now()),
('cardif-perp-cardif-multiplus-perp-249-notice_information-08-2013-d275da39', 'cardif-perp-cardif-multiplus-perp-249', 'Notice d''information PERP- CARDIF MULTIPLUS PERP', 'notice_information', 'uploaded', NULL, '08/2013', 'cardif/perp-cardif-multiplus-perp/08-2013.pdf', '08-2013.pdf', 'application/pdf', 405904, now()),
('cardif-madelin-cardif-retraite-professionnels-252-notice_information-2007-b69ac861', 'cardif-madelin-cardif-retraite-professionnels-252', 'Notice d''information MADELIN- CARDIF RETRAITE PROFESSIONNELS', 'notice_information', 'uploaded', NULL, '2007', 'cardif/madelin-cardif-retraite-professionnels/2007.pdf', '2007.pdf', 'application/pdf', 416703, now()),
('cardif-madelin-cardif-retraite-professionnels-252-notice_information-02-2013-72f22823', 'cardif-madelin-cardif-retraite-professionnels-252', 'Notice d''information MADELIN- CARDIF RETRAITE PROFESSIONNELS', 'notice_information', 'uploaded', NULL, '02/2013', 'cardif/madelin-cardif-retraite-professionnels/02-2013.pdf', '02-2013.pdf', 'application/pdf', 800017, now()),
('cardif-madelin-cardif-retraite-madelin-251-notice_information-2008-6c00902c', 'cardif-madelin-cardif-retraite-madelin-251', 'Notice d''information MADELIN- CARDIF RETRAITE MADELIN', 'notice_information', 'uploaded', NULL, '2008', 'cardif/madelin-cardif-retraite-madelin/2008.pdf', '2008.pdf', 'application/pdf', 1473545, now()),
('credit-agricole-madelin-accordance-238-notice_information-04-2015-5baff912', 'credit-agricole-madelin-accordance-238', 'Notice d''information MADELIN- ACCORDANCE', 'notice_information', 'uploaded', NULL, '04/2015', 'credit-agricole/madelin-accordance/04-2015.pdf', '04-2015.pdf', 'application/pdf', 477137, now()),
('credit-mutuel-perp-previ-horizons-214-notice_information-05-2018-b81ba32c', 'credit-mutuel-perp-previ-horizons-214', 'Notice d''information PERP- PREVI - HORIZONS', 'notice_information', 'uploaded', NULL, '05/2018', 'credit-mutuel/perp-previ-horizons/05-2018.pdf', '05-2018.pdf', 'application/pdf', 1074229, now()),
('ageas-perp-conditions-generales-forticiel-conditions_generales-2007-0eca340a', 'ageas-perp-conditions-generales-forticiel', 'Conditions générales Conditions Générales FORTICIEL', 'conditions_generales', 'uploaded', NULL, '2007', 'ageas/conditions-generales-forticiel/2007.pdf', '2007.pdf', 'application/pdf', 99140, now()),
('gan-art83-dimension-retraite-energie-169-notice_information-2010-5ee44cbf', 'gan-art83-dimension-retraite-energie-169', 'Notice d''information ART83- DIMENSION RETRAITE ENERGIE', 'notice_information', 'uploaded', NULL, '2010', 'gan/art83-dimension-retraite-energie/2010.pdf', '2010.pdf', 'application/pdf', 244120, now()),
('gan-perp-gan-retraite-garantie-180-notice_information-08-2008-d786e3f2', 'gan-perp-gan-retraite-garantie-180', 'Notice d''information PERP- GAN RETRAITE GARANTIE', 'notice_information', 'uploaded', NULL, '08-2008', 'gan/perp-gan-retraite-garantie/08-2008.pdf', '08-2008.pdf', 'application/pdf', 246144, now()),
('gan-madelin-dimension-avenir-professionnels-ii-183-notice_information-01-2008-1ca0d3b5', 'gan-madelin-dimension-avenir-professionnels-ii-183', 'Notice d''information MADELIN- DIMENSION AVENIR PROFESSIONNELS II', 'notice_information', 'uploaded', NULL, '01-2008', 'gan/madelin-dimension-avenir-professionnels-ii/01-2008.pdf', '01-2008.pdf', 'application/pdf', 685521, now()),
('generali-madelin-scenario-retraite-madelin-150-notice_information-01-2007-a17af45b', 'generali-madelin-scenario-retraite-madelin-150', 'Notice d''information MADELIN- SCENARIO RETRAITE - MADELIN', 'notice_information', 'uploaded', NULL, '01/2007', 'generali/madelin-scenario-retraite-madelin/01-2007.pdf', '01-2007.pdf', 'application/pdf', 350235, now()),
('generali-art83-la-retraite-94-article-83-134-notice_information-2015-688e5512', 'generali-art83-la-retraite-94-article-83-134', 'Notice d''information ART83- LA RETRAITE 94 - ARTICLE 83', 'notice_information', 'uploaded', NULL, '2015', 'generali/art83-la-retraite-94-article-83/2015.pdf', '2015.pdf', 'application/pdf', 651592, now()),
('generali-madelin-la-retraite-13-156-conditions_generales-08-2004-0248533b', 'generali-madelin-la-retraite-13-156', 'Conditions générales MADELIN-La retraite 13', 'conditions_generales', 'uploaded', NULL, '08/2004', 'generali/madelin-la-retraite-13/08-2004.pdf', '08-2004.pdf', 'application/pdf', 122628, now()),
('generali-madelin-la-retraite-08-154-notice_information-2008-c7024496', 'generali-madelin-la-retraite-08-154', 'Notice d''information MADELIN- La retraite 08', 'notice_information', 'uploaded', NULL, '2008', 'generali/madelin-la-retraite-08/2008.pdf', '2008.pdf', 'application/pdf', 578223, now()),
('generali-madelin-la-retraite-94-153-notice_information-2012-6c88f69d', 'generali-madelin-la-retraite-94-153', 'Notice d''information MADELIN- La retraite 94', 'notice_information', 'uploaded', NULL, '2012', 'generali/madelin-la-retraite-94/2012.pdf', '2012.pdf', 'application/pdf', 643775, now()),
('generali-madelin-la-retraite-94-153-notice_information-2015-7c18e9fc', 'generali-madelin-la-retraite-94-153', 'Notice d''information MADELIN- La retraite 94', 'notice_information', 'uploaded', NULL, '2015', 'generali/madelin-la-retraite-94/2015.pdf', '2015.pdf', 'application/pdf', 497492, now()),
('generali-madelin-la-retraite-15-157-conditions_generales-08-2004-f3733398', 'generali-madelin-la-retraite-15-157', 'Conditions générales MADELIN- La retraite 15', 'conditions_generales', 'uploaded', NULL, '08/2004', 'generali/madelin-la-retraite-15/08-2004.pdf', '08-2004.pdf', 'application/pdf', 141410, now()),
('generali-perp-le-perp-generali-patrimoine-143-notice_information-2016-70f505d7', 'generali-perp-le-perp-generali-patrimoine-143', 'Notice d''information PERP- LE PERP GENERALI PATRIMOINE', 'notice_information', 'uploaded', NULL, '2016', 'generali/perp-le-perp-generali-patrimoine/2016.pdf', '2016.pdf', 'application/pdf', 610117, now()),
('generali-art83-scenario-retraite-136-conditions_generales-08-2004-57861de4', 'generali-art83-scenario-retraite-136', 'Conditions générales ART83- SCENARIO RETRAITE', 'conditions_generales', 'uploaded', NULL, '08/2004', 'generali/art83-scenario-retraite/08-2004.pdf', '08-2004.pdf', 'application/pdf', 134198, now()),
('generali-madelin-scenario-retraite-madelin-150-notice_information-08-2004-6d41cc9b', 'generali-madelin-scenario-retraite-madelin-150', 'Notice d''information MADELIN- SCENARIO RETRAITE - MADELIN', 'notice_information', 'uploaded', NULL, '08/2004', 'generali/madelin-scenario-retraite-madelin/08-2004.pdf', '08-2004.pdf', 'application/pdf', 633983, now()),
('generali-art83-la-retraite-94-article-83-134-notice_information-03-2007-8aa54da0', 'generali-art83-la-retraite-94-article-83-134', 'Notice d''information ART83- LA RETRAITE 94 - ARTICLE 83', 'notice_information', 'uploaded', NULL, '03/2007', 'generali/art83-la-retraite-94-article-83/03-2007.pdf', '03-2007.pdf', 'application/pdf', 838974, now()),
('generali-madelin-xaelidia-retraite-individuelle-152-notice_information-02-2007-e2370a5c', 'generali-madelin-xaelidia-retraite-individuelle-152', 'Notice d''information MADELIN- XAELIDIA RETRAITE INDIVIDUELLE', 'notice_information', 'uploaded', NULL, '02/2007', 'generali/madelin-xaelidia-retraite-individuelle/02-2007.pdf', '02-2007.pdf', 'application/pdf', 354391, now()),
('generali-madelin-xaelidia-retraite-individuelle-152-notice_information-2007-7cfd2d02', 'generali-madelin-xaelidia-retraite-individuelle-152', 'Notice d''information MADELIN- XAELIDIA RETRAITE INDIVIDUELLE', 'notice_information', 'uploaded', NULL, '2007', 'generali/madelin-xaelidia-retraite-individuelle/2007.pdf', '2007.pdf', 'application/pdf', 151972, now()),
('la-medicale-madelin-medicale-horizon-madelin-2-103-conditions_generales-2007-83d2cf60', 'la-medicale-madelin-medicale-horizon-madelin-2-103', 'Conditions générales MADELIN- MEDICALE HORIZON MADELIN 2', 'conditions_generales', 'uploaded', NULL, '2007', 'la-medicale/madelin-medicale-horizon-madelin-2/2007.pdf', '2007.pdf', 'application/pdf', 3512068, now()),
('la-medicale-madelin-medicale-horizon-madelin-105-conditions_generales-2007-cf061f02', 'la-medicale-madelin-medicale-horizon-madelin-105', 'Conditions générales MADELIN- MEDICALE HORIZON MADELIN', 'conditions_generales', 'uploaded', NULL, '2007', 'la-medicale/madelin-medicale-horizon-madelin/2007.pdf', '2007.pdf', 'application/pdf', 192568, now()),
('la-medicale-madelin-la-medicale-serenite-106-conditions_generales-2012-b063ea44', 'la-medicale-madelin-la-medicale-serenite-106', 'Conditions générales MADELIN- LA MEDICALE SERENITE', 'conditions_generales', 'uploaded', NULL, '2012', 'la-medicale/madelin-la-medicale-serenite/2012.pdf', '2012.pdf', 'application/pdf', 568944, now()),
('la-medicale-madelin-medicale-retraite-104-notice_information-01-2014-f38efd43', 'la-medicale-madelin-medicale-retraite-104', 'Notice d''information MADELIN- MEDICALE RETRAITE', 'notice_information', 'uploaded', NULL, '01/2014', 'la-medicale/madelin-medicale-retraite/01-2014.pdf', '01-2014.pdf', 'application/pdf', 1731840, now()),
('ag2r-la-mondiale-madelin-mondiale-retraite-professionnels-372-notice_information-09-2009-72460fa5', 'ag2r-la-mondiale-madelin-mondiale-retraite-professionnels-372', 'Notice d''information MADELIN- MONDIALE RETRAITE PROFESSIONNELS', 'notice_information', 'uploaded', NULL, '09/2009', 'ag2r-la-mondiale/madelin-mondiale-retraite-professionnels/09-2009.pdf', '09-2009.pdf', 'application/pdf', 563057, now()),
('maaf-madelin-winneo-pro-92-conditions_generales-2007-e6f597ca', 'maaf-madelin-winneo-pro-92', 'Conditions générales MADELIN- WINNEO PRO', 'conditions_generales', 'uploaded', NULL, '2007', 'maaf/madelin-winneo-pro/2007.pdf', '2007.pdf', 'application/pdf', 162296, now()),
('mutex-madelin-2003-promultis-retraite-madelin-cg-conditions_generales-2003-b8730cb3', 'mutex-madelin-2003-promultis-retraite-madelin-cg', 'Conditions générales 2003 Promultis retraite Madelin CG', 'conditions_generales', 'uploaded', NULL, '2003', 'mutex/2003-promultis-retraite-madelin-cg/2003.pdf', '2003.pdf', 'application/pdf', 798120, now()),
('prefon-perp-prefon-retraite-41-notice_information-12-2019-bc0def6c', 'prefon-perp-prefon-retraite-41', 'Notice d''information PERP- PREFON-RETRAITE', 'notice_information', 'uploaded', NULL, '12/2019', 'prefon/perp-prefon-retraite/12-2019.pdf', '12-2019.pdf', 'application/pdf', 258082, now()),
('malakoff-humanis-article83-2010-retraite-83-multisupport-quatrem-conditions_generales-2010-00eb12ae', 'malakoff-humanis-article83-2010-retraite-83-multisupport-quatrem', 'Conditions générales 2010 Retraite 83 Multisupport Quatrem', 'conditions_generales', 'uploaded', NULL, '2010', 'malakoff-humanis/2010-retraite-83-multisupport-quatrem/2010.pdf', '2010.pdf', 'application/pdf', 435341, now()),
('malakoff-humanis-article83-2010-retraite-83-quatrem-conditions_generales-2010-4e450ab7', 'malakoff-humanis-article83-2010-retraite-83-quatrem', 'Conditions générales 2010 Retraite 83 Quatrem', 'conditions_generales', 'uploaded', NULL, '2010', 'malakoff-humanis/2010-retraite-83-quatrem/2010.pdf', '2010.pdf', 'application/pdf', 410848, now()),
('societe-generale-perp-perp-epicea-27-notice_information-09-2011-3cdaf78a', 'societe-generale-perp-perp-epicea-27', 'Notice d''information PERP- PERP EPICEA', 'notice_information', 'uploaded', NULL, '09/2011', 'societe-generale/perp-perp-epicea/09-2011.pdf', '09-2011.pdf', 'application/pdf', 273540, now()),
('swisslife-art83-garantie-retraite-entreprises-12-conditions_generales-10-2008-d9f7e8ba', 'swisslife-art83-garantie-retraite-entreprises-12', 'Conditions générales ART83- GARANTIE RETRAITE ENTREPRISES', 'conditions_generales', 'uploaded', NULL, '10.2008', 'swisslife/art83-garantie-retraite-entreprises/10-2008.pdf', '10-2008.pdf', 'application/pdf', 183758, now()),
('swisslife-art83-swisslife-retraite-article-83-15-conditions_generales-03-2013-c6fc5d31', 'swisslife-art83-swisslife-retraite-article-83-15', 'Conditions générales ART83- SWISSLIFE RETRAITE ARTICLE 83', 'conditions_generales', 'uploaded', NULL, '03.2013', 'swisslife/art83-swisslife-retraite-article-83/03-2013.pdf', '03-2013.pdf', 'application/pdf', 430006, now()),
('swisslife-madelin-garantie-retraite-independants-18-notice_information-08-2005-49f2e378', 'swisslife-madelin-garantie-retraite-independants-18', 'Notice d''information MADELIN- GARANTIE RETRAITE INDEPENDANTS', 'notice_information', 'uploaded', NULL, '08.2005', 'swisslife/madelin-garantie-retraite-independants/08-2005.pdf', '08-2005.pdf', 'application/pdf', 196993, now()),
('swisslife-madelin-swisslife-retraite-selection-22-notice_information-06-2011-ef9accb0', 'swisslife-madelin-swisslife-retraite-selection-22', 'Notice d''information MADELIN- SWISSLIFE RETRAITE SELECTION', 'notice_information', 'uploaded', NULL, '06.2011', 'swisslife/madelin-swisslife-retraite-selection/06-2011.pdf', '06-2011.pdf', 'application/pdf', 406000, now()),
('swisslife-madelin-swisslife-retraite-madelin-21-notice_information-12-2018-0fad374d', 'swisslife-madelin-swisslife-retraite-madelin-21', 'Notice d''information MADELIN- SWISSLIFE RETRAITE MADELIN', 'notice_information', 'uploaded', NULL, '12.2018', 'swisslife/madelin-swisslife-retraite-madelin/12-2018.pdf', '12-2018.pdf', 'application/pdf', 335260, now()),
('swisslife-perin-swisslife-per-individuel-24-notice_information-09-2019-d9f90616', 'swisslife-perin-swisslife-per-individuel-24', 'Notice d''information PERIN- SWISSLIFE PER INDIVIDUEL', 'notice_information', 'uploaded', NULL, '09.2019', 'swisslife/perin-swisslife-per-individuel/09-2019.pdf', '09-2019.pdf', 'application/pdf', 2147792, now()),
('swisslife-perp-swisslife-perp-17-notice_information-12-2018-570a82c3', 'swisslife-perp-swisslife-perp-17', 'Notice d''information PERP- SWISSLIFE PERP', 'notice_information', 'uploaded', NULL, '12.2018', 'swisslife/perp-swisslife-perp/12-2018.pdf', '12-2018.pdf', 'application/pdf', 251771, now()),
('uff-madelin-uff-retraite-madelin-9-notice_information-2017-246932a4', 'uff-madelin-uff-retraite-madelin-9', 'Notice d''information MADELIN- UFF RETRAITE MADELIN', 'notice_information', 'uploaded', NULL, '2017', 'uff/madelin-uff-retraite-madelin/2017.pdf', '2017.pdf', 'application/pdf', 212621, now())
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

INSERT INTO public.base_cg_retraite_overrides (contract_id, contract_data, is_deleted, updated_at)
VALUES
('agipi-madelin-far-358', '{"id":"agipi-madelin-far-358","phaseLiquidation":{"tauxTechnique":"0 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('april-madelin-retraite-madelin-april-328', '{"id":"april-madelin-retraite-madelin-april-328","phaseEpargne":{"fraisVersements":0.05,"fraisGestion":0.01}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('abeille-madelin-norwich-strategie-retraite-loi-madelin-391', '{"id":"abeille-madelin-norwich-strategie-retraite-loi-madelin-391","phaseEpargne":{"fraisGestion":0.0095,"fraisArbitrage":"0.55 %"},"phaseLiquidation":{"tauxTechnique":"0 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('axa-art83-retraite-4-g-293', '{"id":"axa-art83-retraite-4-g-293","phaseEpargne":{"fraisGestion":0.0065}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('credit-agricole-madelin-accordance-238', '{"id":"credit-agricole-madelin-accordance-238","phaseEpargne":{"fraisVersements":0.0375,"fraisGestion":0.007,"fraisArbitrage":"0.5 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('ageas-perp-conditions-generales-forticiel', '{"id":"ageas-perp-conditions-generales-forticiel","sourceId":"Source PDF FORTICIEL - Conditions Générales FORTICIEL","compagnie":"AGEAS","nomContrat":"Conditions Générales FORTICIEL","typeContrat":"PERP","perCompartment":null,"phaseEpargne":{"dateCommercialisation":null,"nombreFonds":null,"repartitionUcEuro":null,"rendementFondsEuro":null,"fondsEuroGarantis":null,"fraisVersements":0.05,"fraisGestion":null,"fraisGestionFondsEuro":null,"fraisGestionUc":null,"fraisArbitrage":"0.50 %","fraisTransfertSortant":null,"fraisTransfertSortantRate":null,"clauseBeneficiaire":null,"garantiesComplementaires":null},"phaseLiquidation":{"ageLimiteLiquidation":null,"sortieCapitalRetraite":null,"fractionnementCapital":null,"rachatLibre":null,"tableConversionRente":null,"tableGarantieAdhesion":null,"tauxTechnique":null,"fraisArrerages":null,"fraisArreragesRate":null,"annuitesGaranties":null,"reversionPossible":null,"reversionIncluse":null,"renteEstimee":null},"documents":[],"pointsParams":null}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('gan-art83-dimension-retraite-energie-169', '{"id":"gan-art83-dimension-retraite-energie-169","phaseEpargne":{"fraisVersements":0.0495},"phaseLiquidation":{"tauxTechnique":"0 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('gan-perp-gan-retraite-garantie-180', '{"id":"gan-perp-gan-retraite-garantie-180","phaseEpargne":{"fraisVersements":0.03}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('generali-madelin-scenario-retraite-madelin-150', '{"id":"generali-madelin-scenario-retraite-madelin-150","phaseLiquidation":{"fraisArrerages":0.03,"fraisArreragesRate":0.03}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('generali-madelin-la-retraite-94-153', '{"id":"generali-madelin-la-retraite-94-153","phaseEpargne":{"fraisArbitrage":"0.3 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('ag2r-la-mondiale-madelin-mondiale-retraite-professionnels-372', '{"id":"ag2r-la-mondiale-madelin-mondiale-retraite-professionnels-372","phaseLiquidation":{"tauxTechnique":"2 %"}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('maaf-madelin-winneo-pro-92', '{"id":"maaf-madelin-winneo-pro-92","phaseEpargne":{"fraisVersements":0.03,"fraisGestion":0.007,"fraisTransfertSortant":"2 %","fraisTransfertSortantRate":0.02}}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('mutex-madelin-2003-promultis-retraite-madelin-cg', '{"id":"mutex-madelin-2003-promultis-retraite-madelin-cg","sourceId":"Source PDF MUTEX - 2003 Promultis retraite Madelin CG","compagnie":"MUTEX","nomContrat":"2003 Promultis retraite Madelin CG","typeContrat":"MADELIN","perCompartment":null,"phaseEpargne":{"dateCommercialisation":null,"nombreFonds":null,"repartitionUcEuro":null,"rendementFondsEuro":null,"fondsEuroGarantis":null,"fraisVersements":null,"fraisGestion":null,"fraisGestionFondsEuro":null,"fraisGestionUc":null,"fraisArbitrage":null,"fraisTransfertSortant":null,"fraisTransfertSortantRate":null,"clauseBeneficiaire":null,"garantiesComplementaires":null},"phaseLiquidation":{"ageLimiteLiquidation":null,"sortieCapitalRetraite":null,"fractionnementCapital":null,"rachatLibre":null,"tableConversionRente":null,"tableGarantieAdhesion":null,"tauxTechnique":null,"fraisArrerages":null,"fraisArreragesRate":null,"annuitesGaranties":null,"reversionPossible":null,"reversionIncluse":null,"renteEstimee":null},"documents":[],"pointsParams":null}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('malakoff-humanis-article83-2010-retraite-83-multisupport-quatrem', '{"id":"malakoff-humanis-article83-2010-retraite-83-multisupport-quatrem","sourceId":"Source PDF QUATREM - 2010 Retraite 83 Multisupport Quatrem","compagnie":"MALAKOFF_HUMANIS","nomContrat":"2010 Retraite 83 Multisupport Quatrem","typeContrat":"ARTICLE83","perCompartment":null,"phaseEpargne":{"dateCommercialisation":null,"nombreFonds":null,"repartitionUcEuro":null,"rendementFondsEuro":null,"fondsEuroGarantis":null,"fraisVersements":null,"fraisGestion":null,"fraisGestionFondsEuro":null,"fraisGestionUc":null,"fraisArbitrage":"1 %","fraisTransfertSortant":"1 %","fraisTransfertSortantRate":0.01,"clauseBeneficiaire":null,"garantiesComplementaires":null},"phaseLiquidation":{"ageLimiteLiquidation":null,"sortieCapitalRetraite":null,"fractionnementCapital":null,"rachatLibre":null,"tableConversionRente":null,"tableGarantieAdhesion":null,"tauxTechnique":null,"fraisArrerages":0.03,"fraisArreragesRate":0.03,"annuitesGaranties":null,"reversionPossible":null,"reversionIncluse":null,"renteEstimee":null},"documents":[],"pointsParams":null}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00'),
('malakoff-humanis-article83-2010-retraite-83-quatrem', '{"id":"malakoff-humanis-article83-2010-retraite-83-quatrem","sourceId":"Source PDF QUATREM - 2010 Retraite 83 Quatrem","compagnie":"MALAKOFF_HUMANIS","nomContrat":"2010 Retraite 83 Quatrem","typeContrat":"ARTICLE83","perCompartment":null,"phaseEpargne":{"dateCommercialisation":null,"nombreFonds":null,"repartitionUcEuro":null,"rendementFondsEuro":null,"fondsEuroGarantis":null,"fraisVersements":null,"fraisGestion":0.006,"fraisGestionFondsEuro":null,"fraisGestionUc":null,"fraisArbitrage":null,"fraisTransfertSortant":"1 %","fraisTransfertSortantRate":0.01,"clauseBeneficiaire":null,"garantiesComplementaires":null},"phaseLiquidation":{"ageLimiteLiquidation":null,"sortieCapitalRetraite":null,"fractionnementCapital":null,"rachatLibre":null,"tableConversionRente":null,"tableGarantieAdhesion":null,"tauxTechnique":null,"fraisArrerages":0.03,"fraisArreragesRate":0.03,"annuitesGaranties":null,"reversionPossible":null,"reversionIncluse":null,"renteEstimee":null},"documents":[],"pointsParams":null}'::jsonb, false, '2026-05-20T18:45:13.181227+00:00')
ON CONFLICT (contract_id) DO UPDATE SET
  contract_data = pg_temp.base_cg_retraite_fill_missing(
    public.base_cg_retraite_overrides.contract_data,
    excluded.contract_data
  ),
  is_deleted = false,
  updated_at = now()
WHERE public.base_cg_retraite_overrides.is_deleted IS DISTINCT FROM true;
