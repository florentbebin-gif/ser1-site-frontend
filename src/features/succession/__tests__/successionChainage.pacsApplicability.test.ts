import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { makeCivil, makeDevolution, makeLiquidation } from './fixtures';

function computeExpectedSiblingRights(partSuccession: number): number {
  const baseImposable = Math.max(0, partSuccession - DEFAULT_DMTG.frereSoeur.abattement);
  const droits = DEFAULT_DMTG.frereSoeur.scale.reduce((sum, tranche) => {
    if (baseImposable <= tranche.from) return sum;
    const baseTranche = Math.min(baseImposable, tranche.to ?? Infinity) - tranche.from;
    return sum + (baseTranche * tranche.rate) / 100;
  }, 0);
  return Math.round(droits);
}

/**
 * PR-G : applicabilite du chainage successoral PACS.
 *
 * Sans testament, le partenaire pacse n'a pas de vocation successorale legale:
 * le chainage retourne `applicable: false` et la succession directe prend le relais.
 * Avec testament actif au partenaire, le chainage est exploitable: step1 vers le
 * partenaire exonere CGI 796-0 bis, puis step2 vers la famille de la branche survivante.
 */
describe('buildSuccessionChainageAnalysis - applicabilite PACS', () => {
  it('PACS separation sans testament: chainage non applicable, basculement direct', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 300000 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({}),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
    expect(analysis.totalDroits).toBe(0);
    expect(analysis.warnings.some((warning) => warning.includes('PACS'))).toBe(true);
  });

  it('PACS indivision sans testament: chainage non applicable', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'indivision',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 250000, actifCommun: 100000 }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({}),
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
  });

  it('PACS separation avec testament au partenaire: chainage applicable (PR-G ouverture)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 100000 }),
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
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
    // Le partenaire pacse est traite comme conjoint exonere (CGI 796-0 bis)
    // via computeTestamentDistribution, pas via buildLegalPartnerHeirs.
    const partnerBeneficiary = analysis.step1?.beneficiaries.find(
      (beneficiary) => beneficiary.id === 'partenaire-pacse',
    );
    expect(partnerBeneficiary?.exonerated).toBe(true);
  });

  it('PACS indivision avec testament au partenaire: chainage applicable, masse commune incluse', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'indivision',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 250000, actifEpoux2: 50000, actifCommun: 100000 }),
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
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    // Indivision PACS approxime en communaute_legale: actifCommun reparti 50/50,
    // donc step1 = actifEpoux1 + 50% actifCommun = 250 000 + 50 000 = 300 000.
    expect(analysis.step1?.actifTransmis).toBe(300000);
  });

  it('PACS avec testament hors partenaire: chainage non applicable', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({ actifEpoux1: 300000, actifEpoux2: 100000, nbEnfants: 1 }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
      devolution: makeDevolution({
        testamentsBySide: {
          epoux1: {
            active: true,
            dispositionType: 'legs_universel',
            beneficiaryRef: 'enfant:E1',
            quotePartPct: 100,
            particularLegacies: [],
          },
        },
      }),
      enfantsContext: [{ id: 'E1', rattachement: 'epoux1' }],
    });

    expect(analysis.applicable).toBe(false);
    expect(analysis.step1).toBeNull();
    expect(analysis.step2).toBeNull();
  });

  it('PACS separation avec testament 100% partenaire, sans enfant, partenaire a 2 freres: step1 exonere, step2 taxe les freres', () => {
    // Cas chiffre :
    // - actifEpoux1 = 600 000 (defunt)
    // - actifEpoux2 = 100 000 (partenaire)
    // - 2 freres / soeurs rattaches a epoux2
    // - testament legs universel 100% au partenaire
    //
    // step1 : 600 000 transmis au partenaire pacse (CGI 796-0 bis: exoneration totale)
    // step2 : 100 000 (propre) + 600 000 (recu au step1) = 700 000
    //         transmis aux freres / soeurs cote epoux2
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'pacse',
        pacsConvention: 'separation',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 600000,
        actifEpoux2: 100000,
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
      familyMembers: [
        { id: 'F1', type: 'frere_soeur', branch: 'epoux2' },
        { id: 'F2', type: 'frere_soeur', branch: 'epoux2' },
      ],
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1?.actifTransmis).toBe(600000);
    // Le partenaire pacse beneficie de l'exoneration CGI 796-0 bis sur la
    // part recue par testament. Aucun heritier reservataire cote epoux1.
    expect(analysis.step1?.droitsEnfants).toBe(0);

    // step2: les freres / soeurs cote epoux2 heritent de tout (partenaire propre + carry).
    expect(analysis.step2?.actifTransmis).toBe(700000);
    expect(analysis.step2?.beneficiaries.map((beneficiary) => beneficiary.lien)).toEqual([
      'frere_soeur',
      'frere_soeur',
    ]);
    const expectedDroitsStep2 = computeExpectedSiblingRights(350000) * 2;
    expect(analysis.step2?.droitsEnfants).toBe(expectedDroitsStep2);
    // Total cumule = droits step2 uniquement
    expect(analysis.totalDroits).toBe(analysis.step2!.droitsEnfants);
  });

  it('mariage en communaute legale: chainage applicable (non regression)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'communaute_legale',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 200000,
        actifEpoux2: 150000,
        actifCommun: 300000,
        nbEnfants: 2,
      }),
      regimeUsed: 'communaute_legale',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
  });

  it('mariage en separation de biens: chainage applicable (non regression)', () => {
    const analysis = buildSuccessionChainageAnalysis({
      civil: makeCivil({
        situationMatrimoniale: 'marie',
        regimeMatrimonial: 'separation_biens',
      }),
      liquidation: makeLiquidation({
        actifEpoux1: 400000,
        actifEpoux2: 100000,
        nbEnfants: 1,
      }),
      regimeUsed: 'separation_biens',
      order: 'epoux1',
      dmtgSettings: DEFAULT_DMTG,
    });

    expect(analysis.applicable).toBe(true);
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
  });
});
