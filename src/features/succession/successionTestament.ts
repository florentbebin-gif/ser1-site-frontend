import type {
  FamilyMember,
  FamilyMemberType,
  SituationMatrimoniale,
  SuccessionBeneficiaryRef,
  SuccessionDevolutionContext,
  SuccessionDispositionTestamentaire,
  SuccessionEnfant,
  SuccessionParticularLegacyEntry,
  SuccessionPrimarySide,
  SuccessionTestamentConfig,
} from './successionDraft';
import {
  countEffectiveDescendantBranchesForDeceased,
  getEnfantParentLabel,
  getRelevantSuccessionEnfants,
} from './successionEnfants';

export const TESTAMENT_TYPE_DESCRIPTIONS: Record<SuccessionDispositionTestamentaire, string> = {
  legs_universel: 'Toute la succession est leguee a une personne, sous reserve des droits reserves des enfants.',
  legs_titre_universel: 'Une quote-part de la succession ou une categorie de biens est leguee.',
  legs_particulier: 'Un bien ou un montant precis est legue.',
};

export interface SuccessionTestamentBeneficiaryOption {
  value: SuccessionBeneficiaryRef;
  label: string;
  description?: string;
}

function createParticularLegacyId(): string {
  return `leg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSuccessionParticularLegacyEntry(
  beneficiaryRef: SuccessionBeneficiaryRef | null = null,
): SuccessionParticularLegacyEntry {
  return {
    id: createParticularLegacyId(),
    beneficiaryRef,
    amount: 0,
  };
}

export function cloneSuccessionTestamentConfig(config: SuccessionTestamentConfig): SuccessionTestamentConfig {
  return {
    ...config,
    particularLegacies: config.particularLegacies.map((entry) => ({ ...entry })),
  };
}

export function cloneSuccessionTestamentsBySide(
  testamentsBySide: SuccessionDevolutionContext['testamentsBySide'],
): SuccessionDevolutionContext['testamentsBySide'] {
  return {
    epoux1: cloneSuccessionTestamentConfig(testamentsBySide.epoux1),
    epoux2: cloneSuccessionTestamentConfig(testamentsBySide.epoux2),
  };
}

export function getCounterpartSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

export function getTestamentConfigForSide(
  context: Pick<SuccessionDevolutionContext, 'testamentsBySide'>,
  side: SuccessionPrimarySide,
): SuccessionTestamentConfig {
  return context.testamentsBySide[side];
}

export function hasActiveTestamentForSide(
  context: Pick<SuccessionDevolutionContext, 'testamentsBySide'>,
  side: SuccessionPrimarySide,
): boolean {
  return getTestamentConfigForSide(context, side).active;
}

export function getAscendantsSurvivantsForSide(
  context: Pick<SuccessionDevolutionContext, 'ascendantsSurvivantsBySide'>,
  side: SuccessionPrimarySide,
): boolean {
  return context.ascendantsSurvivantsBySide[side];
}

export function getQuotiteDisponibleRatio(branchCount: number): number {
  if (branchCount <= 0) return 1;
  if (branchCount === 1) return 0.5;
  if (branchCount === 2) return 1 / 3;
  return 0.25;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export function getQuotiteDisponiblePctForSide(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  side: SuccessionPrimarySide,
): number {
  return getQuotiteDisponibleRatio(
    countEffectiveDescendantBranchesForDeceased(enfants, familyMembers, side),
  ) * 100;
}

export function getReserveHintForSide(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  side: SuccessionPrimarySide,
): string | null {
  const branchCount = countEffectiveDescendantBranchesForDeceased(enfants, familyMembers, side);
  if (branchCount <= 0) return null;
  const reservePct = 100 - (getQuotiteDisponibleRatio(branchCount) * 100);
  return `reservataire - min. ${formatPercent(reservePct / branchCount)} %`;
}

function isCoupleSituation(situation: SituationMatrimoniale): boolean {
  return situation === 'marie' || situation === 'pacse' || situation === 'concubinage';
}

function getPersonLabel(
  situation: SituationMatrimoniale,
  side: SuccessionPrimarySide,
): string {
  if (situation === 'marie') return side === 'epoux1' ? 'Epoux 1' : 'Epoux 2';
  if (situation === 'pacse') return side === 'epoux1' ? 'Partenaire 1' : 'Partenaire 2';
  if (situation === 'concubinage') return side === 'epoux1' ? 'Personne 1' : 'Personne 2';
  return 'Defunt(e)';
}

export function getTestamentCardTitle(
  situation: SituationMatrimoniale,
  side: SuccessionPrimarySide,
): string {
  return getPersonLabel(situation, side);
}

function getBranchLabel(
  situation: SituationMatrimoniale,
  branch: SuccessionPrimarySide,
): string {
  if (situation === 'marie') return branch === 'epoux1' ? 'cote Epoux 1' : 'cote Epoux 2';
  if (situation === 'pacse') return branch === 'epoux1' ? 'cote Partenaire 1' : 'cote Partenaire 2';
  if (situation === 'concubinage') return branch === 'epoux1' ? 'cote Personne 1' : 'cote Personne 2';
  if (situation === 'divorce') return branch === 'epoux1' ? 'cote Defunt(e)' : "cote Ex-conjoint(e)";
  return 'cote Defunt(e)';
}

function getFamilyMemberTypeLabel(type: FamilyMemberType): string {
  if (type === 'petit_enfant') return 'Petit-enfant';
  if (type === 'parent') return 'Parent';
  if (type === 'frere_soeur') return 'Frere / soeur';
  if (type === 'oncle_tante') return 'Oncle / tante';
  return 'Tierce personne';
}

function getFamilyMemberLabel(
  member: FamilyMember,
  situation: SituationMatrimoniale,
  enfants: SuccessionEnfant[],
): string {
  const baseLabel = getFamilyMemberTypeLabel(member.type);
  if (member.type === 'petit_enfant' && member.parentEnfantId) {
    const parentIndex = enfants.findIndex((enfant) => enfant.id === member.parentEnfantId);
    if (parentIndex >= 0) return `${baseLabel} (branche ${getEnfantParentLabel(enfants[parentIndex], parentIndex)})`;
  }
  if (member.branch) return `${baseLabel} (${getBranchLabel(situation, member.branch)})`;
  return baseLabel;
}

export function buildTestamentBeneficiaryOptions(
  situation: SituationMatrimoniale,
  side: SuccessionPrimarySide,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): SuccessionTestamentBeneficiaryOption[] {
  const options: SuccessionTestamentBeneficiaryOption[] = [];
  const reserveHint = getReserveHintForSide(enfants, familyMembers, side);
  const relevantEnfantIds = new Set(getRelevantSuccessionEnfants(enfants, side).map((enfant) => enfant.id));

  if (isCoupleSituation(situation)) {
    const counterpart = getCounterpartSide(side);
    options.push({
      value: `principal:${counterpart}`,
      label: getPersonLabel(situation, counterpart),
      description: situation === 'marie'
        ? 'Conjoint survivant'
        : situation === 'pacse'
          ? 'Partenaire survivant'
          : 'Autre membre du couple',
    });
  }

  enfants.forEach((enfant, index) => {
    const reserveSuffix = relevantEnfantIds.has(enfant.id) && reserveHint ? ` - ${reserveHint}` : '';
    options.push({
      value: `enfant:${enfant.id}`,
      label: `${getEnfantParentLabel(enfant, index)}${reserveSuffix}`,
      description: relevantEnfantIds.has(enfant.id) && reserveHint
        ? 'Descendant avec reserve hereditaire'
        : 'Enfant declare dans le contexte familial',
    });
  });

  familyMembers.forEach((member) => {
    options.push({
      value: `family:${member.id}`,
      label: getFamilyMemberLabel(member, situation, enfants),
      description: 'Membre declare dans le contexte familial',
    });
  });

  return options;
}
