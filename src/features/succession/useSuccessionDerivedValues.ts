/**
 * useSuccessionDerivedValues — Valeurs dérivées du simulateur Succession.
 *
 * Extrait de SuccessionSimulator.tsx (PR-P1-07-03).
 * Pure computation : aucun effet de bord, aucun setState.
 * useFiscalContext({ strict: true }) reste dans SuccessionSimulator.
 */

import { useMemo } from 'react';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import {
  countEffectiveDescendantBranches,
  countLivingEnfants,
  countLivingNonCommuns,
  getEnfantRattachementOptions,
} from './successionEnfants';
import { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import { coordinateSuccessionInsuranceAllowances } from './successionDeathInsuranceAllowances';
import { buildSuccessionSurvivorEconomicInflows } from './successionInsuranceInflows';
import { buildSuccessionPerFiscalAnalysis } from './successionPerFiscal';
import {
  buildSuccessionPrevoyanceFiscalAnalysis,
  getSuccessionPrevoyanceRegimeInfo,
} from './successionPrevoyanceFiscal';
import { buildSuccessionPatrimonialAnalysis } from './successionPatrimonial';
import { buildSuccessionPredecesAnalysis } from './successionPredeces';
import {
  buildSuccessionChainageAnalysis,
  type SuccessionChainOrder,
} from './successionChainage';
import { computeSuccessionDirectEstateBasis } from './successionDisplay';
import { buildSuccessionDevolutionAnalysis } from './successionDevolution';
import {
  getDonationEffectiveAmount,
  getTestamentParticularLegaciesTotal,
  hasComputableSuccessionFiliation,
  hasRequiredBirthDatesForSituation,
  isCoupleSituation,
} from './successionSimulator.helpers';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  FamilyMember,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionPerEntry,
  SuccessionPrevoyanceDecesEntry,
} from './successionDraft';
import type {
  DEFAULT_SUCCESSION_CIVIL_CONTEXT,
  DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT,
} from './successionDraft';
import { useSuccessionOutcomeDerivedValues } from './useSuccessionOutcomeDerivedValues';
import { useSuccessionUiDerivedValues } from './useSuccessionUiDerivedValues';

interface UseSuccessionDerivedValuesInput {
  civilContext: typeof DEFAULT_SUCCESSION_CIVIL_CONTEXT;
  liquidationContext: typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT;
  assetEntries: SuccessionAssetDetailEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  devolutionContext: typeof DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT;
  patrimonialContext: typeof DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT;
  donationsContext: SuccessionDonationEntry[];
  enfantsContext: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  fiscalSnapshot: SuccessionFiscalSnapshot;
  chainOrder: SuccessionChainOrder;
  canExport: boolean;
}

