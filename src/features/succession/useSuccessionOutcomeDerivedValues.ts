import { useMemo } from 'react';
import type { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import type { buildSuccessionChainageAnalysis } from './successionChainage';
import type { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import {
  buildSuccessionChainTransmissionRows,
  buildSuccessionDirectDisplayAnalysis,
  type computeSuccessionDirectEstateBasis,
} from './successionDisplay';
import type { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import type { buildSuccessionPerFiscalAnalysis } from './successionPerFiscal';
import type {
  buildSuccessionPrevoyanceFiscalAnalysis,
} from './successionPrevoyanceFiscal';
import type { buildSuccessionPredecesAnalysis } from './successionPredeces';
import type { SuccessionChainOrder } from './successionChainage';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import type {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
  FamilyMember,
  SuccessionDonationEntry,
  SuccessionEnfant,
} from './successionDraft';
import type { SuccessionAssetTransmissionBasis } from './successionTransmissionBasis';
import {
  buildSuccessionSynthHypothese,
  mergeInsuranceBeneficiaryLines,
} from './useSuccessionOutcomeDerivedValues.helpers';

interface UseSuccessionOutcomeDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  liquidationContext: typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT;
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  fiscalSnapshot: SuccessionFiscalSnapshot;
  chainOrder: SuccessionChainOrder;
  canExport: boolean;
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  isMarried: boolean;
  isPacsed: boolean;
  nbDescendantBranches: number;
  nbEnfantsNonCommuns: number;
  derivedActifNetSuccession: number;
  chainageAnalysis: ReturnType<typeof buildSuccessionChainageAnalysis>;
  devolutionAnalysis: ReturnType<typeof buildSuccessionDevolutionAnalysis>;
  predecesAnalysis: ReturnType<typeof buildSuccessionPredecesAnalysis>;
  patrimonialAnalysis: ReturnType<typeof buildSuccessionPatrimonialAnalysis>;
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
  directEstateBasis: ReturnType<typeof computeSuccessionDirectEstateBasis>;
  transmissionBasis: SuccessionAssetTransmissionBasis;
  donationsContext: SuccessionDonationEntry[];
  assuranceVieByAssure: Record<'epoux1' | 'epoux2', number>;
  perByAssure: Record<'epoux1' | 'epoux2', number>;
  prevoyanceByAssure: Record<'epoux1' | 'epoux2', number>;
  assuranceVieTotals: {
    capitaux: number;
    versementsApres70: number;
  };
  perTotals: {
    capitaux: number;
  };
  prevoyanceTotals: {
    capitaux: number;
  };
  simulatedDeathDate: Date;
  shouldRenderSuccessionComputationSections: boolean;
}

export function useSuccessionOutcomeDerivedValues({
  civilContext,
  liquidationContext,
  devolutionContext,
  patrimonialContext,
  fiscalSnapshot,
  chainOrder,
  canExport,
  enfantsContext,
  familyMembers,
  isMarried,
  isPacsed,
  nbDescendantBranches,
  nbEnfantsNonCommuns,
  derivedActifNetSuccession,
  chainageAnalysis,
  devolutionAnalysis,
  predecesAnalysis,
  patrimonialAnalysis,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  directEstateBasis,
  transmissionBasis,
  donationsContext,
  assuranceVieByAssure,
  perByAssure,
  prevoyanceByAssure,
  assuranceVieTotals,
  perTotals,
  prevoyanceTotals,
  simulatedDeathDate,
  shouldRenderSuccessionComputationSections,
}: UseSuccessionOutcomeDerivedValuesInput) {
  const displayUsesChainage = Boolean(
    shouldRenderSuccessionComputationSections
    && isMarried
    && chainageAnalysis.applicable
    && chainageAnalysis.step1
    && chainageAnalysis.step2,
  );

  const displayActifNetSuccession = useMemo(
    () => (shouldRenderSuccessionComputationSections
      ? (displayUsesChainage ? derivedActifNetSuccession : directEstateBasis.actifNetSuccession)
      : 0),
    [
      shouldRenderSuccessionComputationSections,
      displayUsesChainage,
      derivedActifNetSuccession,
      directEstateBasis.actifNetSuccession,
    ],
  );

  const directDisplayAnalysis = useMemo(
    () => buildSuccessionDirectDisplayAnalysis({
      civil: civilContext,
      devolution: devolutionAnalysis,
      devolutionContext,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      order: chainOrder,
      actifNetSuccession: directEstateBasis.actifNetSuccession,
      baseWarnings: directEstateBasis.warnings,
      transmissionBasis,
      forfaitMobilierMode: patrimonialContext.forfaitMobilierMode,
      forfaitMobilierPct: patrimonialContext.forfaitMobilierPct,
      forfaitMobilierMontant: patrimonialContext.forfaitMobilierMontant,
      donationsContext,
      donationSettings: fiscalSnapshot.donation,
      referenceDate: simulatedDeathDate,
    }),
    [
      civilContext,
      devolutionAnalysis,
      devolutionContext,
      fiscalSnapshot.dmtgSettings,
      enfantsContext,
      familyMembers,
      chainOrder,
      directEstateBasis.actifNetSuccession,
      directEstateBasis.warnings,
      transmissionBasis,
      patrimonialContext.forfaitMobilierMode,
      patrimonialContext.forfaitMobilierPct,
      patrimonialContext.forfaitMobilierMontant,
      donationsContext,
      fiscalSnapshot.donation,
      simulatedDeathDate,
    ],
  );

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

  const derivedMasseTransmise = useMemo(
    () => (shouldRenderSuccessionComputationSections
      ? displayActifNetSuccession
        + displayAssuranceVieTransmise
        + displayPerTransmis
        + displayPrevoyanceTransmise
      : 0),
    [
      shouldRenderSuccessionComputationSections,
      displayActifNetSuccession,
      displayAssuranceVieTransmise,
      displayPerTransmis,
      displayPrevoyanceTransmise,
    ],
  );

  const derivedTotalDroits = useMemo(
    () => (shouldRenderSuccessionComputationSections
      ? ((displayUsesChainage
        ? chainageAnalysis.totalDroits
        : (directDisplayAnalysis.result?.totalDroits ?? 0))
        + avFiscalAnalysis.totalDroits
        + perFiscalAnalysis.totalDroits
        + prevoyanceFiscalAnalysis.totalDroits)
      : 0),
    [
      shouldRenderSuccessionComputationSections,
      displayUsesChainage,
      chainageAnalysis.totalDroits,
      directDisplayAnalysis.result?.totalDroits,
      avFiscalAnalysis.totalDroits,
      perFiscalAnalysis.totalDroits,
      prevoyanceFiscalAnalysis.totalDroits,
    ],
  );

  const synthDonutTransmis = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return 0;
    if (displayUsesChainage) {
      const step1 = chainageAnalysis.step1;
      const step2 = chainageAnalysis.step2;
      if (!step1 || !step2) return derivedMasseTransmise;
      return step1.actifTransmis
        + step2.actifTransmis
        + assuranceVieByAssure.epoux1
        + assuranceVieByAssure.epoux2
        + perByAssure.epoux1
        + perByAssure.epoux2
        + prevoyanceByAssure.epoux1
        + prevoyanceByAssure.epoux2;
    }
    return derivedMasseTransmise;
  }, [
    shouldRenderSuccessionComputationSections,
    displayUsesChainage,
    chainageAnalysis,
    assuranceVieByAssure,
    perByAssure,
    prevoyanceByAssure,
    derivedMasseTransmise,
  ]);

  const synthHypothese = useMemo(() => buildSuccessionSynthHypothese({
    isMarried,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    regimeMatrimonial: civilContext.regimeMatrimonial,
    attributionIntegrale: patrimonialContext.attributionIntegrale,
    donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
    donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
    chainOrder,
    dateNaissanceEpoux1: civilContext.dateNaissanceEpoux1,
    dateNaissanceEpoux2: civilContext.dateNaissanceEpoux2,
    derivedActifNetSuccession,
    simulatedDeathDate,
    choixLegalConjointSansDDV: devolutionContext.choixLegalConjointSansDDV,
  }), [
    isMarried,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    civilContext.regimeMatrimonial,
    patrimonialContext.attributionIntegrale,
    patrimonialContext.donationEntreEpouxActive,
    patrimonialContext.donationEntreEpouxOption,
    chainOrder,
    civilContext.dateNaissanceEpoux1,
    civilContext.dateNaissanceEpoux2,
    derivedActifNetSuccession,
    simulatedDeathDate,
    devolutionContext.choixLegalConjointSansDDV,
  ]);

  const transmissionRows = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return [];
    if (displayUsesChainage) {
      const { step1, step2 } = chainageAnalysis;
      if (!step1 || !step2) return [];
      return buildSuccessionChainTransmissionRows(chainageAnalysis);
    }
    return directDisplayAnalysis.transmissionRows;
  }, [
    shouldRenderSuccessionComputationSections,
    displayUsesChainage,
    chainageAnalysis,
    directDisplayAnalysis.transmissionRows,
  ]);

  const insuranceBeneficiaryLines = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return [];
    if (displayUsesChainage) {
      return mergeInsuranceBeneficiaryLines(
        avFiscalAnalysis.lines,
        perFiscalAnalysis.lines,
        prevoyanceFiscalAnalysis.lines,
      );
    }

    const assured = directDisplayAnalysis.simulatedDeceased;
    return mergeInsuranceBeneficiaryLines(
      avFiscalAnalysis.byAssure[assured].lines,
      perFiscalAnalysis.byAssure[assured].lines,
      prevoyanceFiscalAnalysis.byAssure[assured].lines,
    );
  }, [
    shouldRenderSuccessionComputationSections,
    displayUsesChainage,
    avFiscalAnalysis.lines,
    avFiscalAnalysis.byAssure,
    perFiscalAnalysis.lines,
    perFiscalAnalysis.byAssure,
    prevoyanceFiscalAnalysis.lines,
    prevoyanceFiscalAnalysis.byAssure,
    directDisplayAnalysis.simulatedDeceased,
  ]);

  const chainageExportPayload = useMemo(
    () => ({
      applicable: displayUsesChainage,
      order: chainageAnalysis.order,
      firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
      secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
      step1: displayUsesChainage && chainageAnalysis.step1 ? {
        actifTransmis: chainageAnalysis.step1.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order],
        perTransmis: perByAssure[chainageAnalysis.order],
        prevoyanceTransmise: prevoyanceByAssure[chainageAnalysis.order],
        masseTotaleTransmise: chainageAnalysis.step1.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order]
          + perByAssure[chainageAnalysis.order]
          + prevoyanceByAssure[chainageAnalysis.order],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        droitsPer: perFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        droitsPrevoyance: prevoyanceFiscalAnalysis.byAssure[chainageAnalysis.order].totalDroits,
        partConjoint: chainageAnalysis.step1.partConjoint,
        partEnfants: chainageAnalysis.step1.partEnfants,
        droitsEnfants: chainageAnalysis.step1.droitsEnfants,
        beneficiaries: chainageAnalysis.step1.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
      } : null,
      step2: displayUsesChainage && chainageAnalysis.step2 ? {
        actifTransmis: chainageAnalysis.step2.actifTransmis,
        assuranceVieTransmise: assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        perTransmis: perByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        prevoyanceTransmise: prevoyanceByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        masseTotaleTransmise: chainageAnalysis.step2.actifTransmis
          + assuranceVieByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1']
          + perByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1']
          + prevoyanceByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'],
        droitsAssuranceVie: avFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        droitsPer: perFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        droitsPrevoyance: prevoyanceFiscalAnalysis.byAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits,
        partConjoint: chainageAnalysis.step2.partConjoint,
        partEnfants: chainageAnalysis.step2.partEnfants,
        droitsEnfants: chainageAnalysis.step2.droitsEnfants,
        beneficiaries: chainageAnalysis.step2.beneficiaries.map((beneficiary) => ({
          label: beneficiary.label,
          brut: beneficiary.brut,
          droits: beneficiary.droits,
          net: beneficiary.net,
          exonerated: beneficiary.exonerated ?? false,
        })),
      } : null,
      assuranceVieTotale: assuranceVieTotals.capitaux,
      perTotale: perTotals.capitaux,
      prevoyanceTotale: prevoyanceTotals.capitaux,
      totalDroits: derivedTotalDroits,
      warnings: displayUsesChainage
        ? [
          ...chainageAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
          ...perFiscalAnalysis.warnings,
          ...prevoyanceFiscalAnalysis.warnings,
        ]
        : [
          ...(isPacsed
            ? ["PACS: la synthese fiscale affichee repose sur le deces simule du partenaire selectionne, pas sur une chronologie 2 deces."]
            : ["Chronologie 2 deces non utilisee pour cette situation : la synthese repose sur la succession directe du defunt simule."]),
          ...directDisplayAnalysis.warnings,
          ...avFiscalAnalysis.warnings,
          ...perFiscalAnalysis.warnings,
          ...prevoyanceFiscalAnalysis.warnings,
        ],
    }),
    [
      displayUsesChainage,
      chainageAnalysis,
      assuranceVieByAssure,
      perByAssure,
      prevoyanceByAssure,
      assuranceVieTotals.capitaux,
      perTotals.capitaux,
      prevoyanceTotals.capitaux,
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
      derivedTotalDroits,
      isPacsed,
      directDisplayAnalysis.warnings,
    ],
  );

  const totalActifsLiquidation = useMemo(
    () => Math.max(
      0,
      liquidationContext.actifEpoux1 + liquidationContext.actifEpoux2 + liquidationContext.actifCommun,
    ),
    [liquidationContext],
  );

  const canExportSimplified = shouldRenderSuccessionComputationSections && (
    displayActifNetSuccession > 0
    || totalActifsLiquidation > 0
    || assuranceVieTotals.capitaux > 0
    || perTotals.capitaux > 0
    || prevoyanceTotals.capitaux > 0
  );
  const canExportCurrentMode = canExport && canExportSimplified;

  const attentions = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return [];
    const seen = new Set<string>();
    return [
      ...predecesAnalysis.warnings,
      ...chainageAnalysis.warnings,
      ...devolutionAnalysis.warnings,
      ...(!displayUsesChainage ? directDisplayAnalysis.warnings : []),
      ...patrimonialAnalysis.warnings,
      ...avFiscalAnalysis.warnings,
      ...perFiscalAnalysis.warnings,
      ...prevoyanceFiscalAnalysis.warnings,
    ].filter((warning) => {
      if (seen.has(warning)) return false;
      seen.add(warning);
      return true;
    });
  }, [
    shouldRenderSuccessionComputationSections,
    predecesAnalysis.warnings,
    chainageAnalysis.warnings,
    devolutionAnalysis.warnings,
    displayUsesChainage,
    directDisplayAnalysis.warnings,
    patrimonialAnalysis.warnings,
    avFiscalAnalysis.warnings,
    perFiscalAnalysis.warnings,
    prevoyanceFiscalAnalysis.warnings,
  ]);

  const exportHeirs = useMemo(
    () => (displayUsesChainage ? [] : directDisplayAnalysis.heirs).map((heir) => ({
      lien: heir.lien,
      partSuccession: heir.partSuccession,
    })),
    [displayUsesChainage, directDisplayAnalysis.heirs],
  );

  return {
    displayUsesChainage,
    displayActifNetSuccession,
    directDisplayAnalysis,
    displayAssuranceVieTransmise,
    displayPerTransmis,
    displayPrevoyanceTransmise,
    derivedMasseTransmise,
    derivedTotalDroits,
    synthDonutTransmis,
    synthHypothese,
    transmissionRows,
    insuranceBeneficiaryLines,
    chainageExportPayload,
    totalActifsLiquidation,
    canExportSimplified,
    canExportCurrentMode,
    attentions,
    exportHeirs,
  };
}
