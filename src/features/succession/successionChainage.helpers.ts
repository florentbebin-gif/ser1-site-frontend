import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionTestamentConfig,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';
import {
  cloneSuccessionTestamentConfig,
  computeTestamentDistribution,
} from './successionTestament';
import {
  buildDetailedDescendantHeirs,
  buildDetailedSiblingHeirs,
  computeTransmissionForHeirs,
  mergeDetailedHeirs,
  type DetailedChainHeir,
} from './successionChainage.heirs';
import {
  applySuccessionDonationRecallToHeirs,
  buildDonationRecallWarningMessages,
} from './successionDonationRecall';
import {
  assignBeneficiaryTaxableBasis,
  createEmptyPocketScales,
  type SuccessionEstatePocketScales,
  type SuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';
import { getSuccessionSharedPocketForContext } from './successionPatrimonialModel';
import type { SuccessionResolvedPreciputSelection } from './successionPreciput';
import type {
  SuccessionChainOrder,
  SuccessionChainPreciputSelectionSummary,
  SuccessionChainRegime,
  SuccessionChainageAnalysis,
  SuccessionChainageInput,
  SuccessionChainStepComputation,
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

export function buildFirstEstatePocketScales(
  civil: SuccessionCivilContext,
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  attributionBiensCommunsPct: number,
  societeAcquetsScale = 0,
  preserveQualifiedSeparatePocketsInUniversalCommunity = false,
): SuccessionEstatePocketScales {
  const scales = createEmptyPocketScales();
  const sharedPocket = getSuccessionSharedPocketForContext({
    situationMatrimoniale: civil.situationMatrimoniale,
    regimeMatrimonial: civil.regimeMatrimonial,
    pacsConvention: civil.pacsConvention,
  });

  if (regimeUsed === 'communaute_universelle') {
    if (preserveQualifiedSeparatePocketsInUniversalCommunity) {
      scales[order] = 1;
    } else {
      scales.epoux1 = 1;
      scales.epoux2 = 1;
    }
    if (sharedPocket) scales[sharedPocket] = 1;
    return scales;
  }

  if (regimeUsed === 'separation_biens') {
    scales[order] = 1;
    if (sharedPocket === 'societe_acquets' && societeAcquetsScale > 0) {
      scales.societe_acquets = Math.min(1, Math.max(0, societeAcquetsScale));
    }
    return scales;
  }

  const pctDefunt = (100 - Math.min(100, Math.max(0, attributionBiensCommunsPct))) / 100;
  scales[order] = 1;
  if (sharedPocket) scales[sharedPocket] = pctDefunt;
  return scales;
}

export function buildSurvivorPocketScales(
  civil: SuccessionCivilContext,
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  attributionBiensCommunsPct: number,
  societeAcquetsScale = 0,
  preserveQualifiedSeparatePocketsInUniversalCommunity = false,
): SuccessionEstatePocketScales {
  const scales = createEmptyPocketScales();
  const survivor = getOtherSide(order);
  const sharedPocket = getSuccessionSharedPocketForContext({
    situationMatrimoniale: civil.situationMatrimoniale,
    regimeMatrimonial: civil.regimeMatrimonial,
    pacsConvention: civil.pacsConvention,
  });

  if (regimeUsed === 'communaute_universelle') {
    if (preserveQualifiedSeparatePocketsInUniversalCommunity) {
      scales[survivor] = 1;
    }
    return scales;
  }

  if (regimeUsed === 'separation_biens') {
    scales[survivor] = 1;
    if (sharedPocket === 'societe_acquets' && societeAcquetsScale > 0) {
      scales.societe_acquets = Math.min(1, Math.max(0, 1 - societeAcquetsScale));
    }
    return scales;
  }

  const pctSurvivant = Math.min(100, Math.max(0, attributionBiensCommunsPct)) / 100;
  scales[survivor] = 1;
  if (sharedPocket) scales[sharedPocket] = pctSurvivant;
  return scales;
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
  return [`${stepLabel}: aucun descendant du defunt de cette etape n'est eligible dans la branche retenue.`];
}

export function buildEmptyAnalysis(
  order: SuccessionChainOrder,
  warning: string,
): SuccessionChainageAnalysis {
  return {
    applicable: false,
    order,
    firstDecedeLabel: order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: null,
    step2: null,
    societeAcquets: null,
    participationAcquets: null,
    preciput: null,
    interMassClaims: null,
    affectedLiabilities: null,
    totalDroits: 0,
    warnings: [warning],
  };
}

export function createEmptyEstateTaxableBasis(): SuccessionEstateTaxableBasis {
  return {
    ordinaryNetBeforeForfait: 0,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  };
}

function getInactiveTestamentConfig(): SuccessionTestamentConfig {
  return cloneSuccessionTestamentConfig(DEFAULT_SUCCESSION_TESTAMENT_CONFIG);
}

function prefixStepWarnings(stepLabel: string, stepWarnings: string[]): string[] {
  return stepWarnings.map((warning) => `${stepLabel}: ${warning}`);
}

function getStepTestamentConfig(
  input: SuccessionChainageInput,
  deceased: SuccessionDeceasedSide,
  deadCounterpart: SuccessionDeceasedSide | null,
): { testament: SuccessionTestamentConfig; warnings: string[] } {
  const testamentBase = input.devolution?.testamentsBySide[deceased] ?? getInactiveTestamentConfig();
  const testament = cloneSuccessionTestamentConfig(testamentBase);
  const warnings: string[] = [];

  if (!deadCounterpart) {
    return { testament, warnings };
  }

  const blockedPrincipalRef = `principal:${deadCounterpart}` as const;
  if (testament.dispositionType === 'legs_particulier') {
    const initialLength = testament.particularLegacies.length;
    testament.particularLegacies = testament.particularLegacies.filter(
      (entry) => entry.beneficiaryRef !== blockedPrincipalRef,
    );
    if (testament.particularLegacies.length < initialLength) {
      warnings.push('Legs particulier en faveur du conjoint ou partenaire deja decede ignore au second deces.');
    }
    return { testament, warnings };
  }

  if (testament.beneficiaryRef === blockedPrincipalRef) {
    testament.beneficiaryRef = null;
    warnings.push('Beneficiaire testamentaire conjoint ou partenaire deja decede ignore au second deces.');
  }

  return { testament, warnings };
}

function buildLegalPartnerHeirs(
  civil: SuccessionCivilContext,
  amount: number,
): DetailedChainHeir[] {
  if (civil.situationMatrimoniale !== 'marie' || amount <= 0) return [];
  return [{
    id: 'conjoint',
    label: 'Conjoint survivant',
    lien: 'conjoint',
    partSuccession: amount,
    exonerated: true,
  }];
}

function buildParentHeirs(
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
  amount: number,
): DetailedChainHeir[] {
  if (amount <= 0) return [];
  const parents = familyMembers.filter(
    (member) => member.type === 'parent' && (!member.branch || member.branch === deceased),
  );
  const count = Math.max(1, parents.length);
  const amountEach = amount / count;
  return Array.from({ length: count }, (_, index) => ({
    id: parents[index]?.id ?? `parent-${deceased}-${index + 1}`,
    label: `Parent ${index + 1}`,
    lien: 'parent' as const,
    partSuccession: amountEach,
    exonerated: false,
  }));
}

export function computeStepTransmission(
  input: SuccessionChainageInput,
  estateAmount: number,
  estateTaxableBasis: SuccessionEstateTaxableBasis,
  deceased: SuccessionDeceasedSide,
  legalPartnerAmount: number,
  redistributableAmount: number,
  deadCounterpart: SuccessionDeceasedSide | null,
  stepLabel: string,
  parentsAmount = 0,
): SuccessionChainStepComputation {
  const legalPartnerHeirs = buildLegalPartnerHeirs(input.civil, legalPartnerAmount);
  const parentHeirs = buildParentHeirs(input.familyMembers ?? [], deceased, parentsAmount);
  const { testament, warnings: configWarnings } = getStepTestamentConfig(
    input,
    deceased,
    deadCounterpart,
  );
  const testamentDistribution = computeTestamentDistribution({
    situation: input.civil.situationMatrimoniale,
    side: deceased,
    testament,
    masseReference: estateAmount,
    enfants: input.enfantsContext ?? [],
    familyMembers: input.familyMembers ?? [],
    maxAvailableAmount: redistributableAmount,
  });
  const testamentHeirs: DetailedChainHeir[] = (testamentDistribution?.beneficiaries ?? []).map(
    (beneficiary) => ({
      id: beneficiary.id,
      label: beneficiary.label,
      lien: beneficiary.lien,
      partSuccession: beneficiary.partSuccession,
      exonerated: beneficiary.exonerated,
    }),
  );

  const isUniversalDisposition = testamentDistribution?.dispositionType === 'legs_universel'
    || testamentDistribution?.dispositionType === 'legs_titre_universel';
  const testamentConjointAmount = isUniversalDisposition
    ? testamentHeirs.filter((heir) => heir.id === 'conjoint').reduce((sum, heir) => sum + heir.partSuccession, 0)
    : 0;
  const descendantBranchCount = countEffectiveDescendantBranchesForDeceased(
    input.enfantsContext ?? [],
    input.familyMembers ?? [],
    deceased,
  );
  let effectiveRedistributableAmount = redistributableAmount;
  if (isUniversalDisposition && testamentConjointAmount > 0 && legalPartnerAmount > 0) {
    const effectiveConjointPart = Math.max(legalPartnerAmount, testamentConjointAmount);
    const legalPartnerHeirsAdjusted = legalPartnerHeirs.map((heir) =>
      heir.id === 'conjoint' ? { ...heir, partSuccession: effectiveConjointPart } : heir,
    );
    const filteredTestamentHeirs = testamentHeirs.filter((heir) => heir.id !== 'conjoint');
    const testamentDistributedNonConjoint = filteredTestamentHeirs.reduce(
      (sum, heir) => sum + heir.partSuccession,
      0,
    );
    effectiveRedistributableAmount = Math.max(
      0,
      estateAmount - effectiveConjointPart - testamentDistributedNonConjoint,
    );
    const descendantsResidualAmountAdj = Math.max(0, effectiveRedistributableAmount);
    const detailedDescendantHeirsAdj = buildDetailedDescendantHeirs(
      descendantsResidualAmountAdj,
      deceased,
      descendantBranchCount,
      input.dmtgSettings,
      input.enfantsContext ?? [],
      input.familyMembers ?? [],
    );
    const detailedSiblingHeirsAdj = descendantBranchCount === 0
      ? buildDetailedSiblingHeirs(descendantsResidualAmountAdj, deceased, input.familyMembers ?? [])
      : [];
    const detailedHeirs = mergeDetailedHeirs([
      ...legalPartnerHeirsAdjusted,
      ...parentHeirs,
      ...filteredTestamentHeirs,
      ...detailedDescendantHeirsAdj,
      ...detailedSiblingHeirsAdj,
    ]);
    const detailedHeirsWithTaxableBasis = input.transmissionBasis
      ? assignBeneficiaryTaxableBasis(detailedHeirs, estateTaxableBasis, {
        forfaitMobilierMode: input.forfaitMobilierMode ?? 'off',
        forfaitMobilierPct: input.forfaitMobilierPct ?? 0,
        forfaitMobilierMontant: input.forfaitMobilierMontant ?? 0,
      })
      : detailedHeirs;
    const donateurDateNaissanceEarly = deceased === 'epoux1'
      ? input.civil.dateNaissanceEpoux1
      : input.civil.dateNaissanceEpoux2;
    const donationRecallResultEarly = applySuccessionDonationRecallToHeirs({
      heirs: detailedHeirsWithTaxableBasis,
      donations: input.donations,
      simulatedDeceased: deceased,
      donationSettings: input.donationSettings,
      dmtgSettings: input.dmtgSettings,
      referenceDate: input.referenceDate,
      donateurDateNaissance: donateurDateNaissanceEarly,
    });
    const donationRecallWarningsEarly = buildDonationRecallWarningMessages(donationRecallResultEarly.warnings);
    const { droits, beneficiaries } = computeTransmissionForHeirs(
      estateAmount,
      donationRecallResultEarly.heirs,
      input.dmtgSettings,
    );
    const partAutresBeneficiaires = beneficiaries
      .filter((beneficiary) => beneficiary.lien !== 'conjoint')
      .reduce((sum, beneficiary) => sum + beneficiary.brut, 0);
    const survivingCounterpartRef = `principal:${getOtherSide(deceased)}` as const;
    const testamentCarryOver = (testamentDistribution?.beneficiaries ?? [])
      .filter((beneficiary) => beneficiary.beneficiaryRef === survivingCounterpartRef)
      .reduce((sum, beneficiary) => sum + beneficiary.partSuccession, 0);
    const effectiveCarryOver = isUniversalDisposition
      ? Math.max(legalPartnerAmount, testamentCarryOver)
      : testamentCarryOver;
    return {
      transmission: { droits, beneficiaries },
      partConjoint: effectiveConjointPart,
      partAutresBeneficiaires,
      carryOverToStep2: effectiveCarryOver,
      warnings: [
        ...prefixStepWarnings(stepLabel, configWarnings),
        ...prefixStepWarnings(stepLabel, testamentDistribution?.warnings ?? []),
        ...prefixStepWarnings(stepLabel, donationRecallWarningsEarly),
      ],
    };
  }

  const descendantsResidualAmount = Math.max(
    0,
    redistributableAmount - (testamentDistribution?.distributedAmount ?? 0),
  );
  const detailedDescendantHeirs = buildDetailedDescendantHeirs(
    descendantsResidualAmount,
    deceased,
    descendantBranchCount,
    input.dmtgSettings,
    input.enfantsContext ?? [],
    input.familyMembers ?? [],
  );
  const detailedSiblingHeirs = descendantBranchCount === 0
    ? buildDetailedSiblingHeirs(descendantsResidualAmount, deceased, input.familyMembers ?? [])
    : [];
  const detailedHeirs = mergeDetailedHeirs([
    ...legalPartnerHeirs,
    ...parentHeirs,
    ...testamentHeirs,
    ...detailedDescendantHeirs,
    ...detailedSiblingHeirs,
  ]);
  const detailedHeirsWithTaxableBasis = input.transmissionBasis
    ? assignBeneficiaryTaxableBasis(detailedHeirs, estateTaxableBasis, {
      forfaitMobilierMode: input.forfaitMobilierMode ?? 'off',
      forfaitMobilierPct: input.forfaitMobilierPct ?? 0,
      forfaitMobilierMontant: input.forfaitMobilierMontant ?? 0,
    })
    : detailedHeirs;
  const donateurDateNaissance = deceased === 'epoux1'
    ? input.civil.dateNaissanceEpoux1
    : input.civil.dateNaissanceEpoux2;
  const donationRecallResult = applySuccessionDonationRecallToHeirs({
    heirs: detailedHeirsWithTaxableBasis,
    donations: input.donations,
    simulatedDeceased: deceased,
    donationSettings: input.donationSettings,
    dmtgSettings: input.dmtgSettings,
    referenceDate: input.referenceDate,
    donateurDateNaissance,
  });
  const donationRecallWarnings = buildDonationRecallWarningMessages(donationRecallResult.warnings);
  const transmission = computeTransmissionForHeirs(
    estateAmount,
    donationRecallResult.heirs,
    input.dmtgSettings,
  );
  const partConjoint = transmission.beneficiaries
    .filter((beneficiary) => beneficiary.lien === 'conjoint')
    .reduce((sum, beneficiary) => sum + beneficiary.brut, 0);
  const partAutresBeneficiaires = transmission.beneficiaries
    .filter((beneficiary) => beneficiary.lien !== 'conjoint')
    .reduce((sum, beneficiary) => sum + beneficiary.brut, 0);
  const survivingCounterpartRef = `principal:${getOtherSide(deceased)}` as const;
  const testamentCarryOver = (testamentDistribution?.beneficiaries ?? [])
    .filter((beneficiary) => beneficiary.beneficiaryRef === survivingCounterpartRef)
    .reduce((sum, beneficiary) => sum + beneficiary.partSuccession, 0);

  return {
    transmission,
    partConjoint,
    partAutresBeneficiaires,
    carryOverToStep2: testamentCarryOver,
    warnings: [
      ...prefixStepWarnings(stepLabel, configWarnings),
      ...prefixStepWarnings(stepLabel, testamentDistribution?.warnings ?? []),
      ...prefixStepWarnings(stepLabel, donationRecallWarnings),
    ],
  };
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
  return getStepWarnings(stepLabel, enfantsContext, familyMembers, deceased, hasAllocatedBeneficiaries);
}
