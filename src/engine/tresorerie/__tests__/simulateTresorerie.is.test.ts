/**
 * Tests golden du moteur trésorerie société IS.
 */

import { describe, it, expect } from 'vitest';
import { calculIS, calculBaseEtIS, calculResultatFiscalHolding } from '../calculIS';
import { PARAMS_STD } from './simulateTresorerie.fixtures';

describe('calculIS', () => {
  it('IS = 0 si base nulle', () => {
    expect(calculIS(0, PARAMS_STD)).toBe(0);
  });

  it('IS taux réduit seul (base ≤ seuil)', () => {
    // 20 000 × 15 % = 3 000
    expect(calculIS(20000, PARAMS_STD)).toBeCloseTo(3000, 2);
  });

  it('IS tranche réduite + tranche normale (base > seuil)', () => {
    // 42 500 × 15 % + 7 500 × 25 % = 6 375 + 1 875 = 8 250
    expect(calculIS(50000, PARAMS_STD)).toBeCloseTo(8250, 2);
  });

  it('IS = 0 si baseIS négative (invariant 6)', () => {
    expect(calculIS(-1000, PARAMS_STD)).toBe(0);
  });

  it('calculBaseEtIS — base IS clampée à 0', () => {
    const { baseIS, is } = calculBaseEtIS(-5000, PARAMS_STD);
    expect(baseIS).toBe(0);
    expect(is).toBe(0);
  });
});

describe('calculResultatFiscalHolding — mère-fille', () => {
  it('Sans holding : résultat fiscal = résultat comptable', () => {
    const r = calculResultatFiscalHolding(30000, 0, undefined, PARAMS_STD);
    expect(r.resultatFiscal).toBe(30000);
    expect(r.quotePartTaxable).toBe(0);
  });

  it('Holding inactif : résultat fiscal = résultat comptable', () => {
    const holding = {
      actif: false,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(30000, 10000, holding, PARAMS_STD);
    expect(r.resultatFiscal).toBe(30000);
  });

  it('IS mère-fille standard : QPFC 5 % de 10 000 = 500 taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    // Résultat fiscal = 0 + 10 000 × 5 % = 500
    expect(r.quotePartTaxable).toBeCloseTo(500, 2);
    expect(r.resultatFiscal).toBeCloseTo(500, 2);
    expect(r.dividendesFilialesExoneres).toBeCloseTo(9500, 2);
    // Résultat comptable = 0 + 10 000 = 10 000
    expect(r.resultatComptable).toBeCloseTo(10000, 2);
  });

  it('IS mère-fille groupe fiscal : QPFC 1 % de 10 000 = 100 taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: true,
      regimeGroupeFiscal: true,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    expect(r.quotePartTaxable).toBeCloseTo(100, 2);
    expect(r.resultatFiscal).toBeCloseTo(100, 2);
  });

  it('Holding sans éligibilité mère-fille : 100 % taxable', () => {
    const holding = {
      actif: true,
      regimeMereFilleEligible: false,
      regimeGroupeFiscal: false,
      tauxDetention: 90,
      dureeConservationTitresAns: 3,
      dividendesFiliales: 10000,
    };
    const r = calculResultatFiscalHolding(0, 10000, holding, PARAMS_STD);
    expect(r.quotePartTaxable).toBeCloseTo(10000, 2);
    expect(r.dividendesFilialesExoneres).toBe(0);
  });
});
