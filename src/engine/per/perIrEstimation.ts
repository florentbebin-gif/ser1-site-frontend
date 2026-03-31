/**
 * perIrEstimation — Wrapper around src/engine/ir/compute.ts
 *
 * Delegates IR calculation to the existing IR engine.
 * Never recodes IR logic — just maps PER inputs to IR engine inputs.
 */

import { computeIrResult } from '../ir/compute';
import type { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../../constants/settingsDefaults';
import type { SituationFiscaleInput, SituationFiscaleResult } from './types';

export interface IrEstimationParams {
  situationFiscale: SituationFiscaleInput;
  deductionsPer: number;
  taxSettings: typeof DEFAULT_TAX_SETTINGS;
  psSettings: typeof DEFAULT_PS_SETTINGS;
  yearKey?: string;
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
        fonciers: d1.fonciersNets,
        autres: d1.autresRevenus,
      },
      d2: d2 ? {
        salaries: d2.salaires,
        associes62: d2.art62,
        pensions: d2.retraites,
        bic: d2.bic,
        fonciers: d2.fonciersNets,
        autres: d2.autresRevenus,
      } : undefined,
    },
    deductions: deductionsPer,
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

  return {
    revenuImposableD1: irResult.taxableIncome,
    revenuImposableD2: d2 ? irResult.taxableIncome : 0,
    revenuFiscalRef: irResult.totalIncome,
    tmi: irResult.tmiRate,
    irEstime: irResult.irNet,
    decote: irResult.decote,
    cehr: irResult.cehr,
    montantDansLaTMI: irResult.tmiMarginGlobal ?? 0,
  };
}
