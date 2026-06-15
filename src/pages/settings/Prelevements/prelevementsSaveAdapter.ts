import {
  DEFAULT_PASS_HISTORY,
  DEFAULT_PS_SETTINGS,
  DEFAULT_TAX_SETTINGS,
} from '@/constants/settingsDefaults';
import { supabase } from '@/supabaseClient';
import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
import { broadcastInvalidation, invalidate } from '@/utils/cache/fiscalSettingsCache';
import { isValid, validatePrelevementsSettings } from '../validators/dmtgValidators';

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

export type PrelevementsPsSettings = DeepFormValue<typeof DEFAULT_PS_SETTINGS>;
export type PrelevementsTaxSettings = DeepFormValue<typeof DEFAULT_TAX_SETTINGS>;
export type PrelevementsPatrimonySettings = PrelevementsPsSettings['patrimony'];
export type PrelevementsRetirementSettings = PrelevementsPsSettings['retirement'];
export type PrelevementsRetirementThresholds = PrelevementsPsSettings['retirementThresholds'];
export type PrelevementsSocialDirigeantSettings = PrelevementsPsSettings['socialDirigeant'];
export type PrelevementsRetirementYearKey = keyof PrelevementsRetirementSettings;
export type PrelevementsRetirementBracket =
  PrelevementsRetirementSettings['current']['brackets'][number];
export type PrelevementsRetirementBracketKey = keyof PrelevementsRetirementBracket;

export interface PrelevementsPassHistoryRow {
  year: number;
  pass_amount: number | null;
}

export interface PrelevementsDraft {
  settings: PrelevementsPsSettings;
  taxSettings: PrelevementsTaxSettings;
  passRows: PrelevementsPassHistoryRow[];
}

interface PsSettingsRow {
  data: Partial<PrelevementsPsSettings> | null;
}

interface TaxSettingsRow {
  data: Partial<PrelevementsTaxSettings> | null;
}

