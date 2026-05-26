import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';

interface PerPotentielPageUXContractInput {
  synthesisReady: boolean;
}

export function usePerPotentielPageUXContract({
  synthesisReady,
}: PerPotentielPageUXContractInput): SimPageUXContract {
  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['mode', 'inputs'],
      },
      emptyState: {
        illustration: 'docs',
        title: 'Synthèse en attente',
        description:
          'Choisissez un parcours PER puis renseignez les données utiles pour afficher le potentiel disponible.',
      },
      synthesisReady,
      synthesisTargetId: 'per-potentiel-synthese',
      sections: [
        { id: 'per-potentiel-parcours', label: 'Parcours', targetId: 'per-potentiel-parcours' },
        {
          id: 'per-potentiel-synthese',
          label: 'Synthèse',
          targetId: 'per-potentiel-synthese',
        },
      ],
    }),
    [synthesisReady],
  );
}
