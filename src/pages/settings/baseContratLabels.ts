/**
 * Labels FR — Base-Contrat (UI /settings/base-contrat).
 * PR3 cleanup: la page est devenue read-only, donc on conserve uniquement
 * les labels encore utilisés.
 */

export type PhaseKey = 'constitution' | 'sortie' | 'deces';

export const PHASE_LABELS: Record<PhaseKey, string> = {
  constitution: 'Constitution',
  sortie: 'Sortie / Rachat',
  deces: 'Décès / Transmission',
};

export const GRANDE_FAMILLE_OPTIONS = [
  'Épargne Assurance',
  'Assurance prévoyance',
  'Épargne bancaire',
  'Valeurs mobilières',
  'Immobilier direct',
  'Immobilier indirect',
  'Non coté/PE',
  'Créances/Droits',
  'Dispositifs fiscaux immobilier',
  'Retraite & épargne salariale',
  'Autres',
] as const;
