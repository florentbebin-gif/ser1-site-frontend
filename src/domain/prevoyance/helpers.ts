import type {
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
  PrevoyanceTranches,
} from './types';
import { annualValueFromAmountRule, normalizeRegimeStack } from './coverageShared';
import { PREVOYANCE_MAX_ARRET_DURATION_DAYS } from './constants';

export const SALAIRE_NET_BRUT_ESTIMATION_RATE = 0.8;

const TB_PASS_MULTIPLE = 4;
const TC_PASS_MULTIPLE = 8;

export function estimateSalaireNetFromBrut(salaireBrutAnnuel: number): number {
  return Math.round(Math.max(0, salaireBrutAnnuel) * SALAIRE_NET_BRUT_ESTIMATION_RATE);
}

export function deriveContractKindFromRegime(
  regime: Pick<PrevoyanceRegimeSettings, 'population' | 'defaultContractKind'> | null | undefined,
): PrevoyanceContractKind {
  if (!regime) return 'individuel';
  if (regime.defaultContractKind) return regime.defaultContractKind;
  return regime.population === 'salarie' ? 'collectif' : 'individuel';
}

export function resolveRegimeStack(
  selectedRegime: PrevoyanceRegimeSettings | null | undefined,
  allRegimes: PrevoyanceRegimeSettings[],
): PrevoyanceRegimeSettings[] {
  if (!selectedRegime) return [];
  const componentCodes = selectedRegime.data.composition?.componentCodes ?? [];
  if (componentCodes.length === 0) return [selectedRegime];

  const byCode = new Map(allRegimes.map((regime) => [regime.code, regime]));
  const stack = componentCodes
    .map((code) => byCode.get(code) ?? (code === selectedRegime.code ? selectedRegime : null))
    .filter((regime): regime is PrevoyanceRegimeSettings => regime !== null);

  return normalizeRegimeStack(stack.length ? stack : [selectedRegime]);
}

export function computeTranchesFromPass(
  salaireBrutAnnuel: number,
  pass: number,
): PrevoyanceTranches {
  const salaire = Math.max(0, salaireBrutAnnuel);
  const plafond = Math.max(0, pass);
  const trancheA = Math.min(salaire, plafond);
  const trancheB = Math.max(0, Math.min(salaire, plafond * TB_PASS_MULTIPLE) - plafond);
  const trancheC = Math.max(
    0,
    Math.min(salaire, plafond * TC_PASS_MULTIPLE) - plafond * TB_PASS_MULTIPLE,
  );

  return {
    ta: trancheA,
    tb: trancheB,
    tc: trancheC,
    totalRetenu: trancheA + trancheB + trancheC,
  };
}

export function capArretDuration(days: number): number {
  return Math.min(Math.max(0, days), PREVOYANCE_MAX_ARRET_DURATION_DAYS);
}

export function selectMaintienEmployeurPalier(
  ancienneteYears: number,
  settings: PrevoyanceMaintienEmployeurSettings | null | undefined,
) {
  const maintien = settings?.data.maintienEmployeur;
  if (!maintien || ancienneteYears < maintien.minAncienneteYears) return null;

  return (
    maintien.paliers
      .map((palier) => ({ ...palier, carenceDays: maintien.carenceDays }))
      .find((palier) => {
        const afterStart = ancienneteYears >= palier.fromAncienneteYears;
        const beforeEnd =
          palier.toAncienneteYears === null || ancienneteYears <= palier.toAncienneteYears;
        return afterStart && beforeEnd;
      }) ?? null
  );
}

export function computeCollectiveAssietteBase(
  assiette: 'TA' | 'TA-TB' | 'TA-TB-TC',
  tranches: PrevoyanceTranches,
): number {
  if (assiette === 'TA') return tranches.ta;
  if (assiette === 'TA-TB') return tranches.ta + tranches.tb;
  return tranches.ta + tranches.tb + tranches.tc;
}

export function computeDecesCapitalFromContract(
  contract: PrevoyanceContractDraft,
  annualBase: number,
): number {
  if (contract.kind === 'individuel') return contract.deces.capital;
  return Math.round(Math.max(0, annualBase) * (Math.max(0, contract.deces.salairePct) / 100));
}

export function computeRegimeDecesCapital(
  regimeStack: PrevoyanceRegimeSettings[] | null | undefined,
  referenceAnnual: number,
  salaireBrutAnnuel: number,
): number {
  return normalizeRegimeStack(regimeStack).reduce(
    (sum, regime) =>
      sum +
      annualValueFromAmountRule(regime.data.deces.capital, referenceAnnual, salaireBrutAnnuel),
    0,
  );
}

export function clampContractCount<T>(contracts: T[]): T[] {
  return contracts.slice(0, 3);
}

export { PREVOYANCE_MAX_ARRET_DURATION_DAYS } from './constants';
export {
  buildArretCoverageBars,
  buildArretEuroChart,
  findArretPalierForRange,
  splitIntoSubPeriods,
  unionBoundaries,
  type PrevoyanceArretEuroChart,
  type PrevoyanceArretEuroPeriod,
  type PrevoyanceRangeLike,
} from './arretCoverage';
export {
  buildInvaliditeCoverageBars,
  buildInvaliditePctChart,
  type PrevoyanceInvaliditePctChart,
  type PrevoyanceInvaliditePctPalier,
} from './invaliditeCoverage';
export {
  computeInvaliditePalierAmount,
  type PrevoyanceCoverageBar,
  type PrevoyanceCoverageSegment,
  type PrevoyanceCoverageSegmentKind,
} from './coverageShared';
