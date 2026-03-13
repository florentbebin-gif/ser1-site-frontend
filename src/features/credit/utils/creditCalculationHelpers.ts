import type { LoanParams } from '../../../engine/credit/capitalDeces';
import type {
  CreditLoan,
  CreditLoanParams,
  CreditScheduleRow,
  CreditShiftedScheduleRow,
  CreditState,
} from '../types';
import { toNum } from './creditFormatters';

export function shiftRows(
  rows: CreditScheduleRow[],
  offset: number,
): CreditShiftedScheduleRow[] {
  if (offset === 0) return rows.slice();
  if (offset > 0) {
    return [
      ...Array.from({ length: offset }, (): CreditShiftedScheduleRow => null),
      ...rows,
    ];
  }
  return rows.slice(-offset);
}

export function buildLoanParams(
  loan: CreditLoan | null,
  state: CreditState,
  fallbackStartYM: string,
): CreditLoanParams | null {
  if (!loan) return null;

  const rAn = Math.max(0, Number(loan.taux) || 0) / 100;
  const rAss = Math.max(0, Number(loan.tauxAssur) || 0) / 100;

  return {
    ...loan,
    capital: Math.max(0, toNum(loan.capital)),
    duree: Math.max(1, Math.floor(toNum(loan.duree) || 0)),
    rAn,
    rAss,
    r: rAn / 12,
    rA: rAss / 12,
    type: loan.type || state.creditType || 'amortissable',
    assurMode: loan.assurMode || state.assurMode || 'CRD',
    quotite: (loan.quotite ?? 100) / 100,
    startYM: loan.startYM || fallbackStartYM,
  };
}

export function buildRequiredLoanParams(
  loan: CreditLoan,
  state: CreditState,
  fallbackStartYM: string,
): CreditLoanParams {
  return buildLoanParams(loan, state, fallbackStartYM)!;
}

export function buildCapitalDecesParams(loan: CreditLoanParams): LoanParams {
  return {
    capital: loan.capital,
    tauxAssur: loan.rAss * 100 * 12,
    assurMode: loan.assurMode,
    quotite: loan.quotite,
  };
}
