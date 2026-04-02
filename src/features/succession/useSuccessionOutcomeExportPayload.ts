import type { buildSuccessionAvFiscalAnalysis } from './successionAvFiscal';
import type { buildSuccessionChainageAnalysis } from './successionChainage';
import type { buildSuccessionPerFiscalAnalysis } from './successionPerFiscal';
import type {
  buildSuccessionPrevoyanceFiscalAnalysis,
} from './successionPrevoyanceFiscal';

type SuccessionSide = 'epoux1' | 'epoux2';
type ChainageAnalysis = ReturnType<typeof buildSuccessionChainageAnalysis>;
type ChainageStep = NonNullable<ChainageAnalysis['step1']>;

interface BuildSuccessionChainageExportPayloadInput {
  displayUsesChainage: boolean;
  chainageAnalysis: ChainageAnalysis;
  assuranceVieByAssure: Record<SuccessionSide, number>;
  perByAssure: Record<SuccessionSide, number>;
  prevoyanceByAssure: Record<SuccessionSide, number>;
  assuranceVieTotale: number;
  perTotale: number;
  prevoyanceTotale: number;
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
  derivedTotalDroits: number;
  isPacsed: boolean;
  directDisplayWarnings: string[];
}

function getOtherSide(side: SuccessionSide): SuccessionSide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

function buildBeneficiaries(
  beneficiaries: ChainageStep['beneficiaries'],
) {
  return beneficiaries.map((beneficiary) => ({
    label: beneficiary.label,
    brut: beneficiary.brut,
    droits: beneficiary.droits,
    net: beneficiary.net,
    exonerated: beneficiary.exonerated ?? false,
  }));
}

function buildStepPayload(
  step: ChainageStep,
  assured: SuccessionSide,
  assuranceVieByAssure: Record<SuccessionSide, number>,
  perByAssure: Record<SuccessionSide, number>,
  prevoyanceByAssure: Record<SuccessionSide, number>,
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>,
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>,
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>,
) {
  return {
    actifTransmis: step.actifTransmis,
    assuranceVieTransmise: assuranceVieByAssure[assured],
    perTransmis: perByAssure[assured],
    prevoyanceTransmise: prevoyanceByAssure[assured],
    masseTotaleTransmise: step.actifTransmis
      + assuranceVieByAssure[assured]
      + perByAssure[assured]
      + prevoyanceByAssure[assured],
    droitsAssuranceVie: avFiscalAnalysis.byAssure[assured].totalDroits,
    droitsPer: perFiscalAnalysis.byAssure[assured].totalDroits,
    droitsPrevoyance: prevoyanceFiscalAnalysis.byAssure[assured].totalDroits,
    partConjoint: step.partConjoint,
    partEnfants: step.partEnfants,
    droitsEnfants: step.droitsEnfants,
    beneficiaries: buildBeneficiaries(step.beneficiaries),
  };
}

