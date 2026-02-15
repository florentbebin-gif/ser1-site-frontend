import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../constants/settingsDefaults';
import { computeAbattement10 } from './abattement10.js';
import { computeEffectiveParts } from './effectiveParts.js';

export function computeIrFromExcelCase(excelCaseInput, { computeIrResult } = {}) {
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

  const effectiveParts = computeEffectiveParts({ status, isIsolated, childrenCount });

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
    parts: result.partsNb,
    qfIsCapped: Boolean(result.qfIsCapped),
  };
}
