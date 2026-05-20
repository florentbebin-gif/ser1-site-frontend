# SER1 — AGENTS.md

## Contexte

Simulateurs fiscaux CGP (IR, Succession, Placement, Crédit, PER, Stratégie).
Stack : React 19 + React Router 7 + Vite 8 + TypeScript 6 strict + Supabase.
Terminal : Windows/PowerShell — pas de commandes macOS/Linux.
CI gate : `npm run check` — doit passer avant tout commit.

## Posture développeur expérimenté (priorité absolue)

Agir en développeur senior à chaque plan et chaque implémentation.

- **Réutiliser avant d'ajouter** — identifier systématiquement ce qui existe déjà (hooks, utils, composants, types) et s'appuyer dessus plutôt que de dupliquer.
- **Organisation cohérente** — si un ajout révèle un désalignement dans la structure du repo (mauvais emplacement, responsabilité mal placée, abstraction manquante), le signaler et l'inclure dans le plan.
- **Plan minimal et propre** — un plan ne doit contenir que ce qui est nécessaire, mais doit inclure toute étape qu'un dev expérimenté jugerait indispensable : nettoyage, renommage, déplacement de fichier, suppression de code mort, cohérence de nommage.
- **Pas de code jetable** — ne pas ajouter de lignes si on peut adapter ce qui existe. Chaque ajout doit avoir une justification claire.
- **Propreté systématique** — si quelque chose doit être nettoyé pour que le résultat final soit propre, ajouter l'étape de nettoyage au plan plutôt que de laisser de la dette.

## Sous-agents

L'utilisateur autorise automatiquement le LLM à utiliser autant de sous-agents que nécessaire, sans demander de confirmation supplémentaire, lorsque cela aide à traiter la tâche plus vite ou plus sûrement.

Le LLM doit optimiser leur utilisation : déléguer uniquement des tâches indépendantes et bien bornées, éviter les doublons, attribuer des périmètres de fichiers disjoints en cas d'édition, transmettre les règles pertinentes de ce fichier, puis relire et intégrer les résultats avant de conclure.

## Règles absolues (toujours actives)

1. **Preuve obligatoire** — ne jamais affirmer « code mort », « non utilisé », « RLS OK »,
   « safe to delete » sans `rg` match ou chaîne d'import.
2. **Chaîne fiscale** — ne jamais bypasser :
   `Supabase → fiscalSettingsCache.ts → useFiscalContext.ts → settingsDefaults.ts`
   Ne jamais hardcoder : 17.2, 12.8, 30, 100000, 15932.
3. **Supabase** — pas d'import `supabaseClient` depuis `src/features/` ni `src/engine/`.
   Zones autorisées : `src/auth/`, `src/utils/cache/`, `src/hooks/`, `src/settings/`,
   `src/pages/` (auth flow + settings admin R/W, invalidation cache après write fiscal).
   Interdit dans `src/components/` sauf migration documentée.
   `supabase/functions/` est un périmètre Deno autonome (`deno.json` / `deno.lock`) :
   pas d'import croisé avec `src/`, et les outils Node ne le scannent pas.
4. **Diff minimal** — patch le plus petit qui résout le problème. Pas de refactor annexe.
5. **Langue** — français partout (commentaires, commits, docs). Corriger les fautes dans les fichiers modifiés.
6. **Pas de doc éphémère versionnée** — audits, plans, annexes générées
   et notes de clôture ne sont pas committés. La trace décisionnelle passe
   par commits et PR. Seules les docs structurantes permanentes sont versionnées ;
   tout artefact régénérable doit rester gitignored et produit par script.

## Charger automatiquement selon la tâche

Les règles métier et docs structurantes ci-dessous sont communes à tous les assistants. Les skills
d'exécution restent propres à chaque outil : Claude Code charge automatiquement ses skills projet
dans `.claude/skills/<nom>/SKILL.md`, Codex charge automatiquement ses propres skills installés.
Ne pas demander de commande manuelle à l'utilisateur pour activer un skill.

