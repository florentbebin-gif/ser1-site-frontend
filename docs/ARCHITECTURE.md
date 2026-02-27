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
- `src/pages/` : shells légers (Home, Login, SettingsShell) + `pages/settings/*` (sous-pages settings).
- `src/settings/` : thème, presets, ThemeProvider.
- `src/pptx/` : pipeline PPTX (design system + slides + export).
- `supabase/` : edge functions + migrations.

Conventions clés :
- Nouveau code : TS/TSX.
- Fichiers >500 lignes = dette à découper (ticket).

### Conventions — Legacy / Spike / Raw

#### `legacy/` (convention historique — ✅ résolu)
Le dossier `legacy/` servait à isoler du code pendant la refonte `pages/` → `features/` (strangler refactor incrémental).

**Statut** : le dernier dossier legacy (`src/features/placement/legacy/`) a été éliminé. Les 8 fichiers ont été promus dans `utils/`, `components/`, `export/` au sein de la feature placement.

**Vérification** :
```bash
rg "legacy/" src/features/ # → doit retourner vide
```

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
| D | compat | `src/engine/*.ts` | `@deprecated` constants (ABATTEMENT_*, generate*Pptx) | Ne pas ajouter de nouveaux `@deprecated` | Migration vers nouveaux APIs | `rg "@deprecated" src/engine` (maintenir ou réduire) |

**Resolved :**

| Dette | Type | Où | Pourquoi | Décision | Vérification |
|-------|------|-----|----------|----------|--------------|
| A | compat | `src/features/placement/legacy/` | Strangler refactor pages→features | **PROMU** — fichiers déplacés dans utils/, components/, export/ | `rg "legacy/" src/features/` → 0 |
| B | hygiène | `src/pptx/template/__spike__/` | Prototypes / essais PPTX | **DELETE** (0 usage) | `find src -type d -name "__spike__"` → 0 |
| C | hygiène | `src/icons/business/_raw/` | Sources brutes SVG | **DELETE** (0 usage) | `find src -type d -name "_raw"` → 0 |

**Règles "ne pas aggraver la dette" :**
- Pas de nouveaux fichiers dans `__spike__` ou `_raw`
- Tout nouveau code va dans `features/*`, `components/`, `hooks/`, etc.

---

## Points d’entrée & flux
### Routing
- `src/routes/appRoutes.ts` (APP_ROUTES) : source de vérité des routes + metadata topbar (`contextLabel`, `topbar`).
- `src/App.jsx` : rendu JSX des routes via `APP_ROUTES.map()`. Résolution topbar via `getRouteMetadata(pathname)`.
- `src/components/layout/AppLayout.jsx` : topbar data-driven (reçoit `routeMeta`, plus de flags hardcodés).

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
| `/sim/credit` | privé + lazy | `Credit` | `src/features/credit/Credit.jsx` (exporté via `src/features/credit/index.ts`) |
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
- Pages : `src/pages/settings/*`.

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

## Base-Contrat — Référentiel Patrimonial (Pivot Hardcodé)

Source de vérité : `src/domain/base-contrat/` (catalogue + règles).
Overlays admin : table `base_contrat_overrides` (clôture/réouverture + date + note).

UI : `/settings/base-contrat` est une vue read-only à 3 colonnes (Constitution / Sortie-Rachat / Décès-Transmission), avec toggle Particulier/Entreprise.

### Gouvernance catalogue — assimilation

- Si les règles fiscales sont identiques : **pas de sous-catégories** (assimilation).
- Exemples : crypto-actifs (BTC/ETH/NFT/...) → 1 produit ; métaux précieux (or/argent/platine/...) → 1 produit.
- Ces produits assimilés sont rangés dans **GrandeFamille = `Autres`**.

### Taxonomie (5 catalogKind)

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

## Taux vivants & Settings fiscaux

### Définition

**Taux vivants** = valeurs numériques fiscales **révisables annuellement** (barèmes, taux, abattements, plafonds réglementaires), par opposition aux **règles structurelles** (principes codifiés dans le Code civil, modifiables uniquement par loi ordinaire distincte du PLF).

**Principe cardinal** : les `rules/library/*.ts` ne doivent **jamais** contenir de valeur numériquement révisable sans commentaire `// À confirmer` et référence légale. Les taux vivants doivent vivre dans Supabase, pas dans le code.

---

### Pages settings existantes

