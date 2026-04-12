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

describe('PerPotentielSimulator', () => {
  beforeEach(() => {
    mockUsePerPotentiel.mockReturnValue({
      state: {
        step: 2,
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
        revenusN1Declarant1: {},
        revenusN1Declarant2: {},
        projectionNDeclarant1: {},
        projectionNDeclarant2: {},
        versementEnvisage: 0,
        mutualisationConjoints: false,
      },
      result: null,
      baseResult: null,
      visibleSteps: [1, 2, 3, 5],
      setMode: vi.fn(),
      setHistoricalBasis: vi.fn(),
      setNeedsCurrentYearEstimate: vi.fn(),
      updateAvisIr: vi.fn(),
      updateSituation: vi.fn(),
      updateDeclarant: vi.fn(),
      setVersementEnvisage: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      goToStep: vi.fn(),
      reset: vi.fn(),
      canGoNext: true,
      isCouple: false,
    });
  });

  it('passes declarant totals to the avis step and shows them in the right sidebar', () => {
    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Avis step 11000 / 7000');
    expect(html).toContain('Potentiel 163 quatervicies');
    expect(html).toContain(fmtCurrency(11000));
    expect(html).toContain(fmtCurrency(7000));
  });

  it('uses the shared title row pattern for stage headers', () => {
    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('per-potentiel-stage-header sim-card__header sim-card__header--bleed');
    expect(html).toContain('class="sim-card__title-row"');
    expect(html).toContain('Lecture de l&#x27;avis IR 2025');
  });
});
