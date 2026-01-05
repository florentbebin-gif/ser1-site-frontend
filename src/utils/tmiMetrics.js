/**
 * Utilitaires pour calcul des métriques TMI robustes
 * Approche basée sur la dérivée discrète de l'impôt plafonné
 */

/**
 * Calcule l'impôt progressif pour un revenu par part donné
 * @param {Array} scale Barème progressif
 * @param {number} revenuParPart Revenu par part
 * @returns {number} Impôt par part
 */
function computeProgressiveTaxPerPart(scale, revenuParPart) {
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

function isQfCappedForTaxableIncome(taxableIncomeTest, params) {
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

  const perPartBase =
    basePartsForQf > 0 ? taxableIncomeTest / basePartsForQf : taxableIncomeTest;
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

function findDeltaToQfCapActivation(taxableIncomeNow, params) {
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
 * @param {number} revenuFoyer Revenu imposable du foyer
 * @param {Object} params Paramètres du foyer et configuration fiscale
 * @returns {Object} Détails de l'IR plafonné
 */
export function computeIrPlafonneFoyer(revenuFoyer, params) {
  const {
    scale,
    partsNb,
    basePartsForQf,
    extraParts,
    extraHalfParts,
    plafondPartSup,
    plafondParentIso2,
    isCouple,
    isIsolated
  } = params;

  if (revenuFoyer <= 0) {
    return {
      irSansPlafond: 0,
      irBase: 0,
      avantageBrut: 0,
      plafondAvantage: 0,
      irPlafonne: 0,
      qfCapped: false
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
    qfCapped: avantageBrut > plafondAvantage + 1e-9
  };
}

/**
 * Calcule le taux marginal effectif à un revenu donné via dérivée discrète
 * @param {number} revenu Revenu foyer de référence
 * @param {Object} params Paramètres du foyer
 * @param {number} delta Pas pour la dérivée discrète (défaut: 50€)
 * @returns {number} Taux marginal en % (0, 11, 30, 41, 45)
 */
export function computeMarginalRate(revenu, params) {
  const base = Math.max(0, Math.floor(Number(revenu) || 0));

  const ir1 = computeIrPlafonneFoyer(base, params).irPlafonne;
  const ir2 = computeIrPlafonneFoyer(base + 1, params).irPlafonne;

  const marginalRatePercent = (ir2 - ir1) * 100;

  const scaleRates = Array.from(
    new Set(
      (Array.isArray(params?.scale) ? params.scale : [])
        .map((br) => Number(br?.rate))
        .filter((r) => Number.isFinite(r))
    )
  ).sort((a, b) => a - b);

  if (!scaleRates.length) {
    return marginalRatePercent;
  }

  return scaleRates.reduce(
    (closest, rate) =>
      Math.abs(rate - marginalRatePercent) < Math.abs(closest - marginalRatePercent)
        ? rate
        : closest,
    scaleRates[0]
  );
}

/**
 * Trouve le seuil où le taux marginal passe d'une valeur à une autre
 * @param {number} startRevenu Revenu de départ pour la recherche
 * @param {number} targetRate Taux cible à atteindre
 * @param {Object} params Paramètres du foyer
 * @param {boolean} searchUp Direction de recherche (true = vers le haut, false = vers le bas)
 * @returns {number|null} Seuil trouvé ou null si pas trouvé
 */
export function findMarginalRateThreshold(startRevenu, targetRate, params, searchUp = true) {
  const start = Math.max(0, Math.floor(Number(startRevenu) || 0));
  const currentRate = computeMarginalRate(start, params);

  if (currentRate === targetRate) {
    return findRateChangeThreshold(start, params, searchUp);
  }

  let step = searchUp ? 5000 : -5000;
  let testRevenu = start;
  let iterations = 0;
  const maxIterations = 100;

  while (iterations < maxIterations) {
    testRevenu += step;
    if (testRevenu < 0) return null;

    const testRate = computeMarginalRate(testRevenu, params);

    if (testRate === targetRate && computeMarginalRate(testRevenu - Math.abs(step), params) !== targetRate) {
      return binarySearchThreshold(
        Math.min(testRevenu - Math.abs(step), testRevenu),
        Math.max(testRevenu - Math.abs(step), testRevenu),
        targetRate,
        params
      );
    }

    iterations++;
  }

  return null;
}

/**
 * Trouve le seuil où le taux marginal change (dans n'importe quelle direction)
 * @param {number} startRevenu Revenu de départ
 * @param {Object} params Paramètres du foyer
 * @param {boolean} searchUp Direction de recherche
 * @returns {number|null} Seuil de changement ou null
 */
function findRateChangeThreshold(startRevenu, params, searchUp) {
  const start = Math.max(0, Math.floor(Number(startRevenu) || 0));
  const startRate = computeMarginalRate(start, params);

  const step = searchUp ? 1000 : -1000;
  let testRevenu = start;
  let iterations = 0;

  while (iterations < 200) {
    testRevenu += step;
    if (testRevenu < 0) return null;

    const testRate = computeMarginalRate(testRevenu, params);

    if (testRate !== startRate) {
      const lo = Math.min(testRevenu - Math.abs(step), testRevenu);
      const hi = Math.max(testRevenu - Math.abs(step), testRevenu);

      if (searchUp) {
        // seuil haut: premier R où le taux diffère
        return binarySearchFirstDifferent(lo, hi, startRate, params);
      }
      // seuil bas: premier R où le taux redevient startRate
      return binarySearchFirstEqual(lo, hi, startRate, params);
    }

    iterations++;
  }

  return null;
}

/**
 * Recherche binaire pour trouver le seuil exact de changement de taux
 * @param {number} lo Borne inférieure
 * @param {number} hi Borne supérieure  
 * @param {number} targetRate Taux cible
 * @param {Object} params Paramètres du foyer
 * @returns {number} Seuil trouvé
 */
function binarySearchThreshold(lo, hi, targetRate, params) {
  // Backward-compatible: first point where rate == targetRate
  return binarySearchFirstEqual(lo, hi, targetRate, params);
}

function binarySearchFirstEqual(lo, hi, targetRate, params) {
  let left = Math.max(0, Math.floor(Number(lo) || 0));
  let right = Math.max(left, Math.floor(Number(hi) || 0));

  // Ensure bracket: left != target, right == target (or adjust quickly)
  if (computeMarginalRate(right, params) !== targetRate) {
    return null;
  }
  if (computeMarginalRate(left, params) === targetRate) {
    return left;
  }

  while (left + 1 < right) {
    const mid = Math.floor((left + right) / 2);
    if (computeMarginalRate(mid, params) === targetRate) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return right;
}

function binarySearchFirstDifferent(lo, hi, startRate, params) {
  let left = Math.max(0, Math.floor(Number(lo) || 0));
  let right = Math.max(left, Math.floor(Number(hi) || 0));

  if (computeMarginalRate(left, params) !== startRate) {
    return left;
  }
  if (computeMarginalRate(right, params) === startRate) {
    return null;
  }

  while (left + 1 < right) {
    const mid = Math.floor((left + right) / 2);
    if (computeMarginalRate(mid, params) !== startRate) {
      right = mid;
    } else {
      left = mid;
    }
  }

  return right;
}

/**
 * Calcule les métriques TMI robustes pour un foyer
 * @param {number} revenuImposable Revenu imposable du foyer
 * @param {Object} params Paramètres du foyer et configuration fiscale
 * @returns {Object} Métriques TMI
 */
export function computeTmiMetrics(revenuImposable, params) {
  if (revenuImposable <= 0) {
    return {
      tmiRate: 0,
      revenusDansTmi: 0,
      margeAvantChangement: null,
      seuilBasFoyer: 0,
      seuilHautFoyer: null
    };
  }

  const revenu = Math.max(0, Math.floor(Number(revenuImposable) || 0));

  // --- TMI + AVANT: basé sur la dérivée discrète de l'IR plafonné (foyer)
  const rateCache = new Map();
  const getRate = (r) => {
    const key = Math.max(0, Math.floor(Number(r) || 0));
    if (rateCache.has(key)) return rateCache.get(key);
    const v = computeMarginalRate(key, params);
    rateCache.set(key, v);
    return v;
  };

  const tmiRate = getRate(revenu);

  const findSeuilBasFoyer = () => {
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

  const findSeuilHautFoyer = () => {
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

  const trancheWidth =
    seuilHautFoyer == null ? null : Math.max(0, seuilHautFoyer - seuilBasFoyer);
  const rawAvant = Math.max(0, revenu - seuilBasFoyer);
  let revenusDansTmi = trancheWidth == null ? rawAvant : Math.min(rawAvant, trancheWidth);
  revenusDansTmi = Math.round(revenusDansTmi);

  // --- APRES: conserver le calcul existant (seuil barème + activation du plafonnement QF)
  // Détecter si le QF est plafonné AU REVENU ACTUEL
  const qfInfo = computeIrPlafonneFoyer(revenu, params);
  const qfCappedNow = Boolean(qfInfo?.qfCapped);

  const partsForTmi = qfCappedNow
    ? (Number(params.basePartsForQf) || 1)
    : (Number(params.partsNb) || 1);
  const taxablePerPartForTmi = partsForTmi > 0 ? revenu / partsForTmi : revenu;

  let currentBracket = null;
  for (const br of params.scale || []) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? Infinity : Number(br.to);
    if (taxablePerPartForTmi > from && taxablePerPartForTmi <= to) {
      currentBracket = { from, to };
      break;
    }
  }

  const toFinite =
    currentBracket && Number.isFinite(currentBracket.to) ? currentBracket.to : null;

  let margeAvantChangement =
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
