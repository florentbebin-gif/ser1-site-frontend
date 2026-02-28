/**
 * dmtgValidators.js
 *
 * Fonctions de validation réutilisables pour les pages Settings DMTG & Succession.
 * Chaque validateur retourne un message d'erreur (string) ou null si valide.
 */

/**
 * Vérifie qu'un taux est entre 0 et 100.
 * @param {number|null|undefined} value
 * @returns {string|null}
 */
export function validatePercent(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return 'La valeur doit être un nombre.';
  if (n < 0 || n > 100) return 'Le taux doit être entre 0 et 100.';
  return null;
}

/**
 * Vérifie qu'une valeur est positive (>= 0).
 * @param {number|null|undefined} value
 * @returns {string|null}
 */
export function validatePositive(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return 'La valeur doit être un nombre.';
  if (n < 0) return 'La valeur doit être positive.';
  return null;
}

/**
 * Vérifie qu'une valeur est raisonnable (positive et < max).
 * @param {number|null|undefined} value
 * @param {number} max
 * @returns {string|null}
 */
export function validateReasonable(value, max = 10000000) {
  const posErr = validatePositive(value);
  if (posErr) return posErr;
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (n > max) return `La valeur semble trop élevée (max ${max.toLocaleString('fr-FR')} €).`;
  return null;
}

/**
 * Vérifie qu'un barème (scale) a des tranches ordonnées et sans chevauchement.
 * @param {Array<{from: number|null, to: number|null, rate?: number}>} scale
 * @returns {Array<{index: number, field: string, message: string}>}
 */
export function validateScaleOrdered(scale) {
  if (!Array.isArray(scale) || scale.length === 0) return [];
  const errors = [];

  for (let i = 0; i < scale.length; i++) {
    const row = scale[i];

    // Validate rate
    if (row.rate !== null && row.rate !== undefined) {
      const rateErr = validatePercent(row.rate);
      if (rateErr) {
        errors.push({ index: i, field: 'rate', message: rateErr });
      }
    }

    // Validate from >= 0
    if (row.from !== null && row.from !== undefined && row.from < 0) {
      errors.push({ index: i, field: 'from', message: 'La borne doit être positive.' });
    }

    // Validate from < to (unless to is null = last bracket)
    if (row.to !== null && row.to !== undefined && row.from !== null && row.from !== undefined) {
      if (row.to <= row.from) {
        errors.push({ index: i, field: 'to', message: 'La borne haute doit être supérieure à la borne basse.' });
      }
    }

    // Validate ordering with previous bracket
    if (i > 0) {
      const prev = scale[i - 1];
      const prevTo = prev.to;
      const currFrom = row.from;
      if (prevTo !== null && prevTo !== undefined && currFrom !== null && currFrom !== undefined) {
        if (currFrom < prevTo) {
          errors.push({ index: i, field: 'from', message: 'La tranche suivante doit commencer après la précédente.' });
        }
      }
    }
  }

  return errors;
}

/**
 * Valide un objet DMTG complet (4 catégories).
 * @param {Object} dmtg - { ligneDirecte, frereSoeur, neveuNiece, autre }
 * @returns {Object} errors par chemin (ex: { 'ligneDirecte.abattement': '...', 'ligneDirecte.scale[2].rate': '...' })
 */
export function validateDmtg(dmtg) {
  const errors = {};
  if (!dmtg) return errors;

  const categories = ['ligneDirecte', 'frereSoeur', 'neveuNiece', 'autre'];

  for (const cat of categories) {
    const catData = dmtg[cat];
    if (!catData) continue;

    // Validate abattement
    const abErr = validateReasonable(catData.abattement);
    if (abErr) {
      errors[`${cat}.abattement`] = abErr;
    }

    // Validate scale
    const scaleErrors = validateScaleOrdered(catData.scale || []);
    for (const se of scaleErrors) {
      errors[`${cat}.scale[${se.index}].${se.field}`] = se.message;
    }
  }

  return errors;
}

/**
 * Valide les paramètres assurance-vie décès.
 * @param {Object} avDeces - assuranceVie.deces
 * @returns {Object} errors par chemin
 */
export function validateAvDeces(avDeces) {
  const errors = {};
  if (!avDeces) return errors;

  // agePivotPrimes
  if (avDeces.agePivotPrimes !== null && avDeces.agePivotPrimes !== undefined) {
    const n = Number(avDeces.agePivotPrimes);
    if (Number.isNaN(n) || n < 0 || n > 120) {
      errors['agePivotPrimes'] = 'L\'âge pivot doit être entre 0 et 120.';
    }
  }

  // primesApres1998
  const pa = avDeces.primesApres1998;
  if (pa) {
    const allowErr = validateReasonable(pa.allowancePerBeneficiary, 10000000);
    if (allowErr) {
      errors['primesApres1998.allowancePerBeneficiary'] = allowErr;
    }

    // Validate brackets
    if (Array.isArray(pa.brackets)) {
      for (let i = 0; i < pa.brackets.length; i++) {
        const b = pa.brackets[i];
        const rateErr = validatePercent(b.ratePercent);
        if (rateErr) {
          errors[`primesApres1998.brackets[${i}].ratePercent`] = rateErr;
        }
        if (b.upTo !== null && b.upTo !== undefined) {
          const upErr = validatePositive(b.upTo);
          if (upErr) {
            errors[`primesApres1998.brackets[${i}].upTo`] = upErr;
          }
        }
      }
    }
  }

  // apres70ans
  const a70 = avDeces.apres70ans;
  if (a70) {
    const globErr = validateReasonable(a70.globalAllowance, 10000000);
    if (globErr) {
      errors['apres70ans.globalAllowance'] = globErr;
    }
  }

  return errors;
}

