import type { BaseCgRetraiteContractType, PerTransfertCompartment } from '@/data/base-cg-retraite';

const COMPARTMENT_BY_CONTRACT: Record<BaseCgRetraiteContractType, PerTransfertCompartment> = {
  PERIN: 'C1',
  PERP: 'C1',
  MADELIN: 'C1',
  ARTICLE83: 'C3',
  PEROB: 'C3',
  PERCO: 'C2',
  PERECO: 'C2',
  PER_POINTS: 'C1',
  AUTRE: 'C1',
};

export function resolvePerCompartiment(
  contractType: BaseCgRetraiteContractType,
  override?: PerTransfertCompartment | null,
): PerTransfertCompartment {
  if (override === 'C0') return 'C1';
  if (override) return override;
  return COMPARTMENT_BY_CONTRACT[contractType] ?? 'C1';
}
