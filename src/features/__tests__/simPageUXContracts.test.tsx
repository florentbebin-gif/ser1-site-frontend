import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SimPageUXContract } from '@/components/ui/sim';
import { useCreditPageUXContract } from '../credit/hooks/useCreditPageUXContract';
import { useIrPageUXContract } from '../ir/hooks/useIrPageUXContract';
import { usePerPotentielPageUXContract } from '../per/components/potentiel/hooks/usePerPotentielPageUXContract';
import { usePerTransfertPageUXContract } from '../per/transfert/hooks/usePerTransfertPageUXContract';
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
      readContract(() => usePerPotentielPageUXContract({ mode: null })),
      readContract(() =>
        usePerTransfertPageUXContract({ selectedContract: null, contractName: '' }),
      ),
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

  it('ne duplique pas de stepper sur les pages PER déjà pilotées par onglets métier', () => {
    const potentiel = readContract(() => usePerPotentielPageUXContract({ mode: 'versement-n' }));
    const transfert = readContract(() =>
      usePerTransfertPageUXContract({ selectedContract: null, contractName: 'Contrat client' }),
    );

    expect(potentiel.synthesisReady).toBe(true);
    expect(transfert.synthesisReady).toBe(true);
    expect(potentiel.stepperSteps).toBeUndefined();
    expect(transfert.stepperSteps).toBeUndefined();
  });
});
