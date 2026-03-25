import { describe, expect, it } from 'vitest';
import {
  computeSuccessionAssetValuation,
  normalizeResidencePrincipaleAssetEntries,
} from '../successionAssetValuation';
import {
  RESIDENCE_PRINCIPALE_SUBCATEGORY,
  RESIDENCE_SECONDAIRE_SUBCATEGORY,
} from '../successionSimulator.constants';

describe('computeSuccessionAssetValuation', () => {
  it('applies the legal 5 percent forfait mobilier on taxable assets', () => {
    const result = computeSuccessionAssetValuation({
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 200000 },
        { id: 'asset-2', owner: 'commun', category: 'immobilier', subCategory: 'Residence secondaire', amount: 300000 },
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
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 100000 },
        { id: 'asset-2', owner: 'epoux2', category: 'financier', subCategory: 'Titres', amount: 200000 },
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
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
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
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
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
      { id: 'asset-1', owner: 'epoux1', category: 'immobilier', subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY, amount: 400000 },
      { id: 'asset-2', owner: 'commun', category: 'immobilier', subCategory: RESIDENCE_PRINCIPALE_SUBCATEGORY, amount: 200000 },
    ]);

    expect(normalized.map((entry) => entry.subCategory)).toEqual([
      RESIDENCE_PRINCIPALE_SUBCATEGORY,
      RESIDENCE_SECONDAIRE_SUBCATEGORY,
    ]);

    const result = computeSuccessionAssetValuation({
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
      owner: 'epoux1',
      valeurTotale: 400000,
    });
  });

  it('adds the forfait before clamping taxable net assets to zero', () => {
    const result = computeSuccessionAssetValuation({
      assetEntries: [
        { id: 'asset-1', owner: 'epoux1', category: 'divers', subCategory: 'Meubles', amount: 100000 },
        { id: 'passif-1', owner: 'epoux1', category: 'passif', subCategory: 'Dettes', amount: 103000 },
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
      assetEntries: [],
      groupementFoncierEntries: [
        { id: 'gf-1', owner: 'epoux1', type: 'GFA', valeurTotale: 10_000_000 },
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
      assetEntries: [],
      groupementFoncierEntries: [
        { id: 'gf-1', owner: 'commun', type: 'GFF', valeurTotale: 10_000_000 },
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
});
