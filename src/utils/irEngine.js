import { computeTmiMetrics } from './tmiMetrics.js';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../constants/settingsDefaults';
import { computeAutoPartsWithChildren } from '../engine/ir/parts.js';
import { computeProgressiveTax } from '../engine/ir/progressiveTax.js';
import { computeCEHR } from '../engine/ir/cehr.js';
import { computeCDHR } from '../engine/ir/cdhr.js';
import { computeAbattement10 } from '../engine/ir/abattement10.js';
import { computeEffectiveParts } from '../engine/ir/effectiveParts.js';
import { computeDomAbatementAmount } from '../engine/ir/domAbatement.js';
import { computeDecote } from '../engine/ir/decote.js';
import { computeCapitalBases, computePfuIr } from '../engine/ir/capital.js';
import { computeQuotientFamilyCapping } from '../engine/ir/quotientFamily.js';
import { computeSocialContributions } from '../engine/ir/socialContributions.js';

// Re-export pour les consommateurs historiques (importé depuis settingsDefaults)
export { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS };

// Back-compat export (moved to engine/ir/parts.js)
export { computeAutoPartsWithChildren };

// Back-compat export (moved to engine/ir/effectiveParts.js)
export { computeEffectiveParts };

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
}) {
  if (!taxSettings) return null;

  const isCouple = status === 'couple';

  const incomeTaxCfg = taxSettings.incomeTax || {};
  const scale = yearKey === 'current' ? incomeTaxCfg.scaleCurrent || [] : incomeTaxCfg.scalePrevious || [];

  const cehrCfg = taxSettings.cehr || {};
  const cehrYearCfg = cehrCfg[yearKey] || {};
  const cehrBrackets = cehrYearCfg[isCouple ? 'couple' : 'single'] || [];

  const cdhrCfg = taxSettings.cdhr && taxSettings.cdhr[yearKey] ? taxSettings.cdhr[yearKey] : null;

  const decoteCfgRoot = incomeTaxCfg.decote || {};
  const decoteYearCfg = decoteCfgRoot[yearKey] || {};

  const qfCfgRoot = incomeTaxCfg.quotientFamily || {};
  const qfYearCfg = yearKey === 'current' ? qfCfgRoot.current || {} : qfCfgRoot.previous || {};

  const psCfg = psSettings || {};
  const patrimonyCfg = psCfg.patrimony && psCfg.patrimony[yearKey] ? psCfg.patrimony[yearKey] : null;

  const partsNb = Math.max(0.5, Number(parts) || 1);

  const totalIncomeD1 =
    (incomes.d1.salaries || 0) +
    (incomes.d1.associes62 || 0) +
    (incomes.d1.pensions || 0) +
    (incomes.d1.bic || 0) +
    (incomes.d1.autres || 0);

  const totalIncomeD2 = isCouple
    ? (incomes.d2.salaries || 0) +
      (incomes.d2.associes62 || 0) +
      (incomes.d2.pensions || 0) +
      (incomes.d2.bic || 0) +
      (incomes.d2.autres || 0)
    : 0;

  const capWithPs = incomes.capital?.withPs || 0;
  const capWithoutPs = incomes.capital?.withoutPs || 0;
  const modeCap = capitalMode || 'pfu';

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
    isIsolated,
    qfYearCfg,
    irSansPlafond: irBrutFoyerSansPlafond,
  });

  let irBrutFoyer = irAfterQf;

  const domAbatementAmount = computeDomAbatementAmount({
    location,
    yearKey,
    domAbatementCfgRoot: incomeTaxCfg.domAbatement,
    irAfterQf,
  });

  irBrutFoyer = Math.max(0, irAfterQf - domAbatementAmount);

  const decote = computeDecote({ isCouple, decoteYearCfg, irBrutFoyer });

  const irNet = Math.max(0, irBrutFoyer - creditsTotal - decote);

  const pfuIr = computePfuIr({ capitalBasePfu, yearKey, taxSettings });

  const rfr = taxableIncome + capitalBasePfu;

  const { cehr, cehrDetails } = computeCEHR(cehrBrackets, rfr);

  const { cdhr, cdhrDetails } = computeCDHR(
    cdhrCfg,
    rfr,
    irBrutFoyer,
    pfuIr,
    cehr,
    isCouple,
    personsAChargeCount
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
    isIsolated,
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

export function computeIrFromExcelCase({
  salaireAvant10,
  status,
  isIsolated,
  childrenCount,
  location = 'metropole',
  yearKey = 'current',
  taxSettings = DEFAULT_TAX_SETTINGS,
  psSettings = DEFAULT_PS_SETTINGS,
}) {
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
