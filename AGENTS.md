# SER1 — AGENTS.md

## Contexte

Simulateurs fiscaux CGP (IR, Succession, Placement, Crédit, PER, Stratégie).
Stack : React 19 + React Router 7 + Vite 8 + TypeScript 6 strict + Supabase.
Terminal : Windows/PowerShell — pas de commandes macOS/Linux.
CI gate : `npm run check` — doit passer avant tout commit.

## Phase projet

L'app n'est pas encore commercialisée — elle est en phase de construction, sans utilisateurs en production.

- **Pas de legacy défensif** — pas de shim de rétrocompatibilité, pas de flag de feature, pas de double chemin ancien/nouveau. Remplacer franchement plutôt que faire coexister.
- **Pas de code mort gardé « au cas où »** — supprimer les anciennes implémentations remplacées, les exports devenus inutiles, les types obsolètes, plutôt que de les marquer `@deprecated`.
- **Mais pas de régression** — avant de remplacer, vérifier les usages (`rg`), faire tourner `npm run check`, ne pas casser un simulateur, un export ou la chaîne fiscale existante.

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

## Cadence PR & CI

- Favoriser des PR thématiques complètes plutôt qu'une cascade de micro-PR. Un palier cohérent peut contenir plusieurs commits si chaque commit reste relisible.
- Développer et committer localement ; pousser seulement quand le bloc logique est vert localement. La boucle de développement est `npm run check` local, la CI confirme.
- Isoler une PR seulement quand le rollback doit être atomique : exports, migrations, suppression de compatibilité, refactor à risque ou changement de branch protection.
- Toute PR doit contenir une section **Dettes restantes** avec `fichier:ligne`, preuve, raison du report et PR cible, ou la mention explicite `Aucune dette restante identifiée`.
- Interdiction d'introduire une dette muette : bug figé dans une baseline, exception de check, allowlist, gros fichier ou écart UI non listé dans la PR.
- Pour un renommage de checks requis GitHub, faire apparaître les nouveaux jobs sur la PR, mettre à jour la branch protection, puis relancer la PR avant merge.

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

## Avant de modifier SER1

- Lire le fichier structurant adapté au périmètre (`docs/ARCHITECTURE.md`,
  `docs/METIER.md`, `docs/GOUVERNANCE_EXPORTS.md`, `docs/RUNBOOK.md`,
  `.github/CONTRIBUTING.md`) avant de proposer ou modifier.
- Prouver les usages avec `rg` avant toute suppression, déplacement ou affirmation
  de code mort, RLS OK, Storage OK ou compatibilité supprimable.
- Identifier le garde-fou à mettre à jour en même temps que le code :
  fiscal, export, Supabase/RLS/Storage, migrations, CI, baseline ou docs.
- Pour une nouvelle verticale roadmap, vérifier systématiquement routes, docs,
  tests, exports, Supabase/RLS, fiscal settings et CI.

## Interdictions fortes

- Ne jamais introduire de valeur fiscale hardcodée hors source fiscale officielle
  ou settings centralisés.
- Ne jamais ajouter de calcul métier dans `src/pptx`, exports PPTX ou Excel,
  sans helper engine/domain validé ou test de parité.
- Ne jamais modifier Supabase, RLS ou Storage sans mettre à jour les checks
  associés (`check:supabase-rls`, `check:storage-policies`,
  `check:supabase-migrations`).
- Ne jamais ajouter une dette en baseline sans justification explicite dans la PR.
- Ne jamais utiliser `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck` ou `any`
  pour contourner un problème. ESLint bloque les `any` explicites hors tests ;
  une exception doit rester locale, typée par narrowing et justifiée dans la PR.
- Ne jamais modifier la CI sans prouver que chaque ancien check reste couvert.
- Ne jamais créer de fichier ou dossier `legacy`, `old`, `backup`, `tmp`,
  `deprecated` ou `generated` sans règle claire, génération reproductible ou
  allowlist documentée.
- Ne jamais dupliquer une règle fiscale dans l'UI ou les exports.

## Exceptions autorisées uniquement avec preuve

- Compatibilité ancien format : autorisée seulement si un draft, export,
  sauvegarde locale ou format utilisateur encore supporté le nécessite. Isoler
  dans un fichier de migration/compatibilité, documenter le périmètre et garder
  un test de compatibilité.
- Baseline ou allowlist : autorisée seulement si elle explique pourquoi
  l'exception existe, pourquoi elle est acceptable et comment empêcher sa
  croissance.
- Fichier généré : autorisé seulement avec source génératrice, commande de
  vérification et commentaire `@generated` ou équivalent.
- Exception architecturale : documenter la raison dans les docs structurantes et
  dans l'allowlist/check concerné.
- Nouveau script de check : documenter utilité, commande, périmètre et niveau
  bloquant ou informatif.

## Checklist avant fin de tâche IA

- Les chemins ajoutés aux docs/scripts sont relatifs au repo, jamais locaux.
- Les tests/checks ciblés du périmètre ont été lancés et les résultats notés.
- `npm run check` est lancé avant commit ou l'impossibilité est expliquée.
- Aucun hardcode fiscal, contournement TypeScript, baseline facile ou legacy
  ambigu n'a été ajouté.
- Toute modification export a un test de parité ou une justification explicite.
- Toute modification Supabase/RLS/Storage/migration met à jour le check associé.
- Les docs ne promettent que des comportements et scripts réellement présents.

## Charger automatiquement selon la tâche

Les règles métier et docs structurantes ci-dessous sont communes à tous les assistants. Les skills
d'exécution restent propres à chaque outil : Claude Code charge automatiquement ses skills projet
dans `.claude/skills/<nom>/SKILL.md`, Codex charge automatiquement ses propres skills installés.
Ne pas demander de commande manuelle à l'utilisateur pour activer un skill.

| Si la tâche touche…                            | Lire                                        |
| ---------------------------------------------- | ------------------------------------------- |
| CSS, UI, thème, couleurs, pages `/sim/*`       | `docs/DESIGN.md` puis `docs/GOUVERNANCE.md` |
| Architecture, structure, flux, Supabase        | `docs/ARCHITECTURE.md`                      |
| Règles métier fiscales, périmètre simulateurs  | `docs/METIER.md`                            |
| Exports PPTX / Excel                           | `docs/GOUVERNANCE_EXPORTS.md`               |
| `src/domain/base-contrat/` (catalogue, règles) | `docs/ARCHITECTURE.md` § Base-Contrat       |
| Git workflow, PR, conventions humains          | `.github/CONTRIBUTING.md`                   |

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
