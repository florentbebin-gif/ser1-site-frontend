import type { DmtgSettings } from '../../engine/civil';
import { calculateSuccession, type LienParente } from '../../engine/succession';
import type { FamilyMember, SuccessionEnfant } from './successionDraft';
import {
  buildRepresentationAbattementOverrides,
  buildSuccessionDescendantRecipientsForDeceased,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';

export interface DetailedChainHeir {
  id: string;
  label: string;
  lien: LienParente;
  partSuccession: number;
  taxablePartSuccession?: number;
  abattementOverride?: number;
  exonerated?: boolean;
}

function buildFallbackBranchBeneficiaries(
  actifTransmis: number,
  nbBranches: number,
): DetailedChainHeir[] {
  if (nbBranches <= 0 || actifTransmis <= 0) return [];
  const part = actifTransmis / nbBranches;
  return Array.from({ length: nbBranches }, (_, index) => ({
    id: `desc-${index + 1}`,
    label: `Enfant ${index + 1}`,
    lien: 'enfant' as const,
    partSuccession: part,
  }));
}

export function buildDetailedDescendantHeirs(
  actifTransmis: number,
  deceased: SuccessionDeceasedSide,
  nbBranches: number,
  dmtgSettings: DmtgSettings,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
): DetailedChainHeir[] {
  if (nbBranches <= 0 || actifTransmis <= 0) return [];

  const recipients = buildSuccessionDescendantRecipientsForDeceased(enfantsContext, familyMembers, deceased);
  const abattementOverrides = buildRepresentationAbattementOverrides(recipients, dmtgSettings.ligneDirecte.abattement);
  const branchCount = Math.max(
    1,
    countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, deceased),
  );

  return recipients.length === 0
    ? buildFallbackBranchBeneficiaries(actifTransmis, nbBranches)
    : (() => {
      const partParBranche = actifTransmis / branchCount;
      const recipientsByBranch = recipients.reduce((map, recipient) => {
        const branchRecipients = map.get(recipient.branchId) ?? [];
        branchRecipients.push(recipient);
        map.set(recipient.branchId, branchRecipients);
        return map;
      }, new Map<string, typeof recipients>());

      return Array.from(recipientsByBranch.values()).flatMap((branchRecipients) => {
        const partParRecipient = partParBranche / branchRecipients.length;
        return branchRecipients.map((recipient) => ({
          id: recipient.id,
          label: recipient.label,
          lien: recipient.lien,
          partSuccession: partParRecipient,
          abattementOverride: abattementOverrides.get(recipient.id),
        }));
      });
    })();
}

export function mergeDetailedHeirs(heirs: DetailedChainHeir[]): DetailedChainHeir[] {
  const merged = new Map<string, DetailedChainHeir>();
  heirs.forEach((heir) => {
    if (heir.partSuccession <= 0) return;
    const current = merged.get(heir.id);
    if (current) {
      const currentTaxable = current.taxablePartSuccession ?? current.partSuccession;
      const nextTaxable = heir.taxablePartSuccession ?? heir.partSuccession;
      current.partSuccession += heir.partSuccession;
      current.taxablePartSuccession = currentTaxable + nextTaxable;
      current.abattementOverride ??= heir.abattementOverride;
      current.exonerated = current.exonerated || heir.exonerated;
      return;
    }
    merged.set(heir.id, { ...heir });
  });
  return Array.from(merged.values());
}

export function computeTransmissionForHeirs(
  actifTransmis: number,
  detailedHeirs: DetailedChainHeir[],
  dmtgSettings: DmtgSettings,
): { droits: number; beneficiaries: Array<{
  id: string;
  label: string;
  lien: LienParente;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}> } {
  if (actifTransmis <= 0 || detailedHeirs.length === 0) {
    return { droits: 0, beneficiaries: [] };
  }

  const taxableHeirs = detailedHeirs.map((heir) => ({
    lien: heir.lien,
    partSuccession: Math.max(0, heir.taxablePartSuccession ?? heir.partSuccession),
    abattementOverride: heir.abattementOverride,
  }));
  const result = calculateSuccession({
    actifNetSuccession: actifTransmis,
    heritiers: taxableHeirs,
    dmtgSettings,
  }).result;

  return {
    droits: result.totalDroits,
    beneficiaries: detailedHeirs.map((heir, index) => {
      const detail = result.detailHeritiers[index];
      const droits = detail?.droits ?? 0;
      return {
        id: heir.id,
        label: heir.label,
        lien: heir.lien,
        brut: heir.partSuccession,
        droits,
        net: heir.partSuccession - droits,
        exonerated: heir.exonerated ?? heir.lien === 'conjoint',
      };
    }),
  };
}
