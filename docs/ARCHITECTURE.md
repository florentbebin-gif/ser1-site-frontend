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

---

## Points d’entrée & flux
### Routing
- `src/routes/appRoutes.ts` (APP_ROUTES) : source de vérité des routes.
- `src/App.jsx` : rendu JSX des routes via `APP_ROUTES.map()`.

#### Routes Map (actuel)

Source (preuves) :
- Définitions des routes : `src/routes/appRoutes.ts` @src/routes/appRoutes.ts
- Déclarations `lazy(...)` : `src/routes/appRoutes.ts` @src/routes/appRoutes.ts#32-42
- Rendu `<Route ...>` : `src/App.jsx` @src/App.jsx#472-474


| Route | Accès | Composant (runtime) | Fichier / provenance |
|------|-------|----------------------|----------------------|
| `/login` | public | `Login` | `src/pages/Login.jsx` (import direct) |
| `/forgot-password` | public | `ForgotPassword` | `src/pages/ForgotPassword.jsx` (import direct) |
| `/set-password` | public | `SetPassword` | `src/pages/SetPassword.jsx` (import direct) |
| `/reset-password` | public | `SetPassword` | `src/pages/SetPassword.jsx` (import direct) |
| `/` | privé | `Home` | `src/pages/Home.jsx` (import direct) |
| `/audit` | privé + lazy | `AuditWizard` | `src/features/audit` (lazy → `AuditWizard`) |
| `/strategy` | privé + lazy | `StrategyPage` | `src/pages/StrategyPage.jsx` (lazy) |
| `/sim/placement` | privé + lazy | `Placement` | `src/features/placement` (lazy → `PlacementPage`) |
| `/sim/credit` | privé + lazy | `Credit` | `src/pages/credit/Credit.jsx` (lazy) |
| `/sim/succession` | privé + lazy | `SuccessionSimulator` | `src/features/succession` (lazy → `SuccessionSimulator`) |
| `/sim/per` | privé + lazy | `PerSimulator` | `src/features/per` (lazy → `PerSimulator`) |
| `/sim/epargne-salariale` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/tresorerie-societe` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/prevoyance` | privé + lazy | `UpcomingSimulatorPage` | `src/pages/UpcomingSimulatorPage.jsx` (lazy) |
| `/sim/ir` | privé + lazy | `Ir` | `src/features/ir` (lazy → `IrPage`) |
| `/settings/*` | privé + lazy | `SettingsShell` | `src/pages/SettingsShell.jsx` (lazy) |
| `/placement` | redirect | `Navigate` → `/sim/placement` | compat legacy |
| `/credit` | redirect | `Navigate` → `/sim/credit` | compat legacy |
| `/prevoyance` | redirect | `Navigate` → `/sim/prevoyance` | compat legacy |

Vérification (commandes) :

```bash
# Liste des routes (paths)
rg -n "path: '" src/routes/appRoutes.ts

# Liste des déclarations lazy
rg -n "lazy(" src/routes/appRoutes.ts

# Liste des routes avec access
rg -n "access:" src/routes/appRoutes.ts

# Rendu JSX dans App.jsx
rg -n "APP_ROUTES.map" src/App.jsx
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

## Références
- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
