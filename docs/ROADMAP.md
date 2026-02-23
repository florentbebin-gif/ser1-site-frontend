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
- **DoD (Preuve)** : Le référentiel Base-Contrat n'utilise plus de seed legacy (catalogue hardcodé + overrides).

##### Séquence d'exécution (PRs)
- **PR 0 : Découpage technique (Dette)** : Extraction des composants de `BaseContrat.tsx` (< 300 lignes). Zéro changement UX.
- **PR 1 : UX Métier & Gates** : Vocabulaire premium, masquage des IDs (mode détaillé), harmonisation de la bannière sur les 3 pages Settings.
- **PR 2 : Assistant de Test "1-Clic"** : Suppression de l'import JSON, création du flux de test métier avec prévisualisation et "Marquer comme référence".
- **PR 3 : Adaptateur Générique** : Remplacement des IDs hardcodés par une résolution dynamique selon la configuration de l'enveloppe.

#### P1-05 — Catalogue Patrimonial & Règles Exhaustives (Base Parfaite)

**Objectif** : Passer d'un catalogue plat "fourre-tout" à une **taxonomie relationnelle SaaS** (Wrappers ↔ Assets ↔ Tax Overlays ↔ Passif), nettoyer les produits non pertinents en direct (structurés), et garantir 100 % de couverture de règles (y compris les Protections calculables).

Implémentation via `schemaVersion: 3` (taxonomie) + `schemaVersion: 4` (cleanup : purge structurés, fusion métaux/crypto, split prévoyance) + `schemaVersion: 5` (rules : zéro exception PM, assimilation OPC/groupements fonciers, split PP/PM, remap legacy IDs).

**Pré-requis** : P1-04 terminé (adapter générique, UX no-tech, tests 1-clic).

##### 1. Refonte du Modèle de Données (`schemaVersion: 3`)
- **Nouveau typage `BaseContratProductV3`** :
  - `catalogKind`: `'wrapper' | 'asset' | 'tax_overlay' | 'protection' | 'liability'`.
  - `directHoldable`: `boolean` (remplace `detensiblePP`).
  - `corporateHoldable`: `boolean` (remplace `eligiblePM`).
  - `allowedWrappers`: `string[]` (Ex: Un actif 'Actions' a `['cto', 'pea']`).
- **Migration automatique** : Fonction `migrateV2ToV3` exécutée au chargement si version antérieure.

##### 2. Taxonomie Cible (5 Familles)

1. **`wrapper` (Enveloppes/Contenants fiscaux)** : Assurance-vie, PEA, CTO, PER, PEE, SCI.
2. **`asset` (Actifs détenables en direct)** : Immo locatif, Résidence principale, Titres vifs, Liquidités, SCPI.
   - *Règle stricte* : Le catalogue patrimonial contient uniquement des actifs détenables directement. Les produits structurés ne sont pas listés.
3. **`liability` (Passif/Dettes)** : Crédit amortissable, Crédit in fine, Lombard. (Crucial pour calcul IFI / Succession).
4. **`tax_overlay` (Surcouches Immo)** : Pinel, Malraux, Déficit foncier (applicables sur `asset` Immo locatif).
5. **`protection` (Prévoyance/Emprunteur)** : *Deviennent calculables*.

##### 2b. Gouvernance catalogue — assimilation (règle métier)

- **Si les règles fiscales sont identiques, on n'ajoute pas de sous-catégories** : on crée un seul produit "assimilé".
- Exemples appliqués :
  - **Crypto-actifs** (BTC/ETH/NFT/stablecoins → `crypto_actifs`) ;
  - **Métaux précieux** (or/argent/platine → `metaux_precieux`) ;
  - **OPC / OPCVM** (OPCVM+SICAV+FCP+ETF → `opc_opcvm`, fiscalité PFU identique) ;
  - **Groupements fonciers** (GFA+GFV+GF/GFF → `groupement_foncier`).
- FCPR/FCPI/FIP/FCPE/OPCI ont des régimes distincts et restent séparés.

##### 2c. Règles V5 — PP/PM split & zéro exception

- **`eligiblePM`** : uniquement `'oui'` ou `'non'` (ancienne valeur `'parException'` supprimée).
- **Split PP/PM** : tout produit PP+PM est scindé en `<id>_pp` + `<id>_pm` (exclusivité PP-only ou PM-only).
- **Remap legacy** : `immobilier_appartement_maison` → `residence_principale`, `per_perin` → `perin_assurance`.

