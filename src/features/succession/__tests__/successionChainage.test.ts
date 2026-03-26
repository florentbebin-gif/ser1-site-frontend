import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  type SuccessionDonationEntry,
  type SuccessionCivilContext,
  type SuccessionDevolutionContextInput,
  type SuccessionLiquidationContext,
} from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';

function makeCivil(overrides: Partial<SuccessionCivilContext>): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeLiquidation(overrides: Partial<SuccessionLiquidationContext>): SuccessionLiquidationContext {
  return {
    actifEpoux1: 400000,
    actifEpoux2: 200000,
    actifCommun: 300000,
    nbEnfants: 2,
    ...overrides,
  };
}

function makeDevolution(overrides: SuccessionDevolutionContextInput = {}) {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
  };
}

const DONATION_SETTINGS = {
  rappelFiscalAnnees: 15,
  donFamilial790G: {
    montant: 31865,
    conditions: 'Donateur < 80 ans, donataire majeur',
  },
  donManuel: {
    abattementRenouvellement: 15,
  },
} as const;

describe('buildSuccessionChainageAnalysis', () => {
  it('returns an applicable chainage with total rights', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({}),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
    expect(analysis.totalDroits).toBeGreaterThanOrEqual(0);
  });

  it('changes step 1 mass when death order is inverted on asymmetrical own assets', () => {
    const epoux1First = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 100000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    const epoux2First = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 100000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux2',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(epoux1First.step1?.actifTransmis).not.toBe(epoux2First.step1?.actifTransmis);
  });

  it('emits a warning and zero rights without children', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ nbEnfants: 0 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((warning) => warning.includes('Aucun enfant'))).toBe(true);
  });

  it('splits a represented branch across grandchildren and emits a warning', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ nbEnfants: 1 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun', deceased: true },
      ],
      familyMembers: [
        { id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' },
        { id: 'PG2', type: 'petit_enfant', parentEnfantId: 'E2' },
      ],
    });

    expect(analysis.totalDroits).toBeGreaterThan(0);
    expect(analysis.warnings.some((warning) => warning.includes('representation successorale simplifiee'))).toBe(true);
  });

  it('shares the represented branch allowance across grandchildren at step 1', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 800000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun', deceased: true },
      ],
      familyMembers: [
        { id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' },
        { id: 'PG2', type: 'petit_enfant', parentEnfantId: 'E2' },
      ],
    });

    expect(analysis.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.droits).toBe(38194);
    expect(analysis.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'PG1')?.droits).toBe(18194);
    expect(analysis.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'PG2')?.droits).toBe(18194);
  });

  it('keeps only the deceased branch descendants at step 1', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 300000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'epoux2' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['conjoint', 'E1']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E2']);
  });

  it('keeps a common child on both steps and limits a separate child to its branch', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 450000, actifEpoux2: 250000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'epoux1' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['conjoint', 'E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual(['E1']);
  });

  it('keeps stable labels in a symmetric blended family', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 450000, actifEpoux2: 350000, actifCommun: 0, nbEnfants: 3 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'commun' },
        { id: 'E3', rattachement: 'epoux2' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.label)).toEqual(['Conjoint survivant', 'E1', 'E2']);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.label)).toEqual(['E2', 'E3']);
  });

  it('values total usufruct at step 1 and does not carry it into step 2', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        dateNaissanceEpoux1: '1955-06-01',
        dateNaissanceEpoux2: '1957-05-12',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(analysis.step1?.partConjoint).toBe(200000);
    expect(analysis.step1?.partEnfants).toBe(300000);
    expect(analysis.step2?.actifTransmis).toBe(200000);
    expect(analysis.warnings.some((warning) => warning.includes('usufruit total valorise'))).toBe(true);
  });

  it('uses referenceDate to update usufruct valuation thresholds', () => {
    const baseInput = {
      civil: makeCivil({
        dateNaissanceEpoux1: '1960-01-01',
        dateNaissanceEpoux2: '1970-06-15',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens' as const,
      order: 'epoux1' as const,
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'usufruit_total' as const,
        preciputMontant: 0,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' as const },
        { id: 'E2', rattachement: 'commun' as const },
      ],
      familyMembers: [],
    };

    const earlyDeath = buildSuccessionChainageAnalysis({
      ...baseInput,
      referenceDate: new Date('2030-06-14T00:00:00Z'),
    });
    const laterDeath = buildSuccessionChainageAnalysis({
      ...baseInput,
      referenceDate: new Date('2036-06-16T00:00:00Z'),
    });

    expect(earlyDeath.step1?.partConjoint).toBe(250000);
    expect(earlyDeath.step1?.partEnfants).toBe(250000);
    expect(laterDeath.step1?.partConjoint).toBe(200000);
    expect(laterDeath.step1?.partEnfants).toBe(300000);
  });

  it('uses the testament of the side selected by death order', () => {
    const baseInput = {
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 280000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens' as const,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' as const },
        { id: 'E2', rattachement: 'commun' as const },
      ],
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 25,
            particularLegacies: [],
          },
          epoux2: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'enfant:E2',
            quotePartPct: 25,
            particularLegacies: [],
          },
        },
      }),
    };

    const epoux1First = buildSuccessionChainageAnalysis({
      ...baseInput,
      order: 'epoux1',
    });
    const epoux2First = buildSuccessionChainageAnalysis({
      ...baseInput,
      order: 'epoux2',
    });

    expect(epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut).toBeGreaterThan(
      epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut ?? 0,
    );
    expect(epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut).toBeGreaterThan(
      epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut ?? 0,
    );
  });

  it('deducts preciput from step 1 estate and carries it to step 2', () => {
    const enfants = [
      { id: 'E1', rattachement: 'commun' as const },
      { id: 'E2', rattachement: 'commun' as const },
    ];

    const withoutPreciput = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
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
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
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

    // Without preciput: firstEstate=500k, conjoint 1/4=125k, enfants 3/4=375k, step2=200k+125k=325k
    // With preciput 100k: taxable=400k, conjoint 1/4=100k, enfants 3/4=300k, step2=200k+100k+100k=400k
    expect(withoutPreciput.step1!.actifTransmis).toBe(500000);
    expect(withPreciput.step1!.actifTransmis).toBe(400000);
    expect(withPreciput.step1!.partConjoint).toBeLessThan(withoutPreciput.step1!.partConjoint);
    expect(withPreciput.step1!.partEnfants).toBeLessThan(withoutPreciput.step1!.partEnfants);
    // Step 2 is larger: preciput adds 100k but carryOver drops by 25k, net +75k
    expect(withPreciput.step2!.actifTransmis).toBe(400000);
    expect(withoutPreciput.step2!.actifTransmis).toBe(325000);
    expect(withPreciput.step2!.actifTransmis).toBeGreaterThan(withoutPreciput.step2!.actifTransmis);
    expect(withPreciput.warnings.some((warning) => warning.includes('preciput'))).toBe(true);
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

    expect(analysis.step1?.actifTransmis).toBe(120000);
    expect(analysis.step2?.actifTransmis).toBe(410000);
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

    expect(analysis.step1?.actifTransmis).toBe(170000);
    expect(analysis.step2?.actifTransmis).toBe(372500);
    expect(analysis.warnings.some((warning) => warning.includes('fallback sur le montant global'))).toBe(true);
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
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
      ],
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

  it('reports the full first estate to step 2 in communaute universelle with attribution integrale', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
      liquidation: makeLiquidation({ actifEpoux1: 200000, actifEpoux2: 300000, actifCommun: 1_500_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: true,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'pleine_propriete_totale',
        preciputMontant: 100000,
      },
    });

    expect(analysis.step1?.actifTransmis).toBe(2_000_000);
    expect(analysis.step1?.partConjoint).toBe(2_000_000);
    expect(analysis.step1?.partEnfants).toBe(0);
    expect(analysis.step1?.droitsEnfants).toBe(0);
    expect(analysis.step2?.actifTransmis).toBe(2_000_000);
    expect(analysis.totalDroits).toBe(analysis.step2?.droitsEnfants ?? 0);
    expect(analysis.warnings.some((warning) => warning.includes('attribution integrale'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('preciput ignoree'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('donation entre epoux ignoree'))).toBe(true);
  });

  it("liquidates the societe d'acquets pocket with contractual quotes", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
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
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 40,
          quoteEpoux2Pct: 60,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(460000);
    expect(analysis.step1?.partConjoint).toBe(115000);
    expect(analysis.step1?.partEnfants).toBe(345000);
    expect(analysis.step2?.actifTransmis).toBe(555000);
    expect(analysis.societeAcquets).toMatchObject({
      totalValue: 400000,
      firstEstateContribution: 160000,
      survivorShare: 240000,
      deceasedQuotePct: 40,
      survivorQuotePct: 60,
      liquidationMode: 'quotes',
    });
    expect(analysis.warnings.some((warning) => warning.includes("Societe d'acquets"))).toBe(true);
  });

  it("applies a preliminary survivor attribution before splitting the societe d'acquets pocket", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
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
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        societeAcquets: {
          active: true,
          liquidationMode: 'attribution_survivant',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 25,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(450000);
    expect(analysis.step1?.partConjoint).toBe(112500);
    expect(analysis.step2?.actifTransmis).toBe(562500);
    expect(analysis.societeAcquets?.survivorAttributionAmount).toBe(100000);
    expect(analysis.warnings.some((warning) => warning.includes('attribution prealable'))).toBe(true);
  });

  it("can report the whole societe d'acquets pocket to the survivor while keeping the deceased own assets in step 1", () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens_societe_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 200000, actifCommun: 400000, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      patrimonial: {
        attributionIntegrale: true,
        donationEntreEpouxActive: false,
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 50000,
        societeAcquets: {
          active: true,
          liquidationMode: 'quotes',
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
          attributionSurvivantPct: 0,
        },
      },
      societeAcquetsNetValue: 400000,
    });

    expect(analysis.step1?.actifTransmis).toBe(300000);
    expect(analysis.step1?.partConjoint).toBe(75000);
    expect(analysis.step2?.actifTransmis).toBe(675000);
    expect(analysis.societeAcquets?.attributionIntegrale).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('attribution integrale du reliquat'))).toBe(true);
  });

  it('applies a simplified participation claim when the dedicated config is active', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'participation_acquets' }),
      liquidation: makeLiquidation({ actifEpoux1: 500000, actifEpoux2: 200000, actifCommun: 0, nbEnfants: 2 }),
      regimeUsed: 'separation_biens',
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
        donationEntreEpouxOption: 'usufruit_total',
        preciputMontant: 0,
        participationAcquets: {
          active: true,
          useCurrentAssetsAsFinalPatrimony: true,
          patrimoineOriginaireEpoux1: 100000,
          patrimoineOriginaireEpoux2: 100000,
          patrimoineFinalEpoux1: 0,
          patrimoineFinalEpoux2: 0,
          quoteEpoux1Pct: 50,
          quoteEpoux2Pct: 50,
        },
      },
    });

    expect(analysis.participationAcquets).toMatchObject({
      active: true,
      creditor: 'epoux2',
      debtor: 'epoux1',
      quoteAppliedPct: 50,
      creanceAmount: 150000,
      firstEstateAdjustment: -150000,
    });
    expect(analysis.step1?.actifTransmis).toBe(350000);
    expect(analysis.step2?.actifTransmis).toBe(437500);
    expect(analysis.warnings.some((warning) => warning.includes('Participation aux acquets'))).toBe(true);
  });

  it('applies the residence principale abatement on step 1 only in chainage', () => {
    const transmissionBasis = {
      ordinaryTaxableAssetsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 1_000_000,
        societe_acquets: 0,
        indivision_pacse: 0,
        indivision_concubinage: 0,
      },
      passifsParPocket: {
        epoux1: 0,
        epoux2: 0,
        communaute: 0,
        societe_acquets: 0,
        indivision_pacse: 0,
        indivision_concubinage: 0,
      },
      groupementFoncierEntries: [],
      hasBeneficiaryLevelGfAdjustment: false,
      residencePrincipaleEntry: {
        pocket: 'communaute' as const,
        valeurTotale: 1_000_000,
      },
    };

    const withoutAbatement = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 1_000_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      transmissionBasis,
      abattementResidencePrincipale: false,
    });
    const withAbatement = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 1_000_000, nbEnfants: 2 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      transmissionBasis,
      abattementResidencePrincipale: true,
    });

    expect(withAbatement.step1?.droitsEnfants).toBeLessThan(withoutAbatement.step1?.droitsEnfants ?? 0);
    expect(withAbatement.step2?.droitsEnfants).toBe(withoutAbatement.step2?.droitsEnfants);
    expect(
      withAbatement.warnings.some((warning) => warning.includes('abattement residence principale 20 % applique')),
    ).toBe(true);
  });
});
