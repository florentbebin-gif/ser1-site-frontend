function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computeCumulativeRent(
  annualRent: number,
  annualRevaluationRate: number,
  years: number,
): number {
  let total = 0;
  for (let index = 0; index < Math.max(0, years); index += 1) {
    total += positive(annualRent) * (1 + annualRevaluationRate) ** index;
  }
  return total;
}
