import type { BaseCgRetraiteContractType, PerTransfertCompartment } from '@/data/basecg';

const COMPARTMENT_BY_CONTRACT: Record<BaseCgRetraiteContractType, PerTransfertCompartment> = {
  PERIN: 'C1',
  PERP: 'C1',
  MADELIN: 'C1',
  ARTICLE83: 'C3',
  PERCO: 'C2',
  PER_POINTS: 'C1',
  AUTRE: 'C1',
};

export function resolvePerCompartiment(contractType: BaseCgRetraiteContractType): PerTransfertCompartment {
  return COMPARTMENT_BY_CONTRACT[contractType] ?? 'C1';
}
