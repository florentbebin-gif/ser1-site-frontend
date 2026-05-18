import type { DmtgSettings } from '../../engine/succession/civil';
import type { HeritiersInput, LienParente } from '../../engine/succession';
import type { FamilyMember, SuccessionCivilContext, SuccessionEnfant } from './successionDraft';
import type { SuccessionDevolutionAnalysis } from './successionDevolution';
import {
  buildRepresentationAbattementOverrides,
  buildSuccessionDescendantRecipientsForDeceased,
  countEffectiveDescendantBranchesForDeceased,
} from './successionEnfants';

export interface DetailedHeirInput {
  id: string;
  label: string;
  lien: LienParente;
  partSuccession: number;
  taxablePartSuccession?: number;
  abattementOverride?: number;
  baseHistoriqueTaxee?: number;
  droitsDejaAcquittes?: number;
  exonerated?: boolean;
}

export function asAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeLabel(value: string): string {
  return value
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function findLineAmount(
  devolution: SuccessionDevolutionAnalysis,
  ...labels: string[]
): number {
  const normalizedLabels = labels.map(normalizeLabel);
  const line = devolution.lines.find((candidate) =>
    normalizedLabels.includes(normalizeLabel(candidate.heritier)),
  );
  return asAmount(line?.montantEstime);
}

export function buildDetailedDescendantHeirs(
  amount: number,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
  dmtgSettings: DmtgSettings,
): { heirs: DetailedHeirInput[]; warnings: string[] } {
  if (amount <= 0) return { heirs: [], warnings: [] };

  const recipients = buildSuccessionDescendantRecipientsForDeceased(
    enfantsContext,
    familyMembers,
    deceased,
  );
  const abattementOverrides = buildRepresentationAbattementOverrides(
    recipients,
    dmtgSettings.ligneDirecte.abattement,
  );
  const branchCount = Math.max(
    1,
    countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, deceased),
  );

  if (recipients.length === 0) {
    const amountByBranch = amount / branchCount;
    return {
      heirs: Array.from({ length: branchCount }, (_, index) => ({
        id: `desc-${deceased}-${index + 1}`,
        label: `Enfant ${index + 1}`,
        lien: 'enfant' as const,
        partSuccession: amountByBranch,
      })),
      warnings: [
        "Repartition descendants: ventilation egale par branche faute d'identifiants detailles.",
      ],
    };
  }

  const recipientsByBranch = recipients.reduce((map, recipient) => {
    const branchRecipients = map.get(recipient.branchId) ?? [];
    branchRecipients.push(recipient);
    map.set(recipient.branchId, branchRecipients);
    return map;
  }, new Map<string, typeof recipients>());

  const amountByBranch = amount / Math.max(1, recipientsByBranch.size);
  return {
    heirs: Array.from(recipientsByBranch.values()).flatMap((branchRecipients) => {
      const amountByRecipient = amountByBranch / branchRecipients.length;
      return branchRecipients.map((recipient) => ({
        id: recipient.id,
        label: recipient.label,
        lien: recipient.lien,
        partSuccession: amountByRecipient,
        abattementOverride: abattementOverrides.get(recipient.id),
      }));
    }),
    warnings: [],
  };
}

function getSideRelatives(
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
  type: FamilyMember['type'],
): FamilyMember[] {
  return familyMembers.filter(
    (member) => member.type === type && (!member.branch || member.branch === deceased),
  );
}

function buildDetailedFamilyHeirs(
  amount: number,
  deceased: 'epoux1' | 'epoux2',
  lien: 'parent' | 'frere_soeur',
  members: FamilyMember[],
  fallbackCount: number,
  baseLabel: string,
): { heirs: DetailedHeirInput[]; warnings: string[] } {
  if (amount <= 0) return { heirs: [], warnings: [] };

  const count = Math.max(fallbackCount, members.length || 0);
  if (count <= 0) return { heirs: [], warnings: [] };

  const amountByHeir = amount / count;
  return {
    heirs: Array.from({ length: count }, (_, index) => ({
      id: members[index]?.id ?? `${lien}-${deceased}-${index + 1}`,
      label: `${baseLabel} ${index + 1}`,
      lien,
      partSuccession: amountByHeir,
    })),
    warnings:
      members.length > 0
        ? []
        : [
            `Repartition ${baseLabel.toLowerCase()}: ventilation egale faute d'identifiants detailles.`,
          ],
  };
}

