/**
 * Smoke tests - Vérifie que le framework engine fonctionne
 */

import { describe, it, expect } from 'vitest';
import { mkResult, mkRuleVersion, addValidationWarning, trace } from '../helpers';
import type { CalcResultBuilder, Warning } from '../types';

describe('Engine Helpers', () => {
  it('mkResult crée un résultat avec timestamp', () => {
    const builder: CalcResultBuilder<{ total: number }> = {
      id: 'test-calc',
      name: 'Test Calculation',
      inputs: [{ id: 'a', label: 'Input A', value: 100, unit: '€' }],
      assumptions: [],
      formulaText: 'total = a * 2',
      outputs: [{ id: 'total', label: 'Total', value: 200, unit: '€' }],
      result: { total: 200 },
      ruleVersion: mkRuleVersion('1.0.0', 'Test'),
      sourceNote: 'Test case',
      warnings: [],
    };

    const result = mkResult(builder);

    expect(result.id).toBe('test-calc');
    expect(result.computedAt).toBeDefined();
    expect(new Date(result.computedAt).getTime()).toBeGreaterThan(0);
  });

  it('mkRuleVersion crée une version de règle', () => {
    const version = mkRuleVersion('2024.1', 'CGI Art. 200', true);

    expect(version.version).toBe('2024.1');
    expect(version.source).toBe('CGI Art. 200');
    expect(version.validated).toBe(true);
  });

  it('addValidationWarning ajoute un warning À valider', () => {
    const warnings: Warning[] = [];
    const updated = addValidationWarning(warnings, 'TMI', 'Barème 2024 à confirmer');

    expect(updated).toHaveLength(1);
    expect(updated[0].code).toBe('VALIDATION_REQUIRED_TMI');
    expect(updated[0].message).toContain('À valider');
    expect(updated[0].severity).toBe('warning');
  });

  it('trace ne crash pas en production', () => {
    const result = mkResult({
      id: 'trace-test',
      name: 'Trace Test',
      inputs: [],
      assumptions: [],
      formulaText: '',
      outputs: [],
      result: {},
      ruleVersion: mkRuleVersion('1.0', 'test'),
      sourceNote: '',
      warnings: [],
    });

    // Should not throw
    expect(() => trace(result)).not.toThrow();
  });
});
