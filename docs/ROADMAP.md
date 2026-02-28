# ROADMAP (source de vérité)

## But
Donner la trajectoire produit vers un **SaaS SER1** : priorités, Definition of Done, et **plan PR détaillé** pour atteindre une plateforme **premium mais simple** avec des calculs **ultra précis** et **maintenables**.

> Ce document **ne répète pas ce qui est déjà livré**. Il ne contient que le reste à faire + ce qui est utile pour tenir la trajectoire.

## Audience
Owner/PM + Tech lead + dev/LLM opérant en **PR-only workflow**.

## Principes non négociables (trajectoire “outil pro”)
1) **Une seule source de vérité pour les chiffres**  
   Tous les simulateurs doivent lire le même “dossier fiscal” (impôts + prélèvements sociaux + fiscalité produits + transmission).

2) **Zéro chiffre “révisable” en dur dans un moteur**  
   Un taux/barème/abattement qui peut évoluer (PLF, LFSS, textes) doit être dans les paramètres admin (Supabase), pas dans le code.

3) **Chargement fiable (pas de calcul sur défauts silencieux)**  
   Au premier affichage, si Supabase n’a pas répondu, l’UI doit le dire (mode “chargement”), plutôt que de calculer avec des valeurs par défaut sans prévenir.

4) **Validation / garde-fous côté admin**  
   Empêcher les erreurs de saisie (ex : 172 au lieu de 17,2) + cohérence des tranches (ordre, bornes).

5) **Traçabilité dans les fichiers .ser1**  
   Une simulation sauvegardée doit garder l’empreinte/la version des paramètres utilisés, pour éviter qu’un résultat change sans explication après une mise à jour admin.

---

## Definition of Done (SaaS-ready)
Une PR / un lot est “DONE” quand :
- **Sécurité** : RLS cohérente, écriture admin seulement, lecture authentifiée.
- **Qualité** : `npm run check` passe (lint, typecheck, tests, build).
- **Exactitude** : les simulateurs concernés utilisent les paramètres admin (pas de fallback caché).
- **Traçabilité** : version/empreinte des paramètres enregistrée dans `.ser1` (quand le lot touche les calculs).
- **Docs / runbook** : modifications structurantes documentées.

---

# Phases

## P1 — Fiabilité des paramètres & branchement Succession (MVP solide)

### Objectif P1 (résumé)
Rendre SER1 “professionnel” : **tous les simulateurs** consomment les mêmes paramètres, sans duplication et avec traçabilité.

### Constat technique (preuves à garder en tête)
- **DMTG dupliqué (à corriger en PR-02)** :
  `src/constants/settingsDefaults.ts` contient `DEFAULT_TAX_SETTINGS.dmtg`
  et `src/engine/civil.ts` contient `DEFAULT_DMTG` — deux sources incompatibles.

- **Succession n’est pas branché (à corriger en PR-03)** :
  `src/features/succession/useSuccessionCalc.ts` ne passe pas `dmtgSettings` à `calculateSuccession`.
  Le moteur attend déjà `dmtgSettings?: DmtgSettings` dans `src/engine/succession.ts`.

- **Chargement “stale-while-revalidate” peut calculer sur défauts (adressé par PR-01)** :
  `src/utils/fiscalSettingsCache.js` retourne immédiatement defaults/cache et lance fetch en arrière-plan.

- **Placement a un mauvais chemin DMTG (à corriger en PR-05)** :
  `src/features/placement/components/usePlacementSimulatorController.js` lit `taxSettings?.dmtg?.scale` alors que le DMTG est structuré par catégories (`ligneDirecte.scale`).

- **Stratégie IR a un barème en dur (à corriger en PR-06)** :
  `src/features/strategy/calculations.ts` utilise `src/engine/tax.ts` (`BAREME_IR_2024`) au lieu des paramètres admin.

---

## P1-06 — “Dossier fiscal unique” + page Paramètres DMTG & Succession

### Cible produit
- Une page settings premium : `/settings/dmtg-succession`
- Les simulateurs (IR, placement, succession, stratégie…) utilisent **un même dossier fiscal**.

### Décision de modélisation (pour limiter les tables)
- **On consolide dans les tables existantes** :
  - `tax_settings` : impôts + DMTG (à compléter)
  - `ps_settings` : prélèvements sociaux
  - `fiscality_settings` : fiscalité produits (AV, PER, PEA…)
