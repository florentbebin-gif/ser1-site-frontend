import type { DmtgSettings } from '../../engine/civil';
import { calculateSuccession, type LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
} from './successionDraft';
import {
  buildSuccessionDescendantRecipients,
  buildSuccessionDescendantRecipientsForDeceased,
  countEffectiveDescendantBranches,
  countEffectiveDescendantBranchesForDeceased,
  type SuccessionDeceasedSide,
} from './successionEnfants';
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
  lien: Extract<LienParente, 'enfant' | 'petit_enfant'>;
  brut: number;
  droits: number;
  net: number;
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
    warnings.push('Hypothèse simplifiée: part du conjoint au 1er décès fixée à 1/4 en pleine propriété.');
    return { ...fallback, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_quotite') {
    const spousePart = firstEstate * getQuotiteDisponibleRatio(nbEnfants);
    return {
      conjointPart: spousePart,
      enfantsPart: Math.max(0, firstEstate - spousePart),
      carryOverToStep2: spousePart,
      warnings: ['Donation entre époux: quotité disponible en pleine propriété retenue pour le conjoint survivant.'],
    };
  }

  if (patrimonial.donationEntreEpouxOption === 'pleine_propriete_totale') {
    return {
      conjointPart: firstEstate,
      enfantsPart: 0,
      carryOverToStep2: firstEstate,
      warnings: ['Donation entre époux: totalité en pleine propriété retenue dans le module simplifié, sous réserve de réduction civile.'],
    };
  }

  const spouseBirthDate = getSurvivingSpouseBirthDate(civil, deceased);
  if (!spouseBirthDate) {
    warnings.push('Donation entre époux avec usufruit: date de naissance du conjoint survivant manquante, repli moteur sur 1/4 en pleine propriété.');
    return { ...fallback, warnings };
  }

  if (patrimonial.donationEntreEpouxOption === 'usufruit_total') {
    const valuation = getUsufruitValuationFromBirthDate(spouseBirthDate, firstEstate);
    if (!valuation) {
      warnings.push('Donation entre époux en usufruit total: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriété.');
      return { ...fallback, warnings };
    }
    warnings.push(`Donation entre époux: usufruit total valorisé selon l’art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}%).`);
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
      warnings.push('Donation entre époux mixte: valorisation art. 669 CGI impossible, repli moteur sur 1/4 en pleine propriété.');
      return { ...fallback, warnings };
    }
    warnings.push(`Donation entre époux mixte: 1/4 en pleine propriété + usufruit des 3/4 valorisé selon l’art. 669 CGI (usufruitier ${valuation.age} ans, usufruit ${Math.round(valuation.tauxUsufruit * 100)}% sur la part démembrée).`);
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
): Array<{ id: string; label: string; lien: 'enfant'; partSuccession: number }> {
  if (nbBranches <= 0 || actifTransmis <= 0) return [];
  const part = actifTransmis / nbBranches;
  return Array.from({ length: nbBranches }, (_, index) => ({
    id: `desc-${index + 1}`,
    label: `Enfant ${index + 1}`,
    lien: 'enfant' as const,
    partSuccession: part,
  }));
}

function computeChildrenTransmission(
  actifTransmis: number,
  deceased: SuccessionDeceasedSide,
  nbBranches: number,
  dmtgSettings: DmtgSettings,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
): { droits: number; beneficiaries: SuccessionChainBeneficiary[] } {
  if (nbBranches <= 0 || actifTransmis <= 0) {
    return { droits: 0, beneficiaries: [] };
  }

  const recipients = buildSuccessionDescendantRecipientsForDeceased(enfantsContext, familyMembers, deceased);
  const branchCount = Math.max(1, countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, deceased));
  const detailedHeirs = recipients.length === 0
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
  return side === 'epoux1' ? 'Époux 1' : 'Époux 2';
}

function getStepWarnings(
  stepLabel: string,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
  deceased: SuccessionDeceasedSide,
): string[] {
  const branchCount = countEffectiveDescendantBranchesForDeceased(enfantsContext, familyMembers, deceased);
  if (branchCount > 0) return [];
  const allRecipients = buildSuccessionDescendantRecipients(enfantsContext, familyMembers);
  if (allRecipients.length === 0) return [];
  return [`${stepLabel}: aucun descendant du défunt de cette étape n'est éligible dans la branche retenue.`];
}

