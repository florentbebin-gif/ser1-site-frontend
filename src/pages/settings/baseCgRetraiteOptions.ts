import type { BaseCgRetraiteContractType, PerTransfertCompartment } from '@/data/basecg';

export const TYPE_LABELS: Record<BaseCgRetraiteContractType, string> = {
  PERIN: 'PER individuel',
  PERP: 'PERP',
  MADELIN: 'Madelin',
  ARTICLE83: 'Article 83',
  PERCO: 'PERCO',
  PER_POINTS: 'Contrat en points',
  AUTRE: 'Autre',
};

export const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as BaseCgRetraiteContractType[];

export const COMPARTMENT_LABELS: Record<PerTransfertCompartment, string> = {
  C1: 'C1 - Versements déductibles',
  C1_BIS: 'C1 bis - Versements non déductibles',
  C2: 'C2 - Épargne salariale',
  C3: 'C3 - Obligatoire',
};

export const COMPARTMENT_OPTIONS = Object.keys(COMPARTMENT_LABELS) as PerTransfertCompartment[];
