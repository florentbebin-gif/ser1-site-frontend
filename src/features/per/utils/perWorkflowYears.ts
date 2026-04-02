import type { FiscalContext } from '../../../hooks/useFiscalContext';
import type { PerHistoricalBasis } from '../../../engine/per';

interface ParsedYearLabel {
  taxYear: number;
  incomeYear: number;
}

export interface PerWorkflowYears {
  currentTaxLabel: string;
  previousTaxLabel: string;
  currentTaxYear: number;
  currentIncomeYear: number;
  previousTaxYear: number;
  previousIncomeYear: number;
}

function parseYearLabel(label: string | undefined, fallbackTaxYear: number): ParsedYearLabel {
  const match = label?.match(/(\d{4}).*revenus\s+(\d{4})/i);
  if (match) {
    const taxYear = Number(match[1]);
    const incomeYear = Number(match[2]);
    if (!Number.isNaN(taxYear) && !Number.isNaN(incomeYear)) {
      return { taxYear, incomeYear };
    }
  }

  const fallbackMatch = label?.match(/(\d{4})/);
  const taxYear = fallbackMatch ? Number(fallbackMatch[1]) : fallbackTaxYear;
  return {
    taxYear,
    incomeYear: taxYear - 1,
  };
}

export function getPerWorkflowYears(
  fiscalContext: Pick<FiscalContext, 'irCurrentYearLabel' | 'irPreviousYearLabel'>,
): PerWorkflowYears {
  const fallbackCurrentYear = new Date().getFullYear();
  const current = parseYearLabel(fiscalContext.irCurrentYearLabel, fallbackCurrentYear);
  const previous = parseYearLabel(fiscalContext.irPreviousYearLabel, current.taxYear - 1);

  return {
    currentTaxLabel: fiscalContext.irCurrentYearLabel || `${current.taxYear} (revenus ${current.incomeYear})`,
    previousTaxLabel: fiscalContext.irPreviousYearLabel || `${previous.taxYear} (revenus ${previous.incomeYear})`,
    currentTaxYear: current.taxYear,
    currentIncomeYear: current.incomeYear,
    previousTaxYear: previous.taxYear,
    previousIncomeYear: previous.incomeYear,
  };
}

export function getAvisReferenceYears(
  years: PerWorkflowYears,
  basis: PerHistoricalBasis,
): {
  taxYear: number;
  incomeYear: number;
  carryForwardYears: [number, number, number];
} {
  const incomeYear = basis === 'current-avis' ? years.currentIncomeYear : years.previousIncomeYear;
  const taxYear = basis === 'current-avis' ? years.currentTaxYear : years.previousTaxYear;

  return {
    taxYear,
    incomeYear,
    carryForwardYears: [incomeYear - 2, incomeYear - 1, incomeYear],
  };
}
