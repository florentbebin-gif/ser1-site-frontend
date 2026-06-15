import { useEffect, useMemo, useRef, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import type { FiscalitySettingsV2 } from '@/utils/cache/fiscalitySettings';
import { getFiscalityRules } from '@/utils/cache/fiscalitySettingsAccess';
import {
  useOptionalMementoSaveRegistry,
  type MementoSaveResult,
} from '@/hooks/settings/mementoSaveRegistry';
import { validateAvDeces, validateDmtg, isValid } from '../validators/dmtgValidators';
import { checkDmtgGoldenScenario } from './dmtgGoldenCheck';
import { DEFAULT_DONATION } from './dmtgReferenceData';
import {
  createDmtgSuccessionDraft,
  isDmtgSuccessionDraft,
  loadDmtgSuccessionDraft,
  saveDmtgSuccessionDraft,
  type AvDecesUpdateValue,
  type DmtgCategoryKey,
  type DmtgScaleRow,
  type DmtgScaleUpdate,
  type DonationUpdateValue,
  type FiscalitySettings,
  type NestedRecord,
  type TaxSettings,
} from './dmtgSuccessionSaveAdapter';

export const DMTG_MEMENTO_SAVE_TARGET_ID = 'dmtg-succession';
const DMTG_MEMENTO_SAVE_LABEL = 'DMTG & succession';

export function useDmtgSuccessionSettings() {
  const { isAdmin } = useUserRole();
  const saveRegistry = useOptionalMementoSaveRegistry();
  const registerSaveTarget = saveRegistry?.registerTarget;
  const markSaveTargetDirty = saveRegistry?.markDirty;
  const initialRegistryDraftRef = useRef(saveRegistry?.targets[DMTG_MEMENTO_SAVE_TARGET_ID]?.draft);
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(
    isDmtgSuccessionDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.taxSettings
      : (DEFAULT_TAX_SETTINGS as TaxSettings),
  );
  const [fiscalitySettings, setFiscalitySettings] = useState<FiscalitySettings>(
    isDmtgSuccessionDraft(initialRegistryDraftRef.current)
      ? initialRegistryDraftRef.current.fiscalitySettings
      : (DEFAULT_FISCALITY_SETTINGS as FiscalitySettings),
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (isDmtgSuccessionDraft(initialRegistryDraftRef.current)) {
        if (mounted) setLoading(false);
        return;
      }

      const draft = await loadDmtgSuccessionDraft();
      if (!mounted) return;
      setTaxSettings(draft.taxSettings);
      setFiscalitySettings(draft.fiscalitySettings);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const markDmtgDirty = (): void => {
    markSaveTargetDirty?.(DMTG_MEMENTO_SAVE_TARGET_ID);
  };

  const updateDmtgCategory = (
    categoryKey: DmtgCategoryKey,
    field: 'abattement' | 'scale',
    value: number | null | DmtgScaleUpdate,
  ) => {
    setTaxSettings((prev) => {
      const category = prev.dmtg?.[categoryKey];
      if (!category) return prev;

      if (field === 'scale' && typeof value === 'object' && value !== null && 'idx' in value) {
        const { idx, key, value: cellValue } = value;
        return {
          ...prev,
          dmtg: {
            ...prev.dmtg,
            [categoryKey]: {
              ...category,
              scale: category.scale.map((row, i) =>
                i === idx ? { ...row, [key]: cellValue as DmtgScaleRow[keyof DmtgScaleRow] } : row,
              ),
            },
          },
        };
      }

      return {
        ...prev,
        dmtg: {
          ...prev.dmtg,
          [categoryKey]: {
            ...category,
            [field]: value,
          },
        },
      };
    });
    markDmtgDirty();
  };

  const updateDonation = (path: string[], value: DonationUpdateValue) => {
    setTaxSettings((prev) => {
      const donation = { ...DEFAULT_DONATION, ...prev.donation };
      const clone = structuredClone({ ...prev, donation });
      let obj = clone.donation as NestedRecord;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (!key) continue;
        if (obj[key] === undefined || obj[key] === null) obj[key] = {};
        obj = obj[key] as NestedRecord;
      }
      const lastKey = path[path.length - 1];
      if (lastKey) obj[lastKey] = value;
      return clone;
    });
    markDmtgDirty();
  };

  const updateAvDeces = (path: string[], value: AvDecesUpdateValue) => {
    setFiscalitySettings((prev) => {
      const clone = structuredClone(prev);
      const assuranceVieRuleset = clone.rulesetsByKey.assuranceVie;
      assuranceVieRuleset.rules = {
        ...DEFAULT_ASSURANCE_VIE_RULES,
        ...assuranceVieRuleset.rules,
      };
      let obj = assuranceVieRuleset.rules.deces as NestedRecord;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (!key) continue;
        if (obj[key] === undefined || obj[key] === null) obj[key] = {};
        obj = obj[key] as NestedRecord;
      }
      const lastKey = path[path.length - 1];
      if (lastKey) obj[lastKey] = value;
      return clone;
    });
    markDmtgDirty();
  };

  const dmtgErrors = useMemo(() => validateDmtg(taxSettings.dmtg), [taxSettings.dmtg]);
  const avDecesErrors = useMemo(
    () =>
      validateAvDeces(
        getFiscalityRules(fiscalitySettings as FiscalitySettingsV2, 'assuranceVie').deces,
      ),
    [fiscalitySettings],
  );
  const hasErrors = !isValid(dmtgErrors, avDecesErrors);
  const dmtgGoldenCheck = useMemo(
    () => checkDmtgGoldenScenario(taxSettings.dmtg),
    [taxSettings.dmtg],
  );
  const draft = useMemo(
    () => createDmtgSuccessionDraft(taxSettings, fiscalitySettings),
    [fiscalitySettings, taxSettings],
  );
  const blockingError = hasErrors
    ? 'Corrigez les erreurs avant de sauvegarder'
    : !dmtgGoldenCheck.ok
      ? dmtgGoldenCheck.message
      : null;

  useEffect(() => {
    if (!registerSaveTarget || loading) return;
    registerSaveTarget({
      id: DMTG_MEMENTO_SAVE_TARGET_ID,
      label: DMTG_MEMENTO_SAVE_LABEL,
      draft,
      blockingError,
      save: (candidateDraft): Promise<MementoSaveResult> =>
        saveDmtgSuccessionDraft(
          isDmtgSuccessionDraft(candidateDraft) ? candidateDraft : draft,
          isAdmin,
        ),
    });
  }, [blockingError, draft, isAdmin, loading, registerSaveTarget]);

  const donation = { ...DEFAULT_DONATION, ...taxSettings.donation };
  const avDeces =
    getFiscalityRules(fiscalitySettings as FiscalitySettingsV2, 'assuranceVie').deces ||
    DEFAULT_ASSURANCE_VIE_RULES.deces;

  return {
    isAdmin,
    loading,
    taxSettings,
    fiscalitySettings,
    dmtg: taxSettings.dmtg,
    donation,
    avDeces,
    updateDmtgCategory,
    updateDonation,
    updateAvDeces,
    dmtgErrors,
    avDecesErrors,
    hasErrors,
    dmtgGoldenCheck,
  };
}
