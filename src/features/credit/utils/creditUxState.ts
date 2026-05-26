import type { CreditSynthesis } from '../types';

interface CreditActiveSynthesisInput {
  isExpert: boolean;
  hasAdditionalLoans: boolean;
  activeTab: number;
  perLoanSyntheses: Array<CreditSynthesis | null>;
  totalSynthesis: CreditSynthesis;
}

export function getCreditActiveSynthesis({
  isExpert,
  hasAdditionalLoans,
  activeTab,
  perLoanSyntheses,
  totalSynthesis,
}: CreditActiveSynthesisInput): CreditSynthesis {
  if (!isExpert || !hasAdditionalLoans) return totalSynthesis;
  return perLoanSyntheses[activeTab] ?? totalSynthesis;
}

export function hasCreditSynthesis(synthesis: CreditSynthesis | null | undefined): boolean {
  return (synthesis?.capitalEmprunte ?? 0) > 0;
}
