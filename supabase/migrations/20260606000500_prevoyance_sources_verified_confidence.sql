-- Décision métier 2026-06-06 : les pages officielles des caisses et organismes
-- institutionnels prévoyance sont la meilleure référence disponible ; elles sont
-- donc marquées comme vérifiées dans les sources administrables.

WITH rewritten AS (
  SELECT
    code,
    jsonb_set(
      sources,
      '{references}',
      (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_set(reference, '{confiance}', to_jsonb('haute'::text), true)
            ORDER BY ordinal
          ),
          '[]'::jsonb
        )
        FROM jsonb_array_elements(COALESCE(sources->'references', '[]'::jsonb))
          WITH ORDINALITY AS refs(reference, ordinal)
      ),
      true
    ) AS next_sources
  FROM prevoyance_regime_settings
  WHERE jsonb_typeof(sources->'references') = 'array'
)
UPDATE prevoyance_regime_settings AS target
SET sources = rewritten.next_sources
FROM rewritten
WHERE target.code = rewritten.code
  AND target.sources IS DISTINCT FROM rewritten.next_sources;

WITH rewritten AS (
  SELECT
    code,
    jsonb_set(
      sources,
      '{references}',
      (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_set(reference, '{confiance}', to_jsonb('haute'::text), true)
            ORDER BY ordinal
          ),
          '[]'::jsonb
        )
        FROM jsonb_array_elements(COALESCE(sources->'references', '[]'::jsonb))
          WITH ORDINALITY AS refs(reference, ordinal)
      ),
      true
    ) AS next_sources
  FROM prevoyance_maintien_employeur_settings
  WHERE jsonb_typeof(sources->'references') = 'array'
)
UPDATE prevoyance_maintien_employeur_settings AS target
SET sources = rewritten.next_sources
FROM rewritten
WHERE target.code = rewritten.code
  AND target.sources IS DISTINCT FROM rewritten.next_sources;
