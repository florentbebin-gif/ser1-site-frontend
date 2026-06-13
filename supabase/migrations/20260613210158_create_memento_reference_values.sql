-- Valeurs de référence du mémento patrimonial.
-- Lecture pour tous les utilisateurs authentifiés, édition réservée aux admins.

CREATE TABLE IF NOT EXISTS public.memento_reference_values (
  key text PRIMARY KEY,
  domain text NOT NULL,
  subdomain text NOT NULL,
  label text NOT NULL,
  value_numeric numeric NULL,
  value_text text NULL,
  unit text NULL,
  year integer NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ref_ids text[] NOT NULL DEFAULT '{}'::text[],
  display_order integer NOT NULL DEFAULT 0,
  note text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memento_reference_values_value_chk CHECK (
    value_numeric IS NOT NULL
    OR value_text IS NOT NULL
  ),
  CONSTRAINT memento_reference_values_year_chk CHECK (year BETWEEN 1900 AND 2200),
  CONSTRAINT memento_reference_values_order_chk CHECK (display_order >= 0)
);

CREATE OR REPLACE FUNCTION public.set_updated_at_memento_reference_values()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memento_reference_values_updated_at
ON public.memento_reference_values;

CREATE TRIGGER trg_memento_reference_values_updated_at
  BEFORE UPDATE ON public.memento_reference_values
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_memento_reference_values();

ALTER TABLE public.memento_reference_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memento_reference_values_select_auth"
ON public.memento_reference_values;

CREATE POLICY "memento_reference_values_select_auth"
  ON public.memento_reference_values
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "memento_reference_values_insert_admin"
ON public.memento_reference_values;

CREATE POLICY "memento_reference_values_insert_admin"
  ON public.memento_reference_values
  FOR INSERT
  TO authenticated
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "memento_reference_values_update_admin"
ON public.memento_reference_values;

CREATE POLICY "memento_reference_values_update_admin"
  ON public.memento_reference_values
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "memento_reference_values_delete_admin"
ON public.memento_reference_values;

CREATE POLICY "memento_reference_values_delete_admin"
  ON public.memento_reference_values
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

REVOKE ALL ON public.memento_reference_values FROM anon;
GRANT SELECT ON public.memento_reference_values TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.memento_reference_values TO authenticated;
GRANT ALL ON public.memento_reference_values TO service_role;

