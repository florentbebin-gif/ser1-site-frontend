# Rapport Security Advisor - Supabase SER1

**Date:** 2026-01-31  
**Auteur:** Security Engineer  
**Status:** Analyse complète - Patch prêt

---

## 1. Résumé Exécutif (10 lignes)

**CRITIQUE (1 ERROR):** La policy `fiscality_settings_write_admin` référence `auth.user_metadata` éditable par l'utilisateur → élévation de privilèges possible.  
**WARN (12):** Fonctions avec `search_path` mutable risquent de résoudre des objets non prévus (hijacking).  
**WARN (Auth):** Protection contre mots de passe compromis désactivée.  

**Impact:** Un utilisateur peut s'auto-promouvoir admin en modifiant son `user_metadata.role`.  
**Surface d'attaque:** RLS policies utilisant `user_metadata`, fonctions `SECURITY DEFINER` sans `search_path` fixe.  
**Correctif prioritaire:** Remplacer `user_metadata` par `app_metadata` (contrôlé serveur) et fixer `search_path`.

---

## 2. Constats (avec preuves DDL)

### 2.1 ERROR - rls_references_user_metadata

**Localisation:** `fiscality_settings_write_admin` (non dans repo, créée manuellement dans Supabase)

```sql
-- Policy problématique (extrait du backup)
CREATE POLICY "fiscality_settings_write_admin"
  ON fiscality_settings
  FOR ALL
  USING (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  )
  WITH CHECK (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  );
```

**Autres policies utilisant user_metadata:**

| Fichier | Ligne | Policy |
|---------|-------|--------|
| `database/migrations/create_issue_reports_table.sql:36` | `Admins can read all issue reports` | `auth.jwt() ->> 'user_metadata'::jsonb ->> 'role' = 'admin'` |
| `database/fixes/fix_issue_reports_table.sql:79,83` | `Admins can manage all issue reports` | `auth.jwt() -> 'user_metadata'::jsonb ->> 'role' = 'admin'` |
| `database/migrations/create-cabinets-themes-logos.sql:8-19` | `public.is_admin()` | `current_setting('request.jwt.claims', true)::jsonb->>'user_metadata'->>'role'` |

### 2.2 WARN - function_search_path_mutable (12 fonctions)

**Fonctions identifiées dans le repo:**

```sql
-- database/setup/supabase-setup.sql:23-29
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- ❌ Pas de SET search_path

-- database/migrations/create-cabinets-themes-logos.sql:8-19
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'user_metadata'->>'role',
    current_setting('request.jwt.claims', true)::jsonb->>'app_metadata'->>'role',
    'user'
  ) = 'admin';
$$;
-- ❌ Pas de SET search_path + utilise user_metadata

-- database/migrations/create-ui-settings.sql:26-32
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
-- ❌ Pas de SET search_path
```

**Fonctions dans Supabase (non dans repo):**
- `public.get_settings_version`
- `public.bump_settings_version`
- `public.sync_settings_data_tax`
- `public.sync_settings_data_fiscality`
- `public.sync_settings_data_ps`
- `public.set_issue_report_user_id`
- `public.handle_new_auth_user`

### 2.3 Flux Admin (Edge Function)

**Fichier:** `config/supabase/functions/admin/index.ts:128-134`

```typescript
// Vérifier le rôle admin pour les actions sensibles
const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
if (userRole !== 'admin') {
  return new Response(JSON.stringify({ error: 'Admin access required' }), {
    status: 403,
    ...
  })
}
```

**Note:** La Edge Function utilise `user_metadata` en premier, ce qui est cohérent avec `is_admin()` mais **insecure**. Elle met à jour les deux métadatas lors des changements de rôle (ligne 184-189).

---

## 3. Analyse de Risque & Stratégie

### 3.1 Risque user_metadata

**Attaque concrète:**
1. User standard modifie son `user_metadata.role = 'admin'` via API Supabase
2. La policy RLS accepte le claim → user peut écrire dans `fiscality_settings`
3. Élévation de privilèges réussie

**Stratégie:** Privilégier `app_metadata` (modifiable uniquement par service_role ou Edge Functions admin).

### 3.2 Risque search_path_mutable

**Attaque théorique:**
1. Attaquant crée une table `now()` dans schema `public`
2. Fonction `set_updated_at()` sans search_path fixe résout `now()` → table malveillante
3. Exécution de code arbitraire

**Impact réel:** Faible (nécessite CREATE privilege), mais à corriger pour conformité.

---

## 4. Patch Minimal Proposé

### 4.1 Suppression des références user_metadata

```sql
-- ===========================================
-- 1. DURCISSEMENT public.is_admin()
-- ===========================================
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  -- Vérifier UNIQUEMENT app_metadata (non modifiable par l'utilisateur)
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role',
    'user'
  ) = 'admin';
$$;

-- Révoquer et re-grant
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ===========================================
-- 2. DROP policy fiscality_settings_write_admin (user_metadata)
-- ===========================================
DROP POLICY IF EXISTS "fiscality_settings_write_admin" ON public.fiscality_settings;

-- La policy existante "Admins can write fiscality_settings" utilise profiles.role
-- C'est acceptable car profiles.role est contrôlé par l'Edge Function admin

-- ===========================================
-- 3. FIX policies issue_reports
-- ===========================================
DROP POLICY IF EXISTS "Admins can read all issue reports" ON public.issue_reports;
DROP POLICY IF EXISTS "Admins can manage all issue reports" ON public.issue_reports;

CREATE POLICY "Admins can manage all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin'
  );
```

