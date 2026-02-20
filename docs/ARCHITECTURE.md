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
- [Publication (admin) : gate de sécurité](#publication-admin--gate-de-sécurité)
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
- Settings GLOBAUX : `tax_settings`, `ps_settings`, `fiscality_settings`, `base_contrat_settings`.

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

## Publication (admin) : gate de sécurité

"Publication" = action admin qui persiste des règles métier utilisées par les simulateurs.

Règle : **interdire la publication** s'il n'existe pas au moins un test "validé" (fail-safe).

Source : `src/features/settings/publicationGate.ts` (utilisé par les pages Settings).

---

## Base-Contrat — Catalogue de blocs (P1-03g)

Source : `src/constants/base-contrat/blockTemplates.ts` (10 templates MVP).
Audit : `src/constants/base-contrat/catalogue.seed.v1.json` (78 produits, 13 grandes familles).

### Table récap — GrandeFamille → Blocs suggérés par phase

| Grande famille | Produits seed (exemples) | Constitution | Sortie | Décès | Blocs MVP disponibles |
|---|---|---|---|---|---|
| **Assurance** | AV, PER assurantiel, Capitalisation, Prévoyance | `ps-sortie` | `pfu-sortie`, `ps-sortie`, `abattements-av-8ans`, `rachats-pre2017`, `anciennete-exoneration`, `rente-rvto` | `art-990I-deces`, `art-757B-deces` | ✅ Couvert |
| **Retraite & épargne salariale** | PER PERIN, PERCOL, PERO, PEE, Art.83, PERP | `deductibilite-per`, `ps-sortie` | `pfu-sortie`, `ps-sortie`, `rente-rvto`, `anciennete-exoneration` | `art-990I-deces`, `art-757B-deces` | ✅ Couvert |
| **Titres vifs** | Actions cotées, Obligations, OAT, BSA/DPS | — | `pfu-sortie`, `ps-sortie`, `anciennete-exoneration` | `note-libre` | ✅ Couvert |
| **Fonds / OPC** | ETF, OPCVM, SICAV, FCP, FCPI, FIP, OPCI | — | `pfu-sortie`, `ps-sortie`, `anciennete-exoneration` | `note-libre` | ✅ Couvert |
| **Immobilier direct** | Appartement, Terrain, Garage | — | `ps-sortie`, `note-libre` | `note-libre` | ⚠️ Partiel — manque `pv-immobiliere` |
| **Immobilier indirect** | SCPI, GFA, GFV, Groupement forestier | — | `pfu-sortie`, `ps-sortie`, `note-libre` | `note-libre` | ✅ Couvert (revenus fonciers) |
| **Épargne bancaire** | LEP, Livret A, LDDS, CAT, CSL, PEL, CEL | — | `note-libre` | `note-libre` | ⚠️ MVP conservateur — manque `epargne-reglementee-exoneration` + `epargne-bancaire-imposable` |
| **Non coté / PE** | Actions non cotées, Crowdfunding, SOFICA, IR-PME | — | `pfu-sortie`, `ps-sortie`, `note-libre` | `note-libre` | ⚠️ Partiel — manque `reduction-ir-dispositif` (IR-PME/SOFICA) |
| **Produits structurés** | Autocall, EMTN, Certificats, Warrants | — | `pfu-sortie`, `ps-sortie`, `note-libre` | `note-libre` | ✅ Couvert |
| **Crypto-actifs** | BTC, ETH, NFT, Stablecoins, Tokens | — | `note-libre` | `note-libre` | ⚠️ MVP note-libre — manque `crypto-pfu-150vhbis` (art. 150 VH bis) |
| **Dispositifs fiscaux immo** | Pinel, Malraux, Denormandie, Loc'Avantages, MH | `note-libre` | `note-libre` | `note-libre` | ⚠️ MVP note-libre — manque `reduction-ir-dispositif` |
| **Métaux précieux** | Or, Argent, Platine physiques | — | `note-libre` | `note-libre` | ⚠️ MVP note-libre — manque `taxe-forfaitaire-metaux` (11,5 % ou PV mob.) |
| **Créances / Droits** | CCA, Prêt particuliers, Usufruit/NP | — | `note-libre` | `note-libre` | ℹ️ Cas par cas — note-libre suffisant MVP |

### Blocs manquants à créer (Étape B TODO)

| `templateId` à créer | Familles cibles | Phases | Raison |
|---|---|---|---|
| `epargne-reglementee-exoneration` | Épargne bancaire | Sortie | LEP/Livret A/LDDS : exonération totale IR + PS (plafond, taux réglementé) |
| `epargne-bancaire-imposable` | Épargne bancaire | Sortie | CAT/CSL : IR barème ou PFU + PS sur intérêts |
| `pv-immobiliere` | Immobilier direct | Sortie | Plus-values immo : abattements durée (22 ans IR, 30 ans PS), exonération RP |
| `crypto-pfu-150vhbis` | Crypto-actifs | Sortie | Art. 150 VH bis : 30 % flat, seuil 305 €, cessions actifs numériques |
| `reduction-ir-dispositif` | Non coté/PE, Dispositifs fiscaux immo | Constitution | Réduction IR (IR-PME, SOFICA, Pinel, Malraux…) : taux %, plafond €, durée |
| `taxe-forfaitaire-metaux` | Métaux précieux | Sortie | Taxe forfaitaire 11,5 % (or/argent) ou PV mobilières selon option |

### Vérification

```bash
# Nombre de templates
rg "templateId:" src/constants/base-contrat/blockTemplates.ts | wc -l
# → 10 (MVP)

# Familles couvertes par au moins 1 template non-note-libre
rg "suggestedFor" src/constants/base-contrat/blockTemplates.ts
```

---

## Références
- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
