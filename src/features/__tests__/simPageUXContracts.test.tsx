import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SimPageUXContract } from '@/components/ui/sim';
import { useCreditPageUXContract } from '../credit/hooks/useCreditPageUXContract';
import { useIrPageUXContract } from '../ir/hooks/useIrPageUXContract';
import { usePlacementPageUXContract } from '../placement/hooks/usePlacementPageUXContract';
import { usePrevoyancePageUXContract } from '../prevoyance/hooks/usePrevoyancePageUXContract';
import { useSuccessionPageUXContract } from '../succession/hooks/useSuccessionPageUXContract';
import { useTresoreriePageUXContract } from '../tresorerie-societe/hooks/useTresoreriePageUXContract';

function readContract(useContract: () => SimPageUXContract): SimPageUXContract {
  let contract: SimPageUXContract | null = null;

  function Probe() {
    contract = useContract();
    return <div />;
  }

  renderToStaticMarkup(<Probe />);
  if (!contract) throw new Error('Contrat UX non rendu');
  return contract;
}

describe('contrats UX simulateurs', () => {
  it('désactive les synthèses tant que les prérequis essentiels sont absents', () => {
    const contracts = [
      readContract(() => useCreditPageUXContract({ synthesisReady: false })),
      readContract(() => useIrPageUXContract({ synthesisReady: false })),
      readContract(() => usePlacementPageUXContract({ synthesisReady: false })),
      readContract(() => usePrevoyancePageUXContract({ synthesisReady: false })),
      readContract(() =>
        useSuccessionPageUXContract({
          computationSectionsReady: true,
          synthesisReady: false,
        }),
      ),
      readContract(() =>
        useTresoreriePageUXContract({
          readiness: {
            companyReady: true,
            personalTimelineReady: true,
            synthesisReady: false,
            ownershipCapitalOverflow: false,
            ownershipEconomicOverflow: false,
          },
        }),
      ),
    ];

    expect(contracts.every((contract) => contract.readiness.status === 'waiting')).toBe(true);
    expect(contracts.every((contract) => contract.synthesisReady === false)).toBe(true);
  });

  it('expose des étapes pour les pages sans onglets métier', () => {
    const credit = readContract(() => useCreditPageUXContract({ synthesisReady: true }));
    const tresorerie = readContract(() =>
      useTresoreriePageUXContract({
        readiness: {
          companyReady: true,
          personalTimelineReady: true,
          synthesisReady: true,
          ownershipCapitalOverflow: false,
          ownershipEconomicOverflow: false,
        },
      }),
    );

    expect(credit.stepperSteps?.map((step) => step.id)).toEqual([
      'credit-financement',
      'credit-synthese',
      'credit-hypotheses',
    ]);
    expect(tresorerie.stepperSteps).toHaveLength(5);
  });
});
