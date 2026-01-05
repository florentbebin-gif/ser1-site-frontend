/**
 * Calcul Engine - Point d'entrée
 * 
 * Toutes les formules fiscales/patrimoniales doivent être dans src/engine/**
 * Aucun calcul critique ne doit vivre dans un composant React.
 */

// Types
export type {
  Assumption,
  Warning,
  RuleVersion,
  CalcInput,
  CalcOutput,
  CalcResult,
  CalcResultBuilder,
} from './types';

// Helpers
export { mkResult, addValidationWarning, mkRuleVersion, trace } from './helpers';

// Modules de calcul
export * from './civil';
export * from './tax';
export * from './succession';
