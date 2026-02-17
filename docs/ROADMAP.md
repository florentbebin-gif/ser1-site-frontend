# ROADMAP (source de vérité)

## But
Donner la trajectoire produit vers un **SaaS SER1** (phases, priorités, Definition of Done) sans historique de PR/commits.

## Audience
Dev/Tech lead + PM/owner du produit.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : phases P0→P3, objectifs, DoD, "what’s next", références code.
- ❌ Ne couvre pas : preuves d’exécution, changelog, détails d’implémentation (voir `docs/ARCHITECTURE.md` / `docs/RUNBOOK.md`).

## Sommaire
- [Vision produit](#vision-produit)
- [Definition of Done (SaaS-ready)](#definition-of-done-saas-ready)
- [Phases](#phases)
  - [P0 — Foundations](#p0--foundations)
  - [Chantier transverse — Organisation de src/ & identifiabilité des pages](#chantier-transverse--organisation-de-src--identifiabilite-des-pages)
  - [P1 — MVP simulateurs + JSON](#p1--mvp-simulateurs--json)
  - [P2 — Analyse patrimoniale + nouveaux simulateurs](#p2--analyse-patrimoniale--nouveaux-simulateurs)
  - [P3 — Stratégie automatique + société fine](#p3--stratégie-automatique--société-fine)
- [Références code](#références-code)

---

## Vision produit
SER1 vise un outil **plus simple qu’un progiciel patrimonial** mais **très précis** sur les calculs et **premium** sur les exports (PPTX/Excel), destiné aux CGP/cabinets.

Cibles produit stables (à respecter) :
- **Multi-tenant “cabinets”** : branding (logo + palette) isolé par cabinet.
- **Règles fiscales + catalogue produits = GLOBAUX** (administrés par le **super-admin SaaS**).
- **Zéro stockage dossier client côté serveur** : saisie en session + export, sauvegarde locale `.ser1`.
- **Exports premium** : PPTX (PptxGenJS + design system) + Excel (OOXML natif).
- **Sécurité** : RLS stricte, rôle admin via `app_metadata`, pas de self-signup.

---

## Definition of Done (SaaS-ready)
Une phase/livrable est considérée “DONE” quand :
1. **Sécurité**
   - RLS activé + policies cohérentes (utiliser `public.is_admin()` ; jamais `user_metadata`).
   - Self-signup désactivé, onboarding via invitation/admin.
2. **Qualité**
   - `npm run check` passe.
   - Tests critiques présents (moteur fiscal, exports, settings).
3. **Theming/branding**
   - Thème V5 déterministe (modes `cabinet|preset|my`) et anti-flash OK.
   - PPTX/Excel cohérents avec la palette (pas de hardcodes hors exceptions).
4. **Opérabilité**
   - Runbook (debug, edge functions, migrations) à jour.

---

## Phases

### P0 — Foundations
Objectif : rendre le socle SaaS **sûr** (auth, RLS, conventions, gates).

Livrables typiques :
- Auth : **invitation admin**, pas de self-signup.
- RLS multi-tenant : isolation minimale par cabinet (au moins `profiles`).
- Sessions TTL + policy de téléchargement (exports session-only).
- Gouvernance couleurs/UI + anti-regressions (lint, conventions).
- Gate publication des règles/settings admin (tests requis avant publication).

---

## Chantier transverse — Organisation de src/ & identifiabilité des pages

### 1) Résumé exécutif
Objectif : rendre le front **lisible, modulaire et SaaS-maintainable** en stabilisant une convention claire :

- `src/pages/*` = **entrypoints de routes** (shells minces, orchestration, wiring) ;
- `src/features/*` = **UI + state par domaine** (placement/ir/audit/...) ;
- `src/engine/*` = métier pur (déjà OK) ;
- tout "legacy" consommé par une feature est **explicite** (pas caché dans `pages/`).

Pourquoi maintenant : le repo accélère sur des invariants SaaS (RLS, thème V5, exports premium, settings admin). Sans une arbo stable, chaque PR augmente la dette (onboarding difficile, risques de régressions et d'effets de bord). Ce chantier s'inscrit en **strangler refactor** : migration incrémentale, page par page, avec conventions et Definition of Done, sans big-bang.

Ce que ça change (cible) :
- pages identifiables et listables depuis une **source unique** de routes ;
- `src/features/*` ne dépend plus de `src/pages/*` (ou alors dépendance temporaire explicitée) ;
- `src/App.jsx` redevient un entrypoint minimal (routing + bootstrap) : layout, icons, et logique transversale sortent en modules dédiés ;
- aucun dossier "spike"/"raw assets" non necessaire dans `src/`.

### 2) Constats vérifiés (preuves repo)
1. **Routing déclaré dans un fichier très chargé** : `src/App.jsx` contient à la fois routing, auth/session, topbar/layout, notifications et icônes inline (544 lignes).
   - Preuve : `src/App.jsx` (routes + topbar + icônes SVG) ; voir en particulier la cohabitation `Routes/Route` + `topbar` + `Icon*`.
2. **Dépendance inverse** (feature -> pages) sur Placement : des composants de `src/features/placement/*` importent des utilitaires/composants sous `src/pages/placement/*`.
   - Preuve : imports dans `src/features/placement/components/*` vers `@/pages/placement/...`.
3. **Pages Settings dispersées** : les routes settings pointent vers `src/pages/Sous-Settings/*` via `src/constants/settingsRoutes.js`, tandis que du "shared" settings existe aussi sous `src/components/settings/*` et une logique "feature" sous `src/features/settings/*`.
   - Preuve : `src/constants/settingsRoutes.js` importe `../pages/Sous-Settings/*` ; `src/components/settings/` et `src/features/settings/publicationGate.ts` existent et sont consommés par `pages/Sous-Settings/*`.
4. **Présence de dossiers non-prod dans `src/`** : `src/pptx/template/__spike__/` et `src/icons/business/_raw/` sont présents dans `src/`.
   - Preuve : arborescence `src/pptx/template/__spike__/` et `src/icons/business/_raw/`.

### 3) Jalons (quick wins → structurants) et priorisation

> Note : ces jalons sont planifiés en "transverse" sur P0→P1 car ils réduisent le risque des chantiers produit (simulateurs + exports + settings).

#### M1 — Conventions + documentation (quick win, P0)
- Convention cible `pages` vs `features` vs `shared` (ce doc) + exemples.
- Règle : pas de code réutilisable nouveau dans `pages/` ; si exception, marquer `legacy`/`temporary`.

#### M2 — Routing & AppLayout minimal (structurant, P0)
- Extraire la déclaration des routes de `src/App.jsx` vers un module dédié.
- Introduire un `AppLayout` (topbar, actions, notifications) isolé.
- Extraire les icônes inline en un dossier dédié (`src/components/icons/*` ou `src/icons/app/*`).

#### M3 — Stabiliser Placement : isoler le legacy (structurant, P1)
- Objectif : `src/features/placement/*` devient autonome et ne dépend plus de `src/pages/placement/*`.
- Déplacer le legacy consommé (utils/components) vers un emplacement explicite :
  - `src/features/placement/legacy/*` (si uniquement placement), ou
  - `src/shared/placement/*` (si réutilisé par d'autres domaines).

#### M4 — Normalisation Settings (structurant, P1)
- Clarifier la cible :
  - `src/pages/settings/*` (entrypoints) + `src/features/settings/*` (logique UI) + `src/components/settings/*` (UI shared).
- Option (quand prêt) : migrer `src/pages/Sous-Settings/*` → `src/pages/settings/*`.

#### M5 — Cleanup spikes/raw (quick win + hygiene, P1)
- Sortir `__spike__` et `_raw` hors de `src/` (vers `tools/`, `docs/`, ou suppression si obsolete) selon leur usage.

### 4) Tâches actionnables (tickets / futures PR)

#### T1 — Cartographier les pages depuis les routes (DoD = "pages listables")
- Scope : `src/App.jsx` (lecture) + création future d'un module `src/routes/*`.
- Dépendances : aucune.
- Risques : faibles (doc + extraction mécanique).
- DoD : une liste route → page/feature est maintenue depuis une seule source (module routes) ; `App.jsx` ne contient plus de duplication.

#### T2 — Extraire `AppLayout` + actions topbar
- Scope : `src/App.jsx` (topbar/actions/notifications/context label) → `src/components/layout/AppLayout.*`.
- Dépendances : T1.
- Risques : moyen (layout + comportements dependants du pathname/session).
- DoD : `src/App.jsx` ne contient plus de markup topbar ni d'icônes inline ; les actions restent identiques (smoke manuel).

#### T3 — Extraire les icônes inline en dossier dédié
- Scope : `src/App.jsx` icônes `Icon*` → `src/components/icons/*` (ou `src/icons/app/*`).
- Dépendances : T2 (idéalement) mais peut etre independant.
- Risques : faibles (déplacement code pur).
- DoD : icônes partagées importées ; `App.jsx` ne définit plus `IconHome/IconSave/...`.

#### T4 — Placement : supprimer la dépendance `features/placement` → `pages/placement`
- Scope : `src/features/placement/**` et `src/pages/placement/**`.
- Dépendances : conventions M1 + routes M2.
- Risques : moyen/haut (surface large + logique métier/UI) ; refacto strangler en étapes.
- DoD : `rg "@/pages/placement" src/features/placement` ne retourne plus rien (ou seulement un module `legacy` explicitement documenté pendant la transition).

#### T5 — Settings : unifier l'architecture de navigation + pages
- Scope : `src/constants/settingsRoutes.js`, `src/pages/SettingsShell.jsx`, `src/pages/Sous-Settings/*`, `src/features/settings/*`, `src/components/settings/*`.
- Dépendances : M2 (layout) si on veut intégrer navigation dans layout.
- Risques : moyen (routes internes + permissions adminOnly).
- DoD : `settingsRoutes` reste la source unique ; les pages settings sont sous un dossier standard (a terme `src/pages/settings/*`) et la logique partagée est sous `features/components`.

#### T6 — Sortir `__spike__` et `_raw` de `src/`
- Scope : `src/pptx/template/__spike__/`, `src/icons/business/_raw/`.
- Dépendances : audit usages (imports/tests) avant déplacement.
- Risques : faible→moyen (si des tests/exports les reference).
- DoD : aucun dossier `__spike__` ou `_raw` ne vit sous `src/` ; si conservé, il est relocalisé et documenté (purpose + owner).

### 5) Critères d'acceptation (DoD global)
- Les "pages" sont identifiables et listables depuis **une seule** source de routes.
- `src/pages/` ne contient pas de composants réutilisables non marqués (sinon `legacy/temporary`).
- `src/features/*` ne depend pas de `src/pages/*` (ou dépendance temporaire explicitée et bornée).
- `src/App.jsx` est minimal : pas de mélange routing/layout/icons.
- Aucun `__spike__` / `_raw` non nécessaire dans `src/`.

### P1 — MVP simulateurs + JSON
Objectif : simulateurs robustes + sauvegarde locale versionnée.

Livrables typiques :
- JSON `.ser1` versionné + migrations automatiques + validation.
- Simulateurs (IR/Crédit/Placement) “modulaires” (pattern feature).
- Golden cases / snapshots exports (PPTX/XLSX) pour éviter les régressions.

### P2 — Analyse patrimoniale + nouveaux simulateurs
Objectif : enrichir l’analyse (audit) et ajouter des simulateurs utiles.

Candidats :
- Rapport PPTX audit complet (civil, actifs, passifs, fiscalité).
- Simulateur épargne comparaison.
- Simulateur prévoyance.
- Observabilité serveur technique (zéro PII, zéro métriques métier).
- MFA (TOTP) pour comptes sensibles.

### P3 — Stratégie automatique + société fine
Objectif : recommandations auto + modèle société/holding plus fin.

Candidats :
- Scénario auto (baseline vs recommandation).
- Société fine : organigramme, flux, consolidation.
- Export PPTX stratégie complète.

---

## Références code
Entrées clés :
- Routing : `src/App.jsx`
- Auth : `src/auth/AuthProvider.tsx`
- Thème V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Tokens couleurs : `src/settings/theme.ts`, `src/styles.css`
- Engine : `src/engine/`
- Features : `src/features/`
- Exports : `src/pptx/`, `src/utils/xlsxBuilder.ts`, `src/utils/exportFingerprint.ts`
- Supabase Edge Function : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + “où changer quoi”)
- `docs/RUNBOOK.md` (diagnostics + opérations)
