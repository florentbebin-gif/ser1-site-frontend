import { computeTmiMetrics } from './tmiMetrics';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../constants/settingsDefaults';
import { computeAutoPartsWithChildren } from '../engine/ir/parts';
import { computeProgressiveTax } from '../engine/ir/progressiveTax';
import { computeCEHR } from '../engine/ir/cehr';
import { computeCDHR } from '../engine/ir/cdhr';
import { computeEffectiveParts } from '../engine/ir/effectiveParts';
import { computeDomAbatementAmount } from '../engine/ir/domAbatement';
import { computeDecote } from '../engine/ir/decote';
import { computeCapitalBases, computePfuIr } from '../engine/ir/capital';
import { computeQuotientFamilyCapping } from '../engine/ir/quotientFamily';
import { computeSocialContributions } from '../engine/ir/socialContributions';
import { computeIrFromExcelCase as computeIrFromExcelCaseImpl } from '../engine/ir/excelCase';
import type { BracketDetail, CdhrDetails, ExcelCaseResult } from '../engine/ir/types';

// Re-export pour les consommateurs historiques (importé depuis settingsDefaults)
export { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS };

// Back-compat export (moved to engine/ir/parts.ts)
export { computeAutoPartsWithChildren };

// Back-compat export (moved to engine/ir/effectiveParts.ts)
export { computeEffectiveParts };

interface IncomeDeclarant {
  salaries?: number;
  associes62?: number;
  pensions?: number;
  bic?: number;
  fonciers?: number;
  autres?: number;
}

interface IncomeCapital {
  withPs?: number;
  withoutPs?: number;
}

interface IrIncomes {
  d1: IncomeDeclarant;
  d2?: IncomeDeclarant;
  capital?: IncomeCapital;
  fonciersFoyer?: number;
}

interface IrResultInput {
  yearKey?: string;
  status?: string;
  isIsolated?: boolean;
  parts?: number;
  location?: string;
  incomes: IrIncomes;
  deductions?: number;
  credits?: number;
  taxSettings?: typeof DEFAULT_TAX_SETTINGS | null;
  psSettings?: typeof DEFAULT_PS_SETTINGS | null;
  capitalMode?: string;
  personsAChargeCount?: number;
}

interface IrResult {
  totalIncome: number;
  taxableIncome: number;
  taxablePerPart: number;
  partsNb: number;
  irBeforeQfBase: number;
  qfAdvantage: number;
  irAfterQf: number;
  domAbatementAmount: number;
  decote: number;
  creditsTotal: number;
  irNet: number;
  pfuIr: number;
  cehr: number;
  cehrDetails: BracketDetail[];
  cdhr: number;
  cdhrDetails: CdhrDetails | null;
  psFoncier: number;
  psDividends: number;
  psTotal: number;
  totalTax: number;
  tmiRate: number;
  tmiBaseGlobal: number;
  tmiMarginGlobal: number | null;
  qfIsCapped: boolean;
}

