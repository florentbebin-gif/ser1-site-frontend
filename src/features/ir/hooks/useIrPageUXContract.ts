import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface IrPageUXContractInput {
  synthesisReady: boolean;
}

export function useIrPageUXContract({ synthesisReady }: IrPageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['income'],
      },
      synthesisReady,
      synthesisTargetId: 'ir-synthese',
      sections: [
        { id: 'ir-foyer', label: 'Foyer', targetId: 'ir-foyer' },
        { id: 'ir-revenus', label: 'Revenus', targetId: 'ir-revenus' },
        { id: 'ir-synthese', label: 'Synthèse', targetId: 'ir-synthese' },
        { id: 'ir-hypotheses', label: 'Hypothèses', targetId: 'ir-hypotheses' },
      ],
    }),
    [synthesisReady],
  );
}
