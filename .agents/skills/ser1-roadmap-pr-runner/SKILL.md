---
name: ser1-roadmap-pr-runner
description: 'Livrer une PR roadmap SER1 complète depuis PR_CIBLE, /goal explicitement lié à une PR roadmap, docs/ROADMAP.md ou jalon V*. Déclenche préflight, audit proof-first, milestones, sous-agents spécialisés, checks ciblés, npm run check final, vérifications E2E/Deno selon périmètre et rapport PR.'
---

# SER1 Roadmap PR Runner

## Déclenchement automatique

Utiliser automatiquement ce skill pour toute tâche qui mentionne au moins un des signaux suivants :

- `PR_CIBLE`
- `/goal` explicitement lié à une PR roadmap ou à `PR_CIBLE`
- `docs/ROADMAP.md`
- `roadmap`
- `PR roadmap`
- `jalon`
- `V2`, `V3`, `V4`, `V5`, `V6`, `V7`, `V8`
- “livrer la PR”
- “terminer la roadmap”
- “branche PR mergeable”
- “développeur senior autonome”

Ne pas demander à l’utilisateur d’activer ce skill manuellement.

Ne pas utiliser ce skill pour :

- un petit bugfix sans lien roadmap ;
- une simple question d’analyse sans modification ;
- une correction CI ponctuelle hors roadmap ;
- une manipulation de fichier externe sans lien SER1 roadmap.

## Mission

Tu es le développeur senior autonome responsable de livrer la PR roadmap ciblée.

Objectif final :

- branche prête à PR ;
- diff minimal mais complet ;
- règles SER1 respectées ;
- checks ciblés verts ;
- `npm run check` vert, sauf impossibilité externe ou préexistante prouvée ;
- E2E/Deno lancés si le périmètre les exige, car ils ne sont pas entièrement couverts par `npm run check` ;
- rapport final complet ;
- PR créée si les droits GitHub sont disponibles, sinon titre et corps de PR prêts à copier-coller.

Ne demande pas de validation intermédiaire sauf blocage réel :

- droits GitHub insuffisants ;
- secret/token manquant ;
- service externe indisponible ;
- conflit majeur entre `AGENTS.md`, `docs/ROADMAP.md` et le code réel ;
- décision produit impossible à déduire ;
- risque de suppression destructive hors repo ou hors périmètre.

Si une ambiguïté mineure existe, choisir l’option la plus conservatrice, conforme à la roadmap, avec diff minimal, puis documenter la décision dans le rapport final.

## Règles absolues

Respecter en priorité :

- `AGENTS.md`
- `.github/CONTRIBUTING.md`
- `.github/pull_request_template.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/GOUVERNANCE.md`
- `docs/METIER.md`
- `docs/DESIGN.md` si UI touchée
- `docs/GOUVERNANCE_EXPORTS.md` si exports touchés
- `docs/RUNBOOK.md`
- docs spécialisées selon le périmètre.

Contraintes non négociables :

- français partout ;
- diff minimal mais complet ;
- pas de refactor annexe ;
- pas de code mort conservé ;
- pas de compatibilité défensive sans preuve ;
- pas de baseline, allowlist ou exception silencieuse ;
- pas de valeur fiscale hardcodée ;
- ne jamais bypasser la chaîne fiscale :
  `Supabase → fiscalSettingsCache.ts → useFiscalContext.ts → settingsDefaults.ts` ;
- ne jamais dupliquer une règle fiscale dans l’UI ou les exports ;
- ne jamais ajouter `any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` pour contourner ;
- ne jamais modifier `CHANGELOG.md` dans une PR fonctionnelle ;
- ne jamais créer de doc éphémère versionnée ;
- toute affirmation “code mort”, “safe to delete”, “non utilisé”, “RLS OK”, “orphelin” ou “aucune référence” doit être prouvée par `rg`, chaîne d’import, test ou check.

Terminal cible : Windows/PowerShell.

## Préflight obligatoire

Avant toute modification :

1. Vérifier :
   - `git status`
   - `git branch --show-current`

2. Identifier la PR cible :
   - extraire `PR_CIBLE` si présent ;
   - retrouver la section exacte dans `docs/ROADMAP.md`.