export function computeIrResult({
  yearKey,
  status,
  isIsolated,
  parts,
  location,
  incomes,
  deductions,
  credits,
  taxSettings,
  psSettings,
  capitalMode,
  personsAChargeCount,
}: IrResultInput): IrResult | null {
  if (!taxSettings) return null;

  const isCouple = status === 'couple';

  const incomeTaxCfg = taxSettings.incomeTax || {};
  const scale = yearKey === 'current' ? incomeTaxCfg.scaleCurrent || [] : incomeTaxCfg.scalePrevious || [];

  const cehrCfg = taxSettings.cehr || {};
  const cehrYearCfg = (cehrCfg as Record<string, typeof cehrCfg.current>)[yearKey ?? 'current'] || {};
  const cehrBrackets = (cehrYearCfg as typeof cehrCfg.current)[isCouple ? 'couple' : 'single'] || [];

  const cdhrYearCfg = taxSettings.cdhr as Record<string, typeof taxSettings.cdhr.current>;
  const cdhrCfg = cdhrYearCfg && cdhrYearCfg[yearKey ?? 'current'] ? cdhrYearCfg[yearKey ?? 'current'] : null;

  const decoteCfgRoot = incomeTaxCfg.decote || {};
  const decoteYearCfg = (decoteCfgRoot as Record<string, typeof decoteCfgRoot.current>)[yearKey ?? 'current'] || {};

  const qfCfgRoot = incomeTaxCfg.quotientFamily || {};
  const qfYearCfg = yearKey === 'current' ? qfCfgRoot.current || {} : qfCfgRoot.previous || {};

  const patrimonyCfg = psSettings?.patrimony
    ? ((psSettings.patrimony as Record<string, unknown>)[yearKey ?? 'current'] ?? null)
    : null;

  const partsNb = Math.max(0.5, Number(parts) || 1);

  const totalIncomeD1 =
    (incomes.d1.salaries || 0) +
    (incomes.d1.associes62 || 0) +
    (incomes.d1.pensions || 0) +
    (incomes.d1.bic || 0) +
    (incomes.d1.autres || 0);

  const totalIncomeD2 = isCouple
    ? ((incomes.d2?.salaries || 0) +
      (incomes.d2?.associes62 || 0) +
      (incomes.d2?.pensions || 0) +
      (incomes.d2?.bic || 0) +
      (incomes.d2?.autres || 0))
    : 0;

  const capWithPs = incomes.capital?.withPs || 0;
  const capWithoutPs = incomes.capital?.withoutPs || 0;
  const modeCap = (capitalMode === 'bareme' ? 'bareme' : 'pfu') as 'bareme' | 'pfu';

  const { capitalBaseBareme, capitalBasePfu } = computeCapitalBases({
    capWithPs,
    capWithoutPs,
    modeCap,
  });

  const baseRevenusBareme =
    totalIncomeD1 +
    totalIncomeD2 +
    (incomes.fonciersFoyer || 0) +
    capitalBaseBareme;

  const deductionsTotal = Math.max(0, deductions || 0);
  const creditsTotal = Math.max(0, credits || 0);

  const taxableIncome = Math.max(0, baseRevenusBareme - deductionsTotal);
  const taxablePerPart = partsNb > 0 ? taxableIncome / partsNb : taxableIncome;

  const totalIncome = baseRevenusBareme + capitalBasePfu;

  const { taxPerPart } = computeProgressiveTax(scale, taxablePerPart);

  const irBrutFoyerSansPlafond = taxPerPart * partsNb;
  const {
    irBeforeQfBase,
    qfAdvantage,
    irAfterQf,
    qfIsCapped,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
  } = computeQuotientFamilyCapping({
    scale,
    taxableIncome,
    partsNb,
    isCouple,
    isIsolated: isIsolated ?? false,
    qfYearCfg,
    irSansPlafond: irBrutFoyerSansPlafond,
  });

  let irBrutFoyer = irAfterQf;

  const domAbatementAmount = computeDomAbatementAmount({
    location: location ?? 'metropole',
    yearKey: yearKey ?? 'current',
    domAbatementCfgRoot: incomeTaxCfg.domAbatement,
    irAfterQf,
  });

  irBrutFoyer = Math.max(0, irAfterQf - domAbatementAmount);

  const decote = computeDecote({ isCouple, decoteYearCfg, irBrutFoyer });

  const irNet = Math.max(0, irBrutFoyer - creditsTotal - decote);

  const pfuIr = computePfuIr({ capitalBasePfu, yearKey: yearKey ?? 'current', taxSettings });

  const rfr = taxableIncome + capitalBasePfu;

  const { cehr, cehrDetails } = computeCEHR(cehrBrackets, rfr);

  const { cdhr, cdhrDetails } = computeCDHR(
    cdhrCfg,
    rfr,
    irBrutFoyer,
    pfuIr,
    cehr,
    isCouple,
    personsAChargeCount ?? 0,
  );

  const { psFoncier, psDividends, psTotal } = computeSocialContributions({
    patrimonyCfg,
    fonciersBase: incomes.fonciersFoyer || 0,
    capWithPs,
  });

  const tmiMetrics = computeTmiMetrics(taxableIncome, {
    scale,
    partsNb,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
    isCouple,
    isIsolated: isIsolated ?? false,
  });

  const totalTax = irNet + pfuIr + cehr + cdhr + psTotal;

  return {
    totalIncome,
    taxableIncome,
    taxablePerPart,
    partsNb,

    irBeforeQfBase,
    qfAdvantage,
    irAfterQf,
    domAbatementAmount,

    decote,
    creditsTotal,

    irNet,
    pfuIr,
    cehr,
    cehrDetails,
    cdhr,
    cdhrDetails,

    psFoncier,
    psDividends,
    psTotal,

    totalTax,

    tmiRate: tmiMetrics.tmiRate,
    tmiBaseGlobal: tmiMetrics.revenusDansTmi,
    tmiMarginGlobal: tmiMetrics.margeAvantChangement,

    qfIsCapped,
  };
}

export function computeIrFromExcelCase(
  excelCaseInput: Parameters<typeof computeIrFromExcelCaseImpl>[0],
): ExcelCaseResult | null {
  // Cast needed: computeIrResult accepts IrResultInput, the callback type expects Record<string, unknown>
  return computeIrFromExcelCaseImpl(excelCaseInput, { computeIrResult: computeIrResult as any });
}
