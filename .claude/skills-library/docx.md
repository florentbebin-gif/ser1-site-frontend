---
description: Travail ponctuel sur fichiers Word pour SER1. Ne référence aucun script absent du repo.
---

# DOCX

## Périmètre

Utiliser ce skill seulement si la tâche porte directement sur un fichier `.docx`.

Pour SER1, les livrables applicatifs sont pilotés par le code d'export, pas par une édition manuelle de fichiers Word. Si une demande concerne un livrable client généré par l'app, vérifier d'abord les générateurs dans `src/pptx/`, `src/utils/export/` ou la feature concernée.

## Règles

- Ne pas supposer l'existence de scripts `scripts/office/*` : ils ne sont pas versionnés dans SER1.
- Ne pas ajouter un fichier binaire généré au repo sans demande explicite.
- Si un `.docx` est fourni par l'utilisateur, l'inspecter avec les outils disponibles dans l'environnement courant, puis documenter la méthode utilisée.
- Pour une modification durable du produit, modifier le code source ou la doc de génération plutôt qu'un document exporté.

## Validation

- Si le fichier est seulement analysé : fournir les constats avec pages/sections quand elles sont disponibles.
- Si un document est modifié : produire une vérification visuelle ou structurelle adaptée à l'outil disponible.
- Si la modification touche le repo SER1 : lancer le contrôle pertinent, puis `npm run check` avant commit.
