// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import type { SituationFiscale } from '@/domain/audit/types';

import AuditPage from '../AuditPage';
import { FiscaliteBudgetCard } from '../cockpit/FiscaliteBudgetCard';
import { FiscaliteCoherenceCard } from '../cockpit/FiscaliteCoherenceCard';
import { FiscalitePressionCard } from '../cockpit/FiscalitePressionCard';
import type {
  AuditBudgetSynthese,
  AuditIfiIndicator,
  AuditIrEstimate,
  AuditIrResult,
} from '../cockpit/auditIrAdapter';
import { buildFiscalCoherence } from '../cockpit/auditIrAdapter';
import { buildFiscaliteTiles } from '../cockpit/auditFiscaliteModel';
import { AuditDonut } from '../cockpit/auditFiscaliteViz';

vi.mock('@/settings/ThemeProvider', () => ({
  useTheme: () => ({ colors: {} }),
}));

vi.mock('@/hooks/useDossierPatrimonialPersistence', () => ({
  useDossierPatrimonialPersistence: () => ({
    ownerUserId: null,
    saving: false,
    loading: false,
    lastSavedAt: null,
    lastLoadedAt: null,
    currentDossier: null,
    error: null,
    saveDossier: vi.fn(),
    loadDossier: vi.fn(),
    loadLatestDossier: vi.fn().mockResolvedValue({ ok: false, reason: 'missing-user' }),
    listDossiers: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      irScaleCurrent: DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent,
      ifi: DEFAULT_TAX_SETTINGS.ifi,
      _raw_tax: DEFAULT_TAX_SETTINGS,
      _raw_ps: DEFAULT_PS_SETTINGS,
    },
    loading: false,
    error: null,
    meta: {},
  }),
}));

async function openFiscalite() {
  render(<AuditPage />);
  await userEvent.click(screen.getByRole('button', { name: /Fiscalité & budget/ }));
}

function getCockpitCardButton(name: RegExp): HTMLElement {
  const card = screen
    .getAllByRole('button', { name })
    .find((element) => element.classList.contains('audit-cockpit-card'));
  expect(card).toBeDefined();
  return card!;
}

function result(overrides: Partial<AuditIrResult> = {}): AuditIrResult {
  return {
    irNet: 9593,
    tmiRate: 30,
    taxableIncome: 90000,
    tmiMarginGlobal: 56897,
    pfuIr: 1200,
    psTotal: 1720,
    cehr: 0,
    cdhr: 0,
    totalTax: 12513,
    ...overrides,
  } as unknown as AuditIrResult;
}

function estimate(irResult: AuditIrResult | null = result()): AuditIrEstimate {
  return {
    result: irResult,
    hasIncome: irResult != null,
    isCouple: true,
    parts: 2,
    tmiScale: [
      { from: 0, to: 11497, rate: 0, deduction: 0 },
      { from: 11498, to: 29315, rate: 11, deduction: 0 },
      { from: 29316, to: 83823, rate: 30, deduction: 0 },
      { from: 83824, to: 180294, rate: 41, deduction: 0 },
      { from: 180295, to: null, rate: 45, deduction: 0 },
    ],
    declaredIr: 10000,
    declaredRfr: 90000,
  };
}

const ifi: AuditIfiIndicator = {
  status: 'proche',
  assietteImmoNette: 1200000,
  seuil: 1300000,
  hasImmo: true,
};

