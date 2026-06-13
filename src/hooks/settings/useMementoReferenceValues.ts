import { useCallback, useEffect, useState } from 'react';

import type { MementoReferenceValue } from '@/domain/settings-memento/referenceValues';
import {
  broadcastMementoReferenceValuesInvalidation,
  getMementoReferenceValues,
  subscribeMementoReferenceValuesInvalidation,
  upsertMementoReferenceValues,
} from '@/utils/cache/mementoReferenceValuesCache';

export interface MementoReferenceValuesSaveResult {
  ok: boolean;
  error?: string;
}

export interface UseMementoReferenceValuesReturn {
  rows: MementoReferenceValue[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  handleNumericChange: (key: string, field: 'value_numeric' | 'year', value: string) => void;
  handleTextChange: (key: string, field: 'value_text' | 'note', value: string) => void;
  save: () => Promise<MementoReferenceValuesSaveResult>;
}

function parseNumberInput(value: string): number | null {
  const normalized = value.replace(',', '.').trim();
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function useMementoReferenceValues(isAdmin: boolean): UseMementoReferenceValuesReturn {
  const [rows, setRows] = useState<MementoReferenceValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false): Promise<void> => {
    setLoading(true);
    try {
      const values = await getMementoReferenceValues({ force });
      setRows(values);
      setError(null);
    } catch {
      setError('Les valeurs de référence du mémento ne peuvent pas être chargées.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    return subscribeMementoReferenceValuesInvalidation(() => {
      void load(true);
    });
  }, [load]);

  const handleNumericChange = (
    key: string,
    field: 'value_numeric' | 'year',
    value: string,
  ): void => {
    const parsed = parseNumberInput(value);
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.key !== key) return row;
        if (field === 'year' && parsed === null) return row;
        return { ...row, [field]: parsed };
      }),
    );
  };

  const handleTextChange = (key: string, field: 'value_text' | 'note', value: string): void => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === key ? { ...row, [field]: value || null } : row)),
    );
  };

  const save = async (): Promise<MementoReferenceValuesSaveResult> => {
    if (!isAdmin) return { ok: true };

    const missingValue = rows.find((row) => row.value_numeric === null && row.value_text === null);
    if (missingValue) {
      const message = `La valeur "${missingValue.label}" est obligatoire.`;
      setError(message);
      return { ok: false, error: message };
    }

    setSaving(true);
    try {
      await upsertMementoReferenceValues(rows);
      broadcastMementoReferenceValuesInvalidation();
      setError(null);
      return { ok: true };
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Erreur lors de l'enregistrement des valeurs du mémento.";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  };

  return {
    rows,
    loading,
    saving,
    error,
    handleNumericChange,
    handleTextChange,
    save,
  };
}
