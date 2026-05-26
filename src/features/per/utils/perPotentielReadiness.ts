import type { DeclarantRevenus, PerPotentielResult } from '@/engine/per';
import { hasAvisIrDeclarant } from './perAvisIrPlafonds';
import type { PerPotentielState } from './perPotentielState';

const DECLARANT_AMOUNT_KEYS = [
  'salaires',
  'fraisReelsMontant',
  'art62',
  'bic',
  'retraites',
  'fonciersNets',
  'autresRevenus',
  'cotisationsPer163Q',
  'cotisationsPerp',
  'cotisationsArt83',
  'cotisationsMadelin154bis',
  'cotisationsMadelinRetraite',
  'abondementPerco',
  'cotisationsPrevo',
] as const satisfies readonly (keyof DeclarantRevenus)[];

function hasDeclarantAmount(declarant: DeclarantRevenus): boolean {
  return DECLARANT_AMOUNT_KEYS.some((key) => Number(declarant[key] ?? 0) > 0);
}

export function hasPerPotentielSynthesisReady(
  state: PerPotentielState,
  result: PerPotentielResult | null,
): boolean {
  if (!state.mode || !result) return false;
  if (hasAvisIrDeclarant(state.avisIr) || hasAvisIrDeclarant(state.avisIr2)) return true;
  if (state.versementEnvisage > 0) return true;

  return (
    hasDeclarantAmount(state.revenusN1Declarant1) ||
    hasDeclarantAmount(state.revenusN1Declarant2) ||
    hasDeclarantAmount(state.projectionNDeclarant1) ||
    hasDeclarantAmount(state.projectionNDeclarant2)
  );
}
