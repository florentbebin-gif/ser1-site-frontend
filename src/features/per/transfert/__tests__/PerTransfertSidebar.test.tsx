import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PerTransfertSidebar } from '../components/PerTransfertSidebar';
import type {
  PerTransfertCapitalFiscalResult,
  PerTransfertFiscalResult,
  PerTransfertResult,
} from '@/engine/per';

function makeFiscalResult(
  overrides: Partial<PerTransfertFiscalResult> = {},
): PerTransfertFiscalResult {
  const grossAnnualRent = overrides.grossAnnualRent ?? overrides.netAnnualRent ?? 0;
  const socialContributions = overrides.socialContributions ?? 0;
  const incomeTax = overrides.incomeTax ?? 0;
  const netOfAllTaxes =
    overrides.netOfAllTaxes ??
    overrides.netAnnualRent ??
    Math.max(0, grossAnnualRent - incomeTax - socialContributions);

  return {
    family: 'RVTG',
    taxableFraction: 1,
    taxableIncome: grossAnnualRent,
    grossAnnualRent,
    netOfSocialContributions:
      overrides.netOfSocialContributions ?? Math.max(0, grossAnnualRent - socialContributions),
    netOfAllTaxes,
    incomeTax,
    socialContributions,
    netAnnualRent: netOfAllTaxes,
    ...overrides,
  };
}

function makeCapitalFiscalResult(
  overrides: Partial<PerTransfertCapitalFiscalResult> = {},
): PerTransfertCapitalFiscalResult {
  const capital = overrides.capital ?? 0;
  const socialContributions = overrides.socialContributions ?? 0;
  const incomeTax = overrides.incomeTax ?? 0;
  const netOfAllTaxes =
    overrides.netOfAllTaxes ??
    overrides.netIRPS ??
    Math.max(0, capital - socialContributions - incomeTax);
  const netOfSocialContributions =
    overrides.netOfSocialContributions ??
    overrides.netPS ??
    Math.max(0, capital - socialContributions);

  return {
    available: false,
    capital,
    gains: 0,
    netOfSocialContributions,
    netOfAllTaxes,
    netOfAllTaxesWithQuotient: overrides.netOfAllTaxesWithQuotient ?? netOfAllTaxes,
    incomeTax,
    incomeTaxAtBareme: overrides.incomeTaxAtBareme ?? incomeTax,
    incomeTaxWithQuotient: overrides.incomeTaxWithQuotient ?? incomeTax,
    socialContributions,
    netPS: netOfSocialContributions,
    netIRPS: netOfAllTaxes,
    ...overrides,
  };
}

function makeResult(overrides: Partial<PerTransfertResult> = {}): PerTransfertResult {
  return {
    compartment: 'C1',
    currentConversionRate: 0.03,
    capitalAfterTransfer: 97000,
    capitalAtLiquidation: 110000,
    currentRent: {
      grossAnnualRent: 3000,
      netAnnualRent: 2200,
      fiscal: makeFiscalResult({
        grossAnnualRent: 3000,
        taxableIncome: 2700,
        incomeTax: 810,
        netAnnualRent: 2200,
      }),
      cumulativeToShortHorizon: 22000,
      cumulativeToLongHorizon: 44000,
    },
    keepScenario: {
      capitalAtLiquidation: 97000,
      currentRent: {
        grossAnnualRent: 3000,
        netAnnualRent: 2200,
        netMonthly: 2200 / 12,
        fiscal: makeFiscalResult({
          grossAnnualRent: 3000,
          taxableIncome: 2700,
          incomeTax: 810,
          netAnnualRent: 2200,
        }),
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
    newPerFiscal: makeFiscalResult({
      grossAnnualRent: 2800,
      taxableIncome: 2520,
      incomeTax: 756,
      netAnnualRent: 2400,
    }),
    capitalExit: {
      shareRate: 0,
      capitalConvertedToRent: 110000,
      capitalAvailableAtLiquidation: 0,
      unique: makeCapitalFiscalResult(),
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

describe('PerTransfertSidebar', () => {
  it('affiche un état d’attente sobre quand aucun contrat n’est prêt', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult()}
        selectedContract={null}
        typeContrat="MADELIN"
        subscriptionDate=""
        step2Done={false}
        contractReady={false}
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).toContain('Synthèse en attente');
    expect(html).toContain('sim-empty-state--sidebar');
    expect(html).not.toContain('Rente');
    expect(html).not.toContain('Capital unique');
  });

  it('affiche quatre oppositions sans sélecteur de sortie', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult()}
        selectedContract={null}
        typeContrat="MADELIN"
        subscriptionDate=""
        step2Done
        contractReady
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).not.toContain('Type de sortie à comparer');
    expect(html).toContain('Contrat actuel');
    expect(html).toContain('Nouveau PER');
    expect(html).toContain('Rente');
    expect(html).toContain('Capital unique');
    expect(html).toContain('Capital fractionné court');
    expect(html).toContain('Capital fractionné long');
    expect(html).toContain('Net de PS + IR');
    expect(html).toContain('sim-metric--inline');
    expect(html).toContain('sim-status-badge--optimal');
    expect(html).toContain('Scénario cible');
    expect(html).toContain('Points d’attention');
    expect(html).not.toContain('per-transfert-compare2__row');
    expect(html).not.toContain('Rente nette mensuelle');
    expect(html).not.toContain('/mois');
  });

  it('affiche la stratégie Max capital uniquement pour Préfon', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult({ compartment: 'C1' })}
        selectedContract={null}
        typeContrat="PER_POINTS"
        subscriptionDate=""
        step2Done
        contractReady
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).toContain('Max capital');
    expect(html).toContain('Tout rente');
  });

  it('affiche le segment C1 bis sans le réduire à C1', () => {
    const html = renderToStaticMarkup(
      <PerTransfertSidebar
        result={makeResult({ compartment: 'C1_BIS' })}
        selectedContract={null}
        typeContrat="MADELIN"
        subscriptionDate=""
        step2Done
        contractReady
        horizonAgeShort={80}
        horizonAgeLong={90}
        onHorizonChange={vi.fn()}
        onOpenQuotientInfo={vi.fn()}
        onOpenFractionalInfo={vi.fn()}
      />,
    );

    expect(html).toContain('C1 bis');
  });
});
