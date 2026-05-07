/**
 * Types PPTX du simulateur Crédit.
 */

export type LoanSummary = {
  index: number;
  capital: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  quotite?: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutInterets: number;
  coutAssurance: number;
  amortizationRows?: CreditAmortizationRow[];
  startYM?: string;
  dateEffet?: string;
};

export type PaymentPeriod = {
  label: string;
  mensualitePret1: number;
  mensualitePret2: number;
  mensualitePret3: number;
  total: number;
  monthIndex?: number;
};

export type CreditGlobalSynthesisSlideSpec = {
  type: 'credit-global-synthesis';
  totalCapital: number;
  maxDureeMois: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  assuranceDecesByYear?: number[];
  loans: LoanSummary[];
  paymentPeriods: PaymentPeriod[];
  smoothingEnabled: boolean;
  smoothingMode?: 'mensu' | 'duree';
  startYM?: string;
};

export type CreditLoanSynthesisSlideSpec = {
  type: 'credit-loan-synthesis';
  loanIndex: number;
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  dateEffet?: string;
};

export type CreditSynthesisSlideSpec = {
  type: 'credit-synthesis';
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  startYM?: string;
  assuranceDecesByYear?: number[];
};

export type CreditAnnexeSlideSpec = {
  type: 'credit-annexe';

  totalCapital: number;
  maxDureeMois: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  totalRembourse: number;

  loans: LoanSummary[];

  smoothingEnabled: boolean;
  smoothingMode?: 'mensu' | 'duree';

  capitalEmprunte?: number;
  dureeMois?: number;
  tauxNominal?: number;
  tauxAssurance?: number;
  mensualiteHorsAssurance?: number;
  mensualiteTotale?: number;
  creditType?: 'amortissable' | 'infine';
  assuranceMode?: 'CI' | 'CRD';
};

export type CreditAmortizationRow = {
  loanIndex?: number;
  periode: string;
  interet: number;
  assurance: number;
  amort: number;
  annuite: number;
  annuiteTotale: number;
  crd: number;
};

export type CreditAmortizationSlideSpec = {
  type: 'credit-amortization';
  allRows: CreditAmortizationRow[];
  yearsForPage: string[];
  pageIndex: number;
  totalPages: number;

  rows?: CreditAmortizationRow[];
};
