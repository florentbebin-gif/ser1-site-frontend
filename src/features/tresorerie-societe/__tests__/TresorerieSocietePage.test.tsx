import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mocks hooks ──────────────────────────────────────────────────────────────

const mockUseTresoState = vi.hoisted(() => vi.fn());
const mockUseTresoCalc = vi.hoisted(() => vi.fn());
const mockUseTresoExports = vi.hoisted(() => vi.fn());
const mockThemeColors = vi.hoisted(() => ({
  c1: 'c1',
  c2: 'c2',
  c3: 'c3',
  c4: 'c4',
  c5: 'c5',
  c6: 'c6',
  c7: 'c7',
  c8: 'c8',
  c9: 'c9',
  c10: 'c10',
}));

vi.mock('../hooks/useTresorerieState', () => ({
  useTresorerieState: (...args: unknown[]) => mockUseTresoState(...args),
}));

vi.mock('../hooks/useTresorerieCalculations', () => ({
  useTresorerieCalculations: (...args: unknown[]) => mockUseTresoCalc(...args),
}));

vi.mock('../hooks/useTresorerieExportHandlers', () => ({
  useTresorerieExportHandlers: (...args: unknown[]) => mockUseTresoExports(...args),
}));

// ─── Mocks composants enfants ─────────────────────────────────────────────────

vi.mock('../components/TresoSocieteSection', () => ({
  TresoSocieteSection: () => <div data-testid="societe-section" />,
}));

vi.mock('../components/TresoPlacementSection', () => ({
  TresoPlacementSection: () => <div data-testid="placement-section" />,
}));

vi.mock('../components/TresoKPISidebar', () => ({
  TresoKPISidebar: ({ kpis }: any) => (
    <div data-testid="kpi-sidebar">
      {kpis.alerteDividendesAn1 && <span data-testid="kpi-alert">Alerte dividendes</span>}
    </div>
  ),
}));

vi.mock('../components/TresoAssociateInsights', () => ({
  TresoAssociateInsights: () => <div data-testid="associate-insights" />,
}));

vi.mock('../components/TresoProjectionDrawer', () => ({
  TresoProjectionDrawer: () => <div data-testid="projection-drawer" />,
}));

vi.mock('../components/TresoHypotheses', () => ({
  TresoHypotheses: () => <div data-testid="hypotheses" />,
}));

vi.mock('../../../components/ui/sim/SimPageShell', () => ({
  SimPageShell: Object.assign(
    ({ actions, children, error, notice, pageTestId }: any) => (
      <div data-testid={pageTestId}>
        {actions ? <div data-testid="sim-header-actions">{actions}</div> : null}
        {error ? <div data-testid="page-error">{error}</div> : (
          <>
            {notice ? <div data-testid="sim-notice">{notice}</div> : null}
            {children}
          </>
        )}
      </div>
    ),
    {
      Main: ({ children }: any) => <div data-slot="main">{children}</div>,
      Side: ({ children }: any) => <div data-slot="side">{children}</div>,
    }
  ),
}));

