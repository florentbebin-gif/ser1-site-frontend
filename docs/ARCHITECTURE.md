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

### Standard UI des simulateurs `/sim/*`
Source normative : section **"Norme des pages `/sim/*` (baseline `/sim/credit`)"** dans `docs/GOUVERNANCE.md`.

Implémentation de référence :
- Orchestrateur : `src/features/credit/Credit.jsx`
- Styles de page simulateur : `src/components/simulator/SimulatorShell.css`
- Styles premium partagés : `src/styles/premium-shared.css`
- Styles spécifiques crédit : `src/features/credit/components/CreditV2.css`
- Inputs/select/toggle : `src/features/credit/components/CreditInputs.jsx` + `CreditInputs.css`
- Pour toute nouvelle page `/sim/*`, appliquer la règle placeholder + unité de `docs/GOUVERNANCE.md` : placeholder numérique sans unité dans le champ, suffixe visuel hors champ, sauf si l'unité est déjà portée par un menu déroulant.
- Les boutons optionnels de filtres/sous-sections doivent démarrer inactifs par défaut, puis activer explicitement les blocs associés.

### Mode utilisateur `/sim/*` (contrat)
- Source de vérité globale : `ui_settings.mode` via `useUserMode` (`src/services/userModeService.ts`).
- La page Home est le point de pilotage global (toggle persistant).
- Chaque simulateur doit lire ce mode global au montage, puis peut appliquer un override local non persistant (pattern `/sim/credit`).
- Le toggle local d'un simulateur ne doit pas écrire dans `ui_settings` (sinon il écrase le choix Home pour toute l'app).
- Les boutons locaux additionnels de page (filtres, catégories masquables) ne doivent pas être initialisés comme actifs par défaut sans règle produit documentée.

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
| `/settings/dmtg-succession` | `SettingsDmtgSuccession` | `tax_settings`, `fiscality_settings` | Barèmes DMTG successions + abattements (livré PR #159) |

Source unique des routes : `src/constants/settingsRoutes.js`.
Shell de navigation : `src/pages/SettingsShell.jsx` (rendu dynamique des onglets, filtre `adminOnly`).

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

### Dossier fiscal unifié — `useFiscalContext`

**Point d'entrée unique** : `src/hooks/useFiscalContext.ts`

Tous les simulateurs consomment les paramètres fiscaux via ce hook. Il expose un `fiscalContext` aux clés stables, indépendamment de la structure Supabase.

#### Deux modes

| Mode | Usage | Comportement |
|------|-------|--------------|
| `strict: true` | IR, Succession | Attend Supabase avant de retourner — bloque sur un écran de chargement si Supabase est lent |
| `strict: false` (défaut) | Placement, Stratégie | Stale-while-revalidate — retourne cache/défauts immédiatement, rafraîchit en arrière-plan |

#### Clés normalisées exposées

```ts
fiscalContext.irScaleCurrent          // barème IR année courante
fiscalContext.irScalePrevious         // barème IR année précédente
fiscalContext.pfuRateIR               // taux IR PFU (ex: 12.8)
fiscalContext.psRateGlobal            // taux PS patrimoine (ex: 17.2)
fiscalContext.dmtgScaleLigneDirecte   // barème DMTG ligne directe
fiscalContext.dmtgAbattementEnfant    // abattement ligne directe (ex: 100 000)
fiscalContext.dmtgSettings            // objet DMTG complet { ligneDirecte, frereSoeur, neveuNiece, autre }
fiscalContext._raw_tax                // brut tax_settings (usage exceptionnel)
fiscalContext._raw_ps                 // brut ps_settings
fiscalContext._raw_fiscality          // brut fiscality_settings
```

#### Invalidation

L'admin sauvegarde → `invalidate(kind)` + `broadcastInvalidation(kind)` → événement `ser1:fiscal-settings-updated` → tous les `useFiscalContext` actifs se rafraîchissent.

---

### Identité fiscale & snapshot v4 — `FiscalIdentity`

**Objectif** : détecter si les paramètres fiscaux ont changé entre la sauvegarde d'un dossier `.ser1` et son rechargement ultérieur.

**Mécanisme** (PR #162) :

1. Au démarrage de l'app (`App.jsx`), `fingerprintSettingsData()` calcule un hash SHA-256 des 3 tables.
2. Ce fingerprint (`FiscalIdentity`) est stocké dans chaque `.ser1` sauvegardé (snapshot schéma v4).
3. Au chargement d'un `.ser1`, le fingerprint sauvegardé est comparé au fingerprint courant.
4. En cas de mismatch → notification "Attention : les paramètres fiscaux ont été mis à jour depuis la sauvegarde."

**Fichiers** :

| Rôle | Fichier |
|------|---------|
| Calcul du fingerprint | `src/utils/fiscalSettingsCache.js` (`fingerprintSettingsData`) |
| Comparaison au chargement | `src/App.jsx` (lignes 169–183) |
| Migration snapshot v3→v4 | `src/features/ser1/snapshotMigrations.ts` |

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
| **DMTG donations** | Abattements spécifiques donation (31 865 €, 80 724 €…) | *(non implémenté — futur PLF)* | Art. 779, 790 E/F/G CGI |
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
| **Hook unifié dossier fiscal** | **`src/hooks/useFiscalContext.ts`** |
| Hook simulateur placement | `src/hooks/usePlacementSettings.js` |
| Extraction params normalisés | `src/engine/placement/fiscalParams.js` |
| Params par défaut (34 valeurs) | `src/engine/placement/shared.js` (`DEFAULT_FISCAL_PARAMS`) |
| Profil fiscal par enveloppe | `src/features/placement/hooks/useFiscalProfile.ts` |
| Migration snapshot (v4 + identity) | `src/features/ser1/snapshotMigrations.ts` |

---

## Conventions de creation (simulateurs, settings, features)

Cette section fixe comment ajouter une page, une route ou une feature sans creer de nouveau pattern implicite.

### 1) Ajouter un nouveau simulateur /sim/*

#### Regle
- Toute nouvelle route simulateur vit dans `APP_ROUTES` dans `src/routes/appRoutes.ts`.
- Le chemin canonique est toujours `/sim/<slug>`.
- Une route legacy courte (`/<slug>`) n'est ajoutee que si une compatibilite ou un redirect explicite est necessaire.

#### Structure cible
- Entrypoint feature : `src/features/<slug>/index.ts`
- Page ou orchestrateur : `src/features/<slug>/<Feature>Page.tsx` ou composant equivalent exporte par l'index
- Sous-dossiers typiques selon besoin :
  - `components/`
  - `hooks/`
  - `export/`
  - `utils/`
  - `__tests__/`

#### Contrats obligatoires
- Le calcul metier reste dans `src/engine/` si le simulateur introduit une vraie logique de calcul.
- La route doit declarer un `contextLabel` et une `topbar` coherents avec `APP_ROUTES`.
- Si le simulateur supporte le reset page, declarer un `resetKey`.
- Le mode global Home (`ui_settings.mode`) doit etre respecte par defaut ; un override local est permis seulement s'il reste non persistant.

#### Si le simulateur n'est pas pret
- Utiliser `UpcomingSimulatorPage` tant que le simulateur n'a pas un contrat UI ou metier stable.
- Ne pas livrer une page `/sim/*` demi-finie avec architecture definitive implicite.

### 2) Ajouter une nouvelle page /settings/*

#### Regle
- La source unique des sous-pages settings est `src/constants/settingsRoutes.js`.
- Toute nouvelle page settings doit etre declaree dans `SETTINGS_ROUTES` avec :
  - `key`
  - `label`
  - `path`
  - `urlPath`
  - `component`
  - `adminOnly` si necessaire

#### Emplacement
- Composant de page : `src/pages/settings/<PageName>.tsx` ou `.jsx`
- Navigation et rendu : `src/pages/SettingsShell.jsx`
- Mapping URL actif : helpers dans `src/constants/settingsRoutes.js`

#### Contrats obligatoires
- Ne pas creer une navigation settings parallele hors `SettingsShell`.
- Si une page sensible est `adminOnly` en front, verifier aussi l'enforcement backend/RLS.
- Si une route settings remplace une ancienne route, documenter le redirect ou le mapping legacy.

### 3) Organiser une feature de simulateur

#### Regle
- Une feature regroupe uniquement ce qui lui appartient vraiment.
- Les composants partages vivent hors feature seulement s'ils sont reemployes par plusieurs domaines.

#### Repartition recommandee
- `src/engine/` : calcul pur, zero React
- `src/features/<slug>/` : UI, state, orchestration, exports lies a la feature
- `src/components/` : composants transverses reutilises
- `src/styles/` : styles partages, tokens, patterns communs
- `src/pages/` : shells et pages transverses, pas la logique metier d'un simulateur

#### Interdits
- Calcul fiscal dans un composant React
- Import CSS cross-feature depuis une autre feature
- Nouveau dossier `legacy/`, `__spike__` ou `_raw` en prod
- Fichier "god component" si un decoupage simple composant/hook suffit

### 4) Checklist minimale avant merge
- Route ou page ajoutee a la bonne source de verite (`APP_ROUTES` ou `SETTINGS_ROUTES`)
- Docs pivots mises a jour si le contrat change
- Test adapte au statut du sujet :
  - simulateur stable : smoke test ou test cible
  - simulateur upcoming : au minimum ouverture de route / rendu attendu
- Aucun nouveau pattern structurel implicite non documente

---

## Références
- Gouvernance UI/couleurs/thème : `docs/GOUVERNANCE.md`
- Runbook debug + edge + migrations : `docs/RUNBOOK.md`
- Trajectoire produit : `docs/ROADMAP.md`
