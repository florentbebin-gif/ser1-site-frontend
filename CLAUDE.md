# SER1 — Claude Code

`AGENTS.md` est la source unique pour les règles agent de ce dépôt.

## À lire systématiquement

- `AGENTS.md`

## À lire selon le contexte de la tâche

- **UI / thème / couleurs** → `docs/DESIGN.md` puis `docs/GOUVERNANCE.md`
- **Métier / simulateurs / règles fiscales** → `docs/METIER.md`
- **Structure / refactor / archi** → `docs/ARCHITECTURE.md`
- **Exports / PPTX / Excel** → `docs/GOUVERNANCE_EXPORTS.md`
- **Workflow git / PR / conventions humains** → `.github/CONTRIBUTING.md`

## Ressources spécifiques Claude Code

- `.claude/rules/base.md` — environnement & langue
- `.claude/rules/component-structure.md` — structure composants React
- `.claude/skills/` — skills projet auto-découvrables, chargés par Claude selon le contexte

Ces ressources sont propres à Claude Code. Codex dispose de ses propres skills dans
`$CODEX_HOME/skills` ou `~/.codex/skills` et ne doit pas remplacer ce workflow Claude.

## Invocation des skills

Les skills dans `.claude/skills/<nom>/SKILL.md` doivent être invoqués automatiquement par Claude
Code à partir de leur `description` et, quand présent, de leurs `paths`. Ils sont masqués du menu
manuel avec `user-invocable: false` : l'utilisateur n'a pas à taper de commande pour les activer.

Voir `AGENTS.md` pour la table des déclencheurs : fiscal, Supabase, reporting, check, PR, exports,
succession, roadmap et clean-code.