- La page “DMTG & Succession” peut donc éditer **2 tables** :
  - DMTG/donations → `tax_settings`
  - assurance-vie décès → `fiscality_settings`
- Les règles civiles (réserve, régimes matrimoniaux, droits du conjoint) restent **lecture seule** (code civil), affichées comme référentiel.

> Option future (si besoin) : extraire plus tard vers `dmtg_settings`, mais uniquement si la taille/complexité le justifie. Les simulateurs ne devront jamais “sentir” cette séparation grâce au “dossier fiscal”.

---

# Plan PR détaillé (P1)

> Convention : chaque PR doit produire **preuves** (fichiers + commandes) et une DoD claire.

---

## PR-P1-06-01 — “Dossier fiscal” : chargement fiable + API unique

✅ DONE — PR #155 — 2026-02-28

**Preuves :**
- Hook `src/hooks/useFiscalContext.ts` créé : expose `fiscalContext` normalisé (clés stables), `loading`, `error`, `meta`
- Mode strict branché sur IR (`IrSimulatorContainer.jsx`) et Succession (`SuccessionSimulator.tsx`) — spinners avant calcul si Supabase non répondu
- `src/utils/fiscalSettingsCache.js` enrichi de `loadFiscalSettingsStrict()` (mode wait Supabase)
- `npm run check` vert au merge : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Créer un mécanisme standard : **un seul point d’entrée** pour obtenir les paramètres, avec un mode “strict” (attendre Supabase au 1er chargement).

### Travaux
- Ajouter une API de chargement **fiable** (ex : `getFiscalSettings({ wait: true })` ou `loadFiscalSettingsStrict()`).
- Ajouter un hook unifié : `useFiscalContext()` (retourne `fiscalContext`, `loading`, `error`, `versions`).
- **Normaliser le dossier fiscal** : `useFiscalContext()` doit exposer un objet **stable** (mêmes clés partout) pour empêcher les lectures directes divergentes (`taxSettings.dmtg.scale` vs `taxSettings.dmtg.ligneDirecte.scale`).
  - Exemple de clés normalisées : `dmtgScaleLigneDirecte`, `dmtgAbattementEnfant`, `psRate`, `pfuRate`, etc.
  - Règle : les simulateurs lisent **uniquement** `fiscalContext` (jamais les tables brutes).
- Appliquer le mode strict **seulement aux simulateurs critiques** : IR et Succession (pas à tous les écrans pour éviter spinners excessifs).
- Les autres pages gardent le comportement `stale-while-revalidate` (cache immédiat + refresh async).

### Fichiers
- Modifier : `src/utils/fiscalSettingsCache.js`
- Nouveau (recommandé) : `src/hooks/useFiscalContext.ts` (ou `.js`)

### DoD
- Au 1er affichage, si Supabase n’a pas répondu, l’UI affiche “Chargement des paramètres…” (pas de calcul silencieux).
- Les pages qui consomment les paramètres ont un comportement cohérent (même API).

### Preuves attendues
- Diff montrant l’ajout du mode strict dans `fiscalSettingsCache.js` (le commentaire “On n’attend pas” doit être résolu par un vrai mode strict).
- Test manuel : vider localStorage + rafraîchir → la page ne calcule pas tant que le dossier fiscal n’est pas prêt.

---

## PR-P1-06-02 — Supprimer la duplication DMTG (source unique)

✅ DONE — PR #156 — 2026-02-28

**Preuves :**
- `DEFAULT_DMTG` n'est plus un objet littéral : `export const DEFAULT_DMTG: DmtgSettings = DEFAULT_TAX_SETTINGS.dmtg;`
- `rg "export const DEFAULT_DMTG" src` → 1 seul résultat (`civil.ts:124`), aucun doublon
- Un seul fichier modifié (`src/engine/civil.ts`) : −34 lignes (objet littéral supprimé) +3 lignes (import + référence)
- `npm run check` vert : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Un seul endroit pour les valeurs par défaut DMTG, pour éviter divergences et instabilité lors du branchement Succession.

### Travaux
- Remplacer `DEFAULT_DMTG` (moteur) par une importation depuis `settingsDefaults.ts` **ou** déplacer le défaut DMTG dans un module partagé unique.
- Supprimer/neutraliser les constantes `@deprecated` qui dupliquent encore des valeurs (ou les faire pointer vers la source unique).
- Vérifier que le moteur Succession utilise la source unique en cas d’absence de paramètres.

