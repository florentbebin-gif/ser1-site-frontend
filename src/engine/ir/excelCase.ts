import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../constants/settingsDefaults';
import { computeAbattement10 } from './abattement10';
import { computeEffectiveParts } from './effectiveParts';
import type { ExcelCaseResult } from './types';

interface ExcelCaseTaxSettings {
  incomeTax?: {
    abat10?: {
      current?: { plafond?: number; plancher?: number };
      previous?: { plafond?: number; plancher?: number };
    };
  };
}

interface ExcelCaseInput {
  salaireAvant10?: number | string;
  status?: string;
  isIsolated?: boolean;
  childrenCount?: number | string;
  location?: string;
  yearKey?: 'current' | 'previous';
  taxSettings?: ExcelCaseTaxSettings;
  psSettings?: typeof DEFAULT_PS_SETTINGS;
}

interface IrRawResult {
  irNet?: number;
  tmiRate?: number;
  tmiBaseGlobal?: number;
  tmiMarginGlobal?: number | null;
  taxableIncome?: number;
  partsNb?: number;
  qfIsCapped?: boolean;
}

type ComputeIrResultFn = (_params: Record<string, unknown>) => IrRawResult | null | undefined;

export function computeIrFromExcelCase(
  excelCaseInput: ExcelCaseInput | null | undefined,
  { computeIrResult }: { computeIrResult?: ComputeIrResultFn } = {},
): ExcelCaseResult | null {
  if (typeof computeIrResult !== 'function') return null;

  const {
    salaireAvant10,
    status,
    isIsolated,
    childrenCount,
    location = 'metropole',
    yearKey = 'current',
    taxSettings = DEFAULT_TAX_SETTINGS,
    psSettings = DEFAULT_PS_SETTINGS,
  } = excelCaseInput || {};

  const effectiveParts = computeEffectiveParts({
    status: status || 'single',
    isIsolated,
    childrenCount: Math.max(0, Number(childrenCount) || 0),
  });

  const incomes = {
    d1: { salaries: Number(salaireAvant10) || 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
    d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
    capital: { withPs: 0, withoutPs: 0 },
    fonciersFoyer: 0,
  };

  const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
  const abat10SalCfg = yearKey === 'current' ? abat10CfgRoot.current : abat10CfgRoot.previous;

  const baseSalD1 = (incomes.d1.salaries || 0) + (incomes.d1.associes62 || 0);
  const abat10SalD1 = computeAbattement10(baseSalD1, abat10SalCfg);

  const extraDeductions = abat10SalD1;

  const result = computeIrResult({
    yearKey,
    status,
    isIsolated,
    parts: effectiveParts,
    location,
    incomes,
    deductions: extraDeductions,
    credits: 0,
    taxSettings,
    psSettings,
    capitalMode: 'pfu',
    personsAChargeCount: Math.max(0, Number(childrenCount) || 0),
  });

  if (!result) return null;

  return {
    irTotal: Math.round(result.irNet || 0),
    tmiRateDisplay: Number(result.tmiRate) || 0,
    revenusDansTmi: Math.round(result.tmiBaseGlobal || 0),
    margeAvantChangement: result.tmiMarginGlobal == null ? null : Math.round(result.tmiMarginGlobal),
    taxableIncome: Math.round(result.taxableIncome || 0),
    parts: result.partsNb ?? 0,
    qfIsCapped: Boolean(result.qfIsCapped),
  };
}
