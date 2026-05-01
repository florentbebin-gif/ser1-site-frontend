---
description: Travail PPTX pour SER1. Priorité au code d'export versionné plutôt qu'aux scripts office absents.
---

# PPTX

## Périmètre

Utiliser ce skill pour les demandes liées aux exports PowerPoint ou à un fichier `.pptx`.

Dans SER1, le flux principal est le code :
- contrat produit : `docs/GOUVERNANCE_EXPORTS.md`
- orchestrateur : `src/pptx/export/exportStudyDeck.ts`
- design system : `src/pptx/designSystem/serenity.ts`
- slides : `src/pptx/slides/`
- wrappers legacy isolés : `src/features/audit/export/exportAudit.ts`, `src/features/strategy/export/exportStrategy.ts`

## Règles

- Ne pas référencer les anciens guides PPTX ou scripts Office non versionnés dans SER1.
- Pour changer un export SER1, modifier le builder ou le wrapper, jamais un `.pptx` généré à la main.
- Garder les composants UI hors des générateurs PPTX directs : passer par un wrapper feature-owned.
- Si un `.pptx` externe est fourni, l'analyser avec les outils disponibles dans l'environnement courant et indiquer la méthode utilisée.

## Validation

- Pour un changement de code export : lancer les tests d'export ou snapshots concernés, puis `npm run check`.
- Pour une modification visuelle : vérifier au moins la génération sans erreur et, si possible, une inspection visuelle du rendu.
- Mettre à jour `docs/GOUVERNANCE_EXPORTS.md` si le contrat d'export change.
