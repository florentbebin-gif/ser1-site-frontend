-- Corrections 2026 Prévoyance : données explicites, sources structurées et maintien employeur.
-- Idempotent pour les bases locales ayant déjà appliqué les seeds initiaux.

UPDATE public.prevoyance_regime_settings
SET sources = jsonb_build_object(
  'references',
  jsonb_build_array(
    jsonb_build_object(
      'organisme', caisse,
      'titre', 'Référentiel prévoyance 2026 publié par organisme officiel',
      'url',
      CASE code
        WHEN 'salarie-cpam' THEN 'https://www.ameli.fr/assure/remboursements/pensions-allocations-rentes/invalidite'
        WHEN 'salarie-msa' THEN 'https://www.msa.fr/lfp/sante/arret-maladie'
        WHEN 'ssi-artisan-commercant' THEN 'https://www.ameli.fr/assure/remboursements/indemnites-journalieres/arret-maladie-independants'
        WHEN 'carpimko' THEN 'https://www.carpimko.com/je-minstalle/mes-droits/mes-garanties-invalidite-deces'
        WHEN 'cavamac' THEN 'https://www.cavamac.fr/actus/un-regime-invalidite-deces-renforce/'
        WHEN 'msa-exploitant' THEN 'https://www.msa.fr/lfp/sante/ij-amexa'
        ELSE 'https://www.service-public.fr/particuliers/vosdroits/F3053'
      END,
      'dateConsultation', '2026-05-24',
      'valeursCouvertes', jsonb_build_array('arret', 'invalidite', 'deces', 'cotisations'),
      'confiance',
      CASE
        WHEN code IN ('salarie-cpam', 'ssi-artisan-commercant', 'carpimko', 'cavamac', 'msa-exploitant') THEN 'haute'
        ELSE 'moyenne'
      END,
      'noteAdmin', 'Source structurée ajoutée par migration corrective ; compléter avec la rubrique exacte lors de la prochaine revue métier.'
    )
  )
)
WHERE sources ? 'fiche'
  OR NOT sources ? 'references';

UPDATE public.prevoyance_maintien_employeur_settings
SET sources = jsonb_build_object(
  'references',
  jsonb_build_array(
    jsonb_build_object(
      'organisme', 'Service-Public.fr',
      'titre', 'Arrêt maladie salarié : maintien employeur',
      'url', 'https://www.service-public.fr/particuliers/vosdroits/F3053',
      'dateConsultation', '2026-05-24',
      'rubrique', 'Maintien du salaire par l''employeur',
      'articleCode', 'Code du travail',
      'valeursCouvertes', jsonb_build_array('maintien_employeur'),
      'confiance', 'haute'
    )
  ),
  'noteAdmin', 'Barème légal de mensualisation à relire avant livraison métier.'
)
WHERE sources ? 'fiche'
  OR NOT sources ? 'references';

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  data,
  '{invalidite,paliers,2,amount,label}',
  to_jsonb('Cat 3 : 19 641 € min / 39 611,28 € max 2026'::text)
)
WHERE code IN ('salarie-cpam', 'salarie-msa');

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          data,
          '{arret,paliers,0,amount,value}',
          to_jsonb(65.84::numeric)
        ),
        '{arret,paliers,0,amount,label}',
        to_jsonb('Max 65,84 €/j 2026 - Min 26,33 €/j (cotisation min)'::text)
      ),
      '{invalidite,paliers,0,amount,label}',
      to_jsonb('6 362,52 € min / 14 418 € max 2026'::text)
    ),
    '{invalidite,paliers,1,amount,label}',
    to_jsonb('8 964 € min / 24 030 € max 2026'::text)
  ),
  '{invalidite,paliers,2,amount,label}',
  to_jsonb('24 545,28 € min / 39 611,28 € max 2026'::text)
)
WHERE code = 'ssi-artisan-commercant';

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        data,
        '{invalidite,paliers,0,amount,label}',
        to_jsonb('10 080 €/an 2026 - moitié de l''invalidité totale'::text)
      ),
      '{deces,capital,label}',
      to_jsonb('36 288 € conjoint sans enfants / 54 432 € avec enfants / 18 144 € enfants ou ascendants 2026'::text)
    ),
    '{deces,renteConjoint,label}',
    to_jsonb('10 080 €/an 2026 - jusqu''à 65 ans conjoint, suspendu si remariage'::text)
  ),
  '{deces,renteEducation,label}',
  to_jsonb('7 560 €/an 2026 - jusqu''à 18 ans, 25 si études'::text)
)
WHERE code = 'carpimko';

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  data,
  '{deces,notes}',
  jsonb_build_array('Montants confirmés 2026 par les pages garanties CARPIMKO.')
)
WHERE code = 'carpimko';

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        data,
        '{invalidite,notes}',
        jsonb_build_array('Cessation d''activité obligatoire.')
      ),
      '{deces,capital,label}',
      to_jsonb('50% commissions brutes avec plancher 60 000 points (doublé si accident)'::text)
    ),
    '{cotisations,value}',
    to_jsonb(0.45::numeric)
  ),
  '{cotisations,notes}',
  jsonb_build_array(
    '0,45% des commissions et rémunérations brutes plafonnées N-1.',
    '1ère année : cotisation appelée sur assiette forfaitaire en % du PASS.'
  )
)
WHERE code = 'cavamac';

UPDATE public.prevoyance_regime_settings
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        data,
        '{arret,paliers,0,amount,value}',
        to_jsonb(25.79::numeric)
      ),
      '{arret,paliers,0,amount,label}',
      to_jsonb('25,79 €/j 2026'::text)
    ),
    '{arret,paliers,1,amount,value}',
    to_jsonb(34.38::numeric)
  ),
  '{arret,paliers,1,amount,label}',
  to_jsonb('34,38 €/j 2026'::text)
)
WHERE code = 'msa-exploitant';
