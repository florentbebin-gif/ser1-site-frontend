import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  MementoReferenceValue,
  MementoReferenceValueDomain,
} from '@/domain/settings-memento/referenceValues';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import {
  isMementoReferenceValuesDraft,
  loadMementoReferenceValuesDraft,
  normalizeMementoReferenceValuesDraft,
  saveMementoReferenceValuesDraft,
} from '@/hooks/settings/mementoReferenceValuesSaveAdapter';
import { subscribeMementoReferenceValuesInvalidation } from '@/utils/cache/mementoReferenceValuesCache';

export interface MementoReferenceValuesSaveResult {
  ok: boolean;
  error?: string;
}

export interface UseMementoReferenceValuesOptions {
  domain?: MementoReferenceValueDomain;
  saveTargetId?: string;
  saveTargetLabel?: string;
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

export function useMementoReferenceValues(
  isAdmin: boolean,
  options: UseMementoReferenceValuesOptions = {},
): UseMementoReferenceValuesReturn {
  const { domain, saveTargetId, saveTargetLabel } = options;
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const markSaveTargetClean = saveRegistry?.markClean;
  const initialRegistryDraftRef = useRef(
    saveTargetId ? saveRegistry?.targets[saveTargetId]?.draft : undefined,
  );
  const [rows, setRows] = useState<MementoReferenceValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false): Promise<void> => {
      if (!force && isMementoReferenceValuesDraft(initialRegistryDraftRef.current)) {
        setRows(normalizeMementoReferenceValuesDraft(initialRegistryDraftRef.current));
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const values = await loadMementoReferenceValuesDraft({ domain, force });
        setRows(values);
        setError(null);
      } catch {
        setError('Les valeurs de référence du mémento ne peuvent pas être chargées.');
      } finally {
        setLoading(false);
      }
    },
    [domain],
  );

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
    if (saveTargetId) markSaveTargetDirty?.(saveTargetId);
  };

  const handleTextChange = (key: string, field: 'value_text' | 'note', value: string): void => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === key ? { ...row, [field]: value || null } : row)),
    );
    if (saveTargetId) markSaveTargetDirty?.(saveTargetId);
  };

  const blockingError = useMemo(() => {
    const missingValue = rows.find((row) => row.value_numeric === null && row.value_text === null);
    return missingValue ? `La valeur "${missingValue.label}" est obligatoire.` : null;
  }, [rows]);

  useEffect(() => {
    if (!registerSaveTarget || !saveTargetId || loading) return;

    registerSaveTarget({
      id: saveTargetId,
      label: saveTargetLabel ?? 'Valeurs de référence',
      draft: rows,
      blockingError,
      save: async (draft): Promise<MementoSaveResult> => {
        return saveMementoReferenceValuesDraft(normalizeMementoReferenceValuesDraft(draft, rows), {
          isAdmin,
          domain,
        });
      },
    });
  }, [
    blockingError,
    domain,
    isAdmin,
    loading,
    registerSaveTarget,
    rows,
    saveTargetId,
    saveTargetLabel,
  ]);

  const save = async (): Promise<MementoReferenceValuesSaveResult> => {
    setSaving(true);
    try {
      const result = await saveMementoReferenceValuesDraft(rows, { isAdmin, domain });
      setError(result.ok ? null : (result.message ?? null));
      if (result.ok && saveTargetId) {
        markSaveTargetClean?.(saveTargetId, 'Valeurs de référence enregistrées.');
      }
      return { ok: result.ok, error: result.ok ? undefined : result.message };
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
