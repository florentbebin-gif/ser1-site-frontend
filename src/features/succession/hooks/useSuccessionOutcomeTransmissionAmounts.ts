import { useMemo } from 'react';
import type { buildSuccessionChainageAnalysis } from '../successionChainage';
import type { buildSuccessionDirectDisplayAnalysis } from '../successionDisplay';
import type { SuccessionPrimarySide } from '../successionDraft';

interface UseSuccessionOutcomeTransmissionAmountsInput {
  shouldRenderSuccessionComputationSections: boolean;
  displayUsesChainage: boolean;
  displayActifNetSuccession: number;
  chainageAnalysis: ReturnType<typeof buildSuccessionChainageAnalysis>;
  directDisplayAnalysis: ReturnType<typeof buildSuccessionDirectDisplayAnalysis>;
  assuranceVieByAssure: Record<SuccessionPrimarySide, number>;
  perByAssure: Record<SuccessionPrimarySide, number>;
  prevoyanceByAssure: Record<SuccessionPrimarySide, number>;
}

export function useSuccessionOutcomeTransmissionAmounts({
  shouldRenderSuccessionComputationSections,
  displayUsesChainage,
  displayActifNetSuccession,
  chainageAnalysis,
  directDisplayAnalysis,
  assuranceVieByAssure,
  perByAssure,
  prevoyanceByAssure,
}: UseSuccessionOutcomeTransmissionAmountsInput) {
  const displayAssuranceVieTransmise = useMemo(() => {
    if (displayUsesChainage) return assuranceVieByAssure[chainageAnalysis.order];
    return assuranceVieByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    assuranceVieByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const displayPerTransmis = useMemo(() => {
    if (displayUsesChainage) return perByAssure[chainageAnalysis.order];
    return perByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    perByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const displayPrevoyanceTransmise = useMemo(() => {
    if (displayUsesChainage) return prevoyanceByAssure[chainageAnalysis.order];
    return prevoyanceByAssure[directDisplayAnalysis.simulatedDeceased];
  }, [
    prevoyanceByAssure,
    chainageAnalysis.order,
    directDisplayAnalysis.simulatedDeceased,
    displayUsesChainage,
  ]);

  const derivedMasseSuccessorale = useMemo(
    () => (shouldRenderSuccessionComputationSections ? displayActifNetSuccession : 0),
    [shouldRenderSuccessionComputationSections, displayActifNetSuccession],
  );

  const derivedCapitauxHorsSuccession = useMemo(
    () =>
      shouldRenderSuccessionComputationSections
        ? displayAssuranceVieTransmise + displayPerTransmis + displayPrevoyanceTransmise
        : 0,
    [
      shouldRenderSuccessionComputationSections,
      displayAssuranceVieTransmise,
      displayPerTransmis,
      displayPrevoyanceTransmise,
    ],
  );

  const synthDonutTransmis = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return 0;
    if (displayUsesChainage) {
      const step1 = chainageAnalysis.step1;
      const step2 = chainageAnalysis.step2;
      if (!step1 || !step2) return derivedMasseSuccessorale + derivedCapitauxHorsSuccession;
      return (
        step1.actifTransmis +
        step2.actifTransmis +
        assuranceVieByAssure.epoux1 +
        assuranceVieByAssure.epoux2 +
        perByAssure.epoux1 +
        perByAssure.epoux2 +
        prevoyanceByAssure.epoux1 +
        prevoyanceByAssure.epoux2
      );
    }
    return derivedMasseSuccessorale + derivedCapitauxHorsSuccession;
  }, [
    shouldRenderSuccessionComputationSections,
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    perByAssure,
    prevoyanceByAssure,
    derivedMasseSuccessorale,
    derivedCapitauxHorsSuccession,
  ]);

  return {
    displayAssuranceVieTransmise,
    displayPerTransmis,
    displayPrevoyanceTransmise,
    derivedMasseSuccessorale,
    derivedCapitauxHorsSuccession,
    derivedMasseTransmise: derivedMasseSuccessorale,
    synthDonutTransmis,
  };
}
