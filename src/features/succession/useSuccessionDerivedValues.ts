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
import { buildSuccessionPerFiscalAnalysis } from './successionPerFiscal';
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
} from './successionSimulator.helpers';
import type {
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  FamilyMember,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionPerEntry,
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
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  assuranceVieDraft: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  perDraft: SuccessionPerEntry[];
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
  assuranceVieEntries,
  assuranceVieDraft,
  perEntries,
  perDraft,
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

  const predecesAnalysis = useMemo(
    () => buildSuccessionPredecesAnalysis(
      civilContext,
      { ...liquidationContext, nbEnfants: nbDescendantBranches },
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
    ),
    [civilContext, liquidationContext, nbDescendantBranches, fiscalSnapshot.dmtgSettings, patrimonialContext.attributionBiensCommunsPct],
  );

  const chainageAnalysis = useMemo(
    () => buildSuccessionChainageAnalysis({
      civil: civilContext,
      liquidation: { ...liquidationContext, nbEnfants: nbDescendantBranches },
      regimeUsed: predecesAnalysis.regimeUsed,
      order: chainOrder,
      dmtgSettings: fiscalSnapshot.dmtgSettings,
      attributionBiensCommunsPct: patrimonialContext.attributionBiensCommunsPct,
      patrimonial: {
        donationEntreEpouxActive: patrimonialContext.donationEntreEpouxActive,
        donationEntreEpouxOption: patrimonialContext.donationEntreEpouxOption,
      },
      enfantsContext,
      familyMembers,
      devolution: devolutionContext,
      referenceDate: simulatedDeathDate,
    }),
    [
      civilContext,
      liquidationContext,
      nbDescendantBranches,
      predecesAnalysis.regimeUsed,
      chainOrder,
      fiscalSnapshot.dmtgSettings,
      patrimonialContext.attributionBiensCommunsPct,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      devolutionContext,
      simulatedDeathDate,
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
      patrimonialContext.legsParticuliers,
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
      patrimonialContext.legsParticuliers,
      patrimonialContext.donationEntreEpouxActive,
      patrimonialContext.donationEntreEpouxOption,
      enfantsContext,
      familyMembers,
      chainOrder,
      simulatedDeathDate,
    ],
  );

  const isMarried = civilContext.situationMatrimoniale === 'marie';
  const isPacsed = civilContext.situationMatrimoniale === 'pacse';
  const isConcubinage = civilContext.situationMatrimoniale === 'concubinage';
  const isCommunityRegime = isMarried && (
    civilContext.regimeMatrimonial === 'communaute_legale'
    || civilContext.regimeMatrimonial === 'communaute_universelle'
    || civilContext.regimeMatrimonial === 'communaute_meubles_acquets'
  );
  const isPacsIndivision = isPacsed && civilContext.pacsConvention === 'indivision';
  const showSharedTransmissionPct = isCommunityRegime || isPacsIndivision;
  const showDonationEntreEpoux = isMarried;

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

  const uiDerived = useSuccessionUiDerivedValues({
    civilContext,
    isMarried,
    isPacsed,
    isConcubinage,
    enfantsContext,
    familyMembers,
    assetEntries,
    assuranceVieEntries,
    assuranceVieDraft,
    perEntries,
    perDraft,
    forfaitMobilierMode: patrimonialContext.forfaitMobilierMode,
    forfaitMobilierPct: patrimonialContext.forfaitMobilierPct,
    forfaitMobilierMontant: patrimonialContext.forfaitMobilierMontant,
    abattementResidencePrincipale: patrimonialContext.abattementResidencePrincipale,
  });

  const avFiscalAnalysis = useMemo(
    () => buildSuccessionAvFiscalAnalysis(
      assuranceVieEntries,
      civilContext,
      enfantsContext,
      familyMembers,
      fiscalSnapshot,
    ),
    [assuranceVieEntries, civilContext, enfantsContext, familyMembers, fiscalSnapshot],
  );

  const perFiscalAnalysis = useMemo(
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
    directEstateBasis,
    assuranceVieByAssure: uiDerived.assuranceVieByAssure,
    assuranceVieTotals: uiDerived.assuranceVieTotals,
    perByAssure: uiDerived.perByAssure,
    perTotals: uiDerived.perTotals,
    simulatedDeathDate,
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
    isCommunityRegime,
    isPacsIndivision,
    showSharedTransmissionPct,
    showDonationEntreEpoux,
    patrimonialSimulatedDeceased,
    simulatedDeathDate,
    birthDateLabels: uiDerived.birthDateLabels,
    showSecondBirthDate: uiDerived.showSecondBirthDate,
    assetOwnerOptions: uiDerived.assetOwnerOptions,
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
    assetEntriesByCategory: uiDerived.assetEntriesByCategory,
    assuranceVieTotals: uiDerived.assuranceVieTotals,
    assuranceVieDraftTotals: uiDerived.assuranceVieDraftTotals,
    avFiscalAnalysis,
    assuranceVieByAssure: uiDerived.assuranceVieByAssure,
    perTotals: uiDerived.perTotals,
    perDraftTotals: uiDerived.perDraftTotals,
    perFiscalAnalysis,
    perByAssure: uiDerived.perByAssure,
    displayUsesChainage: outcomeDerived.displayUsesChainage,
    displayActifNetSuccession: outcomeDerived.displayActifNetSuccession,
    directDisplayAnalysis: outcomeDerived.directDisplayAnalysis,
    displayAssuranceVieTransmise: outcomeDerived.displayAssuranceVieTransmise,
    displayPerTransmis: outcomeDerived.displayPerTransmis,
    derivedMasseTransmise: outcomeDerived.derivedMasseTransmise,
    derivedTotalDroits: outcomeDerived.derivedTotalDroits,
    synthDonutTransmis: outcomeDerived.synthDonutTransmis,
    synthHypothese: outcomeDerived.synthHypothese,
    transmissionRows: outcomeDerived.transmissionRows,
    chainageExportPayload: outcomeDerived.chainageExportPayload,
    totalActifsLiquidation: outcomeDerived.totalActifsLiquidation,
    canExportSimplified: outcomeDerived.canExportSimplified,
    canExportCurrentMode: outcomeDerived.canExportCurrentMode,
    attentions: outcomeDerived.attentions,
    exportHeirs: outcomeDerived.exportHeirs,
  };
}
