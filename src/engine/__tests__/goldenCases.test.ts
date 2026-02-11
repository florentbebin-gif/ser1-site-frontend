/**
 * Golden Case Test Runner
 *
 * Charge les fichiers *.golden.json et vérifie que le moteur fiscal
 * produit les résultats attendus. Sert de filet de sécurité avant
 * tout refactoring (P0-04a).
 *
 * Convention assertions :
 *   "result.tmi": 30        → expect(result.tmi).toBe(30)
 *   "result.impotBrut__gt": 0  → expect(result.impotBrut).toBeGreaterThan(0)
 *   "result.isRedevable": true → expect(result.isRedevable).toBe(true)
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { calculateIR, calculateCEHR, calculateIFI } from '../tax';

// ---------- helpers ----------

type EngineFn = (_input: Record<string, unknown>) => { result: Record<string, unknown> };

const FUNCTION_MAP: Record<string, EngineFn> = {
  calculateIR: calculateIR as unknown as EngineFn,
  calculateCEHR: calculateCEHR as unknown as EngineFn,
  calculateIFI: calculateIFI as unknown as EngineFn,
};

interface GoldenCase {
  description: string;
  module: string;
  function: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// ---------- load fixtures ----------

const currentDir = dirname(fileURLToPath(import.meta.url));
const goldenDir = join(currentDir, 'golden');
const goldenFiles = existsSync(goldenDir)
  ? readdirSync(goldenDir).filter((f: string) => f.endsWith('.golden.json'))
  : [];

// ---------- tests ----------

describe('Golden Cases', () => {
  if (goldenFiles.length === 0) {
    it.skip('aucun fichier golden trouvé', () => {});
    return;
  }

  for (const file of goldenFiles) {
    const raw = readFileSync(join(goldenDir, file), 'utf-8');
    const golden: GoldenCase = JSON.parse(raw);

    describe(`${file} — ${golden.description}`, () => {
      const fn = FUNCTION_MAP[golden.function];

      it('fonction moteur existe', () => {
        expect(fn).toBeDefined();
      });

      if (!fn) return;

      const calcResult = fn(golden.input);

      for (const [key, expectedValue] of Object.entries(golden.expected)) {
        // Parse assertion type from key suffix
        const isGt = key.endsWith('__gt');
        const isGte = key.endsWith('__gte');
        const isLt = key.endsWith('__lt');
        const cleanKey = key.replace(/__(gt|gte|lt)$/, '');

        it(`${cleanKey} ${isGt ? '>' : isGte ? '>=' : isLt ? '<' : '==='} ${expectedValue}`, () => {
          const actual = getNestedValue(calcResult, cleanKey);
          if (isGt) {
            expect(actual).toBeGreaterThan(expectedValue as number);
          } else if (isGte) {
            expect(actual).toBeGreaterThanOrEqual(expectedValue as number);
          } else if (isLt) {
            expect(actual).toBeLessThan(expectedValue as number);
          } else if (typeof expectedValue === 'number') {
            expect(actual).toBeCloseTo(expectedValue, 0);
          } else {
            expect(actual).toBe(expectedValue);
          }
        });
      }
    });
  }
});
