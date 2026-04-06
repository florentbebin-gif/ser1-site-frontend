import { describe, expect, it } from 'vitest';
import { computeCEHR } from '../cehr';

const CEHR_BRACKETS = [
  { from: 250000, to: 500000, rate: 3 },
  { from: 500000, to: null, rate: 4 },
];

describe('computeCEHR', () => {
  it('retourne 0 si le RFR est sous le seuil', () => {
    const result = computeCEHR(CEHR_BRACKETS, 200000);
    expect(result.cehr).toBe(0);
  });

  it('calcule la CEHR pour un RFR dans la première tranche (3 %)', () => {
    const result = computeCEHR(CEHR_BRACKETS, 400000);
    // (400000 - 250000) * 3% = 150000 * 0.03 = 4500
    expect(result.cehr).toBe(4500);
    expect(result.cehrDetails.length).toBeGreaterThan(0);
  });

  it('calcule la CEHR pour un RFR couvrant les deux tranches', () => {
    const result = computeCEHR(CEHR_BRACKETS, 600000);
    // Tranche 1 : (500000 - 250000) * 3% = 7500
    // Tranche 2 : (600000 - 500000) * 4% = 4000
    // Total = 11500
    expect(result.cehr).toBe(11500);
  });

  it('retourne 0 si le barème est vide', () => {
    const result = computeCEHR([], 1000000);
    expect(result.cehr).toBe(0);
  });

  it('retourne 0 si le RFR est négatif', () => {
    const result = computeCEHR(CEHR_BRACKETS, -50000);
    expect(result.cehr).toBe(0);
  });
});
