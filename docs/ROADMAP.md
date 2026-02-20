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

**P1-02 — Repo hygiene scan & delete unused (DONE)**
- Objectif : appliquer la règle "Si ça ne sert plus = on supprime.", scanner et supprimer les fichiers inutiles (avec preuves).
- Scope : repo complet (src/, tools/, docs/, racine).
- Dépendances : T6 (cleanup spike/raw).
- Risques : faible (PRs petites, revert simple).
- DoD :
  - règle documentée dans `docs/RUNBOOK.md` → section **Repo hygiene — Delete unused**
  - pas de dossiers "archive/backup/old/spike/raw" non justifiés sous `src/`
  - `npm run check` passe
  - toute suppression est revertible (PRs petites)

---

#### P1-03 — Base-Contrat V2 : Catalogue produits + métadonnées obligatoires + seed + cycle de vie

Objectif : faire du référentiel contrats (`/settings/base-contrat`) une **source de vérité opérationnelle** pour les calculateurs actuels (Placement, IR) et futurs (Succession, Épargne salariale, Prévoyance), administrable par le super-admin sans compétence technique.

##### Contexte & état actuel (preuves repo)

| Fichier | Rôle | État |
|---------|------|------|
| `supabase/migrations/20260211001000_create_base_contrat_settings.sql` | Table `base_contrat_settings` (blob JSONB, id=1, RLS `is_admin()`) | ✅ En place |
| `src/types/baseContratSettings.ts` | Types TS V1 (`BaseContratProduct`, `VersionedRuleset`, `Phase`, `Block`) | ✅ En place — V2 à venir |
| `src/pages/Sous-Settings/BaseContrat.tsx` | Page UI (~1 000 lignes) | ✅ Fonctionnel — godfile (voir dette ci-dessous) |
| `src/utils/baseContratSettingsCache.ts` | Cache singleton TTL 24h + localStorage + event bus | ✅ En place |
| `src/hooks/useBaseContratSettings.ts` | Hook load/save/reload/listener | ✅ En place |
| `src/utils/baseContratAdapter.ts` | Extracteur 16 params fiscaux → calculateurs | ✅ En place — IDs hard-codés (à corriger P1-03c) |
| `src/constants/baseContratLabels.ts` | Labels FR UI | ✅ En place — à enrichir |
| `src/constants/baseContratTemplates.ts` | 4 templates pré-remplis (AV, CTO, PEA, PER) | ✅ En place — à compléter |
| `src/features/settings/publicationGate.ts` | Gate publication (bloque si 0 tests) | ✅ En place — comportement à ajuster |
| `src/constants/base-contrat/catalogue.seed.v1.json` | Catalogue ~78 produits (base de travail versionnée) | 🔜 Commit dédié |
| `src/constants/baseContratSeed.ts` | Transformateur seed JSON → `BaseContratProduct[]` | 🔜 Commit dédié |

##### P1-03a — Schéma V2 : métadonnées obligatoires (structurant)

Nouveaux champs obligatoires dans `BaseContratProduct` :

| Champ | Type | Libellé UI FR | Obligatoire |
|-------|------|---------------|-------------|
| `grandeFamille` | `GrandeFamille` (13 valeurs) | Grande famille | ✅ |
| `nature` | `ProductNature` (3 valeurs) | Nature du produit | ✅ |
| `detensiblePP` | `boolean` | Détenable en direct (PP) | ✅ |
| `eligiblePM` | `'oui'\|'non'\|'parException'` | Éligible personnes morales | ✅ |
| `eligiblePMPrecision` | `string\|null` | Précision PM | Si `parException` |
| `souscriptionOuverte` | `'oui'\|'non'\|'na'` | Souscription ouverte en 2026 | ✅ |
| `commentaireQualification` | `string\|null` | Commentaire de qualification | ❌ |

Migration lazy V1→V2 dans `getBaseContratSettings()` (pattern identique à `migrateV1toV2` dans `fiscalSettingsCache.js`). Pas de migration SQL — le blob évolue en place.

- DoD : `schemaVersion: 2` dans le blob après premier save ; `npm run typecheck` passe.

##### P1-03b — Seed catalogue versionné (structurant)

