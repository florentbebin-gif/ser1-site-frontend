/**
 * Types PPTX du simulateur IR.
 */

export type IrSynthesisSlideSpec = {
  type: 'ir-synthesis';
  income1: number;
  income2: number;
  isCouple: boolean;
  taxableIncome: number;
  partsNb: number;
  tmiRate: number;
  irNet: number;
  taxablePerPart: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;

  tmiBaseGlobal?: number;
  tmiMarginGlobal?: number | null;
};

export type IrAnnexeSlideSpec = {
  type: 'ir-annexe';
  taxableIncome: number;
  partsNb: number;
  taxablePerPart: number;
  tmiRate: number;
  irNet: number;
  totalTax: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  decote?: number;
  qfAdvantage?: number;
  creditsTotal?: number;
  pfuIr?: number;
  cehr?: number;
  cdhr?: number;
  psFoncier?: number;
  psDividends?: number;
  psTotal?: number;
  isCouple?: boolean;
  childrenCount?: number;
};
