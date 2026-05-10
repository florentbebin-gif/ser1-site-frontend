import type { AssociateRevenuePhaseSource } from '@/engine/tresorerie/types';

export const REVENUE_PHASE_SOURCE_LABELS: Record<AssociateRevenuePhaseSource, string> = {
  none: 'Aucune rémunération',
  holding: 'Holding',
  subsidiary: 'Filiale',
};

export function getRevenuePhaseSourceLabel(source: AssociateRevenuePhaseSource): string {
  return REVENUE_PHASE_SOURCE_LABELS[source];
}
