import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  CompanyKind,
  OwnershipLotInput,
  RuntimeAssociateInput,
  RuntimeCompanyInput,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
} from '@/engine/tresorerie/runtimeAccessors';
import {
  ALLOCATION_HORIZON_OPTIONS,
  COMPANY_KIND_CODES,
  COMPANY_KIND_LABELS,
} from './tresorerieSocieteOptions';

export {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
};

export function getAllocationHorizonLabel(horizon: AllocationPocketHorizon | undefined): string {
  return ALLOCATION_HORIZON_OPTIONS.find(option => option.value === horizon)?.label ?? 'Moyen terme';
}

export function getCompanyKind(company: RuntimeCompanyInput): CompanyKind {
  return company.companyKind ?? 'holding_patrimoniale';
}

export function getCompanyKindLabel(company: RuntimeCompanyInput): string {
  return COMPANY_KIND_LABELS[getCompanyKind(company)];
}

export function getCompanyKindCode(company: RuntimeCompanyInput): string {
  return COMPANY_KIND_CODES[getCompanyKind(company)];
}

export function getOwnershipTotals(associates: RuntimeAssociateInput[]): {
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

function getOwnershipFieldTotal(associate: RuntimeAssociateInput, field: OwnershipPctField): number {
  return associate.ownershipLots.reduce((sum, lot) => sum + clampPct(lot[field]), 0);
}

function scaleOwnershipField<T extends RuntimeAssociateInput>(
  associate: T,
  field: OwnershipPctField,
  ratio: number,
): T {
  return {
    ...associate,
    ownershipLots: associate.ownershipLots.map(lot => ({
      ...lot,
      [field]: roundPct(clampPct(lot[field]) * ratio),
    })),
  } as T;
}

function syncFullOwnershipLots<T extends RuntimeAssociateInput>(associates: T[]): T[] {
  return associates.map(associate => ({
    ...associate,
    ownershipLots: associate.ownershipLots.map(lot =>
      lot.right === 'pleine_propriete'
        ? { ...lot, economicRightsPct: lot.capitalPct }
        : lot,
    ),
  } as T));
}

function rebalanceOwnershipField<T extends RuntimeAssociateInput>(
  associates: T[],
  associateId: string,
  field: OwnershipPctField,
): T[] {
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

/**
 * Remplace l'intégralité du tableau `ownershipLots` d'un associé, puis rééquilibre
 * automatiquement le capital et les droits économiques des autres associés afin que
 * les sommes totales restent ≤ 100 %.
 *
 * Utilisé par la modale associé pour gérer la détention démembrée multi-lots
 * (ex. associé 1 = 10 % PP + 90 % US).
 */
export function updateAssociateOwnershipLots<T extends RuntimeAssociateInput>(
  associates: T[],
  associateId: string,
  nextLots: OwnershipLotInput[],
): T[] {
  const sanitizedLots: OwnershipLotInput[] = (nextLots.length === 0
    ? [defaultOwnershipLot()]
    : nextLots
  ).map(lot => {
    const capitalPct = clampPct(lot.capitalPct);
    const economicRightsPct = lot.right === 'pleine_propriete'
      ? capitalPct
      : clampPct(lot.economicRightsPct);
    return { ...lot, capitalPct, economicRightsPct };
  });

  const patched = associates.map(associate =>
    associate.id === associateId
      ? ({ ...associate, ownershipLots: sanitizedLots } as T)
      : associate,
  );

  const rebalanced = OWNERSHIP_PCT_FIELDS.reduce(
    (next, field) => rebalanceOwnershipField(next, associateId, field),
    patched,
  );
  return syncFullOwnershipLots(rebalanced);
}

/**
 * Somme du `capitalPct` détenu en pleine propriété par un associé.
 * Utilisé par le moteur pour répartir la distribution issue des réserves
 * quand la checkbox « réserves démembrées appréhendées par l'usufruitier »
 * est décochée.
 */
export function getPlainPropertyCapitalPct(associate: RuntimeAssociateInput): number {
  return associate.ownershipLots
    .filter(lot => lot.right === 'pleine_propriete')
    .reduce((sum, lot) => sum + clampPct(lot.capitalPct), 0);
}

/**
 * Détecte si la société comporte au moins un lot démembré (usufruit ou nue-propriété).
 * Sert au défaut de la checkbox société sur l'attribution des réserves.
 */
export function hasDemembrement(associates: RuntimeAssociateInput[]): boolean {
  return associates.some(associate =>
    associate.ownershipLots.some(lot => lot.right !== 'pleine_propriete'),
  );
}

export function updateAssociateOwnershipLot<T extends RuntimeAssociateInput>(
  associates: T[],
  associateId: string,
  lotPatch: Partial<OwnershipLotInput>,
): T[] {
  const fieldsToRebalance = new Set<OwnershipPctField>();
  const patched = associates.map(associate => {
    if (associate.id !== associateId) return associate;
    const [firstLot = defaultOwnershipLot(), ...otherLots] = associate.ownershipLots;
    const right = lotPatch.right ?? firstLot.right;
    const capitalPct = hasOwn(lotPatch, 'capitalPct')
      ? clampPct(lotPatch.capitalPct)
      : firstLot.capitalPct;
    const economicRightsPct = right === 'pleine_propriete'
      ? capitalPct
      : hasOwn(lotPatch, 'economicRightsPct')
        ? clampPct(lotPatch.economicRightsPct)
        : firstLot.economicRightsPct;
    if (hasOwn(lotPatch, 'capitalPct')) fieldsToRebalance.add('capitalPct');
    if (hasOwn(lotPatch, 'economicRightsPct') || right === 'pleine_propriete') {
      fieldsToRebalance.add('economicRightsPct');
    }
    const nextLot = {
      ...firstLot,
      ...lotPatch,
      right,
      capitalPct,
      economicRightsPct,
    };
    return { ...associate, ownershipLots: [nextLot, ...otherLots] };
  });

  const rebalanced = OWNERSHIP_PCT_FIELDS.reduce(
    (nextAssociates, field) => fieldsToRebalance.has(field)
      ? rebalanceOwnershipField(nextAssociates, associateId, field)
      : nextAssociates,
    patched,
  );
  return syncFullOwnershipLots(rebalanced);
}

function getNextPocketIndex(pockets: AllocationPocketInput[]): number {
  let index = pockets.length + 1;
  const existingIds = new Set(pockets.map(pocket => pocket.id));
  while (existingIds.has(`poche-${index}`)) index += 1;
  return index;
}

export function buildDefaultPocket(
  pockets: AllocationPocketInput[],
  preferredHorizon?: AllocationPocketHorizon,
): AllocationPocketInput {
  const index = getNextPocketIndex(pockets);
  const zeroBasedIndex = Math.min(index - 1, 2);
  const horizon: AllocationPocketHorizon =
    preferredHorizon ??
    (zeroBasedIndex === 0 ? 'court_terme' : zeroBasedIndex === 1 ? 'moyen_terme' : 'long_terme');
  const isShortTerm = horizon === 'court_terme';

  return {
    id: `poche-${index}`,
    kind: isShortTerm ? 'distribution' : 'capitalisation',
    horizon,
    durationYears: isShortTerm ? 5 : 8,
    annualReturnRate: isShortTerm ? 0.05 : 0.04,
    enjoymentDelayMonths: 0,
    initialAllocationPct: isShortTerm ? 100 : 0,
    annualAllocationPct: isShortTerm ? 100 : 0,
    repeatAtTerm: false,
  };
}
