# ROADMAP AUDIT REPO SER1

> Plan d'audit complet du repo SER1, découpé en **7 phases** exécutables en micro-PRs, basé sur l'exploration réelle du repo.
> 
> **Date** : 2026-03-12  
> **Scope** : Audit complet code mort, organisation, lint, dette technique, docs  
> **Principe** : Preuve-first, micro-PRs, `npm run check` vert à chaque étape

---

## STATISTIQUES CLÉS DU REPO

| Métrique | Valeur |
|---|---|
| **Fichiers src/** | 382 |
| **Extensions** | .ts (207), .jsx (57), .tsx (47), .css (24), .js (19), .json (14), .svg (13) |
| **TODO/FIXME/HACK** | 141 occurrences dans 35 fichiers |
| **console.log/debug** | 52 occurrences dans 17 fichiers (hors tests) |
| **@ts-ignore / any** | 49 occurrences dans 22 fichiers |
| **Fichiers > 15 Ko** | 38 fichiers (god-files potentiels) |
| **Fichiers < 500 octets** | 27 fichiers (micro-fichiers à fusionner) |

---

## PHASE 1 — Nettoyage squelette (risque zéro)

**Objectif** : supprimer les artéfacts vides, orphelins, et fichiers fantômes.

| # | Constat (preuve) | Action |
|---|---|---|
| 1.1 | `src/pages/settings/base-contrat/` et `src/pages/settings/base-contrat/components/` sont **vides** (0 fichiers, vestige PR3) | Supprimer les 2 dossiers |
| 1.2 | `src/features/.gitkeep` (74 octets, commentaire) — le dossier contient déjà 7 sous-dossiers | Supprimer `.gitkeep` |
| 1.3 | `public/pptx/chapters/` et `public/ui/login/` — dossiers vides sur disque | **GARDER** : `public/pptx/chapters/` est référencé dans `src/pptx/assets/resolvePublicAsset.ts` (L71) ; `public/ui/login/` est référencé dans `src/pages/Login.css` (L12). Les assets sont gitignorés (*.png), les dossiers sont intentionnels. |
| 1.4 | `.env.local` — apparaît dans le listing root | **RÉSOLU** : `git ls-files .env.local` → vide. Non tracké. Rien à faire. |
| 1.5 | `deno.lock` à la racine (1270 octets) | **REPORTER** : `git ls-files deno.lock` → tracké. Vérification séparée nécessaire (Supabase edge functions danger zone). |
| 1.6 | `supabase/migrations/20260210212056_remote_schema.sql` = **0 octets** (fichier vide) | **REPORTER** : `git ls-files` → tracké. Fichier vide probable placeholder de migration Supabase remote. Danger zone — vérifier avec `supabase migration list` avant suppression. |

**Vérification** : `npm run check` vert.

---

## PHASE 2 — Code mort et fichiers non branchés

**Objectif** : identifier et supprimer le code qui n'est plus consommé.

### 2A — Wrappers de rétro-compatibilité (façades vides)

| Fichier | Constat | Action |
|---|---|---|
| `src/utils/globalStorage.js` | Pure re-export de `reporting/json-io/`. Seul `App.jsx` l'importe. | Repointer `App.jsx` sur `reporting/json-io/`, supprimer le wrapper |
| `src/engine/placementEngine.ts` | Pure re-export de `engine/placement/index`. 10 consommateurs. | Repointer les imports, supprimer la façade |

### 2B — Fichiers à vérifier (peu de consommateurs)

| Fichier | Consommateurs | Risque |
|---|---|---|
| `src/utils/placementEvents.js` | 1 seul (usePlacementSimulatorController) | Fusionner dans le consommateur |
| `src/utils/number.js` | 2 (creditFormatters + IrSimulatorContainer) | Fusionner `toNumber()` dans un utils TS unique |
| `src/utils/transmissionDisclaimer.js` | 2 (transmission.spec + PlacementInputsPanel) | OK si utilisé, mais convertir en `.ts` |
| `src/constants/reportPages.js` | 1 (SignalementsBlock) | Fusionner dans le composant |
| `src/constants/colorUsageGuidelines.js` | 2 (Settings + ThemeEditModal) | Convertir en `.ts`, garder |

### 2C — Audit `depcheck` + `madge`

- **Exécuter** `npm run check:unused` (depcheck) et `npm run check:circular` (madge) pour détecter :
  - Dépendances npm non utilisées
  - Imports circulaires (dette cachée)

**Livrable** : un tableau SAFE/REVIEW/KEEP pour chaque fichier candidat.

---

## PHASE 3 — Migration JS → TS et discipline JSX/TSX

**Objectif** : éradiquer le mélange JS/JSX/TS/TSX incohérent.

### 3A — État actuel

- **19 fichiers `.js`** dans `src/` (pas de JSX dedans → ok en `.js` mais devraient être `.ts`)
- **57 fichiers `.jsx`** — certains sont de simples wrappers sans types
- **Mixité** : `App.jsx`, `main.jsx`, `Settings.jsx` cohabitent avec `BaseContrat.tsx`, `Credit.tsx`

### 3B — Plan

| Priorité | Action | Fichiers |
|---|---|---|
| **P1** | Renommer `.js` → `.ts` (pas de JSX dedans) | 19 fichiers : `number.js`, `globalStorage.js`, `settingsHelpers.js`, `apiAdmin.js`, `placementEvents.js`, `placementPersistence.js`, `reset.js`, `transmissionDisclaimer.js`, `logoUpload.js`, `colorUsageGuidelines.js`, `reportPages.js`, `settingsRoutes.js`, `placementExcelExport.js`, `dmtgReferenceData.js`, `migrateDmtgData.js`, `dmtgValidators.js`, `exportExcel.js` |
| **P2** | Renommer `.jsx` → `.tsx` (ajouter typage minimal) | 57 fichiers, par batch feature (ir/, placement/, settings/...) |
| **P3** | Ajouter règle ESLint interdisant la création de `.js`/`.jsx` | Voir Phase 5 |

### 3C — Règle repo à ajouter

Ajouter dans `eslint.config.js` ou un script CI :
> **Interdire tout nouveau fichier `.js` ou `.jsx`** dans `src/`. Tout nouveau code doit être `.ts` ou `.tsx`.

---

## PHASE 4 — Fichiers trop gros (god-files) et découpage

**Objectif** : aucun fichier de logique > 500 lignes, aucun composant UI > 400 lignes.

### Top 15 des fichiers les plus lourds

| Fichier | Taille | Diagnostic |
|---|---|---|
| `features/succession/Succession.css` | 35 Ko | Découper par composant |
| `pages/settings/SettingsComptes.jsx` | 34 Ko | **God-file** — extraire modals, sections, handlers |
| `pptx/designSystem/serenity.ts` | 32 Ko | Acceptable (config design), mais modulariser en sous-fichiers |
| `domain/base-contrat/rules/library/retraite.ts` | 30 Ko | Acceptable (données métier), documenter |
| `features/succession/useSuccessionDerivedValues.ts` | 29 Ko | **Trop gros** — découper en hooks spécialisés |
| `features/placement/components/PlacementInputsPanel.jsx` | 29 Ko | **God-component** — extraire sous-sections |
| `features/succession/SuccessionSimulator.tsx` | 28 Ko | Extraire composants enfants |
| `features/credit/Credit.tsx` | 27 Ko | Idem |
| `pptx/slides/buildIrSynthesis.ts` | 24 Ko | Acceptable (slide builder) |
| `domain/base-contrat/catalog.ts` | 24 Ko | **76 TODO/FIXME** — nécessite nettoyage urgent |
| `features/credit/components/CreditV2.css` | 23 Ko | Découper par composant |
| `pages/settings/Impots/ImpotsBaremeSection.jsx` | 23 Ko | Extraire les tables en composants réutilisables |
| `pages/Settings.jsx` | 21 Ko | God-file — extraire logique thème |
| `pages/settings/BaseContrat.tsx` | 21 Ko | God-file en devenir — monitorer |
| `features/succession/useSuccessionSimulatorHandlers.ts` | 20 Ko | Découper par groupe d'actions |

---

## PHASE 5 — Lint, règles manquantes, et qualité CI

### 5A — Règles ESLint manquantes

| Règle | Pourquoi |
|---|---|
| `no-restricted-imports` | Interdire les imports depuis les façades legacy (`globalStorage`, `placementEngine`) |
| `@typescript-eslint/no-explicit-any` | warn → les 49 `any` actuels sont une dette |
| `@typescript-eslint/consistent-type-imports` | Forcer `import type` pour les types (tree-shaking) |
| `import/no-cycle` | Remplacer/compléter `madge` par un check continu |
| `max-lines` | warn à 500 lignes par fichier |
| `max-lines-per-function` | warn à 100 lignes |
| **Interdiction `.js`/`.jsx` en CI** | Script ou plugin lint empêchant la création de JS dans src/ |

### 5B — TSConfig trop permissif

```
@c:\Users\flore\Documents\SER1\tsconfig.json:15-16
    "noUnusedLocals": false,
    "noUnusedParameters": false,
```

**Action** : passer à `true` (ou au moins `warn`) pour détecter les variables/paramètres morts. Faire un pass de nettoyage avant.

### 5C — CI (`ci.yml`)

- Le step `Check no console.* in production` (L72-77) est un grep brut — il serait **plus fiable** comme règle ESLint (`no-console` est déjà en `error` mais avec `allow: ['warn', 'error']`, ce qui est correct). Le grep CI fait doublon et peut diverger.
- **Manquant** : aucun check de bundle size (ex: `bundlesize` ou `size-limit`).
- **Manquant** : aucun check de couverture minimale en CI (coverage seulement configuré sur `src/engine/`).

### 5D — Hooks Git

- `.husky/pre-commit` exécute `lint-staged` ✓
- `.githooks/pre-push` = script custom PowerShell (3.9 Ko) — **doublon potentiel** avec Husky, risque de confusion. Unifier.

---

## PHASE 6 — Organisation du repo et nommage

### 6A — Incohérences de nommage

| Constat | Exemples | Action |
|---|---|---|
| **kebab-case vs PascalCase** pour les dossiers | `base-contrat/` vs `DmtgSuccession/` vs `Impots/` | Harmoniser : dossiers en kebab-case, composants en PascalCase |
| **CSS co-localisé vs centralisé** | `src/styles/` (4 fichiers globaux) + CSS co-localisé par feature | OK si intentionnel, mais `src/styles/settings.css` n'est importé que depuis `styles.css` — aucun import direct |
| **Dossier `src/styles/`** vs `src/styles.css` à la racine | Ambigu | Déplacer `styles.css` dans `src/styles/` comme `index.css` |
| **`src/pages/Home.css`** côtoie **`src/styles/home.css`** | Deux fichiers CSS pour Home ! | Fusionner |
| **`api/admin.js`** à la racine | Serverless Vercel uniquement | Documenter dans README ou déplacer dans `vercel/` |

### 6B — Structure `src/` — points positifs et améliorations

**Positif** : découpage `features/`, `engine/`, `domain/`, `hooks/`, `settings/` est propre.

**Améliorations** :

| Dossier | Problème | Suggestion |
|---|---|---|
| `src/utils/` (24 fichiers) | Fourre-tout — mélange engine (irEngine, tmiMetrics), export, cache, persistence, debug | Répartir : `utils/export/`, `utils/cache/` existent déjà — y déplacer le reste logiquement |
| `src/constants/` (5 fichiers) | Mélange labels UI + config routing + guidelines couleurs | Fusionner `settingsRoutes.js` dans le routing, `colorUsageGuidelines` dans `settings/theme/` |
| `src/services/` (2 fichiers) | Seulement 2 fichiers — trop petit pour un dossier | Fusionner dans `utils/` ou `auth/` selon la nature |
| `src/icons/` (21 fichiers) | OK, mais les SVG inline sont dans les .tsx et aussi ici — vérifier cohérence |  |
| `src/reporting/` (5 fichiers) | Un seul sous-dossier `json-io/` | Renommer `reporting/` → déplacer dans `utils/snapshot/` ou `features/snapshot/` |

### 6C — Fichiers trackés sur GitHub inutilement

| Fichier/Dossier | Raison | Action |
|---|---|---|
| `deno.lock` | Artéfact Deno — pas utile au build frontend | Vérifier s'il est requis par les Edge Functions, sinon ajouter au `.gitignore` |
| `.claude/` | Dossier vide, config machine-locale | Déjà ignoré partiellement dans `.gitignore` — vérifier |
| `public/pptx/chapters/` et `public/ui/login/` | Dossiers vides | Supprimer ou `.gitkeep` si pipeline les attend |
| `index.html` contient 90 lignes de JS inline | Anti-FOUC bootstrap | Extraire dans un fichier `src/theme-bootstrap.js` et l'inliner au build |

---

## PHASE 7 — Documentation, verbosité, et dette technique

### 7A — Docs

| Doc | État | Action |
|---|---|---|
| `README.md` | Référence `docs/METIER.md` mais les sources de vérité dans README sont `ROADMAP, METIER, GOUVERNANCE, ARCHITECTURE, RUNBOOK` | ✓ Cohérent |
| `docs/ARCHITECTURE.md` (31 Ko) | Très complet mais potentiellement décalé après PR3-PR6 | **Audit** : vérifier que les modules décrits existent encore |
| `docs/GOUVERNANCE.md` (30 Ko) | Idem | Vérifier la section exceptions couleurs |
| `docs/ROADMAP.md` (17 Ko) | Peut contenir des items DONE non marqués | Rafraîchir les statuts |

### 7B — Code verbeux

| Fichier | Problème | Action |
|---|---|---|
| `index.html` | 90 lignes de JS inline dupliquant la logique de `main.jsx` (theme bootstrap) | Extraire et partager la source de vérité |
| `catalog.ts` | **76 TODO/FIXME** — dette technique majeure en un seul fichier | Traiter les TODO ou les supprimer s'ils sont obsolètes |
| `pptx/template/loadBaseTemplate.ts` | 18 TODO — logique de chargement template complexe | Simplifier ou documenter |
| `src/main.jsx` | Duplique la logique anti-FOUC de `index.html` | Centraliser |
| `vite.config.ts` | `DEBUG_PROXY` flag hardcodé — ok mais devrait utiliser `debugFlags.ts` | Mineur |

### 7C — Dette technique résumée

| Catégorie | Gravité | Description |
|---|---|---|
| **76 TODO dans catalog.ts** | 🔴 Haute | Fichier métier central avec dette non trackée |
| **Mixité JS/TS** | 🟠 Moyenne | 19 `.js` + 57 `.jsx` → blocage pour `noUnusedLocals: true` |
| **God-files** | 🟠 Moyenne | 5+ fichiers > 25 Ko (SettingsComptes, PlacementInputsPanel, Credit, SuccessionSimulator, useSuccessionDerivedValues) |
| **`any` en TS** | 🟡 Basse | 49 occurrences — à réduire progressivement |
| **CSS non-modulaire** | 🟡 Basse | Pas de CSS Modules ni utility-first — risque de collisions de classes |
| **Pas de bundle size check** | 🟡 Basse | Aucune alerte si le bundle grossit |
| **Normalisation PM globale** | 🟠 Moyenne | `rules/index.ts` fait un post-traitement global — devrait être par produit |

---

## PLAN D'EXÉCUTION RECOMMANDÉ

| PR | Phase | Risque | Effort |
|---|---|---|---|
| **PR-A** | Phase 1 (squelette) | ⚪ Nul | 15 min |
| **PR-B** | Phase 2A+2B (code mort) | 🟢 Faible | 1-2h |
| **PR-C** | Phase 3 P1 (JS → TS) | 🟢 Faible | 2-3h |
| **PR-D** | Phase 5A+5B (règles lint + tsconfig) | 🟡 Moyen | 2-3h |
| **PR-E** | Phase 6A (nommage + CSS Home) | 🟡 Moyen | 1-2h |
| **PR-F** | Phase 4 top 5 god-files | 🟠 Moyen-haut | 3-5h par fichier |
| **PR-G** | Phase 7A (docs refresh) | ⚪ Nul | 1-2h |
| **PR-H** | Phase 3 P2 (JSX → TSX batch) | 🟡 Moyen | 3-5h |
| **PR-I** | Phase 7B (TODO purge catalog.ts) | 🟠 Moyen | 2-3h |

**Règle** : chaque PR passe `npm run check` vert + smoke test des pages touchées.

---

## NOTES DE VALIDATION

- **README** : inchangé à ce stade (aucune modification de structure/conventions tant qu'aucun PR n'est exécuté).
- **Preuve-first** : chaque action doit être accompagnée de `rg`/`grep` ou `find` prouvant que le fichier/dossier est bien orphelin ou inutilisé.
- **Micro-PRs** : chaque PR doit être atomique et testable indépendamment.
- **Rollback** : chaque PR doit être facilement réversible (suppression de fichiers = rollback par restauration).

---

**Prochaine étape** : choisir une phase à exécuter ou demander des clarifications sur un item spécifique.
