import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface SuccessionPageUXContractInput {
  computationSectionsReady: boolean;
  synthesisReady: boolean;
}

export function useSuccessionPageUXContract({
  synthesisReady,
}: SuccessionPageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['family', 'patrimony'],
      },
      synthesisReady,
      synthesisTargetId: 'succession-synthese',
      sections: [
        { id: 'succession-famille', label: 'Famille', targetId: 'succession-famille' },
        { id: 'succession-patrimoine', label: 'Patrimoine', targetId: 'succession-patrimoine' },
        { id: 'succession-synthese', label: 'Synthèse', targetId: 'succession-synthese' },
        { id: 'succession-hypotheses', label: 'Hypothèses', targetId: 'succession-hypotheses' },
      ],
    }),
    [synthesisReady],
  );
}
