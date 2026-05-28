import { describe, expect, it } from 'vitest';
import { computePlacementRoi } from '@/engine/placement';
import { buildSynthesisSpec } from '@/pptx/presets/placementDeckBuilder.helpers';
import type {
  PlacementData,
  PlacementProductData,
} from '@/pptx/presets/placementDeckBuilder.types';

function buildProductData(): PlacementProductData {
  return {
    envelopeLabel: 'SCPI',
    epargne: {
      capitalAcquis: 180000,
      cumulVersements: 100000,
      cumulEffort: 100000,
      cumulEconomieIR: 0,
    },
    liquidation: {
      cumulRetraitsNets: 20000,
      revenuAnnuelMoyenNet: 0,
      cumulFiscalite: 0,
    },
    transmission: {
      capitalTransmisNet: 90000,
      taxe: 0,
      regime: 'Aucun',
    },
    totaux: {
      effortTotal: 112000,
      effortReel: 88000,
      revenusNetsLiquidation: 20000,
      fiscaliteTotale: 0,
      capitalTransmisNet: 90000,
      revenusNetsTotal: 20000,
    },
    config: {
      tmi: 0,
      tmiRetraite: 0,
      rendementCapi: 0,
      rendementDistrib: 0,
      tauxRevalorisation: 0,
      repartitionCapi: 100,
      strategieDistribution: 'stocker',
      versementInitial: 0,
      versementAnnuel: 0,
      ponctuels: [],
      fraisEntree: 0,
      optionBaremeIR: false,
    },
    epargneRows: [],
    liquidationRows: [],
  };
}

describe('parité export Placement', () => {
  it('calcule le ROI PPTX avec la même source que l’UI', () => {
    const produit1 = buildProductData();
    const data: PlacementData = {
      ageActuel: 45,
      dureeEpargne: 10,
      ageAuDeces: 85,
      liquidationMode: 'epuiser',
      liquidationDuree: 10,
      liquidationMensualiteCible: 0,
      liquidationMontantUnique: 0,
      beneficiaryType: 'enfants',
      nbBeneficiaires: 2,
      dmtgTaux: null,
      produit1,
      produit2: null,
    };

    const spec = buildSynthesisSpec(data);

    expect(spec.produit1.roi).toBe(computePlacementRoi(produit1.totaux));
    expect(spec.produit1.roi).not.toBe(
      (produit1.totaux.revenusNetsLiquidation + produit1.totaux.capitalTransmisNet) /
        produit1.totaux.effortReel,
    );
    expect(spec.produit1.effortTotal).toBe(produit1.totaux.effortTotal);
  });
});
