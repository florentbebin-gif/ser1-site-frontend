import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface CreditPageUXContractInput {
  synthesisReady: boolean;
}

export function useCreditPageUXContract({
  synthesisReady,
}: CreditPageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['loan'],
      },
      synthesisReady,
      synthesisTargetId: 'credit-synthese',
      stepperSteps: [
        { id: 'credit-financement', label: 'Financement', status: 'current' },
        { id: 'credit-synthese', label: 'Synthèse', disabled: !synthesisReady },
        { id: 'credit-hypotheses', label: 'Hypothèses' },
      ],
      sections: [
        { id: 'credit-financement', label: 'Financement', targetId: 'credit-financement' },
        { id: 'credit-synthese', label: 'Synthèse', targetId: 'credit-synthese' },
        { id: 'credit-hypotheses', label: 'Hypothèses', targetId: 'credit-hypotheses' },
      ],
    }),
    [synthesisReady],
  );
}
