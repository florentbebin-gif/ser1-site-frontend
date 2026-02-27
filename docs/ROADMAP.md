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
- **Succession n’est pas branché** sur les paramètres :  
  `src/features/succession/useSuccessionCalc.ts` ne passe pas `dmtgSettings` à `calculateSuccession`.  
  Le moteur attend déjà `dmtgSettings?: DmtgSettings` dans `src/engine/succession.ts`.

- **DMTG dupliqué** :  
  `src/constants/settingsDefaults.ts` contient `DEFAULT_TAX_SETTINGS.dmtg`  
  et `src/engine/civil.ts` contient `DEFAULT_DMTG`.

- **Chargement “stale-while-revalidate” peut calculer sur défauts** :  
  `src/utils/fiscalSettingsCache.js` retourne immédiatement defaults/cache et lance fetch en arrière-plan.

- **Placement a un mauvais chemin DMTG** :  
  `src/features/placement/components/usePlacementSimulatorController.js` lit `taxSettings?.dmtg?.scale` alors que le DMTG est structuré par catégories (`ligneDirecte.scale`).

- **Stratégie IR a un barème en dur** :  
  `src/features/strategy/calculations.ts` utilise `src/engine/tax.ts` (`BAREME_IR_2024`).

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

### Objectif
Créer un mécanisme standard : **un seul point d’entrée** pour obtenir les paramètres, avec un mode “strict” (attendre Supabase au 1er chargement).

### Travaux
- Ajouter une API de chargement **fiable** (ex : `getFiscalSettings({ wait: true })` ou `loadFiscalSettingsStrict()`).
- Ajouter un hook unifié : `useFiscalContext()` (retourne `fiscalContext`, `loading`, `error`, `versions`).
- Mettre à jour les simulateurs qui doivent être exacts au 1er rendu (au moins IR & Succession) pour attendre le dossier fiscal.

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

## PR-P1-06-02 — Brancher Succession sur les paramètres admin (et enlever le décoratif)

### Objectif
Le simulateur Succession doit utiliser les paramètres (DMTG) **issus du dossier fiscal**, pas `DEFAULT_DMTG`.

### Travaux
- Charger `tax_settings` via `useFiscalContext()`.
- Passer `dmtgSettings` au moteur : `calculateSuccession({ ..., dmtgSettings })`.
- Afficher dans l’UI (optionnel mais utile) la version/empreinte du dossier fiscal utilisé.

### Fichiers
- Modifier : `src/features/succession/useSuccessionCalc.ts`
- Modifier (si besoin) : `src/features/succession/SuccessionSimulator.tsx`
- Moteur déjà prêt : `src/engine/succession.ts`

### DoD
- Changer un abattement DMTG côté admin → recalcul Succession reflète le changement.
- Aucun appel implicite à `DEFAULT_DMTG` depuis l’UI.

### Preuves attendues
- Diff montrant que `dmtgSettings` est passé à `calculateSuccession`.
- Exemple : abattement enfant modifié dans settings → résultat succession change.

---

## PR-P1-06-03 — Supprimer la duplication DMTG (source unique)

### Objectif
Un seul endroit pour les valeurs par défaut DMTG, pour éviter divergences.

### Travaux
- Remplacer `DEFAULT_DMTG` (moteur) par une importation depuis `settingsDefaults.ts` **ou** déplacer le défaut DMTG dans un module partagé unique.
- Supprimer/neutraliser les constantes `@deprecated` qui dupliquent encore des valeurs (ou les faire pointer vers la source unique).

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

## PR-P1-06-04 — Nouvelle page `/settings/dmtg-succession` (admin + lecture)

### Objectif
Créer la page premium qui centralise transmission : DMTG successions/donations + assurance-vie décès + référentiel civil (lecture seule).

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

### Fichiers
- Nouveau : `src/pages/settings/SettingsDmtgSuccession.jsx` (+ CSS)
- Modifier : `src/constants/settingsRoutes.js` (ajout route)
- Modifier : `src/utils/fiscalSettingsCache.js` (déjà charge tax/ps/fiscality : vérifier invalidations)
- Modifier : `src/pages/settings/SettingsShell.jsx` (si nécessaire selon structure)
- Optionnel : composants sections dans `src/pages/settings/dmtg/*`

