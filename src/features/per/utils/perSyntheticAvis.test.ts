import { describe, expect, it } from 'vitest';
import { projectionToAvisIrPlafonds } from './perSyntheticAvis';

describe('projectionToAvisIrPlafonds', () => {
  it('transforme le prochain avis projeté en avis IR utilisable pour l’année suivante', () => {
    expect(projectionToAvisIrPlafonds({
      nonUtiliseN2: 1000,
      nonUtiliseN1: 2000,
      nonUtiliseN: 3000,
      plafondCalculeN: 4000,
      plafondTotal: 10_000,
    }, 2025)).toEqual({
      nonUtiliseAnnee1: 1000,
      nonUtiliseAnnee2: 2000,
      nonUtiliseAnnee3: 3000,
      plafondCalcule: 4000,
      anneeRef: 2025,
    });
  });
});
