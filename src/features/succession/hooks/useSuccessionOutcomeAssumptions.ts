import { useMemo } from 'react';
import type { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import type { buildSuccessionChainageAnalysis } from '../successionChainage';
import type { buildSuccessionDevolutionAnalysis } from '../successionDevolution';
import type { buildSuccessionDirectDisplayAnalysis } from '../successionDisplay';
import type { buildSuccessionPatrimonialAnalysis } from '../successionPatrimonial';
import type { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import type { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import type { buildSuccessionPredecesAnalysis } from '../successionPredeces';
import { buildSuccessionAssumptions } from '../successionAssumptions';
import type { SuccessionFiscalSnapshot } from '../successionFiscalContext';
import type {
  DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT,
  SuccessionDonationEntry,
} from '../successionDraft';
import type { SuccessionUsufruitSuccessifAnalysis } from '../successionUsufruitSuccessif';

interface UseSuccessionOutcomeAssumptionsInput {
  canExport: boolean;
  shouldRenderSuccessionComputationSections: boolean;
  displayActifNetSuccession: number;
  displayUsesChainage: boolean;
  liquidationContext: typeof DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT;
  assuranceVieTotals: { capitaux: number };
  perTotals: { capitaux: number };
  prevoyanceTotals: { capitaux: number };
  fiscalSnapshot: SuccessionFiscalSnapshot;
  predecesAnalysis: ReturnType<typeof buildSuccessionPredecesAnalysis>;
  chainageAnalysis: ReturnType<typeof buildSuccessionChainageAnalysis>;
  usufruitSuccessifAnalysis: SuccessionUsufruitSuccessifAnalysis;
  devolutionAnalysis: ReturnType<typeof buildSuccessionDevolutionAnalysis>;
  directDisplayAnalysis: ReturnType<typeof buildSuccessionDirectDisplayAnalysis>;
  patrimonialAnalysis: ReturnType<typeof buildSuccessionPatrimonialAnalysis>;
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
  donationsContext: SuccessionDonationEntry[];
}

export function useSuccessionOutcomeAssumptions({
  canExport,
  shouldRenderSuccessionComputationSections,
  displayActifNetSuccession,
  displayUsesChainage,
  liquidationContext,
  assuranceVieTotals,
  perTotals,
  prevoyanceTotals,
  fiscalSnapshot,
  predecesAnalysis,
  chainageAnalysis,
  usufruitSuccessifAnalysis,
  devolutionAnalysis,
  directDisplayAnalysis,
  patrimonialAnalysis,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
  donationsContext,
}: UseSuccessionOutcomeAssumptionsInput) {
  const totalActifsLiquidation = useMemo(
    () =>
      Math.max(
        0,
        liquidationContext.actifEpoux1 +
          liquidationContext.actifEpoux2 +
          liquidationContext.actifCommun,
      ),
    [liquidationContext],
  );

  const canExportSimplified =
    shouldRenderSuccessionComputationSections &&
    (displayActifNetSuccession > 0 ||
      totalActifsLiquidation > 0 ||
      assuranceVieTotals.capitaux > 0 ||
      perTotals.capitaux > 0 ||
      prevoyanceTotals.capitaux > 0);
  const canExportCurrentMode = canExport && canExportSimplified;

  const attentions = useMemo(() => {
    if (!shouldRenderSuccessionComputationSections) return [];
    const seen = new Set<string>();
    return [
      ...predecesAnalysis.warnings,
      ...chainageAnalysis.warnings,
      ...usufruitSuccessifAnalysis.warnings,
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
    usufruitSuccessifAnalysis.warnings,
    devolutionAnalysis.warnings,
    displayUsesChainage,
    directDisplayAnalysis.warnings,
    patrimonialAnalysis.warnings,
    avFiscalAnalysis.warnings,
    perFiscalAnalysis.warnings,
    prevoyanceFiscalAnalysis.warnings,
  ]);

  const assumptions = useMemo(
    () =>
      buildSuccessionAssumptions({
        fiscalSnapshot,
        attentions,
        hasInterMassClaims: (chainageAnalysis.interMassClaims?.totalAppliedAmount ?? 0) > 0,
        hasAffectedLiabilities: (chainageAnalysis.affectedLiabilities?.totalAmount ?? 0) > 0,
        hasDonationsPartage: patrimonialAnalysis.donationsPartagees > 0,
        hasUsufruitSuccessif:
          usufruitSuccessifAnalysis.transmissions.length > 0 ||
          donationsContext.some(
            (donation) => donation.avecReserveUsufruit && donation.usufruitSuccessif,
          ),
        usufruitSuccessifAnalysis,
      }),
    [
      fiscalSnapshot,
      attentions,
      chainageAnalysis.interMassClaims?.totalAppliedAmount,
      chainageAnalysis.affectedLiabilities?.totalAmount,
      patrimonialAnalysis.donationsPartagees,
      usufruitSuccessifAnalysis,
      donationsContext,
    ],
  );

  return {
    totalActifsLiquidation,
    canExportSimplified,
    canExportCurrentMode,
    attentions,
    assumptions,
  };
}
