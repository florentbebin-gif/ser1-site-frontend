import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';
import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import { isValid, validatePrelevementsSettings } from '../validators/dmtgValidators';
import {
  createPrelevementsDraft,
  derivePsYearLabel,
  isPrelevementsDraft,
  loadPrelevementsDraft,
  savePrelevementsDraft,
  type PrelevementsDraft,
  type PrelevementsPassHistoryRow,
  type PrelevementsPsSettings,
  type PrelevementsRetirementBracket,
  type PrelevementsRetirementBracketKey,
  type PrelevementsRetirementYearKey,
  type PrelevementsTaxSettings,
} from './prelevementsSaveAdapter';

export const PRELEVEMENTS_MEMENTO_SAVE_TARGET_ID = 'prelevements';
const PRELEVEMENTS_MEMENTO_SAVE_LABEL = 'Prélèvements sociaux';

type NestedRecord = Record<string, unknown>;

export function usePrelevementsSettings() {
  const { isAdmin } = useUserRole();
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const initialRegistryDraftRef = useRef(
    saveRegistry?.targets[PRELEVEMENTS_MEMENTO_SAVE_TARGET_ID]?.draft,
  );
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrelevementsPsSettings>(
    isPrelevementsDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.settings
      : (DEFAULT_PS_SETTINGS as PrelevementsPsSettings),
  );
  const [taxSettings, setTaxSettings] = useState<PrelevementsTaxSettings>(
    isPrelevementsDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.taxSettings
      : (DEFAULT_TAX_SETTINGS as PrelevementsTaxSettings),
  );
  const [passRows, setPassRows] = useState<PrelevementsPassHistoryRow[]>(
    isPrelevementsDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.passRows
      : [],
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (isPrelevementsDraft(initialRegistryDraftRef.current)) {
        if (mounted) setLoading(false);
        return;
      }

      const draft = await loadPrelevementsDraft(isAdmin);
      if (!mounted) return;
      setSettings(draft.settings);
      setTaxSettings(draft.taxSettings);
      setPassRows(draft.passRows);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  const markPrelevementsDirty = (): void => {
    markSaveTargetDirty?.(PRELEVEMENTS_MEMENTO_SAVE_TARGET_ID);
  };

  const setDataRecord = (updater: (prev: NestedRecord) => NestedRecord): void => {
    setSettings((prev) => updater(prev as NestedRecord) as PrelevementsPsSettings);
  };
  const updateFieldBase = createFieldUpdater(setDataRecord, () => undefined);
  const updateField = (path: string[], value: string | number | null): void => {
    updateFieldBase(path, value);
    markPrelevementsDirty();
  };

  const updateRetirementBracket = (
    yearKey: PrelevementsRetirementYearKey,
    index: number,
    key: PrelevementsRetirementBracketKey,
    value: string | number | null,
  ): void => {
    setSettings((prev) => ({
      ...prev,
      retirement: {
        ...prev.retirement,
        [yearKey]: {
          ...prev.retirement[yearKey],
          brackets: prev.retirement[yearKey].brackets.map((row, rowIndex) =>
            rowIndex === index
              ? { ...row, [key]: value as PrelevementsRetirementBracket[typeof key] }
              : row,
          ),
        },
      },
    }));
    markPrelevementsDirty();
  };

  const updatePassAmount = (index: number, value: string): void => {
    setPassRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, pass_amount: value === '' ? null : Number(value) } : row,
      ),
    );
    markPrelevementsDirty();
  };

  const effectiveLabels = useMemo(
    () => ({
      currentYearLabel: derivePsYearLabel(
        taxSettings.incomeTax.currentYearLabel,
        settings.labels.currentYearLabel,
      ),
      previousYearLabel: derivePsYearLabel(
        taxSettings.incomeTax.previousYearLabel,
        settings.labels.previousYearLabel,
      ),
    }),
    [
      settings.labels.currentYearLabel,
      settings.labels.previousYearLabel,
      taxSettings.incomeTax.currentYearLabel,
      taxSettings.incomeTax.previousYearLabel,
    ],
  );
  const settingsForDraft = useMemo(
    () => ({
      ...settings,
      labels: effectiveLabels,
    }),
    [effectiveLabels, settings],
  );
  const psErrors = useMemo(
    () =>
      validatePrelevementsSettings(
        settingsForDraft as Parameters<typeof validatePrelevementsSettings>[0],
      ),
    [settingsForDraft],
  );
  const hasErrors = !isValid(psErrors);
  const draft = useMemo(
    () => createPrelevementsDraft(settingsForDraft, taxSettings, passRows),
    [passRows, settingsForDraft, taxSettings],
  );
  const blockingError = hasErrors
    ? 'Corrigez les erreurs de prélèvements sociaux avant de sauvegarder'
    : null;

  useEffect(() => {
    if (!registerSaveTarget || loading) return;
    registerSaveTarget({
      id: PRELEVEMENTS_MEMENTO_SAVE_TARGET_ID,
      label: PRELEVEMENTS_MEMENTO_SAVE_LABEL,
      draft,
      blockingError,
      save: (candidateDraft): Promise<MementoSaveResult> =>
        savePrelevementsDraft(
          isPrelevementsDraft(candidateDraft) ? candidateDraft : (draft as PrelevementsDraft),
          isAdmin,
        ),
    });
  }, [blockingError, draft, isAdmin, loading, registerSaveTarget]);

  return {
    isAdmin,
    loading,
    settings: settingsForDraft,
    taxSettings,
    patrimony: settingsForDraft.patrimony,
    retirement: settingsForDraft.retirement,
    retirementThresholds: settingsForDraft.retirementThresholds,
    socialDirigeant: settingsForDraft.socialDirigeant,
    passRows,
    effectiveLabels,
    updateField,
    updateRetirementBracket,
    updatePassAmount,
    psErrors,
    hasErrors,
  };
}
