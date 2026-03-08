import type { DmtgSettings } from '../../engine/civil';
import { calculateSuccession } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionLiquidationContext,
} from './successionDraft';
import { buildSuccessionDescendantRecipients, countEffectiveDescendantBranches } from './successionEnfants';

export type SuccessionChainOrder = 'epoux1' | 'epoux2';
export type SuccessionChainRegime = 'communaute_legale' | 'separation_biens' | 'communaute_universelle';

export interface SuccessionChainStep {
  actifTransmis: number;
  partConjoint: number;
  partEnfants: number;
  droitsConjoint: number;
  droitsEnfants: number;
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

function computeConjointShareRatio(civil: SuccessionCivilContext, nbEnfants: number): number {
  if (civil.situationMatrimoniale === 'marie') {
    return nbEnfants > 0 ? 0.25 : 1;
  }
  return 0;
}

function computeChildrenRights(
  actifTransmis: number,
  nbBranches: number,
  dmtgSettings: DmtgSettings,
  enfantsContext: SuccessionEnfant[] = [],
  familyMembers: FamilyMember[] = [],
): number {
  if (nbBranches <= 0 || actifTransmis <= 0) return 0;

  const recipients = buildSuccessionDescendantRecipients(enfantsContext, familyMembers);
  if (recipients.length === 0) {
    const part = actifTransmis / nbBranches;
    const heritiers = Array.from({ length: nbBranches }, () => ({
      lien: 'enfant' as const,
      partSuccession: part,
    }));

    return calculateSuccession({
      actifNetSuccession: actifTransmis,
      heritiers,
      dmtgSettings,
    }).result.totalDroits;
  }

  const branchCount = Math.max(1, countEffectiveDescendantBranches(enfantsContext, familyMembers));
  const partParBranche = actifTransmis / branchCount;
  const recipientsByBranch = recipients.reduce((map, recipient) => {
    const branchRecipients = map.get(recipient.branchId) ?? [];
    branchRecipients.push(recipient);
    map.set(recipient.branchId, branchRecipients);
    return map;
  }, new Map<string, typeof recipients>());

  const heritiers = Array.from(recipientsByBranch.values()).flatMap((branchRecipients) => {
    const partParRecipient = partParBranche / branchRecipients.length;
    return branchRecipients.map((recipient) => ({
      lien: recipient.lien,
      partSuccession: partParRecipient,
    }));
  });

  return calculateSuccession({
    actifNetSuccession: actifTransmis,
    heritiers,
    dmtgSettings,
  }).result.totalDroits;
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
  const conjointShareRatio = computeConjointShareRatio(input.civil, nbEnfants);
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
  if (input.civil.situationMatrimoniale === 'marie' && nbEnfants > 0) {
    warnings.push('Hypothèse simplifiée: part du conjoint au 1er décès fixée à 1/4 en pleine propriété.');
  }
  if (buildSuccessionDescendantRecipients(enfantsContext, familyMembers).some((recipient) => recipient.lien === 'petit_enfant')) {
    warnings.push('Chaînage: représentation successorale simplifiée prise en compte pour les petits-enfants déclarés.');
  }
  warnings.push('Module de chaînage simplifié: liquidation notariale fine et options civiles avancées non modélisées.');

  const step1ConjointPart = firstEstate * conjointShareRatio;
  const step1EnfantsPart = Math.max(0, firstEstate - step1ConjointPart);
  const step1DroitsEnfants = computeChildrenRights(
    step1EnfantsPart,
    nbEnfants,
    input.dmtgSettings,
    enfantsContext,
    familyMembers,
  );

  const step2Estate = survivorBase + step1ConjointPart;
  const step2ConjointPart = 0;
  const step2EnfantsPart = step2Estate;
  const step2DroitsEnfants = computeChildrenRights(
    step2EnfantsPart,
    nbEnfants,
    input.dmtgSettings,
    enfantsContext,
    familyMembers,
  );

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
      droitsEnfants: step1DroitsEnfants,
    },
    step2: {
      actifTransmis: step2Estate,
      partConjoint: step2ConjointPart,
      partEnfants: step2EnfantsPart,
      droitsConjoint: 0,
      droitsEnfants: step2DroitsEnfants,
    },
    totalDroits: step1DroitsEnfants + step2DroitsEnfants,
    warnings,
  };
}
