import { describe, expect, it } from 'vitest';

import { PREFON_2025 } from '@/data/base-cg-retraite';
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
    expect(result.renteMensuelleBrute).toBeCloseTo(8.8007);
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
    expect(result.renteAnnuelleBrute).toBeCloseTo(5_440.0556);
  });

  it('utilise la valeur de service de la poche quand elle est fournie', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 1_000,
      capitalNet: 0,
      acquisitionAge: 45,
      liquidationAge: 60,
      reversionRate: 0,
      serviceValue: 0.10219,
    });

    expect(result.renteAnnuelleBrute).toBeCloseTo(102.19);
  });

  it('revalorise la valeur de service jusqu’à la liquidation', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 1_000,
      capitalNet: 0,
      acquisitionAge: 55,
      liquidationAge: 60,
      reversionRate: 0,
      serviceValue: 0.1,
      serviceRevaluationRate: 0.02,
    });

    expect(result.renteAnnuelleBrute).toBeCloseTo(110.4081);
  });

  it('applique le coefficient de réversion Préfon selon l’écart d’âge et le taux choisi', () => {
    const result = computePrefonRente({
      params: PREFON_2025,
      points: 1_000,
      capitalNet: 0,
      acquisitionAge: 45,
      liquidationAge: 60,
      reversionRate: 0.6,
      spouseAgeAtLiquidation: 57,
    });

    expect(result.renteAnnuelleBrute).toBeCloseTo(80.7003);
  });
});
