import {
  selectCurrentMementoMillesime,
  type MementoReferenceValue,
  type MementoReferenceValueDomain,
} from '@/domain/settings-memento/referenceValues';
import type { MementoSaveResult } from '@/hooks/settings/mementoSaveRegistry';
import {
  broadcastMementoReferenceValuesInvalidation,
  getMementoReferenceValues,
  upsertMementoReferenceValues,
} from '@/utils/cache/mementoReferenceValuesCache';

interface MementoReferenceValuesDraftOptions {
  domain?: MementoReferenceValueDomain;
}

interface SaveMementoReferenceValuesDraftOptions extends MementoReferenceValuesDraftOptions {
  isAdmin: boolean;
}

export function isMementoReferenceValuesDraft(value: unknown): value is MementoReferenceValue[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row): row is MementoReferenceValue =>
        typeof row === 'object' && row !== null && 'key' in row && typeof row.key === 'string',
    )
  );
}

export function normalizeMementoReferenceValuesDraft(
  value: unknown,
  fallback: MementoReferenceValue[] = [],
): MementoReferenceValue[] {
  return isMementoReferenceValuesDraft(value) ? value : fallback;
}

export async function loadMementoReferenceValuesDraft(
  options: MementoReferenceValuesDraftOptions & { force?: boolean } = {},
): Promise<MementoReferenceValue[]> {
  const values = await getMementoReferenceValues({ force: options.force });
  const current = selectCurrentMementoMillesime(values);
  return options.domain ? current.filter((value) => value.domain === options.domain) : current;
}

export async function saveMementoReferenceValuesDraft(
  rows: readonly MementoReferenceValue[],
  options: SaveMementoReferenceValuesDraftOptions,
): Promise<MementoSaveResult> {
  if (!options.isAdmin) return { ok: true };

  const missingValue = rows.find((row) => row.value_numeric === null && row.value_text === null);
  if (missingValue) {
    return {
      ok: false,
      message: `La valeur "${missingValue.label}" est obligatoire.`,
    };
  }

  try {
    await upsertMementoReferenceValues(rows);
    broadcastMementoReferenceValuesInvalidation();
    return { ok: true, message: 'Valeurs de référence enregistrées.' };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement des valeurs du mémento.",
    };
  }
}
