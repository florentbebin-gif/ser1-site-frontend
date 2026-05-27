import type PptxGenJS from 'pptxgenjs';

import type { BusinessIconName } from '@/pptx/icons/addBusinessIcon';

export interface CreditSynthesisData {
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
}

export type CreditSlide = ReturnType<PptxGenJS['addSlide']>;

export interface CreditKpi {
  icon: BusinessIconName;
  label: string;
  value: string;
  subValue?: string;
}
