import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import type { SuccessionDonationEntry } from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import {
  DONATION_SETTINGS,
  makeCivil,
  makeDevolution,
  makeLiquidation,
} from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis - patrimonial flows', () => {
  it('deducts preciput from step 1 estate and carries it to step 2', () => {
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];

    const withoutPreciput = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 200000, actifCommun: 500000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        preciputMontant: 0,
      },
    });

    const withPreciput = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 200000, actifCommun: 500000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: enfants,
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        preciputMontant: 100000,
      },
    });

    expect(withoutPreciput.step1!.actifTransmis).toBe(250000);
    expect(withPreciput.step1!.actifTransmis).toBe(200000);
    expect(withPreciput.step1!.partConjoint).toBeLessThan(withoutPreciput.step1!.partConjoint);
    expect(withPreciput.step1!.partEnfants).toBeLessThan(withoutPreciput.step1!.partEnfants);
    expect(withPreciput.step2!.actifTransmis).toBe(550000);
    expect(withoutPreciput.step2!.actifTransmis).toBe(512500);
    expect(withPreciput.step2!.actifTransmis).toBeGreaterThan(withoutPreciput.step2!.actifTransmis);
    expect(withPreciput.preciput).not.toBeNull();
    expect(withPreciput.preciput!.appliedAmount).toBe(100000);
  });

  it('prioritizes targeted preciput selections over the global fallback amount', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 100000, actifEpoux2: 200000, actifCommun: 200000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        preciputMode: 'cible',
        preciputMontant: 10000,
        preciputSelections: [{
          id: 'prec-1',
          sourceType: 'asset',
          sourceId: 'asset-comm-1',
          labelSnapshot: 'Portefeuille titres',
          pocket: 'communaute',
          amount: 80000,
          enabled: true,
        }],
      },
      assetEntries: [
        {
          id: 'asset-comm-1',
          pocket: 'communaute',
          category: 'financier',
          subCategory: 'Titres',
          amount: 80000,
          label: 'Portefeuille titres',
        },
        {
          id: 'asset-comm-2',
          pocket: 'communaute',
          category: 'financier',
          subCategory: 'Tresorerie',
          amount: 120000,
        },
      ],
      groupementFoncierEntries: [],
    });

    expect(analysis.step1?.actifTransmis).toBe(160000);
    expect(analysis.step2?.actifTransmis).toBe(380000);
    expect(analysis.warnings.some((warning) => warning.includes('Preciput cible'))).toBe(true);
    expect(analysis.preciput).toMatchObject({
      mode: 'cible',
      appliedAmount: 80000,
      usesGlobalFallback: false,
    });
    expect(analysis.preciput?.selections).toEqual([
      expect.objectContaining({
        label: 'Portefeuille titres (Titres)',
        appliedAmount: 80000,
      }),
    ]);
  });

  it('falls back to the global preciput amount when targeted selections are no longer compatible', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 100000, actifEpoux2: 200000, actifCommun: 200000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'pleine_propriete_quotite',
        preciputMode: 'cible',
        preciputMontant: 30000,
        preciputSelections: [{
          id: 'prec-1',
          sourceType: 'asset',
          sourceId: 'asset-introuvable',
          labelSnapshot: 'Bien supprime',
          pocket: 'communaute',
          amount: 80000,
          enabled: true,
        }],
      },
      assetEntries: [{
        id: 'asset-comm-2',
        pocket: 'communaute',
        category: 'financier',
        subCategory: 'Tresorerie',
        amount: 120000,
      }],
      groupementFoncierEntries: [],
    });

    expect(analysis.step1?.actifTransmis).toBe(185000);
    expect(analysis.step2?.actifTransmis).toBe(361250);
    expect(analysis.warnings.some((warning) => warning.includes('repli sur le montant global'))).toBe(true);
  });

  it('reinjects survivor insurance inflows into step 2 estate', () => {
    const baseInput = {
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens' as const,
      order: 'epoux1' as const,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' as const },
        { id: 'E2', rattachement: 'commun' as const },
      ],
      familyMembers: [],
    };

    const withoutInflows = buildSuccessionChainageAnalysis(baseInput);
    const withInflows = buildSuccessionChainageAnalysis({
      ...baseInput,
      survivorEconomicInflows: {
        epoux1: 80000,
        epoux2: 0,
      },
    });

    expect(withoutInflows.step2?.actifTransmis).toBe(325000);
    expect(withInflows.step2?.actifTransmis).toBe(405000);
    expect(withInflows.warnings.some((warning) => warning.includes('capitaux assurances nets recycles'))).toBe(true);
  });

  it('integrates donation recall into step 1 heir rights for the matching donor and donee', () => {
    const donations: SuccessionDonationEntry[] = [{
      id: 'don-1',
      type: 'rapportable',
      montant: 100000,
      valeurDonation: 150000,
      date: '2020-06',
      donateur: 'epoux1',
      donataire: 'E1',
    }];

    const withoutRecall = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 1 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });
    const withRecall = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 1 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      referenceDate: new Date('2026-01-01T00:00:00Z'),
      donations,
      donationSettings: DONATION_SETTINGS,
    });

    const childWithoutRecall = withoutRecall.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1');
    const childWithRecall = withRecall.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1');

    expect(childWithoutRecall?.droits).toBeGreaterThan(0);
    expect((childWithRecall?.droits ?? 0)).toBeGreaterThan(childWithoutRecall?.droits ?? 0);
  });

  it('ignores at step 2 a testament still aimed at the already deceased spouse', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 250000, actifCommun: 0, nbEnfants: 1 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [{ id: 'E1', rattachement: 'commun' }],
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux2: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux1',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
    });

    expect(analysis.step2?.beneficiaries.some((beneficiary) => beneficiary.id === 'conjoint')).toBe(false);
    expect(analysis.warnings.some((warning) => warning.includes('deja decede ignore au second deces'))).toBe(true);
  });
});
