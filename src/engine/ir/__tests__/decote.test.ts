import { describe, expect, it } from 'vitest';
import { computeDecote } from '../decote';

const CFG_2025 = {
  triggerCouple: 3191,
  triggerSingle: 1929,
  amountCouple: 1444,
  amountSingle: 873,
  ratePercent: 45.25,
};

describe('computeDecote', () => {
  it('retourne 0 si l\'IR brut dépasse le seuil (célibataire)', () => {
    const result = computeDecote({ isCouple: false, decoteYearCfg: CFG_2025, irBrutFoyer: 2000 });
    expect(result).toBe(0);
  });

  it('calcule la décote partielle (célibataire sous seuil)', () => {
    const result = computeDecote({ isCouple: false, decoteYearCfg: CFG_2025, irBrutFoyer: 1000 });
    // 873 - (45.25/100) * 1000 = 873 - 452.5 = 420.5
    expect(result).toBeCloseTo(420.5, 1);
  });

  it('calcule la décote couple', () => {
    const result = computeDecote({ isCouple: true, decoteYearCfg: CFG_2025, irBrutFoyer: 1500 });
    // 1444 - (45.25/100) * 1500 = 1444 - 678.75 = 765.25
    expect(result).toBeCloseTo(765.25, 1);
  });

  it('la décote ne dépasse jamais l\'IR brut', () => {
    const result = computeDecote({ isCouple: false, decoteYearCfg: CFG_2025, irBrutFoyer: 100 });
    // 873 - (45.25/100) * 100 = 873 - 45.25 = 827.75 → plafonné à 100
    expect(result).toBe(100);
  });

  it('retourne 0 si pas de config décote', () => {
    const result = computeDecote({ isCouple: false, decoteYearCfg: null, irBrutFoyer: 1000 });
    expect(result).toBe(0);
  });
});