INSERT INTO public.memento_reference_values (
  key,
  domain,
  subdomain,
  label,
  value_numeric,
  value_text,
  unit,
  year,
  data,
  ref_ids,
  display_order,
  note
)
VALUES
  (
    'livret-a-plafond',
    'chiffres-cles',
    'livrets',
    'Livret A — plafond',
    22950,
    null,
    'EUR',
    2026,
    '{"product":"livret_a","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-comptes-livrets-comparatif-2026',
      'cmf-l221-1'
    ]::text[],
    10,
    'Plafond de versement pour une personne physique, hors intérêts capitalisés.'
  ),
  (
    'livret-a-taux',
    'chiffres-cles',
    'livrets',
    'Livret A — taux annuel',
    1.5,
    null,
    '%',
    2026,
    '{"product":"livret_a","kind":"rate","effectiveFrom":"2026-02-01"}'::jsonb,
    ARRAY[
      'service-public-livrets-taux-2026',
      'cmf-l221-1'
    ]::text[],
    20,
    'Taux en vigueur à compter du 1er février 2026.'
  ),
  (
    'ldds-plafond',
    'chiffres-cles',
    'livrets',
    'LDDS — plafond',
    12000,
    null,
    'EUR',
    2026,
    '{"product":"ldds","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-comptes-livrets-comparatif-2026',
      'cmf-l221-27'
    ]::text[],
    30,
    'Plafond de versement, hors intérêts capitalisés.'
  ),
  (
    'ldds-taux',
    'chiffres-cles',
    'livrets',
    'LDDS — taux annuel',
    1.5,
    null,
    '%',
    2026,
    '{"product":"ldds","kind":"rate","effectiveFrom":"2026-02-01"}'::jsonb,
    ARRAY[
      'service-public-livrets-taux-2026',
      'cmf-l221-27'
    ]::text[],
    40,
    'Taux en vigueur à compter du 1er février 2026.'
  ),
  (
    'lep-plafond',
    'chiffres-cles',
    'livrets',
    'LEP — plafond',
    10000,
    null,
    'EUR',
    2026,
    '{"product":"lep","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-comptes-livrets-comparatif-2026',
      'cmf-l221-13'
    ]::text[],
    50,
    'Plafond de versement, hors intérêts capitalisés.'
  ),
  (
    'lep-taux',
    'chiffres-cles',
    'livrets',
    'LEP — taux annuel',
    2.5,
    null,
    '%',
    2026,
    '{"product":"lep","kind":"rate","effectiveFrom":"2026-02-01"}'::jsonb,
    ARRAY[
      'service-public-livrets-taux-2026',
      'cmf-l221-13'
    ]::text[],
    60,
    'Taux en vigueur à compter du 1er février 2026.'
  ),
  (
    'cel-plafond',
    'chiffres-cles',
    'epargne-logement',
    'CEL — plafond',
    15300,
    null,
    'EUR',
    2026,
    '{"product":"cel","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-cel'
    ]::text[],
    70,
    'Plafond de versement, hors intérêts capitalisés.'
  ),
  (
    'cel-taux',
    'chiffres-cles',
    'epargne-logement',
    'CEL — taux annuel',
    1,
    null,
    '%',
    2026,
    '{"product":"cel","kind":"rate","effectiveFrom":"2026-02-01"}'::jsonb,
    ARRAY[
      'service-public-cel',
      'service-public-livrets-taux-2026'
    ]::text[],
    80,
    'Taux en vigueur à compter du 1er février 2026.'
  ),
  (
    'pel-plafond',
    'chiffres-cles',
    'epargne-logement',
    'PEL — plafond',
    61200,
    null,
    'EUR',
    2026,
    '{"product":"pel","kind":"ceiling"}'::jsonb,
    ARRAY[
      'base-source-service-public-fr-plan-epargne-logement-pel'
    ]::text[],
    90,
    'Plafond de versement, hors intérêts capitalisés.'
  ),
  (
    'pel-taux',
    'chiffres-cles',
    'epargne-logement',
    'PEL — taux annuel',
    2,
    null,
    '%',
    2026,
    '{"product":"pel","kind":"rate","effectiveFrom":"2026-01-01"}'::jsonb,
    ARRAY[
      'service-public-pel-taux-2026',
      'base-source-service-public-fr-plan-epargne-logement-pel'
    ]::text[],
    100,
    'Taux applicable aux plans ouverts à compter du 1er janvier 2026.'
  ),
  (
    'pea-plafond',
    'chiffres-cles',
    'pea',
    'PEA — plafond de versement',
    150000,
    null,
    'EUR',
    2026,
    '{"product":"pea","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-pea',
      'base-source-art-l221-30-code-monetaire-et-financier-pea'
    ]::text[],
    110,
    'Plafond du PEA classique, hors gains réalisés dans le plan.'
  ),
  (
    'pea-pme-plafond',
    'chiffres-cles',
    'pea',
    'PEA-PME — plafond de versement',
    225000,
    null,
    'EUR',
    2026,
    '{"product":"pea_pme","kind":"ceiling"}'::jsonb,
    ARRAY[
      'service-public-pea',
      'base-source-art-l221-32-1-code-monetaire-et-financier-pea-pme'
    ]::text[],
    120,
    'Plafond propre au PEA-PME, avec plafond global de cumul mentionné par Service-Public.'
  )
ON CONFLICT (key) DO NOTHING;
