import {
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from './successionDraft';
import type {
  FamilyBranch,
  FamilyMember,
  FamilyMemberType,
  SituationMatrimoniale,
  SuccessionAssetDetailEntry,
  SuccessionAssetOwner,
  SuccessionDonationEntry,
  SuccessionDonationEntreEpouxOption,
  SuccessionEnfant,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft';
import { getEnfantNodeLabel } from './successionEnfants';
import { cloneSuccessionTestamentsBySide } from './successionTestament';
import {
  BRANCH_OPTIONS,
  CLAUSE_CONJOINT_LABEL,
  CLAUSE_ENFANTS_LABEL,
  MEMBER_TYPE_OPTIONS,
  TESTAMENT_SIDES,
} from './successionSimulator.constants';

export interface DispositionsDraftState {
  attributionBiensCommunsPct: number;
  donationEntreEpouxActive: boolean;
  donationEntreEpouxOption: SuccessionDonationEntreEpouxOption;
  preciputMontant: number;
  attributionIntegrale: boolean;
  choixLegalConjointSansDDV: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.choixLegalConjointSansDDV;
  testamentsBySide: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide;
  ascendantsSurvivantsBySide: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide;
}

export interface AddFamilyMemberFormState {
  type: FamilyMemberType | '';
  branch: FamilyBranch | '';
  parentEnfantId: string;
}

export const EMPTY_ADD_FAMILY_MEMBER_FORM: AddFamilyMemberFormState = {
  type: '',
  branch: '',
  parentEnfantId: '',
};

export function fmt(v: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(v);
}

export function isCoupleSituation(situation: SituationMatrimoniale): boolean {
  return situation === 'marie' || situation === 'pacse' || situation === 'concubinage';
}

export function getBirthDateLabels(
  situation: SituationMatrimoniale,
): { primary: string; secondary?: string } {
  if (situation === 'marie') {
    return { primary: 'Date Naiss. Ep1', secondary: 'Date Naiss. Ep2' };
  }
  if (situation === 'pacse') {
    return { primary: 'Date Naiss. Part. 1', secondary: 'Date Naiss. Part. 2' };
  }
  if (situation === 'concubinage') {
    return { primary: 'Date Naiss. Pers. 1', secondary: 'Date Naiss. Pers. 2' };
  }
  return { primary: 'Date Naiss. Défunt(e)' };
}

export function createEnfantId(): string {
  return `enf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createMemberId(): string {
  return `mbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDonationId(): string {
  return `don-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAssetId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAssuranceVieId(): string {
  return `av-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createPerId(): string {
  return `per-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneAscendantsSurvivantsBySide(
  ascendantsBySide: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
): typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide {
  return {
    epoux1: ascendantsBySide.epoux1,
    epoux2: ascendantsBySide.epoux2,
  };
}

export function buildInitialDispositionsDraft(): DispositionsDraftState {
  return {
    attributionBiensCommunsPct: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionBiensCommunsPct,
    donationEntreEpouxActive: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxActive,
    donationEntreEpouxOption: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.donationEntreEpouxOption,
    preciputMontant: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.preciputMontant,
    attributionIntegrale: DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT.attributionIntegrale,
    choixLegalConjointSansDDV: DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.choixLegalConjointSansDDV,
    testamentsBySide: cloneSuccessionTestamentsBySide(DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide),
    ascendantsSurvivantsBySide: cloneAscendantsSurvivantsBySide(
      DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
    ),
  };
}

export function updateDraftTestament(
  draft: DispositionsDraftState,
  side: SuccessionPrimarySide,
  updater: (_current: SuccessionTestamentConfig) => SuccessionTestamentConfig,
): DispositionsDraftState {
  return {
    ...draft,
    testamentsBySide: {
      ...draft.testamentsBySide,
      [side]: updater(draft.testamentsBySide[side]),
    },
  };
}

export function getTestamentParticularLegaciesTotal(
  testamentsBySide: DispositionsDraftState['testamentsBySide'],
): number {
  return TESTAMENT_SIDES.reduce(
    (sum, side) => sum + testamentsBySide[side].particularLegacies.reduce(
      (acc, entry) => acc + Math.max(0, entry.amount),
      0,
    ),
    0,
  );
}

export function getDonationEffectiveAmount(entry: SuccessionDonationEntry): number {
  return Math.max(0, entry.valeurActuelle ?? entry.montant);
}

export function buildAggregateAssetEntries(values: {
  actifs: Record<SuccessionAssetOwner, number>;
  passifs: Record<SuccessionAssetOwner, number>;
}): SuccessionAssetDetailEntry[] {
  const order: SuccessionAssetOwner[] = ['epoux1', 'epoux2', 'commun'];
  const entries: SuccessionAssetDetailEntry[] = [];

  order.forEach((owner) => {
    if (values.actifs[owner] > 0) {
      entries.push({
        id: createAssetId(),
        owner,
        category: 'divers',
        subCategory: 'Saisie agrégée',
        amount: values.actifs[owner],
        label: 'Actifs simplifiés',
      });
    }
    if (values.passifs[owner] > 0) {
      entries.push({
        id: createAssetId(),
        owner,
        category: 'passif',
        subCategory: 'Saisie agrégée',
        amount: values.passifs[owner],
        label: 'Passifs simplifiés',
      });
    }
  });

  return entries;
}

export function labelMember(member: FamilyMember, enfants: SuccessionEnfant[]): string {
  const typeLabel = MEMBER_TYPE_OPTIONS.find((option) => option.value === member.type)?.label ?? member.type;

  if (member.type === 'petit_enfant' && member.parentEnfantId) {
    const idx = enfants.findIndex((enfant) => enfant.id === member.parentEnfantId);
    return idx >= 0
      ? `${typeLabel} (fils/fille de ${getEnfantNodeLabel(idx, enfants[idx]?.deceased)})`
      : typeLabel;
  }

  if (member.branch) {
    const branchLabel = BRANCH_OPTIONS.find((option) => option.value === member.branch)?.label ?? member.branch;
    return `${typeLabel} (${branchLabel})`;
  }

  return typeLabel;
}

export function getClausePreset(clause?: string): string {
  if (!clause || clause === CLAUSE_CONJOINT_LABEL) return 'conjoint_enfants';
  if (clause === CLAUSE_ENFANTS_LABEL) return 'enfants_parts_egales';
  return 'personnalisee';
}

export function parseCustomClause(clause: string): Record<string, number> {
  if (!clause.startsWith('CUSTOM:')) return {};

  const result: Record<string, number> = {};
  for (const part of clause.slice(7).split(';')) {
    const sep = part.indexOf(':');
    if (sep > 0) {
      result[part.slice(0, sep)] = Number(part.slice(sep + 1)) || 0;
    }
  }

  return result;
}

export function serializeCustomClause(parts: Record<string, number>): string {
  return 'CUSTOM:' + Object.entries(parts)
    .map(([id, pct]) => `${id}:${pct}`)
    .join(';');
}

function getGenericFamilyMemberTypeLabel(type: FamilyMemberType): string {
  switch (type) {
    case 'petit_enfant':
      return 'Petit-enfant';
    case 'parent':
      return 'Parent';
    case 'frere_soeur':
      return 'Frère / sœur';
    case 'oncle_tante':
      return 'Oncle / tante';
    case 'tierce_personne':
      return 'Tierce personne';
    default:
      return 'Membre';
  }
}

export function isSupportedStructuredClause(clause?: string): boolean {
  return !clause
    || clause === CLAUSE_CONJOINT_LABEL
    || clause === CLAUSE_ENFANTS_LABEL
    || clause.startsWith('CUSTOM:');
}

export function buildPrevoyanceClauseOptions(
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [
    { value: CLAUSE_CONJOINT_LABEL, label: 'Clause standard' },
  ];

  if (enfantsContext.length > 0) {
    options.push({ value: CLAUSE_ENFANTS_LABEL, label: 'Enfants par parts égales' });
    enfantsContext.forEach((enfant, index) => {
      options.push({
        value: serializeCustomClause({ [enfant.id]: 100 }),
        label: `${enfant.deceased ? '† ' : ''}Enfant ${index + 1}`,
      });
    });
  }

  const counts: Partial<Record<FamilyMemberType, number>> = {};
  familyMembers.forEach((member) => {
    const nextCount = (counts[member.type] ?? 0) + 1;
    counts[member.type] = nextCount;
    options.push({
      value: serializeCustomClause({ [member.id]: 100 }),
      label: `${getGenericFamilyMemberTypeLabel(member.type)} ${nextCount}`,
    });
  });

  return options;
}
