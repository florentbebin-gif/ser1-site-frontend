import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import { isValid, validateImpotsSettings } from '../validators/dmtgValidators';
import {
  createImpotsDraft,
  isImpotsDraft,
  loadImpotsDraft,
  saveImpotsDraft,
  type ImpotsDraft,
  type ImpotsIncomeScaleFieldKey,
  type ImpotsIncomeScaleKey,
  type ImpotsIncomeScaleRow,
  type ImpotsPsSettings,
  type ImpotsTaxSettings,
} from './impotsSaveAdapter';

export const IMPOTS_MEMENTO_SAVE_TARGET_ID = 'impots';
const IMPOTS_MEMENTO_SAVE_LABEL = 'Impôts';

type NestedRecord = Record<string, unknown>;

export function useImpotsSettings() {
  const { isAdmin } = useUserRole();
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const initialRegistryDraftRef = useRef(
    saveRegistry?.targets[IMPOTS_MEMENTO_SAVE_TARGET_ID]?.draft,
  );
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState<ImpotsTaxSettings>(
    isImpotsDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.taxSettings
      : (DEFAULT_TAX_SETTINGS as ImpotsTaxSettings),
  );
  const [psSettings, setPsSettings] = useState<ImpotsPsSettings>(
    isImpotsDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.psSettings
      : (DEFAULT_PS_SETTINGS as ImpotsPsSettings),
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (isImpotsDraft(initialRegistryDraftRef.current)) {
        if (mounted) setLoading(false);
        return;
      }

      const draft = await loadImpotsDraft();
      if (!mounted) return;
      setTaxSettings(draft.taxSettings);
      setPsSettings(draft.psSettings);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setDataRecord = (updater: (prev: NestedRecord) => NestedRecord): void => {
    setTaxSettings((prev) => updater(prev as NestedRecord) as ImpotsTaxSettings);
  };
  const updateFieldBase = createFieldUpdater(setDataRecord, () => undefined);
  const updateField = (path: string[], value: string | number | null): void => {
    updateFieldBase(path, value);
    markSaveTargetDirty?.(IMPOTS_MEMENTO_SAVE_TARGET_ID);
  };

  const updateIncomeScale = (
    which: ImpotsIncomeScaleKey,
    index: number,
    key: ImpotsIncomeScaleFieldKey,
    value: string | number | null,
  ): void => {
    setTaxSettings((prev) => ({
      ...prev,
      incomeTax: {
        ...prev.incomeTax,
        [which]: prev.incomeTax[which].map((row, rowIndex) =>
          rowIndex === index
            ? { ...row, [key]: value as ImpotsIncomeScaleRow[ImpotsIncomeScaleFieldKey] }
            : row,
        ),
      },
    }));
    markSaveTargetDirty?.(IMPOTS_MEMENTO_SAVE_TARGET_ID);
  };

  const impotsErrors = useMemo(
    () => validateImpotsSettings(taxSettings as Parameters<typeof validateImpotsSettings>[0]),
    [taxSettings],
  );
  const hasErrors = !isValid(impotsErrors);
  const draft = useMemo(
    () => createImpotsDraft(taxSettings, psSettings),
    [psSettings, taxSettings],
  );
  const blockingError = hasErrors ? 'Corrigez les erreurs impôts avant de sauvegarder' : null;

  useEffect(() => {
    if (!registerSaveTarget || loading) return;
    registerSaveTarget({
      id: IMPOTS_MEMENTO_SAVE_TARGET_ID,
      label: IMPOTS_MEMENTO_SAVE_LABEL,
      draft,
      blockingError,
      save: (candidateDraft): Promise<MementoSaveResult> =>
        saveImpotsDraft(
          isImpotsDraft(candidateDraft) ? candidateDraft : (draft as ImpotsDraft),
          isAdmin,
        ),
    });
  }, [blockingError, draft, isAdmin, loading, registerSaveTarget]);

  return {
    isAdmin,
    loading,
    taxSettings,
    psSettings,
    incomeTax: taxSettings.incomeTax,
    pfu: taxSettings.pfu,
    cehr: taxSettings.cehr,
    cdhr: taxSettings.cdhr,
    ifi: taxSettings.ifi,
    patrimony: psSettings.patrimony,
    updateField,
    updateIncomeScale,
    impotsErrors,
    hasErrors,
  };
}
