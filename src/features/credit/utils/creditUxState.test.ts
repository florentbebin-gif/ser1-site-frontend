import { describe, expect, it } from 'vitest';
import { getCreditActiveSynthesis, hasCreditSynthesis } from './creditUxState';
import type { CreditSynthesis } from '../types';

const emptySynthesis: CreditSynthesis = {
  mensualiteTotaleM1: 0,
  primeAssMensuelle: 0,
  totalInterets: 0,
  totalAssurance: 0,
  coutTotalCredit: 0,
  capitalEmprunte: 0,
  diffDureesMois: 0,
};

const filledSynthesis: CreditSynthesis = {
  ...emptySynthesis,
  mensualiteTotaleM1: 980,
  capitalEmprunte: 180000,
};

describe('creditUxState', () => {
  it('utilise la synthèse du prêt actif en mode expert multi-prêts', () => {
    const active = getCreditActiveSynthesis({
      isExpert: true,
      hasAdditionalLoans: true,
      activeTab: 1,
      perLoanSyntheses: [filledSynthesis, emptySynthesis, null],
      totalSynthesis: filledSynthesis,
    });

    expect(active).toBe(emptySynthesis);
    expect(hasCreditSynthesis(active)).toBe(false);
  });

  it('revient à la synthèse totale quand aucun prêt additionnel n’est actif', () => {
    const active = getCreditActiveSynthesis({
      isExpert: true,
      hasAdditionalLoans: false,
      activeTab: 1,
      perLoanSyntheses: [null, emptySynthesis, null],
      totalSynthesis: filledSynthesis,
    });

    expect(active).toBe(filledSynthesis);
    expect(hasCreditSynthesis(active)).toBe(true);
  });
});
