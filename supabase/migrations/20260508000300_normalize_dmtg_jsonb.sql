-- Migration : stabilisation JSONB DMTG dans tax_settings.
--
-- Objectif : convertir les anciens blobs `{ abattementLigneDirecte, scale }`
-- vers le format canonique `{ ligneDirecte, frereSoeur, neveuNiece, autre }`.
-- Les valeurs de repli ci-dessous sont la photographie des defaults applicatifs
-- au moment de la migration ; les écritures futures sont validées côté Zod.

WITH defaults AS (
  SELECT
    '{
      "abattement": 100000,
      "scale": [
        { "from": 0, "to": 8072, "rate": 5 },
        { "from": 8072, "to": 12109, "rate": 10 },
        { "from": 12109, "to": 15932, "rate": 15 },
        { "from": 15932, "to": 552324, "rate": 20 },
        { "from": 552324, "to": 902838, "rate": 30 },
        { "from": 902838, "to": 1805677, "rate": 40 },
        { "from": 1805677, "to": null, "rate": 45 }
      ]
    }'::jsonb AS ligne_directe,
    '{
      "abattement": 15932,
      "scale": [
        { "from": 0, "to": 24430, "rate": 35 },
        { "from": 24430, "to": null, "rate": 45 }
      ]
    }'::jsonb AS frere_soeur,
    '{
      "abattement": 7967,
      "scale": [
        { "from": 0, "to": null, "rate": 55 }
      ]
    }'::jsonb AS neveu_niece,
    '{
      "abattement": 1594,
      "scale": [
        { "from": 0, "to": null, "rate": 60 }
      ]
    }'::jsonb AS autre
),
candidates AS (
  SELECT
    tax_settings.id,
    tax_settings.data,
    tax_settings.data->'dmtg' AS dmtg,
    defaults.ligne_directe,
    defaults.frere_soeur,
    defaults.neveu_niece,
    defaults.autre
  FROM public.tax_settings
  CROSS JOIN defaults
  WHERE tax_settings.data ? 'dmtg'
    AND jsonb_typeof(tax_settings.data->'dmtg') = 'object'
),
normalized AS (
  SELECT
    id,
    data,
    jsonb_build_object(
      'ligneDirecte',
      jsonb_build_object(
        'abattement',
        COALESCE(
          data #> '{dmtg,ligneDirecte,abattement}',
          data #> '{dmtg,abattementLigneDirecte}',
          ligne_directe->'abattement'
        ),
        'scale',
        COALESCE(
          data #> '{dmtg,ligneDirecte,scale}',
          data #> '{dmtg,scale}',
          ligne_directe->'scale'
        )
      ),
      'frereSoeur',
      jsonb_build_object(
        'abattement', COALESCE(data #> '{dmtg,frereSoeur,abattement}', frere_soeur->'abattement'),
        'scale', COALESCE(data #> '{dmtg,frereSoeur,scale}', frere_soeur->'scale')
      ),
      'neveuNiece',
      jsonb_build_object(
        'abattement', COALESCE(data #> '{dmtg,neveuNiece,abattement}', neveu_niece->'abattement'),
        'scale', COALESCE(data #> '{dmtg,neveuNiece,scale}', neveu_niece->'scale')
      ),
      'autre',
      jsonb_build_object(
        'abattement', COALESCE(data #> '{dmtg,autre,abattement}', autre->'abattement'),
        'scale', COALESCE(data #> '{dmtg,autre,scale}', autre->'scale')
      )
    ) AS canonical_dmtg
  FROM candidates
  WHERE dmtg ? 'abattementLigneDirecte'
    OR dmtg ? 'scale'
    OR data #> '{dmtg,ligneDirecte,abattement}' IS NULL
    OR data #> '{dmtg,ligneDirecte,scale}' IS NULL
    OR data #> '{dmtg,frereSoeur,abattement}' IS NULL
    OR data #> '{dmtg,frereSoeur,scale}' IS NULL
    OR data #> '{dmtg,neveuNiece,abattement}' IS NULL
    OR data #> '{dmtg,neveuNiece,scale}' IS NULL
    OR data #> '{dmtg,autre,abattement}' IS NULL
    OR data #> '{dmtg,autre,scale}' IS NULL
)
UPDATE public.tax_settings AS target
SET data = jsonb_set(
  normalized.data,
  '{dmtg}',
  normalized.canonical_dmtg - 'abattementLigneDirecte' - 'scale',
  true
)
FROM normalized
WHERE target.id = normalized.id;

-- Rollback : restaurer le snapshot pré-migration si disponible. À défaut,
-- reconstituer les anciennes clés depuis `data #> '{dmtg,ligneDirecte}'` :
-- abattementLigneDirecte = ligneDirecte.abattement, scale = ligneDirecte.scale.
