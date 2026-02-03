# Historique des évolutions — SER1

> Ce fichier conserve l'historique détaillé des changements, post-mortems et évolutions techniques.
> Pour la documentation opérationnelle, voir [README.md](../README.md).

---

## 2026-02-03 — Logo Placement PPTX + Corrections

### 1. Position du logo sur les exports PPTX

**Objectif** : Permettre aux utilisateurs de choisir la position du logo cabinet sur les slides de couverture PPTX.

| Aspect | Avant | Après |
|--------|-------|-------|
| **Position** | Fixe (centre-bas) | 6 options : top-left, center-top, top-right, bottom-left, center-bottom, bottom-right |
| **Stockage** | - | Colonne `logo_placement` sur table `cabinets` |
| **RPC** | `get_my_cabinet_logo()` → `storage_path` | `get_my_cabinet_logo()` → `{ storage_path, placement }` |
| **UI** | Upload logo uniquement | Upload + sélecteur de position dans modal Cabinet |

**Migrations** :
- `202602030001_add-logo-placement-to-cabinets.sql` — Ajoute colonne avec contrainte CHECK
- `202602030002_update-rpc-get-my-cabinet-logo.sql` — Met à jour la RPC pour retourner placement

**Fichiers modifiés** :
- `src/settings/ThemeProvider.tsx` — Extrait `placement` de la RPC, gère format TABLE (array)
- `src/pages/Sous-Settings/SettingsComptes.jsx` — UI sélecteur position + sauvegarde
- `src/pptx/theme/types.ts` — Ajoute type `LogoPlacement` et champ `logoPlacement` dans `CoverSlideSpec`
- `src/pptx/designSystem/serenity.ts` — Ajoute `calculateLogoPosition()` avec safe zone
- `src/pptx/slides/buildCover.ts` — Utilise `calculateLogoPosition()` selon placement
- `src/pptx/presets/irDeckBuilder.ts` — Passe `logoPlacement` au cover
- `src/pptx/presets/creditDeckBuilder.ts` — Passe `logoPlacement` au cover
- `src/pages/Ir.jsx` — Extrait `logoPlacement` de `useTheme()`, passe au builder
- `src/pages/Credit.jsx` — Extrait `logoPlacement` de `useTheme()`, passe au builder
- `config/supabase/functions/admin/index.ts` — Gère `logo_placement` dans `update_cabinet`

### 2. Bug fix : Format retour RPC TABLE

**Problème** : La nouvelle RPC `RETURNS TABLE(...)` retourne un **tableau** `[{row}]`, pas un objet direct. Le code faisait `result.storage_path` sur un array → `undefined` → logo absent.

**Fix** : `ThemeProvider.tsx` extrait d'abord `row = result[0]` puis accède aux propriétés.

---

## 2026-02-01 — Refonte Signalements + Navigation Settings

### 1. Signalements — Intégration dans Settings (Généraux)

**Objectif** : Simplifier l'UX en regroupant les signalements dans l'onglet Généraux, supprimer la page séparée.

