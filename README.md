# SER1 — Audit Patrimonial Express + Stratégie Guidée

**Dernière mise à jour : 2026-02-10 (Europe/Paris)**

Application web interne pour CGP : audit patrimonial, stratégie guidée, simulateurs IR/Placement/Crédit, exports PPTX/Excel.

**Stack** : React 18 + Vite 5 + Supabase (Auth/DB/Storage/Edge Functions) + Vercel.  
**Tests** : exécutés via `npm run test` / `npm run check` (voir CI / sortie console).  
**Historique** : [docs/CHANGELOG.md](docs/CHANGELOG.md)  
**Roadmap** : [docs/ROADMAP_SAAS_V1.md](docs/ROADMAP_SAAS_V1.md)
**Archive (unique)** : [docs/ARCHIVE.md](docs/ARCHIVE.md) — *phases clôturées + legacy + runbooks/evidence (ne pas créer d'autres fichiers d'archive)*
**Debug flags** : [docs/runbook/debug.md](docs/runbook/debug.md)  
**🎨 Couleurs** : [docs/design/color-governance.md](docs/design/color-governance.md) — *source de vérité unique (tokens C1-C10)*  
**📐 UI Governance** : [docs/design/ui-governance.md](docs/design/ui-governance.md) — *Standards "Gestion Privée" (Layout, Inputs, Typo)*  
**🛠️ Contribuer** : [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) — *Workflow Git, conventions, quality gates*

---

## 🌍 Environnement Local

### Configuration requise
**Prérequis système** :
- Node.js 22.x (`.nvmrc` + `package.json > engines`)
- Docker Desktop (recommandé pour développement local Supabase)

**Variables d'environnement** :
Copier `.env.example` vers `.env.local` et configurer :

```bash
# Variables Supabase (obligatoires)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme

# Credentials E2E (optionnel, pour tests authentifiés)
E2E_EMAIL=votre-email-test@exemple.com
E2E_PASSWORD=votre-mot-de-passe-test
```

**Accès Supabase** :
- **Dashboard** : https://supabase.com/dashboard (interface web)
- **CLI** : `supabase --version` (>= 2.75.0)
- **Projet lié** : `SER1-Simulator` (West EU/Paris)
- **Référence** : `xnpbxrqkzgimiugqtago`

### Lancement local
```bash
npm install          # Install dependencies
npm run dev          # Serveur développement (http://localhost:5173)
npm run build        # Build production
npm run preview      # Preview build (http://localhost:4173)
```

### Tests E2E locaux
```bash
# Sans authentification (tests smoke uniquement)
npm run test:e2e

# Avec authentification (credentials dans .env.local)
E2E_EMAIL="test@example.com" E2E_PASSWORD="password123" npm run test:e2e
```

### Debug
- **Vite dev** : `npm run dev` → console et logs détaillés
- **Playwright** : `npm run test:e2e:ui` → interface debug
- **Build** : `npm run build` → erreurs de compilation visibles

---

## � Sécurité (rappel)

- **Interdit** : committer des outputs runtime bruts (SQL logs, dumps HTTP, logs copiés-collés).
- **Autorisé** : templates `*.example` + redactions (status codes, compteurs, PASS/FAIL).
- Avant PR/merge :
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\tools\scripts\pre-merge-check.ps1
  ```

---

## �🛠️ Gestion Supabase

### Commandes CLI essentielles
```bash
# Vérifier la connexion et les projets
supabase projects list
supabase status

# Synchroniser le schéma distant
supabase db remote commit --linked    # Pull schema depuis distant
supabase migration list               # Voir l'historique des migrations

