import type { PerHistoricalBasis, PerYearKey } from '../../../engine/per';
import type { PerWorkflowYears } from './perWorkflowYears';

type PerCalculationMode = 'versement-n' | 'declaration-n1' | null;
type PerCalculationStep = 1 | 2 | 3 | 4 | 5;

interface PerCalculationYearParams {
  step: PerCalculationStep;
  mode: PerCalculationMode;
  historicalBasis: PerHistoricalBasis | null;
  useProjection: boolean;
  years: PerWorkflowYears;
}

export interface PerCalculationYear {
  anneeRef: number;
  yearKey: PerYearKey;
}

function resolveYearKey(anneeRef: number, years: PerWorkflowYears): PerYearKey {
  if (anneeRef === years.previousTaxYear) {
    return 'previous';
  }

  return 'current';
}

export function resolvePerCalculationYear({
  mode,
  historicalBasis,
  useProjection,
  years,
}: PerCalculationYearParams): PerCalculationYear {
  const anneeRef = useProjection || (mode === 'versement-n' && historicalBasis === 'current-avis')
    ? years.currentTaxYear
    : years.currentIncomeYear;

  return {
    anneeRef,
    yearKey: resolveYearKey(anneeRef, years),
  };
}
