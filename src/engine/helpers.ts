/**
 * Engine Helpers - Fonctions utilitaires pour la traçabilité des calculs
 */

import type { CalcResult, CalcResultBuilder, Warning, RuleVersion } from './types';

/**
 * Crée un résultat de calcul traçable avec timestamp
 */
export function mkResult<T>(builder: CalcResultBuilder<T>): CalcResult<T> {
  return {
    ...builder,
    computedAt: new Date().toISOString(),
  };
}

/**
 * Ajoute un warning "À valider" pour les règles incertaines
 */
export function addValidationWarning(warnings: Warning[], ruleId: string, message: string): Warning[] {
  return [
    ...warnings,
    {
      code: `VALIDATION_REQUIRED_${ruleId}`,
      message: `À valider : ${message}`,
      severity: 'warning',
    },
  ];
}

/**
 * Crée une version de règle par défaut (non validée)
 */
export function mkRuleVersion(version: string, source: string, validated = false): RuleVersion {
  return {
    version,
    date: new Date().toISOString().split('T')[0],
    source,
    validated,
  };
}

/**
 * Trace un calcul pour debug/audit
 */
export function trace(calcResult: CalcResult<unknown>): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.group(`[Engine] ${calcResult.name} (${calcResult.id})`);
    // eslint-disable-next-line no-console
    console.debug('Inputs:', calcResult.inputs);
    // eslint-disable-next-line no-console
    console.debug('Assumptions:', calcResult.assumptions);
    // eslint-disable-next-line no-console
    console.debug('Formula:', calcResult.formulaText);
    // eslint-disable-next-line no-console
    console.debug('Outputs:', calcResult.outputs);
    // eslint-disable-next-line no-console
    console.debug('Result:', calcResult.result);
    // eslint-disable-next-line no-console
    console.debug('Version:', calcResult.ruleVersion);
    if (calcResult.warnings.length > 0) {
      console.warn('Warnings:', calcResult.warnings);
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}
