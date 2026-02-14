# Module Placement — Documentation Technique

> **État** : Refactorisation V2 (Feature + Engine Modular)
> **Dernière MAJ** : PR-4 (Engine Split) — 2026-02-14

---

## 1. Architecture

Le module Placement suit l'architecture **CreditV2** (separation of concerns stricte).

```
src/
├── features/placement/           # UI & Adapters (React)
│   ├── adapters/                 # Transformation données React -> Engine
│   │   └── toEngineProduct.js    # Adapter pur (Input -> EngineProduct)
│   ├── components/               # Composants UI découpés
│   │   ├── inputs/               # Sous-formulaires
│   │   ├── tables/               # Tableaux de résultats
│   │   ├── PlacementSimulatorPage.jsx  # Orchestrateur UI
│   │   └── VersementConfigModal.jsx
│   ├── index.ts                  # Point d'entrée feature
│   └── PlacementPage.tsx         # Lazy loading wrapper
│
├── engine/placement/             # Moteur de calcul pur (Zéro React)
│   ├── epargne.js                # Calcul phase épargne
│   ├── liquidation.js            # Calcul phase retraits
│   ├── transmission.js           # Calcul succession (DMTG)
│   ├── fiscalParams.js           # Normalisation settings fiscaux
│   ├── compare.js                # Comparateur
│   ├── simulateComplete.js       # Orchestrateur engine
│   └── shared.js                 # Constantes & Utils
│
└── engine/placementEngine.js     # FAÇADE STABLE (Legacy compat)
    # Ré-exporte uniquement les fonctions publiques du dossier placement/
```

## 2. Flux de données (Data Flow)

1.  **UI (React)** : `PlacementSimulatorPage` gère le state (inputs utilisateur).
2.  **Adapter** : `toEngineProduct.js` transforme le state React + `versementConfig` en objet produit standardisé pour le moteur.
3.  **Engine** : `placementEngine.js` (façade) -> `simulateComplete` exécute les calculs (Epargne -> Liquidation -> Transmission).
4.  **Display** : L'UI affiche les résultats retournés par le moteur.
5.  **Export** : Les builders PPTX/Excel consomment les mêmes objets résultats via la façade.

## 3. Gouvernance

*   **Zéro calcul métier dans React** : Tout calcul fiscal ou projection doit être dans `src/engine/placement/`.
*   **Façade stable** : `src/engine/placementEngine.js` ne doit pas changer de signature. C'est le contrat pour les exports et l'UI.
*   **Fichiers < 500 lignes** : Les modules engine sont découpés par responsabilité (Epargne, Liquidation, etc.).
*   **Tests obligatoires** : Toute modification moteur nécessite une validation par Golden Cases.

## 4. Tests & Validation

### Unitaires & Parité
*   `src/features/placement/__tests__/toEngineProduct.test.ts` : Vérifie que la transformation React -> Engine est fidèle à l'ancien code inline (parity check).
*   `src/engine/__tests__/extractFiscalParams.test.ts` : Vérifie la récupération des règles fiscales.

### Golden Cases (Non-régression globale)
*   `src/engine/__tests__/goldenCases.test.ts` : Exécute des scénarios complets (inputs JSON -> outputs snapshot).
*   **Commande** : `npm test src/engine/__tests__/goldenCases.test.ts`

### Smoke Tests Exports
*   Vérifier manuellement `/sim/placement` -> Export Excel / PPTX.
*   (Automatisé en partie via `npm run check` sur la structure).

## 5. Checklist Développeur (PR-5 Cutover)

Pour finaliser la migration (PR-5) :

1.  [ ] **Basculer routes** : Vérifier que `/sim/placement` pointe bien sur `PlacementPage.tsx` (déjà fait PR-1).
2.  [ ] **Cleanup Legacy** : Supprimer `src/pages/PlacementV2.jsx` (wrapper temporaire) une fois que tout passe par la feature.
3.  [ ] **Vérifier Imports** : Grep `src/engine/placementEngine` pour s'assurer que tous les consommateurs utilisent la façade.
4.  [ ] **Check Exports** : Générer un PPTX et un Excel pour valider qu'ils ne sont pas cassés par le refactor.
5.  [ ] **Validation** : `npm run check` doit être vert.
