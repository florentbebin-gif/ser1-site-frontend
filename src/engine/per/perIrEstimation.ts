/**
 * perIrEstimation — Wrapper around src/engine/ir/compute.ts
 *
 * Delegates IR calculation to the existing IR engine.
 * Never recodes IR logic — just maps PER inputs to IR engine inputs.
 */

import { computeIrResult } from '../ir/compute';
import { computeAbattement10 } from '../ir/adjustments';
import type { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../constants/settingsDefaults';
import type { PerYearKey, SituationFiscaleInput, SituationFiscaleResult } from './types';

export interface IrEstimationParams {
  situationFiscale: SituationFiscaleInput;
  deductionsPer: number;
  taxSettings: typeof DEFAULT_TAX_SETTINGS;
  psSettings: typeof DEFAULT_PS_SETTINGS;
  yearKey?: PerYearKey;
}

/**
 * Estimate IR using the repo's IR engine.
 * Returns TMI, IR, décote, CEHR, and remaining margin in TMI bracket.
 */
export function estimerSituationFiscale(params: IrEstimationParams): SituationFiscaleResult {
  const { situationFiscale, deductionsPer, taxSettings, psSettings, yearKey = 'current' } = params;
  const { declarant1, declarant2, situationFamiliale, nombreParts, isole } = situationFiscale;

  const d1 = declarant1;
  const d2 = declarant2;

  const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
  const abat10SalCfg = yearKey === 'current' ? abat10CfgRoot.current : abat10CfgRoot.previous;
  const abat10RetCfg = yearKey === 'current' ? abat10CfgRoot.retireesCurrent : abat10CfgRoot.retireesPrevious;

  const grossSalD1 = (d1.salaires || 0) + (d1.art62 || 0);
  const grossSalD2 = (d2?.salaires || 0) + (d2?.art62 || 0);

  const salDeductionD1 = d1.fraisReels
    ? Math.max(0, d1.fraisReelsMontant || 0)
    : computeAbattement10(grossSalD1, abat10SalCfg);
  const salDeductionD2 = d2
    ? d2.fraisReels
      ? Math.max(0, d2.fraisReelsMontant || 0)
      : computeAbattement10(grossSalD2, abat10SalCfg)
    : 0;

  const grossPensions = (d1.retraites || 0) + (d2?.retraites || 0);
  const pensionsDeductionFoyer = computeAbattement10(grossPensions, abat10RetCfg);
  const pensionShareD1 = grossPensions > 0 ? (d1.retraites || 0) / grossPensions : 0;
  const pensionShareD2 = grossPensions > 0 ? (d2?.retraites || 0) / grossPensions : 0;
  const pensionsDeductionD1 = pensionsDeductionFoyer * pensionShareD1;
  const pensionsDeductionD2 = pensionsDeductionFoyer * pensionShareD2;

  const fonciersFoyer = (d1.fonciersNets || 0) + (d2?.fonciersNets || 0);
  const extraDeductions = salDeductionD1 + salDeductionD2 + pensionsDeductionFoyer;

  const irResult = computeIrResult({
    yearKey,
    status: situationFamiliale === 'marie' ? 'couple' : 'single',
    isIsolated: isole,
    parts: nombreParts,
    incomes: {
      d1: {
        salaries: d1.salaires,
        associes62: d1.art62,
        pensions: d1.retraites,
        bic: d1.bic,
        autres: d1.autresRevenus,
      },
      d2: d2 ? {
        salaries: d2.salaires,
        associes62: d2.art62,
        pensions: d2.retraites,
        bic: d2.bic,
        autres: d2.autresRevenus,
      } : undefined,
      fonciersFoyer,
    },
    deductions: deductionsPer + extraDeductions,
    credits: 0,
    taxSettings,
    psSettings,
  });

  if (!irResult) {
    return {
      revenuImposableD1: 0,
      revenuImposableD2: 0,
      revenuFiscalRef: 0,
      tmi: 0,
      irEstime: 0,
      decote: 0,
      cehr: 0,
      montantDansLaTMI: 0,
    };
  }

  const revenuImposableD1 = Math.max(
    0,
    grossSalD1 - salDeductionD1 +
      Math.max(0, (d1.retraites || 0) - pensionsDeductionD1) +
      (d1.bic || 0) +
      (d1.fonciersNets || 0) +
      (d1.autresRevenus || 0),
  );

  const revenuImposableD2 = d2
    ? Math.max(
        0,
        grossSalD2 - salDeductionD2 +
          Math.max(0, (d2.retraites || 0) - pensionsDeductionD2) +
          (d2.bic || 0) +
          (d2.fonciersNets || 0) +
          (d2.autresRevenus || 0),
      )
    : 0;

  return {
    revenuImposableD1: Math.round(revenuImposableD1),
    revenuImposableD2: Math.round(revenuImposableD2),
    revenuFiscalRef: irResult.totalIncome,
    tmi: (irResult.tmiRate || 0) / 100,
    irEstime: irResult.irNet,
    decote: irResult.decote,
    cehr: irResult.cehr,
    montantDansLaTMI: irResult.tmiMarginGlobal ?? 0,
  };
}