export function buildParentAndSiblingHeirs(
  devolution: SuccessionDevolutionAnalysis,
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
): { heirs: DetailedHeirInput[]; warnings: string[] } {
  const heirs: DetailedHeirInput[] = [];
  const warnings: string[] = [];
  const parentMembers = getSideRelatives(familyMembers, deceased, 'parent');
  const siblingMembers = getSideRelatives(familyMembers, deceased, 'frere_soeur');

  const parentsAmount = findLineAmount(devolution, 'Pere et mere', 'Ascendants (pere et mere)');
  const oneParentAmount = findLineAmount(devolution, 'Ascendant survivant');
  const siblingsAmount = findLineAmount(devolution, 'Freres et soeurs');

  if (parentsAmount > 0) {
    const detailedParents = buildDetailedFamilyHeirs(
      parentsAmount,
      deceased,
      'parent',
      parentMembers,
      2,
      'Parent',
    );
    heirs.push(...detailedParents.heirs);
    warnings.push(...detailedParents.warnings);
  } else if (oneParentAmount > 0) {
    const detailedParent = buildDetailedFamilyHeirs(
      oneParentAmount,
      deceased,
      'parent',
      parentMembers,
      1,
      'Parent',
    );
    heirs.push(...detailedParent.heirs);
    warnings.push(...detailedParent.warnings);
  }

  if (siblingsAmount > 0) {
    const detailedSiblings = buildDetailedFamilyHeirs(
      siblingsAmount,
      deceased,
      'frere_soeur',
      siblingMembers,
      1,
      'Frere / soeur',
    );
    heirs.push(...detailedSiblings.heirs);
    warnings.push(...detailedSiblings.warnings);
  }

  return { heirs, warnings };
}

export function buildLegalPartnerHeirs(
  civil: SuccessionCivilContext,
  devolution: SuccessionDevolutionAnalysis,
): DetailedHeirInput[] {
  if (civil.situationMatrimoniale !== 'marie') return [];
  const amount = findLineAmount(devolution, 'Conjoint survivant');
  return amount > 0
    ? [
        {
          id: 'conjoint',
          label: 'Conjoint survivant',
          lien: 'conjoint',
          partSuccession: amount,
          exonerated: true,
        },
      ]
    : [];
}

export function buildTestamentHeirs(devolution: SuccessionDevolutionAnalysis): DetailedHeirInput[] {
  return (devolution.testamentDistribution?.beneficiaries ?? []).map((beneficiary) => ({
    id: beneficiary.id,
    label: beneficiary.label,
    lien: beneficiary.lien,
    partSuccession: beneficiary.partSuccession,
    exonerated: beneficiary.exonerated,
  }));
}

export function scaleDetailedHeirs(
  heirs: DetailedHeirInput[],
  targetTotal: number,
): DetailedHeirInput[] {
  const normalizedTarget = Math.max(0, targetTotal);
  if (normalizedTarget <= 0 || heirs.length === 0) return [];

  const currentTotal = heirs.reduce((sum, heir) => sum + heir.partSuccession, 0);
  if (currentTotal <= 0) return [];
  if (Math.abs(currentTotal - normalizedTarget) < 0.01) return heirs;

  const ratio = normalizedTarget / currentTotal;
  return heirs.map((heir) => ({
    ...heir,
    partSuccession: heir.partSuccession * ratio,
  }));
}

export function mergeDetailedHeirs(heirs: DetailedHeirInput[]): DetailedHeirInput[] {
  const merged = new Map<string, DetailedHeirInput>();
  heirs.forEach((heir) => {
    const existing = merged.get(heir.id);
    if (existing) {
      const existingTaxable = existing.taxablePartSuccession ?? existing.partSuccession;
      const nextTaxable = heir.taxablePartSuccession ?? heir.partSuccession;
      existing.partSuccession += heir.partSuccession;
      existing.taxablePartSuccession = existingTaxable + nextTaxable;
      existing.abattementOverride ??= heir.abattementOverride;
      existing.exonerated = existing.exonerated || heir.exonerated;
      return;
    }
    merged.set(heir.id, { ...heir });
  });
  return Array.from(merged.values()).filter((heir) => heir.partSuccession > 0.01);
}

export function toHeritiersInput(heirs: DetailedHeirInput[]): HeritiersInput[] {
  return heirs.map((heir) => ({
    lien: heir.lien,
    partSuccession: heir.partSuccession,
    abattementOverride: heir.abattementOverride,
    baseHistoriqueTaxee: heir.baseHistoriqueTaxee,
    droitsDejaAcquittes: heir.droitsDejaAcquittes,
  }));
}

export function toTaxableHeritiersInput(heirs: DetailedHeirInput[]): HeritiersInput[] {
  return heirs.map((heir) => ({
    lien: heir.lien,
    partSuccession: Math.max(0, heir.taxablePartSuccession ?? heir.partSuccession),
    abattementOverride: heir.abattementOverride,
    baseHistoriqueTaxee: heir.baseHistoriqueTaxee,
    droitsDejaAcquittes: heir.droitsDejaAcquittes,
  }));
}
