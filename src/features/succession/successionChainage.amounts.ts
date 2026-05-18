import type { FamilyMember } from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';
import type { SuccessionResolvedPreciputSelection } from './successionPreciput';
import type {
  SuccessionChainOrder,
  SuccessionChainPreciputSelectionSummary,
  SuccessionChainageInput,
} from './successionChainage.types';

export function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

export function asChildrenCount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

export function hasRepresentationOnAnySide(
  enfantsContext: SuccessionChainageInput['enfantsContext'] extends infer T
    ? NonNullable<T>
    : never,
  familyMembers: FamilyMember[],
): boolean {
  return buildSuccessionDescendantRecipients(enfantsContext, familyMembers).some(
    (recipient) => recipient.lien === 'petit_enfant',
  );
}

export function getOtherSide(order: SuccessionChainOrder): SuccessionDeceasedSide {
  return order === 'epoux1' ? 'epoux2' : 'epoux1';
}

export function getLabelForSide(side: SuccessionDeceasedSide): string {
  return side === 'epoux1' ? 'Epoux 1' : 'Epoux 2';
}

export function buildTargetedPreciputSelectionsSummary(
  targetedSelections: SuccessionResolvedPreciputSelection[],
  requestedAmount: number,
  appliedAmount: number,
): SuccessionChainPreciputSelectionSummary[] {
  if (requestedAmount <= 0 || appliedAmount <= 0) {
    return targetedSelections.map((selection) => ({
      id: selection.selection.id,
      sourceType: selection.selection.sourceType,
      sourceId: selection.selection.sourceId,
      label: selection.candidate.label,
      pocket: selection.candidate.pocket,
      requestedAmount: selection.amount,
      appliedAmount: 0,
    }));
  }

  const ratio = Math.min(1, Math.max(0, appliedAmount / requestedAmount));
  return targetedSelections.map((selection) => ({
    id: selection.selection.id,
    sourceType: selection.selection.sourceType,
    sourceId: selection.selection.sourceId,
    label: selection.candidate.label,
    pocket: selection.candidate.pocket,
    requestedAmount: selection.amount,
    appliedAmount: selection.amount * ratio,
  }));
}

function getStepWarnings(
  stepLabel: string,
  enfantsContext: NonNullable<SuccessionChainageInput['enfantsContext']>,
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
  hasAllocatedBeneficiaries = false,
): string[] {
  if (hasAllocatedBeneficiaries) return [];
  const branchCount = countEffectiveDescendantBranchesForDeceased(
    enfantsContext,
    familyMembers,
    deceased,
  );
  if (branchCount > 0) return [];
  const allRecipients = buildSuccessionDescendantRecipients(enfantsContext, familyMembers);
  if (allRecipients.length === 0) return [];
  return [
    `${stepLabel}: aucun descendant du defunt de cette etape n'est eligible dans la branche retenue.`,
  ];
}

export function countSideParents(
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
): number {
  return familyMembers.filter(
    (member) => member.type === 'parent' && (!member.branch || member.branch === deceased),
  ).length;
}

export function getStepEligibilityWarnings(
  stepLabel: string,
  enfantsContext: NonNullable<SuccessionChainageInput['enfantsContext']>,
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
  hasAllocatedBeneficiaries = false,
): string[] {
  return getStepWarnings(
    stepLabel,
    enfantsContext,
    familyMembers,
    deceased,
    hasAllocatedBeneficiaries,
  );
}
