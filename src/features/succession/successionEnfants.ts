import type { LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionEnfant,
  SuccessionEnfantRattachement,
  SituationMatrimoniale,
} from './successionDraft.types';

export interface SuccessionDescendantRecipient {
  id: string;
  label: string;
  lien: Extract<LienParente, 'enfant' | 'petit_enfant'>;
  branchId: string;
  branchLabel: string;
}

export function buildRepresentationAbattementOverrides(
  recipients: SuccessionDescendantRecipient[],
  branchAllowance: number,
): Map<string, number> {
  const overrides = new Map<string, number>();
  const recipientsByBranch = recipients.reduce((map, recipient) => {
    const branchRecipients = map.get(recipient.branchId) ?? [];
    branchRecipients.push(recipient);
    map.set(recipient.branchId, branchRecipients);
    return map;
  }, new Map<string, SuccessionDescendantRecipient[]>());

  recipientsByBranch.forEach((branchRecipients) => {
    const representedRecipients = branchRecipients.filter((recipient) => recipient.lien === 'petit_enfant');
    if (representedRecipients.length === 0) return;

    const allowanceByRecipient = branchAllowance / representedRecipients.length;
    representedRecipients.forEach((recipient) => {
      overrides.set(recipient.id, allowanceByRecipient);
    });
  });

  return overrides;
}

export type SuccessionDeceasedSide = 'epoux1' | 'epoux2';

export function countLivingEnfants(enfants: SuccessionEnfant[]): number {
  return enfants.filter((enfant) => !enfant.deceased).length;
}

export function countLivingNonCommuns(enfants: SuccessionEnfant[]): number {
  return enfants.filter((enfant) => !enfant.deceased && enfant.rattachement !== 'commun').length;
}

function buildGlobalEnfantNodeLabelMap(enfants: SuccessionEnfant[]): Map<string, string> {
  return enfants.reduce((map, enfant, index) => {
    map.set(enfant.id, getEnfantNodeLabel(index, enfant.deceased));
    return map;
  }, new Map<string, string>());
}

export function getEnfantNodeLabel(index: number, deceased?: boolean): string {
  return `${deceased ? '†' : ''}E${index + 1}`;
}

export function getEnfantParentLabel(enfant: SuccessionEnfant, index: number): string {
  const baseLabel = enfant.prenom ?? getEnfantNodeLabel(index, enfant.deceased);
  return enfant.deceased ? `† ${baseLabel}` : baseLabel;
}

export function getPetitEnfantsRepresentants(
  parentEnfantId: string,
  familyMembers: FamilyMember[],
): FamilyMember[] {
  return familyMembers.filter((member) => member.type === 'petit_enfant' && member.parentEnfantId === parentEnfantId);
}

export function countEffectiveDescendantBranches(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): number {
  return enfants.reduce((count, enfant) => {
    if (!enfant.deceased) return count + 1;
    return getPetitEnfantsRepresentants(enfant.id, familyMembers).length > 0 ? count + 1 : count;
  }, 0);
}

export function getRelevantSuccessionEnfants(
  enfants: SuccessionEnfant[],
  deceased: SuccessionDeceasedSide,
): SuccessionEnfant[] {
  return enfants.filter(
    (enfant) => enfant.rattachement === 'commun' || enfant.rattachement === deceased,
  );
}

export function getRelevantSuccessionFamilyMembers(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
): FamilyMember[] {
  const relevantEnfantIds = new Set(getRelevantSuccessionEnfants(enfants, deceased).map((enfant) => enfant.id));
  return familyMembers.filter(
    (member) => member.type !== 'petit_enfant'
      || (member.parentEnfantId && relevantEnfantIds.has(member.parentEnfantId)),
  );
}

export function countEffectiveDescendantBranchesForDeceased(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
): number {
  return countEffectiveDescendantBranches(
    getRelevantSuccessionEnfants(enfants, deceased),
    getRelevantSuccessionFamilyMembers(enfants, familyMembers, deceased),
  );
}

export function buildSuccessionDescendantRecipients(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  labelMap?: Map<string, string>,
): SuccessionDescendantRecipient[] {
  return enfants.flatMap<SuccessionDescendantRecipient>((enfant, index) => {
    const branchLabel = labelMap?.get(enfant.id) ?? getEnfantNodeLabel(index, enfant.deceased);

    if (!enfant.deceased) {
      return [{
        id: enfant.id,
        label: enfant.prenom ?? branchLabel,
        lien: 'enfant' as const,
        branchId: enfant.id,
        branchLabel,
      }];
    }

    return getPetitEnfantsRepresentants(enfant.id, familyMembers).map((member, petitIdx) => ({
      id: member.id,
      label: `Petit-enfant (repr. ${branchLabel})${petitIdx > 0 ? ` ${petitIdx + 1}` : ''}`,
      lien: 'petit_enfant' as const,
      branchId: enfant.id,
      branchLabel,
    }));
  });
}

export function buildSuccessionDescendantRecipientsForDeceased(
  enfants: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
): SuccessionDescendantRecipient[] {
  const labelMap = buildGlobalEnfantNodeLabelMap(enfants);
  return buildSuccessionDescendantRecipients(
    getRelevantSuccessionEnfants(enfants, deceased),
    getRelevantSuccessionFamilyMembers(enfants, familyMembers, deceased),
    labelMap,
  );
}

export function getEnfantRattachementOptions(
  situation: SituationMatrimoniale,
): Array<{ value: SuccessionEnfantRattachement; label: string }> {
  if (situation === 'marie') return [
    { value: 'commun', label: 'Enfant commun' },
    { value: 'epoux1', label: "Enfant de l'époux 1" },
    { value: 'epoux2', label: "Enfant de l'époux 2" },
  ];
  if (situation === 'pacse' || situation === 'concubinage') return [
    { value: 'commun', label: 'Enfant commun' },
    { value: 'epoux1', label: 'Enfant du partenaire 1' },
    { value: 'epoux2', label: 'Enfant du partenaire 2' },
  ];
  if (situation === 'divorce') return [
    { value: 'epoux1', label: 'Enfant du/de la défunt(e)' },
    { value: 'commun', label: 'Enfant commun (ex-couple)' },
    { value: 'epoux2', label: "Enfant de l'ex-conjoint(e)" },
  ];
  return [{ value: 'epoux1', label: 'Enfant du/de la défunt(e)' }];
}
