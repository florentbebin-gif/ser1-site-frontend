import { computeProgressiveTax } from './progressiveTax.js';

export function computeQuotientFamilyCapping({
  scale,
  taxableIncome,
  partsNb,
  isCouple,
  isIsolated,
  qfYearCfg,
  irSansPlafond,
}) {
  const basePartsForQf = isCouple ? 2 : 1;
  const extraParts = Math.max(0, (Number(partsNb) || 0) - basePartsForQf);
  const extraHalfParts = extraParts * 2;

  const qfCfg = qfYearCfg || {};
  const plafondPartSup = Number(qfCfg.plafondPartSup || 0);
  const plafondParentIso2 = Number(qfCfg.plafondParentIsoléDeuxPremièresParts || 0);

  let irBeforeQfBase = Number(irSansPlafond) || 0;
  let qfAdvantage = 0;
  let irAfterQf = Number(irSansPlafond) || 0;
  let qfIsCapped = false;

  if ((Number(taxableIncome) || 0) > 0 && extraHalfParts > 0 && plafondPartSup > 0) {
    const taxablePerPartBase = basePartsForQf > 0 ? taxableIncome / basePartsForQf : taxableIncome;
    const { taxPerPart: taxPerPartBase } = computeProgressiveTax(scale, taxablePerPartBase);
    const irBase = taxPerPartBase * basePartsForQf;
    irBeforeQfBase = irBase;

    const avantageBrut = Math.max(0, irBase - irAfterQf);

    const isSingle = !isCouple;

    let maxAvantage = 0;
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
    irAfterQf = irBase - avantageRetenu;
  } else {
    irBeforeQfBase = irAfterQf;
    qfAdvantage = 0;
  }

  return {
    irBeforeQfBase,
    qfAdvantage,
    irAfterQf,
    qfIsCapped,

    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
  };
}