- Fichier source : `src/constants/base-contrat/catalogue.seed.v1.json` (~78 produits, base de travail).
- Transformateur : `src/constants/baseContratSeed.ts` → `SeedProduct[]` → `BaseContratProduct[]`.
- Actions admin non-destructives :
  - **Initialiser le catalogue** : visible si `products.length === 0` — charge tous les produits du seed.
  - **Compléter le catalogue** : visible si `products.length > 0` — ajoute uniquement les produits absents (filtre par `id`), n'écrase rien.
- DoD : un admin peut peupler le catalogue en 1 clic sans saisie manuelle ; les produits existants ne sont jamais écrasés.

##### P1-03c — Cycle de vie produit (structurant)

- **Clôturer** : `isActive: false`, `closedDate: today` — produit masqué des listes actives, récupérable.
- **Rouvrir** : `isActive: true`, `closedDate: null`.
- **Supprimer définitivement** : uniquement sur produit clôturé, confirmation par saisie du mot `SUPPRIMER` (pas du slug technique).
- Section "Produits clôturés" dans la liste avec actions Rouvrir / Supprimer définitivement.
- DoD : les 3 actions fonctionnent ; la suppression est irréversible et confirmée explicitement.

##### P1-03d — Gestion des versions (rulesets)

- **Dupliquer une version** : crée une copie avec nouvelle `effectiveDate` (rebrand de "Nouvelle version").
- **Supprimer une version** : possible uniquement si `vIdx > 0` (version non active) ET `rulesets.length > 1` ; confirmation simple.
- Règle de sécurité : `rulesets[0]` (version active) ne peut pas être supprimée tant qu'elle est la seule ou qu'elle est sélectionnée comme active.
- DoD : impossible de se retrouver avec 0 rulesets sur un produit actif.

##### P1-03e — Gate save vs publish (ajustement)

- **Enregistrer** : toujours autorisé (suppression du blocage dur actuel).
- **Avertissement** : affiché si 0 tests importés ou si aucun produit actif n'a de règles configurées — non bloquant.
- **Publier** (futur) : bloqué si gate échoue — séparation save/publish à implémenter en P2.
- Guide contextuel "Comment ajouter un cas de test" affiché sous l'avertissement.
- DoD : `handleSave()` ne retourne plus jamais `early` à cause du gate ; le warning est visible mais non bloquant.

##### P1-03f — Branchement calculateurs (structurant)

- Wirer `extractFromBaseContrat()` dans Placement + IR + PER.
- Résoudre les IDs produit dynamiquement dans `baseContratAdapter.ts` (supprimer les 3 IDs hard-codés : `assuranceVie`, `cto`, `pea`).
- DoD : `rg "extractFromBaseContrat" src/features` → ≥ 3 matches (placement, ir, per).

##### Critères d'acceptation globaux P1-03

| # | Critère | Commande | Résultat attendu |
|---|---------|----------|------------------|
| 1 | Schema V2 en place | `rg "schemaVersion.*2" src/types/baseContratSettings.ts` | ≥ 1 match |
| 2 | Migration lazy | `rg "migrateBaseContrat" src/utils/baseContratSettingsCache.ts` | ≥ 1 match |
| 3 | Seed non-destructif | Test manuel : Compléter avec produits existants → 0 écrasement | OK |
| 4 | Gate save non-bloquant | Test manuel : save sans tests → sauvegarde OK + warning visible | OK |
| 5 | Adapter dynamique | `rg "assuranceVie.*hard" src/utils/baseContratAdapter.ts` | **Vide** |
| 6 | npm run check | `npm run check` | PASS |

---

#### Dette technique — Découpage des godfiles Settings

> Règle repo (cf. `docs/ARCHITECTURE.md`) : **fichiers > 500 lignes = dette à découper**.

| Fichier | Lignes actuelles | Priorité | Jalon |
|---------|-----------------|----------|-------|
| `src/pages/Sous-Settings/BaseContrat.tsx` | ~1 000 (croissant avec P1-03) | **P1** (en parallèle de P1-03) | Avant fin P1-03 |
| `src/pages/Sous-Settings/SettingsImpots.jsx` | ~1 180 | P2 | Début P2 |
| `src/pages/Sous-Settings/SettingsPrelevements.jsx` | ~1 290 | P2 | Début P2 |

