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

### Note: actions historiques toujours présentes
- Users: `users`, `list_users`, `create_user_invite`, `delete_user`, `reset_password`, `update_user_role`
- Issues: `list_issue_counts`, `list_issue_reports`, `get_latest_issue_for_user`, `mark_issue_read`, `mark_issue_unread`, `delete_issue`, `delete_all_issues_for_user`
- Debug/health: `ping_public` (sans auth via query), `ping`, `echo`, `version`

---

## VAGUE 2 - UI ADMIN /settings/comptes

### Commit 3: feat(admin): add logo upload utility with SHA256 dedup
- **Fichier**: `src/utils/logoUpload.js`
- **Fonctionnalités**:
  - Calcul SHA256 côté client
  - Vérification `check_logo_exists` avant upload
  - Upload vers Storage bucket "logos"
  - Création enregistrement DB via `create_logo`

### Commit 4: feat(admin): add cabinets/themes UI + user assignment
- **Fichier**: `src/pages/Sous-Settings/SettingsComptes.jsx`
- **UI ajoutée**:
  - Section Cabinets (cards + modal CRUD + logo upload + thème par défaut)
  - Section Thèmes globaux (cards + modal CRUD + palette 10 couleurs + protection système)
  - Colonne "Cabinet" dans table users avec dropdown d'assignation
- **Actions API utilisées**:
  - `list_cabinets`, `create_cabinet`, `update_cabinet`, `delete_cabinet`
  - `list_themes`, `create_theme`, `update_theme`, `delete_theme`
  - `assign_user_cabinet`, `assign_cabinet_logo`
  - `check_logo_exists`, `create_logo`

---

## ÉTAT ACTUEL

- ✅ Tests: 68/68 passés
- ✅ Build: OK (chunk 1.20MB - légère augmentation V2)
- ✅ Aucune régression UI Settings user
- ✅ UI admin cabinets/thèmes fonctionnelle
- ⚠️ **TODO**: Créer bucket Storage "logos" dans Dashboard Supabase (requis pour upload)

---

## TEST MANUEL V2 - BUCKET STORAGE LOGOS

### Étapes à exécuter manuellement
1. **Créer bucket Supabase Storage**:
   - Nom: `logos`
   - Type: `private`
   - RLS: activé (par défaut)

2. **Test depuis /settings/comptes**:
   - Créer un cabinet "Cabinet Test"
   - Uploader un logo (fichier PNG/JPG réel)
   - Assigner un user au cabinet

3. **Vérifications Supabase**:
   - Storage: fichier dans `logos/{cabinet_id}/timestamp-hash.ext`
   - DB `logos`: row avec sha256, storage_path, bytes
   - DB `cabinets`: logo_id non null
   - DB `profiles`: cabinet_id du user non null

### Résultat du test
- **Date**: 2026-01-24
- **Bucket créé**: ✅ OUI
- **Test upload**: ❌ KO → ✅ RÉSOLU
- **Erreurs rencontrées**: 
  - **Round 1**: `Invalid action` (400) → **Résolu**: Edge Function déployée
  - **Round 2**: `Internal server error` (500) sur `list_cabinets` et `list_thèmes` → **Résolu**: Migration DB appliquée
  - **Round 3**: `assign_user_cabinet` 500 → **Résolu**: Gestion profile manquant (PGRST116)
  - **Round 4**: Logo upload 400 RLS → **Résolu**: Policies storage.objects pour bucket 'logos'
  - **État final**: ✅ V2 fonctionnelle après patchs Edge Function + RLS Storage

---

## V2.1 - AUTO-CRÉATION PROFILES SUR ASSIGNMENT

### Patch: assign_user_cabinet auto-create missing profiles
- **Problème**: Users existant dans `auth.users` mais sans row dans `public.profiles` → 404
- **Solution**: Si `profiles.update()` retourne null/PGRST116, créer automatiquement le profile depuis `auth.users`
- **Implémentation**: 
  - `maybeSingle()` pour éviter 500 sur row manquante
  - `supabase.auth.admin.getUserById()` pour récupérer email + rôle
  - `profiles.insert()` avec `id`, `email`, `role`, `cabinet_id`
- **Test**: Assigner un cabinet à un user sans profile → profile créé automatiquement (200)

---

## V3.1 - UI SETTINGS REFACTOR (LOGO + THEME)

### Changements V3.1
- **Suppression bloc logo**: Upload/suppression logo déprécié, redirigé vers admin cabinets
- **Suppression bloc "Application du thème"**: Scope UI-only par défaut, TODO pour V3.3
- **Nouveau choix thème**: Radio "Thème du cabinet" (défaut) vs "Thème personnalisé"
- **Palette couleurs**: Affiche Couleur 1 par défaut + bouton "Couleurs avancées"
- **Générateur palette**: `src/utils/paletteGenerator.ts` recalcule c2..c10 depuis c1
- **Persistance**: `themeSource` stocké dans localStorage (en attente V3.2)

### Fichiers modifiés
- `src/pages/Settings.jsx` - Refactor UI complet
- `src/utils/paletteGenerator.ts` - Nouveau utilitaire palette

### Tests manuels requis
1. /settings: bloc logo absent
2. /settings: bloc "Application du thème" absent  
3. /settings: radio "Thème du cabinet"/"Personnalisé" visible
4. /settings: Couleur 1 visible + bouton "Couleurs avancées"
5. Modifier Couleur 1 → autres couleurs changent (si avancées ouvertes)
6. Refresh page → état conservé (localStorage)

---

## PROCHAINES ÉTAPES (V3+)

1. ✅ Créer bucket Storage "logos" (manuel Dashboard)
2. ✅ Smoke tests manuels de l'UI admin
3. ✅ Auto-création profiles sur assignment
4. ✅ V3.1 UI Settings refactor (logo + thème)
5. V3.2: Intégration thème cabinet réel (API + ThemeProvider)
6. V3.3: Suppression complète themeScope + PPTX cabinet-governed
7. V4: Optimisation perf (chunking pptxgenjs)

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