function buildEmptyAnalysis(order: SuccessionChainOrder, warning: string): SuccessionChainageAnalysis {
  return {
    applicable: false,
    order,
    firstDecedeLabel: order === 'epoux1' ? 'Époux 1' : 'Époux 2',
    secondDecedeLabel: order === 'epoux1' ? 'Époux 2' : 'Époux 1',
    step1: null,
    step2: null,
    totalDroits: 0,
    warnings: [warning],
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
    return buildEmptyAnalysis(input.order, 'Chaînage disponible pour couples mariés/pacsés avec régime de liquidation.');
  }

  const attributionPct = input.attributionBiensCommunsPct ?? 50;
  const firstEstate = computeFirstEstate(input.regimeUsed, input.order, input.liquidation, attributionPct);
  const survivorBase = Math.max(0, totalPatrimoine - firstEstate);
  const warnings: string[] = [];

  if (attributionPct !== 50 && input.regimeUsed === 'communaute_legale') {
    warnings.push(`Attribution des biens communs au survivant: ${attributionPct} % appliqué au partage communautaire.`);
  }
  if (nbEnfants <= 0) {
    warnings.push('Aucun enfant déclaré: les droits descendants des étapes 1/2 sont nuls dans ce module.');
  }
  if (input.civil.situationMatrimoniale === 'pacse') {
    warnings.push('PACS: hypothèse simplifiée sans transmission automatique au partenaire (testament non modélisé ici).');
  }
  if (hasRepresentationOnAnySide(enfantsContext, familyMembers)) {
    warnings.push('Chaînage: représentation successorale simplifiée prise en compte pour les petits-enfants déclarés.');
  }
  warnings.push('Module de chaînage simplifié: liquidation notariale fine et options civiles avancées non modélisées.');

  const step1Split = computeStep1Split(
    input.civil,
    firstEstate,
    nbEnfants,
    input.order,
    input.patrimonial,
  );
  warnings.push(...step1Split.warnings);
  const step1ConjointPart = step1Split.conjointPart;
  const step1EnfantsPart = step1Split.enfantsPart;
  const step1Transmission = computeChildrenTransmission(
    step1EnfantsPart,
    input.order,
    nbEnfants,
    input.dmtgSettings,
    enfantsContext,
    familyMembers,
  );
  warnings.push(...getStepWarnings(`Étape 1 (${getLabelForSide(input.order)})`, enfantsContext, familyMembers, input.order));

  const step2Estate = survivorBase + step1Split.carryOverToStep2;
  const step2ConjointPart = 0;
  const step2EnfantsPart = step2Estate;
  const otherSide = getOtherSide(input.order);
  const step2Transmission = computeChildrenTransmission(
    step2EnfantsPart,
    otherSide,
    nbEnfants,
    input.dmtgSettings,
    enfantsContext,
    familyMembers,
  );
  warnings.push(...getStepWarnings(`Étape 2 (${getLabelForSide(otherSide)})`, enfantsContext, familyMembers, otherSide));

  return {
    applicable: true,
    order: input.order,
    firstDecedeLabel: input.order === 'epoux1' ? 'Époux 1' : 'Époux 2',
    secondDecedeLabel: input.order === 'epoux1' ? 'Époux 2' : 'Époux 1',
    step1: {
      actifTransmis: firstEstate,
      partConjoint: step1ConjointPart,
      partEnfants: step1EnfantsPart,
      droitsConjoint: 0,
      droitsEnfants: step1Transmission.droits,
      beneficiaries: step1Transmission.beneficiaries,
    },
    step2: {
      actifTransmis: step2Estate,
      partConjoint: step2ConjointPart,
      partEnfants: step2EnfantsPart,
      droitsConjoint: 0,
      droitsEnfants: step2Transmission.droits,
      beneficiaries: step2Transmission.beneficiaries,
    },
    totalDroits: step1Transmission.droits + step2Transmission.droits,
    warnings,
  };
}
