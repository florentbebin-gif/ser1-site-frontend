# Images de chapitre PPTX (bibliothèque)

Ce dossier est une **bibliothèque d'images de chapitre** utilisée par le générateur PPTX côté navigateur.

- Conserver tous les fichiers `ch-01.png` .. `ch-09.png` (même s'ils ne sont pas référencés par les presets actuels).
- Format : PNG (préféré pour PPTX) ; garder la nomenclature à 2 chiffres (`ch-01.png`, ...).
- Toute modification doit préserver la qualité de rendu PPTX (pas d'artefacts visibles, conserver le ratio/coins prévus).

## Budgets de taille (baselines non bloquantes)

- Cible : **<= 1,2 Mo par image**
- Alerte : **> 1,6 Mo par image**
- Cible : **<= 9 Mo total** pour ce dossier
- Alerte : **> 12 Mo total** pour ce dossier

## Vérification (PowerShell)

```powershell
Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Sort-Object Length -Descending |
  Select-Object Name,Length

(Get-ChildItem public\pptx\chapters\ch-*.png -File |
  Measure-Object -Property Length -Sum).Sum
```
