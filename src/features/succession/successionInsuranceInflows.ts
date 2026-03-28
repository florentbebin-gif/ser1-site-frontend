import type { SuccessionAvFiscalAnalysis } from './successionAvFiscal';
import type { SuccessionPerFiscalAnalysis } from './successionPerFiscal';
import type { SuccessionPrevoyanceFiscalAnalysis } from './successionPrevoyanceFiscal';
import type { SuccessionChainOrder } from './successionChainage';

interface BeneficiaryLineLike {
  id: string;
  netTransmis: number;
  isUsufruitDemembre?: boolean;
}

interface AssureAnalysisLike {
  byAssure: Record<'epoux1' | 'epoux2', { lines: BeneficiaryLineLike[] }>;
}

function sumSurvivingSpouseInflows(
  analysis: AssureAnalysisLike,
  order: SuccessionChainOrder,
): number {
  return analysis.byAssure[order].lines
    .filter((line) => line.id === 'conjoint' && !line.isUsufruitDemembre)
    .reduce((sum, line) => sum + line.netTransmis, 0);
}

export function buildSuccessionSurvivorEconomicInflows({
  avFiscalAnalysis,
  perFiscalAnalysis,
  prevoyanceFiscalAnalysis,
}: {
  avFiscalAnalysis: SuccessionAvFiscalAnalysis;
  perFiscalAnalysis: SuccessionPerFiscalAnalysis;
  prevoyanceFiscalAnalysis: SuccessionPrevoyanceFiscalAnalysis;
}): Record<'epoux1' | 'epoux2', number> {
  return {
    epoux1: sumSurvivingSpouseInflows(avFiscalAnalysis, 'epoux1')
      + sumSurvivingSpouseInflows(perFiscalAnalysis, 'epoux1')
      + sumSurvivingSpouseInflows(prevoyanceFiscalAnalysis, 'epoux1'),
    epoux2: sumSurvivingSpouseInflows(avFiscalAnalysis, 'epoux2')
      + sumSurvivingSpouseInflows(perFiscalAnalysis, 'epoux2')
      + sumSurvivingSpouseInflows(prevoyanceFiscalAnalysis, 'epoux2'),
  };
}