describe('FiscalitePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('présente les synthèses fiscalité et budget puis les 4 tuiles de saisie', async () => {
    await openFiscalite();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Fiscalité & budget' }),
    ).toBeInTheDocument();

    const pivot = screen.getByRole('region', { name: 'Pression fiscale et budget du foyer' });
    expect(
      within(pivot).getByRole('heading', { level: 2, name: 'Pression fiscale' }),
    ).toBeVisible();
    expect(
      within(pivot).getByRole('heading', { level: 2, name: 'Budget & capacité' }),
    ).toBeVisible();
    expect(
      within(pivot).getByRole('heading', { level: 2, name: 'Cohérence avis fiscal' }),
    ).toBeVisible();

    expect(within(pivot).getByText('Pression fiscale en attente')).toBeVisible();
    expect(within(pivot).getByText('Budget à renseigner')).toBeVisible();
    expect(within(pivot).queryByRole('button', { name: /Renseigner le budget/ })).toBeNull();
    expect(within(pivot).queryByRole('button', { name: /Ajouter un revenu/ })).toBeNull();
    expect(within(pivot).queryByRole('button', { name: /Modifier/ })).toBeNull();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Saisie fiscale et budget' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Revenus d’activité & foyer fiscal' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Revenus du capital & patrimoine' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Charges, déductions & réductions' }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 2, name: 'Budget & capacité' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { level: 2, name: /IFI/ })).toBeNull();

    expect(screen.queryByRole('button', { name: /Détail du calcul/ })).toBeNull();
    expect(screen.queryByText('Aller plus loin')).toBeNull();
    expect(screen.queryByRole('link', { name: /Ouvrir le simulateur IR/ })).toBeNull();
  });

  it('ouvre les 3 drawers de saisie fiscale et le drawer budget', async () => {
    await openFiscalite();

    await userEvent.click(getCockpitCardButton(/Revenus d’activité & foyer fiscal/));
    expect(screen.getByRole('dialog', { name: 'Revenus d’activité & foyer fiscal' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    await userEvent.click(getCockpitCardButton(/Revenus du capital & patrimoine/));
    expect(screen.getByRole('dialog', { name: 'Revenus du capital & patrimoine' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    await userEvent.click(getCockpitCardButton(/Charges, déductions & réductions/));
    expect(screen.getByRole('dialog', { name: 'Charges, déductions & réductions' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    await userEvent.click(getCockpitCardButton(/Budget & capacité/));
    expect(screen.getByRole('dialog', { name: 'Budget & capacité' })).toBeVisible();
  });
});

describe('FiscalitePressionCard', () => {
  it('affiche le donut, l’échelle TMI active et l’indicateur IFI', () => {
    const { container } = render(<FiscalitePressionCard estimate={estimate()} ifi={ifi} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Pression fiscale' })).toBeVisible();
    expect(screen.getByRole('img', { name: /Imposition totale estimée/ })).toBeVisible();
    expect(screen.getByText('Impôt sur le revenu')).toBeVisible();
    expect(screen.getByText('Prélèvements sociaux')).toBeVisible();
    expect(screen.getByText('PFU capitaux')).toBeVisible();
    expect(screen.getByText('Tranche marginale d’imposition')).toBeVisible();
    expect(screen.getByText(/Il reste/)).toBeVisible();
    expect(screen.getByText('Proche du seuil')).toBeVisible();
    expect(screen.queryByText('Capacité budget')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();

    const active = container.querySelector('.audit-tmi-ladder__segment[data-active="true"]');
    expect(active).not.toBeNull();
    expect(active).toHaveTextContent('30 %');
  });
});

describe('buildFiscalCoherence', () => {
  it('signale les parts divergentes et l’écart IR avis vs estimation', () => {
    const coherence = buildFiscalCoherence(estimate(result({ totalTax: 22750 })), 4);

    expect(coherence).toMatchObject({
      indicativeParts: 4,
      enteredParts: 2,
      partsMismatch: true,
      declaredIr: 10000,
      estimatedIr: 22750,
      irDelta: 12750,
      hasIrDelta: true,
      requiresReview: true,
    });
  });
});

describe('FiscaliteCoherenceCard', () => {
  it('affiche les parts, l’IR déclaré, l’IR estimé et le delta à vérifier', () => {
    const coherence = buildFiscalCoherence(estimate(result({ totalTax: 22750 })), 4);

    render(<FiscaliteCoherenceCard coherence={coherence} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Cohérence avis fiscal' })).toBeVisible();
    expect(screen.getByText('Parts foyer indicatives')).toBeVisible();
    expect(screen.getByText('Parts saisies avis')).toBeVisible();
    expect(screen.getByText('IR déclaré')).toBeVisible();
    expect(screen.getByText('IR estimé')).toBeVisible();
    expect(screen.getByText(/\+\s12\s750\s€/)).toBeVisible();
    expect(screen.getByText('Écart à vérifier avec les données de l’avis.')).toBeVisible();
  });
});

describe('buildFiscaliteTiles', () => {
  it('marque les tuiles renseignées comme complètes', () => {
    const situationFiscale: SituationFiscale = {
      anneeReference: 2025,
      revenus: [
        {
          id: 'revenu-salaires',
          categorie: 'salaires',
          montantBrut: 50000,
          montantNet: 50000,
          beneficiaire: 'foyer',
        },
        {
          id: 'revenu-fonciers',
          categorie: 'fonciers',
          montantBrut: 10000,
          montantNet: 10000,
          beneficiaire: 'foyer',
        },
      ],
      revenuFiscalReference: 60000,
      nombreParts: 2,
      impotRevenu: 10000,
      tmi: 30,
      chargesDeductibles: 2000,
      reductionsCredits: 500,
    };
    const budget: AuditBudgetSynthese = {
      ressources: 120000,
      charges: 70000,
      empruntsAnnuels: 18000,
      impots: 12513,
      capacite: 37487,
      tauxEndettement: 15,
      hasBudget: true,
    };

    const tiles = buildFiscaliteTiles(situationFiscale, budget, vi.fn());

    expect(tiles.map((tile) => [tile.id, tile.status, tile.ctaLabel])).toEqual([
      ['activite', 'complet', 'Modifier'],
      ['capital', 'complet', 'Modifier'],
      ['charges', 'complet', 'Modifier'],
      ['budget', 'complet', 'Modifier'],
    ]);
  });
});

describe('FiscaliteBudgetCard', () => {
  it('affiche la synthèse budgétaire sans action de saisie', () => {
    const budget: AuditBudgetSynthese = {
      ressources: 120000,
      charges: 70000,
      empruntsAnnuels: 18000,
      impots: 12513,
      capacite: 37487,
      tauxEndettement: 15,
      hasBudget: true,
    };

    render(<FiscaliteBudgetCard budget={budget} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Budget & capacité' })).toBeVisible();
    expect(screen.getByRole('img', { name: /Emploi des ressources/ })).toBeVisible();
    expect(screen.getByText('Solde budgétaire')).toBeVisible();
    expect(screen.getByText('Taux d’endettement indicatif')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('explique un solde négatif dépendant d’une imposition non réconciliée', () => {
    const budget: AuditBudgetSynthese = {
      ressources: 50000,
      charges: 30000,
      empruntsAnnuels: 10400,
      impots: 22750,
      capacite: -13150,
      tauxEndettement: 20.8,
      hasBudget: true,
    };
    const coherence = buildFiscalCoherence(estimate(result({ totalTax: 22750 })), 4);

    render(<FiscaliteBudgetCard budget={budget} coherence={coherence} />);

    expect(screen.getByText('Solde budgétaire')).toBeVisible();
    expect(
      screen.getByText(
        'Solde à vérifier : il intègre l’imposition estimée avant réconciliation avec l’avis fiscal.',
      ),
    ).toBeVisible();
  });
});

describe('AuditDonut', () => {
  it('utilise uniquement les tokens visuels fournis pour les segments', () => {
    const { container } = render(
      <AuditDonut
        segments={[
          { label: 'IR', value: 100, token: '--viz-1' },
          { label: 'PS', value: 50, token: '--viz-2' },
        ]}
        centerValue="150 €"
        centerLabel="Total"
        ariaLabel="Donut test"
      />,
    );

    expect(screen.getByRole('img', { name: 'Donut test' })).toBeVisible();
    expect(screen.getByText('150 €')).toBeVisible();
    expect(screen.getByText('Total')).toBeVisible();
    expect(container.querySelector('circle[stroke="var(--viz-1)"]')).not.toBeNull();
    expect(container.querySelector('circle[stroke="var(--viz-2)"]')).not.toBeNull();
  });
});
