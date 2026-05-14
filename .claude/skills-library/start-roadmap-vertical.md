---
description: Auto-déclenché au démarrage d'une nouvelle verticale roadmap SER1 (P3 PER multi-enveloppes, P4 scan documentaire, P5 rôles admin, P6 analyse premium, P7 stratégie, P8 catalogue cabinet). Force une procédure stricte avec gates obligatoires : brief produit → décision données → décision infra → décision UI/mode → modèle TS → test golden → code → docs → PR. Bloque tant que l'étape précédente n'est pas validée.
---

# Start Roadmap Vertical

Procédure stricte pour démarrer une nouvelle verticale roadmap SER1 (P3 à P8).
Le but : éviter de partir « au feeling » sur un chantier large, en forçant la spec avant le code.

Ne pas utiliser pour :
- P2 (mode simplifié/expert) — déjà amorcé, infrastructure existante (`src/settings/userModeDisplay.tsx` + `docs/mode-simplifie-expert.md`).
- Bug fix, petit refactor, ajout localisé dans une feature existante → utiliser `clean-code` ou `arch-check`.

## Posture

Procédure **bloquante par étape**. À chaque étape, un artefact concret doit exister avant de passer à la suivante. Si l'utilisateur veut sauter une étape, demander explicitement confirmation et noter l'écart.

Sortie attendue à chaque étape : chemin de fichier, commit, ou sortie de commande vérifiable. Pas de promesse verbale.

---

## Étape 1 — Brief produit

Refuser de continuer tant que le brief n'est pas écrit.

**Artefact** : `docs/feature-<vertical-id>.md` (ex. `docs/feature-per-multi-enveloppes.md`, `docs/feature-scan-documentaire.md`).

**Contenu minimum (1 page max)** :
- Problème utilisateur (1 paragraphe).
- Personae cible (CGP, client, admin cabinet).
- Périmètre inclus / exclus (explicite).
- Critères d'acceptation produit (3-5 puces).
- Référence roadmap (`docs/ROADMAP.md` §PX).
- Dépendances autres verticales (qui doit être fait avant ?).

Si le brief est plus long, demander au product de réduire. Un brief illisible = pas de brief.

---

## Étape 2 — Décision données

**Artefact** : section « Modèle données » ajoutée au brief de l'étape 1.

**Contenu** :
- Tables Supabase concernées (existantes ou à créer).
- Migrations attendues (`supabase/migrations/<timestamp>_<slug>.sql`).
- RLS : qui lit, qui écrit, owner-only ou pas.
- Indices nécessaires sur les nouvelles tables.
- Impact cache : `fiscalSettingsCache` ou autre cache à invalider ?

Référence obligatoire : `.claude/rules-library/supabase-patterns.md`.

Refuser de continuer si une nouvelle table est introduite sans plan RLS.

---

## Étape 3 — Décision infra

**Artefact** : section « Infrastructure » dans le brief.

**Contenu** :
- Env vars (`VITE_*`) à ajouter dans `.env.example` (jamais `.env` directement).
- Secrets nécessaires (CI, Supabase, services externes).
- Side-effects au boot (init dans `main.tsx` ?).
- Edge functions concernées (`supabase/functions/<name>/`).
- Coût observabilité : doit-on logger ce flow dans Sentry ?

Si la verticale introduit un service externe (P4 scan documentaire par exemple), exiger une analyse PII et rétention.

---

## Étape 4 — Décision UI / mode

**Artefact** : section « UI et mode » dans le brief + mise à jour `docs/mode-simplifie-expert.md` si nécessaire.

**Règle par défaut** : toute nouvelle verticale est `expertOnly` tant qu'une décision produit explicite n'a pas défini un parcours simplifié.

**Contenu** :
- Le mode simplifié masque-t-il cette feature, ou la propose-t-il avec moins de champs ?
- Quelles routes `/sim/*` ou `/settings/*` sont impactées ?
- Y a-t-il un override local de mode pour cette feature ?

Rappel non négociable : **le mode masque l'UI, ne change jamais les hypothèses moteur** (cf. AGENTS.md règle 2).

---

## Étape 5 — Modèle TypeScript

**Ordre obligatoire** :
1. Types `src/domain/<vertical>/` (modèle métier pur, zéro React, zéro Supabase).
2. Types `src/engine/<vertical>/` si calculs nécessaires (toujours zéro React).
3. Types `src/features/<vertical>/` (consomment 1 et 2).
4. Composants `src/pages/<vertical>.tsx` (consomment 3).

**Artefact** : commit séparé `feat(<vertical>): types domaine` avec les fichiers `domain/` uniquement, avant tout code feature.

Vérification : `npm run check:arch` doit passer (depcruise enforce les boundaries).

---

## Étape 6 — Test golden

**Artefact** : un test métier minimal qui verrouille un cas représentatif AVANT toute UI.

**Pattern** :
- Engine fiscal : test golden JSON dans `src/engine/<vertical>/__tests__/golden/`.
- Logique non-fiscale : test Vitest classique avec valeurs attendues figées.

Ce test **doit échouer** au début (le code n'existe pas encore). C'est le contrat. Une fois implémenté, il doit passer. Si on change le résultat, on documente pourquoi.

---

## Étape 7 — Code + documentation

**Pendant le code** :
- `npm run check` à chaque modification importante.
- Conventional commits stricts (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- Pas de console.log (le check CI l'interdit).
- Pas de hardcode fiscal (`check:fiscal-hardcode` l'interdit).

**Mise à jour docs OBLIGATOIRE si convention change** :
- `docs/ARCHITECTURE.md` : nouvelle frontière, nouveau pattern, nouveau dossier majeur.
- `docs/METIER.md` : nouvelle règle fiscale, nouveau périmètre simulateur.
- `docs/ROADMAP.md` : marquer la verticale comme amorcée, livrée ou en cours.
- `docs/RUNBOOK.md` : nouvelle commande, nouveau debug flow.

Refuser de fermer la verticale si la doc n'est pas alignée.

---

## Étape 8 — PR atomique

**Découpe par défaut** :
1. PR-spec : brief + docs (étapes 1-4).
2. PR-types : modèle TS (étape 5).
3. PR-test : test golden qui échoue (étape 6).
4. PR-impl : implémentation qui fait passer le test (étape 7).
5. PR-export : intégration PPTX/XLSX/snapshot si exports impactés.

**Avant chaque PR** :
- `npm run check` vert.
- Commits conventional commits (commitlint le valide localement via husky).
- Pas de fichier > 500 lignes (component-structure.md règle « must split »).
- Pas de docs éphémère versionnée (AGENTS.md règle 6).

---

## Sortie de skill

Quand la verticale est livrée :
- ROADMAP mise à jour (statut `spec` → `livré`).
- CHANGELOG : laissé à Release Please via les conventional commits — **ne pas éditer manuellement**.
- Mémoire utilisateur Claude Code mise à jour si pattern récurrent identifié.
