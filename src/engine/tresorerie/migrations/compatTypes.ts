import type {
  AllocationMatrixInput,
  CapitalisationPocketInput,
  CompanyInput,
  CompanyInputV5,
  DistributionPocketInput,
  FoyerInput,
  HoldingParticipationInput,
  CreditIrPocketInput,
  CreditIsPocketInput,
  RuntimeFoyerInput,
  TresoInputsV6,
} from '../types';

// Types historiques V2-V5 conservés uniquement pour migrer les sauvegardes
// locales et drafts vers `TresoInputsV6`. Ne pas les réutiliser dans le runtime.

export interface TresoInputsV2 {
  version: 2;
  foyer: FoyerInput;
  company: CompanyInput;
  allocationMatrix: AllocationMatrixInput;
}

export interface TresoInputsV3 extends Omit<TresoInputsV2, 'version'> {
  version: 3;
  selectedAssociateId: string;
}

export interface TresoInputsV4 extends Omit<TresoInputsV3, 'version' | 'foyer'> {
  version: 4;
  foyer: RuntimeFoyerInput;
}

export interface TresoInputsV5 extends Omit<TresoInputsV4, 'version' | 'company'> {
  version: 5;
  company: CompanyInputV5;
}

export type TresoInputsHistorical = TresoInputsV2 | TresoInputsV3 | TresoInputsV4 | TresoInputsV5;

export type TresoInputsCompat = TresoInputsHistorical | TresoInputsV6;

export interface TresoInputs {
  typeCreation: 'newco' | 'existante';
  ageActuel: number;
  ageRetraite: number;
  besoinsRetraiteAnnuels: number;
  fraisStructureAnnuels: number;
  ccaInitial: number;
  apportAnnuelCCA: number;
  dureeActiveAns: number;
  tresorerieInitiale?: number;
  reservesInitiales?: number;
  anneeCivileDebut?: number;
  distribution?: DistributionPocketInput;
  capitalisation?: CapitalisationPocketInput;
  creditIS?: CreditIsPocketInput;
  creditIR?: CreditIrPocketInput;
  holding?: HoldingParticipationInput;
}
