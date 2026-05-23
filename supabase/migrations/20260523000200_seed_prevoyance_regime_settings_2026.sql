-- Seed 2026 : régimes obligatoires de prévoyance.
-- Les montants RO précis doivent rester validés métier depuis le Mémento avant usage conseil.

WITH regimes (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  pdf_pages,
  arret_label,
  invalidite_label,
  deces_label,
  cotisations_label
) AS (
  VALUES
    (
      'salarie-cpam',
      'Salarié secteur privé — CPAM',
      'CPAM',
      'salarie',
      'collectif',
      ARRAY[115]::integer[],
      'IJSS maladie, accident et hospitalisation selon salaire plafonné.',
      'Pension invalidité sécurité sociale par catégorie.',
      'Capital décès du régime général.',
      'Financement inclus dans les cotisations sociales employeur/salarié.'
    ),
    (
      'salarie-msa',
      'Salarié agricole — MSA',
      'MSA salariés',
      'salarie',
      'collectif',
      ARRAY[115]::integer[],
      'IJSS MSA salarié selon salaire plafonné.',
      'Pension invalidité MSA salarié par catégorie.',
      'Capital décès du régime salarié agricole.',
      'Financement inclus dans les cotisations sociales employeur/salarié.'
    ),
    (
      'ssi-artisan-commercant',
      'Artisan / commerçant — SSI',
      'SSI',
      'tns',
      'individuel',
      ARRAY[13, 14, 15]::integer[],
      'Indemnités journalières SSI selon revenu professionnel moyen.',
      'Invalidité partielle ou totale selon revenu et catégorie SSI.',
      'Capital décès SSI, avec majorations éventuelles.',
      'Cotisation obligatoire incluse dans le bloc maladie-maternité-invalidité-décès.'
    ),
    (
      'cnavpl',
      'Profession libérale — CNAVPL socle',
      'CNAVPL',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'Indemnités journalières CNAVPL communes, sauf régimes spécifiques.',
      'Invalidité à vérifier dans la section de caisse professionnelle.',
      'Décès à vérifier dans la section de caisse professionnelle.',
      'Cotisation invalidité-décès gérée par la caisse professionnelle.'
    ),
    (
      'cipav',
      'Profession réglementée — CIPAV',
      'CIPAV',
      'liberal',
      'individuel',
      ARRAY[122, 123]::integer[],
      'IJ CNAVPL / CIPAV selon classe et revenu.',
      'Rente invalidité CIPAV selon classe retenue.',
      'Capital décès CIPAV selon classe retenue.',
      'Cotisation invalidité-décès CIPAV par classe.'
    ),
    (
      'carmf',
      'Médecin — CARMF',
      'CARMF',
      'liberal',
      'individuel',
      ARRAY[128, 129]::integer[],
      'Indemnités journalières CARMF après franchise statutaire.',
      'Invalidité CARMF selon classe et situation familiale.',
      'Capital décès et rentes CARMF selon situation familiale.',
      'Cotisation invalidité-décès CARMF.'
    ),
    (
      'carcdsf',
      'Chirurgien-dentiste / sage-femme — CARCDSF',
      'CARCDSF',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CARCDSF selon règlement de caisse.',
      'Invalidité CARCDSF selon statut et classe.',
      'Décès CARCDSF selon statut et bénéficiaires.',
      'Cotisation invalidité-décès CARCDSF.'
    ),
    (
      'cavp',
      'Pharmacien — CAVP',
      'CAVP',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CAVP selon règlement de caisse.',
      'Invalidité CAVP selon classe et revenu.',
      'Décès CAVP selon classe et situation familiale.',
      'Cotisation invalidité-décès CAVP.'
    ),
    (
      'carpimko',
      'Auxiliaire médical — CARPIMKO',
      'CARPIMKO',
      'liberal',
      'individuel',
      ARRAY[125, 126]::integer[],
      'IJ CARPIMKO selon franchise et statut conventionné.',
      'Invalidité CARPIMKO selon degré et situation familiale.',
      'Capital décès et rentes CARPIMKO selon bénéficiaires.',
      'Cotisation invalidité-décès CARPIMKO.'
    ),
    (
      'carpv',
      'Vétérinaire — CARPV',
      'CARPV',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CARPV selon règlement de caisse.',
      'Invalidité CARPV selon classe retenue.',
      'Décès CARPV selon classe retenue.',
      'Cotisation invalidité-décès CARPV.'
    ),
    (
      'cavec',
      'Expert-comptable — CAVEC',
      'CAVEC',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CAVEC selon règlement de caisse.',
      'Invalidité CAVEC selon classe retenue.',
      'Décès CAVEC selon classe retenue.',
      'Cotisation invalidité-décès CAVEC.'
    ),
    (
      'cavamac',
      'Agent général d’assurance — CAVAMAC',
      'CAVAMAC',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CAVAMAC selon règlement de caisse.',
      'Invalidité CAVAMAC selon classe retenue.',
      'Décès CAVAMAC selon classe retenue.',
      'Cotisation invalidité-décès CAVAMAC.'
    ),
    (
      'cavom',
      'Officier ministériel — CAVOM',
      'CAVOM',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CAVOM selon règlement de caisse.',
      'Invalidité CAVOM selon classe retenue.',
      'Décès CAVOM selon classe retenue.',
      'Cotisation invalidité-décès CAVOM.'
    ),
    (
      'cprn',
      'Notaire — CPRN',
      'CPRN',
      'liberal',
      'individuel',
      ARRAY[108]::integer[],
      'IJ CPRN selon règlement de caisse.',
      'Invalidité CPRN selon classe retenue.',
      'Décès CPRN selon classe retenue.',
      'Cotisation invalidité-décès CPRN.'
    ),
    (
      'cnbf',
      'Avocat — CNBF',
      'CNBF',
      'avocat',
      'individuel',
      ARRAY[92, 93, 95, 96]::integer[],
      'IJ et prestations CNBF selon règlement avocat.',
      'Invalidité CNBF selon taux et classe.',
      'Capital décès et rentes CNBF selon bénéficiaires.',
      'Cotisation invalidité-décès CNBF.'
    ),
    (
      'msa-exploitant',
      'Exploitant agricole — MSA',
      'MSA exploitants',
      'exploitant_agricole',
      'individuel',
      ARRAY[98, 99, 102]::integer[],
      'IJ Amexa / MSA exploitant selon assiette agricole.',
      'Invalidité MSA exploitant selon degré reconnu.',
      'Décès MSA exploitant selon règlement agricole.',
      'Cotisation obligatoire exploitant agricole.'
    )
)
INSERT INTO public.prevoyance_regime_settings (
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  year,
  data,
  sources
)
SELECT
  code,
  label,
  caisse,
  population,
  default_contract_kind,
  2026,
  jsonb_build_object(
    'arret',
    jsonb_build_object(
      'carences',
      jsonb_build_object(
        'maladie', CASE WHEN default_contract_kind = 'collectif' THEN 3 ELSE 7 END,
        'accident', 0,
        'hospitalisation', 0
      ),
      'maxDurationDays', 1095,
      'paliers',
      jsonb_build_array(
        jsonb_build_object(
          'fromDay', CASE WHEN default_contract_kind = 'collectif' THEN 4 ELSE 8 END,
          'toDay', 1095,
          'label', arret_label,
          'amount', jsonb_build_object(
            'mode', 'formula',
            'value', NULL,
            'label', arret_label,
            'unit', 'jour'
          )
        )
      ),
      'notes',
      jsonb_build_array('À contrôler contre la fiche Mémento 2026 de la caisse avant diffusion.')
    ),
    'invalidite',
    jsonb_build_object(
      'paliers',
      jsonb_build_array(
        jsonb_build_object(
          'fromRate', 0,
          'toRate', 32,
          'label', 'Aucune invalidité RO servie sous le seuil statutaire.',
          'amount', jsonb_build_object('mode', 'fixed_eur_month', 'value', 0, 'label', 'Non déclenché')
        ),
        jsonb_build_object(
          'fromRate', 33,
          'toRate', 65,
          'label', invalidite_label,
          'amount', jsonb_build_object('mode', 'formula', 'value', NULL, 'label', invalidite_label)
        ),
        jsonb_build_object(
          'fromRate', 66,
          'toRate', NULL,
          'label', invalidite_label,
          'amount', jsonb_build_object('mode', 'formula', 'value', NULL, 'label', invalidite_label)
        )
      ),
      'notes',
      jsonb_build_array('Seuils indicatifs de présentation : vérifier la catégorie exacte par régime.')
    ),
    'deces',
    jsonb_build_object(
      'capital',
      jsonb_build_object('mode', 'formula', 'value', NULL, 'label', deces_label),
      'doublementAccident', false,
      'doubleEffet', false,
      'renteConjoint',
      CASE
        WHEN default_contract_kind = 'collectif' THEN NULL
        ELSE jsonb_build_object('mode', 'formula', 'value', NULL, 'label', 'Rente conjoint éventuelle selon caisse')
      END,
      'renteEducation',
      CASE
        WHEN default_contract_kind = 'collectif' THEN NULL
        ELSE jsonb_build_object('mode', 'formula', 'value', NULL, 'label', 'Rente éducation éventuelle selon caisse')
      END,
      'notes',
      jsonb_build_array('Capital et rentes à double valider par fiche régime.')
    ),
    'cotisations',
    jsonb_build_object(
      'mode', CASE WHEN default_contract_kind = 'collectif' THEN 'none' ELSE 'formula' END,
      'value', NULL,
      'assiette', CASE WHEN default_contract_kind = 'collectif' THEN 'TA-TB' ELSE NULL END,
      'repartition',
      CASE
        WHEN default_contract_kind = 'collectif'
          THEN jsonb_build_object('employeur', 0, 'salarie', 0)
        ELSE NULL
      END,
      'madelinEligible', default_contract_kind = 'individuel',
      'notes',
      jsonb_build_array(cotisations_label)
    )
  ),
  jsonb_build_object(
    'fiche', 'Mémento 2026',
    'pagesPdf', to_jsonb(pdf_pages),
    'noteValidation', 'Seed préparatoire : extraction à relire et valider manuellement avant usage métier.'
  )
