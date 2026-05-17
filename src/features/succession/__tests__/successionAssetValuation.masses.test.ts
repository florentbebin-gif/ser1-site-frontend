import { describe, expect, it } from 'vitest';
import { computeSuccessionAssetValuation } from '../successionAssetValuation';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from '../successionSimulator.constants';

const marriedCivilContext = {
  situationMatrimoniale: 'marie' as const,
  regimeMatrimonial: 'communaute_legale' as const,
  pacsConvention: 'separation' as const,
};

describe('computeSuccessionAssetValuation - masses patrimoniales', () => {
  it('persists the indivision pocket in the transmission basis when the shared mass is not a communaute', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: {
        situationMatrimoniale: 'pacse',
        regimeMatrimonial: null,
        pacsConvention: 'indivision',
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'indivision_pacse',
          category: 'immobilier',
          subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY,
          amount: 300000,
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.transmissionBasis.residencePrincipaleEntry).toEqual({
      pocket: 'indivision_pacse',
      valeurTotale: 300000,
    });
  });

  it('keeps explicit propres par nature outside the simplified common mass in communaute universelle when the stipulation is active', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_universelle',
        pacsConvention: 'separation',
      },
      patrimonialContext: {
        stipulationContraireCU: true,
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Titres',
          amount: 150000,
        },
        {
          id: 'asset-2',
          pocket: 'epoux2',
          category: 'immobilier',
          subCategory: RESIDENCE_SECONDAIRE_SUBCATEGORY,
          amount: 80000,
          legalNature: 'propre_par_nature',
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetNetTotals.commun).toBe(150000);
    expect(result.assetNetTotals.epoux2).toBe(80000);
    expect(result.assetNetTotals.epoux1).toBe(0);
  });

  it('routes qualified meubles to the simplified common mass in communaute de meubles et acquets', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_meubles_acquets',
        pacsConvention: 'separation',
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Titres',
          amount: 120000,
          meubleImmeubleLegal: 'meuble',
        },
        {
          id: 'asset-2',
          pocket: 'epoux1',
          category: 'immobilier',
          subCategory: RESIDENCE_SECONDAIRE_SUBCATEGORY,
          amount: 250000,
          meubleImmeubleLegal: 'immeuble',
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetNetTotals.commun).toBe(120000);
    expect(result.assetNetTotals.epoux1).toBe(250000);
  });

  it('applies inter-mass claims before computing net pocket totals and taxable basis', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      patrimonialContext: {
        stipulationContraireCU: false,
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            amount: 50000,
            enabled: true,
            label: 'Recompense communaute / epoux 1',
          },
        ],
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'communaute',
          category: 'financier',
          subCategory: 'Titres',
          amount: 200000,
        },
        {
          id: 'asset-2',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 100000,
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.interMassClaimsSummary.totalAppliedAmount).toBe(50000);
    expect(result.assetNetTotals.commun).toBe(150000);
    expect(result.assetNetTotals.epoux1).toBe(150000);
    expect(result.transmissionBasis.ordinaryTaxableAssetsParPocket.communaute).toBe(150000);
    expect(result.transmissionBasis.ordinaryTaxableAssetsParPocket.epoux1).toBe(150000);
  });

  it('splits indivision_separatiste entries into epoux1/epoux2 based on quotePartEpoux1Pct', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        pacsConvention: 'separation',
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'indivision_separatiste',
          category: 'immobilier',
          subCategory: RESIDENCE_SECONDAIRE_SUBCATEGORY,
          amount: 500000,
          quotePartEpoux1Pct: 60,
        },
        {
          id: 'asset-2',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 100000,
        },
      ],
      groupementFoncierEntries: [
        {
          id: 'gf-1',
          pocket: 'indivision_separatiste',
          type: 'GFF',
          valeurTotale: 200000,
          quotePartEpoux1Pct: 40,
        },
      ],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    // Asset 500k split: ep1 gets 300k, ep2 gets 200k
    // Plus ep1 own asset 100k → ep1 total = 400k, ep2 = 200k
    expect(result.assetNetTotals.epoux1).toBe(400000 + 80000);
    expect(result.assetNetTotals.epoux2).toBe(200000 + 120000);
    expect(result.assetNetTotals.commun).toBe(0);

    // GF 200k split: ep1 gets 80k, ep2 gets 120k
    // assetBreakdown includes both ordinary + GF
    expect(result.assetBreakdown.actifs.epoux1).toBe(480000);
    expect(result.assetBreakdown.actifs.epoux2).toBe(320000);

    // Transmission basis should have zero in indivision_separatiste
    expect(result.transmissionBasis.ordinaryTaxableAssetsParPocket.indivision_separatiste).toBe(0);
    expect(result.transmissionBasis.ordinaryTaxableAssetsParPocket.epoux1).toBe(400000);
    expect(result.transmissionBasis.ordinaryTaxableAssetsParPocket.epoux2).toBe(200000);
  });

  it('defaults quotePartEpoux1Pct to 50% when not specified for indivision_separatiste', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: {
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        pacsConvention: 'separation',
      },
      assetEntries: [
        {
          id: 'asset-1',
          pocket: 'indivision_separatiste',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 200000,
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetNetTotals.epoux1).toBe(100000);
    expect(result.assetNetTotals.epoux2).toBe(100000);
  });
});
