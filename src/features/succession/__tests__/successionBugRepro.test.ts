import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG, type RegimeMatrimonial } from '../../../engine/civil';
import {
  buildSuccessionDraftPayload,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  parseSuccessionDraftPayload,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionDevolutionContextInput,
  type SuccessionEnfant,
  type SuccessionLiquidationContext,
} from '../successionDraft';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import {
  buildSuccessionDirectDisplayAnalysis,
  computeSuccessionDirectEstateBasis,
} from '../successionDisplay';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';

function makeCivil(overrides: Partial<SuccessionCivilContext> = {}): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null as RegimeMatrimonial | null,
    pacsConvention: 'separation',
    ...overrides,
  };
}

function makeDevolution(overrides: SuccessionDevolutionContextInput = {}): SuccessionDevolutionContext {
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
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

function makeLiquidation(
  overrides: Partial<SuccessionLiquidationContext> = {},
): SuccessionLiquidationContext {
  return {
    actifEpoux1: 0,
    actifEpoux2: 0,
    actifCommun: 0,
    nbEnfants: 0,
    ...overrides,
  };
}

function buildDirectAnalysis(options: {
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolutionContext?: SuccessionDevolutionContext;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: Parameters<typeof buildSuccessionDevolutionAnalysis>[5];
  order?: 'epoux1' | 'epoux2';
  actifNetSuccession?: number;
}) {
  const devolutionContext = options.devolutionContext ?? makeDevolution({});
  const enfantsContext = options.enfantsContext ?? [];
  const familyMembers = options.familyMembers ?? [];
  const order = options.order ?? 'epoux1';
  const basis = computeSuccessionDirectEstateBasis(options.civil, options.liquidation, order);
  const actifNetSuccession = options.actifNetSuccession ?? basis.actifNetSuccession;
  const devolution = buildSuccessionDevolutionAnalysis(
    options.civil,
    options.liquidation.nbEnfants,
    devolutionContext,
    actifNetSuccession,
    enfantsContext,
    familyMembers,
    { simulatedDeceased: order },
  );

  return buildSuccessionDirectDisplayAnalysis({
    civil: options.civil,
    devolution,
    devolutionContext,
    dmtgSettings: DEFAULT_DMTG,
    enfantsContext,
    familyMembers,
    order,
    actifNetSuccession,
    baseWarnings: basis.warnings,
  });
}

describe('V3 — red tests (Lot 0) — will be converted to it() when fixed', () => {
  // ── BUG 2: CU attribution 50% should not return 100% of patrimoine ──
  it.fails('BUG-2: CU attribution 50% — firstEstate should be ownDeceased + 50% communs, not all patrimoine', () => {
    // Without stipulation: everything is communauté, 50% goes to survivor
    // firstEstate should be totalPatrimoine * 50% = 1M, not 2M
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_universelle',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 200000,
        actifEpoux2: 300000,
        actifCommun: 1500000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      attributionBiensCommunsPct: 50,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    // Without stipulation in CU, all pockets are communauté
    // 50% attribution → firstEstate = totalPatrimoine * (1 - 50/100) = 1M
    expect(analysis.step1!.actifTransmis).toBe(1000000);
  });

  it.fails('BUG-2: CU attribution 50% with stipulation — firstEstate = propresDefunt + 50% communs = 950k', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_universelle',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 200000,
        actifEpoux2: 300000,
        actifCommun: 1500000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      attributionBiensCommunsPct: 50,
      patrimonial: {
        stipulationContraireCU: true,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    // With stipulation: propresDefunt = 200k, 50% of communs = 750k
    // firstEstate = 200k + 750k = 950k
    expect(analysis.step1!.actifTransmis).toBe(950000);
  });

  // ── BUG 1: CU attribution intégrale — step2 should not double-count ──
  it.fails('BUG-1: CU attribution integrale with stipulation — step1 = propres defunt only, step2 = 1.85M', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_universelle',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 200000,
        actifEpoux2: 300000,
        actifCommun: 1500000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        attributionIntegrale: true,
        stipulationContraireCU: true,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    // With attribution intégrale + stipulation:
    // - Communs 1.5M → all to survivor (attribution)
    // - Propres défunt 200k → succession step1
    //   conjoint 1/4 = 50k, enfants 3/4 = 150k
    // - Step2: 300k (own) + 1.5M (attributed) + 50k (carry-over) = 1.85M
    expect(analysis.step1!.actifTransmis).toBe(200000);
    expect(analysis.step2!.actifTransmis).toBe(1850000);
  });

  // ── BUG 9: Préciput global — should be applied at mass split level ──
  it.fails('BUG-9: preciput global in communauté — should reduce shared mass before split', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 0,
        actifEpoux2: 0,
        actifCommun: 1000000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        preciputMontant: 200000,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    // Communauté 1M, preciput 200k → shared after preciput = 800k
    // Part défunt = 800k / 2 = 400k (the estate for step1)
    // Survivor keeps: 400k (own half of shared) + 200k (preciput) = 600k base
    expect(analysis.step1!.actifTransmis).toBe(400000);
  });

  // ── BUG 11: Testament legs_universel conjoint — max not cumul ──
  it.fails('BUG-11: legs_universel au conjoint — part = max(legale, testamentaire), not sum', () => {
    const civil = makeCivil({
      situationMatrimoniale: 'marie',
      regimeMatrimonial: 'communaute_legale',
    });
    const analysis = buildSuccessionChainageAnalysis({
      civil,
      liquidation: makeLiquidation({
        actifEpoux1: 150000,
        actifEpoux2: 0,
        actifCommun: 150000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    // masse = 150k (half commun) + 150k (propres) = 300k... actually for communaute_legale:
    // firstEstate = propresDefunt + 50% commun = 150k + 75k = 225k
    // legal: conjoint 1/4 PP = 56250
    // testament legs_universel: QD = 1/3 with 2 children = 75k
    // Expected: conjoint part = max(56250, 75000) = 75000
    // Remaining: 225000 - 75000 = 150000, each child gets 75000
    const conjointBenef = analysis.step1?.beneficiaries.find((b) => b.id === 'conjoint');
    expect(conjointBenef?.brut).toBe(75000);
  });

  // ── BUG 3: PACS chainage engine works — bug is only in UI display filter ──
  it('BUG-3: PACS chainage — engine produces applicable analysis with testament (bug is UI-only)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        regimeMatrimonial: null,
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 400000,
        actifEpoux2: 200000,
        actifCommun: 0,
        nbEnfants: 2,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
    });

    expect(analysis.applicable).toBe(true);
    // Partenaire pacsé gets share via testament only (no legal heir)
    // With legs_universel, QD = 1/3 (2 enfants) = 133333
    // The testament carry-over should propagate to step 2
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
    expect(analysis.step2!.actifTransmis).toBeGreaterThan(0);
  });
});

