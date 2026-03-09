import type { DmtgSettings } from '../../engine/civil';
import { calculateSuccession, type LienParente } from '../../engine/succession';
import {
  DEFAULT_SUCCESSION_TESTAMENT_CONFIG,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionDevolutionContext,
  type SuccessionEnfant,
  type SuccessionLiquidationContext,
  type SuccessionPatrimonialContext,
  type SuccessionTestamentConfig,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  buildSuccessionDescendantRecipientsForDeceased,
  countEffectiveDescendantBranches,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';
import {
  cloneSuccessionTestamentConfig,
  computeTestamentDistribution,
} from './successionTestament';
import { getUsufruitValuationFromBirthDate } from './successionUsufruit';

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
  attributionBiensCommunsPct?: number;
  patrimonial?: Pick<SuccessionPatrimonialContext, 'donationEntreEpouxActive' | 'donationEntreEpouxOption'>;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: FamilyMember[];
  devolution?: Pick<SuccessionDevolutionContext, 'testamentsBySide'>;
}

interface DetailedChainHeir {
  id: string;
  label: string;
  lien: LienParente;
  partSuccession: number;
  exonerated?: boolean;
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

function computeFirstEstate(
  regimeUsed: SuccessionChainRegime,
  order: SuccessionChainOrder,
  liquidation: SuccessionLiquidationContext,
  attributionBiensCommunsPct = 50,
): number {
  const actifEpoux1 = asAmount(liquidation.actifEpoux1);
  const actifEpoux2 = asAmount(liquidation.actifEpoux2);
  const actifCommun = asAmount(liquidation.actifCommun);

  if (regimeUsed === 'communaute_universelle') {
    return actifEpoux1 + actifEpoux2 + actifCommun;
  }

  if (regimeUsed === 'separation_biens') {
    return order === 'epoux1' ? actifEpoux1 : actifEpoux2;
  }

  const pctDefunt = (100 - Math.min(100, Math.max(0, attributionBiensCommunsPct))) / 100;
  return (order === 'epoux1' ? actifEpoux1 : actifEpoux2) + (actifCommun * pctDefunt);
}

function getQuotiteDisponibleRatio(nbEnfants: number): number {
  if (nbEnfants <= 0) return 1;
  if (nbEnfants === 1) return 0.5;
  if (nbEnfants === 2) return 1 / 3;
  return 0.25;
}

function getSurvivingSpouseBirthDate(
  civil: SuccessionCivilContext,
  deceased: SuccessionDeceasedSide,
): string | undefined {
  return deceased === 'epoux1' ? civil.dateNaissanceEpoux2 : civil.dateNaissanceEpoux1;
}

function computeStep1Split(
  civil: SuccessionCivilContext,
  firstEstate: number,
  nbEnfants: number,
  deceased: SuccessionDeceasedSide,
  patrimonial?: Pick<SuccessionPatrimonialContext, 'donationEntreEpouxActive' | 'donationEntreEpouxOption'>,
): { conjointPart: number; enfantsPart: number; carryOverToStep2: number; warnings: string[] } {
  if (civil.situationMatrimoniale !== 'marie') {
    return { conjointPart: 0, enfantsPart: firstEstate, carryOverToStep2: 0, warnings: [] };
  }
  if (nbEnfants <= 0) {
    return { conjointPart: firstEstate, enfantsPart: 0, carryOverToStep2: firstEstate, warnings: [] };
  }

  const warnings: string[] = [];
  const fallback = {
    conjointPart: firstEstate * 0.25,
    enfantsPart: firstEstate * 0.75,
    carryOverToStep2: firstEstate * 0.25,
  };

  if (!patrimonial?.donationEntreEpouxActive) {
    warnings.push('Hypothese simplifiee: part du conjoint au 1er deces fixee a 1/4 en pleine propriete.');
    return { ...fallback, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_quotite') {
    const spousePart = firstEstate * getQuotiteDisponibleRatio(nbEnfants);
    return {
      conjointPart: spousePart,
      enfantsPart: Math.max(0, firstEstate - spousePart),
      carryOverToStep2: spousePart,
      warnings: ['Donation entre epoux: quotite disponible en pleine propriete retenue pour le conjoint survivant.'],
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
    return {
      conjointPart: firstEstate,
      enfantsPart: 0,
      carryOverToStep2: firstEstate,
      warnings: ['Donation entre epoux: totalite en pleine propriete retenue dans le module simplifie, sous reserve de reduction civile.'],
    };
  }

  const spouseBirthDate = getSurvivingSpouseBirthDate(civil, deceased);
  if (!spouseBirthDate) {
    warnings.push('Donation entre epoux avec usufruit: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propriete.');
    return { ...fallback, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'usufruit_total') {
    const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, firstEstate);
    if (!valuation) {
      warnings.push('Donation entre epoux en usufruit total: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriete.');
      return { ...fallback, warnings };
    }
    warnings.push(`Donation entre epoux: usufruit total valorise selon l'art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}%).`);
    return {
      conjointPart: valuation.valeurUsufruit,
      enfantsPart: valuation.valeurNuePropriete,
      carryOverToStep2: 0,
      warnings,
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'mixte') {
    const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, firstEstate * 0.75);
    if (!valuation) {
      warnings.push('Donation entre epoux mixte: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriete.');
      return { ...fallback, warnings };
    }
    warnings.push(`Donation entre epoux mixte: 1/4 en pleine propriete + usufruit des 3/4 valorise selon l'art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}% sur la part demembree).`);
    return {
      conjointPart: (firstEstate * 0.25) + valuation.valeurUsufruit,
      enfantsPart: valuation.valeurNuePropriete,
      carryOverToStep2: firstEstate * 0.25,
      warnings,
    };
  }

  return { ...fallback, warnings };
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

function buildDetailedDescendantHeirs(
  actifTransmis: number,
  deceased: SuccessionDeceasedSide,
  nbBranches: number,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
): DetailedChainHeir[] {
  if (nbBranches <= 0 || actifTransmis <= 0) return [];

  const recipients = buildSuccessionDescendantRecipientsForDeceased(enfantsContext, familyMembers, deceased);
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
        }));
      });
    })();
}

