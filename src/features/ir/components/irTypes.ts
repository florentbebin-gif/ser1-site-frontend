import type { Dispatch, SetStateAction } from 'react';
import type { BracketDetail, CdhrDetails } from '@/engine/ir/types';
import type { FiscalContext } from '@/hooks/useFiscalContext';
import type { IncomeFilters, IrIncomes } from '../utils/incomeFilters';

export type IrYearKey = 'current' | 'previous';
export type IrStatus = 'single' | 'couple';
export type IrLocation = 'metropole' | 'gmr' | 'guyane';
export type IrCapitalMode = 'pfu' | 'bareme';
export type IrRealModeValue = 'abat10' | 'reels';
export type IrIncomeTarget = 'd1' | 'd2' | 'capital';

export interface IrRealMode {
  d1: IrRealModeValue;
  d2: IrRealModeValue;
}

export interface IrRealExpenses {
  d1: number;
  d2: number;
}

export interface IrChildDraft {
  id: number;
  mode: 'charge' | 'shared';
}

export interface IrComputedResult {
  totalIncome: number;
  taxableIncome: number;
  taxablePerPart: number;
  partsNb: number;
  irBeforeQfBase?: number;
  qfAdvantage?: number;
  irAfterQf?: number;
  domAbatementAmount?: number;
  decote?: number;
  creditsTotal?: number;
  irNet?: number;
  pfuIr?: number;
  cehr?: number;
  cehrDetails?: BracketDetail[];
  cdhr?: number;
  cdhrDetails?: CdhrDetails | null;
  psFoncier?: number;
  psDividends?: number;
  psTotal?: number;
  totalTax?: number;
  tmiRate?: number;
  tmiBaseGlobal: number;
  tmiMarginGlobal?: number | null;
  bracketsDetails?: BracketDetail[];
}

export type IrTaxSettings = FiscalContext['_raw_tax'];
export type IrScaleRow = IrTaxSettings['incomeTax']['scaleCurrent'][number];
export type IrSidebarTaxSettings = {
  incomeTax?: {
    currentYearLabel?: string;
    previousYearLabel?: string;
  };
};
export type IrSidebarScaleRow = Pick<IrScaleRow, 'rate'>;
export type IrStateSetter<T> = Dispatch<SetStateAction<T>>;
export type IrMoneyFormatter = (_value: number) => string;
export type IrPercentFormatter = (_value: number) => string;
export type IrInputMoneyFormatter = (_value: number | null | undefined) => string;

export interface IrFormSectionProps {
  status: IrStatus;
  setStatus: (_status: IrStatus) => void;
  isIsolated: boolean;
  setIsIsolated: (_value: boolean) => void;
  setIncomes: IrStateSetter<IrIncomes>;
  setParts: IrStateSetter<number>;
  incomes: IrIncomes;
  updateIncome: (_who: IrIncomeTarget, _field: string, _value: number) => void;
  formatMoneyInput: IrInputMoneyFormatter;
  realMode: IrRealMode;
  setRealModeState: IrStateSetter<IrRealMode>;
  realExpenses: IrRealExpenses;
  setRealExpensesState: IrStateSetter<IrRealExpenses>;
  abat10SalD1: number;
  abat10SalD2: number;
  psPatrimonyRate: number;
  fmtPct: IrPercentFormatter;
  capitalMode: IrCapitalMode;
  setCapitalMode: (_mode: IrCapitalMode) => void;
  pfuRateIR: number;
  deductions: number;
  setDeductions: (_value: number) => void;
  credits: number;
  setCredits: (_value: number) => void;
  abat10PensionsFoyer: number;
  euro0: IrMoneyFormatter;
  isExpert: boolean;
  children: IrChildDraft[];
  setChildren: IrStateSetter<IrChildDraft[]>;
  incomeFilters: IncomeFilters;
  setIncomeFilters: IrStateSetter<IncomeFilters>;
}

export interface IrSidebarSectionProps {
  yearKey: IrYearKey;
  setYearKey: (_yearKey: IrYearKey) => void;
  taxSettings: IrSidebarTaxSettings;
  location: IrLocation;
  setLocation: (_location: IrLocation) => void;
  setParts: IrStateSetter<number>;
  tmiScale: IrSidebarScaleRow[];
  result: IrComputedResult | null;
  euro0: IrMoneyFormatter;
  fmtPct: IrPercentFormatter;
  pfuRateIR: number;
  isExpert: boolean;
  showSummaryCard: boolean;
}
