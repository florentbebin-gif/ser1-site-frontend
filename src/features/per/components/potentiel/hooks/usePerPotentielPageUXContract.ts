import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';
import type { PerMode } from '../../../hooks/usePerPotentiel';

interface PerPotentielPageUXContractInput {
  mode: PerMode | null;
}

export function usePerPotentielPageUXContract({
  mode,
}: PerPotentielPageUXContractInput): SimPageUXContract {
  const synthesisReady = mode !== null;

  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['mode'],
      },
      emptyState: {
        illustration: 'docs',
        title: 'Synthèse en attente',
        description:
          'Choisissez un parcours PER pour afficher le potentiel disponible et les contrôles fiscaux.',
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
