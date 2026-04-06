# SER1 — Claude Code

`AGENTS.md` est la source unique pour les règles agent de ce dépôt.

## À lire systématiquement

- `AGENTS.md`

## À lire selon le contexte de la tâche

- **UI / thème / couleurs** → `docs/GOUVERNANCE.md`
- **Métier / simulateurs / règles fiscales** → `docs/METIER.md`
- **Structure / refactor / archi** → `docs/ARCHITECTURE.md`
- **Exports / PPTX / Excel** → `docs/GOUVERNANCE_EXPORTS.md`
- **Workflow git / PR / conventions humains** → `.github/CONTRIBUTING.md`

## Ressources spécifiques Claude Code (auto-chargées)

- `.claude/rules/base.md` — environnement & langue
- `.claude/rules/component-structure.md` — structure composants React
- `.claude/commands/` — commandes invocables (`/check`, `/pr`, `/fiscal-audit`)

## Ressources à lire à la demande (non auto-chargées)

- `.claude/rules-library/fiscal-engine.md` — moteur fiscal → si la tâche touche calculs IR/succession/PS/PFU
- `.claude/rules-library/supabase-patterns.md` — patterns Supabase → si la tâche touche auth/RLS/migrations/admin
- `.claude/rules-library/reporting.md` — snapshot IO et schéma → si la tâche touche `src/reporting/`
- `.claude/skills-library/` — skills exports et qualité → voir `AGENTS.md` pour les déclencheurs
