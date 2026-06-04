import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';
import type { TresoReadiness } from '../utils/tresorerieReadiness';

interface TresoreriePageUXContractInput {
  readiness: TresoReadiness;
}

export function useTresoreriePageUXContract({
  readiness,
}: TresoreriePageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: readiness.synthesisReady ? 'ready' : 'waiting',
        reasons: readiness.synthesisReady ? undefined : ['company', 'associate', 'revenuePhase'],
      },
      synthesisReady: readiness.synthesisReady,
      synthesisTargetId: 'treso-synthese',
      sections: [
        { id: 'treso-societe', label: 'Société', targetId: 'treso-societe' },
        { id: 'treso-parcours', label: 'Parcours', targetId: 'treso-parcours' },
        { id: 'treso-allocation', label: 'Allocation', targetId: 'treso-allocation' },
        { id: 'treso-synthese', label: 'Synthèse', targetId: 'treso-synthese' },
        ...(readiness.synthesisReady
          ? [{ id: 'treso-hypotheses', label: 'Hypothèses', targetId: 'treso-hypotheses' }]
          : []),
      ],
    }),
    [readiness.synthesisReady],
  );
}
