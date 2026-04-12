import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockUsePerPotentiel = vi.fn();

vi.mock('../../../../hooks/useFiscalContext', () => ({
  useFiscalContext: () => ({
    fiscalContext: {
      irCurrentYearLabel: '2026 (revenus 2025)',
      irPreviousYearLabel: '2025 (revenus 2024)',
      passHistoryByYear: {},
      _raw_tax: {},
      _raw_ps: {},
    },
    loading: false,
    error: null,
  }),
}));

vi.mock('../../../../settings/ThemeProvider', () => ({
  useTheme: () => ({
    pptxColors: {},
    cabinetLogo: null,
    logoPlacement: 'left',
  }),
}));

vi.mock('../../../../settings/userMode', () => ({
  useUserMode: () => ({
    mode: 'expert',
  }),
}));

vi.mock('../../hooks/usePerPotentiel', () => ({
  usePerPotentiel: (...args: unknown[]) => mockUsePerPotentiel(...args),
}));

vi.mock('../../hooks/usePerPotentielExportHandlers', () => ({
  usePerPotentielExportHandlers: () => ({
    exportExcel: vi.fn(),
    exportPowerPoint: vi.fn(),
    exportLoading: false,
  }),
}));

vi.mock('../../../../components/ExportMenu', () => ({
  ExportMenu: () => <div>Export menu</div>,
}));

vi.mock('../../../../components/ModeToggle', () => ({
  ModeToggle: () => <div>Mode toggle</div>,
}));

vi.mock('./steps/ModeStep', () => ({
  default: () => <div>Mode step</div>,
}));

vi.mock('./steps/AvisIrStep', () => ({
  default: ({
    totalDeclarant1,
    totalDeclarant2,
  }: {
    totalDeclarant1: number;
    totalDeclarant2: number;
  }) => (
    <div>
      Avis step {totalDeclarant1} / {totalDeclarant2}
    </div>
  ),
}));

vi.mock('./steps/SituationFiscaleStep', () => ({
  default: () => <div>Situation step</div>,
}));

vi.mock('./steps/SynthesePotentielStep', () => ({
  default: () => <div>Synthèse step</div>,
}));

vi.mock('./PerHypotheses', () => ({
  PerHypotheses: () => <div>Hypothèses</div>,
}));

vi.mock('./PerSynthesisSidebar', () => ({
  PerSynthesisSidebar: () => <div>Sidebar finale</div>,
}));

import PerPotentielSimulator from './PerPotentielSimulator';

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

function makeHookState(step: number) {
  return {
    step,
    mode: 'versement-n',
    historicalBasis: 'previous-avis-plus-n1',
    needsCurrentYearEstimate: false,
    avisIr: {
      nonUtiliseAnnee1: 2000,
      nonUtiliseAnnee2: 3000,
      nonUtiliseAnnee3: 1500,
      plafondCalcule: 4500,
      anneeRef: 2024,
    },
    avisIr2: {
      nonUtiliseAnnee1: 1000,
      nonUtiliseAnnee2: 2000,
      nonUtiliseAnnee3: 500,
      plafondCalcule: 3500,
      anneeRef: 2024,
    },
    situationFamiliale: 'celibataire',
    nombreParts: 1,
    isole: false,
    children: [],
    revenusN1Declarant1: {},
    revenusN1Declarant2: {},
    projectionNDeclarant1: {},
    projectionNDeclarant2: {},
    versementEnvisage: 0,
    mutualisationConjoints: false,
  };
}

function makeHookReturn(step: number) {
  return {
    state: makeHookState(step),
    result: step >= 3
      ? {
        situationFiscale: {
          tmi: 0.3,
          irEstime: 1000,
          revenuImposableD1: 20000,
          revenuImposableD2: 0,
        },
        plafond163Q: {
          declarant1: { disponibleRestant: 6000 },
          declarant2: undefined,
        },
      }
      : null,
    visibleSteps: [1, 2, 3, 5],
    setMode: vi.fn(),
    setHistoricalBasis: vi.fn(),
    setNeedsCurrentYearEstimate: vi.fn(),
    updateAvisIr: vi.fn(),
    updateSituation: vi.fn(),
    updateDeclarant: vi.fn(),
    addChild: vi.fn(),
    updateChildMode: vi.fn(),
    removeChild: vi.fn(),
    setVersementEnvisage: vi.fn(),
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    goToStep: vi.fn(),
    reset: vi.fn(),
    canGoNext: true,
    isCouple: false,
  };
}

describe('PerPotentielSimulator', () => {
  beforeEach(() => {
    mockUsePerPotentiel.mockReset();
    mockUsePerPotentiel.mockReturnValue(makeHookReturn(2));
  });

  it('passes declarant totals to the avis step and shows them in the right sidebar', () => {
    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Avis step 11000 / 7000');
    expect(html).toContain('Potentiel 163 quatervicies');
    expect(html).toContain(fmtCurrency(11000));
    expect(html).toContain(fmtCurrency(7000));
  });

  it('keeps the avis totals visible in the right sidebar on step 3', () => {
    mockUsePerPotentiel.mockReturnValue(makeHookReturn(3));

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Potentiel 163 quatervicies');
    expect(html).toContain(fmtCurrency(11000));
    expect(html).toContain(fmtCurrency(7000));
  });

  it('shows nombre de parts next to the TMI in the live preview', () => {
    mockUsePerPotentiel.mockReturnValue(makeHookReturn(3));

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Nombre de parts');
    expect(html).toContain('1');
    expect(html).toContain('TMI');
  });

  it('hides the avis totals once the simulator reaches step 4', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(3),
      state: {
        ...makeHookState(4),
        historicalBasis: 'current-avis',
        needsCurrentYearEstimate: true,
      },
      visibleSteps: [1, 2, 3, 4, 5],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).not.toContain('Potentiel 163 quatervicies');
  });

  it('uses the shared title row pattern for stage headers', () => {
    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('per-potentiel-stage-header sim-card__header sim-card__header--bleed');
    expect(html).toContain('class="sim-card__title-row"');
    expect(html).toContain('Lecture de l&#x27;avis IR 2025');
  });
});
