/**
 * Utilitaires pour calcul des métriques TMI robustes
 * Approche basée sur la dérivée discrète de l'impôt plafonné
 */

interface TmiBracket {
  from: number | string;
  to: number | string | null | undefined;
  rate: number | string;
}

export interface TmiParams {
  scale: TmiBracket[];
  partsNb: number;
  basePartsForQf: number;
  extraParts: number;
  extraHalfParts: number;
  plafondPartSup: number;
  plafondParentIso2: number;
  isCouple: boolean;
  isIsolated: boolean;
}

export interface IrPlafonneResult {
  irSansPlafond: number;
  irBase: number;
  avantageBrut: number;
  plafondAvantage: number;
  irPlafonne: number;
  qfCapped: boolean;
}

export interface TmiMetricsResult {
  tmiRate: number;
  revenusDansTmi: number;
  margeAvantChangement: number | null;
  seuilBasFoyer: number;
  seuilHautFoyer: number | null;
}

/**
 * Calcule l'impôt progressif pour un revenu par part donné
 */
function computeProgressiveTaxPerPart(scale: TmiBracket[], revenuParPart: number): number {
  if (!Array.isArray(scale) || !scale.length || revenuParPart <= 0) {
    return 0;
  }

  let tax = 0;
  for (const bracket of scale) {
    const from = Number(bracket.from) || 0;
    const to = bracket.to == null ? Infinity : Number(bracket.to);
    const rate = Number(bracket.rate) || 0;

    if (revenuParPart > from) {
      const taxableInBracket = Math.min(revenuParPart, to) - from;
      tax += taxableInBracket * (rate / 100);

      if (revenuParPart <= to) {
        break;
      }
    }
  }
  return tax;
}

function isQfCappedForTaxableIncome(taxableIncomeTest: number, params: TmiParams): boolean {
  const {
    scale,
    partsNb,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
    isCouple,
    isIsolated,
  } = params;

  if (taxableIncomeTest <= 0) return false;
  if (extraHalfParts <= 0 || plafondPartSup <= 0) return false;

  const perPartAll = partsNb > 0 ? taxableIncomeTest / partsNb : taxableIncomeTest;
  const taxPerPartAll = computeProgressiveTaxPerPart(scale, perPartAll);
  const irAllParts = taxPerPartAll * partsNb;

  const perPartBase = basePartsForQf > 0 ? taxableIncomeTest / basePartsForQf : taxableIncomeTest;
  const taxPerPartBase = computeProgressiveTaxPerPart(scale, perPartBase);
  const irBaseTest = taxPerPartBase * basePartsForQf;

  const avantageBrut = Math.max(0, irBaseTest - irAllParts);

  let maxAvantageTest = 0;
  const isSingle = !isCouple;

  if (!isIsolated || !isSingle || plafondParentIso2 <= 0) {
    maxAvantageTest = extraParts * 2 * plafondPartSup;
  } else {
    if (partsNb <= 2) {
      maxAvantageTest = (partsNb - 1) * plafondParentIso2;
    } else {
      maxAvantageTest = plafondParentIso2 + (partsNb - 2) * 2 * plafondPartSup;
    }
  }

  return avantageBrut > maxAvantageTest + 1e-9;
}

function findDeltaToQfCapActivation(taxableIncomeNow: number, params: TmiParams): number | null {
  if (isQfCappedForTaxableIncome(taxableIncomeNow, params)) return 0;

  let lo = 0;
  let hi = 50000;

  while (hi < 2000000 && !isQfCappedForTaxableIncome(taxableIncomeNow + hi, params)) {
    hi *= 2;
  }
  if (hi >= 2000000 && !isQfCappedForTaxableIncome(taxableIncomeNow + hi, params)) {
    return null;
  }

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (isQfCappedForTaxableIncome(taxableIncomeNow + mid, params)) hi = mid;
    else lo = mid;
  }

  return Math.ceil(hi);
}

