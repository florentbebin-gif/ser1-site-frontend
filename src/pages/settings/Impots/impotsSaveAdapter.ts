import { DEFAULT_PS_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { supabase } from '@/supabaseClient';
import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import { isValid, validateImpotsSettings } from '../validators/dmtgValidators';

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

export type ImpotsTaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS>;
export type ImpotsPsSettings = DeepFormValue<typeof DEFAULT_PS_SETTINGS>;
export type ImpotsIncomeTaxSettings = ImpotsTaxSettings['incomeTax'];
export type ImpotsPfuSettings = ImpotsTaxSettings['pfu'];
export type ImpotsCehrSettings = ImpotsTaxSettings['cehr'];
export type ImpotsCdhrSettings = ImpotsTaxSettings['cdhr'];
export type ImpotsIfiSettings = ImpotsTaxSettings['ifi'];
export type ImpotsPatrimonySettings = ImpotsPsSettings['patrimony'];
export type ImpotsIncomeScaleKey = 'scaleCurrent' | 'scalePrevious';
export type ImpotsIncomeScaleRow = ImpotsIncomeTaxSettings['scaleCurrent'][number];
export type ImpotsIncomeScaleFieldKey = keyof ImpotsIncomeScaleRow;

export interface ImpotsDraft {
  taxSettings: ImpotsTaxSettings;
  psSettings: ImpotsPsSettings;
}

interface TaxSettingsRow {
  data: Partial<ImpotsTaxSettings> | null;
}

interface PsSettingsRow {
  data: Partial<ImpotsPsSettings> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isImpotsDraft(value: unknown): value is ImpotsDraft {
  return isRecord(value) && isRecord(value.taxSettings) && isRecord(value.psSettings);
}

export function mergeImpotsTaxSettings(
  base: ImpotsTaxSettings,
  nextData: Partial<ImpotsTaxSettings>,
): ImpotsTaxSettings {
  return {
    ...base,
    ...nextData,
    incomeTax: {
      ...base.incomeTax,
      ...nextData.incomeTax,
    },
    pfu: {
      current: {
        ...base.pfu.current,
        ...nextData.pfu?.current,
      },
      previous: {
        ...base.pfu.previous,
        ...nextData.pfu?.previous,
      },
    },
    cehr: {
      current: {
        ...base.cehr.current,
        ...nextData.cehr?.current,
      },
      previous: {
        ...base.cehr.previous,
        ...nextData.cehr?.previous,
      },
    },
    cdhr: {
      current: {
        ...base.cdhr.current,
        ...nextData.cdhr?.current,
      },
      previous: {
        ...base.cdhr.previous,
        ...nextData.cdhr?.previous,
      },
    },
    ifi: {
      current: {
        ...base.ifi.current,
        ...nextData.ifi?.current,
        scale: nextData.ifi?.current?.scale ?? base.ifi.current.scale,
      },
    },
    corporateTax: nextData.corporateTax ?? base.corporateTax,
    dmtg: nextData.dmtg ?? base.dmtg,
  };
}

export function mergeImpotsPsSettings(
  base: ImpotsPsSettings,
  nextData: Partial<ImpotsPsSettings>,
): ImpotsPsSettings {
  return {
    ...base,
    ...nextData,
    patrimony: {
      current: {
        ...base.patrimony.current,
        ...nextData.patrimony?.current,
      },
      previous: {
        ...base.patrimony.previous,
        ...nextData.patrimony?.previous,
      },
    },
  };
}

export function createImpotsDraft(
  taxSettings: ImpotsTaxSettings,
  psSettings: ImpotsPsSettings,
): ImpotsDraft {
  return { taxSettings, psSettings };
}

export async function loadImpotsDraft(): Promise<ImpotsDraft> {
  let taxSettings = DEFAULT_TAX_SETTINGS as ImpotsTaxSettings;
  let psSettings = DEFAULT_PS_SETTINGS as ImpotsPsSettings;

  try {
    const [taxRes, psRes] = await Promise.all([
      supabase.from('tax_settings').select('data').eq('id', 1),
      supabase.from('ps_settings').select('data').eq('id', 1),
    ]);

    const typedTaxRes = taxRes as {
      data: TaxSettingsRow[] | null;
      error: { code?: string } | null;
    };
    const typedPsRes = psRes as {
      data: PsSettingsRow[] | null;
      error: { code?: string } | null;
    };

    const taxData = typedTaxRes.data?.[0]?.data;
    if (!typedTaxRes.error && taxData) {
      taxSettings = mergeImpotsTaxSettings(taxSettings, taxData);
    } else if (typedTaxRes.error && typedTaxRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement tax_settings :', typedTaxRes.error);
    }

    const psData = typedPsRes.data?.[0]?.data;
    if (!typedPsRes.error && psData) {
      psSettings = mergeImpotsPsSettings(psSettings, psData);
    } else if (typedPsRes.error && typedPsRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement ps_settings :', typedPsRes.error);
    }
  } catch (error) {
    console.error(error);
  }

  return createImpotsDraft(taxSettings, psSettings);
}

export async function saveImpotsDraft(
  draft: ImpotsDraft,
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  const impotsErrors = validateImpotsSettings(
    draft.taxSettings as Parameters<typeof validateImpotsSettings>[0],
  );
  if (!isValid(impotsErrors)) {
    return {
      ok: false,
      message: 'Corrigez les erreurs impôts avant de sauvegarder.',
    };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const updatedBy = userData.user?.id ?? null;
    if (userError || !updatedBy) {
      console.error('Utilisateur authentifié introuvable pour audit Impôts :', userError);
      return {
        ok: false,
        message: "Erreur lors de l'identification de l'utilisateur admin.",
      };
    }

    const { data: existingRow, error: existingError } = await supabase
      .from('tax_settings')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error(existingError);
      return {
        ok: false,
        message: 'Erreur lors du chargement des paramètres existants.',
      };
    }

    const existingData = (existingRow?.data as Partial<ImpotsTaxSettings> | null) ?? {};
    const payload: Partial<ImpotsTaxSettings> = {
      ...existingData,
      incomeTax: draft.taxSettings.incomeTax,
      pfu: {
        current: { rateIR: draft.taxSettings.pfu.current.rateIR },
        previous: { rateIR: draft.taxSettings.pfu.previous.rateIR },
      },
      cehr: draft.taxSettings.cehr,
      cdhr: draft.taxSettings.cdhr,
      ifi: draft.taxSettings.ifi,
    };

    const { error } = await supabase
      .from('tax_settings')
      .upsert({ id: 1, data: payload, updated_by: updatedBy });

    if (error) {
      console.error(error);
      return { ok: false, message: "Erreur lors de l'enregistrement." };
    }

    invalidate('tax');
    broadcastInvalidation('tax');
    return { ok: true, message: 'Paramètres impôts enregistrés.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement." };
  }
}
