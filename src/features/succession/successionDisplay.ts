import {
  calculateSuccession,
  type HeritiersInput,
  type LienParente,
  type SuccessionResult,
} from '../../engine/succession';
import type { DmtgSettings } from '../../engine/civil';
import type {
  FamilyMember,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
} from './successionDraft';
import type { SuccessionDevolutionAnalysis } from './successionDevolution';
import type { SuccessionChainBeneficiary, SuccessionChainageAnalysis } from './successionChainage';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  buildRepresentationAbattementOverrides,
  buildSuccessionDescendantRecipientsForDeceased,
  countEffectiveDescendantBranchesForDeceased,
} from './successionEnfants';
import { applySuccessionDonationRecallToHeirs } from './successionDonationRecall';
import {
  applyResidencePrincipaleAbatementToEstateBasis,
  assignBeneficiaryTaxableBasis,
  buildSuccessionEstateTaxableBasis,
  createEmptyPocketScales,
  type SuccessionAssetTransmissionBasis,
} from './successionTransmissionBasis';
import { getSuccessionSharedPocketForContext } from './successionPatrimonialModel';

export interface SuccessionTransmissionRow {
  id: string;
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
  step1Brut?: number;
  step1Droits?: number;
  step2Brut?: number;
  step2Droits?: number;
}

export interface SuccessionDirectDisplayAnalysis {
  actifNetSuccession: number;
  simulatedDeceased: 'epoux1' | 'epoux2';
  heirs: HeritiersInput[];
  result: SuccessionResult | null;
  transmissionRows: SuccessionTransmissionRow[];
  warnings: string[];
}

interface BuildSuccessionDirectDisplayInput {
  civil: SuccessionCivilContext;
  devolution: SuccessionDevolutionAnalysis;
  devolutionContext: SuccessionDevolutionContext;
  dmtgSettings: DmtgSettings;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  order?: 'epoux1' | 'epoux2';
  actifNetSuccession?: number;
  baseWarnings?: string[];
  transmissionBasis?: SuccessionAssetTransmissionBasis;
  forfaitMobilierMode?: SuccessionPatrimonialContext['forfaitMobilierMode'];
  forfaitMobilierPct?: number;
  forfaitMobilierMontant?: number;
  abattementResidencePrincipale?: boolean;
  donationsContext?: SuccessionDonationEntry[];
  donationSettings?: SuccessionFiscalSnapshot['donation'];
  referenceDate?: Date;
}

export interface SuccessionDirectEstateBasis {
  actifNetSuccession: number;
  simulatedDeceased: 'epoux1' | 'epoux2';
  warnings: string[];
}