### DoD
- Page accessible depuis Settings.
- Admin peut modifier + sauvegarder.
- Les simulateurs impactés recalculent après invalidation.

### Preuves attendues
- Route présente dans `settingsRoutes.js`.
- Sauvegarde → appel `invalidate('tax')` / `invalidate('fiscality')` + broadcast.
- UI cohérente avec style Settings existant.

---

## PR-P1-06-05 — Fix Placement : DMTG options branchées correctement

### Objectif
Le simulateur Placement doit utiliser le barème DMTG réel (au moins ligne directe) pour proposer les options.

### Travaux
- Corriger `taxSettings?.dmtg?.scale` → `taxSettings?.dmtg?.ligneDirecte?.scale` (ou via `fiscalParams.dmtgScale` déjà normalisé).
- Ajouter un test simple (ou un guard) : si pas de scale, fallback explicite + warning.

### Fichiers
- Modifier : `src/features/placement/components/usePlacementSimulatorController.js`

### DoD
- Les options DMTG affichées reflètent la configuration admin.
- Pas de “undefined scale” silencieux.

### Preuves attendues
- Diff du chemin corrigé.
- Test manuel : changer tranche → options/valeurs changent.

---

## PR-P1-06-06 — Aligner Stratégie sur les mêmes paramètres IR que /sim/ir

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

## PR-P1-06-07 — Validation admin (anti-erreurs silencieuses)

### Objectif
Empêcher les incohérences de saisie qui peuvent engager la responsabilité (outil pro).

### Travaux (minimum utile)
- Contrôler : taux en %, bornes raisonnables, tranches ordonnées, pas de négatif.
- Messages clairs (“Le taux doit être entre 0 et 100”, “Tranche suivante doit commencer après la précédente”…).
- Bloquer la sauvegarde si incohérent.

### Fichiers
- Pages settings : `src/pages/settings/SettingsImpots.jsx`, `SettingsPrelevements.jsx`, nouvelle `SettingsDmtgSuccession.jsx`

### DoD
- Une saisie manifestement incohérente ne peut pas être sauvegardée.

### Preuves attendues
- Cas de test manuel documenté : saisie 172 → message d’erreur.
- Diff montrant un validateur central (si possible) réutilisé par plusieurs pages.

---

## PR-P1-06-08 — Traçabilité dans les fichiers `.ser1` (stabilité des résultats)

### Objectif
Si un dossier `.ser1` est rouvert après mise à jour des paramètres, l’utilisateur comprend pourquoi le résultat change, ou peut recalculer “avec les paramètres de l’époque”.

### Travaux
- Évoluer le schéma snapshot (nouvelle version) pour stocker :
  - `tax_settings.version`/`updated_at` (ou empreinte hash du JSON)
  - `ps_settings.version`/`updated_at`
  - `fiscality_settings.version`/`updated_at`
- À l’ouverture d’un `.ser1`, si versions différentes : afficher un avertissement simple (“les paramètres fiscaux ont été mis à jour depuis la sauvegarde”).

### Fichiers
- Modifier : `src/reporting/json-io/snapshotSchema.ts` (bump version)
- Modifier : `src/reporting/json-io/snapshotMigrations.ts` (migration)
- Modifier : modules de sauvegarde/chargement des sims (placement/IR/strategy…)

### DoD
- Un `.ser1` conserve l’identité des paramètres utilisés.
- Alerte visible si mismatch.

### Preuves attendues
- Snapshot v4 (ou +1) validé, migration OK.
- Exemple : sauver → changer settings → rouvrir → warning affiché.

---

## PR-P1-06-09 — Tests & garde-fous “source unique”

### Objectif
Éviter que de nouveaux chiffres révisables reviennent en dur dans le code.

### Travaux
- Ajouter un test “grep” (ou équivalent) sur des patterns de chiffres sensibles (PS 17.2, seuils DMTG…) dans des zones interdites.
- Ajouter 3–5 “cas référence” (golden) pour :
  - Succession (1–2 cas simples)
  - Stratégie vs IR (cohérence)
  - Placement DMTG (option list)

### Fichiers
- Tests engine existants : `src/engine/__tests__/...`
- (Nouveau) test de garde : à placer dans l’endroit déjà prévu pour ce type de check.

### DoD
- CI empêche les régressions “chiffre en dur” sur zones critiques.

---

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
