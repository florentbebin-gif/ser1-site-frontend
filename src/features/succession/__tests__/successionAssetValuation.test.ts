import { describe, expect, it } from 'vitest';
import {
  computeSuccessionAssetValuation,
  normalizeResidencePrincipaleAssetEntries,
} from '../successionAssetValuation';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from '../successionSimulator.constants';

const marriedCivilContext = {
  situationMatrimoniale: 'marie' as const,
  regimeMatrimonial: 'communaute_legale' as const,
  pacsConvention: 'separation' as const,
};

describe('computeSuccessionAssetValuation', () => {
  it('applies the legal 5 percent forfait mobilier on taxable assets', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 200000 },
        { id: 'asset-2', pocket: 'communaute', category: 'immobilier', subCategory: 'Residence secondaire', amount: 300000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'auto',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.forfaitMobilierComputed).toBe(25000);
    expect(result.forfaitMobilierParOwner.epoux1).toBe(10000);
    expect(result.forfaitMobilierParOwner.commun).toBe(15000);
    expect(result.assetNetTotals.epoux1).toBe(200000);
    expect(result.assetNetTotals.commun).toBe(300000);
    expect(result.taxableNetTotals.epoux1).toBe(210000);
    expect(result.taxableNetTotals.commun).toBe(315000);
  });

  it('supports a custom forfait mobilier percentage', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 100000 },
        { id: 'asset-2', pocket: 'epoux2', category: 'financier', subCategory: 'Titres', amount: 200000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'pct',
      forfaitMobilierPct: 12,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.forfaitMobilierComputed).toBe(36000);
    expect(result.forfaitMobilierParOwner.epoux1).toBe(12000);
    expect(result.forfaitMobilierParOwner.epoux2).toBe(24000);
    expect(result.assetNetTotals.epoux1).toBe(100000);
    expect(result.assetNetTotals.epoux2).toBe(200000);
    expect(result.taxableNetTotals.epoux1).toBe(112000);
    expect(result.taxableNetTotals.epoux2).toBe(224000);
  });

  it('supports a fixed forfait mobilier amount', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'montant',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 50000,
      abattementResidencePrincipale: false,
    });

    expect(result.forfaitMobilierComputed).toBe(50000);
    expect(result.forfaitMobilierParOwner.epoux1).toBe(50000);
    expect(result.assetNetTotals.epoux1).toBe(100000);
    expect(result.taxableNetTotals.epoux1).toBe(150000);
  });

  it('does not compute any forfait mobilier when disabled', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 50000,
      abattementResidencePrincipale: false,
    });

    expect(result.forfaitMobilierComputed).toBe(0);
    expect(result.forfaitMobilierParOwner.epoux1).toBe(0);
    expect(result.assetNetTotals.epoux1).toBe(100000);
    expect(result.taxableNetTotals.epoux1).toBe(100000);
  });

  it('normalizes multiple main residences and applies the 20 percent abatement only once', () => {
    const normalized = normalizeResidencePrincipaleAssetEntries([
      { id: 'asset-1', pocket: 'epoux1', category: 'immobilier', subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY, amount: 400000 },
      { id: 'asset-2', pocket: 'communaute', category: 'immobilier', subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY, amount: 200000 },
    ]);

    expect(normalized.map((entry) => entry.subCategory)).toEqual([
      RESIDENCE_PRINCIPALE_SUBCATEGORY,
      RESIDENCE_SECONDAIRE_SUBCATEGORY,
    ]);

    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: normalized,
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'montant',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: true,
    });

    expect(result.hasResidencePrincipale).toBe(true);
    expect(result.residencePrincipaleEntryId).toBe('asset-1');
    expect(result.assetNetTotals.epoux1).toBe(400000);
    expect(result.assetNetTotals.commun).toBe(200000);
    expect(result.actifsTaxablesParOwner.epoux1).toBe(400000);
    expect(result.actifsTaxablesParOwner.commun).toBe(200000);
    expect(result.transmissionBasis.residencePrincipaleEntry).toEqual({
      pocket: 'epoux1',
      valeurTotale: 400000,
    });
  });

  it('adds the forfait before clamping taxable net assets to zero', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
        { id: 'passif-1', pocket: 'epoux1', category: 'passif', subCategory: 'Dettes', amount: 103000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'auto',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.forfaitMobilierComputed).toBe(5000);
    expect(result.assetNetTotals.epoux1).toBe(0);
    expect(result.taxableNetTotals.epoux1).toBe(2000);
  });

  it('integrates GFA taxable value into succession assets', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [],
      groupementFoncierEntries: [
        { id: 'gf-1', pocket: 'epoux1', type: 'GFA', valeurTotale: 10_000_000 },
      ],
      forfaitMobilierMode: 'auto',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetBreakdown.actifs.epoux1).toBe(10_000_000);
    expect(result.actifsTaxablesParOwner.epoux1).toBe(4_850_000);
    expect(result.forfaitMobilierComputed).toBe(242500);
    expect(result.assetNetTotals.epoux1).toBe(10_000_000);
    expect(result.taxableNetTotals.epoux1).toBe(5_092_500);
    expect(result.transmissionBasis.groupementFoncierEntries).toEqual([
      expect.objectContaining({ type: 'GFA', valeurTotale: 10_000_000 }),
    ]);
    expect(result.transmissionBasis.hasBeneficiaryLevelGfAdjustment).toBe(true);
  });

  it('keeps the 75 percent forest exemption without monetary cap for GFF', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [],
      groupementFoncierEntries: [
        { id: 'gf-1', pocket: 'communaute', type: 'GFF', valeurTotale: 10_000_000 },
      ],
      forfaitMobilierMode: 'auto',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetBreakdown.actifs.commun).toBe(10_000_000);
    expect(result.actifsTaxablesParOwner.commun).toBe(2_500_000);
    expect(result.forfaitMobilierComputed).toBe(125000);
    expect(result.assetNetTotals.commun).toBe(10_000_000);
    expect(result.taxableNetTotals.commun).toBe(2_625_000);
    expect(result.transmissionBasis.hasBeneficiaryLevelGfAdjustment).toBe(false);
  });

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
        { id: 'asset-1', pocket: 'communaute', category: 'financier', subCategory: 'Titres', amount: 200000 },
        { id: 'asset-2', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 100000 },
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

  it('créance époux1 → époux2 : assetNetTotals redistribués correctement', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'creance',
            fromPocket: 'epoux1',
            toPocket: 'epoux2',
            amount: 30_000,
            enabled: true,
          },
        ],
      },
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'financier', subCategory: 'Titres', amount: 100_000 },
        { id: 'asset-2', pocket: 'epoux2', category: 'financier', subCategory: 'Comptes', amount: 80_000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.interMassClaimsSummary.totalAppliedAmount).toBe(30_000);
    expect(result.assetNetTotals.epoux1).toBe(70_000);  // 100 000 - 30 000
    expect(result.assetNetTotals.epoux2).toBe(110_000); // 80 000 + 30 000
  });

  it('récompense avec masse débitrice insuffisante : plafonnée et warning généré', () => {
    // communauté ne dispose que de 40 000, récompense demandée = 100 000
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            amount: 100_000,
            enabled: true,
          },
        ],
      },
      assetEntries: [
        { id: 'asset-1', pocket: 'communaute', category: 'financier', subCategory: 'Comptes', amount: 40_000 },
        { id: 'asset-2', pocket: 'epoux1', category: 'financier', subCategory: 'Titres', amount: 200_000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    const claim = result.interMassClaimsSummary.claims[0];
    expect(claim.requestedAmount).toBe(100_000);
    expect(claim.appliedAmount).toBe(40_000); // plafonné
    expect(result.interMassClaimsSummary.warnings.some((w) => w.includes('plafonne'))).toBe(true);
    expect(result.assetNetTotals.commun).toBe(0);
    expect(result.assetNetTotals.epoux1).toBe(240_000); // 200 000 + 40 000
  });

  it('créance avec masse débitrice = masse créancière : ignorée, warning généré', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'creance',
            fromPocket: 'epoux1',
            toPocket: 'epoux1',
            amount: 50_000,
            enabled: true,
          },
        ],
      },
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 200_000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.interMassClaimsSummary.claims[0].appliedAmount).toBe(0);
    expect(result.interMassClaimsSummary.warnings.some((w) => w.includes('identiques'))).toBe(true);
    expect(result.assetNetTotals.epoux1).toBe(200_000); // inchangé
  });

  it('summarizes affected liabilities by pocket', () => {
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      assetEntries: [
        { id: 'asset-1', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 120000 },
        { id: 'passif-1', pocket: 'epoux1', category: 'passif', subCategory: 'Emprunt', amount: 30000 },
        { id: 'passif-2', pocket: 'communaute', category: 'passif', subCategory: 'Dette fiscale', amount: 15000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.affectedLiabilitySummary.totalAmount).toBe(45000);
    expect(result.affectedLiabilitySummary.byPocket).toEqual([
      { pocket: 'epoux1', amount: 30000 },
      { pocket: 'communaute', amount: 15000 },
    ]);
  });
});
