import type { BaseCgRetraiteContractType, PerTransfertCompartment } from './types';

export const TYPE_LABELS: Record<BaseCgRetraiteContractType, string> = {
  PERIN: 'PER individuel',
  PERP: 'PERP',
  MADELIN: 'Madelin',
  ARTICLE83: 'Article 83 (pré-PACTE)',
  PEROB: 'PER obligatoire',
  PERCO: 'PERCO (pré-PACTE)',
  PERECO: 'PER d’entreprise collectif',
  PER_POINTS: 'Contrat en points',
  AUTRE: 'Autre',
};

export const COMPARTMENT_LABELS: Record<PerTransfertCompartment, string> = {
  C0: 'C0 (historique pré-2019)',
  C1: 'C1 (déductible)',
  C1_BIS: 'C1 bis (non déductible)',
  C2: 'C2 (épargne salariale)',
  C3: 'C3 (obligatoire)',
};
