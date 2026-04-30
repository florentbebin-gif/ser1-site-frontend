import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import {
  makeCivil,
  makeDevolution,
  makeLiquidation,
} from './successionBugRepro.helpers';

describe('V3 â€” red tests (Lot 0) â€” will be converted to it() when fixed', () => {
  // â”€â”€ BUG 2: CU attribution 50% should not return 100% of patrimoine â”€â”€
  it('BUG-2: CU attribution 50% â€” firstEstate should be ownDeceased + 50% communs, not all patrimoine', () => {
    // Without stipulation: everything is communautÃ©, 50% goes to survivor
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

    // Without stipulation in CU, all pockets are communautÃ©
    // 50% attribution â†’ firstEstate = totalPatrimoine * (1 - 50/100) = 1M
    expect(analysis.step1!.actifTransmis).toBe(1000000);
  });

  it('BUG-2: CU attribution 50% with stipulation â€” firstEstate = propresDefunt + 50% communs = 950k', () => {
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

  // â”€â”€ BUG 1: CU attribution intÃ©grale â€” step2 should not double-count â”€â”€
  it('BUG-1: CU attribution integrale with stipulation â€” step1 = propres defunt only, step2 = 1.85M', () => {
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

    // With attribution intÃ©grale + stipulation:
    // - Communs 1.5M â†’ all to survivor (attribution)
    // - Propres dÃ©funt 200k â†’ succession step1
    //   conjoint 1/4 = 50k, enfants 3/4 = 150k
    // - Step2: 300k (own) + 1.5M (attributed) + 50k (carry-over) = 1.85M
    expect(analysis.step1!.actifTransmis).toBe(200000);
    expect(analysis.step2!.actifTransmis).toBe(1850000);
  });

  // â”€â”€ BUG 9: PrÃ©ciput global â€” ideally should be applied at mass split level â”€â”€
  // Current behavior: preciput applied after 50/50 split â†’ actifTransmis = 300k
  // Ideal behavior: preciput before split â†’ actifTransmis = 400k (deeper refactor needed)
  it('BUG-9: preciput global in communautÃ© â€” should reduce shared mass before split', () => {
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

    // CommunautÃ© 1M, preciput 200k â†’ shared after preciput = 800k
    // Part dÃ©funt = 800k / 2 = 400k (the estate for step1)
    // Survivor keeps: 400k (own half of shared) + 200k (preciput) = 600k base
    expect(analysis.step1!.actifTransmis).toBe(400000);
  });

  // â”€â”€ BUG 11: Testament legs_universel conjoint â€” max not cumul â”€â”€
  it('BUG-11: legs_universel au conjoint â€” part = max(legale, testamentaire), not sum', () => {
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

  // BUG-3 historique : evolution des deux PR successives.
  // - PR-A (#421) : applicable=false pour tout PACS, par alignement avec la
  //   matrice de maturite ("PACS chainage 2 deces : Non modelise").
  // - PR-G : applicable=true pour PACS *avec testament*, le partenaire
  //   pacse beneficiant de l'exoneration CGI 796-0 bis sur la part leguee.
  //   Sans testament le mode direct reste retenu.
  it('BUG-3: PACS avec testament au partenaire chaine et applique l exoneration', () => {
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
    expect(analysis.step1).not.toBeNull();
    expect(analysis.step2).not.toBeNull();
    const partnerBeneficiary = analysis.step1?.beneficiaries.find(
      (beneficiary) => beneficiary.id === 'partenaire-pacse',
    );
    expect(partnerBeneficiary?.exonerated).toBe(true);
    expect(partnerBeneficiary?.droits).toBe(0);
    expect(analysis.step2!.actifTransmis).toBeGreaterThan(0);
  });
});
