---
description: Travail ponctuel sur PDF pour SER1. Analyse documentaire sans dépendre de scripts absents.
---

# PDF

## Périmètre

Utiliser ce skill seulement si la tâche porte directement sur un fichier `.pdf`.

Pour SER1, un PDF est généralement une source utilisateur ou un rendu à vérifier, pas une source de vérité du produit. Les règles applicatives doivent rester dans le code et les docs versionnées.

## Règles

- Ne pas ajouter de dépendance ou de script PDF au repo sans besoin produit explicite.
- Si le PDF sert à valider un export, remonter la correction dans le générateur concerné.
- Si le PDF est une source métier, citer précisément les pages/sections utilisées et distinguer source juridique, source commerciale et hypothèse utilisateur.
- Ne pas intégrer de contenu sensible dans le repo.

## Validation

- Pour une analyse : fournir les constats avec pages quand elles sont disponibles.
- Pour une modification indirecte d'export : relancer les tests/snapshots concernés, puis `npm run check`.
