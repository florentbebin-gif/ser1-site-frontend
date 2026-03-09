import type { LienParente } from '../../engine/succession';
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

export interface SuccessionTestamentDistributionBeneficiary {
  id: string;
  beneficiaryRef: SuccessionBeneficiaryRef;
  label: string;
  lien: LienParente;
  partSuccession: number;
  exonerated?: boolean;
  source: 'testament';
}

export interface SuccessionTestamentDistributionResult {
  dispositionType: SuccessionDispositionTestamentaire | null;
  beneficiaries: SuccessionTestamentDistributionBeneficiary[];
  plafondTestament: number;
  requestedAmount: number;
  distributedAmount: number;
  warnings: string[];
}

interface ComputeSuccessionTestamentDistributionInput {
  situation: SituationMatrimoniale;
  side: SuccessionPrimarySide;
  testament: SuccessionTestamentConfig;
  masseReference: number;
  enfants: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  maxAvailableAmount?: number;
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

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
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

function getPrincipalBeneficiaryLabel(
  situation: SituationMatrimoniale,
  side: SuccessionPrimarySide,
): { id: string; label: string; lien: LienParente; exonerated?: boolean } {
  if (situation === 'marie') {
    return {
      id: 'conjoint',
      label: 'Conjoint survivant',
      lien: 'conjoint',
      exonerated: true,
    };
  }

  if (situation === 'pacse') {
    return {
      id: 'partenaire-pacse',
      label: 'Partenaire pacsé',
      lien: 'conjoint',
      exonerated: true,
    };
  }

  if (situation === 'concubinage') {
    return {
      id: 'concubin',
      label: 'Concubin',
      lien: 'autre',
    };
  }

  return {
    id: side,
    label: getPersonLabel(situation, side),
    lien: 'autre',
  };
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

function getFamilyMemberLien(type: FamilyMemberType): LienParente {
  if (type === 'petit_enfant') return 'petit_enfant';
  if (type === 'parent') return 'parent';
  if (type === 'frere_soeur') return 'frere_soeur';
  return 'autre';
}

function resolveTestamentBeneficiary(
  situation: SituationMatrimoniale,
  beneficiaryRef: SuccessionBeneficiaryRef,
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): Omit<SuccessionTestamentDistributionBeneficiary, 'partSuccession' | 'source'> | null {
  if (beneficiaryRef.startsWith('principal:')) {
    const side = beneficiaryRef.slice('principal:'.length) as SuccessionPrimarySide;
    const principal = getPrincipalBeneficiaryLabel(situation, side);
    return {
      id: principal.id,
      beneficiaryRef,
      label: principal.label,
      lien: principal.lien,
      exonerated: principal.exonerated,
    };
  }

  if (beneficiaryRef.startsWith('enfant:')) {
    const enfantId = beneficiaryRef.slice('enfant:'.length);
    const enfantIndex = enfants.findIndex((enfant) => enfant.id === enfantId);
    if (enfantIndex < 0) return null;
    const enfant = enfants[enfantIndex];
    return {
      id: enfant.id,
      beneficiaryRef,
      label: getEnfantParentLabel(enfant, enfantIndex),
      lien: 'enfant',
    };
  }

  if (beneficiaryRef.startsWith('family:')) {
    const memberId = beneficiaryRef.slice('family:'.length);
    const member = familyMembers.find((candidate) => candidate.id === memberId);
    if (!member) return null;
    return {
      id: member.id,
      beneficiaryRef,
      label: getFamilyMemberLabel(member, situation, enfants),
      lien: getFamilyMemberLien(member.type),
    };
  }

  return null;
}

function appendDistributionBeneficiary(
  beneficiaries: SuccessionTestamentDistributionBeneficiary[],
  beneficiary: Omit<SuccessionTestamentDistributionBeneficiary, 'partSuccession' | 'source'>,
  amount: number,
): void {
  const normalizedAmount = asAmount(amount);
  if (normalizedAmount <= 0) return;

  const existing = beneficiaries.find((candidate) => candidate.id === beneficiary.id);
  if (existing) {
    existing.partSuccession += normalizedAmount;
    return;
  }

  beneficiaries.push({
    ...beneficiary,
    partSuccession: normalizedAmount,
    source: 'testament',
  });
}

function clampTestamentAmount(
  requestedAmount: number,
  plafondTestament: number,
  warnings: string[],
): number {
  const normalizedRequested = asAmount(requestedAmount);
  const normalizedPlafond = asAmount(plafondTestament);
  if (normalizedRequested <= normalizedPlafond) return normalizedRequested;
  warnings.push('Montant testamentaire saisi au-delà de la part redistribuable retenue par le moteur: plafonnement appliqué.');
  return normalizedPlafond;
}

export function computeTestamentDistribution(
  input: ComputeSuccessionTestamentDistributionInput,
): SuccessionTestamentDistributionResult | null {
  const { testament } = input;
  if (!testament.active) return null;

  const warnings: string[] = ['Testament actif: valider les clauses exactes et leur articulation avec la réserve héréditaire.'];
  const plafondLegal = asAmount(input.masseReference)
    * getQuotiteDisponibleRatio(countEffectiveDescendantBranchesForDeceased(input.enfants, input.familyMembers, input.side));
  const plafondTestament = Math.min(
    plafondLegal,
    input.maxAvailableAmount == null ? asAmount(input.masseReference) : asAmount(input.maxAvailableAmount),
  );

  if (!testament.dispositionType) {
    warnings.push('Testament actif sans type de disposition: precisez le mecanisme testamentaire.');
    return {
      dispositionType: null,
      beneficiaries: [],
      plafondTestament,
      requestedAmount: 0,
      distributedAmount: 0,
      warnings,
    };
  }

  const beneficiaries: SuccessionTestamentDistributionBeneficiary[] = [];

  if (testament.dispositionType === 'legs_particulier') {
    const entries = testament.particularLegacies
      .map((entry) => ({
        ...entry,
        amount: asAmount(entry.amount),
      }))
      .filter((entry) => entry.amount > 0);
    const requestedAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    if (requestedAmount <= 0) {
      warnings.push('Legs particuliers selectionnes sans montant: renseignez la valeur des biens legues.');
      return {
        dispositionType: testament.dispositionType,
        beneficiaries,
        plafondTestament,
        requestedAmount,
        distributedAmount: 0,
        warnings,
      };
    }

    const distributedAmount = clampTestamentAmount(requestedAmount, plafondTestament, warnings);
    const ratio = requestedAmount > 0 ? distributedAmount / requestedAmount : 0;
    entries.forEach((entry) => {
      if (!entry.beneficiaryRef) {
        warnings.push('Un legs particulier sans beneficiaire a ete ignore.');
        return;
      }
      const resolved = resolveTestamentBeneficiary(
        input.situation,
        entry.beneficiaryRef,
        input.enfants,
        input.familyMembers,
      );
      if (!resolved) {
        warnings.push('Un beneficiaire de legs particulier est introuvable dans le contexte familial.');
        return;
      }
      appendDistributionBeneficiary(beneficiaries, resolved, entry.amount * ratio);
    });

    return {
      dispositionType: testament.dispositionType,
      beneficiaries,
      plafondTestament,
      requestedAmount,
      distributedAmount: beneficiaries.reduce((sum, beneficiary) => sum + beneficiary.partSuccession, 0),
      warnings,
    };
  }

  if (!testament.beneficiaryRef) {
    warnings.push('Testament actif sans beneficiaire: selectionnez la personne gratifiee.');
    return {
      dispositionType: testament.dispositionType,
      beneficiaries,
      plafondTestament,
      requestedAmount: 0,
      distributedAmount: 0,
      warnings,
    };
  }

  const resolvedBeneficiary = resolveTestamentBeneficiary(
    input.situation,
    testament.beneficiaryRef,
    input.enfants,
    input.familyMembers,
  );
  if (!resolvedBeneficiary) {
    warnings.push('Beneficiaire testamentaire introuvable dans le contexte familial.');
    return {
      dispositionType: testament.dispositionType,
      beneficiaries,
      plafondTestament,
      requestedAmount: 0,
      distributedAmount: 0,
      warnings,
    };
  }

  const requestedAmount = testament.dispositionType === 'legs_universel'
    ? asAmount(input.masseReference)
    : asAmount(input.masseReference) * (Math.min(100, Math.max(0, testament.quotePartPct)) / 100);
  if (testament.dispositionType === 'legs_titre_universel' && requestedAmount <= 0) {
    warnings.push('Quote-part de legs a titre universel nulle: renseignez un pourcentage pertinent.');
  }

  const distributedAmount = clampTestamentAmount(requestedAmount, plafondTestament, warnings);
  appendDistributionBeneficiary(beneficiaries, resolvedBeneficiary, distributedAmount);

  return {
    dispositionType: testament.dispositionType,
    beneficiaries,
    plafondTestament,
    requestedAmount,
    distributedAmount,
    warnings,
  };
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