# Développement local (Docker requis)
supabase start                       # Démarrer services locaux
supabase db reset                    # Reset base locale avec migrations
supabase stop                        # Arrêter services locaux
```

> Note: le seed Supabase (`db.seed`) est volontairement désactivé tant qu'aucun `seed.sql` minimal n'est défini.

> Windows: `supabase functions serve <name>` peut rester en process.
> - Stop recommandé: **Ctrl+C** dans le terminal.
> - Dernier recours: `taskkill` (si le terminal est bloqué).

### Structure des tables principales
| Table | Usage | Champs clés |
|-------|-------|-------------|
| `profiles` | Utilisateurs et rôles | `id`, `email`, `role`, `cabinet_id` |
| `cabinets` | Cabinets médicaux | `id`, `name`, `default_theme_id`, `logo_id` |
| `themes` | Thèmes de personnalisation | `id`, `name`, `palette`, `is_system` |
| `ui_settings` | Préférences utilisateur (V5) | `theme_mode`, `preset_id`, `my_palette` |
| `logos` | Stockage des logos | `id`, `sha256`, `storage_path`, `mime` |
| `issue_reports` | Rapports de problèmes | `user_id`, `page`, `title`, `status` |

### Architecture V5 des thèmes
Le système utilise 3 modes avec priorité :
- **`cabinet`** : Thème du cabinet de l'utilisateur
- **`preset`** : Thème prédéfini (ex: `gold-elite`)  
- **`my`** : Palette personnalisée utilisateur

**Fichiers clés** :
- `src/settings/presets.ts` — Définition des presets
- `src/settings/ThemeProvider.tsx` — Logique de résolution
- `src/pages/Settings.jsx` — Interface de sélection

### Dépannage Supabase
| Problème | Solution |
|----------|----------|
| Docker non trouvé | Installer Docker Desktop (AMD64) |
| API key invalide | Régénérer depuis dashboard Supabase |
| Migration manquante | `supabase db remote commit --linked` |
| CLI non reconnue | Redémarrer terminal après installation |

---

### Harmonisation typographique & Premium Cards — Settings
**Objectif** : Uniformiser titres et sections Settings sur le pattern premium de `Settings.jsx`.

**Token titre** : `.settings-premium-title` (18px / 500 / c10 / letter-spacing -0.01em)
**Composant carte** : `src/components/settings/SettingsSectionCard.jsx` — carte blanche + badge icône + titre + actions
**Gouvernance** : Voir [docs/design/ui-governance.md §3bis](docs/design/ui-governance.md) pour les specs complètes.

| Élément | Implémentation |
|---------|----------------|
| Titres accordéons (14 titres) | Classe `.settings-premium-title` sur `<span>` |
| Sections Comptes (3 sections) | Composant `SettingsSectionCard` (carte + icône + titre) |

**Fichiers clés** :
- `src/components/settings/SettingsSectionCard.jsx` — Composant réutilisable
- `src/pages/Sous-Settings/SettingsComptes.jsx` — 3 sections premium cards
- `src/pages/Sous-Settings/SettingsPrelevements.jsx` — 3 titres accordéons
- `src/pages/Sous-Settings/SettingsImpots.jsx` — 6 titres accordéons
- `src/pages/Sous-Settings/SettingsShared.css` — CSS partagé (accordion, field-row, table, feedback)

## Dernières évolutions (2026-02-11)

### Migration RLS — Alignement `is_admin()` sur `tax_settings` & `ps_settings`
**Objectif** : Harmoniser la sécurité RLS sur les trois tables de paramètres fiscaux.

| Table | Avant | Après |
|-------|-------|-------|
| `tax_settings` | Policy `profiles.role = 'admin'` | `public.is_admin()` (comme `fiscality_settings`) |
| `ps_settings` | Policy `profiles.role = 'admin'` | `public.is_admin()` (comme `fiscality_settings`) |
| `fiscality_settings` | Déjà `public.is_admin()` | Inchangé |

**Migration** : `supabase/migrations/20260211000100_harmonize_rls_tax_ps_is_admin.sql` — versionnée et appliquée en production.

### Référentiel Produits — `/settings/base-contrat`
**Nouveau** : Interface d'administration du catalogue de produits d'investissement.

| Fonction | Admin |
|----------|-------|
| Ajouter un produit | Clé, libellé, détenteurs (PP/PM/PP+PM), nature |
| Éditer | Modification métadonnées |
| Nouvelle version | Date d'entrée en vigueur + copie des règles |
| Clôturer | Date de clôture, déplacement section "Clôturés" |
| Enregistrer | Upsert global `fiscality_settings` id=1 |

**Documentation** : [docs/fiscality-product-catalog.md](docs/fiscality-product-catalog.md)

### Centralisation des Defaults — `src/constants/settingsDefaults.ts`
**Source unique de vérité** pour les valeurs par défaut des trois domaines :

- `DEFAULT_TAX_SETTINGS` — barème IR 2024/2025, PFU, CEHR, CDHR, IS, DMTG
- `DEFAULT_PS_SETTINGS` — PS patrimoine, PS retraites, seuils RFR
- `DEFAULT_FISCALITY_SETTINGS` — assuranceVie (V1), perIndividuel (V1)

**Impact** : Suppression de ~700 lignes de duplication dans `fiscalSettingsCache.js`, `irEngine.js`, `usePlacementSettings.js`, `SettingsImpots.jsx`, `SettingsPrelevements.jsx`, `SettingsFiscalites.jsx`.

---

## Dernières évolutions (2026-02-09)

### Refactoring Simulateur Crédit — Architecture Premium
**Objectif** : Moderniser le simulateur de crédit avec l'architecture modulaire "Premium" (même pattern que PlacementV2 et Settings).

| Aspect | Avant (legacy) | Après (CreditV2) |
|--------|----------------|------------------|
| **Architecture** | Monolithique `Credit.jsx` (1495 lignes) | Modulaire : components/hooks/utils |
| **State** | 15+ useState individuels | State centralisé `pret1/pret2/pret3` + helpers |
| **Calculs** | Inline dans le composant | Hook dédié `useCreditCalculations` |
| **Exports** | Inline dans le composant | Hook dédié `useCreditExports` |
| **Style** | CSS legacy `Credit.css` | CSS BEM `CreditV2.css` (palette C1-C10) |
| **UI** | Layout legacy | Grid premium 2-colonnes, sticky summary |

**Architecture créée** :
```
src/pages/credit/
├── Credit.jsx                 # Orchestrateur (369 lignes)
├── components/
│   ├── CreditHeader.jsx         # Header + toggle Mensuel/Annuel
│   ├── CreditLoanTabs.jsx       # Onglets Prêt 1/2/3
│   ├── CreditLoanForm.jsx       # Formulaire réutilisable
│   ├── CreditSummaryCard.jsx    # Carte synthèse sticky
│   ├── CreditScheduleTable.jsx  # Échéancier (agrégation annuelle)
│   ├── CreditPeriodsTable.jsx   # Répartition par période
│   ├── CreditInputs.jsx         # Inputs premium (Euro, %, mois)
│   └── CreditV2.css             # 580 lignes CSS C1-C10
├── hooks/
│   ├── useCreditCalculations.js # Calculs échéanciers + lissage
│   └── useCreditExports.js      # Excel + PPTX
└── utils/
    ├── creditNormalizers.js     # State + migration legacy
    └── creditFormatters.js      # Formatters + parsers