##### Découpage BaseContrat.tsx (P1 — priorité haute)

Cible : aucun fichier dans le dossier `Sous-Settings/base-contrat/` > 300 lignes.

Découpage proposé :

| Nouveau fichier | Contenu extrait |
|---|---|
| `BaseContrat.tsx` (shell) | Orchestration, state global, save/gate — < 150 lignes |
| `ProductList.tsx` | Accordéon liste produits actifs + clôturés |
| `ProductCard.tsx` | Corps d'un produit ouvert (phases + version selector) |
| `PhaseColumn.tsx` | Colonne Constitution / Sortie / Décès |
| `ProductMetadataSection.tsx` | Section "Informations produit" (métadonnées V2) |
| `modals/AddProductModal.tsx` | Modal ajout produit |
| `modals/EditProductModal.tsx` | Modal modification |
| `modals/NewVersionModal.tsx` | Modal nouvelle version / duplication |
| `modals/DeleteVersionModal.tsx` | Modal suppression version |
| `modals/CloseProductModal.tsx` | Modal clôture |
| `modals/DeleteProductModal.tsx` | Modal suppression définitive (confirmation SUPPRIMER) |
| `modals/ImportTestModal.tsx` | Modal import cas de test |

- DoD : `wc -l src/pages/Sous-Settings/BaseContrat.tsx` < 200 ; `npm run check` passe.

##### Lisibilité des champs & références dans Base-Contrat (P1 — feat/base-contrat-ux-nav)

- **Objectif** : 0 camelCase visible / 0 `$ref:` visible en mode normal dans la fiche produit.
- **Livrables** :
  - `src/constants/base-contrat/fieldLabels.fr.ts` — `FIELD_LABELS_FR` + `humanizeFieldKey()` + `formatRefLabel()`
  - `FieldRenderer.tsx` — labels FR, refs lisibles, badge "★ Simulateurs" (remplace "Calc."), mode Détails
  - Toggle "⚙ Afficher les détails" dans la barre de filtres (clés internes + `$ref:` bruts visibles en mode ON)
- **DoD** : `humanizeFieldKey('irRatePercent')` → `'Taux IR (PFU)'` ; `formatRefLabel('$ref:...')` → jamais `$ref:` dans le label ; `npm run check` PASS.
- **Tests** : `src/engine/__tests__/fieldLabels.test.ts` (humanize + formatRef + DoD 0 $ref).

##### P1-03g — Configuration guidée des règles produit (modal "Configurer les règles")

Problème actuel : activer une phase via le toggle "Sans objet" laisse la phase vide ("Aucun bloc défini"). L'admin n'a pas de cadre pour saisir des règles de manière homogène.

**Étape A — Catalogue de blocs réutilisables** (`src/constants/base-contrat/blockTemplates.ts`)

Référentiel de `BlockTemplate` issu de l'audit AV/CTO/PEA/PER :

| `templateId` | Libellé FR | Phases | Grandes familles |
|---|---|---|---|
| `pfu-sortie` | PFU (flat tax) | Sortie | Assurance, Titres vifs, Retraite |
| `ps-sortie` | Prélèvements sociaux | Constitution, Sortie | Assurance, Retraite & épargne salariale, Immobilier |
| `art-990I-deces` | Art. 990 I — primes avant 70 ans | Décès | Assurance, Retraite |
| `art-757B-deces` | Art. 757 B — primes après 70 ans | Décès | Assurance, Retraite |
| `abattements-av-8ans` | Rachats ≥ 8 ans (abattements AV) | Sortie | Assurance |
| `rachats-pre2017` | Rachats versements avant 2017 | Sortie | Assurance |
| `deductibilite-per` | Déductibilité versements PER | Constitution | Retraite & épargne salariale |
| `rente-rvto` | Sortie en rente (RVTO) | Sortie | Retraite & épargne salariale |
| `anciennete-exoneration` | Exonération après ancienneté | Sortie | Assurance, Retraite |
| `note-libre` | Note informative (texte libre) | toutes | toutes |

- DoD : `BLOCK_TEMPLATES.length ≥ 9` ; `BLOCKS_BY_FAMILLE` couvre au moins 5 `GrandeFamille`.

