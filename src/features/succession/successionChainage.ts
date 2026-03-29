import type { DmtgSettings } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SuccessionAssetPocket,
  type SuccessionAssetDetailEntry,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
  type SuccessionGroupementFoncierEntry,
  type SuccessionLiquidationContext,
  type SuccessionPatrimonialContext,
  type SuccessionTestamentConfig,
} from './successionDraft';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  buildSuccessionDescendantRecipients,
  countEffectiveDescendantBranches,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';
import {
  cloneSuccessionTestamentConfig,
  computeTestamentDistribution,
} from './successionTestament';
import {
  computeFirstEstate,
  computeSocieteAcquetsDistribution,
  computeStep1Split,
} from './successionChainageEstateSplit';
import {
  buildDetailedDescendantHeirs,
  computeTransmissionForHeirs,
  mergeDetailedHeirs,
  type DetailedChainHeir,
} from './successionChainage.heirs';
import { applySuccessionDonationRecallToHeirs } from './successionDonationRecall';
import {
  addSuccessionEstateTaxableBases,
  applyResidencePrincipaleAbatementToEstateBasis,
  assignBeneficiaryTaxableBasis,
  buildSuccessionEstateTaxableBasis,
  subtractSuccessionEstateTaxableBases,
  scaleSuccessionEstateTaxableBasis,
  type SuccessionAssetTransmissionBasis,
  createEmptyPocketScales,
  type SuccessionEstatePocketScales,
  type SuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';
import { getSuccessionSharedPocketForContext } from './successionPatrimonialModel';
import {
  buildSuccessionPreciputCandidates,
  buildSuccessionTargetedPreciputTaxableBasis,
  getSuccessionPreciputEligiblePocket,
  resolveSuccessionPreciputApplication,
  type SuccessionResolvedPreciputSelection,
} from './successionPreciput';
import {
  computeSuccessionParticipationAcquetsSummary,
  type SuccessionParticipationAcquetsSummary,
} from './successionParticipationAcquets';
import type {
  SuccessionAffectedLiabilitySummary,
  SuccessionInterMassClaimsSummary,
} from './successionInterMassClaims';

export type SuccessionChainOrder = 'epoux1' | 'epoux2';
export type SuccessionChainRegime = 'communaute_legale' | 'separation_biens' | 'communaute_universelle';

export interface SuccessionChainStep {
  actifTransmis: number;
  partConjoint: number;
  partEnfants: number;
  droitsConjoint: number;
  droitsEnfants: number;
  beneficiaries: SuccessionChainBeneficiary[];
}

export interface SuccessionChainSocieteAcquetsSummary {
  configured: boolean;
  totalValue: number;
  firstEstateContribution: number;
  survivorShare: number;
  preciputAmount: number;
  survivorAttributionAmount: number;
  liquidationMode: SuccessionPatrimonialContext['societeAcquets']['liquidationMode'];
  deceasedQuotePct: number;
  survivorQuotePct: number;
  attributionIntegrale: boolean;
}

export interface SuccessionChainPreciputSelectionSummary {
  id: string;
  sourceType: 'asset' | 'groupement_foncier';
  sourceId: string;
  label: string;
  pocket: SuccessionAssetPocket;
  requestedAmount: number;
  appliedAmount: number;
}

export interface SuccessionChainPreciputSummary {
  mode: 'global' | 'cible' | 'none';
  pocket: SuccessionAssetPocket | null;
  requestedAmount: number;
  appliedAmount: number;
  usesGlobalFallback: boolean;
  selections: SuccessionChainPreciputSelectionSummary[];
}

export interface SuccessionChainInterMassClaimSummary {
  configured: boolean;
  totalRequestedAmount: number;
  totalAppliedAmount: number;
  claims: Array<{
    id: string;
    kind: 'recompense' | 'creance';
    label?: string;
    fromPocket: SuccessionAssetPocket;
    toPocket: SuccessionAssetPocket;
    requestedAmount: number;
    appliedAmount: number;
  }>;
}

export interface SuccessionChainAffectedLiabilitySummary {
  totalAmount: number;
  byPocket: Array<{
    pocket: SuccessionAssetPocket;
    amount: number;
  }>;
}

export interface SuccessionChainBeneficiary {
  id: string;
  label: string;
  lien: LienParente;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

export interface SuccessionChainageAnalysis {
  applicable: boolean;
  order: SuccessionChainOrder;
  firstDecedeLabel: string;
  secondDecedeLabel: string;
  step1: SuccessionChainStep | null;
  step2: SuccessionChainStep | null;
  societeAcquets: SuccessionChainSocieteAcquetsSummary | null;
  participationAcquets: SuccessionParticipationAcquetsSummary | null;
  preciput: SuccessionChainPreciputSummary | null;
  interMassClaims: SuccessionChainInterMassClaimSummary | null;
  affectedLiabilities: SuccessionChainAffectedLiabilitySummary | null;
  totalDroits: number;
  warnings: string[];
}

interface SuccessionChainageInput {
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  regimeUsed: SuccessionChainRegime | null;
  order: SuccessionChainOrder;
  dmtgSettings: DmtgSettings;
  survivorEconomicInflows?: Record<'epoux1' | 'epoux2', number>;
  attributionBiensCommunsPct?: number;
  patrimonial?: Partial<Pick<
    SuccessionPatrimonialContext,
    | 'attributionIntegrale'
    | 'donationEntreEpouxActive'
    | 'donationEntreEpouxOption'
    | 'stipulationContraireCU'
    | 'preciputMode'
    | 'preciputSelections'
    | 'preciputMontant'
    | 'participationAcquets'
    | 'societeAcquets'
    | 'interMassClaims'
  >>;
  societeAcquetsNetValue?: number;
  assetEntries?: SuccessionAssetDetailEntry[];
  groupementFoncierEntries?: SuccessionGroupementFoncierEntry[];
  transmissionBasis?: SuccessionAssetTransmissionBasis;
  interMassClaimsSummary?: SuccessionInterMassClaimsSummary | null;
  affectedLiabilitySummary?: SuccessionAffectedLiabilitySummary | null;
  abattementResidencePrincipale?: boolean;
  forfaitMobilierMode?: SuccessionPatrimonialContext['forfaitMobilierMode'];
  forfaitMobilierPct?: number;
  forfaitMobilierMontant?: number;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: FamilyMember[];
  devolution?: Pick<SuccessionDevolutionContext, 'testamentsBySide'>;
  referenceDate?: Date;
  donations?: SuccessionDonationEntry[];
  donationSettings?: SuccessionFiscalSnapshot['donation'];
}

interface SuccessionChainStepComputation {
  transmission: { droits: number; beneficiaries: SuccessionChainBeneficiary[] };
  partConjoint: number;
  partAutresBeneficiaires: number;
  carryOverToStep2: number;
  warnings: string[];
}

function asAmount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function asChildrenCount(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.floor(num));
}

function hasRepresentationOnAnySide(
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): boolean {
  return buildSuccessionDescendantRecipients(enfantsContext, familyMembers).some((recipient) => recipient.lien === 'petit_enfant');
}

function getOtherSide(order: SuccessionChainOrder): SuccessionDeceasedSide {
  return order === 'epoux1' ? 'epoux2' : 'epoux1';
}

function getLabelForSide(side: SuccessionDeceasedSide): string {
  return side === 'epoux1' ? 'Epoux 1' : 'Epoux 2';
}

function buildTargetedPreciputSelectionsSummary(
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

function buildFirstEstatePocketScales(
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

function buildSurvivorPocketScales(
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
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
  hasAllocatedBeneficiaries = false,
): string[] {
  if (hasAllocatedBeneficiaries) return [];
  const branchCount = countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, deceased);
  if (branchCount > 0) return [];
  const allRecipients = buildSuccessionDescendantRecipients(enfantsContext, familyMembers);
  if (allRecipients.length === 0) return [];
  return [`${stepLabel}: aucun descendant du defunt de cette etape n'est eligible dans la branche retenue.`];
}

function buildEmptyAnalysis(order: SuccessionChainOrder, warning: string): SuccessionChainageAnalysis {
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

function createEmptyEstateTaxableBasis(): SuccessionEstateTaxableBasis {
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
    (m) => m.type === 'parent' && (!m.branch || m.branch === deceased),
  );
  const count = Math.max(1, parents.length);
  const amountEach = amount / count;
  return Array.from({ length: count }, (_, i) => ({
    id: parents[i]?.id ?? `parent-${deceased}-${i + 1}`,
    label: `Parent ${i + 1}`,
    lien: 'parent' as const,
    partSuccession: amountEach,
    exonerated: false,
  }));
}

function computeStepTransmission(
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
  const { testament, warnings: configWarnings } = getStepTestamentConfig(input, deceased, deadCounterpart);
  const testamentDistribution = computeTestamentDistribution({
    situation: input.civil.situationMatrimoniale,
    side: deceased,
    testament,
    masseReference: estateAmount,
    enfants: input.enfantsContext ?? [],
    familyMembers: input.familyMembers ?? [],
    maxAvailableAmount: redistributableAmount,
  });
  const testamentHeirs: DetailedChainHeir[] = (testamentDistribution?.beneficiaries ?? []).map((beneficiary) => ({
    id: beneficiary.id,
    label: beneficiary.label,
    lien: beneficiary.lien,
    partSuccession: beneficiary.partSuccession,
    exonerated: beneficiary.exonerated,
  }));

  // BUG 11 fix: for legs_universel / legs_titre_universel targeting the conjoint,
  // apply max(legal, testament) instead of cumulating both.
  // legs_particulier remains cumulative (specific assets on top of legal share).
  const isUniversalDisposition = testamentDistribution?.dispositionType === 'legs_universel'
    || testamentDistribution?.dispositionType === 'legs_titre_universel';
  const testamentConjointAmount = isUniversalDisposition
    ? testamentHeirs.filter((h) => h.id === 'conjoint').reduce((sum, h) => sum + h.partSuccession, 0)
    : 0;
  let effectiveRedistributableAmount = redistributableAmount;
  if (isUniversalDisposition && testamentConjointAmount > 0 && legalPartnerAmount > 0) {
    const effectiveConjointPart = Math.max(legalPartnerAmount, testamentConjointAmount);
    const legalPartnerHeirsAdjusted = legalPartnerHeirs.map((h) =>
      h.id === 'conjoint' ? { ...h, partSuccession: effectiveConjointPart } : h,
    );
    const filteredTestamentHeirs = testamentHeirs.filter((h) => h.id !== 'conjoint');
    const testamentDistributedNonConjoint = filteredTestamentHeirs.reduce((sum, h) => sum + h.partSuccession, 0);
    effectiveRedistributableAmount = Math.max(0, estateAmount - effectiveConjointPart - testamentDistributedNonConjoint);
    const descendantsResidualAmountAdj = Math.max(0, effectiveRedistributableAmount);
    const detailedDescendantHeirsAdj = buildDetailedDescendantHeirs(
      descendantsResidualAmountAdj,
      deceased,
      countEffectiveDescendantBranchesForDeceased(
        input.enfantsContext ?? [],
        input.familyMembers ?? [],
        deceased,
      ),
      input.dmtgSettings,
      input.enfantsContext ?? [],
      input.familyMembers ?? [],
    );
    const detailedHeirs = mergeDetailedHeirs([
      ...legalPartnerHeirsAdjusted,
      ...parentHeirs,
      ...filteredTestamentHeirs,
      ...detailedDescendantHeirsAdj,
    ]);
    const detailedHeirsWithTaxableBasis = input.transmissionBasis
      ? assignBeneficiaryTaxableBasis(detailedHeirs, estateTaxableBasis, {
        forfaitMobilierMode: input.forfaitMobilierMode ?? 'off',
        forfaitMobilierPct: input.forfaitMobilierPct ?? 0,
        forfaitMobilierMontant: input.forfaitMobilierMontant ?? 0,
      })
      : detailedHeirs;
    const detailedHeirsWithDonationRecall = applySuccessionDonationRecallToHeirs({
      heirs: detailedHeirsWithTaxableBasis,
      donations: input.donations,
      simulatedDeceased: deceased,
      donationSettings: input.donationSettings,
      dmtgSettings: input.dmtgSettings,
      referenceDate: input.referenceDate,
    });
    const { droits, beneficiaries } = computeTransmissionForHeirs(
      estateAmount,
      detailedHeirsWithDonationRecall,
      input.dmtgSettings,
    );
    const partAutresBeneficiaires = beneficiaries
      .filter((b) => b.lien !== 'conjoint')
      .reduce((sum, b) => sum + b.brut, 0);
    const survivingCounterpartRef = `principal:${getOtherSide(deceased)}` as const;
    const testamentCarryOver = (testamentDistribution?.beneficiaries ?? [])
      .filter((b) => b.beneficiaryRef === survivingCounterpartRef)
      .reduce((sum, b) => sum + b.partSuccession, 0);
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
    countEffectiveDescendantBranchesForDeceased(
      input.enfantsContext ?? [],
      input.familyMembers ?? [],
      deceased,
    ),
    input.dmtgSettings,
    input.enfantsContext ?? [],
    input.familyMembers ?? [],
  );
  const detailedHeirs = mergeDetailedHeirs([
    ...legalPartnerHeirs,
    ...parentHeirs,
    ...testamentHeirs,
    ...detailedDescendantHeirs,
  ]);
  const detailedHeirsWithTaxableBasis = input.transmissionBasis
    ? assignBeneficiaryTaxableBasis(detailedHeirs, estateTaxableBasis, {
      forfaitMobilierMode: input.forfaitMobilierMode ?? 'off',
      forfaitMobilierPct: input.forfaitMobilierPct ?? 0,
      forfaitMobilierMontant: input.forfaitMobilierMontant ?? 0,
    })
    : detailedHeirs;
  const detailedHeirsWithDonationRecall = applySuccessionDonationRecallToHeirs({
    heirs: detailedHeirsWithTaxableBasis,
    donations: input.donations,
    simulatedDeceased: deceased,
    donationSettings: input.donationSettings,
    dmtgSettings: input.dmtgSettings,
    referenceDate: input.referenceDate,
  });
  const transmission = computeTransmissionForHeirs(
    estateAmount,
    detailedHeirsWithDonationRecall,
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
    ],
  };
}

function countSideParents(familyMembers: FamilyMember[], deceased: SuccessionDeceasedSide): number {
  return familyMembers.filter(
    (m) => m.type === 'parent' && (!m.branch || m.branch === deceased),
  ).length;
}

export function buildSuccessionChainageAnalysis(input: SuccessionChainageInput): SuccessionChainageAnalysis {
  const enfantsContext = input.enfantsContext ?? [];
  const familyMembers = input.familyMembers ?? [];
  const nbEnfants = Math.max(
    asChildrenCount(input.liquidation.nbEnfants),
    countEffectiveDescendantBranches(enfantsContext, familyMembers),
  );
  const totalPatrimoine =
    asAmount(input.liquidation.actifEpoux1)
    + asAmount(input.liquidation.actifEpoux2)
    + asAmount(input.liquidation.actifCommun);

  if (!input.regimeUsed) {
    return buildEmptyAnalysis(input.order, 'Chainage disponible pour couples maries ou pacses avec regime de liquidation.');
  }

  const attributionPctBase = input.attributionBiensCommunsPct ?? 50;
  const attributionPct = (
    input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'communaute_universelle'
    && input.patrimonial?.attributionIntegrale
  ) ? 100 : attributionPctBase;
  const isSocieteAcquetsRegime = input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'separation_biens_societe_acquets'
    && input.regimeUsed === 'separation_biens';
  const preciputEligiblePocket = getSuccessionPreciputEligiblePocket({
    isCommunityRegime: input.civil.situationMatrimoniale === 'marie'
      && input.regimeUsed !== 'separation_biens'
      && !isSocieteAcquetsRegime,
    isSocieteAcquetsRegime,
  });
  const preciputCandidates = buildSuccessionPreciputCandidates({
    assetEntries: input.assetEntries ?? [],
    groupementFoncierEntries: input.groupementFoncierEntries ?? [],
    allowedPocket: preciputEligiblePocket,
  });
  const resolvedPreciput = resolveSuccessionPreciputApplication({
    patrimonial: input.patrimonial,
    candidates: preciputCandidates,
  });
  const participationAcquetsSummary = computeSuccessionParticipationAcquetsSummary({
    civil: input.civil,
    regimeUsed: input.regimeUsed,
    order: input.order,
    liquidation: input.liquidation,
    patrimonial: input.patrimonial,
  });
  const requestedTargetedPreciputBasis = resolvedPreciput.mode === 'cible'
    ? buildSuccessionTargetedPreciputTaxableBasis(resolvedPreciput.targetedSelections)
    : createEmptyEstateTaxableBasis();
  const preserveQualifiedSeparatePocketsInUniversalCommunity = (
    input.civil.situationMatrimoniale === 'marie'
    && input.civil.regimeMatrimonial === 'communaute_universelle'
    && Boolean(input.patrimonial?.stipulationContraireCU)
  );
  const preciputPatrimonial = resolvedPreciput.mode === 'none'
    ? input.patrimonial
    : {
      ...(input.patrimonial ?? {}),
      preciputMontant: resolvedPreciput.requestedAmount,
    };
  const societeAcquetsDistribution = (
    isSocieteAcquetsRegime
  )
    ? computeSocieteAcquetsDistribution(
      input.order,
      input.societeAcquetsNetValue ?? 0,
      preciputPatrimonial,
    )
    : null;
  const societeAcquetsEstateRatio = (
    societeAcquetsDistribution
    && (input.societeAcquetsNetValue ?? 0) > 0
  )
    ? societeAcquetsDistribution.firstEstateContribution / Math.max(1, input.societeAcquetsNetValue ?? 0)
    : 0;
  const isCommunityRegime = input.regimeUsed !== 'separation_biens';
  const sharedMassPreciputAmount = (
    resolvedPreciput.mode !== 'none'
    && !societeAcquetsDistribution
    && isCommunityRegime
  ) ? resolvedPreciput.requestedAmount : 0;
  const firstEstateBase = computeFirstEstate(
    input.regimeUsed,
    input.order,
    input.liquidation,
    attributionPct,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
    sharedMassPreciputAmount,
  ) + (societeAcquetsDistribution?.firstEstateContribution ?? 0);
  const firstEstateWithoutPreciput = sharedMassPreciputAmount > 0
    ? computeFirstEstate(
      input.regimeUsed,
      input.order,
      input.liquidation,
      attributionPct,
      preserveQualifiedSeparatePocketsInUniversalCommunity,
      0,
    ) + (societeAcquetsDistribution?.firstEstateContribution ?? 0)
    : 0;
  const firstEstate = Math.min(
    totalPatrimoine,
    Math.max(0, firstEstateBase + (participationAcquetsSummary?.firstEstateAdjustment ?? 0)),
  );
  const survivorBase = Math.max(0, totalPatrimoine - firstEstate);
  const survivorEconomicInflows = Math.max(0, input.survivorEconomicInflows?.[input.order] ?? 0);
  const warnings: string[] = [];
  const firstEstatePocketScales = buildFirstEstatePocketScales(
    input.civil,
    input.regimeUsed,
    input.order,
    attributionPct,
    societeAcquetsEstateRatio,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
  );
  const survivorPocketScales = buildSurvivorPocketScales(
    input.civil,
    input.regimeUsed,
    input.order,
    attributionPct,
    societeAcquetsEstateRatio,
    preserveQualifiedSeparatePocketsInUniversalCommunity,
  );
  const firstEstateTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    firstEstatePocketScales,
  );

  if (attributionPct !== 50 && input.regimeUsed === 'communaute_legale') {
    warnings.push(`Attribution des biens communs au survivant: ${attributionPct} % applique au partage communautaire.`);
  }
  if (nbEnfants <= 0) {
    warnings.push('Aucun enfant declare: la chronologie reste indicative hors beneficiaires testamentaires explicitement saisis.');
  }
  if (
    input.civil.situationMatrimoniale === 'pacse'
    && !input.devolution?.testamentsBySide.epoux1.active
    && !input.devolution?.testamentsBySide.epoux2.active
  ) {
    warnings.push('PACS: absence de vocation successorale legale automatique sans testament.');
  }
  if (hasRepresentationOnAnySide(enfantsContext, familyMembers)) {
    warnings.push('Chainage: representation successorale simplifiee prise en compte pour les petits-enfants declares.');
  }
  if (input.patrimonial?.preciputMode === 'cible' && resolvedPreciput.mode === 'cible') {
    warnings.push(
      `Preciput cible: ${Math.round(resolvedPreciput.requestedAmount).toLocaleString('fr-FR')} EUR demandes sur ${resolvedPreciput.targetedSelections.length} bien(s) compatibles.`,
    );
  }
  if (resolvedPreciput.usesGlobalFallback) {
    warnings.push('Preciput cible: aucune selection compatible active, repli sur le montant global.');
  }
  if (
    resolvedPreciput.mode === 'cible'
    && resolvedPreciput.targetedSelections.length > 0
  ) {
    warnings.push(
      `Preciput cible: biens retenus ${resolvedPreciput.targetedSelections.map((selection) => selection.candidate.label).join(', ')}.`,
    );
  }
  if (societeAcquetsDistribution) {
    warnings.push(...societeAcquetsDistribution.warnings);
  }
  if (participationAcquetsSummary) {
    warnings.push(...participationAcquetsSummary.warnings);
  }
  if (input.interMassClaimsSummary?.configured) {
    warnings.push(
      `Creances entre masses: ${Math.round(input.interMassClaimsSummary.totalAppliedAmount).toLocaleString('fr-FR')} EUR appliques sur ${input.interMassClaimsSummary.claims.filter((claim) => claim.appliedAmount > 0).length} ecriture(s).`,
    );
    warnings.push(...input.interMassClaimsSummary.warnings);
  }
  if ((input.affectedLiabilitySummary?.totalAmount ?? 0) > 0) {
    warnings.push(
      `Passif affecte: ${Math.round(input.affectedLiabilitySummary?.totalAmount ?? 0).toLocaleString('fr-FR')} EUR rattaches a des masses patrimoniales dediees.`,
    );
  }
  if (preserveQualifiedSeparatePocketsInUniversalCommunity) {
    warnings.push("Communaute universelle: les biens qualifies 'propre par nature' et rattaches a un epoux sont exclus de la masse commune simplifiee.");
  }
  if (input.civil.regimeMatrimonial === 'communaute_meubles_acquets') {
    warnings.push('Communaute de meubles et acquets: la qualification meuble / immeuble des actifs detailles ajuste la masse simplifiee avant chainage.');
  }
  warnings.push('Module de chainage simplifie: liquidation notariale fine et options civiles avancees non modelisees.');

  const nbParentsStep1 = countSideParents(familyMembers, input.order);
  const step1Split = computeStep1Split(
    input.civil,
    input.regimeUsed,
    firstEstate,
    nbEnfants,
    input.order,
    (sharedMassPreciputAmount > 0 || societeAcquetsDistribution || !isCommunityRegime)
      ? { ...(input.patrimonial ?? {}), preciputMontant: 0 }
      : preciputPatrimonial,
    input.referenceDate,
    nbParentsStep1,
  );
  warnings.push(...step1Split.warnings);
  const step1TaxableEstate = firstEstate - step1Split.preciputDeducted;
  const effectivePreciputApplied = societeAcquetsDistribution?.preciputAmount
    ?? (sharedMassPreciputAmount > 0 ? sharedMassPreciputAmount : step1Split.preciputDeducted);
  const targetedPreciputAppliedAmount = resolvedPreciput.mode === 'cible'
    ? effectivePreciputApplied
    : 0;
  const preciputSummary: SuccessionChainPreciputSummary | null = (
    resolvedPreciput.mode === 'none'
    && effectivePreciputApplied <= 0
  )
    ? null
    : {
      mode: resolvedPreciput.mode,
      pocket: preciputEligiblePocket,
      requestedAmount: resolvedPreciput.requestedAmount,
      appliedAmount: resolvedPreciput.mode === 'cible'
        ? targetedPreciputAppliedAmount
        : effectivePreciputApplied,
      usesGlobalFallback: resolvedPreciput.usesGlobalFallback,
      selections: buildTargetedPreciputSelectionsSummary(
        resolvedPreciput.targetedSelections,
        resolvedPreciput.requestedAmount,
        targetedPreciputAppliedAmount,
      ),
    };
  const targetedPreciputAppliedBasis = (
    resolvedPreciput.mode === 'cible'
    && resolvedPreciput.requestedAmount > 0
    && targetedPreciputAppliedAmount > 0
  )
    ? scaleSuccessionEstateTaxableBasis(
      requestedTargetedPreciputBasis,
      targetedPreciputAppliedAmount / resolvedPreciput.requestedAmount,
    )
    : createEmptyEstateTaxableBasis();
  const firstEstateBasisDenominator = sharedMassPreciputAmount > 0
    ? Math.max(firstEstate, firstEstateWithoutPreciput)
    : firstEstate;
  const step1TransmissionTaxableBasisBase = firstEstateBasisDenominator > 0
    ? (
      resolvedPreciput.mode === 'cible'
        ? (
          societeAcquetsDistribution
            ? firstEstateTaxableBasis
            : subtractSuccessionEstateTaxableBases(
              firstEstateTaxableBasis,
              targetedPreciputAppliedBasis,
            )
        )
        : scaleSuccessionEstateTaxableBasis(firstEstateTaxableBasis, step1TaxableEstate / firstEstateBasisDenominator)
    )
    : createEmptyEstateTaxableBasis();
  const step1TransmissionTaxableBasis = applyResidencePrincipaleAbatementToEstateBasis(
    step1TransmissionTaxableBasisBase,
    Boolean(input.abattementResidencePrincipale),
  );
  const step1Details = computeStepTransmission(
    input,
    step1TaxableEstate,
    step1TransmissionTaxableBasis,
    input.order,
    step1Split.conjointPart,
    step1Split.enfantsPart,
    null,
    `Etape 1 (${getLabelForSide(input.order)})`,
    step1Split.parentsPart,
  );
  warnings.push(...step1Details.warnings);
  warnings.push(...getStepWarnings(
    `Etape 1 (${getLabelForSide(input.order)})`,
    enfantsContext,
    familyMembers,
    input.order,
    step1Details.transmission.beneficiaries.length > 0,
  ));

  const otherSide = getOtherSide(input.order);
  const step2InheritedCarryOverAmount = step1Split.carryOverToStep2 + step1Details.carryOverToStep2;
  const step2CarryOverAmount = step2InheritedCarryOverAmount;
  const step2Estate = survivorBase + step2CarryOverAmount + survivorEconomicInflows;
  const survivorTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    survivorPocketScales,
  );
  const carryOverTaxableBasis = resolvedPreciput.mode === 'cible'
    ? addSuccessionEstateTaxableBases(
      step1TaxableEstate > 0
        ? scaleSuccessionEstateTaxableBasis(
          step1TransmissionTaxableBasis,
          step2InheritedCarryOverAmount / step1TaxableEstate,
        )
        : createEmptyEstateTaxableBasis(),
      targetedPreciputAppliedBasis,
    )
    : firstEstateBasisDenominator > 0
      ? scaleSuccessionEstateTaxableBasis(firstEstateTaxableBasis, step2CarryOverAmount / firstEstateBasisDenominator)
      : createEmptyEstateTaxableBasis();
  const survivorEconomicInflowsTaxableBasis = {
    ordinaryNetBeforeForfait: survivorEconomicInflows,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  };
  const step2TaxableBasis = addSuccessionEstateTaxableBases(
    survivorTaxableBasis,
    carryOverTaxableBasis,
    survivorEconomicInflowsTaxableBasis,
  );
  const nbParentsStep2 = nbEnfants <= 0 ? countSideParents(familyMembers, otherSide) : 0;
  const step2ParentsPart = nbParentsStep2 > 0 ? step2Estate * Math.min(2, nbParentsStep2) * 0.25 : 0;
  const step2Details = computeStepTransmission(
    input,
    step2Estate,
    step2TaxableBasis,
    otherSide,
    0,
    step2Estate - step2ParentsPart,
    input.order,
    `Etape 2 (${getLabelForSide(otherSide)})`,
    step2ParentsPart,
  );
  warnings.push(...step2Details.warnings);
  warnings.push(...getStepWarnings(
    `Etape 2 (${getLabelForSide(otherSide)})`,
    enfantsContext,
    familyMembers,
    otherSide,
    step2Details.transmission.beneficiaries.length > 0,
  ));
  if (survivorEconomicInflows > 0) {
    warnings.push(`Etape 2 (${getLabelForSide(otherSide)}): capitaux assurances nets recycles depuis l'etape 1 = ${Math.round(survivorEconomicInflows).toLocaleString('fr-FR')} EUR.`);
  }
  if (input.abattementResidencePrincipale && input.transmissionBasis?.residencePrincipaleEntry) {
    warnings.push(`Etape 1 (${getLabelForSide(input.order)}): abattement residence principale 20 % applique a l'assiette fiscale de cette etape uniquement.`);
  }

  return {
    applicable: true,
    order: input.order,
    firstDecedeLabel: input.order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: input.order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: {
      actifTransmis: step1TaxableEstate,
      partConjoint: step1Details.partConjoint,
      partEnfants: step1Details.partAutresBeneficiaires,
      droitsConjoint: 0,
      droitsEnfants: step1Details.transmission.droits,
      beneficiaries: step1Details.transmission.beneficiaries,
    },
    step2: {
      actifTransmis: step2Estate,
      partConjoint: step2Details.partConjoint,
      partEnfants: step2Details.partAutresBeneficiaires,
      droitsConjoint: 0,
      droitsEnfants: step2Details.transmission.droits,
      beneficiaries: step2Details.transmission.beneficiaries,
    },
    societeAcquets: societeAcquetsDistribution
      ? {
        configured: societeAcquetsDistribution.configured,
        totalValue: societeAcquetsDistribution.totalValue,
        firstEstateContribution: societeAcquetsDistribution.firstEstateContribution,
        survivorShare: societeAcquetsDistribution.survivorShare,
        preciputAmount: societeAcquetsDistribution.preciputAmount,
        survivorAttributionAmount: societeAcquetsDistribution.survivorAttributionAmount,
        liquidationMode: societeAcquetsDistribution.liquidationMode,
        deceasedQuotePct: societeAcquetsDistribution.deceasedQuotePct,
        survivorQuotePct: societeAcquetsDistribution.survivorQuotePct,
        attributionIntegrale: societeAcquetsDistribution.attributionIntegrale,
      }
      : null,
    participationAcquets: participationAcquetsSummary,
    preciput: preciputSummary,
    interMassClaims: input.interMassClaimsSummary
      ? {
        configured: input.interMassClaimsSummary.configured,
        totalRequestedAmount: input.interMassClaimsSummary.totalRequestedAmount,
        totalAppliedAmount: input.interMassClaimsSummary.totalAppliedAmount,
        claims: input.interMassClaimsSummary.claims.map((claim) => ({
          id: claim.id,
          kind: claim.kind,
          label: claim.label,
          fromPocket: claim.fromPocket,
          toPocket: claim.toPocket,
          requestedAmount: claim.requestedAmount,
          appliedAmount: claim.appliedAmount,
        })),
      }
      : null,
    affectedLiabilities: input.affectedLiabilitySummary
      ? {
        totalAmount: input.affectedLiabilitySummary.totalAmount,
        byPocket: input.affectedLiabilitySummary.byPocket.map((entry) => ({
          pocket: entry.pocket,
          amount: entry.amount,
        })),
      }
      : null,
    totalDroits: step1Details.transmission.droits + step2Details.transmission.droits,
    warnings,
  };
}
