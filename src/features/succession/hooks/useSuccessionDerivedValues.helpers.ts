import type { SuccessionChainageAnalysis } from '../successionChainage';
import {
  extractEstateAllowanceUsage,
  type EstateAllowanceUsage,
} from '../successionDeathInsuranceAllowances';
import type { SuccessionFiscalSnapshot } from '../successionFiscalContext';
import {
  isSuccessionSocieteAcquetsRegime,
  type FamilyMember,
  type SuccessionCivilContext,
  type SuccessionEnfant,
  type SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import {
  getSuccessionPrevoyanceRegimeInfo,
  type SuccessionPrevoyanceRegimeInfo,
} from '../successionPrevoyanceFiscal';
import {
  hasComputableSuccessionFiliation,
  hasRequiredBirthDatesForSituation,
  isCoupleSituation,
} from '../successionSimulator.helpers';

export interface SuccessionSituationFlags {
  isMarried: boolean;
  isPacsed: boolean;
  isConcubinage: boolean;
  isCouple: boolean;
  hasComputableFiliation: boolean;
  hasRequiredBirthDatesForCurrentSituation: boolean;
  shouldRenderSuccessionComputationSections: boolean;
  isCommunityRegime: boolean;
  isPacsIndivision: boolean;
  showSharedTransmissionPct: boolean;
  showDonationEntreEpoux: boolean;
  isSocieteAcquetsRegime: boolean;
  isParticipationAcquetsRegime: boolean;
}

type PrevoyanceRegimeEntrySummary = Pick<SuccessionPrevoyanceRegimeInfo, 'regimeLabel' | 'warning'>;

export function buildSuccessionSituationFlags(
  civilContext: SuccessionCivilContext,
  enfantsContext: SuccessionEnfant[],
  familyMembers: FamilyMember[],
): SuccessionSituationFlags {
  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isPacsed = civilContext.situationMatrimoniale === 'pacse';
  const isConcubinage = civilContext.situationMatrimoniale === 'concubinage';
  const isCouple = isCoupleSituation(civilContext.situationMatrimoniale);
  const hasComputableFiliation = hasComputableSuccessionFiliation(
    civilContext.situationMatrimoniale,
    enfantsContext,
    familyMembers,
  );
  const hasRequiredBirthDatesForCurrentSituation = hasRequiredBirthDatesForSituation(
    civilContext.situationMatrimoniale,
    civilContext.dateNaissanceEpoux1,
    civilContext.dateNaissanceEpoux2,
  );
  const shouldRenderSuccessionComputationSections = hasComputableFiliation
    && hasRequiredBirthDatesForCurrentSituation;
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );
  const isPacsIndivision = isPacsed && civilContext.pacsConvention === 'indivision';

  return {
    isMarried,
    isPacsed,
    isConcubinage,
    isCouple,
    hasComputableFiliation,
    hasRequiredBirthDatesForCurrentSituation,
    shouldRenderSuccessionComputationSections,
    isCommunityRegime,
    isPacsIndivision,
    showSharedTransmissionPct: isCommunityRegime || isPacsIndivision,
    showDonationEntreEpoux: isMarried,
    isSocieteAcquetsRegime: isSuccessionSocieteAcquetsRegime({
      situationMatrimoniale: civilContext.situationMatrimoniale,
      regimeMatrimonial: civilContext.regimeMatrimonial,
      pacsConvention: civilContext.pacsConvention,
    }),
    isParticipationAcquetsRegime:
      isMarried && civilContext.regimeMatrimonial === 'participation_acquets',
  };
}

export function buildSuccessionPrevoyanceRegimeByEntry(
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[],
  civilContext: SuccessionCivilContext,
  simulatedDeathDate: Date,
  agePivotPrimes: number,
): Record<string, PrevoyanceRegimeEntrySummary> {
  return Object.fromEntries(
    prevoyanceDecesEntries.map((entry) => {
      const regimeInfo = getSuccessionPrevoyanceRegimeInfo(
        entry,
        civilContext,
        simulatedDeathDate,
        agePivotPrimes,
      );

      return [entry.id, {
        regimeLabel: regimeInfo.regimeLabel,
        warning: regimeInfo.warning,
      }];
    }),
  );
}

export function buildEstateAllowanceUsageBySide(
  chainageAnalysis: SuccessionChainageAnalysis,
  dmtgSettings: SuccessionFiscalSnapshot['dmtgSettings'],
): Partial<Record<'epoux1' | 'epoux2', EstateAllowanceUsage>> | undefined {
  if (!chainageAnalysis.applicable) return undefined;

  const step1Side = chainageAnalysis.order;
  const step2Side = step1Side === 'epoux1' ? 'epoux2' : 'epoux1';

  return {
    [step1Side]: extractEstateAllowanceUsage(
      chainageAnalysis.step1?.beneficiaries ?? [],
      dmtgSettings,
    ),
    [step2Side]: extractEstateAllowanceUsage(
      chainageAnalysis.step2?.beneficiaries ?? [],
      dmtgSettings,
    ),
  };
}
