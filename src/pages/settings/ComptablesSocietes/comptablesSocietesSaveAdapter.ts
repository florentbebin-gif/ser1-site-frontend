import { DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { supabase } from '@/supabaseClient';
import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import { isValid, validateCorporateTaxSettings } from '../validators/dmtgValidators';

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

export type ComptablesSocietesTaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS>;
export type ComptablesSocietesCorporateTax = ComptablesSocietesTaxSettings['corporateTax'];
export type ComptablesSocietesIncomeTax = ComptablesSocietesTaxSettings['incomeTax'];

export interface ComptablesSocietesDraft {
  settings: ComptablesSocietesTaxSettings;
}

interface TaxSettingsRow {
  data: Partial<ComptablesSocietesTaxSettings> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isComptablesSocietesDraft(value: unknown): value is ComptablesSocietesDraft {
  return isRecord(value) && isRecord(value.settings);
}

export function mergeComptablesSocietesTaxSettings(
  base: ComptablesSocietesTaxSettings,
  nextData: Partial<ComptablesSocietesTaxSettings>,
): ComptablesSocietesTaxSettings {
  return {
    ...base,
    ...nextData,
    incomeTax: {
      ...base.incomeTax,
      ...nextData.incomeTax,
    },
    corporateTax: {
      current: {
        ...base.corporateTax.current,
        ...nextData.corporateTax?.current,
        motherDaughterQpfc: {
          ...base.corporateTax.current.motherDaughterQpfc,
          ...nextData.corporateTax?.current?.motherDaughterQpfc,
        },
      },
      previous: {
        ...base.corporateTax.previous,
        ...nextData.corporateTax?.previous,
        motherDaughterQpfc: {
          ...base.corporateTax.previous.motherDaughterQpfc,
          ...nextData.corporateTax?.previous?.motherDaughterQpfc,
        },
      },
    },
  };
}

export function createComptablesSocietesDraft(
  settings: ComptablesSocietesTaxSettings,
): ComptablesSocietesDraft {
  return { settings };
}

export async function loadComptablesSocietesDraft(): Promise<ComptablesSocietesDraft> {
  let settings = DEFAULT_TAX_SETTINGS as ComptablesSocietesTaxSettings;

  try {
    const taxRes = await supabase.from('tax_settings').select('data').eq('id', 1);
    const typedTaxRes = taxRes as {
      data: TaxSettingsRow[] | null;
      error: { code?: string } | null;
    };
    const taxData = typedTaxRes.data?.[0]?.data;

    if (!typedTaxRes.error && taxData) {
      settings = mergeComptablesSocietesTaxSettings(settings, taxData);
    } else if (typedTaxRes.error && typedTaxRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement tax_settings :', typedTaxRes.error);
    }
  } catch (error) {
    console.error(error);
  }

  return createComptablesSocietesDraft(settings);
}

export async function saveComptablesSocietesDraft(
  draft: ComptablesSocietesDraft,
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  const corporateTaxErrors = validateCorporateTaxSettings(
    draft.settings.corporateTax as Parameters<typeof validateCorporateTaxSettings>[0],
  );
  if (!isValid(corporateTaxErrors)) {
    return {
      ok: false,
      message: 'Corrigez les erreurs comptables et sociétés avant de sauvegarder.',
    };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const updatedBy = userData.user?.id ?? null;
    if (userError || !updatedBy) {
      console.error(
        'Utilisateur authentifié introuvable pour audit Comptables & sociétés :',
        userError,
      );
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

    const existingData = (existingRow?.data as Partial<ComptablesSocietesTaxSettings> | null) ?? {};
    const payload: Partial<ComptablesSocietesTaxSettings> = {
      ...existingData,
      corporateTax: draft.settings.corporateTax,
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
    return { ok: true, message: 'Paramètres comptables et sociétés enregistrés.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement." };
  }
}
