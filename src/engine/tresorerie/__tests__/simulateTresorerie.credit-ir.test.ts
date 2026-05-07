/**
 * Tests golden du moteur trésorerie société IS.
 */

import { describe, it, expect } from 'vitest';
import { calculCreditIR } from '../calculCreditIR';
import { PARAMS_STD } from './simulateTresorerie.fixtures';

describe('calculCreditIR — invariant 3', () => {
  it('Dividendes bruts nécessaires = annuité / (1 − pfuTotal)', () => {
    const pocket = { actif: true, capital: 120000, taux: 0.04, dureeMois: 240 };
    const r = calculCreditIR(pocket, PARAMS_STD, 1);
    expect(r.dividendesBrutsDemandes).toBeCloseTo(r.annuite / (1 - PARAMS_STD.pfuTotal), 2);
  });

  it('Crédit terminé → dividendes = 0', () => {
    const pocket = { actif: true, capital: 10000, taux: 0.04, dureeMois: 12 };
    const r = calculCreditIR(pocket, PARAMS_STD, 2); // Année 2 après crédit 1 an
    expect(r.dividendesBrutsDemandes).toBe(0);
  });
});