```

**Fichiers supprimés** :
- `src/pages/Credit.jsx` (legacy, 1495 lignes)
- `src/pages/Credit.css` (legacy)

**Parité fonctionnelle** : 16/16 features (prêts multiples, lissage, exports, reset, E2E IDs)

**Migration** : `normalizeLoadedState()` migre automatiquement l'ancien format `sessionStorage`.

### Historique du PASS — Déplacement et dynamisation
**Objectif** : Rendre l'historique du PASS (8 dernières valeurs) dynamique et le déplacer de « Fiscalités contrats » vers « Paramètres sociaux ».

| Avant | Après |
|-------|-------|
| Tableau statique dans `SettingsFiscalites.jsx` | Accordéon dynamique dans `SettingsPrelevements.jsx` (premier bloc) |
| Données dans `fiscality_settings.data.passHistory` | Table dédiée `public.pass_history` |
| Validation manuelle (ordre, 8 lignes) | Rollover automatique au 1er janvier via RPC `ensure_pass_history_current()` |

**Fichiers clés** :
- `database/migrations/202602060001_create_pass_history.sql` — Table, RLS, seed, trigger, RPC
- `src/components/settings/PassHistoryAccordion.jsx` — Composant accordéon autonome (fetch + upsert)
- `src/pages/Sous-Settings/SettingsPrelevements.jsx` — Intégration en première position
- `src/pages/Sous-Settings/SettingsFiscalites.jsx` — Retrait du bloc PASS + validation associée

### Refactoring Settings — Composants génériques (Phase 1→3)
**Objectif** : Réduire la complexité et la duplication des pages Settings (Prelevements, Impots, Fiscalites) sans régression fonctionnelle.

| Phase | Livrable | Lignes impactées |
|-------|----------|------------------|
| **Phase 1** | `settingsHelpers.js` — `numberOrEmpty`, `textOrEmpty`, `createFieldUpdater` | +50 |
| **Phase 2** | `SettingsFieldRow.jsx` + `SettingsYearColumn.jsx` — Lignes formulaire génériques | -200 |
| **Phase 3** | `SettingsTable.jsx` — Tableaux éditables pilotés par schéma | -890 |
| **Fiscalites** | Application des composants aux sections AV + PER | -799 |

**Résultat** : 5 856 → 4 729 lignes (-19%), 4 composants réutilisables créés.

**Fichiers clés** :
- `src/utils/settingsHelpers.js` — Helpers de mutation state
- `src/components/settings/SettingsFieldRow.jsx` — Ligne label+input+unité
- `src/components/settings/SettingsYearColumn.jsx` — Wrapper colonne année
- `src/components/settings/SettingsTable.jsx` — Tableau éditable générique
- `src/pages/Sous-Settings/SettingsFiscalites.jsx` — Utilisation intensive des composants

### Référentiel contrats V3 — `base_contrat_settings`
**Objectif** : Page `/settings/base-contrat` = catalogue administrable des produits d'investissement (AV, CTO, PEA, PER) avec règles fiscales versionnées par phase (constitution, sortie, décès).

| Composant | Fichier |
|-----------|---------|
| **Types** | `src/types/baseContratSettings.ts` |
| **Cache dédié** | `src/utils/baseContratSettingsCache.ts` (TTL 24h, localStorage, event `ser1:base-contrat-updated`) |
| **Hook** | `src/hooks/useBaseContratSettings.ts` |
| **Page UI** | `src/pages/Sous-Settings/BaseContrat.tsx` |
| **Labels FR** | `src/constants/baseContratLabels.ts` |
| **Templates** | `src/constants/baseContratTemplates.ts` (AV/CTO/PEA/PER) |
| **Adapter** | `src/utils/baseContratAdapter.ts` — `extractFromBaseContrat()` |
| **Migration** | `supabase/migrations/20260211001000_create_base_contrat_settings.sql` |

**Conventions** :
- **$ref** : format `$ref:tax_settings.pfu.current.rateIR` (snake_case table, camelCase path)
- **Versioning** : `product.rulesets[]` trié `effectiveDate` DESC ; `rulesets[0]` = version active (éditable), anciennes en lecture seule
- **Feature flag** : `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT=true` (ON par défaut, fallback ON si variable absente). Mettre explicitement `false` pour forcer le legacy `extractFiscalParams()`
- **Golden snapshot** : `extractFromBaseContrat.test.ts` vérifie les mêmes 16 valeurs que `extractFiscalParams.test.ts`
- **AV décès tranche 2** : 31.25 % (aligné fixtures, pas 35 % de settingsDefaults)

> Voir `docs/design/base-contrat-spec.md` pour la spécification complète.

### Fix Edge Function `get_original_theme` — 404
**Cause** : Mismatch nom hardcodé `'Thème Original'` dans le code vs `'Thème Origine'` en DB.
**Fix** : Requête par `is_system=true` (marqueur stable) au lieu du nom hardcodé. Idem pour `update_theme`.

### Fix Auth 400 — Invalid Refresh Token
**Cause** : Aucun handler pour les refresh tokens invalides/expirés dans `AuthProvider`.
**Fix** : Détection `TOKEN_REFRESHED` sans session + `getSession()` error → `signOut()` propre + clear storage. Guard anti-boucle.

### Fix `delete_theme` — 400 cabinet assigné
**Cause** : Edge Function bloquait la suppression si un cabinet référençait le thème, alors que le schéma DB a `ON DELETE SET NULL`.
**Fix** : Désassignation automatique des cabinets (`default_theme_id = null`) avant suppression.

### Fix ThemeProvider rank warnings
**Cause** : `custom-palette` et `setColors-manual` absents de `sourceRanks` → rank 0 par défaut → bloqués.
**Fix** : Ajout des deux sources avec rank 1 dans la map.

### Nettoyage duplicates & typage
- **Supprimé** : 13 SVG dead dans `public/pptx/icons/` (copies identiques de `src/icons/business/svg/`)
- **Supprimé** : `src/pptx/ops/addBusinessIcon.ts` (version legacy) — unifié dans `src/pptx/icons/addBusinessIcon.ts`
- **Supprimé** : ancien emplacement Edge Function (legacy workdir) — remplacé par `supabase/functions/admin/`
- **Ajouté** : Types `ReportRow`, `ProfileRow`, `AuthUser` dans Edge Function (fix 5 implicit `any`)
- **Ajouté** : `tsconfig.json` local dans `supabase/functions/admin/` (supprime erreurs Deno IDE)
- **Fix** : ESLint plugin `ser1-colors` — exception `rgba(0,0,0,*)` pour shadows/overlays (conforme §5.3)
- **Fix** : `SettingsComptes.jsx` — remplacement de tous les checks `name === 'Thème Original'` par `is_system`

**Fichiers clés** :
- `supabase/functions/admin/index.ts` — Edge Function (get_original_theme, delete_theme, update_theme)
- `src/auth/AuthProvider.tsx` — Gestion refresh token invalide
- `src/settings/ThemeProvider.tsx` — sourceRanks complété
- `src/pages/Sous-Settings/SettingsComptes.jsx` — Checks `is_system` au lieu de nom hardcodé
- `src/pptx/icons/addBusinessIcon.ts` — Version unifiée (typée + API directe)

---

## Évolutions précédentes (2026-02-01)

### Refonte Signalements — Intégration dans Settings
**Objectif** : Simplifier l'UX en regroupant les signalements dans l'onglet Généraux.

| Avant | Après |
|-------|-------|
| Page séparée `/settings/signalements` | Bloc rétractable sous "Personnalisation avancée du thème" |
| FAB/Modal sur simulateurs | Formulaire unique dans Settings |
| `metadata` (bug DB) | `meta` (nom colonne correct) |
| Couleurs hardcodées | Variables CSS uniquement |

**Fichiers clés** :
- `src/components/settings/SignalementsBlock.jsx` — Composant réutilisable
- `src/constants/reportPages.js` — Centralisation des pages signalables
- `src/pages/Settings.jsx` — Intégration du bloc rétractable

### Refonte Navigation Settings — Source unique de vérité
**Objectif** : Éviter les oublis lors de l'ajout de pages Settings.

| Avant | Après |
|-------|-------|
| `SettingsNav.jsx` (fichier mort, non importé) | Supprimé |
| `TABS` inline dans `SettingsShell.jsx` | `SETTINGS_ROUTES` dans `src/constants/settingsRoutes.js` |
| Définition en 2 endroits | 1 seul endroit (config → nav + routing) |

**Ajout page Settings** : Modifier uniquement `src/constants/settingsRoutes.js` :
```javascript
export const SETTINGS_ROUTES = [
  // ... routes existantes
  {
    key: 'nouvellePage',
    label: 'Nouvelle Page',
    path: 'nouvelle-page',
    component: SettingsNouvellePage,
    adminOnly: true, // optionnel
  },
];
```

---

## 1. Architecture & Sources de vérité

```
src/
  main.jsx              # Bootstrap React + CSS vars
  App.jsx               # Routes lazy + gating
  settings/ThemeProvider.tsx    # Thème, RPC logos cabinet
  settings/theme.ts     # SOURCE DE VÉRITÉ C1-C10 (DEFAULT_COLORS)
  pages/                # PlacementV2, Credit, Ir, Settings
  pptx/                 # Export Serenity (design system)
  utils/xlsxBuilder.ts  # Export Excel

