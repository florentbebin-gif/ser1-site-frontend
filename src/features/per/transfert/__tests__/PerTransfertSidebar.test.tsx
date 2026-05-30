// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PerTransfertSidebar } from '../components/PerTransfertSidebar';
import type {
  PerTransfertCapitalFiscalResult,
  PerTransfertFiscalResult,
  PerTransfertResult,
} from '@/engine/per';

type PerTransfertSidebarProps = ComponentProps<typeof PerTransfertSidebar>;

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

function makeSidebarProps(overrides: Partial<PerTransfertSidebarProps> = {}) {
  return {
    result: makeResult(),
    selectedContract: null,
    typeContrat: 'MADELIN',
    subscriptionDate: '',
    step2Done: true,
    contractReady: true,
    horizonAgeShort: 80,
    horizonAgeLong: 90,
    onHorizonChange: vi.fn(),
    onOpenQuotientInfo: vi.fn(),
    onOpenFractionalInfo: vi.fn(),
    ...overrides,
  } satisfies PerTransfertSidebarProps;
}

function renderSidebar(overrides: Partial<PerTransfertSidebarProps> = {}) {
  return render(<PerTransfertSidebar {...makeSidebarProps(overrides)} />);
}

function renderSidebarMarkup(overrides: Partial<PerTransfertSidebarProps> = {}) {
  return renderToStaticMarkup(<PerTransfertSidebar {...makeSidebarProps(overrides)} />);
}

function mockCompactViewport(matches: boolean) {
  const matchMedia = vi.fn((query: string): MediaQueryList => {
    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    };
  });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return matchMedia;
}

function getControlledRegion(button: HTMLElement) {
  const regionId = button.getAttribute('aria-controls');
  expect(regionId).toBeTruthy();
  const region = document.getElementById(regionId as string);
  expect(region).not.toBeNull();
  return region as HTMLElement;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (window as Window & { matchMedia?: Window['matchMedia'] }).matchMedia;
});

describe('PerTransfertSidebar', () => {
  it('affiche un état d’attente sobre quand aucun contrat n’est prêt', () => {
    const html = renderSidebarMarkup({
      step2Done: false,
      contractReady: false,
    });

    expect(html).toContain('Synthèse en attente');
    expect(html).toContain('sim-empty-state--sidebar');
    expect(html).not.toContain('Rente');
    expect(html).not.toContain('Capital unique');
  });

  it('affiche quatre oppositions sans sélecteur de sortie', () => {
    const html = renderSidebarMarkup();

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
    const html = renderSidebarMarkup({
      result: makeResult({ compartment: 'C1' }),
      typeContrat: 'PER_POINTS',
    });

    expect(html).toContain('Max capital');
    expect(html).toContain('Tout rente');
  });

  it('affiche le segment C1 bis sans le réduire à C1', () => {
    const html = renderSidebarMarkup({
      result: makeResult({ compartment: 'C1_BIS' }),
    });

    expect(html).toContain('C1 bis');
  });

  it('ouvre les blocs secondaires par défaut en desktop', () => {
    const matchMedia = mockCompactViewport(false);
    renderSidebar();

    expect(matchMedia).toHaveBeenCalledWith('(max-width: 1024px)');
    for (const title of ['Compartiment cible', 'Horizons projection', 'Points d’attention']) {
      const button = screen.getByRole('button', { name: `Replier ${title}` });
      const region = getControlledRegion(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(region).toHaveAttribute('role', 'region');
      expect(region).not.toHaveAttribute('hidden');
    }
  });

  it('replie les blocs secondaires par défaut en mobile et tablette', () => {
    mockCompactViewport(true);
    renderSidebar();

    expect(screen.getByRole('heading', { name: 'Synthèse' })).toBeInTheDocument();
    for (const title of ['Compartiment cible', 'Horizons projection', 'Points d’attention']) {
      const button = screen.getByRole('button', { name: `Déplier ${title}` });
      const region = getControlledRegion(button);

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(region).toHaveAttribute('role', 'region');
      expect(region).toHaveAttribute('hidden');
    }
  });

  it('déplie un bloc secondaire au clic en gardant aria-controls cohérent', async () => {
    const user = userEvent.setup();
    mockCompactViewport(true);
    renderSidebar();

    const button = screen.getByRole('button', { name: 'Déplier Horizons projection' });
    const region = getControlledRegion(button);

    expect(region).toHaveAttribute('hidden');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(region).not.toHaveAttribute('hidden');
    expect(screen.getByLabelText('Court')).toBeInTheDocument();
    expect(screen.getByLabelText('Long')).toBeInTheDocument();
  });

  it('déplie et replie un bloc secondaire au clavier avec Entrée et Espace', async () => {
    const user = userEvent.setup();
    mockCompactViewport(true);
    renderSidebar();

    const button = screen.getByRole('button', { name: 'Déplier Compartiment cible' });
    const region = getControlledRegion(button);

    button.focus();
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(region).not.toHaveAttribute('hidden');

    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(region).toHaveAttribute('hidden');
  });
});
