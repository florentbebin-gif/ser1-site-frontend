# Module IR — Source de vérité technique

## Scope

Ce document décrit l'organisation et le fonctionnement du module IR après refactor P1-04/P1-05, avec les règles de gouvernance à respecter pour toute évolution.

## Arborescence (paths exacts)

### Feature UI/state/exports

- `src/features/ir/IrPage.tsx`
- `src/features/ir/index.ts`
- `src/features/ir/components/IrSimulatorPage.jsx`
- `src/features/ir/components/IrSimulatorContainer.jsx`
- `src/features/ir/components/IrFormSection.jsx`
- `src/features/ir/components/IrSidebarSection.jsx`
- `src/features/ir/components/IrDetailsSection.jsx`
- `src/features/ir/components/IrDisclaimer.jsx`
- `src/features/ir/components/IrSimulator.css`
- `src/features/ir/hooks/useIr.ts`
- `src/features/ir/hooks/useIrExportHandlers.js`
- `src/features/ir/__tests__/irExport.test.ts`

### Engine IR

- `src/engine/ir/adjustments.js`
- `src/engine/ir/__tests__/adjustments.test.ts`

## Flow fonctionnel

1. **UI**: route `/sim/ir` -> `IrPage` -> `IrSimulatorPage` -> `IrSimulatorContainer`.
2. **State/calcul UI**: le container orchestre les sections et s'appuie sur les helpers engine IR.
3. **Hook module**: `useIr.ts` encapsule state/persistence/calculs IR pour usages modulaires (même contrat de calcul que le container).
4. **Moteur**: `src/engine/ir/adjustments.js` porte les ajustements (abattements, parts, déductions, personnes à charge).
5. **Exports**:
   - PPTX via `buildIrStudyDeck` + pipeline `exportStudyDeck`
   - Excel via `xlsxBuilder`
   - smoke test export: `src/features/ir/__tests__/irExport.test.ts`

## Gouvernance IR (obligatoire)

- **Zéro calcul fiscal dans React**: toute formule métier va dans `src/engine/ir/*`.
- **Fichiers < 500 lignes**: découper en composants/hooks avant de dépasser.
- **Ajout d'un nouveau champ UI**:
  1) type/state (container/hook),
  2) wiring composant,
  3) export mapping si nécessaire,
  4) tests.
- **Ajout d'une nouvelle règle fiscale**:
  1) implémenter dans `src/engine/ir/*`,
  2) tests unitaires engine,
  3) brancher UI sans logique inline.

## Tests & validation

### Golden cases concernés

- `src/engine/__tests__/goldenCases.test.ts` (inclut les cas IR du corpus golden).

### Suite à exécuter

- `npm run check`
- ciblé IR (optionnel rapide): `npx vitest run src/engine/ir/__tests__/adjustments.test.ts src/features/ir/__tests__/irExport.test.ts`

## Checklist dev IR (rapide, 5 points)

1. Vérifier `/sim/ir` charge sans erreur.
2. Saisir 2-3 entrées et confirmer que le résultat (`ir-irnet-value`) évolue.
3. Ouvrir le menu export (Excel/PPTX visibles).
4. Lancer tests IR ciblés (engine + export smoke).
5. Lancer `npm run check` avant merge.
