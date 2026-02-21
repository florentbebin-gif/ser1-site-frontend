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
- Gate publication des règles/settings admin (tests requis avant publication).

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
3. **Pages Settings dispersées** : les routes settings pointent vers `src/pages/Sous-Settings/*` via `src/constants/settingsRoutes.js`, tandis que du "shared" settings existe aussi sous `src/components/settings/*` et une logique "feature" sous `src/features/settings/*`.
   - Preuve : `src/constants/settingsRoutes.js` importe `../pages/Sous-Settings/*` ; `src/components/settings/` et `src/features/settings/publicationGate.ts` existent et sont consommés par `pages/Sous-Settings/*`.
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

✅ **P1-02 & P1-03 (Fondations V2 & Hygiène)** : Déjà réalisés (Mise en place de la structure de base, nettoyage des dossiers spikes/raw).

---

#### P1-04 — Base-Contrat V3 : Expérience Admin Premium & Source de Vérité Universelle

**Objectif** : Faire du catalogue des enveloppes l'unique source de vérité pour tous les simulateurs (IR, Placements), administrable par un utilisateur métier (zéro jargon informatique).

##### 1. UX "No-Tech" et Mode Détaillé
- Les identifiants techniques (slugs, `$ref`, versions) sont strictement masqués en mode normal.
- Le vocabulaire est premium et métier ("Enveloppe", "Modèle de référence", "Règles", "Cas pratique").
- Un mode "⚙ Afficher les détails" reste disponible pour le diagnostic technique admin.
- **DoD (Preuve)** : Aucun jargon technique visible dans l'UI (revue visuelle + captures).

##### 2. Cohérence des Gates de Validation
- La logique d'avertissement est strictement identique entre `/settings/impots`, `/settings/prelevements` et `/settings/base-contrat`.
- La sauvegarde n'est jamais bloquée techniquement, mais l'absence de tests génère un avertissement clair orientant vers l'ajout d'un cas pratique.
- **DoD (Preuve)** : Revue visuelle confirmant l'utilisation d'une bannière d'avertissement harmonisée et non bloquante sur les 3 pages.

##### 3. Assistant de Tests "1-Clic" (Verrouillage de Référence)
- Fini l'import de tests au format JSON. L'admin décrit un cas pratique via un mini-formulaire métier.
- Le système calcule automatiquement le résultat via le moteur réel et affiche un **résumé lisible du calcul** avant validation.
- L'admin valide via un bouton "Marquer comme référence" avec la mention : *"Ce cas servira de contrôle lors des prochaines mises à jour."*
- Ce test "fige" une référence qui peut être désactivée sans être supprimée.
- **DoD (Preuve)** : Démonstration UI (captures/vidéo) du flux de création de test sans exposition de schéma de données, incluant la prévisualisation du calcul.

