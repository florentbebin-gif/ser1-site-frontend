# ROADMAP SaaS V1 — SER1 "Gestion Privée Premium"

> **Date** : 2026-02-11  
> **Branche** : `feature/roadmap-saas-v1`  
> **Statut** : DRAFT — docs-only, aucun code modifié

## État actuel (Checkpoint 2026-02-14)

> **Dernier patch validé** : Placement PR-4 (engine modular split) ✅
> **Quality Gates** : `npm run check` ✅ (Lint, Types, Tests, Build)

### Statut Module Placement (P1-05)

| PR | Description | Statut |
|---|---|---|
| PR-1 | Scaffold feature + proxy legacy | ✅ DONE |
| PR-2 | Extraction UI/State/Persistence (wrapper) | ✅ DONE |
| PR-3 | Extraction calculs métier vers Adapter pur | ✅ DONE |
| PR-4 | Modularisation Moteur (`engine/placement/*`) | ✅ DONE |
| **PR-5** | **Cutover final + Cleanup Legacy** | ⏭️ **NEXT** |

### 🚀 Reprendre à partir de PR-5

**Objectifs PR-5 :**
1. Supprimer le wrapper legacy `src/pages/PlacementV2.jsx`.
2. Vérifier que tous les imports pointent vers `src/features/placement` ou `src/engine/placementEngine.js` (façade).
3. Nettoyer le code mort (grep).
4. Vérifier une dernière fois les exports PPTX/Excel.

**Stop Triggers :**
* `npm run check` rouge.
* Régression sur les Golden Cases (`npm test goldenCases`).
* Changement dans la structure des exports (Snapshot).

**Preuves attendues :**
* `grep` confirmant 0 usage de `PlacementV2`.
* `npm run check` vert.
* Démo manuelle export OK.

> **⚠️ VIGILANCE :**
> * **Exports** : Le moteur a été découpé. Bien que la façade soit stable, un smoke test manuel sur l'export Excel et PPTX est impératif avant merge PR-5.
> * **Parité Base Contrat** : Le feature flag `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT` est toujours à gérer si activé plus tard.

---

## 1. Contexte & objectifs

### Positionnement produit

> **Plus simple qu'un progiciel "BIG" patrimonial, mais très précis** sur les calculs fiscaux et les exports client. L'application cible les CGP indépendants et petits cabinets qui veulent un outil rapide, fiable et personnalisable sans infrastructure lourde.

### Cible produit (décisions figées)

| Axe | Description |
|-----|-------------|
| **Multi-tenant cabinets** | Logo + palette par cabinet ; identité visuelle isolée. **Les règles fiscales et le catalogue produits sont GLOBAUX** (gérés par le **super-admin SaaS uniquement**, partagés entre tous les cabinets). En V1 il n'y a **pas d'admin cabinet** : seul le super-admin SaaS gère les comptes, le branding, les règles et le catalogue. Un rôle "admin cabinet" (limité au branding de son cabinet) pourra être ajouté en phase ultérieure si le besoin est validé |
| **Personnalisation user** | Surcouche couleurs UI bornée (preset / mon thème) |
| **Auth sécurisée** | Login email + MDP ; **pas de self-signup** — le **super-admin SaaS** invite chaque utilisateur via Edge Function `create_user`. MFA (TOTP + recovery codes) en phase 2 |
| **Admin = technicien métier** | L'admin SaaS est un professionnel de la gestion de patrimoine avec une appétence technique, **pas un développeur**. Toutes les règles fiscales et le catalogue produits sont modifiables via wizard CRUD sans coder |
| **Analyse patrimoniale** | Civil, donations, actifs/passifs typés, fiscalité, succession, sociétés holding → PPTX premium |
| **Simulateurs rapides** | IR, Crédit, Épargne retraite, Épargne comparaison, Succession, Prévoyance, Trésorerie entreprise, Épargne salariale → PPTX + Excel |
| **Exports premium** | PPTX (PptxGenJS + design system Serenity) + Excel (OOXML natif) |
| **Catalogue produits** | Lifecycle simple actif / inactif (clôturer / réactiver). Le **versioning porte sur les règles** (`rulesets[]` avec `effectiveDate`), pas sur l'entité produit elle-même |
| **Zéro stockage client** | L'app ne stocke aucun dossier client sur le serveur. Saisie → étude → export PPTX. L'utilisateur peut sauvegarder un JSON local (`.ser1`) et le rouvrir plus tard. Toute donnée client vit exclusivement dans la session navigateur (`sessionStorage`) |
| **Sessions TTL pro** | Heartbeat toutes les 30 s ; grâce **2-5 min** si perte heartbeat (réseau instable / tab `hidden`) — **attention** : la grâce est une tolérance heartbeat, PAS une conservation de données après fermeture d'onglet (`sessionStorage` est détruit à la fermeture) ; coupure après **1 h d'inactivité** ; purge `sessionStorage` à l'expiration ; UX : message "session expire dans X min". **Reset inactivité** : saisie formulaire, navigation, clic CTA (export, calcul, sauvegarde), heartbeat si session ouverte |
| **Politique de téléchargement** | Les exports PPTX/Excel sont disponibles **uniquement tant que la session est active**. MVP (Phase 0-1, exports client-side) : bouton export **disabled** si session expirée, révocation des Blob URLs existantes, purge `sessionStorage`, message UX "session expirée — reconnectez-vous". _Note : si un jour les exports passent en server-side (phase future), alors un refus HTTP 401/expired redevient applicable_ |
| **Observabilité** | Logs **uniquement techniques**, zéro PII, **zéro métriques métier** |
| **Gate tests admin** | Lors de la publication d'un bundle de règles fiscales ou produits, le système **exige au moins 1 cas de test** importé et exécuté. Publication bloquée si 0 test |
| **Scanner local (phase 4)** | 11 types de documents, OCR local, pré-remplissage |

### Stack actuelle

React 18 + Vite 5 + TypeScript strict + Supabase (Auth/DB/Storage/Edge Functions) + Vercel.  
Exports : PptxGenJS + JSZip. Tests : 83 Vitest + 8 Playwright E2E.

---

## 2. Contraintes de gouvernance (extraites du repo)

### 2.1 Couleurs — `docs/design/color-governance.md`

