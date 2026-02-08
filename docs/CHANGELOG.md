# Historique des évolutions — SER1

> Ce fichier conserve l'historique détaillé des changements, post-mortems et évolutions techniques.
> Pour la documentation opérationnelle, voir [README.md](../../README.md).
> Pour la gouvernance couleurs, voir [docs/design/color-governance.md](../design/color-governance.md).

---

## 2026-02-08 — Refactor Codebase Cleanup Plan : Quality Gates & Standards

### Objectif
Réduire la dette technique et standardiser les conventions pour améliorer la maintenabilité.

### Changements appliqués

| Type | Changement | Impact |
|------|------------|--------|
| **Console logs** | 3 `console.debug` conditionnés avec `DEBUG_PPTX` + 3 `console.warn` avec `import.meta.env.DEV` | Production propre |
| **CI** | Step anti-console.* non protégés dans `.github/workflows/ci.yml` | Bloque les régressions |
| **Pre-commit** | Husky + lint-staged (ESLint auto-fix) | Quality gates automatisés |
| **CSS cross-import** | `PlacementV2.jsx` n'importe plus `Ir.css`, styles migrés vers `Placement.css` | Autonomie CSS |
| **Imports** | 30 imports relatifs → alias `@/` dans 4 fichiers Settings | Cohérence |
| **Documentation** | Règles CSS & imports ajoutées à `CONTRIBUTING.md` | Conventions documentées |
| **Tests** | 6 smoke tests Playwright pour pages figées (Home, Login, IR, Credit, Placement, Settings) | Protection régressions |
| **Helpers API** | `src/utils/settingsApi.ts` avec `loadSettings`, `saveSettings`, `getCurrentUser`, `mergeWithDefaults` | Amorce refactor Settings |

### Fichiers modifiés
- `src/pptx/ops/applyChapterImage.ts` - Console logs protégés
- `src/pptx/designSystem/serenity.ts` - Console logs protégés  
- `.github/workflows/ci.yml` - Step anti-console
- `.husky/pre-commit`, `package.json` - Pre-commit hooks
- `src/pages/PlacementV2.jsx` - Suppression import `Ir.css`
- `src/pages/Placement.css` - Styles partagés avec préfixe `pl-ir-*`
- `src/pages/Sous-Settings/*.jsx` - 30 imports standardisés
- `CONTRIBUTING.md` - Règles CSS & imports
- `tests/e2e/smoke.spec.ts` - Smoke tests
- `src/utils/settingsApi.ts` - Helpers API Settings

### Validation
```bash
npm run lint          # ✅ 0 erreur
npm run typecheck     # ✅ 0 erreur  
npm test              # ✅ 83 tests + 8 smoke tests
npm run build         # ✅ Build OK
```

### Quality Gates activés
- **Pre-commit** : ESLint auto-fix sur chaque commit
- **CI** : Bloque les `console.*` non protégés
- **Tests** : Smoke tests pour pages stables
- **Documentation** : Règles imports/CSS dans CONTRIBUTING.md

---

## 2026-02-08 — Refactoring Phase 3 : PlacementV2.jsx → architecture modulaire

### Objectif
Réduire la complexité de `PlacementV2.jsx` (2 286 lignes) en extrayant ses responsabilités dans des modules dédiés.

### Modules créés

| Fichier | Contenu | Lignes |
|---------|---------|--------|
| `src/pages/placement/utils/formatters.js` | `fmt`, `euro`, `shortEuro`, `formatPercent`, `formatDmtgRange`, helpers PS | 41 |
| `src/pages/placement/utils/normalizers.js` | Constants `DEFAULT_*`, `normalizeProduct`, `normalizeLoadedState`, `buildPersistedState`, `buildDmtgOptions` | 157 |
| `src/pages/placement/components/inputs.jsx` | `InputEuro`, `InputPct`, `InputNumber`, `Select`, `Toggle` | 175 |
| `src/pages/placement/components/tables.jsx` | `CollapsibleTable`, `AllocationSlider` | 97 |
| `src/pages/placement/components/VersementConfigModal.jsx` | Modal paramétrage versements (initial, annuel, ponctuels) | 330 |
| `src/pages/placement/utils/placementExcelExport.js` | `buildPlacementExcelXml`, `exportPlacementExcel` | 196 |
| `src/pages/placement/utils/tableHelpers.jsx` | Colonnes, filtrage, renderers épargne/liquidation | 195 |

### Résultat
- **PlacementV2.jsx** : 2 286 → 1 047 lignes (**-54 %**, rôle orchestrateur)
- 16 imports inutilisés nettoyés
- tsc ✅ | eslint ✅ | vitest 83/83 ✅

---

## 2026-02-08 — Refactoring Phase 2 : ThemeProvider.tsx → modules

### Objectif
Réduire la complexité de `ThemeProvider.tsx` en extrayant types, cache, RPC et CSS sync.

