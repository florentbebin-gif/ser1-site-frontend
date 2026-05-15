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
    expect(result.renteAnnuelleBrute).toBeCloseTo(105.6078);
  });

  it('convertit un capital en points lorsque le nombre de points est absent', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 0,
      capitalNet: 1_941.3,
      acquisitionAge: 60,
      liquidationAge: 60,
      reversionRate: 0,
    });

    expect(result.pointsRetenus).toBeCloseTo(700);
    expect(result.renteAnnuelleBrute).toBeCloseTo(69.741);
  });
});