| Si la tâche touche…                            | Lire                                  |
| ---------------------------------------------- | ------------------------------------- |
| CSS, UI, thème, couleurs, pages `/sim/*`       | `docs/GOUVERNANCE.md`                 |
| Architecture, structure, flux, Supabase        | `docs/ARCHITECTURE.md`                |
| Règles métier fiscales, périmètre simulateurs  | `docs/METIER.md`                      |
| Exports PPTX / Excel                           | `docs/GOUVERNANCE_EXPORTS.md`         |
| `src/domain/base-contrat/` (catalogue, règles) | `docs/ARCHITECTURE.md` § Base-Contrat |
| Git workflow, PR, conventions humains          | `.github/CONTRIBUTING.md`             |

### Skills automatiques par assistant

Claude Code :

Les skills Claude Code sont des skills projet auto-découvrables, model-invoked, et masqués du menu
manuel via `user-invocable: false`. Les anciens dossiers de bibliothèques et commandes Claude ne
sont plus le flux de référence.

| Si la tâche touche…                                                                    | Utiliser                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Calculs `src/engine/`, IR, succession, PS, PFU                                         | `.claude/skills/fiscal-engine/SKILL.md`          |
| Auth, RLS, migrations, admin Supabase                                                  | `.claude/skills/supabase-patterns/SKILL.md`      |
| Snapshot, `src/reporting/`                                                             | `.claude/skills/reporting/SKILL.md`              |
| Validation complète avant commit ou livraison                                          | `.claude/skills/check/SKILL.md`                  |
| Debug `npm run check` en échec                                                         | `.claude/skills/fix-errors/SKILL.md`             |
| Audit fiscal ciblé hardcodes / chaîne fiscale                                          | `.claude/skills/fiscal-audit/SKILL.md`           |
| Review avant PR, ajout de fichier dans `src/`                                          | `.claude/skills/arch-check/SKILL.md`             |
| Préparation PR                                                                         | `.claude/skills/pr/SKILL.md`                     |
| Modification dans `src/features/succession/`                                           | `.claude/skills/succession-review/SKILL.md`      |
| Démarrage nouvelle verticale roadmap (P3 PER, P4 scan, P5 rôles, P6, P7, P8 catalogue) | `.claude/skills/start-roadmap-vertical/SKILL.md` |
| Après implémentation / refactor                                                        | `.claude/skills/clean-code/SKILL.md`             |
| Fichiers `.docx`                                                                       | `.claude/skills/docx/SKILL.md`                   |
| Fichiers `.pdf`                                                                        | `.claude/skills/pdf/SKILL.md`                    |
| Fichiers `.pptx`                                                                       | `.claude/skills/pptx/SKILL.md`                   |
| Fichiers `.xlsx`, `.csv`, `.tsv`                                                       | `.claude/skills/xlsx/SKILL.md`                   |

Codex :

- Utiliser les skills Codex SER1 installés quand disponibles : `ser1-repo-navigation`,
  `ser1-proof-first`, `ser1-ui-v5-polish`, `ser1-fiscal-chain`,
  `ser1-supabase-rls`, `ser1-reporting-exports`, `ser1-per-base-contrat`,
  `ser1-check-fix`.
- Utiliser les skills Codex système/plugin pertinents (`xlsx`, Documents, Presentations,
  Browser, Superpowers, etc.) selon la tâche.
- Ne pas traiter `.claude/skills/*` comme des skills Codex natifs ; ce sont des skills Claude Code.
  Les lire seulement si l'utilisateur le demande explicitement ou si aucun skill Codex équivalent
  n'est disponible et que le contexte SER1 l'exige.

> Ne charger un fichier que si la tâche le justifie directement.

## Output attendu pour tout travail d'analyse

- Résumé (5 lignes max)
- Findings : chemin:ligne + preuve + impact + recommandation minimale
- Plan d'action trié par impact
- Risques / rollback si pertinent