### Modules créés

| Fichier | Contenu |
|---------|---------|
| `src/settings/theme/types.ts` | Interfaces `ThemeCache`, `ThemeScope`, `ThemeSource`, `ThemeContextValue`, etc. |
| `src/settings/theme/hooks/useThemeCache.ts` | Fonctions cache localStorage (user, cabinet, logo, bootstrap) |
| `src/settings/theme/hooks/useCabinetTheme.ts` | RPC Supabase : `loadCabinetTheme`, `loadCabinetLogo`, `loadOriginalTheme` |
| `src/settings/theme/hooks/useThemeSync.ts` | `SOURCE_RANKS`, `getThemeHash`, `applyColorsToCSS` |

### Résultat
- ThemeProvider.tsx conservé comme orchestrateur avec imports propres
- tsc ✅ | eslint ✅ | vitest ✅

---

## 2026-02-08 — Fix TypeScript : Conversion supabaseClient.js → supabaseClient.ts

### Contexte
CI échouait sur `npm run typecheck` avec 15 erreurs TS2339/TS1320. Le mock Supabase (fallback quand config manquante) était mal typé, causant des unions de types conflictuelles avec `SupabaseClient`.

### Erreurs corrigées

| Fichier | Erreur | Cause |
|---------|--------|-------|
| `src/auth/useUserRole.ts:39,107` | `Property 'getUser' does not exist` | Mock auth manquait `getUser()` |
| `src/services/userModeService.ts:15` | `Property 'eq' does not exist` | Query builder mock non chainable |
| `src/settings/ThemeProvider.tsx:290,339,749,790...` | `Property 'rpc'/'download'/'getUser'/'eq' does not exist` | Mock incomplet |
| `src/settings/ThemeProvider.tsx:891` | `TS1320: await operand must not contain callable 'then'` | `.then()` sur le mock interférait avec `await` |

### Fix appliqué

**Conversion `src/supabaseClient.js` → `src/supabaseClient.ts`**

| Changement | Détail |
|------------|--------|
| **Typage explicite** | `export const supabase: SupabaseClient` + mock typé `any` |
| **Méthodes ajoutées** | `auth.getUser`, `rpc`, `storage.download`, query builder chainable (`eq`, `order`, `limit`, `maybeSingle`, `single`) |
| **Résultats** | `single()`/`maybeSingle()` retournent `{ data: null, error: null }` (objet) ; `insert()`/`upsert()` chainables et awaitables |

### Fichiers modifiés
- `src/supabaseClient.ts` (créé) — Version TypeScript typée
- `src/supabaseClient.js` (supprimé) — Remplacé par la version TS

### Vérification
```bash
npm run typecheck  # ✅ 0 erreur
```

---

## 2026-02-06 — Fixes Edge Function, Auth, Thèmes + Nettoyage duplicates

### Contexte
Trois bugs en production/staging : Edge Function 404 sur `get_original_theme`, Auth 400 `Invalid Refresh Token` en boucle, et `delete_theme` 400 quand un cabinet est assigné. Également des warnings ThemeProvider `BLOCKED` et des fichiers dupliqués dans le repo.

### Fixes appliqués

| Bug | Cause racine | Fix |
|-----|-------------|-----|
| **Edge Function 404** `get_original_theme` | Nom hardcodé `'Thème Original'` vs DB `'Thème Origine'` | Requête par `is_system=true` (marqueur stable) |
| **Edge Function 404** `update_theme` | Même mismatch de nom | Suppression du check nom, le thème système est modifiable |
| **Auth 400** `Invalid Refresh Token` | Aucun handler dans `AuthProvider` | Détection `TOKEN_REFRESHED` sans session → `signOut()` propre + guard anti-boucle |
| **delete_theme 400** cabinet assigné | Edge Function bloquait malgré `ON DELETE SET NULL` en DB | Désassignation auto des cabinets avant suppression |
| **ThemeProvider BLOCKED** warnings | `custom-palette` et `setColors-manual` absents de `sourceRanks` | Ajout avec rank 1 |
| **SettingsComptes** checks hardcodés | `name === 'Thème Original'` dans 7 endroits | Remplacé par `is_system` flag |

### Nettoyage duplicates

| Supprimé | Raison |
|----------|--------|
| `public/pptx/icons/` (13 SVG) | Copies identiques de `src/icons/business/svg/`, non importées |
| `src/pptx/ops/addBusinessIcon.ts` | Version legacy (types `any`) — unifié dans `src/pptx/icons/addBusinessIcon.ts` |
| `supabase/functions/admin/` | Duplicate de `config/supabase/functions/admin/` (source de vérité README) |

### Améliorations qualité