/**
 * Combine toutes les erreurs et retourne true si aucune erreur.
 * @param  {...Object} errorObjects
 * @returns {boolean}
 */
export function isValid(...errorObjects) {
  return errorObjects.every(e => Object.keys(e).length === 0);
}

/**
 * Valide les paramètres impôts (incomeTax + pfu + cehr + cdhr + corporateTax).
 * @param {Object} settings - contenu de tax_settings (sans dmtg)
 * @returns {Object} errors par chemin
 */
export function validateImpotsSettings(settings) {
  const errors = {};
  const { incomeTax, pfu, cehr, cdhr, corporateTax } = settings || {};

  // Barèmes IR (scaleCurrent, scalePrevious) — tranches ordonnées + taux 0-100
  for (const period of ['scaleCurrent', 'scalePrevious']) {
    const scaleErrors = validateScaleOrdered(incomeTax?.[period] || []);
    for (const se of scaleErrors) {
      errors[`incomeTax.${period}[${se.index}].${se.field}`] = se.message;
    }
  }

  // Décote ratePercent
  for (const period of ['current', 'previous']) {
    const rateErr = validatePercent(incomeTax?.decote?.[period]?.ratePercent);
    if (rateErr) errors[`incomeTax.decote.${period}.ratePercent`] = rateErr;
  }

  // Abattement DOM ratePercent
  for (const period of ['current', 'previous']) {
    for (const zone of ['gmr', 'guyane']) {
      const rateErr = validatePercent(incomeTax?.domAbatement?.[period]?.[zone]?.ratePercent);
      if (rateErr) errors[`incomeTax.domAbatement.${period}.${zone}.ratePercent`] = rateErr;
    }
  }

  // PFU taux
  for (const period of ['current', 'previous']) {
    for (const key of ['rateIR', 'rateSocial', 'rateTotal']) {
      const rateErr = validatePercent(pfu?.[period]?.[key]);
      if (rateErr) errors[`pfu.${period}.${key}`] = rateErr;
    }
  }

  // CEHR taux (traitées comme barèmes simples — rate en %)
  for (const period of ['current', 'previous']) {
    for (const group of ['single', 'couple']) {
      const rows = cehr?.[period]?.[group] || [];
      for (let i = 0; i < rows.length; i++) {
        const rateErr = validatePercent(rows[i].rate);
        if (rateErr) errors[`cehr.${period}.${group}[${i}].rate`] = rateErr;
      }
    }
  }

  // CDHR taux minimal
  for (const period of ['current', 'previous']) {
    const rateErr = validatePercent(cdhr?.[period]?.minEffectiveRate);
    if (rateErr) errors[`cdhr.${period}.minEffectiveRate`] = rateErr;
  }

  // Impôt sur les sociétés taux
  for (const period of ['current', 'previous']) {
    for (const key of ['normalRate', 'reducedRate']) {
      const rateErr = validatePercent(corporateTax?.[period]?.[key]);
      if (rateErr) errors[`corporateTax.${period}.${key}`] = rateErr;
    }
  }

  return errors;
}

/**
 * Valide les paramètres prélèvements sociaux (patrimony + retirement).
 * @param {Object} settings - contenu de ps_settings
 * @returns {Object} errors par chemin
 */
export function validatePrelevementsSettings(settings) {
  const errors = {};
  const { patrimony, retirement } = settings || {};

  // PS patrimoine : taux en %
  for (const period of ['current', 'previous']) {
    for (const key of ['totalRate', 'csgDeductibleRate']) {
      const rateErr = validatePercent(patrimony?.[period]?.[key]);
      if (rateErr) errors[`patrimony.${period}.${key}`] = rateErr;
    }
  }

  // PS retraites : taux par tranche en %
  for (const period of ['current', 'previous']) {
    const brackets = retirement?.[period]?.brackets || [];
    for (let i = 0; i < brackets.length; i++) {
      for (const key of ['csgRate', 'crdsRate', 'casaRate', 'maladieRate', 'totalRate', 'csgDeductibleRate']) {
        const rateErr = validatePercent(brackets[i][key]);
        if (rateErr) errors[`retirement.${period}.brackets[${i}].${key}`] = rateErr;
      }
    }
  }

  return errors;
}
