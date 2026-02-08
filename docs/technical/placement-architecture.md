# Architecture du simulateur de placement

> Documentation technique de l'architecture modulaire de `PlacementV2.jsx` après refactoring (Phase 3).

---

## Vue d'ensemble

```
src/pages/
├── PlacementV2.jsx              ← Orchestrateur (1 047 lignes)
├── Placement.css
└── placement/
    ├── components/
    │   ├── inputs.jsx           ← Composants de saisie
    │   ├── tables.jsx           ← CollapsibleTable, AllocationSlider
    │   └── VersementConfigModal.jsx  ← Modal paramétrage versements
    └── utils/
        ├── formatters.js        ← Fonctions de formatage (euro, %, PS)
        ├── normalizers.js       ← Constants DEFAULT_* et normalisation
        ├── placementExcelExport.js  ← Construction XML Excel
        └── tableHelpers.jsx     ← Colonnes, filtrage, renderers
```

---

## Modules

### `PlacementV2.jsx` — Orchestrateur

Rôle : state management, calculs (via `useMemo`), et assemblage JSX.

- **State** : `client`, `products[2]`, `liquidation`, `transmission`, `step`
- **Calcul** : appelle `simulateComplete()` + `compareProducts()` du moteur
- **Persistance** : `sessionStorage` + save/load fichier JSON
- **Export** : délègue à `exportPlacementExcel()`

### `formatters.js` — Fonctions de formatage

| Export | Description |
|--------|------------|
| `fmt(n)` | Nombre entier formaté FR (`1 234`) |
| `euro(n)` | Montant en euros (`1 234 €`) |
| `shortEuro(v)` | Montant compact (`1,2 M€`, `500 k€`) |
| `formatPercent(v)` | Pourcentage (`30 %`, `12,50 %`) |
| `formatDmtgRange(from, to)` | Plage DMTG (`0 € → 8 072 €`) |
| `formatPsApplicability(ps)` | PS applicable ? (`Oui` / `Non`) |
| `formatPsMontant(ps, fmt)` | Montant PS ou `—` |
| `formatPsNote(ps)` | Note PS ou `—` |
| `getPsAssietteNumeric(ps)` | Assiette PS (nombre) |
| `getPsTauxNumeric(ps)` | Taux PS (nombre) |
| `getPsMontantNumeric(ps)` | Montant PS (nombre) |

### `normalizers.js` — Constants et normalisation

**Constants** : `EPSILON`, `DEFAULT_PRODUCT`, `DEFAULT_CLIENT`, `DEFAULT_LIQUIDATION`, `DEFAULT_TRANSMISSION`, `DEFAULT_DMTG_RATE`, `BENEFICIARY_OPTIONS`, `DEFAULT_STATE`.

| Export | Description |
|--------|------------|
| `normalizeProduct(p)` | Fusionne avec `DEFAULT_PRODUCT` + normalise `versementConfig` |
| `sanitizeStep(step)` | Valide l'étape courante |
| `normalizeLoadedState(payload)` | Normalise un état chargé depuis fichier |
| `buildPersistedState(state)` | Extrait les champs persistables |
| `getRendementLiquidation(product)` | Rendement pour la phase liquidation |
| `buildDmtgOptions(scale)` | Options DMTG depuis le barème fiscal |
| `buildCustomDmtgOption(value)` | Option DMTG personnalisée |
| `withReinvestCumul(rows)` | Ajoute `cumulReinvestissement` aux lignes |

### `inputs.jsx` — Composants de saisie

| Composant | Props | Description |
|-----------|-------|------------|
| `InputEuro` | `value, onChange, label, disabled` | Saisie montant en euros |
| `InputPct` | `value, onChange, label, disabled` | Saisie pourcentage (0–100 %) |
| `InputNumber` | `value, onChange, label, unit, min, max, inline` | Saisie numérique avec unité |
| `Select` | `value, onChange, options, label` | Menu déroulant |
| `Toggle` | `checked, onChange, label` | Checkbox stylée |

### `tables.jsx` — Composants tableau

| Composant | Description |
|-----------|------------|
| `CollapsibleTable` | Tableau dépliable avec compteur d'années |
| `AllocationSlider` | Slider capitalisation / distribution (SCPI = 100% distrib fixe) |

### `VersementConfigModal.jsx` — Modal versements

Modal complète pour paramétrer :
- **Versement initial** : montant, frais d'entrée, allocation
- **Versement annuel** : montant, frais, allocation, options PER (garantie bonne fin, exonération cotisations)
- **Versements ponctuels** : ajout/suppression dynamique
- **Capitalisation** : rendement annuel net de FG
- **Distribution** : rendement, taux de distribution, durée produit, délai jouissance, stratégie

### `placementExcelExport.js` — Export Excel

| Export | Description |
|--------|------------|
| `buildPlacementExcelXml(state, results)` | Construit le XML Excel complet (pure function) |
| `exportPlacementExcel(state, results)` | Déclenche le téléchargement |

Feuilles générées : Paramètres, Épargne P1, Épargne P2, Liquidation P1, Liquidation P2, Transmission, Synthèse.

### `tableHelpers.jsx` — Helpers tableau

| Export | Description |
|--------|------------|
| `columnResolvers` | Map colonne → accesseur de donnée |
| `baseEpargneColumns` | Liste complète des colonnes épargne |
| `isColumnRelevant(rows, col)` | Colonne pertinente si données > ε |
| `getRelevantColumnsEpargne(rows, cols, showAll)` | Filtre colonnes épargne |
| `getRelevantColumns(rows, cols, showAll)` | Filtre colonnes liquidation |
| `buildColumns(produit)` | Colonnes liquidation selon enveloppe |
| `getBaseColumnsForProduct(produit)` | Colonnes épargne selon PER/garantie |
| `renderEpargneCell(col, row, produit)` | Rendu JSX d'une cellule épargne |
| `renderEpargneRow(produit, cols)` | Rendu JSX d'une ligne épargne |

---

## Dépendances entre modules

```
PlacementV2.jsx
├── formatters.js          (euro, shortEuro, formatPsMontant)
├── normalizers.js         (DEFAULT_STATE, buildDmtgOptions, ...)
│   └── formatters.js      (formatPercent, formatDmtgRange)
├── inputs.jsx
│   └── formatters.js      (fmt)
├── tables.jsx             (aucune dépendance interne)
├── VersementConfigModal.jsx
│   ├── inputs.jsx         (InputEuro, InputPct, InputNumber)
│   └── tables.jsx         (AllocationSlider)
├── placementExcelExport.js
│   └── formatters.js      (PS formatters)
└── tableHelpers.jsx
    ├── formatters.js      (euro)
    └── normalizers.js     (EPSILON)
```

---

## Moteur de calcul

Le moteur reste dans `src/engine/placementEngine.js` (non modifié par ce refactoring).

| Fonction | Description |
|----------|------------|
| `simulateComplete(product, client, liquidation, transmission, fiscal)` | Simulation complète : épargne + liquidation + transmission |
| `compareProducts(result1, result2)` | Comparaison de deux produits avec deltas |
| `ENVELOPE_LABELS` | Labels des enveloppes (AV, PER, CTO, PEA, SCPI) |
