import type { DmtgSettings } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionDonationEntry,
  type SuccessionEnfant,
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
  assignBeneficiaryTaxableBasis,
  buildSuccessionEstateTaxableBasis,
  createEmptyOwnerScales,
  scaleSuccessionEstateTaxableBasis,
  type SuccessionAssetTransmissionBasis,
  type SuccessionEstateOwnerScales,
  type SuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';

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
  patrimonial?: Pick<
    SuccessionPatrimonialContext,
    'attributionIntegrale' | 'donationEntreEpouxActive' | 'donationEntreEpouxOption' | 'preciputMontant'
  >;
  transmissionBasis?: SuccessionAssetTransmissionBasis;
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

function buildFirstEstateOwnerScales(
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  attributionBiensCommunsPct: number,
): SuccessionEstateOwnerScales {
  const scales = createEmptyOwnerScales();

  if (regimeUsed === 'communaute_universelle') {
    scales.epoux1 = 1;
    scales.epoux2 = 1;
    scales.commun = 1;
    return scales;
  }

  if (regimeUsed === 'separation_biens') {
    scales[order] = 1;
    return scales;
  }

  const pctDefunt = (100 - Math.min(100, Math.max(0, attributionBiensCommunsPct))) / 100;
  scales[order] = 1;
  scales.commun = pctDefunt;
  return scales;
}

function buildSurvivorOwnerScales(
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  attributionBiensCommunsPct: number,
): SuccessionEstateOwnerScales {
  const scales = createEmptyOwnerScales();
  const survivor = getOtherSide(order);

  if (regimeUsed === 'communaute_universelle') {
    return scales;
  }

  if (regimeUsed === 'separation_biens') {
    scales[survivor] = 1;
    return scales;
  }

  const pctSurvivant = Math.min(100, Math.max(0, attributionBiensCommunsPct)) / 100;
  scales[survivor] = 1;
  scales.commun = pctSurvivant;
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
    totalDroits: 0,
    warnings: [warning],
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

function computeStepTransmission(
  input: SuccessionChainageInput,
  estateAmount: number,
  estateTaxableBasis: SuccessionEstateTaxableBasis,
  deceased: SuccessionDeceasedSide,
  legalPartnerAmount: number,
  redistributableAmount: number,
  deadCounterpart: SuccessionDeceasedSide | null,
  stepLabel: string,
): SuccessionChainStepComputation {
  const legalPartnerHeirs = buildLegalPartnerHeirs(input.civil, legalPartnerAmount);
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

  const attributionPct = input.attributionBiensCommunsPct ?? 50;
  const firstEstate = computeFirstEstate(input.regimeUsed, input.order, input.liquidation, attributionPct);
  const survivorBase = Math.max(0, totalPatrimoine - firstEstate);
  const survivorEconomicInflows = Math.max(0, input.survivorEconomicInflows?.[input.order] ?? 0);
  const warnings: string[] = [];
  const firstEstateOwnerScales = buildFirstEstateOwnerScales(input.regimeUsed, input.order, attributionPct);
  const survivorOwnerScales = buildSurvivorOwnerScales(input.regimeUsed, input.order, attributionPct);
  const firstEstateTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    firstEstateOwnerScales,
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
  warnings.push('Module de chainage simplifie: liquidation notariale fine et options civiles avancees non modelisees.');

  const step1Split = computeStep1Split(
    input.civil,
    input.regimeUsed,
    firstEstate,
    nbEnfants,
    input.order,
    input.patrimonial,
    input.referenceDate,
  );
  warnings.push(...step1Split.warnings);
  const step1TaxableEstate = firstEstate - step1Split.preciputDeducted;
  const step1TransmissionTaxableBasis = firstEstate > 0
    ? scaleSuccessionEstateTaxableBasis(firstEstateTaxableBasis, step1TaxableEstate / firstEstate)
    : {
      ordinaryNetBeforeForfait: 0,
      groupementEntries: [],
    };
  const step1Details = computeStepTransmission(
    input,
    step1TaxableEstate,
    step1TransmissionTaxableBasis,
    input.order,
    step1Split.conjointPart,
    step1Split.enfantsPart,
    null,
    `Etape 1 (${getLabelForSide(input.order)})`,
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
  const step2CarryOverAmount = step1Split.carryOverToStep2 + step1Details.carryOverToStep2 + step1Split.preciputDeducted;
  const step2Estate = survivorBase + step2CarryOverAmount + survivorEconomicInflows;
  const survivorTaxableBasis = buildSuccessionEstateTaxableBasis(
    input.transmissionBasis,
    survivorOwnerScales,
  );
  const carryOverTaxableBasis = firstEstate > 0
    ? scaleSuccessionEstateTaxableBasis(firstEstateTaxableBasis, step2CarryOverAmount / firstEstate)
    : {
      ordinaryNetBeforeForfait: 0,
      groupementEntries: [],
    };
  const survivorEconomicInflowsTaxableBasis = {
    ordinaryNetBeforeForfait: survivorEconomicInflows,
    groupementEntries: [],
  };
  const step2TaxableBasis = addSuccessionEstateTaxableBases(
    survivorTaxableBasis,
    carryOverTaxableBasis,
    survivorEconomicInflowsTaxableBasis,
  );
  const step2Details = computeStepTransmission(
    input,
    step2Estate,
    step2TaxableBasis,
    otherSide,
    0,
    step2Estate,
    input.order,
    `Etape 2 (${getLabelForSide(otherSide)})`,
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
    totalDroits: step1Details.transmission.droits + step2Details.transmission.droits,
    warnings,
  };
}
