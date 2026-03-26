# SUCCESSION FINAL VALIDATION

## But
Consolider l'etat final de la trajectoire `PR-31` a `PR-33`:
- recompenses / creances entre masses
- passif affecte
- documentation finale
- export des hypotheses retenues

## Verification repo
- gate complete: `npm run check`
- tests succession critiques:
  - `src/features/succession/__tests__/successionAssetValuation.test.ts`
  - `src/features/succession/__tests__/successionChainage.test.ts`
  - `src/features/succession/__tests__/scSuccessionSummaryPanel.test.tsx`
  - `src/features/succession/__tests__/scDeathTimelinePanel.test.tsx`
  - `src/features/succession/__tests__/successionExport.test.ts`

## Capacites validees
- `interMassClaims` est persiste dans le draft `v26`, configurable dans `DispositionsModal.tsx` et relu par le moteur succession.
- `successionInterMassClaims.ts` applique les transferts entre masses avec plafond sur l'actif disponible et warnings explicites.
- `affectedLiabilities` est derive du rattachement par `pocket` des passifs detailles et restitue comme `passif affecte`.
- la synthese, la chronologie, le PPTX et le XLSX succession restituent ces informations.
- les hypotheses retenues sont derivees a partir du snapshot fiscal et des warnings, puis exportees dans l'UI et les livrables.

## Surfaces a verifier manuellement
- UI succession:
  - ouvrir `+ Dispositions`
  - ajouter une recompense ou une creance entre masses
  - verifier la synthese et la chronologie
- exports:
  - lancer un export PPTX succession et verifier la slide `Hypotheses retenues`
  - lancer un export XLSX succession et verifier l'onglet `Hypotheses`

## Limites conservees
- les recompenses / creances entre masses restent une modelisation simplifiee par transferts entre poches, sans preuve documentaire automatique ni liquidation notariale exhaustive
- le passif affecte reste deduit a partir du rattachement de `pocket` des passifs detailles; il ne remplace pas une qualification juridique dossier par dossier
- les hypotheses exportees explicitent ces simplifications mais ne transforment pas le simulateur en outil notarial exhaustif
