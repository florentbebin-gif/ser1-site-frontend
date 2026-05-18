import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionTestamentConfig,
} from './successionDraft';
import {
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
  type SuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';
import type {
  SuccessionChainageInput,
  SuccessionChainStepComputation,
} from './successionChainage.types';
import { getOtherSide } from './successionChainage.amounts';

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
  const testamentBase =
    input.devolution?.testamentsBySide[deceased] ?? getInactiveTestamentConfig();
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
      warnings.push(
        'Legs particulier en faveur du conjoint ou partenaire deja decede ignore au second deces.',
      );
    }
    return { testament, warnings };
  }

  if (testament.beneficiaryRef === blockedPrincipalRef) {
    testament.beneficiaryRef = null;
    warnings.push(
      'Beneficiaire testamentaire conjoint ou partenaire deja decede ignore au second deces.',
    );
  }

  return { testament, warnings };
}

function buildLegalPartnerHeirs(
  civil: SuccessionCivilContext,
  amount: number,
): DetailedChainHeir[] {
  if (civil.situationMatrimoniale !== 'marie' || amount <= 0) return [];
  return [
    {
      id: 'conjoint',
      label: 'Conjoint survivant',
      lien: 'conjoint',
      partSuccession: amount,
      exonerated: true,
    },
  ];
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

  const isUniversalDisposition =
    testamentDistribution?.dispositionType === 'legs_universel' ||
    testamentDistribution?.dispositionType === 'legs_titre_universel';
  const testamentConjointAmount = isUniversalDisposition
    ? testamentHeirs
        .filter((heir) => heir.id === 'conjoint')
        .reduce((sum, heir) => sum + heir.partSuccession, 0)
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
    const detailedSiblingHeirsAdj =
      descendantBranchCount === 0
        ? buildDetailedSiblingHeirs(
            descendantsResidualAmountAdj,
            deceased,
            input.familyMembers ?? [],
          )
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
    const donateurDateNaissanceEarly =
      deceased === 'epoux1' ? input.civil.dateNaissanceEpoux1 : input.civil.dateNaissanceEpoux2;
    const donationRecallResultEarly = applySuccessionDonationRecallToHeirs({
      heirs: detailedHeirsWithTaxableBasis,
      donations: input.donations,
      simulatedDeceased: deceased,
      donationSettings: input.donationSettings,
      dmtgSettings: input.dmtgSettings,
      referenceDate: input.referenceDate,
      donateurDateNaissance: donateurDateNaissanceEarly,
    });
    const donationRecallWarningsEarly = buildDonationRecallWarningMessages(
      donationRecallResultEarly.warnings,
    );
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
  const detailedSiblingHeirs =
    descendantBranchCount === 0
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
  const donateurDateNaissance =
    deceased === 'epoux1' ? input.civil.dateNaissanceEpoux1 : input.civil.dateNaissanceEpoux2;
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
