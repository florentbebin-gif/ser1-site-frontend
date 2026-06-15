import { DEFAULT_FISCALITY_SETTINGS, DEFAULT_TAX_SETTINGS } from '@/constants/settingsDefaults';
import { supabase } from '@/supabaseClient';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import type { FiscalitySettingsV2 } from '@/utils/cache/fiscalitySettings';
import { getFiscalityRules, toFiscalitySettingsV2 } from '@/utils/cache/fiscalitySettingsAccess';
import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
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

export interface DmtgSuccessionDraft {
  taxSettings: TaxSettings;
  fiscalitySettings: FiscalitySettings;
}

type NestedRecord = Record<string, unknown>;

interface SettingsRow<T> {
  data: Partial<T> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isDmtgSuccessionDraft(value: unknown): value is DmtgSuccessionDraft {
  return isRecord(value) && isRecord(value.taxSettings) && isRecord(value.fiscalitySettings);
}

export function createDmtgSuccessionDraft(
  taxSettings: TaxSettings,
  fiscalitySettings: FiscalitySettings,
): DmtgSuccessionDraft {
  return { taxSettings, fiscalitySettings };
}

export async function loadDmtgSuccessionDraft(): Promise<DmtgSuccessionDraft> {
  let taxSettings = DEFAULT_TAX_SETTINGS as TaxSettings;
  let fiscalitySettings = DEFAULT_FISCALITY_SETTINGS as FiscalitySettings;

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
      if (normalizedData) {
        taxSettings = {
          ...taxSettings,
          ...(normalizedData as Partial<TaxSettings>),
        };
      }
    } else if (taxRes.error && taxRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement tax_settings :', taxRes.error);
    }

    const fiscalityRow = fiscRes.data?.[0];
    if (!fiscRes.error && fiscalityRow?.data) {
      fiscalitySettings = toFiscalitySettingsV2(fiscalityRow.data) as FiscalitySettings;
    } else if (fiscRes.error && fiscRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement fiscality_settings :', fiscRes.error);
    }
  } catch (error) {
    console.error(error);
  }

  return { taxSettings, fiscalitySettings };
}

export async function saveDmtgSuccessionDraft(
  draft: DmtgSuccessionDraft,
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const updatedBy = userData.user?.id ?? null;
    if (userError || !updatedBy) {
      console.error('Utilisateur authentifié introuvable pour audit DMTG :', userError);
      return {
        ok: false,
        message: "Erreur lors de l'identification de l'utilisateur admin.",
      };
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
      return {
        ok: false,
        message: 'Erreur lors du chargement des paramètres existants.',
      };
    }

    const existingTaxData = (existingTaxRes.data?.data as Partial<TaxSettings> | null) ?? {};
    const existingFiscData = toFiscalitySettingsV2(
      (existingFiscRes.data?.data as unknown | null) ?? DEFAULT_FISCALITY_SETTINGS,
    );

    const { donManuel: _donManuel, ...donationClean } = (draft.taxSettings.donation ??
      DEFAULT_DONATION) as Record<string, unknown>;
    void _donManuel;
    const taxPayload: Partial<TaxSettings> = {
      ...existingTaxData,
      dmtg: draft.taxSettings.dmtg,
      donation: donationClean as TaxSettings['donation'],
    };
    const currentAssuranceVieRules = getFiscalityRules(
      draft.fiscalitySettings as FiscalitySettingsV2,
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
      return {
        ok: false,
        message: formatDmtgSchemaError(taxValidation, fiscalityValidation),
      };
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
      return { ok: false, message: "Erreur lors de l'enregistrement." };
    }

    invalidate('tax');
    broadcastInvalidation('tax');
    invalidate('fiscality');
    broadcastInvalidation('fiscality');
    return { ok: true, message: 'Paramètres DMTG & succession enregistrés.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement." };
  }
}

export type { NestedRecord };