supabase/functions/admin/index.ts  # Edge Function admin (source de vérité unique)
supabase/functions/admin/tsconfig.json  # TS config Deno (supprime erreurs IDE)
api/admin.js           # Proxy Vercel (évite CORS)

supabase/migrations/         # Source unique : migrations versionnées (SQL)
```

### Source de vérité unique pour le thème

**`src/settings/theme.ts`** contient `DEFAULT_COLORS` - la source de vérité unique pour les tokens C1-C10 :
- Consommé par `ThemeProvider.tsx` (injection CSS variables)
- Consommé par `resolvePptxColors.ts` (thème PPTX)
- Fallback CSS dans `styles.css` (lignes 14-23) - synchronisé avec DEFAULT_COLORS

**Règle**: Toute modification des couleurs par défaut doit passer par `src/settings/theme.ts`.

---

## 2. Thèmes & Branding — RÈGLES CRITIQUES

### 2.1 Tri-état cabinetColors
```typescript
// undefined = pas encore chargé (utiliser cache si dispo)
// null      = pas de cabinet confirmé (ne PAS utiliser cache)
// ThemeColors = cabinet existe
```

### 2.2 Hiérarchie sources (rank)
| Source | Rank | Usage |
|--------|------|-------|
| cabinet | 3 | PPTX toujours, UI si themeSource=cabinet |
| original-db | 2 | Fallback sans cabinet (Thème Original SYS) |
| custom/ui_settings | 1 | UI si user choisit custom |
| default | 0 | Fallback ultime |

### 2.3 RÈGLES MÉTIER UI vs PPTX
| Cas | UI | PPTX |
|-----|-----|------|
| **Sans cabinet** + themeSource=cabinet | Thème Original DB | Thème Original DB |
| **Sans cabinet** + custom + scope=ui-only | custom | Thème Original DB |
| **Sans cabinet** + custom + scope=all | custom | custom |
| **Avec cabinet** | selon settings | cabinet TOUJOURS |

**Fichiers clés** :
- `src/settings/ThemeProvider.tsx` — logique thème + RPC
- `src/pptx/theme/resolvePptxColors.ts` — résolution PPTX
- `src/pages/Sous-Settings/SettingsComptes.jsx` — édition Thème Original

---

## 3. Sécurité & Admin

### 3.1 Source de vérité admin
**JWT `app_metadata` uniquement** — `app_metadata.role` = `'admin'` (jamais `user_metadata` pour la sécurité)

| Couche | Vérification |
|--------|--------------|
| RLS DB | `public.is_admin()` lit `app_metadata` uniquement |
| Edge Function | `user.app_metadata?.role` uniquement (ligne 154) |
| Frontend | `useUserRole()` + `AuthProvider.computeRole()` lisent `app_metadata.role` uniquement |
| Pages Settings | Toutes utilisent `useUserRole()` (pas d'inline check `user_metadata`) |

> ⚠️ `user_metadata` est **désactivé pour l'autorisation** — modifiable par l'utilisateur (risque élévation privilèges). Voir [docs/technical/security-user-metadata-guidelines.md](docs/technical/security-user-metadata-guidelines.md).

### 3.2 Edge Function admin
**Code source unique** : `supabase/functions/admin/index.ts`

> ⚠️ **Pas de duplicate** — le dossier `supabase/functions/admin/` est la **source de vérité** (organisation standard). Aucun autre emplacement ne doit exister.

**Déploiement** :
```powershell
npx supabase functions deploy admin --project-ref PROJECT_REF
```

⚠️ Déployer depuis la racine (organisation standard Supabase: `supabase/config.toml` + `supabase/functions/*`).

**Thème système** : La requête `get_original_theme` utilise `is_system=true` (pas de nom hardcodé). Compatible avec tout nom DB.

### 3.3 Protection mots de passe (Security Advisor)
**Leaked Password Protection** : Détection des mots de passe compromis via HaveIBeenPwned.org.
- **Disponibilité** : Plan Pro et supérieur uniquement
- **Emplacement** : Supabase Dashboard → Authentication → Policies → "Prevent use of leaked passwords"
- **Statut** : Warning Security Advisor normal si plan Free (fonctionnalité payante)

---

## 4. Supabase — RLS & Storage

### 4.1 RPC SECURITY DEFINER
- `get_my_cabinet_logo()` → retourne `{ storage_path, placement }` logo cabinet + position
- `get_my_cabinet_theme_palette()` → retourne palette JSONB

### 4.2 Bucket logos
- **Path** : `{cabinet_id}/{timestamp}-{hash}.{ext}`
- **Déduplication** : SHA256 via RPC
- **Chargement** : RPC → `storage.from('logos').download()` → base64 data-uri
- **Export PPTX** : Logo cabinet uniquement (via RPC `get_my_cabinet_logo`), pas de fallback `user_metadata` pour des raisons de sécurité

### 4.3 Checklist avant déploy
- [ ] Migration RPC appliquée
- [ ] Bucket `logos` créé
- [ ] Edge Function déployée (sans flag de workdir)
- [ ] Env vars Vercel : `SUPABASE_URL` + `SUPABASE_ANON_KEY`

---

## 5. Exports PPTX (Serenity)

### 5.1 Design System
- **Police** : Arial uniquement (`TYPO` in `src/pptx/designSystem/serenity.ts`)
- **Couleurs** : Thème dynamique c1-c10, blanc (#FFFFFF) autorisé
- **Langue** : `fr-FR` forcé via `addTextFr()`
- **Zones protégées** : Header/Footer gérés par helpers

### 5.2 Types de slides
| Type | Builder | Usage |
|------|---------|-------|
| COVER | `buildCover.ts` | Logo, titre, date, conseiller |
| CHAPTER | `buildChapter.ts` | Image + titre + accent line |
| CONTENT | `buildContent.ts` | KPIs, graphiques |
| SYNTHESIS | `build*Synthesis.ts` | Slide principale simulateur |
| END | `buildEnd.ts` | Disclaimer légal |

### 5.3 Règles immuables
1. Pas d'hex codé en dur sauf : blanc (#FFFFFF), WARNING (#996600), overlay/shadow `rgba(0,0,0,*)`
2. `resolvePptxColors()` source unique couleurs
3. Données PPTX = même source que UI (pas de recalc)
4. Pagination amortissement : max 14 lignes/slide
5. Icônes business : source unique `src/icons/business/svg/` + `businessIconLibrary.ts` (pas de copie dans `public/`)

---

## 6. Dépendances & Sécurité

### 6.1 Gestion des warnings npm
**Problème** : Dépendances transitives dépréciées (`inflight@1.0.6`, `glob@7.2.3`) avec vulnérabilités sécurité.

**Solution** : Overrides npm dans `package.json` :
```json
{
  "overrides": {
    "glob": "13.0.1"
  }
}
```

**Impact** : Élimine les warnings de sécurité et fuites mémoire dans le build Vercel.

### 6.2 Scripts d'analyse
```powershell
npm run check:circular  # Détection dépendances circulaires (madge)
npm run check:unused    # Rapport dépendances inutilisées (depcheck)
npm run analyze         # Visualisation bundle (vite-bundle-visualizer)
```

---

## 7. Commandes & Développement

### 7.1 Prérequis
- Node.js 22.x (`.nvmrc` + `package.json > engines`)
- Docker Desktop (AMD64) pour développement local Supabase
- Variables `.env.local` : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 7.2 Scripts
```powershell
npm install
npm run dev          # localhost:5173
npm run build        # dist/
npm run test         # Tests unitaires Vitest (voir sortie console)
npm run lint         # ESLint avec plugin ser1-colors (gouvernance couleurs)
npm run typecheck    # TypeScript --noEmit (0 erreur obligatoire)
```

### 7.3 Quality Gates (avant chaque commit/PR)
Tous les checks doivent passer :
```powershell
npm run check      # Tous les checks (lint + typecheck + test + build)
npm run lint       # ESLint uniquement
npm run typecheck  # TypeScript uniquement
npm test           # Tests unitaires
npm run build      # Build Vite
```

**Scripts d'analyse (optionnels) :**
```powershell
npm run check:circular  # Détection dépendances circulaires (madge)
npm run check:unused    # Rapport dépendances inutilisées (depcheck)
npm run analyze         # Visualisation bundle (vite-bundle-visualizer)
npm run test:e2e        # Tests E2E Playwright (smoke tests)
```
> ⚠️ La CI bloque les PR si un gate échoue. Voir [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md).

### 7.4 Githooks et scripts de workflow

**Installation githooks** (une fois par clone) :
```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-githooks.ps1
```

**Vérification** :
```powershell
git config --get core.hooksPath
# → .githooks
```

**Fonctionnement** :
- Bloque le push direct depuis ou vers `main`/`master`
- Message clair avec instructions pour créer une branche + PR

**Override temporaire** (urgence uniquement) :
```powershell
ALLOW_PUSH_MAIN=1 git push origin main
```

**Désinstallation** :
```powershell
git config --unset core.hooksPath
```

**Pre-merge check** (avant merge manuel) :
```powershell
powershell -ExecutionPolicy Bypass -File scripts/pre-merge-check.ps1
```

---

## 8. Debug & Logs

### 8.1 Politique console
- `console.error/warn` : erreurs réelles uniquement
- `console.log/info/debug/trace` : **interdits** sauf derrière flag explicite

### 8.2 Flags DEBUG (localStorage)
```javascript
localStorage.setItem('DEBUG_AUTH', 'true')
localStorage.setItem('DEBUG_PPTX', 'true')
localStorage.setItem('DEBUG_THEME_BOOTSTRAP', 'true')
```

---

## 9. Troubleshooting (9 cas)

| Symptôme | Cause | Fix |
|----------|-------|-----|
| RPC 404 `get_my_cabinet_logo` | Migration non appliquée | Appliquer `database/migrations/add-rpc-*.sql`, attendre 1-2min |
| Edge Function 400 (HTML Cloudflare) | Header Host manquant | Vérifier proxy `api/admin.js` |
| Edge Function 404 `get_original_theme` | Nom thème hardcodé vs DB | Fixé : requête par `is_system=true` |
| Auth 400 `Invalid Refresh Token` | Token stale, pas de handler | Fixé : `AuthProvider` force signOut propre |
| `delete_theme` 400 cabinet assigné | Edge Function bloquait | Fixé : désassignation auto avant suppression |
| Flash thème au F5 | CSS `:root` écrase vars | Bootstrap head dans `index.html` + `ThemeProvider` vérifie `window.__ser1ThemeBootstrap` |
| Build Vercel Node 24.x | `engines: ">=22"` trop permissif | Pin strict `"22.x"` dans `package.json` |
| Logo PPTX manquant | Bucket `logos` non créé | Créer bucket + appliquer migrations |
| npm warnings inflight/glob | Dépendances transitives dépréciées | Overrides npm dans `package.json` (glob@13.0.1) |
| **Supabase CLI non reconnu** | Installation récente | Redémarrer terminal ou vérifier PATH |
| **Docker Desktop requis** | Développement local | Installer Docker Desktop (AMD64) et démarrer |
| **API key invalide** | Clé expirée/régénérée | Régénérer depuis dashboard Supabase et mettre à jour `.env.local` |

---

## 10. Liens documentation

- [Historique détaillé](docs/CHANGELOG.md) — post-mortems, évolutions
- [Sécurité admin & rôles](docs/technical/security-user-metadata-guidelines.md) — Référentiel autorisation
- [Gouvernance couleurs CSS](docs/design/color-governance.md) — Règles couleurs CSS

### 🎨 Design System & Gouvernance

| Document | Description | Usage |
|----------|-------------|-------|
| **[Gouvernance Couleurs](docs/design/color-governance.md)** | Règles complètes C1-C10, exceptions, contraste, mapping sémantique | **OBLIGATOIRE** avant toute modif couleur |
| **[Gouvernance UI](docs/design/ui-governance.md)** | Standards Layout, Inputs, Typo, Composants "Premium" | **OBLIGATOIRE** pour toute nouvelle page |
| **[Audit Couleurs](docs/design/color-governance.md)** | Historique des écarts identifiés et plan de remédiation (section annexe) | Référence historique |

**⚠️ RÈGLES ABSOLUES** :
1. Aucune couleur hardcodée sauf WHITE (#FFFFFF) et WARNING (#996600). Voir [gouvernance couleur](docs/design/color-governance.md).
2. **INPUTS SUR FOND BLANC** obligatoirement pour la lisibilité. Voir [gouvernance UI](docs/design/ui-governance.md).
3. **TOUS LES MESSAGES UTILISATEUR EN FRANÇAIS** : erreurs API, notifications, alerts, toasts, confirmations. Pas d'anglais dans l'interface.

---

*README simplifié — voir [docs/CHANGELOG.md](docs/CHANGELOG.md) pour l'historique complet.*