- Tokens C1-C10 définis dans `src/settings/theme.ts`
- Hardcode interdit sauf WHITE (`#FFFFFF`) et WARNING (`#996600`)
- Seul rgba autorisé : `rgba(0,0,0,*)` pour overlays/shadows
- ESLint plugin `ser1-colors` (actuellement `warn`, prévu `error`)

### 2.2 UI Premium — `docs/design/ui-governance.md`

- Fond page : `var(--color-c7)` ; Cards : `#FFFFFF` + border C8 + radius 12px
- **Inputs obligatoirement sur fond BLANC**
- Typographie : Sentence case, graisse 500-600
- Messages utilisateur **en français**

### 2.3 CSS — `CONTRIBUTING.md`

- Import CSS croisé entre pages **interdit**
- Styles partagés → `src/styles/` ou `SettingsShared.css`

### 2.4 Logging — `docs/runbook/debug.md`

- `console.log/debug/info/trace` **interdit** en prod (ESLint `no-console: error`)
- Logs dev derrière flags `DEBUG_*` via `src/utils/debugFlags.ts`
- **Zéro PII**

### 2.5 Sécurité — `docs/technical/security-user-metadata-guidelines.md`

- **JAMAIS** `user_metadata` pour autorisation → `app_metadata.role` uniquement
- RLS : `public.is_admin()` lit `app_metadata` du JWT
- CORS whitelist (localhost + Vercel)

### 2.6 Conventions — `CONTRIBUTING.md`

- Nouveau code : TSX obligatoire ; Composants PascalCase ; Utils camelCase
- Logique métier → `src/engine/` uniquement (pas dans React)
- Alias `@/` pour imports cross-module
- TODO : `TODO(#issue): description` obligatoire
- Quality gates : `npm run check` (lint + typecheck + test + build)

### 2.7 CI — `.github/workflows/ci.yml` + `e2e.yml`

| Gate | Bloquant |
|------|----------|
| Lint ESLint | Oui |
| TypeScript `--noEmit` | Oui |
| Vitest (83 tests) | Oui |
| Build Vite | Oui |
| Console check grep | Oui |
| Playwright E2E (8 smoke) | Oui (workflow séparé) |

---

## 3. Baseline qualité

### 3.1 Résultats quality gates

> `npm ci` a échoué (verrou fichier esbuild — dev server actif). Analyse statique.

| Gate | Résultat | Source |
|------|----------|--------|
| Lint | ✅ OK attendu | ESLint config complète, CI passe |
| TypeScript | ✅ OK | `strict: true`, scorecard 24/25 |
| Tests | ✅ 83/83 | Vitest — couverture limitée à `src/engine/` |
| Build | ✅ OK | Vite 5, ~385KB bundle |
| E2E | ✅ 8 smoke | Playwright |

### 3.2 Warnings connus

- Couleurs hardcodées CSS (`#222`, `#2b3e37`, `#fff`) dans `Credit.css`, `Ir.css`, `Home.css` — plugin en `warn`
- 4 sources C1-C10 potentiellement divergentes (`theme.ts`, `ThemeProvider.tsx`, `styles.css`, `resolvePptxColors.ts`)
- `react-hooks/exhaustive-deps` en warn

### 3.3 God files (>500 lignes)

| Fichier | Taille | Domaine |
|---------|--------|---------|
| `src/engine/placementEngine.js` | 50KB | Moteur placement |
| `src/pages/Ir.jsx` | 50KB | UI simulateur IR |
| `src/pages/PlacementV2.jsx` | 52KB | UI simulateur Placement |
| `src/pages/Sous-Settings/SettingsComptes.jsx` | 55KB | Admin comptes |
| `src/pages/Sous-Settings/SettingsPrelevements.jsx` | 50KB | Admin PS |
| `src/pages/Sous-Settings/BaseContrat.tsx` | 43KB | Référentiel contrats |
| `src/pages/Sous-Settings/SettingsImpots.jsx` | 38KB | Admin IR/DMTG |
| `src/settings/ThemeProvider.tsx` | 29KB | Thème V5 |
| `src/utils/irEngine.js` | 16KB | Moteur IR |

### 3.4 Zones à risque

