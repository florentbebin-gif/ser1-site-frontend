---
name: pptx
description: "Traiter automatiquement les demandes SER1 liées aux exports PowerPoint, fichiers .pptx, decks, slides ou livrables client PPTX. Prioriser le code d'export versionné src/pptx et les wrappers feature plutôt qu'une édition manuelle."
user-invocable: false
---

# PPTX

## Périmètre

Utiliser ce skill pour les demandes liées aux exports PowerPoint ou à un fichier `.pptx`.

Dans SER1, le flux principal est le code :

- contrat produit : `docs/GOUVERNANCE_EXPORTS.md`
- orchestrateur : `src/pptx/export/exportStudyDeck.ts`
- design system : `src/pptx/designSystem/serenity.ts`
- slides : `src/pptx/slides/`
- wrapper Strategy isolé : `src/features/strategy/export/exportStrategy.ts`
- `/audit` ne fournit plus de wrapper PPTX runtime.

## Règles

- Ne pas référencer les anciens guides PPTX ou scripts Office non versionnés dans SER1.
- Pour changer un export SER1, modifier le builder ou le wrapper, jamais un `.pptx` généré à la main.
- Garder les composants UI hors des générateurs PPTX directs : passer par un wrapper feature-owned.
- Si un `.pptx` externe est fourni, l'analyser avec les outils disponibles dans l'environnement courant et indiquer la méthode utilisée.

## Validation

- Pour un changement de code export : lancer les tests d'export ou snapshots concernés, puis `npm run check`.
- Pour une modification visuelle : vérifier au moins la génération sans erreur et, si possible, une inspection visuelle du rendu.
- Mettre à jour `docs/GOUVERNANCE_EXPORTS.md` si le contrat d'export change.
