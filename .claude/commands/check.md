Lancer le quality gate complet et corriger les erreurs.

1. `npm run check`
2. Fixer dans l'ordre : lint → fiscal-hardcode → css-colors → no-js → arch → typecheck → test → build
3. Re-run `npm run check` pour confirmer.
4. Résumé : checks passés, erreurs corrigées, fichiers modifiés.

Ne pas modifier un test juste pour le faire passer — corriger le code source, sauf si le test est lui-même erroné.