| Route | Composant | Table Supabase | Périmètre |
|-------|-----------|----------------|-----------|
| `/settings` | `Settings` | — | Généraux (placeholder) |
| `/settings/impots` | `SettingsImpots` | `tax_settings` | Barème IR (2 ans), PFU, CEHR/CDHR, IS, DMTG successions |
| `/settings/prelevements` | `SettingsPrelevements` | `ps_settings` | PS patrimoine, cotisations retraite, seuils RFR (CSG/CRDS/CASA) |
| `/settings/base-contrat` | `BaseContrat` | `base_contrat_overrides` | Référentiel produits (read-only 3 colonnes + toggles admin) |
| `/settings/comptes` | `SettingsComptes` | `profiles` | Comptes utilisateurs par cabinet (admin only) |

Source unique des routes : `src/constants/settingsRoutes.js`.
Shell de navigation : `src/pages/SettingsShell.jsx` (rendu dynamique des onglets, filtre `adminOnly`).

**À venir** : `/settings/dmtg-succession` (Paramètres DMTG & Succession) — voir ROADMAP P1-06.

---

### Tables Supabase (singletons, `id = 1`)

| Table | Périmètre | RLS lecture | RLS écriture |
|-------|-----------|-------------|--------------|
| `tax_settings` | IR barème (N et N-1), PFU taux IR+PS, CEHR/CDHR, IS, DMTG barèmes+abattements | Auth | Admin |
| `ps_settings` | PS patrimoine (17,2 %), cotisations retraite par tranche, seuils RFR (1/2/3 parts) | Auth | Admin |
| `fiscality_settings` | Règles par enveloppe (AV, PER, PEA, CTO, dividendes…) — taux, abattements, seuils | Auth | Admin |
| `base_contrat_settings` | Config catalogue (réservé usage futur) | Auth | Admin |
| `base_contrat_overrides` | Clôture/réouverture produit + note admin (uuid per product) | Admin | Admin |

Schéma complet : `supabase/migrations/20260210214352_remote_commit.sql`.

---

### Flux complet : Supabase → Engine

```
┌──────────────────────────────────────────────────────────┐
│ SUPABASE (3 singletons id=1)                             │
│  tax_settings · ps_settings · fiscality_settings         │
└──────────────────────────┬───────────────────────────────┘
          RLS: auth READ / admin WRITE
          Admin save → supabase.upsert({id:1, data})
                     → invalidate(kind) + broadcastInvalidation(kind)
                                              │ CustomEvent
┌──────────────────────────▼───────────────────────────────┐
│ fiscalSettingsCache.js  (src/utils/)                     │
│  · Stale-while-revalidate : retour immédiat cache/défauts│
│  · Fetch Supabase en arrière-plan (non-bloquant)         │
│  · TTL 24 h · localStorage (anti-flash cold start)       │
│  · Timeout Supabase 8 s (fallback défauts si KO)         │
│  · addInvalidationListener() : écoute les invalidations  │
└──────────────────────────┬───────────────────────────────┘
                           │ getFiscalSettings({force})
┌──────────────────────────▼───────────────────────────────┐
│ usePlacementSettings.js  (src/hooks/)                    │
│  · Monte les 3 tables · écoute les invalidations         │
│  · Appelle extractFiscalParams(fiscality, ps)            │
│  · Dérive tmiOptions depuis barème IR                    │
│  → fiscalParams (34 valeurs numériques normalisées)      │
└──────────────────────────┬───────────────────────────────┘
                           │ fiscalParams
┌──────────────────────────▼───────────────────────────────┐
│ Engine  (src/engine/)                                    │
│  · Zéro React · Zéro side effects · Déterministe        │
│  · simulateEpargne · calculFiscaliteRetrait              │
│  · calculateSuccession · simulateLiquidation …           │
└──────────────────────────────────────────────────────────┘
```

**extractFiscalParams()** (`src/engine/placement/fiscalParams.js`) : mappe le JSONB des tables → objet normalisé de 34 valeurs. Fallback sur `DEFAULT_FISCAL_PARAMS` (`src/engine/placement/shared.js`) si clé manquante ou invalide.

---

### Classification : taux vivants vs règles structurelles

#### Taux vivants (Supabase, modifiables admin, susceptibles de changer à chaque PLF)