type ThresholdRegionKey = keyof PrelevementsRetirementThresholds['current'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPrelevementsDraft(value: unknown): value is PrelevementsDraft {
  return (
    isRecord(value) &&
    isRecord(value.settings) &&
    isRecord(value.taxSettings) &&
    Array.isArray(value.passRows)
  );
}

function mergeThresholdPeriod(
  base: PrelevementsRetirementThresholds['current'],
  next: Partial<PrelevementsRetirementThresholds['current']> | undefined,
): PrelevementsRetirementThresholds['current'] {
  const result = { ...base };
  for (const regionKey of Object.keys(base) as ThresholdRegionKey[]) {
    result[regionKey] = {
      ...base[regionKey],
      ...next?.[regionKey],
    };
  }
  return result;
}

export function mergePrelevementsPsSettings(
  base: PrelevementsPsSettings,
  nextData: Partial<PrelevementsPsSettings>,
): PrelevementsPsSettings {
  return {
    ...base,
    ...nextData,
    labels: {
      ...base.labels,
      ...nextData.labels,
    },
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
    retirement: {
      current: {
        ...base.retirement.current,
        ...nextData.retirement?.current,
        brackets: nextData.retirement?.current?.brackets ?? base.retirement.current.brackets,
      },
      previous: {
        ...base.retirement.previous,
        ...nextData.retirement?.previous,
        brackets: nextData.retirement?.previous?.brackets ?? base.retirement.previous.brackets,
      },
    },
    retirementThresholds: {
      current: mergeThresholdPeriod(
        base.retirementThresholds.current,
        nextData.retirementThresholds?.current,
      ),
      previous: mergeThresholdPeriod(
        base.retirementThresholds.previous,
        nextData.retirementThresholds?.previous,
      ),
    },
    socialDirigeant: {
      current: {
        ...base.socialDirigeant.current,
        ...nextData.socialDirigeant?.current,
        remuneration: {
          tns: {
            ...base.socialDirigeant.current.remuneration.tns,
            ...nextData.socialDirigeant?.current?.remuneration?.tns,
          },
          assimileSalarie: {
            ...base.socialDirigeant.current.remuneration.assimileSalarie,
            ...nextData.socialDirigeant?.current?.remuneration?.assimileSalarie,
          },
        },
        dividends: {
          ...base.socialDirigeant.current.dividends,
          ...nextData.socialDirigeant?.current?.dividends,
        },
        passTranches: {
          ...base.socialDirigeant.current.passTranches,
          ...nextData.socialDirigeant?.current?.passTranches,
        },
        madelin: {
          ...base.socialDirigeant.current.madelin,
          ...nextData.socialDirigeant?.current?.madelin,
        },
      },
    },
  };
}

export function mergePrelevementsTaxSettings(
  base: PrelevementsTaxSettings,
  nextData: Partial<PrelevementsTaxSettings>,
): PrelevementsTaxSettings {
  return {
    ...base,
    ...nextData,
    incomeTax: {
      ...base.incomeTax,
      ...nextData.incomeTax,
    },
  };
}

export function derivePsYearLabel(irLabel: string | undefined, fallbackLabel: string): string {
  if (!irLabel) return fallbackLabel;
  const match = irLabel.match(/(\d{4}).*revenus\s+(\d{4})/i);
  if (!match) return fallbackLabel;

  const taxYear = Number(match[1]);
  const incomeYear = Number(match[2]);
  if (Number.isNaN(taxYear) || Number.isNaN(incomeYear)) return fallbackLabel;

  return `${taxYear} (RFR ${incomeYear - 1} & Avis IR ${incomeYear})`;
}

export function createPrelevementsDraft(
  settings: PrelevementsPsSettings,
  taxSettings: PrelevementsTaxSettings,
  passRows: PrelevementsPassHistoryRow[],
): PrelevementsDraft {
  return { settings, taxSettings, passRows };
}

function defaultPassRows(): PrelevementsPassHistoryRow[] {
  return Object.entries(DEFAULT_PASS_HISTORY)
    .map(([year, amount]) => ({ year: Number(year), pass_amount: amount }))
    .sort((a, b) => a.year - b.year);
}

export async function loadPassHistoryRows(isAdmin: boolean): Promise<PrelevementsPassHistoryRow[]> {
  try {
    if (isAdmin) {
      await supabase.rpc('ensure_pass_history_current');
    }

    const { data, error } = await supabase
      .from('pass_history')
      .select('year, pass_amount')
      .order('year', { ascending: true });

    if (error) {
      console.error('Erreur chargement pass_history :', error);
      return defaultPassRows();
    }

    return (data ?? []).map((row) => ({
      year: Number(row.year),
      pass_amount:
        typeof row.pass_amount === 'number'
          ? row.pass_amount
          : row.pass_amount == null
            ? null
            : Number(row.pass_amount),
    }));
  } catch (error) {
    console.error('Erreur init pass_history :', error);
    return defaultPassRows();
  }
}

export async function loadPrelevementsDraft(isAdmin: boolean): Promise<PrelevementsDraft> {
  let settings = DEFAULT_PS_SETTINGS as PrelevementsPsSettings;
  let taxSettings = DEFAULT_TAX_SETTINGS as PrelevementsTaxSettings;

  try {
    const [psRes, taxRes, passRows] = await Promise.all([
      supabase.from('ps_settings').select('data').eq('id', 1),
      supabase.from('tax_settings').select('data').eq('id', 1),
      loadPassHistoryRows(isAdmin),
    ]);

    const typedPsRes = psRes as {
      data: PsSettingsRow[] | null;
      error: { code?: string } | null;
    };
    const typedTaxRes = taxRes as {
      data: TaxSettingsRow[] | null;
      error: { code?: string } | null;
    };

    const psData = typedPsRes.data?.[0]?.data;
    if (!typedPsRes.error && psData) {
      settings = mergePrelevementsPsSettings(settings, psData);
    } else if (typedPsRes.error && typedPsRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement ps_settings :', typedPsRes.error);
    }

    const taxData = typedTaxRes.data?.[0]?.data;
    if (!typedTaxRes.error && taxData) {
      taxSettings = mergePrelevementsTaxSettings(taxSettings, taxData);
    } else if (typedTaxRes.error && typedTaxRes.error.code !== 'PGRST116') {
      console.error('Erreur chargement tax_settings :', typedTaxRes.error);
    }

    return createPrelevementsDraft(settings, taxSettings, passRows);
  } catch (error) {
    console.error(error);
    return createPrelevementsDraft(settings, taxSettings, defaultPassRows());
  }
}

async function savePassHistoryRows(
  rows: PrelevementsPassHistoryRow[],
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  try {
    const payload = rows.map((row) => ({
      year: row.year,
      pass_amount: row.pass_amount,
    }));

    const { error } = await supabase.from('pass_history').upsert(payload, { onConflict: 'year' });
    if (error) {
      console.error(error);
      return { ok: false, message: "Erreur lors de l'enregistrement du PASS." };
    }

    await invalidate('pass');
    broadcastInvalidation('pass');
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement du PASS." };
  }
}

export async function savePrelevementsDraft(
  draft: PrelevementsDraft,
  isAdmin: boolean,
): Promise<MementoSaveResult> {
  if (!isAdmin) return { ok: true };

  const psErrors = validatePrelevementsSettings(
    draft.settings as Parameters<typeof validatePrelevementsSettings>[0],
  );
  if (!isValid(psErrors)) {
    return {
      ok: false,
      message: 'Corrigez les erreurs de prélèvements sociaux avant de sauvegarder.',
    };
  }

  try {
    const { error } = await supabase.from('ps_settings').upsert({
      id: 1,
      data: draft.settings,
    });

    if (error) {
      console.error(error);
      return { ok: false, message: "Erreur lors de l'enregistrement des paramètres." };
    }

    invalidate('ps');
    broadcastInvalidation('ps');

    const passResult = await savePassHistoryRows(draft.passRows, isAdmin);
    if (!passResult.ok) return passResult;

    return { ok: true, message: 'Paramètres de prélèvements sociaux enregistrés.' };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Erreur lors de l'enregistrement des paramètres." };
  }
}