| Aspect | Avant | Après |
|--------|-------|-------|
| **Emplacement** | Page `/settings/signalements` dédiée | Bloc rétractable sous "Personnalisation avancée du thème" |
| **Déclencheur** | FAB/Modal sur `/IR`, `/Credit`, `/Placement` | Formulaire unique dans `/settings` |
| **Bug DB** | `metadata` (colonne inexistante) | `meta` (nom correct) |
| **CSS** | Couleurs hardcodées (#fee2e2, #dc2626...) | Variables CSS uniquement (`var(--color-c*)`) |
| **Pages signalables** | Définies localement | Centralisées dans `src/constants/reportPages.js` |

**Fichiers créés** :
- `src/components/settings/SignalementsBlock.jsx` — Composant réutilisable (formulaire + liste)
- `src/components/settings/SignalementsBlock.css` — Styles avec variables CSS uniquement
- `src/constants/reportPages.js` — `REPORT_PAGE_OPTIONS` + helpers

**Fichiers modifiés** :
- `src/pages/Settings.jsx` — Intégration du bloc rétractable (`showSignalements` state)
- `src/pages/SettingsShell.jsx` — Suppression de l'onglet Signalements

**Fichiers supprimés** :
- `src/pages/Sous-Settings/SettingsSignalements.jsx`
- `src/pages/Sous-Settings/SettingsSignalements.css`
- `src/components/IssueReportButton.jsx`
- `src/components/IssueReport.css`

### 2. Navigation Settings — Source unique de vérité

**Objectif** : Éviter les "oublis" lors de l'ajout de pages Settings, supprimer le code mort.

**Problème** : `SettingsNav.jsx` existait mais n'était importé nulle part (fichier orphelin). La navigation était définie en 2 endroits.

**Solution** : Configuration centralisée `SETTINGS_ROUTES` dans `src/constants/settingsRoutes.js`.

| Aspect | Avant | Après |
|--------|-------|-------|
| **Config** | `TABS` inline dans `SettingsShell.jsx` + `SETTINGS_TABS` orphelin | `SETTINGS_ROUTES` unique dans `src/constants/settingsRoutes.js` |
| **Imports composants** | Statiques en haut de `SettingsShell.jsx` | Lazy loading dans la config |
| **Permissions** | `adminOnly` dispersé | Centralisé avec `getVisibleSettingsRoutes()` |
| **Ajout page** | Modifier 2+ fichiers | 1 seul endroit |

**Helper functions** :
- `getActiveSettingsKey(pathname)` — Détermine l'onglet actif depuis l'URL
- `getVisibleSettingsRoutes(isAdmin)` — Filtre selon permissions
- `getSettingsRouteByKey(key)` — Récupère une route par clé

**Fichiers créés** :
- `src/constants/settingsRoutes.js` — Config unique source de vérité

**Fichiers modifiés** :
- `src/pages/SettingsShell.jsx` — Utilise `SETTINGS_ROUTES` importés

**Fichiers supprimés** :
- `src/pages/SettingsNav.jsx` — Fichier mort (non importé)

### 3. UserInfoBanner — Styles autonomes

**Problème** : Le bandeau "Utilisateur / Statut / Mode" changeait de style (taille police, layout) selon la page ou le refresh.

**Cause** : Dépendance à la classe CSS `settings-field-row` définie dans `SettingsImpots.css`, + héritage `fontSize` des parents variables.

**Solution** : Styles inline explicites sur tous les éléments :
- `display: 'flex'`
- `alignItems: 'center'`
- `fontSize: 14` (sur container + tous les enfants)

---

## 2026-01-31 — Security Patch: RLS user_metadata → app_metadata

### Problème (CRITIQUE)
Les RLS policies et Edge Function utilisaient `auth.user_metadata` pour vérifier le rôle admin. `user_metadata` est modifiable par l'utilisateur → élévation de privilèges possible.

### Changements
| Composant | Avant | Après |
|-----------|-------|-------|
| `public.is_admin()` | Check `user_metadata` + `app_metadata` | Check `app_metadata` uniquement |
| RLS policies | `fiscality_settings_write_admin` utilisait `user_metadata` | Toutes les policies utilisent `public.is_admin()` |
| Edge Function admin | `user.user_metadata?.role \|\| user.app_metadata?.role` | `user.app_metadata?.role` uniquement (ligne 128) |
| `set_updated_at()` | `search_path` mutable | `search_path = pg_catalog, public` fixé |
| `update_updated_at_column()` | `search_path` mutable | `search_path = pg_catalog, public` fixé |

### Fichiers modifiés
- `database/migrations/202601312200_security_rls_no_user_metadata.sql`
- `config/supabase/functions/admin/index.ts`
- `docs/technical/security-user-metadata-guidelines.md` (nouveau)

### Résultat Security Advisor
- ✅ ERROR `rls_references_user_metadata` : résolu
- ✅ WARN `function_search_path_mutable` (fonctions critiques) : résolus

---

## 2026-01-31 — Thème Original SYS + Application immédiate custom

### Problème 1 (CRITIQUE): Thème Original SYS écrasé après flash correct
**Cause** : `loadCabinetTheme()` retournait `DEFAULT_COLORS` quand pas de cabinet → sauvegardé en cache → écrasait original-db.

**Fix** : Tri-état `cabinetColors` (undefined/null/ThemeColors), `loadCabinetTheme()` retourne `null` si pas de cabinet, purge cache si null.

### Problème 2 (UX): Bouton "Enregistrer le thème" ne changeait pas l'UI sans F5
**Cause** : `saveThemeToUiSettings()` sauvegardait mais n'appliquait pas les CSS variables (pas d'update React state).

**Fix PROPRE** : Event-driven — `Settings.jsx` dispatch `'ser1-theme-updated'` après save, `ThemeProvider` écoute et applique immédiatement (avec reset rank pour bypass guard).

### Hiérarchie de priorité (source de vérité)
```
cabinet (rank 3) > custom/ui_settings (rank 1) > original-db (rank 2) > default (rank 0)
```
Note: original-db rank 2 mais custom rank 1 — après save explicite, on reset rank pour permettre l'application custom.

