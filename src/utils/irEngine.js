import { computeTmiMetrics } from './tmiMetrics.js';
import { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS } from '../constants/settingsDefaults';

function computeAbattement10(base, cfg) {
  if (!cfg || base <= 0) return 0;
  const plafond = Number(cfg.plafond) || 0;
  const plancher = Number(cfg.plancher) || 0;

  let val = base * 0.1;
  if (plafond > 0) val = Math.min(val, plafond);
  if (plancher > 0) val = Math.max(val, plancher);
  return val;
}

function computeProgressiveTax(scale = [], taxablePerPart) {
  if (!Array.isArray(scale) || !scale.length || taxablePerPart <= 0) {
    return {
      taxPerPart: 0,
      tmiRate: 0,
      tmiBasePerPart: 0,
      tmiBracketTo: null,
      bracketsDetails: [],
    };
  }

  let tax = 0;
  let tmiRate = 0;
  let tmiBasePerPart = 0;
  let tmiBracketTo = null;
  const details = [];

  for (const br of scale) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (taxablePerPart <= from) {
      details.push({
        label: `De ${from.toLocaleString('fr-FR')}€ à ${
          to ? to.toLocaleString('fr-FR') + '€' : 'plus'
        }`,
        base: 0,
        rate,
        tax: 0,
      });
      continue;
    }

    const upper = to == null ? taxablePerPart : Math.min(taxablePerPart, to);
    const base = Math.max(0, upper - from);
    const trancheTax = base * (rate / 100);

    tax += trancheTax;

    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${
        to ? to.toLocaleString('fr-FR') + '€' : 'plus'
      }`,
      base,
      rate,
      tax: trancheTax,
    });

    if (base > 0) {
      tmiRate = rate;
      tmiBasePerPart = base;
      tmiBracketTo = to;
    }

    if (to == null || taxablePerPart <= to) break;
  }

  if (tax < 0) tax = 0;

  return {
    taxPerPart: tax,
    tmiRate,
    tmiBasePerPart,
    tmiBracketTo,
    bracketsDetails: details,
  };
}

function computeCEHR(brackets = [], rfr) {
  if (!Array.isArray(brackets) || !brackets.length || rfr <= 0) {
    return { cehr: 0, cehrDetails: [] };
  }

  let cehr = 0;
  const details = [];

  for (const br of brackets) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (rfr <= from) {
      details.push({
        label: `De ${from.toLocaleString('fr-FR')}€ à ${
          to ? to.toLocaleString('fr-FR') + '€' : 'plus'
        }`,
        base: 0,
        rate,
        tax: 0,
      });
      continue;
    }

    const upper = to == null ? rfr : Math.min(rfr, to);
    const base = Math.max(0, upper - from);
    const t = base * (rate / 100);

    cehr += t;
    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${
        to ? to.toLocaleString('fr-FR') + '€' : 'plus'
      }`,
      base,
      rate,
      tax: t,
    });

    if (to == null || rfr <= to) break;
  }

  return { cehr, cehrDetails: details };
}

function computeCDHR(config, assiette, irRetenu, pfuIr, cehr, isCouple, personsAChargeCount) {
  if (!config || !Number.isFinite(assiette) || assiette <= 0) {
    return { cdhr: 0, cdhrDetails: null };
  }

  const rawRate = Number(config.minEffectiveRate);
  const minRate = !rawRate ? 0 : rawRate > 1 ? rawRate / 100 : rawRate;
  if (!minRate) return { cdhr: 0, cdhrDetails: null };

  const threshold = isCouple
    ? Number(config.thresholdCouple) || 500000
    : Number(config.thresholdSingle) || 250000;

  if (assiette <= threshold) return { cdhr: 0, cdhrDetails: null };

  const decoteMaxAssiette = isCouple
    ? Number(config.decoteMaxAssietteCouple) || 660000
    : Number(config.decoteMaxAssietteSingle) || 330000;

  const decoteSlope = Number(config.decoteSlopePercent);
  const slope = Number.isFinite(decoteSlope) && decoteSlope > 0 ? decoteSlope / 100 : 0.825;

  const termA_beforeDecote = minRate * assiette;

  let decoteApplied = 0;
  if (assiette <= decoteMaxAssiette) {
    const target = slope * Math.max(0, assiette - threshold);
    decoteApplied = Math.max(0, termA_beforeDecote - target);
  }

  const termA_afterDecote = Math.max(0, termA_beforeDecote - decoteApplied);

  const majCouple = isCouple ? Number(config.majorationCouple) || 12500 : 0;
  const majPerCharge = Number(config.majorationPerCharge) || 1500;
  const personsCount = Math.max(0, Number(personsAChargeCount) || 0);
  const majCharges = personsCount * majPerCharge;
  const majorations = majCouple + majCharges;

  const termB =
    (Number(irRetenu) || 0) +
    (Number(cehr) || 0) +
    (Number(pfuIr) || 0) +
    majorations;

  const cdhr = Math.max(0, termA_afterDecote - termB);

  return {
    cdhr,
    cdhrDetails: {
      assiette,
      threshold,
      minRatePercent: minRate * 100,
      decoteMaxAssiette,
      slopePercent: slope * 100,

      termA_beforeDecote,
      decoteApplied,
      termA_afterDecote,

      termB,
      irRetenu: Number(irRetenu) || 0,
      cehr: Number(cehr) || 0,
      pfuIr: Number(pfuIr) || 0,
      majorations,
      majCouple,
      majCharges,
      personsAChargeCount: personsCount,
    },
  };
}