### 4.2 Fix search_path mutable

```sql
-- ===========================================
-- 4. set_updated_at()
-- ===========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ===========================================
-- 5. update_updated_at_column()
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
```

### 4.3 Edge Function (à modifier manuellement)

**Fichier:** `config/supabase/functions/admin/index.ts:128`

```typescript
// AVANT (insecure):
const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'

// APRÈS (secure):
const userRole = user.app_metadata?.role || 'user'
```

### 4.4 Settings Auth (dashboard)

Activer dans Supabase Dashboard → Auth → Settings:
- **Leaked password protection:** Enable

---

## 5. Plan de Tests

### 5.1 Tests SQL (SQL Editor)

```sql
-- Test 1: is_admin() ignore user_metadata
-- Exécuter avec un user standard qui a modifié son user_metadata.role='admin'
SELECT public.is_admin(); 
-- Expected: false (car app_metadata.role != 'admin')

-- Test 2: User standard ne peut pas écrire fiscality_settings
-- Exécuter avec JWT user standard
UPDATE public.fiscality_settings SET settings = '{"hacked":true}'::jsonb WHERE id=1;
-- Expected: 0 rows affected (policy deny)

-- Test 3: Admin peut écrire
-- Exécuter avec JWT admin (app_metadata.role='admin')
UPDATE public.fiscality_settings SET settings = settings WHERE id=1;
-- Expected: 1 row affected

-- Test 4: Vérifier search_path fixé
SELECT 
  p.proname,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'set_updated_at', 'update_updated_at_column')
  AND p.proconfig @> ARRAY['search_path=pg_catalog, public'];
-- Expected: 3 rows
```

### 5.2 Tests E2E (Application)

| Test | User | Action | Expected |
|------|------|--------|----------|
| T1 | Standard | Login + navigation /settings | OK, pas d'accès admin |
| T2 | Standard | Modifier user_metadata.role='admin' via API | OK (mais ignoré) |
| T3 | Standard (après T2) | Tentative accès /admin | Refus 403 |
| T4 | Admin | Login + navigation /admin | OK |
| T5 | Admin | Créer/modifier thème | OK |
| T6 | Admin | Modifier rôle d'un user | OK, user_metadata ET app_metadata mis à jour |

### 5.3 Critères d'acceptation

- [ ] Security Advisor n'affiche plus l'ERROR `rls_references_user_metadata`
- [ ] Security Advisor n'affiche plus les WARN `function_search_path_mutable` pour les fonctions patchées
- [ ] Tests SQL passent (is_admin ignore user_metadata)
- [ ] Tests E2E passent (admin OK, user KO)
- [ ] Aucune régression sur pages /settings, /admin, exports

---

## 6. Rollback

### 6.1 Rollback SQL

```sql
-- Restaurer is_admin() avec user_metadata
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'user_metadata'->>'role',
    current_setting('request.jwt.claims', true)::jsonb->>'app_metadata'->>'role',
    'user'
  ) = 'admin';
$$;

-- Recréer la policy fiscality_settings_write_admin (si besoin)
CREATE POLICY "fiscality_settings_write_admin"
  ON public.fiscality_settings
  FOR ALL
  USING (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  )
  WITH CHECK (
    lower(COALESCE(
      (auth.jwt() -> 'user_metadata'::text) ->> 'role'::text,
      ''::text
    )) = 'admin'::text
  );

-- Restaurer set_updated_at sans search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restaurer update_updated_at_column sans search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Restaurer policy issue_reports avec user_metadata
DROP POLICY IF EXISTS "Admins can manage all issue_reports" ON public.issue_reports;
CREATE POLICY "Admins can manage all issue reports" ON public.issue_reports
  FOR ALL USING (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata'::jsonb ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() -> 'app_metadata'::jsonb ->> 'role' = 'admin' OR
    auth.jwt() -> 'user_metadata'::jsonb ->> 'role' = 'admin'
  );
```

### 6.2 Rollback Git/Edge Function

```bash
# Restaurer la version précédente de l'Edge Function
git checkout HEAD~1 -- config/supabase/functions/admin/index.ts

# Redéployer la Edge Function
supabase functions deploy admin
```

---

## 7. Ordre de Déploiement Recommandé

1. **Déployer le patch SQL** (ce fichier) dans Supabase SQL Editor
2. **Modifier et déployer** l'Edge Function (`admin/index.ts` ligne 128)
3. **Activer** "Leaked password protection" dans Auth Settings
4. **Exécuter** les tests SQL
5. **Exécuter** les tests E2E
6. **Vérifier** Security Advisor

---

## 8. Inventaire des Dépendances

| Composant | Dépend de | Impact si cassé |
|-----------|-----------|-----------------|
| `is_admin()` | RLS policies themes, logos, cabinets | Accès admin impossible |
| `set_updated_at()` | Triggers profiles, settings, themes, cabinets, logos | Timestamps non mis à jour |
| `update_updated_at_column()` | Trigger ui_settings | Timestamps UI non mis à jour |
| Edge Function admin | `is_admin()`, `profiles.role` | Gestion users impossible |

---

**FIN DU RAPPORT**
