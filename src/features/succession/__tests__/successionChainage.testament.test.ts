import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '@/engine/succession/civil';
import { buildSuccessionChainageAnalysis } from '../successionChainage';
import { makeCivil, makeDevolution, makeLiquidation } from './successionChainage.test.helpers';

describe('buildSuccessionChainageAnalysis — testament', () => {
  it('uses the testament of the side selected by death order', () => {
    const baseInput = {
      civil: makeCivil({ regimeMatrimonial: 'separation_biens' }),
      liquidation: makeLiquidation({
        actifEpoux1: 300000,
        actifEpoux2: 280000,
        actifCommun: 0,
        nbEnfants: 2,
      }),
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

    expect(
      epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut,
    ).toBeGreaterThan(
      epoux1First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut ?? 0,
    );
    expect(
      epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E2')?.brut,
    ).toBeGreaterThan(
      epoux2First.step1?.beneficiaries.find((beneficiary) => beneficiary.id === 'E1')?.brut ?? 0,
    );
  });
});
