---
title: Export Fingerprint (P0-04)
---

# Export Fingerprint (P0-04)

Objectif: rendre les exports PPTX/Excel traçables avec une empreinte stable et vérifiable.

## Principe

On hashe un **manifest déterministe** (pas le binaire final), pour éviter les variations non métier.

- Entrée: objet JSON normalisé (clés triées, valeurs normalisées)
- Sortie: hash hex court (16 chars)
- Implémentation: `src/utils/exportFingerprint.ts`

## Ce qu’on hash

### PPTX

Manifest structurel minimal:

- `filename` normalisé (dates/temps neutralisés)
- `cover` (titre/sous-titre)
- `options` stables (`locale`, `showSlideNumbers`)
- `slidesCount` + `slideTypes`
- champs métier clés extraits des slides (borné)
- `palette` (`c1..c10` normalisées)
- `logoHash`
  - data URI/base64: hash du string
  - URL: hash de l’URL
  - aucun fetch réseau

Branchement:

- `src/pptx/export/exportStudyDeck.ts` (point central `exportAndDownloadStudyDeck`)

### Excel OOXML (.xlsx)

Manifest structurel minimal:

- `sheetCount`
- `sheets[]` avec:
  - `name`
  - `rowCount`
  - `colCount`
  - `keyCells` échantillonnées (max 50)
- `headerFill`, `sectionFill`

Branchement:

- `src/utils/xlsxBuilder.ts` (`buildXlsxBlob`)

### Excel XML legacy (.xls)

Manifest structurel minimal:

- `filename` normalisé
- `sheetCount`
- `sheets[]` avec:
  - `name`
  - `rowCount`
  - premières valeurs de cellules (échantillon borné)

Branchement:

- `src/utils/exportExcel.js` (`downloadExcel`)

## Ce qu’on exclut

- timestamps runtime (`generatedAt`, `savedAt`, etc.)
- IDs aléatoires / object URLs
- métadonnées ZIP/OOXML non métier
- ordre non déterministe

## Vérification en dev

Logs **dev-only** (`import.meta.env.DEV`):

- `[ExportFingerprint][PPTX]`
- `[ExportFingerprint][XLSX]`
- `[ExportFingerprint][XLS-XML]`

Aucun global debug n’est exposé.

## Tests

- `src/utils/exportFingerprint.test.ts`
  - même manifest => même hash
  - variation d’un champ clé => hash différent

## Extension du manifest (guideline)

1. Ajouter uniquement des champs métier stables.
2. Garder le manifest borné (pas de scan complet des cellules/slides).
3. Neutraliser les éléments temporels/volatils.
4. Étendre les tests déterminisme/variation pour chaque nouveau champ clé.
