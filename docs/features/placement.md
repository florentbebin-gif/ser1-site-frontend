# Module Placement — Source de vérité technique

## Scope

Ce document décrit l'organisation réelle du module Placement après le cutover vers `src/features/placement/`, avec séparation explicite entre code feature et héritage legacy encore utilisé.

## Arborescence (paths exacts)

### Feature UI/state/adapters

- `src/features/placement/PlacementPage.tsx`
- `src/features/placement/index.ts`
- `src/features/placement/components/PlacementSimulatorPage.jsx`
- `src/features/placement/adapters/toEngineProduct.js`
- `src/features/placement/__tests__/toEngineProduct.test.ts`

### Legacy encore consommé par la feature

- `src/pages/placement/components/inputs.jsx`
- `src/pages/placement/components/tables.jsx`
- `src/pages/placement/components/VersementConfigModal.jsx`
- `src/pages/Placement.css` (importé depuis la feature via `@/pages/Placement.css`)

### Engine Placement (métier pur)

- `src/engine/placement/epargne.js`
- `src/engine/placement/liquidation.js`
- `src/engine/placement/transmission.js`
- `src/engine/placement/fiscalParams.js`
- `src/engine/placement/compare.js`
- `src/engine/placement/simulateComplete.js`
- `src/engine/placement/shared.js`
- `src/engine/placementEngine.js` (façade stable)

## Flow fonctionnel

1. **UI** : route `/sim/placement` -> `PlacementPage` -> `PlacementSimulatorPage`.
2. **Saisie** : formulaires et tableaux (partiellement legacy) alimentent le state orchestrateur.
3. **Adapter** : `toEngineProduct.js` convertit les données UI vers le contrat moteur.
4. **Moteur** : appel via la façade `src/engine/placementEngine.js` (`simulateComplete`, `compareProducts`, etc.).
5. **Exports** : Excel/PPTX consomment les résultats de simulation issus du même contrat.

## Gouvernance Placement (obligatoire)

- **Zéro calcul métier dans React** : toute règle fiscale/projection doit vivre dans `src/engine/placement/*`.
- **Façade publique stable** : ne pas casser les signatures exportées par `src/engine/placementEngine.js`.
- **Fichiers < 500 lignes** : découper l'orchestrateur UI avant nouvelle croissance significative.
- **Dette connue** : cross-import CSS `@/pages/Placement.css` à résorber pendant le refactor P1-05.

## Ajouter un champ / une règle

### Ajouter un champ UI

1. Ajouter l'input côté UI (feature ou legacy encore branché selon la zone concernée).
2. Étendre le state de `PlacementSimulatorPage.jsx`.
3. Mapper le nouveau champ dans `src/features/placement/adapters/toEngineProduct.js`.
4. Vérifier que les vues résultats et exports (Excel/PPTX) restent cohérents.
5. Mettre à jour/ajouter test adapter (`toEngineProduct.test.ts`) si le contrat change.

### Ajouter une règle métier

1. Implémenter la règle dans `src/engine/placement/*` (jamais inline dans React).
2. Propager via la façade `src/engine/placementEngine.js` si la fonction publique évolue.
3. Vérifier l'impact sur exports et libellés de résultats.
4. Ajouter/adapter tests moteur et golden cases.

## Tests & validation

- `npm run check`
- Golden cases : `npx vitest run src/engine/__tests__/goldenCases.test.ts`
- Test ciblé adapter : `npx vitest run src/features/placement/__tests__/toEngineProduct.test.ts`
- Smoke manuel : `/sim/placement` -> calcul + exports (Excel/PPTX)

## Notes de reprise

- Le wrapper legacy `src/pages/PlacementV2.jsx` est supprimé et ne doit pas être réintroduit.
- Le point d'entrée officiel reste `src/features/placement/PlacementPage.tsx`.
- Priorité technique restante : découpe de `PlacementSimulatorPage.jsx` + suppression du cross-import CSS legacy.