### Fichiers
- Modifier : `src/engine/civil.ts`
- Modifier : `src/constants/settingsDefaults.ts` (si extraction)
- Modifier : `src/engine/succession.ts` (imports)

### DoD
- Il n’existe plus 2 définitions “vivantes” du même barème DMTG.
- Le moteur Succession fonctionne avec le dossier fiscal (et fallback unique si besoin).

### Preuves attendues
- Recherche dans le code : absence de double “DEFAULT_DMTG” + “DEFAULT_TAX_SETTINGS.dmtg” non alignés.
- Diff montrant la source unique.

---

## PR-P1-06-05 — Fix Placement : DMTG options branchées correctement

✅ DONE — PR #157 — 2026-02-28

**Preuves :**
- `src/features/placement/components/usePlacementSimulatorController.js` : remplace `taxSettings?.dmtg?.scale` par `fiscalContext?.dmtgScaleLigneDirecte` (via `useFiscalContext({ strict: false })`)
- `rg "taxSettings\?\.dmtg\?\.scale" src` → 0 résultats
- `npm run check` vert : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Le simulateur Placement doit utiliser le barème DMTG réel (au moins ligne directe) pour proposer les options.

### Travaux
- **Respecter la règle PR-01** : Placement lit uniquement `fiscalContext` (pas `taxSettings`).
- Corriger la lecture DMTG pour utiliser une clé normalisée (ex : `fiscalContext.dmtgScaleLigneDirecte`)
  ou un objet moteur prêt à l'emploi (ex : `fiscalContext.dmtgSettings.ligneDirecte.scale`).
- Ajouter un test simple (ou un guard) : si pas de scale, fallback explicite + warning.

### Fichiers
- Modifier : `src/features/placement/components/usePlacementSimulatorController.js` 

### DoD
- Les options DMTG affichées reflètent la configuration admin.
- Pas de "undefined scale" silencieux.

### Preuves attendues
- Diff du chemin corrigé.
- Test manuel : changer tranche → options/valeurs changent.

---

## PR-P1-06-03 — Brancher Succession sur les paramètres admin

✅ DONE — PR #158 — 2026-02-28

- `useSuccessionCalc.ts` : accepte `{ dmtgSettings?: DmtgSettings }` et le passe à `calculateSuccession`
- `SuccessionSimulator.tsx` : destructure `fiscalContext` depuis `useFiscalContext({ strict: true })` et passe `fiscalContext.dmtgSettings` au hook
- `rg "DEFAULT_DMTG" src/features/succession` → 0 résultat côté UI ; `npm run check` vert (1088 tests)

### Objectif
Le simulateur Succession doit utiliser les paramètres (DMTG) **issus du dossier fiscal**, pas les fallbacks.

### Travaux
- Charger le **dossier fiscal normalisé** via `useFiscalContext()`.
- Récupérer un objet `dmtgSettings` **complet au format moteur** depuis `fiscalContext` (ex : `fiscalContext.dmtgSettings`).
- Passer `dmtgSettings` au moteur : `calculateSuccession({ ..., dmtgSettings })`.
- Afficher dans l'UI (optionnel mais utile) la version/empreinte du dossier fiscal utilisé.
- Le recalcul après mise à jour admin est déclenché par l'invalidation/broadcast côté pages Settings (cf PR-04) : Succession doit se recalculer dès que `fiscalContext` change.

### Fichiers
- Modifier : `src/features/succession/useSuccessionCalc.ts` 
- Modifier (si besoin) : `src/features/succession/SuccessionSimulator.tsx` 
- Moteur déjà prêt : `src/engine/succession.ts`

### DoD
- Changer un abattement DMTG côté admin → recalcul Succession reflète le changement.
- Aucun appel implicite au fallback depuis l'UI.

### Preuves attendues
- Diff montrant que `dmtgSettings` est passé à `calculateSuccession`.
- Exemple : abattement enfant modifié dans settings → résultat succession change.

---

## PR-P1-06-04 — Nouvelle page `/settings/dmtg-succession` + validation

✅ DONE — PR #159 — 2026-02-28

