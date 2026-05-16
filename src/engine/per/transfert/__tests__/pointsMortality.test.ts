import { describe, expect, it } from 'vitest';

import { PREFON_2025 } from '@/data/basecg';
import { computePrefonRente } from '../pointsMortality';

describe('computePrefonRente', () => {
  it('calcule une rente Prefon a partir des points saisis', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 1_000,
      capitalNet: 0,
      acquisitionAge: 45,
      liquidationAge: 64,
      reversionRate: 0,
    });

    expect(result.pointsRetenus).toBe(1_000);
    expect(result.renteAnnuelleBrute).toBeCloseTo(1_267.2936);
    expect(result.renteMensuelleBrute).toBeCloseTo(105.6078);
  });

  it('convertit un capital en points lorsque le nombre de points est absent', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 0,
      capitalNet: 100_000,
      acquisitionAge: 60,
      liquidationAge: 64,
      reversionRate: 0,
    });

    expect(result.pointsRetenus).toBeCloseTo(51_511.8735);
    expect(result.renteAnnuelleBrute).toBeCloseTo(65_280.6676);
  });
});
