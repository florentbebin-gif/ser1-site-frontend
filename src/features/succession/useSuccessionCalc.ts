/**
 * useSuccessionCalc — Hook orchestrating succession engine (P1-02)
 *
 * Zero calculation in React: all formulas live in src/engine/succession/.
 * This hook manages UI state and delegates to the engine.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  calculateSuccession,
  type SuccessionInput,
  type SuccessionResult,
  type LienParente,
  type HeritiersInput,
} from '../../engine/succession';
import type { CalcResult } from '../../engine/types';

export interface HeritierRow {
  id: string;
  lien: LienParente;
  partSuccession: number;
}

export interface SuccessionFormState {
  actifNetSuccession: number;
  heritiers: HeritierRow[];
}

export interface SuccessionCalcHook {
  form: SuccessionFormState;
  result: CalcResult<SuccessionResult> | null;
  setActifNet: (v: number) => void;
  addHeritier: (lien: LienParente) => void;
  removeHeritier: (id: string) => void;
  updateHeritier: (id: string, field: keyof HeritierRow, value: string | number) => void;
  distributeEqually: () => void;
  compute: () => void;
  reset: () => void;
  hasResult: boolean;
}

let nextId = 1;
function genId(): string {
  return `h-${nextId++}`;
}

const DEFAULT_FORM: SuccessionFormState = {
  actifNetSuccession: 0,
  heritiers: [
    { id: genId(), lien: 'enfant', partSuccession: 0 },
  ],
};

export function useSuccessionCalc(): SuccessionCalcHook {
  const [form, setForm] = useState<SuccessionFormState>({ ...DEFAULT_FORM, heritiers: [...DEFAULT_FORM.heritiers] });
  const [result, setResult] = useState<CalcResult<SuccessionResult> | null>(null);

  const setActifNet = useCallback((v: number) => {
    setForm((prev) => ({ ...prev, actifNetSuccession: v }));
  }, []);

  const addHeritier = useCallback((lien: LienParente) => {
    setForm((prev) => ({
      ...prev,
      heritiers: [...prev.heritiers, { id: genId(), lien, partSuccession: 0 }],
    }));
  }, []);

  const removeHeritier = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      heritiers: prev.heritiers.filter((h) => h.id !== id),
    }));
  }, []);

  const updateHeritier = useCallback((id: string, field: keyof HeritierRow, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      heritiers: prev.heritiers.map((h) =>
        h.id === id ? { ...h, [field]: value } : h
      ),
    }));
  }, []);

  const distributeEqually = useCallback(() => {
    setForm((prev) => {
      const count = prev.heritiers.length;
      if (count === 0 || prev.actifNetSuccession <= 0) return prev;
      const part = Math.floor(prev.actifNetSuccession / count);
      return {
        ...prev,
        heritiers: prev.heritiers.map((h) => ({ ...h, partSuccession: part })),
      };
    });
  }, []);

  const compute = useCallback(() => {
    const engineInput: SuccessionInput = {
      actifNetSuccession: form.actifNetSuccession,
      heritiers: form.heritiers.map((h): HeritiersInput => ({
        lien: h.lien,
        partSuccession: h.partSuccession,
      })),
    };
    const calcResult = calculateSuccession(engineInput);
    setResult(calcResult);
  }, [form]);

  const reset = useCallback(() => {
    nextId = 1;
    setForm({ ...DEFAULT_FORM, heritiers: [{ id: genId(), lien: 'enfant', partSuccession: 0 }] });
    setResult(null);
  }, []);

  const hasResult = useMemo(() => result !== null, [result]);

  return {
    form,
    result,
    setActifNet,
    addHeritier,
    removeHeritier,
    updateHeritier,
    distributeEqually,
    compute,
    reset,
    hasResult,
  };
}