// Re-export pour les consommateurs historiques (importé depuis settingsDefaults)
export { DEFAULT_TAX_SETTINGS, DEFAULT_PS_SETTINGS };

// Règle parent isolé (case T) :
// - Enfants à charge comptés avant les enfants en alternée pour les 2 premiers rangs.
// - Bonus parent isolé = 0,5 si au moins un enfant est à charge.
// - Si uniquement alternée : bonus = 0,25 par enfant alternée (plafonné à 0,5).
export function computeAutoPartsWithChildren({ status, isIsolated, children = [] }) {
  const baseParts = status === 'couple' ? 2 : 1;

  const chargeCount = children.filter((child) => child && child.mode === 'charge').length;
  const sharedCount = children.filter((child) => child && child.mode === 'shared').length;

  let childrenParts = 0;
  let remainingFirstSlots = 2;

  const chargeFirstSlots = Math.min(chargeCount, remainingFirstSlots);
  childrenParts += chargeFirstSlots * 0.5;
  remainingFirstSlots -= chargeFirstSlots;

  const chargeBeyond = chargeCount - chargeFirstSlots;
  if (chargeBeyond > 0) {
    childrenParts += chargeBeyond * 1;
  }

  const sharedFirstSlots = Math.min(sharedCount, remainingFirstSlots);
  childrenParts += sharedFirstSlots * 0.25;
  remainingFirstSlots -= sharedFirstSlots;

  const sharedBeyond = sharedCount - sharedFirstSlots;
  if (sharedBeyond > 0) {
    childrenParts += sharedBeyond * 0.5;
  }

  let isolatedBonus = 0;
  if (status === 'single' && isIsolated) {
    if (chargeCount > 0) {
      isolatedBonus = 0.5;
    } else if (sharedCount > 0) {
      isolatedBonus = Math.min(0.5, sharedCount * 0.25);
    }
  }

  return baseParts + childrenParts + isolatedBonus;
}

