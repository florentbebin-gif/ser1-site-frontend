import type { DmtgSettings } from '../../engine/civil';
import { calculateSuccession } from '../../engine/succession';
import type { SuccessionCivilContext, SuccessionLiquidationContext } from './successionDraft';

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

  // communaute_legale
  return (order === 'epoux1' ? actifEpoux1 : actifEpoux2) + (actifCommun / 2);
}

function computeConjointShareRatio(civil: SuccessionCivilContext, nbEnfants: number): number {
  if (civil.situationMatrimoniale === 'marie') {
    return nbEnfants > 0 ? 0.25 : 1;
  }
  return 0;
}

function computeChildrenRights(actifTransmis: number, nbEnfants: number, dmtgSettings: DmtgSettings): number {
  if (nbEnfants <= 0 || actifTransmis <= 0) return 0;

  const part = actifTransmis / nbEnfants;
  const heritiers = Array.from({ length: nbEnfants }, () => ({
    lien: 'enfant' as const,
    partSuccession: part,
  }));

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
  const nbEnfants = asChildrenCount(input.liquidation.nbEnfants);
  const totalPatrimoine =
    asAmount(input.liquidation.actifEpoux1)
    + asAmount(input.liquidation.actifEpoux2)
    + asAmount(input.liquidation.actifCommun);

  if (!input.regimeUsed) {
    return buildEmptyAnalysis(input.order, 'Chaînage disponible pour couples mariés/pacsés avec régime de liquidation.');
  }

  const firstEstate = computeFirstEstate(input.regimeUsed, input.order, input.liquidation);
  const survivorBase = Math.max(0, totalPatrimoine - firstEstate);
  const conjointShareRatio = computeConjointShareRatio(input.civil, nbEnfants);
  const warnings: string[] = [];

  if (nbEnfants <= 0) {
    warnings.push('Aucun enfant déclaré: les droits descendants des étapes 1/2 sont nuls dans ce module.');
  }
  if (input.civil.situationMatrimoniale === 'pacse') {
    warnings.push('PACS: hypothèse simplifiée sans transmission automatique au partenaire (testament non modélisé ici).');
  }
  if (input.civil.situationMatrimoniale === 'marie' && nbEnfants > 0) {
    warnings.push('Hypothèse simplifiée: part du conjoint au 1er décès fixée à 1/4 en pleine propriété.');
  }
  warnings.push('Module de chaînage simplifié: liquidation notariale fine et options civiles avancées non modélisées.');

  const step1ConjointPart = firstEstate * conjointShareRatio;
  const step1EnfantsPart = Math.max(0, firstEstate - step1ConjointPart);
  const step1DroitsEnfants = computeChildrenRights(step1EnfantsPart, nbEnfants, input.dmtgSettings);

  const step2Estate = survivorBase + step1ConjointPart;
  const step2ConjointPart = 0;
  const step2EnfantsPart = step2Estate;
  const step2DroitsEnfants = computeChildrenRights(step2EnfantsPart, nbEnfants, input.dmtgSettings);

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