export function buildSuccessionChainageExportPayload({
  displayUsesChainage,
  chainageAnalysis,
  assuranceVieByAssure,
  perByAssure,
  prevoyanceByAssure,
  assuranceVieTotale,
  perTotale,
  prevoyanceTotale,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  derivedTotalDroits,
  isPacsed,
  directDisplayWarnings,
}: BuildSuccessionChainageExportPayloadInput) {
  const otherSide = getOtherSide(chainageAnalysis.order);

  return {
    applicable: displayUsesChainage,
    order: chainageAnalysis.order,
    firstDecedeLabel: chainageAnalysis.firstDecedeLabel,
    secondDecedeLabel: chainageAnalysis.secondDecedeLabel,
    step1: displayUsesChainage && chainageAnalysis.step1
      ? buildStepPayload(
        chainageAnalysis.step1,
        chainageAnalysis.order,
        assuranceVieByAssure,
        perByAssure,
        prevoyanceByAssure,
        avFiscalAnalysis,
        perFiscalAnalysis,
        prevoyanceFiscalAnalysis,
      )
      : null,
    step2: displayUsesChainage && chainageAnalysis.step2
      ? buildStepPayload(
        chainageAnalysis.step2,
        otherSide,
        assuranceVieByAssure,
        perByAssure,
        prevoyanceByAssure,
        avFiscalAnalysis,
        perFiscalAnalysis,
        prevoyanceFiscalAnalysis,
      )
      : null,
    societeAcquets: displayUsesChainage && chainageAnalysis.societeAcquets
      ? {
        configured: chainageAnalysis.societeAcquets.configured,
        totalValue: chainageAnalysis.societeAcquets.totalValue,
        firstEstateContribution: chainageAnalysis.societeAcquets.firstEstateContribution,
        survivorShare: chainageAnalysis.societeAcquets.survivorShare,
        preciputAmount: chainageAnalysis.societeAcquets.preciputAmount,
        survivorAttributionAmount: chainageAnalysis.societeAcquets.survivorAttributionAmount,
        liquidationMode: chainageAnalysis.societeAcquets.liquidationMode,
        deceasedQuotePct: chainageAnalysis.societeAcquets.deceasedQuotePct,
        survivorQuotePct: chainageAnalysis.societeAcquets.survivorQuotePct,
        attributionIntegrale: chainageAnalysis.societeAcquets.attributionIntegrale,
      }
      : null,
    participationAcquets: displayUsesChainage && chainageAnalysis.participationAcquets
      ? {
        configured: chainageAnalysis.participationAcquets.configured,
        active: chainageAnalysis.participationAcquets.active,
        useCurrentAssetsAsFinalPatrimony:
          chainageAnalysis.participationAcquets.useCurrentAssetsAsFinalPatrimony,
        patrimoineOriginaireEpoux1:
          chainageAnalysis.participationAcquets.patrimoineOriginaireEpoux1,
        patrimoineOriginaireEpoux2:
          chainageAnalysis.participationAcquets.patrimoineOriginaireEpoux2,
        patrimoineFinalEpoux1: chainageAnalysis.participationAcquets.patrimoineFinalEpoux1,
        patrimoineFinalEpoux2: chainageAnalysis.participationAcquets.patrimoineFinalEpoux2,
        acquetsEpoux1: chainageAnalysis.participationAcquets.acquetsEpoux1,
        acquetsEpoux2: chainageAnalysis.participationAcquets.acquetsEpoux2,
        creditor: chainageAnalysis.participationAcquets.creditor,
        debtor: chainageAnalysis.participationAcquets.debtor,
        quoteAppliedPct: chainageAnalysis.participationAcquets.quoteAppliedPct,
        creanceAmount: chainageAnalysis.participationAcquets.creanceAmount,
        firstEstateAdjustment: chainageAnalysis.participationAcquets.firstEstateAdjustment,
      }
      : null,
    interMassClaims: displayUsesChainage && chainageAnalysis.interMassClaims
      ? {
        configured: chainageAnalysis.interMassClaims.configured,
        totalRequestedAmount: chainageAnalysis.interMassClaims.totalRequestedAmount,
        totalAppliedAmount: chainageAnalysis.interMassClaims.totalAppliedAmount,
        claims: chainageAnalysis.interMassClaims.claims.map((claim) => ({
          id: claim.id,
          kind: claim.kind,
          label: claim.label,
          fromPocket: claim.fromPocket,
          toPocket: claim.toPocket,
          requestedAmount: claim.requestedAmount,
          appliedAmount: claim.appliedAmount,
        })),
      }
      : null,
    affectedLiabilities: displayUsesChainage && chainageAnalysis.affectedLiabilities
      ? {
        totalAmount: chainageAnalysis.affectedLiabilities.totalAmount,
        byPocket: chainageAnalysis.affectedLiabilities.byPocket.map((entry) => ({
          pocket: entry.pocket,
          amount: entry.amount,
        })),
      }
      : null,
    preciput: displayUsesChainage && chainageAnalysis.preciput
      ? {
        mode: chainageAnalysis.preciput.mode,
        pocket: chainageAnalysis.preciput.pocket,
        requestedAmount: chainageAnalysis.preciput.requestedAmount,
        appliedAmount: chainageAnalysis.preciput.appliedAmount,
        usesGlobalFallback: chainageAnalysis.preciput.usesGlobalFallback,
        selections: chainageAnalysis.preciput.selections.map((selection) => ({
          id: selection.id,
          sourceType: selection.sourceType,
          sourceId: selection.sourceId,
          label: selection.label,
          pocket: selection.pocket,
          requestedAmount: selection.requestedAmount,
          appliedAmount: selection.appliedAmount,
        })),
      }
      : null,
    assuranceVieTotale,
    perTotale,
    prevoyanceTotale,
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
          ? ['PACS: la synthese fiscale affichee repose sur le deces simule du partenaire selectionne, pas sur une chronologie 2 deces.']
          : ['Chronologie 2 deces non utilisee pour cette situation : la synthese repose sur la succession directe du defunt simule.']),
        ...directDisplayWarnings,
        ...avFiscalAnalysis.warnings,
        ...perFiscalAnalysis.warnings,
        ...prevoyanceFiscalAnalysis.warnings,
      ],
  };
}
