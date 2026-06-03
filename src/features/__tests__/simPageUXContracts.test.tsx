import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { SimPageUXContract } from '@/components/ui/sim';
import { ACTIVE_SIM_ROUTE_CONTRACTS, type ActiveSimRouteId } from '@/routes/simRouteContracts';
import { useCreditPageUXContract } from '../credit/hooks/useCreditPageUXContract';
import { useIrPageUXContract } from '../ir/hooks/useIrPageUXContract';
import { usePerPotentielPageUXContract } from '../per/components/potentiel/hooks/usePerPotentielPageUXContract';
import { usePerTransfertPageUXContract } from '../per/transfert/hooks/usePerTransfertPageUXContract';
import { usePlacementPageUXContract } from '../placement/hooks/usePlacementPageUXContract';
import { usePrevoyancePageUXContract } from '../prevoyance/hooks/usePrevoyancePageUXContract';
import { useSuccessionPageUXContract } from '../succession/hooks/useSuccessionPageUXContract';
import { useTresoreriePageUXContract } from '../tresorerie-societe/hooks/useTresoreriePageUXContract';
// scaffold:sim ux-import

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

interface ContractReaders {
  waiting: () => SimPageUXContract;
  ready: () => SimPageUXContract;
}

const CONTRACT_READERS = {
  credit: {
    waiting: () => readContract(() => useCreditPageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => useCreditPageUXContract({ synthesisReady: true })),
  },
  ir: {
    waiting: () => readContract(() => useIrPageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => useIrPageUXContract({ synthesisReady: true })),
  },
  placement: {
    waiting: () => readContract(() => usePlacementPageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => usePlacementPageUXContract({ synthesisReady: true })),
  },
  'per-potentiel': {
    waiting: () => readContract(() => usePerPotentielPageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => usePerPotentielPageUXContract({ synthesisReady: true })),
  },
  'per-transfert': {
    waiting: () =>
      readContract(() =>
        usePerTransfertPageUXContract({ selectedContract: null, contractName: '' }),
      ),
    ready: () =>
      readContract(() =>
        usePerTransfertPageUXContract({ selectedContract: null, contractName: 'Contrat client' }),
      ),
  },
  prevoyance: {
    waiting: () => readContract(() => usePrevoyancePageUXContract({ synthesisReady: false })),
    ready: () => readContract(() => usePrevoyancePageUXContract({ synthesisReady: true })),
  },
  succession: {
    waiting: () =>
      readContract(() =>
        useSuccessionPageUXContract({
          computationSectionsReady: true,
          synthesisReady: false,
        }),
      ),
    ready: () =>
      readContract(() =>
        useSuccessionPageUXContract({
          computationSectionsReady: true,
          synthesisReady: true,
        }),
      ),
  },
  'tresorerie-societe': {
    waiting: () =>
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
    ready: () =>
      readContract(() =>
        useTresoreriePageUXContract({
          readiness: {
            companyReady: true,
            personalTimelineReady: true,
            synthesisReady: true,
            ownershipCapitalOverflow: false,
            ownershipEconomicOverflow: false,
          },
        }),
      ),
  },
  // scaffold:sim ux-contract
} satisfies Record<ActiveSimRouteId, ContractReaders>;

function readContracts(state: keyof ContractReaders): SimPageUXContract[] {
  return ACTIVE_SIM_ROUTE_CONTRACTS.map((route) => CONTRACT_READERS[route.id][state]());
}

function hasHypothesesSection(contract: SimPageUXContract): boolean {
  return (contract.sections ?? []).some((section) => section.label === 'Hypothèses');
}

describe('contrats UX simulateurs', () => {
  it('désactive les synthèses tant que les prérequis essentiels sont absents', () => {
    const contracts = readContracts('waiting');

    expect(contracts.every((contract) => contract.readiness.status === 'waiting')).toBe(true);
    expect(contracts.every((contract) => contract.synthesisReady === false)).toBe(true);
  });

  it('ne publie pas de stepper global par défaut sur les simulateurs', () => {
    const contracts = readContracts('ready');

    expect(contracts.every((contract) => contract.stepperSteps === undefined)).toBe(true);
  });

  it('ne publie les hypothèses dans le rail qu’après une synthèse prête', () => {
    const waitingContracts = readContracts('waiting');
    const readyContracts = readContracts('ready');

    expect(waitingContracts.every((contract) => !hasHypothesesSection(contract))).toBe(true);
    expect(readyContracts.every((contract) => hasHypothesesSection(contract))).toBe(true);
  });
});
