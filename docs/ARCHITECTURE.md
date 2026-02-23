# ARCHITECTURE (source de vérité)

## But
Expliquer **comment le repo est organisé** et où modifier quoi (frontend, engine, exports, Supabase, thèmes).

## Audience
Dev qui doit intervenir sur une feature, un export, un thème, ou Supabase.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : carte des dossiers, points d’entrée, flux principaux, conventions clés (SaaS).
- ❌ Ne couvre pas : procédures de debug/opérations (voir `docs/RUNBOOK.md`).

## Sommaire
- [Stack](#stack)
- [Structure du repo](#structure-du-repo)
- [Points d’entrée & flux](#points-dentrée--flux)
- [Supabase: données, RLS, edge functions](#supabase-données-rls-edge-functions)
- [Thème & branding](#thème--branding)
- [Exports (PPTX/Excel)](#exports-pptxexcel)
- [Références](#références)

---

## Stack
- React 18 + Vite 5 + TypeScript strict
- Supabase (Auth/DB/Storage/Edge Functions)
- Exports : PptxGenJS + JSZip (PPTX), OOXML via JSZip (XLSX)
- Tests : Vitest (+ Playwright E2E)

---

## Structure du repo
Repères (domain-first) :
- `src/engine/` : calculs métier purs (zéro React).
- `src/features/` : features UI (state, composants, handlers export).
- `src/pages/` : shells/pages legacy ou orchestrateurs (en cours de découpe).
- `src/settings/` : thème, presets, ThemeProvider.
- `src/pptx/` : pipeline PPTX (design system + slides + export).
- `supabase/` : edge functions + migrations.

Conventions clés :
- Nouveau code : TS/TSX.
- Fichiers >500 lignes = dette à découper (ticket).

### Conventions — Legacy / Spike / Raw

#### `legacy/`
**Pourquoi** : pendant la refonte `pages/` → `features/`, du code est temporairement isolé dans un dossier `legacy/` au sein de la feature. C'est une **dette assumée** pour permettre le **strangler refactor** incrémental.

**Règles d'usage** :
- **Pas de nouvelles features** dans `legacy/` — seul le code existant y vit.
- Tout nouveau code va dans `features/*` (ou `components/`, `hooks/`, etc.).
- Le dossier `legacy/` doit **diminuer** avec le temps, jamais croître.

**Critères de suppression** :
1. Plus aucun import runtime vers le dossier legacy :
   ```bash
   rg "features/placement/legacy" src --type tsx --type ts
   # → doit retourner vide
   ```
2. Le code utile est promu (refactorisé) vers la feature ou un module partagé.
3. `npm run check` passe sans erreur.

#### `__spike__` / `_raw`
**Pourquoi** : dossiers de travail temporaire (prototypes, assets bruts) non destinés à la prod.

**Règles d'usage** :
- **Jamais en prod** — ces dossiers vivent sous `src/` uniquement pendant la phase de prototypage.
- Chaque dossier doit être **audité** avant suppression/déplacement.

**Audit + cleanup (T6)** :
1. Lister les imports/usages réels :
   ```bash
   rg -n "(/|\\\\)__spike__(/|\\\\)" src --type tsx --type ts
   rg -n "(/|\\\\)_raw(/|\\\\)" src --type tsx --type ts
   ```
   Note : `_rawText` est une variable (ex: `apiAdmin.js`), sans lien avec le dossier `_raw/`.
2. Décision par fichier : `delete` (obsolète), ou `inline` (intégrer au code prod).
3. Après audit, supprimer de `src/` (ou intégrer au code prod si utile).

**Vérification post-cleanup** :
```bash
find src -type d \( -name "__spike__" -o -name "_raw" \)
# → doit retourner vide
```

### Debt registry (legacy / spike / raw) + Exit criteria

**Dettes actives :**

| Dette | Type | Où | Pourquoi | Règle | Exit criteria | Vérification |
|-------|------|-----|----------|-------|---------------|--------------|
| A | compat | `src/features/placement/legacy/` | Transition pour découpler features de l'ancien `pages/placement` | Pas de nouvelle feature dans legacy/ | `rg "features/placement/legacy" src` → 0 + npm run check PASS | `rg "features/placement/legacy" src --type tsx --type ts` |
| D | compat | `src/engine/*.ts` | `@deprecated` constants (ABATTEMENT_*, generate*Pptx) | Ne pas ajouter de nouveaux `@deprecated` | Migration vers nouveaux APIs | `rg "@deprecated" src/engine` (maintenir ou réduire) |

**Resolved (deleted) :**

| Dette | Type | Où | Pourquoi | Décision | Vérification |
|-------|------|-----|----------|----------|--------------|
| B | hygiène | `src/pptx/template/__spike__/` | Prototypes / essais PPTX | **DELETE** (0 usage) | `find src -type d -name "__spike__"` → 0 |
| C | hygiène | `src/icons/business/_raw/` | Sources brutes SVG | **DELETE** (0 usage) | `find src -type d -name "_raw"` → 0 |

**Règles "ne pas aggraver la dette" :**
- Pas de nouveaux imports vers `legacy/`
- Pas de nouveaux fichiers dans `__spike__` ou `_raw`
- Tout nouveau code va dans `features/*`, `components/`, `hooks/`, etc.

---

## Points d’entrée & flux
### Routing
- `src/routes/appRoutes.ts` (APP_ROUTES) : source de vérité des routes.
- `src/App.jsx` : rendu JSX des routes via `APP_ROUTES.map()`.

#### Routes Map (actuel)

Source (preuves) :
- Définitions des routes : `src/routes/appRoutes.ts` (APP_ROUTES)
- Redirections legacy : `src/routes/appRoutes.ts` (`kind: 'redirect'`)
- Rendu `<Routes>` : `src/App.jsx` (`APP_ROUTES.map(...)`)


| Route | Accès | Composant (runtime) | Fichier / provenance |
|------|-------|----------------------|----------------------|
| `/login` | public | `Login` | `src/pages/Login.jsx` (import direct) |
| `/forgot-password` | public | `ForgotPassword` | `src/pages/ForgotPassword.jsx` (import direct) |
| `/set-password` | public | `SetPassword` | `src/pages/SetPassword.jsx` (import direct) |
| `/reset-password` | public | `SetPassword` | `src/pages/SetPassword.jsx` (import direct) |
| `/` | privé | `Home` | `src/pages/Home.jsx` (import direct) |
| `/audit` | privé + lazy | `AuditWizard` | `src/features/audit/AuditWizard.tsx` (exporté via `src/features/audit/index.ts`) |
| `/strategy` | privé + lazy | `StrategyPage` | `src/pages/StrategyPage.jsx` (lazy) |
| `/sim/placement` | privé + lazy | `Placement` | `src/features/placement/PlacementPage.tsx` (exporté via `src/features/placement/index.ts`) |
| `/sim/credit` | privé + lazy | `Credit` | `src/pages/credit/Credit.jsx` (lazy) |
| `/sim/succession` | privé + lazy | `SuccessionSimulator` | `src/features/succession/SuccessionSimulator.tsx` (exporté via `src/features/succession/index.ts`) |
| `/sim/per` | privé + lazy | `PerSimulator` | `src/features/per/PerSimulator.tsx` (exporté via `src/features/per/index.ts`) |
| `/sim/epargne-salariale` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/tresorerie-societe` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/prevoyance` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/ir` | privé + lazy | `Ir` | `src/features/ir/IrPage.tsx` (exporté via `src/features/ir/index.ts`) |
| `/settings/*` | privé + lazy | `SettingsShell` | `src/pages/SettingsShell.jsx` (lazy) |
| `/placement` | redirect | `Navigate` → `/sim/placement` | compat legacy |
| `/credit` | redirect | `Navigate` → `/sim/credit` | compat legacy |
| `/prevoyance` | redirect | `Navigate` → `/sim/prevoyance` | compat legacy |

Vérification (commandes) :

```bash
# Liste des routes (paths)
rg -n "path:" src/routes/appRoutes.ts

# Liste des redirects legacy
rg -n "kind: 'redirect'" src/routes/appRoutes.ts

# Rendu JSX : App.jsx consomme APP_ROUTES
rg -n "APP_ROUTES\\.map" src/App.jsx
```

### Bootstrap auth → thème
- `src/main.jsx` → `AuthProvider` → `ThemeProvider` → `App`.

### Settings (admin)
- Navigation settings : `src/constants/settingsRoutes.js` (source unique).
- Pages : `src/pages/Sous-Settings/*`.

---

## Supabase: données, RLS, edge functions
### Règle SaaS
- **Branding = multi-tenant** (cabinets, profiles).
- **Règles fiscales + catalogue produits = GLOBAL** (pas de `cabinet_id`).

### Sécurité / RLS
- Rôle admin via `app_metadata.role`.
- SQL helper : `public.is_admin()`.
- Interdit : policies basées sur `user_metadata`.

Tables repères (haut niveau) :
- `profiles` (multi-tenant) : `cabinet_id`.
- `cabinets` (tenant) : `default_theme_id`, `logo_id`.
- `themes` : presets/système.
- `ui_settings` : préférences user (`theme_mode`, `preset_id`, `my_palette`).
- Settings GLOBAUX : `tax_settings`, `ps_settings`, `fiscality_settings`.
- Référentiel contrats (Base-Contrat) : `base_contrat_overrides`.

### Edge Function `admin`
- Source : `supabase/functions/admin/index.ts`.
- Contrat action : query `?action=...` ou body `{ action: "..." }`.

### Migrations
- Source de vérité : `supabase/migrations/`.

---

## Thème & branding
- ThemeProvider : `src/settings/ThemeProvider.tsx`.
- Presets : `src/settings/presets.ts`.
- Tokens UI : `src/settings/theme.ts` + `src/styles.css`.

Règles fonctionnelles : voir `docs/GOUVERNANCE.md`.

### Thème V5 (3 modes)
Source de vérité : DB (`ui_settings`).

- `cabinet` : branding du cabinet
- `preset` : `preset_id`
- `my` : `my_palette`

Invariants (à ne pas casser) :
- Un preset ne modifie jamais `my_palette`.
- `localStorage` sert uniquement d'anti-flash (miroir), pas de source de vérité.

---

## Exports (PPTX/Excel)
### PPTX
- Orchestrateur : `src/pptx/export/exportStudyDeck.ts`.
- Design system : `src/pptx/designSystem/serenity.ts`.
- Slides : `src/pptx/slides/`.

Assets statiques (images) :
- Chapitres PPTX : `public/pptx/chapters/ch-01.png` .. `ch-09.png` (bibliothèque).
- Conserver la nomenclature à 2 chiffres et le format PNG.
- Objectif : préserver la qualité de rendu PPTX (ratio/coins/anti-artefacts).

Budgets (guideline, non bloquant) :
- Cible : <= 1.2 Mo / image ; alerte : > 1.6 Mo / image
- Cible : <= 9 Mo total ; alerte : > 12 Mo total

Vérification (PowerShell) :

```powershell
Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Sort-Object Length -Descending |
  Select-Object Name,Length

(Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Measure-Object -Property Length -Sum).Sum
```

### Excel
- Builder OOXML : `src/utils/xlsxBuilder.ts`.

### Traçabilité exports
- Fingerprint : `src/utils/exportFingerprint.ts`.

Objectif : hasher un manifest déterministe (pas le binaire) pour limiter les variations non métier.

---

## Base-Contrat — Catalogue Patrimonial V3 + Cleanup V4 (P1-05)

Pivot actuel : catalogue hardcodé (`src/domain/base-contrat/catalog.ts`) + overrides Supabase (`base_contrat_overrides`).

### Gouvernance catalogue — assimilation

- Si les règles fiscales sont identiques : **pas de sous-catégories** (assimilation).
- Exemples : crypto-actifs (BTC/ETH/NFT/...) → 1 produit ; métaux précieux (or/argent/platine/...) → 1 produit.
- Ces produits assimilés sont rangés dans **GrandeFamille = `Autres`**.

### Taxonomie V3 (5 catalogKind)

| catalogKind | Description | Exemples |
|-------------|-------------|----------|
| **wrapper** | Enveloppes/Supports fiscaux (où l'actif est logé) | Assurance-vie, PEA, CTO, PER, PEE, SCI |
| **asset** | Actifs détenables en direct (quoi) | Immo locatif, Résidence principale, Titres vifs, SCPI, Liquidités |
| **liability** | Passif/Dettes (crucial pour actif net) | Crédit amortissable, Prêt in fine, Lombard |
| **tax_overlay** | Surcouches fiscales (applicables sur un asset) | Pinel, Malraux, Déficit foncier |
| **protection** | Prévoyance/Assurances (calculables) | Prévoyance individuelle, Assurance emprunteur |

### Blocs de règles par catalogKind

| catalogKind | Blocs disponibles (exemples) |
|-------------|-----------------------------|
| **wrapper** | DMTG droit commun, PS fonds €, PFU, Art. 990I/757B |
| **asset** | PV immobilières, Revenus fonciers, BIC meublé, IFI |
| **liability** | Déductibilité IFI, Passif successoral |
| **tax_overlay** | Réduction IR dispositif, Déficit foncier reportable |
| **protection** | Primes déductibles, Rentes invalidité, Capital décès |

### Vérification

```bash
# Nombre de catalogKind (pivot)
rg "export type CatalogKind" src/domain/base-contrat/types.ts
# → 1

# Catalogue hardcodé (périmètre)
rg "export const CATALOG" src/domain/base-contrat/catalog.ts
# → 1
```

---

## Références
- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