interface DetailedHeirInput {
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

function asAmount(value: number | null | undefined): number {
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

function findLineAmount(
  devolution: SuccessionDevolutionAnalysis,
  ...labels: string[]
): number {
  const normalizedLabels = labels.map(normalizeLabel);
  const line = devolution.lines.find((candidate) => normalizedLabels.includes(normalizeLabel(candidate.heritier)));
  return asAmount(line?.montantEstime);
}

function getRelevantDeceased(
  civil: SuccessionCivilContext,
  order: 'epoux1' | 'epoux2' | undefined,
): 'epoux1' | 'epoux2' {
  if (
    civil.situationMatrimoniale === 'marie'
    || civil.situationMatrimoniale === 'pacse'
    || civil.situationMatrimoniale === 'concubinage'
  ) {
    return order === 'epoux2' ? 'epoux2' : 'epoux1';
  }
  return 'epoux1';
}

export function computeSuccessionDirectEstateBasis(
  civil: SuccessionCivilContext,
  liquidation: SuccessionLiquidationContext,
  order?: 'epoux1' | 'epoux2',
): SuccessionDirectEstateBasis {
  const simulatedDeceased = getRelevantDeceased(civil, order);
  const ownAmount = simulatedDeceased === 'epoux1'
    ? asAmount(liquidation.actifEpoux1)
    : asAmount(liquidation.actifEpoux2);
  const sharedAmount = asAmount(liquidation.actifCommun);

  if (civil.situationMatrimoniale === 'concubinage') {
    return {
      actifNetSuccession: ownAmount + (sharedAmount * 0.5),
      simulatedDeceased,
      warnings: sharedAmount > 0
        ? ['Union libre: la quote-part indivise du defunt est estimee a 50 % de la masse en indivision.']
        : [],
    };
  }

  if (civil.situationMatrimoniale === 'pacse' && civil.pacsConvention === 'indivision') {
    return {
      actifNetSuccession: ownAmount + (sharedAmount * 0.5),
      simulatedDeceased,
      warnings: sharedAmount > 0
        ? ['PACS indivision: la quote-part indivise du defunt est estimee a 50 % dans la succession directe.']
        : [],
    };
  }

  if (civil.situationMatrimoniale === 'pacse') {
    return {
      actifNetSuccession: ownAmount,
      simulatedDeceased,
      warnings: [],
    };
  }

  return {
    actifNetSuccession: ownAmount,
    simulatedDeceased,
    warnings: [],
  };
}

function buildDetailedDescendantHeirs(
  amount: number,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: 'epoux1' | 'epoux2',
  dmtgSettings: DmtgSettings,
): { heirs: DetailedHeirInput[]; warnings: string[] } {
  if (amount <= 0) return { heirs: [], warnings: [] };

  const recipients = buildSuccessionDescendantRecipientsForDeceased(enfantsContext, familyMembers, deceased);
  const abattementOverrides = buildRepresentationAbattementOverrides(recipients, dmtgSettings.ligneDirecte.abattement);
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
      warnings: ['Repartition descendants: ventilation egale par branche faute d\'identifiants detailles.'],
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
    warnings: members.length > 0
      ? []
      : [`Repartition ${baseLabel.toLowerCase()}: ventilation egale faute d'identifiants detailles.`],
  };
}

function buildParentAndSiblingHeirs(
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
    const detailedParents = buildDetailedFamilyHeirs(parentsAmount, deceased, 'parent', parentMembers, 2, 'Parent');
    heirs.push(...detailedParents.heirs);
    warnings.push(...detailedParents.warnings);
  } else if (oneParentAmount > 0) {
    const detailedParent = buildDetailedFamilyHeirs(oneParentAmount, deceased, 'parent', parentMembers, 1, 'Parent');
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

function buildLegalPartnerHeirs(
  civil: SuccessionCivilContext,
  devolution: SuccessionDevolutionAnalysis,
): DetailedHeirInput[] {
  if (civil.situationMatrimoniale !== 'marie') return [];
  const amount = findLineAmount(devolution, 'Conjoint survivant');
  return amount > 0 ? [{
    id: 'conjoint',
    label: 'Conjoint survivant',
    lien: 'conjoint',
    partSuccession: amount,
    exonerated: true,
  }] : [];
}

function buildTestamentHeirs(
  devolution: SuccessionDevolutionAnalysis,
): DetailedHeirInput[] {
  return (devolution.testamentDistribution?.beneficiaries ?? []).map((beneficiary) => ({
    id: beneficiary.id,
    label: beneficiary.label,
    lien: beneficiary.lien,
    partSuccession: beneficiary.partSuccession,
    exonerated: beneficiary.exonerated,
  }));
}

function scaleDetailedHeirs(
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

function mergeDetailedHeirs(heirs: DetailedHeirInput[]): DetailedHeirInput[] {
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

function toHeritiersInput(heirs: DetailedHeirInput[]): HeritiersInput[] {
  return heirs.map((heir) => ({
    lien: heir.lien,
    partSuccession: heir.partSuccession,
    abattementOverride: heir.abattementOverride,
    baseHistoriqueTaxee: heir.baseHistoriqueTaxee,
    droitsDejaAcquittes: heir.droitsDejaAcquittes,
  }));
}

function toTaxableHeritiersInput(heirs: DetailedHeirInput[]): HeritiersInput[] {
  return heirs.map((heir) => ({
    lien: heir.lien,
    partSuccession: Math.max(0, heir.taxablePartSuccession ?? heir.partSuccession),
    abattementOverride: heir.abattementOverride,
    baseHistoriqueTaxee: heir.baseHistoriqueTaxee,
    droitsDejaAcquittes: heir.droitsDejaAcquittes,
  }));
}

function buildDirectEstatePocketScales(
  civil: SuccessionCivilContext,
  simulatedDeceased: 'epoux1' | 'epoux2',
): ReturnType<typeof createEmptyPocketScales> {
  const scales = createEmptyPocketScales();
  scales[simulatedDeceased] = 1;
  const sharedPocket = getSuccessionSharedPocketForContext({
    situationMatrimoniale: civil.situationMatrimoniale,
    regimeMatrimonial: civil.regimeMatrimonial,
    pacsConvention: civil.pacsConvention,
  });

  if (
    sharedPocket
    && (
      civil.situationMatrimoniale === 'concubinage'
      || (civil.situationMatrimoniale === 'pacse' && civil.pacsConvention === 'indivision')
    )
  ) {
    scales[sharedPocket] = 0.5;
  }

  return scales;
}

function buildTransmissionRows(
  detailedHeirs: DetailedHeirInput[],
  result: SuccessionResult | null,
): SuccessionTransmissionRow[] {
  if (!result) return [];

  return detailedHeirs.map((heir, index) => {
    const detail = result.detailHeritiers[index];
    const brut = heir.partSuccession;
    const droits = detail?.droits ?? 0;
    return {
      id: heir.id,
      label: heir.label,
      brut,
      droits,
      net: brut - droits,
      exonerated: heir.exonerated ?? heir.lien === 'conjoint',
    };
  });
}

function accumulateTransmissionRow(
  rows: Map<string, SuccessionTransmissionRow>,
  beneficiary: SuccessionChainBeneficiary,
  step: 1 | 2,
): void {
  const current = rows.get(beneficiary.id) ?? {
      id: beneficiary.id,
      label: beneficiary.label,
      brut: 0,
      droits: 0,
      net: 0,
      exonerated: beneficiary.exonerated ?? false,
    };

  current.brut += beneficiary.brut;
  current.droits += beneficiary.droits;
  current.net += beneficiary.net;
  current.exonerated = current.exonerated || beneficiary.exonerated;
  if (step === 1) {
    current.step1Brut = (current.step1Brut ?? 0) + beneficiary.brut;
    current.step1Droits = (current.step1Droits ?? 0) + beneficiary.droits;
  } else {
    current.step2Brut = (current.step2Brut ?? 0) + beneficiary.brut;
    current.step2Droits = (current.step2Droits ?? 0) + beneficiary.droits;
  }
  rows.set(beneficiary.id, current);
}

export function buildSuccessionChainTransmissionRows(
  analysis: SuccessionChainageAnalysis,
): SuccessionTransmissionRow[] {
  if (!analysis.step1 || !analysis.step2) return [];

  const rows = new Map<string, SuccessionTransmissionRow>();
  analysis.step1.beneficiaries.forEach((beneficiary) => accumulateTransmissionRow(rows, beneficiary, 1));
  analysis.step2.beneficiaries.forEach((beneficiary) => accumulateTransmissionRow(rows, beneficiary, 2));
  return Array.from(rows.values()).sort((left, right) => {
    const exoRank = Number(Boolean(left.exonerated)) - Number(Boolean(right.exonerated));
    if (exoRank !== 0) return exoRank;
    return left.label.localeCompare(right.label, 'fr-FR');
  });
}

export function buildSuccessionDirectDisplayAnalysis(
  input: BuildSuccessionDirectDisplayInput,
): SuccessionDirectDisplayAnalysis {
  const simulatedDeceased = getRelevantDeceased(input.civil, input.order);
  const warnings = [...(input.baseWarnings ?? []), ...input.devolution.warnings];
  const estateAmount = Math.max(0, input.actifNetSuccession ?? input.devolution.masseReference);

  const protectedHeirs = buildLegalPartnerHeirs(input.civil, input.devolution);
  const protectedTotal = protectedHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0);

  const descendantsAmount = findLineAmount(input.devolution, 'Descendants');
  const descendantHeirs = buildDetailedDescendantHeirs(
    descendantsAmount,
    input.enfantsContext,
    input.familyMembers,
    simulatedDeceased,
    input.dmtgSettings,
  );
  warnings.push(...descendantHeirs.warnings);

  const parentAndSiblingHeirs = buildParentAndSiblingHeirs(
    input.devolution,
    input.familyMembers,
    simulatedDeceased,
  );
  warnings.push(...parentAndSiblingHeirs.warnings);

  const redistributableLegalHeirs = [
    ...descendantHeirs.heirs,
    ...parentAndSiblingHeirs.heirs,
  ];
  const redistributableTotal = redistributableLegalHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0);

  const testamentHeirs = buildTestamentHeirs(input.devolution);
  const testamentTotal = testamentHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0);

  // BUG 11 fix: for legs_universel / legs_titre_universel targeting the conjoint,
  // apply max(legal, testament) instead of cumulating both.
  const isUniversalDisposition = input.devolution.testamentDistribution?.dispositionType === 'legs_universel'
    || input.devolution.testamentDistribution?.dispositionType === 'legs_titre_universel';
  const testamentConjointAmount = isUniversalDisposition
    ? testamentHeirs.filter((h) => h.lien === 'conjoint').reduce((sum, h) => sum + h.partSuccession, 0)
    : 0;
  let effectiveProtectedHeirs = protectedHeirs;
  let effectiveTestamentHeirs = testamentHeirs;
  let effectiveProtectedTotal = protectedTotal;
  let effectiveTestamentTotal = testamentTotal;
  if (isUniversalDisposition && testamentConjointAmount > 0 && protectedTotal > 0) {
    const effectiveConjointPart = Math.max(protectedTotal, testamentConjointAmount);
    effectiveProtectedHeirs = protectedHeirs.map((h) =>
      h.lien === 'conjoint' ? { ...h, partSuccession: effectiveConjointPart } : h,
    );
    effectiveTestamentHeirs = testamentHeirs.filter((h) => h.lien !== 'conjoint');
    effectiveProtectedTotal = effectiveProtectedHeirs.reduce((sum, h) => sum + h.partSuccession, 0);
    effectiveTestamentTotal = effectiveTestamentHeirs.reduce((sum, h) => sum + h.partSuccession, 0);
  }

  const remainingRedistributable = Math.max(
    0,
    Math.min(redistributableTotal, estateAmount - effectiveProtectedTotal - effectiveTestamentTotal),
  );
  const scaledRedistributableHeirs = effectiveTestamentHeirs.length > 0 || (isUniversalDisposition && testamentConjointAmount > 0)
    ? scaleDetailedHeirs(redistributableLegalHeirs, remainingRedistributable)
    : redistributableLegalHeirs;

  const detailedHeirs = mergeDetailedHeirs([
    ...effectiveProtectedHeirs,
    ...effectiveTestamentHeirs,
    ...scaledRedistributableHeirs,
  ]);
  const detailedHeirsWithTaxableBasis = input.transmissionBasis
    ? assignBeneficiaryTaxableBasis(
      detailedHeirs,
      applyResidencePrincipaleAbatementToEstateBasis(
        buildSuccessionEstateTaxableBasis(
          input.transmissionBasis,
          buildDirectEstatePocketScales(input.civil, simulatedDeceased),
        ),
        Boolean(input.abattementResidencePrincipale),
      ),
      {
        forfaitMobilierMode: input.forfaitMobilierMode ?? 'off',
        forfaitMobilierPct: input.forfaitMobilierPct ?? 0,
        forfaitMobilierMontant: input.forfaitMobilierMontant ?? 0,
      },
    )
    : detailedHeirs;
  const detailedHeirsWithDonationRecall = applySuccessionDonationRecallToHeirs({
    heirs: detailedHeirsWithTaxableBasis,
    donations: input.donationsContext,
    simulatedDeceased,
    donationSettings: input.donationSettings,
    dmtgSettings: input.dmtgSettings,
    referenceDate: input.referenceDate,
  });

  const heirs = toHeritiersInput(detailedHeirsWithDonationRecall);
  const actifNetSuccession = heirs.reduce((sum, heir) => sum + heir.partSuccession, 0) || estateAmount;
  const taxableHeirs = toTaxableHeritiersInput(detailedHeirsWithDonationRecall);
  const rawResult = taxableHeirs.length > 0
    ? calculateSuccession({
      actifNetSuccession,
      heritiers: taxableHeirs,
      dmtgSettings: input.dmtgSettings,
    }).result
    : null;
  const result = rawResult ? {
    ...rawResult,
    actifNetSuccession,
    detailHeritiers: rawResult.detailHeritiers.map((detail, index) => {
      const brut = detailedHeirsWithTaxableBasis[index]?.partSuccession ?? detail.partBrute;
      return {
        ...detail,
        partBrute: brut,
        tauxMoyen: brut > 0 ? Math.round(((detail.droits / brut) * 100) * 100) / 100 : 0,
      };
    }),
    tauxMoyenGlobal: actifNetSuccession > 0
      ? Math.round(((rawResult.totalDroits / actifNetSuccession) * 100) * 100) / 100
      : 0,
  } : null;

  return {
    actifNetSuccession,
    simulatedDeceased,
    heirs,
    result,
    transmissionRows: buildTransmissionRows(detailedHeirsWithDonationRecall, result),
    warnings,
  };
}