vi.mock('../../../components/ExportMenu', () => ({
  ExportMenu: ({ options, loading }: any) => (
    <div data-testid="export-menu" data-loading={loading ? 'true' : 'false'}>
      {options.map((option: any) => (
        <button key={option.label} type="button" disabled={option.disabled}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../../settings/ThemeProvider', () => ({
  useTheme: () => ({
    colors: mockThemeColors,
    pptxColors: mockThemeColors,
    cabinetLogo: undefined,
    logoPlacement: 'center-bottom',
  }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEFAULT_INPUTS_V5 = {
  version: 5 as const,
  selectedAssociateId: 'associe-1',
  foyer: {
    selectedAssociateId: 'associe-1',
    currentAge: 50,
    retirementAge: 65,
    annualIncomeNeed: 30000,
    projectionStartYear: 2025,
  },
  company: {
    creationType: 'newco' as const,
    legalForm: 'sas' as const,
    companyKind: 'holding_patrimoniale' as const,
    shareCapital: 1000,
    sharePremium: 0,
    reservesInitial: 0,
    treasuryInitial: 0,
    annualStructureCosts: 3000,
    incomeStatement: {
      annualRevenue: 0,
      annualStructureCosts: 3000,
      workingCapitalRequirement: 0,
    },
    reducedCorporateTaxEligible: true,
    associates: [{
      id: 'associe-1',
      label: 'Associé 1',
      kind: 'pp' as const,
      profile: {
        currentAge: 50,
        retirementAge: 65,
        annualIncomeNeed: 30000,
        projectionStartYear: 2025,
      },
      ownershipLots: [{ right: 'pleine_propriete' as const, capitalPct: 100, economicRightsPct: 100 }],
      roles: ['associe_sans_statut' as const],
      cca: {
        currentBalance: 0,
        exceptionalContributions: [],
        annualContribution: { amount: 0, startYear: 2025, endYear: 2025 },
        remunerationRate: 0,
      },
      revenuePhases: [{
        id: 'phase-default',
        startYear: 2025,
        source: 'none' as const,
        loadedAnnualCost: 0,
        socialChargeRate: 0,
        annualNetIncomeNeed: 30000,
        useCcaForCompletion: true,
      }],
    }],
    loans: [],
    subsidiaries: [],
  },
  allocationMatrix: {
    sweepThreshold: 50000,
    minimumBankBalance: 50000,
    pockets: [],
  },
};

function makeStateReturn(overrides: Record<string, unknown> = {}) {
  return {
    state: {
      inputsV5: DEFAULT_INPUTS_V5,
      projectionVisible: false,
      projectionMode: 'resume' as const,
    },
    hydrated: true,
    setInputsV5: vi.fn(),
    setProjectionVisible: vi.fn(),
    setProjectionMode: vi.fn(),
    ...overrides,
  };
}

function makeCalcReturn(kpiOverrides: Record<string, unknown> = {}) {
  return {
    rows: [],
    kpis: {
      ccaTotalConstitue: 0,
      isTotalDecaisse: 0,
      isLatentCapi: 0,
      revenusNetsRetraite: 0,
      dureeRemboursementCCA: null,
      valeurNetteSocieteRetraite: 0,
      reservesRetraite: 0,
      capaciteDistribuableAn1: 0,
      alerteDividendesAn1: false,
      deficitBancaireMax: 0,
      alerteTresorerieBancaire: false,
      premiereAnneeDeficitBancaire: null,
      hasRows: false,
      anneeRetraiteIndex: null,
      ...kpiOverrides,
    },
    loading: false,
    error: null,
    simulationError: null,
    fiscalParams: null,
  };
}

// ─── Import après les mocks ───────────────────────────────────────────────────

import TresorerieSocietePage from '../TresorerieSocietePage';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TresorerieSocietePage', () => {
  beforeEach(() => {
    mockUseTresoState.mockReset();
    mockUseTresoCalc.mockReset();
    mockUseTresoExports.mockReset();
    mockUseTresoState.mockReturnValue(makeStateReturn());
    mockUseTresoCalc.mockReturnValue(makeCalcReturn());
    mockUseTresoExports.mockReturnValue({
      exportExcel: vi.fn(),
      exportPptx: vi.fn(),
      exportLoading: false,
    });
  });

  it('se rend sans erreur quand hydrated=true', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toBeTruthy();
  });

  it('retourne vide avant l\'hydration (hydrated=false)', () => {
    mockUseTresoState.mockReturnValue(makeStateReturn({ hydrated: false }));
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toBe('');
  });

  it('affiche le parcours guidé sans bloc Foyer autonome ni anciens blocs concurrents', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toContain('data-testid="societe-section"');
    expect(html).toContain('data-testid="placement-section"');
    expect(html).not.toContain('data-testid="foyer-section"');
    expect(html).not.toContain('>Foyer<');
    expect(html).not.toContain('data-testid="credit-section"');
    expect(html).not.toContain('data-testid="holding-section"');
  });

  it('affiche la société avant le parcours de revenus', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);

    expect(html.indexOf('data-testid="societe-section"')).toBeLessThan(
      html.indexOf('id="ts-timeline-title"'),
    );
  });

  it('affiche la sidebar KPI', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toContain('data-testid="kpi-sidebar"');
  });

  it('affiche les hypothèses', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toContain('data-testid="hypotheses"');
  });

  it('branche les actions d’export Excel et PowerPoint dans le header', () => {
    mockUseTresoCalc.mockReturnValue(makeCalcReturn({ hasRows: true }));

    const html = renderToStaticMarkup(<TresorerieSocietePage />);

    expect(html).toContain('data-testid="sim-header-actions"');
    expect(html).toContain('data-testid="export-menu"');
    expect(html).toContain('Excel');
    expect(html).toContain('PowerPoint');
  });

  it('branche calculs et exports sur inputsV5, sans state legacy runtime', () => {
    renderToStaticMarkup(<TresorerieSocietePage />);

    expect(mockUseTresoCalc).toHaveBeenCalledWith(DEFAULT_INPUTS_V5);
    expect(mockUseTresoExports).toHaveBeenCalledWith(expect.objectContaining({
      inputs: DEFAULT_INPUTS_V5,
    }));
  });

  it('conserve l’interface quand la simulation signale une erreur métier', () => {
    mockUseTresoCalc.mockReturnValue({
      ...makeCalcReturn(),
      simulationError: 'Détention capital supérieure à 100 %.',
    });

    const html = renderToStaticMarkup(<TresorerieSocietePage />);

    expect(html).toContain('data-testid="societe-section"');
    expect(html).toContain('data-testid="placement-section"');
    expect(html).toContain('Détention capital supérieure à 100 %.');
    expect(html).not.toContain('data-testid="page-error"');
  });

  describe('drawer de projection', () => {
    it('est fermé par défaut (aria-expanded="false")', () => {
      const html = renderToStaticMarkup(<TresorerieSocietePage />);
      expect(html).toContain('aria-expanded="false"');
      expect(html).not.toContain('data-testid="projection-drawer"');
    });

    it('est visible quand projectionVisible=true', () => {
      mockUseTresoState.mockReturnValue(makeStateReturn({
        state: {
          inputsV5: DEFAULT_INPUTS_V5,
          projectionVisible: true,
          projectionMode: 'resume' as const,
        },
      }));
      const html = renderToStaticMarkup(<TresorerieSocietePage />);
      expect(html).toContain('data-testid="projection-drawer"');
      expect(html).toContain('aria-expanded="true"');
    });
  });

  describe('KPI alerte dividendes', () => {
    it('aucune alerte affichée quand alerteDividendesAn1=false', () => {
      const html = renderToStaticMarkup(<TresorerieSocietePage />);
      expect(html).not.toContain('data-testid="kpi-alert"');
    });

    it('alerte visible quand alerteDividendesAn1=true', () => {
      mockUseTresoCalc.mockReturnValue(makeCalcReturn({ alerteDividendesAn1: true }));
      const html = renderToStaticMarkup(<TresorerieSocietePage />);
      expect(html).toContain('data-testid="kpi-alert"');
    });
  });
});
