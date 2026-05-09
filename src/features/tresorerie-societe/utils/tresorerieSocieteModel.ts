import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  AllocationTermDestination,
  AssociateInput,
  CompanyInput,
  CompanyKind,
  OwnershipLotInput,
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

type OwnershipPctField = 'capitalPct' | 'economicRightsPct';

const OWNERSHIP_PCT_FIELDS: OwnershipPctField[] = ['capitalPct', 'economicRightsPct'];

function hasOwn(object: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function clampPct(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value ?? 0, 0), 100);
}

function roundPct(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function defaultOwnershipLot(): OwnershipLotInput {
  return { right: 'pleine_propriete', capitalPct: 0, economicRightsPct: 0 };
}

function getOwnershipFieldTotal(associate: AssociateInput, field: OwnershipPctField): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + clampPct(lot[field]), 0);
}

function scaleOwnershipField(
  associate: AssociateInput,
  field: OwnershipPctField,
  ratio: number,
): AssociateInput {
  return {
    ...associate,
    ownershipLots: associate.ownershipLots.map(lot => ({
      ...lot,
      [field]: roundPct(clampPct(lot[field]) * ratio),
    })),
  };
}

function rebalanceOwnershipField(
  associates: AssociateInput[],
  associateId: string,
  field: OwnershipPctField,
): AssociateInput[] {
  const selected = associates.find(associate => associate.id === associateId);
  if (!selected) return associates;

  const selectedTotal = getOwnershipFieldTotal(selected, field);
  if (selectedTotal >= 100) {
    return associates.map(associate =>
      associate.id === associateId
        ? scaleOwnershipField(associate, field, 100 / selectedTotal)
        : scaleOwnershipField(associate, field, 0),
    );
  }

  const total = associates.reduce((sum, associate) => sum + getOwnershipFieldTotal(associate, field), 0);
  if (total <= 100) return associates;

  const remainingPct = 100 - selectedTotal;
  const otherTotal = total - selectedTotal;
  if (otherTotal <= 0) return associates;
  const ratio = remainingPct / otherTotal;

  return associates.map(associate =>
    associate.id === associateId ? associate : scaleOwnershipField(associate, field, ratio),
  );
}

export function updateAssociateOwnershipLot(
  associates: AssociateInput[],
  associateId: string,
  lotPatch: Partial<OwnershipLotInput>,
): AssociateInput[] {
  const patched = associates.map(associate => {
    if (associate.id !== associateId) return associate;
    const [firstLot = defaultOwnershipLot(), ...otherLots] = associate.ownershipLots;
    const nextLot = {
      ...firstLot,
      ...lotPatch,
      capitalPct: hasOwn(lotPatch, 'capitalPct')
        ? clampPct(lotPatch.capitalPct)
        : firstLot.capitalPct,
      economicRightsPct: hasOwn(lotPatch, 'economicRightsPct')
        ? clampPct(lotPatch.economicRightsPct)
        : firstLot.economicRightsPct,
    };
    return { ...associate, ownershipLots: [nextLot, ...otherLots] };
  });

  return OWNERSHIP_PCT_FIELDS.reduce(
    (nextAssociates, field) => hasOwn(lotPatch, field)
      ? rebalanceOwnershipField(nextAssociates, associateId, field)
      : nextAssociates,
    patched,
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
