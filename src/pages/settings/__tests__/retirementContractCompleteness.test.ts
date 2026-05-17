import { describe, expect, it } from 'vitest';
import type { BaseCgRetraiteContract } from '@/data/basecg';
import { isRetraiteContractIncomplete } from '../utils/retirementContractCompleteness';

function makeContract(overrides: Partial<BaseCgRetraiteContract> = {}): BaseCgRetraiteContract {
  return {
    id: 'completeness-contract',
    sourceId: 'Contrat test',
    compagnie: 'Test Vie',
    nomContrat: 'Retraite Test',
    typeContrat: 'MADELIN',
    perCompartment: 'C1',
    phaseEpargne: {
      dateCommercialisation: 'De 2010 à 2017',
      nombreFonds: 50,
      nombreSupportsUc: null,
      repartitionUcEuro: null,
      rendementFondsEuro: null,
      fondsEuroGarantis: null,
      fraisVersements: null,
      fraisGestion: null,
      fraisGestionFondsEuro: '0,50 %',
      fraisGestionUc: '0,70 %',
      fraisArbitrage: null,
      fraisTransfertSortant: null,
      fraisTransfertSortantRate: null,
      clauseBeneficiaire: 'Standard',
      garantiesComplementaires: null,
    },
    phaseLiquidation: {
      ageLimiteLiquidation: '75 ans',
      sortieCapitalRetraite: 'Non',
      fractionnementCapital: null,
      rachatLibre: null,
      tableConversionRente: 'TGH05',
      tableGarantieAdhesion: null,
      tauxTechnique: '0 %',
      fraisArrerages: null,
      fraisArreragesRate: null,
      annuitesGaranties: null,
      reversionPossible: 'Oui',
      reversionIncluse: null,
      renteEstimee: null,
    },
    documents: [],
    ...overrides,
  };
}

describe('isRetraiteContractIncomplete', () => {
  it('considère complet un contrat avec les champs critiques remplis', () => {
    expect(isRetraiteContractIncomplete(makeContract())).toBe(false);
  });

  it('considère incomplet un contrat avec au moins trois champs critiques vides', () => {
    expect(
      isRetraiteContractIncomplete(
        makeContract({
          phaseEpargne: {
            ...makeContract().phaseEpargne,
            dateCommercialisation: null,
            fraisGestionFondsEuro: null,
            fraisGestionUc: null,
            clauseBeneficiaire: null,
          },
        }),
      ),
    ).toBe(true);
  });
});