describe('PR-04 — reproduction et triage des bugs succession non prouvés', () => {
  it('BUG-8/3.2: DDV usufruit total applique bien l’art. 669 a 70 ans au niveau moteur', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        dateNaissanceEpoux1: '1950-01-01',
        dateNaissanceEpoux2: '1955-07-01',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 1_000_000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 2,
      }),
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
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(analysis.step1?.actifTransmis).toBe(1_000_000);
    expect(analysis.step1?.partConjoint).toBe(400_000);
    expect(analysis.step1?.partEnfants).toBe(600_000);
    expect(analysis.totalDroits).toBe(76_388);
    expect(analysis.warnings.some((warning) => warning.includes('usufruit total valorise'))).toBe(true);
  });

  it('BUG-9/3.4: DDV mixte ne reproduit pas un total a 0 avec dates de naissance valides', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        dateNaissanceEpoux1: '1950-01-01',
        dateNaissanceEpoux2: '1955-07-01',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 1_000_000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 2,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
        preciputMontant: 0,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(analysis.step1?.actifTransmis).toBe(1_000_000);
    expect(analysis.step1?.partConjoint).toBe(550_000);
    expect(analysis.step1?.partEnfants).toBe(450_000);
    expect(analysis.totalDroits).toBeGreaterThan(0);
  });

  it('BUG-9/3.4: DDV mixte sans date de naissance replie sur 1/4 PP mais reste non nul', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        dateNaissanceEpoux1: '1950-01-01',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 1_000_000,
        actifEpoux2: 0,
        actifCommun: 0,
        nbEnfants: 2,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        attributionIntegrale: false,
        donationEntreEpouxActive: true,
        donationEntreEpouxOption: 'mixte',
        preciputMontant: 0,
      },
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      referenceDate: new Date('2026-01-01T00:00:00Z'),
    });

    expect(analysis.step1?.partConjoint).toBe(250_000);
    expect(analysis.step1?.partEnfants).toBe(750_000);
    expect(analysis.totalDroits).toBeGreaterThan(0);
    expect(analysis.warnings.some((warning) => warning.includes('date de naissance du conjoint survivant manquante'))).toBe(true);
  });

  it('BUG-10/5.3-5.6: le parseur conserve versementsApres70 lorsqu’ils sont saisis', () => {
    const payload = buildSuccessionDraftPayload(
      {
        actifNetSuccession: 0,
        heritiers: [{ lien: 'enfant', partSuccession: 0 }],
      },
      makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
      }),
      makeLiquidation({ nbEnfants: 1 }),
      makeDevolution({}),
      {
        ...DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
      },
      [{ id: 'E1', rattachement: 'commun' }],
      [],
      [],
      [],
      [{
        id: 'av-1',
        typeContrat: 'standard',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 300_000,
        versementsApres70: 300_000,
      }],
      [],
      [],
      [],
      'epoux1',
    );

    const parsed = parseSuccessionDraftPayload(JSON.stringify(payload));

    expect(parsed?.assuranceVieEntries).toHaveLength(1);
    expect(parsed?.assuranceVieEntries[0].versementsApres70).toBe(300_000);
  });

  it('BUG-10/5.3-5.6: le moteur AV calcule bien une base taxable 757B non nulle', () => {
    const snapshot = buildSuccessionFiscalSnapshot(null);
    const analysis = buildSuccessionAvFiscalAnalysis(
      [{
        id: 'av-1',
        typeContrat: 'standard',
        souscripteur: 'epoux1',
        assure: 'epoux1',
        clauseBeneficiaire: 'CUSTOM:E1:100',
        capitauxDeces: 300_000,
        versementsApres70: 300_000,
      }],
      makeCivil({
        situationMatrimoniale: 'celibataire',
        regimeMatrimonial: null,
      }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      [],
      snapshot,
    );

    expect(analysis.lines).toHaveLength(1);
    expect(analysis.lines[0].capitauxApres70).toBe(300_000);
    expect(analysis.lines[0].taxable757B).toBeGreaterThan(0);
    expect(analysis.lines[0].droits757B).toBeGreaterThan(0);
  });

  it('BUG-11/8.3: la devolution fratrie est maintenant correctement restituée par le display direct', () => {
    const civil = makeCivil({ situationMatrimoniale: 'celibataire' });
    const familyMembers = [
      { id: 'F1', type: 'frere_soeur' as const, branch: 'epoux1' as const },
      { id: 'F2', type: 'frere_soeur' as const, branch: 'epoux1' as const },
    ];
    const devolutionContext = makeDevolution({});
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      0,
      devolutionContext,
      800_000,
      [],
      familyMembers,
      { simulatedDeceased: 'epoux1' },
    );
    const analysis = buildDirectAnalysis({
      civil,
      liquidation: makeLiquidation({
        actifEpoux1: 800_000,
        nbEnfants: 0,
      }),
      devolutionContext,
      familyMembers,
      order: 'epoux1',
      actifNetSuccession: 800_000,
    });

    expect(devolution.lines.some((line) => line.heritier === 'Frères et sœurs')).toBe(true);
    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows).toHaveLength(2);
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
  });

  it('BUG-12/8.5-8.6: les ascendants survivent bien dans le display direct avec conjoint marie', () => {
    const analysis = buildDirectAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 800_000,
        nbEnfants: 0,
      }),
      devolutionContext: makeDevolution({
        ascendantsSurvivantsBySide: { epoux1: true },
      }),
      order: 'epoux1',
      actifNetSuccession: 800_000,
    });

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual(['Conjoint survivant', 'Parent 1']);
    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.result).not.toBeNull();
  });

  it('BUG-13/14.1: modifier referenceDate change bien la valorisation DDV au niveau moteur', () => {
    const baseInput = {
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
        dateNaissanceEpoux1: '1960-01-01',
        dateNaissanceEpoux2: '1970-06-15',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 500_000,
        actifEpoux2: 200_000,
        actifCommun: 0,
        nbEnfants: 2,
      }),
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

    expect(earlyDeath.step1?.partConjoint).toBe(250_000);
    expect(laterDeath.step1?.partConjoint).toBe(200_000);
    expect(earlyDeath.totalDroits).not.toBe(laterDeath.totalDroits);
  });
});
