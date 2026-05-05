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

vi.mock('../components/TresoCCASection', () => ({
  TresoCCASection: () => <div data-testid="cca-section" />,
}));

vi.mock('../components/TresoPlacementSection', () => ({
  TresoPlacementSection: () => <div data-testid="placement-section" />,
}));

vi.mock('../components/TresoCreditSection', () => ({
  TresoCreditSection: () => <div data-testid="credit-section" />,
}));

vi.mock('../components/TresoHoldingSection', () => ({
  TresoHoldingSection: () => <div data-testid="holding-section" />,
}));

vi.mock('../components/TresoKPISidebar', () => ({
  TresoKPISidebar: ({ kpis }: any) => (
    <div data-testid="kpi-sidebar">
      {kpis.alerteDividendesAn1 && <span data-testid="kpi-alert">Alerte dividendes</span>}
    </div>
  ),
}));

vi.mock('../components/TresoProjectionDrawer', () => ({
  TresoProjectionDrawer: () => <div data-testid="projection-drawer" />,
}));

vi.mock('../components/TresoHypotheses', () => ({
  TresoHypotheses: () => <div data-testid="hypotheses" />,
}));

vi.mock('../../../components/ui/sim/SimPageShell', () => ({
  SimPageShell: Object.assign(
    ({ actions, children, pageTestId }: any) => (
      <div data-testid={pageTestId}>
        {actions ? <div data-testid="sim-header-actions">{actions}</div> : null}
        {children}
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

const DEFAULT_INPUTS = {
  typeCreation: 'newco' as const,
  ageActuel: 50,
  ageRetraite: 65,
  besoinsRetraiteAnnuels: 30000,
  fraisStructureAnnuels: 3000,
  ccaInitial: 0,
  apportAnnuelCCA: 16600,
  dureeActiveAns: 15,
  tresorerieInitiale: 0,
  reservesInitiales: 0,
  anneeCivileDebut: 2025,
  distribution: undefined,
  capitalisation: undefined,
  creditIS: undefined,
  creditIR: undefined,
  holding: undefined,
};

function makeStateReturn(overrides: Record<string, unknown> = {}) {
  return {
    state: {
      inputs: DEFAULT_INPUTS,
      projectionVisible: false,
      projectionMode: 'resume' as const,
    },
    hydrated: true,
    setInputs: vi.fn(),
    setProjectionVisible: vi.fn(),
    setProjectionMode: vi.fn(),
    setDistribution: vi.fn(),
    setCapitalisation: vi.fn(),
    setCreditIS: vi.fn(),
    setCreditIR: vi.fn(),
    setHolding: vi.fn(),
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
      hasRows: false,
      anneeRetraiteIndex: null,
      ...kpiOverrides,
    },
    loading: false,
    error: null,
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

  it('affiche toutes les sections de saisie', () => {
    const html = renderToStaticMarkup(<TresorerieSocietePage />);
    expect(html).toContain('data-testid="societe-section"');
    expect(html).toContain('data-testid="cca-section"');
    expect(html).toContain('data-testid="placement-section"');
    expect(html).toContain('data-testid="credit-section"');
    expect(html).toContain('data-testid="holding-section"');
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

  describe('drawer de projection', () => {
    it('est fermé par défaut (aria-expanded="false")', () => {
      const html = renderToStaticMarkup(<TresorerieSocietePage />);
      expect(html).toContain('aria-expanded="false"');
      expect(html).not.toContain('data-testid="projection-drawer"');
    });

    it('est visible quand projectionVisible=true', () => {
      mockUseTresoState.mockReturnValue(makeStateReturn({
        state: {
          inputs: DEFAULT_INPUTS,
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
