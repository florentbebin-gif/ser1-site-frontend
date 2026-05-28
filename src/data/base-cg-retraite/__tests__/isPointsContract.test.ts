import { describe, expect, it } from 'vitest';
import { isPointsContract, PREFON_2025 } from '@/data/base-cg-retraite';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';

type ContractOverrides = Omit<
  Partial<BaseCgRetraiteContract>,
  'phaseEpargne' | 'phaseLiquidation'
> & {
  phaseEpargne?: Partial<BaseCgRetraiteContract['phaseEpargne']>;
  phaseLiquidation?: Partial<BaseCgRetraiteContract['phaseLiquidation']>;
};

const DEFAULT_PHASE_EPARGNE: BaseCgRetraiteContract['phaseEpargne'] = {
  dateCommercialisation: null,
  nombreFonds: null,
  repartitionUcEuro: null,
  rendementFondsEuro: null,
  fraisVersements: null,
  fraisGestion: null,
  fraisArbitrage: null,
  fraisTransfertSortant: null,
  fraisTransfertSortantRate: null,
  clauseBeneficiaire: null,
  garantiesComplementaires: null,
};

const DEFAULT_PHASE_LIQUIDATION: BaseCgRetraiteContract['phaseLiquidation'] = {
  ageLimiteLiquidation: null,
  sortieCapitalRetraite: null,
  fractionnementCapital: null,
  rachatLibre: null,
  tableConversionRente: null,
  tableGarantieAdhesion: null,
  tauxTechnique: null,
  fraisArrerages: null,
  fraisArreragesRate: null,
  annuitesGaranties: null,
  reversionPossible: null,
  reversionIncluse: null,
  renteEstimee: null,
};

function makeContract(overrides: ContractOverrides = {}): BaseCgRetraiteContract {
  const { phaseEpargne, phaseLiquidation, ...rest } = overrides;
  return {
    id: 'test-contract',
    sourceId: 'Test',
    compagnie: 'TEST',
    nomContrat: 'Contrat test',
    typeContrat: 'PERIN',
    perCompartment: 'C1',
    phaseEpargne: { ...DEFAULT_PHASE_EPARGNE, ...phaseEpargne },
    phaseLiquidation: { ...DEFAULT_PHASE_LIQUIDATION, ...phaseLiquidation },
    ...rest,
  };
}

describe('isPointsContract', () => {
  it('reconnaît les contrats taggés PER_POINTS (Préfon)', () => {
    const prefon = makeContract({
      id: 'prefon-perin-per-prefon-retraite-42',
      typeContrat: 'PER_POINTS',
      pointsParams: PREFON_2025,
    });
    expect(isPointsContract(prefon)).toBe(true);
  });

  it('reconnaît les contrats avec « Système par points » dans le rendement fonds €', () => {
    const corem = makeContract({
      typeContrat: 'ARTICLE83',
      phaseEpargne: { rendementFondsEuro: 'Système par points' },
    });
    expect(corem.typeContrat).toBe('ARTICLE83');
    expect(isPointsContract(corem)).toBe(true);
  });

  it('reconnaît AGIPI PAIR avec « NC\\nPoints »', () => {
    const pair = makeContract({
      compagnie: 'AGIPI',
      nomContrat: 'PAIR',
      phaseEpargne: { rendementFondsEuro: 'NC\nPoints' },
    });
    expect(isPointsContract(pair)).toBe(true);
  });

  it('reconnaît "PER MEDICIS PRODUIT EN POINTS" via "Système par points"', () => {
    const medicisPoints = makeContract({
      nomContrat: 'PER MEDICIS PRODUIT EN POINTS',
      phaseEpargne: { rendementFondsEuro: 'Système par points' },
    });
    expect(isPointsContract(medicisPoints)).toBe(true);
  });

  it('refuse un contrat classique sans marker points', () => {
    const classic = makeContract({
      typeContrat: 'PERIN',
      phaseEpargne: {
        rendementFondsEuro: '2,5 %',
        repartitionUcEuro: '40 % UC / 60 % fonds €',
      },
    });
    expect(isPointsContract(classic)).toBe(false);
  });

  it('reconnaît aussi un marqueur points dans la répartition UC/euro', () => {
    const contract = makeContract({
      phaseEpargne: { repartitionUcEuro: 'NC / points' },
    });
    expect(isPointsContract(contract)).toBe(true);
  });
});
