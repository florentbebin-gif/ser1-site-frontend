import type { AllocationPocketHorizon, CompanyKind } from '@/engine/tresorerie/types';

export const COMPANY_KIND_LABELS: Record<CompanyKind, string> = {
  holding_patrimoniale: 'Holding patrimoniale',
  holding_remuneration: 'Holding de rémunération',
  holding_animatrice: 'Holding animatrice',
  societe_exploitation: 'Société d’exploitation',
};

export const COMPANY_KIND_CODES: Record<CompanyKind, string> = {
  holding_patrimoniale: 'HP',
  holding_remuneration: 'HR',
  holding_animatrice: 'HA',
  societe_exploitation: 'SE',
};

export const ALLOCATION_HORIZON_OPTIONS = [
  { value: 'court_terme', label: 'Court terme' },
  { value: 'moyen_terme', label: 'Moyen terme' },
  { value: 'long_terme', label: 'Long terme' },
] satisfies Array<{ value: AllocationPocketHorizon; label: string }>;