/**
 * Fonction pure qui calcule l'IR brut plafonné QF pour un revenu imposable foyer donné
 */
export function computeIrPlafonneFoyer(revenuFoyer: number, params: TmiParams): IrPlafonneResult {
  const {
    scale,
    partsNb,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
    isCouple,
    isIsolated,
  } = params;

  if (revenuFoyer <= 0) {
    return {
      irSansPlafond: 0,
      irBase: 0,
      avantageBrut: 0,
      plafondAvantage: 0,
      irPlafonne: 0,
      qfCapped: false,
    };
  }

  // 1. IR avec toutes les parts (sans plafonnement)
  const revenuParPart = partsNb > 0 ? revenuFoyer / partsNb : revenuFoyer;
  const taxPerPart = computeProgressiveTaxPerPart(scale, revenuParPart);
  const irSansPlafond = taxPerPart * partsNb;

  // 2. IR avec parts de base uniquement
  const revenuParPartBase = basePartsForQf > 0 ? revenuFoyer / basePartsForQf : revenuFoyer;
  const taxPerPartBase = computeProgressiveTaxPerPart(scale, revenuParPartBase);
  const irBase = taxPerPartBase * basePartsForQf;

  // 3. Avantage QF brut
  const avantageBrut = Math.max(0, irBase - irSansPlafond);

  // 4. Calculer le plafond d'avantage QF
  let plafondAvantage = 0;

  if (extraHalfParts > 0 && plafondPartSup > 0) {
    const isSingle = !isCouple;

    if (!isIsolated || !isSingle || plafondParentIso2 <= 0) {
      // Cas général
      plafondAvantage = extraParts * 2 * plafondPartSup;
    } else {
      // Parent isolé
      if (partsNb <= 2) {
        plafondAvantage = (partsNb - 1) * plafondParentIso2;
      } else {
        plafondAvantage = plafondParentIso2 + (partsNb - 2) * 2 * plafondPartSup;
      }
    }
  }

  // 5. Application du plafonnement
  const avantageRetenu = Math.min(avantageBrut, plafondAvantage);
  const irPlafonne = Math.max(0, irBase - avantageRetenu);

  return {
    irSansPlafond,
    irBase,
    avantageBrut,
    plafondAvantage,
    irPlafonne,
    qfCapped: avantageBrut > plafondAvantage + 1e-9,
  };
}

/**
 * Calcule le taux marginal effectif à un revenu donné via dérivée discrète
 */
export function computeMarginalRate(revenu: number, params: TmiParams): number {
  const base = Math.max(0, Math.floor(Number(revenu) || 0));

  const ir1 = computeIrPlafonneFoyer(base, params).irPlafonne;
  const ir2 = computeIrPlafonneFoyer(base + 1, params).irPlafonne;

  const marginalRatePercent = (ir2 - ir1) * 100;

  const scaleRates = Array.from(
    new Set(
      (Array.isArray(params?.scale) ? params.scale : [])
        .map((br) => Number(br?.rate))
        .filter((r) => Number.isFinite(r)),
    ),
  ).sort((a, b) => a - b);

  if (!scaleRates.length) {
    return marginalRatePercent;
  }
  const firstRate = scaleRates[0];
  if (firstRate === undefined) {
    return marginalRatePercent;
  }

  return scaleRates.reduce(
    (closest, rate) =>
      Math.abs(rate - marginalRatePercent) < Math.abs(closest - marginalRatePercent)
        ? rate
        : closest,
    firstRate,
  );
}

/**
 * Calcule les métriques TMI robustes pour un foyer
 */
