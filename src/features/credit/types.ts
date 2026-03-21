import type { Dispatch, SetStateAction } from 'react';
import type { ExportOption } from '../../components/ExportMenu';
import type { LoanParams, ScheduleRow } from '../../engine/credit/capitalDeces';
import type { CreditData, UiSettingsForPptx } from '../../pptx/presets/creditDeckBuilder';
import type { LogoPlacement } from '../../pptx/theme/types';

export type CreditAssurMode = 'CI' | 'CRD';
export type CreditType = 'amortissable' | 'infine';
export type CreditViewMode = 'mensuel' | 'annuel';
export type CreditLissageMode = 'mensu' | 'duree';
export type CreditLocalMode = 'expert' | 'simplifie' | null;

export interface CreditLoan {
  id?: string;
  capital: number;
  duree: number;
  taux: number;
  tauxAssur: number;
  quotite: number;
  type: CreditType;
  startYM: string | null;
  assurMode?: CreditAssurMode;
}

export interface CreditTouchedState {
  capital: boolean;
  duree: boolean;
}

export interface CreditRawLoanValues {
  taux: string;
  tauxAssur: string;
  quotite: string;
}

export interface CreditRawValues {
  pret1?: CreditRawLoanValues;
  pret2?: CreditRawLoanValues;
  pret3?: CreditRawLoanValues;
}

export interface CreditState {
  startYM: string;
  assurMode: CreditAssurMode;
  creditType: CreditType;
  viewMode: CreditViewMode;
  pret1: CreditLoan | null;
  pret2: CreditLoan | null;
  pret3: CreditLoan | null;
  lisserPret1: boolean;
  lissageMode: CreditLissageMode;
  activeTab: number;
  touched: CreditTouchedState;
}

export interface CreditPersistedState {
  startYM: string;
  assurMode: CreditAssurMode;
  creditType: CreditType;
  viewMode: CreditViewMode;
  pret1: CreditLoan | null;
  pret2: CreditLoan | null;
  pret3: CreditLoan | null;
  lisserPret1: boolean;
  lissageMode: CreditLissageMode;
}

export interface CreditLegacyState {
  startYM?: string | null;
  assurMode?: CreditAssurMode;
  creditType?: CreditType;
  viewMode?: CreditViewMode;
  lisserPret1?: boolean;
  lissageMode?: CreditLissageMode;
  capital?: number;
  duree?: number;
  taux?: number;
  tauxAssur?: number;
  quotite?: number;
  pret1?: Partial<CreditLoan>;
  pret2?: Partial<CreditLoan> | null;
  pret3?: Partial<CreditLoan> | null;
  pretsPlus?: Array<Partial<CreditLoan>>;
}

export interface CreditLoanParams extends LoanParams {
  duree: number;
  rAn: number;
  rAss: number;
  r: number;
  rA: number;
  type: CreditType;
  assurMode: CreditAssurMode;
  quotite: number;
  startYM: string;
}

export type CreditScheduleRow = ScheduleRow;
export type CreditShiftedScheduleRow = ScheduleRow | null;

export interface CreditSynthesis {
  totalInterets: number;
  totalAssurance: number;
  coutTotalCredit: number;
  mensualiteTotaleM1: number;
  primeAssMensuelle: number;
  capitalEmprunte: number;
  diffDureesMois: number;
}

export interface CreditPeriodSummary {
  from: string;
  p1: number;
  p2: number;
  p3: number;
  monthIndex: number;
}

export interface CreditCalcResult {
  pret1Rows: CreditScheduleRow[];
  pret2Rows: CreditShiftedScheduleRow[];
  pret3Rows: CreditShiftedScheduleRow[];
  agrRows: CreditScheduleRow[];
  pret1Params: CreditLoanParams;
  autresParams: CreditLoanParams[];
  anyInfine: boolean;
  pret1IsInfine: boolean;
  autresIsInfine: boolean[];
  hasPretsAdditionnels: boolean;
  synthese: CreditSynthesis;
  synthesePeriodes: CreditPeriodSummary[];
  dureeBaseMois: number;
  dureeLisseMois: number;
  diffDureesMois: number;
  mensuBasePret1: number;
}

export type CreditThemeColors = {
  c1?: string;
  c7?: string;
} | null | undefined;

export interface CreditExportHookParams {
  state: CreditState;
  calc: CreditCalcResult;
  themeColors?: CreditThemeColors;
  cabinetLogo?: string;
  logoPlacement?: LogoPlacement;
  pptxColors: UiSettingsForPptx;
  setExportLoading: Dispatch<SetStateAction<boolean>>;
}

export type CreditExportOption = ExportOption;
export type CreditPptxData = CreditData;

export interface CreditHeaderProps {
  exportOptions: ExportOption[];
  exportLoading: boolean;
  isExpert: boolean;
  onToggleMode: () => void;
}

export interface CreditLoanTabsProps {
  activeTab: number;
  onChangeTab: (_tabIndex: number) => void;
  hasPret2: boolean;
  hasPret3: boolean;
  onAddPret2: () => void;
  onAddPret3: () => void;
  onRemovePret2: () => void;
  onRemovePret3: () => void;
  isExpert?: boolean;
}

export interface CreditLoanFormProps {
  pretNum: number;
  pretData: CreditLoan | null;
  rawValues?: CreditRawLoanValues;
  globalStartYM: string;
  globalAssurMode: CreditAssurMode;
  globalCreditType: CreditType;
  onPatch: (_patch: Partial<CreditLoan>) => void;
  formatTauxRaw: (_value: number | null | undefined) => string;
  isExpert?: boolean;
}

export interface SummaryDonutProps {
  capital: number;
  interets: number;
  capitalColor?: string;
}

export interface CreditSummaryCardProps {
  synthese: CreditSynthesis;
  isAnnual: boolean;
  lisserPret1: boolean;
  isExpert?: boolean;
  loanLabel?: string;
  lissageCoutDelta?: number;
}

export interface CreditPeriodsTableProps {
  synthesePeriodes: CreditPeriodSummary[];
  hasPret3: boolean;
}

export interface CreditScheduleTableProps {
  rows: Array<CreditScheduleRow | null>;
  startYM: string;
  isAnnual: boolean;
  title?: string;
  defaultCollapsed?: boolean;
  hideInsurance?: boolean;
}

export interface InputEuroProps {
  label?: string;
  value: number;
  onChange: (_value: number) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  dataTestId?: string;
  onBlur?: () => void;
  highlight?: boolean;
}

export interface InputPctProps {
  label?: string;
  rawValue?: string;
  onBlur?: (_value: number) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  placeholder?: string;
  highlight?: boolean;
}

export interface InputNumberProps {
  label?: string;
  value: number;
  onChange: (_value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
  onBlur?: () => void;
  highlight?: boolean;
}

export interface InputMonthProps {
  label?: string;
  value: string;
  onChange: (_value: string) => void;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
}

export interface SelectOption<TValue extends string | number = string> {
  value: TValue;
  label: string;
}

export interface SelectProps<TValue extends string | number = string> {
  label?: string;
  value: TValue;
  onChange: (_value: TValue) => void;
  options?: Array<SelectOption<TValue>>;
  disabled?: boolean;
  hint?: string;
  error?: string;
  testId?: string;
}

export interface ToggleProps {
  checked: boolean;
  onChange: (_value: boolean) => void;
  label?: string;
  disabled?: boolean;
  testId?: string;
}