- **Exports PPTX** : 41 fichiers, 12 builders, design system 985 lignes
- **Moteur fiscal** : précision critique (barèmes IR/DMTG/PS)
- **Auth/Theme bootstrap** : anti-flash, refresh token, tri-état
- **RLS** : policies hétérogènes (certaines `profiles.role`, d'autres `is_admin()`)

---

## 4. Cartographie AS-IS

### 4.1 Points d'entrée

- **Routing** : `src/App.jsx` — Routes : `/`, `/audit`, `/strategy`, `/sim/placement`, `/sim/credit`, `/sim/ir`, `/settings/*`
- **Auth** : `src/main.jsx` → `AuthProvider` → `ThemeProvider` → `App`
- **Theme** : `ThemeProvider` charge via RPC `get_my_cabinet_theme_palette()` + `ui_settings` → CSS vars
- **Settings** : `SettingsShell.jsx` consomme `src/constants/settingsRoutes.js` (source unique)

### 4.2 Flux clés

**Auth → Thème** : `main.jsx` → `AuthProvider` (supabase.auth) → `ThemeProvider` (RPC cabinet palette + ui_settings.theme_mode → CSS vars + localStorage mirror)

**Settings fiscaux** : Pages Settings → `fiscalSettingsCache.js` / `baseContratSettingsCache.ts` (TTL 24h localStorage, fallback `settingsDefaults.ts`, invalidation par events)

**Export PPTX** : Simulateur → `*Export.ts` → `resolvePptxColors()` → slide builders (`buildCover`, `buildChapter`, `buildContent`, `buildSynthesis`, `buildEnd`) → `themeBuilder.ts` (post-processing ZIP)

**Export Excel** : Simulateur → `xlsxBuilder.ts` (JSZip OOXML, `pickTextColorForBackground()` pour contraste)

**Admin Edge Function** : Frontend → `/api/admin` (Vercel proxy) → `config/supabase/functions/admin/index.ts` (service role, actions CRUD users/themes)

**JSON local** : `globalStorage.js` — `sessionStorage` → snapshot JSON `.ser1` (version 1) via File System Access API

### 4.3 Données Supabase

#### Tables (12)

| Table | Multi-tenant | RLS |
|-------|-------------|-----|
| `profiles` | `cabinet_id` FK | SELECT own, UPDATE admin |
| `cabinets` | **Entité tenant** | ALL admin |
| `themes` | Pas de tenant_id | ALL admin, SELECT public |
| `ui_settings` | Pas de tenant_id | ALL own user |
| `logos` | Pas de tenant_id | ALL admin |
| `tax_settings` | **Pas de tenant_id (GLOBAL)** | SELECT auth, WRITE admin |
| `ps_settings` | **Pas de tenant_id (GLOBAL)** | SELECT auth, WRITE admin |
| `fiscality_settings` | **Pas de tenant_id (GLOBAL)** | SELECT auth, WRITE admin |
| `base_contrat_settings` | **Pas de tenant_id (GLOBAL)** | SELECT auth, WRITE admin |
| `pass_history` | Pas de tenant_id | SELECT auth, CUD admin |
| `issue_reports` | `user_id` FK | INSERT/SELECT own, ALL admin |
| `app_settings_meta` | Pas de tenant_id | SELECT auth, ALL admin |

#### RPC/Functions (12)

`is_admin()`, `is_admin(uid)`, `get_my_cabinet_logo()`, `get_my_cabinet_theme_palette()`, `handle_new_auth_user()`, `set_issue_report_user_id()`, `set_updated_at()`, `ensure_pass_history_current()`, `bump_settings_version()`, `get_settings_version()`, `sync_settings_data_*` (tax/ps/fiscality), `update_custom_palette_timestamp()`

#### Edge Function : `admin` (config/supabase/functions/admin/index.ts)

Actions : `ping_public`, `list_users`, `create_user`, `update_role`, `delete_user`, `get_original_theme`, `update_theme`, `delete_theme`

#### Storage : buckets `logos`, `covers`

#### Migrations : dual-track (`database/migrations/` = 19 fichiers manuels, `supabase/migrations/` = 4 fichiers CLI). **Risque confusion.**

### 4.4 Multi-tenant : constat

- **Présent** : `profiles.cabinet_id`, RPC `get_my_cabinet_*`, logo/palette par cabinet
- **Intentionnel (GLOBAL)** : `tax_settings`, `ps_settings`, `fiscality_settings`, `base_contrat_settings` n'ont **pas** de `cabinet_id`. C'est **conforme à l'exigence** : les règles fiscales et le catalogue produits sont gérés par le **super-admin SaaS** et partagés entre tous les cabinets (législation française unique). Idem pour `themes`, `pass_history`, `app_settings_meta`
- **Isolation per-cabinet** : concerne uniquement le **branding** (`cabinets.logo_id`, `cabinets.default_theme_id`), l'**affectation utilisateurs** (`profiles.cabinet_id`), et les **préférences UI** (`ui_settings` per user)
- **Risque RLS** : Policies `ps_settings` et `tax_settings` utilisent `profiles.role` au lieu de `is_admin()` dans snapshot remote_commit (harmonisation en cours via migration `20260211000100`)
- **À renforcer** : RLS `profiles` pour empêcher un admin cabinet de voir les profils d'un autre cabinet (filtrage `cabinet_id = my_cabinet_id`)

---

## 5. Matrice Existant vs Cible

| # | Feature | Statut | Chemins / détails |
|---|---------|--------|-------------------|
| 1 | Multi-tenant cabinets (branding isolé, règles globales) | 🟡 Partiel | `cabinets` + `profiles.cabinet_id` + RPC logo/palette existent. Règles fiscales GLOBALES (conforme). **Manque** : RLS `profiles` par `cabinet_id`, workflow invitation per-cabinet |
| 2 | Personnalisation user couleurs | ✅ Présent | V5 : `ThemeProvider.tsx`, `presets.ts`, `ui_settings` (theme_mode/preset_id/my_palette) |
| 3 | Auth login+MDP + invitation admin (pas de self-signup) | 🟡 Partiel | Supabase Auth + Edge Function `create_user`. **Manque** : workflow invitation complet (email template, onboarding), blocage self-signup explicite |
| 4 | Simulateur IR | ✅ Présent | `pages/Ir.jsx`, `utils/irEngine.js`, `pptx/slides/buildIrSynthesis.ts` |
| 5 | Simulateur Crédit | ✅ Présent | `pages/credit/` (architecture modulaire CreditV2), PPTX + Excel |
| 6 | Simulateur Placement | ✅ Présent | `pages/PlacementV2.jsx`, `engine/placementEngine.js`, `pptx/export/exportStudyDeck.ts` |
| 7 | Simulateur Succession | 🟡 Partiel | `engine/succession.ts` (DMTG). **Manque** : UI dédiée, export PPTX/Excel |
| 8 | Simulateur Épargne retraite | 🔴 Absent | À concevoir |
| 9 | Simulateur Prévoyance | 🔴 Absent | `engine/credit/capitalDeces.ts` existe (base) |
| 10 | Simulateur Trésorerie entreprise | 🔴 Absent | À concevoir |
| 11 | Simulateur Épargne salariale | 🔴 Absent | À concevoir |
| 12 | Analyse patrimoniale complète | 🟡 Partiel | `features/audit/` (types complets, wizard). **Manque** : société holding, PPTX complet |
| 13 | Stratégie guidée | 🟡 Partiel | `features/strategy/` (types, builder, recommendations). **Manque** : scénario auto |
| 14 | Exports PPTX premium | ✅ Présent | `pptx/` (41 fichiers), design system Serenity, 4 masters, ADR-001 |
| 15 | Exports Excel | ✅ Présent | `utils/xlsxBuilder.ts`, contraste dynamique, couleurs thème |
| 16 | Admin wizard fiscalité | ✅ Présent | `SettingsImpots`, `SettingsPrelevements`, `BaseContrat` — versioning rulesets |
| 17 | Catalogue produits (lifecycle actif/inactif) | ✅ Présent | `BaseContrat.tsx` V3 — CRUD, clôture/réactivation (lifecycle produit). Versioning sur les **règles** (`rulesets[]`), pas sur l'entité produit |
| 18 | JSON local versionné | 🟡 Partiel | `globalStorage.js` (v1). **Manque** : migration auto v1→vN, validation Zod |
| 19 | Sessions TTL pro (heartbeat + grâce 2-5 min + 1 h) | 🔴 Absent | Pas de heartbeat, pas de TTL 1h, pas d'UX expiration, pas de purge |
| 20 | Politique de téléchargement (exports session-only) | 🔴 Absent | Exports générés côté client (blob). Pas de refus après expiration session, pas de purge |
| 21 | Observabilité zéro PII + zéro métriques métier | 🟡 Partiel | ESLint `no-console`, debug flags, pg_notify. **Manque** : interdiction explicite métriques métier, logs serveur structurés |
| 22 | Gate tests admin (publication règles) | 🔴 Absent | Wizard admin permet de publier des règles sans aucun test. Aucun gate |
| 23 | MFA phase 2 (TOTP + recovery codes) | 🔴 Absent | Supabase Auth supporte MFA/TOTP. Non implémenté |
| 24 | Scanner local | 🔴 Absent | Phase 4 |

---

## 6. Risques & points d'arrêt (STOP)

### Risques majeurs

| # | Risque | Impact | Mitigation |
|---|--------|--------|------------|
| R1 | RLS `profiles` non filtrée par cabinet | Un admin cabinet voit les profils d'un autre cabinet | Ajouter RLS `profiles.cabinet_id = my_cabinet_id` AVANT 2e cabinet |
| R2 | God files bloquent refactoring | Conflits merge, régressions | Découper AVANT ajout features |
| R3 | 4 sources C1-C10 divergentes | Incohérence visuelle | Centraliser dans `theme.ts` |
| R4 | Exports PPTX fragiles | Régression visuelle silencieuse | Snapshots sur golden cases |
| R5 | Moteur fiscal non testé exhaustivement | Calculs erronés | Golden cases JSON |
| R6 | Pas de session TTL | Sessions zombie | Heartbeat + invalidation |
| R7 | JSON snapshot v1 sans migration | Données perdues | Migration auto |
| R8 | Dual-track migrations | Confusion | Unifier sous `supabase/migrations/` |
| R9 | Pas de politique téléchargement | Exports PPTX/Excel accessibles après expiration session | MVP : bouton disabled + révocation Blob URLs + purge `sessionStorage` + UX message |
| R10 | Pas de gate tests admin | Règles fiscales publiées sans validation | Gate : publication impossible si 0 test exécuté |

### Triggers STOP (toute PR bloquée si)

1. Export PPTX/Excel corrompu ou régressé visuellement
2. Golden case fiscal diverge du résultat attendu
3. FOUC, palette non appliquée, incohérence thème UI/PPTX
4. Policy RLS permet accès inter-tenant non autorisé
5. Log contenant email, nom ou données client (PII)
6. `npm run check` échoue
7. Test Playwright existant échoue

---

## 7. Stratégie zéro régression

### 7.1 Quality gates existants + proposés

| Gate | Existant | À ajouter |
|------|----------|-----------|
| Lint + ser1-colors | ✅ (`warn`) | Passer en `error` après cleanup P0 |
| TypeScript strict | ✅ | — |
| Tests unitaires | ✅ 83 | +50 golden cases (IR, succession, crédit, placement) |
| Build | ✅ | — |
| E2E Playwright | ✅ 8 | +10 scénarios (multi-tenant, exports, settings) |
| Circular deps | ⚠️ Manuel | Ajouter en CI |
| **Snapshot exports** | 🔴 | PPTX/Excel hash structure sur 3-5 golden cases |
| **Audit couleurs CI** | ⚠️ Manuel | Intégrer `audit-colors.mjs` en CI |
| **Gate tests admin** | 🔴 | Wizard admin règles : bloquer publication si 0 test importé/exécuté |
| **Download policy** | 🔴 | Refuser génération exports si session expirée (`sessionStorage` vidé) |

### 7.2 Golden cases (corpus minimal)

| Simulateur | Cas | Résultat attendu |
|-----------|-----|------------------|
| IR | Célibataire TMI 30% (RFR 50K, 1 part) | IR brut, net, TMI, décote |
| IR | Couple 2 enfants TMI 41% (RFR 150K, 3 parts) | IR brut, quotient, plafonnement |
| Succession | Conjoint survivant (500K, 2 enfants) | Droits DMTG, abattements |
| Succession | Frères/soeurs (200K) | Barème Art. 777 |
| Crédit | Prêt 25 ans (300K, 1.5%) | Échéancier, coût total |

### 7.3 Snapshots exports

Pour chaque simulateur avec export : créer 2-3 golden cases JSON → générer PPTX/Excel → extraire structure (nombre slides, titres) → stocker hash SHA256. CI compare le hash.

```
tests/snapshots/
├── ir-golden-1.input.json
├── ir-golden-1.pptx.snapshot
├── credit-golden-1.input.json
└── credit-golden-1.pptx.snapshot
```

### 7.4 Points d'arrêt par type de PR

| PR touche | Validations obligatoires |
|-----------|-------------------------|
| `src/engine/` | Golden cases JSON |
| `src/pptx/` | Snapshot export hash |
| `src/settings/` ou `src/auth/` | E2E auth + settings |
| `database/` ou `supabase/` | Checklist RLS + revue manuelle |
| `src/styles.css` ou thème | Test visuel 3 thèmes |

---

## 8. Gouvernance cible du repo

### 8.1 Structure domain-first (cible)

```
src/
├── auth/                  # AuthProvider, PrivateRoute, AdminGate, useUserRole
├── components/            # Composants UI réutilisables (Button, Card, Table, Badge)
│   ├── settings/          # Composants settings partagés
│   └── ui/                # Composants UI génériques
├── constants/             # settingsDefaults.ts, settingsRoutes.js, labels, templates
├── engine/                # Calculs métier UNIQUEMENT (zéro React)
│   ├── ir/                # Barème, décote, CEHR, quotient familial
│   ├── placement/         # AV, PER, PEA, CTO
│   ├── credit/            # Échéancier, lissage, capital décès
│   ├── succession/        # DMTG, abattements, répartition
│   └── types.ts           # Types communs engine
├── features/              # Features métier (UI + logique spécifique)
│   ├── audit/             # Wizard audit patrimonial
│   ├── strategy/          # Builder stratégie guidée
│   ├── ir/                # Simulateur IR (pages + composants + hooks)
│   ├── placement/         # Simulateur Placement
│   ├── credit/            # Simulateur Crédit (déjà modulaire)
│   └── settings/          # Pages Settings (impots, PS, contrats, comptes)
├── hooks/                 # Hooks partagés cross-feature
├── icons/                 # SVG business icons
├── pptx/                  # Pipeline export PPTX (design system, slides, theme)
├── reporting/             # Orchestration exports (PPTX + Excel)
│   ├── excel/             # xlsxBuilder + helpers
│   └── json-io/           # globalStorage + snapshot migrations
├── settings/              # ThemeProvider, presets, theme tokens
├── styles/                # CSS partagés, variables, semantic colors
├── types/                 # Types partagés cross-domain
└── utils/                 # Utilitaires techniques (debugFlags, errorHandling, number)
```

### 8.2 Règles de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Dossier feature | kebab-case | `src/features/credit/` |
| Composant React | PascalCase.tsx | `CreditLoanForm.tsx` |
| Hook | camelCase.ts | `useCreditCalculations.ts` |
| Utilitaire | camelCase.ts | `creditNormalizers.ts` |
| Engine module | camelCase.ts | `src/engine/ir/baremeIr.ts` |
| Test | `*.test.ts` à côté du fichier | `baremeIr.test.ts` |
| CSS page | PascalCase.css | `Credit.css` (dans le dossier feature) |
| CSS partagé | kebab-case.css | `src/styles/premium-shared.css` |
| Migration DB | `YYYYMMDDHHNN_description.sql` | `202603010001_add_tenant_id.sql` |
| Golden case | `simulateur-golden-N.input.json` | `ir-golden-1.input.json` |

### 8.3 Règles anti-dette

| Règle | Seuil | Action |
|-------|-------|--------|
| God file | > 500 lignes ou > 20KB | Ticket de découpe obligatoire |
| Calcul dans React | Toute formule fiscale dans `.jsx/.tsx` | Extraire vers `src/engine/` |
| Import CSS croisé | Page importiant le CSS d'une autre | Migrer vers styles partagés |
| Couleur hardcodée | Tout hex hors WHITE/WARNING | Ticket de correction |
| `console.log` prod | Toute occurrence hors debug flag | ESLint error (bloquant) |
| `user_metadata` auth | Toute occurrence dans check sécurité | Ticket sécurité P0 |

### 8.4 Sources de vérité uniques

| Donnée | Source unique | Consommateurs |
|--------|-------------|---------------|
| Tokens C1-C10 | `src/settings/theme.ts` | ThemeProvider, styles.css, resolvePptxColors |
| Defaults fiscaux | `src/constants/settingsDefaults.ts` | cache, irEngine, Settings pages |
| Routes Settings | `src/constants/settingsRoutes.js` | SettingsShell, SettingsNav |
| Types audit | `src/features/audit/types.ts` | AuditWizard, strategy |
| Types contrats | `src/types/baseContratSettings.ts` | BaseContrat, adapter, cache |
| Labels FR contrats | `src/constants/baseContratLabels.ts` | BaseContrat UI |
| Admin check DB | `public.is_admin()` | Toutes policies RLS |
| Admin check frontend | `useUserRole()` → `app_metadata.role` | Pages admin |
| Presets thème | `src/settings/presets.ts` | ThemeProvider, Settings |
| JSON snapshot | `SNAPSHOT_VERSIO
> N `* dans (IR)** `glol✅).
> * **P1-05 (Placement)**N POGRESS🏗️ (R-1 à R-4 vaidéesEngie odulaisé.Rest PR-5Cuto
| Design system PPTX | `src/pptx/designSystem/serenity.ts` | Tous slide builders |

---

## 9. Roadmap Phase 0 → 4

### Phase 0 — Foundations (4-6 semaines)

**Objectif** : Poser les bases SaaS sans casser l'existant.

| ID | Livrable | Risque |
|----|----------|--------|
| P0-01 | Auth : workflow invitation admin (email template, onboarding, **blocage self-signup**) | Moyen |
| P0-02 | Multi-tenant : RLS `profiles` filtrée par `cabinet_id` + RLS `cabinets` per-admin. **Les tables settings restent GLOBALES** (conforme à l'exigence : règles partagées SaaS) | Moyen |
| P0-03 | Validation isolation branding (logo + palette per-cabinet) | Faible |
| P0-04 | Golden cases JSON (IR, succession, crédit) + snapshots exports | Faible |
| P0-05 | Découpe god files critiques (`irEngine.js`, `placementEngine.js`) | Moyen |
| P0-06 | Sessions TTL pro : heartbeat 30 s, grâce **2-5 min** (perte heartbeat : réseau/tab hidden — PAS conservation après fermeture onglet), coupure **1 h inactivité** (reset : saisie, navigation, clic CTA), purge `sessionStorage`, UX "session expire dans X min" | Moyen |
| P0-07 | Unifier migrations (`database/` + `supabase/`) | Faible |
| P0-08 | ESLint `ser1-colors` → `error` + cleanup hardcodes | Faible |
| P0-09 | Politique de téléchargement MVP client-side : bouton export **disabled** si session expirée, révocation Blob URLs, purge `sessionStorage`, message UX "session expirée" | Faible |
| P0-10 | Gate tests admin : wizard règles fiscales/produits → publication **bloquée si 0 test** importé et exécuté. Le système demande explicitement un corpus de tests | Moyen |

### Phase 1 — MVP Simulateurs + JSON (6-8 semaines)

**Objectif** : Premiers simulateurs complets + sauvegarde locale robuste.

| ID | Livrable | Risque |
|----|----------|--------|
| P1-01 | JSON local : schema versioning + migrations auto + Zod | Moyen |
| P1-02 | Simulateur Succession : UI + export PPTX/Excel | Moyen |
| P1-03 | Simulateur Épargne retraite (PER) : UI + engine + export | Moyen |
| P1-04 | Refactor IR : pattern CreditV2 (components/hooks/utils) | **Haut** |
| P1-05 | Refactor Placement : pattern CreditV2 | **Haut** |
| P1-06 | Feature flag `VITE_USE_BASE_CONTRAT_FOR_PLACEMENT` → ON | Moyen |

> Statut exécution (2026-02-14) : **P1-04 DONE** avec preuves de non-régression (fichiers IR < 500 lignes, smoke tests export IR PPTX/Excel, `npm run check` vert).

### Phase 2 — Analyse Patrimoniale + Simulateurs (6-8 semaines)

**Objectif** : Analyse patrimoniale complète + simulateurs supplémentaires.

| ID | Livrable | Risque |
|----|----------|--------|
| P2-01 | Rapport PPTX audit complet (civil, actifs, passifs, fiscalité) | Moyen |
| P2-02 | Simulateur Épargne comparaison (2 placements) | Faible |
| P2-03 | Simulateur Prévoyance (capital décès, IJ) | Moyen |
| P2-04 | Société light : types holding dans audit | Moyen |
| P2-05 | ThemeProvider split (hooks + context) | Moyen |
| P2-06 | Observabilité serveur (logs structurés Edge Functions, zéro métriques métier) | Faible |
| P2-07 | MFA phase 2 : TOTP (Supabase Auth MFA) + recovery codes. Activation optionnelle par l'admin, obligatoire pour super-admin | Moyen |

### Phase 3 — Scénario Auto + Société Fine (4-6 semaines)

**Objectif** : Stratégie guidée automatique + société extensible.

| ID | Livrable | Risque |
|----|----------|--------|
| P3-01 | Scénario auto : baseline vs stratégie recommandée | **Haut** |
| P3-02 | Société fine : organigramme holding, flux inter-sociétés | **Haut** |
| P3-03 | Simulateur Trésorerie entreprise | Moyen |
| P3-04 | Simulateur Épargne salariale | Moyen |
| P3-05 | Export PPTX stratégie complète | Moyen |

### Phase 4 — Scanner Local (6-8 semaines)

**Objectif** : Pré-remplissage quasi complet depuis documents scannés.

| ID | Livrable | Risque |
|----|----------|--------|
| P4-01 | Infrastructure scanner : capture image + OCR local | **Haut** |
| P4-02 | Parser Avis IR | Moyen |
| P4-03 | Parser Relevés AV + PER | Moyen |
| P4-04 | Parser Relevés bancaires | Moyen |
| P4-05 | Parser Livret de famille + Acte donation | **Haut** |
| P4-06 | Parser CNI/passeport | Moyen |
| P4-07 | Parser Bilan comptable + Statuts société | **Haut** |
| P4-08 | Parser Contrat prévoyance + Tableau amortissement | Moyen |

---

## 10. Backlog exécutable

| ID | Titre | Valeur | Risque | Modules impactés | Done when |
|----|-------|--------|--------|-----------------|-----------|
| P0-01 | Auth invitation admin (blocage self-signup) | Haute | Moyen | `auth/`, Edge Function | Email envoyé, user créé avec rôle correct, self-signup désactivé |
| P0-02 | Multi-tenant RLS profiles par cabinet | Haute | Moyen | `database/`, `supabase/` | Admin cabinet ne voit que ses propres users ; **tables settings restent GLOBALES** |
| P0-03 | Validation branding isolation | Moyenne | Faible | ThemeProvider, PPTX | Logo + palette correctement injectés per-cabinet |
| P0-04 | Golden cases + snapshots | **Critique** | Faible | `engine/__tests__/`, `tests/snapshots/` | CI bloque si divergence |
| P0-05 | Découpe god files engine | Haute | Moyen | `engine/`, `utils/` | Fichiers <500 lignes, zéro régression |
| P0-06 | Sessions TTL pro (heartbeat 30s, grâce 2-5 min perte heartbeat, 1h inactivité) | Haute | Moyen | `auth/`, `App.jsx`, `hooks/` | Heartbeat 30s, grâce 2-5 min (réseau/tab hidden), déco après 1h inactivité (reset: saisie/nav/CTA), purge sessionStorage, UX message |
| P0-07 | Unifier migrations | Moyenne | Faible | `database/`, `supabase/` | Un seul répertoire, convention OK |
| P0-08 | ser1-colors → error | Moyenne | Faible | `eslint.config.js` | Zéro hardcode non autorisé |
| P0-09 | Politique téléchargement MVP client-side | Haute | Faible | Composants export, `hooks/` | Bouton disabled si session expirée, Blob URLs révoquées, purge `sessionStorage`, UX message |
| P0-10 | Gate tests admin (règles fiscales) | Haute | Moyen | `Sous-Settings/`, `BaseContrat.tsx` | Publication bloquée si 0 test ; UI demande corpus |
| P1-01 | JSON versioning + Zod | Haute | Moyen | `utils/globalStorage.js` | Load ancien fichier → migration auto |
| P1-02 | Simulateur Succession UI | Haute | Moyen | `pages/`, `engine/succession` | UI + export PPTX/Excel |
| P1-03 | Simulateur Épargne retraite | Haute | Moyen | `pages/`, `engine/` | UI + engine + export |
| P1-04 | Refactor IR (CreditV2 pattern) | Haute | **Haut** | `pages/Ir.jsx` → `features/ir/` | <500 lignes par fichier |
| P1-05 | Refactor Placement (CreditV2) | Haute | **Haut** | `pages/PlacementV2` → `features/placement/` | <500 lignes par fichier |
| P1-06 | Feature flag base_contrat ON | Moyenne | Moyen | `hooks/usePlacementSettings` | Mêmes résultats que `extractFiscalParams` |
| P2-01 | Rapport PPTX audit complet | **Critique** | Moyen | `pptx/`, `features/audit` | PPTX patrimoine complet |
| P2-02 | Simulateur Épargne comparaison | Haute | Faible | `pages/`, `engine/` | UI + export |
| P2-03 | Simulateur Prévoyance | Haute | Moyen | `pages/`, `engine/` | UI + export |
| P2-07 | MFA phase 2 (TOTP + recovery codes) | Haute | Moyen | `auth/`, Supabase Auth MFA | TOTP activé, recovery codes générés, obligatoire super-admin |
| P3-01 | Scénario auto stratégie | **Critique** | **Haut** | `features/strategy/` | Baseline vs stratégie automatique |
| P4-01 | Infrastructure scanner OCR | Haute | **Haut** | Nouveau module | Capture → texte brut fiable |

---

## 11. Plan PR-by-PR

### PR-01 : Docs-only — Roadmap SaaS V1 (CETTE PR)

| Aspect | Détail |
|--------|--------|
| Scope | Création `docs/ROADMAP_SAAS_V1.md` |
| Fichiers | `docs/ROADMAP_SAAS_V1.md` (création) |
| Validation | `npm run check` passe (aucun code modifié) |
| Risque | Aucun |
| Rollback | `git revert` |

### PR-02 : Golden cases JSON + snapshot exports

| Aspect | Détail |
|--------|--------|
| Scope | Corpus golden cases (IR, succession, crédit) + infrastructure snapshot |
| Fichiers | `src/engine/__tests__/golden/`, `tests/snapshots/`, `vitest.config.ts` |
| Validation | `npm run check` + `npm test` (nouveaux tests passent) |
| Risque | Faible — ajout de tests uniquement |
| Rollback | Supprimer fichiers de tests |

### PR-03 : Découpe irEngine.js → engine/ir/

| Aspect | Détail |
|--------|--------|
| Scope | Split `src/utils/irEngine.js` en modules `src/engine/ir/` |
| Fichiers | `src/engine/ir/baremeIr.ts`, `decoteIr.ts`, `quotientFamilial.ts`, `index.ts` + re-export dans `utils/irEngine.js` |
| Validation | `npm run check` + golden cases IR + E2E IR |
| Risque | Moyen — imports à mettre à jour |
| Rollback | Restaurer `irEngine.js` original |

### PR-04 : Découpe placementEngine.js → engine/placement/

| Aspect | Détail |
|--------|--------|
| Scope | Split `src/engine/placementEngine.js` par enveloppe |
| Fichiers | `src/engine/placement/av.ts`, `per.ts`, `pea.ts`, `cto.ts`, `index.ts` |
| Validation | `npm run check` + golden cases placement + E2E |
| Risque | **Haut** — 50KB, nombreux consommateurs |
| Rollback | Restaurer original |

### PR-05 : Multi-tenant RLS profiles per-cabinet

| Aspect | Détail |
|--------|--------|
| Scope | RLS `profiles` filtrée par `cabinet_id` (admin ne voit que son cabinet). RLS `cabinets` per-admin. **Les tables settings (tax, ps, fiscality, base_contrat) restent GLOBALES** (règles partagées SaaS, conforme à l'exigence) |
| Fichiers | `supabase/migrations/YYYYMMDD_rls_profiles_per_cabinet.sql` |
| Validation | `npm run check` + tests RLS isolation (admin A ne voit pas users de cabinet B) + E2E |
| Risque | Moyen — migration RLS uniquement, pas de changement de schéma |
| Rollback | DROP POLICY + recréer ancienne policy |

### PR-06 : Sessions TTL pro

| Aspect | Détail |
|--------|--------|
| Scope | Heartbeat + inactivité 1h + UX expiration |
| Fichiers | `src/hooks/useSessionTTL.ts`, `src/auth/AuthProvider.tsx`, `src/App.jsx` |
| Validation | `npm run check` + E2E timeout |
| Risque | Moyen |
| Rollback | Supprimer hook + revert AuthProvider |

### PR-07 : Refactor IR (pattern CreditV2)

| Aspect | Détail |
|--------|--------|
| Scope | `pages/Ir.jsx` → `features/ir/` (components, hooks, utils, index) |
| Fichiers | `src/features/ir/**`, `src/App.jsx` (import update) |
| Validation | `npm run check` + golden cases + E2E IR + snapshot export |
| Risque | **Haut** — 50KB, export PPTX dépendant |
| Rollback | Restaurer `pages/Ir.jsx` |

### PR-08 : Refactor Placement (pattern CreditV2)

| Aspect | Détail |
|--------|--------|
| Scope | `pages/PlacementV2.jsx` → `features/placement/` |
| Validation | `npm run check` + golden cases + E2E + snapshot export |
| Risque | **Haut** |

---

## 12. Recommandation architecture

### Domain-first monorepo (recommandé)

Le repo est suffisamment cohérent pour rester en **monorepo**. La stratégie recommandée est un refactoring domain-first progressif :

1. **Garder un seul package** — `package.json` unique, pas de workspaces
2. **Regrouper par domaine** dans `src/features/` (pattern prouvé avec `credit/`, `audit/`, `strategy/`)
3. **Engine isolé** — `src/engine/` reste sans aucune dépendance React (testable unitairement)
4. **PPTX isolé** — `src/pptx/` ne dépend que de `engine/` et `settings/` (pas de React)
5. **Reporting unifié** — `src/reporting/` pour l'orchestration exports (PPTX + Excel + JSON)

### Pourquoi pas un monorepo multi-packages

- Overhead Turborepo/Nx disproportionné pour l'équipe actuelle (1-3 devs)
- Le couplage PPTX ↔ engine ↔ theme est légitime et ne justifie pas de packages séparés
- CI/CD Vercel actuel est simple et efficace (build unique)

### Quand reconsidérer

- Si l'équipe dépasse 5 devs travaillant en parallèle sur des domaines disjoints
- Si le bundle dépasse 1MB et nécessite un code-splitting par domaine
- Si une API backend séparée (hors Edge Functions) est nécessaire

---

## 13. Hypothèses & décisions explicites

### Hypothèses

| # | Hypothèse | Justification |
|---|-----------|---------------|
| H1 | Les barèmes fiscaux sont mis à jour au maximum 1 fois par an | Vérifié : `currentYearLabel: '2025 (revenus 2024)'` dans `settingsDefaults.ts` |
| H2 | Un cabinet = un admin principal (pas de multi-admin par cabinet pour l'instant) | Constat : Edge Function `create_user` crée des users avec rôle, pas de concept multi-admin per-cabinet |
| H3 | Les règles fiscales et le catalogue produits sont **GLOBAUX** (super-admin SaaS, pas per-cabinet) | Exigence explicite : législation française unique, pas de variation par cabinet. Confirmé par le schéma actuel (`tax_settings`, `ps_settings`, `fiscality_settings`, `base_contrat_settings` = singletons sans `cabinet_id`) |
| H4 | Le pattern CreditV2 (components/hooks/utils) est la cible de refactoring pour tous les simulateurs | Validé par l'existence de `src/pages/credit/` (13 fichiers modulaires) vs god files IR/Placement |
| H5 | PptxGenJS reste la solution d'export PPTX | ADR-001 documente la décision et les alternatives évaluées |
| H6 | Le scanner (phase 4) utilise du traitement local (pas de cloud OCR) pour respecter la politique zéro PII | Cohérent avec la politique de confidentialité documentée |
| H7 | Supabase reste le backend unique (pas de migration vers un backend custom) | L'architecture actuelle (Auth, DB, Storage, Edge Functions, Realtime) couvre les besoins |
| H8 | Le JSON local (`.ser1`) reste le mode de persistence client (pas de stockage server-side des dossiers) | Architecture "zéro stockage client" documentée |
| H9 | L'admin SaaS est un technicien métier (CGP avec appétence technique), pas un développeur | Exigence explicite : toutes les règles modifiables via wizard CRUD sans coder |

### Décisions prises dans ce document

| # | Décision | Alternatives rejetées | Raison |
|---|----------|----------------------|--------|
| D1 | Monorepo domain-first (pas de multi-packages) | Nx/Turborepo workspaces | Overhead disproportionné pour l'équipe |
| D2 | Golden cases JSON + hash snapshot (pas de visual regression testing) | Percy, Chromatic | Trop lourd pour l'infrastructure actuelle |
| D3 | Règles fiscales et catalogue produits restent **GLOBAUX** (pas de `cabinet_id` sur settings) | `cabinet_id` per-settings | Législation française unique ; le super-admin SaaS gère pour tous les cabinets. L'isolation multi-tenant porte sur le branding (logo/palette) et les utilisateurs (`profiles.cabinet_id`), pas sur les règles métier |
| D4 | Phase 4 (scanner) en dernier | Scanner en phase 1 | Valeur maximale avec ROI minimal — les simulateurs sont prioritaires |
| D5 | Unification migrations dans `supabase/migrations/` | Garder dual-track | Confusion réduite, Supabase CLI est l'outil officiel |
| D6 | Gate tests admin obligatoire avant publication de règles | Pas de gate | L'admin construit le corpus de tests ; le système bloque si 0 test. Sécurise les mises à jour fiscales |
| D7 | Exports liés à la session active (MVP client-side : bouton disabled + révocation Blob URLs + purge `sessionStorage`). Server-side 401/expired si passage export côté serveur en phase future | Exports persistants | Cohérent avec "zéro stockage client" et sessions TTL pro |

---

## 14. Prochaines actions & première PR safe

### Actions immédiates

1. **Revue ce document** — Valider les hypothèses H1-H9 et les décisions D1-D7 avec l'équipe
2. **Merger PR-01** (ce document) après relecture
3. **Créer les tickets** pour P0-01 à P0-10 dans le backlog
4. **Exécuter quality gates** quand le dev server sera arrêté (`npm run check`)

### Première PR safe : PR-02 (Golden cases + snapshots)

**Pourquoi PR-02 en premier après la doc** :
- Zéro risque de régression (ajout de tests uniquement)
- Établit le filet de sécurité AVANT tout refactoring
- Valide les résultats actuels des moteurs (IR, succession, crédit)
- Permet de bloquer en CI toute future PR qui casserait un calcul

**Scope PR-02** :
```
src/engine/__tests__/golden/
├── ir-celibataire-tmi30.golden.json
├── ir-couple-2enfants-tmi41.golden.json
├── succession-conjoint-500k.golden.json
├── succession-freres-200k.golden.json
└── credit-immo-25ans-300k.golden.json

src/engine/__tests__/goldenCases.test.ts   # Test runner vérifie chaque fixture

tests/snapshots/
├── README.md                              # Convention + mode d'emploi
└── (vide — rempli par PR suivantes quand exports sont testés)
```

**Commande de validation** :
```bash
npm run check && npm test -- --run
```

---

## Annexe A — Glossaire

| Terme | Définition |
|-------|-----------|
| **Cabinet** | Entité tenant : CGP ou société de conseil |
| **God file** | Fichier > 500 lignes ou > 20KB mélangeant plusieurs responsabilités |
| **Golden case** | Fixture JSON (input → output attendu) pour test de non-régression |
| **Serenity** | Design system PPTX interne (`src/pptx/designSystem/serenity.ts`) |
| **TTL** | Time-To-Live — durée de validité d'une session ou cache |
| **DMTG** | Droits de Mutation à Titre Gratuit (droits de succession/donation) |
| **PFU** | Prélèvement Forfaitaire Unique (flat tax 30%) |
| **CEHR** | Contribution Exceptionnelle sur les Hauts Revenus |
| **PASS** | Plafond Annuel de la Sécurité Sociale |
| **RLS** | Row-Level Security (Supabase/PostgreSQL) |

## Annexe B — Fichiers clés référencés

| Fichier | Rôle |
|---------|------|
| `src/settings/theme.ts` | Tokens C1-C10, `DEFAULT_COLORS` |
| `src/settings/ThemeProvider.tsx` | Provider thème V5 (load, apply, persist) |
| `src/settings/presets.ts` | Presets thème (`PRESET_THEMES`, `resolvePresetColors`) |
| `src/auth/AuthProvider.tsx` | Provider auth Supabase |
| `src/constants/settingsDefaults.ts` | Defaults fiscaux (IR, PS, fiscality) |
| `src/constants/settingsRoutes.js` | Routes Settings (source unique) |
| `src/engine/index.ts` | Point d'entrée moteur calcul |
| `src/engine/types.ts` | Types `CalcResult`, `Assumption`, `Warning`, `RuleVersion` |
| `src/pptx/designSystem/serenity.ts` | Design system PPTX |
| `src/utils/globalStorage.js` | Save/load JSON local `.ser1` |
| `src/utils/xlsxBuilder.ts` | Builder Excel OOXML natif |
| `src/features/audit/types.ts` | Types patrimoniaux complets |
| `src/features/strategy/types.ts` | Types stratégie + recommandations |
| `config/supabase/functions/admin/index.ts` | Edge Function admin |
| `docs/design/color-governance.md` | Gouvernance couleurs |
| `docs/design/ui-governance.md` | Gouvernance UI premium |
| `docs/technical/security-user-metadata-guidelines.md` | Sécurité auth |
| `.github/REPOSITORY_HARDENING/E_ROADMAP.md` | Roadmap hardening existante |
| `.github/REPOSITORY_HARDENING/B_SCORECARD.md` | Scorecard qualité (24/25) |
