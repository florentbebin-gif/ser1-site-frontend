import type { AvisIrPlafonds } from '@/engine/per';

export function sumAvisIrPlafonds(avis: AvisIrPlafonds | null | undefined): number {
  return (avis?.nonUtiliseAnnee1 ?? 0)
    + (avis?.nonUtiliseAnnee2 ?? 0)
    + (avis?.nonUtiliseAnnee3 ?? 0)
    + (avis?.plafondCalcule ?? 0);
}

export function hasAvisIrPlafondsData(avis: AvisIrPlafonds | null | undefined): boolean {
  return sumAvisIrPlafonds(avis) > 0;
}

export function hasAvisIrDeclarant(avis: AvisIrPlafonds | null | undefined): boolean {
  return avis != null;
}
