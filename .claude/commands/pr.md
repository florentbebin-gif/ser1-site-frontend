Créer une pull request SER1.

1. `npm run check` — doit passer intégralement.
2. Lire `.github/pull_request_template.md` pour connaître le format exact attendu.
3. Analyser les changements : `git log main..HEAD --oneline` + `git diff main...HEAD --stat`.
4. Remplir chaque section du template avec les vrais changements (Description, Changements, Fonctionnalités, Tests effectués, Notes, Checklist).
5. Branch naming : vérifier/corriger le préfixe (feat/, fix/, chore/, refactor/, test/).
6. `git push -u origin <branch>`.
7. `gh pr create --title "<type>: description courte" --body "<template rempli>"`.
8. Retourner l'URL de la PR.

Important : ne jamais inventer un format de PR — toujours lire `.github/pull_request_template.md`.
