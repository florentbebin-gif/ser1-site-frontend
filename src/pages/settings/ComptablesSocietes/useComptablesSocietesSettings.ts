import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import { createFieldUpdater } from '@/components/settings/settingsHelpers';
import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import { isValid, validateCorporateTaxSettings } from '../validators/dmtgValidators';
import {
  createComptablesSocietesDraft,
  isComptablesSocietesDraft,
  loadComptablesSocietesDraft,
  saveComptablesSocietesDraft,
  type ComptablesSocietesDraft,
  type ComptablesSocietesTaxSettings,
} from './comptablesSocietesSaveAdapter';

export const COMPTABLES_SOCIETES_MEMENTO_SAVE_TARGET_ID = 'comptables-societes';
const COMPTABLES_SOCIETES_MEMENTO_SAVE_LABEL = 'Comptables et sociétés';

type NestedRecord = Record<string, unknown>;

export function useComptablesSocietesSettings() {
  const { isAdmin } = useUserRole();
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const initialRegistryDraftRef = useRef(
    saveRegistry?.targets[COMPTABLES_SOCIETES_MEMENTO_SAVE_TARGET_ID]?.draft,
  );
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ComptablesSocietesTaxSettings>(
    isComptablesSocietesDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.settings
      : (DEFAULT_TAX_SETTINGS as ComptablesSocietesTaxSettings),
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (isComptablesSocietesDraft(initialRegistryDraftRef.current)) {
        if (mounted) setLoading(false);
        return;
      }

      const draft = await loadComptablesSocietesDraft();
      if (!mounted) return;
      setSettings(draft.settings);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const setDataRecord = (updater: (prev: NestedRecord) => NestedRecord): void => {
    setSettings((prev) => updater(prev as NestedRecord) as ComptablesSocietesTaxSettings);
  };
  const updateFieldBase = createFieldUpdater(setDataRecord, () => undefined);
  const updateField = (path: string[], value: string | number | null): void => {
    updateFieldBase(path, value);
    markSaveTargetDirty?.(COMPTABLES_SOCIETES_MEMENTO_SAVE_TARGET_ID);
  };

  const corporateTaxErrors = useMemo(
    () =>
      validateCorporateTaxSettings(
        settings.corporateTax as Parameters<typeof validateCorporateTaxSettings>[0],
      ),
    [settings.corporateTax],
  );
  const hasErrors = !isValid(corporateTaxErrors);
  const draft = useMemo(() => createComptablesSocietesDraft(settings), [settings]);
  const blockingError = hasErrors
    ? 'Corrigez les erreurs comptables et sociétés avant de sauvegarder'
    : null;

  useEffect(() => {
    if (!registerSaveTarget || loading) return;
    registerSaveTarget({
      id: COMPTABLES_SOCIETES_MEMENTO_SAVE_TARGET_ID,
      label: COMPTABLES_SOCIETES_MEMENTO_SAVE_LABEL,
      draft,
      blockingError,
      save: (candidateDraft): Promise<MementoSaveResult> =>
        saveComptablesSocietesDraft(
          isComptablesSocietesDraft(candidateDraft)
            ? candidateDraft
            : (draft as ComptablesSocietesDraft),
          isAdmin,
        ),
    });
  }, [blockingError, draft, isAdmin, loading, registerSaveTarget]);

  return {
    isAdmin,
    loading,
    settings,
    corporateTax: settings.corporateTax,
    incomeTax: settings.incomeTax,
    updateField,
    corporateTaxErrors,
    hasErrors,
  };
}
