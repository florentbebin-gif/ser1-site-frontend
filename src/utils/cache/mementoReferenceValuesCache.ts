import { supabase } from '@/supabaseClient';
import {
  DEFAULT_MEMENTO_REFERENCE_VALUES,
  sortMementoReferenceValues,
  type MementoReferenceValue,
  type MementoReferenceValueDraft,
  type MementoReferenceValueUnit,
} from '@/domain/settings-memento/referenceValues';

const TABLE = 'memento_reference_values';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const INVALIDATION_EVENT = 'ser1:memento-reference-values-updated';
const SELECT_COLUMNS =
  'key, domain, subdomain, label, value_numeric, value_text, unit, year, data, ref_ids, display_order, note, updated_at';

let cache: MementoReferenceValue[] | null = null;
let fetchedAt: number | null = null;

function isFresh(): boolean {
  return cache !== null && fetchedAt !== null && Date.now() - fetchedAt < CACHE_TTL_MS;
}

function cloneValue(value: MementoReferenceValue): MementoReferenceValue {
  return {
    ...value,
    data: { ...value.data },
    ref_ids: [...value.ref_ids],
  };
}

function fallbackValues(): MementoReferenceValue[] {
  return sortMementoReferenceValues(DEFAULT_MEMENTO_REFERENCE_VALUES.map(cloneValue));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeUnit(value: unknown): MementoReferenceValueUnit {
  if (value === 'EUR' || value === '%') return value;
  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function normalizeData(value: unknown): MementoReferenceValue['data'] {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, candidate]) =>
        ['string', 'number', 'boolean'].includes(typeof candidate) || candidate === null,
    ),
  ) as MementoReferenceValue['data'];
}

function normalizeRefIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((candidate): candidate is string => typeof candidate === 'string');
}

function normalizeRow(row: unknown): MementoReferenceValue | null {
  if (!isRecord(row)) return null;

  const key = normalizeString(row.key);
  const domain = normalizeString(row.domain);
  const subdomain = normalizeString(row.subdomain);
  const label = normalizeString(row.label);
  const year = normalizeNumber(row.year);
  const displayOrder = normalizeNumber(row.display_order);

  if (!key || !domain || !subdomain || !label || year === null || displayOrder === null) {
    return null;
  }

  return {
    key,
    domain,
    subdomain,
    label,
    value_numeric: normalizeNumber(row.value_numeric),
    value_text: normalizeString(row.value_text),
    unit: normalizeUnit(row.unit),
    year,
    data: normalizeData(row.data),
    ref_ids: normalizeRefIds(row.ref_ids),
    display_order: displayOrder,
    note: normalizeString(row.note),
    updated_at: normalizeString(row.updated_at),
  };
}

function toPayload(value: MementoReferenceValue): MementoReferenceValueDraft {
  return {
    key: value.key,
    domain: value.domain,
    subdomain: value.subdomain,
    label: value.label,
    value_numeric: value.value_numeric,
    value_text: value.value_text,
    unit: value.unit,
    year: value.year,
    data: value.data,
    ref_ids: value.ref_ids,
    display_order: value.display_order,
    note: value.note,
  };
}

export function invalidateMementoReferenceValuesCache(): void {
  cache = null;
  fetchedAt = null;
}

export function broadcastMementoReferenceValuesInvalidation(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(INVALIDATION_EVENT));
}

export function subscribeMementoReferenceValuesInvalidation(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(INVALIDATION_EVENT, listener);
  return () => window.removeEventListener(INVALIDATION_EVENT, listener);
}

export async function getMementoReferenceValues(options?: {
  force?: boolean;
}): Promise<MementoReferenceValue[]> {
  if (!options?.force && isFresh() && cache) return cache.map(cloneValue);

  let result: {
    data: unknown[] | null;
    error: { message?: string } | null;
  };

  try {
    result = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order('display_order', { ascending: true });
  } catch {
    return cache?.map(cloneValue) ?? fallbackValues();
  }

  const { data, error } = result;

  if (error) return cache?.map(cloneValue) ?? fallbackValues();

  const rows = ((data ?? []) as unknown[])
    .map(normalizeRow)
    .filter((row): row is MementoReferenceValue => row !== null);
  cache = rows.length > 0 ? sortMementoReferenceValues(rows) : fallbackValues();
  fetchedAt = Date.now();

  return cache.map(cloneValue);
}

export async function upsertMementoReferenceValues(
  values: readonly MementoReferenceValue[],
): Promise<void> {
  const payload = values.map(toPayload);
  const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: 'key' });

  if (error) {
    throw new Error("Erreur lors de l'enregistrement des valeurs du mémento.");
  }

  cache = sortMementoReferenceValues(values.map(cloneValue));
  fetchedAt = Date.now();
}
