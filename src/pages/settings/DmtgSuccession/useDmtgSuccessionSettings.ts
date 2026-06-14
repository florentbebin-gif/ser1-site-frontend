import { useEffect, useMemo, useState } from 'react';
import { useUserRole } from '@/auth/useUserRole';
import {
  DEFAULT_ASSURANCE_VIE_RULES,
  DEFAULT_FISCALITY_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { supabase } from '@/supabaseClient';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import type { FiscalitySettingsV2 } from '@/utils/cache/fiscalitySettings';
import { getFiscalityRules, toFiscalitySettingsV2 } from '@/utils/cache/fiscalitySettingsAccess';
import { validateAvDeces, validateDmtg, isValid } from '../validators/dmtgValidators';
import { checkDmtgGoldenScenario } from './dmtgGoldenCheck';
import { DEFAULT_DONATION } from './dmtgReferenceData';
import {
  formatDmtgSchemaError,
  normalizeDmtgTaxSettingsForLoad,
  validateDmtgFiscalityPayload,
  validateDmtgTaxPayload,
} from './dmtgSettingsSchema';

type DeepFormValue<T> = T extends number
  ? number | null
  : T extends string
    ? string
    : T extends boolean
      ? boolean
      : T extends Array<infer U>
        ? DeepFormValue<U>[]
        : T extends object
          ? { [K in keyof T]: DeepFormValue<T[K]> }
          : T;

export type DonationSettings = DeepFormValue<typeof DEFAULT_DONATION>;
export type TaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS> & {
  donation?: DonationSettings;
};
export type FiscalitySettings = DeepFormValue<typeof DEFAULT_FISCALITY_SETTINGS>;
export type DmtgCategoryKey = keyof TaxSettings['dmtg'];
export type DmtgScaleRow = TaxSettings['dmtg']['ligneDirecte']['scale'][number];
export type DmtgScaleUpdate = {
  idx: number;
  key: string;
  value: string | number | null;
};
export type DonationUpdateValue = string | number | null;
export type AvDecesBracket = {
  upTo: number | null;
  ratePercent: number | null;
};
export type AvDecesUpdateValue = number | null | AvDecesBracket[];

type NestedRecord = Record<string, unknown>;

interface SettingsRow<T> {
  data: Partial<T> | null;
}

export function useDmtgSuccessionSettings() {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(DEFAULT_TAX_SETTINGS);
  const [fiscalitySettings, setFiscalitySettings] = useState<FiscalitySettings>(
    DEFAULT_FISCALITY_SETTINGS,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [taxResRaw, fiscResRaw] = await Promise.all([
          supabase.from('tax_settings').select('data').eq('id', 1),
          supabase.from('fiscality_settings').select('data').eq('id', 1),
        ]);
        const taxRes = taxResRaw as {
          data: SettingsRow<TaxSettings>[] | null;
          error: { code?: string } | null;
        };
        const fiscRes = fiscResRaw as {
          data: SettingsRow<FiscalitySettings>[] | null;
          error: { code?: string } | null;
        };

        const taxRow = taxRes.data?.[0];
        if (!taxRes.error && taxRow?.data) {
          const normalizedData = normalizeDmtgTaxSettingsForLoad(taxRow.data);
          if (mounted && normalizedData) {
            const normalizedTaxSettings = normalizedData as Partial<TaxSettings>;
            setTaxSettings((prev) => ({ ...prev, ...normalizedTaxSettings }));
          }
        } else if (taxRes.error && taxRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement tax_settings :', taxRes.error);
        }

        const fiscalityRow = fiscRes.data?.[0];
        if (!fiscRes.error && fiscalityRow?.data) {
          const fiscalityData = toFiscalitySettingsV2(fiscalityRow.data);
          if (mounted) {
            setFiscalitySettings(fiscalityData as FiscalitySettings);
          }
        } else if (fiscRes.error && fiscRes.error.code !== 'PGRST116') {
          console.error('Erreur chargement fiscality_settings :', fiscRes.error);
        }

        if (mounted) setLoading(false);
      } catch (e) {
        console.error(e);
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
    setMessage('');
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
    setMessage('');
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
    setMessage('');
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
  const saveDisabled = saving || hasErrors || !dmtgGoldenCheck.ok;
  const saveTitle = hasErrors
    ? 'Corrigez les erreurs avant de sauvegarder'
    : !dmtgGoldenCheck.ok
      ? dmtgGoldenCheck.message
      : '';

  const save = async () => {
    if (!isAdmin || hasErrors || !dmtgGoldenCheck.ok) return;

    try {
      setSaving(true);
      setMessage('');

      const { data: userData, error: userError } = await supabase.auth.getUser();
      const updatedBy = userData.user?.id ?? null;
      if (userError || !updatedBy) {
        console.error('Utilisateur authentifié introuvable pour audit DMTG :', userError);
        setMessage("Erreur lors de l'identification de l'utilisateur admin.");
        return;
      }

      const [existingTaxRes, existingFiscRes] = await Promise.all([
        supabase.from('tax_settings').select('data').eq('id', 1).maybeSingle(),
        supabase.from('fiscality_settings').select('data').eq('id', 1).maybeSingle(),
      ]);

      if (
        (existingTaxRes.error && existingTaxRes.error.code !== 'PGRST116') ||
        (existingFiscRes.error && existingFiscRes.error.code !== 'PGRST116')
      ) {
        console.error(existingTaxRes.error, existingFiscRes.error);
        setMessage('Erreur lors du chargement des paramètres existants.');
        return;
      }

      const existingTaxData = (existingTaxRes.data?.data as Partial<TaxSettings> | null) ?? {};
      const existingFiscData = toFiscalitySettingsV2(
        (existingFiscRes.data?.data as unknown | null) ?? DEFAULT_FISCALITY_SETTINGS,
      );

      const { donManuel: _donManuel, ...donationClean } = (taxSettings.donation ??
        DEFAULT_DONATION) as Record<string, unknown>;
      void _donManuel;
      const taxPayload: Partial<TaxSettings> = {
        ...existingTaxData,
        dmtg: taxSettings.dmtg,
        donation: donationClean as TaxSettings['donation'],
      };
      const currentAssuranceVieRules = getFiscalityRules(
        fiscalitySettings as FiscalitySettingsV2,
        'assuranceVie',
      );
      const existingAssuranceVieRuleset =
        existingFiscData.rulesetsByKey.assuranceVie ??
        DEFAULT_FISCALITY_SETTINGS.rulesetsByKey.assuranceVie;
      const fiscalityPayload: FiscalitySettingsV2 = {
        ...existingFiscData,
        schemaVersion: 2,
        rulesetsByKey: {
          ...existingFiscData.rulesetsByKey,
          assuranceVie: {
            ...existingAssuranceVieRuleset,
            rules: {
              ...getFiscalityRules(existingFiscData, 'assuranceVie'),
              ...currentAssuranceVieRules,
              deces: currentAssuranceVieRules.deces,
            },
          },
        },
      };
      const taxValidation = validateDmtgTaxPayload(taxPayload);
      const fiscalityValidation = validateDmtgFiscalityPayload(fiscalityPayload);
      if (!taxValidation.success || !fiscalityValidation.success) {
        setMessage(formatDmtgSchemaError(taxValidation, fiscalityValidation));
        return;
      }

      const [taxRes, fiscRes] = await Promise.all([
        supabase
          .from('tax_settings')
          .upsert({ id: 1, data: taxValidation.data, updated_by: updatedBy }),
        supabase
          .from('fiscality_settings')
          .upsert({ id: 1, data: fiscalityValidation.data, updated_by: updatedBy }),
      ]);

      if (taxRes.error || fiscRes.error) {
        console.error(taxRes.error, fiscRes.error);
        setMessage("Erreur lors de l'enregistrement.");
      } else {
        setMessage('Paramètres DMTG & succession enregistrés.');
        invalidate('tax');
        broadcastInvalidation('tax');
        invalidate('fiscality');
        broadcastInvalidation('fiscality');
      }
    } catch (e) {
      console.error(e);
      setMessage("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

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
    saving,
    message,
    save,
    saveDisabled,
    saveTitle,
  };
}
