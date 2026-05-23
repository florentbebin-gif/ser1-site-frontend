import type { SimSelectOption } from '@/components/ui/sim';

export const TARGET_DECES_MULTIPLE = 3;

export const FAMILY_OPTIONS: SimSelectOption[] = [
  { value: 'celibataire', label: 'Célibataire' },
  { value: 'couple', label: 'Couple' },
  { value: 'marie', label: 'Marié' },
  { value: 'pacs', label: 'Pacs' },
  { value: 'divorce', label: 'Divorcé' },
  { value: 'veuf', label: 'Veuf' },
];

export const ASSIETTE_OPTIONS: SimSelectOption[] = [
  { value: 'TA', label: 'TA' },
  { value: 'TA-TB', label: 'TA + TB' },
  { value: 'TA-TB-TC', label: 'TA + TB + TC' },
];

export const ACTE_OPTIONS: SimSelectOption[] = [
  { value: 'due', label: 'DUE' },
  { value: 'referendum', label: 'Référendum' },
  { value: 'accord', label: 'Accord collectif' },
];