function mergeDetailedHeirs(heirs: DetailedChainHeir[]): DetailedChainHeir[] {
  const merged = new Map<string, DetailedChainHeir>();
  heirs.forEach((heir) => {
    if (heir.partSuccession <= 0) return;
    const current = merged.get(heir.id);
    if (current) {
      current.partSuccession += heir.partSuccession;
      current.exonerated = current.exonerated || heir.exonerated;
      return;
    }
    merged.set(heir.id, { ...heir });
  });
  return Array.from(merged.values());
}

function computeTransmissionForHeirs(
  actifTransmis: number,
  detailedHeirs: DetailedChainHeir[],
  dmtgSettings: DmtgSettings,
): { droits: number; beneficiaries: SuccessionChainBeneficiary[] } {
  if (actifTransmis <= 0 || detailedHeirs.length === 0) {
    return { droits: 0, beneficiaries: [] };
  }

  const result = calculateSuccession({
    actifNetSuccession: actifTransmis,
    heritiers: detailedHeirs.map((heir) => ({
      lien: heir.lien,
      partSuccession: heir.partSuccession,
    })),
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
    input.enfantsContext ?? [],
    input.familyMembers ?? [],
  );
  const detailedHeirs = mergeDetailedHeirs([
    ...legalPartnerHeirs,
    ...testamentHeirs,
    ...detailedDescendantHeirs,
  ]);
  const transmission = computeTransmissionForHeirs(estateAmount, detailedHeirs, input.dmtgSettings);
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
  const warnings: string[] = [];

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
    firstEstate,
    nbEnfants,
    input.order,
    input.patrimonial,
  );
  warnings.push(...step1Split.warnings);
  const step1Details = computeStepTransmission(
    input,
    firstEstate,
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
  const step2Estate = survivorBase + step1Split.carryOverToStep2 + step1Details.carryOverToStep2;
  const step2Details = computeStepTransmission(
    input,
    step2Estate,
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

  return {
    applicable: true,
    order: input.order,
    firstDecedeLabel: input.order === 'epoux1' ? 'Epoux 1' : 'Epoux 2',
    secondDecedeLabel: input.order === 'epoux1' ? 'Epoux 2' : 'Epoux 1',
    step1: {
      actifTransmis: firstEstate,
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
