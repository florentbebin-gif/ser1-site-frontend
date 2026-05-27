import { useMemo } from 'react';
import { buildSuccessionAvFiscalAnalysis } from '../successionAssuranceVieFiscal';
import { buildSuccessionSurvivorEconomicInflows } from '../successionInsuranceInflows';
import { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import type { SuccessionFiscalSnapshot } from '../successionFiscalContext';
import type {
  FamilyMember,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionEnfant,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from '../successionDraft';
import { buildSuccessionPrevoyanceRegimeByEntry } from './useSuccessionDerivedValues.helpers';

interface UseSuccessionProtectionFiscalAnalysesInput {
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  civilContext: SuccessionCivilContext;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  fiscalSnapshot: SuccessionFiscalSnapshot;
  simulatedDeathDate: Date;
}

export function useSuccessionProtectionFiscalAnalyses({
  assuranceVieEntries,
  perEntries,
  prevoyanceDecesEntries,
  civilContext,
  enfantsContext,
  familyMembers,
  fiscalSnapshot,
  simulatedDeathDate,
}: UseSuccessionProtectionFiscalAnalysesInput) {
  const rawAvFiscalAnalysis = useMemo(
    () =>
      buildSuccessionAvFiscalAnalysis(
        assuranceVieEntries,
        civilContext,
        enfantsContext,
        familyMembers,
        fiscalSnapshot,
      ),
    [assuranceVieEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot],
  );

  const rawPerFiscalAnalysis = useMemo(
    () =>
      buildSuccessionPerFiscalAnalysis(
        perEntries,
        civilContext,
        enfantsContext,
        familyMembers,
        fiscalSnapshot,
        simulatedDeathDate,
      ),
    [perEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot, simulatedDeathDate],
  );

  const rawPrevoyanceFiscalAnalysis = useMemo(
    () =>
      buildSuccessionPrevoyanceFiscalAnalysis(
        prevoyanceDecesEntries,
        civilContext,
        enfantsContext,
        familyMembers,
        fiscalSnapshot,
        simulatedDeathDate,
      ),
    [
      prevoyanceDecesEntries,
      civilContext,
      enfantsContext,
      familyMembers,
      fiscalSnapshot,
      simulatedDeathDate,
    ],
  );

  const prevoyanceRegimeByEntry = useMemo(
    () =>
      buildSuccessionPrevoyanceRegimeByEntry(
        prevoyanceDecesEntries,
        civilContext,
        simulatedDeathDate,
        fiscalSnapshot.avDeces.agePivotPrimes,
      ),
    [
      prevoyanceDecesEntries,
      civilContext,
      simulatedDeathDate,
      fiscalSnapshot.avDeces.agePivotPrimes,
    ],
  );

  const survivorEconomicInflows = useMemo(
    () =>
      buildSuccessionSurvivorEconomicInflows({
        avFiscalAnalysis: rawAvFiscalAnalysis,
        perFiscalAnalysis: rawPerFiscalAnalysis,
        prevoyanceFiscalAnalysis: rawPrevoyanceFiscalAnalysis,
      }),
    [rawAvFiscalAnalysis, rawPerFiscalAnalysis, rawPrevoyanceFiscalAnalysis],
  );

  return {
    rawAvFiscalAnalysis,
    rawPerFiscalAnalysis,
    rawPrevoyanceFiscalAnalysis,
    prevoyanceRegimeByEntry,
    survivorEconomicInflows,
  };
}
