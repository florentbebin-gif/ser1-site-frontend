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
} from '../../../engine/succession';
import type { DmtgSettings } from '../../../engine/civil';
import type { CalcResult } from '../../../engine/types';
import type { PersistedSuccessionForm } from '../successionDraft.types';

export type { PersistedSuccessionForm } from '../successionDraft.types';

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
  persistedForm: PersistedSuccessionForm;
  setActifNet: (_v: number) => void;
  addHeritier: (_lien: LienParente) => void;
  removeHeritier: (_id: string) => void;
  updateHeritier: (_id: string, _field: keyof HeritierRow, _value: string | number) => void;
  hydrateForm: (_form: PersistedSuccessionForm) => void;
  distributeEqually: () => void;
  reset: () => void;
  hasResult: boolean;
}

let nextId = 1;
function genId(): string {
  return `h-${nextId++}`;
}

function createDefaultPersistedForm(): PersistedSuccessionForm {
  return {
    actifNetSuccession: 0,
    heritiers: [{ lien: 'enfant', partSuccession: 0 }],
  };
}

function normalizePersistedForm(input: PersistedSuccessionForm): PersistedSuccessionForm {
  const actifNetSuccession = Number.isFinite(input.actifNetSuccession)
    ? Math.max(0, input.actifNetSuccession)
    : 0;
  const safeHeirs = Array.isArray(input.heritiers) ? input.heritiers : [];
  const heritiers = safeHeirs
    .map((h) => ({
      lien: h.lien,
      partSuccession: Number.isFinite(h.partSuccession) ? Math.max(0, h.partSuccession) : 0,
    }))
    .filter((h) => h.lien);

  return {
    actifNetSuccession,
    heritiers: heritiers.length > 0 ? heritiers : [{ lien: 'enfant', partSuccession: 0 }],
  };
}

function buildFormFromPersisted(input: PersistedSuccessionForm): SuccessionFormState {
  const normalized = normalizePersistedForm(input);
  return {
    actifNetSuccession: normalized.actifNetSuccession,
    heritiers: normalized.heritiers.map((h) => ({
      id: genId(),
      lien: h.lien,
      partSuccession: h.partSuccession,
    })),
  };
}

interface UseSuccessionCalcOptions {
  dmtgSettings?: DmtgSettings;
}

export function useSuccessionCalc({ dmtgSettings }: UseSuccessionCalcOptions = {}): SuccessionCalcHook {
  const [form, setForm] = useState<SuccessionFormState>(() => buildFormFromPersisted(createDefaultPersistedForm()));

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

  const hydrateForm = useCallback((persisted: PersistedSuccessionForm) => {
    setForm(buildFormFromPersisted(persisted));
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

  const reset = useCallback(() => {
    nextId = 1;
    setForm(buildFormFromPersisted(createDefaultPersistedForm()));
  }, []);
  const persistedForm = useMemo<PersistedSuccessionForm>(
    () => ({
      actifNetSuccession: Number.isFinite(form.actifNetSuccession) ? Math.max(0, form.actifNetSuccession) : 0,
      heritiers: form.heritiers.map((h) => ({
        lien: h.lien,
        partSuccession: Number.isFinite(h.partSuccession) ? Math.max(0, h.partSuccession) : 0,
      })),
    }),
    [form],
  );

  const canCompute = useMemo(
    () => persistedForm.actifNetSuccession > 0 && persistedForm.heritiers.length > 0,
    [persistedForm],
  );

  const result = useMemo<CalcResult<SuccessionResult> | null>(() => {
    if (!canCompute) return null;
    const engineInput: SuccessionInput = {
      actifNetSuccession: persistedForm.actifNetSuccession,
      heritiers: persistedForm.heritiers.map((h): HeritiersInput => ({
        lien: h.lien,
        partSuccession: h.partSuccession,
      })),
      ...(dmtgSettings ? { dmtgSettings } : {}),
    };
    return calculateSuccession(engineInput);
  }, [canCompute, persistedForm, dmtgSettings]);

  const hasResult = useMemo(() => result !== null, [result]);

  return {
    form,
    result,
    persistedForm,
    setActifNet,
    addHeritier,
    removeHeritier,
    updateHeritier,
    hydrateForm,
    distributeEqually,
    reset,
    hasResult,
  };
}