**Fichiers** : `src/settings/ThemeProvider.tsx`, `src/pages/Settings.jsx`

---

## 2026-01-31 — Thème Original éditable + Fallback sans cabinet

### RÈGLES MÉTIER (source de vérité)
- **R1 (Sans cabinet)** : `themeSource=cabinet` → UI/PPTX = Thème Original DB ; `custom+scope=ui-only` → UI=custom, PPTX=Thème Original ; `custom+scope=all` → UI/PPTX=custom
- **R2 (Avec cabinet)** : PPTX = cabinet TOUJOURS (couleurs + logo) ; UI = cabinet ou custom selon settings
- **R3 (/settings/comptes)** : "Aucun" = `cabinet_id NULL` ; "Thème Original" éditable (pas les autres système) et non supprimable

### TECHNIQUE
- Edge Function: action `get_original_theme` (auth Bearer requis) retourne `{name, palette}`
- Déploiement: `--workdir ./config` (pas `./config/supabase`) car source de vérité dans `config/supabase/functions/admin/index.ts`
- `ThemeProvider`: `loadOriginalTheme()` au montage, fallback UI = `originalColors ?? DEFAULT_COLORS`
- PPTX: `resolvePptxColors()` priorité cabinet > (scope=all ? custom : original)

**Fichiers** : `config/supabase/functions/admin/index.ts`, `src/settings/ThemeProvider.tsx`, `src/pptx/theme/resolvePptxColors.ts`, `src/pages/Sous-Settings/SettingsComptes.jsx`

---

## 2026-01-31 — Thème Original DB + Logique No-Cabinet

**Problème** : Thème Original hardcodé, users sans cabinet sans fallback cohérent entre UI et PPTX.

**Fix** :
- Thème Original éditable via /settings/comptes (non supprimable)
- Edge Function : action `get_original_theme` (auth requise, non-admin)
- `ThemeProvider` : charge `originalColors` depuis DB
- `resolvePptxColors` : support `themeScope` (all/ui-only) + `originalColors`
- PPTX sans cabinet : custom si scope=all, Thème Original si scope=ui-only

---

## 2026-01-31 — Roadmap #3: Logo cabinet uniquement

**Problème** : En UI custom, exports PPTX utilisaient `user_metadata.cover_slide_url` au lieu du logo cabinet.

**Fix** : `exportLogo = cabinetLogo || undefined` dans IR et Crédit (suppression fallback user logo).

---

## 2026-01-30 — ESLint Warnings Cleanup (Lots 1-4C1)

| Lot | Scope | Résultat |
|-----|-------|----------|
| 4C1 | no-unused-vars (ThemeProvider, auth, etc.) | 0 warning |
| 4B2 | ThemeProvider micro (stabilisation refs) | 26 warnings |
| 4B1 | ThemeProvider micro (mountIdRef) | 28 warnings |
| 4A | exhaustive-deps (hors ThemeProvider) | 30 warnings |
| 3 | PPTX | 40 warnings |
| 2 | Pages | 70 warnings |
| 1 | Tests + utils | 114 warnings |

---

## 2026-01-30 — CSS Fix: Placement Grid

**Problème** : Règles `.ir-grid/.ir-right` chargées uniquement via `Ir.jsx` (lazy), absentes au F5 sur `/sim/placement`.

**Fix** : Import `Ir.css` dans `PlacementV2.jsx`.

---

## 2026-01-29 — Placement Responsive

**Problème** : Grille `.ir-grid` en 2 colonnes, colonne droite hors viewport en largeur réduite.

**Fix** : Breakpoint placement → 1 colonne sous 1100px (synthèse visible).

---

## 2026-01-27 — Parts IR (Oracle 10 cas)

**Objectif** : Aligner calcul des parts (parent isolé / alternée) avec oracle 10 cas + disclaimer conditionnel.

**Fichiers** : `src/utils/irEngine.js`, `src/utils/irEngine.parts.test.js`, `src/pages/Ir.jsx`

---

## 2026-01-27 — Collision CSS `.icon-btn`

**Problème** : Collision CSS globale `.icon-btn` injectée par `SettingsComptes.css` (lazy /settings).

**Fix** : Scoping des styles `.icon-btn` sous `.settings-comptes` + ajout classe racine.

---

## Archives

Pour l'historique complet antérieur, consulter le git log :
```bash
git log --oneline --since="2025-01-01" --grep="fix\|feat\|chore" > docs/notes/full-git-history.txt
```
