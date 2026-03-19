import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CompareResult } from '../../../engine/placement/types';
import { PlacementResultsPanel } from '../components/PlacementResultsPanel';
import { shortEuro } from '../utils/formatters';

function buildResults(): CompareResult {
  return {
    produit1: {
      envelope: 'SCPI',
      envelopeLabel: 'SCPI',
      epargne: {
        duree: 10,
        capitalAcquis: 180000,
        cumulVersements: 100000,
        cumulEffort: 100000,
        cumulEconomieIR: 0,
        plusValueLatente: 0,
        cumulPSFondsEuro: 0,
        cumulRevenusDistribues: 0,
        cumulFiscaliteRevenus: 0,
        cumulRevenusNetsPercus: 12000,
        rows: [],
      },
      liquidation: {
        duree: 10,
        ageAuDeces: 85,
        cumulRetraitsBruts: 0,
        cumulRetraitsNets: 20000,
        cumulRetraitsNetsAuDeces: 20000,
        cumulFiscalite: 0,
        cumulFiscaliteAuDeces: 0,
        revenuAnnuelMoyenNet: 0,
        capitalRestant: 0,
        capitalRestantAuDeces: 0,
        rows: [],
      },
      transmission: {
        regime: 'Aucun',
        capitalTransmis: 0,
        abattement: 0,
        assiette: 0,
        taxeForfaitaire: 0,
        taxeDmtg: 0,
        taxe: 0,
        capitalTransmisNet: 90000,
        psDeces: {
          applicable: false,
          assiette: 0,
          taux: 0,
          montant: 0,
          note: '',
        },
      },
      totaux: {
        effortTotal: 112000,
        revenusNetsEpargne: 12000,
        effortReel: 88000,
        economieIRTotal: 0,
        revenusNetsLiquidation: 20000,
        revenusNetsTotal: 20000,
        fiscaliteTotale: 0,
        capitalTransmisNet: 90000,
      },
    },
    produit2: {
      envelope: 'AV',
      envelopeLabel: 'Assurance-vie',
      epargne: {
        duree: 10,
        capitalAcquis: 150000,
        cumulVersements: 100000,
        cumulEffort: 100000,
        cumulEconomieIR: 0,
        plusValueLatente: 0,
        cumulPSFondsEuro: 0,
        cumulRevenusDistribues: 0,
        cumulFiscaliteRevenus: 0,
        cumulRevenusNetsPercus: 0,
        rows: [],
      },
      liquidation: {
        duree: 10,
        ageAuDeces: 85,
        cumulRetraitsBruts: 0,
        cumulRetraitsNets: 10000,
        cumulRetraitsNetsAuDeces: 10000,
        cumulFiscalite: 0,
        cumulFiscaliteAuDeces: 0,
        revenuAnnuelMoyenNet: 0,
        capitalRestant: 0,
        capitalRestantAuDeces: 0,
        rows: [],
      },
      transmission: {
        regime: 'Aucun',
        capitalTransmis: 0,
        abattement: 0,
        assiette: 0,
        taxeForfaitaire: 0,
        taxeDmtg: 0,
        taxe: 0,
        capitalTransmisNet: 80000,
        psDeces: {
          applicable: false,
          assiette: 0,
          taux: 0,
          montant: 0,
          note: '',
        },
      },
      totaux: {
        effortTotal: 100000,
        revenusNetsEpargne: 0,
        effortReel: 100000,
        economieIRTotal: 0,
        revenusNetsLiquidation: 10000,
        revenusNetsTotal: 10000,
        fiscaliteTotale: 0,
        capitalTransmisNet: 80000,
      },
    },
    deltas: {
      effortTotal: 12000,
      economieIR: 0,
      capitalAcquis: 30000,
      revenusNetsLiquidation: 10000,
      fiscaliteTotale: 0,
      capitalTransmisNet: 10000,
    },
    meilleurEffort: 'AV',
    meilleurRevenus: 'SCPI',
    meilleurTransmission: 'SCPI',
  };
}

function buildProps(): ComponentProps<typeof PlacementResultsPanel> {
  return {
    loading: false,
    hydrated: true,
    results: buildResults(),
    state: {
      client: { ageActuel: 45 },
      products: [
        { dureeEpargne: 10, envelope: 'SCPI', perBancaire: false },
        { dureeEpargne: 10, envelope: 'AV', perBancaire: false },
      ],
      transmission: { ageAuDeces: 85 },
    } as ComponentProps<typeof PlacementResultsPanel>['state'],
  };
}

describe('PlacementResultsPanel', () => {
  it('displays the recalculated effort total and its explanation', () => {
    const markup = renderToStaticMarkup(<PlacementResultsPanel {...buildProps()} />);

    expect(markup).toContain(shortEuro(112000));
    expect(markup).toContain(shortEuro(100000));
    expect(markup).toContain('Effort total');
    expect(markup).toContain('Versements sur la période - économies d&#x27;impôt + revenus nets perçus sur la période');
    expect(markup).not.toContain(shortEuro(88000));
  });
});
