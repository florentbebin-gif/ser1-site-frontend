-- P0-02: Multi-tenant RLS profiles per cabinet
-- Objectif: Un admin ne peut voir/modifier que les profils de SON cabinet.
-- Les tables settings (tax, ps, fiscality, base_contrat) restent GLOBALES (conforme exigence SaaS).
--
-- ROLLBACK: voir bloc en bas du fichier.
-- RISQUE: Moyen — RLS uniquement, pas de changement de schéma.
-- TEST: Admin A (cabinet_id=X) ne voit pas les profils de cabinet_id=Y.

-- Fonction helper: récupère le cabinet_id du user courant depuis profiles
CREATE OR REPLACE FUNCTION public.get_my_cabinet_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cabinet_id FROM profiles WHERE id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_my_cabinet_id() IS
  'Retourne le cabinet_id du user courant. SECURITY DEFINER pour éviter la récursion RLS.';

-- Accorder l'exécution aux users authentifiés
GRANT EXECUTE ON FUNCTION public.get_my_cabinet_id() TO authenticated;

-- ============================================================================
-- Remplacer la policy SELECT sur profiles
-- Ancienne: "Users can view own profile" (auth.uid() = id)
-- Nouvelle: 
--   - User normal: voit uniquement SON profil (auth.uid() = id)
--   - Admin (is_admin()): voit les profils de son cabinet OU les profils sans cabinet
-- ============================================================================

-- Supprimer les anciennes policies SELECT (noms possibles selon les migrations)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

-- Policy SELECT pour users normaux: uniquement son propre profil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy SELECT pour admins: profils de leur cabinet + profils sans cabinet (orphelins)
CREATE POLICY "profiles_select_admin_same_cabinet"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    AND (
      cabinet_id = public.get_my_cabinet_id()
      OR cabinet_id IS NULL
    )
  );

-- ============================================================================
-- Policy UPDATE sur profiles (admin ne peut modifier que les profils de son cabinet)
-- ============================================================================

DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Admin: update uniquement les profils de son cabinet
CREATE POLICY "profiles_update_admin_same_cabinet"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    AND (
      cabinet_id = public.get_my_cabinet_id()
      OR cabinet_id IS NULL
    )
  )
  WITH CHECK (
    public.is_admin()
    AND (
      cabinet_id = public.get_my_cabinet_id()
      OR cabinet_id IS NULL
    )
  );

-- User normal peut mettre à jour son propre profil (champs non-sensibles)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ROLLBACK (exécuter manuellement si besoin)
-- ============================================================================
-- DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
-- DROP POLICY IF EXISTS "profiles_select_admin_same_cabinet" ON profiles;
-- DROP POLICY IF EXISTS "profiles_update_admin_same_cabinet" ON profiles;
-- DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
-- DROP FUNCTION IF EXISTS public.get_my_cabinet_id();
-- Puis recréer les anciennes policies:
-- CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "Admin can update any profile" ON profiles FOR UPDATE USING (public.is_admin());
