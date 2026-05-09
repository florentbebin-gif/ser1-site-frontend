import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  AllocationTermDestination,
  AssociateInput,
  CompanyInput,
  CompanyKind,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
} from '@/engine/tresorerie/runtimeAccessors';

export {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
};

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

export const ALLOCATION_KIND_OPTIONS = [
  { value: 'distribution', label: 'Distribution' },
  { value: 'capitalisation', label: 'Capitalisation' },
] satisfies Array<{ value: AllocationPocketInput['kind']; label: string }>;

export const ALLOCATION_DESTINATION_OPTIONS = [
  { value: 'treasury', label: 'Trésorerie' },
  { value: 'matrix', label: 'Matrice' },
  { value: 'same_pocket', label: 'Même poche' },
] satisfies Array<{ value: AllocationTermDestination; label: string }>;

export const ALLOCATION_HORIZON_OPTIONS = [
  { value: 'court_terme', label: 'Court terme' },
  { value: 'moyen_terme', label: 'Moyen terme' },
  { value: 'long_terme', label: 'Long terme' },
] satisfies Array<{ value: AllocationPocketHorizon; label: string }>;

export function getAllocationHorizonLabel(horizon: AllocationPocketHorizon | undefined): string {
  return ALLOCATION_HORIZON_OPTIONS.find(option => option.value === horizon)?.label ?? 'Moyen terme';
}

export function getCompanyKind(company: CompanyInput): CompanyKind {
  return company.companyKind ?? 'holding_patrimoniale';
}

export function getCompanyKindLabel(company: CompanyInput): string {
  return COMPANY_KIND_LABELS[getCompanyKind(company)];
}

export function getCompanyKindCode(company: CompanyInput): string {
  return COMPANY_KIND_CODES[getCompanyKind(company)];
}

export function getOwnershipTotals(associates: AssociateInput[]): {
  capitalPct: number;
  economicRightsPct: number;
} {
  return associates.reduce(
    (sum, associate) => ({
      capitalPct: sum.capitalPct + getCapitalPct(associate),
      economicRightsPct: sum.economicRightsPct + getEconomicPct(associate),
    }),
    { capitalPct: 0, economicRightsPct: 0 },
  );
}

function getNextPocketIndex(pockets: AllocationPocketInput[]): number {
  let index = pockets.length + 1;
  const existingIds = new Set(pockets.map(pocket => pocket.id));
  while (existingIds.has(`poche-${index}`)) index += 1;
  return index;
}

export function buildDefaultPocket(pockets: AllocationPocketInput[]): AllocationPocketInput {
  const index = getNextPocketIndex(pockets);
  const zeroBasedIndex = Math.min(index - 1, 2);
  const horizon: AllocationPocketHorizon =
    zeroBasedIndex === 0 ? 'court_terme' : zeroBasedIndex === 1 ? 'moyen_terme' : 'long_terme';

  return {
    id: `poche-${index}`,
    kind: zeroBasedIndex === 0 ? 'distribution' : 'capitalisation',
    horizon,
    withdrawalPriority: index,
    durationYears: zeroBasedIndex === 0 ? 5 : 8,
    annualReturnRate: zeroBasedIndex === 0 ? 0.05 : 0.04,
    enjoymentDelayMonths: 0,
    initialAllocationPct: zeroBasedIndex === 0 ? 100 : 0,
    annualAllocationPct: zeroBasedIndex === 0 ? 100 : 0,
    repeatAtTerm: false,
    termDestination: 'treasury',
  };
}
