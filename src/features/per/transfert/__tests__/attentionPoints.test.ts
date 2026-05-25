import { describe, expect, it } from 'vitest';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';
import { buildPerTransfertAttentionPoints } from '../utils/attentionPoints';

function makeContract(overrides: Partial<BaseCgRetraiteContract> = {}): BaseCgRetraiteContract {
  return {
    id: 'attention-contract',
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
      fraisGestionFondsEuro: null,
      fraisGestionUc: null,
      fraisArbitrage: null,
      fraisTransfertSortant: null,
      fraisTransfertSortantRate: null,
      clauseBeneficiaire: null,
      garantiesComplementaires: null,
    },
    phaseLiquidation: {
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
    },
    documents: [],
    ...overrides,
  };
}

describe('buildPerTransfertAttentionPoints', () => {
  it('détecte les points CGP sans crasher sur des valeurs mixtes', () => {
    const points = buildPerTransfertAttentionPoints(
      makeContract({
        phaseEpargne: {
          ...makeContract().phaseEpargne,
          dateCommercialisation: 'De 2010 à 2017',
          rendementFondsEuro: 'NC - TMG 2,50 % selon millésime',
          fondsEuroGarantis: 0.03,
          garantiesComplementaires: 'Garantie plancher décès',
        },
        phaseLiquidation: {
          ...makeContract().phaseLiquidation,
          tableGarantieAdhesion: 'Oui, table garantie à l’adhésion',
          tauxTechnique: 'Taux garanti 1,25 %',
        },
      }),
      { subscriptionDate: '2018-01-01' },
    );

    expect(points.map((point) => point.label)).toContain('Table de mortalité garantie');
    expect(points.map((point) => point.label)).toContain('Date de souscription à vérifier');
    expect(points.map((point) => point.label)).toContain('Taux technique garanti');
    expect(points.map((point) => point.label)).toContain('TMG / taux garantis fonds €');
    expect(points.map((point) => point.label)).toContain('Garanties prévoyance');
  });

  it('renvoie un état neutre sans contrat sélectionné', () => {
    const points = buildPerTransfertAttentionPoints(null, { subscriptionDate: '' });

    expect(points).toEqual([
      expect.objectContaining({
        level: 'neutral',
        label: 'Base CG non sélectionnée',
      }),
    ]);
  });

  it('affiche le taux technique numérique en pourcentage', () => {
    const points = buildPerTransfertAttentionPoints(
      makeContract({
        phaseLiquidation: {
          ...makeContract().phaseLiquidation,
          tauxTechnique: 0.02,
        },
      }),
      { subscriptionDate: '2020-01-01' },
    );

    expect(points).toContainEqual(
      expect.objectContaining({
        label: 'Taux technique garanti',
        detail: '2 %',
      }),
    );
  });
});
