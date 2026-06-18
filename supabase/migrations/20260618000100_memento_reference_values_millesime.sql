-- Millésime append-only pour memento_reference_values.
-- La clé primaire passe de (key) à (key, year) : la base conserve désormais l'historique par
-- millésime au lieu d'écraser une valeur sur place. Les policies RLS et le trigger updated_at
-- définis à la création de la table restent inchangés.

ALTER TABLE public.memento_reference_values
  DROP CONSTRAINT IF EXISTS memento_reference_values_pkey;

ALTER TABLE public.memento_reference_values
  ALTER COLUMN key SET NOT NULL,
  ALTER COLUMN year SET NOT NULL;

ALTER TABLE public.memento_reference_values
  ADD CONSTRAINT memento_reference_values_pkey PRIMARY KEY (key, year);