export function computeTmiMetrics(revenuImposable: number, params: TmiParams): TmiMetricsResult {
  if (revenuImposable <= 0) {
    return {
      tmiRate: 0,
      revenusDansTmi: 0,
      margeAvantChangement: null,
      seuilBasFoyer: 0,
      seuilHautFoyer: null,
    };
  }

  const revenu = Math.max(0, Math.floor(Number(revenuImposable) || 0));

  // --- TMI + AVANT: basé sur la dérivée discrète de l'IR plafonné (foyer)
  const rateCache = new Map<number, number>();
  const getRate = (r: number): number => {
    const key = Math.max(0, Math.floor(Number(r) || 0));
    const cached = rateCache.get(key);
    if (cached !== undefined) return cached;
    const v = computeMarginalRate(key, params);
    rateCache.set(key, v);
    return v;
  };

  const tmiRate = getRate(revenu);

  const findSeuilBasFoyer = (): number => {
    if (tmiRate <= 0) return 0;

    let hi = revenu;
    let lo = Math.max(0, hi - 1000);

    while (lo > 0 && getRate(lo) === tmiRate) {
      hi = lo;
      lo = Math.max(0, lo - 1000);
    }

    if (lo === 0 && getRate(lo) === tmiRate) return 0;

    let left = lo;
    let right = hi;
    while (left + 1 < right) {
      const mid = Math.floor((left + right) / 2);
      if (getRate(mid) === tmiRate) right = mid;
      else left = mid;
    }
    return right;
  };

  const findSeuilHautFoyer = (): number | null => {
    let lo = revenu;
    let hi = lo + 1000;

    let guard = 0;
    while (guard < 500 && getRate(hi) === tmiRate) {
      lo = hi;
      hi += 1000;
      guard++;
    }
    if (guard >= 500) return null;

    let left = lo;
    let right = hi;
    while (left + 1 < right) {
      const mid = Math.floor((left + right) / 2);
      if (getRate(mid) !== tmiRate) right = mid;
      else left = mid;
    }
    return right;
  };

  const seuilBasFoyer = findSeuilBasFoyer();
  const seuilHautFoyer = findSeuilHautFoyer();

  const trancheWidth = seuilHautFoyer == null ? null : Math.max(0, seuilHautFoyer - seuilBasFoyer);
  const rawAvant = Math.max(0, revenu - seuilBasFoyer);
  let revenusDansTmi = trancheWidth == null ? rawAvant : Math.min(rawAvant, trancheWidth);
  revenusDansTmi = Math.round(revenusDansTmi);

  // --- APRES: conserver le calcul existant (seuil barème + activation du plafonnement QF)
  // Détecter si le QF est plafonné AU REVENU ACTUEL
  const qfInfo = computeIrPlafonneFoyer(revenu, params);
  const qfCappedNow = Boolean(qfInfo?.qfCapped);

  const partsForTmi = qfCappedNow
    ? Number(params.basePartsForQf) || 1
    : Number(params.partsNb) || 1;
  const taxablePerPartForTmi = partsForTmi > 0 ? revenu / partsForTmi : revenu;

  let currentBracket: { from: number; to: number } | null = null;
  for (const br of params.scale || []) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? Infinity : Number(br.to);
    if (taxablePerPartForTmi > from && taxablePerPartForTmi <= to) {
      currentBracket = { from, to };
      break;
    }
  }

  const toFinite = currentBracket && Number.isFinite(currentBracket.to) ? currentBracket.to : null;

  let margeAvantChangement: number | null =
    toFinite == null ? null : Math.max(0, toFinite - taxablePerPartForTmi) * partsForTmi;

  // IMPORTANT: le prochain "changement de TMI affichée" peut venir de l'activation du plafonnement QF
  // avant le prochain seuil du barème.
  if (!qfCappedNow) {
    const deltaToCap = findDeltaToQfCapActivation(revenu, params);
    if (deltaToCap != null) {
      if (margeAvantChangement == null) {
        margeAvantChangement = deltaToCap;
      } else {
        margeAvantChangement = Math.min(margeAvantChangement, deltaToCap);
      }
    }
  }

  if (margeAvantChangement != null) {
    margeAvantChangement = Math.round(margeAvantChangement);
  }

  return {
    tmiRate,
    revenusDansTmi,
    margeAvantChangement,
    seuilBasFoyer,
    seuilHautFoyer,
  };
}
