# SER1 — AGENTS.md

## Contexte

Simulateurs fiscaux CGP (IR, Succession, Placement, Crédit, PER, Stratégie).
Stack : React 18 + Vite + TypeScript strict + Supabase.
Terminal : Windows/PowerShell — pas de commandes macOS/Linux.
CI gate : `npm run check` — doit passer avant tout commit.

## Posture développeur expérimenté (priorité absolue)

Agir en développeur senior à chaque plan et chaque implémentation.

- **Réutiliser avant d'ajouter** — identifier systématiquement ce qui existe déjà (hooks, utils, composants, types) et s'appuyer dessus plutôt que de dupliquer.
- **Organisation cohérente** — si un ajout révèle un désalignement dans la structure du repo (mauvais emplacement, responsabilité mal placée, abstraction manquante), le signaler et l'inclure dans le plan.
- **Plan minimal et propre** — un plan ne doit contenir que ce qui est nécessaire, mais doit inclure toute étape qu'un dev expérimenté jugerait indispensable : nettoyage, renommage, déplacement de fichier, suppression de code mort, cohérence de nommage.
- **Pas de code jetable** — ne pas ajouter de lignes si on peut adapter ce qui existe. Chaque ajout doit avoir une justification claire.
- **Propreté systématique** — si quelque chose doit être nettoyé pour que le résultat final soit propre, ajouter l'étape de nettoyage au plan plutôt que de laisser de la dette.

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
4. **Diff minimal** — patch le plus petit qui résout le problème. Pas de refactor annexe.
5. **Langue** — français partout (commentaires, commits, docs). Corriger les fautes dans les fichiers modifiés.

## Charger selon la tâche

| Si la tâche touche… | Lire |
|---|---|
| CSS, UI, thème, couleurs, pages `/sim/*` | `docs/GOUVERNANCE.md` |
| Architecture, structure, flux, Supabase | `docs/ARCHITECTURE.md` |
| Règles métier fiscales, périmètre simulateurs | `docs/METIER.md` |
| Exports PPTX / Excel | `docs/GOUVERNANCE_EXPORTS.md` |
| Calculs `src/engine/`, IR, succession, PS, PFU | `.claude/rules-library/fiscal-engine.md` |
| Auth, RLS, migrations, admin Supabase | `.claude/rules-library/supabase-patterns.md` |
| Snapshot, `src/reporting/` | `.claude/rules-library/reporting.md` |
| `src/domain/base-contrat/` (catalogue, règles) | `docs/ARCHITECTURE.md` § Base-Contrat |
| Debug `npm run check` en échec | `.claude/skills-library/fix-errors.md` |
| Review avant PR, ajout de fichier dans `src/` | `.claude/skills-library/arch-check.md` |
| Modification dans `src/features/succession/` | `.claude/skills-library/succession-review.md` |
| Après implémentation / refactor | `.claude/skills-library/clean-code.md` |
| Fichiers `.docx` | `.claude/skills-library/docx.md` |
| Fichiers `.pdf` | `.claude/skills-library/pdf.md` |
| Fichiers `.pptx` | `.claude/skills-library/pptx.md` |
| Fichiers `.xlsx`, `.csv`, `.tsv` | `.claude/skills-library/xlsx.md` |
| Git workflow, PR, conventions humains | `.github/CONTRIBUTING.md` |

> Ne charger un fichier que si la tâche le justifie directement.

## Output attendu pour tout travail d'analyse

- Résumé (5 lignes max)
- Findings : chemin:ligne + preuve + impact + recommandation minimale
- Plan d'action trié par impact
- Risques / rollback si pertinent