3. Lire les documents nécessaires :
   - `AGENTS.md`
   - `.github/CONTRIBUTING.md`
   - `.github/pull_request_template.md`
   - `docs/ROADMAP.md`
   - section exacte de la PR cible ;
   - docs spécialisées selon périmètre.

4. Faire un audit proof-first :
   - rechercher les fichiers concernés avec `rg` ;
   - prouver les usages avant suppression/déplacement ;
   - identifier routes, settings, simulateurs, exports, Supabase, fiscalité, tests et checks impactés ;
   - identifier les risques de duplication ou d’ancien flux concurrent.

5. Produire un contrat de PR :
   - objectif exact ;
   - hors-scope ;
   - zones touchées ;
   - risques ;
   - checks ciblés prévus ;
   - sous-agents prévus ;
   - conditions d’arrêt.

Après ce contrat, continuer sans attendre validation, sauf blocage réel.

## Milestones

Découper la PR en milestones cohérents.

Pour chaque milestone :

1. relire le scope ;
2. inspecter les fichiers ;
3. appliquer le patch minimal ;
4. supprimer le code réellement devenu mort ;
5. ajouter ou adapter les tests/checks nécessaires ;
6. lancer les checks ciblés ;
7. corriger jusqu’à vert ;
8. ne committer que si `npm run check` a été lancé et est vert sur l’état courant.

Pour éviter de relancer `npm run check` trop souvent, il est autorisé de ne pas committer entre milestones et de créer les commits propres en fin de PR, après gate global vert. En revanche, aucun commit ne doit être créé sur un état qui n’a pas passé `npm run check`, sauf impossibilité externe ou préexistante prouvée.

Ne pas mélanger des sujets indépendants dans un même commit.

## Sous-agents

Utiliser explicitement des sous-agents quand le périmètre le justifie. Les sous-agents doivent être bornés, avec mission claire, fichiers/docs à lire, et sortie en preuves `fichier:ligne`.

Par défaut, les sous-agents sont utilisés en lecture, audit ou revue. Ils ne doivent modifier des fichiers que si l’agent principal leur attribue un périmètre explicitement disjoint. L’agent principal reste seul responsable de l’intégration finale.

Sous-agents à utiliser selon périmètre :

### roadmap/scope

Vérifie que toute la section roadmap ciblée est couverte, sans hors-scope.

### architecture

Vérifie frontières d’import, registres, routes, orphelins, duplication et cohérence architecture.

### fiscal-chain

Obligatoire si fiscalité, settings, moteurs ou exports fiscaux touchés.
Vérifie hardcodes, chaîne fiscale, settings-references et absence de recalcul export.

### UI/design

Obligatoire si UI touchée.
Vérifie DESIGN, primitives `Sim*`, modales, inputs, textes FR, tokens, responsive/accessibilité raisonnable.

### tests/checks

Obligatoire pour toute PR roadmap.
Vérifie couverture, checks ciblés, E2E nécessaires, Deno nécessaire, et `npm run check`.

### Supabase/RLS

Obligatoire si DB, migrations, policies, storage ou accès Supabase touchés.

### exports/reporting

Obligatoire si PPTX, Excel, PDF, reporting ou `.ser1` touchés.

### succession

Obligatoire si succession, donation, démembrement, PER succession ou fiscalité patrimoniale touchés.

### clean-code

À utiliser en revue finale si la PR modifie plusieurs fichiers ou introduit de nouveaux composants/types/hooks.

L’agent principal reste responsable de vérifier les rapports des sous-agents et de traiter les findings bloquants.

## Checks ciblés

Adapter au périmètre.

Avant de lancer ou citer un script npm, vérifier son existence dans `package.json`. Si un script attendu n’existe pas, ne pas l’inventer : noter “non disponible” dans le rapport et utiliser le check équivalent existant si prouvé.

Base générale :

- `git diff --check`
- `npm run format:check`
- `npm run lint:repo`
- `npm run typecheck`
- `npm test`

Architecture :

- `npm run check:deep-imports`
- `npm run check:orphan-source-files`
- `npm run check:arch`
- `npm run check:circular`
- `npm run check:routes-doc-sync`
- `npm run check:naming-conventions`

