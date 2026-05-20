---
name: check
description: "Lancer et corriger automatiquement le quality gate SER1 quand l'utilisateur demande une validation complète, une préparation avant commit/PR, ou quand une implémentation doit être vérifiée par npm run check."
user-invocable: false
---

Lancer le quality gate complet et corriger les erreurs.

1. `npm run check`
2. Fixer dans l'ordre : lint → fiscal-hardcode → css-colors → no-js → arch → typecheck → test → build
3. Re-run `npm run check` pour confirmer.
4. Résumé : checks passés, erreurs corrigées, fichiers modifiés.

Ne pas modifier un test juste pour le faire passer — corriger le code source, sauf si le test est lui-même erroné.
