import type { CompareResult, SimulateCompleteResult } from '@/engine/placement/types';

// Type UI : permet `produit2: null` en mode projection 1 placement.
// Découplé de `CompareResult` engine, qui exige un produit 2 obligatoire.
export interface PlacementUiResults {
  produit1: SimulateCompleteResult;
  produit2: SimulateCompleteResult | null;
  deltas?: CompareResult['deltas'];
  meilleurEffort?: string;
  meilleurRevenus?: string;
  meilleurTransmission?: string;
}
