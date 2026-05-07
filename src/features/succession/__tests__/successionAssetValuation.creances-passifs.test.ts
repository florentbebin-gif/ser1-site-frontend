import { describe, expect, it } from 'vitest';
import { computeSuccessionAssetValuation } from '../successionAssetValuation';

const marriedCivilContext = {
  situationMatrimoniale: 'marie' as const,
  regimeMatrimonial: 'communaute_legale' as const,
  pacsConvention: 'separation' as const,
};

describe('computeSuccessionAssetValuation - créances et passifs', () => {
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

  it('interMassClaims enabled=false : aucun ajustement applique sur assetNetTotals', () => {
    // Une claim désactivée (enabled=false) ne doit pas modifier les masses nettes,
    // même si fromPocket et toPocket sont différents et que les montants sont valides.
    const result = computeSuccessionAssetValuation({
      civilContext: marriedCivilContext,
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'claim-disabled',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            amount: 50_000,
            enabled: false,
          },
          {
            id: 'claim-creance-disabled',
            kind: 'creance',
            fromPocket: 'epoux1',
            toPocket: 'epoux2',
            amount: 30_000,
            enabled: false,
          },
        ],
      },
      assetEntries: [
        { id: 'a1', pocket: 'communaute', category: 'financier', subCategory: 'Titres', amount: 200_000 },
        { id: 'a2', pocket: 'epoux1', category: 'financier', subCategory: 'Comptes', amount: 100_000 },
        { id: 'a3', pocket: 'epoux2', category: 'financier', subCategory: 'Comptes', amount: 80_000 },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    expect(result.assetNetTotals.commun).toBe(200_000);
    expect(result.assetNetTotals.epoux1).toBe(100_000);
    expect(result.assetNetTotals.epoux2).toBe(80_000);
    // Le moteur retourne un objet summary même quand toutes les claims sont disabled,
    // mais aucun ajustement n'est appliqué (configured=false, totalAppliedAmount=0)
    expect(result.interMassClaimsSummary?.configured).toBe(false);
    expect(result.interMassClaimsSummary?.totalAppliedAmount).toBe(0);
    expect(result.interMassClaimsSummary?.claims).toHaveLength(0);
  });
});