**Preuves :**
- Route ajoutée dans `src/constants/settingsRoutes.js` : key `dmtgSuccession`, path `dmtg-succession`, lazy import `SettingsDmtgSuccession`
- `getActiveSettingsKey()` mis à jour pour `/settings/dmtg-succession`
- Nouvelle page `src/pages/settings/SettingsDmtgSuccession.jsx` : 5 sections accordéon (DMTG barèmes, Donation/rappel fiscal, AV décès 990 I/757 B, Réserve héréditaire lecture seule, Régimes matrimoniaux lecture seule)
- Validation stricte via `src/pages/settings/validators/dmtgValidators.js` : taux 0-100, abattements positifs/raisonnables, tranches ordonnées sans chevauchement
- Bouton save désactivé + message "Erreurs de validation" si champ invalide (ex: 172 dans un taux)
- Save déclenche `invalidate('tax') + broadcastInvalidation('tax')` ET `invalidate('fiscality') + broadcastInvalidation('fiscality')`
- `npm run check` vert : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Créer la page premium qui centralise transmission : DMTG successions/donations + assurance-vie décès + référentiel civil (lecture seule). **Avec validation stricte** pour prévenir les erreurs de saisie (172 au lieu de 17,2).

### Organisation UI (simple, pro)
1) **DMTG : Barèmes** (ligne directe, frère/soeur, neveu/nièce, autres)
2) **Succession : abattements & exonérations** (dont conditions frère/soeur)
3) **Donation : abattements + rappel fiscal** (+ don familial 790 G)
4) **Assurance-vie décès** (990 I / 757 B)
5) **Réserve / quotité / droits du conjoint** (lecture seule)
6) **Régimes matrimoniaux & PACS** (lecture seule + impact sur actif successoral dans le simulateur)

### Données (sans créer de table supplémentaire)
- DMTG + donation : extension structurée de `tax_settings.data.dmtg` (ou sous-blocs dédiés)
- AV décès : `fiscality_settings` (déjà géré par le cache)
- **Backfill / compatibilité** : comme `tax_settings.data` est du JSON, on enrichit la structure **sans modifier le schéma SQL**.
  - À la lecture : merge `DEFAULT_TAX_SETTINGS` + données DB (pour obtenir un objet complet)
  - Si la structure change : migration logicielle (versionner + transformer) ; migration SQL uniquement si on modifie réellement la table

### Validation (anti-erreurs silencieuses)
- **Taux en %** : entre 0 et 100 (message : "Le taux doit être entre 0 et 100")
- **Abattements** : positifs, raisonnables (ex : < 1 million pour abattement enfant)
- **Tranches DMTG** : ordonnées, pas de chevauchement (message : "Tranche suivante doit commencer après la précédente")
- **Bloquer la sauvegarde** si un champ est invalide
- Messages clairs et contextuels pour chaque champ

### Fichiers
- Nouveau : `src/pages/settings/SettingsDmtgSuccession.jsx` (+ CSS)
- Nouveau (recommandé) : `src/pages/settings/validators/dmtgValidators.js` (réutilisable par autres pages)
- Modifier : `src/constants/settingsRoutes.js` (ajout route)
- Modifier : `src/utils/fiscalSettingsCache.js` (déjà charge tax/ps/fiscality : vérifier invalidations)
- Modifier : `src/pages/settings/SettingsShell.jsx` (si nécessaire selon structure)
- Optionnel : composants sections dans `src/pages/settings/dmtg/*`

