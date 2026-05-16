import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentType } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PerTransfertWizardSteps } from '../components/PerTransfertWizardSteps';
import { PerTransfertPivotTable } from '../components/PerTransfertPivotTable';
import type { PerTransfertResult } from '@/engine/per';

// ——— Tests composants purs ———

describe('PerTransfertWizardSteps', () => {
  const noop = vi.fn();
  const Wizard = PerTransfertWizardSteps as unknown as ComponentType<{
    step: 'contrat' | 'newper';
    step1Done: boolean;
    onStepChange: (_step: 'contrat' | 'newper') => void;
  }>;

  it('affiche seulement les 2 étapes aux libellés courts', () => {
    const html = renderToStaticMarkup(
      <Wizard step="contrat" step1Done={false} onStepChange={noop} />,
    );
    expect(html).toContain('Contrat actuel');
    expect(html).toContain('Nouveau PER');
    expect(html).not.toContain('Le contrat actuel');
    expect(html).not.toContain('Le nouveau PER');
    expect(html).not.toContain('Synth');
  });

  it('désactive seulement Nouveau PER quand le contrat actuel est incomplet', () => {
    const html = renderToStaticMarkup(
      <Wizard step="contrat" step1Done={false} onStepChange={noop} />,
    );
    const matches = html.match(/disabled/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('marque le bon onglet comme sélectionné via aria-selected', () => {
    const html = renderToStaticMarkup(
      <Wizard step="newper" step1Done onStepChange={noop} />,
    );
    expect(html).toContain('aria-selected="true"');
  });

  it('aucun bouton désactivé quand step1Done est true', () => {
    const html = renderToStaticMarkup(
      <Wizard step="contrat" step1Done onStepChange={noop} />,
    );
    expect(html).not.toContain('disabled');
  });
});

// ——— Résultat minimal pour PerTransfertPivotTable ———

function makeResult(overrides: Partial<PerTransfertResult> = {}): PerTransfertResult {
  return {
    compartment: 'C1',
    currentConversionRate: 0.03,
    capitalAfterTransfer: 97000,
    capitalAtLiquidation: 110000,
    currentRent: {
      grossAnnualRent: 3000,
      netAnnualRent: 2200,
      fiscal: {
        family: 'RVTG',
        taxableFraction: 1,
        taxableIncome: 2700,
        incomeTax: 810,
        socialContributions: 0,
        netAnnualRent: 2200,
      },
      cumulativeToShortHorizon: 22000,
      cumulativeToLongHorizon: 44000,
    },
    keepScenario: {
      capitalAtLiquidation: 97000,
      currentRent: {
        grossAnnualRent: 3000,
        netAnnualRent: 2200,
        netMonthly: 2200 / 12,
        fiscal: {
          family: 'RVTG',
          taxableFraction: 1,
          taxableIncome: 2700,
          incomeTax: 810,
          socialContributions: 0,
          netAnnualRent: 2200,
        },
        cumulativeToShortHorizon: 22000,
        cumulativeToLongHorizon: 44000,
      },
    },
    newPerRent: {
      capitalNet: 110000,
      annuityFactor: 15,
      grossAnnualRent: 2800,
      netAnnualRent: 2400,
      monthlyRent: 200,
      apparentRate: 0.025,
    },
    newPerFiscal: {
      family: 'RVTG',
      taxableFraction: 1,
      taxableIncome: 2520,
      incomeTax: 756,
      socialContributions: 0,
      netAnnualRent: 2400,
    },
    capitalExit: {
      shareRate: 0,
      capitalConvertedToRent: 110000,
      capitalAvailableAtLiquidation: 0,
      unique: {
        available: false,
        capital: 0,
        gains: 0,
        incomeTax: 0,
        socialContributions: 0,
        netPS: 0,
        netIRPS: 0,
      },
      shortHorizon: {
        horizonAge: 80,
        years: 16,
        annualWithdrawal: 0,
        annualNetWithdrawal: 0,
        cumulativeWithdrawals: 0,
        cumulativeNetWithdrawals: 0,
        residualCapital: 0,
      },
      longHorizon: {
        horizonAge: 90,
        years: 26,
        annualWithdrawal: 0,
        annualNetWithdrawal: 0,
        cumulativeWithdrawals: 0,
        cumulativeNetWithdrawals: 0,
        residualCapital: 0,
      },
      withoutWithdrawalToLongHorizon: 0,
    },
    smallAnnuityCapitalExitEligible: false,
    warnings: [],
    ...overrides,
  };
}

describe('PerTransfertPivotTable', () => {
  it('affiche les sections Conserver et Transférer', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('Conserver le contrat actuel');
    expect(html).toContain('Transférer vers le nouveau PER');
  });

  it('affiche la rente nette du contrat actuel', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('2');
    expect(html).toContain('200');
  });

  it("affiche l'âge de liquidation dans l'en-tête", () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('64 ans');
  });

  it('affiche les horizons court et long', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('80 ans');
    expect(html).toContain('90 ans');
  });

  it('affiche — pour le capital unique quand non disponible', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('—');
  });

  it('affiche + quand le PER est meilleur (gain positif)', () => {
    const result = makeResult({
      currentRent: {
        grossAnnualRent: 1800,
        netAnnualRent: 1500,
        fiscal: {
          family: 'RVTG',
          taxableFraction: 1,
          taxableIncome: 1620,
          incomeTax: 486,
          socialContributions: 0,
          netAnnualRent: 1500,
        },
        cumulativeToShortHorizon: 15000,
        cumulativeToLongHorizon: 30000,
      },
    });
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={result} liquidationAge={64} />,
    );
    expect(html).toContain('+');
  });

  it('affiche la ligne Gain PER', () => {
    const html = renderToStaticMarkup(
      <PerTransfertPivotTable result={makeResult()} liquidationAge={64} />,
    );
    expect(html).toContain('Gain PER vs contrat actuel');
  });
});
