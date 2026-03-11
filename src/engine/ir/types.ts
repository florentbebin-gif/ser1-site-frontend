/** Types partagés du moteur IR — créés PR-P1-08-01. */

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
}

export type TaxScale = TaxBracket[];

export interface BracketDetail {
  label: string;
  base: number;
  rate: number;
  tax: number;
}

export interface ProgressiveTaxResult {
  taxPerPart: number;
  tmiRate: number;
  tmiBasePerPart: number;
  tmiBracketTo: number | null;
  bracketsDetails: BracketDetail[];
}

export interface IrChild {
  mode: 'charge' | 'shared';
}

export interface SocialContribResult {
  psRateTotal: number;
  psFoncier: number;
  psDividends: number;
  psTotal: number;
}

export interface CehrResult {
  cehr: number;
  cehrDetails: BracketDetail[];
}

export interface CdhrDetails {
  assiette: number;
  threshold: number;
  minRatePercent: number;
  decoteMaxAssiette: number;
  slopePercent: number;
  termA_beforeDecote: number;
  decoteApplied: number;
  termA_afterDecote: number;
  termB: number;
  irRetenu: number;
  cehr: number;
  pfuIr: number;
  majorations: number;
  majCouple: number;
  majCharges: number;
  personsAChargeCount: number;
}

export interface CdhrResult {
  cdhr: number;
  cdhrDetails: CdhrDetails | null;
}

export interface QfCappingResult {
  irBeforeQfBase: number;
  qfAdvantage: number;
  irAfterQf: number;
  qfIsCapped: boolean;
  basePartsForQf: number;
  extraParts: number;
  extraHalfParts: number;
  plafondPartSup: number;
  plafondParentIso2: number;
}

export interface CapitalBasesResult {
  capTotal: number;
  capitalBaseBareme: number;
  capitalBasePfu: number;
}

export interface EffectivePartsFullResult {
  baseParts: number;
  computedParts: number;
  effectiveParts: number;
}

export interface ExcelCaseResult {
  irTotal: number;
  tmiRateDisplay: number;
  revenusDansTmi: number;
  margeAvantChangement: number | null;
  taxableIncome: number;
  parts: number;
  qfIsCapped: boolean;
}