**Étape B — Audit des 78 produits seed** (`src/constants/base-contrat/catalogue.seed.v1.json`) **— DONE**

Pour chaque grande famille : identifier les blocs standards attendus par phase, les champs paramétrables, les champs `$ref` automatiques.

- Livrable : commentaires `// suggestedFor` enrichis dans `blockTemplates.ts` + table récapitulative dans `docs/ARCHITECTURE.md`.
- DoD : table couvre ≥ 8 grandes familles (13 familles couvertes).
- Commit : `d838e47` feat(base-contrat): Etape B audit 78 produits seed

**Étape C — Création des 6 templates manquants (post-audit)**

Les templates suivants ont été identifiés comme manquants lors de l'audit Étape B. Priorité et DoD :

| Priorité | `templateId` | Famille cible | Justification métier | DoD |
|---|---|---|---|---|
| **P1** | `pv-immobiliere` | Immobilier direct | Plus-values immobilières : abattements durée (22 ans IR, 30 ans PS), exonération RP. Cas très fréquent. | Template + suggestedFor mis à jour + test unitaire |
| **P1** | `epargne-reglementee-exoneration` | Épargne bancaire | LEP/Livret A/LDDS : exonération totale IR + PS (plafond réglementaire, taux). MVP conservateur actuel = note-libre. | Template + suggestedFor mis à jour |
| **P2** | `epargne-bancaire-imposable` | Épargne bancaire | CAT/CSL : IR barème ou PFU + PS sur intérêts. Complémentaire au P1. | Template + suggestedFor mis à jour |
| **P2** | `crypto-pfu-150vhbis` | Crypto-actifs | Art. 150 VH bis : 30 % flat, seuil 305 € cessions/an. Régime spécifique ≠ PFU standard. | Template + suggestedFor mis à jour |
| **P3** | `reduction-ir-dispositif` | Non coté/PE + Dispositifs fiscaux immo | Réduction IR (IR-PME, SOFICA, Pinel, Malraux…) : taux %, plafond €, durée. | Template + suggestedFor mis à jour |
| **P3** | `taxe-forfaitaire-metaux` | Métaux précieux | Taxe forfaitaire 11,5 % (or/argent) ou PV mobilières selon option. | Template + suggestedFor mis à jour |

- DoD global : `BLOCK_TEMPLATES.length ≥ 16` ; `npm run check` PASS ; table `ARCHITECTURE.md` mise à jour (P2/P3 → ✅ Couvert).

---

##### Découpage SettingsImpots.jsx + SettingsPrelevements.jsx (P2)

- Même pattern : shell orchestrateur + sous-composants par section.
- DoD : aucun fichier Settings > 500 lignes ; `npm run check` passe.
- Dépendance : P1-01d (normalisation Settings) doit être terminé avant.

##### Gate /settings/impots + /settings/prelevements allégé (P2)

Même logique que Base-Contrat : enregistrement toujours possible, le gate devient warning non-bloquant + guide contextuel.

- Scope : `SettingsImpots.jsx` + `SettingsPrelevements.jsx` — remplacer les blocages par des warnings + bouton "Enregistrer quand même".
- DoD : save sans remplir tous les champs obligatoires → sauvegarde OK + warning visible (pas d'erreur fatale).

**T6 — Audit puis cleanup `__spike__` et `_raw` (DONE)**
- Scope : `src/pptx/template/__spike__/`, `src/icons/business/_raw/`.
- Dépendances : P1-01d (doc cleanup) — audit réalisé en PR1.
- Livrable audit : **consigné dans `docs/ARCHITECTURE.md`** → section **Debt registry (legacy / spike / raw) + Exit criteria** (lignes 87-94).
- Décision : **DELETE** (non-runtime, 0 usage)
- Risques : faible (pas de runtime impact).
- DoD : audit documenté + aucun dossier `__spike__` ou `_raw` sous `src/`.

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
  - Labels FR : `src/constants/baseContratLabels.ts`
  - Templates pré-remplis : `src/constants/baseContratTemplates.ts`

Voir aussi :
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
- `docs/ARCHITECTURE.md` (carto + “où changer quoi”)
- `docs/RUNBOOK.md` (diagnostics + opérations)
