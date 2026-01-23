# DEV NOTES - Vague 0 Baseline
**Date**: 2026-01-23  
**Branche**: feat/cabinets-logos-themes  
**Objectif**: Baseline reproductible avant chantier Cabinets + Logos + Thèmes  

---

## ENVIRONNEMENT

- **Node**: v22.21.0
- **npm**: 10.9.4
- **OS**: Windows PowerShell

---

## INSTALLATION

```bash
# npm ci a échoué (EPERM sur esbuild.exe), fallback sur npm install
npm install
# Résultat: added 299 packages, changed 53 packages, audited 353 packages
# 2 moderate vulnerabilities (non critiques pour baseline)
```

---

## TESTS

```bash
npm run test
# ✓ 9 test files passed
# ✓ 68 tests passed
# Duration: 778ms
# Aucune erreur critique
```

---

## BUILD

```bash
npm run build
# ✓ built in 3.04s
# Taille chunks:
# - dist/assets/index-DkaM6IFY.css: 74.05 kB │ gzip: 11.95 kB
# - dist/assets/index-DPbYrSbT.js: 1,190.44 kB │ gzip: 338.52 kB
# ⚠️  WARNING: Chunk > 500KB (confirme la nécessité de Vague 4 perf)
```

---

## EDGE FUNCTION ADMIN

**Chemin exact**: `config/supabase/functions/admin/index.ts`  
**Taille**: 18.9 KB (18962 lignes)  
**Actions existantes** (recherche `list_users`):
- `list_users` (ligne 155) → `supabase.auth.admin.listUsers()`
- `update_user_role` (ligne 121) → met à jour `user_metadata.role` et `app_metadata.role`
- Autres actions: `create_user_invite`, `delete_user`, `reset_password`, `issue_reports`...

**Auth admin** (ligne 84):
```typescript
const userRole = user.user_metadata?.role || user.app_metadata?.role || 'user'
if (userRole !== 'admin') {
  return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
}
```

---

## DÉTERMINATION RÔLE ADMIN

**Côté Edge Function**: `user_metadata.role` OU `app_metadata.role` (fallback 'user')  
**Côté DB**: Table `public.profiles` avec champ `role` (CHECK 'user'/'admin')

**Dualité constatée**:
- Edge Function lit depuis `auth.users` metadata
- Table `profiles` a son propre champ `role` (utilisé dans les RLS policies)

**NOTE**: Il y a une redondance. Les RLS policies vérifient `profiles.role`, mais l'Edge Function vérifie `auth.users` metadata.

---

## RECOMMANDATIONS V1 RLS

**Choix unique recommandé**: **Utiliser `auth.users.user_metadata.role` comme source de vérité**

**Raisons**:
1. Edge Function déjà implémentée avec cette logique
2. Moins de duplication de données
3. Plus simple pour les futures actions admin (pas de sync entre `profiles.role` et `user_metadata.role`)

**Impact sur RLS**:
- Remplacer `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`
- Par `auth.user_metadata()->>'role' = 'admin'`

**Alternative** (si on préfère garder `profiles.role`):
- Ajouter un trigger pour synchroniser `profiles.role` depuis `user_metadata.role` à chaque update
- Ou migrer l'Edge Function pour lire depuis `profiles.role`

**NOTE**: La table `profiles` contient déjà une redondance avec `auth.users`. À clarifier dans V1.

---

## POINTS BLOQUANTS RÉSOLUS

1. ✅ **Edge Function admin localisée** dans `config/supabase/functions/admin/index.ts`
2. ✅ **Champ role identifié** dans `public.profiles` (ligne 14) ET dans `auth.users` metadata

---

## PROCHAINES ÉTAPES (V1)

1. Décider de la source de vérité pour le rôle admin (recommandé: `user_metadata.role`)
2. Préparer les actions admin supplémentaires dans la même Edge Function
3. Créer les migrations SQL pour les nouvelles tables `cabinets`, `themes`, `logos`

---

## VAGUE 1 - DB + API MINIMAL

### Commit 1: feat(db): add cabinets themes logos schema + RLS
- **Fichiers**: `database/migrations/create-cabinets-themes-logos.sql`
- **Tables créées**: `themes`, `logos`, `cabinets`
- **FK ajoutée**: `profiles.cabinet_id`
- **Fonction admin**: `public.is_admin()` basée sur JWT claims
- **RLS**: Policies admin-only (V1 minimal)
- **Seed**: Thème SER1 Classique + cabinet Défaut

### Commit 2: feat(api): add admin actions for cabinets/themes/logos
- **Fichier**: `config/supabase/functions/admin/index.ts`
- **Actions ajoutées**:
  - Cabinets: `list_cabinets`, `create_cabinet`, `update_cabinet`, `delete_cabinet`
  - Themes: `list_themes`, `create_theme`, `update_theme`, `delete_theme`
  - Logos: `check_logo_exists`, `create_logo`, `assign_cabinet_logo`
  - Assignments: `assign_user_cabinet`, `assign_cabinet_theme`
- **Validation**: Payload basique + erreurs consistantes
- **Auth**: Préserve logique existante (user_metadata.role)

---

## ÉTAT ACTUEL

- ✅ Tests: 68/68 passés
- ✅ Build: OK (chunk 1.19MB - inchangé)
- ✅ Aucune régression UI (Settings non modifié)
- ⚠️ **TODO**: Créer bucket Storage "logos" dans Dashboard Supabase

---

## PROCHAINES ÉTAPES (V2)

1. Créer bucket Storage "logos" (manuel Dashboard)
2. Smoke tests API admin avec curl
3. V2: UI admin dans SettingsComptes

---

## ANNEXE - COMMANDES UTILES

```bash
# Vérifier branche actuelle
git branch
# Revenir sur main si besoin
git checkout main
# Supprimer branche de test (si nécessaire)
git branch -D feat/cabinets-logos-themes
```
