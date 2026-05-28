import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '@/engine/succession/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { computeSuccessionAssetValuation } from '../successionAssetValuation';
import { makeCivil, makeLiquidation } from './successionChainage.test.helpers';

describe('récompenses → chainage end-to-end', () => {
  it('une récompense communauté→époux1 augmente step1.actifTransmis via assetNetTotals', () => {
    const valuationResult = computeSuccessionAssetValuation({
      civilContext: makeCivil({}),
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'claim-1',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            amount: 50_000,
            enabled: true,
          },
        ],
      },
      assetEntries: [
        {
          id: 'a1',
          pocket: 'communaute',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 200_000,
        },
        {
          id: 'a2',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Titres',
          amount: 100_000,
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    // Liquidation construite depuis assetNetTotals (comme useSuccessionSyncEffects:132-134)
    const liquidation = makeLiquidation({
      actifEpoux1: valuationResult.assetNetTotals.epoux1, // 150 000
      actifEpoux2: valuationResult.assetNetTotals.epoux2, // 0
      actifCommun: valuationResult.assetNetTotals.commun, // 150 000
      nbEnfants: 2,
    });

    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation,
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
    });

    // firstEstate = 150 000 + 0.5 × 150 000 = 225 000 (récompense appliquée)
    // sans récompense : firstEstate = 100 000 + 0.5 × 200 000 = 200 000 → régression détectée
    expect(analysis.step1?.actifTransmis).toBe(225_000);
    expect(analysis.step1?.partConjoint).toBe(56_250); // 225 000 × 1/4
    expect(analysis.step1?.partEnfants).toBe(168_750); // 225 000 × 3/4
  });

  it('une créance époux1→époux2 réduit actifEpoux1 et augmente actifEpoux2 avant step1', () => {
    // Créance : epoux1 doit 30k à epoux2 → actifEpoux1 net = 100k, actifEpoux2 net = 50k+30k = 80k
    // CL, propresEpoux1=130k, propresEpoux2=50k, actifCommun=200k
    // Après créance : propresEpoux1=100k, propresEpoux2=80k
    // firstEstate = 100k + 0.5 × 200k = 200k (propres réduits + moitié commun inchangée)
    // sans créance : firstEstate = 130k + 0.5 × 200k = 230k → régression détectée
    const valuationResult = computeSuccessionAssetValuation({
      civilContext: makeCivil({}),
      patrimonialContext: {
        interMassClaims: [
          {
            id: 'creance-1',
            kind: 'creance',
            fromPocket: 'epoux1',
            toPocket: 'epoux2',
            amount: 30_000,
            enabled: true,
          },
        ],
      },
      assetEntries: [
        {
          id: 'a1',
          pocket: 'epoux1',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 130_000,
        },
        {
          id: 'a2',
          pocket: 'epoux2',
          category: 'financier',
          subCategory: 'Comptes',
          amount: 50_000,
        },
        {
          id: 'a3',
          pocket: 'communaute',
          category: 'financier',
          subCategory: 'Titres',
          amount: 200_000,
        },
      ],
      groupementFoncierEntries: [],
      forfaitMobilierMode: 'off',
      forfaitMobilierPct: 5,
      forfaitMobilierMontant: 0,
      abattementResidencePrincipale: false,
    });

    const liquidation = makeLiquidation({
      actifEpoux1: valuationResult.assetNetTotals.epoux1, // 100 000
      actifEpoux2: valuationResult.assetNetTotals.epoux2, // 80 000
      actifCommun: valuationResult.assetNetTotals.commun, // 200 000
      nbEnfants: 2,
    });

    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation,
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(valuationResult.assetNetTotals.epoux1).toBe(100_000);
    expect(valuationResult.assetNetTotals.epoux2).toBe(80_000);
    expect(analysis.step1?.actifTransmis).toBe(200_000); // 100k + 0.5 × 200k
    expect(analysis.step1?.partConjoint).toBe(50_000); // 200k × 1/4
    expect(analysis.step1?.partEnfants).toBe(150_000); // 200k × 3/4
  });
});
