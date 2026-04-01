-- PS patrimoine 2026:
-- - split cas general / exceptions
-- - aligne les labels de fallback
-- - ajoute le PASS 2026
-- - retire la duplication PFU sociale de tax_settings

INSERT INTO public.ps_settings (id, data)
VALUES (
  1,
  jsonb_build_object(
    'labels', jsonb_build_object(
      'currentYearLabel', '2026 (RFR 2024 & Avis IR 2025)',
      'previousYearLabel', '2025 (RFR 2023 & Avis IR 2024)'
    ),
    'patrimony', jsonb_build_object(
      'current', jsonb_build_object(
        'generalRate', 18.6,
        'exceptionRate', 17.2,
        'csgDeductibleRate', 6.8
      ),
      'previous', jsonb_build_object(
        'generalRate', 17.2,
        'exceptionRate', 17.2,
        'csgDeductibleRate', 6.8
      )
    )
  )
)
ON CONFLICT (id) DO UPDATE
SET data = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(public.ps_settings.data, '{}'::jsonb),
      '{labels,currentYearLabel}',
      to_jsonb('2026 (RFR 2024 & Avis IR 2025)'::text),
      true
    ),
    '{labels,previousYearLabel}',
    to_jsonb('2025 (RFR 2023 & Avis IR 2024)'::text),
    true
  ),
  '{patrimony}',
  jsonb_build_object(
    'current', jsonb_build_object(
      'generalRate', 18.6,
      'exceptionRate', 17.2,
      'csgDeductibleRate', 6.8
    ),
    'previous', jsonb_build_object(
      'generalRate', 17.2,
      'exceptionRate', 17.2,
      'csgDeductibleRate', 6.8
    )
  ),
  true
);

INSERT INTO public.tax_settings (id, data)
VALUES (
  1,
  jsonb_build_object(
    'pfu', jsonb_build_object(
      'current', jsonb_build_object('rateIR', 12.8),
      'previous', jsonb_build_object('rateIR', 12.8)
    )
  )
)
ON CONFLICT (id) DO UPDATE
SET data = jsonb_set(
  COALESCE(public.tax_settings.data, '{}'::jsonb),
  '{pfu}',
  jsonb_build_object(
    'current', jsonb_build_object(
      'rateIR',
      COALESCE((public.tax_settings.data #>> '{pfu,current,rateIR}')::numeric, 12.8)
    ),
    'previous', jsonb_build_object(
      'rateIR',
      COALESCE((public.tax_settings.data #>> '{pfu,previous,rateIR}')::numeric, 12.8)
    )
  ),
  true
);

INSERT INTO public.pass_history (year, pass_amount)
VALUES (2026, 48060)
ON CONFLICT (year) DO UPDATE
SET pass_amount = EXCLUDED.pass_amount;
