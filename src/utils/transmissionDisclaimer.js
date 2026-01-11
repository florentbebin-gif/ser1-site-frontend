export function computeDmtgConsumptionRatio(assietteTotale, trancheWidth) {
  if (typeof assietteTotale !== 'number' || assietteTotale <= 0) return 0;
  if (typeof trancheWidth !== 'number' || trancheWidth <= 0) return 0;
  return assietteTotale / trancheWidth;
}

export function shouldShowDmtgDisclaimer(assietteTotale, trancheWidth, threshold = 0.5) {
  const ratio = computeDmtgConsumptionRatio(assietteTotale, trancheWidth);
  if (ratio === 0) return false;
  return ratio > threshold;
}
