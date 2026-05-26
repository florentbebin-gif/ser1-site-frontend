import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface PrevoyancePageUXContractInput {
  synthesisReady: boolean;
}

export function usePrevoyancePageUXContract({
  synthesisReady,
}: PrevoyancePageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['birthDate', 'regime'],
      },
      synthesisReady,
      synthesisTargetId: 'prevoyance-synthese',
      sections: [
        { id: 'prevoyance-situation', label: 'Situation', targetId: 'prevoyance-situation' },
        { id: 'prevoyance-garanties', label: 'Garanties', targetId: 'prevoyance-garanties' },
        { id: 'prevoyance-synthese', label: 'Synthèse', targetId: 'prevoyance-synthese' },
        { id: 'prevoyance-hypotheses', label: 'Hypothèses', targetId: 'prevoyance-hypotheses' },
      ],
    }),
    [synthesisReady],
  );
}
