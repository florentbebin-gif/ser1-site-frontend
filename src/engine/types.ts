/**
 * Engine Types - Traçabilité des calculs
 * Chaque calcul doit exposer : id, name, inputs, assumptions, formulaText, outputs, ruleVersion, sourceNote, warnings[]
 */

export interface Assumption {
  id: string;
  label: string;
  value: string | number | boolean;
  source?: string;
  editable?: boolean;
}

export interface Warning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface RuleVersion {
  version: string;
  date: string;
  source: string;
  validated: boolean;
}

export interface CalcInput {
  id: string;
  label: string;
  value: number | string | boolean;
  unit?: string;
}

export interface CalcOutput {
  id: string;
  label: string;
  value: number | string | boolean;
  unit?: string;
  formula?: string;
}

export interface CalcResult<T = Record<string, unknown>> {
  id: string;
  name: string;
  inputs: CalcInput[];
  assumptions: Assumption[];
  formulaText: string;
  outputs: CalcOutput[];
  result: T;
  ruleVersion: RuleVersion;
  sourceNote: string;
  warnings: Warning[];
  computedAt: string;
}

// Helper type for creating calc results
export type CalcResultBuilder<T> = Omit<CalcResult<T>, 'computedAt'>;
