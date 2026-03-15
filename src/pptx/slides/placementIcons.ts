/**
 * Placement Synthesis Icons
 *
 * Maps KPI keys to business icons from the existing library.
 * Used by buildPlacementSynthesis.ts for the 4 KPI rows.
 */

import type { BusinessIconName } from '../../icons/business/businessIconLibrary';

export type PlacementKpiKey = 'effortTotal' | 'capitalAcquis' | 'revenusNets' | 'transmissionNette';

export const PLACEMENT_KPI_ICONS: Record<PlacementKpiKey, BusinessIconName> = {
  effortTotal: 'calculator',
  capitalAcquis: 'money',
  revenusNets: 'chart-up',
  transmissionNette: 'balance',
};

export const PLACEMENT_KPI_LABELS: Record<PlacementKpiKey, string> = {
  effortTotal: 'Effort réel',
  capitalAcquis: 'Capital acquis',
  revenusNets: 'Revenus nets',
  transmissionNette: 'Capital transmis',
};
