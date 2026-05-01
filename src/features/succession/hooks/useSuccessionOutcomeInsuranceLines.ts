import type { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import type { SuccessionPrimarySide } from '../successionDraft.types';
import type { buildSuccessionPerFiscalAnalysis } from '../successionPerFiscal';
import type { buildSuccessionPrevoyanceFiscalAnalysis } from '../successionPrevoyanceFiscal';
import { mergeInsuranceBeneficiaryLines } from './useSuccessionOutcomeDerivedValues.helpers';

type InsuranceLines = ReturnType<typeof mergeInsuranceBeneficiaryLines>;

const EMPTY_INSURANCE_LINES: InsuranceLines = {
  lines990I: [],
  lines757B: [],
};

function getOtherSide(side: SuccessionPrimarySide): SuccessionPrimarySide {
  return side === 'epoux1' ? 'epoux2' : 'epoux1';
}

interface BuildSuccessionOutcomeInsuranceLinesInput {
  shouldRenderSuccessionComputationSections: boolean;
  displayUsesChainage: boolean;
  chainageOrder: SuccessionPrimarySide;
  directSimulatedDeceased: SuccessionPrimarySide;
  avFiscalAnalysis: ReturnType<typeof buildSuccessionAvFiscalAnalysis>;
  perFiscalAnalysis: ReturnType<typeof buildSuccessionPerFiscalAnalysis>;
  prevoyanceFiscalAnalysis: ReturnType<typeof buildSuccessionPrevoyanceFiscalAnalysis>;
}

export function buildSuccessionOutcomeInsuranceLines({
  shouldRenderSuccessionComputationSections,
  displayUsesChainage,
  chainageOrder,
  directSimulatedDeceased,
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
}: BuildSuccessionOutcomeInsuranceLinesInput): {
  merged: InsuranceLines;
  byStep: {
    step1: InsuranceLines;
    step2: InsuranceLines;
  };
} {
  if (!shouldRenderSuccessionComputationSections) {
    return {
      merged: EMPTY_INSURANCE_LINES,
      byStep: {
        step1: EMPTY_INSURANCE_LINES,
        step2: EMPTY_INSURANCE_LINES,
      },
    };
  }

  if (!displayUsesChainage) {
    const merged = mergeInsuranceBeneficiaryLines(
      avFiscalAnalysis.byAssure[directSimulatedDeceased].lines,
      perFiscalAnalysis.byAssure[directSimulatedDeceased].lines,
      prevoyanceFiscalAnalysis.byAssure[directSimulatedDeceased].lines,
    );
    return {
      merged,
      byStep: {
        step1: merged,
        step2: EMPTY_INSURANCE_LINES,
      },
    };
  }

  const oppositeOrder = getOtherSide(chainageOrder);
  return {
    merged: mergeInsuranceBeneficiaryLines(
      avFiscalAnalysis.lines,
      perFiscalAnalysis.lines,
      prevoyanceFiscalAnalysis.lines,
    ),
    byStep: {
      step1: mergeInsuranceBeneficiaryLines(
        avFiscalAnalysis.byAssure[chainageOrder].lines,
        perFiscalAnalysis.byAssure[chainageOrder].lines,
        prevoyanceFiscalAnalysis.byAssure[chainageOrder].lines,
      ),
      step2: mergeInsuranceBeneficiaryLines(
        avFiscalAnalysis.byAssure[oppositeOrder].lines,
        perFiscalAnalysis.byAssure[oppositeOrder].lines,
        prevoyanceFiscalAnalysis.byAssure[oppositeOrder].lines,
      ),
    },
  };
}