##### 4. Source de Vérité Universelle (Comportements configurables)
- Objectif : Comportements configurables sans toucher au code.
- Les IDs internes stables sont conservés en base (invisibles dans l'UI).
- L'UI propose un mapping métier ("Ce produit se comporte comme...").
- L'adaptateur dynamique déduit le traitement fiscal sans ID codé en dur dans le front.
- **DoD (Preuve)** : Les simulateurs fonctionnent via le paramétrage UI. Le code (ex: `baseContratAdapter.ts`) n'a plus d'ID métier en dur.

##### Séquence d'exécution (PRs)
- **PR 0 : Découpage technique (Dette)** : Extraction des composants de `BaseContrat.tsx` (< 300 lignes). Zéro changement UX.
- **PR 1 : UX Métier & Gates** : Vocabulaire premium, masquage des IDs (mode détaillé), harmonisation de la bannière sur les 3 pages Settings.
- **PR 2 : Assistant de Test "1-Clic"** : Suppression de l'import JSON, création du flux de test métier avec prévisualisation et "Marquer comme référence".
- **PR 3 : Adaptateur Générique** : Remplacement des IDs hardcodés par une résolution dynamique selon la configuration de l'enveloppe.

#### P1-05 — Catalogue Patrimonial & Règles Exhaustives (Base Parfaite)

**Objectif** : Transformer le catalogue plat actuel (78 entrées, 3 `kind`) en une **taxonomie relationnelle** (Enveloppes → Actifs → Surcouches), et garantir que **100 % des produits** disposent de règles calculables et testées pour les 3 phases de vie (Constitution, Sortie, Transmission). On vise l'exhaustivité, implémentée par étapes cohérentes.

**Pré-requis** : P1-04 terminé (adapter générique, UX no-tech, tests 1-clic).

##### 1. Diagnostic du catalogue actuel (preuves repo)

| # | Problème | Preuve |
|---|----------|--------|
| D1 | **Catalogue plat sans relations** : 78 produits avec `kind` à 3 valeurs (`contrat_compte_enveloppe`, `actif_instrument`, `dispositif_fiscal_immobilier`) mais aucun lien entre enveloppes et actifs logeables. | `catalogue.seed.v1.json` — aucun champ `logeableDans` ni `parentEnvelopeId`. |
| D2 | **IDs adapter ≠ IDs seed** : L'adapter cherche `'assuranceVie'`, `'pea'`, `'cto'` (camelCase). Le seed définit `assurance_vie` (snake_case). `pea`/`cto` absents du seed. | `baseContratAdapter.ts:142` → `findProduct(…, 'assuranceVie')` ; seed → `"id": "assurance_vie"`. |
| D3 | **Enveloppes manquantes** : PEA, PEA-PME, CTO absents du catalogue. L'adapter les attend mais ils n'existent pas. | `rg '"id": "pea"' catalogue.seed.v1.json` → 0 résultat. |
| D4 | **Templates pré-remplis : 4 seulement** sur 78 produits. AV, CTO, PEA, PER-indiv-assurance. 74 produits démarrent avec `EMPTY_RULESET`. | `baseContratTemplates.ts` — `TEMPLATE_KEYS` = 4 entrées. |
| D5 | **blockTemplates : 15 blocs, couverture partielle**. Manquent : DMTG droit commun, revenus fonciers, BIC meublé, déficit foncier, IFI, PV non coté, exonération RP, épargne salariale (abondement), PER déblocage anticipé. | `rg "dmtg\|foncier\|meuble\|lmnp\|ifi" blockTemplates.ts` → 0 résultat pertinent. |
| D6 | **Immobilier trop agrégé** : `immobilier_appartement_maison` regroupe RP (exonérée), RS (PV durée), locatif nu (foncier), meublé (BIC) — 4 régimes fiscaux radicalement différents. | `catalogue.seed.v1.json:614` — 1 seul produit pour 4 régimes. |
| D7 | **PER non distingué bancaire vs assurantiel** : `per_perin` unique. PER bancaire (succession DMTG) ≠ PER assurantiel (990I/757B). | `catalogue.seed.v1.json:922` — 1 seul produit `per_perin`. |
| D8 | **Produits structurés sélectionnables** : 4 entrées (autocall, certificats, emtn_notes, warrants_options) devraient être retirées du catalogue (logés dans CTO/AV). | `catalogue.seed.v1.json:824-878` — family "Produits structurés". |
| D9 | **templateKey orpheline** : Le seed a ~20 valeurs `templateKey` distinctes (ex: `insurance_life_savings`) déconnectées des templates de `baseContratTemplates.ts` (ex: `assurance-vie`). Deux systèmes parallèles. | `baseContratSeed.ts:151` passe `raw.templateKey` ; `baseContratTemplates.ts:340` définit des clés différentes. |

##### 2. Taxonomie cible (4 niveaux)

**Niveau 1 — Enveloppes / Supports** (kind: `enveloppe`) — "Où est logé l'actif ?"

| Catégorie | Produits | Label UI |
|-----------|----------|----------|
| Assurance | Assurance-vie, Contrat de capitalisation | « Assurance-vie », « Capitalisation » |
| Épargne actions | **PEA** (à créer), **PEA-PME** (à créer) | « PEA », « PEA-PME » |
| Compte-titres | **CTO** (à créer) | « Compte-titres (CTO) » |
| Retraite individuelle | **PER assurantiel** (scinder), **PER bancaire** (scinder) | « PER assurance », « PER compte-titres » |
| Retraite entreprise | PERCOL, PERO, Article 83, PERCO (ancien), PERP (ancien), Madelin retraite | Labels existants |
| Épargne salariale | PEE | « PEE » |
| Épargne réglementée | Livret A, LDDS, LEP, Livret Jeune, PEAC | Labels existants |
| Épargne logement | PEL, CEL | Labels existants |
| Bancaire imposable | CAT, CSL, Compte courant | Labels existants |

**Niveau 2 — Actifs / Instruments** (kind: `actif`) — "Quel type d'actif ?"

| Catégorie | Produits |
|-----------|----------|
| Titres cotés | Actions, Actions de préférence, OAT, Obligations corporate, Obligations convertibles, Parts sociales coopératives, Titres participatifs, Droits/BSA/DPS |
| Fonds / OPC | ETF, OPCVM, SICAV, FCP, FCPR, FCPI, FIP, OPCI |
| Fonds épargne salariale | FCPE |
| Immobilier direct | **Résidence principale** (scinder), **Résidence secondaire** (scinder), **Immobilier locatif nu** (scinder), **Immobilier meublé LMNP/LMP** (scinder), Terrain, Garage/parking |
| Immobilier indirect | SCPI, GFA, GFV, GFF |
| Crypto-actifs | Bitcoin, Ether, Stablecoins, Tokens, NFT |
| Métaux précieux | Or physique, Argent physique, Platine/palladium |
| Non coté / PE | Actions non cotées, Obligations non cotées, Crowdfunding, SOFICA, IR-PME (Madelin) |
| Créances / Droits | Compte courant d'associé, Prêt entre particuliers, Usufruit/nue-propriété |

**Niveau 3 — Surcouches fiscales immobilières** (kind: `surcouche_fiscale`) — applicable uniquement à un actif immobilier

| Produit | Ouvert 2026 |
|---------|-------------|
| Pinel / Pinel+ | Non |
| Denormandie | Oui |
| Malraux | Oui |
| Monuments historiques | Oui |
| Loc'Avantages | Oui |
| Censi-Bouvard | Non |
| Scellier | Non |
| Duflot | Non |
| Louer abordable (Cosse) | Non |
| Relance logement (Jeanbrun) | Oui |

**Niveau 4 — Protections / Assurances de personnes** (kind: `protection`) — pas de règles fiscales calculées, blocs note uniquement

| Produit |
|---------|
| Assurance emprunteur |
| Prévoyance individuelle (ITT/invalidité/décès) |
| Assurance dépendance |
| Assurance obsèques |

**Flux UI cible** (sélection en entonnoir) :
1. Choix de l'enveloppe ("Où est logé l'actif ?") → filtre les actifs logeables
2. Choix de l'actif ("Quel type d'actif ?") → affiche les règles combinées enveloppe + actif
3. (Optionnel, si actif immobilier) Application d'une surcouche fiscale

##### 3. Blocs de règles manquants à créer

| templateId cible | Phase | Familles | Description |
|------------------|-------|----------|-------------|
| `dmtg-droit-commun` | décès | Tous sauf Assurance | Barème DMTG selon lien de parenté (abattements + tranches). Gap transversal le plus critique. |
| `revenus-fonciers-nu` | sortie | Immobilier direct | Micro-foncier (≤ 15 000 €) vs réel (charges déductibles + déficit foncier imputable). |
| `bic-meuble-lmnp` | sortie | Immobilier direct | Micro-BIC (50 %) vs réel (amortissements). Distinction LMNP / LMP. |
| `exoneration-rp` | sortie | Immobilier direct | Exonération totale PV si résidence principale au jour de la cession. |
| `ifi-fraction-immobiliere` | constitution | Immo direct, Immo indirect, Assurance | Fraction immobilière taxable IFI (seuil 1,3 M€, barème progressif). |
| `pv-titres-non-cotes` | sortie | Non coté/PE | Abattement renforcé durée détention dirigeants (art. 150-0 D ter CGI). |
| `epargne-salariale-abondement` | constitution | Retraite & épargne salariale | Abondement employeur (plafonds PASS), déblocage anticipé PEE. |
| `per-deblocage-anticipe` | sortie | Retraite & épargne salariale | Cas de déblocage anticipé PER (achat RP, etc.) — fiscalité selon compartiment. |
| `droits-succession-pre1991` | décès | Assurance | Contrats souscrits avant 20/11/1991 (exonération totale). Complément 990I/757B. |

##### 4. Matrice de couverture cible (100 %)

Chaque cellule = au moins 1 bloc paramétrable assigné. ✅ = template existant, ❌ = à créer.

| Famille | Constitution | Sortie | Transmission | Existants | Gaps |
|---------|-------------|--------|--------------|-----------|------|
| **Assurance (AV, Capi)** | versements, PS fonds € | rachats post/pré-2017, abattements 8 ans, PS, PFU | 990I, 757B | ✅ complets | pré-1991 |
| **Épargne réglementée** | exo totale | exo totale | **DMTG** | ✅ sortie | ❌ DMTG |
| **Bancaire imposable** | — | PFU/barème + PS | **DMTG** | ✅ sortie | ❌ DMTG |
| **PEA / PEA-PME** | — | ancienneté 5 ans + PS | clôture succession | ✅ sortie | ❌ DMTG |
| **CTO** | — | PFU + dividendes | **DMTG** | ✅ sortie | ❌ DMTG |
| **PER assurantiel** | déductibilité | capital PFU, rente RVTO | 990I, 757B | ✅ | ❌ déblocage anticipé |
| **PER bancaire** | déductibilité | capital PFU, rente RVTO | **DMTG** | partiel | ❌ DMTG, déblocage |
| **PEE / PERCOL** | **abondement** | PFU/exo | **DMTG** | ❌ | ❌ tout |
| **Immo RP** | — | **exo RP** | **DMTG** | ❌ | ❌ exo RP, DMTG |
| **Immo locatif nu** | — | PV immo + **revenus fonciers** | **DMTG** | PV immo ✅ | ❌ foncier, DMTG |
| **Immo meublé** | — | PV immo + **BIC meublé** | **DMTG** | PV immo ✅ | ❌ BIC, DMTG |
| **Immo indirect (SCPI…)** | — | PFU/revenus fonciers | **DMTG** | PFU ✅ | ❌ foncier, DMTG |
| **Crypto-actifs** | — | 150 VH bis | **DMTG** | ✅ | ❌ DMTG |
| **Métaux précieux** | — | taxe forfaitaire | **DMTG** | ✅ | ❌ DMTG |
| **Non coté / PE** | avantage IR | PFU + **PV non coté** | **DMTG** | partiel | ❌ PV non coté, DMTG |
| **Surcouches fiscales immo** | avantage IR | PV immo | — | partiel | — |
| **Créances / Droits** | — | note libre | **DMTG** | note ✅ | ❌ DMTG |
| **Protections** | — | — | — | note ✅ | — |

**Gap majeur transversal** : le bloc `dmtg-droit-commun` manque pour TOUTES les familles hors assurance.

##### 5. Stratégie de validation anti-régression

1. **Cas pratiques obligatoires** : Un produit ne peut passer à `confidenceLevel: 'confirmed'` sans au moins 1 cas pratique validé ("Marqué comme référence") par l'admin métier (flux P1-04 PR 2).
2. **Rejouer automatiquement** : Après chaque modification de règles, les cas pratiques existants sont recalculés. Si un résultat diverge → alerte bloquante avant publication.
3. **Couverture minimale** : Au moins 1 cas pratique par famille × phase applicable avant publication globale.

##### Séquence d'exécution (PRs)

**PR 1 — Refonte Taxonomie & Enveloppes manquantes**
- Scope : Ajout CTO, PEA, PEA-PME au catalogue. Scission PER bancaire / PER assurantiel. Scission immobilier (RP / RS / locatif nu / meublé). Retrait des 4 structurés du sélectionnable (`isActive: false` ou flag `selectable: false`).
- Fichiers : `catalogue.seed.v1.json`, `baseContratSeed.ts`, `baseContratLabels.ts`, `baseContratSettings.ts` (ajout kind `enveloppe` / `actif` / `surcouche_fiscale` / `protection`).
- DoD :
  - Le catalogue reflète la taxonomie 4 niveaux.
  - `rg '"kind": "enveloppe"' catalogue.seed` retourne les enveloppes attendues.
  - Les structurés ne sont plus sélectionnables (revue visuelle).
  - `npm run check` passe.

**PR 2 — Adapter générique (suppression IDs hardcodés)**
- Scope : `baseContratAdapter.ts` résout dynamiquement via `templateKey` ou metadata produit (plus d'ID en dur). Unification des 2 systèmes templateKey (seed vs templates).
- Dépendance : P1-04 PR 3 + PR 1 ci-dessus (IDs stables).
- DoD :
  - `rg "'assuranceVie'\|'pea'\|'cto'" src/utils/baseContratAdapter.ts` → **vide**.
  - Tests snapshot `extractFromBaseContrat()` identiques (golden cases).
  - `npm run check` passe.

**PR 3 — Bloc DMTG droit commun + exonération RP**
- Scope : Création templates `dmtg-droit-commun` et `exoneration-rp` dans `blockTemplates.ts`. Assignation DMTG à tous les produits hors assurance.
- DoD :
  - Tout produit hors famille Assurance a un bloc décès.
  - L'immobilier RP a un bloc exo sortie.
  - `rg "dmtg-droit-commun" blockTemplates.ts` retourne le template.

**PR 4 — Blocs immobilier (foncier / meublé / IFI)**
- Scope : Création templates `revenus-fonciers-nu`, `bic-meuble-lmnp`, `ifi-fraction-immobiliere` dans `blockTemplates.ts`.
- DoD :
  - Les 4 sous-types immobilier ont des blocs sortie complets.
  - Immobilier + SCPI ont un bloc constitution IFI.

**PR 5 — Blocs retraite & épargne salariale + PV non coté**
- Scope : Création templates `epargne-salariale-abondement`, `per-deblocage-anticipe`, `pv-titres-non-cotes`, `droits-succession-pre1991`.
- DoD :
  - PEE/PERCOL ont des blocs constitution + sortie.
  - Matrice de couverture 100 % (toutes les cellules de la matrice §4 ont au moins 1 bloc).

**PR 6 — UI sélection en entonnoir**
- Scope : Adaptation du front pour le flux Enveloppe → Actif → Surcouche (si immo). L'admin et l'utilisateur final voient la même taxonomie, pas de jargon.
- DoD :
  - Revue visuelle : le flux de sélection respecte l'entonnoir.
  - Aucun produit structuré visible en sélection directe.
  - Aucun `kind` technique visible dans l'UI.

**PR 7 — Couverture tests 100 % & Cleanup seed**
- Scope : Au moins 1 cas pratique validé par famille × phase applicable. Suppression du seed JSON si tous les produits sont migrés en base Supabase.
- DoD :
  - `rg "catalogue.seed" src/ --type ts --type tsx` → **vide** (aucun import runtime).
  - Matrice de tests : au moins 1 cas pratique "marqué comme référence" par ligne de la matrice §4.
  - `npm run check` passe.

##### Fichiers à supprimer à terme

| Fichier | PR de suppression | Preuve de suppression safe |
|---------|-------------------|----------------------------|
| `src/constants/base-contrat/catalogue.seed.v1.json` | PR 7 | `rg "catalogue.seed" src/` → vide |
| `src/constants/baseContratSeed.ts` | PR 7 | `rg "baseContratSeed\|SEED_PRODUCTS\|mergeSeedIntoProducts" src/` → vide |

##### DoD global P1-05

| # | Critère | Commande de vérif. | Résultat attendu |
|---|---------|-------------------|------------------|
| 1 | Taxonomie 4 niveaux en place | `rg '"kind":' catalogue.seed` | 4 valeurs distinctes : `enveloppe`, `actif`, `surcouche_fiscale`, `protection` |
| 2 | Enveloppes CTO/PEA/PEA-PME créées | `rg '"id": "(cto\|pea\|pea_pme)"' catalogue.seed` | 3 matches |
| 3 | PER scindé bancaire/assurantiel | `rg '"id": "per_' catalogue.seed` | Au moins `per_assurantiel` et `per_bancaire` |
| 4 | Structurés non sélectionnables | Revue UI — aucun structuré dans la liste de sélection | 0 structuré visible |
| 5 | Adapter sans ID hardcodé | `rg "'assuranceVie'\|'pea'\|'cto'" baseContratAdapter.ts` | **Vide** |
| 6 | DMTG droit commun existe | `rg "dmtg-droit-commun" blockTemplates.ts` | 1+ match |
| 7 | Matrice couverture 100 % | Audit blocs : chaque famille × phase applicable a ≥ 1 bloc | 0 cellule vide |
| 8 | Seed supprimé | `rg "catalogue.seed" src/` | **Vide** |
| 9 | Tests cas pratiques | Au moins 1 cas "marqué comme référence" par famille × phase | Couverture ≥ 18 familles |

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

##### Comment vérifier (commandes + résultats attendus)

```bash
# 1. Lister les routes déclarées (source unique attendue)
rg -n "path:" src/routes/appRoutes.ts
# Résultat attendu : liste des routes (APP_ROUTES)

# 1b. Lister les redirects legacy
rg -n "kind: 'redirect'" src/routes/appRoutes.ts
# Résultat attendu : routes legacy (/placement, /credit, /prevoyance)

# 1c. Vérifier que App.jsx consomme APP_ROUTES (pas de duplication)
rg -n "APP_ROUTES\\.map" src/App.jsx

# 2. Détecter les imports cross features → pages (doit être vide à terme)
rg -n "from.*@/pages/" src/features/ -l
# Résultat attendu : (aucune sortie)

# 3. Vérifier la présence d'icônes inline dans App.jsx (doit être vide à terme)
rg -n "const Icon" src/App.jsx
# Résultat attendu post-T3 : (aucune sortie)

# 4. Lister les dossiers spike/raw dans src/
find src -type d \( -name "__spike__" -o -name "_raw" \)
# Résultat attendu : (aucune sortie)

# 5. Vérifier l'utilisation centralisée des routes settings
grep -n "SETTINGS_ROUTES\|settingsRoutes" src/constants/settingsRoutes.js src/pages/SettingsShell.jsx
# Résultat attendu : matches dans les deux fichiers (source unique utilisée)
```

Livrables typiques (suite P1) :
- JSON `.ser1` versionné + migrations automatiques + validation.
- Simulateurs (IR/Crédit/Placement) "modulaires" (pattern feature).
- Golden cases / snapshots exports (PPTX/XLSX) pour éviter les régressions.

> Liens : voir [Exports](#références-code), [Features](#références-code).

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
- Routing : `src/routes/appRoutes.ts` (APP_ROUTES) + rendu dans `src/App.jsx`
- Auth : `src/auth/AuthProvider.tsx`
- Thème V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`
- Tokens couleurs : `src/settings/theme.ts`, `src/styles.css`
- Engine : `src/engine/`
- Features : `src/features/`
- Exports : `src/pptx/`, `src/utils/xlsxBuilder.ts`, `src/utils/exportFingerprint.ts`
- Supabase Edge Function : `supabase/functions/admin/index.ts`
- Migrations : `supabase/migrations/`
- **Base-Contrat (source de vérité calculateurs)** :
  - Types : `src/types/baseContratSettings.ts`
  - Cache : `src/utils/baseContratSettingsCache.ts`
  - Hook : `src/hooks/useBaseContratSettings.ts`
  - Adapter (→ calculateurs) : `src/utils/baseContratAdapter.ts`
  - Seed catalogue : `src/constants/base-contrat/catalogue.seed.v1.json`
  - Block templates (blocs réutilisables) : `src/constants/base-contrat/blockTemplates.ts`
  - Field labels FR : `src/constants/base-contrat/fieldLabels.fr.ts`
  - Labels FR (UI) : `src/constants/baseContratLabels.ts`
  - Templates pré-remplis (AV/CTO/PEA/PER) : `src/constants/baseContratTemplates.ts`

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + “où changer quoi”)
- `docs/RUNBOOK.md` (diagnostics + opérations)
