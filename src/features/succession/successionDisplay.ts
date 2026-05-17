import {
  calculateSuccession,
  type HeritiersInput,
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
import type { SuccessionChainageAnalysis } from './successionChainage';
import {
  buildSuccessionChainTransmissionRowsInternal,
  buildSuccessionDirectTransmissionRows,
} from './successionDisplay.helpers';
import {
  asAmount,
  buildDetailedDescendantHeirs,
  buildLegalPartnerHeirs,
  buildParentAndSiblingHeirs,
  buildTestamentHeirs,
  findLineAmount,
  mergeDetailedHeirs,
  scaleDetailedHeirs,
  toHeritiersInput,
  toTaxableHeritiersInput,
} from './successionDisplay.heirs';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  applySuccessionDonationRecallToHeirs,
  buildDonationRecallWarningMessages,
} from './successionDonationRecall';
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

function getRelevantDeceased(
  civil: SuccessionCivilContext,
  order: 'epoux1' | 'epoux2' | undefined,
): 'epoux1' | 'epoux2' {
  if (
    civil.situationMatrimoniale === 'marie' ||
    civil.situationMatrimoniale === 'pacse' ||
    civil.situationMatrimoniale === 'concubinage'
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
  const ownAmount =
    simulatedDeceased === 'epoux1'
      ? asAmount(liquidation.actifEpoux1)
      : asAmount(liquidation.actifEpoux2);
  const sharedAmount = asAmount(liquidation.actifCommun);

  if (civil.situationMatrimoniale === 'concubinage') {
    return {
      actifNetSuccession: ownAmount + sharedAmount * 0.5,
      simulatedDeceased,
      warnings:
        sharedAmount > 0
          ? [
              'Union libre: la quote-part indivise du defunt est estimee a 50 % de la masse en indivision.',
            ]
          : [],
    };
  }

  if (civil.situationMatrimoniale === 'pacse' && civil.pacsConvention === 'indivision') {
    return {
      actifNetSuccession: ownAmount + sharedAmount * 0.5,
      simulatedDeceased,
      warnings:
        sharedAmount > 0
          ? [
              'PACS indivision: la quote-part indivise du defunt est estimee a 50 % dans la succession directe.',
            ]
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
    sharedPocket &&
    (civil.situationMatrimoniale === 'concubinage' ||
      (civil.situationMatrimoniale === 'pacse' && civil.pacsConvention === 'indivision'))
  ) {
    scales[sharedPocket] = 0.5;
  }

  return scales;
}

export function buildSuccessionChainTransmissionRows(
  analysis: SuccessionChainageAnalysis,
): SuccessionTransmissionRow[] {
  return buildSuccessionChainTransmissionRowsInternal(analysis);
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

  const redistributableLegalHeirs = [...descendantHeirs.heirs, ...parentAndSiblingHeirs.heirs];
  const redistributableTotal = redistributableLegalHeirs.reduce(
    (sum, heir) => sum + heir.partSuccession,
    0,
  );

  const testamentHeirs = buildTestamentHeirs(input.devolution);
  const testamentTotal = testamentHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0);

  // BUG 11 fix: for legs_universel / legs_titre_universel targeting the conjoint,
  // apply max(legal, testament) instead of cumulating both.
  const isUniversalDisposition =
    input.devolution.testamentDistribution?.dispositionType === 'legs_universel' ||
    input.devolution.testamentDistribution?.dispositionType === 'legs_titre_universel';
  const testamentConjointAmount = isUniversalDisposition
    ? testamentHeirs
        .filter((h) => h.lien === 'conjoint')
        .reduce((sum, h) => sum + h.partSuccession, 0)
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
    Math.min(
      redistributableTotal,
      estateAmount - effectiveProtectedTotal - effectiveTestamentTotal,
    ),
  );
  const scaledRedistributableHeirs =
    effectiveTestamentHeirs.length > 0 || (isUniversalDisposition && testamentConjointAmount > 0)
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
  const donateurDateNaissance =
    simulatedDeceased === 'epoux1'
      ? input.civil.dateNaissanceEpoux1
      : input.civil.dateNaissanceEpoux2;
  const donationRecallResult = applySuccessionDonationRecallToHeirs({
    heirs: detailedHeirsWithTaxableBasis,
    donations: input.donationsContext,
    simulatedDeceased,
    donationSettings: input.donationSettings,
    dmtgSettings: input.dmtgSettings,
    referenceDate: input.referenceDate,
    donateurDateNaissance,
  });
  const detailedHeirsWithDonationRecall = donationRecallResult.heirs;
  warnings.push(...buildDonationRecallWarningMessages(donationRecallResult.warnings));

  const heirs = toHeritiersInput(detailedHeirsWithDonationRecall);
  const actifNetSuccession =
    heirs.reduce((sum, heir) => sum + heir.partSuccession, 0) || estateAmount;
  const taxableHeirs = toTaxableHeritiersInput(detailedHeirsWithDonationRecall);
  const rawResult =
    taxableHeirs.length > 0
      ? calculateSuccession({
          actifNetSuccession,
          heritiers: taxableHeirs,
          dmtgSettings: input.dmtgSettings,
        }).result
      : null;
  const result = rawResult
    ? {
        ...rawResult,
        actifNetSuccession,
        detailHeritiers: rawResult.detailHeritiers.map((detail, index) => {
          const brut = detailedHeirsWithTaxableBasis[index]?.partSuccession ?? detail.partBrute;
          return {
            ...detail,
            partBrute: brut,
            tauxMoyen: brut > 0 ? Math.round((detail.droits / brut) * 100 * 100) / 100 : 0,
          };
        }),
        tauxMoyenGlobal:
          actifNetSuccession > 0
            ? Math.round((rawResult.totalDroits / actifNetSuccession) * 100 * 100) / 100
            : 0,
      }
    : null;

  return {
    actifNetSuccession,
    simulatedDeceased,
    heirs,
    result,
    transmissionRows: buildSuccessionDirectTransmissionRows(
      detailedHeirsWithDonationRecall,
      result,
    ),
    warnings,
  };
}
