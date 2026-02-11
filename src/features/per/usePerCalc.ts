/**
 * usePerCalc — Hook orchestrating PER engine (P1-03)
 *
 * Zero calculation in React: all formulas live in src/engine/per.ts.
 * This hook manages UI state and delegates to the engine.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  calculatePER,
  type PerInput,
  type PerResult,
} from '../../engine/per';
import type { CalcResult } from '../../engine/types';

const SESSION_KEY = 'ser1:sim:per';

export interface PerFormState {
  versementAnnuel: number;
  dureeAnnees: number;
  tmi: number;
  rendementAnnuel: number;
  fraisGestion: number;
  ageSouscription: number;
}

export interface PerCalcHook {
  form: PerFormState;
  result: CalcResult<PerResult> | null;
  setField: <K extends keyof PerFormState>(field: K, value: PerFormState[K]) => void;
  compute: () => void;
  reset: () => void;
  hasResult: boolean;
}

function loadFromSession(): PerFormState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PerFormState;
  } catch {
    return null;
  }
}

function saveToSession(form: PerFormState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(form));
  } catch {
    // sessionStorage full or unavailable
  }
}

const DEFAULT_FORM: PerFormState = {
  versementAnnuel: 0,
  dureeAnnees: 20,
  tmi: 30,
  rendementAnnuel: 3,
  fraisGestion: 0.8,
  ageSouscription: 45,
};

export function usePerCalc(): PerCalcHook {
  const [form, setForm] = useState<PerFormState>(() => loadFromSession() ?? { ...DEFAULT_FORM });
  const [result, setResult] = useState<CalcResult<PerResult> | null>(null);

  const setField = useCallback(<K extends keyof PerFormState>(field: K, value: PerFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      saveToSession(next);
      return next;
    });
  }, []);

  const compute = useCallback(() => {
    const engineInput: PerInput = {
      versementAnnuel: form.versementAnnuel,
      dureeAnnees: form.dureeAnnees,
      tmi: form.tmi,
      rendementAnnuel: form.rendementAnnuel,
      fraisGestion: form.fraisGestion,
      ageSouscription: form.ageSouscription,
    };
    const calcResult = calculatePER(engineInput);
    setResult(calcResult);
    saveToSession(form);
  }, [form]);

  const reset = useCallback(() => {
    setForm({ ...DEFAULT_FORM });
    setResult(null);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  const hasResult = useMemo(() => result !== null, [result]);

  return {
    form,
    result,
    setField,
    compute,
    reset,
    hasResult,
  };
}