export function useSuccessionDerivedValues({
  civilContext,
  liquidationContext,
  assetEntries,
  groupementFoncierEntries,
  assuranceVieEntries,
  perEntries,
  prevoyanceDecesEntries,
  devolutionContext,
  patrimonialContext,
  donationsContext,
  enfantsContext,
  familyMembers,
  fiscalSnapshot,
  chainOrder,
  canExport,
}: UseSuccessionDerivedValuesInput) {
  const simulatedDeathDate = useMemo(() => {
    const nextDate = new Date();
    nextDate.setFullYear(nextDate.getFullYear() + patrimonialContext.decesDansXAns);
    return nextDate;
  }, [patrimonialContext.decesDansXAns]);

  const nbEnfants = useMemo(() => countLivingEnfants(enfantsContext), [enfantsContext]);
  const nbDescendantBranches = useMemo(
    () => countEffectiveDescendantBranches(enfantsContext, familyMembers),
    [enfantsContext, familyMembers],
  );
  const nbEnfantsNonCommuns = useMemo(
    () => countLivingNonCommuns(enfantsContext),
    [enfantsContext],
  );
  const donationTotals = useMemo(() => donationsContext.reduce((totals, entry) => {
    const amount = getDonationEffectiveAmount(entry);
    if (entry.type === 'rapportable') totals.rapportable += amount;
    if (entry.type === 'hors_part') totals.horsPart += amount;
    return totals;
  }, {
    rapportable: 0,
    horsPart: 0,
    legsParticuliers: getTestamentParticularLegaciesTotal(devolutionContext.testamentsBySide),
  }), [donationsContext, devolutionContext.testamentsBySide]);

  const enfantRattachementOptions = useMemo(
    () => getEnfantRattachementOptions(civilContext.situationMatrimoniale),
    [civilContext.situationMatrimoniale],
  );

  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isPacsed = civilContext.situationMatrimoniale === 'pacse';
  const isConcubinage = civilContext.situationMatrimoniale === 'concubinage';
  const isCouple = isCoupleSituation(civilContext.situationMatrimoniale);
  const hasComputableFiliation = useMemo(
    () => hasComputableSuccessionFiliation(
      civilContext.situationMatrimoniale,
      enfantsContext,
      familyMembers,
    ),
    [civilContext.situationMatrimoniale, enfantsContext, familyMembers],
  );
  const hasRequiredBirthDatesForCurrentSituation = useMemo(
    () => hasRequiredBirthDatesForSituation(
      civilContext.situationMatrimoniale,
      civilContext.dateNaissanceEpoux1,
      civilContext.dateNaissanceEpoux2,
    ),
    [
      civilContext.situationMatrimoniale,
      civilContext.dateNaissanceEpoux1,
      civilContext.dateNaissanceEpoux2,
    ],
  );
  const shouldRenderSuccessionComputationSections = hasComputableFiliation
    && hasRequiredBirthDatesForCurrentSituation;
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );
  const isPacsIndivision = isPacsed && civilContext.pacsConvention === 'indivision';
  const showSharedTransmissionPct = isCommunityRegime || isPacsIndivision;
  const showDonationEntreEpoux = isMarried;

  const uiDerived = useSuccessionUiDerivedValues({
    civilContext,
    isMarried,
    isPacsed,
    isConcubinage,
    enfantsContext,
    familyMembers,
    assetEntries,
    groupementFoncierEntries,
    assuranceVieEntries,
    perEntries,
    prevoyanceDecesEntries,
    forfaitMobilierMode: patrimonialContext.forfaitMobilierMode,
    forfaitMobilierPct: patrimonialContext.forfaitMobilierPct,
    forfaitMobilierMontant: patrimonialContext.forfaitMobilierMontant,
    abattementResidencePrincipale: patrimonialContext.abattementResidencePrincipale,
  });

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(
      civilContext,
      { ...liquidationContext, nbEnfants: nbDescendantBranches },
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ),
    [civilContext, liquidationContext, nbDescendantBranches, fiscalSnapshot.dmtgSettings, patrimonialContext.attributionBiensCommunsPct],
  );

  const rawAvFiscalAnalysis = useMemo(
    () => buildSuccessionAvFiscalAnalysis(
      assuranceVieEntries,
      civilContext,
      enfantsContext,
      familyMembers,
      fiscalSnapshot,
    ),
    [assuranceVieEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot],
  );

  const rawPerFiscalAnalysis = useMemo(
    () => buildSuccessionPerFiscalAnalysis(
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
    () => buildSuccessionPrevoyanceFiscalAnalysis(
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

  const prevoyanceRegimeByEntry = useMemo(() => Object.fromEntries(
    prevoyanceDecesEntries.map((entry) => {
      const regimeInfo = getSuccessionPrevoyanceRegimeInfo(
        entry,
        civilContext,
        simulatedDeathDate,
        fiscalSnapshot.avDeces.agePivotPrimes,
      );

      return [entry.id, {
        regimeLabel: regimeInfo.regimeLabel,
        warning: regimeInfo.warning,
      }];
    }),
  ), [
    prevoyanceDecesEntries,
    civilContext,
    simulatedDeathDate,
    fiscalSnapshot.avDeces.agePivotPrimes,
  ]);

  const coordinatedInsuranceFiscal = useMemo(
    () => coordinateSuccessionInsuranceAllowances({
      avFiscalAnalysis: rawAvFiscalAnalysis,
      perFiscalAnalysis: rawPerFiscalAnalysis,
      prevoyanceFiscalAnalysis: rawPrevoyanceFiscalAnalysis,
      fiscalSnapshot,
    }),
    [
      rawAvFiscalAnalysis,
      rawPerFiscalAnalysis,
      rawPrevoyanceFiscalAnalysis,
      fiscalSnapshot,
    ],
  );

  const {
    avFiscalAnalysis,
    perFiscalAnalysis,
    prevoyanceFiscalAnalysis,
  } = coordinatedInsuranceFiscal;

  const survivorEconomicInflows = useMemo(
    () => buildSuccessionSurvivorEconomicInflows({
      avFiscalAnalysis,
      perFiscalAnalysis,
      prevoyanceFiscalAnalysis,
    }),
    [avFiscalAnalysis, perFiscalAnalysis, prevoyanceFiscalAnalysis],
  );

  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants: nbDescendantBranches },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      survivorEconomicInflows,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      patrimonial: {
        attributionIntegrale: patrimonialContext.attributionIntegrale,
        donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
        donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
        preciputMontant: patrimonialContext.preciputMontant,
      },
      transmissionBasis: uiDerived.transmissionBasis,
      abattementResidencePrincipale: patrimonialContext.abattementResidencePrincipale,
      forfaitMobilierMode: patrimonialContext.forfaitMobilierMode,
      forfaitMobilierPct: patrimonialContext.forfaitMobilierPct,
      forfaitMobilierMontant: patrimonialContext.forfaitMobilierMontant,
      enfantsContext,
      familyMembers,
      devolution: devolutionContext,
      referenceDate: simulatedDeathDate,
      donations: donationsContext,
      donationSettings: fiscalSnapshot.donation,
    }),
    [
      civilContext,
      liquidationContext,
      nbDescendantBranches,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      survivorEconomicInflows,
      patrimonialContext.attributionBiensCommunsPct,
      patrimonialContext.abattementResidencePrincipale,
      patrimonialContext.attributionIntegrale,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      patrimonialContext.preciputMontant,
      patrimonialContext.forfaitMobilierMode,
      patrimonialContext.forfaitMobilierPct,
      patrimonialContext.forfaitMobilierMontant,
      uiDerived.transmissionBasis,
      enfantsContext,
      familyMembers,
      devolutionContext,
      simulatedDeathDate,
      donationsContext,
      fiscalSnapshot.donation,
    ],
  );

  const directEstateBasis = useMemo(
    () => computeSuccessionDirectEstateBasis(civilContext, liquidationContext, chainOrder),
    [civilContext, liquidationContext, chainOrder],
  );

  const derivedActifNetSuccession = chainageAnalysis.step1?.actifTransmis ?? directEstateBasis.actifNetSuccession;

  const devolutionAnalysis = useMemo(
    () => buildSuccessionDevolutionAnalysis(
      civilContext,
      nbDescendantBranches,
      {
        ...devolutionContext,
        nbEnfantsNonCommuns,
      },
      derivedActifNetSuccession,
      enfantsContext,
      familyMembers,
      {
        patrimonial: {
          donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
          donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
        },
        simulatedDeceased: chainOrder,
        referenceDate: simulatedDeathDate,
      },
    ),
    [
      civilContext,
      nbDescendantBranches,
      devolutionContext,
      nbEnfantsNonCommuns,
      derivedActifNetSuccession,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      chainOrder,
      simulatedDeathDate,
    ],
  );

  const patrimonialSimulatedDeceased = civilContext.situationMatrimoniale === 'marie'
    ? chainOrder
    : directEstateBasis.simulatedDeceased;

  const patrimonialAnalysis = useMemo(
    () => buildSuccessionPatrimonialAnalysis(
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      {
        simulatedDeceased: patrimonialSimulatedDeceased,
        testament: devolutionContext.testamentsBySide[patrimonialSimulatedDeceased],
        referenceDate: simulatedDeathDate,
      },
    ),
    [
      civilContext,
      derivedActifNetSuccession,
      nbDescendantBranches,
      patrimonialContext,
      donationsContext,
      fiscalSnapshot,
      patrimonialSimulatedDeceased,
      devolutionContext.testamentsBySide,
      simulatedDeathDate,
    ],
  );

  const outcomeDerived = useSuccessionOutcomeDerivedValues({
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
    transmissionBasis: uiDerived.transmissionBasis,
    abattementResidencePrincipale: patrimonialContext.abattementResidencePrincipale,
    donationsContext,
    assuranceVieByAssure: uiDerived.assuranceVieByAssure,
    assuranceVieTotals: uiDerived.assuranceVieTotals,
    perByAssure: uiDerived.perByAssure,
    perTotals: uiDerived.perTotals,
    prevoyanceByAssure: uiDerived.prevoyanceByAssure,
    prevoyanceTotals: uiDerived.prevoyanceTotals,
    simulatedDeathDate,
    shouldRenderSuccessionComputationSections,
  });

  return {
    nbEnfants,
    nbDescendantBranches,
    nbEnfantsNonCommuns,
    donationTotals,
    enfantRattachementOptions,
    branchOptions: uiDerived.branchOptions,
    predecesAnalysis,
    chainageAnalysis,
    directEstateBasis,
    derivedActifNetSuccession,
    devolutionAnalysis,
    patrimonialAnalysis,
    isMarried,
    isPacsed,
    isConcubinage,
    isCouple,
    isCommunityRegime,
    isPacsIndivision,
    hasComputableFiliation,
    hasRequiredBirthDatesForCurrentSituation,
    shouldRenderSuccessionComputationSections,
    showSharedTransmissionPct,
    showDonationEntreEpoux,
    patrimonialSimulatedDeceased,
    simulatedDeathDate,
    birthDateLabels: uiDerived.birthDateLabels,
    showSecondBirthDate: uiDerived.showSecondBirthDate,
    assetOwnerOptions: uiDerived.assetOwnerOptions,
    assetPocketOptions: uiDerived.assetPocketOptions,
    assuranceViePartyOptions: uiDerived.assuranceViePartyOptions,
    canOpenDispositionsModal: uiDerived.canOpenDispositionsModal,
    testamentSides: uiDerived.testamentSides,
    descendantBranchesBySide: uiDerived.descendantBranchesBySide,
    testamentBeneficiaryOptionsBySide: uiDerived.testamentBeneficiaryOptionsBySide,
    donateurOptions: uiDerived.donateurOptions,
    donatairesOptions: uiDerived.donatairesOptions,
    assetBreakdown: uiDerived.assetBreakdown,
    actifsTaxablesParOwner: uiDerived.actifsTaxablesParOwner,
    assetNetTotals: uiDerived.assetNetTotals,
    forfaitMobilierComputed: uiDerived.forfaitMobilierComputed,
    forfaitMobilierParOwner: uiDerived.forfaitMobilierParOwner,
    hasResidencePrincipale: uiDerived.hasResidencePrincipale,
    residencePrincipaleEntryId: uiDerived.residencePrincipaleEntryId,
    transmissionBasis: uiDerived.transmissionBasis,
    hasBeneficiaryLevelGfAdjustment: uiDerived.hasBeneficiaryLevelGfAdjustment,
    assetEntriesByCategory: uiDerived.assetEntriesByCategory,
    assuranceVieTotals: uiDerived.assuranceVieTotals,
    avFiscalAnalysis,
    assuranceVieByAssure: uiDerived.assuranceVieByAssure,
    perTotals: uiDerived.perTotals,
    perFiscalAnalysis,
    perByAssure: uiDerived.perByAssure,
    prevoyanceTotals: uiDerived.prevoyanceTotals,
    prevoyanceByAssure: uiDerived.prevoyanceByAssure,
    prevoyanceClauseOptions: uiDerived.prevoyanceClauseOptions,
    prevoyanceRegimeByEntry,
    prevoyanceFiscalAnalysis,
    displayUsesChainage: outcomeDerived.displayUsesChainage,
    displayActifNetSuccession: outcomeDerived.displayActifNetSuccession,
    directDisplayAnalysis: outcomeDerived.directDisplayAnalysis,
    displayAssuranceVieTransmise: outcomeDerived.displayAssuranceVieTransmise,
    displayPerTransmis: outcomeDerived.displayPerTransmis,
    displayPrevoyanceTransmise: outcomeDerived.displayPrevoyanceTransmise,
    derivedMasseTransmise: outcomeDerived.derivedMasseTransmise,
    derivedTotalDroits: outcomeDerived.derivedTotalDroits,
    synthDonutTransmis: outcomeDerived.synthDonutTransmis,
    synthHypothese: outcomeDerived.synthHypothese,
    transmissionRows: outcomeDerived.transmissionRows,
    insurance990ILines: outcomeDerived.insurance990ILines,
    insurance757BLines: outcomeDerived.insurance757BLines,
    chainageExportPayload: outcomeDerived.chainageExportPayload,
    totalActifsLiquidation: outcomeDerived.totalActifsLiquidation,
    canExportSimplified: outcomeDerived.canExportSimplified,
    canExportCurrentMode: outcomeDerived.canExportCurrentMode,
    attentions: outcomeDerived.attentions,
    exportHeirs: outcomeDerived.exportHeirs,
  };
}
