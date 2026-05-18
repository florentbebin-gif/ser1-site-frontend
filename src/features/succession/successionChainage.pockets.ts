import type { SuccessionCivilContext } from './successionDraft';
import { getSuccessionSharedPocketForContext } from './successionPatrimonialModel';
import {
  createEmptyPocketScales,
  type SuccessionEstatePocketScales,
  type SuccessionEstateTaxableBasis,
} from './successionTransmissionBasis';
import type { SuccessionChainOrder, SuccessionChainRegime } from './successionChainage.types';
import { getOtherSide } from './successionChainage.amounts';

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

export function createEmptyEstateTaxableBasis(): SuccessionEstateTaxableBasis {
  return {
    ordinaryNetBeforeForfait: 0,
    groupementEntries: [],
    residencePrincipaleValeur: 0,
  };
}