| Changement | Détail |
|------------|--------|
| Types Edge Function | Interfaces `ReportRow`, `ProfileRow`, `AuthUser` (fix 5 implicit `any`) |
| `tsconfig.json` local Deno | `config/supabase/functions/admin/tsconfig.json` — supprime erreurs IDE |
| `tsconfig.json` root | Ajout `exclude: ["config/supabase", "supabase"]` |
| ESLint plugin `ser1-colors` | Exception `rgba(0,0,0,*)` pour shadows/overlays (conforme §5.3) |
| `addBusinessIcon.ts` unifié | Ajout `addBusinessIconDirect()` (API directe) + alias `ICON_SIZES` |

### Fichiers modifiés
- `config/supabase/functions/admin/index.ts` — get_original_theme, delete_theme, update_theme, types
- `src/auth/AuthProvider.tsx` — handleInvalidRefreshToken
- `src/settings/ThemeProvider.tsx` — sourceRanks complété
- `src/pages/Sous-Settings/SettingsComptes.jsx` — is_system checks
- `src/pptx/icons/addBusinessIcon.ts` — addBusinessIconDirect, ICON_SIZES
- `src/pptx/structure/slideTypes.ts` — import migré vers icons/
- `tools/eslint-plugin-ser1-colors/index.js` — exception rgba(0,0,0,*)
- `tsconfig.json` — exclude ajouté

### Déploiement
Edge Function déployée via CLI : `npx supabase functions deploy admin --project-ref xnpbxrqkzgimiugqtago --workdir config`

---

## 2026-02-05 — Phase 1 Raffinements SettingsComptes

### Objectif
Affiner l'UX de la page SettingsComptes selon les standards Premium / Gestion Privée.

### Changements
| Élément | Avant | Après |
|---------|-------|-------|
| **Badge Signalements** | "X" + texte "Y non lu" redondant | Badge unique avec indicateur visuel (point) et tooltip complet |
| **Badge SYS** | Risque de troncature par bouton édition | `flex-wrap: wrap` sur le conteneur de nom |
| **Bouton Rafraîchir** | Texte "Rafraîchir" style inline | Bouton icône premium avec tooltip "Rafraîchir la liste" |
| **Input fichier logo** | Input natif non-stylé | Bouton "Choisir une image..." + input caché + affichage nom fichier |

### Fichiers modifiés
- `src/pages/Sous-Settings/SettingsComptes.jsx` — Refinements UX (signalements, refresh, file input)
- `src/pages/Sous-Settings/SettingsComptes.css` — Styles pour unread-dot, badge amélioré

---

## 2026-02-05 — Refonte UI Settings "Gestion Privée"

### Objectif
Aligner toutes les pages de configuration sur le Design System "Premium / Gestion Privée" avec les règles strictes de la Gouvernance UI et Couleurs.

### Principes appliqués
| Principe | Implémentation |
|----------|----------------|
| **Hiérarchie Profondeur** | Fond C7 → Cartes Blanc (Niveau 1) → Inputs Blancs |
| **Inputs** | TOUJOURS `#FFFFFF` + border C8, focus C2 + ring C4 |
| **Modales** | Panel `#FFFFFF` + overlay `rgba(0,0,0,0.5)` + shadow-lg |
| **Badges** | Style "Pill" (`border-radius: 999px`) + outline design |
| **Tableaux** | Header C7 + rows Blanc/C7 zebra + ombre subtile |

### Fichiers modifiés

#### Phase 1 — CSS Global (Inputs Blancs)
- `src/pages/Sous-Settings/SettingsImpots.css` — Inputs blancs + focus ring
- `src/pages/Sous-Settings/SettingsFiscalites.css` — Inputs blancs + focus ring
- `src/pages/Sous-Settings/SettingsComptes.css` — Modales blanches, inputs blancs

#### Phase 2 — SettingsComptes Premium
- `src/pages/Sous-Settings/SettingsComptes.css` — Cards blanches, badges Pill, tableau premium
- `src/pages/Sous-Settings/SettingsComptes.jsx` — SYS badge CSS class, cleanup inline styles

#### Phase 3 — Hiérarchie Blocs Fiscaux
- `src/pages/Sous-Settings/SettingsFiscalites.css` — `.income-tax-block` accent gauche, cards blanches
- `src/pages/Sous-Settings/SettingsImpots.css` — `.income-tax-block` accent gauche C4

#### Phase 4 — Finalisation
- `src/pages/Sous-Settings/SettingsBaseContrats.jsx` — Placeholder premium card
- `src/pages/Sous-Settings/SettingsTableMortalite.jsx` — Placeholder premium card

### Documentation créée
- `docs/design/ui-governance.md` — Standards "Gestion Privée" (Layout, Inputs, Typo, Composants)
- README.md mis à jour avec liens vers UI Governance

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
git log --oneline --since="2025-01-01" --grep="fix\|feat\|chore" > docs/history/full-git-history.txt
```
