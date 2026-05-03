# SER1 — Gemini Code Assist

`AGENTS.md` est la source unique pour les règles agent de ce dépôt.

## À lire systématiquement

- `AGENTS.md`

## À lire selon le contexte de la tâche

- **UI / thème / couleurs** → `docs/GOUVERNANCE.md`
- **Métier / simulateurs / règles fiscales** → `docs/METIER.md`
- **Structure / refactor / archi** → `docs/ARCHITECTURE.md`
- **Exports / PPTX / Excel** → `docs/GOUVERNANCE_EXPORTS.md`
- **Workflow git / PR / conventions humains** → `.github/CONTRIBUTING.md`

## Posture & Méthodologie de réflexion (Anti-Hallucination)

Afin de garantir un code de qualité et sans erreur, Gemini doit **strictement**
appliquer cette méthode à chaque requête :

- **1. Analyse minutieuse** : Relire la demande de l'utilisateur pour en saisir
  toutes les nuances. Identifier exactement les contraintes métier ou
  techniques.
- **2. Réflexion silencieuse (Chain of Thought)** : Prendre le temps de
  planifier la solution étape par étape avant de générer le moindre code.
  Évaluer l'impact de la modification sur l'architecture globale (ex:
  `src/engine/` vs `src/features/`).
- **3. Zéro Hallucination** : Se baser **exclusivement** sur le contexte fourni,
  le code source ouvert et les règles de SER1. S'il manque un fichier ou un type
  pour comprendre le système à 100%, **demander à l'utilisateur de l'ajouter au
  contexte au lieu de deviner**.
- **4. Intervention chirurgicale** : Proposer le diff le plus minimaliste et
  précis possible. Ne **jamais** refactorer du code non concerné par la demande.
- **5. Auto-relecture (Vérification finale)** : Avant de générer la réponse
  finale, relire la demande initiale de l'utilisateur et vérifier mentalement
  que :
  - La solution répond exactement au besoin.
  - Aucune règle absolue (zéro hardcode fiscal, imports `@/`, pureté des
    fonctions) n'a été violée.
  - Le code proposé ne contient pas de `console.log` ou de types `any`.

## Règles et Skills automatiques (Gemini)

Gemini charge et applique ces comportements de façon **automatique** en fonction de la demande de l'utilisateur ou des fichiers touchés :

- **`base.md`** (`.gemini/skills/base.md`) : **Toujours actif**. Terminal Windows PowerShell et langue française stricte.
- **`arch-check.md`** (`.gemini/skills/arch-check.md`) : **Avant une PR ou après ajout de fichiers dans `src/`**. Revue d'architecture (limites taille, boundaries, imports).
- **`clean-code.md`** (`.gemini/skills/clean-code.md`) : **Après toute modification de code (feature, bug, refactor)**. Propreté systématique (zéro dette, zéro log prod, TODO trackés).
- **`fix-errors.md`** (`.gemini/skills/fix-errors.md`) : **Quand `npm run check` échoue ou suite à une erreur CI**. Débogage strict et systématique dans l'ordre de dépendance.
- **`fiscal-engine.md`** (`.gemini/skills/fiscal-engine.md`) : **Lors de touches à `src/engine/`, constantes ou hooks fiscaux**. Zéro hardcode fiscal (17.2, PASS), respect de la chaîne de données.
- **`supabase-patterns.md`** (`.gemini/skills/supabase-patterns.md`) : **Lors de touches à `src/settings/`, `supabase/`, auth ou RLS**. Utilisation d'`adminClient`, rôles `app_metadata`, invalidation du cache.
- **`reporting.md`** (`.gemini/skills/reporting.md`) : **Lors de modifications dans `src/reporting/` ou des snapshots**. Gestion des migrations de schémas (`.ser1`) et fingerprint.
- **`succession-review.md`** (`.gemini/skills/succession-review.md`) : **Lors de modifications du simulateur succession (`src/features/succession/`)**. Respect de la matrice métier et golden tests.
- **`exports.md`** (`.gemini/skills/exports.md`) : **Lors de tâches liées aux exports PowerPoint ou Excel**. Utilisation exclusive de l'infra PPTX Serenity et XLSX Builder en code versionné.
