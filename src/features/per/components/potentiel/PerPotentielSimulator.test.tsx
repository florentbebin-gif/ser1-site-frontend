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
  default: ({
    showFoyerCard,
    showIncomeCard,
    situationFamiliale,
  }: {
    showFoyerCard: boolean;
    showIncomeCard: boolean;
    situationFamiliale: 'celibataire' | 'marie';
  }) => (
    <div>
      Situation step {showFoyerCard ? 'foyer visible' : 'foyer masqué'} {showIncomeCard ? 'revenus visibles' : 'revenus masqués'} {situationFamiliale}
    </div>
  ),
}));

vi.mock('./steps/SynthesePotentielStep', () => ({
  default: () => <div>Synthèse step</div>,
}));

vi.mock('./PerHypotheses', () => ({
  PerHypotheses: () => <div>Hypothèses</div>,
}));

vi.mock('./PerPotentielContextSidebar', () => ({
  PerPotentielContextSidebar: ({
    totalAvisIrD1,
    totalAvisIrD2,
  }: {
    totalAvisIrD1: number;
    totalAvisIrD2: number;
  }) => <div>Sidebar contexte {totalAvisIrD1} / {totalAvisIrD2}</div>,
}));

vi.mock('./PerSynthesisSidebar', () => ({
  PerSynthesisSidebar: () => <div>Sidebar finale</div>,
}));

import PerPotentielSimulator from './PerPotentielSimulator';

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
    projectionSituationFamiliale: 'celibataire',
    projectionNombreParts: 1,
    projectionIsole: false,
    projectionChildren: [],
    projectionMutualisationConjoints: false,
    projectionFoyerEdited: false,
    revenusN1Declarant1: { statutTns: false },
    revenusN1Declarant2: { statutTns: false },
    projectionNDeclarant1: { statutTns: false },
    projectionNDeclarant2: { statutTns: false },
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
          revenuFiscalRef: 20000,
          decote: 0,
          cehr: 0,
          montantDansLaTMI: 1000,
        },
        plafond163Q: {
          declarant1: { disponibleRestant: 6000, totalDisponible: 11000 },
          declarant2: undefined,
        },
        deductionFlow163Q: {
          declarant1: { disponibleRestant: 6000, plafondDisponible: 11000 },
        },
        declaration2042: {
          case6NS: 1000,
          case6RS: 0,
          case6QS: 0,
          case6OS: 0,
          case6QR: false,
        },
        projectionAvisSuivant: {
          declarant1: {
            nonUtiliseN2: 2000,
            nonUtiliseN1: 3000,
            nonUtiliseN: 1000,
            plafondCalculeN: 4000,
            plafondTotal: 10000,
          },
        },
      }
      : null,
    visibleSteps: [1, 2, 3, 4],
    setMode: vi.fn(),
    setHistoricalBasis: vi.fn(),
    setNeedsCurrentYearEstimate: vi.fn(),
    updateAvisIr: vi.fn(),
    updateSituation: vi.fn(),
    updateProjectionSituation: vi.fn(),
    updateDeclarant: vi.fn(),
    updateDeclarants: vi.fn(),
    addChild: vi.fn(),
    addProjectionChild: vi.fn(),
    updateChildMode: vi.fn(),
    updateProjectionChildMode: vi.fn(),
    removeChild: vi.fn(),
    removeProjectionChild: vi.fn(),
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
    expect(html).toContain('Sidebar contexte 11000 / 7000');
  });

  it('keeps the avis totals visible in the right sidebar on step 3', () => {
    mockUsePerPotentiel.mockReturnValue(makeHookReturn(3));

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Sidebar contexte 11000 / 7000');
  });

  it('keeps the context sidebar active on step 3', () => {
    mockUsePerPotentiel.mockReturnValue(makeHookReturn(3));

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Sidebar contexte 11000 / 7000');
  });

  it('hides the avis totals once the simulator reaches step 4', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(3),
      state: {
        ...makeHookState(4),
        historicalBasis: 'current-avis',
        needsCurrentYearEstimate: true,
      },
      visibleSteps: [1, 2, 3],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Sidebar contexte 11000 / 7000');
  });

  it('affiche les revenus sur Versement N quand la projection est activée', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(4),
      state: {
        ...makeHookState(4),
        needsCurrentYearEstimate: true,
        projectionSituationFamiliale: 'marie',
        projectionNombreParts: 2,
        projectionIsole: false,
        projectionMutualisationConjoints: true,
        projectionFoyerEdited: true,
      },
      visibleSteps: [1, 2, 3, 4],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Situation step foyer visible revenus visibles marie');
  });

  it('affiche un Versement N simplifié avec avis IR 2026 sans projection', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(3),
      state: {
        ...makeHookState(3),
        historicalBasis: 'current-avis',
        needsCurrentYearEstimate: false,
      },
      visibleSteps: [1, 2, 3],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Versement N');
    expect(html).toContain('Situation step foyer masqué revenus masqués celibataire');
  });

  it('masque les revenus sur Versement N quand la projection est inactive', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(4),
      state: {
        ...makeHookState(4),
        needsCurrentYearEstimate: false,
        projectionSituationFamiliale: 'marie',
      },
      visibleSteps: [1, 2, 3, 4],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Situation step foyer masqué revenus masqués marie');
  });

  it('renomme la tab déclaration en Revenus 2025 et masque la synthèse', () => {
    mockUsePerPotentiel.mockReturnValue({
      ...makeHookReturn(3),
      state: {
        ...makeHookState(3),
        mode: 'declaration-n1',
      },
      visibleSteps: [1, 2, 3],
    });

    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('Revenus 2025');
    expect(html).not.toContain('>Déclaration<');
    expect(html).not.toContain('Synthèse');
  });

  it('uses the shared title row pattern for stage headers', () => {
    const html = renderToStaticMarkup(<PerPotentielSimulator />);

    expect(html).toContain('per-potentiel-stage-header sim-card__header sim-card__header--bleed');
    expect(html).toContain('class="sim-card__title-row"');
    expect(html).toContain('Lecture de l&#x27;avis IR 2025');
  });
});
