/**
 * Fixtures centralisées pour les tests succession.
 *
 * Ce module exporte les makers `makeCivil`, `makeCivilMarie`, `makeDevolution`
 * et `makeLiquidation` consommés par les tests Vitest du dossier `__tests__`.
 *
 * Pourquoi deux variantes pour le contexte civil ?
 * - `makeCivil` produit un contexte « célibataire » aligné sur
 *   `DEFAULT_SUCCESSION_CIVIL_CONTEXT` (régime nul, situation célibataire).
 * - `makeCivilMarie` produit un contexte marié en communauté légale,
 *   base commune à tous les tests axés conjoint survivant / liquidation
 *   des régimes matrimoniaux.
 *
 * Les deux factories acceptent un `overrides` partiel pour ajuster au cas
 * par cas (régime, PACS, dates de naissance, etc.).
 */

import type {
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDevolutionContextInput,
  SuccessionLiquidationContext,
} from '../successionDraft';
import { DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT } from '../successionDraft';

/**
 * Contexte civil par défaut : célibataire, aucun régime matrimonial.
 * Aligné sur `DEFAULT_SUCCESSION_CIVIL_CONTEXT`.
 */
export function makeCivil(
  overrides: Partial<SuccessionCivilContext> = {},
): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'celibataire',
    regimeMatrimonial: null,
    pacsConvention: 'separation',
    ...overrides,
  };
}

/**
 * Contexte civil « marié en communauté légale ».
 * Utilisé par les tests de liquidation, succession directe, chainage, PER, AV, etc.
 */
export function makeCivilMarie(
  overrides: Partial<SuccessionCivilContext> = {},
): SuccessionCivilContext {
  return {
    situationMatrimoniale: 'marie',
    regimeMatrimonial: 'communaute_legale',
    pacsConvention: 'separation',
    ...overrides,
  };
}

/**
 * Contexte de dévolution complet, dérivé de `DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT`.
 *
 * Les `testamentsBySide` et `ascendantsSurvivantsBySide` sont fusionnés en
 * profondeur pour qu'un override partiel (ex. `testamentsBySide: { epoux1: { active: true } }`)
 * ne casse pas les autres clés.
 */
export function makeDevolution(
  overrides: SuccessionDevolutionContextInput = {},
): SuccessionDevolutionContext {
  return {
    ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT,
    ...overrides,
    testamentsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide,
      ...overrides.testamentsBySide,
      epoux1: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux1,
        ...overrides.testamentsBySide?.epoux1,
        particularLegacies: overrides.testamentsBySide?.epoux1?.particularLegacies ?? [],
      },
      epoux2: {
        ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.testamentsBySide.epoux2,
        ...overrides.testamentsBySide?.epoux2,
        particularLegacies: overrides.testamentsBySide?.epoux2?.particularLegacies ?? [],
      },
    },
    ascendantsSurvivantsBySide: {
      ...DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT.ascendantsSurvivantsBySide,
      ...overrides.ascendantsSurvivantsBySide,
    },
  };
}

/**
 * Contexte de liquidation patrimoniale.
 *
 * Les valeurs par défaut (actifs à 0, aucun enfant) correspondent à
 * `DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT` ; les tests qui veulent des
 * montants concrets passent des overrides explicites.
 */
export function makeLiquidation(
  overrides: Partial<SuccessionLiquidationContext> = {},
): SuccessionLiquidationContext {
  return {
    actifEpoux1: 0,
    actifEpoux2: 0,
    actifCommun: 0,
    nbEnfants: 0,
    ...overrides,
  };
}
