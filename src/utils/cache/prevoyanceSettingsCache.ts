import { supabase } from '../../supabaseClient';
import {
  prevoyanceMaintienEmployeurSettingsSchema,
  prevoyanceRegimeSettingsSchema,
} from '../../domain/prevoyance/schema';
import type {
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '../../domain/prevoyance/types';

const REGIME_TABLE = 'prevoyance_regime_settings';
const MAINTIEN_TABLE = 'prevoyance_maintien_employeur_settings';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface PrevoyanceRegimeRow {
  code: string;
  label: string;
  caisse: string;
  population: PrevoyanceRegimeSettings['population'];
  default_contract_kind: PrevoyanceRegimeSettings['defaultContractKind'];
  year: number;
  data: unknown;
  sources: unknown;
  updated_at: string | null;
}

interface PrevoyanceMaintienRow {
  code: string;
  label: string;
  year: number;
  data: unknown;
  sources: unknown;
  updated_at: string | null;
}

let regimeCache: PrevoyanceRegimeSettings[] | null = null;
let maintienCache: PrevoyanceMaintienEmployeurSettings[] | null = null;
let regimeFetchedAt = 0;
let maintienFetchedAt = 0;

function isFresh(fetchedAt: number, cache: unknown): boolean {
  return cache !== null && Date.now() - fetchedAt < CACHE_TTL_MS;
}

function mapRegimeRow(row: PrevoyanceRegimeRow): PrevoyanceRegimeSettings | null {
  const parsed = prevoyanceRegimeSettingsSchema.safeParse({
    code: row.code,
    label: row.label,
    caisse: row.caisse,
    population: row.population,
    defaultContractKind: row.default_contract_kind,
    year: row.year,
    data: row.data,
    sources: row.sources,
    updatedAt: row.updated_at,
  });

  return parsed.success ? parsed.data : null;
}

function mapMaintienRow(row: PrevoyanceMaintienRow): PrevoyanceMaintienEmployeurSettings | null {
  const parsed = prevoyanceMaintienEmployeurSettingsSchema.safeParse({
    code: row.code,
    label: row.label,
    year: row.year,
    data: row.data,
    sources: row.sources,
    updatedAt: row.updated_at,
  });

  return parsed.success ? parsed.data : null;
}

export async function getPrevoyanceRegimeSettings(): Promise<PrevoyanceRegimeSettings[]> {
  if (isFresh(regimeFetchedAt, regimeCache) && regimeCache) return regimeCache;

  const { data, error } = await supabase
    .from(REGIME_TABLE)
    .select(
      'code, label, caisse, population, default_contract_kind, year, data, sources, updated_at',
    )
    .order('label', { ascending: true });

  if (error) return regimeCache ?? [];

  regimeCache = ((data ?? []) as PrevoyanceRegimeRow[])
    .map(mapRegimeRow)
    .filter((row): row is PrevoyanceRegimeSettings => row !== null);
  regimeFetchedAt = Date.now();
  return regimeCache;
}

export async function getPrevoyanceMaintienEmployeurSettings(): Promise<
  PrevoyanceMaintienEmployeurSettings[]
> {
  if (isFresh(maintienFetchedAt, maintienCache) && maintienCache) return maintienCache;

  const { data, error } = await supabase
    .from(MAINTIEN_TABLE)
    .select('code, label, year, data, sources, updated_at')
    .order('label', { ascending: true });

  if (error) return maintienCache ?? [];

  maintienCache = ((data ?? []) as PrevoyanceMaintienRow[])
    .map(mapMaintienRow)
    .filter((row): row is PrevoyanceMaintienEmployeurSettings => row !== null);
  maintienFetchedAt = Date.now();
  return maintienCache;
}

export async function upsertPrevoyanceRegimeSettings(
  regime: PrevoyanceRegimeSettings,
): Promise<void> {
  const parsed = prevoyanceRegimeSettingsSchema.parse(regime);
  const { error } = await supabase.from(REGIME_TABLE).upsert(
    {
      code: parsed.code,
      label: parsed.label,
      caisse: parsed.caisse,
      population: parsed.population,
      default_contract_kind: parsed.defaultContractKind,
      year: parsed.year,
      data: parsed.data,
      sources: parsed.sources,
    },
    { onConflict: 'code' },
  );

  if (error) throw new Error(`[prevoyanceSettingsCache] upsert régime: ${error.message}`);
  invalidatePrevoyanceSettingsCache();
}

export async function upsertPrevoyanceMaintienEmployeurSettings(
  maintien: PrevoyanceMaintienEmployeurSettings,
): Promise<void> {
  const parsed = prevoyanceMaintienEmployeurSettingsSchema.parse(maintien);
  const { error } = await supabase.from(MAINTIEN_TABLE).upsert(
    {
      code: parsed.code,
      label: parsed.label,
      year: parsed.year,
      data: parsed.data,
      sources: parsed.sources,
    },
    { onConflict: 'code' },
  );

  if (error) throw new Error(`[prevoyanceSettingsCache] upsert maintien: ${error.message}`);
  invalidatePrevoyanceSettingsCache();
}

export function invalidatePrevoyanceSettingsCache(): void {
  regimeCache = null;
  maintienCache = null;
  regimeFetchedAt = 0;
  maintienFetchedAt = 0;
}
