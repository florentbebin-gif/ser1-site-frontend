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
  - [P1 — MVP simulateurs + JSON](#p1--mvp-simulateurs--json)
    - [P1-01 — Organisation de src/ & identifiabilité des pages](#p1-01--organisation-de-src--identifiabilite-des-pages)
    - [P1-04 — Base-Contrat V3 : Expérience Admin Premium](#p1-04--base-contrat-v3--expérience-admin-premium--source-de-vérité-universelle)
    - [P1-05 — Catalogue Patrimonial & Règles Exhaustives](#p1-05--catalogue-patrimonial--règles-exhaustives-base-parfaite)
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
- Gate publication des règles/settings admin (tests requint publication).

> Liens : voir aussi [Références code](#références-code) pour Routing, Auth, Thème V5.

---

### P1 — MVP simulateurs + JSON
Objectif : simulateurs robustes + sauvegarde locale versionnée.

#### P1-01 — Organisation de src/ & identifiabilité des pages
Objectif : rendre le front **lisible, modulaire et SaaS-maintainable** en stabilisant une convention claire :

- `src/pages/*` = **entrypoints de routes** (shells minces, orchestration, wiring) ;
- `src/features/*` = **UI + state par domaine** (placement/ir/audit/...) ;
- `src/engine/*` = métier pur (déjà OK) ;
- tout "legacy" consommé par une feature est **explicite** (pas caché dans `pages/`).

Pourquoi maintenant : le repo accélère sur des invariants SaaS (RLS, [Thème V5](#références-code), [Exports](#références-code) premium, settings admin). Sans une arbo stable, chaque PR augmente la dette (onboarding difficile, risques de régressions). Ce chantier s'inscrit en **strangler refactor** : migration incrémentale, page par page.

Ce que ça change (cible) :
- pages identifiables et listables depuis une **source unique** de routes (voir [Routing](#références-code)) ;
- `src/features/*` ne dépend plus de `src/pages/*` (ou alors dépendance temporaire explicitée) ;
- `src/App.jsx` redevient un entrypoint minimal (routing + bootstrap) : layout, icons, et logique transversale sortent en modules dédiés ;
- aucun dossier "spike"/"raw assets" non nécessaire dans `src/`.

##### Constats vérifiés (preuves repo)
1. **Routing déclaré dans un fichier très chargé** : `src/App.jsx` contient à la fois routing, auth/session, topbar/layout, notifications et icônes inline (544 lignes).
   - Preuve : `src/App.jsx` (routes + topbar + icônes SVG) ; voir en particulier la cohabitation `Routes/Route` + `topbar` + `Icon*`.
2. **Dépendance inverse** (feature → pages) sur Placement : des composants de `src/features/placement/*` importent des utilitaires/composants sous `src/pages/placement/*`.
   - Preuve : imports dans `src/features/placement/components/*` vers `@/pages/placement/...`.
3. **Pages Settings dispersées** : les routes settings pointent vers `src/pages/Sous-Settings/*` via `src/constants/settingsRoutes.js`, tandis que du "shared" settings existe aussi sous `src/components/settings/*`.
   - Preuve : `src/constants/settingsRoutes.js` importe `../pages/Sous-Settings/*` ; `src/components/settings/` existe.
4. **Présence de dossiers non-prod dans `src/`** : `src/pptx/template/__spike__/` et `src/icons/business/_raw/` sont présents dans `src/`.
   - Preuve : arborescence `src/pptx/template/__spike__/` et `src/icons/business/_raw/`.

##### Jalons (quick wins → structurants)

###### P1-01a — Conventions + documentation (quick win)
- Convention cible `pages` vs `features` vs `shared` + exemples.
- Règle : pas de code réutilisable nouveau dans `pages/` ; si exception, marquer `legacy`/`temporary`.

###### P1-01b — Routing & AppLayout minimal (structurant)
- Extraire la déclaration des routes de `src/App.jsx` vers un module dédié.
- Introduire un `AppLayout` (topbar, actions, notifications) isolé.
- Extraire les icônes inline en un dossier dédié (`src/components/icons/*` ou `src/icons/app/*`).

###### P1-01c — Stabiliser Placement : isoler le legacy (structurant)
- Objectif : `src/features/placement/*` devient autonome et ne dépend plus de `src/pages/placement/*`.
- Déplacer le legacy consommé (utils/components) vers un emplacement explicite :
  - `src/features/placement/legacy/*` (si uniquement placement), ou
  - `src/shared/placement/*` (si réutilisé par d'autres domaines).

###### P1-01d — Normalisation Settings (structurant)
- Clarifier la cible :
  - `src/pages/settings/*` (entrypoints) + `src/features/settings/*` (logique UI) + `src/components/settings/*` (UI shared).
- Option (quand prêt) : migrer `src/pages/Sous-Settings/*` → `src/pages/settings/*`.

###### P1-01e — Cleanup spikes/raw (quick win + hygiene)
- **Audit obligatoire** avant tout déplacement/suppression : produire une liste des imports/usages réels (tests, exports, edge functions) des dossiers concernés.
- Livrable d'audit : document `docs/audit-spikes-raw.md` (ou section dans RUNBOOK) listant :
  - chemins audités (`src/pptx/template/__spike__/`, `src/icons/business/_raw/`)
  - fichiers référençant ces chemins (rg results)
  - décision par fichier : `keep` (déplacer vers `tools/`) / `delete` (obsolète) / `inline` (intégrer au code prod)
- **Interdiction** de supprimer/déplacer sans audit préalable.
- Post-audit : sortir `__spike__` et `_raw` hors de `src/` (vers `tools/`, `docs/`, ou suppression) selon décision d'audit.

##### Tâches actionnables (tickets / futures PR)

**T1 — Cartographier les pages depuis les routes (DoD = "pages listables")**
- Scope : `src/App.jsx` (lecture) + création future d'un module `src/routes/*`.
- Dépendances : aucune.
- Risques : faibles (doc + extraction mécanique).
- DoD : une liste route → page/feature est maintenue depuis une seule source (module routes) ; `App.jsx` ne contient plus de duplication.

**T2 — Extraire `AppLayout` + actions topbar**
- Scope : `src/App.jsx` (topbar/actions/notifications/context label) → `src/components/layout/AppLayout.*`.
- Dépendances : T1.
- Risques : moyen (layout + comportements dépendants du pathname/session).
- DoD : `src/App.jsx` ne contient plus de markup topbar ni d'icônes inline ; les actions restent identiques (smoke manuel).

**T3 — Extraire les icônes inline en dossier dédié**
- Scope : `src/App.jsx` icônes `Icon*` → `src/components/icons/*` (ou `src/icons/app/*`).
- Dépendances : T2 (idéalement) mais peut être indépendant.
- Risques : faibles (déplacement code pur).
- DoD : icônes partagées importées ; `App.jsx` ne définit plus `IconHome/IconSave/...`.

**T4 — Placement : supprimer la dépendance `features/placement` → `pages/placement`**
- Scope : `src/features/placement/**` et `src/pages/placement/**`.
- Dépendances : P1-01a + P1-01b.
- Risques : moyen/haut (surface large + logique métier/UI) ; refacto strangler en étapes.
- DoD : `rg "@/pages/placement" src/features/placement` ne retourne plus rien (ou seulement un module `legacy` explicitement documenté pendant la transition).

**P1-01c — Doc routes : alignement APP_ROUTES → documentation (pré-requis T5/T6)**
- Objectif : corriger la table des routes dans cette doc pour refléter 100% d'APP_ROUTES.
- Scope : `docs/ROADMAP.md` (ce ticket) + table canon dans `docs/ARCHITECTURE.md`.
- Dépendances : T1 (routes centralisées).
- Risques : faibles (doc only).
- DoD : la table canon des routes est complète et exacte (100% issue d'APP_ROUTES) ; les routes manquantes sont ajoutées (`/sim/epargne-salariale`, `/sim/tresorerie-societe`, `/sim/prevoyance`, redirects legacy).

**P1-01d — Doc cleanup : critères de suppression legacy / spike / raw (pré-requis T5/T6)**
- Objectif : définir les critères mesurables pour supprimer ces dossiers temporaires.
- Scope : `docs/ARCHITECTURE.md` (conventions ajoutées), `docs/ROADMAP.md` (critères).
- Dépendances : T4 (placement legacy), P1-01e (audit spikes/raw).
- Risques : faibles (doc only).
- DoD mesurable :
  - `rg "features/placement/legacy" src --type tsx --type ts` → **vide** (0 import runtime)
  - `find src -type d \( -name "__spike__" -o -name "_raw" \)` → **vide** (après futur T6)

**P1-01x — Debt registry & exit criteria (pré-requis avant T5/T6)**
- Objectif : documenter les dettes existantes + leur critère de suppression + commande de vérif, décider lesquelles traiter dans T6.
- Scope : `docs/ROADMAP.md` (ce bloc) + `docs/ARCHITECTURE.md` (table détaillée).
- Dépendances : P1-01d (doc cleanup).
- Risques : faibles (doc only).
- DoD global :
  - un registre de dettes existe dans la doc (sans nouveau fichier)
  - chaque dette a : description / impact / owner / exit criteria / commandes de vérif
  - une section "ne pas aggraver la dette" (règles simples) est ajoutée
  - la roadmap reflète que T5/T6 dépendent de ce prérequis

**Dettes identifiées :**

| Dette | Type | Où | Pourquoi | Règle | Exit criteria | Vérification |
|-------|------|-----|----------|-------|---------------|--------------|
| A | compat | `src/features/placement/legacy/` | Transition pour découpler features de l'ancien `pages/placement` | Pas de nouvelle feature dans legacy/ | `rg "features/placement/legacy" src` → 0 + npm run check PASS | `rg "features/placement/legacy" src --type tsx --type ts` |
| B | hygiène | `src/pptx/template/__spike__/` | Prototypes / essais PPTX | **RESOLVED** — deleted (0 usage) | **DELETE** | `find src -type d -name "__spike__"` → 0 |
| C | hygiène | `src/icons/business/_raw/` | Sources brutes SVG | **RESOLVED** — deleted (0 usage) | **DELETE** | `find src -type d -name "_raw"` → 0 |
| D | compat | `src/engine/*.ts` | `@deprecated` constants (ABATTEMENT_*, generate*Pptx) | Ne pas ajouter de nouveaux `@deprecated` | Migration vers nouveaux APIs | `rg "@deprecated" src/engine` (maintenir ou réduire) |

**Règles "ne pas aggraver la dette" :**
- Pas de nouveaux imports vers `legacy/`
- Pas de nouveaux fichiers dans `__spike__` ou `_raw`
- Tout nouveau code va dans `features/*`, `components/`, `hooks/`, etc.

---

#### P1-04 — Base-Contrat V3 : Expérience Admin Premium & Source de Vérité Universelle

**Objectif** : Nettoyer le legacy et pivoter vers un catalogue hardcodé fiable avec overrides admin.

##### État du Pivot (PR1–PR5) ✅
- **PR1** : Création du catalogue hardcodé (`src/domain/base-contrat/catalog.ts`) et de l'infrastructure `base_contrat_overrides` (Supabase).
- **PR2** : Refonte de l'UI `/settings/base-contrat` en read-only (3 colonnes : Constitution, Sortie, Décès), toggle PP/PM, et modal de clôture admin.
- **PR3** : Nettoyage massif (suppression seed JSON, cache legacy, hooks, adaptateurs, migration SQL, rules editor).
- **PR4** : Alignement documentation (ARCHITECTURE, RUNBOOK, ROADMAP) + standard process dev Base-Contrat.
- **PR5** : Règles fiscales hardcodées 3 colonnes — 71 produits (Constitution / Sortie / Décès). Quality system : champs `confidence`, `sources`, `dependencies` sur tous les `RuleBlock`. Corrections sourcées sur 6 produits complexes (LMNP art. 84 LF2025, Art. 39 L137-11-1 CSS, Capi PM 238 septies E, GFA 793 bis 600k LF2025, Tontine, Homme-clé). 520 tests verts.

#### P1-05 — Catalogue Patrimonial & Règles Exhaustives (Base Parfaite)

**Objectif** : Implémenter les règles fiscales exhaustives pour chaque famille de produits, avec des tests "golden" et une UX premium sans jargon.

**État actuel** : PR5 livrée. Socle « rules engine » opérationnel — 71 produits avec 3 colonnes de règles fiscales dans l'UI. Un audit qualité approfondi sur 6 produits complexes a corrigé des erreurs factuelles et ajouté un système de confiance (`confidence`/`sources`/`dependencies`).

**Ce qui reste** (planifié PR6–PR8) :
- **Fiabilisation rédactionnelle** (~15 produits) : anciens contrats AV, capitalisation PP/PM mixée, prévoyance individuelle, Art. 83/Madelin/PERIN/PERO, GFA vs GFF — voir PR6.
- **PP/PM split** : 28 produits ont `ppEligible: true` **et** `pmEligible: true` dans `catalog.ts` (ex : `contrat_capitalisation`, `cto`, `article_83`, `pero`) — les règles affichées ne distinguent pas le point de vue PP vs PM — voir PR7.
- **Wiring simulateurs** : `getRules` uniquement consommé par `src/pages/Sous-Settings/BaseContrat.tsx`. Aucun import dans `src/features/` ni `src/engine/` — voir PR8.
- **Golden tests** : `src/engine/__tests__/goldenCases.test.ts` n'existe pas encore — voir PR8.

##### Fichiers supprimés (Cleanup PR3)

| Fichier | PR de suppression | Preuve de suppression safe |
|---------|-------------------|----------------------------|
| `src/constants/base-contrat/catalogue.seed.v1.json` | PR3 | `rg "catalogue\.seed" src/` → vide |
| `src/constants/baseContratSeed.ts` | PR3 | `rg "baseContratSeed" src/` → vide |

##### Manques hors catalogue (à prévoir dans l'analyse patrimoniale globale)
- Démembrement de propriété (Nue-propriété / Usufruit transversal).
- Régimes matrimoniaux (Communauté vs Séparation).
- Gestion fine des SCI et Holding (à l'IS).

##### Critères d'acceptation (DoD global) — Checklist vérifiable
| # | Critère | Commande de vérif. | Résultat attendu |
|---|---------|-------------------|------------------|
| 1 | Routes listables depuis source unique | `rg -n "path:" src/routes/appRoutes.ts` | Retourne la liste des routes APP_ROUTES (pas de duplication inline) |
| 2 | Pas d'import features → pages | `rg "from.*@/pages/" src/features/ -l` | **Vide** (ou uniquement fichiers marqués `legacy.*`) |
| 2b | Doc routes alignée APP_ROUTES | Comparer `src/routes/appRoutes.ts` vs table canon | Table canon = 100% APP_ROUTES (incluant `/sim/epargne-salariale`, `/sim/tresorerie-societe`, `/sim/prevoyance`, redirects legacy) |
| 2c | P1-01c : Pas de dépendance inverse features → pages | `rg "from.*@/pages/" src/features/placement/ -l` | **Vide** (ou uniquement fichiers marqués `legacy.*`) |
| 3 | App.jsx minimal (pas de topbar/icons inline) | `rg "IconHome|IconSave|IconFolder|IconTrash|IconLogout|IconSettings" src/App.jsx` | **Vide** (icônes importées depuis module externe) |
| 4 | Pas de `__spike__`/`_raw` en prod | `find src -type d \( -name "__spike__" -o -name "_raw" \)` | **Vide** (ou chemins explicitement exemptés dans doc d'audit) |
| 5 | Settings unifié (routes source unique) | `rg "settingsRoutes|SETTINGS_ROUTES" src/pages/SettingsShell.jsx` | Retourne au moins 1 match (utilisation de la constante centralisée) |

Livrables typiques (suite P1) :
- JSON `.ser1` versionné + migrations automatiques + validation.
- Simulateurs (IR/Crédit/Placement) "modulaires" (pattern feature).
- Golden cases / snapshots exports (PPTX/XLSX) pour éviter les régressions.

> Liens : voir [Exports](#références-code), [Features](#références-code).

---

## 🚧 Prochaines PRs (PR6–PR8)

> Branche de travail cible : convention `fix/p1-05-*` (existante).
> Priorité recommandée : PR6 → PR7 → PR8.

---

### Standards rédactionnels PP/PM (règle transversale)

> **Cette règle s’applique à toutes les corrections de règles (PR6 et au-delà).**

- **Côté PM** : se placer *à l'intérieur de l’entreprise*. Seules les règles de la société comptent (IS/IR entreprise, déductibilité des charges, traitement comptable). Pas de règles PP.
- **Décès/Transmission PM** : couvrir aussi **dissolution/liquidation** (traitement fiscal du boni, rachat de parts).
- **Max 6 bullets par bloc**, langage professionnel, aucun jargon dev.
- **Blocs `moyenne`/`faible`** : toujours une phrase « À confirmer selon… » + `dependencies` renseigné.
- **Sources** : BOFiP (référence §) ou Légifrance (article) pour toute affirmation précise.

---

### PR6 — Fiabilisation fiscale & rédaction premium

**Objectif** : corriger les règles inexactes ou incomplètes identifiées lors de l’audit. Fichiers concernés : `src/domain/base-contrat/rules/library/*.ts` uniquement.

#### Épargne Assurance (`assurance-epargne.ts`)
- [ ] **Assurance-vie — anciens contrats** (antérieurs au 27/09/2017) : règles distinctes sortie (prélèvement libératoire 7,5 % après 8 ans). Ajouter en `dependencies` ou bullet spécifique.
- [ ] **Capitalisation PP** : retirer les mentions de règles PM (IS, 238 septies E) du bloc PP. Règle PP = même traitement que l’AV PP (PFU 30 % ou barème + abattements 4 600/9 200 €).

#### Prévoyance (`prevoyance.ts`)
- [ ] **Assurance emprunteur PM** — Décès : ajouter que l’indemnié versée à la société constitue un **bénéfice exceptionnel IS ou IR** selon le régime de la société.
- [ ] **Homme-clé** — Décès : retirer le bullet visible « À confirmer… seuls les contrats indemnitaires… » de l’UI (garder uniquement dans `dependencies`).
- [ ] **Prévoyance individuelle décès PP** — Constitution : retirer mention « TNS Madelin 2,5 % PASS + 7,5 %… » (plafond global prévoyance, pas spécifique décès).
- [ ] **Prévoyance individuelle décès PP** — Décès/Transmission : ajouter que **la prime de la dernière année** entre dans l’assiette 990 I ou 757 B selon l’âge au décès.
- [ ] **Prévoyance individuelle ITT/invalidité PP** — Constitution : vérifier si les IJ rentrent dans l’assiette de cotisations sociales pour un TNS en arrêt de travail. Si oui, l’indiquer avec source CSS.
- [ ] **Prévoyance individuelle ITT/invalidité PP** — Décès/Transmission : retirer les infos décès (couvertes par le produit décès distinct).

#### Immobilier direct (`immobilier.ts`)
- [ ] **Résidence principale — Succession** : supprimer les bullets trop génériques (« 100 000 € par enfant… », « IFI 30 % non applicable aux DMTG… » — preuve : `immobilier.ts` lignes 40–45).
- [ ] **Audit bullets « génériques »** : repasser tous les produits immobilier pour supprimer les bullets « abattement 100k, barème DMTG… » qui ne sont pas spécifiques au produit.
- [ ] **GFA/GFV vs GFF** : clarifier ou distinguer `groupement_foncier_agri_viti` vs `groupement_foncier_forestier` (deux produits avec règles quasi-identiques — preuve : `immobilier.ts`).

#### Retraite & Épargne salariale (`retraite.ts`)
- [ ] **Article 83 (anciens contrats)** : retirer la mention « Article 39… » (hors sujet). Revoir les règles spécifiques Art. 83 (cotisations déductibles dans la limite de 8 % de la rémunération brute plafonée à 8 PASS).
- [ ] **Madelin retraite ancien** : ajouter références **art. 154 bis / 154 bis OA (à confirmer + source attendue)** CGI. Retirer mention « 20 % PERP » (hors sujet).
- [ ] **PERIN assurantiel** : ajouter références **art. 154 bis / 154 bis OA (à confirmer + source attendue)** CGI.
- [ ] **PERO** : corriger les règles Art. 39 incorrectes. Documenter la différence vs Art. 83 ancien (forfait social 16 % — à confirmer, source CSS requise).
- [ ] **Produits manquants PM** : créer des blocs pour `ppv_prime_partage_valeur`, `interessement`, `participation` (uniquement pour PM, côté entreprise).

**DoD PR6** :
- `npm run check` vert (tests ≥ 520).
- Chaque correction a une preuve BOFiP/Légifrance dans `sources[]`.
- Aucun bloc ne dépasse 6 bullets.
- `rg "Article 39" src/domain/base-contrat/rules/library/retraite.ts` → plus dans le bloc Art. 83.
- `rg "TNS Madelin 2,5" src/domain/base-contrat/rules/library/prevoyance.ts` → vide.

---

### PR7 — PP/PM split catalogue + conformité UI

**Objectif** : séparer les règles PP et PM pour les produits qui admettent les deux audiences.

**Constat** (preuve repo) : `rg "pmEligible: true" src/domain/base-contrat/catalog.ts -B6 | rg "id:"` retourne 38 produits avec les deux flags `ppEligible: true` et `pmEligible: true` simultanément (dont `contrat_capitalisation` ligne 98–99, `cto` ligne 199–200, `article_83` ligne 228–229, `pero` ligne 300–301, `usufruit_nue_propriete` ligne 654–655, et de nombreux produits valeurs mobiliers et immobilier).

**Plan** :
- [ ] Décider de la stratégie : (a) règles conditionnelles PP/PM dans les library files (pattern déjà utilisé pour `CONTRAT_CAPITALISATION_PP` vs `CONTRAT_CAPITALISATION_PM` dans `assurance-epargne.ts`), ou (b) produits dupliqués PP/PM dans `catalog.ts`.
- [ ] Appliquer la stratégie choisie sur les 38 produits concernés.
- [ ] Migration label « (Entreprise) » → « (PM) » : vérifier si des données DB portent encore l’ancien suffixe — si oui, migration SQL.

**DoD PR7** :
- Pour chaque produit `ppEligible+pmEligible`, des règles distinctes PP et PM existent (ou identité documentée explicitement).
- `npm run check` vert.

---

### PR8 — Wiring simulateurs (FiscalProfile) + golden tests

**Objectif** : brancher les règles fiscales dans les simulateurs et ajouter des golden tests de non-régression.

**Constat** (preuve repo) : `rg "getRules|domain/base-contrat/rules" src/features src/engine -l` → **aucun fichier**. Les règles ne sont consommées que par `src/pages/Sous-Settings/BaseContrat.tsx` (affichage UI settings).

**Plan** :
- [ ] Définir l’interface `FiscalProfile` (sous-ensemble de `RuleBlock` utile pour les calculs).
- [ ] Brancher dans `src/features/placement/` : afficher un résumé fiscal du produit sélectionné.
- [ ] Créer `src/engine/__tests__/goldenCases.test.ts` : cas de référence par produit.

**DoD PR8** :
- `rg "getRulesForProduct" src/features` → au moins 1 match.
- `src/engine/__tests__/goldenCases.test.ts` existe et passe.
- `npm run check` vert.

---

### Item transversal — RLS overrides : clarifier la politique de lecture

**Constat** (preuve — migration `20260223000100_create_base_contrat_overrides.sql`) :
- SELECT : policy `"overrides_select_authenticated"` → `TO authenticated USING (true)` — lecture ouverte à tous les utilisateurs connectés.
- Write : policy `"overrides_write_admin"` → `public.is_admin()` — écriture admin-only ✅.
- `GRANT INSERT, UPDATE, DELETE TO authenticated` — le GRANT technique est large mais la policy RLS protège l’écriture.

**Question ouverte** : la lecture (statut « clôturé » / note admin) doit-elle être réservée aux admins ?
- [ ] **Si admin-only** : remplacer la policy SELECT par `USING (public.is_admin())`.
- [ ] **Si read-for-all-auth** (recommandé pour afficher le statut « clôturé » à tous les utilisateurs du cabinet) : documenter la décision dans le RUNBOOK.

---

### Item transversal — Tests E2E Playwright obsolètes

**Constat** : des tests E2E Playwright (ex: `tests/e2e/configure-rules.spec.ts`) testent encore l'ancienne UI admin (éditeurs JSON, modales de règles) qui a été totalement supprimée lors de PR3.
- [ ] Identifier et supprimer les fichiers E2E obsolètes dans `tests/e2e/`.
- [ ] Vérifier que la CI GitHub Actions (si existante) ne fail pas sur ces anciens tests.

---

### P2 — Analyse patrimoniale + nouveaux simulateurs
Objectif : enrichir l’analyse (audit) et ajouter des simulateurs utiles.

Candidats :
- Rapport PPTX audit complet (civil, actifs, passifs, fiscalité).
- Simulateur épargne comparaison.
- Simulateur prévoyance.
- Observabilité serveur technique (zéro PII, zéro métriques métier).
- MFA (TOTP) pour comptes sensibles.

#### Catalogue — état des items

✅ **Terminé** :
- ~~Rulesets per-product~~ : fait (PR5 — 71 produits, 3 colonnes, quality system).
- ~~Familles restructurées~~ : fait (PR3/V5c+V5d — split LMNP-LMP, obligations retirées, etc.).
- ~~Supprimer `handleCompleteCatalogue`~~ : fait (PR3/V5c).
- ~~Confirmation dialog sync~~ : sans objet — catalogue hardcodé, pas de synchronisation admin.

⏳ **En attente** (voir PR6–PR7) :
- **Fiches GFA/GFV vs GFF** : vérifier la différence fiscale entre `groupement_foncier_agri_viti` (art. 793 bis CGI) et `groupement_foncier_forestier` (art. 793 1°/3° CGI). Si différence réelle → blocs distincts dans `immobilier.ts` ; si identique → fusionner avec mention des deux régimes.
- **Produits manquants PM** : PPV (prime de partage de la valeur), intéressement, participation — afficher uniquement pour PM (côté entreprise) — voir PR6.
- **Migration label « (Entreprise) » → « (PM) »** : vérifier si des données DB portent encore l'ancien suffixe — décision en PR7.

### P3 — Stratégie automatique + société fine
Objectif : recommandations auto + modèle société/holding plus fin.

Candidats :
- Scénario auto (baseline vs recommandation).
- Société fine : organigramme, flux, consolidation.
- Export PPTX stratégie complète.

---

## Références code
Entrées clés :
- Routing : `src/routes/appRoutes.ts` (APP_ROUTES) + rendu dans `src/App.jsx`
- Auth : `src/auth/AuthProvider.tsx`
- Thème V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Tokens couleurs : `src/settings/theme.ts`, `src/styles.css`
- Engine : `src/engine/`
- Features : `src/features/`
- Exports : `src/pptx/`, `src/utils/xlsxBuilder.ts`, `src/utils/exportFingerprint.ts`
- Supabase Edge Function : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Base-Contrat (référentiel contrats)** :
  - Catalogue hardcodé : `src/domain/base-contrat/catalog.ts`
  - Overrides (clôture / note) : `src/domain/base-contrat/overrides.ts`
  - Cache overrides (Supabase) : `src/utils/baseContratOverridesCache.ts`
  - UI (read-only) : `src/pages/Sous-Settings/BaseContrat.tsx`
  - Labels FR (UI) : `src/constants/baseContratLabels.ts`
  - Règles fiscales : `src/domain/base-contrat/rules/` (8 library files, types, index)

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + “où changer quoi”)
- `docs/RUNBOOK.md` (diagnostics + opérations)