FROM regimes
ON CONFLICT (code) DO UPDATE SET
  label = excluded.label,
  caisse = excluded.caisse,
  population = excluded.population,
  default_contract_kind = excluded.default_contract_kind,
  year = excluded.year,
  data = excluded.data,
  sources = excluded.sources;

INSERT INTO public.prevoyance_maintien_employeur_settings (
  code,
  label,
  year,
  data,
  sources
)
VALUES (
  'code-travail-minimum-legal',
  'Code du travail — maintien employeur minimum légal',
  2026,
  jsonb_build_object(
    'maintienEmployeur',
    jsonb_build_object(
      'carenceDays', 7,
      'minAncienneteYears', 1,
      'paliers',
      jsonb_build_array(
        jsonb_build_object(
          'fromAncienneteYears', 1,
          'toAncienneteYears', 5,
          'firstPeriodDays', 30,
          'firstPeriodRate', 90,
          'secondPeriodDays', 30,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 6,
          'toAncienneteYears', 10,
          'firstPeriodDays', 40,
          'firstPeriodRate', 90,
          'secondPeriodDays', 40,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 11,
          'toAncienneteYears', 15,
          'firstPeriodDays', 50,
          'firstPeriodRate', 90,
          'secondPeriodDays', 50,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 16,
          'toAncienneteYears', 20,
          'firstPeriodDays', 60,
          'firstPeriodRate', 90,
          'secondPeriodDays', 60,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 21,
          'toAncienneteYears', 25,
          'firstPeriodDays', 70,
          'firstPeriodRate', 90,
          'secondPeriodDays', 70,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 26,
          'toAncienneteYears', 30,
          'firstPeriodDays', 80,
          'firstPeriodRate', 90,
          'secondPeriodDays', 80,
          'secondPeriodRate', 66.67
        ),
        jsonb_build_object(
          'fromAncienneteYears', 31,
          'toAncienneteYears', NULL,
          'firstPeriodDays', 90,
          'firstPeriodRate', 90,
          'secondPeriodDays', 90,
          'secondPeriodRate', 66.67
        )
      ),
      'notes',
      jsonb_build_array('V1 : plancher légal uniquement, conventions collectives améliorantes hors périmètre.')
    )
  ),
  jsonb_build_object(
    'fiche', 'Code du travail',
    'pagesPdf', jsonb_build_array(),
    'noteValidation', 'Barème légal de mensualisation à relire avant livraison métier.'
  )
)
ON CONFLICT (code) DO UPDATE SET
  label = excluded.label,
  year = excluded.year,
  data = excluded.data,
  sources = excluded.sources;
