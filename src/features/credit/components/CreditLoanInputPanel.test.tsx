import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CreditLoanInputPanel } from './CreditLoanInputPanel';
import type { CreditCalcResult, CreditLoan, CreditState } from '../types';

const loan: CreditLoan = {
  capital: 100_000,
  duree: 120,
  taux: 0.02,
  tauxAssur: 0.001,
  quotite: 100,
  type: 'amortissable',
  startYM: '2026-05',
  assurMode: 'CRD',
};

const state: CreditState = {
  startYM: '2026-05',
  assurMode: 'CRD',
  creditType: 'amortissable',
  viewMode: 'mensuel',
  pret1: loan,
  pret2: { ...loan, capital: 50_000 },
  pret3: null,
  lisserPret1: false,
  lissageMode: 'mensu',
  activeTab: 0,
  touched: { capital: false, duree: false },
};

const calc = {
  hasPretsAdditionnels: true,
  pret1IsInfine: false,
  autresIsInfine: [false],
} as CreditCalcResult;

describe('CreditLoanInputPanel', () => {
  it('rend la carte de lissage avec le patron guide premium', () => {
    const html = renderToStaticMarkup(
      <CreditLoanInputPanel
        activeTab={0}
        activeLoan={{ data: loan, set: vi.fn() }}
        state={state}
        isExpert
        calc={calc}
        setGlobal={vi.fn()}
        formatTauxRaw={(value) => String(value ?? '')}
      />,
    );

    expect(html).toContain('premium-card premium-card--guide sim-card--guide cv-lissage-card');
    expect(html).toContain('cv-lissage-card__header sim-card__header sim-card__header--bleed');
    expect(html).toContain('cv-lissage-title sim-card__title sim-card__title-row');
    expect(html).toContain('Pilotez le lissage du prêt principal');
    expect(html).toContain('sim-card__icon');
  });
});
