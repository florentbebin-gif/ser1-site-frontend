import { useMemo } from 'react';
import type { SimPageUXContract } from '@/components/ui/sim';
import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';

interface PerTransfertPageUXContractInput {
  selectedContract: BaseCgRetraiteContract | null;
  contractName: string;
}

export function usePerTransfertPageUXContract({
  selectedContract,
  contractName,
}: PerTransfertPageUXContractInput): SimPageUXContract {
  const normalizedContractName = contractName.trim();
  const synthesisReady = Boolean(selectedContract || normalizedContractName.length > 0);

  return useMemo(
    () => ({
      readiness: {
        status: synthesisReady ? 'ready' : 'waiting',
        reasons: synthesisReady ? undefined : ['contract'],
      },
      emptyState: {
        illustration: 'docs',
        title: 'Synthèse en attente',
        description:
          'Sélectionnez ou référencez le contrat retraite pour afficher les comparatifs de transfert.',
      },
      synthesisReady,
      synthesisTargetId: 'per-transfert-synthese',
      sections: [
        { id: 'per-transfert-contrat', label: 'Contrat actuel', targetId: 'per-transfert-contrat' },
        { id: 'per-transfert-newper', label: 'Nouveau PER', targetId: 'per-transfert-newper' },
        {
          id: 'per-transfert-synthese',
          label: 'Synthèse',
          targetId: 'per-transfert-synthese',
        },
      ],
    }),
    [synthesisReady],
  );
}