// Fallback simplifié quand seul le nombre d'enfants est connu (Excel case).
// Hypothèse : enfants comptés en garde exclusive; bonus parent isolé seulement si >=1 enfant.
export function computeEffectiveParts({ status, isIsolated, childrenCount }) {
  const baseParts = status === 'couple' ? 2 : 1;

  const childrenParts = Array.from({ length: Math.max(0, childrenCount) }).reduce(
    (sum, _, idx) => sum + (idx < 2 ? 0.5 : 1),
    0
  );

  const hasChild = Math.max(0, childrenCount) > 0;
  const isolatedBonus = status === 'single' && isIsolated && hasChild ? 0.5 : 0;

  const computedParts = baseParts + childrenParts + isolatedBonus;

  return Math.max(baseParts, Math.round(computedParts * 4) / 4);
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
  const capTotal = capWithPs + capWithoutPs;

  const modeCap = capitalMode || 'pfu';

  let capitalBaseBareme = 0;
  let capitalBasePfu = 0;

  if (modeCap === 'bareme') {
    capitalBaseBareme = capTotal * 0.6;
  } else {
    capitalBasePfu = capTotal;
  }

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
  let irBrutFoyer = irBrutFoyerSansPlafond;

  let irBeforeQfBase = irBrutFoyerSansPlafond;
  let qfAdvantage = 0;
  let irAfterQf = irBrutFoyerSansPlafond;

  const basePartsForQf = isCouple ? 2 : 1;
  const extraParts = Math.max(0, partsNb - basePartsForQf);
  const extraHalfParts = extraParts * 2;

  const plafondPartSup = Number(qfYearCfg.plafondPartSup || 0);
  const plafondParentIso2 = Number(qfYearCfg.plafondParentIsoléDeuxPremièresParts || 0);

  let maxAvantage = 0;
  let qfIsCapped = false;

  if (taxableIncome > 0 && extraHalfParts > 0 && plafondPartSup > 0) {
    const taxablePerPartBase = basePartsForQf > 0 ? taxableIncome / basePartsForQf : taxableIncome;
    const { taxPerPart: taxPerPartBase } = computeProgressiveTax(scale, taxablePerPartBase);
    const irBase = taxPerPartBase * basePartsForQf;
    irBeforeQfBase = irBase;

    const avantageBrut = Math.max(0, irBase - irBrutFoyerSansPlafond);

    const isSingle = !isCouple;

    if (!isIsolated || !isSingle || plafondParentIso2 <= 0) {
      maxAvantage = extraParts * 2 * plafondPartSup;
    } else {
      if (partsNb <= 2) {
        maxAvantage = (partsNb - 1) * plafondParentIso2;
      } else {
        maxAvantage = plafondParentIso2 + (partsNb - 2) * 2 * plafondPartSup;
      }
    }

    const avantageRetenu = Math.min(avantageBrut, maxAvantage);
    qfIsCapped = avantageBrut > maxAvantage;

    qfAdvantage = avantageRetenu;
    irBrutFoyer = irBase - avantageRetenu;
    irAfterQf = irBrutFoyer;
  } else {
    irBeforeQfBase = irBrutFoyerSansPlafond;
    qfAdvantage = 0;
    irAfterQf = irBrutFoyerSansPlafond;
  }

  let domAbatementAmount = 0;

  const domCfgRoot = incomeTaxCfg.domAbatement || {};
  const domYearCfg = yearKey === 'current' ? domCfgRoot.current || {} : domCfgRoot.previous || {};

  if (location === 'gmr' || location === 'guyane') {
    const domCfg = location === 'gmr' ? domYearCfg.gmr : domYearCfg.guyane;

    const ratePercent = Number(domCfg?.ratePercent || 0);
    const cap = Number(domCfg?.cap || 0);

    if (ratePercent > 0) {
      const raw = irAfterQf * (ratePercent / 100);
      domAbatementAmount = cap > 0 ? Math.min(raw, cap) : raw;
      domAbatementAmount = Math.max(0, domAbatementAmount);
    }
  }

  irBrutFoyer = Math.max(0, irAfterQf - domAbatementAmount);

  let decote = 0;
  const decoteTrigger = isCouple ? Number(decoteYearCfg.triggerCouple || 0) : Number(decoteYearCfg.triggerSingle || 0);
  const decoteAmount = isCouple ? Number(decoteYearCfg.amountCouple || 0) : Number(decoteYearCfg.amountSingle || 0);
  const decoteRate = Number(decoteYearCfg.ratePercent || 0);

  if (decoteTrigger > 0 && decoteAmount > 0 && irBrutFoyer <= decoteTrigger) {
    const raw = decoteAmount - (decoteRate / 100) * irBrutFoyer;
    if (raw > 0) decote = raw;
  }
  if (decote > irBrutFoyer) decote = irBrutFoyer;

  const irNet = Math.max(0, irBrutFoyer - creditsTotal - decote);

  let pfuIr = 0;
  if (capitalBasePfu > 0) {
    const pfuCfg = taxSettings.pfu && taxSettings.pfu[yearKey] ? taxSettings.pfu[yearKey] : null;
    const pfuRateIR = pfuCfg ? Number(pfuCfg.rateIR) || 12.8 : 12.8;
    pfuIr = capitalBasePfu * (pfuRateIR / 100);
  }

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

  let psRateTotal = 0;
  let psFoncier = 0;
  let psDividends = 0;
  let psTotal = 0;

  if (patrimonyCfg) {
    psRateTotal = Number(patrimonyCfg.totalRate) || 0;

    const fonciersBase = incomes.fonciersFoyer || 0;
    psFoncier = fonciersBase * (psRateTotal / 100);

    if (capWithPs > 0) {
      psDividends = capWithPs * (psRateTotal / 100);
    }

    psTotal = psFoncier + psDividends;
  }

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