##### 3. Blocs de Règles Manquants (Couverture 100%)

| templateId | Phase | Description (Calcul) |
|------------|-------|----------------------|
| `dmtg-droit-commun` | décès | Barème successoral (DMTG) selon lien de parenté (Gap transversal majeur). |
| `revenus-fonciers-nu` | sortie | Immo : Micro-foncier vs réel (charges + déficit foncier). |
| `bic-meuble-lmnp` | sortie | Immo : Micro-BIC vs réel (amortissements). |
| `passif-deductibilite` | sortie/décès | Dettes : Déductibilité IFI et passif successoral. |
| `primes-prevoyance` | constitution | Protections : Primes versées (déductibles Madelin oui/non). |
| `rentes-invalidite` | sortie | Protections : Rente versée en cas d'ITT (imposabilité IR). |
| `capital-deces-prevoyance` | décès | Protections : Capital décès (Exonéré vs art. 990I). |

##### 4. Séquence d'exécution (PRs, max 7)

- **PR 0 : Anti-Godfile (Dette tech)** : Découpage obligatoire de `src/pages/Sous-Settings/BaseContrat.tsx` (1300 lignes) en sous-composants propres (List, Modal, PhaseColumn).
- **PR 1 : Modèle V3 & Migration** : Implémentation `schemaVersion: 3`, `catalogKind`, et `migrateV2ToV3`.
- **PR 2 : Nettoyage Catalogue & Taxonomie** : Purge des produits obsolètes du seed. Ajout des Wrappers manquants (PEA, CTO) et des Passifs (Crédits).
- **PR 3 : Adaptateur Générique** : Résolution des wrappers via metadata, suppression des IDs hardcodés.
- **PR 4 : Blocs DMTG & Passif** : Création du bloc `dmtg-droit-commun` (assigné à tous les wrappers hors assurance) et des blocs de dettes.
- **PR 5 : Blocs Immobilier & Protections calculables** : Création des blocs foncier/BIC et des blocs Prévoyance (primes, rentes, capital).
- **PR 6 : UI Sélection Entonnoir** : Frontend métier (Choix Enveloppe ➔ Choix Actif ➔ Surcouche). Les relations `allowedWrappers` sont appliquées.
- **PR 7 : Tests 1-clic 100%** : Un cas de test par produit.

##### 5. Fichiers à supprimer à terme

| Fichier | PR de suppression | Preuve de suppression safe |
|---------|-------------------|----------------------------|
| `src/constants/base-contrat/catalogue.seed.v1.json` | ✅ PR3 | `rg "catalogue\.seed" src/` → vide |
| `src/constants/baseContratSeed.ts` | ✅ PR3 | `rg "baseContratSeed" src/` → vide |

##### 6. Manques hors catalogue (à prévoir dans l'analyse patrimoniale globale)
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

### P2 — Analyse patrimoniale + nouveaux simulateurs
Objectif : enrichir l’analyse (audit) et ajouter des simulateurs utiles.

Candidats :
- Rapport PPTX audit complet (civil, actifs, passifs, fiscalité).
- Simulateur épargne comparaison.
- Simulateur prévoyance.
- Observabilité serveur technique (zéro PII, zéro métriques métier).
- MFA (TOTP) pour comptes sensibles.

#### Catalogue — items différés
- **Rulesets per-product** : implémenter les blocs fiscaux (Constitution/Sortie/Décès) par produit — actuellement squelette vide.
- **Fiches succession GFA/GFV vs GFF** : documenter les différences art. 793 bis vs art. 793 1° 3° CGI dans les blocs produit.
- **Confirmation dialog sync** : ajouter un dialog de confirmation avant « Synchroniser le catalogue » (écrase les produits personnalisés).
- **Migration label (Entreprise) → (PM)** : les données DB avec suffixe « (Entreprise) » seront corrigées au prochain sync ; envisager migration active si besoin.
- ~~**Supprimer `handleCompleteCatalogue`**~~ : ✅ fait (V5c).
- ~~**Familles restructurées**~~ : ✅ fait (V5c+V5d — Épargne Assurance / Assurance prévoyance / Épargne bancaire / Dispositifs fiscaux immobilier / split LMNP-LMP / obligations retirées).

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

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + “où changer quoi”)
- `docs/RUNBOOK.md` (diagnostics + opérations)
