import type { PlacementProductDraft, PlacementSimulatorState } from './normalizers';

function getProductVersements(product: PlacementProductDraft | undefined): number {
  if (!product) return 0;
  const config = product.versementConfig;
  const ponctuels = config.ponctuels.reduce((sum, versement) => sum + versement.montant, 0);
  return config.initial.montant + config.annuel.montant + ponctuels;
}

export function hasPlacementSynthesisPrerequisites(state: PlacementSimulatorState): boolean {
  const hasAge = state.client.ageActuel !== null && state.client.ageActuel > 0;
  const products = state.compareEnabled ? state.products : state.products.slice(0, 1);
  const hasSignificantVersement = products.some((product) => getProductVersements(product) > 0);

  return hasAge && hasSignificantVersement;
}