### DoD
- Page accessible depuis Settings.
- Admin peut modifier + sauvegarder **uniquement si validation réussit**.
- Les simulateurs impactés recalculent après invalidation.
- Sauvegarde valide → invalider **les 2 tables** (`tax` et `fiscality`) + `broadcastInvalidation` pour chacune (sinon certains écrans resteront sur l'ancien cache).
- Une saisie manifestement incohérente ne peut pas être sauvegardée (ex : 172 au lieu de 17,2).

### Preuves attendues
- Route présente dans `settingsRoutes.js`.
- Test manuel : saisir 172 dans un champ taux → message d'erreur + bouton save désactivé.
- Sauvegarde valide → appel `invalidate('tax')` / `invalidate('fiscality')` + broadcast.
- UI cohérente avec style Settings existant.

---

## PR-P1-06-06 — Aligner Stratégie sur les mêmes paramètres IR que /sim/ir

✅ DONE — PR #160 — 2026-02-28

**Preuves :**
- `calculations.ts` n’importe plus `engine/tax` : `rg "from ‘../../engine/tax’" src/features/strategy` → 0 résultat
- Stratégie lit `fiscalContext.irScaleCurrent` via `computeIR()` + fallback `DEFAULT_TAX_SETTINGS` ; `StrategyBuilder.tsx` appelle `useFiscalContext()` (stale) et passe `fiscalContext` aux projections
- `npm run check` vert : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Éviter 2 calculs IR différents selon l’écran.

### Travaux
- Faire en sorte que Stratégie reçoive le barème IR depuis `tax_settings`.
- Option A : rendre `calculateIR()` paramétrable (barème en entrée).  
- Option B : exposer une fonction “calcul IR avec settings” utilisée partout.

### Fichiers
- Modifier : `src/features/strategy/calculations.ts`
- Modifier : `src/engine/tax.ts` (si option A)
- (Éventuel) utiliser le même module que le simulateur IR

### DoD
- Stratégie et simulateur IR donnent des résultats identiques à entrée égale.

### Preuves attendues
- Disparition de l’usage implicite du `BAREME_IR_2024` en dur dans Stratégie.
- Test de cohérence (même revenu/parts → même IR).

---

## PR-P1-06-07 — Validation harmonisée sur Impots & Prélèvements

✅ DONE — PR #161 — 2026-02-28

**Preuves :**
- `dmtgValidators.js` étendu : +2 fonctions (`validateImpotsSettings`, `validatePrelevementsSettings`) réutilisant `validatePercent` et `validateScaleOrdered` existants
- `SettingsImpots.jsx` : `impotsErrors + dmtgErrors` via `useMemo`, save bloqué si erreurs, panneau d'erreurs visible
- `SettingsPrelevements.jsx` : `psErrors` via `useMemo`, même pattern UX
- `rg "validators/dmtgValidators" src/pages/settings` → 3 fichiers (DmtgSuccession + Impots + Prelevements)
- Cas manuels : 172 sur Impots → erreur + save disabled ; 200 sur Prélèvements → erreur + save disabled
- `npm run check` vert : lint ✓ · typecheck ✓ · 1088 tests ✓ · build ✓

### Objectif
Étendre la validation anti-erreurs ajoutée dans PR-04 aux pages Impots et Prélèvements pour **cohérence globale**.

### Travaux
- Réutiliser le module `dmtgValidators.js` (créé en PR-04) ou créer `settingsValidators.js` modulaire.
- Ajouter validation sur `SettingsImpots.jsx` : taux IR/PFU entre 0–100, tranches ordonnées.
- Ajouter validation sur `SettingsPrelevements.jsx` : taux PS entre 0–100, cohérence des seuils.
- Tester les cas limites sur chaque page.

### Fichiers
- Modifier : `src/pages/settings/SettingsImpots.jsx`
- Modifier : `src/pages/settings/SettingsPrelevements.jsx`
- Réutiliser/étendre : `src/pages/settings/validators/dmtgValidators.js`

### DoD
- Toutes les pages Settings appliquent le même pattern de validation.
- Une saisie incohérente ne peut pas être sauvegardée sur aucune page.

### Preuves attendues
- Cas manuels : 172 sur Impots → erreur, 200 sur Prélèvements → erreur.
- Diff montrant réutilisation du validateur central.

---

## PR-P1-06-08 — Traçabilité dans les fichiers `.ser1` (stabilité des résultats)

### Objectif
Si un dossier `.ser1` est rouvert après mise à jour des paramètres, l’utilisateur comprend pourquoi le résultat change, ou peut recalculer “avec les paramètres de l’époque”.

### Travaux
- Évoluer le schéma snapshot (nouvelle version) pour stocker l'identité exacte des paramètres utilisés :
  - `tax_settings.updated_at` + **empreinte (hash)** de `tax_settings.data` 
  - `ps_settings.updated_at` + **empreinte (hash)** de `ps_settings.data` 
  - `fiscality_settings.updated_at` + **empreinte (hash)** de `fiscality_settings.data` 
- **Ne pas dépendre uniquement de `version`** tant qu'elle n'est pas incrémentée automatiquement (sinon elle risque de rester à `1`).
  - Optionnel : ajouter un trigger Supabase qui **incrémente `version`** à chaque update si on veut l'utiliser.
- À l'ouverture d'un `.ser1`, si une empreinte/`updated_at` diffère : afficher un avertissement simple ("les paramètres fiscaux ont été mis à jour depuis la sauvegarde").

### Fichiers
- Modifier : `src/reporting/json-io/snapshotSchema.ts` (bump version)
- Modifier : `src/reporting/json-io/snapshotMigrations.ts` (migration)
- Modifier : modules de sauvegarde/chargement des sims (placement/IR/strategy…)

### DoD
- Un `.ser1` conserve l'identité des paramètres utilisés (empreintes + dates).
- Alerte visible si mismatch.

### Preuves attendues
- Snapshot vX → vX+1 validé, migration OK.
- Exemple : sauver → changer un paramètre (tax/ps/fiscality) → rouvrir → warning affiché.
- Exemple : le `.ser1` sauvegardé contient bien **les empreintes** (3 hashes) + `updated_at`.

---

## PR-P1-06-09 — Tests & garde-fous "source unique"

### Objectif
Empêcher que de nouveaux chiffres révisables reviennent en dur dans le code après les PRs précédentes.

### Travaux
- **Garde-fou CI "valeurs fiscales en dur"** (liste autorisée) :
  - Définir une petite liste de valeurs sensibles (ex : `17.2`, `100000`, `15932`) et **interdire leur présence** en dehors d'une liste de fichiers autorisés.
  - **Fichiers autorisés** (exemple) :
    - `src/constants/settingsDefaults.ts` 
    - `src/**/__tests__/**` (tests)
  - **Portée du contrôle (recommandé)** :
    - Interdire ces valeurs dans `src/engine/**` et `src/features/**` (là où un chiffre en dur fausse un calcul).
    - Optionnel : étendre à `src/pages/**` **sauf** `src/pages/settings/**` si on veut éviter des valeurs chiffrées en texte/validation qui n'impactent pas le moteur.
  - Implémentation simple : script Node (`scripts/check-no-hardcoded-fiscal-values.mjs`) exécuté dans CI et via `npm run check`.
- **Tests golden (cas référence)** : ajouter 3–5 snapshots de calculs exacts :
  - Succession : héritage simple (conjoint + 2 enfants) avec DMTG connus
  - Stratégie vs IR : même revenu/parts → résultats identiques

### Fichiers
- Modifier : `package.json` ou script CI (ajouter règle grep)
- Nouveau/modifier : `src/engine/__tests__/goldenTests.spec.js` (ou intégrer dans tests existants)
- Tests : `src/features/succession/__tests__/`, `src/features/strategy/__tests__/`

### DoD
- CI empêche les régressions "chiffre en dur" sur zones critiques.
- Les cas golden capturent le comportement attendu post-P1.

### Preuves attendues
- CI failure si quelqu'un ajoute `100000` hors des zones autorisées.
- Snapshots testé : succession avec 2 enfants, stratégie cohérence IR.

# P2 — Analyse patrimoniale + nouveaux simulateurs (après P1)
Objectif : élargir les usages, sans perdre la rigueur “dossier fiscal”.

## PR-P2-01 — Audit patrimonial (PPTX) : structure stable + données minimales
- Sortie PPTX premium (structure claire, sections fixes)
- Zéro PII serveur, données en session + `.ser1`

## PR-P2-02 — Simulateur épargne / arbitrages (comparateurs)
- Utiliser le même dossier fiscal
- Scénarios comparés + export

## PR-P2-03 — Simulateur prévoyance (si scope confirmé)
- Paramètres distincts mais même philosophie (valeurs en settings, règles dans moteur)

## PR-P2-04 — Observabilité technique (sans données clients)
- Santé edge functions, erreurs, latence (tech only)

---

# P3 — Stratégie automatique + société fine
Objectif : recommandations structurées + support société/holding.

## PR-P3-01 — Moteur de scénarios (baseline vs recommandations)
- Recommandations explicables (texte + hypothèses)

## PR-P3-02 — Société fine (organigramme, flux, consolidation)
- Modèle minimal utile, sans complexité inutile

## PR-P3-03 — Export stratégie PPTX complet

---

## Références code (pour travailler vite)
- Routing : `src/routes/appRoutes.ts` + `src/App.jsx`
- Layout : `src/components/layout/AppLayout.jsx`
- Settings : `src/pages/settings/*` + `src/constants/settingsRoutes.js`
- Cache paramètres : `src/utils/fiscalSettingsCache.js`
- IR/PS defaults : `src/constants/settingsDefaults.ts`
- Succession engine : `src/engine/succession.ts`
- Civil (régimes matrimoniaux + DMTG defaults actuellement) : `src/engine/civil.ts`
- Placement hook settings : `src/hooks/usePlacementSettings.js`
- Stratégie : `src/features/strategy/calculations.ts`
- Snapshots `.ser1` : `src/reporting/json-io/snapshotSchema.ts` + migrations
- Exports : `src/pptx/`, `src/utils/xlsxBuilder.ts`
