import { describe, expect, it } from 'vitest';
import { hasAvisIrDeclarant, hasAvisIrPlafondsData, sumAvisIrPlafonds } from './perAvisIrPlafonds';

describe('perAvisIrPlafonds', () => {
  it('additionne les reliquats et le plafond calculé', () => {
    expect(sumAvisIrPlafonds({
      nonUtiliseAnnee1: 1000,
      nonUtiliseAnnee2: 2000,
      nonUtiliseAnnee3: 3000,
      plafondCalcule: 4000,
      anneeRef: 2025,
    })).toBe(10000);
  });

  it('détecte uniquement un avis IR conjoint significatif', () => {
    expect(hasAvisIrPlafondsData(null)).toBe(false);
    expect(hasAvisIrPlafondsData({
      nonUtiliseAnnee1: 0,
      nonUtiliseAnnee2: 0,
      nonUtiliseAnnee3: 0,
      plafondCalcule: 0,
      anneeRef: 2025,
    })).toBe(false);
    expect(hasAvisIrPlafondsData({
      nonUtiliseAnnee1: 0,
      nonUtiliseAnnee2: 0,
      nonUtiliseAnnee3: 0,
      plafondCalcule: 1,
      anneeRef: 2025,
    })).toBe(true);
  });

  it('considère un avis IR D2 saisi comme un signal de conjoint même à zéro', () => {
    expect(hasAvisIrDeclarant(null)).toBe(false);
    expect(hasAvisIrDeclarant({
      nonUtiliseAnnee1: 0,
      nonUtiliseAnnee2: 0,
      nonUtiliseAnnee3: 0,
      plafondCalcule: 0,
      anneeRef: 2025,
    })).toBe(true);
  });
});
