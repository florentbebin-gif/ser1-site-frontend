import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface PlacementPageUXContractInput {
  synthesisReady: boolean;
}

export function usePlacementPageUXContract({
  synthesisReady,
}: PlacementPageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['age', 'versement'],
      },
      synthesisReady,
      synthesisTargetId: 'placement-synthese',
      sections: [
        { id: 'placement-saisie', label: 'Saisie', targetId: 'placement-saisie' },
        { id: 'placement-synthese', label: 'Synthèse', targetId: 'placement-synthese' },
      ],
    }),
    [synthesisReady],
  );
}
