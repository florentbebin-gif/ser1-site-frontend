import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import {
  makeCivil,
  makeDevolution,
  makeLiquidation,
} from './successionChainage.test.helpers';

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

  it('exposes inter-mass claims and affected liabilities in the chainage summary and warnings', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 450000, actifEpoux2: 200000, actifCommun: 250000 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      interMassClaimsSummary: {
        configured: true,
        totalRequestedAmount: 80000,
        totalAppliedAmount: 60000,
        adjustmentsByPocket: {
          epoux1: 60000,
          epoux2: 0,
          communaute: -60000,
          societe_acquets: 0,
          indivision_pacse: 0,
          indivision_concubinage: 0,
          indivision_separatiste: 0,
        },
        claims: [
          {
            id: 'claim-1',
            kind: 'recompense',
            fromPocket: 'communaute',
            toPocket: 'epoux1',
            requestedAmount: 80000,
            appliedAmount: 60000,
          },
        ],
        warnings: [],
      },
      affectedLiabilitySummary: {
        totalAmount: 35000,
        byPocket: [
          { pocket: 'epoux1', amount: 20000 },
          { pocket: 'communaute', amount: 15000 },
        ],
      },
    });

    expect(analysis.interMassClaims?.totalAppliedAmount).toBe(60000);
    expect(analysis.affectedLiabilities?.totalAmount).toBe(35000);
    expect(analysis.warnings.some((warning) => warning.includes('Creances entre masses'))).toBe(true);
    expect(analysis.warnings.some((warning) => warning.includes('Passif affecte'))).toBe(true);
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

  it('preserves survivor propres par nature outside the first estate in communaute universelle when the stipulation is active', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'communaute_universelle' }),
      liquidation: makeLiquidation({ actifEpoux1: 70000, actifEpoux2: 50000, actifCommun: 300000 }),
      regimeUsed: 'communaute_universelle',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      patrimonial: {
        stipulationContraireCU: true,
      },
    });

    expect(analysis.step1?.actifTransmis).toBe(220000);
    expect(analysis.warnings.some((warning) => warning.includes('propre par nature'))).toBe(true);
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

  it('allocates parents under art. 757-1 when married with no children', () => {
    const with2Parents = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 400000, nbEnfants: 0 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      familyMembers: [
        { id: 'P1', type: 'parent', branch: 'epoux1' },
        { id: 'P2', type: 'parent', branch: 'epoux1' },
      ],
    });

    const parentBenefs = with2Parents.step1!.beneficiaries.filter((b) => b.lien === 'parent');
    expect(parentBenefs).toHaveLength(2);
    expect(parentBenefs[0].brut).toBe(50000);
    expect(parentBenefs[1].brut).toBe(50000);
    expect(with2Parents.step1!.partConjoint).toBe(100000);
    expect(with2Parents.warnings.some((w) => w.includes('757-1'))).toBe(true);

    const with1Parent = buildSuccessionChainageAnalysis({
      civil: makeCivil({}),
      liquidation: makeLiquidation({ actifEpoux1: 0, actifEpoux2: 0, actifCommun: 400000, nbEnfants: 0 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      familyMembers: [{ id: 'P1', type: 'parent', branch: 'epoux1' }],
    });

    const parent1Benefs = with1Parent.step1!.beneficiaries.filter((b) => b.lien === 'parent');
    expect(parent1Benefs).toHaveLength(1);
    expect(parent1Benefs[0].brut).toBe(50000);
    expect(with1Parent.step1!.partConjoint).toBe(150000);
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

  it('répartit deux branches représentées avec des petits-enfants en cascade', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({ actifEpoux1: 900000, actifEpoux2: 0, actifCommun: 0, nbEnfants: 3 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun', deceased: true },
        { id: 'E3', rattachement: 'commun', deceased: true },
      ],
      familyMembers: [
        { id: 'PG1', type: 'petit_enfant', parentEnfantId: 'E2' },
        { id: 'PG2', type: 'petit_enfant', parentEnfantId: 'E3' },
        { id: 'PG3', type: 'petit_enfant', parentEnfantId: 'E3' },
      ],
    });

    const beneficiaries = new Map(
      analysis.step1?.beneficiaries.map((beneficiary) => [beneficiary.id, beneficiary]),
    );

    expect(analysis.step1?.beneficiaries.map((beneficiary) => beneficiary.id)).toEqual([
      'conjoint',
      'E1',
      'PG1',
      'PG2',
      'PG3',
    ]);
    expect(beneficiaries.get('E1')).toMatchObject({ lien: 'enfant', brut: 225000, droits: 23194 });
    expect(beneficiaries.get('PG1')).toMatchObject({ lien: 'petit_enfant', brut: 225000, droits: 23194 });
    expect(beneficiaries.get('PG2')).toMatchObject({ lien: 'petit_enfant', brut: 112500, droits: 10694 });
    expect(beneficiaries.get('PG3')).toMatchObject({ lien: 'petit_enfant', brut: 112500, droits: 10694 });
    expect(analysis.warnings.some((warning) => warning.includes('representation successorale simplifiee'))).toBe(true);
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
});
