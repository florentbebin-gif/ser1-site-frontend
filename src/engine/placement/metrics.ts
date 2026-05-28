import type { SimulateCompleteResult } from './types';

type PlacementRoiTotals = Pick<
  SimulateCompleteResult['totaux'],
  'revenusNetsLiquidation' | 'capitalTransmisNet' | 'effortTotal'
>;

export function computePlacementRoi(totaux: PlacementRoiTotals): number {
  const totalGains = totaux.revenusNetsLiquidation + totaux.capitalTransmisNet;
  return totaux.effortTotal > 0 ? totalGains / totaux.effortTotal : 0;
}
