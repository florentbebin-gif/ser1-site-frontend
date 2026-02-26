-- Migration : RLS base_contrat_overrides — SELECT restreint aux admins
-- Contexte : PR fix/p1-05-catalogue-rls-e2e-cleanup
-- Décision : note_admin et closed_date sont des données internes admin.
--            Les CGP non-admin n'ont pas besoin de lire les overrides.
-- Remplace : policy "overrides_select_authenticated" (USING true)
-- Par      : policy "overrides_select_admin" (USING public.is_admin())

DROP POLICY IF EXISTS "overrides_select_authenticated" ON public.base_contrat_overrides;

CREATE POLICY "overrides_select_admin"
  ON public.base_contrat_overrides
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
