-- Corrige le chaînage Settings des sources prévoyance.
-- Pré-rollback local : .cache/prevoyance-sources-before-settings-chain.json
-- Application attendue après relecture : supabase db push.

WITH lignes_a_purger AS (
  SELECT code
  FROM public.prevoyance_regime_settings regime
  WHERE year = 2026
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(COALESCE(regime.sources -> 'references', '[]'::jsonb)) AS ref
      WHERE ref ->> 'titre' = 'Référentiel prévoyance 2026 publié par organisme officiel'
        OR ref ->> 'url' ILIKE '%/actus/%'
        OR ref ->> 'url' ILIKE '%/actualites/%'
        OR ref ->> 'url' ILIKE '%/news/%'
        OR ref ->> 'url' ILIKE '%/blog/%'
        OR ref ->> 'url' ILIKE '%F3053%'
        OR COALESCE(ref -> 'valeursCouvertes', '[]'::jsonb)
          ?& ARRAY['arret', 'invalidite', 'deces', 'cotisations']
    )
)
UPDATE public.prevoyance_regime_settings regime
SET sources = jsonb_build_object(
  'references', jsonb_build_array(),
  'noRefReason',
  format(
    'Ancienne source placeholder retirée : aucune source institutionnelle stable et pertinente n''a été validée pour %s (%s, caisse %s) par catégorie ; sourcing prévoyance à relire avant attestation.',
    regime.label,
    regime.code,
    regime.caisse
  ),
  'noteAdmin',
  'Migration 20260606000100 : faux titres génériques, F3053 de repli, URLs d''actualité et couvertures quatre catégories retirés. Restaurer depuis .cache/prevoyance-sources-before-settings-chain.json si rollback relu.'
)
FROM lignes_a_purger
WHERE regime.code = lignes_a_purger.code;

UPDATE public.prevoyance_maintien_employeur_settings
SET sources = jsonb_build_object(
  'references',
  jsonb_build_array(
    jsonb_build_object(
      'organisme', 'Légifrance',
      'titre', 'Code du travail — indemnité complémentaire maladie',
      'url', 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000018537770',
      'dateConsultation', '2026-06-06',
      'rubrique', 'Absences pour maladie ou accident',
      'articleCode', 'D1226-1',
      'valeursCouvertes', jsonb_build_array('maintien_employeur'),
      'confiance', 'haute',
      'relevanceNote',
      'L''article D1226-1 du Code du travail fonde les deux périodes de maintien employeur affichées dans le barème légal.',
      'verifiedAt', '2026-06-06'
    )
  ),
  'noteAdmin',
  'Source légale stable remplacée par migration 20260606000100 ; relire L1226-1 et D1226-1 lors du scénario annuel.'
)
WHERE code = 'code-travail-minimum-legal';