| Catégorie | Paramètres | Table | Référence légale |
|-----------|-----------|-------|-----------------|
| **IR** | Barème 5 tranches (seuils + taux), abattement DOM | `tax_settings` | Art. 197 CGI |
| **PFU** | Taux IR 12,8 % + Taux PS 17,2 % = 30 % | `tax_settings` | Art. 200 A CGI |
| **CEHR/CDHR** | Seuils (500 k€, 1 M€) + taux (3 %, 4 %) | `tax_settings` | Art. 223 sexies CGI |
| **IS** | Taux réduit 15 % (seuil 42 500 €), taux normal 25 % | `tax_settings` | Art. 219 CGI |
| **DMTG successions** | Barèmes par lien de parenté + abattements (100 k€, 15 932 €…) | `tax_settings` | Art. 777 & 779 CGI |
| **DMTG donations** | Abattements spécifiques donation (31 865 €, 80 724 €…) | *(P1-06 — à créer)* | Art. 779, 790 E/F/G CGI |
| **Assurance-vie** | Abattement 990I (152 500 €), taux 20 %/31,25 %, abattement 757B (30 500 €) | `fiscality_settings` | Art. 990 I & 757 B CGI |
| **PS patrimoine** | 17,2 % (CSG 9,2 % + CRDS 0,5 % + PS 7,5 %) | `ps_settings` | Art. L136-6 CSS |
| **Seuils RFR** | Par nombre de parts (CSG taux réduit, CRDS exo) | `ps_settings` | Art. L136-8 CSS |
| **PASS** | Non encore dans settings — valeur annuelle URSSAF | *(reference_rates — futur)* | Art. D612-5 CSS |

#### Règles structurelles (logique moteur, Code civil ou loi ordinaire)

| Règle | Source | Stabilité |
|-------|--------|-----------|
| Réserve héréditaire (1/2, 2/3, 3/4 selon nbre d'enfants) | Art. 912-913 Code civil | Très stable |
| Exonération conjoint survivant (succession) | Art. 796-0 bis CGI (loi TEPA 2007) | Stable |
| Exonération partenaire PACS (succession) | Art. 796-0 ter CGI | Stable |
| Délai de rappel fiscal : 15 ans | Art. 784 CGI | Stable (était 10 ans avant 2012) |
| Assurance-vie hors succession (primes < 70 ans) | Art. L132-12 Code assurances + 990 I CGI | Stable (principe) |
| Représentation successorale (enfant prédécédé) | Art. 751 Code civil | Très stable |
| Rapport civil (sans limite de temps) | Art. 843 Code civil | Stable |
| Régimes matrimoniaux (définitions actif successoral) | Art. 1400, 1536, 1526, 1569 Code civil | Très stable |
| Usufruit légal conjoint survivant | Art. 757 Code civil | Stable |
| Barème nue-propriété / usufruit | Art. 669 CGI | Modifiable PLF |

---

### Architecture cible — `reference_rates`

> Voir détail dans `docs/ROADMAP.md` (§ Item transversal — Taux vivants).

Objectif : remplacer les constantes hardcodées dans `settingsDefaults.ts` par une table Supabase `reference_rates` :

```sql
CREATE TABLE reference_rates (
  key          TEXT PRIMARY KEY,      -- ex: 'PASS_N', 'TAUX_PS', 'SEUIL_MICRO_BIC'
  value        NUMERIC NOT NULL,
  label        TEXT,
  source_url   TEXT,
  last_updated_at TIMESTAMPTZ,
  valid_from   DATE,
  valid_until  DATE
);
```

Edge Function `rates-refresh` (cron hebdomadaire) : fetch URSSAF / legifrance / service-public → upsert horodaté.

---

### Fichiers clés

| Rôle | Fichier |
|------|---------|
| Source des routes settings | `src/constants/settingsRoutes.js` |
| Valeurs par défaut 3 tables | `src/constants/settingsDefaults.ts` |
| Shell settings (nav + rendu) | `src/pages/SettingsShell.jsx` |
| Pages settings | `src/pages/settings/` |
| Cache + fetch Supabase | `src/utils/fiscalSettingsCache.js` |
| Hook simulateur placement | `src/hooks/usePlacementSettings.js` |
| Extraction params normalisés | `src/engine/placement/fiscalParams.js` |
| Params par défaut (34 valeurs) | `src/engine/placement/shared.js` (`DEFAULT_FISCAL_PARAMS`) |
| Profil fiscal par enveloppe | `src/features/placement/hooks/useFiscalProfile.ts` |

---

## Références
- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
