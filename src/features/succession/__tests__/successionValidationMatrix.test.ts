import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import type {
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import {
  buildSuccessionDirectDisplayAnalysis,
  buildSuccessionChainTransmissionRows,
  computeSuccessionDirectEstateBasis,
} from '../successionDisplay';
import type { SuccessionAssetTransmissionBasis } from '../successionTransmissionBasis';
import { makeCivil, makeDevolution, makeLiquidation } from './fixtures';

const DEUX_ENFANTS_DEFUNT: SuccessionEnfant[] = [
  { id: 'E1', rattachement: 'epoux1' },
  { id: 'E2', rattachement: 'epoux1' },
];

function buildDirectAnalysisFor(
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
  enfants: SuccessionEnfant[],
  devolutionContext = makeDevolution({}),
  transmissionBasis?: SuccessionAssetTransmissionBasis,
) {
  const basis = computeSuccessionDirectEstateBasis(civil, liquidation, 'epoux1');
  const devolution = buildSuccessionDevolutionAnalysis(
    civil,
    enfants.length,
    devolutionContext,
    basis.actifNetSuccession,
    enfants,
    [],
  );

  return buildSuccessionDirectDisplayAnalysis({
    civil,
    devolution,
    devolutionContext,
    dmtgSettings: DEFAULT_DMTG,
    enfantsContext: enfants,
    familyMembers: [],
    order: 'epoux1',
    actifNetSuccession: basis.actifNetSuccession,
    baseWarnings: basis.warnings,
    transmissionBasis,
    forfaitMobilierMode: 'auto',
    forfaitMobilierPct: 5,
    forfaitMobilierMontant: 0,
  });
}

describe('succession validation matrix', () => {
  it('veuf with two children: direct succession produces line-direct rights', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'veuf' }),
      makeLiquidation({ actifEpoux1: 400000, nbEnfants: 2 }),
      DEUX_ENFANTS_DEFUNT,
    );

    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
    expect(analysis.transmissionRows.map((row) => row.label)).toEqual(['E1', 'E2']);
  });

  it('divorce with two children: former spouse stays outside legal heirs', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'divorce' }),
      makeLiquidation({ actifEpoux1: 420000, nbEnfants: 2 }),
      DEUX_ENFANTS_DEFUNT,
    );

    expect(analysis.heirs).toHaveLength(2);
    expect(analysis.transmissionRows.every((row) => row.label !== 'Ex-conjoint')).toBe(true);
    expect(analysis.result?.totalDroits).toBeGreaterThan(0);
  });

  it('PACS without testament and without descendants: partner is not a direct legal heir', () => {
    const civil = makeCivil({ situationMatrimoniale: 'pacse' });
    const devolutionContext = makeDevolution({});
    const basis = computeSuccessionDirectEstateBasis(
      civil,
      makeLiquidation({ actifEpoux1: 300000 }),
      'epoux1',
    );
    const devolution = buildSuccessionDevolutionAnalysis(
      civil,
      0,
      devolutionContext,
      basis.actifNetSuccession,
      [],
      [],
    );

    const analysis = buildSuccessionDirectDisplayAnalysis({
      civil,
      devolution,
      devolutionContext,
      dmtgSettings: DEFAULT_DMTG,
      enfantsContext: [],
      familyMembers: [],
      order: 'epoux1',
      actifNetSuccession: basis.actifNetSuccession,
      baseWarnings: basis.warnings,
    });

    expect(analysis.heirs).toHaveLength(0);
    expect(analysis.result).toBeNull();
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('PACS with testament to partner: partner is restored beside descendants', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'pacse' }),
      makeLiquidation({ actifEpoux1: 300000, nbEnfants: 2 }),
      [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 50,
            particularLegacies: [],
          },
        },
      }),
    );

    expect(analysis.transmissionRows.map((row) => row.label)).toEqual([
      'Partenaire pacsé',
      'E1',
      'E2',
    ]);
    expect(analysis.heirs[0]).toMatchObject({ lien: 'conjoint', partSuccession: 100000 });
  });

  it('marriage with common and separate child respects the deceased branch at step 1', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 450000,
        actifEpoux2: 250000,
        actifCommun: 0,
        nbEnfants: 2,
      }),
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

  it('symmetric blended family keeps distinct cumulative rows', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 450000,
        actifEpoux2: 350000,
        actifCommun: 0,
        nbEnfants: 3,
      }),
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

    const rows = buildSuccessionChainTransmissionRows(analysis);

    expect(rows.map((row) => row.label)).toEqual(['E1', 'E2', 'E3', 'Conjoint survivant']);
    expect(rows.filter((row) => row.label === 'E1')).toHaveLength(1);
    expect(rows.filter((row) => row.label === 'E2')).toHaveLength(1);
    expect(rows.filter((row) => row.label === 'E3')).toHaveLength(1);
    expect(rows.find((row) => row.label === 'E1')?.step1Brut).toBeGreaterThan(0);
    expect(rows.find((row) => row.label === 'E1')?.step2Brut ?? 0).toBe(0);
    expect(rows.find((row) => row.label === 'E2')?.step1Brut).toBeGreaterThan(0);
    expect(rows.find((row) => row.label === 'E2')?.step2Brut).toBeGreaterThan(0);
    expect(rows.find((row) => row.label === 'E3')?.step1Brut ?? 0).toBe(0);
    expect(rows.find((row) => row.label === 'E3')?.step2Brut).toBeGreaterThan(0);
  });

  it('marriage with testament to spouse carries the testament into the second estate through order', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
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
      enfantsContext: [
        { id: 'E1', rattachement: 'commun' },
        { id: 'E2', rattachement: 'commun' },
      ],
      familyMembers: [],
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_titre_universel',
            beneficiaryRef: 'principal:epoux2',
            quotePartPct: 25,
            particularLegacies: [],
          },
        },
      }),
    });

    // max(legal 1/4 = 100k, testament 25% = 100k) = 100k
    expect(analysis.step1?.partConjoint).toBeGreaterThanOrEqual(100000);
    expect(analysis.step2?.actifTransmis).toBeGreaterThan(analysis.step1?.partConjoint ?? 0);
  });

  it('concubinage with indivision only keeps the deceased share', () => {
    const basis = computeSuccessionDirectEstateBasis(
      makeCivil({ situationMatrimoniale: 'concubinage' }),
      makeLiquidation({
        actifEpoux1: 120000,
        actifEpoux2: 80000,
        actifCommun: 200000,
        nbEnfants: 2,
      }),
      'epoux1',
    );

    expect(basis.actifNetSuccession).toBe(220000);
    expect(basis.warnings.some((warning) => warning.includes('quote-part indivise'))).toBe(true);
  });

  it('direct succession applies GFA allowance per beneficiary instead of globally', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'celibataire' }),
      makeLiquidation({ actifEpoux1: 5_092_500, nbEnfants: 3 }),
      [
        { id: 'E1', rattachement: 'epoux1' },
        { id: 'E2', rattachement: 'epoux1' },
        { id: 'E3', rattachement: 'epoux1' },
      ],
      makeDevolution({}),
      {
        ordinaryTaxableAssetsParPocket: {
          epoux1: 200_000,
          epoux2: 0,
          communaute: 0,
          societe_acquets: 0,
          indivision_pacse: 0,
          indivision_concubinage: 0,
          indivision_separatiste: 0,
        },
        passifsParPocket: {
          epoux1: 0,
          epoux2: 0,
          communaute: 0,
          societe_acquets: 0,
          indivision_pacse: 0,
          indivision_concubinage: 0,
          indivision_separatiste: 0,
        },
        groupementFoncierEntries: [
          { id: 'gf-1', pocket: 'epoux1', type: 'GFA', valeurTotale: 10_000_000 },
        ],
        hasBeneficiaryLevelGfAdjustment: true,
        residencePrincipaleEntry: null,
      },
    );

    const correctedTaxableEstate = (analysis.result?.detailHeritiers ?? []).reduce(
      (sum, detail) => sum + detail.baseImposable + detail.abattement,
      0,
    );

    expect(analysis.transmissionRows).toHaveLength(3);
    expect(Math.round(correctedTaxableEstate)).toBe(4_987_499);
    expect(correctedTaxableEstate).toBeLessThan(5_092_500);
  });

  it('direct succession keeps the single-beneficiary GFA taxable basis above the three-beneficiary case', () => {
    const analysis = buildDirectAnalysisFor(
      makeCivil({ situationMatrimoniale: 'celibataire' }),
      makeLiquidation({ actifEpoux1: 5_092_500, nbEnfants: 1 }),
      [{ id: 'E1', rattachement: 'epoux1' }],
      makeDevolution({}),
      {
        ordinaryTaxableAssetsParPocket: {
          epoux1: 200_000,
          epoux2: 0,
          communaute: 0,
          societe_acquets: 0,
          indivision_pacse: 0,
          indivision_concubinage: 0,
          indivision_separatiste: 0,
        },
        passifsParPocket: {
          epoux1: 0,
          epoux2: 0,
          communaute: 0,
          societe_acquets: 0,
          indivision_pacse: 0,
          indivision_concubinage: 0,
          indivision_separatiste: 0,
        },
        groupementFoncierEntries: [
          { id: 'gf-1', pocket: 'epoux1', type: 'GFA', valeurTotale: 10_000_000 },
        ],
        hasBeneficiaryLevelGfAdjustment: true,
        residencePrincipaleEntry: null,
      },
    );

    const correctedTaxableEstate = (analysis.result?.detailHeritiers ?? []).reduce(
      (sum, detail) => sum + detail.baseImposable + detail.abattement,
      0,
    );

    expect(analysis.transmissionRows).toHaveLength(1);
    expect(Math.round(correctedTaxableEstate)).toBe(5_302_500);
    expect(correctedTaxableEstate).toBeGreaterThan(4_987_499);
  });
});
