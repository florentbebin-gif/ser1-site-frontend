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

Contrairement aux anciens systèmes, Gemini charge ces comportements de façon
**automatique et permanente** selon le contexte (aucun appel manuel).

- **`base.md`** (`.gemini/skills/base.md`) : Terminal Windows PowerShell et
  langue française stricte.
- **`arch-check.md`** (`.gemini/skills/arch-check.md`) : Revue d'architecture
  (limites taille, boundaries, imports).
- **`clean-code.md`** (`.gemini/skills/clean-code.md`) : Propreté systématique
  (zéro dette, zéro log prod).
- **`fix-errors.md`** (`.gemini/skills/fix-errors.md`) : Débogage strict sans
  rustines.
- **`fiscal-engine.md`** (`.gemini/skills/fiscal-engine.md`) : Zéro hardcode
  fiscal (17.2, PASS), fonctions pures.
- **`supabase-patterns.md`** (`.gemini/skills/supabase-patterns.md`) :
  Utilisation `adminClient`, rôles `app_metadata`, cache.
- **`reporting.md`** (`.gemini/skills/reporting.md`) : Gestion des versions
  snapshots (`.ser1`) et fingerprint.
- **`succession-review.md`** (`.gemini/skills/succession-review.md`) : Respect
  de la matrice de succession `METIER.md`.
- **`exports.md`** (`.gemini/skills/exports.md`) : Utilisation de l'infra PPTX
  Serenity et XLSX Builder.
