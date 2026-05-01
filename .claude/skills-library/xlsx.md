---
description: Travail XLSX/CSV pour SER1. Priorité aux builders d'export versionnés et aux tests.
---

# XLSX / CSV

## Périmètre

Utiliser ce skill pour les demandes liées aux fichiers `.xlsx`, `.xlsm`, `.csv` ou `.tsv`.

Dans SER1, le flux principal est le code :
- contrat produit : `docs/GOUVERNANCE_EXPORTS.md`
- builder XLSX partagé : `src/utils/export/xlsxBuilder.ts`
- fingerprint exports : `src/utils/export/exportFingerprint.ts`
- exports feature-owned : `src/features/*/export/`
- snapshots exports : `tests/snapshots/`

## Règles

- Ne pas supposer l'existence d'un script de recalcul ou d'un wrapper Office non versionné dans SER1.
- Pour changer un export SER1, modifier le builder ou l'export feature-owned, pas un fichier généré manuellement.
- Les hypothèses et warnings exportés doivent rester cohérents avec l'UI.
- Si un fichier externe est fourni, l'analyser avec les outils disponibles dans l'environnement courant et indiquer la méthode utilisée.

## Validation

- Pour un changement d'export : lancer le test d'export ou snapshot concerné, puis `npm run check`.
- Vérifier que les feuilles, entêtes et fingerprints attendus restent stables ou que le changement est explicitement assumé.
- Mettre à jour `docs/GOUVERNANCE_EXPORTS.md` si le contrat XLSX change.
