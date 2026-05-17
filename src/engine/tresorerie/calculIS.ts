/**
 * calculIS.ts — Calcul de l'Impôt sur les Sociétés
 *
 * Formule (preuve : cellule V21 feuille sheet31 du XLSM) :
 *   IS = isReducedRate × min(RAI, seuil) + isNormalRate × max(0, RAI − seuil)
 *
 * Règle invariant 9 : les taux fiscaux sont toujours reçus via TresoFiscalParams —
 * jamais lus directement ici.
 */

import type { TresoFiscalParams, HoldingParticipationInput } from './types';

interface CalculISResult {
  baseIS: number;
  is: number;
}

/**
 * Calcule l'IS à partir de la base imposable.
 * La base IS est clampée à 0 côté appelant (invariant 6).
 */
export function calculIS(baseIS: number, params: TresoFiscalParams): number {
  if (baseIS <= 0) return 0;
  const trancheReduite = Math.min(baseIS, params.isReducedThreshold);
  const trancheNormale = Math.max(0, baseIS - params.isReducedThreshold);
  return trancheReduite * params.isReducedRate + trancheNormale * params.isNormalRate;
}

/**
 * Calcule le résultat fiscal avec ajustement régime mère-fille.
 *
 * Sans holding : resultatFiscal = resultatComptable
 * Avec régime mère-fille éligible :
 *   - dividendesFiliales intégrés en totalité dans le résultat comptable
 *   - seule la quote-part QPFC entre dans la base IS
 */
export function calculResultatFiscalHolding(
  resultatComptableSansHolding: number,
  dividendesFiliales: number,
  holding: HoldingParticipationInput | undefined,
  params: TresoFiscalParams,
): {
  resultatComptable: number;
  resultatFiscal: number;
  quotePartTaxable: number;
  dividendesFilialesExoneres: number;
} {
  if (!holding?.actif || dividendesFiliales <= 0) {
    return {
      resultatComptable: resultatComptableSansHolding,
      resultatFiscal: resultatComptableSansHolding,
      quotePartTaxable: 0,
      dividendesFilialesExoneres: 0,
    };
  }

  // Les dividendes filiales s'ajoutent toujours intégralement au résultat comptable
  const resultatComptable = resultatComptableSansHolding + dividendesFiliales;

  if (holding.regimeMereFilleEligible) {
    const qpfcRate = holding.regimeGroupeFiscal
      ? params.motherDaughterGroupQpfcRate
      : params.motherDaughterStandardQpfcRate;
    const quotePartTaxable = dividendesFiliales * qpfcRate;
    const dividendesFilialesExoneres = dividendesFiliales - quotePartTaxable;
    const resultatFiscal = resultatComptableSansHolding + quotePartTaxable;
    return { resultatComptable, resultatFiscal, quotePartTaxable, dividendesFilialesExoneres };
  }

  // Pas éligible : totalité taxable
  return {
    resultatComptable,
    resultatFiscal: resultatComptable,
    quotePartTaxable: dividendesFiliales,
    dividendesFilialesExoneres: 0,
  };
}

/**
 * Calcule base IS + IS à partir du résultat fiscal avant IS.
 * Invariant 6 : baseIS = max(0, resultatFiscalAvantIS)
 */
export function calculBaseEtIS(
  resultatFiscalAvantIS: number,
  params: TresoFiscalParams,
  reducedCorporateTaxEligible = true,
): CalculISResult {
  const baseIS = Math.max(0, resultatFiscalAvantIS);
  const is = reducedCorporateTaxEligible ? calculIS(baseIS, params) : baseIS * params.isNormalRate;
  return { baseIS, is };
}
