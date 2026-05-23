import {
  computeDecesCapitalFromContract,
  type PrevoyanceContractDraft,
} from '@/features/prevoyance';
import type { SuccessionPrevoyanceDecesEntry } from './successionDraft.types';

interface PrevoyanceSuccessionAdapterInput {
  contract: PrevoyanceContractDraft;
  souscripteur: SuccessionPrevoyanceDecesEntry['souscripteur'];
  assure: SuccessionPrevoyanceDecesEntry['assure'];
  annualBase: number;
}

export function buildPrevoyanceSuccessionEntry({
  contract,
  souscripteur,
  assure,
  annualBase,
}: PrevoyanceSuccessionAdapterInput): SuccessionPrevoyanceDecesEntry {
  return {
    id: `prevoyance-${contract.id}`,
    souscripteur,
    assure,
    capitalDeces: computeDecesCapitalFromContract(contract, annualBase),
    dernierePrime: contract.kind === 'individuel' ? contract.cotisation.montantAnnuel : 0,
    clauseBeneficiaire: undefined,
  };
}