UI/settings/simulateurs :

- `npm run check:no-raw-number-input`
- `npm run check:no-raw-temporal-input`
- `npm run check:modal-canon`
- `npm run check:sim-cards`
- `npm run check:sim-kpi-border`
- `npm run check:css-colors`
- `npm run check:theme-sync`
- `npm run check:settings-references`
- `npm run check:e2e-auth-pages-coverage`
- `npm run test:e2e:auth-pages` si route privée/settings/sim active modifiée.

Fiscal :

- `npm run check:fiscal-hardcode`
- `npm run check:raw-fiscal-usage`
- tests unitaires concernés.

Supabase :

- `npm run check:supabase-rls`
- `npm run check:settings-rls`
- `npm run check:storage-policies`
- `npm run check:supabase-migrations`
- `npm run check:base-cg-migration`
- `npm run check:base-cg-schema`
- `npm run check:deno` ou `npm run test:deno` si Edge Functions/Deno touchés.

Exports :

- `npm run check:export-parity`
- `npm run check:pptx-images`

Baselines/assets :

- `npm run check:asset-budget`
- `npm run check:large-files-baseline`

E2E hors gate global :

- `npm run test:e2e:functional` si parcours fonctionnel impacté ;
- `npm run test:e2e:visual` si UI visuelle importante impactée ;
- `npm run test:e2e:auth-pages` si route privée/settings/sim active modifiée.

Gate final obligatoire :

- `npm run check`

Si `npm run check` échoue :

1. analyser la première cause racine ;
2. corriger si lié à la PR ;
3. relancer le check ciblé ;
4. relancer `npm run check` ;
5. ne jamais masquer par baseline/allowlist ;
6. si échec externe ou préexistant, le prouver avec état initial, logs et `git diff`.

## Revue finale

Avant de conclure :

1. `git status`
2. `git diff --stat`
3. revue du diff complet
4. vérifier que tous les fichiers modifiés sont nécessaires
5. vérifier aucun fichier temporaire/debug
6. vérifier aucun `console.log`
7. vérifier textes UI français
8. vérifier `CHANGELOG.md` non modifié
9. vérifier dettes restantes
10. vérifier respect du hors-scope

Corriger les findings bloquants.
Classer les non-bloquants dans le rapport final.

## Commits et PR

Utiliser des commits Conventional Commits en français si possible.

Ne pas committer :

- rapports temporaires ;
- artefacts de build ;
- fichiers locaux ;
- logs ;
- notes d’audit éphémères ;
- changements hors-scope.

Quand la branche est verte localement :

1. pousser la branche si droits GitHub disponibles ;
2. créer la PR si l’outil le permet ;
3. remplir `.github/pull_request_template.md` ;
4. observer la CI si accessible ;
5. corriger les échecs CI liés à la PR ;
6. ne pas merger automatiquement.

Si GitHub n’est pas accessible :

- produire un titre de PR ;
- produire un corps de PR complet ;
- lister les commandes exactes à lancer.

## Rapport final obligatoire

Répondre en français avec ces sections :

### Résumé

- PR ciblée :
- Branche :
- État :
- PR créée : oui/non + lien si disponible

### Changements réalisés

Lister par domaine.

### Commits

Lister les commits avec SHA court si disponible.

### Checks lancés

Pour chaque commande :

- commande ;
- résultat : vert/rouge/non lancé ;
- raison si non lancé.

Inclure obligatoirement :

- `npm run check`
- E2E/Deno requis ou justification “non requis car hors périmètre”.

### Revue des sous-agents

Pour chaque sous-agent :

- mission ;
- findings bloquants ;
- corrections appliquées ;
- findings non bloquants restants.

### Conformité roadmap

- critères satisfaits ;
- hors-scope respecté ;
- écarts justifiés.

### Dettes restantes

Soit `Aucune dette restante identifiée`, soit :

- `fichier:ligne`
- preuve
- raison du report
- PR cible

### Dettes nouvelles découvertes

Même format.

### Risques / points de vigilance

Uniquement les risques réels restants.

### Action minimale suivante

Une seule action recommandée.
