import type { AllocationPocketInput } from './types';

export function getAllocationPocketLabel(pocket: AllocationPocketInput): string {
  if (pocket.label?.trim()) return pocket.label.trim();
  const kindLabel = pocket.kind === 'distribution' ? 'Distribution' : 'Capitalisation';
  return `${kindLabel} ${pocket.durationYears} ans`;
}
